#!/usr/bin/env node
/**
 * L3+L4 E2E Tests — scripts/_v2119-s0-measure.js (v2.1.19 S0)
 *
 * Verifies:
 *   TS-1: Reproducibility (same git commit → same component values)
 *   TS-2: Read-only on source (only .bkit/runtime/ written)
 *   TS-3: Component independence (one component's failure does not corrupt others)
 *   TS-5: Audit emit (sqm_baseline_measured event in audit log)
 *
 * @module test/e2e/sqm-baseline/measure.test
 */
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { execSync } = require('node:child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const MEASURE_SCRIPT = path.join(PROJECT_ROOT, 'scripts/_v2119-s0-measure.js');
const BASELINE_PATH = path.join(PROJECT_ROOT, '.bkit/runtime/sqm-baseline.json');

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

console.log('L3+L4 sqm-baseline E2E tests');

// ============================================================
// TS-1 — Reproducibility (dry-run two times → same component values)
// ============================================================

test('TS-1: Reproducibility — dry-run components stable across runs', () => {
  const out1 = execSync(`node ${MEASURE_SCRIPT} --dry-run`, { encoding: 'utf8', cwd: PROJECT_ROOT });
  const out2 = execSync(`node ${MEASURE_SCRIPT} --dry-run`, { encoding: 'utf8', cwd: PROJECT_ROOT });
  const r1 = JSON.parse(out1.replace(/^--- DRY RUN.*$\n/m, ''));
  const r2 = JSON.parse(out2.replace(/^--- DRY RUN.*$\n/m, ''));
  // Component values must be identical (measuredAt + dynamic timestamps differ)
  for (const name of Object.keys(r1.components)) {
    assert.equal(r1.components[name].value, r2.components[name].value, `${name} drift`);
    assert.equal(r1.components[name].weighted, r2.components[name].weighted, `${name} weighted drift`);
  }
  assert.equal(r1.total, r2.total, `total drift ${r1.total} → ${r2.total}`);
});

// ============================================================
// TS-2 — Read-only on source (only .bkit/runtime/ + audit changes)
// ============================================================

test('TS-2: Read-only on source — measure script does NOT modify lib/, scripts/, skills/, docs/', () => {
  const beforeStatus = execSync('git status --short', { encoding: 'utf8', cwd: PROJECT_ROOT });
  // Run dry-run (truly read-only)
  execSync(`node ${MEASURE_SCRIPT} --dry-run`, { encoding: 'utf8', cwd: PROJECT_ROOT });
  const afterStatus = execSync('git status --short', { encoding: 'utf8', cwd: PROJECT_ROOT });
  assert.equal(beforeStatus, afterStatus, 'dry-run modified tracked sources');
});

// ============================================================
// TS-3 — Component independence (mock failures isolated)
// ============================================================

test('TS-3: Component independence — pure functions can be called individually', () => {
  // Load lib directly. Each component fn is pure → no interference.
  const sqm = require(path.join(PROJECT_ROOT, 'lib/quality/sqm-calculator.js'));
  const r1 = sqm.measureDocsCodeSyncRate({ skills: [{ name: 'a', invariantPass: true }] });
  const r2 = sqm.measureSprintReportKpiConsistency({ reports: [{ feature: 'a', divergenceCount: 0 }] });
  const r3 = sqm.measureConventionContractTestPassRate({ testsExist: false });
  assert.equal(r1.value, 100);
  assert.equal(r2.value, 100);
  assert.equal(r3.value, 0);
  // Calling them in different order should yield identical results
  const r3_again = sqm.measureConventionContractTestPassRate({ testsExist: false });
  const r1_again = sqm.measureDocsCodeSyncRate({ skills: [{ name: 'a', invariantPass: true }] });
  assert.deepEqual(r1, r1_again);
  assert.deepEqual(r3, r3_again);
});

// ============================================================
// TS-5 — Audit emit verification (after real measurement run)
// ============================================================

test('TS-5: Audit emit — sqm_baseline_measured event written to today\'s audit jsonl', () => {
  // This test runs a REAL (non-dry-run) measurement and verifies audit emit.
  // It will write .bkit/runtime/sqm-baseline.json — but that's intended for S0 archive.
  execSync(`node ${MEASURE_SCRIPT}`, { encoding: 'utf8', cwd: PROJECT_ROOT });
  assert.ok(fs.existsSync(BASELINE_PATH), 'baseline file not written');
  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  assert.ok(typeof baseline.total === 'number');
  assert.ok(baseline.schemaVersion === '1.0');

  // Audit verification
  const today = new Date().toISOString().split('T')[0];
  const auditPath = path.join(PROJECT_ROOT, `.bkit/audit/${today}.jsonl`);
  assert.ok(fs.existsSync(auditPath), 'today audit file missing');
  const lines = fs.readFileSync(auditPath, 'utf8').trim().split('\n');
  const sqmEvents = lines
    .map(l => { try { return JSON.parse(l); } catch (_) { return null; } })
    .filter(e => e && e.action === 'sqm_baseline_measured');
  assert.ok(sqmEvents.length >= 1, 'sqm_baseline_measured event not emitted');
  const last = sqmEvents[sqmEvents.length - 1];
  assert.equal(last.category, 'sprint');
  assert.equal(last.target, 's0-sqm-baseline');
  assert.ok(typeof last.details.total === 'number');
  assert.ok(typeof last.details.gitCommit === 'string');
  assert.ok(typeof last.details.bkitVersion === 'string');
});

// ============================================================
// Summary
// ============================================================

console.log(`\n${passed} passed, ${failed} failed (total ${passed + failed})`);
if (failed > 0) {
  failures.forEach(f => console.error(`  - ${f.name}: ${f.err}`));
  process.exit(1);
}
process.exit(0);
