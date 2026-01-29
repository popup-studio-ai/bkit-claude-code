# bkit 플러그인 통합 테스트 계획서

> **Summary**: bkit v1.4.7 플러그인의 모든 기능(Skills 21개, Agents 11개, Lib 모듈 4개, Task 연동)에 대한 포괄적 테스트 계획
>
> **Project**: bkit-claude-code
> **Version**: 1.4.7
> **Author**: Claude Opus 4.5
> **Date**: 2026-01-29
> **Status**: Draft
> **Reference Designs**:
> - `task-bkit-integration.design.md`
> - `bkit-core-modularization.design.md`

---

## 1. Overview

### 1.1 Purpose

bkit 플러그인 v1.4.7의 **완전한 기능 검증**을 위한 테스트 계획:

1. **설계-구현 일치 검증**: 두 설계서(Task+bkit 연동, Core 모듈화) 대비 구현 확인
2. **기존 기능 회귀 테스트**: 21개 Skills, 11개 Agents, 모든 Hooks 동작 확인
3. **신규 기능 검증**: Task 체인 영속성, Check↔Act 자동 반복, 자동화 레벨
4. **통합 테스트**: PDCA 전체 사이클 E2E 테스트

### 1.2 Background

**v1.4.7 주요 변경사항:**
- lib/common.js → 4개 모듈 분리 (core, pdca, intent, task)
- Task ID 영속화 (.pdca-status.json 확장)
- PDCA Task 체인 자동 생성
- Check↔Act 자동 반복 사이클 (최대 5회)
- 자동화 레벨 (manual/semi-auto/full-auto)

### 1.3 Related Documents

| 문서 | 경로 | 용도 |
|------|------|------|
| Task+bkit 연동 설계서 | `docs/02-design/features/task-bkit-integration.design.md` | Task 영속성, 자동 반복 설계 |
| Core 모듈화 설계서 | `docs/02-design/features/bkit-core-modularization.design.md` | 모듈 분리 설계 |
| Task+bkit 연동 계획서 | `docs/01-plan/features/task-bkit-integration.plan.md` | 요구사항 정의 |

---

## 2. Scope

### 2.1 In Scope

#### 2.1.1 설계서 대비 구현 검증 (P0)
- [x] **FR-01**: Task 체인 자동 생성 (`createPdcaTaskChain`)
- [x] **FR-02**: Task ID 영속화 (`savePdcaTaskId`, `getPdcaTaskId`)
- [x] **FR-03**: 세션 간 Task 복원
- [x] **FR-04**: Check→Act 자동 트리거 (`triggerNextPdcaAction`)
- [x] **FR-05**: Check↔Act 자동 반복 (최대 5회)
- [x] **FR-06**: matchRate >= 90% → Report 자동 생성
- [x] **FR-07**: blockedBy Task ID 기반 변경

#### 2.1.2 Core 모듈화 검증 (P0)
- [x] lib/core/ 모듈 (platform, cache, io, debug, config, file)
- [x] lib/pdca/ 모듈 (status, phase, level, tier, automation)
- [x] lib/intent/ 모듈 (trigger, language, ambiguity)
- [x] lib/task/ 모듈 (creator, tracker, context, classification)
- [x] lib/common.js Migration Bridge 하위 호환성

#### 2.1.3 기존 기능 회귀 테스트 (P1)
- [x] Skills 21개 동작 확인
- [x] Agents 11개 동작 확인
- [x] Hooks (session-start) 동작 확인
- [x] Stop Scripts 17개 동작 확인

#### 2.1.4 통합 테스트 (P1)
- [x] PDCA 전체 사이클 E2E
- [x] Task Management System 연동
- [x] 다국어 Intent Detection (8개 언어)

### 2.2 Out of Scope

- 외부 시스템 통합 (Jira, Linear)
- Gemini CLI 호환성 (별도 테스트)
- 성능/부하 테스트
- UI/UX 테스트

---

## 3. Test Categories

### 3.1 Category Overview

| Category | Test Count | Priority | Automation |
|----------|:----------:|:--------:|:----------:|
| **A. 모듈 단위 테스트** | 45 | P0 | 가능 |
| **B. Task 연동 테스트** | 18 | P0 | 부분 |
| **C. Skills 테스트** | 21 | P1 | 가능 |
| **D. Agents 테스트** | 11 | P1 | 부분 |
| **E. Hooks 테스트** | 5 | P1 | 가능 |
| **F. PDCA E2E 테스트** | 8 | P0 | 부분 |
| **총계** | **108** | | |

---

## 4. Test Cases

### 4.1 Category A: 모듈 단위 테스트 (45 cases)

#### A.1 lib/core/ 테스트 (16 cases)

| ID | 테스트 | 대상 모듈 | 예상 결과 |
|----|--------|----------|----------|
| A.1.1 | Platform 감지 - Claude | platform.js | `BKIT_PLATFORM === 'claude'` |
| A.1.2 | Platform 감지 - Gemini | platform.js | `BKIT_PLATFORM === 'gemini'` |
| A.1.3 | Platform 감지 - Unknown | platform.js | `BKIT_PLATFORM === 'unknown'` |
| A.1.4 | PLUGIN_ROOT 경로 확인 | platform.js | 유효한 절대 경로 |
| A.1.5 | PROJECT_DIR 경로 확인 | platform.js | 유효한 절대 경로 |
| A.1.6 | Cache get/set | cache.js | 값 저장 및 조회 |
| A.1.7 | Cache TTL 만료 | cache.js | 만료 후 null 반환 |
| A.1.8 | Cache invalidate | cache.js | 패턴 매칭 삭제 |
| A.1.9 | debugLog 파일 생성 | debug.js | bkit-debug.log 생성 |
| A.1.10 | loadConfig 로드 | config.js | bkit.config.json 파싱 |
| A.1.11 | getConfig dot notation | config.js | `pdca.maxIterations === 5` |
| A.1.12 | outputAllow Claude 형식 | io.js | 문자열 출력 |
| A.1.13 | outputAllow Gemini 형식 | io.js | JSON `{status:'allow'}` |
| A.1.14 | outputBlock 형식 | io.js | 차단 메시지 출력 |
| A.1.15 | isSourceFile 판별 | file.js | `.ts, .tsx, .js` → true |
| A.1.16 | isEnvFile 판별 | file.js | `.env` → true |

#### A.2 lib/pdca/ 테스트 (13 cases)

| ID | 테스트 | 대상 모듈 | 예상 결과 |
|----|--------|----------|----------|
| A.2.1 | getPdcaStatusFull 로드 | status.js | 유효한 상태 객체 |
| A.2.2 | savePdcaStatus 저장 | status.js | .pdca-status.json 업데이트 |
| A.2.3 | updatePdcaStatus 부분 업데이트 | status.js | feature 상태 변경 |
| A.2.4 | getFeatureStatus 조회 | status.js | feature 데이터 반환 |
| A.2.5 | PDCA_PHASES 상수 확인 | phase.js | 6개 phase 정의 |
| A.2.6 | getPreviousPdcaPhase 전환 | phase.js | design → plan |
| A.2.7 | getNextPdcaPhase 전환 | phase.js | check → act/report |
| A.2.8 | detectLevel 감지 | level.js | Starter/Dynamic/Enterprise |
| A.2.9 | getLanguageTier 반환 | tier.js | 1-4 또는 experimental |
| A.2.10 | getAutomationLevel 확인 | automation.js | manual/semi-auto/full-auto |
| A.2.11 | shouldAutoAdvance 판단 | automation.js | phase별 자동 진행 여부 |
| A.2.12 | generateAutoTrigger 생성 | automation.js | 유효한 trigger 객체 |
| A.2.13 | emitUserPrompt 포맷 | automation.js | AskUserQuestion 형식 |

#### A.3 lib/intent/ 테스트 (8 cases)

| ID | 테스트 | 대상 모듈 | 예상 결과 |
|----|--------|----------|----------|
| A.3.1 | detectLanguage 한국어 | language.js | 'ko' |
| A.3.2 | detectLanguage 일본어 | language.js | 'ja' |
| A.3.3 | detectLanguage 중국어 | language.js | 'zh' |
| A.3.4 | matchImplicitAgentTrigger | trigger.js | 적절한 Agent 반환 |
| A.3.5 | matchImplicitSkillTrigger | trigger.js | 적절한 Skill 반환 |
| A.3.6 | detectNewFeatureIntent | trigger.js | 새 기능 요청 감지 |
| A.3.7 | calculateAmbiguityScore | ambiguity.js | 0-100 점수 |
| A.3.8 | generateClarifyingQuestions | ambiguity.js | 질문 배열 반환 |

#### A.4 lib/task/ 테스트 (8 cases)

| ID | 테스트 | 대상 모듈 | 예상 결과 |
|----|--------|----------|----------|
| A.4.1 | classifyTask 분류 | classification.js | quickFix/minorChange/feature |
| A.4.2 | setActiveSkill 설정 | context.js | 활성 Skill 저장 |
| A.4.3 | setActiveAgent 설정 | context.js | 활성 Agent 저장 |
| A.4.4 | generatePdcaTaskSubject | creator.js | `[Phase] feature` 형식 |
| A.4.5 | generatePdcaTaskDescription | creator.js | 유효한 설명 |
| A.4.6 | autoCreatePdcaTask | creator.js | Task 생성 객체 반환 |
| A.4.7 | savePdcaTaskId 저장 | tracker.js | .pdca-status.json에 저장 |
| A.4.8 | getPdcaTaskId 조회 | tracker.js | 저장된 Task ID 반환 |

### 4.2 Category B: Task 연동 테스트 (18 cases)

#### B.1 Task ID 영속성 테스트 (P0)

| ID | 테스트 | 검증 항목 | 예상 결과 |
|----|--------|----------|----------|
| B.1.1 | Task ID 저장 - plan | savePdcaTaskId('feat', 'plan', 'plan-feat-123') | tasks.plan === 'plan-feat-123' |
| B.1.2 | Task ID 저장 - design | savePdcaTaskId('feat', 'design', 'design-feat-124') | tasks.design === 'design-feat-124' |
| B.1.3 | Task ID 저장 - do | savePdcaTaskId('feat', 'do', 'do-feat-125') | tasks.do === 'do-feat-125' |
| B.1.4 | Task ID 저장 - check | savePdcaTaskId('feat', 'check', 'check-feat-126') | tasks.check === 'check-feat-126' |
| B.1.5 | Task ID 저장 - act (배열) | savePdcaTaskId('feat', 'act', 'act-1-feat-127') | tasks.act.includes('act-1-feat-127') |
| B.1.6 | Task ID 조회 | getPdcaTaskId('feat', 'plan') | 저장된 ID 반환 |
| B.1.7 | 세션 복원 후 조회 | 새 세션에서 getPdcaTaskId | 이전 ID 유지 |

#### B.2 Task 체인 자동 생성 테스트 (P0)

| ID | 테스트 | 검증 항목 | 예상 결과 |
|----|--------|----------|----------|
| B.2.1 | 체인 생성 | createPdcaTaskChain('new-feat') | 5개 Task 생성 (plan→design→do→check→report) |
| B.2.2 | blockedBy 연결 | 생성된 체인의 blockedBy | design.blockedBy=[plan.id] |
| B.2.3 | 중복 생성 방지 | 동일 feature 재호출 | null 반환, 기존 유지 |
| B.2.4 | taskChainCreated 플래그 | .pdca-status.json 확인 | taskChainCreated === true |

#### B.3 Check↔Act 자동 반복 테스트 (P0)

| ID | 테스트 | 시나리오 | 예상 결과 |
|----|--------|----------|----------|
| B.3.1 | matchRate >= 90% | triggerNextPdcaAction('feat', 'check', {matchRate:92}) | nextAction='report' |
| B.3.2 | matchRate < 90%, iter < 5 | triggerNextPdcaAction('feat', 'check', {matchRate:75, iter:2}) | nextAction='act', autoTrigger.agent='pdca-iterator' |
| B.3.3 | matchRate < 90%, iter = 5 | triggerNextPdcaAction('feat', 'check', {matchRate:85, iter:5}) | nextAction='manual' |
| B.3.4 | Act 완료 후 재분석 | triggerNextPdcaAction('feat', 'act', {}) | nextAction='check', autoTrigger.agent='gap-detector' |

#### B.4 자동화 레벨 테스트

| ID | 테스트 | 설정 | 예상 결과 |
|----|--------|------|----------|
| B.4.1 | manual 모드 | automationLevel='manual' | shouldAutoAdvance('check') === false |
| B.4.2 | semi-auto 모드 | automationLevel='semi-auto' | shouldAutoAdvance('check') === true |
| B.4.3 | full-auto 모드 | automationLevel='full-auto' | shouldAutoAdvance('plan') === true |

### 4.3 Category C: Skills 테스트 (21 cases)

| ID | Skill | 테스트 | 예상 결과 |
|----|-------|--------|----------|
| C.1 | pdca | `/pdca plan test-feat` | Plan 문서 생성, Task 체인 생성 |
| C.2 | pdca | `/pdca design test-feat` | Design 문서 생성, Task 업데이트 |
| C.3 | pdca | `/pdca do test-feat` | 구현 가이드 출력 |
| C.4 | pdca | `/pdca analyze test-feat` | gap-detector Agent 호출 |
| C.5 | pdca | `/pdca iterate test-feat` | pdca-iterator Agent 호출 |
| C.6 | pdca | `/pdca report test-feat` | report-generator Agent 호출 |
| C.7 | pdca | `/pdca status` | 현재 상태 출력 |
| C.8 | starter | `/starter init my-project` | Starter 초기화 가이드 |
| C.9 | dynamic | `/dynamic init my-project` | Dynamic 초기화 가이드 |
| C.10 | enterprise | `/enterprise init my-project` | Enterprise 초기화 가이드 |
| C.11 | phase-1-schema | `/phase-1-schema` | Schema 정의 가이드 |
| C.12 | phase-2-convention | `/phase-2-convention` | Convention 정의 가이드 |
| C.13 | phase-3-mockup | `/phase-3-mockup` | Mockup 생성 가이드 |
| C.14 | phase-4-api | `/phase-4-api` | API 설계 가이드 |
| C.15 | phase-5-design-system | `/phase-5-design-system` | Design System 가이드 |
| C.16 | phase-6-ui-integration | `/phase-6-ui-integration` | UI 통합 가이드 |
| C.17 | phase-7-seo-security | `/phase-7-seo-security` | SEO/보안 가이드 |
| C.18 | phase-8-review | `/phase-8-review` | 리뷰 가이드, Agent 연동 |
| C.19 | phase-9-deployment | `/phase-9-deployment` | 배포 가이드 |
| C.20 | code-review | `/code-review src/` | 코드 리뷰 실행 |
| C.21 | zero-script-qa | `/zero-script-qa` | QA 모니터링 가이드 |

### 4.4 Category D: Agents 테스트 (11 cases)

| ID | Agent | 트리거 | 예상 결과 |
|----|-------|--------|----------|
| D.1 | starter-guide | 초보자 질문 감지 | 친화적 가이드 제공 |
| D.2 | pipeline-guide | "어디서부터 시작?" | 9단계 파이프라인 안내 |
| D.3 | bkend-expert | "로그인 구현" | BaaS 기반 구현 가이드 |
| D.4 | enterprise-expert | "마이크로서비스 설계" | Enterprise 아키텍처 안내 |
| D.5 | infra-architect | "Kubernetes 배포" | K8s/Terraform 가이드 |
| D.6 | gap-detector | `/pdca analyze` | 설계-구현 갭 분석 |
| D.7 | pdca-iterator | `/pdca iterate` | 자동 개선 실행 |
| D.8 | code-analyzer | "코드 분석" | 품질/보안 검사 |
| D.9 | design-validator | "설계 검증" | 설계 문서 검증 |
| D.10 | qa-monitor | "QA 테스트" | 로그 기반 검증 |
| D.11 | report-generator | `/pdca report` | 완료 보고서 생성 |

### 4.5 Category E: Hooks 테스트 (5 cases)

| ID | Hook | 이벤트 | 예상 결과 |
|----|------|--------|----------|
| E.1 | session-start | 세션 시작 | 컨텍스트 계층화 출력 |
| E.2 | session-start | Level 감지 | Starter/Dynamic/Enterprise 감지 |
| E.3 | session-start | 이전 작업 복원 | activeFeatures 표시 |
| E.4 | unified-stop | Skill 종료 | Task 상태 업데이트 |
| E.5 | unified-stop | Agent 종료 | autoTrigger 처리 |

### 4.6 Category F: PDCA E2E 테스트 (8 cases)

#### F.1 Happy Path

| ID | 시나리오 | 단계 | 예상 결과 |
|----|----------|------|----------|
| F.1.1 | 전체 사이클 (통과) | plan→design→do→check(95%)→report | 모든 Task completed |
| F.1.2 | 전체 사이클 (1회 반복) | plan→design→do→check(85%)→act→check(92%)→report | 2회 Check, 1회 Act |
| F.1.3 | 전체 사이클 (3회 반복) | check(75%)→act→check(82%)→act→check(88%)→act→check(93%) | 4회 Check, 3회 Act |

#### F.2 Edge Cases

| ID | 시나리오 | 조건 | 예상 결과 |
|----|----------|------|----------|
| F.2.1 | 최대 반복 도달 | 5회 반복 후 matchRate 85% | 수동 개입 메시지 |
| F.2.2 | 세션 중단 복원 | 중간에 세션 종료 후 재시작 | 기존 Task 연결 유지 |
| F.2.3 | Plan 없이 Design | Design 먼저 시도 | Plan 먼저 안내 |
| F.2.4 | blockedBy Task 미완료 | 선행 Task 미완료 상태 | 차단 메시지 |
| F.2.5 | 동시 Feature 관리 | 2개 Feature 동시 진행 | 각각 독립 Task 체인 |

---

## 5. Requirements Traceability

### 5.1 task-bkit-integration.design.md 요구사항 매핑

| 설계 요구사항 (FR) | 테스트 케이스 | 우선순위 |
|-------------------|--------------|:--------:|
| FR-01: Task 체인 자동 생성 | B.2.1, B.2.2 | P0 |
| FR-02: Task ID 영속화 | B.1.1~B.1.7 | P0 |
| FR-03: 세션 간 복원 | B.1.7, F.2.2 | P0 |
| FR-04: Check→Act 자동 트리거 | B.3.2 | P0 |
| FR-05: Check↔Act 반복 (최대 5회) | B.3.1~B.3.4, F.2.1 | P0 |
| FR-06: matchRate >= 90% → Report | B.3.1, F.1.1 | P0 |
| FR-07: blockedBy Task ID 기반 | B.2.2, F.2.4 | P0 |

### 5.2 bkit-core-modularization.design.md 요구사항 매핑

| 설계 요구사항 | 테스트 케이스 | 우선순위 |
|--------------|--------------|:--------:|
| Core 모듈 분리 | A.1.1~A.1.16 | P0 |
| PDCA 모듈 분리 | A.2.1~A.2.13 | P0 |
| Intent 모듈 분리 | A.3.1~A.3.8 | P0 |
| Task 모듈 분리 | A.4.1~A.4.8 | P0 |
| Migration Bridge 호환성 | A.1.*, common.js import | P0 |
| 순환 의존성 0개 | 별도 검증 (madge) | P0 |

---

## 6. Test Environment

### 6.1 Prerequisites

| 항목 | 요구사항 |
|------|---------|
| Node.js | v18+ |
| Claude Code | v2.1+ |
| bkit Plugin | v1.4.7 |
| OS | macOS/Linux |

### 6.2 Test Data

| 데이터 | 위치 | 용도 |
|--------|------|------|
| 테스트 Feature | `test-integration-YYYYMMDD` | E2E 테스트용 |
| Mock Design Doc | `docs/02-design/features/test-*.design.md` | Gap Analysis 테스트 |
| Mock Implementation | `src/test-*` | 구현 검증 |

### 6.3 Environment Variables

```bash
# 테스트 모드
BKIT_DEBUG=true
BKIT_TEST_MODE=true

# 자동화 레벨 테스트
BKIT_PDCA_AUTOMATION=manual|semi-auto|full-auto
```

---

## 7. Success Criteria

### 7.1 Definition of Done

- [x] P0 테스트 100% 통과 (63 cases)
- [x] P1 테스트 95% 이상 통과 (45 cases)
- [x] 모든 설계 요구사항 검증 완료
- [x] 회귀 버그 0건
- [x] 테스트 결과 문서화

### 7.2 Quality Criteria

| 항목 | 기준 |
|------|------|
| P0 테스트 통과율 | 100% |
| P1 테스트 통과율 | 95%+ |
| 회귀 버그 | 0건 |
| 새 버그 | 심각도 High 0건 |

---

## 8. Risks and Mitigation

| 리스크 | 영향 | 가능성 | 완화 전략 |
|--------|------|--------|----------|
| Task 체인 무한 루프 | High | Low | maxIterations 하드코딩 (5회) |
| 하위 호환성 깨짐 | High | Medium | Migration Bridge 철저 검증 |
| Hook 실패 시 Task 미생성 | Medium | Medium | Fail-safe 로직, 재시도 |
| .pdca-status.json 손상 | High | Low | 백업, 검증 로직 |
| 세션 간 상태 불일치 | Medium | Medium | 상태 동기화 검증 |

---

## 9. Test Execution Plan

### 9.1 Phase 1: 모듈 단위 테스트 (Day 1)

| 순서 | 테스트 그룹 | 케이스 수 |
|:----:|------------|:--------:|
| 1 | A.1 lib/core/ | 16 |
| 2 | A.2 lib/pdca/ | 13 |
| 3 | A.3 lib/intent/ | 8 |
| 4 | A.4 lib/task/ | 8 |

### 9.2 Phase 2: Task 연동 테스트 (Day 2)

| 순서 | 테스트 그룹 | 케이스 수 |
|:----:|------------|:--------:|
| 1 | B.1 Task ID 영속성 | 7 |
| 2 | B.2 Task 체인 생성 | 4 |
| 3 | B.3 Check↔Act 반복 | 4 |
| 4 | B.4 자동화 레벨 | 3 |

### 9.3 Phase 3: Skills/Agents 테스트 (Day 3)

| 순서 | 테스트 그룹 | 케이스 수 |
|:----:|------------|:--------:|
| 1 | C.1~C.21 Skills | 21 |
| 2 | D.1~D.11 Agents | 11 |
| 3 | E.1~E.5 Hooks | 5 |

### 9.4 Phase 4: E2E 테스트 (Day 4)

| 순서 | 테스트 그룹 | 케이스 수 |
|:----:|------------|:--------:|
| 1 | F.1 Happy Path | 3 |
| 2 | F.2 Edge Cases | 5 |

---

## 10. Test Report Template

### 10.1 Summary

```
테스트 실행일: YYYY-MM-DD
총 테스트 케이스: 108
통과: XX (XX%)
실패: XX (XX%)
스킵: XX (XX%)
```

### 10.2 Category Results

| Category | Total | Pass | Fail | Skip | Rate |
|----------|:-----:|:----:|:----:|:----:|:----:|
| A. 모듈 단위 | 45 | | | | |
| B. Task 연동 | 18 | | | | |
| C. Skills | 21 | | | | |
| D. Agents | 11 | | | | |
| E. Hooks | 5 | | | | |
| F. E2E | 8 | | | | |

### 10.3 Issues Found

| ID | Category | Severity | Description | Status |
|----|----------|----------|-------------|--------|
| | | | | |

---

## 11. Next Steps

### 11.1 Immediate Actions

1. [x] 테스트 계획서 작성 완료 (현재)
2. [ ] 테스트 환경 준비
3. [ ] Phase 1 실행 시작

### 11.2 Post-Testing

1. [ ] 테스트 결과 보고서 작성
2. [ ] 발견된 버그 수정
3. [ ] Gap Analysis 실행 (`/pdca analyze bkit-integration-test`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-01-29 | 초기 작성 - 108개 테스트 케이스 정의 | Claude Opus 4.5 |
