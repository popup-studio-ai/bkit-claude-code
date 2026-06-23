'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const domain = require(path.join(PLUGIN_ROOT, 'lib/domain/sprint'));
let pass = 0, fail = 0; const failures = [];
async function tc(name, fn) { try { await fn(); pass++; } catch (e) { fail++; failures.push({ name, msg: e.message }); } }

(async () => {

await tc('createSprint declares dataFlow (per-feature map) and annotations', async () => {
  const sprint = domain.createSprint({ id: 's4a', name: 'S4a', features: ['auth'] });
  assert.ok('dataFlow' in sprint, 'dataFlow must be declared on the sprint');
  assert.ok('annotations' in sprint, 'annotations must be declared on the sprint');
  assert.ok(sprint.dataFlow && typeof sprint.dataFlow === 'object');
  assert.deepStrictEqual(sprint.dataFlow, {}, 'dataFlow defaults to empty object');
  assert.ok(Array.isArray(sprint.annotations), 'annotations defaults to an array');
  assert.deepStrictEqual(sprint.annotations, [], 'annotations defaults to empty array');
});

await tc('createSprint dataFlow/annotations independent of feature count', async () => {
  const sprint = domain.createSprint({ id: 's4b', name: 'S4b', features: ['auth', 'pay', 'ship'] });
  assert.deepStrictEqual(sprint.dataFlow, {});
  assert.deepStrictEqual(sprint.annotations, []);
});

// ---- Task 4.2: handleQA records per-hop results to sprint.dataFlow ----

await tc('handleQA populates sprint.dataFlow[feature] from hopResults (all-pass)', async () => {
  const { handleSprintAction } = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
  const os = require('node:os'); const fs = require('node:fs');
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 's4-qa-all-'));
  const id = 'slice4-qa-all';
  try {
    await handleSprintAction('init', { id, name: 'S4A', features: ['auth'], projectRoot: tmpRoot }, {});
    // Fake validator: all 7 hops pass with per-hop evidence.
    const fakeValidator = async (_f, hopId) => ({ passed: true, evidence: 'ev-' + hopId });
    const res = await handleSprintAction('qa', { id, featureName: 'auth', projectRoot: tmpRoot }, {
      qaDeps: { dataFlowValidator: fakeValidator },
    });
    assert.ok(res.ok, 'qa must succeed; got ' + JSON.stringify(res));
    const state = JSON.parse(fs.readFileSync(
      path.join(tmpRoot, '.bkit/state/sprints', id + '.json'), 'utf8'));
    assert.ok(state.dataFlow && state.dataFlow['auth'], 'persisted dataFlow[auth] must exist');
    const hopKeys = Object.keys(state.dataFlow['auth']);
    assert.strictEqual(hopKeys.length, 7, 'expected exactly 7 hop keys H1..H7; got ' + hopKeys.join(','));
    for (const hopId of ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7']) {
      const entry = state.dataFlow['auth'][hopId];
      assert.ok(entry, 'entry ' + hopId + ' must exist');
      assert.strictEqual(entry.status, 'pass', hopId + ' status must be pass');
      assert.strictEqual(entry.evidence, 'ev-' + hopId, hopId + ' evidence mismatch');
    }
    assert.strictEqual(state.dataFlow['auth'].H1.status, 'pass');
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

await tc('handleQA maps mixed pass/fail hops to correct status (H3,H5 fail)', async () => {
  const { handleSprintAction } = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
  const os = require('node:os'); const fs = require('node:fs');
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 's4-qa-mix-'));
  const id = 'slice4-qa-mix';
  try {
    await handleSprintAction('init', { id, name: 'S4M', features: ['auth'], projectRoot: tmpRoot }, {});
    const failing = new Set(['H3', 'H5']);
    const fakeValidator = async (_f, hopId) => failing.has(hopId)
      ? { passed: false, reason: 'boom-' + hopId }
      : { passed: true, evidence: 'ok-' + hopId };
    const res = await handleSprintAction('qa', { id, featureName: 'auth', projectRoot: tmpRoot }, {
      qaDeps: { dataFlowValidator: fakeValidator },
    });
    assert.ok(res.ok, 'qa must succeed even with partial failures; got ' + JSON.stringify(res));
    const state = JSON.parse(fs.readFileSync(
      path.join(tmpRoot, '.bkit/state/sprints', id + '.json'), 'utf8'));
    assert.strictEqual(state.dataFlow['auth'].H3.status, 'fail', 'H3 status must be fail');
    assert.strictEqual(state.dataFlow['auth'].H3.reason, 'boom-H3', 'H3 reason must be recorded');
    assert.strictEqual(state.dataFlow['auth'].H5.status, 'fail', 'H5 status must be fail');
    assert.strictEqual(state.dataFlow['auth'].H1.status, 'pass', 'H1 status must be pass');
    assert.strictEqual(state.dataFlow['auth'].H1.evidence, 'ok-H1', 'H1 evidence mismatch');
    // Bonus: s1Score = 5/7 *100 ≈ 71.43 persisted to S1 slot.
    assert.ok(state.qualityGates.S1_dataFlowIntegrity, 'S1 slot must be persisted');
    const s1 = state.qualityGates.S1_dataFlowIntegrity.current;
    assert.ok(Math.abs(s1 - (5 / 7 * 100)) < 0.01, 's1Score ≈ 71.43; got ' + s1);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

await tc('Tier-2 round-trip: recorded matrix validates via staticMatrix validator (and empty sprint = 0)', async () => {
  const { handleSprintAction } = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
  const { createDataFlowValidator } = require(path.join(PLUGIN_ROOT, 'lib/infra/sprint/data-flow-validator.adapter'));
  const lifecycle = require(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle'));
  const os = require('node:os'); const fs = require('node:fs');
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 's4-rt-'));
  const id = 'slice4-roundtrip';
  try {
    // Step 1: live probe records the all-pass matrix.
    await handleSprintAction('init', { id, name: 'S4RT', features: ['auth'], projectRoot: tmpRoot }, {});
    const liveValidator = async (_f, hopId) => ({ passed: true, evidence: 'live-' + hopId });
    const qaRes = await handleSprintAction('qa', { id, featureName: 'auth', projectRoot: tmpRoot }, {
      qaDeps: { dataFlowValidator: liveValidator },
    });
    assert.ok(qaRes.ok, 'live qa must succeed');
    // Step 2: reload persisted state (the recorded matrix is on disk now).
    const state = JSON.parse(fs.readFileSync(
      path.join(tmpRoot, '.bkit/state/sprints', id + '.json'), 'utf8'));
    assert.ok(state.dataFlow && state.dataFlow['auth'], 'matrix must be recorded on disk');
    // Step 3: re-validate using the STATIC validator (reads sprint.dataFlow only).
    const staticValidator = createDataFlowValidator({ staticMatrix: true });
    const replay = await lifecycle.verifyDataFlow(state, 'auth', { dataFlowValidator: staticValidator });
    assert.ok(replay.ok, 'static replay must succeed');
    assert.strictEqual(replay.s1Score, 100,
      'staticMatrix replay from all-pass recording must yield s1Score 100; got ' + replay.s1Score);
    // Step 4: negative — fresh sprint with no recorded dataFlow yields s1Score 0.
    const fresh = domain.createSprint({ id: 'slice4-nomatrix', name: 'F', features: ['auth'] });
    const negReplay = await lifecycle.verifyDataFlow(fresh, 'auth', { dataFlowValidator: staticValidator });
    assert.strictEqual(negReplay.s1Score, 0,
      'staticMatrix on sprint without recorded dataFlow must yield s1Score 0; got ' + negReplay.s1Score);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

// ---- Task 4.3: computeNextPhase skip-iterate do→qa when M1 meets target ----

const lifecycle = require(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle'));

await tc('computeNextPhase(sprint) returns qa from do when M1 meets target', async () => {
  const sprint = domain.createSprint({ id: 's4c1', name: 'S4C1', features: ['auth'] });
  sprint.phase = 'do';
  sprint.qualityGates.M1_matchRate = { current: 100, threshold: 90, passed: true };
  const next = lifecycle.computeNextPhase(sprint);
  assert.strictEqual(next, 'qa',
    'do→qa when M1 meets target; got ' + next);
});

await tc('computeNextPhase(sprint) returns qa from do when current>=threshold even if passed unset', async () => {
  const sprint = domain.createSprint({ id: 's4c2', name: 'S4C2', features: ['auth'] });
  sprint.phase = 'do';
  // passed not explicitly true, but numeric current meets threshold.
  sprint.qualityGates.M1_matchRate = { current: 95, threshold: 90, passed: null };
  const next = lifecycle.computeNextPhase(sprint);
  assert.strictEqual(next, 'qa', 'current>=threshold should satisfy target; got ' + next);
});

await tc('computeNextPhase(sprint) returns iterate from do when M1 below target', async () => {
  const sprint = domain.createSprint({ id: 's4c3', name: 'S4C3', features: ['auth'] });
  sprint.phase = 'do';
  sprint.qualityGates.M1_matchRate = { current: 80, threshold: 90, passed: false };
  const next = lifecycle.computeNextPhase(sprint);
  assert.strictEqual(next, 'iterate', 'do→iterate when M1 below target; got ' + next);
});

await tc('computeNextPhase(sprint) returns iterate from do when M1 unmeasured (safe default)', async () => {
  const sprint = domain.createSprint({ id: 's4c4', name: 'S4C4', features: ['auth'] });
  sprint.phase = 'do';
  // Unmeasured: current null, passed null — must NOT skip iterate.
  sprint.qualityGates.M1_matchRate = { current: null, threshold: 90, passed: null };
  let next = lifecycle.computeNextPhase(sprint);
  assert.strictEqual(next, 'iterate', 'unmeasured M1 must default to iterate; got ' + next);
  // Also: M1 slot entirely absent.
  delete sprint.qualityGates.M1_matchRate;
  next = lifecycle.computeNextPhase(sprint);
  assert.strictEqual(next, 'iterate', 'absent M1 must default to iterate; got ' + next);
});

await tc('computeNextPhase(sprint) falls through to phase path for non-do phases', async () => {
  const sprint = domain.createSprint({ id: 's4c5', name: 'S4C5', features: ['auth'] });
  sprint.phase = 'prd';
  assert.strictEqual(lifecycle.computeNextPhase(sprint), 'plan');
  sprint.phase = 'qa';
  assert.strictEqual(lifecycle.computeNextPhase(sprint), 'report');
  sprint.phase = 'archived';
  assert.strictEqual(lifecycle.computeNextPhase(sprint), null);
});

await tc('computeNextPhase(string) back-compat path unchanged', async () => {
  // Legacy phase-only invocation (used by the autorun loop call site) must be intact.
  assert.strictEqual(lifecycle.computeNextPhase('do'), 'iterate');
  assert.strictEqual(lifecycle.computeNextPhase('prd'), 'plan');
  assert.strictEqual(lifecycle.computeNextPhase('plan'), 'design');
  assert.strictEqual(lifecycle.computeNextPhase('design'), 'do');
  assert.strictEqual(lifecycle.computeNextPhase('iterate'), 'qa');
  assert.strictEqual(lifecycle.computeNextPhase('qa'), 'report');
  assert.strictEqual(lifecycle.computeNextPhase('report'), 'archived');
  assert.strictEqual(lifecycle.computeNextPhase('archived'), null);
  assert.strictEqual(lifecycle.computeNextPhase('nonsense'), null);
});

// ---- Task 4.4: handleWatch reads only real MATRIX_TYPES + no buggy require ----

await tc('MATRIX_TYPES contains only the 3 real types (no ghosts)', async () => {
  const { MATRIX_TYPES } = require(path.join(PLUGIN_ROOT, 'lib/infra/sprint/sprint-paths'));
  assert.ok(MATRIX_TYPES.includes('data-flow'), 'data-flow must be in MATRIX_TYPES');
  assert.ok(MATRIX_TYPES.includes('api-contract'), 'api-contract must be in MATRIX_TYPES');
  assert.ok(MATRIX_TYPES.includes('test-coverage'), 'test-coverage must be in MATRIX_TYPES');
  assert.ok(!MATRIX_TYPES.includes('cumulative-state'),
    'ghost type cumulative-state must not be in MATRIX_TYPES');
  assert.ok(!MATRIX_TYPES.includes('feature-phase'),
    'ghost type feature-phase must not be in MATRIX_TYPES');
});

await tc('handleWatch reads exactly real matrix types (no ghosts) via handleSprintAction', async () => {
  const { handleSprintAction } = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
  const os = require('node:os'); const fs = require('node:fs');
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 's4-watch-'));
  const id = 'slice4-watch';
  try {
    await handleSprintAction('init', { id, name: 'S4W', features: ['auth'], projectRoot: tmpRoot }, {});
    const res = await handleSprintAction('watch', { id, projectRoot: tmpRoot }, {});
    assert.ok(res.ok, 'watch must succeed; got ' + JSON.stringify(res));
    assert.ok(res.matrices && typeof res.matrices === 'object', 'matrices must be an object');
    // Exactly the 3 real types, alphabetically.
    assert.deepStrictEqual(
      Object.keys(res.matrices).sort(),
      ['api-contract', 'data-flow', 'test-coverage'],
      'matrices keys must be exactly the 3 real MATRIX_TYPES',
    );
    // Ghost types must be absent.
    assert.strictEqual(res.matrices['cumulative-state'], undefined,
      'ghost type cumulative-state must NOT appear in matrices');
    assert.strictEqual(res.matrices['feature-phase'], undefined,
      'ghost type feature-phase must NOT appear in matrices');
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

await tc('handleWatch does not crash on require path (regression for MODULE_NOT_FOUND)', async () => {
  const { handleSprintAction } = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
  const os = require('node:os'); const fs = require('node:fs');
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 's4-req-'));
  const id = 'slice4-watch-req';
  try {
    await handleSprintAction('init', { id, name: 'S4R', features: ['auth'], projectRoot: tmpRoot }, {});
    // If handleWatch still had the buggy local require, this would throw
    // MODULE_NOT_FOUND (resolving to scripts/lib/application/sprint-lifecycle).
    const res = await handleSprintAction('watch', { id, projectRoot: tmpRoot }, {});
    assert.ok(res.ok, 'watch must succeed without require crash; got ' + JSON.stringify(res));
    // triggers array proves lifecycle.checkAutoPauseTriggers ran via the correct
    // module-level import (no shadowed/buggy local require).
    assert.ok(Array.isArray(res.triggers), 'triggers must be an array');
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

// Task 4.4 sibling fix: handleFork had the SAME require-path crash class as
// handleWatch (a local require resolving to nonexistent scripts/lib/domain/sprint).
// This test exercises fork end-to-end; if the buggy local require were present,
// fork would throw MODULE_NOT_FOUND instead of returning ok.
await tc('handleFork works (no require-path crash; uses module-level domain import)', async () => {
  const { handleSprintAction } = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
  const os = require('node:os'); const fs = require('node:fs');
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 's4fork-'));
  try {
    // Source sprint with one incomplete feature (so carryItems is non-empty).
    await handleSprintAction('init',
      { id: 'fork-src', name: 'ForkSrc', features: ['auth'], projectRoot: tmpRoot }, {});
    // Mark the feature as in-progress in featureMap so identifyCarryItems picks it up.
    const storePath = path.join(tmpRoot, '.bkit/state/sprints', 'fork-src.json');
    const state = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    if (state.featureMap && state.featureMap['auth']) state.featureMap['auth'].phase = 'do';
    fs.writeFileSync(storePath, JSON.stringify(state));
    const res = await handleSprintAction('fork',
      { id: 'fork-src', newId: 'fork-dst', projectRoot: tmpRoot }, {});
    assert.ok(res.ok, 'fork must succeed; got ' + JSON.stringify(res));
    assert.ok(res.newSprint, 'fork must return the new sprint');
    assert.strictEqual(res.newSprint.id, 'fork-dst');
    assert.ok(Array.isArray(res.carryItems), 'fork must return carryItems');
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

if (fail) { console.error(`FAIL: ${fail} / PASS: ${pass}`); failures.forEach(f => console.error('  - ' + f.name + ': ' + f.msg)); process.exit(1); }
console.log(`PASS: ${pass} / FAIL: ${fail}`);

})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });
