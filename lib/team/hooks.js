/**
 * Team Hooks Module
 * @module lib/team/hooks
 * @version 1.5.1
 *
 * TaskCompleted/TeammateIdle hook integration with Team Mode.
 * Enhanced with orchestrator, communication, and task-queue integration.
 */

const { isTeamModeAvailable, getTeamConfig } = require('./coordinator');

/**
 * Assign next teammate work after TaskCompleted
 * @param {string} completedPhase - Completed PDCA phase
 * @param {string} feature - Feature name
 * @param {string} level - Project level
 * @returns {Object|null} teammate assignment with execution context
 */
function assignNextTeammateWork(completedPhase, feature, level) {
  if (!isTeamModeAvailable()) return null;

  const { TEAM_STRATEGIES } = require('./strategy');
  const strategy = TEAM_STRATEGIES[level];
  if (!strategy) return null;

  // Phase transition map
  const nextPhaseMap = {
    plan: 'design',
    design: 'do',
    do: 'check',
    check: 'act',
    act: 'check',
  };

  const nextPhase = nextPhaseMap[completedPhase];
  if (!nextPhase) return null;

  // Load orchestration modules
  let orchestrator = null;
  let communication = null;
  let taskQueue = null;
  try {
    orchestrator = require('./orchestrator');
    communication = require('./communication');
    taskQueue = require('./task-queue');
  } catch (e) {
    // Fallback to basic behavior if modules not available
    const phaseMode = strategy.phaseStrategy[nextPhase];
    if (phaseMode === 'single') return null;

    const assignedRoles = strategy.roles.filter(
      role => role.phases.includes(nextPhase)
    );
    if (assignedRoles.length === 0) return null;

    return {
      nextPhase,
      mode: phaseMode,
      roles: assignedRoles,
      feature,
    };
  }

  // Enhanced behavior with orchestrator
  const needsRecompose = orchestrator.shouldRecomposeTeam(completedPhase, nextPhase, level);
  const team = orchestrator.composeTeamForPhase(nextPhase, level, feature);
  if (!team || !team.teammates || team.teammates.length === 0) {
    // Single mode or no teammates for this phase
    return null;
  }

  const tasks = taskQueue.createTeamTasks(nextPhase, feature, team.teammates);
  const notice = communication.createPhaseTransitionNotice(feature, completedPhase, nextPhase);
  const context = orchestrator.createPhaseContext(nextPhase, feature, { level });

  return {
    nextPhase,
    team,
    tasks,
    notice,
    context,
    needsRecompose,
  };
}

/**
 * Handle TeammateIdle event with task-queue lookup
 * @param {string} teammateId
 * @param {Object} pdcaStatus
 * @returns {Object|null} next work assignment
 */
function handleTeammateIdle(teammateId, pdcaStatus) {
  if (!isTeamModeAvailable()) return null;

  const primaryFeature = pdcaStatus?.primaryFeature;
  if (!primaryFeature) return null;

  const featureData = pdcaStatus?.features?.[primaryFeature];
  if (!featureData) return null;

  // Try to find next available task from task-queue
  let nextTask = null;
  try {
    const taskQueue = require('./task-queue');
    nextTask = taskQueue.findNextAvailableTask(teammateId, primaryFeature);
  } catch (e) {
    // Graceful fallback
  }

  return {
    teammateId,
    feature: primaryFeature,
    currentPhase: featureData.phase,
    nextTask,
    suggestion: nextTask
      ? `Assigned task: ${nextTask.subject}`
      : `No pending tasks. Wait for phase transition or check TaskList.`,
  };
}

module.exports = {
  assignNextTeammateWork,
  handleTeammateIdle,
};
