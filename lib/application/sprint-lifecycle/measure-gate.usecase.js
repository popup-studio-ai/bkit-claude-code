/**
 * measure-gate.usecase.js — Sprint Application UC for /sprint measure (v2.1.16 Issue #94 F3).
 *
 * Dispatches gate measurement via lib/application/quality-gates/measure-router
 * (single SoT) then persists the result into sprint.qualityGates[<field>]
 * subject to Trust Level scope (L0/L1 = preview-only, L2+ = recorded).
 *
 * Layer boundaries (Sprint 2 invariant):
 *   - This UC is pure: takes sprint + gateKey + deps, returns
 *     { sprint(cloned), measurement, auditRecord, preview }. No FS, no audit
 *     write — caller (sprint-handler.handleMeasure) owns state save + audit emit.
 *   - measure-router is also pure; agentTaskRunner injected by handler.
 *   - cloneSprint used for immutable update (mirror advance-phase.usecase
 *     pattern).
 *
 * ENH-292 alignment:
 *   measureGates() and measurePhaseGates() iterate sequentially through
 *   gateKeys to avoid the #56293 sub-agent caching 10x regression.
 *
 * Design Ref: docs/01-plan/features/v2116-issue-fixes.master-plan.md §11.3
 *
 * @module lib/application/sprint-lifecycle/measure-gate.usecase
 * @version 2.1.16
 * @since 2.1.16
 */

const { cloneSprint } = require('../../domain/sprint');
const { evaluateGate, GATE_DEFINITIONS, ACTIVE_GATES_BY_PHASE } = require('./quality-gates');
const router = require('../quality-gates/measure-router');

/**
 * Trust Level → measurement persistence policy.
 * - 'preview': measurement returned but sprint.qualityGates NOT updated, no audit emitted.
 * - 'record':  measurement returned AND sprint.qualityGates updated AND audit emitted.
 *
 * @param {string} trustLevel - One of 'L0', 'L1', 'L2', 'L3', 'L4'
 * @returns {'preview'|'record'}
 */
function resolveMode(trustLevel) {
  if (trustLevel === 'L0' || trustLevel === 'L1') return 'preview';
  return 'record'; // L2 / L3 / L4 / unknown — record by default
}

/**
 * @typedef {Object} MeasureGateUCDeps
 * @property {(req:{subagent_type:string, prompt:string}) => Promise<{output:string}>} agentTaskRunner
 *           - Required. Injected by handler (sprint-handler.handleMeasure).
 * @property {{ measureGate: function }} [measureRouter]
 *           - Optional override for test isolation. Defaults to the production
 *             measure-router. When provided, agentTaskRunner is delegated
 *             through this stub instead.
 * @property {('L0'|'L1'|'L2'|'L3'|'L4')} [trustLevel]
 *           - Defaults to sprint.autoRun.trustLevelAtStart, then 'L3'.
 * @property {('manual'|'auto')} [source]
 *           - Defaults to 'manual' for /sprint measure invocation. 'auto' when
 *             called from orchestrator self-assessment loop.
 * @property {() => string} [clock]
 *           - Defaults to () => new Date().toISOString().
 */

/**
 * @typedef {Object} MeasureGateUCResult
 * @property {boolean} ok
 * @property {string} gateKey
 * @property {('preview'|'record')} [mode]
 * @property {import('../../domain/sprint/entity').Sprint} [sprint]
 *           - Updated sprint when mode='record'; the input sprint unchanged when mode='preview'.
 * @property {Object} [measurement]
 *           - { gateKey, field, agent, value, threshold, passed, details, source }
 * @property {Object} [auditRecord]
 *           - When mode='record': details schema for audit-logger.
 *           - Null in preview mode (no audit emission expected).
 * @property {string} [reason]
 * @property {string} [error]
 * @property {string[]} [supportedGates]
 */

/**
 * Measure a single gate, optionally recording it into sprint.qualityGates
 * subject to Trust Level scope.
 *
 * @param {import('../../domain/sprint/entity').Sprint} sprint
 * @param {string} gateKey
 * @param {MeasureGateUCDeps} deps
 * @returns {Promise<MeasureGateUCResult>}
 */
async function measureGate(sprint, gateKey, deps) {
  if (!sprint || typeof sprint !== 'object') {
    return { ok: false, gateKey, reason: 'invalid_sprint', error: 'sprint must be an object' };
  }
  const d = deps || {};
  const trustLevel = d.trustLevel
    || (sprint.autoRun && sprint.autoRun.trustLevelAtStart)
    || 'L3';
  const source = (d.source === 'auto' || d.source === 'manual') ? d.source : 'manual';
  const clock = (typeof d.clock === 'function') ? d.clock : () => new Date().toISOString();
  const mode = resolveMode(trustLevel);

  // 1) Dispatch via router (or test override).
  const routerImpl = d.measureRouter || router;
  const rawResult = await routerImpl.measureGate(gateKey, sprint, {
    agentTaskRunner: d.agentTaskRunner,
  });
  if (!rawResult.ok) {
    return {
      ok: false,
      gateKey,
      mode,
      reason: rawResult.reason,
      error: rawResult.error,
      supportedGates: rawResult.supportedGates,
    };
  }

  // 2) Resolve threshold from existing sprint state slot or GATE_DEFINITIONS default.
  const def = GATE_DEFINITIONS[gateKey];
  const slot = (sprint.qualityGates && sprint.qualityGates[rawResult.field]) || {};
  const threshold = (typeof slot.threshold !== 'undefined' && slot.threshold !== null)
    ? slot.threshold
    : (def && def.defaultThreshold);

  // 3) Build a probe sprint to evaluate passed against the routed value
  //    without committing to qualityGates yet — used for both preview + record.
  const probeQg = {
    ...(sprint.qualityGates || {}),
    [rawResult.field]: { current: rawResult.value, threshold, passed: null },
  };
  const probeSprint = { qualityGates: probeQg };
  const evalRes = evaluateGate(probeSprint, gateKey);
  const passed = evalRes.passed;
  const previousValue = (slot && typeof slot.current !== 'undefined') ? slot.current : null;

  const measurement = {
    gateKey,
    field: rawResult.field,
    agent: rawResult.agent,
    value: rawResult.value,
    details: rawResult.details,
    threshold,
    passed,
    source,
    previousValue,
    phase: sprint.phase || null,
    trustLevel,
  };

  // 4) Preview mode (L0/L1) — return measurement without state mutation or audit.
  if (mode === 'preview') {
    return {
      ok: true,
      gateKey,
      mode: 'preview',
      sprint, // unchanged reference (caller decides whether to inform user)
      measurement,
      auditRecord: null,
    };
  }

  // 5) Record mode (L2+) — clone sprint with updated qualityGates and lastMeasuredAt timestamp.
  const ts = clock();
  const updated = cloneSprint(sprint, {
    qualityGates: {
      ...(sprint.qualityGates || {}),
      [rawResult.field]: { current: rawResult.value, threshold, passed, lastMeasuredAt: ts },
    },
  });
  const auditRecord = {
    sprintId: sprint.id,
    gateKey,
    field: rawResult.field,
    agent: rawResult.agent,
    value: rawResult.value,
    threshold,
    passed,
    source,
    phase: sprint.phase || null,
    trustLevel,
    previousValue,
  };
  return {
    ok: true,
    gateKey,
    mode: 'record',
    sprint: updated,
    measurement,
    auditRecord,
  };
}

/**
 * Sequentially measure a list of gates (ENH-292 cache-friendly). Aggregates
 * results so the caller can emit per-gate audit entries and persist a single
 * cumulative sprint snapshot at the end.
 *
 * @param {import('../../domain/sprint/entity').Sprint} sprint
 * @param {string[]} gateKeys
 * @param {MeasureGateUCDeps} deps
 * @returns {Promise<{ ok: boolean, sprint: import('../../domain/sprint/entity').Sprint, results: MeasureGateUCResult[], successCount: number, failureCount: number }>}
 */
async function measureGates(sprint, gateKeys, deps) {
  if (!Array.isArray(gateKeys) || gateKeys.length === 0) {
    return { ok: false, sprint, results: [], successCount: 0, failureCount: 0 };
  }
  let working = sprint;
  const results = [];
  let successCount = 0;
  let failureCount = 0;
  for (const gateKey of gateKeys) {
    const r = await measureGate(working, gateKey, deps);
    results.push(r);
    if (r.ok && r.sprint && r.mode === 'record') {
      working = r.sprint;
    }
    if (r.ok) successCount++; else failureCount++;
  }
  return {
    ok: failureCount === 0,
    sprint: working,
    results,
    successCount,
    failureCount,
  };
}

/**
 * Measure every gate listed under ACTIVE_GATES_BY_PHASE[phase]. Useful for the
 * `/sprint measure <id> --phase <p>` invocation (Master Plan AC3) and for the
 * orchestrator self-assessment exit procedure (Master Plan AC7 code-sharing).
 *
 * @param {import('../../domain/sprint/entity').Sprint} sprint
 * @param {string} phase
 * @param {MeasureGateUCDeps} deps
 * @returns {Promise<{ ok: boolean, sprint: import('../../domain/sprint/entity').Sprint, phase: string, results: MeasureGateUCResult[], successCount: number, failureCount: number, skippedUnsupported: string[] }>}
 */
async function measurePhaseGates(sprint, phase, deps) {
  const active = ACTIVE_GATES_BY_PHASE[phase] || [];
  const supported = [];
  const skippedUnsupported = [];
  for (const g of active) {
    if (router.isSupportedGate(g)) supported.push(g);
    else skippedUnsupported.push(g);
  }
  const agg = await measureGates(sprint, supported, deps);
  return { ...agg, phase, skippedUnsupported };
}

module.exports = {
  measureGate,
  measureGates,
  measurePhaseGates,
  resolveMode,
};
