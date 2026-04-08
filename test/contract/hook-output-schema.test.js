#!/usr/bin/env node
'use strict';

/**
 * Contract Test: Hook Output Schema
 *
 * Validates that hook scripts produce output matching CC expectations.
 * Uses test/helpers/hook-runner.js to execute hooks and verify output structure.
 */

const assert = require('assert');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

let runHook;
try {
  ({ runHook } = require(path.join(ROOT, 'test/helpers/hook-runner.js')));
} catch (e) {
  console.error('Cannot load hook-runner.js:', e.message);
  process.exit(1);
}

let passed = 0, failed = 0, skipped = 0, total = 0;

function test(id, desc, fn) {
  total++;
  try { fn(); passed++; } catch (e) {
    if (e.message && e.message.includes('SKIP')) { skipped++; console.log(`  SKIP ${id}: ${desc}`); }
    else { failed++; console.error(`  FAIL ${id}: ${desc}\n    ${e.message}`); }
  }
}

console.log('\n=== Hook Output Schema Contract Tests ===\n');

// ---------------------------------------------------------------------------
// T01-T03: PreToolUse:Write|Edit output
// ---------------------------------------------------------------------------

test('HOS-01', 'PreToolUse:Write returns valid output (exit 0, 1, or 2)', () => {
  const result = runHook('scripts/pre-write.js', {
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: '/tmp/test-bkit-output.js', content: '// test' },
  }, { timeout: 5000 });
  // Exit 0 = allow (no output or JSON), exit 1 = internal error (graceful), exit 2 = block
  assert.ok([0, 1, 2].includes(result.exitCode), `Unexpected exit code: ${result.exitCode}`);
  if (typeof result.stdout === 'object' && result.stdout !== null && result.stdout.decision) {
    assert.ok(['allow', 'block', 'approve'].includes(result.stdout.decision),
      `Invalid decision: ${result.stdout.decision}`);
  }
});

test('HOS-02', 'PreToolUse:Edit returns valid output format', () => {
  const result = runHook('scripts/pre-write.js', {
    hook_event_name: 'PreToolUse',
    tool_name: 'Edit',
    tool_input: { file_path: '/tmp/test.js', old_string: 'a', new_string: 'b' },
  }, { timeout: 5000 });
  assert.ok([0, 1, 2].includes(result.exitCode), `Unexpected exit code: ${result.exitCode}`);
});

test('HOS-03', 'PreToolUse:Bash returns valid output format', () => {
  const result = runHook('scripts/unified-bash-pre.js', {
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    tool_input: { command: 'echo hello' },
  }, { timeout: 5000 });
  assert.ok(result.exitCode === 0 || result.exitCode === 2, `Unexpected exit code: ${result.exitCode}`);
  if (typeof result.stdout === 'object' && result.stdout !== null && result.stdout.decision) {
    assert.ok(['allow', 'block', 'approve'].includes(result.stdout.decision),
      `Invalid decision: ${result.stdout.decision}`);
  }
});

// ---------------------------------------------------------------------------
// T04-T05: UserPromptSubmit output
// ---------------------------------------------------------------------------

test('HOS-04', 'UserPromptSubmit returns valid output (description or additionalContext)', () => {
  const result = runHook('scripts/user-prompt-handler.js', {
    hook_event_name: 'UserPromptSubmit',
    user_prompt: 'bkit help',
  }, { timeout: 5000 });
  assert.ok(result.exitCode === 0, `Unexpected exit code: ${result.exitCode}`);
  // Output can be empty, or JSON with description/additionalContext
  if (typeof result.stdout === 'object' && result.stdout !== null) {
    const keys = Object.keys(result.stdout);
    if (keys.length > 0) {
      const validKeys = ['description', 'additionalContext', 'suppressOriginalPrompt'];
      const hasValidKey = keys.some(k => validKeys.includes(k));
      assert.ok(hasValidKey, `Unexpected output keys: ${keys.join(', ')}`);
    }
  }
});

test('HOS-05', 'UserPromptSubmit with empty prompt returns exit 0', () => {
  const result = runHook('scripts/user-prompt-handler.js', {
    hook_event_name: 'UserPromptSubmit',
    user_prompt: '',
  }, { timeout: 5000 });
  assert.ok(result.exitCode === 0, `Expected exit 0, got ${result.exitCode}`);
});

// ---------------------------------------------------------------------------
// T06-T07: Stop output
// ---------------------------------------------------------------------------

test('HOS-06', 'Stop hook returns exit 0 (may have empty or JSON output)', () => {
  const result = runHook('scripts/unified-stop.js', {
    hook_event_name: 'Stop',
    stop_reason: 'end_turn',
  }, { timeout: 10000 });
  assert.ok(result.exitCode === 0, `Expected exit 0, got ${result.exitCode}`);
  if (typeof result.stdout === 'object' && result.stdout !== null && result.stdout.description) {
    assert.ok(typeof result.stdout.description === 'string', 'description must be string');
  }
});

test('HOS-07', 'StopFailure hook returns exit 0', () => {
  const result = runHook('scripts/stop-failure-handler.js', {
    hook_event_name: 'StopFailure',
    error: 'test error',
  }, { timeout: 5000 });
  assert.ok(result.exitCode === 0, `Expected exit 0, got ${result.exitCode}`);
});

// ---------------------------------------------------------------------------
// T08-T09: PostToolUse output
// ---------------------------------------------------------------------------

test('HOS-08', 'PostToolUse:Write returns exit 0', () => {
  const result = runHook('scripts/unified-write-post.js', {
    hook_event_name: 'PostToolUse',
    tool_name: 'Write',
    tool_input: { file_path: '/tmp/test-bkit.js', content: '// test' },
    tool_result: 'File written',
  }, { timeout: 5000 });
  assert.ok(result.exitCode === 0, `Expected exit 0, got ${result.exitCode}`);
});

test('HOS-09', 'PostToolUse:Bash returns exit 0', () => {
  const result = runHook('scripts/unified-bash-post.js', {
    hook_event_name: 'PostToolUse',
    tool_name: 'Bash',
    tool_input: { command: 'echo hello' },
    tool_result: 'hello\n',
  }, { timeout: 5000 });
  assert.ok(result.exitCode === 0, `Expected exit 0, got ${result.exitCode}`);
});

// ---------------------------------------------------------------------------
// T10: Hook output does not exceed 50K
// ---------------------------------------------------------------------------

test('HOS-10', 'Hook output stays under 50K characters', () => {
  const result = runHook('scripts/unified-stop.js', {
    hook_event_name: 'Stop',
    stop_reason: 'end_turn',
  }, { timeout: 10000 });
  const outputStr = typeof result.stdout === 'string' ? result.stdout : JSON.stringify(result.stdout);
  assert.ok(outputStr.length < 50000, `Output too large: ${outputStr.length} chars`);
});

// ---------------------------------------------------------------------------
// T11: Hook completes within timeout
// ---------------------------------------------------------------------------

test('HOS-11', 'SessionStart hook completes within 5s timeout', () => {
  const result = runHook('hooks/session-start.js', {
    hook_event_name: 'SessionStart',
  }, { timeout: 5000 });
  assert.ok(result.duration < 5000, `Took too long: ${result.duration}ms`);
});

// ---------------------------------------------------------------------------
// T12: PostToolUse:Skill returns exit 0
// ---------------------------------------------------------------------------

test('HOS-12', 'PostToolUse:Skill returns exit 0', () => {
  const result = runHook('scripts/skill-post.js', {
    hook_event_name: 'PostToolUse',
    tool_name: 'Skill',
    tool_input: { skill: 'pdca', args: 'status' },
    tool_result: 'Skill completed',
  }, { timeout: 5000 });
  assert.ok(result.exitCode === 0, `Expected exit 0, got ${result.exitCode}`);
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed, ${skipped} skipped ---`);
if (failed > 0) process.exit(1);
