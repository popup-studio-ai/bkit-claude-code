#!/usr/bin/env node
'use strict';
/**
 * user-prompt-expansion-handler.test.js — unit tests for the UserPromptExpansion
 * hook (Issue #132, I-3). Standalone node runner (issue-130 style), driving the
 * REAL hook subprocess via spawnSync with a piped JSON payload.
 *
 * Covers: command_source filter, unknown-skill filter, plain-text no-op,
 * fail-open on a thrown error (exit 0, never decision:block), args-string parse,
 * and next-skill guidance emitted to stdout for a plugin slash command.
 */

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..', '..');
const HANDLER = path.join(REPO, 'scripts', 'user-prompt-expansion-handler.js');

let pass = 0, fail = 0;
const failures = [];
function tc(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; failures.push(`${name}${detail ? ' :: ' + detail : ''}`); }
}

function run(payload, extraEnv) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-upe-'));
  const r = spawnSync('node', [HANDLER], {
    cwd: REPO,
    env: { ...process.env, CLAUDE_PROJECT_DIR: tmp, ...(extraEnv || {}) },
    input: payload === undefined ? '' : payload,
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 15000,
  });
  return { status: r.status, stdout: (r.stdout || '').toString(), stderr: (r.stderr || '').toString(), tmp };
}

// 1. command_source !== 'plugin' → no-op, exit 0, no output.
{
  const { status, stdout } = run(JSON.stringify({
    command_source: 'user', command_name: 'bkit:pdca', command_args: 'status', session_id: 's',
  }));
  tc('non-plugin command_source is a no-op (exit 0, no stdout)',
    status === 0 && stdout.trim() === '', `status=${status} stdout=${JSON.stringify(stdout)}`);
}

// 2. plugin source but unknown skill → no-op, exit 0.
{
  const { status, stdout } = run(JSON.stringify({
    command_source: 'plugin', command_name: 'bkit:not-a-real-skill', command_args: '', session_id: 's',
  }));
  tc('unknown skill is a no-op (exit 0, no stdout)',
    status === 0 && stdout.trim() === '', `status=${status} stdout=${JSON.stringify(stdout)}`);
}

// 3. plain input (no command_* fields) → no-op, exit 0.
{
  const { status, stdout } = run(JSON.stringify({ prompt: 'hello world' }));
  tc('plain input (no command fields) is a no-op (exit 0)',
    status === 0 && stdout.trim() === '', `status=${status} stdout=${JSON.stringify(stdout)}`);
}

// 4. FAIL-OPEN: malformed / non-JSON stdin must never block; exit 0, no decision:block.
{
  const { status, stdout } = run('not-json-at-all');
  tc('malformed stdin fails open (exit 0)', status === 0, `status=${status}`);
  tc('malformed stdin never emits decision:block',
    !stdout.includes('"decision"') && !stdout.includes('block'),
    `stdout=${JSON.stringify(stdout)}`);
}

// 5. args-string parse + guidance emitted to stdout for a real plugin skill.
//    phase-1-schema declares next-skill: phase-2-convention → guidance non-empty.
{
  const { status, stdout } = run(JSON.stringify({
    command_source: 'plugin', command_name: 'bkit:phase-1-schema',
    command_args: 'plan login', session_id: 'sess-upe-1',
  }));
  tc('plugin slash command exits 0', status === 0, `status=${status}`);
  tc('next-skill guidance emitted to stdout',
    stdout.includes('phase-2-convention'),
    `stdout=${JSON.stringify(stdout)}`);
  tc('guidance path never emits decision:block',
    !stdout.includes('"decision"'),
    `stdout=${JSON.stringify(stdout)}`);
}

// 6. args-string parse writes a skill_invoked audit entry (side-effect proof).
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-upe-audit-'));
  const r = spawnSync('node', [HANDLER], {
    cwd: REPO,
    env: { ...process.env, CLAUDE_PROJECT_DIR: tmp },
    input: JSON.stringify({
      command_source: 'plugin', command_name: 'bkit:phase-1-schema',
      command_args: 'plan checkout', session_id: 'sess-upe-2',
    }),
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 15000,
  });
  const auditDir = path.join(tmp, '.bkit', 'audit');
  let hasInvoked = false;
  if (fs.existsSync(auditDir)) {
    for (const f of fs.readdirSync(auditDir)) {
      if (f.endsWith('.jsonl') && fs.readFileSync(path.join(auditDir, f), 'utf8').includes('skill_invoked')) {
        hasInvoked = true;
      }
    }
  }
  tc('slash path writes a skill_invoked audit entry', r.status === 0 && hasInvoked, `status=${r.status} hasInvoked=${hasInvoked}`);
}

console.log(`\nuser-prompt-expansion-handler.test.js: ${pass} passed, ${fail} failed`);
if (failures.length) {
  console.error('FAILURES:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
