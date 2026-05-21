/**
 * Audit Logger - JSONL-based audit logging system
 * @module lib/audit/audit-logger
 * @version 2.1.10
 *
 * Records all significant actions in bkit for transparency and traceability.
 * Storage: .bkit/audit/YYYY-MM-DD.jsonl (one JSON object per line)
 *
 * Design Reference: docs/02-design/features/bkit-v200-controllable-ai.design.md
 */

const fs = require('fs');
const path = require('path');
const { generateUUID } = require('../core/constants');

// Lazy require to avoid circular dependency
let _platform = null;
function getPlatform() {
  if (!_platform) { _platform = require('../core/platform'); }
  return _platform;
}

// ============================================================
// Constants
// ============================================================

const { BKIT_VERSION } = require('../core/version');
const DEFAULT_RETENTION_DAYS = 30;

/** @enum {string} Valid action types */
const ACTION_TYPES = [
  'phase_transition',
  'feature_created',
  'feature_archived',
  'file_created',
  'file_modified',
  'file_deleted',
  'config_changed',
  'automation_level_changed',
  'checkpoint_created',
  'rollback_executed',
  'agent_spawned',
  'agent_completed',
  'agent_failed',
  'gate_passed',
  // 'gate_failed' details schema (v2.1.16, Issue #93 F4 expansion — no enum change):
  //   { sprintId, phase, targetPhase, failedGates: [{ gateKey, current, threshold, reason }],
  //     reportPath (optional: relative path under docs/03-analysis/ when
  //     failure-reporter is wired through sprint-handler.handlePhase) }
  // Emitted by sprint-handler.handlePhase when advancePhase returns
  // reason: 'gate_fail' (v2.1.16 #93). Pre-v2.1.16 callers (tool-failure-handler,
  // gap-detector-stop) continue to write their own narrower details — both shapes
  // remain valid (details is pass-through sanitized).
  'gate_failed',
  'destructive_blocked',
  // v2.1.13 Sprint 4 — Sprint Management lifecycle events
  'sprint_paused',
  'sprint_resumed',
  'master_plan_created', // S2-UX v2.1.13 — Master Plan Generator
  // v2.1.13 (DEEP-4 fix): ENH-156 task tracking — task-created-handler emits
  // this on every Task tool spawn; was missing from enum, silently bypassed
  // via entry.action fallback. Now properly normalized.
  'task_created',
  // v2.1.14 Sub-Sprint 2 (Defense) — 6 ENH-specific actions
  'layer_6_audit_completed',   // ENH-289 Tier 1 — PostToolUse post-hoc audit passed
  'layer_6_alarm_triggered',   // ENH-289 Tier 2 — severity ≥ medium alarm raised
  'heredoc_bypass_blocked',    // ENH-310 — heredoc-pipe critical pattern detected
  'git_push_intercepted',      // ENH-298 — push-event-guard ask/deny verdict
  'post_tool_block_recorded',  // ENH-303 — PostToolUse continueOnBlock + reason emitted
  'hook_reachability_lost',    // MON-CC-NEW-PLUGIN-HOOK-DROP — SessionStart sanity miss
  // v2.1.14 Sub-Sprint 4 (E Defense) — slot reserved
  'memory_directive_enforced', // ENH-286 — CLAUDE.md directive deny-list match
  // v2.1.16 (Issue #95, F2) — --approve scope-boundary single-use escape hatch.
  // Recorded when handlePhase receives `args.approve === true` and the
  // requested transition would otherwise return reason 'requires_user_approval'.
  // details schema: { sprintId, from, to, trustLevel, stopAfter, approvedBy, reason }
  // Single-use semantic: does NOT mutate sprint.autoRun.scope; next transition
  // still subject to the same scope check.
  'scope_boundary_approved',
  // v2.1.16 (Issue #94, F3) — /sprint measure single-gate / multi-gate / phase
  // measurement command. Emitted by measure-gate.usecase via handleMeasure
  // after measure-router dispatches the routed agent and a numeric value is
  // recorded into sprint.qualityGates[<field>].
  // details schema: { sprintId, gateKey, field, agent, value, threshold,
  //                   passed, source ('manual'|'auto'), phase, trustLevel,
  //                   previousValue }
  // Preview mode (Trust L0/L1) does NOT emit this entry — only state-changing
  // measurements are auditable.
  'gate_measured',
  // v2.1.18 (Issue #101, F2) — /sprint trust mutation command.
  // Emitted by handleTrust when sprint.autoRun.trustLevelAtStart is mutated.
  // details schema: {
  //   sprintId, from, to, reason ('text'|null),
  //   trustScoreAtMutation (number|null, from .bkit/state/trust-profile.json),
  //   forced (boolean), noop (boolean — true on idempotent from===to path),
  //   actor ('user'|'agent'|'system'),
  //   timestamp (ISO string)
  // }
  // Idempotent path (from === to) ALSO emits with noop:true (CTO §C3:
  // 모니터링 사각지대 차단). Major downgrades (≥2 levels) or --force
  // bumped to blastRadius='high' for Defense Layer 6 alarm trigger.
  // actor auto-detected to 'agent' when CLAUDE_AGENT_ID env var is set
  // (CTO §E6 spoofing mitigation).
  'sprint_trust_changed',
  // v2.1.19 S0 (CTO M-3) — SQM (Sprint Quality Maturity Index) baseline measurement.
  // Emitted by scripts/_v2119-s0-measure.js (and future S5 lib/quality/sqm-calculator.js).
  // details schema: {
  //   total (number 0-100),
  //   components (object — 6 components × { value, weight, weighted, raw }),
  //   gitCommit (string), bkitVersion (string),
  //   warnings (string[]),
  //   asOf (ISO string|null), measuredAt (ISO string)
  // }
  // Action recorded once per measurement run; S5 evolves into per-release append.
  'sqm_baseline_measured',
  // v2.1.19 S1 (F1-2) — bkit self-dogfood sprint container started.
  // Emitted by sprint-handler.handleDogfood when a release-version sprint
  // container is initialized for self-dogfooding (master plan §19 CI gate callee).
  // details schema: {
  //   sprintId (string — 'self-dogfood-<release>'),
  //   releaseVersion (string — semver),
  //   releaseTag (string — git tag),
  //   bkitVersion (string), bkitCommit (string)
  // }
  'sprint_dogfood_started',
  // v2.1.19 S1 (F1-3) — check-self-dogfood gate bootstrap exception activated.
  // Emitted by scripts/_check-self-dogfood-helper.js when --bootstrap-mode flag
  // skips invariant #1 (recent release as sprint container). One-shot per
  // bkit release; v2.1.20 expected to be first true gate activation.
  // details schema: {
  //   predecessorVersion (string), targetActivation (string),
  //   checkedReleases (array — invariant snapshot)
  // }
  'sprint_bootstrap_mode_activated',
  // v2.1.19 S1 (F1-4) — sprint init with --trust L1 explicit warning.
  // Emitted by sprint-handler.handleInit when args.trust or args.trustLevel
  // equals 'L1'. Recorded to surface lockout-risk education trail.
  // details schema: {
  //   sprintId (string), attemptedLevel: 'L1',
  //   recommendedAction (string — '/sprint trust ...'),
  //   warningMessage (string)
  // }
  'sprint_trust_warning',
  // v2.1.19 S1 (F1-5) — /sprint annotate post-hoc annotation appended.
  // Emitted by sprint-handler.handleAnnotate when an entry is pushed to
  // sprint.annotations[]. Allowed on any phase (including archived) —
  // forward-only invariant preserved (phase not mutated).
  // details schema: {
  //   sprintId (string), annotationIndex (number, 0-based),
  //   reason (string), at (ISO string)
  // }
  'sprint_annotated',
  // v2.1.19 S1 (F1-3) — emergency override of self-dogfood CI gate.
  // Emitted by scripts/_check-self-dogfood-helper.js when --emergency-override
  // <reason> flag bypasses all invariants. SQM penalty -10 applied at S5.
  // details schema: {
  //   reason (string — operator-provided),
  //   checkedReleases (array — invariant snapshot of skipped checks)
  // }
  'self_dogfood_emergency_override',
];

/** @enum {string} Valid categories */
// v2.1.8 fix B2: extended CATEGORIES enum to preserve convenience logger categories
// v2.1.13 (관점 1-1 DEEP-4 fix): added 'sprint' category for Sprint Management
// domain events emitted by sprint-lifecycle UCs + task-created-handler.
const CATEGORIES = ['pdca', 'sprint', 'file', 'config', 'control', 'team', 'quality', 'permission', 'checkpoint', 'trust', 'system'];

/** @enum {string} Valid result values */
const RESULTS = ['success', 'failure', 'blocked', 'skipped'];

/** @enum {string} Valid actor types */
const ACTORS = ['user', 'agent', 'system', 'hook'];

/** @enum {string} Valid target types */
const TARGET_TYPES = ['feature', 'file', 'config', 'agent', 'checkpoint'];

/** @enum {string} Valid blast radius levels */
const BLAST_RADII = ['low', 'medium', 'high', 'critical'];

// ============================================================
// Helpers
// ============================================================

/**
 * Get the audit directory path
 * @returns {string} Absolute path to .bkit/audit/
 */
function getAuditDir() {
  return path.join(getPlatform().PROJECT_DIR, '.bkit', 'audit');
}

/**
 * Get JSONL file path for a given date
 * @param {string|Date} [date] - Date to use (defaults to today)
 * @returns {string} Absolute path to YYYY-MM-DD.jsonl
 */
function getAuditFilePath(date) {
  const d = date instanceof Date ? date : (date ? new Date(date) : new Date());
  const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(getAuditDir(), `${dateStr}.jsonl`);
}

/**
 * Ensure audit directory exists
 */
function ensureAuditDir() {
  const dir = getAuditDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// v2.1.10 (C2 fix, Plan §11.1): Sensitive key blacklist + value length cap.
// Prevents accidental PII/token leakage into .bkit/audit/*.jsonl.
const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /authorization/i,
  /cookie/i,
  /session[_-]?key/i,
  /private[_-]?key/i,
];
const DETAILS_VALUE_MAX_CHARS = 500;

/**
 * Sanitize the `details` object before logging.
 * - Redacts values for keys matching SENSITIVE_KEY_PATTERNS
 * - Truncates string values exceeding DETAILS_VALUE_MAX_CHARS
 * - Drops non-serializable keys
 *
 * @param {*} details - Raw details object (may be null/undefined/non-object)
 * @returns {Object} Sanitized details (always plain object, safe to JSON.stringify)
 */
function sanitizeDetails(details) {
  if (!details || typeof details !== 'object' || Array.isArray(details)) return {};
  const out = {};
  for (const [key, value] of Object.entries(details)) {
    // Redact by key pattern
    if (SENSITIVE_KEY_PATTERNS.some((re) => re.test(key))) {
      out[key] = '[REDACTED]';
      continue;
    }
    // Truncate long string values
    if (typeof value === 'string' && value.length > DETAILS_VALUE_MAX_CHARS) {
      out[key] = value.slice(0, DETAILS_VALUE_MAX_CHARS) + '…[truncated]';
      continue;
    }
    // Pass-through primitives and shallow objects/arrays
    if (
      value === null ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'string'
    ) {
      out[key] = value;
    } else if (Array.isArray(value)) {
      // v2.1.16 (Issue #93 F4): preserve Array shape — earlier revision
      // converted arrays into objects via Object.entries, breaking callers
      // that asserted Array.isArray on audit details (e.g. failedGates).
      // Shallow-sanitize each element: primitives pass through, objects
      // get the same nested-key redaction loop, anything else becomes
      // '[non-serializable]' to keep JSONL safe.
      try {
        out[key] = value.map((el) => {
          if (el === null) return null;
          if (typeof el === 'number' || typeof el === 'boolean') return el;
          if (typeof el === 'string') {
            return el.length > DETAILS_VALUE_MAX_CHARS
              ? el.slice(0, DETAILS_VALUE_MAX_CHARS) + '…[truncated]'
              : el;
          }
          if (typeof el === 'object') {
            const nested = {};
            for (const [nk, nv] of Object.entries(el)) {
              if (SENSITIVE_KEY_PATTERNS.some((re) => re.test(nk))) {
                nested[nk] = '[REDACTED]';
              } else if (typeof nv === 'string' && nv.length > DETAILS_VALUE_MAX_CHARS) {
                nested[nk] = nv.slice(0, DETAILS_VALUE_MAX_CHARS) + '…[truncated]';
              } else {
                nested[nk] = nv;
              }
            }
            return nested;
          }
          return '[non-serializable]';
        });
      } catch {
        out[key] = '[non-serializable]';
      }
    } else if (typeof value === 'object') {
      // Shallow recursion (one level) to sanitize nested sensitive keys
      try {
        const nested = {};
        for (const [nk, nv] of Object.entries(value)) {
          if (SENSITIVE_KEY_PATTERNS.some((re) => re.test(nk))) {
            nested[nk] = '[REDACTED]';
          } else if (typeof nv === 'string' && nv.length > DETAILS_VALUE_MAX_CHARS) {
            nested[nk] = nv.slice(0, DETAILS_VALUE_MAX_CHARS) + '…[truncated]';
          } else {
            nested[nk] = nv;
          }
        }
        out[key] = nested;
      } catch {
        out[key] = '[non-serializable]';
      }
    }
  }
  return out;
}

/**
 * Validate an audit log entry and fill defaults
 * @param {Object} entry - Partial audit log entry
 * @returns {Object} Complete AuditLogEntry
 */
function normalizeEntry(entry) {
  return {
    id: entry.id || generateUUID(),
    timestamp: entry.timestamp || new Date().toISOString(),
    sessionId: entry.sessionId || '',
    actor: ACTORS.includes(entry.actor) ? entry.actor : 'system',
    actorId: entry.actorId || '',
    action: ACTION_TYPES.includes(entry.action) ? entry.action : entry.action || 'unknown',
    category: CATEGORIES.includes(entry.category) ? entry.category : 'control',
    target: entry.target || '',
    targetType: TARGET_TYPES.includes(entry.targetType) ? entry.targetType : 'feature',
    details: sanitizeDetails(entry.details), // v2.1.10 (C2 fix): was pass-through; now redacted+capped
    result: RESULTS.includes(entry.result) ? entry.result : 'success',
    reason: entry.reason || null,
    destructiveOperation: Boolean(entry.destructiveOperation),
    blastRadius: BLAST_RADII.includes(entry.blastRadius) ? entry.blastRadius : null,
    bkitVersion: BKIT_VERSION,
  };
}

// ============================================================
// Public API
// ============================================================

// v2.1.10 Sprint 4.5 — OTEL-only telemetry mirror (fire-and-forget).
//
// 🚨 CRITICAL BUG FIX (2026-04-22):
// Previous revision called `telemetry.createDualSink()` which internally composes
// `createFileSink()` + `createOtelSink()`. The file sink in turn delegates back
// to `audit-logger.writeAuditLog()`, creating **infinite recursion**:
//
//   writeAuditLog → createDualSink.emit → createFileSink.emit → writeAuditLog → …
//
// Each recursion appends a new JSONL line, exponentially amplifying a single
// call into gigabytes of data. This caused 2026-04-22 audit log to exceed
// 682 GB and trigger system-wide ENOSPC during the Sprint 4.5 integration
// session.
//
// Fix: use `createOtelSink()` only (no file sink). audit-logger is **already**
// the file-writing authority; telemetry's role here is OTEL mirror only.
//
// Lesson: the `createDualSink` Facade composes modules that must not cycle.
// `createFileSink` delegating to `audit-logger` was the architectural mistake.
let _telemetryOtelSink = null;
function getTelemetrySink() {
  if (_telemetryOtelSink === null) {
    try {
      // OTEL sink only — no file sink to avoid audit-logger self-recursion.
      _telemetryOtelSink = require('../infra/telemetry').createOtelSink();
    } catch {
      _telemetryOtelSink = false; // do not retry
    }
  }
  return _telemetryOtelSink || null;
}

/**
 * Append an audit log entry to the daily JSONL file.
 *
 * v2.1.10 Sprint 4.5: Also mirrors to OTEL sink (fire-and-forget) when
 *   OTEL_ENDPOINT env is set. When OTEL_ENDPOINT is not set, the sink is
 *   a no-op so overhead is 0.
 *
 * @param {Object} entry - Partial or complete AuditLogEntry
 */
function writeAuditLog(entry) {
  try {
    ensureAuditDir();
    const normalized = normalizeEntry(entry);
    const line = JSON.stringify(normalized) + '\n';
    const filePath = getAuditFilePath(new Date(normalized.timestamp));
    fs.appendFileSync(filePath, line, 'utf8');

    // Sprint 4.5 (bug-fixed): OTEL-only mirror. Never calls back into
    // audit-logger, eliminating the recursion risk that caused the 682 GB
    // incident on 2026-04-22.
    const otelSink = getTelemetrySink();
    if (otelSink && typeof otelSink.emit === 'function') {
      Promise.resolve(
        otelSink.emit({
          type: `audit.${normalized.action}`,
          id: normalized.id,
          meta: {
            severity: normalized.result === 'blocked' ? 'WARN' : 'INFO',
            category: normalized.category,
            target: normalized.target,
            targetType: normalized.targetType,
            actor: normalized.actor,
            destructive: normalized.destructiveOperation ? '1' : '0',
          },
        })
      ).catch(() => {
        /* fire-and-forget */
      });
    }
  } catch (e) {
    // Audit logging is non-critical; never throw
    if (process.env.BKIT_DEBUG) {
      console.error(`[AuditLogger] Write failed: ${e.message}`);
    }
  }
}

/**
 * Read audit log entries with optional filters
 * @param {Object} [options] - Filter options
 * @param {string|Date} [options.date] - Date to read (defaults to today)
 * @param {string} [options.feature] - Filter by target feature name
 * @param {string} [options.action] - Filter by action type
 * @param {string} [options.category] - Filter by category
 * @param {string} [options.actor] - Filter by actor type
 * @param {number} [options.limit] - Maximum entries to return (0 = unlimited)
 * @returns {Object[]} Array of AuditLogEntry objects
 */
function readAuditLogs(options = {}) {
  try {
    const filePath = getAuditFilePath(options.date);
    if (!fs.existsSync(filePath)) return [];

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);

    let entries = lines.map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);

    // Apply filters
    if (options.feature) {
      entries = entries.filter(e => e.target === options.feature);
    }
    if (options.action) {
      entries = entries.filter(e => e.action === options.action);
    }
    if (options.category) {
      entries = entries.filter(e => e.category === options.category);
    }
    if (options.actor) {
      entries = entries.filter(e => e.actor === options.actor);
    }

    // Apply limit
    if (options.limit && options.limit > 0) {
      entries = entries.slice(-options.limit);
    }

    return entries;
  } catch (e) {
    if (process.env.BKIT_DEBUG) {
      console.error(`[AuditLogger] Read failed: ${e.message}`);
    }
    return [];
  }
}

/**
 * Generate a summary of the day's audit actions
 * @param {string|Date} [date] - Date to summarize (defaults to today)
 * @returns {Object} Summary with counts by action, category, result, actor
 */
function generateDailySummary(date) {
  const entries = readAuditLogs({ date });

  const summary = {
    date: (date instanceof Date ? date : (date ? new Date(date) : new Date())).toISOString().slice(0, 10),
    totalEntries: entries.length,
    byAction: {},
    byCategory: {},
    byResult: {},
    byActor: {},
    destructiveCount: 0,
    criticalCount: 0,
    features: [],
    firstEntry: entries.length > 0 ? entries[0].timestamp : null,
    lastEntry: entries.length > 0 ? entries[entries.length - 1].timestamp : null,
  };

  const featureSet = new Set();

  for (const entry of entries) {
    // Count by action
    summary.byAction[entry.action] = (summary.byAction[entry.action] || 0) + 1;

    // Count by category
    summary.byCategory[entry.category] = (summary.byCategory[entry.category] || 0) + 1;

    // Count by result
    summary.byResult[entry.result] = (summary.byResult[entry.result] || 0) + 1;

    // Count by actor
    summary.byActor[entry.actor] = (summary.byActor[entry.actor] || 0) + 1;

    // Track destructive operations
    if (entry.destructiveOperation) summary.destructiveCount++;

    // Track critical blast radius
    if (entry.blastRadius === 'critical') summary.criticalCount++;

    // Collect unique features
    if (entry.target && entry.targetType === 'feature') {
      featureSet.add(entry.target);
    }
  }

  summary.features = Array.from(featureSet);

  return summary;
}

/**
 * Delete audit log files older than the retention period
 * @param {number} [retentionDays=30] - Number of days to retain
 * @returns {number} Number of files deleted
 */
function cleanupOldLogs(retentionDays = DEFAULT_RETENTION_DAYS) {
  try {
    const auditDir = getAuditDir();
    if (!fs.existsSync(auditDir)) return 0;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const files = fs.readdirSync(auditDir).filter(f => f.endsWith('.jsonl'));
    let deleted = 0;

    for (const file of files) {
      const dateStr = file.replace('.jsonl', '');
      // Compare date strings lexicographically (YYYY-MM-DD format)
      if (dateStr < cutoffStr) {
        try {
          fs.unlinkSync(path.join(auditDir, file));
          deleted++;
        } catch (e) {
          if (process.env.BKIT_DEBUG) {
            console.error(`[AuditLogger] Failed to delete ${file}: ${e.message}`);
          }
        }
      }
    }

    return deleted;
  } catch (e) {
    if (process.env.BKIT_DEBUG) {
      console.error(`[AuditLogger] Cleanup failed: ${e.message}`);
    }
    return 0;
  }
}

// ============================================================
// Module Exports
// ============================================================

// Category-specific convenience loggers
function logControl(details) { return writeAuditLog({ ...details, category: 'control' }); }
function logPermission(details) { return writeAuditLog({ ...details, category: 'permission' }); }
function logCheckpoint(details) { return writeAuditLog({ ...details, category: 'checkpoint' }); }
function logPdca(details) { return writeAuditLog({ ...details, category: 'pdca' }); }
function logTrust(details) { return writeAuditLog({ ...details, category: 'trust' }); }
function logSystem(details) { return writeAuditLog({ ...details, category: 'system' }); }

/**
 * Generate weekly summary of audit logs
 * @param {string} [weekStart] - ISO date of week start (defaults to 7 days ago)
 * @returns {Object} Weekly summary
 */
function generateWeeklySummary(weekStart) {
  const start = weekStart ? new Date(weekStart) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  const dailySummaries = [];

  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    dailySummaries.push({ date: dateStr, ...generateDailySummary(dateStr) });
  }

  return {
    weekStart: start.toISOString().split('T')[0],
    weekEnd: end.toISOString().split('T')[0],
    dailySummaries,
    totalActions: dailySummaries.reduce((sum, d) => sum + (d.totalActions || 0), 0),
  };
}

/**
 * Get session statistics from today's logs
 *
 * v2.1.10 (C1 fix, Plan §11.1): `readAuditLogs` does not support `startDate`;
 *   supply `date` so today's log is read explicitly (prior code silently
 *   defaulted to today, but passed a dead option which obscured intent).
 *
 * @returns {{ totalActions: number, byCategory: Object, byResult: Object }}
 */
function getSessionStats() {
  const today = new Date().toISOString().split('T')[0];
  const logs = readAuditLogs({ date: today }); // C1 fix: was { startDate: today } (dead option)
  const byCategory = {};
  const byResult = {};

  for (const log of logs) {
    byCategory[log.category] = (byCategory[log.category] || 0) + 1;
    byResult[log.result] = (byResult[log.result] || 0) + 1;
  }

  return { totalActions: logs.length, byCategory, byResult };
}

module.exports = {
  writeAuditLog,
  readAuditLogs,
  generateDailySummary,
  generateWeeklySummary,
  cleanupOldLogs,
  getSessionStats,
  // Category-specific loggers
  logControl,
  logPermission,
  logCheckpoint,
  logPdca,
  logTrust,
  logSystem,
  // Constants (for external validation)
  ACTION_TYPES,
  CATEGORIES,
  RESULTS,
  ACTORS,
  TARGET_TYPES,
  BLAST_RADII,
  BKIT_VERSION,
  // Helpers (for testing)
  generateUUID,
  getAuditDir,
  getAuditFilePath,
};
