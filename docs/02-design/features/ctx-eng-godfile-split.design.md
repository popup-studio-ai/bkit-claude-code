# S3a — God-File Split 설계서

> **Sprint**: `ctx-eng-godfile-split` (S3a) · **Trust**: L4 · **ENH**: ENH-343~348
> **Date**: 2026-06-02 · **선행**: plan + 4 god-file 구조 분석(본 세션)

---

## 1. 설계 원칙

1. **Behavior-preserving extraction**: 함수를 새 모듈로 **이동**(로직 1바이트 불변) + 원본은 require해 재노출(re-export). 공개 API(module.exports) 시그니처·키 100% 보존.
2. **lazy-require 패턴 보존**: `getCore()/getStatus()/getInfra()` 등 지연로딩 싱글톤 구조 유지(순환참조 회피 의도).
3. **subdir 증가 0**: 분할 모듈은 기존 디렉터리(lib/pdca/, scripts/) 또는 해당 파일명 디렉터리에 배치. lib subdir count ≤22 유지(scripts/ 하위는 lib subdir 무관).
4. **매 분할 후 검증**: contract L1+L4(226) + check-deadcode + 전 test comm(회귀 0) + LOC≤700. 통과해야 commit.
5. **1개씩 체크포인트**: 반파 상태 절대 미커밋.

## 2. 분할 manifest (모듈 분해)

### ENH-346 — `scripts/unified-stop.js` (751 → ≤700) [첫 실행, 최저위험]
- **추출**: 10개 lazy-require dep getter(`getStateMachine`/`getCheckpointManager`/`getAuditLogger`/`getGateManager`/`getMetricsCollector`/`getWorkflowEngine`/`getCircuitBreaker`/`getTrustEngine`/`getExplanationGenerator`/`getDecisionTracer`, ~line 24-78) → 신규 `scripts/lib/unified-stop-deps.js`(또는 lib/core/). lazy 캐시 변수 포함 이동.
- **결과 예상**: ~55줄 감소 → unified-stop.js ~696 (≤700). 추가 모듈 +1.

### ENH-345 — `lib/pdca/automation.js` (770 → ≤600) [2번째]
- **추출**: question/prompt 빌더 군 — `formatAskUserQuestion`(259)·`buildNextActionQuestion`(310-555, ~245줄)·`emitUserPrompt`(229) → 신규 `lib/pdca/automation-questions.js`. automation.js는 require해 re-export.
- **결과 예상**: ~245+줄 감소 → automation.js ~520. 추가 모듈 +1.

### ENH-344 — `lib/pdca/state-machine.js` (985 → ≤500) [3번째]
- **추출**: STATE_TRANSITIONS 정의 테이블(line ~38-621, ~580줄 추정 — transition 상수/맵) → 신규 `lib/pdca/state-transitions.js`. 로직 함수(findTransition/transition/canTransition 등 622+)는 state-machine.js 유지, 테이블을 require.
- **결과 예상**: ~580줄 감소 → state-machine.js ~400. 추가 모듈 +1. (구현 시 정확한 테이블 경계 확인 필수.)

### ENH-343 — `scripts/sprint-handler.js` (1509 → ≤700) [마지막, 최고위험]
- **추출(그룹별)**:
  - `scripts/lib/sprint-handler-trust.js`: normalizeTrustLevel/isDowngrade/severity/loadTrustScore/resolveActor (79-167).
  - `scripts/lib/sprint-handler-dogfood.js`: isValidReleaseVersion/resolveBkitVersion/resolveBkitCommit/autoDeriveDogfoodContext/handleDogfood (658-812).
  - `scripts/lib/sprint-handler-gates.js`: buildFailureReporterForHandler/runPhaseGates/persistAndAudit (963, 1331-1404).
  - sprint-handler.js: dispatch(handleSprintAction) + 나머지 handler 유지, 추출분 require.
- **주의**: handler들이 infra/deps/서로 호출 → 추출 모듈은 순수 함수로 deps 주입받는 형태로 이동(클로저 미사용 확인). 각 추출 후 즉시 검증.
- **결과 예상**: ~400+줄 감소 → ≤700. 추가 모듈 +3.

**모듈 순증 예상**: +6 (≤+10 OK). subdir: scripts/lib/ 신설(lib subdir 무관, 22 유지). S3b에서 추가 통합 가능.

## 3. Test Plan (각 분할 공통)
| Level | 항목 | 방법 |
|-------|------|------|
| L1 | 분할 모듈 + 원본 syntax | `node --check` |
| L1 | 원본 module.exports 키 불변 | require 후 키 비교 |
| L4 contract | 226 assertion 보존 | contract-test-run L1+L4 (v2.1.9+v2.1.16) |
| L3 회귀 | 전 test comm 0 신규 fail | tests/qa+tests/contract 비교 |
| invariant | 해당 god-file ≤700, subdir ≤22 | wc -l, ls -d |

## 4. API Contract (M4)
모든 분할은 **공개 module.exports 불변**(함수 이동 + re-export). 시그니처·반환 불변. **M4=100**.

## 5. Self-Assessment (M8)
Context Anchor ✅ / 4-file 모듈 manifest ✅ / behavior-preserving 전략 ✅ / 매-분할 검증 plan ✅ / simplicity invariant gate ✅ / 체크포인트 안전성 ✅. **M8=90**.

> **Status**: Design 완료 — do phase. 첫 분할: unified-stop.js.
