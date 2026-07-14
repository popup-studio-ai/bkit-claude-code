# Design — Stop Hook stdin-block (Issue #139)

- **Feature**: `stop-hook-stdin-block-139` · **Target**: bkit v2.1.30
- **Approach**: Hybrid (chosen at Design checkpoint) — central sync parse-early for
  all hooks + async hard-timeout for the turn-gating Stop hook + non-CPU lock backoff.

## 0. Reproduction ledger (evidence the design is built on)

| # | Scenario | Current `readFileSync(0)` | Sync parse-early | Async parse-early + hard-timeout |
|---|---|---|---|---|
| T1 | stdin closed immediately (normal) | 0.19 s | 0 ms | 14 ms |
| T2 | **payload sent, pipe held open 5 s (the reproduced #139 case)** | **~5 s (→15.5 min in prod)** | **1 ms** | 14 ms |
| T3 | no data, pipe held open 5 s | ~5 s | ~5 s (blocking syscall) | 1502 ms (hard cap) |
| T4 | 200 KB multi-chunk, held open 3 s | ~3 s | 2 ms | 14 ms |
| T5 | truncated JSON, held open 5 s | ~5 s | ~5 s | 1502 ms (hard cap) |

**Process-exit trap (verified)**: with the async event-based reader, resolving the
payload via parse-early is *not enough* — the open `process.stdin` handle keeps the
event loop alive until EOF (process lingers 4885 ms in test). The reader MUST
`process.stdin.destroy()` on resolve (process then exits at 15 ms). The sync
`fs.readSync` path uses a raw fd (no libuv stream handle) and exits promptly (8 ms)
without any cleanup — verified.

## 1. Change 1 — `lib/core/io.js` `readStdinSync()` → bounded parse-early (central)

Protects **all 36 hook scripts** at once.

```js
function readStdinSync() {
  const deadline = Date.now() + STDIN_READ_TIMEOUT_MS;   // env-overridable
  const CHUNK = 65536;
  let buf = Buffer.alloc(0);
  const tmp = Buffer.alloc(CHUNK);
  try {
    while (true) {
      // parse-early: return the instant the buffer holds a complete JSON value —
      // never wait for EOF (the EOF-wait is the #139 stall).
      if (buf.length > 0) {
        try { return JSON.parse(buf.toString('utf8')); } catch (_) { /* need more */ }
      }
      if (Date.now() > deadline) break;          // best-effort bound between reads
      let n = 0;
      try {
        n = fs.readSync(0, tmp, 0, CHUNK, null);
      } catch (e) {
        if (e.code === 'EAGAIN') continue;        // non-blocking fd, retry
        if (e.code === 'EOF') { n = 0; }          // some platforms surface EOF as throw
        else throw e;
      }
      if (n === 0) break;                          // real EOF
      buf = Buffer.concat([buf, tmp.slice(0, n)]);
    }
    return JSON.parse(buf.toString('utf8'));       // final attempt (empty → throws → {})
  } catch (e) {
    getDebug().debugLog('io', 'readStdinSync parse failure', {
      error: e && e.message, strict: process.env.BKIT_STRICT_STDIN === '1',
    });
    if (process.env.BKIT_STRICT_STDIN === '1') throw e;
    return {};
  }
}
```

**Contract preserved**: empty stdin → `JSON.parse('')` throws → `{}`; malformed →
debugLog + `{}` (or rethrow under `BKIT_STRICT_STDIN`). Return value identical for
every normal payload. The only behavioral change is that a valid payload returns
*before* EOF instead of *after* — which is exactly the fix.

**Residual (accepted, documented)**: the sync deadline is best-effort — it is only
checked *between* blocking `readSync` calls, so a truly empty-but-held-open pipe
(T3) or truncated-then-held pipe (T5) can still block inside one `readSync` until
EOF. This is why the turn-gating Stop hook additionally gets Change 2. All 35 other
hooks accept this residual (their payloads are always present in practice, and CC's
own per-hook timeout is the outer bound).

## 2. Change 2 — `scripts/unified-stop.js` → async hard-timeout read (defense-in-depth)

New export in `io.js`:

```js
function readStdinBounded(timeoutMs) {
  return new Promise((resolve) => {
    let data = '', done = false;
    const cleanup = () => {
      clearTimeout(timer);
      try { process.stdin.pause(); } catch (_) {}
      process.stdin.removeAllListeners('data');
      process.stdin.removeAllListeners('end');
      process.stdin.removeAllListeners('error');
      try { process.stdin.destroy(); } catch (_) {}   // release handle → prompt exit
    };
    const finish = (v) => { if (done) return; done = true; cleanup(); resolve(v); };
    const timer = setTimeout(() => {
      getDebug().debugLog('io', 'readStdinBounded hard timeout', { timeoutMs, bytes: data.length });
      try { finish(JSON.parse(data)); } catch (_) { finish({}); }
    }, timeoutMs != null ? timeoutMs : STDIN_READ_TIMEOUT_MS);
    if (timer.unref) timer.unref();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => { data += c; try { finish(JSON.parse(data)); } catch (_) {} });
    process.stdin.on('end', () => { try { finish(JSON.parse(data)); } catch (_) { finish({}); } });
    process.stdin.on('error', () => finish({}));
  });
}
```

`unified-stop.js` wraps its body in an async IIFE and awaits the bounded read at the
top (the read is the first operation, so the event loop is free for the timer to
fire). Everything after the read stays synchronous inside the async function —
minimal structural change, no logic change. This makes the Stop hook unable to
exceed `STDIN_READ_TIMEOUT_MS` even for T3/T5.

## 3. Change 3 — `lib/core/state-store.js` `lock()` → non-CPU backoff

Replace the CPU-burning busy-wait spin with a real synchronous sleep via
`Atomics.wait` (portable, Node ≥ 8.10, no native deps, no CPU burn):

```js
// was: const waitUntil = Date.now() + LOCK_RETRY_INTERVAL_MS;
//      while (Date.now() < waitUntil) { /* spin */ }
sleepSync(LOCK_RETRY_INTERVAL_MS);   // Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
```

Same wall-clock bound (~5 s worst case per lock), but it no longer pins a CPU core
while waiting — addressing the issue's "lock-wait / retry-without-backoff" note for
the ~4 `lockedUpdate` calls in the Stop chain.

## 4. Change 4 — `lib/core/constants.js`

Add to the I/O section:

```js
/** Bounded stdin read timeout (ms) — env override: BKIT_STDIN_TIMEOUT_MS */
const STDIN_READ_TIMEOUT_MS = Number(process.env.BKIT_STDIN_TIMEOUT_MS) > 0
  ? Number(process.env.BKIT_STDIN_TIMEOUT_MS)
  : 2000;
```

2000 ms is ~2.5× the observed healthy average (0.8 s) yet well under both bkit's
`HOOK_TIMEOUT_MS` (5000) and CC's Stop-hook `timeout` (10000), so bkit bounds the
read before either outer timeout can fire.

## 5. Regression tests (`test/regression/issue-139-stdin-bounded.test.js`)

1. `readStdinSync` returns a valid payload immediately when the writer holds the
   pipe open (asserts elapsed ≪ held-open duration).
2. `readStdinSync` empty stdin → `{}`; malformed → `{}` (contract preserved).
3. `readStdinBounded` resolves via parse-early on payload; resolves via hard timeout
   (bounded) on no-data / truncated input; destroys stdin so the process can exit.
4. `state-store` `lock()`/`lockedUpdate` still serialize concurrent writers and the
   spin was replaced (no busy-wait token present in source).
5. Live: `node scripts/unified-stop.js` with a held-open pipe returns bounded.

## 6. Out of scope (justified)

- `scripts/lint-skill-md.js:26` raw `fs.readFileSync(0)` — reads a **markdown file
  via stdin redirect** (not a hook JSON payload, not a held-open pipe); not
  vulnerable. Left unchanged to avoid scope creep.
- Making Stop sub-handlers fire-and-forget — the confirmed cause is stdin blocking,
  not sub-handler cost (normal run 0.19 s). Not needed.

## 7. Architecture-count impact

None. All changes are internal to existing lib modules / one script. Skills 44 ·
Agents 34 · Hooks 22 ev / 25 blk · Lib 195 modules remain **invariant** (to be
verified by docs-code-sync in QA).
