/**
 * PDCA Automation Module
 * @module lib/pdca/automation
 * @version 2.1.10
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

  // v2.1.5 I1: semi-auto now includes plan and design for continuous flow
  // plan→design→do is a natural document generation sequence that benefits from auto-advance
  const semiAutoPhases = ['plan', 'design', 'check', 'qa', 'report', 'completed'];
  return semiAutoPhases.includes(phase);
}

/**
 * Generate auto-trigger for next phase
 * @param {string} currentPhase
 * @param {Object} context
 * @returns {Object|null}
 */
function generateAutoTrigger(currentPhase, context = {}) {
  if (!shouldAutoAdvance(currentPhase)) return null;

  // v2.1.10 Sprint 7b (G-P-01): matchRate threshold SSoT (bkit.config.json, default 90)
  const { getConfig } = getCore();
  const matchThreshold = getConfig('pdca.matchRateThreshold', 90);

  const phaseMap = {
    pm: { skill: 'pdca', args: `plan ${context.feature}` },
    plan: { skill: 'pdca', args: `design ${context.feature}` },
    design: { skill: 'pdca', args: `do ${context.feature}` },
    do: { skill: 'pdca', args: `analyze ${context.feature}` },
    check: context.matchRate >= matchThreshold
      ? { skill: 'qa-phase', args: context.feature }
      : { skill: 'pdca', args: `iterate ${context.feature}` },
    act: { skill: 'pdca', args: `analyze ${context.feature}` },
    qa: context.qaPassRate >= 95 && context.qaCriticalCount === 0
      ? { skill: 'pdca', args: `report ${context.feature}` }
      : { skill: 'pdca', args: `iterate ${context.feature}` },
    report: { complete: true, feature: context.feature },
    completed: { complete: true, feature: context.feature },
  };

  return phaseMap[currentPhase] || null;
}

/**
 * v1.5.7: Generate batch trigger for multiple features
 * @param {string[]} features - Feature names to batch process
 * @param {string} phase - Target PDCA phase
 * @returns {Object|null}
 */
function generateBatchTrigger(features, phase) {
  if (!Array.isArray(features) || features.length < 2) return null;

  const { debugLog } = getCore();

  debugLog('PDCA', 'Batch trigger generated', {
    featureCount: features.length,
    phase
  });

  return {
    type: 'batch',
    features,
    phase,
    commands: features.map(f => ({
      skill: 'pdca',
      args: `${phase} ${f}`
    }))
  };
}

/**
 * v1.5.7: Check if batch mode is appropriate
 * @param {Object} context - Current context with activeFeatures
 * @returns {boolean}
 */
function shouldSuggestBatch(context = {}) {
  const { getPdcaStatusFull } = getStatus();
  const status = getPdcaStatusFull();
  const activeFeatures = status?.activeFeatures || [];

  return activeFeatures.length >= 2;
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
    pm: 'plan',
    plan: 'design',
    design: 'do',
    do: 'check',
    check: result.matchRate >= 100 ? 'qa' : 'act',
    act: 'check',
    qa: (result.qaPassRate >= 95 && result.qaCriticalCount === 0) ? 'report' : 'act',
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

// S3a ENH-345: AskUserQuestion / user-prompt builders extracted to ./automation-questions
const {
  emitUserPrompt,
  formatAskUserQuestion,
  buildNextActionQuestion,
} = require('./automation-questions');

/**
 * v1.5.1: Detect PDCA phase from TaskCompleted event
 * @param {string} taskSubject - Completed task's subject
 * @returns {{ phase: string, feature: string } | null}
 */
function detectPdcaFromTaskSubject(taskSubject) {
  if (!taskSubject) return null;

  const patterns = {
    pm:     /\[PM\]\s+(.+)/,
    plan:   /\[Plan\]\s+(.+)/,
    design: /\[Design\]\s+(.+)/,
    do:     /\[Do\]\s+(.+)/,
    check:  /\[Check\]\s+(.+)/,
    act:    /\[Act(?:-\d+)?\]\s+(.+)/,
    qa:     /\[QA\]\s+(.+)/,
    report: /\[Report\]\s+(.+)/,
  };

  for (const [phase, pattern] of Object.entries(patterns)) {
    const match = taskSubject.match(pattern);
    if (match) {
      return { phase, feature: match[1]?.trim() };
    }
  }

  return null;
}

/**
 * v1.5.1: Determine next PDCA action after TaskCompleted
 * @param {string} phase - Completed phase
 * @param {string} feature - feature name
 * @returns {{ nextPhase: string, command: string, autoExecute: boolean } | null}
 */
function getNextPdcaActionAfterCompletion(phase, feature) {
  if (!phase || !feature) return null;

  const { getConfig } = getCore();
  const { getPdcaStatusFull } = getStatus();

  const pdcaStatus = getPdcaStatusFull();
  const featureData = pdcaStatus?.features?.[feature];
  const matchRate = featureData?.matchRate;

  const nextPhaseMap = {
    pm: { nextPhase: 'plan', command: `/pdca plan ${feature}` },
    plan: { nextPhase: 'design', command: `/pdca design ${feature}` },
    design: { nextPhase: 'do', command: `/pdca do ${feature}` },
    do: { nextPhase: 'check', command: `/pdca analyze ${feature}` },
    check: matchRate >= 100
      ? { nextPhase: 'qa', command: `/qa-phase ${feature}` }
      : { nextPhase: 'act', command: `/pdca iterate ${feature}` },
    act: { nextPhase: 'check', command: `/pdca analyze ${feature}` },
    qa: featureData?.qaPassRate >= 95
      ? { nextPhase: 'report', command: `/pdca report ${feature}` }
      : { nextPhase: 'act', command: `/pdca iterate ${feature}` },
    report: { nextPhase: 'completed', command: `/pdca archive ${feature}` },
  };

  const next = nextPhaseMap[phase];
  if (!next) return null;

  return {
    ...next,
    autoExecute: shouldAutoAdvance(phase)
  };
}

/**
 * v2.1.5 I2: Canonical PDCA Phase Transition Map (Single Source of Truth)
 * Consolidates PDCA_PHASE_TRANSITIONS from pdca-skill-stop.js
 * @type {Object}
 */
const PDCA_PHASE_TRANSITIONS = {
  'pm': {
    next: 'plan',
    skill: '/pdca plan',
    message: 'PM analysis completed. Proceed to Plan phase.',
    taskTemplate: '[Plan] {feature}'
  },
  'plan': {
    next: 'design',
    skill: '/pdca design',
    message: 'Plan completed. Proceed to Design phase.',
    taskTemplate: '[Design] {feature}'
  },
  'design': {
    next: 'do',
    skill: null,
    message: 'Design completed. Start implementation.',
    taskTemplate: '[Do] {feature}'
  },
  'do': {
    next: 'check',
    skill: '/pdca analyze',
    message: 'Implementation completed. Run Gap analysis.',
    taskTemplate: '[Check] {feature}'
  },
  'check': {
    conditions: [
      {
        when: (ctx) => ctx.matchRate >= 90,
        next: 'report',
        skill: '/pdca report',
        message: 'Check passed! Generate completion report.',
        taskTemplate: '[Report] {feature}'
      },
      {
        when: (ctx) => ctx.matchRate < 90,
        next: 'act',
        skill: '/pdca iterate',
        message: 'Check below threshold. Run auto improvement.',
        taskTemplate: '[Act-{N}] {feature}'
      }
    ]
  },
  'act': {
    next: 'check',
    skill: '/pdca analyze',
    message: 'Act completed. Run re-verification.',
    taskTemplate: '[Check] {feature}'
  },
  'qa': {
    conditions: [
      {
        when: (ctx) => ctx.qaPassRate >= 95 && ctx.qaCriticalCount === 0,
        next: 'report',
        skill: '/pdca report',
        message: 'QA passed! Generate completion report.',
        taskTemplate: '[Report] {feature}'
      },
      {
        when: () => true,
        next: 'act',
        skill: '/pdca iterate',
        message: 'QA issues found. Run auto improvement.',
        taskTemplate: '[Act-{N}] {feature}'
      }
    ]
  },
  'report': {
    next: 'completed',
    skill: null,
    message: 'PDCA cycle completed!',
    taskTemplate: null
  }
};

/**
 * v2.1.5 I2: Determine PDCA transition from canonical map
 * @param {string} currentPhase
 * @param {Object} context - { matchRate, iterationCount, feature, qaPassRate, qaCriticalCount }
 * @returns {Object|null} { next, skill, message, taskTemplate }
 */
function determinePdcaTransition(currentPhase, context = {}) {
  const transition = PDCA_PHASE_TRANSITIONS[currentPhase];
  if (!transition) return null;

  if (transition.conditions) {
    for (const condition of transition.conditions) {
      if (condition.when(context)) {
        return {
          next: condition.next,
          skill: condition.skill,
          message: condition.message,
          taskTemplate: (condition.taskTemplate || '').replace('{N}', context.iterationCount || 1)
        };
      }
    }
    return null;
  }

  return {
    next: transition.next,
    skill: transition.skill,
    message: transition.message,
    taskTemplate: transition.taskTemplate
  };
}

/**
 * v2.1.5 I3: Convert integer automation level (L0-L4) to string
 * @param {number} intLevel - 0-4
 * @returns {string} 'manual' | 'semi-auto' | 'full-auto'
 */
function toLevelString(intLevel) {
  const map = { 0: 'manual', 1: 'manual', 2: 'semi-auto', 3: 'full-auto', 4: 'full-auto' };
  return map[intLevel] || 'manual';
}

/**
 * v2.1.5 I3: Convert string automation level to integer (L0-L4)
 * @param {string} strLevel - 'manual' | 'semi-auto' | 'full-auto'
 * @returns {number} 0-4
 */
function fromLevelString(strLevel) {
  const map = { 'manual': 0, 'semi-auto': 2, 'full-auto': 4 };
  return map[strLevel] ?? 0;
}

module.exports = {
  getAutomationLevel,
  isFullAutoMode,
  shouldAutoAdvance,
  generateAutoTrigger,
  generateBatchTrigger,
  shouldSuggestBatch,
  shouldAutoStartPdca,
  autoAdvancePdcaPhase,
  getHookContext,
  emitUserPrompt,
  formatAskUserQuestion,
  buildNextActionQuestion,
  detectPdcaFromTaskSubject,
  getNextPdcaActionAfterCompletion,
  PDCA_PHASE_TRANSITIONS,
  determinePdcaTransition,
  toLevelString,
  fromLevelString,
};
