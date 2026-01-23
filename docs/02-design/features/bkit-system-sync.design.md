# Design: bkit-system 문서 동기화

## Feature Info
| 항목 | 내용 |
|------|------|
| Feature | bkit-system-sync |
| Plan Doc | [bkit-system-sync.plan.md](../../01-plan/features/bkit-system-sync.plan.md) |
| Created | 2026-01-23 |
| Version | v1.3.1 |

---

## 1. _GRAPH-INDEX.md 수정 사항

### 1.1 Commands 섹션 (Line ~82)

**현재:**
```markdown
## Commands (18)
```

**수정:**
```markdown
## Commands (20)
```

### 1.2 Commands 목록에 누락된 항목 추가

**추가할 Commands:**
```markdown
### Utilities
- `/zero-script-qa` - Run Zero Script QA
- `/learn-claude-code` - Learning curriculum
- `/setup-claude-code` - Generate project settings
- `/upgrade-claude-code` - Upgrade settings
- `/upgrade-level` - Upgrade project level
- `/archive` - Archive completed PDCA documents
- `/github-stats` - Collect GitHub repository statistics
```

### 1.3 lib/common.js 함수 목록 업데이트 (Line ~156)

**추가할 함수들:**
```markdown
  - `PDCA_PHASES` - PDCA phase definitions constant
  - `getPdcaTaskMetadata()` - Generate task metadata for PDCA
  - `generatePdcaTaskSubject()` - Generate task subject
  - `generatePdcaTaskDescription()` - Generate task description
  - `generateTaskGuidance()` - Generate task creation guidance
  - `getPreviousPdcaPhase()` - Get previous PDCA phase
  - `findPdcaStatus()` - Find PDCA status file
  - `getCurrentPdcaPhase()` - Get current PDCA phase
```

---

## 2. _hooks-overview.md 수정 사항

### 2.1 Global Hooks Configuration 섹션 수정 (Line ~33)

**현재:**
```markdown
> **Note**: Only `SessionStart` is defined globally. PreToolUse/PostToolUse hooks are defined in skill frontmatter for contextual activation.
```

**수정:**
```markdown
> **Note**: `SessionStart`, `PreToolUse`, and `PostToolUse` are all defined in `hooks/hooks.json` for global PDCA enforcement. Skill frontmatter can define additional hooks for contextual features.
```

### 2.2 hooks.json 내용 업데이트 (Line ~36)

**수정할 내용:**
```json
{
  "$schema": "https://json.schemastore.org/claude-code-hooks.json",
  "description": "bkit Vibecoding Kit - Global hooks for PDCA workflow enforcement",
  "hooks": {
    "SessionStart": [...],
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{ "type": "command", "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/pre-write.js" }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [{ "type": "command", "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/pdca-post-write.js" }]
      }
    ]
  }
}
```

### 2.3 Hook Events 테이블 업데이트

**수정할 테이블:**
| Event | Source | Matcher | Script | Action |
|-------|--------|---------|--------|--------|
| SessionStart | hooks.json | - | session-start.js | Initialize + AskUserQuestion |
| PreToolUse | hooks.json | Write\|Edit | pre-write.js | PDCA + classification + convention |
| PostToolUse | hooks.json | Write | pdca-post-write.js | Gap analysis suggestion |

---

## 3. _scripts-overview.md 수정 사항

### 3.1 lib/common.js 함수 목록 확장 (Line ~103)

**추가할 섹션:**
```markdown
### Task System Integration (v1.3.1)

```javascript
// PDCA Phase Definitions
const PDCA_PHASES = {
  plan: { order: 1, name: 'Plan', emoji: '📋' },
  design: { order: 2, name: 'Design', emoji: '📐' },
  do: { order: 3, name: 'Do', emoji: '🔨' },
  check: { order: 4, name: 'Check', emoji: '🔍' },
  act: { order: 5, name: 'Act', emoji: '🔄' }
};

// Task Metadata Generation
common.getPdcaTaskMetadata('design', 'login');
// → { pdcaPhase: 'design', pdcaOrder: 2, feature: 'login', ... }

// Task Subject/Description Generation
common.generatePdcaTaskSubject('design', 'login');
// → "[Design] login"

common.generatePdcaTaskDescription('design', 'login');
// → "Feature design for 'login'.\nDocument: docs/02-design/features/login.design.md"

// PDCA Status Tracking
common.findPdcaStatus();           // Read docs/.pdca-status.json
common.getCurrentPdcaPhase('login'); // Get current phase for feature
common.getPreviousPdcaPhase('check'); // → 'do'
```
```

---

## 4. _skills-overview.md 수정 사항

### 4.1 버전 업데이트 (Line 1)

**현재:**
```markdown
> 18 Skills defined in bkit (v1.2.0)
```

**수정:**
```markdown
> 18 Skills defined in bkit (v1.3.1)
```

---

## 5. _agents-overview.md 수정 사항

### 5.1 버전 정보 추가 (Line 1)

**수정:**
```markdown
> bkit에 정의된 11개 Agents 목록과 각각의 역할 (v1.3.1)
```

---

## 검증 기준

| 항목 | 기대값 | 검증 방법 |
|------|--------|----------|
| Commands 개수 | 20 | _GRAPH-INDEX.md 확인 |
| hooks.json 설명 | 3 events 모두 포함 | _hooks-overview.md 확인 |
| Task System 함수 | 8개 함수 문서화 | _scripts-overview.md 확인 |
| 버전 통일 | v1.3.1 | 모든 overview 문서 확인 |

## 구현 순서

1. _GRAPH-INDEX.md 수정
2. _hooks-overview.md 수정
3. _scripts-overview.md 수정
4. _skills-overview.md 버전 업데이트
5. _agents-overview.md 버전 업데이트
