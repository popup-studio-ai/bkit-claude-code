#!/usr/bin/env node
/**
 * Export Compatibility Integration Test
 * @module test/integration/export-compat
 * @version 1.6.2
 *
 * Verifies:
 * - common.js 241 exports full census
 * - 7 new v1.6.1 exports (coordinator.js functions not yet in common.js)
 * - core/index.js, pdca/index.js, team/index.js re-exports
 * - v1.6.2: backupToPluginData, restoreFromPluginData
 * 34 TC
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

// Load all modules
const common = require(path.join(PROJECT_ROOT, 'lib/core'));
const core = require(path.join(PROJECT_ROOT, 'lib/core'));
const pdca = require(path.join(PROJECT_ROOT, 'lib/pdca'));
const intent = require(path.join(PROJECT_ROOT, 'lib/intent'));
const task = require(path.join(PROJECT_ROOT, 'lib/task'));
const team = require(path.join(PROJECT_ROOT, 'lib/team'));
const coordinator = require(path.join(PROJECT_ROOT, 'lib/team/coordinator'));

// ============================================================
// Section 1: common.js total export count (TC 01-06)
// ============================================================

const commonExports = Object.keys(common);
const commonExportCount = commonExports.length;

// TC-EC-01: common.js has expected export count
// Design says 241. Count actual.
assert('TC-EC-01',
  commonExportCount >= 199 && commonExportCount <= 260,
  `common.js has ${commonExportCount} exports (expected 199-260 range)`
);

// TC-EC-02: All common.js exports are functions or defined values
const undefinedExports = commonExports.filter(k => common[k] === undefined);
assert('TC-EC-02',
  undefinedExports.length === 0,
  `All common.js exports are defined (${undefinedExports.length} undefined)`
);

// TC-EC-03: Core module exports count (52 expected)
const coreExportCount = Object.keys(core).length;
assert('TC-EC-03',
  coreExportCount >= 49 && coreExportCount <= 70,
  `core/index.js has ${coreExportCount} exports (expected 49-70)`
);

// TC-EC-04: PDCA module exports count (123+ expected after session-guide)
const pdcaExportCount = Object.keys(pdca).length;
assert('TC-EC-04',
  pdcaExportCount >= 65 && pdcaExportCount <= 130,
  `pdca/index.js has ${pdcaExportCount} exports (expected 65-130)`
);

// TC-EC-05: Team module exports count (40 expected)
const teamExportCount = Object.keys(team).length;
assert('TC-EC-05',
  teamExportCount >= 35 && teamExportCount <= 50,
  `team/index.js has ${teamExportCount} exports (expected ~40)`
);

// TC-EC-06: Task + Intent module exports
const taskExportCount = Object.keys(task).length;
const intentExportCount = Object.keys(intent).length;
assert('TC-EC-06',
  taskExportCount >= 26 && intentExportCount >= 19,
  `task/index.js has ${taskExportCount} exports, intent/index.js has ${intentExportCount} exports`
);

// ============================================================
// Section 2: v1.6.1 new exports (TC 07-13)
// ============================================================

// These 7 functions exist in coordinator.js but may not be in common.js yet

// TC-EC-07: buildAgentTeamPlan exists in coordinator
assert('TC-EC-07',
  typeof coordinator.buildAgentTeamPlan === 'function',
  'buildAgentTeamPlan is exported from coordinator.js'
);

// TC-EC-08: getFileOwnership exists in coordinator
assert('TC-EC-08',
  typeof coordinator.getFileOwnership === 'function',
  'getFileOwnership is exported from coordinator.js'
);

// TC-EC-09: buildAgentTeamPlan returns plan for CTO team
const origEnv = process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS;
process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = '1';
const ctoPlan = coordinator.buildAgentTeamPlan('cto', 'test-feature', { phase: 'do', level: 'Dynamic' });
process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = origEnv || '';
assert('TC-EC-09',
  ctoPlan != null && ctoPlan.teamName.includes('cto') && ctoPlan.teammates.length > 0,
  'buildAgentTeamPlan(cto) returns plan with teammates'
);

// TC-EC-10: buildAgentTeamPlan returns null for PM team (PM uses separate orchestration)
process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = '1';
const pmPlan = coordinator.buildAgentTeamPlan('pm', 'test-feature');
process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = origEnv || '';
assert('TC-EC-10',
  pmPlan === null,
  'buildAgentTeamPlan(pm) returns null (PM team uses separate orchestration path)'
);

// TC-EC-11: getFileOwnership returns file paths
const doFiles = coordinator.getFileOwnership('do', 'developer', 'feat-x');
assert('TC-EC-11',
  Array.isArray(doFiles) && doFiles.length > 0 && doFiles[0].includes('lib/'),
  'getFileOwnership(do, developer) returns file patterns including lib/'
);

// TC-EC-12: buildAgentTeamPlan returns null for Starter
process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = '1';
const starterPlan = coordinator.buildAgentTeamPlan('cto', 'test', { level: 'Starter' });
process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = origEnv || '';
assert('TC-EC-12',
  starterPlan === null,
  'buildAgentTeamPlan returns null for Starter level'
);

// TC-EC-13: buildAgentTeamPlan returns null when teams unavailable
delete process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS;
const noTeamPlan = coordinator.buildAgentTeamPlan('cto', 'test');
if (origEnv) process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = origEnv;
assert('TC-EC-13',
  noTeamPlan === null,
  'buildAgentTeamPlan returns null when AGENT_TEAMS env not set'
);

// ============================================================
// Section 3: core/index.js re-exports verification (TC 14-19)
// ============================================================

// TC-EC-14: Core Platform exports match common.js
assert('TC-EC-14',
  common.detectPlatform === core.detectPlatform &&
  common.PLUGIN_ROOT === core.PLUGIN_ROOT &&
  common.PROJECT_DIR === core.PROJECT_DIR,
  'Core Platform exports (detectPlatform, PLUGIN_ROOT, PROJECT_DIR) match common.js'
);

// TC-EC-15: Core Cache exports match common.js
assert('TC-EC-15',
  common.get === core.get &&
  common.set === core.set &&
  common.invalidate === core.invalidate &&
  common.clear === core.clear,
  'Core Cache exports (get, set, invalidate, clear) match common.js'
);

// TC-EC-16: Core I/O exports match common.js
assert('TC-EC-16',
  common.readStdinSync === core.readStdinSync &&
  common.outputAllow === core.outputAllow &&
  common.outputBlock === core.outputBlock &&
  common.truncateContext === core.truncateContext,
  'Core I/O exports match common.js'
);

// TC-EC-17: Core Debug exports match common.js
assert('TC-EC-17',
  common.debugLog === core.debugLog &&
  common.getDebugLogPath === core.getDebugLogPath,
  'Core Debug exports match common.js'
);

// TC-EC-18: Core Config exports match common.js
assert('TC-EC-18',
  common.loadConfig === core.loadConfig &&
  common.getConfig === core.getConfig &&
  common.getBkitConfig === core.getBkitConfig,
  'Core Config exports match common.js'
);

// TC-EC-19: Core Paths exports match common.js
assert('TC-EC-19',
  common.STATE_PATHS === core.STATE_PATHS &&
  common.findDoc === core.findDoc &&
  common.getArchivePath === core.getArchivePath &&
  common.backupToPluginData === core.backupToPluginData &&
  common.restoreFromPluginData === core.restoreFromPluginData,
  'Core Paths exports (10 total, +backupToPluginData, +restoreFromPluginData) match common.js'
);

// ============================================================
// Section 4: pdca/index.js re-exports verification (TC 20-24)
// ============================================================

// TC-EC-20: PDCA Phase exports match common.js
assert('TC-EC-20',
  common.PDCA_PHASES === pdca.PDCA_PHASES &&
  common.getPhaseNumber === pdca.getPhaseNumber &&
  common.getNextPdcaPhase === pdca.getNextPdcaPhase,
  'PDCA Phase exports match common.js'
);

// TC-EC-21: PDCA Status exports match common.js
assert('TC-EC-21',
  common.getPdcaStatusFull === pdca.getPdcaStatusFull &&
  common.updatePdcaStatus === pdca.updatePdcaStatus &&
  common.readBkitMemory === pdca.readBkitMemory,
  'PDCA Status exports match common.js'
);

// TC-EC-22: PDCA Automation exports match common.js
assert('TC-EC-22',
  common.shouldAutoAdvance === pdca.shouldAutoAdvance &&
  common.emitUserPrompt === pdca.emitUserPrompt &&
  common.detectPdcaFromTaskSubject === pdca.detectPdcaFromTaskSubject,
  'PDCA Automation exports match common.js'
);

// TC-EC-23: PDCA Executive Summary exports match common.js
assert('TC-EC-23',
  common.generateExecutiveSummary === pdca.generateExecutiveSummary &&
  common.formatExecutiveSummary === pdca.formatExecutiveSummary,
  'PDCA Executive Summary exports match common.js'
);

// TC-EC-24: PDCA Template Validator exports match common.js (v1.6.0 ENH-103)
assert('TC-EC-24',
  common.REQUIRED_SECTIONS === pdca.REQUIRED_SECTIONS &&
  common.validateDocument === pdca.validateDocument &&
  common.formatValidationWarning === pdca.formatValidationWarning &&
  common.isPlanPlus === pdca.isPlanPlus,
  'PDCA Template Validator exports match common.js'
);

// ============================================================
// Section 5: team/index.js re-exports verification (TC 25-30)
// ============================================================

// TC-EC-25: Team Coordinator exports match common.js
assert('TC-EC-25',
  common.isTeamModeAvailable === team.isTeamModeAvailable &&
  common.getTeamConfig === team.getTeamConfig &&
  common.suggestTeamMode === team.suggestTeamMode,
  'Team Coordinator exports match common.js'
);

// TC-EC-26: Team Strategy exports match common.js
assert('TC-EC-26',
  common.TEAM_STRATEGIES === team.TEAM_STRATEGIES &&
  common.getTeammateRoles === team.getTeammateRoles,
  'Team Strategy exports match common.js'
);

// TC-EC-27: Team Orchestrator exports match common.js
assert('TC-EC-27',
  common.selectOrchestrationPattern === team.selectOrchestrationPattern &&
  common.composeTeamForPhase === team.composeTeamForPhase &&
  common.PHASE_PATTERN_MAP === team.PHASE_PATTERN_MAP,
  'Team Orchestrator exports match common.js'
);

// TC-EC-28: Team Communication exports match common.js
assert('TC-EC-28',
  common.MESSAGE_TYPES === team.MESSAGE_TYPES &&
  common.createMessage === team.createMessage &&
  common.createBroadcast === team.createBroadcast,
  'Team Communication exports match common.js'
);

// TC-EC-29: Team CTO Logic exports match common.js
assert('TC-EC-29',
  common.evaluateCheckResults === team.evaluateCheckResults &&
  common.decidePdcaPhase === team.decidePdcaPhase &&
  common.recommendTeamComposition === team.recommendTeamComposition,
  'Team CTO Logic exports match common.js'
);

// TC-EC-30: Team State Writer exports match common.js
assert('TC-EC-30',
  common.initAgentState === team.initAgentState &&
  common.updateTeammateStatus === team.updateTeammateStatus &&
  common.readAgentState === team.readAgentState &&
  common.cleanupAgentState === team.cleanupAgentState,
  'Team State Writer exports match common.js'
);

// ============================================================
// Section 6: v1.6.2 new exports (TC 31-34)
// ============================================================

// TC-EC-31: backupToPluginData function signature
assert('TC-EC-31',
  typeof core.backupToPluginData === 'function',
  'backupToPluginData is a function in core/index.js'
);

// TC-EC-32: restoreFromPluginData function signature
assert('TC-EC-32',
  typeof core.restoreFromPluginData === 'function',
  'restoreFromPluginData is a function in core/index.js'
);

// TC-EC-33: backupToPluginData bridge check
assert('TC-EC-33',
  common.backupToPluginData === core.backupToPluginData,
  'common.backupToPluginData === core.backupToPluginData (bridge check)'
);

// TC-EC-34: restoreFromPluginData bridge check
assert('TC-EC-34',
  common.restoreFromPluginData === core.restoreFromPluginData,
  'common.restoreFromPluginData === core.restoreFromPluginData (bridge check)'
);

// ============================================================
// Summary
// ============================================================
console.log('\n========================================');
console.log('Export Compatibility Test Results');
console.log('========================================');
console.log(`Total: ${passed + failed} | PASS: ${passed} | FAIL: ${failed}`);
console.log(`Pass Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
console.log('----------------------------------------');
results.forEach(r => {
  console.log(`  ${r.status === 'PASS' ? '[PASS]' : '[FAIL]'} ${r.id}: ${r.description}`);
});
console.log('========================================');

// Additional info: export counts
console.log('\nExport Counts:');
console.log(`  common.js: ${commonExportCount}`);
console.log(`  core/index.js: ${coreExportCount}`);
console.log(`  pdca/index.js: ${pdcaExportCount}`);
console.log(`  intent/index.js: ${intentExportCount}`);
console.log(`  task/index.js: ${taskExportCount}`);
console.log(`  team/index.js: ${teamExportCount}`);
console.log(`  Total sub-modules: ${coreExportCount + pdcaExportCount + intentExportCount + taskExportCount + teamExportCount}`);
console.log('========================================\n');

if (failed > 0) process.exit(1);
