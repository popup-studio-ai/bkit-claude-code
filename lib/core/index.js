/**
 * @bkit/core - Core Module Entry Point
 * @module lib/core
 * @version 2.0.0
 *
 * Claude Code plugin core module (v2.0.0)
 */

const platform = require('./platform');
const cache = require('./cache');
const io = require('./io');
const debug = require('./debug');
const config = require('./config');
const file = require('./file');
const paths = require('./paths');
const constants = require('./constants');
const errors = require('./errors');
const stateStore = require('./state-store');
// v2.1.1 H-03: hook-io merged into io — keep alias for backward compat
const hookIo = require('./io');

module.exports = {
  // Platform (9 exports)
  detectPlatform: platform.detectPlatform,
  BKIT_PLATFORM: platform.BKIT_PLATFORM,
  isClaudeCode: platform.isClaudeCode,
  PLUGIN_ROOT: platform.PLUGIN_ROOT,
  PROJECT_DIR: platform.PROJECT_DIR,
  BKIT_PROJECT_DIR: platform.BKIT_PROJECT_DIR,
  getPluginPath: platform.getPluginPath,
  getProjectPath: platform.getProjectPath,
  getTemplatePath: platform.getTemplatePath,

  // Cache (10 exports)
  get: cache.get,
  set: cache.set,
  invalidate: cache.invalidate,
  clear: cache.clear,
  globalCache: cache.globalCache,
  _cache: cache._cache,
  DEFAULT_TTL: cache.DEFAULT_TTL,
  TOOLSEARCH_TTL: cache.TOOLSEARCH_TTL,
  getToolSearchCache: cache.getToolSearchCache,
  setToolSearchCache: cache.setToolSearchCache,

  // I/O (9 exports)
  MAX_CONTEXT_LENGTH: io.MAX_CONTEXT_LENGTH,
  truncateContext: io.truncateContext,
  readStdinSync: io.readStdinSync,
  readStdin: io.readStdin,
  parseHookInput: io.parseHookInput,
  outputAllow: io.outputAllow,
  outputBlock: io.outputBlock,
  outputEmpty: io.outputEmpty,
  xmlSafeOutput: io.xmlSafeOutput,

  // Debug (3 exports)
  DEBUG_LOG_PATHS: debug.DEBUG_LOG_PATHS,
  getDebugLogPath: debug.getDebugLogPath,
  debugLog: debug.debugLog,

  // Config (5 exports)
  loadConfig: config.loadConfig,
  getConfig: config.getConfig,
  getConfigArray: config.getConfigArray,
  getBkitConfig: config.getBkitConfig,
  safeJsonParse: config.safeJsonParse,

  // File (8 exports)
  TIER_EXTENSIONS: file.TIER_EXTENSIONS,
  DEFAULT_EXCLUDE_PATTERNS: file.DEFAULT_EXCLUDE_PATTERNS,
  DEFAULT_FEATURE_PATTERNS: file.DEFAULT_FEATURE_PATTERNS,
  isSourceFile: file.isSourceFile,
  isCodeFile: file.isCodeFile,
  isUiFile: file.isUiFile,
  isEnvFile: file.isEnvFile,
  extractFeature: file.extractFeature,

  // Paths (10 exports - v1.6.2 + PLUGIN_DATA backup/restore ENH-119)
  STATE_PATHS: paths.STATE_PATHS,
  LEGACY_PATHS: paths.LEGACY_PATHS,
  CONFIG_PATHS: paths.CONFIG_PATHS,
  ensureBkitDirs: paths.ensureBkitDirs,
  getDocPaths: paths.getDocPaths,
  resolveDocPaths: paths.resolveDocPaths,
  findDoc: paths.findDoc,
  getArchivePath: paths.getArchivePath,
  backupToPluginData: paths.backupToPluginData,
  restoreFromPluginData: paths.restoreFromPluginData,

  // Constants (v2.0.0 - centralized magic numbers)
  constants,

  // Errors (v2.0.0 - standardized error handling)
  BkitError: errors.BkitError,
  ERROR_CODES: errors.ERROR_CODES,
  SEVERITY: errors.SEVERITY,
  safeCatch: errors.safeCatch,

  // StateStore (v2.0.0 - atomic file I/O with locking)
  stateStore,

  // Hook I/O (v2.0.0 - lightweight hook script I/O)
  hookIo,
};
