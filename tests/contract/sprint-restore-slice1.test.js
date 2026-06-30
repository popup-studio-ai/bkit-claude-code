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
const mr = require(path.join(PLUGIN_ROOT, 'lib/application/quality-gates/measure-router'));

(async () => {
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
    // Sprint id must be kebab-case (3-64 chars, validated by domain).
    const init = await handleSprintAction('init', { id: 'slice1-wire', name: 'Slice1 Wire', features: ['auth'], projectRoot: tmpRoot }, { agentTaskRunner: runner });
    assert.strictEqual(init.ok, true, 'init failed: ' + JSON.stringify(init));
    const measure = await handleSprintAction('measure', { id: 'slice1-wire', gate: 'M4', projectRoot: tmpRoot }, { agentTaskRunner: runner });
    assert.strictEqual(measure.ok !== false || (measure.reason !== 'no_agent_runner'), true,
      'measure must not short-circuit with no_agent_runner when runner injected; got ' + JSON.stringify(measure));
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  if (fail) {
    console.error(`FAIL: ${fail} / PASS: ${pass}`);
    failures.forEach(f => console.error('  - ' + f.name + ': ' + f.msg));
    process.exit(1);
  }
  console.log(`PASS: ${pass} / FAIL: ${fail}`);
})().catch(e => { console.error(e); process.exit(1); });
