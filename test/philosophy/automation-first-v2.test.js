'use strict';
/**
 * Philosophy Tests: Automation First Principle v2 (25 TC)
 * Tests that bkit state machine auto-transitions, semi-auto defaults,
 * gate configs, quality gates, and YAML workflows define auto-advance rules.
 *
 * @module test/philosophy/automation-first-v2.test.js
 */

const fs = require('fs');
const path = require('path');
const { assert, assertNoThrow, summary } = require('../helpers/assert');

const PROJECT_ROOT = path.resolve(__dirname, '../..');

// ── Module loading ──────────────────────────────────────────────────

let stateMachine;
try {
  stateMachine = require('../../lib/pdca/state-machine');
} catch (e) {
  console.error('state-machine module load failed:', e.message);
  process.exit(1);
}

let gateManager;
try {
  gateManager = require('../../lib/quality/gate-manager');
} catch (e) {
  console.error('gate-manager module load failed:', e.message);
  process.exit(1);
}

let workflowParser;
try {
  workflowParser = require('../../lib/pdca/workflow-parser');
} catch (e) {
  console.error('workflow-parser module load failed:', e.message);
  process.exit(1);
}

let automationController;
try {
  automationController = require('../../lib/control/automation-controller');
} catch (e) {
  console.error('automation-controller module load failed:', e.message);
  process.exit(1);
}

console.log('\n=== automation-first-v2.test.js ===\n');

// =====================================================================
// AF-001~005: State machine has auto transitions for pm->plan, plan->design
// =====================================================================

const { TRANSITIONS, STATES, EVENTS } = stateMachine;

// --- AF-001: pm -> plan transition exists (PM_DONE event) ---
const pmToPlan = TRANSITIONS.find(t => t.from === 'pm' && t.event === 'PM_DONE' && t.to === 'plan');
assert('AF-001',
  pmToPlan !== undefined,
  'State machine has pm -> plan transition via PM_DONE event'
);

// --- AF-002: plan -> design transition exists (PLAN_DONE event) ---
const planToDesign = TRANSITIONS.find(t => t.from === 'plan' && t.event === 'PLAN_DONE' && t.to === 'design');
assert('AF-002',
  planToDesign !== undefined,
  'State machine has plan -> design transition via PLAN_DONE event'
);

// --- AF-003: design -> do transition exists (DESIGN_DONE event) ---
const designToDo = TRANSITIONS.find(t => t.from === 'design' && t.event === 'DESIGN_DONE' && t.to === 'do');
assert('AF-003',
  designToDo !== undefined,
  'State machine has design -> do transition via DESIGN_DONE event'
);

// --- AF-004: do -> check transition exists (DO_COMPLETE event) ---
const doToCheck = TRANSITIONS.find(t => t.from === 'do' && t.event === 'DO_COMPLETE' && t.to === 'check');
assert('AF-004',
  doToCheck !== undefined,
  'State machine has do -> check transition via DO_COMPLETE event'
);

// --- AF-005: check -> report transition exists (MATCH_PASS event) ---
const checkToReport = TRANSITIONS.find(t => t.from === 'check' && t.event === 'MATCH_PASS' && t.to === 'report');
assert('AF-005',
  checkToReport !== undefined,
  'State machine has check -> report transition via MATCH_PASS event'
);

// =====================================================================
// AF-006~010: Semi-Auto (L2) is the default level
// =====================================================================

// --- AF-006: DEFAULT_LEVEL is exported and equals 2 (Semi-Auto) ---
assert('AF-006',
  automationController.DEFAULT_LEVEL === 2,
  'DEFAULT_LEVEL equals 2 (Semi-Auto)'
);

// --- AF-007: bkit.config.json automationLevel matches Semi-Auto ---
const config = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'bkit.config.json'), 'utf-8'));
assert('AF-007',
  config.pdca.automationLevel === 'Semi-Auto' || config.pdca.automationLevel === 'semi-auto',
  'bkit.config.json pdca.automationLevel is Semi-Auto'
);

// --- AF-008: getRuntimeState uses DEFAULT_LEVEL as currentLevel ---
// Reset to default before checking (previous tests in suite may have changed level)
automationController.setLevel(automationController.DEFAULT_LEVEL, { reason: 'test-reset' });
const initState = automationController.getRuntimeState();
assert('AF-008',
  initState.currentLevel === 2,
  'getRuntimeState sets currentLevel to 2 (Semi-Auto)'
);

// --- AF-009: initState trustScore starts at 40 (component weighted sum) ---
assert('AF-009',
  initState.trustScore === 40,
  'getRuntimeState trustScore starts at 40 (calculated from trust-engine components)'
);

// --- AF-010: initState emergencyStop is false by default ---
assert('AF-010',
  initState.emergencyStop === false,
  'getRuntimeState emergencyStop is false (automation not blocked by default)'
);

// =====================================================================
// AF-011~015: Gate config exists for each phase transition
// =====================================================================

const { GATE_DEFINITIONS } = gateManager;
const gatePhases = Object.keys(GATE_DEFINITIONS);

// --- AF-011: pm gate definition exists ---
assert('AF-011',
  GATE_DEFINITIONS.pm !== undefined && Array.isArray(GATE_DEFINITIONS.pm.pass),
  'Gate definition exists for pm phase with pass conditions'
);

// --- AF-012: plan gate definition exists ---
assert('AF-012',
  GATE_DEFINITIONS.plan !== undefined && Array.isArray(GATE_DEFINITIONS.plan.pass),
  'Gate definition exists for plan phase with pass conditions'
);

// --- AF-013: design gate definition exists ---
assert('AF-013',
  GATE_DEFINITIONS.design !== undefined && Array.isArray(GATE_DEFINITIONS.design.pass),
  'Gate definition exists for design phase with pass conditions'
);

// --- AF-014: do gate definition exists ---
assert('AF-014',
  GATE_DEFINITIONS.do !== undefined && Array.isArray(GATE_DEFINITIONS.do.pass),
  'Gate definition exists for do phase with pass conditions'
);

// --- AF-015: Each gate has pass, retry, and fail arrays ---
const allGatesComplete = gatePhases.every(p => {
  const g = GATE_DEFINITIONS[p];
  return Array.isArray(g.pass) && Array.isArray(g.retry) && Array.isArray(g.fail);
});
assert('AF-015',
  allGatesComplete,
  'Every gate definition has pass, retry, and fail condition arrays'
);

// =====================================================================
// AF-016~020: Quality gates run automatically (gate-manager has all 7 phases)
// =====================================================================

// --- AF-016: gate-manager covers all 7 PDCA phases ---
assert('AF-016',
  gatePhases.length === 7,
  `Gate manager defines gates for all 7 phases (found: ${gatePhases.length})`
);

// --- AF-017: check phase gate has matchRate condition ---
const checkGate = GATE_DEFINITIONS.check;
const hasMatchRate = checkGate.pass.some(c => c.metric === 'matchRate');
assert('AF-017',
  hasMatchRate,
  'check phase gate has matchRate metric in pass conditions'
);

// --- AF-018: checkGate function is exported for automatic evaluation ---
assert('AF-018',
  typeof gateManager.checkGate === 'function',
  'checkGate function is exported for automatic gate evaluation'
);

// --- AF-019: resolveAction function is exported for automatic verdict resolution ---
assert('AF-019',
  typeof gateManager.resolveAction === 'function',
  'resolveAction function is exported for automatic verdict resolution'
);

// --- AF-020: recordGateResult function exists for auto-logging ---
assert('AF-020',
  typeof gateManager.recordGateResult === 'function',
  'recordGateResult function exists for automatic gate result logging'
);

// =====================================================================
// AF-021~025: YAML workflows define auto-advance rules
// =====================================================================

const workflowDir = path.join(PROJECT_ROOT, '.bkit', 'workflows');

// --- AF-021: default.workflow.yaml exists and is parseable ---
const defaultYaml = path.join(workflowDir, 'default.workflow.yaml');
assertNoThrow('AF-021', () => {
  const content = fs.readFileSync(defaultYaml, 'utf-8');
  workflowParser.parseWorkflowYaml(content);
}, 'default.workflow.yaml is parseable by workflow parser');

// --- AF-022: default workflow has auto trigger type ---
const defaultContent = fs.readFileSync(defaultYaml, 'utf-8');
const defaultWf = workflowParser.parseWorkflowYaml(defaultContent);
assert('AF-022',
  defaultWf.trigger && defaultWf.trigger.type === 'auto',
  'Default workflow has trigger.type === "auto" (auto-advance)'
);

// --- AF-023: default workflow defines steps for all key phases ---
const stepKeys = Object.keys(defaultWf.steps || {});
const hasAllPhases = ['pm', 'plan', 'design', 'do', 'check'].every(p => stepKeys.includes(p));
assert('AF-023',
  hasAllPhases,
  'Default workflow defines steps for pm, plan, design, do, check'
);

// --- AF-024: hotfix.workflow.yaml exists and is parseable ---
const hotfixYaml = path.join(workflowDir, 'hotfix.workflow.yaml');
assertNoThrow('AF-024', () => {
  const content = fs.readFileSync(hotfixYaml, 'utf-8');
  workflowParser.parseWorkflowYaml(content);
}, 'hotfix.workflow.yaml is parseable by workflow parser');

// --- AF-025: enterprise.workflow.yaml exists and is parseable ---
const enterpriseYaml = path.join(workflowDir, 'enterprise.workflow.yaml');
assertNoThrow('AF-025', () => {
  const content = fs.readFileSync(enterpriseYaml, 'utf-8');
  workflowParser.parseWorkflowYaml(content);
}, 'enterprise.workflow.yaml is parseable by workflow parser');

summary('automation-first-v2.test.js');
process.exit(0);
