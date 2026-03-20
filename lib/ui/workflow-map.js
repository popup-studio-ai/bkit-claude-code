/**
 * Workflow Map Component
 * @module lib/ui/workflow-map
 * @version 2.0.0
 *
 * Renders a 2D box diagram of the PDCA workflow with phase connections,
 * parallel swarm subtrees, conditional branches, and iteration history.
 */

const {
  BOX, SYMBOLS,
  colorize, bold, dim,
  getTermWidth, getWidthBreakpoint, truncate, hline,
  stripAnsi, boxLine, resolveFeature,
} = require('./ansi');

// ============================================================
// Constants
// ============================================================

const PHASES = ['PM', 'PLAN', 'DESIGN', 'DO', 'CHECK', 'REPORT'];
const PHASE_KEYS = ['pm', 'plan', 'design', 'do', 'check', 'report'];

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

// ============================================================
// Internal Helpers
// ============================================================

/**
 * Determine the status of a phase relative to the current phase.
 * @param {string} phaseKey - Lowercase phase key
 * @param {Object|null} featureData
 * @returns {string}
 */
function getPhaseStatus(phaseKey, featureData) {
  if (!featureData) return 'pending';
  const current = (featureData.phase || '').toLowerCase();

  // Feature fully completed — all phases are done
  if (current === 'completed') return 'completed';

  const currentIdx = PHASE_KEYS.indexOf(current);
  const idx = PHASE_KEYS.indexOf(phaseKey);

  if (idx < currentIdx) return 'completed';
  if (idx === currentIdx) return 'running';
  return 'pending';
}

/**
 * Render a single phase box like [PLAN ~].
 * @param {string} label - Phase label (uppercase)
 * @param {string} status - Phase status
 * @returns {string}
 */
function renderPhaseBox(label, status) {
  const symbol = STATUS_SYMBOL[status] || SYMBOLS.pending;
  const color = STATUS_COLOR[status] || 'gray';
  const inner = `${label} ${symbol}`;

  if (status === 'running') {
    return bold(colorize(`[${inner}]`, color));
  }
  return colorize(`[${inner}]`, color);
}

// ============================================================
// Public API
// ============================================================

/**
 * Render PDCA workflow map.
 * @param {Object|null} pdcaStatus  - .bkit/state/pdca-status.json
 * @param {Object|null} agentState  - .bkit/runtime/agent-state.json
 * @param {Object} [config]
 * @param {string}  [config.feature]       - Feature name to display
 * @param {boolean} [config.showIteration] - Show iteration history (default: true)
 * @param {boolean} [config.showBranch]    - Show conditional branch (default: true)
 * @param {number}  [config.width]         - Force width
 * @returns {string}
 */
function renderWorkflowMap(pdcaStatus, agentState, config = {}) {
  const width = config.width || getTermWidth();
  const showIteration = config.showIteration !== false;
  const showBranch = config.showBranch !== false;
  const innerWidth = width - 6; // borders + padding

  const { name: featureName, data: featureData } = resolveFeature(pdcaStatus, config.feature);

  // No data fallback
  if (!featureData) {
    const title = ' Workflow Map ';
    const titleLine = `${BOX.topLeft}${hline(3)}${title}${hline(Math.max(1, width - title.length - 5))}${BOX.topRight}`;
    const emptyMsg = 'No active PDCA feature. Start with /pdca pm {feature-name}';
    return [
      titleLine,
      boxLine(truncate(emptyMsg, innerWidth), innerWidth),
      `${BOX.bottomLeft}${hline(width - 2)}${BOX.bottomRight}`,
    ].join('\n');
  }

  const lines = [];

  // Title line
  const titleText = ` Workflow Map: ${truncate(featureName, 30)} `;
  const titlePad = Math.max(1, width - titleText.length - 5);
  lines.push(`${BOX.topLeft}${hline(3)}${titleText}${hline(titlePad)}${BOX.topRight}`);

  // Empty line
  lines.push(boxLine('', innerWidth));

  // Phase chain line
  const phaseBoxes = PHASES.map((label, i) => {
    const status = getPhaseStatus(PHASE_KEYS[i], featureData);
    return renderPhaseBox(label, status);
  });
  const connector = `${hline(2)}${BOX.arrowRight}`;
  const chainStr = phaseBoxes.join(connector);
  lines.push(boxLine(chainStr, innerWidth));

  // Conditional branch line (CHECK threshold)
  if (showBranch) {
    const currentPhase = (featureData.phase || '').toLowerCase();
    const checkIdx = PHASE_KEYS.indexOf('check');
    const currentIdx = PHASE_KEYS.indexOf(currentPhase);

    // Show branch info below the chain
    if (currentIdx >= checkIdx - 1) {
      // Calculate visual offset to align under CHECK
      const branchLine = `${' '.repeat(4)}CHECK: ${colorize('\u226590% \u2192 REPORT', 'green')}  ${colorize('<90% \u2192 ACT', 'yellow')}`;
      lines.push(boxLine(branchLine, innerWidth));
    } else {
      lines.push(boxLine('', innerWidth));
    }
  } else {
    lines.push(boxLine('', innerWidth));
  }

  // Parallel swarm subtree
  const hasSwarm = agentState &&
    agentState.orchestrationPattern === 'parallel' &&
    Array.isArray(agentState.teammates) &&
    agentState.teammates.length > 1;

  if (hasSwarm) {
    lines.push(boxLine('', innerWidth));
    const agentSummary = agentState.teammates.map(t => {
      const status = t.status || 'pending';
      const symbol = STATUS_SYMBOL[status] || SYMBOLS.pending;
      const color = STATUS_COLOR[status] || 'gray';
      return `${BOX.vertical}${hline(1)}${colorize(`[${truncate(t.name, 15)} ${symbol}]`, color)}`;
    });

    const swarmHeader = `    DO swarm:`;
    lines.push(boxLine(bold(swarmHeader), innerWidth));
    for (const agent of agentSummary) {
      lines.push(boxLine(`      ${agent}`, innerWidth));
    }
  }

  // Summary footer line
  const matchRate = featureData.matchRate != null ? `${featureData.matchRate}%` : 'N/A';
  const iterCount = featureData.iterationCount || 0;

  let summaryParts = [`Iter: ${iterCount}`, `matchRate: ${matchRate}`];

  if (hasSwarm) {
    const working = agentState.teammates.filter(t => t.status === 'working').length;
    const spawning = agentState.teammates.filter(t => t.status === 'spawning').length;
    const pending = agentState.teammates.filter(t => t.status === 'pending' || !t.status).length;
    summaryParts.push(
      `Agents: ${agentState.teammates.length} (${working} working, ${spawning} spawning, ${pending} pending)`
    );
  }

  lines.push(boxLine('', innerWidth));
  const summaryStr = summaryParts.join(`  ${SYMBOLS.bullet}  `);
  lines.push(boxLine(truncate(summaryStr, innerWidth), innerWidth));

  // Close main box
  lines.push(`${BOX.bottomLeft}${hline(width - 2)}${BOX.bottomRight}`);

  // Iteration history (separate box below)
  if (showIteration && featureData.iterationHistory && featureData.iterationHistory.length > 0) {
    lines.push('');
    const iterTitle = ' Iteration History ';
    const iterTitlePad = Math.max(1, width - iterTitle.length - 5);
    lines.push(`${BOX.topLeft}${hline(3)}${iterTitle}${hline(iterTitlePad)}${BOX.topRight}`);

    for (const iter of featureData.iterationHistory) {
      const iterNum = iter.iteration || '?';
      const phase = iter.phase || 'N/A';
      const rate = iter.matchRate != null ? `${iter.matchRate}%` : 'N/A';
      const outcome = iter.outcome || (iter.completedAt ? 'done' : 'in progress');
      const isCurrent = !iter.completedAt;

      let iterLine = `  Iter ${iterNum}: ${phase}`;
      if (iter.outcome) {
        iterLine += `${BOX.arrowRight}${iter.outcome}`;
      }
      iterLine += `  matchRate: ${rate}`;
      if (isCurrent) {
        iterLine = bold(iterLine + '  (current)');
      }

      lines.push(boxLine(truncate(iterLine, innerWidth), innerWidth));
    }

    lines.push(`${BOX.bottomLeft}${hline(width - 2)}${BOX.bottomRight}`);
  }

  return lines.join('\n');
}

// ============================================================
// Module Exports
// ============================================================

module.exports = { renderWorkflowMap };
