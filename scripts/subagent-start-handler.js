#!/usr/bin/env node
/**
 * subagent-start-handler.js - SubagentStart Hook Handler (v1.5.3)
 *
 * Subagent가 spawn될 때:
 * 1. Call initAgentState() if agent-state.json doesn't exist
 * 2. Register new teammate via addTeammate()
 * 3. status: "spawning"
 *
 * Design Reference: docs/02-design/features/team-visibility.design.md Section 5.1
 */

const { readStdinSync, outputAllow } = require('../lib/core/io');
const { debugLog } = require('../lib/core/debug');
const { getPdcaStatusFull } = require('../lib/pdca/status');

function main() {
  debugLog('SubagentStart', 'Hook started');

  let hookContext = {};
  try {
    const input = readStdinSync();
    hookContext = typeof input === 'string' ? JSON.parse(input) : input;
  } catch (e) {
    debugLog('SubagentStart', 'Failed to parse context', { error: e.message });
    outputAllow('SubagentStart processed.', 'SubagentStart');
    return;
  }

  // State writer lazy load (from team module)
  let stateWriter = null;
  try {
    const teamModule = require('../lib/team');
    stateWriter = {
      initAgentState: teamModule.initAgentState,
      addTeammate: teamModule.addTeammate,
      readAgentState: teamModule.readAgentState,
    };
  } catch (e) {
    debugLog('SubagentStart', 'State writer not available', { error: e.message });
    outputAllow('SubagentStart processed.', 'SubagentStart');
    return;
  }

  // Extract agent info from hook context
  // v1.5.9: ENH-74 agent_id as first-class field
  const agentId = hookContext.agent_id || null;
  const agentName = hookContext.agent_name || agentId || hookContext.tool_input?.name || 'unknown';
  const agentType = hookContext.agent_type
    || hookContext.tool_input?.subagent_type
    || 'agent';
  const teamName = hookContext.team_name
    || hookContext.tool_input?.team_name
    || '';
  const sessionId = hookContext.session_id || '';

  // Model mapping: extract from subagent_type or model field
  const modelRaw = hookContext.model
    || hookContext.tool_input?.model
    || 'sonnet';
  const model = ['opus', 'sonnet', 'haiku'].includes(modelRaw)
    ? modelRaw
    : 'sonnet';

  // Initialize if agent-state.json doesn't exist
  const existingState = stateWriter.readAgentState();
  if (!existingState || !existingState.enabled) {
    const pdcaStatus = getPdcaStatusFull();
    const feature = pdcaStatus?.primaryFeature || '';
    const featureData = pdcaStatus?.features?.[feature];

    stateWriter.initAgentState(teamName, feature, {
      pdcaPhase: featureData?.phase || 'plan',
      orchestrationPattern: 'leader',
      ctoAgent: 'opus',
      sessionId,
    });
  }

  // Add teammate
  try {
    stateWriter.addTeammate({
      name: agentName,
      role: agentType,
      model: model,
      currentTask: hookContext.tool_input?.prompt
        ? hookContext.tool_input.prompt.substring(0, 100)
        : null,
    });
  } catch (e) {
    debugLog('SubagentStart', 'Failed to add teammate (non-fatal)', {
      error: e.message,
    });
  }

  const response = {
    systemMessage: `Subagent ${agentName} spawned`,
    hookSpecificOutput: {
      hookEventName: "SubagentStart",
      agentId,
      agentName,
      agentType,
      teamName,
    }
  };

  console.log(JSON.stringify(response));
  process.exit(0);
}

main();
