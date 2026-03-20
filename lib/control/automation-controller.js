/**
 * Automation Level Controller (L0-L4)
 * @module lib/control/automation-controller
 * @version 2.0.0
 *
 * 5-level automation control with gate configuration,
 * destructive operation handling, and bkit.config.json integration.
 */

const fs = require('fs');
const path = require('path');

// Lazy requires
let _core = null;
function getCore() {
  if (!_core) { _core = require('../core'); }
  return _core;
}

// ── Automation Level Definitions ────────────────────────────────────

/**
 * Automation level constants (integer 0-4)
 * @enum {number}
 */
const AUTOMATION_LEVELS = {
  MANUAL: 0,
  GUIDED: 1,
  SEMI_AUTO: 2,
  AUTO: 3,
  FULL_AUTO: 4,
};

/** @type {number} Default automation level (Semi-Auto) */
const DEFAULT_LEVEL = AUTOMATION_LEVELS.SEMI_AUTO;

/**
 * Level metadata definitions
 * @type {Object<number, {name:string, description:string}>}
 */
const LEVEL_DEFINITIONS = {
  0: { name: 'manual', description: 'All actions require approval' },
  1: { name: 'guided', description: 'Read auto, write approval' },
  2: { name: 'semi-auto', description: 'Non-destructive auto, destructive approval' },
  3: { name: 'auto', description: 'Most auto, high-risk approval only' },
  4: { name: 'full-auto', description: 'All auto, post-review only' },
};

/**
 * Mapping from legacy string level names to integer levels
 * @type {Object<string, number>}
 */
const LEGACY_LEVEL_MAP = {
  'manual': 0,
  'guide': 1,
  'guided': 1,
  'semi-auto': 2,
  'auto': 3,
  'full-auto': 4,
};

// ── Gate Configuration ──────────────────────────────────────────────

/**
 * Phase transition gate configuration.
 * Defines which level is required for auto-approval of each transition.
 * @type {Object<string, {required:boolean, autoApproveLevel:number}>}
 */
const GATE_CONFIG = {
  'idle:pm':        { required: false, autoApproveLevel: 1 },
  'idle:plan':      { required: false, autoApproveLevel: 1 },
  'pm:plan':        { required: true,  autoApproveLevel: 2 },
  'plan:design':    { required: true,  autoApproveLevel: 2 },
  'design:do':      { required: true,  autoApproveLevel: 2 },
  'do:check':       { required: true,  autoApproveLevel: 3 },
  'check:report':   { required: true,  autoApproveLevel: 2 },
  'check:act':      { required: true,  autoApproveLevel: 2 },
  'act:check':      { required: true,  autoApproveLevel: 2 },
  'report:archived': { required: true, autoApproveLevel: 3 },
};

/**
 * Destructive operation classification.
 * Each key is an operation pattern; value is the minimum level for auto-allow.
 * Operations below this level get 'ask'; certain ops always 'deny' below a floor.
 * @type {Object<string, {autoLevel:number, denyBelow:number}>}
 */
const DESTRUCTIVE_OPS = {
  'file_delete':      { autoLevel: 4, denyBelow: 0 },
  'bash_dangerous':   { autoLevel: 3, denyBelow: 2 },
  'bash_destructive': { autoLevel: 4, denyBelow: 3 },
  'git_push_force':   { autoLevel: 4, denyBelow: 4 },
  'git_push':         { autoLevel: 3, denyBelow: 2 },
  'config_change':    { autoLevel: 4, denyBelow: 2 },
  'external_api':     { autoLevel: 3, denyBelow: 2 },
};

// ── Trust Score Helper ───────────────────────────────────────────────

/**
 * Get trust score from trust-engine (Single Source of Truth)
 * @returns {number} Trust score (fallback: 40)
 * @private
 */
function _getTrustScore() {
  try { return require('./trust-engine').getScore(); } catch (_) { return 40; }
}

// ── Runtime State ───────────────────────────────────────────────────

/**
 * Get path to runtime control state file
 * @returns {string}
 */
function _getControlStatePath() {
  const { PROJECT_DIR } = getCore();
  return path.join(PROJECT_DIR, '.bkit', 'runtime', 'control-state.json');
}

/**
 * Read runtime control state from disk
 * @returns {Object}
 */
function getRuntimeState() {
  const statePath = _getControlStatePath();
  try {
    if (fs.existsSync(statePath)) {
      return JSON.parse(fs.readFileSync(statePath, 'utf8'));
    }
  } catch (_) { /* fall through */ }

  return _createDefaultRuntimeState();
}

/**
 * Update runtime control state on disk
 * @param {Object} patch - Fields to merge into state
 */
function updateRuntimeState(patch) {
  const { debugLog, PROJECT_DIR } = getCore();
  const statePath = _getControlStatePath();
  const current = getRuntimeState();
  const updated = { ...current, ...patch };

  try {
    const dir = path.dirname(statePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(statePath, JSON.stringify(updated, null, 2));
    debugLog('CTRL', 'Runtime state updated', patch);
  } catch (_) { /* non-critical */ }
}

/**
 * Create default runtime state
 * @returns {Object}
 * @private
 */
function _createDefaultRuntimeState() {
  const { getConfig } = getCore();
  return {
    version: '1.0',
    currentLevel: getConfig('automation.defaultLevel', DEFAULT_LEVEL),
    previousLevel: null,
    levelChangedAt: null,
    levelChangeReason: null,
    trustScore: _getTrustScore(),
    sessionStats: {
      approvals: 0,
      rejections: 0,
      modifications: 0,
      destructiveBlocked: 0,
      checkpointsCreated: 0,
      rollbacksPerformed: 0,
    },
    emergencyStop: false,
    cooldownUntil: null,
    lastEscalation: null,
    lastDowngrade: null,
  };
}

// ── Core API ────────────────────────────────────────────────────────

/**
 * Get current automation level (0-4)
 * Reads from runtime state first, falls back to config, then env.
 * @returns {number}
 */
function getCurrentLevel() {
  const { getConfig } = getCore();

  // Check runtime state first (session-level override)
  const state = getRuntimeState();
  if (state.currentLevel != null && state.currentLevel >= 0 && state.currentLevel <= 4) {
    return state.currentLevel;
  }

  // Check environment variable
  const envLevel = process.env.BKIT_AUTOMATION_LEVEL;
  if (envLevel != null) {
    const parsed = parseInt(envLevel, 10);
    if (parsed >= 0 && parsed <= 4) return parsed;
    // Try legacy string mapping
    if (LEGACY_LEVEL_MAP[envLevel] != null) return LEGACY_LEVEL_MAP[envLevel];
  }

  // Legacy env var support
  const legacyEnv = process.env.BKIT_PDCA_AUTOMATION;
  if (legacyEnv && LEGACY_LEVEL_MAP[legacyEnv] != null) {
    return LEGACY_LEVEL_MAP[legacyEnv];
  }

  // Config: automation.defaultLevel (v2.0) or pdca.automationLevel (v1.x)
  const configLevel = getConfig('automation.defaultLevel', null);
  if (configLevel != null) {
    const num = typeof configLevel === 'number' ? configLevel : LEGACY_LEVEL_MAP[configLevel];
    if (num != null && num >= 0 && num <= 4) return num;
  }

  // Legacy config fallback
  const legacyConfig = getConfig('pdca.automationLevel', null);
  if (legacyConfig && LEGACY_LEVEL_MAP[legacyConfig] != null) {
    return LEGACY_LEVEL_MAP[legacyConfig];
  }

  return DEFAULT_LEVEL;
}

/**
 * Set automation level explicitly
 * @param {number|string} level - Level 0-4 or name string
 * @param {Object} [options]
 * @param {string} [options.reason] - Change reason
 * @param {boolean} [options.force=false] - Skip trust score check
 * @returns {{success:boolean, previousLevel:number, newLevel:number, reason?:string}}
 */
function setLevel(level, options = {}) {
  const { debugLog } = getCore();
  const { reason = 'user_request', force = false } = options;

  // Resolve level
  let numLevel;
  if (typeof level === 'string') {
    numLevel = LEGACY_LEVEL_MAP[level];
  } else {
    numLevel = level;
  }

  if (numLevel == null || numLevel < 0 || numLevel > 4) {
    return { success: false, previousLevel: getCurrentLevel(), newLevel: getCurrentLevel(), reason: 'Invalid level' };
  }

  const previousLevel = getCurrentLevel();

  updateRuntimeState({
    currentLevel: numLevel,
    previousLevel,
    levelChangedAt: new Date().toISOString(),
    levelChangeReason: reason,
  });

  debugLog('CTRL', 'Level changed', { from: previousLevel, to: numLevel, reason });

  return { success: true, previousLevel, newLevel: numLevel };
}

/**
 * Get human-readable level name
 * @param {number} level - Level 0-4
 * @returns {string}
 */
function getLevelName(level) {
  return LEVEL_DEFINITIONS[level]?.name || 'unknown';
}

/**
 * Convert level name to number
 * @param {string} name - Level name
 * @returns {number}
 */
function levelFromName(name) {
  return LEGACY_LEVEL_MAP[name] != null ? LEGACY_LEVEL_MAP[name] : -1;
}

/**
 * Check if a phase transition can auto-advance at the given level
 * @param {string} fromPhase - Source phase
 * @param {string} toPhase - Target phase
 * @param {number} [level] - Automation level (defaults to current)
 * @returns {boolean}
 */
function canAutoAdvance(fromPhase, toPhase, level) {
  if (level == null) level = getCurrentLevel();
  const gate = GATE_CONFIG[`${fromPhase}:${toPhase}`];
  if (!gate) return level >= 2; // Unknown transitions: auto from L2+
  return level >= gate.autoApproveLevel;
}

/**
 * Get gate configuration for a phase transition
 * @param {string} fromPhase - Source phase
 * @param {string} toPhase - Target phase
 * @returns {{required:boolean, autoApproveLevel:number}}
 */
function getGateConfig(fromPhase, toPhase) {
  return GATE_CONFIG[`${fromPhase}:${toPhase}`] || { required: true, autoApproveLevel: 2 };
}

/**
 * Check if a destructive operation is allowed at the current level
 * @param {string} operation - Operation identifier
 * @param {number} [level] - Automation level (defaults to current)
 * @returns {'allow'|'ask'|'deny'}
 */
function isDestructiveAllowed(operation, level) {
  if (level == null) level = getCurrentLevel();
  const config = DESTRUCTIVE_OPS[operation];

  if (!config) {
    // Unknown operation: allow from L2+, ask at L1, deny at L0
    if (level >= 2) return 'allow';
    if (level >= 1) return 'ask';
    return 'deny';
  }

  if (level < config.denyBelow) return 'deny';
  if (level >= config.autoLevel) return 'allow';
  return 'ask';
}

/**
 * Resolve action permission for a given operation and context
 * @param {string} action - Action identifier
 * @param {Object} [context] - Action context
 * @returns {'auto'|'gate'|'deny'}
 */
function resolveAction(action, context = {}) {
  const level = getCurrentLevel();

  // Phase transition
  if (action === 'phase_transition' && context.fromPhase && context.toPhase) {
    if (canAutoAdvance(context.fromPhase, context.toPhase, level)) return 'auto';
    return 'gate';
  }

  // Destructive operations
  if (action.startsWith('bash_') || action === 'file_delete' ||
      action === 'git_push_force' || action === 'config_change') {
    const result = isDestructiveAllowed(action, level);
    return result === 'allow' ? 'auto' : result === 'ask' ? 'gate' : 'deny';
  }

  // General actions: auto from L2+
  if (level >= 2) return 'auto';
  if (level >= 1) return 'gate';
  return 'gate';
}

/**
 * Emergency stop — immediately drop to fallback level
 * @param {string} reason - Emergency stop reason
 * @returns {{previousLevel:number, fallbackLevel:number}}
 */
function emergencyStop(reason) {
  const { getConfig, debugLog } = getCore();
  const previousLevel = getCurrentLevel();
  const fallbackLevel = getConfig('automation.emergencyFallbackLevel', 1);

  updateRuntimeState({
    currentLevel: fallbackLevel,
    previousLevel,
    levelChangedAt: new Date().toISOString(),
    levelChangeReason: `emergency: ${reason}`,
    emergencyStop: true,
  });

  debugLog('CTRL', 'EMERGENCY STOP', { previousLevel, fallbackLevel, reason });

  return { previousLevel, fallbackLevel };
}

/**
 * Resume from emergency stop
 * @param {number} [resumeLevel] - Level to resume at (defaults to previous level)
 * @returns {{success:boolean}}
 */
function emergencyResume(resumeLevel) {
  const state = getRuntimeState();
  if (!state.emergencyStop) {
    return { success: false };
  }

  const targetLevel = resumeLevel != null ? resumeLevel : (state.previousLevel || DEFAULT_LEVEL);
  setLevel(targetLevel, { reason: 'emergency_resume' });
  updateRuntimeState({ emergencyStop: false });

  return { success: true };
}

/**
 * Get legacy automation level string (v1.x compatibility)
 * Maps L0-L4 to old 'manual'|'semi-auto'|'full-auto' values.
 * @returns {'manual'|'semi-auto'|'full-auto'}
 */
function getLegacyAutomationLevel() {
  const level = getCurrentLevel();
  if (level <= 0) return 'manual';
  if (level >= 4) return 'full-auto';
  return 'semi-auto';
}

/**
 * Increment a session statistic counter
 * @param {string} stat - Stat key (e.g., 'approvals', 'rejections')
 * @param {number} [delta=1] - Amount to increment
 */
function incrementStat(stat, delta = 1) {
  const state = getRuntimeState();
  const stats = state.sessionStats || {};
  stats[stat] = (stats[stat] || 0) + delta;
  updateRuntimeState({ sessionStats: stats });
}

// ── Exports ─────────────────────────────────────────────────────────

module.exports = {
  // Constants
  AUTOMATION_LEVELS,
  DEFAULT_LEVEL,
  LEVEL_DEFINITIONS,
  LEGACY_LEVEL_MAP,
  GATE_CONFIG,
  DESTRUCTIVE_OPS,

  // Core API
  getCurrentLevel,
  setLevel,
  getLevelName,
  levelFromName,
  canAutoAdvance,
  getGateConfig,
  isDestructiveAllowed,
  resolveAction,

  // Emergency controls
  emergencyStop,
  emergencyResume,

  // Runtime state
  getRuntimeState,
  updateRuntimeState,
  incrementStat,

  // Compatibility
  getLegacyAutomationLevel,
};
