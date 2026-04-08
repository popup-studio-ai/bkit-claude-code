#!/usr/bin/env node
/**
 * instructions-loaded-handler.js - InstructionsLoaded Hook Handler
 * Logs instruction loading events and verifies bkit core rules.
 *
 * Input: { file_path, memory_type, load_reason }
 * Output: none (audit only)
 *
 * @version 2.0.0
 * @module scripts/instructions-loaded-handler
 */

const path = require('path');
const { readStdinSync, outputEmpty } = require('../lib/core/io');
const { debugLog } = require('../lib/core/debug');

let input;
try {
  input = readStdinSync();
} catch (e) {
  debugLog('InstructionsLoaded', 'Failed to read stdin', { error: e.message });
  outputEmpty();
  process.exit(0);
}

const filePath = input.file_path || input.filePath || '';
const memoryType = input.memory_type || input.memoryType || '';
const loadReason = input.load_reason || input.loadReason || '';

debugLog('InstructionsLoaded', 'Hook started', { filePath, memoryType, loadReason });

// Step 1: Log instruction loading to audit
try {
  const { writeAuditLog } = require('../lib/audit/audit-logger');
  writeAuditLog({
    actor: 'system',
    actorId: 'instructions-loaded-handler',
    action: 'config_changed',
    category: 'config',
    target: filePath || 'instructions',
    targetType: 'config',
    details: {
      event: 'instructions_loaded',
      memoryType,
      loadReason,
      fileName: filePath ? path.basename(filePath) : '',
    },
    result: 'success',
  });
  debugLog('InstructionsLoaded', 'Audit log written');
} catch (e) {
  debugLog('InstructionsLoaded', 'Audit write failed (non-critical)', { error: e.message });
}

// Step 2: Verify bkit core rules loaded (CLAUDE.md check)
try {
  if (filePath && filePath.includes('CLAUDE.md')) {
    const fileName = path.basename(filePath);
    const dirName = path.basename(path.dirname(filePath));
    const isBkitClaudeMd = dirName === '.claude' || filePath.includes('bkit');

    debugLog('InstructionsLoaded', 'CLAUDE.md loaded', {
      fileName,
      isBkitClaudeMd,
      fullPath: filePath,
    });
  }
} catch (e) {
  debugLog('InstructionsLoaded', 'CLAUDE.md check failed (non-critical)', { error: e.message });
}

debugLog('InstructionsLoaded', 'Hook completed', { filePath });
outputEmpty();
process.exit(0);
