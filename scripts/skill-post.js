#!/usr/bin/env node
/**
 * Skill Post-execution Hook (v1.4.4)
 *
 * PostToolUse(Skill) 훅에서 호출됨
 * skill-orchestrator를 사용하여 다음 단계를 제안
 *
 * @version 1.4.4
 * @module scripts/skill-post
 */

const path = require('path');

// Lazy load modules
let common = null;
let orchestrator = null;

function getCommon() {
  if (!common) {
    common = require('../lib/common.js');
  }
  return common;
}

function getOrchestrator() {
  if (!orchestrator) {
    orchestrator = require('../lib/skill-orchestrator.js');
  }
  return orchestrator;
}

/**
 * Parse skill invocation from tool input
 * @param {Object} toolInput - Tool input from hook context
 * @returns {{ skillName: string, args: Object }}
 */
function parseSkillInvocation(toolInput) {
  try {
    const skillName = toolInput?.skill || '';
    const argsStr = toolInput?.args || '';

    // Parse args string into structured format
    const args = {};
    if (argsStr) {
      const parts = argsStr.split(/\s+/);
      if (parts.length > 0) {
        args.action = parts[0];
      }
      if (parts.length > 1) {
        args.feature = parts.slice(1).join(' ');
      }
    }

    return { skillName, args };
  } catch (e) {
    return { skillName: '', args: {} };
  }
}

/**
 * Format next step message for output
 * @param {Object} suggestions - Suggestions from orchestrator
 * @param {string} skillName - Current skill name
 * @returns {string} Formatted message
 */
function formatNextStepMessage(suggestions, skillName) {
  const lines = [];

  lines.push(`\n--- Skill Post-execution: ${skillName} ---\n`);

  if (suggestions.nextSkill) {
    lines.push(`\n💡 다음 단계 제안:`);
    lines.push(`   /${suggestions.nextSkill.name}`);
    lines.push(`   ${suggestions.nextSkill.message}`);
  }

  if (suggestions.suggestedAgent) {
    lines.push(`\n🤖 추천 Agent:`);
    lines.push(`   ${suggestions.suggestedAgent}`);
    lines.push(`   ${suggestions.suggestedMessage}`);
  }

  if (!suggestions.nextSkill && !suggestions.suggestedAgent) {
    lines.push(`\n✅ Skill 실행 완료. 다음 작업을 진행하세요.`);
  }

  return lines.join('\n');
}

/**
 * Generate JSON output for Claude Code
 * @param {Object} suggestions - Suggestions from orchestrator
 * @param {string} skillName - Current skill name
 * @returns {Object} JSON output
 */
function generateJsonOutput(suggestions, skillName) {
  const output = {
    skillCompleted: skillName,
    timestamp: new Date().toISOString()
  };

  if (suggestions.nextSkill) {
    output.nextSkill = suggestions.nextSkill.name;
    output.nextSkillMessage = suggestions.nextSkill.message;
  }

  if (suggestions.suggestedAgent) {
    output.suggestedAgent = suggestions.suggestedAgent;
    output.suggestedAgentMessage = suggestions.suggestedMessage;
  }

  return output;
}

/**
 * Main execution
 */
async function main() {
  const lib = getCommon();
  const orch = getOrchestrator();

  try {
    // Read hook input from stdin
    let input = '';
    if (process.stdin.isTTY === false) {
      const chunks = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk);
      }
      input = Buffer.concat(chunks).toString('utf8');
    }

    // Parse hook context
    let hookContext = {};
    try {
      if (input.trim()) {
        hookContext = JSON.parse(input);
      }
    } catch (e) {
      lib.debugLog('SkillPost', 'Failed to parse hook input', { error: e.message });
    }

    // Extract skill info from tool_input
    const toolInput = hookContext.tool_input || {};
    const { skillName, args } = parseSkillInvocation(toolInput);

    if (!skillName) {
      lib.debugLog('SkillPost', 'No skill name found in context');
      console.log(JSON.stringify({ status: 'skip', reason: 'no skill name' }));
      return;
    }

    lib.debugLog('SkillPost', 'Processing skill post-execution', { skillName, args });

    // v1.4.4: Set active skill for unified hooks (GitHub #9354 workaround)
    lib.setActiveSkill(skillName);
    lib.debugLog('SkillPost', 'Active skill set for unified hooks', { skillName });

    // Get orchestration result
    const result = await orch.orchestrateSkillPost(skillName, {}, { args });
    const suggestions = result.suggestions || {};

    // Claude Code: JSON output
    const output = generateJsonOutput(suggestions, skillName);
    output.status = 'success';
    console.log(JSON.stringify(output, null, 2));

    // Update PDCA status if skill has pdca-phase
    const skillConfig = orch.getSkillConfig(skillName);
    if (skillConfig && skillConfig['pdca-phase']) {
      const phase = skillConfig['pdca-phase'];
      const feature = args.feature || lib.getPdcaStatusFull()?.currentFeature;

      if (feature) {
        lib.updatePdcaStatus(phase, feature);
        lib.debugLog('SkillPost', 'PDCA status updated', { phase, feature });
      }
    }

  } catch (e) {
    const lib = getCommon();
    lib.debugLog('SkillPost', 'Error in post-execution', { error: e.message });
    console.log(JSON.stringify({
      status: 'error',
      error: e.message
    }));
  }
}

// Run main
main().catch(e => {
  console.error('skill-post.js fatal error:', e.message);
  process.exit(1);
});
