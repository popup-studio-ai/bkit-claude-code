#!/usr/bin/env node
/**
 * pdca-skill-stop.js - PDCA Skill Stop Hook (v1.4.4)
 *
 * Purpose: Process PDCA skill completion and guide next steps
 * Hook: Stop for pdca skill
 * Part of v1.4.4 Skills/Agents/Commands Enhancement
 *
 * @version 1.6.0
 * @module scripts/pdca-skill-stop
 */

const fs = require('fs');
const path = require('path');

// Import common utilities
const {
  readStdinSync,
  debugLog,
  getPdcaStatusFull,
  updatePdcaStatus,
  extractFeatureFromContext,
  emitUserPrompt,
  getBkitConfig,
  outputAllow,
  // v1.4.4 FR-06: Phase transition and task creation
  autoCreatePdcaTask,
  updatePdcaTaskStatus,
  // v1.4.7 FR-01: Task Chain auto generation
  createPdcaTaskChain,
  getTaskChainStatus,
  // v1.4.7 Full-Auto Mode
  isFullAutoMode,
  shouldAutoAdvance,
  generateAutoTrigger,
  getAutomationLevel,
  // v1.5.9: Executive Summary + AskUserQuestion
  buildNextActionQuestion,
  formatAskUserQuestion,
  generateExecutiveSummary,
  formatExecutiveSummary,
} = require('../lib/common.js');

// ============================================================
// v1.4.4 FR-06: PDCA Phase Transition Map
// ============================================================

/**
 * PDCA Phase Transition Map (v1.4.4)
 * Auto-transition to next phase on completion
 */
const PDCA_PHASE_TRANSITIONS = {
  'pm': {
    next: 'plan',
    skill: '/pdca plan',
    message: 'PM analysis completed. Proceed to Plan phase.',
    taskTemplate: '[Plan] {feature}'
  },
  'plan': {
    next: 'design',
    skill: '/pdca design',
    message: 'Plan completed. Proceed to Design phase.',
    taskTemplate: '[Design] {feature}'
  },
  'design': {
    next: 'do',
    skill: null,  // Implementation is manual
    message: 'Design completed. Start implementation.',
    taskTemplate: '[Do] {feature}'
  },
  'do': {
    next: 'check',
    skill: '/pdca analyze',
    message: 'Implementation completed. Run Gap analysis.',
    taskTemplate: '[Check] {feature}'
  },
  'check': {
    // Conditional transition
    conditions: [
      {
        when: (ctx) => ctx.matchRate >= 90,
        next: 'report',
        skill: '/pdca report',
        message: 'Check passed! Generate completion report.',
        taskTemplate: '[Report] {feature}'
      },
      {
        when: (ctx) => ctx.matchRate < 90,
        next: 'act',
        skill: '/pdca iterate',
        message: 'Check below threshold. Run auto improvement.',
        taskTemplate: '[Act-{N}] {feature}'
      }
    ]
  },
  'act': {
    next: 'check',
    skill: '/pdca analyze',
    message: 'Act completed. Run re-verification.',
    taskTemplate: '[Check] {feature}'
  }
};

/**
 * Determine PDCA transition (v1.4.4 FR-06)
 * @param {string} currentPhase - Current Phase ('plan', 'design', 'do', 'check', 'act')
 * @param {Object} context - { matchRate, iterationCount, feature }
 * @returns {Object|null} { next, skill, message, taskTemplate }
 */
function determinePdcaTransition(currentPhase, context = {}) {
  const transition = PDCA_PHASE_TRANSITIONS[currentPhase];
  if (!transition) return null;

  // Conditional transition
  if (transition.conditions) {
    for (const condition of transition.conditions) {
      if (condition.when(context)) {
        return {
          next: condition.next,
          skill: condition.skill,
          message: condition.message,
          taskTemplate: condition.taskTemplate.replace('{N}', context.iterationCount || 1)
        };
      }
    }
    return null;
  }

  // Standard transition
  return {
    next: transition.next,
    skill: transition.skill,
    message: transition.message,
    taskTemplate: transition.taskTemplate
  };
}

// Log execution start
debugLog('Skill:pdca:Stop', 'Hook started');

// Read skill output from stdin
let input;
try {
  input = readStdinSync();
} catch (e) {
  debugLog('Skill:pdca:Stop', 'Failed to read stdin', { error: e.message });
  process.exit(0);
}

const inputText = typeof input === 'string' ? input : JSON.stringify(input);

debugLog('Skill:pdca:Stop', 'Input received', {
  inputLength: inputText.length,
  inputPreview: inputText.substring(0, 200)
});

// Extract action from skill invocation
// Patterns: "pdca plan", "pdca design", "/pdca analyze", etc.
const actionPattern = /pdca\s+(pm|plan|design|do|analyze|iterate|report|status|next)/i;
const actionMatch = inputText.match(actionPattern);
const action = actionMatch ? actionMatch[1].toLowerCase() : null;

// Extract feature name
const currentStatus = getPdcaStatusFull();
const feature = extractFeatureFromContext({
  agentOutput: inputText,
  currentStatus
});

debugLog('Skill:pdca:Stop', 'Context extracted', {
  action,
  feature: feature || 'unknown',
  currentPhase: currentStatus?.activePdca?.phase
});

// Define next step mapping
const nextStepMap = {
  pm: {
    nextAction: 'plan',
    message: 'PM analysis and PRD have been generated.',
    question: 'Proceed to Plan phase?',
    options: [
      { label: 'Start Plan (Recommended)', description: `/pdca plan ${feature || '[feature]'}` },
      { label: 'Later', description: 'Keep current state' }
    ]
  },
  plan: {
    nextAction: 'design',
    message: 'Plan document has been generated.',
    question: 'Proceed to Design phase?',
    options: [
      { label: 'Start Design (Recommended)', description: `/pdca design ${feature || '[feature]'}` },
      { label: 'Later', description: 'Keep current state' }
    ]
  },
  design: {
    nextAction: 'do',
    message: 'Design document has been generated.',
    question: 'Start implementation?',
    options: [
      { label: 'Start Implementation (Recommended)', description: `/pdca do ${feature || '[feature]'}` },
      { label: 'Later', description: 'Keep current state' }
    ]
  },
  do: {
    nextAction: 'analyze',
    message: 'Implementation guide has been provided.',
    question: 'Run Gap analysis when implementation is complete.',
    options: [
      { label: 'Run Gap Analysis', description: `/pdca analyze ${feature || '[feature]'}` },
      { label: 'Continue Implementing', description: 'Continue implementation' }
    ]
  },
  analyze: {
    nextAction: 'iterate',
    message: 'Gap analysis completed.',
    question: 'Select next step based on results.',
    options: [
      { label: 'Auto Improve', description: `/pdca iterate ${feature || '[feature]'}` },
      { label: 'Completion Report', description: `/pdca report ${feature || '[feature]'}` },
      { label: 'Manual Fix', description: 'Manually fix code then re-analyze' }
    ]
  },
  iterate: {
    nextAction: 'analyze',
    message: 'Auto improvement completed.',
    question: 'Run Gap analysis again?',
    options: [
      { label: 'Re-analyze (Recommended)', description: `/pdca analyze ${feature || '[feature]'}` },
      { label: 'Completion Report', description: `/pdca report ${feature || '[feature]'}` }
    ]
  },
  report: {
    nextAction: null,
    message: 'Completion report has been generated.',
    question: 'PDCA cycle completed!',
    options: [
      { label: 'Archive', description: 'Archive documents with /pdca archive' },
      { label: 'Start New Feature', description: '/pdca plan [new-feature]' }
    ]
  },
  status: {
    nextAction: null,
    message: null,
    question: null,
    options: null
  },
  next: {
    nextAction: null,
    message: null,
    question: null,
    options: null
  }
};

// Get next step configuration
const nextStep = action ? nextStepMap[action] : null;

// Generate user prompt if applicable
let userPrompt = null;
let guidance = '';
let autoTrigger = null;

// v1.4.7: Check automation level
const automationLevel = getAutomationLevel();
const phaseMap = {
  plan: 'plan',
  design: 'design',
  do: 'do',
  analyze: 'check',
  iterate: 'act',
  report: 'completed'
};
const currentPhaseForAuto = action ? phaseMap[action] : null;

if (nextStep && nextStep.message) {
  guidance = `✅ ${nextStep.message}`;

  // v1.4.7 Full-Auto Mode: Skip userPrompt and generate autoTrigger
  if (shouldAutoAdvance(currentPhaseForAuto) && feature) {
    autoTrigger = generateAutoTrigger(currentPhaseForAuto, {
      feature,
      matchRate: currentStatus?.features?.[feature]?.matchRate || 0,
      iterationCount: currentStatus?.features?.[feature]?.iterationCount || 0
    });

    if (autoTrigger) {
      guidance += `\n\n🤖 [${automationLevel}] Auto-advance: ${autoTrigger.skill}`;
      debugLog('Skill:pdca:Stop', 'Auto-advance triggered', { autoTrigger });
    }
  } else if (nextStep.question && nextStep.options) {
    // Manual/Semi-auto: Generate user prompt
    userPrompt = emitUserPrompt({
      questions: [{
        question: nextStep.question,
        header: action ? action.charAt(0).toUpperCase() + action.slice(1) : 'PDCA',
        options: nextStep.options,
        multiSelect: false
      }]
    });
  }
}

// Update PDCA status if action completed
if (action && feature && ['plan', 'design', 'do', 'analyze', 'iterate', 'report'].includes(action)) {
  const phaseMap = {
    plan: 'plan',
    design: 'design',
    do: 'do',
    analyze: 'check',
    iterate: 'act',
    report: 'completed'
  };

  const currentPhase = phaseMap[action];

  // v1.4.7 FR-01: Create Task chain when plan starts
  if (action === 'plan') {
    try {
      const chain = createPdcaTaskChain(feature, { skipIfExists: true });
      if (chain) {
        debugLog('Skill:pdca:Stop', 'Task chain created', {
          feature,
          taskCount: chain.entries.length,
          firstTaskId: chain.entries[0]?.id
        });
        guidance += `\n\n📋 PDCA Task Chain created (${chain.entries.length} Tasks)`;
      }
    } catch (e) {
      debugLog('Skill:pdca:Stop', 'Task chain creation failed', { error: e.message });
    }
  }

  updatePdcaStatus(feature, currentPhase, {
    lastAction: action,
    timestamp: new Date().toISOString()
  });

  debugLog('Skill:pdca:Stop', 'PDCA status updated', {
    feature,
    phase: currentPhase,
    action
  });

  // v1.4.4 FR-06: Auto-create next phase Task using determinePdcaTransition
  try {
    const featureStatus = currentStatus?.features?.[feature];
    const context = {
      feature,
      matchRate: featureStatus?.matchRate || 0,
      iterationCount: featureStatus?.iterationCount || 0
    };

    const transition = determinePdcaTransition(currentPhase, context);

    if (transition && transition.next !== 'completed') {
      // Update current phase task status
      updatePdcaTaskStatus(currentPhase, feature, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      // Auto-create next phase task
      const nextTaskTemplate = transition.taskTemplate.replace('{feature}', feature);
      const nextTask = autoCreatePdcaTask({
        phase: transition.next,
        feature,
        metadata: {
          previousPhase: currentPhase,
          suggestedSkill: transition.skill,
          blockedBy: `[${currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)}] ${feature}`
        }
      });

      if (nextTask) {
        debugLog('Skill:pdca:Stop', 'Next phase Task auto-created', {
          nextPhase: transition.next,
          taskId: nextTask.taskId,
          skill: transition.skill
        });
      }
    }
  } catch (e) {
    debugLog('Skill:pdca:Stop', 'Phase transition task creation failed', { error: e.message });
  }
}

// Log completion
debugLog('Skill:pdca:Stop', 'Hook completed', {
  action,
  feature: feature || 'unknown',
  hasNextStep: !!nextStep?.nextAction
});

// v1.6.0: Executive Summary + AskUserQuestion for plan/design/report (ENH-103)
if (feature && (action === 'plan' || action === 'design' || action === 'report') && !autoTrigger) {
  const summary = generateExecutiveSummary(feature, action);
  const summaryText = formatExecutiveSummary(summary, 'full');

  const featureData = currentStatus?.features?.[feature] || {};
  const questionPayload = buildNextActionQuestion(action, feature, {
    matchRate: featureData.matchRate || 0,
    iterCount: featureData.iterationCount || 0
  });
  const formatted = formatAskUserQuestion(questionPayload);

  const execResponse = {
    decision: 'allow',
    hookEventName: 'Skill:pdca:Stop',
    skillResult: {
      action,
      feature: feature || 'unknown',
      nextAction: nextStep?.nextAction || null,
      automationLevel: automationLevel
    },
    systemMessage: [
      guidance,
      '',
      summaryText,
      '',
      `---`,
      '',
      `Please select next step.`
    ].join('\n'),
    userPrompt: JSON.stringify(formatted)
  };

  console.log(JSON.stringify(execResponse));
  process.exit(0);
}

// Claude Code: JSON output (default for other actions)
const response = {
  decision: 'allow',
  hookEventName: 'Skill:pdca:Stop',
  skillResult: {
    action,
    feature: feature || 'unknown',
    nextAction: nextStep?.nextAction || null,
    automationLevel: automationLevel
  },
  guidance: guidance || null,
  userPrompt: userPrompt,
  // v1.4.7: Auto-trigger for full-auto mode
  autoTrigger: autoTrigger,
  systemMessage: guidance ? (
    `${guidance}\n\n` +
    `## MANDATORY: AskUserQuestion\n\n` +
    `Ask the user to select next step with these parameters:\n\n` +
    `${userPrompt || '(select next step)'}\n\n` +
    `### Actions by selection:\n` +
    (nextStep?.options ? nextStep.options.map(opt => `- **${opt.label}** → ${opt.description}`).join('\n') : '')
  ) : null
};

console.log(JSON.stringify(response));
process.exit(0);
