# Task Management System + bkit PDCA 연동 강화 계획서

> **Summary**: bkit PDCA 워크플로우와 Claude Code Task Management System의 긴밀한 연동을 통해 Plan→Design→Do→Check↔Act 자동화 사이클 완성
>
> **Project**: bkit-claude-code
> **Version**: 1.4.7
> **Author**: Claude Opus 4.5
> **Date**: 2026-01-29
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

bkit v1.4.6의 PDCA 워크플로우와 Claude Code Task Management System 간의 **완전한 통합**을 구현하여:

1. **자동 Task 체인 생성**: PDCA 시작 시 Plan→Design→Do→Check→Act 전체 Task 체인 자동 생성
2. **Task 영속성 확보**: 세션 간 Task 연결 유지 (.pdca-status.json에 Task ID 저장)
3. **Check↔Act 자동 반복**: matchRate < 90% 시 자동 개선 사이클 (최대 5회)
4. **전체 기능 Task 통합**: Skills, Agents 모든 기능에서 체계적 Task 생성

### 1.2 Background

**분석 결과서 핵심 발견사항** (`docs/03-analysis/task-management-bkit-integration.analysis.md`):

| 현재 한계점 | 영향 | 심각도 |
|------------|------|--------|
| Task ID 영속성 부재 | 세션 재시작 시 Task 연결 끊김 | **High** |
| 간접적 Task 생성 | Hook → systemMessage → Claude 해석 필요 | Medium |
| PDCA ↔ Task 동기화 불완전 | .bkit-memory.json에 Task ID 미저장 | Medium |
| Skills Task tools 제한 | pdca skill만 직접 Task 생성 가능 | Low |
| blockedBy 문자열 기반 | Task ID 대신 subject 문자열 사용 | Medium |

### 1.3 Related Documents

- **분석 보고서**: `docs/03-analysis/task-management-bkit-integration.analysis.md`
- **아키텍처**: `docs/archive/legacy/02-BKIT-PLUGIN-DESIGN.md`
- **현재 구현**: `lib/common.js`, `scripts/gap-detector-stop.js`

---

## 2. Scope

### 2.1 In Scope

- [x] **P0**: Task ID 영속화 - .pdca-status.json에 Task ID 저장/복원
- [x] **P0**: PDCA 시작 시 전체 Task 체인 자동 생성
- [x] **P0**: Check↔Act 자동 반복 사이클 구현 (최대 5회)
- [x] **P1**: Phase Skills (1-9) Task 자동 생성 확장
- [x] **P1**: Analysis Agents Task 확장 (code-analyzer, design-validator, qa-monitor)
- [x] **P1**: blockedBy Task ID 기반 변경
- [x] **P2**: Expert Agents Task 확장 (bkend-expert, enterprise-expert, infra-architect)
- [x] **P2**: Task 상태 ↔ PDCA phase 실시간 동기화
- [x] **P3**: Task Dashboard 스킬 구현

### 2.2 Out of Scope

- Gemini CLI Task 대체 시스템 (별도 Feature로 분리)
- Task 시각화 UI (별도 Feature로 분리)
- 외부 프로젝트 관리 도구 연동 (Jira, Linear 등)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| **FR-01** | `/pdca plan {feature}` 실행 시 전체 PDCA Task 체인 자동 생성 | High | Pending |
| **FR-02** | Task ID를 .pdca-status.json features.{feature}.tasks에 저장 | High | Pending |
| **FR-03** | 세션 재시작 시 기존 Task ID 복원 및 연결 | High | Pending |
| **FR-04** | Check phase matchRate < 90% 시 자동으로 Act Task 생성 | High | Pending |
| **FR-05** | Act 완료 후 자동으로 Check 재실행 (최대 5회 반복) | High | Pending |
| **FR-06** | matchRate >= 90% 도달 시 Report Task 자동 생성 및 체인 완료 | High | Pending |
| **FR-07** | blockedBy를 Task ID 기반으로 변경 (subject 문자열 대신) | Medium | Pending |
| **FR-08** | Phase 1-9 Skills 완료 시 다음 Phase Task 자동 생성 | Medium | Pending |
| **FR-09** | Analysis Agents (gap-detector, code-analyzer, design-validator) Task 연동 | Medium | Pending |
| **FR-10** | Expert Agents (bkend, enterprise, infra) 작업 시 Task 생성 | Medium | Pending |
| **FR-11** | Task 상태 변경 시 .pdca-status.json 자동 업데이트 | Medium | Pending |
| **FR-12** | `/pdca status`에서 Task 체인 시각화 출력 | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | Task 생성/업데이트 < 100ms | Hook 실행 시간 측정 |
| Reliability | 세션 간 Task 연결 100% 유지 | 세션 복원 테스트 |
| Consistency | PDCA phase ↔ Task status 불일치 0건 | 상태 검증 로직 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [x] 모든 FR 구현 완료
- [x] Task 체인 생성 → Check↔Act 반복 → Report 생성 E2E 테스트 통과
- [x] 세션 재시작 후 Task 연결 유지 테스트 통과
- [x] 코드 리뷰 완료
- [x] 문서 업데이트 (SKILL.md, Agent descriptions)

### 4.2 Quality Criteria

- [x] Hook scripts 에러 핸들링 100%
- [x] Task ID 형식 일관성 검증
- [x] 분석 Match Rate >= 90%

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Task ID 충돌 | High | Low | UUID 기반 ID 생성, prefix로 phase 구분 |
| 무한 반복 루프 | High | Medium | 최대 반복 횟수 (5회) 하드코딩 |
| Hook 실패 시 Task 미생성 | Medium | Medium | 실패 시 재시도 로직, 사용자 알림 |
| 대용량 Task 체인 성능 저하 | Medium | Low | 점진적 생성, 필요 시에만 조회 |
| .pdca-status.json 파일 손상 | High | Low | 백업 메커니즘, 검증 로직 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | ☐ |
| **Dynamic** | Feature-based modules | Web apps with backend | ☒ |
| **Enterprise** | Strict layer separation | Complex architectures | ☐ |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Task ID 생성 | UUID / timestamp / sequential | `{phase}-{feature}-{timestamp}` | 가독성 + 유일성 |
| Task 저장 위치 | .bkit-memory / .pdca-status / 별도 파일 | `.pdca-status.json` | PDCA 상태와 통합 관리 |
| blockedBy 방식 | subject 문자열 / Task ID / 없음 | Task ID 참조 | 정확한 의존성 추적 |
| 반복 제어 | config 기반 / 하드코딩 | config (`bkit.config.json`) | 유연성 확보 |

### 6.3 Task 체인 아키텍처

```
PDCA Task Chain Architecture:
┌─────────────────────────────────────────────────────────────────────┐
│                    PDCA Feature Task Chain                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  /pdca plan {feature}                                               │
│       │                                                              │
│       ▼                                                              │
│  ┌────────────────┐                                                 │
│  │ Task: [Plan]   │ ID: plan-{feature}-{ts}                        │
│  │ status: pending│                                                 │
│  └───────┬────────┘                                                 │
│          │ blockedBy: null                                          │
│          ▼                                                          │
│  ┌────────────────┐                                                 │
│  │ Task: [Design] │ ID: design-{feature}-{ts}                      │
│  │ status: pending│ blockedBy: [plan-{feature}-{ts}]               │
│  └───────┬────────┘                                                 │
│          │                                                          │
│          ▼                                                          │
│  ┌────────────────┐                                                 │
│  │ Task: [Do]     │ ID: do-{feature}-{ts}                          │
│  │ status: pending│ blockedBy: [design-{feature}-{ts}]             │
│  └───────┬────────┘                                                 │
│          │                                                          │
│          ▼                                                          │
│  ┌────────────────┐                                                 │
│  │ Task: [Check]  │ ID: check-{feature}-{ts}                       │
│  │ status: pending│ blockedBy: [do-{feature}-{ts}]                 │
│  └───────┬────────┘                                                 │
│          │                                                          │
│    ┌─────┴─────┐                                                    │
│    │ matchRate │                                                    │
│    └─────┬─────┘                                                    │
│          │                                                          │
│    < 90% │ >= 90%                                                   │
│          │                                                          │
│   ┌──────┴──────────────────────────────────────────────────┐      │
│   │                                                          │      │
│   ▼                                                          ▼      │
│ ┌────────────────┐                               ┌────────────────┐│
│ │ Task: [Act-1]  │ (최대 5회 반복)               │ Task: [Report] ││
│ │ status: pending│                               │ status: pending││
│ └───────┬────────┘                               └────────────────┘│
│         │                                                          │
│         └──────────────────┐                                       │
│                            │                                        │
│                   ┌────────┴────────┐                              │
│                   │ 자동 재실행      │                              │
│                   │ gap-detector    │                              │
│                   └─────────────────┘                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Implementation Strategy

### 7.1 Phase 1: Task ID 영속화 (P0)

**목표**: Task ID를 .pdca-status.json에 저장하여 세션 간 연속성 확보

#### 7.1.1 .pdca-status.json 스키마 확장

```json
{
  "features": {
    "{feature}": {
      "phase": "check",
      "phaseNumber": 4,
      "matchRate": 85,
      "iterationCount": 1,
      "tasks": {
        "plan": "plan-auth-1706500000000",
        "design": "design-auth-1706500001000",
        "do": "do-auth-1706500002000",
        "check": "check-auth-1706500003000",
        "act": ["act-auth-1-1706500004000"],
        "report": null
      },
      "currentTaskId": "check-auth-1706500003000",
      "timestamps": {...}
    }
  }
}
```

#### 7.1.2 수정 대상 파일

| 파일 | 수정 내용 |
|------|----------|
| `lib/common.js` | `savePdcaTaskId()`, `getPdcaTaskId()` 함수 추가 |
| `lib/common.js` | `autoCreatePdcaTask()` 수정 - Task ID 저장 로직 추가 |
| `scripts/gap-detector-stop.js` | Check Task ID 저장 |
| `scripts/iterator-stop.js` | Act Task ID 저장 |
| `scripts/pdca-skill-stop.js` | Phase 전환 시 Task ID 업데이트 |

### 7.2 Phase 2: Task 체인 자동 생성 (P0)

**목표**: PDCA 시작 시 전체 Task 체인 사전 생성

#### 7.2.1 구현 전략

```javascript
// lib/common.js
function createPdcaTaskChain(feature, options = {}) {
  const timestamp = Date.now();
  const chain = [
    { phase: 'plan', id: `plan-${feature}-${timestamp}`, blockedBy: null },
    { phase: 'design', id: `design-${feature}-${timestamp+1}`, blockedBy: 'plan' },
    { phase: 'do', id: `do-${feature}-${timestamp+2}`, blockedBy: 'design' },
    { phase: 'check', id: `check-${feature}-${timestamp+3}`, blockedBy: 'do' },
    { phase: 'report', id: `report-${feature}-${timestamp+4}`, blockedBy: 'check' }
  ];

  // Act Tasks는 Check 결과에 따라 동적 생성
  return chain;
}
```

#### 7.2.2 Task 가이던스 출력 형식

```
📋 PDCA Task Chain Created for "user-auth"
─────────────────────────────────────────────────────
Task #1: [Plan] user-auth
  ID: plan-user-auth-1706500000000
  Status: in_progress

Task #2: [Design] user-auth (blocked by #1)
  ID: design-user-auth-1706500001000
  Status: pending

Task #3: [Do] user-auth (blocked by #2)
  ID: do-user-auth-1706500002000
  Status: pending

Task #4: [Check] user-auth (blocked by #3)
  ID: check-user-auth-1706500003000
  Status: pending

Task #5: [Report] user-auth (blocked by #4)
  ID: report-user-auth-1706500004000
  Status: pending
─────────────────────────────────────────────────────
```

### 7.3 Phase 3: Check↔Act 자동 반복 (P0)

**목표**: matchRate < 90% 시 자동 개선 사이클

#### 7.3.1 반복 로직 흐름

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Check↔Act Iteration Cycle                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  gap-detector 완료                                                  │
│       │                                                              │
│       ▼                                                              │
│  ┌─────────────────┐                                                │
│  │ matchRate 확인  │                                                │
│  └────────┬────────┘                                                │
│           │                                                          │
│     ┌─────┴─────┐                                                   │
│     │           │                                                    │
│  >= 90%      < 90%                                                  │
│     │           │                                                    │
│     ▼           ▼                                                    │
│  ┌──────────┐  ┌──────────────────────────────────────────────┐    │
│  │ [Report] │  │ iterationCount < maxIterations (5)?          │    │
│  │  생성    │  └────────────────────┬─────────────────────────┘    │
│  └──────────┘                       │                               │
│                               Yes   │   No                          │
│                                ┌────┴────┐                          │
│                                ▼         ▼                          │
│                         ┌──────────┐  ┌──────────────────┐         │
│                         │ [Act-N]  │  │ 반복 한도 도달   │         │
│                         │  생성    │  │ 사용자 개입 요청 │         │
│                         └────┬─────┘  └──────────────────┘         │
│                              │                                      │
│                              ▼                                      │
│                         ┌──────────────────┐                       │
│                         │ pdca-iterator    │                       │
│                         │ 자동 개선 실행   │                       │
│                         └────────┬─────────┘                       │
│                                  │                                  │
│                                  ▼                                  │
│                         ┌──────────────────┐                       │
│                         │ gap-detector     │                       │
│                         │ 자동 재실행      │                       │
│                         └──────────────────┘                       │
│                                  │                                  │
│                                  └─────────── (반복) ───────────────│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### 7.3.2 수정 대상 파일

| 파일 | 수정 내용 |
|------|----------|
| `scripts/gap-detector-stop.js` | 자동 Act 트리거 로직 강화 |
| `scripts/iterator-stop.js` | 자동 Check 재실행 로직 |
| `lib/common.js` | `triggerNextPdcaAction()` 함수 추가 |

### 7.4 Phase 4: Skills/Agents Task 확장 (P1-P2)

**목표**: 모든 bkit 기능에서 체계적 Task 생성

#### 7.4.1 Phase Skills Task 확장

| Skill | Task 생성 조건 | Task 명명 | blockedBy |
|-------|---------------|-----------|-----------|
| phase-1-schema | 실행 시 | `[Phase-1] {feature}` | Init Task |
| phase-2-convention | phase-1 완료 후 | `[Phase-2] {feature}` | Phase-1 |
| phase-3-mockup | phase-2 완료 후 | `[Phase-3] {feature}` | Phase-2 |
| phase-4-api | phase-3 완료 후 | `[Phase-4] {feature}` | Phase-3 |
| phase-5-design-system | phase-4 완료 후 | `[Phase-5] {feature}` | Phase-4 |
| phase-6-ui-integration | phase-5 완료 후 | `[Phase-6] {feature}` | Phase-5 |
| phase-7-seo-security | phase-6 완료 후 | `[Phase-7] {feature}` | Phase-6 |
| phase-8-review | phase-7 완료 후 | `[Phase-8] {feature}` | Phase-7 |
| phase-9-deployment | phase-8 완료 후 | `[Phase-9] {feature}` | Phase-8 |

#### 7.4.2 Analysis Agents Task 확장

| Agent | Task 생성 조건 | Task 명명 | 연결 |
|-------|---------------|-----------|------|
| gap-detector | 분석 시작 시 | `[Check] {feature}` | Do Task |
| code-analyzer | 분석 요청 시 | `[Analyze] {target}` | 독립 |
| design-validator | 검증 요청 시 | `[Validate-Design] {feature}` | Design Task |
| qa-monitor | QA 시작 시 | `[QA-Monitor] {feature}` | Do Task |

#### 7.4.3 Expert Agents Task 확장

| Agent | Task 생성 조건 | Task 명명 | 연결 |
|-------|---------------|-----------|------|
| bkend-expert | BaaS 구현 시 | `[BaaS] {feature}` | 독립 |
| enterprise-expert | 설계 시 | `[Enterprise] {feature}` | 독립 |
| infra-architect | 인프라 설계 시 | `[Infra] {feature}` | 독립 |

### 7.5 Phase 5: Task 상태 동기화 (P2)

**목표**: PDCA phase와 Task status 실시간 동기화

#### 7.5.1 동기화 매트릭스

| PDCA Phase | Task Status | 트리거 |
|------------|-------------|--------|
| plan 시작 | in_progress | skill 실행 |
| plan 완료 | completed | 문서 생성 완료 |
| design 시작 | in_progress | skill 실행 |
| design 완료 | completed | 문서 생성 완료 |
| do 시작 | in_progress | 구현 시작 |
| do 완료 | completed | 구현 완료 선언 |
| check 시작 | in_progress | gap-detector 실행 |
| check 완료 | completed | matchRate >= 90% |
| act 시작 | in_progress | pdca-iterator 실행 |
| act 완료 | completed | 개선 완료 |
| report 생성 | completed | 보고서 완료 |

---

## 8. Implementation Checklist

### 8.1 lib/common.js 수정 (P0)

```javascript
// 추가할 함수들
- [ ] savePdcaTaskId(feature, phase, taskId)
- [ ] getPdcaTaskId(feature, phase)
- [ ] createPdcaTaskChain(feature, options)
- [ ] updatePdcaTaskChainStatus(feature, phase, status)
- [ ] getPreviousPdcaTaskId(feature, currentPhase)
- [ ] triggerNextPdcaAction(feature, currentPhase, matchRate)
```

### 8.2 scripts 수정 (P0)

```javascript
// gap-detector-stop.js
- [ ] Check Task ID 저장 로직 추가
- [ ] matchRate < 90% 시 Act Task 자동 생성
- [ ] 자동 iterator 트리거 로직

// iterator-stop.js
- [ ] Act Task ID 저장 (iteration 번호 포함)
- [ ] 개선 후 자동 gap-detector 재실행
- [ ] 반복 횟수 제한 검증

// pdca-skill-stop.js
- [ ] Task 체인 생성 로직 통합
- [ ] Phase 전환 시 Task status 업데이트
```

### 8.3 Phase Skills Stop Hooks 추가 (P1)

```
- [ ] scripts/phase-1-stop.js
- [ ] scripts/phase-2-stop.js
- [ ] scripts/phase-3-stop.js
- [ ] scripts/phase-4-stop.js (기존 확장)
- [ ] scripts/phase-5-stop.js (기존 확장)
- [ ] scripts/phase-6-stop.js (기존 확장)
- [ ] scripts/phase-7-stop.js
- [ ] scripts/phase-8-stop.js
- [ ] scripts/phase-9-stop.js (기존 확장)
```

### 8.4 Agents Stop Hooks 확장 (P1-P2)

```
- [ ] scripts/code-analyzer-stop.js (신규)
- [ ] scripts/design-validator-stop.js (신규)
- [ ] scripts/qa-monitor-stop.js (신규)
- [ ] scripts/expert-agent-stop.js (신규, 공통)
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

| 테스트 | 대상 | 검증 항목 |
|--------|------|----------|
| Task ID 생성 | `createPdcaTaskChain()` | ID 형식, 유일성 |
| Task ID 저장 | `savePdcaTaskId()` | .pdca-status.json 업데이트 |
| Task ID 복원 | `getPdcaTaskId()` | 세션 재시작 후 조회 |
| blockedBy 설정 | Task 체인 | 올바른 의존성 연결 |

### 9.2 Integration Tests

| 시나리오 | 단계 | 예상 결과 |
|----------|------|----------|
| 전체 PDCA 사이클 | plan→design→do→check→report | 모든 Task 완료 |
| Check↔Act 반복 | matchRate 80%→85%→92% | 3회 반복 후 Report |
| 반복 한도 | 5회 반복 후 미달성 | 사용자 알림 |
| 세션 복원 | 세션 재시작 | 기존 Task 연결 |

### 9.3 E2E Test Scenarios

```
Scenario 1: Happy Path
1. /pdca plan user-auth
2. Task 체인 5개 생성 확인
3. /pdca design user-auth
4. [Plan] Task 완료, [Design] Task in_progress
5. ... (Do, Check, Report)
6. 최종: 모든 Task completed

Scenario 2: Iteration Path
1. /pdca analyze user-auth (matchRate: 75%)
2. [Act-1] Task 자동 생성
3. pdca-iterator 자동 실행
4. gap-detector 자동 재실행 (matchRate: 88%)
5. [Act-2] Task 자동 생성
6. ... (반복)
7. matchRate >= 90% 도달
8. [Report] Task 자동 생성
```

---

## 10. Convention Prerequisites

### 10.1 Existing Project Conventions

- [x] `CLAUDE.md` has coding conventions section
- [x] ESLint configuration (`.eslintrc.*`)
- [x] Node.js scripting patterns (`scripts/`)

### 10.2 Task ID Convention

```
Format: {phase}-{feature}-{timestamp}

Examples:
- plan-user-auth-1706500000000
- design-user-auth-1706500001000
- act-1-user-auth-1706500004000  (iteration 포함)
- act-2-user-auth-1706500005000
```

### 10.3 Task Status Convention

```
Allowed Status Values:
- pending: Task 생성됨, 아직 시작 안 함
- in_progress: Task 진행 중
- completed: Task 완료
- blocked: blockedBy Task 미완료
- failed: Task 실패 (재시도 필요)
```

---

## 11. Next Steps

### 11.1 Immediate Actions

1. [x] 계획서 작성 완료 (현재)
2. [ ] 설계 문서 작성 (`/pdca design task-bkit-integration`)
3. [ ] 팀 리뷰 및 승인

### 11.2 Implementation Order

| 순서 | 작업 | 예상 파일 수 | 우선순위 |
|------|------|-------------|----------|
| 1 | Task ID 영속화 | 4개 | P0 |
| 2 | Task 체인 생성 | 2개 | P0 |
| 3 | Check↔Act 반복 | 3개 | P0 |
| 4 | Phase Skills 확장 | 9개 | P1 |
| 5 | Agents 확장 | 5개 | P1-P2 |
| 6 | 동기화 강화 | 2개 | P2 |
| 7 | Task Dashboard | 1개 | P3 |

---

## 12. Appendix

### 12.1 분석 결과서 주요 발견 요약

```
lib/common.js Task 함수 (7개):
├── generatePdcaTaskSubject()       (line 843-847)
├── generatePdcaTaskDescription()   (line 856-866)
├── generateTaskGuidance()          (line 875-892)
├── getPreviousPdcaPhase()          (line 899-908)
├── getPdcaTaskMetadata()           (implied)
├── autoCreatePdcaTask()            (line 1122-1205) ★ 핵심
└── updatePdcaTaskStatus()          (v1.4.4)

Task 사용 스크립트 (3개):
├── gap-detector-stop.js    (Check/Act/Report Task)
├── iterator-stop.js        (Act-N Task)
└── pdca-skill-stop.js      (Phase 전환 Task)

task-template 적용 Skills (15개):
├── pdca, starter, dynamic, enterprise
├── phase-1 ~ phase-9
└── code-review, claude-code-learning
```

### 12.2 참고 자료

- Claude Code Task Management System Documentation
- bkit v1.4.6 Release Notes
- PDCA Methodology Best Practices

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-01-29 | 초기 작성 - 분석 결과 기반 상세 계획 | Claude Opus 4.5 |
