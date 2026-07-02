#!/usr/bin/env node
'use strict';
/**
 * issue-130-learning-stop-stdin.test.js — Regression guard for GitHub #130.
 *
 * Placed under test/regression/ alongside issue-53/issue-118/issue-119 so the
 * issue-specific bug cannot recur silently.
 *
 * Bug: scripts/learning-stop.js gated its stdin read on
 * `process.stdin.isTTY === false`. Node sets isTTY to `undefined` (not `false`)
 * for piped stdin, so the gate never opened for real hook input: the JSON
 * payload was silently ignored and `completedLevel` always fell back to 1,
 * regardless of the level in tool_input.args. Same bug class as the
 * skill-post.js stdin skip fixed in #125/#126 (commit 7b780b8); the fix is the
 * same shared readStdinSync() from lib/core/io.
 *
 * This test verifies, end-to-end against the REAL hook subprocess:
 *  1. PIPED INPUT CONSUMED (the #130 fix itself): a piped hook payload with
 *     `tool_input.args: "learn 3"` yields completedLevel 3 / nextLevel 4 —
 *     under the old isTTY gate this stayed at the default 1.
 *  2. TOP LEVEL: "learn 5" yields completedLevel 5 with nextLevel null.
 *  3. GRACEFUL FALLBACK: empty stdin (/dev/null) and malformed JSON both fall
 *     back to level 1 with status success, exit 0, and no hang.
 *  4. SOURCE GUARD: the dead `isTTY === false` gate must not reappear in
 *     scripts/learning-stop.js; the shared readStdinSync must stay in use.
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..', '..');
const LEARNING_STOP = path.join(REPO, 'scripts', 'learning-stop.js');

let pass = 0, fail = 0;
const failures = [];
function tc(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; failures.push(`${name}${detail ? ' :: ' + detail : ''}`); }
}

function runLearningStop(input) {
  const r = spawnSync('node', [LEARNING_STOP], {
    cwd: REPO,
    stdio: ['pipe', 'pipe', 'pipe'],
    input: input === undefined ? '' : input,
    timeout: 10000,
  });
  let parsed;
  try { parsed = JSON.parse((r.stdout || '').toString()); } catch (_e) { parsed = undefined; }
  return { parsed, status: r.status, stderr: (r.stderr || '').toString() };
}

// --- 1. PIPED INPUT CONSUMED (the #130 fix itself) -----------------------------

{
  const payload = JSON.stringify({
    tool_input: { skill: 'claude-code-learning', args: 'learn 3' },
  });
  const { parsed, status, stderr } = runLearningStop(payload);
  tc('piped hook payload is consumed (completedLevel 3, not default 1)',
    !!parsed && parsed.status === 'success' && parsed.completedLevel === 3,
    `parsed=${JSON.stringify(parsed)} status=${status} stderr=${stderr.slice(0, 200)}`);
  tc('nextLevel advances from the piped level (4)',
    !!parsed && parsed.nextLevel === 4,
    `parsed=${JSON.stringify(parsed)}`);
  tc('suggestion targets the next level from the piped input',
    !!parsed && Array.isArray(parsed.suggestions) &&
      parsed.suggestions.some(s => s && s.action === '/claude-code-learning learn 4'),
    `suggestions=${JSON.stringify(parsed && parsed.suggestions)}`);
}

// --- 2. TOP LEVEL: nextLevel null at level 5 -----------------------------------

{
  const payload = JSON.stringify({ tool_input: { args: 'learn 5' } });
  const { parsed } = runLearningStop(payload);
  tc('level 5 payload consumed with nextLevel null',
    !!parsed && parsed.completedLevel === 5 && parsed.nextLevel === null,
    `parsed=${JSON.stringify(parsed)}`);
}

// --- 3. GRACEFUL FALLBACK: empty stdin / malformed JSON, exit 0, no hang -------

{
  const { parsed, status } = runLearningStop(''); // piped empty stdin (EOF)
  tc('empty stdin falls back to default level 1 without hanging',
    status === 0 && !!parsed && parsed.status === 'success' && parsed.completedLevel === 1,
    `parsed=${JSON.stringify(parsed)} status=${status}`);
}

{
  const { parsed, status } = runLearningStop('not-json');
  tc('malformed JSON falls back to default level 1 (status success, exit 0)',
    status === 0 && !!parsed && parsed.status === 'success' && parsed.completedLevel === 1,
    `parsed=${JSON.stringify(parsed)} status=${status}`);
}

{
  // Non-string args must not crash the hook (String coercion guard).
  const payload = JSON.stringify({ tool_input: { args: 42 } });
  const { parsed, status } = runLearningStop(payload);
  tc('non-string args coerced, level extracted, exit 0',
    status === 0 && !!parsed && parsed.status === 'success' && parsed.completedLevel === 42,
    `parsed=${JSON.stringify(parsed)} status=${status}`);
}

// --- 4. SOURCE GUARD: the dead isTTY gate must not reappear --------------------

{
  const src = fs.readFileSync(LEARNING_STOP, 'utf8');
  // Match the actual code gate (`if (process.stdin.isTTY ...)`) — NOT the
  // "do not gate on isTTY === false" warning comment, which (per the
  // skill-post.js #125/#126 convention) intentionally names the anti-pattern.
  tc('learning-stop.js no longer gates stdin on isTTY === false',
    !/if\s*\(\s*process\.stdin\.isTTY/.test(src),
    'found an `if (process.stdin.isTTY ...)` gate in scripts/learning-stop.js');
  tc('learning-stop.js uses the shared readStdinSync (lib/core/io)',
    /readStdinSync/.test(src) && /lib\/core\/io/.test(src.replace(/\\/g, '/')),
    'expected readStdinSync from ../lib/core/io');
}

// ---------------------------------------------------------------------------
console.log(`\n${pass} passed, ${fail} failed`);
if (failures.length) {
  console.error('FAILURES:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
