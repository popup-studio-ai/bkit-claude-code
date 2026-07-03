#!/usr/bin/env node
/**
 * Skill Orchestrator - Skills 유기적 동작 관리 (v1.4.4)
 *
 * 역할:
 * 1. Skill frontmatter 파싱 및 확장 필드 처리
 * 2. Template imports 로드
 * 3. Task 자동 생성/업데이트
 * 4. PDCA 상태 자동 관리
 * 5. 다음 Skill/Agent 제안
 *
 * @version 2.1.10
 * @module lib/skill-orchestrator
 */

const fs = require('fs');
const path = require('path');
const { normalizeSkillName } = require('./core/skill-name');

// #135 (v2.1.28) — language-aware guidance strings. These were previously
// hardcoded in Korean; they are now EN-default with a KO sibling, resolved via
// the existing i18n detector (persisted user language). New code is English per
// project convention; the KO map keeps parity for KO users.
const GUIDANCE_STRINGS = {
  en: {
    'phase-1-schema': 'Start defining schema/terminology.',
    'phase-2-convention': 'Define the coding conventions.',
    'phase-3-mockup': 'Create the mockups.',
    'phase-4-api': 'Design the API.',
    'phase-5-design-system': 'Build the design system.',
    'phase-6-ui-integration': 'Implement the UI.',
    'phase-7-seo-security': 'Review SEO/security.',
    'phase-8-review': 'Run the code review.',
    'phase-9-deployment': 'Prepare the deployment.',
    _agentDo: 'Measure the design-code gap once implementation is done.',
    _agentCheck: 'Auto-improve if match rate is below 90%.',
    _nextPrefix: 'Next step',
  },
  ko: {
    'phase-1-schema': '스키마/용어 정의를 시작하세요.',
    'phase-2-convention': '코딩 컨벤션을 정의하세요.',
    'phase-3-mockup': '목업을 작성하세요.',
    'phase-4-api': 'API를 설계하세요.',
    'phase-5-design-system': '디자인 시스템을 구축하세요.',
    'phase-6-ui-integration': 'UI를 구현하세요.',
    'phase-7-seo-security': 'SEO/보안을 점검하세요.',
    'phase-8-review': '코드 리뷰를 진행하세요.',
    'phase-9-deployment': '배포를 준비하세요.',
    _agentDo: '구현이 완료되면 Gap 분석을 실행하세요.',
    _agentCheck: '매치율이 90% 미만이면 자동 개선을 실행하세요.',
    _nextPrefix: '다음 단계',
  },
};

/**
 * Resolve the persisted user language for guidance strings ('en' default,
 * 'ko' when persisted). Never throws.
 * @returns {'en'|'ko'}
 */
function _guidanceLang() {
  try {
    const det = require('./i18n/detector');
    const rec = typeof det.readLanguage === 'function' ? det.readLanguage() : null;
    return rec && rec.lang === 'ko' ? 'ko' : 'en';
  } catch (_) {
    return 'en';
  }
}

/**
 * Language-aware guidance string lookup with EN fallback.
 * @param {string} key
 * @returns {string|undefined}
 */
function _guidanceStr(key) {
  const lang = _guidanceLang();
  return (GUIDANCE_STRINGS[lang] && GUIDANCE_STRINGS[lang][key]) || GUIDANCE_STRINGS.en[key];
}

// NOTE: common.js was removed in v2.1.1. Functions migrated to lib/core and lib/pdca/status.
let _core = null;
let _pdcaStatus = null;
let _importResolver = null;

function getCore() {
  if (!_core) {
    try { _core = require('./core'); } catch(_) { _core = null; }
  }
  return _core;
}

function getPdcaStatusModule() {
  if (!_pdcaStatus) {
    try { _pdcaStatus = require('./pdca/status'); } catch(_) { _pdcaStatus = null; }
  }
  return _pdcaStatus;
}

function getImportResolver() {
  if (!_importResolver) {
    try {
      _importResolver = require('./import-resolver.js');
    } catch (e) {
      _importResolver = null;
    }
  }
  return _importResolver;
}

// Cache for skill configurations
const _skillConfigCache = new Map();
const SKILL_CACHE_TTL = 30000; // 30 seconds

/**
 * Parse YAML frontmatter from skill content
 * Extended to support v1.4.4 fields: next-skill, pdca-phase, task-template
 * @param {string} content - Skill markdown content
 * @returns {{ frontmatter: Object, body: string }}
 */
function parseSkillFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  try {
    const yamlStr = match[1];
    const frontmatter = {};

    // Parse imports array
    const importsMatch = yamlStr.match(/imports:\s*\n((?:\s+-\s+.+\n?)+)/);
    if (importsMatch) {
      const importsLines = importsMatch[1].split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.startsWith('-'))
        .map(line => line.replace(/^-\s+/, '').trim());
      frontmatter.imports = importsLines;
    }

    // Parse allowed-tools array
    const toolsMatch = yamlStr.match(/allowed-tools:\s*\n((?:\s+-\s+.+\n?)+)/);
    if (toolsMatch) {
      const toolsLines = toolsMatch[1].split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.startsWith('-'))
        .map(line => line.replace(/^-\s+/, '').trim());
      frontmatter['allowed-tools'] = toolsLines;
    }

    // Parse simple key-value pairs (including new v1.4.4 fields)
    const lines = yamlStr.split(/\r?\n/);
    for (const line of lines) {
      // Handle multi-line description separately
      if (line.match(/^description:\s*\|/)) {
        continue; // Skip, handled by block parser
      }

      const kvMatch = line.match(/^([\w-]+):\s*(.+)$/);
      if (kvMatch && !['imports', 'allowed-tools', 'hooks'].includes(kvMatch[1])) {
        let value = kvMatch[2].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        // Convert boolean strings
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (value === 'null') value = null;

        frontmatter[kvMatch[1]] = value;
      }
    }

    // Parse hooks section (simplified)
    const hooksMatch = yamlStr.match(/hooks:\s*\n([\s\S]*?)(?=\n\w|$)/);
    if (hooksMatch) {
      frontmatter.hooks = parseHooksSection(hooksMatch[1]);
    }

    // Parse agents section (v1.4.4 multi-binding support)
    const agentsMatch = yamlStr.match(/agents:\s*\n((?:\s+\w+:\s*.+\n?)+)/);
    if (agentsMatch) {
      const agentsObj = {};
      const agentLines = agentsMatch[1].split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);

      for (const line of agentLines) {
        const agentKV = line.match(/^(\w+):\s*(.+)$/);
        if (agentKV) {
          let value = agentKV[2].trim();
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          agentsObj[agentKV[1]] = value;
        }
      }
      frontmatter.agents = agentsObj;
    }

    return { frontmatter, body: match[2] };
  } catch (e) {
    const core = getCore();
    core.debugLog('SkillOrchestrator', 'Frontmatter parse error', { error: e.message });
    return { frontmatter: {}, body: content };
  }
}

/**
 * Parse agents field (supports single value and multi-binding)
 *
 * Supports:
 * - agent: "single-agent"  → { default: "single-agent", _isMultiBinding: false }
 * - agents:
 *     action1: agent1
 *     action2: agent2
 *     default: agentX
 *   → { action1: 'agent1', action2: 'agent2', default: 'agentX', _isMultiBinding: true }
 *
 * @param {Object} frontmatter - Parsed frontmatter or skill config
 * @returns {Object} agents mapping { action: agentName, _isMultiBinding: boolean }
 */
function parseAgentsField(frontmatter) {
  const agentsField = frontmatter.agents;
  const agentField = frontmatter.agent;

  // Multi-binding: agents: { action: agent }
  if (agentsField && typeof agentsField === 'object') {
    return {
      ...agentsField,
      _isMultiBinding: true
    };
  }

  // Single binding: agent: "agentName"
  if (agentField && typeof agentField === 'string') {
    return {
      default: agentField,
      _isMultiBinding: false
    };
  }

  // No agent defined
  return {
    default: null,
    _isMultiBinding: false
  };
}

/**
 * Get agent name for specific action
 *
 * @param {string} skillName - Skill name
 * @param {string} action - Action name (e.g., 'analyze', 'iterate', 'report')
 * @returns {string|null} Agent name or null
 */
function getAgentForAction(skillName, action) {
  const config = getSkillConfig(skillName);
  if (!config) return null;

  const agents = parseAgentsField(config);

  // Try action-specific agent first, then default
  return agents[action] || agents.default || null;
}

/**
 * Get all agents linked to a skill
 *
 * @param {string} skillName - Skill name
 * @returns {string[]} Array of unique agent names
 */
function getLinkedAgents(skillName) {
  const config = getSkillConfig(skillName);
  if (!config) return [];

  const agents = parseAgentsField(config);

  // Filter out internal keys and get unique agent names
  const agentNames = Object.entries(agents)
    .filter(([key, value]) => key !== '_isMultiBinding' && value && typeof value === 'string')
    .map(([_, value]) => value);

  // Return unique values
  return [...new Set(agentNames)];
}

/**
 * Check if skill uses multi-binding (agents: vs agent:)
 *
 * @param {string} skillName - Skill name
 * @returns {boolean} True if skill uses agents multi-binding
 */
function isMultiBindingSkill(skillName) {
  const config = getSkillConfig(skillName);
  if (!config) return false;

  const agents = parseAgentsField(config);
  return agents._isMultiBinding === true;
}

/**
 * Parse classification fields from skill frontmatter
 * Extracts classification, classification-reason, and deprecation-risk
 * @param {Object} frontmatter - Parsed frontmatter object
 * @returns {{ classification: string|null, classificationReason: string|null, deprecationRisk: string|null }}
 */
function parseClassification(frontmatter) {
  return {
    classification: frontmatter['classification'] || null,
    classificationReason: frontmatter['classification-reason'] || null,
    deprecationRisk: frontmatter['deprecation-risk'] || null
  };
}

/**
 * Get all skills matching a given classification
 * @param {string} type - Classification type: 'workflow', 'capability', or 'hybrid'
 * @returns {Array<{ name: string, classification: string, classificationReason: string, deprecationRisk: string }>}
 */
function getSkillsByClassification(type) {
  const core = getCore();
  const skillsDir = path.join(core.PLUGIN_ROOT, 'skills');

  if (!fs.existsSync(skillsDir)) {
    return [];
  }

  const results = [];
  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const config = getSkillConfig(entry.name);
    if (!config) continue;

    const cls = parseClassification(config);
    if (cls.classification === type) {
      results.push({
        name: config.name,
        classification: cls.classification,
        classificationReason: cls.classificationReason,
        deprecationRisk: cls.deprecationRisk
      });
    }
  }

  return results;
}

/**
 * Parse hooks section from YAML
 * @param {string} hooksYaml - Hooks section content
 * @returns {Object} Parsed hooks
 */
function parseHooksSection(hooksYaml) {
  const hooks = {};
  const hookTypeMatch = hooksYaml.matchAll(/^\s{2}(\w+):/gm);

  for (const match of hookTypeMatch) {
    const hookType = match[1];
    hooks[hookType] = [];
    // Simplified: just note that hooks exist
  }

  return hooks;
}

/**
 * Get skill configuration with caching
 * @param {string} skillName - Skill name
 * @returns {Object|null} Skill configuration
 */
function getSkillConfig(skillName) {
  const core = getCore();

  // #125: CC invokes skills as `plugin:skill` (e.g. `bkit:pdca`) but the folder
  // is `skills/pdca/`. Canonicalize to the bare folder name for both the cache
  // key and the path lookup so the namespaced form resolves instead of ENOENT.
  const folderName = normalizeSkillName(skillName);

  // Check cache
  const cached = _skillConfigCache.get(folderName);
  if (cached && (Date.now() - cached.timestamp < SKILL_CACHE_TTL)) {
    return cached.config;
  }

  // Load skill file
  const skillPath = path.join(core.PLUGIN_ROOT, 'skills', folderName, 'SKILL.md');

  if (!fs.existsSync(skillPath)) {
    core.debugLog('SkillOrchestrator', 'Skill not found', { skillName, folderName, path: skillPath });
    return null;
  }

  try {
    const content = fs.readFileSync(skillPath, 'utf8');
    const { frontmatter, body } = parseSkillFrontmatter(content);

    const config = {
      name: frontmatter.name || folderName,
      description: frontmatter.description || '',
      imports: frontmatter.imports || [],
      agent: frontmatter.agent || null,
      'allowed-tools': frontmatter['allowed-tools'] || [],
      'user-invocable': frontmatter['user-invocable'] || false,
      'argument-hint': frontmatter['argument-hint'] || null,
      // v1.4.4 extended fields
      'next-skill': frontmatter['next-skill'] || null,
      'pdca-phase': frontmatter['pdca-phase'] || null,
      'task-template': frontmatter['task-template'] || null,
      'skills_preload': frontmatter['skills_preload'] || [],
      hooks: frontmatter.hooks || {},
      // v1.4.4 agents multi-binding support
      agents: frontmatter.agents || null,
      // v1.6.0 classification fields (ENH-90)
      classification: frontmatter['classification'] || null,
      'classification-reason': frontmatter['classification-reason'] || null,
      'deprecation-risk': frontmatter['deprecation-risk'] || null,
      body
    };

    // Cache the config (keyed by the canonical folder name so bare and
    // namespaced identifiers share one entry)
    _skillConfigCache.set(folderName, {
      config,
      timestamp: Date.now()
    });

    return config;
  } catch (e) {
    core.debugLog('SkillOrchestrator', 'Failed to load skill', { skillName, error: e.message });
    return null;
  }
}

/**
 * Orchestrate skill pre-execution
 * Called before skill body is processed
 * @param {string} skillName - Skill name
 * @param {Object} args - Skill arguments (action, feature, etc.)
 * @param {Object} context - Execution context
 * @returns {Promise<Object>} Orchestration result
 */
async function orchestrateSkillPre(skillName, args, context) {
  const core = getCore();
  const importResolver = getImportResolver();

  core.debugLog('SkillOrchestrator', 'Pre-orchestration started', { skillName, args });

  // 1. Load skill configuration
  const config = getSkillConfig(skillName);
  if (!config) {
    return { error: `Skill not found: ${skillName}` };
  }

  // 2. Load imports if available
  let templates = [];
  if (config.imports.length > 0 && importResolver) {
    // #125: mirror getSkillConfig — resolve the bare folder even when called
    // with the `plugin:skill` form, else import resolution silently ENOENTs.
    const skillPath = path.join(core.PLUGIN_ROOT, 'skills', normalizeSkillName(skillName), 'SKILL.md');
    try {
      const { content, errors } = importResolver.processMarkdownWithImports(skillPath);
      if (errors.length === 0 && content) {
        templates.push(content);
      }
      if (errors.length > 0) {
        core.debugLog('SkillOrchestrator', 'Import errors', { errors });
      }
    } catch (e) {
      core.debugLog('SkillOrchestrator', 'Import resolution failed', { error: e.message });
    }
  }

  // 3. Prepare task creation info if task-template exists
  let taskInfo = null;
  if (config['task-template'] && args.feature) {
    const template = config['task-template'];
    const subject = template.replace('{feature}', args.feature);

    // Calculate blockedBy based on PDCA phase
    const phaseOrder = ['plan', 'design', 'do', 'check', 'act'];
    const currentPhase = config['pdca-phase'];
    const currentIndex = phaseOrder.indexOf(currentPhase);

    let blockedBy = [];
    if (currentIndex > 0) {
      // Get previous phase's task (would need to look up from memory)
      const pdcaMod = getPdcaStatusModule();
      const pdcaStatus = pdcaMod ? pdcaMod.getPdcaStatusFull() : null;
      const featureStatus = pdcaStatus?.features?.[args.feature];
      if (featureStatus?.tasks) {
        const previousPhase = phaseOrder[currentIndex - 1];
        const previousTaskId = featureStatus.tasks[previousPhase];
        if (previousTaskId) {
          blockedBy.push(previousTaskId);
        }
      }
    }

    taskInfo = {
      subject,
      description: `PDCA ${currentPhase || 'task'} for ${args.feature}`,
      activeForm: `${subject} 진행 중`,
      blockedBy,
      pdcaPhase: currentPhase
    };
  }

  // 4. Return orchestration result
  return {
    config,
    templates,
    taskInfo,
    body: config.body
  };
}

/**
 * Orchestrate skill post-execution
 * Called after skill completes
 * @param {string} skillName - Skill name
 * @param {Object} result - Skill execution result
 * @param {Object} context - Execution context
 * @returns {Promise<Object>} Post-orchestration result
 */
async function orchestrateSkillPost(skillName, result, context) {
  const core = getCore();

  core.debugLog('SkillOrchestrator', 'Post-orchestration started', { skillName });

  const config = getSkillConfig(skillName);
  if (!config) {
    return result;
  }

  // 1. Prepare next step suggestions
  const suggestions = {};

  if (config['next-skill']) {
    suggestions.nextSkill = {
      name: config['next-skill'],
      message: getNextStepMessage(config['next-skill'])
    };
  }

  // 2. Check if agent should be suggested based on PDCA phase
  const pdcaPhase = config['pdca-phase'];
  if (pdcaPhase === 'do') {
    suggestions.suggestedAgent = 'gap-detector';
    suggestions.suggestedMessage = _guidanceStr('_agentDo');
  } else if (pdcaPhase === 'check') {
    suggestions.suggestedAgent = 'pdca-iterator';
    suggestions.suggestedMessage = _guidanceStr('_agentCheck');
  }

  return {
    ...result,
    suggestions
  };
}

/**
 * Get message for next skill suggestion
 * @param {string} nextSkillName - Next skill name
 * @returns {string} Suggestion message
 */
function getNextStepMessage(nextSkillName) {
  // #135 (v2.1.28): language-aware (EN default / KO). Pipeline phase-1..9 skills
  // resolve to their canonical guidance line; everything else falls back to a
  // localized "Next step: <skill>" form.
  const known = _guidanceStr(nextSkillName);
  if (known) return known;
  return `${_guidanceStr('_nextPrefix')}: ${nextSkillName}`;
}

/**
 * Clear skill configuration cache
 */
function clearCache() {
  _skillConfigCache.clear();
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
function getCacheStats() {
  return {
    size: _skillConfigCache.size,
    entries: Array.from(_skillConfigCache.keys())
  };
}

module.exports = {
  parseSkillFrontmatter,
  getSkillConfig,
  orchestrateSkillPre,
  orchestrateSkillPost,
  getNextStepMessage,
  clearCache,
  getCacheStats,
  SKILL_CACHE_TTL,
  // v1.4.4 agents multi-binding support
  parseAgentsField,
  getAgentForAction,
  getLinkedAgents,
  isMultiBindingSkill,
  // v1.6.0 classification support (ENH-90)
  parseClassification,
  getSkillsByClassification
};
