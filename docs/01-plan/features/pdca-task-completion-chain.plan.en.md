# Plan — PDCA Predecessor-Task Completion Chain (issue #137, v2.1.29)

## Executive Summary

| Perspective | Summary |
|---|---|
| **Problem** | The `pdca` skill creates a `blockedBy` chain of phase Tasks (`[Plan]→[Design]→[Do]→[Check]→…`) but never tells the model to mark the *predecessor* Task `completed` when advancing. Predecessor Tasks stay `in_progress`, and Claude Code's native task list leaks a stale phase (e.g. "design") into prompt context on every turn — disagreeing with the correct `.bkit/state/pdca-status.json` `phase` field. |
| **Solution** | Add an explicit "complete the predecessor phase Task" instruction to each `pdca` phase action immediately before it creates the next phase Task, and codify a Phase Transition Rule in the `## Task Integration` section. Deterministic, model-executed, no dead code. |
| **Function/UX Effect** | The CC task list and `pdca-status.json` agree at all times; users no longer see a stale phase signal after advancing. |
| **Core Value** | Two sources of truth that *should* agree now *do* agree, removing a confusing informational discrepancy at zero functional risk. |

## Context Anchor

| Key | Value |
|---|---|
| **WHY** | Stale `in_progress` predecessor Tasks leak an outdated phase into ambient prompt context, contradicting `pdca-status.json`. |
| **WHO** | Every bkit user running the `pdca` skill through more than one phase (i.e. all real PDCA usage). |
| **RISK** | Very low — the change is prose in one skill file + one regression test. No lib/hook behavior change. |
| **SUCCESS** | Each phase transition in `skills/pdca/SKILL.md` instructs completing the predecessor Task; a regression test enforces it; live plugin load stays clean. |
| **SCOPE** | `skills/pdca/SKILL.md` only. Related skills (plan-plus single `[Plan]` task, cc-version-analysis single task, sprint per-feature tasks) do not carry the multi-phase chain and are out of scope. |

## 1. Background / Reproduction

- Reporter: @hslee-cmyk (bkit v2.1.28, CC v2.1.199). Rated **low / cosmetic** — deferred severity to maintainer.
- Reproduced in-source: `grep` of `skills/pdca/SKILL.md` shows every action has `Create Task: [X] {feature}` (steps: pm=6, plan=8, design=12, do=14, analyze=12, qa=5, iterate=5, report=9) but **no** instruction to complete the previous phase's Task. The only "completed" mentions are `pdca-status.json` phase writes and archive gating — never Task-tool completion.
- Confirmed via CC official docs (hooks guide + todo-tracking): `TaskCreated`/`TaskCompleted` are real firing hooks, but **hooks cannot mutate Task state** (stdout/exit-code/additionalContext only; only the model may call `TaskUpdate`).

## 2. Requirements

- R1: Each `pdca` phase action that advances the chain must instruct the model to mark the predecessor phase Task(s) `completed` before creating the new phase Task.
- R2: The `## Task Integration` section must document the Phase Transition Rule (why + how), so the completion semantics are discoverable, not implicit.
- R3: A regression test must assert the completion instruction is present for each phase transition, so the omission cannot silently return.
- R4: No change to lib/hook runtime behavior; architecture counts (44 skills / 34 agents / 22 hook events / 195 lib modules) unchanged.
- R5: English-only implementation (SKILL.md, test); bilingual docs under `docs/`.

## 3. Success Criteria

- [ ] SC1: `design`, `do`, `analyze`, `iterate`, `qa`, `report`, `archive` actions each contain a "complete predecessor Task" step before their Create-Task step (archive completes the terminal `[Report]` Task).
- [ ] SC2: `## Task Integration` documents the Phase Transition Rule with the two-sources-of-truth rationale.
- [ ] SC3: New regression test passes and fails if the instruction is removed.
- [ ] SC4: `check-skill-frontmatter`, `docs-code-sync`, `check-deadcode`, `validate-plugin --strict`, and Contract L1/L4/L5 gates stay green.
- [ ] SC5: Live QA (`claude -p "/bkit:pdca status" --plugin-dir .`) loads the skill with 0 errors.

## 4. Out of Scope

- Option 2 from the issue (hook auto-completes the predecessor Task) — technically infeasible: CC hooks cannot call `TaskUpdate`. Documented in the design as a rejected alternative.
- Any change to `plan-plus`, `cc-version-analysis`, `sprint` task patterns (they do not carry the multi-phase `blockedBy` chain).
- Auto-advance behavior in `pdca-task-completed.js` (unaffected and out of the reported gap).

## 5. Approach

Reporter Option 1 (SKILL.md prose), chosen because Option 2 is infeasible under CC's hook constraints and any hook approach still relies on the model performing the `TaskUpdate` — making it no more deterministic than an explicit skill step, only noisier.
