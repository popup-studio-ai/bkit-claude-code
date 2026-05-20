'use strict';

/**
 * v2114-defense-memory-enforcer.test.js — L1 tests for ENH-286 Memory Enforcer.
 *
 * Coverage (22 TCs):
 *   EX  — extractDirectives (8 TCs)
 *   EN  — enforce (7 TCs)
 *   SER — serialize/deserialize roundtrip (4 TCs)
 *   API — frozen constants + module surface (3 TCs)
 *
 * Run: node tests/qa/v2114-defense-memory-enforcer.test.js
 */

const assert = require('node:assert/strict');
const path = require('node:path');

const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const me = require(path.join(PLUGIN_ROOT, 'lib/defense/memory-enforcer'));

let pass = 0;
let fail = 0;
let total = 0;
const failures = [];

function test(name, fn) {
  total += 1;
  try { fn(); pass += 1; }
  catch (e) { fail += 1; failures.push({ name, error: e.message }); }
}

// ── EX: extractDirectives ──────────────────────────────────────────

test('EX-01: extractDirectives null/empty → []', () => {
  assert.deepEqual(me.extractDirectives(''), []);
  assert.deepEqual(me.extractDirectives(null), []);
  assert.deepEqual(me.extractDirectives(undefined), []);
});

test('EX-02: extractDirectives picks up "Do NOT" lines', () => {
  const md = '- Do NOT push to main\n- Some other line';
  const d = me.extractDirectives(md);
  assert.equal(d.length, 1);
  assert.equal(d[0].rule, 'do-not');
  assert.equal(d[0].action, 'deny');
  assert.match(d[0].text, /push to main/);
});

test('EX-03: extractDirectives picks up "NEVER" lines', () => {
  const d = me.extractDirectives('NEVER rm -rf /\n');
  assert.equal(d.length, 1);
  assert.equal(d[0].rule, 'never');
  assert.equal(d[0].action, 'deny');
});

test('EX-04: extractDirectives picks up "MUST NOT" lines', () => {
  const d = me.extractDirectives('- MUST NOT delete production tables\n');
  assert.equal(d.length, 1);
  assert.equal(d[0].rule, 'must-not');
});

test('EX-05: extractDirectives picks up "FORBIDDEN:" lines', () => {
  const d = me.extractDirectives('FORBIDDEN: writing to /etc directly');
  assert.equal(d.length, 1);
  assert.equal(d[0].rule, 'forbidden');
});

test('EX-06: extractDirectives picks up "Avoid" as warn', () => {
  const d = me.extractDirectives('Avoid hardcoded credentials');
  assert.equal(d.length, 1);
  assert.equal(d[0].action, 'warn');
});

test('EX-07: extractDirectives dedups same rule+text', () => {
  const md = 'Do NOT use secrets\nDo NOT use secrets\nDo NOT use secrets';
  const d = me.extractDirectives(md);
  assert.equal(d.length, 1);
});

test('EX-08: extractDirectives truncates very long lines', () => {
  const long = 'x'.repeat(500);
  const d = me.extractDirectives('Do NOT ' + long);
  assert.equal(d.length, 1);
  assert.ok(d[0].text.length <= me.MAX_DIRECTIVE_LENGTH);
});

// ── EN: enforce ────────────────────────────────────────────────────

test('EN-01: enforce with empty directives → allowed', () => {
  const r = me.enforce({ tool: 'Bash', command: 'ls' }, []);
  assert.equal(r.allowed, true);
  assert.equal(r.matched, 0);
});

test('EN-02: enforce with null toolCall → allowed', () => {
  const d = me.extractDirectives('Do NOT use rm -rf');
  assert.equal(me.enforce(null, d).allowed, true);
});

test('EN-03: enforce denies on matching deny directive', () => {
  const d = me.extractDirectives('Do NOT use rm -rf');
  const r = me.enforce({ tool: 'Bash', command: 'sudo use rm -rf /' }, d);
  assert.equal(r.allowed, false);
  assert.ok(r.deniedBy);
  assert.equal(r.deniedBy.rule, 'do-not');
});

test('EN-04: enforce returns warn directives without denying', () => {
  const d = me.extractDirectives('Avoid hardcoded credentials');
  const r = me.enforce({ tool: 'Bash', command: 'echo hardcoded credentials' }, d);
  assert.equal(r.allowed, true);
  assert.equal(r.warnings.length, 1);
});

test('EN-05: enforce checks file_path field', () => {
  const d = me.extractDirectives('Do NOT touch /etc/passwd');
  const r = me.enforce({ tool: 'Write', file_path: '/sbin/touch /etc/passwd bypass' }, d);
  assert.equal(r.allowed, false);
});

test('EN-06: enforce checks content field', () => {
  const d = me.extractDirectives('Do NOT include secret tokens');
  // Conservative substring matching: directive text must appear verbatim.
  const r = me.enforce({ tool: 'Write', content: 'config should not include secret tokens here' }, d);
  assert.equal(r.allowed, false);
});

test('EN-07: enforce checks args object string values', () => {
  const d = me.extractDirectives('Do NOT deploy to prod');
  const r = me.enforce({ tool: 'Bash', args: { target: 'will deploy to prod tomorrow' } }, d);
  assert.equal(r.allowed, false);
});

// ── SER: serialize/deserialize ─────────────────────────────────────

test('SER-01: serializeDirectives produces JSON-safe shape', () => {
  const d = me.extractDirectives('Do NOT push to main\nNEVER use rm -rf');
  const s = me.serializeDirectives(d);
  assert.equal(s.count, 2);
  assert.equal(s.items.length, 2);
  assert.ok(typeof s.version === 'string');
  // ensure round-trippable via JSON
  const round = JSON.parse(JSON.stringify(s));
  assert.equal(round.count, 2);
});

test('SER-02: deserializeDirectives recreates RegExp', () => {
  const d = me.extractDirectives('Do NOT push to main');
  const s = me.serializeDirectives(d);
  const d2 = me.deserializeDirectives(s);
  assert.equal(d2.length, 1);
  assert.ok(d2[0].regex instanceof RegExp);
});

test('SER-03: serialize → deserialize → enforce roundtrip', () => {
  const orig = me.extractDirectives('Do NOT delete production data');
  const json = JSON.parse(JSON.stringify(me.serializeDirectives(orig)));
  const restored = me.deserializeDirectives(json);
  const r = me.enforce({ tool: 'Bash', command: 'should delete production data now' }, restored);
  assert.equal(r.allowed, false);
});

test('SER-04: deserialize handles malformed input gracefully', () => {
  assert.deepEqual(me.deserializeDirectives(null), []);
  assert.deepEqual(me.deserializeDirectives({}), []);
  assert.deepEqual(me.deserializeDirectives({ items: 'not array' }), []);
});

// ── API: frozen surface ────────────────────────────────────────────

test('API-01: DIRECTIVE_RULES frozen + ≥4 rules', () => {
  assert.ok(Object.isFrozen(me.DIRECTIVE_RULES));
  assert.ok(me.DIRECTIVE_RULES.length >= 4);
  for (const r of me.DIRECTIVE_RULES) assert.ok(Object.isFrozen(r));
});

test('API-02: MAX_DIRECTIVE_LENGTH + MAX_DIRECTIVES sane defaults', () => {
  assert.ok(me.MAX_DIRECTIVE_LENGTH >= 80);
  assert.ok(me.MAX_DIRECTIVES >= 10);
});

test('API-03: exports include public surface', () => {
  for (const k of ['extractDirectives', 'enforce', 'serializeDirectives', 'deserializeDirectives']) {
    assert.equal(typeof me[k], 'function', 'missing: ' + k);
  }
});

// ── Summary ────────────────────────────────────────────────────────

// eslint-disable-next-line no-console
console.log(`\n[v2114 L1 memory-enforcer] total=${total} pass=${pass} fail=${fail}`);
if (fail > 0) {
  for (const f of failures) console.error('  ✗', f.name + ':', f.error);
  process.exit(1);
}
console.log('✓ all PASS');
process.exit(0);
