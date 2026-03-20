# trustScore 초기값 불일치 수정 계획서

> **Feature**: trust-score-fix
> **Date**: 2026-03-21
> **Phase**: Plan

---

## Executive Summary

| 항목 | 내용 |
|------|------|
| **Feature** | trustScore 초기값 불일치 수정 |
| **Plan Date** | 2026-03-21 |
| **예상 범위** | 3개 파일 수정, 3개 테스트 파일 수정 |
| **심각도** | LOW — 기능 장애 없음, 데이터 불일치 |

### Value Delivered (4-Perspective)

| 관점 | 내용 |
|------|------|
| **Problem** | trust-engine의 초기 trustScore(0)와 automation-controller의 초기 trustScore(50)가 불일치. createDefaultProfile()의 trustScore=0이 calculateScore() 결과(40)와도 불일치 |
| **Solution** | createDefaultProfile()에서 trustScore를 컴포넌트 가중합(calculateScore)으로 동기화. automation-controller는 trust-engine에서 읽어오도록 수정 |
| **Function/UX Effect** | 모든 trustScore 참조가 단일 소스(trust-engine)에서 파생. 초기 상태 일관성 확보 |
| **Core Value** | Single Source of Truth 원칙 준수. 코드 신뢰성 향상 |

---

## 1. 문제 분석

### 1.1 현재 상태

| 모듈 | 파일 | 초기 trustScore | 비고 |
|------|------|-----------------|------|
| trust-engine | `lib/control/trust-engine.js:70` | `0` | `createDefaultProfile().trustScore` |
| trust-engine (계산) | `calculateScore()` | `40` | 컴포넌트 가중합 (rollbackFrequency:100×0.15 + destructiveBlockRate:100×0.15 + userOverrideRate:100×0.10 = 40) |
| automation-controller | `lib/control/automation-controller.js:157` | `50` | `_createDefaultRuntimeState().trustScore` |

### 1.2 근본 원인

1. `createDefaultProfile()`이 `trustScore: 0`으로 하드코딩하지만, 초기 컴포넌트 값(rollbackFrequency=100, destructiveBlockRate=100, userOverrideRate=100)의 가중합은 **40**
2. `automation-controller._createDefaultRuntimeState()`가 `trustScore: 50`으로 독립 하드코딩 — trust-engine과 무관한 값
3. 두 모듈이 각각 독립적으로 trustScore를 관리하여 Single Source of Truth 위반

### 1.3 영향 범위

- **기능 영향**: 없음 (trustScore 필드가 런타임 로직에 사용되지 않음)
- **표시 영향**: 초기 대시보드/상태에서 혼동 가능성
- **테스트 영향**: 테스트가 현재 하드코딩 값(0, 50)을 기대

---

## 2. 수정 계획

### 2.1 변경 사항

| # | 파일 | 변경 내용 |
|---|------|----------|
| C-1 | `lib/control/trust-engine.js` | `createDefaultProfile()`: trustScore를 컴포넌트 가중합으로 계산 |
| C-2 | `lib/control/automation-controller.js` | `_createDefaultRuntimeState()`: trust-engine에서 trustScore 읽기 |
| C-3 | `test/unit/trust-engine.test.js` | TE-001, TE-025: 초기 trustScore 기대값 0→40 |
| C-4 | `test/unit/automation-controller.test.js` | trustScore 관련 기대값 수정 (있을 경우) |
| C-5 | `test/security/trust-score-safety.test.js` | 영향 확인 (변경 불필요 예상) |
| C-6 | `test/controllable-ai/progressive-trust.test.js` | 영향 확인 |

### 2.2 설계 원칙

1. **Single Source of Truth**: trustScore는 trust-engine의 `calculateScore()`가 유일한 계산 소스
2. **Lazy Dependency**: automation-controller → trust-engine 참조는 lazy require로 순환 의존 방지
3. **하위 호환성**: `resetScore(initialScore=50)` 기본 인자는 유지 (명시적 리셋 용도)

---

## 3. 검증 계획

- [ ] 134개 기존 테스트 전체 PASS (회귀 없음)
- [ ] `claude --plugin-dir . -p` E2E 검증
- [ ] trust-engine createDefaultProfile().trustScore === calculateScore(createDefaultProfile())
- [ ] automation-controller getRuntimeState().trustScore === trust-engine.getScore()
