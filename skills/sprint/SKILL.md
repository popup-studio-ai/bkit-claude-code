---
name: sprint
classification: workflow
classification-reason: Sprint orchestration independent of model capability evolution
deprecation-risk: none
effort: medium
description: |
  Sprint Management — generic sprint capability for ANY bkit user.
  16 sub-actions: init, start, status, watch, phase, iterate, qa, report, archive, list, feature, pause, resume, fork, help, master-plan.
  Triggers: sprint, sprint start, sprint init, sprint status, sprint list,
  스프린트, 스프린트 시작, 스프린트 상태,
  スプリント, スプリント開始, スプリント状態,
  冲刺, 冲刺开始, 冲刺状态,
  sprint, iniciar sprint, estado sprint,
  sprint, demarrer sprint, statut sprint,
  Sprint, Sprint starten, Sprint Status,
  sprint, avviare sprint, stato sprint,
  master plan, multi-sprint plan, sprint master plan,
  마스터 플랜, 멀티 스프린트 계획, 스프린트 마스터 플랜,
  マスタープラン, マルチスプリント計画, スプリントマスタープラン,
  主计划, 多冲刺计划, 冲刺主计划,
  plan maestro, plan multi-sprint, plan maestro sprint,
  plan maître, plan multi-sprint, plan maître sprint,
  Masterplan, Multi-Sprint-Plan, Sprint-Masterplan,
  piano principale, piano multi-sprint, piano principale sprint.
argument-hint: "[action] [name] [--trust L0-L4] [--from <phase>]"
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - AskUserQuestion
agents:
  orchestrate: bkit:sprint-orchestrator
  plan: bkit:sprint-master-planner
  qa: bkit:sprint-qa-flow
  report: bkit:sprint-report-writer
imports: []
next-skill: null
pdca-phase: null
task-template: "[Sprint] {action} {name}"
---

# Sprint Skill — Generic Sprint Management for bkit Users

> Sprint = meta-container above bkit's PDCA 9-phase. A sprint groups one or
> more features under a shared scope, budget, and timeline. Each sprint runs
> its own 8-phase lifecycle: prd -> plan -> design -> do -> iterate -> qa
> -> report -> archived.

## Quick Start

```
/sprint init my-launch --name "Q2 Launch" --trust L3
/sprint start my-launch
```

The skill handler routes through `scripts/sprint-handler.js`, which composes
Sprint 3 adapters (state-store + telemetry + doc-scanner + matrix-sync)
into Sprint 2 use cases (start / advance / iterate / qa / report / archive).
Sprint 1 entities (createSprint / SprintEvents / typedefs) are produced
and consumed transparently along the way.

## Arguments

| Argument | Description | Example |
|----------|-------------|---------|
| `init <id>` | Create a sprint with default config | `/sprint init my-launch` |
| `start <id>` | Run auto-run loop bounded by Trust Level scope | `/sprint start my-launch --trust L3` |
| `status <id>` | Show current sprint state from disk | `/sprint status my-launch` |
| `list` | Union of state-store entries and master-plan discoveries | `/sprint list` |
| `phase <id> --to <phase>` | Advance to a specific phase | `/sprint phase my-launch --to qa` |
| `iterate <id>` | Run matchRate-100 loop (max 5 cycles) | `/sprint iterate my-launch` |
| `qa <id> --feature <name>` | Run 7-Layer data-flow check on one feature | `/sprint qa my-launch --feature auth` |
| `report <id>` | Generate KPI + lessons + carry-items report | `/sprint report my-launch` |
| `archive <id>` | Move to terminal `archived` status | `/sprint archive my-launch` |
| `pause <id>` | Manually pause a running sprint | `/sprint pause my-launch` |
| `resume <id>` | Re-evaluate triggers and resume | `/sprint resume my-launch` |
| `watch <id>` | Live dashboard (Sprint 5 — current returns snapshot) | `/sprint watch my-launch` |
| `feature <id>` | Per-feature operations (Sprint 5) | `/sprint feature my-launch --feature auth` |
| `fork <id>` | Fork into a new sprint (Sprint 5) | `/sprint fork my-launch --new my-launch-v2` |
| `help` | Print sub-action help | `/sprint help` |
| `master-plan <project>` | Generate multi-sprint Master Plan (agent isolated spawn) | `/sprint master-plan q2-launch --name "Q2 Launch" --features auth,payment` |
| `measure <id>` | Measure single gate / multi-gate / phase batch (v2.1.16 #94) | `/sprint measure my-launch --gate M4` |

## Trust Level Scope (auto-run boundary)

| Level | Stop after | Manual | Notes |
|-------|------------|--------|-------|
| L0 | prd | true | Each phase requires user approval |
| L1 | prd | true (hint) | Hint mode but still manual |
| L2 | design | false | Plan -> Design auto, Do requires approval |
| L3 | report | false | Plan -> Report auto, Archive requires approval (default) |
| L4 | archived | false | Full auto including archive (Trust >= 85 recommended) |

## Auto-Pause Safety Pins

Four armed triggers can pause a running sprint:

- `QUALITY_GATE_FAIL`  — M3 > 0 OR S1 < 100
- `ITERATION_EXHAUSTED` — iter >= 5 AND matchRate < minAcceptable
- `BUDGET_EXCEEDED` — cumulativeTokens > config.budget
- `PHASE_TIMEOUT` — phase elapsed > config.phaseTimeoutHours

Pause writes an audit log entry and a `SprintPaused` event. Resume
re-evaluates the triggers and refuses if any are still firing.

## Cross-Sprint Architecture (Sprint 1+2+3+4)

```
USER COMMAND
   v
skills/sprint/SKILL.md (this file — frontmatter triggers in 8 languages)
   v
scripts/sprint-handler.js (English dispatcher)
   v
Sprint 3: lib/infra/sprint -> { stateStore, eventEmitter, docScanner, matrixSync }
   v
Sprint 2: lib/application/sprint-lifecycle -> startSprint / advancePhase / ...
   v
Sprint 1: lib/domain/sprint -> createSprint / SprintEvents / typedefs
   v
DISK: .bkit/state/sprints/<id>.json + .bkit/audit/<date>.jsonl
```

## Examples

See:
- `examples/basic-sprint.md`
- `examples/multi-feature-sprint.md`
- `examples/archive-and-carry.md`

## When NOT to Use

- Single-feature PDCA work — use `bkit:pdca` instead
- Starter level projects — sprint overhead exceeds value
- One-off bug fixes that do not warrant a master plan

## Related Skills and Agents

- `bkit:pdca` — single-feature PDCA cycle (foundation primitive)
- `bkit:control` — automation level (L0-L4) — surfaces SPRINT_AUTORUN_SCOPE
- `bkit:sprint-orchestrator` (agent) — full lifecycle coordinator
- `bkit:sprint-master-planner` (agent) — plan/design generation
- `bkit:sprint-qa-flow` (agent) — 7-Layer dataFlowIntegrity verifier
- `bkit:sprint-report-writer` (agent) — KPI + lessons + carry items

## 10. Skill Invocation Contract (for LLM Dispatchers)

This contract specifies how an LLM dispatcher should construct the `args`
object for each of the 16 sub-actions when invoking the underlying handler
via `scripts/sprint-handler.js`.

### 10.1 Args Object Schema (per action)

| Action | Required | Optional | Example call |
|--------|----------|----------|--------------|
| `init` | `id`, `name` | `trust`/`trustLevel`, `phase`, `context`, `features` | `args = { id: "my-launch", name: "Q2 Launch", trust: "L3" }` |
| `start` | `id`, `name` | `trust`/`trustLevel`, `phase`, `context`, `features` | `args = { id: "my-launch", name: "Q2 Launch" }` (resume preserves phase) |
| `status` | `id` | — | `args = { id: "my-launch" }` |
| `list` | — | — | `args = {}` |
| `phase` | `id`, `to` | `approve` (boolean), `reason` (string) | `args = { id: "my-launch", to: "do", approve: true, reason: "Design review complete" }` |
| `iterate` | `id` | — | `args = { id: "my-launch" }` |
| `qa` | `id`, `featureName` | — | `args = { id: "my-launch", featureName: "auth" }` |
| `report` | `id` | — | `args = { id: "my-launch" }` |
| `archive` | `id` | `projectRoot` | `args = { id: "my-launch" }` |
| `pause` | `id` | `triggerId`, `severity`, `message` | `args = { id: "my-launch", triggerId: "USER_REQUEST" }` |
| `resume` | `id` | — | `args = { id: "my-launch" }` |
| `watch` | `id` | — | `args = { id: "my-launch" }` |
| `feature` | `id`, `action` | `featureName` (required for add/remove) | `args = { id: "my-launch", action: "list" }` |
| `fork` | `id`, `newId` | — | `args = { id: "my-launch", newId: "my-launch-v2" }` |
| `help` | — | — | `args = {}` |
| `master-plan` | `id` (projectId), `name` (projectName) | `features` (CSV or array), `trust`/`trustLevel`, `context`, `projectRoot`, `force` (boolean), `duration` | `args = { id: "q2-launch", name: "Q2 Launch", features: ["auth", "payment"] }` |
| `measure` | `id` | one of: `gate` (string) / `gates` (CSV or array) / `phase` (string); plus `trustLevel`, `source` ('manual'\|'auto'), `agentTaskRunner` (function in deps) | `args = { id: "my-launch", gate: "M4" }` |

### 10.1.2 `measure` action semantics (v2.1.16, Issue #94 F3)

`/sprint measure <id>` is the user-invokable partial-gate measurement command
added in v2.1.16. It routes the requested gate(s) through
`lib/application/quality-gates/measure-router.js` (single SoT shared with
sprint-orchestrator self-assessment) and persists results into
`sprint.qualityGates` subject to Trust Level scope.

**Three invocation modes (mutually exclusive precedence: gate > gates > phase)**:

```bash
/sprint measure my-launch --gate M4                       # single gate
/sprint measure my-launch --gates M4,M8                   # multi-gate (CSV)
/sprint measure my-launch --phase design                  # phase batch (ACTIVE_GATES_BY_PHASE[design])
```

**Agent routing** (Master Plan §11.3 AC4 — 7 gates × 4 agents):

| Gate | Agent              | Source artifact                                  |
|------|--------------------|--------------------------------------------------|
| M1   | gap-detector       | Design §9 API Contract ↔ shipped implementation  |
| M2   | code-analyzer      | lib/ + tests/ quality scan                       |
| M3   | gap-detector       | critical severity issue scan                     |
| M4   | gap-detector       | Design §9 API Contract ↔ module boundaries (#92) |
| M7   | code-analyzer      | style + naming convention scan                   |
| M8   | sprint-orchestrator| design §14 self-assessment checklist             |
| S1   | sprint-qa-flow     | 7-Layer hop traversal                            |

Gates outside this table (M5, M10, S2, S4) return
`{ ok: false, reason: 'unsupported_gate' }` — carried to v2.1.17.

**Trust Level scope** (Master Plan AC5):

- `L0` / `L1`: **preview mode** — measurement returned but
  `sprint.qualityGates` NOT updated, no `gate_measured` audit entry.
- `L2` / `L3` / `L4`: **record mode** — qualityGates updated +
  `gate_measured` audit entry emitted per gate.

**Audit emission** (when in record mode):

```json
{
  "action": "gate_measured",
  "category": "sprint",
  "actor": "user",
  "target": "<sprintId>",
  "details": {
    "sprintId": "...", "gateKey": "M4", "field": "M4_apiComplianceRate",
    "agent": "gap-detector", "value": 100, "threshold": 95, "passed": true,
    "source": "manual", "phase": "design", "trustLevel": "L3",
    "previousValue": null
  }
}
```

**ENH-292 alignment**: multi-gate / phase batch dispatches measurements
sequentially (no Promise.all) to avoid #56293 sub-agent caching 10x.

**Dispatcher requirement**: the LLM dispatcher (main session) must inject
`deps.agentTaskRunner: ({ subagent_type, prompt }) => Promise<{ output }>`
wrapping Claude Code's Task tool. Without it the use case returns
`reason: 'no_agent_runner'` per gate (deterministic, not silent fail).

### 10.1.1 `phase --approve` semantics (v2.1.16, Issue #95)

When a sprint is at Trust Level L2 (`scope.stopAfter = "design"`) or any other
level whose `scope.requireApproval` blocks a forward transition, the user can
re-issue the `phase` action with `--approve` (and optional `--reason`) to
cross the scope boundary **for this single call only**:

```bash
/sprint phase my-launch --to do --approve --reason "Design review complete, M4/M8 gates pass"
```

Semantics (Master Plan §11.2 AC1-AC6):

- **Single-use**: `sprint.autoRun.scope` is NOT mutated. The next transition
  faces the same scope check. To advance through multiple scope-blocking
  transitions, re-issue `--approve` each time (or escalate Trust Level via
  `/bkit:control level <N>`).
- **No trust escalation**: `sprint.autoRun.trustLevelAtStart` and the global
  automation level (`/bkit:control`) are unchanged. The approval is recorded
  per-call.
- **Audit-logged**: every `--approve` boundary crossing emits an
  `audit-logger.writeAuditLog({ action: 'scope_boundary_approved', details: {
  sprintId, from, to, trustLevel, stopAfter, approvedBy, reason } })` entry.
  The `--reason "..."` value is the recorded rationale (null when omitted).
- **Without `--approve` the legacy deadlock behavior is preserved**: handler
  returns `{ ok: false, reason: 'requires_user_approval', stopAfter, hint }`.

Use this when you want to advance past the scope boundary for one specific
transition (e.g., L2 design → do after design review) without permanently
relaxing the trust level.

### 10.2 Trust Level Acceptance

All actions that accept a Trust Level recognize three input forms (handled
by `normalizeTrustLevel` in `scripts/sprint-handler.js`):

- `args.trustLevel` (preferred, explicit handler arg)
- `args.trust` (CLI `--trust L3` natural mapping)
- `args.trustLevelAtStart` (stored property leak; defensive only)

Precedence: `trustLevel > trust > trustLevelAtStart`. Defaults to `L3` when
none provided or value is invalid (case-insensitive match against L0-L4).

### 10.3 Natural Language Mapping Rules

When the user invokes the skill with mixed slash command + natural language
(e.g., `/sprint start S1-UX Phase 1 PRD please proceed thoroughly`), the
LLM dispatcher SHOULD:

1. **Extract action**: first non-flag token after `/sprint` → `action`.
2. **Extract id (kebab-case)**: scan remaining tokens for the first kebab-case
   identifier (matches `/^[a-z][a-z0-9-]{1,62}[a-z0-9]$/`). Lowercase if
   needed. Example: `S1-UX` → `s1-ux`.
3. **Disambiguate via AskUserQuestion**: if multiple kebab-case candidates
   or none, prompt the user to confirm the intended sprint id.
4. **Load name from state**: for `start` action on an existing sprint, the
   `name` field can be resolved by `handleStatus({ id })` first; otherwise
   fall back to the id itself.

### 10.4 Example — Resume Existing Sprint

```text
User: /sprint start s1-ux
LLM dispatch:
  1. action = "start", id = "s1-ux"
  2. status = await handleSprintAction("status", { id: "s1-ux" })
  3. name = status.sprint.name  // "S1-UX P0/P1 Quick Fixes"
  4. await handleSprintAction("start", { id: "s1-ux", name })
  5. Handler invokes load-then-resume path (P0 fix) — phase preserved
```

### 10.5 Example — Ambiguous Natural Language

```text
User: /sprint start S1-UX Phase 1 PRD proceed thoroughly
LLM dispatch:
  1. action = "start"
  2. Candidates: ["s1-ux"]  (kebab-case extracted from "S1-UX")
  3. AskUserQuestion: "Did you mean to start sprint 's1-ux' and continue
     with Phase 1 (PRD)?" → user confirms
  4. await handleSprintAction("start", { id: "s1-ux", ... })
```

### 10.6 Error Handling

Handler returns `{ ok: false, error: <string>, ... }` on failure. LLM
dispatcher SHOULD surface the error verbatim to the user and offer
remediation (e.g., for `error: 'Sprint not found'`, suggest `/sprint list`).

### 10.7 CLI Mode (P1 fix)

The same handler is invokable as a standalone CLI when run as
`node scripts/sprint-handler.js <action> [id] [--flags]`. Useful for
headless tests, debugging, and CI integration. The CLI parser accepts
`--key value` and `--key=value` forms, with the first positional argument
after `action` treated as `id` if no `--id` flag is provided.

Exit codes: `0` (success), `1` (handler returned `ok: false`), `2`
(exception thrown).

## 11. Master Plan Generator (16th Sub-Action)

The `master-plan` action generates a multi-sprint roadmap via the
`bkit:sprint-master-planner` agent (isolated subagent spawn) and persists
both markdown documentation and state JSON.

### 11.1 Workflow

```
USER: /sprint master-plan q2-launch --name "Q2 Launch" --features auth,payment
   |
SKILL.md dispatches -> scripts/sprint-handler.js handleMasterPlan
   |
handleMasterPlan calls lib/application/sprint-lifecycle/master-plan.usecase.js generateMasterPlan
   |
generateMasterPlan validates input + loads existing state (idempotent check)
   |
If deps.agentSpawner provided: spawn bkit:sprint-master-planner agent -> markdown
If not: dry-run via templates/sprint/master-plan.template.md substitution
   |
Atomic write: .bkit/state/master-plans/<projectId>.json (state first)
   |
File write: docs/01-plan/features/<projectId>.master-plan.md (markdown)
   |
Audit: lib/audit/audit-logger.js writeAuditLog({ action: 'master_plan_created' })
   |
Optional Task wiring: deps.taskCreator called N times for N sprint tasks
```

### 11.2 Idempotency + Force Overwrite

- Default: idempotent. Second call with same projectId returns existing plan.
- `--force` flag: overwrites both state JSON and markdown. Audit entry has
  `details.forceOverwrite: true`.
- Audit ACTION_TYPE remains `'master_plan_created'` for both cases (PM-S2G).

### 11.3 Dry-Run vs Agent-Backed Generation

When the caller (LLM dispatcher at main session) does NOT inject
`deps.agentSpawner`, the use case generates a minimal valid markdown by
substituting variables in `templates/sprint/master-plan.template.md`. The
output is a skeleton — header, context anchor placeholders, empty features
table, empty sprints array. This dry-run mode is useful for unit tests and
when the user wants a starting template to fill manually.

When `deps.agentSpawner` is injected, the use case calls it with
`{ subagent_type: 'bkit:sprint-master-planner', prompt: <built> }` and uses
the returned `output` field as the markdown content.

### 11.4 State Schema v1.0

The state JSON at `.bkit/state/master-plans/<projectId>.json`:

```json
{
  "schemaVersion": "1.0",
  "projectId": "q2-launch",
  "projectName": "Q2 Launch",
  "features": ["auth", "payment", "reports"],
  "sprints": [],
  "dependencyGraph": {},
  "trustLevel": "L3",
  "context": { "WHY": "", "WHO": "", "RISK": "", "SUCCESS": "", "SCOPE": "" },
  "generatedAt": "2026-05-12T20:00:00Z",
  "updatedAt": "2026-05-12T20:00:00Z",
  "masterPlanPath": "docs/01-plan/features/q2-launch.master-plan.md"
}
```

The `sprints` array is populated by the S3-UX `context-sizer.js` use case.
S2-UX leaves it as an empty stub.

### 11.5 Task Management Integration (Optional)

When the caller injects `deps.taskCreator`, the use case iterates
`plan.sprints` sequentially (ENH-292 caching alignment) and calls
`deps.taskCreator(...)` once per planned sprint with `addBlockedBy` populated
from the previous sprint's task ID. This enables automatic Task list creation
for multi-sprint roadmaps.

When `deps.taskCreator` is undefined or `plan.sprints.length === 0`, Task
creation is silently skipped (no error).
