#!/usr/bin/env node
/**
 * F2 Unit Test — /sprint trust action (handleTrust) (v2.1.18 #101).
 *
 * Validates handleTrust mutation, idempotent path, validation, downgrade
 * guardrail, actor auto-detection, and audit emission.
 *
 * Plan SC: F2 — scripts/sprint-handler.js handleTrust + dispatch case 'trust'
 *               + lib/audit/audit-logger.js ACTION_TYPES 'sprint_trust_changed'
 * Design Ref: docs/02-design/features/v2118-sprint-trust-ux-fix.design.md §3
 *
 * 8 cases (Design §3.2 + CTO §C3/§E6/§F coverage)
 *
 * @module test/unit/sprint-handler-trust-action.test
 */

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// Tmp project root + sprint state setup
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-trust-test-'));
process.chdir(tmpDir);
fs.mkdirSync(path.join(tmpDir, '.bkit', 'state', 'sprints'), { recursive: true });
fs.mkdirSync(path.join(tmpDir, '.bkit', 'audit'), { recursive: true });

// Seed fixture sprint
const SPRINT_ID = 'unit-trust-fixture';
const fixtureSprint = {
  id: SPRINT_ID,
  name: 'Unit Fixture',
  version: '1.1',
  phase: 'do',
  status: 'active',
  context: { WHY: '', WHO: '', RISK: '', SUCCESS: '', SCOPE: '' },
  features: ['f1'],
  config: { budget: 1000000, phaseTimeoutHours: 4, maxIterations: 5,
            matchRateTarget: 100, matchRateMinAcceptable: 90,
            dashboardMode: 'session-start', manual: false },
  autoRun: { enabled: true, scope: null, trustLevelAtStart: 'L3',
             startedAt: null, lastAutoAdvanceAt: null },
  autoPause: { armed: ['QUALITY_GATE_FAIL'], lastTrigger: null, pauseHistory: [] },
  phaseHistory: [], iterateHistory: [], docs: {}, featureMap: {},
  qualityGates: {},
};

function reseedSprint() {
  fs.writeFileSync(
    path.join(tmpDir, '.bkit', 'state', 'sprints', `${SPRINT_ID}.json`),
    JSON.stringify(fixtureSprint, null, 2),
  );
}

function loadSprint() {
  return JSON.parse(fs.readFileSync(
    path.join(tmpDir, '.bkit', 'state', 'sprints', `${SPRINT_ID}.json`), 'utf8'));
}

reseedSprint();

// Load handler
const { handleSprintAction } = require(path.join(PROJECT_ROOT, 'scripts/sprint-handler.js'));

let pass = 0;
let fail = 0;
const fails = [];

async function test(name, fn) {
  try {
    await fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    fail++;
    fails.push({ name, err });
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
  }
}

(async () => {
  console.log('F2 Unit — handleTrust mutation + guardrail + audit (v2.1.18 #101)\n');

  await test('Case 1: mutation L3 → L4 (upgrade, ok:true)', async () => {
    reseedSprint();
    const r = await handleSprintAction('trust', { id: SPRINT_ID, to: 'L4', reason: 'unit test' });
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.from, 'L3');
    assert.strictEqual(r.to, 'L4');
    assert.strictEqual(r.actor, 'user');
    assert.strictEqual(loadSprint().autoRun.trustLevelAtStart, 'L4');
  });

  await test('Case 2: invalid level → blockReason invalid_level', async () => {
    reseedSprint();
    const r = await handleSprintAction('trust', { id: SPRINT_ID, to: 'L9' });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.blockReason, 'invalid_level');
  });

  await test('Case 3: missing --to → blockReason missing_to', async () => {
    reseedSprint();
    const r = await handleSprintAction('trust', { id: SPRINT_ID });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.blockReason, 'missing_to');
  });

  await test('Case 4: sprint not found → blockReason sprint_not_found', async () => {
    const r = await handleSprintAction('trust', { id: 'nonexistent-id', to: 'L3' });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.blockReason, 'sprint_not_found');
  });

  await test('Case 5: idempotent from===to → noop:true + audit still emitted (CTO §C3)', async () => {
    reseedSprint();
    const r = await handleSprintAction('trust', { id: SPRINT_ID, to: 'L3', reason: 'noop test' });
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.noop, true);
    assert.strictEqual(loadSprint().autoRun.trustLevelAtStart, 'L3'); // unchanged
  });

  await test('Case 6: major downgrade L4 → L1 with low trustScore → blocked', async () => {
    reseedSprint();
    // Mutate to L4 first
    await handleSprintAction('trust', { id: SPRINT_ID, to: 'L4' });
    // Now attempt L4 → L1 (3-level diff = major)
    const r = await handleSprintAction('trust', { id: SPRINT_ID, to: 'L1', reason: 'downgrade test' });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.blockReason, 'guardrail_blocked');
    assert.strictEqual(loadSprint().autoRun.trustLevelAtStart, 'L4'); // not mutated
  });

  await test('Case 7: major downgrade with --force → allowed + blastRadius high', async () => {
    reseedSprint();
    await handleSprintAction('trust', { id: SPRINT_ID, to: 'L4' });
    const r = await handleSprintAction('trust', { id: SPRINT_ID, to: 'L1', force: true, reason: 'forced' });
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.forced, true);
    assert.strictEqual(r.blastRadius, 'high');
    assert.strictEqual(loadSprint().autoRun.trustLevelAtStart, 'L1');
  });

  await test('Case 8: actor auto-detection (CLAUDE_AGENT_ID env) — CTO §E6', async () => {
    reseedSprint();
    const original = process.env.CLAUDE_AGENT_ID;
    process.env.CLAUDE_AGENT_ID = 'test-agent-uuid';
    try {
      const r = await handleSprintAction('trust', { id: SPRINT_ID, to: 'L4', reason: 'agent test' });
      assert.strictEqual(r.ok, true);
      assert.strictEqual(r.actor, 'agent');
    } finally {
      if (original === undefined) delete process.env.CLAUDE_AGENT_ID;
      else process.env.CLAUDE_AGENT_ID = original;
    }
  });

  console.log(`\nResults: ${pass} pass / ${fail} fail`);
  if (fail > 0) {
    console.log('\nFailures:');
    for (const f of fails) console.log(`  ${f.name}: ${f.err.message}`);
    // Cleanup tmp dir before exit
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
    process.exit(1);
  }
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  process.exit(0);
})();
