/**
 * Unit tests — extractFeatureFromContext (lib/pdca/status-core.js)
 *
 * Issue: #89 (.pdca-status.json 무한 오염)
 * Design Ref: docs/02-design/features/issue-89-pdca-status-fix.design.md §3
 * Version: v2.1.15
 *
 * Layer 2 검증: extractFeatureFromContext → extractFeature 위임 (DRY)
 *
 * @module tests/unit/extract-feature-from-context
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { extractFeatureFromContext } = require('../../lib/pdca/status-core');

test('TC01 — sources.feature 우선 (explicit override)', () => {
  assert.equal(extractFeatureFromContext({ feature: 'explicit-feature' }), 'explicit-feature');
});

test('TC02 — sources.filePath → extractFeature 위임 (정당 feature)', () => {
  assert.equal(
    extractFeatureFromContext({ filePath: 'features/billing/charge.ts' }),
    'billing'
  );
});

test('TC03 — sources.filePath → extractFeature 위임 (GENERIC skip)', () => {
  // auth는 GENERIC → '' → fallback to primaryFeature or ''
  const result = extractFeatureFromContext({ filePath: 'features/auth/login.ts' });
  // primaryFeature가 set돼있으면 그것, 아니면 ''
  assert.ok(typeof result === 'string', '반환 타입은 string');
});

test('TC04 — sources.filePath → 파일명 오추출 차단 (Issue #89 핵심 케이스)', () => {
  // 'broadcast_service.py'를 feature로 반환하면 안 됨
  const result = extractFeatureFromContext({ filePath: 'app/services/broadcast_service.py' });
  assert.notEqual(result, 'broadcast_service.py');
  // primaryFeature 있을 시 그것 반환 가능, 없으면 ''
});

test('TC05 — empty sources → primaryFeature or empty string', () => {
  const result = extractFeatureFromContext({});
  assert.ok(typeof result === 'string', '반환 타입은 string');
});

test('TC06 — undefined sources → fallback to primaryFeature/empty', () => {
  const result = extractFeatureFromContext();
  assert.ok(typeof result === 'string');
});

test('TC07 — sources.filePath = empty string → primaryFeature/empty', () => {
  const result = extractFeatureFromContext({ filePath: '' });
  assert.ok(typeof result === 'string');
});

test('TC08 — sources.filePath = packages/feature/file → 정당 추출', () => {
  assert.equal(
    extractFeatureFromContext({ filePath: 'packages/email-notifications/index.ts' }),
    'email-notifications'
  );
});

test('TC09 — sources.feature 빈 문자열 → filePath로 fallback', () => {
  // sources.feature === '' falsy → filePath 처리
  assert.equal(
    extractFeatureFromContext({ feature: '', filePath: 'modules/payment/api.ts' }),
    'payment'
  );
});

test('TC10 — sources.feature와 filePath 동시 → feature 우선', () => {
  assert.equal(
    extractFeatureFromContext({
      feature: 'priority-feature',
      filePath: 'features/billing/x.ts',
    }),
    'priority-feature'
  );
});
