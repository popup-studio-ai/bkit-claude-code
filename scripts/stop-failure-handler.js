#!/usr/bin/env node
/**
 * stop-failure-handler.js - StopFailure Hook Handler (ENH-118)
 * Handles API errors (rate limit, auth failure, server error) that cause turn termination
 *
 * @version 1.6.2
 * @module scripts/stop-failure-handler
 */

const fs = require('fs');
const path = require('path');
const {
  readStdinSync,
  debugLog,
  getPdcaStatusFull,
  outputAllow
} = require('../lib/common.js');

let input;
try {
  input = readStdinSync();
} catch (e) {
  debugLog('StopFailure', 'Failed to read stdin', { error: e.message });
  process.exit(0);
}

const errorType = input.error_type || input.errorType || 'unknown';
const errorMessage = input.error_message || input.errorMessage || input.message || '';
const agentId = input.agent_id || null;
const agentType = input.agent_type || null;

debugLog('StopFailure', 'Hook started', {
  errorType,
  errorMessage: errorMessage.substring(0, 200),
  agentId,
  agentType
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

// Step 2: Log error to runtime directory
try {
  const { STATE_PATHS } = require('../lib/core/paths');
  const runtimeDir = STATE_PATHS.runtime();

  if (!fs.existsSync(runtimeDir)) {
    fs.mkdirSync(runtimeDir, { recursive: true });
  }

  const errorLogPath = path.join(runtimeDir, 'error-log.json');
  let errorLog = [];

  if (fs.existsSync(errorLogPath)) {
    try {
      errorLog = JSON.parse(fs.readFileSync(errorLogPath, 'utf8'));
    } catch (_) {
      errorLog = [];
    }
  }

  errorLog.push({
    timestamp: new Date().toISOString(),
    errorType,
    category: classification.category,
    severity: classification.severity,
    agentId,
    agentType,
    message: errorMessage.substring(0, 500)
  });

  if (errorLog.length > 50) {
    errorLog = errorLog.slice(-50);
  }

  fs.writeFileSync(errorLogPath, JSON.stringify(errorLog, null, 2));
} catch (e) {
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

outputAllow(guidance, 'StopFailure');

debugLog('StopFailure', 'Hook completed', {
  category: classification.category,
  severity: classification.severity,
  agentId
});
