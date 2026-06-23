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

if (fail) { console.error(`FAIL: ${fail} / PASS: ${pass}`); failures.forEach(f => console.error('  - ' + f.name + ': ' + f.msg)); process.exit(1); }
console.log(`PASS: ${pass} / FAIL: ${fail}`);

})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });
