# Gap Analysis — Stop Hook stdin-block (Issue #139)

- **Feature**: `stop-hook-stdin-block-139` · **Target**: bkit v2.1.30
- **Match rate**: **100%** (every design item implemented and verified)

## Design → Implementation traceability

| # | Design item | Implementation | Verified |
|---|---|---|---|
| C1 | `readStdinSync()` bounded parse-early (central, 36 hooks) | `lib/core/io.js` `readStdinSync()` rewritten: incremental `fs.readSync` + parse-early + deadline | ✅ 15.5 min → ~1 ms (real hook); contract preserved (empty/malformed → `{}`) |
| C2 | Async hard-timeout reader for the Stop hook | `lib/core/io.js` `readStdinBounded()` (parse-early + hard timeout + `process.stdin.destroy()`); `scripts/unified-stop.js` awaits it in an async IIFE | ✅ no-data/truncated held-open bounded ~2 s; unified-stop ~374 ms vs 8 s held pipe |
| C3 | Non-CPU lock backoff | `lib/core/state-store.js` `sleepSync()` via `Atomics.wait`; `lock()` spin replaced | ✅ sleepSync(300)=305 ms; `lockedUpdate` still serializes (counter=20); state-store-perf 15/15 |
| C4 | `STDIN_READ_TIMEOUT_MS` constant + env override | `lib/core/constants.js` (default 2000, `BKIT_STDIN_TIMEOUT_MS`) | ✅ loads = 2000; exported |
| C5 | Regression tests | `test/regression/issue-139-stdin-bounded.test.js` (16 TC) | ✅ 16/16, stable across 5 runs |
| — | Central re-export | `lib/core/index.js` exposes `readStdinBounded` | ✅ deadcode 0-new |

## Deviations from design

None. Two design-time findings were confirmed during implementation and handled
exactly as the design specified:

1. **Process-exit trap** (async path): parse-early alone lets the process linger
   until EOF because the open `process.stdin` handle keeps the event loop alive
   (measured 4885 ms). Resolved by `process.stdin.destroy()` on resolve (→ 15 ms).
   The sync `fs.readSync` path was verified to exit promptly without cleanup (raw
   fd, no stream handle).
2. **Sync residual** (documented, accepted): the sync deadline is best-effort
   (checked only between blocking reads), so a no-data / truncated + held-open pipe
   is not hard-bounded by the sync reader — which is exactly why the turn-gating
   Stop hook additionally uses `readStdinBounded` (C2).

## Contract & regression safety

- `readStdinSync()` return contract byte-for-byte preserved for all normal payloads
  and for empty/malformed input; the only behavioral change is returning *before*
  EOF instead of *after*.
- Zero new regressions vs `main`: the 13 qa-aggregate failing files are identical
  to the baseline, and the 3 `state-store`-dependent unit tests
  (audit-logger AL-007, loop-breaker LB-013, trust-engine TE-001/025) fail
  identically on clean `main` (stale-count / logic assertions unrelated to this fix).

## Architecture impact

None. 44 Skills · 34 Agents · 22 Hook Events / 25 blocks · 195 Lib Modules —
invariant (internal changes to existing modules + one new test file).
