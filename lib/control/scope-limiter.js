/**
 * Scope Limiter - File/directory scope limiting based on automation level
 * @module lib/control/scope-limiter
 * @version 2.0.0
 *
 * Restricts file access and operation sizes per automation level (L0-L4).
 * L0-L1: strictest (docs/, .bkit/ only)
 * L2: moderate (src/, lib/, docs/, test/)
 * L3-L4: widest (all except denied paths)
 */

const path = require('path');

/**
 * Default scope configuration
 * @type {Object}
 */
const DEFAULT_SCOPE = {
  allowedPaths: ['src/**', 'lib/**', 'docs/**', 'test/**', 'scripts/**', 'skills/**', 'agents/**', 'hooks/**', 'templates/**'],
  deniedPaths: ['.env*', '*.key', '*.pem', '**/secrets/**', '.git/**', 'node_modules/**'],
  maxFileSize: 1024 * 1024, // 1MB
  maxNewFiles: 20,
  maxTotalChanges: 10 * 1024, // 10KB per operation
};

/**
 * Scope overrides per automation level tier.
 * Lower levels get tighter constraints.
 * @type {Object<string, Object>}
 */
const LEVEL_SCOPE_OVERRIDES = {
  // L0-L1: strictest — only docs and .bkit state
  strict: {
    allowedPaths: ['docs/**', '.bkit/**'],
    maxFileSize: 256 * 1024,   // 256KB
    maxNewFiles: 5,
    maxTotalChanges: 4 * 1024, // 4KB
  },
  // L2: moderate — standard dev directories
  moderate: {
    allowedPaths: ['src/**', 'lib/**', 'docs/**', 'test/**', '.bkit/**'],
    maxFileSize: 512 * 1024,   // 512KB
    maxNewFiles: 10,
    maxTotalChanges: 8 * 1024, // 8KB
  },
  // L3-L4: wide — everything except denied
  wide: {
    allowedPaths: DEFAULT_SCOPE.allowedPaths,
    maxFileSize: DEFAULT_SCOPE.maxFileSize,
    maxNewFiles: DEFAULT_SCOPE.maxNewFiles,
    maxTotalChanges: DEFAULT_SCOPE.maxTotalChanges,
  },
};

/**
 * Get effective scope for current automation level
 * @param {number} automationLevel - 0-4
 * @returns {{allowedPaths: string[], deniedPaths: string[], maxFileSize: number, maxNewFiles: number, maxTotalChanges: number}}
 */
function getEffectiveScope(automationLevel) {
  const level = Math.max(0, Math.min(4, automationLevel || 0));

  let override;
  if (level <= 1) {
    override = LEVEL_SCOPE_OVERRIDES.strict;
  } else if (level === 2) {
    override = LEVEL_SCOPE_OVERRIDES.moderate;
  } else {
    override = LEVEL_SCOPE_OVERRIDES.wide;
  }

  return {
    allowedPaths: override.allowedPaths,
    deniedPaths: DEFAULT_SCOPE.deniedPaths,
    maxFileSize: override.maxFileSize,
    maxNewFiles: override.maxNewFiles,
    maxTotalChanges: override.maxTotalChanges,
  };
}

/**
 * Check if a path matches any pattern in a list (simple glob matching).
 * Supports: '*' (single segment wildcard), '**' (multi-segment wildcard),
 * leading '*' (extension match like *.key).
 * @param {string} filePath - Normalized forward-slash path
 * @param {string[]} patterns - Glob patterns to match against
 * @returns {boolean}
 */
function matchesPattern(filePath, patterns) {
  const normalized = filePath.replace(/\\/g, '/').replace(/^\/+/, '');

  for (const pattern of patterns) {
    const pat = pattern.replace(/\\/g, '/').replace(/^\/+/, '');
    if (_globMatch(normalized, pat)) return true;
  }
  return false;
}

/**
 * Simple glob matcher (no minimatch dependency).
 * Converts glob pattern to regex.
 * @param {string} str - String to test
 * @param {string} pattern - Glob pattern
 * @returns {boolean}
 * @private
 */
function _globMatch(str, pattern) {
  // Escape regex special chars except * and ?
  let regex = '';
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i];
    if (ch === '*' && pattern[i + 1] === '*') {
      // '**' matches any number of path segments
      regex += '.*';
      i += 2;
      // Skip trailing slash after **
      if (pattern[i] === '/') i++;
    } else if (ch === '*') {
      // '*' matches anything except path separator
      regex += '[^/]*';
      i++;
    } else if (ch === '?') {
      regex += '[^/]';
      i++;
    } else if ('^$.|+()[]{}\\'.includes(ch)) {
      regex += '\\' + ch;
      i++;
    } else {
      regex += ch;
      i++;
    }
  }

  return new RegExp('^' + regex + '$').test(str);
}

/**
 * Check if a file path is within allowed scope
 * @param {string} filePath - Relative or absolute file path
 * @param {number} automationLevel - 0-4
 * @returns {{allowed: boolean, reason: string, rule: string|null}}
 */
function checkPathScope(filePath, automationLevel) {
  // Security: reject null bytes (path truncation attack)
  if (filePath.includes('\0')) {
    return { allowed: false, reason: 'Path contains null byte', rule: 'NULL_BYTE' };
  }

  // Security: normalize path to resolve traversal sequences (../)
  const resolved = path.resolve(filePath);
  const projectRoot = process.cwd();
  if (!resolved.startsWith(projectRoot)) {
    return { allowed: false, reason: 'Path escapes project root', rule: 'PATH_TRAVERSAL' };
  }

  // Security: resolve symlinks to prevent symlink-following attacks
  try {
    const fs = require('fs');
    if (fs.existsSync(filePath) && fs.lstatSync(filePath).isSymbolicLink()) {
      const realPath = fs.realpathSync(filePath);
      if (!realPath.startsWith(projectRoot)) {
        return { allowed: false, reason: 'Symlink target escapes project root', rule: 'SYMLINK_ESCAPE' };
      }
    }
  } catch (_) { /* file may not exist yet — that's fine */ }

  const normalized = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const scope = getEffectiveScope(automationLevel);

  // Check denied paths first (always enforced)
  if (matchesPattern(normalized, scope.deniedPaths)) {
    return {
      allowed: false,
      reason: `Path "${normalized}" matches denied pattern`,
      rule: 'DENIED_PATH',
    };
  }

  // Check allowed paths
  if (!matchesPattern(normalized, scope.allowedPaths)) {
    return {
      allowed: false,
      reason: `Path "${normalized}" not in allowed scope for L${automationLevel}`,
      rule: 'NOT_IN_SCOPE',
    };
  }

  return {
    allowed: true,
    reason: 'Path is within allowed scope',
    rule: null,
  };
}

/**
 * Check if operation size is within limits
 * @param {number} fileCount - Number of files in the operation
 * @param {number} totalBytes - Total bytes of changes
 * @param {number} automationLevel - 0-4
 * @returns {{allowed: boolean, reason: string}}
 */
function checkOperationScope(fileCount, totalBytes, automationLevel) {
  const scope = getEffectiveScope(automationLevel);

  if (fileCount > scope.maxNewFiles) {
    return {
      allowed: false,
      reason: `File count ${fileCount} exceeds limit ${scope.maxNewFiles} for L${automationLevel}`,
    };
  }

  if (totalBytes > scope.maxTotalChanges) {
    return {
      allowed: false,
      reason: `Total size ${totalBytes}B exceeds limit ${scope.maxTotalChanges}B for L${automationLevel}`,
    };
  }

  return {
    allowed: true,
    reason: 'Operation is within scope limits',
  };
}

module.exports = {
  DEFAULT_SCOPE,
  LEVEL_SCOPE_OVERRIDES,
  getEffectiveScope,
  matchesPattern,
  checkPathScope,
  checkOperationScope,
};
