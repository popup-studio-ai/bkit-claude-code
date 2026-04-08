#!/usr/bin/env node
'use strict';
/**
 * Unit Tests for stop-failure-handler.js
 * 15 TC | StopFailure hook handler error classification and recovery
 *
 * @version bkit v1.6.2
 */

const path = require('path');
const fs = require('fs');
const { assert, skip, summary, reset } = require('../helpers/assert');
reset();

const BASE_DIR = path.resolve(__dirname, '../..');
const SCRIPTS_DIR = path.join(BASE_DIR, 'scripts');

console.log('\n=== stop-failure.test.js (15 TC) ===\n');

// ============================================================
// Section 1: Script & Dependencies (2 TC)
// ============================================================
console.log('\n--- Section 1: Script & Dependencies ---');

// SF-01: stop-failure-handler.js file exists
const scriptPath = path.join(SCRIPTS_DIR, 'stop-failure-handler.js');
assert('SF-01', fs.existsSync(scriptPath), 'stop-failure-handler.js file exists');

// SF-02: core module dependency functions exist (v2.1.0: split from common.js)
let coreIo, coreDebug, pdcaStatus;
try {
  coreIo = require('../../lib/core/io');
  coreDebug = require('../../lib/core/debug');
  pdcaStatus = require('../../lib/pdca/status');
} catch (e) {
  coreIo = null;
}
assert('SF-02',
  coreIo &&
  typeof coreIo.readStdinSync === 'function' &&
  typeof coreDebug.debugLog === 'function' &&
  typeof pdcaStatus.getPdcaStatusFull === 'function' &&
  typeof coreIo.outputAllow === 'function',
  'common.js has readStdinSync, debugLog, getPdcaStatusFull, outputAllow'
);

// ============================================================
// Section 2: Error Classification (7 TC)
// ============================================================
console.log('\n--- Section 2: Error Classification ---');

// Replicate classifyError logic from stop-failure-handler.js for unit testing
function classifyError(type, message) {
  const msg = (message || '').toLowerCase();

  if (msg.includes('rate limit') || msg.includes('429') || msg.includes('too many requests')) {
    return { category: 'rate_limit', severity: 'medium' };
  }
  if (msg.includes('auth') || msg.includes('401') || msg.includes('unauthorized') || msg.includes('api key')) {
    return { category: 'auth_failure', severity: 'high' };
  }
  if (msg.includes('500') || msg.includes('server error') || msg.includes('internal')) {
    return { category: 'server_error', severity: 'medium' };
  }
  if (msg.includes('529') || msg.includes('overloaded')) {
    return { category: 'overloaded', severity: 'medium' };
  }
  if (msg.includes('timeout') || msg.includes('timed out')) {
    return { category: 'timeout', severity: 'low' };
  }
  if (msg.includes('context') || msg.includes('token') || msg.includes('too long')) {
    return { category: 'context_overflow', severity: 'medium' };
  }
  return { category: 'unknown', severity: 'low' };
}

// SF-03: rate_limit classification
const rl = classifyError('error', 'Rate limit exceeded 429');
assert('SF-03',
  rl.category === 'rate_limit' && rl.severity === 'medium',
  'rate limit -> category: rate_limit, severity: medium'
);

// SF-04: auth_failure classification
const af = classifyError('error', '401 Unauthorized access');
assert('SF-04',
  af.category === 'auth_failure' && af.severity === 'high',
  '401 unauthorized -> category: auth_failure, severity: high'
);

// SF-05: server_error classification
const se = classifyError('error', '500 Internal Server Error');
assert('SF-05',
  se.category === 'server_error' && se.severity === 'medium',
  '500 server error -> category: server_error, severity: medium'
);

// SF-06: overloaded classification
const ol = classifyError('error', '529 API overloaded');
assert('SF-06',
  ol.category === 'overloaded' && ol.severity === 'medium',
  '529 overloaded -> category: overloaded, severity: medium'
);

// SF-07: timeout classification
const to = classifyError('error', 'Request timed out after 30s');
assert('SF-07',
  to.category === 'timeout' && to.severity === 'low',
  'timeout -> category: timeout, severity: low'
);

// SF-08: context_overflow classification
const co = classifyError('error', 'Context too long, exceeds token limit');
assert('SF-08',
  co.category === 'context_overflow' && co.severity === 'medium',
  'context too long -> category: context_overflow, severity: medium'
);

// SF-09: unknown classification
const uk = classifyError('error', 'something completely unexpected xyz');
assert('SF-09',
  uk.category === 'unknown' && uk.severity === 'low',
  'unknown error xyz -> category: unknown, severity: low'
);

// ============================================================
// Section 3: Error Logging (3 TC)
// ============================================================
console.log('\n--- Section 3: Error Logging ---');

const scriptContent = fs.readFileSync(scriptPath, 'utf8');

// SF-10: Error log max 50 entries
assert('SF-10',
  scriptContent.includes('errorLog.length > 50') && scriptContent.includes('.slice(-50)'),
  'Error log is capped at 50 entries (slice(-50))'
);

// SF-11: Log entry structure includes required fields
const hasTimestamp = scriptContent.includes('timestamp:');
const hasErrorType = scriptContent.includes('errorType');
const hasCategory = scriptContent.includes('category:');
const hasSeverity = scriptContent.includes('severity:');
const hasAgentId = scriptContent.includes('agentId');
assert('SF-11',
  hasTimestamp && hasErrorType && hasCategory && hasSeverity && hasAgentId,
  'Log entry includes timestamp, errorType, category, severity, agentId'
);

// SF-12: Error message truncated to 500 chars
assert('SF-12',
  scriptContent.includes('.substring(0, 500)'),
  'Error message truncated to 500 characters'
);

// ============================================================
// Section 4: Emergency Backup (2 TC)
// ============================================================
console.log('\n--- Section 4: Emergency Backup ---');

// SF-13: StopFailure triggers backupToPluginData
assert('SF-13',
  scriptContent.includes('backupToPluginData') && scriptContent.includes('Emergency backup'),
  'Script calls backupToPluginData() on StopFailure'
);

// SF-14: backup skipped when pdcaStatus is null
assert('SF-14',
  scriptContent.includes('if (pdcaStatus)') || scriptContent.includes('pdcaStatus &&'),
  'Script skips backup when pdcaStatus is null'
);

// ============================================================
// Section 5: Recovery Guidance (1 TC)
// ============================================================
console.log('\n--- Section 5: Recovery Guidance ---');

// SF-15: CTO Team guidance for teammate agent type
assert('SF-15',
  scriptContent.includes("agentType === 'teammate'") && scriptContent.includes('CTO Team'),
  'Script provides CTO Team guidance for teammate agent type'
);

summary('StopFailure Unit Tests');
