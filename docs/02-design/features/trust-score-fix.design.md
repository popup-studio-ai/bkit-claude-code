# trustScore 초기값 불일치 수정 설계서

> **Feature**: trust-score-fix
> **Date**: 2026-03-21
> **Phase**: Design
> **Plan Reference**: docs/01-plan/features/trust-score-fix.plan.md

---

## Executive Summary

| 항목 | 내용 |
|------|------|
| **Feature** | trustScore 초기값 불일치 수정 |
| **수정 파일** | 소스 3개, 테스트 4개 = 총 7개 파일 |
| **변경 라인** | ~30줄 |
| **위험도** | LOW — 로직 변경 없음, 초기값만 통일 |
| **계산된 초기값** | **40** (rollbackFreq:15 + destructiveBlock:15 + userOverride:10 = 40) |

### Value Delivered (4-Perspective)

| 관점 | 내용 |
|------|------|
| **Problem** | trustScore 초기값이 3곳에서 각각 0, 50, 50으로 불일치 |
| **Solution** | trust-engine의 calculateScore()를 Single Source of Truth로 통일 |
| **Function/UX Effect** | 초기 trustScore=40 (컴포넌트 가중합). L2 Semi-Auto 기본 레벨과 정합 |
| **Core Value** | Single Source of Truth, 코드-데이터 일관성 |

---

## 1. 초기값 계산 근거

### 1.1 컴포넌트 초기값 → 가중합 = 40

| 컴포넌트 | weight | 초기 value | 기여분 | 이유 |
|----------|--------|-----------|--------|------|
| pdcaCompletionRate | 0.25 | 0 | 0 | PDCA 완료 이력 없음 |
| gatePassRate | 0.20 | 0 | 0 | 게이트 통과 이력 없음 |
| rollbackFrequency | 0.15 | 100 | 15 | 롤백 없음 = 좋은 상태 |
| destructiveBlockRate | 0.15 | 100 | 15 | 파괴적 작업 차단 없음 = 안전 |
| iterationEfficiency | 0.15 | 0 | 0 | 반복 효율 이력 없음 |
| userOverrideRate | 0.10 | 100 | 10 | 사용자 오버라이드 없음 = 좋은 상태 |
| **합계** | **1.00** | - | **40** | - |

### 1.2 trustScore=40의 의미

- L2 Semi-Auto 임계값(40) 달성 → **기본 레벨 L2와 정합**
- L3 Auto 임계값(65) 미달 → **과도한 자동화 방지**
- "이력은 없지만 안전한 상태"를 정확히 반영

---

## 2. 변경 상세 설계

### C-1: lib/control/trust-engine.js (line 70)

**Before:**
```javascript
function createDefaultProfile() {
  return {
    trustScore: 0,  // ← 하드코딩
```

**After:**
```javascript
function createDefaultProfile() {
  const profile = {
    trustScore: 0,  // placeholder, calculated below
    // ... components ...
  };
  // Sync trustScore with component weighted sum
  profile.trustScore = calculateScore(profile);
  return profile;
}
```

**주의**: `calculateScore()`는 `createDefaultProfile()` 위에 정의되어야 함. 현재 line 145에 정의되어 있으므로 함수 호이스팅 확인 필요 → `function` 선언문이므로 호이스팅 됨. 문제 없음.

### C-2: lib/control/automation-controller.js (line 157)

**Before:**
```javascript
function _createDefaultRuntimeState() {
  return {
    // ...
    trustScore: 50,  // ← 하드코딩
```

**After:**
```javascript
function _createDefaultRuntimeState() {
  // Read from trust-engine (Single Source of Truth)
  let trustScore = 40; // fallback
  try {
    trustScore = require('./trust-engine').getScore();
  } catch (_) { /* trust-engine unavailable, use fallback */ }
  return {
    // ...
    trustScore,
```

### C-3: lib/pdca/status.js (line 154)

**Before:**
```javascript
v3.automation = v3.automation || {
  globalLevel: 2,
  trustScore: 50,  // ← 하드코딩
```

**After:**
```javascript
let _trustScore = 40; // fallback
try { _trustScore = require('../control/trust-engine').getScore(); } catch (_) {}
v3.automation = v3.automation || {
  globalLevel: 2,
  trustScore: _trustScore,
```

---

## 3. 테스트 변경 상세

### T-1: test/unit/trust-engine.test.js

| TC ID | Line | Before | After |
|-------|------|--------|-------|
| TE-001 | 47 | `trustScore === 0` | `trustScore === 40` |
| TE-025 | 195 | `defaultLoaded.trustScore === 0` | `defaultLoaded.trustScore === 40` |

### T-2: test/integration/control-pipeline.test.js

| TC ID | Line | Before | After |
|-------|------|--------|-------|
| CP-011 | 157 | `trustScore === 0` | `trustScore === 40` |

### T-3: test/philosophy/automation-first-v2.test.js

| TC ID | Line | Before | After |
|-------|------|--------|-------|
| AF-009 | 117-120 | `trustScore === 50` | `trustScore === 40` |
| | | description 수정 | `'trustScore starts at 40 (calculated from components)'` |

### T-4: test/philosophy/security-by-default-v2.test.js

| TC ID | Line | Before | After |
|-------|------|--------|-------|
| SB-011 | 125-128 | `trustScore === 50` | `trustScore === 40` |
| SB-012 | 132-134 | `Trust score 50 < L3` | `Trust score 40 < L3` (여전히 통과) |
| SB-013 | 137-140 | `Trust score 50 >= L2` | `Trust score 40 >= L2` (여전히 통과, 40 ≥ 40) |

**SB-012, SB-013**: 로직 자체는 변경 불필요 — `40 < 65` (L3 임계값), `40 >= 40` (L2 임계값) 모두 통과. description의 하드코딩 문자열만 수정.

---

## 4. 미변경 파일 (영향 없음)

| 파일 | 이유 |
|------|------|
| `test/security/trust-score-safety.test.js` | trustScore를 명시적으로 세팅 후 테스트, 초기값 미참조 |
| `test/controllable-ai/progressive-trust.test.js` | trustScore를 명시적으로 세팅 후 테스트, 초기값 미참조 |
| `test/ux/control-panel-ux.test.js` | 렌더링 입력값으로 직접 세팅, 초기값 미참조 |
| `test/unit/automation-controller.test.js` | trustScore 직접 검증 없음 |

---

## 5. 순환 의존 분석

```
automation-controller.js → (lazy) trust-engine.js → core/platform.js
                        ↘ core/index.js
```

- `trust-engine.js`는 `automation-controller.js`를 import하지 않음 → **순환 없음**
- `try/catch` lazy require로 로드 실패 시 fallback 값 사용 → **안전**

---

## 6. 검증 체크리스트

- [ ] `createDefaultProfile().trustScore === 40`
- [ ] `calculateScore(createDefaultProfile()) === 40`
- [ ] `_createDefaultRuntimeState().trustScore === 40`
- [ ] `status.js` migration 시 trustScore === 40
- [ ] 134개 기존 테스트 PASS (회귀 0)
- [ ] `claude --plugin-dir . -p` SessionStart 정상
- [ ] `claude --plugin-dir . -p` /control 에서 trustScore=40 표시
