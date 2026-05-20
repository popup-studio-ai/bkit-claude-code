'use strict';
/**
 * Unit Tests for lib/intent/trigger.js
 * 40 TC | console.assert based | no external dependencies
 */

let mod;
try {
  mod = require('../../lib/intent/trigger');
} catch (e) {
  console.error('Module load failed:', e.message);
  process.exit(1);
}

let lang;
try {
  lang = require('../../lib/intent/language');
} catch (e) {
  console.error('Language module load failed:', e.message);
  process.exit(1);
}

let passed = 0, failed = 0, total = 0;

function assert(id, condition, message) {
  total++;
  if (condition) { passed++; console.log(`  PASS: ${id} - ${message}`); }
  else { failed++; console.error(`  FAIL: ${id} - ${message}`); }
}

console.log('\n=== trigger.test.js ===\n');

// --- Exports ---
assert('U-TRG-001', typeof mod.matchImplicitAgentTrigger === 'function', 'matchImplicitAgentTrigger exported');
assert('U-TRG-002', typeof mod.matchImplicitSkillTrigger === 'function', 'matchImplicitSkillTrigger exported');
assert('U-TRG-003', typeof mod.detectNewFeatureIntent === 'function', 'detectNewFeatureIntent exported');
assert('U-TRG-004', typeof mod.extractFeatureNameFromRequest === 'function', 'extractFeatureNameFromRequest exported');
assert('U-TRG-005', typeof mod.NEW_FEATURE_PATTERNS === 'object', 'NEW_FEATURE_PATTERNS exported');

// --- matchImplicitAgentTrigger: 8 language triggers ---
// EN
const enResult = mod.matchImplicitAgentTrigger('please verify this code');
assert('U-TRG-006', enResult !== null && enResult.agent.includes('gap-detector'), 'EN: verify -> gap-detector');

// KO
const koResult = mod.matchImplicitAgentTrigger('코드 검증해줘');
assert('U-TRG-007', koResult !== null && koResult.agent.includes('gap-detector'), 'KO: 검증 -> gap-detector');

// JA
const jaResult = mod.matchImplicitAgentTrigger('コードを検証してください');
assert('U-TRG-008', jaResult !== null && jaResult.agent.includes('gap-detector'), 'JA: 検証 -> gap-detector');

// ZH
const zhResult = mod.matchImplicitAgentTrigger('请验证代码');
assert('U-TRG-009', zhResult !== null && zhResult.agent.includes('gap-detector'), 'ZH: 验证 -> gap-detector');

// ES
const esResult = mod.matchImplicitAgentTrigger('verificar el codigo');
assert('U-TRG-010', esResult !== null && esResult.agent.includes('gap-detector'), 'ES: verificar -> gap-detector');

// FR
const frResult = mod.matchImplicitAgentTrigger('veuillez vérifier le code');
assert('U-TRG-011', frResult !== null && frResult.agent.includes('gap-detector'), 'FR: verifier -> gap-detector');

// DE
const deResult = mod.matchImplicitAgentTrigger('bitte den Code prüfen');
assert('U-TRG-012', deResult !== null && deResult.agent.includes('gap-detector'), 'DE: prufen -> gap-detector');

// IT
const itResult = mod.matchImplicitAgentTrigger('per favore verificare il codice');
assert('U-TRG-013', itResult !== null && itResult.agent.includes('gap-detector'), 'IT: verificare -> gap-detector');

// --- confidence threshold ---
assert('U-TRG-014', enResult !== null && enResult.confidence >= 0.7, 'Confidence >= confidenceThreshold (0.7)');
assert('U-TRG-015', enResult !== null && enResult.confidence <= 1.0, 'Confidence <= 1.0 (Math.min cap)');
// v2.1.16 hardening: Math.min(1, 0.7+0.1) = 0.7999999999999999 (JS floating
// point), but matchImplicitAgentTrigger returns the clean literal 0.8. The
// === comparison fails despite equal mathematical value. Use epsilon comparison.
assert('U-TRG-016', enResult !== null && Math.abs(enResult.confidence - 0.8) < 1e-9, 'Confidence ≈ 0.8 (= threshold+0.1, capped at 1, within ε)');

// --- Null returns ---
assert('U-TRG-017', mod.matchImplicitAgentTrigger(null) === null, 'Null input returns null');
assert('U-TRG-018', mod.matchImplicitAgentTrigger('') === null, 'Empty string returns null');
assert('U-TRG-019', mod.matchImplicitAgentTrigger('random gibberish xyz') === null, 'No match returns null');

// --- Other agents ---
const improveResult = mod.matchImplicitAgentTrigger('improve the code');
assert('U-TRG-020', improveResult !== null && improveResult.agent.includes('pdca-iterator'), 'improve -> pdca-iterator');

const analyzeResult = mod.matchImplicitAgentTrigger('analyze code quality');
assert('U-TRG-021', analyzeResult !== null && analyzeResult.agent.includes('code-analyzer'), 'analyze -> code-analyzer');

const reportResult = mod.matchImplicitAgentTrigger('give me a report');
assert('U-TRG-022', reportResult !== null && reportResult.agent.includes('report-generator'), 'report -> report-generator');

const helpResult = mod.matchImplicitAgentTrigger('help me please');
assert('U-TRG-023', helpResult !== null && helpResult.agent.includes('starter-guide'), 'help -> starter-guide');

const teamResult = mod.matchImplicitAgentTrigger('coordinate team for this');
assert('U-TRG-024', teamResult !== null && teamResult.agent.includes('cto-lead'), 'team -> cto-lead');

// --- matchImplicitSkillTrigger ---
const starterSkill = mod.matchImplicitSkillTrigger('build a landing page');
assert('U-TRG-025', starterSkill !== null && starterSkill.skill.includes('starter'), 'landing page -> starter skill');
assert('U-TRG-026', starterSkill !== null && starterSkill.level === 'Starter', 'Starter skill has Starter level');

const dynamicSkill = mod.matchImplicitSkillTrigger('add login authentication');
assert('U-TRG-027', dynamicSkill !== null && dynamicSkill.skill.includes('dynamic'), 'login -> dynamic skill');
assert('U-TRG-028', dynamicSkill !== null && dynamicSkill.level === 'Dynamic', 'Dynamic skill has Dynamic level');

const enterpriseSkill = mod.matchImplicitSkillTrigger('setup kubernetes cluster');
assert('U-TRG-029', enterpriseSkill !== null && enterpriseSkill.skill.includes('enterprise'), 'kubernetes -> enterprise');
assert('U-TRG-030', enterpriseSkill !== null && enterpriseSkill.level === 'Enterprise', 'Enterprise level');

const mobileSkill = mod.matchImplicitSkillTrigger('build a mobile app with react native');
assert('U-TRG-031', mobileSkill !== null && mobileSkill.skill.includes('mobile-app'), 'mobile app -> mobile-app');
assert('U-TRG-032', mobileSkill !== null && mobileSkill.level === 'Dynamic', 'mobile-app level is Dynamic');

assert('U-TRG-033', mod.matchImplicitSkillTrigger(null) === null, 'Null returns null for skill trigger');
assert('U-TRG-034', mod.matchImplicitSkillTrigger('') === null, 'Empty returns null for skill trigger');

// --- detectNewFeatureIntent ---
const feat1 = mod.detectNewFeatureIntent('create a new feature called "auth-system"');
assert('U-TRG-035', feat1.isNewFeature === true, 'New feature detected');
assert('U-TRG-036', feat1.featureName === 'auth-system', 'Feature name extracted from called pattern');
assert('U-TRG-037', feat1.confidence === 0.9, 'Confidence 0.9 when name found');

const feat2 = mod.detectNewFeatureIntent('implement something');
assert('U-TRG-038', feat2.isNewFeature === true, 'implement triggers new feature');

const feat3 = mod.detectNewFeatureIntent(null);
assert('U-TRG-039', feat3.isNewFeature === false && feat3.confidence === 0, 'Null returns no feature');

// --- extractFeatureNameFromRequest ---
assert('U-TRG-040', mod.extractFeatureNameFromRequest('feature "user-auth"') === 'user-auth', 'Extract from feature "name"');
assert('U-TRG-041', mod.extractFeatureNameFromRequest('called my-feature') === 'my-feature', 'Extract from called pattern');
assert('U-TRG-042', mod.extractFeatureNameFromRequest('implement payment') === 'payment', 'Extract from implement pattern');
assert('U-TRG-043', mod.extractFeatureNameFromRequest(null) === null, 'Null returns null');
assert('U-TRG-044', mod.extractFeatureNameFromRequest('random words xyz abc') === null, 'No feature returns null');

console.log(`\n${'='.repeat(50)}`);
console.log(`trigger.test.js: ${passed}/${total} PASS, ${failed} FAIL`);
process.exit(failed > 0 ? 1 : 0);
