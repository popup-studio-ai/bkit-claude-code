#!/usr/bin/env node
'use strict';
/**
 * Regression Test: v2.0.8 Version Consistency (25 TC)
 * VC2-001~025: Version numbers, CC compatibility, hook if field docs
 *
 * @version bkit v2.0.9
 */

const fs = require('fs');
const path = require('path');
const { assert, summary, reset } = require('../helpers/assert');
reset();

const BASE_DIR = path.resolve(__dirname, '../..');

console.log('\n=== v208-version-consistency.test.js (25 TC) ===\n');

// --- Load configs ---
const pluginJson = JSON.parse(fs.readFileSync(path.join(BASE_DIR, '.claude-plugin', 'plugin.json'), 'utf-8'));
const bkitConfig = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'bkit.config.json'), 'utf-8'));
const hooksJson = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'hooks', 'hooks.json'), 'utf-8'));
const readme = fs.readFileSync(path.join(BASE_DIR, 'README.md'), 'utf-8');
const bkitReadme = fs.readFileSync(path.join(BASE_DIR, 'bkit-system', 'README.md'), 'utf-8');
const sessionCtx = fs.readFileSync(path.join(BASE_DIR, 'hooks', 'startup', 'session-context.js'), 'utf-8');
const sessionStart = fs.readFileSync(path.join(BASE_DIR, 'hooks', 'session-start.js'), 'utf-8');
const contextEng = fs.readFileSync(path.join(BASE_DIR, 'bkit-system', 'philosophy', 'context-engineering.md'), 'utf-8');

// ENH-167 Phase B: 버전 하드코딩 제거 — bkit.config.json 단일 진실원 동적 참조
const EXPECTED_VERSION = bkitConfig.version;

// ============================================================
// VC2-001~005: Config Version Consistency
// ============================================================
console.log('--- VC2-001~005: Config Version ---');

assert('VC2-001', pluginJson.version === EXPECTED_VERSION,
  `plugin.json version = "${pluginJson.version}" (expected ${EXPECTED_VERSION})`);

assert('VC2-002', bkitConfig.version === EXPECTED_VERSION,
  `bkit.config.json version = "${bkitConfig.version}" (expected ${EXPECTED_VERSION})`);

assert('VC2-003', hooksJson.description.includes(`v${EXPECTED_VERSION}`),
  `hooks.json description contains v${EXPECTED_VERSION}`);

assert('VC2-004', sessionCtx.includes(`v${EXPECTED_VERSION}`),
  `session-context.js contains v${EXPECTED_VERSION}`);

assert('VC2-005', sessionStart.includes(`v${EXPECTED_VERSION}`),
  `session-start.js contains v${EXPECTED_VERSION}`);

// ============================================================
// VC2-006~008: README Version References
// ============================================================
console.log('\n--- VC2-006~008: README References ---');

assert('VC2-006', readme.includes(`v${EXPECTED_VERSION}`),
  `README.md contains v${EXPECTED_VERSION}`);

assert('VC2-007', bkitReadme.includes(`v${EXPECTED_VERSION}`),
  `bkit-system/README.md contains v${EXPECTED_VERSION}`);

assert('VC2-008', pluginJson.version === bkitConfig.version,
  `plugin.json and bkit.config.json versions match (${pluginJson.version})`);

// ============================================================
// VC2-009~012: CC Compatibility
// ============================================================
console.log('\n--- VC2-009~012: CC Compatibility ---');

assert('VC2-009', !pluginJson.engines /* v2.1.0: engines removed per CC #17272 */,
  'plugin.json engines field removed (CC #17272 Not Planned)');

assert('VC2-010', !pluginJson.engines /* v2.1.0: engines removed */,
  `engines.claude-code = "${pluginJson.engines?.['claude-code']}" (engines removed per CC #17272)`);

// VC2-011: 18 hook events in hooks.json
const hookEvents = Object.keys(hooksJson.hooks || {});
assert('VC2-011', hookEvents.length >= 18,
  `hooks.json has ${hookEvents.length} hook events (expected >= 18)`);

// VC2-012: All hook commands use ${CLAUDE_PLUGIN_ROOT}
const hooksStr = JSON.stringify(hooksJson);
const pluginRootCount = (hooksStr.match(/CLAUDE_PLUGIN_ROOT/g) || []).length;
assert('VC2-012', pluginRootCount >= 18,
  `hooks.json has ${pluginRootCount} CLAUDE_PLUGIN_ROOT references (>= 18)`);

// ============================================================
// VC2-013~018: ENH-160 Hook `if` Field Documentation
// ============================================================
console.log('\n--- VC2-013~018: Hook `if` Field Documentation ---');

assert('VC2-013', contextEng.includes('Hook `if` Conditional Field'),
  'context-engineering.md has Hook `if` Conditional Field section');

assert('VC2-014', contextEng.includes('CC v2.1.85'),
  'context-engineering.md references CC v2.1.85');

assert('VC2-015', contextEng.includes('permission rule syntax'),
  'context-engineering.md mentions permission rule syntax');

assert('VC2-016', contextEng.includes('Bash(git *)'),
  'context-engineering.md has Bash(git *) example');

assert('VC2-017', contextEng.includes('PreToolUse') && contextEng.includes('PostToolUse'),
  'context-engineering.md lists supported events (PreToolUse, PostToolUse)');

assert('VC2-018', contextEng.includes('bkit hooks do NOT use the `if` field'),
  'context-engineering.md documents bkit current state (no `if` usage)');

// ============================================================
// VC2-019~021: ENH-164 Org Policy Documentation
// ============================================================
console.log('\n--- VC2-019~021: Org Policy Documentation ---');

assert('VC2-019', contextEng.includes('Enterprise Org Policy'),
  'context-engineering.md has Enterprise Org Policy section');

assert('VC2-020', contextEng.includes('managed-settings.json'),
  'context-engineering.md mentions managed-settings.json');

assert('VC2-021', contextEng.includes('plugin installation/activation'),
  'context-engineering.md mentions plugin blocking');

// ============================================================
// VC2-022~025: Overview Files Version
// ============================================================
console.log('\n--- VC2-022~025: Overview Files ---');

const scriptsOverview = fs.readFileSync(path.join(BASE_DIR, 'bkit-system', 'components', 'scripts', '_scripts-overview.md'), 'utf-8');
const agentsOverview = fs.readFileSync(path.join(BASE_DIR, 'bkit-system', 'components', 'agents', '_agents-overview.md'), 'utf-8');
const skillsOverview = fs.readFileSync(path.join(BASE_DIR, 'bkit-system', 'components', 'skills', '_skills-overview.md'), 'utf-8');

assert('VC2-022', scriptsOverview.includes(`v${EXPECTED_VERSION}`),
  `scripts-overview.md header contains v${EXPECTED_VERSION}`);

assert('VC2-023', agentsOverview.includes(`v${EXPECTED_VERSION}`),
  `agents-overview.md header contains v${EXPECTED_VERSION}`);

assert('VC2-024', skillsOverview.includes(`v${EXPECTED_VERSION}`),
  `skills-overview.md header contains v${EXPECTED_VERSION}`);

// VC2-025: All 3 overview files reference same version
const allMatch = scriptsOverview.includes(`v${EXPECTED_VERSION}`) &&
  agentsOverview.includes(`v${EXPECTED_VERSION}`) &&
  skillsOverview.includes(`v${EXPECTED_VERSION}`);
assert('VC2-025', allMatch,
  'All overview files reference the same version');

// ============================================================
// Summary
// ============================================================
summary('v208-version-consistency.test.js');
if (require('../helpers/assert').getStats().failed > 0) process.exit(1);
