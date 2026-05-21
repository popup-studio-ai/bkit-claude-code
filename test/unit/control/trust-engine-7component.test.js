#!/usr/bin/env node
/**
 * L1 Unit — lib/control/trust-engine.js 7-component normalization (F4-1)
 *
 * Verifies:
 *   - 7 components present
 *   - Weight sum = 1.0
 *   - Worked example (master plan §3.2): existing user Δ ≤5% on v2.1.19 upgrade
 */
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

let passed = 0, failed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; failures.push({ name, err: e.message }); console.log(`  ✗ ${name} — ${e.message}`); }
}

console.log('L1 trust-engine 7-component tests');

// Helper: fresh require with optional profile file path override
function loadFresh() {
  const fp = path.join(PROJECT_ROOT, 'lib/control/trust-engine.js');
  delete require.cache[require.resolve(fp)];
  return require(fp);
}

test('TC-F4-1-U1: createDefaultProfile has 7 components', () => {
  const te = loadFresh();
  const profile = te.createDefaultProfile();
  const keys = Object.keys(profile.components);
  assert.equal(keys.length, 7, `expected 7 components, got ${keys.length}: ${keys.join(',')}`);
  assert.ok(keys.includes('externalDogfoodFeedbackResponseRate'), 'externalDogfoodFeedbackResponseRate missing');
});

test('TC-F4-1-U2: 7 component weights sum to 1.0', () => {
  const te = loadFresh();
  const profile = te.createDefaultProfile();
  const sum = Object.values(profile.components).reduce((a, c) => a + c.weight, 0);
  assert.ok(Math.abs(sum - 1.0) < 1e-9, `weight sum ${sum} != 1.0`);
});

test('TC-F4-1-U3: Worked example — pre-v2.1.19 user (values 80/85/90/95/75/70) Δ ≤5%', () => {
  // Inject pre-v2.1.19 profile (6 components, old weights — will be normalized on load)
  const oldProfile = {
    trustScore: 83.0,
    currentLevel: 2,
    components: {
      pdcaCompletionRate: { weight: 0.25, value: 80 },
      gatePassRate: { weight: 0.20, value: 85 },
      rollbackFrequency: { weight: 0.15, value: 90 },
      destructiveBlockRate: { weight: 0.15, value: 95 },
      iterationEfficiency: { weight: 0.15, value: 75 },
      userOverrideRate: { weight: 0.10, value: 70 },
    },
    stats: {},
  };
  const tmpProfile = path.join(os.tmpdir(), `v2119-trust-${Date.now()}.json`);
  fs.writeFileSync(tmpProfile, JSON.stringify(oldProfile));

  // Compute old score (sanity)
  const oldScore = 0.25 * 80 + 0.20 * 85 + 0.15 * 90 + 0.15 * 95 + 0.15 * 75 + 0.10 * 70;
  assert.ok(Math.abs(oldScore - 83.0) < 0.01, `pre-v2.1.19 score ${oldScore}`);

  // Compute new score (post-merge — weights from defaults, values from old)
  const te = loadFresh();
  const defaults = te.createDefaultProfile();
  const newComponents = {};
  for (const [k, defComp] of Object.entries(defaults.components)) {
    newComponents[k] = {
      weight: defComp.weight,
      value: (oldProfile.components[k] && oldProfile.components[k].value) || defComp.value,
    };
  }
  const newScore = Object.values(newComponents).reduce((s, c) => s + c.weight * c.value, 0);
  const delta = newScore - oldScore;
  const deltaPct = Math.abs(delta) / oldScore * 100;
  // CTO M-2 worked example specifies "exactly 5.0% boundary" — allow tiny
  // float precision epsilon (4.15/83 yields 5.0000000000000004 from IEEE 754)
  assert.ok(deltaPct <= 5.0 + 1e-6, `Δ ${deltaPct.toFixed(4)}% > 5.0% (CTO M-2 worked example R-10 mitigation)`);
  // Expected ≈ -4.0 points (-4.8%)
  assert.ok(Math.abs(delta - (-4.0)) < 0.5, `expected Δ ≈ -4.0, got ${delta.toFixed(2)}`);

  fs.unlinkSync(tmpProfile);
});

test('TC-F4-1-U4: externalDogfoodFeedbackResponseRate weight = 0.05', () => {
  const te = loadFresh();
  const profile = te.createDefaultProfile();
  assert.equal(profile.components.externalDogfoodFeedbackResponseRate.weight, 0.05);
});

test('TC-F4-1-U5: legacy 6-component profile loads with normalized weights', () => {
  const profilePath = path.join(PROJECT_ROOT, '.bkit/state/trust-profile.json');
  const backup = fs.existsSync(profilePath) ? fs.readFileSync(profilePath, 'utf8') : null;
  // Write legacy 6-component profile
  fs.writeFileSync(profilePath, JSON.stringify({
    trustScore: 50,
    currentLevel: 2,
    components: {
      pdcaCompletionRate: { weight: 0.25, value: 80 },
      gatePassRate: { weight: 0.20, value: 85 },
      rollbackFrequency: { weight: 0.15, value: 90 },
      destructiveBlockRate: { weight: 0.15, value: 95 },
      iterationEfficiency: { weight: 0.15, value: 75 },
      userOverrideRate: { weight: 0.10, value: 70 },
    },
  }));
  const te = loadFresh();
  const loaded = te.loadTrustProfile();
  // Weights from defaults (normalized)
  assert.equal(loaded.components.pdcaCompletionRate.weight, 0.2375);
  assert.equal(loaded.components.gatePassRate.weight, 0.19);
  assert.equal(loaded.components.externalDogfoodFeedbackResponseRate.weight, 0.05);
  // Values from disk
  assert.equal(loaded.components.pdcaCompletionRate.value, 80);
  assert.equal(loaded.components.gatePassRate.value, 85);
  // externalDogfoodFeedbackResponseRate value = default (0) since file lacked it
  assert.equal(loaded.components.externalDogfoodFeedbackResponseRate.value, 0);
  // Weight sum
  const sum = Object.values(loaded.components).reduce((a, c) => a + c.weight, 0);
  assert.ok(Math.abs(sum - 1.0) < 1e-9, `weight sum ${sum} != 1.0`);

  // Restore
  if (backup) fs.writeFileSync(profilePath, backup);
  else if (fs.existsSync(profilePath)) fs.unlinkSync(profilePath);
});

console.log(`\n${passed} passed, ${failed} failed (total ${passed + failed})`);
if (failed > 0) {
  failures.forEach(f => console.error(`  - ${f.name}: ${f.err}`));
  process.exit(1);
}
process.exit(0);
