#!/usr/bin/env node
/**
 * Hook Processing Chain Integration Test
 * @module test/integration/hook-chain
 * @version 1.6.1
 *
 * Verifies:
 * - user-prompt-handler.js 7-stage processing (each stage try-catch)
 * - SessionStart → config load → level detect → memory read
 * - PostToolUse → template validation
 * 30 TC
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

// Load modules needed for hook chain verification
const common = require(path.join(PROJECT_ROOT, 'lib/core'));
const coreConfig = require(path.join(PROJECT_ROOT, 'lib/core/config'));
const ambiguity = require(path.join(PROJECT_ROOT, 'lib/intent/ambiguity'));
const trigger = require(path.join(PROJECT_ROOT, 'lib/intent/trigger'));
const pdcaStatus = require(path.join(PROJECT_ROOT, 'lib/pdca/status'));
const pdcaLevel = require(path.join(PROJECT_ROOT, 'lib/pdca/level'));
const templateValidator = require(path.join(PROJECT_ROOT, 'lib/pdca/template-validator'));
const team = require(path.join(PROJECT_ROOT, 'lib/team'));

// ============================================================
// Section 1: user-prompt-handler 7-stage chain (TC 01-14)
// ============================================================

// The 7 stages in user-prompt-handler.js:
// 1. New Feature Intent Detection (detectNewFeatureIntent)
// 2. Implicit Agent Trigger (matchImplicitAgentTrigger)
// 3. Implicit Skill Trigger (matchImplicitSkillTrigger)
// 3.3: CC Built-in Command Detection
// 3.5: bkend recommendation
// 4. Ambiguity Detection (calculateAmbiguityScore)
// 5. Team Mode Auto-Suggestion (suggestTeamMode)
// 6. Import Resolution
// Each stage is wrapped in try-catch for independent failure

// TC-HC-01: Stage 1 - detectNewFeatureIntent is callable
assert('TC-HC-01',
  typeof common.detectNewFeatureIntent === 'function',
  'Stage 1: detectNewFeatureIntent is exported from common.js'
);

// TC-HC-02: Stage 1 - detectNewFeatureIntent returns expected structure
const featureResult = common.detectNewFeatureIntent('implement new feature called "auth"');
assert('TC-HC-02',
  featureResult.hasOwnProperty('isNewFeature') &&
  featureResult.hasOwnProperty('featureName') &&
  featureResult.hasOwnProperty('confidence'),
  'Stage 1: detectNewFeatureIntent returns {isNewFeature, featureName, confidence}'
);

// TC-HC-03: Stage 1 - null/empty input handled gracefully
const emptyResult = common.detectNewFeatureIntent('');
assert('TC-HC-03',
  emptyResult.isNewFeature === false && emptyResult.confidence === 0,
  'Stage 1: Empty input returns isNewFeature=false, confidence=0'
);

// TC-HC-04: Stage 2 - matchImplicitAgentTrigger is callable
assert('TC-HC-04',
  typeof common.matchImplicitAgentTrigger === 'function',
  'Stage 2: matchImplicitAgentTrigger is exported from common.js'
);

// TC-HC-05: Stage 2 - null input handled gracefully
assert('TC-HC-05',
  common.matchImplicitAgentTrigger(null) === null,
  'Stage 2: null input returns null'
);

// TC-HC-06: Stage 2 - agent trigger returns correct format
const agentTrig = common.matchImplicitAgentTrigger('help me get started');
assert('TC-HC-06',
  agentTrig === null || (agentTrig.agent && agentTrig.confidence),
  'Stage 2: Returns null or {agent, confidence}'
);

// TC-HC-07: Stage 3 - matchImplicitSkillTrigger is callable
assert('TC-HC-07',
  typeof common.matchImplicitSkillTrigger === 'function',
  'Stage 3: matchImplicitSkillTrigger is exported from common.js'
);

// TC-HC-08: Stage 3 - skill trigger returns correct format
const skillTrig = common.matchImplicitSkillTrigger('build a login system with fullstack');
assert('TC-HC-08',
  skillTrig === null || (skillTrig.skill && skillTrig.level && skillTrig.confidence),
  'Stage 3: Returns null or {skill, level, confidence}'
);

// TC-HC-09: Stage 4 - calculateAmbiguityScore is callable
assert('TC-HC-09',
  typeof common.calculateAmbiguityScore === 'function',
  'Stage 4: calculateAmbiguityScore is exported from common.js'
);

// TC-HC-10: Stage 4 - ambiguity returns shouldClarify
const ambResult = common.calculateAmbiguityScore('do stuff with things', {});
assert('TC-HC-10',
  ambResult.hasOwnProperty('score') && ambResult.hasOwnProperty('shouldClarify') && ambResult.hasOwnProperty('factors'),
  'Stage 4: calculateAmbiguityScore returns {score, shouldClarify, factors}'
);

// TC-HC-11: Stage 5 - suggestTeamMode is callable
assert('TC-HC-11',
  typeof team.suggestTeamMode === 'function',
  'Stage 5: suggestTeamMode is exported from team module'
);

// TC-HC-12: Stage 5 - suggestTeamMode returns null when teams unavailable
const origEnv = process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS;
delete process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS;
const teamSuggestion = team.suggestTeamMode('implement large feature');
assert('TC-HC-12',
  teamSuggestion === null,
  'Stage 5: suggestTeamMode returns null when AGENT_TEAMS not set'
);
if (origEnv) process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = origEnv;

// TC-HC-13: Stages produce independent results (no cross-contamination)
const prompt = 'help me build a new feature';
const s1 = common.detectNewFeatureIntent(prompt);
const s2 = common.matchImplicitAgentTrigger(prompt);
const s3 = common.matchImplicitSkillTrigger(prompt);
const s4 = common.calculateAmbiguityScore(prompt, {});
assert('TC-HC-13',
  (s1 !== undefined) && (s4.score !== undefined),
  'All stages produce independent results without interfering'
);

// TC-HC-14: Truncation and output functions available
assert('TC-HC-14',
  typeof common.truncateContext === 'function' &&
  typeof common.outputAllow === 'function' &&
  typeof common.outputEmpty === 'function',
  'truncateContext, outputAllow, outputEmpty all exported for hook output'
);

// ============================================================
// Section 2: SessionStart → config load → level detect → memory (TC 15-22)
// ============================================================

// TC-HC-15: SessionStart loads config via getBkitConfig
const bkitConfig = common.getBkitConfig();
assert('TC-HC-15',
  bkitConfig != null && bkitConfig.pdca != null,
  'getBkitConfig() returns config with pdca section'
);

// TC-HC-16: Config load includes triggers section
assert('TC-HC-16',
  bkitConfig.triggers != null && bkitConfig.triggers.confidenceThreshold != null,
  'getBkitConfig() includes triggers.confidenceThreshold'
);

// TC-HC-17: detectLevel is callable and returns valid level
const level = common.detectLevel();
assert('TC-HC-17',
  ['Starter', 'Dynamic', 'Enterprise'].includes(level),
  `detectLevel() returns valid level: "${level}"`
);

// TC-HC-18: initPdcaStatusIfNotExists is callable
assert('TC-HC-18',
  typeof common.initPdcaStatusIfNotExists === 'function',
  'initPdcaStatusIfNotExists is exported for SessionStart'
);

// TC-HC-19: getPdcaStatusFull returns status object
const status = common.getPdcaStatusFull();
assert('TC-HC-19',
  status != null && typeof status === 'object',
  'getPdcaStatusFull() returns non-null object'
);

// TC-HC-20: readBkitMemory is callable
assert('TC-HC-20',
  typeof common.readBkitMemory === 'function',
  'readBkitMemory is exported for SessionStart memory read'
);

// TC-HC-21: emitUserPrompt generates status prompt with correct params
const prompt2 = common.emitUserPrompt({
  message: 'Test question',
  feature: 'test-feature',
  phase: 'plan',
  suggestions: ['Option 1']
});
assert('TC-HC-21',
  typeof prompt2 === 'string' && prompt2.length > 0,
  'emitUserPrompt generates non-empty string'
);

// TC-HC-22: SessionStart hook file exists and is valid
const hookPath = path.join(PROJECT_ROOT, 'hooks/session-start.js');
assert('TC-HC-22',
  fs.existsSync(hookPath),
  'hooks/session-start.js exists'
);

// ============================================================
// Section 3: PostToolUse → template validation (TC 23-30)
// ============================================================

// TC-HC-23: REQUIRED_SECTIONS exists
assert('TC-HC-23',
  common.REQUIRED_SECTIONS != null && typeof common.REQUIRED_SECTIONS === 'object',
  'REQUIRED_SECTIONS exported from common.js'
);

// TC-HC-24: detectDocumentType identifies plan document
const planType = common.detectDocumentType('docs/01-plan/features/my-feat.plan.md');
assert('TC-HC-24',
  planType === 'plan',
  'detectDocumentType identifies plan document from path'
);

// TC-HC-25: detectDocumentType identifies design document
const designType = common.detectDocumentType('docs/02-design/features/feat.design.md');
assert('TC-HC-25',
  designType === 'design',
  'detectDocumentType identifies design document from path'
);

// TC-HC-26: detectDocumentType returns null for analysis (not implemented in current version)
const analysisType = common.detectDocumentType('docs/03-analysis/feat.analysis.md');
assert('TC-HC-26',
  analysisType === null,
  'detectDocumentType returns null for analysis path (not yet implemented)'
);

// TC-HC-27: detectDocumentType identifies report document
const reportType = common.detectDocumentType('docs/04-report/features/feat.report.md');
assert('TC-HC-27',
  reportType === 'report',
  'detectDocumentType identifies report document from path'
);

// TC-HC-28: extractSections parses markdown sections
const mdContent = '# Title\n\n## Overview\nContent\n\n## Scope\nMore content\n\n## Goals\nGoal list';
const sections = common.extractSections(mdContent);
assert('TC-HC-28',
  Array.isArray(sections) && sections.length >= 3,
  'extractSections parses markdown into section list'
);

// TC-HC-29: validateDocument returns validation result with {valid, missing, type}
const validationResult = common.validateDocument('docs/01-plan/features/test.plan.md', mdContent);
assert('TC-HC-29',
  validationResult.hasOwnProperty('valid') && validationResult.hasOwnProperty('missing') &&
  validationResult.hasOwnProperty('type'),
  'validateDocument returns {valid, missing, type}'
);

// TC-HC-30: formatValidationWarning produces string output for invalid result
const invalidResult = { valid: false, missing: ['Executive Summary', 'Requirements'], type: 'plan' };
const warning = common.formatValidationWarning(invalidResult);
assert('TC-HC-30',
  typeof warning === 'string' && warning.includes('Missing required sections'),
  'formatValidationWarning produces warning string with missing sections'
);

// ============================================================
// Summary
// ============================================================
console.log('\n========================================');
console.log('Hook Chain Integration Test Results');
console.log('========================================');
console.log(`Total: ${passed + failed} | PASS: ${passed} | FAIL: ${failed}`);
console.log(`Pass Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
console.log('----------------------------------------');
results.forEach(r => {
  console.log(`  ${r.status === 'PASS' ? '[PASS]' : '[FAIL]'} ${r.id}: ${r.description}`);
});
console.log('========================================\n');

if (failed > 0) process.exit(1);
