'use strict';
/**
 * Unit Tests for lib/core/active-skill-marker.js (Issue #113 — v2.1.21)
 *
 * Cross-process active-skill marker — the production dispatch path for Stop
 * handlers when CC omits skill_name and skill_post is dropped (#57317).
 *
 * Pattern: console.assert based (matches existing test/unit/*.test.js convention).
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-asm-'));
process.env.CLAUDE_PROJECT_DIR = tmp;
Object.keys(require.cache).forEach((k) => { if (k.includes('active-skill-marker')) delete require.cache[k]; });
const M = require('../../lib/core/active-skill-marker');

let passed = 0, failed = 0, total = 0;
function assert(id, condition, message) {
  total++;
  if (condition) { passed++; console.log(`  PASS: ${id} - ${message}`); }
  else { failed++; console.error(`  FAIL: ${id} - ${message}`); }
}

// =============== TC-M1: write + read roundtrip ===============
M.clearActiveSkill();
M.writeActiveSkill({ skill: 'sprint', action: 'phase', id: 'demo', phase: 'do' });
const r1 = M.readActiveSkill();
assert('TC-M1a', r1 && r1.skill === 'sprint' && r1.action === 'phase' && r1.id === 'demo' && r1.phase === 'do', 'write→read roundtrip');
assert('TC-M1b', fs.existsSync(M.markerPath()), 'read 는 파일 삭제하지 않음 (peek)');

// =============== TC-M2: consume deletes ===============
const r2 = M.consumeActiveSkill();
assert('TC-M2a', r2 && r2.skill === 'sprint', 'consume 가 레코드 반환');
assert('TC-M2b', !fs.existsSync(M.markerPath()), 'consume 후 파일 삭제됨 (consume-once)');
assert('TC-M2c', M.readActiveSkill() === null, 'consume 후 read → null');

// =============== TC-M3: TTL expiry ===============
M.writeActiveSkill({ skill: 'sprint', action: 'status', id: 'x' });
// backdate ts beyond TTL by rewriting file
const p = M.markerPath();
const rec = JSON.parse(fs.readFileSync(p, 'utf8'));
rec.ts = new Date(Date.now() - (M.DEFAULT_TTL_MS + 60000)).toISOString();
fs.writeFileSync(p, JSON.stringify(rec));
assert('TC-M3', M.readActiveSkill() === null, 'TTL 경과 마커 → null (stale dispatch 방지)');
M.clearActiveSkill();

// =============== TC-M4: malformed / missing safety ===============
assert('TC-M4a', M.readActiveSkill() === null, '파일 부재 → null');
fs.writeFileSync(p, '{ not json');
assert('TC-M4b', M.readActiveSkill() === null, '손상 JSON → null (방어)');
M.clearActiveSkill();
M.writeActiveSkill({ action: 'phase' }); // skill 없음
assert('TC-M4c', !fs.existsSync(p) || M.readActiveSkill() === null, 'skill 필드 없으면 무시');

// =============== TC-M5: clear idempotent ===============
M.clearActiveSkill();
M.clearActiveSkill();
assert('TC-M5', true, 'clear 반복 호출 안전 (예외 없음)');

// --- Cleanup ---
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_e) {}

console.log(`\n=== Results: ${passed}/${total} passed (${failed} failed) ===`);
process.exit(failed > 0 ? 1 : 0);
