'use strict';
/**
 * sprint-restore-slice3-acceptance.test.js — Slice 3 acceptance (Task 3.6).
 *
 * Slice-level integration invariants across tasks 3.1–3.5 that NO single
 * task test covers alone. Each case composes two or more slice-3 pieces:
 *   - 3.1 (featureMap population) + 3.4 (qa sets completion=100) + 3.3 (S2 reads completion)
 *   - 3.2 (handleFeature add/remove keeps the twin) end-to-end through the handler
 *   - 3.5 (handleReport writes + persists docs.report) + S4 archive chain unblock
 *   - gate-completeness milestone guard (Slice 2+3: no gate in limbo)
 *
 * Top-level await is wrapped in an async IIFE (CommonJS, no "type":"module").
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const { handleSprintAction } = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
const mr = require(path.join(PLUGIN_ROOT, 'lib/application/quality-gates/measure-router'));
const qg = require(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle/quality-gates'));

let pass = 0, fail = 0;
const failures = [];
async function tc(name, fn) {
  try { await fn(); pass++; } catch (e) { fail++; failures.push({ name, msg: e.message }); }
}

function makeTmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 's3acc-'));
}

// Persisted state lives at <root>/.bkit/state/sprints/<id>.json (see slice2 test).
function statePath(tmpRoot, id) {
  return path.join(tmpRoot, '.bkit/state/sprints', id + '.json');
}
function readState(tmpRoot, id) {
  return JSON.parse(fs.readFileSync(statePath(tmpRoot, id), 'utf8'));
}
function writeState(tmpRoot, id, state) {
  const p = statePath(tmpRoot, id);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(state, null, 2), 'utf8');
}

// Mark every report-phase active gate (except computed S2/S4) as passed.
// Mirrors sprint-restore-slice2.test.js markAllReportGatesPassed (~line 155).
// S4_READINESS_EXCLUDE = ['S2','S4'] (quality-gates.js:181), so S2 need not
// pass for archive; we still set featureMap completion=100 so S2 itself would
// measure cleanly if probed.
function markAllReportGatesPassed(sprint) {
  const gates = sprint.qualityGates;
  gates.M1_matchRate            = { current: 95,  threshold: 90,  passed: true };
  gates.M2_codeQualityScore     = { current: 90,  threshold: 80,  passed: true };
  gates.M3_criticalIssueCount   = { current: 0,   threshold: 0,   passed: true };
  gates.M4_apiComplianceRate    = { current: 98,  threshold: 95,  passed: true };
  gates.M5_runtimeErrorRate     = { current: 0,   threshold: 1,   passed: true };
  gates.M7_conventionCompliance = { current: 95,  threshold: 90,  passed: true };
  gates.M8_designCompleteness   = { current: 90,  threshold: 85,  passed: true };
  gates.M10_pdcaCycleTimeHours  = { current: 10,  threshold: 40,  passed: true };
  gates.S1_dataFlowIntegrity    = { current: 100, threshold: 100, passed: true };
}

// All-pass dataFlowValidator: returns {passed:true} for every hop, yielding s1Score=100.
const fakeValidator = async function () { return { passed: true, evidence: 'fake-acceptance' }; };

(async () => {

// === Test 1: full feature-tracking lifecycle -> S2 computable at 100 =========
// Proves 3.1 (population) + 3.4 (qa sets completion) + 3.3 (S2 reads completion) compose.
await tc('ACCEPTANCE: full lifecycle — 2 features qa-passed -> S2 measures 100', async () => {
  const tmpRoot = makeTmpRoot();
  const id = 'acc-full';
  try {
    await handleSprintAction('init',
      { id, name: 'Acc Full', features: ['auth', 'pay'], projectRoot: tmpRoot }, {});
    let state = readState(tmpRoot, id);
    assert.ok(state.featureMap['auth'], 'featureMap[auth] must be populated at init');
    assert.ok(state.featureMap['pay'], 'featureMap[pay] must be populated at init');
    assert.strictEqual(state.featureMap['auth'].completion, 0, 'auth starts at completion 0');
    assert.strictEqual(state.featureMap['auth'].qa, 'pending', 'auth starts qa=pending');
    assert.strictEqual(state.featureMap['pay'].completion, 0);
    assert.strictEqual(state.featureMap['pay'].qa, 'pending');

    // qa-pass BOTH features through the handler (not direct mutation).
    const qaAuth = await handleSprintAction('qa',
      { id, featureName: 'auth', projectRoot: tmpRoot },
      { qaDeps: { dataFlowValidator: fakeValidator } });
    assert.ok(qaAuth.ok, 'qa auth must succeed; got ' + JSON.stringify(qaAuth));
    const qaPay = await handleSprintAction('qa',
      { id, featureName: 'pay', projectRoot: tmpRoot },
      { qaDeps: { dataFlowValidator: fakeValidator } });
    assert.ok(qaPay.ok, 'qa pay must succeed; got ' + JSON.stringify(qaPay));

    // Reload persisted state — featureMap entries must reflect qa-pass.
    state = readState(tmpRoot, id);
    assert.strictEqual(state.featureMap['auth'].qa, 'pass', 'auth.qa must be pass after qa handler');
    assert.strictEqual(state.featureMap['auth'].completion, 100, 'auth.completion must be 100');
    assert.strictEqual(state.featureMap['pay'].qa, 'pass');
    assert.strictEqual(state.featureMap['pay'].completion, 100);

    // S2 computed gate reads the persisted featureMap and must equal 100.
    const res = await mr.measureGate('S2', state, {});
    assert.strictEqual(res.ok, true, 'S2 measure must be ok; got ' + JSON.stringify(res));
    assert.strictEqual(res.value, 100, 'S2 must equal 100 when both features at completion 100');
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

// === Test 2: partial completion -> S2 reflects ratio =========================
await tc('ACCEPTANCE: partial — 1 of 2 qa-passed -> S2 measures 50', async () => {
  const tmpRoot = makeTmpRoot();
  const id = 'acc-half';
  try {
    await handleSprintAction('init',
      { id, name: 'Acc Half', features: ['auth', 'pay'], projectRoot: tmpRoot }, {});
    // qa-pass only ONE feature.
    const qaRes = await handleSprintAction('qa',
      { id, featureName: 'auth', projectRoot: tmpRoot },
      { qaDeps: { dataFlowValidator: fakeValidator } });
    assert.ok(qaRes.ok, 'qa auth must succeed; got ' + JSON.stringify(qaRes));

    const state = readState(tmpRoot, id);
    assert.strictEqual(state.featureMap['auth'].completion, 100);
    assert.strictEqual(state.featureMap['pay'].completion, 0, 'pay must remain at 0 (not qa-passed)');

    const res = await mr.measureGate('S2', state, {});
    assert.strictEqual(res.ok, true, 'S2 measure must be ok');
    assert.strictEqual(res.value, 50, 'S2 must equal 50 (one of two at completion 100); got ' + res.value);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

// === Test 3: handleFeature add/remove keeps featureMap twin =================
// Proves 3.2 end-to-end through the handler (not just direct mutation).
await tc('ACCEPTANCE: handleFeature add then remove keeps featureMap twin', async () => {
  const tmpRoot = makeTmpRoot();
  const id = 'acc-twin';
  try {
    await handleSprintAction('init',
      { id, name: 'Acc Twin', features: ['auth'], projectRoot: tmpRoot }, {});
    let state = readState(tmpRoot, id);
    assert.deepStrictEqual(state.features, ['auth'], 'initial features must be [auth]');
    assert.ok(state.featureMap['auth'], 'featureMap[auth] must exist at init');

    // ADD 'pay' — features[] and featureMap must stay in lockstep.
    const addRes = await handleSprintAction('feature',
      { id, action: 'add', featureName: 'pay', projectRoot: tmpRoot }, {});
    assert.strictEqual(addRes.ok, true, 'feature add must succeed');
    state = readState(tmpRoot, id);
    assert.ok(state.features.indexOf('pay') !== -1, 'features[] must include pay after add');
    assert.ok(state.featureMap['pay'], 'featureMap[pay] must exist after add');
    assert.strictEqual(state.featureMap['pay'].completion, 0, 'new entry starts at completion 0');
    assert.strictEqual(state.featureMap['pay'].qa, 'pending', 'new entry starts qa=pending');

    // REMOVE 'pay' — both sources must drop it.
    const remRes = await handleSprintAction('feature',
      { id, action: 'remove', featureName: 'pay', projectRoot: tmpRoot }, {});
    assert.strictEqual(remRes.ok, true, 'feature remove must succeed');
    state = readState(tmpRoot, id);
    assert.ok(state.features.indexOf('pay') === -1, 'features[] must NOT include pay after remove');
    assert.ok(!state.featureMap['pay'], 'featureMap[pay] must be gone after remove');
    assert.ok(state.featureMap['auth'], 'featureMap[auth] must survive removing pay');
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

// === Test 4: report write + docs.report persist + S4 unblock archive ========
// Proves 3.5 end-to-end + the S4 archive chain unblocked by persisted docs.report.
await tc('ACCEPTANCE: report writes + persists docs.report + archive (S4) unblocks', async () => {
  const tmpRoot = makeTmpRoot();
  const id = 'acc-report';
  try {
    await handleSprintAction('init',
      { id, name: 'Acc Report', features: ['auth', 'pay'], projectRoot: tmpRoot }, {});

    // Move sprint to report phase + mark all report gates passed. No handler
    // does "set phase + pass gates" directly, so load/persist the JSON ourselves
    // (matches slice2 test's pattern of reading the persisted JSON).
    let state = readState(tmpRoot, id);
    state.phase = 'report';
    markAllReportGatesPassed(state);
    // Realism: both features fully complete so S2 would pass if measured.
    // (S4 readiness excludes S2, but keeping the fixture honest.)
    state.featureMap['auth'].completion = 100;
    state.featureMap['pay'].completion = 100;
    writeState(tmpRoot, id, state);

    // Run the report handler with a tmpRoot-scoped docPathResolver.
    const reportPath = path.join(tmpRoot, 'rep-' + id + '.md');
    const reportRes = await handleSprintAction('report',
      { id, projectRoot: tmpRoot },
      { reportDeps: { docPathResolver: function () { return reportPath; } } });
    assert.ok(reportRes.ok, 'report must succeed; got ' + JSON.stringify(reportRes));
    assert.strictEqual(fs.existsSync(reportPath), true,
      'report file must exist on disk at the resolver path');
    const onDisk = fs.readFileSync(reportPath, 'utf8');
    assert.ok(/# Sprint Report/.test(onDisk),
      'report file contents must contain "# Sprint Report"; got head:\n' + onDisk.slice(0, 200));

    // Reload persisted state — docs.report must equal the resolver-supplied path.
    state = readState(tmpRoot, id);
    assert.strictEqual(state.docs.report, reportPath,
      'persisted docs.report must equal reportPath; got ' + JSON.stringify(state.docs && state.docs.report));

    // Archive must now succeed: S4 readiness = all report gates passed + docs.report truthy.
    const archRes = await handleSprintAction('archive', { id, projectRoot: tmpRoot }, {});
    assert.strictEqual(archRes.ok, true,
      'archive must succeed when S4 ready (docs.report persisted + gates pass); got ' + JSON.stringify(archRes));
    // Confirm the archived state actually landed.
    state = readState(tmpRoot, id);
    assert.strictEqual(state.phase, 'archived', 'sprint phase must be archived after archive handler');
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

// === Test 5: gate-completeness milestone guard (Slice 2+3) ==================
// Reuses the slice-2 acceptance assertion — every active gate routed, UNSUPPORTED empty.
await tc('ACCEPTANCE: every active gate routed (no gate in limbo)', async () => {
  const allGates = new Set();
  Object.values(qg.ACTIVE_GATES_BY_PHASE).forEach(function (arr) { arr.forEach(function (g) { allGates.add(g); }); });
  const routed = mr.SUPPORTED_GATES;
  const unsupported = mr.UNSUPPORTED_GATES;
  const inLimbo = [];
  allGates.forEach(function (g) {
    if (routed.indexOf(g) === -1 && unsupported.indexOf(g) === -1) inLimbo.push(g);
  });
  assert.deepStrictEqual(inLimbo, [],
    'gates with no route AND no explicit carry = limbo: ' + JSON.stringify(inLimbo));
  assert.deepStrictEqual(unsupported, [],
    'after Slice 3 all gates are routed; got ' + JSON.stringify(unsupported));
});

if (fail) {
  console.error(`FAIL: ${fail} / PASS: ${pass}`);
  failures.forEach(function (f) { console.error('  - ' + f.name + ': ' + f.msg); });
  process.exit(1);
}
console.log(`PASS: ${pass} / FAIL: ${fail}`);

})().catch(function (e) { console.error('HARNESS ERROR:', e); process.exit(2); });
