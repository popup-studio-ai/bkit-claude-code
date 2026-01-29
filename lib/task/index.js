/**
 * Task Module Entry Point
 * @module lib/task
 * @version 1.4.7
 */

const classification = require('./classification');
const context = require('./context');
const creator = require('./creator');
const tracker = require('./tracker');

module.exports = {
  // Classification (6 exports)
  CLASSIFICATION_THRESHOLDS: classification.CLASSIFICATION_THRESHOLDS,
  classifyTask: classification.classifyTask,
  classifyTaskByLines: classification.classifyTaskByLines,
  getPdcaLevel: classification.getPdcaLevel,
  getPdcaGuidance: classification.getPdcaGuidance,
  getPdcaGuidanceByLevel: classification.getPdcaGuidanceByLevel,

  // Context (7 exports)
  setActiveSkill: context.setActiveSkill,
  setActiveAgent: context.setActiveAgent,
  getActiveSkill: context.getActiveSkill,
  getActiveAgent: context.getActiveAgent,
  clearActiveContext: context.clearActiveContext,
  getActiveContext: context.getActiveContext,
  hasActiveContext: context.hasActiveContext,

  // Creator (6 exports)
  generatePdcaTaskSubject: creator.generatePdcaTaskSubject,
  generatePdcaTaskDescription: creator.generatePdcaTaskDescription,
  getPdcaTaskMetadata: creator.getPdcaTaskMetadata,
  generateTaskGuidance: creator.generateTaskGuidance,
  createPdcaTaskChain: creator.createPdcaTaskChain,
  autoCreatePdcaTask: creator.autoCreatePdcaTask,

  // Tracker (7 exports)
  savePdcaTaskId: tracker.savePdcaTaskId,
  getPdcaTaskId: tracker.getPdcaTaskId,
  getTaskChainStatus: tracker.getTaskChainStatus,
  updatePdcaTaskStatus: tracker.updatePdcaTaskStatus,
  triggerNextPdcaAction: tracker.triggerNextPdcaAction,
  findPdcaStatus: tracker.findPdcaStatus,
  getCurrentPdcaPhase: tracker.getCurrentPdcaPhase,
};
