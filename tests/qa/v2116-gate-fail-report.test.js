/**
 * v2116-gate-fail-report.test.js — L3-F4 unit tests (Issue #93).
 *
 * Mirror of canonical SC-14 contract test (tests/contract/v2113-sprint-contracts)
 * but with AC-by-AC TC mapping. Local-only (.gitignore tests/qa/*).
 *
 * Master Plan: docs/01-plan/features/v2116-issue-fixes.master-plan.md §11.4
 * Issue: https://github.com/popup-studio-ai/bkit-claude-code/issues/93
 * Run:   node tests/qa/v2116-gate-fail-report.test.js
 */

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const fr = require(path.join(PLUGIN_ROOT, 'lib/application/quality-gates/failure-reporter'));
const adv = require(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle/advance-phase.usecase'));
const domain = require(path.join(PLUGIN_ROOT, 'lib/domain/sprint'));
const al = require(path.join(PLUGIN_ROOT, 'lib/audit/audit-logger'));

let pass = 0;
let fail = 0;
const failures = [];

async function tc(name, fn) {
  try {
    await fn();
    pass++;
  } catch (e) {
    fail++;
    failures.push({ name, message: e.message });
  }
}

function buildFailingSprint(id, opts) {
  const base = domain.createSprint({
    id, name: id, trustLevelAtStart: (opts && opts.trustLevel) || 'L4', features: ['x'],
  });
  return domain.cloneSprint(base, {
    phase: (opts && opts.phase) || 'design',
    qualityGates: opts && opts.qualityGates ? opts.qualityGates : base.qualityGates,
  });
}

function resetCwdDependentModules() {
  const modules = [
    'lib/core/platform', 'lib/core/index', 'lib/audit/audit-logger',
    'lib/infra/sprint/sprint-paths', 'lib/infra/sprint/sprint-state-store.adapter',
    'lib/infra/sprint/sprint-telemetry.adapter', 'lib/infra/sprint/sprint-doc-scanner.adapter',
    'lib/infra/sprint/matrix-sync.adapter', 'lib/infra/sprint/index', 'lib/infra/sprint',
    'scripts/sprint-handler',
  ];
  for (const m of modules) {
    try { delete require.cache[require.resolve(path.join(PLUGIN_ROOT, m))]; } catch (_e) { /* */ }
  }
}

(async () => {
  // ─────────────────────────────────────────────────────────────────────
  // AC1 — gate_fail auto-generates report under docs/03-analysis/
  // ─────────────────────────────────────────────────────────────────────
  await tc('AC1: gate_fail writes docs/03-analysis/<id>-gate-fail-<phase>-<ts>.md', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ac1-'));
    const prev = process.cwd();
    try {
      process.chdir(tmp);
      fs.mkdirSync(path.join(tmp, '.bkit', 'state', 'sprints'), { recursive: true });
      fs.mkdirSync(path.join(tmp, '.bkit', 'audit'), { recursive: true });
      const s = buildFailingSprint('ac1');
      fs.writeFileSync(path.join(tmp, '.bkit', 'state', 'sprints', 'ac1.json'),
        JSON.stringify(s, null, 2));
      resetCwdDependentModules();
      const handler = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
      const r = await handler.handleSprintAction('phase', { id: 'ac1', to: 'do' });
      assert.strictEqual(r.ok, false);
      assert.strictEqual(r.reason, 'gate_fail');
      assert(r.reportPath, 'reportPath must be present');
      assert(r.reportPath.startsWith('docs/03-analysis/'));
      assert(r.reportPath.includes('ac1-gate-fail-design-'));
      assert(r.reportPath.endsWith('.md'));
      assert(fs.existsSync(path.join(tmp, r.reportPath)), 'report file must exist');
    } finally {
      process.chdir(prev);
      resetCwdDependentModules();
      try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_e) { /* */ }
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // AC2 — Markdown 6-col table per Issue #93 example
  // ─────────────────────────────────────────────────────────────────────
  await tc('AC2: 6-col table — Sprint Phase / Gate / Status / Expected / Actual / Suggested Action', async () => {
    const sprint = { id: 'ac2', name: 'AC2', autoRun: { trustLevelAtStart: 'L2' } };
    const gr = {
      allPassed: false, phase: 'design',
      results: {
        M4: { gateKey: 'M4', current: null, threshold: 95, passed: false, reason: 'not_measured' },
        M8: { gateKey: 'M8', current: 100, threshold: 85, passed: true },
      },
    };
    const md = fr.buildMarkdown(sprint, 'design', gr, '2026-05-20T03:00:00.000Z', { toPhase: 'do' });
    assert(md.includes('| Sprint Phase | Gate | Status | Expected | Actual | Suggested Action |'),
      '6-col header required per Master Plan §11.4 AC2');
    assert(md.includes('| design | `M4` | FAIL | threshold = 95 | `null` (not_measured) |'));
    assert(md.includes('| design | `M8` | PASS | threshold = 85 | 100 |'));
  });

  // ─────────────────────────────────────────────────────────────────────
  // AC3 — sprint.lastGateFailure populated
  // ─────────────────────────────────────────────────────────────────────
  await tc('AC3: sprint state lastGateFailure { phase, toPhase, gateResults, reportPath, timestamp }', async () => {
    const s = buildFailingSprint('ac3');
    const fakeReporter = async () => ({ reportPath: 'docs/03-analysis/ac3-fake.md', written: true });
    const r = await adv.advancePhase(s, 'do', { failureReporter: fakeReporter });
    assert.strictEqual(r.ok, false);
    assert(r.sprint.lastGateFailure);
    assert.deepStrictEqual(Object.keys(r.sprint.lastGateFailure).sort(),
      ['gateResults', 'phase', 'reportPath', 'timestamp', 'toPhase']);
    assert.strictEqual(r.sprint.lastGateFailure.phase, 'design');
    assert.strictEqual(r.sprint.lastGateFailure.toPhase, 'do');
    assert.strictEqual(r.sprint.lastGateFailure.reportPath, 'docs/03-analysis/ac3-fake.md');
    // Even without reporter, lastGateFailure populates (reportPath=null).
    const r2 = await adv.advancePhase(s, 'do');
    assert(r2.sprint.lastGateFailure);
    assert.strictEqual(r2.sprint.lastGateFailure.reportPath, null);
  });

  // ─────────────────────────────────────────────────────────────────────
  // AC4 — audit-logger gate_failed reused + details schema expanded
  // ─────────────────────────────────────────────────────────────────────
  await tc('AC4: ACTION_TYPES.gate_failed reused (no new enum) + details has sprintId/phase/targetPhase/failedGates/reportPath', async () => {
    assert(al.ACTION_TYPES.includes('gate_failed'),
      'gate_failed must remain in ACTION_TYPES (re-used, not new)');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ac4-'));
    const prev = process.cwd();
    try {
      process.chdir(tmp);
      fs.mkdirSync(path.join(tmp, '.bkit', 'state', 'sprints'), { recursive: true });
      fs.mkdirSync(path.join(tmp, '.bkit', 'audit'), { recursive: true });
      const s = buildFailingSprint('ac4');
      fs.writeFileSync(path.join(tmp, '.bkit', 'state', 'sprints', 'ac4.json'),
        JSON.stringify(s, null, 2));
      resetCwdDependentModules();
      const handler = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
      await handler.handleSprintAction('phase', { id: 'ac4', to: 'do' });
      const today = new Date().toISOString().slice(0, 10);
      const entries = fs.readFileSync(
        path.join(tmp, '.bkit', 'audit', today + '.jsonl'), 'utf8'
      ).split('\n').filter(Boolean).map(JSON.parse);
      const failedEntry = entries.find((e) => e.action === 'gate_failed');
      assert(failedEntry, 'gate_failed entry must exist');
      assert.strictEqual(failedEntry.actor, 'system');
      assert.strictEqual(failedEntry.category, 'sprint');
      const detailKeys = Object.keys(failedEntry.details).sort();
      assert.deepStrictEqual(detailKeys,
        ['failedGates', 'phase', 'reportPath', 'sprintId', 'targetPhase']);
      assert(Array.isArray(failedEntry.details.failedGates));
      assert(failedEntry.details.failedGates.every((g) =>
        'gateKey' in g && 'current' in g && 'threshold' in g));
    } finally {
      process.chdir(prev);
      resetCwdDependentModules();
      try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_e) { /* */ }
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // AC5 — template file exists at canonical path
  // ─────────────────────────────────────────────────────────────────────
  await tc('AC5: templates/gate-failure-report.template.md exists with 6-col header', async () => {
    const tplAbs = path.join(PLUGIN_ROOT, fr.TEMPLATE_REL);
    assert(fs.existsSync(tplAbs), 'template file must exist at ' + fr.TEMPLATE_REL);
    const tpl = fs.readFileSync(tplAbs, 'utf8');
    assert(tpl.startsWith('---\ntemplate: gate-failure-report'),
      'template must have frontmatter');
    assert(tpl.includes('| Sprint Phase | Gate | Status | Expected | Actual | Suggested Action |'));
    assert(tpl.includes('{gateRows}'),
      'template must include {gateRows} placeholder for failure-reporter row substitution');
  });

  // ─────────────────────────────────────────────────────────────────────
  // AC6 — advancePhase return shape includes reportPath
  // ─────────────────────────────────────────────────────────────────────
  await tc('AC6: advancePhase gate_fail return shape includes reportPath + sprint', async () => {
    const s = buildFailingSprint('ac6');
    const r = await adv.advancePhase(s, 'do', {
      failureReporter: async () => ({ reportPath: 'docs/03-analysis/ac6.md', written: true }),
    });
    // Pre-v2.1.16 shape was { ok:false, reason:'gate_fail', gateResults }.
    // v2.1.16 F4 adds reportPath + sprint (cloned with lastGateFailure).
    assert.deepStrictEqual(Object.keys(r).sort(),
      ['gateResults', 'ok', 'reason', 'reportPath', 'sprint']);
    assert.strictEqual(r.reportPath, 'docs/03-analysis/ac6.md');
    assert(r.sprint && r.sprint.lastGateFailure);
  });

  // ─────────────────────────────────────────────────────────────────────
  // AC7 — Enriched data: F2 --approve + F3 /sprint measure hints in report
  // ─────────────────────────────────────────────────────────────────────
  await tc('AC7: report cross-references F2 --approve + F3 /sprint measure recovery hints', async () => {
    const sprint = { id: 'ac7', name: 'AC7', autoRun: { trustLevelAtStart: 'L2' } };
    const gr = {
      allPassed: false, phase: 'design',
      results: {
        M4: { gateKey: 'M4', current: null, threshold: 95, passed: false, reason: 'not_measured' },
      },
    };
    const md = fr.buildMarkdown(sprint, 'design', gr, '2026-05-20T03:00:00.000Z', { toPhase: 'do' });
    // F3 measure command (Suggested Action column + Next User Commands)
    assert(md.includes('/sprint measure --gate M4'),
      'Suggested Action must reference F3 /sprint measure');
    assert(md.includes('/sprint measure {sprintId}') === false,
      'placeholders must be substituted');
    assert(md.includes('/sprint measure ac7 --gate'),
      'Next User Commands must reference F3 /sprint measure with sprintId');
    // F2 --approve command
    assert(md.match(/\/sprint phase ac7 --to do --approve/),
      'Next User Commands must reference F2 --approve with sprintId');
    // Pause/resume
    assert(md.includes('/sprint pause ac7'));
    assert(md.includes('/sprint resume ac7'));
  });

  // ─────────────────────────────────────────────────────────────────────
  // Bonus TC-8 — Timestamp filesystem-safety (`:` and `.` normalized)
  // ─────────────────────────────────────────────────────────────────────
  await tc('TC-BONUS-8: timestamp normalization (`:` `.` → `-`) for cross-platform safety', async () => {
    const p = fr.buildReportPath('bonus', 'qa', '2026-05-20T03:14:15.926Z');
    assert(!p.includes(':'), 'no `:` in report path');
    // Filename segment between last `/` and `.md` must have no `.` (timestamp
    // dots normalized). path.basename(p, '.md') strips the `.md` extension.
    const basenameNoExt = path.basename(p, '.md');
    assert(!basenameNoExt.includes('.'),
      'no `.` in filename basename (excluding .md extension)');
    assert(p.endsWith('.md'), 'extension preserved');
    assert(p.includes('2026-05-20T03-14-15-926Z'),
      'timestamp segment must use `-` separators');
  });

  console.log('[v2116-gate-fail-report] ' + pass + '/' + (pass + fail) + ' PASS, ' + fail + ' FAIL');
  if (fail > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log('  - ' + f.name + ': ' + f.message);
    process.exit(1);
  }
})().catch((e) => { console.error(e); process.exit(1); });
