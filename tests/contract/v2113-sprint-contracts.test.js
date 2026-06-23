'use strict';

/**
 * v2113-sprint-contracts.test.js — L3 Contract Tests (tracked, CI gate).
 *
 * Enforces cross-sprint structural contracts between Sprint 1+2+3+4 outputs.
 * This file is git-tracked (unlike tests/qa/*) and serves as the canonical
 * regression suite preventing contract drift across:
 *   - Sprint 1 Sprint entity shape
 *   - Sprint 2 deps interface keys
 *   - Sprint 3 createSprintInfra return shape
 *   - Sprint 4 sprint-handler signature + audit + control mirror
 *   - Sprint 1+2+3+4 hooks.json invariant
 *
 * Run: node tests/contract/v2113-sprint-contracts.test.js
 *
 * Exit code 0 = all contracts hold. Non-zero = drift detected.
 *
 * Sprint Ref: v2113-sprint-5-quality-docs
 * @version 2.1.13
 * @since 2.1.13
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../..');

let passed = 0;
let failed = 0;

function record(name, fn) {
  try {
    const r = fn();
    if (r && typeof r.then === 'function') {
      return r.then(
        () => { passed++; console.log('  ✅ ' + name + ' PASS'); },
        (e) => { failed++; console.log('  ❌ ' + name + ' FAIL: ' + e.message); }
      );
    }
    passed++;
    console.log('  ✅ ' + name + ' PASS');
  } catch (e) {
    failed++;
    console.log('  ❌ ' + name + ' FAIL: ' + e.message);
  }
}

// === SC-01: Sprint entity shape ===
function sc01() {
  const domain = require(path.join(projectRoot, 'lib/domain/sprint'));
  const s = domain.createSprint({
    id: 'sc01',
    name: 'SC01Test',
    features: ['f1'],
    context: { WHY: 'x', WHO: 'x', RISK: 'x', SUCCESS: 'x', SCOPE: 'x' },
  });
  // Core 12 keys (subset of full 19, allowing entity growth without breaking contract)
  const coreKeys = ['id', 'name', 'features', 'featureMap', 'status', 'phase',
                    'autoRun', 'qualityGates', 'autoPause', 'config', 'docs', 'context'];
  coreKeys.forEach(k => assert(k in s, 'Sprint missing core key: ' + k));
  assert.strictEqual(s.id, 'sc01');
  assert.strictEqual(s.name, 'SC01Test');
  assert.deepStrictEqual(s.features, ['f1']);
  assert.strictEqual(typeof s.featureMap, 'object');
  // status starts in 'pending' or similar (not archived)
  assert.notStrictEqual(s.status, 'archived');
}

// === SC-02: Sprint 2 deps interface keys ===
function sc02() {
  const startSrc = fs.readFileSync(
    path.join(projectRoot, 'lib/application/sprint-lifecycle/start-sprint.usecase.js'),
    'utf8'
  );
  const iterSrc = fs.readFileSync(
    path.join(projectRoot, 'lib/application/sprint-lifecycle/iterate-sprint.usecase.js'),
    'utf8'
  );
  const validateSrc = fs.readFileSync(
    path.join(projectRoot, 'lib/application/sprint-lifecycle/verify-data-flow.usecase.js'),
    'utf8'
  );

  const startKeys = ['stateStore', 'eventEmitter', 'clock', 'gateEvaluator',
                     'autoPauseChecker', 'phaseHandlers', 'env'];
  startKeys.forEach(k => {
    assert(startSrc.includes('deps.' + k) || startSrc.includes('deps && deps.' + k),
      'start-sprint missing deps key: ' + k);
  });

  ['gapDetector', 'autoFixer'].forEach(k => {
    assert(iterSrc.includes('deps.' + k) || iterSrc.includes('deps && deps.' + k),
      'iterate-sprint missing deps key: ' + k);
  });

  assert(validateSrc.includes('dataFlowValidator'),
    'verify-data-flow missing dataFlowValidator');
}

// === SC-03: Sprint 3 createSprintInfra return shape ===
function sc03() {
  const infraMod = require(path.join(projectRoot, 'lib/infra/sprint'));
  assert.strictEqual(typeof infraMod.createSprintInfra, 'function');
  const infra = infraMod.createSprintInfra({ projectRoot: projectRoot });

  // 4 baseline adapters (Sprint 3 invariant)
  ['stateStore', 'eventEmitter', 'docScanner', 'matrixSync'].forEach(k => {
    assert(k in infra, 'createSprintInfra missing adapter: ' + k);
  });

  // stateStore must expose load/save/list/remove (Sprint 3 baseline naming)
  ['load', 'save', 'list', 'remove'].forEach(m => {
    assert.strictEqual(typeof infra.stateStore[m], 'function',
      'stateStore.' + m + ' must be function');
  });

  // Sprint 5 production scaffolds (3 new factories on barrel, NOT inside createSprintInfra)
  assert.strictEqual(typeof infraMod.createGapDetector, 'function');
  assert.strictEqual(typeof infraMod.createAutoFixer, 'function');
  assert.strictEqual(typeof infraMod.createDataFlowValidator, 'function');
}

// === SC-04: Sprint 4 sprint-handler signature (17 VALID_ACTIONS as of v2.1.16) ===
function sc04() {
  const handlerMod = require(path.join(projectRoot, 'scripts/sprint-handler'));
  assert.strictEqual(typeof handlerMod.handleSprintAction, 'function');
  assert.strictEqual(handlerMod.handleSprintAction.length, 3,
    'handleSprintAction must take (action, args, deps)');
  assert(Array.isArray(handlerMod.VALID_ACTIONS));
  // v2.1.13 S2-UX: 16 (added master-plan). v2.1.16 Issue #94 F3: 17 (added measure).
  assert.strictEqual(handlerMod.VALID_ACTIONS.length, 17,
    'VALID_ACTIONS must list 17 sub-actions (v2.1.16 added measure)');
  const expected = ['init', 'start', 'status', 'list', 'phase', 'iterate',
                    'qa', 'report', 'archive', 'pause', 'resume', 'fork',
                    'feature', 'watch', 'help', 'master-plan',
                    'measure']; // v2.1.16 (Issue #94 F3)
  expected.forEach(a => assert(handlerMod.VALID_ACTIONS.includes(a),
    'VALID_ACTIONS missing: ' + a));
}

// === SC-05: 4-layer end-to-end chain ===
async function sc05() {
  const handler = require(path.join(projectRoot, 'scripts/sprint-handler'));
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sc05-'));
  try {
    const initRes = await handler.handleSprintAction('init', {
      id: 'sc05-test',
      name: 'SC05Test',
      features: ['f1'],
      context: { WHY: 'x', WHO: 'x', RISK: 'x', SUCCESS: 'x', SCOPE: 'x' },
    }, { projectRoot: tmpRoot });
    assert.strictEqual(initRes.ok, true, 'init failed: ' + JSON.stringify(initRes));

    const statusRes = await handler.handleSprintAction('status', {
      id: 'sc05-test',
    }, { projectRoot: tmpRoot });
    assert.strictEqual(statusRes.ok, true, 'status failed');
    assert(statusRes.sprint, 'status missing sprint');
    assert.strictEqual(statusRes.sprint.id, 'sc05-test');

    const listRes = await handler.handleSprintAction('list', {}, { projectRoot: tmpRoot });
    assert.strictEqual(listRes.ok, true, 'list failed');
    assert(Array.isArray(listRes.sprints), 'list missing sprints array');
  } finally {
    // best-effort cleanup
    try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch (_e) {}
  }
}

// === SC-06: audit-logger ACTION_TYPES 28 entries (module-level assertion, not regex) ===
function sc06() {
  // v2.1.16 evolution: assert against the module's exported runtime array
  // rather than a source-text regex. The source-text regex was fragile —
  // it counted single-quoted string literals inside JSDoc comments (e.g.
  // 'requires_user_approval' referenced in the scope_boundary_approved doc
  // block), producing false-positive count drift.
  //
  // Module-level assertion: trust the actual exported value, then sanity-
  // check that critical action types are present.
  const al = require(path.join(projectRoot, 'lib/audit/audit-logger'));
  // v2.1.13 DEEP-4: +task_created (20). v2.1.14 Sub-Sprint 2 (Defense):
  //   +6 (layer_6_audit_completed/alarm_triggered, heredoc_bypass_blocked,
  //   git_push_intercepted, post_tool_block_recorded, hook_reachability_lost) → 26.
  // v2.1.14 Sub-Sprint 4 (E Defense): +memory_directive_enforced → 27.
  // v2.1.16 (Issue #95 F2): +scope_boundary_approved → 28.
  // v2.1.16 (Issue #94 F3): +gate_measured → 29.
  assert.strictEqual(al.ACTION_TYPES.length, 29,
    'ACTION_TYPES expected 29 entries, got ' + al.ACTION_TYPES.length +
    ' — entries: [' + al.ACTION_TYPES.join(', ') + ']');
  const required = [
    'sprint_paused',                // v2.1.13
    'sprint_resumed',               // v2.1.13
    'master_plan_created',          // v2.1.13 S2-UX
    'task_created',                 // v2.1.13 DEEP-4
    'memory_directive_enforced',    // v2.1.14 ENH-286
    'scope_boundary_approved',      // v2.1.16 Issue #95 F2
    'gate_measured',                // v2.1.16 Issue #94 F3
  ];
  for (const a of required) {
    assert(al.ACTION_TYPES.includes(a), a + ' missing from ACTION_TYPES');
  }
}

// === SC-07: SPRINT_AUTORUN_SCOPE mirror (Sprint 2 inline ↔ Sprint 4 lib/control) ===
function sc07() {
  const controlSrc = fs.readFileSync(
    path.join(projectRoot, 'lib/control/automation-controller.js'),
    'utf8'
  );
  const sprintSrc = fs.readFileSync(
    path.join(projectRoot, 'lib/application/sprint-lifecycle/start-sprint.usecase.js'),
    'utf8'
  );

  // Both must declare SPRINT_AUTORUN_SCOPE
  assert(controlSrc.includes('SPRINT_AUTORUN_SCOPE'),
    'lib/control missing SPRINT_AUTORUN_SCOPE');
  assert(sprintSrc.includes('SPRINT_AUTORUN_SCOPE'),
    'sprint-lifecycle inline missing SPRINT_AUTORUN_SCOPE');

  // 5 levels L0-L4
  ['L0', 'L1', 'L2', 'L3', 'L4'].forEach(lvl => {
    assert(controlSrc.includes(lvl), 'control missing level: ' + lvl);
    assert(sprintSrc.includes(lvl), 'sprint inline missing level: ' + lvl);
  });

  // stopAfter sentinel must appear in both
  assert(controlSrc.includes('stopAfter'), 'control missing stopAfter');
  assert(sprintSrc.includes('stopAfter'), 'sprint inline missing stopAfter');
}

// === SC-08: hooks/hooks.json 21:24 invariant ===
function sc08() {
  const hooks = JSON.parse(fs.readFileSync(
    path.join(projectRoot, 'hooks/hooks.json'),
    'utf8'
  ));
  const eventKeys = Object.keys(hooks.hooks || {});
  let blockCount = 0;
  eventKeys.forEach(k => {
    const arr = hooks.hooks[k];
    if (Array.isArray(arr)) blockCount += arr.length;
  });
  assert.strictEqual(eventKeys.length, 21,
    'hooks events expected 21, got ' + eventKeys.length);
  assert.strictEqual(blockCount, 24,
    'hooks blocks expected 24, got ' + blockCount);
}

// === SC-09: master-plan invocation 4-layer chain (S4-UX v2.1.13) ===
async function sc09() {
  const handler = require(path.join(projectRoot, 'scripts/sprint-handler'));

  // Unique test id with timestamp to avoid collision with real master plans
  const testId = 'sc09-test-' + Date.now();
  const masterPlanPath = path.join(projectRoot,
    'docs/01-plan/features/' + testId + '.master-plan.md');
  const stateFilePath = path.join(projectRoot,
    '.bkit/state/master-plans/' + testId + '.json');

  try {
    const result = await handler.handleSprintAction('master-plan', {
      id: testId,
      name: 'SC09 Test Master Plan',
      features: ['a', 'b'],
    }, {});

    // Layer 1: handler result
    assert.strictEqual(result.ok, true,
      'master-plan handler failed: ' + JSON.stringify(result));
    assert(result.plan, 'result missing plan');
    assert(result.masterPlanPath, 'result missing masterPlanPath');
    assert(result.stateFilePath, 'result missing stateFilePath');

    // Layer 2: state json
    assert(fs.existsSync(stateFilePath),
      'state json not created: ' + stateFilePath);
    const state = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
    assert.strictEqual(state.schemaVersion, '1.0',
      'state schemaVersion expected 1.0, got ' + state.schemaVersion);
    assert.strictEqual(state.projectId, testId);

    // Layer 3: markdown file
    assert(fs.existsSync(masterPlanPath),
      'markdown not created: ' + masterPlanPath);

    // Layer 4: audit entry (best-effort, may be batched)
    const today = new Date().toISOString().slice(0, 10);
    const auditPath = path.join(projectRoot, '.bkit/audit/' + today + '.jsonl');
    if (fs.existsSync(auditPath)) {
      const auditContent = fs.readFileSync(auditPath, 'utf8');
      assert(auditContent.includes('master_plan_created'),
        'audit missing master_plan_created entry');
      assert(auditContent.includes(testId),
        'audit missing testId reference');
    }
  } finally {
    // Cleanup test artifacts (best-effort)
    try { fs.unlinkSync(stateFilePath); } catch (_e) {}
    try { fs.unlinkSync(masterPlanPath); } catch (_e) {}
  }
}

// === SC-10: context-sizer pure function contract (S4-UX v2.1.13) ===
function sc10() {
  const cs = require(path.join(projectRoot,
    'lib/application/sprint-lifecycle/context-sizer'));

  // Schema version
  assert.strictEqual(cs.CONTEXT_SIZING_SCHEMA_VERSION, '1.0');

  // Token estimation determinism
  assert.strictEqual(cs.estimateTokensForFeature('x'), 33350,
    'default estimate must be 33350');
  assert.strictEqual(cs.estimateTokensForFeature('x', { locHint: 2000 }), 13340,
    'locHint=2000 estimate must be 13340');

  // Topological sort
  const t1 = cs.topologicalSort({});
  assert.strictEqual(t1.ok, true);
  assert.deepStrictEqual(t1.order, []);

  // Cycle detection
  assert.strictEqual(cs.detectCycle({ a: ['a'] }), true,
    'self-loop must be detected');
  assert.strictEqual(cs.detectCycle({ b: ['a'], c: ['b'] }), false,
    'linear chain must not detect cycle');

  // Recommendation: empty
  const r0 = cs.recommendSprintSplit({ projectId: 'sc10-test', features: [] });
  assert.strictEqual(r0.ok, true);
  assert.deepStrictEqual(r0.sprints, []);

  // Recommendation: 2 features, sprint shape
  const r1 = cs.recommendSprintSplit({
    projectId: 'sc10-test',
    features: ['a', 'b'],
  });
  assert.strictEqual(r1.ok, true);
  assert(Array.isArray(r1.sprints), 'sprints must be array');
  if (r1.sprints.length > 0) {
    const expectedKeys = ['dependsOn', 'features', 'id', 'name', 'scope', 'tokenEst'];
    const gotKeys = Object.keys(r1.sprints[0]).sort();
    assert.deepStrictEqual(gotKeys, expectedKeys,
      'sprint shape mismatch: ' + JSON.stringify(gotKeys));
  }

  // Cycle case
  const r2 = cs.recommendSprintSplit({
    projectId: 'sc10-test',
    features: ['a', 'b'],
    dependencyGraph: { a: ['b'], b: ['a'] },
  });
  assert.strictEqual(r2.ok, false);
  assert.strictEqual(r2.error, 'dependency_cycle');
}

// === SC-11: Sprint 2 quality-gates logic invariant (v2.1.16 evolution) ===
//
// v2.1.16 (Issue #92 F1, #95 F2, #94 F3, #93 F4) modifies the Sprint 2
// `lib/application/sprint-lifecycle/` directory intentionally (per
// Master Plan §1 SCOPE: quality-gates / advance-phase / sprint-handler /
// audit-logger). The v2.1.13 freeze-by-`git diff` invariant evolves into
// a structural assertion (INV-05 hooks.json pattern). The gate matrix
// itself remains unchanged (Master Plan §1 RISK invariant).
//
// This contract is the canonical tracked enforcement (`tests/qa/*` is
// gitignored). Local `tests/qa/v2113-sprint-4-presentation.test.js` INV-02
// keeps an equivalent assertion for the local feedback loop.
function sc11() {
  const qg = require(path.join(projectRoot, 'lib/application/sprint-lifecycle/quality-gates'));

  // 1) ACTIVE_GATES_BY_PHASE — exact baseline (8 phases, Master Plan §12.1).
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
  const phaseKeys = Object.keys(qg.ACTIVE_GATES_BY_PHASE).sort();
  assert.deepStrictEqual(phaseKeys, Object.keys(expectedActiveGates).sort(),
    'ACTIVE_GATES_BY_PHASE phase set drifted');
  for (const [phase, gates] of Object.entries(expectedActiveGates)) {
    assert.deepStrictEqual(
      [...qg.ACTIVE_GATES_BY_PHASE[phase]],
      gates,
      'ACTIVE_GATES_BY_PHASE.' + phase + ' drifted from v2.1.13 baseline'
    );
  }

  // 2) ACTIVE_GATES_BY_PHASE.design — Issue #92 critical baseline asserted explicitly.
  assert.deepStrictEqual([...qg.ACTIVE_GATES_BY_PHASE.design], ['M4', 'M8'],
    'design exit gates must remain [M4, M8] (Master Plan §11.1 AC4 — Option B rejected)');

  // 3) GATE_DEFINITIONS — 11 gates, M4/M8 field/op/threshold invariants.
  assert.strictEqual(Object.keys(qg.GATE_DEFINITIONS).length, 11,
    'GATE_DEFINITIONS count invariant: 11 (M1, M2, M3, M4, M5, M7, M8, M10, S1, S2, S4)');
  assert.strictEqual(qg.GATE_DEFINITIONS.M4.field, 'M4_apiComplianceRate');
  assert.strictEqual(qg.GATE_DEFINITIONS.M4.op, '>=');
  assert.strictEqual(qg.GATE_DEFINITIONS.M4.defaultThreshold, 95);
  assert.strictEqual(qg.GATE_DEFINITIONS.M8.field, 'M8_designCompleteness');
  assert.strictEqual(qg.GATE_DEFINITIONS.M8.op, '>=');
  assert.strictEqual(qg.GATE_DEFINITIONS.M8.defaultThreshold, 85);

  // 4) evaluateGate behavioral invariant — null current is the Issue #92 trigger
  //    surface. F1 documentation makes the orchestrator responsible for
  //    populating both M4 and M8 before advancePhase, so this behavior is the
  //    canonical "deadlock symptom" we are documenting against.
  const rNull = qg.evaluateGate(
    { qualityGates: { M4_apiComplianceRate: { current: null, threshold: 95 } } },
    'M4'
  );
  assert.strictEqual(rNull.passed, false);
  assert.strictEqual(rNull.reason, 'not_measured',
    'null current must surface as not_measured (Issue #92 deadlock symptom contract)');

  const rOk = qg.evaluateGate(
    { qualityGates: { M4_apiComplianceRate: { current: 100, threshold: 95 } } },
    'M4'
  );
  assert.strictEqual(rOk.passed, true);
  assert.strictEqual(rOk.current, 100);
}

// === SC-12: advance-phase --approve escape hatch contract (v2.1.16, Issue #95 F2) ===
//
// Behavioral contract for the single-use scope-boundary escape hatch:
//   - Without --approve at scope boundary: { ok: false, reason: 'requires_user_approval', hint }
//   - With --approve at scope boundary: { ok: true, approvalRecord: {...}, sprint.autoRun.scope unmutated }
//   - With --approve when no boundary blocks: approvalRecord null (no needless audit)
//   - With approve === false: legacy deadlock behavior preserved
async function sc12() {
  const adv = require(path.join(projectRoot, 'lib/application/sprint-lifecycle/advance-phase.usecase'));
  const domain = require(path.join(projectRoot, 'lib/domain/sprint'));

  // Build L2 sprint at design phase, all design gates passing.
  const base = domain.createSprint({
    id: 'sc12-test', name: 'SC12Test', trustLevelAtStart: 'L2', features: ['x'],
  });
  const sprint = domain.cloneSprint(base, {
    phase: 'design',
    autoRun: { ...base.autoRun, scope: { stopAfter: 'design', requireApproval: true } },
    qualityGates: {
      ...base.qualityGates,
      M4_apiComplianceRate:  { current: 100, threshold: 95, passed: true },
      M8_designCompleteness: { current: 100, threshold: 85, passed: true },
    },
    phaseHistory: [{ phase: 'design', enteredAt: new Date().toISOString(), exitedAt: null, durationMs: null }],
  });

  // 1) No --approve → requires_user_approval + hint
  const r1 = await adv.advancePhase(sprint, 'do');
  assert.strictEqual(r1.ok, false, 'no-approve scope crossing must return ok:false');
  assert.strictEqual(r1.reason, 'requires_user_approval');
  assert.strictEqual(r1.stopAfter, 'design');
  assert.strictEqual(typeof r1.hint, 'string', 'requires_user_approval response must include a hint string');
  assert(r1.hint.includes('--approve'), 'hint must mention --approve');

  // 2) --approve true → advance + approvalRecord populated
  const r2 = await adv.advancePhase(sprint, 'do', {
    approve: true,
    reason: 'SC-12 contract assertion',
  });
  assert.strictEqual(r2.ok, true);
  assert.strictEqual(r2.sprint.phase, 'do');
  assert(r2.approvalRecord, 'approvalRecord must be populated');
  assert.deepStrictEqual(Object.keys(r2.approvalRecord).sort(),
    ['approvedBy', 'from', 'reason', 'sprintId', 'stopAfter', 'to', 'trustLevel']);
  assert.strictEqual(r2.approvalRecord.from, 'design');
  assert.strictEqual(r2.approvalRecord.to, 'do');
  assert.strictEqual(r2.approvalRecord.trustLevel, 'L2');
  assert.strictEqual(r2.approvalRecord.approvedBy, 'user');
  assert.strictEqual(r2.approvalRecord.reason, 'SC-12 contract assertion');

  // 3) Single-use semantic — sprint.autoRun.scope NOT mutated.
  assert.deepStrictEqual(r2.sprint.autoRun.scope, sprint.autoRun.scope,
    'sprint.autoRun.scope must NOT be mutated by single-use approve');

  // 4) approve === false → legacy deadlock behavior preserved.
  const r4 = await adv.advancePhase(sprint, 'do', { approve: false });
  assert.strictEqual(r4.ok, false);
  assert.strictEqual(r4.reason, 'requires_user_approval');

  // 5) --approve true but no boundary blocking (L4 scope) → approvalRecord null.
  const sprintL4 = domain.cloneSprint(sprint, {
    autoRun: { ...sprint.autoRun, scope: { stopAfter: 'archived', requireApproval: false } },
  });
  const r5 = await adv.advancePhase(sprintL4, 'do', { approve: true });
  assert.strictEqual(r5.ok, true);
  assert.strictEqual(r5.approvalRecord, null,
    'approvalRecord must be null when --approve does not bypass any boundary');

  // 6) audit-logger ACTION_TYPES includes scope_boundary_approved (cross-check with SC-06).
  const al = require(path.join(projectRoot, 'lib/audit/audit-logger'));
  assert(al.ACTION_TYPES.includes('scope_boundary_approved'),
    'audit-logger.ACTION_TYPES must include scope_boundary_approved');

  // 7) Handler forwards --approve to advancePhase and emits audit entry on success.
  //    Validated end-to-end via temp project root. lib/core/platform caches
  //    PROJECT_DIR at first import — clear the require cache for platform +
  //    audit-logger + sprint-handler so they re-read cwd after chdir.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sc12-'));
  const prevCwd = process.cwd();
  const modulesToReset = [
    path.join(projectRoot, 'lib/core/platform'),
    path.join(projectRoot, 'lib/core/index'),
    path.join(projectRoot, 'lib/audit/audit-logger'),
    path.join(projectRoot, 'lib/infra/sprint/sprint-paths'),
    path.join(projectRoot, 'lib/infra/sprint/sprint-state-store.adapter'),
    path.join(projectRoot, 'lib/infra/sprint/sprint-telemetry.adapter'),
    path.join(projectRoot, 'lib/infra/sprint/sprint-doc-scanner.adapter'),
    path.join(projectRoot, 'lib/infra/sprint/matrix-sync.adapter'),
    path.join(projectRoot, 'lib/infra/sprint/index'),
    path.join(projectRoot, 'lib/infra/sprint'),
    path.join(projectRoot, 'scripts/sprint-handler'),
  ];
  function resetModules() {
    for (const m of modulesToReset) {
      try {
        const resolved = require.resolve(m);
        delete require.cache[resolved];
      } catch (_e) { /* not loaded yet */ }
    }
  }
  try {
    process.chdir(tmp);
    fs.mkdirSync(path.join(tmp, '.bkit', 'state', 'sprints'), { recursive: true });
    fs.mkdirSync(path.join(tmp, '.bkit', 'audit'), { recursive: true });
    fs.writeFileSync(path.join(tmp, '.bkit', 'state', 'sprints', 'sc12-handler.json'),
      JSON.stringify(domain.cloneSprint(sprint, { id: 'sc12-handler' }), null, 2));
    resetModules();
    const handler = require(path.join(projectRoot, 'scripts/sprint-handler'));
    const hr = await handler.handleSprintAction('phase', {
      id: 'sc12-handler', to: 'do', approve: true, reason: 'SC-12 handler integration',
    });
    assert.strictEqual(hr.ok, true);
    assert.strictEqual(hr.sprint.phase, 'do');
    assert(hr.approvalRecord, 'handler must surface approvalRecord');
    // Verify audit log file got the entry.
    const today = new Date().toISOString().slice(0, 10);
    const auditFile = path.join(tmp, '.bkit', 'audit', today + '.jsonl');
    assert(fs.existsSync(auditFile), 'audit log file must exist at ' + auditFile);
    const lines = fs.readFileSync(auditFile, 'utf8').split('\n').filter(Boolean).map(JSON.parse);
    const approved = lines.find((e) => e.action === 'scope_boundary_approved');
    assert(approved, 'audit log file must contain scope_boundary_approved entry — found actions: ' +
      lines.map((l) => l.action).join(', '));
    assert.strictEqual(approved.category, 'sprint');
    assert.strictEqual(approved.actor, 'user');
    assert.strictEqual(approved.target, 'sc12-handler');
    assert.strictEqual(approved.details.from, 'design');
    assert.strictEqual(approved.details.to, 'do');
    assert.strictEqual(approved.details.reason, 'SC-12 handler integration');
  } finally {
    process.chdir(prevCwd);
    resetModules(); // restore canonical modules for downstream tests
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_e) { /* ignore */ }
  }
}

// === SC-13: /sprint measure routing + measure-router + measure-gate UC (v2.1.16 Issue #94 F3) ===
//
// Behavioral contract for the measurement infrastructure introduced in F3:
//   - measure-router: 7 supported gates × 4 routed agents (M1/M3/M4 → gap-detector,
//     M2/M7 → code-analyzer, M8 → sprint-orchestrator, S1 → sprint-qa-flow).
//   - measure-gate.usecase: Trust Level scope (L0/L1 preview, L2+ record),
//     sequential dispatch (ENH-292), measureGates + measurePhaseGates aggregators.
//   - handleMeasure: --gate / --gates (CSV) / --phase mutually exclusive
//     precedence; per-gate gate_measured audit emission; cumulative state save.
async function sc13() {
  const mr = require(path.join(projectRoot, 'lib/application/quality-gates/measure-router'));
  const lifecycle = require(path.join(projectRoot, 'lib/application/sprint-lifecycle'));
  const domain = require(path.join(projectRoot, 'lib/domain/sprint'));

  // 1) Router routing table — Slice 2 promoted M5 (exemptible) and M10 (computed)
  // to routed gates: 9 supported, 2 unsupported (Master Plan §11.3 AC4 + Slice 2).
  assert.deepStrictEqual(mr.SUPPORTED_GATES.slice().sort(),
    ['M1', 'M2', 'M3', 'M4', 'M5', 'M7', 'M8', 'M10', 'S1'].sort());
  assert.deepStrictEqual(mr.UNSUPPORTED_GATES.slice().sort(),
    ['S2', 'S4'].sort());
  const routes = mr.GATE_MEASUREMENT_ROUTES;
  assert.strictEqual(routes.M1.agent, 'gap-detector');
  assert.strictEqual(routes.M3.agent, 'gap-detector');
  assert.strictEqual(routes.M4.agent, 'gap-detector');
  assert.strictEqual(routes.M2.agent, 'code-analyzer');
  assert.strictEqual(routes.M7.agent, 'code-analyzer');
  assert.strictEqual(routes.M8.agent, 'sprint-orchestrator');
  assert.strictEqual(routes.M5.agent, 'qa-monitor', 'M5 routed to qa-monitor (Slice 2)');
  assert.strictEqual(routes.S1.agent, 'sprint-qa-flow');

  // 2) Router error paths (no agentTaskRunner / unsupported gate / no JSON / non-numeric value).
  // Slice 2: M5 is now a routed (exemptible) gate — demonstrate unsupported_gate
  // with a key that has no route at all.
  assert.strictEqual((await mr.measureGate('XX', { id: 'x' }, {})).reason, 'unsupported_gate');
  assert.strictEqual((await mr.measureGate('M5', { id: 'x' }, {})).reason, 'no_agent_runner',
    'M5 is now routed (Slice 2); without a runner it yields no_agent_runner, not unsupported_gate');
  assert.strictEqual((await mr.measureGate('M4', { id: 'x' }, {})).reason, 'no_agent_runner');
  const runnerNoJson = { agentTaskRunner: async () => ({ output: 'no json' }) };
  assert.strictEqual((await mr.measureGate('M4', { id: 'x' }, runnerNoJson)).reason, 'no_json');
  const runnerBadVal = { agentTaskRunner: async () => ({ output: '{"value": "abc"}' }) };
  assert.strictEqual((await mr.measureGate('M4', { id: 'x' }, runnerBadVal)).reason, 'invalid_value');

  // 3) Use case: record mode (L2+) updates sprint.qualityGates.
  const fakeRunner = { agentTaskRunner: async ({ subagent_type }) =>
    ({ output: '{"value": 96, "details": "agent ' + subagent_type + '"}' }) };
  const sprintL3 = domain.cloneSprint(
    domain.createSprint({ id: 'sc13', name: 'SC13', trustLevelAtStart: 'L3', features: ['x'] }),
    { phase: 'design' }
  );
  const recordRes = await lifecycle.measureGate(sprintL3, 'M4', {
    agentTaskRunner: fakeRunner.agentTaskRunner,
  });
  assert.strictEqual(recordRes.mode, 'record');
  assert.strictEqual(recordRes.sprint.qualityGates.M4_apiComplianceRate.current, 96);
  assert.strictEqual(recordRes.sprint.qualityGates.M4_apiComplianceRate.passed, true);
  assert(recordRes.sprint.qualityGates.M4_apiComplianceRate.lastMeasuredAt,
    'lastMeasuredAt must be set in record mode');
  assert(recordRes.auditRecord, 'auditRecord must be populated in record mode');
  assert.strictEqual(recordRes.auditRecord.agent, 'gap-detector');

  // 4) Use case: preview mode (L1) does NOT mutate sprint and emits no auditRecord.
  const previewRes = await lifecycle.measureGate(sprintL3, 'M4', {
    agentTaskRunner: fakeRunner.agentTaskRunner,
    trustLevel: 'L1',
  });
  assert.strictEqual(previewRes.mode, 'preview');
  assert.strictEqual(previewRes.sprint, sprintL3,
    'preview mode must return the input sprint reference unchanged');
  assert.strictEqual(previewRes.auditRecord, null,
    'preview mode must NOT produce auditRecord');
  assert.strictEqual(previewRes.measurement.value, 96,
    'measurement still returned in preview mode for caller display');

  // 5) measureGates aggregator — sequential, cumulative state.
  const multi = await lifecycle.measureGates(sprintL3, ['M4', 'M8'], {
    agentTaskRunner: fakeRunner.agentTaskRunner,
  });
  assert.strictEqual(multi.ok, true);
  assert.strictEqual(multi.successCount, 2);
  assert.strictEqual(multi.failureCount, 0);
  assert.strictEqual(multi.sprint.qualityGates.M4_apiComplianceRate.current, 96);
  assert.strictEqual(multi.sprint.qualityGates.M8_designCompleteness.current, 96);

  // 6) measurePhaseGates — ACTIVE_GATES_BY_PHASE['design'] = [M4, M8].
  const phaseRes = await lifecycle.measurePhaseGates(sprintL3, 'design', {
    agentTaskRunner: fakeRunner.agentTaskRunner,
  });
  assert.strictEqual(phaseRes.ok, true);
  assert.strictEqual(phaseRes.phase, 'design');
  assert.strictEqual(phaseRes.results.length, 2);
  assert.deepStrictEqual(phaseRes.skippedUnsupported, [],
    'design phase should not have unsupported gates');

  // 7) Handler integration — /sprint measure --gate writes audit and persists sprint.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sc13-'));
  const prevCwd = process.cwd();
  const modules = [
    'lib/core/platform', 'lib/core/index', 'lib/audit/audit-logger',
    'lib/infra/sprint/sprint-paths', 'lib/infra/sprint/sprint-state-store.adapter',
    'lib/infra/sprint/sprint-telemetry.adapter', 'lib/infra/sprint/sprint-doc-scanner.adapter',
    'lib/infra/sprint/matrix-sync.adapter', 'lib/infra/sprint/index', 'lib/infra/sprint',
    'scripts/sprint-handler',
  ];
  const resetModules = () => {
    for (const m of modules) {
      try { delete require.cache[require.resolve(path.join(projectRoot, m))]; } catch (_e) { /* */ }
    }
  };
  try {
    process.chdir(tmp);
    fs.mkdirSync(path.join(tmp, '.bkit', 'state', 'sprints'), { recursive: true });
    fs.mkdirSync(path.join(tmp, '.bkit', 'audit'), { recursive: true });
    fs.writeFileSync(path.join(tmp, '.bkit', 'state', 'sprints', 'sc13.json'),
      JSON.stringify(sprintL3, null, 2));
    resetModules();
    const handler = require(path.join(projectRoot, 'scripts/sprint-handler'));
    const hr = await handler.handleSprintAction('measure', {
      id: 'sc13', gate: 'M4',
    }, { agentTaskRunner: fakeRunner.agentTaskRunner });
    assert.strictEqual(hr.ok, true);
    assert.strictEqual(hr.successCount, 1);
    const today = new Date().toISOString().slice(0, 10);
    const auditFile = path.join(tmp, '.bkit', 'audit', today + '.jsonl');
    const entries = fs.readFileSync(auditFile, 'utf8').split('\n').filter(Boolean).map(JSON.parse);
    const measured = entries.find((e) => e.action === 'gate_measured');
    assert(measured, 'audit log must contain gate_measured entry');
    assert.strictEqual(measured.category, 'sprint');
    assert.strictEqual(measured.details.gateKey, 'M4');
    assert.strictEqual(measured.details.agent, 'gap-detector');
    assert.strictEqual(measured.details.source, 'manual');
    // State persisted with measurement.
    const saved = JSON.parse(fs.readFileSync(
      path.join(tmp, '.bkit', 'state', 'sprints', 'sc13.json'), 'utf8'));
    assert.strictEqual(saved.qualityGates.M4_apiComplianceRate.current, 96);
  } finally {
    process.chdir(prevCwd);
    resetModules();
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_e) { /* ignore */ }
  }

  // 8) Cross-feature SoT: F1 agent body references measure-router (AC7 code-sharing).
  const agentBody = fs.readFileSync(
    path.join(projectRoot, 'agents/sprint-orchestrator.md'), 'utf8'
  );
  assert(agentBody.includes('measure-router'),
    'sprint-orchestrator agent must reference measure-router (AC7 single SoT)');
  assert(agentBody.includes('measure-gate.usecase'),
    'sprint-orchestrator agent must reference measure-gate.usecase');
  assert(agentBody.includes('GATE_MEASUREMENT_ROUTES'),
    'sprint-orchestrator agent must reference GATE_MEASUREMENT_ROUTES');
}

// === SC-14: gate_fail auto-report contract (v2.1.16 Issue #93 F4) ===
//
// Behavioral contract for the failure-reporter infrastructure introduced in F4:
//   - failure-reporter: pure path/markdown builders + factory with FS write
//   - advance-phase: gate_fail returns reportPath + sprint(lastGateFailure)
//   - handler: failureReporter injected → file written, state persisted,
//     gate_failed audit emitted with expanded details schema
//   - template: 6-column table (Sprint Phase / Gate / Status / Expected /
//     Actual / Suggested Action) per Issue #93 expected behavior
//   - cross-feature enriched data: M4 measurement (F1), --approve audit
//     (F2), gate_measured audit (F3) all surface in the report when relevant
async function sc14() {
  const fr = require(path.join(projectRoot, 'lib/application/quality-gates/failure-reporter'));
  const adv = require(path.join(projectRoot, 'lib/application/sprint-lifecycle/advance-phase.usecase'));
  const domain = require(path.join(projectRoot, 'lib/domain/sprint'));

  // 1) Pure path builder — timestamp normalization, canonical layout.
  const p = fr.buildReportPath('sc14-test', 'design', '2026-05-20T01:23:45.678Z');
  assert.strictEqual(p, 'docs/03-analysis/sc14-test-gate-fail-design-2026-05-20T01-23-45-678Z.md');

  // 2) Template exists at canonical path.
  const tplPath = path.join(projectRoot, fr.TEMPLATE_REL);
  assert(fs.existsSync(tplPath), 'gate-failure-report.template.md must exist at ' + fr.TEMPLATE_REL);
  const tplContent = fs.readFileSync(tplPath, 'utf8');
  assert(tplContent.includes('| Sprint Phase | Gate | Status | Expected | Actual | Suggested Action |'),
    'template must include the 6-column header per Master Plan §11.4 AC2');

  // 3) buildMarkdown — composes substituted markdown without FS write.
  const sprint = { id: 'sc14', name: 'SC14 Sprint', autoRun: { trustLevelAtStart: 'L2' } };
  const gateResults = {
    allPassed: false, phase: 'design',
    results: {
      M4: { gateKey: 'M4', current: null, threshold: 95, passed: false, reason: 'not_measured' },
      M8: { gateKey: 'M8', current: 100, threshold: 85, passed: true },
    },
  };
  const md = fr.buildMarkdown(sprint, 'design', gateResults, '2026-05-20T02:00:00.000Z', { toPhase: 'do' });
  assert(md.includes('design→do'), 'markdown header must include fromPhase→toPhase');
  assert(md.includes('| design | `M4` | FAIL'), 'markdown table must include failing M4 row');
  assert(md.includes('| design | `M8` | PASS'), 'markdown table must include passing M8 row');
  assert(md.includes('not_measured'), 'markdown must surface evaluator reason (not_measured)');
  assert(md.includes('/sprint measure --gate M4'), 'markdown must suggest F3 measure command for not_measured gates');
  assert(md.includes('/sprint phase'), 'markdown must surface F2 --approve command in next-steps');

  // 4) advancePhase — gate_fail return includes reportPath + sprint.lastGateFailure.
  const failingSprint = domain.cloneSprint(
    domain.createSprint({ id: 'sc14-adv', name: 'SC14', trustLevelAtStart: 'L4', features: ['x'] }),
    { phase: 'design' } // M4/M8 both null → fail
  );
  const captured = [];
  const fakeReporter = async (s, fromPhase, gr, ts, perCall) => {
    captured.push({ id: s.id, fromPhase, toPhase: perCall && perCall.toPhase, gateCount: Object.keys(gr.results || {}).length });
    return { reportPath: 'docs/03-analysis/' + s.id + '-fake.md', written: true };
  };
  const advRes = await adv.advancePhase(failingSprint, 'do', { failureReporter: fakeReporter });
  assert.strictEqual(advRes.ok, false);
  assert.strictEqual(advRes.reason, 'gate_fail');
  assert.strictEqual(advRes.reportPath, 'docs/03-analysis/sc14-adv-fake.md',
    'advancePhase must surface reporter reportPath in result');
  assert(advRes.sprint, 'advancePhase gate_fail must include cloned sprint (was missing pre-v2.1.16)');
  assert(advRes.sprint.lastGateFailure, 'sprint.lastGateFailure must be populated');
  assert.strictEqual(advRes.sprint.lastGateFailure.phase, 'design');
  assert.strictEqual(advRes.sprint.lastGateFailure.toPhase, 'do');
  assert.strictEqual(advRes.sprint.lastGateFailure.reportPath, 'docs/03-analysis/sc14-adv-fake.md');
  assert(advRes.sprint.lastGateFailure.timestamp, 'timestamp must be ISO string');
  // Reporter received toPhase via per-call opts (F4 fix).
  assert.strictEqual(captured.length, 1);
  assert.strictEqual(captured[0].toPhase, 'do',
    'failureReporter must receive toPhase via per-call opts');

  // 5) advancePhase — no failureReporter: still returns sprint.lastGateFailure
  //    (with reportPath=null), Issue #93 expected behavior item 3.
  const advNoReporter = await adv.advancePhase(failingSprint, 'do');
  assert.strictEqual(advNoReporter.ok, false);
  assert.strictEqual(advNoReporter.reason, 'gate_fail');
  assert.strictEqual(advNoReporter.reportPath, null);
  assert(advNoReporter.sprint.lastGateFailure,
    'lastGateFailure must populate even when reporter is absent');
  assert.strictEqual(advNoReporter.sprint.lastGateFailure.reportPath, null);

  // 6) Handler E2E — gate_fail writes report file, persists state, emits audit.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sc14-'));
  const prevCwd = process.cwd();
  const modules = [
    'lib/core/platform', 'lib/core/index', 'lib/audit/audit-logger',
    'lib/infra/sprint/sprint-paths', 'lib/infra/sprint/sprint-state-store.adapter',
    'lib/infra/sprint/sprint-telemetry.adapter', 'lib/infra/sprint/sprint-doc-scanner.adapter',
    'lib/infra/sprint/matrix-sync.adapter', 'lib/infra/sprint/index', 'lib/infra/sprint',
    'scripts/sprint-handler',
  ];
  const resetModules = () => {
    for (const m of modules) {
      try { delete require.cache[require.resolve(path.join(projectRoot, m))]; } catch (_e) { /* */ }
    }
  };
  try {
    process.chdir(tmp);
    fs.mkdirSync(path.join(tmp, '.bkit', 'state', 'sprints'), { recursive: true });
    fs.mkdirSync(path.join(tmp, '.bkit', 'audit'), { recursive: true });
    fs.writeFileSync(path.join(tmp, '.bkit', 'state', 'sprints', 'sc14-h.json'),
      JSON.stringify(failingSprint, null, 2).replace(/"sc14-adv"/g, '"sc14-h"'));
    resetModules();
    const handler = require(path.join(projectRoot, 'scripts/sprint-handler'));
    const hr = await handler.handleSprintAction('phase', { id: 'sc14-h', to: 'do' });
    assert.strictEqual(hr.ok, false);
    assert.strictEqual(hr.reason, 'gate_fail');
    assert(hr.reportPath);
    // Report file exists.
    const reportAbs = path.join(tmp, hr.reportPath);
    assert(fs.existsSync(reportAbs), 'report file must exist at ' + reportAbs);
    const reportContent = fs.readFileSync(reportAbs, 'utf8');
    assert(reportContent.includes('design→do'));
    assert(reportContent.includes('| Sprint Phase | Gate | Status | Expected | Actual | Suggested Action |'));
    // State persisted with lastGateFailure (even on gate_fail).
    const savedState = JSON.parse(fs.readFileSync(
      path.join(tmp, '.bkit', 'state', 'sprints', 'sc14-h.json'), 'utf8'));
    assert(savedState.lastGateFailure,
      'sprint state must persist lastGateFailure even on gate_fail');
    assert.strictEqual(savedState.lastGateFailure.reportPath, hr.reportPath);
    // Audit log gate_failed entry with expanded details.
    const today = new Date().toISOString().slice(0, 10);
    const auditFile = path.join(tmp, '.bkit', 'audit', today + '.jsonl');
    assert(fs.existsSync(auditFile), 'audit log file must exist');
    const entries = fs.readFileSync(auditFile, 'utf8')
      .split('\n').filter(Boolean).map(JSON.parse);
    const failedEntry = entries.find((e) => e.action === 'gate_failed');
    assert(failedEntry, 'audit log must contain gate_failed entry');
    assert.strictEqual(failedEntry.actor, 'system');
    assert.strictEqual(failedEntry.category, 'sprint');
    assert.strictEqual(failedEntry.target, 'sc14-h');
    assert.deepStrictEqual(Object.keys(failedEntry.details).sort(),
      ['failedGates', 'phase', 'reportPath', 'sprintId', 'targetPhase']);
    assert.strictEqual(failedEntry.details.reportPath, hr.reportPath);
    assert(Array.isArray(failedEntry.details.failedGates));
    assert(failedEntry.details.failedGates.length >= 1,
      'failedGates array must include at least one failing gate');
  } finally {
    process.chdir(prevCwd);
    resetModules();
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_e) { /* */ }
  }

  // 7) AC7 cross-feature enrichment — failure-reporter narrative must
  //    reference F2 (--approve), F3 (/sprint measure) commands so users can
  //    recover without trust escalation.
  const recoveryMd = fr.buildMarkdown(sprint, 'design', gateResults, '2026-05-20T02:00:00.000Z', { toPhase: 'do' });
  assert(recoveryMd.includes('/sprint phase') && recoveryMd.includes('--approve'),
    'recovery commands must include F2 --approve hint');
  assert(recoveryMd.includes('/sprint measure'),
    'recovery commands must include F3 /sprint measure hint');
  assert(recoveryMd.includes('/sprint pause') && recoveryMd.includes('/sprint resume'),
    'recovery commands must include pause/resume controls');
}

// === Runner ===
(async () => {
  console.log('=== L3 Contract Tests (Sprint 5 SC-01~08 + S4-UX SC-09~10 + v2.1.16 SC-11~14) ===\n');
  record('SC-01 Sprint entity shape (12 core keys)', sc01);
  record('SC-02 deps interface (start: 7 + iterate: 2 + verify: 1)', sc02);
  record('SC-03 createSprintInfra 4 adapters + Sprint 5 3 scaffolds', sc03);
  record('SC-04 handleSprintAction(action,args,deps) + 17 VALID_ACTIONS (v2.1.16 +measure)', sc04);
  await record('SC-05 4-layer end-to-end chain (init → status → list)', sc05);
  record('SC-06 ACTION_TYPES enum 29 entries (incl scope_boundary_approved + gate_measured)', sc06);
  record('SC-07 SPRINT_AUTORUN_SCOPE inline ↔ lib/control mirror (5 levels)', sc07);
  record('SC-08 hooks.json 21 events 24 blocks invariant', sc08);
  await record('SC-09 master-plan 4-layer chain (handler → state + markdown + audit)', sc09);
  record('SC-10 context-sizer pure function contract (5 assertions)', sc10);
  record('SC-11 Sprint 2 quality-gates logic invariant (v2.1.16 evolution, Issue #92)', sc11);
  await record('SC-12 advance-phase --approve escape hatch contract (v2.1.16 Issue #95 F2, 7 assertions + handler E2E)', sc12);
  await record('SC-13 /sprint measure routing + measure-router + measure-gate.usecase + handler E2E (v2.1.16 Issue #94 F3, 8 assertion groups)', sc13);
  await record('SC-14 gate_fail auto-report (failure-reporter + advancePhase + handler E2E, v2.1.16 Issue #93 F4, 7 assertion groups)', sc14);
  console.log('\n=== L3 Contract: ' + passed + '/' + (passed + failed) + ' PASS ===');
  if (failed > 0) {
    console.error('\n❌ ' + failed + ' contract(s) FAILED — cross-sprint drift detected.');
    process.exit(1);
  }
})().catch(e => { console.error(e); process.exit(1); });
