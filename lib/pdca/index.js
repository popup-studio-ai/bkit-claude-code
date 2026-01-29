/**
 * PDCA Module Entry Point
 * @module lib/pdca
 * @version 1.4.7
 */

const tier = require('./tier');
const level = require('./level');
const phase = require('./phase');
const status = require('./status');
const automation = require('./automation');

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

  // Status (17 exports)
  getPdcaStatusPath: status.getPdcaStatusPath,
  createInitialStatusV2: status.createInitialStatusV2,
  migrateStatusToV2: status.migrateStatusToV2,
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

  // Automation (9 exports)
  getAutomationLevel: automation.getAutomationLevel,
  isFullAutoMode: automation.isFullAutoMode,
  shouldAutoAdvance: automation.shouldAutoAdvance,
  generateAutoTrigger: automation.generateAutoTrigger,
  shouldAutoStartPdca: automation.shouldAutoStartPdca,
  autoAdvancePdcaPhase: automation.autoAdvancePdcaPhase,
  getHookContext: automation.getHookContext,
  emitUserPrompt: automation.emitUserPrompt,
  formatAskUserQuestion: automation.formatAskUserQuestion,
};
