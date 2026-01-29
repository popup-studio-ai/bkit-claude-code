/**
 * Platform Detection Module
 * @module lib/core/platform
 * @version 1.4.7
 */

const path = require('path');

/**
 * @typedef {'claude' | 'gemini' | 'unknown'} Platform
 */

/**
 * 현재 플랫폼 감지
 * @returns {Platform}
 */
function detectPlatform() {
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY) {
    return 'gemini';
  }
  if (process.env.CLAUDE_PROJECT_DIR || process.env.ANTHROPIC_API_KEY) {
    return 'claude';
  }
  return 'unknown';
}

/** @type {Platform} */
const BKIT_PLATFORM = detectPlatform();

/**
 * Gemini CLI 여부
 * @returns {boolean}
 */
function isGeminiCli() {
  return BKIT_PLATFORM === 'gemini';
}

/**
 * Claude Code 여부
 * @returns {boolean}
 */
function isClaudeCode() {
  return BKIT_PLATFORM === 'claude';
}

/**
 * 플러그인 루트 경로
 * @type {string}
 */
const PLUGIN_ROOT = isGeminiCli()
  ? process.env.GEMINI_PLUGIN_ROOT || path.resolve(__dirname, '../..')
  : process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '../..');

/**
 * 프로젝트 디렉토리 경로
 * @type {string}
 */
const PROJECT_DIR = isGeminiCli()
  ? process.env.GEMINI_PROJECT_DIR || process.cwd()
  : process.env.CLAUDE_PROJECT_DIR || process.cwd();

/**
 * 레거시 호환 상수
 * @type {string}
 */
const BKIT_PROJECT_DIR = PROJECT_DIR;

/**
 * 플러그인 내 상대 경로 해결
 * @param {string} relativePath
 * @returns {string}
 */
function getPluginPath(relativePath) {
  return path.join(PLUGIN_ROOT, relativePath);
}

/**
 * 프로젝트 내 상대 경로 해결
 * @param {string} relativePath
 * @returns {string}
 */
function getProjectPath(relativePath) {
  return path.join(PROJECT_DIR, relativePath);
}

/**
 * 템플릿 파일 경로 반환
 * @param {string} templateName
 * @returns {string}
 */
function getTemplatePath(templateName) {
  return getPluginPath(`templates/${templateName}`);
}

module.exports = {
  detectPlatform,
  BKIT_PLATFORM,
  isGeminiCli,
  isClaudeCode,
  PLUGIN_ROOT,
  PROJECT_DIR,
  BKIT_PROJECT_DIR,
  getPluginPath,
  getProjectPath,
  getTemplatePath,
};
