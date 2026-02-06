/**
 * CTO Decision Logic Module
 * @module lib/team/cto-logic
 * @version 1.5.1
 *
 * CTO agent decision-making logic for PDCA phase management,
 * document evaluation, and team composition recommendations.
 */

const { debugLog } = require('../core/debug');

// Lazy requires to avoid circular dependencies
let _pdcaStatus = null;
function getPdcaModule() {
  if (!_pdcaStatus) {
    try {
      _pdcaStatus = require('../pdca/status');
    } catch (e) {
      _pdcaStatus = {};
    }
  }
  return _pdcaStatus;
}

let _pdcaPhase = null;
function getPhaseModule() {
  if (!_pdcaPhase) {
    try {
      _pdcaPhase = require('../pdca/phase');
    } catch (e) {
      _pdcaPhase = {};
    }
  }
  return _pdcaPhase;
}

let _pdcaLevel = null;
function getLevelModule() {
  if (!_pdcaLevel) {
    try {
      _pdcaLevel = require('../pdca/level');
    } catch (e) {
      _pdcaLevel = {};
    }
  }
  return _pdcaLevel;
}

/**
 * Decide the next PDCA phase based on current state
 * @param {string} feature - Feature name
 * @returns {Object} { currentPhase, nextPhase, readyToAdvance, blockers: string[] }
 */
function decidePdcaPhase(feature) {
  const pdca = getPdcaModule();
  const phase = getPhaseModule();
  const blockers = [];

  const status = pdca.getPdcaStatusFull ? pdca.getPdcaStatusFull() : null;
  const featureData = status?.features?.[feature];
  const currentPhase = featureData?.phase || null;

  if (!currentPhase) {
    return {
      currentPhase: null,
      nextPhase: 'plan',
      readyToAdvance: true,
      blockers: [],
    };
  }

  const nextPhase = phase.getNextPdcaPhase ? phase.getNextPdcaPhase(currentPhase) : null;

  // Check deliverables for current phase
  if (currentPhase === 'plan') {
    const planDoc = phase.findPlanDoc ? phase.findPlanDoc(feature) : null;
    if (!planDoc) blockers.push('Plan document not found');
  }

  if (currentPhase === 'design') {
    const designDoc = phase.findDesignDoc ? phase.findDesignDoc(feature) : null;
    if (!designDoc) blockers.push('Design document not found');
  }

  if (currentPhase === 'check') {
    const matchRate = featureData?.matchRate;
    if (matchRate == null) blockers.push('Match rate not available');
    else if (matchRate < 90) blockers.push(`Match rate ${matchRate}% is below 90% threshold`);

    const criticalIssues = featureData?.criticalIssues;
    if (criticalIssues > 0) blockers.push(`${criticalIssues} critical issues remain`);
  }

  debugLog('CTOLogic', 'Phase decision', {
    feature,
    currentPhase,
    nextPhase,
    blockers,
  });

  return {
    currentPhase,
    nextPhase,
    readyToAdvance: blockers.length === 0,
    blockers,
  };
}

/**
 * Evaluate Plan/Design document quality
 * @param {string} feature - Feature name
 * @param {string} docType - 'plan' | 'design'
 * @returns {Object} { exists, path, hasRequiredSections, score, issues: string[] }
 */
function evaluateDocument(feature, docType) {
  const phase = getPhaseModule();
  const fs = require('fs');
  const issues = [];
  let path = null;
  let exists = false;
  let content = '';

  if (docType === 'plan' && phase.findPlanDoc) {
    path = phase.findPlanDoc(feature);
  } else if (docType === 'design' && phase.findDesignDoc) {
    path = phase.findDesignDoc(feature);
  }

  if (path) {
    try {
      content = fs.readFileSync(path, 'utf8');
      exists = true;
    } catch (e) {
      exists = false;
    }
  }

  if (!exists) {
    return {
      exists: false,
      path: null,
      hasRequiredSections: false,
      score: 0,
      issues: [`${docType} document not found for feature: ${feature}`],
    };
  }

  // Simple section validation
  const requiredSections = docType === 'plan'
    ? ['Overview', 'Scope', 'Goals']
    : ['Overview', 'Architecture', 'Data Model', 'API', 'Implementation'];

  let foundSections = 0;
  for (const section of requiredSections) {
    if (content.toLowerCase().includes(section.toLowerCase())) {
      foundSections++;
    } else {
      issues.push(`Missing section: ${section}`);
    }
  }

  const score = Math.round((foundSections / requiredSections.length) * 100);

  debugLog('CTOLogic', 'Document evaluation', { feature, docType, score, issues });

  return {
    exists,
    path,
    hasRequiredSections: issues.length === 0,
    score,
    issues,
  };
}

/**
 * Evaluate Check phase results and decide next direction
 * @param {number} matchRate - Match Rate (0-100)
 * @param {number} criticalIssues - Number of critical issues
 * @param {number} qualityScore - Code quality score (0-100)
 * @returns {Object} { decision: 'report'|'iterate'|'redesign', reason, nextAction }
 */
function evaluateCheckResults(matchRate, criticalIssues, qualityScore) {
  let decision;
  let reason;
  let nextAction;

  if (matchRate >= 90 && criticalIssues === 0) {
    decision = 'report';
    reason = `Match rate ${matchRate}% meets threshold, no critical issues`;
    nextAction = '/pdca report';
  } else if (matchRate >= 70) {
    decision = 'iterate';
    reason = criticalIssues > 0
      ? `${criticalIssues} critical issues need resolution`
      : `Match rate ${matchRate}% below 90% threshold`;
    nextAction = '/pdca iterate';
  } else {
    decision = 'redesign';
    reason = `Match rate ${matchRate}% is critically low, redesign recommended`;
    nextAction = '/pdca design';
  }

  debugLog('CTOLogic', 'Check results evaluation', {
    matchRate,
    criticalIssues,
    qualityScore,
    decision,
  });

  return { decision, reason, nextAction };
}

/**
 * Select appropriate agents for a team role
 * @param {string} role - Role name
 * @param {string} phase - PDCA phase
 * @param {string} level - Project level
 * @returns {string[]} Agent names for the role
 */
function selectAgentsForRole(role, phase, level) {
  const { TEAM_STRATEGIES } = require('./strategy');
  const strategy = TEAM_STRATEGIES[level];
  if (!strategy) return [];

  const roleConfig = strategy.roles.find(r => r.name === role);
  if (!roleConfig) return [];

  // Filter agents that are relevant for the given phase
  if (!roleConfig.phases.includes(phase)) return [];

  return roleConfig.agents || [];
}

/**
 * Generate team composition recommendation
 * @param {string} feature - Feature name
 * @param {string} phase - PDCA phase
 * @returns {Object} { level, pattern, teammates: [], reasoning }
 */
function recommendTeamComposition(feature, phase) {
  const levelModule = getLevelModule();
  const level = levelModule.detectLevel ? levelModule.detectLevel() : 'Dynamic';

  const { TEAM_STRATEGIES } = require('./strategy');
  const strategy = TEAM_STRATEGIES[level];

  if (!strategy) {
    return {
      level,
      pattern: 'single',
      teammates: [],
      reasoning: `${level} level does not support team mode`,
    };
  }

  const pattern = strategy.phaseStrategy[phase] || 'single';
  const teammates = strategy.roles
    .filter(role => role.phases.includes(phase))
    .map(role => ({
      name: role.name,
      agents: role.agents,
      description: role.description,
    }));

  const reasoning = teammates.length > 0
    ? `${level} level, ${phase} phase uses ${pattern} pattern with ${teammates.length} roles`
    : `No team roles defined for ${phase} phase at ${level} level`;

  debugLog('CTOLogic', 'Team recommendation', {
    feature,
    phase,
    level,
    pattern,
    teammateCount: teammates.length,
  });

  return {
    level,
    pattern,
    teammates,
    reasoning,
  };
}

module.exports = {
  decidePdcaPhase,
  evaluateDocument,
  evaluateCheckResults,
  selectAgentsForRole,
  recommendTeamComposition,
};
