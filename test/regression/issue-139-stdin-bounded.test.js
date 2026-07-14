#!/usr/bin/env node
'use strict';
/**
 * issue-139-stdin-bounded.test.js — Regression guard for GitHub #139.
 *
 * Placed under test/regression/ alongside issue-118/119/129/130/132 so the
 * issue-specific bug cannot recur silently.
 *
 * Bug: hooks read their payload via lib/core/io.js readStdinSync(), which used
 * `fs.readFileSync(0, 'utf8')` — a blocking read on stdin with NO timeout. It
 * does not return until stdin reaches EOF, i.e. until Claude Code closes the
 * hook's stdin write-end. When CC keeps that write-end open, the hook stalls for
 * exactly that long. The Stop hook (scripts/unified-stop.js) gates turn
 * completion, so the reporter observed stalls up to ~15.5 min (far past the
 * hook's own 10 s timeout) via `/doctor`.
 *
 * Fix (bkit v2.1.30):
 *  - io.js readStdinSync(): incremental fs.readSync + parse-early — returns the
 *    instant the buffer holds valid JSON, never waiting for EOF (central; all
 *    36 hook scripts). Raw fd → the process exits promptly with no cleanup.
 *  - io.js readStdinBounded(): async parse-early + hard timeout that destroys
 *    stdin on resolve — fully bounds the turn-gating Stop hook even for
 *    no-data / truncated payloads while the pipe is held open.
 *  - unified-stop.js: reads via readStdinBounded inside an async IIFE.
 *  - state-store.js lock(): busy-wait spin → Atomics.wait sleep (no CPU burn).
 *
 * Verified end-to-end against REAL subprocesses (a writer that holds the stdin
 * write-end open, simulating CC's delayed close):
 *  1. readStdinSync returns a valid payload immediately despite a held-open pipe.
 *  2. readStdinSync contract preserved: empty → {}, malformed → {}.
 *  3. readStdinBounded is hard-bounded on no-data / truncated held-open input,
 *     and its process exits promptly (stdin destroyed).
 *  4. unified-stop.js does not stall on a held-open pipe and stays bounded.
 *  5. Source guards: the unbounded fs.readFileSync(0) and the lock busy-wait
 *     spin must not reappear.
 */
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..', '..');
const IO = path.join(REPO, 'lib', 'core', 'io.js');
const STATE_STORE = path.join(REPO, 'lib', 'core', 'state-store.js');
const UNIFIED_STOP = path.join(REPO, 'scripts', 'unified-stop.js');

let pass = 0, fail = 0;
const failures = [];
function tc(name, cond, detail) {
  if (cond) { pass++; console.log(`  PASS: ${name}`); }
  else { fail++; failures.push(`${name}${detail ? ' :: ' + detail : ''}`); console.error(`  FAIL: ${name}`); }
}

// The generous held-open window the writer keeps the stdin pipe open. If the fix
// works, the child exits FAR sooner (parse-early ~ms, or the ~2 s hard cap). If
// the bug regresses, the child blocks until this window closes.
const HOLD_MS = 6000;
// Safety net: if the child truly hangs, force-close/kill after this and mark it
// as a stall. Set above the ~2 s hard cap but below HOLD_MS so a bounded child
// still exits on its own first.
const SAFETY_MS = 4500;

/**
 * Spawn `node <args>`, write `payload` to its stdin, then KEEP the write-end
 * open for HOLD_MS (simulating CC not closing stdin promptly). Resolves when the
 * child exits on its own, recording elapsed ms; or forces it down at SAFETY_MS
 * and marks `hung: true`.
 */
function runHeldOpen(args, payload) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const child = spawn('node', args, { cwd: REPO, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '';
    let settled = false;
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });

    const holdTimer = setTimeout(() => {
      try { child.stdin.end(); } catch (_) { /* ignore */ }
    }, HOLD_MS);
    if (holdTimer.unref) holdTimer.unref();

    const safety = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { child.stdin.end(); } catch (_) { /* ignore */ }
      try { child.kill('SIGKILL'); } catch (_) { /* ignore */ }
      clearTimeout(holdTimer);
      resolve({ code: null, ms: Date.now() - t0, out, err, hung: true });
    }, SAFETY_MS);
    if (safety.unref) safety.unref();

    child.on('exit', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(holdTimer);
      clearTimeout(safety);
      resolve({ code, ms: Date.now() - t0, out, err, hung: false });
    });
    child.on('error', () => {
      if (settled) return;
      settled = true;
      clearTimeout(holdTimer);
      clearTimeout(safety);
      resolve({ code: null, ms: Date.now() - t0, out, err, hung: true });
    });

    // stdin.on('error') guards against EPIPE once the child destroys its read-end.
    child.stdin.on('error', () => { /* ignore EPIPE after child exits */ });
    if (payload != null) {
      try { child.stdin.write(payload); } catch (_) { /* ignore */ }
    }
    // Intentionally DO NOT call child.stdin.end() here — the pipe stays open.
  });
}

/**
 * Spawn `node <args>` with `input` and let stdin reach EOF immediately (normal
 * close). Returns the captured stdout. Used for the readStdinSync return-value
 * contract, which is about the parsed result under a normal (closed) stdin — the
 * held-open bounding of no-data/malformed input is the async reader's job (the
 * sync reader's deadline is best-effort and cannot interrupt a blocking read).
 */
function runClosed(args, input) {
  const r = spawnSync('node', args, {
    cwd: REPO, stdio: ['pipe', 'pipe', 'pipe'],
    input: input == null ? '' : input, timeout: 10000,
  });
  return { out: (r.stdout || '').toString(), status: r.status };
}

/** Strip block + line comments so source guards match CODE, not the doc
 * comments that intentionally name the old anti-patterns. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const PAYLOAD = JSON.stringify({
  session_id: 'issue-139',
  message: { model: 'claude-opus-4-8', usage: { input_tokens: 10, output_tokens: 5 } },
});

// Tiny inline harnesses that exercise the io functions and print the parsed keys.
const SYNC_HARNESS =
  `const {readStdinSync}=require(${JSON.stringify(IO)});` +
  `const o=readStdinSync();process.stdout.write('KEYS:'+Object.keys(o||{}).join(','));`;
const BOUNDED_HARNESS =
  `const {readStdinBounded}=require(${JSON.stringify(IO)});` +
  `readStdinBounded().then(o=>{process.stdout.write('KEYS:'+Object.keys(o||{}).join(','));});`;

(async () => {
  // --- 1. readStdinSync: valid payload returned immediately despite held pipe ---
  {
    const r = await runHeldOpen(['-e', SYNC_HARNESS], PAYLOAD);
    tc('readStdinSync returns valid payload without waiting for EOF (held-open pipe)',
      !r.hung && r.ms < HOLD_MS - 1000 && /KEYS:.*session_id/.test(r.out) && /message/.test(r.out),
      `hung=${r.hung} ms=${r.ms} out=${r.out.slice(0, 120)}`);
    tc('readStdinSync child process exits promptly (raw fd, no lingering handle)',
      !r.hung && r.ms < 2000,
      `ms=${r.ms} (expected < 2000)`);
  }

  // --- 2. readStdinSync contract preserved: empty → {}, malformed → {} ----------
  // (return-value contract under a normal closed stdin; the held-open bounding of
  // such inputs is covered by readStdinBounded in section 3.)
  {
    const r = runClosed(['-e', SYNC_HARNESS], '');
    tc('readStdinSync empty stdin → {} (contract preserved)',
      r.status === 0 && /KEYS:$/.test(r.out.trim()),
      `status=${r.status} out=${JSON.stringify(r.out)}`);
  }
  {
    const r = runClosed(['-e', SYNC_HARNESS], '{ not valid json');
    tc('readStdinSync malformed → {} (contract preserved)',
      r.status === 0 && /KEYS:$/.test(r.out.trim()),
      `status=${r.status} out=${JSON.stringify(r.out)}`);
  }
  {
    const r = runClosed(['-e', SYNC_HARNESS], PAYLOAD);
    tc('readStdinSync normal closed stdin → parses payload',
      r.status === 0 && /KEYS:.*session_id/.test(r.out) && /message/.test(r.out),
      `status=${r.status} out=${r.out.slice(0, 120)}`);
  }

  // --- 3. readStdinBounded: parse-early + hard timeout, prompt exit -------------
  {
    const r = await runHeldOpen(['-e', BOUNDED_HARNESS], PAYLOAD);
    tc('readStdinBounded resolves via parse-early on payload (held-open pipe)',
      !r.hung && r.ms < HOLD_MS - 1000 && /KEYS:.*session_id/.test(r.out),
      `hung=${r.hung} ms=${r.ms} out=${r.out.slice(0, 120)}`);
  }
  {
    const r = await runHeldOpen(['-e', BOUNDED_HARNESS], ''); // no data, pipe held open
    tc('readStdinBounded is hard-bounded on no-data held-open pipe (exits, not hung)',
      !r.hung && r.ms < SAFETY_MS,
      `hung=${r.hung} ms=${r.ms} (expected bounded < ${SAFETY_MS})`);
  }
  {
    const r = await runHeldOpen(['-e', BOUNDED_HARNESS], '{"a":'); // truncated JSON, held open
    tc('readStdinBounded is hard-bounded on truncated held-open payload',
      !r.hung && r.ms < SAFETY_MS,
      `hung=${r.hung} ms=${r.ms} (expected bounded < ${SAFETY_MS})`);
  }

  // --- 4. unified-stop.js end-to-end: no stall on held-open pipe ----------------
  // The regression guarantee is "does not stall + exits cleanly". The exact
  // stdout is intentionally NOT asserted: unified-stop dispatches different Stop
  // sub-handlers depending on ambient PDCA state, so its output text is
  // environment-dependent — only bounded time + a clean exit are invariant.
  {
    const r = await runHeldOpen([UNIFIED_STOP], PAYLOAD);
    tc('unified-stop.js does not stall on held-open pipe (normal payload)',
      !r.hung && r.ms < HOLD_MS - 1000 && r.code === 0,
      `hung=${r.hung} ms=${r.ms} code=${r.code} out=${r.out.slice(0, 120)}`);
  }
  {
    const r = await runHeldOpen([UNIFIED_STOP], ''); // no data + held-open → hard cap
    tc('unified-stop.js stays bounded on no-data held-open pipe',
      !r.hung && r.ms < SAFETY_MS && r.code === 0,
      `hung=${r.hung} ms=${r.ms} code=${r.code} (expected bounded < ${SAFETY_MS})`);
  }

  // --- 5. SOURCE GUARDS: the unbounded read + busy-wait spin must not reappear --
  // Guards run against comment-stripped source so the doc comments that
  // intentionally name the old anti-patterns don't produce false positives.
  {
    const ioSrc = stripComments(fs.readFileSync(IO, 'utf8'));
    tc('io.js no longer uses the unbounded fs.readFileSync(0)',
      !/readFileSync\(\s*0\b/.test(ioSrc),
      'found fs.readFileSync(0 ...) in lib/core/io.js (code)');
    tc('io.js reads stdin incrementally via fs.readSync (parse-early)',
      /fs\.readSync\(\s*0\b/.test(ioSrc),
      'expected fs.readSync(0, ...) in lib/core/io.js');
    tc('io.js exports readStdinBounded',
      /readStdinBounded/.test(ioSrc),
      'expected readStdinBounded in lib/core/io.js');

    const usSrc = stripComments(fs.readFileSync(UNIFIED_STOP, 'utf8'));
    tc('unified-stop.js reads via the bounded reader',
      /readStdinBounded/.test(usSrc),
      'expected readStdinBounded in scripts/unified-stop.js');

    const ssSrc = stripComments(fs.readFileSync(STATE_STORE, 'utf8'));
    tc('state-store.js lock() no longer busy-waits (waitUntil spin removed)',
      !/while\s*\(\s*Date\.now\(\)\s*<\s*waitUntil\s*\)/.test(ssSrc),
      'found the busy-wait spin `while (Date.now() < waitUntil)` in state-store.js (code)');
    tc('state-store.js uses a non-CPU sleep (Atomics.wait via sleepSync)',
      /Atomics\.wait/.test(ssSrc) && /sleepSync/.test(ssSrc),
      'expected Atomics.wait-based sleepSync in state-store.js');
  }

  // ---------------------------------------------------------------------------
  console.log(`\n${pass} passed, ${fail} failed`);
  if (failures.length) {
    console.error('FAILURES:');
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  process.exit(0);
})();
