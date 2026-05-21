'use strict';

/**
 * lib/application/sprint-lifecycle/context-importer.js — v2.1.19 S3 F3-2 (closes #104)
 *
 * Auto-import sprint Context Anchor (WHY/WHO/RISK/SUCCESS/SCOPE) from
 * master-plan.md (multi-sprint case, authoritative) or PRD.md (per-sprint
 * fallback). Driven by sprint-master-planner template's stable structure.
 *
 * Fallback chain (per ADR S3-003):
 *   args.context (caller-provided)
 *     → tryImportFromMasterPlan(sprintId)
 *     → tryImportFromPrd(sprintId)
 *     → defaultContext (empty placeholders)
 *
 * pruge Issue ref: #104 (sprint init "(not set)" context anchor).
 */

const path = require('path');

const MD_PARSE = require(path.join(__dirname, '..', '..', 'util', 'markdown-parse.js'));

const REQUIRED_ANCHOR_KEYS = ['WHY', 'WHO', 'RISK', 'SUCCESS', 'SCOPE'];

/**
 * Derive candidate projectId values from a sprint id.
 *
 * Examples (most-specific to least-specific):
 *   's1-foundation'         → ['s1-foundation', 's1']
 *   's0-sqm-baseline'       → ['s0-sqm-baseline', 's0']
 *   'self-dogfood-2.1.20'   → ['self-dogfood-2.1.20', 'self-dogfood']
 *   'v2119-quality-maturation' → ['v2119-quality-maturation', 'v2119']
 *
 * @param {string} sprintId
 * @returns {string[]} candidates ordered most-specific first
 */
function deriveCandidateProjectIds(sprintId) {
  if (typeof sprintId !== 'string' || !sprintId) return [];
  const out = [sprintId];
  // Take the first segment(s) before kebab-case suffixes — sprint-master-planner
  // master plans are named like `v2119-bkit-quality-maturation` so the project
  // prefix is the first segment.
  const parts = sprintId.split('-');
  for (let i = parts.length - 1; i > 0; i--) {
    const candidate = parts.slice(0, i).join('-');
    if (candidate && candidate !== sprintId) out.push(candidate);
  }
  return out;
}

/**
 * Parse the Context Anchor section from a master-plan or PRD markdown body.
 *
 * sprint-master-planner template format (stable):
 *   ## 1. Context Anchor ...
 *   | Key | Value |
 *   | **WHY** | <text> |
 *   | **WHO** | <text> |
 *   | **RISK** | <text> |
 *   | **SUCCESS** | <text> |
 *   | **SCOPE** | <text> |
 *
 * Also accepts loose variants (bold or not, hyphenated "Context Anchor (Plan → Design → Do 전파)").
 *
 * Strips code blocks first (CO-S2-1 stripCodeBlocks) so examples don't leak.
 *
 * @param {string} markdownContent
 * @returns {object|null} { WHY, WHO, RISK, SUCCESS, SCOPE } or null when no anchors found
 */
function parseContextAnchor(markdownContent) {
  if (typeof markdownContent !== 'string' || markdownContent.length === 0) return null;
  const cleaned = MD_PARSE.stripCodeBlocks(markdownContent);

  const result = {};
  for (const key of REQUIRED_ANCHOR_KEYS) {
    // Pattern: | **<key>** | <value> | (multiline-safe, allows whitespace)
    const re = new RegExp('\\|\\s*\\*\\*' + key + '\\*\\*\\s*\\|\\s*(.+?)\\s*\\|', 'i');
    const m = cleaned.match(re);
    if (m) result[key] = stripTrailingPipeArtifacts(m[1].trim());
    else {
      // Fallback: simpler `<key>:` or `- <key>:` style (less strict)
      const alt = new RegExp('(?:^|\\n)\\s*[-*]?\\s*' + key + '\\s*[:|]\\s*(.+?)(?:\\n|$)', 'i');
      const m2 = cleaned.match(alt);
      if (m2) result[key] = m2[1].trim();
    }
  }

  const populated = Object.keys(result).filter(k => result[k] && result[k].length > 0);
  if (populated.length === 0) return null;

  // Fill missing keys with empty string for caller convenience
  const finalCtx = {};
  for (const key of REQUIRED_ANCHOR_KEYS) finalCtx[key] = result[key] || '';
  return finalCtx;
}

function stripTrailingPipeArtifacts(s) {
  // Strip trailing markdown table cell artifacts like " | " or just "|"
  return s.replace(/\s*\|\s*$/, '').trim();
}

/**
 * Try to import context from master-plan.md.
 *
 * Resolves filePath via deriveCandidateProjectIds; first match wins.
 *
 * @param {string} sprintId
 * @param {object} infra - { fileReader: { exists, read }, projectRoot? }
 * @returns {Promise<{context: object, filePath: string}|null>}
 */
async function tryImportFromMasterPlan(sprintId, infra) {
  if (!infra) return null;
  const reader = infra.fileReader || makeDefaultFileReader(infra.projectRoot);
  const candidates = deriveCandidateProjectIds(sprintId);
  for (const projectId of candidates) {
    const filePath = path.join('docs', '01-plan', 'features', `${projectId}.master-plan.md`);
    if (await reader.exists(filePath)) {
      const content = await reader.read(filePath);
      const context = parseContextAnchor(content);
      if (context) return { context, filePath };
    }
  }
  return null;
}

/**
 * Try to import context from PRD.md.
 *
 * Searches docs/00-pm/features/ first, then docs/01-plan/features/ legacy.
 *
 * @param {string} sprintId
 * @param {object} infra
 * @returns {Promise<{context: object, filePath: string}|null>}
 */
async function tryImportFromPrd(sprintId, infra) {
  if (!infra) return null;
  const reader = infra.fileReader || makeDefaultFileReader(infra.projectRoot);
  const candidates = [
    path.join('docs', '00-pm', 'features', `${sprintId}.prd.md`),
    path.join('docs', '01-plan', 'features', `${sprintId}.prd.md`),
  ];
  for (const filePath of candidates) {
    if (await reader.exists(filePath)) {
      const content = await reader.read(filePath);
      const context = parseContextAnchor(content);
      if (context) return { context, filePath };
    }
  }
  return null;
}

/**
 * Default context (empty placeholders) used as last resort.
 *
 * @returns {object}
 */
function defaultContext() {
  return { WHY: '', WHO: '', RISK: '', SUCCESS: '', SCOPE: '' };
}

/**
 * Full resolution chain. Returns a result describing source + context.
 *
 * @param {string} sprintId
 * @param {object} infra
 * @returns {Promise<{source: string, filePath: string|null, context: object}>}
 */
async function resolveContext(sprintId, infra) {
  const mp = await tryImportFromMasterPlan(sprintId, infra);
  if (mp) return { source: 'master-plan', filePath: mp.filePath, context: mp.context };
  const prd = await tryImportFromPrd(sprintId, infra);
  if (prd) return { source: 'prd', filePath: prd.filePath, context: prd.context };
  return { source: 'default', filePath: null, context: defaultContext() };
}

function makeDefaultFileReader(projectRoot) {
  const fs = require('fs');
  const root = projectRoot || process.cwd();
  return {
    async exists(relPath) {
      try { return fs.existsSync(path.resolve(root, relPath)); }
      catch (_) { return false; }
    },
    async read(relPath) {
      try { return fs.readFileSync(path.resolve(root, relPath), 'utf8'); }
      catch (_) { return ''; }
    },
  };
}

module.exports = {
  REQUIRED_ANCHOR_KEYS,
  deriveCandidateProjectIds,
  parseContextAnchor,
  tryImportFromMasterPlan,
  tryImportFromPrd,
  defaultContext,
  resolveContext,
};
