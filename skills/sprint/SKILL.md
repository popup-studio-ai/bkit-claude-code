---
name: sprint
classification: workflow
classification-reason: Sprint orchestration independent of model capability evolution
deprecation-risk: none
effort: medium
description: |
  Sprint Management — generic sprint capability for ANY bkit user.
  16 sub-actions: init, start, status, watch, phase, iterate, qa, report,
  archive, list, feature, pause, resume, fork, help, master-plan.
  Triggers: sprint, sprint start, sprint init, sprint status, sprint list,
  master plan, multi-sprint plan, sprint master plan,
  스프린트, 스프린트 시작, 스프린트 상태, 마스터 플랜, 멀티 스프린트 계획, 스프린트 마스터 플랜,
  スプリント, 冲刺, iniciar sprint, demarrer sprint, Sprint starten, avviare sprint.
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

The skill handler routes through `<bkit-root>/scripts/sprint-handler.js`
(bkit convention — handlers live at the bkit repo root `scripts/` directory,
NOT inside skills/<name>/scripts/). The handler composes
Sprint 3 adapters (state-store + telemetry + doc-scanner + matrix-sync)
into Sprint 2 use cases (start / advance / iterate / qa / report / archive).
Sprint 1 entities (createSprint / SprintEvents / typedefs) are produced
and consumed transparently along the way.

> **Resolving `scripts/sprint-handler.js` in this document**: throughout
> this SKILL.md, references to `scripts/sprint-handler.js` mean
> `<bkit-root>/scripts/sprint-handler.js` (the canonical location).
> LLM dispatchers MUST NOT compose `skills/sprint/scripts/sprint-handler.js`
> — that path does not exist (Issue #107, fixed v2.1.19 S2 F2-1).

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

## Delegation notes

Extended trigger keywords, moved here from the frontmatter description
(issue #129 token diet) — one anchor per language stays in the description;
the full multilingual list is preserved below:

- JA: スプリント開始, スプリント状態, マスタープラン, マルチスプリント計画, スプリントマスタープラン
- ZH: 冲刺开始, 冲刺状态, 主计划, 多冲刺计划, 冲刺主计划
- ES: iniciar sprint, estado sprint, plan maestro, plan multi-sprint, plan maestro sprint
- FR: demarrer sprint, statut sprint, plan maître, plan multi-sprint, plan maître sprint
- DE: Sprint starten, Sprint Status, Masterplan, Multi-Sprint-Plan, Sprint-Masterplan
- IT: avviare sprint, stato sprint, piano principale, piano multi-sprint, piano principale sprint

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
`deps.agentTaskRunner` wrapping Claude Code's Task tool. Without it the use
case returns `reason: 'no_agent_runner'` per gate (deterministic, not silent
fail). The handler layer exposes `createTaskToolRunner({ invokeTaskTool })`
(in `scripts/lib/sprint-handler-shared.js`, re-exported from
`scripts/sprint-handler.js`) to build this wrapper:

```javascript
const { createTaskToolRunner } = require('<bkit-root>/scripts/lib/sprint-handler-shared');
const runner = createTaskToolRunner({
  invokeTaskTool: async ({ subagent_type, prompt }) => {
    // delegate to Claude Code's Task tool in the main session
    return { text: await callTaskTool({ subagent_type, prompt }) };
  },
});
await handleSprintAction('measure', { id, gate }, { agentTaskRunner: runner });
```

**Two invocation paths:**

1. **In-process (primary, main session):** the LLM dispatcher calls
   `handleSprintAction(...)` directly with `deps.agentTaskRunner` injected.
   Gate measurement works end-to-end.
2. **Subprocess CLI (`node scripts/sprint-handler.js ...`):** runs in a
   separate Node process that cannot see the Task tool, so it passes `{}`
   and gate measurement returns `no_agent_runner`. Use this path only for
   non-measurement actions (status, list, help) or when the in-process path
   is unavailable; for any action that measures gates, use the in-process
   dispatcher call with an injected runner.

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

#### 10.1.1.1 `--approve` does NOT bypass Quality Gate failures (v2.1.19 S1, CO-S0-6)

**Critical semantic clarification** (added v2.1.19 S1 in response to S0
discovery of ambiguity — master plan carry-over CO-S0-6):

`--approve` is the **Trust Level scope-boundary** escape hatch ONLY.
It is **NOT** a Quality Gate override mechanism.

| Situation | `--approve` works? | Correct remediation |
|-----------|--------------------|---------------------|
| Trust scope blocks transition (`requires_user_approval`) | ✅ Yes — single-use cross | Re-issue with `--approve --reason "..."` |
| Quality Gate fails (`gate_fail`, e.g., M8=not_measured) | ❌ No — gate still blocks | Run `/sprint measure <id> --gate <key>` first, then re-issue `phase` |
| Both scope + gate fail | ❌ Gate wins | Measure gate, then `--approve` if scope still blocks |

**Why this matters**: in v2.1.19 S0 (master plan §23 step 0) we attempted
`/sprint phase s0-sqm-baseline --to plan --approve` and observed
`{ ok: false, reason: 'gate_fail', ... }` despite `--approve`. This is
expected behavior — `--approve` does not satisfy `M8 designCompleteness`.

**Future work (deferred to v2.1.20+)**: `--allowGateOverride` flag may be
introduced as a *gate* override (with stronger audit + alarm trail than
`--approve`). Until then, gate failures must be resolved via `/sprint measure`.

### 10.1.3 Trust Level Mutation (Persistent) — v2.1.18 (Issue #101)

`/sprint trust <sprintId> --to <Level> [--reason "<text>"] [--force]`

Mutate the **stored** `sprint.autoRun.trustLevelAtStart` for a specific
sprint. Unlike `--approve` (single-use scope boundary override, §10.1.2) or
`--trustLevel L<N>` (per-call volatile override), this command **persists**
the trust level across all subsequent operations on the sprint.

**Use cases**:
- L1 sprint started conservatively, ready to escalate after design review.
- Demoting L4 sprint to L2 mid-flight after security concern.
- Recovering from L1 "preview-mode lockout" (#101 v2.1.16 root cause — @pruge
  dandi-village-ledger `s1-foundation` scenario).

**Example**:

```bash
$ /sprint trust s1-foundation --to L3 --reason "P0 32/32 ready for measurement"
{
  "ok": true,
  "sprintId": "s1-foundation",
  "from": "L1",
  "to": "L3",
  "reason": "P0 32/32 ready for measurement",
  "actor": "user",
  "forced": false,
  "trustScoreAtMutation": null,
  "blastRadius": "low",
  "auditEntryId": "..."
}

$ /sprint measure s1-foundation --gate M1
{ "trustLevel": "L3", "mode": "record", "value": 92.3, ... }  # ✦ now record mode
```

**Downgrade Guardrail**:

Major downgrades (≥2 levels, e.g. L4 → L2 or L3 → L1) require:
- `trustScore >= 80` (from `.bkit/state/trust-profile.json` `trustScore` field
  — 6-component weighted sum: pdcaCompletionRate 0.25 / gatePassRate 0.2 /
  rollbackFrequency 0.15 / destructiveBlockRate 0.15 / iterationEfficiency 0.15
  / userOverrideRate 0.1), **OR**
- `--force` flag (explicit override + `forced: true` audit + `blastRadius: 'high'`
  for Defense Layer 6 alarm).

Minor downgrades (1-level diff, e.g. L3 → L2) are not blocked.

**Idempotent Path**:

`from === to` (e.g. `--to L3` when sprint already at L3) returns
`{ ok: true, noop: true }` and **also emits audit with `noop: true`** field
(CTO §C3 review: monitoring blind-spot prevention — surfaces automation
patterns hitting idempotent paths).

**Actor Auto-Detection** (CTO §E6 spoofing mitigation):

`actor` field is auto-detected:
- explicit `args.actor` (if 'user'|'agent'|'system'), else
- `process.env.CLAUDE_AGENT_ID` set → `'agent'`, else
- default `'user'`.

**Audit**:

Every mutation (including no-op) emits an `audit-logger` entry:

```json
{
  "action": "sprint_trust_changed",
  "category": "sprint",
  "actor": "user",
  "target": "s1-foundation",
  "targetType": "feature",
  "blastRadius": "low",
  "details": {
    "sprintId": "s1-foundation",
    "from": "L1",
    "to": "L3",
    "reason": "...",
    "trustScoreAtMutation": null,
    "forced": false,
    "noop": false,
    "actor": "user",
    "timestamp": "2026-05-21T..."
  }
}
```

**Comparison Table**:

| Command | Scope | Persistence | Use When |
|---------|-------|------------|----------|
| `/sprint phase --to ... --approve` | Single transition | Single-use (state 무변경) | 1회 boundary 우회 (#95) |
| `/sprint trust --to <L>` ✦ | Sprint 전체 (this sprint only) | Persistent (sprint.autoRun.trustLevelAtStart) | 본 sprint 정책 영구 변경 |
| `/bkit:control level <N>` | Global (all sprints + PDCA) | Persistent (~/.bkit/state/control.json) | 전역 automation 정책 변경 |
| `--trustLevel <L>` (per-call) | Single call | Volatile (state 무변경) | 1회 debug override |

### 10.2 Trust Level Acceptance

All actions that accept a Trust Level recognize three input forms (handled
by `normalizeTrustLevel` in `scripts/sprint-handler.js`):

- `args.trustLevel` (preferred, explicit handler arg)
- `args.trust` (CLI `--trust L3` natural mapping)
- `args.trustLevelAtStart` (stored property leak; defensive only)

Precedence: `trustLevel > trust > trustLevelAtStart`. Defaults to **`L2`**
when none provided or value is invalid (case-insensitive match against L0-L4).

**v2.1.19 S1 F1-4 default change**: default lowered from `L3` to `L2` per
Safe Defaults principle (master plan §3.2 Controllable AI Principles). The
handler now aligns with `lib/domain/sprint/entity.js createSprint` which
already defaulted to `L2` — eliminates the v2.1.16~v2.1.18 drift between
handler default (L3) and entity default (L2).

**`--trust L1` explicit warning**: when the user explicitly requests L1 at
`/sprint init`, the handler emits a `stderr` warning + audit
`sprint_trust_warning` event re: preview-mode lockout risk
(v2.1.18 #101 follow-up). The warning is education-only — L1 sprint init
still succeeds.

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
