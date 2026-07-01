#!/usr/bin/env node
'use strict';

/**
 * Unit tests for lib/core/skill-name.js — normalizeSkillName (Issue #125).
 * Guards the plugin:skill → bare folder canonicalization that makes namespaced
 * skill invocations resolve their SKILL.md / registries instead of ENOENT.
 */

const assert = require('assert');

let passed = 0, failed = 0, total = 0;
function test(id, description, fn) {
  total++;
  try { fn(); passed++; }
  catch (err) { failed++; console.error(`  FAIL ${id}: ${description}\n    ${err.message}`); }
}

console.log('\n=== Skill Name Canonicalizer Unit Tests (#125) ===\n');

const { normalizeSkillName } = require('../../lib/core/skill-name');

test('SN-001', 'strips the bkit: namespace prefix', () => {
  assert.strictEqual(normalizeSkillName('bkit:pdca'), 'pdca');
});

test('SN-002', 'leaves a bare name unchanged', () => {
  assert.strictEqual(normalizeSkillName('pdca'), 'pdca');
});

test('SN-003', 'handles hyphenated skill names (bkit:code-review)', () => {
  assert.strictEqual(normalizeSkillName('bkit:code-review'), 'code-review');
});

test('SN-004', 'handles a different plugin namespace (bkit-starter:first-claude-code)', () => {
  assert.strictEqual(normalizeSkillName('bkit-starter:first-claude-code'), 'first-claude-code');
});

test('SN-005', 'takes the final segment for multi-colon input', () => {
  assert.strictEqual(normalizeSkillName('a:b:skill'), 'skill');
});

test('SN-006', 'empty string stays empty', () => {
  assert.strictEqual(normalizeSkillName(''), '');
});

test('SN-007', 'null passes through null (null-safe for detection helpers)', () => {
  assert.strictEqual(normalizeSkillName(null), null);
});

test('SN-008', 'undefined passes through undefined', () => {
  assert.strictEqual(normalizeSkillName(undefined), undefined);
});

test('SN-009', 'non-string (number) passes through unchanged', () => {
  assert.strictEqual(normalizeSkillName(42), 42);
});

test('SN-010', 'trailing colon yields empty (malformed input, no crash)', () => {
  assert.strictEqual(normalizeSkillName('bkit:'), '');
});

test('SN-011', 'idempotent — normalizing a bare result is a no-op', () => {
  const once = normalizeSkillName('bkit:sprint');
  assert.strictEqual(normalizeSkillName(once), once);
});

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
