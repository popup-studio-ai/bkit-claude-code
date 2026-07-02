/**
 * watch.test.js — Unit tests for FR-β4 /pdca-watch tick renderer.
 *
 * Maps to Design §8.2 L1 TC #4 + §6 E-β4-01 (CC `/loop` fallback).
 *
 * @module test/unit/watch.test
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const watch = require('../../lib/dashboard/watch');

function withTempState(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-watch-'));
  const stateDir = path.join(dir, '.bkit', 'state');
  const runtimeDir = path.join(dir, '.bkit', 'runtime');
  fs.mkdirSync(stateDir, { recursive: true });
  fs.mkdirSync(runtimeDir, { recursive: true });
  const statePath = path.join(stateDir, 'pdca-status.json');
  const ledgerPath = path.join(runtimeDir, 'token-ledger.ndjson');
  try { return fn({ dir, statePath, ledgerPath }); }
  finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch {} }
}

// ── readStatus ────────────────────────────────────────────────────────────
test('readStatus: returns null when file missing', () => {
  withTempState(({ statePath }) => {
    assert.equal(watch.readStatus({ statePath }), null);
  });
});

test('readStatus: returns null on parse failure', () => {
  withTempState(({ statePath }) => {
    fs.writeFileSync(statePath, '{not json}');
    assert.equal(watch.readStatus({ statePath }), null);
  });
});

test('readStatus: parses valid JSON', () => {
  withTempState(({ statePath }) => {
    fs.writeFileSync(statePath, JSON.stringify({ primaryFeature: 'x' }));
    assert.deepEqual(watch.readStatus({ statePath }), { primaryFeature: 'x' });
  });
});

// ── resolveFeature ───────────────────────────────────────────────────────
test('resolveFeature: caller arg takes priority', () => {
  withTempState(({ statePath }) => {
    fs.writeFileSync(statePath, JSON.stringify({
      primaryFeature: 'auto', activeFeatures: ['auto', 'b'],
    }));
    assert.equal(watch.resolveFeature('explicit', { statePath }), 'explicit');
  });
});

test('resolveFeature: trims whitespace from caller arg', () => {
  assert.equal(watch.resolveFeature('  feat-x  '), 'feat-x');
});

test('resolveFeature: falls back to primaryFeature', () => {
  withTempState(({ statePath }) => {
    fs.writeFileSync(statePath, JSON.stringify({
      primaryFeature: 'auto', activeFeatures: ['other'],
    }));
    assert.equal(watch.resolveFeature(null, { statePath }), 'auto');
  });
});

test('resolveFeature: falls back to activeFeatures[0] when no primary', () => {
  withTempState(({ statePath }) => {
    fs.writeFileSync(statePath, JSON.stringify({
      activeFeatures: ['first-active', 'second'],
    }));
    assert.equal(watch.resolveFeature(undefined, { statePath }), 'first-active');
  });
});

test('resolveFeature: returns null when no state and no arg', () => {
  withTempState(({ statePath }) => {
    assert.equal(watch.resolveFeature(null, { statePath }), null);
  });
});

// ── tailLedger ───────────────────────────────────────────────────────────
test('tailLedger: returns empty array when ledger missing', () => {
  withTempState(({ ledgerPath }) => {
    assert.deepEqual(watch.tailLedger({ ledgerPath }), []);
  });
});

test('tailLedger: parses last N lines, skips malformed', () => {
  withTempState(({ ledgerPath }) => {
    const lines = [
      JSON.stringify({ inputTokens: 100, outputTokens: 50 }),
      'not json line',
      JSON.stringify({ inputTokens: 200, outputTokens: 80 }),
      '',
      JSON.stringify({ inputTokens: 300, outputTokens: 90 }),
    ];
    fs.writeFileSync(ledgerPath, lines.join('\n'));
    const r = watch.tailLedger({ ledgerPath, lines: 10 });
    assert.equal(r.length, 3);
    assert.equal(r[0].inputTokens, 100);
    assert.equal(r[2].outputTokens, 90);
  });
});

test('tailLedger: caps at MAX_TAIL_LINES (200)', () => {
  withTempState(({ ledgerPath }) => {
    const big = [];
    for (let i = 0; i < 500; i++) big.push(JSON.stringify({ inputTokens: 1, outputTokens: 1 }));
    fs.writeFileSync(ledgerPath, big.join('\n'));
    const r = watch.tailLedger({ ledgerPath, lines: 1000 }); // request > cap
    assert.equal(r.length, watch.MAX_TAIL_LINES);
  });
});

// ── summarizeLedger + estimateCostUsd ────────────────────────────────────
test('summarizeLedger: sums tokens across entries', () => {
  const r = watch.summarizeLedger([
    { inputTokens: 100, outputTokens: 50 },
    { inputTokens: 200, outputTokens: 80 },
    { inputTokens: 300, outputTokens: 90 },
  ]);
  assert.deepEqual(r, { inputTokens: 600, outputTokens: 220, samples: 3 });
});

test('summarizeLedger: skips non-numeric token fields gracefully', () => {
  const r = watch.summarizeLedger([
    { inputTokens: 'oops' }, null, { outputTokens: 50 }, {},
  ]);
  assert.deepEqual(r, { inputTokens: 0, outputTokens: 50, samples: 4 });
});

test('estimateCostUsd: default Sonnet pricing', () => {
  const cost = watch.estimateCostUsd({ inputTokens: 1_000_000, outputTokens: 1_000_000 });
  assert.ok(Math.abs(cost - 18.0) < 0.01, `expected ~$18, got $${cost}`);
});

test('estimateCostUsd: custom pricing override honored', () => {
  const cost = watch.estimateCostUsd(
    { inputTokens: 1_000_000, outputTokens: 1_000_000 },
    { inputPricePerMtok: 15, outputPricePerMtok: 75 },
  );
  assert.ok(Math.abs(cost - 90.0) < 0.01);
});

// ── checkLoopSupport (CC version gate, E-β4-01) ──────────────────────────
test('checkLoopSupport: missing ccVersion → unsupported (fail-safe)', () => {
  const r = watch.checkLoopSupport({});
  assert.equal(r.supported, false);
  assert.equal(r.reason, 'cc_version_unknown');
  assert.equal(r.fallback, 'single-tick');
});

test('checkLoopSupport: v2.1.71 (boundary) supported', () => {
  assert.equal(watch.checkLoopSupport({ ccVersion: '2.1.71' }).supported, true);
});

test('checkLoopSupport: v2.1.70 (just below) unsupported', () => {
  const r = watch.checkLoopSupport({ ccVersion: '2.1.70' });
  assert.equal(r.supported, false);
  assert.equal(r.reason, 'cc_version_too_old');
});

test('checkLoopSupport: v2.1.121 (current) supported', () => {
  assert.equal(watch.checkLoopSupport({ ccVersion: '2.1.121' }).supported, true);
});

test('checkLoopSupport: v3.0.0 (future) supported', () => {
  assert.equal(watch.checkLoopSupport({ ccVersion: '3.0.0' }).supported, true);
});

test('checkLoopSupport: garbage version unparseable', () => {
  const r = watch.checkLoopSupport({ ccVersion: 'not-a-version' });
  assert.equal(r.supported, false);
  assert.equal(r.reason, 'cc_version_unparseable');
});

// ── renderTick (smoke + content checks) ──────────────────────────────────
test('renderTick: includes feature name + tick + phase', () => {
  withTempState(({ statePath, ledgerPath }) => {
    fs.writeFileSync(statePath, JSON.stringify({
      primaryFeature: 'demo',
      features: { demo: { phase: 'do', matchRate: 87, iterationCount: 1 } },
    }));
    fs.writeFileSync(ledgerPath, JSON.stringify({ inputTokens: 1000, outputTokens: 500 }));

    const out = watch.renderTick({
      feature: 'demo', tick: 3,
      statePath, ledgerPath,
      now: new Date('2026-04-28T12:00:00Z'),
    });
    assert.match(out, /Watch +demo +— tick 3/);
    assert.match(out, /Phase: do/);
    assert.match(out, /Match: 87%/);
    assert.match(out, /Iter: 1 \/ 5/);
    assert.match(out, /Tokens: 1\.0k in \/ 500 out/);
  });
});

test('renderTick: handles missing feature record gracefully', () => {
  withTempState(({ statePath, ledgerPath }) => {
    fs.writeFileSync(statePath, JSON.stringify({ features: {} }));
    const out = watch.renderTick({
      feature: 'unknown-feat', tick: 1, statePath, ledgerPath,
      now: new Date('2026-04-28T00:00:00Z'),
    });
    assert.match(out, /Phase: —/);
    assert.match(out, /Match: —/);
    assert.match(out, /Iter: — \/ 5/);
  });
});

test('renderTick: omitted feature falls back to "(unresolved)"', () => {
  withTempState(({ statePath, ledgerPath }) => {
    const out = watch.renderTick({ tick: 1, statePath, ledgerPath });
    assert.match(out, /Watch +\(unresolved\)/);
  });
});
