/**
 * Token Accountant — NDJSON append-only ledger for ENH-264 per-turn measurement.
 *
 * Design Ref: bkit-v2110-integrated-enhancement.design.md §3.2.3
 * Plan SC: Measurement only (No Guessing). No prompt body recorded.
 *
 * @module lib/cc-regression/token-accountant
 *
 * @version 2.1.12
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const enh264 = require('../domain/guards/enh-264-token-threshold');

const LEDGER_REL = '.bkit/runtime/token-ledger.ndjson';
const ARCHIVE_REL = '.bkit/runtime/archive/';
const RETENTION_DAYS = 30;

function getProjectRoot() {
  try {
    const plat = require('../core/platform');
    return plat.PROJECT_DIR;
  } catch {
    return process.cwd();
  }
}

function getLedgerPath() {
  return path.join(getProjectRoot(), LEDGER_REL);
}

function ensureDir(p) {
  try {
    fs.mkdirSync(p, { recursive: true });
  } catch {
    /* ignore — non-critical */
  }
}

/**
 * SHA-256 hash a session identifier (no PII stored).
 * @param {string} sessionId
 * @returns {string}
 */
function hashSession(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') return 'unknown';
  return crypto.createHash('sha256').update(sessionId).digest('hex').slice(0, 16);
}

/**
 * Record a turn to the NDJSON ledger. Prompt body is NEVER written.
 *
 * v2.1.12 Sprint A-1 (defect #17 fix): added cacheReadInputTokens,
 * cacheCreationInputTokens, parseStatus, parseWarnings to capture CC v2.1.118+
 * Opus 4.7 1M cache fields and surface payload parsing health.
 *
 * @param {Object} meta
 * @param {string} [meta.sessionId]
 * @param {string} [meta.agent]
 * @param {string} [meta.model]
 * @param {string} [meta.ccVersion]
 * @param {number} [meta.turnIndex]
 * @param {number} [meta.inputTokens]
 * @param {number} [meta.outputTokens]
 * @param {number} [meta.cacheReadInputTokens] - v2.1.12 cache hit tokens (Opus 4.7 1M)
 * @param {number} [meta.cacheCreationInputTokens] - v2.1.12 cache write tokens
 * @param {number} [meta.overheadDelta]
 * @param {number} [meta.sessionTotalOverhead]
 * @param {string} [meta.parseStatus] - v2.1.12 'ok' | 'no_payload' | 'partial'
 * @param {string|null} [meta.parseWarnings] - v2.1.12 free-form warning string
 * @returns {{ hit: boolean, meta?: Object }}
 */
function recordTurn(meta = {}) {
  const entry = {
    ts: new Date().toISOString(),
    sessionHash: hashSession(meta.sessionId),
    agent: typeof meta.agent === 'string' ? meta.agent : 'unknown',
    model: typeof meta.model === 'string' ? meta.model : 'unknown',
    ccVersion: typeof meta.ccVersion === 'string' ? meta.ccVersion : 'unknown',
    turnIndex: Number.isFinite(meta.turnIndex) ? meta.turnIndex : 0,
    inputTokens: Number.isFinite(meta.inputTokens) ? meta.inputTokens : 0,
    outputTokens: Number.isFinite(meta.outputTokens) ? meta.outputTokens : 0,
    cacheReadInputTokens: Number.isFinite(meta.cacheReadInputTokens) ? meta.cacheReadInputTokens : 0,
    cacheCreationInputTokens: Number.isFinite(meta.cacheCreationInputTokens) ? meta.cacheCreationInputTokens : 0,
    overheadDelta: Number.isFinite(meta.overheadDelta) ? meta.overheadDelta : 0,
    parseStatus: typeof meta.parseStatus === 'string' ? meta.parseStatus : 'unknown',
    parseWarnings: typeof meta.parseWarnings === 'string' ? meta.parseWarnings : null,
  };

  const ledgerPath = getLedgerPath();
  ensureDir(path.dirname(ledgerPath));

  try {
    fs.appendFileSync(ledgerPath, JSON.stringify(entry) + '\n', 'utf8');
  } catch (e) {
    if (process.env.BKIT_DEBUG) {
      // eslint-disable-next-line no-console
      console.error(`[TokenAccountant] append failed: ${e.message}`);
    }
  }

  // Evaluate threshold guard
  const guardResult = enh264.check({
    model: entry.model,
    inputTokens: entry.inputTokens,
    outputTokens: entry.outputTokens,
    overheadDelta: entry.overheadDelta,
    sessionTotalOverhead: meta.sessionTotalOverhead,
  });

  return guardResult;
}

/**
 * Read stats from ledger.
 * @returns {{ total: number, avgOverhead: number, sonnetTurns: number }}
 */
function getLedgerStats() {
  const ledgerPath = getLedgerPath();
  if (!fs.existsSync(ledgerPath)) {
    return { total: 0, avgOverhead: 0, sonnetTurns: 0 };
  }
  const lines = fs.readFileSync(ledgerPath, 'utf8').trim().split(/\r?\n/).filter(Boolean);
  let total = 0;
  let sumOverhead = 0;
  let sonnetTurns = 0;
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      total++;
      sumOverhead += entry.overheadDelta || 0;
      if (/sonnet/i.test(entry.model || '')) sonnetTurns++;
    } catch {
      /* skip malformed lines */
    }
  }
  return {
    total,
    avgOverhead: total > 0 ? Math.round(sumOverhead / total) : 0,
    sonnetTurns,
  };
}

/**
 * Rotate the ledger — archive entries older than RETENTION_DAYS.
 * (Simple implementation: rename current file to archive/YYYYMMDD.ndjson when size > 1MB.)
 */
function rotate() {
  const ledgerPath = getLedgerPath();
  if (!fs.existsSync(ledgerPath)) return;
  try {
    const stat = fs.statSync(ledgerPath);
    const ONE_MB = 1024 * 1024;
    if (stat.size < ONE_MB) return;
    const archiveDir = path.join(getProjectRoot(), ARCHIVE_REL);
    ensureDir(archiveDir);
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    fs.renameSync(ledgerPath, path.join(archiveDir, `token-ledger-${stamp}.ndjson`));
  } catch (e) {
    if (process.env.BKIT_DEBUG) {
      // eslint-disable-next-line no-console
      console.error(`[TokenAccountant] rotate failed: ${e.message}`);
    }
  }
}

module.exports = {
  recordTurn,
  getLedgerStats,
  rotate,
  hashSession,
  getLedgerPath,
  LEDGER_REL,
  RETENTION_DAYS,
};
