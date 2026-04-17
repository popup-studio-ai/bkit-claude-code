/**
 * Session Context Fingerprint Store (ENH-239, Issue #81 RC-2)
 *
 * SHA-256 fingerprint of additionalContext per sessionId, stored at
 * `.bkit/runtime/session-ctx-fp.json`. Used to dedupe duplicate injections
 * caused by PreCompact/PostCompact re-firing SessionStart.
 *
 * Convention mirrors lib/core/session-title-cache.js
 * (atomic write, silent fail, runtime directory).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STALE_MS = 60 * 60 * 1000;   // 1 hour TTL
const GC_MAX_ENTRIES = 100;
const GC_STALE_DAYS = 30;

function getStorePath() {
  return path.resolve(process.cwd(), '.bkit', 'runtime', 'session-ctx-fp.json');
}

function computeFingerprint(additionalContext) {
  return crypto
    .createHash('sha256')
    .update(String(additionalContext == null ? '' : additionalContext), 'utf8')
    .digest('hex')
    .slice(0, 16); // 64-bit 절단, 충돌 확률 2^-64
}

function readStore() {
  try {
    const p = getStorePath();
    if (!fs.existsSync(p)) return { $schemaVersion: 1, sessions: {} };
    const raw = fs.readFileSync(p, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.sessions) {
      return { $schemaVersion: 1, sessions: {} };
    }
    return parsed;
  } catch (_e) {
    return { $schemaVersion: 1, sessions: {} };
  }
}

function writeStore(store) {
  try {
    const p = getStorePath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    const tmp = `${p}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(store, null, 2));
    fs.renameSync(tmp, p);
  } catch (_e) {
    // silent fail — ENH-239 경로 전체는 non-critical
  }
}

function gc(store) {
  const now = Date.now();
  const cutoff = now - GC_STALE_DAYS * 24 * 60 * 60 * 1000;
  const sessions = store.sessions || {};

  // 1) stale 30일 경과 제거
  for (const sid of Object.keys(sessions)) {
    const rec = sessions[sid];
    const ts = rec && rec.ts ? new Date(rec.ts).getTime() : 0;
    if (!Number.isFinite(ts) || ts < cutoff) delete sessions[sid];
  }

  // 2) LRU cap 100
  const remaining = Object.entries(sessions);
  if (remaining.length > GC_MAX_ENTRIES) {
    remaining
      .sort((a, b) => new Date(a[1].ts).getTime() - new Date(b[1].ts).getTime())
      .slice(0, remaining.length - GC_MAX_ENTRIES)
      .forEach(([sid]) => delete sessions[sid]);
  }

  store.sessions = sessions;
  return store;
}

/**
 * Check if same fingerprint was recorded within TTL for this session.
 * @returns {boolean} true if duplicate injection should be suppressed.
 */
function shouldDedup(sessionId, fingerprint) {
  const store = readStore();
  const rec = store.sessions && store.sessions[sessionId];
  if (!rec) return false;
  const ts = rec.ts ? new Date(rec.ts).getTime() : 0;
  if (!Number.isFinite(ts) || Date.now() - ts >= STALE_MS) return false;
  return rec.fp === fingerprint;
}

/**
 * Persist current fingerprint for the session (inline GC).
 */
function record(sessionId, fingerprint) {
  const store = readStore();
  store.sessions = store.sessions || {};
  store.sessions[sessionId] = { fp: fingerprint, ts: new Date().toISOString() };
  writeStore(gc(store));
}

module.exports = {
  computeFingerprint,
  shouldDedup,
  record,
  // exposed for tests
  _internal: { readStore, writeStore, getStorePath, STALE_MS, GC_MAX_ENTRIES, GC_STALE_DAYS },
};
