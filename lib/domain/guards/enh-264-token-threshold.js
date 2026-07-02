/**
 * ENH-264 Guard — CC v2.1.117 #51809 Sonnet 4.6 per-turn token overhead threshold.
 *
 * Design Ref: bkit-v2110-integrated-enhancement.design.md §3.1.3
 * Plan SC: No Guessing — measurement only, policy decisions require 2-week data.
 *
 * Regression: Sonnet 4.6 adds 6~8k per-turn tokens since v2.1.114.
 *   v2.1.110 was the last normal baseline.
 * bkit's role: flag turns exceeding OVERHEAD_THRESHOLD for user warning.
 *
 * Pure domain function.
 *
 * @module lib/domain/guards/enh-264-token-threshold
 *
 * @version 2.1.12
 */

const OVERHEAD_THRESHOLD = 8000; // Flag per-turn overhead above this value
const SESSION_TOTAL_THRESHOLD = 100000; // Flag session total overhead
// Sonnet 5 intentionally excluded — the ENH-264 regression was sonnet-4.x-specific;
// extend only with observed evidence (No Guessing).
const KNOWN_REGRESSION_MODELS = ['claude-sonnet-4-6', 'claude-sonnet-4-5'];

/**
 * @typedef {Object} TurnMetrics
 * @property {string} model
 * @property {number} inputTokens
 * @property {number} outputTokens
 * @property {number} overheadDelta - Measured delta vs v2.1.110 baseline
 * @property {number} [sessionTotalOverhead] - Running total within session
 */

/**
 * Decide if a turn should trigger a token warning.
 *
 * @param {TurnMetrics} metrics
 * @returns {{ hit: boolean, meta?: Object }}
 */
function check(metrics) {
  if (!metrics || typeof metrics !== 'object') return { hit: false };
  if (!KNOWN_REGRESSION_MODELS.includes(metrics.model)) return { hit: false };

  const perTurnHit = (metrics.overheadDelta || 0) > OVERHEAD_THRESHOLD;
  const sessionHit = (metrics.sessionTotalOverhead || 0) > SESSION_TOTAL_THRESHOLD;
  if (!perTurnHit && !sessionHit) return { hit: false };

  return {
    hit: true,
    meta: {
      id: 'ENH-264',
      severity: 'HIGH',
      note: `Sonnet overhead detected (per-turn: +${metrics.overheadDelta} tokens). Known CC v2.1.117 regression #51809.`,
      ccIssue: 'https://github.com/anthropics/claude-code/issues/51809',
      thresholds: { perTurn: OVERHEAD_THRESHOLD, session: SESSION_TOTAL_THRESHOLD },
    },
  };
}

function removeWhen(ccVersion) {
  if (!ccVersion || typeof ccVersion !== 'string') return false;
  const [maj, min, pat] = ccVersion.split('.').map((n) => parseInt(n, 10) || 0);
  if (maj < 2) return false;
  if (maj > 2) return true;
  if (min > 1) return true;
  return min === 1 && pat >= 118;
}

module.exports = {
  check,
  removeWhen,
  OVERHEAD_THRESHOLD,
  SESSION_TOTAL_THRESHOLD,
  KNOWN_REGRESSION_MODELS,
};
