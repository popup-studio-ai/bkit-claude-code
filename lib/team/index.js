/**
 * Team Module Entry Point
 * @module lib/team
 * @version 1.5.1
 *
 * CTO-Led Team with orchestration, communication, task-queue, and CTO logic.
 */

const coordinator = require('./coordinator');
const strategy = require('./strategy');
const hooks = require('./hooks');
const orchestrator = require('./orchestrator');
const communication = require('./communication');
const taskQueue = require('./task-queue');
const ctoLogic = require('./cto-logic');

module.exports = {
  // Coordinator (5 exports)
  isTeamModeAvailable: coordinator.isTeamModeAvailable,
  getTeamConfig: coordinator.getTeamConfig,
  generateTeamStrategy: coordinator.generateTeamStrategy,
  formatTeamStatus: coordinator.formatTeamStatus,
  suggestTeamMode: coordinator.suggestTeamMode,

  // Strategy (2 exports)
  TEAM_STRATEGIES: strategy.TEAM_STRATEGIES,
  getTeammateRoles: strategy.getTeammateRoles,

  // Hooks (2 exports)
  assignNextTeammateWork: hooks.assignNextTeammateWork,
  handleTeammateIdle: hooks.handleTeammateIdle,

  // Orchestrator (5 exports)
  PHASE_PATTERN_MAP: orchestrator.PHASE_PATTERN_MAP,
  selectOrchestrationPattern: orchestrator.selectOrchestrationPattern,
  composeTeamForPhase: orchestrator.composeTeamForPhase,
  generateSpawnTeamCommand: orchestrator.generateSpawnTeamCommand,
  createPhaseContext: orchestrator.createPhaseContext,
  shouldRecomposeTeam: orchestrator.shouldRecomposeTeam,

  // Communication (5 exports + MESSAGE_TYPES)
  MESSAGE_TYPES: communication.MESSAGE_TYPES,
  createMessage: communication.createMessage,
  createBroadcast: communication.createBroadcast,
  createPhaseTransitionNotice: communication.createPhaseTransitionNotice,
  createPlanDecision: communication.createPlanDecision,
  createDirective: communication.createDirective,

  // Task Queue (5 exports)
  createTeamTasks: taskQueue.createTeamTasks,
  assignTaskToRole: taskQueue.assignTaskToRole,
  getTeamProgress: taskQueue.getTeamProgress,
  findNextAvailableTask: taskQueue.findNextAvailableTask,
  isPhaseComplete: taskQueue.isPhaseComplete,

  // CTO Logic (5 exports)
  decidePdcaPhase: ctoLogic.decidePdcaPhase,
  evaluateDocument: ctoLogic.evaluateDocument,
  evaluateCheckResults: ctoLogic.evaluateCheckResults,
  selectAgentsForRole: ctoLogic.selectAgentsForRole,
  recommendTeamComposition: ctoLogic.recommendTeamComposition,
};
