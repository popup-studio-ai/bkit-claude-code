/**
 * Unit tests — Layer 3 (shouldUpdate gate) + Layer 5 (appendHistoryEntry dedup/limit)
 *
 * Issue: #89 (.pdca-status.json 무한 오염)
 * Design Ref: docs/02-design/features/issue-89-pdca-status-fix.design.md §4, §6
 * Version: v2.1.15
 *
 * @module tests/unit/pdca-status-gating
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { shouldUpdate, appendHistoryEntry } = require('../../lib/pdca/status-core');

// ============================================================
// Layer 3: shouldUpdate (게이트)
// ============================================================

test('L3-TC01 — feature 빈 문자열 → false', () => {
  assert.equal(shouldUpdate('', true), false);
});

test('L3-TC02 — feature null → false', () => {
  assert.equal(shouldUpdate(null, true), false);
});

test('L3-TC03 — feature non-string (number) → false', () => {
  assert.equal(shouldUpdate(42, true), false);
});

test('L3-TC04 — requireDocs=false → 항상 true (게이트 OFF)', () => {
  assert.equal(shouldUpdate('phantom-xxxx', false), true);
});

test('L3-TC05 — 주입된 docCheckFn=true 반환 → 통과', () => {
  assert.equal(shouldUpdate('real-feature', true, () => true), true);
});

test('L3-TC06 — 주입된 docCheckFn=false 반환 → 차단', () => {
  assert.equal(shouldUpdate('phantom', true, () => false), false);
});

test('L3-TC07 — 주입된 docCheckFn이 feature 인자 받음', () => {
  let received = null;
  shouldUpdate('expected-name', true, (f) => {
    received = f;
    return true;
  });
  assert.equal(received, 'expected-name');
});

test('L3-TC08 — docCheckFn throw → 보수적 통과 (기본 docCheck 경로 fallback과 일치)', () => {
  // 기본 docCheck는 catch로 보수적 true 반환. 주입형은 throw 그대로 전파.
  assert.throws(() => shouldUpdate('foo', true, () => { throw new Error('boom'); }));
});

// ============================================================
// Layer 5: appendHistoryEntry (dedup + ring buffer)
// ============================================================

test('L5-TC01 — 빈 history에 entry 추가', () => {
  const h = [];
  const e = { timestamp: 't1', feature: 'a', phase: 'do', action: 'updated' };
  const result = appendHistoryEntry(h, e);
  assert.equal(result.length, 1);
  assert.equal(result[0].feature, 'a');
});

test('L5-TC02 — non-array history → 새 배열 반환', () => {
  const e = { timestamp: 't1', feature: 'a', phase: 'do', action: 'updated' };
  const result = appendHistoryEntry(null, e);
  assert.deepEqual(result, [e]);
});

test('L5-TC03 — consecutive 동일 entry → timestamp만 갱신 (push 안 함)', () => {
  const h = [{ timestamp: 't1', feature: 'a', phase: 'do', action: 'updated' }];
  const e = { timestamp: 't2', feature: 'a', phase: 'do', action: 'updated' };
  const result = appendHistoryEntry(h, e);
  assert.equal(result.length, 1);
  assert.equal(result[0].timestamp, 't2', 'timestamp 갱신');
});

test('L5-TC04 — phase 다르면 push', () => {
  const h = [{ timestamp: 't1', feature: 'a', phase: 'do', action: 'updated' }];
  const e = { timestamp: 't2', feature: 'a', phase: 'check', action: 'updated' };
  const result = appendHistoryEntry(h, e);
  assert.equal(result.length, 2);
});

test('L5-TC05 — feature 다르면 push', () => {
  const h = [{ timestamp: 't1', feature: 'a', phase: 'do', action: 'updated' }];
  const e = { timestamp: 't2', feature: 'b', phase: 'do', action: 'updated' };
  const result = appendHistoryEntry(h, e);
  assert.equal(result.length, 2);
});

test('L5-TC06 — action 다르면 push', () => {
  const h = [{ timestamp: 't1', feature: 'a', phase: 'do', action: 'updated' }];
  const e = { timestamp: 't2', feature: 'a', phase: 'do', action: 'completed' };
  const result = appendHistoryEntry(h, e);
  assert.equal(result.length, 2);
});

test('L5-TC07 — limit 100 ring buffer', () => {
  // 101 entries (모두 다른 feature) → 마지막 100개만 유지
  let h = [];
  for (let i = 0; i < 101; i++) {
    h = appendHistoryEntry(h, {
      timestamp: `t${i}`,
      feature: `f${i}`,
      phase: 'do',
      action: 'updated',
    });
  }
  assert.equal(h.length, 100, 'ring buffer limit 100');
  assert.equal(h[0].feature, 'f1', '첫 entry는 두 번째 push (f0 drop)');
  assert.equal(h[99].feature, 'f100', '마지막 entry는 f100');
});

test('L5-TC08 — limit 100: dedup 후에도 limit 유지', () => {
  let h = [];
  // 200 entries 모두 동일 feature/phase/action → dedup 후 1개
  for (let i = 0; i < 200; i++) {
    h = appendHistoryEntry(h, {
      timestamp: `t${i}`,
      feature: 'same',
      phase: 'do',
      action: 'updated',
    });
  }
  assert.equal(h.length, 1, 'dedup 동작 — 200회 push 후 1개');
  assert.equal(h[0].timestamp, 't199', '마지막 timestamp 유지');
});

test('L5-TC09 — limit 인자 커스텀', () => {
  let h = [];
  for (let i = 0; i < 11; i++) {
    h = appendHistoryEntry(
      h,
      { timestamp: `t${i}`, feature: `f${i}`, phase: 'do', action: 'updated' },
      10
    );
  }
  assert.equal(h.length, 10);
});

test('L5-TC10 — Issue #89 시나리오: 매 편집마다 동일 entry 100회 호출 → history 1개', () => {
  // 사용자 보고: 매 편집 = history 1줄. 본 fix로 dedup → 항상 1개
  let h = [];
  const baseEntry = { feature: 'real-cycle', phase: 'do', action: 'updated' };
  for (let i = 0; i < 100; i++) {
    h = appendHistoryEntry(h, { ...baseEntry, timestamp: `t${i}` });
  }
  assert.equal(h.length, 1, '100회 호출 → 1 entry (dedup)');
  assert.equal(h[0].timestamp, 't99', '마지막 timestamp 유지');
});
