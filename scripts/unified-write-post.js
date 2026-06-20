#!/usr/bin/env node
/**
 * unified-write-post.js - Unified Write PostToolUse Handler (v1.4.4)
 *
 * GitHub Issue #9354 Workaround:
 * Consolidates Write PostToolUse hooks from:
 * - bkit-rules: pdca-post-write.js (always runs)
 * - phase-5-design-system: phase5-design-post.js
 * - phase-6-ui-integration: phase6-ui-post.js
 * - qa-monitor: qa-monitor-post.js
 */

const path = require('path');
const fs = require('fs');
const { readStdinSync, parseHookInput, outputAllow } = require('../lib/core/io');
const { debugLog } = require('../lib/core/debug');
const { getActiveSkill, getActiveAgent } = require('../lib/task/context');
const { validateDocument, formatValidationWarning } = require('../lib/pdca/template-validator.js');

// ============================================================
// Handler: pdca-post-write (always runs - core bkit-rules)
// ============================================================

/**
 * PDCA post-write handler - always runs for PDCA tracking
 * @param {Object} input - Hook input
 * @returns {boolean} True if executed
 */
function handlePdcaPostWrite(input) {
  try {
    // Call existing pdca-post-write.js
    const handlerPath = path.join(__dirname, 'pdca-post-write.js');
    const handler = require(handlerPath);

    if (typeof handler.run === 'function') {
      handler.run(input);
    }
    // If self-executing, it already ran when required
    return true;
  } catch (e) {
    debugLog('UnifiedWritePost', 'pdca-post-write failed', { error: e.message });
    return false;
  }
}

// ============================================================
// Handler: phase5-design-post
// ============================================================

/**
 * Phase 5 design system component tracking
 * @param {Object} input - Hook input
 * @param {string} filePath - Written file path
 * @returns {boolean} True if executed
 */
function handlePhase5DesignPost(input, filePath) {
  if (!filePath) return false;

  // Track component files for design system
  if (filePath.includes('components/') || filePath.includes('design-system/')) {
    debugLog('UnifiedWritePost', 'Design system component written', { filePath });

    // Additional phase-5 specific logic could go here:
    // - Update component registry
    // - Validate design token usage
    // - Check naming conventions
  }
  return true;
}

// ============================================================
// Handler: phase6-ui-post
// ============================================================

/**
 * Phase 6 UI integration tracking
 * @param {Object} input - Hook input
 * @param {string} filePath - Written file path
 * @returns {boolean} True if executed
 */
function handlePhase6UiPost(input, filePath) {
  if (!filePath) return false;

  // Track UI page/component files
  if (filePath.includes('pages/') || filePath.includes('app/') || filePath.includes('views/')) {
    debugLog('UnifiedWritePost', 'UI page written', { filePath });

    // Additional phase-6 specific logic could go here:
    // - Validate API integration patterns
    // - Check state management usage
    // - Verify error handling
  }
  return true;
}

// ============================================================
// Handler: qa-monitor-post (Write)
// ============================================================

/**
 * QA monitor write tracking
 * @param {Object} input - Hook input
 * @param {string} filePath - Written file path
 * @returns {boolean} True if executed
 */
function handleQaMonitorPost(input, filePath) {
  if (!filePath) return false;

  debugLog('UnifiedWritePost', 'QA monitor: file written', { filePath });

  // QA-specific tracking:
  // - Log file changes for test verification
  // - Track test file modifications
  return true;
}

// ============================================================
// Main Execution
// ============================================================

debugLog('UnifiedWritePost', 'Hook started');

// Read hook context
let input = {};
try {
  input = readStdinSync();
  if (typeof input === 'string') {
    input = JSON.parse(input);
  }
} catch (e) {
  debugLog('UnifiedWritePost', 'Failed to parse input', { error: e.message });
}

// Parse file path from input
const { filePath } = parseHookInput(input);

// Get current context
const activeSkill = getActiveSkill();
const activeAgent = getActiveAgent();

debugLog('UnifiedWritePost', 'Context', { activeSkill, activeAgent, filePath });

// v2.1.14 Sub-Sprint 2: Reachability ping (MON-CC-NEW-PLUGIN-HOOK-DROP).
// SessionStart compares the ts of each PostToolUse stamp to detect silent
// CC plugin-hook drops (#57317 5-streak surface). MUST fire on EVERY
// invocation — including the template-validation failure path below that
// calls process.exit(0). When this ping lived at the END of the hook, that
// exit path skipped it: a written PDCA doc failing template validation
// recorded no write_post stamp, so write_post could go stale and trip a
// false missing=[write_post] warning. Ping first, work second. (Symmetric
// with scripts/skill-post.js, which carried the same gating bug on its
// skip path; scripts/unified-bash-post.js has no early exit so its
// end-of-hook ping is already unconditional.)
try {
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const dir = path.join(root, '.bkit', 'runtime');
  const file = path.join(dir, 'hook-reachability.json');
  fs.mkdirSync(dir, { recursive: true });
  let state = {};
  try { state = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { state = {}; }
  state.write_post = { ts: new Date().toISOString(), version: '2.1.14' };
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tmp, file);
} catch (_) { /* graceful */ }

// Always run PDCA post-write (core bkit-rules functionality)
handlePdcaPostWrite(input);

// Conditional handlers based on active skill/agent
if (activeSkill === 'phase-5-design-system') {
  handlePhase5DesignPost(input, filePath);
}

if (activeSkill === 'phase-6-ui-integration') {
  handlePhase6UiPost(input, filePath);
}

if (activeAgent === 'qa-monitor') {
  handleQaMonitorPost(input, filePath);
}

// v1.6.0 ENH-103: PDCA template validation
if (filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = validateDocument(filePath, content);

    if (!result.valid && result.missing.length > 0) {
      const warning = formatValidationWarning(result);
      debugLog('UnifiedWritePost', 'Template validation failed', {
        filePath, type: result.type, missing: result.missing
      });
      outputAllow(warning, 'PostToolUse');
      debugLog('UnifiedWritePost', 'Hook completed with template warning');
      process.exit(0);
    }
  } catch (e) {
    debugLog('UnifiedWritePost', 'Template validation error', { error: e.message });
  }
}

// v2.0.0: Audit logging for file write
try {
  const toolInput = input.tool_input || {};
  const audit = require('../lib/audit/audit-logger');
  audit.writeAuditLog({
    actor: 'system', actorId: 'unified-write-post',
    action: toolInput.file_path ? 'file_modified' : 'file_created',
    category: 'file',
    target: toolInput.file_path || '', targetType: 'file',
    result: 'success', destructiveOperation: false
  });
} catch (_) {}

// v2.0.0: Loop detection for repeated file edits
try {
  const toolInput = input.tool_input || {};
  const lb = require('../lib/control/loop-breaker');
  lb.recordAction('file_edit', toolInput.file_path || 'unknown');
  const loopCheck = lb.checkLoop();
  if (loopCheck.detected) {
    debugLog('UnifiedWritePost', 'Loop detected in file edits', {
      target: toolInput.file_path, details: loopCheck
    });
  }
} catch (_) {}

// v2.0.0: Metrics update if PDCA feature is active
try {
  const { getPdcaStatusFull } = require('../lib/pdca/status');
  const pdcaStatus = getPdcaStatusFull();
  if (pdcaStatus && pdcaStatus.currentFeature) {
    const mc = require('../lib/quality/metrics-collector');
    mc.collectMetric('file_change_count', pdcaStatus.currentFeature, 1, 'unified-write-post');
  }
} catch (_) {}

// ============================================================
// v2.1.14 Sub-Sprint 2: PostToolUse Layer-6 Tier 1 audit (ENH-289 #2)
// + reachability ping (MON-CC-NEW-PLUGIN-HOOK-DROP)
// Symmetric with scripts/unified-bash-post.js — see that file for rationale.
// ============================================================
try {
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
      warn: () => {},
    });
    layer6.auditPostHoc({
      tool: input.tool_name || 'Write',
      toolInput: input.tool_input || {},
      toolOutput: input.tool_response || input.tool_output || {},
      feature: input.feature || (input.context && input.context.feature),
      phase: input.phase || (input.context && input.context.phase),
    }).catch(() => { /* graceful */ });
  }
} catch (_) { /* graceful */ }

// Output allow (PostToolUse doesn't block)
outputAllow('', 'PostToolUse');

debugLog('UnifiedWritePost', 'Hook completed');
