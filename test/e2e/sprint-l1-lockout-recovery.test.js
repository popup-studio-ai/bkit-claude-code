#!/usr/bin/env node
/**
 * E2E Test — @pruge L1 sprint lockout recovery (v2.1.18 #100/#101/#102).
 *
 * Reproduces the full reporter scenario (@pruge dandi-village-ledger
 * `s1-foundation`) in 8 steps and asserts that F1+F2+F3 together recover
 * the sprint from L1 preview-mode lockout without state destruction.
 *
 * Scenario (Plan §3.3 + PRD TS-1 / TS-2):
 *   1. Init L1 sprint
 *   2. Phase prd → plan (auto-advance OK)
 *   3. Phase plan → design → do (manual)
 *   4. Mutation L1 → L3 via /sprint trust (F2 + #101 fix)
 *   5. Verify state mutation persisted
 *   6. Alt path: --trust L3 per-call (F3 + #102 fix)
 *   7. Verify audit sprint_trust_changed entries (>=2: mutation + idempotent)
 *   8. Process restart simulation — load sprint, verify trustLevelAtStart=L3 영속
 *
 * Plan SC: F1 + F2 + F3 통합 검증
 * Design Ref: docs/02-design/features/v2118-sprint-trust-ux-fix.design.md §5
 *
 * @module test/e2e/sprint-l1-lockout-recovery.test
 */

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// Isolated tmp project + sprint state setup
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-e2e-trust-'));
const origCwd = process.cwd();
process.chdir(tmpDir);

fs.mkdirSync(path.join(tmpDir, '.bkit', 'state', 'sprints'), { recursive: true });
fs.mkdirSync(path.join(tmpDir, '.bkit', 'audit'), { recursive: true });

const SPRINT_ID = 'e2e-l1-recovery-fixture';

// Load handler in isolated cwd
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
  console.log('E2E — @pruge L1 lockout recovery scenario (v2.1.18 #100/#101/#102)\n');

  await test('Step 1: Init L1 sprint preserves L1 trustLevelAtStart', async () => {
    const r = await handleSprintAction('init', {
      id: SPRINT_ID,
      name: 'E2E L1 Lockout Recovery',
      trust: 'L1',
      features: ['f1'],
    });
    assert.strictEqual(r.ok, true);
    const sp = JSON.parse(fs.readFileSync(
      path.join(tmpDir, '.bkit', 'state', 'sprints', `${SPRINT_ID}.json`), 'utf8'));
    assert.strictEqual(sp.autoRun.trustLevelAtStart, 'L1');
  });

  await test('Step 2: Phase prd (init default) → state preserved', async () => {
    const r = await handleSprintAction('status', { id: SPRINT_ID });
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.sprint.phase, 'prd');
  });

  await test('Step 3 (★ #101 fix): /sprint trust L1 → L3 mutation', async () => {
    const r = await handleSprintAction('trust', {
      id: SPRINT_ID,
      to: 'L3',
      reason: 'P0 ready for measurement (@pruge scenario)',
    });
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.from, 'L1');
    assert.strictEqual(r.to, 'L3');
    assert.strictEqual(r.reason, 'P0 ready for measurement (@pruge scenario)');
  });

  await test('Step 4: state mutation persisted to disk', async () => {
    const sp = JSON.parse(fs.readFileSync(
      path.join(tmpDir, '.bkit', 'state', 'sprints', `${SPRINT_ID}.json`), 'utf8'));
    assert.strictEqual(sp.autoRun.trustLevelAtStart, 'L3');
  });

  await test('Step 5 (★ #102 fix): --trust L4 per-call alias now honored', async () => {
    // Set sprint to L2 first to make the test meaningful
    await handleSprintAction('trust', { id: SPRINT_ID, to: 'L2' });
    // Now use --trust (not --trustLevel) per-call → measure path normalizes
    const r = await handleSprintAction('measure', {
      id: SPRINT_ID,
      gate: 'M3',
      trust: 'L4',  // ← #102: was silently ignored before F3 fix
    }, {
      agentTaskRunner: async () => ({ stdout: JSON.stringify({ value: 0, passed: true }) }),
    });
    assert.strictEqual(r.trustLevel, 'L4');
    // sprint state unchanged (per-call volatile)
    const sp = JSON.parse(fs.readFileSync(
      path.join(tmpDir, '.bkit', 'state', 'sprints', `${SPRINT_ID}.json`), 'utf8'));
    assert.strictEqual(sp.autoRun.trustLevelAtStart, 'L2');
  });

  await test('Step 6: audit log contains sprint_trust_changed entries', async () => {
    // Find today's audit file
    const today = new Date().toISOString().slice(0, 10);
    const auditPath = path.join(tmpDir, '.bkit', 'audit', `${today}.jsonl`);
    let content = '';
    if (fs.existsSync(auditPath)) {
      content = fs.readFileSync(auditPath, 'utf8');
    }
    // Multiple sprint_trust_changed entries expected (Step 3 mutation + Step 5 setup
    // mutation). Some installations may write to a different path; tolerate that
    // but require at least the mutation to have left an audit footprint.
    const lines = content.split('\n').filter(Boolean);
    const trustChanged = lines.filter((l) => l.includes('sprint_trust_changed'));
    assert.ok(
      trustChanged.length >= 2,
      `Expected ≥2 sprint_trust_changed entries in audit log (got ${trustChanged.length})`,
    );
  });

  await test('Step 7: actor and noop fields present in audit', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const auditPath = path.join(tmpDir, '.bkit', 'audit', `${today}.jsonl`);
    if (!fs.existsSync(auditPath)) {
      // Skip if audit path differs in this environment
      return;
    }
    const content = fs.readFileSync(auditPath, 'utf8');
    const trustEntries = content.split('\n').filter(Boolean)
      .map((l) => { try { return JSON.parse(l); } catch (_) { return null; } })
      .filter((e) => e && e.action === 'sprint_trust_changed');
    assert.ok(trustEntries.length >= 1);
    const sample = trustEntries[0];
    assert.ok(typeof sample.details.actor === 'string',
      'audit details.actor missing (CTO §E6)');
    assert.ok(typeof sample.details.noop === 'boolean',
      'audit details.noop missing (CTO §C3)');
  });

  await test('Step 8 (★ persistence after restart): cwd-bound stateStore reload', async () => {
    // Simulate process restart: clear require cache + re-require + reload sprint
    delete require.cache[require.resolve(path.join(PROJECT_ROOT, 'scripts/sprint-handler.js'))];
    const fresh = require(path.join(PROJECT_ROOT, 'scripts/sprint-handler.js'));
    const r = await fresh.handleSprintAction('status', { id: SPRINT_ID });
    assert.strictEqual(r.ok, true);
    // State should still reflect Step 5 mutation result (sprint at L2 from per-call setup)
    assert.strictEqual(r.sprint.autoRun.trustLevelAtStart, 'L2');
  });

  console.log(`\nResults: ${pass} pass / ${fail} fail`);

  // Cleanup
  process.chdir(origCwd);
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}

  if (fail > 0) {
    console.log('\nFailures:');
    for (const f of fails) console.log(`  ${f.name}: ${f.err.message}`);
    process.exit(1);
  }
  process.exit(0);
})();
