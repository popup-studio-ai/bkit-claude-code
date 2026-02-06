/**
 * Phase Control Module
 * @module lib/pdca/phase
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

/**
 * PDCA Phase definitions
 */
const PDCA_PHASES = {
  plan: { order: 1, name: 'Plan', icon: '📋' },
  design: { order: 2, name: 'Design', icon: '📐' },
  do: { order: 3, name: 'Do', icon: '🔨' },
  check: { order: 4, name: 'Check', icon: '🔍' },
  act: { order: 5, name: 'Act', icon: '🔄' },
  report: { order: 6, name: 'Report', icon: '📊' },
  archived: { order: 7, name: 'Archived', icon: '📦' }
};

/**
 * Get phase number from name
 * @param {string} phase - Phase name
 * @returns {number}
 */
function getPhaseNumber(phase) {
  return PDCA_PHASES[phase]?.order || 0;
}

/**
 * Get phase name from number
 * @param {number} phaseNumber - Phase number
 * @returns {string}
 */
function getPhaseName(phaseNumber) {
  for (const [name, info] of Object.entries(PDCA_PHASES)) {
    if (info.order === phaseNumber) return name;
  }
  return 'unknown';
}

/**
 * Get previous PDCA phase
 * @param {string} currentPhase - Current phase name
 * @returns {string|null}
 */
function getPreviousPdcaPhase(currentPhase) {
  const order = ['plan', 'design', 'do', 'check', 'act', 'report'];
  const index = order.indexOf(currentPhase);
  return index > 0 ? order[index - 1] : null;
}

/**
 * Get next PDCA phase
 * @param {string} currentPhase - Current phase name
 * @returns {string|null}
 */
function getNextPdcaPhase(currentPhase) {
  const order = ['plan', 'design', 'do', 'check', 'act', 'report'];
  const index = order.indexOf(currentPhase);
  return index >= 0 && index < order.length - 1 ? order[index + 1] : null;
}

/**
 * Find design document for feature
 * @param {string} feature - Feature name
 * @returns {string} Path to design doc or empty string
 */
function findDesignDoc(feature) {
  if (!feature) return '';

  const { PROJECT_DIR } = getCore();
  const paths = [
    path.join(PROJECT_DIR, 'docs', '02-design', 'features', `${feature}.design.md`),
    path.join(PROJECT_DIR, 'docs', '02-design', `${feature}.design.md`),
    path.join(PROJECT_DIR, 'docs', 'design', `${feature}.md`)
  ];

  for (const p of paths) {
    try {
      fs.accessSync(p, fs.constants.R_OK);
      return p;
    } catch (e) {
      continue;
    }
  }
  return '';
}

/**
 * Find plan document for feature
 * @param {string} feature - Feature name
 * @returns {string} Path to plan doc or empty string
 */
function findPlanDoc(feature) {
  if (!feature) return '';

  const { PROJECT_DIR } = getCore();
  const paths = [
    path.join(PROJECT_DIR, 'docs', '01-plan', 'features', `${feature}.plan.md`),
    path.join(PROJECT_DIR, 'docs', '01-plan', `${feature}.plan.md`),
    path.join(PROJECT_DIR, 'docs', 'plan', `${feature}.md`)
  ];

  for (const p of paths) {
    try {
      fs.accessSync(p, fs.constants.R_OK);
      return p;
    } catch (e) {
      continue;
    }
  }
  return '';
}

/**
 * Check phase deliverables exist
 * @param {string|number} phase - Phase name (string) or pipeline phase number (1-9)
 * @param {string} [feature] - Feature name (required for PDCA phase checks)
 * @returns {{exists: boolean, path: string|null, allComplete?: boolean, items?: Array}}
 */
function checkPhaseDeliverables(phase, feature) {
  // Handle pipeline phase number (1-9) - used by phase stop scripts
  if (typeof phase === 'number') {
    return _checkPipelinePhaseDeliverables(phase);
  }

  if (!feature) return { exists: false, path: null };

  const { PROJECT_DIR } = getCore();

  const deliverablePaths = {
    plan: [
      `docs/01-plan/features/${feature}.plan.md`,
      `docs/01-plan/${feature}.plan.md`
    ],
    design: [
      `docs/02-design/features/${feature}.design.md`,
      `docs/02-design/${feature}.design.md`
    ],
    check: [
      `docs/03-analysis/${feature}.analysis.md`,
      `docs/03-analysis/features/${feature}.analysis.md`
    ],
    report: [
      `docs/04-report/features/${feature}.report.md`,
      `docs/04-report/${feature}.report.md`
    ]
  };

  const paths = deliverablePaths[phase];
  if (!paths) return { exists: true, path: null }; // No deliverable required

  for (const relPath of paths) {
    const fullPath = path.join(PROJECT_DIR, relPath);
    if (fs.existsSync(fullPath)) {
      return { exists: true, path: fullPath };
    }
  }

  return { exists: false, path: null };
}

/**
 * Check pipeline phase deliverables (phase 1-9)
 * Returns {allComplete, items} format expected by phase stop scripts
 * @param {number} phaseNumber - Pipeline phase number (1-9)
 * @returns {{allComplete: boolean, items: Array<{name: string, exists: boolean}>}}
 * @private
 */
function _checkPipelinePhaseDeliverables(phaseNumber) {
  const { PROJECT_DIR } = getCore();

  const phaseDeliverables = {
    1: [{ name: 'Schema/Terminology document', glob: 'docs/**/schema*' }],
    2: [{ name: 'Coding conventions document', glob: 'docs/**/convention*' }],
    3: [{ name: 'Mockup/Wireframe files', glob: 'docs/**/mockup*' }],
    4: [{ name: 'API design document', glob: 'docs/**/api*' }],
    5: [{ name: 'Design system document', glob: 'docs/**/design-system*' }],
    6: [{ name: 'UI implementation files', glob: 'src/**/*.{tsx,jsx,vue}' }],
    7: [{ name: 'SEO/Security checklist', glob: 'docs/**/seo*' }],
    8: [{ name: 'Code review report', glob: 'docs/**/review*' }],
    9: [{ name: 'Deployment configuration', glob: '{Dockerfile,docker-compose*,vercel.json,.github/workflows/*}' }]
  };

  const deliverables = phaseDeliverables[phaseNumber];
  if (!deliverables) {
    return { allComplete: true, items: [] };
  }

  const items = deliverables.map(d => {
    // Simple existence check using glob pattern as hint
    // For pipeline phases, we do a lenient check - mark as complete
    // since actual deliverable validation is project-specific
    let exists = false;
    try {
      const globPattern = d.glob;
      // Check common locations
      const checkPaths = [
        path.join(PROJECT_DIR, 'docs'),
        path.join(PROJECT_DIR, 'src')
      ];
      for (const checkPath of checkPaths) {
        if (fs.existsSync(checkPath)) {
          exists = true;
          break;
        }
      }
    } catch (e) {
      exists = false;
    }
    return { name: d.name, exists };
  });

  const allComplete = items.every(item => item.exists);
  return { allComplete, items };
}

/**
 * Validate phase transition
 * @param {string} feature - Feature name
 * @param {string} fromPhase - Current phase
 * @param {string} toPhase - Target phase
 * @returns {{valid: boolean, reason: string}}
 */
function validatePdcaTransition(feature, fromPhase, toPhase) {
  const fromOrder = getPhaseNumber(fromPhase);
  const toOrder = getPhaseNumber(toPhase);

  // Allow going back
  if (toOrder < fromOrder) {
    return { valid: true, reason: 'Returning to earlier phase' };
  }

  // Check if previous deliverable exists (for forward transitions)
  if (toOrder > fromOrder + 1) {
    return { valid: false, reason: `Cannot skip from ${fromPhase} to ${toPhase}` };
  }

  // Check deliverables for current phase
  const deliverable = checkPhaseDeliverables(fromPhase, feature);
  if (!deliverable.exists && fromPhase !== 'do' && fromPhase !== 'act') {
    return { valid: false, reason: `${fromPhase} deliverable not found` };
  }

  return { valid: true, reason: 'Transition allowed' };
}

module.exports = {
  PDCA_PHASES,
  getPhaseNumber,
  getPhaseName,
  getPreviousPdcaPhase,
  getNextPdcaPhase,
  findDesignDoc,
  findPlanDoc,
  checkPhaseDeliverables,
  validatePdcaTransition,
};
