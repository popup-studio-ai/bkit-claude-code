/**
 * Context Management Module
 * @module lib/task/context
 * @version 2.1.10
 */

// Lazy require
let _core = null;
function getCore() {
  if (!_core) {
    _core = require('../core');
  }
  return _core;
}

// C2 fix (audit): the active skill/agent used to live in module-level vars, but
// every Claude Code hook is a separate node process — so writes from skill-post.js
// never reached the unified-* readers. The file-based marker
// (lib/core/active-skill-marker) survives across processes, so setActiveSkill now
// writes it and getActiveSkill reads it. The in-memory vars are kept only as a
// same-process fast path for code that set + read within one process.
let _activeSkill = null;
let _activeAgent = null;

// Lazy require the marker (avoids loading fs/path at module import on callers
// that never touch the skill API).
let _marker = null;
function getMarker() {
  if (!_marker) {
    _marker = require('../core/active-skill-marker');
  }
  return _marker;
}

/**
 * Set active skill.
 *
 * C2: writes the cross-process file marker so unified-* hooks in other
 * processes can read it. Also caches in-memory for same-process callers.
 * @param {string} skillName
 */
function setActiveSkill(skillName) {
  const { debugLog } = getCore();
  _activeSkill = skillName;
  getMarker().writeActiveSkill({ skill: skillName });
  debugLog('context', 'Set active skill (cross-process marker)', { skill: skillName });
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
 * Get active skill.
 *
 * C2: prefer the in-memory value (set earlier this process); otherwise fall back
 * to the cross-process file marker so a reader process sees what skill-post wrote.
 * Peek (read, not consume) because multiple mid-turn hooks may query the marker.
 * @returns {string|null}
 */
function getActiveSkill() {
  if (_activeSkill !== null) return _activeSkill;
  const rec = getMarker().readActiveSkill();
  return rec && rec.skill ? rec.skill : null;
}

/**
 * Get active agent
 * @returns {string|null}
 */
function getActiveAgent() {
  return _activeAgent;
}

/**
 * Clear active context.
 *
 * C2: also remove the cross-process marker so it does not leak into a later turn.
 */
function clearActiveContext() {
  const { debugLog } = getCore();
  _activeSkill = null;
  _activeAgent = null;
  getMarker().clearActiveSkill();
  debugLog('context', 'Cleared active context');
}

/**
 * Get full active context
 * @returns {Object}
 */
function getActiveContext() {
  return {
    skill: getActiveSkill(),
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
