---
name: pdca-batch
classification: workflow
classification-reason: Batch PDCA management persists regardless of model advancement
deprecation-risk: none
description: |
  Manage multiple PDCA features and batch operations.
  Triggers: pdca-batch, batch, multiple features, 다중 기능, 배치.
argument-hint: "[status|plan|manage]"
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - Task
  - TaskCreate
  - TaskList
  - AskUserQuestion
imports: []
next-skill: null
pdca-phase: null
task-template: "[Batch] {action}"
---

# PDCA Batch Skill

> User-invocable skill for managing multiple PDCA features and batch operations.

## Arguments

| Argument | Description | Example |
|----------|-------------|---------|
| (none) | Show all active features (same as `status`) | `/pdca-batch` |
| `status` | Show all active features and their PDCA status | `/pdca-batch status` |
| `plan <f1> <f2> ...` | Plan multiple features in sequence | `/pdca-batch plan auth search api` |
| `manage` | Interactive dashboard for parallel features | `/pdca-batch manage` |

## Action Details

### status (Default)

Show all active PDCA features and their current status.

1. Read `.bkit/state/pdca-status.json`
2. Filter to active features (exclude archived/completed unless `--all` flag)
3. For each feature, display: phase, matchRate, iterationCount, last updated
4. Show summary: total active, total completed, total archived
5. Warn if approaching max parallel limit (3)

**Output Format**:
```
--- PDCA Feature Dashboard ------------------------
Active Features: 2/3 (max)

  #  Feature            Phase     Match%  Iter  Last Updated
  1  user-auth          check     85%     2/5   10 min ago
  2  search-api         design    -       0/5   2 hours ago
  -  (1 slot available)

Completed (recent):
  3  payment-flow       archived  96%     3/5   2 days ago

---------------------------------------------------
Totals: 2 active | 1 completed | 0 stale
Tip: Use /pdca-batch manage for interactive control
```

### plan <feature1> <feature2> ...

Plan multiple features in a batch sequence.

1. Parse feature names from arguments (space-separated)
2. Validate: max 5 features per batch plan
3. Check current active feature count (max 3 concurrent)
4. For features exceeding the parallel limit, queue them
5. Display batch plan summary and ask for confirmation via AskUserQuestion
6. On confirmation, for each feature sequentially:
   a. Initialize feature in `pdca-status.json` (state: idle)
   b. Create Plan document using plan template
   c. Record batch origin: `batchId` in feature metadata
7. Display batch plan results

**Batch Plan Output**:
```
--- Batch Plan Results ----------------------------
Batch ID: batch-1710842700000
Features planned: 3

  Feature       Status    Plan Document
  auth          OK        docs/01-plan/features/auth.plan.md
  search        OK        docs/01-plan/features/search.plan.md
  api-v2        QUEUED    (waiting for slot, 2/3 active)

---------------------------------------------------
Next: Run /pdca design <feature> for each planned feature
```

**Constraints**:
- Maximum 5 features per batch plan command
- Maximum 3 features active simultaneously
- Features beyond the limit are queued with `phase: queued`
- Queued features auto-activate when a slot becomes available

### manage

Interactive dashboard for managing parallel features.

1. Read all active features from `pdca-status.json`
2. Display interactive-style management panel
3. Show available actions per feature
4. Accept user input for next action via AskUserQuestion

**Output Format**:
```
--- Feature Management Dashboard ------------------
Active Features: 2/3

[1] user-auth (check, 85%, iter 2/5)
    Actions: [a]nalyze  [i]terate  [r]eport  [p]ause

[2] search-api (design, -, iter 0/5)
    Actions: [d]esign-review  [n]ext  [p]ause

[Q] user-input (queued, waiting for slot)
    Actions: [c]ancel  [p]rioritize

---------------------------------------------------
Global Actions:
  [s] Switch active feature
  [n] New feature (if slot available)
  [r] Refresh dashboard
  [x] Exit dashboard
---------------------------------------------------
Select feature number or action:
```

**Management Actions**:

| Action | Description |
|--------|-------------|
| Switch feature | Change which feature is "focused" for subsequent /pdca commands |
| Prioritize queued | Move a queued feature to next available slot |
| Pause feature | Temporarily halt a feature's PDCA progression |
| Cancel queued | Remove a feature from the queue |
| New feature | Start a new PDCA cycle if slot available |

## Parallel Feature Rules

1. **Maximum 3 concurrent features**: Prevents context overload and resource contention
2. **Independent state**: Each feature has its own phase, matchRate, and iteration count
3. **Shared guardrails**: Automation level and trust score are global (not per-feature)
4. **Queue system**: Features beyond limit are queued and auto-activated on slot availability
5. **Isolation**: Features do NOT share checkpoints or audit entries

## State File Schema

Features in `pdca-status.json` with batch support:
```json
{
  "user-auth": {
    "phase": "check",
    "matchRate": 85,
    "iterationCount": 2,
    "batchId": "batch-1710842700000",
    "queuePosition": null,
    "lastUpdated": "2026-03-19T10:30:00.000Z"
  },
  "search-api": {
    "phase": "design",
    "matchRate": 0,
    "iterationCount": 0,
    "batchId": "batch-1710842700000",
    "queuePosition": null,
    "lastUpdated": "2026-03-19T08:30:00.000Z"
  },
  "api-v2": {
    "phase": "queued",
    "batchId": "batch-1710842700000",
    "queuePosition": 1,
    "lastUpdated": "2026-03-19T10:30:00.000Z"
  }
}
```

## Module Dependencies

| Module | Function | Usage |
|--------|----------|-------|
| `lib/pdca/status.js` | `getPdcaStatus()` | Read all feature states |
| `lib/pdca/status.js` | `updatePdcaStatus()` | Update feature state |
| `lib/pdca/state-machine.js` | `createContext()` | Initialize new feature |
| `lib/pdca/lifecycle.js` | `activateQueuedFeature()` | Auto-activate from queue |
| `lib/audit/audit-logger.js` | `writeAuditLog()` | Record batch operations |

## Usage Examples

```bash
# View all features
/pdca-batch

# Plan multiple features
/pdca-batch plan user-auth search-api payment-flow

# Interactive management
/pdca-batch manage
```

## Integration with /pdca

The `/pdca-batch` skill complements the main `/pdca` skill:

| Scope | Use /pdca | Use /pdca-batch |
|-------|-----------|-----------------|
| Single feature operations | Yes | No |
| Multi-feature overview | No | Yes |
| Phase transitions | Yes | No (redirects to /pdca) |
| Batch planning | No | Yes |
| Feature switching | No | Yes (manage) |

When using `/pdca` commands, they operate on the currently "focused" feature.
Use `/pdca-batch manage` to switch the focused feature.
