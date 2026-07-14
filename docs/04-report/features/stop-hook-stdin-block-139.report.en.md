# Completion Report — Stop Hook stdin-block (Issue #139)

- **Feature**: `stop-hook-stdin-block-139` · **Version**: bkit v2.1.30
- **Issue**: [#139](https://github.com/popup-studio-ai/bkit-claude-code/issues/139) (@thenopen, via Claude Code `/doctor`)
- **Branch**: `feat/v2.1.30-issue-139` · **Status**: implemented, QA-passed, awaiting user approval to merge/release

## Summary

The `Stop` hook occasionally stalled up to ~15.5 minutes — far past its own 10 s
timeout — blocking turn completion. Root cause (reproduced, not inferred): every
bkit hook reads its payload via `lib/core/io.js` `readStdinSync()`, which used
`fs.readFileSync(0)` — a blocking stdin read with **no timeout** that returns only
at EOF. When Claude Code keeps the hook's stdin write-end open, the hook blocks for
exactly that long.

The fix is central (one shared function → all 36 hooks) plus defense-in-depth for
the turn-gating Stop hook.

## What changed

| File | Change |
|---|---|
| `lib/core/io.js` | `readStdinSync()` → incremental `fs.readSync` + parse-early (returns before EOF); new `readStdinBounded()` async reader (parse-early + hard timeout + `stdin.destroy()`) |
| `scripts/unified-stop.js` | reads via `readStdinBounded` inside an async IIFE |
| `lib/core/state-store.js` | `lock()` busy-wait spin → `Atomics.wait` `sleepSync()` (no CPU burn) |
| `lib/core/constants.js` | new `STDIN_READ_TIMEOUT_MS` (2000 ms, env `BKIT_STDIN_TIMEOUT_MS`) |
| `lib/core/index.js` | re-export `readStdinBounded` |
| `test/regression/issue-139-stdin-bounded.test.js` | new 16-TC regression guard |

## User-facing outcome

- Turns no longer hang at their end because of a stalled Stop hook. Worst case for
  the Stop hook drops from ~15.5 min to a bounded ~2 s (normal case ~ms).
- The fix protects **all** bkit hook events, not only Stop — any hook that reads
  stdin is now resilient to a slow/held-open stdin close.
- No behavior change for normal payloads; no configuration required (the timeout is
  tunable via `BKIT_STDIN_TIMEOUT_MS` if ever needed).

## KPIs

- Match rate: **100%** (all design items implemented).
- Reproduced tail: **15.5 min → ~1 ms** (parse) / ~374 ms (full Stop hook).
- Regressions vs `main`: **0 new**.
- CI gates: **all green**; live `claude -p --plugin-dir .` on CC v2.1.208 OK.

## Lessons learned

1. A blocking `fs.readFileSync(0)` in a hook is an unbounded liability — the payload
   being present is not enough; waiting for EOF is the trap. Parse-early removes the
   EOF-wait entirely for the realistic case.
2. Async event-based reads must `destroy()` stdin on resolve, or the process lingers
   until EOF and the stall silently returns via process exit rather than the read.
3. A CPU-burning busy-wait "acceptable for short durations" still pins a core under
   contention; `Atomics.wait` is a drop-in, portable, no-CPU synchronous sleep.

## Follow-ups (not blocking)

- Consider routing `scripts/lint-skill-md.js`'s raw `fs.readFileSync(0)` through a
  shared bounded reader for consistency (not vulnerable today — reads a file via
  redirect).
- Hall of Fame / external-dogfood E2E absorption for @thenopen's `/doctor`-sourced
  report (same program as prior dogfooders).
