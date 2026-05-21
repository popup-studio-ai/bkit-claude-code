#!/usr/bin/env node
/**
 * L1 Unit Tests — sprint-handler.js dogfood action (F1-2 v2.1.19 S1)
 *
 * @module test/unit/sprint-handler/dogfood-action.test
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const HANDLER = path.join(PROJECT_ROOT, 'scripts/sprint-handler.js');

let passed = 0, failed = 0;
const failures = [];

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; failures.push({ name, err: e.message }); console.log(`  ✗ ${name} — ${e.message}`); }
}

function cleanupSprint(id) {
  const f = path.join(PROJECT_ROOT, '.bkit/state/sprints', id + '.json');
  if (fs.existsSync(f)) fs.unlinkSync(f);
}

console.log('L1 F1-2 dogfood action tests');

// ============================================================

test('TC-F1-2-U1: handleDogfood valid args creates sprint state', () => {
  cleanupSprint('self-dogfood-2.1.99-u1');
  const out = execSync(
    `node "${HANDLER}" dogfood v2.1.99-u1 --release-tag v2.1.99-u1`,
    { encoding: 'utf8', cwd: PROJECT_ROOT }
  );
  const result = JSON.parse(out);
  assert.equal(result.ok, true);
  assert.equal(result.sprintId, 'self-dogfood-2.1.99-u1');
  // state file actually created
  const statePath = path.join(PROJECT_ROOT, '.bkit/state/sprints/self-dogfood-2.1.99-u1.json');
  assert.ok(fs.existsSync(statePath));
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  assert.equal(state.phase, 'prd');
  assert.equal(state.autoRun.trustLevelAtStart, 'L4');
  assert.equal(state.features[0], 'release-2.1.99-u1');
  // Context anchor populated
  assert.ok(state.context.WHY.length > 0);
  assert.ok(state.context.SUCCESS.length > 0);
  cleanupSprint('self-dogfood-2.1.99-u1');
});

test('TC-F1-2-U2: --dry-run no state mutation', () => {
  cleanupSprint('self-dogfood-2.1.99-u2');
  const out = execSync(
    `node "${HANDLER}" dogfood v2.1.99-u2 --release-tag v2.1.99-u2 --dry-run`,
    { encoding: 'utf8', cwd: PROJECT_ROOT }
  );
  const result = JSON.parse(out);
  assert.equal(result.ok, true);
  assert.equal(result.dryRun, true);
  assert.ok(result.preview);
  assert.equal(result.preview.sprintId, 'self-dogfood-2.1.99-u2');
  // No state file should have been written
  const statePath = path.join(PROJECT_ROOT, '.bkit/state/sprints/self-dogfood-2.1.99-u2.json');
  assert.ok(!fs.existsSync(statePath), 'dry-run wrote state file');
});

test('TC-F1-2-U3: without --release-tag → error', () => {
  let exitCode = 0;
  let out = '';
  try {
    out = execSync(
      `node "${HANDLER}" dogfood v2.1.99-u3`,
      { encoding: 'utf8', cwd: PROJECT_ROOT, stdio: ['ignore', 'pipe', 'pipe'] }
    );
  } catch (e) {
    exitCode = e.status;
    out = e.stdout && e.stdout.toString();
  }
  assert.equal(exitCode, 1);
  const result = JSON.parse(out);
  assert.equal(result.ok, false);
  assert.match(result.error, /release-tag/);
});

test('TC-F1-2-U4: non-semver releaseVersion → error', () => {
  let exitCode = 0;
  let out = '';
  try {
    out = execSync(
      `node "${HANDLER}" dogfood not-a-semver --release-tag v0`,
      { encoding: 'utf8', cwd: PROJECT_ROOT, stdio: ['ignore', 'pipe', 'pipe'] }
    );
  } catch (e) {
    exitCode = e.status;
    out = e.stdout && e.stdout.toString();
  }
  assert.equal(exitCode, 1);
  const result = JSON.parse(out);
  assert.equal(result.ok, false);
  assert.match(result.error, /semver/);
});

test('TC-F1-2-U5: emits sprint_dogfood_started audit event', () => {
  cleanupSprint('self-dogfood-2.1.99-u5');
  execSync(
    `node "${HANDLER}" dogfood v2.1.99-u5 --release-tag v2.1.99-u5`,
    { encoding: 'utf8', cwd: PROJECT_ROOT }
  );
  const today = new Date().toISOString().split('T')[0];
  const auditPath = path.join(PROJECT_ROOT, `.bkit/audit/${today}.jsonl`);
  assert.ok(fs.existsSync(auditPath));
  const lines = fs.readFileSync(auditPath, 'utf8').trim().split('\n');
  const events = lines
    .map(l => { try { return JSON.parse(l); } catch (_) { return null; } })
    .filter(e => e && e.action === 'sprint_dogfood_started' && e.target === 'self-dogfood-2.1.99-u5');
  assert.ok(events.length >= 1, 'sprint_dogfood_started not emitted');
  const ev = events[events.length - 1];
  assert.equal(ev.details.releaseVersion, 'v2.1.99-u5');
  assert.ok(ev.details.bkitVersion);
  cleanupSprint('self-dogfood-2.1.99-u5');
});

test('TC-F1-2-U6: idempotency — same id graceful skip', () => {
  cleanupSprint('self-dogfood-2.1.99-u6');
  execSync(`node "${HANDLER}" dogfood v2.1.99-u6 --release-tag v2.1.99-u6`, { encoding: 'utf8', cwd: PROJECT_ROOT });
  const out2 = execSync(
    `node "${HANDLER}" dogfood v2.1.99-u6 --release-tag v2.1.99-u6`,
    { encoding: 'utf8', cwd: PROJECT_ROOT }
  );
  const result2 = JSON.parse(out2);
  assert.equal(result2.ok, true);
  assert.equal(result2.skipped, true);
  assert.equal(result2.existingPhase, 'prd');
  cleanupSprint('self-dogfood-2.1.99-u6');
});

console.log(`\n${passed} passed, ${failed} failed (total ${passed + failed})`);
if (failed > 0) {
  failures.forEach(f => console.error(`  - ${f.name}: ${f.err}`));
  process.exit(1);
}
process.exit(0);
