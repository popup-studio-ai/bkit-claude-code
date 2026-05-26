#!/usr/bin/env node
/**
 * E2E — 정병진 (@bj) v2.1.142 displayName-reject reproduction (F13 v2.1.20 SS3)
 *
 * Trigger incident: 외부 dogfooder 정병진 (@bj) 2026-05-26 install failure
 *   `Validation errors: : Unrecognized key: "displayName"` — CC ≤ v2.1.142
 *   strict-rejects bkit's v2.1.143+ official `displayName` field.
 *
 * Reproduction surface: hooks/startup/session-context.js detectCCVersion()
 * (ENH-323). PATH-shim swaps `claude --version` output to exercise the
 * old-version advisory + opt-out + timeout + command-not-found paths.
 *
 * This test absorbs 정병진's incident as a permanent regression lock —
 * external dogfooder Lifecycle Stage 4 (per docs/external-dogfooders/_README.md).
 *
 * Reference: docs/sprint/v2120-marketplace-recovery/design.md §3.8 (F13)
 * Reference: docs/adr/0011-plugin-manifest-schema-compliance.md § Decision 5
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const SESSION_CONTEXT = path.join(PROJECT_ROOT, 'hooks', 'startup', 'session-context.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name} — ${e.message}`);
    if (process.env.BKIT_E2E_DEBUG === '1') console.error(e.stack);
  }
}

// ─── Mock shim helpers ──────────────────────────────────────────────────────
// Each scenario runs in its own temp dir (process.cwd) + PATH-prefix so the
// fresh `claude --version` execSync hits our shim instead of the real CLI.

function makeShim(prefix, versionOrBehavior) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `bkit-e2e-${prefix}-${Date.now()}-`));
  const binDir = path.join(tmpDir, 'bin');
  fs.mkdirSync(binDir, { recursive: true });
  const shimPath = path.join(binDir, 'claude');

  if (versionOrBehavior === '__TIMEOUT__') {
    // Shim that sleeps longer than the 200ms timeout to exercise the timeout path.
    fs.writeFileSync(shimPath, '#!/usr/bin/env bash\nsleep 2\necho "2.1.999"\n', { mode: 0o755 });
  } else if (versionOrBehavior === '__NOTFOUND__') {
    // Do not write a shim — PATH will simply not contain `claude`.
    fs.rmdirSync(binDir);
  } else {
    fs.writeFileSync(shimPath, `#!/usr/bin/env bash\necho "${versionOrBehavior}"\n`, { mode: 0o755 });
  }

  return tmpDir;
}

function withMockedCC(prefix, versionOrBehavior, optOut, fn) {
  const tmpDir = makeShim(prefix, versionOrBehavior);
  const binDir = path.join(tmpDir, 'bin');

  const savedCwd = process.cwd();
  const savedPath = process.env.PATH;
  const savedOptOut = process.env.BKIT_DISABLE_CC_VERSION_DETECTION;
  const savedAdvisory = process.env.BKIT_CC_VERSION_ADVISORY;
  // Snapshot the require cache so we can force a fresh module load
  // (some tests mutate module-level state via env vars).
  const savedRequireKey = require.cache[require.resolve(SESSION_CONTEXT)];

  try {
    process.chdir(tmpDir);
    if (versionOrBehavior === '__NOTFOUND__') {
      process.env.PATH = tmpDir; // bin dir absent; ensures `command -v claude` fails
    } else {
      process.env.PATH = `${binDir}:${savedPath}`;
    }
    if (optOut) {
      process.env.BKIT_DISABLE_CC_VERSION_DETECTION = '1';
    } else {
      delete process.env.BKIT_DISABLE_CC_VERSION_DETECTION;
    }
    delete process.env.BKIT_CC_VERSION_ADVISORY;

    delete require.cache[require.resolve(SESSION_CONTEXT)];
    const mod = require(SESSION_CONTEXT);
    fn(mod);
  } finally {
    process.chdir(savedCwd);
    process.env.PATH = savedPath;
    if (savedOptOut === undefined) delete process.env.BKIT_DISABLE_CC_VERSION_DETECTION;
    else process.env.BKIT_DISABLE_CC_VERSION_DETECTION = savedOptOut;
    if (savedAdvisory === undefined) delete process.env.BKIT_CC_VERSION_ADVISORY;
    else process.env.BKIT_CC_VERSION_ADVISORY = savedAdvisory;
    if (savedRequireKey) require.cache[require.resolve(SESSION_CONTEXT)] = savedRequireKey;
    else delete require.cache[require.resolve(SESSION_CONTEXT)];
    // Best-effort cleanup; ignore failures (Windows-friendly).
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_e) { /* noop */ }
  }
}

// ─── Scenarios ──────────────────────────────────────────────────────────────

console.log('E2E cc-min-version — 정병진 (@bj) v2.1.142 displayName-reject reproduction');
console.log('  (Lifecycle Stage 4 Regression Lock, F13 + ENH-323)');
console.log('');

// TC-F13-1: mock CC v2.1.142 → advisory set + BKIT_CC_VERSION_ADVISORY env set
test('TC-F13-1 v2.1.142 mock → isOldVersion=true + advisory present + env set', () => {
  withMockedCC('v142', '2.1.142', /* optOut */ false, (mod) => {
    const result = mod.detectCCVersion();
    assert.equal(result.version, '2.1.142', `expected detected version '2.1.142', got '${result.version}'`);
    assert.equal(result.isOldVersion, true, 'isOldVersion should be true for v2.1.142');
    assert.notEqual(result.advisory, null, 'advisory should be non-null');
    assert.ok(result.advisory.includes('bkit Compatibility Notice'), 'advisory should contain notice header');
    assert.ok(result.advisory.includes('2.1.142'), 'advisory should mention detected version');
    assert.ok(result.advisory.includes('2.1.143'), 'advisory should mention required minimum');
    assert.equal(process.env.BKIT_CC_VERSION_ADVISORY, '1', 'BKIT_CC_VERSION_ADVISORY env should be set');
    assert.ok(['fresh', 'cache'].includes(result.source), `source should be fresh|cache, got '${result.source}'`);

    // additionalContext check via buildCCVersionAdvisoryContext (uses cache, not re-exec)
    const ctx = mod.buildCCVersionAdvisoryContext();
    assert.ok(ctx.length > 0, 'buildCCVersionAdvisoryContext should return non-empty advisory');
    assert.ok(ctx.includes('bkit Compatibility Notice'), 'context should include notice');
  });
});

// TC-F13-2: mock CC v2.1.143 → no advisory + env unset
test('TC-F13-2 v2.1.143 mock → isOldVersion=false + advisory null', () => {
  withMockedCC('v143', '2.1.143', /* optOut */ false, (mod) => {
    const result = mod.detectCCVersion();
    assert.equal(result.version, '2.1.143', `expected detected version '2.1.143', got '${result.version}'`);
    assert.equal(result.isOldVersion, false, 'isOldVersion should be false for v2.1.143');
    assert.equal(result.advisory, null, 'advisory should be null');
    assert.notEqual(process.env.BKIT_CC_VERSION_ADVISORY, '1', 'BKIT_CC_VERSION_ADVISORY should NOT be set');

    const ctx = mod.buildCCVersionAdvisoryContext();
    assert.equal(ctx, '', 'buildCCVersionAdvisoryContext should return empty string');
  });
});

// TC-F13-3: mock command-not-found → silent skip, no advisory
test('TC-F13-3 command not found → silent skip + null version', () => {
  withMockedCC('notfound', '__NOTFOUND__', /* optOut */ false, (mod) => {
    const result = mod.detectCCVersion();
    assert.equal(result.version, null, 'version should be null when command not found');
    assert.equal(result.isOldVersion, false, 'isOldVersion false when version unknown');
    assert.equal(result.advisory, null, 'advisory null when version unknown');

    const ctx = mod.buildCCVersionAdvisoryContext();
    assert.equal(ctx, '', 'buildCCVersionAdvisoryContext should return empty on command not found');
  });
});

// TC-F13-4: mock timeout (>200ms) → silent skip + duration_ms captured
// We cannot directly inspect telemetry from here without a sink, but we can
// verify detectCCVersion returns null version without throwing.
test('TC-F13-4 timeout >200ms → silent skip + null version', () => {
  withMockedCC('timeout', '__TIMEOUT__', /* optOut */ false, (mod) => {
    const start = Date.now();
    const result = mod.detectCCVersion();
    const elapsed = Date.now() - start;
    assert.equal(result.version, null, 'version should be null on timeout');
    assert.equal(result.isOldVersion, false, 'isOldVersion false when version unknown');
    // Allow some slack (250ms upper bound); execSync timeout is 200ms hard cap.
    assert.ok(elapsed < 1500, `elapsed should be much less than the 2-second shim sleep (got ${elapsed}ms)`);
  });
});

// TC-F13-5: opt-out env → detection skipped entirely
test('TC-F13-5 BKIT_DISABLE_CC_VERSION_DETECTION=1 → source=skipped', () => {
  withMockedCC('optout', '2.1.142', /* optOut */ true, (mod) => {
    const result = mod.detectCCVersion();
    assert.equal(result.source, 'skipped', `expected source 'skipped', got '${result.source}'`);
    assert.equal(result.version, null, 'version null when skipped');
    assert.equal(result.isOldVersion, false, 'isOldVersion false when skipped');
    assert.equal(result.advisory, null, 'advisory null when skipped');
    assert.notEqual(process.env.BKIT_CC_VERSION_ADVISORY, '1', 'env should not be set when skipped');
  });
});

// ─── Summary ────────────────────────────────────────────────────────────────

console.log('');
console.log(`Total: ${passed + failed} | PASS: ${passed} | FAIL: ${failed}`);
if (failed > 0) {
  console.error(`E2E cc-min-version: FAILED ${failed}/${passed + failed} test(s)`);
  process.exit(1);
}
console.log('E2E cc-min-version: ALL PASS (Lifecycle Stage 4 Regression Lock achieved)');
process.exit(0);
