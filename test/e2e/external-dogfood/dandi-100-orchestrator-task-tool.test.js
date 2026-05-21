#!/usr/bin/env node
/**
 * E2E — pruge dandi scenario #100 reproduction (F4-4 v2.1.19 S4)
 *
 * Original issue: sprint-orchestrator agent missing Task tool — sub-agent
 * dispatch fails. Closed in v2.1.18 (PR #106 F1).
 *
 * This test verifies the v2.1.18 fix is preserved (regression lock).
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name} — ${e.message}`); }
}

console.log('E2E dandi-100 — sprint-orchestrator Task tool regression lock');

test('TC-F4-4-D100: agents/sprint-orchestrator.md declares Task allowlist (#100 fix preserved)', () => {
  const content = fs.readFileSync(path.join(PROJECT_ROOT, 'agents/sprint-orchestrator.md'), 'utf8');
  // Frontmatter region
  const m = content.match(/^---\n([\s\S]+?)\n---/);
  assert.ok(m, 'frontmatter missing');
  const fm = m[1];
  // Tools list contains Task() entries
  assert.match(fm, /Task\(gap-detector\)/, 'Task(gap-detector) not declared');
  assert.match(fm, /Task\(code-analyzer\)/, 'Task(code-analyzer) not declared');
  assert.match(fm, /Task\(sprint-qa-flow\)/, 'Task(sprint-qa-flow) not declared');
  assert.match(fm, /Task\(sprint-report-writer\)/, 'Task(sprint-report-writer) not declared');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
