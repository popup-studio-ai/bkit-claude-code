/**
 * quality-gates.js — Sprint Quality Gate evaluator (v2.1.13 Sprint 2).
 *
 * Evaluates M1-M10 + S1-S4 gates per phase against
 * Master Plan §12.1 ACTIVE_GATES_BY_PHASE matrix.
 *
 * Pure module — no I/O, no clock dependency.
 * Reads `sprint.qualityGates[gateKey].{current,threshold,passed}` shape.
 *
 * Design Ref: docs/02-design/features/v2113-sprint-2-application.design.md §3
 * Master Plan Ref: docs/01-plan/features/sprint-management.master-plan.md §12.1
 * ADR Ref: 0009 (Quality Gates per phase + Sprint S1-S4)
 *
 * @module lib/application/sprint-lifecycle/quality-gates
 * @version 2.1.13
 * @since 2.1.13
 */

/**
 * Active gates per Sprint phase. Mirrors Master Plan §12.1 matrix exactly.
 * Nested Object.freeze ensures both outer + inner immutability.
 *
 * v2.1.16 (Issue #92, F1 — measurement responsibility clarification):
 *   This module evaluates gates against `sprint.qualityGates[<field>]`; it
 *   does not measure anything itself. Each active gate's `current` value
 *   MUST be populated by the orchestrator BEFORE `advancePhase` is invoked.
 *   When `current === null`, `evaluateGate` returns
 *   `{ passed: false, reason: 'not_measured' }`, causing `advancePhase` to
 *   return `{ ok: false, reason: 'gate_fail' }` and the Sprint loop to
 *   pause on `QUALITY_GATE_FAIL` with no actionable user-facing signal —
 *   the original Issue #92 deadlock.
 *
 *   At `design` exit, BOTH `M4_apiComplianceRate` AND `M8_designCompleteness`
 *   must be recorded. The orchestrator measures them per
 *   `agents/sprint-orchestrator.md` "Phase Exit Self-Assessment" section
 *   (single source of truth for the measurement procedure). The design
 *   doc §14 self-assessment "API Contract" checkbox is the SoT input
 *   artifact for both gates at design exit.
 *
 *   The gate matrix below is INVARIANT for v2.1.16 (Master Plan §1 RISK
 *   "Quality Gate matrix target — no change"). Only the measurement
 *   responsibility is being clarified, not the gates themselves.
 *
 * Single SoT: docs/01-plan/features/v2116-issue-fixes.master-plan.md §11.1 AC1-AC5.
 */
const ACTIVE_GATES_BY_PHASE = Object.freeze({
  prd:      Object.freeze([]),
  plan:     Object.freeze(['M8']),
  design:   Object.freeze(['M4', 'M8']),
  do:       Object.freeze(['M1', 'M2', 'M3', 'M4', 'M5', 'M7']),
  iterate:  Object.freeze(['M1', 'M2', 'M3', 'M5', 'M7']),
  qa:       Object.freeze(['M1', 'M2', 'M3', 'M4', 'M5', 'M7', 'S1', 'S2']),
  report:   Object.freeze(['M1', 'M2', 'M3', 'M4', 'M5', 'M7', 'M8', 'M10', 'S1', 'S2', 'S4']),
  archived: Object.freeze([]),
});

/**
 * Gate definitions — map gateKey to qualityGates field + comparison op + default threshold.
 * Sprint 1 entity stores gates under field names like 'M1_matchRate', so the
 * `field` property points to the snake-case suffixed key.
 *
 * Measurement responsibility (v2.1.16, single SoT):
 *   M1 (matchRate)              — gap-detector vs Design §9 API Contract (do/qa exit)
 *   M2 (codeQualityScore)       — code-analyzer (lint + complexity + duplication)
 *   M3 (criticalIssueCount)     — code-analyzer (security + correctness severities)
 *   M4 (apiComplianceRate)      — sprint-orchestrator §14 "API Contract" SoT at
 *                                 design exit; gap-detector at do/qa/report exit
 *                                 (Issue #92 — see ACTIVE_GATES_BY_PHASE comment)
 *   M5 (runtimeErrorRate)       — qa-monitor live log probe
 *   M7 (conventionCompliance)   — code-analyzer (style + naming)
 *   M8 (designCompleteness)     — sprint-orchestrator §14 self-assessment checklist
 *   M10 (pdcaCycleTimeHours)    — sprint-report-writer (phaseHistory duration sum)
 *   S1 (dataFlowIntegrity)      — sprint-qa-flow 7-Layer hop traversal
 *   S2 (featureCompletion)      — generate-report (kpi.featureCompletionRate)
 *   S4 (archiveReadiness)       — archive-sprint preflight
 *
 * From v2.1.16 Layer 2 onward, M1/M4/M8 measurement may be dispatched via
 * `lib/application/quality-gates/measure-router.js` (single SoT routing for
 * both `/sprint phase` auto-advance and `/sprint measure` manual invocation).
 */
const GATE_DEFINITIONS = Object.freeze({
  M1:  Object.freeze({ field: 'M1_matchRate',            op: '>=',  defaultThreshold: 90  }),
  M2:  Object.freeze({ field: 'M2_codeQualityScore',     op: '>=',  defaultThreshold: 80  }),
  M3:  Object.freeze({ field: 'M3_criticalIssueCount',   op: '<=',  defaultThreshold: 0   }),
  M4:  Object.freeze({ field: 'M4_apiComplianceRate',    op: '>=',  defaultThreshold: 95  }),
  M5:  Object.freeze({ field: 'M5_runtimeErrorRate',     op: '<=',  defaultThreshold: 1   }),
  M7:  Object.freeze({ field: 'M7_conventionCompliance', op: '>=',  defaultThreshold: 90  }),
  M8:  Object.freeze({ field: 'M8_designCompleteness',   op: '>=',  defaultThreshold: 85  }),
  M10: Object.freeze({ field: 'M10_pdcaCycleTimeHours',  op: '<=',  defaultThreshold: 40  }),
  S1:  Object.freeze({ field: 'S1_dataFlowIntegrity',    op: '>=',  defaultThreshold: 100 }),
  S2:  Object.freeze({ field: 'S2_featureCompletion',    op: '>=',  defaultThreshold: 100 }),
  S4:  Object.freeze({ field: 'S4_archiveReadiness',     op: '===', defaultThreshold: true }),
});

/**
 * @typedef {Object} GateResult
 * @property {string} gateKey
 * @property {number|boolean|null} current
 * @property {number|boolean|null} threshold
 * @property {boolean} passed
 * @property {string} [reason]
 */

/**
 * Evaluate a single gate against sprint state.
 *
 * @param {import('../../domain/sprint/entity').Sprint} sprint
 * @param {string} gateKey
 * @returns {GateResult}
 */
function evaluateGate(sprint, gateKey) {
  const def = GATE_DEFINITIONS[gateKey];
  if (!def) {
    return { gateKey, current: null, threshold: null, passed: false, reason: 'unknown_gate' };
  }
  const gates = (sprint && sprint.qualityGates) || {};
  const slot = gates[def.field];
  if (!slot) {
    return { gateKey, current: null, threshold: def.defaultThreshold, passed: false, reason: 'gate_slot_missing' };
  }
  const current = slot.current;
  const threshold = (typeof slot.threshold !== 'undefined' && slot.threshold !== null)
    ? slot.threshold
    : def.defaultThreshold;
  if (current === null || typeof current === 'undefined') {
    return { gateKey, current: null, threshold, passed: false, reason: 'not_measured' };
  }
  let passed = false;
  switch (def.op) {
    case '>=':
      passed = (typeof current === 'number') && current >= threshold;
      break;
    case '<=':
      passed = (typeof current === 'number') && current <= threshold;
      break;
    case '===':
      passed = current === threshold;
      break;
    default:
      passed = false;
  }
  return { gateKey, current, threshold, passed };
}

/**
 * Evaluate all active gates for the given phase.
 *
 * @param {import('../../domain/sprint/entity').Sprint} sprint
 * @param {string} phase - one of SPRINT_PHASES values
 * @returns {{ allPassed: boolean, phase: string, results: Object<string, GateResult> }}
 */
function evaluatePhase(sprint, phase) {
  const active = ACTIVE_GATES_BY_PHASE[phase] || [];
  const results = {};
  let allPassed = true;
  for (const gateKey of active) {
    const r = evaluateGate(sprint, gateKey);
    results[gateKey] = r;
    if (!r.passed) allPassed = false;
  }
  return { allPassed, phase, results };
}

module.exports = {
  evaluateGate,
  evaluatePhase,
  ACTIVE_GATES_BY_PHASE,
  GATE_DEFINITIONS,
};
