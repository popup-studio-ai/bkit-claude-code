'use strict';

/**
 * failure-reporter.js — Sprint gate-failure auto-report (v2.1.16 Issue #93 F4).
 *
 * Mirrors the 3-tier production-scaffold pattern from
 * lib/infra/sprint/gap-detector.adapter:
 *   1. Pure functions  : buildReportPath, buildGateRows, buildMarkdown
 *   2. Factory         : createFailureReporter(opts) → async function used by
 *                        sprint-handler.handlePhase as deps.failureReporter
 *   3. No-op fallback  : when deps.fileWriter is missing, factory still
 *                        produces the markdown + relative path but skips
 *                        FS write (advance-phase still gets reportPath in
 *                        its result; handler is responsible for FS write).
 *
 * Layer split:
 *   - This module composes the markdown string + the canonical relative path.
 *   - Caller (handler) owns FS writing (mkdirSync + writeFileSync) so this
 *     module stays Application-layer pure (Master Plan §1 RISK / SCOPE).
 *
 * Issue #93 expected report shape (verbatim 6-column table per Master Plan §11.4 AC2):
 *   Sprint Phase | Gate | Status | Expected | Actual | Suggested Action
 *
 * Design Ref: docs/01-plan/features/v2116-issue-fixes.master-plan.md §11.4
 *
 * @module lib/application/quality-gates/failure-reporter
 * @version 2.1.16
 * @since 2.1.16
 */

const fs = require('fs');
const path = require('path');

const TEMPLATE_REL = path.join('templates', 'gate-failure-report.template.md');

/**
 * Resolve the plugin root (where `templates/` lives) from this module's
 * filesystem location. Walks up from lib/application/quality-gates/ to the
 * plugin root. This decouples template lookup from the output `projectRoot`
 * (which is the consumer's project for writing the report under
 * `docs/03-analysis/`).
 */
const PLUGIN_ROOT = path.resolve(__dirname, '..', '..', '..');

/**
 * Compose the canonical relative path for a gate-failure report.
 *
 * docs/03-analysis/<sprintId>-gate-fail-<phase>-<ISO_ts_normalized>.md
 *
 * ISO timestamps include `:` and `.` which are filesystem-hostile on some
 * platforms — normalize to `-` for cross-platform safety.
 *
 * @param {string} sprintId
 * @param {string} phase
 * @param {string} timestamp - ISO 8601 (e.g. '2026-05-20T01:23:45.678Z')
 * @returns {string} relative path
 */
function buildReportPath(sprintId, phase, timestamp) {
  const safeTs = String(timestamp).replace(/[:.]/g, '-');
  return path.posix.join(
    'docs', '03-analysis',
    String(sprintId) + '-gate-fail-' + String(phase) + '-' + safeTs + '.md'
  );
}

/**
 * Pretty-print a comparison operator + threshold for the "Expected" column.
 *
 * @param {Object} gateResult - { current, threshold, passed, reason }
 * @returns {string}
 */
function formatExpected(gateResult) {
  if (gateResult && typeof gateResult.threshold !== 'undefined' && gateResult.threshold !== null) {
    // M3 (criticalIssueCount) uses <= comparison; everything else uses >=.
    // We don't have the op here, so render a generic "threshold" line —
    // failure-reporter callers know the gate semantic from the gate key.
    return 'threshold = ' + String(gateResult.threshold);
  }
  return 'n/a';
}

/**
 * Pretty-print the "Actual" column. Distinguishes between not_measured
 * (Issue #92 root-cause symptom) and a real numeric failure.
 *
 * @param {Object} gateResult
 * @returns {string}
 */
function formatActual(gateResult) {
  if (gateResult && (gateResult.current === null || typeof gateResult.current === 'undefined')) {
    return '`null` (' + (gateResult.reason || 'not_measured') + ')';
  }
  return String(gateResult.current);
}

/**
 * Suggested action per failure mode. Maps the evaluator's `reason` string
 * to a user-actionable command suggestion.
 *
 * @param {string} gateKey
 * @param {Object} gateResult
 * @returns {string}
 */
function formatSuggestedAction(gateKey, gateResult) {
  if (!gateResult || gateResult.passed) return '— (already passing)';
  const reason = gateResult.reason;
  if (reason === 'not_measured' || reason === 'gate_slot_missing') {
    return '`/sprint measure --gate ' + gateKey + '` (v2.1.16 #94)';
  }
  if (reason === 'unknown_gate') {
    return 'Gate not recognized — check `quality-gates.js` `GATE_DEFINITIONS`';
  }
  // Numeric failure (current value did not meet threshold).
  return 'Fix the underlying artifact, then `/sprint measure --gate ' + gateKey + '` to re-record';
}

/**
 * Build the per-gate table rows for the "Gate Summary" section.
 *
 * @param {string} fromPhase
 * @param {Object} gateResults - shape: { allPassed, phase, results: { <key>: {...} } }
 * @returns {string} concatenated markdown rows (no trailing newline)
 */
function buildGateRows(fromPhase, gateResults) {
  const results = (gateResults && gateResults.results) || {};
  const rows = [];
  for (const [gateKey, r] of Object.entries(results)) {
    const status = r && r.passed ? 'PASS' : 'FAIL';
    rows.push([
      '|', fromPhase,
      '|', '`' + gateKey + '`',
      '|', status,
      '|', formatExpected(r),
      '|', formatActual(r),
      '|', formatSuggestedAction(gateKey, r),
      '|',
    ].join(' '));
  }
  return rows.join('\n');
}

/**
 * Build a detailed Markdown block for a single gate (used for both
 * Failed Gates and Passing Gates sections).
 *
 * @param {string} gateKey
 * @param {Object} gateResult
 * @returns {string}
 */
function buildGateBlock(gateKey, gateResult) {
  const r = gateResult || {};
  const lines = [
    '### `' + gateKey + '` (' + (r.passed ? 'PASS' : 'FAIL') + ')',
    '',
    '- Threshold: `' + formatExpected(r) + '`',
    '- Current: ' + formatActual(r),
  ];
  if (r.reason) {
    lines.push('- Reason: `' + r.reason + '`');
  }
  if (!r.passed) {
    lines.push('- Suggested action: ' + formatSuggestedAction(gateKey, r));
  }
  return lines.join('\n');
}

/**
 * Substitute single-brace `{name}` placeholders in template content. Mirrors
 * the substitution style used by other bkit templates (analysis.template.md
 * etc.). Variables not in `vars` are left untouched.
 *
 * @param {string} content
 * @param {Object<string, string>} vars
 * @returns {string}
 */
function substitute(content, vars) {
  return content.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, function (match, key) {
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      const v = vars[key];
      return (v === null || v === undefined) ? '' : String(v);
    }
    return match; // leave unknown placeholders intact for visibility
  });
}

/**
 * Strip the template's frontmatter (`--- ... ---` at the top). Returns the
 * body only — the report file does not need the template's `variables:`
 * documentation block.
 *
 * @param {string} content
 * @returns {string}
 */
function stripFrontmatter(content) {
  if (!content.startsWith('---\n')) return content;
  const close = content.indexOf('\n---\n', 4);
  if (close === -1) return content;
  return content.slice(close + 5);
}

/**
 * Read the report template from disk. Template lives in the bkit plugin root
 * (PLUGIN_ROOT) — NOT in the consumer's projectRoot, which is where the
 * report itself will be written (under `docs/03-analysis/`).
 *
 * Caller may override via `templateRoot` for test isolation.
 *
 * @param {string} [templateRoot] - override (defaults to PLUGIN_ROOT)
 * @returns {string} - template content (frontmatter stripped)
 */
function readTemplate(templateRoot) {
  const root = templateRoot || PLUGIN_ROOT;
  const abs = path.join(root, TEMPLATE_REL);
  return stripFrontmatter(fs.readFileSync(abs, 'utf8'));
}

/**
 * Build the full markdown report body from the input. Pure function — no FS
 * write, no clock side-effect (timestamp is an input).
 *
 * @param {{ id: string, name?: string, autoRun?: Object }} sprint
 * @param {string} fromPhase
 * @param {Object} gateResults
 * @param {string} timestamp - ISO 8601
 * @param {{ projectRoot?: string, templateRoot?: string, bkitVersion?: string, template?: string, toPhase?: string }} [opts]
 * @returns {string}
 */
function buildMarkdown(sprint, fromPhase, gateResults, timestamp, opts) {
  const o = opts || {};
  // Template lives in plugin root (decoupled from output projectRoot).
  // o.template (raw content) wins for test isolation; otherwise read from
  // o.templateRoot or PLUGIN_ROOT (NOT o.projectRoot — that's the output dir).
  const tpl = (typeof o.template === 'string' && o.template.length > 0)
    ? o.template
    : readTemplate(o.templateRoot);
  const trustLevel = (sprint && sprint.autoRun && sprint.autoRun.trustLevelAtStart) || 'unknown';
  // toPhase isn't an explicit gate-evaluation input — best-effort derivation:
  // the caller (advance-phase) passes the target phase; if unavailable, use the
  // sprint's intended next phase from autoRun.scope.stopAfter or omit.
  const toPhase = (o && o.toPhase) || '?';
  const results = (gateResults && gateResults.results) || {};
  const failedBlocks = [];
  const passingBlocks = [];
  for (const [k, r] of Object.entries(results)) {
    const block = buildGateBlock(k, r);
    if (r && r.passed) passingBlocks.push(block);
    else failedBlocks.push(block);
  }
  const vars = {
    sprintId:           (sprint && sprint.id) || 'unknown',
    sprintName:         (sprint && sprint.name) || (sprint && sprint.id) || 'unknown',
    trustLevel:         trustLevel,
    fromPhase:          String(fromPhase),
    toPhase:            String(toPhase),
    timestamp:          String(timestamp),
    gateRows:           buildGateRows(fromPhase, gateResults) || '| ' + fromPhase + ' | (no gates evaluated) | — | — | — | — |',
    failedGateBlocks:   failedBlocks.length > 0 ? failedBlocks.join('\n\n') : '_(no failing gates — this report should not have been generated; please file an issue)_',
    passingGateBlocks:  passingBlocks.length > 0 ? passingBlocks.join('\n\n') : '_(no passing gates were evaluated at this phase exit)_',
    bkitVersion:        o.bkitVersion || (() => {
      try { return require('../../core/version').BKIT_VERSION; } catch (_e) { return 'unknown'; }
    })(),
  };
  return substitute(tpl, vars);
}

/**
 * Write the report to disk via deps.fileWriter (or noop if absent).
 *
 * @param {{ id: string, name?: string, autoRun?: Object }} sprint
 * @param {string} fromPhase
 * @param {Object} gateResults
 * @param {string} timestamp
 * @param {{ projectRoot?: string, bkitVersion?: string, toPhase?: string, fileWriter?: (absPath: string, content: string) => Promise<void>|void }} deps
 * @returns {Promise<{ reportPath: string, markdown: string, written: boolean }>}
 */
async function writeReport(sprint, fromPhase, gateResults, timestamp, deps) {
  const d = deps || {};
  const markdown = buildMarkdown(sprint, fromPhase, gateResults, timestamp, d);
  const reportPath = buildReportPath(sprint && sprint.id, fromPhase, timestamp);
  let written = false;
  if (typeof d.fileWriter === 'function') {
    const absPath = path.join(d.projectRoot || process.cwd(), reportPath);
    try {
      await d.fileWriter(absPath, markdown);
      written = true;
    } catch (_e) {
      // File write is best-effort — the report path + markdown are still
      // returned so the caller can decide how to surface the failure.
      written = false;
    }
  }
  return { reportPath, markdown, written };
}

/**
 * Factory returning the function shape expected by
 * `lib/application/sprint-lifecycle/advance-phase.usecase.deps.failureReporter`:
 *
 *   (sprint, fromPhase, gateResults, timestamp) → Promise<{ reportPath, markdown, written }>
 *
 * Caller (sprint-handler.handlePhase) provides the FS-facing deps so this
 * module's caller graph stays Application-layer (Master Plan §1 RISK).
 *
 * @param {{ projectRoot?: string, bkitVersion?: string, fileWriter?: function, toPhase?: string }} [opts]
 * @returns {(sprint:Object, fromPhase:string, gateResults:Object, timestamp:string) => Promise<{reportPath:string, markdown:string, written:boolean}>}
 */
function createFailureReporter(opts) {
  return async function failureReporter(sprint, fromPhase, gateResults, timestamp, perCallOpts) {
    // Merge factory opts (fileWriter, projectRoot, templateRoot) with per-call
    // opts (toPhase — only known at advancePhase call time). per-call wins.
    const merged = Object.assign({}, opts || {}, perCallOpts || {});
    return writeReport(sprint, fromPhase, gateResults, timestamp, merged);
  };
}

module.exports = {
  // Pure functions
  buildReportPath,
  buildGateRows,
  buildGateBlock,
  buildMarkdown,
  substitute,
  stripFrontmatter,
  readTemplate,
  formatExpected,
  formatActual,
  formatSuggestedAction,
  // Side-effecting
  writeReport,
  createFailureReporter,
  // Constants
  TEMPLATE_REL,
  PLUGIN_ROOT,
};
