'use strict';
/**
 * sprint-restore-slice2-followups.test.js — Slice 2 latent-defect fixes.
 *
 * The master E2E (Task 6.1) surfaced two latent defects in Slice 2 that no
 * per-task slice test caught (each slice test exercised its unit in
 * isolation, not the full measure-through-the-dispatcher path):
 *
 *   1. M10 schema mismatch: the M10 compute read `entry.durationHours`, but
 *      advance-phase.appendExitToHistory stores `durationMs` — so M10 always
 *      summed 0. Fixed to read durationMs and convert to hours.
 *   2. M5 exemption unreachable: the qa-monitor not_applicable route (Slice 2
 *      Task 2.2's headline feature) was reachable only programmatically —
 *      handleMeasure + runPhaseGates never forwarded `logSourceAvailable`
 *      into the use case. Fixed by threading args/deps.logSourceAvailable.
 *
 * These tests prove both fixes work end-to-end through the dispatcher.
 *
 * Top-level await is wrapped in an async IIFE (Node 24, no "type":"module").
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const PLUGIN_ROOT = path.resolve(__dirname, '../../');

let pass = 0, fail = 0;
const failures = [];
async function tc(name, fn) {
  try { await fn(); pass++; } catch (e) { fail++; failures.push({ name, msg: e.message }); }
}

(async () => {

// === M10: computed gate reads durationMs (not the never-produced durationHours) ===

await tc('M10 compute sums phaseHistory durationMs converted to hours', async () => {
  const mr = require(path.join(PLUGIN_ROOT, 'lib/application/quality-gates/measure-router'));
  // 2h + 1.5h = 3.5h
  const sprint = {
    phaseHistory: [
      { phase: 'do', durationMs: 2 * 3600 * 1000 },
      { phase: 'qa', durationMs: 1.5 * 3600 * 1000 },
    ],
  };
  const res = await mr.measureGate('M10', sprint, {});
  assert.strictEqual(res.ok, true, 'M10 must measure; got ' + JSON.stringify(res));
  assert.strictEqual(res.value, 3.5,
    'M10 must sum durationMs / 3_600_000 = 3.5 hours; got ' + res.value);
});

await tc('M10 compute is 0 when phaseHistory entries lack durationMs (defensive)', async () => {
  const mr = require(path.join(PLUGIN_ROOT, 'lib/application/quality-gates/measure-router'));
  // Old buggy code would have summed entries with `durationHours` here (0). The
  // fix reads durationMs; entries without it contribute 0. No crash.
  const sprint = {
    phaseHistory: [
      { phase: 'do', durationHours: 5 }, // wrong field name — ignored, not summed
      { phase: 'qa' },                    // no duration — ignored
    ],
  };
  const res = await mr.measureGate('M10', sprint, {});
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.value, 0,
    'M10 must be 0 when no entry carries durationMs; got ' + res.value);
});

await tc('M10 measured through the dispatcher persists the computed hours to its slot', async () => {
  const { handleSprintAction } = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
  const os = require('node:os'); const fs = require('node:fs');
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'm10disp-'));
  const id = 'm10-disp';
  try {
    await handleSprintAction('init', { id, name: 'M10', features: ['auth'], projectRoot: tmpRoot }, {});
    // Seed phaseHistory with real durationMs values (as advance-phase writes them).
    const storePath = path.join(tmpRoot, '.bkit/state/sprints', id + '.json');
    const state = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    state.phaseHistory = [
      { phase: 'do', durationMs: 4 * 3600 * 1000, enteredAt: '2026-01-01T00:00:00.000Z', exitedAt: '2026-01-01T04:00:00.000Z' },
      { phase: 'qa', durationMs: 2 * 3600 * 1000, enteredAt: '2026-01-01T04:00:00.000Z', exitedAt: '2026-01-01T06:00:00.000Z' },
    ];
    fs.writeFileSync(storePath, JSON.stringify(state));
    const res = await handleSprintAction('measure', { id, gate: 'M10', projectRoot: tmpRoot }, {});
    assert.strictEqual(res.ok, true, 'measure M10 must succeed; got ' + JSON.stringify(res));
    const r = res.results[0];
    assert.ok(r && r.measurement, 'measure result must carry measurement');
    assert.strictEqual(r.measurement.value, 6,
      'M10 via dispatcher must be 6 hours (4h+2h); got ' + r.measurement.value);
    // Persisted slot reflects the computed value (record mode at default trust).
    const persisted = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    assert.strictEqual(persisted.qualityGates.M10_pdcaCycleTimeHours.current, 6,
      'M10 slot must persist the computed 6 hours');
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

// === M5: exemption reachable through the dispatcher (logSourceAvailable forwarded) ===

await tc('M5 measure with logSourceAvailable=false returns not_applicable via dispatcher', async () => {
  const { handleSprintAction } = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
  const os = require('node:os'); const fs = require('node:fs');
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'm5exempt-'));
  const id = 'm5-exempt';
  try {
    await handleSprintAction('init', { id, name: 'M5', features: ['auth'], projectRoot: tmpRoot }, {});
    const res = await handleSprintAction('measure',
      { id, gate: 'M5', projectRoot: tmpRoot, logSourceAvailable: false },
      { agentTaskRunner: async () => ({ output: '{"value": 0}' }) });
    assert.strictEqual(res.ok, true, 'measure M5 exempt must succeed; got ' + JSON.stringify(res));
    const r = res.results[0];
    assert.ok(r.measurement, 'measure result must carry measurement');
    assert.strictEqual(r.measurement.value, null,
      'exempted M5 value must be null (no probe run); got ' + r.measurement.value);
    assert.strictEqual(r.measurement.passed, true,
      'not_applicable must count as passed; got ' + r.measurement.passed);
    // Persisted slot: passed true, current null, no live probe.
    const state = JSON.parse(fs.readFileSync(
      path.join(tmpRoot, '.bkit/state/sprints', id + '.json'), 'utf8'));
    const slot = state.qualityGates.M5_runtimeErrorRate;
    assert.strictEqual(slot.passed, true, 'persisted M5.passed must be true (exempted)');
    assert.strictEqual(slot.current, null, 'persisted M5.current must be null (no probe)');
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

await tc('M5 measure with logSourceAvailable=true runs the probe (value persisted)', async () => {
  const { handleSprintAction } = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
  const os = require('node:os'); const fs = require('node:fs');
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'm5probe-'));
  const id = 'm5-probe';
  try {
    await handleSprintAction('init', { id, name: 'M5', features: ['auth'], projectRoot: tmpRoot }, {});
    const res = await handleSprintAction('measure',
      { id, gate: 'M5', projectRoot: tmpRoot, logSourceAvailable: true },
      { agentTaskRunner: async () => ({ output: '{"value": 0}' }) });
    assert.strictEqual(res.ok, true);
    const r = res.results[0];
    assert.strictEqual(r.measurement.value, 0,
      'M5 with logs must run the probe and persist value 0; got ' + r.measurement.value);
    assert.strictEqual(r.measurement.passed, true,
      '0 <= 1 threshold must pass; got ' + r.measurement.passed);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

await tc('M5 exemption reachable via measure --phase when logSourceAvailable=false', async () => {
  // The --phase path (runPhaseGates) must ALSO forward logSourceAvailable.
  const { handleSprintAction } = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
  const os = require('node:os'); const fs = require('node:fs');
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'm5phase-'));
  const id = 'm5-phase';
  try {
    await handleSprintAction('init', { id, name: 'M5', features: ['auth'], projectRoot: tmpRoot }, {});
    // Set sprint to 'do' (M5 is active in do). Seed the other do gates so the
    // phase measure focuses on M5's exemption.
    const storePath = path.join(tmpRoot, '.bkit/state/sprints', id + '.json');
    const state = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    state.phase = 'do';
    fs.writeFileSync(storePath, JSON.stringify(state));
    const res = await handleSprintAction('measure',
      { id, phase: 'do', projectRoot: tmpRoot, logSourceAvailable: false },
      { agentTaskRunner: async () => ({ output: '{"value": 100}' }) });
    assert.strictEqual(res.ok, true, 'measure --phase do must succeed; got ' + JSON.stringify(res));
    // Find the M5 result among the do-phase gates.
    const m5 = res.results.find((r) => r.gateKey === 'M5');
    assert.ok(m5, 'M5 must be in the do-phase measure results');
    assert.strictEqual(m5.measurement.passed, true,
      'M5 exemption must apply on the --phase path too; got passed=' + m5.measurement.passed);
    assert.strictEqual(m5.measurement.value, null,
      'exempted M5 via --phase must have value null; got ' + m5.measurement.value);
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
