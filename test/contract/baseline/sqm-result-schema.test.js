#!/usr/bin/env node
/**
 * L2 Contract Test — SqmResult schema invariant (v2.1.19 S0)
 *
 * Validates that computeSqm output conforms to the jsonschema declared
 * in docs/02-design/features/s0-sqm-baseline.design.md §4.1.
 *
 * @module test/contract/baseline/sqm-result-schema.test
 */
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const sqm = require(path.join(PROJECT_ROOT, 'lib/quality/sqm-calculator.js'));

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, err: e.message });
    console.log(`  ✗ ${name} — ${e.message}`);
  }
}

console.log('L2 sqm-result-schema contract tests');

const REQUIRED_RESULT_KEYS = ['total', 'components', 'measuredAt', 'asOf', 'gitCommit', 'bkitVersion', 'warnings', 'schemaVersion'];
const REQUIRED_COMPONENT_KEYS = ['value', 'weight', 'weighted', 'raw'];
const REQUIRED_COMPONENT_NAMES = [
  'docsCodeSyncRate',
  'sprintSelfDogfoodRunRate',
  'externalDogfooderFeedbackResponseRate',
  'sprintReportKpiConsistency',
  'subAgentDispatchSuccessRate',
  'conventionContractTestPassRate',
];

test('SqmResult — top-level keys all present', () => {
  const r = sqm.computeSqm({ rawData: {} });
  for (const k of REQUIRED_RESULT_KEYS) {
    assert.ok(k in r, `missing top-level key: ${k}`);
  }
});

test('SqmResult.total — number in [0, 100]', () => {
  const r = sqm.computeSqm({ rawData: {} });
  assert.equal(typeof r.total, 'number');
  assert.ok(r.total >= 0 && r.total <= 100, `total out of range: ${r.total}`);
});

test('SqmResult.components — 6 components present with correct shape', () => {
  const r = sqm.computeSqm({ rawData: {} });
  for (const name of REQUIRED_COMPONENT_NAMES) {
    assert.ok(name in r.components, `missing component: ${name}`);
    const c = r.components[name];
    for (const k of REQUIRED_COMPONENT_KEYS) {
      assert.ok(k in c, `component ${name} missing key: ${k}`);
    }
    // weight must be the constant from SQM_WEIGHTS
    assert.equal(c.weight, sqm.SQM_WEIGHTS[name], `component ${name} weight mismatch`);
    // weighted must be value * weight (rounded) OR 0 if value null
    if (c.value === null) {
      assert.equal(c.weighted, 0, `component ${name} null value should have weighted=0`);
    } else {
      assert.equal(typeof c.value, 'number');
      assert.ok(c.value >= 0 && c.value <= 100, `component ${name} value out of [0,100]: ${c.value}`);
      assert.equal(typeof c.weighted, 'number');
    }
  }
});

test('SqmResult.measuredAt — ISO timestamp string', () => {
  const r = sqm.computeSqm({ rawData: {} });
  assert.equal(typeof r.measuredAt, 'string');
  assert.match(r.measuredAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  // Parseable as Date
  const d = new Date(r.measuredAt);
  assert.ok(!isNaN(d.getTime()));
});

test('SqmResult.warnings — string array', () => {
  const r = sqm.computeSqm({ rawData: {} });
  assert.ok(Array.isArray(r.warnings));
  r.warnings.forEach(w => assert.equal(typeof w, 'string'));
});

test('SqmResult.schemaVersion — matches lib constant', () => {
  const r = sqm.computeSqm({ rawData: {} });
  assert.equal(r.schemaVersion, sqm.SCHEMA_VERSION);
});

test('Component weights — sum to 1.0 invariant', () => {
  const sum = Object.values(sqm.SQM_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1.0) < 1e-9, `weight sum ${sum} != 1.0`);
});

console.log(`\n${passed} passed, ${failed} failed (total ${passed + failed})`);
if (failed > 0) {
  failures.forEach(f => console.error(`  - ${f.name}: ${f.err}`));
  process.exit(1);
}
process.exit(0);
