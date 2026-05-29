'use strict';
/**
 * Unit Tests for advance-phase.usecase.js phaseTransitionSummary (Issue #113 F7 — v2.1.21)
 *
 * Verifies:
 *  - SUCCESS path attaches phaseTransitionSummary via caller-injected builder
 *  - builder receives the UPDATED sprint (post-transition phase) + previousPhase
 *  - no builder injected → phaseTransitionSummary === null (DI contract)
 *  - use case purity: no `fs` import / no file write in the module source
 *
 * Pattern: console.assert based (matches existing test/unit convention).
 */

const fs = require('fs');
const path = require('path');
const { createSprint } = require('../../../lib/domain/sprint');
const { advancePhase } = require('../../../lib/application/sprint-lifecycle/advance-phase.usecase');

let passed = 0, failed = 0, total = 0;
function assert(id, condition, message) {
  total++;
  if (condition) { passed++; console.log(`  PASS: ${id} - ${message}`); }
  else { failed++; console.error(`  FAIL: ${id} - ${message}`); }
}

function freshSprint() {
  return createSprint({ id: 'f7-demo', name: 'F7 Demo', phase: 'prd', trustLevelAtStart: 'L4' });
}

// gate evaluator stub → always pass (isolate F7 from gate logic)
const passGates = () => ({ allPassed: true, phase: 'prd', results: {} });
const fixedClock = () => '2026-05-29T00:00:00.000Z';

(async () => {
  // =============== TC-F7-1: builder injected → summary attached ===============
  let receivedSprint = null, receivedOpts = null;
  const builder = (s, opts) => { receivedSprint = s; receivedOpts = opts; return { type: 'sprint-executive-summary', sprintId: s.id, phase: s.phase }; };
  const r1 = await advancePhase(freshSprint(), 'plan', {
    gateEvaluator: passGates, clock: fixedClock, transitionSummaryBuilder: builder,
  });
  assert('TC-F7-1a', r1.ok === true, 'prd → plan 전이 성공');
  assert('TC-F7-1b', r1.phaseTransitionSummary && r1.phaseTransitionSummary.type === 'sprint-executive-summary', 'phaseTransitionSummary 첨부됨');
  assert('TC-F7-1c', receivedSprint && receivedSprint.phase === 'plan', 'builder 가 UPDATED sprint(phase=plan) 수신');
  assert('TC-F7-1d', receivedOpts && receivedOpts.previousPhase === 'prd', 'builder 가 previousPhase=prd 수신');

  // =============== TC-F7-2: no builder → null (DI contract) ===============
  const r2 = await advancePhase(freshSprint(), 'plan', { gateEvaluator: passGates, clock: fixedClock });
  assert('TC-F7-2a', r2.ok === true, '전이 성공(builder 없음)');
  assert('TC-F7-2b', r2.phaseTransitionSummary === null, 'builder 미주입 시 phaseTransitionSummary === null');

  // =============== TC-F7-3: throwing builder → best-effort null, 전이 유지 ===============
  const r3 = await advancePhase(freshSprint(), 'plan', {
    gateEvaluator: passGates, clock: fixedClock,
    transitionSummaryBuilder: () => { throw new Error('builder boom'); },
  });
  assert('TC-F7-3a', r3.ok === true, 'builder throw 해도 전이는 성공(best-effort)');
  assert('TC-F7-3b', r3.phaseTransitionSummary === null, 'builder throw → phaseTransitionSummary null');

  // =============== TC-F7-4: gate_fail 경로엔 summary 없음 ===============
  const r4 = await advancePhase(freshSprint(), 'plan', {
    gateEvaluator: () => ({ allPassed: false, phase: 'prd', results: { M8: { current: 0, threshold: 85, passed: false } } }),
    clock: fixedClock, transitionSummaryBuilder: builder,
  });
  assert('TC-F7-4', r4.ok === false && r4.reason === 'gate_fail' && r4.phaseTransitionSummary === undefined,
    'gate_fail 경로엔 phaseTransitionSummary 미부여(success 전용)');

  // =============== TC-F7-5: usecase 순수성 (소스에 fs/write 없음) ===============
  const src = fs.readFileSync(path.resolve(__dirname, '../../../lib/application/sprint-lifecycle/advance-phase.usecase.js'), 'utf8');
  const hasFs = /require\(['"]fs['"]\)/.test(src);
  const hasLibSprintImport = /require\(['"][^'"]*lib\/sprint\//.test(src) || /\.\.\/\.\.\/sprint\//.test(src);
  assert('TC-F7-5a', !hasFs, 'usecase 에 fs import 없음 (pure-module invariant)');
  assert('TC-F7-5b', !hasLibSprintImport, 'usecase 가 lib/sprint 직접 import 안 함 (layer 분리 — handler 가 wiring)');

  console.log(`\n=== Results: ${passed}/${total} passed (${failed} failed) ===`);
  process.exit(failed > 0 ? 1 : 0);
})();
