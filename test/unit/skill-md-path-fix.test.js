#!/usr/bin/env node
/** L1 — F2-1 3 skills SKILL.md path fix verification (v2.1.19 S2, 4 TC) */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
let passed = 0, failed = 0;
function test(name, fn) { try { fn(); passed++; console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name} — ${e.message}`); } }

console.log('L1 F2-1 3 skills SKILL.md path fix tests');

test('TC-F2-1-P1: sprint SKILL.md declares bkit convention (bkit-root)', () => {
  const content = fs.readFileSync(path.join(PROJECT_ROOT, 'skills/sprint/SKILL.md'), 'utf8');
  // Post-F2-1: explicit bkit-root convention + Issue #107 reference
  assert.match(content, /<bkit-root>\/scripts\/sprint-handler\.js/, 'bkit-root convention not declared');
  assert.match(content, /#107/, 'Issue #107 reference missing');
});

test('TC-F2-1-P2: phase-3-mockup SKILL.md scripts/app.js exists only in code blocks (not declared)', () => {
  const content = fs.readFileSync(path.join(PROJECT_ROOT, 'skills/phase-3-mockup/SKILL.md'), 'utf8');
  // The reference exists, but only inside ```javascript ... ``` code blocks.
  // F2-2 stripCodeBlocks evolution eliminates this false positive.
  const checker = require(path.join(PROJECT_ROOT, 'scripts/check-skills-docs-code-sync.js'));
  const cleaned = checker.stripCodeBlocks(content);
  assert.ok(!cleaned.includes('scripts/app.js'),
    'phase-3-mockup outside code blocks still references scripts/app.js — false positive should be in code block only');
});

test('TC-F2-1-P3: phase-9-deployment SKILL.md scripts/check-env.js only in code blocks', () => {
  const content = fs.readFileSync(path.join(PROJECT_ROOT, 'skills/phase-9-deployment/SKILL.md'), 'utf8');
  const checker = require(path.join(PROJECT_ROOT, 'scripts/check-skills-docs-code-sync.js'));
  const cleaned = checker.stripCodeBlocks(content);
  assert.ok(!cleaned.includes('scripts/check-env.js'),
    'phase-9-deployment outside code blocks still references scripts/check-env.js');
});

test('TC-F2-1-P4: all 3 affected skills now PASS invariant check', () => {
  const checker = require(path.join(PROJECT_ROOT, 'scripts/check-skills-docs-code-sync.js'));
  for (const skill of ['sprint', 'phase-3-mockup', 'phase-9-deployment']) {
    const r = checker.evaluateSkillInvariant(skill);
    assert.equal(r.invariantPass, true, `${skill}: ${(r.failures || []).join('; ')}`);
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
