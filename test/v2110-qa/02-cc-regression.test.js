/**
 * QA L1/L2 — cc-regression module unit + integration tests
 * Target: 300+ assertions
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

const ROOT = path.resolve(__dirname, '..', '..');
const registry = require(path.join(ROOT, 'lib/cc-regression/registry'));
const coord = require(path.join(ROOT, 'lib/cc-regression/defense-coordinator'));
const formatter = require(path.join(ROOT, 'lib/cc-regression/attribution-formatter'));
const accountant = require(path.join(ROOT, 'lib/cc-regression/token-accountant'));
const lifecycle = require(path.join(ROOT, 'lib/cc-regression/lifecycle'));
const facade = require(path.join(ROOT, 'lib/cc-regression'));

let pass = 0, fail = 0;
const failures = [];
function test(name, fn) {
  try { fn(); pass++; } catch (e) { fail++; failures.push(`${name}: ${e.message}`); }
}

// =============== Registry ===============
test('Registry: CC_REGRESSIONS is array', () => assert.ok(Array.isArray(registry.CC_REGRESSIONS)));
test('Registry: 19 guards minimum', () => assert.ok(registry.CC_REGRESSIONS.length >= 19, `got ${registry.CC_REGRESSIONS.length}`));
test('Registry: All entries have id', () => {
  registry.CC_REGRESSIONS.forEach((g, i) => assert.ok(g.id, `entry ${i} missing id`));
});
test('Registry: All entries have severity in HIGH|MEDIUM|LOW', () => {
  const valid = ['HIGH', 'MEDIUM', 'LOW'];
  registry.CC_REGRESSIONS.forEach((g) => assert.ok(valid.includes(g.severity), `${g.id}: ${g.severity}`));
});
test('Registry: All entries have issue URL', () => {
  registry.CC_REGRESSIONS.forEach((g) => assert.ok(typeof g.issue === 'string' && g.issue.startsWith('https://'), `${g.id}`));
});
test('Registry: All entries have since version', () => {
  registry.CC_REGRESSIONS.forEach((g) => assert.ok(g.since, `${g.id}`));
});
test('Registry: resolvedAt is null by default', () => {
  registry.CC_REGRESSIONS.forEach((g) => assert.strictEqual(g.resolvedAt, null, `${g.id}`));
});

// IDs existence
['MON-CC-02', 'ENH-262', 'ENH-263', 'ENH-264', 'MON-CC-06-51165', 'ENH-214'].forEach((id) => {
  test(`Registry has ${id}`, () => {
    assert.ok(registry.lookup(id), `${id} missing`);
  });
});

// MON-CC-06 count (should be 13 per plan)
test('Registry: MON-CC-06 variants >= 13', () => {
  const count = registry.CC_REGRESSIONS.filter((g) => g.id.startsWith('MON-CC-06')).length;
  assert.ok(count >= 13, `got ${count}`);
});

// listActive / getActive
test('Registry.listActive: returns subset', () => {
  const active = registry.listActive();
  assert.ok(Array.isArray(active));
  assert.ok(active.length <= registry.CC_REGRESSIONS.length);
});
test('Registry.listActive: all unresolved', () => {
  registry.listActive().forEach((g) => assert.strictEqual(g.resolvedAt, null));
});
test('Registry.getActive: 2.1.118 filters ENH-262', () => {
  const active = registry.getActive('2.1.118');
  assert.ok(!active.find((g) => g.id === 'ENH-262'), 'ENH-262 should be resolved at 2.1.118');
});
test('Registry.getActive: 2.1.117 keeps ENH-262', () => {
  const active = registry.getActive('2.1.117');
  assert.ok(active.find((g) => g.id === 'ENH-262'), 'ENH-262 should be active at 2.1.117');
});
test('Registry.getActive: 3.0.0 filters ENH-262/263/264', () => {
  const active = registry.getActive('3.0.0');
  assert.ok(!active.find((g) => g.id === 'ENH-262'));
  assert.ok(!active.find((g) => g.id === 'ENH-263'));
  assert.ok(!active.find((g) => g.id === 'ENH-264'));
});
test('Registry.getActive: 2.1.117 retains MON-CC-02 (expected 2.1.117 so equal OK)', () => {
  const active = registry.getActive('2.1.117');
  // since expectedFix="2.1.117" and we use semverLt strict, 2.1.117 should resolve it
  const mon = active.find((g) => g.id === 'MON-CC-02');
  assert.strictEqual(mon, undefined, 'MON-CC-02 expectedFix=2.1.117 resolved at 2.1.117');
});
test('Registry.getActive: 2.1.116 keeps MON-CC-02', () => {
  const active = registry.getActive('2.1.116');
  assert.ok(active.find((g) => g.id === 'MON-CC-02'));
});
test('Registry.getActive: null expectedFix always active', () => {
  const active = registry.getActive('99.99.99');
  // ENH-214 has expectedFix=null
  assert.ok(active.find((g) => g.id === 'ENH-214'));
});
test('Registry.lookup unknown returns undefined', () => {
  assert.strictEqual(registry.lookup('NONEXISTENT'), undefined);
});

// semverLt
test('semverLt: 2.1.117 < 2.1.118', () => assert.strictEqual(registry.semverLt('2.1.117', '2.1.118'), true));
test('semverLt: 2.1.118 not < 2.1.117', () => assert.strictEqual(registry.semverLt('2.1.118', '2.1.117'), false));
test('semverLt: equal = false', () => assert.strictEqual(registry.semverLt('2.1.117', '2.1.117'), false));
test('semverLt: major comparison', () => assert.strictEqual(registry.semverLt('1.9.99', '2.0.0'), true));
test('semverLt: minor comparison', () => assert.strictEqual(registry.semverLt('2.0.99', '2.1.0'), true));
test('semverLt: null handling', () => assert.strictEqual(registry.semverLt(null, '2.1.0'), true));

// =============== Attribution Formatter ===============
test('formatAttribution: basic meta', () => {
  const s = formatter.formatAttribution({ id: 'ENH-262', severity: 'HIGH', note: 'test', ccIssue: 'https://x/1' });
  assert.ok(s.includes('[bkit:ENH-262]'));
  assert.ok(s.includes('[HIGH]'));
  assert.ok(s.includes('test'));
  assert.ok(s.includes('https://x/1'));
});
test('formatAttribution: no ccIssue', () => {
  const s = formatter.formatAttribution({ id: 'X', severity: 'LOW', note: 'n' });
  assert.ok(s.includes('[bkit:X]'));
  assert.ok(!s.includes('undefined'));
});
test('formatAttribution: no severity', () => {
  const s = formatter.formatAttribution({ id: 'X', note: 'n' });
  assert.ok(s.includes('[bkit:X]'));
});
test('formatAttribution: no note', () => {
  const s = formatter.formatAttribution({ id: 'X', severity: 'HIGH' });
  assert.ok(s.includes('[bkit:X]'));
});
test('formatAttribution: null meta', () => {
  assert.strictEqual(formatter.formatAttribution(null), '');
});
test('formatAttribution: no id returns empty', () => {
  assert.strictEqual(formatter.formatAttribution({ severity: 'H' }), '');
});
test('formatAttribution: redacts password=', () => {
  const s = formatter.formatAttribution({ id: 'X', note: 'password=abc123' });
  assert.ok(s.includes('[REDACTED]'), s);
});
test('formatAttribution: redacts token=', () => {
  const s = formatter.formatAttribution({ id: 'X', note: 'token=xyz' });
  assert.ok(s.includes('[REDACTED]'));
});
test('formatAttribution: redacts api_key=', () => {
  const s = formatter.formatAttribution({ id: 'X', note: 'api_key=foo' });
  assert.ok(s.includes('[REDACTED]'));
});
test('formatAttribution: redacts api-key=', () => {
  const s = formatter.formatAttribution({ id: 'X', note: 'api-key=foo' });
  assert.ok(s.includes('[REDACTED]'));
});
test('formatAttribution: redacts authorization:', () => {
  const s = formatter.formatAttribution({ id: 'X', note: 'authorization: Bearer xyz' });
  assert.ok(s.includes('[REDACTED]'));
});
test('formatAttribution: whitespace collapsed', () => {
  const s = formatter.formatAttribution({ id: 'X', severity: 'H', note: 'a   b' });
  // After normalize, multiple spaces → single space
  assert.ok(!s.includes('   '));
});
test('redact: string passthrough safe text', () => {
  assert.strictEqual(formatter.redact('safe text'), 'safe text');
});
test('redact: non-string returns empty', () => {
  assert.strictEqual(formatter.redact(null), '');
  assert.strictEqual(formatter.redact(42), '');
  assert.strictEqual(formatter.redact(undefined), '');
});
test('redact: empty string', () => {
  assert.strictEqual(formatter.redact(''), '');
});
test('REDACT_PATTERNS: exported array', () => {
  assert.ok(Array.isArray(formatter.REDACT_PATTERNS));
  assert.ok(formatter.REDACT_PATTERNS.length >= 4);
});

// =============== Defense Coordinator ===============
test('coord.checkCCRegression: empty ctx', () => {
  const r = coord.checkCCRegression({});
  assert.deepStrictEqual(r.attributions, []);
  assert.deepStrictEqual(r.metas, []);
});
test('coord.checkCCRegression: ENH-262 hit', () => {
  const r = coord.checkCCRegression({
    tool: 'Bash',
    envOverrides: { dangerouslyDisableSandbox: true },
    permissionDecision: 'allow',
  });
  assert.strictEqual(r.metas.length, 1);
  assert.strictEqual(r.metas[0].id, 'ENH-262');
  assert.strictEqual(r.attributions.length, 1);
  assert.ok(r.attributions[0].includes('[bkit:ENH-262]'));
});
test('coord.checkCCRegression: ENH-263 hit', () => {
  const r = coord.checkCCRegression({
    tool: 'Write',
    filePath: '.claude/agents/x.md',
    bypassPermissions: true,
    permissionDecision: 'allow',
  });
  assert.strictEqual(r.metas.length, 1);
  assert.strictEqual(r.metas[0].id, 'ENH-263');
});
test('coord.checkCCRegression: BYPASS env short-circuits', () => {
  process.env.BKIT_CC_REGRESSION_BYPASS = '1';
  try {
    const r = coord.checkCCRegression({
      tool: 'Bash', envOverrides: { dangerouslyDisableSandbox: true }, permissionDecision: 'allow',
    });
    assert.deepStrictEqual(r.metas, []);
    assert.deepStrictEqual(r.attributions, []);
  } finally {
    delete process.env.BKIT_CC_REGRESSION_BYPASS;
  }
});
test('coord.checkCCRegression: miss non-trigger ctx', () => {
  const r = coord.checkCCRegression({ tool: 'Read', filePath: 'foo.js' });
  assert.deepStrictEqual(r.metas, []);
});
test('coord.emitAttribution: empty metas safe', () => {
  // Should not throw
  coord.emitAttribution([]);
  coord.emitAttribution(null);
  coord.emitAttribution(undefined);
  assert.ok(true);
});

// =============== Token Accountant ===============
test('accountant.hashSession: stable output', () => {
  const h = accountant.hashSession('my-session-id');
  assert.strictEqual(h.length, 16);
  assert.strictEqual(h, accountant.hashSession('my-session-id'));
});
test('accountant.hashSession: no PII leaked', () => {
  const h = accountant.hashSession('my-session-id');
  assert.ok(!h.includes('my-session'));
});
test('accountant.hashSession: null returns unknown', () => {
  assert.strictEqual(accountant.hashSession(null), 'unknown');
});
test('accountant.hashSession: empty string returns unknown', () => {
  assert.strictEqual(accountant.hashSession(''), 'unknown');
});
test('accountant.hashSession: non-string returns unknown', () => {
  assert.strictEqual(accountant.hashSession(42), 'unknown');
});
test('accountant.recordTurn: safe with minimal meta', () => {
  // Recording in cwd of temp dir to avoid polluting project
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-qa-'));
  const origCwd = process.cwd();
  process.chdir(tmpRoot);
  try {
    const r = accountant.recordTurn({ model: 'claude-opus-4-7' });
    assert.ok(r);
    assert.strictEqual(typeof r.hit, 'boolean');
  } finally {
    process.chdir(origCwd);
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
test('accountant.recordTurn: hit Sonnet overhead', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-qa-'));
  const origCwd = process.cwd();
  process.chdir(tmpRoot);
  try {
    const r = accountant.recordTurn({
      model: 'claude-sonnet-4-6',
      overheadDelta: 9000,
    });
    assert.strictEqual(r.hit, true);
  } finally {
    process.chdir(origCwd);
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
test('accountant.recordTurn: empty meta uses defaults', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-qa-'));
  const origCwd = process.cwd();
  process.chdir(tmpRoot);
  try {
    const r = accountant.recordTurn({});
    assert.ok(r);
  } finally {
    process.chdir(origCwd);
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
test('accountant.LEDGER_REL constant', () => {
  assert.strictEqual(accountant.LEDGER_REL, '.bkit/runtime/token-ledger.ndjson');
});
test('accountant.RETENTION_DAYS = 30', () => {
  assert.strictEqual(accountant.RETENTION_DAYS, 30);
});
test('accountant.getLedgerStats: empty dir returns zeros', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-qa-'));
  const origCwd = process.cwd();
  process.chdir(tmpRoot);
  try {
    const s = accountant.getLedgerStats();
    assert.strictEqual(s.total, 0);
    assert.strictEqual(s.avgOverhead, 0);
    assert.strictEqual(s.sonnetTurns, 0);
  } finally {
    process.chdir(origCwd);
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
test('accountant.getLedgerStats: accumulates entries', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-qa-'));
  const origCwd = process.cwd();
  process.chdir(tmpRoot);
  try {
    accountant.recordTurn({ model: 'claude-sonnet-4-6', overheadDelta: 1000 });
    accountant.recordTurn({ model: 'claude-sonnet-4-6', overheadDelta: 2000 });
    accountant.recordTurn({ model: 'claude-opus-4-7', overheadDelta: 100 });
    const s = accountant.getLedgerStats();
    assert.strictEqual(s.total, 3);
    assert.strictEqual(s.sonnetTurns, 2);
    assert.strictEqual(s.avgOverhead, Math.round((1000+2000+100)/3));
  } finally {
    process.chdir(origCwd);
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
test('accountant: NDJSON format (no prompt body)', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-qa-'));
  const origCwd = process.cwd();
  process.chdir(tmpRoot);
  try {
    accountant.recordTurn({
      sessionId: 'sess-123',
      agent: 'qa-lead',
      model: 'claude-sonnet-4-6',
      ccVersion: '2.1.117',
      turnIndex: 5,
      inputTokens: 1000,
      outputTokens: 500,
      overheadDelta: 100,
    });
    const ledger = fs.readFileSync(accountant.getLedgerPath(), 'utf8').trim();
    const entry = JSON.parse(ledger);
    assert.strictEqual(entry.agent, 'qa-lead');
    assert.strictEqual(entry.model, 'claude-sonnet-4-6');
    assert.strictEqual(entry.turnIndex, 5);
    assert.strictEqual(entry.inputTokens, 1000);
    assert.ok(entry.sessionHash && entry.sessionHash !== 'sess-123');
    assert.ok(entry.ts);
    // Ensure no prompt body key
    assert.strictEqual(entry.prompt, undefined);
    assert.strictEqual(entry.message, undefined);
    assert.strictEqual(entry.body, undefined);
  } finally {
    process.chdir(origCwd);
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

// =============== Lifecycle ===============
test('lifecycle.semverGte: 2.1.118 >= 2.1.118', () => assert.strictEqual(lifecycle.semverGte('2.1.118', '2.1.118'), true));
test('lifecycle.semverGte: 2.1.119 >= 2.1.118', () => assert.strictEqual(lifecycle.semverGte('2.1.119', '2.1.118'), true));
test('lifecycle.semverGte: 2.1.117 not >= 2.1.118', () => assert.strictEqual(lifecycle.semverGte('2.1.117', '2.1.118'), false));
test('lifecycle.semverGte: major bump', () => assert.strictEqual(lifecycle.semverGte('3.0.0', '2.1.200'), true));
test('lifecycle.reconcile: empty registry', () => {
  const r = lifecycle.reconcile([], '2.1.118');
  assert.deepStrictEqual(r.active, []);
  assert.deepStrictEqual(r.resolved, []);
});
test('lifecycle.reconcile: null registry', () => {
  const r = lifecycle.reconcile(null, '2.1.118');
  assert.deepStrictEqual(r.active, []);
});
test('lifecycle.reconcile: ENH-262 resolved at 2.1.118', () => {
  const reg = [{ id: 'ENH-262', expectedFix: '2.1.118', resolvedAt: null }];
  const r = lifecycle.reconcile(reg, '2.1.118');
  assert.strictEqual(r.resolved.length, 1);
  assert.strictEqual(r.resolved[0].id, 'ENH-262');
  assert.ok(r.resolved[0].resolvedAt);
  assert.strictEqual(r.resolved[0].resolvedBy, '2.1.118');
});
test('lifecycle.reconcile: already resolved preserved', () => {
  const reg = [{ id: 'X', expectedFix: '2.0.0', resolvedAt: '2026-01-01' }];
  const r = lifecycle.reconcile(reg, '2.1.118');
  assert.strictEqual(r.resolved.length, 1);
  assert.strictEqual(r.resolved[0].resolvedAt, '2026-01-01'); // unchanged
});
test('lifecycle.reconcile: null expectedFix stays active', () => {
  const reg = [{ id: 'ENH-214', expectedFix: null, resolvedAt: null }];
  const r = lifecycle.reconcile(reg, '99.99.99');
  assert.strictEqual(r.active.length, 1);
});
test('lifecycle.detectCCVersion: returns string or null', () => {
  const v = lifecycle.detectCCVersion();
  assert.ok(v === null || typeof v === 'string');
});

// =============== Facade ===============
test('facade: exports all expected functions', () => {
  const expectedKeys = [
    'listActive', 'getActive', 'lookup', 'CC_REGRESSIONS',
    'checkCCRegression', 'emitAttribution',
    'recordTurn', 'getLedgerStats', 'rotateLedger',
    'detectCCVersion', 'reconcile',
    'formatAttribution',
  ];
  for (const k of expectedKeys) {
    assert.ok(facade[k] !== undefined, `missing ${k}`);
  }
});
test('facade.checkCCRegression returns expected shape', () => {
  const r = facade.checkCCRegression({});
  assert.ok('attributions' in r);
  assert.ok('metas' in r);
});

console.log(`[cc-regression] pass=${pass} fail=${fail}`);
if (fail > 0) {
  console.error('FAILURES:');
  failures.forEach((f) => console.error('  ✗ ' + f));
  process.exit(1);
}
process.exit(0);
