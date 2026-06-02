/**
 * explorer.js — bkit Skill / Agent / Eval discovery (FR-β1)
 *
 * Scans `skills/` + `agents/` directories, parses YAML frontmatter
 * descriptors, and builds an in-memory category tree consumed by the
 * `/bkit-explore` slash command.
 *
 * Categories (Design §3.2):
 *   starter       — Starter-level guidance (static web)
 *   dynamic       — bkend.ai fullstack + Phase 1~6 build pipeline
 *   enterprise    — Enterprise architecture + Phase 8~9 deployment
 *   pdca-core     — PDCA workflow + QA + PM agents
 *   utility       — Cross-cutting utilities (bkit, control, audit, etc.)
 *
 * Level filter (Design §4.1):
 *   Starter      → starter + utility + pdca-core
 *   Dynamic      → starter + dynamic + utility + pdca-core
 *   Enterprise   → starter + dynamic + enterprise + utility + pdca-core
 *
 * No subprocess, no network. Pure filesystem scan.
 *
 * @module lib/discovery/explorer
 * @version 2.1.11
 * @since 2.1.11
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const SKILLS_DIR = path.join(PROJECT_ROOT, 'skills');
const AGENTS_DIR = path.join(PROJECT_ROOT, 'agents');

// ── Canonical category mapping ───────────────────────────────────────────
const SKILL_CATEGORY = Object.freeze({
  starter: 'starter',
  'phase-1-schema': 'dynamic',
  'phase-2-convention': 'dynamic',
  'phase-3-mockup': 'dynamic',
  'phase-4-api': 'dynamic',
  'phase-5-design-system': 'dynamic',
  'phase-6-ui-integration': 'dynamic',
  'phase-7-seo-security': 'enterprise',
  'phase-8-review': 'enterprise',
  'phase-9-deployment': 'enterprise',
  dynamic: 'dynamic',
  'bkend-auth': 'dynamic',
  'bkend-cookbook': 'dynamic',
  'bkend-data': 'dynamic',
  'bkend-quickstart': 'dynamic',
  'bkend-storage': 'dynamic',
  enterprise: 'enterprise',
  deploy: 'enterprise',
  'desktop-app': 'enterprise',
  'mobile-app': 'enterprise',
  audit: 'enterprise',
  rollback: 'enterprise',
  pdca: 'pdca-core',
  'pdca-batch': 'pdca-core',
  'plan-plus': 'pdca-core',
  'qa-phase': 'pdca-core',
  'zero-script-qa': 'pdca-core',
  'pm-discovery': 'pdca-core',
  'code-review': 'pdca-core',
  bkit: 'utility',
  'bkit-evals': 'utility',
  'bkit-rules': 'utility',
  'bkit-templates': 'utility',
  btw: 'utility',
  control: 'utility',
  'claude-code-learning': 'utility',
  'cc-version-analysis': 'utility',
  'skill-create': 'utility',
  'skill-status': 'utility',
  'development-pipeline': 'utility',
});

const AGENT_CATEGORY = Object.freeze({
  'starter-guide': 'starter',
  'pipeline-guide': 'starter',
  'bkend-expert': 'dynamic',
  'frontend-architect': 'dynamic',
  'enterprise-expert': 'enterprise',
  'infra-architect': 'enterprise',
  'security-architect': 'enterprise',
  'cto-lead': 'enterprise',
  'pdca-iterator': 'pdca-core',
  'gap-detector': 'pdca-core',
  'design-validator': 'pdca-core',
  'report-generator': 'pdca-core',
  'qa-lead': 'pdca-core',
  'qa-monitor': 'pdca-core',
  'qa-strategist': 'pdca-core',
  'qa-test-planner': 'pdca-core',
  'qa-test-generator': 'pdca-core',
  'qa-debug-analyst': 'pdca-core',
  'pm-lead': 'pdca-core',
  'pm-lead-skill-patch': 'pdca-core',
  'pm-discovery': 'pdca-core',
  'pm-prd': 'pdca-core',
  'pm-research': 'pdca-core',
  'pm-strategy': 'pdca-core',
  'product-manager': 'pdca-core',
  // v2.1.13 (관점 1-2 B4): pdca-eval-* 6 agents removed — v1.6.1 baseline
  // comparison agents (Korean frontmatter, 0 spawn sites, stale baseline).
  // v2.1.13 Sprint Management agents — sprint-orchestrator dispatches these.
  'sprint-orchestrator': 'pdca-core',
  'sprint-master-planner': 'pdca-core',
  'sprint-qa-flow': 'pdca-core',
  'sprint-report-writer': 'pdca-core',
  'code-analyzer': 'utility',
  'self-healing': 'utility',
  'skill-needs-extractor': 'utility',
  'cc-version-researcher': 'utility',
  'bkit-impact-analyst': 'utility',
});

const CATEGORIES = Object.freeze(['starter', 'dynamic', 'enterprise', 'pdca-core', 'utility']);
const LEVELS = Object.freeze(['Starter', 'Dynamic', 'Enterprise']);

const LEVEL_TO_CATEGORIES = Object.freeze({
  Starter: ['starter', 'pdca-core', 'utility'],
  Dynamic: ['starter', 'dynamic', 'pdca-core', 'utility'],
  Enterprise: ['starter', 'dynamic', 'enterprise', 'pdca-core', 'utility'],
});

// ── Frontmatter parser (top-level scalars + `|` block scalars only) ──────
function _parseFrontmatter(content) {
  if (!content.startsWith('---')) return {};
  const end = content.indexOf('\n---', 3);
  if (end < 0) return {};
  const lines = content.slice(3, end).split(/\r?\n/);
  const out = {};

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^([a-zA-Z][\w-]*)\s*:\s*(.*)$/);
    if (!m) continue;
    const [, k, v] = m;
    if (/^[|>][+-]?$/.test(v)) {
      const collected = [];
      let indent = -1;
      while (i + 1 < lines.length) {
        const next = lines[i + 1];
        if (next.trim() === '') { collected.push(''); i++; continue; }
        const lead = next.match(/^(\s*)/)[1].length;
        if (indent < 0) indent = lead;
        if (lead < indent) break;
        collected.push(next.slice(indent));
        i++;
      }
      out[k] = collected.join('\n').trim();
    } else if (v === '') {
      out[k] = null;
    } else {
      out[k] = v.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
    }
  }
  return out;
}

function _firstSentence(text) {
  if (!text) return '';
  const trimmed = String(text).trim();
  // Take up to the first period/newline; cap at 80 chars.
  const idx = trimmed.search(/[.\n]/);
  const out = idx > 0 ? trimmed.slice(0, idx) : trimmed;
  return out.length > 80 ? out.slice(0, 77) + '...' : out;
}

function _readSkill(skillDir) {
  const skillMd = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(skillMd)) return null;
  let content = '';
  try {
    content = fs.readFileSync(skillMd, 'utf8');
  } catch {
    return null;
  }
  const fm = _parseFrontmatter(content);
  const name = fm.name || path.basename(skillDir);
  return {
    name,
    description: _firstSentence(fm.description),
    classification: fm.classification || null,
    userInvocable: fm['user-invocable'] !== 'false',
    path: skillMd,
  };
}

function _readAgent(agentFile) {
  let content = '';
  try {
    content = fs.readFileSync(agentFile, 'utf8');
  } catch {
    return null;
  }
  const fm = _parseFrontmatter(content);
  const name = fm.name || path.basename(agentFile, '.md');
  return {
    name,
    description: _firstSentence(fm.description),
    path: agentFile,
  };
}

/**
 * Build the in-memory index. Cached on first call (idempotent — paths and
 * frontmatter are stable per process).
 *
 * @param {{ skillsDir?: string, agentsDir?: string, refresh?: boolean }} [opts]
 * @returns {{
 *   categories: Object<string, { skills: object[], agents: object[] }>,
 *   skillsByCategory: Object<string, object[]>,
 *   counts: { skills: number, agents: number, categories: number }
 * }}
 */
let _cache = null;

function buildIndex(opts = {}) {
  if (_cache && !opts.refresh && !opts.skillsDir && !opts.agentsDir) {
    return _cache;
  }
  const skillsDir = opts.skillsDir || SKILLS_DIR;
  const agentsDir = opts.agentsDir || AGENTS_DIR;

  const tree = {};
  for (const c of CATEGORIES) tree[c] = { skills: [], agents: [] };

  // Skills
  if (fs.existsSync(skillsDir)) {
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const meta = _readSkill(path.join(skillsDir, e.name));
      if (!meta) continue;
      const cat = SKILL_CATEGORY[meta.name] || 'utility';
      tree[cat].skills.push(meta);
    }
  }

  // Agents
  if (fs.existsSync(agentsDir)) {
    const entries = fs.readdirSync(agentsDir, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isFile() || !e.name.endsWith('.md')) continue;
      const meta = _readAgent(path.join(agentsDir, e.name));
      if (!meta) continue;
      const cat = AGENT_CATEGORY[meta.name] || 'utility';
      tree[cat].agents.push(meta);
    }
  }

  // Stable sort by name
  for (const c of CATEGORIES) {
    tree[c].skills.sort((a, b) => a.name.localeCompare(b.name));
    tree[c].agents.sort((a, b) => a.name.localeCompare(b.name));
  }

  const counts = {
    skills: CATEGORIES.reduce((acc, c) => acc + tree[c].skills.length, 0),
    agents: CATEGORIES.reduce((acc, c) => acc + tree[c].agents.length, 0),
    categories: CATEGORIES.length,
  };

  const result = { categories: tree, counts, builtAt: new Date().toISOString() };
  if (!opts.skillsDir && !opts.agentsDir) _cache = result;
  return result;
}

/**
 * Return the full category tree. Convenience wrapper for `/bkit-explore`.
 *
 * Returns the full index object: `{ categories, counts, builtAt }`.
 * For flat-array convenience (skills only / agents only), use the dedicated
 * helpers `listSkills()` / `listAgents()` (added v2.1.12 Sprint E-2 #20).
 *
 * @param {object} [opts]
 * @returns {{ categories: Object, counts: { skills: number, agents: number, categories: number }, builtAt: string }}
 */
function listAll(opts) {
  return buildIndex(opts);
}

/**
 * v2.1.12 Sprint E-2 (defect #20 fix): flat array of all skills.
 * Useful for callers that want a simple list rather than the category tree.
 *
 * @param {object} [opts]
 * @returns {object[]}
 */
function listSkills(opts) {
  const idx = buildIndex(opts);
  const out = [];
  for (const cat of Object.values(idx.categories)) {
    if (cat && Array.isArray(cat.skills)) out.push(...cat.skills);
  }
  return out;
}

/**
 * v2.1.12 Sprint E-2 (defect #20 fix): flat array of all agents.
 *
 * @param {object} [opts]
 * @returns {object[]}
 */
function listAgents(opts) {
  const idx = buildIndex(opts);
  const out = [];
  for (const cat of Object.values(idx.categories)) {
    if (cat && Array.isArray(cat.agents)) out.push(...cat.agents);
  }
  return out;
}

/**
 * Filter to a single category.
 *
 * @param {string} category — one of CATEGORIES
 * @param {object} [opts]
 * @returns {{ skills: object[], agents: object[] } | null}
 */
function listByCategory(category, opts) {
  if (!CATEGORIES.includes(category)) return null;
  return buildIndex(opts).categories[category];
}

/**
 * Filter to a level (Starter / Dynamic / Enterprise).
 *
 * @param {string} level
 * @param {object} [opts]
 * @returns {Object<string, { skills: object[], agents: object[] }> | null}
 */
function listByLevel(level, opts) {
  if (!LEVELS.includes(level)) return null;
  const allowed = LEVEL_TO_CATEGORIES[level];
  const tree = buildIndex(opts).categories;
  const out = {};
  for (const c of allowed) out[c] = tree[c];
  return out;
}

/**
 * Enumerate skills that have an evals/{classification}/{skill}/eval.yaml.
 * Lightweight filesystem check — does not parse the YAML.
 *
 * @param {object} [opts]
 * @returns {{ workflow: string[], capability: string[], hybrid: string[] }}
 */
function listEvals(opts = {}) {
  const evalsDir = opts.evalsDir || path.join(PROJECT_ROOT, 'evals');
  const out = { workflow: [], capability: [], hybrid: [] };
  for (const cls of Object.keys(out)) {
    const dir = path.join(evalsDir, cls);
    if (!fs.existsSync(dir)) continue;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const yaml = path.join(dir, e.name, 'eval.yaml');
      if (fs.existsSync(yaml)) out[cls].push(e.name);
    }
    out[cls].sort();
  }
  return out;
}

function _resetCache() {
  _cache = null;
}

module.exports = {
  CATEGORIES,
  LEVELS,
  LEVEL_TO_CATEGORIES,
  SKILL_CATEGORY,
  AGENT_CATEGORY,
  buildIndex,
  listAll,
  listSkills, // v2.1.12 #20
  listAgents, // v2.1.12 #20
  listByCategory,
  listByLevel,
  listEvals,
  _resetCache, // test-only
};
