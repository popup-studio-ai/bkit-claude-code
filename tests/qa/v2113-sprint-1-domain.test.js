#!/usr/bin/env node
/**
 * bkit v2.1.13 — Sprint 1 Domain Foundation verification suite.
 *
 * Sprint 1 covers 7 files:
 *   Application Layer (3): lib/application/sprint-lifecycle/{phases,transitions,index}.js
 *   Domain Layer (4):      lib/domain/sprint/{entity,validators,events,index}.js
 *
 * L1 unit (13 core + 5 extra = 18 TC):
 *   - Object.freeze immutability (3 TC: SPRINT_PHASES, SPRINT_PHASE_ORDER, SPRINT_TRANSITIONS nested)
 *   - canTransitionSprint { ok, reason } shape (1 composite + 12 cases)
 *   - legalNextSprintPhases mutable copy (1 TC)
 *   - createSprint factory + defaults (1 TC)
 *   - isValidSprintName edge cases (1 composite + 10 cases)
 *   - isValidSprintContext (1 TC)
 *   - sprintPhaseDocPath mapping (1 composite + 5 cases)
 *   - validateSprintInput composite (1 TC)
 *   - SprintEvents factories (1 TC)
 *   - SprintEvents immutability (1 TC)
 *   - isValidSprintEvent (1 TC)
 *   - Domain purity (1 TC, indirect via require)
 *   - require() compatibility (--plugin-dir . simulation) (1 TC)
 *   - JSDoc @typedef count check (1 TC)
 *
 * Run:
 *   node tests/qa/v2113-sprint-1-domain.test.js
 *
 * Design Ref: docs/02-design/features/v2113-sprint-1-domain.design.md §8
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '../..');
process.env.CLAUDE_PLUGIN_ROOT = ROOT;

let pass = 0;
let fail = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    failures.push({ name, error: e.message });
    console.log(`  ✗ ${name}`);
    console.log(`    ${e.message}`);
  }
}

console.log('\n=== bkit v2.1.13 Sprint 1 Domain Foundation — QA Suite ===\n');

// Load modules
const sprintLifecycle = require(path.join(ROOT, 'lib/application/sprint-lifecycle'));
const sprintDomain = require(path.join(ROOT, 'lib/domain/sprint'));

console.log('--- L1 Unit: Application Layer (phases.js) ---');

test('TC-L1-01a: SPRINT_PHASES is frozen object', () => {
  assert.strictEqual(Object.isFrozen(sprintLifecycle.SPRINT_PHASES), true);
});

test('TC-L1-01b: SPRINT_PHASES has 8 keys', () => {
  assert.strictEqual(Object.keys(sprintLifecycle.SPRINT_PHASES).length, 8);
});

test('TC-L1-01c: SPRINT_PHASES.PRD = "prd"', () => {
  assert.strictEqual(sprintLifecycle.SPRINT_PHASES.PRD, 'prd');
  assert.strictEqual(sprintLifecycle.SPRINT_PHASES.ITERATE, 'iterate');
  assert.strictEqual(sprintLifecycle.SPRINT_PHASES.ARCHIVED, 'archived');
});

test('TC-L1-01d: SPRINT_PHASES mutation silently ignored (frozen, CJS non-strict)', () => {
  // CJS modules execute in non-strict mode by default — Object.freeze causes
  // silent fail on mutation (no throw). Verify mutation has no effect.
  const before = Object.keys(sprintLifecycle.SPRINT_PHASES).length;
  try { sprintLifecycle.SPRINT_PHASES.NEW_PHASE = 'new'; } catch (_e) { /* strict mode throws */ }
  const after = Object.keys(sprintLifecycle.SPRINT_PHASES).length;
  assert.strictEqual(after, before, 'Object.freeze should prevent additions');
  assert.strictEqual(sprintLifecycle.SPRINT_PHASES.NEW_PHASE, undefined);
  // Attempt to overwrite existing key
  try { sprintLifecycle.SPRINT_PHASES.PRD = 'hacked'; } catch (_e) { /* expected */ }
  assert.strictEqual(sprintLifecycle.SPRINT_PHASES.PRD, 'prd', 'Object.freeze should prevent overwrite');
});

test('TC-L1-02a: SPRINT_PHASE_ORDER has 8 entries', () => {
  assert.strictEqual(sprintLifecycle.SPRINT_PHASE_ORDER.length, 8);
});

test('TC-L1-02b: SPRINT_PHASE_ORDER first=prd, last=archived', () => {
  assert.strictEqual(sprintLifecycle.SPRINT_PHASE_ORDER[0], 'prd');
  assert.strictEqual(sprintLifecycle.SPRINT_PHASE_ORDER[7], 'archived');
});

test('TC-L1-02c: SPRINT_PHASE_ORDER is frozen', () => {
  assert.strictEqual(Object.isFrozen(sprintLifecycle.SPRINT_PHASE_ORDER), true);
});

test('TC-L1-03: isValidSprintPhase boolean returns', () => {
  assert.strictEqual(sprintLifecycle.isValidSprintPhase('prd'), true);
  assert.strictEqual(sprintLifecycle.isValidSprintPhase('iterate'), true);
  assert.strictEqual(sprintLifecycle.isValidSprintPhase('unknown'), false);
  assert.strictEqual(sprintLifecycle.isValidSprintPhase(null), false);
  assert.strictEqual(sprintLifecycle.isValidSprintPhase(123), false);
  assert.strictEqual(sprintLifecycle.isValidSprintPhase(undefined), false);
});

test('TC-L1-03b: sprintPhaseIndex / nextSprintPhase', () => {
  assert.strictEqual(sprintLifecycle.sprintPhaseIndex('prd'), 0);
  assert.strictEqual(sprintLifecycle.sprintPhaseIndex('do'), 3);
  assert.strictEqual(sprintLifecycle.sprintPhaseIndex('unknown'), -1);
  assert.strictEqual(sprintLifecycle.nextSprintPhase('prd'), 'plan');
  assert.strictEqual(sprintLifecycle.nextSprintPhase('do'), 'iterate');
  assert.strictEqual(sprintLifecycle.nextSprintPhase('archived'), null);
  assert.strictEqual(sprintLifecycle.nextSprintPhase('unknown'), null);
});

console.log('\n--- L1 Unit: Application Layer (transitions.js) ---');

test('TC-L1-04a: canTransitionSprint forward path', () => {
  assert.deepStrictEqual(sprintLifecycle.canTransitionSprint('prd', 'plan'), { ok: true });
  assert.deepStrictEqual(sprintLifecycle.canTransitionSprint('plan', 'design'), { ok: true });
  assert.deepStrictEqual(sprintLifecycle.canTransitionSprint('design', 'do'), { ok: true });
});

test('TC-L1-04b: canTransitionSprint auto-iterate (do→iterate)', () => {
  assert.deepStrictEqual(sprintLifecycle.canTransitionSprint('do', 'iterate'), { ok: true });
});

test('TC-L1-04c: canTransitionSprint qa→do fail-back', () => {
  assert.deepStrictEqual(sprintLifecycle.canTransitionSprint('qa', 'do'), { ok: true });
});

test('TC-L1-04d: canTransitionSprint iterate→qa', () => {
  assert.deepStrictEqual(sprintLifecycle.canTransitionSprint('iterate', 'qa'), { ok: true });
});

test('TC-L1-04e: canTransitionSprint qa→report', () => {
  assert.deepStrictEqual(sprintLifecycle.canTransitionSprint('qa', 'report'), { ok: true });
});

test('TC-L1-04f: canTransitionSprint report→archived', () => {
  assert.deepStrictEqual(sprintLifecycle.canTransitionSprint('report', 'archived'), { ok: true });
});

test('TC-L1-04g: canTransitionSprint archived→plan denied', () => {
  assert.deepStrictEqual(
    sprintLifecycle.canTransitionSprint('archived', 'plan'),
    { ok: false, reason: 'transition_not_allowed' }
  );
});

test('TC-L1-04h: canTransitionSprint invalid_from_phase', () => {
  assert.deepStrictEqual(
    sprintLifecycle.canTransitionSprint('xxx', 'plan'),
    { ok: false, reason: 'invalid_from_phase' }
  );
});

test('TC-L1-04i: canTransitionSprint invalid_to_phase', () => {
  assert.deepStrictEqual(
    sprintLifecycle.canTransitionSprint('plan', 'yyy'),
    { ok: false, reason: 'invalid_to_phase' }
  );
});

test('TC-L1-04j: canTransitionSprint idempotent (from === to)', () => {
  assert.deepStrictEqual(sprintLifecycle.canTransitionSprint('plan', 'plan'), { ok: true });
});

test('TC-L1-05: SPRINT_TRANSITIONS nested frozen', () => {
  assert.strictEqual(Object.isFrozen(sprintLifecycle.SPRINT_TRANSITIONS), true);
  assert.strictEqual(Object.isFrozen(sprintLifecycle.SPRINT_TRANSITIONS.prd), true);
  assert.strictEqual(Object.isFrozen(sprintLifecycle.SPRINT_TRANSITIONS.do), true);
  // Mutation should throw in strict mode (require is strict for ES modules; in CJS, frozen arrays silently fail without strict — assert via length stability)
  const originalLength = sprintLifecycle.SPRINT_TRANSITIONS.prd.length;
  try { sprintLifecycle.SPRINT_TRANSITIONS.prd.push('hack'); } catch (e) { /* expected */ }
  assert.strictEqual(sprintLifecycle.SPRINT_TRANSITIONS.prd.length, originalLength);
});

test('TC-L1-06: legalNextSprintPhases returns mutable copy', () => {
  const next = sprintLifecycle.legalNextSprintPhases('prd');
  const before = sprintLifecycle.SPRINT_TRANSITIONS.prd.length;
  next.push('hacked');  // mutation on copy
  assert.strictEqual(sprintLifecycle.SPRINT_TRANSITIONS.prd.length, before, 'Original transitions should not be mutated');
  assert.deepStrictEqual(sprintLifecycle.legalNextSprintPhases('xxx'), []);  // invalid → []
});

console.log('\n--- L1 Unit: Domain Layer (entity.js) ---');

test('TC-L1-07a: createSprint factory creates valid Sprint', () => {
  const s = sprintDomain.createSprint({ id: 'my-sprint', name: 'My Sprint' });
  assert.strictEqual(s.id, 'my-sprint');
  assert.strictEqual(s.name, 'My Sprint');
  assert.strictEqual(s.phase, 'prd');
  assert.strictEqual(s.status, 'active');
  assert.strictEqual(s.version, '1.1');
});

test('TC-L1-07b: createSprint applies DEFAULT_CONFIG', () => {
  const s = sprintDomain.createSprint({ id: 'my', name: 'My' });
  assert.strictEqual(s.config.budget, 1_000_000);
  assert.strictEqual(s.config.phaseTimeoutHours, 4);
  assert.strictEqual(s.config.maxIterations, 5);
  assert.strictEqual(s.config.matchRateTarget, 100);
  assert.strictEqual(s.config.matchRateMinAcceptable, 90);
  assert.strictEqual(s.config.dashboardMode, 'session-start');
  assert.strictEqual(s.config.manual, false);
});

test('TC-L1-07c: createSprint applies DEFAULT_AUTO_PAUSE_ARMED 4 triggers', () => {
  const s = sprintDomain.createSprint({ id: 'my', name: 'My' });
  assert.deepStrictEqual(s.autoPause.armed, [
    'QUALITY_GATE_FAIL',
    'ITERATION_EXHAUSTED',
    'BUDGET_EXCEEDED',
    'PHASE_TIMEOUT',
  ]);
});

test('TC-L1-07d: createSprint creates ISO 8601 timestamps', () => {
  const s = sprintDomain.createSprint({ id: 'my', name: 'My' });
  assert.match(s.createdAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
});

test('TC-L1-07e: createSprint throws TypeError on invalid input', () => {
  assert.throws(() => sprintDomain.createSprint(null), TypeError);
  assert.throws(() => sprintDomain.createSprint({}), TypeError);
  assert.throws(() => sprintDomain.createSprint({ id: '' }), TypeError);
  assert.throws(() => sprintDomain.createSprint({ id: 'x' }), TypeError);  // missing name
});

test('TC-L1-07f: cloneSprint immutable update', () => {
  const s1 = sprintDomain.createSprint({ id: 'my', name: 'My' });
  const s2 = sprintDomain.cloneSprint(s1, { phase: 'plan' });
  assert.strictEqual(s1.phase, 'prd');  // original unchanged
  assert.strictEqual(s2.phase, 'plan');
});

console.log('\n--- L1 Unit: Domain Layer (validators.js) ---');

test('TC-L1-08: isValidSprintName 10 edge cases', () => {
  // Valid
  assert.strictEqual(sprintDomain.isValidSprintName('my-sprint'), true);
  assert.strictEqual(sprintDomain.isValidSprintName('q2-2026-launch'), true);
  assert.strictEqual(sprintDomain.isValidSprintName('abc'), true);  // min 3 chars
  // Invalid
  assert.strictEqual(sprintDomain.isValidSprintName('My-Sprint'), false);  // uppercase
  assert.strictEqual(sprintDomain.isValidSprintName('-leading'), false);
  assert.strictEqual(sprintDomain.isValidSprintName('trailing-'), false);
  assert.strictEqual(sprintDomain.isValidSprintName('my--double'), false);
  assert.strictEqual(sprintDomain.isValidSprintName('a'), false);  // too short (1 < 3)
  assert.strictEqual(sprintDomain.isValidSprintName('a'.repeat(65)), false);  // too long
  assert.strictEqual(sprintDomain.isValidSprintName('with space'), false);
});

test('TC-L1-08b: isValidSprintContext requires 5 keys', () => {
  assert.strictEqual(sprintDomain.isValidSprintContext({
    WHY: 'why', WHO: 'who', RISK: 'risk', SUCCESS: 'ok', SCOPE: 'scope',
  }), true);
  assert.strictEqual(sprintDomain.isValidSprintContext({ WHY: 'a' }), false);
  assert.strictEqual(sprintDomain.isValidSprintContext(null), false);
  assert.strictEqual(sprintDomain.isValidSprintContext({}), false);
  // Empty trimmed string → false
  assert.strictEqual(sprintDomain.isValidSprintContext({
    WHY: '   ', WHO: 'who', RISK: 'risk', SUCCESS: 'ok', SCOPE: 'scope',
  }), false);
});

test('TC-L1-12: sprintPhaseDocPath mapping', () => {
  assert.strictEqual(sprintDomain.sprintPhaseDocPath('my', 'prd'), 'docs/01-plan/features/my.prd.md');
  assert.strictEqual(sprintDomain.sprintPhaseDocPath('my', 'plan'), 'docs/01-plan/features/my.plan.md');
  assert.strictEqual(sprintDomain.sprintPhaseDocPath('my', 'design'), 'docs/02-design/features/my.design.md');
  assert.strictEqual(sprintDomain.sprintPhaseDocPath('my', 'iterate'), 'docs/03-analysis/features/my.iterate.md');
  assert.strictEqual(sprintDomain.sprintPhaseDocPath('my', 'qa'), 'docs/05-qa/features/my.qa-report.md');
  assert.strictEqual(sprintDomain.sprintPhaseDocPath('my', 'report'), 'docs/04-report/features/my.report.md');
  assert.strictEqual(sprintDomain.sprintPhaseDocPath('my', 'masterPlan'), 'docs/01-plan/features/my.master-plan.md');
  assert.strictEqual(sprintDomain.sprintPhaseDocPath('my', 'unknown'), null);
  assert.strictEqual(sprintDomain.sprintPhaseDocPath('', 'prd'), null);
  assert.strictEqual(sprintDomain.sprintPhaseDocPath(null, 'prd'), null);
});

test('TC-L1-13: validateSprintInput composite { ok, errors? }', () => {
  // Valid case
  assert.deepStrictEqual(
    sprintDomain.validateSprintInput({ id: 'my-sprint', name: 'My' }),
    { ok: true }
  );
  // Invalid: bad id
  const r1 = sprintDomain.validateSprintInput({ id: 'Bad-Name', name: 'X' });
  assert.strictEqual(r1.ok, false);
  assert.ok(r1.errors.includes('invalid_id_kebab_case'));
  // Invalid: null
  assert.deepStrictEqual(
    sprintDomain.validateSprintInput(null),
    { ok: false, errors: ['input_not_object'] }
  );
  // Invalid: empty name
  const r2 = sprintDomain.validateSprintInput({ id: 'my-sprint', name: '' });
  assert.ok(r2.errors.includes('invalid_name_empty'));
});

console.log('\n--- L1 Unit: Domain Layer (events.js) ---');

test('TC-L1-09: SprintEvents.SprintCreated factory', () => {
  const e = sprintDomain.SprintEvents.SprintCreated({ sprintId: 'x', name: 'X', phase: 'prd' });
  assert.strictEqual(e.type, 'SprintCreated');
  assert.match(e.timestamp, /^\d{4}-\d{2}-\d{2}T/);
  assert.deepStrictEqual(e.payload, { sprintId: 'x', name: 'X', phase: 'prd' });
});

test('TC-L1-09b: All 5 SprintEvents factories produce valid events', () => {
  const events = [
    sprintDomain.SprintEvents.SprintCreated({ sprintId: 'x', name: 'X', phase: 'prd' }),
    sprintDomain.SprintEvents.SprintPhaseChanged({ sprintId: 'x', fromPhase: 'prd', toPhase: 'plan' }),
    sprintDomain.SprintEvents.SprintArchived({ sprintId: 'x' }),
    sprintDomain.SprintEvents.SprintPaused({ sprintId: 'x', trigger: 'BUDGET_EXCEEDED' }),
    sprintDomain.SprintEvents.SprintResumed({ sprintId: 'x', pausedAt: '2026-01-01T00:00:00Z' }),
  ];
  for (const e of events) {
    assert.ok(sprintDomain.isValidSprintEvent(e), `Event ${e.type} should validate`);
  }
});

test('TC-L1-10: SprintEvents object is frozen', () => {
  assert.strictEqual(Object.isFrozen(sprintDomain.SprintEvents), true);
});

test('TC-L1-11: isValidSprintEvent validation', () => {
  const validEvent = sprintDomain.SprintEvents.SprintCreated({ sprintId: 'x', name: 'X', phase: 'prd' });
  assert.strictEqual(sprintDomain.isValidSprintEvent(validEvent), true);
  assert.strictEqual(sprintDomain.isValidSprintEvent({}), false);
  assert.strictEqual(sprintDomain.isValidSprintEvent(null), false);
  // Invalid type
  assert.strictEqual(sprintDomain.isValidSprintEvent({
    type: 'Unknown', timestamp: '2026-01-01', payload: { sprintId: 'x' },
  }), false);
  // Missing payload.sprintId
  assert.strictEqual(sprintDomain.isValidSprintEvent({
    type: 'SprintCreated', timestamp: '2026-01-01', payload: {},
  }), false);
});

console.log('\n--- L1 Unit: Cross-cutting ---');

test('TC-L1-14: lib/domain/sprint/ contains no forbidden imports', () => {
  // Indirect check: require('lib/domain/sprint') succeeds (already loaded above without throw)
  // Direct grep:
  const DOMAIN_DIR = path.join(ROOT, 'lib/domain/sprint');
  const files = fs.readdirSync(DOMAIN_DIR);
  const FORBIDDEN = ['fs', 'child_process', 'net', 'http', 'https', 'os', 'dns', 'tls', 'cluster'];
  for (const f of files) {
    if (!f.endsWith('.js')) continue;
    const src = fs.readFileSync(path.join(DOMAIN_DIR, f), 'utf8');
    for (const mod of FORBIDDEN) {
      const reqPattern = new RegExp(`require\\(\\s*['\\"]${mod}['\\"]\\s*\\)`, 'g');
      assert.strictEqual(reqPattern.test(src), false, `${f} should not require('${mod}')`);
    }
  }
});

test('TC-L1-15: require() compatibility via CLAUDE_PLUGIN_ROOT', () => {
  // Re-require with fresh module cache simulation (already loaded above)
  const sl = require(path.join(ROOT, 'lib/application/sprint-lifecycle'));
  const sd = require(path.join(ROOT, 'lib/domain/sprint'));
  assert.ok(sl.SPRINT_PHASES);
  assert.ok(sd.createSprint);
  assert.ok(sd.SprintEvents);
});

test('TC-L1-16: Sprint 2 mock use case import scenario', () => {
  // Simulates a Sprint 2 application use case importing both Application + Domain
  const { SPRINT_PHASES, canTransitionSprint } = sprintLifecycle;
  const { createSprint, SprintEvents } = sprintDomain;

  const sprint = createSprint({ id: 'mock-sprint', name: 'Mock' });
  assert.strictEqual(sprint.phase, SPRINT_PHASES.PRD);

  const result = canTransitionSprint(sprint.phase, SPRINT_PHASES.PLAN);
  assert.deepStrictEqual(result, { ok: true });

  const evt = SprintEvents.SprintPhaseChanged({
    sprintId: sprint.id,
    fromPhase: sprint.phase,
    toPhase: SPRINT_PHASES.PLAN,
  });
  assert.strictEqual(evt.type, 'SprintPhaseChanged');
});

test('TC-L1-17: Sprint 3 mock state store import scenario', () => {
  // Simulates Sprint 3 state-store.js load/save with createSprint
  const sprint = sprintDomain.createSprint({
    id: 'state-store-mock',
    name: 'State Store Mock',
    config: { budget: 500_000 },  // user override
  });
  assert.strictEqual(sprint.config.budget, 500_000);  // override applied
  assert.strictEqual(sprint.config.maxIterations, 5);  // default kept

  // JSON serialization round-trip
  const json = JSON.stringify(sprint);
  const restored = JSON.parse(json);
  assert.strictEqual(restored.id, sprint.id);
  assert.strictEqual(restored.config.budget, 500_000);
});

test('TC-L1-18: 7 files all loaded successfully', () => {
  // Loaded above without throw; verify all expected exports present
  const expectedAppExports = [
    'SPRINT_PHASES', 'SPRINT_PHASE_ORDER', 'SPRINT_PHASE_SET',
    'isValidSprintPhase', 'sprintPhaseIndex', 'nextSprintPhase',
    'SPRINT_TRANSITIONS', 'canTransitionSprint', 'legalNextSprintPhases',
  ];
  for (const exp of expectedAppExports) {
    assert.ok(sprintLifecycle[exp] !== undefined, `Application export missing: ${exp}`);
  }
  const expectedDomainExports = [
    'createSprint', 'cloneSprint', 'DEFAULT_CONFIG', 'DEFAULT_QUALITY_GATES', 'DEFAULT_AUTO_PAUSE_ARMED',
    'isValidSprintName', 'isValidSprintContext', 'sprintPhaseDocPath', 'validateSprintInput',
    'SPRINT_NAME_REGEX', 'SPRINT_NAME_MIN_LENGTH', 'SPRINT_NAME_MAX_LENGTH', 'REQUIRED_CONTEXT_KEYS',
    'SprintEvents', 'SPRINT_EVENT_TYPES', 'SPRINT_EVENT_TYPE_SET', 'isValidSprintEvent',
  ];
  for (const exp of expectedDomainExports) {
    assert.ok(sprintDomain[exp] !== undefined, `Domain export missing: ${exp}`);
  }
});

console.log('\n=== Test Summary ===');
console.log(`Total: ${pass + fail}`);
console.log(`Pass:  ${pass}`);
console.log(`Fail:  ${fail}`);
if (fail > 0) {
  console.log('\nFailures:');
  for (const f of failures) {
    console.log(`  ✗ ${f.name}: ${f.error}`);
  }
  process.exit(1);
}
console.log('\n✓ All Sprint 1 QA tests passed.');
process.exit(0);
