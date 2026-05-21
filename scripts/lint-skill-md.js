#!/usr/bin/env node
'use strict';

/**
 * scripts/lint-skill-md.js — v2.1.19 S2 F2-5 SKILL.md authoring linter
 *
 * Invoked by PreToolUse hook (hooks/hooks.json `if: Write(skills/*\/SKILL.md)`)
 * when a SKILL.md file is being written. Performs invariant check using the
 * F2-2 checker logic (scripts/check-skills-docs-code-sync.js). On failure,
 * emits stderr warning (does NOT block write — F2-5 design ADR S2-004).
 *
 * Usage (as hook): node scripts/lint-skill-md.js (reads PreToolUse JSON from stdin)
 * Usage (manual):  node scripts/lint-skill-md.js --skill <name>
 *
 * Exit: 0 always (warning-only, never blocks write).
 */

const path = require('path');
const fs = require('fs');

const ROOT = process.cwd();
const checker = require(path.join(ROOT, 'scripts/check-skills-docs-code-sync.js'));

function readStdinJSON() {
  try {
    const data = fs.readFileSync(0, 'utf8'); // stdin
    return data ? JSON.parse(data) : null;
  } catch (_) { return null; }
}

function extractSkillNameFromPath(filePath) {
  if (!filePath) return null;
  const m = filePath.match(/skills\/([\w-]+)\/SKILL\.md$/);
  return m ? m[1] : null;
}

function lintBySkillName(skillName) {
  if (!skillName) return { ok: true, warnings: ['no skill name resolved'] };
  const result = checker.evaluateSkillInvariant(skillName);
  return {
    ok: result.invariantPass,
    skill: skillName,
    warnings: result.failures || [],
  };
}

function main() {
  // Manual mode: --skill <name>
  const args = process.argv.slice(2);
  const skillIdx = args.indexOf('--skill');
  if (skillIdx >= 0 && args[skillIdx + 1]) {
    const result = lintBySkillName(args[skillIdx + 1]);
    console.log(JSON.stringify(result, null, 2));
    process.exit(0); // warning-only mode
  }

  // Hook mode: read PreToolUse JSON from stdin
  const payload = readStdinJSON();
  if (!payload) {
    // No stdin input — silent no-op (graceful for direct invocation without args)
    process.exit(0);
  }
  // Extract file_path from tool_input
  const filePath = (payload.tool_input && payload.tool_input.file_path) || null;
  const skillName = extractSkillNameFromPath(filePath);
  if (!skillName) {
    // Not a SKILL.md write — silent pass
    process.exit(0);
  }
  const result = lintBySkillName(skillName);
  if (!result.ok) {
    process.stderr.write(`[bkit:lint-skill-md] ${skillName} SKILL.md invariant warning:\n`);
    for (const w of result.warnings) {
      process.stderr.write(`  - ${w}\n`);
    }
    process.stderr.write(`(warning only — write proceeds; see scripts/check-skills-docs-code-sync.js for full CI)\n`);
  }
  process.exit(0); // never block
}

if (require.main === module) main();

module.exports = { extractSkillNameFromPath, lintBySkillName };
