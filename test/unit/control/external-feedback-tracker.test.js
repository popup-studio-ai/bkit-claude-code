#!/usr/bin/env node
/**
 * L1 Unit — lib/control/external-feedback-tracker.js (F4-2 v2.1.19 S4)
 */
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const tracker = require(path.join(PROJECT_ROOT, 'lib/control/external-feedback-tracker.js'));

let passed = 0, failed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; failures.push({ name, err: e.message }); console.log(`  ✗ ${name} — ${e.message}`); }
}

console.log('L1 external-feedback-tracker unit tests');

test('TC-F4-2-U1: computeResponseRate happy path (7/7 within24h)', () => {
  const issues = Array.from({ length: 7 }, () => ({ closedAt: '2026-05-21T01:00:00Z', within24h: true }));
  const r = tracker.computeResponseRate({ issues, windowDays: 30 });
  assert.equal(r.value, 100);
  assert.equal(r.raw.closed, 7);
  assert.equal(r.raw.within24h, 7);
  assert.equal(r.raw.openInWindow, 0);
});

test('TC-F4-2-U2: computeResponseRate partial close + open (closed-only denominator)', () => {
  const issues = [
    { closedAt: 'x', within24h: true },
    { closedAt: 'x', within24h: true },
    { closedAt: 'x', within24h: false },
    { closedAt: null, within24h: false },
    { closedAt: null, within24h: false },
  ];
  const r = tracker.computeResponseRate({ issues, windowDays: 30 });
  // closed=3, within24h=2 → 67
  assert.equal(r.value, 67);
  assert.equal(r.raw.closed, 3);
  assert.equal(r.raw.openInWindow, 2);
});

test('TC-F4-2-U3: persistToFile + loadFromFile round-trip', () => {
  const tmp = path.join(os.tmpdir(), `v2119-s4-tracker-${Date.now()}.json`);
  const result = {
    asOf: '2026-05-21T10:00:00Z',
    windowDays: 30,
    dogfooders: ['pruge'],
    value: 100,
    raw: { closed: 7, within24h: 7, openInWindow: 4, issues: [] },
    warnings: [],
    schemaVersion: '1.0',
  };
  tracker.persistToFile(result, tmp);
  assert.ok(fs.existsSync(tmp));
  const loaded = tracker.loadFromFile(tmp);
  assert.deepEqual(loaded, result);
  fs.unlinkSync(tmp);
});

console.log(`\n${passed} passed, ${failed} failed (total ${passed + failed})`);
if (failed > 0) {
  failures.forEach(f => console.error(`  - ${f.name}: ${f.err}`));
  process.exit(1);
}
process.exit(0);
