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
const {
  readStdinSync,
  parseHookInput,
  debugLog,
  getActiveSkill,
  getActiveAgent,
  outputAllow
} = require('../lib/common.js');

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

// Output allow (PostToolUse doesn't block)
outputAllow('', 'PostToolUse');

debugLog('UnifiedWritePost', 'Hook completed');
