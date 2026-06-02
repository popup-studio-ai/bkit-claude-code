'use strict';

/**
 * lib/quality/sqm-history.js — v2.1.19 S5 F5-3
 *
 * Append-only JSONL history of SQM measurements across releases.
 * One entry per release (manual refresh or CI-triggered).
 *
 * Schema (per entry):
 *   { measuredAt, gitCommit, bkitVersion, total, components, warnings, schemaVersion }
 *
 * Storage: `.bkit/state/sqm-history.jsonl` (one JSON object per line).
 *
 * Master plan ref: §4.5 F5-3 / §7.2 SQM trajectory tracking.
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_HISTORY_PATH = '.bkit/state/sqm-history.jsonl';

/**
 * Append a SQM measurement entry to history (atomic single line append).
 *
 * @param {object} entry - SqmResult-shaped object (lib/quality/sqm-calculator.js output)
 * @param {object} [opts] - { projectRoot?: string, filePath?: string }
 * @returns {{ ok: boolean, filePath: string, entryCount: number, error?: string }}
 */
function appendHistoryEntry(entry, opts = {}) {
  if (!entry || typeof entry !== 'object') {
    return { ok: false, filePath: null, entryCount: 0, error: 'entry must be an object' };
  }
  const projectRoot = opts.projectRoot || process.cwd();
  const filePath = opts.filePath
    ? path.resolve(projectRoot, opts.filePath)
    : path.resolve(projectRoot, DEFAULT_HISTORY_PATH);
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const line = JSON.stringify(entry) + '\n';
    // appendFileSync is atomic per write call on POSIX/macOS for short lines
    fs.appendFileSync(filePath, line);
    const stat = fs.statSync(filePath);
    const lineCount = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(Boolean).length;
    return { ok: true, filePath, entryCount: lineCount, size: stat.size };
  } catch (e) {
    return { ok: false, filePath, entryCount: 0, error: String(e.message || e) };
  }
}

/**
 * Load SQM history entries (newest last, optionally capped).
 *
 * @param {object} [opts] - { projectRoot?: string, filePath?: string, limit?: number }
 * @returns {object[]} array of entries (empty when file missing or malformed)
 */
function loadHistory(opts = {}) {
  const projectRoot = opts.projectRoot || process.cwd();
  const filePath = opts.filePath
    ? path.resolve(projectRoot, opts.filePath)
    : path.resolve(projectRoot, DEFAULT_HISTORY_PATH);
  if (!fs.existsSync(filePath)) return [];
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/).filter(Boolean);
    const parsed = lines
      .map((l) => { try { return JSON.parse(l); } catch (_) { return null; } })
      .filter(Boolean);
    if (typeof opts.limit === 'number' && opts.limit > 0) {
      return parsed.slice(-opts.limit);
    }
    return parsed;
  } catch (_) { return []; }
}

/**
 * Resolve the latest entry (most recent measurement). Returns null when empty.
 */
function latest(opts = {}) {
  const all = loadHistory(opts);
  return all.length > 0 ? all[all.length - 1] : null;
}

module.exports = {
  DEFAULT_HISTORY_PATH,
  appendHistoryEntry,
  loadHistory,
  latest,
};
