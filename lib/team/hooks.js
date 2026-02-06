/**
 * Team Hooks Module
 * @module lib/team/hooks
 * @version 1.5.1
 *
 * TaskCompleted/TeammateIdle hook과 Team Mode의 통합 로직
 */

const { isTeamModeAvailable, getTeamConfig } = require('./coordinator');

/**
 * Team Mode에서 TaskCompleted 후 teammate 작업 분배
 * @param {string} completedPhase - 완료된 PDCA phase
 * @param {string} feature - Feature name
 * @param {string} level - Project level
 * @returns {Object|null} teammate assignment
 */
function assignNextTeammateWork(completedPhase, feature, level) {
  if (!isTeamModeAvailable()) return null;

  const { TEAM_STRATEGIES } = require('./strategy');
  const strategy = TEAM_STRATEGIES[level];
  if (!strategy) return null;

  // 다음 phase에 해당하는 role 찾기
  const nextPhaseMap = {
    plan: 'design',
    design: 'do',
    do: 'check',
    check: 'act',
    act: 'check',
  };

  const nextPhase = nextPhaseMap[completedPhase];
  if (!nextPhase) return null;

  const phaseMode = strategy.phaseStrategy[nextPhase];
  if (phaseMode !== 'parallel') return null;

  // 해당 phase에 참여하는 roles 반환
  const assignedRoles = strategy.roles.filter(
    role => role.phases.includes(nextPhase)
  );

  if (assignedRoles.length === 0) return null;

  return {
    nextPhase,
    mode: phaseMode,
    roles: assignedRoles,
    feature,
  };
}

/**
 * TeammateIdle 시 다음 작업 결정
 * @param {string} teammateId
 * @param {Object} pdcaStatus
 * @returns {Object|null} next work assignment
 */
function handleTeammateIdle(teammateId, pdcaStatus) {
  if (!isTeamModeAvailable()) return null;

  const primaryFeature = pdcaStatus?.primaryFeature;
  if (!primaryFeature) return null;

  const featureData = pdcaStatus?.features?.[primaryFeature];
  if (!featureData) return null;

  return {
    teammateId,
    feature: primaryFeature,
    currentPhase: featureData.phase,
    suggestion: `Check TaskList for pending tasks related to ${primaryFeature}`,
  };
}

module.exports = {
  assignNextTeammateWork,
  handleTeammateIdle,
};
