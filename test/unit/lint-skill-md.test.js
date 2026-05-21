#!/usr/bin/env node
/** L1 — scripts/lint-skill-md.js (F2-5 v2.1.19 S2, 3 TC) */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const linter = require(path.join(PROJECT_ROOT, 'scripts/lint-skill-md.js'));
let passed = 0, failed = 0;
function test(name, fn) { try { fn(); passed++; console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name} — ${e.message}`); } }

console.log('L1 F2-5 lint-skill-md tests');

test('TC-F2-5-L1: extractSkillNameFromPath — valid path', () => {
  assert.equal(linter.extractSkillNameFromPath('skills/sprint/SKILL.md'), 'sprint');
  assert.equal(linter.extractSkillNameFromPath('/abs/path/skills/phase-3-mockup/SKILL.md'), 'phase-3-mockup');
});

test('TC-F2-5-L2: extractSkillNameFromPath — non-SKILL paths return null', () => {
  assert.equal(linter.extractSkillNameFromPath('lib/quality/sqm-calculator.js'), null);
  assert.equal(linter.extractSkillNameFromPath('skills/sprint/PHASES.md'), null);
  assert.equal(linter.extractSkillNameFromPath(null), null);
});

test('TC-F2-5-L3: lintBySkillName — sprint skill PASS (post F2-1)', () => {
  const r = linter.lintBySkillName('sprint');
  assert.equal(r.ok, true, `failures: ${(r.warnings||[]).join('; ')}`);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
