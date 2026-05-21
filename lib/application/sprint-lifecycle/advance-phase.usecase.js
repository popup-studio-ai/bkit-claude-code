/**
 * advance-phase.usecase.js — Sprint phase transition use case (v2.1.13 Sprint 2).
 *
 * Five sequential steps (ENH-292):
 *   1) Transition legality        — canTransitionSprint
 *   2) Trust Level scope check    — sprint.autoRun.scope.{stopAfter, requireApproval}
 *   3) Active gates evaluation    — current-phase exit gates via gateEvaluator
 *   4) phaseHistory append        — exitedAt + durationMs for previous phase
 *   5) cloneSprint + emit         — new phase + SprintPhaseChanged event
 *
 * Returns the PDCA-pattern shape: { ok: boolean, reason?: string, sprint?: Sprint, event?: SprintEvent, gateResults?: Object }.
 *
 * Design Ref: docs/02-design/features/v2113-sprint-2-application.design.md §7
 *
 * @module lib/application/sprint-lifecycle/advance-phase.usecase
 * @version 2.1.13
 * @since 2.1.13
 */

const { cloneSprint, SprintEvents } = require('../../domain/sprint');
const { canTransitionSprint } = require('./transitions');
const { sprintPhaseIndex } = require('./phases');
const { evaluatePhase } = require('./quality-gates');

/**
 * Append exit time to the latest phase entry if it matches `currentPhase`
 * and has not already been exited. Returns the new history array (immutable).
 *
 * @param {Array} history
 * @param {string} currentPhase
 * @param {string} exitedAt - ISO 8601
 * @returns {Array}
 */
function appendExitToHistory(history, currentPhase, exitedAt) {
  const arr = Array.isArray(history) ? history : [];
  if (arr.length === 0) return [];
  const last = arr[arr.length - 1];
  if (!last || last.phase !== currentPhase || last.exitedAt) return arr;
  const enteredMs = new Date(last.enteredAt).getTime();
  const exitedMs = new Date(exitedAt).getTime();
  const durationMs = (Number.isNaN(enteredMs) || Number.isNaN(exitedMs))
    ? null
    : (exitedMs - enteredMs);
  const closedLast = { ...last, exitedAt, durationMs };
  return [...arr.slice(0, -1), closedLast];
}

/**
 * Advance a sprint to the next phase, enforcing transition legality, Trust
 * Level scope, and active quality gates.
 *
 * v2.1.16 (Issue #95, F2): when `deps.approve === true`, the Step 2 scope
 * boundary is bypassed for the current call only (single-use escape hatch
 * — `sprint.autoRun.scope` is NOT mutated). The result includes an
 * `approvalRecord` object that the caller (sprint-handler.handlePhase)
 * surfaces to `lib/audit/audit-logger.writeAuditLog` with action
 * `scope_boundary_approved`. The next advancePhase call faces the same
 * scope check unless `--approve` is provided again.
 *
 * v2.1.16 (Issue #93, F4): when Step 3 returns `gate_fail` and
 * `deps.failureReporter` is provided, the use case invokes it with
 * `(sprint, sprint.phase, gateResults, timestamp)` and includes the
 * resulting `reportPath` in the response. The returned `sprint` (always
 * present in F4 gate_fail responses) carries a `lastGateFailure` field
 * populated with `{ phase, gateResults, reportPath, timestamp }` so the
 * handler can persist it via `infra.stateStore.save`. Pure-module
 * invariant preserved — no FS write here; the reporter (caller-injected)
 * owns the file write via `deps.fileWriter` it received from the handler.
 *
 * @param {import('../../domain/sprint/entity').Sprint} sprint
 * @param {string} toPhase
 * @param {{ gateEvaluator?: function, eventEmitter?: function, clock?: () => string, allowGateOverride?: boolean, approve?: boolean, reason?: string, failureReporter?: (sprint:Object, fromPhase:string, gateResults:Object, timestamp:string) => Promise<{reportPath?:string, markdown?:string, written?:boolean}> }} [deps]
 * @returns {Promise<{ ok: boolean, sprint?: import('../../domain/sprint/entity').Sprint, event?: Object, gateResults?: Object, reason?: string, stopAfter?: string, hint?: string, approvalRecord?: Object, reportPath?: string }>}
 */
async function advancePhase(sprint, toPhase, deps) {
  // Step 1: transition legality
  const transRes = canTransitionSprint(sprint && sprint.phase, toPhase);
  if (!transRes.ok) {
    return { ok: false, reason: transRes.reason };
  }
  if (sprint.phase === toPhase) {
    // Idempotent — no state change, no event
    return { ok: true, sprint, gateResults: null };
  }

  // Step 2: Trust Level scope check (v2.1.16 Issue #95 F2 — --approve escape hatch)
  let approvalRecord = null;
  const scope = sprint.autoRun && sprint.autoRun.scope;
  if (scope && scope.stopAfter && scope.requireApproval) {
    const stopIdx = sprintPhaseIndex(scope.stopAfter);
    const toIdx = sprintPhaseIndex(toPhase);
    if (stopIdx >= 0 && toIdx > stopIdx) {
      // v2.1.16 (Issue #95, F2): single-use approval. Pure-module invariant
      // preserved — no audit-logger import here; the caller (handler) is
      // responsible for surfacing approvalRecord to writeAuditLog.
      if (deps && deps.approve === true) {
        approvalRecord = {
          sprintId: sprint.id,
          from: sprint.phase,
          to: toPhase,
          trustLevel: (sprint.autoRun && sprint.autoRun.trustLevelAtStart) || 'L2',
          stopAfter: scope.stopAfter,
          approvedBy: 'user',
          reason: (deps && typeof deps.reason === 'string' && deps.reason.length > 0)
            ? deps.reason
            : null,
        };
        // Continue past the scope boundary (single-use). sprint.autoRun.scope
        // is NOT mutated — next transition re-enters this same check.
      } else {
        return {
          ok: false,
          reason: 'requires_user_approval',
          stopAfter: scope.stopAfter,
          hint: 'Re-run with --approve to proceed past the Trust Level scope boundary. '
              + 'Add --reason "..." to record rationale in the audit log. '
              + 'Approval is single-use and does NOT change sprint trust level.',
        };
      }
    }
  }

  // Step 3: Active gates evaluation (exiting current phase)
  const evaluator = (deps && typeof deps.gateEvaluator === 'function')
    ? deps.gateEvaluator
    : evaluatePhase;
  const gateResults = evaluator(sprint, sprint.phase);
  if (!gateResults.allPassed && !(deps && deps.allowGateOverride)) {
    // v2.1.16 (Issue #93, F4): auto-generate gate-failure report via the
    // caller-injected failureReporter (which is responsible for FS write
    // through its own fileWriter dep). Update sprint state with
    // lastGateFailure so the handler can persist (and /sprint status can
    // surface the failure later — Issue #93 expected behavior item 4).
    const clockFn = (deps && typeof deps.clock === 'function')
      ? deps.clock
      : () => new Date().toISOString();
    const ts = clockFn();
    let reportPath = null;
    if (deps && typeof deps.failureReporter === 'function') {
      try {
        // F4: pass toPhase as per-call opts so the markdown header reads
        // "fromPhase → toPhase" instead of "fromPhase → ?".
        const reportRes = await deps.failureReporter(sprint, sprint.phase, gateResults, ts, { toPhase: toPhase });
        if (reportRes && typeof reportRes.reportPath === 'string') {
          reportPath = reportRes.reportPath;
        }
      } catch (_e) {
        // Failure reporter is best-effort — never block gate_fail return.
        reportPath = null;
      }
    }
    // Always populate lastGateFailure on the returned sprint so the handler
    // can persist it (even when reportPath is null because no reporter was
    // injected — Issue #93 expected behavior item 3 about state field).
    const failedSprint = cloneSprint(sprint, {
      lastGateFailure: {
        phase: sprint.phase,
        toPhase: toPhase,
        gateResults: gateResults,
        reportPath: reportPath,
        timestamp: ts,
      },
    });
    return {
      ok: false,
      reason: 'gate_fail',
      gateResults,
      reportPath,
      sprint: failedSprint,
    };
  }

  // Step 4: phaseHistory append (close previous phase + open new phase)
  const clock = (deps && typeof deps.clock === 'function')
    ? deps.clock
    : () => new Date().toISOString();
  const now = clock();
  const closed = appendExitToHistory(sprint.phaseHistory, sprint.phase, now);
  const opened = [...closed, { phase: toPhase, enteredAt: now, exitedAt: null, durationMs: null }];

  // v2.1.19 S3 F3-1 (closes #103): resolve prior gate_fail on successful
  // transition. Mutates sprint.lastGateFailure in place (resolvedAt/resolvedBy/
  // resolutionReason) + prepends RESOLVED header to reportPath file.
  // Best-effort — failure to resolve does NOT block the transition.
  let resolveResult = null;
  if (sprint.lastGateFailure && !sprint.lastGateFailure.resolvedAt) {
    try {
      const resolveGateFail = require('./resolve-gate-fail');
      // resolveOnSuccess mutates sprint.lastGateFailure in place
      resolveResult = await resolveGateFail.resolveOnSuccess(sprint, {
        resolvedBy: (deps && deps.approve) ? 'approve' : 'auto',
        reason: (deps && typeof deps.reason === 'string' && deps.reason.length > 0)
          ? deps.reason
          : `advancePhase ${sprint.phase} → ${toPhase} succeeded`,
        projectRoot: deps && deps.projectRoot,
        fileReader: deps && deps.fileReader,
        fileWriter: deps && deps.fileWriter,
      });
    } catch (_) {
      // Best-effort — never block on resolution failure
      resolveResult = null;
    }
  }

  // Step 5: cloneSprint with new phase + emit event
  const updated = cloneSprint(sprint, {
    phase: toPhase,
    phaseHistory: opened,
    lastGateFailure: sprint.lastGateFailure, // preserve resolution mutation (F3-1)
    autoRun: {
      ...(sprint.autoRun || {}),
      lastAutoAdvanceAt: now,
    },
  });
  const event = SprintEvents.SprintPhaseChanged({
    sprintId: sprint.id,
    fromPhase: sprint.phase,
    toPhase,
    reason: 'auto_advance',
  });
  if (deps && typeof deps.eventEmitter === 'function') {
    deps.eventEmitter(event);
  }
  return { ok: true, sprint: updated, event, gateResults, approvalRecord, gateResolution: resolveResult };
}

module.exports = {
  advancePhase,
};
