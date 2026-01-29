/**
 * In-Memory Cache with TTL
 * @module lib/core/cache
 * @version 1.4.7
 */

/**
 * @typedef {Object} CacheEntry
 * @property {*} value
 * @property {number} timestamp
 */

/** @type {Map<string, CacheEntry>} */
const _store = new Map();

/** @type {number} */
const DEFAULT_TTL = 5000;

/**
 * 캐시에서 값 조회
 * @param {string} key
 * @param {number} [ttl=DEFAULT_TTL]
 * @returns {*|null}
 */
function get(key, ttl = DEFAULT_TTL) {
  const entry = _store.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > ttl) {
    _store.delete(key);
    return null;
  }

  return entry.value;
}

/**
 * 캐시에 값 저장
 * @param {string} key
 * @param {*} value
 */
function set(key, value) {
  _store.set(key, {
    value,
    timestamp: Date.now(),
  });
}

/**
 * 캐시 무효화
 * @param {string|RegExp} keyOrPattern
 */
function invalidate(keyOrPattern) {
  if (typeof keyOrPattern === 'string') {
    _store.delete(keyOrPattern);
  } else if (keyOrPattern instanceof RegExp) {
    for (const key of _store.keys()) {
      if (keyOrPattern.test(key)) {
        _store.delete(key);
      }
    }
  }
}

/**
 * 캐시 전체 삭제
 */
function clear() {
  _store.clear();
}

/**
 * 글로벌 캐시 인스턴스
 */
const globalCache = { get, set, invalidate, clear };

module.exports = {
  get,
  set,
  invalidate,
  clear,
  globalCache,
  DEFAULT_TTL,
  // 레거시 호환
  _cache: globalCache,
};
