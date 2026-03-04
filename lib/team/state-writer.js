/**
 * Team State Writer Module
 * @module lib/team/state-writer
 * @version 1.5.8
 *
 * bkit Studio와 공유하기 위한 팀 상태 디스크 영속화 모듈.
 * .bkit/runtime/agent-state.json에 팀 런타임 상태를 원자적으로 기록.
 *
 * Design Reference: docs/02-design/features/team-visibility.design.md Section 4
 */

const fs = require('fs');
const path = require('path');

// Lazy require to avoid circular dependency
let _core = null;
function getCore() {
  if (!_core) { _core = require('../core'); }
  return _core;
}

// ============================================================
// Constants
// ============================================================

const MAX_TEAMMATES = 10;
const MAX_MESSAGES = 50;

// ============================================================
// Default State Factory
// ============================================================

/**
 * Create default agent state object
 * @returns {Object} AgentState with default values
 */
function createDefaultAgentState() {
  const now = new Date().toISOString();
  return {
    version: '1.0',
    enabled: false,
    teamName: '',
    feature: '',
    pdcaPhase: 'plan',
    orchestrationPattern: 'leader',
    ctoAgent: 'opus',
    startedAt: now,
    lastUpdated: now,
    teammates: [],
    progress: {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      failedTasks: 0,
      pendingTasks: 0,
    },
    recentMessages: [],
    sessionId: '',
  };
}

// ============================================================
// File I/O
// ============================================================

/**
 * agent-state.json 파일 경로 반환
 * @returns {string} 절대 경로
 */
function getAgentStatePath() {
  const { STATE_PATHS } = require('../core/paths');
  return STATE_PATHS.agentState();
}

/**
 * 디스크에서 현재 agent state 읽기
 * @returns {Object|null} AgentState 객체 또는 null (파일 미존재 시)
 */
function readAgentState() {
  const { debugLog } = getCore();
  const statePath = getAgentStatePath();
  try {
    if (!fs.existsSync(statePath)) return null;
    const content = fs.readFileSync(statePath, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    debugLog('StateWriter', 'Failed to read agent state', { error: e.message });
    return null;
  }
}

/**
 * agent state를 디스크에 원자적으로 기록
 * @param {Object} state - AgentState 객체
 * @private
 */
function writeAgentState(state) {
  const { debugLog } = getCore();
  const statePath = getAgentStatePath();
  const stateDir = path.dirname(statePath);
  const tmpPath = statePath + '.tmp';

  try {
    // 디렉토리 확인/생성
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }

    // 타임스탬프 업데이트
    state.lastUpdated = new Date().toISOString();

    // 원자적 쓰기: tmp 파일 작성 후 rename
    fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2));
    fs.renameSync(tmpPath, statePath);

    debugLog('StateWriter', 'Agent state written', {
      enabled: state.enabled,
      teammateCount: state.teammates.length,
    });
  } catch (e) {
    debugLog('StateWriter', 'Failed to write agent state (non-fatal)', {
      error: e.message,
    });
    // tmp 파일 정리 시도
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch (_) { /* ignore */ }
  }
}

// ============================================================
// Public API
// ============================================================

/**
 * 팀 세션 시작 시 초기 agent state 생성
 * @param {string} teamName - 팀 이름
 * @param {string} feature - PDCA feature 이름
 * @param {Object} [options] - 추가 옵션
 * @param {string} [options.pdcaPhase] - 현재 PDCA 단계 (기본: "plan")
 * @param {string} [options.orchestrationPattern] - 오케스트레이션 패턴 (기본: "leader")
 * @param {string} [options.ctoAgent] - CTO 에이전트 모델 (기본: "opus")
 * @param {string} [options.sessionId] - Claude Code 세션 ID
 */
function initAgentState(teamName, feature, options = {}) {
  const { debugLog } = getCore();
  const state = createDefaultAgentState();

  state.enabled = true;
  state.teamName = teamName || '';
  state.feature = feature || '';
  state.pdcaPhase = options.pdcaPhase || 'plan';
  state.orchestrationPattern = options.orchestrationPattern || 'leader';
  state.ctoAgent = options.ctoAgent || 'opus';
  state.sessionId = options.sessionId || '';
  state.startedAt = new Date().toISOString();

  writeAgentState(state);

  debugLog('StateWriter', 'Agent state initialized', {
    teamName,
    feature,
    pdcaPhase: state.pdcaPhase,
  });
}

/**
 * 팀원 추가 (roster에 append)
 * @param {Object} teammateInfo
 * @param {string} teammateInfo.name - 팀원 이름/ID
 * @param {string} [teammateInfo.role] - 역할 (기본: "agent")
 * @param {string} [teammateInfo.model] - 모델 (기본: "sonnet")
 * @param {string} [teammateInfo.currentTask] - 현재 태스크
 * @param {string} [teammateInfo.taskId] - 태스크 ID
 */
function addTeammate(teammateInfo) {
  const { debugLog } = getCore();
  const state = readAgentState();
  if (!state) {
    debugLog('StateWriter', 'Cannot add teammate - no agent state file');
    return;
  }

  // 중복 방지: 같은 이름이면 업데이트
  const existingIdx = state.teammates.findIndex(t => t.name === teammateInfo.name);
  const now = new Date().toISOString();

  const teammate = {
    name: teammateInfo.name,
    role: teammateInfo.role || 'agent',
    model: teammateInfo.model || 'sonnet',
    status: 'spawning',
    currentTask: teammateInfo.currentTask || null,
    taskId: teammateInfo.taskId || null,
    startedAt: now,
    lastActivityAt: now,
  };

  if (existingIdx >= 0) {
    // 기존 팀원 정보 업데이트 (startedAt 유지)
    teammate.startedAt = state.teammates[existingIdx].startedAt;
    state.teammates[existingIdx] = teammate;
  } else {
    // 최대 10명 제한
    if (state.teammates.length >= MAX_TEAMMATES) {
      debugLog('StateWriter', 'Max teammates (10) reached, skipping add');
      return;
    }
    state.teammates.push(teammate);
  }

  writeAgentState(state);
}

/**
 * 팀원 상태 업데이트
 * @param {string} name - 팀원 이름
 * @param {string} status - 새 상태 ("spawning"|"working"|"idle"|"completed"|"failed")
 * @param {Object|null} [taskInfo] - 태스크 정보
 * @param {string} [taskInfo.task] - 태스크 제목
 * @param {string} [taskInfo.taskId] - 태스크 ID
 */
function updateTeammateStatus(name, status, taskInfo) {
  const { debugLog } = getCore();
  const state = readAgentState();
  if (!state) return;

  const teammate = state.teammates.find(t => t.name === name);
  if (!teammate) {
    debugLog('StateWriter', 'Teammate not found for status update', { name });
    return;
  }

  teammate.status = status;
  teammate.lastActivityAt = new Date().toISOString();

  if (taskInfo) {
    teammate.currentTask = taskInfo.task || null;
    teammate.taskId = taskInfo.taskId || null;
  } else if (status === 'idle' || status === 'completed') {
    teammate.currentTask = null;
    teammate.taskId = null;
  }

  writeAgentState(state);
}

/**
 * 팀원 제거 (SubagentStop 시)
 * @param {string} name - 팀원 이름
 */
function removeTeammate(name) {
  const { debugLog } = getCore();
  const state = readAgentState();
  if (!state) return;

  const beforeCount = state.teammates.length;
  state.teammates = state.teammates.filter(t => t.name !== name);

  if (state.teammates.length < beforeCount) {
    writeAgentState(state);
    debugLog('StateWriter', 'Teammate removed', { name });
  }
}

/**
 * 작업 진행률 업데이트
 * @param {Object} progressData - getTeamProgress() 반환값과 동일한 형식
 * @param {number} progressData.total
 * @param {number} progressData.completed
 * @param {number} progressData.inProgress
 * @param {number} progressData.pending
 * @param {number} [progressData.failed] - 실패 수 (기본: 0)
 */
function updateProgress(progressData) {
  const state = readAgentState();
  if (!state) return;

  state.progress = {
    totalTasks: progressData.total || 0,
    completedTasks: progressData.completed || 0,
    inProgressTasks: progressData.inProgress || 0,
    failedTasks: progressData.failed || 0,
    pendingTasks: progressData.pending || 0,
  };

  writeAgentState(state);
}

/**
 * 최근 메시지 추가 (링 버퍼, 최대 50건)
 * @param {Object} message
 * @param {string} message.from - 발신자
 * @param {string} message.to - 수신자
 * @param {string} message.content - 메시지 내용
 */
function addRecentMessage(message) {
  const state = readAgentState();
  if (!state) return;

  const entry = {
    from: message.from || 'unknown',
    to: message.to || 'all',
    content: message.content || '',
    timestamp: new Date().toISOString(),
  };

  state.recentMessages.push(entry);

  // 링 버퍼: 50건 초과 시 가장 오래된 항목 제거
  if (state.recentMessages.length > MAX_MESSAGES) {
    state.recentMessages = state.recentMessages.slice(-MAX_MESSAGES);
  }

  writeAgentState(state);
}

/**
 * 세션 종료 시 agent state 정리
 * - enabled: false
 * - teammates: [] (비움)
 * - progress, recentMessages: 유지 (Studio 최종 상태 표시용)
 * - lastUpdated: 현재 시각
 */
function cleanupAgentState() {
  const { debugLog } = getCore();
  const state = readAgentState();
  if (!state) return;

  state.enabled = false;
  state.teammates = [];
  // progress와 recentMessages는 유지 (Plan R10 요구사항)

  writeAgentState(state);

  debugLog('StateWriter', 'Agent state cleaned up', {
    feature: state.feature,
    preservedMessages: state.recentMessages.length,
  });
}

// ============================================================
// Module Exports
// ============================================================

module.exports = {
  initAgentState,
  updateTeammateStatus,
  addTeammate,
  removeTeammate,
  updateProgress,
  addRecentMessage,
  cleanupAgentState,
  getAgentStatePath,
  readAgentState,
};
