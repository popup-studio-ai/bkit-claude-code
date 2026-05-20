/**
 * v2114-sub-agent-dispatcher.test.js — L1 unit tests for Sub-Sprint 1
 * Coordination (ENH-292 Sequential Sub-agent Dispatch, differentiation #3).
 *
 * Coverage (3 module groups, 30 TCs target per design §6.1):
 *   PP — caching-cost.port pure functions (8 TCs)
 *   AN — cache-cost-analyzer rolling window + recommend (10 TCs)
 *   DI — sub-agent-dispatcher 8-state state machine (12 TCs)
 *
 * Pattern matches Sprint 1/2/3 test runners (node:assert/strict + pass/fail
 * counter, sync test() + async testAsync()).
 *
 * Run: node tests/qa/v2114-sub-agent-dispatcher.test.js
 */

'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const port = require(path.join(PLUGIN_ROOT, 'lib/domain/ports/caching-cost.port'));
const adapter = require(path.join(PLUGIN_ROOT, 'lib/infra/caching-cost-cli'));
const analyzerModule = require(path.join(PLUGIN_ROOT, 'lib/orchestrator/cache-cost-analyzer'));
const dispatcherModule = require(path.join(PLUGIN_ROOT, 'lib/orchestrator/sub-agent-dispatcher'));

const {
  THRESHOLD_LOW,
  THRESHOLD_HIGH,
  DISPATCH_MODES,
  THRESHOLD_LEVELS,
  classifyThreshold,
  computeHitRate,
  isCachingCostPort,
} = port;

const { createCachingCostCli, buildMetrics } = adapter;
const { RECENT_WINDOW, MIN_SAMPLES_FOR_TREND, summarize, createAnalyzer } = analyzerModule;
const { STATES, STATE_NAMES, LATENCY_GUARD_MS, createDispatcher } = dispatcherModule;

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

function tempProjectRoot(suffix) {
  const root = path.join(os.tmpdir(), `bkit-test-v2114-${suffix}-${process.pid}-${Date.now()}`);
  fs.mkdirSync(path.join(root, '.bkit', 'runtime'), { recursive: true });
  return root;
}

(async () => {
  // ─────────────────────────────────────────────────────────────────────────
  // GROUP PP — caching-cost.port pure functions (8 TCs)
  // ─────────────────────────────────────────────────────────────────────────

  test('PP-01: THRESHOLD_LOW=0.10, THRESHOLD_HIGH=0.40 constants', () => {
    assert.equal(THRESHOLD_LOW, 0.10);
    assert.equal(THRESHOLD_HIGH, 0.40);
  });

  test('PP-02: DISPATCH_MODES + THRESHOLD_LEVELS frozen', () => {
    assert.ok(Object.isFrozen(DISPATCH_MODES));
    assert.ok(Object.isFrozen(THRESHOLD_LEVELS));
    assert.deepEqual([...DISPATCH_MODES], ['sequential', 'parallel', 'fallback']);
    assert.deepEqual([...THRESHOLD_LEVELS], ['low', 'medium', 'high']);
  });

  test('PP-03: classifyThreshold boundary low/medium', () => {
    assert.equal(classifyThreshold({ hitRate: 0 }), 'low');
    assert.equal(classifyThreshold({ hitRate: 0.0999 }), 'low');
    assert.equal(classifyThreshold({ hitRate: 0.10 }), 'medium');
    assert.equal(classifyThreshold({ hitRate: 0.3999 }), 'medium');
  });

  test('PP-04: classifyThreshold boundary high', () => {
    assert.equal(classifyThreshold({ hitRate: 0.40 }), 'high');
    assert.equal(classifyThreshold({ hitRate: 0.95 }), 'high');
    assert.equal(classifyThreshold({ hitRate: 1.0 }), 'high');
  });

  test('PP-05: classifyThreshold null/NaN safety', () => {
    assert.equal(classifyThreshold(null), 'low');
    assert.equal(classifyThreshold(undefined), 'low');
    assert.equal(classifyThreshold({}), 'low');
    assert.equal(classifyThreshold({ hitRate: NaN }), 'low');
    assert.equal(classifyThreshold({ hitRate: 'invalid' }), 'low');
  });

  test('PP-06: computeHitRate zero-safe and pure read', () => {
    assert.equal(computeHitRate(0, 0), 0);
    assert.equal(computeHitRate(10, 0), 1);
    assert.equal(computeHitRate(0, 10), 0);
    assert.equal(computeHitRate(40, 60), 0.4);
  });

  test('PP-07: isCachingCostPort full duck PASS', () => {
    const r = isCachingCostPort({ emit: () => {}, query: () => {}, threshold: () => {} });
    assert.equal(r.ok, true);
    assert.deepEqual(r.missing, []);
  });

  test('PP-08: isCachingCostPort partial/null FAIL', () => {
    assert.equal(isCachingCostPort(null).ok, false);
    assert.deepEqual(isCachingCostPort(null).missing, ['object']);
    assert.deepEqual(isCachingCostPort({ emit: () => {} }).missing.sort(), ['query', 'threshold']);
    assert.equal(isCachingCostPort({ emit: 'not a fn', query: () => {}, threshold: () => {} }).ok, false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP AN — cache-cost-analyzer (10 TCs)
  // ─────────────────────────────────────────────────────────────────────────

  function makeMockPort() {
    const recorded = [];
    return {
      ledger: recorded,
      emit: async (m) => { recorded.push(m); },
      query: async () => recorded.slice().reverse(),
      threshold: classifyThreshold,
    };
  }

  test('AN-01: createAnalyzer rejects missing port', () => {
    assert.throws(() => createAnalyzer({}), /port must implement CachingCostPort/);
    assert.throws(() => createAnalyzer({ port: { emit: () => {} } }), /missing/);
  });

  test('AN-02: createAnalyzer accepts duck-typed port', () => {
    const p = makeMockPort();
    const a = createAnalyzer({ port: p });
    assert.equal(typeof a.recommend, 'function');
    assert.equal(typeof a.recordSpawn, 'function');
    assert.equal(typeof a.analyze, 'function');
    assert.equal(typeof a.hydrate, 'function');
    assert.equal(typeof a.warmupDetected, 'function');
    assert.equal(typeof a.reset, 'function');
  });

  test('AN-03: RECENT_WINDOW=20, MIN_SAMPLES_FOR_TREND=3 constants', () => {
    assert.equal(RECENT_WINDOW, 20);
    assert.equal(MIN_SAMPLES_FOR_TREND, 3);
  });

  test('AN-04: summarize empty window returns zeros', () => {
    const s = summarize([]);
    assert.equal(s.sampleCount, 0);
    assert.equal(s.avgHitRate, 0);
    assert.equal(s.level, 'low');
    assert.equal(s.warmupDetected, false);
  });

  test('AN-05: summarize single sample', () => {
    const m = buildMetrics({ cacheCreationTokens: 1000, cacheReadTokens: 4000, sessionHash: 'h', agent: 'a', dispatchMode: 'sequential' });
    const s = summarize([m]);
    assert.equal(s.sampleCount, 1);
    assert.equal(s.avgHitRate, 0.8);
    assert.equal(s.level, 'high');
    assert.equal(s.warmupDetected, true);
  });

  test('AN-06: recordSpawn FIFO bounded to RECENT_WINDOW', () => {
    const p = makeMockPort();
    const a = createAnalyzer({ port: p });
    for (let i = 0; i < RECENT_WINDOW + 5; i += 1) {
      a.recordSpawn({ hitRate: 0.5, cacheCreationTokens: 1, cacheReadTokens: 1 });
    }
    assert.equal(a.analyze().sampleCount, RECENT_WINDOW);
  });

  test('AN-07: recommend cold start → sequential', () => {
    const a = createAnalyzer({ port: makeMockPort(), trustLevelProvider: () => 'L2' });
    const r = a.recommend();
    assert.equal(r.strategy, 'sequential');
    assert.match(r.reason, /cold start/);
  });

  test('AN-08: recommend L4 forces sequential even if warm', () => {
    const a = createAnalyzer({ port: makeMockPort(), trustLevelProvider: () => 'L4' });
    for (let i = 0; i < 5; i += 1) a.recordSpawn({ hitRate: 0.95, cacheCreationTokens: 100, cacheReadTokens: 5000 });
    const r = a.recommend();
    assert.equal(r.strategy, 'sequential');
    assert.match(r.reason, /L4/);
  });

  test('AN-09: recommend warm L2 → parallel', () => {
    const a = createAnalyzer({ port: makeMockPort(), trustLevelProvider: () => 'L2' });
    for (let i = 0; i < 5; i += 1) a.recordSpawn({ hitRate: 0.85, cacheCreationTokens: 100, cacheReadTokens: 5000 });
    const r = a.recommend();
    assert.equal(r.strategy, 'parallel');
    assert.equal(r.level, 'high');
  });

  test('AN-10: recommend BKIT_SEQUENTIAL_DISPATCH=0 → fallback', () => {
    const a = createAnalyzer({ port: makeMockPort(), trustLevelProvider: () => 'L2', envProvider: () => '0' });
    for (let i = 0; i < 5; i += 1) a.recordSpawn({ hitRate: 0.9, cacheCreationTokens: 100, cacheReadTokens: 5000 });
    const r = a.recommend();
    assert.equal(r.strategy, 'fallback');
    assert.match(r.reason, /BKIT_SEQUENTIAL_DISPATCH=0/);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROUP DI — sub-agent-dispatcher state machine (12 TCs)
  // ─────────────────────────────────────────────────────────────────────────

  function mkDispatcher(opts) {
    const p = makeMockPort();
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
    return { dispatcher: d, analyzer: a, advanceClock(ms) { now += ms; } };
  }

  test('DI-01: STATES has 8 keys per design §3.2', () => {
    assert.equal(STATE_NAMES.length, 8);
    assert.deepEqual(STATE_NAMES.slice().sort(), [
      'CACHE_HIT_MEASURED', 'CACHE_WARMUP_DETECTED', 'FIRST_SPAWN_SEQUENTIAL',
      'INIT', 'LATENCY_GUARD', 'OPT_OUT_ENABLED', 'PARALLEL_RESTORE', 'RESET',
    ]);
    assert.ok(Object.isFrozen(STATE_NAMES), 'STATE_NAMES must be frozen');
  });

  test('DI-02: LATENCY_GUARD_MS = 30000 (design §3.2 edge case)', () => {
    assert.equal(LATENCY_GUARD_MS, 30000);
  });

  test('DI-03: initial state = INIT', () => {
    const { dispatcher } = mkDispatcher();
    assert.equal(dispatcher.getState().mode, 'INIT');
    assert.equal(dispatcher.getState().dispatchCount, 0);
  });

  test('DI-04: dispatch rejects non-array agents', () => {
    const { dispatcher } = mkDispatcher();
    assert.throws(() => dispatcher.dispatch(null), /agents must be an array/);
    assert.throws(() => dispatcher.dispatch('cto-lead'), /agents must be an array/);
  });

  test('DI-05: L4 dispatch forces sequential + forcedByTrust=true', () => {
    const { dispatcher } = mkDispatcher({ trustLevelProvider: () => 'L4' });
    const plan = dispatcher.dispatch(['a', 'b']);
    assert.equal(plan.strategy, 'sequential');
    assert.equal(plan.forcedByTrust, true);
    assert.equal(dispatcher.getState().mode, 'FIRST_SPAWN_SEQUENTIAL');
  });

  test('DI-06: L2 cold dispatch → sequential', () => {
    const { dispatcher } = mkDispatcher({ trustLevelProvider: () => 'L2' });
    const plan = dispatcher.dispatch(['a']);
    assert.equal(plan.strategy, 'sequential');
    assert.equal(plan.forcedByTrust, false);
  });

  test('DI-07: env BKIT_SEQUENTIAL_DISPATCH=0 → OPT_OUT_ENABLED + fallback', () => {
    const { dispatcher } = mkDispatcher({ envProvider: () => '0' });
    const plan = dispatcher.dispatch(['a']);
    assert.equal(plan.strategy, 'fallback');
    assert.equal(dispatcher.getState().mode, 'OPT_OUT_ENABLED');
  });

  test('DI-08: onSpawnComplete records into analyzer + transitions to CACHE_HIT_MEASURED', () => {
    const { dispatcher } = mkDispatcher({ trustLevelProvider: () => 'L2' });
    dispatcher.dispatch(['a']);
    dispatcher.onSpawnComplete(buildMetrics({
      cacheCreationTokens: 5000, cacheReadTokens: 100,
      sessionHash: 'h', agent: 'a', dispatchMode: 'sequential',
    }));
    assert.equal(dispatcher.getState().mode, 'CACHE_HIT_MEASURED');
  });

  test('DI-09: warmup detected after 3+ warm spawns → CACHE_WARMUP_DETECTED', () => {
    const { dispatcher } = mkDispatcher({ trustLevelProvider: () => 'L2' });
    dispatcher.dispatch(['a']);
    for (let i = 0; i < 3; i += 1) {
      dispatcher.onSpawnComplete(buildMetrics({
        cacheCreationTokens: 100, cacheReadTokens: 5000,
        sessionHash: 'h', agent: 'a', dispatchMode: 'sequential',
      }));
    }
    assert.equal(dispatcher.getState().mode, 'CACHE_WARMUP_DETECTED');
  });

  test('DI-10: dispatch after warmup → PARALLEL_RESTORE + parallel strategy', () => {
    const { dispatcher } = mkDispatcher({ trustLevelProvider: () => 'L2' });
    dispatcher.dispatch(['a']);
    for (let i = 0; i < 3; i += 1) {
      dispatcher.onSpawnComplete(buildMetrics({
        cacheCreationTokens: 100, cacheReadTokens: 5000,
        sessionHash: 'h', agent: 'a', dispatchMode: 'sequential',
      }));
    }
    const plan2 = dispatcher.dispatch(['b', 'c']);
    assert.equal(plan2.strategy, 'parallel');
    assert.equal(dispatcher.getState().mode, 'PARALLEL_RESTORE');
  });

  test('DI-11: first spawn latency > 30s → LATENCY_GUARD sticky parallel', () => {
    const { dispatcher, advanceClock } = mkDispatcher({ trustLevelProvider: () => 'L2' });
    dispatcher.dispatch(['slow-agent']);
    advanceClock(35_000); // exceed LATENCY_GUARD_MS
    dispatcher.onSpawnComplete(buildMetrics({
      cacheCreationTokens: 10000, cacheReadTokens: 0,
      sessionHash: 'h', agent: 'slow-agent', dispatchMode: 'sequential',
    }));
    assert.equal(dispatcher.getState().mode, 'LATENCY_GUARD');
    const plan2 = dispatcher.dispatch(['x']);
    assert.equal(plan2.strategy, 'parallel');
    assert.match(plan2.reason, /LATENCY_GUARD sticky/);
  });

  test('DI-12: reset() clears state → INIT, dispatchCount=0', () => {
    const { dispatcher } = mkDispatcher();
    dispatcher.dispatch(['a']);
    dispatcher.dispatch(['b']);
    assert.equal(dispatcher.getState().dispatchCount, 2);
    dispatcher.reset();
    assert.equal(dispatcher.getState().mode, 'INIT');
    assert.equal(dispatcher.getState().dispatchCount, 0);
    assert.equal(dispatcher.getState().firstSpawnLatencyMs, null);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────
  const ms = Date.now();
  // eslint-disable-next-line no-console
  console.log(`\n[v2114 L1 sub-agent-dispatcher] total=${total} pass=${pass} fail=${fail}`);
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
  console.log(`✓ all PASS (${ms - ms /* spacer */})`);
  process.exit(0);
})();
