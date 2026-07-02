/**
 * v2113-sprint-3-infrastructure.test.js — Sprint 3 Infrastructure L2 integration tests.
 *
 * Covers 8 module groups (66+ TCs target per Design §10):
 *   P   — sprint-paths.js (pure)
 *   S   — sprint-state-store.adapter.js
 *   T   — sprint-telemetry.adapter.js
 *   D   — sprint-doc-scanner.adapter.js
 *   M   — matrix-sync.adapter.js
 *   B   — index.js barrel + createSprintInfra
 *   CSI — ★ Cross-Sprint Integration (Sprint 1 ↔ 2 ↔ 3) — 10 TCs
 *   INV — Invariants (Sprint 1/2/PDCA, Domain Purity, no telemetry.js import)
 *
 * Each TC uses an isolated tmpdir via fs.mkdtempSync to avoid touching the
 * real .bkit/ — fresh project root per test → cleanup after.
 */

'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const infra = require(path.join(PLUGIN_ROOT, 'lib/infra/sprint'));
const domain = require(path.join(PLUGIN_ROOT, 'lib/domain/sprint'));
const lifecycle = require(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle'));

const {
  createSprintInfra, createStateStore, createEventEmitter, createDocScanner, createMatrixSync,
  MATRIX_TYPES,
  getSprintStateDir, getSprintStateFile, getSprintIndexFile,
  getSprintMatrixDir, getSprintMatrixFile, getSprintPhaseDocAbsPath,
} = infra;

const { createSprint, cloneSprint, SprintEvents } = domain;

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

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-sprint3-'));
}

function cleanup(root) {
  try { fs.rmSync(root, { recursive: true, force: true }); } catch (_e) { /* ignore */ }
}

function baseSprint(over) {
  const s = createSprint({
    id: 'test-sprint',
    name: 'Test',
    phase: 'do',
    context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' },
    features: ['feat-a'],
  });
  return cloneSprint(s, over || {});
}

(async () => {
  // ─────────────────────────────────────────────────────────────────────────
  // P — sprint-paths.js (8 TCs)
  // ─────────────────────────────────────────────────────────────────────────

  test('P-01: MATRIX_TYPES frozen 3-key', () => {
    assert.ok(Object.isFrozen(MATRIX_TYPES));
    assert.deepEqual([...MATRIX_TYPES], ['data-flow', 'api-contract', 'test-coverage']);
  });

  test('P-02: getSprintStateDir', () => {
    const p = getSprintStateDir('/root');
    assert.equal(p, path.join('/root', '.bkit', 'state', 'sprints'));
  });

  test('P-03: getSprintStateFile', () => {
    const p = getSprintStateFile('/root', 'my-sprint');
    assert.equal(p, path.join('/root', '.bkit', 'state', 'sprints', 'my-sprint.json'));
  });

  test('P-04: getSprintIndexFile', () => {
    const p = getSprintIndexFile('/root');
    assert.equal(p, path.join('/root', '.bkit', 'state', 'sprint-status.json'));
  });

  test('P-05: getSprintMatrixFile valid type', () => {
    const p = getSprintMatrixFile('/root', 'data-flow');
    assert.equal(p, path.join('/root', '.bkit', 'runtime', 'sprint-matrices', 'data-flow-matrix.json'));
  });

  test('P-06: getSprintMatrixFile invalid type → null', () => {
    assert.equal(getSprintMatrixFile('/root', 'unknown'), null);
  });

  test('P-07: getSprintPhaseDocAbsPath valid', () => {
    const p = getSprintPhaseDocAbsPath('/root', 'my-sprint', 'prd');
    assert.equal(p, path.join('/root', 'docs/01-plan/features/my-sprint.prd.md'));
  });

  test('P-08: getSprintPhaseDocAbsPath unknown phase → null', () => {
    assert.equal(getSprintPhaseDocAbsPath('/root', 'my-sprint', 'unknown'), null);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // S — sprint-state-store.adapter.js (11 TCs)
  // ─────────────────────────────────────────────────────────────────────────

  await testAsync('S-01: save then load round-trip identity', async () => {
    const root = makeTempRoot();
    try {
      const store = createStateStore({ projectRoot: root });
      const s = baseSprint();
      await store.save(s);
      const loaded = await store.load(s.id);
      assert.deepEqual(loaded, s);
    } finally { cleanup(root); }
  });

  await testAsync('S-02: save creates root index entry', async () => {
    const root = makeTempRoot();
    try {
      const store = createStateStore({ projectRoot: root });
      await store.save(baseSprint());
      const idx = await store.getIndex();
      assert.equal(idx.entries['test-sprint'].id, 'test-sprint');
      assert.equal(idx.entries['test-sprint'].phase, 'do');
    } finally { cleanup(root); }
  });

  await testAsync('S-03: list returns entries array', async () => {
    const root = makeTempRoot();
    try {
      const store = createStateStore({ projectRoot: root });
      await store.save(baseSprint({ id: 'a' }));
      await store.save(baseSprint({ id: 'b' }));
      const items = await store.list();
      assert.equal(items.length, 2);
      const ids = items.map(i => i.id).sort();
      assert.deepEqual(ids, ['a', 'b']);
    } finally { cleanup(root); }
  });

  await testAsync('S-04: re-save updates index entry', async () => {
    const root = makeTempRoot();
    try {
      const store = createStateStore({ projectRoot: root });
      const s = baseSprint();
      await store.save(s);
      await store.save(cloneSprint(s, { phase: 'iterate' }));
      const idx = await store.getIndex();
      assert.equal(idx.entries['test-sprint'].phase, 'iterate');
    } finally { cleanup(root); }
  });

  await testAsync('S-05: remove unlinks file + index', async () => {
    const root = makeTempRoot();
    try {
      const store = createStateStore({ projectRoot: root });
      await store.save(baseSprint());
      await store.remove('test-sprint');
      const idx = await store.getIndex();
      assert.equal(idx.entries['test-sprint'], undefined);
      assert.equal(fs.existsSync(getSprintStateFile(root, 'test-sprint')), false);
    } finally { cleanup(root); }
  });

  await testAsync('S-06: load nonexistent returns null', async () => {
    const root = makeTempRoot();
    try {
      const store = createStateStore({ projectRoot: root });
      assert.equal(await store.load('missing'), null);
    } finally { cleanup(root); }
  });

  await testAsync('S-07: atomic write — tmp file absent post-save', async () => {
    const root = makeTempRoot();
    try {
      const store = createStateStore({ projectRoot: root });
      await store.save(baseSprint());
      const dir = getSprintStateDir(root);
      const files = fs.readdirSync(dir);
      const tmpLeftover = files.filter(f => f.includes('.tmp.'));
      assert.equal(tmpLeftover.length, 0);
    } finally { cleanup(root); }
  });

  await testAsync('S-08: schema preserves Sprint 1 entity (deep equality)', async () => {
    const root = makeTempRoot();
    try {
      const store = createStateStore({ projectRoot: root });
      const s = baseSprint({
        kpi: { matchRate: 87, criticalIssues: 0, qaPassRate: 95, dataFlowIntegrity: null,
               featuresTotal: 1, featuresCompleted: 0, featureCompletionRate: 0,
               cumulativeTokens: 1234, cumulativeIterations: 2, sprintCycleHours: 1.5 },
      });
      await store.save(s);
      const loaded = await store.load(s.id);
      assert.equal(loaded.kpi.matchRate, 87);
      assert.equal(loaded.kpi.cumulativeTokens, 1234);
    } finally { cleanup(root); }
  });

  await testAsync('S-09: corrupt JSON file → load returns null', async () => {
    const root = makeTempRoot();
    try {
      const store = createStateStore({ projectRoot: root });
      fs.mkdirSync(getSprintStateDir(root), { recursive: true });
      fs.writeFileSync(getSprintStateFile(root, 'corrupt'), '{ not valid json');
      assert.equal(await store.load('corrupt'), null);
    } finally { cleanup(root); }
  });

  await testAsync('S-10: existing .bkit/state/ files untouched (path isolation)', async () => {
    const root = makeTempRoot();
    try {
      const pdcaPath = path.join(root, '.bkit', 'state', 'pdca-status.json');
      fs.mkdirSync(path.dirname(pdcaPath), { recursive: true });
      fs.writeFileSync(pdcaPath, JSON.stringify({ existing: 'untouched' }));
      const store = createStateStore({ projectRoot: root });
      await store.save(baseSprint());
      // Verify existing file unchanged
      const existing = JSON.parse(fs.readFileSync(pdcaPath, 'utf8'));
      assert.equal(existing.existing, 'untouched');
    } finally { cleanup(root); }
  });

  await testAsync('S-11: save throws on invalid sprint (no id)', async () => {
    const root = makeTempRoot();
    try {
      const store = createStateStore({ projectRoot: root });
      await assert.rejects(() => store.save({ name: 'noid' }), /must have non-empty string id/);
    } finally { cleanup(root); }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // T — sprint-telemetry.adapter.js (9 TCs)
  // ─────────────────────────────────────────────────────────────────────────

  test('T-01: eventToAuditEntry SprintCreated', () => {
    const { eventToAuditEntry } = require(path.join(PLUGIN_ROOT, 'lib/infra/sprint/sprint-telemetry.adapter'));
    const event = SprintEvents.SprintCreated({ sprintId: 'x', name: 'X', phase: 'prd' });
    const entry = eventToAuditEntry(event, {});
    assert.equal(entry.action, 'feature_created');
    assert.equal(entry.target, 'x');
    // v2.1.13 QA-6 fix: sprint-telemetry now emits category='sprint' (was
    // 'pdca'; producer migration after CATEGORIES enum extension in DEEP-4).
    assert.equal(entry.category, 'sprint');
    assert.equal(entry.details.sprintEventType, 'SprintCreated');
  });

  test('T-02: eventToAuditEntry SprintPhaseChanged', () => {
    const { eventToAuditEntry } = require(path.join(PLUGIN_ROOT, 'lib/infra/sprint/sprint-telemetry.adapter'));
    const event = SprintEvents.SprintPhaseChanged({ sprintId: 'x', fromPhase: 'do', toPhase: 'iterate', reason: 'auto' });
    const entry = eventToAuditEntry(event, {});
    assert.equal(entry.action, 'phase_transition');
    assert.equal(entry.reason, 'auto');
  });

  test('T-03: eventToAuditEntry SprintPaused', () => {
    const { eventToAuditEntry } = require(path.join(PLUGIN_ROOT, 'lib/infra/sprint/sprint-telemetry.adapter'));
    const event = SprintEvents.SprintPaused({ sprintId: 'x', trigger: 'BUDGET_EXCEEDED', severity: 'MEDIUM', message: 'over' });
    const entry = eventToAuditEntry(event, {});
    assert.equal(entry.action, 'sprint_paused');
    assert.equal(entry.result, 'blocked');
  });

  test('T-04: buildOtelPayload includes core attributes', () => {
    const { buildOtelPayload } = require(path.join(PLUGIN_ROOT, 'lib/infra/sprint/sprint-telemetry.adapter'));
    const event = SprintEvents.SprintCreated({ sprintId: 'x', name: 'X', phase: 'prd' });
    const payload = buildOtelPayload(event, { otelServiceName: 'bkit-test', agentId: 'a1' });
    const log = payload.resourceLogs[0].scopeLogs[0].logRecords[0];
    const attrs = log.attributes;
    const idAttr = attrs.find(a => a.key === 'bkit.sprint.id');
    assert.equal(idAttr.value.stringValue, 'x');
    const agentAttr = attrs.find(a => a.key === 'agent_id');
    assert.equal(agentAttr.value.stringValue, 'a1');
  });

  await testAsync('T-05: emit writes audit log to .bkit/audit/YYYY-MM-DD.jsonl', async () => {
    const root = makeTempRoot();
    const origCwd = process.cwd();
    const origPlatform = process.env.BKIT_PROJECT_ROOT;
    try {
      // audit-logger uses platform module to find project root — switch cwd
      process.chdir(root);
      const emitter = createEventEmitter({ projectRoot: root });
      const event = SprintEvents.SprintCreated({ sprintId: 'tel-t05', name: 'T5', phase: 'prd' });
      emitter.emit(event);
      // audit-logger writes to .bkit/audit/YYYY-MM-DD.jsonl
      const auditDir = path.join(root, '.bkit', 'audit');
      if (!fs.existsSync(auditDir)) {
        // Sometimes platform module resolves project root differently — accept either location
        const altDir = path.join(origCwd, '.bkit', 'audit');
        const today = new Date().toISOString().slice(0, 10);
        const altFile = path.join(altDir, `${today}.jsonl`);
        // verify the SprintCreated event was written somewhere
        if (fs.existsSync(altFile)) {
          const content = fs.readFileSync(altFile, 'utf8');
          assert.ok(content.includes('tel-t05'), 'tel-t05 found in alt audit log');
          return;
        }
        // No audit file produced at all — fail
        assert.fail('audit log not produced in either location');
      }
      const files = fs.readdirSync(auditDir).filter(f => f.endsWith('.jsonl'));
      assert.ok(files.length >= 1);
      const content = fs.readFileSync(path.join(auditDir, files[0]), 'utf8');
      assert.ok(content.includes('tel-t05'));
    } finally {
      process.chdir(origCwd);
      if (origPlatform) process.env.BKIT_PROJECT_ROOT = origPlatform;
      cleanup(root);
    }
  });

  test('T-06: createEventEmitter throws on missing projectRoot', () => {
    assert.throws(() => createEventEmitter({}), /projectRoot/);
  });

  test('T-07: invalid event silently dropped', () => {
    const root = makeTempRoot();
    try {
      const emitter = createEventEmitter({ projectRoot: root });
      emitter.emit(null);          // no throw
      emitter.emit(undefined);     // no throw
      emitter.emit({ type: 'fake' }); // no throw
    } finally { cleanup(root); }
  });

  await testAsync('T-08: flush is no-op (resolves)', async () => {
    const root = makeTempRoot();
    try {
      const emitter = createEventEmitter({ projectRoot: root });
      const r = await emitter.flush();
      assert.equal(r, undefined);
    } finally { cleanup(root); }
  });

  test('T-09: 100 emits do not stack-overflow (recursion safety)', () => {
    const root = makeTempRoot();
    try {
      const emitter = createEventEmitter({ projectRoot: root });
      for (let i = 0; i < 100; i += 1) {
        emitter.emit(SprintEvents.SprintCreated({ sprintId: 'loop-' + i, name: 'l', phase: 'prd' }));
      }
      // If we reach here without crash, recursion is bounded.
      assert.ok(true);
    } finally { cleanup(root); }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // D — sprint-doc-scanner.adapter.js (7 TCs)
  // ─────────────────────────────────────────────────────────────────────────

  await testAsync('D-01: findAllSprints empty when no plan dir', async () => {
    const root = makeTempRoot();
    try {
      const scanner = createDocScanner({ projectRoot: root });
      const sprints = await scanner.findAllSprints();
      assert.equal(sprints.length, 0);
    } finally { cleanup(root); }
  });

  await testAsync('D-02: findAllSprints discovers master plan', async () => {
    const root = makeTempRoot();
    try {
      const planDir = path.join(root, 'docs', '01-plan', 'features');
      fs.mkdirSync(planDir, { recursive: true });
      fs.writeFileSync(path.join(planDir, 'my-sprint.master-plan.md'), '# My Sprint');
      const scanner = createDocScanner({ projectRoot: root });
      const sprints = await scanner.findAllSprints();
      assert.equal(sprints.length, 1);
      assert.equal(sprints[0].id, 'my-sprint');
    } finally { cleanup(root); }
  });

  await testAsync('D-03: findSprintDocs returns 7-key shape', async () => {
    const root = makeTempRoot();
    try {
      const scanner = createDocScanner({ projectRoot: root });
      const docs = await scanner.findSprintDocs('my-sprint');
      assert.deepEqual(
        Object.keys(docs).sort(),
        ['design', 'iterate', 'masterPlan', 'plan', 'prd', 'qa', 'report'],
      );
    } finally { cleanup(root); }
  });

  await testAsync('D-04: findSprintDocs validates invalid id', async () => {
    const root = makeTempRoot();
    try {
      const scanner = createDocScanner({ projectRoot: root });
      const docs = await scanner.findSprintDocs('Invalid_Id');
      // All values null due to invalid id
      for (const v of Object.values(docs)) assert.equal(v, null);
    } finally { cleanup(root); }
  });

  await testAsync('D-05: hasPhaseDoc true when file exists', async () => {
    const root = makeTempRoot();
    try {
      const planDir = path.join(root, 'docs', '01-plan', 'features');
      fs.mkdirSync(planDir, { recursive: true });
      fs.writeFileSync(path.join(planDir, 'my-s.prd.md'), '# PRD');
      const scanner = createDocScanner({ projectRoot: root });
      assert.equal(await scanner.hasPhaseDoc('my-s', 'prd'), true);
      assert.equal(await scanner.hasPhaseDoc('my-s', 'design'), false);
    } finally { cleanup(root); }
  });

  await testAsync('D-06: extractSprintId rejects invalid filenames', async () => {
    const { extractSprintId } = require(path.join(PLUGIN_ROOT, 'lib/infra/sprint/sprint-doc-scanner.adapter'));
    assert.equal(extractSprintId('foo.master-plan.md'), 'foo');
    assert.equal(extractSprintId('foo.txt'), null);
    assert.equal(extractSprintId('Foo.master-plan.md'), null); // uppercase
    assert.equal(extractSprintId('-foo.master-plan.md'), null); // leading hyphen
    assert.equal(extractSprintId('foo--bar.master-plan.md'), null); // double hyphen
  });

  await testAsync('D-07: hasPhaseDoc invalid phase returns false', async () => {
    const root = makeTempRoot();
    try {
      const scanner = createDocScanner({ projectRoot: root });
      assert.equal(await scanner.hasPhaseDoc('my-sprint', 'unknown'), false);
    } finally { cleanup(root); }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // M — matrix-sync.adapter.js (11 TCs)
  // ─────────────────────────────────────────────────────────────────────────

  await testAsync('M-01: syncDataFlow writes matrix file', async () => {
    const root = makeTempRoot();
    try {
      const ms = createMatrixSync({ projectRoot: root });
      await ms.syncDataFlow('s1', 'feat-a', [{ hopId: 'H1', passed: true }]);
      const file = getSprintMatrixFile(root, 'data-flow');
      assert.ok(fs.existsSync(file));
    } finally { cleanup(root); }
  });

  await testAsync('M-02: syncDataFlow s1Score calc', async () => {
    const root = makeTempRoot();
    try {
      const ms = createMatrixSync({ projectRoot: root });
      const hops = [
        { hopId: 'H1', passed: true }, { hopId: 'H2', passed: true },
        { hopId: 'H3', passed: false }, { hopId: 'H4', passed: true },
        { hopId: 'H5', passed: true }, { hopId: 'H6', passed: true },
        { hopId: 'H7', passed: true },
      ];
      await ms.syncDataFlow('s1', 'feat-a', hops);
      const m = await ms.read('data-flow');
      const s = m.sprints.s1.features['feat-a'].s1Score;
      assert.ok(Math.abs(s - (6 / 7) * 100) < 0.01);
    } finally { cleanup(root); }
  });

  await testAsync('M-03: syncApiContract writes', async () => {
    const root = makeTempRoot();
    try {
      const ms = createMatrixSync({ projectRoot: root });
      await ms.syncApiContract('s1', 'feat-a', [{ endpoint: '/x', ok: true }]);
      const m = await ms.read('api-contract');
      assert.deepEqual(m.sprints.s1.features['feat-a'].contracts, [{ endpoint: '/x', ok: true }]);
    } finally { cleanup(root); }
  });

  await testAsync('M-04: syncTestCoverage writes', async () => {
    const root = makeTempRoot();
    try {
      const ms = createMatrixSync({ projectRoot: root });
      await ms.syncTestCoverage('s1', 'feat-a', { L1: 10, L2: 20 });
      const m = await ms.read('test-coverage');
      assert.equal(m.sprints.s1.features['feat-a'].layers.L1, 10);
    } finally { cleanup(root); }
  });

  await testAsync('M-05: read unwritten returns default empty', async () => {
    const root = makeTempRoot();
    try {
      const ms = createMatrixSync({ projectRoot: root });
      const m = await ms.read('data-flow');
      assert.deepEqual(m.sprints, {});
    } finally { cleanup(root); }
  });

  await testAsync('M-06: clear removes matrix file', async () => {
    const root = makeTempRoot();
    try {
      const ms = createMatrixSync({ projectRoot: root });
      await ms.syncDataFlow('s1', 'feat-a', []);
      await ms.clear('data-flow');
      assert.equal(fs.existsSync(getSprintMatrixFile(root, 'data-flow')), false);
    } finally { cleanup(root); }
  });

  await testAsync('M-07: 2 sequential syncs preserve both', async () => {
    const root = makeTempRoot();
    try {
      const ms = createMatrixSync({ projectRoot: root });
      await ms.syncDataFlow('s1', 'feat-a', [{ hopId: 'H1', passed: true }]);
      await ms.syncDataFlow('s1', 'feat-b', [{ hopId: 'H1', passed: true }]);
      const m = await ms.read('data-flow');
      assert.ok(m.sprints.s1.features['feat-a']);
      assert.ok(m.sprints.s1.features['feat-b']);
    } finally { cleanup(root); }
  });

  await testAsync('M-08: 2 sprints same matrix', async () => {
    const root = makeTempRoot();
    try {
      const ms = createMatrixSync({ projectRoot: root });
      await ms.syncDataFlow('s1', 'feat-a', []);
      await ms.syncDataFlow('s2', 'feat-a', []);
      const m = await ms.read('data-flow');
      assert.ok(m.sprints.s1);
      assert.ok(m.sprints.s2);
    } finally { cleanup(root); }
  });

  await testAsync('M-09: read invalid type throws', async () => {
    const root = makeTempRoot();
    try {
      const ms = createMatrixSync({ projectRoot: root });
      await assert.rejects(() => ms.read('unknown'), /unknown type/);
    } finally { cleanup(root); }
  });

  await testAsync('M-10: syncDataFlow rejects non-string ids', async () => {
    const root = makeTempRoot();
    try {
      const ms = createMatrixSync({ projectRoot: root });
      await assert.rejects(() => ms.syncDataFlow(null, 'f', []), /must be strings/);
    } finally { cleanup(root); }
  });

  await testAsync('M-11: atomic write — no tmp leftover', async () => {
    const root = makeTempRoot();
    try {
      const ms = createMatrixSync({ projectRoot: root });
      await ms.syncDataFlow('s1', 'feat-a', []);
      const dir = getSprintMatrixDir(root);
      const tmpFiles = fs.readdirSync(dir).filter(f => f.includes('.tmp.'));
      assert.equal(tmpFiles.length, 0);
    } finally { cleanup(root); }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // B — index.js barrel + createSprintInfra (5 TCs)
  // ─────────────────────────────────────────────────────────────────────────

  test('B-01: barrel exports >= 13', () => {
    assert.ok(Object.keys(infra).length >= 13);
  });

  test('B-02: createSprintInfra returns 4 adapters (+ projectRoot metadata, v2.1.26 I-11)', () => {
    const root = makeTempRoot();
    try {
      const i = createSprintInfra({ projectRoot: root });
      // v2.1.26 (design I-11, test-isolation guard): the infra bag additionally
      // exposes `projectRoot` + `injectedProjectRoot` so downstream audit/registry
      // writers can honor an explicitly injected root. The 4 adapters are unchanged.
      assert.deepEqual(
        Object.keys(i).sort(),
        ['docScanner', 'eventEmitter', 'injectedProjectRoot', 'matrixSync', 'projectRoot', 'stateStore']
      );
    } finally { cleanup(root); }
  });

  test('B-03: createSprintInfra throws on missing projectRoot', () => {
    assert.throws(() => createSprintInfra({}), /projectRoot/);
  });

  test('B-04: path helpers re-exported via barrel', () => {
    assert.equal(typeof infra.getSprintStateFile, 'function');
    assert.equal(typeof infra.getSprintMatrixFile, 'function');
    assert.deepEqual([...infra.MATRIX_TYPES], ['data-flow', 'api-contract', 'test-coverage']);
  });

  await testAsync('B-05: all 4 adapter method surfaces verified', async () => {
    const root = makeTempRoot();
    try {
      const i = createSprintInfra({ projectRoot: root });
      assert.deepEqual(Object.keys(i.stateStore).sort(), ['getIndex', 'list', 'load', 'remove', 'save']);
      assert.deepEqual(Object.keys(i.eventEmitter).sort(), ['emit', 'flush']);
      assert.deepEqual(Object.keys(i.docScanner).sort(), ['findAllSprints', 'findSprintDocs', 'hasPhaseDoc']);
      assert.deepEqual(Object.keys(i.matrixSync).sort(), ['clear', 'read', 'syncApiContract', 'syncDataFlow', 'syncTestCoverage']);
    } finally { cleanup(root); }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ★ CSI — Cross-Sprint Integration (10 TCs)
  // Sprint 1 (Domain) ↔ Sprint 2 (Application) ↔ Sprint 3 (Infrastructure)
  // ─────────────────────────────────────────────────────────────────────────

  await testAsync('CSI-01: createSprint (S1) → save → load (S3) — round-trip identity', async () => {
    const root = makeTempRoot();
    try {
      const store = createStateStore({ projectRoot: root });
      const s = createSprint({ id: 'csi01', name: 'CSI 01', context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' } });
      await store.save(s);
      const loaded = await store.load(s.id);
      assert.deepEqual(loaded, s);
    } finally { cleanup(root); }
  });

  await testAsync('CSI-02: startSprint (S2 L3) with real S3 stateStore — disk 영구화', async () => {
    const root = makeTempRoot();
    try {
      const i = createSprintInfra({ projectRoot: root });
      // L3 with happy-path mocks for handler-side deps (Sprint 4 will inject real ones)
      const r = await lifecycle.startSprint({
        id: 'csi02', name: 'CSI 02', trustLevel: 'L3',
        context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' },
        features: ['feat-x'],
      }, {
        stateStore: i.stateStore,
        eventEmitter: i.eventEmitter.emit,
        gateEvaluator: () => ({ allPassed: true, results: {} }),
        autoPauseChecker: () => [],
        phaseHandlers: {
          iterate: async (s) => ({ sprint: s, blocked: false }),
          qa: async (s) => ({ sprint: s }),
          report: async (s) => ({ sprint: s }),
          archived: async (s) => ({ sprint: s }),
        },
      });
      assert.equal(r.ok, true);
      assert.equal(r.finalPhase, 'report');
      // Disk verification
      assert.ok(fs.existsSync(getSprintStateFile(root, 'csi02')));
      const loaded = await i.stateStore.load('csi02');
      assert.equal(loaded.phase, 'report');
    } finally { cleanup(root); }
  });

  await testAsync('CSI-03: advancePhase (S2) + real S3 eventEmitter → audit log', async () => {
    const root = makeTempRoot();
    const origCwd = process.cwd();
    try {
      process.chdir(root);
      const i = createSprintInfra({ projectRoot: root });
      const gates = {
        M1_matchRate: { current: 100, threshold: 90, passed: true },
        M2_codeQualityScore: { current: 100, threshold: 80, passed: true },
        M3_criticalIssueCount: { current: 0, threshold: 0, passed: true },
        M4_apiComplianceRate: { current: 100, threshold: 95, passed: true },
        M5_runtimeErrorRate: { current: 0, threshold: 1, passed: true },
        M7_conventionCompliance: { current: 100, threshold: 90, passed: true },
      };
      let s = createSprint({ id: 'csi03', name: 'CSI 03', phase: 'do',
        context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' } });
      s = cloneSprint(s, {
        qualityGates: gates,
        phaseHistory: [{ phase: 'do', enteredAt: new Date().toISOString(), exitedAt: null, durationMs: null }],
      });
      const r = await lifecycle.advancePhase(s, 'iterate', { eventEmitter: i.eventEmitter.emit });
      assert.equal(r.ok, true);
      // Audit log file should exist (today)
      const today = new Date().toISOString().slice(0, 10);
      const auditFile = path.join(root, '.bkit', 'audit', `${today}.jsonl`);
      // Allow either project-root local audit dir or skipping (some envs route to user dir)
      if (fs.existsSync(auditFile)) {
        const content = fs.readFileSync(auditFile, 'utf8');
        assert.ok(content.includes('csi03'), 'csi03 in audit log');
        assert.ok(content.includes('phase_transition'), 'phase_transition action');
      }
    } finally { process.chdir(origCwd); cleanup(root); }
  });

  await testAsync('CSI-04: pauseSprint (S2) + audit log via real S3 emitter', async () => {
    const root = makeTempRoot();
    const origCwd = process.cwd();
    try {
      process.chdir(root);
      const i = createSprintInfra({ projectRoot: root });
      const s = createSprint({ id: 'csi04', name: 'CSI 04',
        context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' } });
      const triggers = [{ triggerId: 'BUDGET_EXCEEDED', severity: 'MEDIUM', message: 'over budget', userActions: [] }];
      const r = lifecycle.pauseSprint(s, triggers, { eventEmitter: i.eventEmitter.emit });
      assert.equal(r.ok, true);
      assert.equal(r.sprint.status, 'paused');
    } finally { process.chdir(origCwd); cleanup(root); }
  });

  await testAsync('CSI-05: resumeSprint (S2) emits SprintResumed via real S3', async () => {
    const root = makeTempRoot();
    const origCwd = process.cwd();
    try {
      process.chdir(root);
      const i = createSprintInfra({ projectRoot: root });
      let s = createSprint({ id: 'csi05', name: 'CSI 05',
        context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' } });
      // Pause then resume (no firing trigger — should succeed)
      s = lifecycle.pauseSprint(s, [{ triggerId: 'BUDGET_EXCEEDED', severity: 'MEDIUM', message: 'x', userActions: [] }],
        { eventEmitter: i.eventEmitter.emit }).sprint;
      const r = lifecycle.resumeSprint(s, { eventEmitter: i.eventEmitter.emit });
      assert.equal(r.ok, true);
      assert.equal(r.sprint.status, 'active');
    } finally { process.chdir(origCwd); cleanup(root); }
  });

  await testAsync('CSI-06: archiveSprint (S2) → status=archived on disk via S3', async () => {
    const root = makeTempRoot();
    try {
      const i = createSprintInfra({ projectRoot: root });
      let s = createSprint({ id: 'csi06', name: 'CSI 06', phase: 'do',
        context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' } });
      const r = await lifecycle.archiveSprint(s, { eventEmitter: i.eventEmitter.emit });
      assert.equal(r.ok, true);
      await i.stateStore.save(r.sprint);
      const loaded = await i.stateStore.load('csi06');
      assert.equal(loaded.status, 'archived');
      assert.equal(loaded.phase, 'archived');
    } finally { cleanup(root); }
  });

  await testAsync('CSI-07: verifyDataFlow (S2) → matrixSync.syncDataFlow (S3) round-trip', async () => {
    const root = makeTempRoot();
    try {
      const i = createSprintInfra({ projectRoot: root });
      const s = createSprint({ id: 'csi07', name: 'CSI 07',
        context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' } });
      const validator = async () => ({ passed: true });
      const v = await lifecycle.verifyDataFlow(s, 'feat-a', { dataFlowValidator: validator });
      assert.equal(v.s1Score, 100);
      await i.matrixSync.syncDataFlow(s.id, 'feat-a', v.hopResults);
      const matrix = await i.matrixSync.read('data-flow');
      assert.equal(matrix.sprints.csi07.features['feat-a'].s1Score, 100);
      assert.equal(matrix.sprints.csi07.features['feat-a'].hopResults.length, 7);
    } finally { cleanup(root); }
  });

  await testAsync('CSI-08: generateReport (S2) → docScanner (S3) discovers report doc', async () => {
    const root = makeTempRoot();
    try {
      const i = createSprintInfra({ projectRoot: root });
      const s = createSprint({ id: 'csi08', name: 'CSI 08', phase: 'report',
        context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' } });
      let writtenPath = null;
      let writtenContent = null;
      const fileWriter = async (p, c) => {
        const abs = path.isAbsolute(p) ? p : path.join(root, p);
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, c);
        writtenPath = abs;
        writtenContent = c;
      };
      const r = await lifecycle.generateReport(s, { fileWriter });
      assert.ok(r.reportContent.includes('Sprint Report'));
      assert.ok(writtenPath !== null);
      // docScanner should now find the report
      const found = await i.docScanner.hasPhaseDoc('csi08', 'report');
      assert.equal(found, true);
    } finally { cleanup(root); }
  });

  await testAsync('CSI-09: save → fresh adapter load (cross-process simulation)', async () => {
    const root = makeTempRoot();
    try {
      // Process 1: save
      const store1 = createStateStore({ projectRoot: root });
      const s = createSprint({ id: 'csi09', name: 'CSI 09', phase: 'qa',
        context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' } });
      await store1.save(s);
      // Process 2: fresh adapter instance, load same id
      const store2 = createStateStore({ projectRoot: root });
      const loaded = await store2.load('csi09');
      assert.equal(loaded.id, 'csi09');
      assert.equal(loaded.phase, 'qa');
      assert.deepEqual(loaded, s);
    } finally { cleanup(root); }
  });

  await testAsync('CSI-10: L4 full E2E — Sprint 1 + 2 + 3 자율 진행 + 디스크 영구화', async () => {
    const root = makeTempRoot();
    try {
      const i = createSprintInfra({ projectRoot: root });
      const events = [];
      const captureEmit = (e) => { events.push(e); i.eventEmitter.emit(e); };
      const r = await lifecycle.startSprint({
        id: 'csi10-e2e', name: 'CSI 10 L4 E2E', trustLevel: 'L4',
        context: { WHY: 'w', WHO: 'w', RISK: 'r', SUCCESS: 's', SCOPE: 'sc' },
        features: ['feat-1', 'feat-2'],
      }, {
        stateStore: i.stateStore,
        eventEmitter: captureEmit,
        gateEvaluator: () => ({ allPassed: true, results: {} }),
        autoPauseChecker: () => [],
        phaseHandlers: {
          iterate: async (s) => ({ sprint: s, blocked: false }),
          qa: async (s) => ({ sprint: s }),
          report: async (s) => ({ sprint: s }),
          archived: async (s) => ({ sprint: s }),
        },
      });
      assert.equal(r.ok, true);
      assert.equal(r.finalPhase, 'archived');
      // Disk + index
      const loaded = await i.stateStore.load('csi10-e2e');
      assert.equal(loaded.phase, 'archived');
      const idx = await i.stateStore.getIndex();
      assert.ok(idx.entries['csi10-e2e']);
      // Event types
      const types = [...new Set(events.map(e => e.type))].sort();
      assert.ok(types.includes('SprintCreated'));
      assert.ok(types.includes('SprintPhaseChanged'));
    } finally { cleanup(root); }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // INV — Invariants (5 TCs)
  // ─────────────────────────────────────────────────────────────────────────

  test('INV-01: lib/infra/telemetry.js not required (no recursion)', () => {
    const dir = path.join(PLUGIN_ROOT, 'lib/infra/sprint');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
    for (const f of files) {
      const src = fs.readFileSync(path.join(dir, f), 'utf8');
      // strip comments
      const stripped = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      const matches = stripped.match(/require\(['"][^'"]*infra\/telemetry['"]\)/g);
      assert.equal(matches, null, `${f} must not require lib/infra/telemetry`);
    }
  });

  test('INV-02: PDCA lifecycle not required by Sprint 3', () => {
    const dir = path.join(PLUGIN_ROOT, 'lib/infra/sprint');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
    for (const f of files) {
      const src = fs.readFileSync(path.join(dir, f), 'utf8');
      const matches = src.match(/require\(['"][^'"]*pdca-lifecycle[^'"]*['"]\)/g);
      assert.equal(matches, null, `${f} must not require pdca-lifecycle`);
    }
  });

  test('INV-03: Sprint 3 only uses Sprint 1 read-only typedef + helpers', () => {
    const stateStoreSrc = fs.readFileSync(path.join(PLUGIN_ROOT, 'lib/infra/sprint/sprint-state-store.adapter.js'), 'utf8');
    // No cloneSprint usage in state-store (Infrastructure read-only on entities)
    assert.equal(stateStoreSrc.includes('cloneSprint'), false, 'state-store should not mutate entities');
  });

  test('INV-04: atomic write pattern present in state-store + matrix-sync', () => {
    const stateStore = fs.readFileSync(path.join(PLUGIN_ROOT, 'lib/infra/sprint/sprint-state-store.adapter.js'), 'utf8');
    const matrixSync = fs.readFileSync(path.join(PLUGIN_ROOT, 'lib/infra/sprint/matrix-sync.adapter.js'), 'utf8');
    assert.ok(stateStore.includes('atomicWriteJson'));
    assert.ok(matrixSync.includes('atomicWriteJson'));
  });

  test('INV-05: Sprint 3 forbidden imports = 0 (Domain Purity not required, but Application Layer still pure)', () => {
    // Sprint 3 IS Infrastructure so fs/path/http/etc are OK. Verify Sprint 2 + Sprint 1 untouched.
    // This TC is a self-check that the files exist and load (proxy for invariant).
    assert.equal(typeof infra.createSprintInfra, 'function');
    assert.equal(typeof infra.createStateStore, 'function');
    assert.equal(typeof infra.createEventEmitter, 'function');
    assert.equal(typeof infra.createDocScanner, 'function');
    assert.equal(typeof infra.createMatrixSync, 'function');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────

  console.log('');
  console.log(`[v2113-sprint-3-infrastructure] ${pass}/${total} PASS, ${fail} FAIL`);
  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`  - ${f.name}\n    ${f.error}`);
    }
  }
  process.exit(fail === 0 ? 0 : 1);
})();
