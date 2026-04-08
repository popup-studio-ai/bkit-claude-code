'use strict';
/**
 * Unit Tests for other modules
 * 95 TC | console.assert based | no external dependencies
 *
 * Covers:
 * - common.js exports verification (241 expected)
 * - pdca/status.js: getPdcaStatusPath, readBkitMemory, writeBkitMemory
 * - pdca/level.js: detectLevel, LEVEL_PHASE_MAP, canSkipPhase, etc.
 * - pdca/phase.js: PDCA_PHASES, getPhaseNumber, getPhaseName, etc.
 * - core/config.js: getConfig, loadConfig, safeJsonParse
 * - intent/language.js: detectLanguage, matchMultiLangPattern, etc.
 */

const path = require('path');
const fs = require('fs');

let passed = 0, failed = 0, total = 0;

function assert(id, condition, message) {
  total++;
  if (condition) { passed++; console.log(`  PASS: ${id} - ${message}`); }
  else { failed++; console.error(`  FAIL: ${id} - ${message}`); }
}

console.log('\n=== other-modules.test.js ===\n');

// ============================================
// core module exports verification (v2.1.1: lib/common removed in v2.0.0)
// ============================================
console.log('\n--- core module exports ---\n');

let common;
try {
  common = require('../../lib/core');
} catch (e) {
  console.error('core module load failed:', e.message);
  process.exit(1);
}

const commonKeys = Object.keys(common);
assert('U-OTH-001', commonKeys.length >= 30, `core module has >= 30 exports (got ${commonKeys.length})`);

// v2.1.1: lib/common removed in v2.0.0. Test individual module exports instead.

// Core module exports (lib/core)
assert('U-OTH-002', typeof common.debugLog === 'function', 'debugLog in core');
assert('U-OTH-003', typeof common.getConfig === 'function', 'getConfig in core');
assert('U-OTH-004', typeof common.loadConfig === 'function', 'loadConfig in core');
assert('U-OTH-005', typeof common.safeJsonParse === 'function', 'safeJsonParse in core');
assert('U-OTH-006', typeof common.PLUGIN_ROOT === 'string', 'PLUGIN_ROOT in core');
assert('U-OTH-007', typeof common.PROJECT_DIR === 'string', 'PROJECT_DIR in core');
assert('U-OTH-008', typeof common.globalCache === 'object', 'globalCache in core');
assert('U-OTH-009', typeof common.readStdinSync === 'function', 'readStdinSync in core');
assert('U-OTH-010', typeof common.parseHookInput === 'function', 'parseHookInput in core');
assert('U-OTH-011', typeof common.outputAllow === 'function', 'outputAllow in core');
assert('U-OTH-012', typeof common.outputBlock === 'function', 'outputBlock in core');

// PDCA module exports (separate module, not in core)
const pdca = require('../../lib/pdca');
assert('U-OTH-013', typeof pdca.getPdcaStatusFull === 'function', 'getPdcaStatusFull in pdca');
assert('U-OTH-014', typeof pdca.detectLevel === 'function', 'detectLevel in pdca');

// Intent module exports (separate module)
const intent = require('../../lib/intent');
assert('U-OTH-015', typeof intent.detectLanguage === 'function', 'detectLanguage in intent');
assert('U-OTH-016', typeof intent.matchMultiLangPattern === 'function', 'matchMultiLangPattern in intent');
assert('U-OTH-017', typeof intent.calculateAmbiguityScore === 'function', 'calculateAmbiguityScore in intent');

// Task module exports (separate module)
const task = require('../../lib/task');
assert('U-OTH-018', typeof task.classifyTask === 'function', 'classifyTask in task');

// Team module exports (separate module)
const team = require('../../lib/team');
assert('U-OTH-019', typeof team.isTeamModeAvailable === 'function', 'isTeamModeAvailable in team');
assert('U-OTH-020', typeof team.formatTeamStatus === 'function', 'formatTeamStatus in team');

// Coordinator (separate module)
const coordinator = require('../../lib/team/coordinator');
assert('U-OTH-021', typeof coordinator.buildAgentTeamPlan === 'function', 'buildAgentTeamPlan in coordinator');

// ============================================
// pdca/status.js
// ============================================
console.log('\n--- pdca/status.js ---\n');

let statusMod;
try {
  statusMod = require('../../lib/pdca/status');
} catch (e) {
  console.error('pdca/status.js load failed:', e.message);
  process.exit(1);
}

assert('U-OTH-030', typeof statusMod.getPdcaStatusPath === 'function', 'getPdcaStatusPath exported');
assert('U-OTH-031', typeof statusMod.readBkitMemory === 'function', 'readBkitMemory exported');
assert('U-OTH-032', typeof statusMod.writeBkitMemory === 'function', 'writeBkitMemory exported');
assert('U-OTH-033', typeof statusMod.createInitialStatusV2 === 'function', 'createInitialStatusV2 exported');

const statusPath = statusMod.getPdcaStatusPath();
assert('U-OTH-034', typeof statusPath === 'string', 'getPdcaStatusPath returns string');
assert('U-OTH-035', statusPath.length > 0, 'Status path not empty');

const initialStatus = statusMod.createInitialStatusV2();
assert('U-OTH-036', initialStatus.version === '2.0', 'Initial status version is 2.0');
assert('U-OTH-037', Array.isArray(initialStatus.activeFeatures), 'activeFeatures is array');
assert('U-OTH-038', initialStatus.primaryFeature === null, 'primaryFeature is null initially');
assert('U-OTH-039', typeof initialStatus.features === 'object', 'features is object');
assert('U-OTH-040', Array.isArray(initialStatus.history), 'history is array');

// readBkitMemory (may return null if no memory file)
const memory = statusMod.readBkitMemory();
assert('U-OTH-041', memory === null || typeof memory === 'object', 'readBkitMemory returns null or object');

// ============================================
// pdca/level.js
// ============================================
console.log('\n--- pdca/level.js ---\n');

let levelMod;
try {
  levelMod = require('../../lib/pdca/level');
} catch (e) {
  console.error('pdca/level.js load failed:', e.message);
  process.exit(1);
}

assert('U-OTH-042', typeof levelMod.detectLevel === 'function', 'detectLevel exported');
assert('U-OTH-043', typeof levelMod.LEVEL_PHASE_MAP === 'object', 'LEVEL_PHASE_MAP exported');
assert('U-OTH-044', typeof levelMod.canSkipPhase === 'function', 'canSkipPhase exported');
assert('U-OTH-045', typeof levelMod.getRequiredPhases === 'function', 'getRequiredPhases exported');
assert('U-OTH-046', typeof levelMod.getNextPhaseForLevel === 'function', 'getNextPhaseForLevel exported');
assert('U-OTH-047', typeof levelMod.isPhaseApplicable === 'function', 'isPhaseApplicable exported');
assert('U-OTH-048', typeof levelMod.getLevelPhaseGuide === 'function', 'getLevelPhaseGuide exported');

// LEVEL_PHASE_MAP structure
assert('U-OTH-049', levelMod.LEVEL_PHASE_MAP.Starter !== undefined, 'Starter level exists');
assert('U-OTH-050', levelMod.LEVEL_PHASE_MAP.Dynamic !== undefined, 'Dynamic level exists');
assert('U-OTH-051', levelMod.LEVEL_PHASE_MAP.Enterprise !== undefined, 'Enterprise level exists');

// detectLevel
const level = levelMod.detectLevel();
assert('U-OTH-052', ['Starter', 'Dynamic', 'Enterprise'].includes(level), `detectLevel returns valid level (got ${level})`);

// Env override
const origLevel = process.env.BKIT_LEVEL;
process.env.BKIT_LEVEL = 'Enterprise';
assert('U-OTH-053', levelMod.detectLevel() === 'Enterprise', 'BKIT_LEVEL env override works');
if (origLevel) process.env.BKIT_LEVEL = origLevel;
else delete process.env.BKIT_LEVEL;

// canSkipPhase
assert('U-OTH-054', levelMod.canSkipPhase('Starter', 'phase-1') === true, 'Starter can skip phase-1');
assert('U-OTH-055', levelMod.canSkipPhase('Enterprise', 'plan') === false, 'Enterprise cannot skip plan');

// getRequiredPhases
const starterRequired = levelMod.getRequiredPhases('Starter');
assert('U-OTH-056', starterRequired.includes('plan'), 'Starter requires plan');
assert('U-OTH-057', starterRequired.includes('do'), 'Starter requires do');
assert('U-OTH-058', starterRequired.includes('check'), 'Starter requires check');

const entRequired = levelMod.getRequiredPhases('Enterprise');
assert('U-OTH-059', entRequired.length > starterRequired.length, 'Enterprise has more required phases');

// getNextPhaseForLevel
assert('U-OTH-060', levelMod.getNextPhaseForLevel('plan', 'Starter') === 'do', 'Starter: plan -> do (skips design)');
assert('U-OTH-061', levelMod.getNextPhaseForLevel('plan', 'Dynamic') === 'design', 'Dynamic: plan -> design');

// isPhaseApplicable
assert('U-OTH-062', levelMod.isPhaseApplicable('plan', 'Starter') === true, 'plan applicable for Starter');
assert('U-OTH-063', levelMod.isPhaseApplicable('design', 'Starter') === true, 'design optional for Starter');

// getLevelPhaseGuide
const guide = levelMod.getLevelPhaseGuide('Starter');
assert('U-OTH-064', guide.description.length > 0, 'Starter guide has description');
assert('U-OTH-065', guide.phases.length > 0, 'Starter guide has phases');

// ============================================
// pdca/phase.js
// ============================================
console.log('\n--- pdca/phase.js ---\n');

let phaseMod;
try {
  phaseMod = require('../../lib/pdca/phase');
} catch (e) {
  console.error('pdca/phase.js load failed:', e.message);
  process.exit(1);
}

assert('U-OTH-066', typeof phaseMod.PDCA_PHASES === 'object', 'PDCA_PHASES exported');
assert('U-OTH-067', typeof phaseMod.getPhaseNumber === 'function', 'getPhaseNumber exported');
assert('U-OTH-068', typeof phaseMod.getPhaseName === 'function', 'getPhaseName exported');

// PDCA_PHASES structure
const phases = Object.keys(phaseMod.PDCA_PHASES);
assert('U-OTH-069', phases.includes('pm'), 'pm phase exists');
assert('U-OTH-070', phases.includes('plan'), 'plan phase exists');
assert('U-OTH-071', phases.includes('design'), 'design phase exists');
assert('U-OTH-072', phases.includes('do'), 'do phase exists');
assert('U-OTH-073', phases.includes('check'), 'check phase exists');
assert('U-OTH-074', phases.includes('act'), 'act phase exists');
assert('U-OTH-075', phases.includes('report'), 'report phase exists');
assert('U-OTH-076', phases.includes('archived'), 'archived phase exists');

// getPhaseNumber
assert('U-OTH-077', phaseMod.getPhaseNumber('pm') === 0, 'pm = 0');
assert('U-OTH-078', phaseMod.getPhaseNumber('plan') === 1, 'plan = 1');
assert('U-OTH-079', phaseMod.getPhaseNumber('design') === 2, 'design = 2');
assert('U-OTH-080', phaseMod.getPhaseNumber('do') === 3, 'do = 3');
assert('U-OTH-081', phaseMod.getPhaseNumber('check') === 4, 'check = 4');
assert('U-OTH-082', phaseMod.getPhaseNumber('act') === 5, 'act = 5');

// getPhaseName
assert('U-OTH-083', phaseMod.getPhaseName(1) === 'plan', 'Phase 1 = plan');
assert('U-OTH-084', phaseMod.getPhaseName(3) === 'do', 'Phase 3 = do');
assert('U-OTH-085', phaseMod.getPhaseName(99) === 'unknown', 'Unknown phase number');

// getPreviousPdcaPhase / getNextPdcaPhase
assert('U-OTH-086', phaseMod.getPreviousPdcaPhase('plan') === 'pm', 'plan prev = pm');
assert('U-OTH-087', phaseMod.getPreviousPdcaPhase('pm') === null, 'pm has no prev');
assert('U-OTH-088', phaseMod.getNextPdcaPhase('plan') === 'design', 'plan next = design');
assert('U-OTH-089', phaseMod.getNextPdcaPhase('report') === null, 'report has no next');

// ============================================
// core/config.js
// ============================================
console.log('\n--- core/config.js ---\n');

let configMod;
try {
  configMod = require('../../lib/core/config');
} catch (e) {
  console.error('core/config.js load failed:', e.message);
  process.exit(1);
}

assert('U-OTH-090', typeof configMod.getConfig === 'function', 'getConfig exported');
assert('U-OTH-091', typeof configMod.loadConfig === 'function', 'loadConfig exported');
assert('U-OTH-092', typeof configMod.safeJsonParse === 'function', 'safeJsonParse exported');
assert('U-OTH-093', typeof configMod.getConfigArray === 'function', 'getConfigArray exported');
assert('U-OTH-094', typeof configMod.getBkitConfig === 'function', 'getBkitConfig exported');

const bkitConfig = configMod.loadConfig();
assert('U-OTH-095', typeof bkitConfig === 'object', 'loadConfig returns object');

// getConfig with dot notation
const threshold = configMod.getConfig('triggers.confidenceThreshold', 0.7);
assert('U-OTH-096', threshold === 0.7, `confidenceThreshold = 0.7 (got ${threshold})`);

const matchRate = configMod.getConfig('pdca.matchRateThreshold', 90);
assert('U-OTH-097', matchRate === 90, `matchRateThreshold = 90 (got ${matchRate})`);

// Default value
const missing = configMod.getConfig('nonexistent.path', 'default');
assert('U-OTH-098', missing === 'default', 'Missing key returns default');

// safeJsonParse
assert('U-OTH-099', configMod.safeJsonParse('{"a":1}').a === 1, 'Valid JSON parsed');
assert('U-OTH-100', configMod.safeJsonParse('invalid', null) === null, 'Invalid JSON returns fallback');
assert('U-OTH-101', configMod.safeJsonParse('invalid', 42) === 42, 'Custom fallback value');

// ============================================
// intent/language.js
// ============================================
console.log('\n--- intent/language.js ---\n');

let langMod;
try {
  langMod = require('../../lib/intent/language');
} catch (e) {
  console.error('intent/language.js load failed:', e.message);
  process.exit(1);
}

assert('U-OTH-102', typeof langMod.detectLanguage === 'function', 'detectLanguage exported');
assert('U-OTH-103', typeof langMod.matchMultiLangPattern === 'function', 'matchMultiLangPattern exported');
assert('U-OTH-104', typeof langMod.getAllPatterns === 'function', 'getAllPatterns exported');
assert('U-OTH-105', Array.isArray(langMod.SUPPORTED_LANGUAGES), 'SUPPORTED_LANGUAGES is array');
assert('U-OTH-106', langMod.SUPPORTED_LANGUAGES.length === 8, '8 supported languages');

// detectLanguage - 8 languages
assert('U-OTH-107', langMod.detectLanguage('hello world') === 'en', 'English detected');
assert('U-OTH-108', langMod.detectLanguage('안녕하세요') === 'ko', 'Korean detected');
assert('U-OTH-109', langMod.detectLanguage('こんにちは') === 'ja', 'Japanese detected');
assert('U-OTH-110', langMod.detectLanguage('你好世界') === 'zh', 'Chinese detected');
assert('U-OTH-111', langMod.detectLanguage('') === 'en', 'Empty defaults to en');
assert('U-OTH-112', langMod.detectLanguage(null) === 'en', 'Null defaults to en');

// Spanish/French/German/Italian all fall to 'en' (Latin script, no special detection)
assert('U-OTH-113', langMod.detectLanguage('hola mundo') === 'en', 'Spanish Latin script -> en');
assert('U-OTH-114', langMod.detectLanguage('bonjour le monde') === 'en', 'French Latin script -> en');

// matchMultiLangPattern
const testPatterns = {
  en: ['hello', 'world'],
  ko: ['안녕', '세계'],
  ja: ['こんにちは']
};
assert('U-OTH-115', langMod.matchMultiLangPattern('say hello to me', testPatterns) === true, 'EN match');
assert('U-OTH-116', langMod.matchMultiLangPattern('안녕하세요', testPatterns) === true, 'KO match');
assert('U-OTH-117', langMod.matchMultiLangPattern('こんにちは世界', testPatterns) === true, 'JA match');
assert('U-OTH-118', langMod.matchMultiLangPattern('xyz123', testPatterns) === false, 'No match');

// getAllPatterns
const allPatterns = langMod.getAllPatterns(testPatterns);
assert('U-OTH-119', Array.isArray(allPatterns), 'getAllPatterns returns array');
assert('U-OTH-120', allPatterns.includes('hello'), 'Contains en pattern');
assert('U-OTH-121', allPatterns.includes('안녕'), 'Contains ko pattern');

// AGENT_TRIGGER_PATTERNS
assert('U-OTH-122', typeof langMod.AGENT_TRIGGER_PATTERNS === 'object', 'AGENT_TRIGGER_PATTERNS exists');
const agentKeys = Object.keys(langMod.AGENT_TRIGGER_PATTERNS);
assert('U-OTH-123', agentKeys.includes('gap-detector'), 'gap-detector in patterns');
assert('U-OTH-124', agentKeys.includes('cto-lead'), 'cto-lead in patterns');
assert('U-OTH-125', agentKeys.includes('bkend-expert'), 'bkend-expert in patterns');

// SKILL_TRIGGER_PATTERNS
assert('U-OTH-126', typeof langMod.SKILL_TRIGGER_PATTERNS === 'object', 'SKILL_TRIGGER_PATTERNS exists');
const skillKeys = Object.keys(langMod.SKILL_TRIGGER_PATTERNS);
assert('U-OTH-127', skillKeys.includes('starter'), 'starter in skill patterns');
assert('U-OTH-128', skillKeys.includes('dynamic'), 'dynamic in skill patterns');
assert('U-OTH-129', skillKeys.includes('enterprise'), 'enterprise in skill patterns');
assert('U-OTH-130', skillKeys.includes('mobile-app'), 'mobile-app in skill patterns');

// CC_COMMAND_PATTERNS (v1.5.7)
assert('U-OTH-131', typeof langMod.CC_COMMAND_PATTERNS === 'object', 'CC_COMMAND_PATTERNS exists');
assert('U-OTH-132', langMod.CC_COMMAND_PATTERNS.simplify !== undefined, 'simplify command pattern exists');
assert('U-OTH-133', langMod.CC_COMMAND_PATTERNS.batch !== undefined, 'batch command pattern exists');

// ============================================
// v1.6.2: PLUGIN_DATA backup/restore exports
// ============================================
console.log('\n--- v1.6.2: Plugin Data exports ---\n');

assert('U-OTH-134', typeof common.backupToPluginData === 'function', 'backupToPluginData in common');
assert('U-OTH-135', typeof common.restoreFromPluginData === 'function', 'restoreFromPluginData in common');

console.log(`\n${'='.repeat(50)}`);
console.log(`other-modules.test.js: ${passed}/${total} PASS, ${failed} FAIL`);
process.exit(failed > 0 ? 1 : 0);
