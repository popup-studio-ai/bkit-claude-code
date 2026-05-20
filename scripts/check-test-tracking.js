#!/usr/bin/env node
/**
 * check-test-tracking.js — v2.1.17 (CO-7).
 *
 * Detects production test files (*.test.js, *.test.sh) that are not git-tracked.
 *
 * Pre-v2.1.17 the `.gitignore` had `test/` + `tests/*` blanket ignore patterns
 * with `!`-negate exceptions. Git's directory-traversal halt caused deep negate
 * patterns to fail silently, leaving several CI-referenced test files untracked
 * across v2.1.14~v2.1.16 releases (Cannot find module errors masked by other
 * gating issues).
 *
 * v2.1.17 narrowed `.gitignore` so production directories are tracked by
 * default. This script defends against future regression: any new *.test.js
 * inside tracked production paths must be `git add`-able and present in the
 * git index. If not, exit non-zero with the offending list — CI gate fails,
 * preventing release of "ghost" test files.
 *
 * Usage:
 *   node scripts/check-test-tracking.js          # human-readable
 *   node scripts/check-test-tracking.js --json   # JSON output
 *
 * Exit codes:
 *   0 — all test files in production paths are tracked
 *   1 — one or more untracked files detected (CI FAIL)
 *   2 — runner internal error (e.g., git not available)
 *
 * Design Ref: docs/06-guide/test-file-tracking-policy.guide.md
 *
 * @module scripts/check-test-tracking
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');

// Production test directories — files inside MUST be tracked.
const PRODUCTION_TEST_PATHS = [
  'test/architecture',
  'test/behavioral',
  'test/contract',
  'test/controllable-ai',
  'test/e2e',
  'test/i18n',
  'test/integration',
  'test/perf',
  'test/performance',
  'test/philosophy',
  'test/regression',
  'test/security',
  'test/unit',
  'test/ux',
  'test/v2110-qa',
  'tests/contract',
  'tests/qa',
  'tests/unit',
];

// File extensions that count as test files.
const TEST_EXTENSIONS = ['.test.js', '.test.sh', '.spec.js', '.test.ts'];

// Patterns to skip (e.g., fixture support files that may intentionally be ignored).
const SKIP_PATTERNS = [
  /\/fixtures\/.*\/test\/contract\/baseline\//, // fixture baselines (data-only)
];

function isTestFile(filename) {
  return TEST_EXTENSIONS.some((ext) => filename.endsWith(ext));
}

function shouldSkip(relPath) {
  return SKIP_PATTERNS.some((re) => re.test(relPath));
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && isTestFile(entry.name)) {
      const rel = path.relative(PROJECT_ROOT, full).replace(/\\/g, '/');
      if (!shouldSkip(rel)) out.push(rel);
    }
  }
  return out;
}

function getTrackedSet() {
  try {
    const out = execSync('git ls-files', {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      maxBuffer: 100 * 1024 * 1024,
    });
    return new Set(out.split(/\r?\n/).filter(Boolean));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`[check-test-tracking] git ls-files failed: ${e.message}`);
    process.exit(2);
  }
}

function main() {
  const wantJson = process.argv.includes('--json');
  const tracked = getTrackedSet();
  const filesystemTests = [];
  for (const p of PRODUCTION_TEST_PATHS) {
    walk(path.join(PROJECT_ROOT, p), filesystemTests);
  }
  filesystemTests.sort();

  const untracked = filesystemTests.filter((f) => !tracked.has(f));

  if (wantJson) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({
      productionPaths: PRODUCTION_TEST_PATHS,
      filesystemCount: filesystemTests.length,
      untrackedCount: untracked.length,
      untracked,
      passed: untracked.length === 0,
    }, null, 2));
  } else {
    // eslint-disable-next-line no-console
    console.log(`[check-test-tracking] Scanning ${PRODUCTION_TEST_PATHS.length} production test paths...`);
    // eslint-disable-next-line no-console
    console.log(`  Test files found: ${filesystemTests.length}`);
    // eslint-disable-next-line no-console
    console.log(`  Untracked        : ${untracked.length}`);
    if (untracked.length > 0) {
      // eslint-disable-next-line no-console
      console.error(`\n[check-test-tracking] ✗ FAILED — ${untracked.length} test file(s) not git-tracked:`);
      for (const f of untracked) {
        // eslint-disable-next-line no-console
        console.error(`  ✗ ${f}`);
      }
      // eslint-disable-next-line no-console
      console.error(`\nFix: stage these files (\`git add <file>\`) or move them to`);
      // eslint-disable-next-line no-console
      console.error(`     a local-only path (test/local/, tests/local/, etc.).`);
      // eslint-disable-next-line no-console
      console.error(`     See docs/06-guide/test-file-tracking-policy.guide.md.`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`\n[check-test-tracking] ✓ PASSED — all production test files are tracked`);
    }
  }

  process.exit(untracked.length === 0 ? 0 : 1);
}

if (require.main === module) main();

module.exports = { main, PRODUCTION_TEST_PATHS, TEST_EXTENSIONS };
