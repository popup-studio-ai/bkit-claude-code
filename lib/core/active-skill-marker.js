/**
 * Active Skill Marker (Issue #113 — v2.1.21)
 *
 * Cross-process, skill_post-independent marker for "which skill just ran".
 *
 * ## Why this exists
 * `unified-stop.js detectActiveSkill()` relies on (1) `hookContext.skill_name`,
 * (2) `tool_input.skill`, (3) `lib/task/context.getActiveSkill()`. Empirically
 * (CC v2.1.156, real `claude -p` session) ALL THREE fail for a `/sprint` skill:
 *   - CC does NOT put `skill_name` in the Stop hook payload (hasSkillName:false)
 *   - tool_input is absent in the Stop payload
 *   - getActiveSkill() reads an IN-MEMORY var (`_activeSkill`) set by
 *     skill-post.js — but each hook is a separate process, so it never crosses
 *     process boundaries; and skill-post is itself dropped by CC #57317.
 * Result: no skill Stop handler ever dispatches → #113 (and PDCA exec summary)
 * silently no-op in production.
 *
 * ## Mechanism
 * The sprint skill always routes through `scripts/sprint-handler.js` (a Bash
 * subprocess that DOES run mid-turn). The handler writes a small file marker
 * here; `unified-stop.detectActiveSkill()` reads it at end-of-turn. File-based
 * → survives across processes. TTL-bounded → no stale dispatch.
 *
 * Convention mirrors lib/core/session-ctx-fp.js (atomic write, silent fail,
 * `.bkit/runtime/`).
 *
 * @module lib/core/active-skill-marker
 * @version 2.1.21
 * @since 2.1.21
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 분 — 한 turn 수명보다 충분히 길고, 다음 날까지 stale 되지 않을 만큼 짧음

function markerPath() {
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  return path.join(root, '.bkit', 'runtime', 'active-skill.json');
}

/**
 * 현재 turn 의 active skill 마커를 기록 (atomic write).
 * @param {{skill: string, action?: string|null, id?: string|null, phase?: string|null}} entry
 */
function writeActiveSkill(entry) {
  if (!entry || !entry.skill) return;
  try {
    const p = markerPath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    const payload = JSON.stringify({
      skill: String(entry.skill),
      action: entry.action != null ? String(entry.action) : null,
      id: entry.id != null ? String(entry.id) : null,
      phase: entry.phase != null ? String(entry.phase) : null,
      ts: new Date().toISOString(),
    });
    const tmp = `${p}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmp, payload);
    fs.renameSync(tmp, p);
  } catch (_e) {
    // silent — 마커 미기록은 비치명적 (Stop hook 출력만 누락)
  }
}

/**
 * 마커를 읽되 삭제하지 않음 (peek). TTL 경과 시 null.
 * @param {number} [ttlMs]
 * @returns {{skill, action, id, phase, ts}|null}
 */
function readActiveSkill(ttlMs = DEFAULT_TTL_MS) {
  try {
    const p = markerPath();
    if (!fs.existsSync(p)) return null;
    const rec = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!rec || !rec.skill) return null;
    const ts = rec.ts ? Date.parse(rec.ts) : 0;
    if (!Number.isFinite(ts) || (Date.now() - ts) > ttlMs) return null;
    return rec;
  } catch (_e) {
    return null;
  }
}

/**
 * 마커 삭제 (consume-once). 핸들러가 출력 후 호출.
 */
function clearActiveSkill() {
  try {
    const p = markerPath();
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch (_e) { /* silent */ }
}

/**
 * read + delete 원샷 (peek 가 필요 없는 호출부용).
 * @param {number} [ttlMs]
 * @returns {{skill, action, id, phase, ts}|null}
 */
function consumeActiveSkill(ttlMs = DEFAULT_TTL_MS) {
  const rec = readActiveSkill(ttlMs);
  clearActiveSkill();
  return rec;
}

module.exports = {
  writeActiveSkill,
  readActiveSkill,
  clearActiveSkill,
  consumeActiveSkill,
  markerPath,
  DEFAULT_TTL_MS,
};
