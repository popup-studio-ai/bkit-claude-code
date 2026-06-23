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
const { sprintPhaseIndex, phaseCompletionPercent } = require('./phases');
const { evaluatePhase } = require('./quality-gates');

/**
 * Build an advanced featureMap where each entry's pdcaPhase is moved to
 * `toPhase` and its completion is monotonically bumped to at least the scale
 * value for `toPhase` (max with the existing completion — never decrease).
 *
 * Pure + defensive: missing/null/non-object featureMap returns `{}`. Entries
 * are copy-constructed (input is NOT mutated). Entry shape is preserved — only
 * pdcaPhase and completion are touched; matchRate/qa/etc. survive unchanged.
 *
 * @param {Object<string, {pdcaPhase:string, completion:number}>} featureMap
 * @param {string} toPhase - phase being advanced INTO
 * @returns {Object<string, Object>} new featureMap
 */
function advanceFeatureMap(featureMap, toPhase) {
  if (!featureMap || typeof featureMap !== 'object') return {};
  const scaleValue = phaseCompletionPercent(toPhase);
  const out = {};
  for (const key of Object.keys(featureMap)) {
    const entry = featureMap[key];
    if (!entry || typeof entry !== 'object') {
      // Preserve non-entry oddities verbatim rather than dropping silently.
      out[key] = entry;
      continue;
    }
    out[key] = {
      ...entry,
      pdcaPhase: toPhase,
      completion: Math.max(
        typeof entry.completion === 'number' ? entry.completion : 0,
        scaleValue
      ),
    };
  }
  return out;
}

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
 * v2.1.21 (Issue #113, F7): on a successful transition, `deps.transitionSummaryBuilder`
 * (when provided) is invoked with `(updatedSprint, { previousPhase })` and its
 * return value is attached as `phaseTransitionSummary`. The use case remains
 * pure — no fs write, no lib/sprint import; the handler injects the builder.
 *
 * @param {{ gateEvaluator?: function, eventEmitter?: function, clock?: () => string, allowGateOverride?: boolean, approve?: boolean, reason?: string, failureReporter?: (sprint:Object, fromPhase:string, gateResults:Object, timestamp:string) => Promise<{reportPath?:string, markdown?:string, written?:boolean}>, transitionSummaryBuilder?: (sprint:Object, opts:{previousPhase:string}) => Object }} [deps]
 * @returns {Promise<{ ok: boolean, sprint?: import('../../domain/sprint/entity').Sprint, event?: Object, gateResults?: Object, reason?: string, stopAfter?: string, hint?: string, approvalRecord?: Object, reportPath?: string, phaseTransitionSummary?: Object }>}
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
    // v2.1.22 (Issue #93, Task 5.1): derive an actionable hint naming the
    // failing gate key(s) and the exact measure + phase commands to run. A
    // user staring at a bare `gate_fail` previously had no signal that they
    // needed to run `/sprint measure` to populate the unmeasured/below-
    // threshold gate. Pure (string only); defensive against a missing
    // gateResults.results map (falls back to a generic hint, never crashes).
    const failingKeys = (gateResults && gateResults.results)
      ? Object.keys(gateResults.results)
          .filter((k) => gateResults.results[k] && gateResults.results[k].passed === false)
      : [];
    const hint = failingKeys.length > 0
      ? 'Quality gate(s) ' + failingKeys.join(', ')
        + ' not met for phase "' + sprint.phase + '". Run: /sprint measure '
        + sprint.id + ' --gate ' + failingKeys[0]
        + ' (then re-run /sprint phase ' + sprint.id + ' --to ' + toPhase + ')'
      : 'Quality gates not met for phase "' + sprint.phase + '". Run: /sprint measure '
        + sprint.id + ' to measure gates, then re-run /sprint phase ' + sprint.id
        + ' --to ' + toPhase;
    return {
      ok: false,
      reason: 'gate_fail',
      gateResults,
      reportPath,
      hint,
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
  // v2.1.13 Sprint 3 (Task 3.4): advance each featureMap entry's pdcaPhase to
  // toPhase and bump completion monotonically (max, never decrease) so the S2
  // computed gate (count of featureMap entries with completion >= 100) has
  // populated data to read on subsequent gate evaluations.
  const updated = cloneSprint(sprint, {
    phase: toPhase,
    phaseHistory: opened,
    lastGateFailure: sprint.lastGateFailure, // preserve resolution mutation (F3-1)
    featureMap: advanceFeatureMap(sprint.featureMap, toPhase),
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

  // v2.1.21 (Issue #113, F7): attach a human-readable phase-transition summary
  // to the SUCCESS payload via a caller-injected builder. Mirrors the F4
  // gate_fail failureReporter dependency-injection discipline — the use case
  // stays pure (NO fs write, NO lib/sprint import here); the handler injects
  // `deps.transitionSummaryBuilder` (= lib/sprint/executive-summary). Builder
  // is invoked with the UPDATED sprint + previousPhase so the summary reflects
  // the post-transition state. Best-effort: a throwing builder yields null and
  // never blocks the transition.
  let phaseTransitionSummary = null;
  if (deps && typeof deps.transitionSummaryBuilder === 'function') {
    try {
      phaseTransitionSummary = deps.transitionSummaryBuilder(updated, { previousPhase: sprint.phase });
    } catch (_e) {
      phaseTransitionSummary = null;
    }
  }

  return { ok: true, sprint: updated, event, gateResults, approvalRecord, gateResolution: resolveResult, phaseTransitionSummary };
}

module.exports = {
  advancePhase,
  advanceFeatureMap,
};
