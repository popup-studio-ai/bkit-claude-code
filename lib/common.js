/**
 * bkit Common Module - Migration Bridge
 * @module lib/common
 * @version 1.5.0
 *
 * This file serves as a backward compatibility bridge.
 * All functions are now modularized into 4 directories:
 * - lib/core: Platform, cache, I/O, debug, config, file utilities
 * - lib/pdca: Tier, level, phase, status, automation
 * - lib/intent: Language detection, triggers, ambiguity analysis
 * - lib/task: Classification, context, creator, tracker
 *
 * For new code, prefer importing from specific modules:
 *   const { debugLog, getConfig } = require('./core');
 *   const { getPdcaStatusFull } = require('./pdca');
 */

// Import all modules
const core = require('./core');
const pdca = require('./pdca');
const intent = require('./intent');
const task = require('./task');

// Re-export everything for backward compatibility
module.exports = {
  // ============================================
  // Core Module (37 exports)
  // ============================================

  // Platform (9 exports - isGeminiCli removed in v1.5.0)
  detectPlatform: core.detectPlatform,
  BKIT_PLATFORM: core.BKIT_PLATFORM,
  isClaudeCode: core.isClaudeCode,
  PLUGIN_ROOT: core.PLUGIN_ROOT,
  PROJECT_DIR: core.PROJECT_DIR,
  BKIT_PROJECT_DIR: core.BKIT_PROJECT_DIR,
  getPluginPath: core.getPluginPath,
  getProjectPath: core.getProjectPath,
  getTemplatePath: core.getTemplatePath,

  // Cache (7 exports)
  get: core.get,
  set: core.set,
  invalidate: core.invalidate,
  clear: core.clear,
  globalCache: core.globalCache,
  _cache: core._cache,
  DEFAULT_TTL: core.DEFAULT_TTL,

  // I/O (9 exports)
  MAX_CONTEXT_LENGTH: core.MAX_CONTEXT_LENGTH,
  truncateContext: core.truncateContext,
  readStdinSync: core.readStdinSync,
  readStdin: core.readStdin,
  parseHookInput: core.parseHookInput,
  outputAllow: core.outputAllow,
  outputBlock: core.outputBlock,
  outputEmpty: core.outputEmpty,
  xmlSafeOutput: core.xmlSafeOutput,

  // Debug (3 exports)
  DEBUG_LOG_PATHS: core.DEBUG_LOG_PATHS,
  getDebugLogPath: core.getDebugLogPath,
  debugLog: core.debugLog,

  // Config (5 exports)
  loadConfig: core.loadConfig,
  getConfig: core.getConfig,
  getConfigArray: core.getConfigArray,
  getBkitConfig: core.getBkitConfig,
  safeJsonParse: core.safeJsonParse,

  // File (8 exports)
  TIER_EXTENSIONS: core.TIER_EXTENSIONS,
  DEFAULT_EXCLUDE_PATTERNS: core.DEFAULT_EXCLUDE_PATTERNS,
  DEFAULT_FEATURE_PATTERNS: core.DEFAULT_FEATURE_PATTERNS,
  isSourceFile: core.isSourceFile,
  isCodeFile: core.isCodeFile,
  isUiFile: core.isUiFile,
  isEnvFile: core.isEnvFile,
  extractFeature: core.extractFeature,

  // ============================================
  // PDCA Module (50 exports)
  // ============================================

  // Tier (8 exports)
  getLanguageTier: pdca.getLanguageTier,
  getTierDescription: pdca.getTierDescription,
  getTierPdcaGuidance: pdca.getTierPdcaGuidance,
  isTier1: pdca.isTier1,
  isTier2: pdca.isTier2,
  isTier3: pdca.isTier3,
  isTier4: pdca.isTier4,
  isExperimentalTier: pdca.isExperimentalTier,

  // Level (7 exports)
  LEVEL_PHASE_MAP: pdca.LEVEL_PHASE_MAP,
  detectLevel: pdca.detectLevel,
  canSkipPhase: pdca.canSkipPhase,
  getRequiredPhases: pdca.getRequiredPhases,
  getNextPhaseForLevel: pdca.getNextPhaseForLevel,
  isPhaseApplicable: pdca.isPhaseApplicable,
  getLevelPhaseGuide: pdca.getLevelPhaseGuide,

  // Phase (9 exports)
  PDCA_PHASES: pdca.PDCA_PHASES,
  getPhaseNumber: pdca.getPhaseNumber,
  getPhaseName: pdca.getPhaseName,
  getPreviousPdcaPhase: pdca.getPreviousPdcaPhase,
  getNextPdcaPhase: pdca.getNextPdcaPhase,
  findDesignDoc: pdca.findDesignDoc,
  findPlanDoc: pdca.findPlanDoc,
  checkPhaseDeliverables: pdca.checkPhaseDeliverables,
  validatePdcaTransition: pdca.validatePdcaTransition,

  // Status (17 exports)
  getPdcaStatusPath: pdca.getPdcaStatusPath,
  createInitialStatusV2: pdca.createInitialStatusV2,
  migrateStatusToV2: pdca.migrateStatusToV2,
  initPdcaStatusIfNotExists: pdca.initPdcaStatusIfNotExists,
  getPdcaStatusFull: pdca.getPdcaStatusFull,
  loadPdcaStatus: pdca.loadPdcaStatus,
  savePdcaStatus: pdca.savePdcaStatus,
  getFeatureStatus: pdca.getFeatureStatus,
  updatePdcaStatus: pdca.updatePdcaStatus,
  addPdcaHistory: pdca.addPdcaHistory,
  completePdcaFeature: pdca.completePdcaFeature,
  setActiveFeature: pdca.setActiveFeature,
  addActiveFeature: pdca.addActiveFeature,
  removeActiveFeature: pdca.removeActiveFeature,
  getActiveFeatures: pdca.getActiveFeatures,
  switchFeatureContext: pdca.switchFeatureContext,
  extractFeatureFromContext: pdca.extractFeatureFromContext,

  // Automation (9 exports)
  getAutomationLevel: pdca.getAutomationLevel,
  isFullAutoMode: pdca.isFullAutoMode,
  shouldAutoAdvance: pdca.shouldAutoAdvance,
  generateAutoTrigger: pdca.generateAutoTrigger,
  shouldAutoStartPdca: pdca.shouldAutoStartPdca,
  autoAdvancePdcaPhase: pdca.autoAdvancePdcaPhase,
  getHookContext: pdca.getHookContext,
  emitUserPrompt: pdca.emitUserPrompt,
  formatAskUserQuestion: pdca.formatAskUserQuestion,

  // ============================================
  // Intent Module (19 exports)
  // ============================================

  // Language (6 exports)
  SUPPORTED_LANGUAGES: intent.SUPPORTED_LANGUAGES,
  AGENT_TRIGGER_PATTERNS: intent.AGENT_TRIGGER_PATTERNS,
  SKILL_TRIGGER_PATTERNS: intent.SKILL_TRIGGER_PATTERNS,
  detectLanguage: intent.detectLanguage,
  getAllPatterns: intent.getAllPatterns,
  matchMultiLangPattern: intent.matchMultiLangPattern,

  // Trigger (5 exports)
  NEW_FEATURE_PATTERNS: intent.NEW_FEATURE_PATTERNS,
  matchImplicitAgentTrigger: intent.matchImplicitAgentTrigger,
  matchImplicitSkillTrigger: intent.matchImplicitSkillTrigger,
  detectNewFeatureIntent: intent.detectNewFeatureIntent,
  extractFeatureNameFromRequest: intent.extractFeatureNameFromRequest,

  // Ambiguity (8 exports)
  containsFilePath: intent.containsFilePath,
  containsTechnicalTerms: intent.containsTechnicalTerms,
  hasSpecificNouns: intent.hasSpecificNouns,
  hasScopeDefinition: intent.hasScopeDefinition,
  hasMultipleInterpretations: intent.hasMultipleInterpretations,
  detectContextConflicts: intent.detectContextConflicts,
  calculateAmbiguityScore: intent.calculateAmbiguityScore,
  generateClarifyingQuestions: intent.generateClarifyingQuestions,

  // ============================================
  // Task Module (26 exports)
  // ============================================

  // Classification (6 exports)
  CLASSIFICATION_THRESHOLDS: task.CLASSIFICATION_THRESHOLDS,
  classifyTask: task.classifyTask,
  classifyTaskByLines: task.classifyTaskByLines,
  getPdcaLevel: task.getPdcaLevel,
  getPdcaGuidance: task.getPdcaGuidance,
  getPdcaGuidanceByLevel: task.getPdcaGuidanceByLevel,

  // Context (7 exports)
  setActiveSkill: task.setActiveSkill,
  setActiveAgent: task.setActiveAgent,
  getActiveSkill: task.getActiveSkill,
  getActiveAgent: task.getActiveAgent,
  clearActiveContext: task.clearActiveContext,
  getActiveContext: task.getActiveContext,
  hasActiveContext: task.hasActiveContext,

  // Creator (6 exports)
  generatePdcaTaskSubject: task.generatePdcaTaskSubject,
  generatePdcaTaskDescription: task.generatePdcaTaskDescription,
  getPdcaTaskMetadata: task.getPdcaTaskMetadata,
  generateTaskGuidance: task.generateTaskGuidance,
  createPdcaTaskChain: task.createPdcaTaskChain,
  autoCreatePdcaTask: task.autoCreatePdcaTask,

  // Tracker (7 exports)
  savePdcaTaskId: task.savePdcaTaskId,
  getPdcaTaskId: task.getPdcaTaskId,
  getTaskChainStatus: task.getTaskChainStatus,
  updatePdcaTaskStatus: task.updatePdcaTaskStatus,
  triggerNextPdcaAction: task.triggerNextPdcaAction,
  findPdcaStatus: task.findPdcaStatus,
  getCurrentPdcaPhase: task.getCurrentPdcaPhase,
};
