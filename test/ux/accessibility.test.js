#!/usr/bin/env node
'use strict';

/**
 * Accessibility Tests
 * Source: lib/ui/ansi.js
 * Tests NO_COLOR compliance and non-TTY output.
 */

const assert = require('assert');

let passed = 0, failed = 0, total = 0;
function test(id, desc, fn) {
  total++;
  try { fn(); passed++; } catch (e) { failed++; console.error(`  FAIL ${id}: ${desc}\n    ${e.message}`); }
}

console.log('\n=== Accessibility Tests ===\n');

// Force NO_COLOR for these tests
const origNoColor = process.env.NO_COLOR;
process.env.NO_COLOR = '1';

// Clear require cache to pick up NO_COLOR
const modPath = require.resolve('../../lib/ui/ansi');
delete require.cache[modPath];
const ansi = require('../../lib/ui/ansi');

// --- NO_COLOR compliance ---

test('AX-01', 'colorize returns plain text when NO_COLOR=1', () => {
  const result = ansi.colorize('hello', 'red');
  assert.strictEqual(result, 'hello', `Expected plain "hello", got "${result}"`);
});

test('AX-02', 'bold returns plain text when NO_COLOR=1', () => {
  const result = ansi.bold('hello');
  assert.strictEqual(result, 'hello', `Expected plain "hello", got "${result}"`);
});

test('AX-03', 'dim returns plain text when NO_COLOR=1', () => {
  const result = ansi.dim('hello');
  assert.strictEqual(result, 'hello', `Expected plain "hello", got "${result}"`);
});

test('AX-04', 'underline returns plain text when NO_COLOR=1', () => {
  const result = ansi.underline('hello');
  assert.strictEqual(result, 'hello', `Expected plain "hello", got "${result}"`);
});

test('AX-05', 'styled returns plain text when NO_COLOR=1', () => {
  const result = ansi.styled('hello', ['\x1b[1m', '\x1b[31m']);
  assert.strictEqual(result, 'hello', `Expected plain "hello", got "${result}"`);
});

test('AX-06', 'styled with empty styles array returns plain text', () => {
  const result = ansi.styled('hello', []);
  assert.strictEqual(result, 'hello', `Expected plain "hello", got "${result}"`);
});

test('AX-07', 'isColorDisabled returns true when NO_COLOR=1', () => {
  assert.strictEqual(ansi.isColorDisabled(), true, 'Should detect NO_COLOR=1');
});

// --- Non-TTY output ---

test('AX-08', 'stripAnsi removes ANSI escape sequences', () => {
  const input = '\x1b[31mhello\x1b[0m \x1b[1mworld\x1b[0m';
  const result = ansi.stripAnsi(input);
  assert.strictEqual(result, 'hello world', `Expected "hello world", got "${result}"`);
});

// Restore env
if (origNoColor === undefined) {
  delete process.env.NO_COLOR;
} else {
  process.env.NO_COLOR = origNoColor;
}

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
