---
name: pdca
description: |
  Unified skill for managing the entire PDCA cycle.
  Auto-triggered by keywords: "plan", "design", "analyze", "report", "status".
  Replaces legacy /pdca-* commands.

  Use proactively when user mentions PDCA cycle, planning, design documents,
  gap analysis, iteration, or completion reports.

  Triggers: pdca, 계획, 설계, 분석, 검증, 보고서, 반복, 개선, plan, design, analyze,
  check, report, status, next, iterate, gap, 計画, 設計, 分析, 検証, 報告,
  计划, 设计, 分析, 验证, 报告, planificar, diseño, analizar, verificar,
  planifier, conception, analyser, vérifier, rapport,
  planen, Entwurf, analysieren, überprüfen, Bericht,
  pianificare, progettazione, analizzare, verificare, rapporto

  Do NOT use for: simple queries without PDCA context, code-only tasks.
argument-hint: "[action] [feature]"
user-invocable: true
agents:
  analyze: bkit:gap-detector
  iterate: bkit:pdca-iterator
  report: bkit:report-generator
  default: null
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - TaskCreate
  - TaskUpdate
  - TaskList
  - AskUserQuestion
imports:
  - ${PLUGIN_ROOT}/templates/plan.template.md
  - ${PLUGIN_ROOT}/templates/design.template.md
  - ${PLUGIN_ROOT}/templates/do.template.md
  - ${PLUGIN_ROOT}/templates/analysis.template.md
  - ${PLUGIN_ROOT}/templates/report.template.md
  - ${PLUGIN_ROOT}/templates/iteration-report.template.md
next-skill: null
pdca-phase: null
task-template: "[PDCA] {feature}"
# hooks: Managed by hooks/hooks.json (unified-stop.js) - GitHub #9354 workaround
---

# PDCA Skill

> Unified Skill for managing PDCA cycle. Supports the entire Plan → Design → Do → Check → Act flow.

## Arguments

| Argument | Description | Example |
|----------|-------------|---------|
| `plan [feature]` | Create Plan document | `/pdca plan user-auth` |
| `design [feature]` | Create Design document | `/pdca design user-auth` |
| `do [feature]` | Do phase guide (start implementation) | `/pdca do user-auth` |
| `analyze [feature]` | Run Gap analysis (Check phase) | `/pdca analyze user-auth` |
| `iterate [feature]` | Auto improvement iteration (Act phase) | `/pdca iterate user-auth` |
| `report [feature]` | Generate completion report | `/pdca report user-auth` |
| `archive [feature]` | Archive completed PDCA documents | `/pdca archive user-auth` |
| `cleanup [feature]` | Cleanup archived features from status | `/pdca cleanup` |
| `status` | Show current PDCA status | `/pdca status` |
| `next` | Guide to next phase | `/pdca next` |

## Action Details

### plan (Plan Phase)

1. Check if `docs/01-plan/features/{feature}.plan.md` exists
2. If not, create based on `plan.template.md`
3. If exists, display content and suggest modifications
4. Create Task: `[Plan] {feature}`
5. Update .bkit-memory.json: phase = "plan"

**Output Path**: `docs/01-plan/features/{feature}.plan.md`

### design (Design Phase)

1. Verify Plan document exists (required - suggest running plan first if missing)
2. Create `docs/02-design/features/{feature}.design.md`
3. Use `design.template.md` structure + reference Plan content
4. Create Task: `[Design] {feature}` (blockedBy: Plan task)
5. Update .bkit-memory.json: phase = "design"

**Output Path**: `docs/02-design/features/{feature}.design.md`

### do (Do Phase)

1. Verify Design document exists (required)
2. Provide implementation guide based on `do.template.md`
3. Reference implementation order from Design document
4. Create Task: `[Do] {feature}` (blockedBy: Design task)
5. Update .bkit-memory.json: phase = "do"

**Guide Provided**:
- Implementation order checklist
- Key files/components list
- Dependency installation commands

### analyze (Check Phase)

1. Verify Do completion status (implementation code exists)
2. **Call gap-detector Agent**
3. Compare Design document vs implementation code
4. Calculate Match Rate and generate Gap list
5. Create Task: `[Check] {feature}` (blockedBy: Do task)
6. Update .bkit-memory.json: phase = "check", matchRate

**Output Path**: `docs/03-analysis/{feature}.analysis.md`

### iterate (Act Phase)

1. Check results (when matchRate < 90%)
2. **Call pdca-iterator Agent**
3. Auto-fix code based on Gap list
4. Auto re-run Check after fixes
5. Create Task: `[Act-N] {feature}` (N = iteration count)
6. Stop when >= 90% reached or max iterations (5) hit

**Iteration Rules**:
- Max iterations: 5 (adjustable via bkit.config.json)
- Stop conditions: matchRate >= 90% or maxIterations reached

### report (Completion Report)

1. Verify Check >= 90% (warn if below)
2. **Call report-generator Agent**
3. Integrated report of Plan, Design, Implementation, Analysis
4. Create Task: `[Report] {feature}`
5. Update .bkit-memory.json: phase = "completed"

**Output Path**: `docs/04-report/{feature}.report.md`

### archive (Archive Phase)

1. Verify Report completion status (phase = "completed" or matchRate >= 90%)
2. Verify PDCA documents exist (plan, design, analysis, report)
3. Create `docs/archive/YYYY-MM/{feature}/` folder
4. Move documents (delete from original location)
5. Update Archive Index (`docs/archive/YYYY-MM/_INDEX.md`)
6. Update .pdca-status.json: phase = "archived", record archivedTo path
7. Remove feature from status (or preserve summary with `--summary` option)

**Arguments**:
| Argument | Description | Example |
|----------|-------------|---------|
| `archive {feature}` | Archive with complete cleanup (default) | `/pdca archive user-auth` |
| `archive {feature} --summary` | Archive with summary preservation (FR-04) | `/pdca archive user-auth --summary` |

**Output Path**: `docs/archive/YYYY-MM/{feature}/`

**Documents to Archive**:
- `docs/01-plan/features/{feature}.plan.md`
- `docs/02-design/features/{feature}.design.md`
- `docs/03-analysis/{feature}.analysis.md`
- `docs/04-report/features/{feature}.report.md`

**FR-04: Summary Preservation Option** (v1.4.8):

When using `--summary` (or `--preserve-summary`, `-s`), the feature data in `.pdca-status.json`
is converted to a lightweight summary instead of being deleted:

```json
// Summary format (70% size reduction)
{
  "my-feature": {
    "phase": "archived",
    "matchRate": 100,
    "iterationCount": 2,
    "startedAt": "2026-01-15T10:00:00Z",
    "archivedAt": "2026-01-20T15:30:00Z",
    "archivedTo": "docs/archive/2026-01/my-feature/"
  }
}
```

Use `--summary` when you need:
- Historical statistics and metrics
- Project duration tracking
- PDCA efficiency analysis

**Important Notes**:
- Cannot archive before Report completion
- Documents are deleted from original location after move (irreversible)
- Feature name must match exactly
- Default behavior: complete deletion from status
- Use `--summary` to preserve metrics for future reference

### cleanup (Cleanup Phase) - v1.4.8

Clean up archived features from `.pdca-status.json` to reduce file size.

1. Read archived features from `.pdca-status.json`
2. Display list with timestamps and archive paths
3. Ask user for confirmation via AskUserQuestion (FR-06)
4. Delete selected features from status using `cleanupArchivedFeatures()`
5. Report cleanup results

**Arguments**:
| Argument | Description | Example |
|----------|-------------|---------|
| `cleanup` | Interactive cleanup (shows list) | `/pdca cleanup` |
| `cleanup all` | Delete all archived features | `/pdca cleanup all` |
| `cleanup {feature}` | Delete specific feature | `/pdca cleanup old-feature` |

**Output Example**:
```
🧹 PDCA Cleanup
─────────────────────────────
Archived features found: 3

1. feature-a (archived: 2026-01-15)
2. feature-b (archived: 2026-01-20)
3. feature-c (archived: 2026-01-25)

Select features to cleanup:
[ ] All archived features
[ ] Select specific features
[ ] Cancel
```

**Related Functions** (`lib/pdca/status.js`):
- `getArchivedFeatures()` - Get list of archived features
- `cleanupArchivedFeatures(features?)` - Cleanup specific or all archived
- `deleteFeatureFromStatus(feature)` - Delete single feature
- `enforceFeatureLimit(max=50)` - Auto cleanup when limit exceeded

**Notes**:
- Only archived/completed features can be deleted
- Active features are protected from deletion
- Archive documents remain in `docs/archive/` (only status is cleaned)

### status (Status Check)

1. Read `.bkit-memory.json`
2. Display current feature, PDCA phase, Task status
3. Visualize progress

**Output Example**:
```
📊 PDCA Status
─────────────────────────────
Feature: user-authentication
Phase: Check (Gap Analysis)
Match Rate: 85%
Iteration: 2/5
─────────────────────────────
[Plan] ✅ → [Design] ✅ → [Do] ✅ → [Check] 🔄 → [Act] ⏳
```

### next (Next Phase)

1. Check current PDCA phase
2. Suggest next phase guide and commands
3. Confirm with user via AskUserQuestion

**Phase Guide**:
| Current | Next | Suggestion |
|---------|------|------------|
| None | plan | `/pdca plan [feature]` |
| plan | design | `/pdca design [feature]` |
| design | do | Implementation start guide |
| do | check | `/pdca analyze [feature]` |
| check (<90%) | act | `/pdca iterate [feature]` |
| check (>=90%) | report | `/pdca report [feature]` |
| report | archive | `/pdca archive [feature]` |

## Template References

Templates loaded from imports are used when executing each action:

| Action | Template | Purpose |
|--------|----------|---------|
| plan | `plan.template.md` | Plan document structure |
| design | `design.template.md` | Design document structure |
| do | `do.template.md` | Implementation guide structure |
| analyze | `analysis.template.md` | Analysis report structure |
| report | `report.template.md` | Completion report structure |

## Task Integration

Each PDCA phase automatically integrates with Task System:

```
Task Creation Pattern:
┌────────────────────────────────────────┐
│ [Plan] {feature}                       │
│   ↓ (blockedBy)                        │
│ [Design] {feature}                     │
│   ↓ (blockedBy)                        │
│ [Do] {feature}                         │
│   ↓ (blockedBy)                        │
│ [Check] {feature}                      │
│   ↓ (blockedBy, Check < 90%)           │
│ [Act-1] {feature}                      │
│   ↓ (on iteration)                     │
│ [Act-N] {feature}                      │
│   ↓ (Check >= 90%)                     │
│ [Report] {feature}                     │
│   ↓ (after Report completion)          │
│ [Archive] {feature}                    │
└────────────────────────────────────────┘
```

## Agent Integration

| Action | Agent | Role |
|--------|-------|------|
| analyze | gap-detector | Compare Design vs Implementation |
| iterate | pdca-iterator | Auto code fix and re-verification |
| report | report-generator | Generate completion report |

## Usage Examples

```bash
# Start new feature
/pdca plan user-authentication

# Create design document
/pdca design user-authentication

# Implementation guide
/pdca do user-authentication

# Gap analysis after implementation
/pdca analyze user-authentication

# Auto improvement (if needed)
/pdca iterate user-authentication

# Completion report
/pdca report user-authentication

# Check current status
/pdca status

# Guide to next phase
/pdca next
```

## Legacy Commands Mapping

| Legacy Command | PDCA Skill |
|----------------|------------|
| `/pdca-plan` | `/pdca plan` |
| `/pdca-design` | `/pdca design` |
| `/pdca-analyze` | `/pdca analyze` |
| `/pdca-iterate` | `/pdca iterate` |
| `/pdca-report` | `/pdca report` |
| `/pdca-status` | `/pdca status` |
| `/pdca-next` | `/pdca next` |
| `/archive` | `/pdca archive` |

## Auto Triggers

Auto-suggest related action when detecting these keywords:

| Keyword | Suggested Action |
|---------|------------------|
| "plan", "planning", "roadmap" | plan |
| "design", "architecture", "spec" | design |
| "implement", "develop", "build" | do |
| "verify", "analyze", "check" | analyze |
| "improve", "iterate", "fix" | iterate |
| "complete", "report", "summary" | report |
| "archive", "store" | archive |
| "cleanup", "clean", "remove old" | cleanup |
