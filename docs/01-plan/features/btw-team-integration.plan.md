# btw-team-integration Planning Document

> **Summary**: CTO Team 오케스트레이션의 Phase 전환 시점에 `/btw analyze` 자동 실행을 연결하여, 팀 작업 중 축적된 개선 제안을 다음 Phase에 반영
>
> **Project**: bkit (Vibecoding Kit)
> **Version**: 1.7.0
> **Author**: bkit PDCA
> **Date**: 2026-03-21
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | CTO Team 수행 중 발견되는 개선 아이디어가 세션 종료 시 80% 이상 유실됨. `/btw`와 팀 오케스트레이션이 완전히 분리되어 피드백 루프가 끊어져 있음 |
| **Solution** | Phase 전환 시점(Design→Do, Do→Check 등)에 `btw analyze` 자동 실행 훅을 추가. 사용자는 수동 `/btw`로 기록, CTO는 전환 시 축적된 제안을 자동 분석하여 다음 Phase에 반영 |
| **Function/UX Effect** | 팀 작업 중 `/btw 이거 개선하면 좋겠다` 한 줄이면 기록 완료. Phase 전환 시 자동으로 "지금까지 N개 제안 축적, 스킬 후보 M개 발견" 요약 출력 |
| **Core Value** | PDCA Act 개선 범위 +30~50%, 아이디어 유실률 80%→20%, 턴 비용 Phase당 +1~2턴만 |

---

## 1. Overview

### 1.1 Purpose

현재 `/btw`는 사용자가 수동으로 실행하는 독립 스킬이고, CTO Team 오케스트레이션과 아무 연결이 없다. 팀 세션(Dynamic 3명, Enterprise 6명)에서 각 Phase 작업 중 발견되는 개선점/버그/패턴이 기록되지 않고 사라진다.

Phase 전환은 CTO Lead가 관리하는 구조적 전환점으로, 이 시점에 `btw analyze`를 자동 실행하면:
1. 축적된 제안을 잃지 않고
2. 다음 Phase의 작업 방향에 반영하며
3. 최소한의 턴 비용(+1~2)으로 피드백 루프를 닫을 수 있다

### 1.2 Background

| 항목 | 내용 |
|------|------|
| `/btw` 현재 상태 | 독립 workflow 스킬, `.bkit/btw-suggestions.json`에 저장, 5개 명령(record/list/analyze/promote/stats) |
| CTO Team 현재 상태 | 5개 오케스트레이션 패턴(leader/council/swarm/pipeline/watchdog), Phase 전환 시 Quality Gate 검증 |
| 연결점 | 없음 — 완전 분리 |
| B안 선택 근거 | "사용자 수동 btw + Phase 전환 시 auto-analyze"가 턴 효율 최적 (가중 점수 +5.1/10) |

### 1.3 Related Documents

- btw SKILL.md: `skills/btw/SKILL.md`
- CTO Lead Agent: `agents/cto-lead.md`
- Team Orchestrator: `lib/team/orchestrator.js`
- Team Coordinator: `lib/team/coordinator.js`

---

## 2. Scope

### 2.1 In Scope

- [ ] FR-01: CTO Lead의 Phase 전환 프롬프트에 btw analyze 호출 지시 추가
- [ ] FR-02: btw SKILL.md에 `team-context` 필드 추가 (현재 Phase, 팀 구성 기록)
- [ ] FR-03: CTO Lead의 Phase 전환 시 btw 요약 출력 포맷 정의
- [ ] FR-04: 세션 종료 시(cto-stop.js 훅) btw stats 자동 출력

### 2.2 Out of Scope

- 서브에이전트가 자동으로 btw 기록 (턴 소모 과다 — R1)
- btw-suggestions.json 동시 쓰기 잠금 (병렬 swarm 충돌 — R5, 현재 규모에서 미발생)
- btw analyze 결과의 자동 promote (사용자 결정 영역)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status | 대상 파일 |
|----|-------------|----------|--------|-----------|
| FR-01 | cto-lead.md Phase 전환 섹션에 "btw analyze 실행 후 요약 제시" 지시 추가 | High | Pending | `agents/cto-lead.md` |
| FR-02 | btw suggestion entry에 `teamContext` 필드 추가 (phase, role, pattern) | Medium | Pending | `skills/btw/SKILL.md` |
| FR-03 | CTO Lead Phase 전환 시 btw 요약 출력 포맷 | High | Pending | `agents/cto-lead.md` |
| FR-04 | cto-stop.js 훅에서 btw stats 출력 로직 추가 | Medium | Pending | `hooks/scripts/cto-stop.js` |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement |
|----------|----------|-------------|
| 턴 효율 | Phase 전환 당 btw 처리에 +2턴 이하 | 실제 턴 카운트 |
| 호환성 | btw가 없는 프로젝트(btw-suggestions.json 미존재)에서 에러 없음 | 조건부 실행 |
| 비간섭 | 기존 `/btw` 독립 사용에 영향 없음 | 기존 명령 전부 동작 확인 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] CTO Team Phase 전환 시 btw analyze 자동 실행됨
- [ ] 제안이 0개일 때 "축적된 btw 제안 없음" 한 줄로 스킵
- [ ] 제안이 있을 때 카테고리별 요약 + 스킬 후보 표시
- [ ] cto-stop.js에서 세션 btw stats 출력
- [ ] btw-suggestions.json 미존재 시 graceful skip

### 4.2 Quality Criteria

- [ ] 기존 `/btw list`, `/btw analyze`, `/btw promote` 동작 변경 없음
- [ ] CTO 50턴 중 btw 관련 소모 ≤ 6턴 (3 Phase 전환 × 2턴)
- [ ] Gap analysis 90%+

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| R1: 턴 소모 과다 | Medium | Low | btw 0건이면 1줄 스킵, 있어도 요약만 (상세는 `/btw list`로 별도 확인) |
| R2: 컨텍스트 오염 | Medium | Low | btw 요약은 Phase 전환 시점에만, 작업 중에는 미개입 |
| R3: btw-suggestions.json 미존재 | Low | Medium | 파일 존재 여부 체크 후 조건부 실행 |
| R4: cto-stop.js 훅 실패 | Low | Low | try-catch로 btw stats 실패 시 무시 |

---

## 6. Architecture Considerations

### 6.1 변경 범위 (Minimal)

```
변경 대상:
┌──────────────────────────────────────────────────────┐
│ agents/cto-lead.md                                   │
│   추가: Phase 전환 프로토콜에 btw analyze 단계       │
│   추가: btw 요약 출력 포맷                           │
│   약 +30줄                                          │
├──────────────────────────────────────────────────────┤
│ skills/btw/SKILL.md                                  │
│   추가: teamContext 필드 설명                         │
│   추가: "CTO Team Integration" 섹션                  │
│   약 +25줄                                          │
├──────────────────────────────────────────────────────┤
│ scripts/cto-stop.js (또는 hooks)                     │
│   추가: btw stats 읽기 + 출력                        │
│   약 +15줄                                          │
└──────────────────────────────────────────────────────┘
총 변경: ~70줄, 3개 파일
```

### 6.2 동작 흐름

```
CTO Team Session
│
├─ [Design] council ──────────────────────────────┐
│    architect, security 작업 중                    │
│    사용자: /btw "보안 검증 스킬 있으면 좋겠다"    │ ← 수동 기록
│    사용자: /btw "이 패턴 자동화하면 좋겠다"       │ ← 수동 기록
│                                                  │
├─ ⚡ Phase 전환 (Design → Do) ─────────────────────┤
│    CTO: btw-suggestions.json 읽기                │
│    CTO: pending 제안 N개 발견                     │ ← 자동 (FR-01)
│    CTO: 카테고리별 요약 출력                      │ ← 자동 (FR-03)
│    CTO: "Do phase에서 참고하세요" 안내            │
│    턴 비용: +1~2                                 │
│                                                  │
├─ [Do] swarm ────────────────────────────────────┤
│    developer 작업 중                              │
│    사용자: /btw "이 API 패턴 반복됨, 제너레이터"  │ ← 수동 기록
│                                                  │
├─ ⚡ Phase 전환 (Do → Check) ─────────────────────┤
│    CTO: btw analyze 실행 (축적된 제안 분석)       │ ← 자동
│    CTO: 스킬 후보 M개 식별, 요약 출력            │
│    턴 비용: +1~2                                 │
│                                                  │
├─ [Check] council ───────────────────────────────┤
│    qa, reviewer 작업                              │
│                                                  │
├─ ⚡ 세션 종료 ──────────────────────────────────────┤
│    cto-stop.js: btw stats 자동 출력               │ ← 자동 (FR-04)
│    "이번 세션: btw N개 수집, M개 스킬 후보"       │
└──────────────────────────────────────────────────┘
```

### 6.3 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| btw 실행 주체 | A) CTO가 직접 / B) 훅 스크립트 / C) 사용자 | **A** | CTO 프롬프트에 지시하면 에이전트가 직접 파일 읽기. 추가 스크립트 불필요 |
| btw 실행 시점 | A) 매 턴 / B) Phase 전환 / C) 세션 종료만 | **B** | Phase 전환이 구조적 전환점. 턴 효율 최적 |
| btw 요약 깊이 | A) 전체 analyze / B) 카운트+카테고리만 / C) 상위 3개만 | **C** | 상위 3개 + 카운트면 1~2턴으로 충분 |
| 세션 종료 보고 | A) cto-stop.js / B) CTO 프롬프트 | **A** | Stop 훅이 확실. CTO는 마지막 턴에서 잊을 수 있음 |

---

## 7. Expected Impact (Quantified)

| Metric | Before | After | Change |
|--------|:------:|:-----:|:------:|
| 팀 세션 중 아이디어 유실률 | ~80% | ~20% | **-75%** |
| PDCA Act 개선 범위 (btw 제안 기반) | 0개 | 3~8개/세션 | **∞** |
| Phase 전환 시 컨텍스트 정보 | Quality Gate만 | QG + btw 요약 | **+1 데이터 소스** |
| CTO 턴 비용 증가 | 0 | +4~6/세션 (3 전환 × ~2턴) | **50턴 중 10% 이내** |
| 스킬 발견 속도 | 수동 | btw→analyze→promote 파이프라인 | **2~3x** |
| 변경 코드량 | 0 | ~70줄, 3파일 | **Minimal** |

---

## 8. Implementation Order

```
1. agents/cto-lead.md — Phase 전환 프로토콜에 btw 단계 추가 (FR-01, FR-03)
2. skills/btw/SKILL.md — teamContext 필드 + CTO Team Integration 섹션 (FR-02)
3. scripts/cto-stop.js — btw stats 출력 로직 (FR-04)
4. 통합 테스트
```

---

## 9. Next Steps

1. [ ] Design 문서 작성 (`btw-team-integration.design.md`)
2. [ ] 구현 (3 파일, ~70줄)
3. [ ] Gap analysis

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-21 | Initial draft — B안 기반 Plan | bkit PDCA |
