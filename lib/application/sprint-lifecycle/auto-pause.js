/**
 * auto-pause.js — Sprint auto-pause triggers + state transitions (v2.1.13 Sprint 2).
 *
 * Implements ADR 0009 §3 four armed triggers:
 *   - QUALITY_GATE_FAIL    (HIGH)   any active gate with passed===false (Slice 2)
 *   - ITERATION_EXHAUSTED  (HIGH)   iter>=5 AND matchRate<minAcceptable
 *   - BUDGET_EXCEEDED      (MEDIUM) cumulativeTokens>budget
 *   - PHASE_TIMEOUT        (MEDIUM) phase elapsed > timeoutHours
 *
 * Pure trigger evaluators; state transitions (pause/resume) use cloneSprint
 * (Sprint 1) for immutable updates and emit SprintPaused/SprintResumed events
 * via optional deps.eventEmitter.
 *
 * Design Ref: docs/02-design/features/v2113-sprint-2-application.design.md §4
 * Master Plan Ref: docs/01-plan/features/sprint-management.master-plan.md §11.3
 *
 * @module lib/application/sprint-lifecycle/auto-pause
 * @version 2.1.13
 * @since 2.1.13
 */

const { cloneSprint, SprintEvents } = require('../../domain/sprint');
const { ACTIVE_GATES_BY_PHASE, GATE_DEFINITIONS } = require('./quality-gates');

/**
 * Slice 2 (Cluster D): collect the gate keys that are actively failing for the
 * sprint's current phase — any slot whose `passed === false` among the phase's
 * active gates. Returns an array of gate keys (e.g. ['M2', 'M8']). Pure helper.
 *
 * @param {import('../../domain/sprint/entity').Sprint} sprint
 * @returns {string[]}
 */
function failingActiveGates(sprint) {
  const phase = sprint && sprint.phase;
  const active = (phase && ACTIVE_GATES_BY_PHASE[phase]) || [];
  const g = (sprint && sprint.qualityGates) || {};
  const failing = [];
  for (const gateKey of active) {
    const def = GATE_DEFINITIONS[gateKey];
    if (!def) continue;
    const slot = g[def.field];
    // A gate counts as failing only if it was measured AND explicitly did not pass.
    // Unmeasured slots (passed === null) are not failures — they're handled by
    // the phase-advance gate check, not by auto-pause.
    if (slot && slot.passed === false) failing.push(gateKey);
  }
  return failing;
}

/**
 * @typedef {Object} AutoPauseTrigger
 * @property {string} id
 * @property {string} severity
 * @property {(sprint: import('../../domain/sprint/entity').Sprint, env?: { now?: number }) => boolean} check
 * @property {(sprint: import('../../domain/sprint/entity').Sprint) => string} message
 * @property {ReadonlyArray<string>} userActions
 */

const AUTO_PAUSE_TRIGGERS = Object.freeze({
  QUALITY_GATE_FAIL: Object.freeze({
    id: 'QUALITY_GATE_FAIL',
    severity: 'HIGH',
    check(sprint) {
      // Slice 2 (Cluster D): inspect ALL gates active for the sprint's current
      // phase — any measured gate with passed===false fires. Previously only
      // M3 and S1 were inspected, silently dropping failures of M1/M2/M4/M5/
      // M7/M8/M10/S2/S4. (M3>0 and S1<100 are subsumed: both set passed=false.)
      return failingActiveGates(sprint).length > 0;
    },
    message(sprint) {
      const failing = failingActiveGates(sprint);
      if (failing.length === 0) return 'Quality Gate fail: (none)';
      return 'Quality Gate fail: ' + failing.join(', ');
    },
    userActions: Object.freeze(['fix & resume', 'forward fix', 'abort sprint']),
  }),

  ITERATION_EXHAUSTED: Object.freeze({
    id: 'ITERATION_EXHAUSTED',
    severity: 'HIGH',
    check(sprint) {
      const iter = ((sprint && sprint.iterateHistory) || []).length;
      const maxIter = (sprint && sprint.config && sprint.config.maxIterations) || 5;
      const matchRate = sprint && sprint.kpi && sprint.kpi.matchRate;
      const minOk = (sprint && sprint.config && sprint.config.matchRateMinAcceptable) || 90;
      if (iter < maxIter) return false;
      if (matchRate === null || typeof matchRate === 'undefined') return true;
      return matchRate < minOk;
    },
    message(sprint) {
      const iter = ((sprint && sprint.iterateHistory) || []).length;
      const maxIter = (sprint && sprint.config && sprint.config.maxIterations) || 5;
      const mr = sprint && sprint.kpi && sprint.kpi.matchRate;
      const mrStr = (mr === null || typeof mr === 'undefined') ? '--' : `${mr}%`;
      return `Iteration ${iter}/${maxIter} exhausted, matchRate ${mrStr} < min acceptable`;
    },
    userActions: Object.freeze(['forward fix', 'carry to next sprint', 'abort']),
  }),

  BUDGET_EXCEEDED: Object.freeze({
    id: 'BUDGET_EXCEEDED',
    severity: 'MEDIUM',
    check(sprint) {
      const used = (sprint && sprint.kpi && sprint.kpi.cumulativeTokens) || 0;
      const budget = (sprint && sprint.config && sprint.config.budget) || 1_000_000;
      return used > budget;
    },
    message(sprint) {
      const used = (sprint && sprint.kpi && sprint.kpi.cumulativeTokens) || 0;
      const budget = (sprint && sprint.config && sprint.config.budget) || 1_000_000;
      return `Cumulative tokens ${used} > budget ${budget}`;
    },
    userActions: Object.freeze(['increase budget & resume', 'abort with partial report', 'archive as-is']),
  }),

  PHASE_TIMEOUT: Object.freeze({
    id: 'PHASE_TIMEOUT',
    severity: 'MEDIUM',
    check(sprint, env) {
      const history = (sprint && sprint.phaseHistory) || [];
      if (history.length === 0) return false;
      const last = history[history.length - 1];
      if (!last || !last.enteredAt) return false;
      if (last.exitedAt) return false;
      const now = (env && typeof env.now === 'number') ? env.now : Date.now();
      const enteredMs = new Date(last.enteredAt).getTime();
      if (Number.isNaN(enteredMs)) return false;
      const elapsed = now - enteredMs;
      const timeoutHrs = (sprint && sprint.config && sprint.config.phaseTimeoutHours) || 4;
      return elapsed > timeoutHrs * 3600 * 1000;
    },
    message(sprint) {
      const t = (sprint && sprint.config && sprint.config.phaseTimeoutHours) || 4;
      const phase = (sprint && sprint.phase) || 'unknown';
      return `Phase ${phase} elapsed > ${t}h timeout`;
    },
    userActions: Object.freeze(['extend timeout & resume', 'force-advance phase', 'abort']),
  }),
});

/**
 * @typedef {Object} TriggerHit
 * @property {string} triggerId
 * @property {string} severity
 * @property {string} message
 * @property {string[]} userActions
 */

/**
 * Returns hits for currently-fired armed triggers.
 * Triggers not in `sprint.autoPause.armed` are skipped entirely.
 *
 * @param {import('../../domain/sprint/entity').Sprint} sprint
 * @param {{ now?: number }} [env]
 * @returns {TriggerHit[]}
 */
function checkAutoPauseTriggers(sprint, env) {
  const armed = (sprint && sprint.autoPause && Array.isArray(sprint.autoPause.armed))
    ? sprint.autoPause.armed
    : Object.keys(AUTO_PAUSE_TRIGGERS);
  const hits = [];
  for (const id of armed) {
    const trig = AUTO_PAUSE_TRIGGERS[id];
    if (!trig) continue;
    if (trig.check(sprint, env || {})) {
      hits.push({
        triggerId: id,
        severity: trig.severity,
        message: trig.message(sprint),
        userActions: [...trig.userActions],
      });
    }
  }
  return hits;
}

/**
 * Transition sprint to 'paused' status with audit-trail append + event emit.
 *
 * @param {import('../../domain/sprint/entity').Sprint} sprint
 * @param {TriggerHit[]} triggers - must be non-empty
 * @param {{ eventEmitter?: function, clock?: () => string }} [deps]
 * @returns {{ ok: boolean, sprint: import('../../domain/sprint/entity').Sprint, pauseEvent?: Object, reason?: string }}
 */
function pauseSprint(sprint, triggers, deps) {
  if (!Array.isArray(triggers) || triggers.length === 0) {
    return { ok: false, sprint, reason: 'no_triggers' };
  }
  const clock = (deps && deps.clock) || (() => new Date().toISOString());
  const pausedAt = clock();
  const primary = triggers[0];
  const prevAutoPause = (sprint && sprint.autoPause) || { armed: [], lastTrigger: null, pauseHistory: [] };
  const updatedAutoPause = {
    ...prevAutoPause,
    lastTrigger: primary.triggerId,
    pauseHistory: [
      ...(prevAutoPause.pauseHistory || []),
      {
        pausedAt,
        trigger: primary.triggerId,
        severity: primary.severity,
        message: primary.message,
        userActions: [...primary.userActions],
        siblings: triggers.slice(1).map((t) => t.triggerId),
      },
    ],
  };
  const updated = cloneSprint(sprint, { status: 'paused', autoPause: updatedAutoPause });
  const pauseEvent = SprintEvents.SprintPaused({
    sprintId: sprint.id,
    trigger: primary.triggerId,
    severity: primary.severity,
    message: primary.message,
  });
  if (deps && typeof deps.eventEmitter === 'function') {
    deps.eventEmitter(pauseEvent);
  }
  return { ok: true, sprint: updated, pauseEvent };
}

/**
 * Attempt to resume a paused sprint. Re-evaluates triggers — if any still fire,
 * returns blocked with reason.
 *
 * @param {import('../../domain/sprint/entity').Sprint} sprint
 * @param {{ eventEmitter?: function, clock?: () => string, env?: { now?: number } }} [deps]
 * @returns {{ ok: boolean, sprint?: import('../../domain/sprint/entity').Sprint, resumeEvent?: Object, blockedReason?: string, triggersStillFiring?: TriggerHit[] }}
 */
function resumeSprint(sprint, deps) {
  if (!sprint || sprint.status !== 'paused') {
    return { ok: false, blockedReason: 'not_paused' };
  }
  const env = (deps && deps.env) || {};
  const stillFiring = checkAutoPauseTriggers(sprint, env);
  if (stillFiring.length > 0) {
    return { ok: false, blockedReason: 'trigger_not_resolved', triggersStillFiring: stillFiring };
  }
  const lastPause = ((sprint.autoPause && sprint.autoPause.pauseHistory) || []).slice(-1)[0];
  const pausedAt = (lastPause && lastPause.pausedAt) || null;
  const clock = (deps && deps.clock) || (() => new Date().toISOString());
  const resumedAt = clock();
  let durationMs = null;
  if (pausedAt) {
    const ms = new Date(resumedAt).getTime() - new Date(pausedAt).getTime();
    if (!Number.isNaN(ms)) durationMs = ms;
  }
  const updated = cloneSprint(sprint, { status: 'active' });
  const resumeEvent = SprintEvents.SprintResumed({
    sprintId: sprint.id,
    pausedAt: pausedAt || resumedAt,
    resumedAt,
    durationMs,
  });
  if (deps && typeof deps.eventEmitter === 'function') {
    deps.eventEmitter(resumeEvent);
  }
  return { ok: true, sprint: updated, resumeEvent };
}

module.exports = {
  AUTO_PAUSE_TRIGGERS,
  checkAutoPauseTriggers,
  pauseSprint,
  resumeSprint,
};
