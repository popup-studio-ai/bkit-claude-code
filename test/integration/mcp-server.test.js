#!/usr/bin/env node
/**
 * MCP Server Integration Test
 * @module test/integration/mcp-server
 * @version 2.0.0
 *
 * Verifies MCP server modules load without error and the inline
 * mcpServers manifest in .claude-plugin/plugin.json (relocated from
 * root .mcp.json per design v2126-issue-response I-1..I-3).
 * 16 TC: MS-001 ~ MS-016
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

let passed = 0;
let failed = 0;
const results = [];

function assert(id, condition, description) {
  if (condition) {
    passed++;
    results.push({ id, status: 'PASS', description });
  } else {
    failed++;
    results.push({ id, status: 'FAIL', description });
    console.assert(false, `${id}: ${description}`);
  }
}

// ============================================================
// Section 1: bkit-pdca-server index.js loads without error (MS-001~005)
// ============================================================

const pdcaServerPath = path.join(PROJECT_ROOT, 'servers/bkit-pdca-server/index.js');

// MS-001: bkit-pdca-server/index.js exists
assert('MS-001',
  fs.existsSync(pdcaServerPath),
  'servers/bkit-pdca-server/index.js exists'
);

// MS-002: bkit-pdca-server/index.js is valid JavaScript (parseable)
let pdcaServerContent = null;
try {
  pdcaServerContent = fs.readFileSync(pdcaServerPath, 'utf8');
  assert('MS-002', pdcaServerContent.length > 0, 'bkit-pdca-server/index.js is non-empty');
} catch (e) {
  assert('MS-002', false, `bkit-pdca-server/index.js read failed: ${e.message}`);
}

// MS-003: bkit-pdca-server exports or defines MCP tools
assert('MS-003',
  pdcaServerContent !== null && /(?:tools|Tool|server|Server|createServer|MCP|handle)/.test(pdcaServerContent),
  'bkit-pdca-server/index.js defines MCP tools or server'
);

// MS-004: bkit-pdca-server references PDCA functionality
assert('MS-004',
  pdcaServerContent !== null && /(?:pdca|phase|feature|status|transition)/.test(pdcaServerContent),
  'bkit-pdca-server/index.js references PDCA functionality'
);

// MS-005: bkit-pdca-server has proper server structure (MCP stdio protocol)
assert('MS-005',
  pdcaServerContent !== null && (/serverInfo|server|stdin|stdio|handleRequest|process\.stdin/.test(pdcaServerContent)),
  'bkit-pdca-server/index.js has MCP server structure'
);

// ============================================================
// Section 2: bkit-analysis-server index.js loads without error (MS-006~010)
// ============================================================

const analysisServerPath = path.join(PROJECT_ROOT, 'servers/bkit-analysis-server/index.js');

// MS-006: bkit-analysis-server/index.js exists
assert('MS-006',
  fs.existsSync(analysisServerPath),
  'servers/bkit-analysis-server/index.js exists'
);

// MS-007: bkit-analysis-server/index.js is valid JavaScript
let analysisServerContent = null;
try {
  analysisServerContent = fs.readFileSync(analysisServerPath, 'utf8');
  assert('MS-007', analysisServerContent.length > 0, 'bkit-analysis-server/index.js is non-empty');
} catch (e) {
  assert('MS-007', false, `bkit-analysis-server/index.js read failed: ${e.message}`);
}

// MS-008: bkit-analysis-server exports or defines MCP tools
assert('MS-008',
  analysisServerContent !== null && /(?:tools|Tool|server|Server|createServer|MCP|handle)/.test(analysisServerContent),
  'bkit-analysis-server/index.js defines MCP tools or server'
);

// MS-009: bkit-analysis-server references analysis functionality
assert('MS-009',
  analysisServerContent !== null && /(?:analysis|analyze|gap|quality|metric|code)/.test(analysisServerContent),
  'bkit-analysis-server/index.js references analysis functionality'
);

// MS-010: bkit-analysis-server has proper server structure (MCP stdio protocol)
assert('MS-010',
  analysisServerContent !== null && (/serverInfo|server|stdin|stdio|handleRequest|process\.stdin/.test(analysisServerContent)),
  'bkit-analysis-server/index.js has MCP server structure'
);

// ============================================================
// Section 3: plugin.json inline mcpServers manifest (MS-011~016)
// Relocated from root .mcp.json per design v2126-issue-response
// (docs/02-design/features/v2126-issue-response.design.en.md §3, I-1..I-3).
// ============================================================

const pluginJsonPath = path.join(PROJECT_ROOT, '.claude-plugin', 'plugin.json');

// MS-011: plugin.json manifest exists
assert('MS-011',
  fs.existsSync(pluginJsonPath),
  '.claude-plugin/plugin.json exists'
);

// MS-012: plugin.json is valid JSON
let pluginManifest = null;
try {
  pluginManifest = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
  assert('MS-012', pluginManifest !== null, 'plugin.json parses as valid JSON');
} catch (e) {
  assert('MS-012', false, `plugin.json parse failed: ${e.message}`);
}

const mcpServers = pluginManifest !== null ? pluginManifest.mcpServers : null;

// MS-013: plugin.json has inline mcpServers key
assert('MS-013',
  mcpServers !== null && typeof mcpServers === 'object',
  'plugin.json has inline mcpServers object'
);

// Helper for the NEW args hardening assertion (v2126 I-3): current MS-014/015
// previously did NOT assert args — this locks the exact `${CLAUDE_PLUGIN_ROOT}`
// variable the dual-load bug hinged on.
function hasPluginRootArgs(entry) {
  return entry != null && Array.isArray(entry.args) &&
    typeof entry.args[0] === 'string' &&
    entry.args[0].includes('${CLAUDE_PLUGIN_ROOT}/servers/');
}

// MS-014: plugin.json mcpServers has bkit-pdca entry with command=node
// and (NEW hardening, v2126 I-3) args[0] under ${CLAUDE_PLUGIN_ROOT}/servers/
assert('MS-014',
  mcpServers !== null && mcpServers['bkit-pdca'] != null &&
  mcpServers['bkit-pdca'].command === 'node' &&
  hasPluginRootArgs(mcpServers['bkit-pdca']),
  'plugin.json mcpServers has bkit-pdca with command=node and ${CLAUDE_PLUGIN_ROOT}/servers/ args'
);

// MS-015: plugin.json mcpServers has bkit-analysis entry with command=node
// and (NEW hardening, v2126 I-3) args[0] under ${CLAUDE_PLUGIN_ROOT}/servers/
assert('MS-015',
  mcpServers !== null && mcpServers['bkit-analysis'] != null &&
  mcpServers['bkit-analysis'].command === 'node' &&
  hasPluginRootArgs(mcpServers['bkit-analysis']),
  'plugin.json mcpServers has bkit-analysis with command=node and ${CLAUDE_PLUGIN_ROOT}/servers/ args'
);

// MS-016 (NEW, regression lock — design v2126-issue-response I-3, reproduction R1):
// The root .mcp.json must NOT exist. When the repo is opened as cwd, CC auto-loads
// <cwd>/.mcp.json as PROJECT config where ${CLAUDE_PLUGIN_ROOT} is undefined —
// the same file was dual-loaded (plugin context OK, project context broken),
// greeting developers/cloners with failed MCP servers. The manifest now lives
// ONLY in .claude-plugin/plugin.json (inline mcpServers), which the plugin
// loader alone reads. This lock prevents the root file from ever returning.
assert('MS-016',
  !fs.existsSync(path.join(PROJECT_ROOT, '.mcp.json')),
  'root .mcp.json does not exist (dual-load regression lock, v2126 I-3/R1)'
);

// ============================================================
// Summary
// ============================================================
console.log('\n========================================');
console.log('MCP Server Integration Test Results');
console.log('========================================');
console.log(`Total: ${passed + failed} | PASS: ${passed} | FAIL: ${failed}`);
console.log(`Pass Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
console.log('----------------------------------------');
results.forEach(r => {
  console.log(`  ${r.status === 'PASS' ? '[PASS]' : '[FAIL]'} ${r.id}: ${r.description}`);
});
console.log('========================================\n');

module.exports = { passed, failed, total: passed + failed, results };
if (failed > 0) process.exit(1);
