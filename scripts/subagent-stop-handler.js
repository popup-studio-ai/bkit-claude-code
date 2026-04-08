#!/usr/bin/env node
/**
 * subagent-stop-handler.js - SubagentStop Hook Handler (v1.5.3)
 *
 * When a subagent terminates:
 * 1. updateTeammateStatus(name, "completed"|"failed")
 * 2. Call updateProgress()
 * 3. Check session end when all teammates complete
 *
 * Design Reference: docs/02-design/features/team-visibility.design.md Section 5.2
 */

const { readStdinSync, outputAllow } = require('../lib/core/io');
const { debugLog } = require('../lib/core/debug');

function main() {
  debugLog('SubagentStop', 'Hook started');

  let hookContext = {};
  try {
    const input = readStdinSync();
    hookContext = typeof input === 'string' ? JSON.parse(input) : input;
  } catch (e) {
    debugLog('SubagentStop', 'Failed to parse context', { error: e.message });
    outputAllow('SubagentStop processed.', 'SubagentStop');
    return;
  }

  let teamModule = null;
  try {
    teamModule = require('../lib/team');
  } catch (e) {
    outputAllow('SubagentStop processed.', 'SubagentStop');
    return;
  }

  // v1.5.9: ENH-74 agent_id/agent_type extraction
  const agentId = hookContext.agent_id || null;
  const agentType = hookContext.agent_type || 'unknown';
  const agentName = hookContext.agent_name || agentId || 'unknown';

  // Determine exit status (transcript_path exists = normal exit)
  const isSuccess = hookContext.transcript_path != null
    || hookContext.exit_code === 0
    || hookContext.exit_code === undefined;
  const status = isSuccess ? 'completed' : 'failed';

  // Update status
  try {
    teamModule.updateTeammateStatus(agentName, status, null);
  } catch (e) {
    debugLog('SubagentStop', 'Status update failed (non-fatal)', { error: e.message });
  }

  // Update progress
  try {
    const state = teamModule.readAgentState();
    if (state && state.feature) {
      const progress = teamModule.getTeamProgress(state.feature, state.pdcaPhase);
      teamModule.updateProgress(progress);
    }
  } catch (e) {
    debugLog('SubagentStop', 'Progress update failed (non-fatal)', { error: e.message });
  }

  const response = {
    systemMessage: `Subagent ${agentName} stopped (${status})`,
    hookSpecificOutput: {
      hookEventName: "SubagentStop",
      agentId,
      agentName,
      agentType,
      status,
    }
  };

  console.log(JSON.stringify(response));
  process.exit(0);
}

main();
