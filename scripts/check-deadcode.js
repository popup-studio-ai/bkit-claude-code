#!/usr/bin/env node
/*
 * check-deadcode.js — Dead code detector for bkit lib/ modules (Sprint 4.5).
 *
 * Scans lib recursively and identifies files that are NOT required from any
 * production path (lib, scripts, hooks, servers). Warns about modules that
 * appear only in test/contract or are entirely orphaned.
 *
 * Exceptions (intentionally not required at runtime):
 *   - lib/domain/ports/*.port.js  — Type-only JSDoc typedef modules
 *   - lib/cc-regression/index.js  — facade (aggregated re-exports)
 *   - lib/pdca/status.js          — facade
 *
 * Exit codes:
 *   0 — no unexplained dead code
 *   1 — dead modules found
 *   2 — runner error
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PROD_ROOTS = ['lib', 'scripts', 'hooks', 'servers'];

// EXEMPT = not a bug even if unreferenced by production code.
// Categories:
//   1. Type-only modules (JSDoc typedef carriers, no runtime behavior).
//   2. Facades (re-exports; callers bind to underlying impl, not the facade).
//   3. bkit Agent Teams subsystem (lib/team/*): loaded via CC Agent Teams
//      runtime via task-context lookup, not direct require. Documented as
//      "pre-v2.1.10 technical debt, refactor to explicit import planned".
//   4. bkit QA subsystem helpers (lib/qa/scanner-base, test-plan-builder,
//      test-runner): loaded via qa-monitor/qa-strategist agent context,
//      not direct require. Same debt category.
//   5. v2.1.11 Sprint β/γ/δ skill-driven dynamic loads. These modules are
//      invoked through SKILL.md instructions (LLM reads the markdown,
//      then runs `node -e require(...)` or spawns a script). Static
//      require-graph traversal cannot see the link. Each entry is paired
//      with the SKILL.md/file that drives invocation so reviewers can
//      verify the wire-up still exists.
//
// Sprint 4.5 goal: prevent NEW dead code in v2.1.10 neighbors
// (lib/cc-regression, lib/domain, lib/infra) while acknowledging legacy debt.
const EXEMPT_PATTERNS = [
  /^lib\/domain\/ports\//, // Type-only
  /^lib\/[^/]+\/index\.js$/, // Facade (any lib/<subdir>/index.js)
  /^lib\/pdca\/status\.js$/, // Facade
  /^lib\/team\//, // Agent Teams — dynamic runtime load (technical debt)
  /^lib\/qa\/(scanner-base|test-plan-builder|test-runner)\.js$/, // QA subsystem dynamic load
  // v2.1.11 Sprint β: discoverability + control surfaces (skill-driven)
  /^lib\/discovery\/explorer\.js$/, // skills/bkit-explore
  /^lib\/evals\/runner-wrapper\.js$/, // skills/bkit-evals
  /^lib\/dashboard\/watch\.js$/, // skills/pdca-watch (CC /loop)
  /^lib\/control\/fast-track\.js$/, // skills/pdca-fast-track
  /^lib\/i18n\/(detector|translator)\.js$/, // user-prompt-handler dynamic dispatch
  // v2.1.11 Sprint γ: Application Layer pilot (ADR 0005)
  /^lib\/application\/pdca-lifecycle\//, // pdca skill — invoked via skill body
  // v2.1.11 Sprint δ: Port + governance surfaces
  /^lib\/infra\/mcp-port-registry\.js$/, // servers/* MCP runtime dynamic load
  /^lib\/pdca\/token-report\.js$/, // skills/pdca token-report subcommand
  // v2.1.13 Sprint barrels (depth-3 facades) — re-exported by sibling modules.
  // The original depth-2 facade pattern (/^lib\/[^/]+\/index\.js$/) does not
  // cover sprint hierarchy. Sprint 1/2/3 added these explicitly.
  /^lib\/application\/sprint-lifecycle\/index\.js$/,
  /^lib\/domain\/sprint\/index\.js$/,
  /^lib\/infra\/sprint\/index\.js$/,
];

// v2.1.10 Sprint 6: legacy 3 modules removed (ops-metrics 150, hook-io 10,
// deploy-state-machine 261 LOC). Production-code references: 0 at removal time.
// If any legacy module is re-added, add it here to suppress CI failure while
// a proper refactor lands.
const LEGACY_DEBT_PATTERNS = [];

function isJsonFlag() {
  return process.argv.includes('--json');
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith('.js')) {
      out.push(path.relative(PROJECT_ROOT, full).replace(/\\/g, '/'));
    }
  }
  return out;
}

function scanProductionRequires() {
  const refs = new Set();
  for (const r of PROD_ROOTS) {
    const root = path.join(PROJECT_ROOT, r);
    if (!fs.existsSync(root)) continue;
    for (const rel of walk(root)) {
      let src;
      try {
        src = fs.readFileSync(path.join(PROJECT_ROOT, rel), 'utf8');
      } catch {
        continue;
      }
      const re = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      let m;
      while ((m = re.exec(src)) !== null) {
        if (m[1].startsWith('.') || m[1].startsWith('/')) refs.add(m[1]);
      }
    }
  }
  return refs;
}

function isReferenced(libFile, allRefs) {
  const withoutExt = libFile.replace(/\.js$/, '');
  const segments = withoutExt.split('/');
  const fileName = segments[segments.length - 1]; // e.g. 'status-core'
  for (const ref of allRefs) {
    const refTail = ref.replace(/^\.{1,2}\//, '').replace(/\.js$/, '');
    const refSegments = refTail.split('/');
    const refFileName = refSegments[refSegments.length - 1];

    // Tier 1: Exact filename match (most permissive, handles `require('./status-core')`).
    if (refFileName === fileName) return true;

    // Tier 2: 2-segment tail match for ambiguous filenames.
    const joinedRef2 = refSegments.slice(-2).join('/');
    const joinedFile2 = segments.slice(-2).join('/');
    if (joinedRef2 === joinedFile2 && refSegments.length >= 2) return true;

    // Tier 3: 3-segment tail match.
    const joinedRef3 = refSegments.slice(-3).join('/');
    const joinedFile3 = segments.slice(-3).join('/');
    if (joinedRef3 && joinedRef3 === joinedFile3 && refSegments.length >= 3) return true;
  }
  return false;
}

function isExempt(libFile) {
  return EXEMPT_PATTERNS.some((re) => re.test(libFile));
}

function main() {
  const libModules = walk(path.join(PROJECT_ROOT, 'lib'));
  const refs = scanProductionRequires();

  const dead = [];
  const legacyDebt = [];
  const exempt = [];
  const live = [];
  for (const mod of libModules) {
    if (isExempt(mod)) exempt.push(mod);
    else if (!isReferenced(mod, refs)) {
      if (LEGACY_DEBT_PATTERNS.some((re) => re.test(mod))) legacyDebt.push(mod);
      else dead.push(mod);
    } else live.push(mod);
  }

  const report = {
    total: libModules.length,
    live: live.length,
    dead: dead.length,
    legacyDebt: legacyDebt.length,
    exempt: exempt.length,
    deadFiles: dead,
    legacyDebtFiles: legacyDebt,
    exemptFiles: exempt,
    passed: dead.length === 0, // legacy debt does NOT fail CI
  };

  if (isJsonFlag()) {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  } else {
    // eslint-disable-next-line no-console
    console.log('[check-deadcode] Scanning lib/ modules...');
    // eslint-disable-next-line no-console
    console.log(`  Total       : ${report.total}`);
    // eslint-disable-next-line no-console
    console.log(`  Live        : ${report.live} (required by production code)`);
    // eslint-disable-next-line no-console
    console.log(`  Exempt      : ${report.exempt} (Type-only ports + facades + dynamic load)`);
    // eslint-disable-next-line no-console
    console.log(`  Legacy debt : ${report.legacyDebt} (pre-v2.1.10, tracked but not blocking)`);
    // eslint-disable-next-line no-console
    console.log(`  Dead (NEW)  : ${report.dead}`);

    if (legacyDebt.length > 0) {
      // eslint-disable-next-line no-console
      console.warn('\n[check-deadcode] ⚠ Legacy technical debt (pre-v2.1.10, informational):');
      for (const d of legacyDebt) {
        // eslint-disable-next-line no-console
        console.warn(`  ⚠ ${d}`);
      }
    }

    if (dead.length > 0) {
      // eslint-disable-next-line no-console
      console.error('\n[check-deadcode] ✗ NEW dead modules found (FAIL):');
      for (const d of dead) {
        // eslint-disable-next-line no-console
        console.error(`  ✗ ${d}`);
      }
    } else {
      // eslint-disable-next-line no-console
      console.log('\n[check-deadcode] ✓ PASSED — no new dead code introduced in v2.1.10');
    }
  }

  process.exit(report.passed ? 0 : 1);
}

try {
  main();
} catch (e) {
  // eslint-disable-next-line no-console
  console.error(`[check-deadcode] runner error: ${e.message}`);
  process.exit(2);
}
