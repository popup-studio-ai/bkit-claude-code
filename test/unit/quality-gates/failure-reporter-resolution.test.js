#!/usr/bin/env node
/** L1 — resolve-gate-fail (F3-1 v2.1.19 S3, 8 TC, closes #103) */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const rgf = require(path.join(PROJECT_ROOT, 'lib/application/sprint-lifecycle/resolve-gate-fail.js'));
let passed = 0, failed = 0;
function test(name, fn) { try { fn(); passed++; console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name} — ${e.message}`); } }
async function asyncTest(name, fn) { try { await fn(); passed++; console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name} — ${e.message}`); } }

console.log('L1 F3-1 resolve-gate-fail tests');

asyncTest('TC-F3-1-G1: no lastGateFailure → noop', async () => {
  const r = await rgf.resolveOnSuccess({});
  assert.equal(r.noop, true);
  assert.equal(r.resolved, false);
});

asyncTest('TC-F3-1-G2: lastGateFailure already resolved → idempotent noop', async () => {
  const sprint = { lastGateFailure: { resolvedAt: '2026-05-21T05:00:00Z', resolvedBy: 'auto', resolutionReason: 'prior' } };
  const r = await rgf.resolveOnSuccess(sprint);
  assert.equal(r.noop, true);
  assert.equal(r.resolved, true);
});

asyncTest('TC-F3-1-G3: lastGateFailure populated → state field mutation', async () => {
  const sprint = { lastGateFailure: { phase: 'plan', toPhase: 'design', reportPath: null } };
  const r = await rgf.resolveOnSuccess(sprint, { reason: 'test reason' });
  assert.equal(r.resolved, true);
  assert.equal(r.noop, false);
  assert.ok(sprint.lastGateFailure.resolvedAt);
  assert.equal(sprint.lastGateFailure.resolvedBy, 'auto');
  assert.equal(sprint.lastGateFailure.resolutionReason, 'test reason');
});

asyncTest('TC-F3-1-G4: file header prepend on real file', async () => {
  const tmp = path.join(os.tmpdir(), `gate-fail-${Date.now()}.md`);
  fs.writeFileSync(tmp, '# Original\n\nBLOCKED content.\n');
  const sprint = { lastGateFailure: { reportPath: tmp } };
  const r = await rgf.resolveOnSuccess(sprint, { reason: 'test', projectRoot: '/' });
  assert.equal(r.prependedHeader, true);
  const content = fs.readFileSync(tmp, 'utf8');
  assert.match(content, /STATUS: RESOLVED/);
  assert.match(content, /# Original/);
  fs.unlinkSync(tmp);
});

asyncTest('TC-F3-1-G5: idempotent file prepend (no double header)', async () => {
  const tmp = path.join(os.tmpdir(), `gate-fail-idem-${Date.now()}.md`);
  fs.writeFileSync(tmp, '# Original\n');
  const sprint1 = { lastGateFailure: { reportPath: tmp } };
  await rgf.resolveOnSuccess(sprint1, { projectRoot: '/' });
  const firstContent = fs.readFileSync(tmp, 'utf8');
  const headerCount = (firstContent.match(/STATUS: RESOLVED/g) || []).length;
  assert.equal(headerCount, 1, `first call: ${headerCount} headers (expected 1)`);
  // Reset resolvedAt to force second call (simulating different sprint state)
  const sprint2 = { lastGateFailure: { reportPath: tmp } };
  await rgf.resolveOnSuccess(sprint2, { projectRoot: '/' });
  const secondContent = fs.readFileSync(tmp, 'utf8');
  const headerCount2 = (secondContent.match(/STATUS: RESOLVED/g) || []).length;
  assert.equal(headerCount2, 1, `second call: ${headerCount2} headers (expected 1 — idempotent)`);
  fs.unlinkSync(tmp);
});

asyncTest('TC-F3-1-G6: missing report file → noop on file mutation but state still updated', async () => {
  const sprint = { lastGateFailure: { reportPath: '/nonexistent/path.md' } };
  const r = await rgf.resolveOnSuccess(sprint, { projectRoot: '/' });
  assert.equal(r.resolved, true);
  assert.equal(r.prependedHeader, false);
  assert.ok(sprint.lastGateFailure.resolvedAt);
});

asyncTest('TC-F3-1-G7: resolvedBy from opts overrides default "auto"', async () => {
  const sprint = { lastGateFailure: { reportPath: null } };
  const r = await rgf.resolveOnSuccess(sprint, { resolvedBy: 'approve' });
  assert.equal(r.resolvedBy, 'approve');
});

asyncTest('TC-F3-1-G8: RESOLVED_HEADER_MARKER export verified', () => {
  assert.equal(rgf.RESOLVED_HEADER_MARKER, '> **STATUS: RESOLVED**');
});

(async () => {
  await new Promise(r => setTimeout(r, 100));
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
