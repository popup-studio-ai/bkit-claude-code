#!/usr/bin/env node
/**
 * L1 Unit Tests — lib/quality/sqm-calculator.js (v2.1.19 S0)
 *
 * Tests 6 component pure functions + computeSqm aggregator.
 *
 * Master plan: docs/01-plan/features/v2119-bkit-quality-maturation.master-plan.md §23
 * Design ref: docs/02-design/features/s0-sqm-baseline.design.md §8
 *
 * @module test/unit/quality/sqm-calculator.test
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

console.log('L1 sqm-calculator unit tests');

// ============================================================
// T0 — Module invariants
// ============================================================

test('module exports 11 keys + weight sum = 1.0 invariant', () => {
  assert.ok(typeof sqm.computeSqm === 'function');
  assert.ok(typeof sqm.measureDocsCodeSyncRate === 'function');
  assert.ok(typeof sqm.measureSprintSelfDogfoodRunRate === 'function');
  assert.ok(typeof sqm.measureExternalDogfooderFeedbackResponseRate === 'function');
  assert.ok(typeof sqm.measureSprintReportKpiConsistency === 'function');
  assert.ok(typeof sqm.measureSubAgentDispatchSuccessRate === 'function');
  assert.ok(typeof sqm.measureConventionContractTestPassRate === 'function');
  assert.deepEqual(Object.keys(sqm.SQM_WEIGHTS), [
    'docsCodeSyncRate',
    'sprintSelfDogfoodRunRate',
    'externalDogfooderFeedbackResponseRate',
    'sprintReportKpiConsistency',
    'subAgentDispatchSuccessRate',
    'conventionContractTestPassRate',
  ]);
  const sum = Object.values(sqm.SQM_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1.0) < 1e-9, `weight sum ${sum} != 1.0`);
  assert.deepEqual(sqm.DEFAULT_DOGFOODERS, ['pruge']);
  assert.equal(sqm.SCHEMA_VERSION, '1.0');
});

// ============================================================
// T1 — measureDocsCodeSyncRate
// ============================================================

test('T1: measureDocsCodeSyncRate — happy path 3/3 PASS = 100', () => {
  const r = sqm.measureDocsCodeSyncRate({
    skills: [
      { name: 'a', invariantPass: true, failures: [] },
      { name: 'b', invariantPass: true, failures: [] },
      { name: 'c', invariantPass: true, failures: [] },
    ],
  });
  assert.equal(r.value, 100);
  assert.equal(r.raw.passed, 3);
  assert.equal(r.raw.total, 3);
});

test('T1b: measureDocsCodeSyncRate — partial 2/3 = 67 + failures captured', () => {
  const r = sqm.measureDocsCodeSyncRate({
    skills: [
      { name: 'a', invariantPass: true, failures: [] },
      { name: 'b', invariantPass: false, failures: ['x missing'] },
      { name: 'c', invariantPass: true, failures: [] },
    ],
  });
  assert.equal(r.value, 67);
  assert.equal(r.raw.failures.length, 1);
  assert.equal(r.raw.failures[0].name, 'b');
});

test('T1c: measureDocsCodeSyncRate — empty input returns null', () => {
  const r1 = sqm.measureDocsCodeSyncRate({});
  assert.equal(r1.value, null);
  const r2 = sqm.measureDocsCodeSyncRate({ skills: [] });
  assert.equal(r2.value, null);
});

// ============================================================
// T2 — measureSprintSelfDogfoodRunRate
// ============================================================

test('T2: measureSprintSelfDogfoodRunRate — 2 full + 1 partial in 5 = 50', () => {
  const r = sqm.measureSprintSelfDogfoodRunRate({
    releases: [
      { version: 'a', runAsSprint: true },
      { version: 'b', runAsSprint: false },
      { version: 'c', runAsSprint: 'partial' },
      { version: 'd', runAsSprint: true },
      { version: 'e', runAsSprint: false },
    ],
  });
  // (2 + 0.5) / 5 = 0.5 → 50
  assert.equal(r.value, 50);
  assert.equal(r.raw.sprintRuns, 2);
  assert.equal(r.raw.partial, 1);
});

test('T2b: measureSprintSelfDogfoodRunRate — all 5 false = 0', () => {
  const r = sqm.measureSprintSelfDogfoodRunRate({
    releases: [
      { version: 'a', runAsSprint: false },
      { version: 'b', runAsSprint: false },
      { version: 'c', runAsSprint: false },
      { version: 'd', runAsSprint: false },
      { version: 'e', runAsSprint: false },
    ],
  });
  assert.equal(r.value, 0);
});

// ============================================================
// T3 — measureExternalDogfooderFeedbackResponseRate
// ============================================================

test('T3: external dogfooder — 7/7 closed within 24h = 100', () => {
  const r = sqm.measureExternalDogfooderFeedbackResponseRate({
    issues: Array.from({ length: 7 }, (_, i) => ({
      number: 100 + i,
      closedAt: '2026-05-21T05:00:00Z',
      within24h: true,
    })),
    dogfooders: ['pruge'],
    windowStart: '2026-04-21',
    windowEnd: '2026-05-21',
  });
  assert.equal(r.value, 100);
  assert.equal(r.raw.within24h, 7);
  assert.equal(r.raw.closed, 7);
});

test('T3b: external dogfooder — open-only issues → value null', () => {
  const r = sqm.measureExternalDogfooderFeedbackResponseRate({
    issues: [
      { number: 1, closedAt: null, within24h: false },
      { number: 2, closedAt: null, within24h: false },
    ],
    dogfooders: ['pruge'],
  });
  assert.equal(r.value, null);
  assert.match(r.raw.error, /no closed/);
});

test('T3c: external dogfooder — mixed 3 closed within 24h, 1 closed late, 2 open = 75', () => {
  const r = sqm.measureExternalDogfooderFeedbackResponseRate({
    issues: [
      { number: 1, closedAt: '...', within24h: true },
      { number: 2, closedAt: '...', within24h: true },
      { number: 3, closedAt: '...', within24h: true },
      { number: 4, closedAt: '...', within24h: false },
      { number: 5, closedAt: null, within24h: false },
      { number: 6, closedAt: null, within24h: false },
    ],
    dogfooders: ['pruge'],
  });
  // closed=4, within24h=3 → 75
  assert.equal(r.value, 75);
  assert.equal(r.raw.closed, 4);
  assert.equal(r.raw.openInWindow, 2);
});

// ============================================================
// T4 — measureSprintReportKpiConsistency
// ============================================================

test('T4: sprintReport — 2 reports, 0 divergence each = 100', () => {
  const r = sqm.measureSprintReportKpiConsistency({
    reports: [
      { feature: 'a', divergenceCount: 0 },
      { feature: 'b', divergenceCount: 0 },
    ],
  });
  // 0 / (2*4) = 0 divergence → consistency 100
  assert.equal(r.value, 100);
});

test('T4b: sprintReport — empty reports = null', () => {
  const r = sqm.measureSprintReportKpiConsistency({ reports: [] });
  assert.equal(r.value, null);
});

test('T4c: sprintReport — 4 reports with mix divergences', () => {
  const r = sqm.measureSprintReportKpiConsistency({
    reports: [
      { feature: 'a', divergenceCount: 0 },
      { feature: 'b', divergenceCount: 1 },
      { feature: 'c', divergenceCount: 1 },
      { feature: 'd', divergenceCount: 0 },
    ],
  });
  // totalDiv=2, totalChecks=16 → consistency = 1 - 2/16 = 0.875 → 88
  assert.equal(r.value, 88);
});

// ============================================================
// T5 — measureSubAgentDispatchSuccessRate
// ============================================================

test('T5: dispatch — 9 success / 10 total = 90', () => {
  const dispatches = Array.from({ length: 10 }, (_, i) => ({
    actorId: 'sprint-orchestrator',
    timestamp: '2026-05-21T00:00:00Z',
    success: i < 9, // 9 success, 1 fail
  }));
  const r = sqm.measureSubAgentDispatchSuccessRate({
    dispatches,
    windowStart: '2026-04-21',
    windowEnd: '2026-05-21',
  });
  assert.equal(r.value, 90);
  assert.equal(r.raw.success, 9);
  assert.equal(r.raw.total, 10);
});

test('T5b: dispatch — empty window returns null', () => {
  const r = sqm.measureSubAgentDispatchSuccessRate({
    dispatches: [],
    windowStart: '2026-04-21',
    windowEnd: '2026-05-21',
  });
  assert.equal(r.value, null);
  assert.equal(r.raw.windowEmpty, true);
});

// ============================================================
// T6 — measureConventionContractTestPassRate
// ============================================================

test('T6: convention — testsExist=false returns 0 (deliberate, not null)', () => {
  const r = sqm.measureConventionContractTestPassRate({ testsExist: false });
  assert.equal(r.value, 0);
  assert.equal(r.raw.exists, false);
});

test('T6b: convention — 8/10 passing = 80', () => {
  const r = sqm.measureConventionContractTestPassRate({
    testsExist: true,
    passed: 8,
    total: 10,
  });
  assert.equal(r.value, 80);
});

// ============================================================
// T7 — computeSqm aggregator
// ============================================================

test('T7: computeSqm — all components null → total=0, 5 warnings', () => {
  const r = sqm.computeSqm({ rawData: {} });
  assert.equal(r.total, 0);
  // 5 unmeasurable components (convention returns 0 not null)
  assert.equal(r.warnings.length, 5);
  assert.equal(r.schemaVersion, '1.0');
});

test('T7b: computeSqm — happy path all components have values', () => {
  const rawData = {
    docsCode: { skills: [
      { name: 'a', invariantPass: true },
      { name: 'b', invariantPass: true },
    ]},
    sprintRuns: { releases: [
      { version: 'a', runAsSprint: true },
      { version: 'b', runAsSprint: true },
    ]},
    dogfooderIssues: {
      issues: [{ closedAt: 'x', within24h: true }],
      dogfooders: ['pruge'],
    },
    sprintReports: { reports: [{ feature: 'a', divergenceCount: 0 }] },
    dispatchAudit: { dispatches: [{ success: true }] },
    conventionTests: { testsExist: true, passed: 1, total: 1 },
  };
  const r = sqm.computeSqm({ rawData, gitCommit: 'abc', bkitVersion: '2.1.18' });
  // All values 100 → total = 100 * (0.30+0.20+0.20+0.15+0.10+0.05) = 100
  assert.equal(r.total, 100);
  assert.equal(r.warnings.length, 0);
  assert.equal(r.gitCommit, 'abc');
});

test('T7c: computeSqm — weighted contributions match', () => {
  const rawData = {
    docsCode: { skills: [
      { name: 'a', invariantPass: true },
      { name: 'b', invariantPass: false, failures: [] },
    ]},  // 50%
    sprintRuns: { releases: [{ version: 'a', runAsSprint: true }] }, // 100%
    dogfooderIssues: null,  // null
    sprintReports: null,    // null
    dispatchAudit: null,    // null
    conventionTests: { testsExist: false }, // 0
  };
  const r = sqm.computeSqm({ rawData });
  // 50 * 0.30 + 100 * 0.20 + 0 (null * 3) + 0 * 0.05 = 15 + 20 = 35
  assert.equal(r.total, 35);
  assert.equal(r.warnings.length, 3);
});

// ============================================================
// Summary
// ============================================================

console.log(`\n${passed} passed, ${failed} failed (total ${passed + failed})`);
if (failed > 0) {
  console.error('\nFailures:');
  failures.forEach(f => console.error(`  - ${f.name}: ${f.err}`));
  process.exit(1);
}
process.exit(0);
