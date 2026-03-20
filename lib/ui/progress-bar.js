/**
 * PDCA Progress Bar Component
 * @module lib/ui/progress-bar
 * @version 2.0.0
 *
 * Renders PDCA workflow progress as a compact or full-width bar.
 * Supports compact (1-line) and full (3-line) rendering modes.
 */

const {
  COLORS, BOX, SYMBOLS,
  colorize, bold, dim,
  getTermWidth, getWidthBreakpoint, truncate, hline,
  stripAnsi, resolveFeature,
} = require('./ansi');

// ============================================================
// Constants
// ============================================================

const PHASES = ['pm', 'plan', 'design', 'do', 'check', 'report'];
const PHASE_LABELS = {
  pm: 'PM', plan: 'PLAN', design: 'DESIGN',
  do: 'DO', check: 'CHECK', report: 'REPORT',
};

const STATUS_SYMBOL = {
  completed: SYMBOLS.done,
  running:   SYMBOLS.running,
  pending:   SYMBOLS.pending,
  failed:    SYMBOLS.failed,
  approval_waiting: SYMBOLS.waiting,
};

const STATUS_COLOR = {
  completed: 'green',
  running:   'cyan',
  pending:   'gray',
  failed:    'red',
  approval_waiting: 'yellow',
};

const BAR_WIDTHS = {
  narrow: 16,
  normal: 20,
  wide: 36,
  ultrawide: 50,
};

// ============================================================
// Internal Helpers
// ============================================================

/**
 * Determine phase status relative to the current active phase.
 * @param {string} phase - Phase key
 * @param {Object} featureData - Feature status object from pdcaStatus
 * @returns {string} Status string
 */
function getPhaseStatus(phase, featureData) {
  if (!featureData) return 'pending';

  const currentPhase = (featureData.phase || '').toLowerCase();

  // Feature fully completed — all phases are done
  if (currentPhase === 'completed') return 'completed';

  const currentIdx = PHASES.indexOf(currentPhase);
  const phaseIdx = PHASES.indexOf(phase);

  // Check pending approvals for current phase
  if (featureData.pendingApprovals && Array.isArray(featureData.pendingApprovals)) {
    const hasApproval = featureData.pendingApprovals.some(
      a => (a.from || '').toLowerCase() === phase
    );
    if (hasApproval && phase === currentPhase) return 'approval_waiting';
  }

  if (phaseIdx < currentIdx) return 'completed';
  if (phaseIdx === currentIdx) return 'running';
  return 'pending';
}

/**
 * Calculate overall percentage from phase statuses.
 * @param {Object} featureData
 * @returns {number} 0-100
 */
function calculatePercent(featureData) {
  if (!featureData) return 0;
  const phaseWeight = 1 / PHASES.length;
  let sum = 0;

  for (const phase of PHASES) {
    const status = getPhaseStatus(phase, featureData);
    if (status === 'completed') {
      sum += phaseWeight;
    } else if (status === 'running' || status === 'approval_waiting') {
      sum += phaseWeight * 0.5;
    }
  }

  return Math.round(sum * 100);
}

/**
 * Render a filled/empty progress bar.
 * @param {number} percent - 0-100
 * @param {number} barWidth - Character width
 * @returns {string}
 */
function renderBar(percent, barWidth) {
  const filled = Math.round(barWidth * percent / 100);
  const empty = barWidth - filled;
  return '\u2588'.repeat(filled) + '\u2591'.repeat(empty);
}

/**
 * Format a relative time string from an ISO timestamp.
 * @param {string} isoTime
 * @returns {string}
 */
function relativeTime(isoTime) {
  if (!isoTime) return 'N/A';
  const diffMs = Date.now() - new Date(isoTime).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

// ============================================================
// Public API
// ============================================================

/**
 * Render PDCA progress bar.
 * @param {Object|null} pdcaStatus - Contents of .bkit/state/pdca-status.json
 * @param {Object} [opts]
 * @param {boolean} [opts.compact=false] - true: 1-line mode, false: 3-line box (default)
 * @param {string}  [opts.feature]       - Feature name (uses primaryFeature if omitted)
 * @param {number}  [opts.width]         - Force width (default: getTermWidth())
 * @returns {string} Rendered string with newlines (no trailing newline)
 */
function renderPdcaProgressBar(pdcaStatus, opts = {}) {
  const compact = opts.compact || false;
  const width = opts.width || getTermWidth();
  const bp = getWidthBreakpoint();
  const barWidth = BAR_WIDTHS[bp] || BAR_WIDTHS.normal;

  const { name: featureName, data: featureData } = resolveFeature(pdcaStatus, opts.feature);

  // No data fallback
  if (!featureData) {
    if (compact) {
      return dim('[No active feature]');
    }
    const inner = width - 4;
    return [
      `${BOX.topLeft}${hline(inner + 2)}${BOX.topRight}`,
      `${BOX.vertical}  ${truncate('No active PDCA feature', inner)}  ${BOX.vertical}`,
      `${BOX.bottomLeft}${hline(inner + 2)}${BOX.bottomRight}`,
    ].join('\n');
  }

  const percent = calculatePercent(featureData);

  // Build phase badges
  const badges = PHASES.map(phase => {
    const status = getPhaseStatus(phase, featureData);
    const symbol = STATUS_SYMBOL[status] || SYMBOLS.pending;
    const color = STATUS_COLOR[status] || 'gray';
    const label = PHASE_LABELS[phase];
    return colorize(`${label}${symbol}`, color);
  });

  // Compact mode: single line
  if (compact) {
    const displayName = truncate(featureName, 20);
    const phaseStr = badges.join(' ');
    const percentStr = `${percent}%`;
    const bar = renderBar(percent, Math.min(barWidth, 19));
    return `[${displayName}] ${phaseStr}  ${percentStr}  ${bar}`;
  }

  // Full mode: 3-line box
  const innerWidth = width - 4; // account for "| " and " |"

  // Line 1: header with feature name and percent
  const headerLabel = ` ${featureName} `;
  const percentLabel = ` ${percent}% `;
  const headerLineLen = innerWidth - headerLabel.length - percentLabel.length;
  const headerLine = `${BOX.topLeft}${hline(3)}${headerLabel}${hline(Math.max(1, headerLineLen))}${percentLabel}${hline(1)}${BOX.topRight}`;

  // Line 2: phase badges + bar
  const phaseStr = badges.join('  ');
  const bar = renderBar(percent, barWidth);
  const midContent = `  ${phaseStr}  ${bar}  `;
  const midPadding = Math.max(0, innerWidth - stripAnsi(midContent).length);
  const midLine = `${BOX.vertical}${midContent}${' '.repeat(midPadding)}${BOX.vertical}`;

  // Line 3: footer with details
  const lastUpdated = featureData.timestamps
    ? relativeTime(featureData.timestamps.lastUpdated)
    : 'N/A';
  const iterCount = featureData.iterationCount || 0;
  const matchRate = featureData.matchRate != null ? `${featureData.matchRate}%` : 'N/A';

  let footerInfo;
  if (bp === 'wide' || bp === 'ultrawide') {
    footerInfo = `Phase: ${featureData.phase || 'N/A'} ${SYMBOLS.bullet} last: ${lastUpdated} ${SYMBOLS.bullet} Iter: ${iterCount} ${SYMBOLS.bullet} matchRate: ${matchRate}`;
  } else {
    footerInfo = `${featureData.phase || 'N/A'} ${SYMBOLS.bullet} last: ${lastUpdated} ${SYMBOLS.bullet} iter: ${iterCount}`;
  }
  footerInfo = truncate(footerInfo, innerWidth - 2);
  const footerPadding = Math.max(0, innerWidth - footerInfo.length - 2);
  const footerLine = `${BOX.bottomLeft}${hline(1)} ${footerInfo}${' '.repeat(footerPadding)} ${BOX.bottomRight}`;

  return [headerLine, midLine, footerLine].join('\n');
}

// ============================================================
// Module Exports
// ============================================================

module.exports = { renderPdcaProgressBar, stripAnsi };
