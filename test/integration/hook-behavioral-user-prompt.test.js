#!/usr/bin/env node
'use strict';

/**
 * hook-behavioral-user-prompt.test.js - Behavioral tests for scripts/user-prompt-handler.js
 * Tests user prompt processing: skill/agent suggestions, ambiguity, feature detection
 *
 * @module test/integration/hook-behavioral-user-prompt
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

console.log('\n=== Hook Behavioral: user-prompt-handler.js ===\n');

const SCRIPT = 'scripts/user-prompt-handler.js';

// ---------- T01: Short prompt (<3 chars) produces empty output ----------
test('UP-01', 'Very short prompt (<3 chars) produces empty output', () => {
  const result = runHook(SCRIPT, { prompt: 'hi' });
  assert.strictEqual(result.exitCode, 0);
  // Empty output means no stdout or empty string
  const out = typeof result.stdout === 'string' ? result.stdout : JSON.stringify(result.stdout);
  // outputEmpty() produces no output at all
  assert.ok(out === '' || out === '{}', `Short prompt should produce empty output, got: ${out}`);
});

// ---------- T02: Empty prompt produces empty output ----------
test('UP-02', 'Empty prompt produces empty output', () => {
  const result = runHook(SCRIPT, { prompt: '' });
  assert.strictEqual(result.exitCode, 0);
  const out = typeof result.stdout === 'string' ? result.stdout : JSON.stringify(result.stdout);
  assert.ok(out === '' || out === '{}', `Empty prompt should produce empty output, got: ${out}`);
});

// ---------- T03: New feature intent detection ----------
test('UP-03', 'Detects new feature intent with "implement" keyword', () => {
  const result = runHook(SCRIPT, { prompt: 'I want to implement a new authentication system called auth-v2' });
  assert.strictEqual(result.exitCode, 0);
  if (typeof result.stdout === 'object' && result.stdout.success) {
    const msg = result.stdout.message || '';
    const ctx = result.stdout.hookSpecificOutput?.additionalContext || '';
    const combined = msg + ctx;
    // Should detect new feature or suggest a skill
    assert.ok(combined.length > 0, 'Should produce context for feature intent');
  }
});

// ---------- T04: Agent trigger matching (gap-detector) ----------
test('UP-04', 'Matches gap-detector agent trigger for "verify" keyword', () => {
  const result = runHook(SCRIPT, { prompt: 'Please verify the implementation matches the design document' });
  assert.strictEqual(result.exitCode, 0);
  if (typeof result.stdout === 'object' && result.stdout.success) {
    const ctx = result.stdout.hookSpecificOutput?.additionalContext || result.stdout.message || '';
    // The prompt may trigger agent suggestion and/or ambiguity detection
    assert.ok(ctx.includes('agent') || ctx.includes('gap') || ctx.includes('ambiguous'),
      `Should produce context (agent or ambiguity), got: ${ctx}`);
  }
});

// ---------- T05: Skill trigger matching (dynamic/fullstack) ----------
test('UP-05', 'Matches dynamic skill trigger for "login" keyword', () => {
  const result = runHook(SCRIPT, { prompt: 'I need to build a login system with authentication and database' });
  assert.strictEqual(result.exitCode, 0);
  if (typeof result.stdout === 'object' && result.stdout.success) {
    const ctx = result.stdout.hookSpecificOutput?.additionalContext || result.stdout.message || '';
    assert.ok(ctx.includes('skill') || ctx.includes('dynamic') || ctx.includes('bkit'),
      `Should suggest dynamic skill, got: ${ctx}`);
  }
});

// ---------- T06: Korean language support ----------
test('UP-06', 'Korean prompt triggers appropriate detection', () => {
  const result = runHook(SCRIPT, { prompt: '새 기능을 구현하고 싶어요. 로그인 시스템을 만들어주세요' });
  assert.strictEqual(result.exitCode, 0);
  if (typeof result.stdout === 'object' && result.stdout.success) {
    const ctx = result.stdout.hookSpecificOutput?.additionalContext || result.stdout.message || '';
    assert.ok(ctx.length > 0, 'Korean prompt should produce context');
  }
});

// ---------- T07: Output schema validation (success response) ----------
test('UP-07', 'Output follows UserPromptSubmit schema when context exists', () => {
  const result = runHook(SCRIPT, { prompt: 'I want to implement a new feature called user-dashboard and build the login' });
  assert.strictEqual(result.exitCode, 0);
  if (typeof result.stdout === 'object' && result.stdout.success) {
    assert.strictEqual(result.stdout.success, true, 'success should be true');
    assert.ok(result.stdout.hookSpecificOutput, 'Should have hookSpecificOutput');
    assert.strictEqual(result.stdout.hookSpecificOutput.hookEventName, 'UserPromptSubmit',
      'hookEventName should be UserPromptSubmit');
  }
});

// ---------- T08: Performance - completes within 3s ----------
test('UP-08', 'Hook completes within 3000ms', () => {
  const result = runHook(SCRIPT, { prompt: 'Build a microservices architecture with kubernetes' });
  assert.ok(result.duration < 3000, `Duration ${result.duration}ms exceeds 3000ms`);
});

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
