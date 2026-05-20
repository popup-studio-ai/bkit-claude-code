/**
 * QA L1 — Guard unit tests (ENH-254/262/263/264)
 * Scope: Sprint 0 + Sprint 1 P0
 * Target: 200+ assertions
 */
const assert = require('assert');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const enh262 = require(path.join(ROOT, 'lib/domain/guards/enh-262-hooks-combo'));
const enh263 = require(path.join(ROOT, 'lib/domain/guards/enh-263-claude-write'));
const enh264 = require(path.join(ROOT, 'lib/domain/guards/enh-264-token-threshold'));
const enh254 = require(path.join(ROOT, 'lib/domain/guards/enh-254-fork-precondition'));

let pass = 0, fail = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    pass++;
  } catch (e) {
    fail++;
    failures.push(`${name}: ${e.message}`);
  }
}

// =============== ENH-262 (Bash + dangerouslyDisableSandbox + allow) ===============
// Positive hits
test('ENH-262 positive: all conditions met', () => {
  const r = enh262.check({
    tool: 'Bash',
    envOverrides: { dangerouslyDisableSandbox: true },
    permissionDecision: 'allow',
  });
  assert.strictEqual(r.hit, true);
  assert.strictEqual(r.meta.id, 'ENH-262');
  assert.strictEqual(r.meta.severity, 'HIGH');
  assert.ok(r.meta.ccIssue.includes('51798'));
});

// Negative: various non-hit inputs
test('ENH-262 negative: null context', () => assert.strictEqual(enh262.check(null).hit, false));
test('ENH-262 negative: undefined context', () => assert.strictEqual(enh262.check(undefined).hit, false));
test('ENH-262 negative: empty object', () => assert.strictEqual(enh262.check({}).hit, false));
test('ENH-262 negative: string context', () => assert.strictEqual(enh262.check('bad').hit, false));
test('ENH-262 negative: number context', () => assert.strictEqual(enh262.check(42).hit, false));
test('ENH-262 negative: array context', () => assert.strictEqual(enh262.check([]).hit, false));
test('ENH-262 negative: tool=Write', () => {
  const r = enh262.check({ tool: 'Write', envOverrides: { dangerouslyDisableSandbox: true }, permissionDecision: 'allow' });
  assert.strictEqual(r.hit, false);
});
test('ENH-262 negative: tool=Edit', () => {
  const r = enh262.check({ tool: 'Edit', envOverrides: { dangerouslyDisableSandbox: true }, permissionDecision: 'allow' });
  assert.strictEqual(r.hit, false);
});
test('ENH-262 negative: tool=Read', () => {
  const r = enh262.check({ tool: 'Read', envOverrides: { dangerouslyDisableSandbox: true }, permissionDecision: 'allow' });
  assert.strictEqual(r.hit, false);
});
test('ENH-262 negative: tool=NotebookEdit', () => {
  const r = enh262.check({ tool: 'NotebookEdit', envOverrides: { dangerouslyDisableSandbox: true }, permissionDecision: 'allow' });
  assert.strictEqual(r.hit, false);
});
test('ENH-262 negative: envOverrides missing', () => {
  const r = enh262.check({ tool: 'Bash', permissionDecision: 'allow' });
  assert.strictEqual(r.hit, false);
});
test('ENH-262 negative: dangerouslyDisableSandbox false', () => {
  const r = enh262.check({ tool: 'Bash', envOverrides: { dangerouslyDisableSandbox: false }, permissionDecision: 'allow' });
  assert.strictEqual(r.hit, false);
});
test('ENH-262 negative: dangerouslyDisableSandbox truthy string not true', () => {
  const r = enh262.check({ tool: 'Bash', envOverrides: { dangerouslyDisableSandbox: 'true' }, permissionDecision: 'allow' });
  assert.strictEqual(r.hit, false);
});
test('ENH-262 negative: dangerouslyDisableSandbox 1 not true', () => {
  const r = enh262.check({ tool: 'Bash', envOverrides: { dangerouslyDisableSandbox: 1 }, permissionDecision: 'allow' });
  assert.strictEqual(r.hit, false);
});
test('ENH-262 negative: permissionDecision=deny', () => {
  const r = enh262.check({ tool: 'Bash', envOverrides: { dangerouslyDisableSandbox: true }, permissionDecision: 'deny' });
  assert.strictEqual(r.hit, false);
});
test('ENH-262 negative: permissionDecision=ask', () => {
  const r = enh262.check({ tool: 'Bash', envOverrides: { dangerouslyDisableSandbox: true }, permissionDecision: 'ask' });
  assert.strictEqual(r.hit, false);
});
test('ENH-262 negative: permissionDecision=defer', () => {
  const r = enh262.check({ tool: 'Bash', envOverrides: { dangerouslyDisableSandbox: true }, permissionDecision: 'defer' });
  assert.strictEqual(r.hit, false);
});
test('ENH-262 negative: permissionDecision missing', () => {
  const r = enh262.check({ tool: 'Bash', envOverrides: { dangerouslyDisableSandbox: true } });
  assert.strictEqual(r.hit, false);
});
test('ENH-262 negative: extra envOverrides keys OK without flag', () => {
  const r = enh262.check({ tool: 'Bash', envOverrides: { foo: 'bar' }, permissionDecision: 'allow' });
  assert.strictEqual(r.hit, false);
});

// removeWhen lifecycle
test('ENH-262 removeWhen: 2.1.117 active', () => assert.strictEqual(enh262.removeWhen('2.1.117'), false));
test('ENH-262 removeWhen: 2.1.118 removed', () => assert.strictEqual(enh262.removeWhen('2.1.118'), true));
test('ENH-262 removeWhen: 2.1.119 removed', () => assert.strictEqual(enh262.removeWhen('2.1.119'), true));
test('ENH-262 removeWhen: 2.1.200 removed', () => assert.strictEqual(enh262.removeWhen('2.1.200'), true));
test('ENH-262 removeWhen: 2.2.0 removed', () => assert.strictEqual(enh262.removeWhen('2.2.0'), true));
test('ENH-262 removeWhen: 3.0.0 removed', () => assert.strictEqual(enh262.removeWhen('3.0.0'), true));
test('ENH-262 removeWhen: 2.1.116 active', () => assert.strictEqual(enh262.removeWhen('2.1.116'), false));
test('ENH-262 removeWhen: 2.0.99 active (major<2.1)', () => assert.strictEqual(enh262.removeWhen('2.0.99'), false));
test('ENH-262 removeWhen: 1.9.99 active', () => assert.strictEqual(enh262.removeWhen('1.9.99'), false));
test('ENH-262 removeWhen: empty string', () => assert.strictEqual(enh262.removeWhen(''), false));
test('ENH-262 removeWhen: null', () => assert.strictEqual(enh262.removeWhen(null), false));
test('ENH-262 removeWhen: number type', () => assert.strictEqual(enh262.removeWhen(2), false));

// meta shape
test('ENH-262 meta.note is descriptive', () => {
  const r = enh262.check({ tool: 'Bash', envOverrides: { dangerouslyDisableSandbox: true }, permissionDecision: 'allow' });
  assert.ok(r.meta.note.length > 10);
});

// =============== ENH-263 (.claude/ + bypassPermissions + allow) ===============
const claudePaths = [
  '.claude/agents/foo.md',
  '.claude/skills/bar/SKILL.md',
  '.claude/channels/baz.json',
  '.claude/commands/cmd.md',
  '/absolute/path/.claude/agents/x.md',
  'relative/.claude/skills/y/SKILL.md',
];
const nonClaudePaths = [
  'src/foo.js',
  'docs/plan.md',
  '.claude/settings.json',  // not protected prefix
  '.claude/hooks.json',
  '.claude/README.md',
  'README.md',
  'lib/cc-regression/index.js',
];

for (const p of claudePaths) {
  test(`ENH-263 writesToClaude true: ${p}`, () => {
    assert.strictEqual(enh263.writesToClaude(p), true);
  });
}
for (const p of nonClaudePaths) {
  test(`ENH-263 writesToClaude false: ${p}`, () => {
    assert.strictEqual(enh263.writesToClaude(p), false);
  });
}

test('ENH-263 writesToClaude: null', () => assert.strictEqual(enh263.writesToClaude(null), false));
test('ENH-263 writesToClaude: undefined', () => assert.strictEqual(enh263.writesToClaude(undefined), false));
test('ENH-263 writesToClaude: empty string', () => assert.strictEqual(enh263.writesToClaude(''), false));
test('ENH-263 writesToClaude: number', () => assert.strictEqual(enh263.writesToClaude(42), false));

// positive
test('ENH-263 positive: Write to .claude/agents/', () => {
  const r = enh263.check({
    tool: 'Write', filePath: '.claude/agents/foo.md',
    bypassPermissions: true, permissionDecision: 'allow',
  });
  assert.strictEqual(r.hit, true);
  assert.strictEqual(r.meta.id, 'ENH-263');
  assert.strictEqual(r.meta.severity, 'HIGH');
});
test('ENH-263 positive: Edit to .claude/skills/', () => {
  const r = enh263.check({
    tool: 'Edit', filePath: '.claude/skills/x/SKILL.md',
    bypassPermissions: true, permissionDecision: 'allow',
  });
  assert.strictEqual(r.hit, true);
});
test('ENH-263 positive: NotebookEdit to .claude/commands/', () => {
  const r = enh263.check({
    tool: 'NotebookEdit', filePath: '.claude/commands/x.md',
    bypassPermissions: true, permissionDecision: 'allow',
  });
  assert.strictEqual(r.hit, true);
});
// negatives
test('ENH-263 negative: tool=Bash', () => {
  const r = enh263.check({ tool: 'Bash', filePath: '.claude/agents/x.md', bypassPermissions: true, permissionDecision: 'allow' });
  assert.strictEqual(r.hit, false);
});
test('ENH-263 negative: tool=Read', () => {
  const r = enh263.check({ tool: 'Read', filePath: '.claude/agents/x.md', bypassPermissions: true, permissionDecision: 'allow' });
  assert.strictEqual(r.hit, false);
});
test('ENH-263 negative: bypassPermissions false', () => {
  const r = enh263.check({ tool: 'Write', filePath: '.claude/agents/x.md', bypassPermissions: false, permissionDecision: 'allow' });
  assert.strictEqual(r.hit, false);
});
test('ENH-263 negative: bypassPermissions missing', () => {
  const r = enh263.check({ tool: 'Write', filePath: '.claude/agents/x.md', permissionDecision: 'allow' });
  assert.strictEqual(r.hit, false);
});
test('ENH-263 negative: permissionDecision=deny', () => {
  const r = enh263.check({ tool: 'Write', filePath: '.claude/agents/x.md', bypassPermissions: true, permissionDecision: 'deny' });
  assert.strictEqual(r.hit, false);
});
test('ENH-263 negative: non-.claude path', () => {
  const r = enh263.check({ tool: 'Write', filePath: 'src/foo.js', bypassPermissions: true, permissionDecision: 'allow' });
  assert.strictEqual(r.hit, false);
});
test('ENH-263 negative: .claude/settings.json (non-protected)', () => {
  const r = enh263.check({ tool: 'Write', filePath: '.claude/settings.json', bypassPermissions: true, permissionDecision: 'allow' });
  assert.strictEqual(r.hit, false);
});
test('ENH-263 negative: null context', () => assert.strictEqual(enh263.check(null).hit, false));
test('ENH-263 negative: empty context', () => assert.strictEqual(enh263.check({}).hit, false));

// CLAUDE_PROTECTED_PREFIXES integrity
test('ENH-263 CLAUDE_PROTECTED_PREFIXES is 4', () => assert.strictEqual(enh263.CLAUDE_PROTECTED_PREFIXES.length, 4));

// removeWhen
test('ENH-263 removeWhen: 2.1.118 removed', () => assert.strictEqual(enh263.removeWhen('2.1.118'), true));
test('ENH-263 removeWhen: 2.1.117 active', () => assert.strictEqual(enh263.removeWhen('2.1.117'), false));
test('ENH-263 removeWhen: empty', () => assert.strictEqual(enh263.removeWhen(''), false));

// =============== ENH-264 (Sonnet token overhead) ===============
test('ENH-264 positive: sonnet-4-6 perTurn over threshold', () => {
  const r = enh264.check({ model: 'claude-sonnet-4-6', inputTokens: 1000, outputTokens: 500, overheadDelta: 9000 });
  assert.strictEqual(r.hit, true);
  assert.strictEqual(r.meta.id, 'ENH-264');
  assert.strictEqual(r.meta.severity, 'HIGH');
  assert.ok(r.meta.ccIssue.includes('51809'));
});
test('ENH-264 positive: sonnet-4-5 perTurn over threshold', () => {
  const r = enh264.check({ model: 'claude-sonnet-4-5', inputTokens: 0, outputTokens: 0, overheadDelta: 8001 });
  assert.strictEqual(r.hit, true);
});
test('ENH-264 positive: session total exceeds', () => {
  const r = enh264.check({ model: 'claude-sonnet-4-6', overheadDelta: 100, sessionTotalOverhead: 100001 });
  assert.strictEqual(r.hit, true);
});
test('ENH-264 negative: perTurn exactly at threshold (not >)', () => {
  const r = enh264.check({ model: 'claude-sonnet-4-6', overheadDelta: 8000 });
  assert.strictEqual(r.hit, false);
});
test('ENH-264 negative: perTurn under threshold', () => {
  const r = enh264.check({ model: 'claude-sonnet-4-6', overheadDelta: 7999 });
  assert.strictEqual(r.hit, false);
});
test('ENH-264 negative: Opus model not tracked', () => {
  const r = enh264.check({ model: 'claude-opus-4-7', overheadDelta: 50000 });
  assert.strictEqual(r.hit, false);
});
test('ENH-264 negative: Haiku not tracked', () => {
  const r = enh264.check({ model: 'claude-haiku-4', overheadDelta: 50000 });
  assert.strictEqual(r.hit, false);
});
test('ENH-264 negative: unknown model', () => {
  const r = enh264.check({ model: 'gpt-4', overheadDelta: 50000 });
  assert.strictEqual(r.hit, false);
});
test('ENH-264 negative: missing model', () => {
  const r = enh264.check({ overheadDelta: 50000 });
  assert.strictEqual(r.hit, false);
});
test('ENH-264 negative: null', () => assert.strictEqual(enh264.check(null).hit, false));
test('ENH-264 negative: empty object', () => assert.strictEqual(enh264.check({}).hit, false));
test('ENH-264 constants: OVERHEAD_THRESHOLD=8000', () => assert.strictEqual(enh264.OVERHEAD_THRESHOLD, 8000));
test('ENH-264 constants: SESSION_TOTAL_THRESHOLD=100000', () => assert.strictEqual(enh264.SESSION_TOTAL_THRESHOLD, 100000));
test('ENH-264 constants: KNOWN_REGRESSION_MODELS includes sonnet-4-6', () => {
  assert.ok(enh264.KNOWN_REGRESSION_MODELS.includes('claude-sonnet-4-6'));
});
test('ENH-264 constants: KNOWN_REGRESSION_MODELS includes sonnet-4-5', () => {
  assert.ok(enh264.KNOWN_REGRESSION_MODELS.includes('claude-sonnet-4-5'));
});
test('ENH-264 note contains overhead value', () => {
  const r = enh264.check({ model: 'claude-sonnet-4-6', overheadDelta: 9876 });
  assert.ok(r.meta.note.includes('9876'));
});

// =============== ENH-254 (fork precondition) ===============
test('ENH-254 positive: win32 + disableModelInvocation + fork', () => {
  const r = enh254.check({ context: 'fork', skill: 'zero-script-qa', platform: 'win32', disableModelInvocation: true });
  assert.strictEqual(r.hit, true);
  assert.strictEqual(r.meta.id, 'ENH-254');
  assert.strictEqual(r.meta.severity, 'HIGH');
  assert.ok(r.meta.ccIssue.includes('51165'));
});
test('ENH-254 positive: forkSubagentEnv=false (external CC)', () => {
  const r = enh254.check({ context: 'fork', skill: 'zero-script-qa', forkSubagentEnv: false });
  assert.strictEqual(r.hit, true);
  assert.strictEqual(r.meta.severity, 'MEDIUM');
});
test('ENH-254 negative: context=main', () => {
  const r = enh254.check({ context: 'main', skill: 'x', platform: 'win32', disableModelInvocation: true });
  assert.strictEqual(r.hit, false);
});
test('ENH-254 negative: darwin + disable-model-invocation', () => {
  const r = enh254.check({ context: 'fork', skill: 'x', platform: 'darwin', disableModelInvocation: true });
  assert.strictEqual(r.hit, false);
});
test('ENH-254 negative: win32 without disable-model-invocation', () => {
  const r = enh254.check({ context: 'fork', skill: 'x', platform: 'win32', disableModelInvocation: false });
  assert.strictEqual(r.hit, false);
});
test('ENH-254 negative: null', () => assert.strictEqual(enh254.check(null).hit, false));
test('ENH-254 negative: empty', () => assert.strictEqual(enh254.check({}).hit, false));
test('ENH-254 negative: string context', () => assert.strictEqual(enh254.check('str').hit, false));
test('ENH-254 meta.note mentions skill name', () => {
  const r = enh254.check({ context: 'fork', skill: 'qa-test', platform: 'win32', disableModelInvocation: true });
  assert.ok(r.meta.note.includes('qa-test'));
});
test('ENH-254 removeWhen always false until documented', () => {
  assert.strictEqual(enh254.removeWhen('2.2.0'), false);
  assert.strictEqual(enh254.removeWhen('3.0.0'), false);
  assert.strictEqual(enh254.removeWhen(null), false);
});

// =============== Summary ===============
console.log(`[guards] pass=${pass} fail=${fail}`);
if (fail > 0) {
  console.error('FAILURES:');
  failures.forEach((f) => console.error('  ✗ ' + f));
  process.exit(1);
}
process.exit(0);
