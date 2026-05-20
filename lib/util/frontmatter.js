/**
 * Frontmatter parsing utility — v2.1.18.
 *
 * Centralizes YAML-like frontmatter parsing previously duplicated across:
 *   - test/contract/scripts/contract-baseline-collect.js (source of truth)
 *   - test/contract/invocation-inventory.test.js (inline hasDeprecatedInFrontmatter)
 *   - tests/qa/bkit-full-system.test.js (local parseFrontmatter)
 *   - tests/qa/bkit-deep-system.test.js (local parseFm)
 *   - lib/infra/docs-code-scanner.js (inline hasDeprecatedInFrontmatter)
 *
 * Supports the minimal YAML subset bkit relies on: scalars, lists (block
 * style with `-` markers), booleans, ints, floats, single-line arrays.
 * Pure parsing functions are FS-free; file-path variants wrap them with
 * `fs.readFileSync`.
 *
 * Design Ref: docs/02-design/features/v2118-carryover-cleanup.design.md §2.2
 * Plan SC: CO-5 — eliminate 5-site duplication, ensure consistent semantics.
 *
 * @module lib/util/frontmatter
 * @version 2.1.18
 * @since 2.1.18
 */

const fs = require('fs');

/**
 * Coerce raw frontmatter scalar string to typed value.
 * Order: boolean → integer → float → JSON array (single-line) → unquoted string.
 *
 * @param {string} v
 * @returns {boolean|number|Array|string}
 */
function coerce(v) {
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
  if (/^\[.*\]$/.test(v)) {
    try {
      return JSON.parse(v.replace(/'/g, '"'));
    } catch {
      /* fall through */
    }
  }
  return v.replace(/^['"]|['"]$/g, '');
}

/**
 * Parse frontmatter from a markdown string.
 * Returns an empty object when no frontmatter delimiters are found.
 *
 * @param {string} markdown
 * @returns {Object<string, any>}
 */
function parseFrontmatter(markdown) {
  if (typeof markdown !== 'string') return {};
  const m = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const body = m[1];
  const lines = body.split(/\r?\n/);
  const out = {};
  let currentKey = null;
  let currentList = null;
  for (const rawLine of lines) {
    if (!rawLine.trim()) continue;
    const listMatch = rawLine.match(/^\s+-\s+(.*)$/);
    if (listMatch && currentList) {
      currentList.push(coerce(listMatch[1].trim()));
      continue;
    }
    const kv = rawLine.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      const rawVal = kv[2].trim();
      if (rawVal === '') {
        currentList = [];
        out[currentKey] = currentList;
      } else {
        out[currentKey] = coerce(rawVal);
        currentList = null;
      }
    }
  }
  return out;
}

/**
 * Parse frontmatter from a file path.
 * Throws on file read errors (let caller decide on recovery).
 *
 * @param {string} filePath
 * @returns {Object<string, any>}
 */
function parseFrontmatterFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return parseFrontmatter(content);
}

/**
 * Cheap predicate: does the markdown content declare `deprecatedIn: <value>`
 * in its frontmatter? Does not fully parse — uses a single regex over the
 * frontmatter block for performance in bulk scans.
 *
 * @param {string} content
 * @returns {boolean}
 */
function hasDeprecatedInFrontmatter(content) {
  if (typeof content !== 'string') return false;
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return false;
  return /^\s*deprecatedIn\s*:\s*\S+/m.test(m[1]);
}

/**
 * File-path variant of hasDeprecatedInFrontmatter. Returns false on
 * file read errors (safer default for filter() use).
 *
 * @param {string} filePath
 * @returns {boolean}
 */
function hasDeprecatedInFrontmatterFile(filePath) {
  try {
    return hasDeprecatedInFrontmatter(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return false;
  }
}

module.exports = {
  coerce,
  parseFrontmatter,
  parseFrontmatterFile,
  hasDeprecatedInFrontmatter,
  hasDeprecatedInFrontmatterFile,
};
