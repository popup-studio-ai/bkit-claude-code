#!/usr/bin/env node
/**
 * Export Completeness Architecture Test
 * @module test/architecture/export-completeness
 * @version 2.0.0
 *
 * Verifies:
 * - core/index.js exports constants, errors, stateStore, hookIo
 * - pdca/index.js exports state-machine functions
 * - All 42 new modules have module.exports
 * 15 TC: EC-001 ~ EC-015
 */

const fs = require('fs');
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
// Section 1: core/index.js exports constants, errors, stateStore, hookIo (EC-001~005)
// ============================================================

const core = require(path.join(PROJECT_ROOT, 'lib/core'));

// EC-001: core/index.js exports constants module
assert('EC-001',
  core.constants != null && typeof core.constants === 'object',
  'core/index.js exports constants module'
);

// EC-002: core/index.js exports error handling
assert('EC-002',
  core.BkitError != null && core.ERROR_CODES != null && core.SEVERITY != null,
  'core/index.js exports BkitError, ERROR_CODES, SEVERITY'
);

// EC-003: core/index.js exports stateStore
assert('EC-003',
  core.stateStore != null && typeof core.stateStore.read === 'function' && typeof core.stateStore.write === 'function',
  'core/index.js exports stateStore with read/write methods'
);

// EC-004: core/index.js exports hookIo
assert('EC-004',
  core.hookIo != null && typeof core.hookIo === 'object',
  'core/index.js exports hookIo module'
);

// EC-005: core/index.js exports STATE_PATHS
assert('EC-005',
  core.STATE_PATHS != null && typeof core.STATE_PATHS.root === 'function',
  'core/index.js exports STATE_PATHS with root() function'
);

// ============================================================
// Section 2: pdca/index.js exports state-machine functions (EC-006~010)
// ============================================================

const pdca = require(path.join(PROJECT_ROOT, 'lib/pdca'));

// EC-006: pdca/index.js exports SM_TRANSITIONS
assert('EC-006',
  Array.isArray(pdca.SM_TRANSITIONS) && pdca.SM_TRANSITIONS.length > 0,
  'pdca/index.js exports SM_TRANSITIONS array'
);

// EC-007: pdca/index.js exports SM_STATES and SM_EVENTS
assert('EC-007',
  Array.isArray(pdca.SM_STATES) && pdca.SM_STATES.length >= 10 &&
  Array.isArray(pdca.SM_EVENTS) && pdca.SM_EVENTS.length >= 15,
  'pdca/index.js exports SM_STATES (10+) and SM_EVENTS (15+)'
);

// EC-008: pdca/index.js exports transition functions
assert('EC-008',
  typeof pdca.smTransition === 'function' &&
  typeof pdca.smCanTransition === 'function' &&
  typeof pdca.smFindTransition === 'function',
  'pdca/index.js exports smTransition, smCanTransition, smFindTransition'
);

// EC-009: pdca/index.js exports context management
assert('EC-009',
  typeof pdca.smCreateContext === 'function' &&
  typeof pdca.smLoadContext === 'function' &&
  typeof pdca.smSyncContext === 'function',
  'pdca/index.js exports smCreateContext, smLoadContext, smSyncContext'
);

// EC-010: pdca/index.js exports feature manager
assert('EC-010',
  typeof pdca.fmCanStartFeature === 'function' &&
  typeof pdca.fmRegisterFeature === 'function',
  'pdca/index.js exports feature manager functions'
);

// ============================================================
// Section 3: All new modules have module.exports (EC-011~015)
// ============================================================

const ALL_NEW_MODULES = [
  // Core (12) — v2.1.0: backup-scheduler removed (dead code)
  'lib/core/cache.js', 'lib/core/config.js', 'lib/core/debug.js',
  'lib/core/file.js', 'lib/core/io.js', 'lib/core/platform.js',
  'lib/core/constants.js', 'lib/core/errors.js', 'lib/core/state-store.js',
  'lib/core/hook-io.js', 'lib/core/index.js', 'lib/core/paths.js',
  // PDCA (14) — v2.1.0: commit-context, decision-record, deploy-gate, do-detector removed
  'lib/pdca/automation.js', 'lib/pdca/executive-summary.js', 'lib/pdca/level.js',
  'lib/pdca/phase.js', 'lib/pdca/template-validator.js', 'lib/pdca/tier.js',
  'lib/pdca/circuit-breaker.js', 'lib/pdca/state-machine.js',
  'lib/pdca/resume.js', 'lib/pdca/lifecycle.js', 'lib/pdca/status.js',
  'lib/pdca/workflow-parser.js', 'lib/pdca/workflow-engine.js', 'lib/pdca/full-auto-do.js',
  'lib/pdca/feature-manager.js', 'lib/pdca/batch-orchestrator.js', 'lib/pdca/index.js',
  // Control (7)
  'lib/control/destructive-detector.js', 'lib/control/checkpoint-manager.js',
  'lib/control/automation-controller.js', 'lib/control/loop-breaker.js',
  'lib/control/blast-radius.js', 'lib/control/trust-engine.js',
  'lib/control/scope-limiter.js',
  // Audit (3)
  'lib/audit/audit-logger.js', 'lib/audit/decision-tracer.js',
  'lib/audit/explanation-generator.js',
  // Quality (3)
  'lib/quality/gate-manager.js', 'lib/quality/metrics-collector.js',
  'lib/quality/regression-guard.js',
];

// EC-011: All new modules exist
let existCount = 0;
for (const mod of ALL_NEW_MODULES) {
  if (fs.existsSync(path.join(PROJECT_ROOT, mod))) existCount++;
}
assert('EC-011',
  existCount === ALL_NEW_MODULES.length,
  `All ${ALL_NEW_MODULES.length} new modules exist (${existCount}/${ALL_NEW_MODULES.length})`
);

// EC-012: All new modules have module.exports
let exportCount = 0;
for (const mod of ALL_NEW_MODULES) {
  const fullPath = path.join(PROJECT_ROOT, mod);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (/module\.exports\s*=/.test(content)) exportCount++;
  }
}
assert('EC-012',
  exportCount === ALL_NEW_MODULES.length,
  `All ${ALL_NEW_MODULES.length} modules have module.exports (${exportCount}/${ALL_NEW_MODULES.length})`
);

// EC-013: All core modules are loadable
let coreLoadable = 0;
const CORE_MODULES = ALL_NEW_MODULES.filter(m => m.startsWith('lib/core/'));
for (const mod of CORE_MODULES) {
  try {
    require(path.join(PROJECT_ROOT, mod));
    coreLoadable++;
  } catch (_) {}
}
assert('EC-013',
  coreLoadable === CORE_MODULES.length,
  `All ${CORE_MODULES.length} core modules are loadable (${coreLoadable}/${CORE_MODULES.length})`
);

// EC-014: Control modules are loadable
let controlLoadable = 0;
const CONTROL_MODULES = ALL_NEW_MODULES.filter(m => m.startsWith('lib/control/'));
for (const mod of CONTROL_MODULES) {
  try {
    require(path.join(PROJECT_ROOT, mod));
    controlLoadable++;
  } catch (_) {}
}
assert('EC-014',
  controlLoadable === CONTROL_MODULES.length,
  `All ${CONTROL_MODULES.length} control modules are loadable (${controlLoadable}/${CONTROL_MODULES.length})`
);

// EC-015: Quality + Audit modules are loadable
let qaLoadable = 0;
const QA_MODULES = ALL_NEW_MODULES.filter(m =>
  m.startsWith('lib/quality/') || m.startsWith('lib/audit/')
);
for (const mod of QA_MODULES) {
  try {
    require(path.join(PROJECT_ROOT, mod));
    qaLoadable++;
  } catch (_) {}
}
assert('EC-015',
  qaLoadable === QA_MODULES.length,
  `All ${QA_MODULES.length} quality+audit modules are loadable (${qaLoadable}/${QA_MODULES.length})`
);

// ============================================================
// Summary
// ============================================================
console.log('\n========================================');
console.log('Export Completeness Architecture Test Results');
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
