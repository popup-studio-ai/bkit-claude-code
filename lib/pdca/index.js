/**
 * PDCA Module Entry Point
 * @module lib/pdca
 * @version 2.0.0
 */

const tier = require('./tier');
const level = require('./level');
const phase = require('./phase');
const status = require('./status');
const automation = require('./automation');
const executiveSummary = require('./executive-summary');
const templateValidator = require('./template-validator');
const stateMachine = require('./state-machine');
const fullAutoDo = require('./full-auto-do');
const featureManager = require('./feature-manager');
const batchOrchestrator = require('./batch-orchestrator');
const sessionGuide = require('./session-guide');

module.exports = {
  // Tier (8 exports)
  getLanguageTier: tier.getLanguageTier,
  getTierDescription: tier.getTierDescription,
  getTierPdcaGuidance: tier.getTierPdcaGuidance,
  isTier1: tier.isTier1,
  isTier2: tier.isTier2,
  isTier3: tier.isTier3,
  isTier4: tier.isTier4,
  isExperimentalTier: tier.isExperimentalTier,

  // Level (7 exports)
  LEVEL_PHASE_MAP: level.LEVEL_PHASE_MAP,
  detectLevel: level.detectLevel,
  canSkipPhase: level.canSkipPhase,
  getRequiredPhases: level.getRequiredPhases,
  getNextPhaseForLevel: level.getNextPhaseForLevel,
  isPhaseApplicable: level.isPhaseApplicable,
  getLevelPhaseGuide: level.getLevelPhaseGuide,

  // Phase (9 exports)
  PDCA_PHASES: phase.PDCA_PHASES,
  getPhaseNumber: phase.getPhaseNumber,
  getPhaseName: phase.getPhaseName,
  getPreviousPdcaPhase: phase.getPreviousPdcaPhase,
  getNextPdcaPhase: phase.getNextPdcaPhase,
  findDesignDoc: phase.findDesignDoc,
  findPlanDoc: phase.findPlanDoc,
  checkPhaseDeliverables: phase.checkPhaseDeliverables,
  validatePdcaTransition: phase.validatePdcaTransition,

  // Status (24 exports)
  getPdcaStatusPath: status.getPdcaStatusPath,
  createInitialStatusV2: status.createInitialStatusV2,
  migrateStatusToV2: status.migrateStatusToV2,
  migrateStatusV2toV3: status.migrateStatusV2toV3,
  initPdcaStatusIfNotExists: status.initPdcaStatusIfNotExists,
  getPdcaStatusFull: status.getPdcaStatusFull,
  loadPdcaStatus: status.loadPdcaStatus,
  savePdcaStatus: status.savePdcaStatus,
  getFeatureStatus: status.getFeatureStatus,
  updatePdcaStatus: status.updatePdcaStatus,
  addPdcaHistory: status.addPdcaHistory,
  completePdcaFeature: status.completePdcaFeature,
  setActiveFeature: status.setActiveFeature,
  addActiveFeature: status.addActiveFeature,
  removeActiveFeature: status.removeActiveFeature,
  getActiveFeatures: status.getActiveFeatures,
  switchFeatureContext: status.switchFeatureContext,
  extractFeatureFromContext: status.extractFeatureFromContext,
  readBkitMemory: status.readBkitMemory,
  writeBkitMemory: status.writeBkitMemory,
  deleteFeatureFromStatus: status.deleteFeatureFromStatus,
  enforceFeatureLimit: status.enforceFeatureLimit,
  getArchivedFeatures: status.getArchivedFeatures,
  cleanupArchivedFeatures: status.cleanupArchivedFeatures,
  archiveFeatureToSummary: status.archiveFeatureToSummary,

  // Automation (14 exports)
  getAutomationLevel: automation.getAutomationLevel,
  isFullAutoMode: automation.isFullAutoMode,
  shouldAutoAdvance: automation.shouldAutoAdvance,
  generateAutoTrigger: automation.generateAutoTrigger,
  shouldAutoStartPdca: automation.shouldAutoStartPdca,
  autoAdvancePdcaPhase: automation.autoAdvancePdcaPhase,
  getHookContext: automation.getHookContext,
  emitUserPrompt: automation.emitUserPrompt,
  formatAskUserQuestion: automation.formatAskUserQuestion,
  buildNextActionQuestion: automation.buildNextActionQuestion,
  detectPdcaFromTaskSubject: automation.detectPdcaFromTaskSubject,
  getNextPdcaActionAfterCompletion: automation.getNextPdcaActionAfterCompletion,
  generateBatchTrigger: automation.generateBatchTrigger,
  shouldSuggestBatch: automation.shouldSuggestBatch,

  // Executive Summary (3 exports)
  generateExecutiveSummary: executiveSummary.generateExecutiveSummary,
  formatExecutiveSummary: executiveSummary.formatExecutiveSummary,
  generateBatchSummary: executiveSummary.generateBatchSummary,

  // Template Validator (6 exports) - v1.6.0 ENH-103
  REQUIRED_SECTIONS: templateValidator.REQUIRED_SECTIONS,
  detectDocumentType: templateValidator.detectDocumentType,
  extractSections: templateValidator.extractSections,
  isPlanPlus: templateValidator.isPlanPlus,
  validateDocument: templateValidator.validateDocument,
  formatValidationWarning: templateValidator.formatValidationWarning,

  // State Machine (16 exports) - v2.0.0
  SM_TRANSITIONS: stateMachine.TRANSITIONS,
  SM_STATES: stateMachine.STATES,
  SM_EVENTS: stateMachine.EVENTS,
  SM_GUARDS: stateMachine.GUARDS,
  SM_ACTIONS: stateMachine.ACTIONS,
  smTransition: stateMachine.transition,
  smCanTransition: stateMachine.canTransition,
  smGetAvailableEvents: stateMachine.getAvailableEvents,
  smFindTransition: stateMachine.findTransition,
  smCreateContext: stateMachine.createContext,
  smLoadContext: stateMachine.loadContext,
  smSyncContext: stateMachine.syncContext,
  smGetNextPhaseOptions: stateMachine.getNextPhaseOptions,
  smRecordTransition: stateMachine.recordTransition,
  smPhaseToEvent: stateMachine.phaseToEvent,
  smPrintDiagram: stateMachine.printDiagram,

  // Full-Auto Do (6 exports) - v2.0.0
  parseDesignForTasks: fullAutoDo.parseDesignForTasks,
  generateImplementationPlan: fullAutoDo.generateImplementationPlan,
  executeFullAutoDo: fullAutoDo.executeFullAutoDo,
  checkFullAutoAvailability: fullAutoDo.checkFullAutoAvailability,
  evaluateCompletion: fullAutoDo.evaluateCompletion,
  getAutoDoStatus: fullAutoDo.getAutoDoStatus,

  // Feature Manager (16 exports) - v2.0.0
  FM_MAX_CONCURRENT_FEATURES: featureManager.MAX_CONCURRENT_FEATURES,
  FM_MAX_CONCURRENT_DO: featureManager.MAX_CONCURRENT_DO,
  fmGetActiveFeatures: featureManager.getActiveFeatures,
  fmCanStartFeature: featureManager.canStartFeature,
  fmRegisterFeature: featureManager.registerFeature,
  fmCheckConflict: featureManager.checkConflict,
  fmReleaseFeature: featureManager.releaseFeature,
  fmAcquireDoLock: featureManager.acquireDoLock,
  fmReleaseDoLock: featureManager.releaseDoLock,
  fmGetDoLock: featureManager.getDoLock,
  fmSetDependencies: featureManager.setDependencies,
  fmValidateDependencies: featureManager.validateDependencies,
  fmLoadFeatureWorkflow: featureManager.loadFeatureWorkflow,
  fmSaveFeatureWorkflow: featureManager.saveFeatureWorkflow,
  fmGetFeatureDashboard: featureManager.getFeatureDashboard,
  fmGetSummary: featureManager.getSummary,

  // Batch Orchestrator (6 exports) - v2.0.0
  createBatchPlan: batchOrchestrator.createBatchPlan,
  executeBatchPlan: batchOrchestrator.executeBatchPlan,
  getBatchStatus: batchOrchestrator.getBatchStatus,
  cancelBatch: batchOrchestrator.cancelBatch,
  triggerAutoCheck: batchOrchestrator.triggerAutoCheck,
  resumeBatch: batchOrchestrator.resumeBatch,

  // Session Guide (8 exports) - v2.0.5
  extractContextAnchor: sessionGuide.extractContextAnchor,
  formatContextAnchor: sessionGuide.formatContextAnchor,
  analyzeModules: sessionGuide.analyzeModules,
  suggestSessions: sessionGuide.suggestSessions,
  formatSessionPlan: sessionGuide.formatSessionPlan,
  formatModuleMap: sessionGuide.formatModuleMap,
  filterByScope: sessionGuide.filterByScope,
  parseDoArgs: sessionGuide.parseDoArgs,
};
