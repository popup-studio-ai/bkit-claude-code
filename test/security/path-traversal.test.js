#!/usr/bin/env node
'use strict';

/**
 * Path Traversal Security Tests
 * Source: lib/control/scope-limiter.js
 * Tests null byte injection, symlink escape, traversal attacks, denied paths.
 */

const assert = require('assert');
const path = require('path');

let passed = 0, failed = 0, total = 0;
function test(id, desc, fn) {
  total++;
  try { fn(); passed++; } catch (e) { failed++; console.error(`  FAIL ${id}: ${desc}\n    ${e.message}`); }
}

console.log('\n=== Path Traversal Security Tests ===\n');

const { checkPathScope, matchesPattern, getEffectiveScope } = require('../../lib/control/scope-limiter');

// --- Normal allowed paths ---

test('PT-01', 'Normal path docs/01-plan/test.md allowed at L3', () => {
  const r = checkPathScope('docs/01-plan/test.md', 3);
  assert.strictEqual(r.allowed, true, `Expected allowed=true, got ${JSON.stringify(r)}`);
});

test('PT-02', 'Normal path lib/core/config.js allowed at L3', () => {
  const r = checkPathScope('lib/core/config.js', 3);
  assert.strictEqual(r.allowed, true, `Expected allowed=true, got ${JSON.stringify(r)}`);
});

test('PT-03', 'Normal path docs/01-plan/test.md allowed at L0 (strict)', () => {
  const r = checkPathScope('docs/01-plan/test.md', 0);
  assert.strictEqual(r.allowed, true, `Expected allowed=true at L0 for docs, got ${JSON.stringify(r)}`);
});

// --- Path traversal attacks ---

test('PT-04', 'Path traversal docs/../../.env blocked', () => {
  const r = checkPathScope('docs/../../.env', 3);
  assert.strictEqual(r.allowed, false, 'Traversal should be blocked');
  // Could be PATH_TRAVERSAL (escapes root) or DENIED_PATH (.env match)
  assert.ok(
    r.rule === 'PATH_TRAVERSAL' || r.rule === 'DENIED_PATH',
    `Expected PATH_TRAVERSAL or DENIED_PATH, got ${r.rule}`
  );
});

test('PT-05', 'Path traversal docs/../../../../etc/passwd blocked', () => {
  const r = checkPathScope('docs/../../../../etc/passwd', 3);
  assert.strictEqual(r.allowed, false, 'Deep traversal should be blocked');
  assert.strictEqual(r.rule, 'PATH_TRAVERSAL', `Expected PATH_TRAVERSAL, got ${r.rule}`);
});

// --- Null byte injection ---

test('PT-06', 'Null byte injection file.js\\0.env blocked', () => {
  const r = checkPathScope('file.js\0.env', 3);
  assert.strictEqual(r.allowed, false, 'Null byte should be blocked');
  assert.strictEqual(r.rule, 'NULL_BYTE', `Expected NULL_BYTE rule, got ${r.rule}`);
});

test('PT-07', 'Null byte in middle of path blocked', () => {
  const r = checkPathScope('docs/test\0/../../../etc/passwd', 3);
  assert.strictEqual(r.allowed, false, 'Null byte mid-path should be blocked');
  assert.strictEqual(r.rule, 'NULL_BYTE', `Expected NULL_BYTE rule, got ${r.rule}`);
});

// --- Dot segment normalization ---

test('PT-08', 'Dot segments docs/./../../.env blocked', () => {
  const r = checkPathScope('docs/./../../.env', 3);
  assert.strictEqual(r.allowed, false, 'Dot segments traversal should be blocked');
  assert.ok(
    r.rule === 'PATH_TRAVERSAL' || r.rule === 'DENIED_PATH',
    `Expected PATH_TRAVERSAL or DENIED_PATH, got ${r.rule}`
  );
});

// --- DENIED_PATH rules ---

test('PT-09', 'DENIED_PATH rule blocks .env files', () => {
  const r = checkPathScope('.env', 4);
  assert.strictEqual(r.allowed, false, '.env should be denied');
  assert.strictEqual(r.rule, 'DENIED_PATH', `Expected DENIED_PATH, got ${r.rule}`);
});

test('PT-10', 'DENIED_PATH pattern matches .key files (top-level)', () => {
  const scope = getEffectiveScope(4);
  const matched = matchesPattern('server.key', scope.deniedPaths);
  assert.strictEqual(matched, true, '*.key should match denied patterns');
});

test('PT-11', 'DENIED_PATH pattern matches .pem files (top-level)', () => {
  const scope = getEffectiveScope(4);
  const matched = matchesPattern('cert.pem', scope.deniedPaths);
  assert.strictEqual(matched, true, '*.pem should match denied patterns');
});

// --- NOT_IN_SCOPE at restricted levels ---

test('PT-12', 'NOT_IN_SCOPE: lib/ path blocked at L0 (strict)', () => {
  const r = checkPathScope('lib/core/config.js', 0);
  assert.strictEqual(r.allowed, false, 'lib/ should not be in scope at L0');
  assert.strictEqual(r.rule, 'NOT_IN_SCOPE', `Expected NOT_IN_SCOPE, got ${r.rule}`);
});

test('PT-13', 'NOT_IN_SCOPE: scripts/ path blocked at L1 (strict)', () => {
  const r = checkPathScope('scripts/unified-stop.js', 1);
  assert.strictEqual(r.allowed, false, 'scripts/ should not be in scope at L1');
  assert.strictEqual(r.rule, 'NOT_IN_SCOPE', `Expected NOT_IN_SCOPE, got ${r.rule}`);
});

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
