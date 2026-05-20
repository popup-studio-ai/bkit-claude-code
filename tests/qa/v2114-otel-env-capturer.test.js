'use strict';

/**
 * v2114-otel-env-capturer.test.js — L1 tests for ENH-293 otel-env-capturer.
 *
 * Coverage (20 TCs):
 *   CAP — captureEnv pure logic (7 TCs)
 *   HYD — hydrateEnv (6 TCs)
 *   RT  — roundtrip + endpoint resolution (5 TCs)
 *   API — frozen constants + module surface (2 TCs)
 *
 * Run: node tests/qa/v2114-otel-env-capturer.test.js
 */

const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const capturer = require(path.join(PLUGIN_ROOT, 'lib/infra/otel-env-capturer'));

let pass = 0;
let fail = 0;
let total = 0;
const failures = [];

function test(name, fn) {
  total += 1;
  try {
    fn();
    pass += 1;
  } catch (e) {
    fail += 1;
    failures.push({ name, error: e.message });
  }
}

function mkTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-otel-env-'));
}

function cleanupRoot(root) {
  try { fs.rmSync(root, { recursive: true, force: true }); } catch (_) { /* graceful */ }
}

// ── CAP: captureEnv ────────────────────────────────────────────────

test('CAP-01: captureEnv with empty env → count=0', () => {
  const root = mkTempRoot();
  try {
    const r = capturer.captureEnv({}, { root });
    assert.equal(r.ok, true);
    assert.equal(r.count, 0);
    assert.deepEqual(r.captured, []);
  } finally { cleanupRoot(root); }
});

test('CAP-02: captureEnv with OTEL_ENDPOINT only → count=1', () => {
  const root = mkTempRoot();
  try {
    const r = capturer.captureEnv({ OTEL_ENDPOINT: 'https://collector/' }, { root });
    assert.equal(r.ok, true);
    assert.equal(r.count, 1);
    assert.deepEqual(r.captured, ['OTEL_ENDPOINT']);
  } finally { cleanupRoot(root); }
});

test('CAP-03: captureEnv writes JSON file at canonical path', () => {
  const root = mkTempRoot();
  try {
    capturer.captureEnv({ OTEL_SERVICE_NAME: 'bkit' }, { root });
    const file = path.join(root, '.bkit/runtime/otel-env.json');
    assert.ok(fs.existsSync(file));
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(parsed.env.OTEL_SERVICE_NAME, 'bkit');
    assert.ok(parsed.capturedAt);
    assert.ok(parsed.version);
  } finally { cleanupRoot(root); }
});

test('CAP-04: captureEnv skips non-OTEL vars', () => {
  const root = mkTempRoot();
  try {
    const r = capturer.captureEnv({ HOME: '/foo', PATH: '/bar', OTEL_ENDPOINT: 'https://x' }, { root });
    assert.equal(r.count, 1);
    assert.ok(!r.captured.includes('HOME'));
    assert.ok(!r.captured.includes('PATH'));
  } finally { cleanupRoot(root); }
});

test('CAP-05: captureEnv skips empty string values', () => {
  const root = mkTempRoot();
  try {
    const r = capturer.captureEnv({ OTEL_ENDPOINT: '', OTEL_SERVICE_NAME: 'bkit' }, { root });
    assert.equal(r.count, 1);
    assert.deepEqual(r.captured, ['OTEL_SERVICE_NAME']);
  } finally { cleanupRoot(root); }
});

test('CAP-06: captureEnv captures all 8 tracked vars', () => {
  const root = mkTempRoot();
  try {
    const allEnv = {};
    for (const k of capturer.OTEL_ENV_VARS) allEnv[k] = 'v-' + k;
    const r = capturer.captureEnv(allEnv, { root });
    assert.equal(r.count, 8);
  } finally { cleanupRoot(root); }
});

test('CAP-07: captureEnv uses atomic rename pattern (no .tmp leftover)', () => {
  const root = mkTempRoot();
  try {
    capturer.captureEnv({ OTEL_ENDPOINT: 'https://x' }, { root });
    const dir = path.join(root, '.bkit/runtime');
    const tmpExists = fs.readdirSync(dir).some((f) => f.endsWith('.tmp'));
    assert.equal(tmpExists, false);
  } finally { cleanupRoot(root); }
});

// ── HYD: hydrateEnv ────────────────────────────────────────────────

test('HYD-01: hydrateEnv with no file → ok:false', () => {
  const root = mkTempRoot();
  try {
    const r = capturer.hydrateEnv({ root, target: {} });
    assert.equal(r.ok, false);
    assert.match(r.error, /missing/);
  } finally { cleanupRoot(root); }
});

test('HYD-02: hydrateEnv restores captured vars', () => {
  const root = mkTempRoot();
  try {
    capturer.captureEnv({ OTEL_ENDPOINT: 'https://col/', OTEL_SERVICE_NAME: 'bkit' }, { root });
    const target = {};
    const r = capturer.hydrateEnv({ root, target });
    assert.equal(r.ok, true);
    assert.equal(target.OTEL_ENDPOINT, 'https://col/');
    assert.equal(target.OTEL_SERVICE_NAME, 'bkit');
  } finally { cleanupRoot(root); }
});

test('HYD-03: hydrateEnv preserves existing target vars (no overwrite)', () => {
  const root = mkTempRoot();
  try {
    capturer.captureEnv({ OTEL_ENDPOINT: 'https://new/' }, { root });
    const target = { OTEL_ENDPOINT: 'https://existing/' };
    const r = capturer.hydrateEnv({ root, target });
    assert.equal(target.OTEL_ENDPOINT, 'https://existing/');
    assert.deepEqual(r.skipped, ['OTEL_ENDPOINT']);
  } finally { cleanupRoot(root); }
});

test('HYD-04: hydrateEnv with overwrite:true replaces existing', () => {
  const root = mkTempRoot();
  try {
    capturer.captureEnv({ OTEL_ENDPOINT: 'https://new/' }, { root });
    const target = { OTEL_ENDPOINT: 'https://existing/' };
    capturer.hydrateEnv({ root, target, overwrite: true });
    assert.equal(target.OTEL_ENDPOINT, 'https://new/');
  } finally { cleanupRoot(root); }
});

test('HYD-05: hydrateEnv handles malformed JSON gracefully', () => {
  const root = mkTempRoot();
  try {
    const dir = path.join(root, '.bkit/runtime');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'otel-env.json'), 'not json {{{', 'utf8');
    const r = capturer.hydrateEnv({ root, target: {} });
    assert.equal(r.ok, false);
    assert.ok(r.error);
  } finally { cleanupRoot(root); }
});

test('HYD-06: hydrateEnv reports skipped + hydrated separately', () => {
  const root = mkTempRoot();
  try {
    capturer.captureEnv({ OTEL_ENDPOINT: 'https://a/', OTEL_SERVICE_NAME: 'b' }, { root });
    const target = { OTEL_ENDPOINT: 'preset' };
    const r = capturer.hydrateEnv({ root, target });
    assert.deepEqual(r.hydrated, ['OTEL_SERVICE_NAME']);
    assert.deepEqual(r.skipped, ['OTEL_ENDPOINT']);
  } finally { cleanupRoot(root); }
});

// ── RT: roundtrip + endpoint resolution ───────────────────────────

test('RT-01: capture → hydrate roundtrip preserves all 8 vars', () => {
  const root = mkTempRoot();
  try {
    const src = {};
    for (const k of capturer.OTEL_ENV_VARS) src[k] = 'v-' + k;
    capturer.captureEnv(src, { root });
    const target = {};
    capturer.hydrateEnv({ root, target });
    for (const k of capturer.OTEL_ENV_VARS) assert.equal(target[k], 'v-' + k);
  } finally { cleanupRoot(root); }
});

test('RT-02: resolveOtelEndpoint prefers OTEL_EXPORTER_OTLP_ENDPOINT', () => {
  const r = capturer.resolveOtelEndpoint({
    OTEL_EXPORTER_OTLP_ENDPOINT: 'https://standard/',
    OTEL_ENDPOINT: 'https://legacy/',
  });
  assert.equal(r, 'https://standard/');
});

test('RT-03: resolveOtelEndpoint falls back to OTEL_ENDPOINT', () => {
  const r = capturer.resolveOtelEndpoint({ OTEL_ENDPOINT: 'https://legacy/' });
  assert.equal(r, 'https://legacy/');
});

test('RT-04: resolveOtelEndpoint returns null when neither set', () => {
  assert.equal(capturer.resolveOtelEndpoint({}), null);
});

test('RT-05: resolveOtelEndpoint trims whitespace + ignores empty', () => {
  assert.equal(capturer.resolveOtelEndpoint({ OTEL_ENDPOINT: '  ' }), null);
  assert.equal(capturer.resolveOtelEndpoint({ OTEL_ENDPOINT: '  https://x/  ' }), 'https://x/');
});

// ── API: frozen surface ────────────────────────────────────────────

test('API-01: OTEL_ENV_VARS frozen + 8 entries', () => {
  assert.ok(Object.isFrozen(capturer.OTEL_ENV_VARS));
  assert.equal(capturer.OTEL_ENV_VARS.length, 8);
  assert.ok(capturer.OTEL_ENV_VARS.includes('OTEL_ENDPOINT'));
  assert.ok(capturer.OTEL_ENV_VARS.includes('OTEL_EXPORTER_OTLP_ENDPOINT'));
});

test('API-02: CAPTURE_FILE_RELATIVE canonical path', () => {
  assert.equal(capturer.CAPTURE_FILE_RELATIVE, '.bkit/runtime/otel-env.json');
});

// ── Summary ────────────────────────────────────────────────────────

// eslint-disable-next-line no-console
console.log(`\n[v2114 L1 otel-env-capturer] total=${total} pass=${pass} fail=${fail}`);
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
