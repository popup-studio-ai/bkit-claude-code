# v2121-issue-response 완료 보고서 — Sprint Management

> **Sprint ID**: `v2121-issue-response`
> **Phase**: Report (7/7)
> **Date**: 2026-05-29
> **Branch**: `release/v2.1.21-issue-response` (off `main` @ `2fc529f`)
> **대상 릴리스**: v2.1.20 → **v2.1.21**
> **Trust Level**: L4 Full-Auto

---

## 1. Executive Summary

| 항목 | 값 |
|------|-----|
| **Mission** | 2건의 외부 dogfooder open issue(#111 sessionTitle 충돌 P0 / #113 Sprint 화면 출력 강제 P1)를 단일 통합 sprint 으로 해소하여 v2.1.21 릴리스에 반영 |
| **Result** | ✅ 완료 — 18 tracked 수정 (+334/-46) + 6 신규 파일 (879 LOC) + 79 신규/확장 TC PASS |
| **matchRate** | ★ 100% (master plan 8 features 전부 구현) |
| **Cross-Sprint Integration** | ✅ #77(ENH-228 dedup) 복원 + #93(failureReporter DI) 패턴 계승 + ENH-239(sessions map) 미러 |
| **Invariant** | ✅ 0 변경 (domain purity 18/18 · check-guards 22/22 · usecase 순수성 유지) |
| **`claude plugin validate .`** | ✅ Exit 0 (✔ Validation passed) |
| **claude -p 실 런타임** | ✅ `--plugin-dir .` 플러그인 로드 + F8 display 렌더 확인 |

---

## 2. 산출물

### 2.1 코드 (신규 2 + 리팩터 8)

```
신규:
  lib/sprint/executive-summary.js              279 LOC  (F4 sprint-shape exec summary)
  scripts/sprint-skill-stop.js                 230 LOC  (F5 Stop hook, run-export)
리팩터:
  lib/core/session-title-cache.js              +136/-  (F1 sessions map + GC + migration)
  lib/pdca/session-title.js                    +49     (F2 session tag)
  scripts/{iterator,plan-plus,gap-detector,pdca-skill}-stop.js  (F3 session_id threading)
  scripts/unified-stop.js                      +1      (F6 SKILL_HANDLERS 'sprint')
  lib/application/sprint-lifecycle/advance-phase.usecase.js  +29  (F7 phaseTransitionSummary)
  scripts/sprint-handler.js                    +27     (F7 wiring + F8 status/watch display)
```

### 2.2 Public API Surface

| Module | Exports |
|--------|---------|
| `lib/sprint/executive-summary.js` | `generateSprintExecutiveSummary`, `formatSprintExecutiveSummary`, `formatFeatureTable`, `formatGatesLine`, `formatStatusScreen`, `featureRows`, `buildNextActions` |
| `lib/pdca/session-title.js` | + `sessionTag` (신규) |
| `lib/core/session-title-cache.js` | `readCache`/`writeCache`/`isSameAsCached`(per-session) + `normalizeStore`, `keyFor` |
| `scripts/sprint-skill-stop.js` | `run`, `buildResponse`, `loadSprint`, `latestActiveSprint` |

### 2.3 Documentation

- `docs/00-pm/v2121-issue-response.prd.md` (PRD)
- `docs/01-plan/features/v2121-issue-response.master-plan.md` (Master Plan)
- `docs/adr/0012-sprint-stop-hook-output-enforcement.md` (ADR)
- `docs/04-report/features/v2121-issue-response.report.md` (본 보고서)
- CHANGELOG.md `[2.1.21]` 섹션

### 2.4 Tests (79 신규/확장 TC, 전체 PASS)

| 파일 | TC | 결과 |
|------|----|----|
| `test/unit/session-title.test.js` (확장) | 18 (+8 신규) | ✅ |
| `test/unit/sprint-executive-summary.test.js` (신규) | 28 | ✅ |
| `test/unit/sprint-skill-stop.test.js` (신규) | 17 (incl. TC-U1 unified-stop e2e) | ✅ |
| `test/contract/sprint-skill-handler-registration.test.js` (신규) | 5 | ✅ |
| `test/unit/sprint-lifecycle/advance-phase-transition-summary.test.js` (신규) | 11 | ✅ |

---

## 3. 구현 상세

### 3.1 Module 구현 순서 (ENH-292 sequential)

| Step | Feature | Issue | 책임 | 의존 |
|------|---------|-------|------|------|
| F1 | session-cache-map-refactor | #111 | flat record → sessions[sessionId] map + GC + migration | — |
| F2 | session-title-tag | #111 | sessionId 기반 stable tag 부착 | F1 |
| F3 | stop-hook-sessionid-threading | #111 | 4 emitter session_id threading | F2 |
| F4 | sprint-executive-summary | #113 | sprint-shape exec summary 모듈 | — |
| F5 | sprint-skill-stop-hook | #113 | Stop hook (run-export) | F4 |
| F6 | skill-handlers-registration | #113 | SKILL_HANDLERS 'sprint' | F5 |
| F7 | phase-transition-summary | #113 | advancePhase 출력 + handler wiring | F4 |
| F8 | sprint-status-watch-format | #113 | status/watch display 필드 | F4 |

### 3.2 핵심 아키텍처 결정

1. **F1 sessions map**: `session-ctx-fp.js` 검증 패턴 미러 (atomic write + inline GC stale 7d + LRU 200). 레거시 flat record `readCache()` 자동 마이그레이션.
2. **F2 tag 독립성**: session tag 는 순수 표시용 — dedup 비교(feature/phase/action/sessionId)와 직교. format `{tag}` 토큰 + 자동 append 이중 지원.
3. **F4 별도 shape**: Sprint(Mission/Result/matchRate/CSI/Invariant) ≠ PDCA(Problem/Solution/...). 순수 모듈.
4. **F5 run-export 패턴** (ADR 0012): bare-require-`{}` 패턴은 unified-stop `executeHandler` 의 `require()` 경유 시 no-op 라는 실측 발견 → `module.exports={run}` 채택으로 실제 dispatch 보장.
5. **F7 usecase 순수성**: caller-injected `deps.transitionSummaryBuilder` (#93 failureReporter DI 미러). usecase 에 fs write·lib/sprint import 없음 — handler 가 wiring.
6. **F8 display 첨부**: raw JSON 보존 + `display` 필드 추가 (per-feature 표 + gates 한 줄).

### 3.3 Cross-Issue 계보

- #111 ⊃ #77 (v2.1.6 Phase A 가 session 격리 미완 → Phase B 완결)
- #113 ⊃ #93 (v2.1.16 gate_fail human-readable success path 미해결 → 확장)

---

## 4. 검증 결과

| 검증 | 결과 | Evidence |
|------|------|----------|
| 신규/확장 TC | ✅ 92/92 PASS (6 test 파일) | session-title 18 / sprint-exec 28 / sprint-stop 20 / marker 10 / contract 5 / advance-phase 11 |
| 전체 unit 스위트 | ✅ 110 파일 회귀 0 (45 fail 전부 사전 결함, baseline 동일) | `node test/run-all.js` baseline 대조 |
| docs-code-sync | ✅ PASSED (2.1.21 전 surface 동기화) | `scripts/docs-code-sync.js` |
| check-guards | ✅ 22 guards 0 warning | clean architecture |
| check-deadcode | ✅ lib/sprint + active-skill-marker live 인식, 0 new dead | — |
| check-domain-purity | ✅ 18 files 0 forbidden import | — |
| bare-require guard 회귀 | ✅ 4 emitter require → `{}` (stdout 미발생) | v2112-deep-qa L2-004/006 |
| **실 claude -p dispatch (1차)** | ⚠️→✅ **1차 검증서 결함 발견**: detectActiveSkill→null, sprint-skill-stop 미발동(handled:false) | debug log `.claude/bkit-debug.log` |
| **실 claude -p dispatch (수정 후)** | ✅ active-skill 마커로 `activeSkill="sprint"` → `handled:true` + 마커 consume | debug log 재검증 |
| `claude plugin validate .` | ✅ Exit 0 | — |
| claude -p `--plugin-dir .` | ✅ F8 display 실 런타임 렌더 | headless 1턴 |
| unified-stop → sprint-skill-stop e2e | ✅ Exec Summary stdout + sessionTitle tag | TC-U1 + 실 repo 상태 dispatch |

---

## 5. 사용자 요구사항 충족 매트릭스

| 사용자 요구 | 적용 | Status |
|-------------|------|--------|
| GitHub 오픈 이슈 완벽 이해 + 코드 심층 분석 | #111/#113/#93/#77 정독 + file:line 실측 검증 | ✅ |
| /sprint master-plan 상세 작성 | 248-line master plan + 268-line PRD | ✅ |
| 타깃 v2.1.21 + 검증 후 릴리스 | 버전 전 surface bump + 종합 검증 | ✅ |
| main 기준 작업 브랜치 | `release/v2.1.21-issue-response` | ✅ |
| /control level 4 + L4 full-auto | setLevel(4) + sprint Trust L4 | ✅ |
| claude -p 동작 검증 | `--plugin-dir .` headless — **1차서 dispatch 결함 발견 → marker 수정 → 재검증 통과** | ✅ |
| 버전 숫자/로직 + 문서 동기화 전부 | 8 version surface + CHANGELOG + ADR + docs-code-sync PASS | ✅ |
| 8개국어 트리거·@docs 외 영어 | 코드/주석 영어, docs/ 한국어, trigger 키워드 보존 | ✅ |
| 꼼꼼·완벽, 부분완료 보고 금지 | 8/8 feature + 92 TC + 실 런타임 dispatch 결함 발견·수정·재검증 완주 | ✅ |

---

## 6. Issues / Lessons

### 6.1 Issues found (구현 중 실측 발견)

| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| 1 | High | bare-require-`{}` 패턴은 unified-stop `executeHandler` `require()` self-exec 경유 시 no-op (pdca-skill-stop 포함) | sprint 은 run-export 패턴(ADR 0012 D1)으로 회피 |
| 2 | **Critical** | **`detectActiveSkill()` 4경로 전멸** → 실 claude -p 에서 sprint-skill-stop **미발동(handled:false)**. CC skill_name 미제공 + getActiveSkill in-memory(cross-process 무용) + skill_post #57317 drop. run-export 만으론 부족(executeHandler 가 호출조차 안 됨) | **신규 `lib/core/active-skill-marker.js`**(ADR 0012 D5) — handler 기록 → unified-stop peek → handler consume. 실 claude -p 재검증 `handled:true` |
| 3 | High | PDCA 계열 skill Stop handler 도 동일 메커니즘 결함으로 production 미발동 추정 | CARRY-#113-1 (v2.1.22+) — run-export + marker 전환 후 검증 |
| 4 | Low | L1-016 (@version JSDoc) / CP-011 / 4 file-not-found 테스트 45건 사전 실패 | v2.1.20 baseline 동일 — 본 sprint 무관, scope 외 |

### 6.2 학습 (Lessons)

- **합성 payload 테스트의 함정** — 초기 TC-U1 은 `{skill_name:'sprint'}` 를 하드코딩해 통과했으나, CC 는 실제로 그 필드를 주지 않아 production 에선 dispatch 자체가 실패했다. **실 `claude -p --plugin-dir .` + debug log** 만이 이를 드러냈다 ([[feedback_thorough_qa]] — static/합성 검증 불충분 원칙의 강력한 사례).
- **외부 dogfooder 주장도 코드 실측 검증** — #113 의 "SKILL_HANDLERS 등록" 제안은 표면적으로 맞았으나, 그 아래 detectActiveSkill 전멸이라는 더 깊은 systemic 결함이 있었다.
- **DI 로 layer 순수성 보존** — #93 failureReporter 패턴이 F7 에 재사용 가능한 검증된 규율.
- **사용자 검증 압박의 가치** — "테스트 제대로 했냐"는 push 가 Critical dispatch 결함 발견을 촉발했다.

---

## 7. Carry items

| 항목 | Carry to | 사유 |
|------|----------|------|
| CARRY-#113-1 | v2.1.22+ | PDCA 계열 stop handler 의 unified-stop dispatch 경로 재검증 (bare-require no-op 영향 범위 확정 후 run-export 전환 결정) |
| 사전 테스트 45 fail | 별도 | L1-016 @version 누락 모듈 식별 + 4 file-not-found 러너 레지스트리 정리 (v2.1.20 사전 결함) |

---

## 8. Sign-off

| 검증 | 결과 | Evidence |
|------|------|----------|
| Master Plan 8 features | ✅ 8/8 구현 | §3.1 |
| 79 신규 TC | ✅ 전체 PASS | §2.4 |
| 회귀 0 | ✅ baseline 대조 | §4 |
| docs=code sync | ✅ 2.1.21 | §4 |
| 실 런타임 (claude -p) | ✅ | §4 |

**Sprint Status**: ✅ COMPLETE — v2.1.21 릴리스 준비 완료 (#111 + #113 close 대상)
