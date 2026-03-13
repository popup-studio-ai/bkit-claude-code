/**
 * 2-Layer Skill Loader (Enhanced)
 *
 * Loads skills from two layers with project-local taking precedence:
 *   Layer 1 (base): bkit core skills (~/.claude/plugins/.../skills/)
 *   Layer 2 (override): project-local skills (.claude/skills/project/)
 *
 * Enhanced features (v2.0.0):
 *   - Config caching with TTL (aligned with skill-orchestrator.js)
 *   - Agent binding support (single & multi-binding)
 *   - Classification query API
 *   - Pre/post orchestration hooks
 *   - @import resolution
 *   - Cache stats & management
 *
 * @module lib/skill-loader
 * @version 2.0.0
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ─── Constants ──────────────────────────────────────────

const PROJECT_SKILLS_DIR = '.claude/skills/project';
const CACHE_TTL_MS = 30000; // 30s, aligned with skill-orchestrator.js
const VALID_CLASSIFICATIONS = ['workflow', 'capability', 'hybrid'];

// ─── Cache Layer ────────────────────────────────────────

const _skillConfigCache = new Map();
let _cacheHits = 0;
let _cacheMisses = 0;

function getCached(key) {
  const entry = _skillConfigCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    _cacheHits++;
    return entry.value;
  }
  _cacheMisses++;
  return null;
}

function setCache(key, value) {
  _skillConfigCache.set(key, { value, timestamp: Date.now() });
}

function clearCache() {
  _skillConfigCache.clear();
  _cacheHits = 0;
  _cacheMisses = 0;
}

function getCacheStats() {
  return {
    size: _skillConfigCache.size,
    hits: _cacheHits,
    misses: _cacheMisses,
    hitRate: (_cacheHits + _cacheMisses) > 0
      ? ((_cacheHits / (_cacheHits + _cacheMisses)) * 100).toFixed(1)
      : '0.0',
  };
}

// ─── Frontmatter Parser ────────────────────────────────

/**
 * Parse YAML frontmatter from SKILL.md content.
 * @param {string} content - Raw SKILL.md file content
 * @returns {{ meta: object, body: string }}
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };
  try {
    const meta = parseYamlLike(match[1]);
    return { meta, body: match[2] };
  } catch {
    return { meta: {}, body: content };
  }
}

/**
 * Simple YAML-like key:value parser for frontmatter.
 * Handles: name, classification, description, user-invocable, allowed-tools,
 *          agent, agents (multi-binding), imports
 * @param {string} yamlStr
 * @returns {object}
 */
function parseYamlLike(yamlStr) {
  const result = {};
  let currentKey = null;
  let currentList = null;
  let multilineMode = false;
  let multilineLines = [];

  for (const line of yamlStr.split(/\r?\n/)) {
    const trimmed = line.trim();

    // Handle multiline block scalar (key: |)
    if (multilineMode) {
      // Indented lines are part of the block; non-indented key: lines end it
      const isIndented = line.startsWith(' ') || line.startsWith('\t');
      if (!isIndented && trimmed && /^[a-zA-Z_-]+:\s/.test(trimmed)) {
        result[currentKey] = multilineLines.join('\n').trim();
        multilineMode = false;
        multilineLines = [];
        // Fall through to parse this line as key:value
      } else if (!isIndented && trimmed.startsWith('- ')) {
        result[currentKey] = multilineLines.join('\n').trim();
        multilineMode = false;
        multilineLines = [];
        // Fall through
      } else {
        multilineLines.push(trimmed);
        continue;
      }
    }

    if (!trimmed || trimmed.startsWith('#')) continue;

    // List item
    if (trimmed.startsWith('- ') && currentKey) {
      if (!currentList) currentList = [];
      currentList.push(trimmed.slice(2).trim());
      result[currentKey] = currentList;
      continue;
    }

    // Key: value
    const kvMatch = trimmed.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (kvMatch) {
      if (currentList) currentList = null;
      currentKey = kvMatch[1];
      const val = kvMatch[2].replace(/^["']|["']$/g, '').trim();
      if (val === '|') {
        // Start multiline block scalar
        multilineMode = true;
        multilineLines = [];
      } else if (val === '') {
        result[currentKey] = '';
      } else if (val === 'true') {
        result[currentKey] = true;
      } else if (val === 'false') {
        result[currentKey] = false;
      } else {
        result[currentKey] = val;
      }
    }
  }

  // Flush remaining multiline
  if (multilineMode && currentKey) {
    result[currentKey] = multilineLines.join('\n').trim();
  }

  return result;
}

// ─── Agent Binding ──────────────────────────────────────

/**
 * Parse agent binding from frontmatter.
 * Supports single-binding (agent: name) and multi-binding (agents: [...])
 * @param {object} meta - Parsed frontmatter
 * @returns {{ mode: 'single'|'multi'|'none', agents: string[] }}
 */
function parseAgentsField(meta) {
  if (meta.agents && Array.isArray(meta.agents)) {
    return { mode: 'multi', agents: meta.agents };
  }
  if (meta.agent) {
    return { mode: 'single', agents: [meta.agent] };
  }
  return { mode: 'none', agents: [] };
}

/**
 * Get agent for a specific action within a multi-bound skill.
 * @param {object} meta - Parsed frontmatter
 * @param {string} action - Action name (e.g., 'analyze', 'generate')
 * @returns {string|null}
 */
function getAgentForAction(meta, action) {
  const binding = parseAgentsField(meta);
  if (binding.mode === 'none') return null;
  if (binding.mode === 'single') return binding.agents[0];
  // Multi-binding: check agent-actions map if present
  if (meta['agent-actions'] && typeof meta['agent-actions'] === 'object') {
    return meta['agent-actions'][action] || binding.agents[0];
  }
  return binding.agents[0];
}

/**
 * Get all linked agents for a skill.
 * @param {string} skillName
 * @param {string} [projectDir]
 * @returns {string[]}
 */
function getLinkedAgents(skillName, projectDir) {
  const skill = getSkill(skillName, projectDir);
  if (!skill) return [];
  return parseAgentsField(skill.meta).agents;
}

/**
 * Check if skill uses multi-binding.
 * @param {object} meta
 * @returns {boolean}
 */
function isMultiBindingSkill(meta) {
  return parseAgentsField(meta).mode === 'multi';
}

// ─── Classification ─────────────────────────────────────

/**
 * Parse classification from frontmatter.
 * @param {object} meta
 * @returns {{ type: string, reason: string }}
 */
function parseClassification(meta) {
  return {
    type: meta.classification || 'unknown',
    reason: meta['classification-reason'] || '',
  };
}

/**
 * Get all skills of a specific classification.
 * @param {string} classification - 'workflow' | 'capability' | 'hybrid'
 * @param {string} [projectDir]
 * @returns {Array}
 */
function getSkillsByClassification(classification, projectDir) {
  const cacheKey = `skills_by_cls_${classification}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { merged } = loadAllSkills(projectDir);
  const filtered = merged.filter(s =>
    (s.meta.classification || '').toLowerCase() === classification.toLowerCase()
  );
  setCache(cacheKey, filtered);
  return filtered;
}

// ─── Import Resolution ──────────────────────────────────

/**
 * Resolve @import directives in skill body.
 * @param {string} body - Skill body content
 * @param {string} sourceFile - Source SKILL.md path
 * @returns {string}
 */
function resolveImports(body, sourceFile) {
  if (!body.includes('@import')) return body;

  const importRegex = /@import\s+["']([^"']+)["']/g;
  let resolved = body;

  let match;
  while ((match = importRegex.exec(body)) !== null) {
    const importPath = match[1];
    const absolutePath = resolveImportPath(importPath, sourceFile);

    try {
      if (fs.existsSync(absolutePath)) {
        const content = fs.readFileSync(absolutePath, 'utf-8');
        resolved = resolved.replace(match[0], content);
      }
    } catch {
      // Skip failed imports
    }
  }
  return resolved;
}

function resolveImportPath(importPath, sourceFile) {
  // Handle variable substitution
  let resolved = importPath
    .replace('${PROJECT}', process.cwd())
    .replace('${USER_CONFIG}', path.join(os.homedir(), '.claude', 'bkit'));

  const pluginRoot = resolveCoreSkillsDir();
  if (pluginRoot) {
    resolved = resolved.replace('${PLUGIN_ROOT}', path.dirname(pluginRoot));
  }

  if (path.isAbsolute(resolved)) return resolved;
  return path.resolve(path.dirname(sourceFile), resolved);
}

// ─── Skill Scanner ─────────────────────────────────────

/**
 * Scan a directory for SKILL.md files (one level deep).
 * @param {string} baseDir
 * @param {string} layer
 * @returns {Array<{name: string, path: string, meta: object, layer: string}>}
 */
function scanSkillDirectory(baseDir, layer) {
  const cacheKey = `scan_${baseDir}_${layer}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const skills = [];
  if (!fs.existsSync(baseDir)) return skills;

  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillPath = path.join(baseDir, entry.name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) continue;

    try {
      const content = fs.readFileSync(skillPath, 'utf-8');
      const { meta, body } = parseFrontmatter(content);
      const agentBinding = parseAgentsField(meta);
      const classification = parseClassification(meta);

      skills.push({
        name: meta.name || entry.name,
        dirName: entry.name,
        path: skillPath,
        meta,
        layer,
        classification: classification.type,
        agentBinding: agentBinding.mode,
        agents: agentBinding.agents,
        hasImports: body.includes('@import'),
      });
    } catch {
      // Skip unreadable skills
    }
  }

  setCache(cacheKey, skills);
  return skills;
}

// ─── Core Functions ────────────────────────────────────

/**
 * Load all skills from both layers.
 * @param {string} [projectDir=process.cwd()]
 * @returns {{ core: Array, project: Array, merged: Array, conflicts: Array, stats: object }}
 */
function loadAllSkills(projectDir) {
  projectDir = projectDir || process.cwd();

  const cacheKey = `all_skills_${projectDir}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // Layer 1: bkit core skills
  const coreDir = resolveCoreSkillsDir();
  const coreSkills = coreDir ? scanSkillDirectory(coreDir, 'core') : [];

  // Layer 2: project-local skills
  const projDir = path.join(projectDir, PROJECT_SKILLS_DIR);
  const projectSkills = scanSkillDirectory(projDir, 'project');

  // Merge with conflict detection
  const conflicts = [];
  const coreMap = new Map(coreSkills.map(s => [s.name, s]));
  const merged = [];

  // Project skills take precedence
  for (const ps of projectSkills) {
    if (coreMap.has(ps.name)) {
      conflicts.push({
        name: ps.name,
        core: coreMap.get(ps.name),
        project: ps,
        resolution: 'project-wins',
      });
      coreMap.delete(ps.name);
    }
    merged.push(ps);
  }

  // Remaining core skills (no conflict)
  for (const cs of coreMap.values()) {
    merged.push(cs);
  }

  // Classification stats
  const classificationStats = { workflow: 0, capability: 0, hybrid: 0, unknown: 0 };
  for (const s of merged) {
    const cls = (s.classification || 'unknown').toLowerCase();
    classificationStats[cls] = (classificationStats[cls] || 0) + 1;
  }

  const result = {
    core: coreSkills,
    project: projectSkills,
    merged,
    conflicts,
    stats: {
      total: merged.length,
      coreCount: coreSkills.length,
      projectCount: projectSkills.length,
      conflictCount: conflicts.length,
      classifications: classificationStats,
      agentBound: merged.filter(s => s.agentBinding !== 'none').length,
      withImports: merged.filter(s => s.hasImports).length,
    },
  };

  setCache(cacheKey, result);
  return result;
}

/**
 * Resolve the bkit core skills directory.
 * @returns {string|null}
 */
function resolveCoreSkillsDir() {
  const cached = getCached('coreSkillsDir');
  if (cached !== null) return cached;

  const baseDir = path.join(
    os.homedir(),
    '.claude/plugins/cache/bkit-marketplace/bkit'
  );
  if (!fs.existsSync(baseDir)) {
    setCache('coreSkillsDir', null);
    return null;
  }

  const versions = fs.readdirSync(baseDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort((a, b) => {
      const pa = a.split('.').map(Number);
      const pb = b.split('.').map(Number);
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const na = pa[i] || 0;
        const nb = pb[i] || 0;
        if (na !== nb) return na - nb;
      }
      return 0;
    })
    .reverse();

  if (versions.length === 0) {
    setCache('coreSkillsDir', null);
    return null;
  }
  const skillsDir = path.join(baseDir, versions[0], 'skills');
  const result = fs.existsSync(skillsDir) ? skillsDir : null;
  setCache('coreSkillsDir', result);
  return result;
}

/**
 * Check if a project-local skill exists.
 * @param {string} skillName
 * @param {string} [projectDir]
 * @returns {boolean}
 */
function hasProjectSkill(skillName, projectDir) {
  projectDir = projectDir || process.cwd();
  const safeName = path.basename(skillName);
  const skillPath = path.join(projectDir, PROJECT_SKILLS_DIR, safeName, 'SKILL.md');
  return fs.existsSync(skillPath);
}

/**
 * Get skill detail by name (project-local preferred), with caching.
 * @param {string} skillName
 * @param {string} [projectDir]
 * @returns {{ meta: object, body: string, layer: string, path: string, agents: string[], classification: string }|null}
 */
function getSkill(skillName, projectDir) {
  projectDir = projectDir || process.cwd();
  const safeName = path.basename(skillName);

  const cacheKey = `skill_${safeName}_${projectDir}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // Check project-local first
  const projPath = path.join(projectDir, PROJECT_SKILLS_DIR, safeName, 'SKILL.md');
  if (fs.existsSync(projPath)) {
    const content = fs.readFileSync(projPath, 'utf-8');
    const { meta, body } = parseFrontmatter(content);
    const resolvedBody = resolveImports(body, projPath);
    const result = {
      meta,
      body: resolvedBody,
      layer: 'project',
      path: projPath,
      agents: parseAgentsField(meta).agents,
      classification: parseClassification(meta).type,
    };
    setCache(cacheKey, result);
    return result;
  }

  // Fall back to core
  const coreDir = resolveCoreSkillsDir();
  if (!coreDir) return null;
  const corePath = path.join(coreDir, safeName, 'SKILL.md');
  if (fs.existsSync(corePath)) {
    const content = fs.readFileSync(corePath, 'utf-8');
    const { meta, body } = parseFrontmatter(content);
    const resolvedBody = resolveImports(body, corePath);
    const result = {
      meta,
      body: resolvedBody,
      layer: 'core',
      path: corePath,
      agents: parseAgentsField(meta).agents,
      classification: parseClassification(meta).type,
    };
    setCache(cacheKey, result);
    return result;
  }

  return null;
}

// ─── Pre/Post Orchestration ─────────────────────────────

/**
 * Pre-execution: resolve imports, load agent bindings, prepare context.
 * @param {string} skillName
 * @param {object} [context] - Current execution context
 * @returns {{ skill: object, agents: string[], imports: string[] }|null}
 */
function orchestrateSkillPre(skillName, context) {
  const skill = getSkill(skillName);
  if (!skill) return null;

  return {
    skill,
    agents: skill.agents,
    imports: skill.meta.imports || [],
    classification: skill.classification,
    context: {
      feature: context?.feature || null,
      phase: context?.phase || null,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Post-execution: suggest next steps based on classification and phase.
 * @param {string} skillName
 * @param {object} [context]
 * @returns {{ nextSkill: string|null, nextAgent: string|null, message: string }}
 */
function orchestrateSkillPost(skillName, context) {
  const skill = getSkill(skillName);
  if (!skill) return { nextSkill: null, nextAgent: null, message: '' };

  const phase = context?.phase || '';
  const nextSteps = getNextStepSuggestion(phase, skill.classification);

  return {
    nextSkill: nextSteps.skill,
    nextAgent: nextSteps.agent,
    message: nextSteps.message,
  };
}

function getNextStepSuggestion(phase, classification) {
  const phaseMap = {
    'plan': { skill: null, agent: 'gap-detector', message: 'Plan complete. Consider gap analysis.' },
    'design': { skill: 'phase-4-api', agent: null, message: 'Design complete. Proceed to implementation.' },
    'do': { skill: null, agent: 'code-analyzer', message: 'Implementation done. Run code analysis.' },
    'check': { skill: null, agent: 'pdca-iterator', message: 'Check done. Iterate if match rate < 90%.' },
    'act': { skill: null, agent: 'report-generator', message: 'Act complete. Generate completion report.' },
  };
  return phaseMap[phase] || { skill: null, agent: null, message: '' };
}

// ─── Skill Validation ───────────────────────────────────

const REQUIRED_FRONTMATTER = ['name', 'description', 'classification', 'deprecation-risk'];

/**
 * Validate a skill's SKILL.md frontmatter completeness.
 * @param {string} skillName
 * @param {string} [projectDir]
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
function validateSkill(skillName, projectDir) {
  const errors = [];
  const warnings = [];
  const skill = getSkill(skillName, projectDir);

  if (!skill) {
    return { valid: false, errors: [`Skill not found: ${skillName}`], warnings };
  }

  for (const field of REQUIRED_FRONTMATTER) {
    if (!skill.meta[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (skill.meta.classification && !VALID_CLASSIFICATIONS.includes(skill.meta.classification)) {
    errors.push(`Invalid classification: ${skill.meta.classification}`);
  }

  if (!skill.meta['user-invocable']) {
    warnings.push('user-invocable not set (defaults to false)');
  }

  if (!skill.meta['argument-hint']) {
    warnings.push('No argument-hint defined');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate all project-local skills.
 * @param {string} [projectDir]
 * @returns {{ total: number, valid: number, invalid: number, results: object }}
 */
function validateAllProjectSkills(projectDir) {
  projectDir = projectDir || process.cwd();
  const projDir = path.join(projectDir, PROJECT_SKILLS_DIR);
  const results = {};

  if (!fs.existsSync(projDir)) return { total: 0, valid: 0, invalid: 0, results };

  const entries = fs.readdirSync(projDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    results[entry.name] = validateSkill(entry.name, projectDir);
  }

  const total = Object.keys(results).length;
  const valid = Object.values(results).filter(r => r.valid).length;
  return { total, valid, invalid: total - valid, results };
}

// ─── Report ─────────────────────────────────────────────

/**
 * Format skill inventory as a human-readable report.
 * @param {object} inventory - Output from loadAllSkills()
 * @param {'text'|'json'|'markdown'} [format='text']
 * @returns {string}
 */
function formatSkillReport(inventory, format) {
  format = format || 'text';

  if (format === 'json') {
    return JSON.stringify({
      stats: inventory.stats,
      core: inventory.core.map(s => ({ name: s.name, classification: s.classification })),
      project: inventory.project.map(s => ({ name: s.name, classification: s.classification })),
      conflicts: inventory.conflicts.map(c => ({ name: c.name, resolution: c.resolution })),
    }, null, 2);
  }

  if (format === 'markdown') {
    return formatSkillReportMarkdown(inventory);
  }

  return formatSkillReportText(inventory);
}

function formatSkillReportText(inventory) {
  const lines = [];
  lines.push('Skill Status Report');
  lines.push('====================\n');

  // Core
  lines.push(`Layer: bkit Core (${inventory.core.length} skills)`);
  lines.push('  ' + '-'.repeat(55));
  lines.push('  Name                     | Classification | Type');
  lines.push('  ' + '-'.repeat(55));
  for (const s of inventory.core) {
    const name = (s.name || '').padEnd(24);
    const cls = (s.meta.classification || 'unknown').padEnd(14);
    const desc = (s.meta.description || '').split('\n')[0].slice(0, 30);
    lines.push(`  ${name} | ${cls} | ${desc}`);
  }

  lines.push('');

  // Project
  lines.push(`Layer: Project-Local (${inventory.project.length} skills)`);
  lines.push('  ' + '-'.repeat(55));
  lines.push('  Name                     | Classification | Type');
  lines.push('  ' + '-'.repeat(55));
  for (const s of inventory.project) {
    const name = (s.name || '').padEnd(24);
    const cls = (s.meta.classification || 'unknown').padEnd(14);
    const desc = (s.meta.description || '').split('\n')[0].slice(0, 30);
    lines.push(`  ${name} | ${cls} | ${desc}`);
  }

  lines.push('');

  // Stats
  if (inventory.stats) {
    lines.push('Classification Breakdown:');
    const cls = inventory.stats.classifications;
    lines.push(`  Workflow: ${cls.workflow} | Capability: ${cls.capability} | Hybrid: ${cls.hybrid}`);
    lines.push(`  Agent-bound: ${inventory.stats.agentBound} | With imports: ${inventory.stats.withImports}`);
    lines.push('');
  }

  // Conflicts
  if (inventory.conflicts.length > 0) {
    lines.push(`Conflicts: ${inventory.conflicts.length} override(s)`);
    for (const c of inventory.conflicts) {
      lines.push(`  - ${c.name}: project overrides core`);
    }
  } else {
    lines.push('Conflicts: 0 overrides, 0 shadows');
  }

  lines.push('');
  lines.push(`Summary: ${inventory.merged.length} total skills (${inventory.core.length} core + ${inventory.project.length} project)`);
  lines.push(`Cache: ${JSON.stringify(getCacheStats())}`);

  return lines.join('\n');
}

function formatSkillReportMarkdown(inventory) {
  const lines = [];
  lines.push('# Skill Status Report\n');

  lines.push('## Statistics\n');
  if (inventory.stats) {
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Total Skills | ${inventory.stats.total} |`);
    lines.push(`| Core | ${inventory.stats.coreCount} |`);
    lines.push(`| Project | ${inventory.stats.projectCount} |`);
    lines.push(`| Conflicts | ${inventory.stats.conflictCount} |`);
    lines.push(`| Workflow | ${inventory.stats.classifications.workflow} |`);
    lines.push(`| Capability | ${inventory.stats.classifications.capability} |`);
    lines.push(`| Hybrid | ${inventory.stats.classifications.hybrid} |`);
    lines.push(`| Agent-bound | ${inventory.stats.agentBound} |`);
    lines.push('');
  }

  lines.push('## Core Skills\n');
  lines.push('| Name | Classification | Agent |');
  lines.push('|------|---------------|-------|');
  for (const s of inventory.core) {
    lines.push(`| ${s.name} | ${s.classification || 'unknown'} | ${(s.agents || []).join(', ') || '-'} |`);
  }

  lines.push('\n## Project Skills\n');
  lines.push('| Name | Classification | Agent |');
  lines.push('|------|---------------|-------|');
  for (const s of inventory.project) {
    lines.push(`| ${s.name} | ${s.classification || 'unknown'} | ${(s.agents || []).join(', ') || '-'} |`);
  }

  return lines.join('\n');
}

// ─── Exports ───────────────────────────────────────────

module.exports = {
  // Core (v1.0)
  parseFrontmatter,
  scanSkillDirectory,
  loadAllSkills,
  resolveCoreSkillsDir,
  hasProjectSkill,
  getSkill,
  formatSkillReport,
  PROJECT_SKILLS_DIR,
  // Enhanced (v2.0)
  parseAgentsField,
  getAgentForAction,
  getLinkedAgents,
  isMultiBindingSkill,
  parseClassification,
  getSkillsByClassification,
  resolveImports,
  orchestrateSkillPre,
  orchestrateSkillPost,
  validateSkill,
  validateAllProjectSkills,
  clearCache,
  getCacheStats,
};
