# Issue #89: .pdca-status.json 무한 오염 fix (v2.1.15) Design

> **Status**: ✅ Design Complete (즉시 구현 진입)
> **Plan Ref**: `docs/01-plan/features/issue-89-pdca-status-fix.plan.md`
> **Branch**: `feature/v2115-issue-89-pdca-status-fix`
> **Date**: 2026-05-18

---

## 1. 설계 개요 (6-Layer Defense)

본 fix는 동일 root cause("검증 게이트 없이 feature 자동 등록")에 대해 **6개 독립 layer**를 적용한다. 각 layer는 단독으로도 garbage 누적을 방어하지만, 함께 적용 시 **defense-in-depth** 확보.

```
편집 이벤트
   ↓
[L1] extractFeature        → 패턴 매칭 + 파일/디렉토리 검증 + genericNames 확장
   ↓ (정당한 feature 후보)
[L2] extractFeatureFromContext → L1 위임 (DRY)
   ↓
[L4] scripts/pre-write.js  → primaryFeature 필드 정정 + 게이트
   ↓
[L3] updatePdcaStatus      → plan/design 문서 존재 게이트 (default ON)
   ↓
[L5] history limit + dedup → consecutive updated dedup + 100 ring buffer
   ↓
[L6] 단위 테스트            → 회귀 방지 + 6 layer 모두 cover
```

---

## 2. Layer 1: `extractFeature` 강화

### 2.1 파일: `lib/core/file.js`

### 2.2 변경 사항

**A. genericNames 확장** (line 114-118)

```diff
const genericNames = [
  'src', 'lib', 'app', 'components', 'pages', 'utils', 'hooks',
  'types', 'internal', 'cmd', 'pkg', 'models', 'views',
- 'routers', 'controllers', 'services', 'common', 'shared'
+ 'routers', 'controllers', 'services', 'common', 'shared',
+ // v2.1.15 (Issue #89): 일반 백엔드/프론트 레이아웃 디렉토리
+ 'api', 'web', 'mobile', 'client', 'server', 'backend', 'frontend',
+ 'admin', 'auth', 'cms', 'database', 'db', 'config', 'core',
+ 'helpers', 'middleware', 'plugins', 'scripts', 'styles', 'static',
+ 'public', 'assets', 'tests', 'test', 'spec', 'specs', 'docs',
+ 'tenants', 'versions', 'tmp', 'temp', 'audit', 'dashboard',
+ // 버전 디렉토리 (v1, v2 ... v9)
+ 'v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9',
+ // Next.js / 라우트 그룹
+ '(dashboard)', '(auth)', '(public)', '(admin)', '(api)'
];
```

**B. 패턴 매칭 시 캡처값이 파일이 아닌 디렉토리인지 검증** (line 121-127)

```diff
// Try configured feature patterns
for (const pattern of featurePatterns) {
  const regex = new RegExp(`${pattern}/([^/]+)`);
  const match = filePath.match(regex);
- if (match && match[1] && !genericNames.includes(match[1])) {
-   return match[1];
- }
+ if (match && match[1]) {
+   const captured = match[1];
+   // v2.1.15 (Issue #89): 파일명 오추출 방지 — 확장자 있으면 skip
+   if (path.extname(captured)) continue;
+   // genericNames 체크
+   if (genericNames.includes(captured)) continue;
+   return captured;
+ }
}
```

**C. Fallback 옵션화 (default OFF)** (line 129-135)

```diff
+ // v2.1.15 (Issue #89): fallback은 explicit opt-in (default OFF)
+ // 기존 코드는 모두 default behavior(=fallback OFF)를 받음.
+ // 옛 동작이 필요한 호출자는 extractFeature(path, { allowFallback: true }) 명시.
- // Fallback: extract from parent directory
- const parts = filePath.split(/[/\\]/).filter(Boolean);
- for (let i = parts.length - 2; i >= 0; i--) {
-   if (!genericNames.includes(parts[i])) {
-     return parts[i];
-   }
- }
+ if (opts.allowFallback) {
+   const parts = filePath.split(/[/\\]/).filter(Boolean);
+   for (let i = parts.length - 2; i >= 0; i--) {
+     if (genericNames.includes(parts[i])) continue;
+     // 파일 확장자 가진 항목 skip
+     if (path.extname(parts[i])) continue;
+     return parts[i];
+   }
+ }
```

**D. 함수 시그니처 변경** (backward-compatible)

```diff
- function extractFeature(filePath) {
+ function extractFeature(filePath, opts = {}) {
```

**기존 호출자**는 두 번째 인자 없이 호출 → `opts = {}` → `allowFallback`이 falsy → 새 default 동작 (fallback OFF).

### 2.3 영향 분석 (실측 smoke test 결과 반영)

| 시나리오 | 변경 전 | 변경 후 | 평가 |
|----------|---------|---------|------|
| `app/services/broadcast_service.py` | `'broadcast_service.py'` | `''` | ✅ 파일명 오추출 차단 |
| `app/services/auth/login.py` | `'auth'` | `''` (auth ∈ GENERIC) | ✅ Generic 차단 (L3 게이트 안전망 — 명시 등록 시 동작) |
| `features/auth/login.ts` | `'auth'` | `''` (auth ∈ GENERIC) | ✅ Generic 차단 |
| `apps/cms/v1/users.py` (fallback OFF) | `'cms'` (v1 generic) | `''` | ✅ Generic 차단 |
| `apps/dashboard/page.tsx` (fallback OFF) | `'dashboard'` | `''` | ✅ Generic 차단 |
| `packages/auth/index.ts` | `'auth'` | `''` (auth ∈ GENERIC) | ✅ Generic 차단 |
| `domains/billing/service.py` | `'billing'` | `'billing'` | ✅ 정당 유지 (`billing` ∉ GENERIC) |
| `features/onboarding/page.tsx` | `'onboarding'` | `'onboarding'` | ✅ 정당 유지 |
| `packages/email-notifications/index.ts` | `'email-notifications'` | `'email-notifications'` | ✅ 정당 유지 |
| `random/path/foo.py` (default OFF) | `'random'` (fallback) | `''` | ✅ Default fallback OFF |
| `random/path/foo.py` (`{allowFallback: true}`) | `'random'` | `'path'` (random ∉ GENERIC, path는 첫 valid) | ✅ Opt-in fallback 동작 |

### 2.4 보수적 GENERIC_NAMES 정책 (False-positive vs False-negative trade-off)

`auth` / `cms` / `dashboard` 같은 흔한 디렉토리 이름은 **차단** (false-positive 우선). 정당한 PDCA feature로 사용 시:

1. 사용자가 `/pdca plan auth` 명시 실행 → `docs/01-plan/features/auth.plan.md` 생성 + `.bkit/state/pdca-status.json:primaryFeature = 'auth'` 설정
2. `auth` 편집 시 `extractFeature`는 `''` 반환하지만 **`scripts/pre-write.js`의 phantom 차단 로직이 fallback 진입 안 함** — 즉 자동 phase update 부재
3. 사용자는 명시적 `/pdca do auth` 같은 PDCA 명령으로 phase 진행

이 trade-off는 **자동 등록 위험성 > 자동 update 편의성**으로 판단 (Issue #89 사용자 사례 294KB garbage 입증).

---

## 3. Layer 2: `extractFeatureFromContext` DRY

### 3.1 파일: `lib/pdca/status-core.js:320`

### 3.2 변경 사항

```diff
function extractFeatureFromContext(sources = {}) {
  if (sources.feature) return sources.feature;

  if (sources.filePath) {
-   const { getConfig } = getCore();
-   const featurePatterns = getConfig('featurePatterns', [
-     'features', 'modules', 'packages', 'domains',
-   ]);
-   for (const pattern of featurePatterns) {
-     const regex = new RegExp(`${pattern}/([^/]+)`);
-     const match = sources.filePath.match(regex);
-     if (match && match[1]) return match[1];
-   }
+   // v2.1.15 (Issue #89): extractFeature로 위임 (DRY + 동일 버그 fix 공유)
+   const { extractFeature } = require('../core/file');
+   const extracted = extractFeature(sources.filePath);
+   if (extracted) return extracted;
  }

  const status = getPdcaStatusFull();
  return status?.primaryFeature || '';
}
```

---

## 4. Layer 3: `updatePdcaStatus` 검증 게이트

### 4.1 파일: `lib/pdca/status-core.js:164`

### 4.2 변경 사항

**A. 새 옵션 인자 추가**

```diff
- function updatePdcaStatus(feature, phase, data = {}) {
+ /**
+  * v2.1.15 (Issue #89): opts.requireDocs (default true) — feature가 plan/design 문서를
+  * 가지지 않으면 silent no-op. 기존 호출자는 모두 default behavior를 받음.
+  * 의도적으로 우회 필요 시 opts.requireDocs=false 명시.
+  */
+ function updatePdcaStatus(feature, phase, data = {}, opts = {}) {
+   const requireDocs = opts.requireDocs !== false; // default true
+
+   // Empty/invalid feature는 즉시 거부
+   if (!feature || typeof feature !== 'string') {
+     const { debugLog } = getCore();
+     debugLog('PDCA', 'updatePdcaStatus skipped — invalid feature', { feature });
+     return;
+   }
+
+   // Plan/Design 문서 존재 게이트
+   if (requireDocs) {
+     try {
+       const { findPlanDoc, findDesignDoc } = require('./phase');
+       const hasPlan = !!findPlanDoc(feature);
+       const hasDesign = !!findDesignDoc(feature);
+       if (!hasPlan && !hasDesign) {
+         const { debugLog } = getCore();
+         debugLog('PDCA', 'updatePdcaStatus skipped — no plan/design doc', { feature, phase });
+         return;
+       }
+     } catch (e) {
+       // findPlanDoc/findDesignDoc 실패 시 보수적으로 통과 (false-positive 방지)
+       const { debugLog } = getCore();
+       debugLog('PDCA', 'doc check failed, proceeding', { error: e.message });
+     }
+   }
+
    const { debugLog } = getCore();
    ...
```

**B. 기존 16개 호출처 영향**

모두 default behavior(`requireDocs: true`)를 받음. PDCA workflow는 `/pdca plan {feature}` 단계에서 plan 문서 작성 → 이후 phase에서 `updatePdcaStatus` 호출 시 게이트 통과.

**예외**: 만약 plan 문서 작성 *전*에 `updatePdcaStatus`가 호출되는 호출처가 있다면 `opts.requireDocs = false`로 명시 필요. 확인 결과 모든 호출처는 plan 작성 이후 진입 (lifecycle order 보장).

---

## 5. Layer 4: `scripts/pre-write.js` schema 정정

### 5.1 파일: `scripts/pre-write.js:98-117`

### 5.2 변경 사항

```diff
// Stage 2: PDCA document check + phantom feature guard.
function runPdcaDocCheck(ctx) {
  const out = { feature: '', designDoc: '', planDoc: '' };
  if (!isSourceFile(ctx.filePath)) return out;
  const feature = extractFeature(ctx.filePath);
  if (!feature) return out;

  out.feature = feature;
  out.designDoc = findDesignDoc(feature);
  out.planDoc = findPlanDoc(feature);

- // v2.1.7: Only update PDCA status if feature matches active PDCA feature (Issue #79 P4).
+ // v2.1.7 (Issue #79 P4) + v2.1.15 (Issue #89): primaryFeature 정정 — currentFeature는
+ // v2/v3 schema에 존재하지 않는 필드 (status-migration.js:31,74에서 normalize됨).
  try {
    const currentStatus = getPdcaStatusFull();
-   const activeFeature = currentStatus?.currentFeature;
+   const activeFeature = currentStatus?.primaryFeature;
    if (activeFeature && activeFeature === feature) {
-     updatePdcaStatus(feature, 'do', { lastFile: ctx.filePath });
+     // L3 게이트가 추가 보호 (plan/design 문서 부재 시 silent no-op)
+     updatePdcaStatus(feature, 'do', { lastFile: ctx.filePath });
      debugLog('PreToolUse', 'PDCA status updated', { feature, phase: 'do', hasDesignDoc: !!out.designDoc });
    } else {
      debugLog('PreToolUse', 'Skipped phantom feature registration', {
        extracted: feature,
        active: activeFeature || 'none',
      });
    }
  } catch (e) {
    debugLog('PreToolUse', 'PDCA update failed', { error: e.message });
  }
  return out;
}
```

---

## 6. Layer 5: history limit + dedup

### 6.1 파일: `lib/pdca/status-core.js:210-215`

### 6.2 변경 사항

```diff
- status.history.push({
-   timestamp: new Date().toISOString(),
-   feature,
-   phase,
-   action: 'updated',
- });
+ // v2.1.15 (Issue #89): consecutive 동일 entry는 dedup (timestamp만 갱신)
+ const newEntry = {
+   timestamp: new Date().toISOString(),
+   feature,
+   phase,
+   action: 'updated',
+ };
+ const last = status.history[status.history.length - 1];
+ if (
+   last &&
+   last.feature === newEntry.feature &&
+   last.phase === newEntry.phase &&
+   last.action === newEntry.action
+ ) {
+   // 마지막 항목과 동일 → timestamp만 갱신 (push 안 함)
+   last.timestamp = newEntry.timestamp;
+ } else {
+   status.history.push(newEntry);
+ }
+ // Ring buffer 100 limit (addPdcaHistory와 동일 정책)
+ if (status.history.length > 100) {
+   status.history = status.history.slice(-100);
+ }
```

### 6.3 영향

- 매 편집마다 동일 feature/phase/action을 1개 entry로 누적 → 1만번 편집이라도 history는 항상 ≤100개
- 다른 phase 전환이나 다른 feature 활동은 정상 push

---

## 7. Layer 6: 단위 테스트

### 7.1 신규 파일 1: `tests/unit/file-extract-feature.test.js`

| TC | 입력 | Expected | Layer 검증 |
|----|------|----------|------------|
| 01 | `app/services/broadcast_service.py` | `''` | L1: 파일명 오추출 차단 |
| 02 | `app/services/auth/login.py` | `'auth'` | L1: 정당 디렉토리 유지 |
| 03 | `features/auth/login.ts` | `'auth'` | L1: features 패턴 정상 |
| 04 | `apps/cms/v1/users.py` | `''` | L1: generic cms/v1 차단 |
| 05 | `apps/dashboard/page.tsx` | `''` | L1: generic dashboard 차단 |
| 06 | `packages/auth/index.ts` | `'auth'` | L1: packages 정상 |
| 07 | `domains/billing/service.py` | `'billing'` | L1: domains 정상 |
| 08 | `services/broadcast_service.py` (no leading dir) | `''` | L1: 단독 services + 파일 차단 |
| 09 | `''` (empty) | `''` | L1: empty input |
| 10 | `app/services/.gitkeep` | `''` | L1: hidden file 차단 |
| 11 | `app/services/auth.py` | `''` | L1: 직접 파일 차단 |
| 12 | `app/(dashboard)/page.tsx` (fallback off) | `''` | L1: Next.js 라우트 그룹 차단 |
| 13 | `app/services/auth/login.py` + `{allowFallback: true}` | `'auth'` (still pattern match) | L1: opt-in fallback |
| 14 | `random/path/foo.py` + `{allowFallback: true}` | `'random'` | L1: fallback opt-in 동작 |
| 15 | `random/path/foo.py` (default) | `''` | L1: fallback OFF default |

### 7.2 신규 파일 2: `tests/unit/pdca-status-gating.test.js`

| TC | 시나리오 | Expected | Layer 검증 |
|----|----------|----------|------------|
| 01 | feature 없음 (`updatePdcaStatus('', 'do')`) | no-op | L3: invalid input |
| 02 | feature non-string (`updatePdcaStatus(null, 'do')`) | no-op | L3: invalid input |
| 03 | plan/design 문서 없음 + `requireDocs: true` (default) | no-op | L3: 게이트 작동 |
| 04 | plan 문서만 존재 + default | 등록됨 | L3: plan만으로 통과 |
| 05 | design 문서만 존재 + default | 등록됨 | L3: design만으로 통과 |
| 06 | 둘 다 없음 + `requireDocs: false` | 등록됨 | L3: opt-out 동작 |
| 07 | 동일 feature/phase/action 연속 호출 | history.length 증가 안 함 | L5: dedup |
| 08 | 다른 phase로 호출 | history.length +1 | L5: phase 전환은 정상 push |
| 09 | 100회 푸시 후 101회째 | history.length === 100 | L5: ring buffer |

### 7.3 신규 파일 3: `tests/unit/extract-feature-from-context.test.js`

| TC | 입력 | Expected | Layer 검증 |
|----|------|----------|------------|
| 01 | `{filePath: 'app/services/broadcast.py'}` | `''` | L2 → L1 위임 |
| 02 | `{filePath: 'features/auth/login.ts'}` | `'auth'` | L2 → L1 정상 |
| 03 | `{feature: 'explicit'}` | `'explicit'` | L2: explicit override |
| 04 | `{}` (empty sources) | `''` 또는 primaryFeature | L2: fallback to status |

---

## 8. 호환성 + 마이그레이션

| 항목 | 영향 |
|------|------|
| **Breaking** | 없음 |
| **API 변경** | `extractFeature(filePath)` → `extractFeature(filePath, opts = {})` (옵션 추가 backward-compat) / `updatePdcaStatus(feature, phase, data)` → `updatePdcaStatus(feature, phase, data, opts = {})` (옵션 추가 backward-compat) |
| **사용자 마이그레이션** | 없음. 기존 `.pdca-status.json` garbage는 사용자가 별도 cleanup 가능 (`/bkit` 도움말에서 안내 권장, 본 PR 외) |
| **호출자 영향** | 16개 `updatePdcaStatus` 호출처 모두 default behavior 통과 (PDCA lifecycle order 보장) |

---

## 9. 버전 동기화 (5+ 위치)

| 파일 | Line | 변경 |
|------|------|------|
| `bkit.config.json` | `version` | `2.1.14` → **`2.1.15`** |
| `.claude-plugin/plugin.json` | `version` | `2.1.14` → **`2.1.15`** |
| `.claude-plugin/marketplace.json` | `version` | `2.1.14` → **`2.1.15`** |
| `hooks/hooks.json` | `description` | `v2.1.14` → **`v2.1.15`** |
| `README.md` | What's New | v2.1.15 추가 |
| `CHANGELOG.md` | 신규 entry | v2.1.15 섹션 |

---

## 10. 검증 (Verify Plan)

1. ✅ 단위 테스트 ≥20 TC PASS (Layer 1-5 모두 cover)
2. ✅ `node -e "require('./scripts/pre-write.js')"` smoke (require 성공)
3. ✅ `node -e "const {extractFeature} = require('./lib/core/file'); console.log(extractFeature('app/services/broadcast.py'))"` → `''` 출력
4. ✅ `node -e "const {extractFeature} = require('./lib/core/file'); console.log(extractFeature('features/auth/login.ts'))"` → `'auth'` 출력
5. ✅ 기존 16개 호출처 require error 0
6. ✅ 본 repo `.bkit/state/pdca-status.json` 본 fix 적용 후 30분 사용 → garbage 증가 0
7. ✅ `claude plugin validate .` Exit 0
8. ✅ 버전 sync 5+ 위치 모두 v2.1.15
