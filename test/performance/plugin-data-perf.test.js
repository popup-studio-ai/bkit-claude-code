#!/usr/bin/env node
'use strict';
/**
 * Performance Tests for backupToPluginData and restoreFromPluginData
 * 6 TC | Benchmark backup/restore operations
 *
 * @version bkit v1.6.2
 */

const path = require('path');
const fs = require('fs');
const { measureTime, formatMs } = require('../helpers/timer');
const { assert, skip, summary, reset } = require('../helpers/assert');
reset();

console.log('\n=== plugin-data-perf.test.js (6 TC) ===\n');

const { backupToPluginData, restoreFromPluginData, STATE_PATHS } = require('../../lib/core/paths');
const common = require('../../lib/core');

// Save and set temp env
const origPluginData = process.env.CLAUDE_PLUGIN_DATA;
const TMP_DIR = path.join('/tmp', `bkit-perf-pd-${Date.now()}`);
process.env.CLAUDE_PLUGIN_DATA = TMP_DIR;

// PP-01: backupToPluginData < 100ms (cold start)
const backupTime = measureTime(() => backupToPluginData());
assert('PP-01',
  backupTime < 100,
  `backupToPluginData cold: ${formatMs(backupTime)} (< 100ms)`
);

// PP-02: backupToPluginData < 50ms (warm, 2nd call)
const backupTime2 = measureTime(() => backupToPluginData());
assert('PP-02',
  backupTime2 < 50,
  `backupToPluginData warm: ${formatMs(backupTime2)} (< 50ms)`
);

// PP-03: restoreFromPluginData < 100ms
const restoreTime = measureTime(() => restoreFromPluginData());
assert('PP-03',
  restoreTime < 100,
  `restoreFromPluginData: ${formatMs(restoreTime)} (< 100ms)`
);

// PP-04: 10x backupToPluginData < 500ms total
const batchTime = measureTime(() => {
  for (let i = 0; i < 10; i++) backupToPluginData();
});
assert('PP-04',
  batchTime < 500,
  `10x backup batch: ${formatMs(batchTime)} (< 500ms)`
);

// PP-05: STATE_PATHS.pluginDataBackup() < 5ms
const pathTime = measureTime(() => STATE_PATHS.pluginDataBackup());
assert('PP-05',
  pathTime < 5,
  `STATE_PATHS.pluginDataBackup(): ${formatMs(pathTime)} (< 5ms)`
);

// PP-06: common.js backupToPluginData same performance
const commonTime = measureTime(() => common.backupToPluginData());
assert('PP-06',
  commonTime < 100,
  `common.backupToPluginData: ${formatMs(commonTime)} (< 100ms)`
);

// Cleanup
try {
  if (fs.existsSync(TMP_DIR)) {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  }
} catch (e) { /* cleanup non-critical */ }

// Restore original env
if (origPluginData !== undefined) {
  process.env.CLAUDE_PLUGIN_DATA = origPluginData;
} else {
  delete process.env.CLAUDE_PLUGIN_DATA;
}

summary('Plugin Data Performance Tests');
