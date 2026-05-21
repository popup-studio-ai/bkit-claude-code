#!/usr/bin/env node
/**
 * L3+L4 E2E Tests — scripts/check-self-dogfood.sh + helper (F1-3 v2.1.19 S1)
 *
 * @module test/e2e/self-dogfood/ci-gate.test
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const HELPER = path.join(PROJECT_ROOT, 'scripts/_check-self-dogfood-helper.js');
const BASH_WRAPPER = path.join(PROJECT_ROOT, 'scripts/check-self-dogfood.sh');

let passed = 0, failed = 0;
const failures = [];

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; failures.push({ name, err: e.message }); console.log(`  ✗ ${name} — ${e.message}`); }
}

function runHelper(args = []) {
  let stdout = '', exitCode = 0;
  try {
    stdout = execSync(`node "${HELPER}" ${args.join(' ')}`, {
      encoding: 'utf8', cwd: PROJECT_ROOT, stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) { exitCode = e.status; stdout = e.stdout && e.stdout.toString(); }
  return { stdout, exitCode };
}

console.log('L3+L4 F1-3 self-dogfood CI gate tests');

// ============================================================

test('TC-F1-3-S1: no flag, v2.1.18 base → exit 1', () => {
  const { exitCode } = runHelper();
  assert.equal(exitCode, 1);
});

test('TC-F1-3-S2: --bootstrap-mode → exit 0 + audit emit', () => {
  const { stdout, exitCode } = runHelper(['--bootstrap-mode', '--json']);
  assert.equal(exitCode, 0);
  const result = JSON.parse(stdout);
  assert.equal(result.pass, true);
  assert.equal(result.bootstrapMode, true);
  assert.equal(result.auditEmittedAction, 'sprint_bootstrap_mode_activated');
  // Verify on audit log
  const today = new Date().toISOString().split('T')[0];
  const auditPath = path.join(PROJECT_ROOT, `.bkit/audit/${today}.jsonl`);
  const lines = fs.readFileSync(auditPath, 'utf8').trim().split('\n');
  const evts = lines.map(l => { try { return JSON.parse(l); } catch (_) { return null; } })
    .filter(e => e && e.action === 'sprint_bootstrap_mode_activated');
  assert.ok(evts.length >= 1);
});

test('TC-F1-3-S3: --emergency-override → exit 0 + audit emit', () => {
  const { stdout, exitCode } = runHelper(['--emergency-override', 'test-reason', '--json']);
  assert.equal(exitCode, 0);
  const result = JSON.parse(stdout);
  assert.equal(result.pass, true);
  assert.equal(result.emergencyOverride, 'test-reason');
  assert.equal(result.auditEmittedAction, 'self_dogfood_emergency_override');
});

test('TC-F1-3-S4: --check-last 3 → 3 releases checked', () => {
  const { stdout } = runHelper(['--check-last', '3', '--json']);
  const result = JSON.parse(stdout);
  assert.equal(result.checkedReleases.length, 3);
});

test('TC-F1-3-S5: JSON output schema verify', () => {
  const { stdout } = runHelper(['--bootstrap-mode', '--json']);
  const result = JSON.parse(stdout);
  for (const k of ['pass', 'currentVersion', 'bootstrapMode', 'emergencyOverride', 'invariants', 'checkedReleases', 'exitCode', 'auditEmittedAction']) {
    assert.ok(k in result, `missing key: ${k}`);
  }
  assert.ok(Array.isArray(result.invariants));
  assert.ok(Array.isArray(result.checkedReleases));
});

test('TC-F1-3-S6: bash wrapper invocation works', () => {
  // Ensure executable
  try { fs.chmodSync(BASH_WRAPPER, 0o755); } catch (_) {}
  let exitCode = 0, stdout = '';
  try {
    stdout = execSync(`bash "${BASH_WRAPPER}" --bootstrap-mode --json`, {
      encoding: 'utf8', cwd: PROJECT_ROOT, stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) { exitCode = e.status; stdout = e.stdout && e.stdout.toString(); }
  assert.equal(exitCode, 0);
  const result = JSON.parse(stdout);
  assert.equal(result.pass, true);
});

test('TC-F1-3-S7: simulated v2.1.20-fixture invariants check (synthetic fixture)', () => {
  // Quick check: with v2.1.20 (synthetic) as the current version, ensure
  // findRecentReleases returns ['v2.1.19'], which would be PASS once v2.1.19
  // GA archives its outer sprint. We can verify pure logic without writing
  // real fixtures by requiring the helper module directly.
  const helper = require(HELPER);
  const recent = helper.findRecentReleases('2.1.20', 1);
  assert.deepEqual(recent, ['v2.1.19']);
  assert.equal(helper.nextVersion('2.1.20'), 'v2.1.21');
});

console.log(`\n${passed} passed, ${failed} failed (total ${passed + failed})`);
if (failed > 0) {
  failures.forEach(f => console.error(`  - ${f.name}: ${f.err}`));
  process.exit(1);
}
process.exit(0);
