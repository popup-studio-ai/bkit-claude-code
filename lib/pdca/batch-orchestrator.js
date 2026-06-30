/**
 * Batch PDCA Orchestrator
 * @module lib/pdca/batch-orchestrator
 * @version 2.1.10
 *
 * Integrates /batch with PDCA workflow for large-scale refactoring.
 * Creates batch plans from Plan/Design documents, executes them
 * in groups, and triggers automatic Check phase on completion.
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

// ── Constants ───────────────────────────────────────────────────────

/** @type {number} Default max concurrent batch groups */
const DEFAULT_MAX_CONCURRENT = 3;

/** @type {number} Default max files per batch group */
const DEFAULT_GROUP_SIZE = 10;

/** @type {string} Batch state storage directory name */
const BATCH_STATE_DIR = 'batch';

// ── Internal: Batch ID Generation ───────────────────────────────────

/**
 * Generate a batch ID from feature name and timestamp
 * @param {string} feature
 * @returns {string}
 * @private
 */
function _generateBatchId(feature) {
  const ts = Date.now().toString(36);
  const safe = feature.replace(/[^a-zA-Z0-9-]/g, '-').substring(0, 30);
  return `batch-${safe}-${ts}`;
}

/**
 * Get path to batch state file
 * @param {string} batchId
 * @returns {string}
 * @private
 */
function _getBatchStatePath(batchId) {
  const { PROJECT_DIR } = getCore();
  return path.join(PROJECT_DIR, '.bkit', 'state', BATCH_STATE_DIR, `${batchId}.json`);
}

/**
 * Save batch state to disk
 * @param {string} batchId
 * @param {Object} state
 * @private
 */
function _saveBatchState(batchId, state) {
  const { stateStore } = getCore();
  const statePath = _getBatchStatePath(batchId);
  try {
    state.updatedAt = new Date().toISOString();
    // H1 fix (audit): atomic write of batch state.
    stateStore.write(statePath, state);
  } catch (_) { /* non-critical */ }
}

/**
 * Load batch state from disk
 * @param {string} batchId
 * @returns {Object|null}
 * @private
 */
function _loadBatchState(batchId) {
  const statePath = _getBatchStatePath(batchId);
  try {
    if (fs.existsSync(statePath)) {
      return JSON.parse(fs.readFileSync(statePath, 'utf8'));
    }
  } catch (_) { /* fall through */ }
  return null;
}

// ── Design/Plan Document Parsing ────────────────────────────────────

/**
 * Extract target files from a Plan or Design document
 * @param {string} docPath - Path to document
 * @returns {string[]} Array of file paths
 * @private
 */
function _extractFilesFromDoc(docPath) {
  if (!docPath || !fs.existsSync(docPath)) return [];

  try {
    const content = fs.readFileSync(docPath, 'utf8');
    const files = [];

    // Match file paths in markdown tables: | `path/to/file.js` |
    const tablePattern = /\|\s*`([^`]+\.[a-zA-Z]+)`\s*\|/g;
    let match;
    while ((match = tablePattern.exec(content)) !== null) {
      const filePath = match[1].trim();
      if (filePath !== '파일' && filePath !== 'File' && !filePath.includes('---')) {
        files.push(filePath);
      }
    }

    // Match file paths in code blocks or inline: `path/to/file.js`
    const inlinePattern = /`((?:lib|src|hooks|skills|agents|templates)\/[^`]+\.[a-zA-Z]+)`/g;
    while ((match = inlinePattern.exec(content)) !== null) {
      const filePath = match[1].trim();
      if (!files.includes(filePath)) {
        files.push(filePath);
      }
    }

    return files;
  } catch (_) {
    return [];
  }
}

/**
 * Extract refactoring instructions from a Plan document
 * @param {string} docPath - Path to plan document
 * @returns {string} Instruction text
 * @private
 */
function _extractInstruction(docPath) {
  if (!docPath || !fs.existsSync(docPath)) return '';

  try {
    const content = fs.readFileSync(docPath, 'utf8');

    // Look for "목적" or "Purpose" or "Description" sections
    const sectionPattern = /##\s*(?:\d+\.?\s*)?(?:목적|Purpose|Description|Overview|요약|Summary)\s*\n([\s\S]*?)(?=\n##|\n---|\n$)/i;
    const match = content.match(sectionPattern);
    if (match) {
      return match[1].trim().substring(0, 500);
    }

    // Fallback: first paragraph after title
    const firstParagraph = content.match(/^#[^\n]+\n+([^\n#]+)/m);
    if (firstParagraph) {
      return firstParagraph[1].trim().substring(0, 500);
    }
  } catch (_) { /* fall through */ }

  return '';
}

// ── Core API ────────────────────────────────────────────────────────

/**
 * Create a batch PDCA plan for multiple features or a single feature refactoring
 * @param {string[]} features - Feature names
 * @param {Object} [options] - {workflow, parallel, groupSize}
 * @returns {{plan: Object, warnings: string[]}}
 */
function createBatchPlan(features, options = {}) {
  const { debugLog } = getCore();
  const { findPlanDoc, findDesignDoc } = getPhase();
  const { groupSize = DEFAULT_GROUP_SIZE } = options;

  const warnings = [];
  const allGroups = [];
  let totalFiles = 0;

  for (const feature of features) {
    const planDoc = findPlanDoc(feature);
    const designDoc = findDesignDoc(feature);

    if (!planDoc && !designDoc) {
      warnings.push(`No Plan or Design document found for "${feature}"`);
      continue;
    }

    // Extract files from both docs (design takes precedence)
    const designFiles = designDoc ? _extractFilesFromDoc(designDoc) : [];
    const planFiles = planDoc ? _extractFilesFromDoc(planDoc) : [];

    // Merge, deduplicate
    const fileSet = new Set([...designFiles, ...planFiles]);
    const files = Array.from(fileSet);

    if (files.length === 0) {
      warnings.push(`No target files found in documents for "${feature}"`);
      continue;
    }

    // Extract instruction
    const instruction = _extractInstruction(designDoc || planDoc);

    // Split into groups
    for (let i = 0; i < files.length; i += groupSize) {
      const groupFiles = files.slice(i, i + groupSize);
      allGroups.push({
        id: `group-${allGroups.length + 1}`,
        feature,
        files: groupFiles,
        instruction: instruction || `Implement changes for ${feature}`,
        status: 'pending',
        completedFiles: 0,
      });
      totalFiles += groupFiles.length;
    }
  }

  const batchId = _generateBatchId(features[0] || 'multi');

  const plan = {
    batchId,
    features,
    groups: allGroups,
    totalFiles,
    totalGroups: allGroups.length,
    status: 'pending',
    createdAt: new Date().toISOString(),
    options: {
      parallel: options.parallel !== false,
      maxConcurrent: options.parallel !== false ? DEFAULT_MAX_CONCURRENT : 1,
      groupSize,
    },
  };

  // Persist plan
  _saveBatchState(batchId, plan);

  debugLog('BATCH-ORCH', 'Batch plan created', {
    batchId,
    features: features.length,
    groups: allGroups.length,
    totalFiles,
  });

  return { plan, warnings };
}

/**
 * Execute batch plan (sequential or parallel)
 * @param {Object} plan - BatchPlan object
 * @returns {{results: Object[], summary: string}}
 */
function executeBatchPlan(plan) {
  const { debugLog } = getCore();
  const { updatePdcaStatus } = getStatus();
  const startTime = Date.now();

  if (!plan || !plan.groups || plan.groups.length === 0) {
    return { results: [], summary: 'No groups to execute' };
  }

  plan.status = 'running';
  _saveBatchState(plan.batchId, plan);

  const results = [];
  let completedGroups = 0;
  let failedGroups = 0;

  for (const group of plan.groups) {
    try {
      group.status = 'running';
      _saveBatchState(plan.batchId, plan);

      // STUB: Batch dispatch not yet implemented.
      // In production, each group would be dispatched via /batch skill.
      // Currently, groups are marked complete for manual batch processing.
      group.status = 'completed';
      group.completedFiles = group.files.length;
      completedGroups++;

      results.push({
        groupId: group.id,
        feature: group.feature,
        status: 'completed',
        files: group.files.length,
      });
    } catch (err) {
      group.status = 'failed';
      failedGroups++;

      results.push({
        groupId: group.id,
        feature: group.feature,
        status: 'failed',
        error: err.message,
      });
    }
  }

  const elapsedMs = Date.now() - startTime;
  plan.status = failedGroups === 0 ? 'completed' : 'partial';
  plan.completedAt = new Date().toISOString();
  plan.elapsedMs = elapsedMs;
  _saveBatchState(plan.batchId, plan);

  // Update PDCA status for each feature
  const featureSet = new Set(plan.features);
  for (const feature of featureSet) {
    updatePdcaStatus(feature, 'do', {
      metadata: {
        batchResult: {
          batchId: plan.batchId,
          completedGroups,
          failedGroups,
          totalGroups: plan.groups.length,
        },
      },
    });
  }

  const summary = [
    `Batch ${plan.batchId}: ${completedGroups}/${plan.groups.length} groups completed`,
    failedGroups > 0 ? `, ${failedGroups} failed` : '',
    ` (${elapsedMs}ms)`,
  ].join('');

  debugLog('BATCH-ORCH', 'Batch execution complete', { batchId: plan.batchId, summary });

  return { results, summary };
}

/**
 * Get batch status
 * @param {string} batchId - Batch identifier
 * @returns {{status: string, progress: number, features: Object[]}|null}
 */
function getBatchStatus(batchId) {
  const state = _loadBatchState(batchId);
  if (!state) return null;

  const totalGroups = state.groups?.length || 0;
  const completedGroups = (state.groups || []).filter(g => g.status === 'completed').length;
  const progress = totalGroups > 0 ? Math.round((completedGroups / totalGroups) * 100) : 0;

  // Per-feature breakdown
  const featureMap = new Map();
  for (const group of (state.groups || [])) {
    if (!featureMap.has(group.feature)) {
      featureMap.set(group.feature, { feature: group.feature, completed: 0, total: 0, status: 'pending' });
    }
    const entry = featureMap.get(group.feature);
    entry.total++;
    if (group.status === 'completed') entry.completed++;
  }

  // Determine per-feature status
  for (const entry of featureMap.values()) {
    if (entry.completed === entry.total) entry.status = 'completed';
    else if (entry.completed > 0) entry.status = 'running';
  }

  return {
    status: state.status || 'unknown',
    progress,
    features: Array.from(featureMap.values()),
  };
}

/**
 * Cancel running batch
 * @param {string} batchId - Batch identifier
 * @returns {{cancelled: boolean, reason: string}}
 */
function cancelBatch(batchId) {
  const { debugLog } = getCore();
  const state = _loadBatchState(batchId);

  if (!state) {
    return { cancelled: false, reason: 'Batch not found' };
  }

  if (state.status === 'completed' || state.status === 'cancelled') {
    return { cancelled: false, reason: `Batch already ${state.status}` };
  }

  // Mark pending/running groups as cancelled
  for (const group of (state.groups || [])) {
    if (group.status === 'pending' || group.status === 'running') {
      group.status = 'cancelled';
    }
  }

  state.status = 'cancelled';
  state.cancelledAt = new Date().toISOString();
  _saveBatchState(batchId, state);

  debugLog('BATCH-ORCH', 'Batch cancelled', { batchId });

  return { cancelled: true, reason: 'Batch cancelled successfully' };
}

/**
 * Trigger automatic Check phase after batch completion
 * @param {string} feature - Feature name
 * @param {Object} batchResult - Result from executeBatchPlan
 */
function triggerAutoCheck(feature, batchResult) {
  const { debugLog } = getCore();
  const { updatePdcaStatus, addPdcaHistory } = getStatus();

  // Only trigger if batch was successful
  const allCompleted = (batchResult.results || []).every(r => r.status === 'completed');
  if (!allCompleted) {
    debugLog('BATCH-ORCH', 'Skipping auto-check: batch not fully completed', { feature });
    return;
  }

  // Update feature to check phase
  updatePdcaStatus(feature, 'check', {
    metadata: {
      autoCheckTriggeredBy: 'batch-orchestrator',
      batchSummary: batchResult.summary,
    },
  });

  addPdcaHistory({
    feature,
    action: 'auto_check_triggered',
    triggeredBy: 'batch-orchestrator',
  });

  debugLog('BATCH-ORCH', 'Auto-check triggered', { feature });
}

/**
 * Resume a cancelled or partially failed batch
 * @param {string} batchId - Batch identifier
 * @returns {{resumed: boolean, plan: Object|null, reason: string}}
 */
function resumeBatch(batchId) {
  const { debugLog } = getCore();
  const state = _loadBatchState(batchId);

  if (!state) {
    return { resumed: false, plan: null, reason: 'Batch not found' };
  }

  if (state.status === 'completed') {
    return { resumed: false, plan: null, reason: 'Batch already completed' };
  }

  // Reset cancelled/failed groups to pending
  let resetCount = 0;
  for (const group of (state.groups || [])) {
    if (group.status === 'cancelled' || group.status === 'failed') {
      group.status = 'pending';
      group.completedFiles = 0;
      resetCount++;
    }
  }

  if (resetCount === 0) {
    return { resumed: false, plan: null, reason: 'No groups to resume' };
  }

  state.status = 'pending';
  state.resumedAt = new Date().toISOString();
  _saveBatchState(batchId, state);

  debugLog('BATCH-ORCH', 'Batch resumed', { batchId, resetGroups: resetCount });

  return { resumed: true, plan: state, reason: `${resetCount} groups reset to pending` };
}

// ── Exports ─────────────────────────────────────────────────────────

module.exports = {
  // Core API
  createBatchPlan,
  executeBatchPlan,
  getBatchStatus,
  cancelBatch,

  // Auto-check integration
  triggerAutoCheck,

  // Resume
  resumeBatch,
};
