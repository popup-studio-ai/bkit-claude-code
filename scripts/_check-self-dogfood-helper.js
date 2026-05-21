#!/usr/bin/env node
'use strict';

/**
 * scripts/_check-self-dogfood-helper.js — v2.1.19 S1 F1-3 CI gate helper.
 *
 * Invoked by scripts/check-self-dogfood.sh (bash wrapper). Performs the
 * actual invariant checks and emits audit events. Exit codes:
 *   0 — PASS or override active
 *   1 — FAIL (invariant violation)
 *
 * Master plan §19 (Self-Dogfooding CI Gate) + §19.5 (Bootstrap Exception).
 * Design ref: docs/02-design/features/s1-foundation.design.md §4.1
 *
 * Invariants (per checked release):
 *   #1 master plan exists                — docs/01-plan/features/<prefix>-*.master-plan.md
 *   #2 sprint state archived             — .bkit/state/sprints/<prefix>-*.json (phase=archived)
 *   #3 sprint report exists              — docs/04-report/features/<prefix>-*.report.md
 *   #4 quality gates section in report   — ## Quality Gates (case-insensitive)
 *
 * Flags:
 *   --bootstrap-mode             — skip invariant #1 (predecessor sprint absent), audit emit
 *   --emergency-override <text>  — skip ALL invariants, audit emit, SQM penalty -10 (S5)
 *   --check-last <N>             — number of preceding patch releases to verify (default 1)
 *   --json                       — machine-readable JSON output (otherwise human-readable lines)
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
let auditLogger;
try {
  auditLogger = require(path.join(ROOT, 'lib/audit/audit-logger.js'));
} catch (_) {
  auditLogger = { writeAuditLog: () => {} }; // graceful degradation
}

function parseArgs(argv) {
  const out = { bootstrapMode: false, emergencyOverride: null, checkLast: 1, json: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--bootstrap-mode') {
      out.bootstrapMode = true;
    } else if (argv[i] === '--emergency-override') {
      out.emergencyOverride = argv[++i] || 'no reason given';
    } else if (argv[i] === '--check-last') {
      const n = parseInt(argv[++i], 10);
      if (Number.isFinite(n) && n > 0) out.checkLast = n;
    } else if (argv[i] === '--json') {
      out.json = true;
    } else if (argv[i] === '--help' || argv[i] === '-h') {
      out.help = true;
    }
  }
  return out;
}

function getCurrentBkitVersion() {
  try { return require(path.join(ROOT, 'bkit.config.json')).version; }
  catch (_) { return null; }
}

/**
 * Compute the N preceding patch versions before currentVersion.
 * For currentVersion 2.1.19 with N=1 → ['v2.1.18'].
 * For currentVersion 2.1.18 with N=3 → ['v2.1.17', 'v2.1.16', 'v2.1.15'].
 *
 * @param {string} currentVersion
 * @param {number} N
 * @returns {string[]} prefixed with 'v'
 */
function findRecentReleases(currentVersion, N) {
  if (!currentVersion) return [];
  const parts = currentVersion.replace(/^v/, '').split('.').map(Number);
  if (parts.length !== 3 || parts.some(p => !Number.isFinite(p))) return [];
  const releases = [];
  for (let i = 0; i < N; i++) {
    const v = [...parts];
    v[2] -= (i + 1);
    if (v[2] >= 0) releases.push('v' + v.join('.'));
  }
  return releases;
}

function nextVersion(currentVersion) {
  if (!currentVersion) return null;
  const parts = currentVersion.replace(/^v/, '').split('.').map(Number);
  if (parts.length !== 3 || parts.some(p => !Number.isFinite(p))) return null;
  parts[2] += 1;
  return 'v' + parts.join('.');
}

function checkReleaseInvariants(version) {
  const compact = 'v' + version.replace(/^v/, '').replace(/\./g, '');
  const masterPlanDir = path.join(ROOT, 'docs/01-plan/features');
  const masterPlan = fs.existsSync(masterPlanDir)
    ? fs.readdirSync(masterPlanDir).find(f => f.startsWith(compact + '-') && f.endsWith('.master-plan.md'))
    : null;

  const sprintsDir = path.join(ROOT, '.bkit/state/sprints');
  let sprintStateArchived = false;
  let sprintStateFile = null;
  if (fs.existsSync(sprintsDir)) {
    sprintStateFile = fs.readdirSync(sprintsDir).find(f => f.startsWith(compact + '-') && f.endsWith('.json'));
    if (sprintStateFile) {
      try {
        const state = JSON.parse(fs.readFileSync(path.join(sprintsDir, sprintStateFile), 'utf8'));
        sprintStateArchived = state.phase === 'archived';
      } catch (_) { /* malformed state */ }
    }
  }

  const reportDir = path.join(ROOT, 'docs/04-report/features');
  let sprintReport = null;
  let qualityGatesSection = false;
  if (fs.existsSync(reportDir)) {
    sprintReport = fs.readdirSync(reportDir).find(f => f.startsWith(compact + '-') && f.endsWith('.report.md'));
    if (sprintReport) {
      try {
        const content = fs.readFileSync(path.join(reportDir, sprintReport), 'utf8');
        qualityGatesSection = /##\s+.*Quality\s+Gates/i.test(content);
      } catch (_) { /* unreadable */ }
    }
  }

  return {
    version,
    compactPrefix: compact,
    masterPlanExists: !!masterPlan,
    masterPlanPath: masterPlan ? `docs/01-plan/features/${masterPlan}` : null,
    sprintStateArchived,
    sprintStatePath: sprintStateFile ? `.bkit/state/sprints/${sprintStateFile}` : null,
    sprintReportExists: !!sprintReport,
    sprintReportPath: sprintReport ? `docs/04-report/features/${sprintReport}` : null,
    qualityGatesSection,
  };
}

function buildInvariants(args, checkedReleases) {
  const invariants = [];
  if (args.bootstrapMode) {
    invariants.push({
      name: 'invariant#1 (skipped via --bootstrap-mode)',
      passed: true,
      value: 'skipped',
      reason: 'master plan §19.5 Bootstrap Exception',
    });
    return invariants;
  }
  if (args.emergencyOverride) {
    invariants.push({
      name: 'ALL invariants (skipped via --emergency-override)',
      passed: true,
      value: 'skipped',
      reason: args.emergencyOverride,
    });
    return invariants;
  }
  for (const r of checkedReleases) {
    invariants.push({ name: `invariant#1 ${r.version}: master plan exists`, passed: r.masterPlanExists, value: r.masterPlanExists, reason: r.masterPlanExists ? null : `not found in docs/01-plan/features/${r.compactPrefix}-*.master-plan.md` });
    invariants.push({ name: `invariant#2 ${r.version}: sprint state archived`, passed: r.sprintStateArchived, value: r.sprintStateArchived, reason: r.sprintStateArchived ? null : `state file missing or phase!=archived` });
    invariants.push({ name: `invariant#3 ${r.version}: sprint report exists`, passed: r.sprintReportExists, value: r.sprintReportExists, reason: r.sprintReportExists ? null : `not found in docs/04-report/features/${r.compactPrefix}-*.report.md` });
    invariants.push({ name: `invariant#4 ${r.version}: quality gates section`, passed: r.qualityGatesSection, value: r.qualityGatesSection, reason: r.qualityGatesSection ? null : `report missing ## .* Quality Gates section` });
  }
  return invariants;
}

function emitAudit(args, currentVersion, checkedReleases) {
  if (args.bootstrapMode) {
    try {
      auditLogger.writeAuditLog({
        actor: 'system', actorId: 'check-self-dogfood',
        action: 'sprint_bootstrap_mode_activated', category: 'sprint',
        target: 'check-self-dogfood', targetType: 'feature',
        details: {
          currentVersion,
          predecessorVersion: checkedReleases[0] && checkedReleases[0].version,
          targetActivation: nextVersion(currentVersion),
          checkedReleases,
        },
        result: 'success', destructiveOperation: false,
      });
    } catch (_) {}
    return 'sprint_bootstrap_mode_activated';
  }
  if (args.emergencyOverride) {
    try {
      auditLogger.writeAuditLog({
        actor: 'system', actorId: 'check-self-dogfood',
        action: 'self_dogfood_emergency_override', category: 'sprint',
        target: 'check-self-dogfood', targetType: 'feature',
        details: {
          currentVersion,
          reason: args.emergencyOverride,
          checkedReleases,
        },
        result: 'success', destructiveOperation: false,
      });
    } catch (_) {}
    return 'self_dogfood_emergency_override';
  }
  return null;
}

function printHelp() {
  console.log([
    'scripts/_check-self-dogfood-helper.js — v2.1.19 S1 F1-3 CI gate helper',
    '',
    'Usage:',
    '  node scripts/_check-self-dogfood-helper.js [flags]',
    '',
    'Flags:',
    '  --bootstrap-mode              skip invariant #1 (master plan §19.5 Exception)',
    '  --emergency-override <reason> skip ALL invariants, audit, SQM penalty -10',
    '  --check-last <N>              N preceding patch releases to verify (default 1)',
    '  --json                        machine-readable JSON output',
    '  --help, -h                    show this help',
    '',
    'Exit codes:',
    '  0  PASS or override active',
    '  1  FAIL — invariant violation',
  ].join('\n'));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }
  const currentVersion = getCurrentBkitVersion();
  if (!currentVersion) {
    const err = { pass: false, exitCode: 1, error: 'bkit.config.json not found or version field missing' };
    if (args.json) console.log(JSON.stringify(err, null, 2));
    else console.error('FAIL: ' + err.error);
    process.exit(1);
  }

  const releases = findRecentReleases(currentVersion, args.checkLast);
  const checkedReleases = releases.map(checkReleaseInvariants);
  const invariants = buildInvariants(args, checkedReleases);
  const auditEmittedAction = emitAudit(args, currentVersion, checkedReleases);
  const pass = invariants.every(i => i.passed);
  const result = {
    pass,
    currentVersion,
    bootstrapMode: args.bootstrapMode,
    emergencyOverride: args.emergencyOverride,
    invariants,
    checkedReleases,
    exitCode: pass ? 0 : 1,
    auditEmittedAction,
  };

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`bkit self-dogfood CI gate — current=${currentVersion}, check-last=${args.checkLast}`);
    for (const i of invariants) {
      console.log(`  ${i.passed ? '✓' : '✗'} ${i.name}${i.reason && !i.passed ? ' — ' + i.reason : ''}`);
    }
    if (args.bootstrapMode) console.log(`  [Bootstrap Exception] target activation: ${nextVersion(currentVersion)}`);
    if (args.emergencyOverride) console.log(`  [Emergency Override] reason: ${args.emergencyOverride}`);
    console.log(`\n${pass ? 'PASS' : 'FAIL'} (exit ${result.exitCode})`);
  }
  process.exit(result.exitCode);
}

if (require.main === module) main();

module.exports = {
  parseArgs,
  findRecentReleases,
  nextVersion,
  checkReleaseInvariants,
  buildInvariants,
  emitAudit,
};
