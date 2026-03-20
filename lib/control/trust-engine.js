#!/usr/bin/env node
/**
 * Trust Score Engine (FR-03)
 * Manages Trust Score (0-100) and automation levels (L0-L4) for progressive automation.
 *
 * Trust Profile is stored in `.bkit/state/trust-profile.json`.
 * Score is computed as a weighted average of 6 components.
 *
 * Level thresholds: L0→L1: 20, L1→L2: 40, L2→L3: 65, L3→L4: 85
 * Downgrade: -15 delta triggers downgrade. Cooldown 30 min between upgrades.
 *
 * @version 2.0.0
 * @module lib/control/trust-engine
 */

const fs = require('fs');
const path = require('path');

function getProjectDir() {
  try { return require('../core/platform').PROJECT_DIR; } catch (_) { return process.cwd(); }
}

/**
 * @typedef {Object} TrustComponent
 * @property {number} weight - Component weight (0-1, all weights sum to 1)
 * @property {number} value - Component value (0-100)
 */

/**
 * @typedef {Object} TrustProfile
 * @property {number} trustScore - Overall trust score (0-100)
 * @property {number} currentLevel - Current automation level (0-4)
 * @property {Object<string, TrustComponent>} components - Score components
 * @property {Object} stats - Aggregate statistics
 * @property {Array<{timestamp: string, from: number, to: number, trigger: string, reason: string}>} levelHistory
 * @property {string|null} lastUpgradeAt - ISO timestamp of last level upgrade
 */

const TRUST_PROFILE_PATH = '.bkit/state/trust-profile.json';

/** Level upgrade thresholds */
const LEVEL_THRESHOLDS = [0, 20, 40, 65, 85];

/** Cooldown between upgrades in milliseconds (30 min) */
const UPGRADE_COOLDOWN_MS = 30 * 60 * 1000;

/** Delta threshold for downgrade */
const DOWNGRADE_DELTA = -15;

/**
 * Score change rules by event type
 * @type {Object<string, number>}
 */
const SCORE_CHANGES = {
  'consecutive_10_success': +5,
  'match_rate_95': +3,
  '7_day_no_incident': +5,
  'emergency_stop': -15,
  'rollback': -10,
  'guardrail_trigger': -10,
  'user_interrupt': -5
};

/**
 * Create a default trust profile
 * @returns {TrustProfile}
 */
function createDefaultProfile() {
  const profile = {
    trustScore: 0, // placeholder, synced with components below
    currentLevel: 0,
    components: {
      pdcaCompletionRate: { weight: 0.25, value: 0 },
      gatePassRate: { weight: 0.20, value: 0 },
      rollbackFrequency: { weight: 0.15, value: 100 }, // 100 = no rollbacks (good)
      destructiveBlockRate: { weight: 0.15, value: 100 }, // 100 = all blocked (good)
      iterationEfficiency: { weight: 0.15, value: 0 },
      userOverrideRate: { weight: 0.10, value: 100 } // 100 = no overrides (good)
    },
    stats: {
      totalPdcaCycles: 0,
      completedPdcaCycles: 0,
      totalGateChecks: 0,
      passedGateChecks: 0,
      totalRollbacks: 0,
      totalDestructiveBlocks: 0,
      consecutiveSuccesses: 0,
      lastIncidentAt: null
    },
    levelHistory: [],
    lastUpgradeAt: null
  };
  // Sync trustScore with component weighted sum (Single Source of Truth)
  profile.trustScore = calculateScore(profile);
  return profile;
}

/**
 * Resolve the trust profile file path
 * @returns {string}
 */
function profilePath() {
  return path.resolve(getProjectDir(), TRUST_PROFILE_PATH);
}

/**
 * Load the trust profile from disk
 * @returns {TrustProfile}
 */
function loadTrustProfile() {
  const filePath = profilePath();
  if (!fs.existsSync(filePath)) {
    return createDefaultProfile();
  }
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    // Merge with defaults to handle missing fields from older versions
    const defaults = createDefaultProfile();
    return {
      ...defaults,
      ...data,
      components: { ...defaults.components, ...data.components },
      stats: { ...defaults.stats, ...data.stats }
    };
  } catch {
    return createDefaultProfile();
  }
}

/**
 * Save the trust profile to disk
 * @param {TrustProfile} profile - Profile to save
 */
function saveTrustProfile(profile) {
  const filePath = profilePath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(profile, null, 2), 'utf-8');
}

/**
 * Calculate the trust score from component values
 * @param {TrustProfile} profile - Trust profile
 * @returns {number} Calculated score (0-100)
 */
function calculateScore(profile) {
  let score = 0;
  for (const component of Object.values(profile.components)) {
    score += component.weight * component.value;
  }
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Determine the appropriate level for a given score
 * @param {number} score - Trust score (0-100)
 * @returns {number} Level (0-4)
 */
function scoreToLevel(score) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (score >= LEVEL_THRESHOLDS[i]) return i;
  }
  return 0;
}

/**
 * Record an event and update trust score accordingly
 * @param {string} eventType - Event type (e.g., 'consecutive_10_success', 'rollback')
 * @param {Object} [details={}] - Additional event details
 * @returns {{scoreChange: number, newScore: number, levelChange: {from: number, to: number}|null}}
 */
function recordEvent(eventType, details = {}) {
  const profile = loadTrustProfile();
  const previousScore = profile.trustScore;
  const previousLevel = profile.currentLevel;

  // Apply score change
  const scoreChange = SCORE_CHANGES[eventType] || 0;

  // Update stats based on event type
  switch (eventType) {
    case 'consecutive_10_success':
      profile.stats.consecutiveSuccesses += 10;
      break;
    case 'rollback':
      profile.stats.totalRollbacks++;
      profile.stats.consecutiveSuccesses = 0;
      profile.stats.lastIncidentAt = new Date().toISOString();
      break;
    case 'guardrail_trigger':
      profile.stats.totalDestructiveBlocks++;
      profile.stats.consecutiveSuccesses = 0;
      profile.stats.lastIncidentAt = new Date().toISOString();
      break;
    case 'emergency_stop':
      profile.stats.consecutiveSuccesses = 0;
      profile.stats.lastIncidentAt = new Date().toISOString();
      break;
    case 'user_interrupt':
      profile.stats.consecutiveSuccesses = 0;
      break;
    case 'pdca_complete':
      profile.stats.totalPdcaCycles++;
      profile.stats.completedPdcaCycles++;
      break;
    case 'gate_pass':
      profile.stats.totalGateChecks++;
      profile.stats.passedGateChecks++;
      break;
    case 'gate_fail':
      profile.stats.totalGateChecks++;
      break;
  }

  // Update component values from stats
  updateComponentValues(profile);

  // Recalculate score
  const calculatedScore = calculateScore(profile);
  profile.trustScore = Math.max(0, Math.min(100, calculatedScore + scoreChange));

  // Check for level changes
  let levelChange = null;

  const upgrade = shouldEscalate(profile);
  const downgrade = shouldDowngrade(profile, previousScore);

  if (downgrade.downgrade) {
    levelChange = { from: previousLevel, to: downgrade.toLevel };
    profile.currentLevel = downgrade.toLevel;
    profile.levelHistory.push({
      timestamp: new Date().toISOString(),
      from: previousLevel,
      to: downgrade.toLevel,
      trigger: eventType,
      reason: `Score dropped by ${previousScore - profile.trustScore} (threshold: ${Math.abs(DOWNGRADE_DELTA)})`
    });
  } else if (upgrade.escalate) {
    levelChange = { from: previousLevel, to: upgrade.toLevel };
    profile.currentLevel = upgrade.toLevel;
    profile.lastUpgradeAt = new Date().toISOString();
    profile.levelHistory.push({
      timestamp: new Date().toISOString(),
      from: previousLevel,
      to: upgrade.toLevel,
      trigger: eventType,
      reason: `Trust score reached ${profile.trustScore} (threshold: ${LEVEL_THRESHOLDS[upgrade.toLevel]})`
    });
  }

  saveTrustProfile(profile);

  return {
    scoreChange,
    newScore: profile.trustScore,
    levelChange
  };
}

/**
 * Update component values derived from accumulated stats
 * @param {TrustProfile} profile - Profile to update in-place
 */
function updateComponentValues(profile) {
  const { stats, components } = profile;

  if (stats.totalPdcaCycles > 0) {
    components.pdcaCompletionRate.value = Math.round(
      (stats.completedPdcaCycles / stats.totalPdcaCycles) * 100
    );
  }

  if (stats.totalGateChecks > 0) {
    components.gatePassRate.value = Math.round(
      (stats.passedGateChecks / stats.totalGateChecks) * 100
    );
  }

  // rollbackFrequency: fewer rollbacks = higher score
  if (stats.totalPdcaCycles > 0) {
    const rollbackRate = stats.totalRollbacks / stats.totalPdcaCycles;
    components.rollbackFrequency.value = Math.round(Math.max(0, 100 - rollbackRate * 100));
  }

  // iterationEfficiency: based on consecutive successes (max 100 at 50+)
  components.iterationEfficiency.value = Math.min(100, Math.round(
    (stats.consecutiveSuccesses / 50) * 100
  ));

  // userOverrideRate: inverse of how often user overrides (higher = better)
  // This stays at default 100 until we track user overrides
}

/**
 * Check if the profile qualifies for a level upgrade
 * @param {TrustProfile} profile - Trust profile
 * @returns {{escalate: boolean, toLevel: number}}
 */
function shouldEscalate(profile) {
  const targetLevel = scoreToLevel(profile.trustScore);

  if (targetLevel <= profile.currentLevel) {
    return { escalate: false, toLevel: profile.currentLevel };
  }

  // Check cooldown
  if (profile.lastUpgradeAt) {
    const elapsed = Date.now() - new Date(profile.lastUpgradeAt).getTime();
    if (elapsed < UPGRADE_COOLDOWN_MS) {
      return { escalate: false, toLevel: profile.currentLevel };
    }
  }

  return { escalate: true, toLevel: targetLevel };
}

/**
 * Check if the profile should be downgraded
 * @param {TrustProfile} profile - Trust profile
 * @param {number} [previousScore] - Previous score for delta calculation
 * @returns {{downgrade: boolean, toLevel: number}}
 */
function shouldDowngrade(profile, previousScore) {
  if (previousScore === undefined) {
    previousScore = profile.trustScore;
  }

  const delta = profile.trustScore - previousScore;
  if (delta <= DOWNGRADE_DELTA) {
    const newLevel = Math.max(0, profile.currentLevel - 1);
    if (newLevel < profile.currentLevel) {
      return { downgrade: true, toLevel: newLevel };
    }
  }

  // Also downgrade if score drops below current level threshold
  const appropriateLevel = scoreToLevel(profile.trustScore);
  if (appropriateLevel < profile.currentLevel) {
    return { downgrade: true, toLevel: appropriateLevel };
  }

  return { downgrade: false, toLevel: profile.currentLevel };
}

/**
 * Get current trust score (convenience wrapper)
 * @returns {number} Current trust score (0-100)
 */
function getScore() {
  const profile = loadTrustProfile();
  return calculateScore(profile);
}

/**
 * Get full trust profile (convenience wrapper)
 * @returns {TrustProfile} Current trust profile
 */
function getProfile() {
  return loadTrustProfile();
}

/**
 * Record a positive event (convenience wrapper)
 * @param {string} event - Event type
 * @param {Object} [context] - Event context
 */
function recordPositive(event, context = {}) {
  return recordEvent(event, context);
}

/**
 * Record a negative event (convenience wrapper)
 * @param {string} event - Event type
 * @param {Object} [context] - Event context
 */
function recordNegative(event, context = {}) {
  return recordEvent(event, context);
}

/**
 * Evaluate appropriate level for given score
 * @param {number} score - Trust score
 * @param {number} currentLevel - Current automation level
 * @returns {{ recommendedLevel: number, change: string }}
 */
function evaluateLevel(score, currentLevel) {
  let recommended = 0;
  for (const [level, threshold] of Object.entries(LEVEL_THRESHOLDS)) {
    if (score >= threshold) recommended = parseInt(level);
  }
  const change = recommended > currentLevel ? 'escalate' : recommended < currentLevel ? 'downgrade' : 'maintain';
  return { recommendedLevel: recommended, change };
}

/**
 * Reset trust score to a specific value
 * @param {number} [initialScore=50] - Score to reset to
 * @param {string} [reason='manual_reset'] - Reset reason
 */
function resetScore(initialScore = 50, reason = 'manual_reset') {
  const profile = loadTrustProfile();
  profile.trustScore = initialScore;
  profile.events.push({
    type: 'score_reset',
    timestamp: new Date().toISOString(),
    data: { previousScore: profile.trustScore, newScore: initialScore, reason },
  });
  saveTrustProfile(profile);
}

module.exports = {
  loadTrustProfile,
  saveTrustProfile,
  calculateScore,
  recordEvent,
  shouldEscalate,
  shouldDowngrade,
  createDefaultProfile,
  getScore,
  getProfile,
  recordPositive,
  recordNegative,
  evaluateLevel,
  resetScore,
  LEVEL_THRESHOLDS,
  UPGRADE_COOLDOWN_MS,
  SCORE_CHANGES
};
