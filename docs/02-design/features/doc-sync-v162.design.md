# Design: bkit v1.6.2 문서 동기화 (Doc-Sync)

## Executive Summary

| 관점 | 설명 |
|------|------|
| **Problem** | 17개 문서 파일이 v1.6.1 기준 수치를 포함하고 있어 코드-문서 불일치 |
| **Solution** | 파일별 정확한 변경 위치(라인/섹션)와 before→after 값을 명세하여 기계적으로 적용 |
| **Function & UX Effect** | 변경 명세를 따르면 누락 없이 일관된 동기화 가능 |
| **Core Value** | 변경 트래커블리티 보장 - 모든 수정이 추적 가능 |

---

## 변경 수치 SSOT (Single Source of Truth)

모든 파일에 동일하게 적용할 수치:

| 키 | Before | After | 비고 |
|----|--------|-------|------|
| `VERSION` | 1.6.1 | 1.6.2 | 현재 상태 참조만 변경 |
| `HOOKS_BKIT` | 10 | 12 | +PostCompact, +StopFailure |
| `HOOKS_CC` | 18 | 22 | +Elicitation, ElicitationResult, PostCompact, StopFailure |
| `AGENTS` | 21 | 29 | 문서가 21이었으나 실제 29 (CTO 5 + PM 5 + Core 11 + 8 추가) |
| `SKILLS` | 28 | 31 | 문서가 28이었으나 실제 31 |
| `EXPORTS` | 208 | 210 | +backupToPluginData, +restoreFromPluginData |
| `SCRIPTS` | 45 | 49 | +post-compaction.js, +stop-failure-handler.js 외 2개 |
| `CC_REC` | v2.1.71 | v2.1.78 | 권장 버전 |
| `TESTS` | 1,073 TC (99.6%) | 1,186 TC (99.7%) | |
| `TEMPLATES` | 28 (일부 27) | 29 | |

---

## 파일별 변경 명세

### 1. README.md (P0)

#### 1.1 버전 배지 (L3~5)
```
Before: [![Claude Code](https://img.shields.io/badge/Claude%20Code-v2.1.69+-purple.svg)]
        [![Version](https://img.shields.io/badge/Version-1.6.1-green.svg)]
After:  [![Claude Code](https://img.shields.io/badge/Claude%20Code-v2.1.69+-purple.svg)]  (유지)
        [![Version](https://img.shields.io/badge/Version-1.6.2-green.svg)]
```

#### 1.2 Context Engineering Architecture 테이블 (L39~41)
```
Before: | **Domain Knowledge** | 28 Skills |
        | **Behavioral Rules** | 21 Agents |
        | **State Management** | 208 Functions |
After:  | **Domain Knowledge** | 31 Skills |
        | **Behavioral Rules** | 29 Agents |
        | **State Management** | 210 Functions |
```

#### 1.3 5-Layer Hook System (L48~52)
```
Before: Layer 1: hooks.json (Global)     → SessionStart, UserPromptSubmit, PreCompact, PreToolUse, PostToolUse, Stop
        Layer 5: Scripts (45 modules)    → Actual Node.js execution logic...
After:  Layer 1: hooks.json (Global)     → SessionStart, UserPromptSubmit, PreCompact, PostCompact, PreToolUse, PostToolUse, Stop, StopFailure
        Layer 5: Scripts (49 modules)    → Actual Node.js execution logic...
```

#### 1.4 Features 목록 (L63)
- v1.6.2 항목을 v1.6.1 위에 추가
```
After (추가):
- **CC v2.1.78 Integration (v1.6.2)** - Hook events 10→12 (+PostCompact, +StopFailure), Agent frontmatter effort/maxTurns, ${CLAUDE_PLUGIN_DATA} backup/restore, Output tokens 64K default/128K upper (Opus 4.6), 1186 TC (99.7%), 210 exports, CC recommended v2.1.78
```

#### 1.5 컴포넌트 수치 (L87~90)
```
Before: - **28 Skills**
        - **21 Agents**
        - **45 Scripts**
        - **208 Utility Functions**
After:  - **31 Skills**
        - **29 Agents**
        - **49 Scripts**
        - **210 Utility Functions**
```

#### 1.6 Skill Evals 섹션 (L111, L128~131, L149~154)
```
Before: | **Workflow** | 9 |  (L131)
        | **Capability** | 18 |  (L132)
        | **Hybrid** | 1 |  (L133)
After:  (유지 - evals/config.json SSOT 기준, 분류 수는 변경 없음)
```
- 주의: Skill Classification 수(9W/18C/1H)는 28 기준. 31 skills에 대한 분류 반영 필요시 확인 후 적용

#### 1.7 Requirements 테이블 (L192)
```
Before: Recommended: v2.1.71
After:  Recommended: v2.1.78
```

#### 1.8 PDCA Workflow 섹션 (L340)
```
Before: ### PDCA Workflow (v1.6.1 - Skills 2.0)
After:  ### PDCA Workflow (v1.6.2 - Skills 2.0)
```

#### 1.9 Skills/Agents Reference (L462~463)
```
Before: - [Skills Reference](skills/) - 28 domain skills
        - [Agents Reference](agents/) - 21 specialized agents (including 5 CTO Team + 5 PM Team agents)
After:  - [Skills Reference](skills/) - 31 domain skills
        - [Agents Reference](agents/) - 29 specialized agents (including 5 CTO Team + 5 PM Team agents)
```

#### 1.10 Design Philosophy 섹션 (L567)
```
Before: bkit's 208 functions, 28 skills, and 21 agents
After:  bkit's 210 functions, 31 skills, and 29 agents
```

---

### 2. CHANGELOG.md (P0)

v1.6.1 항목 앞에 v1.6.2 항목을 신규 추가:

```markdown
## [1.6.2] - 2026-03-18

### Added
- **CC v2.1.78 Integration** (ENH-117~130)
  - 2 new hook events: PostCompact, StopFailure (total: 12 bkit hooks, 22 CC official)
  - Agent frontmatter: `effort` and `maxTurns` parameters for all 29 agents
  - `${CLAUDE_PLUGIN_DATA}` backup/restore support: `backupToPluginData()`, `restoreFromPluginData()`
  - Output tokens: 64K default, 128K upper limit (Opus 4.6)
  - Context window: 1M default for Max/Team/Enterprise plans
  - 2 new scripts: `post-compaction.js`, `stop-failure-handler.js`
- **Comprehensive Test Suite** (1,186 TC, +113 from v1.6.1)
  - 99.7% pass rate

### Changed
- **CC Recommended Version**: v2.1.71 → v2.1.78
- **Library Export Count**: 208 → 210 exports (+backupToPluginData, +restoreFromPluginData)
- **Document Synchronization**: All component counts corrected to actual values
  - Agents: 21 (documented) → 29 (actual), Skills: 28 → 31, Scripts: 45 → 49

### Breaking Changes
- None (backward compatible)
```

---

### 3. CUSTOMIZATION-GUIDE.md (P1)

#### 3.1 컴포넌트 테이블 (L138, L141)
```
Before: | **Scripts** | 45 |
        | **lib/** | 5 modules (208 functions) |
After:  | **Scripts** | 49 |
        | **lib/** | 5 modules (210 functions) |
```

#### 3.2 버전 이력 (L201, L203)
```
Before: > **v1.6.1**: ... 28 skills, 21 agents, 208 exports, CC v2.1.69+ required
After:  > **v1.6.2**: CC v2.1.78 Integration, Hook events 10→12, 31 skills, 29 agents, 210 exports, 49 scripts, 1186 TC (99.7%)
        > **v1.6.1**: ... (유지)
```

#### 3.3 아키텍처 다이어그램 (L284, L332)
```
Before: │  Shared Library     │ lib/ (208 funcs)    │
        Layer 5: Scripts (45 Node.js scripts)
After:  │  Shared Library     │ lib/ (210 funcs)    │
        Layer 5: Scripts (49 Node.js scripts)
```

#### 3.4 Plugin Structure (L739, L755~766)
```
Before: ### bkit Plugin Structure Example (v1.6.1 - Claude Code Exclusive)
        │   └── ... (21 total, including 5 PM Team agents)
        ├── skills/                         # Domain knowledge (28 skills)
        ├── scripts/                        # Hook execution scripts (45 scripts)
After:  ### bkit Plugin Structure Example (v1.6.2 - Claude Code Exclusive)
        │   └── ... (29 total, including 5 CTO Team + 5 PM Team agents)
        ├── skills/                         # Domain knowledge (31 skills)
        ├── scripts/                        # Hook execution scripts (49 scripts)
```

---

### 4. bkit-system/README.md (P0)

#### 4.1 버전 이력 헤더 (L37)
v1.6.2 이력 추가:
```
After (추가):
> **v1.6.2**: CC v2.1.78 Integration - Hook events 10→12 (+PostCompact, +StopFailure), Agent frontmatter effort/maxTurns, PLUGIN_DATA backup/restore, 210 exports, 29 agents, 31 skills, 49 scripts
```

#### 4.2 Trigger System 다이어그램 (L197~218)
```
Before: │                bkit Trigger System (v1.6.1)
        │  │   Skills     │───▶│   Agents     │───▶│   Scripts    │
        │  │  (28)        │    │  (21)        │    │  (45)        │
        │  │                    Hooks Layer (10 events)
After:  │                bkit Trigger System (v1.6.2)
        │  │   Skills     │───▶│   Agents     │───▶│   Scripts    │
        │  │  (31)        │    │  (29)        │    │  (49)        │
        │  │                    Hooks Layer (12 events)
```

#### 4.3 Hook events 목록 (L208~211)
PostCompact, StopFailure 추가

#### 4.4 Component Summary 테이블 (L223~233)
```
Before: | Skills | 28 |
        | Agents | 21 (16 core + 5 PM Team) |
        | Hooks | 10 events |
        | Scripts | 45 |
        | Lib | 5 modules ... (208 exports) |
        | Templates | 28 |
After:  | Skills | 31 |
        | Agents | 29 |
        | Hooks | 12 events |
        | Scripts | 49 |
        | Lib | 5 modules ... (210 exports) |
        | Templates | 29 |
```

#### 4.5 Component Counts 테이블 (L365~378)
```
Before: | Skills | 28 (9 Workflow / 18 Capability / 1 Hybrid) |
        | Agents | 21 (16 core + 5 PM Team) |
        | Library Functions | 208 |
        | Scripts | 45 |
        | Hook Events | 10 |
        | Tests | 39 files (1073 TC) |
        | CC Recommended | v2.1.71 |
After:  | Skills | 31 |
        | Agents | 29 |
        | Library Functions | 210 |
        | Scripts | 49 |
        | Hook Events | 12 |
        | Tests | (1186 TC) |
        | CC Recommended | v2.1.78 |
```

#### 4.6 Context Engineering Overview L5 hooks (L75, L79)
```
Before: │  L1: hooks.json (10 events - all hooks centralized)
        │  L5: Scripts (47 Node.js modules)
After:  │  L1: hooks.json (12 events - all hooks centralized)
        │  L5: Scripts (49 Node.js modules)
```

#### 4.7 v1.5.1 Features 섹션 (L241~242)
```
Before: | Agent Memory | memory: frontmatter in all 21 agents |
After:  | Agent Memory | memory: frontmatter in all 29 agents |
```

#### 4.8 L5 Trigger Layers (L252)
```
Before: Layer 5: Scripts             → Actual Node.js logic execution (45 modules)
After:  Layer 5: Scripts             → Actual Node.js logic execution (49 modules)
```

#### 4.9 Platform Note Components (L418~422)
```
Before: - skills/ - 28 skills
        - agents/ - 21 agents
        - scripts/ - 45 scripts (Node.js)
        - lib/ - 5 modules (208 functions)
        - templates/ - 27 templates
After:  - skills/ - 31 skills
        - agents/ - 29 agents
        - scripts/ - 49 scripts (Node.js)
        - lib/ - 5 modules (210 functions)
        - templates/ - 29 templates
```

#### 4.10 Obsidian Tip (L342)
```
Before: bkit's 28 skills, 21 agents, 45 scripts
After:  bkit's 31 skills, 29 agents, 49 scripts
```

---

### 5. bkit-system/_GRAPH-INDEX.md (P1)

#### 5.1 버전 이력 헤더
v1.6.2 이력 추가 (v1.6.1 밑에)

#### 5.2 Skills 섹션 제목 (L124)
```
Before: ## Skills (28)
After:  ## Skills (31)
```

#### 5.3 Agents 섹션 제목 (L170)
```
Before: ## Agents (21)
After:  ## Agents (29)
```

#### 5.4 Hooks 섹션 제목 (L242)
```
Before: ## Hooks (10 events)
After:  ## Hooks (12 events)
```

#### 5.5 Scripts 섹션 제목 (L251)
```
Before: ## Scripts (45)
After:  ## Scripts (49)
```

#### 5.6 Infrastructure 섹션 (L296~297)
```
Before: lib/common.js - Shared utility functions (v1.6.1, **208 exports** via bridge)
After:  lib/common.js - Shared utility functions (v1.6.2, **210 exports** via bridge)
```

#### 5.7 Components (L418~422)
```
Before: - skills/ - 28 skills
        - agents/ - 21 agents
        - scripts/ - 45 scripts
        - lib/ - 5 modules (208 functions)
        - templates/ - 27 templates
After:  - skills/ - 31 skills
        - agents/ - 29 agents
        - scripts/ - 49 scripts
        - lib/ - 5 modules (210 functions)
        - templates/ - 29 templates
```

#### 5.8 Templates 섹션 제목 (L424)
```
Before: ## Templates (27)
After:  ## Templates (29)
```

#### 5.9 Agent Memory (L209)
```
Before: All 21 agents configured with `memory:` frontmatter
After:  All 29 agents configured with `memory:` frontmatter
```

---

### 6. bkit-system/philosophy/core-mission.md (P1)

#### 6.1 Current Implementation 버전 이력 (L131)
이미 v1.6.2 라인 추가되어 있음. 확인 후 스킵 가능.

#### 6.2 Component Counts 테이블 (L135~144)
```
Before: | Skills | 28 (9 Workflow / 18 Capability / 1 Hybrid) |
        | Agents | 21 (16 core + 5 PM Team) |
        | Scripts | 45 |
        | lib/ | 5 modules (208 functions) |
        | Tests | 39 files (1073 TC) |
After:  | Skills | 31 |
        | Agents | 29 |
        | Scripts | 49 |
        | lib/ | 5 modules (210 functions) |
        | Tests | (1186 TC) |
```

#### 6.3 Agent Memory (L187~188)
```
Before: Automatic cross-session context persistence for all 21 agents.
        Scopes: project (14 agents), user (2 agents)
After:  Automatic cross-session context persistence for all 29 agents.
        (scopes 비율 업데이트 필요시 확인)
```

---

### 7. bkit-system/philosophy/context-engineering.md (P1)

#### 7.1 버전 이력 헤더 (L30 부근)
v1.6.2 이력 추가

#### 7.2 208→210 exports (7개소)
grep 결과 기반 일괄 치환:
- L119: `208 exports` → `210 exports`
- L130: `**208**` → `**210**`
- L142: `Re-exports all 208 functions` → `Re-exports all 210 functions`
- L222: `208 exports` → `210 exports`
- L246: `208 functions` → `210 functions`
- L581: `208 exports` → `210 exports`

---

### 8. bkit-system/components/agents/_agents-overview.md (P0)

#### 8.1 제목/헤더 (L1, L13)
```
Before: > List of 21 Agents defined in bkit
After:  > List of 29 Agents defined in bkit
```
v1.6.2 이력 추가

#### 8.2 Model Selection Strategy (L57~61)
opus/sonnet/haiku 수 업데이트 (29 agents 기준)

#### 8.3 Agent Memory (L270)
```
Before: All 21 agents have `memory:` frontmatter
After:  All 29 agents have `memory:` frontmatter
```

#### 8.4 Agent Source Location (L228~252)
추가된 8개 agents 파일명 추가

---

### 9. bkit-system/components/skills/_skills-overview.md (P0)

#### 9.1 제목 (L1, L3)
```
Before: > 28 Skills defined in bkit (v1.6.1)
After:  > 31 Skills defined in bkit (v1.6.2)
```

#### 9.2 Skill Classification 수 (L65, L67~82, L84~108, L109~116)
Workflow 9→?, Capability 18→?, Hybrid 1→? (실제 31 skills 분류 확인 필요)

#### 9.3 Skill List 제목 (L135)
```
Before: ## Skill List (28)
After:  ## Skill List (31)
```

#### 9.4 추가된 3개 skills 목록 추가

---

### 10. bkit-system/components/hooks/_hooks-overview.md (P0)

이미 L5에 v1.6.2 이력이 추가되어 있음. 나머지 확인:

#### 10.1 Hook Events 테이블 (L64~78)
PostCompact, StopFailure 행 추가

#### 10.2 5-Layer Hook System L1 (L34)
```
Before: hooks.json (Global) ... (이벤트 목록)
After:  PostCompact, StopFailure 추가
```

#### 10.3 v1.6.1 Hook Notes (L465~483)
```
Before: bkit v1.6.1 continues using command type hooks exclusively (10 hook events).
        CC official hook events total: 18 (bkit uses 10/18 = 56%)
After:  bkit v1.6.2 uses 12 hook events (command type).
        CC official hook events total: 22 (bkit uses 12/22 = 55%)
```

---

### 11. bkit-system/components/scripts/_scripts-overview.md (P1)

#### 11.1 제목 (L1)
```
Before: > 45 Node.js Scripts used by bkit hooks (v1.6.1)
After:  > 49 Node.js Scripts used by bkit hooks (v1.6.2)
```

#### 11.2 버전 이력 (L14)
v1.6.2 이력 추가

#### 11.3 Source Location (L79)
```
Before: lib/ ... # Modular Library (v1.6.1, 208 exports)
After:  lib/ ... # Modular Library (v1.6.2, 210 exports)
```

#### 11.4 Library Modules 테이블 (L224, L238, L240)
```
Before: 208 exports
After:  210 exports
```

#### 11.5 신규 스크립트 2개 파일 목록 추가
`post-compaction.js`, `stop-failure-handler.js`

---

### 12. bkit-system/triggers/trigger-matrix.md (P1)

#### 12.1 제목 버전 (L1, L3)
```
Before: > Core matrix ... (v1.6.1)
After:  > Core matrix ... (v1.6.2)
```

#### 12.2 Hook Event Reference (L9~23)
PostCompact, StopFailure 행 추가
```
Before: Total: 10 hook events.
After:  Total: 12 hook events.
```

---

### 13. bkit-system/testing/test-checklist.md (P2)

#### 13.1 v1.6.0 Integration Tests (L414)
```
Before: V16-T01: Total exports count = 208
        V16-T02: Total agents = 21
        V16-T03: Total skills = 28
        V16-T04: CC v2.1.71 compatibility | All 10 hook events fire correctly
After:  값 업데이트 (210, 29, 31, 12 events)
```

---

### 14~17. 기타 파일 (P2)

#### skills/skill-status/SKILL.md
```
Before: Layer: bkit Core (v1.6.1)
After:  Layer: bkit Core (v1.6.2)
```

#### evals/README.md
```
Before: v1.6.1 ENH-88
After:  v1.6.2 ENH-88 (또는 현재 ENH 번호 유지)
```

#### skill-creator/README.md
```
Before: v1.6.1 ENH-97
After:  v1.6.2 ENH-97 (또는 현재 ENH 번호 유지)
```

---

## 구현 순서

| 순서 | 작업 | 파일 수 | 예상 변경점 |
|:----:|------|:-------:|:-----------:|
| 1 | CHANGELOG.md 신규 항목 추가 | 1 | 1 섹션 |
| 2 | README.md 전면 업데이트 | 1 | ~10개소 |
| 3 | bkit-system/README.md 업데이트 | 1 | ~10개소 |
| 4 | _agents-overview.md 업데이트 | 1 | ~5개소 |
| 5 | _skills-overview.md 업데이트 | 1 | ~5개소 |
| 6 | _hooks-overview.md 확인/보완 | 1 | ~3개소 |
| 7 | CUSTOMIZATION-GUIDE.md | 1 | ~5개소 |
| 8 | _GRAPH-INDEX.md | 1 | ~8개소 |
| 9 | core-mission.md | 1 | ~3개소 |
| 10 | context-engineering.md | 1 | ~7개소 (208→210) |
| 11 | _scripts-overview.md | 1 | ~5개소 |
| 12 | trigger-matrix.md | 1 | ~3개소 |
| 13 | P2 파일들 (4개) | 4 | 각 1개소 |
| **합계** | | **17** | **~65개소** |

## 검증 방법

```bash
# 변경 후 검증 명령어
# 1. 대상 파일에서 v1.6.1이 현재 상태로 남아있는지 확인 (이력 제외)
grep -rn "v1\.6\.1" README.md CUSTOMIZATION-GUIDE.md bkit-system/README.md --include="*.md" | grep -v "v1\.6\.0\|history\|Previous\|이력"

# 2. 수치 일관성 확인
grep -rn "\b21 [Aa]gent\|\b28 [Ss]kill\|\b45 [Ss]cript\|\b208 " README.md CUSTOMIZATION-GUIDE.md bkit-system/ --include="*.md"

# 3. CHANGELOG v1.6.2 항목 존재 확인
grep "1\.6\.2" CHANGELOG.md
```
