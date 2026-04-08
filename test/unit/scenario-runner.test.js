#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// TC counter
let passed = 0, failed = 0, total = 0;
function test(id, description, fn) {
  total++;
  try {
    fn();
    passed++;
  } catch (err) {
    failed++;
    console.error(`  FAIL ${id}: ${description}`);
    console.error(`    ${err.message}`);
  }
}

async function testAsync(id, description, fn) {
  total++;
  try {
    await fn();
    passed++;
  } catch (err) {
    failed++;
    console.error(`  FAIL ${id}: ${description}`);
    console.error(`    ${err.message}`);
  }
}

console.log('\n=== scenario-runner.js Unit Tests ===\n');

// Setup temp dirs and mocks
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-scn-test-'));
const fakeProjDir = path.join(tmpDir, 'project');
fs.mkdirSync(path.join(fakeProjDir, '.bkit', 'state'), { recursive: true });
fs.mkdirSync(path.join(fakeProjDir, '.bkit', 'runtime'), { recursive: true });

const platformPath = require.resolve('../../lib/core/platform');
require.cache[platformPath] = {
  id: platformPath, filename: platformPath, loaded: true,
  exports: { PROJECT_DIR: fakeProjDir, PLUGIN_ROOT: path.join(tmpDir, 'plugin') },
};
const configPath = require.resolve('../../lib/core/config');
require.cache[configPath] = {
  id: configPath, filename: configPath, loaded: true,
  exports: { getConfig: (k, d) => d },
};

delete require.cache[require.resolve('../../lib/core/paths')];
delete require.cache[require.resolve('../../lib/context/context-loader')];
delete require.cache[require.resolve('../../lib/context/invariant-checker')];
delete require.cache[require.resolve('../../lib/context/scenario-runner')];

const {
  runScenarios, validateScenario, runFullVerification, formatReport, formatFullReport,
} = require('../../lib/context/scenario-runner');

(async () => {

// --- validateScenario ---

await testAsync('UT-SR-001', 'validateScenario skips scenario with no test_command or constraint', async () => {
  const result = await validateScenario({ id: 'SC-1', name: 'Manual check' });
  assert.strictEqual(result.status, 'skipped');
  assert.ok(result.reason.includes('Manual'));
});

await testAsync('UT-SR-002', 'validateScenario passes constraint-only scenario', async () => {
  const result = await validateScenario({
    id: 'SC-2', name: 'Constraint check', constraint: 'Must be < 500ms',
  });
  assert.strictEqual(result.status, 'passed');
  assert.ok(result.note.includes('Static validation'));
});

await testAsync('UT-SR-003', 'validateScenario passes test_command that succeeds', async () => {
  const result = await validateScenario({
    id: 'SC-3', name: 'Echo test', test_command: 'echo "hello"',
  });
  assert.strictEqual(result.status, 'passed');
});

await testAsync('UT-SR-004', 'validateScenario fails test_command that errors', async () => {
  const result = await validateScenario({
    id: 'SC-4', name: 'Fail test', test_command: 'exit 1',
  });
  assert.strictEqual(result.status, 'failed');
});

// --- runScenarios ---

await testAsync('UT-SR-005', 'runScenarios handles empty scenario list', async () => {
  const result = await runScenarios([]);
  assert.strictEqual(result.total, 0);
  assert.strictEqual(result.passed, 0);
  assert.strictEqual(result.allPassed, false); // 0 scenarios = not allPassed
});

await testAsync('UT-SR-006', 'runScenarios counts pass/fail/skip correctly', async () => {
  const scenarios = [
    { id: 'S1', name: 'Pass', test_command: 'echo ok' },
    { id: 'S2', name: 'Skip', },
    { id: 'S3', name: 'Constraint', constraint: 'Must be fast' },
  ];
  const result = await runScenarios(scenarios);
  assert.strictEqual(result.total, 3);
  assert.strictEqual(result.passed, 2); // echo + constraint
  assert.strictEqual(result.skipped, 1);
  assert.strictEqual(result.failed, 0);
  assert.strictEqual(result.allPassed, true);
});

await testAsync('UT-SR-007', 'runScenarios allPassed is false when any fail', async () => {
  const scenarios = [
    { id: 'S1', name: 'Pass', test_command: 'echo ok' },
    { id: 'S2', name: 'Fail', test_command: 'exit 1' },
  ];
  const result = await runScenarios(scenarios);
  assert.strictEqual(result.allPassed, false);
  assert.strictEqual(result.failed, 1);
});

// --- formatReport ---

test('UT-SR-008', 'formatReport returns default message for null results', () => {
  assert.strictEqual(formatReport(null), 'No verification results.');
});

test('UT-SR-009', 'formatReport returns summary from results', () => {
  assert.strictEqual(formatReport({ summary: 'All good' }), 'All good');
});

// --- formatFullReport ---

test('UT-SR-010', 'formatFullReport includes PASS when all pass', () => {
  const report = formatFullReport({
    scenarioResult: { passed: 2, total: 2, failed: 0, details: [] },
    invariantResult: { violations: [], summary: '' },
    impactWarning: false,
    antiPatterns: [],
    allPassed: true,
  });
  assert.ok(report.includes('PASS'));
  assert.ok(report.includes('2/2'));
});

test('UT-SR-011', 'formatFullReport includes FAIL for failures', () => {
  const report = formatFullReport({
    scenarioResult: { passed: 0, total: 1, failed: 1, details: [
      { id: 'S1', name: 'Bad', status: 'failed', error: 'Timeout' },
    ]},
    invariantResult: { violations: [], summary: '' },
    impactWarning: false,
    antiPatterns: [],
    allPassed: false,
  });
  assert.ok(report.includes('FAIL'));
  assert.ok(report.includes('Timeout'));
});

test('UT-SR-012', 'formatFullReport shows impact warning', () => {
  const report = formatFullReport({
    scenarioResult: { passed: 1, total: 1, failed: 0, details: [] },
    invariantResult: { violations: [], summary: '' },
    impactWarning: true,
    antiPatterns: [],
    allPassed: false,
  });
  assert.ok(report.includes('HIGH BLAST RADIUS'));
});

test('UT-SR-013', 'formatFullReport shows anti-patterns', () => {
  const report = formatFullReport({
    scenarioResult: { passed: 1, total: 1, failed: 0, details: [] },
    invariantResult: { violations: [], summary: '' },
    impactWarning: false,
    antiPatterns: ['Do not use global state'],
    allPassed: true,
  });
  assert.ok(report.includes('Anti-Patterns'));
  assert.ok(report.includes('global state'));
});

// --- runFullVerification ---

await testAsync('UT-SR-014', 'runFullVerification returns complete result object', async () => {
  const context = {
    scenarios: [{ id: 'S1', name: 'Test', constraint: 'Must work' }],
    invariants: [],
    impact: null,
    incidents: [],
  };
  const result = await runFullVerification('test.js', context, '');
  assert.ok('scenarios' in result);
  assert.ok('invariants' in result);
  assert.ok('allPassed' in result);
  assert.ok('canAutoFix' in result);
  assert.ok('summary' in result);
});

// Cleanup
try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

// Summary
console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);

})();
