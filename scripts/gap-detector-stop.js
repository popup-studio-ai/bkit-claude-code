#!/usr/bin/env node
/**
 * gap-detector-stop.js - Parse gap analysis result and guide next steps (v1.4.0)
 *
 * Purpose: Parse match rate and provide guidance for Check-Act iteration
 * Hook: Stop for gap-detector agent
 * Core component of Check-Act iteration loop
 *
 * v1.4.0 Changes:
 * - Added debug logging for hook verification
 * - Added PDCA status update with match rate
 * - Added dynamic feature extraction from multiple sources
 *
 * Converted from: scripts/gap-detector-stop.sh
 */

const {
  readStdinSync,
  outputAllow,
  generateTaskGuidance,
  debugLog,
  updatePdcaStatus,
  extractFeatureFromContext,
  getPdcaStatusFull,
  // v1.4.0 Automation Functions
  emitUserPrompt,
  getBkitConfig,
  autoAdvancePdcaPhase,
  // v1.4.0 P2: Requirement Fulfillment Integration
  extractRequirementsFromPlan,
  calculateRequirementFulfillment,
  // v1.4.4 FR-07: Task Status Update
  updatePdcaTaskStatus,
  // v1.4.7 FR-04, FR-05, FR-06: Check↔Act Iteration
  triggerNextPdcaAction,
  savePdcaTaskId,
  // v1.4.7 Full-Auto Mode
  isFullAutoMode,
  shouldAutoAdvance,
  getAutomationLevel
} = require('../lib/common.js');

// Log execution start
debugLog('Agent:gap-detector:Stop', 'Hook started');

// Read conversation context from stdin
const input = readStdinSync();
const inputText = typeof input === 'string' ? input : JSON.stringify(input);

debugLog('Agent:gap-detector:Stop', 'Input received', {
  inputLength: inputText.length,
  inputPreview: inputText.substring(0, 200)
});

// Try to extract match rate from the agent's output
// Patterns: "Overall Match Rate: XX%", "매치율: XX%", "Match Rate: XX%", "일치율: XX%"
const matchRatePattern = /(Overall|Match Rate|매치율|일치율|Design Match)[^0-9]*(\d+)/i;
const match = inputText.match(matchRatePattern);
let matchRate = match ? parseInt(match[2], 10) : 0;

// Extract feature name from multiple sources
const featurePattern = /feature[:\s]+['"]?(\w[\w-]*)['"]?/i;
const analysisPattern = /analyzing\s+['"]?(\w[\w-]*)['"]?/i;
const featureMatch = inputText.match(featurePattern) || inputText.match(analysisPattern);
const currentStatus = getPdcaStatusFull();

const feature = extractFeatureFromContext({
  agentOutput: inputText,
  currentStatus
});

debugLog('Agent:gap-detector:Stop', 'Data extracted', {
  matchRate,
  feature: feature || 'unknown',
  hadFeatureInOutput: !!featureMatch
});

// v1.4.0 P2: Calculate requirement fulfillment if plan exists
let fulfillmentResult = null;
const planDocPath = `docs/01-plan/features/${feature}.plan.md`;
const fs = require('fs');
if (feature && fs.existsSync(planDocPath)) {
  try {
    fulfillmentResult = calculateRequirementFulfillment(planDocPath, {
      matchRate,
      analysisDoc: `docs/03-analysis/${feature}.analysis.md`
    });
    debugLog('Agent:gap-detector:Stop', 'Requirement fulfillment calculated', {
      score: fulfillmentResult.score,
      fulfilled: fulfillmentResult.fulfilled,
      total: fulfillmentResult.total
    });
  } catch (e) {
    debugLog('Agent:gap-detector:Stop', 'Fulfillment calculation failed', { error: e.message });
  }
}

// Update PDCA status with match rate and fulfillment
if (feature) {
  updatePdcaStatus(feature, 'check', {
    matchRate,
    analysisDoc: `docs/03-analysis/${feature}.analysis.md`,
    fulfillment: fulfillmentResult ? {
      score: fulfillmentResult.score,
      fulfilled: fulfillmentResult.fulfilled,
      total: fulfillmentResult.total
    } : null
  });
}

// v1.4.0: Get configuration and check iteration limits
const config = getBkitConfig();
const threshold = config.pdca?.matchRateThreshold || 90;
const maxIterations = config.pdca?.maxIterations || 5;
const featureStatus = currentStatus.features?.[feature];
const iterCount = featureStatus?.iterationCount || 0;

// Generate guidance based on match rate thresholds
let guidance = '';
let nextStep = '';
let userPrompt = null;

if (matchRate >= threshold) {
  // 90% 이상: 완료 제안
  nextStep = 'pdca-report';
  guidance = `✅ Gap Analysis 완료: ${matchRate}% 매치

설계-구현이 잘 일치합니다.

다음 단계:
1. /pdca-report ${feature || ''} 로 완료 보고서 생성
2. Archive 진행 가능 (docs/archive/로 이동)

🎉 PDCA Check 단계 통과!`;

  // v1.4.0: Generate AskUserQuestion prompt for completion
  userPrompt = emitUserPrompt({
    questions: [{
      question: `매치율 ${matchRate}%입니다. 완료 보고서를 생성할까요?`,
      header: 'Complete',
      options: [
        { label: '보고서 생성 (권장)', description: `/pdca-report ${feature || ''} 실행` },
        { label: '추가 개선', description: `/pdca-iterate ${feature || ''} 실행` },
        { label: '나중에', description: '현재 상태 유지' }
      ],
      multiSelect: false
    }]
  });

} else if (iterCount >= maxIterations) {
  // v1.4.0: Max iterations reached
  nextStep = 'manual';
  guidance = `⚠️ Gap Analysis 완료: ${matchRate}% 매치

최대 반복 횟수(${maxIterations})에 도달했습니다.
수동 검토가 필요합니다.

현재 상태:
- 반복 횟수: ${iterCount}/${maxIterations}
- 매치율: ${matchRate}%

권장 조치:
1. 수동으로 코드 검토 및 수정
2. 설계 문서 업데이트 검토
3. 의도적 차이 문서화`;

  userPrompt = emitUserPrompt({
    questions: [{
      question: `최대 반복 횟수 도달. 어떻게 진행할까요?`,
      header: 'Max Iterations',
      options: [
        { label: '수동 수정', description: '직접 코드 검토 후 수정' },
        { label: '현재 상태로 완료', description: '경고와 함께 보고서 생성' },
        { label: '설계 업데이트', description: '구현에 맞게 설계 수정' }
      ],
      multiSelect: false
    }]
  });

} else if (matchRate >= 70) {
  // 70-89%: 자동 개선 제안
  nextStep = 'pdca-iterate';
  guidance = `⚠️ Gap Analysis 완료: ${matchRate}% 매치

일부 차이가 있습니다.

선택 옵션:
1. 자동 개선 (권장): /pdca-iterate ${feature || ''}
2. 수동 수정: 직접 차이점 수정
3. 설계 업데이트: 구현에 맞게 설계 문서 수정

💡 ${threshold}% 이상 도달 시 완료 보고서 생성 가능
📊 반복 횟수: ${iterCount}/${maxIterations}`;

  userPrompt = emitUserPrompt({
    questions: [{
      question: `매치율 ${matchRate}%입니다. 자동 개선할까요?`,
      header: 'Auto-Fix',
      options: [
        { label: '자동 개선 (권장)', description: `/pdca-iterate 실행 (${iterCount + 1}/${maxIterations})` },
        { label: '수동 수정', description: '직접 코드 수정 후 재분석' },
        { label: '현재 상태로 완료', description: '경고와 함께 진행' }
      ],
      multiSelect: false
    }]
  });

} else {
  // 70% 미만: 강력한 개선 권장
  nextStep = 'pdca-iterate';
  guidance = `🔴 Gap Analysis 완료: ${matchRate}% 매치

설계-구현 차이가 큽니다.

권장 조치:
1. /pdca-iterate ${feature || ''} 실행하여 자동 개선 (강력 권장)
2. 또는 설계 문서를 현재 구현에 맞게 전면 업데이트

⚠️ Check-Act 반복이 필요합니다. ${threshold}% 이상 도달까지 반복하세요.
📊 반복 횟수: ${iterCount}/${maxIterations}`;

  userPrompt = emitUserPrompt({
    questions: [{
      question: `매치율 ${matchRate}%로 낮습니다. 자동 개선을 진행할까요?`,
      header: 'Low Match',
      options: [
        { label: '자동 개선 (강력 권장)', description: `/pdca-iterate 실행 (${iterCount + 1}/${maxIterations})` },
        { label: '설계 전면 업데이트', description: '구현에 맞게 설계 재작성' },
        { label: '수동 수정', description: '직접 코드 수정' }
      ],
      multiSelect: false
    }]
  });
}

// v1.4.0: Get auto phase advance suggestion
const phaseAdvance = autoAdvancePdcaPhase(feature, 'check', { matchRate });

// v1.4.4 FR-06/FR-07: Auto-create PDCA Tasks and Update Task Status
let autoCreatedTasks = [];
try {
  const { autoCreatePdcaTask } = require('../lib/common.js');

  // v1.4.4 FR-07: Update Check Task status
  if (feature) {
    updatePdcaTaskStatus('check', feature, {
      matchRate,
      status: matchRate >= threshold ? 'completed' : 'in_progress',
      fulfillment: fulfillmentResult
    });
    debugLog('Agent:gap-detector:Stop', 'Check Task status updated', {
      feature, matchRate, threshold
    });
  }

  // Auto-create [Check] Task
  const checkTask = autoCreatePdcaTask({
    phase: 'check',
    feature: feature || 'unknown',
    metadata: {
      matchRate,
      fulfillment: fulfillmentResult,
      analysisDoc: `docs/03-analysis/${feature}.analysis.md`
    }
  });
  if (checkTask) {
    autoCreatedTasks.push(checkTask);
    debugLog('Agent:gap-detector:Stop', 'Check Task auto-created', { taskId: checkTask.taskId });
  }

  // v1.4.4 FR-07: Auto-create [Report] Task if matchRate >= threshold
  if (matchRate >= threshold) {
    const reportTask = autoCreatePdcaTask({
      phase: 'report',
      feature: feature || 'unknown',
      metadata: {
        finalMatchRate: matchRate,
        completedAt: new Date().toISOString(),
        blockedBy: checkTask?.taskId
      }
    });
    if (reportTask) {
      autoCreatedTasks.push(reportTask);
      debugLog('Agent:gap-detector:Stop', 'Report Task auto-created', { taskId: reportTask.taskId });
    }
  }
  // Auto-create [Act] Task if matchRate < threshold
  else if (iterCount < maxIterations) {
    const actTask = autoCreatePdcaTask({
      phase: 'act',
      feature: feature || 'unknown',
      iteration: iterCount + 1,
      metadata: {
        matchRateBefore: matchRate,
        requiredMatchRate: threshold,
        blockedBy: checkTask?.taskId
      }
    });
    if (actTask) {
      autoCreatedTasks.push(actTask);
      debugLog('Agent:gap-detector:Stop', 'Act Task auto-created', { taskId: actTask.taskId });
    }
  }
} catch (e) {
  debugLog('Agent:gap-detector:Stop', 'Auto-task creation skipped', { error: e.message });
}

// v1.4.7 FR-04, FR-05, FR-06: Get autoTrigger for Check↔Act iteration
let autoTrigger = null;
try {
  const triggerResult = triggerNextPdcaAction(feature, 'check', {
    matchRate,
    iterationCount: iterCount,
    maxIterations,
    threshold
  });
  if (triggerResult) {
    autoTrigger = triggerResult.autoTrigger;
    debugLog('Agent:gap-detector:Stop', 'AutoTrigger generated', {
      nextAction: triggerResult.nextAction,
      autoTrigger
    });
  }
} catch (e) {
  debugLog('Agent:gap-detector:Stop', 'AutoTrigger generation failed', { error: e.message });
}

// Add Task System guidance for PDCA workflow (v1.3.1 - FR-04)
const taskGuidance = matchRate >= 90
  ? generateTaskGuidance('check', feature || 'feature', 'do')
  : generateTaskGuidance('act', feature || 'feature', 'check');

// Log completion
debugLog('Agent:gap-detector:Stop', 'Hook completed', {
  matchRate,
  feature: feature || 'unknown',
  nextStep,
  iterCount,
  phaseAdvance: phaseAdvance.nextPhase
});

// Claude Code: JSON output with AskUserQuestion prompt
const response = {
  decision: 'allow',
  hookEventName: 'Agent:gap-detector:Stop',
  analysisResult: {
    matchRate,
    feature: feature || 'unknown',
    iterationCount: iterCount,
    maxIterations,
    threshold,
    nextStep,
    phaseAdvance: phaseAdvance,
    // v1.4.4 FR-06: Auto-created tasks
    autoCreatedTasks: autoCreatedTasks.map(t => t.taskId)
  },
  guidance: guidance,
  taskGuidance: taskGuidance,
  // v1.4.0: Include user prompt for AskUserQuestion
  userPrompt: userPrompt,
  // v1.4.7 FR-04, FR-05, FR-06: Auto-trigger for Check↔Act iteration
  autoTrigger: autoTrigger,
  // v1.4.0: Stop hooks use systemMessage instead of additionalContext (not supported)
  systemMessage: `Gap Analysis 완료. 매치율: ${matchRate}%\n\n` +
    `## 🚨 MANDATORY: AskUserQuestion 호출\n\n` +
    `아래 AskUserQuestion 파라미터로 사용자에게 다음 단계를 질문하세요:\n\n` +
    `${userPrompt}\n\n` +
    `### 선택별 동작:\n` +
    (matchRate >= threshold
      ? `- **보고서 생성** → /pdca-report ${feature || ''} 실행\n- **추가 개선** → /pdca-iterate ${feature || ''} 실행\n- **나중에** → 현재 상태 유지`
      : `- **자동 개선** → /pdca-iterate ${feature || ''} 실행\n- **수동 수정** → 가이드 제공\n- **현재 상태로 완료** → 경고와 함께 /pdca-report 실행`)
};

console.log(JSON.stringify(response));
process.exit(0);
