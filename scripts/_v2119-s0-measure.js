#!/usr/bin/env node
'use strict';

/**
 * scripts/_v2119-s0-measure.js — v2.1.18 baseline SQM measurement script
 *
 * Master plan §23 step 0 (CTO M-3 requirement).
 * Design ref: docs/02-design/features/s0-sqm-baseline.design.md §3
 *
 * Clean Architecture: Infrastructure layer. Collects raw data via
 *   - file system reads (skills/, docs/, .bkit/state/)
 *   - audit log replay (.bkit/audit/*.jsonl)
 *   - gh CLI (GitHub issues for pruge)
 * then delegates pure computation to lib/quality/sqm-calculator.js.
 *
 * Output:
 *   - .bkit/runtime/sqm-baseline.json (machine-readable)
 *   - audit event 'sqm_baseline_measured'
 *   - stdout JSON
 *
 * Usage: node scripts/_v2119-s0-measure.js [--dry-run]
 *
 * NFR:
 *   - Reproducible (same git commit → same components, measuredAt only differs)
 *   - Read-only on source (only writes to .bkit/runtime/)
 *   - Partial failure handling (gh down → external dogfooder = null, others measure)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();

const sqmCalc = require(path.join(ROOT, 'lib/quality/sqm-calculator.js'));
const auditLogger = require(path.join(ROOT, 'lib/audit/audit-logger.js'));
// v2.1.19 S5 F5-1 (CO-S2-2 + CO-S0-1): delegate docs-code drift detection to
// the S2 code-block-aware checker. Eliminates 2 false positives originally
// observed in S0 baseline (phase-3-mockup + phase-9-deployment).
const SKILLS_CHECKER = require(path.join(ROOT, 'scripts/check-skills-docs-code-sync.js'));

// ============================================================
// Raw data collectors (Infrastructure adapters)
// ============================================================

/**
 * Evaluate SKILL.md invariants for a single skill directory.
 * Invariants checked:
 *   - SKILL.md exists
 *   - frontmatter `name` matches dir name
 *   - declared `scripts/<name>.js` or `scripts/<name>-handler.js` references resolve
 *     (either at skill-local path OR at <bkit-root>/scripts/ — but consistent with
 *     SKILL.md text. Pure path mismatch is a failure.)
 */
function evaluateSkillInvariant(name, skillsRoot, bkitRoot) {
  const skillMdPath = path.join(skillsRoot, name, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) {
    return { name, skillMdPath, invariantPass: false, failures: ['SKILL.md missing'] };
  }
  const content = fs.readFileSync(skillMdPath, 'utf8');
  const failures = [];

  // Check 1: frontmatter name matches dir
  const nameMatch = content.match(/^name:\s*(\S+)/m);
  if (!nameMatch) {
    failures.push('frontmatter name field missing');
  } else if (nameMatch[1] !== name) {
    failures.push(`frontmatter name "${nameMatch[1]}" != dir "${name}"`);
  }

  // Check 2: declared `scripts/<x>.js` references resolve.
  // The reference must resolve at EITHER skill-local OR bkit-root — but pure
  // SKILL.md saying "scripts/sprint-handler.js" while actual is at bkit-root
  // is a docs/code drift (Issue #107).
  // Resolution rule (matches Issue #107 expectation):
  //   - skill-local exists → pass
  //   - skill-local missing BUT bkit-root has the file → fail (#107 — convention drift)
  //   - both missing → fail
  const scriptRefs = (content.match(/scripts\/[\w-]+(?:\.js)?/g) || []);
  const seenRefs = new Set();
  for (const ref of scriptRefs) {
    if (seenRefs.has(ref)) continue;
    seenRefs.add(ref);
    if (!ref.endsWith('.js')) continue; // skip ambiguous bare names
    const skillLocal = path.join(skillsRoot, name, ref);
    const rootLocal = path.join(bkitRoot, ref);
    if (fs.existsSync(skillLocal)) continue; // skill-local pass
    if (fs.existsSync(rootLocal)) {
      failures.push(`SKILL.md declares "${ref}" but actual file is at <bkit-root>/${ref} (path drift)`);
    } else {
      failures.push(`SKILL.md declares "${ref}" — file not found at skill-local OR bkit-root`);
    }
  }

  return { name, skillMdPath, invariantPass: failures.length === 0, failures };
}

function collectDocsCodeData() {
  // v2.1.19 S5 F5-1 (CO-S2-2): delegate to S2 checker which uses
  // code-block-aware stripCodeBlocks (lib/util/markdown-parse.js). The
  // local `evaluateSkillInvariant` above is kept as legacy fallback if
  // SKILLS_CHECKER fails to load.
  const skillsRoot = path.join(ROOT, 'skills');
  if (!fs.existsSync(skillsRoot)) {
    return { skills: [] };
  }
  const skillNames = fs.readdirSync(skillsRoot)
    .filter(d => {
      try { return fs.statSync(path.join(skillsRoot, d)).isDirectory(); }
      catch (_) { return false; }
    });
  const skills = skillNames.map(name => {
    try {
      const r = SKILLS_CHECKER.evaluateSkillInvariant(name);
      return {
        name: r.name,
        skillMdPath: r.skillMdPath,
        invariantPass: r.invariantPass,
        failures: r.failures || [],
      };
    } catch (_) {
      // Fallback to local evaluator (legacy S0 path) if checker unavailable
      return evaluateSkillInvariant(name, skillsRoot, ROOT);
    }
  });
  return { skills };
}

/**
 * Find first file matching a regex pattern.
 *
 * v2.1.19 S5 F5-1 (CO-S0-5 fix): the previous implementation
 * `pattern.replace(/\\./g, '\\\\.')` over-escaped already-escaped patterns
 * — `v2116-.*\\.master-plan\\.md` became `v2116-\\.\\..*\\\\\\.master-plan\\\\\\.md`
 * which never matched any real file. Result: v2.1.16 master plan was
 * silently reported as missing (S0 sprintSelfDogfoodRunRate raw data wrong).
 *
 * New contract (S5 ADR S5-001): caller passes a regex-ready string.
 * Anchored with ^...$.
 */
function findFirstMatching(dirRelative, regexStr) {
  const dir = path.join(ROOT, dirRelative);
  if (!fs.existsSync(dir)) return null;
  const re = new RegExp('^' + regexStr + '$');
  for (const f of fs.readdirSync(dir)) {
    if (re.test(f)) return path.join(dir, f);
  }
  return null;
}

function collectSprintRunsData(versions = ['v2.1.14', 'v2.1.15', 'v2.1.16', 'v2.1.17', 'v2.1.18']) {
  return {
    releases: versions.map(v => {
      // version "v2.1.14" → prefix "v2114"
      const compact = 'v' + v.replace(/^v/, '').replace(/\./g, '');
      const masterPlan = findFirstMatching('docs/01-plan/features', `${compact}-.*\\.master-plan\\.md`);
      const sprintState = findFirstMatching('.bkit/state/sprints', `${compact}-.*\\.json`);
      let archived = false;
      if (sprintState) {
        try {
          const state = JSON.parse(fs.readFileSync(sprintState, 'utf8'));
          archived = state.phase === 'archived';
        } catch (_) { /* ignore parse error */ }
      }
      const runAsSprint = (masterPlan && archived) ? true
                       : (masterPlan && !archived) ? 'partial'
                       : false;
      return {
        version: v,
        masterPlanExists: !!masterPlan,
        sprintStateArchived: archived,
        runAsSprint,
      };
    }),
  };
}

async function collectDogfooderIssuesData(asOf, dogfooders) {
  const sinceDate = new Date(new Date(asOf).getTime() - 30 * 24 * 60 * 60 * 1000);
  const since = sinceDate.toISOString();
  const sinceDateOnly = since.split('T')[0];
  const issues = [];
  for (const handle of dogfooders) {
    try {
      const json = execSync(
        `gh issue list --state all --search "author:${handle} created:>=${sinceDateOnly}" --limit 100 --json number,createdAt,closedAt,author,title`,
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000 }
      );
      const parsed = JSON.parse(json);
      for (const i of parsed) {
        const created = new Date(i.createdAt);
        const closed = i.closedAt ? new Date(i.closedAt) : null;
        const hoursToClose = closed ? (closed - created) / (1000 * 60 * 60) : null;
        issues.push({
          number: i.number,
          creator: (i.author && i.author.login) || handle,
          createdAt: i.createdAt,
          closedAt: i.closedAt,
          hoursToClose: hoursToClose !== null ? Math.round(hoursToClose * 10) / 10 : null,
          within24h: hoursToClose !== null && hoursToClose <= 24,
          title: i.title,
        });
      }
    } catch (e) {
      // Partial failure — record but continue
      issues.__error = (issues.__error || []).concat([{ dogfooder: handle, error: String(e.message || e) }]);
    }
  }
  return {
    windowStart: since,
    windowEnd: asOf,
    dogfooders,
    issues: issues.__error ? null : issues,
    apiErrors: issues.__error || null,
  };
}

function collectSprintReportsData() {
  const reportDir = path.join(ROOT, 'docs/04-report/features');
  if (!fs.existsSync(reportDir)) return { reports: [] };
  const reports = fs.readdirSync(reportDir)
    .filter(f => f.endsWith('.report.md'))
    .map(f => {
      const content = fs.readFileSync(path.join(reportDir, f), 'utf8');
      const hasKpi = /(KPI Snapshot|## .*KPI)/i.test(content);
      const hasQg = /(qualityGates|Quality Gates)/i.test(content);
      // Conservative divergence: if both present → 0 (consistent), missing either → 1 divergence
      // S3 F3-3 will introduce a more precise consistency check.
      const divergenceCount = (hasKpi && hasQg) ? 0 : 1;
      return {
        feature: f.replace('.report.md', ''),
        divergenceCount,
        hasKpi,
        hasQg,
      };
    });
  return { reports };
}

function collectDispatchAuditData(asOf) {
  const sinceDate = new Date(new Date(asOf).getTime() - 30 * 24 * 60 * 60 * 1000);
  const since = sinceDate.toISOString();
  const auditDir = path.join(ROOT, '.bkit/audit');
  if (!fs.existsSync(auditDir)) {
    return { dispatches: [], windowStart: since, windowEnd: asOf };
  }
  const sinceDateOnly = since.split('T')[0];
  const asOfDateOnly = asOf.split('T')[0];
  const dispatches = [];
  for (const f of fs.readdirSync(auditDir)) {
    if (!f.endsWith('.jsonl')) continue;
    const fileDate = f.replace('.jsonl', '');
    if (fileDate < sinceDateOnly || fileDate > asOfDateOnly) continue;
    const lines = fs.readFileSync(path.join(auditDir, f), 'utf8').trim().split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const e = JSON.parse(line);
        // Sub-agent dispatch heuristic: category=sprint AND actorId matches sprint-* agent
        if (e.category === 'sprint' && /^(sprint-orchestrator|sprint-master-planner|sprint-qa-flow|sprint-report-writer)/.test(e.actorId || '')) {
          dispatches.push({
            actorId: e.actorId,
            timestamp: e.timestamp,
            action: e.action,
            success: e.result === 'success',
          });
        }
      } catch (_) { /* skip malformed line */ }
    }
  }
  return { dispatches, windowStart: since, windowEnd: asOf, windowEmpty: dispatches.length === 0 };
}

function collectConventionTestsData() {
  const testFile = path.join(ROOT, 'test/contract/baseline/skills-convention.json');
  // S2 F2-4 will create this. For v2.1.18 baseline: testsExist=false.
  return { testsExist: fs.existsSync(testFile), passed: 0, total: 0 };
}

// ============================================================
// Main flow
// ============================================================

(async () => {
  const isDryRun = process.argv.includes('--dry-run');
  const asOf = new Date().toISOString();
  let gitCommit = 'unknown';
  try {
    gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8', cwd: ROOT }).trim();
  } catch (_) { /* git unavailable, keep 'unknown' */ }
  let bkitVersion = 'unknown';
  try {
    bkitVersion = require(path.join(ROOT, 'bkit.config.json')).version;
  } catch (_) { /* config unavailable */ }

  // Collect raw data
  const rawData = {
    docsCode: collectDocsCodeData(),
    sprintRuns: collectSprintRunsData(),
    dogfooderIssues: await collectDogfooderIssuesData(asOf, sqmCalc.DEFAULT_DOGFOODERS),
    sprintReports: collectSprintReportsData(),
    dispatchAudit: collectDispatchAuditData(asOf),
    conventionTests: collectConventionTestsData(),
  };

  // Compute via pure aggregator
  const result = sqmCalc.computeSqm({
    rawData,
    asOf,
    gitCommit,
    bkitVersion,
  });

  if (isDryRun) {
    console.log('--- DRY RUN — no files written, no audit emitted ---');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  }

  // Archive runtime
  const baselinePath = path.join(ROOT, '.bkit/runtime/sqm-baseline.json');
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  fs.writeFileSync(baselinePath, JSON.stringify(result, null, 2) + '\n');

  // Audit emit
  auditLogger.writeAuditLog({
    actor: 'system',
    actorId: 's0-measure-script',
    action: 'sqm_baseline_measured',
    category: 'sprint',
    target: 's0-sqm-baseline',
    targetType: 'feature',
    details: {
      total: result.total,
      components: Object.fromEntries(
        Object.entries(result.components).map(([k, v]) => [
          k,
          { value: v.value, weight: v.weight, weighted: v.weighted },
        ])
      ),
      gitCommit,
      bkitVersion,
      asOf: result.asOf,
      warnings: result.warnings,
      schemaVersion: result.schemaVersion,
    },
    result: 'success',
    reason: 'S0 baseline SQM measurement (master plan §23 step 0, CTO M-3 response)',
    destructiveOperation: false,
  });

  console.log(JSON.stringify(result, null, 2));
})().catch(err => {
  console.error('MEASURE_FAIL:', err && err.stack || err);
  process.exit(2);
});
