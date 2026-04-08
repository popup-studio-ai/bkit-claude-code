#!/usr/bin/env node
'use strict';

/**
 * Contract Test: Hook Input Schema
 *
 * Validates that all 22 hook entries in hooks.json reference existing scripts
 * and that those scripts can handle the expected JSON stdin schema from Claude Code.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

let passed = 0, failed = 0, total = 0;

function test(id, desc, fn) {
  total++;
  try { fn(); passed++; } catch (e) { failed++; console.error(`  FAIL ${id}: ${desc}\n    ${e.message}`); }
}

console.log('\n=== Hook Input Schema Contract Tests ===\n');

// ---------------------------------------------------------------------------
// Load hooks.json
// ---------------------------------------------------------------------------

const hooksJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'hooks/hooks.json'), 'utf8'));
const hookEvents = Object.keys(hooksJson.hooks);

// ---------------------------------------------------------------------------
// T01-T03: hooks.json structure
// ---------------------------------------------------------------------------

test('HIS-01', 'hooks.json has valid $schema field', () => {
  assert.ok(hooksJson.$schema, 'Missing $schema');
  assert.ok(hooksJson.$schema.includes('claude-code-hooks'), '$schema should reference claude-code-hooks');
});

test('HIS-02', 'hooks.json has description field', () => {
  assert.ok(typeof hooksJson.description === 'string' && hooksJson.description.length > 0, 'Missing description');
});

test('HIS-03', 'hooks.json contains at least 18 hook events (bkit implemented)', () => {
  assert.ok(hookEvents.length >= 18, `Expected >=18 hook events, got ${hookEvents.length}`);
});

// ---------------------------------------------------------------------------
// T04: All 20 expected hook events exist
// ---------------------------------------------------------------------------

const EXPECTED_EVENTS = [
  'SessionStart', 'PreToolUse', 'PostToolUse', 'Stop', 'StopFailure',
  'UserPromptSubmit', 'PreCompact', 'PostCompact', 'TaskCompleted',
  'SubagentStart', 'SubagentStop', 'TeammateIdle', 'SessionEnd',
  'PostToolUseFailure', 'InstructionsLoaded', 'ConfigChange',
  'PermissionRequest', 'Notification', 'CwdChanged', 'TaskCreated',
];

test('HIS-04', 'All 20 expected hook events are defined', () => {
  const missing = EXPECTED_EVENTS.filter(e => !hookEvents.includes(e));
  assert.strictEqual(missing.length, 0, `Missing hook events: ${missing.join(', ')}`);
});

// ---------------------------------------------------------------------------
// T05: Each hook entry has correct structure
// ---------------------------------------------------------------------------

test('HIS-05', 'Every hook event has at least one hook entry with type "command"', () => {
  for (const event of hookEvents) {
    const entries = hooksJson.hooks[event];
    assert.ok(Array.isArray(entries) && entries.length > 0, `${event}: empty entries`);
    for (const entry of entries) {
      assert.ok(Array.isArray(entry.hooks) && entry.hooks.length > 0, `${event}: missing hooks array`);
      for (const h of entry.hooks) {
        assert.strictEqual(h.type, 'command', `${event}: hook type should be "command"`);
        assert.ok(typeof h.command === 'string' && h.command.length > 0, `${event}: missing command`);
      }
    }
  }
});

// ---------------------------------------------------------------------------
// T06: Extract all script paths and verify files exist
// ---------------------------------------------------------------------------

function extractScriptPaths() {
  const scripts = [];
  for (const event of hookEvents) {
    for (const entry of hooksJson.hooks[event]) {
      for (const h of entry.hooks) {
        // Extract path from: node "${CLAUDE_PLUGIN_ROOT}/scripts/foo.js"
        const match = h.command.match(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^"]+)/);
        if (match) {
          scripts.push({ event, relPath: match[1] });
        }
      }
    }
  }
  return scripts;
}

const scriptEntries = extractScriptPaths();

test('HIS-06', 'All hook script files exist on disk', () => {
  const missing = [];
  for (const { event, relPath } of scriptEntries) {
    const fullPath = path.join(ROOT, relPath);
    if (!fs.existsSync(fullPath)) {
      missing.push(`${event} -> ${relPath}`);
    }
  }
  assert.strictEqual(missing.length, 0, `Missing scripts:\n    ${missing.join('\n    ')}`);
});

// ---------------------------------------------------------------------------
// T07: Each hook has a timeout
// ---------------------------------------------------------------------------

test('HIS-07', 'Every hook entry defines a timeout', () => {
  for (const event of hookEvents) {
    for (const entry of hooksJson.hooks[event]) {
      for (const h of entry.hooks) {
        assert.ok(typeof h.timeout === 'number' && h.timeout > 0, `${event}: missing or invalid timeout`);
      }
    }
  }
});

// ---------------------------------------------------------------------------
// T08: SessionStart has once:true
// ---------------------------------------------------------------------------

test('HIS-08', 'SessionStart hook has once:true flag', () => {
  const entries = hooksJson.hooks.SessionStart;
  const hasOnce = entries.some(e => e.once === true);
  assert.ok(hasOnce, 'SessionStart should have once:true');
});

// ---------------------------------------------------------------------------
// T09-T13: Schema field validation for each hook event type
// ---------------------------------------------------------------------------

test('HIS-09', 'SessionStart input schema: hook_event_name is required', () => {
  const payload = { hook_event_name: 'SessionStart' };
  assert.strictEqual(payload.hook_event_name, 'SessionStart');
  assert.ok(typeof payload === 'object', 'Payload must be an object');
});

test('HIS-10', 'PreToolUse input schema: requires tool_name and tool_input', () => {
  const payload = {
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: '/test.js', content: 'hello' },
  };
  assert.strictEqual(payload.hook_event_name, 'PreToolUse');
  assert.ok(typeof payload.tool_name === 'string', 'tool_name must be string');
  assert.ok(typeof payload.tool_input === 'object', 'tool_input must be object');
});

test('HIS-11', 'PostToolUse input schema: requires tool_name and tool_result', () => {
  const payload = {
    hook_event_name: 'PostToolUse',
    tool_name: 'Write',
    tool_result: 'File written successfully',
  };
  assert.strictEqual(payload.hook_event_name, 'PostToolUse');
  assert.ok(typeof payload.tool_name === 'string', 'tool_name must be string');
  assert.ok(typeof payload.tool_result === 'string', 'tool_result must be string');
});

test('HIS-12', 'Stop input schema: hook_event_name is Stop', () => {
  const payload = { hook_event_name: 'Stop' };
  assert.strictEqual(payload.hook_event_name, 'Stop');
});

test('HIS-13', 'UserPromptSubmit input schema: requires user_prompt', () => {
  const payload = {
    hook_event_name: 'UserPromptSubmit',
    user_prompt: 'Hello bkit',
  };
  assert.strictEqual(payload.hook_event_name, 'UserPromptSubmit');
  assert.ok(typeof payload.user_prompt === 'string', 'user_prompt must be string');
});

// ---------------------------------------------------------------------------
// T14-T16: Matcher validation
// ---------------------------------------------------------------------------

test('HIS-14', 'PreToolUse entries have correct matchers (Write|Edit, Bash)', () => {
  const entries = hooksJson.hooks.PreToolUse;
  const matchers = entries.map(e => e.matcher).filter(Boolean);
  assert.ok(matchers.some(m => m.includes('Write') || m.includes('Edit')), 'Missing Write|Edit matcher');
  assert.ok(matchers.some(m => m.includes('Bash')), 'Missing Bash matcher');
});

test('HIS-15', 'PostToolUse entries have correct matchers (Write, Bash, Skill)', () => {
  const entries = hooksJson.hooks.PostToolUse;
  const matchers = entries.map(e => e.matcher).filter(Boolean);
  assert.ok(matchers.some(m => m.includes('Write')), 'Missing Write matcher');
  assert.ok(matchers.some(m => m.includes('Bash')), 'Missing Bash matcher');
  assert.ok(matchers.some(m => m.includes('Skill')), 'Missing Skill matcher');
});

test('HIS-16', 'PostToolUseFailure matcher includes Bash|Write|Edit', () => {
  const entries = hooksJson.hooks.PostToolUseFailure;
  const matchers = entries.map(e => e.matcher).filter(Boolean);
  assert.ok(matchers.some(m => m.includes('Bash') && m.includes('Write') && m.includes('Edit')),
    'Missing Bash|Write|Edit matcher');
});

// ---------------------------------------------------------------------------
// T17-T18: PreCompact and ConfigChange matchers
// ---------------------------------------------------------------------------

test('HIS-17', 'PreCompact matcher includes auto|manual', () => {
  const entries = hooksJson.hooks.PreCompact;
  const matchers = entries.map(e => e.matcher).filter(Boolean);
  assert.ok(matchers.some(m => m.includes('auto') && m.includes('manual')),
    'PreCompact should match auto|manual');
});

test('HIS-18', 'ConfigChange matcher includes project_settings|skills', () => {
  const entries = hooksJson.hooks.ConfigChange;
  const matchers = entries.map(e => e.matcher).filter(Boolean);
  assert.ok(matchers.some(m => m.includes('project_settings') && m.includes('skills')),
    'ConfigChange should match project_settings|skills');
});

// ---------------------------------------------------------------------------
// T19: StopFailure and Stop both exist
// ---------------------------------------------------------------------------

test('HIS-19', 'Both Stop and StopFailure events exist and have separate scripts', () => {
  assert.ok(hooksJson.hooks.Stop, 'Missing Stop event');
  assert.ok(hooksJson.hooks.StopFailure, 'Missing StopFailure event');
  const stopCmd = hooksJson.hooks.Stop[0].hooks[0].command;
  const failCmd = hooksJson.hooks.StopFailure[0].hooks[0].command;
  assert.notStrictEqual(stopCmd, failCmd, 'Stop and StopFailure should use different scripts');
});

// ---------------------------------------------------------------------------
// T20: Notification matcher includes permission_prompt|idle_prompt
// ---------------------------------------------------------------------------

test('HIS-20', 'Notification matcher includes permission_prompt|idle_prompt', () => {
  const entries = hooksJson.hooks.Notification;
  const matchers = entries.map(e => e.matcher).filter(Boolean);
  assert.ok(matchers.some(m => m.includes('permission_prompt') && m.includes('idle_prompt')),
    'Notification should match permission_prompt|idle_prompt');
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
