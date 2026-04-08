#!/usr/bin/env node
'use strict';
/**
 * Regression Test: Claude Code Compatibility (15 TC)
 * CC-001~005: CC v2.1.94+ features used (PLUGIN_DATA, agent frontmatter)
 * CC-006~010: hooks.json timeout values within CC limits
 * CC-011~015: plugin.json engines field correct
 *
 * @version bkit v2.0.0
 */

const fs = require('fs');
const path = require('path');
const { assert, summary, reset } = require('../helpers/assert');
reset();

const BASE_DIR = path.resolve(__dirname, '../..');
const AGENTS_DIR = path.join(BASE_DIR, 'agents');
const HOOKS_DIR = path.join(BASE_DIR, 'hooks');

console.log('\n=== cc-compat.test.js (15 TC) ===\n');

// --- Load configs ---
const pluginJson = JSON.parse(fs.readFileSync(path.join(BASE_DIR, '.claude-plugin', 'plugin.json'), 'utf-8'));
const hooksConfig = JSON.parse(fs.readFileSync(path.join(HOOKS_DIR, 'hooks.json'), 'utf-8'));
const bkitConfig = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'bkit.config.json'), 'utf-8'));

// ============================================================
// CC-001~005: CC v2.1.94+ features used
// ============================================================
console.log('--- CC v2.1.94+ Features ---');

// CC-001: plugin.json engines requires >=2.1.78
assert('CC-001', pluginJson.engines && pluginJson.engines['claude-code'] &&
  pluginJson.engines['claude-code'].=== undefined,
  `plugin.json engines.claude-code = "${pluginJson.engines?.['claude-code']}" (engines removed - CC #17272 Not Planned)`);

// CC-002: hooks.json references ${CLAUDE_PLUGIN_ROOT}
const hooksStr = JSON.stringify(hooksConfig);
const pluginRootRefs = (hooksStr.match(/\$\{CLAUDE_PLUGIN_ROOT\}/g) || []).length;
assert('CC-002', pluginRootRefs > 0,
  `hooks.json uses \${CLAUDE_PLUGIN_ROOT} (${pluginRootRefs} references)`);

// CC-003: All agents have model field (v2.1.94 frontmatter)
const agentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
let allHaveModel = true;
for (const file of agentFiles) {
  const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
  if (!content.match(/^model:\s*\S+/m)) { allHaveModel = false; break; }
}
assert('CC-003', allHaveModel,
  'All agents have model field (v2.1.94 native frontmatter)');

// CC-004: All agents have effort field (v2.1.94 frontmatter)
let allHaveEffort = true;
for (const file of agentFiles) {
  const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
  if (!content.match(/^effort:\s*\S+/m)) { allHaveEffort = false; break; }
}
assert('CC-004', allHaveEffort,
  'All agents have effort field (v2.1.94 native frontmatter)');

// CC-005: All agents have maxTurns field (v2.1.94 frontmatter)
let allHaveMaxTurns = true;
for (const file of agentFiles) {
  const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
  if (!content.match(/^maxTurns:\s*\d+/m)) { allHaveMaxTurns = false; break; }
}
assert('CC-005', allHaveMaxTurns,
  'All agents have maxTurns field (v2.1.94 native frontmatter)');

// ============================================================
// CC-006~010: hooks.json timeout values within CC limits
// ============================================================
console.log('\n--- Hook Timeout Validation ---');

// CC max timeout is 60000ms (60 seconds)
const CC_MAX_TIMEOUT = 60000;

// CC-006: All hook timeouts are numbers
let allTimeoutsNumeric = true;
const nonNumeric = [];
for (const [event, entries] of Object.entries(hooksConfig.hooks)) {
  const arr = Array.isArray(entries) ? entries : [entries];
  for (const entry of arr) {
    for (const hook of (entry.hooks || [])) {
      if (typeof hook.timeout !== 'number') {
        allTimeoutsNumeric = false;
        nonNumeric.push(event);
      }
    }
  }
}
assert('CC-006', allTimeoutsNumeric,
  `All hook timeouts are numeric${nonNumeric.length ? ' NON-NUMERIC: ' + nonNumeric.join(', ') : ''}`);

// CC-007: All timeouts within CC max limit
let allWithinLimit = true;
const exceeding = [];
for (const [event, entries] of Object.entries(hooksConfig.hooks)) {
  const arr = Array.isArray(entries) ? entries : [entries];
  for (const entry of arr) {
    for (const hook of (entry.hooks || [])) {
      if (hook.timeout > CC_MAX_TIMEOUT) {
        allWithinLimit = false;
        exceeding.push(`${event}(${hook.timeout}ms)`);
      }
    }
  }
}
assert('CC-007', allWithinLimit,
  `All timeouts <= ${CC_MAX_TIMEOUT}ms${exceeding.length ? ' EXCEEDING: ' + exceeding.join(', ') : ''}`);

// CC-008: SessionStart timeout reasonable (<10s)
const sessionStart = hooksConfig.hooks.SessionStart;
const ssTimeout = sessionStart?.[0]?.hooks?.[0]?.timeout || 0;
assert('CC-008', ssTimeout > 0 && ssTimeout <= 10000,
  `SessionStart timeout = ${ssTimeout}ms (<=10000ms)`);

// CC-009: Stop hook timeout allows completion
const stopHook = hooksConfig.hooks.Stop;
const stopTimeout = stopHook?.[0]?.hooks?.[0]?.timeout || 0;
assert('CC-009', stopTimeout >= 5000,
  `Stop hook timeout = ${stopTimeout}ms (>=5000ms for graceful shutdown)`);

// CC-010: No hardcoded absolute paths
const hasHardcodedPaths = /\/Users\/|\/home\/|C:\\/i.test(hooksStr);
assert('CC-010', !hasHardcodedPaths,
  'hooks.json has no hardcoded absolute paths (portable)');

// ============================================================
// CC-011~015: plugin.json correctness
// ============================================================
console.log('\n--- plugin.json Validation ---');

// CC-011: plugin.json has version
assert('CC-011', typeof pluginJson.version === 'string' && pluginJson.version.length > 0,
  `plugin.json version = "${pluginJson.version}"`);

// CC-012: plugin.json version matches bkit.config.json
assert('CC-012', pluginJson.version === bkitConfig.version,
  `plugin.json version (${pluginJson.version}) matches bkit.config.json (${bkitConfig.version})`);

// CC-013: plugin.json has outputStyles
assert('CC-013', typeof pluginJson.outputStyles === 'string',
  `plugin.json outputStyles = "${pluginJson.outputStyles}"`);

// CC-014: plugin.json has name field
assert('CC-014', pluginJson.name === 'bkit',
  `plugin.json name = "${pluginJson.name}"`);

// CC-015: plugin.json has license
assert('CC-015', pluginJson.license === 'Apache-2.0',
  `plugin.json license = "${pluginJson.license}"`);

// ============================================================
// Summary
// ============================================================
const result = summary('Claude Code Compatibility Regression Tests');
if (result.failed > 0) process.exit(1);
