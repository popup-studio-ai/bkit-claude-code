# bkit v1.5.1 Comprehensive Test Design Document

> **Summary**: bkit v1.5.1의 전체 335개 테스트케이스에 대한 상세 검증 설계서. 각 TC별 검증 방법, 입력값, 기대 출력, 통과 기준, 실제 구현 코드 참조를 포함합니다.
>
> **Project**: bkit-claude-code
> **Version**: 1.5.1
> **Author**: bkit Team
> **Date**: 2026-02-06
> **Status**: Draft
> **Planning Doc**: [bkit-v1.5.1-comprehensive-test.plan.md](../../01-plan/features/bkit-v1.5.1-comprehensive-test.plan.md)

---

## 1. Overview

### 1.1 Design Goals

1. **완전한 커버리지**: Plan 문서의 335개 TC 전체를 빠짐없이 상세 설계
2. **검증 가능성**: 각 TC마다 구체적인 입력/출력/통과기준을 명시하여 테스터가 주관적 판단 없이 Pass/Fail 결정 가능
3. **코드 추적성**: 각 TC가 검증하는 실제 구현 파일과 함수를 명시
4. **재현 가능성**: 동일한 환경에서 동일한 결과를 얻을 수 있는 테스트 절차

### 1.2 Design Principles

- **Atomic Test**: 각 TC는 하나의 기능만 검증
- **Independent**: TC 간 의존성 최소화 (순서 무관하게 실행 가능)
- **Observable**: 모든 기대 결과는 눈으로 확인 가능한 출력으로 정의
- **Traceable**: TC-ID → Plan 문서 → 구현 코드 경로 추적 가능

### 1.3 Test Architecture

```
Test Execution Flow:
┌──────────────────────────────────────────────────────────────────────┐
│                        Test Categories (A-J)                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Category A: Skills (78 TC)                                         │
│  ├── A.1 Project Level Skills (9 TC)                                │
│  ├── A.2 PDCA Skill (14 TC)                                        │
│  ├── A.3 Pipeline Phase Skills (18 TC)                              │
│  ├── A.4 Utility Skills (12 TC)                                     │
│  └── A.5 System Skills (4 TC)                                       │
│                                                                      │
│  Category B: Agents (55 TC)                                         │
│  ├── B.1 Level-Based Agents (15 TC)                                 │
│  ├── B.2 PDCA Agents (24 TC)                                       │
│  └── B.3 Quality Agents (16 TC)                                     │
│                                                                      │
│  Category C: Hooks (38 TC)                                          │
│  ├── C.1 SessionStart (6 TC)                                       │
│  ├── C.2 PreToolUse (6 TC)                                         │
│  ├── C.3 PostToolUse (6 TC)                                        │
│  ├── C.4 Stop (6 TC)                                               │
│  ├── C.5 UserPromptSubmit (4 TC)                                   │
│  ├── C.6 PreCompact (2 TC)                                         │
│  ├── C.7 TaskCompleted [NEW] (4 TC)                                │
│  └── C.8 TeammateIdle [NEW] (4 TC)                                 │
│                                                                      │
│  Category D: Library Functions (42 TC)                              │
│  ├── D.1 Core Module (8 TC)                                        │
│  ├── D.2 PDCA Module (12 TC)                                       │
│  ├── D.3 Intent Module (6 TC)                                      │
│  ├── D.4 Task Module (10 TC)                                       │
│  └── D.5 Team Module [NEW] (6 TC)                                  │
│                                                                      │
│  Category E: PDCA Workflow (16 TC)                                  │
│  Category F: v1.5.1 New Features (48 TC)                           │
│  Category G: v2.1.33 Specific Features (18 TC)                     │
│  Category H: Multi-language Support (8 TC)                          │
│  Category I: Configuration & Metadata (12 TC)                       │
│  Category J: Backward Compatibility (20 TC)                         │
│                                                                      │
│  Total: 335 TC                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 1.4 Implementation Reference Map

| Module | Path | Export Count | Key Files |
|--------|------|-------------|-----------|
| Core | `lib/core/` | 37 | platform.js, cache.js, config.js, debug.js, io.js, file.js |
| PDCA | `lib/pdca/` | 50 | status.js (30), phase.js (9), level.js (7), tier.js (8), automation.js (11) |
| Intent | `lib/intent/` | 19 | language.js (6), trigger.js (5), ambiguity.js (8) |
| Task | `lib/task/` | 26 | classification.js (6), context.js (7), creator.js (6), tracker.js (7) |
| Team | `lib/team/` | 6 | coordinator.js (4), strategy.js (2) |
| Bridge | `lib/common.js` | 138 | All modules re-exported |
| Agents | `agents/` | 11 | gap-detector, pdca-iterator, code-analyzer, etc. |
| Skills | `skills/` | 21 | pdca, starter, dynamic, enterprise, etc. |
| Hooks | `hooks/` + `scripts/` | 8 events | hooks.json, session-start.js, unified-stop.js, etc. |
| Output Styles | `output-styles/` | 3 | bkit-pdca-guide, bkit-learning, bkit-enterprise |

---

## 2. Category A: Skills Test Design (21 Skills, 78 Cases)

### 2.1 A.1 Project Level Skills (3 Skills, 9 Cases)

#### A1-01: /starter Skill 호출

| Item | Detail |
|------|--------|
| **TC-ID** | A1-01 |
| **Test Case** | /starter Skill 정상 호출 |
| **Priority** | Critical |
| **Impl. File** | `skills/starter/SKILL.md` |
| **Precondition** | bkit 플러그인 활성화, Claude Code v2.1.33 |
| **Input** | 사용자 입력: `/starter` |
| **Execution** | Skill tool로 starter 호출 → SKILL.md 컨텐츠 로딩 → 가이드 표시 |
| **Expected Output** | 1. "Static web development" 관련 가이드 표시<br>2. HTML/CSS/JavaScript 및 Next.js App Router 기초 안내<br>3. `next-skill: phase-1-schema` 포함 (다음 단계 안내) |
| **Pass Criteria** | Skill 내용이 정상 표시되고 next-skill이 phase-1-schema를 가리킴 |
| **Verification** | 출력에 "static", "HTML", "CSS" 키워드 포함 확인 |

#### A1-02: /starter 초기화 명령

| Item | Detail |
|------|--------|
| **TC-ID** | A1-02 |
| **Priority** | High |
| **Input** | `init starter` 또는 `starter init` |
| **Expected Output** | 프로젝트 초기화 안내 (디렉토리 구조, 필수 파일 생성 가이드) |
| **Pass Criteria** | 초기화 관련 구체적 안내가 표시됨 |

#### A1-03: /starter 트리거 매칭

| Item | Detail |
|------|--------|
| **TC-ID** | A1-03 |
| **Priority** | Medium |
| **Impl. File** | `lib/intent/trigger.js` → `matchImplicitSkillTrigger()` |
| **Input** | "정적 웹사이트 만들고 싶어" |
| **Expected Output** | starter skill 자동 제안 (confidence score 포함) |
| **Pass Criteria** | `matchImplicitSkillTrigger()` → `{skill: 'starter', level: 'Starter'}` 반환 확인 |
| **Verification** | SessionStart hook 또는 UserPromptSubmit hook에서 트리거 감지 |

#### A2-01: /dynamic Skill 호출

| Item | Detail |
|------|--------|
| **TC-ID** | A2-01 |
| **Priority** | Critical |
| **Impl. File** | `skills/dynamic/SKILL.md` |
| **Input** | `/dynamic` |
| **Expected Output** | 1. Fullstack 개발 가이드 표시<br>2. bkend.ai BaaS 안내 포함<br>3. 인증/데이터 저장/API 통합 가이드 |
| **Pass Criteria** | "bkend", "BaaS", "fullstack" 관련 안내 정상 표시 |

#### A2-02: /dynamic 초기화 명령

| Item | Detail |
|------|--------|
| **TC-ID** | A2-02 |
| **Priority** | High |
| **Input** | `init dynamic` |
| **Expected Output** | BaaS 프로젝트 초기화 안내 |
| **Pass Criteria** | bkend.ai 설정 관련 구체적 가이드 표시 |

#### A2-03: /dynamic 트리거 매칭

| Item | Detail |
|------|--------|
| **TC-ID** | A2-03 |
| **Priority** | Medium |
| **Impl. File** | `lib/intent/trigger.js` → `matchImplicitSkillTrigger()` |
| **Input** | "로그인 기능 추가해줘" |
| **Expected Output** | `{skill: 'dynamic', level: 'Dynamic'}` 반환 |
| **Pass Criteria** | "로그인" 키워드가 Dynamic 레벨 트리거로 매칭됨 |

#### A3-01: /enterprise Skill 호출

| Item | Detail |
|------|--------|
| **TC-ID** | A3-01 |
| **Priority** | Critical |
| **Impl. File** | `skills/enterprise/SKILL.md` |
| **Input** | `/enterprise` |
| **Expected Output** | 1. Enterprise 가이드 표시<br>2. Kubernetes/Terraform 관련 안내<br>3. Monorepo 아키텍처 패턴 |
| **Pass Criteria** | "microservices", "kubernetes", "terraform" 관련 안내 표시 |

#### A3-02: /enterprise 초기화 명령

| Item | Detail |
|------|--------|
| **TC-ID** | A3-02 |
| **Priority** | High |
| **Input** | `init enterprise` |
| **Expected Output** | Monorepo 설정 안내 |
| **Pass Criteria** | Enterprise 레벨 프로젝트 구조 관련 구체적 가이드 표시 |

#### A3-03: /enterprise 트리거 매칭

| Item | Detail |
|------|--------|
| **TC-ID** | A3-03 |
| **Priority** | Medium |
| **Impl. File** | `lib/intent/trigger.js` → `matchImplicitSkillTrigger()` |
| **Input** | "마이크로서비스 아키텍처 설계" |
| **Expected Output** | `{skill: 'enterprise', level: 'Enterprise'}` 반환 |
| **Pass Criteria** | "마이크로서비스" 키워드가 Enterprise 레벨 트리거로 매칭 |

---

### 2.2 A.2 PDCA Skill (1 Skill, 14 Actions)

#### A4-01: /pdca plan action

| Item | Detail |
|------|--------|
| **TC-ID** | A4-01 |
| **Priority** | Critical |
| **Impl. File** | `skills/pdca/SKILL.md`, `lib/pdca/status.js`, `lib/task/creator.js` |
| **Input** | `/pdca plan test-feature` |
| **Expected Output** | 1. Plan 문서 생성 가이드 (plan.template.md 기반)<br>2. `docs/01-plan/features/test-feature.plan.md` 경로 안내<br>3. Task 생성: `[Plan] test-feature`<br>4. `.bkit-memory.json` phase="plan" 업데이트 |
| **Pass Criteria** | Plan 문서 경로 안내 + Task 생성 + 상태 업데이트 모두 확인 |
| **Verification** | TaskList로 `[Plan] test-feature` Task 존재 확인 |

#### A4-02: /pdca design action

| Item | Detail |
|------|--------|
| **TC-ID** | A4-02 |
| **Priority** | Critical |
| **Impl. File** | `skills/pdca/SKILL.md`, `lib/pdca/phase.js` → `findPlanDoc()` |
| **Precondition** | Plan 문서 존재 (`docs/01-plan/features/test-feature.plan.md`) |
| **Input** | `/pdca design test-feature` |
| **Expected Output** | 1. Plan 문서 존재 확인<br>2. Design 문서 생성 (design.template.md 기반)<br>3. Task: `[Design] test-feature` (blockedBy: Plan task)<br>4. `.bkit-memory.json` phase="design" |
| **Pass Criteria** | Plan 참조 확인 후 Design 문서 생성 + Task 의존성 설정 |
| **Error Case** | Plan 미존재 시: "Plan 문서가 먼저 필요합니다. /pdca plan 실행 제안" |

#### A4-03: /pdca do action

| Item | Detail |
|------|--------|
| **TC-ID** | A4-03 |
| **Priority** | High |
| **Precondition** | Design 문서 존재 |
| **Input** | `/pdca do test-feature` |
| **Expected Output** | 1. Design 문서 존재 확인<br>2. 구현 가이드 표시 (do.template.md 기반)<br>3. 구현 순서 체크리스트<br>4. 주요 파일/컴포넌트 목록<br>5. Task: `[Do] test-feature` |
| **Pass Criteria** | Design 참조 확인 + 구현 가이드 + Task 생성 |

#### A4-04: /pdca analyze action

| Item | Detail |
|------|--------|
| **TC-ID** | A4-04 |
| **Priority** | Critical |
| **Impl. File** | `skills/pdca/SKILL.md`, gap-detector Agent |
| **Precondition** | 구현 코드 존재 |
| **Input** | `/pdca analyze test-feature` |
| **Expected Output** | 1. gap-detector Agent 호출<br>2. 설계-구현 Gap 분석 결과<br>3. Match Rate % 산출<br>4. Gap 목록 표시<br>5. Task: `[Check] test-feature` |
| **Pass Criteria** | gap-detector Agent 실행 + Match Rate 반환 |
| **Verification** | Task(bkit:gap-detector) 호출 로그 확인 |

#### A4-05: /pdca iterate action

| Item | Detail |
|------|--------|
| **TC-ID** | A4-05 |
| **Priority** | High |
| **Impl. File** | pdca-iterator Agent |
| **Precondition** | Check 단계 완료, Match Rate < 90% |
| **Input** | `/pdca iterate test-feature` |
| **Expected Output** | 1. pdca-iterator Agent 호출<br>2. 코드 자동 개선<br>3. 재분석 트리거 제안<br>4. Task: `[Act-N] test-feature` |
| **Pass Criteria** | pdca-iterator 실행 + 코드 변경 + 재분석 안내 |

#### A4-06: /pdca report action

| Item | Detail |
|------|--------|
| **TC-ID** | A4-06 |
| **Priority** | High |
| **Impl. File** | report-generator Agent |
| **Precondition** | Match Rate >= 90% |
| **Input** | `/pdca report test-feature` |
| **Expected Output** | 1. report-generator Agent 호출<br>2. 완료 보고서 생성 (report.template.md 기반)<br>3. `docs/04-report/features/test-feature.report.md` 생성<br>4. Task: `[Report] test-feature` |
| **Pass Criteria** | 보고서 파일 생성 + Plan/Design/Check 메트릭 통합 |

#### A4-07: /pdca status action

| Item | Detail |
|------|--------|
| **TC-ID** | A4-07 |
| **Priority** | Medium |
| **Impl. File** | `lib/pdca/status.js` → `getPdcaStatusFull()` |
| **Input** | `/pdca status` |
| **Expected Output** | ```📊 PDCA Status```<br>Feature 이름, Phase, Match Rate, Iteration 수 표시<br>진행 바: `[Plan] ✅ → [Design] ✅ → [Do] ✅ → [Check] 🔄 → [Act] ⏳` |
| **Pass Criteria** | 현재 PDCA 상태가 정확하게 표시됨 |

#### A4-08: /pdca next action

| Item | Detail |
|------|--------|
| **TC-ID** | A4-08 |
| **Priority** | Medium |
| **Impl. File** | `lib/pdca/phase.js` → `getNextPdcaPhase()` |
| **Input** | `/pdca next` |
| **Expected Output** | 다음 단계 안내 + AskUserQuestion으로 확인 |
| **Pass Criteria** | 현재 phase에 맞는 다음 단계 정확히 제안 + 사용자 확인 질문 |

#### A4-09: /pdca archive action

| Item | Detail |
|------|--------|
| **TC-ID** | A4-09 |
| **Priority** | High |
| **Impl. File** | `lib/pdca/status.js` → `deleteFeatureFromStatus()` |
| **Precondition** | Report 완료 상태 |
| **Input** | `/pdca archive test-feature` |
| **Expected Output** | 1. `docs/archive/YYYY-MM/test-feature/` 폴더 생성<br>2. Plan/Design/Analysis/Report 문서 이동<br>3. 상태에서 feature 삭제 |
| **Pass Criteria** | 아카이브 폴더에 문서 이동 + 원본 위치 삭제 + 상태 정리 |

#### A4-10: /pdca archive --summary

| Item | Detail |
|------|--------|
| **TC-ID** | A4-10 |
| **Priority** | Medium |
| **Impl. File** | `lib/pdca/status.js` → `archiveFeatureToSummary()` |
| **Input** | `/pdca archive test-feature --summary` |
| **Expected Output** | 아카이브 + 요약 보존 (phase, matchRate, iterationCount, startedAt, archivedAt, archivedTo) |
| **Pass Criteria** | `.bkit-memory.json`에 경량 요약 데이터 보존됨 |
| **Verification** | JSON에 `"phase": "archived"`, `archivedTo` 경로 존재 확인 |

#### A4-11: /pdca cleanup action

| Item | Detail |
|------|--------|
| **TC-ID** | A4-11 |
| **Priority** | Medium |
| **Impl. File** | `lib/pdca/status.js` → `cleanupArchivedFeatures()`, `getArchivedFeatures()` |
| **Input** | `/pdca cleanup` |
| **Expected Output** | 1. 아카이브된 feature 목록 표시<br>2. AskUserQuestion으로 정리 대상 선택<br>3. 선택된 feature 상태 삭제 |
| **Pass Criteria** | 아카이브 목록 표시 + 사용자 확인 후 정리 실행 |

#### A4-12: /pdca team 시작 [NEW]

| Item | Detail |
|------|--------|
| **TC-ID** | A4-12 |
| **Priority** | Critical |
| **Impl. File** | `lib/team/coordinator.js`, `lib/team/strategy.js` |
| **Precondition** | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 설정 |
| **Input** | `/pdca team test-feature` |
| **Expected Output** | 1. `isTeamModeAvailable()` → true 확인<br>2. `detectLevel()` → 레벨 확인<br>3. `generateTeamStrategy(level, feature)` → 전략 생성<br>4. AskUserQuestion: Team Mode/단일 세션/취소 |
| **Pass Criteria** | 전략이 레벨에 맞게 생성되고 사용자 확인 질문 표시 |
| **Error Cases** | AGENT_TEAMS 미설정 → "Agent Teams 비활성" 안내<br>Starter 레벨 → "Dynamic/Enterprise 전용" 안내 |

#### A4-13: /pdca team status [NEW]

| Item | Detail |
|------|--------|
| **TC-ID** | A4-13 |
| **Priority** | High |
| **Impl. File** | `lib/team/coordinator.js` → `formatTeamStatus()` |
| **Input** | `/pdca team status` |
| **Expected Output** | Team 상태 (available, enabled, displayMode, maxTeammates) + PDCA 진행 상태 |
| **Pass Criteria** | Markdown 포맷의 팀 상태 정보 정확히 표시 |

#### A4-14: /pdca team cleanup [NEW]

| Item | Detail |
|------|--------|
| **TC-ID** | A4-14 |
| **Priority** | High |
| **Impl. File** | `scripts/team-stop.js` |
| **Input** | `/pdca team cleanup` |
| **Expected Output** | 1. Team 세션 확인<br>2. 리소스 정리<br>3. "Returning to single-session mode" 안내<br>4. PDCA history에 `team_session_ended` 기록 |
| **Pass Criteria** | 팀 리소스 정리 + 단일 세션 전환 안내 |

---

### 2.3 A.3 Pipeline Phase Skills (9 Skills, 18 Cases)

#### A5-01 ~ A5-09: Phase Skill 개별 호출

| TC-ID | Skill | Input | Expected Output | Pass Criteria | Impl. File |
|-------|-------|-------|-----------------|---------------|------------|
| A5-01 | /phase-1-schema | `/phase-1-schema` | 스키마 설계 가이드, 용어/엔티티/관계 정의 템플릿 | 스키마 관련 템플릿과 가이드 표시 | `skills/phase-1-schema/SKILL.md` |
| A5-02 | /phase-2-convention | `/phase-2-convention` | 코딩 컨벤션 정의 가이드, 네이밍/임포트 규칙 | 컨벤션 관련 가이드 표시 | `skills/phase-2-convention/SKILL.md` |
| A5-03 | /phase-3-mockup | `/phase-3-mockup` | HTML/CSS/JS 목업 생성 가이드 | 프로토타입 생성 절차 안내 | `skills/phase-3-mockup/SKILL.md` |
| A5-04 | /phase-4-api | `/phase-4-api` | API 설계 가이드 + Zero Script QA 안내 | REST API 설계 + QA 방법론 표시 | `skills/phase-4-api/SKILL.md` |
| A5-05 | /phase-5-design-system | `/phase-5-design-system` | 디자인 시스템/컴포넌트 라이브러리 가이드 | Design Token + 컴포넌트 구조 안내 | `skills/phase-5-design-system/SKILL.md` |
| A5-06 | /phase-6-ui-integration | `/phase-6-ui-integration` | UI + API 통합 가이드 | 프론트엔드-백엔드 연동 안내 | `skills/phase-6-ui-integration/SKILL.md` |
| A5-07 | /phase-7-seo-security | `/phase-7-seo-security` | SEO/보안 가이드 (OWASP Top 10) | 메타태그 + 보안 체크리스트 표시 | `skills/phase-7-seo-security/SKILL.md` |
| A5-08 | /phase-8-review | `/phase-8-review` | 코드 리뷰 + Gap 분석 가이드 | 아키텍처 일관성 + Gap 분석 안내 | `skills/phase-8-review/SKILL.md` |
| A5-09 | /phase-9-deployment | `/phase-9-deployment` | 배포 가이드 (CI/CD, K8s, Docker) | 배포 전략 + 환경 설정 안내 | `skills/phase-9-deployment/SKILL.md` |

#### A6-01 ~ A6-09: Phase Skill 전환 및 연동

| TC-ID | Test Case | Precondition | Expected Output | Pass Criteria |
|-------|-----------|-------------|-----------------|---------------|
| A6-01 | Phase 1→2 전환 | Phase 1 완료 | Phase 2 자동 제안, next-skill 동작 | Phase 2 컨벤션 Skill 자동 제안됨 |
| A6-02 | Phase 2→3 전환 | Phase 2 완료 | Phase 3 자동 제안 | Phase 3 목업 Skill 자동 제안됨 |
| A6-03 | Starter 레벨 Phase 4 스킵 | Starter 프로젝트 | "Dynamic 전용" 안내, Phase 4(API) 불가 | `canSkipPhase('Starter', 'phase-4')` → true |
| A6-04 | Phase Template 로딩 | 각 Phase 실행 | imports에 정의된 템플릿 정상 로드 | 템플릿 내용이 Skill 컨텍스트에 포함됨 |
| A6-05 | Phase 4 Agent 연동 | `/phase-4-api` 실행 | qa-monitor Agent 연결 가능 | Agent 호출 시 정상 응답 |
| A6-06 | Phase Stop Hook | Phase 완료 | `unified-stop.js` → 해당 phase stop 핸들러 실행 | SKILL_HANDLERS에 매핑된 핸들러 호출 확인 |
| A6-07 | Phase Skill context:fork | `/zero-script-qa` | fork 컨텍스트 분리, mergeResult 설정 적용 | 메인 컨텍스트와 독립적으로 실행 |
| A6-08 | Phase Stop 후 기록 | Phase 완료 후 | PDCA 상태 업데이트 + 다음 Phase 안내 | `.bkit-memory.json` 업데이트 확인 |
| A6-09 | Phase 1-9 순차 전환 | 전체 파이프라인 | 1→2→3→...→9 순서대로 전환 | 각 Phase가 이전 Phase 완료 후 진행 가능 |

---

### 2.4 A.4 Utility Skills (6 Skills, 12 Cases)

| TC-ID | Skill | Input | Expected Output | Pass Criteria | Priority |
|-------|-------|-------|-----------------|---------------|----------|
| A7-01 | /code-review | `/code-review` | 코드 품질 분석 시작, code-analyzer Agent 호출 안내 | code-analyzer 연동 확인 | High |
| A7-02 | /code-review LSP | 코드 리뷰 중 | LSP 도구 접근 (타입 체크 등) | LSP tool 사용 가능 확인 | Medium |
| A7-03 | /zero-script-qa | `/zero-script-qa` | QA 가이드, Docker 로그 모니터링 안내 | Zero Script QA 방법론 표시 | Medium |
| A7-04 | /claude-code-learning | `/claude-code-learning` | Claude Code 학습 시작, 설정 안내 | 학습 커리큘럼 표시 | Medium |
| A7-05 | /claude-code-learning learn | `learn` 키워드 입력 | 학습 모드 진입 | 대화형 학습 시작 | Medium |
| A7-06 | /mobile-app | `/mobile-app` | React Native/Flutter/Expo 가이드 | 크로스플랫폼 가이드 표시 | Medium |
| A7-07 | /desktop-app | `/desktop-app` | Electron/Tauri 가이드 | 데스크톱 앱 프레임워크 안내 | Medium |
| A7-08 | /development-pipeline | `/development-pipeline` | 9단계 파이프라인 전체 안내 | 9 Phase 전체 개요 표시 | High |
| A7-09 | /development-pipeline start | `start` 명령 | Phase 1부터 순차 가이드 | Phase 1 시작 안내 | High |
| A7-10 | /development-pipeline next | `next` 명령 | 현재 Phase 다음으로 이동 | 다음 Phase 정확히 안내 | High |
| A7-11 | /development-pipeline status | `status` 명령 | 전체 파이프라인 진행률 | 완료/미완료 Phase 시각화 | Medium |
| A7-12 | /bkit | `/bkit` 또는 `bkit help` | bkit 기능 목록 표시 | 전체 Skill/Agent 목록 표시 | Medium |

---

### 2.5 A.5 System Skills (2 Skills, 4 Cases)

| TC-ID | Skill | Input | Expected Output | Pass Criteria | Impl. Detail |
|-------|-------|-------|-----------------|---------------|-------------|
| A8-01 | bkit-rules | 자동 적용 | PDCA 규칙 컨텍스트 포함, 코드 품질 기준 | Agent/Skill 실행 시 규칙 자동 적용 확인 | `skills/bkit-rules/SKILL.md` 자동 프리로드 |
| A8-02 | bkit-rules imports | naming-conventions 로딩 | 네이밍 컨벤션 템플릿 로드 | imports 섹션의 naming-conventions.md 정상 로드 | templates/shared/naming-conventions.md |
| A8-03 | bkit-templates | 템플릿 요청 | 6종 PDCA 템플릿 목록 및 사용법 | plan/design/do/analysis/report/archive 템플릿 목록 | `skills/bkit-templates/SKILL.md` |
| A8-04 | bkit-templates 자동 적용 | Agent에서 참조 | design-validator, gap-detector에서 정상 참조 | Agent의 skills 목록에 bkit-templates 포함 → 정상 로드 | Agent frontmatter skills 확인 |

---

## 3. Category B: Agents Test Design (11 Agents, 55 Cases)

### Agent Configuration Reference (실제 구현 기준)

| Agent | Memory | Model | Permission | Tools | DisallowedTools | Context |
|-------|--------|-------|-----------|-------|-----------------|---------|
| gap-detector | project | opus | plan | Read, Glob, Grep, Task(Explore) | Write, Edit | fork |
| pdca-iterator | project | sonnet | acceptEdits | Read, Write, Edit, Glob, Grep, Bash, Task(Explore), Task(gap-detector), TodoWrite, LSP | - | - |
| code-analyzer | project | opus | plan | Read, Glob, Grep, Task, LSP | - | - |
| report-generator | project | haiku | acceptEdits | Read, Write, Glob, Grep | Bash | - |
| starter-guide | user | sonnet | acceptEdits | Read, Write, Edit, Glob, Grep, WebSearch, WebFetch | - | - |
| bkend-expert | project | sonnet | acceptEdits | Read, Write, Edit, Glob, Grep, Bash, WebFetch | - | - |
| enterprise-expert | project | opus | acceptEdits | Read, Write, Edit, Glob, Grep, Task(infra-architect), Task(Explore), WebSearch | - | - |
| design-validator | project | opus | plan | Read, Glob, Grep | Write, Edit, Bash | fork |
| qa-monitor | project | haiku | acceptEdits | Bash, Read, Write, Glob, Grep, Task(Explore) | - | - |
| pipeline-guide | user | sonnet | plan | Read, Glob, Grep, TodoWrite | Write, Edit, Bash | - |
| infra-architect | project | opus | acceptEdits | Read, Write, Edit, Glob, Grep, Bash, Task | - | - |

---

### 3.1 B.1 Level-Based Agents (3 Agents, 15 Cases)

#### B1-01 ~ B1-05: starter-guide Agent

| TC-ID | Test Case | Input | Expected | Pass Criteria | Impl. Detail |
|-------|-----------|-------|----------|---------------|-------------|
| B1-01 | 자동 트리거 | "초보자인데 웹사이트 만들고 싶어요" | starter-guide 자동 호출 | `matchImplicitAgentTrigger()` → `{agent: 'starter-guide'}` | lib/intent/trigger.js AGENT_TRIGGER_PATTERNS |
| B1-02 | 수동 호출 | Task tool로 직접 호출 | 친화적 가이드 제공 | model: sonnet으로 실행, 초보자 친화적 톤 | agents/starter-guide.md |
| B1-03 | 다국어 트리거 | "beginner" / "初心者" / "principiante" | 각 언어별 트리거 작동 | 8개 언어 모두 starter-guide 매칭 | AGENT_TRIGGER_PATTERNS.help |
| B1-04 | memory: user [NEW] | 세션 재시작 후 재호출 | 이전 세션 사용자 선호도 기억 | `~/.claude/agent-memory/starter-guide/` 파일 존재 확인 | frontmatter `memory: user` |
| B1-05 | permissionMode | Write/Edit 시도 | acceptEdits 모드: 사용자 확인 후 허용 | 위험 Bash는 차단, 파일 수정은 확인 후 진행 | permissionMode: acceptEdits |

#### B2-01 ~ B2-05: bkend-expert Agent

| TC-ID | Test Case | Input | Expected | Pass Criteria | Impl. Detail |
|-------|-----------|-------|----------|---------------|-------------|
| B2-01 | Dynamic 레벨 감지 | .mcp.json 존재 프로젝트 | bkend-expert 자동 제안 | `detectLevel()` → 'Dynamic' → bkend-expert 매핑 | bkit.config.json agents.levelBased.Dynamic |
| B2-02 | 인증 구현 요청 | "로그인 기능 구현해줘" | bkend.ai 인증 가이드 | 인증 관련 구체적 코드 예제 포함 | agents/bkend-expert.md 본문 |
| B2-03 | MCP 도구 접근 | mcp__bkend__* 호출 | MCP 도구 정상 접근 | ToolSearch로 bkend MCP 도구 검색 가능 | WebFetch tool 포함 |
| B2-04 | memory: project [NEW] | 세션 재시작 후 | 프로젝트별 BaaS 패턴 기억 | `.claude/agent-memory/bkend-expert/` 파일 확인 | frontmatter `memory: project` |
| B2-05 | WebFetch 도구 | bkend.ai docs 참조 | WebFetch 정상 작동 | URL fetch 성공 | tools 목록에 WebFetch 포함 |

#### B3-01 ~ B3-05: enterprise-expert Agent

| TC-ID | Test Case | Input | Expected | Pass Criteria | Impl. Detail |
|-------|-----------|-------|----------|---------------|-------------|
| B3-01 | Enterprise 레벨 감지 | kubernetes/ 디렉토리 존재 | enterprise-expert 자동 제안 | `detectLevel()` → 'Enterprise' → enterprise-expert 매핑 | bkit.config.json levelDetection.enterprise |
| B3-02 | 아키텍처 설계 | "마이크로서비스 아키텍처 설계" | 전략적 아키텍처 가이드 | 트레이드오프 분석 + 비용 고려 포함 | agents/enterprise-expert.md |
| B3-03 | Task(infra-architect) [NEW] | sub-agent 호출 | infra-architect만 spawn 가능 | `Task(infra-architect)` 정상 호출, 다른 agent 차단 | tools: Task(infra-architect) |
| B3-04 | Task(Explore) [NEW] | sub-agent 호출 | Explore만 spawn 가능 | `Task(Explore)` 정상 호출 | tools: Task(Explore) |
| B3-05 | memory: project [NEW] | 세션 재시작 후 | 프로젝트 아키텍처 결정 기억 | `.claude/agent-memory/enterprise-expert/` 파일 확인 | frontmatter `memory: project` |

---

### 3.2 B.2 PDCA Agents (4 Agents, 24 Cases)

#### B4-01 ~ B4-08: gap-detector Agent

| TC-ID | Test Case | Input | Expected | Pass Criteria | Impl. Detail |
|-------|-----------|-------|----------|---------------|-------------|
| B4-01 | Gap 분석 실행 | `/pdca analyze feature` | 설계-구현 Gap 분석 결과 | 설계문서 vs 코드 비교 결과 출력 | agents/gap-detector.md, linked-from-skills: pdca(analyze) |
| B4-02 | Match Rate 계산 | 설계문서 + 구현코드 | Match Rate % 반환 (0-100) | 숫자 형태의 Match Rate 출력 | 분석 결과에 matchRate 포함 |
| B4-03 | 90% 이상 결과 | Match Rate >= 90% | Report 단계 제안 | "report" 다음 단계 안내 | automation.js → generateAutoTrigger('check') |
| B4-04 | 90% 미만 결과 | Match Rate < 90% | Act 단계 제안 (iterate) | "iterate" 다음 단계 안내 | automation.js → generateAutoTrigger('check') |
| B4-05 | Task(Explore) 제한 [NEW] | Explore 이외 sub-agent 시도 | Explore만 허용, 나머지 차단 | Task(gap-detector) 등 호출 시 거부 | tools: Task(Explore) |
| B4-06 | memory: project [NEW] | 다회 분석 | 이전 Gap 패턴 학습 | `.claude/agent-memory/gap-detector/` 파일 존재 | frontmatter `memory: project` |
| B4-07 | context: fork | 분석 실행 | 메인 컨텍스트와 분리 | fork 컨텍스트에서 독립 실행, mergeResult: false | context: fork, mergeResult: false |
| B4-08 | imports 검증 | api-patterns.md | 템플릿 정상 로드 | api-patterns 내용이 Agent 컨텍스트에 포함 | imports: api-patterns.md |

#### B5-01 ~ B5-07: pdca-iterator Agent

| TC-ID | Test Case | Input | Expected | Pass Criteria | Impl. Detail |
|-------|-----------|-------|----------|---------------|-------------|
| B5-01 | 자동 개선 실행 | `/pdca iterate feature` | 코드 자동 개선 | Gap 목록 기반 코드 수정 | agents/pdca-iterator.md |
| B5-02 | 반복 제한 | 5회 반복 후 | 최대 반복 횟수 도달 알림 | "최대 반복 횟수(5) 도달" 메시지 | bkit.config.json pdca.maxIterations: 5 |
| B5-03 | 재분석 트리거 | 개선 완료 후 | gap-detector 재호출 제안 | `/pdca analyze` 명령 안내 | pdca-iterator → gap-detector 연계 |
| B5-04 | Task(Explore) 제한 [NEW] | Explore 호출 | 정상 작동 | Explore sub-agent 성공적 실행 | tools: Task(Explore) |
| B5-05 | Task(gap-detector) 제한 [NEW] | gap-detector 호출 | 정상 작동 | gap-detector sub-agent 성공적 실행 | tools: Task(gap-detector) |
| B5-06 | 다른 Agent 차단 [NEW] | enterprise-expert 호출 시도 | 차단됨 | enterprise-expert spawn 거부 | Task(enterprise-expert) 미포함 |
| B5-07 | memory: project [NEW] | 다회 반복 | 이전 수정 패턴 학습 | `.claude/agent-memory/pdca-iterator/` 파일 확인 | frontmatter `memory: project` |

#### B6-01 ~ B6-04: report-generator Agent

| TC-ID | Test Case | Input | Expected | Pass Criteria | Impl. Detail |
|-------|-----------|-------|----------|---------------|-------------|
| B6-01 | 보고서 생성 | `/pdca report feature` | report.template.md 기반 완료 보고서 | docs/04-report/ 경로에 파일 생성 | agents/report-generator.md, model: haiku |
| B6-02 | 메트릭 포함 | Plan+Design+Check 데이터 | 모든 PDCA 메트릭 통합 | matchRate, iterationCount, 기간 등 포함 | 보고서에 정량적 메트릭 섹션 존재 |
| B6-03 | memory: project [NEW] | 다회 보고서 | 이전 보고서 패턴 학습 | `.claude/agent-memory/report-generator/` 파일 확인 | frontmatter `memory: project` |
| B6-04 | Bash 차단 | Bash 도구 시도 | 명시적 disallowed | Bash 실행 거부 | disallowedTools: Bash |

#### B7-01 ~ B7-03: pipeline-guide Agent

| TC-ID | Test Case | Input | Expected | Pass Criteria | Impl. Detail |
|-------|-----------|-------|----------|---------------|-------------|
| B7-01 | 파이프라인 안내 | "어디서 시작해야 해?" | 현재 위치 + 다음 단계 | 9 Phase 중 현재 위치 표시 | agents/pipeline-guide.md, model: sonnet |
| B7-02 | 레벨별 가이드 | Starter/Dynamic/Enterprise | 레벨별 필수/선택 단계 | `getRequiredPhases(level)` 기반 정확한 안내 | lib/pdca/level.js |
| B7-03 | memory: user [NEW] | 세션 간 재호출 | 사용자 진행 상황 기억 | `~/.claude/agent-memory/pipeline-guide/` 파일 확인 | frontmatter `memory: user` |

---

### 3.3 B.3 Quality Agents (4 Agents, 16 Cases)

#### B8-01 ~ B8-05: code-analyzer Agent

| TC-ID | Test Case | Input | Expected | Pass Criteria | Impl. Detail |
|-------|-----------|-------|----------|---------------|-------------|
| B8-01 | 코드 품질 분석 | 코드 파일 제공 | 품질/보안/성능 이슈 목록 | 구체적 이슈 목록 (파일:라인 형태) | agents/code-analyzer.md, model: opus |
| B8-02 | LSP 도구 사용 | LSP 기반 분석 | 타입 오류 감지 | LSP tool 호출 성공 | tools: LSP |
| B8-03 | 트리거 매칭 | "코드 리뷰 해줘" | code-analyzer 자동 제안 | `matchImplicitAgentTrigger()` → code-analyzer | AGENT_TRIGGER_PATTERNS.analyze |
| B8-04 | memory: project [NEW] | 다회 분석 | 프로젝트 코드 패턴 학습 | `.claude/agent-memory/code-analyzer/` 파일 확인 | frontmatter `memory: project` |
| B8-05 | Task 도구 (제한 없음) | 다양한 sub-agent | Task 제한 없이 자유 호출 | Task(Explore), Task(Plan) 등 모두 가능 | tools: Task (제한 없음) |

#### B9-01 ~ B9-04: design-validator Agent

| TC-ID | Test Case | Input | Expected | Pass Criteria | Impl. Detail |
|-------|-----------|-------|----------|---------------|-------------|
| B9-01 | 설계 문서 검증 | 설계 문서 경로 | 완성도/일관성 분석 결과 | 누락 항목 + 불일치 목록 출력 | agents/design-validator.md, model: opus |
| B9-02 | API 패턴 검증 | API 스펙 문서 | api-patterns.md 기준 검증 | API 패턴 준수 여부 판정 | imports: api-patterns.md |
| B9-03 | Write/Edit 차단 | Write/Edit 시도 | 명시적 disallowed | Write, Edit, Bash 모두 거부 | disallowedTools: Write, Edit, Bash |
| B9-04 | memory: project [NEW] | 다회 검증 | 설계 패턴 학습 | `.claude/agent-memory/design-validator/` 파일 확인 | frontmatter `memory: project` |

#### B10-01 ~ B10-04: qa-monitor Agent

| TC-ID | Test Case | Input | Expected | Pass Criteria | Impl. Detail |
|-------|-----------|-------|----------|---------------|-------------|
| B10-01 | Docker 로그 모니터링 | `docker logs` 출력 | 에러 감지 및 문서화 | 에러 패턴 추출 + 이슈 리포트 | agents/qa-monitor.md, model: haiku |
| B10-02 | Bash 명령 실행 | QA 관련 bash 명령 | 정상 실행 | docker, curl 등 QA 명령 실행 가능 | tools: Bash |
| B10-03 | Task(Explore) 제한 [NEW] | sub-agent 호출 | Explore만 허용 | Task(Explore) 성공, 다른 agent 차단 | tools: Task(Explore) |
| B10-04 | memory: project [NEW] | 다회 QA | QA 패턴 학습 | `.claude/agent-memory/qa-monitor/` 파일 확인 | frontmatter `memory: project` |

#### B11-01 ~ B11-03: infra-architect Agent

| TC-ID | Test Case | Input | Expected | Pass Criteria | Impl. Detail |
|-------|-----------|-------|----------|---------------|-------------|
| B11-01 | 인프라 설계 | K8s/Terraform 요청 | 인프라 아키텍처 가이드 | AWS/K8s/Terraform 구체적 설정 안내 | agents/infra-architect.md, model: opus |
| B11-02 | CI/CD 파이프라인 | 배포 파이프라인 요청 | CI/CD 설정 가이드 | GitHub Actions/ArgoCD 등 파이프라인 설정 | tools: Bash 포함 |
| B11-03 | memory: project [NEW] | 다회 설계 | 인프라 결정 기억 | `.claude/agent-memory/infra-architect/` 파일 확인 | frontmatter `memory: project` |

---

## 4. Category C: Hooks Test Design (8 Events, 38 Cases)

### Hook Event Reference (실제 구현 기준)

| Event | Script | Timeout | Matcher | New in v1.5.1 |
|-------|--------|---------|---------|---------------|
| SessionStart | session-start.js | 5000ms | - | Agent Teams 감지 추가 |
| PreToolUse | pre-write.js, unified-bash-pre.js | 5000ms | Write/Edit, Bash | 기존 유지 |
| PostToolUse | post-write.js, post-bash.js, post-skill.js | 5000ms | Write, Bash, Skill | 기존 유지 |
| Stop | unified-stop.js | 10000ms | - | team-coordinator 핸들러 추가 |
| UserPromptSubmit | user-prompt-handler.js | 3000ms | - | 기존 유지 |
| PreCompact | context-compaction.js | 5000ms | - | 기존 유지 |
| TaskCompleted | pdca-task-completed.js | 5000ms | - | **NEW** |
| TeammateIdle | team-idle-handler.js | 5000ms | - | **NEW** |

---

### 4.1 C.1 SessionStart Hook (6 Cases)

| TC-ID | Test Case | Precondition | Expected Output | Pass Criteria | Impl. File |
|-------|-----------|-------------|-----------------|---------------|------------|
| C1-01 | 세션 시작 초기화 | 새 세션 시작 | PDCA 상태 초기화, 온보딩 표시, v1.5.1 버전 | JSON 응답에 hookEventName: "SessionStart" 포함 | hooks/session-start.js |
| C1-02 | 기존 작업 감지 | PDCA 진행 중 세션 | "Previous Work Detected" + AskUserQuestion | onboardingType: "resume", primaryFeature/phase 포함 | session-start.js → analyzeRequestAmbiguity() |
| C1-03 | AskUserQuestion | 세션 시작 시 | Continue/New/Status 옵션 표시 | AskUserQuestion tool 호출 확인 | system-reminder에 AskUserQuestion 지시 포함 |
| C1-04 | 자동 트리거 테이블 | 세션 시작 시 | 8개 언어 트리거 테이블 표시 | additionalContext에 트리거 테이블 Markdown 포함 | session-start.js additionalContext 생성부 |
| C1-05 | Feature Usage Report | 세션 시작 시 | v1.5.1 리포팅 규칙 포함 | additionalContext에 "bkit Feature Usage" 형식 포함 | session-start.js onboarding 출력부 |
| C1-06 | Agent Teams 감지 [NEW] | AGENT_TEAMS=1 설정 | "Agent Teams Detected" 섹션 표시 | `isTeamModeAvailable()` true → additionalContext에 "Agent Teams Detected" 포함 | session-start.js + lib/team/coordinator.js |

---

### 4.2 C.2 PreToolUse Hook (6 Cases)

| TC-ID | Test Case | Tool | Input | Expected | Pass Criteria |
|-------|-----------|------|-------|----------|---------------|
| C2-01 | Write 권한 검사 | Write | 소스 파일 경로 | PDCA 가이드 표시 | pre-write.js → PDCA 상태 기반 가이드 메시지 |
| C2-02 | Edit 권한 검사 | Edit | 소스 파일 경로 | 컨벤션 힌트 표시 | pre-write.js → 컨벤션 관련 힌트 |
| C2-03 | Bash 안전 검사 (위험) | Bash | `rm -rf /` | 차단: outputBlock() | unified-bash-pre.js → 위험 명령 패턴 매칭 → 차단 |
| C2-04 | Bash 안전 검사 (안전) | Bash | `ls -la` | 허용: outputAllow() | unified-bash-pre.js → 안전 명령 → 허용 |
| C2-05 | Phase 9 Bash 제한 | Bash | `kubectl delete` | 차단 메시지 | Phase 9 활성 시 위험 k8s 명령 차단 |
| C2-06 | QA Bash 검사 | Bash | QA 관련 명령 | qa-pre-bash.js 필터 | QA 컨텍스트에서 안전한 명령만 허용 |

---

### 4.3 C.3 PostToolUse Hook (6 Cases)

| TC-ID | Test Case | Tool | Trigger | Expected | Pass Criteria |
|-------|-----------|------|---------|----------|---------------|
| C3-01 | Write 후 PDCA 가이드 | Write | 소스 파일 Write 완료 | Gap 분석 제안, Phase 추적 | post-write.js → PDCA 상태 확인 → 다음 단계 안내 |
| C3-02 | Write 후 컴포넌트 추적 | Write | components/ 파일 Write | Phase 5 추적 기록 | components/ 경로 감지 → Phase 5 관련 기록 |
| C3-03 | Bash 후 QA 추적 | Bash | docker/curl 명령 | QA 로그 기록 | post-bash.js → QA 관련 명령 감지 → 로그 |
| C3-04 | Skill 후 다음 단계 | Skill | Skill 완료 | 다음 Skill/Agent 제안, context 저장 | post-skill.js → next-skill 안내 |
| C3-05 | Bash 후 Phase 전환 | Bash | 배포 관련 bash | Phase 9 추적 | 배포 명령 감지 → Phase 9 컨텍스트 설정 |
| C3-06 | Write 후 PDCA 문서 | Write | docs/ 파일 Write | PDCA 문서 추적 | docs/ 경로 감지 → PDCA 문서 업데이트 추적 |

---

### 4.4 C.4 Stop Hook (6 Cases)

| TC-ID | Test Case | Agent/Skill | Expected | Pass Criteria | Impl. File |
|-------|-----------|------------|----------|---------------|------------|
| C4-01 | PDCA Skill Stop | pdca | Phase 전환 기록 | PDCA 상태 업데이트 + 다음 Phase 안내 | scripts/unified-stop.js → SKILL_HANDLERS.pdca |
| C4-02 | Gap Detector Stop | gap-detector | Check→Act 또는 Check→Report | matchRate 기반 다음 단계 정확히 제안 | AGENT_HANDLERS['gap-detector'] |
| C4-03 | Iterator Stop | pdca-iterator | 재분석 제안 | `/pdca analyze` 명령 안내 | AGENT_HANDLERS['pdca-iterator'] |
| C4-04 | Code Review Stop | code-review | 다음 Phase 제안 | Phase 8 완료 후 다음 단계 안내 | SKILL_HANDLERS['code-review'] |
| C4-05 | Team Coordinator Stop [NEW] | team-coordinator | team-stop.js 실행, PDCA history 기록 | `addPdcaHistory({action: 'team_session_ended'})` 호출 확인 | AGENT_HANDLERS['team-coordinator'] → scripts/team-stop.js |
| C4-06 | Active Context 정리 | 모든 Stop 후 | `clearActiveContext()` 호출 | skill/agent 컨텍스트가 null로 초기화됨 | lib/task/context.js |

---

### 4.5 C.5 UserPromptSubmit Hook (4 Cases)

| TC-ID | Test Case | Input | Expected | Pass Criteria | Impl. File |
|-------|-----------|-------|----------|---------------|------------|
| C5-01 | 신규 기능 감지 | "새 기능 추가" | /pdca plan 제안 | `detectNewFeatureIntent()` → isNewFeature: true | lib/intent/trigger.js |
| C5-02 | Agent 트리거 | "검증해줘" | gap-detector 제안 | `matchImplicitAgentTrigger()` → gap-detector | scripts/user-prompt-handler.js |
| C5-03 | Skill 트리거 | "static site" | starter 제안 | `matchImplicitSkillTrigger()` → starter | scripts/user-prompt-handler.js |
| C5-04 | 모호성 감지 | 모호한 요청 | 명확화 질문 생성 | `calculateAmbiguityScore()` >= 50 → `generateClarifyingQuestions()` | lib/intent/ambiguity.js |

---

### 4.6 C.6 PreCompact Hook (2 Cases)

| TC-ID | Test Case | Trigger | Expected | Pass Criteria | Impl. File |
|-------|-----------|---------|----------|---------------|------------|
| C6-01 | 컨텍스트 압축 | 자동 압축 트리거 | PDCA 스냅샷 저장, 필수 정보 보존 | 압축 후에도 PDCA 상태/feature/phase 유지 | scripts/context-compaction.js |
| C6-02 | 스냅샷 정리 | 10개 초과 스냅샷 | 오래된 것 자동 삭제 | 최대 10개까지만 보존 | context-compaction.js 정리 로직 |

---

### 4.7 C.7 TaskCompleted Hook [NEW] (4 Cases)

| TC-ID | Test Case | Input (task_subject) | Expected Output | Pass Criteria | Impl. File |
|-------|-----------|---------------------|-----------------|---------------|------------|
| C7-01 | [Plan] Task 완료 | `"[Plan] login-feature"` | phase='plan' 감지, Design 자동 제안 | `detectPdcaFromTaskSubject()` → `{phase:'plan', feature:'login-feature'}` → next: design | scripts/pdca-task-completed.js |
| C7-02 | [Check] Task 완료 (>=90%) | `"[Check] login-feature"` (matchRate=95) | Report 제안 | `getNextPdcaActionAfterCompletion('check', 'login-feature')` → nextPhase: 'report' | lib/pdca/automation.js |
| C7-03 | [Check] Task 완료 (<90%) | `"[Check] login-feature"` (matchRate=75) | Iterate 제안 | nextPhase: 'act', command: '/pdca iterate login-feature' | lib/pdca/automation.js |
| C7-04 | autoAdvance 비활성 | autoAdvance: false | 제안만 표시, 자동 실행 안 함 | `shouldAutoAdvance()` → false → 수동 진행 안내만 | bkit.config.json hooks.taskCompleted.autoAdvance |

**검증 세부사항 - PDCA Task Pattern 매칭**:

```
Regex Patterns (pdca-task-completed.js):
  plan:   /\[Plan\]\s+(.+)/
  design: /\[Design\]\s+(.+)/
  do:     /\[Do\]\s+(.+)/
  check:  /\[Check\]\s+(.+)/
  act:    /\[Act(?:-\d+)?\]\s+(.+)/    ← Act-N 형태 지원
  report: /\[Report\]\s+(.+)/
```

---

### 4.8 C.8 TeammateIdle Hook [NEW] (4 Cases)

| TC-ID | Test Case | Condition | Expected Output | Pass Criteria | Impl. File |
|-------|-----------|-----------|-----------------|---------------|------------|
| C8-01 | Team Mode 활성 시 | AGENT_TEAMS=1 + teammate 대기 | "Check TaskList" 가이드 | hookSpecificOutput에 TaskList 안내 포함 | scripts/team-idle-handler.js |
| C8-02 | Team Mode 비활성 시 | env var 없음 | 기본 Allow 응답 (graceful degradation) | `isTeamModeAvailable()` false → `outputAllow()` 즉시 반환 | team-idle-handler.js 2번째 줄 |
| C8-03 | PDCA Feature 있을 때 | 진행 중 feature | feature 관련 다음 작업 제안 | primaryFeature + phase 정보 포함 | `getPdcaStatusFull()` 결과 활용 |
| C8-04 | PDCA Feature 없을 때 | feature 없음 | 일반 대기 메시지 | "Check TaskList for pending tasks" 범용 메시지 | feature 미감지 시 기본 안내 |

---

## 5. Category D: Library Functions Test Design (5 Modules, 42 Cases)

### 5.1 D.1 Core Module (lib/core/, 8 Cases)

| TC-ID | Module | Function | Test Input | Expected Output | Pass Criteria |
|-------|--------|----------|-----------|-----------------|---------------|
| D1-01 | platform.js | `detectPlatform()` | Claude Code 환경 | `'claude'` 반환 | 환경변수 기반 정확한 플랫폼 감지 |
| D1-02 | platform.js | `PLUGIN_ROOT`, `PROJECT_DIR` | - | 올바른 절대 경로 | PLUGIN_ROOT: 플러그인 디렉토리, PROJECT_DIR: 현재 프로젝트 |
| D1-03 | cache.js | `get/set/invalidate/clear` | set('key','val') → get('key') | `'val'` 반환, TTL 후 null | DEFAULT_TTL(5000ms) 초과 시 null |
| D1-04 | config.js | `loadConfig/getConfig` | - | bkit.config.json 정상 로드 | `getConfig('version')` → "1.5.1" |
| D1-05 | config.js | `getConfigArray()` | `getConfigArray('pdca.designDocPaths')` | 공백 구분 문자열 반환 | 배열을 문자열로 변환 |
| D1-06 | debug.js | `debugLog()` | `debugLog('Test', 'msg')` | BKIT_DEBUG=true 시 로그 파일 기록 | 로그 파일에 타임스탬프+카테고리+메시지 |
| D1-07 | io.js | `parseHookInput()` | hook context JSON | `{toolName, filePath}` 추출 | tool_name, file_path 정확히 파싱 |
| D1-08 | file.js | `isSourceFile/isCodeFile/isUiFile` | 다양한 파일 경로 | Tier별 분류 정확 | .js→source+code, .tsx→source+code+ui, .env→env |

---

### 5.2 D.2 PDCA Module (lib/pdca/, 12 Cases)

| TC-ID | Module | Function | Test Input | Expected Output | Pass Criteria |
|-------|--------|----------|-----------|-----------------|---------------|
| D2-01 | status.js | `getPdcaStatusFull()` | - | 전체 상태 JSON (v2 format) | version, features, activeFeatures, primaryFeature, history 키 포함 |
| D2-02 | status.js | `updatePdcaStatus()` | `('feat','design',{})` | 상태 업데이트 성공 | features.feat.phase === 'design' |
| D2-03 | status.js | `addActiveFeature/removeActiveFeature` | feature 추가/제거 | activeFeatures 배열 변경 | 추가 후 배열에 포함, 제거 후 미포함 |
| D2-04 | status.js | `switchFeatureContext()` | 다른 feature로 전환 | primaryFeature 변경 | 전환 성공 시 true 반환 |
| D2-05 | phase.js | `getNextPdcaPhase()` | 각 phase 입력 | 다음 phase 반환 | plan→design→do→check→act→report 순서 |
| D2-06 | phase.js | `findDesignDoc/findPlanDoc` | feature name | 문서 경로 반환 | 3개 fallback 패턴 중 존재하는 경로 반환 |
| D2-07 | phase.js | `validatePdcaTransition()` | `('feat','plan','design')` | `{valid: true}` | 유효한 전환: true, 스킵 시: false+reason |
| D2-08 | level.js | `detectLevel()` | 프로젝트 디렉토리 | Starter/Dynamic/Enterprise | kubernetes/ 존재→Enterprise, api/ 존재→Dynamic |
| D2-09 | tier.js | `getLanguageTier()` | 파일 경로 | Tier 1-4 반환 | .ts→Tier1, .py→Tier2, .java→Tier3, .cobol→Tier4 |
| D2-10 | automation.js | `shouldAutoAdvance()` | phase 입력 | boolean | 자동화 레벨 설정에 따라 결과 |
| D2-11 | automation.js | `detectPdcaFromTaskSubject()` [NEW] | `"[Plan] my-feature"` | `{phase:'plan', feature:'my-feature'}` | 정규식 매칭 정확, Act-N 패턴 포함 |
| D2-12 | automation.js | `getNextPdcaActionAfterCompletion()` [NEW] | `('check','feat')` | `{nextPhase, command, autoExecute}` | check(>=90)→report, check(<90)→act |

---

### 5.3 D.3 Intent Module (lib/intent/, 6 Cases)

| TC-ID | Module | Function | Test Input | Expected Output | Pass Criteria |
|-------|--------|----------|-----------|-----------------|---------------|
| D3-01 | language.js | `detectLanguage()` | 각 언어 텍스트 | 언어 코드 (en/ko/ja/zh/es/fr/de/it) | 8개 언어 정확 감지 |
| D3-02 | language.js | `matchMultiLangPattern()` | 다국어 패턴 맵 + 텍스트 | boolean | 패턴 매칭 정확 |
| D3-03 | trigger.js | `matchImplicitAgentTrigger()` | "검증해줘" | `{agent:'gap-detector', confidence:N}` | Agent + confidence score 정확 반환 |
| D3-04 | trigger.js | `matchImplicitSkillTrigger()` | "static site" | `{skill:'starter', level:'Starter'}` | Skill + level 정확 매칭 |
| D3-05 | ambiguity.js | `calculateAmbiguityScore()` | 모호한 요청 | `{score: 0-100, factors:[]}` | 0-100 범위 점수 + 요인 배열 |
| D3-06 | ambiguity.js | `generateClarifyingQuestions()` | 모호한 요청 + factors | 질문 배열 | AskUserQuestion 형식의 질문 객체 배열 |

---

### 5.4 D.4 Task Module (lib/task/, 10 Cases)

| TC-ID | Module | Function | Test Input | Expected Output | Pass Criteria |
|-------|--------|----------|-----------|-----------------|---------------|
| D4-01 | classification.js | `classifyTask()` | 콘텐츠 문자열 | `'trivial'/'minor'/'feature'/'major'` | 문자 수 기반 분류 정확 |
| D4-02 | classification.js | `getPdcaLevel()` | classification | `'none'/'light'/'standard'/'full'` | trivial→none, minor→light, feature→standard, major→full |
| D4-03 | classification.js | `getPdcaGuidanceByLevel()` | level, feature, lineCount | 가이드 텍스트 | 레벨별 적절한 PDCA 가이드 메시지 |
| D4-04 | context.js | `setActiveSkill/getActiveSkill` | 'pdca' | `'pdca'` 반환 | set 후 get으로 동일 값 조회 |
| D4-05 | context.js | `setActiveAgent/getActiveAgent` | 'gap-detector' | `'gap-detector'` 반환 | set 후 get으로 동일 값 조회 |
| D4-06 | context.js | `clearActiveContext` | - | skill=null, agent=null | 초기화 후 `hasActiveContext()` → false |
| D4-07 | creator.js | `createPdcaTaskChain()` | feature name | Task 체인 객체 | Plan→Design→Do→Check 순서 + blockedBy 의존성 |
| D4-08 | creator.js | `autoCreatePdcaTask()` | feature, phase | Task 생성 객체 | subject: `[Phase] feature`, description, metadata 포함 |
| D4-09 | tracker.js | `savePdcaTaskId/getPdcaTaskId` | feature, phase, taskId | 저장된 taskId 반환 | save 후 get으로 동일 ID 조회 |
| D4-10 | tracker.js | `triggerNextPdcaAction()` | feature, currentPhase | 다음 액션 객체 또는 null | phase별 다음 액션 정확히 결정 |

---

### 5.5 D.5 Team Module [NEW] (lib/team/, 6 Cases)

| TC-ID | Module | Function | Test Input | Expected Output | Pass Criteria | Impl. File |
|-------|--------|----------|-----------|-----------------|---------------|------------|
| D5-01 | coordinator.js | `isTeamModeAvailable()` | AGENT_TEAMS=1/미설정 | true/false | 환경변수 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS === '1'` 체크 | lib/team/coordinator.js |
| D5-02 | coordinator.js | `getTeamConfig()` | - | `{enabled, displayMode, maxTeammates, delegateMode}` | enabled: false(기본), maxTeammates: 4(기본) | bkit.config.json team 섹션 |
| D5-03 | coordinator.js | `generateTeamStrategy()` | 각 레벨 | 레벨별 전략 반환 | Starter→null, Dynamic→{teammates:2}, Enterprise→{teammates:4} | lib/team/strategy.js TEAM_STRATEGIES |
| D5-04 | coordinator.js | `formatTeamStatus()` | teamInfo + pdcaStatus | Markdown 상태 문자열 | available, enabled, displayMode, PDCA phase 포함 | coordinator.js |
| D5-05 | strategy.js | `TEAM_STRATEGIES` | - | 3개 레벨 전략 상수 | Starter:null, Dynamic:2teammates(developer,qa), Enterprise:4teammates(architect,developer,qa,reviewer) | strategy.js |
| D5-06 | strategy.js | `getTeammateRoles()` | 레벨 문자열 | 역할 배열 | Dynamic:2역할, Enterprise:4역할, Starter:빈배열 | strategy.js |

---

## 6. Category E: PDCA Workflow Test Design (16 Cases)

### 6.1 E.1 Full PDCA Cycle (14 Cases)

| TC-ID | Test Case | Input/Trigger | Expected Output | Pass Criteria | Key Functions |
|-------|-----------|---------------|-----------------|---------------|---------------|
| E1-01 | Plan 시작 | `/pdca plan test-feature` | Plan 문서 생성, Task `[Plan] test-feature` 생성 | docs/01-plan/features/ 경로 안내 + Task 존재 | `autoCreatePdcaTask()`, `updatePdcaStatus()` |
| E1-02 | Plan→Design 전환 | Plan 완료 | Design 단계 자동 제안 | "Next: /pdca design" 안내 | `getNextPdcaPhase('plan')` → 'design' |
| E1-03 | Design 시작 | `/pdca design test-feature` | Design 문서 생성, Plan 문서 참조 | Plan 참조 확인 후 Design 생성 | `findPlanDoc()`, `autoCreatePdcaTask()` |
| E1-04 | Design→Do 전환 | Design 완료 | 구현 시작 안내 | 구현 가이드 + Task `[Do]` 생성 안내 | `getNextPdcaPhase('design')` → 'do' |
| E1-05 | Do 단계 | 코드 구현 | Write/Edit Hook 가이드 | PreToolUse/PostToolUse hook 정상 동작 | pre-write.js, post-write.js |
| E1-06 | Do→Check 전환 | 구현 완료 | Analyze 제안 | `/pdca analyze` 명령 안내 | `getNextPdcaPhase('do')` → 'check' |
| E1-07 | Check (분석) | `/pdca analyze test-feature` | gap-detector 실행, Match Rate 산출 | 숫자형 Match Rate 출력 | gap-detector Agent |
| E1-08 | Check>=90%→Report | Match Rate >= 90% | Report 제안 | `/pdca report` 명령 안내 | `generateAutoTrigger('check', {matchRate:95})` |
| E1-09 | Check<90%→Act | Match Rate < 90% | Iterate 제안 | `/pdca iterate` 명령 안내 | `generateAutoTrigger('check', {matchRate:75})` |
| E1-10 | Act (개선) | `/pdca iterate test-feature` | 코드 자동 개선, 최대 5회 | 코드 변경 + 반복 카운트 | pdca-iterator Agent |
| E1-11 | Act→Check 재분석 | 개선 완료 | 재분석 트리거 | gap-detector 재실행 안내 | iterator → gap-detector 연계 |
| E1-12 | Report 생성 | `/pdca report test-feature` | 완료 보고서 생성 | docs/04-report/ 파일 생성 | report-generator Agent |
| E1-13 | Archive | `/pdca archive test-feature` | 문서 아카이브 | docs/archive/YYYY-MM/ 이동 + 상태 정리 | `deleteFeatureFromStatus()` |
| E1-14 | .bkit-memory.json 추적 | 전체 사이클 | phase 업데이트 추적 | plan→design→do→check→act→completed 순서 기록 | `updatePdcaStatus()` 각 단계 호출 |

### 6.2 E.2 PDCA Task System Integration (2 Cases)

| TC-ID | Test Case | Input | Expected Output | Pass Criteria |
|-------|-----------|-------|-----------------|---------------|
| E2-01 | Task Chain 생성 | Plan 시작 시 `createPdcaTaskChain('test-feature')` | [Plan]→[Design]→[Do]→[Check] Task 체인 | 4개 Task 생성, 각 Task에 blockedBy 설정 |
| E2-02 | Task Dependencies | 각 Phase Task | blockedBy 의존성 정확 | Design blockedBy Plan, Do blockedBy Design, Check blockedBy Do |

---

## 7. Category F: v1.5.1 New Features Test Design (48 Cases)

### 7.1 F.1 Agent Teams Integration (12 Cases)

| TC-ID | Test Case | Precondition | Input | Expected | Pass Criteria |
|-------|-----------|-------------|-------|----------|---------------|
| F1-01 | isTeamModeAvailable (활성) | `AGENT_TEAMS=1` | `isTeamModeAvailable()` | true | 환경변수 확인 → true |
| F1-02 | isTeamModeAvailable (비활성) | env var 없음 | `isTeamModeAvailable()` | false | 환경변수 미설정 → false |
| F1-03 | /pdca team (활성) | AGENT_TEAMS=1 | `/pdca team feat` | 전략 생성 + AskUserQuestion | Team Mode/단일 세션/취소 옵션 |
| F1-04 | /pdca team (비활성) | env var 없음 | `/pdca team feat` | "Agent Teams 비활성" 안내 | 활성화 방법 가이드 포함 |
| F1-05 | Starter 레벨 team | Starter 프로젝트 | `/pdca team feat` | "Dynamic/Enterprise 전용" | Starter는 Team Mode 미지원 안내 |
| F1-06 | Dynamic 전략 | Dynamic 레벨 | `generateTeamStrategy('Dynamic')` | {teammates:2, roles:[developer,qa]} | 2 teammates, do/check parallel |
| F1-07 | Enterprise 전략 | Enterprise 레벨 | `generateTeamStrategy('Enterprise')` | {teammates:4, roles:[architect,developer,qa,reviewer]} | 4 teammates, design/do/check/act parallel |
| F1-08 | Team Status 포맷 | - | `formatTeamStatus()` | Markdown 상태 출력 | available, enabled, displayMode, maxTeammates 포함 |
| F1-09 | assignNextTeammateWork | hooks.js | `assignNextTeammateWork('do','feat','Dynamic')` | {nextPhase:'check', mode:'parallel', roles} | Do 완료 → Check phase, parallel mode |
| F1-10 | handleTeammateIdle | hooks.js | `handleTeammateIdle('tm-1', pdcaStatus)` | {teammateId, feature, currentPhase, suggestion} | feature/phase 정보 + TaskList 확인 안내 |
| F1-11 | Team Stop cleanup | team-coordinator Stop | unified-stop.js → team-stop.js | PDCA history에 `team_session_ended` 기록 | `addPdcaHistory()` 호출 확인 |
| F1-12 | session-start Teams 감지 | AGENT_TEAMS=1 | 세션 시작 | additionalContext에 "Agent Teams Detected" | `/pdca team {feature}` 안내 포함 |

---

### 7.2 F.2 Output Styles (9 Cases)

| TC-ID | Test Case | Target | Expected | Pass Criteria | File |
|-------|-----------|--------|----------|---------------|------|
| F2-01 | bkit-pdca-guide 로딩 | Output Style 선택 | 정상 로드, frontmatter 파싱 | name: bkit-pdca-guide, keep-coding-instructions: true | output-styles/bkit-pdca-guide.md |
| F2-02 | bkit-pdca-guide 동작 | Dynamic 프로젝트 | PDCA 배지, Gap 분석 제안, 체크리스트 | 응답에 PDCA 상태 배지 포함 | bkit-pdca-guide.md Response Rules |
| F2-03 | bkit-learning 로딩 | Output Style 선택 | 정상 로드, frontmatter 파싱 | name: bkit-learning, keep-coding-instructions: true | output-styles/bkit-learning.md |
| F2-04 | bkit-learning 동작 | Starter 프로젝트 | Learning Point, TODO(learner) 마커 | "Learning Point" 섹션 + TODO(learner) 포함 | bkit-learning.md Response Rules |
| F2-05 | bkit-enterprise 로딩 | Output Style 선택 | 정상 로드, frontmatter 파싱 | name: bkit-enterprise, keep-coding-instructions: true | output-styles/bkit-enterprise.md |
| F2-06 | bkit-enterprise 동작 | Enterprise 프로젝트 | 아키텍처 tradeoff, 비용 분석 | 트레이드오프 테이블 + 비용 범위 포함 | bkit-enterprise.md Response Rules |
| F2-07 | keep-coding-instructions | 모든 스타일 | true | 보안 코딩 지시 유지 확인 | 3개 파일 모두 `keep-coding-instructions: true` |
| F2-08 | config levelDefaults | detectLevel() 결과 | Starter→learning, Dynamic→pdca-guide, Enterprise→enterprise | 레벨별 기본 스타일 매핑 정확 | bkit.config.json outputStyles.levelDefaults |
| F2-09 | config available 목록 | bkit.config.json | 3개 스타일 목록 일치 | ["bkit-pdca-guide","bkit-learning","bkit-enterprise"] | bkit.config.json outputStyles.available |

---

### 7.3 F.3 Memory Frontmatter (11 Cases)

| TC-ID | Agent | Expected Scope | Pass Criteria | Verification |
|-------|-------|----------------|---------------|-------------|
| F3-01 | gap-detector | project | `memory: project` frontmatter 존재 | agents/gap-detector.md frontmatter 확인 |
| F3-02 | pdca-iterator | project | `memory: project` frontmatter 존재 | agents/pdca-iterator.md frontmatter 확인 |
| F3-03 | code-analyzer | project | `memory: project` frontmatter 존재 | agents/code-analyzer.md frontmatter 확인 |
| F3-04 | report-generator | project | `memory: project` frontmatter 존재 | agents/report-generator.md frontmatter 확인 |
| F3-05 | starter-guide | user | `memory: user` frontmatter 존재 | agents/starter-guide.md frontmatter 확인 |
| F3-06 | bkend-expert | project | `memory: project` frontmatter 존재 | agents/bkend-expert.md frontmatter 확인 |
| F3-07 | enterprise-expert | project | `memory: project` frontmatter 존재 | agents/enterprise-expert.md frontmatter 확인 |
| F3-08 | design-validator | project | `memory: project` frontmatter 존재 | agents/design-validator.md frontmatter 확인 |
| F3-09 | qa-monitor | project | `memory: project` frontmatter 존재 | agents/qa-monitor.md frontmatter 확인 |
| F3-10 | pipeline-guide | user | `memory: user` frontmatter 존재 | agents/pipeline-guide.md frontmatter 확인 |
| F3-11 | infra-architect | project | `memory: project` frontmatter 존재 | agents/infra-architect.md frontmatter 확인 |

---

### 7.4 F.4 Sub-agent Restriction (8 Cases)

| TC-ID | Agent | Action | Expected | Pass Criteria | Impl. Detail |
|-------|-------|--------|----------|---------------|-------------|
| F4-01 | gap-detector | Task(Explore) 호출 | 허용 | Explore sub-agent 정상 실행 | tools: Task(Explore) |
| F4-02 | gap-detector | Task(pdca-iterator) 호출 | **차단** | pdca-iterator spawn 거부 | Task(pdca-iterator) 미포함 |
| F4-03 | pdca-iterator | Task(Explore) 호출 | 허용 | Explore 정상 실행 | tools: Task(Explore) |
| F4-04 | pdca-iterator | Task(gap-detector) 호출 | 허용 | gap-detector 정상 실행 | tools: Task(gap-detector) |
| F4-05 | pdca-iterator | Task(enterprise-expert) 호출 | **차단** | enterprise-expert spawn 거부 | Task(enterprise-expert) 미포함 |
| F4-06 | enterprise-expert | Task(infra-architect) 호출 | 허용 | infra-architect 정상 실행 | tools: Task(infra-architect) |
| F4-07 | enterprise-expert | Task(bkend-expert) 호출 | **차단** | bkend-expert spawn 거부 | Task(bkend-expert) 미포함 |
| F4-08 | qa-monitor | Task(Explore) 호출 | 허용, 다른 agent 차단 | Explore만 성공, 나머지 거부 | tools: Task(Explore) |

---

### 7.5 F.5 New Hook Scripts (8 Cases)

| TC-ID | Script | Input | Expected | Pass Criteria |
|-------|--------|-------|----------|---------------|
| F5-01 | pdca-task-completed.js | `task_subject: "[Plan] my-feature"` | `{phase:'plan', feature:'my-feature'}` | 정규식 매칭 정확 |
| F5-02 | pdca-task-completed.js | `task_subject: "[Act-3] my-feature"` | `{phase:'act', feature:'my-feature'}` | Act-N 패턴 지원 (`/\[Act(?:-\d+)?\]/`) |
| F5-03 | pdca-task-completed.js | `task_subject: "[Report] my-feature"` | `{phase:'report', feature:'my-feature'}` | Report 패턴 매칭 |
| F5-04 | pdca-task-completed.js | `task_subject: "일반 task 제목"` | null (PDCA 아닌 Task) | 비-PDCA Task → 기본 Allow 응답 |
| F5-05 | pdca-task-completed.js | shouldAutoAdvance=true | 자동 Phase 전환 | `autoAdvancePdcaPhase()` 호출 + 상태 업데이트 |
| F5-06 | team-idle-handler.js | AGENT_TEAMS=1 | PDCA 가이드 출력 | hookSpecificOutput에 TeammateIdle + 안내 |
| F5-07 | team-idle-handler.js | env var 없음 | 기본 Allow 응답 | `outputAllow()` 즉시 반환 (graceful) |
| F5-08 | team-stop.js | 팀 종료 | PDCA history에 `team_session_ended` 기록 | `addPdcaHistory({action:'team_session_ended'})` |

---

## 8. Category G: v2.1.33 Specific Features Test Design (18 Cases)

### 8.1 G.1 Agent Teams Platform (6 Cases)

| TC-ID | Test Case | Input | Expected | Pass Criteria |
|-------|-----------|-------|----------|---------------|
| G1-01 | AGENT_TEAMS env var | `export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` | Team Mode 활성화 | Claude Code에서 Team 기능 사용 가능 |
| G1-02 | Team Mode 진입 | 다수 teammate 설정 | teammate 생성 확인 | teammate 프로세스 생성 로그 확인 |
| G1-03 | Task List 공유 | Team Lead + Teammates | Task List 공유 정상 | 모든 팀원이 동일 TaskList 접근 가능 |
| G1-04 | Mailbox 통신 | 팀원 간 메시지 | 메시지 전달 확인 | 메시지 송수신 로그 확인 |
| G1-05 | Display Mode | in-process / split-pane | 표시 모드 전환 | displayMode 설정에 따른 UI 변경 |
| G1-06 | Delegate Mode | delegateMode: true | AI 리드 자동 작업 분배 | 자동 Task 할당 확인 |

### 8.2 G.2 Memory System Platform (4 Cases)

| TC-ID | Test Case | Input | Expected | Pass Criteria |
|-------|-----------|-------|----------|---------------|
| G2-01 | project scope 저장 | Agent 세션 종료 | `.claude/agent-memory/{agent}/` 파일 생성 | 디렉토리/파일 존재 확인 |
| G2-02 | project scope 로드 | Agent 세션 시작 | 이전 memory 로드 | Agent가 이전 학습 내용 반영 |
| G2-03 | user scope 저장 | starter-guide 세션 종료 | `~/.claude/agent-memory/starter-guide/` 파일 생성 | 홈 디렉토리에 파일 존재 |
| G2-04 | user scope 로드 | starter-guide 재시작 | 이전 user memory 로드 | 사용자 선호도/레벨 기억 |

### 8.3 G.3 Output Styles Platform (4 Cases)

| TC-ID | Test Case | Input | Expected | Pass Criteria |
|-------|-----------|-------|----------|---------------|
| G3-01 | Output Style 활성화 | /output-style 명령 | 스타일 목록 표시 | bkit 3개 스타일 목록에 표시 |
| G3-02 | 커스텀 스타일 로드 | output-styles/ 디렉토리 | bkit 스타일 3종 인식 | 3개 .md 파일 정상 로드 |
| G3-03 | keep-coding-instructions | 스타일 적용 | 기존 코딩 지시 보존 | 보안 관련 지시 유지 확인 |
| G3-04 | Skill Budget Scaling | 스타일 + Skill 동시 | context window 2% 내에서 정상 | Skill 내용 잘림 없음 |

### 8.4 G.4 Claude Opus 4.6 Compatibility (4 Cases)

| TC-ID | Test Case | Input | Expected | Pass Criteria |
|-------|-----------|-------|----------|---------------|
| G4-01 | Opus 4.6 Agent 호출 | model: opus Agent | Opus 4.6 모델 사용 | Agent 응답 헤더에 claude-opus-4-6 확인 |
| G4-02 | Sonnet Agent 호출 | model: sonnet Agent | Sonnet 4.5 모델 사용 | Agent 정상 실행 |
| G4-03 | Haiku Agent 호출 | model: haiku Agent | Haiku 4.5 모델 사용 | Agent 정상 실행, 빠른 응답 |
| G4-04 | Agent 모델 할당 | 전체 Agent | 정확한 모델 매핑 | opus(5개), sonnet(4개), haiku(2개) 매핑 정확 |

**Agent-Model 매핑 검증 기준**:

| Model | Agents (Expected) |
|-------|-------------------|
| opus | gap-detector, code-analyzer, enterprise-expert, design-validator, infra-architect |
| sonnet | pdca-iterator, starter-guide, bkend-expert, pipeline-guide |
| haiku | report-generator, qa-monitor |

---

## 9. Category H: Multi-language Test Design (8 Cases)

### 검증 대상 함수

- `detectLanguage()` → lib/intent/language.js
- `matchMultiLangPattern()` → lib/intent/language.js
- `matchImplicitAgentTrigger()` → lib/intent/trigger.js
- `AGENT_TRIGGER_PATTERNS` → lib/intent/language.js

| TC-ID | Language | Trigger Input | Expected Agent | Pass Criteria | Pattern Source |
|-------|----------|---------------|----------------|---------------|---------------|
| H1-01 | English | "verify implementation" | gap-detector | `detectLanguage()` → 'en', `matchImplicitAgentTrigger()` → gap-detector | AGENT_TRIGGER_PATTERNS.verify.en |
| H1-02 | Korean | "검증해줘" | gap-detector | `detectLanguage()` → 'ko', trigger 매칭 | AGENT_TRIGGER_PATTERNS.verify.ko |
| H1-03 | Japanese | "確認して" | gap-detector | `detectLanguage()` → 'ja', trigger 매칭 | AGENT_TRIGGER_PATTERNS.verify.ja |
| H1-04 | Chinese | "验证一下" | gap-detector | `detectLanguage()` → 'zh', trigger 매칭 | AGENT_TRIGGER_PATTERNS.verify.zh |
| H1-05 | Spanish | "verificar" | gap-detector | `detectLanguage()` → 'es', trigger 매칭 | AGENT_TRIGGER_PATTERNS.verify.es |
| H1-06 | French | "vérifier" | gap-detector | `detectLanguage()` → 'fr', trigger 매칭 | AGENT_TRIGGER_PATTERNS.verify.fr |
| H1-07 | German | "prüfen" | gap-detector | `detectLanguage()` → 'de', trigger 매칭 | AGENT_TRIGGER_PATTERNS.verify.de |
| H1-08 | Italian | "verificare" | gap-detector | `detectLanguage()` → 'it', trigger 매칭 | AGENT_TRIGGER_PATTERNS.verify.it |

---

## 10. Category I: Configuration & Metadata Test Design (12 Cases)

### 검증 대상 파일

- `bkit.config.json` → 전체 설정
- `.claude-plugin/plugin.json` → 플러그인 메타데이터

| TC-ID | Config Section | Key Path | Expected Value | Pass Criteria | File |
|-------|----------------|----------|----------------|---------------|------|
| I1-01 | version | `version` | `"1.5.1"` | 정확히 "1.5.1" 문자열 | bkit.config.json |
| I1-02 | PDCA 설정 | `pdca.matchRateThreshold`, `pdca.maxIterations` | 90, 5 | 각각 숫자 90과 5 | bkit.config.json |
| I1-03 | Level Detection | `levelDetection` | enterprise/dynamic/default 규칙 | enterprise: kubernetes 등, dynamic: api 등, default: Starter | bkit.config.json |
| I1-04 | Agent 매핑 | `agents.levelBased` | Starter→starter-guide, Dynamic→bkend-expert, Enterprise→enterprise-expert | 레벨별 Agent 이름 정확 | bkit.config.json |
| I1-05 | 권한 설정 | `permissions` | Write/Edit/Read/Bash 허용, rm -rf 차단 | 위험 명령 패턴 포함 확인 | bkit.config.json |
| I1-06 | 자동화 설정 | `automation.supportedLanguages` | 8개 언어 목록 | ["en","ko","ja","zh","es","fr","de","it"] | bkit.config.json |
| I1-07 | Team 설정 [NEW] | `team` | enabled:false, displayMode, maxTeammates:4 | team 섹션 존재 + 기본값 정확 | bkit.config.json |
| I1-08 | Team levelOverrides [NEW] | `team.levelOverrides` | Dynamic:2, Enterprise:4 | maxTeammates 레벨별 오버라이드 | bkit.config.json |
| I1-09 | OutputStyles 설정 [NEW] | `outputStyles` | directory, available 3종, levelDefaults | 3개 스타일 + 레벨 매핑 존재 | bkit.config.json |
| I1-10 | Hooks taskCompleted [NEW] | `hooks.taskCompleted` | enabled:true, autoAdvance:true | 두 필드 모두 true | bkit.config.json |
| I1-11 | Hooks teammateIdle [NEW] | `hooks.teammateIdle` | enabled:true | enabled 필드 true | bkit.config.json |
| I1-12 | plugin.json 메타데이터 | `version`, `name` | "1.5.1", "bkit" | 버전과 이름 정확 | .claude-plugin/plugin.json |

---

## 11. Category J: Backward Compatibility Test Design (20 Cases)

### 11.1 J.1 v1.5.0 기능 회귀 테스트 (10 Cases)

| TC-ID | Test Case | Feature | Expected | Pass Criteria |
|-------|-----------|---------|----------|---------------|
| J1-01 | 기존 Skills 정상 | 21개 전체 Skills | 기존 동작 변화 없음 | 각 Skill 호출 시 v1.5.0과 동일한 출력 |
| J1-02 | 기존 Agents 정상 | 11개 전체 Agents | 기존 동작 변화 없음 | Agent 호출 시 v1.5.0과 동일한 동작 |
| J1-03 | 기존 Hooks 정상 | 6개 기존 이벤트 | 기존 동작 변화 없음 | SessionStart~PreCompact 모두 정상 동작 |
| J1-04 | lib/common.js bridge | 기존 132 exports | 모든 기존 함수 접근 가능 | `require('../lib/common')` 후 132개 함수 모두 접근 |
| J1-05 | lib/core/ 모듈 | 기존 37 exports | 정상 동작 | 37개 함수 호출 가능 |
| J1-06 | lib/pdca/ 모듈 | 기존 48 exports + 2 new | 정상 동작 | 기존 48개 + 신규 2개 함수 모두 접근 가능 |
| J1-07 | lib/intent/ 모듈 | 기존 19 exports | 정상 동작 | 19개 함수 호출 가능 |
| J1-08 | lib/task/ 모듈 | 기존 26 exports | 정상 동작 | 26개 함수 호출 가능 |
| J1-09 | PDCA 사이클 정상 | Plan→Design→Do→Check→Act | 기존 워크플로우 변화 없음 | Team Mode 없이도 전체 PDCA 사이클 완주 가능 |
| J1-10 | 다국어 트리거 | 8개 언어 | 기존 매칭 정확도 유지 | v1.5.0과 동일한 트리거 매칭 결과 |

### 11.2 J.2 Team Mode 비활성 시 호환성 (5 Cases)

| TC-ID | Test Case | Condition | Expected | Pass Criteria |
|-------|-----------|-----------|----------|---------------|
| J2-01 | Team 없이 PDCA | AGENT_TEAMS 미설정 | 기존 PDCA 완벽 동작 | `/pdca plan/design/do/analyze/report` 모두 정상 |
| J2-02 | Team 없이 Stop | team-coordinator 아닌 Stop | 기존 Stop 핸들러 동작 | SKILL_HANDLERS, AGENT_HANDLERS 기존 매핑 정상 |
| J2-03 | Team 없이 SessionStart | AGENT_TEAMS 미설정 | Teams 섹션 없이 정상 시작 | additionalContext에 "Agent Teams Detected" 미포함 |
| J2-04 | lib/team require 실패 | team 모듈 없는 환경 | graceful degradation, 에러 없음 | try-catch로 안전 처리, 기존 기능 정상 |
| J2-05 | Team config 기본값 | team.enabled: false | 모든 team 함수 안전 반환 | `getTeamConfig()` → enabled:false, 다른 함수 안전 동작 |

### 11.3 J.3 Output Styles 비활성 시 호환성 (3 Cases)

| TC-ID | Test Case | Condition | Expected | Pass Criteria |
|-------|-----------|-----------|----------|---------------|
| J3-01 | Output Styles 미설정 | 스타일 선택 안 함 | 기본 Claude Code 출력 | 스타일 없이도 모든 기능 정상 |
| J3-02 | output-styles/ 부재 | 디렉토리 없음 | 에러 없이 정상 동작 | 디렉토리 미존재 시 기본 동작 |
| J3-03 | 잘못된 스타일 이름 | 존재하지 않는 스타일 | 기본 동작 유지 | 에러 메시지 없이 기본 출력 |

### 11.4 J.4 Memory 비지원 환경 (2 Cases)

| TC-ID | Test Case | Condition | Expected | Pass Criteria |
|-------|-----------|-----------|----------|---------------|
| J4-01 | v2.1.31에서 memory | 구버전 Claude Code | memory frontmatter 무시, 정상 동작 | Agent 실행 시 에러 없음 |
| J4-02 | Memory 디렉토리 부재 | .claude/agent-memory/ 없음 | Agent 정상 실행, memory 없이 | Agent 기능 정상, memory 저장만 스킵 |

---

## 12. Test Execution Design

### 12.1 Phase별 실행 순서

| Phase | Duration | Categories | TC Count | Priority |
|-------|----------|------------|----------|----------|
| Phase 1 | 3h | E (PDCA 16) + J1 (Backward 10) + I (Config 12) | 38 | Critical |
| Phase 2 | 3h | F (New Features 48) + G (v2.1.33 18) | 66 | Critical |
| Phase 3 | 3h | A (Skills 78) + B (Agents 55) | 133 | Critical/High |
| Phase 4 | 2h | C (Hooks 38) + D (Library 42) | 80 | High/Medium |
| Phase 5 | 1.5h | J2-J4 (Compat 10) + H (Multi-lang 8) | 18 | High/Medium |
| **Total** | **12.5h** | **A-J** | **335** | - |

### 12.2 TC 우선순위 분포

| Priority | Count | Percentage | Target Pass Rate |
|----------|-------|------------|------------------|
| Critical | 89 | 26.6% | 100% |
| High | 152 | 45.4% | 95%+ |
| Medium | 94 | 28.1% | 90%+ |
| **Total** | **335** | 100% | **95%+ overall** |

### 12.3 결과 판정 기준

| Level | Condition | Decision |
|-------|-----------|----------|
| CERTIFIED | Critical 100% + Overall 95%+ + Regression 0 | 릴리스 가능 |
| CONDITIONAL | Critical 100% + Overall 90%+ | 조건부 릴리스 (Minor 이슈 해결 후) |
| NOT CERTIFIED | Critical < 100% 또는 Overall < 90% | 릴리스 불가, 수정 필요 |

---

## 13. Traceability Matrix

### Plan TC-ID → Design 섹션 매핑

| Plan Category | Plan TC Range | Design Section | TC Count |
|---------------|---------------|----------------|----------|
| A. Skills | A1-01 ~ A8-04 | Section 2 | 78 |
| B. Agents | B1-01 ~ B11-03 | Section 3 | 55 |
| C. Hooks | C1-01 ~ C8-04 | Section 4 | 38 |
| D. Library | D1-01 ~ D5-06 | Section 5 | 42 |
| E. PDCA Workflow | E1-01 ~ E2-02 | Section 6 | 16 |
| F. v1.5.1 New Features | F1-01 ~ F5-08 | Section 7 | 48 |
| G. v2.1.33 Specific | G1-01 ~ G4-04 | Section 8 | 18 |
| H. Multi-language | H1-01 ~ H1-08 | Section 9 | 8 |
| I. Configuration | I1-01 ~ I1-12 | Section 10 | 12 |
| J. Backward Compat | J1-01 ~ J4-02 | Section 11 | 20 |
| **Total** | | | **335** |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-06 | Initial draft - 335 TC detailed design across 10 categories | bkit Team |

---

*Generated by bkit PDCA Skill | 2026-02-06*
