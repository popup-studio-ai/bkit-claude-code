#!/usr/bin/env node
/**
 * bkit Hooks Integration Tests
 * Tests all 5 hook event handlers
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PLUGIN_ROOT = '/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code';
process.chdir(PLUGIN_ROOT);

// Set environment variables
process.env.CLAUDE_PROJECT_DIR = PLUGIN_ROOT;
process.env.BKIT_PLATFORM = 'claude';

const results = { passed: 0, failed: 0, tests: [] };

const hooks = [
  {
    id: 'HK-01',
    name: 'SessionStart',
    script: 'hooks/session-start.js',
    env: {}
  },
  {
    id: 'HK-02',
    name: 'PreToolUse (Write)',
    script: 'scripts/pre-write.js',
    env: {
      TOOL_INPUT: JSON.stringify({ file_path: '/tmp/test.md', content: 'test content' }),
      TOOL_NAME: 'Write'
    }
  },
  {
    id: 'HK-03',
    name: 'PostToolUse (Write)',
    script: 'scripts/pdca-post-write.js',
    env: {
      TOOL_INPUT: JSON.stringify({ file_path: '/tmp/test.md', content: 'test content' }),
      TOOL_NAME: 'Write',
      TOOL_RESPONSE: JSON.stringify({ success: true })
    }
  },
  {
    id: 'HK-04',
    name: 'UserPromptSubmit',
    script: 'scripts/user-prompt-handler.js',
    env: {
      USER_PROMPT: 'Test prompt for hook',
      SESSION_ID: 'test-session-123'
    }
  },
  {
    id: 'HK-05',
    name: 'PreCompact',
    script: 'scripts/context-compaction.js',
    env: {
      CONVERSATION_TURNS: '10',
      TOKEN_COUNT: '50000'
    }
  }
];

console.log('=== Hooks Integration Test Suite ===\n');

for (const hook of hooks) {
  const scriptPath = path.join(PLUGIN_ROOT, hook.script);

  // Check if file exists
  if (!fs.existsSync(scriptPath)) {
    results.failed++;
    results.tests.push({
      id: hook.id,
      name: hook.name,
      status: 'FAIL',
      error: 'Script not found: ' + hook.script
    });
    console.log(`❌ ${hook.id}: ${hook.name} - Script not found`);
    continue;
  }

  try {
    // Set hook-specific env vars
    for (const [key, value] of Object.entries(hook.env)) {
      process.env[key] = value;
    }

    const output = execFileSync('node', [scriptPath], {
      stdio: 'pipe',
      timeout: 10000,
      encoding: 'utf8',
      env: { ...process.env, ...hook.env }
    });

    results.passed++;
    results.tests.push({
      id: hook.id,
      name: hook.name,
      status: 'PASS',
      output: output.substring(0, 200)
    });
    console.log(`✅ ${hook.id}: ${hook.name} - Executed successfully`);

    // Parse output if JSON
    try {
      const parsed = JSON.parse(output);
      if (parsed.systemMessage) {
        console.log(`   Output: ${parsed.systemMessage.substring(0, 80)}...`);
      } else if (parsed.decision) {
        console.log(`   Decision: ${parsed.decision}`);
      }
    } catch {
      if (output.trim()) {
        console.log(`   Output: ${output.trim().substring(0, 80)}...`);
      }
    }

  } catch (e) {
    // Check if it's a controlled exit (some hooks exit with code 0 for "continue")
    if (e.status === 0) {
      results.passed++;
      results.tests.push({
        id: hook.id,
        name: hook.name,
        status: 'PASS',
        note: 'Clean exit'
      });
      console.log(`✅ ${hook.id}: ${hook.name} - Clean exit`);
    } else {
      results.failed++;
      results.tests.push({
        id: hook.id,
        name: hook.name,
        status: 'FAIL',
        error: e.message.split('\n')[0]
      });
      console.log(`❌ ${hook.id}: ${hook.name} - ${e.message.split('\n')[0]}`);
    }
  }
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('SUMMARY: Hooks Integration Tests');
console.log('='.repeat(50));
console.log(`Total: ${results.passed + results.failed}`);
console.log(`Passed: ${results.passed}`);
console.log(`Failed: ${results.failed}`);
console.log(`Pass Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

if (results.failed > 0) {
  console.log('\nFailed Tests:');
  results.tests.filter(t => t.status === 'FAIL').forEach(t => {
    console.log(`  - ${t.id}: ${t.name}`);
    if (t.error) console.log(`    Error: ${t.error}`);
  });
}

console.log('\n--- JSON_RESULTS ---');
console.log(JSON.stringify(results, null, 2));
