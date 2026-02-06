/**
 * Team Module Entry Point
 * @module lib/team
 * @version 1.5.1
 */

const coordinator = require('./coordinator');
const strategy = require('./strategy');

module.exports = {
  // Coordinator (4 exports)
  isTeamModeAvailable: coordinator.isTeamModeAvailable,
  getTeamConfig: coordinator.getTeamConfig,
  generateTeamStrategy: coordinator.generateTeamStrategy,
  formatTeamStatus: coordinator.formatTeamStatus,

  // Strategy (2 exports)
  TEAM_STRATEGIES: strategy.TEAM_STRATEGIES,
  getTeammateRoles: strategy.getTeammateRoles,
};
