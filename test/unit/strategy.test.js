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

console.log('\n=== Team Strategy Unit Tests ===\n');

const {
  TEAM_STRATEGIES,
  getTeammateRoles,
} = require('../../lib/team/strategy.js');

// ── TEAM_STRATEGIES structure ──

test('STR-001', 'TEAM_STRATEGIES: Starter is null (no team support)', () => {
  assert.strictEqual(TEAM_STRATEGIES.Starter, null);
});

test('STR-002', 'TEAM_STRATEGIES: Dynamic has 3 teammates', () => {
  assert.strictEqual(TEAM_STRATEGIES.Dynamic.teammates, 3);
});

test('STR-003', 'TEAM_STRATEGIES: Enterprise has 6 teammates', () => {
  assert.strictEqual(TEAM_STRATEGIES.Enterprise.teammates, 6);
});

test('STR-004', 'TEAM_STRATEGIES: Dynamic has ctoAgent cto-lead', () => {
  assert.strictEqual(TEAM_STRATEGIES.Dynamic.ctoAgent, 'cto-lead');
});

test('STR-005', 'TEAM_STRATEGIES: Enterprise has ctoAgent cto-lead', () => {
  assert.strictEqual(TEAM_STRATEGIES.Enterprise.ctoAgent, 'cto-lead');
});

test('STR-006', 'TEAM_STRATEGIES: Dynamic roles have developer, frontend, qa', () => {
  const roleNames = TEAM_STRATEGIES.Dynamic.roles.map(r => r.name);
  assert.ok(roleNames.includes('developer'));
  assert.ok(roleNames.includes('frontend'));
  assert.ok(roleNames.includes('qa'));
});

test('STR-007', 'TEAM_STRATEGIES: Enterprise roles include pm, architect, security', () => {
  const roleNames = TEAM_STRATEGIES.Enterprise.roles.map(r => r.name);
  assert.ok(roleNames.includes('pm'));
  assert.ok(roleNames.includes('architect'));
  assert.ok(roleNames.includes('security'));
});

test('STR-008', 'TEAM_STRATEGIES: Dynamic phaseStrategy do is parallel', () => {
  assert.strictEqual(TEAM_STRATEGIES.Dynamic.phaseStrategy.do, 'parallel');
});

test('STR-009', 'TEAM_STRATEGIES: Enterprise phaseStrategy do is swarm', () => {
  assert.strictEqual(TEAM_STRATEGIES.Enterprise.phaseStrategy.do, 'swarm');
});

test('STR-010', 'TEAM_STRATEGIES: Enterprise phaseStrategy design is council', () => {
  assert.strictEqual(TEAM_STRATEGIES.Enterprise.phaseStrategy.design, 'council');
});

// ── getTeammateRoles ──

test('STR-011', 'getTeammateRoles: Dynamic returns 3 roles', () => {
  const roles = getTeammateRoles('Dynamic');
  assert.strictEqual(roles.length, 3);
});

test('STR-012', 'getTeammateRoles: Enterprise returns 6 roles', () => {
  const roles = getTeammateRoles('Enterprise');
  assert.strictEqual(roles.length, 6);
});

test('STR-013', 'getTeammateRoles: Starter returns empty array', () => {
  const roles = getTeammateRoles('Starter');
  assert.deepStrictEqual(roles, []);
});

test('STR-014', 'getTeammateRoles: unknown level returns empty array', () => {
  const roles = getTeammateRoles('Unknown');
  assert.deepStrictEqual(roles, []);
});

test('STR-015', 'getTeammateRoles: Dynamic roles have agents and phases arrays', () => {
  const roles = getTeammateRoles('Dynamic');
  for (const role of roles) {
    assert.ok(Array.isArray(role.agents), `${role.name} should have agents array`);
    assert.ok(Array.isArray(role.phases), `${role.name} should have phases array`);
    assert.ok(role.description, `${role.name} should have description`);
  }
});

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
