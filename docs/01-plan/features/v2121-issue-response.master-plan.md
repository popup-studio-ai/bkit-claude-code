---
template: sprint-master-plan
version: 1.0
description: Sprint Master Plan template — overall sprint orchestration map
variables:
  - feature: Sprint feature name (kebab-case id)
  - displayName: Human-readable sprint name
  - date: Creation date (YYYY-MM-DD)
  - author: Author name
  - trustLevel: Initial Trust Level (L0~L4)
  - duration: Estimated duration
---

# v2.1.21 Issue Response — Session Title Isolation + Sprint Output Enforcement — Sprint Master Plan

> **Sprint ID**: `v2121-issue-response`
> **Date**: 2026-05-29
> **Author**: kay kim (bkit maintainer)
> **Trust Level (시작)**: L4 (Full-Auto)
> **예상 기간**: 1 cycle (8 features, 2 GitHub issue 대응, sequential dispatch)
> **Branch**: `release/v2.1.21-issue-response` (off `main` @ `2fc529f`)
> **Master Plan template**: bkit v2.1.13 (Sprint 4 Presentation 산출)
> **대상 릴리스**: v2.1.20 → **v2.1.21**

---

## 0. Executive Summary

| 항목 | 내용 |
|------|------|
| **Mission** | 2건의 외부 dogfooder open issue(#111 sessionTitle 충돌 P0 버그 / #113 Sprint 화면 출력 강제 미흡 P1 enhancement)를 단일 통합 sprint 으로 해소하여 v2.1.21 릴리스에 반영한다. |
| **Anti-Mission** | (1) session-title 의 **포맷/디자인 재설계**(현 `[bkit] {action} {feature}` 골격 유지) — 충돌 해소를 위한 최소 tag 주입만. (2) PDCA executive-summary 의 **공유/통합 리팩터링** — Sprint 는 별도 shape 으로 신규 작성. (3) `getActiveSkill()` 의 근본 수정(skill-post 미주입 #57317) — 본 sprint 는 `hookContext.skill_name` 우선 의존으로 우회만 한다. (4) sprint phase 라이프사이클 enum/state machine 변경. |
| **Core Primitives** | **Features 8** (F1-F8) · **Phases 8** (prd→plan→design→do→iterate→qa→report→archived) · **Issues 2** (#111, #113) · **신규 모듈** `lib/sprint/executive-summary.js`, `scripts/sprint-skill-stop.js` · **리팩터 모듈** `lib/core/session-title-cache.js`, `lib/pdca/session-title.js`, `scripts/unified-stop.js`, `lib/application/sprint-lifecycle/advance-phase.usecase.js`, `scripts/sprint-handler.js` + 4 Stop emitter |
| **Trust Level** | **L4 Full-Auto** — orchestrator 가 4 auto-pause trigger 중 하나가 발동될 때까지 phase 를 자동 진행. ENH-292 sequential dispatch(하위 sub-agent 병렬 금지) 준수. |
| **Auto-pause 조건** | 4 triggers 활성 (QUALITY_GATE_FAIL / ITERATION_EXHAUSTED / BUDGET_EXCEEDED / PHASE_TIMEOUT) — §6 참고 |
| **Success Criteria** | 5건 (§5 매트릭스 참고) — 핵심: 두 동시 세션이 **서로 다른 title** 생성 + #113 `/sprint phase` 성공 시 Executive Summary 화면 출력 |
| **Issue lineage** | #111 ⊃ #77 (v2.1.6 Phase A, session isolation 미완) · #113 ⊃ #93 (v2.1.16 gate_fail human-readable, success path 미해결) |

### 0.1 4-Perspective Value

| 관점 | 가치 |
|------|------|
| **User (외부 dogfooder)** | wonuseo(#3): 동일 폴더 멀티 세션에서 창 제목이 구분되어 **잘못된 창에 위험 명령 입력 리스크 제거**. rohwonseok-ops: Sprint 진행 상황이 LLM narration 의존 없이 **결정적(deterministic) 화면 출력**으로 보장. |
| **Product** | bkit Early Adopter Program 의 외부 dogfooder feedback loop 입증 (DA-4 N=2 → 신규 reporter 2명 추가 = first-follower effect 강화). Issue→Sprint→Release closed-loop 시연. |
| **Engineering** | session 격리 패턴(`sessions[sessionId]` map + GC) 을 `session-ctx-fp.js` 의 검증된 구조로 통일. Sprint Stop enforcement 가 PDCA(`pdca-skill-stop.js`) 와 동등한 수준으로 격상되어 **PDCA↔Sprint 출력 일관성** 확보. |
| **Maintainability** | #93 의 pure-builder/side-effecting-writer 분리(`failure-reporter.js`) 패턴을 Sprint 출력에 재적용 → usecase 순수성 invariant 유지. 신규 ADR(Sprint Stop Hook Output Enforcement)로 의사결정 기록. |

---

## 1. Context Anchor (Plan → Design → Do 전파)

| Key | Value |
|-----|-------|
| **WHY** | **#111 (P0 버그)**: `lib/pdca/session-title.js:129` `applyFormat()` 가 title 을 `{feature, phase, action}` 만으로 구성하고 sessionId 는 cache key(line 119 `cmp`)로만 사용 → 동일 feature/phase 의 두 세션이 **완전히 동일한 title** (`[bkit] PLAN f1`) 생성. 또한 `lib/core/session-title-cache.js` 가 **PROJECT_DIR 당 단일 flat record** 라 세션 B 가 세션 A 의 record 를 clobber → A 가 phase 변경 없이 재발동 시 `isSameAsCached`(line 91)가 `cached.sessionId===B` 로 false 반환 → title 재발행 → ENH-228 phase-change-only dedup 파괴. 동일 폴더 2터미널에서 **잘못된 창에 위험 명령 입력** 실 사용자 pain. **#113 (P1 enhancement)**: Sprint 의 success/intermediate/status/watch/report 경로가 raw JSON 반환 → 100% LLM narration 의존. PDCA 는 `scripts/pdca-skill-stop.js` 로 Executive Summary + AskUserQuestion + sessionTitle 을 강제하나 Sprint 는 **동등 장치 0개**. |
| **WHO** | **1차**: wonuseo(Wonu Seo, 외부 dogfooder #3, #111 reporter) · rohwonseok-ops(외부 dogfooder, #113 reporter). **2차**: 동일 폴더 멀티 세션을 쓰는 모든 bkit 사용자(#111 은 v2.1.6~v2.1.20 전 버전 영향). **3차**: Sprint 기능 사용자 전체(#113). **Stakeholder**: kay kim(decision maker, 전 phase). |
| **WHAT (도메인)** | **#111 (F1-F3)**: session-title cache 를 `sessions[sessionId]` map 구조로 전환(+GC+legacy migration), title 에 stable short session tag 주입(`[bkit] PLAN f1 ·a1b2`), 4개 Stop emitter 에 session_id threading. **#113 (F4-F8)**: 신규 `lib/sprint/executive-summary.js`(Sprint shape), 신규 `scripts/sprint-skill-stop.js`(pdca-skill-stop mirror), `unified-stop.js` SKILL_HANDLERS 에 `'sprint'` 등록, `advance-phase.usecase.js` 에 phaseTransitionSummary 출력, `/sprint status`+`/sprint watch` human-readable 화면 포맷. |
| **WHAT NOT** | session-title 포맷 전면 재설계 / PDCA executive-summary 와의 코드 공유 / `getActiveSkill()`(skill-post #57317) 근본 수정 / sprint phase enum·state-machine 변경 / 신규 sprint subcommand 추가. |
| **RISK** | (a) **skill_post hook drop #57317**: SessionStart reachability 가 `missing=[skill_post]` 보고 → `detectActiveSkill()` 의 3번째 fallback `getActiveSkill()` 불안정 → sprint-skill-stop 이 `hookContext.skill_name`(CC 제공) 우선 의존해야 함. (b) **legacy flat-record migration**: 기존 단일 record cache 를 읽는 사용자 환경에서 map 전환 시 backward-compat 깨지면 첫 호출에서 title 오발행. (c) **sessionId field 가용성**: Stop hook stdin payload 의 `session_id` 필드명이 emitter 별로 존재하는지 design phase 검증 필요. (d) **docs=code sync + version bump** v2.1.20→v2.1.21 미반영 시 CI `docs-code-sync` red. (e) **ADR 누락**: Sprint Stop enforcement 의사결정이 ADR 로 기록 안 되면 #93/v2.1.16, v2.1.20 ADR 0011 선례와 불일치. |
| **SUCCESS** | (1) 동일 feature/phase 의 두 병렬 세션 → **DISTINCT title** (session tag 로 구분). (2) 세션 A 가 phase 변경 없이 재발동 → `generateSessionTitle()` **undefined** 반환(CC auto-title 보존, ENH-228 dedup 복원). (3) `/sprint phase` success → **Executive Summary 화면 출력**(Mission/Result/matchRate/CSI/Invariant). (4) `/sprint status` → **human-readable per-feature 표** 렌더(feature/phase/matchRate/s1Score). (5) matchRate 100 + S1 100 + criticalIssue 0 + 8/8 feature 완료 + 기존 + 신규 TC 전체 PASS. |
| **SCOPE (정량)** | **Features 8** · 신규 모듈 2 + 리팩터 모듈 ~10(emitter 4 포함) · 예상 LOC ~600-900 (신규 ~400 + 수정 ~200-500) · 신규/확장 TC ~5 파일 · 신규 ADR 1 · docs phase 문서 6 (prd/plan/design/do-report/qa/report) · version bump 1. |
| **OUT-OF-SCOPE** | session-title i18n / Sprint AskUserQuestion 의 full interactive 분기 트리 / PDCA-Sprint executive-summary 통합 추상화 / `getActiveSkill()` 근본 수정(별도 ENH 후속) / token-meter CARRY-5 / sprint phase enum 확장. |

---

## 2. Features (sprint 구성 작업 묶음)

| # | Feature | Issue | 우선순위 | 상태 | 의존 | 담당 |
|---|---------|-------|--------|------|------|------|
| F1 | `session-cache-map-refactor` | #111 | **P0** | pending | — | (L4 auto) |
| F2 | `session-title-tag` | #111 | **P0** | pending | F1 | (L4 auto) |
| F3 | `stop-hook-sessionid-threading` | #111 | **P0** | pending | F2 | (L4 auto) |
| F4 | `sprint-executive-summary` | #113 | **P1** | pending | — | (L4 auto) |
| F5 | `sprint-skill-stop-hook` | #113 | **P1** | pending | F4 | (L4 auto) |
| F6 | `skill-handlers-sprint-registration` | #113 | **P1** | pending | F5 | (L4 auto) |
| F7 | `phase-transition-summary-payload` | #113 | **P1** | pending | F4 | (L4 auto) |
| F8 | `sprint-status-watch-format` | #113 | **P2** | pending | F4 | (L4 auto) |

> **우선순위 근거**: F1-F3 는 **#111(v2.1.6~v2.1.20 전 버전 영향 + 위험 명령 오입력 리스크)**의 실 버그라 P0. F4-F7 은 #113 핵심 출력 강제 경로라 P1. F8 은 화면 포맷 개선(status/watch)으로 사용자 가시성 향상이나 출력 강제의 핵심은 아니므로 P2.

### 2.1 Feature 상세

- **F1 `session-cache-map-refactor`** (#111): `lib/core/session-title-cache.js` 의 단일 flat record → `{ $schemaVersion, sessions: { [sessionId]: {...} } }` map 구조 전환. `session-ctx-fp.js`(lines 34-84)의 검증된 패턴 미러 — `readStore`/`writeStore`(atomic tmp+rename)/`gc`(stale 30d TTL + LRU cap 100). **legacy flat-record migration**: 기존 단일 record 를 읽으면 `sessions[record.sessionId]` 로 1회 변환 후 재기록. `isSameAsCached` 가 sessionId 별 lookup 으로 동작하도록 시그니처 조정.
- **F2 `session-title-tag`** (#111, →F1): `lib/pdca/session-title.js` 의 `applyFormat()` 에 stable short session tag 주입(예 `·a1b2` = sessionId 의 short hash, `computeFingerprint` 유사 절단). per-session cache lookup 으로 dedup 복원(`cmp` 가 session 별 record 비교). 포맷 골격 `[bkit] {action} {feature}` → `[bkit] {action} {feature} ·{tag}` 유지(sessionId 없으면 tag 생략하여 backward-compat).
- **F3 `stop-hook-sessionid-threading`** (#111, →F2): `session_id` 미전달 4개 Stop emitter 에 threading — `scripts/iterator-stop.js:334`, `scripts/plan-plus-stop.js:78`, `scripts/pdca-skill-stop.js:353,385`, `scripts/gap-detector-stop.js:556`. 각 emitter 의 stdin payload 에서 `input.session_id` 가용성 검증(design item) 후 `generateSessionTitle({ ..., sessionId })` 로 전달. (user-prompt-handler:94,284 / session-start:301 은 이미 정상.)
- **F4 `sprint-executive-summary`** (#113): 신규 `lib/sprint/executive-summary.js`. **Sprint shape**(report.template.md §1): `{ mission, result, matchRate, crossSprintIntegration, invariant, pluginValidate }` + `formatExecutiveSummary(summary, 'full'|'compact')`. PDCA shape(problem/solution/functionUxEffect/coreValue)와 **다르므로 재사용 금지** — 신규 작성. `lib/sprint/` 디렉터리도 신규 생성.
- **F5 `sprint-skill-stop-hook`** (#113, →F4): 신규 `scripts/sprint-skill-stop.js`. `pdca-skill-stop.js` 미러 — `require.main !== module` bare-require guard(line 19 패턴), stdin 읽기, action/feature 추출, Executive Summary + AskUserQuestion + sessionTitle 블록(lines 339-381 패턴), `hookSpecificOutput.{additionalContext, sessionTitle, userPrompt}` JSON emit. **skill_name 우선 의존**(#57317 회피).
- **F6 `skill-handlers-sprint-registration`** (#113, →F5): `scripts/unified-stop.js:95-109` `SKILL_HANDLERS` 에 `'sprint': './sprint-skill-stop.js'` 등록(line 283 `executeHandler` 가 self-execute). `detectActiveSkill()`(lines 140-164) 의 `hookContext.skill_name` 1순위 경로 resilience 보강(#57317 로 getActiveSkill fallback 불안정 대비).
- **F7 `phase-transition-summary-payload`** (#113, →F4): `lib/application/sprint-lifecycle/advance-phase.usecase.js` SUCCESS path(lines 205-224)에 `phaseTransitionSummary` 출력 추가. #93 gate_fail 선례(lines 128-171)의 **caller-injected `deps`(failureReporter)/best-effort/pure-module(usecase 내 fs write 금지)** 규율 준수. handler(`scripts/sprint-handler.js handlePhase` ~line 839)가 wiring.
- **F8 `sprint-status-watch-format`** (#113, →F4): `scripts/sprint-handler.js` handleStatus(~456)/handleWatch 가 raw JSON → human-readable per-feature 진행 표(feature/phase/matchRate/s1Score). 데이터 출처: `data-flow-matrix.json` + sprint state. `failure-reporter.js`(#93)의 pure-builder/side-effecting-writer 분리 스타일 미러.

---

## 3. Sprint Phase Roadmap

| Phase | 활성 시점 | 산출물 | Quality Gates |
|-------|---------|------|-------------|
| prd | sprint 시작 | PRD 문서 (`docs/00-pm/v2121-issue-response.prd.md`) | M8 |
| plan | PRD 후 | Plan 문서 (`docs/01-plan/features/v2121-issue-response.plan.md`) | M8 |
| design | Plan 후 | Design 문서 (코드베이스 분석 포함, `docs/02-design/...`) — **sessionId field 가용성 검증 + skill_name fallback 설계 포함** | M4, M8 |
| do | Design 후 | 구현 코드 (F1→F8 sequential) | M2, M3, M5, M7 |
| iterate | matchRate < 100 시 | matchRate 100% 달성 | M1 (100%) |
| qa | iterate 후 | 7-Layer S1 검증 + 신규/확장 TC | M3 (=0), S1 (=100) |
| report | qa 후 | 종합 보고서 + ADR + version bump | M10, S2, S4 |
| archived | report 후 (L4) 또는 사용자 명시 | terminal state | - |

---

## 4. Quality Gates 활성화 매트릭스

| Gate | 의미 | prd | plan | design | do | iterate | qa | report |
|------|------|:---:|:----:|:------:|:--:|:-------:|:--:|:------:|
| M1 | matchRate (Design↔Code) | | | | | ✅(100) | ✅ | ✅ |
| M2 | build/lint pass | | | | ✅ | | | |
| M3 | criticalIssueCount=0 | | | | ✅ | | ✅(=0) | ✅ |
| M4 | designCompleteness ≥85 | | | ✅ | | | | |
| M5 | test coverage 임계 | | | | ✅ | | ✅ | |
| M7 | no mock placeholder | | | | ✅ | | | |
| M8 | doc structure 준수 | ✅ | ✅ | ✅ | | | | ✅ |
| M10 | sprint cycle metric | | | | | | | ✅ |
| S1 | dataFlowIntegrity (7-Layer) | | | | | | ✅(100) | ✅ |
| S2 | report completeness | | | | | | | ✅ |
| S4 | docs=code sync | | | | | | | ✅ |

> **본 sprint 특이 사항**: design phase 의 M4(designCompleteness ≥85) 가 핵심 — #57317 hook-drop 영향 분석, sessionId field 가용성 검증, legacy migration 시나리오, ADR candidate 가 모두 design 산출물에 포함되어야 통과.

---

## 5. Success Metrics (5건)

| # | Metric | Target | 측정 방법 |
|---|--------|--------|----------|
| 1 | **#111 두 병렬 세션 title 구분** | 동일 feature/phase 두 sessionId → **DISTINCT title** (session tag 다름) | `test/unit/session-title.test.js` 확장 — 2개 sessionId 로 `generateSessionTitle()` 호출 후 title 비동일 assert |
| 2 | **#111 phase-change-only dedup 복원** | 세션 A 가 phase 변경 없이 재발동 → `generateSessionTitle()` **undefined** 반환 (CC auto-title 보존) | 동일 test — A 발행 후 B 발행 후 A 재발행 시 undefined assert (clobber 회귀 방지) |
| 3 | **#113 Exec Summary 화면 출력** | `/sprint phase` success → Executive Summary(Mission/Result/matchRate/CSI/Invariant) 화면 출력 | `test/unit/sprint-skill-stop.test.js` — stdin success payload → `hookSpecificOutput.additionalContext` 에 Exec Summary 포함 assert |
| 4 | **#113 status human-readable 표** | `/sprint status` → per-feature 표(feature/phase/matchRate/s1Score) 렌더 | sprint-handler handleStatus 단위 테스트 — raw JSON 아닌 markdown 표 문자열 반환 assert |
| 5 | **Sprint 품질 종합** | matchRate 100% + S1 100 + criticalIssue 0 + featureCompletion 8/8 + 전체 TC PASS | gap-detector + sprint-qa-flow agent + featureMap 집계 + `npm test` |

---

## 6. Auto-Pause Triggers (4 활성)

| Trigger | 조건 | 사용자 결정 옵션 |
|---------|------|----------------|
| QUALITY_GATE_FAIL | M3 > 0 OR S1 < 100 | fix & resume / forward fix / abort |
| ITERATION_EXHAUSTED | iter ≥ 5 AND matchRate < 90 | forward fix / carry / abort |
| BUDGET_EXCEEDED | cumulativeTokens > budget | budget 증액 & resume / abort / archive |
| PHASE_TIMEOUT | phase 진행 시간 > config.phaseTimeoutHours | timeout 연장 / force-advance / abort |

> **본 sprint 예상 pause 후보**: (a) design phase 에서 sessionId field 가용성 검증이 일부 emitter 에서 음성 → QUALITY_GATE_FAIL 대신 design 보강 후 진행. (b) F3 의 4-emitter threading 회귀로 ENH-228 dedup 테스트 fail → iterate.

---

## 7. Cross-Sprint Dependency

- **상류(본 sprint 가 의존)**: v2.1.6 #77 Phase A(ENH-228 phase-change-only dedup, ENH-229 stale TTL) — F2/F3 가 이 dedup 동작을 **복원·확장**. v2.1.16 #93(`failure-reporter.js` gate_fail human-readable) — F4/F7/F8 가 동일 pure-builder/writer 분리 패턴을 success path 로 **확장**. v2.1.12 ENH-239(`session-ctx-fp.js` sessions map+GC) — F1 이 이 구조를 **미러**.
- **하류(본 sprint 가 제공)**: Sprint Stop enforcement(F5/F6) 는 향후 모든 sprint 의 화면 출력 표준이 됨. `lib/sprint/executive-summary.js`(F4) 는 후속 sprint report 자동화에 재사용 가능.
- **PDCA↔Sprint 경계**: #111(session-title) 과 #113(sprint stop) 은 `lib/pdca/session-title` surface 를 **개념적으로 공유**하나 **코드 경로 독립**. → #111(P0) 먼저 완결 후 #113 진행(시퀀스 보장, 회귀 격리).

---

## 8. Risks & Mitigation

| # | Risk | 가능성 | 영향 | Mitigation |
|---|------|:------:|:----:|-----------|
| R1 | **skill_post hook drop #57317** → `detectActiveSkill()` 의 `getActiveSkill()` fallback 불안정 → sprint-skill-stop 미발동 | 중 | 높음 | sprint-skill-stop(F5)/registration(F6) 이 **`hookContext.skill_name`(CC 제공) 1순위 의존**. design phase 에서 skill_name 미존재 시 PDCA-status fallback 보조 경로 설계. SessionStart reachability check 결과를 design 문서에 명시. |
| R2 | **legacy flat-record migration backward-compat** 깨짐 → 기존 cache 환경 첫 호출 title 오발행 | 중 | 중 | F1 에서 `readStore()` 가 flat record(`sessions` 키 부재) 감지 시 `sessions[record.sessionId]` 로 1회 변환. `session-ctx-fp.js readStore`(line 40 `!parsed.sessions` 가드) 패턴 미러. migration 전용 TC 추가. |
| R3 | **sessionId field 가용성** — Stop hook stdin payload 에 `session_id` 미존재 emitter 존재 가능 | 중 | 중 | **design phase 검증 item**. emitter 별 stdin 스키마 확인 후, 부재 시 tag 생략(backward-compat) + 로그. F3 가 emitter 별 가용성 표를 design 문서에 기록. |
| R4 | **docs=code sync + version bump** v2.1.20→v2.1.21 누락 → CI `docs-code-sync` red | 중 | 중 | report phase 에서 `bkit.config.json` version SoT + `.claude-plugin/plugin.json` + CHANGELOG [2.1.21] + hook header 동기 갱신. S4 gate 로 검증. |
| R5 | **ADR 누락** — Sprint Stop enforcement 의사결정 미기록 | 중 | 낮음 | report phase 에서 **ADR candidate `docs/07-adr/00NN-sprint-stop-hook-output-enforcement.md`** 작성. #93/v2.1.16, v2.1.20 ADR 0011 선례 형식 미러. §9 참고. |
| R6 | F3 4-emitter threading 회귀 → ENH-228 phase-change-only dedup 깨짐 | 중 | 높음 | F3 전후로 `session-title.test.js` dedup 회귀 TC(metric #2) 실행. usecase 순수성/best-effort 규율 유지. |
| R7 | F7 usecase 순수성 invariant 위반(advance-phase 내 fs write) | 낮음 | 높음 | #93 선례대로 `deps.summaryReporter` caller-injected, usecase 는 데이터만 반환. handler 가 side-effect 담당. contract test 로 usecase pure 검증. |

### 8.1 Pre-mortem 요약 (상세는 PRD §8)

- "릴리스 후 #111 reporter 가 여전히 동일 title 본다" → metric #1 의 2-sessionId DISTINCT assert 를 qa gate 로 강제.
- "sprint-skill-stop 이 CC 환경에서 발동 안 함(#57317)" → skill_name 1순위 + integration runtime test(static check 불충분, [[feedback_thorough_qa]] 원칙).
- "legacy cache 사용자 환경에서 첫 title 깨짐" → migration TC 강제.

---

## 9. ADR Candidate — Sprint Stop Hook Output Enforcement

본 sprint 의 #113 대응은 **architectural decision** 을 수반한다: "Sprint skill 도 PDCA 와 동등하게 Stop hook 으로 Executive Summary + AskUserQuestion + sessionTitle 을 강제한다." 이는 다음 선례와 동일한 처리 흐름을 따른다.

- **#93 / v2.1.16**: gate_fail human-readable report → `failure-reporter.js` + `gate-failure-report.template.md` (pure-builder/writer 분리)
- **v2.1.20 ADR 0011**: Plugin Manifest Schema Compliance

→ **report phase 산출**: `docs/07-adr/00NN-sprint-stop-hook-output-enforcement.md` (다음 ADR 번호 = 0011 다음 → **0012**, report phase 에서 디렉터리 확인 후 확정). 결정 사항: (1) Sprint stop handler 의 skill_name 우선 의존 근거(#57317), (2) Sprint executive-summary 를 PDCA 와 별도 shape 으로 둔 근거, (3) usecase 순수성 유지를 위한 dependency-injection 패턴.

---

## 10. Implementation Order (ENH-292 Sequential Dispatch)

> **ENH-292 준수**: 하위 sub-agent 병렬 spawn 금지. 모든 feature 는 의존 그래프 위상 순서로 **순차 dispatch**.

```
#111 (P0 버그 — 먼저)
  F1 session-cache-map-refactor   (no dep)
    → F2 session-title-tag         (dep F1)
      → F3 stop-hook-sessionid-threading (dep F2)
#113 (P1 enhancement — #111 완결 후)
  F4 sprint-executive-summary     (no dep)
    → F5 sprint-skill-stop-hook    (dep F4)
      → F6 skill-handlers-sprint-registration (dep F5)
    → F7 phase-transition-summary-payload (dep F4)
    → F8 sprint-status-watch-format (dep F4)
```

**선형 실행 순서**: F1 → F2 → F3 → F4 → F5 → F6 → F7 → F8

- F4 완료 후 F5→F6 체인, F7, F8 은 F4 에만 의존하나 sequential dispatch 원칙상 F6 이후 F7, F7 이후 F8 순서로 진행.
- #111(F1-F3) 완전 완결 후 #113 진입 — P0 버그 회귀 격리 + dedup 테스트 통과 확인 게이트.

---

## 11. Test Plan (추가/확장 TC)

| TC 파일 | 종류 | 대상 | 핵심 케이스 |
|---------|------|------|-----------|
| `test/unit/session-title.test.js` | **확장** | F1/F2/F3 | (a) 2 sessionId DISTINCT title, (b) phase-change-only dedup 복원(A→B→A undefined), (c) legacy flat-record migration, (d) sessionId 부재 시 tag 생략 backward-compat |
| `test/unit/session-title-cache.test.js` | **확장/신규** | F1 | sessions map read/write/gc(stale 30d+LRU 100) + legacy migration |
| `test/unit/sprint-executive-summary.test.js` | **신규** | F4 | sprint shape 생성(Mission/Result/matchRate/CSI/Invariant) + format full/compact |
| `test/unit/sprint-skill-stop.test.js` | **신규** | F5 | stdin success payload → Exec Summary + sessionTitle + userPrompt JSON; skill_name 우선 분기 |
| `test/contract/skill-handlers.test.js` (또는 unified-stop contract) | **신규/확장** | F6 | SKILL_HANDLERS 에 `'sprint'` 엔트리 존재 + executeHandler dispatch |
| `test/unit/advance-phase.usecase.test.js` | **확장** | F7 | SUCCESS path 에 phaseTransitionSummary 포함 + **usecase 순수성**(fs write 없음) contract |
| `test/unit/sprint-handler.test.js` (handleStatus/handleWatch) | **확장** | F8 | status/watch → human-readable 표 문자열 반환 assert |
| `test/e2e/` integration runtime | **확장** | F5/F6 | 실제 Stop hook 실행으로 sprint-skill-stop 발동 검증(static check 불충분, [[feedback_thorough_qa]]) |

---

## 12. Resume / Abort 흐름

| 상황 | 절차 |
|------|------|
| Auto-pause 후 resume | `/sprint resume v2121-issue-response` — 사유 해소 검증 |
| 사용자 abort | `/sprint archive v2121-issue-response` — terminal state |

---

## 13. Sprint 추적 (Living document)

본 master plan 은 sprint 진행 중 cumulative KPI 갱신 + phase 전이 시 history append. archived 시 readonly 전환. 완료 시 Memory Sprint History 에 append + Issue #111/#113 close.

---

**Next Phase**: PRD (`docs/00-pm/v2121-issue-response.prd.md`) — Context Anchor 전파 + Job Stories + Pre-mortem. 이후 `/sprint phase v2121-issue-response --to plan`.

> **Status**: Draft v1.0 — pending review.
