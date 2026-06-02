/**
 * watch.js — Live PDCA dashboard tick renderer (FR-β4)
 *
 * Pure-data helpers for `/pdca-watch` slash command. The slash command
 * itself wires this into CC's `/loop 30s ...` (CC v2.1.71+); this module
 * only handles:
 *   - Resolve active feature when caller gives no arg.
 *   - Tail the last N lines of `.bkit/runtime/token-ledger.ndjson`.
 *   - Read `.bkit/state/pdca-status.json` feature snapshot.
 *   - Render a single tick frame as a fixed-width text panel.
 *
 * Idempotent + read-only — safe to invoke from `/loop` ticks. No
 * subprocess, no network. NDJSON tail uses bounded buffer (last 200
 * lines max) — protects against pathological log growth.
 *
 * @module lib/dashboard/watch
 * @version 2.1.11
 * @since 2.1.11
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.env.CLAUDE_PROJECT_DIR ||
  path.resolve(__dirname, '..', '..');
const STATE_PATH = path.join(PROJECT_ROOT, '.bkit', 'state', 'pdca-status.json');
const LEDGER_PATH = path.join(PROJECT_ROOT, '.bkit', 'runtime', 'token-ledger.ndjson');
const MAX_TAIL_LINES = 200;

/**
 * Read the pdca-status.json file. Returns `null` if the file doesn't
 * exist or is unparseable — callers must handle the empty case.
 *
 * @param {{ statePath?: string }} [opts]
 * @returns {object|null}
 */
function readStatus(opts = {}) {
  const target = opts.statePath || STATE_PATH;
  if (!fs.existsSync(target)) return null;
  try { return JSON.parse(fs.readFileSync(target, 'utf8')); }
  catch { return null; }
}

/**
 * Resolve the feature to watch. Priority:
 *   1. caller-provided `feature` arg
 *   2. status.primaryFeature
 *   3. status.activeFeatures[0]
 *   4. null
 *
 * @param {string|null} feature
 * @param {{ statePath?: string }} [opts]
 * @returns {string|null}
 */
function resolveFeature(feature, opts) {
  if (feature && typeof feature === 'string' && feature.trim()) return feature.trim();
  const status = readStatus(opts);
  if (!status) return null;
  if (status.primaryFeature) return status.primaryFeature;
  if (Array.isArray(status.activeFeatures) && status.activeFeatures.length > 0) {
    return status.activeFeatures[0];
  }
  return null;
}

/**
 * Tail the last `n` lines of a NDJSON file, parsing each. Bounded
 * by MAX_TAIL_LINES (200) regardless of caller input.
 *
 * @param {{ ledgerPath?: string, lines?: number }} [opts]
 * @returns {object[]}
 */
function tailLedger(opts = {}) {
  const target = opts.ledgerPath || LEDGER_PATH;
  const wanted = Math.min(Math.max(opts.lines || 50, 1), MAX_TAIL_LINES);
  if (!fs.existsSync(target)) return [];
  let raw;
  try { raw = fs.readFileSync(target, 'utf8'); }
  catch { return []; }
  const lines = raw.split(/\r?\n/).filter((l) => l.trim()).slice(-wanted);
  const parsed = [];
  for (const line of lines) {
    try { parsed.push(JSON.parse(line)); } catch { /* skip malformed */ }
  }
  return parsed;
}

/**
 * Aggregate token totals from a tail window.
 *
 * @param {object[]} entries
 * @returns {{ inputTokens: number, outputTokens: number, samples: number }}
 */
function summarizeLedger(entries) {
  let input = 0, output = 0;
  for (const e of entries) {
    if (e && typeof e.inputTokens === 'number') input += e.inputTokens;
    if (e && typeof e.outputTokens === 'number') output += e.outputTokens;
  }
  return { inputTokens: input, outputTokens: output, samples: entries.length };
}

/**
 * Estimate USD cost for the tail window using simple flat rates.
 * Defaults align with Sonnet-class pricing as a conservative ceiling.
 * Caller can override for Opus / Haiku.
 *
 * @param {{ inputTokens: number, outputTokens: number }} tally
 * @param {{ inputPricePerMtok?: number, outputPricePerMtok?: number }} [opts]
 * @returns {number}
 */
function estimateCostUsd(tally, opts = {}) {
  const inP = typeof opts.inputPricePerMtok === 'number' ? opts.inputPricePerMtok : 3.0;
  const outP = typeof opts.outputPricePerMtok === 'number' ? opts.outputPricePerMtok : 15.0;
  return ((tally.inputTokens / 1e6) * inP) + ((tally.outputTokens / 1e6) * outP);
}

function _formatTokens(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return String(n);
}

function _formatTimestamp(iso) {
  if (!iso) return '--:--:--';
  // Extract HH:MM:SS in local time without depending on Intl.
  try {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch { return '--:--:--'; }
}

/**
 * Render a single tick frame as a fixed-width text panel.
 *
 * @param {{ feature: string, tick: number, statePath?: string, ledgerPath?: string, now?: Date }} input
 * @returns {string}
 */
function renderTick(input) {
  const feature = input.feature || '(unresolved)';
  const tick = Number.isInteger(input.tick) ? input.tick : 1;
  const status = readStatus(input);
  const featureRec = status && status.features ? status.features[feature] : null;
  const phase = featureRec && featureRec.phase ? featureRec.phase : '—';
  const matchRate = featureRec && typeof featureRec.matchRate === 'number'
    ? `${featureRec.matchRate}%` : '—';
  const iter = featureRec && typeof featureRec.iterationCount === 'number'
    ? `${featureRec.iterationCount} / 5` : '— / 5';
  const ledger = tailLedger({ ledgerPath: input.ledgerPath, lines: 50 });
  const tally = summarizeLedger(ledger);
  const cost = estimateCostUsd(tally);
  const ts = _formatTimestamp((input.now || new Date()).toISOString());

  return [
    `Watch  ${feature} — tick ${tick} (${ts})`,
    '─────────────────────────────────────────────────────────────',
    `Phase: ${phase.padEnd(10)} Match: ${matchRate.padEnd(8)} Iter: ${iter}`,
    `Tokens: ${_formatTokens(tally.inputTokens)} in / ${_formatTokens(tally.outputTokens)} out · samples ${tally.samples}`,
    `Est cost: $${cost.toFixed(2)}`,
    '─────────────────────────────────────────────────────────────',
  ].join('\n');
}

/**
 * Pre-flight check: does the caller's CC support `/loop`? Returns
 * structured fallback recommendation when unsupported.
 *
 * @param {{ ccVersion?: string }} [opts]
 * @returns {{ supported: boolean, reason?: string, fallback?: string }}
 */
function checkLoopSupport(opts = {}) {
  const ver = opts.ccVersion;
  if (!ver) {
    return { supported: false, reason: 'cc_version_unknown',
      fallback: 'single-tick' };
  }
  // CC v2.1.71+ supports `/loop`.
  const m = String(ver).match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return { supported: false, reason: 'cc_version_unparseable', fallback: 'single-tick' };
  const [, maj, min, patch] = m;
  const supported = (Number(maj) > 2) ||
    (Number(maj) === 2 && Number(min) > 1) ||
    (Number(maj) === 2 && Number(min) === 1 && Number(patch) >= 71);
  return supported
    ? { supported: true }
    : { supported: false, reason: 'cc_version_too_old', fallback: 'single-tick' };
}

module.exports = {
  STATE_PATH,
  LEDGER_PATH,
  MAX_TAIL_LINES,
  readStatus,
  resolveFeature,
  tailLedger,
  summarizeLedger,
  estimateCostUsd,
  renderTick,
  checkLoopSupport,
};
