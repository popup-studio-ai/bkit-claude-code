#!/usr/bin/env node
/**
 * L2 Contract Tests — sprint-* agents frontmatter Task allowlist invariants (F1-1)
 *
 * Validates that the 4 sprint-* orchestration agents declare `tools:` with the
 * required Task allowlist. Prevents regression to the v2.1.16 state where
 * missing `tools:` caused `no_agent_runner` in measure-router. Extends the
 * v2.1.18 contract test (test/contract/sprint-agents-tools.test.js) with the
 * v2.1.19 nested-dispatch verification requirement (F1-1).
 *
 * @module test/contract/agents/sprint-orchestrator-task-dispatch.test
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const AGENTS_DIR = path.join(PROJECT_ROOT, 'agents');

const SPRINT_AGENTS = [
  {
    name: 'sprint-orchestrator',
    requiredTasks: ['gap-detector', 'code-analyzer', 'sprint-qa-flow', 'sprint-report-writer', 'qa-monitor', 'pdca-iterator', 'Explore'],
    requiredBase: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
    expectedModel: 'fable',
  },
  {
    name: 'sprint-master-planner',
    // F4 v2.1.18 (user-requested) — PM/CTO/QA 3 leads + 3 specialists + Explore
    requiredTasks: ['pm-lead', 'cto-lead', 'qa-lead', 'product-manager', 'frontend-architect', 'enterprise-expert', 'Explore'],
    requiredBase: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
    expectedModel: 'fable',
  },
  {
    name: 'sprint-qa-flow',
    requiredTasks: ['qa-monitor', 'gap-detector'],
    requiredBase: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
    expectedModel: 'fable',
  },
  {
    name: 'sprint-report-writer',
    // No Task — report aggregation only (v2.1.18 design decision)
    requiredTasks: [],
    requiredBase: ['Read', 'Write', 'Glob', 'Grep', 'Edit'],
    expectedModel: 'sonnet',
  },
];

let passed = 0, failed = 0;
const failures = [];

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; failures.push({ name, err: e.message }); console.log(`  ✗ ${name} — ${e.message}`); }
}

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]+?)\n---/);
  return m ? m[1] : null;
}

function extractToolsList(frontmatter) {
  // Find `tools:` line index then collect subsequent `  - X` items.
  // Skip yaml comment lines (`#` after whitespace). Terminate only on a
  // non-list non-comment line (another yaml field starts).
  const lines = frontmatter.split('\n');
  const startIdx = lines.findIndex(l => /^tools:\s*$/.test(l));
  if (startIdx === -1) return null;
  const out = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*#/.test(line)) continue; // skip comments (whole-line)
    if (/^\s*$/.test(line)) continue; // skip blank lines
    const m = line.match(/^\s+-\s+(.+?)(?:\s+#.*)?$/); // strip trailing comments
    if (!m) break;
    out.push(m[1].trim());
  }
  return out;
}

/** Collect all Task(...) targets from the tools list. */
function extractAllTaskTargets(tools) {
  const targets = [];
  for (const t of tools) {
    const m = t.match(/^Task\(([^)]+)\)/); // anchored start, substring OK after )
    if (m) targets.push(m[1].trim());
    if (t === 'Task') targets.push('*');
  }
  return targets;
}

function extractField(frontmatter, fieldName) {
  const re = new RegExp('^' + fieldName + ':\\s*(\\S+)', 'm');
  const m = frontmatter.match(re);
  return m ? m[1] : null;
}

console.log('L2 F1-1 sprint-* agents Task dispatch contract tests');

// ============================================================

function verifyAgent(agentSpec) {
  const content = fs.readFileSync(path.join(AGENTS_DIR, agentSpec.name + '.md'), 'utf8');
  const fm = parseFrontmatter(content);
  assert.ok(fm, `${agentSpec.name}: frontmatter missing`);
  const tools = extractToolsList(fm);
  assert.ok(tools, `${agentSpec.name}: \`tools:\` field missing`);
  // Base tools must each be present as exact entry
  for (const t of agentSpec.requiredBase) {
    assert.ok(tools.includes(t), `${agentSpec.name}: missing base tool: ${t}`);
  }
  // Task targets via extractAllTaskTargets
  const taskTargets = extractAllTaskTargets(tools);
  if (agentSpec.requiredTasks.length === 0) {
    assert.equal(taskTargets.length, 0,
      `${agentSpec.name}: should NOT declare any Task targets (report aggregation only). Got: ${taskTargets.join(',')}`);
  } else {
    for (const required of agentSpec.requiredTasks) {
      assert.ok(taskTargets.includes(required) || taskTargets.includes('*'),
        `${agentSpec.name}: Task missing required dispatch target: ${required}. Declared: ${taskTargets.join(',') || '(none)'}`);
    }
  }
}

test('TC-F1-1-C1: sprint-orchestrator tools allowlist (Task + 7 dispatch targets)', () => {
  verifyAgent(SPRINT_AGENTS[0]);
});

test('TC-F1-1-C2: sprint-master-planner tools allowlist (PM/CTO/QA 3 leads + 3 specialists)', () => {
  verifyAgent(SPRINT_AGENTS[1]);
});

test('TC-F1-1-C3: sprint-qa-flow tools allowlist (qa-monitor + gap-detector)', () => {
  verifyAgent(SPRINT_AGENTS[2]);
});

test('TC-F1-1-C4: sprint-report-writer tools (5 base, no Task — report aggregation only)', () => {
  verifyAgent(SPRINT_AGENTS[3]);
});

test('TC-F1-1-C5: all 4 sprint-* agents declare matrix model (fable x3, sonnet x1)', () => {
  for (const agent of SPRINT_AGENTS) {
    const content = fs.readFileSync(path.join(AGENTS_DIR, agent.name + '.md'), 'utf8');
    const fm = parseFrontmatter(content);
    const model = extractField(fm, 'model');
    assert.equal(model, agent.expectedModel, `${agent.name}: model mismatch`);
  }
});

console.log(`\n${passed} passed, ${failed} failed (total ${passed + failed})`);
if (failed > 0) {
  failures.forEach(f => console.error(`  - ${f.name}: ${f.err}`));
  process.exit(1);
}
process.exit(0);
