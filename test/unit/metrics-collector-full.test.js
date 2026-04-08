#!/usr/bin/env node
'use strict';
const assert = require('assert');
let passed = 0, failed = 0, total = 0;
function test(id, desc, fn) {
  total++;
  try { fn(); passed++; } catch(e) { failed++; console.error(`  FAIL ${id}: ${desc}\n    ${e.message}`); }
}
console.log('\n=== Metrics Collector Full Export Coverage ===\n');

const mc = require('../../lib/quality/metrics-collector');

// TC-01: METRIC_SPECS is an object with M1-M10 keys
test('MC-01', 'METRIC_SPECS contains M1-M10 metric definitions', () => {
  assert.ok(mc.METRIC_SPECS && typeof mc.METRIC_SPECS === 'object', 'METRIC_SPECS must be an object');
  const expectedIds = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10'];
  for (const id of expectedIds) {
    assert.ok(mc.METRIC_SPECS[id], `METRIC_SPECS must contain ${id}`);
    assert.strictEqual(mc.METRIC_SPECS[id].id, id, `METRIC_SPECS.${id}.id must be ${id}`);
    assert.ok(mc.METRIC_SPECS[id].name, `METRIC_SPECS.${id} must have name`);
    assert.ok(mc.METRIC_SPECS[id].unit, `METRIC_SPECS.${id} must have unit`);
    assert.ok(['higher', 'lower'].includes(mc.METRIC_SPECS[id].direction),
      `METRIC_SPECS.${id}.direction must be higher or lower`);
  }
});

// TC-02: METRIC_ID_TO_GATE_NAME maps M1-M10 to gate names
test('MC-02', 'METRIC_ID_TO_GATE_NAME maps all 10 metric IDs', () => {
  assert.ok(mc.METRIC_ID_TO_GATE_NAME && typeof mc.METRIC_ID_TO_GATE_NAME === 'object');
  assert.strictEqual(Object.keys(mc.METRIC_ID_TO_GATE_NAME).length, 10, 'Must have 10 entries');
  assert.strictEqual(mc.METRIC_ID_TO_GATE_NAME.M1, 'matchRate');
  assert.strictEqual(mc.METRIC_ID_TO_GATE_NAME.M10, 'pdcaCycleTimeHours');
});

// TC-03: GATE_NAME_TO_METRIC_ID is the inverse mapping
test('MC-03', 'GATE_NAME_TO_METRIC_ID is inverse of METRIC_ID_TO_GATE_NAME', () => {
  assert.ok(mc.GATE_NAME_TO_METRIC_ID && typeof mc.GATE_NAME_TO_METRIC_ID === 'object');
  assert.strictEqual(mc.GATE_NAME_TO_METRIC_ID.matchRate, 'M1');
  assert.strictEqual(mc.GATE_NAME_TO_METRIC_ID.pdcaCycleTimeHours, 'M10');
  // Verify full inverse
  for (const [id, name] of Object.entries(mc.METRIC_ID_TO_GATE_NAME)) {
    assert.strictEqual(mc.GATE_NAME_TO_METRIC_ID[name], id, `Inverse mismatch for ${name}`);
  }
});

// TC-04: collectPhaseMetrics is a function with arity 2-3
test('MC-04', 'collectPhaseMetrics is exported as function with arity 2-3', () => {
  assert.strictEqual(typeof mc.collectPhaseMetrics, 'function', 'collectPhaseMetrics must be a function');
  assert.ok(mc.collectPhaseMetrics.length >= 2 && mc.collectPhaseMetrics.length <= 3,
    `collectPhaseMetrics arity should be 2-3, got ${mc.collectPhaseMetrics.length}`);
});

// TC-05: toGateFormat is a function with arity 1
test('MC-05', 'toGateFormat is exported as function with arity 1', () => {
  assert.strictEqual(typeof mc.toGateFormat, 'function', 'toGateFormat must be a function');
  assert.strictEqual(mc.toGateFormat.length, 1, 'toGateFormat arity should be 1');
});

// TC-06: toPdcaStatusFormat is a function with arity 1
test('MC-06', 'toPdcaStatusFormat is exported as function with arity 1', () => {
  assert.strictEqual(typeof mc.toPdcaStatusFormat, 'function', 'toPdcaStatusFormat must be a function');
  assert.strictEqual(mc.toPdcaStatusFormat.length, 1, 'toPdcaStatusFormat arity should be 1');
});

// TC-07: toGateFormat returns null for non-existent feature
test('MC-07', 'toGateFormat returns null for non-existent feature', () => {
  const result = mc.toGateFormat('__nonexistent_feature_xyz__');
  assert.strictEqual(result, null, 'toGateFormat should return null for missing feature');
});

// TC-08: toPdcaStatusFormat returns null for non-existent feature
test('MC-08', 'toPdcaStatusFormat returns null for non-existent feature', () => {
  const result = mc.toPdcaStatusFormat('__nonexistent_feature_xyz__');
  assert.strictEqual(result, null, 'toPdcaStatusFormat should return null for missing feature');
});

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
