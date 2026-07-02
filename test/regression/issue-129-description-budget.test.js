#!/usr/bin/env node
'use strict';
/**
 * issue-129-description-budget.test.js — Regression guard for GitHub #129.
 *
 * Placed under test/regression/ alongside issue-53/issue-118/issue-119/issue-130
 * so the issue-specific regression cannot recur silently.
 *
 * Issue: agent frontmatter descriptions are loaded into EVERY session's context
 * (token diet). Pre-diet the 40 agents/*.md descriptions summed to ~30,065
 * bytes, dominated by 8-language trigger phrase lists and "Do NOT use for"
 * blocks. The #129 compaction template caps each description at 700 bytes
 * UTF-8 (role sentences + optional "Use proactively" line + a single
 * `Triggers:` block: full EN + full KO lists, then exactly one anchor keyword
 * per other language in order JA, ZH, ES, FR, DE, IT). Removed guidance is
 * relocated to the agent body ("When NOT to use this agent" /
 * "Delegation notes"), which loads only when the agent is invoked.
 *
 * This test locks the diet in:
 *  1. PER-AGENT BUDGET: every agents/*.md description is ≤700 bytes UTF-8.
 *     Files whose frontmatter carries `deprecatedIn` (pdca-eval-* tombstones)
 *     are exempt — they may be removed entirely by issue #128.
 *  2. TRIGGERS LABEL: every non-deprecated agent description contains
 *     "Triggers:" (AG-*-TRIG contract). Internal-only agents with no trigger
 *     lists (skill-needs-extractor, pm-lead-skill-patch — see the
 *     INTERNAL_AGENTS convention in agents-21.test.js) are exempt.
 *  3. TOTAL BUDGET: the sum of ALL agent description bytes (deprecated stubs
 *     included) stays ≤20,000 — a headroom lock against re-bloat vs the
 *     measured pre-diet 30,065.
 *  4. SPRINT SKILL: skills/sprint/SKILL.md description (dieted 1,110B → ~500B
 *     in Part B) stays ≤700 bytes, keeps the word "Trigger" (SD-042) and its
 *     Korean keywords, and stays under the 1,536-char L1-SK cap.
 */
const fs = require('node:fs');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..', '..');
const AGENTS_DIR = path.join(REPO, 'agents');
const SPRINT_SKILL = path.join(REPO, 'skills', 'sprint', 'SKILL.md');

const PER_AGENT_BUDGET_BYTES = 700;
const TOTAL_BUDGET_BYTES = 20000;
const SKILL_DESC_BUDGET_BYTES = 700;
const L1_SK_CAP_CHARS = 1536;

// Internal-only agents: no user-facing trigger lists by design
// (mirrors INTERNAL_AGENTS in test/regression/agents-21.test.js).
const INTERNAL_AGENTS = ['skill-needs-extractor', 'pm-lead-skill-patch'];

let pass = 0, fail = 0;
const failures = [];
function tc(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; failures.push(`${name}${detail ? ' :: ' + detail : ''}`); }
}

/** Extract raw frontmatter text (between the leading --- fences). */
function frontmatterOf(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---(\n|$)/);
  return m ? m[1] : null;
}

/**
 * Extract the description value from frontmatter text.
 * Supports block scalars (`description: |` / `|-`) and inline values.
 * Block scalar lines are dedented by their 2-space indent and joined with
 * newlines; the result is trimmed. Byte counts use UTF-8.
 */
function descriptionOf(fm) {
  const lines = fm.split('\n');
  const idx = lines.findIndex(l => /^description:/.test(l));
  if (idx === -1) return null;
  const head = lines[idx];
  const blockMatch = head.match(/^description:\s*\|[-+]?\s*$/);
  if (!blockMatch) {
    // inline: description: some text
    return head.replace(/^description:\s*/, '').trim();
  }
  const body = [];
  for (let i = idx + 1; i < lines.length; i++) {
    const l = lines[i];
    if (l === '' || /^\s/.test(l)) { body.push(l.replace(/^  /, '')); continue; }
    break; // next top-level key
  }
  return body.join('\n').trim();
}

// --- Collect agents ------------------------------------------------------------

const agentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md')).sort();
tc('agents directory contains agent definitions', agentFiles.length >= 30,
  `found ${agentFiles.length}`);

let totalBytes = 0;
const overBudget = [];
const missingTriggers = [];

for (const file of agentFiles) {
  const agent = file.replace(/\.md$/, '');
  const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8');
  const fm = frontmatterOf(content);
  tc(`${agent}: frontmatter parseable`, fm !== null);
  if (fm === null) continue;

  const desc = descriptionOf(fm);
  tc(`${agent}: description present and non-empty`, !!desc && desc.length > 0);
  if (!desc) continue;

  const bytes = Buffer.byteLength(desc, 'utf8');
  totalBytes += bytes;

  const deprecated = /^deprecatedIn:/m.test(fm);

  // 1. PER-AGENT BUDGET (deprecated stubs exempt — may be removed by #128)
  if (!deprecated) {
    const ok = bytes <= PER_AGENT_BUDGET_BYTES;
    if (!ok) overBudget.push(`${agent}(${bytes}B)`);
    tc(`${agent}: description ≤${PER_AGENT_BUDGET_BYTES} bytes UTF-8`, ok,
      `${bytes} bytes`);
  }

  // 2. TRIGGERS LABEL (deprecated + internal-only agents exempt)
  if (!deprecated && !INTERNAL_AGENTS.includes(agent)) {
    const ok = desc.includes('Triggers:');
    if (!ok) missingTriggers.push(agent);
    tc(`${agent}: description contains "Triggers:"`, ok);
  }
}

// 3. TOTAL BUDGET (headroom lock vs measured pre-diet 30,065 bytes)
tc(`total agent description bytes ≤${TOTAL_BUDGET_BYTES}`,
  totalBytes <= TOTAL_BUDGET_BYTES,
  `total=${totalBytes} bytes; over-budget: [${overBudget.join(', ')}]`);

// --- 4. SPRINT SKILL description diet ------------------------------------------

{
  const content = fs.readFileSync(SPRINT_SKILL, 'utf8');
  const fm = frontmatterOf(content);
  const desc = fm ? descriptionOf(fm) : null;
  tc('sprint skill: description present', !!desc);
  if (desc) {
    const bytes = Buffer.byteLength(desc, 'utf8');
    tc(`sprint skill: description ≤${SKILL_DESC_BUDGET_BYTES} bytes UTF-8`,
      bytes <= SKILL_DESC_BUDGET_BYTES, `${bytes} bytes`);
    tc(`sprint skill: description ≤${L1_SK_CAP_CHARS} chars (L1-SK cap)`,
      desc.length <= L1_SK_CAP_CHARS, `${desc.length} chars`);
    tc('sprint skill: description keeps the word "Trigger" (SD-042)',
      /Trigger/.test(desc));
    tc('sprint skill: description keeps Korean trigger keywords',
      /[가-힣]/.test(desc));
  }
}

// ---------------------------------------------------------------------------
console.log(`\n${pass} passed, ${fail} failed`);
if (failures.length) {
  console.error('FAILURES:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
