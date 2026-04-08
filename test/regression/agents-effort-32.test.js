#!/usr/bin/env node
'use strict';

/**
 * Regression Test: Agent Effort & MaxTurns Validation (32 Agents)
 *
 * Reads all agent .md files and validates that every agent has
 * valid effort (low|medium|high) and maxTurns (positive integer) in frontmatter.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const AGENTS_DIR = path.join(ROOT, 'agents');

let passed = 0, failed = 0, total = 0;

function test(id, desc, fn) {
  total++;
  try { fn(); passed++; } catch (e) { failed++; console.error(`  FAIL ${id}: ${desc}\n    ${e.message}`); }
}

console.log('\n=== Agents Effort-32 Regression Tests ===\n');

// ---------------------------------------------------------------------------
// Read all agent files and parse frontmatter
// ---------------------------------------------------------------------------

const agentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md')).sort();

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const yaml = match[1];
  const result = {};
  for (const line of yaml.split('\n')) {
    const kv = line.match(/^(\w[\w-]*):\s*(.+)/);
    if (kv) {
      result[kv[1]] = kv[2].trim();
    }
  }
  return result;
}

const agents = agentFiles.map(file => {
  const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8');
  return { file, fm: parseFrontmatter(content) };
});

// ---------------------------------------------------------------------------
// T01: All 32 agents have effort field
// ---------------------------------------------------------------------------

test('EFF-01', 'All 32 agents have effort field in frontmatter', () => {
  const missing = agents.filter(a => !a.fm || !a.fm.effort).map(a => a.file);
  assert.strictEqual(missing.length, 0, `Agents missing effort:\n    ${missing.join('\n    ')}`);
});

// ---------------------------------------------------------------------------
// T02: All effort values are valid (low|medium|high)
// ---------------------------------------------------------------------------

const VALID_EFFORTS = ['low', 'medium', 'high'];

test('EFF-02', 'All effort values are low, medium, or high', () => {
  const invalid = agents
    .filter(a => a.fm && a.fm.effort && !VALID_EFFORTS.includes(a.fm.effort))
    .map(a => `${a.file}: effort="${a.fm.effort}"`);
  assert.strictEqual(invalid.length, 0, `Invalid effort values:\n    ${invalid.join('\n    ')}`);
});

// ---------------------------------------------------------------------------
// T03: All 32 agents have maxTurns field
// ---------------------------------------------------------------------------

test('EFF-03', 'All 32 agents have maxTurns field in frontmatter', () => {
  const missing = agents.filter(a => !a.fm || !a.fm.maxTurns).map(a => a.file);
  assert.strictEqual(missing.length, 0, `Agents missing maxTurns:\n    ${missing.join('\n    ')}`);
});

// ---------------------------------------------------------------------------
// T04: All maxTurns values are positive integers
// ---------------------------------------------------------------------------

test('EFF-04', 'All maxTurns values are positive integers', () => {
  const invalid = agents.filter(a => {
    if (!a.fm || !a.fm.maxTurns) return false;
    const n = parseInt(a.fm.maxTurns, 10);
    return isNaN(n) || n <= 0 || String(n) !== a.fm.maxTurns;
  }).map(a => `${a.file}: maxTurns="${a.fm.maxTurns}"`);
  assert.strictEqual(invalid.length, 0, `Invalid maxTurns values:\n    ${invalid.join('\n    ')}`);
});

// ---------------------------------------------------------------------------
// T05: Effort distribution is reasonable (not all same value)
// ---------------------------------------------------------------------------

test('EFF-05', 'Effort distribution has at least 2 distinct values', () => {
  const efforts = new Set(agents.filter(a => a.fm && a.fm.effort).map(a => a.fm.effort));
  assert.ok(efforts.size >= 2,
    `Expected at least 2 distinct effort values, got ${efforts.size}: ${[...efforts].join(', ')}`);
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
