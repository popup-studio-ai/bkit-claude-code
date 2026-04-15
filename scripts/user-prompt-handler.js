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
const { generateSessionTitle } = require('../lib/pdca/session-title');

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

// ENH-226 (Issue #77 Phase A): contextInjection opt-out gate
// 사용자가 ui.contextInjection.enabled=false 시 ambiguity score, "Previous Work Detected" 등
// 추가 컨텍스트 주입만 비활성화한다. sessionTitle은 별도 경로로 발행되므로 여기서 조기 종료하지 않는다.
// TC-A3 fix (2026-04-15): 조기 exit 제거 → contextInjection opt-out + sessionTitle 활성화 조합 정상 동작.
let contextInjectionEnabled = true;
try {
  const { getUIConfig } = require('../lib/core/config');
  const ui = getUIConfig();
  if (ui && ui.contextInjection && ui.contextInjection.enabled === false) {
    contextInjectionEnabled = false;
  }
} catch (_e) {
  // config 읽기 실패는 silent — 기존 동작 유지
}

const contextParts = [];

// ENH-226 Phase A: contextInjection opt-out — additional context 섹션만 스킵, sessionTitle은 유지.
if (!contextInjectionEnabled) {
  // sessionTitle만 발행 (있을 때)
  const sessionTitle = generateSessionTitle({ sessionId: input.session_id });
  if (sessionTitle) {
    console.log(JSON.stringify({
      success: true,
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        sessionTitle,
      }
    }));
  } else {
    outputEmpty();
  }
  process.exit(0);
}

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

// 6. v1.4.2 + v2.1.5 F1: Resolve Skill/Agent imports and inject into additionalContext
if (importResolver) {
  try {
    const skillTrigger = matchImplicitSkillTrigger(userPrompt);
    if (skillTrigger && skillTrigger.skill) {
      const skillPath = path.join(PLUGIN_ROOT, 'skills', skillTrigger.skill, 'SKILL.md');
      if (fs.existsSync(skillPath)) {
        const { content, errors } = importResolver.processMarkdownWithImports(skillPath);

        // v2.1.5 F1: Inject resolved template structure into contextParts
        if (content && content.length > 0) {
          const sectionHeadings = content.match(/^##\s+.+$/gm) || [];
          const templateSummary = sectionHeadings.length > 0
            ? `Template structure for ${skillTrigger.skill}: ${sectionHeadings.slice(0, 15).join(' / ')}`
            : `Template loaded for ${skillTrigger.skill} (${content.length} chars)`;

          contextParts.push(templateSummary);
          debugLog('UserPrompt', 'Skill imports injected into additionalContext', {
            skill: skillTrigger.skill,
            contentLength: content.length,
            headingCount: sectionHeadings.length
          });
        }

        // v2.1.5 F1/I4: Surface import errors as warnings
        if (errors && errors.length > 0) {
          contextParts.push(`[WARNING] Template import errors: ${errors.join('; ')}`);
          debugLog('UserPrompt', 'Skill import errors', { errors });
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

// ENH-227 (Issue #77 Phase A): single-source generator with opt-out + phase-change-only + stale TTL
const sessionTitle = generateSessionTitle({ sessionId: input.session_id });

if (contextParts.length > 0) {
  const context = truncateContext(contextParts.join(' | '));
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
} else if (sessionTitle || ambiguityUserPrompt) {
  console.log(JSON.stringify({
    success: true,
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      sessionTitle,
      userPrompt: ambiguityUserPrompt || undefined,
    }
  }));
} else {
  outputEmpty();
}
