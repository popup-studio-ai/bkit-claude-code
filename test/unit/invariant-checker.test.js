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

console.log('\n=== invariant-checker.js Unit Tests ===\n');

// Setup temp dirs
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-inv-test-'));
const fakeProjDir = path.join(tmpDir, 'project');
const bkitDir = path.join(fakeProjDir, '.bkit');
fs.mkdirSync(path.join(bkitDir, 'state'), { recursive: true });
fs.mkdirSync(path.join(bkitDir, 'runtime'), { recursive: true });

// Mock platform + config
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

// Clear cached modules
delete require.cache[require.resolve('../../lib/core/paths')];
delete require.cache[require.resolve('../../lib/context/context-loader')];
delete require.cache[require.resolve('../../lib/context/invariant-checker')];

const {
  checkInvariants, isCriticalViolation, analyzeViolation, formatCheckSummary,
} = require('../../lib/context/invariant-checker');

(async () => {

// --- analyzeViolation ---

test('UT-IC-001', 'analyzeViolation returns null when no code provided', () => {
  const inv = { check: 'balance >= 0', severity: 'critical' };
  assert.strictEqual(analyzeViolation(inv, '', 'test.js'), null);
});

test('UT-IC-002', 'analyzeViolation detects balance modification without guard', () => {
  const inv = { check: 'balance >= 0', severity: 'critical' };
  const code = 'let result = balance - amount;';
  const result = analyzeViolation(inv, code, 'test.js');
  assert.ok(result);
  assert.ok(result.detail.includes('Balance'));
});

test('UT-IC-003', 'analyzeViolation detects state transition', () => {
  const inv = { check: 'stateIndex must increase', severity: 'warning' };
  const code = 'this.setState({ status: "done" });';
  const result = analyzeViolation(inv, code, 'test.js');
  assert.ok(result);
  assert.ok(result.detail.includes('State transition'));
});

test('UT-IC-004', 'analyzeViolation detects timeout/delay patterns', () => {
  const inv = { check: 'responseTime < 500ms', severity: 'warning' };
  const code = 'setTimeout(() => resolve(), 1000);';
  const result = analyzeViolation(inv, code, 'test.js');
  assert.ok(result);
  assert.ok(result.detail.includes('Delay'));
});

test('UT-IC-005', 'analyzeViolation returns null for non-matching pattern', () => {
  const inv = { check: 'balance >= 0', severity: 'critical' };
  const code = 'console.log("hello world");';
  assert.strictEqual(analyzeViolation(inv, code, 'test.js'), null);
});

// --- formatCheckSummary ---

test('UT-IC-006', 'formatCheckSummary returns pass message for no violations', () => {
  const result = formatCheckSummary([], false, false);
  assert.strictEqual(result, 'All invariants passed.');
});

test('UT-IC-007', 'formatCheckSummary includes BLOCK for critical violations', () => {
  const violations = [
    { invariant_id: 'INV-001', rule: 'No negative', severity: 'critical', detail: 'Found issue' },
  ];
  const result = formatCheckSummary(violations, true, false);
  assert.ok(result.includes('CRITICAL'));
  assert.ok(result.includes('BLOCK'));
  assert.ok(result.includes('INV-001'));
});

test('UT-IC-008', 'formatCheckSummary includes WARN for warning violations', () => {
  const violations = [
    { invariant_id: 'INV-002', rule: 'Check timeout', severity: 'warning', detail: 'Timeout found' },
  ];
  const result = formatCheckSummary(violations, false, true);
  assert.ok(result.includes('WARN'));
  assert.ok(result.includes('INV-002'));
});

// --- isCriticalViolation ---

test('UT-IC-009', 'isCriticalViolation returns true for critical result', () => {
  assert.strictEqual(isCriticalViolation({ hasCritical: true }), true);
});

test('UT-IC-010', 'isCriticalViolation returns false for non-critical', () => {
  assert.strictEqual(isCriticalViolation({ hasCritical: false }), false);
});

test('UT-IC-011', 'isCriticalViolation returns falsy for null/undefined', () => {
  assert.ok(!isCriticalViolation(null));
  assert.ok(!isCriticalViolation(undefined));
});

// --- checkInvariants ---

await testAsync('UT-IC-012', 'checkInvariants returns no violations for file with no invariants', async () => {
  const result = await checkInvariants('unknown-file.js', '');
  assert.deepStrictEqual(result.violations, []);
  assert.strictEqual(result.hasCritical, false);
  assert.strictEqual(result.hasWarning, false);
  assert.ok(result.summary.includes('No invariants'));
});

await testAsync('UT-IC-013', 'checkInvariants detects violations from invariants file', async () => {
  const invPath = path.join(bkitDir, 'invariants.yaml');
  fs.writeFileSync(invPath, JSON.stringify({
    invariants: [
      { id: 'INV-100', rule: 'No negative balance', files: ['account.js'], severity: 'critical', check: 'balance >= 0' },
    ],
  }));
  const code = 'let balance = balance - withdraw;';
  const result = await checkInvariants('account.js', code);
  assert.ok(result.violations.length >= 1);
  assert.strictEqual(result.hasCritical, true);
});

// Cleanup
try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

// Summary
console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);

})();
