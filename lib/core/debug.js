/**
 * Debug Logging System
 * @module lib/core/debug
 * @version 2.1.10
 *
 * Claude Code 전용 플러그인으로 단순화 (v1.5.0). Tag synced to 2.0.0 per ENH-263 (2026-04-21).
 */

const fs = require('fs');
const path = require('path');

// Lazy require to avoid circular dependency
let _platform = null;
function getPlatform() {
  if (!_platform) {
    _platform = require('./platform');
  }
  return _platform;
}

/**
 * 로그 파일 경로
 * @returns {Object}
 */
function getDebugLogPaths() {
  const { PROJECT_DIR } = getPlatform();
  return {
    claude: path.join(PROJECT_DIR, '.claude', 'bkit-debug.log'),
    unknown: path.join(PROJECT_DIR, 'bkit-debug.log'),
  };
}

/**
 * 디버그 로그 파일 경로 반환
 * @returns {string}
 */
function getDebugLogPath() {
  const { BKIT_PLATFORM } = getPlatform();
  const paths = getDebugLogPaths();
  return paths[BKIT_PLATFORM] || paths.unknown;
}

/**
 * 디버그 로그 기록
 * @param {string} category
 * @param {string} message
 * @param {Object} [data]
 */
function debugLog(category, message, data) {
  if (process.env.BKIT_DEBUG !== 'true') return;

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    category,
    message,
    data,
  };

  try {
    const logPath = getDebugLogPath();
    const dir = path.dirname(logPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
  } catch (e) {
    // L1 fix (audit): a write failure (e.g. ENOSPC) used to be swallowed
    // silently even during an active debug session, producing nothing. When
    // BKIT_DEBUG=true the user explicitly wants visibility, so fall back to
    // stderr so the failure is at least observable instead of vanishing.
    if (process.env.BKIT_DEBUG === 'true') {
      try {
        process.stderr.write('[bkit-debug-fallback] ' + JSON.stringify(logEntry) + '\n');
      } catch (_) {
        /* stderr unavailable — nothing further we can do */
      }
    }
  }
}

// 레거시 호환: DEBUG_LOG_PATHS 상수
const DEBUG_LOG_PATHS = {
  get claude() { return getDebugLogPaths().claude; },
  get unknown() { return getDebugLogPaths().unknown; },
};

module.exports = {
  DEBUG_LOG_PATHS,
  getDebugLogPath,
  debugLog,
};
