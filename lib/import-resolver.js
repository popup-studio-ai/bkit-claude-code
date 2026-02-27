#!/usr/bin/env node
/**
 * @import Directive Resolver (FR-02)
 * Resolves and loads external context files from SKILL.md/Agent.md
 *
 * @version 1.5.6
 * @module lib/import-resolver
 */

const fs = require('fs');
const path = require('path');

// Import from other modules (lazy to avoid circular dependency)
let _common = null;
let _hierarchy = null;

function getCommon() {
  if (!_common) {
    _common = require('./common.js');
  }
  return _common;
}

function getHierarchy() {
  if (!_hierarchy) {
    _hierarchy = require('./context-hierarchy.js');
  }
  return _hierarchy;
}

// Track imports to detect circular dependencies
const _importStack = new Set();

// TTL cache for resolved imports
const _importCache = new Map();
const IMPORT_CACHE_TTL = 30000;  // 30 seconds

/**
 * Resolve variable in import path
 * @param {string} importPath - Path with variables
 * @returns {string} Resolved path
 */
function resolveVariables(importPath) {
  const common = getCommon();
  const hierarchy = getHierarchy();

  return importPath
    .replace(/\$\{PLUGIN_ROOT\}/g, common.PLUGIN_ROOT)
    .replace(/\$\{PROJECT\}/g, common.PROJECT_DIR)
    .replace(/\$\{USER_CONFIG\}/g, hierarchy.getUserConfigDir());
}

/**
 * Resolve relative import path
 * @param {string} importPath - Import path
 * @param {string} fromFile - Source file path
 * @returns {string} Absolute path
 */
function resolveImportPath(importPath, fromFile) {
  // Resolve variables first
  let resolved = resolveVariables(importPath);

  // Handle relative paths
  if (resolved.startsWith('./') || resolved.startsWith('../')) {
    const fromDir = path.dirname(fromFile);
    resolved = path.resolve(fromDir, resolved);
  }

  return resolved;
}

/**
 * Load and cache imported content
 * @param {string} absolutePath - Absolute file path
 * @returns {string} File content or empty string
 */
function loadImportedContent(absolutePath) {
  const common = getCommon();

  // Check cache
  const cached = _importCache.get(absolutePath);
  if (cached && (Date.now() - cached.timestamp < IMPORT_CACHE_TTL)) {
    return cached.content;
  }

  try {
    if (!fs.existsSync(absolutePath)) {
      common.debugLog('ImportResolver', 'Import file not found', { path: absolutePath });
      return '';
    }

    const content = fs.readFileSync(absolutePath, 'utf8');

    // Cache the content
    _importCache.set(absolutePath, {
      content,
      timestamp: Date.now()
    });

    return content;
  } catch (e) {
    common.debugLog('ImportResolver', 'Failed to load import', { path: absolutePath, error: e.message });
    return '';
  }
}

/**
 * Detect circular import
 * @param {string} absolutePath - File to import
 * @returns {boolean} True if circular
 */
function detectCircularImport(absolutePath) {
  return _importStack.has(absolutePath);
}

/**
 * Resolve all imports in a frontmatter
 * @param {Object} frontmatter - Parsed YAML frontmatter
 * @param {string} sourceFile - Source file path
 * @returns {{ content: string, errors: string[] }}
 */
function resolveImports(frontmatter, sourceFile) {
  const common = getCommon();
  const imports = frontmatter.imports || [];
  const errors = [];
  const contents = [];

  if (!Array.isArray(imports) || imports.length === 0) {
    return { content: '', errors: [] };
  }

  common.debugLog('ImportResolver', 'Resolving imports', {
    sourceFile,
    importCount: imports.length
  });

  for (const importPath of imports) {
    const absolutePath = resolveImportPath(importPath, sourceFile);

    // Check for circular import
    if (detectCircularImport(absolutePath)) {
      errors.push(`Circular import detected: ${importPath}`);
      continue;
    }

    // Add to stack for circular detection
    _importStack.add(absolutePath);

    try {
      const content = loadImportedContent(absolutePath);
      if (content) {
        contents.push(`<!-- Imported from: ${importPath} -->\n${content}`);
      } else {
        errors.push(`Failed to load: ${importPath}`);
      }
    } finally {
      // Remove from stack
      _importStack.delete(absolutePath);
    }
  }

  return {
    content: contents.join('\n\n'),
    errors
  };
}

/**
 * Parse frontmatter from markdown content
 * @param {string} content - Markdown content
 * @returns {{ frontmatter: Object, body: string }}
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  try {
    // Simple YAML parsing for imports array
    const yamlStr = match[1];
    const frontmatter = {};

    // Parse imports array
    const importsMatch = yamlStr.match(/imports:\s*\n((?:\s+-\s+.+\n?)+)/);
    if (importsMatch) {
      const importsLines = importsMatch[1].split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('-'))
        .map(line => line.replace(/^-\s+/, '').trim());
      frontmatter.imports = importsLines;
    }

    // Parse other simple key-value pairs
    const lines = yamlStr.split('\n');
    for (const line of lines) {
      const kvMatch = line.match(/^(\w+):\s*(.+)$/);
      if (kvMatch && kvMatch[1] !== 'imports') {
        frontmatter[kvMatch[1]] = kvMatch[2].trim();
      }
    }

    return { frontmatter, body: match[2] };
  } catch (e) {
    return { frontmatter: {}, body: content };
  }
}

/**
 * Process markdown file with import resolution
 * @param {string} filePath - Path to markdown file
 * @returns {{ content: string, errors: string[] }}
 */
function processMarkdownWithImports(filePath) {
  const common = getCommon();

  if (!fs.existsSync(filePath)) {
    return { content: '', errors: [`File not found: ${filePath}`] };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(content);

  if (!frontmatter.imports || frontmatter.imports.length === 0) {
    return { content, errors: [] };
  }

  const { content: importedContent, errors } = resolveImports(frontmatter, filePath);

  if (importedContent) {
    // Insert imported content after frontmatter
    const processedContent = content.replace(
      /^(---[\s\S]*?---\r?\n)/,
      `$1\n${importedContent}\n\n`
    );
    return { content: processedContent, errors };
  }

  return { content, errors };
}

/**
 * Clear import cache
 */
function clearImportCache() {
  _importCache.clear();
}

/**
 * Get cache statistics
 * @returns {{ size: number, entries: string[] }}
 */
function getCacheStats() {
  return {
    size: _importCache.size,
    entries: Array.from(_importCache.keys())
  };
}

module.exports = {
  resolveImports,
  resolveImportPath,
  resolveVariables,
  loadImportedContent,
  detectCircularImport,
  parseFrontmatter,
  processMarkdownWithImports,
  clearImportCache,
  getCacheStats,
  IMPORT_CACHE_TTL
};
