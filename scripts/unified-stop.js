#!/usr/bin/env node
/**
 * unified-stop.js - Unified Stop Event Handler (v1.5.1)
 *
 * GitHub Issue #9354 Workaround:
 * ${CLAUDE_PLUGIN_ROOT} doesn't expand in markdown files,
 * so all skill/agent stop hooks are consolidated here.
 */

const path = require('path');
const {
  readStdinSync,
  debugLog,
  outputAllow,
  getPdcaStatusFull,
  getActiveSkill,
  getActiveAgent,
  clearActiveContext
} = require('../lib/common.js');

// ============================================================
// Handler Registry
// ============================================================

/**
 * Skill Stop Handlers
 * Key: skill name (from SKILL.md frontmatter)
 * Value: handler module path (relative to scripts/)
 */
const SKILL_HANDLERS = {
  'pdca': './pdca-skill-stop.js',
  'code-review': './code-review-stop.js',
  'phase-8-review': './phase8-review-stop.js',
  'claude-code-learning': './learning-stop.js',
  'phase-9-deployment': './phase9-deploy-stop.js',
  'phase-6-ui-integration': './phase6-ui-stop.js',
  'phase-5-design-system': './phase5-design-stop.js',
  'phase-4-api': './phase4-api-stop.js',
  'zero-script-qa': './qa-stop.js',
  'development-pipeline': null  // Special case: echo command
};

/**
 * Agent Stop Handlers
 * Key: agent name (from agent.md frontmatter)
 * Value: handler module path (relative to scripts/)
 */
const AGENT_HANDLERS = {
  'gap-detector': './gap-detector-stop.js',
  'pdca-iterator': './iterator-stop.js',
  'code-analyzer': './analysis-stop.js',
  'qa-monitor': './qa-stop.js',
  'team-coordinator': './team-stop.js'  // v1.5.1: Team cleanup on stop
  // design-validator: PreToolUse only, no Stop handler
};

// ============================================================
// Context Detection
// ============================================================

/**
 * Detect active skill from hook context
 * @param {Object} hookContext - Hook input context
 * @returns {string|null} Skill name or null
 */
function detectActiveSkill(hookContext) {
  // 1. Direct skill_name in context
  if (hookContext.skill_name) {
    return hookContext.skill_name;
  }

  // 2. From tool_input (if Stop follows Skill tool)
  if (hookContext.tool_input?.skill) {
    return hookContext.tool_input.skill;
  }

  // 3. From session context (stored by skill-post.js)
  const sessionSkill = getActiveSkill();
  if (sessionSkill) {
    return sessionSkill;
  }

  // 4. From PDCA status (legacy fallback)
  const pdcaStatus = getPdcaStatusFull();
  if (pdcaStatus?.session?.lastSkill) {
    return pdcaStatus.session.lastSkill;
  }

  return null;
}

/**
 * Detect active agent from hook context
 * @param {Object} hookContext - Hook input context
 * @returns {string|null} Agent name or null
 */
function detectActiveAgent(hookContext) {
  // 1. Direct agent_name in context
  if (hookContext.agent_name) {
    return hookContext.agent_name;
  }

  // 2. From Task tool invocation
  if (hookContext.tool_input?.subagent_type) {
    return hookContext.tool_input.subagent_type;
  }

  // 3. From session context
  const sessionAgent = getActiveAgent();
  if (sessionAgent) {
    return sessionAgent;
  }

  // 4. From PDCA status (legacy fallback)
  const pdcaStatus = getPdcaStatusFull();
  if (pdcaStatus?.session?.lastAgent) {
    return pdcaStatus.session.lastAgent;
  }

  return null;
}

// ============================================================
// Handler Execution
// ============================================================

/**
 * Execute handler if exists
 * @param {string} handlerPath - Relative path to handler
 * @param {Object} context - Hook context to pass
 * @returns {boolean} True if handler executed successfully
 */
function executeHandler(handlerPath, context) {
  if (!handlerPath) return false;

  try {
    const fullPath = path.join(__dirname, handlerPath);
    const handler = require(fullPath);

    // Check if handler exports a run function (v1.4.4 pattern)
    if (typeof handler.run === 'function') {
      handler.run(context);
      return true;
    }

    // Handler is self-executing (reads stdin itself)
    // In this case, we've already required it which triggers execution
    return true;
  } catch (e) {
    debugLog('UnifiedStop', 'Handler execution failed', {
      handler: handlerPath,
      error: e.message
    });
    return false;
  }
}

// ============================================================
// Main Execution
// ============================================================

debugLog('UnifiedStop', 'Hook started');

// Read hook context
let hookContext = {};
try {
  const input = readStdinSync();
  hookContext = typeof input === 'string' ? JSON.parse(input) : input;
} catch (e) {
  debugLog('UnifiedStop', 'Failed to parse context', { error: e.message });
}

debugLog('UnifiedStop', 'Context received', {
  hasSkillName: !!hookContext.skill_name,
  hasAgentName: !!hookContext.agent_name,
  hasToolInput: !!hookContext.tool_input
});

// Detect active skill/agent
const activeSkill = detectActiveSkill(hookContext);
const activeAgent = detectActiveAgent(hookContext);

debugLog('UnifiedStop', 'Detection result', {
  activeSkill,
  activeAgent
});

// Execute appropriate handler
let handled = false;

// Priority: Agent handlers first (more specific)
if (activeAgent && AGENT_HANDLERS[activeAgent]) {
  debugLog('UnifiedStop', 'Executing agent handler', { agent: activeAgent });
  handled = executeHandler(AGENT_HANDLERS[activeAgent], hookContext);
}

// Then skill handlers
if (!handled && activeSkill && SKILL_HANDLERS[activeSkill]) {
  debugLog('UnifiedStop', 'Executing skill handler', { skill: activeSkill });

  // Special case: development-pipeline uses simple echo
  if (activeSkill === 'development-pipeline') {
    console.log(JSON.stringify({ continue: false }));
    handled = true;
  } else {
    handled = executeHandler(SKILL_HANDLERS[activeSkill], hookContext);
  }
}

// Clear active context after stop
clearActiveContext();

// Default output if no handler matched
if (!handled) {
  debugLog('UnifiedStop', 'No handler matched, using default output');
  outputAllow('Stop event processed.', 'Stop');
}

debugLog('UnifiedStop', 'Hook completed', {
  handled,
  activeSkill,
  activeAgent
});
