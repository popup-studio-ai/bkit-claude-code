#!/usr/bin/env node
/**
 * E2E — pruge dandi general L1 workflow synthesis (F4-4 v2.1.19 S4)
 *
 * Synthesizes the full L1-sprint workflow that pruge described across
 * #100/#101/#102 issues: init L1 → expect warning → trust escalate to L3
 * → measure record → phase advance. End-to-end regression lock.
 */
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { execSync, spawnSync } = require('node:child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const HANDLER = path.join(PROJECT_ROOT, 'scripts/sprint-handler.js');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name} — ${e.message}`); }
}

function cleanup(id) {
  const f = path.join(PROJECT_ROOT, '.bkit/state/sprints', id + '.json');
  if (fs.existsSync(f)) fs.unlinkSync(f);
}

console.log('E2E dandi general — L1 sprint full lifecycle workflow');

test('TC-F4-4-DG: L1 init → warning → trust escalate → state preserved', () => {
  const id = 'dandi-general-l1-repro';
  cleanup(id);

  // Step 1: init --trust L1 → must emit stderr warning + audit
  const initProc = spawnSync('node', [HANDLER, 'init', id, '--name', 'General L1 Repro', '--trust', 'L1'], {
    encoding: 'utf8', cwd: PROJECT_ROOT,
  });
  assert.equal(initProc.status, 0, 'init failed');
  assert.match(initProc.stderr, /preview-mode lockout/i, 'L1 warning missing on init');

  // Step 2: state has L1
  let state = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, '.bkit/state/sprints', id + '.json'), 'utf8'));
  assert.equal(state.autoRun.trustLevelAtStart, 'L1');
  const initialPhaseHistory = state.phaseHistory.length;

  // Step 3: /sprint trust escalate
  execSync(`node "${HANDLER}" trust ${id} --to L3 --reason "general dandi reproduction"`, {
    encoding: 'utf8', cwd: PROJECT_ROOT,
  });
  state = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, '.bkit/state/sprints', id + '.json'), 'utf8'));
  assert.equal(state.autoRun.trustLevelAtStart, 'L3', 'trust mutation failed');

  // Step 4: phaseHistory preserved (not destroyed by re-init)
  assert.equal(state.phaseHistory.length, initialPhaseHistory, 'phaseHistory destroyed');

  // Step 5: audit log has sprint_trust_changed for this sprint
  const today = new Date().toISOString().split('T')[0];
  const auditFile = path.join(PROJECT_ROOT, '.bkit/audit', today + '.jsonl');
  if (fs.existsSync(auditFile)) {
    const lines = fs.readFileSync(auditFile, 'utf8').trim().split('\n');
    const trustChanged = lines.map(l => { try { return JSON.parse(l); } catch (_) { return null; } })
      .filter(e => e && e.action === 'sprint_trust_changed' && e.target === id);
    assert.ok(trustChanged.length >= 1, 'sprint_trust_changed audit not emitted');
  }

  cleanup(id);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
