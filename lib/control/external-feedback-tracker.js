'use strict';

/**
 * lib/control/external-feedback-tracker.js — v2.1.19 S4 F4-2
 *
 * External dogfooder feedback tracker. Provides the source data for the
 * Trust Score 7th component `externalDogfoodFeedbackResponseRate`
 * (lib/control/trust-engine.js).
 *
 * Architecture (ADR S4-002):
 *   - Pure compute (computeResponseRate) — input → output
 *   - I/O (gh CLI) isolated in trackIssues — graceful failure on API down
 *   - persistToFile writes .bkit/state/external-feedback-tracker.json
 *   - refresh() orchestrates trackIssues + computeResponseRate
 *
 * Default dogfooder roster: derived from lib/quality/sqm-calculator.js
 * (DEFAULT_DOGFOODERS) when available; falls back to ['pruge'] otherwise.
 *
 * Master plan ref: §15.4 (Dogfooder Acquisition Objective), §17.3 (ENH-318).
 * Design ref: docs/02-design/features/s4-proactive.design.md ADR S4-002.
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/** Default trailing window for tracking (master plan ADR S0-003). */
const DEFAULT_WINDOW_DAYS = 30;
const SCHEMA_VERSION = '1.0';

/** Default dogfooders — currently N=1, will grow via DA-4 (v2.1.20+). */
function getDefaultDogfooders() {
  try {
    const sqm = require(path.join(__dirname, '..', 'quality', 'sqm-calculator.js'));
    if (Array.isArray(sqm.DEFAULT_DOGFOODERS) && sqm.DEFAULT_DOGFOODERS.length > 0) {
      return [...sqm.DEFAULT_DOGFOODERS];
    }
  } catch (_) { /* fall through */ }
  return ['pruge'];
}

// ============================================================
// I/O layer
// ============================================================

/**
 * Query GitHub issues for one or more dogfooders via gh CLI.
 *
 * @param {object} opts
 * @param {string} opts.owner - GitHub org/owner
 * @param {string} opts.repo  - GitHub repo
 * @param {string[]} opts.dogfooders - GitHub handles
 * @param {string} opts.sinceISO - ISO timestamp lower bound (inclusive date)
 * @param {string} opts.untilISO - ISO timestamp upper bound (mostly informational)
 * @returns {{issues: object[]|null, apiErrors: object[]|null}}
 */
function trackIssues(opts) {
  const { owner, repo, dogfooders, sinceISO } = opts || {};
  if (!owner || !repo || !Array.isArray(dogfooders) || dogfooders.length === 0) {
    return { issues: null, apiErrors: [{ error: 'invalid_args', detail: 'owner+repo+dogfooders required' }] };
  }
  const since = sinceISO || new Date(Date.now() - DEFAULT_WINDOW_DAYS * 86400000).toISOString();
  const sinceDateOnly = since.split('T')[0];
  const issues = [];
  const apiErrors = [];
  for (const handle of dogfooders) {
    try {
      // Pass owner/repo/handle as discrete argv elements instead of interpolating
      // them into a shell string — execFileSync spawns gh directly with no shell,
      // so the values cannot be interpreted as shell metacharacters (injection-safe).
      const args = [
        'issue', 'list',
        '--repo', `${owner}/${repo}`,
        '--state', 'all',
        '--search', `author:${handle} created:>=${sinceDateOnly}`,
        '--limit', '100',
        '--json', 'number,createdAt,closedAt,author,title',
      ];
      const json = execFileSync('gh', args, { encoding: 'utf8', timeout: 20000, stdio: ['ignore', 'pipe', 'pipe'] });
      const parsed = JSON.parse(json);
      for (const i of parsed) {
        const created = new Date(i.createdAt);
        const closed = i.closedAt ? new Date(i.closedAt) : null;
        const hoursToClose = closed ? (closed - created) / 3600000 : null;
        issues.push({
          number: i.number,
          creator: (i.author && i.author.login) || handle,
          createdAt: i.createdAt,
          closedAt: i.closedAt,
          hoursToClose: hoursToClose !== null ? Math.round(hoursToClose * 10) / 10 : null,
          within24h: hoursToClose !== null && hoursToClose <= 24,
          title: i.title,
        });
      }
    } catch (e) {
      apiErrors.push({ dogfooder: handle, error: String(e.message || e) });
    }
  }
  return { issues: apiErrors.length > 0 && issues.length === 0 ? null : issues, apiErrors: apiErrors.length > 0 ? apiErrors : null };
}

// ============================================================
// Pure compute layer
// ============================================================

/**
 * Compute response rate from a list of dogfooder issues.
 *
 * Definitions:
 *   - closed = issues with closedAt set
 *   - within24h = closed issues that closed within 24h of creation
 *   - rate = within24h / closed (0-100), denominator excludes open issues
 *     (open issues belong to "still pending" bucket, not response failure)
 *
 * @param {{issues: object[]|null, windowDays: number}} input
 * @returns {{value: number|null, raw: object}}
 */
function computeResponseRate(input) {
  const { issues, windowDays } = input || {};
  if (!Array.isArray(issues)) {
    return { value: null, raw: { error: 'no issues array' } };
  }
  if (issues.length === 0) {
    return { value: null, raw: { error: 'no issues in window', closed: 0, within24h: 0, openInWindow: 0, windowDays } };
  }
  const closed = issues.filter(i => i && i.closedAt);
  if (closed.length === 0) {
    return { value: null, raw: { error: 'no closed issues', closed: 0, within24h: 0, openInWindow: issues.length, windowDays } };
  }
  const within24h = closed.filter(i => i.within24h === true).length;
  return {
    value: Math.round((within24h / closed.length) * 100),
    raw: {
      closed: closed.length,
      within24h,
      openInWindow: issues.length - closed.length,
      windowDays,
      issues: issues.slice(0, 50), // cap raw retention
    },
  };
}

// ============================================================
// Orchestration
// ============================================================

/**
 * Refresh the external feedback tracker — full pipeline.
 *
 * @param {object} opts
 * @returns {object} schema-conforming result (see ADR S4-002 schema)
 */
function refresh(opts) {
  const o = opts || {};
  const dogfooders = o.dogfooders || getDefaultDogfooders();
  const windowDays = o.windowDays || DEFAULT_WINDOW_DAYS;
  const asOf = new Date().toISOString();
  const sinceISO = new Date(Date.now() - windowDays * 86400000).toISOString();
  const owner = o.owner || 'popup-studio-ai';
  const repo = o.repo || 'bkit-claude-code';

  const tracked = trackIssues({ owner, repo, dogfooders, sinceISO, untilISO: asOf });
  const computed = computeResponseRate({ issues: tracked.issues, windowDays });

  const warnings = [];
  if (tracked.apiErrors) {
    for (const e of tracked.apiErrors) warnings.push(`api_error: ${e.dogfooder} — ${e.error}`);
  }
  if (computed.value === null) warnings.push(`value_unmeasurable: ${(computed.raw && computed.raw.error) || 'unknown'}`);

  return {
    asOf,
    windowDays,
    dogfooders,
    value: computed.value,
    raw: computed.raw,
    warnings,
    schemaVersion: SCHEMA_VERSION,
  };
}

/**
 * Persist tracker result to file (creates parent dir if needed).
 */
function persistToFile(result, filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(result, null, 2) + '\n');
}

/**
 * Load tracker result from file (or return null).
 */
function loadFromFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch (_) { return null; }
}

module.exports = {
  DEFAULT_WINDOW_DAYS,
  SCHEMA_VERSION,
  getDefaultDogfooders,
  trackIssues,
  computeResponseRate,
  refresh,
  persistToFile,
  loadFromFile,
};
