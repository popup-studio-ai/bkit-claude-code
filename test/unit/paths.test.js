#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// TC counter
let passed = 0, failed = 0, total = 0;
function test(id, description, fn) {
  total++;
  try {
    fn();
    passed++;
  } catch (err) {
    failed++;
    console.error(`  FAIL ${id}: ${description}`);
    console.error(`    ${err.message}`);
  }
}

console.log('\n=== paths.js Unit Tests ===\n');

// We need to mock platform to avoid real project dependency
// Create a temp directory structure for testing
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-paths-test-'));
const fakeProjDir = path.join(tmpDir, 'project');
const fakePluginRoot = path.join(tmpDir, 'plugin');
fs.mkdirSync(fakeProjDir, { recursive: true });
fs.mkdirSync(fakePluginRoot, { recursive: true });
fs.mkdirSync(path.join(fakePluginRoot, '.claude-plugin'), { recursive: true });
fs.mkdirSync(path.join(fakePluginRoot, 'hooks'), { recursive: true });

// Mock platform module before requiring paths
const platformPath = require.resolve('../../lib/core/platform');
const origPlatform = require.cache[platformPath];
require.cache[platformPath] = {
  id: platformPath,
  filename: platformPath,
  loaded: true,
  exports: {
    PROJECT_DIR: fakeProjDir,
    PLUGIN_ROOT: fakePluginRoot,
  },
};

// Mock config module
const configPath = require.resolve('../../lib/core/config');
require.cache[configPath] = {
  id: configPath,
  filename: configPath,
  loaded: true,
  exports: {
    getConfig: (key, defaultVal) => defaultVal,
  },
};

// Clear any cached paths module
const pathsModulePath = require.resolve('../../lib/core/paths');
delete require.cache[pathsModulePath];
const {
  STATE_PATHS, LEGACY_PATHS, CONFIG_PATHS, ensureBkitDirs,
  getDocPaths, resolveDocPaths, findDoc, getArchivePath,
  backupToPluginData, restoreFromPluginData,
} = require('../../lib/core/paths');

// --- STATE_PATHS ---

test('UT-PA-001', 'STATE_PATHS.root returns .bkit under project dir', () => {
  assert.strictEqual(STATE_PATHS.root(), path.join(fakeProjDir, '.bkit'));
});

test('UT-PA-002', 'STATE_PATHS.state returns .bkit/state', () => {
  assert.strictEqual(STATE_PATHS.state(), path.join(fakeProjDir, '.bkit', 'state'));
});

test('UT-PA-003', 'STATE_PATHS.runtime returns .bkit/runtime', () => {
  assert.strictEqual(STATE_PATHS.runtime(), path.join(fakeProjDir, '.bkit', 'runtime'));
});

test('UT-PA-004', 'STATE_PATHS.pdcaStatus returns pdca-status.json in state dir', () => {
  assert.ok(STATE_PATHS.pdcaStatus().endsWith('pdca-status.json'));
  assert.ok(STATE_PATHS.pdcaStatus().includes('.bkit/state'));
});

test('UT-PA-005', 'STATE_PATHS.memory returns memory.json in state dir', () => {
  assert.ok(STATE_PATHS.memory().endsWith('memory.json'));
});

test('UT-PA-006', 'STATE_PATHS.agentState returns agent-state.json in runtime dir', () => {
  assert.ok(STATE_PATHS.agentState().endsWith('agent-state.json'));
  assert.ok(STATE_PATHS.agentState().includes('.bkit/runtime'));
});

test('UT-PA-007', 'STATE_PATHS.pluginData returns null when no env var', () => {
  const orig = process.env.CLAUDE_PLUGIN_DATA;
  delete process.env.CLAUDE_PLUGIN_DATA;
  assert.strictEqual(STATE_PATHS.pluginData(), null);
  if (orig) process.env.CLAUDE_PLUGIN_DATA = orig;
});

test('UT-PA-008', 'STATE_PATHS.pluginData returns env value when set', () => {
  const orig = process.env.CLAUDE_PLUGIN_DATA;
  process.env.CLAUDE_PLUGIN_DATA = '/tmp/test-plugin-data';
  assert.strictEqual(STATE_PATHS.pluginData(), '/tmp/test-plugin-data');
  if (orig) process.env.CLAUDE_PLUGIN_DATA = orig;
  else delete process.env.CLAUDE_PLUGIN_DATA;
});

test('UT-PA-009', 'STATE_PATHS.pluginDataBackup returns backup subdir', () => {
  const orig = process.env.CLAUDE_PLUGIN_DATA;
  process.env.CLAUDE_PLUGIN_DATA = '/tmp/pd';
  assert.strictEqual(STATE_PATHS.pluginDataBackup(), '/tmp/pd/backup');
  if (orig) process.env.CLAUDE_PLUGIN_DATA = orig;
  else delete process.env.CLAUDE_PLUGIN_DATA;
});

test('UT-PA-010', 'STATE_PATHS.pluginDataBackup returns null when no env', () => {
  const orig = process.env.CLAUDE_PLUGIN_DATA;
  delete process.env.CLAUDE_PLUGIN_DATA;
  assert.strictEqual(STATE_PATHS.pluginDataBackup(), null);
  if (orig) process.env.CLAUDE_PLUGIN_DATA = orig;
});

test('UT-PA-011', 'STATE_PATHS.snapshots returns .bkit/snapshots', () => {
  assert.strictEqual(STATE_PATHS.snapshots(), path.join(fakeProjDir, '.bkit', 'snapshots'));
});

test('UT-PA-012', 'STATE_PATHS.checkpointsDir returns .bkit/checkpoints', () => {
  assert.strictEqual(STATE_PATHS.checkpointsDir(), path.join(fakeProjDir, '.bkit', 'checkpoints'));
});

// --- LEGACY_PATHS ---

test('UT-PA-013', 'LEGACY_PATHS.pdcaStatus returns docs/.pdca-status.json', () => {
  assert.ok(LEGACY_PATHS.pdcaStatus().includes('docs'));
  assert.ok(LEGACY_PATHS.pdcaStatus().endsWith('.pdca-status.json'));
});

// --- CONFIG_PATHS ---

test('UT-PA-014', 'CONFIG_PATHS.bkitConfig returns bkit.config.json', () => {
  assert.strictEqual(CONFIG_PATHS.bkitConfig(), path.join(fakeProjDir, 'bkit.config.json'));
});

test('UT-PA-015', 'CONFIG_PATHS.pluginJson returns .claude-plugin/plugin.json', () => {
  assert.ok(CONFIG_PATHS.pluginJson().endsWith('plugin.json'));
});

// --- ensureBkitDirs ---

test('UT-PA-016', 'ensureBkitDirs creates all required directories', () => {
  ensureBkitDirs();
  assert.ok(fs.existsSync(STATE_PATHS.root()));
  assert.ok(fs.existsSync(STATE_PATHS.state()));
  assert.ok(fs.existsSync(STATE_PATHS.runtime()));
  assert.ok(fs.existsSync(STATE_PATHS.auditDir()));
  assert.ok(fs.existsSync(STATE_PATHS.checkpointsDir()));
});

// --- resolveDocPaths ---

test('UT-PA-017', 'resolveDocPaths returns empty array for empty feature', () => {
  assert.deepStrictEqual(resolveDocPaths('plan', ''), []);
});

test('UT-PA-018', 'resolveDocPaths returns absolute paths with feature substituted', () => {
  const paths = resolveDocPaths('plan', 'my-feature');
  assert.ok(paths.length > 0);
  for (const p of paths) {
    assert.ok(path.isAbsolute(p), `Expected absolute path: ${p}`);
    assert.ok(p.includes('my-feature'), `Expected feature in path: ${p}`);
  }
});

test('UT-PA-019', 'resolveDocPaths returns empty for unknown phase', () => {
  assert.deepStrictEqual(resolveDocPaths('nonexistent', 'feat'), []);
});

// --- findDoc ---

test('UT-PA-020', 'findDoc returns empty string when no doc exists', () => {
  assert.strictEqual(findDoc('plan', 'nonexistent-feature-xyz'), '');
});

// --- getArchivePath ---

test('UT-PA-021', 'getArchivePath returns path with date and feature', () => {
  const d = new Date(2026, 0, 15);
  const archPath = getArchivePath('my-feat', d);
  assert.ok(archPath.includes('2026-01'));
  assert.ok(archPath.includes('my-feat'));
  assert.ok(path.isAbsolute(archPath));
});

// --- backupToPluginData ---

test('UT-PA-022', 'backupToPluginData returns skipped when no CLAUDE_PLUGIN_DATA', () => {
  const orig = process.env.CLAUDE_PLUGIN_DATA;
  delete process.env.CLAUDE_PLUGIN_DATA;
  const result = backupToPluginData();
  assert.strictEqual(result.backed.length, 0);
  assert.ok(result.skipped.includes('no CLAUDE_PLUGIN_DATA'));
  if (orig) process.env.CLAUDE_PLUGIN_DATA = orig;
});

test('UT-PA-023', 'backupToPluginData backs up existing state files', () => {
  const pdDir = path.join(tmpDir, 'pd-backup-test');
  process.env.CLAUDE_PLUGIN_DATA = pdDir;
  // Create source state files
  const stateDir = STATE_PATHS.state();
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(STATE_PATHS.pdcaStatus(), '{"test": true}');
  fs.writeFileSync(STATE_PATHS.memory(), '{"mem": true}');
  const result = backupToPluginData();
  assert.ok(result.backed.length >= 1);
  delete process.env.CLAUDE_PLUGIN_DATA;
});

// --- restoreFromPluginData ---

test('UT-PA-024', 'restoreFromPluginData returns skipped when no backup dir', () => {
  const orig = process.env.CLAUDE_PLUGIN_DATA;
  delete process.env.CLAUDE_PLUGIN_DATA;
  const result = restoreFromPluginData();
  assert.strictEqual(result.restored.length, 0);
  assert.ok(result.skipped[0].includes('no backup'));
  if (orig) process.env.CLAUDE_PLUGIN_DATA = orig;
});

// --- getDocPaths ---

test('UT-PA-025', 'getDocPaths returns all PDCA phases', () => {
  const dp = getDocPaths();
  assert.ok(Array.isArray(dp.plan));
  assert.ok(Array.isArray(dp.design));
  assert.ok(Array.isArray(dp.analysis));
  assert.ok(Array.isArray(dp.report));
  assert.ok(typeof dp.archive === 'string');
});

// Cleanup
try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
// Restore modules
if (origPlatform) require.cache[platformPath] = origPlatform;
else delete require.cache[platformPath];
delete require.cache[pathsModulePath];

// Summary
console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
