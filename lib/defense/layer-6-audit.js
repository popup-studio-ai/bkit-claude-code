/**
 * Layer6Audit — Defense Layer post-hoc audit, alarm, and auto-rollback engine.
 *
 * Design Ref: docs/sprint/v2114/design.md §3.4
 * Plan SC: ENH-289 Defense Layer 6.
 * Differentiation: bkit moat #2 — post-hoc audit + auto-rollback (vs CC's
 * advisory-only directives, no rollback infrastructure).
 *
 * Background:
 *   The R-3 numbered violation series (#54178 + ~12 evolved-form variants)
 *   demonstrated that Anthropic's recommended safety hooks can be ignored by
 *   the model. bkit's PreToolUse defense layer (`lib/control/*`) catches
 *   prevention failures before execution, but it cannot recover from
 *   modifications that *succeed* and then turn out wrong. This module is
 *   that second line — it audits *after* PostToolUse, alarms when severity
 *   crosses the medium threshold, and (at Trust Level L4 only) auto-rolls
 *   back from the most recent checkpoint when severity hits critical.
 *
 * Three-tier flow (design §3.4):
 *   Tier 1 — post-hoc audit:  PostToolUse hook calls `auditPostHoc(event)`
 *                              after the tool completes; this only reads
 *                              and classifies, never mutates.
 *   Tier 2 — alarm:           severity ≥ 'medium' → `alarm()` writes an
 *                              audit-logger entry + console.warn.
 *   Tier 3 — auto-rollback:   severity = 'critical' AND trustLevel = 'L4'
 *                              → `autoRollback()` calls into checkpoint-manager.
 *                              Lower trust levels stop at Tier 2 (alarm only).
 *
 * Recursion-safety (D-3, mitigates the 2026-04-22 682 GB incident):
 *   alarm() and autoRollback() both call into audit-logger.writeAuditLog().
 *   If a downstream hook (e.g. file-modified observer) were ever to call
 *   back into Layer6Audit during that write, infinite recursion could
 *   restart. We block that via a module-level `_inLayer6Audit` flag —
 *   public entry points set it to true before delegating; if the flag is
 *   already true on entry, the entry point becomes a no-op. `isInLayer6Audit()`
 *   is exposed for read-only checks by other hooks that want to short-circuit.
 *
 *   M7 fix (audit): the flag is INTRA-PROCESS by design, NOT a persistence
 *   gap. Recursion is inherently within a single synchronous/async call
 *   chain — a separate hook fire (a separate node process) cannot be
 *   "deeper in the same recursion" and starts at `_inLayer6Audit = false`,
 *   which is the correct state. Every set-true site is paired with a
 *   `finally { _inLayer6Audit = false }`, so the flag cannot leak even on
 *   throw within a process. Persisting the flag cross-process would be a
 *   SEMANTIC ERROR: process B would observe process A's stuck-`true` flag
 *   (from a SIGKILL'd mid-audit) and silently no-op every Layer6Audit
 *   call thereafter, converting a re-entrancy guard into a permanent
 *   lockout. No TTL rescues this — there is no "the other process is still
 *   recursing" predicate to time-bound. The process-local contract is
 *   therefore correct and load-bearing; do NOT "fix" it by persisting.
 *
 * Trust Level policy (D-4):
 *   L0 / L1 / L2 / L3 → alarm only on critical (no auto-rollback)
 *   L4               → auto-rollback on critical, alarm only on medium/high
 *
 * Storage:
 *   Reuses existing `lib/control/checkpoint-manager.js` (Sub-Sprint 2 D-2:
 *   state-store.port adapter is absent; using checkpoint-manager directly
 *   keeps Sub-Sprint 2 within scope, defers Port-Adapter scaffolding to
 *   Sub-Sprint 3 carry).
 *
 * @module lib/defense/layer-6-audit
 * @version 2.1.14
 * @since 2.1.14
 * @layer Defense
 * @enh ENH-289
 * @differentiation #2
 */

'use strict';

/**
 * @typedef {'low'|'medium'|'high'|'critical'} Severity
 */

/**
 * @typedef {Object} PostHocEvent
 * @property {string} tool             — tool name (e.g. 'Bash', 'Write', 'Skill')
 * @property {Object} [toolInput]      — original tool input payload (sanitized)
 * @property {Object} [toolOutput]     — tool result payload (sanitized)
 * @property {string} [feature]        — current PDCA feature, optional
 * @property {string} [phase]          — current PDCA phase, optional
 * @property {Severity} [severity]     — caller-provided classification (optional)
 *                                       Default classifier infers from outputs.
 */

/**
 * @typedef {Object} AuditResult
 * @property {boolean} ok           — post-hoc check completed without internal error
 * @property {Severity} severity    — final classified severity
 * @property {boolean} alarm        — true iff Tier 2 fired
 * @property {boolean} rollback     — true iff Tier 3 fired
 * @property {string} reason        — human-readable explanation
 * @property {string|null} checkpointId — checkpoint used for rollback, if any
 */

const SEVERITY_ORDER = Object.freeze(['low', 'medium', 'high', 'critical']);

/** Module-level recursion guard. INTRA-PROCESS by design — see file header
 *  §"Recursion-safety" + M7 note. Every set-true site pairs with a finally-reset,
 *  so it cannot leak within a process; persisting it cross-process would be a
 *  semantic error (permanent lockout). Do not change to persisted state. */
let _inLayer6Audit = false;

/** Module-level rate limit (Sub-Sprint 2 Phase 0 §6.3): cap automatic
 *  rollbacks to 1 per 5 minutes per feature to avoid cascading reversion
 *  when L4 sub-agent dispatch slowness causes overlapping critical events. */
const ROLLBACK_RATE_LIMIT_MS = 5 * 60 * 1000;
const _lastRollbackByFeature = new Map();

/** Read-only flag inspector for callers that want to short-circuit before
 *  re-entering audit code paths during their own emit. */
function isInLayer6Audit() {
  return _inLayer6Audit === true;
}

/**
 * Default severity classifier — pure function, used when caller omits
 * `event.severity`. Conservative defaults:
 *   - exit_code > 0                                  → 'high'
 *   - error/stack/EACCES/EPERM/ENOSPC pattern in out → 'critical'
 *   - destructive_operation flag (from upstream hook) → 'high'
 *   - otherwise                                       → 'low'
 *
 * @param {PostHocEvent} event
 * @returns {Severity}
 */
function classifySeverity(event) {
  if (!event || typeof event !== 'object') return 'low';
  if (SEVERITY_ORDER.includes(event.severity)) return event.severity;
  const out = (event.toolOutput && typeof event.toolOutput === 'object') ? event.toolOutput : {};
  const stderr = typeof out.stderr === 'string' ? out.stderr : '';
  const stdout = typeof out.stdout === 'string' ? out.stdout : '';
  const combined = `${stderr}\n${stdout}`;
  if (/\b(EACCES|EPERM|ENOSPC|ECONNREFUSED|panic|fatal|core dumped|segmentation fault)\b/i.test(combined)) {
    return 'critical';
  }
  if (typeof out.exit_code === 'number' && out.exit_code !== 0) return 'high';
  if (event.toolInput && event.toolInput.destructiveOperation === true) return 'high';
  if (/\b(error|warn(?:ing)?|failed)\b/i.test(combined)) return 'medium';
  return 'low';
}

/** Severity ≥ given threshold? Pure comparison. */
function gte(severity, threshold) {
  const a = SEVERITY_ORDER.indexOf(severity);
  const b = SEVERITY_ORDER.indexOf(threshold);
  return a >= 0 && b >= 0 && a >= b;
}

/**
 * Create a Layer6Audit instance.
 *
 * @param {Object} deps
 * @param {{ writeAuditLog: (entry: object) => Promise<unknown> }} deps.audit
 *   audit-logger module (writeAuditLog). DI so tests inject a recording stub.
 * @param {{ rollbackToCheckpoint: (id: string) => Promise<unknown> | object,
 *           listCheckpoints: (feature?: string) => Array<{ id: string }> }} deps.checkpoint
 *   checkpoint-manager module. DI so tests inject a stub.
 * @param {() => 'L0'|'L1'|'L2'|'L3'|'L4'|string} [deps.trustLevelProvider]
 *   Returns current Trust Level. Defaults to 'L2' if omitted.
 * @param {() => number} [deps.clock] — wallclock (ms). Defaults to Date.now.
 * @param {(msg: string, payload?: object) => void} [deps.warn]
 *   Console-like warn fn. Defaults to console.warn. Override for tests.
 * @returns {Object}
 */
function createLayer6Audit(deps) {
  if (!deps || !deps.audit || typeof deps.audit.writeAuditLog !== 'function') {
    throw new TypeError('createLayer6Audit: deps.audit.writeAuditLog must be a function');
  }
  if (!deps.checkpoint || typeof deps.checkpoint.rollbackToCheckpoint !== 'function') {
    throw new TypeError('createLayer6Audit: deps.checkpoint.rollbackToCheckpoint must be a function');
  }
  const audit = deps.audit;
  const checkpoint = deps.checkpoint;
  const trustLevelProvider = deps.trustLevelProvider || (() => 'L2');
  const clock = typeof deps.clock === 'function' ? deps.clock : () => Date.now();
  const warn = typeof deps.warn === 'function' ? deps.warn : (msg, payload) => {
    // eslint-disable-next-line no-console
    console.warn(payload ? `${msg} ${JSON.stringify(payload)}` : msg);
  };

  /** Tier 1 — post-hoc audit. Read + classify + delegate to alarm/rollback. */
  async function auditPostHoc(event) {
    if (_inLayer6Audit) {
      // Recursion safety. Layer6Audit was already entered; do not re-enter.
      return { ok: false, severity: 'low', alarm: false, rollback: false, reason: 're-entrant call blocked', checkpointId: null };
    }
    _inLayer6Audit = true;
    try {
      const severity = classifySeverity(event);
      const result = {
        ok: true,
        severity,
        alarm: false,
        rollback: false,
        reason: `Tier 1 audit completed: severity=${severity}`,
        checkpointId: null,
      };

      // Tier 1 always logs the audit pass
      await audit.writeAuditLog({
        action: 'layer_6_audit_completed',
        category: 'system',
        actor: 'hook',
        target: (event && event.feature) || 'unknown',
        targetType: 'feature',
        result: 'success',
        details: { tool: event && event.tool, severity, phase: event && event.phase },
        blastRadius: severity === 'critical' ? 'critical' : (severity === 'high' ? 'high' : null),
      });

      // Tier 2 — alarm
      if (gte(severity, 'medium')) {
        result.alarm = true;
        await alarmInternal(severity, `bkit ENH-289 Tier 2 alarm: ${severity} severity detected on ${event && event.tool}`, {
          feature: event && event.feature,
          phase: event && event.phase,
        });
      }

      // Tier 3 — auto-rollback (L4 + critical only)
      if (gte(severity, 'critical') && trustLevelProvider() === 'L4') {
        const feature = (event && event.feature) || 'unknown';
        if (!isRateLimited(feature)) {
          const latest = findLatestCheckpoint(feature);
          if (latest) {
            const rb = await autoRollbackInternal(latest.id, { feature, phase: event && event.phase });
            result.rollback = rb.restored === true;
            result.checkpointId = latest.id;
            result.reason = rb.restored
              ? `Tier 3 auto-rollback to ${latest.id}`
              : `Tier 3 auto-rollback FAILED: ${rb.details && rb.details.error}`;
          } else {
            await alarmInternal('critical', `bkit ENH-289 Tier 3 skipped: no checkpoint available for feature=${feature}`, {});
            result.reason = `Tier 3 skipped: no checkpoint`;
          }
        } else {
          await alarmInternal('critical', `bkit ENH-289 Tier 3 skipped: rate-limited (>1 rollback in 5min for feature=${feature})`, {});
          result.reason = `Tier 3 skipped: rate-limited`;
        }
      } else if (gte(severity, 'critical')) {
        // Critical but trust level < L4 → alarm only
        result.reason = `Tier 3 skipped: trust level ${trustLevelProvider()} < L4 (alarm only)`;
      }

      return result;
    } catch (e) {
      // Graceful degradation — audit module must never throw out
      warn(`[layer-6-audit] auditPostHoc internal error (graceful degrade): ${e.message}`);
      return { ok: false, severity: 'low', alarm: false, rollback: false, reason: `internal: ${e.message}`, checkpointId: null };
    } finally {
      _inLayer6Audit = false;
    }
  }

  /** Tier 2 — alarm. Public wrapper so external code can raise an alarm directly. */
  async function alarm(severity, reason, options) {
    if (_inLayer6Audit) return; // re-entrant short-circuit
    _inLayer6Audit = true;
    try {
      await alarmInternal(severity, reason, options || {});
    } finally {
      _inLayer6Audit = false;
    }
  }

  /** Internal alarm (assumes caller has already set _inLayer6Audit=true). */
  async function alarmInternal(severity, reason, options) {
    const sev = SEVERITY_ORDER.includes(severity) ? severity : 'medium';
    try {
      await audit.writeAuditLog({
        action: 'layer_6_alarm_triggered',
        category: 'system',
        actor: 'hook',
        target: (options && options.feature) || 'unknown',
        targetType: 'feature',
        result: 'blocked',
        reason,
        details: { phase: options && options.phase, severity: sev },
        blastRadius: sev === 'critical' ? 'critical' : (sev === 'high' ? 'high' : 'medium'),
      });
      warn(`[layer-6-audit] ${sev}: ${reason}`);
    } catch (e) {
      warn(`[layer-6-audit] alarm write FAILED (graceful degrade): ${e.message}`);
    }
  }

  /** Tier 3 — auto-rollback. Public for explicit rollback by other modules. */
  async function autoRollback(checkpointId, options) {
    if (_inLayer6Audit) {
      return { restored: false, details: { error: 're-entrant blocked' } };
    }
    _inLayer6Audit = true;
    try {
      return await autoRollbackInternal(checkpointId, options || {});
    } finally {
      _inLayer6Audit = false;
    }
  }

  async function autoRollbackInternal(checkpointId, options) {
    if (!checkpointId || typeof checkpointId !== 'string') {
      return { restored: false, details: { error: 'checkpointId required (string)' } };
    }
    const feature = options.feature || 'unknown';
    if (isRateLimited(feature)) {
      return { restored: false, details: { error: 'rate-limited', feature } };
    }
    try {
      const result = await Promise.resolve(checkpoint.rollbackToCheckpoint(checkpointId));
      _lastRollbackByFeature.set(feature, clock());
      // Reuse existing rollback_executed ACTION_TYPE (already defined in
      // audit-logger). Log via direct emit, not via alarm() — Tier 3 has
      // its own provenance.
      await audit.writeAuditLog({
        action: 'rollback_executed',
        category: 'checkpoint',
        actor: 'system',
        target: checkpointId,
        targetType: 'checkpoint',
        result: result && result.success === false ? 'failure' : 'success',
        details: { feature, phase: options.phase, layer: 'layer-6-audit', autoTriggered: true },
        blastRadius: 'critical',
      });
      return { restored: result && result.success !== false, details: { checkpointId, result } };
    } catch (e) {
      try {
        await audit.writeAuditLog({
          action: 'rollback_executed',
          category: 'checkpoint',
          actor: 'system',
          target: checkpointId,
          targetType: 'checkpoint',
          result: 'failure',
          reason: e.message,
          details: { feature, phase: options.phase, layer: 'layer-6-audit', autoTriggered: true, error: e.message },
          blastRadius: 'critical',
        });
      } catch { /* graceful */ }
      return { restored: false, details: { error: e.message } };
    }
  }

  function isRateLimited(feature) {
    const last = _lastRollbackByFeature.get(feature);
    if (typeof last !== 'number') return false;
    return (clock() - last) < ROLLBACK_RATE_LIMIT_MS;
  }

  function findLatestCheckpoint(feature) {
    try {
      const list = checkpoint.listCheckpoints ? checkpoint.listCheckpoints(feature) : [];
      if (!Array.isArray(list) || list.length === 0) return null;
      return list[0];
    } catch {
      return null;
    }
  }

  return Object.freeze({
    auditPostHoc,
    alarm,
    autoRollback,
    classifySeverity,
    isInLayer6Audit,
  });
}

module.exports = {
  createLayer6Audit,
  classifySeverity,
  isInLayer6Audit,
  SEVERITY_ORDER,
  ROLLBACK_RATE_LIMIT_MS,
};
