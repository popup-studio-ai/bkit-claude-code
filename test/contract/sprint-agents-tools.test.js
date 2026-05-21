#!/usr/bin/env node
/**
 * F1 Contract Test — sprint-* agents Task tool allowlist invariant (v2.1.18 #100).
 *
 * Validates that all 4 sprint-* orchestration agents declare the `tools:`
 * frontmatter field with the required Task allowlist. Prevents regression
 * to the v2.1.16 state where missing `tools:` field caused
 * `no_agent_runner` failures in measure-router.
 *
 * Plan SC: F1 — agents/sprint-orchestrator.md + sprint-master-planner.md +
 *                 sprint-qa-flow.md + sprint-report-writer.md
 * Design Ref: docs/02-design/features/v2118-sprint-trust-ux-fix.design.md §2.3
 *
 * @module test/contract/sprint-agents-tools.test
 */

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const AGENTS_DIR = path.join(PROJECT_ROOT, 'agents');

// Sprint-* agents invariant: 4 agents each must declare `tools:` field.
const SPRINT_AGENTS = [
  {
    name: 'sprint-orchestrator',
    requiredTasks: ['gap-detector', 'code-analyzer', 'sprint-qa-flow', 'sprint-report-writer'],
    minToolCount: 10,
  },
  {
    name: 'sprint-master-planner',
    requiredTasks: ['pm-lead', 'cto-lead', 'qa-lead'],  // ✦ 2026-05-21 user request expansion
    minToolCount: 10,
  },
  {
    name: 'sprint-qa-flow',
    requiredTasks: ['qa-monitor', 'gap-detector'],
    minToolCount: 6,
  },
  {
    name: 'sprint-report-writer',
    requiredTasks: [],  // Task allowlist 불필요 — report aggregation only
    minToolCount: 4,
  },
];

/**
 * Minimal YAML frontmatter parser (line-based, supports `tools: -` list).
 * Avoids js-yaml dep; bkit existing pattern (lib/util/frontmatter.js if available).
 * @param {string} content
 * @returns {{ frontmatter: Object, body: string }}
 */
function parseFrontmatter(content) {
  if (!content.startsWith('---')) return { frontmatter: {}, body: content };
  const end = content.indexOf('\n---', 4);
  if (end === -1) return { frontmatter: {}, body: content };
  const head = content.slice(4, end);
  const body = content.slice(end + 4);
  const frontmatter = {};
  const lines = head.split('\n');
  let currentKey = null;
  let currentList = null;
  for (const raw of lines) {
    const line = raw.replace(/\r$/, '');
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const listMatch = line.match(/^\s+-\s+(.+?)\s*(?:#.*)?$/);
    if (listMatch && currentList) {
      currentList.push(listMatch[1]);
      continue;
    }
    const keyMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)\s*:\s*(.*)$/);
    if (keyMatch) {
      currentKey = keyMatch[1];
      const v = keyMatch[2];
      if (v === '' || v === undefined) {
        // start of list or block
        currentList = [];
        frontmatter[currentKey] = currentList;
      } else {
        frontmatter[currentKey] = v;
        currentList = null;
      }
    }
  }
  return { frontmatter, body };
}

let pass = 0;
let fail = 0;
const fails = [];

function test(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    fail++;
    fails.push({ name, err });
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
  }
}

console.log('F1 Contract — sprint-* agents Task tool allowlist (v2.1.18 #100)\n');

for (const spec of SPRINT_AGENTS) {
  console.log(`agents/${spec.name}.md:`);

  const filePath = path.join(AGENTS_DIR, `${spec.name}.md`);

  test(`file exists`, () => {
    assert.ok(fs.existsSync(filePath), `${filePath} not found`);
  });

  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = parseFrontmatter(content);

  test(`frontmatter has tools field`, () => {
    assert.ok(
      parsed.frontmatter.tools,
      `tools field missing in ${spec.name}.md frontmatter — F1 fix regression risk (#100)`,
    );
    assert.ok(
      Array.isArray(parsed.frontmatter.tools),
      `tools field must be an array in ${spec.name}.md`,
    );
    assert.ok(
      parsed.frontmatter.tools.length >= spec.minToolCount,
      `tools field too short (${parsed.frontmatter.tools.length} < ${spec.minToolCount}) in ${spec.name}.md`,
    );
  });

  for (const requiredTask of spec.requiredTasks) {
    test(`tools includes Task(${requiredTask})`, () => {
      const tools = parsed.frontmatter.tools || [];
      const has = tools.some((t) => t === `Task(${requiredTask})` || t.startsWith(`Task(${requiredTask})`));
      assert.ok(
        has,
        `Task(${requiredTask}) missing in ${spec.name}.md tools — required for measure-router dispatch`,
      );
    });
  }

  console.log('');
}

console.log(`\nResults: ${pass} pass / ${fail} fail`);
if (fail > 0) {
  console.log('\nFailures:');
  for (const f of fails) {
    console.log(`  ${f.name}: ${f.err.message}`);
  }
  process.exit(1);
}
process.exit(0);
