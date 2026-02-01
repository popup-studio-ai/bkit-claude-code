#!/usr/bin/env node
/**
 * pdca-skill-stop.js - PDCA Skill Stop Hook (v1.4.4)
 *
 * Purpose: Process PDCA skill completion and guide next steps
 * Hook: Stop for pdca skill
 * Part of v1.4.4 Skills/Agents/Commands Enhancement
 *
 * @version 1.4.4
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
  getAutomationLevel
} = require('../lib/common.js');

// ============================================================
// v1.4.4 FR-06: PDCA Phase 전환 맵
// ============================================================

/**
 * PDCA Phase 전환 맵 (v1.4.4)
 * 각 Phase 완료 시 다음 단계로 자동 전환
 */
const PDCA_PHASE_TRANSITIONS = {
  'plan': {
    next: 'design',
    skill: '/pdca design',
    message: 'Plan 완료. Design 단계로 진행하세요.',
    taskTemplate: '[Design] {feature}'
  },
  'design': {
    next: 'do',
    skill: null,  // 구현은 수동
    message: 'Design 완료. 구현을 시작하세요.',
    taskTemplate: '[Do] {feature}'
  },
  'do': {
    next: 'check',
    skill: '/pdca analyze',
    message: '구현 완료. Gap 분석을 실행하세요.',
    taskTemplate: '[Check] {feature}'
  },
  'check': {
    // 조건부 전환
    conditions: [
      {
        when: (ctx) => ctx.matchRate >= 90,
        next: 'report',
        skill: '/pdca report',
        message: 'Check 통과! 완료 보고서를 생성하세요.',
        taskTemplate: '[Report] {feature}'
      },
      {
        when: (ctx) => ctx.matchRate < 90,
        next: 'act',
        skill: '/pdca iterate',
        message: 'Check 미달. 자동 개선을 실행하세요.',
        taskTemplate: '[Act-{N}] {feature}'
      }
    ]
  },
  'act': {
    next: 'check',
    skill: '/pdca analyze',
    message: 'Act 완료. 재검증을 실행하세요.',
    taskTemplate: '[Check] {feature}'
  }
};

/**
 * PDCA 전환 결정 (v1.4.4 FR-06)
 * @param {string} currentPhase - 현재 Phase ('plan', 'design', 'do', 'check', 'act')
 * @param {Object} context - { matchRate, iterationCount, feature }
 * @returns {Object|null} { next, skill, message, taskTemplate }
 */
function determinePdcaTransition(currentPhase, context = {}) {
  const transition = PDCA_PHASE_TRANSITIONS[currentPhase];
  if (!transition) return null;

  // 조건부 전환 처리
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

  // 일반 전환
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
const actionPattern = /pdca\s+(plan|design|do|analyze|iterate|report|status|next)/i;
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
  plan: {
    nextAction: 'design',
    message: 'Plan 문서가 생성되었습니다.',
    question: 'Design 단계로 진행할까요?',
    options: [
      { label: 'Design 진행 (권장)', description: `/pdca design ${feature || '[feature]'}` },
      { label: '나중에', description: '현재 상태 유지' }
    ]
  },
  design: {
    nextAction: 'do',
    message: 'Design 문서가 생성되었습니다.',
    question: '구현을 시작할까요?',
    options: [
      { label: '구현 시작 (권장)', description: `/pdca do ${feature || '[feature]'}` },
      { label: '나중에', description: '현재 상태 유지' }
    ]
  },
  do: {
    nextAction: 'analyze',
    message: '구현 가이드가 제공되었습니다.',
    question: '구현이 완료되면 Gap 분석을 실행하세요.',
    options: [
      { label: 'Gap 분석 실행', description: `/pdca analyze ${feature || '[feature]'}` },
      { label: '계속 구현', description: '구현 계속 진행' }
    ]
  },
  analyze: {
    nextAction: 'iterate',
    message: 'Gap 분석이 완료되었습니다.',
    question: '결과에 따라 다음 단계를 선택하세요.',
    options: [
      { label: '자동 개선', description: `/pdca iterate ${feature || '[feature]'}` },
      { label: '완료 보고서', description: `/pdca report ${feature || '[feature]'}` },
      { label: '수동 수정', description: '직접 코드 수정 후 재분석' }
    ]
  },
  iterate: {
    nextAction: 'analyze',
    message: '자동 개선이 완료되었습니다.',
    question: 'Gap 분석을 다시 실행할까요?',
    options: [
      { label: '재분석 (권장)', description: `/pdca analyze ${feature || '[feature]'}` },
      { label: '완료 보고서', description: `/pdca report ${feature || '[feature]'}` }
    ]
  },
  report: {
    nextAction: null,
    message: '완료 보고서가 생성되었습니다.',
    question: 'PDCA 사이클이 완료되었습니다!',
    options: [
      { label: '아카이브', description: '/archive 명령으로 문서 정리' },
      { label: '새 기능 시작', description: '/pdca plan [new-feature]' }
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
      guidance += `\n\n🤖 [${automationLevel}] 자동 진행: ${autoTrigger.skill}`;
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
        guidance += `\n\n📋 PDCA Task Chain 생성됨 (${chain.entries.length}개 Task)`;
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

// Claude Code: JSON output
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
    `## 🚨 MANDATORY: AskUserQuestion 호출\n\n` +
    `아래 파라미터로 사용자에게 다음 단계를 질문하세요:\n\n` +
    `${userPrompt || '(다음 단계 선택)'}\n\n` +
    `### 선택별 동작:\n` +
    (nextStep?.options ? nextStep.options.map(opt => `- **${opt.label}** → ${opt.description}`).join('\n') : '')
  ) : null
};

console.log(JSON.stringify(response));
process.exit(0);
