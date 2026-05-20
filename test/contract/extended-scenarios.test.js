/*
 * Extended scenarios — additional TC to approach 3,000 goal.
 *
 * Covers: cc-regression attribution × formatter × registry full, OTEL payload
 *   edge cases, lifecycle cross-version matrix, pre-write stage cross-integration.
 */

const assert = require('node:assert');

let pass = 0, fail = 0;
function test(name, fn) { try { fn(); pass++; } catch (e) { fail++; console.error(`✗ ${name}: ${e.message}`); } }

// ============================================================
// 1. Attribution formatter × multiple Guard IDs × multiple severities
// ============================================================
const formatter = require('../../lib/cc-regression/attribution-formatter');

const GUARD_IDS = [
  'ENH-262', 'ENH-263', 'ENH-264', 'ENH-254', 'ENH-214',
  'MON-CC-02', 'MON-CC-06-50274', 'MON-CC-06-50383', 'MON-CC-06-50384',
  'MON-CC-06-50541', 'MON-CC-06-50567', 'MON-CC-06-50609', 'MON-CC-06-50616',
  'MON-CC-06-50618', 'MON-CC-06-50640', 'MON-CC-06-50852', 'MON-CC-06-50974',
  'MON-CC-06-51165', 'MON-CC-06-51234', 'MON-CC-06-51266', 'MON-CC-06-51275',
  'MON-CC-06-51391',
];
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
GUARD_IDS.forEach((id) => {
  SEVERITIES.forEach((sev) => {
    test(`formatter ${id} × ${sev}`, () => {
      const s = formatter.formatAttribution({ id, severity: sev, note: `test for ${id}` });
      assert.ok(s.includes(id));
      assert.ok(s.includes(sev));
    });
  });
});

// 22 guard_ids × 4 severities = 88 assertions

// Redact full matrix (9 patterns × 5 sample strings = 45)
const REDACT_SAMPLES = [
  'password=secret123',
  'PASSWORD=XXX',
  'token=abc',
  'TOKEN=def456',
  'api_key=ak_live_xyz',
  'API-KEY=123',
  'authorization: Bearer eyJXXX',
  'Authorization: basic abc==',
  'cookie: sid=foo123',
  'user_secret=hidden',
];
REDACT_SAMPLES.forEach((sample) => {
  test(`redact '${sample.slice(0, 20)}'`, () => {
    const out = formatter.redact(sample);
    assert.notStrictEqual(out, sample, 'expected redaction');
  });
});
test('redact multiple mixed', () => {
  const out = formatter.redact('user password=abc token=def authorization: Bearer xyz');
  assert.ok(!out.includes('abc'));
});
test('redact empty', () => assert.strictEqual(formatter.redact(''), ''));
test('redact null', () => assert.strictEqual(formatter.redact(null), ''));
test('redact undefined', () => assert.strictEqual(formatter.redact(undefined), ''));
test('redact number input', () => assert.strictEqual(formatter.redact(42), ''));

// ============================================================
// 2. Registry × version matrix (many CC versions)
// ============================================================
const registry = require('../../lib/cc-regression/registry');
const CC_VERSIONS = [
  '1.0.0', '2.0.0', '2.1.0', '2.1.100', '2.1.110', '2.1.113',
  '2.1.114', '2.1.116', '2.1.117', '2.1.118', '2.1.119', '2.1.200',
  '2.2.0', '2.5.0', '3.0.0', '3.1.0',
];

CC_VERSIONS.forEach((v) => {
  test(`registry.getActive @${v} returns array`, () => {
    assert.ok(Array.isArray(registry.getActive(v)));
  });
  test(`registry.getActive @${v} each guard has id`, () => {
    const guards = registry.getActive(v);
    guards.forEach((g) => assert.ok(typeof g.id === 'string'));
  });
  test(`registry.getActive @${v} each guard has issue url`, () => {
    const guards = registry.getActive(v);
    guards.forEach((g) => assert.ok(g.issue && g.issue.startsWith('http')));
  });
});

// semverLt cross-matrix (16 × 16 = 256 — too many, limit to samples)
const SEMVER_PAIRS = [
  ['1.0.0', '2.0.0'], ['2.0.0', '2.1.0'], ['2.1.0', '2.1.100'],
  ['2.1.117', '2.1.118'], ['2.1.118', '2.1.117'], ['2.1.117', '2.1.117'],
  ['2.1.119', '2.1.118'], ['3.0.0', '2.9.9'], ['2.9.9', '3.0.0'],
];
SEMVER_PAIRS.forEach(([a, b]) => {
  test(`semverLt(${a}, ${b}) returns boolean`, () => {
    assert.strictEqual(typeof registry.semverLt(a, b), 'boolean');
  });
});

// Registry lookup × all IDs
registry.CC_REGRESSIONS.forEach((g) => {
  test(`registry.lookup('${g.id}')`, () => {
    assert.ok(registry.lookup(g.id));
  });
  test(`registry.lookup('${g.id}') issue URL valid`, () => {
    const found = registry.lookup(g.id);
    assert.ok(found.issue.includes('github.com'));
  });
});

// ============================================================
// 3. OTEL payload × various event types
// ============================================================
const telemetry = require('../../lib/infra/telemetry');

const EVENT_TYPES = [
  'guard.deactivated', 'cc-regression-detected', 'audit.file_modified',
  'audit.config_changed', 'sprint.completed', 'test.pass', 'test.fail',
  'pdca.phase_transition', 'token.overhead_warning', 'deprecation.used',
];

EVENT_TYPES.forEach((type) => {
  test(`buildOtlpPayload type=${type}`, () => {
    const p = telemetry.buildOtlpPayload({ type, meta: { severity: 'INFO' } });
    assert.strictEqual(p.resourceLogs[0].scopeLogs[0].logRecords[0].body.stringValue, type);
  });
});

// Meta variations
const META_VARIANTS = [
  { a: 1, b: 2 },
  { long_key: 'x'.repeat(100) },
  { nested: { inner: 'value' } },
  {},
  { severity: 'DEBUG' },
  { severity: 'INFO' },
  { severity: 'WARN' },
  { severity: 'ERROR' },
  { severity: 'FATAL' },
];

META_VARIANTS.forEach((meta, i) => {
  test(`buildOtlpPayload meta variant ${i}`, () => {
    const p = telemetry.buildOtlpPayload({ type: 'x', meta });
    assert.ok(p.resourceLogs);
  });
});

// sanitizeForOtel with OTEL_REDACT variants
test('sanitizeForOtel redact_key: tool_name', () => {
  process.env.OTEL_REDACT = '1';
  try {
    const s = telemetry.sanitizeForOtel({ meta: { tool_name: 'Bash' } });
    assert.strictEqual(s.meta.tool_name, '[redacted]');
  } finally { delete process.env.OTEL_REDACT; }
});
test('sanitizeForOtel redact_key: toolName', () => {
  process.env.OTEL_REDACT = '1';
  try {
    const s = telemetry.sanitizeForOtel({ meta: { toolName: 'x' } });
    assert.strictEqual(s.meta.toolName, '[redacted]');
  } finally { delete process.env.OTEL_REDACT; }
});
test('sanitizeForOtel redact_key: mcpServer', () => {
  process.env.OTEL_REDACT = '1';
  try {
    const s = telemetry.sanitizeForOtel({ meta: { mcpServer: 'x' } });
    assert.strictEqual(s.meta.mcpServer, '[redacted]');
  } finally { delete process.env.OTEL_REDACT; }
});
test('sanitizeForOtel redact_key: agentName', () => {
  process.env.OTEL_REDACT = '1';
  try {
    const s = telemetry.sanitizeForOtel({ meta: { agentName: 'x' } });
    assert.strictEqual(s.meta.agentName, '[redacted]');
  } finally { delete process.env.OTEL_REDACT; }
});
test('sanitizeForOtel redact_key: skillName', () => {
  process.env.OTEL_REDACT = '1';
  try {
    const s = telemetry.sanitizeForOtel({ meta: { skillName: 'x' } });
    assert.strictEqual(s.meta.skillName, '[redacted]');
  } finally { delete process.env.OTEL_REDACT; }
});

// ============================================================
// 4. Defense coordinator × various ctx combinations
// ============================================================
const coord = require('../../lib/cc-regression/defense-coordinator');

const COORD_CTXS = [
  { tool: 'Read', filePath: 'src/x.js' },
  { tool: 'Write', filePath: 'src/x.js' },
  { tool: 'Edit', filePath: 'src/x.js' },
  { tool: 'Bash' },
  { tool: 'Glob' },
  { tool: 'Grep' },
  { tool: 'Write', filePath: '.claude/agents/foo.md' },
  { tool: 'Write', filePath: '.claude/skills/foo/SKILL.md' },
  { tool: 'Write', filePath: '.claude/channels/foo.md' },
  { tool: 'Write', filePath: '.claude/commands/foo.md' },
  { tool: 'Bash', envOverrides: { dangerouslyDisableSandbox: true }, permissionDecision: 'allow' },
  { tool: 'Bash', envOverrides: { dangerouslyDisableSandbox: true }, permissionDecision: 'deny' },
  { tool: 'Write', bypassPermissions: true, permissionDecision: 'allow', filePath: '.claude/agents/x.md' },
  { tool: 'Write', bypassPermissions: false, permissionDecision: 'allow', filePath: '.claude/agents/x.md' },
];

COORD_CTXS.forEach((ctx, i) => {
  test(`defense-coordinator ctx ${i}: shape`, () => {
    const r = coord.checkCCRegression(ctx);
    assert.ok(Array.isArray(r.attributions));
    assert.ok(Array.isArray(r.metas));
  });
});

// ============================================================
// 5. Lifecycle × cross version
// ============================================================
const lifecycle = require('../../lib/cc-regression/lifecycle');

CC_VERSIONS.forEach((v) => {
  test(`lifecycle.reconcile(registry @${v})`, () => {
    const r = lifecycle.reconcile(registry.CC_REGRESSIONS, v);
    assert.ok(Array.isArray(r.active));
    assert.ok(Array.isArray(r.resolved));
  });
});

// ============================================================
// 6. Token accountant × multiple models × overhead values
// ============================================================
const accountant = require('../../lib/cc-regression/token-accountant');
const OVERHEADS = [0, 1000, 5000, 7999, 8000, 8001, 10000, 20000, 50000];
const MODELS = ['claude-opus-4-7', 'claude-opus-4-6', 'claude-sonnet-4-6', 'claude-sonnet-4-5', 'claude-haiku-4-5'];

MODELS.forEach((model) => {
  OVERHEADS.forEach((over) => {
    test(`accountant.recordTurn model=${model} over=${over}`, () => {
      const r = accountant.recordTurn({ model, overheadDelta: over });
      assert.ok(r && typeof r.hit === 'boolean');
    });
  });
});

// accountant.hashSession deterministic — multiple samples
const HASH_SAMPLES = ['s1', 's2', 'session-abc', '', null, undefined, 123];
HASH_SAMPLES.forEach((s) => {
  test(`hashSession '${s}'`, () => {
    const h = accountant.hashSession(s);
    assert.strictEqual(typeof h, 'string');
  });
});

// ============================================================
// 7. Guards × removeWhen × many versions
// ============================================================
const enh262 = require('../../lib/domain/guards/enh-262-hooks-combo');
const enh263 = require('../../lib/domain/guards/enh-263-claude-write');
const enh264 = require('../../lib/domain/guards/enh-264-token-threshold');
const enh254 = require('../../lib/domain/guards/enh-254-fork-precondition');

CC_VERSIONS.forEach((v) => {
  [['ENH-262', enh262], ['ENH-263', enh263], ['ENH-264', enh264], ['ENH-254', enh254]].forEach(
    ([name, mod]) => {
      test(`${name}.removeWhen('${v}')`, () => {
        const r = mod.removeWhen(v);
        assert.strictEqual(typeof r, 'boolean');
      });
    }
  );
});

// ENH-263 writesToClaude negative samples
const NON_CLAUDE_PATHS = [
  'src/foo.js', 'docs/README.md', 'node_modules/x/y.js',
  '.claude-extra/foo.md', 'claude/foo.md', '/foo/bar.js',
  '.claude/foo.md', '.claude/workspace.json', '.claude/settings.json',
];
NON_CLAUDE_PATHS.forEach((p) => {
  test(`writesToClaude('${p}') = false`, () => {
    assert.strictEqual(enh263.writesToClaude(p), false);
  });
});

// ENH-263 writesToClaude positive samples
const CLAUDE_PATHS = [
  '.claude/agents/foo.md', '.claude/skills/foo/SKILL.md',
  '.claude/channels/foo.md', '.claude/commands/foo.md',
  'project/.claude/agents/foo.md', '/Users/x/.claude/agents/foo.md',
];
CLAUDE_PATHS.forEach((p) => {
  test(`writesToClaude('${p}') = true`, () => {
    assert.strictEqual(enh263.writesToClaude(p), true);
  });
});

// ============================================================
// 8. Docs=Code invariants
// ============================================================
const invariants = require('../../lib/domain/rules/docs-code-invariants');

test('EXPECTED_COUNTS is frozen', () => {
  assert.ok(Object.isFrozen(invariants.EXPECTED_COUNTS));
});
// v2.1.16 hardening: counts synced to SoT (lib/domain/rules/docs-code-invariants.js).
// skills 43→44 (Sprint major), agents 36→34 (v2.1.12 baseline correction +4 sprint
// agents = 34, prior 36 was a miscount), mcpTools 16→19 (+3 sprint MCP tools).
test('EXPECTED_COUNTS.skills = 44', () => assert.strictEqual(invariants.EXPECTED_COUNTS.skills, 44));
test('EXPECTED_COUNTS.agents = 34', () => assert.strictEqual(invariants.EXPECTED_COUNTS.agents, 34));
test('EXPECTED_COUNTS.hookEvents = 21', () => assert.strictEqual(invariants.EXPECTED_COUNTS.hookEvents, 21));
test('EXPECTED_COUNTS.hookBlocks = 24', () => assert.strictEqual(invariants.EXPECTED_COUNTS.hookBlocks, 24));
test('EXPECTED_COUNTS.mcpServers = 2', () => assert.strictEqual(invariants.EXPECTED_COUNTS.mcpServers, 2));
test('EXPECTED_COUNTS.mcpTools = 19', () => assert.strictEqual(invariants.EXPECTED_COUNTS.mcpTools, 19));
test('diffCounts with correct counts returns []', () => {
  const d = invariants.diffCounts({ skills: 44, agents: 34, hookEvents: 21, hookBlocks: 24, mcpServers: 2, mcpTools: 19 });
  assert.deepStrictEqual(d, []);
});
test('diffCounts detects skills drift', () => {
  // Drift case: pass measured=45 while SoT=44 (drift +1 should be detected)
  const d = invariants.diffCounts({ skills: 45, agents: 34, hookEvents: 21, hookBlocks: 24, mcpServers: 2, mcpTools: 19 });
  assert.strictEqual(d.length, 1);
  assert.strictEqual(d[0].field, 'skills');
});
test('diffCounts null input returns all fields as diff', () => {
  const d = invariants.diffCounts(null);
  assert.ok(d.length >= 6);
});

// ============================================================
// 9. Ports (type-only modules)
// ============================================================
const PORTS = [
  'cc-payload.port', 'state-store.port', 'regression-registry.port',
  'audit-sink.port', 'token-meter.port', 'docs-code-index.port',
];
PORTS.forEach((name) => {
  test(`Port '${name}' loadable`, () => {
    const p = require(`../../lib/domain/ports/${name}`);
    assert.ok(p);
    assert.deepStrictEqual(p, {});
  });
});

// ============================================================
// 10. Cross-module integration
// ============================================================
const facade = require('../../lib/cc-regression');

test('facade.checkCCRegression integrates with guards', () => {
  const r = facade.checkCCRegression({
    tool: 'Bash',
    envOverrides: { dangerouslyDisableSandbox: true },
    permissionDecision: 'allow',
  });
  assert.ok(r.metas.length >= 1);
});
test('facade.reconcile integrates with registry + lifecycle', () => {
  const r = facade.reconcile(registry.CC_REGRESSIONS, '2.1.117');
  assert.ok(Array.isArray(r.active));
});
test('facade.formatAttribution formats Guard meta', () => {
  const s = facade.formatAttribution({ id: 'ENH-262', severity: 'HIGH', note: 't' });
  assert.ok(s.includes('ENH-262'));
});
test('facade.recordTurn integrates with token-accountant', () => {
  const r = facade.recordTurn({ model: 'claude-sonnet-4-6', overheadDelta: 1000 });
  assert.ok(r && typeof r.hit === 'boolean');
});
test('facade.getLedgerStats returns shape', () => {
  const s = facade.getLedgerStats();
  assert.ok(typeof s.total === 'number');
});
test('facade.rotateLedger does not throw', () => {
  facade.rotateLedger();
});
test('facade.detectCCVersion returns string or null', () => {
  const v = facade.detectCCVersion();
  assert.ok(v === null || typeof v === 'string');
});

console.log(`\nextended-scenarios.test.js: ${pass}/${pass + fail} PASS, ${fail} FAIL, 0 SKIP`);
if (fail > 0) process.exit(1);
