#!/usr/bin/env node
'use strict';

/**
 * CJK Rendering Tests
 * Source: lib/ui/ansi.js, lib/ui/progress-bar.js
 * Tests truncate() with CJK characters and display width handling.
 */

const assert = require('assert');

let passed = 0, failed = 0, total = 0;
function test(id, desc, fn) {
  total++;
  try { fn(); passed++; } catch (e) { failed++; console.error(`  FAIL ${id}: ${desc}\n    ${e.message}`); }
}

console.log('\n=== CJK Rendering Tests ===\n');

const { truncate, stripAnsi } = require('../../lib/ui/ansi');

// --- truncate with CJK characters ---

test('CJK-01', 'truncate Korean text (한국어) respects maxLen', () => {
  const text = '한국어 테스트 문자열입니다';
  const result = truncate(text, 5);
  // truncate uses string length (not display width), so 5 chars = 4 chars + ellipsis
  assert.ok(result.length <= 5, `Truncated length ${result.length} exceeds maxLen 5`);
  assert.ok(result.endsWith('\u2026') || result === text.slice(0, 5),
    'Should end with ellipsis or be truncated');
});

test('CJK-02', 'truncate Japanese text (日本語) respects maxLen', () => {
  const text = '日本語テスト文字列です';
  const result = truncate(text, 6);
  assert.ok(result.length <= 6, `Truncated length ${result.length} exceeds maxLen 6`);
});

test('CJK-03', 'truncate Chinese text (中文) respects maxLen', () => {
  const text = '中文测试字符串';
  const result = truncate(text, 4);
  assert.ok(result.length <= 4, `Truncated length ${result.length} exceeds maxLen 4`);
  assert.ok(result.endsWith('\u2026'), 'Should end with ellipsis when truncated');
});

test('CJK-04', 'truncate mixed CJK + ASCII text', () => {
  const text = 'Hello 한국어 World';
  const result = truncate(text, 8);
  assert.ok(result.length <= 8, `Truncated length ${result.length} exceeds maxLen 8`);
});

test('CJK-05', 'truncate does not break CJK text when maxLen=1', () => {
  const text = '한국어';
  const result = truncate(text, 1);
  // maxLen=1 should return just the ellipsis
  assert.strictEqual(result, '\u2026', `Expected ellipsis, got "${result}"`);
});

// --- stripAnsi with CJK ---

test('CJK-06', 'stripAnsi preserves CJK characters', () => {
  const input = '\x1b[31m한국어\x1b[0m \x1b[32m日本語\x1b[0m \x1b[33m中文\x1b[0m';
  const result = stripAnsi(input);
  assert.strictEqual(result, '한국어 日本語 中文',
    `Expected "한국어 日本語 中文", got "${result}"`);
});

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
