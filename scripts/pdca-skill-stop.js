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

// Direct module imports
const { readStdinSync } = require('../lib/core/io');
const { debugLog } = require('../lib/core/debug');
const { getPdcaStatusFull, updatePdcaStatus, extractFeatureFromContext } = require('../lib/pdca/status');
const {
  emitUserPrompt,
  shouldAutoAdvance,
  generateAutoTrigger,
  getAutomationLevel,
  buildNextActionQuestion,
  formatAskUserQuestion,
  PDCA_PHASE_TRANSITIONS,
  determinePdcaTransition,
} = require('../lib/pdca/automation');
const { generateExecutiveSummary, formatExecutiveSummary } = require('../lib/pdca/executive-summary');
const { autoCreatePdcaTask, createPdcaTaskChain } = require('../lib/task/creator');
const { updatePdcaTaskStatus } = require('../lib/task/tracker');

// v2.1.5 I2: PDCA_PHASE_TRANSITIONS and determinePdcaTransition moved to lib/pdca/automation.js

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
const actionPattern = /pdca\s+(pm|plan|design|do|analyze|iterate|qa|report|status|next)/i;
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
  qa: {
    nextAction: 'report',
    message: 'QA phase (L1-L5 tests) completed.',
    question: 'Proceed to completion report?',
    options: [
      { label: 'Generate Report (Recommended)', description: `/pdca report ${feature || '[feature]'}` },
      { label: 'Re-run QA', description: `/pdca qa ${feature || '[feature]'}` },
      { label: 'Later', description: 'Keep current state' }
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
  qa: 'qa',
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
      // v2.1.5 F3: Strong directive instead of soft guidance
      const nextCommand = autoTrigger.skill
        ? `/${autoTrigger.skill} ${autoTrigger.args || feature || ''}`
        : null;
      if (nextCommand) {
        guidance += [
          '',
          '',
          `[AUTO-TRANSITION] Phase "${action}" completed successfully.`,
          `You MUST now execute: ${nextCommand}`,
          `Do NOT ask the user for confirmation. Do NOT show Executive Summary.`,
          `Do NOT stop. Proceed immediately to the next phase.`,
        ].join('\n');
      }
      debugLog('Skill:pdca:Stop', 'Auto-advance triggered', { autoTrigger, nextCommand });
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
if (action && feature && ['plan', 'design', 'do', 'analyze', 'iterate', 'qa', 'report'].includes(action)) {
  const phaseMap = {
    plan: 'plan',
    design: 'design',
    do: 'do',
    analyze: 'check',
    iterate: 'act',
    qa: 'qa',
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

  // ENH-227 (Issue #77 Phase A): single-source generator
  const { generateSessionTitle } = require('../lib/pdca/session-title');
  const execSessionTitle = generateSessionTitle({ action: action ? action.toUpperCase() : null, feature });

  const execResponse = {
    decision: 'allow',
    hookSpecificOutput: {
      hookEventName: 'Skill:pdca:Stop',
      additionalContext: [
        guidance,
        '',
        summaryText,
        '',
        `---`,
        '',
        `Please select next step.`
      ].join('\n'),
      sessionTitle: execSessionTitle,
      userPrompt: JSON.stringify(formatted),
    },
    skillResult: {
      action,
      feature: feature || 'unknown',
      nextAction: nextStep?.nextAction || null,
      automationLevel: automationLevel
    },
  };

  console.log(JSON.stringify(execResponse));
  process.exit(0);
}

// ENH-227 (Issue #77 Phase A): single-source generator
const { generateSessionTitle: _genSessionTitleDefault } = require('../lib/pdca/session-title');
const defaultSessionTitle = _genSessionTitleDefault({ action: action ? action.toUpperCase() : null, feature });

// Claude Code: JSON output conforming to CC hook output schema
const response = {
  decision: 'allow',
  hookSpecificOutput: {
    hookEventName: 'Skill:pdca:Stop',
    additionalContext: guidance || undefined,
    sessionTitle: defaultSessionTitle,
    userPrompt: userPrompt,
  },
  skillResult: {
    action,
    feature: feature || 'unknown',
    nextAction: nextStep?.nextAction || null,
    automationLevel: automationLevel
  },
  autoTrigger: autoTrigger,
};

// v2.0.5: Collect M8 (Design Completeness) and M10 (PDCA Cycle Time)
try {
  const mc = require('../lib/quality/metrics-collector');
  const f = feature || 'unknown';

  // M8: Design Completeness — after design phase, estimate from document existence
  if (action === 'design' && f !== 'unknown') {
    const designPath = path.join(process.cwd(), `docs/02-design/features/${f}.design.md`);
    const planPath = path.join(process.cwd(), `docs/01-plan/features/${f}.plan.md`);
    let completeness = 0;
    if (fs.existsSync(designPath)) completeness += 50;
    if (fs.existsSync(planPath)) completeness += 30;
    // Check for key sections in design doc
    if (fs.existsSync(designPath)) {
      const content = fs.readFileSync(designPath, 'utf8');
      if (content.includes('## ')) completeness += 10;
      if (content.length > 500) completeness += 10;
    }
    mc.collectMetric('M8', f, Math.min(completeness, 100), 'pdca-skill');
  }

  // M10: PDCA Cycle Time — on report phase, compute hours since feature started
  if (action === 'report' && f !== 'unknown') {
    const featureData = currentStatus?.features?.[f];
    const startedAt = featureData?.timestamps?.started;
    if (startedAt) {
      const hours = Math.round((Date.now() - new Date(startedAt).getTime()) / 3600000 * 100) / 100;
      mc.collectMetric('M10', f, hours, 'pdca-skill');
    }
  }
} catch (_) {}

console.log(JSON.stringify(response));
process.exit(0);
