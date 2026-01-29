/**
 * PDCA Automation Module
 * @module lib/pdca/automation
 * @version 1.4.7
 */

// Lazy require
let _core = null;
function getCore() {
  if (!_core) {
    _core = require('../core');
  }
  return _core;
}

let _status = null;
function getStatus() {
  if (!_status) {
    _status = require('./status');
  }
  return _status;
}

/**
 * Get automation level from config/env
 * @returns {'manual' | 'semi-auto' | 'full-auto'}
 */
function getAutomationLevel() {
  const { getConfig } = getCore();
  const envLevel = process.env.BKIT_PDCA_AUTOMATION;
  if (envLevel && ['manual', 'semi-auto', 'full-auto'].includes(envLevel)) {
    return envLevel;
  }
  return getConfig('pdca.automationLevel', 'semi-auto');
}

/**
 * Check if full-auto mode is enabled
 * @returns {boolean}
 */
function isFullAutoMode() {
  return getAutomationLevel() === 'full-auto';
}

/**
 * Check if should auto-advance for given phase
 * @param {string} phase
 * @returns {boolean}
 */
function shouldAutoAdvance(phase) {
  const { getConfig } = getCore();
  const level = getAutomationLevel();

  if (level === 'manual') return false;

  const reviewCheckpoints = getConfig('pdca.fullAuto.reviewCheckpoints', ['design']);

  if (level === 'full-auto') {
    return !reviewCheckpoints.includes(phase);
  }

  // semi-auto: only auto-advance from check to act (when matchRate < 90)
  return phase === 'check';
}

/**
 * Generate auto-trigger for next phase
 * @param {string} currentPhase
 * @param {Object} context
 * @returns {Object|null}
 */
function generateAutoTrigger(currentPhase, context = {}) {
  if (!shouldAutoAdvance(currentPhase)) return null;

  const phaseMap = {
    plan: { skill: 'pdca', args: `design ${context.feature}` },
    design: { skill: 'pdca', args: `do ${context.feature}` },
    do: { skill: 'pdca', args: `analyze ${context.feature}` },
    check: context.matchRate >= 90
      ? { skill: 'pdca', args: `report ${context.feature}` }
      : { skill: 'pdca', args: `iterate ${context.feature}` },
    act: { skill: 'pdca', args: `analyze ${context.feature}` },
  };

  return phaseMap[currentPhase] || null;
}

/**
 * Check if PDCA should auto-start based on task
 * @param {string} feature
 * @param {Object} taskClassification
 * @returns {boolean}
 */
function shouldAutoStartPdca(feature, taskClassification) {
  const { getConfig } = getCore();
  const { getPdcaStatusFull } = getStatus();

  // Don't auto-start if already in progress
  const status = getPdcaStatusFull();
  if (status?.features?.[feature]) return false;

  // Check task size threshold
  const threshold = getConfig('pdca.autoStartThreshold', 100);
  const lineCount = taskClassification?.lines || 0;

  return lineCount >= threshold;
}

/**
 * Auto-advance PDCA phase based on result
 * @param {string} feature
 * @param {string} currentPhase
 * @param {Object} result
 * @returns {Object|null}
 */
function autoAdvancePdcaPhase(feature, currentPhase, result = {}) {
  const { debugLog, getConfig } = getCore();
  const { updatePdcaStatus } = getStatus();

  if (!shouldAutoAdvance(currentPhase)) {
    debugLog('PDCA', 'Auto-advance skipped', { phase: currentPhase });
    return null;
  }

  const nextPhaseMap = {
    plan: 'design',
    design: 'do',
    do: 'check',
    check: result.matchRate >= 90 ? 'report' : 'act',
    act: 'check'
  };

  const nextPhase = nextPhaseMap[currentPhase];
  if (!nextPhase) return null;

  updatePdcaStatus(feature, nextPhase, {
    previousPhase: currentPhase,
    autoAdvanced: true
  });

  debugLog('PDCA', 'Auto-advanced phase', {
    feature,
    from: currentPhase,
    to: nextPhase
  });

  return {
    feature,
    phase: nextPhase,
    trigger: generateAutoTrigger(currentPhase, { feature, ...result })
  };
}

/**
 * Get hook context for automation
 * @returns {Object}
 */
function getHookContext() {
  const { BKIT_PLATFORM, PROJECT_DIR, PLUGIN_ROOT } = getCore();

  return {
    platform: BKIT_PLATFORM,
    projectDir: PROJECT_DIR,
    pluginRoot: PLUGIN_ROOT,
    automationLevel: getAutomationLevel(),
    isFullAuto: isFullAutoMode()
  };
}

/**
 * Format user prompt output
 * @param {Object} options
 * @returns {string}
 */
function emitUserPrompt(options = {}) {
  const { message, feature, phase, suggestions } = options;

  let output = '';

  if (message) {
    output += message + '\n';
  }

  if (feature && phase) {
    output += `\n📍 Current: ${feature} (${phase})\n`;
  }

  if (suggestions?.length) {
    output += '\n💡 Suggestions:\n';
    suggestions.forEach((s, i) => {
      output += `  ${i + 1}. ${s}\n`;
    });
  }

  return output;
}

/**
 * Format ask user question payload
 * @param {Object} payload
 * @returns {Object}
 */
function formatAskUserQuestion(payload) {
  return {
    questions: [
      {
        question: payload.question || 'How would you like to proceed?',
        header: payload.header || 'Action',
        options: payload.options || [
          { label: 'Continue', description: 'Proceed with current task' },
          { label: 'Skip', description: 'Skip this step' }
        ],
        multiSelect: payload.multiSelect || false
      }
    ]
  };
}

module.exports = {
  getAutomationLevel,
  isFullAutoMode,
  shouldAutoAdvance,
  generateAutoTrigger,
  shouldAutoStartPdca,
  autoAdvancePdcaPhase,
  getHookContext,
  emitUserPrompt,
  formatAskUserQuestion,
};
