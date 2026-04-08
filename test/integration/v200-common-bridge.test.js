#!/usr/bin/env node
/**
 * v2.0.0 Common Bridge Backward Compatibility Test
 * @module test/integration/v200-common-bridge
 * @version 2.0.0
 *
 * Verifies common.js backward compatibility bridge still works after v2.0.0 changes.
 * Tests load, export count, submodule accessibility, and circular dependency safety.
 * 20 TC: CB-001 ~ CB-020
 */

const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

let passed = 0;
let failed = 0;
const results = [];

function assert(id, condition, description) {
  if (condition) {
    passed++;
    results.push({ id, status: 'PASS', description });
  } else {
    failed++;
    results.push({ id, status: 'FAIL', description });
    console.assert(false, `${id}: ${description}`);
  }
}

// ============================================================
// Section 1: common.js loads without error and has >200 exports (CB-001~005)
// ============================================================

let common = null;
let commonLoadError = null;
try {
  common = require(path.join(PROJECT_ROOT, 'lib/common'));
} catch (e) {
  commonLoadError = e;
}

// CB-001: common.js loads without error
assert('CB-001',
  common !== null && commonLoadError === null,
  'lib/common.js loads without error'
);

// CB-002: common.js exports more than 200 functions/values
const exportCount = common ? Object.keys(common).length : 0;
assert('CB-002',
  exportCount > 200,
  `lib/common.js exports >200 functions/values (actual: ${exportCount})`
);

// CB-003: common.js exports are not all undefined
const definedExports = common ? Object.values(common).filter(v => v !== undefined).length : 0;
assert('CB-003',
  definedExports > 200,
  `lib/common.js removed (v2.1.0), was: >200 defined (non-undefined) exports (actual: ${definedExports})`
);

// CB-004: common.js exports include function types
const functionExports = common ? Object.values(common).filter(v => typeof v === 'function').length : 0;
assert('CB-004',
  functionExports > 100,
  `lib/common.js exports >100 functions (actual: ${functionExports})`
);

// CB-005: common.js module.exports is a plain object (not a class)
assert('CB-005',
  common !== null && typeof common === 'object' && !Array.isArray(common),
  'lib/common.js exports a plain object'
);

// ============================================================
// Section 2: Key functions from each submodule accessible via common.js (CB-006~010)
// ============================================================

// CB-006: Core functions accessible - debugLog, getBkitConfig, readStdinSync
assert('CB-006',
  common && typeof common.debugLog === 'function' &&
  typeof common.getBkitConfig === 'function' &&
  typeof common.readStdinSync === 'function',
  'Core functions (debugLog, getBkitConfig, readStdinSync) accessible via common.js'
);

// CB-007: PDCA functions accessible - getPdcaStatusFull, updatePdcaStatus
assert('CB-007',
  common && typeof common.getPdcaStatusFull === 'function' &&
  typeof common.updatePdcaStatus === 'function',
  'PDCA functions (getPdcaStatusFull, updatePdcaStatus) accessible via common.js'
);

// CB-008: Intent functions accessible - detectLanguage, calculateAmbiguityScore
assert('CB-008',
  common && typeof common.detectLanguage === 'function' &&
  typeof common.calculateAmbiguityScore === 'function',
  'Intent functions (detectLanguage, calculateAmbiguityScore) accessible via common.js'
);

// CB-009: Task functions accessible - classifyTaskByLines, getPdcaLevel
assert('CB-009',
  common && typeof common.classifyTaskByLines === 'function' &&
  typeof common.getPdcaLevel === 'function',
  'Task functions (classifyTaskByLines, getPdcaLevel) accessible via common.js'
);

// CB-010: Team functions accessible
assert('CB-010',
  common && (typeof common.startTeamSession === 'function' ||
  typeof common.teamEnabled === 'boolean' ||
  typeof common.getTeamConfig === 'function'),
  'Team functions accessible via common.js'
);

// ============================================================
// Section 3: Direct imports from lib submodules return same functions (CB-011~015)
// ============================================================

let core = null, pdca = null, intent = null, task = null, team = null;
try { core = require(path.join(PROJECT_ROOT, 'lib/core')); } catch (_) {}
try { pdca = require(path.join(PROJECT_ROOT, 'lib/pdca')); } catch (_) {}
try { intent = require(path.join(PROJECT_ROOT, 'lib/intent')); } catch (_) {}
try { task = require(path.join(PROJECT_ROOT, 'lib/task')); } catch (_) {}
try { team = require(path.join(PROJECT_ROOT, 'lib/team')); } catch (_) {}

// CB-011: lib/core/ loads and exports debugLog same as common.js
assert('CB-011',
  core && common && core.debugLog === common.debugLog,
  'lib/core debugLog is identical to common.debugLog'
);

// CB-012: lib/pdca/ loads and exports getPdcaStatusFull same as common.js
assert('CB-012',
  pdca && common && pdca.getPdcaStatusFull === common.getPdcaStatusFull,
  'lib/pdca getPdcaStatusFull is identical to common.getPdcaStatusFull'
);

// CB-013: lib/intent/ loads and exports detectLanguage same as common.js
assert('CB-013',
  intent && common && intent.detectLanguage === common.detectLanguage,
  'lib/intent detectLanguage is identical to common.detectLanguage'
);

// CB-014: lib/task/ loads and exports classifyTaskByLines same as common.js
assert('CB-014',
  task && common && task.classifyTaskByLines === common.classifyTaskByLines,
  'lib/task classifyTaskByLines is identical to common.classifyTaskByLines'
);

// CB-015: lib/team/ loads without error
assert('CB-015',
  team !== null,
  'lib/team loads without error'
);

// ============================================================
// Section 4: No circular dependency issues (CB-016~020)
// ============================================================

// CB-016: Re-requiring common.js returns cached module (no infinite loop)
let commonSecond = null;
let reloadError = null;
try {
  // Clear require cache for common.js to test fresh load
  const commonPath = require.resolve(path.join(PROJECT_ROOT, 'lib/common'));
  commonSecond = require(commonPath);
} catch (e) {
  reloadError = e;
}
assert('CB-016',
  commonSecond !== null && reloadError === null,
  'Re-requiring common.js returns cached module without circular dependency error'
);

// CB-017: lib/core loads independently without circular dependency
let coreIndependent = null;
try {
  coreIndependent = require(path.join(PROJECT_ROOT, 'lib/core'));
} catch (e) {}
assert('CB-017',
  coreIndependent !== null && Object.keys(coreIndependent).length > 0,
  'lib/core loads independently without circular dependency'
);

// CB-018: lib/pdca loads independently without circular dependency
let pdcaIndependent = null;
try {
  pdcaIndependent = require(path.join(PROJECT_ROOT, 'lib/pdca'));
} catch (e) {}
assert('CB-018',
  pdcaIndependent !== null && Object.keys(pdcaIndependent).length > 0,
  'lib/pdca loads independently without circular dependency'
);

// CB-019: lib/ui loads independently and exports all 5 render functions
let ui = null;
try { ui = require(path.join(PROJECT_ROOT, 'lib/ui')); } catch (_) {}
assert('CB-019',
  ui !== null &&
  typeof ui.renderPdcaProgressBar === 'function' &&
  typeof ui.renderWorkflowMap === 'function' &&
  typeof ui.renderControlPanel === 'function' &&
  typeof ui.renderImpactView === 'function' &&
  typeof ui.renderAgentPanel === 'function',
  'lib/ui loads and exports all 5 render functions'
);

// CB-020: All 6 submodule index.js files load without error
const submodules = ['core', 'pdca', 'intent', 'task', 'team', 'ui'];
const allLoaded = submodules.every(m => {
  try {
    require(path.join(PROJECT_ROOT, 'lib', m));
    return true;
  } catch (_) {
    return false;
  }
});
assert('CB-020',
  allLoaded,
  'All 6 submodule index.js files (core, pdca, intent, task, team, ui) load without error'
);

// ============================================================
// Summary
// ============================================================
console.log('\n========================================');
console.log('v2.0.0 Common Bridge Compatibility Test Results');
console.log('========================================');
console.log(`Total: ${passed + failed} | PASS: ${passed} | FAIL: ${failed}`);
console.log(`Pass Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
console.log('----------------------------------------');
results.forEach(r => {
  console.log(`  ${r.status === 'PASS' ? '[PASS]' : '[FAIL]'} ${r.id}: ${r.description}`);
});
console.log('========================================\n');

module.exports = { passed, failed, total: passed + failed, results };
if (failed > 0) process.exit(1);
