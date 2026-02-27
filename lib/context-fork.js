#!/usr/bin/env node
/**
 * Context Fork Isolation (FR-03)
 * Creates isolated context copies for skill/agent execution
 *
 * @version 1.5.6
 * @module lib/context-fork
 */

// Import from common.js (lazy to avoid circular dependency)
let _common = null;
function getCommon() {
  if (!_common) {
    _common = require('./common.js');
  }
  return _common;
}

// Fork storage (in-memory)
const _forks = new Map();
let _forkIdCounter = 0;

/**
 * Create a forked context
 * @param {string} skillOrAgentName - Name of skill/agent
 * @param {Object} options - Fork options
 * @param {boolean} options.mergeResult - Whether to merge result back (default: true)
 * @param {string[]} options.includeFields - Fields to include in fork
 * @returns {{ forkId: string, context: Object }}
 */
function forkContext(skillOrAgentName, options = {}) {
  const common = getCommon();
  const forkId = `fork-${++_forkIdCounter}-${Date.now()}`;

  // Deep clone current PDCA status
  const currentStatus = common.getPdcaStatusFull(true);
  const forkedStatus = JSON.parse(JSON.stringify(currentStatus || {}));

  // Create fork metadata
  const fork = {
    id: forkId,
    name: skillOrAgentName,
    createdAt: new Date().toISOString(),
    parentState: currentStatus,
    forkedState: forkedStatus,
    mergeResult: options.mergeResult !== false,
    includeFields: options.includeFields || ['features', 'history'],
    merged: false
  };

  _forks.set(forkId, fork);

  common.debugLog('ContextFork', 'Context forked', {
    forkId,
    skillOrAgentName,
    mergeResult: fork.mergeResult
  });

  return {
    forkId,
    context: forkedStatus
  };
}

/**
 * Get forked context by ID
 * @param {string} forkId - Fork ID
 * @returns {Object|null}
 */
function getForkedContext(forkId) {
  const fork = _forks.get(forkId);
  return fork ? fork.forkedState : null;
}

/**
 * Update forked context
 * @param {string} forkId - Fork ID
 * @param {Object} updates - Partial updates
 */
function updateForkedContext(forkId, updates) {
  const common = getCommon();
  const fork = _forks.get(forkId);
  if (!fork) {
    common.debugLog('ContextFork', 'Fork not found', { forkId });
    return;
  }

  Object.assign(fork.forkedState, updates);
  common.debugLog('ContextFork', 'Fork updated', { forkId, keys: Object.keys(updates) });
}

/**
 * Merge forked context back to parent
 * @param {string} forkId - Fork ID
 * @param {Object} options - Merge options
 * @param {string[]} options.fields - Fields to merge (default: from fork config)
 * @returns {{ success: boolean, merged: Object|null, error: string|null }}
 */
function mergeForkedContext(forkId, options = {}) {
  const common = getCommon();
  const fork = _forks.get(forkId);

  if (!fork) {
    return { success: false, merged: null, error: 'Fork not found' };
  }

  if (!fork.mergeResult) {
    // Fork was created with mergeResult: false
    common.debugLog('ContextFork', 'Merge skipped (mergeResult: false)', { forkId });
    _forks.delete(forkId);
    return { success: true, merged: null, error: null };
  }

  // Strategy: merge specific fields from forked state
  const mergeFields = options.fields || fork.includeFields || ['features', 'history'];
  const currentStatus = common.getPdcaStatusFull(true);

  for (const field of mergeFields) {
    if (fork.forkedState[field]) {
      if (Array.isArray(fork.forkedState[field])) {
        // Merge arrays (deduplicate)
        currentStatus[field] = [
          ...new Set([
            ...(currentStatus[field] || []),
            ...fork.forkedState[field]
          ])
        ];
      } else if (typeof fork.forkedState[field] === 'object') {
        // Merge objects
        currentStatus[field] = {
          ...currentStatus[field],
          ...fork.forkedState[field]
        };
      } else {
        // Replace primitives
        currentStatus[field] = fork.forkedState[field];
      }
    }
  }

  // Save merged state
  common.savePdcaStatus(currentStatus);

  // Mark as merged and cleanup
  fork.merged = true;
  _forks.delete(forkId);

  common.debugLog('ContextFork', 'Context merged', {
    forkId,
    mergedFields: mergeFields
  });

  return { success: true, merged: currentStatus, error: null };
}

/**
 * Check if execution is in forked context
 * @param {string} forkId - Fork ID to check
 * @returns {boolean}
 */
function isForkedExecution(forkId) {
  return _forks.has(forkId);
}

/**
 * Discard forked context without merging
 * @param {string} forkId - Fork ID
 */
function discardFork(forkId) {
  const common = getCommon();
  _forks.delete(forkId);
  common.debugLog('ContextFork', 'Fork discarded', { forkId });
}

/**
 * Get all active forks
 * @returns {Array<{ forkId: string, name: string, createdAt: string }>}
 */
function getActiveForks() {
  return Array.from(_forks.entries()).map(([forkId, fork]) => ({
    forkId,
    name: fork.name,
    createdAt: fork.createdAt,
    mergeResult: fork.mergeResult
  }));
}

/**
 * Get fork metadata
 * @param {string} forkId - Fork ID
 * @returns {Object|null}
 */
function getForkMetadata(forkId) {
  const fork = _forks.get(forkId);
  if (!fork) return null;

  return {
    id: fork.id,
    name: fork.name,
    createdAt: fork.createdAt,
    mergeResult: fork.mergeResult,
    includeFields: fork.includeFields,
    merged: fork.merged
  };
}

/**
 * Clear all forks (cleanup)
 */
function clearAllForks() {
  const common = getCommon();
  const count = _forks.size;
  _forks.clear();
  common.debugLog('ContextFork', 'All forks cleared', { count });
}

module.exports = {
  forkContext,
  getForkedContext,
  updateForkedContext,
  mergeForkedContext,
  isForkedExecution,
  discardFork,
  getActiveForks,
  getForkMetadata,
  clearAllForks
};
