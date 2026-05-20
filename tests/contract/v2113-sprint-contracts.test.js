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

// === SC-04: Sprint 4 sprint-handler signature ===
function sc04() {
  const handlerMod = require(path.join(projectRoot, 'scripts/sprint-handler'));
  assert.strictEqual(typeof handlerMod.handleSprintAction, 'function');
  assert.strictEqual(handlerMod.handleSprintAction.length, 3,
    'handleSprintAction must take (action, args, deps)');
  assert(Array.isArray(handlerMod.VALID_ACTIONS));
  assert.strictEqual(handlerMod.VALID_ACTIONS.length, 16,
    'VALID_ACTIONS must list 16 sub-actions');
  // 16 expected actions (S2-UX v2.1.13 added master-plan)
  const expected = ['init', 'start', 'status', 'list', 'phase', 'iterate',
                    'qa', 'report', 'archive', 'pause', 'resume', 'fork',
                    'feature', 'watch', 'help', 'master-plan'];
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

// === SC-06: audit-logger ACTION_TYPES 18 entries ===
function sc06() {
  const src = fs.readFileSync(
    path.join(projectRoot, 'lib/audit/audit-logger.js'),
    'utf8'
  );
  // Match `const ACTION_TYPES = [ ... ]` (Sprint 4 baseline shape, no Object.freeze wrap)
  const match = src.match(/const\s+ACTION_TYPES\s*=\s*\[([\s\S]*?)\];/);
  assert(match, 'ACTION_TYPES array literal not found');
  const entries = match[1].match(/'[^']+'/g) || [];
  // v2.1.13 DEEP-4 fix: added 'task_created' (ENH-156 was emitting but enum
  // missed registration). v2.1.14 Sub-Sprint 2 (Defense) added 7 entries
  // (layer_6_audit_completed/alarm_triggered, heredoc_bypass_blocked,
  // git_push_intercepted, post_tool_block_recorded, hook_reachability_lost,
  // memory_directive_enforced). Total 20 → 27.
  assert.strictEqual(entries.length, 27,
    'ACTION_TYPES expected 27 entries, got ' + entries.length);
  const flat = entries.join(',');
  assert(flat.includes('sprint_paused'), 'sprint_paused missing from ACTION_TYPES');
  assert(flat.includes('sprint_resumed'), 'sprint_resumed missing from ACTION_TYPES');
  assert(flat.includes('master_plan_created'), 'master_plan_created missing from ACTION_TYPES (S2-UX v2.1.13)');
  assert(flat.includes('task_created'), 'task_created missing from ACTION_TYPES (DEEP-4 v2.1.13)');
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

// === Runner ===
(async () => {
  console.log('=== L3 Contract Tests (Sprint 5 SC-01~08 + S4-UX SC-09~10 + v2.1.16 SC-11) ===\n');
  record('SC-01 Sprint entity shape (12 core keys)', sc01);
  record('SC-02 deps interface (start: 7 + iterate: 2 + verify: 1)', sc02);
  record('SC-03 createSprintInfra 4 adapters + Sprint 5 3 scaffolds', sc03);
  record('SC-04 handleSprintAction(action,args,deps) + 16 VALID_ACTIONS', sc04);
  await record('SC-05 4-layer end-to-end chain (init → status → list)', sc05);
  record('SC-06 ACTION_TYPES enum 20 entries (incl sprint_paused/resumed/master_plan_created/task_created)', sc06);
  record('SC-07 SPRINT_AUTORUN_SCOPE inline ↔ lib/control mirror (5 levels)', sc07);
  record('SC-08 hooks.json 21 events 24 blocks invariant', sc08);
  await record('SC-09 master-plan 4-layer chain (handler → state + markdown + audit)', sc09);
  record('SC-10 context-sizer pure function contract (5 assertions)', sc10);
  record('SC-11 Sprint 2 quality-gates logic invariant (v2.1.16 evolution, Issue #92)', sc11);
  console.log('\n=== L3 Contract: ' + passed + '/' + (passed + failed) + ' PASS ===');
  if (failed > 0) {
    console.error('\n❌ ' + failed + ' contract(s) FAILED — cross-sprint drift detected.');
    process.exit(1);
  }
})().catch(e => { console.error(e); process.exit(1); });
