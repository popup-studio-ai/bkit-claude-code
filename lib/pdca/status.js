/**
 * PDCA Status Management Module
 * @module lib/pdca/status
 * @version 1.4.7
 */

const fs = require('fs');
const path = require('path');

// Lazy require
let _core = null;
function getCore() {
  if (!_core) {
    _core = require('../core');
  }
  return _core;
}

let _phase = null;
function getPhase() {
  if (!_phase) {
    _phase = require('./phase');
  }
  return _phase;
}

/**
 * Get PDCA status file path
 * @returns {string}
 */
function getPdcaStatusPath() {
  const { PROJECT_DIR } = getCore();
  return path.join(PROJECT_DIR, 'docs/.pdca-status.json');
}

/**
 * v2.0 Schema: Default initial status
 * @returns {Object}
 */
function createInitialStatusV2() {
  const now = new Date().toISOString();
  return {
    version: "2.0",
    lastUpdated: now,
    activeFeatures: [],
    primaryFeature: null,
    features: {},
    pipeline: {
      currentPhase: 1,
      level: 'Dynamic',
      phaseHistory: []
    },
    session: {
      startedAt: now,
      onboardingCompleted: false,
      lastActivity: now
    },
    history: []
  };
}

/**
 * Migrate v1.0 schema to v2.0
 * @param {Object} oldStatus - v1.0 status object
 * @returns {Object} v2.0 status object
 */
function migrateStatusToV2(oldStatus) {
  const { debugLog } = getCore();
  const now = new Date().toISOString();
  const newStatus = createInitialStatusV2();

  if (oldStatus.features) {
    newStatus.features = oldStatus.features;
    for (const [name, feat] of Object.entries(newStatus.features)) {
      if (!feat.requirements) feat.requirements = [];
      if (!feat.documents) feat.documents = {};
      if (!feat.timestamps) {
        feat.timestamps = {
          started: feat.startedAt || now,
          lastUpdated: feat.updatedAt || now
        };
      }
    }
    newStatus.activeFeatures = Object.keys(newStatus.features).filter(
      f => newStatus.features[f].phase !== 'completed'
    );
  }

  if (oldStatus.currentFeature) {
    newStatus.primaryFeature = oldStatus.currentFeature;
    if (!newStatus.activeFeatures.includes(oldStatus.currentFeature)) {
      newStatus.activeFeatures.push(oldStatus.currentFeature);
    }
  }

  if (oldStatus.currentPhase) {
    newStatus.pipeline.currentPhase = oldStatus.currentPhase;
  }

  if (oldStatus.history) {
    newStatus.history = oldStatus.history;
  }

  newStatus.lastUpdated = now;
  newStatus.session.lastActivity = now;

  debugLog('PDCA', 'Migrated status from v1.0 to v2.0');
  return newStatus;
}

/**
 * Initialize PDCA status file if not exists
 */
function initPdcaStatusIfNotExists() {
  const { globalCache, debugLog } = getCore();
  const statusPath = getPdcaStatusPath();

  if (fs.existsSync(statusPath)) return;

  const docsDir = path.dirname(statusPath);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const initialStatus = createInitialStatusV2();
  fs.writeFileSync(statusPath, JSON.stringify(initialStatus, null, 2));
  globalCache.set('pdca-status', initialStatus);
  debugLog('PDCA', 'Status file initialized (v2.0)', { path: statusPath });
}

/**
 * Get current PDCA status with caching and auto-migration
 * @param {boolean} forceRefresh - Skip cache and read from file
 * @returns {Object|null}
 */
function getPdcaStatusFull(forceRefresh = false) {
  const { globalCache, debugLog } = getCore();
  const statusPath = getPdcaStatusPath();

  try {
    if (!forceRefresh) {
      const cached = globalCache.get('pdca-status', 3000);
      if (cached) return cached;
    }

    if (!fs.existsSync(statusPath)) return null;

    let status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));

    if (!status.version || status.version === "1.0") {
      status = migrateStatusToV2(status);
      savePdcaStatus(status);
    }

    globalCache.set('pdca-status', status);
    return status;
  } catch (e) {
    debugLog('PDCA', 'Failed to read status', { error: e.message });
    return null;
  }
}

/**
 * Alias for getPdcaStatusFull
 * @returns {Object|null}
 */
function loadPdcaStatus() {
  return getPdcaStatusFull();
}

/**
 * Save PDCA status to file and update cache
 * @param {Object} status
 */
function savePdcaStatus(status) {
  const { globalCache, debugLog } = getCore();
  const statusPath = getPdcaStatusPath();

  try {
    status.lastUpdated = new Date().toISOString();
    if (status.session) {
      status.session.lastActivity = status.lastUpdated;
    }

    const docsDir = path.dirname(statusPath);
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
    globalCache.set('pdca-status', status);
    debugLog('PDCA', 'Status saved', { version: status.version });
  } catch (e) {
    debugLog('PDCA', 'Failed to save status', { error: e.message });
  }
}

/**
 * Get feature status
 * @param {string} feature
 * @returns {Object|null}
 */
function getFeatureStatus(feature) {
  const status = getPdcaStatusFull();
  return status?.features?.[feature] || null;
}

/**
 * Update PDCA status for feature
 * @param {string} feature
 * @param {string} phase
 * @param {Object} data
 */
function updatePdcaStatus(feature, phase, data = {}) {
  const { debugLog } = getCore();
  const { getPhaseNumber } = getPhase();

  let status = getPdcaStatusFull(true) || createInitialStatusV2();

  if (!status.features[feature]) {
    status.features[feature] = {
      phase: phase,
      phaseNumber: getPhaseNumber(phase),
      matchRate: null,
      iterationCount: 0,
      requirements: [],
      documents: {},
      timestamps: { started: new Date().toISOString() }
    };
  }

  Object.assign(status.features[feature], {
    phase,
    phaseNumber: getPhaseNumber(phase),
    ...data,
    timestamps: {
      ...status.features[feature].timestamps,
      lastUpdated: new Date().toISOString()
    }
  });

  // Add to active features if not already
  if (!status.activeFeatures.includes(feature)) {
    status.activeFeatures.push(feature);
  }

  // Update primary feature if not set
  if (!status.primaryFeature) {
    status.primaryFeature = feature;
  }

  status.history.push({
    timestamp: new Date().toISOString(),
    feature,
    phase,
    action: 'updated'
  });

  savePdcaStatus(status);
  debugLog('PDCA', `Updated ${feature} to ${phase}`, data);
}

/**
 * Add history entry
 * @param {Object} entry
 */
function addPdcaHistory(entry) {
  const status = getPdcaStatusFull(true);
  if (!status) return;

  status.history.push({
    timestamp: new Date().toISOString(),
    ...entry
  });

  // Keep last 100 entries
  if (status.history.length > 100) {
    status.history = status.history.slice(-100);
  }

  savePdcaStatus(status);
}

/**
 * Mark feature as completed
 * @param {string} feature
 */
function completePdcaFeature(feature) {
  updatePdcaStatus(feature, 'completed', {
    timestamps: {
      completed: new Date().toISOString()
    }
  });
}

/**
 * Set primary active feature
 * @param {string} feature
 */
function setActiveFeature(feature) {
  const { debugLog } = getCore();
  const status = getPdcaStatusFull(true);
  if (!status) return;

  status.primaryFeature = feature;

  if (!status.activeFeatures.includes(feature)) {
    status.activeFeatures.push(feature);
  }

  savePdcaStatus(status);
  debugLog('PDCA', 'Set active feature', { feature });
}

/**
 * Add feature to active list
 * @param {string} feature
 * @param {boolean} setAsPrimary
 */
function addActiveFeature(feature, setAsPrimary = false) {
  const status = getPdcaStatusFull(true);
  if (!status) return;

  if (!status.activeFeatures.includes(feature)) {
    status.activeFeatures.push(feature);
  }

  if (setAsPrimary) {
    status.primaryFeature = feature;
  }

  savePdcaStatus(status);
}

/**
 * Remove feature from active list
 * @param {string} feature
 */
function removeActiveFeature(feature) {
  const status = getPdcaStatusFull(true);
  if (!status) return;

  status.activeFeatures = status.activeFeatures.filter(f => f !== feature);

  if (status.primaryFeature === feature) {
    status.primaryFeature = status.activeFeatures[0] || null;
  }

  savePdcaStatus(status);
}

/**
 * Get active features list
 * @returns {string[]}
 */
function getActiveFeatures() {
  const status = getPdcaStatusFull();
  return status?.activeFeatures || [];
}

/**
 * Switch to a different feature context
 * @param {string} feature
 * @returns {boolean}
 */
function switchFeatureContext(feature) {
  const status = getPdcaStatusFull(true);
  if (!status) return false;

  if (!status.features[feature]) {
    return false;
  }

  status.primaryFeature = feature;

  if (!status.activeFeatures.includes(feature)) {
    status.activeFeatures.push(feature);
  }

  savePdcaStatus(status);
  return true;
}

/**
 * Extract feature from context sources
 * @param {Object} sources
 * @returns {string}
 */
function extractFeatureFromContext(sources = {}) {
  // Check explicit feature
  if (sources.feature) return sources.feature;

  // Check file path
  if (sources.filePath) {
    const { getConfig } = getCore();
    const featurePatterns = getConfig('featurePatterns', [
      'features', 'modules', 'packages', 'domains'
    ]);

    for (const pattern of featurePatterns) {
      const regex = new RegExp(`${pattern}/([^/]+)`);
      const match = sources.filePath.match(regex);
      if (match && match[1]) return match[1];
    }
  }

  // Fall back to primary feature
  const status = getPdcaStatusFull();
  return status?.primaryFeature || '';
}

module.exports = {
  getPdcaStatusPath,
  createInitialStatusV2,
  migrateStatusToV2,
  initPdcaStatusIfNotExists,
  getPdcaStatusFull,
  loadPdcaStatus,
  savePdcaStatus,
  getFeatureStatus,
  updatePdcaStatus,
  addPdcaHistory,
  completePdcaFeature,
  setActiveFeature,
  addActiveFeature,
  removeActiveFeature,
  getActiveFeatures,
  switchFeatureContext,
  extractFeatureFromContext,
};
