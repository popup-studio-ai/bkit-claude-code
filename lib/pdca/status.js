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
 * Delete feature completely from PDCA status
 * @param {string} feature - Feature name to delete
 * @returns {{ success: boolean, reason?: string, deletedFeature?: string }}
 */
function deleteFeatureFromStatus(feature) {
  const { debugLog } = getCore();
  const status = getPdcaStatusFull(true);

  // Validation 1: Status 존재 확인
  if (!status) {
    return { success: false, reason: 'Status not found' };
  }

  // Validation 2: Feature 존재 확인
  if (!status.features[feature]) {
    return { success: false, reason: 'Feature not found' };
  }

  // Validation 3: 활성 feature 삭제 방지 (archived/completed가 아닌 경우)
  const featureStatus = status.features[feature];
  if (status.activeFeatures.includes(feature) &&
      featureStatus.phase !== 'archived' &&
      featureStatus.phase !== 'completed') {
    return { success: false, reason: 'Cannot delete active feature' };
  }

  // Step 1: features 객체에서 삭제
  delete status.features[feature];

  // Step 2: activeFeatures 배열에서 제거
  status.activeFeatures = status.activeFeatures.filter(f => f !== feature);

  // Step 3: primaryFeature 업데이트
  if (status.primaryFeature === feature) {
    status.primaryFeature = status.activeFeatures[0] || null;
  }

  // Step 4: History 기록
  status.history.push({
    timestamp: new Date().toISOString(),
    action: 'feature_deleted',
    feature: feature
  });

  // Step 5: History 제한 적용 (100개)
  if (status.history.length > 100) {
    status.history = status.history.slice(-100);
  }

  // Step 6: 저장
  savePdcaStatus(status);
  debugLog('PDCA', `Feature deleted: ${feature}`);

  return { success: true, deletedFeature: feature };
}

/**
 * Enforce maximum feature count, delete oldest archived features
 * @param {number} maxFeatures - Maximum features to keep (default: 50)
 * @returns {{ success: boolean, deletedCount: number, deleted: string[], remaining: number }}
 */
function enforceFeatureLimit(maxFeatures = 50) {
  const { debugLog } = getCore();
  const status = getPdcaStatusFull(true);

  if (!status) {
    return { success: false, deletedCount: 0, deleted: [], remaining: 0 };
  }

  const featureNames = Object.keys(status.features);
  const featureCount = featureNames.length;

  // 제한 이내면 아무것도 하지 않음
  if (featureCount <= maxFeatures) {
    return { success: true, deletedCount: 0, deleted: [], remaining: featureCount };
  }

  // Archived/completed features만 필터링하고 날짜순 정렬 (오래된 순)
  const archived = Object.entries(status.features)
    .filter(([_, f]) => f.phase === 'archived' || f.phase === 'completed')
    .sort((a, b) => {
      const dateA = new Date(a[1].timestamps?.archivedAt || a[1].timestamps?.lastUpdated || 0);
      const dateB = new Date(b[1].timestamps?.archivedAt || b[1].timestamps?.lastUpdated || 0);
      return dateA - dateB;  // 오래된 것이 앞으로
    });

  // 삭제할 개수 계산
  const toDeleteCount = featureCount - maxFeatures;
  const deleted = [];

  // 오래된 archived부터 삭제
  for (let i = 0; i < Math.min(toDeleteCount, archived.length); i++) {
    const featureName = archived[i][0];
    delete status.features[featureName];

    // activeFeatures에서도 제거 (혹시 남아있다면)
    status.activeFeatures = status.activeFeatures.filter(f => f !== featureName);

    deleted.push(featureName);
  }

  // 삭제 결과 없으면 (archived feature가 부족)
  if (deleted.length === 0) {
    debugLog('PDCA', 'Feature limit exceeded but no archived features to delete');
    return {
      success: true,
      deletedCount: 0,
      deleted: [],
      remaining: Object.keys(status.features).length
    };
  }

  // History 기록
  status.history.push({
    timestamp: new Date().toISOString(),
    action: 'auto_cleanup',
    deletedCount: deleted.length,
    deleted: deleted
  });

  // History 제한 적용
  if (status.history.length > 100) {
    status.history = status.history.slice(-100);
  }

  // primaryFeature 업데이트
  if (deleted.includes(status.primaryFeature)) {
    status.primaryFeature = status.activeFeatures[0] || null;
  }

  savePdcaStatus(status);
  debugLog('PDCA', `Auto cleanup: deleted ${deleted.length} features`, { deleted });

  return {
    success: true,
    deletedCount: deleted.length,
    deleted,
    remaining: Object.keys(status.features).length
  };
}

/**
 * Get list of archived or completed features
 * @returns {string[]} Feature names
 */
function getArchivedFeatures() {
  const status = getPdcaStatusFull();
  if (!status) return [];

  return Object.entries(status.features)
    .filter(([_, f]) => f.phase === 'archived' || f.phase === 'completed')
    .map(([name, _]) => name);
}

/**
 * Cleanup specific archived features or all archived
 * @param {string[]|null} features - Feature names to delete (optional, all if not specified)
 * @returns {{ success: boolean, deletedCount: number, deleted: string[], remaining: number }}
 */
function cleanupArchivedFeatures(features = null) {
  const { debugLog } = getCore();
  const status = getPdcaStatusFull(true);

  if (!status) {
    return { success: false, deletedCount: 0, deleted: [], remaining: 0 };
  }

  // 삭제 대상 결정
  const targets = features || getArchivedFeatures();
  const deleted = [];

  for (const feature of targets) {
    const featureStatus = status.features[feature];

    // Archived/Completed가 아니면 스킵
    if (!featureStatus ||
        (featureStatus.phase !== 'archived' && featureStatus.phase !== 'completed')) {
      continue;
    }

    delete status.features[feature];
    status.activeFeatures = status.activeFeatures.filter(f => f !== feature);
    deleted.push(feature);
  }

  if (deleted.length === 0) {
    return {
      success: true,
      deletedCount: 0,
      deleted: [],
      remaining: Object.keys(status.features).length
    };
  }

  // History 기록
  status.history.push({
    timestamp: new Date().toISOString(),
    action: 'feature_deleted',
    deletedCount: deleted.length,
    deleted: deleted
  });

  // History 제한
  if (status.history.length > 100) {
    status.history = status.history.slice(-100);
  }

  // primaryFeature 업데이트
  if (deleted.includes(status.primaryFeature)) {
    status.primaryFeature = status.activeFeatures[0] || null;
  }

  savePdcaStatus(status);
  debugLog('PDCA', `Manual cleanup: deleted ${deleted.length} features`);

  return {
    success: true,
    deletedCount: deleted.length,
    deleted,
    remaining: Object.keys(status.features).length
  };
}

/**
 * FR-04: Archive feature to summary (preserve minimal info)
 * Converts a full feature status to a lightweight summary for statistics
 * @param {string} feature - Feature name to convert
 * @returns {{ success: boolean, reason?: string, summarizedFeature?: string }}
 */
function archiveFeatureToSummary(feature) {
  const { debugLog } = getCore();
  const status = getPdcaStatusFull(true);

  // Validation 1: Status 존재 확인
  if (!status) {
    return { success: false, reason: 'Status not found' };
  }

  // Validation 2: Feature 존재 확인
  if (!status.features[feature]) {
    return { success: false, reason: 'Feature not found' };
  }

  const full = status.features[feature];

  // Validation 3: archived 또는 completed 상태만 변환 가능
  if (full.phase !== 'archived' && full.phase !== 'completed') {
    return { success: false, reason: 'Feature must be archived or completed' };
  }

  // 요약 정보로 변환 (70% 크기 감소)
  status.features[feature] = {
    phase: 'archived',
    matchRate: full.matchRate,
    iterationCount: full.iterationCount || 0,
    startedAt: full.timestamps?.started || null,
    archivedAt: full.timestamps?.archivedAt || new Date().toISOString(),
    archivedTo: full.archivedTo || null
  };

  // activeFeatures에서 제거 (혹시 남아있다면)
  status.activeFeatures = status.activeFeatures.filter(f => f !== feature);

  // primaryFeature 업데이트
  if (status.primaryFeature === feature) {
    status.primaryFeature = status.activeFeatures[0] || null;
  }

  // History 기록
  status.history.push({
    timestamp: new Date().toISOString(),
    action: 'feature_summarized',
    feature: feature
  });

  // History 제한 적용 (100개)
  if (status.history.length > 100) {
    status.history = status.history.slice(-100);
  }

  savePdcaStatus(status);
  debugLog('PDCA', `Feature summarized: ${feature}`);

  return { success: true, summarizedFeature: feature };
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
  // v1.4.8: Features cleanup functions
  deleteFeatureFromStatus,
  enforceFeatureLimit,
  getArchivedFeatures,
  cleanupArchivedFeatures,
  archiveFeatureToSummary,  // FR-04: Summary preservation
  // Existing exports
  getActiveFeatures,
  switchFeatureContext,
  extractFeatureFromContext,
};
