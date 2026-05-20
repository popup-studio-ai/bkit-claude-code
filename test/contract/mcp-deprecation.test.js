#!/usr/bin/env node
/**
 * MCP Tool Deprecation Schema — End-to-End Test (v2.1.17, CO-2.1).
 *
 * Verifies that `parseMCPToolBlocks` in contract-baseline-collect.js
 * correctly extracts inline `@deprecated since vX.X.X replacedBy=Y`
 * annotations from MCP server source files.
 *
 * Fixture: test/contract/fixtures/mcp-deprecation/servers/test-server/index.js
 *
 * Scenarios:
 *   1. Active tool — no annotation, deprecatedIn=null
 *   2. Simple deprecation — `// @deprecated since v1.0.0`
 *   3. Full deprecation — `// @deprecated since v1.5.0 replacedBy=X reason=...`
 *   4. JSDoc-style — `* @deprecated since v2.0.0 replacedBy=X`
 *   5. collectMCPTools persists baseline JSON with deprecation metadata
 *
 * Design Ref: docs/02-design/features/v2118-carryover-cleanup.design.md §4
 * Plan SC: CO-2.1 (v2.1.17 final scope).
 *
 * @module test/contract/mcp-deprecation.test
 */

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const FIXTURE_ROOT = path.join(PROJECT_ROOT, 'test/contract/fixtures/mcp-deprecation');
const { collectMCPTools } = require(path.join(
  PROJECT_ROOT, 'test/contract/scripts/contract-baseline-collect'
));

// Internal helper: parseMCPToolBlocks isn't exported, but collectMCPTools
// uses it. We invoke collectMCPTools with persist=false to inspect the
// in-memory result; then persist=true to verify the JSON capture format.

let pass = 0;
let fail = 0;
function test(name, fn) {
  try {
    fn();
    pass++;
    // eslint-disable-next-line no-console
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    // eslint-disable-next-line no-console
    console.error(`  ✗ ${name}: ${e.message}`);
  }
}

// eslint-disable-next-line no-console
console.log('[mcp-deprecation] CO-2.1 — MCP tool deprecation schema e2e test (v2.1.17)');

// === Read fixture source directly + use parseMCPToolBlocks via persist baseline path ===
// We capture into a temp dir to avoid contaminating the real baseline.
const tmpBaseline = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-mcp-dep-'));

const result = collectMCPTools({
  persist: true,
  baseDir: tmpBaseline,
  projectRoot: FIXTURE_ROOT,
});

// === Scenario 1: count + ordering ===
test('collectMCPTools returns 4 tools from fixture', () => {
  assert.equal(result.count, 4, `expected 4, got ${result.count}`);
  assert.deepEqual(result.servers['test-server'], [
    'bkit_active_tool',
    'bkit_deprecated_full',
    'bkit_deprecated_jsdoc',
    'bkit_deprecated_simple',
  ]);
});

// === Scenario 2: active tool — no deprecation ===
test('active tool baseline JSON has deprecatedIn=null', () => {
  const file = path.join(tmpBaseline, 'mcp-tools/test-server/bkit_active_tool.json');
  assert.ok(fs.existsSync(file), `missing: ${file}`);
  const meta = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(meta.name, 'bkit_active_tool');
  assert.equal(meta.deprecatedIn, null);
  assert.equal(meta.replacedBy, null);
});

// === Scenario 3: simple deprecation — since version only ===
test('simple deprecation captured (since v1.0.0, no replacedBy)', () => {
  const file = path.join(tmpBaseline, 'mcp-tools/test-server/bkit_deprecated_simple.json');
  const meta = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(meta.deprecatedIn, 'v1.0.0');
  assert.equal(meta.replacedBy, null);
});

// === Scenario 4: full deprecation — since + replacedBy + reason ===
test('full deprecation captured (since v1.5.0, replacedBy=bkit_active_tool)', () => {
  const file = path.join(tmpBaseline, 'mcp-tools/test-server/bkit_deprecated_full.json');
  const meta = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(meta.deprecatedIn, 'v1.5.0');
  assert.equal(meta.replacedBy, 'bkit_active_tool');
});

// === Scenario 5: JSDoc-style block comment ===
test('JSDoc-style deprecation captured (since v2.0.0, replacedBy=bkit_active_tool)', () => {
  const file = path.join(tmpBaseline, 'mcp-tools/test-server/bkit_deprecated_jsdoc.json');
  const meta = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(meta.deprecatedIn, 'v2.0.0');
  assert.equal(meta.replacedBy, 'bkit_active_tool');
});

// === Scenario 6: baseline JSON schema completeness ===
test('all baseline JSONs include {server, name, deprecatedIn, replacedBy}', () => {
  for (const tn of result.servers['test-server']) {
    const file = path.join(tmpBaseline, 'mcp-tools/test-server', `${tn}.json`);
    const meta = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(meta.server, 'test-server', `${tn}: server field`);
    assert.equal(meta.name, tn, `${tn}: name field`);
    assert.ok('deprecatedIn' in meta, `${tn}: deprecatedIn key`);
    assert.ok('replacedBy' in meta, `${tn}: replacedBy key`);
  }
});

// === Cleanup temp dir ===
fs.rmSync(tmpBaseline, { recursive: true, force: true });

// === Summary ===
// eslint-disable-next-line no-console
console.log(`\nmcp-deprecation.test.js: ${pass}/${pass + fail} PASS, ${fail} FAIL, 0 SKIP`);
process.exit(fail === 0 ? 0 : 1);
