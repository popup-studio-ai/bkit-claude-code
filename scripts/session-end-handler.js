#!/usr/bin/env node
/**
 * session-end-handler.js - SessionEnd Hook Handler (ENH-132)
 * Performs cleanup when a Claude Code session ends.
 *
 * Actions:
 *  1. Flush pending backups to PLUGIN_DATA
 *  2. Save PDCA session summary to session-history.json (keep last 20)
 *  3. Generate daily audit summary
 *  4. Cleanup stale runtime data
 *
 * Input: { session_id, reason: 'clear'|'logout'|'other' }
 * Output: none (cleanup only)
 *
 * @version 2.0.0
 * @module scripts/session-end-handler
 */

const fs = require('fs');
const path = require('path');
const { readStdinSync } = require('../lib/core/io');
const { debugLog } = require('../lib/core/debug');
const { getPdcaStatusFull } = require('../lib/pdca/status');

let input;
try {
  input = readStdinSync();
} catch (e) {
  debugLog('SessionEnd', 'Failed to read stdin', { error: e.message });
  process.exit(0);
}

const sessionId = input.session_id || 'unknown';
const reason = input.reason || 'other';

debugLog('SessionEnd', 'Hook started', { sessionId, reason });

// Step 1: Flush pending backups to PLUGIN_DATA
try {
  const { backupToPluginData } = require('../lib/core/paths');
  const result = backupToPluginData();
  debugLog('SessionEnd', 'Backup flushed', result);
} catch (e) {
  debugLog('SessionEnd', 'Backup flush failed (non-critical)', { error: e.message });
}

// Step 2: Save PDCA session summary to session-history.json
try {
  const { STATE_PATHS } = require('../lib/core/paths');
  const stateDir = STATE_PATHS.state();

  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }

  const historyPath = path.join(stateDir, 'session-history.json');
  let history = [];

  if (fs.existsSync(historyPath)) {
    try {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    } catch (_) {
      history = [];
    }
  }

  const pdcaStatus = getPdcaStatusFull();
  const summary = {
    sessionId,
    reason,
    endedAt: new Date().toISOString(),
    feature: pdcaStatus ? (pdcaStatus.feature || pdcaStatus.featureName || null) : null,
    phase: pdcaStatus ? (pdcaStatus.phase || pdcaStatus.currentPhase || null) : null,
    progress: pdcaStatus ? (pdcaStatus.progress || null) : null,
  };

  history.push(summary);

  // Keep only the last 20 entries
  if (history.length > 20) {
    history = history.slice(-20);
  }

  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  debugLog('SessionEnd', 'Session summary saved', { sessionId });
} catch (e) {
  debugLog('SessionEnd', 'Session summary save failed (non-critical)', { error: e.message });
}

// Step 3: Generate daily audit summary
try {
  const { writeAuditLog } = require('../lib/audit/audit-logger');
  writeAuditLog({
    actor: 'hook',
    actorId: 'session-end-handler',
    action: 'phase_transition',
    category: 'control',
    target: sessionId,
    targetType: 'feature',
    details: { event: 'session_end', reason },
    result: 'success',
  });
  debugLog('SessionEnd', 'Audit summary written');
} catch (e) {
  debugLog('SessionEnd', 'Audit write failed (non-critical)', { error: e.message });
}

// Step 4: Cleanup stale runtime data
try {
  const { STATE_PATHS } = require('../lib/core/paths');
  const runtimeDir = STATE_PATHS.runtime();

  if (fs.existsSync(runtimeDir)) {
    const staleThreshold = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    const files = fs.readdirSync(runtimeDir);

    for (const file of files) {
      const filePath = path.join(runtimeDir, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat.isFile() && stat.mtimeMs < staleThreshold) {
          fs.unlinkSync(filePath);
          debugLog('SessionEnd', 'Stale file removed', { file });
        }
      } catch (_) { /* skip individual file errors */ }
    }
  }
} catch (e) {
  debugLog('SessionEnd', 'Cleanup failed (non-critical)', { error: e.message });
}

debugLog('SessionEnd', 'Hook completed', { sessionId, reason });
process.exit(0);
