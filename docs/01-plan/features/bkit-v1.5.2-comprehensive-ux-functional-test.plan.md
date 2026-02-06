# bkit v1.5.2 Comprehensive UX & Functional Test Plan

> **Summary**: bkit v1.5.2 전체 기능의 사용자 경험(UX) 중심 + 기능 동작 중심 종합 테스트
>
> **Project**: bkit-claude-code
> **Version**: 1.5.2
> **Author**: CTO Team (5-agent parallel analysis)
> **Date**: 2026-02-06
> **Status**: Draft
> **Previous Test**: v1.5.1 (671 TC, 668 PASS, 99.6%)
> **Environment**: CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1, claude --plugin-dir .

---

## 1. Background

### 1.1 테스트 필요성

bkit v1.5.2는 v1.5.1 이후 다음 변경을 포함합니다:

| 변경 항목 | 상세 |
|-----------|------|
| BUG-01 수정 (Critical) | Agent Trigger `> 0.8` → `>= 0.8` (모든 Agent 트리거 복구) |
| bkend-expert Agent 전면 재작성 | 145줄 → 215줄, 19 MCP Tools + REST API |
| bkend 전문 Skills 5개 신규 | quickstart, data, auth, storage, cookbook |
| 공유 템플릿 1개 신규 | templates/shared/bkend-patterns.md |
| 기존 파일 7개 수정 | dynamic, phase-4-api, session-start, language, user-prompt-handler, plan/design templates |

### 1.2 테스트 범위 확대

v1.5.1 테스트(671 TC)는 **Library Unit + Hook Integration + Agent/Skill Integration** 중심이었습니다.
v1.5.2 테스트는 여기에 **사용자 경험(UX) 검증 + 철학 준수 검증**을 추가하여 사용자가 의도한 경험을 실제로 받는지 종합 검증합니다.

### 1.3 CTO Team 분석 결과 요약

5-agent CTO 팀이 병렬 분석한 bkit 전체 구성:

| Component | Count | 분석 에이전트 |
|-----------|:-----:|-------------|
| Skills | 26 (21 기존 + 5 bkend 신규) | Skills Analyst |
| Agents | 16 | Agents Analyst |
| Hook Events | 11 (8 기존 + 3 v1.5.1) | Hooks/Library Analyst |
| Scripts | 44 | Hooks/Library Analyst |
| Library Functions | 165 (5 modules, 37 files) | Hooks/Library Analyst |
| Templates | 27 (PDCA 7 + Pipeline 9 + Shared 4 + Others 7) | Config/Templates Analyst |
| Philosophy Docs | 4 | Philosophy Analyst |
| Output Styles | 3 | Config/Templates Analyst |
| Config Files | 2 (bkit.config.json + .bkit-memory.json) | Config/Templates Analyst |

---

## 2. Goals

### 2.1 Must (필수)

| ID | Goal | Description | TC 예상 |
|:--:|------|-------------|:-------:|
| G-01 | Philosophy Compliance Test | 6대 철학 원칙의 실제 사용자 전달 여부 검증 | 60 |
| G-02 | UX Flow Test | 4대 사용자 여정 (Onboarding → Development → QA → Completion) 검증 | 40 |
| G-03 | Skills Functional Test | 26개 Skills 로드, Trigger, 내용 정확성 검증 | 80 |
| G-04 | Agents Functional Test | 16개 Agents 트리거, 도구, 위임, 권한 검증 | 64 |
| G-05 | Hooks Integration Test | 11개 Hook Events + 44개 Scripts 실행 검증 | 55 |
| G-06 | Library Unit Test | 165 functions 개별 동작 검증 | 200 |
| G-07 | PDCA Workflow Test | Plan→Design→Do→Check→Act→Report→Archive 전체 흐름 | 35 |
| G-08 | v1.5.2 Enhancement Test | BUG-01 수정 + bkend 전문성 강화 34개 항목 검증 | 45 |

### 2.2 Should (권장)

| ID | Goal | Description | TC 예상 |
|:--:|------|-------------|:-------:|
| G-09 | CTO Team Test | Team 구성, Orchestration 패턴, Task 할당 검증 | 30 |
| G-10 | Multi-Language Test | 8개 언어 Trigger + Ambiguity 감지 검증 | 24 |
| G-11 | Level System Test | Starter/Dynamic/Enterprise 감지 + Pipeline 분기 검증 | 20 |
| G-12 | Configuration Test | bkit.config.json 설정값 적용 + 우선순위 검증 | 15 |

### 2.3 Could (선택)

| ID | Goal | Description | TC 예상 |
|:--:|------|-------------|:-------:|
| G-13 | Performance Test | Hook/Library 실행 시간, 캐싱 효율성 | 10 |
| G-14 | Edge Case Test | 에러 핸들링, 경계 조건, 순환 참조 방지 | 15 |

### 2.4 TC 총계 예상

| Priority | TC 수 | 비율 |
|:--------:|:-----:|:----:|
| Must (G-01~G-08) | 579 | 78% |
| Should (G-09~G-12) | 89 | 12% |
| Could (G-13~G-14) | 25 | 3% |
| **Total** | **693** | **100%** |

---

## 3. Test Categories

### 3.1 TC-PH: Philosophy Compliance Tests (60 TC)

사용자에게 의도한 경험이 실제로 전달되는지 검증합니다.

#### TC-PH-AF: Automation First (10 TC)

| ID | Test Case | Pass Criteria |
|----|-----------|---------------|
| PH-AF-01 | SessionStart 자동 표시 | 세션 시작 시 PDCA 상태 + 트리거 테이블 + 옵션 제시 |
| PH-AF-02 | Task Size 자동 분류 | Write/Edit 시 quick_fix/minor_change/feature/major_feature 자동 분류 |
| PH-AF-03 | Design 문서 자동 체크 | Write/Edit 시 Design 없으면 생성 제안 (차단 아님) |
| PH-AF-04 | Gap Analysis 자동 제안 | 구현 완료 후 PostToolUse에서 `/pdca analyze` 제안 |
| PH-AF-05 | Match Rate 기반 자동 분기 | >=90% Report, 70-89% 선택지, <70% Iterator 강력 권장 |
| PH-AF-06 | Level 자동 감지 | 프로젝트 구조 기반 Starter/Dynamic/Enterprise 정확 감지 |
| PH-AF-07 | Output Style 자동 제안 | Level에 맞는 Output Style 자동 제안 |
| PH-AF-08 | CTO Team 자동 제안 | Major Feature (>=1000자) 감지 시 Team Mode 제안 |
| PH-AF-09 | Agent Trigger 암시적 감지 | "맞아?", "is this right?" 등으로 gap-detector 자동 트리거 |
| PH-AF-10 | bkend MCP 미설정 자동 안내 | Dynamic level + MCP 미설정 시 설정 가이드 자동 표시 |

#### TC-PH-NG: No Guessing (8 TC)

| ID | Test Case | Pass Criteria |
|----|-----------|---------------|
| PH-NG-01 | Design 없이 구현 시 추측 금지 | Design 생성 제안 (추측으로 코드 생성하지 않음) |
| PH-NG-02 | Ambiguity Score >= 50 질문 | 불명확한 요청 시 AskUserQuestion 제안 |
| PH-NG-03 | Plan 없이 Design 시 안내 | Plan 생성 제안 |
| PH-NG-04 | Context 불충분 시 질문 | 컨텍스트 누락된 요청에 추가 정보 요청 |
| PH-NG-05 | Magic Word Bypass 동작 | "!hotfix" 접두사 시 Ambiguity Score = 0 |
| PH-NG-06 | Gap Analysis 필수 제안 | Feature 구현 완료 후 Gap Analysis 제안 |
| PH-NG-07 | Agent 불확실 시 AskUserQuestion | bkend-expert Agent Work Rules 준수 |
| PH-NG-08 | Agent 권한 초과 차단 | plan mode agent의 Write 시도 차단 |

#### TC-PH-DC: Docs = Code (10 TC)

| ID | Test Case | Pass Criteria |
|----|-----------|---------------|
| PH-DC-01 | Design-first workflow | 구현 전 Design 존재 확인 및 참조 |
| PH-DC-02 | Gap Analysis Match Rate 계산 | 0-100% 정확 계산 |
| PH-DC-03 | Match Rate >= 90% 완료 기준 | 90% 이상 시 Report 제안 |
| PH-DC-04 | Match Rate < 70% 반복 제안 | pdca-iterator 강력 권장 |
| PH-DC-05 | Design 참조 구현 | Design 섹션 기반 코드 생성 확인 |
| PH-DC-06 | Template 자동 선택 | Level별 적절한 Template 제공 |
| PH-DC-07 | PDCA 문서 구조 유지 | 01-plan, 02-design, 03-analysis, 04-report 존재 |
| PH-DC-08 | Archive 조건 검증 | Match Rate >= 90% 시 `/pdca archive` 활성화 |
| PH-DC-09 | Archive 프로세스 | docs/archive/YYYY-MM/ 정상 생성 및 이동 |
| PH-DC-10 | PDCA Status 자동 추적 | .bkit-memory.json 자동 업데이트 |

#### TC-PH-CE: Context Engineering (10 TC)

| ID | Test Case | Pass Criteria |
|----|-----------|---------------|
| PH-CE-01 | Multi-Level Hierarchy 우선순위 | Session > Project > User > Plugin |
| PH-CE-02 | @import 지시어 동작 | Skill/Agent imports 정상 로드 |
| PH-CE-03 | ${PLUGIN_ROOT} 변수 치환 | 절대 경로로 정상 치환 |
| PH-CE-04 | Circular import 감지 | 순환 참조 시 에러/경고 |
| PH-CE-05 | Context Fork 격리 | gap-detector 실행이 메인 컨텍스트 오염 없음 |
| PH-CE-06 | Permission Hierarchy | deny=차단, ask=확인, allow=허용 |
| PH-CE-07 | Task Dependency Chain | [Plan]→[Design]→[Do]→[Check]→[Act] 자동 생성 |
| PH-CE-08 | Context Compaction 보존 | PreCompact 시 PDCA 스냅샷 보존 |
| PH-CE-09 | Agent Memory 영속성 | 세션 종료 후 재시작 시 메모리 유지 |
| PH-CE-10 | TTL 캐싱 동작 | 5초 이내 재호출 시 캐시 히트 |

#### TC-PH-ARB: Agent Role Boundaries (12 TC)

| ID | Test Case | Pass Criteria |
|----|-----------|---------------|
| PH-ARB-01 | gap-detector Read-only 권한 | Write 도구 접근 불가 |
| PH-ARB-02 | design-validator Read-only 권한 | Write 도구 접근 불가 |
| PH-ARB-03 | cto-lead plan mode 강제 | Plan 승인 없이 Design 진행 차단 |
| PH-ARB-04 | pdca-iterator acceptEdits 허용 | Edit 도구 사용 가능 |
| PH-ARB-05 | Model selection 정확성 | opus(7), sonnet(7), haiku(2) 명세 대로 |
| PH-ARB-06 | Skills multi-binding 라우팅 | `/pdca analyze` → gap-detector 정확 라우팅 |
| PH-ARB-07 | Agent Stop Hook 실행 | 종료 시 해당 stop script 실행 |
| PH-ARB-08 | Score threshold 준수 | gap-detector < 70% → pdca-iterator 권장 |
| PH-ARB-09 | Do NOT use for 경계 | 각 Agent의 위임 규칙 준수 |
| PH-ARB-10 | Agent-Skill 바인딩 정확성 | Agent skills 필드와 Skill agent 필드 양방향 일치 |
| PH-ARB-11 | skills_preload 동작 | bkend-expert의 data, auth, storage 사전 로드 |
| PH-ARB-12 | Memory scope 격리 | project(14) vs user(2) 별도 관리 |

#### TC-PH-LS: Level System (10 TC)

| ID | Test Case | Pass Criteria |
|----|-----------|---------------|
| PH-LS-01 | Starter 감지 | index.html만 존재 시 Starter |
| PH-LS-02 | Dynamic 감지 | Next.js + .mcp.json 시 Dynamic |
| PH-LS-03 | Enterprise 감지 | kubernetes/ + terraform/ 시 Enterprise |
| PH-LS-04 | Starter Pipeline | Phase 1→2→3→6→9 (4,5,7,8 skip) |
| PH-LS-05 | Dynamic Pipeline | Phase 1→2→3→4→5→6→7→9 |
| PH-LS-06 | Enterprise Pipeline | Phase 1→2→3→4→5→6→7→8→9 전체 |
| PH-LS-07 | Starter Output Style | bkit-learning 제안 |
| PH-LS-08 | Dynamic Output Style | bkit-pdca-guide 제안 |
| PH-LS-09 | Enterprise Output Style | bkit-enterprise 제안 |
| PH-LS-10 | Team Mode Level 제한 | Starter: 미지원, Dynamic: 3명, Enterprise: 5명 |

---

### 3.2 TC-UX: User Experience Flow Tests (40 TC)

사용자의 4대 여정을 시나리오 기반으로 검증합니다.

#### TC-UX-ON: Onboarding Flow (10 TC)

| ID | Test Case | Pass Criteria |
|----|-----------|---------------|
| UX-ON-01 | 첫 세션 시작 | SessionStart Hook 실행, 환영 메시지 표시 |
| UX-ON-02 | 이전 작업 감지 | 기존 PDCA 상태 표시 + Continue/New/Status 선택지 |
| UX-ON-03 | 신규 사용자 안내 | Learn/Setup/Start 4가지 옵션 제시 |
| UX-ON-04 | Level 감지 결과 표시 | 감지된 Level 명시적 표시 |
| UX-ON-05 | 트리거 키워드 테이블 표시 | Agent/Skill 트리거 키워드 안내 |
| UX-ON-06 | Agent Teams 안내 | CTO Team 사용 가능 여부 안내 |
| UX-ON-07 | Output Style 제안 | Level 기반 Output Style 제안 |
| UX-ON-08 | Agent Memory 안내 | 자동 활성화 상태 안내 |
| UX-ON-09 | bkend MCP 상태 (Dynamic) | MCP 연결/미연결 상태 안내 |
| UX-ON-10 | bkit Feature Usage 보고서 | 응답 하단 사용 기능 리포트 |

#### TC-UX-DEV: Development Flow (10 TC)

| ID | Test Case | Pass Criteria |
|----|-----------|---------------|
| UX-DEV-01 | Feature 요청 인식 | "로그인 기능 만들어줘" → PDCA Plan 제안 |
| UX-DEV-02 | Plan 자동 생성 | `/pdca plan` → plan.template.md 기반 문서 생성 |
| UX-DEV-03 | Design 자동 생성 | `/pdca design` → Level별 design.template.md 사용 |
| UX-DEV-04 | 구현 가이드 제공 | `/pdca do` → Design 기반 구현 순서 안내 |
| UX-DEV-05 | Convention 자동 적용 | pre-write.js에서 네이밍 규칙 힌트 |
| UX-DEV-06 | Task 분류 자동화 | 코드 변경량 기반 PDCA 수준 분류 |
| UX-DEV-07 | PDCA Status 추적 | .bkit-memory.json phase 자동 업데이트 |
| UX-DEV-08 | Next Phase 안내 | `/pdca next` → 다음 단계 정확 가이드 |
| UX-DEV-09 | Pipeline Phase 순서 | next-skill 연결로 Phase 자동 진행 |
| UX-DEV-10 | Skill Trigger 자동 감지 | "API 설계해줘" → phase-4-api Skill 트리거 |

#### TC-UX-QA: QA & Verification Flow (10 TC)

| ID | Test Case | Pass Criteria |
|----|-----------|---------------|
| UX-QA-01 | Gap Analysis 실행 | `/pdca analyze` → gap-detector 실행 |
| UX-QA-02 | Match Rate 표시 | 0-100% 수치 + 항목별 PASS/FAIL |
| UX-QA-03 | 90% 이상 완료 분기 | Report 생성 제안 |
| UX-QA-04 | 70-89% 선택지 분기 | Auto-fix/Manual/Complete as-is 옵션 |
| UX-QA-05 | 70% 미만 강력 권장 | pdca-iterator 강력 권장 |
| UX-QA-06 | Auto-iteration 실행 | pdca-iterator 최대 5회 반복 |
| UX-QA-07 | 반복 후 재검증 | Iterator 완료 → gap-detector 재실행 |
| UX-QA-08 | Code Review 실행 | `/code-review` → code-analyzer 동작 |
| UX-QA-09 | Zero Script QA 실행 | qa-monitor 로그 기반 검증 |
| UX-QA-10 | Design Validator 실행 | design-validator 설계 문서 검증 |

#### TC-UX-COMP: Completion Flow (10 TC)

| ID | Test Case | Pass Criteria |
|----|-----------|---------------|
| UX-COMP-01 | Report 생성 | `/pdca report` → report-generator 실행 |
| UX-COMP-02 | Report 내용 완전성 | Plan/Design/Implementation/Analysis 종합 |
| UX-COMP-03 | Archive 실행 | `/pdca archive` → docs/archive/ 이동 |
| UX-COMP-04 | Archive --summary | 메트릭 보존 옵션 동작 |
| UX-COMP-05 | Cleanup 실행 | `/pdca cleanup` → 아카이브 정리 |
| UX-COMP-06 | Status 표시 | `/pdca status` → 진행 상황 시각화 |
| UX-COMP-07 | Version History 기록 | 문서 Version History 섹션 업데이트 |
| UX-COMP-08 | .bkit-memory.json 완료 | phase = "completed", matchRate 기록 |
| UX-COMP-09 | 다음 Feature 전환 | 새 Feature 시작 시 이전 상태 유지 |
| UX-COMP-10 | 세션 간 상태 영속성 | 세션 종료 후 재시작 시 상태 복원 |

---

### 3.3 TC-SK: Skills Functional Tests (80 TC)

#### TC-SK-LV: Level Skills (9 TC)

| ID | Skill | Test Case | Pass Criteria |
|----|-------|-----------|---------------|
| SK-LV-01 | starter | Frontmatter 유효성 | name, description, agent, allowed-tools 존재 |
| SK-LV-02 | starter | Trigger 키워드 8개 언어 | static website, 정적 웹, 静的サイト 등 매칭 |
| SK-LV-03 | starter | user-invocable: true | 사용자 직접 호출 가능 |
| SK-LV-04 | dynamic | Frontmatter 유효성 | name, description, agent:bkend-expert |
| SK-LV-05 | dynamic | MCP 설정 type:http | `.mcp.json` type: "http" 방식 반영 |
| SK-LV-06 | dynamic | REST bkendFetch 패턴 | OAuth 2.1 기반 Client 패턴 포함 |
| SK-LV-07 | enterprise | Frontmatter 유효성 | agents multi-binding (default, infra, security, architecture) |
| SK-LV-08 | enterprise | Trigger 키워드 8개 언어 | microservices, 마이크로서비스 등 |
| SK-LV-09 | enterprise | AI Native 10-Day 패턴 | Enterprise 개발 방법론 포함 |

#### TC-SK-PL: Pipeline Phase Skills (27 TC)

| ID | Phase | Test Case | Pass Criteria |
|----|-------|-----------|---------------|
| SK-PL-01 | phase-1-schema | Frontmatter + next-skill | next-skill: phase-2-convention |
| SK-PL-02 | phase-1-schema | 용어/엔티티 정의 내용 | Template import 정상 |
| SK-PL-03 | phase-1-schema | pdca-phase: plan | PDCA phase 매핑 정확 |
| SK-PL-04 | phase-2-convention | next-skill: phase-3-mockup | Pipeline 연결 정상 |
| SK-PL-05 | phase-2-convention | Clean Architecture 내용 | Layer 구조 가이드 포함 |
| SK-PL-06 | phase-2-convention | 네이밍 규칙 shared import | naming-conventions.md 로드 |
| SK-PL-07 | phase-3-mockup | agents multi-binding | pipeline-guide + frontend-architect |
| SK-PL-08 | phase-3-mockup | UI/UX 트렌드 조사 | WebSearch 도구 포함 |
| SK-PL-09 | phase-3-mockup | pdca-phase: design | PDCA phase 매핑 정확 |
| SK-PL-10 | phase-4-api | agent: qa-monitor | QA 에이전트 바인딩 |
| SK-PL-11 | phase-4-api | BaaS 구현 가이드 | Dynamic Level 5단계 섹션 존재 |
| SK-PL-12 | phase-4-api | Zero Script QA 내용 | 로그 기반 검증 패턴 포함 |
| SK-PL-13 | phase-5-design-system | Platform-agnostic | shadcn/ui, Design tokens |
| SK-PL-14 | phase-5-design-system | agents multi-binding | pipeline-guide + frontend-architect |
| SK-PL-15 | phase-5-design-system | pdca-phase: do | PDCA phase 매핑 정확 |
| SK-PL-16 | phase-6-ui-integration | API Client Architecture | Service pattern 포함 |
| SK-PL-17 | phase-6-ui-integration | State Management | Zustand/Context 가이드 |
| SK-PL-18 | phase-6-ui-integration | agents multi-binding | pipeline-guide + frontend-architect |
| SK-PL-19 | phase-7-seo-security | agents multi-binding | code-analyzer + security-architect |
| SK-PL-20 | phase-7-seo-security | OWASP Top 10 | 보안 체크리스트 포함 |
| SK-PL-21 | phase-7-seo-security | SEO Meta Tags | 검색 최적화 가이드 포함 |
| SK-PL-22 | phase-8-review | agents 5-binding | code-analyzer, design-validator, gap-detector, qa-strategist, cto-lead |
| SK-PL-23 | phase-8-review | Cross-phase 검증 | Architecture/Convention 일관성 체크 |
| SK-PL-24 | phase-8-review | pdca-phase: check | PDCA phase 매핑 정확 |
| SK-PL-25 | phase-9-deployment | agent: infra-architect | 배포 전문가 바인딩 |
| SK-PL-26 | phase-9-deployment | CI/CD 가이드 | GitHub Actions, Docker 패턴 |
| SK-PL-27 | phase-9-deployment | pdca-phase: act | PDCA phase 매핑 정확 |

#### TC-SK-BK: bkend Expert Skills (20 TC)

| ID | Skill | Test Case | Pass Criteria |
|----|-------|-----------|---------------|
| SK-BK-01 | bkend-quickstart | Frontmatter 유효성 | user-invocable:false, agent:bkend-expert |
| SK-BK-02 | bkend-quickstart | imports bkend-patterns.md | 공유 템플릿 정상 참조 |
| SK-BK-03 | bkend-quickstart | MCP Setup 가이드 | `claude mcp add bkend --transport http` 포함 |
| SK-BK-04 | bkend-quickstart | Resource Hierarchy | Org→Project→Environment 설명 |
| SK-BK-05 | bkend-data | Frontmatter 유효성 | mcp__bkend__* allowed-tools 포함 |
| SK-BK-06 | bkend-data | 7 Column Types | String~Mixed 7종 설명 |
| SK-BK-07 | bkend-data | 11 MCP DB Tools | backend_table_create 등 목록 |
| SK-BK-08 | bkend-data | REST Data API 5 endpoints | GET/POST/GET/:id/PATCH/DELETE |
| SK-BK-09 | bkend-data | Filtering 8 operators | eq, ne, gt, gte, lt, lte, in, nin |
| SK-BK-10 | bkend-auth | 4 Auth Methods | Email, Google, GitHub, Magic Link |
| SK-BK-11 | bkend-auth | JWT Token Structure | Access 1h, Refresh 7d |
| SK-BK-12 | bkend-auth | RBAC 4 Groups | admin, user, self, guest |
| SK-BK-13 | bkend-auth | REST Auth API 18 endpoints | signup~sessions 전체 |
| SK-BK-14 | bkend-storage | 3 Upload Methods | Single, Multiple, Multipart |
| SK-BK-15 | bkend-storage | 4 Visibility Levels | public, private, protected, shared |
| SK-BK-16 | bkend-storage | Size Limits | 이미지 10MB, 비디오 100MB, 문서 20MB |
| SK-BK-17 | bkend-storage | Presigned URL Flow | 3단계 업로드 흐름 |
| SK-BK-18 | bkend-cookbook | 10 Single Project Guides | Todo~SaaS 프로젝트 목록 |
| SK-BK-19 | bkend-cookbook | 4 Full Guide Projects | Blog, Recipe, Shopping, Social |
| SK-BK-20 | bkend-cookbook | Troubleshooting 8 errors | 401~MCP 에러 해결 |

#### TC-SK-UT: Utility & Meta Skills (24 TC)

| ID | Skill | Test Case | Pass Criteria |
|----|-------|-----------|---------------|
| SK-UT-01 | pdca | plan 명령 | plan.template.md 기반 문서 생성 |
| SK-UT-02 | pdca | design 명령 | Level별 design template 사용 |
| SK-UT-03 | pdca | analyze 명령 | gap-detector 라우팅 |
| SK-UT-04 | pdca | iterate 명령 | pdca-iterator 라우팅 |
| SK-UT-05 | pdca | report 명령 | report-generator 라우팅 |
| SK-UT-06 | pdca | archive 명령 | Archive 프로세스 실행 |
| SK-UT-07 | pdca | cleanup 명령 | 아카이브 정리 |
| SK-UT-08 | pdca | status 명령 | 현재 상태 표시 |
| SK-UT-09 | pdca | next 명령 | 다음 Phase 안내 |
| SK-UT-10 | pdca | team 명령 | CTO Team 생성 |
| SK-UT-11 | development-pipeline | Pipeline 시작 | 9단계 가이드 표시 |
| SK-UT-12 | development-pipeline | Phase 진행 | next-skill 자동 연결 |
| SK-UT-13 | code-review | Code Review 실행 | code-analyzer 바인딩 |
| SK-UT-14 | code-review | 리뷰 결과 포맷 | 품질/보안/성능 분석 |
| SK-UT-15 | zero-script-qa | QA 실행 | qa-monitor 바인딩 |
| SK-UT-16 | zero-script-qa | 로그 기반 검증 | Docker logs 모니터링 |
| SK-UT-17 | mobile-app | Mobile 가이드 | React Native/Flutter/Expo |
| SK-UT-18 | desktop-app | Desktop 가이드 | Electron/Tauri |
| SK-UT-19 | bkit-rules | 자동 적용 | PDCA, Level, Agent Trigger 규칙 |
| SK-UT-20 | bkit-templates | 템플릿 제공 | Plan/Design/Analysis/Report |
| SK-UT-21 | claude-code-learning | Learning 시작 | 6단계 학습 코스 |
| SK-UT-22 | claude-code-learning | Learning 진행 | Level별 맞춤 학습 |
| SK-UT-23 | All Skills | Trigger 8개 언어 | 모든 Skill에 8개 언어 키워드 |
| SK-UT-24 | All Skills | allowed-tools 일관성 | 명세된 도구만 접근 가능 |

---

### 3.4 TC-AG: Agents Functional Tests (64 TC)

#### TC-AG-CORE: Core Agents (20 TC)

| ID | Agent | Test Case | Pass Criteria |
|----|-------|-----------|---------------|
| AG-CORE-01 | gap-detector | Trigger "검증해줘" | confidence >= 0.8 매칭 |
| AG-CORE-02 | gap-detector | Design vs Implementation 비교 | Match Rate 정확 계산 |
| AG-CORE-03 | gap-detector | context:fork 격리 | 메인 컨텍스트 오염 없음 |
| AG-CORE-04 | gap-detector | Stop Hook 실행 | gap-detector-stop.js → 다음 분기 |
| AG-CORE-05 | pdca-iterator | Trigger "개선해줘" | confidence >= 0.8 매칭 |
| AG-CORE-06 | pdca-iterator | 자동 반복 (max 5) | gap-detector 재호출, 최대 5회 |
| AG-CORE-07 | pdca-iterator | skills_preload pdca+bkit-rules | 사전 로드 확인 |
| AG-CORE-08 | pdca-iterator | Stop Hook 실행 | iterator-stop.js → Match Rate 체크 |
| AG-CORE-09 | code-analyzer | Trigger "분석해줘" | confidence >= 0.8 매칭 |
| AG-CORE-10 | code-analyzer | LSP 도구 사용 | Language Server 연동 |
| AG-CORE-11 | code-analyzer | Read-only 권한 | Write/Edit 차단 |
| AG-CORE-12 | code-analyzer | skills_preload 3개 | convention, review, code-review |
| AG-CORE-13 | report-generator | Trigger "보고서 작성" | confidence >= 0.8 매칭 |
| AG-CORE-14 | report-generator | Report 문서 생성 | report.template.md 기반 |
| AG-CORE-15 | report-generator | haiku 모델 | 저비용 빠른 생성 |
| AG-CORE-16 | design-validator | 설계 문서 검증 | 섹션 완성도 체크 |
| AG-CORE-17 | design-validator | context:fork 격리 | 독립 실행 |
| AG-CORE-18 | starter-guide | Trigger "도움" | confidence >= 0.8 매칭 |
| AG-CORE-19 | starter-guide | user scope memory | 사용자 학습 진행도 유지 |
| AG-CORE-20 | pipeline-guide | Pipeline 가이드 | 9단계 순서 안내 |

#### TC-AG-BK: bkend Expert Agent (12 TC)

| ID | Test Case | Pass Criteria |
|----|-----------|---------------|
| AG-BK-01 | Trigger "백엔드 서비스" (2-word) | confidence >= 0.8, dynamic Skill과 충돌 없음 |
| AG-BK-02 | Trigger "bkend" (전용) | 정확 매칭 |
| AG-BK-03 | skills 6개 바인딩 | dynamic + 5개 bkend Skills |
| AG-BK-04 | skills_preload 3개 | bkend-data, bkend-auth, bkend-storage |
| AG-BK-05 | 19 MCP Tools 문서화 | Guide 8 + API 11 목록 정확 |
| AG-BK-06 | REST API 23+ endpoints | Auth 18 + Data 5 + Storage |
| AG-BK-07 | RBAC 4단계 | admin/user/self/guest |
| AG-BK-08 | Troubleshooting 12항목 | 에러 시나리오 12개 |
| AG-BK-09 | Agent Delegation 5항목 | infra/enterprise/security/frontend/code-analyzer |
| AG-BK-10 | MCP Setup .mcp.json | type:"http" 설정 가이드 |
| AG-BK-11 | OAuth 2.1 + PKCE | API Key 불필요 명시 |
| AG-BK-12 | Do NOT use for | static sites, infra, K8s, CI/CD 위임 명시 |

#### TC-AG-CTO: CTO Team Agents (16 TC)

| ID | Agent | Test Case | Pass Criteria |
|----|-------|-----------|---------------|
| AG-CTO-01 | cto-lead | Team 생성 | opus 모델, acceptEdits |
| AG-CTO-02 | cto-lead | Task 도구 11개 | 전문가 Agent Task 호출 가능 |
| AG-CTO-03 | cto-lead | Plan approval | plan_mode_required 동작 |
| AG-CTO-04 | cto-lead | Trigger "팀 구성" | confidence >= 0.8 |
| AG-CTO-05 | product-manager | Plan 문서 작성 | plan mode, Read/Write/Edit |
| AG-CTO-06 | product-manager | skills: pdca, bkit-templates | Skill 바인딩 정확 |
| AG-CTO-07 | frontend-architect | UI 설계/구현 | sonnet, acceptEdits |
| AG-CTO-08 | frontend-architect | Phase 3/5/6 바인딩 | linked-from-skills 정확 |
| AG-CTO-09 | security-architect | 보안 검토 | opus, plan mode |
| AG-CTO-10 | security-architect | Phase 7 바인딩 | linked-from-skills 정확 |
| AG-CTO-11 | qa-strategist | QA 전략 수립 | Task(qa-monitor, gap-detector, code-analyzer) |
| AG-CTO-12 | qa-strategist | Phase 8 바인딩 | linked-from-skills 정확 |
| AG-CTO-13 | enterprise-expert | AI Native 전략 | opus, acceptEdits |
| AG-CTO-14 | infra-architect | 인프라 설계 | opus, Bash 포함 |
| AG-CTO-15 | qa-monitor | 로그 모니터링 | haiku, Bash 포함 |
| AG-CTO-16 | All CTO Agents | 8개 언어 Trigger | 전체 Agent Trigger 8개 언어 |

#### TC-AG-DEL: Agent Delegation Tests (16 TC)

| ID | From Agent | To Agent | Test Case | Pass Criteria |
|----|------------|----------|-----------|---------------|
| AG-DEL-01 | cto-lead | product-manager | Plan 위임 | Task 할당 정상 |
| AG-DEL-02 | cto-lead | frontend-architect | Design 위임 | Task 할당 정상 |
| AG-DEL-03 | cto-lead | bkend-expert | 구현 위임 | Task 할당 정상 |
| AG-DEL-04 | cto-lead | qa-strategist | QA 위임 | Task 할당 정상 |
| AG-DEL-05 | cto-lead | report-generator | Report 위임 | Task 할당 정상 |
| AG-DEL-06 | qa-strategist | qa-monitor | 로그 검증 위임 | 병렬 실행 |
| AG-DEL-07 | qa-strategist | gap-detector | Gap 분석 위임 | 병렬 실행 |
| AG-DEL-08 | qa-strategist | code-analyzer | 코드 분석 위임 | 병렬 실행 |
| AG-DEL-09 | enterprise-expert | infra-architect | 인프라 위임 | Task(infra-architect) |
| AG-DEL-10 | bkend-expert | infra-architect | K8s/Docker 위임 | Do NOT use for 준수 |
| AG-DEL-11 | bkend-expert | enterprise-expert | 마이크로서비스 위임 | Do NOT use for 준수 |
| AG-DEL-12 | bkend-expert | code-analyzer | 코드 품질 위임 | Agent Delegation 준수 |
| AG-DEL-13 | pdca-iterator | gap-detector | 재검증 위임 | Task(gap-detector) |
| AG-DEL-14 | security-architect | code-analyzer | 코드 보안 위임 | Task(code-analyzer) |
| AG-DEL-15 | gap-detector | (none) | 위임 없음 | Read-only, 분석만 |
| AG-DEL-16 | report-generator | (none) | 위임 없음 | 보고서 생성만 |

---

### 3.5 TC-HK: Hooks Integration Tests (55 TC)

#### TC-HK-SS: SessionStart (8 TC)

| ID | Test Case | Pass Criteria |
|----|-----------|---------------|
| HK-SS-01 | once: true 실행 | 세션당 1회만 실행 |
| HK-SS-02 | detectLevel() 정확성 | 프로젝트 구조 기반 Level 감지 |
| HK-SS-03 | enhancedOnboarding() | 기존 작업 유무에 따른 분기 |
| HK-SS-04 | 트리거 테이블 생성 | 7 Agent + 4 Skill 트리거 표시 |
| HK-SS-05 | bkend MCP 상태 체크 | Dynamic level MCP 상태 표시 |
| HK-SS-06 | Agent Teams 안내 | CTO Team 가용 여부 표시 |
| HK-SS-07 | Output Styles 제안 | Level별 권장 Style |
| HK-SS-08 | 세션 카운트 증가 | sessionCount +1 |

#### TC-HK-UP: UserPromptSubmit (10 TC)

| ID | Test Case | Pass Criteria |
|----|-----------|---------------|
| HK-UP-01 | New Feature 감지 | "새 기능 만들어줘" → /pdca plan 제안 |
| HK-UP-02 | Agent Trigger (confidence >= 0.8) | BUG-01 수정 확인: `>=` 비교 |
| HK-UP-03 | Skill Trigger (confidence > 0.75) | Skill 자동 제안 |
| HK-UP-04 | bkend MCP 권장 | dynamic skill + MCP 미설정 → 안내 |
| HK-UP-05 | Ambiguity Score >= 50 | 불명확 요청 → 명확화 질문 |
| HK-UP-06 | Ambiguity Score < 50 | 명확한 요청 → 바로 진행 |
| HK-UP-07 | Magic Word Bypass | "!hotfix" → Score = 0 |
| HK-UP-08 | Team Mode 제안 | suggestTeamMode() 동작 |
| HK-UP-09 | checkBkendMcpConfig() | .mcp.json + .claude/settings.json 확인 |
| HK-UP-10 | 3000ms timeout 준수 | 타임아웃 내 완료 |

#### TC-HK-PTU: PreToolUse (8 TC)

| ID | Test Case | Pass Criteria |
|----|-----------|---------------|
| HK-PTU-01 | pre-write.js 실행 | Write/Edit 시 실행 |
| HK-PTU-02 | Task 분류 | 라인 수 기반 분류 |
| HK-PTU-03 | PDCA 문서 체크 | Design/Plan 존재 확인 |
| HK-PTU-04 | Convention Hints | 네이밍 규칙 안내 |
| HK-PTU-05 | Automation First (비차단) | 안내만 하고 차단하지 않음 |
| HK-PTU-06 | unified-bash-pre.js | Bash 실행 전 안전 체크 |
| HK-PTU-07 | 파괴적 명령 차단 | rm -rf, DROP TABLE 등 차단 |
| HK-PTU-08 | Phase 9 배포 안전 | kubectl delete, terraform destroy 차단 |

#### TC-HK-POTU: PostToolUse (8 TC)

| ID | Test Case | Pass Criteria |
|----|-----------|---------------|
| HK-POTU-01 | unified-write-post.js | Write 후 실행 |
| HK-POTU-02 | pdca-post-write.js | PDCA 추적 (항상 실행) |
| HK-POTU-03 | unified-bash-post.js | Bash 후 실행 |
| HK-POTU-04 | skill-post.js | Skill 실행 후 다음 단계 제안 |
| HK-POTU-05 | Active Context 설정 | setActiveSkill() 정상 동작 |
| HK-POTU-06 | Phase 5 디자인 추적 | phase5-design-post.js |
| HK-POTU-07 | Phase 6 UI 추적 | phase6-ui-post.js |
| HK-POTU-08 | QA 명령 추적 | qa-monitor-post.js |

#### TC-HK-STOP: Stop Hook (8 TC)

| ID | Test Case | Pass Criteria |
|----|-----------|---------------|
| HK-STOP-01 | unified-stop.js Handler Registry | 10 Skill + 6 Agent handler 등록 |
| HK-STOP-02 | Skill handler 분기 | Active skill 기반 handler 실행 |
| HK-STOP-03 | Agent handler 분기 | Active agent 기반 handler 실행 |
| HK-STOP-04 | gap-detector-stop.js | Match Rate 기반 분기 |
| HK-STOP-05 | iterator-stop.js | 반복 상태 체크 |
| HK-STOP-06 | cto-stop.js | Team 상태 저장 |
| HK-STOP-07 | clearActiveContext() | 컨텍스트 정리 |
| HK-STOP-08 | 10000ms timeout 준수 | 타임아웃 내 완료 |

#### TC-HK-TASK: TaskCompleted + TeammateIdle (8 TC)

| ID | Test Case | Pass Criteria |
|----|-----------|---------------|
| HK-TASK-01 | PDCA Task 패턴 감지 | [Plan], [Design], [Do] 등 추출 |
| HK-TASK-02 | Feature name 추출 | Task subject에서 feature 추출 |
| HK-TASK-03 | shouldAutoAdvance() | 자동 진행 판단 |
| HK-TASK-04 | Plan → Design 자동 진행 | Plan 완료 시 Design 제안 |
| HK-TASK-05 | Check → Act/Report 분기 | Match Rate 기반 분기 |
| HK-TASK-06 | TeammateIdle 감지 | Idle 상태 teammate 식별 |
| HK-TASK-07 | 다음 Task 할당 | findNextAvailableTask() |
| HK-TASK-08 | 모든 Task 완료 | Team cleanup 안내 |

#### TC-HK-OTHER: PreCompact + Context (5 TC)

| ID | Test Case | Pass Criteria |
|----|-----------|---------------|
| HK-OTHER-01 | context-compaction.js | PDCA 스냅샷 생성 |
| HK-OTHER-02 | 스냅샷 복원 | 세션 재시작 시 복원 |
| HK-OTHER-03 | GitHub #9354 Workaround | unified hooks 정상 동작 |
| HK-OTHER-04 | Active Context 추적 | setActiveSkill/Agent 일관성 |
| HK-OTHER-05 | Hook timeout 준수 | 모든 Hook 5000ms/10000ms 이내 |

---

### 3.6 TC-LIB: Library Unit Tests (200 TC)

#### TC-LIB-CORE: Core Module (45 TC)

| Module | Functions | TC |
|--------|:---------:|:--:|
| platform.js (9 exports) | detectPlatform, BKIT_PLATFORM, isClaudeCode, PLUGIN_ROOT, PROJECT_DIR | 10 |
| cache.js (7 exports) | get, set, invalidate, clear, globalCache, DEFAULT_TTL | 8 |
| io.js (9 exports) | readStdinSync, parseHookInput, outputAllow, outputBlock, outputEmpty, truncateContext | 10 |
| debug.js (3 exports) | debugLog, getDebugLogPath, DEBUG_LOG_PATHS | 4 |
| config.js (5 exports) | loadConfig, getConfig, getBkitConfig, safeJsonParse | 6 |
| file.js (8 exports) | isSourceFile, isCodeFile, isUiFile, isEnvFile, extractFeature, TIER_EXTENSIONS | 7 |
| **Total** | **41** | **45** |

#### TC-LIB-PDCA: PDCA Module (55 TC)

| Module | Functions | TC |
|--------|:---------:|:--:|
| tier.js (8 exports) | getLanguageTier, isTier1-4, isExperimentalTier, getTierDescription | 10 |
| level.js (7 exports) | detectLevel, canSkipPhase, getRequiredPhases, isPhaseApplicable, LEVEL_PHASE_MAP | 10 |
| phase.js (9 exports) | getPhaseNumber, getPhaseName, getNextPdcaPhase, findDesignDoc, findPlanDoc, checkPhaseDeliverables | 12 |
| status.js (18 exports) | getPdcaStatusFull, updatePdcaStatus, addPdcaHistory, setActiveFeature, readBkitMemory, writeBkitMemory | 13 |
| automation.js (11 exports) | getAutomationLevel, shouldAutoAdvance, autoAdvancePdcaPhase, formatAskUserQuestion | 10 |
| **Total** | **53** | **55** |

#### TC-LIB-INTENT: Intent Module (30 TC)

| Module | Functions | TC |
|--------|:---------:|:--:|
| language.js (6 exports) | SUPPORTED_LANGUAGES, AGENT_TRIGGER_PATTERNS (7 agents), SKILL_TRIGGER_PATTERNS (4 skills), detectLanguage | 12 |
| trigger.js (5 exports) | matchImplicitAgentTrigger, matchImplicitSkillTrigger, detectNewFeatureIntent, extractFeatureNameFromRequest | 10 |
| ambiguity.js (8 exports) | calculateAmbiguityScore, generateClarifyingQuestions, containsFilePath, hasMultipleInterpretations | 8 |
| **Total** | **19** | **30** |

#### TC-LIB-TASK: Task Module (30 TC)

| Module | Functions | TC |
|--------|:---------:|:--:|
| classification.js (6 exports) | classifyTask, classifyTaskByLines, getPdcaLevel, getPdcaGuidance | 8 |
| context.js (7 exports) | setActiveSkill, setActiveAgent, getActiveSkill, getActiveAgent, clearActiveContext | 7 |
| creator.js (6 exports) | generatePdcaTaskSubject, createPdcaTaskChain, autoCreatePdcaTask | 8 |
| tracker.js (7 exports) | savePdcaTaskId, getPdcaTaskId, updatePdcaTaskStatus, triggerNextPdcaAction | 7 |
| **Total** | **26** | **30** |

#### TC-LIB-TEAM: Team Module (40 TC)

| Module | Functions | TC |
|--------|:---------:|:--:|
| coordinator.js (5 exports) | isTeamModeAvailable, getTeamConfig, generateTeamStrategy, formatTeamStatus, suggestTeamMode | 7 |
| strategy.js (2 exports) | TEAM_STRATEGIES (4 patterns), getTeammateRoles | 5 |
| hooks.js (2 exports) | assignNextTeammateWork, handleTeammateIdle | 4 |
| orchestrator.js (6 exports) | PHASE_PATTERN_MAP, selectOrchestrationPattern, composeTeamForPhase, shouldRecomposeTeam | 7 |
| communication.js (6 exports) | MESSAGE_TYPES, createMessage, createBroadcast, createPhaseTransitionNotice | 6 |
| task-queue.js (5 exports) | createTeamTasks, assignTaskToRole, getTeamProgress, findNextAvailableTask | 6 |
| cto-logic.js (5 exports) | decidePdcaPhase, evaluateCheckResults, selectAgentsForRole, recommendTeamComposition | 5 |
| **Total** | **31** | **40** |

---

### 3.7 TC-PDCA: PDCA Workflow Tests (35 TC)

| ID | Test Case | Pass Criteria |
|----|-----------|---------------|
| PDCA-01 | Plan → Design 전환 | Plan 완료 후 Design 제안 |
| PDCA-02 | Design → Do 전환 | Design 완료 후 구현 가이드 |
| PDCA-03 | Do → Check 전환 | 구현 완료 후 Gap Analysis 제안 |
| PDCA-04 | Check → Act (< 70%) | pdca-iterator 강력 권장 |
| PDCA-05 | Check → Act (70-89%) | 선택지 3가지 제시 |
| PDCA-06 | Check → Report (>= 90%) | Report 생성 제안 |
| PDCA-07 | Act → Check 재실행 | Iterator 후 gap-detector 재실행 |
| PDCA-08 | Report → Archive | Archive 실행 |
| PDCA-09 | Archive → Cleanup | Cleanup 실행 |
| PDCA-10 | 최대 5회 반복 | maxIterations 준수 |
| PDCA-11 | Task Chain 자동 생성 | [Plan]→[Design]→[Do]→[Check]→[Act] |
| PDCA-12 | Task blockedBy 의존성 | 순서 의존성 정확 |
| PDCA-13 | Multi-feature 지원 | 여러 Feature 동시 추적 |
| PDCA-14 | Feature 전환 | setActiveFeature() 정상 동작 |
| PDCA-15 | Status 표시 | Phase + Match Rate + Task 상태 |
| PDCA-16 | Starter Plan template | 간소화 Plan 생성 |
| PDCA-17 | Dynamic Design template | design.template.md 사용 |
| PDCA-18 | Enterprise Design template | design-enterprise.template.md 사용 |
| PDCA-19 | Analysis template 사용 | analysis.template.md 기반 |
| PDCA-20 | Report template 사용 | report.template.md 기반 |
| PDCA-21 | Pipeline Phase 내 PDCA | "각 Phase = 하나의 PDCA 사이클" 원칙 |
| PDCA-22 | Pipeline Phase 순서 | Phase 1→2→3→...→9 next-skill 연결 |
| PDCA-23 | Pipeline Level 분기 | Starter/Dynamic/Enterprise 적용 Phase 차이 |
| PDCA-24 | Pipeline Status 표시 | /pipeline-status 현재 Phase 표시 |
| PDCA-25 | Pipeline Next 진행 | /pipeline-next 다음 Phase 안내 |
| PDCA-26 | Plan 문서 BaaS 옵션 | Dynamic "BaaS integration (bkend.ai)" 표시 |
| PDCA-27 | Design 문서 BaaS 아키텍처 | BaaS Architecture diagram 포함 |
| PDCA-28 | Design 문서 MongoDB 스키마 | MongoDB Collection Schema 포함 |
| PDCA-29 | Phase-4 BaaS 가이드 | Dynamic Level 5단계 구현 가이드 |
| PDCA-30 | .bkit-memory.json 추적 | Phase 변경 시 자동 업데이트 |
| PDCA-31 | History 기록 | action, timestamp, details 기록 |
| PDCA-32 | Archive --summary 옵션 | 메트릭 보존 형태 |
| PDCA-33 | Archive Index 업데이트 | _INDEX.md 자동 생성 |
| PDCA-34 | Cleanup all 동작 | 전체 아카이브 정리 |
| PDCA-35 | Cleanup 선택적 동작 | 특정 Feature만 정리 |

---

### 3.8 TC-V152: v1.5.2 Enhancement Tests (45 TC)

#### TC-V152-BUG: BUG-01 수정 (5 TC)

| ID | Test Case | Pass Criteria |
|----|-----------|---------------|
| V152-BUG-01 | confidence `>= 0.8` 비교 | `0.8 >= 0.8 = true` 확인 |
| V152-BUG-02 | gap-detector 트리거 동작 | "검증" 키워드 → Agent 제안 |
| V152-BUG-03 | pdca-iterator 트리거 동작 | "개선" 키워드 → Agent 제안 |
| V152-BUG-04 | bkend-expert 트리거 동작 | "bkend" 키워드 → Agent 제안 |
| V152-BUG-05 | 모든 7개 Agent 트리거 | 7개 패턴 전체 매칭 확인 |

#### TC-V152-BKEND: bkend Expert Enhancement (40 TC) — Design V-01~V-34 + 추가 6

| ID | Design V-ID | Test Case | Pass Criteria |
|----|:-----------:|-----------|---------------|
| V152-BK-01 | V-01 | BUG-01 confidence fix | `>= 0.8` 코드 확인 |
| V152-BK-02 | V-02 | bkend-expert Agent Trigger | 8개 언어 패턴 매칭 |
| V152-BK-03 | V-03 | bkend-expert 내용 충실도 | 19 MCP Tools + REST API |
| V152-BK-04 | V-04 | Agent 문서 길이 | ~215줄 (허용 범위) |
| V152-BK-05 | V-05 | MCP config type:http | dynamic Skill 확인 |
| V152-BK-06 | V-06 | OAuth 인증 방식 | API Key 제거, OAuth 설명 |
| V152-BK-07 | V-07 | bkend Client 패턴 | REST bkendFetch() 패턴 |
| V152-BK-08 | V-08 | phase-4-api BaaS 가이드 | 5단계 구현 가이드 존재 |
| V152-BK-09 | V-09 | bkend 권장 분기 로직 | dynamic match + bkend check |
| V152-BK-10 | V-10 | MCP 설정 감지 로직 | checkBkendMcpConfig() |
| V152-BK-11 | V-11 | session-start 트리거 테이블 | bkend-expert 행 존재 |
| V152-BK-12 | V-12 | session-start MCP 상태 | Dynamic MCP 상태 표시 |
| V152-BK-13 | V-13 | plan 템플릿 BaaS 옵션 | BaaS integration 언급 |
| V152-BK-14 | V-14 | design 템플릿 BaaS 패턴 | MongoDB + BaaS 아키텍처 |
| V152-BK-15 | V-15 | Troubleshooting 12+ 항목 | 12개 에러 시나리오 |
| V152-BK-16 | V-16 | Agent Delegation 가이드 | 5개 위임 항목 |
| V152-BK-17 | V-17 | Automation First 준수 | auto-trigger + auto-suggestion |
| V152-BK-18 | V-18 | No Guessing 준수 | AskUserQuestion 유도 |
| V152-BK-19 | V-19 | 키워드 충돌 없음 | 2-word 구문 차별화 |
| V152-BK-20 | V-20 | Do NOT use for 범위 | Enterprise/infra 위임 명시 |
| V152-BK-21 | V-21 | bkend-data Skill 존재 | 파일 존재 확인 |
| V152-BK-22 | V-22 | bkend-auth Skill 존재 | 파일 존재 확인 |
| V152-BK-23 | V-23 | bkend-storage Skill 존재 | 파일 존재 확인 |
| V152-BK-24 | V-24 | bkend-quickstart Skill 존재 | 파일 존재 확인 |
| V152-BK-25 | V-25 | bkend-cookbook Skill 존재 | 파일 존재 확인 |
| V152-BK-26 | V-26 | Frontmatter 유효성 | name, description, agent, allowed-tools |
| V152-BK-27 | V-27 | mcp__bkend__* 와일드카드 | allowed-tools에 포함 |
| V152-BK-28 | V-28 | Agent-Skill 양방향 바인딩 | skills에 5개 포함 |
| V152-BK-29 | V-29 | skills_preload 핵심 3개 | data, auth, storage |
| V152-BK-30 | V-30 | 공유 템플릿 존재 | bkend-patterns.md |
| V152-BK-31 | V-31 | imports 연결 | 5개 모두 import 확인 |
| V152-BK-32 | V-32 | user-invocable: false | 5개 모두 |
| V152-BK-33 | V-33 | 8개 언어 Trigger | ko,ja,zh,es,fr,de,it |
| V152-BK-34 | V-34 | Do NOT use for 상호 배제 | 도메인 간 위임 |
| V152-BK-35 | - | bkend-patterns.md 공통 헤더 | x-project-id, x-environment, Authorization |
| V152-BK-36 | - | bkend-patterns.md HTTP Status | 200~500 매핑 |
| V152-BK-37 | - | bkend-patterns.md MCP Endpoint | Streamable HTTP, OAuth 2.1 |
| V152-BK-38 | - | bkend-patterns.md Environment | Free/Pro/Enterprise |
| V152-BK-39 | - | language.js 키워드 충돌 | bkend-expert vs dynamic SKILL 키워드 |
| V152-BK-40 | - | checkBkendMcpConfig 2경로 | .mcp.json + .claude/settings.json |

---

### 3.9 TC-TM: CTO Team Tests (30 TC)

| ID | Test Case | Pass Criteria |
|----|-----------|---------------|
| TM-01 | Team 생성 (Dynamic) | CTO + 3 teammates |
| TM-02 | Team 생성 (Enterprise) | CTO + 5 teammates |
| TM-03 | Starter Team 차단 | Team Mode 미지원 안내 |
| TM-04 | AGENT_TEAMS 환경 변수 | 미설정 시 경고 |
| TM-05 | Leader 패턴 | CTO 단독 의사결정 |
| TM-06 | Council 패턴 | 전문가 합의 기반 |
| TM-07 | Swarm 패턴 | 병렬 작업 실행 |
| TM-08 | Watchdog 패턴 | 지속 모니터링 |
| TM-09 | Plan Phase 패턴 | leader (Dynamic/Enterprise) |
| TM-10 | Design Phase 패턴 | leader(Dynamic)/council(Enterprise) |
| TM-11 | Do Phase 패턴 | swarm |
| TM-12 | Check Phase 패턴 | council |
| TM-13 | Act Phase 패턴 | leader(Dynamic)/watchdog(Enterprise) |
| TM-14 | Task Queue 생성 | createTeamTasks() 정상 동작 |
| TM-15 | Task 할당 | assignTaskToRole() 정상 동작 |
| TM-16 | 진행률 추적 | getTeamProgress() 정상 반환 |
| TM-17 | 다음 Task 검색 | findNextAvailableTask() 정상 동작 |
| TM-18 | Phase 완료 판단 | isPhaseComplete() 정상 동작 |
| TM-19 | 메시지 생성 | createMessage(), createBroadcast() |
| TM-20 | Phase 전환 알림 | createPhaseTransitionNotice() |
| TM-21 | Plan 결정 | createPlanDecision() |
| TM-22 | PDCA Phase 결정 | decidePdcaPhase() 정확 판단 |
| TM-23 | Check 결과 평가 | evaluateCheckResults() 정확 판단 |
| TM-24 | 역할별 Agent 선택 | selectAgentsForRole() 정확 매핑 |
| TM-25 | 팀 구성 추천 | recommendTeamComposition() Level별 |
| TM-26 | 동적 팀 재구성 | shouldRecomposeTeam() 판단 |
| TM-27 | Team Stop 처리 | cto-stop.js 상태 저장 |
| TM-28 | TeammateIdle 처리 | team-idle-handler.js 동작 |
| TM-29 | 자동 팀 제안 | suggestTeamMode() Major Feature |
| TM-30 | 팀 상태 포맷 | formatTeamStatus() 표시 |

---

### 3.10 TC-ML: Multi-Language Tests (24 TC)

#### 8개 언어별 Agent Trigger (8 TC)

| ID | Language | Input | Expected Agent |
|----|----------|-------|----------------|
| ML-01 | Korean | "맞아?" | gap-detector |
| ML-02 | English | "is this right?" | gap-detector |
| ML-03 | Japanese | "正しい?" | gap-detector |
| ML-04 | Chinese | "对吗?" | gap-detector |
| ML-05 | Spanish | "¿es correcto?" | gap-detector |
| ML-06 | French | "c'est correct?" | gap-detector |
| ML-07 | German | "ist das richtig?" | gap-detector |
| ML-08 | Italian | "è giusto?" | gap-detector |

#### 8개 언어별 Skill Trigger (8 TC)

| ID | Language | Input | Expected Skill |
|----|----------|-------|----------------|
| ML-09 | Korean | "정적 웹사이트" | starter |
| ML-10 | English | "login feature" | dynamic |
| ML-11 | Japanese | "マイクロサービス" | enterprise |
| ML-12 | Chinese | "移动应用" | mobile-app |
| ML-13 | Spanish | "sitio web estático" | starter |
| ML-14 | French | "microservices" | enterprise |
| ML-15 | German | "statische Website" | starter |
| ML-16 | Italian | "autenticazione" | dynamic |

#### 언어 감지 + Ambiguity (8 TC)

| ID | Test Case | Pass Criteria |
|----|-----------|---------------|
| ML-17 | detectLanguage() Korean | 유니코드 범위 한국어 감지 |
| ML-18 | detectLanguage() Japanese | 유니코드 범위 일본어 감지 |
| ML-19 | detectLanguage() Chinese | 유니코드 범위 중국어 감지 |
| ML-20 | detectLanguage() Mixed | 복합 언어 우선순위 |
| ML-21 | Ambiguity Korean | "뭔가 만들어줘" → Score >= 50 |
| ML-22 | Ambiguity English | "make something" → Score >= 50 |
| ML-23 | Magic Word Korean | "!hotfix 수정" → Score = 0 |
| ML-24 | bkend-expert 8개 언어 | 각 언어별 "백엔드 서비스" 트리거 |

---

### 3.11 TC-CFG: Configuration Tests (15 TC)

| ID | Test Case | Pass Criteria |
|----|-----------|---------------|
| CFG-01 | bkit.config.json 로드 | loadConfig() 정상 |
| CFG-02 | version 확인 | "1.5.1" |
| CFG-03 | matchRateThreshold | 90 적용 |
| CFG-04 | maxIterations | 5 적용 |
| CFG-05 | levelDetection Enterprise | kubernetes/ 패턴 감지 |
| CFG-06 | levelDetection Dynamic | .mcp.json 패턴 감지 |
| CFG-07 | levelDetection Starter | 기본값 |
| CFG-08 | agents.levelBased | Starter→starter-guide, Dynamic→bkend-expert |
| CFG-09 | templates.levelVariants | Starter→design-starter, Enterprise→design-enterprise |
| CFG-10 | automation.supportedLanguages | 8개 언어 목록 |
| CFG-11 | team.maxTeammates | 5 |
| CFG-12 | team.ctoAgent | "cto-lead" |
| CFG-13 | outputStyles.levelDefaults | Starter→learning, Dynamic→pdca-guide |
| CFG-14 | hooks 설정 | 4개 Hook Event 설정 |
| CFG-15 | permissions 설정 | Write/Edit/Read/Bash 권한 |

---

### 3.12 TC-PERF: Performance Tests (10 TC)

| ID | Test Case | Pass Criteria |
|----|-----------|---------------|
| PERF-01 | SessionStart Hook 실행 | <= 5000ms |
| PERF-02 | UserPromptSubmit 실행 | <= 3000ms |
| PERF-03 | PreToolUse 실행 | <= 5000ms |
| PERF-04 | TTL 캐싱 히트율 | >= 80% (5초 이내) |
| PERF-05 | Import resolver 캐싱 | <= 50ms 재로드 |
| PERF-06 | Agent Memory 로딩 | <= 100ms |
| PERF-07 | Task classification | <= 100ms |
| PERF-08 | Context Fork 생성 | <= 100ms |
| PERF-09 | Language detection | <= 50ms |
| PERF-10 | Config 로드 | <= 100ms |

---

### 3.13 TC-EDGE: Edge Case Tests (15 TC)

| ID | Test Case | Pass Criteria |
|----|-----------|---------------|
| EDGE-01 | 빈 프로젝트 Level 감지 | Starter 기본값 |
| EDGE-02 | PDCA 문서 없이 구현 | Design 생성 제안 (비차단) |
| EDGE-03 | 순환 Import | 에러 감지 및 경고 |
| EDGE-04 | 잘못된 Hook output | graceful fallback |
| EDGE-05 | .bkit-memory.json 손상 | 기본값 복구 |
| EDGE-06 | bkit.config.json 없음 | 기본 설정 적용 |
| EDGE-07 | 0 lines 코드 변경 | quick_fix 분류 |
| EDGE-08 | 매우 큰 파일 (10000 lines) | truncateContext 동작 |
| EDGE-09 | Team Mode 미지원 환경 | 경고 메시지 + 단일 Agent 폴백 |
| EDGE-10 | Match Rate 정확히 90% | >= 90% 이므로 Report 제안 |
| EDGE-11 | Match Rate 정확히 70% | 70-89% 선택지 제시 |
| EDGE-12 | 동시 2개 Feature PDCA | Multi-feature 전환 정상 |
| EDGE-13 | Agent Trigger 동점 (2개 Agent) | 우선순위 높은 Agent 선택 |
| EDGE-14 | 빈 Skill imports | 에러 없이 무시 |
| EDGE-15 | UTF-8 BOM 파일 | 정상 파싱 |

---

## 4. Test Matrix Summary

| Category | Code | TC Count | Priority |
|----------|------|:--------:|:--------:|
| Philosophy Compliance | TC-PH | 60 | Must |
| UX Flow | TC-UX | 40 | Must |
| Skills Functional | TC-SK | 80 | Must |
| Agents Functional | TC-AG | 64 | Must |
| Hooks Integration | TC-HK | 55 | Must |
| Library Unit | TC-LIB | 200 | Must |
| PDCA Workflow | TC-PDCA | 35 | Must |
| v1.5.2 Enhancement | TC-V152 | 45 | Must |
| CTO Team | TC-TM | 30 | Should |
| Multi-Language | TC-ML | 24 | Should |
| Configuration | TC-CFG | 15 | Should |
| Performance | TC-PERF | 10 | Could |
| Edge Cases | TC-EDGE | 15 | Could |
| **TOTAL** | | **693** | |

---

## 5. Test Strategy

### 5.1 CTO Team 구성

| Role | Model | Responsibility | TC 범위 |
|------|-------|---------------|---------|
| **CTO Lead** | opus | 전체 조율, 전략, 품질 관문 | 전체 관리 |
| **UX Analyst** | opus | 사용자 경험 + 철학 검증 | TC-PH (60) + TC-UX (40) = 100 |
| **Skills/Agents Tester** | sonnet | Skills + Agents 기능 검증 | TC-SK (80) + TC-AG (64) = 144 |
| **Hooks/Library Tester** | sonnet | Hooks + Library 단위 검증 | TC-HK (55) + TC-LIB (200) = 255 |
| **Integration Tester** | sonnet | PDCA + v1.5.2 + Team + Config | TC-PDCA (35) + TC-V152 (45) + TC-TM (30) + TC-ML (24) + TC-CFG (15) + TC-PERF (10) + TC-EDGE (15) = 174 |

### 5.2 테스트 실행 순서

```
Phase 1: Library Unit Tests (TC-LIB 200 TC)
  ├── 기반 함수 동작 확인 (다른 테스트의 전제조건)
  └── 병렬 실행 가능 (5 modules 독립)

Phase 2: v1.5.2 Enhancement (TC-V152 45 TC)
  ├── BUG-01 수정 확인 (Critical)
  └── bkend Skills 5개 + 공유 템플릿 검증

Phase 3: Hooks + Config (TC-HK 55 + TC-CFG 15 = 70 TC)
  ├── Hook 실행 흐름 확인
  └── 설정값 적용 검증

Phase 4: Skills + Agents (TC-SK 80 + TC-AG 64 = 144 TC)
  ├── 개별 Skill/Agent 동작 확인
  └── 8개 언어 Trigger 검증 (TC-ML 24 TC 포함)

Phase 5: PDCA Workflow + UX Flow (TC-PDCA 35 + TC-UX 40 = 75 TC)
  ├── 전체 PDCA 사이클 E2E 검증
  └── 사용자 여정 시나리오 검증

Phase 6: Philosophy + CTO Team (TC-PH 60 + TC-TM 30 = 90 TC)
  ├── 6대 철학 원칙 전달 검증
  └── Agent Teams 통합 검증

Phase 7: Performance + Edge Cases (TC-PERF 10 + TC-EDGE 15 = 25 TC)
  └── 성능 + 경계 조건 검증
```

### 5.3 병렬 실행 전략

```
[Phase 1] Library Unit (200 TC)
     ├── core/ (45 TC)    ─┐
     ├── pdca/ (55 TC)    ─┤── 5개 module 병렬
     ├── intent/ (30 TC)  ─┤
     ├── task/ (30 TC)    ─┤
     └── team/ (40 TC)    ─┘

[Phase 2-3] 순차 (115 TC)
     └── v1.5.2 → Hooks → Config

[Phase 4] Skills + Agents (144 TC)
     ├── Level Skills (9 TC)      ─┐
     ├── Pipeline Skills (27 TC)  ─┤── 4그룹 병렬
     ├── bkend Skills (20 TC)     ─┤
     └── Agents (64 TC)           ─┘

[Phase 5-7] 순차 (190 TC)
     └── PDCA → UX → Philosophy → Team → Perf → Edge
```

---

## 6. Success Criteria

### 6.1 Pass 기준

| Level | Pass Rate | Action |
|:-----:|:---------:|--------|
| **Excellent** | >= 99% | Release 승인 |
| **Good** | 95-98% | 경미한 이슈 수정 후 Release |
| **Acceptable** | 90-94% | 주요 이슈 수정 필요 |
| **Fail** | < 90% | Release 차단, 재테스트 필요 |

### 6.2 Philosophy Compliance 별도 기준

| Philosophy | Must Pass | Criteria |
|------------|:---------:|---------|
| Automation First (AF) | 8/10 | 자동화 동작 80% 이상 |
| No Guessing (NG) | 7/8 | 추측 방지 87% 이상 |
| Docs = Code (DC) | 8/10 | 문서-코드 동기화 80% 이상 |
| Context Engineering (CE) | 8/10 | 컨텍스트 관리 80% 이상 |
| Agent Role Boundaries (ARB) | 10/12 | 역할 경계 83% 이상 |
| Level System (LS) | 8/10 | Level 분기 80% 이상 |

### 6.3 v1.5.1 대비 비교 기준

| Metric | v1.5.1 | v1.5.2 Target |
|--------|:------:|:------------:|
| Total TC | 671 | **693** |
| Pass Rate | 99.6% (668/671) | **>= 99%** |
| Bugs Found | 4 (all fixed) | **0 regression** |
| Philosophy TC | 0 | **60 (신규)** |
| UX Flow TC | 0 | **40 (신규)** |

---

## 7. Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|:----------:|------------|
| BUG-01 회귀 | Critical | Low | TC-V152-BUG 5개 TC로 검증 |
| Hook timeout 초과 | High | Medium | PERF-01~03 성능 테스트 |
| Agent Teams 미지원 환경 | Medium | Medium | EDGE-09 폴백 테스트 |
| 8개 언어 감지 오류 | Medium | Low | TC-ML 24개 TC 전체 검증 |
| bkend Skills 키워드 충돌 | High | Low | V152-BK-19, V152-BK-39 |

---

## 8. Next Steps

1. [ ] 이 Plan 문서 승인
2. [ ] CTO Team 5명 구성하여 병렬 테스트 실행
3. [ ] Phase 1 (Library Unit 200 TC) 우선 실행
4. [ ] 테스트 결과 Gap Analysis → `/pdca analyze`
5. [ ] 결과 보고서 → `/pdca report`

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-06 | 초기 계획서 - CTO Team 5-agent 병렬 분석 기반 (693 TC) | CTO Team |
