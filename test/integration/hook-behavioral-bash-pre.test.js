#!/usr/bin/env node
'use strict';

/**
 * hook-behavioral-bash-pre.test.js - Behavioral tests for scripts/unified-bash-pre.js
 * Tests JSON stdin -> stdout/exitCode behavioral I/O
 *
 * @module test/integration/hook-behavioral-bash-pre
 */

const assert = require('assert');
const { runHook } = require('../helpers/hook-runner');

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

console.log('\n=== Hook Behavioral: unified-bash-pre.js ===\n');

const SCRIPT = 'scripts/unified-bash-pre.js';

/**
 * Helper: build a PreToolUse Bash hook input payload
 * @param {string} command - Bash command string
 * @returns {Object} Hook input JSON
 */
function bashInput(command) {
  return {
    tool_name: 'Bash',
    tool_input: { command },
  };
}

// ---------- BPRE-01: Normal safe command is allowed ----------
test('BPRE-01', 'Normal safe bash command is allowed with exit 0', () => {
  const result = runHook(SCRIPT, bashInput('ls -la'));
  assert.strictEqual(result.exitCode, 0, `exitCode should be 0, got ${result.exitCode}`);
  const out = typeof result.stdout === 'string' ? result.stdout : JSON.stringify(result.stdout);
  assert.ok(out.includes('Bash command validated'), `stdout should include "Bash command validated", got: ${out}`);
});

// ---------- BPRE-02: Empty input is allowed (no command to block) ----------
test('BPRE-02', 'Empty input object is allowed with exit 0', () => {
  const result = runHook(SCRIPT, {});
  assert.strictEqual(result.exitCode, 0, `exitCode should be 0, got ${result.exitCode}`);
});

// ---------- BPRE-03: Empty command string is allowed ----------
test('BPRE-03', 'Empty command string is allowed', () => {
  const result = runHook(SCRIPT, bashInput(''));
  assert.strictEqual(result.exitCode, 0, `exitCode should be 0, got ${result.exitCode}`);
});

// ---------- BPRE-04: Non-destructive git command is allowed ----------
test('BPRE-04', 'Non-destructive git command (git status) is allowed', () => {
  const result = runHook(SCRIPT, bashInput('git status'));
  assert.strictEqual(result.exitCode, 0, `exitCode should be 0, got ${result.exitCode}`);
  const out = typeof result.stdout === 'string' ? result.stdout : JSON.stringify(result.stdout);
  assert.ok(out.includes('Bash command validated'), `Should allow git status`);
});

// ---------- BPRE-05: No active skill/agent produces generic validation message ----------
test('BPRE-05', 'No active context produces generic "Bash command validated." message', () => {
  const result = runHook(SCRIPT, bashInput('echo hello'));
  assert.strictEqual(result.exitCode, 0);
  const out = typeof result.stdout === 'string' ? result.stdout : JSON.stringify(result.stdout);
  // Without active skill/agent, message should be generic (no "for" clause)
  assert.ok(out.includes('Bash command validated'), `Should include validation message, got: ${out}`);
});

// ---------- BPRE-06: Complex but safe command is allowed ----------
test('BPRE-06', 'Complex safe command (piped grep) is allowed', () => {
  const result = runHook(SCRIPT, bashInput('cat package.json | grep version | head -1'));
  assert.strictEqual(result.exitCode, 0, `exitCode should be 0, got ${result.exitCode}`);
});

// ---------- BPRE-07: Invalid JSON-like input still produces exit 0 ----------
test('BPRE-07', 'Malformed tool_input still exits 0 (graceful degradation)', () => {
  const result = runHook(SCRIPT, { tool_name: 'Bash', tool_input: 'not-an-object' });
  assert.strictEqual(result.exitCode, 0, `exitCode should be 0 even with malformed input, got ${result.exitCode}`);
});

// ---------- BPRE-08: Performance within timeout ----------
test('BPRE-08', 'Hook completes within 3000ms timeout', () => {
  const result = runHook(SCRIPT, bashInput('npm install'), { timeout: 3000 });
  assert.strictEqual(result.exitCode, 0, `exitCode should be 0, got ${result.exitCode}`);
  assert.ok(result.duration < 3000, `Duration ${result.duration}ms should be < 3000ms`);
});

// ---------- Summary ----------
console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
