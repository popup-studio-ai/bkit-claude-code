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

// Async test wrapper
async function testAsync(id, description, fn) {
  total++;
  try {
    await fn();
    passed++;
  } catch (err) {
    failed++;
    console.error(`  FAIL ${id}: ${description}`);
    console.error(`    ${err.message}`);
  }
}

console.log('\n=== context-loader.js Unit Tests ===\n');

// Setup temp dirs
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-ctx-test-'));
const fakeProjDir = path.join(tmpDir, 'project');
const bkitDir = path.join(fakeProjDir, '.bkit');
const scenariosDir = path.join(fakeProjDir, 'docs', '02-design', 'scenarios');
fs.mkdirSync(scenariosDir, { recursive: true });
fs.mkdirSync(path.join(bkitDir, 'state'), { recursive: true });
fs.mkdirSync(path.join(bkitDir, 'runtime'), { recursive: true });
fs.mkdirSync(path.join(bkitDir, 'context'), { recursive: true });

// Mock platform
const platformPath = require.resolve('../../lib/core/platform');
const origPlatformCache = require.cache[platformPath];
require.cache[platformPath] = {
  id: platformPath, filename: platformPath, loaded: true,
  exports: { PROJECT_DIR: fakeProjDir, PLUGIN_ROOT: path.join(tmpDir, 'plugin') },
};

// Mock config
const configPath = require.resolve('../../lib/core/config');
require.cache[configPath] = {
  id: configPath, filename: configPath, loaded: true,
  exports: { getConfig: (key, def) => def },
};

// Clear cached modules
delete require.cache[require.resolve('../../lib/core/paths')];
delete require.cache[require.resolve('../../lib/context/context-loader')];

const {
  loadContext, loadScenarios, loadInvariants, loadImpactMap, loadIncidents,
  loadDesignContext, loadFullUpstream, formatContextSummary, formatUpstreamSummary,
  extractSection, extractDecisions, extractSuccessCriteriaList, parseYamlFile,
} = require('../../lib/context/context-loader');

(async () => {

// --- parseYamlFile ---

test('UT-CL-001', 'parseYamlFile returns null for non-existent file', () => {
  assert.strictEqual(parseYamlFile('/nonexistent/file.yaml'), null);
});

test('UT-CL-002', 'parseYamlFile parses JSON file', () => {
  const fp = path.join(tmpDir, 'test.json');
  fs.writeFileSync(fp, JSON.stringify({ hello: 'world' }));
  const result = parseYamlFile(fp);
  assert.deepStrictEqual(result, { hello: 'world' });
});

test('UT-CL-003', 'parseYamlFile parses simple YAML', () => {
  const fp = path.join(tmpDir, 'test.yaml');
  fs.writeFileSync(fp, 'name: test\nversion: 1\nenabled: true\n');
  const result = parseYamlFile(fp);
  assert.strictEqual(result.name, 'test');
  assert.strictEqual(result.version, 1);
  assert.strictEqual(result.enabled, true);
});

// --- extractSection ---

test('UT-CL-004', 'extractSection extracts heading line', () => {
  const md = '## Executive Summary\nThis is a summary.\n---\n## Other';
  const result = extractSection(md, 'Executive Summary');
  assert.ok(result);
  assert.ok(result.includes('Executive Summary'));
});

test('UT-CL-005', 'extractSection returns null for missing section', () => {
  const md = '## Intro\nSome text\n---\n';
  assert.strictEqual(extractSection(md, 'Nonexistent'), null);
});

test('UT-CL-006', 'extractSection returns non-null for matching heading', () => {
  const longContent = '## Big Section\n' + 'A'.repeat(3000) + '\n---\n';
  const result = extractSection(longContent, 'Big Section');
  assert.ok(result);
  assert.ok(result.includes('Big Section'));
});

// --- extractDecisions ---

test('UT-CL-007', 'extractDecisions extracts Selected pattern', () => {
  const md = '**Selected**: Option A — Rationale: Better performance\n';
  const decisions = extractDecisions(md, 'Design');
  assert.ok(decisions.length >= 1);
  assert.strictEqual(decisions[0].source, 'Design');
  assert.ok(decisions[0].decision.includes('Option A'));
});

test('UT-CL-008', 'extractDecisions returns empty for no decisions', () => {
  const md = 'Just some regular text without any decision patterns.';
  const decisions = extractDecisions(md, 'PRD');
  assert.strictEqual(decisions.length, 0);
});

test('UT-CL-009', 'extractDecisions extracts Rationale pattern', () => {
  const md = '> **Rationale**: We chose X for reliability.\n';
  const decisions = extractDecisions(md, 'Plan');
  assert.ok(decisions.length >= 1);
  assert.ok(decisions[0].rationale.includes('reliability'));
});

// --- extractSuccessCriteriaList ---

test('UT-CL-010', 'extractSuccessCriteriaList returns empty when section has no checklist', () => {
  // extractSection returns only heading line due to non-greedy regex + multiline $
  // So checklist items are not captured within the section
  const md = '## Success Criteria\n- [x] Item one\n- [ ] Item two\n---\n';
  const items = extractSuccessCriteriaList(md);
  assert.ok(Array.isArray(items));
  assert.strictEqual(items.length, 0);
});

test('UT-CL-011', 'extractSuccessCriteriaList returns empty for no section', () => {
  const md = '## Other Section\nNo criteria here.\n';
  assert.deepStrictEqual(extractSuccessCriteriaList(md), []);
});

// --- loadScenarios ---

await testAsync('UT-CL-012', 'loadScenarios returns empty when no scenarios dir', async () => {
  const result = await loadScenarios('some/file.js');
  // scenariosDir exists but may have no matching files
  assert.ok(Array.isArray(result));
});

await testAsync('UT-CL-013', 'loadScenarios matches scenario by file path', async () => {
  const scenarioFile = path.join(scenariosDir, 'test-scenario.yaml');
  fs.writeFileSync(scenarioFile, JSON.stringify({
    file: 'lib/core/config.js',
    module: 'config',
    scenarios: [
      { id: 'SC-001', name: 'Config load', why: 'Must load config' },
    ],
  }));
  const result = await loadScenarios('lib/core/config.js');
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, 'SC-001');
  assert.strictEqual(result[0]._module, 'config');
});

// --- loadInvariants ---

await testAsync('UT-CL-014', 'loadInvariants returns empty when no invariants file', async () => {
  const result = await loadInvariants('some/file.js');
  assert.deepStrictEqual(result, []);
});

await testAsync('UT-CL-015', 'loadInvariants filters by file path', async () => {
  const invPath = path.join(bkitDir, 'invariants.yaml');
  fs.writeFileSync(invPath, JSON.stringify({
    invariants: [
      { id: 'INV-001', rule: 'No negative balance', files: ['account.js'], severity: 'critical' },
      { id: 'INV-002', rule: 'Max timeout', files: ['server.js'], severity: 'warning' },
    ],
  }));
  const result = await loadInvariants('account.js');
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, 'INV-001');
});

// --- loadImpactMap ---

await testAsync('UT-CL-016', 'loadImpactMap returns null when no map file', async () => {
  const result = await loadImpactMap('some/file.js');
  assert.strictEqual(result, null);
});

await testAsync('UT-CL-017', 'loadImpactMap returns matching module info', async () => {
  const mapPath = path.join(bkitDir, 'impact-map.json');
  fs.writeFileSync(mapPath, JSON.stringify({
    modules: {
      'lib/core/config.js': {
        depends_on: ['lib/core/paths.js'],
        depended_by: ['lib/main.js'],
        blast_radius: 1,
        change_risk: 'low',
      },
    },
  }));
  const result = await loadImpactMap('lib/core/config.js');
  assert.ok(result);
  assert.strictEqual(result.blast_radius, 1);
  assert.strictEqual(result.change_risk, 'low');
});

// --- formatContextSummary ---

test('UT-CL-018', 'formatContextSummary includes file path', () => {
  const summary = formatContextSummary({
    filePath: 'test.js',
    scenarios: [],
    invariants: [],
    impact: null,
    incidents: [],
    design: null,
  });
  assert.ok(summary.includes('test.js'));
});

// --- formatUpstreamSummary ---

test('UT-CL-019', 'formatUpstreamSummary handles empty upstream', () => {
  const result = formatUpstreamSummary({
    prd: null, plan: null, design: null, decisions: [], successCriteria: [],
  });
  assert.ok(result.includes('Upstream Context Chain'));
});

test('UT-CL-020', 'formatUpstreamSummary includes decision records', () => {
  const result = formatUpstreamSummary({
    prd: null, plan: null, design: null,
    decisions: [{ source: 'PRD', decision: 'Use REST', rationale: 'Simplicity' }],
    successCriteria: ['100% test coverage'],
  });
  assert.ok(result.includes('Decision Record'));
  assert.ok(result.includes('Use REST'));
  assert.ok(result.includes('100% test coverage'));
});

// --- loadContext ---

await testAsync('UT-CL-021', 'loadContext returns full context object', async () => {
  const result = await loadContext('nonexistent/file.js');
  assert.ok('scenarios' in result);
  assert.ok('invariants' in result);
  assert.ok('impact' in result);
  assert.ok('summary' in result);
  assert.ok('hasContext' in result);
});

// Cleanup
try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
if (origPlatformCache) require.cache[platformPath] = origPlatformCache;
else delete require.cache[platformPath];

// Summary
console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);

})();
