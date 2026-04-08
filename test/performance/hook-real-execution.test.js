#!/usr/bin/env node
'use strict';

/**
 * Hook Real Execution Performance Tests
 * Tests actual execution time of critical hook scripts.
 * Uses test/helpers/hook-runner.js
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

let passed = 0, failed = 0, skipped = 0, total = 0;
function test(id, desc, fn) {
  total++;
  try { fn(); passed++; } catch (e) {
    if (e.message && e.message.startsWith('SKIP:')) {
      skipped++;
      console.log(`  SKIP ${id}: ${desc} — ${e.message}`);
    } else {
      failed++;
      console.error(`  FAIL ${id}: ${desc}\n    ${e.message}`);
    }
  }
}

console.log('\n=== Hook Real Execution Performance Tests ===\n');

const { runHook, ROOT } = require('../helpers/hook-runner');

/**
 * Helper: run a hook performance test with budget assertion
 * @param {string} script - Relative script path
 * @param {Object} payload - stdin payload
 * @param {number} budget - Time budget in ms
 * @param {number} timeout - Execution timeout in ms
 */
function hookPerfTest(id, desc, script, payload, budget, timeout) {
  test(id, desc, () => {
    const fullPath = path.join(ROOT, script);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`SKIP: ${script} not found`);
    }

    const result = runHook(script, payload, { timeout });

    // Allow non-zero exit (hook may not have required state files), but measure time
    assert.ok(
      result.duration < budget,
      `${script} took ${result.duration}ms, budget ${budget}ms`
    );
  });
}

// --- session-end-handler.js: budget 1000ms (hard limit 1500ms) ---

hookPerfTest('HRE-01', 'session-end-handler cold start <1000ms',
  'scripts/session-end-handler.js',
  { hook_event_name: 'Stop', session_id: 'test-session-001' },
  1000, 1500
);

hookPerfTest('HRE-02', 'session-end-handler with session data <1000ms',
  'scripts/session-end-handler.js',
  {
    hook_event_name: 'Stop',
    session_id: 'test-session-002',
    transcript_summary: 'Test session summary for performance measurement.',
  },
  1000, 1500
);

// --- user-prompt-handler.js: budget 1500ms (hard limit 3000ms) ---

hookPerfTest('HRE-03', 'user-prompt-handler simple prompt <1500ms',
  'scripts/user-prompt-handler.js',
  {
    hook_event_name: 'UserPrompt',
    prompt: 'show pdca status',
    session_id: 'test-session-003',
  },
  1500, 3000
);

hookPerfTest('HRE-04', 'user-prompt-handler Korean prompt <1500ms',
  'scripts/user-prompt-handler.js',
  {
    hook_event_name: 'UserPrompt',
    prompt: 'PDCA 상태 보여줘',
    session_id: 'test-session-004',
  },
  1500, 3000
);

// --- unified-stop.js: budget 5000ms (hard limit 10000ms) ---

hookPerfTest('HRE-05', 'unified-stop basic stop <5000ms',
  'scripts/unified-stop.js',
  {
    hook_event_name: 'Stop',
    stop_hook_active: true,
    session_id: 'test-session-005',
  },
  5000, 10000
);

hookPerfTest('HRE-06', 'unified-stop with reason <5000ms',
  'scripts/unified-stop.js',
  {
    hook_event_name: 'Stop',
    stop_hook_active: true,
    session_id: 'test-session-006',
    reason: 'user_request',
  },
  5000, 10000
);

// --- notification-handler.js: budget 1000ms (hard limit 2000ms) ---

hookPerfTest('HRE-07', 'notification-handler basic <1000ms',
  'scripts/notification-handler.js',
  {
    hook_event_name: 'Notification',
    message: 'Test notification',
    session_id: 'test-session-007',
  },
  1000, 2000
);

hookPerfTest('HRE-08', 'notification-handler with long message <1000ms',
  'scripts/notification-handler.js',
  {
    hook_event_name: 'Notification',
    message: 'A'.repeat(5000), // 5KB message
    session_id: 'test-session-008',
  },
  1000, 2000
);

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed, ${skipped} skipped ---`);
if (failed > 0) process.exit(1);
