'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const domain = require(path.join(PLUGIN_ROOT, 'lib/domain/sprint'));
let pass = 0, fail = 0; const failures = [];
async function tc(name, fn) { try { await fn(); pass++; } catch (e) { fail++; failures.push({ name, msg: e.message }); } }

(async () => {

await tc('createSprint populates featureMap with completion=0 entries from features', async () => {
  const sprint = domain.createSprint({ id: 's3a', name: 'S3a', features: ['auth', 'billing'] });
  assert.ok(sprint.featureMap['auth'], 'featureMap[auth] must exist');
  assert.ok(sprint.featureMap['billing'], 'featureMap[billing] must exist');
  const e = sprint.featureMap['auth'];
  assert.strictEqual(e.completion, 0, 'completion starts at 0');
  assert.strictEqual(e.pdcaPhase, 'pm');
  assert.strictEqual(e.qa, 'pending');
  assert.strictEqual(e.matchRate, null);
});

await tc('createSprint with no features yields empty featureMap', async () => {
  const sprint = domain.createSprint({ id: 's3a2', name: 'S3a2', features: [] });
  assert.deepStrictEqual(sprint.featureMap, {});
});

await tc('DEFAULT_QUALITY_GATES includes M5_runtimeErrorRate slot (carry from Slice 2 review)', async () => {
  const sprint = domain.createSprint({ id: 's3a3', name: 'S3a3', features: ['x'] });
  assert.ok(sprint.qualityGates.M5_runtimeErrorRate, 'M5 slot must exist in default qualityGates');
  assert.strictEqual(sprint.qualityGates.M5_runtimeErrorRate.threshold, 1);
  assert.strictEqual(sprint.qualityGates.M5_runtimeErrorRate.current, null);
});

await tc('handleFeature add writes featureMap entry; remove deletes it (twin sources of truth)', async () => {
  const { handleSprintAction } = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
  const os = require('node:os'); const fs = require('node:fs');
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 's3feat-'));
  const id = 'slice3-feat';
  await handleSprintAction('init', { id, name: 'S3 Feat', features: ['auth'], projectRoot: tmpRoot }, {});
  // add billing
  const addRes = await handleSprintAction('feature', { id, action: 'add', featureName: 'billing', projectRoot: tmpRoot }, {});
  assert.strictEqual(addRes.ok, true, 'add failed: ' + JSON.stringify(addRes));
  assert.ok(addRes.sprint.featureMap['billing'], 'featureMap[billing] must exist after add');
  assert.strictEqual(addRes.sprint.featureMap['billing'].completion, 0);
  // re-add billing must NOT overwrite (idempotent) — set a fake progress value first
  addRes.sprint.featureMap['billing'].completion = 50;
  await require(path.join(PLUGIN_ROOT, 'lib/infra/sprint')).createSprintInfra({ projectRoot: tmpRoot }).stateStore.save(addRes.sprint);
  const reAdd = await handleSprintAction('feature', { id, action: 'add', featureName: 'billing', projectRoot: tmpRoot }, {});
  assert.strictEqual(reAdd.sprint.featureMap['billing'].completion, 50, 're-add must not clobber existing progress');
  // remove billing
  const remRes = await handleSprintAction('feature', { id, action: 'remove', featureName: 'billing', projectRoot: tmpRoot }, {});
  assert.strictEqual(remRes.ok, true);
  assert.ok(!remRes.sprint.featureMap['billing'], 'featureMap[billing] must be gone after remove');
  assert.ok(remRes.sprint.featureMap['auth'], 'featureMap[auth] must survive removing billing');
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

if (fail) { console.error(`FAIL: ${fail} / PASS: ${pass}`); failures.forEach(f => console.error('  - ' + f.name + ': ' + f.msg)); process.exit(1); }
console.log(`PASS: ${pass} / FAIL: ${fail}`);

})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });
