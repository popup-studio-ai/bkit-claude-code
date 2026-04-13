#!/usr/bin/env node
/**
 * cwd-changed-handler.js — CwdChanged Hook Handler
 * Detects working directory changes for multi-project awareness.
 * ENH-149: Enhanced with project transition detection, PDCA state loading,
 * and audit trail logging.
 *
 * @version 2.1.4
 * @module scripts/cwd-changed-handler
 */

const { readStdinSync } = require('../lib/core/io');
const { debugLog } = require('../lib/core/debug');

let input;
try {
  input = readStdinSync();
} catch (e) {
  process.exit(0);
}

const fs = require('fs');
const path = require('path');

const newCwd = input?.cwd || process.cwd();
const previousCwd = input?.previousCwd || input?.oldCwd || null;
debugLog('CwdChanged', 'Working directory changed', { cwd: newCwd, previousCwd });

// Detect project type from new CWD
const indicators = {
  hasGit: fs.existsSync(path.join(newCwd, '.git')),
  hasBkit: fs.existsSync(path.join(newCwd, '.bkit')),
  hasPackageJson: fs.existsSync(path.join(newCwd, 'package.json')),
};

// ENH-149: Detect project transition (old vs new cwd)
const isProjectTransition = previousCwd && previousCwd !== newCwd;
let pdcaPhase = null;
let primaryFeature = null;

if (indicators.hasBkit) {
  debugLog('CwdChanged', 'bkit project detected', indicators);

  // ENH-149: Load PDCA state from new project
  const pdcaStatusPath = path.join(newCwd, '.bkit/state/pdca-status.json');
  try {
    if (fs.existsSync(pdcaStatusPath)) {
      const status = JSON.parse(fs.readFileSync(pdcaStatusPath, 'utf8'));
      pdcaPhase = status.currentPhase || status.phase || 'idle';
      primaryFeature = status.primaryFeature || null;
      debugLog('CwdChanged', 'PDCA state loaded', { pdcaPhase, primaryFeature });
    }
  } catch (e) {
    debugLog('CwdChanged', 'Failed to load PDCA state', { error: e.message });
  }
}

// ENH-149: Log project transition in audit trail
if (isProjectTransition) {
  try {
    const { writeAuditLog } = require('../lib/audit/audit-logger');
    writeAuditLog({
      actor: 'hook',
      actorId: 'cwd-changed-handler',
      action: 'project_transition',
      category: 'session',
      target: path.basename(newCwd),
      targetType: 'project',
      details: {
        previousCwd,
        newCwd,
        hasBkit: indicators.hasBkit,
        pdcaPhase,
        primaryFeature,
      },
      result: 'success',
    });
  } catch (e) {
    debugLog('CwdChanged', 'Audit logging failed', { error: e.message });
  }
}

// Output context for Claude
if (indicators.hasBkit) {
  let contextMsg = `Project changed: bkit project at ${path.basename(newCwd)}`;
  if (pdcaPhase && primaryFeature) {
    contextMsg += ` (PDCA: ${pdcaPhase}, feature: ${primaryFeature})`;
  } else if (pdcaPhase) {
    contextMsg += ` (PDCA: ${pdcaPhase})`;
  }
  if (isProjectTransition) {
    contextMsg += ` [transition from ${path.basename(previousCwd)}]`;
  }

  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'CwdChanged',
      additionalContext: contextMsg,
    }
  }));
} else {
  // No output for non-bkit projects
  process.exit(0);
}
