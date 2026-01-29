/**
 * Level Detection Module
 * @module lib/pdca/level
 * @version 1.4.7
 */

const fs = require('fs');
const path = require('path');

// Lazy require to avoid circular dependency
let _core = null;
function getCore() {
  if (!_core) {
    _core = require('../core');
  }
  return _core;
}

/**
 * Level-Phase map for each project level
 * Defines which phases are required for each level
 */
const LEVEL_PHASE_MAP = {
  Starter: {
    required: ['plan', 'do', 'check'],
    optional: ['design'],
    skip: ['phase-1', 'phase-2', 'phase-4', 'phase-7', 'phase-9']
  },
  Dynamic: {
    required: ['plan', 'design', 'do', 'check', 'report'],
    optional: ['phase-3', 'phase-5', 'phase-6'],
    skip: ['phase-9']
  },
  Enterprise: {
    required: ['plan', 'design', 'do', 'check', 'report',
               'phase-1', 'phase-2', 'phase-3', 'phase-4',
               'phase-5', 'phase-6', 'phase-7', 'phase-8', 'phase-9'],
    optional: [],
    skip: []
  }
};

/**
 * Detect project level based on markers
 * @returns {'Starter' | 'Dynamic' | 'Enterprise'}
 */
function detectLevel() {
  const { PROJECT_DIR, getConfig, debugLog } = getCore();

  // Check environment variable override
  const envLevel = process.env.BKIT_LEVEL;
  if (envLevel && ['Starter', 'Dynamic', 'Enterprise'].includes(envLevel)) {
    debugLog('level', 'Level from environment', { level: envLevel });
    return envLevel;
  }

  // Check config override
  const configLevel = getConfig('level');
  if (configLevel && ['Starter', 'Dynamic', 'Enterprise'].includes(configLevel)) {
    debugLog('level', 'Level from config', { level: configLevel });
    return configLevel;
  }

  // Enterprise markers
  const enterpriseMarkers = [
    'kubernetes', 'k8s', 'terraform', 'microservices',
    'docker-compose.yml', 'helm', 'argocd'
  ];

  // Dynamic markers
  const dynamicMarkers = [
    'package.json', 'requirements.txt', 'go.mod', 'Cargo.toml',
    'pom.xml', 'build.gradle', 'composer.json', 'Gemfile'
  ];

  try {
    const files = fs.readdirSync(PROJECT_DIR);

    // Check for Enterprise markers
    for (const marker of enterpriseMarkers) {
      if (files.some(f => f.toLowerCase().includes(marker))) {
        debugLog('level', 'Detected Enterprise level', { marker });
        return 'Enterprise';
      }
    }

    // Check for Dynamic markers
    for (const marker of dynamicMarkers) {
      if (files.includes(marker)) {
        debugLog('level', 'Detected Dynamic level', { marker });
        return 'Dynamic';
      }
    }
  } catch (e) {
    // Fallback on error
  }

  // Default to Starter
  debugLog('level', 'Defaulting to Starter level');
  return 'Starter';
}

/**
 * Check if phase can be skipped for level
 * @param {string} level - Project level
 * @param {string} phase - Phase name
 * @returns {boolean}
 */
function canSkipPhase(level, phase) {
  const levelMap = LEVEL_PHASE_MAP[level];
  if (!levelMap) return false;

  return levelMap.skip.includes(phase) || levelMap.optional.includes(phase);
}

/**
 * Get required phases for level
 * @param {string} level - Project level
 * @returns {string[]}
 */
function getRequiredPhases(level) {
  const levelMap = LEVEL_PHASE_MAP[level];
  return levelMap ? levelMap.required : [];
}

/**
 * Get next phase for level
 * @param {string} currentPhase - Current phase
 * @param {string} level - Project level
 * @returns {string|null}
 */
function getNextPhaseForLevel(currentPhase, level) {
  const phaseOrder = ['plan', 'design', 'do', 'check', 'act', 'report'];
  const required = getRequiredPhases(level);

  const currentIndex = phaseOrder.indexOf(currentPhase);
  if (currentIndex === -1) return null;

  for (let i = currentIndex + 1; i < phaseOrder.length; i++) {
    const nextPhase = phaseOrder[i];
    if (required.includes(nextPhase)) {
      return nextPhase;
    }
  }

  return null;
}

/**
 * Check if phase is applicable for level
 * @param {string} phase - Phase name
 * @param {string} level - Project level
 * @returns {boolean}
 */
function isPhaseApplicable(phase, level) {
  const levelMap = LEVEL_PHASE_MAP[level];
  if (!levelMap) return true;

  return levelMap.required.includes(phase) || levelMap.optional.includes(phase);
}

/**
 * Get level-specific phase guide
 * @param {string} level - Project level
 * @returns {Object}
 */
function getLevelPhaseGuide(level) {
  const guides = {
    Starter: {
      description: 'Simple static website or basic project',
      phases: 'Plan → Do → Check',
      tips: 'Focus on getting things done. Skip heavy documentation.'
    },
    Dynamic: {
      description: 'Fullstack application with backend',
      phases: 'Plan → Design → Do → Check → Report',
      tips: 'Design document helps maintain consistency. Consider API documentation.'
    },
    Enterprise: {
      description: 'Complex microservices or enterprise system',
      phases: 'Full 9-phase pipeline with all documentation',
      tips: 'Follow all phases. Use strict conventions and thorough testing.'
    }
  };

  return guides[level] || guides.Dynamic;
}

module.exports = {
  LEVEL_PHASE_MAP,
  detectLevel,
  canSkipPhase,
  getRequiredPhases,
  getNextPhaseForLevel,
  isPhaseApplicable,
  getLevelPhaseGuide,
};
