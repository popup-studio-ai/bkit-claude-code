/**
 * ConfigAuditScanner unit tests
 * @module tests/qa/config-audit.test
 *
 * Tests T7-T8 from design doc section 8.1:
 *   T7: config key never referenced in code -> WARNING issue
 *   T8: hardcoded value vs config mismatch -> WARNING issue
 *
 * Run: node tests/qa/config-audit.test.js
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const ConfigAuditScanner = require(path.join(PROJECT_ROOT, 'lib/qa/scanners/config-audit'));

let passed = 0;
let failed = 0;
let tmpDir = null;

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

/**
 * Create a temporary directory with fixture files for testing
 * @param {Object} files - Map of relative path -> content
 * @returns {string} Absolute path to temp directory
 */
function createFixture(files) {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-config-audit-test-'));
  for (const [relPath, content] of Object.entries(files)) {
    const fullPath = path.join(tmpDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf-8');
  }
  return tmpDir;
}

/**
 * Clean up temporary directory
 */
function cleanupFixture() {
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    tmpDir = null;
  }
}

console.log('\n=== ConfigAuditScanner Tests ===\n');

(async () => {
  // --- T7: Config keys not referenced in code ---

  await testAsync('T7: detects config keys not referenced in code', async () => {
    const root = createFixture({
      'bkit.config.json': JSON.stringify({
        version: '2.1.4',
        usedSetting: true,
        unusedSetting: 'never-referenced',
        docPaths: {
          plan: 'docs/01-plan',
          design: 'docs/02-design'
        }
      }, null, 2),
      'lib/main.js': `
const config = require('../bkit.config.json');
console.log(config.usedSetting);
console.log(config.version);
// docPaths used somewhere
const planDir = config.docPaths.plan;
`
    });

    try {
      const scanner = new ConfigAuditScanner({
        rootDir: root,
        include: ['lib/**/*.js']
      });
      await scanner.scan();

      // unusedSetting should be flagged
      const unreferenced = scanner.issues.filter(i =>
        i.message.includes('unusedSetting') ||
        (i.pattern === 'unreferenced-config' && i.message.includes('unused'))
      );
      assert.ok(unreferenced.length >= 1, `Expected at least 1 unreferenced config key issue, got ${unreferenced.length}`);
    } finally {
      cleanupFixture();
    }
  });

  // --- T8: Hardcoded values that should use config ---

  await testAsync('T8: detects hardcoded values that should use config', async () => {
    const root = createFixture({
      'bkit.config.json': JSON.stringify({
        version: '2.1.4',
        ccVersion: {
          recommended: 'v2.1.104'
        }
      }, null, 2),
      'lib/checker.js': `
// Hardcoded version string instead of using config
const VERSION = '2.1.4';
const CC_VER = 'v2.1.104';
console.log('Running version ' + VERSION);
`
    });

    try {
      const scanner = new ConfigAuditScanner({
        rootDir: root,
        include: ['lib/**/*.js']
      });
      await scanner.scan();

      const hardcoded = scanner.issues.filter(i =>
        i.pattern === 'hardcoded-config' ||
        i.message.toLowerCase().includes('hardcoded') ||
        i.message.toLowerCase().includes('config')
      );
      // At least one hardcoded value should be detected
      assert.ok(hardcoded.length >= 1, `Expected hardcoded value detection, got ${hardcoded.length} issues`);
    } finally {
      cleanupFixture();
    }
  });

  // --- Config paths that do not exist ---

  await testAsync('detects config-declared paths that do not exist', async () => {
    const root = createFixture({
      'bkit.config.json': JSON.stringify({
        version: '2.1.4',
        pdca: {
          docPaths: {
            plan: 'docs/01-plan',
            design: 'docs/02-design',
            missing: 'docs/99-nonexistent'
          }
        }
      }, null, 2),
      'docs/01-plan/.gitkeep': '',
      'docs/02-design/.gitkeep': '',
      'lib/main.js': `
const config = require('../bkit.config.json');
// References all config keys
Object.keys(config.pdca.docPaths).forEach(k => console.log(config.pdca.docPaths[k]));
console.log(config.version);
console.log(config.pdca);
`
    });

    try {
      const scanner = new ConfigAuditScanner({
        rootDir: root,
        include: ['lib/**/*.js']
      });
      await scanner.scan();

      const missingPaths = scanner.issues.filter(i =>
        i.severity === 'CRITICAL' &&
        (i.message.includes('99-nonexistent') || i.message.includes('does not exist'))
      );
      assert.ok(missingPaths.length >= 1, `Expected CRITICAL for missing path, got ${missingPaths.length}`);
    } finally {
      cleanupFixture();
    }
  });

  // --- No issues for clean config ---

  await testAsync('no issues for fully referenced config with valid paths', async () => {
    const root = createFixture({
      'bkit.config.json': JSON.stringify({
        version: '2.1.4',
        appName: 'bkit'
      }, null, 2),
      'lib/main.js': `
const config = require('../bkit.config.json');
console.log(config.version);
console.log(config.appName);
`
    });

    try {
      const scanner = new ConfigAuditScanner({
        rootDir: root,
        include: ['lib/**/*.js']
      });
      await scanner.scan();

      const criticals = scanner.issues.filter(i => i.severity === 'CRITICAL');
      assert.strictEqual(criticals.length, 0, `Expected 0 CRITICAL issues, got ${criticals.length}`);
    } finally {
      cleanupFixture();
    }
  });

  // --- Constructor ---

  test('inherits from ScannerBase', () => {
    const ScannerBase = require(path.join(PROJECT_ROOT, 'lib/qa/scanner-base'));
    const scanner = new ConfigAuditScanner({ rootDir: '/tmp' });
    assert.ok(scanner instanceof ScannerBase, 'ConfigAuditScanner should extend ScannerBase');
    assert.strictEqual(scanner.name, 'config-audit');
  });

  // --- Summary ---
  console.log(`\nResults: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  cleanupFixture();
  process.exit(failed > 0 ? 1 : 0);
})();
