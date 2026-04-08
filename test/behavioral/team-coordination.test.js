#!/usr/bin/env node
'use strict';

/**
 * team-coordination.test.js - Behavioral tests for team coordination logic
 * Tests lib/team/coordinator.js and lib/team/cto-logic.js
 *
 * @module test/behavioral/team-coordination
 */

const assert = require('assert');

let passed = 0, failed = 0, total = 0;

function test(id, desc, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  PASS ${id}: ${desc}`);
  } catch (e) {
    failed++;
    console.error(`  FAIL ${id}: ${desc}\n    ${e.message}`);
  }
}

console.log('\n=== Behavioral: Team Coordination ===\n');

const coordinator = require('../../lib/team/coordinator');
const ctoLogic = require('../../lib/team/cto-logic');
const { TEAM_STRATEGIES } = require('../../lib/team/strategy');

// ---------- Team Mode Availability ----------

test('TC-01', 'isTeamModeAvailable reflects env var', () => {
  const original = process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS;
  process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = '1';
  assert.strictEqual(coordinator.isTeamModeAvailable(), true, 'Should be true when env=1');
  process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = '0';
  assert.strictEqual(coordinator.isTeamModeAvailable(), false, 'Should be false when env=0');
  delete process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS;
  assert.strictEqual(coordinator.isTeamModeAvailable(), false, 'Should be false when env not set');
  // Restore
  if (original !== undefined) process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = original;
  else delete process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS;
});

// ---------- Team Config ----------

test('TC-02', 'getTeamConfig returns expected default structure', () => {
  const config = coordinator.getTeamConfig();
  assert.ok('enabled' in config, 'Should have enabled');
  assert.ok('displayMode' in config, 'Should have displayMode');
  assert.ok('maxTeammates' in config, 'Should have maxTeammates');
  assert.ok('delegateMode' in config, 'Should have delegateMode');
  assert.ok(typeof config.maxTeammates === 'number', 'maxTeammates should be number');
});

// ---------- Team Strategies ----------

test('TC-03', 'Starter level has no team strategy', () => {
  assert.strictEqual(TEAM_STRATEGIES.Starter, null, 'Starter should be null');
});

test('TC-04', 'Dynamic level has 3 roles', () => {
  const dynamic = TEAM_STRATEGIES.Dynamic;
  assert.ok(dynamic, 'Dynamic strategy should exist');
  assert.strictEqual(dynamic.teammates, 3);
  assert.strictEqual(dynamic.roles.length, 3);
  assert.strictEqual(dynamic.ctoAgent, 'cto-lead');
});

test('TC-05', 'Enterprise level has 6 roles', () => {
  const enterprise = TEAM_STRATEGIES.Enterprise;
  assert.ok(enterprise, 'Enterprise strategy should exist');
  assert.strictEqual(enterprise.teammates, 6);
  assert.strictEqual(enterprise.roles.length, 6);
  assert.strictEqual(enterprise.ctoAgent, 'cto-lead');
});

// ---------- File Ownership ----------

test('TC-06', 'getFileOwnership returns correct paths for plan/architect', () => {
  const files = coordinator.getFileOwnership('plan', 'architect', 'my-feature');
  assert.ok(files.length > 0, 'Should have file ownership');
  assert.ok(files.some(f => f.includes('my-feature')), 'Should include feature name in path');
  assert.ok(files.some(f => f.includes('plan')), 'Should include plan in path');
});

test('TC-07', 'getFileOwnership returns default for unknown role', () => {
  const files = coordinator.getFileOwnership('do', 'unknown-role', 'test-feature');
  assert.ok(files.length > 0, 'Should fall back to default ownership');
});

// ---------- CTO Logic: evaluateCheckResults ----------

test('TC-08', 'evaluateCheckResults: 95% + 0 issues => report', () => {
  const result = ctoLogic.evaluateCheckResults(95, 0, 90);
  assert.strictEqual(result.decision, 'report');
  assert.ok(result.reason.includes('95'), 'Reason should mention match rate');
  assert.strictEqual(result.nextAction, '/pdca report');
});

test('TC-09', 'evaluateCheckResults: 80% + 2 issues => iterate', () => {
  const result = ctoLogic.evaluateCheckResults(80, 2, 75);
  assert.strictEqual(result.decision, 'iterate');
  assert.ok(result.reason.includes('2') || result.reason.includes('critical'), 'Reason should mention issues');
  assert.strictEqual(result.nextAction, '/pdca iterate');
});

test('TC-10', 'evaluateCheckResults: 40% => redesign', () => {
  const result = ctoLogic.evaluateCheckResults(40, 5, 30);
  assert.strictEqual(result.decision, 'redesign');
  assert.ok(result.reason.includes('critically low') || result.reason.includes('40'),
    'Reason should mention low rate');
  assert.strictEqual(result.nextAction, '/pdca design');
});

// ---------- CTO Logic: selectAgentsForRole ----------

test('TC-11', 'selectAgentsForRole returns agents for qa role in check phase (Enterprise)', () => {
  const agents = ctoLogic.selectAgentsForRole('qa', 'check', 'Enterprise');
  assert.ok(agents.length > 0, 'Should return agents for qa/check');
  assert.ok(agents.includes('qa-strategist') || agents.includes('qa-monitor') || agents.includes('gap-detector'),
    `Should include QA agents, got: ${agents}`);
});

test('TC-12', 'selectAgentsForRole returns empty for invalid role', () => {
  const agents = ctoLogic.selectAgentsForRole('nonexistent', 'do', 'Dynamic');
  assert.strictEqual(agents.length, 0, 'Should return empty for nonexistent role');
});

test('TC-13', 'selectAgentsForRole returns empty for Starter level', () => {
  const agents = ctoLogic.selectAgentsForRole('qa', 'check', 'Starter');
  assert.strictEqual(agents.length, 0, 'Starter level has no team strategy');
});

// ---------- Phase Strategy ----------

test('TC-14', 'Dynamic phaseStrategy has parallel for do phase', () => {
  const dynamic = TEAM_STRATEGIES.Dynamic;
  assert.strictEqual(dynamic.phaseStrategy.do, 'parallel', 'do phase should use parallel');
  assert.strictEqual(dynamic.phaseStrategy.plan, 'single', 'plan phase should use single');
});

test('TC-15', 'Enterprise phaseStrategy has swarm for do and council for check', () => {
  const enterprise = TEAM_STRATEGIES.Enterprise;
  assert.strictEqual(enterprise.phaseStrategy.do, 'swarm', 'do phase should use swarm');
  assert.strictEqual(enterprise.phaseStrategy.check, 'council', 'check phase should use council');
  assert.strictEqual(enterprise.phaseStrategy.design, 'council', 'design phase should use council');
});

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
