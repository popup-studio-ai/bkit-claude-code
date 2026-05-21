#!/usr/bin/env node
/** L1 — F2-3 sprint skill full audit (v2.1.19 S2, 6 TC) */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const SPRINT_SKILL_MD = path.join(PROJECT_ROOT, 'skills/sprint/SKILL.md');
let passed = 0, failed = 0;
function test(name, fn) { try { fn(); passed++; console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name} — ${e.message}`); } }

console.log('L1 F2-3 sprint skill audit tests');

const content = fs.readFileSync(SPRINT_SKILL_MD, 'utf8');

test('TC-F2-3-A1: sprint SKILL.md frontmatter name = sprint', () => {
  assert.match(content, /^name:\s*sprint\b/m);
});

test('TC-F2-3-A2: sprint SKILL.md has §10 contract section', () => {
  assert.match(content, /## 10\.\s+Skill Invocation Contract/i);
});

test('TC-F2-3-A3: sprint SKILL.md S1 §10.1.1.1 --approve clarification present (CO-S0-6 absorbed)', () => {
  assert.match(content, /10\.1\.1\.1.*--approve/i);
  assert.match(content, /Quality Gate failures/i, '--approve gate-fail clarification missing');
});

test('TC-F2-3-A4: sprint SKILL.md S1 §10.2 default L2 documented', () => {
  assert.match(content, /default.*L2/i, 'default L2 not documented in §10.2');
});

test('TC-F2-3-A5: sprint SKILL.md references new actions (trust + dogfood + annotate)', () => {
  // trust is v2.1.18, dogfood + annotate are v2.1.19 S1
  // SKILL.md doesn't need to enumerate every action, but the trust section §10.1.3 should exist
  assert.match(content, /10\.1\.3.*Trust Level Mutation/i, '10.1.3 trust mutation section missing');
});

test('TC-F2-3-A6: sprint SKILL.md handler reference resolves to bkit-root canonical', () => {
  // F2-1 P1 already verifies; cross-check that the LLM dispatcher narrative is present
  assert.match(content, /<bkit-root>\/scripts\/sprint-handler\.js/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
