#!/usr/bin/env node
/**
 * Loop Breaker (FR-12)
 * Prevents infinite loops in PDCA automation using 4 detection rules.
 *
 * Rules LB-001 to LB-004 cover PDCA iteration loops, same-file edit loops,
 * agent recursion, and error retry loops.
 *
 * Counters are stored in memory (Map) and reset on session start.
 *
 * @version 2.0.0
 * @module lib/control/loop-breaker
 */

/**
 * @typedef {Object} LoopCheckResult
 * @property {boolean} detected - Whether a loop was detected
 * @property {string|null} rule - Rule ID that triggered (e.g., 'LB-001')
 * @property {number} count - Current count for the triggering rule
 * @property {'warn'|'pause'|'abort'} action - Recommended action
 */

/**
 * Loop detection rule definitions
 * @type {Object<string, {name: string, maxCount: number, warnAt: number, action: 'warn'|'pause'|'abort'}>}
 */
const LOOP_RULES = {
  'LB-001': {
    name: 'PDCA iteration loop',
    description: 'check→act→check pattern repeating',
    maxCount: 5,
    warnAt: 3,
    action: 'abort'
  },
  'LB-002': {
    name: 'Same file edit loop',
    description: 'Same file modified repeatedly',
    maxCount: 10,
    warnAt: 7,
    action: 'pause'
  },
  'LB-003': {
    name: 'Agent recursion',
    description: 'A→B→A agent call pattern',
    maxCount: 3,
    warnAt: 2,
    action: 'abort'
  },
  'LB-004': {
    name: 'Error retry loop',
    description: 'Same error occurring repeatedly',
    maxCount: 3,
    warnAt: 2,
    action: 'pause'
  }
};

// In-memory counters
/** @type {Map<string, number>} PDCA iteration counter per feature */
const pdcaIterations = new Map();

/** @type {Map<string, number>} File edit counter per file path */
const fileEditCounts = new Map();

/** @type {string[]} Agent call stack for recursion detection */
const agentCallStack = [];

/** @type {Map<string, number>} Error counter per error signature */
const errorCounts = new Map();

/**
 * Record an action for loop detection tracking
 * @param {'pdca_iteration'|'file_edit'|'agent_call'|'error'} actionType - Type of action
 * @param {string} target - Target identifier (feature name, file path, agent name, or error message)
 */
function recordAction(actionType, target) {
  if (!target || typeof target !== 'string') return;

  switch (actionType) {
    case 'pdca_iteration': {
      const current = pdcaIterations.get(target) || 0;
      pdcaIterations.set(target, current + 1);
      break;
    }
    case 'file_edit': {
      const current = fileEditCounts.get(target) || 0;
      fileEditCounts.set(target, current + 1);
      break;
    }
    case 'agent_call': {
      agentCallStack.push(target);
      // Keep stack bounded
      if (agentCallStack.length > 100) {
        agentCallStack.splice(0, agentCallStack.length - 50);
      }
      break;
    }
    case 'error': {
      // Normalize error signature (first 200 chars)
      const signature = target.substring(0, 200);
      const current = errorCounts.get(signature) || 0;
      errorCounts.set(signature, current + 1);
      break;
    }
  }
}

/**
 * Check all loop rules against current counters
 * @returns {LoopCheckResult}
 */
function checkLoop() {
  // LB-001: PDCA iteration loop
  for (const [feature, count] of pdcaIterations) {
    if (count >= LOOP_RULES['LB-001'].maxCount) {
      return { detected: true, rule: 'LB-001', count, action: 'abort' };
    }
    if (count >= LOOP_RULES['LB-001'].warnAt) {
      return { detected: true, rule: 'LB-001', count, action: 'warn' };
    }
  }

  // LB-002: Same file edit loop
  for (const [filePath, count] of fileEditCounts) {
    if (count >= LOOP_RULES['LB-002'].maxCount) {
      return { detected: true, rule: 'LB-002', count, action: 'pause' };
    }
    if (count >= LOOP_RULES['LB-002'].warnAt) {
      return { detected: true, rule: 'LB-002', count, action: 'warn' };
    }
  }

  // LB-003: Agent recursion (A→B→A pattern)
  if (agentCallStack.length >= 3) {
    const len = agentCallStack.length;
    // Check for A→B→A pattern in the most recent calls
    for (let i = len - 1; i >= 2; i--) {
      if (agentCallStack[i] === agentCallStack[i - 2] && agentCallStack[i] !== agentCallStack[i - 1]) {
        // Count consecutive A→B→A occurrences
        let recursionCount = 1;
        for (let j = i - 2; j >= 2; j -= 2) {
          if (agentCallStack[j] === agentCallStack[i] && agentCallStack[j + 1] === agentCallStack[i - 1]) {
            recursionCount++;
          } else {
            break;
          }
        }
        if (recursionCount >= LOOP_RULES['LB-003'].maxCount) {
          return { detected: true, rule: 'LB-003', count: recursionCount, action: 'abort' };
        }
        if (recursionCount >= LOOP_RULES['LB-003'].warnAt) {
          return { detected: true, rule: 'LB-003', count: recursionCount, action: 'warn' };
        }
      }
    }
  }

  // LB-004: Error retry loop
  for (const [errorSig, count] of errorCounts) {
    if (count >= LOOP_RULES['LB-004'].maxCount) {
      return { detected: true, rule: 'LB-004', count, action: 'pause' };
    }
    if (count >= LOOP_RULES['LB-004'].warnAt) {
      return { detected: true, rule: 'LB-004', count, action: 'warn' };
    }
  }

  return { detected: false, rule: null, count: 0, action: 'warn' };
}

/**
 * Reset loop detection counters
 * @param {'all'|'feature'|'session'} scope - Scope of reset
 * @param {string} [target] - Target identifier (required for 'feature' scope)
 */
function reset(scope, target) {
  switch (scope) {
    case 'all':
    case 'session':
      pdcaIterations.clear();
      fileEditCounts.clear();
      agentCallStack.length = 0;
      errorCounts.clear();
      break;
    case 'feature':
      if (target) {
        pdcaIterations.delete(target);
      }
      break;
  }
}

/**
 * Get current counter state for debugging/monitoring
 * @returns {Object}
 */
function getCounters() {
  return {
    pdcaIterations: Object.fromEntries(pdcaIterations),
    fileEditCounts: Object.fromEntries(fileEditCounts),
    agentCallStack: [...agentCallStack],
    errorCounts: Object.fromEntries(errorCounts)
  };
}

/**
 * Reset a specific counter for a rule/target combination
 * @param {string} ruleId - Rule ID (e.g., 'LB-001')
 * @param {string} [key] - Target key to reset
 */
function resetCounter(ruleId, key) {
  switch (ruleId) {
    case 'LB-001': key ? pdcaIterations.delete(key) : pdcaIterations.clear(); break;
    case 'LB-002': key ? fileEditCounts.delete(key) : fileEditCounts.clear(); break;
    case 'LB-003': agentCallStack.length = 0; break;
    case 'LB-004': key ? errorCounts.delete(key) : errorCounts.clear(); break;
  }
}

/**
 * Reset all counters for a specific rule
 * @param {string} ruleId - Rule ID to reset
 */
function resetRule(ruleId) {
  resetCounter(ruleId);
}

/**
 * Override the threshold for a specific rule at runtime
 * @param {string} ruleId - Rule ID
 * @param {number} newThreshold - New threshold value
 * @returns {boolean} True if rule was found and updated
 */
function setThreshold(ruleId, newThreshold) {
  // v2.1.8 fix B1 (Q1 rework): LOOP_RULES is an object (direct key access) AND rules
  // store thresholds under `maxCount` / `warnAt` keys (not `threshold`). Writing to
  // `rule.threshold` was a dead write — checkLoop reads `rule.maxCount` / `rule.warnAt`.
  // This rework writes to `maxCount` and scales `warnAt` proportionally if present.
  const rule = LOOP_RULES[ruleId];
  if (!rule) throw new Error(`Unknown loop rule: ${ruleId}`);
  if (typeof newThreshold !== 'number' || newThreshold <= 0) return false;
  // Preserve warnAt:maxCount ratio when both exist (e.g. warn at 60%).
  if (typeof rule.maxCount === 'number' && rule.maxCount > 0 && typeof rule.warnAt === 'number') {
    const ratio = rule.warnAt / rule.maxCount;
    rule.warnAt = Math.max(1, Math.round(newThreshold * ratio));
  }
  rule.maxCount = newThreshold;
  return true;
}

module.exports = {
  recordAction,
  checkLoop,
  reset,
  getCounters,
  resetCounter,
  resetRule,
  setThreshold,
  LOOP_RULES
};
