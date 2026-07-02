#!/usr/bin/env node
/**
 * L1 Unit Tests — sprint-handler.js handleInit default L2 + L1 warning (F1-4)
 *
 * v2.1.26 (I-13, test isolation): every CLI invocation now runs against a
 * throwaway mkdtemp project root (cwd + CLAUDE_PROJECT_DIR both pointed at
 * it), so sprint state and audit writes NEVER touch the repo's real .bkit.
 * Pattern follows tests/contract/v2113-sprint-contracts.test.js SC-05.
 *
 * @module test/unit/sprint-handler/default-level-warning.test
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execSync } = require('node:child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const HANDLER = path.join(PROJECT_ROOT, 'scripts/sprint-handler.js');

// I-13: isolated tmp project root — all .bkit writes land here, never in the repo.
const TMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-f1-4-'));
const CHILD_OPTS = {
  encoding: 'utf8',
  cwd: TMP_ROOT,
  env: Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: TMP_ROOT }),
};
process.on('exit', () => {
  try { fs.rmSync(TMP_ROOT, { recursive: true, force: true }); } catch (_e) { /* best-effort */ }
});

let passed = 0, failed = 0;
const failures = [];

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; failures.push({ name, err: e.message }); console.log(`  ✗ ${name} — ${e.message}`); }
}

function cleanupSprint(id) {
  const f = path.join(TMP_ROOT, '.bkit/state/sprints', id + '.json');
  if (fs.existsSync(f)) fs.unlinkSync(f);
}

console.log('L1 F1-4 default L2 + L1 warning tests');

// ============================================================

test('TC-F1-4-U1: handleInit without --trust → trustLevelAtStart=L2', () => {
  cleanupSprint('test-f1-4-default');
  execSync(
    `node "${HANDLER}" init test-f1-4-default --name "DefaultTest"`,
    CHILD_OPTS
  );
  const state = JSON.parse(fs.readFileSync(
    path.join(TMP_ROOT, '.bkit/state/sprints/test-f1-4-default.json'),
    'utf8'
  ));
  assert.equal(state.autoRun.trustLevelAtStart, 'L2');
  cleanupSprint('test-f1-4-default');
});

test('TC-F1-4-U2: handleInit --trust L1 → trustLevelAtStart=L1', () => {
  cleanupSprint('test-f1-4-l1');
  execSync(
    `node "${HANDLER}" init test-f1-4-l1 --name "L1Test" --trust L1`,
    Object.assign({}, CHILD_OPTS, { stdio: ['ignore', 'pipe', 'pipe'] })
  );
  const state = JSON.parse(fs.readFileSync(
    path.join(TMP_ROOT, '.bkit/state/sprints/test-f1-4-l1.json'),
    'utf8'
  ));
  assert.equal(state.autoRun.trustLevelAtStart, 'L1');
  cleanupSprint('test-f1-4-l1');
});

test('TC-F1-4-U3: handleInit --trust L1 → stderr warning emitted', () => {
  cleanupSprint('test-f1-4-warn');
  let stderr = '';
  try {
    execSync(
      `node "${HANDLER}" init test-f1-4-warn --name "WarnTest" --trust L1 2>&1 1>/dev/null`,
      Object.assign({}, CHILD_OPTS, { shell: '/bin/sh' })
    );
  } catch (_) { /* may fail if shell mode differs */ }
  // Alternative: capture both stdout and stderr separately
  try {
    const proc = require('child_process').spawnSync(
      'node',
      [HANDLER, 'init', 'test-f1-4-warn2', '--name', 'Warn', '--trust', 'L1'],
      CHILD_OPTS
    );
    stderr = proc.stderr || '';
  } catch (_) {}
  cleanupSprint('test-f1-4-warn');
  cleanupSprint('test-f1-4-warn2');
  assert.match(stderr, /preview-mode lockout/i);
});

test('TC-F1-4-U4: handleInit --trust L1 → audit sprint_trust_warning emit', () => {
  cleanupSprint('test-f1-4-audit');
  execSync(
    `node "${HANDLER}" init test-f1-4-audit --name "AuditTest" --trust L1`,
    Object.assign({}, CHILD_OPTS, { stdio: ['ignore', 'pipe', 'pipe'] })
  );
  const today = new Date().toISOString().split('T')[0];
  const auditPath = path.join(TMP_ROOT, `.bkit/audit/${today}.jsonl`);
  const lines = fs.readFileSync(auditPath, 'utf8').trim().split('\n');
  const events = lines
    .map(l => { try { return JSON.parse(l); } catch (_) { return null; } })
    .filter(e => e && e.action === 'sprint_trust_warning' && e.target === 'test-f1-4-audit');
  assert.ok(events.length >= 1, 'sprint_trust_warning not emitted');
  const ev = events[events.length - 1];
  assert.equal(ev.details.attemptedLevel, 'L1');
  assert.match(ev.details.recommendedAction, /sprint trust .* --to L3/);
  cleanupSprint('test-f1-4-audit');
});

console.log(`\n${passed} passed, ${failed} failed (total ${passed + failed})`);
if (failed > 0) {
  failures.forEach(f => console.error(`  - ${f.name}: ${f.err}`));
  process.exit(1);
}
process.exit(0);
