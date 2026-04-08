#!/usr/bin/env node
'use strict';
const assert = require('assert');
let passed = 0, failed = 0, total = 0;
function test(id, desc, fn) {
  total++;
  try { fn(); passed++; } catch(e) { failed++; console.error(`  FAIL ${id}: ${desc}\n    ${e.message}`); }
}
console.log('\n=== Lifecycle Full Export Coverage ===\n');

const lifecycle = require('../../lib/pdca/lifecycle');

// TC-01: completeFeature is exported as function with arity 1-2
test('LC-01', 'completeFeature is exported as function with arity 1-2', () => {
  assert.strictEqual(typeof lifecycle.completeFeature, 'function', 'completeFeature must be a function');
  assert.ok(lifecycle.completeFeature.length >= 1 && lifecycle.completeFeature.length <= 2,
    `completeFeature arity should be 1-2, got ${lifecycle.completeFeature.length}`);
});

// TC-02: abandonFeature is exported as function with arity 1-2
test('LC-02', 'abandonFeature is exported as function with arity 1-2', () => {
  assert.strictEqual(typeof lifecycle.abandonFeature, 'function', 'abandonFeature must be a function');
  assert.ok(lifecycle.abandonFeature.length >= 1 && lifecycle.abandonFeature.length <= 2,
    `abandonFeature arity should be 1-2, got ${lifecycle.abandonFeature.length}`);
});

// TC-03: runCleanup is exported as function with arity 0-1
test('LC-03', 'runCleanup is exported as function with arity 0-1', () => {
  assert.strictEqual(typeof lifecycle.runCleanup, 'function', 'runCleanup must be a function');
  assert.ok(lifecycle.runCleanup.length >= 0 && lifecycle.runCleanup.length <= 1,
    `runCleanup arity should be 0-1, got ${lifecycle.runCleanup.length}`);
});

// TC-04: enforceLimit is exported as function with arity 0-1
test('LC-04', 'enforceLimit is exported as function with arity 0-1', () => {
  assert.strictEqual(typeof lifecycle.enforceLimit, 'function', 'enforceLimit must be a function');
  assert.ok(lifecycle.enforceLimit.length >= 0 && lifecycle.enforceLimit.length <= 1,
    `enforceLimit arity should be 0-1, got ${lifecycle.enforceLimit.length}`);
});

// TC-05: completeFeature returns {success:false} for non-existent feature
test('LC-05', 'completeFeature returns success:false for non-existent feature', () => {
  const result = lifecycle.completeFeature('__nonexistent_lifecycle_feature_xyz__');
  assert.ok(result && typeof result === 'object', 'completeFeature must return an object');
  assert.strictEqual(result.success, false, 'success must be false for missing feature');
});

// TC-06: abandonFeature returns {success:false} for non-existent feature
test('LC-06', 'abandonFeature returns success:false for non-existent feature', () => {
  const result = lifecycle.abandonFeature('__nonexistent_lifecycle_feature_xyz__');
  assert.ok(result && typeof result === 'object', 'abandonFeature must return an object');
  assert.strictEqual(result.success, false, 'success must be false for missing feature');
});

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
