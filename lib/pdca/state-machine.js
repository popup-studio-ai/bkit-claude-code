/**
 * Declarative PDCA Finite State Machine
 * @module lib/pdca/state-machine
 * @version 2.0.0
 *
 * Single TRANSITIONS table governs all phase transitions.
 * Guards validate preconditions; Actions execute side-effects.
 */

const fs = require('fs');
const path = require('path');

// Lazy requires to avoid circular dependencies
let _core = null;
function getCore() {
  if (!_core) { _core = require('../core'); }
  return _core;
}

let _status = null;
function getStatus() {
  if (!_status) { _status = require('./status'); }
  return _status;
}

let _phase = null;
function getPhase() {
  if (!_phase) { _phase = require('./phase'); }
  return _phase;
}

// ── Valid States & Events ───────────────────────────────────────────

/** @type {string[]} All valid PDCA states */
const STATES = [
  'idle', 'pm', 'plan', 'design', 'do',
  'check', 'act', 'report', 'archived', 'error'
];

/** @type {string[]} All valid PDCA events */
const EVENTS = [
  'START', 'SKIP_PM',
  'PM_DONE', 'PLAN_DONE', 'DESIGN_DONE', 'DO_COMPLETE',
  'MATCH_PASS', 'ITERATE', 'ANALYZE_DONE',
  'REPORT_DONE', 'ARCHIVE',
  'REJECT',
  'ERROR', 'RECOVER', 'RESET', 'ROLLBACK',
  'TIMEOUT', 'ABANDON'
];

// ── Transition Table (20 entries) ───────────────────────────────────

/**
 * Declarative transition table.
 * from:'*' matches any state.  to:'*' means dynamic (resolved by action).
 * @type {Array<{from:string, event:string, to:string, guard:string|null, actions:string[], description:string}>}
 */
const TRANSITIONS = [
  // ── Normal forward flow ──
  {
    from: 'idle', event: 'START', to: 'pm',
    guard: null,
    actions: ['initFeature', 'recordTimestamp'],
    description: 'New feature PDCA cycle begins'
  },
  {
    from: 'idle', event: 'SKIP_PM', to: 'plan',
    guard: null,
    actions: ['initFeature', 'recordTimestamp'],
    description: 'Skip PM phase, start directly with Plan'
  },
  {
    from: 'pm', event: 'PM_DONE', to: 'plan',
    guard: 'guardDeliverableExists',
    actions: ['recordTimestamp', 'notifyPhaseComplete'],
    description: 'PM analysis complete, proceed to Plan'
  },
  {
    from: 'plan', event: 'PLAN_DONE', to: 'design',
    guard: 'guardDeliverableExists',
    actions: ['recordTimestamp', 'notifyPhaseComplete'],
    description: 'Plan document complete, proceed to Design'
  },
  {
    from: 'design', event: 'DESIGN_DONE', to: 'do',
    guard: 'guardDesignApproved',
    actions: ['recordTimestamp', 'notifyPhaseComplete', 'createCheckpoint'],
    description: 'Design approved, proceed to implementation'
  },
  {
    from: 'do', event: 'DO_COMPLETE', to: 'check',
    guard: 'guardDoComplete',
    actions: ['recordTimestamp', 'notifyPhaseComplete'],
    description: 'Implementation complete, proceed to analysis'
  },
  {
    from: 'check', event: 'MATCH_PASS', to: 'report',
    guard: 'guardMatchRatePass',
    actions: ['recordTimestamp', 'notifyPhaseComplete', 'recordMatchRate'],
    description: 'Match rate >= threshold, proceed to Report'
  },
  {
    from: 'check', event: 'ITERATE', to: 'act',
    guard: 'guardCanIterate',
    actions: ['recordTimestamp', 'incrementIteration'],
    description: 'Match rate < threshold, iterate improvement'
  },
  {
    from: 'act', event: 'ANALYZE_DONE', to: 'check',
    guard: null,
    actions: ['recordTimestamp'],
    description: 'Act iteration done, re-analyze'
  },
  {
    from: 'report', event: 'REPORT_DONE', to: 'archived',
    guard: null,
    actions: ['recordTimestamp', 'notifyPhaseComplete', 'archiveDocuments', 'cleanupFeature'],
    description: 'Report generation complete, archive feature'
  },
  {
    from: 'report', event: 'ARCHIVE', to: 'archived',
    guard: null,
    actions: ['recordTimestamp', 'archiveDocuments', 'cleanupFeature'],
    description: 'Archive completed feature'
  },

  // ── Special transitions ──
  {
    from: 'check', event: 'REPORT_DONE', to: 'report',
    guard: 'guardMaxIterReached',
    actions: ['recordTimestamp', 'forceReport'],
    description: 'Max iterations reached, force report generation'
  },
  {
    from: 'pm', event: 'REJECT', to: 'idle',
    guard: null,
    actions: ['recordTimestamp', 'cleanupFeature'],
    description: 'PM analysis rejected, return to idle'
  },
  {
    from: 'plan', event: 'REJECT', to: 'pm',
    guard: null,
    actions: ['recordTimestamp'],
    description: 'Plan rejected, return to PM'
  },

  // ── Error / Recovery ──
  {
    from: '*', event: 'ERROR', to: 'error',
    guard: null,
    actions: ['recordTimestamp', 'saveResumePoint', 'notifyError'],
    description: 'Error occurred, save state for recovery'
  },
  {
    from: 'error', event: 'RECOVER', to: '*',
    guard: 'guardResumeAvailable',
    actions: ['recordTimestamp', 'restoreFromResume'],
    description: 'Recover from error using saved resume point'
  },
  {
    from: '*', event: 'RESET', to: 'idle',
    guard: null,
    actions: ['recordTimestamp', 'cleanupFeature'],
    description: 'Reset feature to idle state'
  },
  {
    from: '*', event: 'ROLLBACK', to: '*',
    guard: 'guardCheckpointExists',
    actions: ['recordTimestamp', 'restoreCheckpoint'],
    description: 'Rollback to previous checkpoint'
  },

  // ── Timeout / Abandon ──
  {
    from: '*', event: 'TIMEOUT', to: 'archived',
    guard: 'guardStaleFeature',
    actions: ['recordTimestamp', 'archiveStale'],
    description: 'Stale feature auto-archived (7 days inactive)'
  },
  {
    from: '*', event: 'ABANDON', to: 'archived',
    guard: null,
    actions: ['recordTimestamp', 'archiveAbandoned'],
    description: 'Feature explicitly abandoned'
  },
];

// ── Guard Functions ─────────────────────────────────────────────────

/**
 * Guard registry. Each guard receives context and returns boolean.
 * @type {Object<string, function(Object): boolean>}
 */
const GUARDS = {
  /**
   * Check that the current phase deliverable (document) exists
   * @param {Object} ctx - StateMachineContext
   * @returns {boolean}
   */
  guardDeliverableExists(ctx) {
    const { checkPhaseDeliverables } = getPhase();
    const result = checkPhaseDeliverables(ctx.currentState, ctx.feature);
    return result.exists === true;
  },

  /**
   * Check design doc is approved (auto-pass in semi-auto/full-auto)
   * @param {Object} ctx
   * @returns {boolean}
   */
  guardDesignApproved(ctx) {
    const level = ctx.automationLevel || 0;
    // L2+ auto-approve if design doc exists
    if (level >= 2) {
      const { checkPhaseDeliverables } = getPhase();
      return checkPhaseDeliverables('design', ctx.feature).exists === true;
    }
    // L0-L1: require explicit approval flag
    return ctx.metadata?.designApproved === true;
  },

  /**
   * Check Do completion (3-layer detection result in metadata)
   * @param {Object} ctx
   * @returns {boolean}
   */
  guardDoComplete(ctx) {
    return ctx.metadata?.doCompletionResult?.complete === true;
  },

  /**
   * Match rate meets threshold (default 90%)
   * @param {Object} ctx
   * @returns {boolean}
   */
  guardMatchRatePass(ctx) {
    const { getConfig } = getCore();
    const threshold = getConfig('pdca.matchRateThreshold', 90);
    return (ctx.matchRate || 0) >= threshold;
  },

  /**
   * More iterations are allowed
   * @param {Object} ctx
   * @returns {boolean}
   */
  guardCanIterate(ctx) {
    return (ctx.iterationCount || 0) < (ctx.maxIterations || 5);
  },

  /**
   * Max iteration count reached
   * @param {Object} ctx
   * @returns {boolean}
   */
  guardMaxIterReached(ctx) {
    return (ctx.iterationCount || 0) >= (ctx.maxIterations || 5);
  },

  /**
   * Resume data exists for error recovery
   * @param {Object} ctx
   * @returns {boolean}
   */
  guardResumeAvailable(ctx) {
    const { PROJECT_DIR } = getCore();
    const resumePath = path.join(
      PROJECT_DIR, '.bkit', 'state', 'resume', `${ctx.feature}.resume.json`
    );
    return fs.existsSync(resumePath);
  },

  /**
   * Checkpoint exists for rollback
   * @param {Object} ctx
   * @returns {boolean}
   */
  guardCheckpointExists(ctx) {
    const { PROJECT_DIR } = getCore();
    const cpDir = path.join(PROJECT_DIR, '.bkit', 'checkpoints');
    if (!fs.existsSync(cpDir)) return false;
    try {
      const files = fs.readdirSync(cpDir);
      return files.some(f => f.includes(ctx.feature));
    } catch (_) {
      return false;
    }
  },

  /**
   * Feature inactive for 7+ days
   * @param {Object} ctx
   * @returns {boolean}
   */
  guardStaleFeature(ctx) {
    const lastUpdated = ctx.timestamps?.lastUpdated;
    if (!lastUpdated) return false;
    const elapsed = Date.now() - new Date(lastUpdated).getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return elapsed >= sevenDays;
  },
};

// ── Action Functions ────────────────────────────────────────────────

/**
 * Action registry. Each action executes side-effects.
 * @type {Object<string, function(Object, string): void>}
 */
const ACTIONS = {
  /** Initialize feature in pdca-status.json */
  initFeature(ctx, _event) {
    const { updatePdcaStatus } = getStatus();
    updatePdcaStatus(ctx.feature, ctx.currentState, {
      iterationCount: 0,
      matchRate: null,
    });
  },

  /** Record timestamp for current phase */
  recordTimestamp(ctx, _event) {
    ctx.timestamps = ctx.timestamps || {};
    ctx.timestamps[ctx.currentState] = new Date().toISOString();
    ctx.timestamps.lastUpdated = new Date().toISOString();
  },

  /** Notify phase completion (logs) */
  notifyPhaseComplete(ctx, _event) {
    const { debugLog } = getCore();
    debugLog('PDCA-SM', `Phase complete: ${ctx.currentState}`, {
      feature: ctx.feature,
    });
  },

  /** Create checkpoint before Do phase */
  createCheckpoint(ctx, _event) {
    const { debugLog, PROJECT_DIR } = getCore();
    const cpDir = path.join(PROJECT_DIR, '.bkit', 'checkpoints');
    try {
      if (!fs.existsSync(cpDir)) {
        fs.mkdirSync(cpDir, { recursive: true });
      }
      const cpFile = path.join(cpDir, `cp-${ctx.feature}-${Date.now()}.json`);
      fs.writeFileSync(cpFile, JSON.stringify({
        feature: ctx.feature,
        state: ctx.currentState,
        timestamp: new Date().toISOString(),
        context: { matchRate: ctx.matchRate, iterationCount: ctx.iterationCount },
      }, null, 2));
      debugLog('PDCA-SM', 'Checkpoint created', { file: cpFile });
    } catch (_) { /* non-critical */ }
  },

  /** Record match rate in context */
  recordMatchRate(ctx, _event) {
    const { updatePdcaStatus } = getStatus();
    updatePdcaStatus(ctx.feature, ctx.currentState, {
      matchRate: ctx.matchRate,
    });
  },

  /** Increment iteration counter */
  incrementIteration(ctx, _event) {
    ctx.iterationCount = (ctx.iterationCount || 0) + 1;
    const { updatePdcaStatus } = getStatus();
    updatePdcaStatus(ctx.feature, ctx.currentState, {
      iterationCount: ctx.iterationCount,
    });
  },

  /** Archive PDCA documents */
  archiveDocuments(ctx, _event) {
    const { debugLog } = getCore();
    debugLog('PDCA-SM', 'Archiving documents', { feature: ctx.feature });
    // Actual file archival delegated to existing archive skill
  },

  /** Remove feature from active list */
  cleanupFeature(ctx, _event) {
    const { removeActiveFeature } = getStatus();
    removeActiveFeature(ctx.feature);
  },

  /** Force report generation when max iterations reached */
  forceReport(ctx, _event) {
    const { debugLog } = getCore();
    debugLog('PDCA-SM', 'Max iterations reached, forcing report', {
      feature: ctx.feature,
      iterations: ctx.iterationCount,
    });
  },

  /** Save resume point for error recovery */
  saveResumePoint(ctx, _event) {
    const { PROJECT_DIR, debugLog } = getCore();
    const resumeDir = path.join(PROJECT_DIR, '.bkit', 'state', 'resume');
    try {
      if (!fs.existsSync(resumeDir)) {
        fs.mkdirSync(resumeDir, { recursive: true });
      }
      const resumeFile = path.join(resumeDir, `${ctx.feature}.resume.json`);
      fs.writeFileSync(resumeFile, JSON.stringify({
        feature: ctx.feature,
        previousState: ctx.currentState,
        timestamp: new Date().toISOString(),
        context: {
          matchRate: ctx.matchRate,
          iterationCount: ctx.iterationCount,
        },
      }, null, 2));
      debugLog('PDCA-SM', 'Resume point saved', { feature: ctx.feature });
    } catch (_) { /* non-critical */ }
  },

  /** Log error notification */
  notifyError(ctx, _event) {
    const { debugLog } = getCore();
    debugLog('PDCA-SM', 'Error in PDCA cycle', {
      feature: ctx.feature,
      state: ctx.currentState,
      error: ctx.metadata?.error,
    });
  },

  /** Restore from resume data */
  restoreFromResume(ctx, _event) {
    const { PROJECT_DIR, debugLog } = getCore();
    const resumeFile = path.join(
      PROJECT_DIR, '.bkit', 'state', 'resume', `${ctx.feature}.resume.json`
    );
    try {
      if (fs.existsSync(resumeFile)) {
        const data = JSON.parse(fs.readFileSync(resumeFile, 'utf8'));
        ctx.currentState = data.previousState || 'idle';
        ctx.matchRate = data.context?.matchRate || ctx.matchRate;
        ctx.iterationCount = data.context?.iterationCount || ctx.iterationCount;
        fs.unlinkSync(resumeFile);
        debugLog('PDCA-SM', 'Restored from resume', { feature: ctx.feature, state: ctx.currentState });
      }
    } catch (_) { /* non-critical */ }
  },

  /** Restore from checkpoint */
  restoreCheckpoint(ctx, _event) {
    const { PROJECT_DIR, debugLog } = getCore();
    const cpDir = path.join(PROJECT_DIR, '.bkit', 'checkpoints');
    try {
      const files = fs.readdirSync(cpDir)
        .filter(f => f.includes(ctx.feature))
        .sort()
        .reverse();
      if (files.length > 0) {
        const cpData = JSON.parse(fs.readFileSync(path.join(cpDir, files[0]), 'utf8'));
        ctx.currentState = cpData.state || 'idle';
        ctx.matchRate = cpData.context?.matchRate || 0;
        ctx.iterationCount = cpData.context?.iterationCount || 0;
        debugLog('PDCA-SM', 'Restored from checkpoint', { feature: ctx.feature, state: ctx.currentState });
      }
    } catch (_) { /* non-critical */ }
  },

  /** Archive stale (timed-out) feature */
  archiveStale(ctx, _event) {
    const { debugLog } = getCore();
    const { updatePdcaStatus } = getStatus();
    updatePdcaStatus(ctx.feature, 'archived', {
      timestamps: { archivedAt: new Date().toISOString() },
      archivedReason: 'timeout',
    });
    debugLog('PDCA-SM', 'Stale feature archived', { feature: ctx.feature });
  },

  /** Archive abandoned feature */
  archiveAbandoned(ctx, _event) {
    const { debugLog } = getCore();
    const { updatePdcaStatus } = getStatus();
    updatePdcaStatus(ctx.feature, 'archived', {
      timestamps: { archivedAt: new Date().toISOString() },
      archivedReason: 'abandoned',
    });
    debugLog('PDCA-SM', 'Abandoned feature archived', { feature: ctx.feature });
  },
};

// ── Core API ────────────────────────────────────────────────────────

/**
 * Find matching transition entry from the table
 * @param {string} from - Current state
 * @param {string} event - Trigger event
 * @returns {Object|null} Matching TransitionEntry or null
 */
function findTransition(from, event) {
  // Exact match first, then wildcard
  const exact = TRANSITIONS.find(t => t.from === from && t.event === event);
  if (exact) return exact;
  const wildcard = TRANSITIONS.find(t => t.from === '*' && t.event === event);
  return wildcard || null;
}

/**
 * Execute a state transition
 * @param {string} currentState - Current PDCA state
 * @param {string} event - Trigger event
 * @param {Object} context - StateMachineContext
 * @returns {{success:boolean, previousState:string, currentState:string, event:string, executedActions:string[], blockedBy:string|null, timestamp:number}}
 */
function transition(currentState, event, context) {
  const { debugLog } = getCore();
  const now = Date.now();

  const entry = findTransition(currentState, event);
  if (!entry) {
    debugLog('PDCA-SM', 'No transition found', { from: currentState, event });
    return {
      success: false,
      previousState: currentState,
      currentState: currentState,
      event,
      executedActions: [],
      blockedBy: 'no_transition',
      timestamp: now,
    };
  }

  // Evaluate guard
  if (entry.guard) {
    const guardFn = GUARDS[entry.guard];
    if (guardFn && !guardFn(context)) {
      debugLog('PDCA-SM', 'Guard blocked transition', {
        from: currentState, event, guard: entry.guard,
      });
      return {
        success: false,
        previousState: currentState,
        currentState: currentState,
        event,
        executedActions: [],
        blockedBy: entry.guard,
        timestamp: now,
      };
    }
  }

  // Determine target state
  let targetState = entry.to;
  if (targetState === '*') {
    // Dynamic target — resolved after actions (RECOVER/ROLLBACK)
    targetState = context.currentState || currentState;
  }

  const previousState = currentState;
  context.currentState = targetState;

  // Execute actions
  const executedActions = [];
  for (const actionName of entry.actions) {
    const actionFn = ACTIONS[actionName];
    if (actionFn) {
      try {
        actionFn(context, event);
        executedActions.push(actionName);
      } catch (err) {
        debugLog('PDCA-SM', `Action failed: ${actionName}`, { error: err.message });
      }
    }
  }

  // For dynamic-target transitions, read back the resolved state
  if (entry.to === '*') {
    targetState = context.currentState;
  }

  // Record transition in history
  recordTransition(previousState, targetState, event, context);

  debugLog('PDCA-SM', 'Transition complete', {
    from: previousState, to: targetState, event, actions: executedActions,
  });

  return {
    success: true,
    previousState,
    currentState: targetState,
    event,
    executedActions,
    blockedBy: null,
    timestamp: now,
  };
}

/**
 * Check if a transition is possible without executing it
 * @param {string} currentState - Current state
 * @param {string} event - Event to check
 * @param {Object} [context] - Optional context for guard evaluation
 * @returns {boolean}
 */
function canTransition(currentState, event, context) {
  const entry = findTransition(currentState, event);
  if (!entry) return false;

  if (entry.guard && context) {
    const guardFn = GUARDS[entry.guard];
    if (guardFn && !guardFn(context)) return false;
  }

  return true;
}

/**
 * Get available events for a given state
 * @param {string} currentState - Current state
 * @param {Object} [context] - Optional context for guard evaluation
 * @returns {Array<{event:string, target:string, guard:string|null}>}
 */
function getAvailableEvents(currentState, context) {
  const results = [];
  const seen = new Set();

  for (const entry of TRANSITIONS) {
    if (entry.from !== currentState && entry.from !== '*') continue;
    if (seen.has(entry.event)) continue;

    // If context provided, check guard
    let passable = true;
    if (entry.guard && context) {
      const guardFn = GUARDS[entry.guard];
      if (guardFn && !guardFn(context)) passable = false;
    }

    if (passable) {
      results.push({
        event: entry.event,
        target: entry.to,
        guard: entry.guard,
      });
      seen.add(entry.event);
    }
  }

  return results;
}

/**
 * Get next phase options from current state
 * @param {string} currentState - Current state
 * @returns {string[]} Possible next states
 */
function getNextPhaseOptions(currentState) {
  const targets = new Set();
  for (const entry of TRANSITIONS) {
    if (entry.from === currentState || entry.from === '*') {
      if (entry.to !== '*') targets.add(entry.to);
    }
  }
  return Array.from(targets);
}

/**
 * Record a transition in pdca-status history
 * @param {string} from - Previous state
 * @param {string} to - New state
 * @param {string} event - Trigger event
 * @param {Object} context - Context
 */
function recordTransition(from, to, event, context) {
  const { addPdcaHistory } = getStatus();
  addPdcaHistory({
    feature: context.feature,
    event,
    from,
    to,
    action: 'state_transition',
    automationLevel: context.automationLevel,
  });
}

// ── Context Management ──────────────────────────────────────────────

/**
 * Create a new StateMachineContext for a feature
 * @param {string} feature - Feature name
 * @param {Object} [overrides] - Override values
 * @returns {Object} StateMachineContext
 */
function createContext(feature, overrides = {}) {
  const { getConfig } = getCore();
  return {
    feature,
    currentState: 'idle',
    matchRate: 0,
    iterationCount: 0,
    maxIterations: getConfig('automation.loopBreaker.maxPdcaIterations', 5),
    automationLevel: getConfig('automation.defaultLevel', 2),
    workflowId: 'default-pdca',
    timestamps: { created: new Date().toISOString() },
    metadata: {},
    ...overrides,
  };
}

/**
 * Load StateMachineContext from current pdca-status for a feature
 * @param {string} feature - Feature name
 * @returns {Object|null} StateMachineContext or null if not found
 */
function loadContext(feature) {
  const { getFeatureStatus } = getStatus();
  const { getConfig } = getCore();
  const featureData = getFeatureStatus(feature);
  if (!featureData) return null;

  return {
    feature,
    currentState: featureData.phase || 'idle',
    matchRate: featureData.matchRate || 0,
    iterationCount: featureData.iterationCount || 0,
    maxIterations: getConfig('automation.loopBreaker.maxPdcaIterations', 5),
    automationLevel: getConfig('automation.defaultLevel', 2),
    workflowId: featureData.workflowId || 'default-pdca',
    timestamps: featureData.timestamps || {},
    metadata: featureData.metadata || {},
  };
}

/**
 * Sync StateMachineContext back to pdca-status.json
 * @param {Object} context - StateMachineContext
 */
function syncContext(context) {
  const { updatePdcaStatus } = getStatus();
  updatePdcaStatus(context.feature, context.currentState, {
    matchRate: context.matchRate,
    iterationCount: context.iterationCount,
    workflowId: context.workflowId,
    timestamps: context.timestamps,
    metadata: context.metadata,
  });
}

// ── Utility ─────────────────────────────────────────────────────────

/**
 * Map legacy phase strings to state machine events
 * @param {string} fromPhase - Current phase ('plan', 'design', ...)
 * @param {string} toPhase - Target phase
 * @returns {string|null} PdcaEvent or null
 */
function phaseToEvent(fromPhase, toPhase) {
  const map = {
    'idle:pm': 'START',
    'idle:plan': 'SKIP_PM',
    'pm:plan': 'PM_DONE',
    'plan:design': 'PLAN_DONE',
    'design:do': 'DESIGN_DONE',
    'do:check': 'DO_COMPLETE',
    'check:report': 'MATCH_PASS',
    'check:act': 'ITERATE',
    'act:check': 'ANALYZE_DONE',
    'report:archived': 'REPORT_DONE',
    'pm:idle': 'REJECT',
    'plan:pm': 'REJECT',
  };

  return map[`${fromPhase}:${toPhase}`] || null;
}

/**
 * Generate ASCII state machine diagram (for debugging)
 * @returns {string}
 */
function printDiagram() {
  const lines = [
    'PDCA State Machine Diagram',
    '==========================',
    '',
  ];

  for (const t of TRANSITIONS) {
    const guard = t.guard ? ` [${t.guard}]` : '';
    const from = t.from === '*' ? '(any)' : t.from;
    const to = t.to === '*' ? '(dynamic)' : t.to;
    lines.push(`  ${from} --${t.event}${guard}--> ${to}`);
  }

  return lines.join('\n');
}

// ── Exports ─────────────────────────────────────────────────────────

module.exports = {
  // Constants
  TRANSITIONS,
  STATES,
  EVENTS,
  GUARDS,
  ACTIONS,

  // Core API
  transition,
  canTransition,
  getAvailableEvents,
  findTransition,

  // Context management
  createContext,
  loadContext,
  syncContext,

  // Utility
  getNextPhaseOptions,
  recordTransition,
  phaseToEvent,
  printDiagram,
};
