#!/usr/bin/env node
/**
 * Permission Hierarchy Manager (FR-05)
 * Implements deny → ask → allow permission chain
 *
 * @version 1.5.6
 * @module lib/permission-manager
 */

// Import from other modules (lazy to avoid circular dependency)
let _hierarchy = null;
let _common = null;

function getHierarchy() {
  if (!_hierarchy) {
    _hierarchy = require('./context-hierarchy.js');
  }
  return _hierarchy;
}

function getCommon() {
  if (!_common) {
    _common = require('./common.js');
  }
  return _common;
}

/**
 * Permission levels
 */
const PERMISSION_LEVELS = {
  deny: 0,
  ask: 1,
  allow: 2
};

/**
 * Default permissions (when no config is provided)
 */
const DEFAULT_PERMISSIONS = {
  Write: 'allow',
  Edit: 'allow',
  Read: 'allow',
  Bash: 'allow',
  'Bash(rm -rf*)': 'deny',
  'Bash(rm -r*)': 'ask',
  'Bash(git push --force*)': 'deny',
  'Bash(git reset --hard*)': 'ask'
};

/**
 * Check permission for a tool
 * @param {string} toolName - Tool name (e.g., "Write", "Bash")
 * @param {string} toolInput - Tool input/command for pattern matching
 * @returns {'deny' | 'ask' | 'allow'}
 */
function checkPermission(toolName, toolInput = '') {
  const hierarchy = getHierarchy();
  const common = getCommon();

  // Get permissions from hierarchical config, falling back to defaults
  const permissions = hierarchy.getHierarchicalConfig('permissions', DEFAULT_PERMISSIONS);

  // Check specific pattern first (most restrictive wins)
  const patterns = Object.keys(permissions).filter(p =>
    p.startsWith(`${toolName}(`) && p.endsWith(')')
  );

  // Sort patterns by specificity (longer = more specific)
  patterns.sort((a, b) => b.length - a.length);

  for (const pattern of patterns) {
    // Extract pattern inside parentheses
    const patternContent = pattern.slice(toolName.length + 1, -1);

    // Convert glob-like pattern to regex
    const regexStr = patternContent
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')  // Escape special chars except *
      .replace(/\*/g, '.*');  // Convert * to .*

    const matcher = new RegExp(`^${regexStr}$`, 'i');

    if (matcher.test(toolInput)) {
      common.debugLog('Permission', 'Pattern matched', { pattern, toolInput, permission: permissions[pattern] });
      return permissions[pattern];
    }
  }

  // Check tool-level permission
  if (toolName in permissions) {
    return permissions[toolName];
  }

  // Default: allow
  return 'allow';
}

/**
 * Get all permissions for a tool
 * @param {string} toolName - Tool name
 * @returns {Object} Permission rules for the tool
 */
function getToolPermissions(toolName) {
  const hierarchy = getHierarchy();
  const permissions = hierarchy.getHierarchicalConfig('permissions', DEFAULT_PERMISSIONS);
  const toolPermissions = {};

  for (const [key, value] of Object.entries(permissions)) {
    if (key === toolName || key.startsWith(`${toolName}(`)) {
      toolPermissions[key] = value;
    }
  }

  return toolPermissions;
}

/**
 * Validate permission action
 * @param {string} permission - Permission string
 * @returns {boolean}
 */
function isValidPermission(permission) {
  return permission in PERMISSION_LEVELS;
}

/**
 * Get permission level as number for comparison
 * @param {string} permission - Permission string
 * @returns {number}
 */
function getPermissionLevel(permission) {
  return PERMISSION_LEVELS[permission] ?? PERMISSION_LEVELS.allow;
}

/**
 * Check if permission A is more restrictive than permission B
 * @param {string} permA - First permission
 * @param {string} permB - Second permission
 * @returns {boolean}
 */
function isMoreRestrictive(permA, permB) {
  return getPermissionLevel(permA) < getPermissionLevel(permB);
}

/**
 * Get all configured permissions
 * @returns {Object}
 */
function getAllPermissions() {
  const hierarchy = getHierarchy();
  return hierarchy.getHierarchicalConfig('permissions', DEFAULT_PERMISSIONS);
}

/**
 * Check if tool action should be blocked
 * @param {string} toolName - Tool name
 * @param {string} toolInput - Tool input
 * @returns {{ blocked: boolean, permission: string, reason: string }}
 */
function shouldBlock(toolName, toolInput = '') {
  const permission = checkPermission(toolName, toolInput);

  if (permission === 'deny') {
    return {
      blocked: true,
      permission,
      reason: `${toolName} action is denied by permission policy`
    };
  }

  return {
    blocked: false,
    permission,
    reason: null
  };
}

/**
 * Check if tool action requires confirmation
 * @param {string} toolName - Tool name
 * @param {string} toolInput - Tool input
 * @returns {{ requiresConfirmation: boolean, permission: string }}
 */
function requiresConfirmation(toolName, toolInput = '') {
  const permission = checkPermission(toolName, toolInput);

  return {
    requiresConfirmation: permission === 'ask',
    permission
  };
}

module.exports = {
  checkPermission,
  getToolPermissions,
  isValidPermission,
  getPermissionLevel,
  isMoreRestrictive,
  getAllPermissions,
  shouldBlock,
  requiresConfirmation,
  PERMISSION_LEVELS,
  DEFAULT_PERMISSIONS
};
