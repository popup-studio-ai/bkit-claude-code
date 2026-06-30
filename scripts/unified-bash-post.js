#!/usr/bin/env node
/**
 * unified-bash-post.js - Unified Bash PostToolUse Handler (v1.4.4)
 *
 * GitHub Issue #9354 Workaround:
 * Consolidates Bash PostToolUse hooks from:
 * - qa-monitor: qa-monitor-post.js
 */

const { readStdinSync, parseHookInput, outputAllow } = require('../lib/core/io');
const { debugLog } = require('../lib/core/debug');
const { getActiveSkill, getActiveAgent } = require('../lib/task/context');
// C7/C8 (audit): atomic+locked reachability ping via the shared state-store, and
// a single BKIT_VERSION source so all three reachability writers stamp the same value.
const { lockedUpdate } = require('../lib/core/state-store');
const { BKIT_VERSION } = require('../lib/core/version');

// M10 fix (audit): the layer-6 auditPostHoc call below is intentionally
// fire-and-forget (PostToolUse must not block tool flow), so it is not awaited.
// A rejection that resolves AFTER the synchronous hook body completes would
// surface as a process-level unhandled-rejection. This guard swallows those —
// the .catch() on the call handles the in-flight case; this handles the
// post-tick case — keeping observability-only failures from polluting stderr.
process.on('unhandledRejection', (_reason) => { /* observability-only — see M10 */ });

// ============================================================
// Handler: qa-monitor-post (Bash)
// ============================================================

/**
 * QA monitor Bash command tracking
 * @param {Object} input - Hook input
 * @returns {boolean} True if executed
 */
function handleQaMonitorBashPost(input) {
  const { command } = parseHookInput(input);
  if (!command) return false;

  // Log docker/curl commands for QA analysis
  const qaRelevantPatterns = ['docker', 'curl', 'npm test', 'jest', 'pytest', 'go test'];

  for (const pattern of qaRelevantPatterns) {
    if (command.includes(pattern)) {
      debugLog('UnifiedBashPost', 'QA relevant command executed', {
        pattern,
        command: command.substring(0, 100)
      });
      break;
    }
  }

  return true;
}

// ============================================================
// Main Execution
// ============================================================

debugLog('UnifiedBashPost', 'Hook started');

// Read hook context
let input = {};
try {
  input = readStdinSync();
  if (typeof input === 'string') {
    input = JSON.parse(input);
  }
} catch (e) {
  debugLog('UnifiedBashPost', 'Failed to parse input', { error: e.message });
}

// Get current context
const activeSkill = getActiveSkill();
const activeAgent = getActiveAgent();

debugLog('UnifiedBashPost', 'Context', { activeSkill, activeAgent });

// Only qa-monitor has Bash PostToolUse handler
if (activeAgent === 'qa-monitor') {
  handleQaMonitorBashPost(input);
}

// v2.0.0: Audit logging for bash commands
try {
  const toolInput = input.tool_input || {};
  const command = toolInput.command || '';
  const audit = require('../lib/audit/audit-logger');
  audit.writeAuditLog({
    actor: 'system', actorId: 'unified-bash-post',
    action: 'command_executed',
    category: 'bash',
    target: command.substring(0, 200), targetType: 'command',
    result: 'success', destructiveOperation: false
  });
} catch (_) {}

// v2.0.0: Loop detection for repeated commands
try {
  const toolInput = input.tool_input || {};
  const command = toolInput.command || '';
  const lb = require('../lib/control/loop-breaker');
  lb.recordAction('bash_command', command.substring(0, 100));
  const loopCheck = lb.checkLoop();
  if (loopCheck.detected) {
    debugLog('UnifiedBashPost', 'Loop detected in bash commands', {
      command: command.substring(0, 100), details: loopCheck
    });
  }
} catch (_) {}

// ============================================================
// v2.1.14 Sub-Sprint 2: PostToolUse Layer-6 Tier 1 audit (ENH-289 #2)
// + continueOnBlock deny-reason emission (ENH-303 #5)
//
// Runs after loop-breaker recordAction so the same input is observed by both
// the loop guard and the layer-6 classifier. Fail-silent in all branches —
// PostToolUse never blocks normal tool flow today; this hook only widens
// observability + sets up the auto-rollback decision at L4.
//
// Reachability ping (MON-CC-NEW-PLUGIN-HOOK-DROP): touch the reachability
// state file so SessionStart can detect silent CC plugin-hook drops.
// ============================================================
try {
  const toolInput = input.tool_input || {};
  const toolOutput = input.tool_response || input.tool_output || {};
  const layer6Mod = require('../lib/defense/layer-6-audit');
  const auditLogger = require('../lib/audit/audit-logger');
  let checkpointMgr = null;
  try { checkpointMgr = require('../lib/control/checkpoint-manager'); } catch (_) { /* graceful */ }
  let ac = null;
  try { ac = require('../lib/control/automation-controller'); } catch (_) { /* graceful */ }
  const trustLevel = (() => {
    try { const lv = ac && ac.getCurrentLevel(); return typeof lv === 'string' ? lv : (lv != null ? `L${lv}` : 'L2'); }
    catch (_) { return 'L2'; }
  })();
  if (checkpointMgr) {
    const layer6 = layer6Mod.createLayer6Audit({
      audit: auditLogger,
      checkpoint: checkpointMgr,
      trustLevelProvider: () => trustLevel,
      // suppress console.warn in hook context — audit-logger captures it
      warn: () => {},
    });
    // Fire-and-forget; PostToolUse must not await beyond timeout budget
    layer6.auditPostHoc({
      tool: 'Bash',
      toolInput,
      toolOutput,
      feature: input.feature || (input.context && input.context.feature),
      phase: input.phase || (input.context && input.context.phase),
    }).catch(() => { /* graceful */ });
  }
} catch (_) { /* layer-6 unavailable — fail-open */ }

// Reachability ping — atomic+locked RMW so concurrent hook fires never lose a
// stamp (C7), stamped with the single BKIT_VERSION source (C8).
try {
  const path = require('path');
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const file = path.join(root, '.bkit', 'runtime', 'hook-reachability.json');
  lockedUpdate(file, (state) => {
    const next = state && typeof state === 'object' ? state : {};
    next.bash_post = { ts: new Date().toISOString(), version: BKIT_VERSION };
    return next;
  });
} catch (_) { /* graceful — reachability ping is best-effort */ }

// Output allow (PostToolUse doesn't block normal flow)
// v2.1.14 ENH-303: emit hookSpecificOutput with continueOnBlock=true and
// audit reason for any downstream block decisions. PostToolUse outputAllow
// already produces the minimal envelope; the layer-6-audit alarm/rollback
// path emits its own audit log entries via auditLogger.
outputAllow('', 'PostToolUse');

debugLog('UnifiedBashPost', 'Hook completed');
