#!/usr/bin/env node
/**
 * cwd-changed-handler.js — CwdChanged Hook Handler
 * Detects working directory changes for multi-project awareness.
 *
 * @version 2.1.0
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

const newCwd = input?.cwd || process.cwd();
debugLog('CwdChanged', 'Working directory changed', { cwd: newCwd });

// Detect project type from new CWD
const fs = require('fs');
const path = require('path');

const indicators = {
  hasGit: fs.existsSync(path.join(newCwd, '.git')),
  hasBkit: fs.existsSync(path.join(newCwd, '.bkit')),
  hasPackageJson: fs.existsSync(path.join(newCwd, 'package.json')),
};

if (indicators.hasBkit) {
  debugLog('CwdChanged', 'bkit project detected', indicators);
}

// Output context for Claude
if (indicators.hasBkit) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'CwdChanged',
      additionalContext: `Project changed: bkit project at ${newCwd}`
    }
  }));
} else {
  // No output for non-bkit projects
  process.exit(0);
}
