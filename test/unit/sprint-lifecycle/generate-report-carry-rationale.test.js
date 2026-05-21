#!/usr/bin/env node
/** L1 — carry items rich rationale (F3-5 v2.1.19 S3, 4 TC) */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const gr = require(path.join(PROJECT_ROOT, 'lib/application/sprint-lifecycle/generate-report.usecase.js'));
let passed = 0, failed = 0;
function test(name, fn) { try { fn(); passed++; console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name} — ${e.message}`); } }

console.log('L1 F3-5 carry items rich rationale tests');

test('TC-F3-5-C1: no incomplete features → empty carry', () => {
  const sprint = { featureMap: { a: { matchRate: 100, s1Score: 100 } } };
  assert.deepEqual(gr.identifyCarryItems(sprint), []);
});

test('TC-F3-5-C2: incomplete matchRate → carry with matchRate reason', () => {
  const sprint = { featureMap: { a: { matchRate: 85, s1Score: 100, pdcaPhase: 'check' } } };
  const c = gr.identifyCarryItems(sprint);
  assert.equal(c.length, 1);
  assert.match(c[0].reason, /matchRate 85/);
});

test('TC-F3-5-C3: incomplete + scope + details → rich rationale', () => {
  const sprint = {
    featureMap: {
      a: { matchRate: 85, s1Score: 80, pdcaPhase: 'iterate', scope: 'P0', details: 'gap-detector stuck' },
    },
  };
  const c = gr.identifyCarryItems(sprint);
  assert.equal(c.length, 1);
  assert.match(c[0].reason, /matchRate 85/);
  assert.match(c[0].reason, /s1Score 80/);
  assert.match(c[0].reason, /scope: P0/);
  assert.match(c[0].reason, /details: gap-detector stuck/);
});

test('TC-F3-5-C4: long details trimmed', () => {
  const longText = 'x'.repeat(200);
  const sprint = { featureMap: { a: { matchRate: 85, scope: 'P0', details: longText } } };
  const c = gr.identifyCarryItems(sprint);
  assert.ok(c[0].reason.includes('...'));
  assert.ok(c[0].reason.length < 250); // total bounded
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
