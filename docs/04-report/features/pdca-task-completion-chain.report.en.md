# Completion Report — PDCA Predecessor-Task Completion Chain (issue #137, v2.1.29)

## Executive Summary

| Perspective | Value Delivered |
|---|---|
| **Problem** | `pdca` created a `blockedBy` Task chain but never completed predecessors → stale phase leaked into prompt context, contradicting `pdca-status.json`. |
| **Solution** | Deterministic SKILL.md prose fix: every phase action completes predecessor Task(s) before creating the next; centralized Phase Transition Rule; regression-guarded. |
| **Function/UX Effect** | CC task list and `pdca-status.json` now agree; no stale phase signal after advancing. |
| **Core Value** | Removed a confusing two-sources-of-truth discrepancy at zero functional/architecture risk. |

## What changed

- `skills/pdca/SKILL.md` — completion step added to `plan`/`design`/`do`/`analyze`/`iterate`/`qa`/`report` actions and terminal completion to `archive`; new `### Phase Transition Rule (task completion)` subsection under `## Task Integration`.
- `test/regression/issue-137-predecessor-task-completion.test.js` — 25-assertion guard.
- Version bump 2.1.28 → 2.1.29 (bkit.config.json canonical, plugin.json, marketplace.json ×2 + description, hooks.json, session-start.js, session-context.js, README badge + latest-release) + CHANGELOG `## [2.1.29]`.
- Bilingual PDCA docs (plan, design, analysis, report).

## Key decisions & outcomes

| Decision | Rationale | Outcome |
|---|---|---|
| Option 1 (SKILL.md prose), not Option 2 (hook auto-complete) | CC hooks cannot mutate Task state (stdout/exit-code/additionalContext only; only the model calls `TaskUpdate`) — confirmed against official CC hooks guide. Any hook approach still needs the model to act, so it is no more deterministic and noisier. | Deterministic fix, no new runtime surface, no dead code. |
| General "complete all prior in_progress phase Tasks" wording | Robust across the branching `qa`/`act` parts of the 9-phase lifecycle. | Single rule covers every transition. |
| Scope limited to `pdca` | Related skills carry no multi-phase `blockedBy` chain (plan-plus single Task, cc-version-analysis subtask tracking, sprint per-feature). | No collateral changes. |

## Verification

- All static + contract gates green; zero new regressions vs `main` (identical failing-file set).
- Live QA via fresh `claude -p --plugin-dir .` confirms the fix loads and is model-readable.

## Success criteria — final status

- SC1 predecessor-completion step per advancing action: ✅ Met
- SC2 Phase Transition Rule documented: ✅ Met
- SC3 regression test passes/guards: ✅ Met (25/25)
- SC4 CI gates green: ✅ Met
- SC5 live plugin load 0 errors: ✅ Met

**Overall: 5/5 criteria met.**

## Lessons learned

- Before adopting a reporter's suggested hook-based fix, verify the hook capability against official docs — here it disqualified Option 2 outright and made the "cheaper" Option 1 the strictly-better choice.
- Model-facing skill prose is a legitimate, testable fix surface: a contract-style regression test over SKILL.md keeps prose fixes from silently regressing.
