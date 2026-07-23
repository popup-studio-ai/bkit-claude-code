#!/usr/bin/env node
/*
 * L1 — context: fork Frontmatter Test (Sprint 6 NEW 6-1, ENH-202)
 *
 * Verifies that ≥8 skills carry the `context: fork` frontmatter field
 * and that the YAML frontmatter remains syntactically valid.
 *
 * Design Ref: bkit-v2110-gap-closure.design.md §3.4.1
 * Plan SC: D9 (≥8 skills with context: fork)
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const SKILLS_DIR = path.join(PROJECT_ROOT, 'skills');

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.error(`  ✗ ${msg}`); }
}

console.log('=== context: fork L1 Test (v2.1.10 Sprint 6 NEW 6-1, ENH-202) ===');

function parseFrontmatter(skillMdPath) {
  const content = fs.readFileSync(skillMdPath, 'utf8');
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) return null;
  const rest = content.slice(content.indexOf('\n') + 1);
  const end = rest.indexOf('\n---');
  if (end === -1) return null;
  return rest.slice(0, end);
}

const skillDirs = fs.readdirSync(SKILLS_DIR).filter((d) => {
  try {
    return fs.statSync(path.join(SKILLS_DIR, d)).isDirectory()
      && fs.existsSync(path.join(SKILLS_DIR, d, 'SKILL.md'));
  } catch { return false; }
});

let forkSkills = [];
for (const skill of skillDirs) {
  const mdPath = path.join(SKILLS_DIR, skill, 'SKILL.md');
  const fm = parseFrontmatter(mdPath);
  assert(fm !== null, `${skill}: frontmatter parses`);
  if (fm && /^context:\s*fork\b/m.test(fm)) {
    forkSkills.push(skill);
    // Each forked skill should still have a name field
    assert(/^name:\s*\S+/m.test(fm), `${skill}: has name field alongside context: fork`);
  }
}

console.log(`\n  context: fork skills (${forkSkills.length}): ${forkSkills.join(', ')}`);

// v2.1.31 (CC v2.1.218 compat): qa-phase removed from the fork set (8 producers).
// context:fork strips AskUserQuestion at the sub-agent boundary (CC #34592/#54892),
// so qa-phase now runs in the main context. Each producer also declares
// `background: false` to opt out of CC v2.1.218's fork background-by-default.
assert(forkSkills.length >= 8, `≥ 8 skills use context: fork (actual ${forkSkills.length})`);
assert(forkSkills.includes('zero-script-qa'), 'zero-script-qa retained context: fork');
assert(!forkSkills.includes('qa-phase'), 'qa-phase is no longer context: fork (main-context interactive gate)');
assert(forkSkills.includes('skill-status'), 'skill-status retained context: fork');
for (const s of forkSkills) {
  const fm = parseFrontmatter(path.join(SKILLS_DIR, s, 'SKILL.md'));
  assert(/^background:\s*false\b/m.test(fm), `${s}: declares background: false (CC v2.1.218 opt-out)`);
}

const total = pass + fail;
console.log(`\nTests: ${pass}/${total} PASSED, ${fail} FAILED, 0 SKIPPED`);
process.exit(fail > 0 ? 1 : 0);
