#!/usr/bin/env node
/**
 * bkit Lib Module Tests
 * Tests all 6 lib modules: common, context-fork, context-hierarchy, import-resolver, memory-store, permission-manager
 */

const path = require('path');
process.chdir('/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code');

// Test results accumulator
const results = { passed: 0, failed: 0, tests: [] };

function test(id, name, fn) {
  try {
    fn();
    results.passed++;
    results.tests.push({ id, name, status: 'PASS' });
    console.log(`✅ ${id}: ${name}`);
  } catch (e) {
    results.failed++;
    results.tests.push({ id, name, status: 'FAIL', error: e.message });
    console.log(`❌ ${id}: ${name} - ${e.message}`);
  }
}

// LIB-01: common.js
console.log('\n=== LIB-01: common.js ===');
const common = require('./lib/common.js');

test('LIB-01a', 'detectLevel() returns valid level', () => {
  const level = common.detectLevel();
  const validLevels = ['starter', 'dynamic', 'enterprise', 'Starter', 'Dynamic', 'Enterprise'];
  if (!validLevels.includes(level)) {
    throw new Error('Invalid level: ' + level);
  }
  console.log(`   Level: ${level}`);
});

test('LIB-01b', 'getPdcaStatusFull() returns object', () => {
  const status = common.getPdcaStatusFull();
  if (typeof status !== 'object') throw new Error('Not an object');
});

test('LIB-01c', 'xmlSafeOutput() escapes XML chars', () => {
  const result = common.xmlSafeOutput('<test>&value</test>');
  if (result.includes('<') && result.includes('>')) {
    // Should be escaped
    if (!result.includes('&lt;') && !result.includes('&gt;')) {
      throw new Error('Not properly escaped: ' + result);
    }
  }
});

test('LIB-01d', 'BKIT_PLATFORM is defined', () => {
  if (!common.BKIT_PLATFORM) throw new Error('BKIT_PLATFORM undefined');
  console.log(`   Platform: ${common.BKIT_PLATFORM}`);
});

test('LIB-01e', 'PLUGIN_ROOT is defined', () => {
  if (!common.PLUGIN_ROOT) throw new Error('PLUGIN_ROOT undefined');
});

// LIB-02: context-fork.js
console.log('\n=== LIB-02: context-fork.js ===');
const contextFork = require('./lib/context-fork.js');

test('LIB-02a', 'forkContext() creates fork', () => {
  const { forkId, context } = contextFork.forkContext('test-skill');
  if (!forkId || !forkId.startsWith('fork-')) throw new Error('Invalid forkId');
  contextFork.discardFork(forkId);
});

test('LIB-02b', 'getActiveForks() returns array', () => {
  const forks = contextFork.getActiveForks();
  if (!Array.isArray(forks)) throw new Error('Not an array');
});

test('LIB-02c', 'mergeForkedContext() merges correctly', () => {
  const { forkId } = contextFork.forkContext('merge-test', { mergeResult: true });
  const result = contextFork.mergeForkedContext(forkId);
  if (!result.success) throw new Error('Merge failed');
});

// LIB-03: context-hierarchy.js
console.log('\n=== LIB-03: context-hierarchy.js ===');
const hierarchy = require('./lib/context-hierarchy.js');

test('LIB-03a', 'getContextHierarchy() returns object with levels', () => {
  const h = hierarchy.getContextHierarchy();
  if (!h.levels || !Array.isArray(h.levels)) throw new Error('No levels array');
});

test('LIB-03b', 'setSessionContext/getSessionContext works', () => {
  hierarchy.setSessionContext('testKey', 'testValue');
  const val = hierarchy.getSessionContext('testKey');
  if (val !== 'testValue') throw new Error('Value mismatch: ' + val);
  hierarchy.clearSessionContext();
});

test('LIB-03c', 'getHierarchicalConfig() returns merged config', () => {
  const config = hierarchy.getHierarchicalConfig('pdca', {});
  // Should return default or actual config
  if (config === undefined) throw new Error('Returned undefined');
});

// LIB-04: import-resolver.js
console.log('\n=== LIB-04: import-resolver.js ===');
const importResolver = require('./lib/import-resolver.js');

test('LIB-04a', 'resolveVariables() replaces PLUGIN_ROOT', () => {
  const result = importResolver.resolveVariables('${PLUGIN_ROOT}/test');
  if (result.includes('${PLUGIN_ROOT}')) throw new Error('Not resolved');
});

test('LIB-04b', 'parseFrontmatter() extracts frontmatter', () => {
  const { frontmatter, body } = importResolver.parseFrontmatter('---\nkey: value\n---\nBody content');
  if (frontmatter.key !== 'value') throw new Error('Frontmatter not parsed');
});

test('LIB-04c', 'resolveImportPath() resolves relative path', () => {
  const result = importResolver.resolveImportPath('./test.md', '/some/file.md');
  if (!result.includes('test.md')) throw new Error('Path not resolved');
});

// LIB-05: memory-store.js
console.log('\n=== LIB-05: memory-store.js ===');
const memoryStore = require('./lib/memory-store.js');

test('LIB-05a', 'setMemory/getMemory works', () => {
  memoryStore.setMemory('testMemKey', { test: true });
  const val = memoryStore.getMemory('testMemKey');
  if (!val || !val.test) throw new Error('Memory not stored');
  memoryStore.deleteMemory('testMemKey');
});

test('LIB-05b', 'hasMemory() checks existence', () => {
  memoryStore.setMemory('existKey', 1);
  if (!memoryStore.hasMemory('existKey')) throw new Error('hasMemory failed');
  memoryStore.deleteMemory('existKey');
});

test('LIB-05c', 'getMemoryKeys() returns array', () => {
  const keys = memoryStore.getMemoryKeys();
  if (!Array.isArray(keys)) throw new Error('Not an array');
});

// LIB-06: permission-manager.js
console.log('\n=== LIB-06: permission-manager.js ===');
const permManager = require('./lib/permission-manager.js');

test('LIB-06a', 'checkPermission() returns valid permission', () => {
  const perm = permManager.checkPermission('Write');
  if (!['allow', 'deny', 'ask'].includes(perm)) throw new Error('Invalid permission: ' + perm);
});

test('LIB-06b', 'shouldBlock() returns object with blocked property', () => {
  const result = permManager.shouldBlock('Bash', 'ls');
  if (typeof result.blocked !== 'boolean') throw new Error('No blocked property');
});

test('LIB-06c', 'getToolPermissions() returns object', () => {
  const perms = permManager.getToolPermissions('Bash');
  if (typeof perms !== 'object') throw new Error('Not an object');
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('SUMMARY: Lib Module Tests');
console.log('='.repeat(50));
console.log(`Total: ${results.passed + results.failed}`);
console.log(`Passed: ${results.passed}`);
console.log(`Failed: ${results.failed}`);
console.log(`Pass Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

if (results.failed > 0) {
  console.log('\nFailed Tests:');
  results.tests.filter(t => t.status === 'FAIL').forEach(t => {
    console.log(`  - ${t.id}: ${t.name}`);
    console.log(`    Error: ${t.error}`);
  });
}

// Output JSON for processing
console.log('\n--- JSON_RESULTS ---');
console.log(JSON.stringify(results, null, 2));
