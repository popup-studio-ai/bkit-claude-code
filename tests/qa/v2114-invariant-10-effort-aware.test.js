'use strict';

/**
 * v2114-invariant-10-effort-aware.test.js — L1 tests for ENH-307.
 *
 * Coverage (15 TCs):
 *   CHK — check() guard (10 TCs)
 *   NRM — normalize() (4 TCs)
 *   API — frozen + module surface (1 TC)
 *
 * Run: node tests/qa/v2114-invariant-10-effort-aware.test.js
 */

const assert = require('node:assert/strict');
const path = require('node:path');

const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const inv10 = require(path.join(PLUGIN_ROOT, 'lib/domain/guards/invariant-10-effort-aware'));

let pass = 0, fail = 0, total = 0;
const failures = [];

function test(name, fn) {
  total += 1;
  try { fn(); pass += 1; }
  catch (e) { fail += 1; failures.push({ name, error: e.message }); }
}

// ── CHK: check() ───────────────────────────────────────────────────

test('CHK-01: null ctx → no hit', () => {
  assert.equal(inv10.check(null).hit, false);
});

test('CHK-02: empty ctx → no hit', () => {
  assert.equal(inv10.check({}).hit, false);
});

test('CHK-03: effortLevel="low" → no hit', () => {
  assert.equal(inv10.check({ effortLevel: 'low' }).hit, false);
});

test('CHK-04: effortLevel="medium" → no hit', () => {
  assert.equal(inv10.check({ effortLevel: 'medium' }).hit, false);
});

test('CHK-05: effortLevel="high" → no hit', () => {
  assert.equal(inv10.check({ effortLevel: 'high' }).hit, false);
});

test('CHK-06: effortLevel="HIGH" (case insensitive) → no hit', () => {
  assert.equal(inv10.check({ effortLevel: 'HIGH' }).hit, false);
});

test('CHK-07: effortLevel="extreme" → hit (out-of-range, HIGH severity)', () => {
  const r = inv10.check({ effortLevel: 'extreme' });
  assert.equal(r.hit, true);
  assert.equal(r.meta.kind, 'out-of-range');
  assert.equal(r.meta.severity, 'HIGH');
  assert.equal(r.meta.id, 'INV-10');
});

test('CHK-08: effortLevel="" empty string → hit (MEDIUM)', () => {
  const r = inv10.check({ effortLevel: '' });
  assert.equal(r.hit, true);
  assert.equal(r.meta.kind, 'empty-string');
  assert.equal(r.meta.severity, 'MEDIUM');
});

test('CHK-09: effortLevel=number → hit (type-mismatch)', () => {
  const r = inv10.check({ effortLevel: 42 });
  assert.equal(r.hit, true);
  assert.equal(r.meta.kind, 'type-mismatch');
  assert.equal(r.meta.severity, 'HIGH');
});

test('CHK-10: meta carries scope + source', () => {
  const r = inv10.check({ effortLevel: 'foo', source: 'env', scope: 'unified-bash-pre' });
  assert.equal(r.hit, true);
  assert.equal(r.meta.scope, 'unified-bash-pre');
  assert.equal(r.meta.source, 'env');
});

// ── NRM: normalize() ───────────────────────────────────────────────

test('NRM-01: valid values pass through (lowercased)', () => {
  assert.equal(inv10.normalize('LOW'), 'low');
  assert.equal(inv10.normalize('Medium'), 'medium');
  assert.equal(inv10.normalize('HIGH'), 'high');
});

test('NRM-02: invalid → "medium" default', () => {
  assert.equal(inv10.normalize('extreme'), 'medium');
  assert.equal(inv10.normalize(''), 'medium');
  assert.equal(inv10.normalize(null), 'medium');
  assert.equal(inv10.normalize(undefined), 'medium');
});

test('NRM-03: non-string → "medium" default', () => {
  assert.equal(inv10.normalize(42), 'medium');
  assert.equal(inv10.normalize({}), 'medium');
  assert.equal(inv10.normalize([]), 'medium');
});

test('NRM-04: whitespace trimmed', () => {
  assert.equal(inv10.normalize('  high  '), 'high');
});

// ── API ────────────────────────────────────────────────────────────

test('API-01: VALID_EFFORT_LEVELS frozen + exact 3 entries', () => {
  assert.ok(Object.isFrozen(inv10.VALID_EFFORT_LEVELS));
  assert.deepEqual([...inv10.VALID_EFFORT_LEVELS], ['low', 'medium', 'high']);
  assert.equal(typeof inv10.check, 'function');
  assert.equal(typeof inv10.normalize, 'function');
  assert.equal(typeof inv10.removeWhen, 'function');
});

// ── Summary ────────────────────────────────────────────────────────

console.log(`\n[v2114 L1 invariant-10-effort-aware] total=${total} pass=${pass} fail=${fail}`);
if (fail > 0) {
  for (const f of failures) console.error('  ✗', f.name + ':', f.error);
  process.exit(1);
}
console.log('✓ all PASS');
process.exit(0);
