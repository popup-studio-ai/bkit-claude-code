#!/usr/bin/env node
/**
 * Checkpoint Manager (FR-11)
 * Creates, lists, restores, and prunes checkpoints for PDCA state rollback.
 *
 * Storage layout:
 *   .bkit/checkpoints/index.json        — checkpoint index
 *   .bkit/checkpoints/cp-{timestamp}.json — individual checkpoint snapshots
 *
 * Each checkpoint includes a SHA-256 integrity hash of pdca-status.
 *
 * @version 2.0.0
 * @module lib/control/checkpoint-manager
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function getProjectDir() {
  try { return require('../core/platform').PROJECT_DIR; } catch (_) { return process.cwd(); }
}

/**
 * @typedef {'auto'|'manual'|'phase_transition'|'pre_destructive'} CheckpointType
 */

/**
 * @typedef {Object} Checkpoint
 * @property {string} id - Unique checkpoint ID (cp-{timestamp})
 * @property {string} createdAt - ISO 8601 timestamp
 * @property {CheckpointType} type - Checkpoint type
 * @property {string} phase - PDCA phase at checkpoint time
 * @property {string} feature - Feature name
 * @property {string} description - Human-readable description
 * @property {string} pdcaStatusHash - SHA-256 hash of pdca-status snapshot
 * @property {Object} pdcaStatus - Snapshot of pdca-status.json
 * @property {Object|null} fileHashes - Optional file SHA-256 hashes
 * @property {string} path - File path of this checkpoint
 */

/** Base directory for checkpoints */
const CHECKPOINTS_DIR = '.bkit/checkpoints';
const INDEX_FILE = 'index.json';
const PDCA_STATUS_PATH = '.bkit/state/pdca-status.json';

/**
 * Ensure the checkpoints directory exists
 * @returns {string} Absolute path to checkpoints directory
 */
function ensureDir() {
  const dir = path.resolve(getProjectDir(), CHECKPOINTS_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Compute SHA-256 hash of a string or buffer
 * @param {string|Buffer} data - Data to hash
 * @returns {string} Hex-encoded SHA-256 hash
 */
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Load the checkpoint index
 * @returns {Array<{id: string, createdAt: string, type: string, phase: string, feature: string, description: string}>}
 */
function loadIndex() {
  const dir = ensureDir();
  const indexPath = path.join(dir, INDEX_FILE);
  if (!fs.existsSync(indexPath)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  } catch {
    return [];
  }
}

/**
 * Save the checkpoint index
 * @param {Array} index - Index entries
 */
function saveIndex(index) {
  const dir = ensureDir();
  const indexPath = path.join(dir, INDEX_FILE);
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');
}

/**
 * Read the current pdca-status.json
 * @returns {Object|null}
 */
function readPdcaStatus() {
  const statusPath = path.resolve(process.cwd(), PDCA_STATUS_PATH);
  if (!fs.existsSync(statusPath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Write pdca-status.json
 * @param {Object} status - Status object to write
 */
function writePdcaStatus(status) {
  const statusPath = path.resolve(process.cwd(), PDCA_STATUS_PATH);
  const dir = path.dirname(statusPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2), 'utf-8');
}

/**
 * Create a checkpoint snapshot
 * @param {string} feature - Feature name
 * @param {string} phase - Current PDCA phase (plan|design|do|check|act)
 * @param {CheckpointType} type - Checkpoint type
 * @param {string} description - Human-readable description
 * @param {Object} [fileHashes=null] - Optional map of filePath → SHA-256 hash
 * @returns {{id: string, path: string}}
 */
function createCheckpoint(feature, phase, type, description, fileHashes = null) {
  const dir = ensureDir();
  const timestamp = Date.now();
  const id = `cp-${timestamp}`;
  const cpPath = path.join(dir, `${id}.json`);

  const pdcaStatus = readPdcaStatus();
  const pdcaStatusStr = JSON.stringify(pdcaStatus);
  const pdcaStatusHash = sha256(pdcaStatusStr);

  /** @type {Checkpoint} */
  const checkpoint = {
    id,
    createdAt: new Date(timestamp).toISOString(),
    type,
    phase,
    feature,
    description,
    pdcaStatusHash,
    pdcaStatus,
    fileHashes,
    path: cpPath
  };

  fs.writeFileSync(cpPath, JSON.stringify(checkpoint, null, 2), 'utf-8');

  // Update index
  const index = loadIndex();
  index.push({
    id,
    createdAt: checkpoint.createdAt,
    type,
    phase,
    feature,
    description
  });
  saveIndex(index);

  return { id, path: cpPath };
}

/**
 * List all checkpoints for a feature
 * @param {string} [feature] - Filter by feature name (all if omitted)
 * @returns {Array<{id: string, createdAt: string, type: string, phase: string, description: string}>}
 */
function listCheckpoints(feature) {
  const index = loadIndex();
  if (!feature) return index;
  return index.filter(entry => entry.feature === feature);
}

/**
 * Get a full checkpoint by ID
 * @param {string} checkpointId - Checkpoint ID (e.g., 'cp-1234567890')
 * @returns {Checkpoint|null}
 */
function getCheckpoint(checkpointId) {
  const dir = ensureDir();
  const cpPath = path.join(dir, `${checkpointId}.json`);
  if (!fs.existsSync(cpPath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(cpPath, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Rollback to a specific checkpoint
 * Restores pdca-status.json from the checkpoint snapshot after verifying integrity.
 * @param {string} checkpointId - Checkpoint ID to rollback to
 * @returns {{restored: boolean, details: string}}
 */
function rollbackToCheckpoint(checkpointId) {
  const checkpoint = getCheckpoint(checkpointId);
  if (!checkpoint) {
    return { restored: false, details: `Checkpoint not found: ${checkpointId}` };
  }

  if (!checkpoint.pdcaStatus) {
    return { restored: false, details: `Checkpoint ${checkpointId} has no pdca-status snapshot` };
  }

  // Verify integrity
  const snapshotStr = JSON.stringify(checkpoint.pdcaStatus);
  const computedHash = sha256(snapshotStr);
  if (computedHash !== checkpoint.pdcaStatusHash) {
    return {
      restored: false,
      details: `Integrity check failed for ${checkpointId}: hash mismatch (expected ${checkpoint.pdcaStatusHash}, got ${computedHash})`
    };
  }

  // Restore pdca-status
  writePdcaStatus(checkpoint.pdcaStatus);

  return {
    restored: true,
    details: `Restored pdca-status from checkpoint ${checkpointId} (${checkpoint.type}, ${checkpoint.phase} phase, created ${checkpoint.createdAt})`
  };
}

/**
 * Prune old checkpoints based on limits
 * @param {Object} [options] - Pruning options
 * @param {number} [options.maxAutoCount=50] - Max auto checkpoints to keep
 * @param {number} [options.maxManualCount=20] - Max manual checkpoints to keep
 * @param {number} [options.maxSizeBytes=104857600] - Max total size in bytes (100 MB)
 * @returns {{removed: number}}
 */
function pruneCheckpoints(options = {}) {
  const {
    maxAutoCount = 50,
    maxManualCount = 20,
    maxSizeBytes = 100 * 1024 * 1024
  } = options;

  const dir = ensureDir();
  let index = loadIndex();
  let removed = 0;

  // Separate by type
  const autoEntries = index.filter(e => e.type === 'auto');
  const manualEntries = index.filter(e => e.type === 'manual');
  const otherEntries = index.filter(e => e.type !== 'auto' && e.type !== 'manual');

  // Remove oldest auto checkpoints beyond limit
  const autoToRemove = autoEntries.slice(0, Math.max(0, autoEntries.length - maxAutoCount));
  for (const entry of autoToRemove) {
    const cpPath = path.join(dir, `${entry.id}.json`);
    if (fs.existsSync(cpPath)) {
      fs.unlinkSync(cpPath);
    }
    removed++;
  }

  // Remove oldest manual checkpoints beyond limit
  const manualToRemove = manualEntries.slice(0, Math.max(0, manualEntries.length - maxManualCount));
  for (const entry of manualToRemove) {
    const cpPath = path.join(dir, `${entry.id}.json`);
    if (fs.existsSync(cpPath)) {
      fs.unlinkSync(cpPath);
    }
    removed++;
  }

  // Rebuild index without removed entries
  const removedIds = new Set([...autoToRemove, ...manualToRemove].map(e => e.id));
  index = index.filter(e => !removedIds.has(e.id));

  // Size-based pruning: remove oldest until under budget
  let totalSize = 0;
  for (const entry of index) {
    const cpPath = path.join(dir, `${entry.id}.json`);
    if (fs.existsSync(cpPath)) {
      totalSize += fs.statSync(cpPath).size;
    }
  }

  while (totalSize > maxSizeBytes && index.length > 0) {
    const oldest = index.shift();
    const cpPath = path.join(dir, `${oldest.id}.json`);
    if (fs.existsSync(cpPath)) {
      totalSize -= fs.statSync(cpPath).size;
      fs.unlinkSync(cpPath);
    }
    removed++;
  }

  saveIndex(index);
  return { removed };
}

/**
 * Delete a specific checkpoint by ID
 * @param {string} checkpointId - Checkpoint ID to delete
 * @returns {boolean} True if deleted
 */
function deleteCheckpoint(checkpointId) {
  const dir = ensureDir(); // v2.1.0: fixed from undefined getCheckpointDir()
  const cpPath = path.join(dir, `${checkpointId}.json`);

  if (!fs.existsSync(cpPath)) return false;

  fs.unlinkSync(cpPath);

  // Remove from index
  const index = loadIndex().filter(e => e.id !== checkpointId);
  saveIndex(index);
  return true;
}

/**
 * Verify checkpoint data integrity using SHA-256
 * @param {string} checkpointId - Checkpoint ID to verify
 * @returns {{ valid: boolean, expected?: string, actual?: string }}
 */
function verifyCheckpoint(checkpointId) {
  const cp = getCheckpoint(checkpointId);
  if (!cp) return { valid: false };

  // Check both 'hash' and 'pdcaStatusHash' fields for backwards compatibility
  const storedHash = cp.hash || cp.pdcaStatusHash;
  if (!storedHash) return { valid: true }; // No hash stored, assume valid

  // Recompute hash from data (excluding hash fields)
  const data = { ...cp };
  delete data.hash;
  delete data.pdcaStatusHash;
  const actual = sha256(JSON.stringify(data));

  return {
    valid: actual === storedHash,
    expected: storedHash,
    actual,
  };
}

module.exports = {
  createCheckpoint,
  listCheckpoints,
  getCheckpoint,
  rollbackToCheckpoint,
  pruneCheckpoints,
  deleteCheckpoint,
  verifyCheckpoint,
  sha256
};
