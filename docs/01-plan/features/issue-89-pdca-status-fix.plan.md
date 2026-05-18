# Issue #89: .pdca-status.json 무한 오염 fix (v2.1.15) Plan

> **Status**: ✅ Plan Complete (분석 후 즉시 구현 단계 진입)
> **Issue**: [#89](https://github.com/popup-studio-ai/bkit-claude-code/issues/89) by @doing27 (2026-05-15)
> **Branch**: `feature/v2115-issue-89-pdca-status-fix`
> **Version**: v2.1.14 → **v2.1.15** (patch fix)
> **Date**: 2026-05-18

---

## 1. 문제 정의

### 1.1 사용자 보고 (Issue #89)

`PreToolUse(Write|Edit)` 훅 (`scripts/pre-write.js`)이 모든 source 파일 편집마다 `.pdca-status.json`에 "feature" 엔트리를 등록함. 그런데:

1. **`extractFeature` 오추출** (`lib/core/file.js:109`):
   - 정규식 `services/([^/]+)`가 `app/services/broadcast_service.py` → `broadcast_service.py` (파일명)을 feature로 반환
   - fallback이 `v1`, `cms`, `database`, `tenants`, `versions` 등 일반 디렉토리명까지 feature로 등록
2. **`updatePdcaStatus` 검증 부재** (`lib/pdca/status.js:213`):
   - 검증 게이트 없이 무조건 `features` / `activeFeatures` / `history`에 누적
   - 매 편집 = 1 history line

**실측 사례**: `.pdca-status.json` 294KB, features 147중 **138 garbage**, history 1669중 **1661 garbage** (실제 `/pdca` 등록 cycle 9개뿐).

### 1.2 Phase 1 코드베이스 심층 분석 추가 발견

본 plan 작성 전 코드베이스를 v2.1.14 main 기준으로 심층 분석한 결과 **이슈 본문 외 추가 버그 3건** 발견:

**추가 버그 #1**: `scripts/pre-write.js:98-117` v2.1.7 "Issue #79 P4 phantom 차단" fix는 **실제로 작동하지 않음**.
- 코드: `const activeFeature = currentStatus?.currentFeature;`
- 그러나 v2/v3 schema에서는 **`currentFeature` 필드가 존재하지 않음** (오직 `primaryFeature`만 존재, `status-migration.js:31,74`)
- 결과: `activeFeature`는 항상 `undefined` → `activeFeature && activeFeature === feature` → `false` → **모든 호출이 `else` 분기로 빠져 phantom skipped 처리됨**
- 본 repo `.bkit/state/pdca-status.json`(v3.0)에서 `currentFeature: undefined`, `primaryFeature: 'bkit-v209-cc-v2194-compatibility'` 확인됨
- 부작용: pre-write에서 `updatePdcaStatus` 호출 자체가 거의 발생 안 함 (false-negative side effect). 그러나 다른 16개 호출처 (iterator-stop / plan-plus-stop / pdca-skill-stop / gap-detector-stop / skill-post / unified-stop / lib/pdca/*)는 직접 호출로 우회 → garbage 누적

**추가 버그 #2**: `lib/pdca/status-core.js:320` `extractFeatureFromContext` 함수가 `extractFeature`와 거의 동일한 패턴 매칭 코드를 **중복 복사**해서 들고 있음. DRY 위반 + 동일 버그.

**추가 버그 #3**: `lib/pdca/status-core.js:210-215` `updatePdcaStatus`의 history append에는 **limit/dedup 없음** (`addPdcaHistory`는 100 limit 있으나 `updatePdcaStatus` 직접 history.push 부분에는 없음).

### 1.3 호출 surface 매핑

**`extractFeature` 호출자 (3)**:
- `scripts/pre-write.js`
- `lib/core/index.js`
- `lib/core/file.js` (정의)

**`updatePdcaStatus` 호출자 (16)** (모두 검증 게이트 없는 직접 진입):
- `scripts/pre-write.js`
- `scripts/iterator-stop.js`
- `scripts/plan-plus-stop.js`
- `scripts/pdca-skill-stop.js`
- `scripts/gap-detector-stop.js`
- `scripts/skill-post.js`
- `scripts/unified-stop.js`
- `lib/pdca/automation.js`
- `lib/pdca/state-machine.js`
- `lib/pdca/status-core.js` (정의)
- `lib/pdca/batch-orchestrator.js`
- `lib/pdca/full-auto-do.js`
- `lib/pdca/index.js`
- `lib/pdca/status.js` (facade)
- `lib/pdca/lifecycle.js`
- `lib/task/creator.js`

**기존 단위 테스트**: **0건** (tests/qa/bkit-deep-system.test.js만 간접 참조).

---

## 2. 우선순위 및 영향

| 항목 | 값 |
|------|----|
| 우선순위 | **P0** (사용자 측에서 .pdca-status.json 무한 비대화로 IO + cache 부하 → 일상 사용 저하) |
| Severity | HIGH (사용자 환경 disk 부담 + 잘못된 PDCA state 표시 → trust 손상) |
| 영향 사용자 | bkit v1.5.0~v2.1.14 모든 사용자 (Issue #79 P4 부분 fix 무효 입증) |
| Breaking 가능성 | **없음** (게이트는 보수적으로 통과 허용, 기존 cycle 영향 0) |
| 코드 변경 라인 | 예상 ~120 라인 (5 파일) + 신규 테스트 ~250 라인 (3 파일) |
| 작업량 | Medium (1 cycle / 1-2 hours) |

---

## 3. 목표 (Success Criteria)

1. **SC-01**: `extractFeature('app/services/broadcast_service.py')` → `''` (파일명 반환 안 함)
2. **SC-02**: `extractFeature('app/cms/v1/users.py')` → `''` (`v1` / `cms` 같은 generic 디렉토리 반환 안 함)
3. **SC-03**: `extractFeature('features/auth/login.ts')` → `'auth'` (정당한 feature 명 반환)
4. **SC-04**: `updatePdcaStatus('phantom-feature', 'do', {})` → silent no-op (plan/design 문서 없으면 등록 안 함)
5. **SC-05**: `updatePdcaStatus('real-feature', 'do', {})` (`docs/01-plan/features/real-feature.plan.md` 존재) → 정상 등록
6. **SC-06**: `scripts/pre-write.js`의 `primaryFeature` 필드 정정 → phantom 차단 logic이 실제로 작동
7. **SC-07**: `updatePdcaStatus`의 history append → limit 100 + consecutive 'updated' dedup 적용
8. **SC-08**: `extractFeatureFromContext` → `extractFeature` 위임으로 DRY 확보
9. **SC-09**: 단위 테스트 추가 (≥20 TC) 모두 PASS
10. **SC-10**: 본 fix 적용 후 본 repo 동작에 회귀 0건 (기존 16개 호출처 모두 기존 의도된 동작 유지)

---

## 4. 비목표 (Non-goals)

- `.pdca-status.json` 기존 garbage 일괄 정리 (별도 migration 명령으로 사용자 자율 처리, 본 PR 외)
- v3 schema migration 변경
- PDCA workflow 자체 동작 변경

---

## 5. 일정 및 산출물

| Phase | 작업 | 산출물 | 상태 |
|-------|------|--------|------|
| Phase 1 | 코드베이스 심층 분석 | 본 plan 문서 내 §1.2-§1.3 | ✅ Done |
| Phase 2 | 설계 (3-Layer fix) | `docs/02-design/features/issue-89-pdca-status-fix.design.md` | 🔄 진행 중 |
| Phase 3 | 구현 + 단위 테스트 | `lib/core/file.js` + `lib/pdca/status-core.js` + `scripts/pre-write.js` + `tests/unit/file-extract-feature.test.js` + `tests/unit/pdca-status-gating.test.js` | 🔲 대기 |
| Phase 4 | 버전 동기화 + CHANGELOG | `bkit.config.json` / `plugin.json` / `marketplace.json` / `hooks.json` / `README.md` (v2.1.14 → v2.1.15) + `CHANGELOG.md` v2.1.15 entry | 🔲 대기 |
| Phase 5 | 보고서 + Commit + PR | `docs/04-report/features/issue-89-pdca-status-fix.report.md` + commit + push + PR | 🔲 대기 |

---

## 6. 위험 및 완화

| 위험 | 가능성 | 영향 | 완화 |
|------|--------|------|------|
| 게이트 추가로 정당한 feature 등록 누락 | Low | Medium | 기존 16개 호출처 모두 `findPlanDoc(feature) \|\| findDesignDoc(feature)` 통과 검증 (PDCA lifecycle은 plan 문서 작성 후 진입) |
| extractFeature 변경으로 기존 동작 회귀 | Low | Low | 단위 테스트 ≥20 TC + 본 repo 통합 검증 |
| history dedup으로 정당한 다중 업데이트 누락 | Very Low | Low | consecutive dedup만 적용 (다른 phase/action은 정상 기록) |
| version bump 위치 누락 | Low | Low | `BKIT_VERSION` grep 후 5+ 위치 일괄 sync |

---

## 7. 관련 자료

- [Issue #89](https://github.com/popup-studio-ai/bkit-claude-code/issues/89)
- v2.1.7 부분 fix commit (Issue #79 P4): `scripts/pre-write.js:98-117`
- Design doc: `docs/02-design/features/issue-89-pdca-status-fix.design.md` (Phase 2)
- Report: `docs/04-report/features/issue-89-pdca-status-fix.report.md` (Phase 5)
