/**
 * Intent Module Entry Point
 * @module lib/intent
 * @version 1.4.7
 */

const language = require('./language');
const trigger = require('./trigger');
const ambiguity = require('./ambiguity');

module.exports = {
  // Language (6 exports)
  SUPPORTED_LANGUAGES: language.SUPPORTED_LANGUAGES,
  AGENT_TRIGGER_PATTERNS: language.AGENT_TRIGGER_PATTERNS,
  SKILL_TRIGGER_PATTERNS: language.SKILL_TRIGGER_PATTERNS,
  detectLanguage: language.detectLanguage,
  getAllPatterns: language.getAllPatterns,
  matchMultiLangPattern: language.matchMultiLangPattern,

  // Trigger (5 exports)
  NEW_FEATURE_PATTERNS: trigger.NEW_FEATURE_PATTERNS,
  matchImplicitAgentTrigger: trigger.matchImplicitAgentTrigger,
  matchImplicitSkillTrigger: trigger.matchImplicitSkillTrigger,
  detectNewFeatureIntent: trigger.detectNewFeatureIntent,
  extractFeatureNameFromRequest: trigger.extractFeatureNameFromRequest,

  // Ambiguity (8 exports)
  containsFilePath: ambiguity.containsFilePath,
  containsTechnicalTerms: ambiguity.containsTechnicalTerms,
  hasSpecificNouns: ambiguity.hasSpecificNouns,
  hasScopeDefinition: ambiguity.hasScopeDefinition,
  hasMultipleInterpretations: ambiguity.hasMultipleInterpretations,
  detectContextConflicts: ambiguity.detectContextConflicts,
  calculateAmbiguityScore: ambiguity.calculateAmbiguityScore,
  generateClarifyingQuestions: ambiguity.generateClarifyingQuestions,
};
