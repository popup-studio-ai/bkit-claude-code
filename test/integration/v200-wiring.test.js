#!/usr/bin/env node
/**
 * v2.0.0 Module Wiring Integration Test
 * @module test/integration/v200-wiring
 * @version 2.0.0
 *
 * Verifies v2.0.0 modules are properly wired into existing hooks.
 * Reads file contents with fs.readFileSync and checks for require() patterns.
 * 40 TC: VW-001 ~ VW-040
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

function readScript(relativePath) {
  const fullPath = path.join(PROJECT_ROOT, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf8');
}

// ============================================================
// Section 1: session-start.js v2.0.0 requires (VW-001~006)
// ============================================================

const sessionStart = readScript('hooks/session-start.js');

// VW-001: session-start.js requires workflow-map
assert('VW-001',
  sessionStart !== null && /require.*(?:ui\/workflow-map|workflow-map)/.test(sessionStart),
  'session-start.js contains require() for workflow-map'
);

// VW-002: session-start.js requires control-panel
assert('VW-002',
  sessionStart !== null && /require.*(?:ui\/control-panel|control-panel)/.test(sessionStart),
  'session-start.js contains require() for control-panel'
);

// VW-003: session-start.js requires progress-bar
assert('VW-003',
  sessionStart !== null && /require.*(?:ui\/progress-bar|progress-bar)/.test(sessionStart),
  'session-start.js contains require() for progress-bar'
);

// VW-004: session-start.js requires lifecycle for stale detection
assert('VW-004',
  sessionStart !== null && /require.*(?:pdca\/lifecycle|lifecycle)/.test(sessionStart),
  'session-start.js contains require() for lifecycle (stale detection)'
);

// VW-005: session-start.js requires getPdcaStatusFull
assert('VW-005',
  sessionStart !== null && /getPdcaStatusFull/.test(sessionStart),
  'session-start.js references getPdcaStatusFull'
);

// VW-006: session-start.js calls detectStaleFeatures
assert('VW-006',
  sessionStart !== null && /detectStaleFeatures/.test(sessionStart),
  'session-start.js calls detectStaleFeatures from lifecycle'
);

// ============================================================
// Section 2: unified-stop.js v2.0.0 requires (VW-007~012)
// ============================================================

const unifiedStop = readScript('scripts/unified-stop.js');

// VW-007: unified-stop.js requires state-machine
assert('VW-007',
  unifiedStop !== null && /require.*(?:pdca\/state-machine|state-machine)/.test(unifiedStop),
  'unified-stop.js contains require() for state-machine'
);

// VW-008: unified-stop.js requires checkpoint-manager
assert('VW-008',
  unifiedStop !== null && /require.*(?:control\/checkpoint-manager|checkpoint-manager)/.test(unifiedStop),
  'unified-stop.js contains require() for checkpoint-manager'
);

// VW-009: unified-stop.js requires audit-logger
assert('VW-009',
  unifiedStop !== null && /require.*(?:audit\/audit-logger|audit-logger)/.test(unifiedStop),
  'unified-stop.js contains require() for audit-logger'
);

// VW-010: unified-stop.js requires gate-manager (quality gates)
assert('VW-010',
  unifiedStop !== null && /require.*(?:quality\/gate-manager|gate-manager)/.test(unifiedStop),
  'unified-stop.js contains require() for gate-manager (quality gates)'
);

// VW-011: unified-stop.js requires workflow-engine
assert('VW-011',
  unifiedStop !== null && /require.*(?:pdca\/workflow-engine|workflow-engine)/.test(unifiedStop),
  'unified-stop.js contains require() for workflow-engine'
);

// VW-012: unified-stop.js requires trust-engine
assert('VW-012',
  unifiedStop !== null && /require.*(?:control\/trust-engine|trust-engine)/.test(unifiedStop),
  'unified-stop.js contains require() for trust-engine'
);

// ============================================================
// Section 3: pre-write.js v2.0.0 requires (VW-013~018)
// ============================================================

const preWrite = readScript('scripts/pre-write.js');

// VW-013: pre-write.js exists
assert('VW-013',
  preWrite !== null,
  'scripts/pre-write.js exists and is readable'
);

// VW-014: pre-write.js references destructive detection
assert('VW-014',
  preWrite !== null && /(?:destructive|isDestructive|destructive-detector|control\/destructive)/.test(preWrite),
  'pre-write.js references destructive detection'
);

// VW-015: pre-write.js references blast radius
assert('VW-015',
  preWrite !== null && /(?:blast.?radius|blast-radius|blastRadius)/.test(preWrite),
  'pre-write.js references blast radius check'
);

// VW-016: pre-write.js references scope limiter
assert('VW-016',
  preWrite !== null && /(?:scope.?limit|scope-limiter|scopeLimiter)/.test(preWrite),
  'pre-write.js references scope limiter check'
);

// VW-017: pre-write.js references audit logging
assert('VW-017',
  preWrite !== null && /(?:audit|debugLog|writeAuditLog|audit-logger)/.test(preWrite),
  'pre-write.js references audit logging'
);

// VW-018: pre-write.js handles Write|Edit permission decisions
assert('VW-018',
  preWrite !== null && /(?:outputBlock|outputAllow|outputEmpty|permissionDecision)/.test(preWrite),
  'pre-write.js handles permission decisions for Write|Edit'
);

// ============================================================
// Section 4: Agent stop scripts reference state-machine (VW-019~024)
// ============================================================

const gapDetectorStop = readScript('scripts/gap-detector-stop.js');
const iteratorStop = readScript('scripts/iterator-stop.js');
const ctoStop = readScript('scripts/cto-stop.js');
const analysisStop = readScript('scripts/analysis-stop.js');
const qaStop = readScript('scripts/qa-stop.js');

// VW-019: gap-detector-stop.js references PDCA status
assert('VW-019',
  gapDetectorStop !== null && /(?:getPdcaStatusFull|updatePdcaStatus|pdca\/status)/.test(gapDetectorStop),
  'gap-detector-stop.js references PDCA status module'
);

// VW-020: iterator-stop.js references PDCA status
assert('VW-020',
  iteratorStop !== null && /(?:getPdcaStatusFull|updatePdcaStatus|pdca\/status)/.test(iteratorStop),
  'iterator-stop.js references PDCA status module'
);

// VW-021: cto-stop.js references PDCA status
assert('VW-021',
  ctoStop !== null && /(?:getPdcaStatusFull|addPdcaHistory|pdca\/status)/.test(ctoStop),
  'cto-stop.js references PDCA status module'
);

// VW-022: analysis-stop.js references metrics collection
assert('VW-022',
  analysisStop !== null && /(?:metrics-collector|quality\/metrics|collectMetric)/.test(analysisStop),
  'analysis-stop.js references v2.0.0 metrics collection'
);

// VW-023: qa-stop.js references metrics collection
assert('VW-023',
  qaStop !== null && /(?:metrics-collector|quality\/metrics|collectMetric)/.test(qaStop),
  'qa-stop.js references v2.0.0 metrics collection'
);

// VW-024: All 5 agent stop scripts exist
assert('VW-024',
  gapDetectorStop !== null && iteratorStop !== null && ctoStop !== null &&
  analysisStop !== null && qaStop !== null,
  'All 5 agent stop scripts exist and are readable'
);

// ============================================================
// Section 5: hooks.json has all 18 events defined (VW-025~030)
// ============================================================

const hooksJson = readScript('hooks/hooks.json');
let hooksConfig = null;
try { hooksConfig = JSON.parse(hooksJson); } catch (_) {}

// VW-025: hooks.json parses as valid JSON
assert('VW-025',
  hooksConfig !== null && typeof hooksConfig.hooks === 'object',
  'hooks.json parses as valid JSON with hooks object'
);

const expectedEvents = [
  'SessionStart', 'PreToolUse', 'PostToolUse', 'Stop',
  'StopFailure', 'UserPromptSubmit', 'PreCompact', 'PostCompact',
  'TaskCompleted', 'SubagentStart', 'SubagentStop', 'TeammateIdle',
  'SessionEnd', 'PostToolUseFailure', 'InstructionsLoaded',
  'ConfigChange', 'PermissionRequest', 'Notification'
];

// VW-026: hooks.json has all 18 hook events
assert('VW-026',
  hooksConfig !== null && expectedEvents.every(e => e in hooksConfig.hooks),
  'hooks.json defines all 18 hook events'
);

// VW-027: PreToolUse has Write|Edit matcher
assert('VW-027',
  hooksConfig !== null && hooksConfig.hooks.PreToolUse &&
  JSON.stringify(hooksConfig.hooks.PreToolUse).includes('Write|Edit'),
  'hooks.json PreToolUse has Write|Edit matcher'
);

// VW-028: PreToolUse has Bash matcher
assert('VW-028',
  hooksConfig !== null && hooksConfig.hooks.PreToolUse &&
  hooksConfig.hooks.PreToolUse.some(e => e.matcher === 'Bash'),
  'hooks.json PreToolUse has Bash matcher'
);

// VW-029: PostToolUseFailure has Bash|Write|Edit matcher
assert('VW-029',
  hooksConfig !== null && hooksConfig.hooks.PostToolUseFailure &&
  JSON.stringify(hooksConfig.hooks.PostToolUseFailure).includes('Bash|Write|Edit'),
  'hooks.json PostToolUseFailure has Bash|Write|Edit matcher'
);

// VW-030: All hook commands reference node + CLAUDE_PLUGIN_ROOT
assert('VW-030',
  hooksConfig !== null && JSON.stringify(hooksConfig.hooks).includes('${CLAUDE_PLUGIN_ROOT}'),
  'hooks.json commands use ${CLAUDE_PLUGIN_ROOT} variable'
);

// ============================================================
// Section 6: New v2.0.0 hook scripts exist (VW-031~035)
// ============================================================

// VW-031: session-end-handler.js exists
assert('VW-031',
  readScript('scripts/session-end-handler.js') !== null,
  'scripts/session-end-handler.js exists'
);

// VW-032: tool-failure-handler.js exists
assert('VW-032',
  readScript('scripts/tool-failure-handler.js') !== null,
  'scripts/tool-failure-handler.js exists'
);

// VW-033: instructions-loaded-handler.js exists
assert('VW-033',
  readScript('scripts/instructions-loaded-handler.js') !== null,
  'scripts/instructions-loaded-handler.js exists'
);

// VW-034: config-change-handler.js exists
assert('VW-034',
  readScript('scripts/config-change-handler.js') !== null,
  'scripts/config-change-handler.js exists'
);

// VW-035: permission-request-handler.js and notification-handler.js exist
assert('VW-035',
  readScript('scripts/permission-request-handler.js') !== null &&
  readScript('scripts/notification-handler.js') !== null,
  'scripts/permission-request-handler.js and notification-handler.js exist'
);

// ============================================================
// Section 7: bkit.config.json has v2.0.0 sections (VW-036~040)
// ============================================================

const bkitConfig = readScript('bkit.config.json');
let config = null;
try { config = JSON.parse(bkitConfig); } catch (_) {}

// VW-036: bkit.config.json parses as valid JSON
assert('VW-036',
  config !== null && config.version === '2.0.3',
  'bkit.config.json parses and has version 2.0.3'
);

// VW-037: bkit.config.json has automation section
assert('VW-037',
  config !== null && typeof config.automation === 'object' &&
  'defaultLevel' in config.automation && 'trustScoreEnabled' in config.automation,
  'bkit.config.json has automation section with defaultLevel and trustScoreEnabled'
);

// VW-038: bkit.config.json has guardrails section
assert('VW-038',
  config !== null && typeof config.guardrails === 'object' &&
  config.guardrails.destructiveDetection === true &&
  typeof config.guardrails.loopBreaker === 'object',
  'bkit.config.json has guardrails section with destructiveDetection and loopBreaker'
);

// VW-039: bkit.config.json has quality section
assert('VW-039',
  config !== null && typeof config.quality === 'object' &&
  config.quality.gateEnabled === true &&
  typeof config.quality.thresholds === 'object',
  'bkit.config.json has quality section with gateEnabled and thresholds'
);

// VW-040: bkit.config.json guardrails has checkpoint settings
assert('VW-040',
  config !== null && config.guardrails &&
  config.guardrails.checkpointOnPhaseTransition === true &&
  config.guardrails.checkpointOnDestructive === true,
  'bkit.config.json guardrails has checkpointOnPhaseTransition and checkpointOnDestructive'
);

// ============================================================
// Summary
// ============================================================
console.log('\n========================================');
console.log('v2.0.0 Module Wiring Test Results');
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
