---
name: rollback
classification: workflow
classification-reason: Checkpoint and rollback management persists regardless of model advancement
deprecation-risk: none
effort: low
description: |
  Manage PDCA checkpoints and rollback — create, list, restore for safe recovery.
  Triggers: rollback, checkpoint, restore, undo, 롤백, 체크포인트, 복원.
argument-hint: "[list|to|phase|reset] [target]"
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - AskUserQuestion
imports: []
next-skill: null
pdca-phase: null
task-template: "[Rollback] {action}"
---

# Rollback Skill

> User-invocable skill for checkpoint management and PDCA state rollback.

## Arguments

| Argument | Description | Example |
|----------|-------------|---------|
| (none) | List available checkpoints (same as `list`) | `/rollback` |
| `list` | List all available checkpoints | `/rollback list` |
| `to <checkpoint-id>` | Restore to a specific checkpoint | `/rollback to cp-1710842700000` |
| `phase` | Rollback to previous PDCA phase | `/rollback phase` |
| `reset <feature>` | Reset feature to initial (idle) state | `/rollback reset user-auth` |

## Action Details

### list (Default)

List all available checkpoints for the current or specified feature.

1. Read checkpoint metadata from `.bkit/checkpoints/`
2. Filter by current active feature (or show all if no active feature)
3. Sort by timestamp (newest first)
4. Display formatted checkpoint list

**Checkpoint Metadata Schema**:
```json
{
  "id": "cp-1710842700000",
  "feature": "user-auth",
  "phase": "design",
  "type": "auto",
  "timestamp": "2026-03-19T10:30:00.000Z",
  "description": "Auto-checkpoint before Do phase",
  "pdcaStatus": { "phase": "design", "matchRate": 0, "iterationCount": 0 },
  "files": ["docs/02-design/features/user-auth.design.md"]
}
```

**Output Format**:
```
--- Checkpoints: user-auth ------------------------
ID                    Phase    Type   Date                Description
cp-1710842700000      design   auto   2026-03-19 10:30   Before Do phase
cp-1710839100000      plan     auto   2026-03-19 09:25   Before Design phase
cp-1710835500000      idle     manual 2026-03-19 08:15   Manual save point
---------------------------------------------------
Total: 3 checkpoints

Usage: /rollback to cp-1710842700000
```

### to <checkpoint-id>

Restore state to a specific checkpoint.

1. Validate the checkpoint ID exists in `.bkit/checkpoints/`
2. Read the checkpoint metadata and saved state
3. Display what will be restored (phase, files, status)
4. **Require user confirmation** via AskUserQuestion (always, regardless of automation level)
5. On confirmation:
   a. Create a safety checkpoint of current state (before rollback)
   b. Restore `pdca-status.json` to the checkpoint's saved state
   c. Restore any saved file snapshots
   d. Write audit log: `checkpoint_restored`
   e. Display confirmation with restored state
6. On rejection: Cancel and display current state

**Safety Rule**: Rollback operations ALWAYS require user confirmation,
even at L4 (Full-Auto). This is a destructive operation.

### phase

Rollback to the previous PDCA phase.

1. Read current feature state from `.bkit/state/pdca-status.json`
2. Determine previous phase using the PDCA phase order:
   `idle <- pm <- plan <- design <- do <- check <- act <- report <- archived`
3. If current phase is `idle`, display: "Already at initial state. Nothing to rollback."
4. Display the phase transition that will occur
5. **Require user confirmation** via AskUserQuestion
6. On confirmation:
   a. Create auto-checkpoint of current state
   b. Use `state-machine.transition()` with `ROLLBACK` event
   c. Update `pdca-status.json` with previous phase
   d. Write audit log: `phase_rollback`
   e. Display: "Rolled back from {current} to {previous}"

**Phase Rollback Map**:
| Current Phase | Rolls Back To |
|:-------------:|:-------------:|
| pm | idle |
| plan | pm (or idle if PM was skipped) |
| design | plan |
| do | design |
| check | do |
| act | check |
| report | check |
| archived | report |

### reset <feature>

Reset a feature to its initial (idle) state.

1. Validate the feature exists in `pdca-status.json`
2. Display current feature state and what will be lost
3. **Require user confirmation** via AskUserQuestion with warning:
   "This will reset ALL PDCA progress for {feature}. Documents in docs/ will NOT be deleted."
4. On confirmation:
   a. Create auto-checkpoint of current state
   b. Use `state-machine.transition()` with `RESET` event
   c. Clear feature from active features list
   d. Reset all metrics (matchRate, iterationCount, etc.)
   e. Write audit log: `feature_reset`
   f. Display: "Feature {feature} reset to idle state. PDCA documents preserved in docs/."

**Important**: Reset does NOT delete documents from `docs/`. It only resets the
PDCA status tracking. Use `/pdca cleanup` to remove archived status entries.

## Checkpoint Types

| Type | Trigger | Description |
|------|---------|-------------|
| `auto` | Phase transition (Design->Do) | Automatic checkpoint at key transitions |
| `manual` | User command | User-created save point |
| `phase_transition` | Any phase change | Lightweight state snapshot |
| `pre_rollback` | Before rollback | Safety checkpoint before destructive operation |

## State Files

| File | Purpose |
|------|---------|
| `.bkit/checkpoints/cp-{timestamp}.json` | Checkpoint metadata and state snapshot |
| `.bkit/state/pdca-status.json` | Current PDCA status (modified on rollback) |

## Module Dependencies

| Module | Function | Usage |
|--------|----------|-------|
| `lib/control/checkpoint-manager.js` | `listCheckpoints()` | List available checkpoints |
| `lib/control/checkpoint-manager.js` | `createCheckpoint()` | Create new checkpoint |
| `lib/control/checkpoint-manager.js` | `restoreCheckpoint()` | Restore to checkpoint |
| `lib/pdca/state-machine.js` | `transition()` | Execute ROLLBACK/RESET events |
| `lib/audit/audit-logger.js` | `writeAuditLog()` | Record rollback operations |

## Usage Examples

```bash
# List checkpoints
/rollback

# Restore to specific checkpoint
/rollback to cp-1710842700000

# Rollback to previous phase
/rollback phase

# Reset feature completely
/rollback reset user-auth
```
