/**
 * Declarative PDCA Finite State Machine
 * @module lib/pdca/state-machine
 * @version 2.1.10
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

// S3a ENH-344: STATES/EVENTS/TRANSITIONS/GUARDS/ACTIONS extracted to ./state-transitions
const { STATES, EVENTS, TRANSITIONS, GUARDS, ACTIONS } = require('./state-transitions');

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

  // v2.1.12 Sprint B-3 (#13): accept either string or {event, target, guard}.
  const eventName = _normaliseEvent(event);
  const entry = eventName ? findTransition(currentState, eventName) : null;
  if (!entry) {
    debugLog('PDCA-SM', 'No transition found', { from: currentState, event: eventName });
    return {
      success: false,
      previousState: currentState,
      currentState: currentState,
      event: eventName,
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
  // v2.1.12 Sprint B-3 (#24 sub-issue): default context to a fresh object
  // when caller omits it (was throwing TypeError on the next line).
  // Callers that pass a real context still see their object mutated as before.
  const ctx = context || {};

  if (targetState === '*') {
    // Dynamic target — resolved after actions (RECOVER/ROLLBACK)
    targetState = ctx.currentState || currentState;
  }

  const previousState = currentState;
  ctx.currentState = targetState;

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

  // v2.1.12 Sprint B-3 (#24): use the normalised ctx (defaulted from context).
  if (entry.to === '*') {
    targetState = ctx.currentState;
  }

  // Record transition in history
  recordTransition(previousState, targetState, eventName, ctx);

  debugLog('PDCA-SM', 'Transition complete', {
    from: previousState, to: targetState, event: eventName, actions: executedActions,
  });

  return {
    success: true,
    previousState,
    currentState: targetState,
    // v2.1.12 Sprint B-3 (#13): always return the normalised event name
    // so downstream consumers see a stable string regardless of input form.
    event: eventName,
    executedActions,
    blockedBy: null,
    timestamp: now,
  };
}

/**
 * Normalise an event identifier so the API accepts either a string event
 * name or an object as returned by `getAvailableEvents()` ({event, target, guard}).
 * Centralises the v2.1.12 Sprint B-3 (defect #13) fix.
 * @param {string|Object} event
 * @returns {string|null}
 * @private
 */
function _normaliseEvent(event) {
  if (event == null) return null;
  if (typeof event === 'string') return event;
  if (typeof event === 'object' && typeof event.event === 'string') return event.event;
  return null;
}

/**
 * Check if a transition is possible without executing it.
 *
 * v2.1.12 Sprint B-3 (defect #13 fix): accepts either a string event name
 * or an object returned by `getAvailableEvents()` (`{event, target, guard}`).
 * Previously only strings were accepted, which made the natural pattern
 * `getAvailableEvents(s).filter(e => canTransition(s, e))` silently return
 * `false` for every entry.
 *
 * @param {string} currentState - Current state
 * @param {string|{event:string}} event - Event name or event descriptor
 * @param {Object} [context] - Optional context for guard evaluation
 * @returns {boolean}
 */
function canTransition(currentState, event, context) {
  const eventName = _normaliseEvent(event);
  if (eventName === null) return false;
  const entry = findTransition(currentState, eventName);
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
  // v2.1.12 Sprint B-3 (#24): defensive default — recordTransition is reached
  // through transition(...) which now defaults context to {}. Guard the
  // history-write so a missing context cannot crash the state machine.
  const ctx = context || {};
  const { addPdcaHistory } = getStatus();
  addPdcaHistory({
    feature: ctx.feature || null,
    event,
    from,
    to,
    action: 'state_transition',
    automationLevel: ctx.automationLevel != null ? ctx.automationLevel : null,
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
    'check:qa': 'MATCH_PASS',
    'check:act': 'ITERATE',
    'act:check': 'ANALYZE_DONE',
    'qa:report': 'QA_PASS',
    'qa:act': 'QA_FAIL',
    'act:qa': 'QA_RETRY',
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
