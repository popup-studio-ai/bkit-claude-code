#!/usr/bin/env node
'use strict';
/**
 * Unit Tests for #48 globalCache project isolation fix
 * 10 TC | Cross-project restore guard + globalCache namespace
 *
 * @version bkit v2.0.1
 * @see https://github.com/popup-studio-ai/bkit-claude-code/issues/48
 */

const path = require('path');
const fs = require('fs');
const { assert, summary, reset } = require('../helpers/assert');
reset();

console.log('\n=== project-isolation.test.js (10 TC) ===\n');

const { backupToPluginData, restoreFromPluginData } = require('../../lib/core/paths');

// Save original env
const origPluginData = process.env.CLAUDE_PLUGIN_DATA;

// Setup temp directories
const TMP_BASE = path.join('/tmp', `bkit-iso-test-${Date.now()}`);
const BACKUP_DIR = path.join(TMP_BASE, 'backup');
fs.mkdirSync(BACKUP_DIR, { recursive: true });

// ============================================================
// Section 1: meta.json creation on backup (3 TC)
// ============================================================
console.log('\n--- Section 1: meta.json creation ---');

// ISO-01: backupToPluginData writes meta.json
process.env.CLAUDE_PLUGIN_DATA = TMP_BASE;
backupToPluginData();
const metaPath = path.join(BACKUP_DIR, 'meta.json');
assert('ISO-01',
  fs.existsSync(metaPath),
  'backupToPluginData creates meta.json in backup dir'
);

// ISO-02: meta.json contains projectDir field
let meta = {};
try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')); } catch (_) {}
assert('ISO-02',
  typeof meta.projectDir === 'string' && meta.projectDir.length > 0,
  'meta.json contains non-empty projectDir string'
);

// ISO-03: meta.json projectDir matches current PROJECT_DIR
const { PROJECT_DIR } = require('../../lib/core/platform');
assert('ISO-03',
  meta.projectDir === PROJECT_DIR,
  `meta.json projectDir matches PROJECT_DIR (${meta.projectDir})`
);

// ============================================================
// Section 2: Cross-project restore guard (4 TC)
// ============================================================
console.log('\n--- Section 2: Cross-project restore guard ---');

// ISO-04: Restore skips when meta.json projectDir doesn't match
// Write a fake meta.json with different projectDir
fs.writeFileSync(metaPath, JSON.stringify({
  projectDir: '/fake/different/project',
  timestamp: new Date().toISOString(),
  bkitVersion: '2.0.0',
}));
const crossResult = restoreFromPluginData();
assert('ISO-04',
  crossResult.skipped.length > 0 &&
  crossResult.skipped[0].includes('different project'),
  'Cross-project restore blocked: skipped contains "different project"'
);

// ISO-05: Restore skips when meta.json is missing (legacy backup)
fs.unlinkSync(metaPath);
const legacyResult = restoreFromPluginData();
assert('ISO-05',
  legacyResult.skipped.length > 0 &&
  legacyResult.skipped[0].includes('legacy backup'),
  'Legacy backup (no meta.json) skipped for safety'
);

// ISO-06: Restore skips when meta.json is corrupted
fs.writeFileSync(metaPath, '{ invalid json !!!');
const corruptResult = restoreFromPluginData();
assert('ISO-06',
  corruptResult.skipped.length > 0 &&
  corruptResult.skipped[0].includes('parse error'),
  'Corrupted meta.json: skipped with parse error'
);

// ISO-07: Restore skips when meta.json missing projectDir field
fs.writeFileSync(metaPath, JSON.stringify({ timestamp: '2026-01-01', bkitVersion: '2.0.0' }));
const noFieldResult = restoreFromPluginData();
assert('ISO-07',
  noFieldResult.skipped.length > 0 &&
  noFieldResult.skipped[0].includes('missing projectDir'),
  'meta.json without projectDir: skipped with "missing projectDir"'
);

// ============================================================
// Section 3: Same-project restore (1 TC)
// ============================================================
console.log('\n--- Section 3: Same-project restore ---');

// ISO-08: Restore succeeds when meta.json projectDir matches
// Write correct meta.json and a backup file
fs.writeFileSync(metaPath, JSON.stringify({
  projectDir: PROJECT_DIR,
  timestamp: new Date().toISOString(),
  bkitVersion: '2.0.0',
}));
// Create a dummy backup file that doesn't exist in dest
const dummyBackup = path.join(BACKUP_DIR, 'pdca-status.backup.json');
fs.writeFileSync(dummyBackup, JSON.stringify({ version: '2.0', test: true }));
// Note: actual restore depends on dest not existing, which may already exist
// We verify the function doesn't block same-project restore
const sameResult = restoreFromPluginData();
assert('ISO-08',
  sameResult.skipped.length === 0 ||
  !sameResult.skipped[0].includes('different project'),
  'Same-project restore not blocked by project guard'
);

// ============================================================
// Section 4: globalCache namespace (2 TC)
// ============================================================
console.log('\n--- Section 4: globalCache namespace ---');

// v2.1.16 hardening: lib/pdca/status.js was split in v2.1.10 — the file is
// now a re-export facade and the actual _getCacheKey logic lives in
// lib/pdca/status-core.js. Test source path migrated accordingly.

// ISO-09: _getCacheKey returns project-scoped key (now lives in status-core.js)
const statusCoreSource = fs.readFileSync(
  path.join(__dirname, '../../lib/pdca/status-core.js'), 'utf8'
);
assert('ISO-09',
  statusCoreSource.includes('_getCacheKey()') &&
  statusCoreSource.includes('`pdca-status:${PROJECT_DIR}`'),
  'status-core.js uses _getCacheKey() with project-scoped key format (v2.1.10 facade split)'
);

// ISO-10: No hardcoded 'pdca-status' cache key in get/set calls
const cacheCallPattern = /globalCache\.(get|set)\('pdca-status'/g;
const hardcodedMatches = statusCoreSource.match(cacheCallPattern);
assert('ISO-10',
  hardcodedMatches === null,
  'No hardcoded "pdca-status" in globalCache.get/set calls (status-core.js)'
);

// ============================================================
// Cleanup
// ============================================================
try {
  if (fs.existsSync(TMP_BASE)) {
    fs.rmSync(TMP_BASE, { recursive: true, force: true });
  }
} catch (_) { /* cleanup non-critical */ }

if (origPluginData !== undefined) {
  process.env.CLAUDE_PLUGIN_DATA = origPluginData;
} else {
  delete process.env.CLAUDE_PLUGIN_DATA;
}

summary('Project Isolation Unit Tests (#48)');
