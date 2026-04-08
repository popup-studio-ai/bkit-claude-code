#!/usr/bin/env node
'use strict';
const assert = require('assert');
let passed = 0, failed = 0, total = 0;
function test(id, desc, fn) {
  total++;
  try { fn(); passed++; } catch(e) { failed++; console.error(`  FAIL ${id}: ${desc}\n    ${e.message}`); }
}
console.log('\n=== Workflow Parser Full Export Coverage ===\n');

const wp = require('../../lib/pdca/workflow-parser');

// TC-01: _removeComment is exported and strips inline comments
test('WP-01', '_removeComment strips inline comments outside quotes', () => {
  assert.strictEqual(typeof wp._removeComment, 'function', '_removeComment must be a function');
  assert.strictEqual(wp._removeComment('key: value # comment'), 'key: value ');
  assert.strictEqual(wp._removeComment('# full line comment'), '');
  assert.strictEqual(wp._removeComment('key: "val # not comment"'), 'key: "val # not comment"');
  assert.strictEqual(wp._removeComment('no comment here'), 'no comment here');
});

// TC-02: _getIndent returns leading space count
test('WP-02', '_getIndent returns correct indentation level', () => {
  assert.strictEqual(typeof wp._getIndent, 'function', '_getIndent must be a function');
  assert.strictEqual(wp._getIndent('no indent'), 0);
  assert.strictEqual(wp._getIndent('  two spaces'), 2);
  assert.strictEqual(wp._getIndent('    four spaces'), 4);
  assert.strictEqual(wp._getIndent(''), 0);
});

// TC-03: VALID_PHASES is an array containing all expected phases
test('WP-03', 'VALID_PHASES contains all PDCA phases', () => {
  assert.ok(Array.isArray(wp.VALID_PHASES), 'VALID_PHASES must be an array');
  const expected = ['idle', 'pm', 'plan', 'design', 'do', 'check', 'act', 'report', 'archived'];
  for (const phase of expected) {
    assert.ok(wp.VALID_PHASES.includes(phase), `VALID_PHASES must include "${phase}"`);
  }
  assert.strictEqual(wp.VALID_PHASES.length, expected.length,
    `VALID_PHASES should have ${expected.length} entries, got ${wp.VALID_PHASES.length}`);
});

// TC-04: VALID_STEP_TYPES is an array with sequential, parallel, gate
test('WP-04', 'VALID_STEP_TYPES contains expected step types', () => {
  assert.ok(Array.isArray(wp.VALID_STEP_TYPES), 'VALID_STEP_TYPES must be an array');
  assert.deepStrictEqual(
    wp.VALID_STEP_TYPES.slice().sort(),
    ['gate', 'parallel', 'sequential'],
    'VALID_STEP_TYPES must contain sequential, parallel, gate'
  );
});

// TC-05: VALID_AUTOMATION_LEVELS is an array with guide, semi-auto, full-auto
test('WP-05', 'VALID_AUTOMATION_LEVELS contains expected levels', () => {
  assert.ok(Array.isArray(wp.VALID_AUTOMATION_LEVELS), 'VALID_AUTOMATION_LEVELS must be an array');
  assert.deepStrictEqual(
    wp.VALID_AUTOMATION_LEVELS.slice().sort(),
    ['full-auto', 'guide', 'semi-auto'],
    'VALID_AUTOMATION_LEVELS must contain guide, semi-auto, full-auto'
  );
});

// TC-06: _removeComment preserves single-quoted strings with hash
test('WP-06', '_removeComment preserves hash inside single quotes', () => {
  assert.strictEqual(wp._removeComment("key: 'val # inside'"), "key: 'val # inside'");
  assert.strictEqual(wp._removeComment("key: 'val # inside' # real comment"), "key: 'val # inside' ");
});

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
