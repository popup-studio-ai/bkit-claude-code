---
template: sprint-prd
version: 1.0
description: Sprint PRD phase document — Context Anchor, Job Stories, Solution, Success Metrics, Pre-mortem
variables:
  - feature: Sprint feature name
  - date: Creation date
  - author: Author
  - trustLevel: Trust Level
---

# v2121-issue-response PRD — Sprint Management

> **Sprint ID**: `v2121-issue-response`
> **Sprint 명**: v2.1.21 Issue Response — Session Title Isolation + Sprint Output Enforcement
> **Phase**: PRD (1/7)
> **Date**: 2026-05-29
> **Author**: kay kim (bkit maintainer)
> **Trust Level**: L4 (Full-Auto)
> **Master Plan**: [`docs/01-plan/features/v2121-issue-response.master-plan.md`](../01-plan/features/v2121-issue-response.master-plan.md)
> **대상 릴리스**: v2.1.20 → v2.1.21

---

## 0. Context Anchor (보존 — 후속 phase 모두 복사)

> Master Plan §1 에서 전파. plan/design/do 전 phase 동일 유지.

| Key | Value |
|-----|-------|
| **WHY** | **#111(P0)**: `session-title.js:129` 가 title 을 sessionId 없이 구성 + `session-title-cache.js` 가 PROJECT_DIR 당 단일 flat record → 동일 폴더 멀티 세션이 **동일 title** 생성 + 세션 간 cache clobber 로 phase-change-only dedup 파괴 → 잘못된 창에 위험 명령 입력 리스크. **#113(P1)**: Sprint success/status/watch/report 가 raw JSON 반환 → 100% LLM narration 의존, PDCA 와 달리 Stop hook 출력 강제 장치 0개. |
| **WHO** | 1차: wonuseo(#111 reporter, 외부 dogfooder #3) · rohwonseok-ops(#113 reporter, 외부 dogfooder). 2차: 동일 폴더 멀티 세션 사용자(#111 v2.1.6~v2.1.20 전체 영향) + Sprint 사용자 전체(#113). Stakeholder: kay kim(decision maker). |
| **RISK** | (a) skill_post hook drop #57317 → detectActiveSkill 불안정. (b) legacy flat-record migration backward-compat. (c) Stop hook payload 의 session_id field 가용성. (d) docs=code sync + version bump 누락. (e) Sprint Stop enforcement ADR 누락. |
| **SUCCESS** | 두 병렬 세션 DISTINCT title + 세션 A 재발동 undefined(dedup 복원) + `/sprint phase` Exec Summary 화면 출력 + `/sprint status` human-readable 표 + matchRate 100/S1 100/criticalIssue 0/8 feature 완료. |
| **SCOPE** | **In**: 8 features(F1-F8), 신규 모듈 2(`lib/sprint/executive-summary.js`, `scripts/sprint-skill-stop.js`), 리팩터 ~10 모듈(emitter 4 포함), TC ~5 파일, ADR 1, version bump 1. **Out**: session-title 포맷 재설계 / PDCA-Sprint exec-summary 통합 / getActiveSkill 근본 수정(#57317) / sprint enum 변경 / token-meter CARRY-5. |

---

## 1. Problem Statement

### 1.1 현 상태 vs 기대 상태

| 영역 | 현 상태 (v2.1.20) | 기대 상태 (v2.1.21) |
|------|------------------|---------------------|
| Multi-session title (#111) | 동일 폴더 2터미널 → 두 창 모두 `[bkit] PLAN f1` (구분 불가) | `[bkit] PLAN f1 ·a1b2` / `·c3d4` 로 세션별 구분 |
| Session cache (#111) | PROJECT_DIR 당 단일 flat record, 세션 B 가 A clobber | `sessions[sessionId]` map + GC, 세션 독립 |
| phase-change dedup (#111) | clobber 로 A 재발동 시 title 재발행(ENH-228 파괴) | A 재발동 시 undefined(dedup 복원) |
| Stop emitter sessionId (#111) | 4개 emitter 가 sessionId 미전달 | 전 emitter session_id threading |
| Sprint success 출력 (#113) | raw JSON, LLM narration 의존 | Stop hook Executive Summary 강제 |
| Sprint status/watch (#113) | raw JSON | human-readable per-feature 표 |
| Sprint phase 전이 (#113) | gateResults 만 반환 | phaseTransitionSummary 추가 |
| Sprint Stop registry (#113) | unified-stop SKILL_HANDLERS 에 'sprint' 부재 | 'sprint' 등록 + skill_name resilience |

### 1.2 부재 기능 매트릭스 (#113 ← PDCA 대비)

| 기능 | PDCA | Sprint (현) | Sprint (목표) |
|------|:----:|:-----------:|:-------------:|
| Stop handler | `pdca-skill-stop.js` ✅ | ❌ 없음 | `sprint-skill-stop.js` ✅ |
| SKILL_HANDLERS 등록 | ✅ `'pdca'` | ❌ | ✅ `'sprint'` |
| Executive Summary 모듈 | `lib/pdca/executive-summary.js` ✅ | ❌ | `lib/sprint/executive-summary.js` ✅ |
| AskUserQuestion 강제 | ✅ | ❌ | ✅ |
| sessionTitle 발행 | ✅ | ❌ | ✅ |
| success path 화면 출력 | ✅ | ❌ (raw JSON) | ✅ |

---

## 2. Job Stories (JTBD)

### Job Story 1 (#111)
- **When** 동일 프로젝트 폴더에서 2개 터미널로 bkit 세션을 동시에 띄울 때,
- **I want to** 각 창 제목이 서로 다르게 표시되기를
- **so I can** 위험한 명령을 잘못된 창에 입력하는 사고를 방지한다.

### Job Story 2 (#111)
- **When** 한 세션에서 phase 변경 없이 메시지를 반복 보낼 때,
- **I want to** 창 제목이 불필요하게 재발행되지 않기를
- **so I can** CC 자동 제목과 ENH-228 dedup 동작을 유지한다.

### Job Story 3 (#111)
- **When** iterator/plan-plus/gap-detector 등 Stop hook 이 제목을 갱신할 때,
- **I want to** 그 갱신이 현재 세션에 귀속되기를
- **so I can** 다른 세션의 제목 cache 가 오염되지 않게 한다.

### Job Story 4 (#113)
- **When** `/sprint phase` 로 phase 전이가 성공할 때,
- **I want to** Mission/Result/matchRate 가 화면에 결정적으로 출력되기를
- **so I can** LLM narration 없이도 진행 결과를 신뢰할 수 있다.

### Job Story 5 (#113)
- **When** `/sprint status` 또는 `/sprint watch` 를 실행할 때,
- **I want to** feature 별 phase/matchRate/s1Score 표를 보기를
- **so I can** raw JSON 을 직접 파싱하지 않고 한눈에 진행 상황을 파악한다.

### Job Story 6 (#113)
- **When** CC 환경에서 skill-post hook 이 drop(#57317) 될 때,
- **I want to** Sprint Stop handler 가 hookContext.skill_name 으로도 발동되기를
- **so I can** 출력 강제가 환경 불안정에 견디게 한다.

### Job Story 7 (#113)
- **When** sprint advance-phase usecase 가 결과를 반환할 때,
- **I want to** usecase 가 순수성을 유지(직접 fs write 없음)하기를
- **so I can** #93 의 pure-module invariant 와 테스트 용이성을 보존한다.

---

## 3. User Personas

### Persona A — wonuseo (외부 dogfooder #3, #111 reporter)
- **목표**: 동일 폴더 멀티 세션 병행 작업.
- **요구사항**: 창 제목으로 세션 즉시 구분.
- **Pain point**: 두 창 동일 제목 → 위험 명령 오입력 위험. v2.1.6~v2.1.20 전 버전 영향.

### Persona B — rohwonseok-ops (외부 dogfooder, #113 reporter)
- **목표**: Sprint 진행 상황을 결정적으로 확인.
- **요구사항**: success/status/watch 화면 출력.
- **Pain point**: raw JSON + LLM narration 의존 → 출력 불확실성.

### Persona C — kay kim (maintainer, decision maker)
- **목표**: Issue→Sprint→Release closed-loop + invariant 보존.
- **요구사항**: PDCA-Sprint 출력 일관성, ADR 기록, docs=code sync.

---

## 4. Solution Overview

### 4.1 #111 데이터 흐름 (F1→F2→F3)

```
Stop hook stdin {session_id}  ──(F3 threading)──▶ generateSessionTitle({action,feature,sessionId})
                                                          │
                                          (F2) applyFormat + short session tag (·a1b2)
                                                          │
                          (F2) per-session cache lookup ──┤
                                                          ▼
              (F1) session-title-cache.js: sessions[sessionId] map + GC + legacy migration
                          (mirror lib/core/session-ctx-fp.js readStore/writeStore/gc)
```

### 4.2 #113 데이터 흐름 (F4→F5/F6, F7, F8)

```
/sprint phase ──▶ sprint-handler.handlePhase ──▶ advance-phase.usecase
                                                      │ (F7) phaseTransitionSummary (pure, deps-injected)
                                                      ▼
CC Stop ──▶ unified-stop.detectActiveSkill (skill_name 1순위)
              │ (F6) SKILL_HANDLERS['sprint']
              ▼
        (F5) sprint-skill-stop.js  ──(F4)──▶ lib/sprint/executive-summary.js
              │  Exec Summary(Mission/Result/matchRate/CSI/Invariant) + AskUserQuestion + sessionTitle
              ▼
        hookSpecificOutput.{additionalContext, sessionTitle, userPrompt}

/sprint status|watch ──(F8)──▶ sprint-handler: human-readable per-feature 표
                               (data-flow-matrix.json + sprint state, builder/writer 분리)
```

### 4.3 핵심 결정

1. **session-ctx-fp.js 구조 미러**(F1): 검증된 `sessions` map + GC(stale 30d, LRU 100) + atomic write 재사용.
2. **Sprint exec-summary 별도 shape**(F4): report.template §1 의 Mission/Result/matchRate/CSI/Invariant — PDCA shape 와 다르므로 신규.
3. **skill_name 1순위 의존**(F5/F6): #57317 hook-drop 회피.
4. **usecase 순수성 유지**(F7): #93 dependency-injection 패턴, fs write 는 handler.
5. **builder/writer 분리**(F8): `failure-reporter.js` 스타일.

---

## 5. Success Metrics

### 5.1 정량 메트릭

| Metric | Target | 측정 방법 |
|--------|--------|----------|
| #111 두 세션 DISTINCT title | 비동일 | session-title.test.js 확장 |
| #111 dedup 복원 (A 재발동) | undefined | session-title.test.js (A→B→A) |
| #113 Exec Summary 출력 | additionalContext 포함 | sprint-skill-stop.test.js |
| #113 status 표 렌더 | markdown 표 반환 | sprint-handler.test.js |
| matchRate (Design↔Code) | 100 | gap-detector |
| criticalIssueCount | 0 | code-analyzer |
| dataFlowIntegrity (S1) | 100 | sprint-qa-flow |
| featureCompletion | 8/8 | featureMap |
| TC 전체 | PASS | npm test + e2e |

### 5.2 정성 메트릭

- PDCA↔Sprint 출력 일관성(동등 Stop enforcement).
- usecase 순수성 invariant 무위반.
- legacy cache 사용자 무중단 migration.
- docs=code sync 100% (version bump 포함).

---

## 6. Out-of-scope

| 항목 | 사유 | 이월 |
|------|------|------|
| session-title i18n | 충돌 해소 핵심 아님 | 후속 |
| getActiveSkill 근본 수정 (#57317) | 본 sprint 는 우회만 | 별도 ENH |
| PDCA-Sprint exec-summary 통합 추상화 | over-engineering | 후속 |
| sprint phase enum/state-machine 변경 | scope 밖 | — |
| token-meter CARRY-5 | 무관 | 별도 |
| Sprint AskUserQuestion full 분기 트리 | MVP 범위 초과 | 후속 |

---

## 7. Stakeholder Map

| Stakeholder | Role | Sprint 영향 |
|------------|------|------------|
| kay kim | Decision maker / maintainer | 전 phase |
| wonuseo (외부 dogfooder #3) | #111 reporter / 검증 | report (issue close 검증) |
| rohwonseok-ops (외부 dogfooder) | #113 reporter / 검증 | report (issue close 검증) |
| L4 orchestrator | 자동 진행 주체 | do→archived |

---

## 8. Pre-mortem (실패 시나리오 + 사전 방지)

### Scenario A — 릴리스 후 #111 reporter 가 여전히 동일 title
- **영향**: P0 버그 미해결, 신뢰 손상.
- **방지**: metric "2-sessionId DISTINCT" 를 qa gate 강제. integration test 로 실제 발행 검증.

### Scenario B — legacy flat-record 환경 첫 title 깨짐
- **영향**: 기존 사용자 회귀.
- **방지**: F1 migration(`sessions` 키 부재 감지 → 변환) + 전용 TC. session-ctx-fp `!parsed.sessions` 가드 미러.

### Scenario C — sprint-skill-stop 이 CC 환경에서 미발동 (#57317)
- **영향**: #113 핵심 기능 무력화.
- **방지**: skill_name 1순위 + PDCA-status 보조 fallback + e2e runtime test([[feedback_thorough_qa]] static 불충분).

### Scenario D — F3 threading 으로 ENH-228 dedup 회귀
- **영향**: title 과다 재발행, #77 Phase A 퇴행.
- **방지**: F3 전후 dedup 회귀 TC(A→B→A undefined).

### Scenario E — advance-phase usecase 순수성 위반
- **영향**: 테스트 어려움, #93 invariant 퇴행.
- **방지**: deps-injection + usecase fs-write-free contract test.

### Scenario F — Stop hook payload 에 session_id 부재
- **영향**: F3 일부 emitter tag 미주입.
- **방지**: design phase emitter 별 stdin 스키마 검증 표 + 부재 시 tag 생략 backward-compat.

### Scenario G — docs=code sync / version bump 누락
- **영향**: CI `docs-code-sync` red, 릴리스 차단.
- **방지**: report phase version SoT(bkit.config.json + plugin.json + CHANGELOG + hook header) 동기 + S4 gate.

### Scenario H — Sprint Stop enforcement ADR 누락
- **영향**: 의사결정 미기록, 선례 불일치.
- **방지**: report phase ADR 0012 작성(#93/v2.1.16, ADR 0011 미러).

---

## 9. PRD 완료 Checklist

- [x] Context Anchor 5건 모두 작성
- [x] Problem Statement 부재 매트릭스
- [x] Job Stories 최소 5건 (7건)
- [x] User Personas 1+ (3 personas)
- [x] Solution Overview 구조 + 데이터 흐름
- [x] Success Metrics 정량 + 정성
- [x] Out-of-scope 매트릭스
- [x] Stakeholder Map
- [x] Pre-mortem 최소 5 시나리오 (8건)

---

**Next Phase**: Phase 2 Plan — Requirements + Feature Breakdown(F1-F8 의존 그래프) + Quality Gates + Risks + Implementation Order. `/sprint phase v2121-issue-response --to plan`.

> **Status**: Draft v1.0 — pending review.
