/**
 * Team Task Queue Module
 * @module lib/team/task-queue
 * @version 1.5.1
 *
 * PDCA phase-based team task management with Task System integration.
 */

const { debugLog } = require('../core/debug');

// Lazy require to avoid circular dependency
let _taskCreator = null;
function getTaskCreator() {
  if (!_taskCreator) {
    _taskCreator = require('../task/creator');
  }
  return _taskCreator;
}

let _taskTracker = null;
function getTaskTracker() {
  if (!_taskTracker) {
    _taskTracker = require('../task/tracker');
  }
  return _taskTracker;
}

/**
 * In-memory task assignments for the current session
 * @type {Map<string, Object>}
 */
const taskAssignments = new Map();

/**
 * Create team tasks for a PDCA phase
 * @param {string} phase - PDCA phase
 * @param {string} feature - Feature name
 * @param {Array<Object>} teammates - composeTeamForPhase() teammates array
 * @returns {Array<Object>} Task definitions per teammate
 *   [{role, subject, description, metadata, dependencies}]
 */
function createTeamTasks(phase, feature, teammates) {
  if (!teammates || teammates.length === 0) return [];

  const phaseIcon = { plan: '📋', design: '📐', do: '🔨', check: '🔍', act: '🔄' };
  const icon = phaseIcon[phase] || '📌';
  const tasks = [];

  for (const teammate of teammates) {
    const role = teammate.name || teammate.role;
    const subject = `[${phase.charAt(0).toUpperCase() + phase.slice(1)}] ${feature} - ${role}: ${teammate.task || phase}`;
    const description = teammate.task
      ? `${teammate.task}\n\nFeature: ${feature}\nPhase: ${phase}\nAgent: ${teammate.agentType || 'auto'}`
      : `Execute ${phase} phase work for ${feature} as ${role}`;

    const taskDef = {
      role,
      subject: `${icon} ${subject}`,
      description,
      metadata: {
        feature,
        phase,
        role,
        agentType: teammate.agentType || null,
        teamTask: true,
      },
      dependencies: [],
    };

    tasks.push(taskDef);
    debugLog('TaskQueue', 'Team task created', { role, phase, feature });
  }

  return tasks;
}

/**
 * Assign a task to a specific role
 * @param {string} taskId - Task ID
 * @param {string} role - Target role
 * @param {string} feature - Feature name
 * @param {string} phase - PDCA phase
 * @returns {Object} { taskId, role, feature, phase, assignedAt }
 */
function assignTaskToRole(taskId, role, feature, phase) {
  const assignment = {
    taskId,
    role,
    feature,
    phase,
    assignedAt: new Date().toISOString(),
    status: 'assigned',
  };

  const key = `${feature}:${phase}:${role}`;
  taskAssignments.set(key, assignment);

  debugLog('TaskQueue', 'Task assigned to role', { taskId, role, feature, phase });
  return assignment;
}

/**
 * Get team progress for a feature/phase
 * @param {string} feature - Feature name
 * @param {string} phase - PDCA phase
 * @returns {Object} { total, completed, inProgress, pending, completionRate }
 */
function getTeamProgress(feature, phase) {
  let total = 0;
  let completed = 0;
  let inProgress = 0;
  let pending = 0;

  for (const [key, assignment] of taskAssignments.entries()) {
    if (key.startsWith(`${feature}:${phase}:`)) {
      total++;
      if (assignment.status === 'completed') completed++;
      else if (assignment.status === 'in_progress') inProgress++;
      else pending++;
    }
  }

  return {
    total,
    completed,
    inProgress,
    pending,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

/**
 * Find next available task for an idle teammate
 * @param {string} role - Idle teammate's role
 * @param {string} feature - Feature name
 * @returns {Object|null} Next task or null
 */
function findNextAvailableTask(role, feature) {
  for (const [key, assignment] of taskAssignments.entries()) {
    if (
      key.includes(`:${role}`) &&
      assignment.feature === feature &&
      assignment.status === 'assigned'
    ) {
      return {
        taskId: assignment.taskId,
        subject: `Continue ${assignment.phase} work for ${feature}`,
        role: assignment.role,
        phase: assignment.phase,
        feature: assignment.feature,
      };
    }
  }

  // Check for any unassigned tasks for this feature
  for (const [key, assignment] of taskAssignments.entries()) {
    if (
      assignment.feature === feature &&
      assignment.status === 'assigned' &&
      !assignment.claimedBy
    ) {
      return {
        taskId: assignment.taskId,
        subject: `Available ${assignment.phase} task for ${feature}`,
        role: assignment.role,
        phase: assignment.phase,
        feature: assignment.feature,
      };
    }
  }

  return null;
}

/**
 * Check if a phase is complete
 * @param {string} feature - Feature name
 * @param {string} phase - PDCA phase
 * @returns {boolean}
 */
function isPhaseComplete(feature, phase) {
  const progress = getTeamProgress(feature, phase);
  return progress.total > 0 && progress.completed === progress.total;
}

module.exports = {
  createTeamTasks,
  assignTaskToRole,
  getTeamProgress,
  findNextAvailableTask,
  isPhaseComplete,
};
