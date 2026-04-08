#!/usr/bin/env node
/**
 * user-prompt-handler.js - UserPromptSubmit Hook (FR-04)
 * Process user input before AI processing
 *
 * @version 1.6.0
 * @module scripts/user-prompt-handler
 */

const fs = require('fs');
const path = require('path');
const { readStdinSync, outputAllow, outputEmpty, truncateContext } = require('../lib/core/io');
const { debugLog } = require('../lib/core/debug');
const { PLUGIN_ROOT } = require('../lib/core/platform');
const { detectNewFeatureIntent, matchImplicitAgentTrigger, matchImplicitSkillTrigger } = require('../lib/intent/trigger');
const { calculateAmbiguityScore } = require('../lib/intent/ambiguity');
const { getPdcaStatusFull } = require('../lib/pdca/status');

// v1.4.2: Import Resolver (FR-02)
let importResolver;
try {
  importResolver = require('../lib/import-resolver.js');
} catch (e) {
  importResolver = null;
}

/**
 * Check if bkend MCP is configured in project
 * @returns {boolean}
 */
function checkBkendMcpConfig() {
  const mcpJsonPath = path.join(process.cwd(), '.mcp.json');
  if (fs.existsSync(mcpJsonPath)) {
    try {
      const content = fs.readFileSync(mcpJsonPath, 'utf-8');
      if (content.includes('bkend') || content.includes('api.bkend.ai')) {
        return true;
      }
    } catch (e) { /* ignore */ }
  }
  const settingsPath = path.join(process.cwd(), '.claude', 'settings.json');
  if (fs.existsSync(settingsPath)) {
    try {
      const content = fs.readFileSync(settingsPath, 'utf-8');
      if (content.includes('bkend') || content.includes('api.bkend.ai')) {
        return true;
      }
    } catch (e) { /* ignore */ }
  }
  return false;
}

// Read user prompt from stdin
let input;
try {
  input = readStdinSync();
} catch (e) {
  debugLog('UserPrompt', 'Failed to read stdin', { error: e.message });
  outputEmpty();
  process.exit(0);
}

const userPrompt = input.prompt || input.user_message || input.message || '';

debugLog('UserPrompt', 'Hook started', { promptLength: userPrompt.length });

// Skip processing for very short prompts
if (!userPrompt || userPrompt.length < 3) {
  outputEmpty();
  process.exit(0);
}

const contextParts = [];

// 1. New Feature Intent Detection
try {
  const featureIntent = detectNewFeatureIntent(userPrompt);
  if (featureIntent && featureIntent.isNewFeature && featureIntent.confidence > 0.8) {
    contextParts.push(`New feature detected: "${featureIntent.featureName}". Consider /pdca-plan first.`);
    debugLog('UserPrompt', 'New feature intent detected', {
      featureName: featureIntent.featureName,
      confidence: featureIntent.confidence
    });
  }
} catch (e) {
  debugLog('UserPrompt', 'Feature intent detection failed', { error: e.message });
}

// 2. Implicit Agent Trigger
try {
  const agentTrigger = matchImplicitAgentTrigger(userPrompt);
  if (agentTrigger && agentTrigger.confidence >= 0.8) {
    contextParts.push(`Suggested agent: ${agentTrigger.agent}`);
    debugLog('UserPrompt', 'Agent trigger matched', {
      agent: agentTrigger.agent,
      confidence: agentTrigger.confidence
    });
  }
} catch (e) {
  debugLog('UserPrompt', 'Agent trigger detection failed', { error: e.message });
}

// 3. Implicit Skill Trigger
try {
  const skillTrigger = matchImplicitSkillTrigger(userPrompt);
  if (skillTrigger && skillTrigger.confidence > 0.75) {
    contextParts.push(`Relevant skill: ${skillTrigger.skill}`);
    debugLog('UserPrompt', 'Skill trigger matched', {
      skill: skillTrigger.skill,
      confidence: skillTrigger.confidence
    });
  }
} catch (e) {
  debugLog('UserPrompt', 'Skill trigger detection failed', { error: e.message });
}

// 3.3: v1.5.7 CC Built-in Command Detection (simplify/batch awareness)
try {
  const { CC_COMMAND_PATTERNS, matchMultiLangPattern } = require('../lib/intent/language');
  if (CC_COMMAND_PATTERNS) {
    if (matchMultiLangPattern(userPrompt, CC_COMMAND_PATTERNS['simplify'])) {
      contextParts.push('CC /simplify command detected. Suggest after Check ≥90% or code review.');
      debugLog('UserPrompt', 'CC simplify command detected');
    }
    if (matchMultiLangPattern(userPrompt, CC_COMMAND_PATTERNS['batch'])) {
      contextParts.push('CC /batch command detected. Useful for multi-feature PDCA (Enterprise).');
      debugLog('UserPrompt', 'CC batch command detected');
    }
  }
} catch (e) {
  debugLog('UserPrompt', 'CC command detection failed', { error: e.message });
}

// 3.5: bkend recommendation for backend/DB requests (G-04, G-05)
try {
  const skillTriggerForBkend = matchImplicitSkillTrigger(userPrompt);
  if (skillTriggerForBkend && skillTriggerForBkend.skill === 'dynamic') {
    const hasBkendMcp = checkBkendMcpConfig();
    if (!hasBkendMcp) {
      contextParts.push(
        'bkend.ai MCP not configured. Suggest: claude mcp add bkend --transport http https://api.bkend.ai/mcp'
      );
      debugLog('UserPrompt', 'bkend MCP not configured, suggesting setup');
    }
  }
} catch (e) {
  debugLog('UserPrompt', 'bkend MCP check failed', { error: e.message });
}

// 4. Ambiguity Detection
let ambiguityUserPrompt = null;
try {
  const ambiguity = calculateAmbiguityScore(userPrompt, {});
  if (ambiguity && ambiguity.shouldClarify && !ambiguity.bypassed) {
    contextParts.push(`Request may be ambiguous (score: ${ambiguity.score}). Consider clarifying.`);
    debugLog('UserPrompt', 'Ambiguity detected', {
      score: ambiguity.score,
      factors: ambiguity.factors
    });
    // v2.1.1 H-02: Generate AskUserQuestion for high-ambiguity requests
    if (ambiguity.score > 0.7 && ambiguity.clarifyingQuestions && ambiguity.clarifyingQuestions.length > 0) {
      try {
        const { formatAskUserQuestion } = require('../lib/pdca/automation');
        ambiguityUserPrompt = JSON.stringify(formatAskUserQuestion({
          question: ambiguity.clarifyingQuestions[0],
          header: 'Clarify Request',
          options: [
            { label: 'Yes, correct', description: 'This interpretation is correct' },
            { label: 'No', description: 'Please interpret differently' },
            { label: 'More details', description: 'I will explain in more detail' }
          ],
          multiSelect: false,
        }));
      } catch (_) {}
    }
  }
} catch (e) {
  debugLog('UserPrompt', 'Ambiguity detection failed', { error: e.message });
}

// 5. Team Mode Auto-Suggestion (Automation First)
try {
  let teamModule = null;
  try {
    teamModule = require('../lib/team');
  } catch (e) {
    // Team module not available
  }

  if (teamModule && teamModule.suggestTeamMode) {
    const teamSuggestion = teamModule.suggestTeamMode(userPrompt, {
      messageLength: userPrompt.length,
    });
    if (teamSuggestion && teamSuggestion.suggest) {
      contextParts.push(
        `CTO Agent Team recommended for ${teamSuggestion.level} level. ` +
        `Use \`/pdca team {feature}\` for parallel PDCA with Agent Teams orchestration.`
      );
      debugLog('UserPrompt', 'Team mode suggested', {
        level: teamSuggestion.level,
        reason: teamSuggestion.reason,
      });
    }
  }
} catch (e) {
  debugLog('UserPrompt', 'Team suggestion failed', { error: e.message });
}

// 6. v1.4.2: Resolve Skill/Agent imports (FR-02)
if (importResolver) {
  try {
    // Get triggered skill from step 3
    const skillTrigger = matchImplicitSkillTrigger(userPrompt);
    if (skillTrigger && skillTrigger.skill) {
      const skillPath = path.join(PLUGIN_ROOT, 'skills', skillTrigger.skill, 'SKILL.md');
      if (fs.existsSync(skillPath)) {
        const { content, errors } = importResolver.processMarkdownWithImports(skillPath);
        if (content && content.length > 0 && errors.length === 0) {
          debugLog('UserPrompt', 'Skill imports resolved', {
            skill: skillTrigger.skill,
            contentLength: content.length
          });
          // Note: The imported content is now available for the skill
          // Platform will load it through additionalContext
        }
      }
    }
  } catch (e) {
    debugLog('UserPrompt', 'Skill import resolution failed', { error: e.message });
  }
}

debugLog('UserPrompt', 'Hook completed', {
  contextPartsCount: contextParts.length
});

if (contextParts.length > 0) {
  const context = truncateContext(contextParts.join(' | '));
  // ENH-187: Auto session title based on active PDCA feature (CC v2.1.94+)
  // v2.1.1 QM-04: sessionTitle includes phase for PDCA context
  const pdcaStatus = getPdcaStatusFull();
  const feature = pdcaStatus?.primaryFeature || pdcaStatus?.feature || null;
  const phase = pdcaStatus?.currentPhase || pdcaStatus?.session?.currentPhase || null;
  const sessionTitle = feature
    ? (phase ? `[bkit] ${phase.toUpperCase()} ${feature}` : `[bkit] ${feature}`)
    : undefined;
  console.log(JSON.stringify({
    success: true,
    message: context || undefined,
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: context || undefined,
      sessionTitle,
      // v2.1.1 H-02: AskUserQuestion for high-ambiguity requests
      userPrompt: ambiguityUserPrompt || undefined,
    }
  }));
} else {
  outputEmpty();
}
