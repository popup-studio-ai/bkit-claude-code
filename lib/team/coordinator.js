/**
 * Team Coordinator Module
 * @module lib/team/coordinator
 * @version 1.5.1
 *
 * Agent Teams 가용성 확인 및 Team 설정 관리
 */

/**
 * Agent Teams 사용 가능 여부 확인
 * - CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 환경변수 체크
 * @returns {boolean}
 */
function isTeamModeAvailable() {
  return process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS === '1';
}

/**
 * Team 설정 로드
 * bkit.config.json의 team 섹션에서 설정 로드
 * @returns {Object} teamConfig
 * @property {boolean} enabled - Team Mode 활성화 여부
 * @property {string} displayMode - 'in-process' | 'split-pane'
 * @property {number} maxTeammates - 최대 teammate 수 (기본: 4)
 * @property {boolean} delegateMode - Delegate Mode 사용 여부
 */
function getTeamConfig() {
  let getConfig;
  try {
    getConfig = require('../core').getConfig;
  } catch (e) {
    return {
      enabled: false,
      displayMode: 'in-process',
      maxTeammates: 4,
      delegateMode: false,
    };
  }

  return {
    enabled: getConfig('team.enabled', false),
    displayMode: getConfig('team.displayMode', 'in-process'),
    maxTeammates: getConfig('team.maxTeammates', 4),
    delegateMode: getConfig('team.delegateMode', false),
  };
}

/**
 * 레벨별 Team 전략 생성
 * @param {string} level - 'Starter' | 'Dynamic' | 'Enterprise'
 * @param {string} feature - Feature name
 * @returns {Object} strategy
 */
function generateTeamStrategy(level, feature) {
  const { TEAM_STRATEGIES } = require('./strategy');
  return TEAM_STRATEGIES[level] || TEAM_STRATEGIES.Dynamic;
}

/**
 * Team 상태 포맷팅 (PDCA 상태와 통합)
 * @param {Object} teamInfo
 * @param {Object} pdcaStatus
 * @returns {string} formatted status
 */
function formatTeamStatus(teamInfo, pdcaStatus) {
  const available = isTeamModeAvailable();
  const config = getTeamConfig();

  let output = '';
  output += `## Agent Teams Status\n`;
  output += `- Available: ${available ? 'Yes' : 'No'}\n`;
  output += `- Enabled: ${config.enabled ? 'Yes' : 'No'}\n`;
  output += `- Display Mode: ${config.displayMode}\n`;
  output += `- Max Teammates: ${config.maxTeammates}\n`;

  if (pdcaStatus?.primaryFeature) {
    output += `\n### PDCA Integration\n`;
    output += `- Feature: ${pdcaStatus.primaryFeature}\n`;
    const featureData = pdcaStatus.features?.[pdcaStatus.primaryFeature];
    if (featureData) {
      output += `- Phase: ${featureData.phase}\n`;
      if (featureData.matchRate != null) {
        output += `- Match Rate: ${featureData.matchRate}%\n`;
      }
    }
  }

  return output;
}

/**
 * 팀 모드 자동 제안 여부 판단
 * Automation First: Major Feature + Dynamic/Enterprise 레벨 감지 시 자동 제안
 * @param {string} userMessage - 사용자 입력
 * @param {Object} options - 추가 옵션
 * @param {string} [options.level] - 프로젝트 레벨
 * @param {number} [options.messageLength] - 메시지 길이
 * @returns {Object|null} { suggest: boolean, reason: string, level: string }
 */
function suggestTeamMode(userMessage, options = {}) {
  if (!isTeamModeAvailable()) return null;

  let level = options.level;
  if (!level) {
    try {
      const { detectLevel } = require('../pdca/level');
      level = detectLevel();
    } catch (e) {
      level = 'Dynamic';
    }
  }

  if (level === 'Starter') return null;

  const messageLength = options.messageLength || (userMessage ? userMessage.length : 0);

  if (messageLength >= 1000) {
    return {
      suggest: true,
      reason: 'Major feature detected (message length >= 1000 chars)',
      level,
    };
  }

  try {
    const { matchMultiLangPattern, AGENT_TRIGGER_PATTERNS } = require('../intent/language');
    if (AGENT_TRIGGER_PATTERNS['cto-lead']) {
      if (matchMultiLangPattern(userMessage, AGENT_TRIGGER_PATTERNS['cto-lead'])) {
        return {
          suggest: true,
          reason: 'Team-related keywords detected in user message',
          level,
        };
      }
    }
  } catch (e) {
    // Graceful degradation
  }

  return null;
}

module.exports = {
  isTeamModeAvailable,
  getTeamConfig,
  generateTeamStrategy,
  formatTeamStatus,
  suggestTeamMode,
};
