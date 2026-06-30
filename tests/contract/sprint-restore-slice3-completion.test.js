'use strict';
/**
 * sprint-restore-slice3-completion.test.js — Slice 3, Task 3.4: featureMap
 * completion loop closure.
 *
 * Verifies that:
 *   - phaseCompletionPercent() returns the documented phase → completion scale.
 *   - advancePhase bumps every featureMap entry's pdcaPhase + completion on a
 *     successful transition (monotonically — never decrease).
 *   - handleQA sets featureMap[f].qa='pass' and completion=100 on success.
 *
 * Top-level await is wrapped in an async IIFE (CommonJS, no "type":"module").
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const domain = require(path.join(PLUGIN_ROOT, 'lib/domain/sprint'));
const phases = require(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle/phases'));

let pass = 0, fail = 0;
const failures = [];
async function tc(name, fn) {
  try { await fn(); pass++; } catch (e) { fail++; failures.push({ name, msg: e.message }); }
}

(async () => {

await tc('phaseCompletionPercent returns the documented scale for each phase (0 for unknown)', async () => {
  assert.strictEqual(phases.phaseCompletionPercent('prd'), 0, 'prd -> 0');
  assert.strictEqual(phases.phaseCompletionPercent('plan'), 20, 'plan -> 20');
  assert.strictEqual(phases.phaseCompletionPercent('design'), 40, 'design -> 40');
  assert.strictEqual(phases.phaseCompletionPercent('do'), 60, 'do -> 60');
  assert.strictEqual(phases.phaseCompletionPercent('iterate'), 80, 'iterate -> 80');
  assert.strictEqual(phases.phaseCompletionPercent('qa'), 90, 'qa -> 90');
  assert.strictEqual(phases.phaseCompletionPercent('report'), 100, 'report -> 100');
  assert.strictEqual(phases.phaseCompletionPercent('archived'), 100, 'archived -> 100');
  assert.strictEqual(phases.phaseCompletionPercent('nonsense'), 0, 'unknown -> 0');
  assert.strictEqual(phases.phaseCompletionPercent(undefined), 0, 'undefined -> 0');
});

await tc('advancePhase prd->plan sets every featureMap entry pdcaPhase=plan and completion=20', async () => {
  const lifecycle = require(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle'));
  const sprint = domain.createSprint({ id: 'comp-plan', name: 'C', features: ['auth', 'pay'] });
  assert.strictEqual(sprint.phase, 'prd', 'sanity: fresh sprint at prd');
  const res = await lifecycle.advancePhase(sprint, 'plan', {
    gateEvaluator: () => ({ allPassed: true }),
  });
  assert.strictEqual(res.ok, true, 'advance must succeed; got ' + JSON.stringify({ ok: res.ok, reason: res.reason }));
  assert.ok(res.sprint.featureMap['auth'], 'featureMap[auth] present after advance');
  assert.ok(res.sprint.featureMap['pay'], 'featureMap[pay] present after advance');
  assert.strictEqual(res.sprint.featureMap['auth'].pdcaPhase, 'plan', 'auth.pdcaPhase=plan');
  assert.strictEqual(res.sprint.featureMap['auth'].completion, 20, 'auth.completion=20');
  assert.strictEqual(res.sprint.featureMap['pay'].pdcaPhase, 'plan', 'pay.pdcaPhase=plan');
  assert.strictEqual(res.sprint.featureMap['pay'].completion, 20, 'pay.completion=20');
  // Non-advanced fields preserved.
  assert.strictEqual(res.sprint.featureMap['auth'].qa, 'pending', 'qa field preserved');
  assert.strictEqual(res.sprint.featureMap['auth'].matchRate, null, 'matchRate preserved');
  // Input sprint was not mutated.
  assert.strictEqual(sprint.featureMap['auth'].pdcaPhase, 'pm', 'input sprint NOT mutated');
});

await tc('advancePhase is monotonic — completion=100 entry stays 100 when advancing to qa (scale=90)', async () => {
  const lifecycle = require(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle'));
  const sprint = domain.createSprint({ id: 'comp-mono', name: 'M', features: ['auth'] });
  // Jump to iterate so advancing to qa is a legal next-step transition.
  sprint.phase = 'iterate';
  sprint.phaseHistory = [
    { phase: 'prd', enteredAt: '2026-01-01T00:00:00.000Z', exitedAt: '2026-01-02T00:00:00.000Z', durationMs: 86400000 },
    { phase: 'plan', enteredAt: '2026-01-02T00:00:00.000Z', exitedAt: '2026-01-03T00:00:00.000Z', durationMs: 86400000 },
    { phase: 'design', enteredAt: '2026-01-03T00:00:00.000Z', exitedAt: '2026-01-04T00:00:00.000Z', durationMs: 86400000 },
    { phase: 'do', enteredAt: '2026-01-04T00:00:00.000Z', exitedAt: '2026-01-05T00:00:00.000Z', durationMs: 86400000 },
    { phase: 'iterate', enteredAt: '2026-01-05T00:00:00.000Z', exitedAt: null, durationMs: null },
  ];
  // Simulate a feature that already hit completion=100 via qa pass.
  sprint.featureMap['auth'] = {
    ...sprint.featureMap['auth'],
    pdcaPhase: 'qa',
    qa: 'pass',
    completion: 100,
  };
  const res = await lifecycle.advancePhase(sprint, 'qa', {
    gateEvaluator: () => ({ allPassed: true }),
  });
  assert.strictEqual(res.ok, true, 'advance must succeed; got ' + JSON.stringify({ ok: res.ok, reason: res.reason }));
  assert.strictEqual(res.sprint.featureMap['auth'].completion, 100,
    'completion=100 must NOT decrease when advancing to qa (scale 90); got ' + res.sprint.featureMap['auth'].completion);
  assert.strictEqual(res.sprint.featureMap['auth'].pdcaPhase, 'qa', 'pdcaPhase advanced to qa');
  assert.strictEqual(res.sprint.featureMap['auth'].qa, 'pass', 'qa=pass preserved');
});

await tc('advancePhase defensive — empty featureMap advances fine and stays empty', async () => {
  const lifecycle = require(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle'));
  const sprint = domain.createSprint({ id: 'comp-empty', name: 'E', features: [] });
  assert.deepStrictEqual(sprint.featureMap, {});
  const res = await lifecycle.advancePhase(sprint, 'plan', {
    gateEvaluator: () => ({ allPassed: true }),
  });
  assert.strictEqual(res.ok, true, 'advance must succeed; got ' + JSON.stringify({ ok: res.ok, reason: res.reason }));
  assert.deepStrictEqual(res.sprint.featureMap, {}, 'featureMap must remain {} for featureless sprint');
});

await tc('handleQA sets featureMap[f].qa=pass and completion=100 on success', async () => {
  const { handleSprintAction } = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
  const os = require('node:os'); const fs = require('node:fs');
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 's3comp-qa-'));
  const id = 'slice3-comp-qa';
  try {
    await handleSprintAction('init', { id, name: 'S3 CQA', features: ['auth'], projectRoot: tmpRoot }, {});
    // All-passing validator → s1Score=100 → handleQA success path.
    const fakeValidator = async (_feature, _hopId, _sprint) => ({ passed: true, evidence: 'fake' });
    const res = await handleSprintAction('qa', { id, featureName: 'auth', projectRoot: tmpRoot }, {
      qaDeps: { dataFlowValidator: fakeValidator },
    });
    assert.ok(res.ok, 'qa must succeed; got ' + JSON.stringify(res));
    // Load persisted state — featureMap update must have landed in the same save.
    const state = JSON.parse(fs.readFileSync(
      path.join(tmpRoot, '.bkit/state/sprints', id + '.json'), 'utf8'));
    assert.ok(state.featureMap && state.featureMap['auth'], 'persisted featureMap[auth] must exist');
    assert.strictEqual(state.featureMap['auth'].qa, 'pass',
      'qa must be "pass" after successful data-flow verification; got ' + state.featureMap['auth'].qa);
    assert.strictEqual(state.featureMap['auth'].completion, 100,
      'completion must be 100 after qa pass (only path that grants 100); got ' + state.featureMap['auth'].completion);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

await tc('handleQA does NOT crash and still succeeds when feature is absent from featureMap (defensive)', async () => {
  const { handleSprintAction } = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
  const os = require('node:os'); const fs = require('node:fs');
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 's3comp-noop-'));
  const id = 'slice3-comp-noop';
  try {
    await handleSprintAction('init', { id, name: 'S3 CNO', features: ['auth'], projectRoot: tmpRoot }, {});
    // Strip the featureMap entry so 'auth' is absent — simulates a legacy
    // sprint created before featureMap population. handleQA must skip the
    // update silently, still persist S1, and still return ok.
    const sprintStore = require(path.join(PLUGIN_ROOT, 'lib/infra/sprint')).createSprintInfra({ projectRoot: tmpRoot }).stateStore;
    const loaded = await sprintStore.load(id);
    delete loaded.featureMap['auth'];
    await sprintStore.save(loaded);

    const fakeValidator = async () => ({ passed: true, evidence: 'fake' });
    const res = await handleSprintAction('qa', { id, featureName: 'auth', projectRoot: tmpRoot }, {
      qaDeps: { dataFlowValidator: fakeValidator },
    });
    assert.strictEqual(res.ok, true, 'qa must still succeed when feature absent from featureMap; got ' + JSON.stringify(res));
    // S1 still persisted.
    const state = JSON.parse(fs.readFileSync(
      path.join(tmpRoot, '.bkit/state/sprints', id + '.json'), 'utf8'));
    assert.ok(state.qualityGates && state.qualityGates.S1_dataFlowIntegrity,
      'S1 must still be persisted even when feature absent from featureMap');
    assert.strictEqual(state.qualityGates.S1_dataFlowIntegrity.current, 100);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

if (fail) {
  console.error(`FAIL: ${fail} / PASS: ${pass}`);
  failures.forEach(f => console.error('  - ' + f.name + ': ' + f.msg));
  process.exit(1);
}
console.log(`PASS: ${pass} / FAIL: ${fail}`);

})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });
