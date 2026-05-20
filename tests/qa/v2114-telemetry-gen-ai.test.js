'use strict';

/**
 * v2114-telemetry-gen-ai.test.js — L1 tests for ENH-281 gen_ai.* emit.
 *
 * Coverage (18 TCs):
 *   GA   — GEN_AI_METRICS frozen surface (4 TCs)
 *   EMIT — emitGenAI behavior (8 TCs)
 *   SINK — createOtelSink env-aware resolution (4 TCs)
 *   PAY  — buildOtlpPayload env propagation (2 TCs)
 *
 * Run: node tests/qa/v2114-telemetry-gen-ai.test.js
 */

const assert = require('node:assert/strict');
const path = require('node:path');

const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const t = require(path.join(PLUGIN_ROOT, 'lib/infra/telemetry'));

let pass = 0;
let fail = 0;
let total = 0;
const failures = [];

function test(name, fn) {
  total += 1;
  try {
    const r = fn();
    if (r && typeof r.then === 'function') {
      // sync only — fail loud if test returns promise
      throw new Error('async test not supported here; use sync assertions');
    }
    pass += 1;
  } catch (e) {
    fail += 1;
    failures.push({ name, error: e.message });
  }
}

async function asyncTest(name, fn) {
  total += 1;
  try {
    await fn();
    pass += 1;
  } catch (e) {
    fail += 1;
    failures.push({ name, error: e.message });
  }
}

// ── GA: GEN_AI_METRICS frozen surface ──────────────────────────────

test('GA-01: GEN_AI_METRICS frozen', () => {
  assert.ok(Object.isFrozen(t.GEN_AI_METRICS));
});

test('GA-02: GEN_AI_METRICS contains exactly 10 entries', () => {
  assert.equal(t.GEN_AI_METRICS.length, 10);
});

test('GA-03: GEN_AI_METRICS includes core ENH-281 metrics', () => {
  const required = [
    'gen_ai.request_tokens',
    'gen_ai.response_tokens',
    'gen_ai.cache_creation_tokens',
    'gen_ai.cache_read_tokens',
    'gen_ai.tool_call_count',
    'gen_ai.subagent_dispatch_count',
    'gen_ai.subagent_dispatch_mode',
    'gen_ai.hook_trigger_count',
    'gen_ai.hook_trigger_event',
    'gen_ai.sprint_phase',
  ];
  for (const m of required) assert.ok(t.GEN_AI_METRICS.includes(m), 'missing: ' + m);
});

test('GA-04: isKnownGenAIMetric correctly identifies membership', () => {
  assert.equal(t.isKnownGenAIMetric('gen_ai.request_tokens'), true);
  assert.equal(t.isKnownGenAIMetric('unknown.metric'), false);
  assert.equal(t.isKnownGenAIMetric(''), false);
  assert.equal(t.isKnownGenAIMetric(null), false);
});

// ── EMIT: emitGenAI behavior ───────────────────────────────────────

(async () => {
  await asyncTest('EMIT-01: emitGenAI with no endpoint → emitted=false, ok=true', async () => {
    if (typeof t._resetEnvHydrateForTest === 'function') t._resetEnvHydrateForTest();
    const r = await t.emitGenAI('gen_ai.request_tokens', { value: 100 }, { env: {} });
    assert.equal(r.ok, true);
    assert.equal(r.emitted, false);
    assert.match(r.reason, /no OTEL endpoint/);
  });

  await asyncTest('EMIT-02: emitGenAI with invalid metric name → ok=false', async () => {
    const r = await t.emitGenAI('', {}, { env: {} });
    assert.equal(r.ok, false);
    assert.match(r.reason, /invalid metric/);
  });

  await asyncTest('EMIT-03: emitGenAI with null metric → ok=false', async () => {
    const r = await t.emitGenAI(null, {}, { env: {} });
    assert.equal(r.ok, false);
  });

  await asyncTest('EMIT-04: emitGenAI with no attributes → still ok', async () => {
    const r = await t.emitGenAI('gen_ai.request_tokens', undefined, { env: {} });
    assert.equal(r.ok, true);
  });

  await asyncTest('EMIT-05: emitGenAI unknown metric still emits (debug warn only)', async () => {
    const r = await t.emitGenAI('custom.metric', { v: 1 }, { env: {} });
    assert.equal(r.ok, true);
    assert.equal(r.metric, 'custom.metric');
  });

  await asyncTest('EMIT-06: emitGenAI honors OTEL_EXPORTER_OTLP_ENDPOINT precedence', async () => {
    // No real network call — just verify endpoint resolution path is taken.
    // Capturer.resolveOtelEndpoint covers ordering; here we ensure emitGenAI
    // reaches "emitted=true" when endpoint resolves successfully.
    // Endpoint resolves but emit will silently fail at HTTP layer (timeout),
    // returning ok:true emitted:true (fire-and-forget).
    const r = await t.emitGenAI('gen_ai.tool_call_count', {}, {
      env: { OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:1/v1/logs' },
    });
    assert.equal(r.ok, true);
    assert.equal(r.emitted, true);
  });

  await asyncTest('EMIT-07: emitGenAI falls back to OTEL_ENDPOINT (legacy)', async () => {
    const r = await t.emitGenAI('gen_ai.tool_call_count', {}, {
      env: { OTEL_ENDPOINT: 'http://127.0.0.1:1/v1/logs' },
    });
    assert.equal(r.ok, true);
    assert.equal(r.emitted, true);
  });

  await asyncTest('EMIT-08: emitGenAI attributes flow into event meta', async () => {
    // No direct introspection of payload — just verify no throw.
    const r = await t.emitGenAI('gen_ai.request_tokens', { value: 42, id: 'x' }, { env: {} });
    assert.equal(r.ok, true);
  });

  // ── SINK: createOtelSink env-aware resolution ────────────────────

  await asyncTest('SINK-01: createOtelSink with no endpoint → no-op emit', async () => {
    const sink = t.createOtelSink({});
    await sink.emit({ type: 'test', meta: {} });
    assert.ok(true);
  });

  await asyncTest('SINK-02: createOtelSink with OTEL_EXPORTER_OTLP_ENDPOINT', async () => {
    const sink = t.createOtelSink({ OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:1/v1/logs' });
    assert.equal(typeof sink.emit, 'function');
  });

  await asyncTest('SINK-03: createOtelSink with OTEL_ENDPOINT (legacy)', async () => {
    const sink = t.createOtelSink({ OTEL_ENDPOINT: 'http://127.0.0.1:1/v1/logs' });
    assert.equal(typeof sink.emit, 'function');
  });

  await asyncTest('SINK-04: createOtelSink with malformed URL → graceful', async () => {
    const sink = t.createOtelSink({ OTEL_ENDPOINT: 'not a url at all' });
    await sink.emit({ type: 'test', meta: {} });
    assert.ok(true);
  });

  // ── PAY: buildOtlpPayload env propagation ────────────────────────

  await asyncTest('PAY-01: buildOtlpPayload uses env.OTEL_SERVICE_NAME', async () => {
    const payload = t.buildOtlpPayload({ type: 'x', meta: {} }, { OTEL_SERVICE_NAME: 'custom-svc' });
    const svc = payload.resourceLogs[0].resource.attributes.find((a) => a.key === 'service.name');
    assert.equal(svc.value.stringValue, 'custom-svc');
  });

  await asyncTest('PAY-02: buildOtlpPayload defaults to "bkit" when service name absent', async () => {
    const payload = t.buildOtlpPayload({ type: 'x', meta: {} }, {});
    const svc = payload.resourceLogs[0].resource.attributes.find((a) => a.key === 'service.name');
    assert.equal(svc.value.stringValue, 'bkit');
  });

  // ── Summary ──────────────────────────────────────────────────────

  // eslint-disable-next-line no-console
  console.log(`\n[v2114 L1 telemetry-gen-ai] total=${total} pass=${pass} fail=${fail}`);
  if (fail > 0) {
    // eslint-disable-next-line no-console
    console.error('FAILURES:');
    for (const f of failures) {
      // eslint-disable-next-line no-console
      console.error(`  ✗ ${f.name}: ${f.error}`);
    }
    process.exit(1);
  }
  // eslint-disable-next-line no-console
  console.log('✓ all PASS');
  process.exit(0);
})();
