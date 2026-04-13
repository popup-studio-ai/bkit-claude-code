/**
 * Pattern Matcher — regex pattern utilities for code analysis
 * @module lib/qa/utils/pattern-matcher
 * @version 2.1.4
 */

/**
 * Extract require() calls from file content
 * @param {string} content - File content
 * @returns {Array<{path: string, line: number}>}
 */
function extractRequires(content) {
  const results = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match require('path') and require("path")
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    let match;
    while ((match = requireRegex.exec(line)) !== null) {
      results.push({ path: match[1], line: i + 1 });
    }

    // Match import ... from 'path'
    const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
    while ((match = importRegex.exec(line)) !== null) {
      results.push({ path: match[1], line: i + 1 });
    }

    // Match dynamic import('path')
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = dynamicImportRegex.exec(line)) !== null) {
      results.push({ path: match[1], line: i + 1 });
    }
  }

  return results;
}

/**
 * Extract exports from file content (module.exports keys)
 * @param {string} content - File content
 * @returns {Array<{name: string, line: number}>}
 */
function extractExports(content) {
  const results = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match module.exports = { key1, key2 } or module.exports = { key1: value }
    // Match exports.name = ...
    const exportDotRegex = /exports\.(\w+)\s*=/g;
    let match;
    while ((match = exportDotRegex.exec(line)) !== null) {
      results.push({ name: match[1], line: i + 1 });
    }
  }

  // Also parse module.exports = { ... } block
  const moduleExportsMatch = content.match(/module\.exports\s*=\s*\{([^}]*)\}/s);
  if (moduleExportsMatch) {
    const block = moduleExportsMatch[1];
    const blockLines = block.split('\n');
    const startOffset = content.substring(0, moduleExportsMatch.index).split('\n').length;

    for (let i = 0; i < blockLines.length; i++) {
      const line = blockLines[i].trim();
      // Match "key:" or "key," (shorthand property)
      const keyMatch = line.match(/^(\w+)\s*[,:]/);
      if (keyMatch) {
        results.push({ name: keyMatch[1], line: startOffset + i });
      }
    }
  }

  return results;
}

/**
 * Extract YAML-like frontmatter from a markdown file
 * @param {string} content - File content
 * @returns {Object} Parsed frontmatter as key-value pairs
 */
function extractFrontmatter(content) {
  const result = {};
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fmMatch) return result;

  const fmContent = fmMatch[1];
  const lines = fmContent.split('\n');

  for (const line of lines) {
    // Simple key: value parsing (handles strings, numbers, lists on same line)
    const kvMatch = line.match(/^(\w[\w-]*)\s*:\s*(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      let value = kvMatch[2].trim();

      // Strip quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // Parse comma-separated lists in brackets
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''));
      }

      // Parse numbers
      if (typeof value === 'string' && /^\d+$/.test(value)) {
        value = parseInt(value, 10);
      }

      result[key] = value;
    }
  }

  return result;
}

/**
 * Extract shell code blocks (```! blocks) from markdown content
 * @param {string} content - Markdown file content
 * @returns {Array<{code: string, startLine: number}>}
 */
function extractShellBlocks(content) {
  const results = [];
  const lines = content.split('\n');
  let inBlock = false;
  let blockLines = [];
  let startLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!inBlock && line.trim().startsWith('```!')) {
      inBlock = true;
      startLine = i + 1; // 1-based
      blockLines = [];
    } else if (inBlock && line.trim() === '```') {
      inBlock = false;
      results.push({
        code: blockLines.join('\n'),
        startLine
      });
    } else if (inBlock) {
      blockLines.push(line);
    }
  }

  return results;
}

/**
 * Match a regex pattern against content with line numbers
 * @param {string} content - Content to search
 * @param {RegExp} regex - Pattern to match (should have global flag)
 * @returns {Array<{match: string, line: number, index: number}>}
 */
function matchPattern(content, regex) {
  const results = [];
  const lines = content.split('\n');

  // Ensure global flag
  const flags = regex.flags.includes('g') ? regex.flags : regex.flags + 'g';
  const globalRegex = new RegExp(regex.source, flags);

  for (let i = 0; i < lines.length; i++) {
    let match;
    while ((match = globalRegex.exec(lines[i])) !== null) {
      results.push({
        match: match[0],
        line: i + 1,
        index: match.index
      });
    }
  }

  return results;
}

module.exports = {
  extractRequires,
  extractExports,
  extractFrontmatter,
  extractShellBlocks,
  matchPattern
};
