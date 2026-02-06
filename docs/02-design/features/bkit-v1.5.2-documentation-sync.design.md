# bkit v1.5.2 Documentation Synchronization Design

> **Summary**: v1.5.2 변경 사항을 17개 파일, 71개 항목에 반영하는 상세 변경 명세
>
> **Project**: bkit-claude-code
> **Version**: 1.5.2
> **Author**: CTO Team (4-agent 병렬 분석 기반)
> **Date**: 2026-02-06
> **Status**: Draft
> **Plan Reference**: docs/01-plan/features/bkit-v1.5.2-documentation-sync.plan.md

---

## 1. 설계 목표

### 1.1 핵심 원칙

| 원칙 | 적용 방법 |
|------|----------|
| **Docs = Code** | 실제 파일 수와 문서 수치 100% 일치 |
| **일관성** | 모든 문서에서 동일한 수치 사용 |
| **정확성** | `find` 명령으로 검증된 실제 값 기반 |
| **최소 변경** | 수치/버전만 변경, 문장 구조 유지 |

### 1.2 실제 검증된 구성요소 수치

| Component | 실제 값 | 검증 방법 |
|-----------|:------:|----------|
| Skills | **26** | `find skills -name "SKILL.md" \| wc -l` |
| Agents | **16** | `find agents -name "*.md" \| wc -l` |
| Templates | **27** | `find templates -name "*.md" \| wc -l` |
| Scripts | **43** | `find scripts -name "*.js" \| wc -l` |
| Library Functions | **165** | lib/ 모듈 export 합계 |
| Library Modules | **5** | core, pdca, intent, task, team |

---

## 2. Category C: 설정/플러그인 파일 (Phase 1)

### 2.1 bkit.config.json — 1개 항목

| Line | Current | After |
|:----:|---------|-------|
| 3 | `"version": "1.5.1",` | `"version": "1.5.2",` |

### 2.2 .claude-plugin/plugin.json — 1개 항목

| Line | Current | After |
|:----:|---------|-------|
| 3 | `"version": "1.5.1",` | `"version": "1.5.2",` |

### 2.3 .claude-plugin/marketplace.json — 2개 항목

| Line | Current | After |
|:----:|---------|-------|
| 4 | `"version": "1.5.1",` | `"version": "1.5.2",` |
| 37 | `"version": "1.5.1",` | `"version": "1.5.2",` |

### 2.4 hooks/hooks.json — 1개 항목

| Line | Current | After |
|:----:|---------|-------|
| 3 | `"description": "bkit Vibecoding Kit v1.5.1 - Claude Code",` | `"description": "bkit Vibecoding Kit v1.5.2 - Claude Code",` |

### 2.5 hooks/session-start.js — 7개 항목

| Line | Current | After |
|:----:|---------|-------|
| 3 | `* bkit Vibecoding Kit - SessionStart Hook (v1.5.1)` | `* bkit Vibecoding Kit - SessionStart Hook (v1.5.2)` |
| 6 | `* v1.5.1 Changes:` | `* v1.5.2 Changes:` |
| 485 | `` `# bkit Vibecoding Kit v1.5.1 - Session Startup\n\n` `` | `` `# bkit Vibecoding Kit v1.5.2 - Session Startup\n\n` `` |
| 511 | `// v1.5.1: Feature Awareness` | `// v1.5.2: Feature Awareness` |
| 549 | `` `## Output Styles (v1.5.1)\n` `` | `` `## Output Styles (v1.5.2)\n` `` |
| 605 | `bkit Feature Usage Report (v1.5.1` | `bkit Feature Usage Report (v1.5.2` |
| 661 | `bkit Vibecoding Kit v1.5.1 activated` | `bkit Vibecoding Kit v1.5.2 activated` |

---

## 3. Category A: 루트 문서 (Phase 2)

### 3.1 README.md — 4개 항목

| Line | Type | Current | After |
|:----:|------|---------|-------|
| 5 | 버전 배지 | `Version-1.5.1-green` | `Version-1.5.2-green` |
| 37 | Skills 수 | `21 Skills` | `26 Skills` |
| 74 | Skills 수 | `**21 Skills**` | `**26 Skills**` |
| 336 | Skills 수 | `22 domain skills` | `26 domain skills` |

> **Note**: Line 61-63의 `(v1.5.1)` 표기는 기능 도입 시점이므로 유지

### 3.2 CHANGELOG.md — 신규 섹션 추가

**위치**: Line 7 이후 (v1.5.1 섹션 앞에 삽입)

```markdown
## [1.5.2] - 2026-02-06

### Added
- **bkend.ai BaaS Expert Enhancement**
  - 5 new bkend specialist Skills (21 → 26 total):
    - `bkend-quickstart`: Platform onboarding, MCP setup, resource hierarchy
    - `bkend-data`: Database expert (table creation, CRUD, 7 column types, filtering)
    - `bkend-auth`: Authentication expert (email/social login, JWT, RBAC, RLS)
    - `bkend-storage`: File storage expert (Presigned URL, 4 visibility levels)
    - `bkend-cookbook`: Practical tutorials (10 project guides, troubleshooting)
  - Shared template: `templates/shared/bkend-patterns.md`
  - Agent-Skill binding: `bkend-expert` preloads 3 core skills (data, auth, storage)
  - MCP auto-detection in session start and prompt handler

### Changed
- **agents/bkend-expert.md**: Complete rewrite (~215 lines)
  - MCP Tools reference (19 tools: 8 guide + 11 API)
  - REST Service API endpoints (Database 5, Auth 18, Storage 12)
  - OAuth 2.1 + PKCE authentication pattern
  - Troubleshooting table (12+ scenarios)
- **skills/dynamic/SKILL.md**: MCP integration modernization
  - MCP setup: `npx @bkend/mcp-server` → `claude mcp add bkend --transport http`
  - Authentication: API Key → OAuth 2.1 + PKCE
- **skills/phase-4-api/SKILL.md**: BaaS implementation guide added
- **lib/intent/language.js**: bkend-expert 8-language trigger patterns
- **hooks/session-start.js**: bkend MCP status detection
- **templates/plan.template.md**: BaaS architectural options added
- **templates/design.template.md**: BaaS architecture patterns added

### Fixed
- **BUG-01 (Critical)**: `scripts/user-prompt-handler.js` Line 72
  - Agent trigger confidence: `> 0.8` → `>= 0.8`
  - Impact: All 16 agents' implicit triggers were broken in UserPromptSubmit hook

### Compatibility
- Claude Code: Minimum v2.1.15, Recommended v2.1.33
- Node.js: Minimum v18.0.0
- bkend.ai: MCP endpoint via OAuth 2.1 + PKCE
```

### 3.3 CUSTOMIZATION-GUIDE.md — 19개 항목

#### 버전 참조 (v1.5.1 → v1.5.2)

| Line | Current | After |
|:----:|---------|-------|
| 131 | `### Component Inventory (v1.5.1)` | `### Component Inventory (v1.5.2)` |
| 141 | `Modular utility library (v1.5.1)` | `Modular utility library (v1.5.2)` |
| 142 | `Level-based response formatting (v1.5.1)` | `Level-based response formatting (v1.5.2)` |
| 146 | `### Library Module Structure (v1.5.1)` | `### Library Module Structure (v1.5.2)` |
| 177 | `CTO-Led Agent Teams (8 files, 30 exports) - v1.5.1` | `CTO-Led Agent Teams (8 files, 30 exports) - v1.5.2` |
| 200 | `> **v1.5.1**: Claude Code Exclusive` | `> **v1.5.2**: Claude Code Exclusive` |
| 202 | `### Context Engineering Architecture (v1.5.1)` | `### Context Engineering Architecture (v1.5.2)` |
| 682 | `> **Note (v1.5.1)**: bkit is Claude Code exclusive` | `> **Note (v1.5.2)**: bkit is Claude Code exclusive` |
| 731 | `### bkit Plugin Structure Example (v1.5.1` | `### bkit Plugin Structure Example (v1.5.2` |
| 759 | `Level-based response formatting (v1.5.1)` | `Level-based response formatting (v1.5.2)` |
| 764 | `Migration Bridge (v1.5.1)` | `Migration Bridge (v1.5.2)` |
| 769 | `CTO-Led Agent Teams (8 files, v1.5.1)` | `CTO-Led Agent Teams (8 files, v1.5.2)` |
| 775 | `> **v1.5.1**: All plugin components` | `> **v1.5.2**: All plugin components` |

#### 수치 변경

| Line | Type | Current | After |
|:----:|------|---------|-------|
| 136 | Skills 수 | `21` | `26` |
| 213 | Skills 수 | `(21 Skills)` | `(26 Skills)` |
| 264 | 다이어그램 버전 | `v1.4.3` | `v1.5.2` |
| 267 | Skills 수 | `Skills (21)` | `Skills (26)` |
| 748 | Skills 수 | `Domain knowledge (21 skills)` | `Domain knowledge (26 skills)` |

#### Agents 설명 정리

| Line | Current | After |
|:----:|---------|-------|
| 135 | `16 \| Specialized AI subagents with memory persistence (11 core + 5 CTO Team)` | `16 \| Specialized AI subagents with memory persistence` |

### 3.4 AI-NATIVE-DEVELOPMENT.md — 5개 항목

| Line | Type | Current | After |
|:----:|------|---------|-------|
| 17 | Mermaid Skills 수 | `21 Skills` | `26 Skills` |
| 141 | ASCII Skills 수 | `Domain Knowledge (21 Skills)` | `Domain Knowledge (26 Skills)` |
| 179 | 테이블 Skills 수 | `Skill System (21 skills)` | `Skill System (26 skills)` |
| 188 | 다이어그램 Skills 수 | `21 Skills (structured instructions)` | `26 Skills (structured instructions)` |
| 230 | 섹션 헤더 버전 | `CTO-Led Agent Teams (v1.5.1)` | `CTO-Led Agent Teams (v1.5.2)` |

---

## 4. Category B: bkit-system/ 문서 (Phase 3)

### 4.1 bkit-system/README.md — 4개 항목

| Line | Type | Current | After |
|:----:|------|---------|-------|
| 48 | Skills 수 | `(21 Skills)` | `(26 Skills)` |
| 208 | Skills 수 | `Skills \| 22` | `Skills \| 26` |
| 213 | Lib 수 | `4 modules \| ... (132 functions)` | `5 modules \| ... (165 functions)` |
| 215 | Templates 수 | `Templates \| 23` | `Templates \| 27` |
| 324 | 팁 문구 Skills | `21 skills, 11 agents, 39 scripts` | `26 skills, 16 agents, 43 scripts` |

### 4.2 bkit-system/_GRAPH-INDEX.md — 5개 항목

| Line | Type | Current | After |
|:----:|------|---------|-------|
| 33 | Skills 수 | `Domain Knowledge (21 Skills)` | `Domain Knowledge (26 Skills)` |
| 49 | 섹션 제목 | `## Skills (21)` | `## Skills (26)` |
| 328 | Skills 카운트 | `skills/ - 22 skills` | `skills/ - 26 skills` |
| 331 | Lib 카운트 | `lib/ - 4 modules (132 functions)` | `lib/ - 5 modules (165 functions)` |
| 332 | Templates 카운트 | `templates/ - 23 templates` | `templates/ - 27 templates` |

> **Note**: Line 334의 `## Templates (20)` 헤더도 `## Templates (27)`로 수정

### 4.3 bkit-system/components/skills/_skills-overview.md — 3개 항목

| Line | Type | Current | After |
|:----:|------|---------|-------|
| 3 | 헤더 설명 | `> 21 Skills defined in bkit (v1.4.5)` | `> 26 Skills defined in bkit (v1.5.2)` |
| 57 | 섹션 제목 | `## Skill List (22)` | `## Skill List (26)` |

**추가 작업**: bkend Skills 5개를 Skill List에 추가

```markdown
### bkend Specialist Skills (v1.5.2)

| Skill | Level | Description |
|-------|-------|-------------|
| bkend-quickstart | Dynamic | Platform onboarding, MCP setup, resource hierarchy |
| bkend-data | Dynamic | Database expert (CRUD, column types, filtering) |
| bkend-auth | Dynamic | Authentication (email/social, JWT, RBAC, RLS) |
| bkend-storage | Dynamic | File storage (Presigned URL, visibility levels) |
| bkend-cookbook | Dynamic | Practical tutorials and troubleshooting |
```

### 4.4 bkit-system/components/scripts/_scripts-overview.md — 2개 항목

| Line | Type | Current | After |
|:----:|------|---------|-------|
| 71 | Lib 버전/수 | `Modular Library (v1.4.7, 132 functions)` | `Modular Library (v1.5.2, 165 functions)` |
| 228 | common.js 수 | `common.js \| 1 \| 132` | `common.js \| 1 \| 165` |

### 4.5 bkit-system/philosophy/context-engineering.md — 3개 항목

| Line | Type | Current | After |
|:----:|------|---------|-------|
| 100 | 섹션 제목 | `### 1. Domain Knowledge Layer (21 Skills)` | `### 1. Domain Knowledge Layer (26 Skills)` |
| 341 | Skills 수 | `Skills \| ... \| 22` | `Skills \| ... \| 26` |
| 344 | Templates 수 | `Templates \| ... \| 23` | `Templates \| ... \| 27` |
| 345 | Lib 수 | `160+ functions` | `165 functions` |

### 4.6 bkit-system/philosophy/core-mission.md — 3개 항목

| Line | Type | Current | After |
|:----:|------|---------|-------|
| 128 | Skills 수 | `Skills \| 22` | `Skills \| 26` |
| 132 | Templates 수 | `Templates \| 23` | `Templates \| 27` |
| 133 | Lib 수 | `5 modules (160+ functions)` | `5 modules (165 functions)` |

### 4.7 bkit-system/triggers/trigger-matrix.md — 1개 항목

**추가 작업**: bkend-expert 트리거 정보가 최신 8-language 패턴을 반영하는지 확인 후 업데이트

### 4.8 bkit-system/components/agents/_agents-overview.md — 1개 항목

**추가 작업**: bkend-expert 행에 `(v1.5.2 Enhanced)` 버전 노트 추가

---

## 5. CHANGELOG 상세 설계

### 5.1 구조

```
## [1.5.2] - 2026-02-06

### Added (5개 항목)
- bkend specialist Skills 5개
- Shared template 1개
- Agent-Skill binding
- MCP auto-detection
- bkend recommendation logic

### Changed (7개 파일)
- bkend-expert agent 재작성
- dynamic skill MCP 현대화
- phase-4-api BaaS 가이드
- language.js 트리거 패턴
- session-start.js bkend 인식
- plan/design templates

### Fixed (1건)
- BUG-01: Agent trigger confidence

### Compatibility
- Claude Code, Node.js, bkend.ai 요구사항
```

### 5.2 소스 참조

CHANGELOG 내용은 기존 보고서에서 추출:
- `docs/04-report/features/bkit-v1.5.2-bkend-expert-enhancement.report.md`
- `docs/02-design/features/bkit-v1.5.2-bkend-expert-enhancement.design.md`

---

## 6. 구현 가이드

### 6.1 작업 순서 (Phase별)

```
Phase 1: 설정 파일 (5개 파일, 12개 항목)
├── bkit.config.json (1)
├── .claude-plugin/plugin.json (1)
├── .claude-plugin/marketplace.json (2)
├── hooks/hooks.json (1)
└── hooks/session-start.js (7)

Phase 2: 루트 문서 (4개 파일, 29개 항목)
├── README.md (4)
├── CHANGELOG.md (1 = 신규 섹션)
├── CUSTOMIZATION-GUIDE.md (19)
└── AI-NATIVE-DEVELOPMENT.md (5)

Phase 3: bkit-system 문서 (8개 파일, 22개 항목)
├── README.md (5)
├── _GRAPH-INDEX.md (6)
├── components/skills/_skills-overview.md (3)
├── components/scripts/_scripts-overview.md (2)
├── philosophy/context-engineering.md (4)
├── philosophy/core-mission.md (3)
├── triggers/trigger-matrix.md (1)
└── components/agents/_agents-overview.md (1)

Phase 4: 검증
├── grep -rn "1\.5\.1" (CHANGELOG 제외)
├── grep -rn "21 Skills\|22 skills"
├── grep -rn "23 templates"
└── grep -rn "132 functions\|141 functions"
```

### 6.2 병렬 실행 가능 여부

| Phase | 병렬 | 이유 |
|:-----:|:----:|------|
| 1 | Yes | 파일 간 의존성 없음 |
| 2 | Yes | 파일 간 의존성 없음 |
| 3 | Yes | 파일 간 의존성 없음 |
| 4 | Sequential | Phase 1-3 완료 후 실행 |

> **권장**: Phase 1+2+3을 CTO 팀 3-agent 병렬로 동시 실행, Phase 4는 리더가 직접 검증

---

## 7. 검증 계획

### 7.1 자동 검증 (grep)

| 검증 항목 | 명령 | 기대 결과 |
|----------|------|----------|
| v1.5.1 잔존 | `grep -rn "1\.5\.1" --include="*.md" --include="*.json" --include="*.js" \| grep -v CHANGELOG \| grep -v node_modules` | 0건 (히스토리 참조 제외) |
| Skills 21/22 잔존 | `grep -rn "21 [Ss]kills\|22 [Ss]kills\|Skills.*21\|Skills.*22" --include="*.md"` | 0건 |
| Templates 23 잔존 | `grep -rn "23 [Tt]emplates\|Templates.*23" --include="*.md"` | 0건 |
| Lib 132/141 잔존 | `grep -rn "132 functions\|141 functions\|160+" --include="*.md"` | 0건 |

### 7.2 수동 검증

| 항목 | 방법 |
|------|------|
| CHANGELOG 완성도 | Added/Changed/Fixed/Compatibility 4개 섹션 존재 확인 |
| 신규 Skill 목록 | _skills-overview.md에 5개 bkend Skills 존재 확인 |
| 설정 파일 일치 | 4개 JSON/JS 파일의 version 값 = "1.5.2" |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-06 | 초기 Design - 17개 파일, 71개 항목 상세 명세 | CTO Team |
