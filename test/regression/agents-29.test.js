#!/usr/bin/env node
'use strict';
/**
 * Regression Test: 29+ Agents Full Verification (25 TC)
 * AG-001~029: Each of 29+ agents has valid frontmatter (model, effort, maxTurns)
 *
 * @version bkit v2.0.0
 */

const fs = require('fs');
const path = require('path');
const { assert, skip, summary, reset } = require('../helpers/assert');
reset();

const BASE_DIR = path.resolve(__dirname, '../..');
const AGENTS_DIR = path.join(BASE_DIR, 'agents');

console.log('\n=== agents-29.test.js (25 TC) ===\n');

// --- Valid field values ---
// v2.1.25: 'fable' added (Claude 5 model alignment)
const VALID_MODELS = ['opus', 'sonnet', 'haiku', 'fable'];
const VALID_EFFORTS = ['high', 'medium', 'low'];

/**
 * Parse YAML frontmatter from markdown file
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const raw = match[1];
  const result = {};
  const lines = raw.split('\n');
  for (const line of lines) {
    const keyMatch = line.match(/^(\w[\w-]*)\s*:\s*(.*)/);
    if (keyMatch) {
      result[keyMatch[1]] = keyMatch[2].trim();
    }
  }
  return result;
}

// Discover all agent files
const agentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));

// ============================================================
// AG-001~010: First 10 agents - full frontmatter validation
// ============================================================
console.log('--- Agents 1-10: Frontmatter Validation ---');

for (let i = 0; i < 10 && i < agentFiles.length; i++) {
  const file = agentFiles[i];
  const num = String(i + 1).padStart(3, '0');
  const agentName = file.replace('.md', '');
  const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
  const fm = parseFrontmatter(content);

  const hasModel = fm && VALID_MODELS.includes(fm.model);
  const hasEffort = fm && VALID_EFFORTS.includes(fm.effort);
  // v2.1.25: deprecation tombstones (deprecatedIn) carry minimal frontmatter
  // per contract-baseline-rollforward SOP §5.3 (no maxTurns) — exempt them.
  const hasMaxTurns = fm && ((fm.maxTurns && parseInt(fm.maxTurns) > 0) || fm.deprecatedIn);

  assert(`AG-${num}`, hasModel && hasEffort && hasMaxTurns,
    `${agentName}: model=${fm?.model || 'N/A'}, effort=${fm?.effort || 'N/A'}, maxTurns=${fm?.maxTurns || 'N/A'}`);
}

// ============================================================
// AG-011~020: Agents 11-20
// ============================================================
console.log('\n--- Agents 11-20: Frontmatter Validation ---');

for (let i = 10; i < 20 && i < agentFiles.length; i++) {
  const file = agentFiles[i];
  const num = String(i + 1).padStart(3, '0');
  const agentName = file.replace('.md', '');
  const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
  const fm = parseFrontmatter(content);

  const hasModel = fm && VALID_MODELS.includes(fm.model);
  const hasEffort = fm && VALID_EFFORTS.includes(fm.effort);
  // v2.1.25: deprecation tombstones exempt from maxTurns (SOP §5.3)
  const hasMaxTurns = fm && ((fm.maxTurns && parseInt(fm.maxTurns) > 0) || fm.deprecatedIn);

  assert(`AG-${num}`, hasModel && hasEffort && hasMaxTurns,
    `${agentName}: model=${fm?.model || 'N/A'}, effort=${fm?.effort || 'N/A'}, maxTurns=${fm?.maxTurns || 'N/A'}`);
}

// ============================================================
// AG-021~025: Remaining agents and aggregate checks
// ============================================================
console.log('\n--- Agents 21+: Remaining and Aggregate ---');

// AG-021: All remaining agents have valid frontmatter
const remaining = agentFiles.slice(20);
let allRemainingValid = true;
const invalidRemaining = [];
for (const file of remaining) {
  const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
  const fm = parseFrontmatter(content);
  if (!fm || !VALID_MODELS.includes(fm.model)) {
    allRemainingValid = false;
    invalidRemaining.push(file);
  }
}
assert('AG-021', allRemainingValid,
  `Remaining ${remaining.length} agents have valid model${invalidRemaining.length ? ' INVALID: ' + invalidRemaining.join(', ') : ''}`);

// AG-022: Total agent count >= 29
assert('AG-022', agentFiles.length >= 29,
  `Total agent count >= 29 (found ${agentFiles.length})`);

// AG-023: All agents have effort field
let allEffort = true;
const noEffort = [];
for (const file of agentFiles) {
  const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
  if (!content.match(/^effort:\s*\S+/m)) {
    allEffort = false;
    noEffort.push(file);
  }
}
assert('AG-023', allEffort,
  `All agents have effort field${noEffort.length ? ' MISSING: ' + noEffort.join(', ') : ''}`);

// AG-024: All agents have maxTurns field
let allMaxTurns = true;
const noMaxTurns = [];
for (const file of agentFiles) {
  const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
  // v2.1.25: deprecation tombstones (deprecatedIn) are exempt — SOP §5.3 minimal frontmatter.
  if (!content.match(/^maxTurns:\s*\d+/m) && !content.match(/^deprecatedIn:\s*\S+/m)) {
    allMaxTurns = false;
    noMaxTurns.push(file);
  }
}
assert('AG-024', allMaxTurns,
  `All agents have maxTurns field${noMaxTurns.length ? ' MISSING: ' + noMaxTurns.join(', ') : ''}`);

// AG-025: All agents have name in frontmatter
let allName = true;
const noName = [];
for (const file of agentFiles) {
  const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
  const fm = parseFrontmatter(content);
  if (!fm || !fm.name) {
    allName = false;
    noName.push(file);
  }
}
assert('AG-025', allName,
  `All agents have name in frontmatter${noName.length ? ' MISSING: ' + noName.join(', ') : ''}`);

// ============================================================
// Summary
// ============================================================
const result = summary('29+ Agents Regression Tests');
if (result.failed > 0) process.exit(1);
