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

  const teammateId = hookContext.teammate_id || hookContext.agent_id || 'unknown';
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

  const response = {
    systemMessage: `Teammate ${teammateId} is idle`,
    hookSpecificOutput: {
      hookEventName: "TeammateIdle",
      teammateId: teammateId,
      nextTask: idleResult?.nextTask || null,
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
