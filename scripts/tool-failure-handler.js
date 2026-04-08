#!/usr/bin/env node
/**
 * tool-failure-handler.js - PostToolUseFailure Hook Handler
 * Analyzes tool failures, records error patterns, and provides recovery guidance.
 *
 * Input: { tool_name, tool_input, error, is_interrupt }
 * Output: hookSpecificOutput with additionalContext (recovery guidance)
 *
 * @version 2.0.0
 * @module scripts/tool-failure-handler
 */

const fs = require('fs');
const path = require('path');
const { readStdinSync, outputAllow, outputEmpty } = require('../lib/core/io');
const { debugLog } = require('../lib/core/debug');

let input;
try {
  input = readStdinSync();
} catch (e) {
  debugLog('ToolFailure', 'Failed to read stdin', { error: e.message });
  outputEmpty();
  process.exit(0);
}

const toolName = input.tool_name || input.toolName || 'unknown';
const toolInput = input.tool_input || input.toolInput || {};
const errorMsg = input.error || input.errorMessage || '';
const isInterrupt = input.is_interrupt || false;

debugLog('ToolFailure', 'Hook started', {
  toolName,
  error: String(errorMsg).substring(0, 200),
  isInterrupt,
});

// Step 1: Classify failure pattern
function classifyFailure(tool, error, input) {
  const err = String(error).toLowerCase();

  if (err.includes('permission denied') || err.includes('eacces') || err.includes('eperm')) {
    return {
      pattern: 'permission_denied',
      severity: 'medium',
      recovery: `Permission denied for ${tool}. Check file permissions or run from correct directory.`,
    };
  }

  if (err.includes('command not found') || err.includes('enoent') && tool === 'Bash') {
    const cmd = (typeof input === 'object' && input.command) ? input.command.split(' ')[0] : 'unknown';
    return {
      pattern: 'command_not_found',
      severity: 'low',
      recovery: `Command "${cmd}" not found. Check if it is installed and in PATH.`,
    };
  }

  if (err.includes('no such file') || err.includes('enoent') || err.includes('file not found')) {
    return {
      pattern: 'file_not_found',
      severity: 'low',
      recovery: `File not found. Verify the path exists before attempting ${tool}.`,
    };
  }

  if (err.includes('exit code') || err.includes('non-zero') || err.includes('exit status')) {
    return {
      pattern: 'exit_nonzero',
      severity: 'low',
      recovery: `${tool} command exited with non-zero status. Review the error output above.`,
    };
  }

  if (err.includes('timeout') || err.includes('timed out')) {
    return {
      pattern: 'timeout',
      severity: 'medium',
      recovery: `${tool} timed out. Consider breaking into smaller operations.`,
    };
  }

  if (err.includes('disk') || err.includes('enospc') || err.includes('no space')) {
    return {
      pattern: 'disk_full',
      severity: 'high',
      recovery: 'Disk space critically low. Free up space before continuing.',
    };
  }

  return {
    pattern: 'unknown',
    severity: 'low',
    recovery: `${tool} failed unexpectedly. Review the error message for details.`,
  };
}

const classification = classifyFailure(toolName, errorMsg, toolInput);

// Step 2: Record error pattern to PLUGIN_DATA learnings
try {
  const pluginData = process.env.CLAUDE_PLUGIN_DATA;
  if (pluginData) {
    const learningsDir = path.join(pluginData, 'learnings');
    if (!fs.existsSync(learningsDir)) {
      fs.mkdirSync(learningsDir, { recursive: true });
    }

    const learningsPath = path.join(learningsDir, 'tool-failures.json');
    let learnings = [];

    if (fs.existsSync(learningsPath)) {
      try {
        learnings = JSON.parse(fs.readFileSync(learningsPath, 'utf8'));
      } catch (_) {
        learnings = [];
      }
    }

    learnings.push({
      timestamp: new Date().toISOString(),
      tool: toolName,
      pattern: classification.pattern,
      severity: classification.severity,
      error: String(errorMsg).substring(0, 300),
    });

    // Keep last 100 entries
    if (learnings.length > 100) {
      learnings = learnings.slice(-100);
    }

    fs.writeFileSync(learningsPath, JSON.stringify(learnings, null, 2));
    debugLog('ToolFailure', 'Learning recorded', { pattern: classification.pattern });
  }
} catch (e) {
  debugLog('ToolFailure', 'Learning record failed (non-critical)', { error: e.message });
}

// Step 3: Also log to audit
try {
  const { writeAuditLog } = require('../lib/audit/audit-logger');
  writeAuditLog({
    actor: 'hook',
    actorId: 'tool-failure-handler',
    action: 'gate_failed',
    category: 'control',
    target: toolName,
    targetType: 'feature',
    details: {
      pattern: classification.pattern,
      severity: classification.severity,
      error: String(errorMsg).substring(0, 300),
      isInterrupt,
    },
    result: 'failure',
  });
} catch (_) { /* non-critical */ }

// Step 4: Output recovery guidance
if (isInterrupt) {
  debugLog('ToolFailure', 'Skipping guidance (interrupt)');
  outputEmpty();
} else {
  outputAllow(classification.recovery, 'PostToolUseFailure');
}

debugLog('ToolFailure', 'Hook completed', {
  tool: toolName,
  pattern: classification.pattern,
  severity: classification.severity,
});
