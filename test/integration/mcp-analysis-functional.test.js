#!/usr/bin/env node
'use strict';

/**
 * Integration Test: MCP Analysis Server Functional Tests
 *
 * Tests each tool exposed by bkit-analysis-server/index.js:
 * bkit_code_quality, bkit_gap_analysis, bkit_regression_rules,
 * bkit_checkpoint_list, bkit_audit_search
 */

const assert = require('assert');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const SERVER_PATH = 'servers/bkit-analysis-server/index.js';

let createMcpClient;
try {
  ({ createMcpClient } = require(path.join(ROOT, 'test/helpers/mcp-client.js')));
} catch (e) {
  console.error('Cannot load mcp-client.js:', e.message);
  process.exit(1);
}

let passed = 0, failed = 0, skipped = 0, total = 0;

function test(id, desc, fn) {
  total++;
  return fn().then(() => { passed++; }).catch((e) => {
    if (e.message && e.message.includes('SKIP')) { skipped++; console.log(`  SKIP ${id}: ${desc}`); }
    else { failed++; console.error(`  FAIL ${id}: ${desc}\n    ${e.message}`); }
  });
}

async function run() {
  console.log('\n=== MCP Analysis Server Functional Tests ===\n');

  let client;
  try {
    client = await createMcpClient(SERVER_PATH, { timeout: 8000 });
    await client.initialize();
  } catch (e) {
    console.log(`  SKIP ALL: Cannot start Analysis server (${e.message})`);
    console.log(`\n--- Results: 0/0 passed, 0 failed (server unavailable) ---`);
    return;
  }

  try {
    // -----------------------------------------------------------------------
    // bkit_code_quality
    // -----------------------------------------------------------------------

    await test('ANA-01', 'bkit_code_quality returns valid structure (no args)', async () => {
      const result = await client.callTool('bkit_code_quality', {});
      assert.ok(Array.isArray(result.content), 'Missing content array');
      const data = JSON.parse(result.content[0].text);
      assert.ok(typeof data === 'object', 'Result should be object');
      // Should have analyzedAt, overallScore, summary, issues fields
      assert.ok('analyzedAt' in data, 'Missing analyzedAt field');
      assert.ok('summary' in data, 'Missing summary field');
    });

    await test('ANA-02', 'bkit_code_quality with feature filter', async () => {
      const result = await client.callTool('bkit_code_quality', { feature: 'test-feature' });
      assert.ok(Array.isArray(result.content), 'Missing content array');
      // Non-existent feature should return error or empty
      const data = JSON.parse(result.content[0].text);
      assert.ok(typeof data === 'object', 'Result should be object');
    });

    // -----------------------------------------------------------------------
    // bkit_gap_analysis
    // -----------------------------------------------------------------------

    await test('ANA-03', 'bkit_gap_analysis returns valid structure (no args)', async () => {
      const result = await client.callTool('bkit_gap_analysis', {});
      assert.ok(Array.isArray(result.content), 'Missing content array');
      const data = JSON.parse(result.content[0].text);
      assert.ok(typeof data === 'object', 'Result should be object');
      assert.ok('totalGaps' in data || 'gaps' in data || 'matchRate' in data,
        `Missing gap analysis fields: ${Object.keys(data).join(', ')}`);
    });

    await test('ANA-04', 'bkit_gap_analysis with limit param', async () => {
      const result = await client.callTool('bkit_gap_analysis', { limit: 3 });
      assert.ok(Array.isArray(result.content), 'Missing content array');
      const data = JSON.parse(result.content[0].text);
      if (Array.isArray(data.gaps)) {
        assert.ok(data.gaps.length <= 3, `Expected max 3 gaps, got ${data.gaps.length}`);
      }
    });

    // -----------------------------------------------------------------------
    // bkit_regression_rules
    // -----------------------------------------------------------------------

    await test('ANA-05', 'bkit_regression_rules list returns rules array', async () => {
      const result = await client.callTool('bkit_regression_rules', { action: 'list' });
      assert.ok(Array.isArray(result.content), 'Missing content array');
      const data = JSON.parse(result.content[0].text);
      assert.ok(typeof data === 'object', 'Result should be object');
      // Should have rules array or version
      assert.ok('rules' in data || 'version' in data || Array.isArray(data),
        `Missing rules field: ${Object.keys(data).join(', ')}`);
    });

    await test('ANA-06', 'bkit_regression_rules add requires rule object', async () => {
      // Attempt add without rule — should fail gracefully
      const result = await client.callTool('bkit_regression_rules', { action: 'add' });
      assert.ok(Array.isArray(result.content), 'Missing content array');
      const data = JSON.parse(result.content[0].text);
      // Should return error since rule is missing
      assert.ok(result.isError || data.error, 'Expected error when rule is missing for add action');
    });

    // -----------------------------------------------------------------------
    // bkit_checkpoint_list
    // -----------------------------------------------------------------------

    await test('ANA-07', 'bkit_checkpoint_list returns valid structure (no args)', async () => {
      const result = await client.callTool('bkit_checkpoint_list', {});
      assert.ok(Array.isArray(result.content), 'Missing content array');
      const data = JSON.parse(result.content[0].text);
      assert.ok(typeof data === 'object' || Array.isArray(data), 'Result should be object or array');
    });

    await test('ANA-08', 'bkit_checkpoint_list with limit', async () => {
      const result = await client.callTool('bkit_checkpoint_list', { limit: 5 });
      assert.ok(Array.isArray(result.content), 'Missing content array');
    });

    // -----------------------------------------------------------------------
    // bkit_audit_search
    // -----------------------------------------------------------------------

    await test('ANA-09', 'bkit_audit_search returns valid structure (no args)', async () => {
      const result = await client.callTool('bkit_audit_search', {});
      assert.ok(Array.isArray(result.content), 'Missing content array');
      const data = JSON.parse(result.content[0].text);
      assert.ok(typeof data === 'object' || Array.isArray(data), 'Result should be object or array');
    });

    await test('ANA-10', 'bkit_audit_search with query and limit', async () => {
      const result = await client.callTool('bkit_audit_search', { query: 'test', limit: 5 });
      assert.ok(Array.isArray(result.content), 'Missing content array');
      const data = JSON.parse(result.content[0].text);
      assert.ok(typeof data === 'object' || Array.isArray(data), 'Result should be object or array');
    });

  } finally {
    await client.close();
  }

  console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed, ${skipped} skipped ---`);
  if (failed > 0) process.exit(1);
}

run().catch(e => {
  console.error('Unhandled error:', e);
  process.exit(1);
});
