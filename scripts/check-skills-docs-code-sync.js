#!/usr/bin/env node
'use strict';

/**
 * scripts/check-skills-docs-code-sync.js — v2.1.19 S2 F2-2 CI invariant
 *
 * Checks 44 skills × SKILL.md Docs=Code invariants. Evolution of the S0
 * `evaluateSkillInvariant` logic with critical bug-fix:
 *
 *   ★ Code-block-aware parsing — references inside ``` ... ``` fenced code
 *     blocks (JavaScript samples, YAML config, etc.) are IGNORED. S0's
 *     measurement script falsely flagged phase-3-mockup and phase-9-deployment
 *     because their SKILL.md examples contained `scripts/app.js` / `scripts/check-env.js`
 *     as code comments — those are sample code, not declared handlers.
 *
 * Invariants per skill:
 *   #1 SKILL.md exists
 *   #2 frontmatter `name` matches dir name
 *   #3 declared `scripts/<x>.js` paths resolve at <bkit-root>/scripts/ (the
 *      canonical convention per ADR S2-001 + Issue #107 resolution).
 *      Skill-local `skills/<name>/scripts/<x>.js` is also accepted (legacy/edge).
 *
 * Master plan: §4.2 + §3.1 Docs=Code philosophy enforcement.
 * Closes: pruge #107.
 *
 * Usage: node scripts/check-skills-docs-code-sync.js [--json] [--strict]
 * Exit: 0 PASS, 1 FAIL
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SKILLS_DIR = path.join(ROOT, 'skills');

function parseArgs(argv) {
  const out = { json: false, strict: false };
  for (const a of argv) {
    if (a === '--json') out.json = true;
    else if (a === '--strict') out.strict = true;
  }
  return out;
}

// v2.1.19 S3 CO-S2-1: extracted markdown utilities to lib/util/markdown-parse.js
// for reuse (context-importer also consumes). Re-export here as a thin alias
// to preserve backward compat for code that imports from this module.
const MD_PARSE = require(path.join(ROOT, 'lib/util/markdown-parse.js'));
const stripCodeBlocks = MD_PARSE.stripCodeBlocks;
const extractFrontmatter = MD_PARSE.extractFrontmatter;

/**
 * Find all `scripts/<x>.js` references in non-code-block text.
 * Returns array of unique reference strings (e.g., 'scripts/sprint-handler.js').
 */
function findHandlerReferences(textNoCodeBlocks) {
  const refs = new Set();
  const re = /scripts\/([\w-]+)\.js/g;
  let m;
  while ((m = re.exec(textNoCodeBlocks)) !== null) {
    refs.add(`scripts/${m[1]}.js`);
  }
  return Array.from(refs);
}

/**
 * Evaluate invariants for a single skill.
 */
function evaluateSkillInvariant(name) {
  const skillMdPath = path.join(SKILLS_DIR, name, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) {
    return { name, invariantPass: false, failures: ['SKILL.md missing'] };
  }
  const content = fs.readFileSync(skillMdPath, 'utf8');
  const fm = extractFrontmatter(content);
  const failures = [];

  // Check #1: frontmatter `name` matches dir
  if (!fm) {
    failures.push('frontmatter missing');
  } else {
    const nameMatch = fm.match(/^name:\s*(\S+)/m);
    if (!nameMatch) failures.push('frontmatter `name:` field missing');
    else if (nameMatch[1] !== name) failures.push(`frontmatter name="${nameMatch[1]}" != dir="${name}"`);
  }

  // Check #2: declared `scripts/<x>.js` references resolve.
  // Critical evolution from S0: strip code blocks first to avoid false
  // positives on JavaScript samples + YAML deployment snippets.
  const textNoCodeBlocks = stripCodeBlocks(content);
  const refs = findHandlerReferences(textNoCodeBlocks);
  for (const ref of refs) {
    const atRoot = path.join(ROOT, ref);
    const atSkillLocal = path.join(SKILLS_DIR, name, ref);
    if (!fs.existsSync(atRoot) && !fs.existsSync(atSkillLocal)) {
      failures.push(`declared "${ref}" — file not found at <bkit-root>/${ref} or skills/${name}/${ref}`);
    }
  }

  return {
    name,
    skillMdPath,
    invariantPass: failures.length === 0,
    failures,
    referencesChecked: refs,
  };
}

/**
 * Check all skills under skills/.
 */
function checkAll() {
  if (!fs.existsSync(SKILLS_DIR)) {
    return { total: 0, passed: 0, ok: true, results: [], note: 'skills/ dir absent' };
  }
  const dirs = fs.readdirSync(SKILLS_DIR)
    .filter(d => {
      try { return fs.statSync(path.join(SKILLS_DIR, d)).isDirectory(); }
      catch (_) { return false; }
    });
  const results = dirs.map(evaluateSkillInvariant);
  const passed = results.filter(r => r.invariantPass).length;
  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    ok: passed === results.length,
    results,
    failures: results.filter(r => !r.invariantPass),
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const summary = checkAll();
  const exitCode = summary.ok ? 0 : 1;

  if (args.json) {
    console.log(JSON.stringify({
      ok: summary.ok,
      total: summary.total,
      passed: summary.passed,
      failed: summary.failed,
      failures: summary.failures,
      exitCode,
    }, null, 2));
  } else {
    console.log(`bkit Docs=Code Sync Check — 44 skills × SKILL.md invariants`);
    console.log(`Total: ${summary.total}, Passed: ${summary.passed}, Failed: ${summary.failed}`);
    if (summary.failures.length > 0) {
      console.log('\nFailures:');
      for (const f of summary.failures) {
        console.log(`  ✗ ${f.name}`);
        for (const fail of f.failures) console.log(`      - ${fail}`);
      }
    }
    console.log(`\n${summary.ok ? 'PASS' : 'FAIL'} (exit ${exitCode})`);
  }
  process.exit(exitCode);
}

if (require.main === module) main();

module.exports = {
  stripCodeBlocks,
  extractFrontmatter,
  findHandlerReferences,
  evaluateSkillInvariant,
  checkAll,
};
