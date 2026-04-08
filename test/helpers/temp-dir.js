/**
 * Temp Dir — Temporary directory management for test isolation
 * @module test/helpers/temp-dir
 *
 * Design Ref: §3.2.3 — temp-dir.js
 * Creates isolated temporary directories with bkit state structure.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Execute a function with a temporary directory, auto-cleanup afterwards
 * @param {(tmpDir: string) => void|Promise<void>} fn
 * @returns {Promise<void>}
 */
async function withTempDir(fn) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-test-'));
  try {
    await fn(tmpDir);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

/**
 * Create a bkit state directory structure in the given directory
 * @param {string} baseDir
 */
function createBkitStateDir(baseDir) {
  const dirs = [
    '.bkit/state',
    '.bkit/runtime',
    '.bkit/checkpoints',
    '.bkit/audit',
    'docs/00-pm',
    'docs/01-plan/features',
    'docs/02-design/features',
    'docs/03-analysis',
    'docs/04-report/features',
  ];
  for (const dir of dirs) {
    fs.mkdirSync(path.join(baseDir, dir), { recursive: true });
  }

  // Create minimal pdca-status.json
  fs.writeFileSync(
    path.join(baseDir, '.bkit/state/pdca-status.json'),
    JSON.stringify({ version: '3.0', lastUpdated: new Date().toISOString(), features: {} }, null, 2)
  );
}

/**
 * Copy a fixture file to a destination
 * @param {string} fixtureName - Name in test/fixtures/
 * @param {string} destPath - Absolute destination path
 */
function copyFixture(fixtureName, destPath) {
  const fixturePath = path.resolve(__dirname, '../fixtures', fixtureName);
  if (fs.existsSync(fixturePath)) {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(fixturePath, destPath);
  }
}

/**
 * Create a temporary directory (without auto-cleanup)
 * @returns {string} Path to the temporary directory
 */
function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-test-'));
}

/**
 * Remove a directory recursively
 * @param {string} dirPath
 */
function removeTempDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

module.exports = { withTempDir, createBkitStateDir, copyFixture, createTempDir, removeTempDir };
