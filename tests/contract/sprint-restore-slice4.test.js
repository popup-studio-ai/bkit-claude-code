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

if (fail) { console.error(`FAIL: ${fail} / PASS: ${pass}`); failures.forEach(f => console.error('  - ' + f.name + ': ' + f.msg)); process.exit(1); }
console.log(`PASS: ${pass} / FAIL: ${fail}`);

})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });
