/**
 * Context Management Module
 * @module lib/task/context
 * @version 1.4.7
 */

// Lazy require
let _core = null;
function getCore() {
  if (!_core) {
    _core = require('../core');
  }
  return _core;
}

// In-memory active context
let _activeSkill = null;
let _activeAgent = null;

/**
 * Set active skill
 * @param {string} skillName
 */
function setActiveSkill(skillName) {
  const { debugLog } = getCore();
  _activeSkill = skillName;
  debugLog('context', 'Set active skill', { skill: skillName });
}

/**
 * Set active agent
 * @param {string} agentName
 */
function setActiveAgent(agentName) {
  const { debugLog } = getCore();
  _activeAgent = agentName;
  debugLog('context', 'Set active agent', { agent: agentName });
}

/**
 * Get active skill
 * @returns {string|null}
 */
function getActiveSkill() {
  return _activeSkill;
}

/**
 * Get active agent
 * @returns {string|null}
 */
function getActiveAgent() {
  return _activeAgent;
}

/**
 * Clear active context
 */
function clearActiveContext() {
  const { debugLog } = getCore();
  _activeSkill = null;
  _activeAgent = null;
  debugLog('context', 'Cleared active context');
}

/**
 * Get full active context
 * @returns {Object}
 */
function getActiveContext() {
  return {
    skill: _activeSkill,
    agent: _activeAgent
  };
}

/**
 * Check if any skill/agent is active
 * @returns {boolean}
 */
function hasActiveContext() {
  return _activeSkill !== null || _activeAgent !== null;
}

module.exports = {
  setActiveSkill,
  setActiveAgent,
  getActiveSkill,
  getActiveAgent,
  clearActiveContext,
  getActiveContext,
  hasActiveContext,
};
