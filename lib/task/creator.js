/**
 * Task Creation Module
 * @module lib/task/creator
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

let _pdca = null;
function getPdca() {
  if (!_pdca) {
    _pdca = require('../pdca');
  }
  return _pdca;
}

/**
 * Generate PDCA task subject
 * @param {string} phase
 * @param {string} feature
 * @returns {string}
 */
function generatePdcaTaskSubject(phase, feature) {
  const phaseIcons = {
    plan: '📋',
    design: '📐',
    do: '🔨',
    check: '🔍',
    act: '🔄',
    report: '📊'
  };

  const icon = phaseIcons[phase] || '📌';
  return `${icon} [${phase.charAt(0).toUpperCase() + phase.slice(1)}] ${feature}`;
}

/**
 * Generate PDCA task description
 * @param {string} phase
 * @param {string} feature
 * @param {string} docPath
 * @returns {string}
 */
function generatePdcaTaskDescription(phase, feature, docPath = '') {
  const descriptions = {
    plan: `Plan phase for ${feature}. Define requirements and scope.`,
    design: `Design phase for ${feature}. Create detailed design document.`,
    do: `Implementation phase for ${feature}. Build according to design.`,
    check: `Verification phase for ${feature}. Run gap analysis.`,
    act: `Improvement phase for ${feature}. Fix gaps found in check.`,
    report: `Reporting phase for ${feature}. Generate completion report.`
  };

  let desc = descriptions[phase] || `${phase} phase for ${feature}`;

  if (docPath) {
    desc += `\n\nReference: ${docPath}`;
  }

  return desc;
}

/**
 * Get PDCA task metadata
 * @param {string} phase
 * @param {string} feature
 * @param {Object} options
 * @returns {Object}
 */
function getPdcaTaskMetadata(phase, feature, options = {}) {
  const { getPhaseNumber } = getPdca();

  return {
    pdcaPhase: phase,
    pdcaOrder: getPhaseNumber(phase),
    feature: feature,
    level: options.level || 'Dynamic',
    createdAt: new Date().toISOString()
  };
}

/**
 * Generate task guidance for phase
 * @param {string} phase
 * @param {string} feature
 * @param {string} blockedByPhase
 * @returns {string}
 */
function generateTaskGuidance(phase, feature, blockedByPhase = '') {
  let guidance = `Phase: ${phase}\nFeature: ${feature}\n\n`;

  if (blockedByPhase) {
    guidance += `⚠️ Blocked by: ${blockedByPhase} phase\n`;
    guidance += `Complete the ${blockedByPhase} phase first.\n\n`;
  }

  const phaseGuidance = {
    plan: 'Create a plan document with requirements and scope.',
    design: 'Create a design document with architecture and implementation details.',
    do: 'Implement according to the design document.',
    check: 'Run /pdca analyze to verify implementation matches design.',
    act: 'Run /pdca iterate to fix any gaps found.',
    report: 'Run /pdca report to generate completion report.'
  };

  guidance += phaseGuidance[phase] || '';

  return guidance;
}

/**
 * Create PDCA task chain
 * @param {string} feature
 * @param {Object} options
 * @returns {Object}
 */
function createPdcaTaskChain(feature, options = {}) {
  const { debugLog } = getCore();
  const { updatePdcaStatus, savePdcaTaskId } = getPdca();

  const phases = ['plan', 'design', 'do', 'check', 'report'];
  const tasks = {};

  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    const blockedBy = i > 0 ? phases[i - 1] : null;

    const taskId = `${phase}-${feature}-${Date.now()}`;

    tasks[phase] = {
      id: taskId,
      subject: generatePdcaTaskSubject(phase, feature),
      description: generatePdcaTaskDescription(phase, feature),
      metadata: getPdcaTaskMetadata(phase, feature, options),
      blockedBy: blockedBy ? [tasks[blockedBy]?.id] : []
    };

    // Save task ID for persistence
    savePdcaTaskId(feature, phase, taskId, options);
  }

  debugLog('task', 'Created PDCA task chain', { feature, taskCount: phases.length });

  return {
    feature,
    tasks,
    phases,
    createdAt: new Date().toISOString()
  };
}

/**
 * Auto-create PDCA task
 * @param {string|Object} featureOrConfig
 * @param {string} phase
 * @param {Object} options
 * @returns {Object}
 */
function autoCreatePdcaTask(featureOrConfig, phase, options = {}) {
  const { debugLog } = getCore();

  let feature, config;
  if (typeof featureOrConfig === 'object') {
    config = featureOrConfig;
    feature = config.feature;
    phase = config.phase || phase;
  } else {
    feature = featureOrConfig;
    config = options;
  }

  const taskId = `${phase}-${feature}-${Date.now()}`;

  const task = {
    id: taskId,
    subject: generatePdcaTaskSubject(phase, feature),
    description: generatePdcaTaskDescription(phase, feature, config.docPath),
    metadata: getPdcaTaskMetadata(phase, feature, config),
    status: 'pending'
  };

  debugLog('task', 'Auto-created PDCA task', { taskId, phase, feature });

  return task;
}

module.exports = {
  generatePdcaTaskSubject,
  generatePdcaTaskDescription,
  getPdcaTaskMetadata,
  generateTaskGuidance,
  createPdcaTaskChain,
  autoCreatePdcaTask,
};
