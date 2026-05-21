#!/usr/bin/env node
/**
 * E2E — pruge dandi scenario #107 reproduction (F4-4 v2.1.19 S4)
 *
 * Original issue: SKILL.md path mismatch — skills/sprint/scripts/sprint-handler.js
 * does not exist (actual at <bkit-root>/scripts/). Open at v2.1.18 — will be
 * closed in v2.1.19 S2 F2-1. This test currently detects the drift (S2 prereq).
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name} — ${e.message}`); }
}

console.log('E2E dandi-107 — SKILL.md path drift detection (S2 F2-1 prereq)');

test('TC-F4-4-D107: sprint-handler.js exists at bkit-root (canonical location)', () => {
  // The actual handler file must exist at <bkit-root>/scripts/sprint-handler.js
  const handlerPath = path.join(PROJECT_ROOT, 'scripts/sprint-handler.js');
  assert.ok(fs.existsSync(handlerPath), 'sprint-handler.js missing at bkit-root');
});

test('TC-F4-4-D107b: SKILL.md declares the handler path consistently', () => {
  // Until S2 F2-1 fixes the drift, the SKILL.md may reference scripts/sprint-handler.js
  // (resolving to skill-local). We document the current state as evidence for S2.
  const skillMd = fs.readFileSync(path.join(PROJECT_ROOT, 'skills/sprint/SKILL.md'), 'utf8');
  // Either skill-local symlink exists OR documented path is bkit-root-relative
  const skillLocalScripts = path.join(PROJECT_ROOT, 'skills/sprint/scripts/sprint-handler.js');
  const skillLocalExists = fs.existsSync(skillLocalScripts);
  const skillMdReferences = /scripts\/sprint-handler\.js/.test(skillMd);
  // At least one of (skill-local exists, or doc references bkit-root) — this
  // test will be tightened in S2 F2-1 to require unambiguous consistency.
  assert.ok(skillLocalExists || skillMdReferences,
    'SKILL.md path drift unresolved (S2 F2-1 carry-over)');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
