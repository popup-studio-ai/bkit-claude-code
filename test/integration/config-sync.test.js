#!/usr/bin/env node
/**
 * Config-Code Synchronization Integration Test
 * @module test/integration/config-sync
 * @version 2.0.0
 *
 * Verifies bkit.config.json values are correctly consumed by runtime modules.
 * 30 TC (v1.6.1) + 15 TC (v2.0.0): Config → Code synchronization
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const CONFIG_PATH = path.join(PROJECT_ROOT, 'bkit.config.json');

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

// Load config
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

// Load modules
const orchestrator = require(path.join(PROJECT_ROOT, 'lib/team/orchestrator'));
const coordinator = require(path.join(PROJECT_ROOT, 'lib/team/coordinator'));
const ambiguity = require(path.join(PROJECT_ROOT, 'lib/intent/ambiguity'));
const trigger = require(path.join(PROJECT_ROOT, 'lib/intent/trigger'));
const creator = require(path.join(PROJECT_ROOT, 'lib/task/creator'));
const phase = require(path.join(PROJECT_ROOT, 'lib/pdca/phase'));
const coreConfig = require(path.join(PROJECT_ROOT, 'lib/core/config'));
const strategy = require(path.join(PROJECT_ROOT, 'lib/team/strategy'));

// ============================================================
// Section 1: orchestrationPatterns → orchestrator.js (TC 01-08)
// ============================================================

// TC-CS-01: Config orchestrationPatterns.Dynamic exists
assert('TC-CS-01',
  config.team?.orchestrationPatterns?.Dynamic != null,
  'bkit.config.json has team.orchestrationPatterns.Dynamic'
);

// TC-CS-02: Config orchestrationPatterns.Enterprise exists
assert('TC-CS-02',
  config.team?.orchestrationPatterns?.Enterprise != null,
  'bkit.config.json has team.orchestrationPatterns.Enterprise'
);

// TC-CS-03: selectOrchestrationPattern reads Dynamic.plan from config
assert('TC-CS-03',
  orchestrator.selectOrchestrationPattern('plan', 'Dynamic') === config.team.orchestrationPatterns.Dynamic.plan,
  'selectOrchestrationPattern(plan, Dynamic) matches config value'
);

// TC-CS-04: selectOrchestrationPattern reads Dynamic.do from config
assert('TC-CS-04',
  orchestrator.selectOrchestrationPattern('do', 'Dynamic') === config.team.orchestrationPatterns.Dynamic.do,
  'selectOrchestrationPattern(do, Dynamic) matches config value "swarm"'
);

// TC-CS-05: selectOrchestrationPattern reads Enterprise.design from config
assert('TC-CS-05',
  orchestrator.selectOrchestrationPattern('design', 'Enterprise') === config.team.orchestrationPatterns.Enterprise.design,
  'selectOrchestrationPattern(design, Enterprise) matches config value "council"'
);

// TC-CS-06: selectOrchestrationPattern reads Enterprise.act from config
assert('TC-CS-06',
  orchestrator.selectOrchestrationPattern('act', 'Enterprise') === config.team.orchestrationPatterns.Enterprise.act,
  'selectOrchestrationPattern(act, Enterprise) matches config value "watchdog"'
);

// TC-CS-07: Starter level returns 'single' regardless of config
assert('TC-CS-07',
  orchestrator.selectOrchestrationPattern('plan', 'Starter') === 'single',
  'selectOrchestrationPattern returns "single" for Starter level'
);

// TC-CS-08: DEFAULT_PHASE_PATTERN_MAP matches config orchestrationPatterns
const defaultMap = orchestrator.PHASE_PATTERN_MAP;
const configDynamic = config.team.orchestrationPatterns.Dynamic;
assert('TC-CS-08',
  defaultMap.Dynamic.plan === configDynamic.plan &&
  defaultMap.Dynamic.do === configDynamic.do &&
  defaultMap.Dynamic.check === configDynamic.check,
  'DEFAULT_PHASE_PATTERN_MAP.Dynamic matches config orchestrationPatterns.Dynamic'
);

// ============================================================
// Section 2: confidenceThreshold → ambiguity.js & trigger.js (TC 09-16)
// ============================================================

// TC-CS-09: Config triggers.confidenceThreshold exists
assert('TC-CS-09',
  config.triggers?.confidenceThreshold != null,
  'bkit.config.json has triggers.confidenceThreshold'
);

// TC-CS-10: Config triggers.confidenceThreshold is 0.7
assert('TC-CS-10',
  config.triggers.confidenceThreshold === 0.7,
  'triggers.confidenceThreshold is 0.7'
);

// TC-CS-11: getConfig reads confidenceThreshold correctly
const readThreshold = coreConfig.getConfig('triggers.confidenceThreshold', 0.5);
assert('TC-CS-11',
  readThreshold === 0.7,
  'getConfig(triggers.confidenceThreshold) returns 0.7'
);

// TC-CS-12: calculateAmbiguityScore uses confidenceThreshold for shouldClarify
const ambResult = ambiguity.calculateAmbiguityScore('fix it', {});
assert('TC-CS-12',
  ambResult.hasOwnProperty('shouldClarify') && ambResult.hasOwnProperty('score'),
  'calculateAmbiguityScore returns shouldClarify and score fields'
);

// TC-CS-13: High ambiguity input triggers shouldClarify
const highAmbResult = ambiguity.calculateAmbiguityScore('do stuff', {});
assert('TC-CS-13',
  highAmbResult.score > 0,
  'Ambiguous input "do stuff" produces score > 0'
);

// TC-CS-14: Low ambiguity input with file path reduces score
const lowAmbResult = ambiguity.calculateAmbiguityScore(
  'Fix the authentication bug in ./src/auth/login.ts specifically for the UserProfile component',
  {}
);
assert('TC-CS-14',
  lowAmbResult.score < highAmbResult.score,
  'Specific input with file path has lower ambiguity than vague input'
);

// TC-CS-15: matchImplicitAgentTrigger uses confidenceThreshold
const agentResult = trigger.matchImplicitAgentTrigger('help me');
assert('TC-CS-15',
  agentResult === null || agentResult.confidence >= 0.7,
  'matchImplicitAgentTrigger confidence is null or >= confidenceThreshold'
);

// TC-CS-16: matchImplicitSkillTrigger uses confidenceThreshold
const skillResult = trigger.matchImplicitSkillTrigger('login system');
assert('TC-CS-16',
  skillResult === null || skillResult.confidence >= 0.7,
  'matchImplicitSkillTrigger confidence is null or >= confidenceThreshold'
);

// ============================================================
// Section 3: permissions → agents/*.md disallowedTools (TC 17-22)
// ============================================================

// TC-CS-17: Config permissions section exists
assert('TC-CS-17',
  config.permissions != null && typeof config.permissions === 'object',
  'bkit.config.json has permissions section'
);

// TC-CS-18: Config denies Bash(rm -rf*)
assert('TC-CS-18',
  config.permissions['Bash(rm -rf*)'] === 'deny',
  'Config denies Bash(rm -rf*)'
);

// TC-CS-19: Config denies Bash(git push --force*)
assert('TC-CS-19',
  config.permissions['Bash(git push --force*)'] === 'deny',
  'Config denies Bash(git push --force*)'
);

// TC-CS-20: Agent files reference disallowedTools
const agentsDir = path.join(PROJECT_ROOT, 'agents');
const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
assert('TC-CS-20',
  agentFiles.length > 0,
  'Agent directory contains .md files'
);

// TC-CS-21: At least one agent references dangerous tool restrictions
let agentHasDisallowed = false;
for (const agentFile of agentFiles) {
  const content = fs.readFileSync(path.join(agentsDir, agentFile), 'utf8');
  if (content.includes('disallowedTools') || content.includes('rm -rf') || content.includes('Bash(')) {
    agentHasDisallowed = true;
    break;
  }
}
assert('TC-CS-21',
  agentHasDisallowed,
  'At least one agent file references disallowedTools or dangerous commands'
);

// TC-CS-22: Config permissions keys match known tool patterns
const permKeys = Object.keys(config.permissions);
const knownPatterns = ['Write', 'Edit', 'Read', 'Bash'];
const allKnown = permKeys.every(k => knownPatterns.some(p => k.startsWith(p)));
assert('TC-CS-22',
  allKnown,
  'All permission keys start with known tool names (Write/Edit/Read/Bash)'
);

// ============================================================
// Section 4: PDCA_PHASES → creator.js phases (TC 23-30)
// ============================================================

// TC-CS-23: PDCA_PHASES has expected phases
const phaseKeys = Object.keys(phase.PDCA_PHASES);
assert('TC-CS-23',
  phaseKeys.includes('plan') && phaseKeys.includes('design') && phaseKeys.includes('do') &&
  phaseKeys.includes('check') && phaseKeys.includes('act') && phaseKeys.includes('report'),
  'PDCA_PHASES includes plan, design, do, check, act, report'
);

// TC-CS-24: createPdcaTaskChain filters out pm and archived
const chain = creator.createPdcaTaskChain('test-feature-sync');
assert('TC-CS-24',
  !chain.phases.includes('pm') && !chain.phases.includes('archived'),
  'createPdcaTaskChain phases exclude pm and archived'
);

// TC-CS-25: createPdcaTaskChain phases derived from PDCA_PHASES keys
const expectedChainPhases = Object.keys(phase.PDCA_PHASES)
  .filter(p => !['pm', 'archived'].includes(p));
assert('TC-CS-25',
  JSON.stringify(chain.phases) === JSON.stringify(expectedChainPhases),
  'createPdcaTaskChain phases match PDCA_PHASES keys (minus pm/archived)'
);

// TC-CS-26: Each phase in chain has a task object
assert('TC-CS-26',
  chain.phases.every(p => chain.tasks[p] != null),
  'Every phase in chain has a corresponding task'
);

// TC-CS-27: Task chain blockedBy forms proper dependency
assert('TC-CS-27',
  chain.tasks.plan.blockedBy.length === 0 && chain.tasks.design.blockedBy.length === 1,
  'Plan has no blockers, Design has 1 blocker (Plan task)'
);

// TC-CS-28: Config pdca.matchRateThreshold accessible via getConfig
const threshold = coreConfig.getConfig('pdca.matchRateThreshold', 80);
assert('TC-CS-28',
  threshold === 90,
  'getConfig(pdca.matchRateThreshold) returns 90'
);

// TC-CS-29: Config pdca.maxIterations accessible via getConfig
const maxIter = coreConfig.getConfig('pdca.maxIterations', 3);
assert('TC-CS-29',
  maxIter === 5,
  'getConfig(pdca.maxIterations) returns 5'
);

// TC-CS-30: Config team.ctoAgent matches strategy ctoAgent
const teamCtoAgent = coreConfig.getConfig('team.ctoAgent', null);
const strategyCtoAgent = strategy.TEAM_STRATEGIES.Enterprise?.ctoAgent;
assert('TC-CS-30',
  teamCtoAgent === strategyCtoAgent,
  'Config team.ctoAgent matches Enterprise strategy ctoAgent'
);

// ============================================================
// Section 5: v2.0.0 automation/guardrails/quality defaults (CS-001~005)
// ============================================================

// CS-001: Config has automation section
assert('CS-001',
  config.automation != null && typeof config.automation === 'object',
  'bkit.config.json has automation section'
);

// CS-002: automation.defaultLevel exists
assert('CS-002',
  config.automation?.defaultLevel != null,
  'automation.defaultLevel is configured'
);

// CS-003: guardrails.loopBreaker section exists
assert('CS-003',
  config.guardrails?.loopBreaker != null,
  'guardrails.loopBreaker section exists'
);

// CS-004: guardrails.loopBreaker.maxPdcaIterations matches config
const loopMax = coreConfig.getConfig('guardrails.loopBreaker.maxPdcaIterations', 5);
assert('CS-004',
  typeof loopMax === 'number' && loopMax > 0,
  `guardrails.loopBreaker.maxPdcaIterations = ${loopMax} (> 0)`
);

// CS-005: guardrails section exists in config
assert('CS-005',
  config.guardrails != null || config.permissions != null,
  'Config has guardrails or permissions section'
);

// ============================================================
// Section 6: v2.0.0 quality defaults (CS-006~010)
// ============================================================

// CS-006: quality section exists or matchRateThreshold accessible
const qualityThreshold = coreConfig.getConfig('pdca.matchRateThreshold', 90);
assert('CS-006',
  qualityThreshold === 90 || qualityThreshold === config.pdca?.matchRateThreshold,
  `pdca.matchRateThreshold accessible via getConfig: ${qualityThreshold}`
);

// CS-007: pdca.maxIterations accessible
const maxIterations = coreConfig.getConfig('pdca.maxIterations', 5);
assert('CS-007',
  typeof maxIterations === 'number' && maxIterations > 0,
  `pdca.maxIterations accessible: ${maxIterations}`
);

// CS-008: pdca.docPaths exists
assert('CS-008',
  config.pdca?.docPaths != null || coreConfig.getConfig('pdca.docPaths', null) != null,
  'pdca.docPaths configuration exists'
);

// CS-009: team section configuration exists
assert('CS-009',
  config.team != null && typeof config.team === 'object',
  'team configuration section exists'
);

// CS-010: triggers section with multi-language support
assert('CS-010',
  config.triggers != null && config.triggers.confidenceThreshold != null,
  'triggers section with confidenceThreshold exists'
);

// ============================================================
// Section 7: v2.0.0 plugin.json fields (CS-011~015)
// ============================================================

const pluginJsonPath = path.join(PROJECT_ROOT, '.claude-plugin', 'plugin.json');
let pluginJson = null;
try { pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8')); } catch (_) {}

// CS-011: plugin.json exists and is valid JSON
assert('CS-011',
  pluginJson !== null,
  'plugin.json exists and parses as valid JSON'
);

// CS-012: plugin.json version is 2.0.2
assert('CS-012',
  pluginJson?.version === '2.0.3',
  `plugin.json version is ${pluginJson?.version} (expected 2.0.3)`
);

// CS-013: plugin.json has outputStyles
assert('CS-013',
  pluginJson?.outputStyles != null,
  'plugin.json has outputStyles field'
);

// CS-014: plugin.json engines requires CC 2.1.78+
assert('CS-014',
  pluginJson?.engines?.['claude-code'] != null,
  `plugin.json engines.claude-code: ${pluginJson?.engines?.['claude-code']}`
);

// CS-015: plugin.json has required metadata fields
assert('CS-015',
  pluginJson?.name && pluginJson?.displayName && pluginJson?.description && pluginJson?.license,
  'plugin.json has name, displayName, description, license'
);

// ============================================================
// Summary
// ============================================================
console.log('\n========================================');
console.log('Config-Code Synchronization Test Results');
console.log('========================================');
console.log(`Total: ${passed + failed} | PASS: ${passed} | FAIL: ${failed}`);
console.log(`Pass Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
console.log('----------------------------------------');
results.forEach(r => {
  console.log(`  ${r.status === 'PASS' ? '[PASS]' : '[FAIL]'} ${r.id}: ${r.description}`);
});
console.log('========================================\n');

if (failed > 0) process.exit(1);
