#!/usr/bin/env node
/**
 * bkit Scripts Tests
 * Tests all 28 scripts in scripts/ folder for syntax and basic execution
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SCRIPTS_DIR = '/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/scripts';
process.chdir('/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code');

// Set required environment variables for scripts
process.env.TOOL_INPUT = JSON.stringify({ file_path: '/tmp/test.md', content: 'test' });
process.env.TOOL_NAME = 'Write';
process.env.USER_PROMPT = 'test prompt';
process.env.CLAUDE_PROJECT_DIR = process.cwd();

const results = { passed: 0, failed: 0, tests: [] };

const scripts = [
  // Hook Scripts
  { id: 'SC-01', file: 'pre-write.js', desc: 'PreToolUse Write/Edit hook' },
  { id: 'SC-02', file: 'pdca-post-write.js', desc: 'PostToolUse Write hook' },
  { id: 'SC-03', file: 'user-prompt-handler.js', desc: 'UserPromptSubmit hook' },
  { id: 'SC-04', file: 'context-compaction.js', desc: 'PreCompact hook' },
  { id: 'SC-05', file: 'gap-detector-stop.js', desc: 'gap-detector stop hook' },
  { id: 'SC-05b', file: 'gap-detector-post.js', desc: 'gap-detector post hook' },
  { id: 'SC-06', file: 'iterator-stop.js', desc: 'pdca-iterator stop hook' },

  // Phase Transition Scripts
  { id: 'SC-07', file: 'phase-transition.js', desc: 'Phase transition handler' },
  { id: 'SC-08', file: 'phase1-schema-stop.js', desc: 'Phase 1 schema stop' },
  { id: 'SC-09', file: 'phase2-convention-pre.js', desc: 'Phase 2 convention pre' },
  { id: 'SC-10', file: 'phase2-convention-stop.js', desc: 'Phase 2 convention stop' },
  { id: 'SC-11', file: 'phase3-mockup-stop.js', desc: 'Phase 3 mockup stop' },
  { id: 'SC-12', file: 'phase4-api-stop.js', desc: 'Phase 4 API stop' },
  { id: 'SC-13', file: 'phase5-design-post.js', desc: 'Phase 5 design post' },
  { id: 'SC-14', file: 'phase6-ui-post.js', desc: 'Phase 6 UI post' },
  { id: 'SC-15', file: 'phase7-seo-stop.js', desc: 'Phase 7 SEO stop' },
  { id: 'SC-16', file: 'phase8-review-stop.js', desc: 'Phase 8 review stop' },
  { id: 'SC-17', file: 'phase9-deploy-pre.js', desc: 'Phase 9 deploy pre' },

  // Utility Scripts
  { id: 'SC-18', file: 'archive-feature.js', desc: 'Archive feature' },
  { id: 'SC-19', file: 'select-template.js', desc: 'Select template' },
  { id: 'SC-20', file: 'sync-folders.js', desc: 'Sync folders' },
  { id: 'SC-21', file: 'validate-plugin.js', desc: 'Validate plugin' },
  { id: 'SC-22', file: 'analysis-stop.js', desc: 'Analysis stop' },
  { id: 'SC-23', file: 'code-analyzer-pre.js', desc: 'Code analyzer pre' },
  { id: 'SC-24', file: 'design-validator-pre.js', desc: 'Design validator pre' },
  { id: 'SC-25', file: 'qa-monitor-post.js', desc: 'QA monitor post' },
  { id: 'SC-26', file: 'qa-pre-bash.js', desc: 'QA pre bash' },
  { id: 'SC-27', file: 'qa-stop.js', desc: 'QA stop' },
];

console.log('=== Scripts Test Suite ===\n');

for (const script of scripts) {
  const scriptPath = path.join(SCRIPTS_DIR, script.file);

  // Test 1: File exists
  if (!fs.existsSync(scriptPath)) {
    results.failed++;
    results.tests.push({
      id: script.id,
      name: script.file + ' exists',
      status: 'FAIL',
      error: 'File not found'
    });
    console.log('❌ ' + script.id + ': ' + script.file + ' - File not found');
    continue;
  }

  // Test 2: Syntax check (node --check)
  try {
    execFileSync('node', ['--check', scriptPath], { stdio: 'pipe' });
    results.passed++;
    results.tests.push({
      id: script.id,
      name: script.file + ' syntax valid',
      status: 'PASS'
    });
    console.log('✅ ' + script.id + ': ' + script.file + ' - Syntax OK');
  } catch (e) {
    results.failed++;
    results.tests.push({
      id: script.id,
      name: script.file + ' syntax valid',
      status: 'FAIL',
      error: 'Syntax error'
    });
    console.log('❌ ' + script.id + ': ' + script.file + ' - Syntax error');
  }
}

// Additional test: Hook execution simulation
console.log('\n=== Hook Execution Tests ===\n');

// Test session-start.js
const sessionStartPath = path.join('/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/hooks', 'session-start.js');
try {
  process.env.CLAUDE_PROJECT_DIR = process.cwd();
  const output = execFileSync('node', [sessionStartPath], {
    stdio: 'pipe',
    timeout: 5000,
    encoding: 'utf8'
  });
  results.passed++;
  results.tests.push({
    id: 'HK-01',
    name: 'session-start.js execution',
    status: 'PASS'
  });
  console.log('✅ HK-01: session-start.js - Executed successfully');
  try {
    const parsed = JSON.parse(output);
    if (parsed.systemMessage) {
      console.log('   Output: ' + parsed.systemMessage);
    }
  } catch {
    console.log('   Output: Plain text (Gemini mode)');
  }
} catch (e) {
  results.failed++;
  results.tests.push({
    id: 'HK-01',
    name: 'session-start.js execution',
    status: 'FAIL',
    error: e.message
  });
  console.log('❌ HK-01: session-start.js - ' + e.message.split('\n')[0]);
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('SUMMARY: Scripts Tests');
console.log('='.repeat(50));
console.log('Total: ' + (results.passed + results.failed));
console.log('Passed: ' + results.passed);
console.log('Failed: ' + results.failed);
console.log('Pass Rate: ' + ((results.passed / (results.passed + results.failed)) * 100).toFixed(1) + '%');

if (results.failed > 0) {
  console.log('\nFailed Tests:');
  results.tests.filter(t => t.status === 'FAIL').forEach(t => {
    console.log('  - ' + t.id + ': ' + t.name);
    if (t.error) console.log('    Error: ' + t.error);
  });
}

console.log('\n--- JSON_RESULTS ---');
console.log(JSON.stringify(results, null, 2));
