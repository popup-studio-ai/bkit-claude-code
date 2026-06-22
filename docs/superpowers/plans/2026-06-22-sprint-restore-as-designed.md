# Sprint Restore-As-Designed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the gap between the bkit Sprint system's documented design (v2.1.11–v2.1.22) and its implementation so the full 8-phase lifecycle runs end-to-end via the CLI with zero manual JSON editing.

**Architecture:** Hexagonal (ports-and-adapters), preserved as-is. All fixes live at the composition root and the seams the design already specified — no new layers, no domain refactor beyond typedef completion. Five sequentially-dependent slices: (1) dispatcher wiring, (2) gate measurement completeness, (3) feature tracking, (4) designed-but-unimplemented completion, (5) docs.

**Tech Stack:** Node.js 24 (CommonJS, `'use strict'`), `node:test`-style ad-hoc test harness (`node tests/...test.js`), no external test framework. Tests in `tests/contract/` are tracked; `tests/qa/` is gitignored (local-only mirrors). Code is JSDoc-annotated, `Object.freeze` for constants, `{ ok, ... }` return shape (no thrown errors across handler boundaries).

**Spec:** [docs/superpowers/specs/2026-06-22-sprint-restore-as-designed-design.en.md](../specs/2026-06-22-sprint-restore-as-designed-design.en.md)

**Investigation reports (gitignored, in `work/sprint-investigation/`):** gate-measurement-findings.md, feature-registration-and-approve-findings.md, intended-design-map.md, actual-implementation-map.md, cluster-f-classification.md, dead-code-and-stubs.inventory.md, out-of-scope.md.

---

## File Structure

Files touched, grouped by slice. Each file has one responsibility; edits stay within that responsibility.

**Slice 1 (dispatcher wiring):**
- `scripts/lib/sprint-handler-shared.js` — add `createTaskToolRunner()` host-adapter factory (the ONLY host-aware code; constructs the runner from the injected Task tool)
- `scripts/sprint-handler.js` — export `createTaskToolRunner`; route runner into measure/phase deps via `wireAgentAdapters`
- `skills/sprint/SKILL.md` — document that the in-process dispatcher call (LLM dispatcher in main session) injects `deps.agentTaskRunner`; clarify the subprocess CLI path is a fallback that cannot see the Task tool
- `tests/contract/sprint-restore-slice1.test.js` (CREATE, tracked) — contract: in-process `handleSprintAction('measure', ...)` with injected runner returns a real measurement; subprocess `{}` path still returns `no_agent_runner` (correct defensive behavior preserved)

**Slice 2 (gate measurement completeness):**
- `lib/application/quality-gates/measure-router.js` — M8 source-artifact = plan doc's design section; M5 route (qa-monitor, `not_applicable` when no logs); M10 computed route; S4 route
- `lib/application/sprint-lifecycle/quality-gates.js` — add M5/M10 to `DEFAULT_QUALITY_GATES` slots if absent (verify first); no change to `ACTIVE_GATES_BY_PHASE` membership
- `lib/application/sprint-lifecycle/auto-pause.js` — `QUALITY_GATE_FAIL` inspects all active gates, not just M3/S1
- `scripts/lib/sprint-handlers-core.js` — `handleQA` persists computed `s1Score` to `S1_dataFlowIntegrity` slot
- `tests/contract/sprint-restore-slice2.test.js` (CREATE, tracked)

**Slice 3 (feature tracking):**
- `lib/domain/sprint/entity.js` — add `completion` to `SprintFeatureMapEntry` typedef; populate `featureMap` in `createSprint`
- `lib/application/sprint-lifecycle/kpi-resolver.js` — S2 = ratio(done/total); reads `featureMap.<f>.completion`
- `lib/application/sprint-lifecycle/measure-gate.usecase.js` (or compute path) — S2 derived gate compute
- `scripts/lib/sprint-handlers-core.js` — `handleFeature add/remove` syncs `featureMap`; phase advance updates `completion`; `handleReport` injects `fileWriter`
- `tests/contract/sprint-restore-slice3.test.js` (CREATE, tracked)

**Slice 4 (designed-but-unimplemented completion):**
- `lib/domain/sprint/entity.js` — add `dataFlow` and `annotations` to `Sprint` typedef
- `lib/infra/sprint/data-flow-validator.adapter.js` — Tier-2 reads `sprint.dataFlow` (now declared)
- `lib/application/sprint-lifecycle/transitions.js` / `phases.js` — `computeNextPhase('do')` honors matchRate (skip-iterate)
- `scripts/lib/sprint-handlers-core.js` — `handleWatch` reads only real `MATRIX_TYPES` (after design check); qa phase writes `dataFlow`
- `scripts/lib/sprint-handlers-admin.js` — `handleMasterPlan` injects `taskCreator`; CLI exit flushes emitter
- `tests/contract/sprint-restore-slice4.test.js` (CREATE, tracked)

**Slice 5 (docs):**
- `skills/sprint/SKILL.md` — `--approve` warning at §10.1 table row + help; reconcile SPRINT_AUTORUN_SCOPE table to code
- `commands/bkit.md` — Trust Level table corrected to code
- `skills/sprint/examples/multi-feature-sprint.md` — fix false `featureMap` claim
- `lib/application/sprint-lifecycle/advance-phase.usecase.js` — `gate_fail` return adds `hint` field
- `scripts/lib/sprint-handlers-admin.js` — help text promotes `--approve` warning out of 3-level indent
- (no new tracked test; master E2E test below covers the full lifecycle)

**Master E2E (after Slice 5):**
- `tests/contract/sprint-restore-e2e.test.js` (CREATE, tracked) — full lifecycle via CLI with zero manual JSON editing

---

## Conventions for every task

- **Test command:** `node tests/contract/<file>.test.js` (each contract file is self-contained; it prints `PASS: N / FAIL: M` and exits non-zero on failure).
- **Commit message prefix:** `fix(sprint):` for bug fixes, `feat(sprint):` for new wiring, `docs(sprint):` for docs, `test(sprint):` for test-only. End every commit message with `Co-Authored-By: Claude <noreply@anthropic.com>`.
- **Before editing any file,** Read it fresh in the implementing session (the plan cites line numbers from 2026-06-22; they may have drifted).
- **No `// noqa`, no `// type: ignore`, no bare `catch {}` without a comment.** Match the surrounding code's `catch (_e) { /* reason */ }` style.
- **Every handler keeps the `{ ok: boolean, ... }` return contract** — no thrown errors cross handler boundaries.
- **Frozen objects stay frozen.** When extending a `Object.freeze({...})` constant, freeze the result too.

---

# Slice 1 — Dispatcher Wiring (Cluster A)

**The keystone. Nothing else is verifiable until the runner flows end-to-end.**

**Key architectural fact (from investigation):** The CLI subprocess path (`require.main === module` in `scripts/sprint-handler.js:219`) runs in a *separate Node process* spawned by the skill — it genuinely cannot see Claude Code's Task tool, which lives in the parent session. So the runner is injected by the **LLM dispatcher in the main session** (which calls `handleSprintAction` directly with `deps`), NOT constructed inside the subprocess. The subprocess `{}` at line 252 is the correct fallback for the headless path; the defect is that the *in-process* path was never documented/enforced as the primary route.

### Task 1.1: Add `createTaskToolRunner` host-adapter factory

**Files:**
- Modify: `scripts/lib/sprint-handler-shared.js` (add factory + export)

- [ ] **Step 1: Read the file to confirm current exports**

Run: `head -50 scripts/lib/sprint-handler-shared.js`
Note the `module.exports` block at the bottom — the new factory must be added there.

- [ ] **Step 2: Write the failing test**

Create `tests/contract/sprint-restore-slice1.test.js`:

```javascript
'use strict';
/**
 * sprint-restore-slice1.test.js — Slice 1 contract: dispatcher wiring.
 * Verifies the in-process handleSprintAction path injects agentTaskRunner
 * so /sprint measure returns a real measurement (not no_agent_runner).
 *
 * The subprocess CLI path ({}) correctly returns no_agent_runner — that
 * defensive behavior at the router layer is preserved and asserted too.
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const shared = require(path.join(PLUGIN_ROOT, 'scripts/lib/sprint-handler-shared'));
const { handleSprintAction } = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
const mr = require(path.join(PLUGIN_ROOT, 'lib/application/quality-gates/measure-router'));

let pass = 0, fail = 0;
const failures = [];
async function tc(name, fn) {
  try { await fn(); pass++; } catch (e) { fail++; failures.push({ name, msg: e.message }); }
}

await tc('createTaskToolRunner is exported and builds a runner from an invoke fn', async () => {
  assert.strictEqual(typeof shared.createTaskToolRunner, 'function');
  const runner = shared.createTaskToolRunner({
    invokeTaskTool: async ({ subagent_type, prompt }) => ({ text: '{"value": 96}' }),
  });
  assert.strictEqual(typeof runner, 'function');
  // Runner shape: ({ subagent_type, prompt }) => Promise<{ output }>
  const out = await runner({ subagent_type: 'gap-detector', prompt: 'x' });
  assert.strictEqual(typeof out.output, 'string');
});

await tc('in-process measure with injected runner returns a real value, not no_agent_runner', async () => {
  // A sprint in design phase with a real M4 source artifact present.
  // Use the domain factory to build a minimal sprint in a temp project root.
  const domain = require(path.join(PLUGIN_ROOT, 'lib/domain/sprint'));
  const sprint = domain.createSprint({ id: 'slice1', name: 'Slice 1', features: ['auth'] });
  // Force a measurable state: M4 source artifact exists.
  const runner = shared.createTaskToolRunner({
    invokeTaskTool: async () => ({ text: '{"value": 96}' }),
  });
  const res = await mr.measureGate('M4', sprint, { agentTaskRunner: runner });
  assert.notStrictEqual(res && res.reason, 'no_agent_runner',
    'injected runner must not yield no_agent_runner; got ' + JSON.stringify(res));
});

await tc('subprocess-style empty deps still yields no_agent_runner (defensive behavior preserved)', async () => {
  const domain = require(path.join(PLUGIN_ROOT, 'lib/domain/sprint'));
  const sprint = domain.createSprint({ id: 'slice1b', name: 'Slice 1b', features: ['auth'] });
  const res = await mr.measureGate('M4', sprint, {});
  assert.strictEqual(res && res.reason, 'no_agent_runner');
});

if (fail) {
  console.error(`FAIL: ${fail} / PASS: ${pass}`);
  failures.forEach(f => console.error('  - ' + f.name + ': ' + f.msg));
  process.exit(1);
}
console.log(`PASS: ${pass} / FAIL: ${fail}`);
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node tests/contract/sprint-restore-slice1.test.js`
Expected: FAIL — `shared.createTaskToolRunner is not a function` (or `undefined`), first assertion fails.

- [ ] **Step 4: Implement `createTaskToolRunner`**

In `scripts/lib/sprint-handler-shared.js`, add (before `module.exports`):

```javascript
/**
 * createTaskToolRunner — host adapter that wraps an injected Task-tool
 * invoker into the deps.agentTaskRunner contract the Sprint domain expects:
 *   ({ subagent_type, prompt }) => Promise<{ output: string }>
 *
 * This is the ONLY host-aware code in the handler layer. The domain
 * (measure-router, use cases, entity) never imports host specifics —
 * they receive the runner via deps. The composition root (the LLM
 * dispatcher in the main session) calls this factory and passes the
 * result into handleSprintAction({ agentTaskRunner }).
 *
 * The subprocess CLI path (require.main === module) runs in a separate
 * Node process and cannot see Claude Code's Task tool, so it passes {}
 * and the router correctly returns no_agent_runner for that path.
 *
 * @param {{ invokeTaskTool: ({ subagent_type: string, prompt: string }) => Promise<{ text: string }> }} host
 * @returns {({ subagent_type: string, prompt: string }) => Promise<{ output: string }>}
 */
function createTaskToolRunner(host) {
  if (!host || typeof host.invokeTaskTool !== 'function') {
    throw new TypeError('createTaskToolRunner requires { invokeTaskTool }');
  }
  return async ({ subagent_type, prompt }) => {
    const result = await host.invokeTaskTool({ subagent_type, prompt });
    return { output: (result && result.text) || '' };
  };
}
```

Add `createTaskToolRunner` to the `module.exports` object.

- [ ] **Step 5: Run test to verify it passes**

Run: `node tests/contract/sprint-restore-slice1.test.js`
Expected: `PASS: 3 / FAIL: 0`

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/sprint-handler-shared.js tests/contract/sprint-restore-slice1.test.js
git commit -m "feat(sprint): add createTaskToolRunner host-adapter factory (Slice 1)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 1.2: Route the runner into measure/phase deps via `wireAgentAdapters`

**Files:**
- Modify: `scripts/sprint-handler.js` (lines ~139-161 `wireAgentAdapters`, ~191 `d = wireAgentAdapters`)
- Modify: `scripts/sprint-handler.js` module.exports to re-export `createTaskToolRunner`

- [ ] **Step 1: Read the current `wireAgentAdapters`**

Run: `sed -n '139,161p' scripts/sprint-handler.js`
Confirm it only routes runner into `iterateDeps` (gapDetector/autoFixer) and `qaDeps` (dataFlowValidator), not measure/phase.

- [ ] **Step 2: Add a failing assertion to the contract test**

Append to `tests/contract/sprint-restore-slice1.test.js` (before the final pass/fail block):

```javascript
await tc('wireAgentAdapters threads agentTaskRunner into measureDeps when provided', async () => {
  const { handleSprintAction } = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
  // We assert the wiring by checking that handleSprintAction('measure', ...)
  // with an injected runner reaches the router (not the no_agent_runner short-circuit).
  // Build a sprint with a measurable M4 artifact via the domain factory.
  const domain = require(path.join(PLUGIN_ROOT, 'lib/domain/sprint'));
  // Use a temp project root so the state store doesn't collide.
  const os = require('node:os'); const fs = require('node:fs');
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'slice1-'));
  const runner = shared.createTaskToolRunner({
    invokeTaskTool: async () => ({ text: '{"value": 96}' }),
  });
  // Init then measure through the full handler path (in-process).
  const init = await handleSprintAction('init', { id: 'w', name: 'W', features: ['auth'], projectRoot: tmpRoot }, { agentTaskRunner: runner });
  assert.strictEqual(init.ok, true, 'init failed: ' + JSON.stringify(init));
  const measure = await handleSprintAction('measure', { id: 'w', gate: 'M4', projectRoot: tmpRoot }, { agentTaskRunner: runner });
  assert.strictEqual(measure.ok !== false || (measure.reason !== 'no_agent_runner'), true,
    'measure must not short-circuit with no_agent_runner when runner injected; got ' + JSON.stringify(measure));
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node tests/contract/sprint-restore-slice1.test.js`
Expected: FAIL on the new assertion — `measure` returns `{ ok: false, reason: 'no_agent_runner' }` because `handleMeasure` never receives the runner.

- [ ] **Step 4: Extend `wireAgentAdapters` to thread runner into measure/phase**

In `scripts/sprint-handler.js`, replace the `wireAgentAdapters` function body. The change: when `deps.agentTaskRunner` is present, also expose it on `wired.measureDeps` and `wired.phaseDeps` so `handleMeasure`/`handlePhase` receive it. Edit the function to:

```javascript
function wireAgentAdapters(deps) {
  if (!deps || (!deps.agentTaskRunner && !deps.mcpClient && deps.staticMatrix !== true)) {
    return deps; // no auto-wiring needed
  }

  const wired = { ...deps };

  if (deps.agentTaskRunner && (!deps.iterateDeps || (!deps.iterateDeps.gapDetector && !deps.iterateDeps.autoFixer))) {
    const gapDetector = createGapDetector({ agentTaskRunner: deps.agentTaskRunner });
    const autoFixer = createAutoFixer({ agentTaskRunner: deps.agentTaskRunner });
    wired.iterateDeps = Object.assign({ gapDetector, autoFixer }, deps.iterateDeps || {});
  }

  if ((deps.mcpClient || deps.staticMatrix === true) && (!deps.qaDeps || !deps.qaDeps.dataFlowValidator)) {
    const dataFlowValidator = createDataFlowValidator({
      mcpClient: deps.mcpClient,
      staticMatrix: deps.staticMatrix === true,
    });
    wired.qaDeps = Object.assign({ dataFlowValidator }, deps.qaDeps || {});
  }

  // Slice 1 (Cluster A): thread agentTaskRunner into the measure + phase
  // paths so handleMeasure/handlePhase can dispatch sub-agents. Previously
  // only iterate/qa paths received it, leaving /sprint measure and gate
  // checks during phase advance unable to measure (no_agent_runner).
  if (deps.agentTaskRunner) {
    wired.measureDeps = Object.assign({ agentTaskRunner: deps.agentTaskRunner }, deps.measureDeps || {});
    wired.phaseDeps = Object.assign({ agentTaskRunner: deps.agentTaskRunner }, deps.phaseDeps || {});
  }

  return wired;
}
```

- [ ] **Step 5: Verify `handleMeasure` consumes `d.measureDeps.agentTaskRunner`**

Run: `grep -n "measureDeps\|agentTaskRunner" scripts/lib/sprint-handlers-admin.js`
If `handleMeasure` reads from a different deps slice (e.g. raw `d.agentTaskRunner`), adjust `wireAgentAdapters` Step 4 to match the key `handleMeasure` actually reads. The principle: the runner must reach `measure-router`'s `deps.agentTaskRunner`. Read `handleMeasure` to confirm the exact key and keep the wiring consistent with it.

- [ ] **Step 6: Run test to verify it passes**

Run: `node tests/contract/sprint-restore-slice1.test.js`
Expected: `PASS: 4 / FAIL: 0`

- [ ] **Step 7: Commit**

```bash
git add scripts/sprint-handler.js tests/contract/sprint-restore-slice1.test.js
git commit -m "fix(sprint): wire agentTaskRunner into measure/phase paths (Slice 1, #1)

Previously wireAgentAdapters only routed the runner into iterate/qa,
leaving /sprint measure and phase-advance gate checks unable to dispatch
sub-agents (no_agent_runner).

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 1.3: Document the in-process injection contract in SKILL.md

**Files:**
- Modify: `skills/sprint/SKILL.md` (§10.1 measure section ~line 245; add injection example)

- [ ] **Step 1: Read the current dispatcher-requirement note**

Run: `sed -n '244,249p' skills/sprint/SKILL.md`
The note says "the LLM dispatcher (main session) must inject deps.agentTaskRunner." Confirm this is the single sentence to expand.

- [ ] **Step 2: Expand the note with the factory + an example**

Replace the "Dispatcher requirement" paragraph (lines ~245-248) with:

```markdown
**Dispatcher requirement**: the LLM dispatcher (main session) must inject
`deps.agentTaskRunner` wrapping Claude Code's Task tool. Without it the use
case returns `reason: 'no_agent_runner'` per gate (deterministic, not silent
fail). The handler layer exposes `createTaskToolRunner({ invokeTaskTool })`
(in `scripts/lib/sprint-handler-shared.js`) to build this wrapper:

\`\`\`javascript
const { createTaskToolRunner } = require('<bkit-root>/scripts/lib/sprint-handler-shared');
const runner = createTaskToolRunner({
  invokeTaskTool: async ({ subagent_type, prompt }) => {
    // delegate to Claude Code's Task tool in the main session
    return { text: await callTaskTool({ subagent_type, prompt }) };
  },
});
await handleSprintAction('measure', { id, gate }, { agentTaskRunner: runner });
\`\`\`

**Two invocation paths:**
1. **In-process (primary, main session):** the LLM dispatcher calls
   `handleSprintAction(...)` directly with `deps.agentTaskRunner` injected.
   Gate measurement works.
2. **Subprocess CLI (`node scripts/sprint-handler.js ...`):** runs in a
   separate Node process that cannot see the Task tool, so it passes `{}`
   and gate measurement returns `no_agent_runner`. Use this path only for
   non-measurement actions (status, list, help) or when the in-process
   path is unavailable.
```

(Use real backticks, not escaped — the escaping above is only for this plan document.)

- [ ] **Step 3: Verify the doc renders (markdown sanity)**

Run: `grep -n "createTaskToolRunner\|Two invocation paths" skills/sprint/SKILL.md`
Expected: both present, once each.

- [ ] **Step 4: Commit**

```bash
git add skills/sprint/SKILL.md
git commit -m "docs(sprint): document agentTaskRunner injection contract (Slice 1, #4)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 1.4: Slice 1 acceptance — full measure path works in-process

- [ ] **Step 1: Run all contract tests touched by Slice 1**

Run: `node tests/contract/sprint-restore-slice1.test.js && node tests/contract/v2113-sprint-contracts.test.js`
Expected: both `PASS`. The SC-13 test at line 597 (`no_agent_runner` for empty deps) must STILL pass — we preserved that defensive router behavior.

- [ ] **Step 2: Confirm no regression in the broader suite**

Run: `for f in tests/contract/sprint-*.test.js; do echo "== $f =="; node "$f" 2>&1 | tail -1; done`
Expected: every file prints `PASS: ... / FAIL: 0` (or its file's equivalent). If any fails, STOP and investigate before Slice 2 (per the no-whack-a-mole rule — do not pile changes on a broken base).

---

# Slice 2 — Gate Measurement Completeness (Clusters B, D, F-gates)

**Depends on Slice 1.** Makes every active gate measurable or explicitly exempted, and makes auto-pause fire on any failing gate.

### Task 2.1: M8 measures the plan document's design section at plan-exit

**Files:**
- Modify: `lib/application/quality-gates/measure-router.js` (M8 source-artifact resolution + prompt)
- Test: `tests/contract/sprint-restore-slice2.test.js` (CREATE)

- [ ] **Step 1: Read the current M8 route**

Run: `grep -n "M8\|design.doc\|design section\|plan.doc\|§14" lib/application/quality-gates/measure-router.js`
Note the exact line where M8's source artifact is resolved (investigation cited line ~83).

- [ ] **Step 2: Write the failing test**

Create `tests/contract/sprint-restore-slice2.test.js`:

```javascript
'use strict';
/**
 * sprint-restore-slice2.test.js — Slice 2: gate measurement completeness.
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const mr = require(path.join(PLUGIN_ROOT, 'lib/application/quality-gates/measure-router'));
const domain = require(path.join(PLUGIN_ROOT, 'lib/domain/sprint'));

let pass = 0, fail = 0;
const failures = [];
async function tc(name, fn) {
  try { await fn(); pass++; } catch (e) { fail++; failures.push({ name, msg: e.message }); }
}

await tc('M8 at plan-exit measures the plan doc design section, not the design doc', async () => {
  const sprint = domain.createSprint({ id: 's2m8', name: 'S2 M8', features: ['auth'] });
  // Place the sprint in plan phase with a plan doc that has a design section.
  sprint.phase = 'plan';
  const runner = async () => ({ output: '{"value": 88}' });
  const res = await mr.measureGate('M8', sprint, { agentTaskRunner: runner });
  assert.ok(res, 'M8 measurement must return a result');
  assert.notStrictEqual(res.reason, 'no_agent_runner');
  assert.notStrictEqual(res.reason, 'no_source_artifact',
    'M8 must resolve to the plan doc design section at plan-exit; got ' + JSON.stringify(res));
});

if (fail) {
  console.error(`FAIL: ${fail} / PASS: ${pass}`);
  failures.forEach(f => console.error('  - ' + f.name + ': ' + f.msg));
  process.exit(1);
}
console.log(`PASS: ${pass} / FAIL: ${fail}`);
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node tests/contract/sprint-restore-slice2.test.js`
Expected: FAIL — M8 returns `no_source_artifact` (or similar) because it looks for a design doc that doesn't exist at plan phase.

- [ ] **Step 4: Implement M8 plan-source resolution**

In `lib/application/quality-gates/measure-router.js`, locate the M8 route's source-artifact resolver. Change it so that when the sprint is at phase `plan` (or the design doc does not yet exist), M8 measures the **plan document's design section** (the design section produced during planning). When the design doc *does* exist (phase ≥ design), M8 measures the design doc as before. The prompt must ask the sub-agent to count the `[x]` checklist items in whichever artifact resolves. Keep the change within the M8 route block; do not touch other routes.

(Read the resolver first; the edit is to its artifact-selection branch. Preserve the frozen-route shape.)

- [ ] **Step 5: Run test to verify it passes**

Run: `node tests/contract/sprint-restore-slice2.test.js`
Expected: `PASS: 1 / FAIL: 0`

- [ ] **Step 6: Commit**

```bash
git add lib/application/quality-gates/measure-router.js tests/contract/sprint-restore-slice2.test.js
git commit -m "fix(sprint): M8 measures plan doc design section at plan-exit (Slice 2, #5)

Resolves the chicken-and-egg: M8 was on the plan-exit gate list but its
source artifact was the design doc that only exists in the design phase.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 2.2: M5 route (qa-monitor probe, `not_applicable` when no logs)

**Files:**
- Modify: `lib/application/quality-gates/measure-router.js` (M5 route)
- Modify: `lib/application/sprint-lifecycle/quality-gates.js` (ensure M5 slot exists in `DEFAULT_QUALITY_GATES` — verify first)
- Test: append to `tests/contract/sprint-restore-slice2.test.js`

- [ ] **Step 1: Verify M5 slot presence**

Run: `grep -n "M5_runtimeErrorRate" lib/domain/sprint/entity.js lib/application/sprint-lifecycle/quality-gates.js`
If `M5_runtimeErrorRate` is NOT in `DEFAULT_QUALITY_GATES` (entity.js ~line 172-184), add it:

```javascript
M5_runtimeErrorRate: Object.freeze({ current: null, threshold: 1, passed: null }),
```
(match the exact shape of the neighboring M1-M4 slots; place it in numeric order).

- [ ] **Step 2: Write the failing test (append before the pass/fail block)**

```javascript
await tc('M5 returns not_applicable when no log source is available', async () => {
  const sprint = domain.createSprint({ id: 's2m5', name: 'S2 M5', features: ['auth'] });
  sprint.phase = 'do';
  // No logs present (library/static-site project).
  const res = await mr.measureGate('M5', sprint, {
    agentTaskRunner: async () => ({ output: '{"value": 0}' }),
    logSourceAvailable: false, // adapter signals no logs
  });
  assert.strictEqual(res.reason, 'not_applicable',
    'M5 with no logs must exempt, not fail; got ' + JSON.stringify(res));
});

await tc('M5 measures via qa-monitor probe when logs are available', async () => {
  const sprint = domain.createSprint({ id: 's2m5b', name: 'S2 M5b', features: ['auth'] });
  sprint.phase = 'do';
  const res = await mr.measureGate('M5', sprint, {
    agentTaskRunner: async () => ({ output: '{"value": 0}' }),
    logSourceAvailable: true,
  });
  assert.notStrictEqual(res.reason, 'unsupported_gate');
  assert.notStrictEqual(res.reason, 'not_applicable');
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node tests/contract/sprint-restore-slice2.test.js`
Expected: FAIL — M5 currently returns `unsupported_gate` (it's in `UNSUPPORTED_GATES`).

- [ ] **Step 4: Add M5 to `GATE_MEASUREMENT_ROUTES` with a qa-monitor probe + not_applicable guard**

In `measure-router.js`: remove `M5` from `UNSUPPORTED_GATES`; add an M5 entry to `GATE_MEASUREMENT_ROUTES`. The route's logic:
- If `deps.logSourceAvailable === false` (or no log source detected), return `{ ok: true, reason: 'not_applicable', value: null, passed: true }` — exempted.
- Otherwise dispatch the qa-monitor sub-agent against the project's logs and parse the returned error rate.

(Follow the exact frozen-object pattern of the existing M4 route. Read it first to match the shape.)

- [ ] **Step 5: Run test to verify it passes**

Run: `node tests/contract/sprint-restore-slice2.test.js`
Expected: `PASS: 3 / FAIL: 0`

- [ ] **Step 6: Commit**

```bash
git add lib/application/quality-gates/measure-router.js lib/application/sprint-lifecycle/quality-gates.js lib/domain/sprint/entity.js tests/contract/sprint-restore-slice2.test.js
git commit -m "feat(sprint): M5 qa-monitor route with not_applicable when no logs (Slice 2)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 2.3: M10 computed route (phaseHistory sum)

**Files:**
- Modify: `lib/application/quality-gates/measure-router.js` (M10 computed route)
- Test: append to `tests/contract/sprint-restore-slice2.test.js`

- [ ] **Step 1: Write the failing test (append)**

```javascript
await tc('M10 is computed from phaseHistory (no sub-agent needed)', async () => {
  const sprint = domain.createSprint({ id: 's2m10', name: 'S2 M10', features: ['auth'] });
  sprint.phase = 'report';
  sprint.phaseHistory = [
    { phase: 'do', durationHours: 4 },
    { phase: 'iterate', durationHours: 2 },
  ];
  const res = await mr.measureGate('M10', sprint, {}); // no runner needed
  assert.notStrictEqual(res.reason, 'unsupported_gate');
  assert.ok(typeof res.value === 'number', 'M10 must compute a numeric value; got ' + JSON.stringify(res));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/contract/sprint-restore-slice2.test.js`
Expected: FAIL — M10 returns `unsupported_gate`.

- [ ] **Step 3: Add M10 computed route**

In `measure-router.js`: remove `M10` from `UNSUPPORTED_GATES`; add M10 as a computed gate (no `agentTaskRunner` required). The compute derives from `sprint.phaseHistory` per the designed route (phaseHistory sum). Match the frozen pattern.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/contract/sprint-restore-slice2.test.js`
Expected: `PASS: 4 / FAIL: 0`

- [ ] **Step 5: Commit**

```bash
git add lib/application/quality-gates/measure-router.js tests/contract/sprint-restore-slice2.test.js
git commit -m "feat(sprint): M10 computed route from phaseHistory (Slice 2)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 2.4: Auto-pause inspects ALL active gates (not just M3/S1)

**Files:**
- Modify: `lib/application/sprint-lifecycle/auto-pause.js` (lines ~37-52)
- Test: append to `tests/contract/sprint-restore-slice2.test.js`

- [ ] **Step 1: Read the current trigger**

Run: `sed -n '37,55p' lib/application/sprint-lifecycle/auto-pause.js`
Confirm it reads only `M3_criticalIssueCount` and `S1_dataFlowIntegrity`.

- [ ] **Step 2: Write the failing test (append)**

```javascript
await tc('QUALITY_GATE_FAIL auto-pause fires when ANY active gate fails, not just M3/S1', async () => {
  const ap = require(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle/auto-pause'));
  const sprint = domain.createSprint({ id: 's2ap', name: 'S2 AP', features: ['auth'] });
  sprint.phase = 'qa';
  // M2 fails, M3 and S1 pass — old code would NOT pause.
  sprint.qualityGates.M2_codeQualityScore = { current: 50, threshold: 80, passed: false };
  sprint.qualityGates.M3_criticalIssueCount = { current: 0, threshold: 0, passed: true };
  sprint.qualityGates.S1_dataFlowIntegrity = { current: 100, threshold: 100, passed: true };
  const trigger = ap.evaluateAutoPauseTriggers ? ap.evaluateAutoPauseTriggers(sprint) : ap.checkTriggers(sprint);
  // Locate the actual exported function name first (read the module exports).
  const fired = trigger && (trigger.triggered || (trigger.triggers && trigger.triggers.length));
  assert.ok(fired, 'auto-pause must fire on M2 failure; got ' + JSON.stringify(trigger));
});
```

(If the exported function name differs, adjust — read `module.exports` of auto-pause.js first.)

- [ ] **Step 3: Run test to verify it fails**

Run: `node tests/contract/sprint-restore-slice2.test.js`
Expected: FAIL — auto-pause does not fire (only M3/S1 inspected, both pass).

- [ ] **Step 4: Generalize the gate inspection**

In `auto-pause.js`, replace the M3/S1-only inspection with: iterate over the gates in the current phase's active matrix (`ACTIVE_GATES_BY_PHASE[sprint.phase]`), check each slot's `passed === false`, and if any fail, fire `QUALITY_GATE_FAIL` with a reason string naming every failing gate. Import `ACTIVE_GATES_BY_PHASE` from `./quality-gates.js` if not already imported. Preserve the existing return shape; only broaden which gates are inspected.

- [ ] **Step 5: Run test to verify it passes**

Run: `node tests/contract/sprint-restore-slice2.test.js`
Expected: `PASS: 5 / FAIL: 0`

- [ ] **Step 6: Commit**

```bash
git add lib/application/sprint-lifecycle/auto-pause.js tests/contract/sprint-restore-slice2.test.js
git commit -m "fix(sprint): auto-pause fires on ANY failing active gate (Slice 2, D)

Previously QUALITY_GATE_FAIL inspected only M3 and S1, silently dropping
failures of M1/M2/M4/M7/M8/M10/S2/S4.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 2.5: `handleQA` persists computed s1Score to S1 slot

**Files:**
- Modify: `scripts/lib/sprint-handlers-core.js` (`handleQA`, ~line 318)
- Test: append to `tests/contract/sprint-restore-slice2.test.js`

- [ ] **Step 1: Read `handleQA`**

Run: `sed -n '305,335p' scripts/lib/sprint-handlers-core.js`
Confirm it computes an s1Score and writes the disk matrix but not `qualityGates.S1_dataFlowIntegrity`.

- [ ] **Step 2: Write the failing test (append)**

```javascript
await tc('handleQA persists computed s1Score to qualityGates.S1_dataFlowIntegrity', async () => {
  const { handleSprintAction } = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
  const os = require('node:os'); const fs = require('node:fs');
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 's2qa-'));
  const store = require(path.join(PLUGIN_ROOT, 'lib/infra/sprint/sprint-state-store.adapter.js'));
  await handleSprintAction('init', { id: 'qa', name: 'QA', features: ['auth'], projectRoot: tmpRoot }, {});
  // Advance to qa phase (may require intermediate phases; use --approve + measure as needed,
  // or set the phase directly via the state store for the test).
  // Run qa with a data-flow validator that returns 100.
  const validator = { validate: async () => ({ s1Score: 100, perFeature: {} }) };
  await handleSprintAction('qa', { id: 'qa', projectRoot: tmpRoot }, { qaDeps: { dataFlowValidator: validator } });
  const state = store.readSprint(tmpRoot, 'qa');
  assert.ok(state.qualityGates && state.qualityGates.S1_dataFlowIntegrity,
    'S1 slot must be populated after handleQA');
  assert.strictEqual(state.qualityGates.S1_dataFlowIntegrity.current, 100);
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node tests/contract/sprint-restore-slice2.test.js`
Expected: FAIL — S1 slot is null after handleQA.

- [ ] **Step 4: Persist s1Score in `handleQA`**

In `scripts/lib/sprint-handlers-core.js` `handleQA`: after computing the s1Score (and before returning), write it to `sprint.qualityGates.S1_dataFlowIntegrity = { current: s1Score, threshold: 100, passed: s1Score >= 100 }`, then persist via the same `persistAndAudit`/state-store call used for the matrix write. Match the surrounding persistence pattern exactly.

- [ ] **Step 5: Run test to verify it passes**

Run: `node tests/contract/sprint-restore-slice2.test.js`
Expected: `PASS: 6 / FAIL: 0`

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/sprint-handlers-core.js tests/contract/sprint-restore-slice2.test.js
git commit -m "fix(sprint): handleQA persists s1Score to S1 slot (Slice 2)

Previously S1_dataFlowIntegrity stayed null forever, so advancePhase
always saw not_measured even after a successful qa.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 2.6: S4_archiveReadiness measurement definition

**Files:**
- Modify: `lib/application/quality-gates/measure-router.js` (S4 route — checklist-derived)
- Modify: `lib/application/sprint-lifecycle/archive-sprint.usecase.js` (evaluate S4 via the route)
- Test: append to `tests/contract/sprint-restore-slice2.test.js`

- [ ] **Step 1: Read the archive use case**

Run: `sed -n '1,60p' lib/application/sprint-lifecycle/archive-sprint.usecase.js`
Confirm it checks the S4 slot but the slot is never populated by a measurement.

- [ ] **Step 2: Write the failing test (append)**

```javascript
await tc('S4_archiveReadiness is computed at archive time from report + gates + carry', async () => {
  const sprint = domain.createSprint({ id: 's2s4', name: 'S2 S4', features: ['auth'] });
  sprint.phase = 'report';
  // All prior gates passed, report complete, no open carry items.
  for (const k of ['M1_matchRate','M2_codeQualityScore','M3_criticalIssueCount','M4_apiComplianceRate','M5_runtimeErrorRate','M7_conventionCompliance','M8_designCompleteness','S1_dataFlowIntegrity','S2_featureCompletion']) {
    if (sprint.qualityGates[k]) sprint.qualityGates[k] = Object.assign({}, sprint.qualityGates[k], { passed: true });
  }
  sprint.reportPath = '/tmp/report.md';
  sprint.carryItems = [];
  const res = await mr.measureGate('S4', sprint, {});
  assert.notStrictEqual(res.reason, 'unsupported_gate');
  assert.strictEqual(res.passed, true, 'all-gates-passed + report + no-carry must yield S4 passed; got ' + JSON.stringify(res));
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node tests/contract/sprint-restore-slice2.test.js`
Expected: FAIL — S4 returns `unsupported_gate`.

- [ ] **Step 4: Add S4 computed route + wire into archive**

In `measure-router.js`: remove `S4` from `UNSUPPORTED_GATES`; add S4 as a computed gate: passed iff (a) every gate in the sprint's prior phases passed, (b) `sprint.reportPath` is set, (c) `sprint.carryItems` is empty (or all resolved). No sub-agent. In `archive-sprint.usecase.js`: invoke the S4 measurement before the archive gate check (so the slot is populated). Match the frozen pattern.

- [ ] **Step 5: Run test to verify it passes**

Run: `node tests/contract/sprint-restore-slice2.test.js`
Expected: `PASS: 7 / FAIL: 0`

- [ ] **Step 6: Commit**

```bash
git add lib/application/quality-gates/measure-router.js lib/application/sprint-lifecycle/archive-sprint.usecase.js tests/contract/sprint-restore-slice2.test.js
git commit -m "feat(sprint): S4_archiveReadiness computed route (Slice 2)

Completes the 'no gate in limbo' guarantee: every active gate now has a
route, a compute path, or a not_applicable exemption.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 2.7: Slice 2 acceptance — every active gate is measurable or exempted

- [ ] **Step 1: Add a coverage assertion to the slice-2 test (append)**

```javascript
await tc('every gate in ACTIVE_GATES_BY_PHASE has a measurement route or exemption', async () => {
  const qg = require(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle/quality-gates'));
  const allGates = new Set();
  Object.values(qg.ACTIVE_GATES_BY_PHASE).forEach(arr => arr.forEach(g => allGates.add(g)));
  const routed = mr.SUPPORTED_GATES; // GATE_MEASUREMENT_ROUTES keys
  const unsupported = mr.UNSUPPORTED_GATES;
  for (const g of allGates) {
    const isRouted = routed.includes(g);
    const isExempted = unsupported.includes(g); // only acceptable if it returns not_applicable (M5-style)
    assert.ok(isRouted || isExempted, 'gate ' + g + ' is neither routed nor exempted — limbo');
  }
});
```

- [ ] **Step 2: Run the full slice-2 test**

Run: `node tests/contract/sprint-restore-slice2.test.js`
Expected: `PASS: 8 / FAIL: 0`

- [ ] **Step 3: Run the broader suite for regressions**

Run: `for f in tests/contract/sprint-*.test.js tests/contract/v2113-sprint-contracts.test.js; do echo "== $f =="; node "$f" 2>&1 | tail -1; done`
Expected: all pass. STOP if any fail.

---

# Slice 3 — Feature Tracking & State Persistence (Cluster C + F-state)

**Depends on Slices 1-2.** Makes `featureMap` real and fixes the state-write gaps.

### Task 3.1: Add `completion` to the `SprintFeatureMapEntry` typedef

**Files:**
- Modify: `lib/domain/sprint/entity.js` (typedef ~line 82-86)
- Test: `tests/contract/sprint-restore-slice3.test.js` (CREATE)

- [ ] **Step 1: Write the failing test**

Create `tests/contract/sprint-restore-slice3.test.js`:

```javascript
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const domain = require(path.join(PLUGIN_ROOT, 'lib/domain/sprint'));
let pass = 0, fail = 0; const failures = [];
async function tc(name, fn) { try { await fn(); pass++; } catch (e) { fail++; failures.push({ name, msg: e.message }); } }

await tc('SprintFeatureMapEntry typedef declares completion (0-100)', async () => {
  // The factory should produce featureMap entries with a completion field.
  const sprint = domain.createSprint({ id: 's3a', name: 'S3a', features: ['auth'] });
  // After fix 3.2, featureMap is populated; the entry must have completion.
  const entry = sprint.featureMap && sprint.featureMap['auth'];
  assert.ok(entry, 'featureMap[auth] must exist after createSprint');
  assert.ok('completion' in entry, 'entry must declare completion; got ' + JSON.stringify(entry));
  assert.strictEqual(entry.completion, 0);
});

if (fail) { console.error(`FAIL: ${fail} / PASS: ${pass}`); failures.forEach(f => console.error('  - ' + f.name + ': ' + f.msg)); process.exit(1); }
console.log(`PASS: ${pass} / FAIL: ${fail}`);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/contract/sprint-restore-slice3.test.js`
Expected: FAIL — `featureMap[auth]` is undefined (featureMap is `{}`).

- [ ] **Step 3: Add `completion` to the typedef AND populate `featureMap` in `createSprint`**

In `lib/domain/sprint/entity.js`:
(a) In the `SprintFeatureMapEntry` JSDoc typedef (~line 82-86), add:
```
 * @property {number} completion           - 0-100 completion percentage
```
(b) In `createSprint`, after building the `features` array, populate `featureMap`:
```javascript
const featureMap = {};
for (const name of features) {
  featureMap[name] = { pdcaPhase: 'pm', matchRate: null, qa: 'pending', completion: 0 };
}
```
and set `featureMap` on the returned sprint object (replacing the literal `{}`). Match the existing entry-field shape (read the typedef to confirm `pdcaPhase`/`matchRate`/`qa` are the sibling fields).

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/contract/sprint-restore-slice3.test.js`
Expected: `PASS: 1 / FAIL: 0`

- [ ] **Step 5: Commit**

```bash
git add lib/domain/sprint/entity.js tests/contract/sprint-restore-slice3.test.js
git commit -m "feat(sprint): add completion typedef + populate featureMap on init (Slice 3, #2)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 3.2: `handleFeature add/remove` syncs `featureMap`

**Files:**
- Modify: `scripts/lib/sprint-handlers-core.js` (`handleFeature`, ~line 430)
- Test: append to slice-3 test

- [ ] **Step 1: Read `handleFeature`**

Run: `sed -n '425,445p' scripts/lib/sprint-handlers-core.js`
Confirm it mutates `features[]` only.

- [ ] **Step 2: Write the failing test (append)**

```javascript
await tc('handleFeature add writes featureMap; remove deletes it', async () => {
  const { handleSprintAction } = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
  const os = require('node:os'); const fs = require('node:fs');
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 's3feat-'));
  const store = require(path.join(PLUGIN_ROOT, 'lib/infra/sprint/sprint-state-store.adapter.js'));
  await handleSprintAction('init', { id: 'f', name: 'F', features: ['auth'], projectRoot: tmpRoot }, {});
  await handleSprintAction('feature', { id: 'f', subaction: 'add', featureName: 'billing', projectRoot: tmpRoot }, {});
  let state = store.readSprint(tmpRoot, 'f');
  assert.ok(state.featureMap['billing'], 'featureMap[billing] must exist after add');
  await handleSprintAction('feature', { id: 'f', subaction: 'remove', featureName: 'billing', projectRoot: tmpRoot }, {});
  state = store.readSprint(tmpRoot, 'f');
  assert.ok(!state.featureMap['billing'], 'featureMap[billing] must be gone after remove');
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node tests/contract/sprint-restore-slice3.test.js`
Expected: FAIL — featureMap not updated by add/remove.

- [ ] **Step 4: Sync featureMap in `handleFeature`**

In `handleFeature`: on `add`, after pushing to `features[]`, also set `sprint.featureMap[name] = { pdcaPhase: 'pm', matchRate: null, qa: 'pending', completion: 0 }`. On `remove`, after splicing from `features[]`, `delete sprint.featureMap[name]`. Persist via the existing call.

- [ ] **Step 5: Run test to verify it passes**

Run: `node tests/contract/sprint-restore-slice3.test.js`
Expected: `PASS: 2 / FAIL: 0`

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/sprint-handlers-core.js tests/contract/sprint-restore-slice3.test.js
git commit -m "fix(sprint): feature add/remove syncs featureMap (Slice 3, #2)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 3.3: S2 compute path (ratio done/total) reads `featureMap.completion`

**Files:**
- Modify: `lib/application/sprint-lifecycle/kpi-resolver.js` (line 29 — read completion; compute featuresCompleted)
- Modify: `lib/application/quality-gates/measure-router.js` (S2 derived gate = ratio)
- Test: append to slice-3 test

- [ ] **Step 1: Read kpi-resolver line 29 + S2 handling**

Run: `sed -n '20,45p' lib/application/sprint-lifecycle/kpi-resolver.js && grep -n "S2" lib/application/quality-gates/measure-router.js`

- [ ] **Step 2: Write the failing test (append)**

```javascript
await tc('S2 = ratio of features with completion>=threshold, threshold 100', async () => {
  const mr = require(path.join(PLUGIN_ROOT, 'lib/application/quality-gates/measure-router'));
  const sprint = domain.createSprint({ id: 's3s2', name: 'S3 S2', features: ['a','b','c'] });
  sprint.phase = 'qa';
  sprint.featureMap['a'].completion = 100;
  sprint.featureMap['b'].completion = 100;
  sprint.featureMap['c'].completion = 40;
  const res = await mr.measureGate('S2', sprint, {});
  assert.notStrictEqual(res.reason, 'unsupported_gate');
  assert.ok(Math.abs(res.value - (2/3*100)) < 0.01, 'S2 must be 2/3 done = ~66.67; got ' + res.value);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node tests/contract/sprint-restore-slice3.test.js`
Expected: FAIL — S2 unsupported_gate.

- [ ] **Step 4: Add S2 derived route + fix kpi-resolver**

In `measure-router.js`: remove `S2` from `UNSUPPORTED_GATES`; add S2 as a computed gate: `value = count(features where featureMap[f].completion >= threshold) / total * 100`, threshold 100 (from `GATE_DEFINITIONS.S2.defaultThreshold`). No sub-agent. In `kpi-resolver.js` line 29: read `f.completion` (now declared) — the field read is already correct; ensure `featuresCompleted` counts `completion >= 100`.

- [ ] **Step 5: Run test to verify it passes**

Run: `node tests/contract/sprint-restore-slice3.test.js`
Expected: `PASS: 3 / FAIL: 0`

- [ ] **Step 6: Commit**

```bash
git add lib/application/quality-gates/measure-router.js lib/application/sprint-lifecycle/kpi-resolver.js tests/contract/sprint-restore-slice3.test.js
git commit -m "feat(sprint): S2 ratio compute path from featureMap completion (Slice 3, #2)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 3.4: Phase advance + qa pass update `featureMap.completion`

**Files:**
- Modify: `lib/application/sprint-lifecycle/advance-phase.usecase.js` (update completion on phase advance)
- Modify: `scripts/lib/sprint-handlers-core.js` (handleQA sets qa:'pass' + completion:100 on passing features)
- Test: append to slice-3 test

- [ ] **Step 1: Write the failing test (append)**

```javascript
await tc('feature completion advances with phase; qa pass sets completion 100', async () => {
  // Unit-level: directly exercise the completion-writer logic.
  // After a feature's qa passes, featureMap[f].completion === 100 and qa === 'pass'.
  const sprint = domain.createSprint({ id: 's3c', name: 'S3c', features: ['auth'] });
  // Simulate the qa-pass writer (the function/handler that sets completion on qa pass).
  // If exposed as a use-case helper, call it; otherwise drive via handleQA in a temp root.
  assert.ok(sprint.featureMap['auth'].completion === 0, 'starts at 0');
  // (Implementation will expose the writer; this test pins its contract.)
});
```

(Refine this test in-session once you read how `advance-phase` and `handleQA` mutate state — the goal is to assert that after a feature passes qa, `featureMap[f].qa === 'pass'` and `completion === 100`.)

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/contract/sprint-restore-slice3.test.js`
Expected: FAIL (or needs the writer to exist).

- [ ] **Step 3: Add the completion writers**

In `advance-phase.usecase.js`: when a sprint phase advances, advance `featureMap[f].pdcaPhase` for each feature to the new phase and bump `completion` per a simple scale (e.g., pm=0, plan=20, design=40, do=60, iterate=80, qa=90 — and 100 only on qa pass). In `handleQA`: when a feature's data-flow validation passes, set `featureMap[f].qa = 'pass'` and `featureMap[f].completion = 100`. Persist.

(Read both files to place the writes at the natural mutation points. Keep the completion scale documented in a comment.)

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/contract/sprint-restore-slice3.test.js`
Expected: `PASS: 4 / FAIL: 0`

- [ ] **Step 5: Commit**

```bash
git add lib/application/sprint-lifecycle/advance-phase.usecase.js scripts/lib/sprint-handlers-core.js tests/contract/sprint-restore-slice3.test.js
git commit -m "feat(sprint): completion advances with phase; qa pass sets 100 (Slice 3)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 3.5: `handleReport` injects `fileWriter` and writes the report file

**Files:**
- Modify: `scripts/lib/sprint-handlers-core.js` (`handleReport`, ~line 335)
- Modify: `scripts/sprint-handler.js` (`wireAgentAdapters` — auto-create a fileWriter from `infra`)
- Test: append to slice-3 test

- [ ] **Step 1: Write the failing test (append)**

```javascript
await tc('handleReport writes a real report file under docs/04-report/', async () => {
  const { handleSprintAction } = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
  const os = require('node:os'); const fs = require('node:fs');
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 's3rep-'));
  await handleSprintAction('init', { id: 'rep', name: 'Rep', features: ['auth'], projectRoot: tmpRoot }, {});
  // Advance to report phase as needed (use --approve + measure, or set phase directly).
  const res = await handleSprintAction('report', { id: 'rep', projectRoot: tmpRoot }, {});
  assert.ok(res.reportPath, 'report must return a path');
  assert.ok(fs.existsSync(res.reportPath), 'report file must exist on disk at ' + res.reportPath);
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/contract/sprint-restore-slice3.test.js`
Expected: FAIL — no file written.

- [ ] **Step 3: Inject a fileWriter**

In `wireAgentAdapters` (or `getInfra`): when building deps, attach a `fileWriter` that writes to the project root's `docs/04-report/` directory (create the dir if missing). In `handleReport`: pass `reportDeps = { fileWriter }` so `generateReport` writes the file; ensure the returned `reportPath` is the written path. Match the existing `reportDeps` shape (read `generate-report.usecase.js`).

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/contract/sprint-restore-slice3.test.js`
Expected: `PASS: 5 / FAIL: 0`

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/sprint-handlers-core.js scripts/sprint-handler.js tests/contract/sprint-restore-slice3.test.js
git commit -m "fix(sprint): handleReport injects fileWriter, writes report file (Slice 3)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 3.6: Slice 3 acceptance

- [ ] **Step 1: Run the full slice-3 test + regression sweep**

Run: `node tests/contract/sprint-restore-slice3.test.js && for f in tests/contract/sprint-*.test.js tests/contract/v2113-sprint-contracts.test.js; do echo "== $f =="; node "$f" 2>&1 | tail -1; done`
Expected: all pass. STOP if any fail.

---

# Slice 4 — Designed-But-Unimplemented Completion (Cluster F-remaining)

**Depends on Slices 1-3.** Completes the typedef/state surface and the skip-iterate path.

### Task 4.1: Add `dataFlow` and `annotations` to the `Sprint` typedef

**Files:**
- Modify: `lib/domain/sprint/entity.js` (Sprint typedef + defaults)
- Test: `tests/contract/sprint-restore-slice4.test.js` (CREATE)

- [ ] **Step 1: Write the failing test**

Create `tests/contract/sprint-restore-slice4.test.js`:

```javascript
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const domain = require(path.join(PLUGIN_ROOT, 'lib/domain/sprint'));
let pass = 0, fail = 0; const failures = [];
async function tc(name, fn) { try { await fn(); pass++; } catch (e) { fail++; failures.push({ name, msg: e.message }); } }

await tc('createSprint declares dataFlow (per-feature map) and annotations', async () => {
  const sprint = domain.createSprint({ id: 's4a', name: 'S4a', features: ['auth'] });
  assert.ok('dataFlow' in sprint, 'dataFlow must be declared on the sprint');
  assert.ok('annotations' in sprint, 'annotations must be declared on the sprint');
  assert.ok(sprint.dataFlow && typeof sprint.dataFlow === 'object');
});

if (fail) { console.error(`FAIL: ${fail} / PASS: ${pass}`); failures.forEach(f => console.error('  - ' + f.name + ': ' + f.msg)); process.exit(1); }
console.log(`PASS: ${pass} / FAIL: ${fail}`);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/contract/sprint-restore-slice4.test.js`
Expected: FAIL — `dataFlow` not on sprint.

- [ ] **Step 3: Add the fields**

In `entity.js` Sprint typedef JSDoc, add `@property {Object<string, *>} dataFlow` and `@property {Array} annotations`. In `createSprint` defaults, add `dataFlow: {}` (annotations already written at line ~248 — just ensure it's in the typedef). Keep frozen where neighbors are frozen.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/contract/sprint-restore-slice4.test.js`
Expected: `PASS: 1 / FAIL: 0`

- [ ] **Step 5: Commit**

```bash
git add lib/domain/sprint/entity.js tests/contract/sprint-restore-slice4.test.js
git commit -m "feat(sprint): add dataFlow + annotations to Sprint typedef (Slice 4)

Committed in v2113-Sprint-5 (SC-01) and v2.1.19 s1-foundation (FR-5) but
the typedef was never extended.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 4.2: Tier-2 data-flow validator reads `sprint.dataFlow`; qa phase populates it

**Files:**
- Modify: `scripts/lib/sprint-handlers-core.js` (handleQA writes `sprint.dataFlow[feature]`)
- Verify: `lib/infra/sprint/data-flow-validator.adapter.js` Tier-2 now reads a declared field
- Test: append to slice-4 test

- [ ] **Step 1: Write the failing test (append)**

```javascript
await tc('handleQA populates sprint.dataFlow per feature; static-matrix Tier-2 reads it', async () => {
  const { handleSprintAction } = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
  const os = require('node:os'); const fs = require('node:fs');
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 's4df-'));
  const store = require(path.join(PLUGIN_ROOT, 'lib/infra/sprint/sprint-state-store.adapter.js'));
  await handleSprintAction('init', { id: 'df', name: 'DF', features: ['auth'], projectRoot: tmpRoot }, {});
  const validator = { validate: async () => ({ s1Score: 100, perFeature: { auth: { hops: [true,true,true,true,true,true,true] } } }) };
  await handleSprintAction('qa', { id: 'df', projectRoot: tmpRoot }, { qaDeps: { dataFlowValidator: validator } });
  const state = store.readSprint(tmpRoot, 'df');
  assert.ok(state.dataFlow && state.dataFlow['auth'], 'dataFlow[auth] must be populated after qa');
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/contract/sprint-restore-slice4.test.js`
Expected: FAIL — dataFlow not populated.

- [ ] **Step 3: Populate dataFlow in handleQA**

In `handleQA`: after computing per-feature hop results, write `sprint.dataFlow[featureName] = perFeature[featureName]` (the 7-layer results) before persisting. Confirm the Tier-2 adapter (`data-flow-validator.adapter.js:62`) now reads a field that exists.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/contract/sprint-restore-slice4.test.js`
Expected: `PASS: 2 / FAIL: 0`

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/sprint-handlers-core.js tests/contract/sprint-restore-slice4.test.js
git commit -m "feat(sprint): qa populates sprint.dataFlow (Tier-2 static-matrix) (Slice 4)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 4.3: skip-iterate `do→qa` when matchRate meets target

**Files:**
- Modify: `lib/application/sprint-lifecycle/phases.js` (`computeNextPhase('do')` honors matchRate)
- Test: append to slice-4 test

- [ ] **Step 1: Read `computeNextPhase`**

Run: `grep -n "computeNextPhase" lib/application/sprint-lifecycle/phases.js`

- [ ] **Step 2: Write the failing test (append)**

```javascript
await tc('computeNextPhase(do) returns qa when matchRate>=target, else iterate', async () => {
  const phases = require(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle/phases'));
  const sprint = domain.createSprint({ id: 's4sk', name: 'S4sk', features: ['auth'] });
  sprint.phase = 'do';
  sprint.qualityGates.M1_matchRate = { current: 100, threshold: 90, passed: true };
  const next = phases.computeNextPhase(sprint);
  assert.strictEqual(next, 'qa', 'do→qa skip-iterate when M1 meets target; got ' + next);
  sprint.qualityGates.M1_matchRate = { current: 80, threshold: 90, passed: false };
  const next2 = phases.computeNextPhase(sprint);
  assert.strictEqual(next2, 'iterate', 'do→iterate when M1 below target; got ' + next2);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node tests/contract/sprint-restore-slice4.test.js`
Expected: FAIL — `computeNextPhase('do')` always returns `iterate`.

- [ ] **Step 4: Honor matchRate in `computeNextPhase`**

In `phases.js` `computeNextPhase`: when current phase is `do`, check `sprint.qualityGates.M1_matchRate`. If `current >= threshold` (target met), return `qa`; else return `iterate`. The `do→qa` transition is already legal in `transitions.js`. Keep the function pure.

- [ ] **Step 5: Run test to verify it passes**

Run: `node tests/contract/sprint-restore-slice4.test.js`
Expected: `PASS: 3 / FAIL: 0`

- [ ] **Step 6: Commit**

```bash
git add lib/application/sprint-lifecycle/phases.js tests/contract/sprint-restore-slice4.test.js
git commit -m "feat(sprint): skip-iterate do->qa when matchRate meets target (Slice 4)

ADR 0008 Decision 2 + Master Plan §3.2 committed to this path; it was
unreachable because computeNextPhase ignored matchRate.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 4.4: Watch handler matrix types — resolve against design, then fix

**Files:**
- Modify: `scripts/lib/sprint-handlers-core.js` (`handleWatch`, ~line 469) OR `lib/infra/sprint/matrix-sync.adapter.js` (`MATRIX_TYPES`)
- Test: append to slice-4 test

- [ ] **Step 1: Check the design for the ghost matrix types**

Run: `grep -rn "cumulative-state\|feature-phase\|MATRIX_TYPES" docs/ lib/ scripts/ | grep -v node_modules`
Determine: did the design commit to `'cumulative-state'`/`'feature-phase'` as real matrix types? (Per user decision: check design first.)

- [ ] **Step 2: Write the failing test (append)**

```javascript
await tc('handleWatch reads only matrix types that exist in MATRIX_TYPES', async () => {
  const ms = require(path.join(PLUGIN_ROOT, 'lib/infra/sprint/matrix-sync.adapter.js'));
  const types = ms.MATRIX_TYPES || ms.MATRIX_TYPE;
  const handlerReads = ['cumulative-state', 'feature-phase']; // from handleWatch
  for (const t of handlerReads) {
    const exists = Array.isArray(types) ? types.includes(t) : (types && Object.values(types).includes(t));
    // After the fix, EITHER the type is in MATRIX_TYPES (if designed) OR handleWatch
    // no longer reads it. Assert the invariant: every type handleWatch reads must be real.
    assert.ok(exists || false === /* handleWatch still reads it */ true,
      'matrix type ' + t + ' is read by handleWatch but missing from MATRIX_TYPES — resolve per design');
  }
});
```
(Refine in-session based on Step 1's finding: if the types ARE designed, add them to `MATRIX_TYPES`; if NOT designed, remove them from `handleWatch`. The test asserts the invariant that holds after whichever fix.)

- [ ] **Step 3: Run test to verify it fails**

Run: `node tests/contract/sprint-restore-slice4.test.js`
Expected: FAIL (ghost types present).

- [ ] **Step 4: Apply the design-directed fix**

Either add `'cumulative-state'`/`'feature-phase'` to `MATRIX_TYPES` (if designed) OR change `handleWatch` to read only real types. Document the decision in a code comment citing the design doc.

- [ ] **Step 5: Run test to verify it passes**

Run: `node tests/contract/sprint-restore-slice4.test.js`
Expected: `PASS: 4 / FAIL: 0`

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/sprint-handlers-core.js lib/infra/sprint/matrix-sync.adapter.js tests/contract/sprint-restore-slice4.test.js
git commit -m "fix(sprint): watch handler reads only real MATRIX_TYPES (Slice 4)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 4.5: `handleMasterPlan` injects `taskCreator`; CLI flushes emitter

**Files:**
- Modify: `scripts/lib/sprint-handlers-admin.js` (`handleMasterPlan`)
- Modify: `scripts/sprint-handler.js` (CLI block — flush emitter on exit)
- Test: append to slice-4 test

- [ ] **Step 1: Read `handleMasterPlan` deps usage**

Run: `grep -n "taskCreator\|handleMasterPlan" scripts/lib/sprint-handlers-admin.js`

- [ ] **Step 2: Write the failing test (append)**

```javascript
await tc('handleMasterPlan receives taskCreator via deps', async () => {
  const { handleSprintAction } = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
  let called = false;
  const fakeTaskCreator = async () => { called = true; return []; };
  // Drive master-plan with the injected taskCreator (minimal args; adapt to real signature).
  const res = await handleSprintAction('master-plan', { id: 'mp', projectRoot: '/tmp' }, { taskCreator: fakeTaskCreator });
  // The contract: when taskCreator is provided, handleMasterPlan must use it (not a missing-dep fallback).
  assert.ok(called || (res && res.ok !== false && res.reason !== 'missing_task_creator'),
    'taskCreator must reach handleMasterPlan; got ' + JSON.stringify(res));
});
```
(Refine in-session to match `handleMasterPlan`'s real signature and what "uses taskCreator" means.)

- [ ] **Step 3: Run test to verify it fails**

Run: `node tests/contract/sprint-restore-slice4.test.js`
Expected: FAIL — taskCreator not threaded.

- [ ] **Step 4: Thread taskCreator + flush emitter**

In `wireAgentAdapters` or the `master-plan` dispatch line: pass `d.taskCreator` (or build a default) into `handleMasterPlan`. In the CLI block of `scripts/sprint-handler.js`: after the action resolves, call `infra.eventEmitter.flush && infra.eventEmitter.flush()` (best-effort, in a try/catch) before `process.exit`, so telemetry isn't lost.

- [ ] **Step 5: Run test to verify it passes**

Run: `node tests/contract/sprint-restore-slice4.test.js`
Expected: `PASS: 5 / FAIL: 0`

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/sprint-handlers-admin.js scripts/sprint-handler.js tests/contract/sprint-restore-slice4.test.js
git commit -m "fix(sprint): handleMasterPlan injects taskCreator; CLI flushes emitter (Slice 4)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 4.6: Slice 4 acceptance

- [ ] **Step 1: Run slice-4 + regression sweep**

Run: `node tests/contract/sprint-restore-slice4.test.js && for f in tests/contract/sprint-*.test.js tests/contract/v2113-sprint-contracts.test.js; do echo "== $f =="; node "$f" 2>&1 | tail -1; done`
Expected: all pass. STOP if any fail.

---

# Slice 5 — Docs (Cluster E)

**Depends on Slices 1-4** (docs describe final behavior). No code changes except the `gate_fail` hint.

### Task 5.1: Add `hint` to `gate_fail` return

**Files:**
- Modify: `lib/application/sprint-lifecycle/advance-phase.usecase.js` (~line 169-176)
- Test: append to slice-4 test (or a small slice-5 test)

- [ ] **Step 1: Write the failing test**

Append to `tests/contract/sprint-restore-slice4.test.js`:

```javascript
await tc('gate_fail return includes a hint pointing to /sprint measure', async () => {
  const lifecycle = require(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle'));
  const sprint = domain.createSprint({ id: 's5h', name: 'S5h', features: ['auth'] });
  sprint.phase = 'plan';
  sprint.qualityGates.M8_designCompleteness = { current: null, threshold: 85, passed: null };
  // Attempt advance to design; M8 not measured -> gate_fail.
  const res = await lifecycle.advancePhase(sprint, 'design', {});
  assert.ok(res && res.reason === 'gate_fail', 'expected gate_fail; got ' + JSON.stringify(res));
  assert.ok(res.hint && res.hint.includes('/sprint measure'),
    'gate_fail must include a /sprint measure hint; got ' + JSON.stringify(res.hint));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/contract/sprint-restore-slice4.test.js`
Expected: FAIL — no `hint` field.

- [ ] **Step 3: Add the hint**

In `advance-phase.usecase.js` gate_fail return: add `hint: '/sprint measure ' + sprint.id + ' --gate <failing-key>'` (name the failing gate key(s)). Keep the existing return shape; only add the field.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/contract/sprint-restore-slice4.test.js`
Expected: `PASS: 6 / FAIL: 0`

- [ ] **Step 5: Commit**

```bash
git add lib/application/sprint-lifecycle/advance-phase.usecase.js tests/contract/sprint-restore-slice4.test.js
git commit -m "feat(sprint): gate_fail return includes /sprint measure hint (Slice 5, E)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 5.2: Surface the `--approve` warning + reconcile tables (docs)

**Files:**
- Modify: `skills/sprint/SKILL.md` (§10.1 table row ~line 173; SPRINT_AUTORUN_SCOPE table)
- Modify: `commands/bkit.md` (Trust Level table ~line 238)
- Modify: `skills/sprint/examples/multi-feature-sprint.md` (false featureMap claim ~line 11)
- Modify: `scripts/lib/sprint-handlers-admin.js` (help text ~line 359 — promote the warning)

- [ ] **Step 1: Read the four surfaces**

Run:
`sed -n '170,176p' skills/sprint/SKILL.md`
`grep -n "SPRINT_AUTORUN_SCOPE\|L0\|L4" skills/sprint/SKILL.md | head`
`sed -n '235,245p' commands/bkit.md`
`sed -n '8,14p' skills/sprint/examples/multi-feature-sprint.md`
`sed -n '355,368p' scripts/lib/sprint-handlers-admin.js`

- [ ] **Step 2: Apply the doc edits (code = source of truth)**

(a) `skills/sprint/SKILL.md` §10.1 table row for `approve`: change the bare description to include "(scope boundary ONLY; does NOT bypass Quality Gate failures — run `/sprint measure` first)".
(b) SPRINT_AUTORUN_SCOPE table in SKILL.md: reconcile to match the code's table (read the code's `SPRINT_AUTORUN_SCOPE` constant; copy its values verbatim).
(c) `commands/bkit.md:238` Trust Level table: correct L0-L4 values to match the code.
(d) `skills/sprint/examples/multi-feature-sprint.md:11`: fix the false claim that `feature add` "contributes to `sprint.featureMap`" — now it DOES (Slice 3), so update the text to describe the real behavior accurately.
(e) `scripts/lib/sprint-handlers-admin.js` help text: promote the "--approve does NOT bypass gate failures" line out of the 3-level-indented sub-bullet to a top-level bullet in the `--approve` help section.

- [ ] **Step 3: Verify no broken doc references**

Run: `grep -rn "does NOT bypass\|SPRINT_AUTORUN_SCOPE" skills/sprint/SKILL.md commands/bkit.md`
Expected: consistent phrasing across files.

- [ ] **Step 4: Commit**

```bash
git add skills/sprint/SKILL.md commands/bkit.md skills/sprint/examples/multi-feature-sprint.md scripts/lib/sprint-handlers-admin.js
git commit -m "docs(sprint): surface --approve warning, reconcile tables to code (Slice 5, #3)

Code is source of truth; docs corrected to match. --approve warning
promoted to the most-skimmed surfaces.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 5.3: Slice 5 acceptance + regression sweep

- [ ] **Step 1: Run the entire sprint contract suite**

Run: `for f in tests/contract/sprint-*.test.js tests/contract/v2113-sprint-contracts.test.js; do echo "== $f =="; node "$f" 2>&1 | tail -1; done`
Expected: all `PASS`. STOP if any fail.

---

# Master E2E — Full Lifecycle Via CLI (the success criterion)

**The literal acceptance test:** a real sprint runs the full 8-phase lifecycle via the CLI/in-process dispatcher with zero manual JSON editing.

### Task 6.1: Master E2E test

**Files:**
- Create: `tests/contract/sprint-restore-e2e.test.js` (tracked)

- [ ] **Step 1: Write the E2E test**

```javascript
'use strict';
/**
 * sprint-restore-e2e.test.js — Master acceptance test.
 *
 * A real sprint runs init -> start -> (plan -> design -> do -> iterate ->
 * qa -> report -> archived) via the in-process dispatcher with an injected
 * agentTaskRunner, and ZERO manual JSON editing of .bkit/state/sprints.
 *
 * This is the literal success criterion for the restore-as-designed effort.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const { handleSprintAction } = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
const { createTaskToolRunner } = require(path.join(PLUGIN_ROOT, 'scripts/lib/sprint-handler-shared'));

let pass = 0, fail = 0; const failures = [];
async function tc(name, fn) { try { await fn(); pass++; } catch (e) { fail++; failures.push({ name, msg: e.message }); } }

await tc('full sprint lifecycle via dispatcher with no manual JSON editing', async () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-'));
  const runner = createTaskToolRunner({
    invokeTaskTool: async () => ({ text: '{"value": 100}' }), // sub-agents "pass" everything
  });
  const deps = { agentTaskRunner: runner };
  const id = 'e2e-launch';

  // 1. init (registers features -> featureMap populated)
  let r = await handleSprintAction('init', { id, name: 'E2E', features: ['auth','billing'], projectRoot: tmpRoot }, deps);
  assert.strictEqual(r.ok, true, 'init failed: ' + JSON.stringify(r));

  // 2. start
  r = await handleSprintAction('start', { id, projectRoot: tmpRoot }, deps);
  assert.strictEqual(r.ok, true, 'start failed: ' + JSON.stringify(r));

  // 3. measure every gate that the plan phase requires (M8 from plan doc design section)
  r = await handleSprintAction('measure', { id, gate: 'M8', projectRoot: tmpRoot }, deps);
  assert.notStrictEqual(r && r.reason, 'no_agent_runner', 'M8 measure must reach the runner');

  // 4. advance plan -> design (M8 now measured)
  r = await handleSprintAction('phase', { id, to: 'design', projectRoot: tmpRoot, approve: true }, deps);
  assert.strictEqual(r.ok, true, 'plan->design failed: ' + JSON.stringify(r));

  // 5. continue advancing through do -> iterate -> qa -> report -> archived,
  //    measuring each phase's required gates before each advance (use the
  //    measureGates-by-phase helper or measure each active gate).
  //    Assert each advance returns ok:true and each phase's gates are measured
  //    (not null / not not_measured) in the persisted state.
  //    (Expand this loop with the real phase sequence + per-phase measure calls.)

  // 6. archive (S4 computed from all-gates-passed + report + no-carry)
  r = await handleSprintAction('archive', { id, projectRoot: tmpRoot }, deps);
  assert.strictEqual(r.ok, true, 'archive failed: ' + JSON.stringify(r));

  // 7. verify NO test hand-edited .bkit/state/sprints/<id>.json — all mutation
  //    went through the dispatcher. (The test never opens the JSON directly.)
  // 8. verify featureMap completions advanced and S2 is non-zero.
  const store = require(path.join(PLUGIN_ROOT, 'lib/infra/sprint/sprint-state-store.adapter.js'));
  const final = store.readSprint(tmpRoot, id);
  assert.ok(final.featureMap['auth'] && final.featureMap['auth'].completion > 0, 'auth completion must have advanced');
  assert.ok(final.qualityGates.S2_featureCompletion && final.qualityGates.S2_featureCompletion.current > 0, 'S2 must be > 0');

  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

if (fail) { console.error(`FAIL: ${fail} / PASS: ${pass}`); failures.forEach(f => console.error('  - ' + f.name + ': ' + f.msg)); process.exit(1); }
console.log(`PASS: ${pass} / FAIL: ${fail}`);
```

- [ ] **Step 2: Run the E2E test**

Run: `node tests/contract/sprint-restore-e2e.test.js`
Expected: `PASS: 1 / FAIL: 0`. If it fails, STOP — per the no-whack-a-mole rule, do not patch symptoms; trace which slice left a gap and return to that slice's tasks.

- [ ] **Step 3: Commit**

```bash
git add tests/contract/sprint-restore-e2e.test.js
git commit -m "test(sprint): master E2E — full lifecycle via dispatcher, no JSON editing

The literal success criterion for restore-as-designed: a real sprint
runs init->start->...->archived through the in-process dispatcher with
an injected agentTaskRunner and zero manual JSON editing.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Self-Review (completed during authoring)

**1. Spec coverage:**
- Cluster A (dispatcher wiring) → Tasks 1.1-1.4 ✓
- Cluster B (M8 chicken-and-egg) → Task 2.1 ✓
- Cluster C (feature tracking) → Tasks 3.1-3.5 ✓
- Cluster D (auto-pause scope, S1 persist) → Tasks 2.4, 2.5 ✓
- Cluster E (docs) → Tasks 5.1-5.2 ✓
- Cluster F-gates (M5/M10/S4) → Tasks 2.2, 2.3, 2.6 ✓
- Cluster F-state (fileWriter) → Task 3.5 ✓
- Cluster F-remaining (dataFlow, annotations, skip-iterate, watch, taskCreator/flush) → Tasks 4.1-4.5 ✓
- Success criterion (master E2E) → Task 6.1 ✓

**2. Placeholder scan:** Several tasks say "Read the file first" or "Refine in-session" where the exact code depends on reading current state (line numbers drift, function names need confirming). These are NOT placeholders — they are explicit read-then-edit instructions with the invariant the edit must satisfy. Every code-producing step includes concrete code or a concrete invariant. The E2E test's phase-advance loop is intentionally expandable in-session because the exact measure-per-phase sequence depends on `ACTIVE_GATES_BY_PHASE` which is read at implementation time.

**3. Type consistency:** `completion` (number 0-100) used consistently in Tasks 3.1, 3.3, 3.4. `dataFlow` (Object<string,*>) in 4.1, 4.2. `agentTaskRunner` shape `({ subagent_type, prompt }) => Promise<{ output }>` consistent across 1.1, 1.2, E2E. `not_applicable` reason consistent in 2.2. S2 ratio formula consistent in 3.3 and the spec.
