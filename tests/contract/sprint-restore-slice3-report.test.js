'use strict';
/**
 * sprint-restore-slice3-report.test.js — Slice 3, Task 3.5: handleReport
 * injects fileWriter + persists docs.report.
 *
 * Verifies that:
 *   - The report markdown is written to disk by the production handler.
 *   - sprint.docs.report is persisted so the S4 archiveReadiness gate can fire.
 *   - Caller-supplied reportDeps.fileWriter overrides the built-in writer
 *     (test-injection contract).
 *   - generateReport (use-case level) still works without a writer and
 *     produces an in-memory report without writing to disk.
 *
 * Top-level await is wrapped in an async IIFE (CommonJS, no "type":"module").
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const { handleSprintAction } = require(path.join(PLUGIN_ROOT, 'scripts/sprint-handler'));
const lifecycle = require(path.join(PLUGIN_ROOT, 'lib/application/sprint-lifecycle'));
const domain = require(path.join(PLUGIN_ROOT, 'lib/domain/sprint'));

let pass = 0, fail = 0;
const failures = [];
async function tc(name, fn) {
  try { await fn(); pass++; } catch (e) { fail++; failures.push({ name, msg: e.message }); }
}

function makeTmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 's3report-'));
}

function readPersistedState(tmpRoot, id) {
  return JSON.parse(
    fs.readFileSync(path.join(tmpRoot, '.bkit/state/sprints', id + '.json'), 'utf8')
  );
}

(async () => {

await tc('handleReport writes the report markdown to disk', async () => {
  const tmpRoot = makeTmpRoot();
  const id = 'slice3-report-write';
  try {
    await handleSprintAction('init',
      { id, name: 'S3 RW', features: ['auth'], projectRoot: tmpRoot }, {});
    const reportPath = path.join(tmpRoot, 'report-' + id + '.md');
    const res = await handleSprintAction('report',
      { id, projectRoot: tmpRoot },
      { reportDeps: { docPathResolver: () => reportPath } });
    assert.ok(res.ok, 'report must succeed; got ' + JSON.stringify(res));
    assert.ok(typeof res.reportContent === 'string' && res.reportContent.length > 0,
      'reportContent must be a non-empty string');
    assert.ok(/# Sprint Report/.test(res.reportContent),
      'reportContent must contain "# Sprint Report"; got head:\n' + res.reportContent.slice(0, 200));
    assert.strictEqual(res.reportPath, reportPath,
      'reportPath must equal the resolver-supplied path');
    assert.strictEqual(fs.existsSync(reportPath), true,
      'the report file must actually exist on disk after the handler runs');
    const onDisk = fs.readFileSync(reportPath, 'utf8');
    assert.strictEqual(onDisk, res.reportContent,
      'on-disk contents must match the in-memory reportContent exactly');
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

await tc('handleReport persists sprint.docs.report after a real write', async () => {
  const tmpRoot = makeTmpRoot();
  const id = 'slice3-report-persist';
  try {
    await handleSprintAction('init',
      { id, name: 'S3 RP', features: ['auth'], projectRoot: tmpRoot }, {});
    const reportPath = path.join(tmpRoot, 'report-' + id + '.md');
    const res = await handleSprintAction('report',
      { id, projectRoot: tmpRoot },
      { reportDeps: { docPathResolver: () => reportPath } });
    assert.ok(res.ok, 'report must succeed');
    assert.strictEqual(res.docsReportPersisted, true,
      'docsReportPersisted flag must be true when a real write happened');
    const state = readPersistedState(tmpRoot, id);
    assert.strictEqual(state.docs.report, reportPath,
      'persisted sprint.docs.report must equal reportPath; got ' +
      JSON.stringify(state.docs && state.docs.report));
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

await tc('handleReport honors a caller-supplied fileWriter override (test-injectable)', async () => {
  const tmpRoot = makeTmpRoot();
  const id = 'slice3-report-override';
  try {
    await handleSprintAction('init',
      { id, name: 'S3 RO', features: ['auth'], projectRoot: tmpRoot }, {});
    const capturedCalls = [];
    const overridePath = path.join(tmpRoot, 'r.md');
    const res = await handleSprintAction('report',
      { id, projectRoot: tmpRoot },
      { reportDeps: {
          fileWriter: async (p, c) => { capturedCalls.push({ p: p, c: c }); },
          docPathResolver: () => overridePath,
        } });
    assert.ok(res.ok, 'report must succeed');
    assert.strictEqual(capturedCalls.length, 1,
      'the override fileWriter must be called exactly once; got ' + capturedCalls.length);
    assert.strictEqual(capturedCalls[0].p, overridePath,
      'override must receive the resolver-supplied path');
    assert.strictEqual(capturedCalls[0].c, res.reportContent,
      'override must receive the rendered reportContent');
    // The built-in writer must NOT have been used: the override captured
    // instead of writing, so the file at reportPath need not exist on disk.
    assert.strictEqual(fs.existsSync(overridePath), false,
      'the built-in writer must not run when the caller supplies its own');
    assert.strictEqual(res.docsReportPersisted, true,
      'docsReportPersisted must still be true: a fileWriter WAS used ' +
      '(the override) and reportPath is set');
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

await tc('generateReport works without a fileWriter — in-memory only, nothing written', async () => {
  // The production handler ALWAYS builds a default writer, so the no-write
  // branch can only be observed at the use-case level. This documents that
  // generateReport stays correct (returns content) when no writer is injected.
  const tmpRoot = makeTmpRoot();
  try {
    const sprint = domain.createSprint({ id: 'slice3-noop', name: 'S3 NW', features: ['auth'] });
    const reportPath = path.join(tmpRoot, 'never-written.md');
    const res = await lifecycle.generateReport(sprint, {
      docPathResolver: () => reportPath,
    });
    assert.ok(res.ok, 'generateReport must succeed without a fileWriter');
    assert.ok(typeof res.reportContent === 'string' && res.reportContent.length > 0,
      'generateReport must still return a non-empty in-memory report');
    assert.strictEqual(fs.existsSync(reportPath), false,
      'no file must exist on disk when no writer was supplied');
    assert.ok(!('docsReportPersisted' in res),
      'use case must not set docsReportPersisted (handler-only concern)');
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

await tc('handleReport does NOT persist docs.report when caller overrides fileWriter:null', async () => {
  // Regression: the persistence guard previously checked the local built-in
  // fileWriter const (always truthy) instead of the merged reportDeps.fileWriter
  // that generateReport actually used. With fileWriter:null, generateReport
  // writes nothing, but the buggy guard still set docs.report = reportPath,
  // producing a phantom path that S4 archiveReadiness would treat as "ready".
  const tmpRoot = makeTmpRoot();
  const id = 'slice3-report-null-writer';
  try {
    await handleSprintAction('init',
      { id, name: 'S3 NL', features: ['auth'], projectRoot: tmpRoot }, {});
    const resolverPath = path.join(tmpRoot, 'phantom-' + id + '.md');
    const res = await handleSprintAction('report',
      { id, projectRoot: tmpRoot },
      { reportDeps: { fileWriter: null, docPathResolver: () => resolverPath } });
    assert.ok(res.ok,
      'report must still succeed in-memory without a writer; got ' +
      JSON.stringify(res));
    assert.ok(!res.docsReportPersisted,
      'docsReportPersisted must be falsy when fileWriter:null — the bug ' +
      'previously set this to true; got ' + res.docsReportPersisted);
    const state = readPersistedState(tmpRoot, id);
    assert.ok(!state.docs || state.docs.report !== res.reportPath,
      'persisted docs.report must NOT be set to the resolver path when no ' +
      'file was written; got ' + JSON.stringify(state.docs && state.docs.report));
    assert.strictEqual(fs.existsSync(resolverPath), false,
      'no file must exist on disk at the resolver path — generateReport ' +
      'received fileWriter:null and must not have written anything');
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

if (fail) {
  console.error(`FAIL: ${fail} / PASS: ${pass}`);
  failures.forEach(f => console.error('  - ' + f.name + ': ' + f.msg));
  process.exit(1);
}
console.log(`PASS: ${pass} / FAIL: ${fail}`);

})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });
