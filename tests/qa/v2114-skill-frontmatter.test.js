'use strict';

/**
 * v2114-skill-frontmatter.test.js — L1 tests for ENH-291 (1536-char cap).
 *
 * Coverage (12 TCs):
 *   EX  — extractDescription block vs single (5 TCs)
 *   CAP — 1536-char cap value + ≤ semantics (3 TCs)
 *   WLK — walkSkills directory traversal (2 TCs)
 *   API — module surface (2 TCs)
 *
 * Run: node tests/qa/v2114-skill-frontmatter.test.js
 */

const assert = require('node:assert/strict');
const path = require('node:path');

const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const sc = require(path.join(PLUGIN_ROOT, 'scripts/check-skill-frontmatter'));

let pass = 0, fail = 0, total = 0;
const failures = [];

function test(name, fn) {
  total += 1;
  try { fn(); pass += 1; }
  catch (e) { fail += 1; failures.push({ name, error: e.message }); }
}

// ── EX: extractDescription ─────────────────────────────────────────

test('EX-01: single-line description', () => {
  const src = '---\nname: x\ndescription: hello world\n---\nbody';
  const r = sc.extractDescription(src);
  assert.equal(r.mode, 'single');
  assert.equal(r.description, 'hello world');
});

test('EX-02: block scalar with pipe (|)', () => {
  const src = '---\nname: x\ndescription: |\n  line one\n  line two\nallowed-tools: foo\n---';
  const r = sc.extractDescription(src);
  assert.equal(r.mode, 'block');
  assert.match(r.description, /line one/);
  assert.match(r.description, /line two/);
});

test('EX-03: block scalar with folded (>)', () => {
  const src = '---\nname: x\ndescription: >\n  multi\n  line\nmodel: opus\n---';
  const r = sc.extractDescription(src);
  assert.equal(r.mode, 'block');
  assert.match(r.description, /multi/);
});

test('EX-04: missing description → mode=missing', () => {
  const src = '---\nname: x\n---\nbody';
  const r = sc.extractDescription(src);
  assert.equal(r.mode, 'missing');
  assert.equal(r.description, '');
});

test('EX-05: block scalar terminates at next top-level key', () => {
  const src = '---\ndescription: |\n  line a\n  line b\nname: end\n---';
  const r = sc.extractDescription(src);
  assert.ok(r.description.includes('line a'));
  assert.ok(r.description.includes('line b'));
  assert.ok(!r.description.includes('name:'));
});

// ── CAP: 1536-char cap ─────────────────────────────────────────────

test('CAP-01: SKILL_DESCRIPTION_CAP = 1536', () => {
  assert.equal(sc.SKILL_DESCRIPTION_CAP, 1536);
});

test('CAP-02: cap not 250 (over-engineered baseline rejected)', () => {
  assert.notEqual(sc.SKILL_DESCRIPTION_CAP, 250);
});

test('CAP-03: cap not 200 or 256 (off-by-one baselines)', () => {
  assert.notEqual(sc.SKILL_DESCRIPTION_CAP, 200);
  assert.notEqual(sc.SKILL_DESCRIPTION_CAP, 256);
});

// ── WLK: walkSkills ────────────────────────────────────────────────

test('WLK-01: walkSkills yields project skills', () => {
  const SKILLS_DIR = path.resolve(__dirname, '../../skills');
  const items = Array.from(sc.walkSkills(SKILLS_DIR));
  assert.ok(items.length >= 10, 'expected at least 10 skills, got ' + items.length);
  for (const { name, file } of items) {
    assert.equal(typeof name, 'string');
    assert.ok(file.endsWith('SKILL.md'));
  }
});

test('WLK-02: walkSkills with missing dir yields nothing', () => {
  const items = Array.from(sc.walkSkills('/no/such/dir/12345'));
  assert.equal(items.length, 0);
});

// ── API: module surface ────────────────────────────────────────────

test('API-01: exports include public surface', () => {
  assert.equal(typeof sc.extractDescription, 'function');
  assert.equal(typeof sc.walkSkills, 'function');
  assert.equal(typeof sc.SKILL_DESCRIPTION_CAP, 'number');
});

test('API-02: all bkit project skills pass the 1536-char cap', () => {
  const SKILLS_DIR = path.resolve(__dirname, '../../skills');
  for (const { name, file } of sc.walkSkills(SKILLS_DIR)) {
    const fs = require('fs');
    const src = fs.readFileSync(file, 'utf8');
    const r = sc.extractDescription(src);
    assert.ok(r.description.length <= sc.SKILL_DESCRIPTION_CAP,
      name + ' description ' + r.description.length + ' exceeds ' + sc.SKILL_DESCRIPTION_CAP);
  }
});

// ── Summary ────────────────────────────────────────────────────────

console.log(`\n[v2114 L1 skill-frontmatter] total=${total} pass=${pass} fail=${fail}`);
if (fail > 0) {
  for (const f of failures) console.error('  ✗', f.name + ':', f.error);
  process.exit(1);
}
console.log('✓ all PASS');
process.exit(0);
