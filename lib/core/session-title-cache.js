/**
 * Session Title Cache (Issue #77 Phase A — ENH-228)
 *
 * 파일 기반 cache. 각 hook 호출은 새 Node process에서 발생하므로
 * in-memory cache는 휘발 → file-based가 유일한 hook 간 일관성 매체.
 *
 * Atomic write (tmp + rename) 로 race condition 완화.
 *
 * @module lib/core/session-title-cache
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

let _platform = null;
function getPlatform() {
  if (!_platform) _platform = require('./platform');
  return _platform;
}

function getCachePath() {
  const { PROJECT_DIR } = getPlatform();
  return path.join(PROJECT_DIR, '.bkit', 'runtime', 'session-title-cache.json');
}

/**
 * @returns {{sessionId, feature, phase, action, timestamp} | null}
 */
function readCache() {
  const cachePath = getCachePath();
  if (!fs.existsSync(cachePath)) return null;
  try {
    const raw = fs.readFileSync(cachePath, 'utf8');
    if (!raw.trim()) return null;
    return JSON.parse(raw);
  } catch (_e) {
    // corrupt cache → 무효화
    return null;
  }
}

/**
 * @param {{sessionId: string|null, feature: string, phase?: string|null, action?: string|null}} entry
 */
function writeCache(entry) {
  const cachePath = getCachePath();
  const dir = path.dirname(cachePath);

  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (_e) {
    // 디렉터리 생성 실패 → silent (cache 미저장은 치명적이지 않음)
    return;
  }

  const payload = JSON.stringify({
    sessionId: entry.sessionId ?? null,
    feature: entry.feature,
    phase: entry.phase ?? null,
    action: entry.action ?? null,
    timestamp: new Date().toISOString(),
  }, null, 2);

  // Atomic write: tmp → rename
  const tmpPath = `${cachePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(tmpPath, payload);
    fs.renameSync(tmpPath, cachePath);
  } catch (_e) {
    // cleanup tmp on failure
    try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch (_e2) {}
  }
}

function clearCache() {
  const cachePath = getCachePath();
  try {
    if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
  } catch (_e) {}
}

/**
 * Cache hit 비교 — 동일 phase/feature/action/session 시 true
 * @returns {boolean}
 */
function isSameAsCached(cached, { sessionId, feature, phase, action }) {
  if (!cached) return false;
  return cached.sessionId === (sessionId ?? null)
    && cached.feature === feature
    && cached.phase === (phase ?? null)
    && cached.action === (action ?? null);
}

module.exports = {
  readCache,
  writeCache,
  clearCache,
  isSameAsCached,
  getCachePath,
};
