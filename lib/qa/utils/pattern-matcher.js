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
 * Find the matching closing brace for an opening brace.
 * - Depth-aware: tracks `{` / `}` nesting at arbitrary depth.
 * - String-aware: the top-level segment splitter in extractExports() tracks
 *   `'`, `"`, and `` ` `` quote state with backslash escape handling, so
 *   braces appearing inside string literals do not affect depth counting
 *   there. (This findBalancedBrace helper itself only counts braces, but is
 *   used together with the string-aware segment scanner below.)
 * - NOT comment-aware: block comments (slash-star ... star-slash) or line
 *   comments (slash-slash) containing `{` or `}` may still confuse the
 *   scanner. Callers should treat this as a known edge case.
 *   Known runtime cases (QR10 catch, v2.1.8):
 *     - inline `// comment` inside module.exports block may truncate remainder
 *     - `/* ... }` inside block comment may close scope prematurely
 *   For bkit's own lib/* sources (rare inline comments in exports), acceptable.
 * v2.1.8 fix B15: JSDoc now accurately reflects string-aware capability + QR10 edge cases
 * @param {string} src - Source text
 * @param {number} openPos - Index of the opening '{' character
 * @returns {number} Index of the matching '}', or -1 if not found
 */
function findBalancedBrace(src, openPos) {
  let depth = 0;
  for (let i = openPos; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Extract exports from file content (module.exports keys)
 * v2.1.8 fix B11: balanced-brace scanner supports nested module.exports objects.
 * @param {string} content - File content
 * @returns {Array<{name: string, line: number}>}
 */
function extractExports(content) {
  const results = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match exports.name = ...
    const exportDotRegex = /exports\.(\w+)\s*=/g;
    let match;
    while ((match = exportDotRegex.exec(line)) !== null) {
      results.push({ name: match[1], line: i + 1 });
    }
  }

  // Also parse module.exports = { ... } block
  // v2.1.8 fix B11: use balanced-brace scanner to support nested objects/arrays.
  // Previous regex /module\.exports\s*=\s*\{([^}]*)\}/s stopped at the first '}'
  // so `module.exports = { a: { b: 1 } }` would truncate capture at `a: { b: 1`.
  let parsed = false;
  try {
    const meMatch = content.match(/module\.exports\s*=\s*\{/);
    if (meMatch) {
      const openPos = meMatch.index + meMatch[0].length - 1; // position of '{'
      const closePos = findBalancedBrace(content, openPos);
      if (closePos !== -1) {
        const body = content.slice(openPos + 1, closePos);
        const startOffset = content.substring(0, meMatch.index).split('\n').length;

        // Split top-level keys: scan at depth 0 and cut on ',' outside braces/brackets/parens.
        const segments = [];
        let segStart = 0;
        let depthC = 0; // {}
        let depthS = 0; // []
        let depthP = 0; // ()
        let inStr = null; // current quote char or null
        let esc = false;
        for (let i = 0; i < body.length; i++) {
          const ch = body[i];
          if (inStr) {
            if (esc) { esc = false; }
            else if (ch === '\\') { esc = true; }
            else if (ch === inStr) { inStr = null; }
            continue;
          }
          if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
          if (ch === '{') depthC++;
          else if (ch === '}') depthC--;
          else if (ch === '[') depthS++;
          else if (ch === ']') depthS--;
          else if (ch === '(') depthP++;
          else if (ch === ')') depthP--;
          else if (ch === ',' && depthC === 0 && depthS === 0 && depthP === 0) {
            segments.push({ text: body.slice(segStart, i), start: segStart });
            segStart = i + 1;
          }
        }
        segments.push({ text: body.slice(segStart), start: segStart });

        // Pre-compute line starts within body for line attribution
        for (const seg of segments) {
          const trimmed = seg.text.trim();
          if (!trimmed) continue;
          // Match shorthand "key" / "key," or "key:" at the start of the segment
          const keyMatch = trimmed.match(/^(\w+)\s*(?:[:,]|$)/);
          if (keyMatch) {
            const linesBefore = body.slice(0, seg.start).split('\n').length - 1;
            results.push({ name: keyMatch[1], line: startOffset + linesBefore });
          }
        }
        parsed = true;
      }
    }
  } catch (_) {
    // fall through to legacy fallback
  }

  // Fallback: legacy non-nested regex (kept for defensive compatibility).
  if (!parsed) {
    const moduleExportsMatch = content.match(/module\.exports\s*=\s*\{([^}]*)\}/s);
    if (moduleExportsMatch) {
      const block = moduleExportsMatch[1];
      const blockLines = block.split('\n');
      const startOffset = content.substring(0, moduleExportsMatch.index).split('\n').length;

      for (let i = 0; i < blockLines.length; i++) {
        const line = blockLines[i].trim();
        const keyMatch = line.match(/^(\w+)\s*[,:]/);
        if (keyMatch) {
          results.push({ name: keyMatch[1], line: startOffset + i });
        }
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
