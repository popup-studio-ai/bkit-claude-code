'use strict';
/**
 * cursor-pretooluse-json-118.test.js — Contract for GitHub issue #118.
 *
 * When bkit runs under Cursor IDE's Claude plugin bridge, the PreToolUse hook
 * runner expects a DIFFERENT JSON schema than Claude Code:
 *   allow: {"permission":"allow","agent_message":...}
 *   deny:  {"permission":"deny","user_message":...,"agent_message":...}
 *
 * Claude Code format (must remain the default):
 *   allow: plain text (or nothing) on stdout
 *   deny:  {"decision":"block","reason":...}
 *
 * Detection signal: process.env.CURSOR_VERSION is set by Cursor's hook runtime.
 * See issue #118: lib/core/io.js outputAllow/outputBlock/outputBlockWithContext
 * must branch on CURSOR_VERSION.
 *
 * These tests stub console.log + process.exit and toggle CURSOR_VERSION via a
 * fresh require (delete cache) so the env read at call time is honored.
 */
const assert = require('node:assert/strict');
const path = require('node:path');

const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const IO_PATH = path.join(PLUGIN_ROOT, 'lib/core/io.js');

let pass = 0, fail = 0;
const failures = [];

function tc(name, fn) {
  try { fn(); pass++; } catch (e) { fail++; failures.push({ name, msg: e.message }); }
}

// Capture console.log output and suppress process.exit so block fns don't kill
// the test process. Returns whatever was printed.
function captureOutput(fn) {
  const lines = [];
  const origLog = console.log;
  const origExit = process.exit;
  console.log = (...a) => { lines.push(a.map(String).join(' ')); };
  process.exit = (code) => { lines.push(`__EXIT_${code}__`); };
  try { fn(); } finally { console.log = origLog; process.exit = origExit; }
  return lines;
}

// io.js reads CURSOR_VERSION at call time, so we don't need to re-require per
// case — just set/clear the env var around each call.
function freshIo() {
  delete require.cache[require.resolve(IO_PATH)];
  return require(IO_PATH);
}

// ---------------------------------------------------------------------------
// 1. Claude Code format (default, CURSOR_VERSION unset) — REGRESSION GUARD
// ---------------------------------------------------------------------------

tc('CC allow: plain text on stdout when context present, nothing when empty', () => {
  const io = freshIo();
  // With context -> plain text (NOT JSON). This is the documented CC behavior.
  const withCtx = captureOutput(() => io.outputAllow('Minor change (5 lines).', 'PreToolUse'));
  assert.strictEqual(withCtx.length, 1, 'should print exactly one line');
  assert.strictEqual(withCtx[0], 'Minor change (5 lines).');
  // Must NOT be valid JSON object (that's the whole point of the bug).
  assert.ok(!/^\{.*\}$/.test(withCtx[0]), 'CC allow must be plain text, not JSON');

  // Without context -> no output at all.
  const empty = captureOutput(() => io.outputAllow('', 'PreToolUse'));
  assert.strictEqual(empty.length, 0, 'CC allow with no context prints nothing');
});

tc('CC allow: SessionStart/UserPromptSubmit emit {success,message} JSON (unchanged)', () => {
  const io = freshIo();
  const out = captureOutput(() => io.outputAllow('hello', 'SessionStart'));
  assert.strictEqual(out.length, 1);
  const parsed = JSON.parse(out[0]);
  assert.strictEqual(parsed.success, true);
  assert.strictEqual(parsed.message, 'hello');
});

tc('CC deny: {decision:"block",reason} JSON + exit(0) (unchanged)', () => {
  const io = freshIo();
  const out = captureOutput(() => io.outputBlock('not allowed'));
  assert.strictEqual(out.length, 2, 'block prints payload + exit marker');
  const parsed = JSON.parse(out[0]);
  assert.strictEqual(parsed.decision, 'block');
  assert.strictEqual(parsed.reason, 'not allowed');
  assert.strictEqual(out[1], '__EXIT_0__');
});

// ---------------------------------------------------------------------------
// 2. Cursor format (CURSOR_VERSION set) — THE FIX
// ---------------------------------------------------------------------------

tc('Cursor allow: emits {"permission":"allow","agent_message":...}', () => {
  process.env.CURSOR_VERSION = '3.6.31';
  try {
    const io = freshIo();
    const out = captureOutput(() => io.outputAllow('Minor change (5 lines).', 'PreToolUse'));
    assert.strictEqual(out.length, 1, 'single JSON line');
    const parsed = JSON.parse(out[0]);
    assert.strictEqual(parsed.permission, 'allow', 'must use Cursor allow schema');
    assert.strictEqual(parsed.agent_message, 'Minor change (5 lines).');
    // Must NOT carry CC-only fields.
    assert.ok(!('decision' in parsed), 'Cursor payload must not leak CC decision field');
  } finally { delete process.env.CURSOR_VERSION; }
});

tc('Cursor allow: empty context emits {"permission":"allow"} (no agent_message key or empty)', () => {
  process.env.CURSOR_VERSION = '3.6.31';
  try {
    const io = freshIo();
    const out = captureOutput(() => io.outputAllow('', 'PreToolUse'));
    assert.strictEqual(out.length, 1);
    const parsed = JSON.parse(out[0]);
    assert.strictEqual(parsed.permission, 'allow');
    // agent_message omitted or empty when nothing to say.
    assert.ok(parsed.agent_message === undefined || parsed.agent_message === '',
      'empty allow should not fabricate a message');
  } finally { delete process.env.CURSOR_VERSION; }
});

tc('Cursor deny: emits {"permission":"deny","user_message":...,"agent_message":...} + exit(0)', () => {
  process.env.CURSOR_VERSION = '3.6.31';
  try {
    const io = freshIo();
    const out = captureOutput(() => io.outputBlock('destructive op blocked'));
    assert.ok(out.length >= 1, 'deny emits payload');
    const parsed = JSON.parse(out[0]);
    assert.strictEqual(parsed.permission, 'deny', 'must use Cursor deny schema');
    assert.ok(typeof parsed.user_message === 'string' && parsed.user_message.length > 0,
      'deny must carry a user_message');
    // agent_message mirrors the reason for the agent too.
    assert.ok(typeof parsed.agent_message === 'string' && parsed.agent_message.length > 0,
      'deny must carry an agent_message');
    assert.ok(!('decision' in parsed), 'Cursor payload must not leak CC decision field');
    // Block still exits 0 under Cursor (graceful deny, not a crash).
    assert.ok(out.some((l) => l === '__EXIT_0__'), 'deny should exit(0)');
  } finally { delete process.env.CURSOR_VERSION; }
});

tc('Cursor deny-with-context: {"permission":"deny",...} mirrors reason to both messages', () => {
  process.env.CURSOR_VERSION = '3.6.31';
  try {
    const io = freshIo();
    const out = captureOutput(() =>
      io.outputBlockWithContext('unsafe rm', ['rm -i file', 'trash file'], 'PreToolUse'));
    const parsed = JSON.parse(out[0]);
    assert.strictEqual(parsed.permission, 'deny');
    assert.ok(parsed.user_message.includes('unsafe rm'), 'user_message includes reason');
    assert.ok(parsed.agent_message.includes('unsafe rm'), 'agent_message includes reason');
    assert.ok(parsed.agent_message.includes('trash file'),
      'agent_message surfaces the safer alternatives under Cursor too');
    assert.ok(!('decision' in parsed), 'no CC decision field leaked');
  } finally { delete process.env.CURSOR_VERSION; }
});

// ---------------------------------------------------------------------------
// 3. Detection helper (optional but recommended — single source of truth)
// ---------------------------------------------------------------------------

tc('exports isCursorRuntime() that tracks CURSOR_VERSION presence', () => {
  const io = freshIo();
  assert.strictEqual(typeof io.isCursorRuntime, 'function',
    'isCursorRuntime should be exported for reuse by hook scripts');
  // Unset -> false
  delete process.env.CURSOR_VERSION;
  assert.strictEqual(io.isCursorRuntime(), false);
  process.env.CURSOR_VERSION = '3.6.31';
  try { assert.strictEqual(io.isCursorRuntime(), true); }
  finally { delete process.env.CURSOR_VERSION; }
});

// ---------------------------------------------------------------------------
console.log(`\n${pass} passed, ${fail} failed`);
if (failures.length) {
  console.error('FAILURES:');
  for (const f of failures) console.error(`  - ${f.name}: ${f.msg}`);
  process.exit(1);
}
