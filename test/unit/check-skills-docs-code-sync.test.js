#!/usr/bin/env node
/**
 * L1+L3 Tests — scripts/check-skills-docs-code-sync.js (F2-2 v2.1.19 S2)
 *
 * 17 TC covering stripCodeBlocks + findHandlerReferences +
 * evaluateSkillInvariant + checkAll. Closes #107 regression test.
 */
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { execSync } = require('node:child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const CHECKER = path.join(PROJECT_ROOT, 'scripts/check-skills-docs-code-sync.js');
const checker = require(CHECKER);

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name} — ${e.message}`); }
}

console.log('L1+L3 F2-2 check-skills-docs-code-sync tests');

// === stripCodeBlocks (5 TC) ===
test('TC-F2-2-S1: stripCodeBlocks — no fences returns input unchanged', () => {
  const input = 'line1\nline2\nline3';
  assert.equal(checker.stripCodeBlocks(input), input);
});

test('TC-F2-2-S2: stripCodeBlocks — single fenced block stripped', () => {
  const input = 'prefix\n```js\ncode\n```\nsuffix';
  const out = checker.stripCodeBlocks(input);
  assert.ok(!out.includes('code'));
  assert.ok(out.includes('prefix') && out.includes('suffix'));
});

test('TC-F2-2-S3: stripCodeBlocks — multi-fence preserves line count', () => {
  const input = 'a\n```\nx\n```\nb\n```\ny\n```\nc';
  const out = checker.stripCodeBlocks(input);
  assert.equal(out.split('\n').length, input.split('\n').length);
});

test('TC-F2-2-S4: stripCodeBlocks — references inside code blocks ignored', () => {
  const input = 'preamble\n```js\n// scripts/app.js\nfunction x(){}\n```\nepilogue';
  const out = checker.stripCodeBlocks(input);
  assert.ok(!out.includes('scripts/app.js'), 'code-block reference leaked');
});

test('TC-F2-2-S5: stripCodeBlocks — unclosed fence treated as code block to EOF', () => {
  const input = 'prefix\n```\nfoo\nbar';
  const out = checker.stripCodeBlocks(input);
  assert.ok(!out.includes('foo'));
  assert.ok(!out.includes('bar'));
});

// === findHandlerReferences (3 TC) ===
test('TC-F2-2-F1: findHandlerReferences — single ref', () => {
  const refs = checker.findHandlerReferences('text scripts/foo.js more');
  assert.deepEqual(refs, ['scripts/foo.js']);
});

test('TC-F2-2-F2: findHandlerReferences — multiple unique refs', () => {
  const refs = checker.findHandlerReferences('scripts/a.js text scripts/b.js text scripts/a.js');
  assert.deepEqual(refs.sort(), ['scripts/a.js', 'scripts/b.js']);
});

test('TC-F2-2-F3: findHandlerReferences — bare `scripts/` without .js extension ignored', () => {
  const refs = checker.findHandlerReferences('scripts/ dir not handler');
  assert.deepEqual(refs, []);
});

// === extractFrontmatter (2 TC) ===
test('TC-F2-2-FM1: extractFrontmatter — valid frontmatter', () => {
  const fm = checker.extractFrontmatter('---\nname: foo\nbar: baz\n---\n\ncontent');
  assert.ok(fm.includes('name: foo'));
});

test('TC-F2-2-FM2: extractFrontmatter — missing frontmatter returns null', () => {
  const fm = checker.extractFrontmatter('# Title\n\nNo frontmatter');
  assert.equal(fm, null);
});

// === evaluateSkillInvariant (4 TC) ===
test('TC-F2-2-E1: evaluateSkillInvariant — sprint skill PASS (post F2-1 fix)', () => {
  const r = checker.evaluateSkillInvariant('sprint');
  assert.equal(r.invariantPass, true, `failures: ${(r.failures||[]).join('; ')}`);
});

test('TC-F2-2-E2: evaluateSkillInvariant — phase-3-mockup PASS (false positive eliminated)', () => {
  const r = checker.evaluateSkillInvariant('phase-3-mockup');
  assert.equal(r.invariantPass, true, `failures: ${(r.failures||[]).join('; ')}`);
});

test('TC-F2-2-E3: evaluateSkillInvariant — phase-9-deployment PASS (false positive eliminated)', () => {
  const r = checker.evaluateSkillInvariant('phase-9-deployment');
  assert.equal(r.invariantPass, true, `failures: ${(r.failures||[]).join('; ')}`);
});

test('TC-F2-2-E4: evaluateSkillInvariant — nonexistent skill → missing SKILL.md', () => {
  const r = checker.evaluateSkillInvariant('___nonexistent___');
  assert.equal(r.invariantPass, false);
  assert.ok(r.failures.some(f => f.includes('SKILL.md missing')));
});

// === checkAll + CLI (3 TC) ===
test('TC-F2-2-A1: checkAll — 44 skills PASS (post v2.1.19 S2)', () => {
  const r = checker.checkAll();
  assert.equal(r.ok, true, `${r.failed} failures: ${JSON.stringify(r.failures.slice(0, 3))}`);
  assert.ok(r.total >= 40, `expected ≥40 skills, got ${r.total}`);
  assert.equal(r.passed, r.total);
});

test('TC-F2-2-A2: CLI --json output schema', () => {
  const out = execSync(`node "${CHECKER}" --json`, { encoding: 'utf8', cwd: PROJECT_ROOT });
  const r = JSON.parse(out);
  for (const k of ['ok', 'total', 'passed', 'failed', 'failures', 'exitCode']) {
    assert.ok(k in r, `missing key: ${k}`);
  }
});

test('TC-F2-2-A3: CLI exit code 0 on PASS', () => {
  let exitCode = 0;
  try { execSync(`node "${CHECKER}"`, { encoding: 'utf8', cwd: PROJECT_ROOT, stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { exitCode = e.status; }
  assert.equal(exitCode, 0);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
