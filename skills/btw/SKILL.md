---
name: btw
classification: workflow
classification-reason: "Manages /btw command lifecycle: record, list, analyze, promote, stats. User-driven workflow with CRUD on btw-suggestions.json"
deprecation-risk: none
description: |
  By-The-Way: 작업 중 개선 제안을 즉시 수집하고 관리하는 스킬.
  Triggers: /btw, /btw list, /btw analyze, /btw promote, /btw stats
  Keywords: btw, 개선, 제안, suggestion, improve, idea, feedback
argument-hint: "/btw {suggestion} | /btw list | /btw analyze | /btw promote {id} | /btw stats"
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# /btw - By-The-Way Suggestion Collector

작업 중 "이거 스킬로 만들면 좋겠다", "이 패턴 자동화하면 좋겠다" 등의
개선 제안을 즉시 기록하고 관리하는 도구.

## Commands

### `/btw {suggestion}` - Record a suggestion

1. Read `.bkit/btw-suggestions.json` (create if not exists)
2. Generate next ID: `btw-NNN` (zero-padded, sequential)
3. Create suggestion entry:
   ```json
   {
     "id": "btw-001",
     "timestamp": "ISO-8601",
     "suggestion": "{user input}",
     "context": {
       "file": "{current working file if identifiable}",
       "pdcaPhase": "{current PDCA phase from .bkit-memory.json or null}",
       "feature": "{current feature or null}"
     },
     "category": "auto-detect",
     "status": "pending",
     "promotedTo": null,
     "priority": null
   }
   ```
4. Auto-detect category from suggestion text:
   - `skill-request`: mentions "skill", "스킬", "자동화", "automate"
   - `bug-pattern`: mentions "bug", "버그", "오류", "error", "fix"
   - `improvement`: mentions "개선", "improve", "better", "refactor"
   - `documentation`: mentions "문서", "doc", "설명", "explain"
   - `general`: default
5. Update `stats.total` count
6. Respond: "Recorded btw-{NNN}: {truncated suggestion}. Use `/btw list` to view all."

### `/btw list` - List all suggestions

1. Read `.bkit/btw-suggestions.json`
2. Display table:
   ```
   ID       | Status   | Category       | Suggestion (truncated)
   ---------|----------|----------------|----------------------
   btw-001  | pending  | skill-request  | @Flow 모델에서 옵션 목록을 자동...
   btw-002  | promoted | improvement    | DataProxy 패턴에 검증 로직을...
   ```
3. Show summary: Total: N | Pending: N | Promoted: N | Dismissed: N

### `/btw analyze` - Analyze suggestions for skill candidates

1. Read all pending suggestions from `.bkit/btw-suggestions.json`
2. Group by category and find patterns:
   - Cluster similar suggestions (keyword overlap)
   - Count frequency of similar topics
   - Identify suggestions that map to existing bkit skills vs. new skill needs
3. For each skill candidate:
   - Estimate skill classification: workflow vs capability
   - Suggest skill name and description
   - Reference source suggestion IDs
4. Output analysis:
   ```
   Skill Candidates from /btw Analysis
   =====================================

   1. [NEW SKILL] hunikflow-validation (capability)
      Based on: btw-001, btw-005, btw-008
      Frequency: 3 mentions
      Description: Validation pattern guide for @Flow entities

   2. [EXISTING SKILL ENHANCEMENT] code-review
      Based on: btw-003
      Suggestion: Add DataProxy-specific review rules
   ```
5. Save analysis timestamp to `stats.lastAnalyzed`

### `/btw promote {id}` - Promote suggestion to skill creation

1. Find suggestion by ID in `.bkit/btw-suggestions.json`
2. Validate status is "pending" (cannot promote already promoted/dismissed)
3. Update suggestion:
   - `status`: "promoted"
   - `promotedTo`: skill name (derived from suggestion)
4. Trigger skill-create workflow with context from the suggestion:
   - Pass suggestion text as skill description seed
   - Pass context (file, feature) as project context
5. Respond: "Promoted btw-{id} -> skill-create pipeline. Run `/skill-create` to continue."

### `/btw stats` - Show statistics

1. Read `.bkit/btw-suggestions.json`
2. Calculate and display:
   ```
   /btw Statistics
   ===============
   Total suggestions: 12
   By status: pending=8, promoted=3, dismissed=1
   By category: skill-request=5, improvement=4, bug-pattern=2, general=1
   Promotion rate: 25.0%
   Last analyzed: 2026-03-13T10:00:00Z
   Top keywords: @Flow(3), DataProxy(2), validation(2)
   ```

## Data File: `.bkit/btw-suggestions.json`

Initialize with this structure if file does not exist:

```json
{
  "version": "1.0",
  "suggestions": [],
  "stats": {
    "total": 0,
    "promoted": 0,
    "dismissed": 0,
    "lastAnalyzed": null
  }
}
```

## Category Auto-Detection Rules

| Pattern | Category |
|---------|----------|
| skill, 스킬, automate, 자동화, command, 명령 | skill-request |
| bug, 버그, error, 오류, fix, 수정 | bug-pattern |
| improve, 개선, better, refactor, 리팩토링, optimize | improvement |
| doc, 문서, explain, 설명, readme, guide | documentation |
| (default) | general |

## Integration Points

- **PDCA Context**: Reads `.bkit-memory.json` for current phase/feature
- **skill-create**: `/btw promote` triggers skill-create workflow
- **skill-needs-extractor**: `/btw analyze` results feed into gap analysis
