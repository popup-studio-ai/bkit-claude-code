#!/usr/bin/env node
/**
 * team-idle-handler.js - TeammateIdle Hook Handler (v1.5.1)
 *
 * When a teammate becomes idle:
 * 1. Check current PDCA status
 * 2. If pending tasks exist, guide to next task
 * 3. If all tasks complete, guide to team cleanup
 */

const { readStdinSync, outputAllow } = require('../lib/core/io');
const { debugLog } = require('../lib/core/debug');
const { getPdcaStatusFull } = require('../lib/pdca/status');

let teamModule = null;
try {
  teamModule = require('../lib/team');
} catch (e) {
  // Team module not available - graceful degradation
}

function main() {
  debugLog('TeammateIdle', 'Hook started');

  // Ignore if not in Team Mode
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

  // v1.5.9: ENH-74 explicit agent_id/agent_type extraction
  const agentId = hookContext.agent_id || teammateId;
  const agentType = hookContext.agent_type || 'unknown';

  const pdcaStatus = getPdcaStatusFull();

  debugLog('TeammateIdle', 'Teammate became idle', {
    teammateId,
    primaryFeature: pdcaStatus?.primaryFeature
  });

  // Use handleTeammateIdle for task-queue integration
  const idleResult = teamModule.handleTeammateIdle(teammateId, pdcaStatus);

  // State writer: record idle status (v1.5.3 Team Visibility)
  try {
    if (teamModule.updateTeammateStatus) {
      teamModule.updateTeammateStatus(teammateId, 'idle', null);
    }
  } catch (e) {
    debugLog('TeammateIdle', 'State write failed (non-fatal)', { error: e.message });
  }

  const response = {
    systemMessage: `Teammate ${teammateId} is idle`,
    // v1.5.9: ENH-75 stop teammate when no next task available
    continue: idleResult?.nextTask ? undefined : false,
    hookSpecificOutput: {
      hookEventName: "TeammateIdle",
      teammateId: teammateId,
      agentId,
      agentType,
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
