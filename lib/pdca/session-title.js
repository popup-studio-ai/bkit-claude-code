/**
 * Session Title Generator (Issue #77 Phase A)
 *
 * 단일 진입점 — 6개 hook(user-prompt-handler, session-start, pdca-skill-stop,
 * plan-plus-stop, iterator-stop, gap-detector-stop)에서 호출.
 *
 * Phase A 가드 4단:
 *  1. ENH-226: ui.sessionTitle.enabled 체크 (config 토글)
 *  2. ENH-229: stale TTL (lastUpdated > N시간 → undefined)
 *  3. ENH-228: phase-change-only (cache hit 시 undefined → CC auto-title 보존)
 *  4. ENH-227: 최종 발행 + cache 갱신
 *
 * Returns:
 *   - string  : 새 sessionTitle 발행 (CC가 UI title 갱신)
 *   - undefined : 발행 안 함 (CC 자동 생성/이전 title 유지)
 *
 * v2.1.21 (Issue #111 Phase B): 같은 PROJECT_DIR 의 병렬 세션이 동일한
 * feature/phase 일 때 동일한 title 을 갖던 문제를 해소하기 위해, sessionId
 * 기반 stable short tag(`·a1b2`)를 title 끝에 부착한다(예 `[bkit] PLAN f1 ·a1b2`).
 * tag 는 sessionId 의 sha256 절단값으로 세션 수명 내내 안정적이며, dedup 비교
 * (feature/phase/action/sessionId)와는 독립적인 순수 표시용이다. sessionId 가
 * 없으면 tag 를 생략하여 backward-compat 를 유지한다.
 *
 * @module lib/pdca/session-title
 *
 * @version 2.1.21
 */

const crypto = require('crypto');

let _config = null;
let _status = null;
let _cache = null;

function getConfigMod() {
  if (!_config) _config = require('../core/config');
  return _config;
}
function getStatusMod() {
  if (!_status) _status = require('./status');
  return _status;
}
function getCacheMod() {
  if (!_cache) _cache = require('../core/session-title-cache');
  return _cache;
}

/**
 * @param {object} pdcaStatus
 * @param {string} feature
 * @param {number} ttlHours - 0 = TTL 비활성
 * @returns {boolean} true = stale (발행 차단)
 */
function isStaleFeature(pdcaStatus, feature, ttlHours) {
  if (!ttlHours || ttlHours <= 0) return false;
  if (!pdcaStatus || !pdcaStatus.features) return false;
  const f = pdcaStatus.features[feature];
  const lastUpdated = f && f.timestamps && f.timestamps.lastUpdated;
  if (!lastUpdated) return false; // timestamp 없으면 통과 (방어)
  const ageMs = Date.now() - new Date(lastUpdated).getTime();
  if (Number.isNaN(ageMs)) return false;
  return ageMs > ttlHours * 60 * 60 * 1000;
}

/**
 * 포맷 문자열에서 {action}, {feature}, {phase}, {tag} 치환.
 * label = action ?? phase.toUpperCase()
 *
 * @param {string} format
 * @param {{feature:string, phase?:string, action?:string, tag?:string}} vars
 *   - tag: sessionTag() 결과(있으면 {tag} 치환에 사용). 미지정 시 빈 문자열.
 */
function applyFormat(format, { feature, phase, action, tag }) {
  const label = action ? String(action) : (phase ? String(phase).toUpperCase() : '');
  let out = format
    .replace(/\{action\}/g, label)
    .replace(/\{phase\}/g, phase ? String(phase).toUpperCase() : '')
    .replace(/\{feature\}/g, feature)
    .replace(/\{tag\}/g, tag ? String(tag) : '');
  // 빈 라벨로 인한 더블 스페이스 정리
  out = out.replace(/\s+/g, ' ').trim();
  return out;
}

/**
 * sessionId → stable short tag (Issue #111 Phase B).
 * sha256 의 앞 4 hex(16-bit, 충돌 확률 2^-16 — 동일 폴더 병렬 세션 식별 충분).
 * sessionId 가 없으면 빈 문자열(tag 생략 → backward-compat).
 *
 * @param {string|null|undefined} sessionId
 * @returns {string} '' | 'a1b2'
 */
function sessionTag(sessionId) {
  if (sessionId === null || sessionId === undefined || sessionId === '') return '';
  return crypto.createHash('sha256').update(String(sessionId), 'utf8').digest('hex').slice(0, 4);
}

/**
 * sessionTitle 생성 (단일 진실원).
 *
 * @param {object} [opts]
 * @param {string} [opts.action]    - SKILL/AGENT 종료 시 'PLAN'/'DESIGN'/...
 * @param {string} [opts.feature]   - 명시 feature (생략 시 PDCA primaryFeature)
 * @param {string} [opts.phase]     - 명시 phase (생략 시 PDCA currentPhase)
 * @param {string} [opts.sessionId] - CC sessionId (cache key)
 * @returns {string|undefined}
 */
function generateSessionTitle(opts = {}) {
  const { action, feature: optFeature, phase: optPhase, sessionId } = opts;

  // 1. Config 가드 (ENH-226)
  let ui;
  try {
    ui = getConfigMod().getUIConfig();
  } catch (_e) {
    ui = { sessionTitle: { enabled: true, staleTTLHours: 24, format: '[bkit] {action} {feature}' } };
  }
  if (!ui.sessionTitle.enabled) return undefined;

  // 2. PDCA 상태 fallback
  let pdcaStatus = null;
  try {
    pdcaStatus = getStatusMod().getPdcaStatusFull();
  } catch (_e) {
    pdcaStatus = null;
  }

  const feature = optFeature || (pdcaStatus && pdcaStatus.primaryFeature);
  const phase = optPhase || (pdcaStatus && pdcaStatus.currentPhase);

  if (!feature) return undefined; // PDCA 없음 → CC auto-title

  // 3. Stale TTL 가드 (ENH-229)
  if (isStaleFeature(pdcaStatus, feature, ui.sessionTitle.staleTTLHours)) {
    return undefined;
  }

  // 4. phase-change-only 가드 (ENH-228)
  let cache = null;
  try {
    cache = getCacheMod().readCache();
  } catch (_e) {
    cache = null;
  }

  const cmp = { sessionId: sessionId ?? null, feature, phase: phase ?? null, action: action ?? null };
  let same = false;
  try {
    same = getCacheMod().isSameAsCached(cache, cmp);
  } catch (_e) {
    same = false;
  }
  if (same) return undefined; // 동일 → 재발행 안 함 (CC auto-title 유지)

  // 5. 발행 (Issue #111 Phase B: sessionId 기반 stable tag 부착)
  const tag = sessionTag(sessionId);
  const fmt = ui.sessionTitle.format || '[bkit] {action} {feature}';
  let title = applyFormat(fmt, { feature, phase, action, tag });
  // format 에 {tag} 토큰이 없고 tag 가 있으면 끝에 ` ·<tag>` append
  // (사용자 커스텀 format 도 세션 격리 혜택을 받도록 — backward-compat)
  if (tag && !/\{tag\}/.test(fmt)) {
    title = `${title} ·${tag}`;
  }

  // 6. cache 갱신
  try {
    getCacheMod().writeCache(cmp);
  } catch (_e) {
    // cache 실패는 silent — 다음 호출에서 다시 발행되더라도 기능적으로 안전
  }

  return title;
}

module.exports = {
  generateSessionTitle,
  isStaleFeature,
  applyFormat,
  sessionTag,
};
