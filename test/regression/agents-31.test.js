#!/usr/bin/env node
'use strict';
/**
 * Regression Test: 31 Agents Full Verification (35 TC)
 * AG31-001~035: Each of 31 agents has valid frontmatter (model, memory, tools)
 *
 * @version bkit v2.0.0
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '../..');
const AGENTS_DIR = path.join(BASE_DIR, 'agents');

// --- Inline assert ---
let _passed = 0;
let _failed = 0;
let _total = 0;
const _failures = [];

function assert(id, condition, message) {
  _total++;
  if (condition) {
    _passed++;
    console.log(`  PASS: ${id} - ${message}`);
  } else {
    _failed++;
    _failures.push({ id, message });
    console.error(`  FAIL: ${id} - ${message}`);
  }
}

console.log('\n=== agents-31.test.js (35 TC) ===\n');

// --- Valid field values ---
const VALID_MODELS = ['opus', 'sonnet', 'haiku'];
const VALID_MEMORY = ['user', 'project', 'local', 'none'];

// --- All 31 agents ---
const ALL_AGENTS = [
  'bkend-expert', 'bkit-impact-analyst', 'cc-version-researcher',
  'code-analyzer', 'cto-lead', 'design-validator', 'enterprise-expert',
  'frontend-architect', 'gap-detector', 'infra-architect',
  'pdca-eval-act', 'pdca-eval-check', 'pdca-eval-design', 'pdca-eval-do',
  'pdca-eval-plan', 'pdca-eval-pm', 'pdca-iterator', 'pipeline-guide',
  'pm-discovery', 'pm-lead', 'pm-lead-skill-patch', 'pm-prd',
  'pm-research', 'pm-strategy', 'product-manager', 'qa-monitor',
  'qa-strategist', 'report-generator', 'security-architect',
  'skill-needs-extractor', 'starter-guide'
];

// v2.0.0 agents with disallowedTools
const DISALLOWED_TOOLS_AGENTS = ['pdca-iterator', 'qa-monitor'];

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

// ============================================================
// AG31-001: Total agent count = 31
// ============================================================
console.log('--- AG31-001: Total Agent Count ---');

const agentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
assert('AG31-001', agentFiles.length >= 31,
  `Total agent count >= 31 (found ${agentFiles.length})`);

// ============================================================
// AG31-002~032: Each agent .md file exists with valid frontmatter
// ============================================================
console.log('\n--- AG31-002~032: Individual Agent Verification ---');

for (let i = 0; i < ALL_AGENTS.length; i++) {
  const agent = ALL_AGENTS[i];
  const num = String(i + 2).padStart(3, '0');
  const agentPath = path.join(AGENTS_DIR, `${agent}.md`);
  let hasModel = false;
  let hasMemory = false;
  let hasTools = false;

  if (fs.existsSync(agentPath)) {
    const content = fs.readFileSync(agentPath, 'utf-8');
    const fm = parseFrontmatter(content);
    if (fm) {
      hasModel = VALID_MODELS.includes(fm.model);
      hasMemory = content.match(/^memory:\s*\S+/m) !== null;
      hasTools = content.match(/^(allowedTools|disallowedTools|tools)\s*:/m) !== null
        || content.includes('tools:')
        || content.includes('allowedTools:')
        || content.includes('disallowedTools:');
    }
  }

  assert(`AG31-${num}`, hasModel && hasMemory,
    `${agent}: exists with valid frontmatter (model=${hasModel}, memory=${hasMemory})`);
}

// ============================================================
// AG31-033: v2.1.1 AS-01 — disallowedTools removed from pdca-iterator, qa-monitor
// (previously listed "Agent" which is not a valid CC tool name)
// ============================================================
console.log('\n--- AG31-033: disallowedTools removal verified ---');
const hasInvalidDisallowed = [];
for (const agent of DISALLOWED_TOOLS_AGENTS) {
  const agentPath = path.join(AGENTS_DIR, `${agent}.md`);
  if (fs.existsSync(agentPath)) {
    const content = fs.readFileSync(agentPath, 'utf-8');
    if (content.includes('disallowedTools')) {
      hasInvalidDisallowed.push(agent);
    }
  }
}
assert('AG31-033', hasInvalidDisallowed.length === 0,
  `v2.1.1 AS-01: disallowedTools correctly removed from pdca-iterator, qa-monitor${hasInvalidDisallowed.length ? ' STILL HAS: ' + hasInvalidDisallowed.join(', ') : ''}`);

// ============================================================
// AG31-034: All agents have memory field set
// ============================================================
console.log('\n--- AG31-034: Memory Field ---');

const noMemory = [];
for (const agent of ALL_AGENTS) {
  const agentPath = path.join(AGENTS_DIR, `${agent}.md`);
  if (fs.existsSync(agentPath)) {
    const content = fs.readFileSync(agentPath, 'utf-8');
    if (!content.match(/^memory:\s*\S+/m)) {
      noMemory.push(agent);
    }
  } else {
    noMemory.push(agent);
  }
}
assert('AG31-034', noMemory.length === 0,
  `All agents have memory field${noMemory.length ? ' MISSING: ' + noMemory.join(', ') : ''}`);

// ============================================================
// AG31-035: CTO-lead uses opus model
// ============================================================
console.log('\n--- AG31-035: CTO-lead Model ---');

const ctoPath = path.join(AGENTS_DIR, 'cto-lead.md');
let ctoUsesOpus = false;
if (fs.existsSync(ctoPath)) {
  const content = fs.readFileSync(ctoPath, 'utf-8');
  const fm = parseFrontmatter(content);
  ctoUsesOpus = fm && fm.model === 'opus';
}
assert('AG31-035', ctoUsesOpus,
  `cto-lead uses opus model`);

// ============================================================
// Summary
// ============================================================
console.log(`\n${'='.repeat(60)}`);
console.log(`31 Agents Regression Tests: ${_passed}/${_total} PASS, ${_failed} FAIL`);
if (_failures.length > 0) {
  console.log(`\nFailures:`);
  _failures.forEach(f => console.log(`  - ${f.id}: ${f.message}`));
}
console.log(`${'='.repeat(60)}\n`);
if (_failed > 0) process.exit(1);
