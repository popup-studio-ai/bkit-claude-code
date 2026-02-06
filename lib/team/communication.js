/**
 * Team Communication Module
 * @module lib/team/communication
 * @version 1.5.1
 *
 * Teammate message structure and routing logic.
 * Actual communication is handled by Claude Code's TeammateTool.
 * This module provides message format and routing logic.
 */

const { debugLog } = require('../core/debug');

/**
 * Valid message types
 * @type {string[]}
 */
const MESSAGE_TYPES = [
  'task_assignment',
  'review_request',
  'approval',
  'rejection',
  'phase_transition',
  'status_update',
  'directive',
  'info',
];

/**
 * Create a message structure for teammate communication
 * @param {string} fromRole - Sender role (e.g., 'cto')
 * @param {string} toRole - Receiver role (e.g., 'developer')
 * @param {string} messageType - Message type
 * @param {Object} payload - Message content
 * @param {string} payload.subject - Message subject
 * @param {string} payload.body - Message body
 * @param {string} [payload.feature] - Related feature
 * @param {string} [payload.phase] - Related PDCA phase
 * @param {string[]} [payload.references] - Reference document paths
 * @returns {Object} { from, to, type, payload, timestamp }
 */
function createMessage(fromRole, toRole, messageType, payload) {
  if (!MESSAGE_TYPES.includes(messageType)) {
    debugLog('Communication', 'Invalid message type', { messageType });
    return null;
  }

  const message = {
    from: fromRole,
    to: toRole,
    type: messageType,
    payload: {
      subject: payload.subject || '',
      body: payload.body || '',
      feature: payload.feature || null,
      phase: payload.phase || null,
      references: payload.references || [],
    },
    timestamp: new Date().toISOString(),
  };

  debugLog('Communication', 'Message created', {
    from: fromRole,
    to: toRole,
    type: messageType,
  });

  return message;
}

/**
 * Create a broadcast message for all teammates
 * @param {string} fromRole - Sender role
 * @param {string} messageType - Message type
 * @param {Object} payload - Message content
 * @returns {Object} { from, to: 'all', type, payload, timestamp }
 */
function createBroadcast(fromRole, messageType, payload) {
  const message = createMessage(fromRole, 'all', messageType, payload);
  if (message) {
    debugLog('Communication', 'Broadcast created', {
      from: fromRole,
      type: messageType,
    });
  }
  return message;
}

/**
 * Create a PDCA phase transition notice
 * @param {string} feature - Feature name
 * @param {string} fromPhase - Previous phase
 * @param {string} toPhase - Next phase
 * @param {Object} [context] - Additional context (matchRate, issues, etc.)
 * @returns {Object} Broadcast message
 */
function createPhaseTransitionNotice(feature, fromPhase, toPhase, context = {}) {
  const payload = {
    subject: `Phase Transition: ${fromPhase} → ${toPhase}`,
    body: `Feature "${feature}" is moving from ${fromPhase} to ${toPhase} phase.`,
    feature,
    phase: toPhase,
  };

  if (context.matchRate != null) {
    payload.body += ` Current match rate: ${context.matchRate}%.`;
  }
  if (context.issues) {
    payload.body += ` Open issues: ${context.issues}.`;
  }

  return createBroadcast('cto', 'phase_transition', payload);
}

/**
 * Create a Plan approval/rejection message
 * @param {string} teammateRole - Role that submitted the Plan
 * @param {boolean} approved - Whether approved
 * @param {string} [feedback] - Feedback message
 * @returns {Object} Approval/rejection message
 */
function createPlanDecision(teammateRole, approved, feedback) {
  const messageType = approved ? 'approval' : 'rejection';
  const payload = {
    subject: approved ? 'Plan Approved' : 'Plan Rejected',
    body: feedback || (approved ? 'Your plan has been approved. Proceed with execution.' : 'Please revise your plan based on the feedback.'),
  };

  return createMessage('cto', teammateRole, messageType, payload);
}

/**
 * Create a CTO directive message
 * @param {string} toRole - Target role
 * @param {string} directive - Directive content
 * @param {Object} [context] - Related documents, references, etc.
 * @returns {Object} Directive message
 */
function createDirective(toRole, directive, context = {}) {
  const payload = {
    subject: 'CTO Directive',
    body: directive,
    feature: context.feature || null,
    phase: context.phase || null,
    references: context.references || [],
  };

  return createMessage('cto', toRole, 'directive', payload);
}

module.exports = {
  MESSAGE_TYPES,
  createMessage,
  createBroadcast,
  createPhaseTransitionNotice,
  createPlanDecision,
  createDirective,
};
