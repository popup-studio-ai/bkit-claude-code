# QA Report — Stop Hook stdin-block (Issue #139)

- **Feature**: `stop-hook-stdin-block-139` · **Target**: bkit v2.1.30
- **Verdict**: **PASS** — root cause fixed & reproduced, all gates green, 0 new regressions.

## 1. Reproduction (before → after)

| Scenario | Before (`readFileSync(0)`) | After |
|---|---|---|
| Normal (stdin closed) | 0.19 s | 0.17 s |
| Payload + pipe held open (the #139 case) | ~held-duration (→ 15.5 min prod) | **~1 ms parse / ~374 ms hook** |
| No-data + pipe held open | ~held-duration | ~2.0 s hard cap (bounded) |
| Truncated + pipe held open | ~held-duration | ~2.0 s hard cap (bounded) |

## 2. Functional / regression tests

| Suite | Result |
|---|---|
| `test/regression/issue-139-stdin-bounded.test.js` (new, 16 TC) | 16/16 PASS (stable over 5 runs) |
| contract L1+L4 vs v2.1.9 / v2.1.16 | 222 / 243 assertions PASS |
| integration-runtime | 23/23 |
| l2-smoke | 105/105 |
| l2-hook-attribution (Stop turn recording) | 13/13 |
| l3-mcp-compat / l3-mcp-runtime | 92/92 · 48/48 |
| hooks-22 (hook wiring + JS syntax) | 25/25 |
| hook-cold-start / hook-real-execution | PASS · 8/8 |
| state-store-perf (lock backoff) | 15/15 |
| invocation-inventory | 213/213 |

## 3. Release gates

| Gate | Result |
|---|---|
| check-domain-purity | OK (18 files, 0 forbidden) |
| check-deadcode | 0 new dead code |
| docs-code-sync (+ .test) | PASS · 36/36 |
| check-guards | 24 guards, 0 warn |
| check-test-tracking | 346 files, 0 untracked |
| validate-plugin --strict | 0 errors, 0 warnings |
| bkit-full-system (version sync v2.1.30 × 7 files) | 36 PASS / 0 FAIL |

## 4. Zero-regression proof

`qa-aggregate` reports 13 failing files — **identical** to the `main` baseline.
The 3 `state-store`-dependent unit tests (audit-logger AL-007, loop-breaker LB-013,
trust-engine TE-001/TE-025) were run on clean `main` via `git stash` and fail
**identically** there — pre-existing stale-count / logic assertions, not caused by
this change.

## 5. Live verification

`claude -p --plugin-dir .` on Claude Code **v2.1.208** → returned `PONG` in 5.65 s
total; the `Stop` hook (now `readStdinBounded`) fired at turn end without stalling.

## 6. Residual / accepted

The sync `readStdinSync` cannot hard-bound a no-data / truncated + held-open pipe
(blocking syscall); this is covered for the turn-gating Stop hook by
`readStdinBounded`, and the other 35 hooks' payloads are always present in practice
(CC's own per-hook timeout is the outer bound). Documented in the design.
