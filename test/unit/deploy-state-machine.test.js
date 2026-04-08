#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

let passed = 0, failed = 0, total = 0;
function test(id, description, fn) {
  total++;
  try { fn(); passed++; }
  catch (err) { failed++; console.error(`  FAIL ${id}: ${description}\n    ${err.message}`); }
}

console.log('\n=== Deploy State Machine Unit Tests ===\n');

const {
  DEPLOY_STATES,
  DEPLOY_EVENTS,
  DEPLOY_TRANSITIONS,
  DEPLOY_GUARDS,
  getDeployState,
  transitionDeploy,
  initDeploy,
  getDeployConfig,
  formatDeployStatus,
  saveDeployState,
} = require('../../lib/pdca/deploy-state-machine.js');

// ── DEPLOY_STATES ──

test('DSM-001', 'DEPLOY_STATES: contains all expected states', () => {
  const expected = ['idle', 'init', 'dev', 'verify-dev', 'staging', 'verify-staging', 'approval', 'prod', 'canary', 'complete', 'failed', 'rollback'];
  assert.deepStrictEqual(DEPLOY_STATES, expected);
});

test('DSM-002', 'DEPLOY_STATES: has 12 states', () => {
  assert.strictEqual(DEPLOY_STATES.length, 12);
});

// ── DEPLOY_EVENTS ──

test('DSM-003', 'DEPLOY_EVENTS: contains DEPLOY_START', () => {
  assert.ok(DEPLOY_EVENTS.includes('DEPLOY_START'));
});

test('DSM-004', 'DEPLOY_EVENTS: contains all expected events', () => {
  assert.ok(DEPLOY_EVENTS.includes('DEV_DONE'));
  assert.ok(DEPLOY_EVENTS.includes('DEV_VERIFY_PASS'));
  assert.ok(DEPLOY_EVENTS.includes('APPROVAL_GRANTED'));
  assert.ok(DEPLOY_EVENTS.includes('CANARY_PASS'));
  assert.ok(DEPLOY_EVENTS.includes('DEPLOY_ROLLBACK'));
});

test('DSM-005', 'DEPLOY_EVENTS: has 15 events', () => {
  assert.strictEqual(DEPLOY_EVENTS.length, 15);
});

// ── DEPLOY_TRANSITIONS ──

test('DSM-006', 'DEPLOY_TRANSITIONS: idle -> init on DEPLOY_START', () => {
  const t = DEPLOY_TRANSITIONS.find(tr => tr.from === 'idle' && tr.event === 'DEPLOY_START');
  assert.ok(t);
  assert.strictEqual(t.to, 'init');
});

test('DSM-007', 'DEPLOY_TRANSITIONS: dev -> verify-dev on DEV_VERIFY_PASS has guard', () => {
  const t = DEPLOY_TRANSITIONS.find(tr => tr.from === 'dev' && tr.event === 'DEV_VERIFY_PASS');
  assert.ok(t);
  assert.strictEqual(t.guard, 'guardMatchRate90');
  assert.strictEqual(t.to, 'verify-dev');
});

test('DSM-008', 'DEPLOY_TRANSITIONS: staging -> verify-staging on STG_VERIFY_PASS has guard', () => {
  const t = DEPLOY_TRANSITIONS.find(tr => tr.from === 'staging' && tr.event === 'STG_VERIFY_PASS');
  assert.ok(t);
  assert.strictEqual(t.guard, 'guardMatchRate95');
});

test('DSM-009', 'DEPLOY_TRANSITIONS: failed -> rollback on DEPLOY_ROLLBACK', () => {
  const t = DEPLOY_TRANSITIONS.find(tr => tr.from === 'failed' && tr.event === 'DEPLOY_ROLLBACK');
  assert.ok(t);
  assert.strictEqual(t.to, 'rollback');
});

test('DSM-010', 'DEPLOY_TRANSITIONS: all transitions have from, event, to fields', () => {
  for (const t of DEPLOY_TRANSITIONS) {
    assert.ok(t.from, `Transition missing 'from': ${JSON.stringify(t)}`);
    assert.ok(t.event, `Transition missing 'event': ${JSON.stringify(t)}`);
    assert.ok(t.to, `Transition missing 'to': ${JSON.stringify(t)}`);
  }
});

// ── DEPLOY_GUARDS ──

test('DSM-011', 'guardMatchRate90: passes at 90%', () => {
  assert.strictEqual(DEPLOY_GUARDS.guardMatchRate90({ matchRate: 90 }), true);
});

test('DSM-012', 'guardMatchRate90: fails at 89%', () => {
  assert.strictEqual(DEPLOY_GUARDS.guardMatchRate90({ matchRate: 89 }), false);
});

test('DSM-013', 'guardMatchRate90: fails with no matchRate (defaults to 0)', () => {
  assert.strictEqual(DEPLOY_GUARDS.guardMatchRate90({}), false);
});

test('DSM-014', 'guardMatchRate95: passes at 95%', () => {
  assert.strictEqual(DEPLOY_GUARDS.guardMatchRate95({ matchRate: 95 }), true);
});

test('DSM-015', 'guardMatchRate95: fails at 94%', () => {
  assert.strictEqual(DEPLOY_GUARDS.guardMatchRate95({ matchRate: 94 }), false);
});

// ── getDeployConfig ──

test('DSM-016', 'getDeployConfig: starter has 1 environment (dev)', () => {
  const config = getDeployConfig('starter');
  assert.deepStrictEqual(config.environments, ['dev']);
  assert.strictEqual(config.strategy, 'guide-only');
});

test('DSM-017', 'getDeployConfig: dynamic has dev and staging', () => {
  const config = getDeployConfig('dynamic');
  assert.deepStrictEqual(config.environments, ['dev', 'staging']);
  assert.strictEqual(config.strategy, 'docker-gha');
});

test('DSM-018', 'getDeployConfig: enterprise has dev, staging, prod', () => {
  const config = getDeployConfig('enterprise');
  assert.deepStrictEqual(config.environments, ['dev', 'staging', 'prod']);
  assert.strictEqual(config.strategy, 'eks-argocd');
});

test('DSM-019', 'getDeployConfig: unknown level defaults to dynamic', () => {
  const config = getDeployConfig('unknown');
  assert.strictEqual(config.strategy, 'docker-gha');
});

test('DSM-020', 'getDeployConfig: enterprise has Terraform and ArgoCD tools', () => {
  const config = getDeployConfig('enterprise');
  assert.ok(config.tools.includes('Terraform'));
  assert.ok(config.tools.includes('ArgoCD'));
  assert.ok(config.tools.includes('EKS'));
});

// ── Exports verification ──

test('DSM-021', 'All 10 exports exist', () => {
  assert.ok(Array.isArray(DEPLOY_STATES));
  assert.ok(Array.isArray(DEPLOY_EVENTS));
  assert.ok(Array.isArray(DEPLOY_TRANSITIONS));
  assert.ok(typeof DEPLOY_GUARDS === 'object');
  assert.strictEqual(typeof getDeployState, 'function');
  assert.strictEqual(typeof transitionDeploy, 'function');
  assert.strictEqual(typeof initDeploy, 'function');
  assert.strictEqual(typeof getDeployConfig, 'function');
  assert.strictEqual(typeof formatDeployStatus, 'function');
  assert.strictEqual(typeof saveDeployState, 'function');
});

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
