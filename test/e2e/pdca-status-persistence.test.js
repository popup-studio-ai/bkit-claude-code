#!/usr/bin/env node
'use strict';

/**
 * pdca-status-persistence.test.js - E2E tests for lib/pdca/status.js file I/O
 * Tests status creation, persistence, migration, and feature management
 *
 * @module test/e2e/pdca-status-persistence
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

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

console.log('\n=== E2E: PDCA Status Persistence ===\n');

const statusModule = require('../../lib/pdca/status');

// ---------- T01: createInitialStatusV2 returns valid schema ----------
test('SP-01', 'createInitialStatusV2 returns valid v2.0 schema', () => {
  const initial = statusModule.createInitialStatusV2();
  assert.strictEqual(initial.version, '2.0');
  assert.ok(initial.lastUpdated, 'Should have lastUpdated');
  assert.ok(Array.isArray(initial.activeFeatures), 'activeFeatures should be array');
  assert.strictEqual(initial.primaryFeature, null, 'primaryFeature should be null');
  assert.ok(typeof initial.features === 'object', 'features should be object');
  assert.ok(initial.pipeline, 'Should have pipeline');
  assert.ok(initial.session, 'Should have session');
  assert.ok(Array.isArray(initial.history), 'history should be array');
});

// ---------- T02: migrateStatusToV2 converts v1.0 format ----------
test('SP-02', 'migrateStatusToV2 converts v1.0 status to v2.0', () => {
  const v1Status = {
    currentFeature: 'auth-system',
    currentPhase: 'plan',
    features: {
      'auth-system': {
        phase: 'plan',
        matchRate: 85,
      }
    },
    history: [{ action: 'created', timestamp: '2026-01-01T00:00:00Z' }]
  };

  const v2 = statusModule.migrateStatusToV2(v1Status);
  assert.strictEqual(v2.version, '2.0');
  assert.strictEqual(v2.primaryFeature, 'auth-system');
  assert.ok(v2.activeFeatures.includes('auth-system'), 'Should include auth-system in active');
  assert.ok(v2.features['auth-system'], 'Feature data should be preserved');
  assert.strictEqual(v2.features['auth-system'].phase, 'plan', 'Phase should be preserved');
  assert.ok(v2.history.length > 0, 'History should be preserved');
});

// ---------- T03: migrateStatusV2toV3 adds state machine fields ----------
test('SP-03', 'migrateStatusV2toV3 adds stateMachine, metrics, automation fields', () => {
  const v2 = statusModule.createInitialStatusV2();
  v2.features['test-feature'] = {
    phase: 'design',
    matchRate: null,
    iterationCount: 0,
    requirements: [],
    documents: {},
    timestamps: { started: new Date().toISOString() }
  };
  v2.activeFeatures = ['test-feature'];

  const v3 = statusModule.migrateStatusV2toV3(v2);
  assert.strictEqual(v3.version, '3.0');
  // Feature-level additions
  const feat = v3.features['test-feature'];
  assert.ok(feat.stateMachine, 'Feature should have stateMachine');
  assert.strictEqual(feat.stateMachine.currentState, 'design');
  assert.ok(feat.metrics, 'Feature should have metrics');
  assert.ok(feat.phaseTimestamps !== undefined, 'Feature should have phaseTimestamps');
  assert.strictEqual(feat.automationLevel, 2, 'Default automation level should be 2');
  // Global additions
  assert.ok(v3.stateMachine, 'Should have global stateMachine');
  assert.ok(v3.automation, 'Should have global automation');
  assert.ok(v3.team, 'Should have global team');
});

// ---------- T04: Double migration is idempotent ----------
test('SP-04', 'migrateStatusV2toV3 is idempotent (calling twice returns same)', () => {
  const v2 = statusModule.createInitialStatusV2();
  v2.features['idempotent-test'] = { phase: 'do' };
  const v3a = statusModule.migrateStatusV2toV3(v2);
  const v3b = statusModule.migrateStatusV2toV3(v3a);
  assert.strictEqual(v3b.version, '3.0');
  assert.deepStrictEqual(v3a.features, v3b.features, 'Features should be identical after double migration');
});

// ---------- T05: Full migration chain v1 -> v2 -> v3 ----------
test('SP-05', 'Full migration chain: v1.0 -> v2.0 -> v3.0', () => {
  const v1 = {
    currentFeature: 'legacy-feature',
    currentPhase: 'check',
    features: {
      'legacy-feature': {
        phase: 'check',
        matchRate: 80,
        startedAt: '2025-01-01T00:00:00Z'
      }
    },
    history: []
  };

  const v2 = statusModule.migrateStatusToV2(v1);
  assert.strictEqual(v2.version, '2.0');

  const v3 = statusModule.migrateStatusV2toV3(v2);
  assert.strictEqual(v3.version, '3.0');
  assert.ok(v3.features['legacy-feature'].stateMachine, 'Should have stateMachine after full migration');
  assert.strictEqual(v3.features['legacy-feature'].stateMachine.currentState, 'check');
});

// ---------- T06: Empty v1 migration ----------
test('SP-06', 'migrateStatusToV2 handles empty v1 status gracefully', () => {
  const v1 = {};
  const v2 = statusModule.migrateStatusToV2(v1);
  assert.strictEqual(v2.version, '2.0');
  assert.strictEqual(v2.primaryFeature, null);
  assert.deepStrictEqual(v2.activeFeatures, []);
});

// ---------- T07: v3 migration preserves existing v3 data ----------
test('SP-07', 'migrateStatusV2toV3 preserves existing v3 data (already v3)', () => {
  const v3 = {
    version: '3.0',
    features: { 'already-v3': { phase: 'report', stateMachine: { currentState: 'report', custom: true } } },
    stateMachine: { totalTransitions: 42 },
  };
  const result = statusModule.migrateStatusV2toV3(v3);
  assert.strictEqual(result.version, '3.0');
  assert.strictEqual(result.features['already-v3'].stateMachine.custom, true, 'Custom data should be preserved');
  assert.strictEqual(result.stateMachine.totalTransitions, 42, 'Global stateMachine data should be preserved');
});

// ---------- T08: evaluateCheckResults from cto-logic ----------
test('SP-08', 'CTO evaluateCheckResults decision logic', () => {
  const cto = require('../../lib/team/cto-logic');

  const pass = cto.evaluateCheckResults(95, 0, 90);
  assert.strictEqual(pass.decision, 'report', 'High match rate + no issues => report');

  const iterate = cto.evaluateCheckResults(80, 1, 80);
  assert.strictEqual(iterate.decision, 'iterate', '80% with issues => iterate');

  const redesign = cto.evaluateCheckResults(50, 3, 40);
  assert.strictEqual(redesign.decision, 'redesign', 'Very low match rate => redesign');
});

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
