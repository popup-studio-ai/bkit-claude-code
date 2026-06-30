/**
 * v2113-sprint-2-application.test.js — Sprint 2 Application Core L2 integration tests.
 *
 * Covers 9 module groups (79 TCs target per Design §13):
 *   G  — quality-gates.js
 *   A  — auto-pause.js
 *   V  — verify-data-flow.usecase.js
 *   I  — iterate-sprint.usecase.js
 *   P  — advance-phase.usecase.js
 *   R  — generate-report.usecase.js
 *   AR — archive-sprint.usecase.js
 *   S  — start-sprint.usecase.js (E2E)
 *   INT— Integration / cross-module
 *
 * Pattern matches Sprint 1 test runner (node:assert + pass/fail counter).
 * Sync TCs use test(), async TCs use testAsync().
 *
 * Run: node tests/qa/v2113-sprint-2-application.test.js
 */

'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const lifecycle = require(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle'));
const domain = require(path.join(PLUGIN_ROOT, 'lib/domain/sprint'));

const {
  SPRINT_PHASES,
  ACTIVE_GATES_BY_PHASE,
  GATE_DEFINITIONS,
  AUTO_PAUSE_TRIGGERS,
  SEVEN_LAYER_HOPS,
  SPRINT_AUTORUN_SCOPE,
  evaluateGate,
  evaluatePhase,
  checkAutoPauseTriggers,
  pauseSprint,
  resumeSprint,
  verifyDataFlow,
  iterateSprint,
  advancePhase,
  generateReport,
  archiveSprint,
  startSprint,
  computeNextPhase,
} = lifecycle;

const { createSprint, cloneSprint } = domain;

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

function baseSprint(over) {
  const base = createSprint({
    id: 'test-sprint',
    name: 'Test Sprint',
    phase: 'do',
    context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' },
    features: ['feat-a', 'feat-b'],
  });
  return cloneSprint(base, over || {});
}

(async () => {
  // ─────────────────────────────────────────────────────────────────────────
  // GROUP G — quality-gates.js (12 TCs)
  // ─────────────────────────────────────────────────────────────────────────

  test('G-01: ACTIVE_GATES_BY_PHASE 8 keys', () => {
    const keys = Object.keys(ACTIVE_GATES_BY_PHASE);
    assert.deepEqual(keys.sort(), ['archived', 'design', 'do', 'iterate', 'plan', 'prd', 'qa', 'report']);
  });

  test('G-02: ACTIVE_GATES_BY_PHASE.qa matrix', () => {
    assert.deepEqual([...ACTIVE_GATES_BY_PHASE.qa], ['M1', 'M2', 'M3', 'M4', 'M5', 'M7', 'S1', 'S2']);
  });

  test('G-03: ACTIVE_GATES_BY_PHASE frozen', () => {
    assert.ok(Object.isFrozen(ACTIVE_GATES_BY_PHASE));
    assert.ok(Object.isFrozen(ACTIVE_GATES_BY_PHASE.qa));
    const before = ACTIVE_GATES_BY_PHASE.qa.length;
    try { ACTIVE_GATES_BY_PHASE.qa.push('XYZ'); } catch (_e) { /* silent fail OK */ }
    assert.equal(ACTIVE_GATES_BY_PHASE.qa.length, before);
  });

  test('G-04: evaluateGate M1 matchRate 100 passed', () => {
    const s = cloneSprint(baseSprint(), {
      qualityGates: {
        ...baseSprint().qualityGates,
        M1_matchRate: { current: 100, threshold: 90, passed: true },
      },
    });
    const r = evaluateGate(s, 'M1');
    assert.equal(r.passed, true);
    assert.equal(r.current, 100);
  });

  test('G-05: evaluateGate M3 critical 1 not passed', () => {
    const s = cloneSprint(baseSprint(), {
      qualityGates: {
        ...baseSprint().qualityGates,
        M3_criticalIssueCount: { current: 1, threshold: 0, passed: false },
      },
    });
    const r = evaluateGate(s, 'M3');
    assert.equal(r.passed, false);
  });

  test('G-06: evaluateGate S4 archiveReadiness true', () => {
    const s = cloneSprint(baseSprint(), {
      qualityGates: {
        ...baseSprint().qualityGates,
        S4_archiveReadiness: { current: true, threshold: true, passed: true },
      },
    });
    const r = evaluateGate(s, 'S4');
    assert.equal(r.passed, true);
  });

  test('G-07: evaluateGate unknown_gate', () => {
    const r = evaluateGate(baseSprint(), 'M99');
    assert.equal(r.passed, false);
    assert.equal(r.reason, 'unknown_gate');
  });

  test('G-08: evaluateGate not_measured null current', () => {
    const s = cloneSprint(baseSprint(), {
      qualityGates: { ...baseSprint().qualityGates, M2_codeQualityScore: { current: null, threshold: 80, passed: null } },
    });
    const r = evaluateGate(s, 'M2');
    assert.equal(r.passed, false);
    assert.equal(r.reason, 'not_measured');
  });

  test('G-09: evaluatePhase qa allPassed true', () => {
    const s = cloneSprint(baseSprint(), {
      qualityGates: {
        ...baseSprint().qualityGates,
        M1_matchRate: { current: 100, threshold: 90, passed: true },
        M2_codeQualityScore: { current: 95, threshold: 80, passed: true },
        M3_criticalIssueCount: { current: 0, threshold: 0, passed: true },
        M4_apiComplianceRate: { current: 100, threshold: 95, passed: true },
        M5_runtimeErrorRate: { current: 0, threshold: 1, passed: true },
        M7_conventionCompliance: { current: 100, threshold: 90, passed: true },
        S1_dataFlowIntegrity: { current: 100, threshold: 100, passed: true },
        S2_featureCompletion: { current: 100, threshold: 100, passed: true },
      },
    });
    const r = evaluatePhase(s, 'qa');
    assert.equal(r.allPassed, true);
  });

  test('G-10: evaluatePhase qa allPassed false when M3 fails', () => {
    const s = cloneSprint(baseSprint(), {
      qualityGates: {
        ...baseSprint().qualityGates,
        M1_matchRate: { current: 100, threshold: 90, passed: true },
        M3_criticalIssueCount: { current: 1, threshold: 0, passed: false },
      },
    });
    const r = evaluatePhase(s, 'qa');
    assert.equal(r.allPassed, false);
    assert.equal(r.results.M3.passed, false);
  });

  test('G-11: evaluatePhase prd allPassed true (empty gates)', () => {
    const r = evaluatePhase(baseSprint(), 'prd');
    assert.equal(r.allPassed, true);
    assert.deepEqual(r.results, {});
  });

  test('G-12: GATE_DEFINITIONS 11 keys frozen', () => {
    assert.ok(Object.isFrozen(GATE_DEFINITIONS));
    const keys = Object.keys(GATE_DEFINITIONS);
    assert.equal(keys.length, 11);
    assert.ok(Object.isFrozen(GATE_DEFINITIONS.M1));
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP A — auto-pause.js (14 TCs)
  // ─────────────────────────────────────────────────────────────────────────

  test('A-01: AUTO_PAUSE_TRIGGERS 4 keys', () => {
    assert.deepEqual(
      Object.keys(AUTO_PAUSE_TRIGGERS).sort(),
      ['BUDGET_EXCEEDED', 'ITERATION_EXHAUSTED', 'PHASE_TIMEOUT', 'QUALITY_GATE_FAIL'],
    );
  });

  test('A-02: AUTO_PAUSE_TRIGGERS frozen', () => {
    assert.ok(Object.isFrozen(AUTO_PAUSE_TRIGGERS));
    assert.ok(Object.isFrozen(AUTO_PAUSE_TRIGGERS.QUALITY_GATE_FAIL));
  });

  test('A-03: QUALITY_GATE_FAIL fires when M3>0', () => {
    const s = cloneSprint(baseSprint(), {
      qualityGates: { ...baseSprint().qualityGates, M3_criticalIssueCount: { current: 2, threshold: 0, passed: false } },
    });
    const hits = checkAutoPauseTriggers(s);
    assert.ok(hits.find(h => h.triggerId === 'QUALITY_GATE_FAIL'));
  });

  test('A-04: QUALITY_GATE_FAIL fires when S1<100', () => {
    const s = cloneSprint(baseSprint(), {
      qualityGates: { ...baseSprint().qualityGates, S1_dataFlowIntegrity: { current: 85, threshold: 100, passed: false } },
    });
    const hits = checkAutoPauseTriggers(s);
    assert.ok(hits.find(h => h.triggerId === 'QUALITY_GATE_FAIL'));
  });

  test('A-05: ITERATION_EXHAUSTED fires when iter>=5 AND matchRate<90', () => {
    const s = cloneSprint(baseSprint(), {
      iterateHistory: [1, 2, 3, 4, 5].map(i => ({ iteration: i, matchRate: 80, fixedTaskIds: [], durationMs: 100 })),
      kpi: { ...baseSprint().kpi, matchRate: 85 },
    });
    const hits = checkAutoPauseTriggers(s);
    assert.ok(hits.find(h => h.triggerId === 'ITERATION_EXHAUSTED'));
  });

  test('A-06: ITERATION_EXHAUSTED does NOT fire when iter<5', () => {
    const s = cloneSprint(baseSprint(), {
      iterateHistory: [1, 2, 3].map(i => ({ iteration: i, matchRate: 80, fixedTaskIds: [], durationMs: 100 })),
      kpi: { ...baseSprint().kpi, matchRate: 85 },
    });
    const hits = checkAutoPauseTriggers(s);
    assert.equal(hits.filter(h => h.triggerId === 'ITERATION_EXHAUSTED').length, 0);
  });

  test('A-07: BUDGET_EXCEEDED fires when cumulativeTokens > budget', () => {
    const s = cloneSprint(baseSprint(), {
      kpi: { ...baseSprint().kpi, cumulativeTokens: 2_000_000 },
      config: { ...baseSprint().config, budget: 1_000_000 },
    });
    const hits = checkAutoPauseTriggers(s);
    assert.ok(hits.find(h => h.triggerId === 'BUDGET_EXCEEDED'));
  });

  test('A-08: PHASE_TIMEOUT fires when elapsed > timeout', () => {
    const s = cloneSprint(baseSprint(), {
      phaseHistory: [{ phase: 'do', enteredAt: '2026-05-12T00:00:00.000Z', exitedAt: null, durationMs: null }],
      config: { ...baseSprint().config, phaseTimeoutHours: 4 },
    });
    const env = { now: new Date('2026-05-12T05:00:00.000Z').getTime() };
    const hits = checkAutoPauseTriggers(s, env);
    assert.ok(hits.find(h => h.triggerId === 'PHASE_TIMEOUT'));
  });

  test('A-09: PHASE_TIMEOUT does NOT fire when phaseHistory empty', () => {
    const s = cloneSprint(baseSprint(), { phaseHistory: [] });
    const hits = checkAutoPauseTriggers(s);
    assert.equal(hits.filter(h => h.triggerId === 'PHASE_TIMEOUT').length, 0);
  });

  test('A-10: checkAutoPauseTriggers healthy → []', () => {
    const s = baseSprint();
    const hits = checkAutoPauseTriggers(s);
    assert.equal(hits.length, 0);
  });

  test('A-11: armed filter — disarmed trigger does NOT fire', () => {
    const s = cloneSprint(baseSprint(), {
      autoPause: { armed: ['BUDGET_EXCEEDED'], lastTrigger: null, pauseHistory: [] },
      qualityGates: { ...baseSprint().qualityGates, M3_criticalIssueCount: { current: 5, threshold: 0, passed: false } },
    });
    const hits = checkAutoPauseTriggers(s);
    assert.equal(hits.filter(h => h.triggerId === 'QUALITY_GATE_FAIL').length, 0);
  });

  test('A-12: pauseSprint sets status=paused + pauseHistory append', () => {
    const s = baseSprint();
    const triggers = [{ triggerId: 'BUDGET_EXCEEDED', severity: 'MEDIUM', message: 'over', userActions: ['x'] }];
    const r = pauseSprint(s, triggers);
    assert.equal(r.ok, true);
    assert.equal(r.sprint.status, 'paused');
    assert.equal(r.sprint.autoPause.pauseHistory.length, 1);
    assert.equal(r.sprint.autoPause.lastTrigger, 'BUDGET_EXCEEDED');
  });

  test('A-13: resumeSprint blocked when trigger still firing', () => {
    let s = cloneSprint(baseSprint(), {
      kpi: { ...baseSprint().kpi, cumulativeTokens: 2_000_000 },
    });
    s = pauseSprint(s, [{ triggerId: 'BUDGET_EXCEEDED', severity: 'MEDIUM', message: 'x', userActions: [] }]).sprint;
    const r = resumeSprint(s);
    assert.equal(r.ok, false);
    assert.equal(r.blockedReason, 'trigger_not_resolved');
  });

  test('A-14: resumeSprint succeeds when trigger resolved', () => {
    let s = baseSprint();
    s = pauseSprint(s, [{ triggerId: 'BUDGET_EXCEEDED', severity: 'MEDIUM', message: 'x', userActions: [] }]).sprint;
    const r = resumeSprint(s);
    assert.equal(r.ok, true);
    assert.equal(r.sprint.status, 'active');
    assert.ok(r.resumeEvent);
    assert.equal(r.resumeEvent.type, 'SprintResumed');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP V — verify-data-flow.usecase.js (6 TCs)
  // ─────────────────────────────────────────────────────────────────────────

  test('V-01: SEVEN_LAYER_HOPS 7 entries frozen', () => {
    assert.equal(SEVEN_LAYER_HOPS.length, 7);
    assert.ok(Object.isFrozen(SEVEN_LAYER_HOPS));
    assert.ok(Object.isFrozen(SEVEN_LAYER_HOPS[0]));
    assert.equal(SEVEN_LAYER_HOPS[0].id, 'H1');
    assert.equal(SEVEN_LAYER_HOPS[6].id, 'H7');
  });

  await testAsync('V-02: all 7 hops pass → s1Score 100', async () => {
    const validator = async (_f, _h) => ({ passed: true });
    const r = await verifyDataFlow(baseSprint(), 'feat-a', { dataFlowValidator: validator });
    assert.equal(r.s1Score, 100);
    assert.equal(r.hopResults.length, 7);
  });

  await testAsync('V-03: 0/7 hops → s1Score 0', async () => {
    const validator = async () => ({ passed: false });
    const r = await verifyDataFlow(baseSprint(), 'feat-a', { dataFlowValidator: validator });
    assert.equal(r.s1Score, 0);
  });

  await testAsync('V-04: 4/7 hops → s1Score ~57.14', async () => {
    const validator = async (_f, h) => ({ passed: ['H1', 'H2', 'H3', 'H4'].includes(h) });
    const r = await verifyDataFlow(baseSprint(), 'feat-a', { dataFlowValidator: validator });
    assert.ok(Math.abs(r.s1Score - (4 / 7) * 100) < 0.01);
  });

  await testAsync('V-05: sequential dispatch — order H1..H7', async () => {
    const order = [];
    const validator = async (_f, h) => { order.push(h); return { passed: true }; };
    await verifyDataFlow(baseSprint(), 'feat-a', { dataFlowValidator: validator });
    assert.deepEqual(order, ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7']);
  });

  await testAsync('V-06: default validator returns no_validator_injected', async () => {
    const r = await verifyDataFlow(baseSprint(), 'feat-a');
    assert.equal(r.hopResults[0].passed, false);
    assert.equal(r.hopResults[0].reason, 'no_validator_injected');
    assert.equal(r.s1Score, 0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP I — iterate-sprint.usecase.js (8 TCs)
  // ─────────────────────────────────────────────────────────────────────────

  await testAsync('I-01: matchRate 100 from start → 0 iterations', async () => {
    const gapDetector = async () => ({ matchRate: 100, gaps: [] });
    const r = await iterateSprint(baseSprint(), { gapDetector });
    assert.equal(r.iterations, 0);
    assert.equal(r.finalMatchRate, 100);
  });

  await testAsync('I-02: 60→100 in 1 iter', async () => {
    let calls = 0;
    const gapDetector = async () => {
      calls += 1;
      return { matchRate: calls === 1 ? 60 : 100, gaps: ['x'] };
    };
    const autoFixer = async () => ({ fixedTaskIds: ['t1'] });
    const r = await iterateSprint(baseSprint(), { gapDetector, autoFixer });
    assert.equal(r.iterations, 1);
    assert.equal(r.finalMatchRate, 100);
    assert.equal(r.blocked, false);
  });

  await testAsync('I-03: 60→70→80→90→95→100 in 5 iter', async () => {
    const seq = [60, 70, 80, 90, 95, 100];
    let i = 0;
    const gapDetector = async () => ({ matchRate: seq[i++], gaps: [] });
    const autoFixer = async () => ({ fixedTaskIds: [] });
    const r = await iterateSprint(baseSprint(), { gapDetector, autoFixer });
    assert.equal(r.iterations, 5);
    assert.equal(r.finalMatchRate, 100);
  });

  await testAsync('I-04: stuck at 85 after 5 iter → blocked', async () => {
    const seq = [60, 65, 70, 75, 80, 85];
    let i = 0;
    const gapDetector = async () => ({ matchRate: seq[i++], gaps: [] });
    const autoFixer = async () => ({ fixedTaskIds: [] });
    const r = await iterateSprint(baseSprint(), { gapDetector, autoFixer });
    assert.equal(r.iterations, 5);
    assert.equal(r.finalMatchRate, 85);
    assert.equal(r.blocked, true);
  });

  await testAsync('I-05: gap/fix called sequentially', async () => {
    const order = [];
    const gapDetector = async () => { order.push('gap'); return { matchRate: order.length >= 4 ? 100 : 60, gaps: [] }; };
    const autoFixer = async () => { order.push('fix'); return { fixedTaskIds: [] }; };
    await iterateSprint(baseSprint(), { gapDetector, autoFixer });
    const idx = order.indexOf('gap');
    const fixIdx = order.indexOf('fix');
    assert.ok(idx < fixIdx, 'gap before first fix');
    // gap then fix then gap (sequential)
    assert.deepEqual(order.slice(0, 3), ['gap', 'fix', 'gap']);
  });

  await testAsync('I-06: iterateHistory appended with durationMs', async () => {
    let clockVal = 1000;
    const gapDetector = async () => ({ matchRate: clockVal === 1000 ? 60 : 100, gaps: [] });
    const autoFixer = async () => ({ fixedTaskIds: ['t1'] });
    const r = await iterateSprint(baseSprint(), {
      gapDetector,
      autoFixer,
      clock: () => { clockVal += 100; return clockVal; },
    });
    assert.equal(r.history.length, 1);
    assert.equal(typeof r.history[0].durationMs, 'number');
    assert.deepEqual(r.history[0].fixedTaskIds, ['t1']);
  });

  await testAsync('I-07: kpi.matchRate updated', async () => {
    const gapDetector = async () => ({ matchRate: 100, gaps: [] });
    const r = await iterateSprint(baseSprint(), { gapDetector });
    assert.equal(r.sprint.kpi.matchRate, 100);
  });

  await testAsync('I-08: qualityGates.M1_matchRate updated', async () => {
    const gapDetector = async () => ({ matchRate: 100, gaps: [] });
    const r = await iterateSprint(baseSprint(), { gapDetector });
    assert.equal(r.sprint.qualityGates.M1_matchRate.current, 100);
    assert.equal(r.sprint.qualityGates.M1_matchRate.passed, true);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP P — advance-phase.usecase.js (14 TCs)
  // ─────────────────────────────────────────────────────────────────────────

  function gatesPass(over) {
    return {
      M1_matchRate: { current: 100, threshold: 90, passed: true },
      M2_codeQualityScore: { current: 95, threshold: 80, passed: true },
      M3_criticalIssueCount: { current: 0, threshold: 0, passed: true },
      M4_apiComplianceRate: { current: 100, threshold: 95, passed: true },
      M5_runtimeErrorRate: { current: 0, threshold: 1, passed: true },
      M7_conventionCompliance: { current: 100, threshold: 90, passed: true },
      M8_designCompleteness: { current: 100, threshold: 85, passed: true },
      M10_pdcaCycleTimeHours: { current: 10, threshold: 40, passed: true },
      S1_dataFlowIntegrity: { current: 100, threshold: 100, passed: true },
      S2_featureCompletion: { current: 100, threshold: 100, passed: true },
      S4_archiveReadiness: { current: true, threshold: true, passed: true },
      ...(over || {}),
    };
  }

  await testAsync('P-01: prd → plan', async () => {
    const s = cloneSprint(baseSprint(), { phase: 'prd', qualityGates: gatesPass() });
    const r = await advancePhase(s, 'plan');
    assert.equal(r.ok, true);
    assert.equal(r.sprint.phase, 'plan');
  });

  await testAsync('P-02: plan → design', async () => {
    const s = cloneSprint(baseSprint(), { phase: 'plan', qualityGates: gatesPass() });
    const r = await advancePhase(s, 'design');
    assert.equal(r.ok, true);
  });

  await testAsync('P-03: design → do', async () => {
    const s = cloneSprint(baseSprint(), { phase: 'design', qualityGates: gatesPass() });
    const r = await advancePhase(s, 'do');
    assert.equal(r.ok, true);
  });

  await testAsync('P-04: do → iterate', async () => {
    const s = cloneSprint(baseSprint(), { phase: 'do', qualityGates: gatesPass() });
    const r = await advancePhase(s, 'iterate');
    assert.equal(r.ok, true);
  });

  await testAsync('P-05: iterate → qa (M1 100)', async () => {
    const s = cloneSprint(baseSprint(), { phase: 'iterate', qualityGates: gatesPass() });
    const r = await advancePhase(s, 'qa');
    assert.equal(r.ok, true);
  });

  await testAsync('P-06: qa → report (S1 100, M3 0)', async () => {
    const s = cloneSprint(baseSprint(), { phase: 'qa', qualityGates: gatesPass() });
    const r = await advancePhase(s, 'report');
    assert.equal(r.ok, true);
  });

  await testAsync('P-07: qa → do (fail-back allowed)', async () => {
    const s = cloneSprint(baseSprint(), { phase: 'qa', qualityGates: gatesPass() });
    const r = await advancePhase(s, 'do', { allowGateOverride: true });
    assert.equal(r.ok, true);
    assert.equal(r.sprint.phase, 'do');
  });

  await testAsync('P-08: report → archived (S4 pass)', async () => {
    const s = cloneSprint(baseSprint(), { phase: 'report', qualityGates: gatesPass() });
    const r = await advancePhase(s, 'archived');
    assert.equal(r.ok, true);
  });

  await testAsync('P-09: archived → plan fails', async () => {
    const s = cloneSprint(baseSprint(), { phase: 'archived' });
    const r = await advancePhase(s, 'plan');
    assert.equal(r.ok, false);
    assert.equal(r.reason, 'transition_not_allowed');
  });

  await testAsync('P-10: L2 scope advancing past design → requires_user_approval', async () => {
    const s = cloneSprint(baseSprint(), {
      phase: 'design',
      autoRun: { ...baseSprint().autoRun, scope: { stopAfter: 'design', requireApproval: true } },
      qualityGates: gatesPass(),
    });
    const r = await advancePhase(s, 'do');
    assert.equal(r.ok, false);
    assert.equal(r.reason, 'requires_user_approval');
    assert.equal(r.stopAfter, 'design');
  });

  await testAsync('P-11: gate fail → reason gate_fail', async () => {
    const s = cloneSprint(baseSprint(), {
      phase: 'qa',
      qualityGates: gatesPass({ M3_criticalIssueCount: { current: 5, threshold: 0, passed: false } }),
    });
    const r = await advancePhase(s, 'report');
    assert.equal(r.ok, false);
    assert.equal(r.reason, 'gate_fail');
    assert.ok(r.gateResults);
  });

  await testAsync('P-12: phaseHistory exitedAt + durationMs appended', async () => {
    const s = cloneSprint(baseSprint(), {
      phase: 'do',
      qualityGates: gatesPass(),
      phaseHistory: [{ phase: 'do', enteredAt: '2026-05-12T00:00:00.000Z', exitedAt: null, durationMs: null }],
    });
    const r = await advancePhase(s, 'iterate', {
      clock: () => '2026-05-12T01:00:00.000Z',
    });
    assert.equal(r.ok, true);
    const closed = r.sprint.phaseHistory.find(h => h.phase === 'do');
    assert.ok(closed.exitedAt);
    assert.equal(typeof closed.durationMs, 'number');
  });

  await testAsync('P-13: SprintPhaseChanged event emitted', async () => {
    const events = [];
    const s = cloneSprint(baseSprint(), { phase: 'prd', qualityGates: gatesPass() });
    await advancePhase(s, 'plan', { eventEmitter: (e) => events.push(e) });
    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'SprintPhaseChanged');
    assert.equal(events[0].payload.fromPhase, 'prd');
    assert.equal(events[0].payload.toPhase, 'plan');
  });

  await testAsync('P-14: allowGateOverride bypasses gate fail', async () => {
    const s = cloneSprint(baseSprint(), {
      phase: 'qa',
      qualityGates: gatesPass({ M3_criticalIssueCount: { current: 5, threshold: 0, passed: false } }),
    });
    const r = await advancePhase(s, 'report', { allowGateOverride: true });
    assert.equal(r.ok, true);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP R — generate-report.usecase.js (5 TCs)
  // ─────────────────────────────────────────────────────────────────────────

  await testAsync('R-01: kpiSnapshot featuresTotal/Completed', async () => {
    const s = cloneSprint(baseSprint(), {
      featureMap: {
        a: { pdcaPhase: 'archive', matchRate: 100, qa: 'pass', s1Score: 100 },
        b: { pdcaPhase: 'do', matchRate: 75, qa: 'pending', s1Score: 50 },
      },
    });
    const r = await generateReport(s);
    assert.equal(r.kpiSnapshot.featuresTotal, 2);
    assert.equal(r.kpiSnapshot.featuresCompleted, 1);
    assert.equal(r.kpiSnapshot.featureCompletionRate, 50);
  });

  await testAsync('R-02: dataFlowIntegrity avg', async () => {
    const s = cloneSprint(baseSprint(), {
      featureMap: {
        a: { pdcaPhase: 'qa', matchRate: 100, qa: 'pass', s1Score: 100 },
        b: { pdcaPhase: 'qa', matchRate: 100, qa: 'pass', s1Score: 80 },
      },
    });
    const r = await generateReport(s);
    assert.equal(r.kpiSnapshot.dataFlowIntegrity, 90);
  });

  await testAsync('R-03: carryItems for incomplete features', async () => {
    const s = cloneSprint(baseSprint(), {
      featureMap: {
        a: { pdcaPhase: 'archive', matchRate: 100, qa: 'pass', s1Score: 100 },
        b: { pdcaPhase: 'do', matchRate: 75, qa: 'pending', s1Score: 50 },
      },
    });
    const r = await generateReport(s);
    assert.equal(r.carryItems.length, 1);
    assert.equal(r.carryItems[0].featureName, 'b');
  });

  await testAsync('R-04: lessons extracted', async () => {
    const s = cloneSprint(baseSprint(), {
      iterateHistory: [{ iteration: 1, matchRate: 70, fixedTaskIds: [], durationMs: 100 }],
      autoPause: {
        armed: [...baseSprint().autoPause.armed],
        lastTrigger: 'BUDGET_EXCEEDED',
        pauseHistory: [{ pausedAt: '2026-05-12T00:00:00.000Z', trigger: 'BUDGET_EXCEEDED', severity: 'MEDIUM', message: 'x', userActions: [], siblings: [] }],
      },
    });
    const r = await generateReport(s);
    assert.ok(r.reportContent.includes('Iteration') || r.reportContent.includes('iteration'));
    assert.ok(r.kpiSnapshot);
  });

  await testAsync('R-05: deps.fileWriter called', async () => {
    let calledPath = null;
    let calledContent = null;
    const fileWriter = async (p, c) => { calledPath = p; calledContent = c; };
    const r = await generateReport(baseSprint(), { fileWriter });
    assert.equal(calledPath, 'docs/04-report/features/test-sprint.report.md');
    assert.ok(typeof calledContent === 'string' && calledContent.includes('Sprint Report'));
    assert.equal(r.reportPath, 'docs/04-report/features/test-sprint.report.md');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP AR — archive-sprint.usecase.js (4 TCs)
  // ─────────────────────────────────────────────────────────────────────────

  await testAsync('AR-01: archive from report with S4 pass', async () => {
    const s = cloneSprint(baseSprint(), {
      phase: 'report',
      qualityGates: gatesPass(),
      docs: { ...baseSprint().docs, report: '/tmp/report.md' },
    });
    const r = await archiveSprint(s);
    assert.equal(r.ok, true);
    assert.equal(r.sprint.phase, 'archived');
    assert.equal(r.sprint.status, 'archived');
  });

  await testAsync('AR-02: archive from report with S4 fail', async () => {
    const s = cloneSprint(baseSprint(), {
      phase: 'report',
      qualityGates: gatesPass({ S4_archiveReadiness: { current: false, threshold: true, passed: false } }),
    });
    const r = await archiveSprint(s);
    assert.equal(r.ok, false);
    assert.equal(r.reason, 'archive_readiness_fail');
  });

  await testAsync('AR-03: archive from do direct skips S4', async () => {
    const s = cloneSprint(baseSprint(), { phase: 'do' });
    const r = await archiveSprint(s);
    assert.equal(r.ok, true);
    assert.equal(r.sprint.phase, 'archived');
  });

  await testAsync('AR-04: SprintArchived event with kpiSnapshot', async () => {
    const events = [];
    const s = cloneSprint(baseSprint(), {
      phase: 'report',
      qualityGates: gatesPass(),
      docs: { ...baseSprint().docs, report: '/tmp/report.md' },
    });
    await archiveSprint(s, { eventEmitter: (e) => events.push(e) });
    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'SprintArchived');
    assert.ok(events[0].payload.kpiSnapshot);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP S — start-sprint.usecase.js E2E (8 TCs)
  // ─────────────────────────────────────────────────────────────────────────

  function makeAutoRunDeps() {
    // mock dependencies for full auto-run E2E
    return {
      gateEvaluator: () => ({ allPassed: true, phase: 'mock', results: {} }),
      autoPauseChecker: () => [],
      phaseHandlers: {
        iterate: async (sprint) => ({ sprint, blocked: false }),
        qa: async (sprint) => ({ sprint }),
        report: async (sprint) => ({ sprint }),
        archived: async (sprint) => ({ sprint }),
      },
    };
  }

  await testAsync('S-01: L3 sprint full PRD→Report', async () => {
    const deps = makeAutoRunDeps();
    const r = await startSprint({
      id: 'sprint-s01', name: 'L3 sprint', trustLevel: 'L3',
      context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' },
    }, deps);
    assert.equal(r.ok, true);
    assert.equal(r.finalPhase, 'report');
  });

  await testAsync('S-02: L4 sprint full → archived', async () => {
    const deps = makeAutoRunDeps();
    const r = await startSprint({
      id: 'sprint-s02', name: 'L4 sprint', trustLevel: 'L4',
      context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' },
    }, deps);
    assert.equal(r.ok, true);
    assert.equal(r.finalPhase, 'archived');
  });

  await testAsync('S-03: L0 manual short-circuit', async () => {
    const r = await startSprint({
      id: 'sprint-s03', name: 'L0 sprint', trustLevel: 'L0',
    });
    assert.equal(r.ok, true);
    assert.equal(r.finalPhase, 'prd');
    assert.equal(r.reason, 'manual_mode');
  });

  await testAsync('S-04: L2 sprint stops at design', async () => {
    const deps = makeAutoRunDeps();
    const r = await startSprint({
      id: 'sprint-s04', name: 'L2 sprint', trustLevel: 'L2',
      context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' },
    }, deps);
    assert.equal(r.ok, true);
    assert.equal(r.finalPhase, 'design');
  });

  await testAsync('S-05: ITERATION_EXHAUSTED auto-pause via handler blocked', async () => {
    let phase = 'do';
    const deps = {
      gateEvaluator: () => ({ allPassed: true, phase, results: {} }),
      autoPauseChecker: (sprint) => {
        // fire after iterate handler returns blocked
        if (sprint.phase === 'iterate' && (sprint.iterateHistory || []).length >= 5) {
          return [{ triggerId: 'ITERATION_EXHAUSTED', severity: 'HIGH', message: 'x', userActions: [] }];
        }
        return [];
      },
      phaseHandlers: {
        iterate: async (sprint) => {
          const updated = cloneSprint(sprint, {
            iterateHistory: [1, 2, 3, 4, 5].map(i => ({ iteration: i, matchRate: 80, fixedTaskIds: [], durationMs: 100 })),
            kpi: { ...sprint.kpi, matchRate: 80 },
          });
          return { sprint: updated, blocked: true };
        },
        qa: async (s) => ({ sprint: s }),
        report: async (s) => ({ sprint: s }),
        archived: async (s) => ({ sprint: s }),
      },
    };
    const r = await startSprint({
      id: 'sprint-s05', name: 'iter sprint', trustLevel: 'L3',
      context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' },
    }, deps);
    assert.equal(r.ok, false);
    assert.equal(r.pauseTrigger, 'ITERATION_EXHAUSTED');
  });

  await testAsync('S-06: BUDGET_EXCEEDED auto-pause', async () => {
    let calls = 0;
    const deps = {
      gateEvaluator: () => ({ allPassed: true, results: {} }),
      autoPauseChecker: () => {
        calls += 1;
        if (calls === 3) return [{ triggerId: 'BUDGET_EXCEEDED', severity: 'MEDIUM', message: 'x', userActions: [] }];
        return [];
      },
      phaseHandlers: {
        iterate: async (s) => ({ sprint: s, blocked: false }),
        qa: async (s) => ({ sprint: s }),
        report: async (s) => ({ sprint: s }),
        archived: async (s) => ({ sprint: s }),
      },
    };
    const r = await startSprint({
      id: 'sprint-s06', name: 'budget', trustLevel: 'L4',
      context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' },
    }, deps);
    assert.equal(r.ok, false);
    assert.equal(r.pauseTrigger, 'BUDGET_EXCEEDED');
  });

  await testAsync('S-07: Invalid input → errors', async () => {
    const r = await startSprint({ name: 'missing id', trustLevel: 'L3' });
    assert.equal(r.ok, false);
    assert.equal(r.reason, 'invalid_input');
    assert.ok(Array.isArray(r.errors) && r.errors.length > 0);
  });

  test('S-08: SPRINT_AUTORUN_SCOPE frozen 5 levels', () => {
    assert.ok(Object.isFrozen(SPRINT_AUTORUN_SCOPE));
    assert.deepEqual(Object.keys(SPRINT_AUTORUN_SCOPE).sort(), ['L0', 'L1', 'L2', 'L3', 'L4']);
    assert.ok(Object.isFrozen(SPRINT_AUTORUN_SCOPE.L3));
    assert.equal(SPRINT_AUTORUN_SCOPE.L3.stopAfter, 'report');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP INT — Integration (8 TCs)
  // ─────────────────────────────────────────────────────────────────────────

  test('INT-01: barrel require() OK + 26 exports surface', () => {
    const keys = Object.keys(lifecycle);
    assert.ok(keys.length >= 26);
  });

  test('INT-02: Sprint 1 imports across 8 use cases (grep)', () => {
    const sources = [
      'auto-pause.js',
      'verify-data-flow.usecase.js',
      'iterate-sprint.usecase.js',
      'advance-phase.usecase.js',
      'generate-report.usecase.js',
      'archive-sprint.usecase.js',
      'start-sprint.usecase.js',
    ].map(f => fs.readFileSync(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle', f), 'utf8'));
    const importsDomain = sources.filter(s => /require\(['"]\.\.\/\.\.\/domain\/sprint['"]\)/.test(s)).length;
    // quality-gates intentionally has no runtime import from Sprint 1 (typedef only)
    assert.ok(importsDomain >= 6, `Expected >=6 Sprint 1 imports across use cases, got ${importsDomain}`);
  });

  test('INT-03: PDCA lifecycle imports 0', () => {
    const dir = path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
    for (const f of files) {
      const src = fs.readFileSync(path.join(dir, f), 'utf8');
      // exclude doc references
      const requireMatches = src.match(/require\(['"][^'"]*pdca-lifecycle[^'"]*['"]\)/g);
      assert.equal(requireMatches, null, `${f} should not require pdca-lifecycle`);
    }
  });

  test('INT-04: Promise.all/race/allSettled 0 runtime usage', () => {
    const dir = path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
    for (const f of files) {
      const src = fs.readFileSync(path.join(dir, f), 'utf8');
      // strip comments
      const stripped = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      const forbidden = stripped.match(/Promise\.(all|race|allSettled)\s*\(/g);
      assert.equal(forbidden, null, `${f} uses Promise.${forbidden && forbidden[0]}`);
    }
  });

  await testAsync('INT-05: full E2E lifecycle pieces compose', async () => {
    // Create → advance → iterate (matchRate 100) → advance qa → verify hops → advance report → archive
    let s = createSprint({ id: 'int-e2e', name: 'INT', context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' } });
    s = cloneSprint(s, { phase: 'do', qualityGates: gatesPass(), phaseHistory: [{ phase: 'do', enteredAt: new Date().toISOString(), exitedAt: null, durationMs: null }] });

    // do → iterate
    let r = await advancePhase(s, 'iterate');
    assert.equal(r.ok, true);
    s = r.sprint;

    // iterate phase: run iterateSprint
    const iterRes = await iterateSprint(s, { gapDetector: async () => ({ matchRate: 100, gaps: [] }) });
    s = iterRes.sprint;
    assert.equal(s.kpi.matchRate, 100);

    // iterate → qa (gates pass — M1 now 100 from iterate)
    s = cloneSprint(s, { qualityGates: gatesPass() });
    r = await advancePhase(s, 'qa');
    assert.equal(r.ok, true);
    s = r.sprint;

    // qa: verify each feature
    const validator = async () => ({ passed: true });
    const v = await verifyDataFlow(s, 'feat-a', { dataFlowValidator: validator });
    assert.equal(v.s1Score, 100);

    // qa → report
    s = cloneSprint(s, { qualityGates: gatesPass() });
    r = await advancePhase(s, 'report');
    assert.equal(r.ok, true);
    s = r.sprint;

    // report → archived (S4 readiness needs docs.report present + all gates passing)
    s = cloneSprint(s, { qualityGates: gatesPass(), docs: { ...s.docs, report: '/tmp/report.md' } });
    const arch = await archiveSprint(s);
    assert.equal(arch.ok, true);
    assert.equal(arch.sprint.phase, 'archived');
  });

  test('INT-06: SprintEvents emission types (5)', () => {
    const types = new Set();
    // Test each emit path via simulation
    const sprint = baseSprint();
    types.add(domain.SprintEvents.SprintCreated({ sprintId: 'x', name: 'n', phase: 'prd' }).type);
    types.add(domain.SprintEvents.SprintPhaseChanged({ sprintId: 'x', fromPhase: 'a', toPhase: 'b' }).type);
    types.add(domain.SprintEvents.SprintArchived({ sprintId: 'x' }).type);
    types.add(domain.SprintEvents.SprintPaused({ sprintId: 'x', trigger: 't' }).type);
    types.add(domain.SprintEvents.SprintResumed({ sprintId: 'x', pausedAt: 'p' }).type);
    assert.equal(types.size, 5);
  });

  test('INT-07: Master Plan §12.1 ACTIVE_GATES_BY_PHASE matrix exact', () => {
    assert.deepEqual([...ACTIVE_GATES_BY_PHASE.prd], []);
    assert.deepEqual([...ACTIVE_GATES_BY_PHASE.plan], ['M8']);
    assert.deepEqual([...ACTIVE_GATES_BY_PHASE.design], ['M4', 'M8']);
    assert.deepEqual([...ACTIVE_GATES_BY_PHASE.do], ['M1', 'M2', 'M3', 'M4', 'M5', 'M7']);
    assert.deepEqual([...ACTIVE_GATES_BY_PHASE.iterate], ['M1', 'M2', 'M3', 'M5', 'M7']);
    assert.deepEqual([...ACTIVE_GATES_BY_PHASE.qa], ['M1', 'M2', 'M3', 'M4', 'M5', 'M7', 'S1', 'S2']);
    assert.deepEqual([...ACTIVE_GATES_BY_PHASE.report], ['M1', 'M2', 'M3', 'M4', 'M5', 'M7', 'M8', 'M10', 'S1', 'S2', 'S4']);
    assert.deepEqual([...ACTIVE_GATES_BY_PHASE.archived], []);
  });

  test('INT-08: computeNextPhase linear', () => {
    assert.equal(computeNextPhase('prd'), 'plan');
    assert.equal(computeNextPhase('plan'), 'design');
    assert.equal(computeNextPhase('design'), 'do');
    assert.equal(computeNextPhase('do'), 'iterate');
    assert.equal(computeNextPhase('iterate'), 'qa');
    assert.equal(computeNextPhase('qa'), 'report');
    assert.equal(computeNextPhase('report'), 'archived');
    assert.equal(computeNextPhase('archived'), null);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────

  console.log('');
  console.log(`[v2113-sprint-2-application] ${pass}/${total} PASS, ${fail} FAIL`);
  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`  - ${f.name}\n    ${f.error}`);
    }
  }
  process.exit(fail === 0 ? 0 : 1);
})();
