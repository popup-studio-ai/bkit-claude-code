/**
 * CachingCostCli — Infrastructure Adapter implementing caching-cost.port.
 *
 * 1:1 pair with lib/domain/ports/caching-cost.port.js (Sub-Sprint 1 invariant).
 *
 * Design Ref: docs/sprint/v2114/design.md §3.1
 * Plan SC: ENH-292 Sub-agent Caching 10x Mitigation.
 *
 * Persistence:
 *   - Writes append-only NDJSON to .bkit/runtime/caching-cost.ndjson
 *   - Pattern mirrors lib/cc-regression/token-accountant.js NDJSON ledger
 *
 * Ledger reuse (Option Y partial — CARRY-5 closure carry-on):
 *   Sub-Sprint 1 keeps a dedicated ledger to avoid coupling to token-accountant
 *   schema. Sub-Sprint 3 (A Observability) may extend query() to also read
 *   .bkit/runtime/token-ledger.ndjson and merge cache fields when available,
 *   closing CARRY-5 (#17 token-meter Adapter zero entries). For Sub-Sprint 1
 *   the contract surface is stable — extending query() later is additive.
 *
 * Failure mode: ALL IO is fail-silent. emit() / query() never throw, even on
 * permission denied / disk full / corrupt JSON. BKIT_DEBUG=1 enables stderr
 * diagnostics. This mirrors lib/infra/telemetry.js OTEL sink behavior — the
 * sub-agent-dispatcher hot path must never block on adapter unavailability.
 *
 * @module lib/infra/caching-cost-cli
 * @version 2.1.14
 * @since 2.1.14
 */

'use strict';

const fs = require('fs');
const path = require('path');

const {
  QUERY_CAP,
  classifyThreshold,
  computeHitRate,
  isCachingCostPort,
} = require('../domain/ports/caching-cost.port');

const LEDGER_REL = path.join('.bkit', 'runtime', 'caching-cost.ndjson');

// Lazy require for audit-logger (mirrors telemetry.js:27-31 to avoid
// circular dep — audit-logger may itself emit caching-cost events).
let _audit = null;
function getAudit() {
  if (!_audit) {
    try {
      _audit = require('../audit/audit-logger');
    } catch {
      _audit = { writeAuditLog: () => Promise.resolve() };
    }
  }
  return _audit;
}

/**
 * Internal helper — debug-only stderr diagnostic gated by BKIT_DEBUG.
 * @param {string} msg
 * @param {unknown} err
 */
function debug(msg, err) {
  if (!process.env.BKIT_DEBUG) return;
  // eslint-disable-next-line no-console
  console.error(`[caching-cost-cli] ${msg}${err ? `: ${err.message || err}` : ''}`);
}

/**
 * Create a CachingCostCli adapter instance.
 *
 * Factory pattern mirrors lib/infra/sprint-state-store.adapter.js
 * (createStateStore) and lib/infra/cc-bridge.js conventions.
 *
 * @param {{ projectRoot: string }} opts
 * @returns {import('../domain/ports/caching-cost.port').CachingCostPort}
 */
function createCachingCostCli(opts) {
  if (!opts || typeof opts.projectRoot !== 'string' || opts.projectRoot.length === 0) {
    throw new TypeError('createCachingCostCli: opts.projectRoot must be a non-empty string');
  }
  const ledgerPath = path.join(opts.projectRoot, LEDGER_REL);

  /**
   * Persist a single metrics record.
   *
   * Hot path: must be < 5 ms (subagent-stop-handler.js timeout budget is 5000 ms;
   * 0.1% headroom). NDJSON appendFileSync benchmarks ~1 ms on SSD per
   * tests/qa/v2113-sprint-3-infrastructure.test.js measurements of similar
   * token-accountant ledger writes.
   *
   * @param {import('../domain/ports/caching-cost.port').CacheMetrics} metrics
   * @returns {Promise<void>}
   */
  async function emit(metrics) {
    if (!metrics || typeof metrics !== 'object') {
      debug('emit: skip — metrics is not an object');
      return;
    }
    try {
      fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
      fs.appendFileSync(ledgerPath, JSON.stringify(metrics) + '\n', 'utf8');
    } catch (e) {
      debug('emit failed', e);
    }
  }

  /**
   * Read accumulated metrics, most recent first, capped at QUERY_CAP.
   *
   * Filter semantics: AND of provided fields. Missing fields → no filter
   * applied for that dimension. Corrupt JSON lines silently skipped.
   *
   * @param {import('../domain/ports/caching-cost.port').CachingCostFilter} [filter]
   * @returns {Promise<import('../domain/ports/caching-cost.port').CacheMetrics[]>}
   */
  async function query(filter) {
    try {
      if (!fs.existsSync(ledgerPath)) return [];
      const raw = fs.readFileSync(ledgerPath, 'utf8');
      const lines = raw.split(/\r?\n/).filter(Boolean).reverse(); // most recent first
      const out = [];
      for (const line of lines) {
        if (out.length >= QUERY_CAP) break;
        let m;
        try {
          m = JSON.parse(line);
        } catch {
          continue; // skip corrupt line
        }
        if (filter && filter.sessionHash && m.sessionHash !== filter.sessionHash) continue;
        if (filter && filter.agent && m.agent !== filter.agent) continue;
        if (filter && typeof filter.sinceMs === 'number' && m.timestamp < filter.sinceMs) continue;
        out.push(m);
      }
      return out;
    } catch (e) {
      debug('query failed', e);
      return [];
    }
  }

  /**
   * Delegate to Domain pure fn so the classification policy stays in one place.
   * @param {import('../domain/ports/caching-cost.port').CacheMetrics} metrics
   * @returns {import('../domain/ports/caching-cost.port').ThresholdLevel}
   */
  function threshold(metrics) {
    return classifyThreshold(metrics);
  }

  return Object.freeze({ emit, query, threshold });
}

/**
 * Build a CacheMetrics record from raw token counters. Helper for
 * subagent-stop-handler.js and other emit sites — fills hitRate and
 * timestamp so call sites stay terse.
 *
 * @param {Object} fields
 * @param {number} fields.cacheCreationTokens
 * @param {number} fields.cacheReadTokens
 * @param {number} [fields.requestTokens]
 * @param {string} fields.sessionHash
 * @param {string} fields.agent
 * @param {import('../domain/ports/caching-cost.port').DispatchMode} fields.dispatchMode
 * @param {number} [fields.timestamp] — unix ms; defaults to Date.now()
 * @returns {import('../domain/ports/caching-cost.port').CacheMetrics}
 */
function buildMetrics(fields) {
  const cacheCreationTokens = Number(fields.cacheCreationTokens) || 0;
  const cacheReadTokens = Number(fields.cacheReadTokens) || 0;
  return {
    cacheCreationTokens,
    cacheReadTokens,
    requestTokens: Number(fields.requestTokens) || 0,
    hitRate: computeHitRate(cacheReadTokens, cacheCreationTokens),
    sessionHash: String(fields.sessionHash || ''),
    agent: String(fields.agent || ''),
    timestamp: typeof fields.timestamp === 'number' ? fields.timestamp : Date.now(),
    dispatchMode: fields.dispatchMode || 'sequential',
  };
}

module.exports = {
  createCachingCostCli,
  buildMetrics,
  // Re-exported for callers that don't want to also import the Port directly.
  isCachingCostPort,
};
