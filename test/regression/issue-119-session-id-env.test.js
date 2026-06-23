#!/usr/bin/env node
'use strict';
/**
 * issue-119-session-id-env.test.js — Regression guard for GitHub #119.
 *
 * Placed under test/regression/ alongside issue-53-path-quoting.test.js so the
 * issue-specific bug cannot recur silently. Complements the unit-level contract
 * at tests/contract/session-id-env-119.test.js.
 *
 * Bug: hooks/session-start.js (and 3 other sites) read process.env.CLAUDE_SESSION_ID,
 * but Claude Code exposes CLAUDE_CODE_SESSION_ID. sessionId was always null on the
 * SessionStart path -> the per-session `·a1b2` title tag from #111 never appended
 * -> concurrent sessions in the same repo rendered identical titles.
 *
 * This test verifies TWO things end-to-end:
 *  1. ENV-VAR RESOLUTION (the #119 fix itself): the canonical accessor
 *     lib/infra/cc-bridge.getSessionId() — which all 4 production sites share —
 *     resolves CLAUDE_CODE_SESSION_ID with legacy back-compat. Asserted by
 *     importing the REAL module (no mock) and toggling env, which exercises the
 *     exact code the hook scripts call.
 *  2. TAG DISAMBIGUATION PAYOFF (the #111/#119 user-visible effect): the REAL
 *     user-prompt-handler.js hook, spawned as a subprocess with a PDCA fixture,
 *     emits a sessionTitle whose `·<tag>` differs for two distinct session ids.
 *     (session-start.js itself can't be driven reliably from a fixture because
 *     its onboarding pipeline resolves primaryFeature through extra state; the
 *     user-prompt-handler path is the proven e2e vehicle — see issue77-hook-e2e.)
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const REPO = path.resolve(__dirname, '..', '..');
const CC_BRIDGE = path.join(REPO, 'lib/infra/cc-bridge.js');
const USER_PROMPT_HANDLER = path.join(REPO, 'scripts/user-prompt-handler.js');

let pass = 0, fail = 0;
const failures = [];
function tc(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; failures.push(`${name}${detail ? ' :: ' + detail : ''}`); }
}

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}
function expectedTag(sessionId) {
  return crypto.createHash('sha256').update(String(sessionId), 'utf8').digest('hex').slice(0, 4);
}

// --- 1. ENV-VAR RESOLUTION (the #119 fix, via the real shared accessor) --------

const SAVED = {};
function stashEnv() {
  for (const k of ['CLAUDE_SESSION_ID', 'CLAUDE_CODE_SESSION_ID']) {
    SAVED[k] = process.env[k]; delete process.env[k];
  }
}
function restoreEnv() {
  for (const k of Object.keys(SAVED)) {
    if (SAVED[k] === undefined) delete process.env[k]; else process.env[k] = SAVED[k];
  }
}

tc('cc-bridge.getSessionId reads CLAUDE_CODE_SESSION_ID (the #119 fix)', () => {
  stashEnv();
  try {
    process.env.CLAUDE_CODE_SESSION_ID = 'real-cc-session';
    const cc = freshRequire(CC_BRIDGE);
    return cc.getSessionId({}) === 'real-cc-session';
  } finally { restoreEnv(); }
});

tc('cc-bridge.getSessionId prefers CLAUDE_CODE_SESSION_ID over legacy', () => {
  stashEnv();
  try {
    process.env.CLAUDE_CODE_SESSION_ID = 'newer';
    process.env.CLAUDE_SESSION_ID = 'older';
    const cc = freshRequire(CC_BRIDGE);
    return cc.getSessionId({}) === 'newer';
  } finally { restoreEnv(); }
});

tc('cc-bridge.getSessionId falls back to legacy CLAUDE_SESSION_ID (back-compat)', () => {
  stashEnv();
  try {
    process.env.CLAUDE_SESSION_ID = 'legacy-only';
    const cc = freshRequire(CC_BRIDGE);
    return cc.getSessionId({}) === 'legacy-only';
  } finally { restoreEnv(); }
});

// --- 2. TAG DISAMBIGUATION PAYOFF (real hook subprocess) -----------------------

function makeFixtureProject(feature) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-issue119-'));
  // Mirror the shape test/integration/issue77-hook-e2e.test.js uses (version +
  // activeFeatures + .bkit/runtime dir) so getPdcaStatusFull() accepts the
  // fixture and generateSessionTitle() has a primaryFeature to emit.
  fs.mkdirSync(path.join(tmp, '.bkit', 'runtime'), { recursive: true });
  fs.mkdirSync(path.join(tmp, '.bkit', 'state'), { recursive: true });
  const now = new Date().toISOString();
  fs.writeFileSync(path.join(tmp, '.bkit', 'state', 'pdca-status.json'), JSON.stringify({
    version: '3.0',
    primaryFeature: feature,
    activeFeatures: [feature],
    currentPhase: 'plan',
    features: { [feature]: { phase: 'plan', phaseNumber: 1, timestamps: { started: now, lastUpdated: now } } },
    history: [],
  }));
  fs.writeFileSync(path.join(tmp, 'bkit.config.json'), JSON.stringify({
    version: '2.1.6',
    ui: {
      sessionTitle: { enabled: true, staleTTLHours: 24, format: '[bkit] {action} {feature}' },
      contextInjection: { enabled: true, ambiguityThreshold: 0.7 },
    },
    pdca: { matchRateThreshold: 90 },
  }));
  return tmp;
}

function runUserPrompt(projectDir, sessionId) {
  const r = spawnSync('node', [USER_PROMPT_HANDLER], {
    cwd: projectDir,
    stdio: ['pipe', 'pipe', 'pipe'],
    input: JSON.stringify({ prompt: 'design new feature with auth and database integration', session_id: sessionId }),
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: REPO, CLAUDE_PROJECT_DIR: projectDir, BKIT_DISABLE_CACHE: '1' },
    timeout: 10000,
  });
  let title;
  try {
    const parsed = JSON.parse((r.stdout || '').toString());
    title = parsed && parsed.hookSpecificOutput && parsed.hookSpecificOutput.sessionTitle;
  } catch (_e) { title = undefined; }
  return { title, status: r.status, stderr: (r.stderr || '').toString() };
}

{
  const feature = 'issue119-tag';
  const sid = 'payload-session-9701';
  const tmp = makeFixtureProject(feature);
  try {
    const { title, status, stderr } = runUserPrompt(tmp, sid);
    const tag = expectedTag(sid);
    tc('real user-prompt-handler emits a tagged title', !!title && title.endsWith(` ·${tag}`),
      `expected suffix '·${tag}', title=${JSON.stringify(title)} status=${status} stderr=${stderr.slice(0, 200)}`);
  } finally { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_e) {} }
}

{
  // Two distinct sessions -> distinct tags (the disambiguation payoff).
  const feature = 'issue119-distinct';
  const sidA = 'session-A-aaaa', sidB = 'session-B-bbbb';
  const tmp = makeFixtureProject(feature);
  try {
    const a = runUserPrompt(tmp, sidA);
    const b = runUserPrompt(tmp, sidB);
    tc('two distinct sessions get distinct titles', !!a.title && !!b.title && a.title !== b.title,
      `a=${JSON.stringify(a.title)} b=${JSON.stringify(b.title)}`);
    tc('distinct tags match sha256(sessionId)[0:4]',
      !!a.title && !!b.title && a.title.endsWith(`·${expectedTag(sidA)}`) && b.title.endsWith(`·${expectedTag(sidB)}`),
      `tagA=${expectedTag(sidA)} tagB=${expectedTag(sidB)}`);
  } finally { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_e) {} }
}

// ---------------------------------------------------------------------------
console.log(`\n${pass} passed, ${fail} failed`);
if (failures.length) {
  console.error('FAILURES:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
