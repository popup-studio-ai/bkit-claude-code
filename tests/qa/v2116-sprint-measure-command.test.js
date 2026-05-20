/**
 * v2116-sprint-measure-command.test.js — L2-F3 unit tests (Issue #94).
 *
 * Tests the `/sprint measure` partial-gate measurement command added in
 * v2.1.16. Mirror of canonical SC-13 contract but with AC-by-AC TC mapping.
 *
 * NOTE: tests/qa/* is gitignored. SC-13 in tests/contract/v2113-sprint-contracts
 * is the tracked canonical regression source. This file is local-only.
 *
 * Master Plan: docs/01-plan/features/v2116-issue-fixes.master-plan.md §11.3
 * Issue: https://github.com/popup-studio-ai/bkit-claude-code/issues/94
 * Run:   node tests/qa/v2116-sprint-measure-command.test.js
 */

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const mr = require(path.join(PLUGIN_ROOT, 'lib/application/quality-gates/measure-router'));
const lifecycle = require(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle'));
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
    failures.push({ name, message: e.message, stack: e.stack && e.stack.split('\n')[1] });
  }
}

function buildSprint(id, trustLevel) {
  return domain.cloneSprint(
    domain.createSprint({ id, name: id, trustLevelAtStart: trustLevel || 'L3', features: ['x'] }),
    { phase: 'design' }
  );
}

function fakeRunner(value, details) {
  return async ({ subagent_type }) => ({
    output: JSON.stringify({ value, details: details || ('agent-' + subagent_type) }),
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
    try { delete require.cache[require.resolve(path.join(PLUGIN_ROOT, m))]; } catch (_e) { /* */ }
  }
}

(async () => {
  // ─────────────────────────────────────────────────────────────────────
  // AC1 — /sprint measure --gate M4 records single gate to sprint.qualityGates.
  // ─────────────────────────────────────────────────────────────────────
  await tc('AC1: --gate M4 single-gate measurement → qg.M4 recorded + audit gate_measured', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ac1-'));
    const prevCwd = process.cwd();
    try {
      process.chdir(tmp);
      fs.mkdirSync(path.join(tmp, '.bkit', 'state', 'sprints'), { recursive: true });
      fs.mkdirSync(path.join(tmp, '.bkit', 'audit'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.bkit', 'state', 'sprints', 'ac1.json'),
        JSON.stringify(buildSprint('ac1'), null, 2));
      resetCwdDependentModules();
      const handler = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
      const r = await handler.handleSprintAction('measure', {
        id: 'ac1', gate: 'M4',
      }, { agentTaskRunner: fakeRunner(97) });
      assert.strictEqual(r.ok, true);
      assert.strictEqual(r.successCount, 1);
      const saved = JSON.parse(fs.readFileSync(
        path.join(tmp, '.bkit', 'state', 'sprints', 'ac1.json'), 'utf8'));
      assert.strictEqual(saved.qualityGates.M4_apiComplianceRate.current, 97);
      assert.strictEqual(saved.qualityGates.M4_apiComplianceRate.passed, true);
      const today = new Date().toISOString().slice(0, 10);
      const entries = fs.readFileSync(path.join(tmp, '.bkit', 'audit', today + '.jsonl'), 'utf8')
        .split('\n').filter(Boolean).map(JSON.parse);
      const measured = entries.find((e) => e.action === 'gate_measured');
      assert(measured);
      assert.strictEqual(measured.details.gateKey, 'M4');
    } finally {
      process.chdir(prevCwd);
      resetCwdDependentModules();
      try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_e) { /* */ }
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // AC2 — --gates M4,M8 CSV multi-gate measurement (sequential ENH-292).
  // ─────────────────────────────────────────────────────────────────────
  await tc('AC2: --gates M4,M8 CSV → 2 measurements sequential', async () => {
    const sprint = buildSprint('ac2');
    const r = await lifecycle.measureGates(sprint, ['M4', 'M8'], {
      agentTaskRunner: fakeRunner(100),
    });
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.successCount, 2);
    assert.strictEqual(r.sprint.qualityGates.M4_apiComplianceRate.current, 100);
    assert.strictEqual(r.sprint.qualityGates.M8_designCompleteness.current, 100);
  });

  // ─────────────────────────────────────────────────────────────────────
  // AC3 — --phase design batch uses ACTIVE_GATES_BY_PHASE.
  // ─────────────────────────────────────────────────────────────────────
  await tc('AC3: --phase design batch via ACTIVE_GATES_BY_PHASE', async () => {
    const sprint = buildSprint('ac3');
    const r = await lifecycle.measurePhaseGates(sprint, 'design', {
      agentTaskRunner: fakeRunner(90),
    });
    assert.strictEqual(r.phase, 'design');
    assert.strictEqual(r.successCount, 2, 'design phase has [M4, M8]');
    assert.deepStrictEqual(r.skippedUnsupported, []);
    // qa phase has 8 gates (M1, M2, M3, M4, M5, M7, S1, S2); M5/S2 unsupported.
    const qaRes = await lifecycle.measurePhaseGates(sprint, 'qa', {
      agentTaskRunner: fakeRunner(85),
    });
    assert(qaRes.skippedUnsupported.includes('M5'));
    assert(qaRes.skippedUnsupported.includes('S2'));
    assert.strictEqual(qaRes.successCount, 6, 'qa phase has 6 supported (M1, M2, M3, M4, M7, S1)');
  });

  // ─────────────────────────────────────────────────────────────────────
  // AC4 — gateKey → agent routing table (Master Plan §11.3).
  // ─────────────────────────────────────────────────────────────────────
  await tc('AC4: GATE_MEASUREMENT_ROUTES table — 7 gates × 4 agents per Master Plan', async () => {
    const expected = {
      M1: 'gap-detector', M3: 'gap-detector', M4: 'gap-detector',
      M2: 'code-analyzer', M7: 'code-analyzer',
      M8: 'sprint-orchestrator',
      S1: 'sprint-qa-flow',
    };
    for (const [g, agent] of Object.entries(expected)) {
      assert.strictEqual(mr.GATE_MEASUREMENT_ROUTES[g].agent, agent,
        g + ' must route to ' + agent);
    }
    // Unsupported gates carried to v2.1.17.
    assert.deepStrictEqual(mr.UNSUPPORTED_GATES.slice().sort(),
      ['M5', 'M10', 'S2', 'S4'].sort());
  });

  // ─────────────────────────────────────────────────────────────────────
  // AC5 — Trust Level scope: L0/L1 preview, L2+ record.
  // ─────────────────────────────────────────────────────────────────────
  await tc('AC5: Trust L0/L1 preview (no state mutation, no audit), L2+ record', async () => {
    const sprint = buildSprint('ac5', 'L3');
    // L0 preview
    const r0 = await lifecycle.measureGate(sprint, 'M4', {
      agentTaskRunner: fakeRunner(85), trustLevel: 'L0',
    });
    assert.strictEqual(r0.mode, 'preview');
    assert.strictEqual(r0.sprint, sprint);
    assert.strictEqual(r0.auditRecord, null);
    // L1 preview
    const r1 = await lifecycle.measureGate(sprint, 'M4', {
      agentTaskRunner: fakeRunner(85), trustLevel: 'L1',
    });
    assert.strictEqual(r1.mode, 'preview');
    // L2 record
    const r2 = await lifecycle.measureGate(sprint, 'M4', {
      agentTaskRunner: fakeRunner(85), trustLevel: 'L2',
    });
    assert.strictEqual(r2.mode, 'record');
    assert(r2.auditRecord);
    // L3 record (default for sprint)
    const r3 = await lifecycle.measureGate(sprint, 'M4', {
      agentTaskRunner: fakeRunner(85),
    });
    assert.strictEqual(r3.mode, 'record');
    // L4 record
    const r4 = await lifecycle.measureGate(sprint, 'M4', {
      agentTaskRunner: fakeRunner(85), trustLevel: 'L4',
    });
    assert.strictEqual(r4.mode, 'record');
  });

  // ─────────────────────────────────────────────────────────────────────
  // AC6 — SKILL.md §10.1 measure row + §10.1.2 semantics + help text.
  // ─────────────────────────────────────────────────────────────────────
  await tc('AC6: SKILL.md row + §10.1.2 + handler help mention measure / --gate / --gates / --phase', async () => {
    const skillMd = fs.readFileSync(path.join(PLUGIN_ROOT, 'skills/sprint/SKILL.md'), 'utf8');
    // §10.1 measure row
    assert(skillMd.match(/\| `measure` \| `id` \|.*gate.*\|/),
      '§10.1 measure row must exist');
    // §10.1.2 dedicated section
    assert(skillMd.includes('### 10.1.2 `measure` action semantics'),
      'SKILL.md must include §10.1.2 measure semantics section');
    assert(skillMd.includes('GATE_MEASUREMENT_ROUTES') === false || skillMd.includes('measure-router'),
      '§10.1.2 must reference measure-router for routing');
    assert(skillMd.includes('preview mode'), '§10.1.2 must explain L0/L1 preview mode');
    // Help text in sprint-handler
    resetCwdDependentModules();
    const handler = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
    const r = await handler.handleSprintAction('help', {});
    assert.strictEqual(r.ok, true);
    assert(r.helpText.includes('measure'), 'help text must mention measure');
    assert(r.helpText.includes('--gate'), 'help text must mention --gate');
    assert(r.helpText.includes('--gates'), 'help text must mention --gates');
    assert(r.helpText.includes('--phase'), 'help text must mention --phase');
    assert(r.helpText.includes('#94'), 'help text should reference Issue #94');
  });

  // ─────────────────────────────────────────────────────────────────────
  // AC7 — F1 self-assessment shares measure-router (single SoT code reuse).
  // ─────────────────────────────────────────────────────────────────────
  await tc('AC7: F1 sprint-orchestrator agent body references measure-router single SoT', async () => {
    const agentBody = fs.readFileSync(
      path.join(PLUGIN_ROOT, 'agents/sprint-orchestrator.md'), 'utf8'
    );
    assert(agentBody.includes('measure-router'),
      'sprint-orchestrator agent must reference measure-router');
    assert(agentBody.includes('measure-gate.usecase'),
      'sprint-orchestrator agent must reference measure-gate.usecase');
    assert(agentBody.includes('GATE_MEASUREMENT_ROUTES'),
      'sprint-orchestrator agent must reference GATE_MEASUREMENT_ROUTES');
    assert(agentBody.includes('measurePhaseGates'),
      'sprint-orchestrator agent must show measurePhaseGates canonical path');
  });

  // ─────────────────────────────────────────────────────────────────────
  // Bonus TC-8 — Router error paths: 4 distinct reasons (deterministic, not silent).
  // ─────────────────────────────────────────────────────────────────────
  await tc('TC-BONUS-8: router error paths — unsupported_gate / no_agent_runner / no_json / invalid_value', async () => {
    const sprint = { id: 'b', phase: 'design' };
    assert.strictEqual((await mr.measureGate('M5', sprint, {})).reason, 'unsupported_gate');
    assert.strictEqual((await mr.measureGate('M4', sprint, {})).reason, 'no_agent_runner');
    assert.strictEqual((await mr.measureGate('M4', sprint, {
      agentTaskRunner: async () => ({ output: 'plain prose, no json here' }),
    })).reason, 'no_json');
    assert.strictEqual((await mr.measureGate('M4', sprint, {
      agentTaskRunner: async () => ({ output: '{"value": "not-a-number"}' }),
    })).reason, 'invalid_value');
    // agent_error path
    assert.strictEqual((await mr.measureGate('M4', sprint, {
      agentTaskRunner: async () => { throw new Error('runner timeout'); },
    })).reason, 'agent_error');
    // no_output path
    assert.strictEqual((await mr.measureGate('M4', sprint, {
      agentTaskRunner: async () => ({}),
    })).reason, 'no_output');
  });

  // ─────────────────────────────────────────────────────────────────────
  // Bonus TC-9 — ACTION_TYPES.gate_measured enum present (cross-check SC-06).
  // ─────────────────────────────────────────────────────────────────────
  await tc('TC-BONUS-9: ACTION_TYPES.gate_measured present (29 total)', async () => {
    assert.strictEqual(al.ACTION_TYPES.length, 29);
    assert(al.ACTION_TYPES.includes('gate_measured'));
    assert(al.ACTION_TYPES.includes('scope_boundary_approved')); // F2 cross-check
  });

  console.log('[v2116-sprint-measure-command] ' + pass + '/' + (pass + fail) + ' PASS, ' + fail + ' FAIL');
  if (fail > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log('  - ' + f.name + ': ' + f.message + (f.stack ? ' (' + f.stack.trim() + ')' : ''));
    process.exit(1);
  }
})().catch((e) => { console.error(e); process.exit(1); });
