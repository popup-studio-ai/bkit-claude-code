#!/usr/bin/env node
/**
 * task-created-handler.js — TaskCreated Hook Handler
 * Validates PDCA task naming and logs to audit.
 *
 * @version 2.1.0
 * @module scripts/task-created-handler
 */

const { readStdinSync } = require('../lib/core/io');
const { debugLog } = require('../lib/core/debug');

let input;
try {
  input = readStdinSync();
} catch (e) {
  process.exit(0);
}

const taskSubject = input?.task_subject || input?.subject || '';
const taskId = input?.task_id || '';

debugLog('TaskCreated', 'Task created', { taskId, subject: taskSubject });

// Validate PDCA naming convention: [Phase] feature
const PDCA_PATTERN = /^\[(PM|Plan|Design|Do|Check|Act|Report|Deploy|Archive)\]\s+/;
const isPdcaTask = PDCA_PATTERN.test(taskSubject);

// Log to audit if available
try {
  const { writeAuditLog } = require('../lib/audit/audit-logger');
  writeAuditLog({
    actor: 'hook',
    actorId: 'task-created-handler',
    action: 'task_created',
    category: 'pdca',
    target: taskSubject,
    targetType: 'task',
    details: { taskId, isPdcaTask },
    result: 'success'
  });
} catch (e) {
  debugLog('TaskCreated', 'Audit logging failed', { error: e.message });
}

// No output needed — audit-only hook
process.exit(0);
