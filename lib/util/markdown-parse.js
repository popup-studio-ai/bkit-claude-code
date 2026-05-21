'use strict';

/**
 * lib/util/markdown-parse.js — v2.1.19 S3 (CO-S2-1 absorption)
 *
 * Reusable markdown parsing utilities. Extracted from
 * scripts/check-skills-docs-code-sync.js (v2.1.19 S2 F2-2) so that both
 * the S2 CI gate AND the S3 context-importer can share the same parser
 * without duplicating implementation.
 *
 * Critical: stripCodeBlocks ignores references inside ``` ... ``` fences
 * (the bug-fix that v2.1.19 S2 discovered — S0 measurement had false
 * positives on phase-3-mockup + phase-9-deployment due to code samples).
 */

/**
 * Strip fenced code blocks (``` ... ```) from markdown content. Returns
 * the cleaned content with code blocks replaced by blank lines (preserves
 * line numbers for downstream parsing). Unclosed fence treated as code
 * block to EOF (defensive).
 *
 * @param {string} content
 * @returns {string}
 */
function stripCodeBlocks(content) {
  if (typeof content !== 'string') return '';
  const lines = content.split('\n');
  const out = [];
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      out.push('');
      continue;
    }
    out.push(inFence ? '' : line);
  }
  return out.join('\n');
}

/**
 * Extract YAML frontmatter region (between `---` fences at start of file).
 *
 * @param {string} content
 * @returns {string|null} frontmatter body (without `---` markers) or null
 */
function extractFrontmatter(content) {
  if (typeof content !== 'string') return null;
  const m = content.match(/^---\n([\s\S]+?)\n---/);
  return m ? m[1] : null;
}

/**
 * Read a single-line scalar field from frontmatter body. Returns null
 * when field is absent. Supports unquoted, single-quoted, double-quoted
 * values (without escape handling — sufficient for SKILL.md frontmatter).
 *
 * @param {string|null} frontmatter
 * @param {string} fieldName
 * @returns {string|null}
 */
function parseFrontmatterField(frontmatter, fieldName) {
  if (!frontmatter || typeof fieldName !== 'string') return null;
  const re = new RegExp('^' + fieldName + ':\\s*(.+?)\\s*$', 'm');
  const m = frontmatter.match(re);
  if (!m) return null;
  let v = m[1];
  // Strip surrounding quotes if present
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  return v;
}

module.exports = {
  stripCodeBlocks,
  extractFrontmatter,
  parseFrontmatterField,
};
