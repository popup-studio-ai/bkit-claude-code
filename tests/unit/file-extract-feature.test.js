/**
 * Unit tests — extractFeature (lib/core/file.js)
 *
 * Issue: #89 (.pdca-status.json 무한 오염)
 * Design Ref: docs/02-design/features/issue-89-pdca-status-fix.design.md §2
 * Version: v2.1.15
 *
 * Layer 1 검증: extractFeature 강화
 *   - 파일명 오추출 차단 (확장자 보유)
 *   - GENERIC_NAMES 확장 (auth/cms/v1/dashboard 등)
 *   - Fallback opt-in (default OFF)
 *
 * @module tests/unit/file-extract-feature
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { extractFeature, GENERIC_NAMES } = require('../../lib/core/file');

// ============================================================
// Layer 1: 파일명 오추출 차단 (확장자 보유 캡처값)
// ============================================================

test('TC01 — services/file.py 파일명 오추출 차단', () => {
  assert.equal(extractFeature('app/services/broadcast_service.py'), '');
});

test('TC02 — services/[generic]/file.py: auth는 GENERIC이라 skip', () => {
  // auth는 GENERIC_NAMES이므로 skip → fallback OFF default라 ''
  assert.equal(extractFeature('app/services/auth/login.py'), '');
});

test('TC03 — features/[generic]/file.ts: auth GENERIC skip', () => {
  assert.equal(extractFeature('features/auth/login.ts'), '');
});

test('TC04 — apps/cms/v1/file.py: cms+v1 모두 GENERIC', () => {
  // apps 패턴 → 'cms' 캡처 → GENERIC skip → fallback OFF → ''
  assert.equal(extractFeature('apps/cms/v1/users.py'), '');
});

test('TC05 — apps/dashboard/file.tsx: dashboard GENERIC', () => {
  assert.equal(extractFeature('apps/dashboard/page.tsx'), '');
});

test('TC06 — packages/[generic]/file: auth GENERIC skip', () => {
  assert.equal(extractFeature('packages/auth/index.ts'), '');
});

// ============================================================
// Layer 1: 정당 feature 유지
// ============================================================

test('TC07 — domains/billing/file.py: billing은 정당', () => {
  assert.equal(extractFeature('domains/billing/service.py'), 'billing');
});

test('TC08 — features/onboarding/page.tsx: 정당 유지', () => {
  assert.equal(extractFeature('features/onboarding/page.tsx'), 'onboarding');
});

test('TC09 — packages/email-notifications/index.ts: 정당 유지', () => {
  assert.equal(extractFeature('packages/email-notifications/index.ts'), 'email-notifications');
});

test('TC10 — modules/payment-gateway/api.ts: 정당 유지', () => {
  assert.equal(extractFeature('modules/payment-gateway/api.ts'), 'payment-gateway');
});

// ============================================================
// Layer 1: Empty / Invalid input
// ============================================================

test('TC11 — 빈 문자열 입력', () => {
  assert.equal(extractFeature(''), '');
});

test('TC12 — null / undefined 입력', () => {
  assert.equal(extractFeature(null), '');
  assert.equal(extractFeature(undefined), '');
});

test('TC13 — non-string 입력 (number)', () => {
  assert.equal(extractFeature(42), '');
});

// ============================================================
// Layer 1: Fallback opt-in (default OFF)
// ============================================================

test('TC14 — fallback OFF default: random/path/foo.py', () => {
  assert.equal(extractFeature('random/path/foo.py'), '');
});

test('TC15 — fallback ON: random/path/foo.py → path (random 다음 valid)', () => {
  // 'random'은 GENERIC 아님이지만, parts.length-2부터 거꾸로 iterate
  // foo.py(len-1, 확장자 skip) → path(len-2, valid) → 반환
  // 단, 본 패턴에서는 random/path/foo.py 의 parts = ['random','path','foo.py']
  // i = len-2 = 1 → parts[1]='path' (GENERIC? path 없음) → 반환
  assert.equal(extractFeature('random/path/foo.py', { allowFallback: true }), 'path');
});

test('TC16 — fallback ON: app/specific-feature/main.ts', () => {
  // i = len-2 = 1 → 'specific-feature' (정당 디렉토리 + 확장자 없음)
  // 단 'app'은 GENERIC이라 i=0에서 skip되지만 이미 i=1에서 반환됨
  assert.equal(
    extractFeature('app/specific-feature/main.ts', { allowFallback: true }),
    'specific-feature'
  );
});

test('TC17 — fallback ON 시에도 확장자 가진 항목 skip', () => {
  // foo.bar/baz.py — parts ['foo.bar','baz.py']
  // i = 0 → 'foo.bar' → extname='.bar' → skip → 최종 ''
  assert.equal(extractFeature('foo.bar/baz.py', { allowFallback: true }), '');
});

// ============================================================
// Layer 1: 패턴 매칭 우선순위 (configured patterns > fallback)
// ============================================================

test('TC18 — packages/feature가 패턴 매칭, fallback 무관', () => {
  assert.equal(extractFeature('packages/billing-svc/api.ts'), 'billing-svc');
});

test('TC19 — 패턴 매칭 후보가 파일인 경우 다음 패턴/fallback으로 진행', () => {
  // services/ 패턴 매칭 → 'foo.py' (확장자) skip
  // 그 다음 다른 패턴 매칭 시도 → 없음
  // fallback OFF default → ''
  assert.equal(extractFeature('services/foo.py'), '');
});

// ============================================================
// Layer 1: GENERIC_NAMES exports
// ============================================================

test('TC20 — GENERIC_NAMES export 확인', () => {
  assert.ok(Array.isArray(GENERIC_NAMES), 'GENERIC_NAMES는 배열');
  assert.ok(GENERIC_NAMES.length > 50, 'v2.1.15에서 50개 초과 확장');
  assert.ok(GENERIC_NAMES.includes('auth'), 'auth 포함');
  assert.ok(GENERIC_NAMES.includes('cms'), 'cms 포함');
  assert.ok(GENERIC_NAMES.includes('v1'), 'v1 포함');
  assert.ok(GENERIC_NAMES.includes('dashboard'), 'dashboard 포함');
  assert.ok(GENERIC_NAMES.includes('(dashboard)'), 'Next.js 라우트 그룹 포함');
});
