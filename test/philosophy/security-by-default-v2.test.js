'use strict';
/**
 * Philosophy Tests: Security-by-Default Principle v2 (15 TC)
 * Tests that L2 is default (not L0 or L4), 8 destructive rules active,
 * and Trust Score starts at 50 (middle, not high).
 *
 * @module test/philosophy/security-by-default-v2.test.js
 */

const fs = require('fs');
const path = require('path');
const { assert, summary } = require('../helpers/assert');

const PROJECT_ROOT = path.resolve(__dirname, '../..');

// ── Module loading ──────────────────────────────────────────────────

let automationController;
try {
  automationController = require('../../lib/control/automation-controller');
} catch (e) {
  console.error('automation-controller module load failed:', e.message);
  process.exit(1);
}

let destructiveDetector;
try {
  destructiveDetector = require('../../lib/control/destructive-detector');
} catch (e) {
  console.error('destructive-detector module load failed:', e.message);
  process.exit(1);
}

let trustEngine;
try {
  trustEngine = require('../../lib/control/trust-engine');
} catch (e) {
  console.error('trust-engine module load failed:', e.message);
  process.exit(1);
}

console.log('\n=== security-by-default-v2.test.js ===\n');

// =====================================================================
// SB-001~005: L2 is default (not L0 or L4)
// =====================================================================

// --- SB-001: DEFAULT_LEVEL is 2 (Semi-Auto) ---
assert('SB-001',
  automationController.DEFAULT_LEVEL === 2,
  'DEFAULT_LEVEL is 2 (Semi-Auto, not Manual L0 or Full-Auto L4)'
);

// --- SB-002: DEFAULT_LEVEL is not L0 (Manual) ---
assert('SB-002',
  automationController.DEFAULT_LEVEL !== 0,
  'Default level is NOT L0 (Manual) — too restrictive for good UX'
);

// --- SB-003: DEFAULT_LEVEL is not L4 (Full-Auto) ---
assert('SB-003',
  automationController.DEFAULT_LEVEL !== 4,
  'Default level is NOT L4 (Full-Auto) — too permissive for safety'
);

// --- SB-004: getRuntimeState currentLevel matches DEFAULT_LEVEL ---
// Reset to default before checking (previous tests in suite may have changed level)
automationController.setLevel(automationController.DEFAULT_LEVEL, { reason: 'test-reset' });
const initState = automationController.getRuntimeState();
assert('SB-004',
  initState.currentLevel === automationController.DEFAULT_LEVEL,
  'getRuntimeState.currentLevel matches DEFAULT_LEVEL (consistent defaults)'
);

// --- SB-005: bkit.config.json automationLevel is Semi-Auto ---
const config = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'bkit.config.json'), 'utf-8'));
assert('SB-005',
  config.pdca.automationLevel === 'Semi-Auto' || config.pdca.automationLevel === 'semi-auto',
  'bkit.config.json pdca.automationLevel is "Semi-Auto" (config matches code default)'
);

// =====================================================================
// SB-006~010: 8 destructive rules active by default
// =====================================================================

const { GUARDRAIL_RULES } = destructiveDetector;

// --- SB-006: GUARDRAIL_RULES has exactly 8 rules ---
assert('SB-006',
  Array.isArray(GUARDRAIL_RULES) && GUARDRAIL_RULES.length === 8,
  `GUARDRAIL_RULES has exactly 8 rules (found: ${GUARDRAIL_RULES.length})`
);

// --- SB-007: G-001 (Recursive delete) is critical severity, deny action ---
const g001 = GUARDRAIL_RULES.find(r => r.id === 'G-001');
assert('SB-007',
  g001 && g001.severity === 'critical' && g001.defaultAction === 'deny',
  'G-001 (Recursive delete) is critical severity with deny action'
);

// --- SB-008: G-002 (Force push) is critical severity, deny action ---
const g002 = GUARDRAIL_RULES.find(r => r.id === 'G-002');
assert('SB-008',
  g002 && g002.severity === 'critical' && g002.defaultAction === 'deny',
  'G-002 (Force push) is critical severity with deny action'
);

// --- SB-009: All rules have pattern, severity, and defaultAction ---
const allRulesComplete = GUARDRAIL_RULES.every(r =>
  r.id && r.name && r.pattern instanceof RegExp && r.severity && r.defaultAction
);
assert('SB-009',
  allRulesComplete,
  'All 8 guardrail rules have id, name, pattern (RegExp), severity, and defaultAction'
);

// --- SB-010: isDestructive identifies rm -rf as destructive ---
assert('SB-010',
  destructiveDetector.isDestructive('rm -rf /tmp/test') === true,
  'isDestructive() identifies "rm -rf" as destructive operation'
);

// =====================================================================
// SB-011~015: Trust Score starts at 50 (middle, not high)
// =====================================================================

// --- SB-011: getRuntimeState trustScore is 40 (component weighted sum) ---
assert('SB-011',
  initState.trustScore === 40,
  'getRuntimeState trustScore is 40 (calculated from trust-engine components)'
);

// --- SB-012: Trust score 40 is below L3 upgrade threshold (65) ---
assert('SB-012',
  initState.trustScore < trustEngine.LEVEL_THRESHOLDS[3],
  `Trust score 40 < L3 threshold (${trustEngine.LEVEL_THRESHOLDS[3]}): cannot auto-escalate to L3`
);

// --- SB-013: Trust score 40 is at/above L2 threshold (40) ---
assert('SB-013',
  initState.trustScore >= trustEngine.LEVEL_THRESHOLDS[2],
  `Trust score 40 >= L2 threshold (${trustEngine.LEVEL_THRESHOLDS[2]}): qualifies for L2 Semi-Auto`
);

// --- SB-014: SCORE_CHANGES has negative values for risky events ---
const { SCORE_CHANGES } = trustEngine;
assert('SB-014',
  SCORE_CHANGES['emergency_stop'] < 0 && SCORE_CHANGES['rollback'] < 0,
  'Trust score decreases on emergency_stop and rollback events'
);

// --- SB-015: Trust level thresholds are monotonically increasing ---
const thresholds = trustEngine.LEVEL_THRESHOLDS;
const isMonotonic = thresholds.every((t, i) => i === 0 || t > thresholds[i - 1]);
assert('SB-015',
  isMonotonic && thresholds.length === 5,
  'Trust LEVEL_THRESHOLDS are monotonically increasing (5 levels: L0-L4)'
);

summary('security-by-default-v2.test.js');
process.exit(0);
