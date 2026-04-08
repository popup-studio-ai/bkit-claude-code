#!/usr/bin/env node
'use strict';

/**
 * pdca-lifecycle.test.js - E2E tests for PDCA state machine lifecycle
 * Tests state transitions using lib/pdca/state-machine.js directly
 *
 * @module test/e2e/pdca-lifecycle
 */

const assert = require('assert');
const path = require('path');

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

console.log('\n=== E2E: PDCA State Machine Lifecycle ===\n');

const sm = require('../../lib/pdca/state-machine');

// ---------- Constants Validation ----------

test('LC-01', 'STATES includes all expected PDCA states', () => {
  const expected = ['idle', 'pm', 'plan', 'design', 'do', 'check', 'act', 'report', 'archived', 'error'];
  for (const s of expected) {
    assert.ok(sm.STATES.includes(s), `Missing state: ${s}`);
  }
  assert.strictEqual(sm.STATES.length, expected.length, 'State count mismatch');
});

test('LC-02', 'EVENTS includes all expected events', () => {
  const expected = [
    'START', 'SKIP_PM', 'PM_DONE', 'PLAN_DONE', 'DESIGN_DONE', 'DO_COMPLETE',
    'MATCH_PASS', 'ITERATE', 'ANALYZE_DONE', 'REPORT_DONE', 'ARCHIVE',
    'REJECT', 'ERROR', 'RECOVER', 'RESET', 'ROLLBACK', 'TIMEOUT', 'ABANDON'
  ];
  for (const e of expected) {
    assert.ok(sm.EVENTS.includes(e), `Missing event: ${e}`);
  }
});

test('LC-03', 'TRANSITIONS table has 20 entries', () => {
  assert.strictEqual(sm.TRANSITIONS.length, 20, `Expected 20 transitions, got ${sm.TRANSITIONS.length}`);
});

// ---------- findTransition ----------

test('LC-04', 'findTransition returns exact match for idle->START', () => {
  const t = sm.findTransition('idle', 'START');
  assert.ok(t, 'Transition should exist');
  assert.strictEqual(t.from, 'idle');
  assert.strictEqual(t.event, 'START');
  assert.strictEqual(t.to, 'pm');
});

test('LC-05', 'findTransition returns wildcard match for ERROR from any state', () => {
  const t = sm.findTransition('design', 'ERROR');
  assert.ok(t, 'Wildcard transition should match');
  assert.strictEqual(t.from, '*');
  assert.strictEqual(t.to, 'error');
});

test('LC-06', 'findTransition returns null for invalid transition', () => {
  const t = sm.findTransition('idle', 'MATCH_PASS');
  assert.strictEqual(t, null, 'Should return null for invalid from/event pair');
});

// ---------- canTransition ----------

test('LC-07', 'canTransition returns true for idle->START', () => {
  assert.strictEqual(sm.canTransition('idle', 'START'), true);
});

test('LC-08', 'canTransition returns false for idle->MATCH_PASS', () => {
  assert.strictEqual(sm.canTransition('idle', 'MATCH_PASS'), false);
});

// ---------- transition() - Forward flow ----------

test('LC-09', 'transition: idle -> pm via START', () => {
  const ctx = {
    feature: 'test-feature-lc09',
    currentState: 'idle',
    matchRate: 0,
    iterationCount: 0,
    maxIterations: 5,
    automationLevel: 2,
    timestamps: {},
    metadata: {},
  };
  const result = sm.transition('idle', 'START', ctx);
  assert.strictEqual(result.success, true, 'Transition should succeed');
  assert.strictEqual(result.previousState, 'idle');
  assert.strictEqual(result.currentState, 'pm');
  assert.ok(result.executedActions.includes('initFeature'), 'Should execute initFeature');
  assert.ok(result.executedActions.includes('recordTimestamp'), 'Should execute recordTimestamp');
});

test('LC-10', 'transition: idle -> plan via SKIP_PM (skip PM phase)', () => {
  const ctx = {
    feature: 'test-feature-lc10',
    currentState: 'idle',
    matchRate: 0,
    iterationCount: 0,
    maxIterations: 5,
    automationLevel: 2,
    timestamps: {},
    metadata: {},
  };
  const result = sm.transition('idle', 'SKIP_PM', ctx);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.currentState, 'plan');
});

// ---------- Guard-blocked transitions ----------

test('LC-11', 'transition: check -> report blocked when matchRate < threshold', () => {
  const ctx = {
    feature: 'test-feature-lc11',
    currentState: 'check',
    matchRate: 50,
    iterationCount: 0,
    maxIterations: 5,
    automationLevel: 2,
    timestamps: {},
    metadata: {},
  };
  const result = sm.transition('check', 'MATCH_PASS', ctx);
  assert.strictEqual(result.success, false, 'Should be blocked by guard');
  assert.strictEqual(result.blockedBy, 'guardMatchRatePass', 'Should be blocked by guardMatchRatePass');
  assert.strictEqual(result.currentState, 'check', 'State should not change');
});

test('LC-12', 'transition: check -> report succeeds when matchRate >= 90', () => {
  const ctx = {
    feature: 'test-feature-lc12',
    currentState: 'check',
    matchRate: 95,
    iterationCount: 0,
    maxIterations: 5,
    automationLevel: 2,
    timestamps: {},
    metadata: {},
  };
  const result = sm.transition('check', 'MATCH_PASS', ctx);
  assert.strictEqual(result.success, true, 'Should succeed with matchRate 95');
  assert.strictEqual(result.currentState, 'report');
});

// ---------- Iteration loop ----------

test('LC-13', 'transition: check -> act via ITERATE (iteration loop)', () => {
  const ctx = {
    feature: 'test-feature-lc13',
    currentState: 'check',
    matchRate: 70,
    iterationCount: 0,
    maxIterations: 5,
    automationLevel: 2,
    timestamps: {},
    metadata: {},
  };
  const result = sm.transition('check', 'ITERATE', ctx);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.currentState, 'act');
  assert.ok(result.executedActions.includes('incrementIteration'), 'Should increment iteration');
  assert.strictEqual(ctx.iterationCount, 1, 'iterationCount should be 1');
});

test('LC-14', 'transition: act -> check via ANALYZE_DONE (re-analyze)', () => {
  const ctx = {
    feature: 'test-feature-lc14',
    currentState: 'act',
    matchRate: 75,
    iterationCount: 1,
    maxIterations: 5,
    automationLevel: 2,
    timestamps: {},
    metadata: {},
  };
  const result = sm.transition('act', 'ANALYZE_DONE', ctx);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.currentState, 'check');
});

// ---------- Iteration limit ----------

test('LC-15', 'ITERATE blocked when max iterations reached', () => {
  const ctx = {
    feature: 'test-feature-lc15',
    currentState: 'check',
    matchRate: 70,
    iterationCount: 5,
    maxIterations: 5,
    automationLevel: 2,
    timestamps: {},
    metadata: {},
  };
  const result = sm.transition('check', 'ITERATE', ctx);
  assert.strictEqual(result.success, false, 'Should be blocked at max iterations');
  assert.strictEqual(result.blockedBy, 'guardCanIterate');
});

// ---------- Error and recovery ----------

test('LC-16', 'transition: any state -> error via ERROR (wildcard)', () => {
  const ctx = {
    feature: 'test-feature-lc16',
    currentState: 'design',
    matchRate: 0,
    iterationCount: 0,
    maxIterations: 5,
    automationLevel: 2,
    timestamps: {},
    metadata: { error: 'Test error' },
  };
  const result = sm.transition('design', 'ERROR', ctx);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.currentState, 'error');
  assert.ok(result.executedActions.includes('saveResumePoint'), 'Should save resume point');
  assert.ok(result.executedActions.includes('notifyError'), 'Should notify error');
});

// ---------- Reset ----------

test('LC-17', 'transition: any state -> idle via RESET', () => {
  const ctx = {
    feature: 'test-feature-lc17',
    currentState: 'do',
    matchRate: 0,
    iterationCount: 0,
    maxIterations: 5,
    automationLevel: 2,
    timestamps: {},
    metadata: {},
  };
  const result = sm.transition('do', 'RESET', ctx);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.currentState, 'idle');
  assert.ok(result.executedActions.includes('cleanupFeature'), 'Should cleanup feature');
});

// ---------- Utility ----------

test('LC-18', 'getAvailableEvents returns valid events for idle state', () => {
  const events = sm.getAvailableEvents('idle');
  const eventNames = events.map(e => e.event);
  assert.ok(eventNames.includes('START'), 'idle should have START event');
  assert.ok(eventNames.includes('SKIP_PM'), 'idle should have SKIP_PM event');
});

test('LC-19', 'getNextPhaseOptions returns valid targets for check state', () => {
  const options = sm.getNextPhaseOptions('check');
  assert.ok(options.includes('report'), 'check should lead to report');
  assert.ok(options.includes('act'), 'check should lead to act');
});

test('LC-20', 'phaseToEvent maps known phase pairs correctly', () => {
  assert.strictEqual(sm.phaseToEvent('idle', 'pm'), 'START');
  assert.strictEqual(sm.phaseToEvent('idle', 'plan'), 'SKIP_PM');
  assert.strictEqual(sm.phaseToEvent('plan', 'design'), 'PLAN_DONE');
  assert.strictEqual(sm.phaseToEvent('check', 'act'), 'ITERATE');
  assert.strictEqual(sm.phaseToEvent('idle', 'do'), null, 'Invalid pair should return null');
});

// ---------- printDiagram ----------

test('LC-21', 'printDiagram returns non-empty string', () => {
  const diagram = sm.printDiagram();
  assert.ok(typeof diagram === 'string', 'Should return string');
  assert.ok(diagram.length > 100, 'Diagram should be substantial');
  assert.ok(diagram.includes('START'), 'Diagram should include START event');
});

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
