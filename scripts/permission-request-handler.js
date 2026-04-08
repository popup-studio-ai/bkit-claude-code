#!/usr/bin/env node
/**
 * permission-request-handler.js - PermissionRequest Hook Handler
 * Implements Controllable AI permission decisions based on automation level.
 *
 * - L2+ (semi-auto/full-auto): Auto-approve known safe PDCA operations
 * - Always deny dangerous operations regardless of level
 * - Auto-approve writes to docs/ and .bkit/ at L2+
 *
 * Input: { tool_name, tool_input, permission_suggestions }
 * Output: { decision: { behavior: 'allow'|'deny'|null, updatedInput: null } }
 *
 * @version 2.0.0
 * @module scripts/permission-request-handler
 */

const { readStdinSync } = require('../lib/core/io');
const { debugLog } = require('../lib/core/debug');
const { getAutomationLevel } = require('../lib/pdca/automation');

// Safe bash command patterns (prefix match)
const SAFE_BASH_PREFIXES = [
  'node ', 'npm run', 'npm test', 'npm build',
  'cat ', 'ls ', 'find ', 'grep ', 'rg ',
  'git status', 'git log', 'git diff', 'git show', 'git branch',
  'echo ', 'head ', 'tail ', 'wc ',
];

// Always deny patterns (substring match in command)
const ALWAYS_DENY_PATTERNS = [
  'rm -rf /',
  'git push --force',
  'git push -f ',
  'git reset --hard',
  'chmod 777',
  '>/dev/',
  'mkfs.',
  'dd if=',
  ':(){:|:&};:',
];

// Safe write target directories (startsWith match)
const SAFE_WRITE_DIRS = [
  'docs/',
  '.bkit/',
  '.bkit\\',
];

let input;
try {
  input = readStdinSync();
} catch (e) {
  debugLog('PermissionRequest', 'Failed to read stdin', { error: e.message });
  // Return null decision (let user decide)
  console.log(JSON.stringify({ hookSpecificOutput: { decision: { behavior: null, updatedInput: null } } }));
  process.exit(0);
}

const toolName = input.tool_name || input.toolName || '';
const toolInput = input.tool_input || input.toolInput || {};
const suggestions = input.permission_suggestions || [];

debugLog('PermissionRequest', 'Hook started', { toolName, suggestions });

// Determine automation level
let autoLevel = 'manual';
try {
  autoLevel = getAutomationLevel();
} catch (e) {
  debugLog('PermissionRequest', 'Failed to get automation level', { error: e.message });
}

const isL2Plus = autoLevel === 'semi-auto' || autoLevel === 'full-auto';

/**
 * Check if a bash command matches always-deny patterns
 */
function isDangerousBash(command) {
  if (!command || typeof command !== 'string') return false;
  const cmd = command.toLowerCase().trim();
  return ALWAYS_DENY_PATTERNS.some(p => cmd.includes(p));
}

/**
 * Check if a bash command matches safe patterns
 */
function isSafeBash(command) {
  if (!command || typeof command !== 'string') return false;
  const cmd = command.trim();
  return SAFE_BASH_PREFIXES.some(p => cmd.startsWith(p));
}

/**
 * Check if a write/edit target is in a safe directory
 */
function isSafeWriteTarget(filePath) {
  if (!filePath || typeof filePath !== 'string') return false;
  return SAFE_WRITE_DIRS.some(d => filePath.startsWith(d) || filePath.includes(`/${d}`));
}

// Make decision
let decision = { behavior: null, updatedInput: null };

try {
  if (toolName === 'Bash') {
    const command = toolInput.command || toolInput.cmd || '';

    // Always deny dangerous commands
    if (isDangerousBash(command)) {
      decision.behavior = 'deny';
      debugLog('PermissionRequest', 'DENIED dangerous bash', { command: command.substring(0, 100) });

      // Audit the denial
      try {
        const { writeAuditLog } = require('../lib/audit/audit-logger');
        writeAuditLog({
          actor: 'hook',
          actorId: 'permission-request-handler',
          action: 'destructive_blocked',
          category: 'control',
          target: command.substring(0, 200),
          targetType: 'feature',
          details: { tool: 'Bash', reason: 'dangerous_command' },
          result: 'blocked',
          reason: 'Dangerous bash command blocked by permission handler',
          destructiveOperation: true,
          blastRadius: 'critical',
        });
      } catch (_) { /* non-critical */ }
    }
    // Auto-approve safe commands at L2+
    else if (isL2Plus && isSafeBash(command)) {
      decision.behavior = 'allow';
      debugLog('PermissionRequest', 'Auto-approved safe bash', { command: command.substring(0, 100) });
    }
  }

  if (toolName === 'Write' || toolName === 'Edit') {
    const filePath = toolInput.file_path || toolInput.filePath || toolInput.path || '';

    // Auto-approve writes to safe dirs at L2+
    if (isL2Plus && isSafeWriteTarget(filePath)) {
      decision.behavior = 'allow';
      debugLog('PermissionRequest', 'Auto-approved safe write', { filePath });
    }
  }
} catch (e) {
  debugLog('PermissionRequest', 'Decision logic error', { error: e.message });
  decision = { behavior: null, updatedInput: null };
}

// Output decision
const output = {
  hookSpecificOutput: {
    decision,
  },
};

console.log(JSON.stringify(output));

debugLog('PermissionRequest', 'Hook completed', {
  toolName,
  decision: decision.behavior,
  autoLevel,
});
