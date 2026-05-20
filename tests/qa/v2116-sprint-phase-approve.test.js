/**
 * v2116-sprint-phase-approve.test.js — L1-F2 unit tests (Issue #95).
 *
 * Tests the `--approve` single-use scope-boundary escape hatch added in
 * v2.1.16. Mirror of the canonical SC-12 contract test but at the qa
 * granularity (per-AC TC mapping).
 *
 * NOTE: tests/qa/* is gitignored. SC-12 in tests/contract/v2113-sprint-contracts
 * is the tracked canonical regression source. This file is local-only.
 *
 * Master Plan: docs/01-plan/features/v2116-issue-fixes.master-plan.md §11.2
 * Issue: https://github.com/popup-studio-ai/bkit-claude-code/issues/95
 * Run:   node tests/qa/v2116-sprint-phase-approve.test.js
 */

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const adv = require(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle/advance-phase.usecase'));
const domain = require(path.join(PLUGIN_ROOT, 'lib/domain/sprint'));
const al = require(path.join(PLUGIN_ROOT, 'lib/audit/audit-logger'));

let pass = 0;
let fail = 0;
const failures = [];

async function tc(name, fn) {
  try {
    await fn();
    pass++;
  } catch (e) {
    fail++;
    failures.push({ name, message: e.message });
  }
}

function buildL2DesignSprint(id) {
  const base = domain.createSprint({
    id, name: id, trustLevelAtStart: 'L2', features: ['x'],
  });
  return domain.cloneSprint(base, {
    phase: 'design',
    autoRun: { ...base.autoRun, scope: { stopAfter: 'design', requireApproval: true } },
    qualityGates: {
      ...base.qualityGates,
      M4_apiComplianceRate:  { current: 100, threshold: 95, passed: true },
      M8_designCompleteness: { current: 100, threshold: 85, passed: true },
    },
    phaseHistory: [{ phase: 'design', enteredAt: new Date().toISOString(), exitedAt: null, durationMs: null }],
  });
}

function resetCwdDependentModules() {
  const modules = [
    'lib/core/platform', 'lib/core/index', 'lib/audit/audit-logger',
    'lib/infra/sprint/sprint-paths', 'lib/infra/sprint/sprint-state-store.adapter',
    'lib/infra/sprint/sprint-telemetry.adapter', 'lib/infra/sprint/sprint-doc-scanner.adapter',
    'lib/infra/sprint/matrix-sync.adapter', 'lib/infra/sprint/index', 'lib/infra/sprint',
    'scripts/sprint-handler',
  ];
  for (const m of modules) {
    try { delete require.cache[require.resolve(path.join(PLUGIN_ROOT, m))]; } catch (_e) { /* not loaded */ }
  }
}

(async () => {
  // ─────────────────────────────────────────────────────────────────────
  // AC1 — /sprint phase --approve at L2 scope boundary advances in one call.
  // ─────────────────────────────────────────────────────────────────────
  await tc('AC1: L2 scope boundary single-use approval via --approve', async () => {
    const sprint = buildL2DesignSprint('ac1-sprint');
    const r = await adv.advancePhase(sprint, 'do', { approve: true });
    assert.strictEqual(r.ok, true, 'must advance with --approve');
    assert.strictEqual(r.sprint.phase, 'do');
    assert(r.approvalRecord, 'must surface approvalRecord');
    assert.strictEqual(r.approvalRecord.from, 'design');
    assert.strictEqual(r.approvalRecord.to, 'do');
    assert.strictEqual(r.approvalRecord.trustLevel, 'L2');
    assert.strictEqual(r.approvalRecord.approvedBy, 'user');
  });

  // ─────────────────────────────────────────────────────────────────────
  // AC2 — --reason "<text>" recorded in audit details (optional).
  // ─────────────────────────────────────────────────────────────────────
  await tc('AC2: --reason recorded in approvalRecord (optional, null when omitted)', async () => {
    const sprint = buildL2DesignSprint('ac2-sprint');
    const rWith = await adv.advancePhase(sprint, 'do', { approve: true, reason: 'AC2 design review complete' });
    assert.strictEqual(rWith.approvalRecord.reason, 'AC2 design review complete');
    const rWithout = await adv.advancePhase(sprint, 'do', { approve: true });
    assert.strictEqual(rWithout.approvalRecord.reason, null, 'reason must be null when not provided');
    // Empty string also treated as null (consistent with audit clarity).
    const rEmpty = await adv.advancePhase(sprint, 'do', { approve: true, reason: '' });
    assert.strictEqual(rEmpty.approvalRecord.reason, null, 'empty string reason normalizes to null');
  });

  // ─────────────────────────────────────────────────────────────────────
  // AC3 — Single-use: sprint.autoRun.scope NOT mutated; next call re-checks.
  // ─────────────────────────────────────────────────────────────────────
  await tc('AC3: single-use semantic — scope unchanged, next call re-blocks', async () => {
    const sprint = buildL2DesignSprint('ac3-sprint');
    const originalScope = JSON.stringify(sprint.autoRun.scope);
    const originalTrust = sprint.autoRun.trustLevelAtStart;
    const r1 = await adv.advancePhase(sprint, 'do', { approve: true });
    // scope on returned sprint identical to input
    assert.deepStrictEqual(r1.sprint.autoRun.scope, sprint.autoRun.scope,
      'sprint.autoRun.scope must NOT mutate (single-use)');
    assert.strictEqual(r1.sprint.autoRun.trustLevelAtStart, originalTrust,
      'sprint.autoRun.trustLevelAtStart must NOT mutate');
    assert.strictEqual(JSON.stringify(sprint.autoRun.scope), originalScope,
      'input sprint object scope must remain unchanged');

    // Simulate: orchestrator advanced to "do" using approve. Now try design->qa
    // (which is illegal per transition graph) from the new state — also blocked.
    // Re-test from a fresh L2 design sprint that a subsequent advance call
    // without --approve still blocks on requires_user_approval.
    const sprintAgain = buildL2DesignSprint('ac3-sprint-again');
    const r2 = await adv.advancePhase(sprintAgain, 'do');
    assert.strictEqual(r2.ok, false);
    assert.strictEqual(r2.reason, 'requires_user_approval');
  });

  // ─────────────────────────────────────────────────────────────────────
  // AC4 — audit-logger ACTION_TYPES.scope_boundary_approved + handler writes entry.
  // ─────────────────────────────────────────────────────────────────────
  await tc('AC4: ACTION_TYPES.scope_boundary_approved present + handler writes audit entry', async () => {
    assert(al.ACTION_TYPES.includes('scope_boundary_approved'),
      'scope_boundary_approved missing from ACTION_TYPES');

    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ac4-'));
    const prevCwd = process.cwd();
    try {
      process.chdir(tmp);
      fs.mkdirSync(path.join(tmp, '.bkit', 'state', 'sprints'), { recursive: true });
      fs.mkdirSync(path.join(tmp, '.bkit', 'audit'), { recursive: true });
      const sprint = buildL2DesignSprint('ac4-sprint');
      fs.writeFileSync(path.join(tmp, '.bkit', 'state', 'sprints', 'ac4-sprint.json'),
        JSON.stringify(sprint, null, 2));
      resetCwdDependentModules();
      const handler = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
      const r = await handler.handleSprintAction('phase', {
        id: 'ac4-sprint', to: 'do', approve: true, reason: 'AC4 audit verification',
      });
      assert.strictEqual(r.ok, true);
      const today = new Date().toISOString().slice(0, 10);
      const auditFile = path.join(tmp, '.bkit', 'audit', today + '.jsonl');
      const entries = fs.readFileSync(auditFile, 'utf8')
        .split('\n').filter(Boolean).map(JSON.parse);
      const approved = entries.find((e) => e.action === 'scope_boundary_approved');
      assert(approved, 'audit log must contain scope_boundary_approved entry');
      assert.strictEqual(approved.category, 'sprint');
      assert.strictEqual(approved.actor, 'user');
      assert.strictEqual(approved.details.from, 'design');
      assert.strictEqual(approved.details.to, 'do');
      assert.strictEqual(approved.details.trustLevel, 'L2');
      assert.strictEqual(approved.details.stopAfter, 'design');
      assert.strictEqual(approved.details.approvedBy, 'user');
      assert.strictEqual(approved.details.reason, 'AC4 audit verification');
    } finally {
      process.chdir(prevCwd);
      resetCwdDependentModules();
      try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_e) { /* ignore */ }
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // AC5 — SKILL.md §10.1 phase row + help text mention --approve / --reason.
  // ─────────────────────────────────────────────────────────────────────
  await tc('AC5: SKILL.md §10.1 phase row + sprint-handler help mention --approve / --reason', async () => {
    const skillMd = fs.readFileSync(path.join(PLUGIN_ROOT, 'skills/sprint/SKILL.md'), 'utf8');
    // §10.1 phase row must mention approve + reason
    const phaseRow = skillMd.match(/\| `phase` \| `id`, `to` \| ([^|]+) \|/);
    assert(phaseRow, '§10.1 phase row not found');
    assert(phaseRow[1].includes('approve'), '§10.1 phase row must mention approve');
    assert(phaseRow[1].includes('reason'), '§10.1 phase row must mention reason');
    // §10.1.1 dedicated section
    assert(skillMd.includes('### 10.1.1 `phase --approve` semantics'),
      'SKILL.md must include §10.1.1 phase --approve semantics section');
    assert(skillMd.includes('Single-use'), '§10.1.1 must explain single-use semantic');
    assert(skillMd.includes('scope_boundary_approved'), '§10.1.1 must reference audit action');
    // Help text in sprint-handler.js
    resetCwdDependentModules();
    const handler = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
    const r = await handler.handleSprintAction('help', {});
    assert.strictEqual(r.ok, true);
    assert(r.helpText.includes('--approve'), 'help text must mention --approve');
    assert(r.helpText.includes('--reason'), 'help text must mention --reason');
    assert(r.helpText.includes('#95'), 'help text should reference Issue #95');
  });

  // ─────────────────────────────────────────────────────────────────────
  // AC6 — Without --approve, legacy L2 deadlock behavior preserved (no regression).
  // ─────────────────────────────────────────────────────────────────────
  await tc('AC6: --approve omitted preserves legacy deadlock (no regression)', async () => {
    const sprint = buildL2DesignSprint('ac6-sprint');
    const r = await adv.advancePhase(sprint, 'do');
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.reason, 'requires_user_approval');
    assert.strictEqual(r.stopAfter, 'design');
    // hint is a v2.1.16 evolution — present but does NOT change the
    // legacy result shape's ok/reason/stopAfter.
    assert.strictEqual(typeof r.hint, 'string');
    // approve: false is also treated as no-approve.
    const rFalse = await adv.advancePhase(sprint, 'do', { approve: false });
    assert.strictEqual(rFalse.ok, false);
    assert.strictEqual(rFalse.reason, 'requires_user_approval');
  });

  // ─────────────────────────────────────────────────────────────────────
  // Bonus TC — approvalRecord is null when no scope boundary is crossed
  // (e.g., L4 sprint advancing within scope). Prevents needless audit noise.
  // ─────────────────────────────────────────────────────────────────────
  await tc('TC-BONUS: --approve with no boundary blocking → approvalRecord null', async () => {
    const base = buildL2DesignSprint('bonus-sprint');
    const sprintL4 = domain.cloneSprint(base, {
      autoRun: { ...base.autoRun, scope: { stopAfter: 'archived', requireApproval: false } },
    });
    const r = await adv.advancePhase(sprintL4, 'do', { approve: true });
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.sprint.phase, 'do');
    assert.strictEqual(r.approvalRecord, null,
      'approvalRecord must be null when --approve does not bypass any boundary');
  });

  console.log('[v2116-sprint-phase-approve] ' + pass + '/' + (pass + fail) + ' PASS, ' + fail + ' FAIL');
  if (fail > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log('  - ' + f.name + ': ' + f.message);
    process.exit(1);
  }
})().catch((e) => { console.error(e); process.exit(1); });
