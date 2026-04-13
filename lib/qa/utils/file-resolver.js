/**
 * File Resolver — resolve require/import paths and file existence checks
 * @module lib/qa/utils/file-resolver
 * @version 2.1.4
 */

const fs = require('fs');
const path = require('path');

/**
 * Resolve a require/import path relative to the importing file
 * @param {string} fromFile - Absolute path of the file containing the require
 * @param {string} requirePath - The path string from require() or import
 * @returns {string|null} Absolute resolved path, or null if not found
 */
function resolveRequirePath(fromFile, requirePath) {
  // Skip non-relative paths (npm packages)
  if (!requirePath.startsWith('.') && !requirePath.startsWith('/')) {
    return null;
  }

  const dir = path.dirname(fromFile);
  const resolved = path.resolve(dir, requirePath);

  // Try exact path
  if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
    return resolved;
  }

  // Try with .js extension
  const withJs = resolved + '.js';
  if (fs.existsSync(withJs)) {
    return withJs;
  }

  // Try with .json extension
  const withJson = resolved + '.json';
  if (fs.existsSync(withJson)) {
    return withJson;
  }

  // Try as directory with index.js
  const indexJs = path.join(resolved, 'index.js');
  if (fs.existsSync(indexJs)) {
    return indexJs;
  }

  return null;
}

/**
 * Check if a file exists
 * @param {string} filePath - Absolute path to check
 * @returns {boolean}
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

/**
 * Get JavaScript files matching glob-like patterns using recursive directory scan
 * @param {string[]} globPatterns - Patterns like 'lib/**\/*.js', 'hooks/**\/*.js'
 * @param {string[]} excludePatterns - Patterns to exclude like 'node_modules', '*.test.js'
 * @param {string} rootDir - Project root directory
 * @returns {string[]} Array of absolute file paths
 */
function getJsFiles(globPatterns, excludePatterns = [], rootDir = process.cwd()) {
  const results = [];

  for (const pattern of globPatterns) {
    // Parse the pattern: e.g., 'lib/**/*.js' -> baseDir='lib', ext='.js'
    const parts = pattern.split('/');
    let baseDir = '';
    let recursive = false;
    let ext = '.js';

    for (const part of parts) {
      if (part === '**') {
        recursive = true;
      } else if (part.startsWith('*')) {
        // Extract extension from wildcard like '*.js'
        ext = part.replace('*', '');
      } else {
        baseDir = baseDir ? path.join(baseDir, part) : part;
      }
    }

    const fullBaseDir = path.resolve(rootDir, baseDir);
    if (!fs.existsSync(fullBaseDir)) continue;

    const files = recursive
      ? walkDirRecursive(fullBaseDir, ext, excludePatterns)
      : listDir(fullBaseDir, ext, excludePatterns);

    results.push(...files);
  }

  // Deduplicate
  return [...new Set(results)];
}

/**
 * Recursively walk a directory and collect files matching the extension
 * @param {string} dir - Directory to walk
 * @param {string} ext - File extension to match (e.g., '.js')
 * @param {string[]} excludePatterns - Patterns to exclude
 * @returns {string[]}
 */
function walkDirRecursive(dir, ext, excludePatterns = []) {
  const results = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Check exclusions
      if (shouldExclude(fullPath, entry.name, excludePatterns)) continue;

      if (entry.isDirectory()) {
        results.push(...walkDirRecursive(fullPath, ext, excludePatterns));
      } else if (entry.isFile() && entry.name.endsWith(ext)) {
        results.push(fullPath);
      }
    }
  } catch {
    // Skip directories we cannot read
  }

  return results;
}

/**
 * List files in a single directory (non-recursive)
 * @param {string} dir - Directory to list
 * @param {string} ext - File extension to match
 * @param {string[]} excludePatterns - Patterns to exclude
 * @returns {string[]}
 */
function listDir(dir, ext, excludePatterns = []) {
  const results = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(ext)) {
        const fullPath = path.join(dir, entry.name);
        if (!shouldExclude(fullPath, entry.name, excludePatterns)) {
          results.push(fullPath);
        }
      }
    }
  } catch {
    // Skip directories we cannot read
  }

  return results;
}

/**
 * Check if a path should be excluded based on patterns
 * @param {string} fullPath - Full file path
 * @param {string} name - File/directory name
 * @param {string[]} excludePatterns - Exclusion patterns
 * @returns {boolean}
 */
function shouldExclude(fullPath, name, excludePatterns) {
  for (const pattern of excludePatterns) {
    // Simple name match (e.g., 'node_modules', 'tests')
    if (name === pattern) return true;

    // Extension pattern (e.g., '*.test.js')
    if (pattern.startsWith('*.') && name.endsWith(pattern.slice(1))) return true;

    // Glob-style directory pattern (e.g., 'node_modules/**')
    const base = pattern.replace(/\/?\*\*$/, '');
    if (base && (name === base || fullPath.includes(`/${base}/`))) return true;
  }

  return false;
}

/**
 * Read a file and return its lines
 * @param {string} filePath - Absolute path to the file
 * @returns {string[]} Array of lines
 */
function readFileLines(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8').split('\n');
  } catch {
    return [];
  }
}

module.exports = {
  resolveRequirePath,
  fileExists,
  getJsFiles,
  readFileLines,
  walkDirRecursive,
  shouldExclude
};
