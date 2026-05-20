/**
 * v2114-defense-layer-6.test.js — L1+L2 tests for ENH-289 Defense Layer 6
 * (Sub-Sprint 2, bkit differentiation #2).
 *
 * Coverage (35+ TCs):
 *   CL — classifySeverity pure fn (8 TCs)
 *   T1 — Tier 1 audit-only (5 TCs)
 *   T2 — Tier 2 alarm (8 TCs)
 *   T3 — Tier 3 auto-rollback (8 TCs)
 *   RG — recursion + rate-limit + input validation (6 TCs)
 *
 * Run: node tests/qa/v2114-defense-layer-6.test.js
 *
 * Sprint Ref: v2114-differentiation-release (Sub-Sprint 2 Defense)
 */

'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');

const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const layer6Mod = require(path.join(PLUGIN_ROOT, 'lib/defense/layer-6-audit'));
const { createLayer6Audit, classifySeverity, isInLayer6Audit, SEVERITY_ORDER, ROLLBACK_RATE_LIMIT_MS } = layer6Mod;

let pass = 0;
let fail = 0;
let total = 0;
const failures = [];

function test(name, fn) {
  total += 1;
  try {
    fn();
    pass += 1;
  } catch (e) {
    fail += 1;
    failures.push({ name, error: e.message });
  }
}

async function testAsync(name, fn) {
  total += 1;
  try {
    await fn();
    pass += 1;
  } catch (e) {
    fail += 1;
    failures.push({ name, error: e.message });
  }
}

function mkDeps(over) {
  const recorded = [];
  const checkpoints = (over && over.checkpoints) || [{ id: 'cp-12345', feature: 'feat-x' }];
  return {
    recorded,
    audit: { writeAuditLog: async (e) => { recorded.push(e); } },
    checkpoint: {
      rollbackToCheckpoint: async (id) => ({ success: true, restored: id }),
      listCheckpoints: () => checkpoints,
    },
    warn: () => { /* silent */ },
    ...over,
  };
}

(async () => {
  // ────────────────────────────────────────────────────────────────────────
  // CL group — classifySeverity (8 TCs)
  // ────────────────────────────────────────────────────────────────────────

  test('CL-01: SEVERITY_ORDER frozen + 4 entries', () => {
    assert.ok(Object.isFrozen(SEVERITY_ORDER));
    assert.deepEqual([...SEVERITY_ORDER], ['low', 'medium', 'high', 'critical']);
  });

  test('CL-02: caller-provided severity passthrough', () => {
    assert.equal(classifySeverity({ severity: 'high' }), 'high');
    assert.equal(classifySeverity({ severity: 'critical' }), 'critical');
  });

  test('CL-03: panic in stderr → critical', () => {
    assert.equal(classifySeverity({ toolOutput: { stderr: 'kernel panic' } }), 'critical');
  });

  test('CL-04: EACCES/EPERM/ENOSPC → critical', () => {
    assert.equal(classifySeverity({ toolOutput: { stderr: 'open: EACCES' } }), 'critical');
    assert.equal(classifySeverity({ toolOutput: { stderr: 'mkdir: EPERM' } }), 'critical');
    assert.equal(classifySeverity({ toolOutput: { stderr: 'write: ENOSPC' } }), 'critical');
  });

  test('CL-05: exit_code != 0 → high', () => {
    assert.equal(classifySeverity({ toolOutput: { exit_code: 1 } }), 'high');
    assert.equal(classifySeverity({ toolOutput: { exit_code: 127 } }), 'high');
  });

  test('CL-06: destructiveOperation flag → high', () => {
    assert.equal(classifySeverity({ toolInput: { destructiveOperation: true }, toolOutput: {} }), 'high');
  });

  test('CL-07: error/warning in stdout → medium', () => {
    assert.equal(classifySeverity({ toolOutput: { stdout: 'warning: deprecated' } }), 'medium');
    assert.equal(classifySeverity({ toolOutput: { stdout: 'an error occurred' } }), 'medium');
  });

  test('CL-08: ok output → low', () => {
    assert.equal(classifySeverity({ toolOutput: { exit_code: 0, stdout: 'OK done' } }), 'low');
    assert.equal(classifySeverity(null), 'low');
    assert.equal(classifySeverity({}), 'low');
  });

  // ────────────────────────────────────────────────────────────────────────
  // T1 group — Tier 1 audit-only (5 TCs)
  // ────────────────────────────────────────────────────────────────────────

  await testAsync('T1-01: low severity emits audit_completed only', async () => {
    const d = mkDeps();
    const l6 = createLayer6Audit({ audit: d.audit, checkpoint: d.checkpoint, trustLevelProvider: () => 'L2', warn: d.warn });
    const r = await l6.auditPostHoc({ tool: 'Bash', toolOutput: { exit_code: 0 }, feature: 'feat-a' });
    assert.equal(r.severity, 'low');
    assert.equal(r.alarm, false);
    assert.equal(r.rollback, false);
    assert.deepEqual(d.recorded.map(e => e.action), ['layer_6_audit_completed']);
  });

  await testAsync('T1-02: result.ok=true on Tier 1', async () => {
    const d = mkDeps();
    const l6 = createLayer6Audit({ audit: d.audit, checkpoint: d.checkpoint, warn: d.warn });
    const r = await l6.auditPostHoc({ tool: 'Bash', toolOutput: {} });
    assert.equal(r.ok, true);
  });

  await testAsync('T1-03: audit entry includes tool + severity in details', async () => {
    const d = mkDeps();
    const l6 = createLayer6Audit({ audit: d.audit, checkpoint: d.checkpoint, warn: d.warn });
    await l6.auditPostHoc({ tool: 'Write', toolOutput: { exit_code: 0 }, phase: 'do', feature: 'feat-z' });
    const e = d.recorded[0];
    assert.equal(e.details.tool, 'Write');
    assert.equal(e.details.severity, 'low');
    assert.equal(e.details.phase, 'do');
    assert.equal(e.target, 'feat-z');
  });

  await testAsync('T1-04: missing feature defaults to "unknown" target', async () => {
    const d = mkDeps();
    const l6 = createLayer6Audit({ audit: d.audit, checkpoint: d.checkpoint, warn: d.warn });
    await l6.auditPostHoc({ tool: 'Bash', toolOutput: {} });
    assert.equal(d.recorded[0].target, 'unknown');
  });

  await testAsync('T1-05: blastRadius nullable for low/medium', async () => {
    const d = mkDeps();
    const l6 = createLayer6Audit({ audit: d.audit, checkpoint: d.checkpoint, warn: d.warn });
    await l6.auditPostHoc({ tool: 'Bash', toolOutput: {} });
    assert.equal(d.recorded[0].blastRadius, null);
  });

  // ────────────────────────────────────────────────────────────────────────
  // T2 group — Tier 2 alarm (8 TCs)
  // ────────────────────────────────────────────────────────────────────────

  await testAsync('T2-01: medium severity emits alarm', async () => {
    const d = mkDeps();
    const l6 = createLayer6Audit({ audit: d.audit, checkpoint: d.checkpoint, trustLevelProvider: () => 'L2', warn: d.warn });
    const r = await l6.auditPostHoc({ tool: 'Bash', toolOutput: { stderr: 'warning: x' }, feature: 'f1' });
    assert.equal(r.severity, 'medium');
    assert.equal(r.alarm, true);
    assert.deepEqual(d.recorded.map(e => e.action).sort(), ['layer_6_alarm_triggered', 'layer_6_audit_completed']);
  });

  await testAsync('T2-02: high severity emits alarm at all trust levels', async () => {
    for (const tl of ['L0', 'L1', 'L2', 'L3', 'L4']) {
      const d = mkDeps();
      const l6 = createLayer6Audit({ audit: d.audit, checkpoint: d.checkpoint, trustLevelProvider: () => tl, warn: d.warn });
      const r = await l6.auditPostHoc({ tool: 'Bash', toolOutput: { exit_code: 1 }, feature: `f-${tl}` });
      assert.equal(r.alarm, true, `${tl} should alarm on high severity`);
    }
  });

  await testAsync('T2-03: alarm() public API works', async () => {
    const d = mkDeps();
    const l6 = createLayer6Audit({ audit: d.audit, checkpoint: d.checkpoint, warn: d.warn });
    await l6.alarm('medium', 'manual alarm test', { feature: 'f-manual' });
    assert.equal(d.recorded.length, 1);
    assert.equal(d.recorded[0].action, 'layer_6_alarm_triggered');
    assert.equal(d.recorded[0].target, 'f-manual');
  });

  await testAsync('T2-04: alarm result=blocked', async () => {
    const d = mkDeps();
    const l6 = createLayer6Audit({ audit: d.audit, checkpoint: d.checkpoint, warn: d.warn });
    await l6.auditPostHoc({ tool: 'Bash', toolOutput: { exit_code: 1 } });
    const alarmEntry = d.recorded.find(e => e.action === 'layer_6_alarm_triggered');
    assert.equal(alarmEntry.result, 'blocked');
  });

  await testAsync('T2-05: blastRadius reflects severity', async () => {
    const d = mkDeps();
    const l6 = createLayer6Audit({ audit: d.audit, checkpoint: d.checkpoint, warn: d.warn });
    await l6.alarm('high', 'high alarm');
    assert.equal(d.recorded[0].blastRadius, 'high');
    d.recorded.length = 0;
    await l6.alarm('critical', 'crit alarm');
    assert.equal(d.recorded[0].blastRadius, 'critical');
  });

  await testAsync('T2-06: invalid severity defaults to medium in alarm', async () => {
    const d = mkDeps();
    const l6 = createLayer6Audit({ audit: d.audit, checkpoint: d.checkpoint, warn: d.warn });
    await l6.alarm('not-a-severity', 'reason');
    assert.equal(d.recorded[0].details.severity, 'medium');
  });

  await testAsync('T2-07: graceful degrade when audit.writeAuditLog throws', async () => {
    const failingAudit = { writeAuditLog: async () => { throw new Error('disk full'); } };
    const l6 = createLayer6Audit({ audit: failingAudit, checkpoint: { rollbackToCheckpoint: () => ({}) }, warn: () => {} });
    // Should not throw — graceful degradation
    const r = await l6.auditPostHoc({ tool: 'Bash', toolOutput: { exit_code: 1 } });
    assert.equal(r.ok, false);
  });

  await testAsync('T2-08: alarm reason recorded', async () => {
    const d = mkDeps();
    const l6 = createLayer6Audit({ audit: d.audit, checkpoint: d.checkpoint, warn: d.warn });
    await l6.alarm('high', 'specific test reason', {});
    assert.match(d.recorded[0].reason, /specific test reason/);
  });

  // ────────────────────────────────────────────────────────────────────────
  // T3 group — Tier 3 auto-rollback (8 TCs)
  // ────────────────────────────────────────────────────────────────────────

  await testAsync('T3-01: critical at L4 → auto-rollback fires', async () => {
    const d = mkDeps();
    const l6 = createLayer6Audit({ audit: d.audit, checkpoint: d.checkpoint, trustLevelProvider: () => 'L4', warn: d.warn });
    const r = await l6.auditPostHoc({ tool: 'Bash', toolOutput: { stderr: 'panic' }, feature: 'feat-1' });
    assert.equal(r.rollback, true);
    assert.equal(r.checkpointId, 'cp-12345');
    assert.ok(d.recorded.find(e => e.action === 'rollback_executed'));
  });

  await testAsync('T3-02: critical at L0/L1/L2/L3 → alarm only, no rollback (D-4)', async () => {
    for (const tl of ['L0', 'L1', 'L2', 'L3']) {
      const d = mkDeps();
      const l6 = createLayer6Audit({ audit: d.audit, checkpoint: d.checkpoint, trustLevelProvider: () => tl, warn: d.warn });
      const r = await l6.auditPostHoc({ tool: 'Bash', toolOutput: { stderr: 'panic' }, feature: `f-${tl}` });
      assert.equal(r.rollback, false, `${tl} must not auto-rollback`);
      assert.equal(d.recorded.find(e => e.action === 'rollback_executed'), undefined);
    }
  });

  await testAsync('T3-03: no checkpoint available → skip rollback + alarm', async () => {
    const d = mkDeps({ checkpoints: [] });
    const l6 = createLayer6Audit({ audit: d.audit, checkpoint: d.checkpoint, trustLevelProvider: () => 'L4', warn: d.warn });
    const r = await l6.auditPostHoc({ tool: 'Bash', toolOutput: { stderr: 'panic' }, feature: 'orphan' });
    assert.equal(r.rollback, false);
    assert.match(r.reason, /no checkpoint/);
  });

  await testAsync('T3-04: rate limit blocks 2nd rollback within 5min', async () => {
    let now = 1_000_000;
    const d = mkDeps();
    const l6 = createLayer6Audit({ audit: d.audit, checkpoint: d.checkpoint, trustLevelProvider: () => 'L4', clock: () => now, warn: d.warn });
    const r1 = await l6.auditPostHoc({ tool: 'Bash', toolOutput: { stderr: 'panic' }, feature: 'feat-rl' });
    assert.equal(r1.rollback, true);
    now += 60_000; // 1 minute later — within 5 min window
    const r2 = await l6.auditPostHoc({ tool: 'Bash', toolOutput: { stderr: 'panic' }, feature: 'feat-rl' });
    assert.equal(r2.rollback, false);
    assert.match(r2.reason, /rate-limited/);
  });

  await testAsync('T3-05: rate limit window clears after 5min', async () => {
    let now = 1_000_000;
    const d = mkDeps();
    const l6 = createLayer6Audit({ audit: d.audit, checkpoint: d.checkpoint, trustLevelProvider: () => 'L4', clock: () => now, warn: d.warn });
    await l6.auditPostHoc({ tool: 'Bash', toolOutput: { stderr: 'panic' }, feature: 'feat-w' });
    now += ROLLBACK_RATE_LIMIT_MS + 1000; // past window
    const r2 = await l6.auditPostHoc({ tool: 'Bash', toolOutput: { stderr: 'panic' }, feature: 'feat-w' });
    assert.equal(r2.rollback, true);
  });

  await testAsync('T3-06: autoRollback public API works', async () => {
    const d = mkDeps();
    const l6 = createLayer6Audit({ audit: d.audit, checkpoint: d.checkpoint, trustLevelProvider: () => 'L4', warn: d.warn });
    const r = await l6.autoRollback('cp-explicit', { feature: 'feat-direct' });
    assert.equal(r.restored, true);
    assert.equal(r.details.checkpointId, 'cp-explicit');
  });

  await testAsync('T3-07: autoRollback rejects bad checkpointId', async () => {
    const d = mkDeps();
    const l6 = createLayer6Audit({ audit: d.audit, checkpoint: d.checkpoint, warn: d.warn });
    const r1 = await l6.autoRollback(null);
    assert.equal(r1.restored, false);
    const r2 = await l6.autoRollback('');
    assert.equal(r2.restored, false);
  });

  await testAsync('T3-08: rollback failure recorded as failure', async () => {
    const failingCheckpoint = {
      rollbackToCheckpoint: async () => { throw new Error('checkpoint corrupt'); },
      listCheckpoints: () => [{ id: 'cp-bad' }],
    };
    const d = mkDeps();
    const l6 = createLayer6Audit({ audit: d.audit, checkpoint: failingCheckpoint, trustLevelProvider: () => 'L4', warn: d.warn });
    const r = await l6.auditPostHoc({ tool: 'Bash', toolOutput: { stderr: 'panic' }, feature: 'feat-bad' });
    assert.equal(r.rollback, false);
    const rb = d.recorded.find(e => e.action === 'rollback_executed');
    assert.ok(rb);
    assert.equal(rb.result, 'failure');
  });

  // ────────────────────────────────────────────────────────────────────────
  // RG group — recursion + input validation (6 TCs)
  // ────────────────────────────────────────────────────────────────────────

  await testAsync('RG-01: recursive auditPostHoc returns blocked', async () => {
    const d = mkDeps();
    let l6 = null;
    const recursiveAudit = {
      writeAuditLog: async () => { if (l6) await l6.alarm('medium', 'recursive'); },
    };
    l6 = createLayer6Audit({ audit: recursiveAudit, checkpoint: d.checkpoint, warn: () => {} });
    const r = await l6.auditPostHoc({ tool: 'Bash', toolOutput: { stderr: 'warn' } });
    // The outer call must complete; inner re-entry must be blocked
    assert.equal(r.ok, true);
    assert.equal(isInLayer6Audit(), false);
  });

  await testAsync('RG-02: isInLayer6Audit=false after completion', async () => {
    const d = mkDeps();
    const l6 = createLayer6Audit({ audit: d.audit, checkpoint: d.checkpoint, warn: d.warn });
    await l6.auditPostHoc({ tool: 'Bash', toolOutput: {} });
    assert.equal(isInLayer6Audit(), false);
  });

  await testAsync('RG-03: isInLayer6Audit=false even on graceful degrade', async () => {
    const failing = { writeAuditLog: async () => { throw new Error('disk'); } };
    const l6 = createLayer6Audit({ audit: failing, checkpoint: { rollbackToCheckpoint: () => ({}) }, warn: () => {} });
    await l6.auditPostHoc({ tool: 'Bash', toolOutput: { exit_code: 1 } });
    assert.equal(isInLayer6Audit(), false);
  });

  test('RG-04: createLayer6Audit rejects missing audit', () => {
    assert.throws(() => createLayer6Audit({}), /deps.audit.writeAuditLog must be a function/);
  });

  test('RG-05: createLayer6Audit rejects missing checkpoint', () => {
    assert.throws(
      () => createLayer6Audit({ audit: { writeAuditLog: () => {} } }),
      /deps.checkpoint.rollbackToCheckpoint must be a function/
    );
  });

  test('RG-06: API surface is frozen', () => {
    const d = mkDeps();
    const l6 = createLayer6Audit({ audit: d.audit, checkpoint: d.checkpoint });
    assert.ok(Object.isFrozen(l6));
  });

  // ────────────────────────────────────────────────────────────────────────
  // Summary
  // ────────────────────────────────────────────────────────────────────────
  // eslint-disable-next-line no-console
  console.log(`\n[v2114 L1+L2 defense-layer-6] total=${total} pass=${pass} fail=${fail}`);
  if (fail > 0) {
    // eslint-disable-next-line no-console
    console.error('FAILURES:');
    for (const f of failures) {
      // eslint-disable-next-line no-console
      console.error(`  ✗ ${f.name}: ${f.error}`);
    }
    process.exit(1);
  }
  // eslint-disable-next-line no-console
  console.log('✓ all PASS');
  process.exit(0);
})();
