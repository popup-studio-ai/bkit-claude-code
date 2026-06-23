/**
 * phases.js — Sprint phase enum + ordered sequence (v2.1.13 Sprint 1).
 *
 * Single source of truth for the 8-phase Sprint lifecycle:
 *   prd → plan → design → do → iterate → qa → report → archived
 *
 * Frozen constants — Sprint orchestration code must import from here,
 * not from string literals scattered across hooks/skills/scripts.
 *
 * PDCA-pattern parity (lib/application/pdca-lifecycle/phases.js).
 *
 * Design Ref: docs/02-design/features/v2113-sprint-1-domain.design.md §4.1
 * ADR Ref: 0008-sprint-phase-enum
 *
 * @module lib/application/sprint-lifecycle/phases
 * @version 2.1.13
 * @since 2.1.13
 */

const SPRINT_PHASES = Object.freeze({
  PRD: 'prd',
  PLAN: 'plan',
  DESIGN: 'design',
  DO: 'do',
  ITERATE: 'iterate',
  QA: 'qa',
  REPORT: 'report',
  ARCHIVED: 'archived',
});

const SPRINT_PHASE_ORDER = Object.freeze([
  SPRINT_PHASES.PRD,
  SPRINT_PHASES.PLAN,
  SPRINT_PHASES.DESIGN,
  SPRINT_PHASES.DO,
  SPRINT_PHASES.ITERATE,
  SPRINT_PHASES.QA,
  SPRINT_PHASES.REPORT,
  SPRINT_PHASES.ARCHIVED,
]);

const SPRINT_PHASE_SET = new Set(SPRINT_PHASE_ORDER);

/**
 * Check if `phase` is a recognized Sprint phase string.
 * @param {string} phase
 * @returns {boolean}
 */
function isValidSprintPhase(phase) {
  return typeof phase === 'string' && SPRINT_PHASE_SET.has(phase);
}

/**
 * Returns the index of `phase` in canonical Sprint order, or -1 if unknown.
 * @param {string} phase
 * @returns {number}
 */
function sprintPhaseIndex(phase) {
  if (!isValidSprintPhase(phase)) return -1;
  return SPRINT_PHASE_ORDER.indexOf(phase);
}

/**
 * Returns the next Sprint phase in canonical order, or null if at end.
 * @param {string} phase
 * @returns {string|null}
 */
function nextSprintPhase(phase) {
  const i = sprintPhaseIndex(phase);
  if (i < 0 || i >= SPRINT_PHASE_ORDER.length - 1) return null;
  return SPRINT_PHASE_ORDER[i + 1];
}

/**
 * Completion percentage scale indexed by canonical Sprint phase.
 *
 * Single source of truth for the phase → completion mapping used to bump
 * featureMap[f].completion on successful phase advances. Report and archived
 * both map to 100 (a sprint that reaches the report phase has, by definition,
 * completed all its features through the preceding phases).
 *
 * Index order mirrors SPRINT_PHASE_ORDER (prd=0 … archived=7).
 */
const PHASE_COMPLETION_PERCENT = Object.freeze([
  0,    // prd
  20,   // plan
  40,   // design
  60,   // do
  80,   // iterate
  90,   // qa
  100,  // report
  100,  // archived
]);

/**
 * Return the completion percentage (0-100) associated with a Sprint phase.
 *
 * Used by advance-phase.usecase to monotonically bump featureMap[f].completion
 * on each successful phase transition (callers take `max` against the existing
 * value so completion never decreases). Returns 0 for an unrecognized phase so
 * the advance helper degrades safely instead of throwing.
 *
 * @param {string} phase - Sprint phase string (SPRINT_PHASES value)
 * @returns {number} 0-100
 */
function phaseCompletionPercent(phase) {
  const i = sprintPhaseIndex(phase);
  if (i < 0) return 0;
  return PHASE_COMPLETION_PERCENT[i];
}

module.exports = {
  SPRINT_PHASES,
  SPRINT_PHASE_ORDER,
  SPRINT_PHASE_SET,
  isValidSprintPhase,
  sprintPhaseIndex,
  nextSprintPhase,
  PHASE_COMPLETION_PERCENT,
  phaseCompletionPercent,
};
