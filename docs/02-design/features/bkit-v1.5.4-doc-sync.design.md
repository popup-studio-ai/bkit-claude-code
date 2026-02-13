# bkit v1.5.4 문서 동기화 상세 설계서

> **Feature**: bkit-v1.5.4-doc-sync
> **Level**: Dynamic
> **Date**: 2026-02-14
> **Author**: CTO Lead (Claude Opus 4.6)
> **Status**: Draft
> **Branch**: feature/v1.5.4-bkend-mcp-accuracy-fix
> **Plan**: docs/01-plan/features/bkend-mcp-accuracy-fix.plan.md
> **Design (구현)**: docs/02-design/features/bkend-mcp-accuracy-fix.design.md

---

## 0. 설계 목적

v1.5.4의 핵심 기능(bkend MCP 정확도 개선)은 구현 완료되었으나, 다음 영역의 문서-코드 동기화가 미완료 상태:

1. **버전 문자열** — plugin.json, marketplace.json, hooks.json, session-start.js, bkit.config.json, README.md 등에 `1.5.3`이 잔존
2. **CHANGELOG.md** — v1.5.4 릴리스 노트 미작성
3. **상위 문서** — README.md, AI-NATIVE-DEVELOPMENT.md, CUSTOMIZATION-GUIDE.md에 v1.5.4 변경사항 미반영
4. **bkit-system/ 참조 문서** (17개 파일) — 컴포넌트 카운트, 버전 참조 불일치
5. **lib/ 주석 오류** — common.js, core/index.js, team/index.js의 export count 주석이 실제와 불일치

### v1.5.4 변경 요약 (구현 완료)

| 항목 | v1.5.3 | v1.5.4 | Delta |
|------|:------:|:------:|:-----:|
| bkend MCP 도구 수 | 19 (부정확) | 28+ (정확) | +9 |
| bkend-patterns.md | 85줄 | 140줄 | +55줄 |
| bkend-expert.md | 231줄 | 278줄 | +47줄 |
| bkend-data SKILL | 122줄 | 150줄 | +28줄 |
| bkend-quickstart SKILL | 118줄 | 153줄 | +35줄 |
| bkend-storage SKILL | 110줄 | 127줄 | +17줄 |
| bkend-auth SKILL | 118줄 | 126줄 | +8줄 |
| session-start.js | Dynamic만 | Dynamic+Enterprise | GAP-10 |
| 토큰 예산 | ~6,400 | ~7,800 | +22% |
| 종합 테스트 | - | 764/765 PASS | 100% |

---

## 1. 버전 문자열 업데이트

### 1.1 .claude-plugin/plugin.json

| 라인 | 현재 | 변경 |
|:----:|------|------|
| 3 | `"version": "1.5.3"` | `"version": "1.5.4"` |

### 1.2 .claude-plugin/marketplace.json

| 라인 | 현재 | 변경 |
|:----:|------|------|
| 3 | `"version": "1.5.3"` | `"version": "1.5.4"` |
| 38 | `"version": "1.5.3"` (bkit 플러그인 엔트리) | `"version": "1.5.4"` |

### 1.3 hooks/hooks.json

| 라인 | 현재 | 변경 |
|:----:|------|------|
| 3 | `"description": "bkit Vibecoding Kit v1.5.3 - Claude Code"` | `"description": "bkit Vibecoding Kit v1.5.4 - Claude Code"` |

### 1.4 hooks/session-start.js (5곳)

| 라인 | 현재 | 변경 |
|:----:|------|------|
| 3 | `SessionStart Hook (v1.5.3)` | `SessionStart Hook (v1.5.4)` |
| 490 | `bkit Vibecoding Kit v1.5.3 - Session Startup` | `bkit Vibecoding Kit v1.5.4 - Session Startup` |
| 554 | `Output Styles (v1.5.3)` | `Output Styles (v1.5.4)` |
| 611 | `bkit Feature Usage Report (v1.5.3` | `bkit Feature Usage Report (v1.5.4` |
| 667 | `systemMessage: bkit Vibecoding Kit v1.5.3 activated` | `systemMessage: bkit Vibecoding Kit v1.5.4 activated` |

### 1.5 bkit.config.json

| 라인 | 현재 | 변경 |
|:----:|------|------|
| 3 | `"version": "1.5.3"` | `"version": "1.5.4"` |

### 1.6 README.md

| 라인 | 현재 | 변경 |
|:----:|------|------|
| 5 | `Version-1.5.3-green` | `Version-1.5.4-green` |

### 1.7 lib/ @version 태그 (6곳)

| 파일 | 현재 @version | 변경 |
|------|:------------:|:----:|
| `lib/common.js` | 1.5.3 | 1.5.4 |
| `lib/core/index.js` | 1.5.1 | 1.5.4 |
| `lib/pdca/index.js` | 1.5.2 | 1.5.4 |
| `lib/intent/index.js` | 1.4.7 | 1.5.4 |
| `lib/task/index.js` | 1.4.7 | 1.5.4 |
| `lib/team/index.js` | 1.5.1 | 1.5.4 |

> **총 버전 문자열 변경**: 17곳 (6파일 + lib/ 6파일)

---

## 2. CHANGELOG.md — v1.5.4 릴리스 노트

`## [1.5.3]` 앞에 삽입:

```markdown
## [1.5.4] - 2026-02-14

### Added
- **bkend MCP 정확도 개선 (10 GAPs)**
  - MCP 도구 커버리지: 19 (부분) → 28+ (완전)
  - MCP Fixed Tools: `get_context`, `search_docs`, `get_operation_schema`
  - MCP Project Management Tools: 9 도구 (프로젝트/환경 CRUD)
  - MCP Table Management Tools: 11 도구 (테이블/스키마/인덱스 관리)
  - MCP Data CRUD Tools: 5 도구 (`backend_data_list/get/create/update/delete`)
  - MCP Resources: 4 URI 패턴 (`bkend://` 스킴)
  - Searchable Docs: 8 Doc ID (`search_docs` 쿼리 지원)
- **bkend-patterns.md SSOT 확장**
  - 공유 패턴 문서: 85줄 → 140줄 (+65%)
  - 신규 섹션: REST API 응답 형식, 쿼리 파라미터, 파일 업로드, MCP 설정, OAuth 2.1
- **bkend-expert 에이전트 전면 리라이트**
  - MCP 도구 4개 카테고리 분류 (Fixed/Project/Table/Data CRUD)
  - 동적 Base URL (`get_context`에서 획득, 하드코딩 금지)
  - MCP Resources (`bkend://` URI) 참조 추가
  - Live Reference URL: `src/` → `en/` 경로 구조 전환

### Changed
- **bkend-data/SKILL.md**: ID 필드 `_id` → `id` 수정, Data CRUD 도구 추가, 필터 연산자 `$` 접두사 추가
- **bkend-auth/SKILL.md**: MCP Auth Workflow 패턴 도입, REST 엔드포인트 18 → 12 핵심으로 정리, 소셜 로그인 엔드포인트 통합
- **bkend-storage/SKILL.md**: MCP Storage Workflow 추가, Multipart Upload 4 엔드포인트 추가, `download-url` 메서드 GET → POST 수정
- **bkend-quickstart/SKILL.md**: 번호형 도구명 → 실명 전환, Project Management 9 도구 + Resources 4 URI 추가
- **bkend-cookbook/SKILL.md**: Live Reference URL `src/` → `en/` 경로 수정
- **session-start.js**: bkend MCP 상태 체크 `Dynamic` → `Dynamic || Enterprise` 확장 (GAP-10)
- **전체 Live Reference URL**: `src/` 디렉토리 경로 → `en/` 구체적 파일 경로 통일

### Removed
- **bkend-expert.md**: 폐기된 번호형 Guide Tools 참조 (`0_get_context` ~ `7_code_examples_data`)
- **bkend-auth/SKILL.md**: Account Lifecycle 섹션 (search_docs로 대체)
- **bkend-data/SKILL.md**: `backend_table_update` 도구 (존재하지 않는 도구)

### Quality
- Comprehensive Test Round 1: 708 TC, 705 PASS, 0 FAIL, 3 SKIP (100%)
- Comprehensive Test Round 2: 765 TC, 764 PASS, 0 FAIL, 1 SKIP (100%)
- bkend MCP Accuracy Fix: 10/10 GAPs, 42/42 items, 100% match rate

---
```

---

## 3. README.md 상세 변경

### 3.1 버전 배지 (라인 5)

```
현재: [![Version](https://img.shields.io/badge/Version-1.5.3-green.svg)](CHANGELOG.md)
변경: [![Version](https://img.shields.io/badge/Version-1.5.4-green.svg)](CHANGELOG.md)
```

### 3.2 기능 설명 추가 (라인 61 부근)

현재 첫 번째 피처가 `Team Visibility & State Writer (v1.5.3)`인 목록에 v1.5.4 항목 추가:

```markdown
- **bkend MCP Accuracy Fix (v1.5.4)** - MCP tool coverage 19→28+, accurate tool names, dynamic Base URL, search_docs workflow
```

> **참고**: README.md의 나머지 컴포넌트 카운트(26 Skills, 16 Agents, 45 Scripts, 241 Functions)는 v1.5.4에서 변경 없음. 버전 배지와 피처 목록만 업데이트.

---

## 4. AI-NATIVE-DEVELOPMENT.md 변경

### 4.1 컴포넌트 카운트 (변경 없음 확인)

v1.5.4에서 스킬/에이전트/스크립트/함수 개수 변동 없음. 버전 참조 업데이트 불필요.
해당 문서는 **방법론 문서**로 특정 버전 번호를 기재하지 않으므로 변경 불필요.

### 4.2 v1.5.4 관련 추가 (선택적)

없음. bkend MCP 정확도 개선은 방법론 레벨 변경이 아닌 콘텐츠 정확도 개선이므로 AI-NATIVE-DEVELOPMENT.md 수정 대상 아님.

---

## 5. CUSTOMIZATION-GUIDE.md 변경

### 5.1 컴포넌트 인벤토리 테이블 (라인 131~143)

| 현재 | 변경 여부 | 사유 |
|------|:--------:|------|
| `Agents: 16` | 유지 | 변동 없음 |
| `Skills: 26` | 유지 | 변동 없음 |
| `Scripts: 45` | 유지 | 변동 없음 |
| `Templates: 27` | 유지 | 변동 없음 |
| `Hooks: 10 events` | 유지 | 변동 없음 |
| `lib/: 5 modules (241 functions)` | 유지 | 변동 없음 |
| `Output Styles: 4` | 유지 | 변동 없음 |

### 5.2 버전 참조 (라인 201)

```
현재: > **v1.5.3**: Claude Code Exclusive with CTO-Led Agent Teams...
변경: > **v1.5.4**: Claude Code Exclusive with CTO-Led Agent Teams (16 agents), bkend MCP Accuracy Fix (28+ tools), Output Styles, Agent Memory, and Team Visibility
```

### 5.3 Compatibility 섹션 (해당 시)

```
현재: - **Claude Code**: Minimum v2.1.15, Recommended v2.1.33
변경: - **Claude Code**: Minimum v2.1.33+, Recommended v2.1.41
```

> **근거**: v2.1.33부터 TeammateIdle/TaskCompleted 훅 이벤트 지원. hooks.json 로드 실패 방지.

---

## 6. lib/ 주석 오류 수정

### 6.1 lib/common.js — Export Count 주석 수정

| 라인 | 현재 주석 | 실제 | 변경 |
|:----:|----------|:----:|------|
| ~29 | `Core Module (37 exports)` | 41 | `Core Module (41 exports)` |
| ~86 | `PDCA Module (50 exports)` | 54 | `PDCA Module (54 exports)` |
| ~221 | `Team Module (39 exports)` | 40 | `Team Module (40 exports)` |

**총 합계 주석도 업데이트**: `180 exports` 유지 (41+54+19+26+40=180, bridge export 수 정확)

### 6.2 lib/core/index.js — 카테고리별 주석 수정

| 카테고리 | 현재 주석 | 실제 | 변경 |
|----------|----------|:----:|------|
| Platform | `(8 exports)` | 9 | `(9 exports)` |
| Cache | `(6 exports)` | 7 | `(7 exports)` |

### 6.3 lib/team/index.js — 카테고리 주석 수정

| 카테고리 | 현재 주석 | 실제 | 변경 |
|----------|----------|:----:|------|
| Orchestrator | `(5 exports)` | 6 | `(6 exports)` |

### 6.4 lib/pdca/index.js — 해더 주석 수정

| 현재 | 실제 | 변경 |
|------|:----:|------|
| `PDCA Module - 50 exports` (해더) | 54 | `PDCA Module - 54 exports` |

> **참고**: pdca/index.js의 Status 카테고리에 `readBkitMemory`, `writeBkitMemory`가 v1.5.3에서 추가되었으나 해더의 총 카운트가 미갱신 상태.

---

## 7. bkit-system/ 문서 동기화 (17개 파일)

### 7.1 변경 대상 분류

**v1.5.4에서 실질적으로 변경된 수치가 없으므로** (스킬/에이전트/스크립트/함수 개수 동일), bkit-system/ 문서의 **버전 히스토리 추가**와 **기존 부정확 수치 교정**이 주요 작업.

#### Priority 1: 버전 히스토리 추가 (5개 파일)

| 파일 | 변경 내용 |
|------|----------|
| `bkit-system/README.md` | v1.5.4 릴리스 항목 추가 (bkend MCP accuracy fix) |
| `bkit-system/_GRAPH-INDEX.md` | v1.5.4 항목 추가 |
| `bkit-system/components/skills/_skills-overview.md` | bkend skills v1.5.4 변경사항 반영 (MCP 도구명 전환) |
| `bkit-system/components/hooks/_hooks-overview.md` | v1.5.4 session-start.js GAP-10 수정 기록 |
| `bkit-system/testing/test-checklist.md` | v1.5.4 테스트 케이스 추가 (bkend MCP 55 TC) |

#### Priority 2: 기존 부정확 수치 교정 (7개 파일)

| 파일 | 교정 대상 | 현재 | 올바른 값 |
|------|----------|:----:|:---------:|
| `README.md` (bkit-system) | Hook 이벤트 수 (아키텍처 다이어그램) | 5-6 | 10 |
| `_GRAPH-INDEX.md` | bkend specialist skills 언급 | 미기재 | 5개 명시 |
| `components/agents/_agents-overview.md` | 에이전트 상세 목록 | 11개만 나열 | 16개 전체 나열 |
| `components/scripts/_scripts-overview.md` | 함수 카운트 (v1.4.7 참조) | 132 | 241 (v1.5.3~) |
| `scenarios/scenario-discover-features.md` | Output Styles 수 | 3 | 4 (bkit-pdca-enterprise 추가) |
| `scenarios/scenario-discover-features.md` | Agent Teams 팀원 수 | Dynamic: 2 | Dynamic: 3 |
| `triggers/trigger-matrix.md` | Hook 이벤트 수 | 6 | 10 |

#### Priority 3: v1.5.4 특화 내용 추가 (5개 파일)

| 파일 | 추가 내용 |
|------|----------|
| `philosophy/core-mission.md` | bkend MCP accuracy를 "No Guessing" 철학 사례로 추가 |
| `philosophy/context-engineering.md` | MCP 도구 정확도의 Context Engineering 의미 추가 |
| `scenarios/scenario-new-feature.md` | Team-based 기능 구현 시나리오 추가 |
| `scenarios/scenario-qa.md` | Team-based QA 실행 시나리오 추가 |
| `triggers/priority-rules.md` | bkend MCP 트리거 우선순위 규칙 추가 |

---

## 8. 파일별 상세 변경 명세

### 8.1 bkit-system/README.md

**버전 히스토리 테이블에 v1.5.4 행 추가:**

```markdown
| v1.5.4 | bkend MCP Accuracy Fix | MCP 도구 19→28+, 정확한 도구명, 동적 Base URL, search_docs 워크플로우 |
```

**아키텍처 다이어그램의 Hook 이벤트 수 교정:**

```
현재: Layer 1: hooks.json (Global) → SessionStart, UserPromptSubmit, PreCompact, PreToolUse, PostToolUse, Stop
변경: Layer 1: hooks.json (Global) → SessionStart, UserPromptSubmit, PreCompact, PreToolUse, PostToolUse, Stop, SubagentStart, SubagentStop, TaskCompleted, TeammateIdle
```

### 8.2 bkit-system/_GRAPH-INDEX.md

**v1.5.4 항목 추가 (v1.5.3 다음):**

```markdown
### v1.5.4 (2026-02-14) - bkend MCP Accuracy Fix
- bkend MCP 도구 커버리지: 19 → 28+ (Fixed 3 + Project 9 + Table 11 + Data CRUD 5)
- bkend specialist skills 5개 업데이트 (도구명/엔드포인트/워크플로우 정확도)
- bkend-patterns.md SSOT 확장: 85줄 → 140줄
- session-start.js: Enterprise 레벨 bkend MCP 상태 체크 추가
- 종합 테스트: 764/765 PASS (100%)
```

### 8.3 bkit-system/components/agents/_agents-overview.md

**16 에이전트 전체 목록 보완 (현재 11개만 나열):**

추가할 5개 에이전트:
```markdown
| cto-lead | opus | acceptEdits | CTO Team orchestration, PDCA workflow management |
| frontend-architect | sonnet | plan | UI/UX design, component architecture |
| product-manager | sonnet | plan | Requirements analysis, feature prioritization |
| qa-strategist | sonnet | plan | Test strategy, quality metrics coordination |
| security-architect | opus | plan | Vulnerability analysis, auth design review |
```

**모델 분포 교정:**

```
현재: (불완전)
변경: 7 opus / 7 sonnet / 2 haiku, 9 acceptEdits / 7 plan
```

### 8.4 bkit-system/components/skills/_skills-overview.md

**bkend specialist skills v1.5.4 변경사항 추가:**

```markdown
### v1.5.4 Changes (bkend MCP Accuracy Fix)
- 번호형 도구명 → 실명 전환 (`0_get_context` → `get_context`)
- MCP 도구 4개 카테고리 분류: Fixed(3), Project(9), Table(11), Data CRUD(5)
- Live Reference URL: `src/` → `en/` 경로 구조 전환
- 신규 개념: MCP Resources (`bkend://` URI), Searchable Docs (Doc ID)
```

### 8.5 bkit-system/components/hooks/_hooks-overview.md

**v1.5.4 변경 기록:**

```markdown
### v1.5.4 Changes
- `session-start.js`: bkend MCP 상태 체크 조건 확장 (Dynamic → Dynamic || Enterprise)
```

### 8.6 bkit-system/components/scripts/_scripts-overview.md

**함수 카운트 교정:**

```
현재: v1.4.7 참조값 132 functions
변경: 241 functions (v1.5.3~v1.5.4)
```

**Export 상세 (런타임 검증값):**

| 모듈 | 주석 | 실제 |
|------|:----:|:----:|
| core | 37 | **41** |
| pdca | 50 | **54** |
| intent | 19 | **19** |
| task | 26 | **26** |
| team | 39 | **40** |
| **bridge** | **180** | **180** |

### 8.7 bkit-system/testing/test-checklist.md

**v1.5.4 테스트 섹션 추가:**

```markdown
## v1.5.4 Tests (bkend MCP Accuracy)

### TC-V154: bkend MCP 변경 검증 (55 TC)

| ID | 테스트 | 우선순위 |
|----|--------|:--------:|
| V154-01 | bkend-expert.md MCP 도구 카운트 28+ 확인 | P0 |
| V154-02 | MCP Fixed Tools (get_context, search_docs, get_operation_schema) 존재 | P0 |
| V154-03 | MCP Project Management Tools 9개 존재 | P0 |
| V154-04 | MCP Table Management Tools 11개 존재 | P0 |
| V154-05 | MCP Data CRUD Tools 5개 존재 | P0 |
| V154-06 | bkend-data SKILL: id (NOT _id) 표기 | P0 |
| V154-07 | bkend-data SKILL: 필터 연산자 $ 접두사 | P1 |
| V154-08 | bkend-auth SKILL: MCP Auth Workflow 패턴 존재 | P0 |
| V154-09 | bkend-auth SKILL: REST 핵심 엔드포인트 12개 | P1 |
| V154-10 | bkend-auth SKILL: 소셜 로그인 단일 엔드포인트 | P1 |
| V154-11 | bkend-storage SKILL: MCP Storage Workflow 존재 | P0 |
| V154-12 | bkend-storage SKILL: download-url POST 메서드 | P0 |
| V154-13 | bkend-storage SKILL: Multipart 4 엔드포인트 | P1 |
| V154-14 | bkend-quickstart SKILL: 실명 도구 (번호형 없음) | P0 |
| V154-15 | bkend-quickstart SKILL: Project Management 9 도구 | P1 |
| V154-16 | bkend-quickstart SKILL: Resources 4 URI | P1 |
| V154-17 | bkend-cookbook SKILL: en/ 경로 URL | P2 |
| V154-18 | bkend-patterns.md: 140줄 이상 | P1 |
| V154-19 | bkend-patterns.md: 동적 Base URL (하드코딩 없음) | P0 |
| V154-20 | session-start.js: Dynamic || Enterprise 조건 | P0 |
| V154-21~55 | 전체 Live Reference URL en/ 경로 확인 (35 URL) | P2 |
```

### 8.8 bkit-system/scenarios/scenario-discover-features.md

**Output Styles 수 교정:**

```
현재: 3 styles (bkit-learning, bkit-pdca-guide, bkit-enterprise)
변경: 4 styles (bkit-learning, bkit-pdca-guide, bkit-enterprise, bkit-pdca-enterprise)
```

**Agent Teams 팀원 수 교정:**

```
현재: Dynamic (2 teammates), Enterprise (4 teammates)
변경: Dynamic (3 teammates), Enterprise (5 teammates)
```

### 8.9 bkit-system/triggers/trigger-matrix.md

**Hook 이벤트 수 교정:**

```
현재: 6 main events (SessionStart, PreToolUse, PostToolUse, Stop, UserPromptSubmit, PreCompact)
변경: 10 events (+SubagentStart, SubagentStop, TaskCompleted, TeammateIdle)
```

---

## 9. 구현 우선순위 및 실행 계획

### Phase 1: Critical — 버전 문자열 (즉시)

| 순서 | 파일 | 변경 수 |
|:----:|------|:------:|
| 1 | `.claude-plugin/plugin.json` | 1 |
| 2 | `.claude-plugin/marketplace.json` | 2 |
| 3 | `bkit.config.json` | 1 |
| 4 | `hooks/hooks.json` | 1 |
| 5 | `hooks/session-start.js` | 5 |
| 6 | `README.md` (배지만) | 1 |

**소계: 6파일, 11곳**

### Phase 2: High — CHANGELOG + 상위 문서

| 순서 | 파일 | 변경 내용 |
|:----:|------|----------|
| 7 | `CHANGELOG.md` | v1.5.4 릴리스 노트 추가 |
| 8 | `README.md` | v1.5.4 피처 항목 추가 |
| 9 | `CUSTOMIZATION-GUIDE.md` | 버전 참조 + Compatibility 업데이트 |

**소계: 3파일**

### Phase 3: Medium — lib/ 주석 수정

| 순서 | 파일 | 주석 수정 수 |
|:----:|------|:----------:|
| 10 | `lib/common.js` | 3 (모듈 카운트) + @version |
| 11 | `lib/core/index.js` | 2 (Platform, Cache) + @version |
| 12 | `lib/pdca/index.js` | 1 (해더) + @version |
| 13 | `lib/intent/index.js` | @version만 |
| 14 | `lib/task/index.js` | @version만 |
| 15 | `lib/team/index.js` | 1 (Orchestrator) + @version |

**소계: 6파일, 7 주석 + 6 @version**

### Phase 4: Low — bkit-system/ 문서 동기화

| 순서 | 파일 | 우선순위 |
|:----:|------|:--------:|
| 16 | `bkit-system/README.md` | P1 |
| 17 | `bkit-system/_GRAPH-INDEX.md` | P1 |
| 18 | `bkit-system/components/agents/_agents-overview.md` | P1 |
| 19 | `bkit-system/components/skills/_skills-overview.md` | P1 |
| 20 | `bkit-system/components/hooks/_hooks-overview.md` | P2 |
| 21 | `bkit-system/components/scripts/_scripts-overview.md` | P2 |
| 22 | `bkit-system/testing/test-checklist.md` | P2 |
| 23 | `bkit-system/scenarios/scenario-discover-features.md` | P2 |
| 24 | `bkit-system/triggers/trigger-matrix.md` | P2 |
| 25 | `bkit-system/philosophy/core-mission.md` | P3 |
| 26 | `bkit-system/philosophy/context-engineering.md` | P3 |
| 27 | `bkit-system/scenarios/scenario-new-feature.md` | P3 |
| 28 | `bkit-system/scenarios/scenario-qa.md` | P3 |
| 29 | `bkit-system/triggers/priority-rules.md` | P3 |
| 30 | `bkit-system/philosophy/ai-native-principles.md` | P3 |
| 31 | `bkit-system/philosophy/pdca-methodology.md` | P3 |
| 32 | `bkit-system/scenarios/scenario-write-code.md` | P3 |

**소계: 17파일 (P1: 4, P2: 5, P3: 8)**

---

## 10. 검증 체크리스트

### 10.1 버전 문자열 검증

```bash
# 모든 파일에서 "1.5.3" 잔존 여부 확인 (구현 파일 제외)
grep -r "1\.5\.3" --include="*.json" --include="*.js" --include="*.md" \
  --exclude-dir=docs --exclude-dir=node_modules \
  . | grep -v "CHANGELOG\|archive\|\.git"
```

**기대 결과**: 0건 (모든 `1.5.3` → `1.5.4` 전환 완료)

### 10.2 컴포넌트 카운트 정합성

| 항목 | 검증 방법 | 기대값 |
|------|----------|:------:|
| Skills | `ls skills/*/SKILL.md \| wc -l` | 26 |
| Agents | `ls agents/*.md \| wc -l` | 16 |
| Scripts | `ls scripts/*.js \| wc -l` | 45 |
| Hook Events | `hooks.json` 키 카운트 | 10 |
| lib/ exports | `node -e "console.log(Object.keys(require('./lib/common')).length)"` | 180 |
| Output Styles | `ls output-styles/*.md \| wc -l` | 4 |

### 10.3 lib/ 주석 vs 실제 export 수 일치 확인

```bash
# 각 모듈의 실제 export 수
node -e "console.log('core:', Object.keys(require('./lib/core')).length)"
node -e "console.log('pdca:', Object.keys(require('./lib/pdca')).length)"
node -e "console.log('intent:', Object.keys(require('./lib/intent')).length)"
node -e "console.log('task:', Object.keys(require('./lib/task')).length)"
node -e "console.log('team:', Object.keys(require('./lib/team')).length)"
```

**기대 결과**: core:41, pdca:54, intent:19, task:26, team:40

### 10.4 bkit-system/ 문서 동기화 확인

| 확인 항목 | 대상 파일 수 | 확인 방법 |
|----------|:----------:|----------|
| v1.5.4 언급 존재 | 5 (P1) | grep "v1.5.4" |
| Hook 이벤트 10개 | 3+ | grep "10 events\|10 hook" |
| Agent 16개 전체 나열 | 1 | agents-overview 확인 |
| Output Styles 4개 | 2+ | grep "4 styles\|4 output" |

---

## 11. 리스크 및 고려사항

### 11.1 변경 없음 확인 (No-Change Items)

다음 항목은 v1.5.4에서 **변경되지 않았음을 명시적으로 확인**:

| 항목 | 값 | v1.5.3 동일 |
|------|:--:|:----------:|
| Skills 수 | 26 | YES |
| Agents 수 | 16 | YES |
| Scripts 수 | 45 | YES |
| Hook Events 수 | 10 | YES |
| common.js exports | 180 | YES |
| lib/ 총 함수 수 | 241 | YES |
| Output Styles 수 | 4 | YES |
| Templates 수 | 27+1 | YES |

### 11.2 에이전트 분포 데이터 교정

**MEMORY.md 교정 필요** (종합 테스트 보고서 기준):

| 항목 | MEMORY.md (구) | 테스트 보고서 (정) | 교정 |
|------|:-------------:|:----------------:|:----:|
| Agent 모델 | "7 opus / 7 sonnet / 2 haiku" | 7/7/2 | 일치 ✅ |
| Permission 모드 | "9 acceptEdits / 7 plan" | 9/7 | 일치 ✅ |

### 11.3 Deferred Items (v1.5.5 이후)

v1.5.4 완료 보고서에서 이관된 4개 항목:

| ID | 내용 | 사유 |
|----|------|------|
| GAP-A | `detectLevel` config에 bkend 프로바이더 감지 | 범위 외 |
| GAP-C | UserPromptHandler의 `> 0.8` vs `>= 0.8` 비교 | Low severity |
| DEF-01 | bkend trigger 패턴 다국어 강화 (EN 9개 vs 기타 5개) | 별도 기능 |
| DEF-02 | Magic Words (`!hotfix`, `!prototype`) 구현 | 미구현 상태 유지 |

---

## 12. 변경 영향도 분석

### 12.1 토큰 영향

| 대상 | 변경 | 토큰 영향 |
|------|------|:---------:|
| 구현 파일 (8개) | 이미 완료 | +1,400 토큰 |
| 버전 문자열 (17곳) | 문자 치환 | 0 (길이 동일) |
| CHANGELOG.md | ~60줄 추가 | +500 토큰 |
| lib/ 주석 | 숫자만 변경 | 0 |
| bkit-system/ (17파일) | 섹션/행 추가 | +800 토큰 |
| **총 추가 토큰** | | **~2,700 토큰** |

### 12.2 파일 영향도 매트릭스

```
변경 파일 총: 32개
├── Phase 1 (버전 문자열): 6개 ← 즉시
├── Phase 2 (CHANGELOG+상위): 3개 ← 고
├── Phase 3 (lib/ 주석): 6개 ← 중
└── Phase 4 (bkit-system/): 17개 ← 저
    ├── P1: 4개
    ├── P2: 5개
    └── P3: 8개
```

---

## 부록 A: 전체 변경 파일 목록

| # | 파일 경로 | Phase | 변경 유형 |
|:-:|----------|:-----:|----------|
| 1 | `.claude-plugin/plugin.json` | 1 | 버전 1.5.3→1.5.4 |
| 2 | `.claude-plugin/marketplace.json` | 1 | 버전 1.5.3→1.5.4 (2곳) |
| 3 | `bkit.config.json` | 1 | 버전 1.5.3→1.5.4 |
| 4 | `hooks/hooks.json` | 1 | 설명 v1.5.3→v1.5.4 |
| 5 | `hooks/session-start.js` | 1 | v1.5.3→v1.5.4 (5곳) |
| 6 | `README.md` | 1+2 | 배지+피처 |
| 7 | `CHANGELOG.md` | 2 | v1.5.4 릴리스 노트 |
| 8 | `CUSTOMIZATION-GUIDE.md` | 2 | 버전 참조+Compatibility |
| 9 | `lib/common.js` | 3 | 주석 3곳 + @version |
| 10 | `lib/core/index.js` | 3 | 주석 2곳 + @version |
| 11 | `lib/pdca/index.js` | 3 | 해더 주석 + @version |
| 12 | `lib/intent/index.js` | 3 | @version |
| 13 | `lib/task/index.js` | 3 | @version |
| 14 | `lib/team/index.js` | 3 | 주석 1곳 + @version |
| 15 | `bkit-system/README.md` | 4-P1 | v1.5.4 히스토리+Hook 수 |
| 16 | `bkit-system/_GRAPH-INDEX.md` | 4-P1 | v1.5.4 항목 |
| 17 | `bkit-system/components/agents/_agents-overview.md` | 4-P1 | 16 에이전트 전체 나열 |
| 18 | `bkit-system/components/skills/_skills-overview.md` | 4-P1 | v1.5.4 변경사항 |
| 19 | `bkit-system/components/hooks/_hooks-overview.md` | 4-P2 | v1.5.4 변경 기록 |
| 20 | `bkit-system/components/scripts/_scripts-overview.md` | 4-P2 | 함수 카운트 교정 |
| 21 | `bkit-system/testing/test-checklist.md` | 4-P2 | v1.5.4 TC 추가 |
| 22 | `bkit-system/scenarios/scenario-discover-features.md` | 4-P2 | 수치 교정 |
| 23 | `bkit-system/triggers/trigger-matrix.md` | 4-P2 | Hook 이벤트 수 교정 |
| 24 | `bkit-system/philosophy/core-mission.md` | 4-P3 | "No Guessing" 사례 |
| 25 | `bkit-system/philosophy/context-engineering.md` | 4-P3 | MCP 정확도 의미 |
| 26 | `bkit-system/philosophy/ai-native-principles.md` | 4-P3 | 에이전트 분포 추가 |
| 27 | `bkit-system/philosophy/pdca-methodology.md` | 4-P3 | Team PDCA 언급 |
| 28 | `bkit-system/scenarios/scenario-new-feature.md` | 4-P3 | Team 시나리오 |
| 29 | `bkit-system/scenarios/scenario-qa.md` | 4-P3 | Team QA 시나리오 |
| 30 | `bkit-system/scenarios/scenario-write-code.md` | 4-P3 | Agent Memory 언급 |
| 31 | `bkit-system/triggers/priority-rules.md` | 4-P3 | bkend 트리거 규칙 |
| 32 | `bkit-system/triggers/trigger-matrix.md` | 4-P2 | (위 23과 동일) |

**고유 파일 수: 31개** (trigger-matrix.md 중복 제거)

---

## 부록 B: 런타임 검증 Export Count

```
┌─────────────────────────────────────────────────────┐
│ lib/ Module Export Count (Runtime Verified)          │
├──────────┬──────────┬──────────┬───────────────────┤
│ Module   │ Comment  │ Actual   │ Stale?            │
├──────────┼──────────┼──────────┼───────────────────┤
│ core     │ 37       │ 41       │ YES (+4)          │
│ pdca     │ 50       │ 54       │ YES (+4)          │
│ intent   │ 19       │ 19       │ NO                │
│ task     │ 26       │ 26       │ NO                │
│ team     │ 39       │ 40       │ YES (+1)          │
├──────────┼──────────┼──────────┼───────────────────┤
│ TOTAL    │ 171      │ 180      │ Bridge correct    │
│ common.js│ 180      │ 180      │ NO (bridge OK)    │
└──────────┴──────────┴──────────┴───────────────────┘

카테고리별 상세:
core/index.js:
  Platform: 8→9 (+isClaudeCode 또는 getTemplatePath 누락)
  Cache:    6→7 (+DEFAULT_TTL)
  IO:       9=9 (정확)
  Debug:    3=3 (정확)
  Config:   5=5 (정확)
  File:     8=8 (정확) [총 합: 9+7+9+3+5+8=41]

pdca/index.js:
  Tier:        8=8
  Level:       7=7
  Phase:       9=9
  Status:      17→19 (+readBkitMemory, +writeBkitMemory)
  Automation:  11=11 [총 합: 8+7+9+19+11=54]

team/index.js:
  Coordinator:    5=5
  Strategy:       2=2
  Hooks:          2=2
  Orchestrator:   5→6 (+shouldRecomposeTeam)
  Communication:  6=6
  TaskQueue:      5=5
  CtoLogic:       5=5
  StateWriter:    9=9 [총 합: 5+2+2+6+6+5+5+9=40]
```

---

*설계서 끝*
*bkit v1.5.4 - POPUP STUDIO PTE. LTD.*
