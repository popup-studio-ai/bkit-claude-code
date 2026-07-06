#!/usr/bin/env node
'use strict';
/**
 * issue-137-predecessor-task-completion.test.js — Regression guard for GitHub #137.
 *
 * The `pdca` skill chains phase Tasks via `blockedBy` ([Plan]→[Design]→[Do]→…),
 * but SKILL.md historically documented Task *creation* only — never Task
 * *completion* of the predecessor phase. A predecessor left `in_progress` leaked a
 * stale phase (e.g. "design" during "do") into Claude Code's ambient prompt
 * context, disagreeing with `.bkit/state/pdca-status.json`'s `phase` field.
 *
 * Option 2 from the issue (a hook auto-completing the predecessor) is infeasible:
 * per the CC hooks guide, hooks communicate via stdout/exit-code/additionalContext
 * only and cannot call TaskUpdate — only the model can. The v2.1.29 fix is
 * therefore Option 1: each phase action instructs the model to complete the
 * predecessor Task before creating the next one, and `## Task Integration`
 * codifies the Phase Transition Rule.
 *
 * This test fails if any of those completion instructions is removed.
 */

const fs = require('node:fs');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..', '..');
const SKILL = path.join(REPO, 'skills', 'pdca', 'SKILL.md');
const src = fs.readFileSync(SKILL, 'utf8');

let pass = 0, fail = 0;
const failures = [];
function tc(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; failures.push(`${name}${detail ? ' :: ' + detail : ''}`); }
}

// Extract a `### <action>` section body (up to the next `### ` or `## ` header).
function actionSection(actionHeaderPrefix) {
  const re = new RegExp(
    '\\n### ' + actionHeaderPrefix + '[^\\n]*\\n([\\s\\S]*?)(?=\\n### |\\n## )', 'm');
  const m = src.match(re);
  return m ? m[1] : '';
}

// A section "completes a predecessor" if it tells the model to TaskUpdate a
// phase Task to completed status.
function hasCompletionInstruction(body) {
  return /TaskUpdate/.test(body) && /status:\s*"completed"|`completed`|to\s+`?completed`?/i.test(body);
}

// --- 1. Task Integration documents the Phase Transition Rule -------------------
{
  const hasRuleHeader = /Phase Transition Rule/.test(src);
  tc('Task Integration section documents a "Phase Transition Rule"', hasRuleHeader);

  // The rule must mention completing predecessors AND the reason (prompt-context /
  // pdca-status.json two-sources-of-truth).
  const ruleBlock = (src.match(/### Phase Transition Rule[\s\S]*?(?=\n## )/) || [''])[0];
  tc('Phase Transition Rule tells the model to mark predecessors completed',
    /completed/.test(ruleBlock) && /in_progress/.test(ruleBlock) && /blockedBy/.test(ruleBlock),
    'rule block missing completed/in_progress/blockedBy wording');
  tc('Phase Transition Rule explains the pdca-status.json / prompt-context rationale',
    /pdca-status\.json/.test(ruleBlock) && /prompt context/i.test(ruleBlock),
    'rule block missing the two-sources-of-truth rationale');
}

// --- 2. Each advancing phase action embeds a completion instruction ------------
{
  // action header prefix -> the predecessor phase label it must mention
  const cases = [
    ['design',  'Plan'],
    ['do',      'Design'],
    ['analyze', 'Do'],
    ['iterate', 'Check'],
    ['qa',      'Check'],
    ['report',  'QA'],
    ['archive', 'Report'],
  ];
  for (const [action, predLabel] of cases) {
    const body = actionSection(action);
    tc(`${action} action section is present`, body.length > 0);
    tc(`${action} action instructs completing a predecessor Task (TaskUpdate→completed)`,
      hasCompletionInstruction(body), 'no TaskUpdate/completed instruction found');
    tc(`${action} action names its predecessor phase Task [${predLabel}]`,
      new RegExp('\\[' + predLabel + '(-N|-\\*)?\\]').test(body),
      `expected a [${predLabel}] reference in the ${action} section`);
  }
}

// --- 3. Guard against silent regression of the creation-only pattern ----------
{
  // Every "Create Task: `[X]`" step that advances the chain must be preceded in
  // its own action by a completion instruction. We already assert per-action
  // above; here we assert the fix wording marker exists at least 7 times
  // (design, do, analyze, iterate, qa, report + archive terminal).
  const markers = (src.match(/Complete (predecessor|the terminal) Task/g) || []).length;
  tc('at least 7 explicit "Complete predecessor/terminal Task" steps exist',
    markers >= 7, `found ${markers}`);
}

console.log(`\nissue-137-predecessor-task-completion.test.js: ${pass} passed, ${fail} failed`);
if (failures.length) {
  console.error('FAILURES:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
