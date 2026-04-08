#!/usr/bin/env node
/**
 * notification-handler.js - Notification Hook Handler
 * Enriches idle notifications with PDCA context and logs to audit.
 *
 * Input: { message, title, notification_type }
 * Output: hookSpecificOutput with additionalContext (PDCA status info)
 *
 * @version 2.0.0
 * @module scripts/notification-handler
 */

const { readStdinSync, outputAllow, outputEmpty } = require('../lib/core/io');
const { debugLog } = require('../lib/core/debug');
const { getPdcaStatusFull } = require('../lib/pdca/status');

let input;
try {
  input = readStdinSync();
} catch (e) {
  debugLog('Notification', 'Failed to read stdin', { error: e.message });
  outputEmpty();
  process.exit(0);
}

const message = input.message || '';
const title = input.title || '';
const notificationType = input.notification_type || input.notificationType || '';

debugLog('Notification', 'Hook started', { notificationType, title });

// Step 1: Log notification to audit
try {
  const { writeAuditLog } = require('../lib/audit/audit-logger');
  writeAuditLog({
    actor: 'system',
    actorId: 'notification-handler',
    action: 'phase_transition',
    category: 'control',
    target: notificationType || 'notification',
    targetType: 'feature',
    details: {
      event: 'notification',
      notificationType,
      title,
      message: message.substring(0, 200),
    },
    result: 'success',
  });
} catch (e) {
  debugLog('Notification', 'Audit write failed (non-critical)', { error: e.message });
}

// Step 2: Enrich idle notifications with PDCA context
if (notificationType === 'idle_prompt') {
  try {
    const pdcaStatus = getPdcaStatusFull();
    if (pdcaStatus) {
      const feature = pdcaStatus.feature || pdcaStatus.featureName || 'none';
      const phase = pdcaStatus.phase || pdcaStatus.currentPhase || 'none';
      const progress = pdcaStatus.progress || 'unknown';

      const context = `PDCA Status: feature="${feature}", phase=${phase}, progress=${progress}. Resume work or run /pdca-status for details.`;
      outputAllow(context, 'Notification');

      debugLog('Notification', 'PDCA context enriched', { feature, phase });
      process.exit(0);
    }
  } catch (e) {
    debugLog('Notification', 'PDCA enrichment failed (non-critical)', { error: e.message });
  }
}

debugLog('Notification', 'Hook completed', { notificationType });
outputEmpty();
process.exit(0);
