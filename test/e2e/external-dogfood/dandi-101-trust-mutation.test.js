#!/usr/bin/env node
/**
 * E2E — pruge dandi scenario #101 reproduction (F4-4 v2.1.19 S4)
 *
 * Original issue: L1 sprint trust mutation command missing — permanent
 * preview-mode lockout. Closed in v2.1.18 via /sprint trust.
 */
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { execSync } = require('node:child_process');

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

console.log('E2E dandi-101 — /sprint trust mutation regression lock');

test('TC-F4-4-D101: L1 sprint can escape via /sprint trust --to L3 (no re-init)', () => {
  cleanup('dandi-101-repro');
  // Step 1: init L1
  execSync(`node "${HANDLER}" init dandi-101-repro --name "Reproduction" --trust L1`, {
    encoding: 'utf8', cwd: PROJECT_ROOT, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let state = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, '.bkit/state/sprints/dandi-101-repro.json'), 'utf8'));
  assert.equal(state.autoRun.trustLevelAtStart, 'L1');

  // Step 2: trust mutation L1 → L3
  execSync(`node "${HANDLER}" trust dandi-101-repro --to L3 --reason "pruge dandi e2e reproduction"`, {
    encoding: 'utf8', cwd: PROJECT_ROOT,
  });
  state = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, '.bkit/state/sprints/dandi-101-repro.json'), 'utf8'));
  assert.equal(state.autoRun.trustLevelAtStart, 'L3', 'trust mutation failed');

  // Step 3: phaseHistory preserved (not destroyed by re-init)
  // (init creates 0-length phaseHistory, but the point is we didn't re-init)
  assert.ok(Array.isArray(state.phaseHistory), 'phaseHistory missing');

  cleanup('dandi-101-repro');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
