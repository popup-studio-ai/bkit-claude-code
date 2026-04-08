#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');

let passed = 0, failed = 0, total = 0;
function test(id, description, fn) {
  total++;
  try { fn(); passed++; }
  catch (err) { failed++; console.error(`  FAIL ${id}: ${description}\n    ${err.message}`); }
}

console.log('\n=== CTO Logic Unit Tests ===\n');

const {
  decidePdcaPhase,
  evaluateDocument,
  evaluateCheckResults,
  selectAgentsForRole,
  recommendTeamComposition,
} = require('../../lib/team/cto-logic.js');

// ── evaluateCheckResults ──

test('CTO-001', 'evaluateCheckResults: 90%+ and 0 criticals -> report', () => {
  const result = evaluateCheckResults(95, 0, 85);
  assert.strictEqual(result.decision, 'report');
  assert.ok(result.reason.includes('95'));
  assert.ok(result.reason.includes('meets threshold'));
  assert.strictEqual(result.nextAction, '/pdca report');
});

test('CTO-002', 'evaluateCheckResults: exactly 90% and 0 criticals -> report', () => {
  const result = evaluateCheckResults(90, 0, 80);
  assert.strictEqual(result.decision, 'report');
});

test('CTO-003', 'evaluateCheckResults: 90%+ but critical issues -> iterate', () => {
  const result = evaluateCheckResults(92, 3, 80);
  assert.strictEqual(result.decision, 'iterate');
  assert.ok(result.reason.includes('3'));
  assert.strictEqual(result.nextAction, '/pdca iterate');
});

test('CTO-004', 'evaluateCheckResults: 70-89% with 0 criticals -> iterate', () => {
  const result = evaluateCheckResults(85, 0, 75);
  assert.strictEqual(result.decision, 'iterate');
  assert.ok(result.reason.includes('85'));
});

test('CTO-005', 'evaluateCheckResults: exactly 70% -> iterate', () => {
  const result = evaluateCheckResults(70, 0, 60);
  assert.strictEqual(result.decision, 'iterate');
});

test('CTO-006', 'evaluateCheckResults: below 70% -> redesign', () => {
  const result = evaluateCheckResults(50, 5, 40);
  assert.strictEqual(result.decision, 'redesign');
  assert.ok(result.reason.includes('critically low'));
  assert.strictEqual(result.nextAction, '/pdca design');
});

test('CTO-007', 'evaluateCheckResults: 0% -> redesign', () => {
  const result = evaluateCheckResults(0, 10, 0);
  assert.strictEqual(result.decision, 'redesign');
});

test('CTO-008', 'evaluateCheckResults: 69% -> redesign (boundary)', () => {
  const result = evaluateCheckResults(69, 0, 60);
  assert.strictEqual(result.decision, 'redesign');
});

test('CTO-009', 'evaluateCheckResults: result always has decision, reason, nextAction', () => {
  const result = evaluateCheckResults(80, 1, 70);
  assert.ok('decision' in result);
  assert.ok('reason' in result);
  assert.ok('nextAction' in result);
});

// ── selectAgentsForRole ──

test('CTO-010', 'selectAgentsForRole: Dynamic developer in do phase', () => {
  const agents = selectAgentsForRole('developer', 'do', 'Dynamic');
  assert.ok(agents.includes('bkend-expert'));
});

test('CTO-011', 'selectAgentsForRole: Dynamic qa in check phase', () => {
  const agents = selectAgentsForRole('qa', 'check', 'Dynamic');
  assert.ok(agents.includes('qa-monitor'));
  assert.ok(agents.includes('gap-detector'));
});

test('CTO-012', 'selectAgentsForRole: wrong phase returns empty', () => {
  // developer is for do/act, not plan
  const agents = selectAgentsForRole('developer', 'plan', 'Dynamic');
  assert.deepStrictEqual(agents, []);
});

test('CTO-013', 'selectAgentsForRole: unknown level returns empty', () => {
  const agents = selectAgentsForRole('developer', 'do', 'Starter');
  assert.deepStrictEqual(agents, []);
});

test('CTO-014', 'selectAgentsForRole: unknown role returns empty', () => {
  const agents = selectAgentsForRole('nonexistent', 'do', 'Dynamic');
  assert.deepStrictEqual(agents, []);
});

test('CTO-015', 'selectAgentsForRole: Enterprise security in design phase', () => {
  const agents = selectAgentsForRole('security', 'design', 'Enterprise');
  assert.ok(agents.includes('security-architect'));
});

test('CTO-016', 'selectAgentsForRole: Enterprise architect in design phase', () => {
  const agents = selectAgentsForRole('architect', 'design', 'Enterprise');
  assert.ok(agents.includes('enterprise-expert'));
  assert.ok(agents.includes('infra-architect'));
});

// ── Exports verification ──

test('CTO-017', 'All 5 exports exist', () => {
  assert.strictEqual(typeof decidePdcaPhase, 'function');
  assert.strictEqual(typeof evaluateDocument, 'function');
  assert.strictEqual(typeof evaluateCheckResults, 'function');
  assert.strictEqual(typeof selectAgentsForRole, 'function');
  assert.strictEqual(typeof recommendTeamComposition, 'function');
});

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
