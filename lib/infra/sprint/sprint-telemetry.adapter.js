/**
 * sprint-telemetry.adapter.js — SprintEvents → audit-log + OTEL dual sink (v2.1.13 Sprint 3).
 *
 * Implements the Sprint 2 `deps.eventEmitter` interface as a sync function
 * that converts a SprintEvent into an audit-log entry and writes it via the
 * existing `lib/audit/audit-logger.writeAuditLog`. The audit logger already
 * mirrors to OTEL internally (Sprint 4.5 bug-fix on 2026-04-22), so this
 * adapter does NOT import `lib/infra/telemetry.js` and does NOT compose
 * `createDualSink` — both would re-introduce the file/OTEL recursion that
 * caused the 682 GB log incident.
 *
 * Additionally, an opt-in direct OTLP HTTP POST is fired when an explicit
 * `otelEndpoint` is configured (env `OTEL_ENDPOINT` or factory option). This
 * is fire-and-forget with a 5-second timeout — errors are swallowed so they
 * cannot abort a sprint run.
 *
 * Design Ref: docs/02-design/features/v2113-sprint-3-infrastructure.design.md §5
 * Cross-Sprint contract: Sprint 2 `start-sprint.usecase.js` deps.eventEmitter.
 *
 * @module lib/infra/sprint/sprint-telemetry.adapter
 * @version 2.1.13
 * @since 2.1.13
 */

const { writeAuditLog } = require('../../audit/audit-logger');
const { isValidSprintEvent } = require('../../domain/sprint');

const OTEL_TIMEOUT_MS = 5000;
const DEFAULT_SERVICE_NAME = 'bkit';

/**
 * Map a SprintEvent into the audit-logger entry shape.
 *
 * @param {Object} event - SprintEvent (validated by caller)
 * @param {{ otelServiceName?: string, agentId?: string, parentAgentId?: string }} _opts
 * @returns {Object} entry shape consumed by audit-logger normalizeEntry
 */
function eventToAuditEntry(event, _opts) {
  const t = event.type;
  const p = (event && event.payload) || {};
  const base = {
    timestamp: event.timestamp,
    actor: 'system',
    // v2.1.13 QA-6 fix: use 'sprint' category (added to CATEGORIES enum in
    // DEEP-4) so audit-logger preserves the sprint domain instead of coercing
    // to 'control' fallback. Aligns with master-plan.usecase emitAuditEvent.
    category: 'sprint',
    target: p.sprintId || '',
    targetType: 'feature',
    details: { ...p, sprintEventType: t },
  };
  switch (t) {
    case 'SprintCreated':
      return { ...base, action: 'feature_created', result: 'success' };
    case 'SprintPhaseChanged':
      return { ...base, action: 'phase_transition', result: 'success', reason: p.reason || null };
    case 'SprintArchived':
      return { ...base, action: 'feature_archived', result: 'success', reason: p.reason || null };
    case 'SprintPaused':
      // Custom action — audit-logger passes through unknown action strings.
      return { ...base, action: 'sprint_paused', result: 'blocked', reason: p.message || null };
    case 'SprintResumed':
      return { ...base, action: 'sprint_resumed', result: 'success' };
    default:
      return { ...base, action: 'unknown', result: 'success' };
  }
}

/**
 * Build minimal OTLP log payload for direct emission.
 *
 * @param {Object} event - SprintEvent
 * @param {{ otelServiceName?: string, agentId?: string, parentAgentId?: string, bkitVersion?: string }} opts
 * @returns {Object}
 */
function buildOtelPayload(event, opts) {
  const t = event.type;
  const p = (event && event.payload) || {};
  const attributes = [
    { key: 'bkit.sprint.id', value: { stringValue: String(p.sprintId || '') } },
    { key: 'bkit.sprint.event_type', value: { stringValue: t } },
  ];
  if (p.fromPhase) attributes.push({ key: 'bkit.sprint.from_phase', value: { stringValue: String(p.fromPhase) } });
  if (p.toPhase) attributes.push({ key: 'bkit.sprint.to_phase', value: { stringValue: String(p.toPhase) } });
  if (p.trigger) attributes.push({ key: 'bkit.sprint.trigger_id', value: { stringValue: String(p.trigger) } });
  if (p.severity) attributes.push({ key: 'bkit.sprint.severity', value: { stringValue: String(p.severity) } });
  if (opts.agentId) attributes.push({ key: 'agent_id', value: { stringValue: String(opts.agentId) } });
  if (opts.parentAgentId) attributes.push({ key: 'parent_agent_id', value: { stringValue: String(opts.parentAgentId) } });

  return {
    resourceLogs: [{
      resource: {
        attributes: [
          { key: 'service.name', value: { stringValue: opts.otelServiceName || DEFAULT_SERVICE_NAME } },
          { key: 'bkit.version', value: { stringValue: opts.bkitVersion || 'unknown' } },
        ],
      },
      scopeLogs: [{
        scope: { name: 'bkit-sprint' },
        logRecords: [{
          timeUnixNano: String(new Date(event.timestamp).getTime() * 1_000_000),
          severityText: (t === 'SprintPaused') ? 'WARN' : 'INFO',
          body: { stringValue: t },
          attributes,
        }],
      }],
    }],
  };
}

/**
 * Fire-and-forget OTLP HTTP POST. Errors swallowed.
 *
 * @param {string} endpoint
 * @param {Object} payload
 */
function postOtelLog(endpoint, payload) {
  let lib;
  let urlObj;
  try {
    urlObj = new URL(endpoint);
    lib = urlObj.protocol === 'https:' ? require('node:https') : require('node:http');
  } catch (_e) { return; }

  const body = JSON.stringify(payload);
  const options = {
    hostname: urlObj.hostname,
    port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
    path: (urlObj.pathname || '/') + (urlObj.search || ''),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
    timeout: OTEL_TIMEOUT_MS,
  };

  try {
    const req = lib.request(options);
    req.on('error', () => { /* swallow */ });
    req.on('timeout', () => {
      try { req.destroy(); } catch (_e) { /* ignore */ }
    });
    // Drain response to allow socket release
    req.on('response', (res) => { res.on('data', () => {}); res.on('end', () => {}); });
    req.write(body);
    req.end();
  } catch (_e) { /* swallow */ }
}

/**
 * @typedef {Object} EventEmitterAdapter
 * @property {(event: Object) => void} emit
 * @property {() => Promise<void>} flush
 */

/**
 * Factory for the Sprint event emitter.
 *
 * @param {{ projectRoot: string, injectedProjectRoot?: string|null, otelEndpoint?: string, otelServiceName?: string, agentId?: string, parentAgentId?: string, bkitVersion?: string }} opts
 *   `injectedProjectRoot` (v2.1.26 I-12, test isolation): when non-empty, the
 *   audit file sink writes under `<injectedProjectRoot>/.bkit/audit` instead
 *   of the platform PROJECT_DIR. Omitted/null = current runtime behavior
 *   (audit-logger resolves its own default) — exactly unchanged.
 * @returns {EventEmitterAdapter}
 */
function createEventEmitter(opts) {
  if (!opts || typeof opts.projectRoot !== 'string' || opts.projectRoot.length === 0) {
    throw new TypeError('createEventEmitter: projectRoot must be a non-empty string');
  }
  const endpoint = opts.otelEndpoint || process.env.OTEL_ENDPOINT || null;
  const serviceName = opts.otelServiceName || process.env.OTEL_SERVICE_NAME || DEFAULT_SERVICE_NAME;
  const injectedProjectRoot =
    (typeof opts.injectedProjectRoot === 'string' && opts.injectedProjectRoot.length > 0)
      ? opts.injectedProjectRoot
      : null;
  const inheritedOpts = {
    otelServiceName: serviceName,
    agentId: opts.agentId || process.env.CLAUDE_AGENT_ID || null,
    parentAgentId: opts.parentAgentId || process.env.CLAUDE_PARENT_AGENT_ID || null,
    bkitVersion: opts.bkitVersion || null,
  };

  function emit(event) {
    if (!isValidSprintEvent(event)) return;
    // 1) File sink via audit-logger (the canonical writer for .bkit/audit/YYYY-MM-DD.jsonl).
    //    audit-logger internally mirrors to OTEL via its own otel-only sink since Sprint 4.5.
    //    v2.1.26 (I-12): honor an explicitly injected project root so tests
    //    never append to the developer's real .bkit/audit.
    try {
      writeAuditLog(
        eventToAuditEntry(event, inheritedOpts),
        injectedProjectRoot ? { projectRoot: injectedProjectRoot } : undefined
      );
    } catch (_e) { /* swallow */ }
    // 2) Opt-in direct OTLP HTTP POST when an explicit endpoint is configured.
    if (endpoint) {
      try { postOtelLog(endpoint, buildOtelPayload(event, inheritedOpts)); } catch (_e) { /* swallow */ }
    }
  }

  async function flush() {
    // writeAuditLog is sync. HTTP requests are fire-and-forget.
    return undefined;
  }

  return { emit, flush };
}

module.exports = {
  createEventEmitter,
  // Exported for unit testing of pure transform functions.
  eventToAuditEntry,
  buildOtelPayload,
};
