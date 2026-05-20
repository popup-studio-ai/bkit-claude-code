/**
 * v2114-caching-cost.test.js — L2 integration tests for Sub-Sprint 1.
 *
 * End-to-end flow: caching-cost.port ↔ caching-cost-cli adapter ↔
 * cache-cost-analyzer ↔ sub-agent-dispatcher, with real fs NDJSON ledger
 * in a per-test tempdir. No mocks of fs/path — actual adapter IO.
 *
 * Coverage (20 TCs target per design §6.2):
 *   AD — adapter IO + NDJSON ledger persistence (8 TCs)
 *   IH — analyzer hydrate / port query round-trip (4 TCs)
 *   E2E — dispatcher → analyzer → adapter → fs full chain (8 TCs)
 *
 * Pattern matches Sprint 2/3 test runners. Tempdirs cleaned in finally().
 *
 * Run: node tests/qa/v2114-caching-cost.test.js
 */

'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const { createCachingCostCli, buildMetrics, isCachingCostPort } = require(path.join(PLUGIN_ROOT, 'lib/infra/caching-cost-cli'));
const { createAnalyzer } = require(path.join(PLUGIN_ROOT, 'lib/orchestrator/cache-cost-analyzer'));
const { createDispatcher } = require(path.join(PLUGIN_ROOT, 'lib/orchestrator/sub-agent-dispatcher'));

let pass = 0;
let fail = 0;
let total = 0;
const failures = [];
const tempRoots = [];

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

async function testAsync(name, fn) {
  total += 1;
  try {
    await fn();
    pass += 1;
  } catch (e) {
    fail += 1;
    failures.push({ name, error: e.message });
  }
}

function mkTempRoot(label) {
  const root = path.join(os.tmpdir(), `bkit-v2114-${label}-${process.pid}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`);
  fs.mkdirSync(root, { recursive: true });
  tempRoots.push(root);
  return root;
}

(async () => {
  // ─────────────────────────────────────────────────────────────────────────
  // GROUP AD — adapter IO + NDJSON ledger persistence (8 TCs)
  // ─────────────────────────────────────────────────────────────────────────

  test('AD-01: createCachingCostCli rejects missing projectRoot', () => {
    assert.throws(() => createCachingCostCli({}), /projectRoot must be a non-empty string/);
    assert.throws(() => createCachingCostCli({ projectRoot: '' }), /non-empty string/);
    assert.throws(() => createCachingCostCli({ projectRoot: 123 }), /non-empty string/);
  });

  test('AD-02: adapter satisfies CachingCostPort duck-type', () => {
    const root = mkTempRoot('ad02');
    const p = createCachingCostCli({ projectRoot: root });
    assert.equal(isCachingCostPort(p).ok, true);
  });

  test('AD-03: buildMetrics computes hitRate from raw counters', () => {
    const m = buildMetrics({
      cacheCreationTokens: 600, cacheReadTokens: 400,
      sessionHash: 'h', agent: 'a', dispatchMode: 'sequential',
    });
    assert.equal(m.hitRate, 0.4);
    assert.ok(typeof m.timestamp === 'number');
  });

  test('AD-04: buildMetrics defaults dispatchMode to sequential', () => {
    const m = buildMetrics({ cacheCreationTokens: 0, cacheReadTokens: 0, sessionHash: 'h', agent: 'a' });
    assert.equal(m.dispatchMode, 'sequential');
  });

  await testAsync('AD-05: emit creates ledger file lazily (parent dir auto-mkdir)', async () => {
    const root = mkTempRoot('ad05');
    const p = createCachingCostCli({ projectRoot: root });
    const ledger = path.join(root, '.bkit', 'runtime', 'caching-cost.ndjson');
    assert.ok(!fs.existsSync(ledger), 'ledger should not exist before emit');
    await p.emit(buildMetrics({ cacheCreationTokens: 10, cacheReadTokens: 90, sessionHash: 'h', agent: 'a', dispatchMode: 'sequential' }));
    assert.ok(fs.existsSync(ledger));
    const raw = fs.readFileSync(ledger, 'utf8');
    assert.equal(raw.split('\n').filter(Boolean).length, 1);
  });

  await testAsync('AD-06: emit appends one NDJSON line per call', async () => {
    const root = mkTempRoot('ad06');
    const p = createCachingCostCli({ projectRoot: root });
    for (let i = 0; i < 5; i += 1) {
      await p.emit(buildMetrics({ cacheCreationTokens: i * 100, cacheReadTokens: i * 50, sessionHash: 'h', agent: 'a', dispatchMode: 'sequential' }));
    }
    const raw = fs.readFileSync(path.join(root, '.bkit', 'runtime', 'caching-cost.ndjson'), 'utf8');
    assert.equal(raw.split('\n').filter(Boolean).length, 5);
  });

  await testAsync('AD-07: emit is fail-silent (no throw) on non-object input', async () => {
    const root = mkTempRoot('ad07');
    const p = createCachingCostCli({ projectRoot: root });
    // Should not throw even with bad input
    await p.emit(null);
    await p.emit(undefined);
    await p.emit('not an object');
    await p.emit(42);
    // Ledger may or may not exist — but no exception
    assert.ok(true, 'no throw');
  });

  await testAsync('AD-08: query returns [] when ledger missing', async () => {
    const root = mkTempRoot('ad08');
    const p = createCachingCostCli({ projectRoot: root });
    const r = await p.query({});
    assert.deepEqual(r, []);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP IH — analyzer hydrate + port query round-trip (4 TCs)
  // ─────────────────────────────────────────────────────────────────────────

  await testAsync('IH-01: analyzer.hydrate loads recent samples from ledger', async () => {
    const root = mkTempRoot('ih01');
    const p = createCachingCostCli({ projectRoot: root });
    for (let i = 0; i < 5; i += 1) {
      await p.emit(buildMetrics({
        cacheCreationTokens: 100, cacheReadTokens: 200,
        sessionHash: 'h', agent: 'cto-lead', dispatchMode: 'sequential',
      }));
    }
    const a = createAnalyzer({ port: p, trustLevelProvider: () => 'L2' });
    const count = await a.hydrate({});
    assert.equal(count, 5);
    assert.equal(a.analyze().sampleCount, 5);
  });

  await testAsync('IH-02: query filter by agent', async () => {
    const root = mkTempRoot('ih02');
    const p = createCachingCostCli({ projectRoot: root });
    await p.emit(buildMetrics({ cacheCreationTokens: 100, cacheReadTokens: 100, sessionHash: 'h', agent: 'cto-lead', dispatchMode: 'sequential' }));
    await p.emit(buildMetrics({ cacheCreationTokens: 100, cacheReadTokens: 100, sessionHash: 'h', agent: 'qa-lead', dispatchMode: 'sequential' }));
    await p.emit(buildMetrics({ cacheCreationTokens: 100, cacheReadTokens: 100, sessionHash: 'h', agent: 'cto-lead', dispatchMode: 'sequential' }));
    const r = await p.query({ agent: 'cto-lead' });
    assert.equal(r.length, 2);
    for (const m of r) assert.equal(m.agent, 'cto-lead');
  });

  await testAsync('IH-03: query filter by sinceMs', async () => {
    const root = mkTempRoot('ih03');
    const p = createCachingCostCli({ projectRoot: root });
    const t0 = Date.now();
    await p.emit(buildMetrics({ cacheCreationTokens: 1, cacheReadTokens: 1, sessionHash: 'h', agent: 'a', dispatchMode: 'sequential', timestamp: t0 - 10000 }));
    await p.emit(buildMetrics({ cacheCreationTokens: 1, cacheReadTokens: 1, sessionHash: 'h', agent: 'a', dispatchMode: 'sequential', timestamp: t0 + 1000 }));
    const r = await p.query({ sinceMs: t0 });
    assert.equal(r.length, 1);
    assert.ok(r[0].timestamp >= t0);
  });

  await testAsync('IH-04: query skips corrupt JSON lines silently', async () => {
    const root = mkTempRoot('ih04');
    const p = createCachingCostCli({ projectRoot: root });
    await p.emit(buildMetrics({ cacheCreationTokens: 100, cacheReadTokens: 100, sessionHash: 'h', agent: 'a', dispatchMode: 'sequential' }));
    // Corrupt the ledger by appending a non-JSON line
    fs.appendFileSync(path.join(root, '.bkit', 'runtime', 'caching-cost.ndjson'), '{ not valid json\n', 'utf8');
    await p.emit(buildMetrics({ cacheCreationTokens: 200, cacheReadTokens: 200, sessionHash: 'h', agent: 'a', dispatchMode: 'sequential' }));
    const r = await p.query({});
    assert.equal(r.length, 2, 'should skip corrupt line and return 2 valid records');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP E2E — dispatcher → analyzer → adapter → fs full chain (8 TCs)
  // ─────────────────────────────────────────────────────────────────────────

  function wire(root, opts) {
    const p = createCachingCostCli({ projectRoot: root });
    const a = createAnalyzer({
      port: p,
      trustLevelProvider: (opts && opts.trustLevelProvider) || (() => 'L2'),
      envProvider: (opts && opts.envProvider) || (() => undefined),
    });
    let now = 1_000_000;
    const d = createDispatcher({
      analyzer: a,
      trustLevelProvider: (opts && opts.trustLevelProvider) || (() => 'L2'),
      envProvider: (opts && opts.envProvider) || (() => undefined),
      clock: () => now,
    });
    return { port: p, analyzer: a, dispatcher: d, advanceClock(ms) { now += ms; }, now: () => now };
  }

  await testAsync('E2E-01: dispatcher initial dispatch + spawn complete + persisted', async () => {
    const root = mkTempRoot('e2e01');
    const { port, dispatcher, advanceClock, now } = wire(root, { trustLevelProvider: () => 'L2' });
    dispatcher.dispatch(['cto-lead']);
    advanceClock(2000);
    const m = buildMetrics({ cacheCreationTokens: 5000, cacheReadTokens: 100, sessionHash: 's', agent: 'cto-lead', dispatchMode: 'sequential', timestamp: now() });
    await port.emit(m);
    dispatcher.onSpawnComplete(m);
    const r = await port.query({});
    assert.equal(r.length, 1);
    assert.equal(r[0].agent, 'cto-lead');
  });

  await testAsync('E2E-02: warmup detection via analyzer after warm spawns persists across hydrate', async () => {
    const root = mkTempRoot('e2e02');
    const { port, analyzer } = wire(root, { trustLevelProvider: () => 'L2' });
    for (let i = 0; i < 4; i += 1) {
      await port.emit(buildMetrics({ cacheCreationTokens: 100, cacheReadTokens: 5000, sessionHash: 's', agent: 'cto-lead', dispatchMode: 'sequential' }));
    }
    await analyzer.hydrate({});
    assert.equal(analyzer.warmupDetected(), true);
    assert.equal(analyzer.analyze().level, 'high');
  });

  await testAsync('E2E-03: dispatcher second batch parallel after warmup loop', async () => {
    const root = mkTempRoot('e2e03');
    const { port, dispatcher, analyzer } = wire(root, { trustLevelProvider: () => 'L2' });
    dispatcher.dispatch(['cto-lead']);
    for (let i = 0; i < 3; i += 1) {
      const m = buildMetrics({ cacheCreationTokens: 100, cacheReadTokens: 5000, sessionHash: 's', agent: 'cto-lead', dispatchMode: 'sequential' });
      await port.emit(m);
      dispatcher.onSpawnComplete(m);
    }
    assert.equal(analyzer.warmupDetected(), true);
    const plan2 = dispatcher.dispatch(['qa-lead', 'code-analyzer']);
    assert.equal(plan2.strategy, 'parallel');
  });

  await testAsync('E2E-04: L4 stays sequential after warm — guarantees cache safety', async () => {
    const root = mkTempRoot('e2e04');
    const { port, dispatcher, analyzer } = wire(root, { trustLevelProvider: () => 'L4' });
    for (let i = 0; i < 5; i += 1) {
      const m = buildMetrics({ cacheCreationTokens: 100, cacheReadTokens: 5000, sessionHash: 's', agent: 'a', dispatchMode: 'sequential' });
      await port.emit(m);
      dispatcher.onSpawnComplete(m);
    }
    assert.equal(analyzer.warmupDetected(), true);
    const plan = dispatcher.dispatch(['b']);
    assert.equal(plan.strategy, 'sequential', 'L4 must enforce sequential even when warm');
    assert.equal(plan.forcedByTrust, true);
  });

  await testAsync('E2E-05: opt-out via env returns fallback even with warm cache', async () => {
    const root = mkTempRoot('e2e05');
    const { dispatcher } = wire(root, { trustLevelProvider: () => 'L2', envProvider: () => '0' });
    const plan = dispatcher.dispatch(['a', 'b', 'c']);
    assert.equal(plan.strategy, 'fallback');
  });

  await testAsync('E2E-06: LATENCY_GUARD activates after 30s+ first spawn', async () => {
    const root = mkTempRoot('e2e06');
    const { dispatcher, advanceClock } = wire(root, { trustLevelProvider: () => 'L2' });
    dispatcher.dispatch(['slow']);
    advanceClock(35000);
    dispatcher.onSpawnComplete(buildMetrics({ cacheCreationTokens: 1, cacheReadTokens: 1, sessionHash: 's', agent: 'slow', dispatchMode: 'sequential' }));
    assert.equal(dispatcher.getState().mode, 'LATENCY_GUARD');
    const plan = dispatcher.dispatch(['fast']);
    assert.equal(plan.strategy, 'parallel');
  });

  await testAsync('E2E-07: reset clears analyzer window + dispatcher state', async () => {
    const root = mkTempRoot('e2e07');
    const { port, dispatcher, analyzer } = wire(root, { trustLevelProvider: () => 'L2' });
    for (let i = 0; i < 3; i += 1) {
      const m = buildMetrics({ cacheCreationTokens: 100, cacheReadTokens: 5000, sessionHash: 's', agent: 'a', dispatchMode: 'sequential' });
      await port.emit(m);
      dispatcher.onSpawnComplete(m);
    }
    dispatcher.reset();
    assert.equal(dispatcher.getState().mode, 'INIT');
    assert.equal(analyzer.analyze().sampleCount, 0);
  });

  await testAsync('E2E-08: cross-session ledger persistence — new analyzer instance reads prior writes', async () => {
    const root = mkTempRoot('e2e08');
    const port1 = createCachingCostCli({ projectRoot: root });
    await port1.emit(buildMetrics({ cacheCreationTokens: 100, cacheReadTokens: 9000, sessionHash: 's1', agent: 'a', dispatchMode: 'sequential' }));
    await port1.emit(buildMetrics({ cacheCreationTokens: 100, cacheReadTokens: 9000, sessionHash: 's2', agent: 'a', dispatchMode: 'sequential' }));
    // Fresh analyzer instance — simulates a new session reusing the ledger.
    const port2 = createCachingCostCli({ projectRoot: root });
    const a2 = createAnalyzer({ port: port2, trustLevelProvider: () => 'L2' });
    const n = await a2.hydrate({});
    assert.equal(n, 2);
    assert.equal(a2.analyze().level, 'high');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Cleanup
  // ─────────────────────────────────────────────────────────────────────────
  for (const root of tempRoots) {
    try { fs.rmSync(root, { recursive: true, force: true }); } catch { /* ignore */ }
  }

  // eslint-disable-next-line no-console
  console.log(`\n[v2114 L2 caching-cost] total=${total} pass=${pass} fail=${fail}`);
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
