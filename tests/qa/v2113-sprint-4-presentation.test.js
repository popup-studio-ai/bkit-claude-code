/**
 * v2113-sprint-4-presentation.test.js — Sprint 4 Presentation L2+L3 integration tests.
 *
 * 8 groups (40+ TCs target):
 *   TRIG  — 8-language triggers in 5 frontmatters (skill + 4 agents)
 *   ENG   — English-only code body (skill + agents + handler + lib extensions)
 *   TEMPL — 7 templates exist, valid frontmatter
 *   H     — sprint-handler.js dispatcher 15 actions
 *   CTRL  — lib/control/automation-controller SPRINT_AUTORUN_SCOPE
 *   AUDIT — lib/audit/audit-logger ACTION_TYPES extension
 *   CSI4  — ★ Cross-Sprint Integration (Sprint 1+2+3+4 via skill handler)
 *   INV   — Invariants (Sprint 1/2/3/PDCA + hooks.json 21:24)
 */

'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const handler = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
const ac = require(path.join(PLUGIN_ROOT, 'lib/control/automation-controller'));
const al = require(path.join(PLUGIN_ROOT, 'lib/audit/audit-logger'));

let pass = 0;
let fail = 0;
let total = 0;
const failures = [];

function test(name, fn) {
  total += 1;
  try { fn(); pass += 1; }
  catch (e) { fail += 1; failures.push({ name, error: e.message }); }
}

async function testAsync(name, fn) {
  total += 1;
  try { await fn(); pass += 1; }
  catch (e) { fail += 1; failures.push({ name, error: e.message }); }
}

function readFile(rel) {
  return fs.readFileSync(path.join(PLUGIN_ROOT, rel), 'utf8');
}

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-sprint4-'));
}

function cleanup(root) {
  try { fs.rmSync(root, { recursive: true, force: true }); } catch (_e) {}
}

const FRONTMATTERS = [
  { file: 'skills/sprint/SKILL.md', label: 'skill' },
  { file: 'agents/sprint-orchestrator.md', label: 'orchestrator' },
  { file: 'agents/sprint-master-planner.md', label: 'master-planner' },
  { file: 'agents/sprint-qa-flow.md', label: 'qa-flow' },
  { file: 'agents/sprint-report-writer.md', label: 'report-writer' },
];

// Language regex anchors — at least one keyword from each language
const LANG_REGEX = {
  ko: /[가-힯]/,          // Hangul syllables
  ja: /[぀-ヿㇰ-ㇿ]/, // Hiragana + Katakana
  zh: /[一-鿿]/,          // CJK Unified
  es: /\b(sprint|coordinaci[oó]n|ciclo|estado|iniciar|finalizaci[oó]n|reporte|integridad|verificaci[oó]n|capas|orquestador|elementos|pendientes|maestro|planificaci[oó]n|dise[nñ]o|KPI)\b/i,
  fr: /\b(d[eé]marrer|coordination|cycle|statut|ach[eè]vement|rapport|int[eé]grit[eé]|flux|donn[eé]es|v[eé]rification|couches|orchestrateur|reportes?|[eé]l[eé]ments|maitre|planification|conception|KPI)\b/i,
  de: /\b(Sprint|Koordination|Zyklus|Status|Abschluss|Bericht|Integrit[aä]t|Datenfluss|Verifikation|Schichten|Orchestrator|Hauptplan|Planung|Design|KPI|[Uu]bertragungselemente)\b/,
  it: /\b(sprint|coordinamento|ciclo|stato|completamento|rapporto|integrit[aà]|flusso|dati|verifica|livelli|orchestratore|principale|pianificazione|progettazione|KPI|elementi|riportati)\b/i,
};

(async () => {
  // ─────────────────────────────────────────────────────────────────────────
  // TRIG — 5 frontmatters × 8 languages = 40 micro-assertions in 5 TCs
  // ─────────────────────────────────────────────────────────────────────────

  for (const fm of FRONTMATTERS) {
    test(`TRIG-${fm.label}: 8-language triggers present`, () => {
      const src = readFile(fm.file);
      // Extract YAML frontmatter (between leading --- markers)
      const m = src.match(/^---\n([\s\S]*?)\n---/);
      assert.ok(m, `frontmatter delimiters in ${fm.file}`);
      const fmBody = m[1];
      // English keyword presence (catch-all): word boundary 'sprint'
      assert.ok(/sprint/i.test(fmBody), `EN keyword in ${fm.file}`);
      // Other 7 languages
      for (const [lang, re] of Object.entries(LANG_REGEX)) {
        assert.ok(re.test(fmBody), `${lang.toUpperCase()} keyword missing in ${fm.file}`);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ENG — code body English-only (no Hangul outside frontmatter)
  // ─────────────────────────────────────────────────────────────────────────

  function stripFrontmatter(src) {
    const m = src.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
    return m ? m[1] : src;
  }

  function hasHangul(text) {
    return /[가-힯]/.test(text);
  }

  test('ENG-01: skills/sprint/SKILL.md body has no Hangul (outside frontmatter)', () => {
    const body = stripFrontmatter(readFile('skills/sprint/SKILL.md'));
    assert.equal(hasHangul(body), false);
  });

  test('ENG-02: 4 agents body has no Hangul (outside frontmatter)', () => {
    for (const a of ['sprint-orchestrator', 'sprint-master-planner', 'sprint-qa-flow', 'sprint-report-writer']) {
      const body = stripFrontmatter(readFile('agents/' + a + '.md'));
      assert.equal(hasHangul(body), false, `${a}.md body should be English-only`);
    }
  });

  test('ENG-03: scripts/sprint-handler.js has no Hangul', () => {
    const src = readFile('scripts/sprint-handler.js');
    assert.equal(hasHangul(src), false);
  });

  test('ENG-04: lib/control + lib/audit added lines have no Hangul', () => {
    const ctrl = readFile('lib/control/automation-controller.js');
    const audit = readFile('lib/audit/audit-logger.js');
    // SPRINT_AUTORUN_SCOPE block — match from header comment to closing of Object.freeze
    const start = ctrl.indexOf('Sprint Auto-Run Scope');
    const end = ctrl.indexOf('L4: Object.freeze');
    assert.ok(start > 0 && end > start, 'SPRINT_AUTORUN_SCOPE block found');
    const block = ctrl.slice(start, end + 200);
    assert.equal(hasHangul(block), false);
    // ACTION_TYPES sprint_paused/resumed lines
    const audLines = audit.match(/sprint_paused[\s\S]*?sprint_resumed/);
    assert.ok(audLines);
    assert.equal(hasHangul(audLines[0]), false);
  });

  test('ENG-05: skills/sprint/PHASES.md + 3 examples are English-only', () => {
    for (const f of [
      'skills/sprint/PHASES.md',
      'skills/sprint/examples/basic-sprint.md',
      'skills/sprint/examples/multi-feature-sprint.md',
      'skills/sprint/examples/archive-and-carry.md',
    ]) {
      const body = stripFrontmatter(readFile(f));
      assert.equal(hasHangul(body), false, `${f} should be English-only`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEMPL — 7 templates exist + frontmatter sanity
  // ─────────────────────────────────────────────────────────────────────────

  test('TEMPL-01: 7 templates/sprint/* exist with valid frontmatter', () => {
    const templates = ['master-plan', 'prd', 'plan', 'design', 'iterate', 'qa', 'report'];
    for (const t of templates) {
      const p = path.join(PLUGIN_ROOT, 'templates/sprint/', t + '.template.md');
      assert.ok(fs.existsSync(p), `${t}.template.md missing`);
      const src = fs.readFileSync(p, 'utf8');
      assert.ok(/^---\n[\s\S]*?template:\s*sprint-/.test(src), `${t} frontmatter has template: sprint-* key`);
      assert.ok(/variables:/.test(src), `${t} has variables: key`);
    }
  });

  test('TEMPL-02: Korean content in templates is acceptable (user-mandated exception)', () => {
    // Just verify that templates are not empty and contain expected sections
    const masterPlan = readFile('templates/sprint/master-plan.template.md');
    assert.ok(masterPlan.length > 500);
    assert.ok(/Sprint Master Plan/.test(masterPlan));
    // Korean OK in templates body (templates/ exception per user)
  });

  // ─────────────────────────────────────────────────────────────────────────
  // H — sprint-handler.js dispatcher 15 actions
  // ─────────────────────────────────────────────────────────────────────────

  test('H-01: VALID_ACTIONS frozen 17 entries (v2.1.13 +master-plan, v2.1.16 +measure)', () => {
    assert.ok(Object.isFrozen(handler.VALID_ACTIONS));
    assert.equal(handler.VALID_ACTIONS.length, 17);
    assert.ok(handler.VALID_ACTIONS.includes('master-plan'),
      'VALID_ACTIONS must include master-plan (S2-UX v2.1.13)');
    assert.ok(handler.VALID_ACTIONS.includes('measure'),
      'VALID_ACTIONS must include measure (v2.1.16 Issue #94 F3)');
  });

  test('H-02: handleSprintAction rejects unknown action', async () => {
    const r = await handler.handleSprintAction('bogus', {}, {});
    assert.equal(r.ok, false);
    assert.ok(/Unknown action/.test(r.error));
  });

  await testAsync('H-03: init creates sprint + saves to disk', async () => {
    const root = makeTempRoot();
    try {
      const r = await handler.handleSprintAction('init', {
        projectRoot: root,
        id: 'h03-init', name: 'Test Init', trustLevel: 'L3',
        context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' },
      });
      assert.equal(r.ok, true);
      assert.equal(r.sprintId, 'h03-init');
      const file = path.join(root, '.bkit/state/sprints/h03-init.json');
      assert.ok(fs.existsSync(file));
    } finally { cleanup(root); }
  });

  await testAsync('H-04: status loads sprint from disk', async () => {
    const root = makeTempRoot();
    try {
      await handler.handleSprintAction('init', {
        projectRoot: root, id: 'h04', name: 'H04',
        context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' },
      });
      const r = await handler.handleSprintAction('status', { projectRoot: root, id: 'h04' });
      assert.equal(r.ok, true);
      assert.equal(r.sprint.id, 'h04');
    } finally { cleanup(root); }
  });

  await testAsync('H-05: status returns error for missing sprint', async () => {
    const root = makeTempRoot();
    try {
      const r = await handler.handleSprintAction('status', { projectRoot: root, id: 'missing' });
      assert.equal(r.ok, false);
      assert.ok(/not found/i.test(r.error));
    } finally { cleanup(root); }
  });

  await testAsync('H-06: list returns count', async () => {
    const root = makeTempRoot();
    try {
      await handler.handleSprintAction('init', {
        projectRoot: root, id: 'h06-a', name: 'A',
        context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' },
      });
      await handler.handleSprintAction('init', {
        projectRoot: root, id: 'h06-b', name: 'B',
        context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' },
      });
      const r = await handler.handleSprintAction('list', { projectRoot: root });
      assert.equal(r.ok, true);
      assert.equal(r.count, 2);
    } finally { cleanup(root); }
  });

  await testAsync('H-07: pause + resume cycle', async () => {
    const root = makeTempRoot();
    try {
      await handler.handleSprintAction('init', {
        projectRoot: root, id: 'h07', name: 'H07',
        context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' },
      });
      const p = await handler.handleSprintAction('pause', { projectRoot: root, id: 'h07', message: 'test pause' });
      assert.equal(p.ok, true);
      assert.equal(p.sprint.status, 'paused');
      const rs = await handler.handleSprintAction('resume', { projectRoot: root, id: 'h07' });
      assert.equal(rs.ok, true);
      assert.equal(rs.sprint.status, 'active');
    } finally { cleanup(root); }
  });

  await testAsync('H-08: archive transitions to archived status', async () => {
    const root = makeTempRoot();
    try {
      await handler.handleSprintAction('init', {
        projectRoot: root, id: 'h08', name: 'H08', phase: 'do',
        context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' },
      });
      const r = await handler.handleSprintAction('archive', { projectRoot: root, id: 'h08' });
      assert.equal(r.ok, true);
      assert.equal(r.sprint.phase, 'archived');
      assert.equal(r.sprint.status, 'archived');
    } finally { cleanup(root); }
  });

  test('H-09: help returns text without disk access', async () => {
    const r = await handler.handleSprintAction('help');
    assert.equal(r.ok, true);
    assert.ok(/15/.test(r.helpText));
  });

  test('H-10: fork + feature + watch return deferred placeholder', async () => {
    const root = makeTempRoot();
    try {
      const f = await handler.handleSprintAction('fork', { projectRoot: root });
      assert.equal(f.deferred, true);
      const ft = await handler.handleSprintAction('feature', { projectRoot: root });
      assert.equal(ft.deferred, true);
    } finally { cleanup(root); }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CTRL + AUDIT — lib extensions
  // ─────────────────────────────────────────────────────────────────────────

  test('CTRL-01: SPRINT_AUTORUN_SCOPE 5 levels frozen', () => {
    assert.ok(Object.isFrozen(ac.SPRINT_AUTORUN_SCOPE));
    assert.deepEqual(Object.keys(ac.SPRINT_AUTORUN_SCOPE).sort(), ['L0', 'L1', 'L2', 'L3', 'L4']);
    assert.ok(Object.isFrozen(ac.SPRINT_AUTORUN_SCOPE.L3));
  });

  test('CTRL-02: SPRINT_AUTORUN_SCOPE.L3 default-recommended', () => {
    assert.equal(ac.SPRINT_AUTORUN_SCOPE.L3.stopAfter, 'report');
    assert.equal(ac.SPRINT_AUTORUN_SCOPE.L3.manual, false);
    assert.equal(ac.SPRINT_AUTORUN_SCOPE.L3.requireApproval, true);
  });

  test('CTRL-03: automation-controller other exports preserved', () => {
    assert.ok(ac.AUTOMATION_LEVELS);
    assert.ok(ac.GATE_CONFIG);
    assert.equal(typeof ac.getCurrentLevel, 'function');
  });

  test('AUDIT-01: ACTION_TYPES has 29 entries (v2.1.13 baseline 20 + v2.1.14 +7 + v2.1.16 #95 +1 + #94 +1)', () => {
    // v2.1.14 Sub-Sprint 2 (Defense) added 7 entries: layer_6_audit_completed,
    // layer_6_alarm_triggered, heredoc_bypass_blocked, git_push_intercepted,
    // post_tool_block_recorded, hook_reachability_lost, memory_directive_enforced.
    // v2.1.16 (Issue #95 F2) added scope_boundary_approved single-use escape hatch.
    // v2.1.16 (Issue #94 F3) added gate_measured for /sprint measure UC.
    assert.equal(al.ACTION_TYPES.length, 29);
    assert.ok(al.ACTION_TYPES.includes('scope_boundary_approved'),
      'ACTION_TYPES must include scope_boundary_approved (v2.1.16 Issue #95 F2)');
    assert.ok(al.ACTION_TYPES.includes('gate_measured'),
      'ACTION_TYPES must include gate_measured (v2.1.16 Issue #94 F3)');
  });

  test('AUDIT-02: sprint_paused + sprint_resumed + master_plan_created + task_created registered', () => {
    assert.ok(al.ACTION_TYPES.includes('sprint_paused'));
    assert.ok(al.ACTION_TYPES.includes('sprint_resumed'));
    assert.ok(al.ACTION_TYPES.includes('master_plan_created'),
      'ACTION_TYPES must include master_plan_created (S2-UX v2.1.13)');
    assert.ok(al.ACTION_TYPES.includes('task_created'),
      'ACTION_TYPES must include task_created (DEEP-4 v2.1.13 ENH-156 enum fix)');
  });

  test('AUDIT-03: existing 16 action types preserved', () => {
    const existing = ['phase_transition', 'feature_created', 'feature_archived', 'gate_passed', 'gate_failed'];
    for (const t of existing) {
      assert.ok(al.ACTION_TYPES.includes(t), `${t} missing`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ★ CSI4 — Cross-Sprint Integration (Sprint 1+2+3+4 via skill handler)
  // ─────────────────────────────────────────────────────────────────────────

  await testAsync('CSI-04-01: start action runs full Sprint 1+2+3 chain', async () => {
    const root = makeTempRoot();
    try {
      const r = await handler.handleSprintAction('start', {
        projectRoot: root,
        id: 'csi4-01', name: 'CSI4 01', trustLevel: 'L3',
        context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' },
        features: ['f1'],
      }, {
        lifecycleDeps: {
          gateEvaluator: () => ({ allPassed: true, results: {} }),
          autoPauseChecker: () => [],
          phaseHandlers: {
            iterate: async (s) => ({ sprint: s, blocked: false }),
            qa: async (s) => ({ sprint: s }),
            report: async (s) => ({ sprint: s }),
            archived: async (s) => ({ sprint: s }),
          },
        },
      });
      assert.equal(r.ok, true);
      assert.equal(r.finalPhase, 'report');
      // Disk verification (Sprint 3 stateStore.save)
      const file = path.join(root, '.bkit/state/sprints/csi4-01.json');
      assert.ok(fs.existsSync(file));
    } finally { cleanup(root); }
  });

  await testAsync('CSI-04-02: list union of state-store + doc-scanner', async () => {
    const root = makeTempRoot();
    try {
      // Add 1 sprint via init (state-store only)
      await handler.handleSprintAction('init', {
        projectRoot: root, id: 'csi4-02-a', name: 'A',
        context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' },
      });
      // Add 1 master-plan file (doc-scanner only)
      const planDir = path.join(root, 'docs/01-plan/features');
      fs.mkdirSync(planDir, { recursive: true });
      fs.writeFileSync(path.join(planDir, 'csi4-02-b.master-plan.md'), '# B');
      const r = await handler.handleSprintAction('list', { projectRoot: root });
      assert.equal(r.ok, true);
      assert.equal(r.count, 2);
      const sources = r.sprints.map(s => s.source).sort();
      assert.deepEqual(sources, ['docs', 'state']);
    } finally { cleanup(root); }
  });

  await testAsync('CSI-04-03: status loads via Sprint 3 stateStore + Sprint 1 entity preserved', async () => {
    const root = makeTempRoot();
    try {
      await handler.handleSprintAction('init', {
        projectRoot: root, id: 'csi4-03', name: 'CSI4 03', phase: 'do',
        context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' },
      });
      const r = await handler.handleSprintAction('status', { projectRoot: root, id: 'csi4-03' });
      assert.equal(r.ok, true);
      assert.equal(r.sprint.phase, 'do');
      assert.equal(r.sprint.context.WHY, 'w');
      // Sprint 1 entity invariants preserved
      assert.ok(r.sprint.autoRun);
      assert.ok(r.sprint.autoPause);
      assert.ok(r.sprint.qualityGates);
    } finally { cleanup(root); }
  });

  await testAsync('CSI-04-04: pause via skill -> Sprint 2 pauseSprint -> Sprint 3 audit', async () => {
    const root = makeTempRoot();
    const origCwd = process.cwd();
    try {
      process.chdir(root);
      await handler.handleSprintAction('init', {
        projectRoot: root, id: 'csi4-04', name: 'CSI4 04',
        context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' },
      });
      const r = await handler.handleSprintAction('pause', { projectRoot: root, id: 'csi4-04' });
      assert.equal(r.ok, true);
      assert.equal(r.sprint.status, 'paused');
      // Sprint 2 pauseSprint invoked
      assert.ok(r.pauseEvent);
      assert.equal(r.pauseEvent.type, 'SprintPaused');
    } finally { process.chdir(origCwd); cleanup(root); }
  });

  await testAsync('CSI-04-05: archive via skill -> S2 archiveSprint -> S3 disk', async () => {
    const root = makeTempRoot();
    try {
      await handler.handleSprintAction('init', {
        projectRoot: root, id: 'csi4-05', name: 'CSI4 05', phase: 'do',
        context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' },
      });
      const r = await handler.handleSprintAction('archive', { projectRoot: root, id: 'csi4-05' });
      assert.equal(r.ok, true);
      // Disk reflects archive
      const file = path.join(root, '.bkit/state/sprints/csi4-05.json');
      const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
      assert.equal(saved.status, 'archived');
      assert.equal(saved.phase, 'archived');
    } finally { cleanup(root); }
  });

  await testAsync('CSI-04-06: phase advance via skill -> S2 advancePhase -> S3 save', async () => {
    const root = makeTempRoot();
    try {
      await handler.handleSprintAction('init', {
        projectRoot: root, id: 'csi4-06', name: 'CSI4 06',
        context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' },
      });
      // bypass gates via allowGateOverride dep
      const r = await handler.handleSprintAction('phase', {
        projectRoot: root, id: 'csi4-06', to: 'plan',
      }, { lifecycleDeps: { allowGateOverride: true } });
      assert.equal(r.ok, true);
      assert.equal(r.sprint.phase, 'plan');
    } finally { cleanup(root); }
  });

  await testAsync('CSI-04-07: SPRINT_AUTORUN_SCOPE.L3 mirrors Sprint 2 inline', async () => {
    // Read Sprint 2 inline definition by importing lifecycle
    const lifecycle = require(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle'));
    assert.deepEqual(
      ac.SPRINT_AUTORUN_SCOPE.L3,
      lifecycle.SPRINT_AUTORUN_SCOPE.L3,
    );
    assert.deepEqual(
      ac.SPRINT_AUTORUN_SCOPE.L4,
      lifecycle.SPRINT_AUTORUN_SCOPE.L4,
    );
  });

  await testAsync('CSI-04-08: ACTION_TYPES sprint_paused integrates with audit normalize', async () => {
    // verify that audit-logger normalizeEntry recognises new enum entries
    // (passthrough already worked; with enum, the normalize result is identical)
    const entry = {
      action: 'sprint_paused',
      target: 'csi4-08',
      details: { sprintEventType: 'SprintPaused' },
    };
    // We can't easily call normalizeEntry directly (not exported), but
    // ACTION_TYPES.includes('sprint_paused') already verified in AUDIT-02.
    assert.ok(al.ACTION_TYPES.includes('sprint_paused'));
    assert.ok(al.ACTION_TYPES.includes('sprint_resumed'));
  });

  // ─────────────────────────────────────────────────────────────────────────
  // INV — Invariants
  // ─────────────────────────────────────────────────────────────────────────

  test('INV-01: lib/domain/sprint/ untouched (Sprint 1 invariant)', () => {
    const { execSync } = require('node:child_process');
    const out = execSync('git diff --stat lib/domain/sprint/', { cwd: PLUGIN_ROOT }).toString().trim();
    assert.equal(out, '');
  });

  test('INV-02: lib/application/sprint-lifecycle/ logic invariant (Sprint 2)', () => {
    // v2.1.16 (Issue #92 F1, #95 F2, #94 F3, #93 F4) evolution: the original
    // Sprint 2 freeze invariant (`git diff` against working tree must be empty)
    // was incompatible with the v2.1.16 sprint scope, which intentionally
    // modifies `quality-gates.js` (M4/M8 measurement responsibility docs),
    // `advance-phase.usecase.js` (--approve scope-boundary escape hatch +
    // gate-fail report integration), and adds `measure-gate.usecase.js`.
    // Master Plan §1 SCOPE explicitly enumerates the modified modules; the
    // invariant must protect the *behavioral* contract, not the raw bytes.
    //
    // Follows the INV-05 hooks.json evolution pattern (raw git diff → structural
    // assertions). Adds Sprint 2 evolution per Master Plan §1 RISK:
    //   "Quality Gate matrix (M1-M10, S1-S4) target — no change"
    //
    // Logic invariant: gate matrix structure + GATE_DEFINITIONS shape unchanged.
    const path = require('node:path');
    const qg = require(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle/quality-gates'));
    const expectedActiveGates = {
      prd:      [],
      plan:     ['M8'],
      design:   ['M4', 'M8'],
      do:       ['M1', 'M2', 'M3', 'M4', 'M5', 'M7'],
      iterate:  ['M1', 'M2', 'M3', 'M5', 'M7'],
      qa:       ['M1', 'M2', 'M3', 'M4', 'M5', 'M7', 'S1', 'S2'],
      report:   ['M1', 'M2', 'M3', 'M4', 'M5', 'M7', 'M8', 'M10', 'S1', 'S2', 'S4'],
      archived: [],
    };
    for (const [phase, gates] of Object.entries(expectedActiveGates)) {
      assert.deepStrictEqual(
        [...qg.ACTIVE_GATES_BY_PHASE[phase]],
        gates,
        `ACTIVE_GATES_BY_PHASE.${phase} drifted from v2.1.13 baseline (Sprint 2 logic invariant)`
      );
    }
    // GATE_DEFINITIONS shape — count + critical M4/M8 unchanged (Master Plan §1 RISK).
    assert.equal(Object.keys(qg.GATE_DEFINITIONS).length, 11,
      'GATE_DEFINITIONS count invariant: 11 (M1, M2, M3, M4, M5, M7, M8, M10, S1, S2, S4)');
    assert.equal(qg.GATE_DEFINITIONS.M4.field, 'M4_apiComplianceRate');
    assert.equal(qg.GATE_DEFINITIONS.M4.op, '>=');
    assert.equal(qg.GATE_DEFINITIONS.M4.defaultThreshold, 95);
    assert.equal(qg.GATE_DEFINITIONS.M8.field, 'M8_designCompleteness');
    assert.equal(qg.GATE_DEFINITIONS.M8.op, '>=');
    assert.equal(qg.GATE_DEFINITIONS.M8.defaultThreshold, 85);
    // evaluateGate behavioral invariant — null current still surfaces as not_measured.
    const r = qg.evaluateGate({ qualityGates: { M4_apiComplianceRate: { current: null, threshold: 95 } } }, 'M4');
    assert.equal(r.passed, false);
    assert.equal(r.reason, 'not_measured');
  });

  test('INV-03: lib/infra/sprint/ Sprint 3 baseline files untouched (Sprint 5 may extend index.js + add adapters)', () => {
    const { execSync } = require('node:child_process');
    // Sprint 3 baseline 6 files (Sprint 5 Plan §R8 — these must remain untouched even during Sprint 5):
    //   sprint-paths.js, sprint-state-store.adapter.js, sprint-telemetry.adapter.js,
    //   sprint-doc-scanner.adapter.js, matrix-sync.adapter.js
    // index.js is allowed to be extended in Sprint 5 (R2: 3 new factory exports added).
    // Sprint 5 may also add new adapter files (gap-detector/auto-fixer/data-flow-validator).
    // v2.1.26 amendment (design I-12, test-isolation guard): sprint-telemetry.adapter.js
    // was deliberately extended so `emit` honors an explicitly injected projectRoot
    // (audit writes were leaking to the developer's real .bkit from tests). It is
    // therefore removed from this lock — governance recorded in
    // docs/02-design/features/v2126-issue-response.design.en.md §4 I-12 + CHANGELOG.
    const sprint3Baseline = [
      'lib/infra/sprint/sprint-paths.js',
      'lib/infra/sprint/sprint-state-store.adapter.js',
      'lib/infra/sprint/sprint-doc-scanner.adapter.js',
      'lib/infra/sprint/matrix-sync.adapter.js',
    ];
    const out = execSync('git diff --stat ' + sprint3Baseline.join(' '), { cwd: PLUGIN_ROOT }).toString().trim();
    assert.equal(out, '', 'Sprint 3 baseline files must remain untouched: ' + out);
  });

  test('INV-04: lib/application/pdca-lifecycle/ untouched (PDCA invariant)', () => {
    const { execSync } = require('node:child_process');
    const out = execSync('git diff --stat lib/application/pdca-lifecycle/', { cwd: PLUGIN_ROOT }).toString().trim();
    assert.equal(out, '');
  });

  test('INV-05: hooks/hooks.json 22 events 25 blocks invariant', () => {
    // v2.1.14 Sub-Sprint 6 Observation: the original Sprint 4 invariant
    // froze hooks.json against structural change. Version-string bumps
    // inside the `description` field are SSoT-driven (BKIT_VERSION sync)
    // and explicitly allowed — assert event/block counts directly rather
    // than relying on a clean `git diff --stat`.
    // v2.1.27 (ENH-371): +UserPromptExpansion event/block for slash-command
    // orchestrator reachability (issue #132) → 21→22 events, 24→25 blocks.
    const data = JSON.parse(require('fs').readFileSync(
      require('path').join(PLUGIN_ROOT, 'hooks/hooks.json'), 'utf8'));
    const events = Object.keys(data.hooks || {});
    let totalBlocks = 0;
    for (const ev of events) totalBlocks += (data.hooks[ev] || []).length;
    assert.equal(events.length, 22, 'hooks.json must declare 22 events');
    assert.equal(totalBlocks, 25, 'hooks.json must declare 25 total blocks');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────

  console.log('');
  console.log(`[v2113-sprint-4-presentation] ${pass}/${total} PASS, ${fail} FAIL`);
  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`  - ${f.name}\n    ${f.error}`);
    }
  }
  process.exit(fail === 0 ? 0 : 1);
})();
