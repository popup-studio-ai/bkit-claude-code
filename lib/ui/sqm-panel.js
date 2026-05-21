'use strict';

/**
 * lib/ui/sqm-panel.js — v2.1.19 S5 F5-2
 *
 * Render SQM (Sprint Quality Maturity Index) dashboard panel for
 * SessionStart hook. Read-only — never blocks, < 5ms budget.
 *
 * Master plan ref: §4.5 F5-2 + §7.2 SQM components table.
 * Design ref: docs/02-design/features/s5-measurement.design.md ADR S5-003.
 */

const PANEL_WIDTH = 76; // approximate, fits 80-col terminals

/**
 * Render a SQM panel string from a baseline SqmResult-shaped object.
 *
 * @param {object} opts
 * @param {object} [opts.baseline] - v2.1.18 baseline measurement
 * @param {object} [opts.current] - current measurement (optional, for delta)
 * @returns {string} multi-line panel; empty string when baseline absent
 */
function renderSqmPanel(opts = {}) {
  const baseline = opts.baseline;
  const current = opts.current || null;
  if (!baseline || typeof baseline.total !== 'number') return '';

  const total = baseline.total.toFixed(2);
  const comps = baseline.components || {};
  const fmt = (key) => {
    const c = comps[key];
    if (!c) return '—';
    return c.value === null || c.value === undefined ? '—' : String(c.value);
  };

  const headerLabel = current && typeof current.total === 'number'
    ? `${baseline.total.toFixed(2)} → ${current.total.toFixed(2)}`
    : `${total}`;

  const lines = [
    `┌─── SQM (Sprint Quality Maturity) ─────────── ${headerLabel} / 100 ─┐`,
    `│  Docs=Code ${fmt('docsCodeSyncRate').padStart(3)}  │  Self-Dogfood ${fmt('sprintSelfDogfoodRunRate').padStart(3)}  │  Dogfooder ${fmt('externalDogfooderFeedbackResponseRate').padStart(3)}     │`,
    `│  Report KPI ${fmt('sprintReportKpiConsistency').padStart(3)} │  Dispatch ${fmt('subAgentDispatchSuccessRate').padStart(3)}      │  Convention ${fmt('conventionContractTestPassRate').padStart(3)}   │`,
    `└──────────────────────────────────────────────────────────────────────┘`,
  ];
  return lines.join('\n');
}

/**
 * Render a one-liner SQM summary (compact, suitable for embedding in
 * other panels). Format: `SQM 61.25 / 100 (v2.1.18)`.
 */
function renderSqmSummary(baseline) {
  if (!baseline || typeof baseline.total !== 'number') return '';
  const ver = baseline.bkitVersion ? `(v${baseline.bkitVersion})` : '';
  return `SQM ${baseline.total.toFixed(2)} / 100 ${ver}`.trim();
}

module.exports = {
  PANEL_WIDTH,
  renderSqmPanel,
  renderSqmSummary,
};
