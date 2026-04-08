#!/usr/bin/env node
'use strict';

/**
 * MCP Server Response Performance Tests
 * Tests: bkit-pdca-server and bkit-analysis-server response times.
 * Uses test/helpers/mcp-client.js
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

let passed = 0, failed = 0, skipped = 0, total = 0;
function test(id, desc, fn) {
  total++;
  try { fn(); passed++; } catch (e) {
    if (e.message && e.message.startsWith('SKIP:')) {
      skipped++;
      console.log(`  SKIP ${id}: ${desc} — ${e.message}`);
    } else {
      failed++;
      console.error(`  FAIL ${id}: ${desc}\n    ${e.message}`);
    }
  }
}

// Async test wrapper
const asyncTests = [];
function asyncTest(id, desc, fn) {
  asyncTests.push({ id, desc, fn });
}

console.log('\n=== MCP Response Performance Tests ===\n');

const { createMcpClient, ROOT } = require('../helpers/mcp-client');

const PDCA_SERVER = 'servers/bkit-pdca-server/index.js';
const ANALYSIS_SERVER = 'servers/bkit-analysis-server/index.js';
const TIMEOUT_MS = 500;

async function runTests() {
  // --- PDCA Server Tests ---

  let pdcaClient = null;
  let pdcaAvailable = false;

  try {
    if (!fs.existsSync(path.join(ROOT, PDCA_SERVER))) {
      throw new Error('SKIP: PDCA server file not found');
    }
    pdcaClient = await createMcpClient(PDCA_SERVER, { timeout: 5000 });
    pdcaAvailable = true;
  } catch (e) {
    console.log(`  SKIP PDCA server tests: ${e.message}`);
  }

  if (pdcaAvailable && pdcaClient) {
    // Initialize
    try {
      total++;
      const start = Date.now();
      const initResult = await pdcaClient.initialize();
      const dur = Date.now() - start;
      assert.ok(initResult, 'Initialize should return result');
      assert.ok(dur < TIMEOUT_MS, `PDCA initialize took ${dur}ms, budget ${TIMEOUT_MS}ms`);
      passed++;
    } catch (e) { failed++; console.error(`  FAIL MCP-01: PDCA server initialize <${TIMEOUT_MS}ms\n    ${e.message}`); }

    // tools/list
    try {
      total++;
      const start = Date.now();
      const tools = await pdcaClient.listTools();
      const dur = Date.now() - start;
      assert.ok(tools, 'tools/list should return result');
      assert.ok(dur < TIMEOUT_MS, `PDCA tools/list took ${dur}ms, budget ${TIMEOUT_MS}ms`);
      passed++;
    } catch (e) { failed++; console.error(`  FAIL MCP-02: PDCA server tools/list <${TIMEOUT_MS}ms\n    ${e.message}`); }

    // Tool calls
    const pdcaTools = [
      { name: 'bkit_pdca_status', args: {} },
      { name: 'bkit_feature_list', args: {} },
      { name: 'bkit_metrics_get', args: {} },
    ];

    for (let i = 0; i < pdcaTools.length; i++) {
      const t = pdcaTools[i];
      try {
        total++;
        const start = Date.now();
        await pdcaClient.callTool(t.name, t.args);
        const dur = Date.now() - start;
        assert.ok(dur < TIMEOUT_MS, `PDCA ${t.name} took ${dur}ms, budget ${TIMEOUT_MS}ms`);
        passed++;
      } catch (e) { failed++; console.error(`  FAIL MCP-0${3 + i}: PDCA ${t.name} <${TIMEOUT_MS}ms\n    ${e.message}`); }
    }

    await pdcaClient.close();
  } else {
    // Skip 5 tests
    for (let i = 0; i < 5; i++) { total++; skipped++; }
  }

  // --- Analysis Server Tests ---

  let analysisClient = null;
  let analysisAvailable = false;

  try {
    if (!fs.existsSync(path.join(ROOT, ANALYSIS_SERVER))) {
      throw new Error('SKIP: Analysis server file not found');
    }
    analysisClient = await createMcpClient(ANALYSIS_SERVER, { timeout: 5000 });
    analysisAvailable = true;
  } catch (e) {
    console.log(`  SKIP Analysis server tests: ${e.message}`);
  }

  if (analysisAvailable && analysisClient) {
    // Initialize
    try {
      total++;
      const start = Date.now();
      const initResult = await analysisClient.initialize();
      const dur = Date.now() - start;
      assert.ok(initResult, 'Initialize should return result');
      assert.ok(dur < TIMEOUT_MS, `Analysis initialize took ${dur}ms, budget ${TIMEOUT_MS}ms`);
      passed++;
    } catch (e) { failed++; console.error(`  FAIL MCP-06: Analysis server initialize <${TIMEOUT_MS}ms\n    ${e.message}`); }

    // tools/list
    try {
      total++;
      const start = Date.now();
      const tools = await analysisClient.listTools();
      const dur = Date.now() - start;
      assert.ok(tools, 'tools/list should return result');
      assert.ok(dur < TIMEOUT_MS, `Analysis tools/list took ${dur}ms, budget ${TIMEOUT_MS}ms`);
      passed++;
    } catch (e) { failed++; console.error(`  FAIL MCP-07: Analysis server tools/list <${TIMEOUT_MS}ms\n    ${e.message}`); }

    // Tool calls
    const analysisTools = [
      { name: 'bkit_checkpoint_list', args: {} },
      { name: 'bkit_regression_rules', args: {} },
    ];

    for (let i = 0; i < analysisTools.length; i++) {
      const t = analysisTools[i];
      try {
        total++;
        const start = Date.now();
        await analysisClient.callTool(t.name, t.args);
        const dur = Date.now() - start;
        assert.ok(dur < TIMEOUT_MS, `Analysis ${t.name} took ${dur}ms, budget ${TIMEOUT_MS}ms`);
        passed++;
      } catch (e) { failed++; console.error(`  FAIL MCP-0${8 + i}: Analysis ${t.name} <${TIMEOUT_MS}ms\n    ${e.message}`); }
    }

    await analysisClient.close();
  } else {
    // Skip 4 tests
    for (let i = 0; i < 4; i++) { total++; skipped++; }
  }

  console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed, ${skipped} skipped ---`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test runner error:', err.message);
  process.exit(1);
});
