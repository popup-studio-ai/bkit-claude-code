#!/usr/bin/env node
/** L1 — kpi-resolver (F3-4 v2.1.19 S3, 5 TC) */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const kr = require(path.join(PROJECT_ROOT, 'lib/application/sprint-lifecycle/kpi-resolver.js'));
let passed = 0, failed = 0;
function test(name, fn) { try { fn(); passed++; console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name} — ${e.message}`); } }

console.log('L1 F3-4 kpi-resolver tests');

test('TC-F3-4-K1: resolveKpi — empty sprint returns default schema', () => {
  const r = kr.resolveKpi({});
  for (const k of ['matchRate', 'criticalIssues', 'dataFlowIntegrity', 'featuresCompleted', 'featuresTotal']) {
    assert.ok(k in r, `missing key: ${k}`);
  }
});

test('TC-F3-4-K2: qualityGates.M1 wins over kpi.matchRate (precedence)', () => {
  const sprint = {
    qualityGates: { M1_matchRate: { current: 100 } },
    kpi: { matchRate: 50 },
  };
  const r = kr.resolveKpi(sprint);
  assert.equal(r.matchRate, 100);
});

test('TC-F3-4-K3: featureMap.completion wins over kpi.featuresCompleted', () => {
  const sprint = {
    features: ['a', 'b', 'c'],
    featureMap: {
      a: { completion: true },
      b: { completion: true },
      c: { completion: false },
    },
    kpi: { featuresCompleted: 0 },
  };
  const r = kr.resolveKpi(sprint);
  assert.equal(r.featuresCompleted, 2);
  assert.equal(r.featuresTotal, 3);
});

test('TC-F3-4-K4: detectDivergences — kpi vs qualityGates inconsistent', () => {
  const sprint = {
    qualityGates: { M1_matchRate: { current: 100 } },
    kpi: { matchRate: 50 },
  };
  const divs = kr.detectDivergences(sprint);
  assert.equal(divs.length, 1);
  assert.equal(divs[0].field, 'matchRate');
  assert.equal(divs[0].kpi, 50);
  assert.equal(divs[0].qualityGates, 100);
});

test('TC-F3-4-K5: detectDivergences — consistent → empty', () => {
  const sprint = {
    qualityGates: { M1_matchRate: { current: 100 } },
    kpi: { matchRate: 100 },
  };
  assert.deepEqual(kr.detectDivergences(sprint), []);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
