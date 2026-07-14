# Plan — Stop Hook stdin-block (Issue #139)

- **Feature**: `stop-hook-stdin-block-139`
- **Target bkit version**: v2.1.30
- **Source**: GitHub Issue [#139](https://github.com/popup-studio-ai/bkit-claude-code/issues/139) (@thenopen, found via Claude Code `/doctor` health-check)
- **Branch**: `feat/v2.1.30-issue-139` (from `main` @ `76bd1af` = v2.1.29)

## 1. Problem statement

The `Stop` event hook (`scripts/unified-stop.js`, wired in `hooks/hooks.json` with
`timeout: 10000`) occasionally stalls far beyond its own 10 s timeout.

Aggregate evidence from the reporter (~50 sessions / 5-day window, pulled from
Claude Code transcript hook-attachment records):

| Metric | Value |
|---|---|
| Stop hook invocations | 2,223 |
| Average duration | ~0.8 s (healthy) |
| **Max duration** | **928,551 ms (~15.5 min)** |
| Timeout-cancellations (`timedOut: true`, `timeoutMs: 10000`) | 14 |

Because Stop hooks gate turn completion, every stall blocks the end of a turn for
its full duration.

## 2. Root cause (confirmed by reproduction — not speculation)

`lib/core/io.js` → `readStdinSync()` reads the hook payload with:

```js
const input = fs.readFileSync(0, 'utf8');
```

`fs.readFileSync(0)` is a **blocking read on stdin (fd 0) with no timeout**. It does
not return until stdin reaches EOF — i.e. until Claude Code closes the write end of
the hook's stdin pipe. If CC keeps that write end open (busy, backpressure, or
delayed close), the hook blocks for exactly that long.

**Reproduction** (`node scripts/unified-stop.js`, real hook):

| Condition | Wall time | user CPU |
|---|---|---|
| stdin closed immediately (normal) | 0.19 s | 0.19 s |
| writer holds stdin pipe open 4 s after sending payload | **4.07 s** | 0.19 s |

The `user` CPU stays flat at 0.19 s while wall time tracks the held-open duration —
proving the process is **blocked on I/O**, not burning CPU. This matches the issue's
profile exactly: healthy average, extreme tail, low CPU (occasional blocking I/O
wait rather than a consistent perf regression).

## 3. Blast radius (Rule 4 — related & similar code)

`readStdinSync()` is called by **36 files** — effectively every bkit hook script
(`unified-stop`, `skill-post`, `unified-bash-pre/post`, `unified-write-post`,
`user-prompt-handler`, `session-end-handler`, every `*-stop.js`, …). The issue is
filed against `unified-stop.js`, but the defect lives in the **shared** function.
Therefore a **single central fix in `io.js` protects every hook event**
(PreToolUse, PostToolUse, Stop, SessionEnd, …), not just Stop.

One additional raw occurrence: `scripts/lint-skill-md.js:26` uses
`fs.readFileSync(0)` directly, but it is a CI/dev lint tool, not a runtime hook
(lower priority; addressed for consistency).

## 4. Secondary contributor (code-confirmed; not the 15-min cause)

`lib/core/state-store.js` `lock()` (lines ~158-160) implements retry via a
**CPU-burning synchronous busy-wait spin**:

```js
const waitUntil = Date.now() + LOCK_RETRY_INTERVAL_MS;
while (Date.now() < waitUntil) { /* spin */ }
```

Constants (`lib/core/constants.js`): `LOCK_TIMEOUT_MS=5000`, `LOCK_STALE_MS=10000`,
`LOCK_RETRY_INTERVAL_MS=100`, `LOCK_MAX_RETRIES=50`. A single `lock()` is bounded to
~5 s, so it cannot by itself explain 15 min — but under contention across the ~4
`lockedUpdate` calls in the Stop chain (checkpoint-manager, metrics-collector,
trust-engine, automation-controller) it pins a CPU core and adds latency. This
directly matches the issue's "lock-wait / retry-without-backoff" suspicion and is a
worthwhile hardening.

## 5. Goals & non-goals

**Goals**
- The Stop hook (and every bkit hook) must never block indefinitely on stdin.
- The reproduced case (payload sent, pipe held open) must resolve in ~ms.
- Preserve the exact return contract of `readStdinSync()` (parse failure → `{}`
  unless `BKIT_STRICT_STDIN=1` rethrows; debugLog on failure).
- Zero new CI regressions; live verification via `--plugin-dir .`.

**Non-goals**
- Rewriting the Stop sub-handler pipeline to be fully async/fire-and-forget (the
  confirmed cause is stdin blocking, not sub-handler cost). Optional instrumentation
  only.
- Version release without explicit user approval (Rule 11).

## 6. Acceptance criteria

1. Valid payload + delayed EOF (pipe held open) → hook returns immediately (~ms),
   verified by regression test and live reproduction (before/after timing).
2. All 36 hooks continue to parse normal payloads and dispatch handlers identically.
3. Full CI gate suite green with zero new failures vs. `main` baseline.
4. Docs = Code synced; version bumped 2.1.29 → 2.1.30 across the canonical surface.

## 7. Rollout

Single branch, single commit (minimize GitHub Actions cost), PR → CI monitor →
**user-approval gate** → merge → tag `v2.1.30` → GitHub Release (EN) → answer &
close #139.
