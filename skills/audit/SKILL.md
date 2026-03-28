---
name: audit
classification: workflow
classification-reason: Audit logging persists regardless of model advancement
deprecation-risk: none
description: |
  View audit logs, decision traces, and session history for AI transparency.
  Triggers: audit, log, decision trace, history, 감사 로그, 결정 추적.
argument-hint: "[log|trace|summary|search] [query]"
user-invocable: true
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
imports: []
next-skill: null
pdca-phase: null
task-template: "[Audit] {action}"
---

# Audit Skill

> User-invocable skill for viewing audit logs, decision traces, and session history.

## Arguments

| Argument | Description | Example |
|----------|-------------|---------|
| (none) | Show recent audit log entries (same as `log`) | `/audit` |
| `log` | Show recent audit log entries (last 20) | `/audit log` |
| `trace <feature>` | Show decision traces for a feature | `/audit trace user-auth` |
| `summary` | Show daily/weekly audit summary | `/audit summary` |
| `search <query>` | Search audit logs by action type, feature, or date | `/audit search "phase_transition"` |

## Action Details

### log (Default)

Display recent audit log entries.

1. Read today's audit log from `.bkit/audit/YYYY-MM-DD.jsonl`
2. If today's log is empty or has fewer than 20 entries, also read yesterday's log
3. Parse JSONL entries (one JSON object per line)
4. Display the last 20 entries in reverse chronological order
5. Format each entry with timestamp, action, feature, and details

**JSONL Entry Schema**:
```json
{
  "timestamp": "2026-03-19T10:30:00.000Z",
  "action": "phase_transition",
  "feature": "user-auth",
  "from": "plan",
  "to": "design",
  "automationLevel": "semi-auto",
  "triggeredBy": "user",
  "details": "Plan approved, transitioning to Design"
}
```

**Output Format**:
```
--- Audit Log (Last 20 Entries) -------------------
[2026-03-19 10:30] phase_transition | user-auth
  plan -> design (Semi-Auto, user-triggered)

[2026-03-19 10:25] checkpoint_created | user-auth
  Checkpoint cp-1710842700000 before Design phase

[2026-03-19 10:20] automation_level_changed | -
  L1 -> L2 (trust score: 72)
...
---------------------------------------------------
Total entries today: 45
```

### trace <feature>

Show decision traces for a specific feature.

1. Read decision trace files from `.bkit/decisions/YYYY-MM-DD.jsonl`
2. Filter entries matching the specified feature
3. Display chronological decision chain with rationale

**Decision Trace Entry Schema**:
```json
{
  "timestamp": "2026-03-19T10:30:00.000Z",
  "feature": "user-auth",
  "decision": "advance_to_design",
  "rationale": "Plan document complete, matchRate N/A at this phase",
  "alternatives": ["request_plan_revision", "skip_to_do"],
  "chosenBecause": "Plan deliverable exists and passes validation",
  "automationLevel": "semi-auto",
  "confidence": 0.92
}
```

**Output Format**:
```
--- Decision Trace: user-auth ---------------------
[10:15] START -> pm
  Decision: Begin PDCA cycle
  Rationale: New feature request detected

[10:20] pm -> plan
  Decision: advance_to_plan
  Rationale: PRD document generated successfully
  Alternatives: [reject_prd, revise_scope]
  Confidence: 0.88

[10:30] plan -> design
  Decision: advance_to_design
  Rationale: Plan document complete, passes validation
  Alternatives: [request_plan_revision, skip_to_do]
  Confidence: 0.92
---------------------------------------------------
Total decisions: 3
```

### summary

Show daily or weekly audit summary.

1. Read audit logs for the current day (and optionally past 7 days)
2. Aggregate by action type and count occurrences
3. Calculate key metrics:
   - Total actions recorded
   - Phase transitions count
   - Automation vs manual ratio
   - Error/recovery events
   - Average trust score change
4. Display formatted summary

**Output Format**:
```
--- Audit Summary (2026-03-19) --------------------
Total Actions       : 45
Phase Transitions   : 12
Checkpoints Created : 4
Errors Recorded     : 1
Recoveries          : 1

Action Breakdown:
  phase_transition       : 12 (27%)
  checkpoint_created     :  4 (9%)
  match_rate_recorded    :  8 (18%)
  automation_level_change:  2 (4%)
  iteration_completed    :  6 (13%)
  other                  : 13 (29%)

Automation Ratio: 67% auto / 33% manual
Trust Score Change: +3 (69 -> 72)
---------------------------------------------------
Weekly Trend (last 7 days):
  Mon: 32 actions | Tue: 45 actions | Wed: 28 actions
  ...
```

### search <query>

Search audit logs by action type, feature name, or date range.

1. Parse the search query to determine filter type:
   - If query matches an action type (e.g., `phase_transition`), filter by action
   - If query matches a feature name, filter by feature
   - If query matches a date (YYYY-MM-DD), filter by date
   - Otherwise, perform full-text search across all fields
2. Read relevant JSONL files from `.bkit/audit/`
3. Apply filters and return matching entries (max 50 results)
4. Display results in chronological order

**Search Examples**:
```bash
# Search by action type
/audit search "phase_transition"

# Search by feature name
/audit search "user-auth"

# Search by date
/audit search "2026-03-18"

# Full-text search
/audit search "error"
```

## File Locations

| Path | Format | Purpose |
|------|--------|---------|
| `.bkit/audit/YYYY-MM-DD.jsonl` | JSONL | Daily audit log entries |
| `.bkit/audit/summary/` | JSON | Pre-computed daily/weekly summaries |
| `.bkit/decisions/YYYY-MM-DD.jsonl` | JSONL | Decision trace entries |

## Module Dependencies

| Module | Function | Usage |
|--------|----------|-------|
| `lib/audit/audit-logger.js` | `readAuditLog()` | Read audit entries |
| `lib/audit/audit-logger.js` | `searchAuditLog()` | Search/filter entries |
| `lib/audit/decision-tracer.js` | `getDecisionTrace()` | Read decision traces |

## Retention Policy

- Audit logs: 30-day retention, auto-cleanup via daily hook
- Decision traces: 30-day retention, linked to audit logs
- Total storage budget: 100MB (auto-prune oldest when exceeded)

## Usage Examples

```bash
# View recent log entries
/audit

# View decision trace for a feature
/audit trace user-auth

# View daily summary
/audit summary

# Search for phase transitions
/audit search "phase_transition"

# Search by feature
/audit search "user-auth"
```
