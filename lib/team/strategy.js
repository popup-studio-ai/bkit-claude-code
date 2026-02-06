/**
 * Team Strategy Module
 * @module lib/team/strategy
 * @version 1.5.1
 *
 * 레벨별 Agent Teams 전략 정의
 */

const TEAM_STRATEGIES = {
  Starter: null, // Team Mode 미지원 (단일 세션으로 충분)

  Dynamic: {
    teammates: 2,
    roles: [
      {
        name: 'developer',
        description: 'Implementation and coding',
        agents: ['bkend-expert'],
        phases: ['do', 'act']
      },
      {
        name: 'qa',
        description: 'Testing and gap analysis',
        agents: ['qa-monitor', 'gap-detector'],
        phases: ['check']
      }
    ],
    phaseStrategy: {
      plan: 'single',
      design: 'single',
      do: 'parallel',
      check: 'parallel',
      act: 'parallel'
    }
  },

  Enterprise: {
    teammates: 4,
    roles: [
      {
        name: 'architect',
        description: 'Design documents, API specs',
        agents: ['enterprise-expert', 'infra-architect'],
        phases: ['design']
      },
      {
        name: 'developer',
        description: 'Implementation, coding',
        agents: ['bkend-expert'],
        phases: ['do', 'act']
      },
      {
        name: 'qa',
        description: 'Testing, gap analysis',
        agents: ['qa-monitor', 'gap-detector'],
        phases: ['check']
      },
      {
        name: 'reviewer',
        description: 'Code review, security check',
        agents: ['code-analyzer', 'design-validator'],
        phases: ['check', 'act']
      }
    ],
    phaseStrategy: {
      plan: 'single',
      design: 'parallel',
      do: 'parallel',
      check: 'parallel',
      act: 'parallel'
    }
  }
};

/**
 * 역할별 teammate 정의 반환
 * @param {string} level
 * @returns {Array} roles
 */
function getTeammateRoles(level) {
  const strategy = TEAM_STRATEGIES[level];
  return strategy?.roles || [];
}

module.exports = {
  TEAM_STRATEGIES,
  getTeammateRoles,
};
