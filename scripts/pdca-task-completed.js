#!/usr/bin/env node
/**
 * pdca-task-completed.js - TaskCompleted Hook Handler (v1.5.1)
 *
 * PDCA Task가 완료될 때 자동으로 다음 단계를 진행하는 hook.
 *
 * 동작:
 * 1. 완료된 Task의 subject에서 PDCA phase 감지 ([Plan], [Design], etc.)
 * 2. feature name 추출
 * 3. shouldAutoAdvance() 확인
 * 4. 자동 진행 시 다음 phase 안내 메시지 출력
 * 5. .bkit-memory.json 업데이트
 */

const {
  readStdinSync,
  debugLog,
  outputAllow,
  getPdcaStatusFull,
  autoAdvancePdcaPhase,
  shouldAutoAdvance,
  getAutomationLevel,
} = require('../lib/common.js');

// PDCA Phase 감지 패턴
const PDCA_TASK_PATTERNS = {
  plan:   /\[Plan\]\s+(.+)/,
  design: /\[Design\]\s+(.+)/,
  do:     /\[Do\]\s+(.+)/,
  check:  /\[Check\]\s+(.+)/,
  act:    /\[Act(?:-\d+)?\]\s+(.+)/,
  report: /\[Report\]\s+(.+)/,
};

function main() {
  debugLog('TaskCompleted', 'Hook started');

  let hookContext = {};
  try {
    const input = readStdinSync();
    hookContext = typeof input === 'string' ? JSON.parse(input) : input;
  } catch (e) {
    debugLog('TaskCompleted', 'Failed to parse context', { error: e.message });
    outputAllow('TaskCompleted processed.', 'TaskCompleted');
    return;
  }

  // Task subject에서 PDCA phase 감지
  const taskSubject = hookContext.task_subject
    || hookContext.tool_input?.subject
    || '';

  let detectedPhase = null;
  let featureName = null;

  for (const [phase, pattern] of Object.entries(PDCA_TASK_PATTERNS)) {
    const match = taskSubject.match(pattern);
    if (match) {
      detectedPhase = phase;
      featureName = match[1]?.trim();
      break;
    }
  }

  if (!detectedPhase || !featureName) {
    debugLog('TaskCompleted', 'Not a PDCA task', { subject: taskSubject });
    outputAllow('TaskCompleted processed.', 'TaskCompleted');
    return;
  }

  debugLog('TaskCompleted', 'PDCA task detected', {
    phase: detectedPhase,
    feature: featureName
  });

  // 자동 진행 확인
  const automationLevel = getAutomationLevel();
  if (shouldAutoAdvance(detectedPhase)) {
    const pdcaStatus = getPdcaStatusFull();
    const featureData = pdcaStatus?.features?.[featureName];
    const matchRate = featureData?.matchRate;

    const result = autoAdvancePdcaPhase(featureName, detectedPhase, { matchRate });

    if (result) {
      const response = {
        systemMessage: `PDCA auto-advance: ${detectedPhase} → ${result.phase}`,
        hookSpecificOutput: {
          hookEventName: "TaskCompleted",
          pdcaPhase: detectedPhase,
          nextPhase: result.phase,
          feature: featureName,
          autoAdvanced: true,
          additionalContext: `\n## PDCA Auto-Advance\n` +
            `Task [${detectedPhase.toUpperCase()}] ${featureName} completed.\n` +
            `Next phase: ${result.phase}\n` +
            (result.trigger ? `Suggested command: /pdca ${result.trigger.args}\n` : '')
        }
      };

      // Team Mode: generate team assignment for next phase
      let teamModule = null;
      try {
        teamModule = require('../lib/team');
      } catch (e) {
        // Graceful degradation
      }

      if (teamModule && teamModule.isTeamModeAvailable()) {
        const level = pdcaStatus?.features?.[featureName]?.level || 'Dynamic';
        const assignment = teamModule.assignNextTeammateWork(detectedPhase, featureName, level);
        if (assignment) {
          debugLog('TaskCompleted', 'Team assignment generated', {
            nextPhase: assignment.nextPhase,
            teammateCount: assignment.team?.teammates?.length || 0,
            needsRecompose: assignment.needsRecompose,
          });

          response.hookSpecificOutput.teamAssignment = {
            nextPhase: assignment.nextPhase,
            pattern: assignment.team?.pattern,
            teammates: assignment.team?.teammates?.map(t => t.name) || [],
            notice: assignment.notice,
          };
        }
      }

      // State writer: 진행률 업데이트 + 메시지 기록 (v1.5.3 Team Visibility)
      try {
        if (teamModule && teamModule.updateProgress) {
          const progress = teamModule.getTeamProgress(featureName, detectedPhase);
          teamModule.updateProgress(progress);

          // Phase transition 시 메시지 기록
          if (response.hookSpecificOutput.autoAdvanced) {
            teamModule.addRecentMessage({
              from: 'system',
              to: 'all',
              content: `Phase ${detectedPhase} → ${response.hookSpecificOutput.nextPhase} (auto-advanced)`,
            });
          }
        }
      } catch (e) {
        debugLog('TaskCompleted', 'State write failed (non-fatal)', { error: e.message });
      }

      console.log(JSON.stringify(response));
      process.exit(0);
    }
  }

  outputAllow(`PDCA Task [${detectedPhase}] ${featureName} completed.`, 'TaskCompleted');
}

main();
