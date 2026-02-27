#!/usr/bin/env node
/**
 * context-compaction.js - Context Compaction Hook (FR-07)
 * Preserves PDCA state before context compression
 *
 * @version 1.5.6
 * @module scripts/context-compaction
 */

const fs = require('fs');
const path = require('path');
const {
  readStdinSync,
  debugLog,
  getPdcaStatusFull,
  PROJECT_DIR,
  outputEmpty
} = require('../lib/common.js');

// Read compaction event from stdin
let input;
try {
  input = readStdinSync();
} catch (e) {
  debugLog('ContextCompaction', 'Failed to read stdin', { error: e.message });
  outputEmpty();
  process.exit(0);
}

debugLog('ContextCompaction', 'Hook started', {
  reason: input.reason || 'unknown'
});

// Get current PDCA status
const pdcaStatus = getPdcaStatusFull(true);

if (pdcaStatus) {
  // Create compaction snapshot
  const snapshot = {
    timestamp: new Date().toISOString(),
    reason: input.reason || 'compaction',
    status: pdcaStatus
  };

  // Save snapshot
  const snapshotDir = path.join(PROJECT_DIR, 'docs', '.pdca-snapshots');
  try {
    if (!fs.existsSync(snapshotDir)) {
      fs.mkdirSync(snapshotDir, { recursive: true });
    }

    const snapshotPath = path.join(
      snapshotDir,
      `snapshot-${Date.now()}.json`
    );

    fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));

    debugLog('ContextCompaction', 'Snapshot saved', { path: snapshotPath });

    // Clean up old snapshots (keep last 10)
    const files = fs.readdirSync(snapshotDir)
      .filter(f => f.startsWith('snapshot-') && f.endsWith('.json'))
      .sort()
      .reverse();

    for (let i = 10; i < files.length; i++) {
      fs.unlinkSync(path.join(snapshotDir, files[i]));
    }
  } catch (e) {
    debugLog('ContextCompaction', 'Failed to save snapshot', { error: e.message });
  }

  // Output summary for context restoration
  const summary = {
    activeFeatures: pdcaStatus.activeFeatures || [],
    primaryFeature: pdcaStatus.primaryFeature,
    currentPhases: Object.entries(pdcaStatus.features || {}).map(([name, data]) => ({
      feature: name,
      phase: data.phase,
      matchRate: data.matchRate
    }))
  };

  const additionalContext = `PDCA State preserved. Active: ${summary.activeFeatures.join(', ') || 'none'}. Primary: ${summary.primaryFeature || 'none'}.`;

  // v1.4.2: hookEventName 추가 (ISSUE-006 수정)
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreCompact',
      additionalContext
    }
  }));
} else {
  debugLog('ContextCompaction', 'No PDCA status to preserve');
  outputEmpty();
}
