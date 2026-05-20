/**
 * ScannerBase unit tests
 * @module tests/qa/scanner-base.test
 *
 * Tests T1-T3 from design doc section 8.1:
 *   T1: addIssue -> getSummary (severity counts)
 *   T2: scan() not implemented -> Error throw
 *   T3: reset() -> issues cleared
 *
 * Run: node tests/qa/scanner-base.test.js
 */

'use strict';

const assert = require('assert');
const path = require('path');

// Resolve from project root
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const ScannerBase = require(path.join(PROJECT_ROOT, 'lib/qa/scanner-base'));

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS: ${name}`);
  } catch (err) {
    failed++;
    console.error(`  FAIL: ${name}`);
    console.error(`        ${err.message}`);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  PASS: ${name}`);
  } catch (err) {
    failed++;
    console.error(`  FAIL: ${name}`);
    console.error(`        ${err.message}`);
  }
}

console.log('\n=== ScannerBase Tests ===\n');

// --- Constructor defaults ---

test('constructor sets name', () => {
  const scanner = new ScannerBase('test-scanner');
  assert.strictEqual(scanner.name, 'test-scanner');
});

test('constructor defaults rootDir to cwd', () => {
  const scanner = new ScannerBase('test-scanner');
  assert.strictEqual(scanner.rootDir, process.cwd());
});

test('constructor defaults include to empty array', () => {
  const scanner = new ScannerBase('test-scanner');
  assert.deepStrictEqual(scanner.include, []);
});

test('constructor defaults exclude with node_modules and test files', () => {
  const scanner = new ScannerBase('test-scanner');
  assert.ok(Array.isArray(scanner.exclude));
  assert.ok(scanner.exclude.includes('node_modules/**'));
  assert.ok(scanner.exclude.includes('*.test.js'));
});

test('constructor defaults verbose to false', () => {
  const scanner = new ScannerBase('test-scanner');
  assert.strictEqual(scanner.verbose, false);
});

test('constructor initializes empty issues array', () => {
  const scanner = new ScannerBase('test-scanner');
  assert.deepStrictEqual(scanner.issues, []);
});

test('constructor accepts custom options', () => {
  const scanner = new ScannerBase('test-scanner', {
    rootDir: '/custom/path',
    include: ['lib/**/*.js'],
    exclude: ['dist/**'],
    verbose: true
  });
  assert.strictEqual(scanner.rootDir, '/custom/path');
  assert.deepStrictEqual(scanner.include, ['lib/**/*.js']);
  assert.deepStrictEqual(scanner.exclude, ['dist/**']);
  assert.strictEqual(scanner.verbose, true);
});

// --- addIssue() ---

test('addIssue adds a CRITICAL issue correctly', () => {
  const scanner = new ScannerBase('test-scanner');
  scanner.addIssue('CRITICAL', 'lib/foo.js', 10, 'require target not found', 'stale-require', 'Remove the require');
  assert.strictEqual(scanner.issues.length, 1);
  const issue = scanner.issues[0];
  assert.strictEqual(issue.severity, 'CRITICAL');
  assert.strictEqual(issue.file, 'lib/foo.js');
  assert.strictEqual(issue.line, 10);
  assert.strictEqual(issue.message, 'require target not found');
  assert.strictEqual(issue.pattern, 'stale-require');
  assert.strictEqual(issue.fix, 'Remove the require');
});

test('addIssue defaults fix to null when not provided', () => {
  const scanner = new ScannerBase('test-scanner');
  scanner.addIssue('WARNING', 'lib/bar.js', 5, 'unused export', 'unused-export');
  assert.strictEqual(scanner.issues[0].fix, null);
});

test('addIssue accumulates multiple issues', () => {
  const scanner = new ScannerBase('test-scanner');
  scanner.addIssue('CRITICAL', 'a.js', 1, 'msg1', 'p1');
  scanner.addIssue('WARNING', 'b.js', 2, 'msg2', 'p2');
  scanner.addIssue('INFO', 'c.js', 3, 'msg3', 'p3');
  assert.strictEqual(scanner.issues.length, 3);
});

// --- getSummary() (T1) ---

test('getSummary returns correct severity counts', () => {
  const scanner = new ScannerBase('test-scanner');
  scanner.addIssue('CRITICAL', 'a.js', 1, 'msg', 'p1');
  scanner.addIssue('CRITICAL', 'b.js', 2, 'msg', 'p2');
  scanner.addIssue('WARNING', 'c.js', 3, 'msg', 'p3');
  scanner.addIssue('INFO', 'd.js', 4, 'msg', 'p4');
  scanner.addIssue('INFO', 'e.js', 5, 'msg', 'p5');
  scanner.addIssue('INFO', 'f.js', 6, 'msg', 'p6');

  const summary = scanner.getSummary();
  assert.strictEqual(summary.critical, 2);
  assert.strictEqual(summary.warning, 1);
  assert.strictEqual(summary.info, 3);
  assert.strictEqual(summary.total, 6);
});

test('getSummary returns zeros when no issues', () => {
  const scanner = new ScannerBase('test-scanner');
  const summary = scanner.getSummary();
  assert.strictEqual(summary.critical, 0);
  assert.strictEqual(summary.warning, 0);
  assert.strictEqual(summary.info, 0);
  assert.strictEqual(summary.total, 0);
});

// --- reset() (T3) ---

test('reset clears all issues', () => {
  const scanner = new ScannerBase('test-scanner');
  scanner.addIssue('CRITICAL', 'a.js', 1, 'msg', 'p1');
  scanner.addIssue('WARNING', 'b.js', 2, 'msg', 'p2');
  assert.strictEqual(scanner.issues.length, 2);

  scanner.reset();
  assert.strictEqual(scanner.issues.length, 0);
  assert.deepStrictEqual(scanner.issues, []);
});

test('reset allows re-adding issues', () => {
  const scanner = new ScannerBase('test-scanner');
  scanner.addIssue('CRITICAL', 'a.js', 1, 'msg', 'p1');
  scanner.reset();
  scanner.addIssue('INFO', 'b.js', 2, 'new msg', 'p2');
  assert.strictEqual(scanner.issues.length, 1);
  assert.strictEqual(scanner.issues[0].severity, 'INFO');
});

// --- scan() abstract (T2) ---

(async () => {
  await testAsync('scan() throws Error when not implemented', async () => {
    const scanner = new ScannerBase('test-scanner');
    try {
      await scanner.scan();
      assert.fail('Expected scan() to throw');
    } catch (err) {
      assert.ok(err.message.includes('scan() must be implemented'));
      assert.ok(err.message.includes('test-scanner'));
    }
  });

  // --- formatReport() ---

  test('formatReport returns a string', () => {
    const scanner = new ScannerBase('test-scanner');
    scanner.addIssue('WARNING', 'a.js', 1, 'test message', 'test-pattern');
    const report = scanner.formatReport('console');
    assert.strictEqual(typeof report, 'string');
    assert.ok(report.length > 0);
  });

  test('formatReport works with no issues', () => {
    const scanner = new ScannerBase('test-scanner');
    const report = scanner.formatReport('console');
    assert.strictEqual(typeof report, 'string');
  });

  // --- Subclass behavior ---

  test('subclass can override scan()', () => {
    class TestScanner extends ScannerBase {
      async scan() {
        this.addIssue('INFO', 'test.js', 1, 'found something', 'test-pattern');
        return this.issues;
      }
    }
    const scanner = new TestScanner('test-child');
    assert.strictEqual(scanner.name, 'test-child');
  });

  await testAsync('subclass scan() runs without error', async () => {
    class TestScanner extends ScannerBase {
      async scan() {
        this.addIssue('INFO', 'test.js', 1, 'found something', 'test-pattern');
        return this.issues;
      }
    }
    const scanner = new TestScanner('test-child');
    const issues = await scanner.scan();
    assert.strictEqual(issues.length, 1);
    assert.strictEqual(issues[0].pattern, 'test-pattern');
  });

  // --- Summary ---
  console.log(`\nResults: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  process.exit(failed > 0 ? 1 : 0);
})();
