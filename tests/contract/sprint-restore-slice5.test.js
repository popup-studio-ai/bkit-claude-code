'use strict';
/**
 * sprint-restore-slice5.test.js — Sprint restore-as-designed, Slice 5 (Task 5.1).
 *
 * Cluster E, Issue #93: advancePhase's gate_fail return must include an
 * actionable `hint` string pointing the user at `/sprint measure` so they
 * can recover from an unmeasured or below-threshold gate without guessing.
 *
 * Contract assertions:
 *   - gate_fail return shape carries a non-empty `hint` string.
 *   - hint names the failing gate key(s) (e.g. M8, or M4 + M8 together).
 *   - hint points at `/sprint measure` and includes the re-run `phase` command.
 *
 * Sibling-pattern harness (matches sprint-restore-slice4.test.js).
 */

const assert = require('node:assert/strict');
const path = require('node:path');
const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const domain = require(path.join(PLUGIN_ROOT, 'lib/domain/sprint'));
let pass = 0, fail = 0; const failures = [];
async function tc(name, fn) {
  try { await fn(); pass++; }
  catch (e) { fail++; failures.push({ name, msg: e.message }); }
}

(async () => {

// ---- Task 5.1: gate_fail return includes a /sprint measure hint ----

await tc('gate_fail return includes a hint pointing to /sprint measure', async () => {
  const lifecycle = require(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle'));
  const sprint = domain.createSprint({ id: 's5h', name: 'S5h', features: ['auth'] });
  sprint.phase = 'plan';
  // plan-phase active gate = M8 (see ACTIVE_GATES_BY_PHASE). current:null
  // forces evaluatePhase to return not_measured -> passed:false -> gate_fail.
  sprint.qualityGates.M8_designCompleteness = { current: null, threshold: 85, passed: null };
  const res = await lifecycle.advancePhase(sprint, 'design', {});
  assert.ok(res && res.reason === 'gate_fail',
    'expected gate_fail; got ' + JSON.stringify(res));
  assert.ok(typeof res.hint === 'string' && res.hint.length > 0,
    'gate_fail must include a non-empty hint; got ' + JSON.stringify(res.hint));
  assert.ok(res.hint.includes('/sprint measure'),
    'hint must point to /sprint measure; got ' + res.hint);
  assert.ok(res.hint.includes('M8'),
    'hint must name the failing gate M8; got ' + res.hint);
});

await tc('hint names MULTIPLE failing gates when several fail (design: M4 + M8)', async () => {
  const lifecycle = require(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle'));
  const sprint = domain.createSprint({ id: 's5m', name: 'S5m', features: ['auth'] });
  // design-phase active gates = ['M4', 'M8'] per ACTIVE_GATES_BY_PHASE.
  sprint.phase = 'design';
  // Both gates measured but below threshold -> passed:false.
  sprint.qualityGates.M4_apiComplianceRate = { current: 50, threshold: 95, passed: false };
  sprint.qualityGates.M8_designCompleteness = { current: 40, threshold: 85, passed: false };
  const res = await lifecycle.advancePhase(sprint, 'do', {});
  assert.ok(res && res.reason === 'gate_fail',
    'expected gate_fail for design with both M4+M8 failing; got ' + JSON.stringify(res));
  assert.ok(typeof res.hint === 'string' && res.hint.length > 0,
    'gate_fail must include a non-empty hint; got ' + JSON.stringify(res.hint));
  assert.ok(res.hint.includes('M4'),
    'hint must name failing gate M4; got ' + res.hint);
  assert.ok(res.hint.includes('M8'),
    'hint must name failing gate M8; got ' + res.hint);
  assert.ok(res.hint.includes('/sprint measure'),
    'hint must point to /sprint measure; got ' + res.hint);
  // The first failing key is used in the --gate suggestion; it must be one of M4/M8.
  assert.ok(res.hint.includes('--gate M4') || res.hint.includes('--gate M8'),
    'hint --gate suggestion must reference a failing gate key; got ' + res.hint);
});

if (fail) {
  console.error(`FAIL: ${fail} / PASS: ${pass}`);
  failures.forEach((f) => console.error('  - ' + f.name + ': ' + f.msg));
  process.exit(1);
}
console.log(`PASS: ${pass} / FAIL: ${fail}`);

})().catch((e) => { console.error('HARNESS ERROR:', e); process.exit(2); });
