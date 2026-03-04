#!/usr/bin/env node
/**
 * subagent-start-handler.js - SubagentStart Hook Handler (v1.5.3)
 *
 * Subagent가 spawn될 때:
 * 1. agent-state.json이 없으면 initAgentState() 호출
 * 2. addTeammate()로 새 팀원 등록
 * 3. status: "spawning"
 *
 * Design Reference: docs/02-design/features/team-visibility.design.md Section 5.1
 */

const {
  readStdinSync,
  debugLog,
  outputAllow,
  getPdcaStatusFull,
} = require('../lib/common.js');

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

  // State writer는 lazy load (team module에서)
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

  // Hook context에서 agent 정보 추출
  const agentName = hookContext.agent_name
    || hookContext.agent_id
    || hookContext.tool_input?.name
    || 'unknown';
  const agentType = hookContext.agent_type
    || hookContext.tool_input?.subagent_type
    || 'agent';
  const teamName = hookContext.team_name
    || hookContext.tool_input?.team_name
    || '';
  const sessionId = hookContext.session_id || '';

  // 모델 매핑: subagent_type 또는 model 필드에서 추출
  const modelRaw = hookContext.model
    || hookContext.tool_input?.model
    || 'sonnet';
  const model = ['opus', 'sonnet', 'haiku'].includes(modelRaw)
    ? modelRaw
    : 'sonnet';

  // agent-state.json이 없으면 초기화
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

  // 팀원 추가
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
      agentName,
      agentType,
      teamName,
    }
  };

  console.log(JSON.stringify(response));
  process.exit(0);
}

main();
