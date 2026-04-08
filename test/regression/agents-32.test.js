#!/usr/bin/env node
'use strict';

/**
 * Regression Test: 32 Agent Files
 *
 * Verifies that all expected agent .md files exist in agents/ directory
 * and each has valid frontmatter with required fields.
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

console.log('\n=== Agents-32 Regression Tests ===\n');

// ---------------------------------------------------------------------------
// Read all agent files
// ---------------------------------------------------------------------------

const agentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md')).sort();

// ---------------------------------------------------------------------------
// T01: At least 32 agent .md files exist
// ---------------------------------------------------------------------------

test('AGT-01', 'At least 32 agent .md files exist', () => {
  assert.ok(agentFiles.length >= 32,
    `Expected >= 32 agent files, got ${agentFiles.length}: ${agentFiles.join(', ')}`);
});

// ---------------------------------------------------------------------------
// T02: self-healing.md exists (was missing from older tests)
// ---------------------------------------------------------------------------

test('AGT-02', 'self-healing.md exists', () => {
  assert.ok(agentFiles.includes('self-healing.md'), 'self-healing.md not found in agents/');
});

// ---------------------------------------------------------------------------
// T03: Each agent has valid YAML frontmatter (model, effort, maxTurns)
// ---------------------------------------------------------------------------

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

test('AGT-03', 'Each agent has valid frontmatter with model, effort, maxTurns', () => {
  const invalid = [];
  for (const file of agentFiles) {
    const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8');
    const fm = parseFrontmatter(content);
    if (!fm) {
      invalid.push(`${file}: no frontmatter`);
      continue;
    }
    if (!fm.model) invalid.push(`${file}: missing model`);
    if (!fm.effort) invalid.push(`${file}: missing effort`);
    if (!fm.maxTurns) invalid.push(`${file}: missing maxTurns`);
  }
  assert.strictEqual(invalid.length, 0, `Invalid agents:\n    ${invalid.join('\n    ')}`);
});

// ---------------------------------------------------------------------------
// T04: Known critical agents exist
// ---------------------------------------------------------------------------

test('AGT-04', 'Critical agents exist (cto-lead, product-manager, code-analyzer, qa-monitor)', () => {
  const required = ['cto-lead.md', 'product-manager.md', 'code-analyzer.md', 'qa-monitor.md'];
  const missing = required.filter(f => !agentFiles.includes(f));
  assert.strictEqual(missing.length, 0, `Missing critical agents: ${missing.join(', ')}`);
});

// ---------------------------------------------------------------------------
// T05: No duplicate agent names
// ---------------------------------------------------------------------------

test('AGT-05', 'No duplicate agent file names', () => {
  const names = agentFiles.map(f => f.replace('.md', ''));
  const dupes = names.filter((n, i) => names.indexOf(n) !== i);
  assert.strictEqual(dupes.length, 0, `Duplicate agents: ${dupes.join(', ')}`);
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
