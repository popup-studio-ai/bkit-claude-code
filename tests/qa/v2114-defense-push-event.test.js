/**
 * v2114-defense-push-event.test.js — L1 tests for ENH-298 push-event-guard.
 *
 * Coverage (15 TCs):
 *   DP — detectPushCommand parsing (6 TCs)
 *   CR — classifyRemote fork/upstream/unknown (5 TCs)
 *   SG — shouldGuard decision tree (4 TCs)
 *
 * Run: node tests/qa/v2114-defense-push-event.test.js
 */

'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');

const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const guard = require(path.join(PLUGIN_ROOT, 'lib/defense/push-event-guard'));
const { detectPushCommand, classifyRemote, shouldGuard, UPSTREAM_URL_HEURISTICS, FORK_URL_HEURISTICS } = guard;

let pass = 0;
let fail = 0;
let total = 0;
const failures = [];

function test(name, fn) {
  total += 1;
  try {
    fn();
    pass += 1;
  } catch (e) {
    fail += 1;
    failures.push({ name, error: e.message });
  }
}

// ────────────────────────────────────────────────────────────────────────
// DP — detectPushCommand (6 TCs)
// ────────────────────────────────────────────────────────────────────────

test('DP-01: ls -la → not push', () => {
  const r = detectPushCommand('ls -la');
  assert.equal(r.isPush, false);
  assert.equal(r.force, false);
});

test('DP-02: git push (no args) → push to origin', () => {
  const r = detectPushCommand('git push');
  assert.equal(r.isPush, true);
  assert.equal(r.force, false);
  assert.equal(r.remote, 'origin');
});

test('DP-03: git push origin main → push origin main', () => {
  const r = detectPushCommand('git push origin main');
  assert.equal(r.isPush, true);
  assert.equal(r.remote, 'origin');
  assert.equal(r.branch, 'main');
});

test('DP-04: --force flag detected', () => {
  assert.equal(detectPushCommand('git push --force').force, true);
  assert.equal(detectPushCommand('git push -f origin main').force, true);
  assert.equal(detectPushCommand('git push --force-with-lease origin main').force, true);
});

test('DP-05: git pull (not push) → isPush=false', () => {
  assert.equal(detectPushCommand('git pull origin main').isPush, false);
});

test('DP-06: git pushd (not actually push) → isPush=false', () => {
  assert.equal(detectPushCommand('git pushd /tmp').isPush, false);
});

// ────────────────────────────────────────────────────────────────────────
// CR — classifyRemote (5 TCs)
// ────────────────────────────────────────────────────────────────────────

const upstreamExec = () => 'git@github.com:anthropics/claude-code.git\n';
const forkExec = () => 'git@github.com:popup-studio-ai/bkit-claude-code.git\n';
const missingExec = () => { throw new Error('fatal: no such remote'); };

test('CR-01: upstream remote (anthropics) → kind=upstream', () => {
  const r = classifyRemote('upstream', { exec: upstreamExec });
  assert.equal(r.kind, 'upstream');
  assert.equal(r.isFork, false);
});

test('CR-02: origin remote with fork heuristic → kind=fork', () => {
  const r = classifyRemote('origin', { exec: forkExec });
  assert.equal(r.kind, 'fork');
  assert.equal(r.isFork, true);
});

test('CR-03: missing remote → kind=unknown', () => {
  const r = classifyRemote('nope', { exec: missingExec });
  assert.equal(r.kind, 'unknown');
  assert.equal(r.url, null);
});

test('CR-04: empty remoteName → kind=unknown', () => {
  assert.equal(classifyRemote('').kind, 'unknown');
  assert.equal(classifyRemote(null).kind, 'unknown');
});

test('CR-05: convention origin defaults to fork', () => {
  // When URL is uncategorized but remote name is 'origin', default to fork.
  const someExec = () => 'git@github.com:randomuser/randomrepo.git\n';
  const r = classifyRemote('origin', { exec: someExec });
  assert.equal(r.kind, 'origin');
  assert.equal(r.isFork, true);
});

// ────────────────────────────────────────────────────────────────────────
// SG — shouldGuard (4 TCs)
// ────────────────────────────────────────────────────────────────────────

test('SG-01: force push → deny at all trust levels', () => {
  const parsed = detectPushCommand('git push --force origin main');
  const cls = classifyRemote('origin', { exec: forkExec });
  for (const tl of ['L0', 'L1', 'L2', 'L3', 'L4']) {
    const v = shouldGuard(parsed, cls, tl);
    assert.equal(v.action, 'deny', `${tl} must deny force`);
  }
});

test('SG-02: push to upstream → ask at all trust levels', () => {
  const parsed = detectPushCommand('git push upstream main');
  const cls = classifyRemote('upstream', { exec: upstreamExec });
  for (const tl of ['L0', 'L1', 'L2', 'L3', 'L4']) {
    const v = shouldGuard(parsed, cls, tl);
    assert.equal(v.action, 'ask', `${tl} must ask for upstream`);
  }
});

test('SG-03: push to fork → allow at L0-L3, ask at L4', () => {
  const parsed = detectPushCommand('git push origin main');
  const cls = classifyRemote('origin', { exec: forkExec });
  for (const tl of ['L0', 'L1', 'L2', 'L3']) {
    assert.equal(shouldGuard(parsed, cls, tl).action, 'allow', `${tl} allows fork push`);
  }
  assert.equal(shouldGuard(parsed, cls, 'L4').action, 'ask', 'L4 asks even for fork');
});

test('SG-04: push to unknown → ask at L4, allow at L0-L3', () => {
  const parsed = detectPushCommand('git push nope main');
  const cls = classifyRemote('nope', { exec: missingExec });
  for (const tl of ['L0', 'L1', 'L2', 'L3']) {
    assert.equal(shouldGuard(parsed, cls, tl).action, 'allow', `${tl} allows unknown`);
  }
  assert.equal(shouldGuard(parsed, cls, 'L4').action, 'ask', 'L4 asks unknown');
});

test('SG-05: heuristic arrays frozen + non-empty', () => {
  assert.ok(Object.isFrozen(UPSTREAM_URL_HEURISTICS));
  assert.ok(Object.isFrozen(FORK_URL_HEURISTICS));
  assert.ok(UPSTREAM_URL_HEURISTICS.length >= 3);
  assert.ok(FORK_URL_HEURISTICS.length >= 2);
});

// ────────────────────────────────────────────────────────────────────────
// Summary
// ────────────────────────────────────────────────────────────────────────
// eslint-disable-next-line no-console
console.log(`\n[v2114 L1 defense-push-event] total=${total} pass=${pass} fail=${fail}`);
if (fail > 0) {
  // eslint-disable-next-line no-console
  console.error('FAILURES:');
  for (const f of failures) {
    // eslint-disable-next-line no-console
    console.error(`  ✗ ${f.name}: ${f.error}`);
  }
  process.exit(1);
}
// eslint-disable-next-line no-console
console.log('✓ all PASS');
process.exit(0);
