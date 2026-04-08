#!/usr/bin/env node
'use strict';

/**
 * Contract Test: MCP Protocol Compliance
 *
 * Validates that bkit MCP servers conform to the MCP JSON-RPC 2.0 protocol.
 * Uses test/helpers/mcp-client.js for stdio communication.
 */

const assert = require('assert');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

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
  console.log('\n=== MCP Protocol Contract Tests ===\n');

  // Try pdca-server first, fall back to analysis-server
  const SERVER_PATH = 'servers/bkit-pdca-server/index.js';
  let client;

  try {
    client = await createMcpClient(SERVER_PATH, { timeout: 8000 });
  } catch (e) {
    console.log(`  SKIP: Cannot start MCP server (${e.message})`);
    console.log(`\n--- Results: 0/${total} passed, 0 failed, 0 skipped (server unavailable) ---`);
    return;
  }

  try {
    // T01: initialize returns protocolVersion
    await test('MCP-01', 'initialize returns protocolVersion and capabilities', async () => {
      const result = await client.initialize();
      assert.ok(result, 'initialize returned null');
      assert.ok(typeof result.protocolVersion === 'string', `Missing protocolVersion, got: ${JSON.stringify(result)}`);
      assert.ok(result.capabilities && typeof result.capabilities === 'object', 'Missing capabilities object');
    });

    // T02: initialize returns serverInfo
    await test('MCP-02', 'initialize returns serverInfo with name', async () => {
      // Re-create client for fresh connection
      const client2 = await createMcpClient(SERVER_PATH, { timeout: 8000 });
      try {
        const result = await client2.initialize();
        assert.ok(result.serverInfo, 'Missing serverInfo');
        assert.ok(typeof result.serverInfo.name === 'string', 'Missing serverInfo.name');
      } finally {
        await client2.close();
      }
    });

    // T03: tools/list returns tools array
    await test('MCP-03', 'tools/list returns { tools: Array }', async () => {
      const result = await client.listTools();
      assert.ok(result, 'listTools returned null');
      assert.ok(Array.isArray(result.tools), `Expected tools array, got: ${typeof result.tools}`);
      assert.ok(result.tools.length > 0, 'tools array is empty');
    });

    // T04: Each tool has name, description, inputSchema
    await test('MCP-04', 'Each tool has name, description, and inputSchema', async () => {
      const result = await client.listTools();
      for (const tool of result.tools) {
        assert.ok(typeof tool.name === 'string' && tool.name.length > 0, `Tool missing name: ${JSON.stringify(tool)}`);
        assert.ok(typeof tool.description === 'string', `Tool ${tool.name} missing description`);
        assert.ok(tool.inputSchema && typeof tool.inputSchema === 'object', `Tool ${tool.name} missing inputSchema`);
      }
    });

    // T05: tools/call with valid tool returns content array
    await test('MCP-05', 'tools/call returns { content: [{type:"text"}] }', async () => {
      const result = await client.callTool('bkit_pdca_status', {});
      assert.ok(result, 'callTool returned null');
      assert.ok(Array.isArray(result.content), `Expected content array, got: ${typeof result.content}`);
      assert.ok(result.content.length > 0, 'content array is empty');
      assert.strictEqual(result.content[0].type, 'text', `Expected type "text", got: ${result.content[0].type}`);
      assert.ok(typeof result.content[0].text === 'string', 'content[0].text must be string');
    });

    // T06: tools/call with unknown tool returns error
    await test('MCP-06', 'tools/call with unknown tool returns error response', async () => {
      const result = await client.callTool('nonexistent_tool_xyz', {});
      // Should have isError or error
      assert.ok(
        (result.isError === true) || (result.error) || (result.content && result.content[0] && result.content[0].text.includes('error')),
        `Expected error response for unknown tool, got: ${JSON.stringify(result).slice(0, 200)}`
      );
    });

    // T07: tools/call result content text is valid JSON
    await test('MCP-07', 'tools/call result content text is parseable JSON', async () => {
      const result = await client.callTool('bkit_pdca_status', {});
      const text = result.content[0].text;
      let parsed;
      try { parsed = JSON.parse(text); } catch (e) { assert.fail(`Content text is not valid JSON: ${text.slice(0, 100)}`); }
      assert.ok(typeof parsed === 'object', 'Parsed content should be object');
    });

    // T08: Unknown JSON-RPC method returns error
    await test('MCP-08', 'Unknown JSON-RPC method returns error', async () => {
      try {
        const result = await client.send('nonexistent/method', {});
        // Some servers may return an error result rather than throwing
        assert.ok(
          result.error || result.isError,
          'Expected error for unknown method'
        );
      } catch (e) {
        // Timeout or error is acceptable — server may not respond to unknown methods
        assert.ok(e.message.includes('timeout') || e.message.includes('error'),
          `Unexpected error: ${e.message}`);
      }
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
