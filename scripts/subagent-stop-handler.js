#!/usr/bin/env node
/**
 * subagent-stop-handler.js - SubagentStop Hook Handler (v1.5.3)
 *
 * Subagent가 종료될 때:
 * 1. updateTeammateStatus(name, "completed"|"failed")
 * 2. updateProgress() 호출
 * 3. 모든 팀원 완료 시 세션 종료 여부 확인
 *
 * Design Reference: docs/02-design/features/team-visibility.design.md Section 5.2
 */

const {
  readStdinSync,
  debugLog,
  outputAllow,
} = require('../lib/common.js');

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

  // v1.5.9: agent_id priority (CC v2.1.64+ official field), fallback chain preserved
  const agentId = hookContext.agent_id || null;
  const agentType = hookContext.agent_type || null;
  const agentName = agentId
    || hookContext.agent_name
    || 'unknown';

  // 종료 상태 결정 (transcript_path 존재 = 정상 종료)
  const isSuccess = hookContext.transcript_path != null
    || hookContext.exit_code === 0
    || hookContext.exit_code === undefined;
  const status = isSuccess ? 'completed' : 'failed';

  // 상태 업데이트
  try {
    teamModule.updateTeammateStatus(agentName, status, null);
  } catch (e) {
    debugLog('SubagentStop', 'Status update failed (non-fatal)', { error: e.message });
  }

  // 진행률 업데이트
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
      agentName,
      agentType,    // v1.5.9: CC v2.1.64+
      status,
      agentId,      // v1.5.9: CC v2.1.64+
    }
  };

  console.log(JSON.stringify(response));
  process.exit(0);
}

main();
