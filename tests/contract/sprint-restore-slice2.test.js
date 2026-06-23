'use strict';
/**
 * sprint-restore-slice2.test.js — Slice 2: gate measurement completeness.
 *
 * Covers: M8 chicken-and-egg (plan-source), M5 route, M10 computed route,
 * S1 persistence, auto-pause all-gates scope, S4 definition.
 *
 * Top-level await is wrapped in an async IIFE (Node 24, no "type":"module").
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const mr = require(path.join(PLUGIN_ROOT, 'lib/application/quality-gates/measure-router'));
const domain = require(path.join(PLUGIN_ROOT, 'lib/domain/sprint'));

let pass = 0, fail = 0;
const failures = [];
async function tc(name, fn) {
  try { await fn(); pass++; } catch (e) { fail++; failures.push({ name, msg: e.message }); }
}

(async () => {

await tc('M8 at plan-exit references the plan doc design section, not the design doc', async () => {
  const sprint = domain.createSprint({ id: 's2-m8', name: 'S2 M8', features: ['auth'] });
  sprint.phase = 'plan';
  const prompt = mr.buildPrompt('M8', sprint);
  assert.ok(prompt.includes('plan'), 'M8 prompt at plan phase must reference the plan doc; got:\n' + prompt);
  assert.ok(!/Design doc §14/.test(prompt),
    'M8 prompt at plan phase must NOT reference the (not-yet-existing) Design doc §14; got:\n' + prompt);
});

await tc('M8 at design-or-later references the design doc §14 checklist', async () => {
  const sprint = domain.createSprint({ id: 's2-m8b', name: 'S2 M8b', features: ['auth'] });
  sprint.phase = 'design';
  const prompt = mr.buildPrompt('M8', sprint);
  assert.ok(/Design doc §14/.test(prompt),
    'M8 prompt at design+ must reference Design doc §14; got:\n' + prompt);
});

await tc('M8 measureGate at plan-exit reaches the runner (no no_agent_runner, no no_source_artifact)', async () => {
  const sprint = domain.createSprint({ id: 's2-m8c', name: 'S2 M8c', features: ['auth'] });
  sprint.phase = 'plan';
  const runner = async () => ({ output: '{"value": 88}' });
  const res = await mr.measureGate('M8', sprint, { agentTaskRunner: runner });
  assert.ok(res, 'M8 measurement must return a result');
  assert.notStrictEqual(res.reason, 'no_agent_runner');
  assert.strictEqual(res.ok, true, 'M8 must measure successfully at plan-exit; got ' + JSON.stringify(res));
  assert.strictEqual(res.value, 88);
});

await tc('M5 returns not_applicable when no log source is available (libraries/static sites)', async () => {
  const sprint = domain.createSprint({ id: 's2-m5', name: 'S2 M5', features: ['auth'] });
  sprint.phase = 'do';
  const res = await mr.measureGate('M5', sprint, {
    agentTaskRunner: async () => ({ output: '{"value": 0}' }),
    logSourceAvailable: false,
  });
  assert.strictEqual(res.reason, 'not_applicable',
    'M5 with no logs must exempt, not fail; got ' + JSON.stringify(res));
  assert.strictEqual(res.passed, true, 'not_applicable must count as passed (exempted)');
});

await tc('M5 measures via qa-monitor probe when logs ARE available', async () => {
  const sprint = domain.createSprint({ id: 's2-m5b', name: 'S2 M5b', features: ['auth'] });
  sprint.phase = 'do';
  const res = await mr.measureGate('M5', sprint, {
    agentTaskRunner: async () => ({ output: '{"value": 0}' }),
    logSourceAvailable: true,
  });
  assert.notStrictEqual(res.reason, 'unsupported_gate', 'M5 must no longer be unsupported');
  assert.notStrictEqual(res.reason, 'not_applicable', 'M5 with logs must run the probe');
  assert.strictEqual(res.ok, true, 'M5 with logs must measure; got ' + JSON.stringify(res));
  assert.strictEqual(res.value, 0);
});

await tc('M10 is computed from phaseHistory (no sub-agent needed)', async () => {
  const sprint = domain.createSprint({ id: 's2-m10', name: 'S2 M10', features: ['auth'] });
  sprint.phase = 'report';
  // phaseHistory entries carry durationMs (ms) — the field advance-phase's
  // appendExitToHistory actually writes. M10 converts to hours (Slice 2
  // follow-up: the compute previously read a never-produced `durationHours`).
  sprint.phaseHistory = [
    { phase: 'do', durationMs: 4 * 3600 * 1000 },
    { phase: 'iterate', durationMs: 2 * 3600 * 1000 },
  ];
  // No agentTaskRunner provided — M10 must not require one.
  const res = await mr.measureGate('M10', sprint, {});
  assert.notStrictEqual(res.reason, 'unsupported_gate', 'M10 must no longer be unsupported');
  assert.notStrictEqual(res.reason, 'no_agent_runner', 'M10 is computed; needs no runner');
  assert.strictEqual(res.ok, true, 'M10 must compute; got ' + JSON.stringify(res));
  assert.strictEqual(res.value, 6, 'M10 = sum of phaseHistory durationMs in hours = 4+2=6; got ' + res.value);
});

await tc('QUALITY_GATE_FAIL fires when ANY active gate fails, not just M3/S1', async () => {
  const ap = require(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle/auto-pause'));
  const sprint = domain.createSprint({ id: 's2-ap', name: 'S2 AP', features: ['auth'] });
  sprint.phase = 'qa';
  sprint.autoPause = { armed: ['QUALITY_GATE_FAIL'] };
  // M2 fails; M3 and S1 pass — old code would NOT fire.
  sprint.qualityGates.M2_codeQualityScore = { current: 50, threshold: 80, passed: false };
  sprint.qualityGates.M3_criticalIssueCount = { current: 0, threshold: 0, passed: true };
  sprint.qualityGates.S1_dataFlowIntegrity = { current: 100, threshold: 100, passed: true };
  const hits = ap.checkAutoPauseTriggers(sprint);
  const qgf = hits.find(h => h.triggerId === 'QUALITY_GATE_FAIL');
  assert.ok(qgf, 'auto-pause must fire QUALITY_GATE_FAIL on M2 failure; got ' + JSON.stringify(hits.map(h => h.triggerId)));
  assert.ok(/M2/.test(qgf.message), 'message must name the failing gate M2; got ' + qgf.message);
});

await tc('QUALITY_GATE_FAIL does NOT fire when all active gates pass', async () => {
  const ap = require(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle/auto-pause'));
  const sprint = domain.createSprint({ id: 's2-ap2', name: 'S2 AP2', features: ['auth'] });
  sprint.phase = 'qa';
  sprint.autoPause = { armed: ['QUALITY_GATE_FAIL'] };
  // All measured gates pass.
  for (const k of Object.keys(sprint.qualityGates)) {
    const slot = sprint.qualityGates[k];
    if (slot && typeof slot === 'object') sprint.qualityGates[k] = { ...slot, passed: true, current: slot.current };
  }
  sprint.qualityGates.M2_codeQualityScore = { current: 90, threshold: 80, passed: true };
  sprint.qualityGates.M3_criticalIssueCount = { current: 0, threshold: 0, passed: true };
  sprint.qualityGates.S1_dataFlowIntegrity = { current: 100, threshold: 100, passed: true };
  const hits = ap.checkAutoPauseTriggers(sprint);
  assert.ok(!hits.find(h => h.triggerId === 'QUALITY_GATE_FAIL'),
    'must NOT fire when all gates pass; got ' + JSON.stringify(hits.map(h => h.triggerId)));
});

await tc('handleQA persists computed s1Score to qualityGates.S1_dataFlowIntegrity', async () => {
  const { handleSprintAction } = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
  const os = require('node:os'); const fs = require('node:fs');
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 's2qa-'));
  const id = 'slice2-qa';
  await handleSprintAction('init', { id, name: 'S2 QA', features: ['auth'], projectRoot: tmpRoot }, {});
  // verifyDataFlow calls dataFlowValidator(feature, hopId, sprint) once per hop
  // (7 hops). All-pass → s1Score = (7/7)*100 = 100.
  const fakeValidator = async (_feature, _hopId, _sprint) => ({ passed: true, evidence: 'fake' });
  const res = await handleSprintAction('qa', { id, featureName: 'auth', projectRoot: tmpRoot }, { qaDeps: { dataFlowValidator: fakeValidator } });
  assert.ok(res.ok, 'qa must succeed; got ' + JSON.stringify(res));
  assert.strictEqual(res.s1Score, 100, 'qa result must carry s1Score=100; got ' + res.s1Score);
  // Load persisted state from the state store path (<root>/.bkit/state/sprints/<id>.json).
  const state = JSON.parse(fs.readFileSync(path.join(tmpRoot, '.bkit/state/sprints', id + '.json'), 'utf8'));
  assert.ok(state.qualityGates && state.qualityGates.S1_dataFlowIntegrity, 'S1 slot must exist after qa');
  assert.strictEqual(state.qualityGates.S1_dataFlowIntegrity.current, 100, 's1Score must be persisted to S1.current');
  assert.strictEqual(state.qualityGates.S1_dataFlowIntegrity.threshold, 100, 'S1 threshold must be 100');
  assert.strictEqual(state.qualityGates.S1_dataFlowIntegrity.passed, true, 'S1.passed must be true at score 100');
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

// === S4_archiveReadiness: computed gate (Slice 2, Task 2.6 — no gate in limbo) ===
//
// S4 is the last active gate with no measurement route. It is a computed gate:
// ready iff every report-phase active gate has passed === true AND a report
// doc exists (sprint.docs.report truthy). No sub-agent. The slot is populated
// inside archiveSprint BEFORE the gate check (evaluateGate reads slot values,
// not compute fns) and exposed via measure-router so `/sprint measure S4` works.

// Helper: mark every report-phase active gate (except computed S2/S4) as passed.
function markAllReportGatesPassed(sprint) {
  const gates = sprint.qualityGates;
  // Numeric gates: set a current that satisfies the op + threshold.
  gates.M1_matchRate            = { current: 95,  threshold: 90,  passed: true };
  gates.M2_codeQualityScore     = { current: 90,  threshold: 80,  passed: true };
  gates.M3_criticalIssueCount   = { current: 0,   threshold: 0,   passed: true };
  gates.M4_apiComplianceRate    = { current: 98,  threshold: 95,  passed: true };
  gates.M5_runtimeErrorRate     = { current: 0,   threshold: 1,   passed: true };
  gates.M7_conventionCompliance = { current: 95,  threshold: 90,  passed: true };
  gates.M8_designCompleteness   = { current: 90,  threshold: 85,  passed: true };
  gates.M10_pdcaCycleTimeHours  = { current: 10,  threshold: 40,  passed: true };
  gates.S1_dataFlowIntegrity    = { current: 100, threshold: 100, passed: true };
  // S2 (featureCompletion) is itself a computed gate not yet routed (Slice 3);
  // S4 readiness only requires gates that have a measurement route today, so
  // we skip S2/S4 when constructing the "all passing" fixture. (S4 readiness
  // is defined over the report-phase gates that are actually measurable.)
}

await tc('S4_archiveReadiness is computed from report-complete + all-gates-passed', async () => {
  const sprint = domain.createSprint({ id: 's2-s4', name: 'S2 S4', features: ['auth'] });
  sprint.phase = 'report';
  markAllReportGatesPassed(sprint);
  sprint.docs = { ...sprint.docs, report: '/tmp/report.md' };
  const res = await mr.measureGate('S4', sprint, {});
  assert.notStrictEqual(res.reason, 'unsupported_gate',
    'S4 must no longer be unsupported; got ' + JSON.stringify(res));
  assert.strictEqual(res.ok, true, 'S4 measure must be ok; got ' + JSON.stringify(res));
  assert.strictEqual(res.value, true,
    'all-passed + report present must yield S4=true; got ' + JSON.stringify(res));
});

await tc('S4 fails when report is missing even if all gates pass', async () => {
  const sprint = domain.createSprint({ id: 's2-s4b', name: 'S2 S4b', features: ['auth'] });
  sprint.phase = 'report';
  markAllReportGatesPassed(sprint);
  sprint.docs = { ...sprint.docs, report: null }; // no report generated
  const res = await mr.measureGate('S4', sprint, {});
  assert.strictEqual(res.ok, true, 'S4 measure must be ok (computed); got ' + JSON.stringify(res));
  assert.strictEqual(res.value, false,
    'missing report must yield S4=false; got ' + JSON.stringify(res));
});

await tc('S4 fails when any report-phase gate has not passed', async () => {
  const sprint = domain.createSprint({ id: 's2-s4c', name: 'S2 S4c', features: ['auth'] });
  sprint.phase = 'report';
  markAllReportGatesPassed(sprint);
  sprint.docs = { ...sprint.docs, report: '/tmp/report.md' };
  // Break one gate (M2 below its threshold).
  sprint.qualityGates.M2_codeQualityScore = { current: 50, threshold: 80, passed: false };
  const res = await mr.measureGate('S4', sprint, {});
  assert.strictEqual(res.value, false,
    'a failing report-phase gate must yield S4=false; got ' + JSON.stringify(res));
});

await tc('archiveSprint populates S4 slot from readiness before the gate check', async () => {
  const lifecycle = require(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle'));
  const sprint = domain.createSprint({ id: 's2-s4d', name: 'S2 S4d', features: ['auth'] });
  sprint.phase = 'report';
  markAllReportGatesPassed(sprint);
  sprint.docs = { ...sprint.docs, report: '/tmp/r.md' };
  const res = await lifecycle.archiveSprint(sprint, {});
  assert.strictEqual(res.ok, true,
    'archive must succeed when ready; got ' + JSON.stringify(res));
  assert.ok(res.sprint, 'archive must return the updated sprint');
  assert.ok(res.sprint.qualityGates.S4_archiveReadiness,
    'archived sprint must carry the populated S4 slot');
  assert.strictEqual(res.sprint.qualityGates.S4_archiveReadiness.passed, true,
    'S4 slot must reflect readiness=true; got ' + JSON.stringify(res.sprint.qualityGates.S4_archiveReadiness));
  assert.strictEqual(res.sprint.qualityGates.S4_archiveReadiness.current, true,
    'S4.current must be true when ready');
});

await tc('archiveSprint blocks archive when report is missing (S4 not ready)', async () => {
  const lifecycle = require(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle'));
  const sprint = domain.createSprint({ id: 's2-s4e', name: 'S2 S4e', features: ['auth'] });
  sprint.phase = 'report';
  markAllReportGatesPassed(sprint);
  sprint.docs = { ...sprint.docs, report: null }; // no report
  const res = await lifecycle.archiveSprint(sprint, {});
  assert.strictEqual(res.ok, false,
    'archive must be blocked when S4 not ready; got ' + JSON.stringify(res));
  assert.strictEqual(res.reason, 'archive_readiness_fail',
    'block reason must be archive_readiness_fail; got ' + res.reason);
});

// === Slice 2 acceptance: no gate in limbo ===
// Every gate that appears in ACTIVE_GATES_BY_PHASE must be either routed
// (SUPPORTED_GATES) or explicitly carried with a Slice-3 plan (UNSUPPORTED).
// As of Slice 3 Task 3.3, S2 has been promoted to a computed gate, so all
// gates are routed and UNSUPPORTED_GATES is empty.

await tc('SLICE 2 ACCEPTANCE: every active gate is routed or explicitly carried', async () => {
  const qg = require(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle/quality-gates'));
  const allGates = new Set();
  Object.values(qg.ACTIVE_GATES_BY_PHASE).forEach(arr => arr.forEach(g => allGates.add(g)));
  const routed = mr.SUPPORTED_GATES;
  const unsupported = mr.UNSUPPORTED_GATES;
  const inLimbo = [];
  for (const g of allGates) {
    if (!routed.includes(g) && !unsupported.includes(g)) inLimbo.push(g);
  }
  assert.deepStrictEqual(inLimbo, [],
    'gates with no route AND no explicit carry = limbo: ' + JSON.stringify(inLimbo));
  // Slice 3 Task 3.3 promotion: S2 is now a computed gate, so UNSUPPORTED is
  // empty — the "no gate in limbo" guarantee is complete.
  assert.deepStrictEqual(unsupported, [],
    'after Slice 3 all gates are routed; got ' + JSON.stringify(unsupported));
});

if (fail) {
  console.error(`FAIL: ${fail} / PASS: ${pass}`);
  failures.forEach(f => console.error('  - ' + f.name + ': ' + f.msg));
  process.exit(1);
}
console.log(`PASS: ${pass} / FAIL: ${fail}`);

})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });
