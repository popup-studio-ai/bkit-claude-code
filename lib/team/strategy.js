/**
 * Team Strategy Module
 * @module lib/team/strategy
 * @version 1.5.1
 *
 * Level-based Agent Teams strategy definitions with CTO-Led Team support.
 */

const TEAM_STRATEGIES = {
  Starter: null, // Team Mode not supported (single session sufficient)

  Dynamic: {
    teammates: 3,
    ctoAgent: 'cto-lead',
    roles: [
      {
        name: 'developer',
        description: 'Backend implementation and coding',
        agents: ['bkend-expert'],
        phases: ['do', 'act'],
      },
      {
        name: 'frontend',
        description: 'UI architecture and component implementation',
        agents: ['frontend-architect'],
        phases: ['design', 'do'],
      },
      {
        name: 'qa',
        description: 'Testing and gap analysis',
        agents: ['qa-monitor', 'gap-detector'],
        phases: ['check'],
      },
    ],
    phaseStrategy: {
      plan: 'single',
      design: 'single',
      do: 'parallel',
      check: 'parallel',
      act: 'parallel',
    },
  },

  Enterprise: {
    teammates: 5,
    ctoAgent: 'cto-lead',
    roles: [
      {
        name: 'architect',
        description: 'System architecture and infrastructure design',
        agents: ['enterprise-expert', 'infra-architect'],
        phases: ['design'],
      },
      {
        name: 'developer',
        description: 'Backend and frontend implementation',
        agents: ['bkend-expert', 'frontend-architect'],
        phases: ['do', 'act'],
      },
      {
        name: 'qa',
        description: 'Quality strategy and verification',
        agents: ['qa-strategist', 'qa-monitor', 'gap-detector'],
        phases: ['check'],
      },
      {
        name: 'reviewer',
        description: 'Code review and design validation',
        agents: ['code-analyzer', 'design-validator'],
        phases: ['check', 'act'],
      },
      {
        name: 'security',
        description: 'Security architecture and vulnerability analysis',
        agents: ['security-architect'],
        phases: ['design', 'check'],
      },
    ],
    phaseStrategy: {
      plan: 'single',
      design: 'council',
      do: 'swarm',
      check: 'council',
      act: 'watchdog',
    },
  },
};

/**
 * Get teammate roles for a project level
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
