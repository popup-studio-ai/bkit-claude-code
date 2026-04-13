#!/usr/bin/env node
/**
 * task-created-handler.js — TaskCreated Hook Handler
 * Validates PDCA task naming and logs to audit.
 * ENH-156: Enhanced with PDCA phase progression tracking.
 *
 * @version 2.1.4
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
const PDCA_PATTERN = /^\[(PM|Plan|Design|Do|Check|Act|Report|Deploy|Archive)\]\s+(.+)/;
const pdcaMatch = taskSubject.match(PDCA_PATTERN);
const isPdcaTask = !!pdcaMatch;

// ENH-156: Extract PDCA phase and feature from task name
let pdcaPhase = null;
let pdcaFeature = null;

if (isPdcaTask) {
  pdcaPhase = pdcaMatch[1].toLowerCase();
  pdcaFeature = pdcaMatch[2].trim();
  debugLog('TaskCreated', 'PDCA task detected', { phase: pdcaPhase, feature: pdcaFeature });
}

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
    details: {
      taskId,
      isPdcaTask,
      pdcaPhase,
      pdcaFeature,
    },
    result: 'success',
  });
} catch (e) {
  debugLog('TaskCreated', 'Audit logging failed', { error: e.message });
}

// ENH-156: Track PDCA phase progression when a PDCA-named task is created
if (isPdcaTask && pdcaPhase && pdcaFeature) {
  const fs = require('fs');
  const path = require('path');
  const pdcaStatusPath = path.resolve(process.cwd(), '.bkit/state/pdca-status.json');

  try {
    if (fs.existsSync(pdcaStatusPath)) {
      const status = JSON.parse(fs.readFileSync(pdcaStatusPath, 'utf8'));

      // Update task tracking in PDCA status
      if (!status.taskHistory) {
        status.taskHistory = [];
      }
      status.taskHistory.push({
        taskId,
        phase: pdcaPhase,
        feature: pdcaFeature,
        createdAt: new Date().toISOString(),
      });

      // Keep only the last 50 task entries to avoid unbounded growth
      if (status.taskHistory.length > 50) {
        status.taskHistory = status.taskHistory.slice(-50);
      }

      fs.writeFileSync(pdcaStatusPath, JSON.stringify(status, null, 2), 'utf8');
      debugLog('TaskCreated', 'PDCA task history updated', {
        phase: pdcaPhase,
        feature: pdcaFeature,
        historySize: status.taskHistory.length,
      });
    }
  } catch (e) {
    // Non-critical: do not fail the hook if state update fails
    debugLog('TaskCreated', 'PDCA state update failed', { error: e.message });
  }
}

// No output needed — audit-only hook
process.exit(0);
