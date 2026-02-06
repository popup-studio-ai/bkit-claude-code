/**
 * Team Orchestration Engine
 * @module lib/team/orchestrator
 * @version 1.5.1
 *
 * Core engine for PDCA phase-based team orchestration.
 * Selects orchestration patterns, composes teams, and generates
 * spawnTeam commands for Claude Code Agent Teams.
 */

const { isTeamModeAvailable, getTeamConfig } = require('./coordinator');
const { TEAM_STRATEGIES, getTeammateRoles } = require('./strategy');
const { debugLog } = require('../core/debug');

/**
 * PDCA phase-to-orchestration pattern mapping per level
 * @type {Object<string, Object<string, string>>}
 */
const PHASE_PATTERN_MAP = {
  Dynamic: {
    plan: 'leader',
    design: 'leader',
    do: 'swarm',
    check: 'council',
    act: 'leader',
  },
  Enterprise: {
    plan: 'leader',
    design: 'council',
    do: 'swarm',
    check: 'council',
    act: 'watchdog',
  },
};

/**
 * Select orchestration pattern for a PDCA phase
 * @param {string} phase - Current PDCA phase ('plan'|'design'|'do'|'check'|'act')
 * @param {string} level - Project level ('Starter'|'Dynamic'|'Enterprise')
 * @returns {'leader'|'council'|'swarm'|'pipeline'|'watchdog'|'single'}
 */
function selectOrchestrationPattern(phase, level) {
  if (!PHASE_PATTERN_MAP[level]) return 'single';
  return PHASE_PATTERN_MAP[level][phase] || 'leader';
}

/**
 * Compose a team for a specific PDCA phase
 * @param {string} phase - PDCA phase
 * @param {string} level - Project level
 * @param {string} feature - Feature name
 * @returns {Object|null} { pattern, teammates: [{name, agentType, task, planModeRequired}], phaseStrategy }
 */
function composeTeamForPhase(phase, level, feature) {
  const strategy = TEAM_STRATEGIES[level];
  if (!strategy) return null;

  const pattern = selectOrchestrationPattern(phase, level);

  // Filter roles that participate in this phase
  const phaseRoles = strategy.roles.filter(
    role => role.phases.includes(phase)
  );

  if (phaseRoles.length === 0) return null;

  const teammates = phaseRoles.map(role => ({
    name: role.name,
    agentType: role.agents[0], // Primary agent for the role
    agents: role.agents,
    task: generateTaskDescription(phase, role.name, feature),
    planModeRequired: true,
    description: role.description,
  }));

  debugLog('Orchestrator', 'Team composed', {
    phase,
    level,
    feature,
    pattern,
    teammateCount: teammates.length,
  });

  return {
    pattern,
    teammates,
    phaseStrategy: strategy.phaseStrategy[phase],
    ctoAgent: strategy.ctoAgent || null,
  };
}

/**
 * Generate task description for a role in a phase
 * @param {string} phase - PDCA phase
 * @param {string} roleName - Role name
 * @param {string} feature - Feature name
 * @returns {string} Task description
 */
function generateTaskDescription(phase, roleName, feature) {
  const descriptions = {
    plan: {
      developer: `Analyze implementation requirements for ${feature}`,
      frontend: `Analyze UI/UX requirements for ${feature}`,
      qa: `Define quality criteria and test strategy for ${feature}`,
      architect: `Analyze architecture requirements for ${feature}`,
      security: `Identify security requirements for ${feature}`,
      reviewer: `Review plan completeness for ${feature}`,
    },
    design: {
      developer: `Design backend API and data model for ${feature}`,
      frontend: `Design UI component architecture for ${feature}`,
      qa: `Design test strategy for ${feature}`,
      architect: `Design system architecture for ${feature}`,
      security: `Design security architecture for ${feature}`,
      reviewer: `Validate design completeness for ${feature}`,
    },
    do: {
      developer: `Implement backend code for ${feature} based on Design document`,
      frontend: `Implement UI components for ${feature} based on Design document`,
      qa: `Prepare verification environment for ${feature}`,
      architect: `Review implementation architecture for ${feature}`,
      security: `Implement security controls for ${feature}`,
      reviewer: `Code review during implementation of ${feature}`,
    },
    check: {
      developer: `Support verification for ${feature}`,
      frontend: `Verify UI implementation for ${feature}`,
      qa: `Execute gap analysis and quality verification for ${feature}`,
      architect: `Verify architecture compliance for ${feature}`,
      security: `Execute security audit (OWASP Top 10) for ${feature}`,
      reviewer: `Code review and design validation for ${feature}`,
    },
    act: {
      developer: `Fix implementation issues for ${feature}`,
      frontend: `Fix UI issues for ${feature}`,
      qa: `Monitor fixes and re-verify for ${feature}`,
      architect: `Review fix architecture impact for ${feature}`,
      security: `Verify security fixes for ${feature}`,
      reviewer: `Review fixes and validate for ${feature}`,
    },
  };

  return descriptions[phase]?.[roleName]
    || `Execute ${phase} phase work for ${feature} as ${roleName}`;
}

/**
 * Generate spawnTeam command data for Claude Code Agent Teams
 * @param {string} phase - PDCA phase
 * @param {string} level - Project level
 * @param {string} feature - Feature name
 * @returns {Object|null} spawnTeam call data or null
 */
function generateSpawnTeamCommand(phase, level, feature) {
  if (!isTeamModeAvailable()) return null;

  const team = composeTeamForPhase(phase, level, feature);
  if (!team || !team.teammates || team.teammates.length === 0) return null;

  const command = {
    operation: 'spawnTeam',
    teammates: team.teammates.map(t => ({
      name: t.name,
      agentType: t.agentType,
      task: t.task,
      planModeRequired: t.planModeRequired,
    })),
    metadata: {
      feature,
      phase,
      level,
      pattern: team.pattern,
      ctoAgent: team.ctoAgent,
    },
  };

  debugLog('Orchestrator', 'SpawnTeam command generated', {
    phase,
    level,
    feature,
    teammateCount: command.teammates.length,
  });

  return command;
}

/**
 * Create phase execution context
 * @param {string} phase - PDCA phase
 * @param {string} feature - Feature name
 * @param {Object} [options] - Additional options
 * @param {string} [options.pattern] - Force specific pattern
 * @param {string} [options.level] - Override level detection
 * @returns {Object} { phase, feature, pattern, team, context }
 */
function createPhaseContext(phase, feature, options = {}) {
  let _levelModule = null;
  try {
    _levelModule = require('../pdca/level');
  } catch (e) {
    // Graceful fallback
  }

  let _taskQueue = null;
  try {
    _taskQueue = require('./task-queue');
  } catch (e) {
    // Graceful fallback
  }

  const level = options.level || (_levelModule?.detectLevel ? _levelModule.detectLevel() : 'Dynamic');
  const pattern = options.pattern || selectOrchestrationPattern(phase, level);
  const team = composeTeamForPhase(phase, level, feature);

  // Generate tasks from team composition
  const tasks = (team && _taskQueue)
    ? _taskQueue.createTeamTasks(phase, feature, team.teammates)
    : [];

  return {
    phase,
    feature,
    level,
    pattern,
    team,
    tasks,
    context: {
      teamAvailable: isTeamModeAvailable(),
      config: getTeamConfig(),
      phaseStrategy: team?.phaseStrategy || null,
      ctoAgent: team?.ctoAgent || null,
    },
  };
}

/**
 * Determine if team recomposition is needed for phase transition
 * @param {string} currentPhase - Current phase
 * @param {string} nextPhase - Next phase
 * @param {string} level - Project level
 * @returns {boolean}
 */
function shouldRecomposeTeam(currentPhase, nextPhase, level) {
  const strategy = TEAM_STRATEGIES[level];
  if (!strategy) return false;

  // Get roles for each phase
  const currentRoles = strategy.roles
    .filter(r => r.phases.includes(currentPhase))
    .map(r => r.name)
    .sort()
    .join(',');

  const nextRoles = strategy.roles
    .filter(r => r.phases.includes(nextPhase))
    .map(r => r.name)
    .sort()
    .join(',');

  // Recompose if the set of roles changes
  return currentRoles !== nextRoles;
}

module.exports = {
  PHASE_PATTERN_MAP,
  selectOrchestrationPattern,
  composeTeamForPhase,
  generateSpawnTeamCommand,
  createPhaseContext,
  shouldRecomposeTeam,
};
