#!/usr/bin/env node
/** L2 Contract — skills-convention baseline freeze test (F2-4 v2.1.19 S2) */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const BASELINE = path.join(PROJECT_ROOT, 'test/contract/baseline/skills-convention.json');
const checker = require(path.join(PROJECT_ROOT, 'scripts/check-skills-docs-code-sync.js'));
let passed = 0, failed = 0;
function test(name, fn) { try { fn(); passed++; console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name} — ${e.message}`); } }

console.log('L2 F2-4 skills-convention baseline tests');

test('TC-F2-4-B1: baseline file exists with valid JSON', () => {
  assert.ok(fs.existsSync(BASELINE), 'baseline JSON missing');
  const data = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  assert.equal(data.schemaVersion, '1.0');
  assert.ok(Array.isArray(data.skills));
});

test('TC-F2-4-B2: baseline schema fields present', () => {
  const data = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  for (const k of ['schemaVersion', 'frozenAt', 'bkitVersion', 'skillsCount', 'skills']) {
    assert.ok(k in data, `missing top-level: ${k}`);
  }
});

test('TC-F2-4-B3: baseline has ≥40 skills, each with expected shape', () => {
  const data = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  assert.ok(data.skills.length >= 40, `expected ≥40, got ${data.skills.length}`);
  for (const skill of data.skills) {
    assert.ok(skill.name, 'skill missing name');
    assert.ok(skill.expected, 'skill missing expected');
    assert.ok('hasSKILLmd' in skill.expected);
    assert.ok(Array.isArray(skill.expected.handlerReferences));
  }
});

test('TC-F2-4-B4: live SKILL.md state matches baseline (no drift since freeze)', () => {
  const data = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  const drift = [];
  for (const skill of data.skills) {
    const live = checker.evaluateSkillInvariant(skill.name);
    // Compare current handler references against baseline
    const liveContent = fs.existsSync(live.skillMdPath) ? fs.readFileSync(live.skillMdPath, 'utf8') : '';
    const liveRefs = checker.findHandlerReferences(checker.stripCodeBlocks(liveContent)).sort();
    if (JSON.stringify(liveRefs) !== JSON.stringify(skill.expected.handlerReferences)) {
      drift.push({ name: skill.name, expected: skill.expected.handlerReferences, actual: liveRefs });
    }
  }
  assert.equal(drift.length, 0, `drift detected: ${JSON.stringify(drift.slice(0,3))}`);
});

test('TC-F2-4-B5: sprint skill expected handler reference is scripts/sprint-handler.js', () => {
  const data = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  const sprintEntry = data.skills.find(s => s.name === 'sprint');
  assert.ok(sprintEntry, 'sprint skill missing from baseline');
  assert.ok(sprintEntry.expected.handlerReferences.includes('scripts/sprint-handler.js'),
    `sprint handler ref missing in baseline: ${JSON.stringify(sprintEntry.expected.handlerReferences)}`);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
