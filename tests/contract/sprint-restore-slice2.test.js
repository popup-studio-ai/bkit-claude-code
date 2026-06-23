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
  sprint.phaseHistory = [
    { phase: 'do', durationHours: 4 },
    { phase: 'iterate', durationHours: 2 },
  ];
  // No agentTaskRunner provided — M10 must not require one.
  const res = await mr.measureGate('M10', sprint, {});
  assert.notStrictEqual(res.reason, 'unsupported_gate', 'M10 must no longer be unsupported');
  assert.notStrictEqual(res.reason, 'no_agent_runner', 'M10 is computed; needs no runner');
  assert.strictEqual(res.ok, true, 'M10 must compute; got ' + JSON.stringify(res));
  assert.strictEqual(res.value, 6, 'M10 = sum of phaseHistory durations = 4+2=6; got ' + res.value);
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

if (fail) {
  console.error(`FAIL: ${fail} / PASS: ${pass}`);
  failures.forEach(f => console.error('  - ' + f.name + ': ' + f.msg));
  process.exit(1);
}
console.log(`PASS: ${pass} / FAIL: ${fail}`);

})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });
