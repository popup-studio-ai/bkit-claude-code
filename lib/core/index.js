/**
 * @bkit/core - Core Module Entry Point
 * @module lib/core
 * @version 1.5.0
 *
 * Claude Code 전용 플러그인으로 단순화 (v1.5.0)
 */

const platform = require('./platform');
const cache = require('./cache');
const io = require('./io');
const debug = require('./debug');
const config = require('./config');
const file = require('./file');

module.exports = {
  // Platform (8 exports - isGeminiCli removed in v1.5.0)
  detectPlatform: platform.detectPlatform,
  BKIT_PLATFORM: platform.BKIT_PLATFORM,
  isClaudeCode: platform.isClaudeCode,
  PLUGIN_ROOT: platform.PLUGIN_ROOT,
  PROJECT_DIR: platform.PROJECT_DIR,
  BKIT_PROJECT_DIR: platform.BKIT_PROJECT_DIR,
  getPluginPath: platform.getPluginPath,
  getProjectPath: platform.getProjectPath,
  getTemplatePath: platform.getTemplatePath,

  // Cache (6 exports)
  get: cache.get,
  set: cache.set,
  invalidate: cache.invalidate,
  clear: cache.clear,
  globalCache: cache.globalCache,
  _cache: cache._cache,
  DEFAULT_TTL: cache.DEFAULT_TTL,

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
};
