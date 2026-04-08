#!/usr/bin/env node
'use strict';

/**
 * Regression Test: 37 Skill Directories
 *
 * Verifies that all expected skill directories exist in skills/
 * and each contains a SKILL.md file.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const SKILLS_DIR = path.join(ROOT, 'skills');

let passed = 0, failed = 0, total = 0;

function test(id, desc, fn) {
  total++;
  try { fn(); passed++; } catch (e) { failed++; console.error(`  FAIL ${id}: ${desc}\n    ${e.message}`); }
}

console.log('\n=== Skills-37 Regression Tests ===\n');

// ---------------------------------------------------------------------------
// Read all skill directories
// ---------------------------------------------------------------------------

const skillDirs = fs.readdirSync(SKILLS_DIR).filter(d => {
  const fullPath = path.join(SKILLS_DIR, d);
  return fs.statSync(fullPath).isDirectory();
}).sort();

// ---------------------------------------------------------------------------
// T01: At least 37 skill directories exist
// ---------------------------------------------------------------------------

test('SKL-01', 'At least 37 skill directories exist', () => {
  assert.ok(skillDirs.length >= 37,
    `Expected >= 37 skill directories, got ${skillDirs.length}: ${skillDirs.join(', ')}`);
});

// ---------------------------------------------------------------------------
// T02: Each skill directory has a SKILL.md
// ---------------------------------------------------------------------------

test('SKL-02', 'Each skill directory contains SKILL.md', () => {
  const missing = [];
  for (const dir of skillDirs) {
    const skillMd = path.join(SKILLS_DIR, dir, 'SKILL.md');
    if (!fs.existsSync(skillMd)) {
      missing.push(dir);
    }
  }
  assert.strictEqual(missing.length, 0, `Skills missing SKILL.md:\n    ${missing.join('\n    ')}`);
});

// ---------------------------------------------------------------------------
// T03: deploy skill exists (was missing from skills-36.test.js)
// ---------------------------------------------------------------------------

test('SKL-03', 'deploy skill exists', () => {
  assert.ok(skillDirs.includes('deploy'), 'deploy skill directory not found');
  assert.ok(fs.existsSync(path.join(SKILLS_DIR, 'deploy', 'SKILL.md')), 'deploy/SKILL.md not found');
});

// ---------------------------------------------------------------------------
// T04: Critical skills exist
// ---------------------------------------------------------------------------

test('SKL-04', 'Critical skills exist (pdca, code-review, plan-plus, control, audit)', () => {
  const required = ['pdca', 'code-review', 'plan-plus', 'control', 'audit'];
  const missing = required.filter(s => !skillDirs.includes(s));
  assert.strictEqual(missing.length, 0, `Missing critical skills: ${missing.join(', ')}`);
});

// ---------------------------------------------------------------------------
// T05: No duplicate skill directory names
// ---------------------------------------------------------------------------

test('SKL-05', 'No duplicate skill directory names', () => {
  const dupes = skillDirs.filter((s, i) => skillDirs.indexOf(s) !== i);
  assert.strictEqual(dupes.length, 0, `Duplicate skills: ${dupes.join(', ')}`);
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
