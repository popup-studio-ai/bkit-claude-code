#!/usr/bin/env node
/**
 * E2E — pruge dandi scenario #102 reproduction (F4-4 v2.1.19 S4)
 *
 * Original issue: --trust silently ignored, only --trustLevel honored.
 * Closed in v2.1.18 (normalizeTrustLevel unification).
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

console.log('E2E dandi-102 — --trust CLI alias regression lock');

test('TC-F4-4-D102: --trust L3 (CLI alias) is honored (not silently ignored)', () => {
  cleanup('dandi-102-repro');
  execSync(`node "${HANDLER}" init dandi-102-repro --name "Repro" --trust L3`, {
    encoding: 'utf8', cwd: PROJECT_ROOT,
  });
  const state = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, '.bkit/state/sprints/dandi-102-repro.json'), 'utf8'));
  // Pre-v2.1.18: --trust silently ignored, fallback to DEFAULT_TRUST_LEVEL
  // Post-v2.1.18: --trust L3 honored
  // Post-v2.1.19 S1 F1-4: default L2 (not L3), so L3 must be explicit
  assert.equal(state.autoRun.trustLevelAtStart, 'L3', '--trust alias not honored');
  cleanup('dandi-102-repro');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
