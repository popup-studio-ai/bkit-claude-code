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
 * @version 2.1.10
 * @module lib/control/trust-engine
 */

const fs = require('fs');
const path = require('path');
// H1/H2 fix (audit): atomic + locked writes via the canonical state-store.
// Safe to import (core/, not automation-controller) — preserves the circular-dep
// avoidance documented in syncToControlState().
const stateStore = require('../core/state-store');

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
  // v2.1.19 S4 F4-1 (ENH-318): 7th component externalDogfoodFeedbackResponseRate
  // added with weight 0.05. Existing 6 components scaled by 0.95 to preserve
  // their relative ratios — see ADR S4-001 + design §0. This keeps Δ ≤5%
  // for the worst-case existing user (master plan R-10 mitigation).
  // Sum: 0.2375 + 0.19 + 0.1425 + 0.1425 + 0.1425 + 0.095 + 0.05 = 1.000 ✓
  const profile = {
    trustScore: 0, // placeholder, synced with components below
    currentLevel: 0,
    components: {
      pdcaCompletionRate: { weight: 0.2375, value: 0 },     // was 0.25 (× 0.95)
      gatePassRate: { weight: 0.19, value: 0 },              // was 0.20 (× 0.95)
      rollbackFrequency: { weight: 0.1425, value: 100 },     // was 0.15 (× 0.95) — 100 = no rollbacks (good)
      destructiveBlockRate: { weight: 0.1425, value: 100 },  // was 0.15 (× 0.95) — 100 = all blocked (good)
      iterationEfficiency: { weight: 0.1425, value: 0 },     // was 0.15 (× 0.95)
      userOverrideRate: { weight: 0.095, value: 100 },       // was 0.10 (× 0.95) — 100 = no overrides (good)
      externalDogfoodFeedbackResponseRate: { weight: 0.05, value: 0 }, // NEW v2.1.19 S4 F4-1 (ENH-318)
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
    // Merge with defaults to handle missing fields from older versions.
    //
    // v2.1.19 S4 F4-1: component WEIGHTS always come from defaults (single
    // source of truth) — this guarantees the 7-component normalization
    // applies even on pre-v2.1.19 trust-profile.json files that still hold
    // the old 6-component weights (0.25/0.20/0.15/0.15/0.15/0.10). Only
    // the `value` field is preserved from disk. New 7th component
    // (externalDogfoodFeedbackResponseRate) defaults to value=0 on file
    // upgrade (will populate on first refresh).
    const defaults = createDefaultProfile();
    const mergedComponents = Object.fromEntries(
      Object.entries(defaults.components).map(([k, defComp]) => [
        k,
        {
          weight: defComp.weight, // always from defaults — S4 F4-1 invariant
          value: data && data.components && data.components[k]
                  && typeof data.components[k].value === 'number'
            ? data.components[k].value
            : defComp.value,
        },
      ])
    );
    return {
      ...defaults,
      ...data,
      components: mergedComponents,
      stats: { ...defaults.stats, ...(data && data.stats || {}) }
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
  stateStore.write(filePath, profile);
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
  const previousScore = profile.trustScore;
  const from = profile.currentLevel;
  const to = scoreToLevel(initialScore);
  profile.trustScore = initialScore;
  profile.currentLevel = to;
  if (!Array.isArray(profile.levelHistory)) profile.levelHistory = [];
  profile.levelHistory.push({
    timestamp: new Date().toISOString(),
    from,
    to,
    trigger: 'reset',
    reason: `${reason} (score ${previousScore} → ${initialScore})`,
  });
  // v2.1.8 fix B4: unified levelHistory schema (was {type,data})
  saveTrustProfile(profile);
}

/**
 * Sync trust score to control-state.json (single direction: trust → control)
 * Called after recordEvent() to keep runtime state in sync.
 *
 * Uses direct file I/O to avoid circular dependency with automation-controller.
 * automation-controller.js imports trust-engine.getScore(), so trust-engine
 * must NOT import automation-controller.
 */
function syncToControlState() {
  try {
    const fs = require('fs');
    const path = require('path');
    const { PROJECT_DIR } = require('../core/platform');
    const { getConfig } = require('../core/config');
    const controlStatePath = path.join(PROJECT_DIR, '.bkit', 'runtime', 'control-state.json');

    if (!fs.existsSync(controlStatePath)) return;

    const profile = loadTrustProfile();

    // H1/H2 fix (audit): locked RMW — the old read→mutate→writeFileSync lost
    // concurrent trust reconciles and a mid-write crash truncated control-state.
    // lockedUpdate holds the lock across read+mutate+write (atomic tmp+rename).
    stateStore.lockedUpdate(controlStatePath, (raw) => {
      const current = raw && typeof raw === 'object' ? raw : {};
      current.trustScore = profile.trustScore;

      // v2.1.10 Sprint 7d (G-C-01/02): auto escalate/downgrade currentLevel
      // Only when automation.autoEscalation / autoDowngrade flags are enabled.
      const autoDowngrade = getConfig('automation.autoDowngrade', true);
      const autoEscalation = getConfig('automation.autoEscalation', false);
      const trustEnabled = getConfig('automation.trustScoreEnabled', true);

      if (trustEnabled && typeof profile.currentLevel === 'number'
          && profile.currentLevel !== current.currentLevel) {
        const increasing = profile.currentLevel > current.currentLevel;
        const allow = (increasing && autoEscalation) || (!increasing && autoDowngrade);

        // v2.1.12 Sprint B-1 (defect #1 fix): refuse to silently downgrade a
        // user-explicit level. user-explicit choices are sticky — only an
        // explicit re-call to setLevel({setBy:'user-explicit-request', ...})
        // (or escalation, never downgrade) may change them. This stops the
        // race-condition where a Trust Score drop overrode a user's L4 choice.
        const isUserExplicit = current.setBy === 'user-explicit-request';
        const protectFromDowngrade = !increasing && isUserExplicit;

        if (allow && !protectFromDowngrade) {
          current.previousLevel = current.currentLevel;
          current.currentLevel = profile.currentLevel;
          // v2.1.12 #11: keep the three SoT fields atomic on auto-transition too
          try {
            const acMod = require('./automation-controller');
            const newName = (acMod.LEVEL_DEFINITIONS[profile.currentLevel]
              && acMod.LEVEL_DEFINITIONS[profile.currentLevel].name) || 'unknown';
            current.level = newName;
            current.levelCode = profile.currentLevel;
          } catch (_) { /* keep file write best-effort */ }
          current.lastAutoTransition = new Date().toISOString();
          current.lastAutoTransitionReason = increasing ? 'trust-escalate' : 'trust-downgrade';
        } else if (protectFromDowngrade) {
          current.lastAutoTransition = new Date().toISOString();
          current.lastAutoTransitionReason = 'trust-downgrade-blocked-user-explicit';
        }
      }

      return current;
    });
  } catch (_) {
    // Non-critical: control-state may not exist yet
  }
}

/**
 * Public reconcile API (FR-γ1) — Design §4.1.
 *
 * Idempotent wrapper over `syncToControlState()` that surfaces the
 * three Trust Score config flags (`automation.trustScoreEnabled`,
 * `automation.autoEscalation`, `automation.autoDowngrade`) as a
 * structured result. Each call is a one-shot atomic write under
 * `.bkit/runtime/control-state.json`.
 *
 * Why a separate name: `syncToControlState()` is a side-effecting
 * helper called from runtime hooks (unified-stop, etc). `reconcile()`
 * is the documented public surface — discoverable, testable, and
 * pinned by an invariant grep (scripts/check-trust-score-reconcile.js).
 *
 * @param {{ trigger?: string }} [opts]
 * @returns {{ ok: boolean, skipped?: boolean, reason?: string,
 *             trigger?: string, flags?: object, controlStatePath?: string }}
 * @since 2.1.11
 */
function reconcile(opts = {}) {
  try {
    const { getConfig } = require('../core/config');
    const trustEnabled = getConfig('automation.trustScoreEnabled', true);
    const autoEscalation = getConfig('automation.autoEscalation', false);
    const autoDowngrade = getConfig('automation.autoDowngrade', true);

    if (trustEnabled !== true) {
      return {
        ok: true, skipped: true, reason: 'trustScoreDisabled',
        flags: { trustEnabled, autoEscalation, autoDowngrade },
      };
    }

    syncToControlState();

    return {
      ok: true,
      trigger: opts.trigger || 'manual',
      flags: { trustEnabled, autoEscalation, autoDowngrade },
    };
  } catch (e) {
    return { ok: false, reason: 'reconcile_threw', error: e.message };
  }
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
  syncToControlState,
  reconcile,
  LEVEL_THRESHOLDS,
  UPGRADE_COOLDOWN_MS,
  SCORE_CHANGES
};
