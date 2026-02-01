#!/usr/bin/env node
/**
 * iterator-stop.js - Guide next iteration or completion after pdca-iterator (v1.4.0)
 *
 * Purpose: Detect completion status and provide next step guidance
 * Hook: Stop for pdca-iterator agent
 * Core component of Check-Act iteration loop
 *
 * v1.4.0 Changes:
 * - Added debug logging for hook verification
 * - Added PDCA status update with iteration count
 * - Added dynamic feature extraction
 *
 * Converted from: scripts/iterator-stop.sh
 */

const {
  readStdinSync,
  outputAllow,
  generateTaskGuidance,
  debugLog,
  updatePdcaStatus,
  extractFeatureFromContext,
  getPdcaStatusFull,
  getFeatureStatus,
  completePdcaFeature,
  // v1.4.0 Automation Functions
  emitUserPrompt,
  getBkitConfig,
  autoAdvancePdcaPhase,
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
debugLog('Agent:pdca-iterator:Stop', 'Hook started');

// Read conversation context from stdin
const input = readStdinSync();
const inputText = typeof input === 'string' ? input : JSON.stringify(input);

debugLog('Agent:pdca-iterator:Stop', 'Input received', {
  inputLength: inputText.length,
  inputPreview: inputText.substring(0, 200)
});

// Extract feature name from multiple sources
const currentStatus = getPdcaStatusFull();
const feature = extractFeatureFromContext({
  agentOutput: inputText,
  currentStatus
});

// Get current iteration count
const featureStatus = feature ? getFeatureStatus(feature) : null;
const currentIteration = (featureStatus?.iterationCount || 0) + 1;

// Try to extract match rate from output (if re-analyzed)
const matchRatePattern = /(Overall|Match Rate|매치율|일치율|Design Match)[^0-9]*(\d+)/i;
const matchMatch = inputText.match(matchRatePattern);
const matchRate = matchMatch ? parseInt(matchMatch[2], 10) : (featureStatus?.matchRate || 0);

debugLog('Agent:pdca-iterator:Stop', 'Data extracted', {
  feature: feature || 'unknown',
  iteration: currentIteration,
  matchRate
});

// v1.4.0: Get configuration
const config = getBkitConfig();
const threshold = config.pdca?.matchRateThreshold || 90;
const maxIterations = config.pdca?.maxIterations || 5;

// Patterns for detection
const completionPattern = /(완료|Complete|Completed|>= 90%|매치율.*9[0-9]%|Match Rate.*9[0-9]%|passed|성공|Successfully)/i;
const maxIterationPattern = /(max.*iteration|최대.*반복|5\/5|limit reached)/i;
const improvedPattern = /(improved|개선|수정.*완료|fixed|changes.*made|파일.*수정)/i;
const changesPattern = /(\d+)\s*(files?|파일)/i;

// Extract number of changed files
const changesMatch = inputText.match(changesPattern);
const changedFiles = changesMatch ? parseInt(changesMatch[1], 10) : 0;

let guidance = '';
let status = 'in_progress';
let userPrompt = null;

// Check if completed successfully
if (completionPattern.test(inputText) || matchRate >= threshold) {
  status = 'completed';
  guidance = `✅ pdca-iterator 완료!

설계-구현 일치도가 목표(${threshold}%)에 도달했습니다.

다음 단계:
1. /pdca-report ${feature || ''} 로 완료 보고서 생성
2. 변경사항 리뷰 후 커밋
3. Archive 진행 (선택)

🎉 Check-Act 반복 성공! (${currentIteration}회 반복)`;

  // Mark feature as completed if match rate >= threshold
  if (feature && matchRate >= threshold) {
    completePdcaFeature(feature);
  }

  // v1.4.0: Generate completion prompt
  userPrompt = emitUserPrompt({
    questions: [{
      question: `개선 완료! (${matchRate}%) 보고서를 생성할까요?`,
      header: 'Completed',
      options: [
        { label: '보고서 생성 (권장)', description: `/pdca-report ${feature || ''} 실행` },
        { label: '추가 검토', description: '코드 리뷰 후 커밋' },
        { label: 'Archive', description: '문서 보관 처리' }
      ],
      multiSelect: false
    }]
  });

} else if (maxIterationPattern.test(inputText) || currentIteration >= maxIterations) {
  status = 'max_iterations';
  // Max iterations reached
  guidance = `⚠️ pdca-iterator: 최대 반복 횟수 도달 (${currentIteration}/${maxIterations}회)

자동 개선이 반복되었지만 목표에 도달하지 못했습니다.
현재 매치율: ${matchRate}%

권장 조치:
1. 수동으로 남은 차이점 수정
2. 또는 설계 문서를 현재 구현에 맞게 업데이트
3. /pdca-analyze ${feature || ''} 로 현재 상태 재확인

💡 복잡한 차이는 수동 개입이 필요할 수 있습니다.`;

  // v1.4.0: Generate max iterations prompt
  userPrompt = emitUserPrompt({
    questions: [{
      question: `최대 반복 횟수 도달 (${matchRate}%). 어떻게 진행할까요?`,
      header: 'Max Iterations',
      options: [
        { label: '수동 수정', description: '직접 코드 수정 후 재분석' },
        { label: '현재 상태로 완료', description: '경고와 함께 보고서 생성' },
        { label: '설계 업데이트', description: '구현에 맞게 설계 수정' }
      ],
      multiSelect: false
    }]
  });

} else if (improvedPattern.test(inputText) || changedFiles > 0) {
  status = 'improved';
  // Improvement made but not complete
  guidance = `✅ 개선 완료: ${changedFiles > 0 ? `${changedFiles}개 파일 수정됨` : '수정 적용됨'}

반복 횟수: ${currentIteration}/${maxIterations}
현재 매치율: ${matchRate}%

다음 단계:
1. /pdca-analyze ${feature || ''} 로 재분석 실행
2. 매치율 확인 후 필요시 반복

💡 ${threshold}% 이상 도달까지 Check-Act를 반복하세요.`;

  // v1.4.0: Generate re-analyze prompt
  userPrompt = emitUserPrompt({
    questions: [{
      question: `${changedFiles > 0 ? `${changedFiles}개 파일 수정됨.` : '개선 완료.'} 재분석을 진행할까요?`,
      header: 'Re-Analyze',
      options: [
        { label: '재분석 (권장)', description: `/pdca-analyze ${feature || ''} 실행` },
        { label: '추가 수정', description: '계속 수정 후 재분석' },
        { label: '완료', description: '현재 상태로 완료' }
      ],
      multiSelect: false
    }]
  });

} else {
  status = 'unknown';
  // Default: suggest re-evaluation
  guidance = `🔄 pdca-iterator 작업 완료 (${currentIteration}회차)

수정 작업이 완료되었습니다.
현재 매치율: ${matchRate}%

다음 단계:
1. /pdca-analyze ${feature || ''} 로 재평가하여 매치율 확인
2. ${threshold}% 미만이면 /pdca-iterate 재실행
3. ${threshold}% 이상이면 /pdca-report 로 완료 보고서 생성`;

  // v1.4.0: Generate default prompt
  userPrompt = emitUserPrompt({
    questions: [{
      question: '수정 작업이 완료되었습니다. 다음 단계를 선택하세요.',
      header: 'Next Step',
      options: [
        { label: '재분석 (권장)', description: `/pdca-analyze ${feature || ''} 실행` },
        { label: '추가 반복', description: `/pdca-iterate ${feature || ''} 실행` },
        { label: '완료 처리', description: `/pdca-report ${feature || ''} 실행` }
      ],
      multiSelect: false
    }]
  });
}

// v1.4.0: Get auto phase advance suggestion
const phaseAdvance = autoAdvancePdcaPhase(feature, 'act', { matchRate });

// v1.4.4 FR-06/FR-07: Auto-create PDCA Tasks and trigger re-analyze
let autoCreatedTasks = [];
let autoTrigger = null;

try {
  const { autoCreatePdcaTask } = require('../lib/common.js');

  // v1.4.4 FR-07: Update Act Task status
  if (feature) {
    updatePdcaTaskStatus('act', feature, {
      iteration: currentIteration,
      matchRate,
      status: status === 'completed' ? 'completed' : 'in_progress',
      changedFiles
    });
    debugLog('Agent:pdca-iterator:Stop', 'Act Task status updated', {
      feature, iteration: currentIteration, status
    });
  }

  // Auto-create [Act-N] Task for current iteration
  const actTask = autoCreatePdcaTask({
    phase: 'act',
    feature: feature || 'unknown',
    iteration: currentIteration,
    metadata: {
      matchRateBefore: featureStatus?.matchRate || 0,
      matchRateAfter: matchRate,
      changedFiles,
      status
    }
  });
  if (actTask) {
    autoCreatedTasks.push(actTask);
    debugLog('Agent:pdca-iterator:Stop', 'Act Task auto-created', { taskId: actTask.taskId });
  }

  // Auto-create [Report] Task if completed
  if (status === 'completed' && matchRate >= threshold) {
    const reportTask = autoCreatePdcaTask({
      phase: 'report',
      feature: feature || 'unknown',
      metadata: {
        finalMatchRate: matchRate,
        totalIterations: currentIteration,
        blockedBy: actTask?.taskId
      }
    });
    if (reportTask) {
      autoCreatedTasks.push(reportTask);
      debugLog('Agent:pdca-iterator:Stop', 'Report Task auto-created', { taskId: reportTask.taskId });
    }
  }

  // v1.4.7 FR-04, FR-05, FR-06: Use triggerNextPdcaAction for Check↔Act iteration
  if (status === 'improved' || status === 'completed') {
    const triggerResult = triggerNextPdcaAction(feature, 'act', {
      matchRate,
      iterationCount: currentIteration,
      maxIterations,
      threshold
    });
    if (triggerResult && triggerResult.autoTrigger) {
      autoTrigger = triggerResult.autoTrigger;
      debugLog('Agent:pdca-iterator:Stop', 'Auto-trigger generated', {
        nextAction: triggerResult.nextAction,
        autoTrigger
      });
    }
  }
} catch (e) {
  debugLog('Agent:pdca-iterator:Stop', 'Auto-task creation skipped', { error: e.message });
}

// Update PDCA status
if (feature) {
  updatePdcaStatus(feature, 'act', {
    iterationCount: currentIteration,
    matchRate,
    lastIterationStatus: status
  });
}

// Add Task System guidance for PDCA workflow (v1.3.1 - FR-05)
const isComplete = status === 'completed';
const taskGuidance = isComplete
  ? `Task: Mark current [Act] task as completed. Proceed to /pdca-report ${feature || ''}.`
  : generateTaskGuidance('act', feature || 'feature', 'check');

// Log completion
debugLog('Agent:pdca-iterator:Stop', 'Hook completed', {
  feature: feature || 'unknown',
  iteration: currentIteration,
  matchRate,
  status,
  changedFiles,
  phaseAdvance: phaseAdvance.nextPhase
});

// Claude Code: JSON output with AskUserQuestion prompt
const response = {
  decision: 'allow',
  hookEventName: 'Agent:pdca-iterator:Stop',
  iterationResult: {
    feature: feature || 'unknown',
    iteration: currentIteration,
    maxIterations,
    matchRate,
    threshold,
    status,
    changedFiles,
    phaseAdvance: phaseAdvance,
    // v1.4.4 FR-06: Auto-trigger flags
    autoCreatedTasks: autoCreatedTasks.map(t => t.taskId),
    autoTrigger
  },
  guidance: guidance,
  taskGuidance: taskGuidance,
  // v1.4.0: Include user prompt for AskUserQuestion
  userPrompt: userPrompt,
  // v1.4.0: Stop hooks use systemMessage instead of additionalContext (not supported)
  systemMessage: `Iterator 완료. 반복: ${currentIteration}/${maxIterations}, 매치율: ${matchRate}%\n\n` +
    `## 🚨 MANDATORY: AskUserQuestion 호출\n\n` +
    `아래 AskUserQuestion 파라미터로 사용자에게 다음 단계를 질문하세요:\n\n` +
    `${userPrompt}\n\n` +
    `### 선택별 동작:\n` +
    (status === 'completed'
      ? `- **보고서 생성** → /pdca-report ${feature || ''} 실행\n- **추가 검토** → 코드 리뷰 진행\n- **Archive** → /archive 실행`
      : status === 'improved'
        ? `- **재분석** → /pdca-analyze ${feature || ''} 실행\n- **추가 수정** → 가이드 제공\n- **완료** → /pdca-report 실행`
        : `- **재분석** → /pdca-analyze ${feature || ''} 실행\n- **추가 반복** → /pdca-iterate ${feature || ''} 실행\n- **완료 처리** → /pdca-report 실행`)
};

console.log(JSON.stringify(response));
process.exit(0);
