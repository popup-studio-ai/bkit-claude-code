#!/usr/bin/env node
/**
 * post-compaction.js - PostCompact Hook Handler (ENH-117)
 * Validates PDCA state integrity after context compaction
 *
 * @version 1.6.2
 * @module scripts/post-compaction
 */

const fs = require('fs');
const path = require('path');
const {
  readStdinSync,
  debugLog,
  getPdcaStatusFull,
  outputEmpty
} = require('../lib/common.js');

let input;
try {
  input = readStdinSync();
} catch (e) {
  debugLog('PostCompaction', 'Failed to read stdin', { error: e.message });
  outputEmpty();
  process.exit(0);
}

debugLog('PostCompaction', 'Hook started', {
  transcript_length: input.transcript_length || 'unknown'
});

// Step 1: Verify PDCA status file integrity
const pdcaStatus = getPdcaStatusFull(true);

if (!pdcaStatus) {
  debugLog('PostCompaction', 'PDCA status missing after compaction');

  // Attempt restore from PLUGIN_DATA backup
  try {
    const { restoreFromPluginData } = require('../lib/core/paths');
    const result = restoreFromPluginData();
    if (result.restored.length > 0) {
      debugLog('PostCompaction', 'Restored from backup', { restored: result.restored });
      console.log(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PostCompact',
          additionalContext: `PDCA state restored from backup after compaction. Restored: ${result.restored.join(', ')}.`
        }
      }));
      process.exit(0);
    }
  } catch (e) {
    debugLog('PostCompaction', 'Backup restore failed', { error: e.message });
  }

  outputEmpty();
  process.exit(0);
}

// Step 2: Validate status structure
const validationErrors = [];

if (!pdcaStatus.version) {
  validationErrors.push('Missing version field');
}
if (!pdcaStatus.features || typeof pdcaStatus.features !== 'object') {
  validationErrors.push('Missing or invalid features object');
}
if (!Array.isArray(pdcaStatus.activeFeatures)) {
  validationErrors.push('Missing or invalid activeFeatures array');
}

// Step 3: Check snapshot consistency
const { STATE_PATHS } = require('../lib/core/paths');
const snapshotDir = STATE_PATHS.snapshots();
let snapshotDelta = null;

try {
  if (fs.existsSync(snapshotDir)) {
    const files = fs.readdirSync(snapshotDir)
      .filter(f => f.startsWith('snapshot-') && f.endsWith('.json'))
      .sort()
      .reverse();

    if (files.length > 0) {
      const latestSnapshot = JSON.parse(
        fs.readFileSync(path.join(snapshotDir, files[0]), 'utf8')
      );
      const snapshotFeatureCount = Object.keys(latestSnapshot.status?.features || {}).length;
      const currentFeatureCount = Object.keys(pdcaStatus.features || {}).length;

      if (snapshotFeatureCount !== currentFeatureCount) {
        snapshotDelta = {
          before: snapshotFeatureCount,
          after: currentFeatureCount,
          diff: currentFeatureCount - snapshotFeatureCount
        };
      }
    }
  }
} catch (e) {
  debugLog('PostCompaction', 'Snapshot comparison skipped', { error: e.message });
}

// Step 4: Generate output
const summary = {
  activeFeatures: pdcaStatus.activeFeatures || [],
  primaryFeature: pdcaStatus.primaryFeature,
  featureCount: Object.keys(pdcaStatus.features || {}).length,
  validationErrors,
  snapshotDelta,
};

let additionalContext = `PDCA state verified after compaction. `;
additionalContext += `Active: ${summary.activeFeatures.join(', ') || 'none'}. `;
additionalContext += `Primary: ${summary.primaryFeature || 'none'}. `;
additionalContext += `Features: ${summary.featureCount}.`;

if (validationErrors.length > 0) {
  additionalContext += ` WARNINGS: ${validationErrors.join('; ')}.`;
}

if (snapshotDelta) {
  additionalContext += ` Feature count changed: ${snapshotDelta.before} -> ${snapshotDelta.after}.`;
}

console.log(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'PostCompact',
    additionalContext
  }
}));

debugLog('PostCompaction', 'Hook completed', summary);
