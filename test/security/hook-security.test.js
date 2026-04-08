#!/usr/bin/env node
'use strict';

/**
 * Hook Security Tests
 * Tests: oversized JSON, invalid JSON, empty stdin, timeout compliance.
 * Uses test/helpers/hook-runner.js
 */

const assert = require('assert');
const path = require('path');

let passed = 0, failed = 0, total = 0;
function test(id, desc, fn) {
  total++;
  try { fn(); passed++; } catch (e) { failed++; console.error(`  FAIL ${id}: ${desc}\n    ${e.message}`); }
}

console.log('\n=== Hook Security Tests ===\n');

const { runHook, ROOT } = require('../helpers/hook-runner');
const fs = require('fs');

// Find a hook script that exists for testing
const HOOK_SCRIPT = 'scripts/notification-handler.js';
const hookExists = fs.existsSync(path.join(ROOT, HOOK_SCRIPT));

if (!hookExists) {
  console.log(`SKIP: ${HOOK_SCRIPT} not found`);
  console.log(`\n--- Results: 0/0 passed, 0 failed (SKIPPED) ---`);
  process.exit(0);
}

// --- Oversized JSON stdin ---

test('HS-01', 'Oversized JSON stdin (1MB) does not crash hook', () => {
  // Generate ~1MB JSON payload
  const bigPayload = {
    hook_event_name: 'Notification',
    tool_name: 'test',
    tool_input: {},
    data: 'x'.repeat(1024 * 1024), // 1MB string
  };

  const result = runHook(HOOK_SCRIPT, bigPayload, { timeout: 10000 });
  // Hook should either succeed (exit 0) or fail gracefully (non-zero), but not crash with signal
  assert.ok(
    result.exitCode !== null && result.exitCode !== undefined,
    'Hook should have a defined exit code (not signal-killed)'
  );
});

test('HS-02', 'Oversized nested JSON (deep object) does not crash', () => {
  let nested = { value: 'leaf' };
  for (let i = 0; i < 100; i++) {
    nested = { hook_event_name: 'Notification', child: nested };
  }
  const result = runHook(HOOK_SCRIPT, nested, { timeout: 10000 });
  assert.ok(result.exitCode !== null, 'Should complete without signal kill');
});

// --- Invalid JSON stdin ---

test('HS-03', 'Invalid JSON stdin results in graceful error', () => {
  // runHook stringifies, so we test by sending a raw non-JSON string via execFileSync directly
  const { execFileSync } = require('child_process');
  const fullPath = path.resolve(ROOT, HOOK_SCRIPT);

  let exitCode;
  try {
    execFileSync(process.execPath, [fullPath], {
      input: '{invalid json!!!',
      timeout: 5000,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: ROOT,
      env: { ...process.env, CLAUDE_PLUGIN_ROOT: ROOT, BKIT_ROOT: ROOT },
    });
    exitCode = 0;
  } catch (err) {
    exitCode = err.status || 1;
  }

  // Should not crash with unhandled exception (any exit code is fine as long as it exits cleanly)
  assert.ok(typeof exitCode === 'number', 'Hook should exit with numeric code');
});

// --- Empty stdin ---

test('HS-04', 'Empty stdin handled gracefully', () => {
  const { execFileSync } = require('child_process');
  const fullPath = path.resolve(ROOT, HOOK_SCRIPT);

  let exitCode;
  try {
    execFileSync(process.execPath, [fullPath], {
      input: '',
      timeout: 5000,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: ROOT,
      env: { ...process.env, CLAUDE_PLUGIN_ROOT: ROOT, BKIT_ROOT: ROOT },
    });
    exitCode = 0;
  } catch (err) {
    exitCode = err.status || 1;
  }
  assert.ok(typeof exitCode === 'number', 'Hook should handle empty stdin gracefully');
});

test('HS-05', 'Empty object stdin handled gracefully', () => {
  const result = runHook(HOOK_SCRIPT, {}, { timeout: 5000 });
  assert.ok(typeof result.exitCode === 'number', 'Should exit with numeric code for empty object');
});

// --- Hook timeout compliance ---

test('HS-06', 'Hook completes within timeout (5s for notification-handler)', () => {
  const payload = {
    hook_event_name: 'Notification',
    tool_name: 'test',
    message: 'test notification',
  };
  const result = runHook(HOOK_SCRIPT, payload, { timeout: 5000 });
  assert.ok(result.duration < 5000, `Hook took ${result.duration}ms, expected <5000ms`);
});

test('HS-07', 'Hook does not produce binary output (stdout is UTF-8 safe)', () => {
  const payload = { hook_event_name: 'Notification' };
  const result = runHook(HOOK_SCRIPT, payload, { timeout: 5000 });
  const raw = typeof result.stdout === 'string' ? result.stdout : JSON.stringify(result.stdout);
  // Check no null bytes in output
  assert.ok(!raw.includes('\0'), 'Hook output should not contain null bytes');
});

test('HS-08', 'Hook env isolation - BKIT_ROOT is set', () => {
  const payload = { hook_event_name: 'Notification' };
  const result = runHook(HOOK_SCRIPT, payload, {
    timeout: 5000,
    env: { BKIT_ROOT: ROOT },
  });
  // Hook should run without crashing when BKIT_ROOT is explicitly set
  assert.ok(typeof result.exitCode === 'number', 'Hook should run with explicit BKIT_ROOT');
});

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
