#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');
let passed = 0, failed = 0, total = 0;

function test(id, desc, fn) {
  total++;
  try { fn(); passed++; } catch (e) { failed++; console.error(`  FAIL ${id}: ${desc}\n    ${e.message}`); }
}

console.log('\n=== Decision Tracer Full Coverage Tests ===\n');

// ── Setup: stub platform dependency ───────────────────────────────────────

const projectRoot = path.resolve(__dirname, '../..');
const platformPath = require.resolve(projectRoot + '/lib/core/platform');
const originalPlatformExports = require.cache[platformPath];
require.cache[platformPath] = {
  id: platformPath, filename: platformPath, loaded: true,
  exports: { PROJECT_DIR: '/tmp/decision-tracer-test' },
};

const tracer = require(projectRoot + '/lib/audit/decision-tracer');

// ── Tests: Constants ──────────────────────────────────────────────────────

// TC-01: IMPACT_LEVELS — is an array with expected values
test('TC-01', 'IMPACT_LEVELS is an array of 4 levels', () => {
  assert.ok(Array.isArray(tracer.IMPACT_LEVELS));
  assert.strictEqual(tracer.IMPACT_LEVELS.length, 4);
  assert.ok(tracer.IMPACT_LEVELS.includes('low'));
  assert.ok(tracer.IMPACT_LEVELS.includes('medium'));
  assert.ok(tracer.IMPACT_LEVELS.includes('high'));
  assert.ok(tracer.IMPACT_LEVELS.includes('critical'));
});

// TC-02: OUTCOMES — is an array with expected values
test('TC-02', 'OUTCOMES is an array of 3 outcomes', () => {
  assert.ok(Array.isArray(tracer.OUTCOMES));
  assert.strictEqual(tracer.OUTCOMES.length, 3);
  assert.ok(tracer.OUTCOMES.includes('positive'));
  assert.ok(tracer.OUTCOMES.includes('neutral'));
  assert.ok(tracer.OUTCOMES.includes('negative'));
});

// ── Tests: getDecisionsDir ────────────────────────────────────────────────

// TC-03: getDecisionsDir — returns string ending with decisions
test('TC-03', 'getDecisionsDir returns path ending with .bkit/decisions', () => {
  const dir = tracer.getDecisionsDir();
  assert.strictEqual(typeof dir, 'string');
  assert.ok(dir.endsWith(path.join('.bkit', 'decisions')));
});

// ── Tests: getDecisionsFilePath ───────────────────────────────────────────

// TC-04: getDecisionsFilePath — returns JSONL path for today
test('TC-04', 'getDecisionsFilePath returns .jsonl path for today', () => {
  const fp = tracer.getDecisionsFilePath();
  assert.strictEqual(typeof fp, 'string');
  assert.ok(fp.endsWith('.jsonl'));
  const today = new Date().toISOString().slice(0, 10);
  assert.ok(fp.includes(today));
});

// TC-05: getDecisionsFilePath — accepts Date object
test('TC-05', 'getDecisionsFilePath accepts Date object', () => {
  const d = new Date('2025-06-15');
  const fp = tracer.getDecisionsFilePath(d);
  assert.ok(fp.includes('2025-06-15'));
  assert.ok(fp.endsWith('.jsonl'));
});

// TC-06: getDecisionsFilePath — accepts date string
test('TC-06', 'getDecisionsFilePath accepts date string', () => {
  const fp = tracer.getDecisionsFilePath('2024-01-01');
  assert.ok(fp.includes('2024-01-01'));
});

// ── Tests: shouldTraceDecision ────────────────────────────────────────────

// TC-07: shouldTraceDecision — returns true for design phase
test('TC-07', 'shouldTraceDecision returns true for design phase', () => {
  assert.strictEqual(tracer.shouldTraceDecision('Read', 'design'), true);
  assert.strictEqual(tracer.shouldTraceDecision('Read', 'check'), true);
});

// TC-08: shouldTraceDecision — returns true for Write/Edit/Bash in do phase
test('TC-08', 'shouldTraceDecision traces Write/Edit/Bash in do phase', () => {
  assert.strictEqual(tracer.shouldTraceDecision('Write', 'do'), true);
  assert.strictEqual(tracer.shouldTraceDecision('Edit', 'do'), true);
  assert.strictEqual(tracer.shouldTraceDecision('Bash', 'do'), true);
  assert.strictEqual(tracer.shouldTraceDecision('Read', 'do'), false);
});

// TC-09: shouldTraceDecision — always traces Agent/Skill
test('TC-09', 'shouldTraceDecision always traces Agent and Skill', () => {
  assert.strictEqual(tracer.shouldTraceDecision('Agent', 'plan'), true);
  assert.strictEqual(tracer.shouldTraceDecision('Skill', 'pm'), true);
});

// TC-10: shouldTraceDecision — returns false for irrelevant combos
test('TC-10', 'shouldTraceDecision returns false for Read in plan phase', () => {
  assert.strictEqual(tracer.shouldTraceDecision('Read', 'plan'), false);
  assert.strictEqual(tracer.shouldTraceDecision('Glob', 'act'), false);
});

// ── Tests: getDecisionChain ───────────────────────────────────────────────

// TC-11: getDecisionChain — is a function with arity 2
test('TC-11', 'getDecisionChain is a function with arity 2', () => {
  assert.strictEqual(typeof tracer.getDecisionChain, 'function');
  assert.strictEqual(tracer.getDecisionChain.length, 2);
});

// TC-12: getDecisionChain — returns empty array for nonexistent ID
test('TC-12', 'getDecisionChain returns empty array for unknown ID', () => {
  const result = tracer.getDecisionChain('nonexistent-id', '2020-01-01');
  assert.ok(Array.isArray(result));
  assert.strictEqual(result.length, 0);
});

// ── Tests: generateDailyDecisionSummary ───────────────────────────────────

// TC-13: generateDailyDecisionSummary — is a function
test('TC-13', 'generateDailyDecisionSummary is a function', () => {
  assert.strictEqual(typeof tracer.generateDailyDecisionSummary, 'function');
});

// TC-14: generateDailyDecisionSummary — returns summary object
test('TC-14', 'generateDailyDecisionSummary returns summary with expected shape', () => {
  const summary = tracer.generateDailyDecisionSummary('2020-01-01');
  assert.strictEqual(typeof summary, 'object');
  assert.ok('date' in summary);
  assert.ok('total' in summary);
  assert.ok('byType' in summary);
  assert.ok('byPhase' in summary);
  assert.strictEqual(summary.date, '2020-01-01');
  assert.strictEqual(summary.total, 0); // no data for that date
});

// ── Cleanup ───────────────────────────────────────────────────────────────

if (originalPlatformExports) require.cache[platformPath] = originalPlatformExports;
else delete require.cache[platformPath];

// ── Results ───────────────────────────────────────────────────────────────

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
