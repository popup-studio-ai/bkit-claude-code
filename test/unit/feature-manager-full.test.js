#!/usr/bin/env node
'use strict';
const assert = require('assert');
let passed = 0, failed = 0, total = 0;
function test(id, desc, fn) {
  total++;
  try { fn(); passed++; } catch(e) { failed++; console.error(`  FAIL ${id}: ${desc}\n    ${e.message}`); }
}
console.log('\n=== Feature Manager Full Export Coverage ===\n');

const fm = require('../../lib/pdca/feature-manager');

// TC-01: acquireDoLock export exists and is a function with arity 2
test('FM-01', 'acquireDoLock is exported as function with arity 1-2', () => {
  assert.strictEqual(typeof fm.acquireDoLock, 'function', 'acquireDoLock must be a function');
  assert.ok(fm.acquireDoLock.length >= 1 && fm.acquireDoLock.length <= 2,
    `acquireDoLock arity should be 1-2, got ${fm.acquireDoLock.length}`);
});

// TC-02: releaseDoLock export exists and is a function with arity 1
test('FM-02', 'releaseDoLock is exported as function with arity 1', () => {
  assert.strictEqual(typeof fm.releaseDoLock, 'function', 'releaseDoLock must be a function');
  assert.strictEqual(fm.releaseDoLock.length, 1, 'releaseDoLock arity should be 1');
});

// TC-03: getDoLock export exists and is a function with arity 0
test('FM-03', 'getDoLock is exported as function with arity 0', () => {
  assert.strictEqual(typeof fm.getDoLock, 'function', 'getDoLock must be a function');
  assert.strictEqual(fm.getDoLock.length, 0, 'getDoLock arity should be 0');
});

// TC-04: setDependencies export exists and is a function with arity 2
test('FM-04', 'setDependencies is exported as function with arity 2', () => {
  assert.strictEqual(typeof fm.setDependencies, 'function', 'setDependencies must be a function');
  assert.strictEqual(fm.setDependencies.length, 2, 'setDependencies arity should be 2');
});

// TC-05: loadFeatureWorkflow export exists and is a function with arity 1
test('FM-05', 'loadFeatureWorkflow is exported as function with arity 1', () => {
  assert.strictEqual(typeof fm.loadFeatureWorkflow, 'function', 'loadFeatureWorkflow must be a function');
  assert.strictEqual(fm.loadFeatureWorkflow.length, 1, 'loadFeatureWorkflow arity should be 1');
});

// TC-06: saveFeatureWorkflow export exists and is a function with arity 2
test('FM-06', 'saveFeatureWorkflow is exported as function with arity 2', () => {
  assert.strictEqual(typeof fm.saveFeatureWorkflow, 'function', 'saveFeatureWorkflow must be a function');
  assert.strictEqual(fm.saveFeatureWorkflow.length, 2, 'saveFeatureWorkflow arity should be 2');
});

// TC-07: getSummary export exists and is a function with arity 0
test('FM-07', 'getSummary is exported as function with arity 0', () => {
  assert.strictEqual(typeof fm.getSummary, 'function', 'getSummary must be a function');
  assert.strictEqual(fm.getSummary.length, 0, 'getSummary arity should be 0');
});

// TC-08: loadFeatureWorkflow returns null for non-existent feature
test('FM-08', 'loadFeatureWorkflow returns null for non-existent feature', () => {
  const result = fm.loadFeatureWorkflow('__nonexistent_test_feature_xyz__');
  assert.strictEqual(result, null, 'loadFeatureWorkflow should return null for missing feature');
});

// TC-09: releaseDoLock returns false when no lock is held by feature
test('FM-09', 'releaseDoLock returns false when lock not held by feature', () => {
  const result = fm.releaseDoLock('__never_locked_feature_xyz__');
  assert.strictEqual(result, false, 'releaseDoLock should return false when feature does not hold lock');
});

// TC-10: getDoLock returns object with expected shape
test('FM-10', 'getDoLock returns object with expected lock shape', () => {
  const lock = fm.getDoLock();
  assert.ok(lock && typeof lock === 'object', 'getDoLock must return an object');
  assert.ok('feature' in lock, 'lock must have feature property');
  assert.ok('acquiredAt' in lock, 'lock must have acquiredAt property');
  assert.ok('timeoutMs' in lock, 'lock must have timeoutMs property');
});

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
