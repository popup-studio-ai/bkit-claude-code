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

// v2.1.13: Sprint task naming convention — emitted by sprint-master-planner
// usecase via deps.taskCreator: "Sprint <id>: <name>".
const SPRINT_PATTERN = /^Sprint\s+([a-z][a-z0-9-]*[a-z0-9])\s*:\s*(.+)/;
const sprintMatch = taskSubject.match(SPRINT_PATTERN);
const isSprintTask = !!sprintMatch;
let sprintId = null;
let sprintName = null;
if (isSprintTask) {
  sprintId = sprintMatch[1];
  sprintName = sprintMatch[2].trim();
  debugLog('TaskCreated', 'Sprint task detected', { sprintId, sprintName });
}

// Log to audit if available
try {
  const { writeAuditLog } = require('../lib/audit/audit-logger');
  writeAuditLog({
    actor: 'hook',
    actorId: 'task-created-handler',
    action: 'task_created',
    category: isSprintTask ? 'sprint' : 'pdca',
    target: taskSubject,
    targetType: 'task',
    details: {
      taskId,
      isPdcaTask,
      pdcaPhase,
      pdcaFeature,
      isSprintTask,
      sprintId,
      sprintName,
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
      // H7 fix (audit): locked RMW on the PDCA source-of-truth. The old read→push
      // →writeFileSync could clobber concurrent status updates (and a SIGKILL
      // truncated pdca-status.json — the very file gating phase transitions).
      // lockedUpdate serializes the RMW and writes atomically (tmp+rename).
      const { lockedUpdate } = require('../lib/core/state-store');
      let historySize = 0;
      lockedUpdate(pdcaStatusPath, (raw) => {
        const status = raw && typeof raw === 'object' ? raw : {};

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

        historySize = status.taskHistory.length;
        return status;
      });
      debugLog('TaskCreated', 'PDCA task history updated', {
        phase: pdcaPhase,
        feature: pdcaFeature,
        historySize,
      });
    }
  } catch (e) {
    // M9 fix (audit): non-fatal (never fail task creation), but no longer silent.
    // debugLog is BKIT_DEBUG-gated and thus invisible to most users; write a
    // concise warning to stderr so CC surfaces it, while keeping process.exit(0)
    // so the hook never blocks task creation. Critical PDCA tracking state that
    // fails to persist should be visible, not buried in a debug stream.
    debugLog('TaskCreated', 'PDCA state update failed', { error: e.message });
    try {
      process.stderr.write(
        `[bkit] Warning: could not update PDCA task history for phase "${pdcaPhase}" `
        + `(feature "${pdcaFeature}"): ${e.message}. PDCA phase tracking may be stale.\n`
      );
    } catch (_) { /* stderr itself unavailable — nothing more we can do */ }
  }
}

// No output needed — audit-only hook
process.exit(0);
