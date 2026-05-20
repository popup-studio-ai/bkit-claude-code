/**
 * v2114-defense-heredoc.test.js — L1 unit tests for ENH-310 Heredoc Pipe
 * Bypass Defense (Sub-Sprint 2, bkit differentiation #6).
 *
 * Coverage (50+ TCs):
 *   CR — critical patterns: heredoc + execution vector (30 TCs)
 *   WG — warning patterns: lone heredoc (5 TCs)
 *   NM — not match: plain commands, escaped patterns (15 TCs)
 *
 * Run: node tests/qa/v2114-defense-heredoc.test.js
 *
 * Sprint Ref: v2114-differentiation-release (Sub-Sprint 2 Defense)
 */

'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');

const PLUGIN_ROOT = path.resolve(__dirname, '../../');
const { detect, CRITICAL_PATTERNS, WARNING_PATTERNS, CRITICAL_ALTERNATIVES, WARNING_ALTERNATIVES } = require(path.join(PLUGIN_ROOT, 'lib/defense/heredoc-detector'));

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

// Helpers — build heredoc patterns without typing the literal sequence at top
// level (so this test file is itself safe to author with the hook active).
const HD = '<' + '<';        // "<<"
const HDD = '<' + '<' + '<'; // "<<<"
const HDESC = '\\' + '<' + '<'; // escaped heredoc start

function critPipe(interpreter) {
  return `cat ${HD}'EOF'\nrm /\nEOF\n| ${interpreter}`;
}
function critSub(prefix) {
  return `${prefix}cat ${HD}EOF\nrm /\nEOF\n)`;
}

// ──────────────────────────────────────────────────────────────────────────
// CRITICAL group (30 TCs)
// ──────────────────────────────────────────────────────────────────────────

test('CR-01: heredoc | bash → critical/pipe-shell', () => {
  const v = detect(critPipe('bash'));
  assert.equal(v.severity, 'critical');
  assert.equal(v.vector, 'pipe-shell');
});

test('CR-02: heredoc | sh → critical', () => {
  assert.equal(detect(critPipe('sh')).severity, 'critical');
});

test('CR-03: heredoc | zsh → critical', () => {
  assert.equal(detect(critPipe('zsh')).severity, 'critical');
});

test('CR-04: heredoc | ksh → critical', () => {
  assert.equal(detect(critPipe('ksh')).severity, 'critical');
});

test('CR-05: heredoc | dash → critical', () => {
  assert.equal(detect(critPipe('dash')).severity, 'critical');
});

test('CR-06: heredoc | fish → critical', () => {
  assert.equal(detect(critPipe('fish')).severity, 'critical');
});

test('CR-07: heredoc | exec → critical', () => {
  assert.equal(detect(critPipe('exec')).severity, 'critical');
});

test('CR-08: heredoc | env → critical', () => {
  assert.equal(detect(critPipe('env')).severity, 'critical');
});

test('CR-09: heredoc | eval → critical/eval-source', () => {
  const v = detect(critPipe('eval'));
  assert.equal(v.severity, 'critical');
  assert.equal(v.vector, 'eval-source');
});

test('CR-10: heredoc | source → critical/eval-source', () => {
  const v = detect(critPipe('source'));
  assert.equal(v.severity, 'critical');
  assert.equal(v.vector, 'eval-source');
});

test('CR-11: heredoc | . path → critical/eval-source', () => {
  const v = detect(`cat ${HD}EOF\nrm /\nEOF\n| . /tmp/x`);
  assert.equal(v.severity, 'critical');
  assert.equal(v.vector, 'eval-source');
});

test('CR-12: heredoc | sudo → critical/sudo', () => {
  const v = detect(critPipe('sudo'));
  assert.equal(v.severity, 'critical');
  assert.equal(v.vector, 'sudo');
});

test('CR-13: heredoc | doas → critical/sudo', () => {
  assert.equal(detect(critPipe('doas')).severity, 'critical');
});

test('CR-14: $(cat <<EOF …) substitution → critical/sub', () => {
  const v = detect(critSub('echo $('));
  assert.equal(v.severity, 'critical');
  assert.equal(v.vector, 'sub');
});

test('CR-15: $(bash <<EOF …) → critical/sub', () => {
  const v = detect(`echo $(bash ${HD}EOF\nrm /\nEOF\n)`);
  assert.equal(v.severity, 'critical');
  assert.equal(v.vector, 'sub');
});

test('CR-16: $(bash -c "…<<EOF") → critical/sub', () => {
  const v = detect(`bash -c "$(bash -c '${HD}EOF\nrm\nEOF\n')"`);
  assert.equal(v.severity, 'critical');
});

test('CR-17: backtick `cat <<EOF` → critical/sub', () => {
  const v = detect('echo `cat ' + HD + 'EOF\nrm\nEOF\n`');
  assert.equal(v.severity, 'critical');
  assert.equal(v.vector, 'sub');
});

test('CR-18: here-string <<< | bash → critical/pipe-shell', () => {
  const v = detect(`echo ${HDD} "rm /" | bash`);
  assert.equal(v.severity, 'critical');
  assert.equal(v.vector, 'pipe-shell');
});

test('CR-19: heredoc | xargs bash → critical/pipe-shell', () => {
  const v = detect(`cat ${HD}EOF\nls\nEOF\n| xargs bash`);
  assert.equal(v.severity, 'critical');
  assert.equal(v.vector, 'pipe-shell');
});

test('CR-20: heredoc | xargs sh → critical', () => {
  assert.equal(detect(`cat ${HD}EOF\nls\nEOF\n| xargs sh`).severity, 'critical');
});

test('CR-21: heredoc with - dash variant (HD-) | bash → critical', () => {
  const v = detect(`cat ${HD}-EOF\nrm /\nEOF\n| bash`);
  assert.equal(v.severity, 'critical');
});

test('CR-22: heredoc with quoted tag | bash → critical', () => {
  const v = detect(`cat ${HD}"END"\nrm /\nEND\n| bash`);
  assert.equal(v.severity, 'critical');
});

test('CR-23: heredoc with single-quoted tag | bash → critical', () => {
  const v = detect(`cat ${HD}'TAG'\nrm /\nTAG\n| bash`);
  assert.equal(v.severity, 'critical');
});

test('CR-24: nested heredoc body containing $(  ) → critical (outer matched first)', () => {
  const v = detect(`cat ${HD}EOF\n\${whoami\nEOF\n| bash`);
  assert.equal(v.severity, 'critical');
});

test('CR-25: heredoc + multiline payload | bash → critical', () => {
  const cmd = `cat ${HD}EOF\nline1\nline2\nline3\nrm -rf /\nEOF\n| bash`;
  assert.equal(detect(cmd).severity, 'critical');
});

test('CR-26: heredoc | bash --login → critical (matches bash word)', () => {
  const v = detect(`cat ${HD}EOF\nrm\nEOF\n| bash --login`);
  assert.equal(v.severity, 'critical');
});

test('CR-27: critical verdict carries pattern + reason + alternatives', () => {
  const v = detect(critPipe('bash'));
  assert.equal(v.matched, true);
  assert.ok(v.pattern && v.pattern.length > 0);
  assert.ok(/ENH-310/.test(v.reason));
  assert.ok(Array.isArray(v.alternatives) && v.alternatives.length >= 1);
});

test('CR-28: critical alternatives is a copy (mutation does not affect source)', () => {
  const v = detect(critPipe('bash'));
  const before = v.alternatives.length;
  v.alternatives.push('mutated');
  const v2 = detect(critPipe('bash'));
  assert.equal(v2.alternatives.length, before);
});

test('CR-29: $(cat <<TAG) with cat path-prefix → critical/sub', () => {
  const v = detect(`echo $(/bin/cat ${HD}EOF\nrm\nEOF\n)`);
  assert.equal(v.severity, 'critical');
});

test('CR-30: heredoc | bash combined with destructive payload still critical', () => {
  const v = detect(`cat ${HD}'KILL'\nrm -rf /var/log\nKILL\n| bash`);
  assert.equal(v.severity, 'critical');
});

// ──────────────────────────────────────────────────────────────────────────
// WARNING group (5 TCs)
// ──────────────────────────────────────────────────────────────────────────

test('WG-01: lone heredoc (cat <<EOF ...) → warning', () => {
  const v = detect(`cat ${HD}EOF\nhello\nEOF`);
  assert.equal(v.severity, 'warning');
  assert.equal(v.vector, 'lone-heredoc');
});

test('WG-02: lone heredoc with file redirect → warning', () => {
  const v = detect(`cat > file.txt ${HD}EOF\nhello\nEOF`);
  assert.equal(v.severity, 'warning');
});

test('WG-03: mysql heredoc → warning (no exec vector)', () => {
  const v = detect(`mysql -u root ${HD}SQL\nSELECT 1;\nSQL`);
  assert.equal(v.severity, 'warning');
});

test('WG-04: lone here-string <<< → warning', () => {
  const v = detect(`base64 ${HDD} "hello"`);
  assert.equal(v.severity, 'warning');
});

test('WG-05: warning alternatives present + non-critical reason', () => {
  const v = detect(`cat ${HD}EOF\nx\nEOF`);
  assert.match(v.reason, /ENH-310 heredoc audit/);
  assert.ok(v.alternatives.length >= 1);
});

// ──────────────────────────────────────────────────────────────────────────
// NOT MATCH group (15 TCs)
// ──────────────────────────────────────────────────────────────────────────

test('NM-01: empty string → not match', () => {
  assert.equal(detect('').matched, false);
});

test('NM-02: null → not match', () => {
  assert.equal(detect(null).matched, false);
});

test('NM-03: undefined → not match', () => {
  assert.equal(detect(undefined).matched, false);
});

test('NM-04: number → not match', () => {
  assert.equal(detect(42).matched, false);
});

test('NM-05: ls -la → not match', () => {
  assert.equal(detect('ls -la').matched, false);
});

test('NM-06: npm test → not match', () => {
  assert.equal(detect('npm test').matched, false);
});

test('NM-07: git status → not match', () => {
  assert.equal(detect('git status').matched, false);
});

test('NM-08: $(date) alone (no heredoc) → not match', () => {
  assert.equal(detect('echo $(date)').matched, false);
});

test('NM-09: pipe to bash alone (no heredoc) → not match', () => {
  assert.equal(detect('echo "hi" | bash').matched, false);
});

test('NM-10: escaped $( does not promote to critical', () => {
  const v = detect(`echo "${HDESC}\\$(date)"`);
  // Either not matched or warning at worst — never critical
  assert.notEqual(v.severity, 'critical');
});

test('NM-11: escaped heredoc start does not match', () => {
  const v = detect(`echo "${HDESC}EOF"`);
  assert.notEqual(v.severity, 'critical');
});

test('NM-12: single < (not heredoc) → not match', () => {
  assert.equal(detect('cat < file.txt').matched, false);
});

test('NM-13: short input "<" → not match', () => {
  assert.equal(detect('<').matched, false);
});

test('NM-14: pure stdout command → not match', () => {
  assert.equal(detect('echo "hello world"').matched, false);
});

test('NM-15: array-like → not match', () => {
  assert.equal(detect([]).matched, false);
  assert.equal(detect({}).matched, false);
});

// ──────────────────────────────────────────────────────────────────────────
// Pattern structural invariants
// ──────────────────────────────────────────────────────────────────────────

test('SI-01: CRITICAL_PATTERNS frozen, ≥ 20 entries', () => {
  assert.ok(Object.isFrozen(CRITICAL_PATTERNS));
  assert.ok(CRITICAL_PATTERNS.length >= 20);
});

test('SI-02: WARNING_PATTERNS frozen, ≥ 2 entries', () => {
  assert.ok(Object.isFrozen(WARNING_PATTERNS));
  assert.ok(WARNING_PATTERNS.length >= 2);
});

test('SI-03: ALTERNATIVES arrays frozen', () => {
  assert.ok(Object.isFrozen(CRITICAL_ALTERNATIVES));
  assert.ok(Object.isFrozen(WARNING_ALTERNATIVES));
});

// ──────────────────────────────────────────────────────────────────────────
// Summary
// ──────────────────────────────────────────────────────────────────────────
// eslint-disable-next-line no-console
console.log(`\n[v2114 L1 defense-heredoc] total=${total} pass=${pass} fail=${fail}`);
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
