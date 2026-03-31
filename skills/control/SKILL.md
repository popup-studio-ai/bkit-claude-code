---
name: control
effort: medium
model: sonnet
shell: bash
classification: workflow
classification-reason: Automation control persists regardless of model advancement
deprecation-risk: none
description: |
  Control bkit automation level (L0-L4), view trust score, and manage guardrails.
  Triggers: control, automation level, trust score, guardrail, 자동화 레벨, 제어.
argument-hint: "[status|level|pause|resume|trust]"
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
task-template: "[Control] {action}"
---

# Control Skill

> User-invocable skill for managing bkit automation level and system status.

## Arguments

| Argument | Description | Example |
|----------|-------------|---------|
| (none) | Show current status (same as `status`) | `/control` |
| `status` | Show automation level, trust score, guardrails | `/control status` |
| `level <0-4>` | Set automation level manually | `/control level 2` |
| `pause` | Pause all automation (equivalent to L0) | `/control pause` |
| `resume` | Resume to previous automation level | `/control resume` |
| `trust` | Show trust score details and history | `/control trust` |

## Automation Levels

| Level | Name | Description | Approval Gates |
|:-----:|------|-------------|----------------|
| L0 | Manual | All actions require explicit user approval | Every phase transition |
| L1 | Guided | Suggestions provided, user confirms each step | Every phase transition |
| L2 | Semi-Auto | Routine transitions auto, key decisions gated | do->check, check->report, report->archive |
| L3 | Auto | Most transitions auto, only destructive ops gated | report->archive |
| L4 | Full-Auto | Fully automated PDCA cycle, minimal intervention | Initial feature approval only |

## Action Details

### status (Default)

Display the current automation control state.

1. Read runtime control state from `.bkit/runtime/control-state.json`
2. Read trust score from `.bkit/state/trust-score.json`
3. Read active guardrails from `lib/control/` configuration
4. Display formatted status panel

**Output Format**:
```
--- bkit Control Panel ----------------------------
Automation Level : L2 (Semi-Auto)
Trust Score      : 72/100
Active Guardrails: 8/8
Paused           : No
Features Active  : 2/3
---------------------------------------------------
Guardrails:
  [ON] Destructive operation detection
  [ON] Blast radius limiter (max 10 files)
  [ON] Loop breaker (max 5 iterations)
  [ON] Checkpoint auto-creation
  [ON] Permission escalation gate
  [ON] Stale feature timeout (7d)
  [ON] Context overflow protection
  [ON] Concurrent write lock
---------------------------------------------------
```

### level <0-4>

Set the automation level manually.

1. Validate input is a number 0-4
2. Read current level from `.bkit/runtime/control-state.json`
3. If escalating (going higher), warn user about reduced oversight
4. If de-escalating, apply immediately without confirmation
5. Update `.bkit/runtime/control-state.json` with new level
6. Write audit log entry via `lib/audit/audit-logger.js`
7. Display confirmation with new level details

**Escalation Rule**: Level increases require explicit confirmation via AskUserQuestion.
Level decreases are immediate (safe direction).

**Level Mapping to Automation**:
| Level | automationLevel | Description |
|:-----:|:---------------:|-------------|
| L0 | manual | All manual |
| L1 | guide | Guided suggestions |
| L2 | semi-auto | Semi-automatic (default) |
| L3 | auto | Mostly automatic |
| L4 | full-auto | Fully automatic |

### pause

Pause all automation immediately.

1. Save current level to `.bkit/runtime/control-state.json` as `previousLevel`
2. Set level to L0 (Manual)
3. Set `paused: true` flag
4. Write audit log: `automation_paused`
5. Display confirmation: "Automation paused. All operations require manual approval."

### resume

Resume automation to the previous level before pause.

1. Read `previousLevel` from `.bkit/runtime/control-state.json`
2. If not paused, display: "Automation is not paused."
3. Restore level to `previousLevel`
4. Clear `paused` flag
5. Write audit log: `automation_resumed`
6. Display confirmation with restored level

### trust

Show trust score details and contributing factors.

1. Read trust score from `.bkit/state/trust-score.json`
2. Calculate score breakdown:
   - PDCA completion rate (0-25 points)
   - Match rate average (0-25 points)
   - Error recovery rate (0-20 points)
   - Session stability (0-15 points)
   - User override frequency (0-15 points, inverse)
3. Display detailed breakdown

**Output Format**:
```
--- Trust Score Details ---------------------------
Overall Score: 72/100

Breakdown:
  PDCA Completion Rate  : 18/25  (72% cycles completed)
  Match Rate Average    : 22/25  (88% average)
  Error Recovery Rate   : 14/20  (70% recovered)
  Session Stability     : 12/15  (80% stable)
  User Override Freq    :  6/15  (40% override rate)
---------------------------------------------------
Level Recommendation: L2 (Semi-Auto)
  Score 0-30  -> L0 (Manual)
  Score 31-50 -> L1 (Guided)
  Score 51-70 -> L2 (Semi-Auto)
  Score 71-85 -> L3 (Auto)
  Score 86+   -> L4 (Full-Auto)
---------------------------------------------------
```

## State Files

| File | Purpose |
|------|---------|
| `.bkit/runtime/control-state.json` | Runtime control state (level, paused, previousLevel) |
| `.bkit/state/trust-score.json` | Trust score and contributing metrics |

## Module Dependencies

| Module | Function | Usage |
|--------|----------|-------|
| `lib/control/automation-controller.js` | `getLevel()`, `setLevel()` | Read/write automation level |
| `lib/control/automation-controller.js` | `pause()`, `resume()` | Pause/resume automation |
| `lib/audit/audit-logger.js` | `writeAuditLog()` | Record control changes |

## Usage Examples

```bash
# Check current status
/control

# Set to Semi-Auto
/control level 2

# Pause all automation
/control pause

# Resume previous level
/control resume

# View trust score
/control trust
```
