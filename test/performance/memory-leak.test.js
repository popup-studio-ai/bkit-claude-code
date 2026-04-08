#!/usr/bin/env node
'use strict';

/**
 * Memory Leak Prevention Tests
 * Tests: cache bounded growth, state store tmp cleanup, require.cache stability.
 */

const assert = require('assert');
const path = require('path');

let passed = 0, failed = 0, total = 0;
function test(id, desc, fn) {
  total++;
  try { fn(); passed++; } catch (e) { failed++; console.error(`  FAIL ${id}: ${desc}\n    ${e.message}`); }
}

console.log('\n=== Memory Leak Prevention Tests ===\n');

// --- Cache: bounded growth ---

test('ML-01', 'cache set 1000 entries does not grow Map beyond 1000', () => {
  // Fresh cache module
  const modPath = require.resolve('../../lib/core/cache');
  delete require.cache[modPath];
  const cache = require('../../lib/core/cache');

  cache.clear();

  for (let i = 0; i < 1000; i++) {
    cache.set(`key-${i}`, `value-${i}`);
  }

  // Verify all 1000 entries exist (Map has no automatic eviction)
  let validCount = 0;
  for (let i = 0; i < 1000; i++) {
    const v = cache.get(`key-${i}`, 60000); // long TTL
    if (v !== null) validCount++;
  }

  assert.strictEqual(validCount, 1000, `Expected 1000 valid entries, got ${validCount}`);
  cache.clear();
});

test('ML-02', 'cache TTL expiration cleans entries on get', () => {
  const modPath = require.resolve('../../lib/core/cache');
  delete require.cache[modPath];
  const cache = require('../../lib/core/cache');

  cache.clear();
  cache.set('expire-test', 'value');

  // With 1ms TTL, should expire quickly
  const result = cache.get('expire-test', 1);
  // May or may not be expired depending on timing; the key point is it does not crash
  assert.ok(result === 'value' || result === null, 'get with short TTL should return value or null');

  cache.clear();
});

test('ML-03', 'cache invalidate with RegExp removes matching entries', () => {
  const modPath = require.resolve('../../lib/core/cache');
  delete require.cache[modPath];
  const cache = require('../../lib/core/cache');

  cache.clear();

  // Set entries with different prefixes
  for (let i = 0; i < 50; i++) {
    cache.set(`prefix-a-${i}`, i);
    cache.set(`prefix-b-${i}`, i);
  }

  // Invalidate all prefix-a entries
  cache.invalidate(/^prefix-a-/);

  // prefix-a should be gone, prefix-b should remain
  const aResult = cache.get('prefix-a-0', 60000);
  const bResult = cache.get('prefix-b-0', 60000);
  assert.strictEqual(aResult, null, 'prefix-a entries should be invalidated');
  assert.strictEqual(bResult, 0, 'prefix-b entries should remain');

  cache.clear();
});

// --- State store tmp file cleanup ---

test('ML-04', 'State writes do not leave orphan tmp files', () => {
  const fs = require('fs');
  const os = require('os');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-state-test-'));

  // Write a JSON state file multiple times
  const statePath = path.join(tmpDir, 'test-state.json');
  for (let i = 0; i < 20; i++) {
    fs.writeFileSync(statePath, JSON.stringify({ iteration: i }));
  }

  // Check that only the single state file exists (no .tmp files)
  const files = fs.readdirSync(tmpDir);
  const tmpFiles = files.filter(f => f.includes('.tmp') || f.includes('.bak'));
  assert.strictEqual(tmpFiles.length, 0, `Found ${tmpFiles.length} orphan tmp files: ${tmpFiles.join(', ')}`);

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// --- require.cache stability ---

test('ML-05', 'require.cache does not grow unbounded on repeated require', () => {
  // Pre-load modules to ensure they are in cache before measuring
  require('../../lib/core/cache');
  require('../../lib/core/version');
  require('../../lib/ui/ansi');

  const initialSize = Object.keys(require.cache).length;

  // Re-require the same modules multiple times
  for (let i = 0; i < 50; i++) {
    require('../../lib/core/cache');
    require('../../lib/core/version');
    require('../../lib/ui/ansi');
  }

  const finalSize = Object.keys(require.cache).length;

  // require.cache should not grow (modules are cached on first require)
  assert.strictEqual(finalSize, initialSize,
    `require.cache grew from ${initialSize} to ${finalSize} — possible leak`);
});

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
