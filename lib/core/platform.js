/**
 * Platform Detection Module
 * @module lib/core/platform
 * @version 1.5.0
 *
 * Claude Code 전용 플러그인으로 단순화 (v1.5.0)
 */

const path = require('path');

/**
 * @typedef {'claude' | 'unknown'} Platform
 */

/**
 * 현재 플랫폼 감지
 * @returns {Platform}
 */
function detectPlatform() {
  if (process.env.CLAUDE_PROJECT_DIR || process.env.ANTHROPIC_API_KEY) {
    return 'claude';
  }
  return 'unknown';
}

/** @type {Platform} */
const BKIT_PLATFORM = detectPlatform();

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
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '../..');

/**
 * 프로젝트 디렉토리 경로
 * @type {string}
 */
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();

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
  isClaudeCode,
  PLUGIN_ROOT,
  PROJECT_DIR,
  BKIT_PROJECT_DIR,
  getPluginPath,
  getProjectPath,
  getTemplatePath,
};
