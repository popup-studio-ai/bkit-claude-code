#!/usr/bin/env node
/**
 * team-idle-handler.js - TeammateIdle Hook Handler (v1.5.1)
 *
 * Teammate가 idle 상태가 되면:
 * 1. 현재 PDCA 상태 확인
 * 2. 미완료 Task가 있으면 다음 Task 안내
 * 3. 모든 Task 완료 시 Team cleanup 안내
 */

const {
  readStdinSync,
  debugLog,
  outputAllow,
  getPdcaStatusFull,
} = require('../lib/common.js');

let teamModule = null;
try {
  teamModule = require('../lib/team');
} catch (e) {
  // Team module not available - graceful degradation
}

function main() {
  debugLog('TeammateIdle', 'Hook started');

  // Team Mode가 아니면 무시
  if (!teamModule || !teamModule.isTeamModeAvailable()) {
    outputAllow('TeammateIdle processed (no team mode).', 'TeammateIdle');
    return;
  }

  let hookContext = {};
  try {
    const input = readStdinSync();
    hookContext = typeof input === 'string' ? JSON.parse(input) : input;
  } catch (e) {
    debugLog('TeammateIdle', 'Failed to parse context', { error: e.message });
    outputAllow('TeammateIdle processed.', 'TeammateIdle');
    return;
  }

  // v1.5.9: agent_id priority (CC v2.1.64+), teammate_id fallback
  const agentId = hookContext.agent_id || null;
  const agentType = hookContext.agent_type || null;
  const teammateId = agentId || hookContext.teammate_id || 'unknown';
  const pdcaStatus = getPdcaStatusFull();

  debugLog('TeammateIdle', 'Teammate became idle', {
    teammateId,
    primaryFeature: pdcaStatus?.primaryFeature
  });

  // Use handleTeammateIdle for task-queue integration
  const idleResult = teamModule.handleTeammateIdle(teammateId, pdcaStatus);

  // State writer: idle 상태 기록 (v1.5.3 Team Visibility)
  try {
    if (teamModule.updateTeammateStatus) {
      teamModule.updateTeammateStatus(teammateId, 'idle', null);
    }
  } catch (e) {
    debugLog('TeammateIdle', 'State write failed (non-fatal)', { error: e.message });
  }

  // v1.5.9: continue:false — auto-terminate teammate when work is done (ENH-63)
  // Only effective on CC v2.1.64+. Ignored on earlier versions.
  let shouldContinue = true;

  try {
    if (pdcaStatus) {
      const primaryFeature = pdcaStatus.primaryFeature;
      const featureData = primaryFeature ? pdcaStatus.features?.[primaryFeature] : null;

      // Condition 1: primary feature completed/archived
      if (featureData && (featureData.phase === 'completed' || featureData.phase === 'archived')) {
        shouldContinue = false;
        debugLog('TeammateIdle', 'Feature completed, setting continue:false', { feature: primaryFeature });
      }

      // Condition 2: all active features completed/archived and no next task
      if (shouldContinue && !idleResult?.nextTask) {
        const allCompleted = pdcaStatus.activeFeatures?.every(f => {
          const fd = pdcaStatus.features?.[f];
          return fd && (fd.phase === 'completed' || fd.phase === 'archived');
        });
        if (allCompleted && pdcaStatus.activeFeatures?.length > 0) {
          shouldContinue = false;
          debugLog('TeammateIdle', 'All features completed, setting continue:false');
        }
      }
    }
  } catch (e) {
    shouldContinue = true; // Safety: do not terminate on check failure
    debugLog('TeammateIdle', 'continue check failed, keeping true', { error: e.message });
  }

  const response = {
    systemMessage: `Teammate ${teammateId} is idle`,
    hookSpecificOutput: {
      hookEventName: "TeammateIdle",
      teammateId,
      agentId,          // v1.5.9: CC v2.1.64+
      agentType,        // v1.5.9: CC v2.1.64+
      nextTask: idleResult?.nextTask || null,
      continue: shouldContinue,  // v1.5.9: ENH-63
      additionalContext: idleResult?.nextTask
        ? `\n## Teammate Work Assignment\n` +
          `Assigned: ${idleResult.nextTask.subject}\n` +
          `Feature: ${idleResult.feature}\n` +
          `Phase: ${idleResult.currentPhase}\n`
        : `\n## Teammate Idle\n` +
          `No pending tasks for ${teammateId}.\n` +
          `Waiting for phase transition.\n`
    }
  };

  console.log(JSON.stringify(response));
  process.exit(0);
}

main();
