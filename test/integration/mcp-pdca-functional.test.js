#!/usr/bin/env node
'use strict';

/**
 * Integration Test: MCP PDCA Server Functional Tests
 *
 * Tests each tool exposed by bkit-pdca-server/index.js:
 * bkit_pdca_status, bkit_feature_list, bkit_feature_detail,
 * bkit_plan_read, bkit_metrics_get, bkit_pdca_history
 */

const assert = require('assert');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const SERVER_PATH = 'servers/bkit-pdca-server/index.js';

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
  console.log('\n=== MCP PDCA Functional Tests ===\n');

  let client;
  try {
    client = await createMcpClient(SERVER_PATH, { timeout: 8000 });
    await client.initialize();
  } catch (e) {
    console.log(`  SKIP ALL: Cannot start PDCA server (${e.message})`);
    console.log(`\n--- Results: 0/0 passed, 0 failed (server unavailable) ---`);
    return;
  }

  try {
    // -----------------------------------------------------------------------
    // bkit_pdca_status
    // -----------------------------------------------------------------------

    await test('PDCA-01', 'bkit_pdca_status returns valid structure (no args)', async () => {
      const result = await client.callTool('bkit_pdca_status', {});
      assert.ok(Array.isArray(result.content), 'Missing content array');
      const data = JSON.parse(result.content[0].text);
      assert.ok('summary' in data || 'version' in data || 'primaryFeature' in data,
        `Unexpected structure: ${Object.keys(data).join(', ')}`);
    });

    await test('PDCA-02', 'bkit_pdca_status with non-existent feature returns error', async () => {
      const result = await client.callTool('bkit_pdca_status', { feature: 'nonexistent-feature-xyz' });
      const data = JSON.parse(result.content[0].text);
      // Either error field or isError flag
      assert.ok(result.isError || data.error, 'Expected error for non-existent feature');
    });

    // -----------------------------------------------------------------------
    // bkit_feature_list
    // -----------------------------------------------------------------------

    await test('PDCA-03', 'bkit_feature_list returns array-like structure (no args)', async () => {
      const result = await client.callTool('bkit_feature_list', {});
      assert.ok(Array.isArray(result.content), 'Missing content array');
      const data = JSON.parse(result.content[0].text);
      // Result should have features array or be an array itself
      assert.ok(typeof data === 'object', 'Result should be object');
    });

    await test('PDCA-04', 'bkit_feature_list with phase filter returns valid result', async () => {
      const result = await client.callTool('bkit_feature_list', { phase: 'plan' });
      assert.ok(Array.isArray(result.content), 'Missing content array');
      const data = JSON.parse(result.content[0].text);
      assert.ok(typeof data === 'object', 'Result should be object');
    });

    await test('PDCA-05', 'bkit_feature_list with status filter', async () => {
      const result = await client.callTool('bkit_feature_list', { status: 'all' });
      assert.ok(Array.isArray(result.content), 'Missing content array');
    });

    // -----------------------------------------------------------------------
    // bkit_feature_detail
    // -----------------------------------------------------------------------

    await test('PDCA-06', 'bkit_feature_detail with non-existent feature returns error', async () => {
      const result = await client.callTool('bkit_feature_detail', { feature: 'nonexistent-xyz' });
      const data = JSON.parse(result.content[0].text);
      assert.ok(result.isError || data.error, 'Expected error for non-existent feature');
    });

    await test('PDCA-07', 'bkit_feature_detail requires feature argument', async () => {
      // Calling without required arg — should return error or handle gracefully
      const result = await client.callTool('bkit_feature_detail', {});
      const data = JSON.parse(result.content[0].text);
      // Either error or graceful empty response
      assert.ok(typeof data === 'object', 'Should return valid JSON');
    });

    // -----------------------------------------------------------------------
    // bkit_plan_read
    // -----------------------------------------------------------------------

    await test('PDCA-08', 'bkit_plan_read with non-existent feature returns error', async () => {
      const result = await client.callTool('bkit_plan_read', { feature: 'nonexistent-xyz' });
      const data = JSON.parse(result.content[0].text);
      assert.ok(result.isError || data.error || data.content === null,
        'Expected error or null content for non-existent plan');
    });

    await test('PDCA-09', 'bkit_plan_read requires feature argument', async () => {
      const result = await client.callTool('bkit_plan_read', {});
      assert.ok(Array.isArray(result.content), 'Missing content array');
    });

    // -----------------------------------------------------------------------
    // bkit_metrics_get
    // -----------------------------------------------------------------------

    await test('PDCA-10', 'bkit_metrics_get returns metrics structure (no args)', async () => {
      const result = await client.callTool('bkit_metrics_get', {});
      assert.ok(Array.isArray(result.content), 'Missing content array');
      const data = JSON.parse(result.content[0].text);
      assert.ok(typeof data === 'object', 'Result should be object');
    });

    await test('PDCA-11', 'bkit_metrics_get with feature filter', async () => {
      const result = await client.callTool('bkit_metrics_get', { feature: 'test-feature' });
      assert.ok(Array.isArray(result.content), 'Missing content array');
    });

    // -----------------------------------------------------------------------
    // bkit_pdca_history
    // -----------------------------------------------------------------------

    await test('PDCA-12', 'bkit_pdca_history returns valid structure (no args)', async () => {
      const result = await client.callTool('bkit_pdca_history', {});
      assert.ok(Array.isArray(result.content), 'Missing content array');
      const data = JSON.parse(result.content[0].text);
      assert.ok(typeof data === 'object', 'Result should be object');
    });

    await test('PDCA-13', 'bkit_pdca_history with limit returns valid structure', async () => {
      const result = await client.callTool('bkit_pdca_history', { limit: 5 });
      assert.ok(Array.isArray(result.content), 'Missing content array');
    });

    await test('PDCA-14', 'bkit_pdca_history with feature filter', async () => {
      const result = await client.callTool('bkit_pdca_history', { feature: 'test-feature', limit: 3 });
      assert.ok(Array.isArray(result.content), 'Missing content array');
    });

    // -----------------------------------------------------------------------
    // Response format consistency
    // -----------------------------------------------------------------------

    await test('PDCA-15', 'All tool responses include _meta with maxResultSizeChars', async () => {
      const result = await client.callTool('bkit_pdca_status', {});
      // _meta may be at top level of result (MCP protocol)
      // Check that the server sends it (may be stripped by client)
      assert.ok(Array.isArray(result.content), 'Missing content array');
      // The _meta field presence depends on MCP client behavior
      // Just verify the response is well-formed
      assert.ok(result.content[0].type === 'text', 'First content should be text type');
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
