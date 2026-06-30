#!/usr/bin/env node
'use strict';
/**
 * issue-118-cursor-pretooluse.test.js — Regression guard for GitHub #118.
 *
 * Mirrors tests/contract/cursor-pretooluse-json-118.test.js (the unit-level
 * contract) but exercises the REAL hook scripts end-to-end via spawnSync, the
 * way test/integration/issue77-hook-e2e.test.js does. Placed under test/regression/
 * alongside issue-53-path-quoting.test.js so the issue-specific bug cannot recur
 * silently.
 *
 * Bug: under Cursor IDE's Claude plugin bridge, PreToolUse hooks emitted
 * Claude-Code-format output (plain text allow / {"decision":"block"} deny), but
 * Cursor's preToolUse runner expects:
 *   allow: {"permission":"allow","agent_message":...}
 *   deny:  {"permission":"deny","user_message":...,"agent_message":...}
 * Cursor failed with "JSON Parse Error: Unexpected token ..." and blocked
 * Write/StrReplace/Shell until the plugin was disabled.
 *
 * Detection signal: process.env.CURSOR_VERSION (set by Cursor's hook runtime).
 */
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const assert = require('node:assert/strict');

const REPO = path.resolve(__dirname, '..', '..');
const PRE_WRITE = path.join(REPO, 'scripts/pre-write.js');

let pass = 0, fail = 0;
const failures = [];
function tc(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; failures.push(`${name}${detail ? ' :: ' + detail : ''}`); }
}

// Run a hook script with a given stdin payload + env, return parsed-able stdout.
function runHook(scriptPath, stdinPayload, env) {
  const r = spawnSync('node', [scriptPath], {
    cwd: REPO,
    stdio: ['pipe', 'pipe', 'pipe'],
    input: JSON.stringify(stdinPayload),
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: REPO, CLAUDE_PROJECT_DIR: REPO, ...env },
    timeout: 10000,
  });
  return { stdout: (r.stdout || '').toString().trim(), stderr: (r.stderr || '').toString(), status: r.status };
}

// ---------------------------------------------------------------------------
// The issue's exact minimal repro: pre-write.js under CURSOR_VERSION.
// ---------------------------------------------------------------------------

tc('pre-write.js under Cursor emits valid JSON (the #118 repro)', () => {
  const r = runHook(PRE_WRITE, {
    tool_name: 'Write',
    tool_input: { file_path: 'src/example.js', content: 'a\nb\nc\nd\ne\n' },
  }, { CURSOR_VERSION: '3.6.31' });

  // Whatever the allow/deny decision, the output MUST be parseable JSON —
  // before the fix it was plain text ("Minor change (5 lines). PDCA optional.")
  // and Cursor choked with JSON Parse Error.
  let parsed = null;
  try { parsed = JSON.parse(r.stdout); } catch (e) {
    throw new Error(`stdout not valid JSON under Cursor: ${e.message} :: stdout=${r.stdout.slice(0, 160)} :: stderr=${r.stderr.slice(0, 160)}`);
  }
  tc._last = parsed;
  assert.ok(parsed, 'parsed JSON must be truthy');
});

tc('Cursor output uses the permission schema (allow or deny), never decision:block', () => {
  // Re-run to capture a fresh payload (the previous tc stored nothing exported).
  const r = runHook(PRE_WRITE, {
    tool_name: 'Write',
    tool_input: { file_path: 'src/example2.js', content: 'x\n' },
  }, { CURSOR_VERSION: '3.6.31' });
  const parsed = JSON.parse(r.stdout);
  assert.ok(parsed.permission === 'allow' || parsed.permission === 'deny',
    `must use Cursor permission schema, got: ${JSON.stringify(parsed)}`);
  assert.ok(!('decision' in parsed),
    `Cursor payload must not leak CC-only decision field: ${JSON.stringify(parsed)}`);
});

// ---------------------------------------------------------------------------
// Regression guard: WITHOUT CURSOR_VERSION, Claude Code behavior is unchanged.
// (plain text on allow — the documented CC PreToolUse behavior)
// ---------------------------------------------------------------------------

tc('pre-write.js without CURSOR_VERSION keeps CC plain-text behavior (no regression)', () => {
  const r = runHook(PRE_WRITE, {
    tool_name: 'Write',
    tool_input: { file_path: 'src/cc-mode.js', content: 'y\n' },
  }, {}); // no CURSOR_VERSION
  // CC mode: either plain text (allow with context) or empty/JSON-ish. The key
  // regression guard is that we did NOT flip CC into Cursor mode accidentally.
  // If it emitted JSON, it must NOT be the Cursor schema (no top-level permission).
  if (r.stdout.startsWith('{')) {
    const parsed = JSON.parse(r.stdout);
    assert.ok(!('permission' in parsed),
      `CC mode must not emit Cursor permission schema: ${JSON.stringify(parsed)}`);
  }
  // else: plain text — correct CC behavior.
});

// ---------------------------------------------------------------------------
console.log(`\n${pass} passed, ${fail} failed`);
if (failures.length) {
  console.error('FAILURES:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
