# Design — PDCA Predecessor-Task Completion Chain (issue #137, v2.1.29)

## Context Anchor

| Key | Value |
|---|---|
| WHY | Stale `in_progress` predecessor Tasks leak an outdated phase into prompt context, contradicting `pdca-status.json`. |
| WHO | All bkit users running `pdca` across ≥2 phases. |
| RISK | Very low — prose in one skill file + one regression test; no runtime change. |
| SUCCESS | Every phase transition instructs predecessor completion; test enforces it; plugin loads clean. |
| SCOPE | `skills/pdca/SKILL.md` only. |

## 1. Overview

Close the reported gap deterministically by instructing the model — inside the `pdca` skill prose — to mark predecessor phase Task(s) `completed` when advancing, and by documenting the rule centrally.

## 2. Architecture Decision

### 2.1 Options considered

**Option A — Minimal Changes (chosen).** Add a "complete predecessor Task" step to each phase action immediately before its Create-Task step, plus a Phase Transition Rule in `## Task Integration`. Model-executed via the already-granted `TaskList`/`TaskUpdate` tools. No lib/hook change, no new runtime surface.

**Option B — Hook auto-complete (REJECTED, infeasible).** The issue's Option 2 proposed a hook (`task-created-handler.js` / the UserPromptExpansion handler) auto-completing the predecessor Task on new-phase Task creation. **Rejected because CC hooks cannot mutate Task state.** Per the official Claude Code hooks guide, command hooks communicate only through stdout/stderr/exit codes and `additionalContext`; they cannot invoke `TaskUpdate` or any tool — only the model can. The strongest a hook could do is emit an `additionalContext` reminder, which *still* relies on the model performing the `TaskUpdate`. That makes Option B **no more deterministic than Option A**, while adding:
- token noise on every PDCA Task creation (~7 injections per feature lifecycle),
- new model-facing output from an audit-only hook (test churn, behavior change),
- a redundant second code path for a cosmetic issue.
Therefore Option B is strictly worse. `TaskCreated`/`TaskCompleted` remain wired for their existing audit/auto-advance duties (unchanged).

**Option C — Doc-note only (REJECTED).** A README/guide note would not reach the model at runtime; the gap would persist for the actual skill execution path.

### 2.2 Chosen design — the Phase Transition Rule

A single, general rule (robust to branches like `qa` and iterative `[Act-N]`):

> **Before creating a new phase's Task, mark every prior `[Phase] {feature}` Task for this feature that is still `in_progress` as `completed`** (use `TaskList` to find them, `TaskUpdate {status: "completed"}` on each). This resolves the `blockedBy` chain and keeps the Claude Code Task list consistent with `.bkit/state/pdca-status.json`.

Using "any prior in_progress phase Task" rather than naming one exact predecessor makes the rule correct across the branching parts of the 9-phase lifecycle (`…→check→act→qa→report→archive`, where `act` may repeat and `qa` may be skipped).

## 3. Exact edits to `skills/pdca/SKILL.md`

Insert a completion step immediately before each Create-Task step (renumbering the following steps):

| Action | Before step | Predecessor(s) to complete |
|---|---|---|
| `plan` | Create Task `[Plan]` | `[PM]` (if it exists) |
| `design` | Create Task `[Design]` | `[Plan]` |
| `do` | Create Task `[Do]` | `[Design]` |
| `analyze` | Create Task `[Check]` | `[Do]` |
| `iterate` | Create Task `[Act-N]` | `[Check]` and any prior `[Act-*]` still in_progress |
| `qa` | Create Task `[QA]` | `[Check]` / latest `[Act-N]` |
| `report` | Create Task `[Report]` | `[QA]` (or `[Check]`/`[Act-N]` if qa skipped) |
| `archive` | (creates no Task) | `[Report]` — add a completion step in the archive cleanup |

Each inserted step uses the general rule wording (find prior in_progress `[Phase] {feature}` Tasks → complete them), with a short cross-reference to `## Task Integration`.

Also update `## Task Integration`:
- Keep the creation diagram.
- Add a **Phase Transition Rule** subsection stating the completion rule and the two-sources-of-truth rationale.

## 4. Regression test

New file `test/regression/issue-137-predecessor-task-completion.test.js`:
- Reads `skills/pdca/SKILL.md`.
- Asserts the `## Task Integration` section contains the Phase Transition Rule (matches `completed` + `blockedBy`/`in_progress` wording).
- Asserts each of `design`, `do`, `analyze`, `report`, `archive` action bodies contains a `TaskUpdate`/`completed` completion instruction.
- Fails if any completion instruction is removed (guards the fix).

## 5. Non-goals / invariants

- Architecture counts unchanged (44 skills / 34 agents / 22 hook events / 25 blocks / 195 lib modules). No lib module added → `check-deadcode` count unchanged.
- No hooks.json change.
- English-only skill + test; bilingual docs.

## 6. Verification plan

- Static gates: `check-skill-frontmatter`, `lint-skill-md`, `docs-code-sync`, `check-deadcode`, `validate-plugin --strict`, Contract L1/L4/L5.
- Regression: new test green; whole `test/regression` suite no new failures vs `main`.
- Live QA: `claude -p "/bkit:pdca status" --plugin-dir .` loads skill, 0 errors; skill body shows the new instruction.
