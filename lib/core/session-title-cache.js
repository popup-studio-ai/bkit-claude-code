/**
 * Session Title Cache (Issue #77 Phase A — ENH-228; Issue #111 Phase B — v2.1.21)
 *
 * 파일 기반 cache. 각 hook 호출은 새 Node process에서 발생하므로
 * in-memory cache는 휘발 → file-based가 유일한 hook 간 일관성 매체.
 *
 * Atomic write (tmp + rename) 로 race condition 완화.
 *
 * v2.1.21 (Issue #111 Phase B): single flat record → `sessions[sessionId]`
 * map 구조로 전환. 같은 PROJECT_DIR 의 병렬 세션이 서로의 record 를 clobber
 * 하던 문제(ENH-228 phase-change-only dedup 파괴 부작용 포함)를 해소.
 * 구조/GC 는 lib/core/session-ctx-fp.js (sessions map + atomic write + inline GC)
 * 패턴을 미러. 레거시 flat record 는 readCache() 에서 1회 마이그레이션.
 *
 * @module lib/core/session-title-cache
 *
 * @version 2.1.21
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_VERSION = 2;
const GC_STALE_DAYS = 7;                 // 7일 경과 세션 엔트리 제거
const GC_MAX_ENTRIES = 200;              // LRU cap (병렬 세션 충분 수용)
const NO_SESSION_KEY = '__nosession__';  // sessionId 부재 시 sentinel 키

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
 * sessionId → map key (null/undefined → sentinel).
 * @param {string|null|undefined} sessionId
 * @returns {string}
 */
function keyFor(sessionId) {
  return (sessionId === null || sessionId === undefined || sessionId === '')
    ? NO_SESSION_KEY
    : String(sessionId);
}

/**
 * 임의 parsed 객체를 정규 store 형태로 변환.
 * - 이미 sessions map → 그대로(스키마 버전만 보정)
 * - 레거시 flat record({sessionId,feature,phase,action,timestamp}) → 1회 마이그레이션
 * - 그 외/null → 빈 store
 *
 * @param {*} parsed
 * @returns {{ $schemaVersion: number, sessions: Object }}
 */
function normalizeStore(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return { $schemaVersion: SCHEMA_VERSION, sessions: {} };
  }
  // v2 map 형태
  if (parsed.sessions && typeof parsed.sessions === 'object') {
    return { $schemaVersion: SCHEMA_VERSION, sessions: parsed.sessions };
  }
  // 레거시 flat record 마이그레이션 (Issue #111 Phase B backward-compat)
  if (Object.prototype.hasOwnProperty.call(parsed, 'feature')) {
    const k = keyFor(parsed.sessionId);
    return {
      $schemaVersion: SCHEMA_VERSION,
      sessions: {
        [k]: {
          feature: parsed.feature,
          phase: parsed.phase ?? null,
          action: parsed.action ?? null,
          timestamp: parsed.timestamp || new Date().toISOString(),
        },
      },
    };
  }
  return { $schemaVersion: SCHEMA_VERSION, sessions: {} };
}

/**
 * Inline GC — stale(7일) 제거 + LRU cap(200). session-ctx-fp.gc 미러.
 * @param {{ $schemaVersion: number, sessions: Object }} store
 * @returns {{ $schemaVersion: number, sessions: Object }}
 */
function gc(store) {
  const now = Date.now();
  const cutoff = now - GC_STALE_DAYS * 24 * 60 * 60 * 1000;
  const sessions = store.sessions || {};

  // 1) stale 7일 경과 제거
  for (const sid of Object.keys(sessions)) {
    const rec = sessions[sid];
    const ts = rec && rec.timestamp ? new Date(rec.timestamp).getTime() : 0;
    if (!Number.isFinite(ts) || ts < cutoff) delete sessions[sid];
  }

  // 2) LRU cap
  const remaining = Object.entries(sessions);
  if (remaining.length > GC_MAX_ENTRIES) {
    remaining
      .sort((a, b) => new Date(a[1].timestamp).getTime() - new Date(b[1].timestamp).getTime())
      .slice(0, remaining.length - GC_MAX_ENTRIES)
      .forEach(([sid]) => delete sessions[sid]);
  }

  store.sessions = sessions;
  return store;
}

/**
 * 정규화된 store 전체를 반환 (레거시 flat record 는 자동 마이그레이션).
 * @returns {{ $schemaVersion: number, sessions: Object } | null}
 *   파일 부재/손상 시 null (호출부 방어와 호환).
 */
function readCache() {
  const cachePath = getCachePath();
  if (!fs.existsSync(cachePath)) return null;
  try {
    const raw = fs.readFileSync(cachePath, 'utf8');
    if (!raw.trim()) return null;
    return normalizeStore(JSON.parse(raw));
  } catch (_e) {
    // corrupt cache → 무효화
    return null;
  }
}

/**
 * 특정 세션 엔트리를 기록 (sessions map upsert + inline GC).
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

  // 기존 store 로드(없으면 빈 store) → 해당 세션 엔트리 upsert
  const store = readCache() || { $schemaVersion: SCHEMA_VERSION, sessions: {} };
  store.sessions = store.sessions || {};
  store.sessions[keyFor(entry.sessionId)] = {
    feature: entry.feature,
    phase: entry.phase ?? null,
    action: entry.action ?? null,
    timestamp: new Date().toISOString(),
  };
  gc(store);

  const payload = JSON.stringify(store, null, 2);

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
 * Cache hit 비교 — 해당 sessionId 엔트리가 동일 feature/phase/action 일 때 true.
 *
 * v2.1.21 (Issue #111 Phase B): 비교 대상은 단일 flat record 가 아니라
 * `store.sessions[sessionId]`. 세션별로 격리되어 다른 세션의 record 에
 * 영향받지 않음 → ENH-228 phase-change-only dedup 정상 복원.
 *
 * @param {{sessions?: Object}|null} store - readCache() 반환값
 * @param {{sessionId: string|null, feature: string, phase?: string|null, action?: string|null}} cmp
 * @returns {boolean}
 */
function isSameAsCached(store, { sessionId, feature, phase, action }) {
  if (!store || !store.sessions) return false;
  const rec = store.sessions[keyFor(sessionId)];
  if (!rec) return false;
  return rec.feature === feature
    && rec.phase === (phase ?? null)
    && rec.action === (action ?? null);
}

module.exports = {
  readCache,
  writeCache,
  clearCache,
  isSameAsCached,
  getCachePath,
  // exposed for tests / advanced callers
  normalizeStore,
  keyFor,
  _internal: { gc, SCHEMA_VERSION, GC_STALE_DAYS, GC_MAX_ENTRIES, NO_SESSION_KEY },
};
