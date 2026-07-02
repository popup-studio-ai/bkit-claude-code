#!/usr/bin/env node
'use strict';
/**
 * issue-132-slash-reach.test.js — Regression guard for GitHub #132.
 *
 * Placed under test/regression/ alongside issue-130 so the #132 bug class
 * (native slash-command path bypassing orchestrator side-effects, plus the two
 * free wins) cannot recur silently.
 *
 * Covers:
 *  1. FREE WIN A(b): intent-router recognizes the `:`-namespaced slash command
 *     `/bkit:pdca` — route() returns a non-empty command suggestion (before the
 *     regex widening, `[\w-]+` excluded `:` and the command branch skipped it).
 *  2. Non-misroute: a plain `/simplify` command is still recognized unchanged.
 *  3. FREE WIN A(a): user-prompt-handler.js DEFINES `onboardingContext` (the
 *     previous bare reference threw a ReferenceError swallowed by try/catch,
 *     leaving structuredSuggestions always []).
 *  4. FREE WIN A(a) behavioral: user-prompt-handler runs clean (exit 0, no
 *     "onboardingContext is not defined" on stderr) on a real prompt.
 *  5. FREE WIN B (I-9): the UserPromptExpansion slash path writes the
 *     active-skill marker (repairs Stop SKILL_HANDLERS dispatch).
 */

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..', '..');

let pass = 0, fail = 0;
const failures = [];
function tc(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; failures.push(`${name}${detail ? ' :: ' + detail : ''}`); }
}

// --- 1 & 2. intent-router slash recognition (in-process) ----------------------
{
  const { route } = require('../../lib/orchestrator/intent-router');

  const r1 = route('/bkit:pdca status', { onboarding: '' });
  tc('route() recognizes /bkit:pdca (suggestions non-empty)',
    r1 && Array.isArray(r1.suggestions) && r1.suggestions.length >= 1,
    `suggestions=${JSON.stringify(r1 && r1.suggestions)}`);
  tc('route() primary is the /bkit:pdca command with parsed args',
    r1 && r1.primary && r1.primary.type === 'command' &&
      r1.primary.name === '/bkit:pdca' && r1.primary.args === 'status',
    `primary=${JSON.stringify(r1 && r1.primary)}`);

  const r2 = route('/simplify');
  tc('route() still recognizes non-namespaced /simplify (no misroute)',
    r2 && r2.primary && r2.primary.type === 'command' && r2.primary.name === '/simplify',
    `primary=${JSON.stringify(r2 && r2.primary)}`);
}

// --- 3. source guard: onboardingContext defined -------------------------------
{
  const src = fs.readFileSync(path.join(REPO, 'scripts', 'user-prompt-handler.js'), 'utf8');
  tc('user-prompt-handler.js defines onboardingContext (not just references it)',
    /(?:const|let|var)\s+onboardingContext\s*=/.test(src),
    'no `const/let onboardingContext =` definition found');
}

// --- 4. behavioral: user-prompt-handler runs clean ----------------------------
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-132-uph-'));
  const r = spawnSync('node', [path.join(REPO, 'scripts', 'user-prompt-handler.js')], {
    cwd: REPO,
    env: { ...process.env, CLAUDE_PROJECT_DIR: tmp },
    input: JSON.stringify({ prompt: 'build a new login feature for the app', session_id: 's132' }),
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 15000,
  });
  tc('user-prompt-handler exits 0', r.status === 0, `status=${r.status}`);
  tc('user-prompt-handler stderr free of onboardingContext ReferenceError',
    !/onboardingContext is not defined/.test((r.stderr || '').toString()),
    `stderr=${(r.stderr || '').toString().slice(0, 200)}`);
}

// --- 5. I-9: active-skill marker written on the slash path ---------------------
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-132-marker-'));
  const r = spawnSync('node', [path.join(REPO, 'scripts', 'user-prompt-expansion-handler.js')], {
    cwd: REPO,
    env: { ...process.env, CLAUDE_PROJECT_DIR: tmp },
    input: JSON.stringify({
      command_source: 'plugin', command_name: 'bkit:phase-1-schema',
      command_args: 'plan login', session_id: 'sess-132-marker',
    }),
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 15000,
  });
  const markerPath = path.join(tmp, '.bkit', 'runtime', 'active-skill.json');
  let marker = null;
  try { marker = JSON.parse(fs.readFileSync(markerPath, 'utf8')); } catch (_e) { /* absent */ }
  tc('slash path writes active-skill marker with the skill name',
    r.status === 0 && marker && marker.skill === 'phase-1-schema',
    `status=${r.status} marker=${JSON.stringify(marker)}`);
}

console.log(`\nissue-132-slash-reach.test.js: ${pass} passed, ${fail} failed`);
if (failures.length) {
  console.error('FAILURES:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
