#!/usr/bin/env node
/**
 * stop-failure-handler.js - StopFailure Hook Handler (ENH-118)
 * Handles API errors (rate limit, auth failure, server error) that cause turn termination
 *
 * @version 2.1.10
 * @module scripts/stop-failure-handler
 */

const fs = require('fs');
const path = require('path');
const { readStdinSync, outputAllow } = require('../lib/core/io');
const { debugLog } = require('../lib/core/debug');
const { getPdcaStatusFull } = require('../lib/pdca/status');

let input;
try {
  input = readStdinSync();
} catch (e) {
  debugLog('StopFailure', 'Failed to read stdin', { error: e.message });
  process.exit(0);
}

// v2.1.12 Sprint A-2 (defect #14 fix): enrich error context capture.
// Previously, all 13+ entries had errorType/category/agentId all 'unknown' or
// null because CC StopFailure payload schema does not always include
// error_type / error_message / agent_id at top-level. We now:
//   (1) Try multiple field paths (top-level + nested message.*)
//   (2) Capture parseStatus + parseWarnings to surface fallback usage
//   (3) Use sessionHash fallback when agentId absent
const errorType = input.error_type || input.errorType
  || (input.message && input.message.error_type)
  || (input.error && input.error.type)
  || 'unknown';
let errorMessage = input.error_message || input.errorMessage;
if (!errorMessage && typeof input.message === 'string') errorMessage = input.message;
if (!errorMessage && input.message && typeof input.message === 'object') {
  // Anthropic API error format: input.message.content[0].text or input.error.message
  const msgContent = input.message.content;
  if (Array.isArray(msgContent) && msgContent[0] && typeof msgContent[0].text === 'string') {
    errorMessage = msgContent[0].text;
  } else if (input.error && typeof input.error.message === 'string') {
    errorMessage = input.error.message;
  }
}
errorMessage = errorMessage || '';
const agentId = input.agent_id || (input.message && input.message.agent_id) || null;
const agentType = input.agent_type || (input.message && input.message.agent_type) || null;
const sessionId = input.session_id || (input.message && input.message.session_id) || null;

// parseStatus: surface payload health for downstream postmortem
const hasUsefulFields = (errorType !== 'unknown') || errorMessage.length > 0 || agentId || agentType;
const parseStatus = !input || Object.keys(input).length === 0
  ? 'no_input'
  : hasUsefulFields ? 'ok' : 'partial';
const parseWarnings = parseStatus === 'no_input'
  ? 'StopFailure hook invoked with empty stdin payload'
  : (parseStatus === 'partial'
      ? `StopFailure payload missing useful fields (keys: ${Object.keys(input).join(',')})`
      : null);

debugLog('StopFailure', 'Hook started', {
  errorType,
  errorMessage: errorMessage.substring(0, 200),
  agentId,
  agentType,
  parseStatus,
  parseWarnings,
  sessionId,
});

// Step 1: Classify error
function classifyError(type, message) {
  const msg = (message || '').toLowerCase();

  if (msg.includes('rate limit') || msg.includes('429') || msg.includes('too many requests')) {
    return {
      category: 'rate_limit',
      severity: 'medium',
      recovery: 'Wait 30-60 seconds and retry. Consider reducing parallel agent count.',
    };
  }

  if (msg.includes('auth') || msg.includes('401') || msg.includes('unauthorized') || msg.includes('api key')) {
    return {
      category: 'auth_failure',
      severity: 'high',
      recovery: 'Check API key validity. Run `claude auth status` to verify.',
    };
  }

  if (msg.includes('500') || msg.includes('server error') || msg.includes('internal')) {
    return {
      category: 'server_error',
      severity: 'medium',
      recovery: 'Anthropic API temporary issue. Wait 1-2 minutes and retry.',
    };
  }

  if (msg.includes('529') || msg.includes('overloaded')) {
    return {
      category: 'overloaded',
      severity: 'medium',
      recovery: 'API overloaded. Wait 2-5 minutes and retry.',
    };
  }

  if (msg.includes('timeout') || msg.includes('timed out')) {
    return {
      category: 'timeout',
      severity: 'low',
      recovery: 'Request timed out. Retry with smaller context or simpler prompt.',
    };
  }

  if (msg.includes('context') || msg.includes('token') || msg.includes('too long')) {
    return {
      category: 'context_overflow',
      severity: 'medium',
      recovery: 'Context too large. Run /clear and reload essential context.',
    };
  }

  return {
    category: 'unknown',
    severity: 'low',
    recovery: 'Unexpected error. Check `claude doctor` for diagnostics.',
  };
}

const classification = classifyError(errorType, errorMessage);

// M9 fix (audit): capture (don't swallow) a failure to persist the error log so
// it can be surfaced in the user-visible guidance below. The catch stays non-fatal
// (a Stop hook must never block the user's turn) — but the failure is no longer
// invisible: it propagates into the guidance message the user already sees.
let errorLogWriteError = null;

// Step 2: Log error to runtime directory
try {
  const { STATE_PATHS } = require('../lib/core/paths');
  const runtimeDir = STATE_PATHS.runtime();

  if (!fs.existsSync(runtimeDir)) {
    fs.mkdirSync(runtimeDir, { recursive: true });
  }

  const errorLogPath = path.join(runtimeDir, 'error-log.json');

  // v2.1.12 Sprint A-2 (#14): include parseStatus + parseWarnings + sessionId
  // for downstream postmortem (silent garbage-in surface).
  const entry = {
    timestamp: new Date().toISOString(),
    errorType,
    category: classification.category,
    severity: classification.severity,
    agentId,
    agentType,
    sessionId,
    message: errorMessage.substring(0, 500),
    parseStatus,
    parseWarnings,
  };

  // H6 fix (audit): locked RMW of the error log so a concurrent Stop-failure or a
  // mid-write SIGKILL can't truncate/clobber it. read→push→slice→write is now
  // atomic (lockedUpdate = lock across the modifier + tmp+rename write).
  const { lockedUpdate } = require('../lib/core/state-store');
  lockedUpdate(errorLogPath, (raw) => {
    let errorLog = Array.isArray(raw) ? raw : [];
    errorLog.push(entry);
    if (errorLog.length > 50) {
      errorLog = errorLog.slice(-50);
    }
    return errorLog;
  });
} catch (e) {
  // M9 fix (audit): record for user-visible surfacing instead of debugLog-only.
  errorLogWriteError = e.message;
  debugLog('StopFailure', 'Error logging failed', { error: e.message });
}

// Step 3: Save emergency PDCA backup
try {
  const pdcaStatus = getPdcaStatusFull();
  if (pdcaStatus) {
    const { backupToPluginData } = require('../lib/core/paths');
    backupToPluginData();
    debugLog('StopFailure', 'Emergency backup saved');
  }
} catch (_) { /* non-critical */ }

// Step 4: Generate recovery guidance
let guidance = `API Error: ${classification.category}. `;
guidance += `${classification.recovery} `;

if (agentId) {
  guidance += `Affected agent: ${agentId}. `;
}

if (agentType === 'teammate' || agentId === 'cto-lead') {
  guidance += `CTO Team: Consider ctrl+f to stop affected agents, then check team status.`;
}

// M9 fix (audit): surface a critical state-persistence failure in the user-visible
// guidance instead of leaving it debugLog-only. This Stop hook fires precisely
// when something already went wrong; hiding an error-log write failure on top of
// that would leave the user with no record and no signal that persistence broke.
if (errorLogWriteError) {
  guidance += `\n\n[Warning] bkit could not persist this error to its runtime log (${errorLogWriteError}). The in-memory diagnostic above is all that was captured.`;
}

outputAllow(guidance, 'StopFailure');

debugLog('StopFailure', 'Hook completed', {
  category: classification.category,
  severity: classification.severity,
  agentId
});
