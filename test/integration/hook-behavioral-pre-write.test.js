#!/usr/bin/env node
'use strict';

/**
 * hook-behavioral-pre-write.test.js - Behavioral tests for scripts/pre-write.js
 * Tests PreToolUse Write|Edit hook: file classification, env detection, PDCA guidance
 *
 * Note: pre-write.js depends on permission-manager which requires hierarchical config.
 * In test context, this causes a crash for file paths that trigger permission check.
 * We test the underlying modules directly and the hook's no-path edge case.
 *
 * @module test/integration/hook-behavioral-pre-write
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

console.log('\n=== Hook Behavioral: pre-write.js + core modules ===\n');

const SCRIPT = 'scripts/pre-write.js';

// ---------- T01: No file path produces empty output (exits before permission check) ----------
test('PW-01', 'No file path produces empty output (exit 0)', () => {
  const result = runHook(SCRIPT, { tool_name: 'Write', tool_input: {} });
  assert.strictEqual(result.exitCode, 0, `Expected exit 0, got ${result.exitCode}`);
  const out = typeof result.stdout === 'string' ? result.stdout : '';
  assert.ok(out === '' || out === '{}' || out.length === 0,
    `Should produce empty output when no file path, got: ${out}`);
});

// ---------- T02: parseHookInput extracts file_path correctly ----------
test('PW-02', 'parseHookInput extracts file_path from tool_input', () => {
  const { parseHookInput } = require('../../lib/core/io');
  const parsed = parseHookInput({
    tool_name: 'Write',
    tool_input: { file_path: 'src/index.js', content: 'hello' }
  });
  assert.strictEqual(parsed.filePath, 'src/index.js');
  assert.strictEqual(parsed.content, 'hello');
  assert.strictEqual(parsed.toolName, 'Write');
});

// ---------- T03: isEnvFile detects .env files ----------
test('PW-03', 'isEnvFile correctly identifies env files', () => {
  const { isEnvFile } = require('../../lib/core/file');
  assert.strictEqual(isEnvFile('.env'), true, '.env should be env file');
  assert.strictEqual(isEnvFile('.env.local'), true, '.env.local should be env file');
  assert.strictEqual(isEnvFile('.env.production'), true, '.env.production should be env file');
  assert.strictEqual(isEnvFile('src/index.js'), false, 'src/index.js should not be env file');
});

// ---------- T04: isSourceFile detects source files ----------
test('PW-04', 'isSourceFile correctly identifies source code files', () => {
  const { isSourceFile } = require('../../lib/core/file');
  assert.strictEqual(isSourceFile('src/App.tsx'), true, 'tsx should be source');
  assert.strictEqual(isSourceFile('lib/utils.js'), true, 'js should be source');
  assert.strictEqual(isSourceFile('README.md'), false, 'md should not be source');
});

// ---------- T05: isCodeFile detects code files ----------
test('PW-05', 'isCodeFile correctly identifies code files', () => {
  const { isCodeFile } = require('../../lib/core/file');
  assert.strictEqual(isCodeFile('src/App.tsx'), true, 'tsx should be code');
  assert.strictEqual(isCodeFile('src/utils.ts'), true, 'ts should be code');
  assert.strictEqual(isCodeFile('docs/plan.md'), false, 'md should not be code');
});

// ---------- T06: classifyTaskByLines categorizes by line count ----------
test('PW-06', 'classifyTaskByLines categorizes correctly', () => {
  const { classifyTaskByLines, getPdcaLevel } = require('../../lib/task/classification');

  // Small content = quick fix
  const small = 'const x = 1;';
  const smallClass = classifyTaskByLines(small);
  const smallLevel = getPdcaLevel(smallClass);
  assert.ok(['trivial', 'quick_fix', 'minor_change'].includes(smallClass),
    `Small content should be trivial/quick_fix/minor_change, got: ${smallClass}`);
  assert.strictEqual(smallLevel, 'none',
    `Small content PDCA level should be none, got: ${smallLevel}`);

  // Large content = major
  const large = Array(500).fill('const x = 1;').join('\n');
  const largeClass = classifyTaskByLines(large);
  const largeLevel = getPdcaLevel(largeClass);
  assert.ok(['feature', 'major_feature', 'major'].includes(largeClass),
    `Large content (500 lines) should be feature/major, got: ${largeClass}`);
  assert.ok(['recommended', 'required', 'full'].includes(largeLevel),
    `Large content PDCA level should be recommended/required/full, got: ${largeLevel}`);
});

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
