#!/usr/bin/env node
'use strict';
/**
 * Version Centralization Tests (10 TC)
 * Verifies BKIT_VERSION is centralized and consistent (ENH-167/BP-2).
 *
 * VCZ-001~010
 * @version bkit v2.1.0
 */

const fs = require('fs');
const path = require('path');
const { assert, summary, reset } = require('../helpers/assert');
reset();

const BASE_DIR = path.resolve(__dirname, '../..');

console.log('=== Version Centralization Tests (10 TC) ===\n');

// VCZ-001: lib/core/version.js exists
const versionPath = path.join(BASE_DIR, 'lib/core/version.js');
assert('VCZ-001', fs.existsSync(versionPath),
  'lib/core/version.js exists (BP-2: BKIT_VERSION centralization)');

// VCZ-002: exports BKIT_VERSION
let version;
try {
  version = require(versionPath);
} catch (e) { version = null; }
assert('VCZ-002', version && typeof version.BKIT_VERSION === 'string',
  'version.js exports BKIT_VERSION string');

// VCZ-003: BKIT_VERSION matches plugin.json
const pluginJson = JSON.parse(fs.readFileSync(path.join(BASE_DIR, '.claude-plugin/plugin.json'), 'utf8'));
assert('VCZ-003', version && version.BKIT_VERSION === pluginJson.version,
  `BKIT_VERSION (${version?.BKIT_VERSION}) matches plugin.json (${pluginJson.version})`);

// VCZ-004: BKIT_VERSION matches bkit.config.json
const bkitConfig = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'bkit.config.json'), 'utf8'));
assert('VCZ-004', version && version.BKIT_VERSION === bkitConfig.version,
  `BKIT_VERSION (${version?.BKIT_VERSION}) matches bkit.config.json (${bkitConfig.version})`);

// VCZ-005: plugin.json has no engines field (CC #17272)
assert('VCZ-005', !pluginJson.engines,
  'plugin.json has no engines field (CC #17272 Not Planned)');

// VCZ-006: hooks.json description contains version
const hooksJson = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'hooks/hooks.json'), 'utf8'));
assert('VCZ-006', hooksJson.description && hooksJson.description.includes(version?.BKIT_VERSION || ''),
  `hooks.json description contains version ${version?.BKIT_VERSION}`);

// VCZ-007: 20+ hook events in hooks.json
const hookEvents = Object.keys(hooksJson.hooks || {});
assert('VCZ-007', hookEvents.length >= 20,
  `hooks.json has ${hookEvents.length} hook events (expected ≥20)`);

// VCZ-008: CwdChanged hook exists
assert('VCZ-008', hookEvents.includes('CwdChanged'),
  'hooks.json includes CwdChanged event (ENH-149)');

// VCZ-009: TaskCreated hook exists
assert('VCZ-009', hookEvents.includes('TaskCreated'),
  'hooks.json includes TaskCreated event (ENH-156)');

// VCZ-010: All 37 skills have effort frontmatter
const skillDirs = fs.readdirSync(path.join(BASE_DIR, 'skills')).filter(d =>
  fs.existsSync(path.join(BASE_DIR, 'skills', d, 'SKILL.md'))
);
let effortCount = 0;
for (const skill of skillDirs) {
  const content = fs.readFileSync(path.join(BASE_DIR, 'skills', skill, 'SKILL.md'), 'utf8');
  if (/^effort:/m.test(content)) effortCount++;
}
assert('VCZ-010', effortCount === skillDirs.length,
  `${effortCount}/${skillDirs.length} skills have effort frontmatter (ENH-134)`);

summary('Version Centralization Tests');
