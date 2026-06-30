/**
 * Session Recovery (Resume) Module
 * @module lib/pdca/resume
 * @version 2.1.10
 *
 * Handles session recovery after StopFailure, context overflow,
 * or other interruptions. Saves and restores PDCA state for
 * seamless continuation.
 *
 * Schema: .bkit/state/resume/{feature}.resume.json
 */

const fs = require('fs');
const path = require('path');

// Lazy requires
let _core = null;
function getCore() {
  if (!_core) { _core = require('../core'); }
  return _core;
}

/** @type {number} Default resume data expiry in ms (7 days) */
const RESUME_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Get the resume directory path
 * @returns {string} Absolute path to .bkit/state/resume/
 */
function getResumeDir() {
  const { STATE_PATHS } = require('../core/paths');
  return path.join(STATE_PATHS.state(), 'resume');
}

/**
 * Get the resume file path for a feature
 * @param {string} feature - Feature name
 * @returns {string} Absolute path to {feature}.resume.json
 */
function getResumePath(feature) {
  // M8 fix (audit): validate before path construction so a traversal-laden feature
  // can never escape getResumeDir(). Single chokepoint covers every resume caller.
  getCore().validateFeatureName(feature);
  return path.join(getResumeDir(), `${feature}.resume.json`);
}

/**
 * Ensure the resume directory exists
 * @returns {void}
 */
function ensureResumeDir() {
  const dir = getResumeDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Create and save a resume point for a feature
 * @param {string} feature - Feature name
 * @param {Object} context - Context to save
 * @param {string} context.phase - Current PDCA phase
 * @param {string} [context.reason] - Interruption reason ('StopFailure'|'ContextOverflow'|'UserAbort'|'Error')
 * @param {Object} [context.pendingTasks] - Tasks that were not completed
 * @param {Object} [context.partialResults] - Partial results available
 * @param {string} [context.contextSummary] - Summary of conversation context
 * @param {number} [context.matchRate] - Current match rate
 * @param {number} [context.iterationCount] - Current iteration count
 * @param {string[]} [context.modifiedFiles] - Files modified before interruption
 * @returns {{ resumeId: string, path: string }}
 */
function createResumePoint(feature, context = {}) {
  const { debugLog, stateStore } = getCore();
  ensureResumeDir();

  const now = new Date();
  const resumeId = `${feature}-${now.getTime()}`;

  const resumeData = {
    resumeId,
    feature,
    phase: context.phase || 'unknown',
    reason: context.reason || 'Unknown',
    savedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + RESUME_EXPIRY_MS).toISOString(),
    isValid: true,
    context: {
      matchRate: context.matchRate || 0,
      iterationCount: context.iterationCount || 0,
      pendingTasks: context.pendingTasks || [],
      partialResults: context.partialResults || {},
      contextSummary: context.contextSummary || '',
    },
    snapshot: {
      modifiedFiles: context.modifiedFiles || [],
      gitRef: _getGitRef(),
    },
  };

  const resumePath = getResumePath(feature);
  // H1 fix (audit): atomic write of the resume point (gates session recovery).
  stateStore.write(resumePath, resumeData);
  debugLog('PDCA', `Resume point created for ${feature}`, { resumeId, reason: resumeData.reason });

  return { resumeId, path: resumePath };
}

/**
 * Load a resume point for a feature
 * @param {string} feature - Feature name
 * @returns {Object|null} Resume data or null if not found/expired
 */
function loadResumePoint(feature) {
  const resumePath = getResumePath(feature);

  if (!fs.existsSync(resumePath)) return null;

  try {
    const data = JSON.parse(fs.readFileSync(resumePath, 'utf8'));

    // Check expiry
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
      data.isValid = false;
    }

    return data;
  } catch (e) {
    return null;
  }
}

/**
 * Validate resume data for recoverability
 * @param {Object} data - Resume data object
 * @returns {{ valid: boolean, reason: string }}
 */
function validateResumeData(data) {
  if (!data) return { valid: false, reason: 'No resume data' };
  if (!data.isValid) return { valid: false, reason: 'Resume data marked invalid' };
  if (!data.feature) return { valid: false, reason: 'Missing feature name' };
  if (!data.phase) return { valid: false, reason: 'Missing phase' };

  if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
    return { valid: false, reason: `Resume data expired at ${data.expiresAt}` };
  }

  return { valid: true, reason: 'Resume data is valid' };
}

/**
 * Resume a session for a feature, restoring saved state
 * @param {string} feature - Feature name
 * @returns {{ phase: string, context: Object, pendingTasks: Array }|null} Restored state or null
 */
function resumeSession(feature) {
  const { debugLog } = getCore();
  const data = loadResumePoint(feature);

  const validation = validateResumeData(data);
  if (!validation.valid) {
    debugLog('PDCA', `Resume failed for ${feature}: ${validation.reason}`);
    return null;
  }

  debugLog('PDCA', `Resuming session for ${feature}`, {
    phase: data.phase,
    reason: data.reason,
    savedAt: data.savedAt,
  });

  return {
    phase: data.phase,
    context: data.context || {},
    pendingTasks: data.context?.pendingTasks || [],
  };
}

/**
 * Clear (delete) a resume point for a feature
 * @param {string} feature - Feature name
 * @returns {void}
 */
function clearResumePoint(feature) {
  const { debugLog } = getCore();
  const resumePath = getResumePath(feature);

  try {
    if (fs.existsSync(resumePath)) {
      fs.unlinkSync(resumePath);
      debugLog('PDCA', `Resume point cleared for ${feature}`);
    }
  } catch (e) {
    debugLog('PDCA', `Failed to clear resume point for ${feature}`, { error: e.message });
  }
}

/**
 * List all existing resume points
 * @returns {Array<{ feature: string, phase: string, createdAt: string, reason: string, isValid: boolean }>}
 */
function listResumePoints() {
  const dir = getResumeDir();
  if (!fs.existsSync(dir)) return [];

  const results = [];

  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.resume.json'));

    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
        const isExpired = data.expiresAt && new Date(data.expiresAt) < new Date();
        results.push({
          feature: data.feature,
          phase: data.phase,
          createdAt: data.savedAt,
          reason: data.reason,
          isValid: data.isValid && !isExpired,
        });
      } catch (e) {
        // Skip corrupted files
      }
    }
  } catch (e) {
    // Directory read failed
  }

  return results;
}

/**
 * Clean up expired resume data files
 * @returns {string[]} List of cleaned up feature names
 */
function cleanupExpired() {
  const { debugLog } = getCore();
  const dir = getResumeDir();
  if (!fs.existsSync(dir)) return [];

  const cleaned = [];
  const now = new Date();

  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.resume.json'));

    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (data.expiresAt && new Date(data.expiresAt) < now) {
          fs.unlinkSync(filePath);
          cleaned.push(data.feature || file);
        }
      } catch (e) {
        // Remove corrupted files
        try { fs.unlinkSync(filePath); } catch (_) { /* ignore */ }
        cleaned.push(file);
      }
    }
  } catch (e) {
    debugLog('PDCA', 'Failed to cleanup expired resume data', { error: e.message });
  }

  if (cleaned.length > 0) {
    debugLog('PDCA', `Cleaned up ${cleaned.length} expired resume points`, { cleaned });
  }

  return cleaned;
}

/**
 * Get current git HEAD ref (best effort)
 * @returns {string} Git ref or 'unknown'
 * @private
 */
function _getGitRef() {
  try {
    const { PROJECT_DIR } = getCore();
    const headPath = path.join(PROJECT_DIR, '.git', 'HEAD');
    if (fs.existsSync(headPath)) {
      const content = fs.readFileSync(headPath, 'utf8').trim();
      if (content.startsWith('ref: ')) {
        const refPath = path.join(PROJECT_DIR, '.git', content.slice(5));
        if (fs.existsSync(refPath)) {
          return fs.readFileSync(refPath, 'utf8').trim().slice(0, 8);
        }
      }
      return content.slice(0, 8);
    }
  } catch (e) {
    // Non-critical
  }
  return 'unknown';
}

module.exports = {
  createResumePoint,
  loadResumePoint,
  validateResumeData,
  resumeSession,
  clearResumePoint,
  listResumePoints,
  cleanupExpired,
};
