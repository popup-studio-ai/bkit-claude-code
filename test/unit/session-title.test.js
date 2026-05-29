'use strict';
/**
 * Unit Tests for lib/pdca/session-title.js (Issue #77 Phase A)
 *
 * 6 TC: TC-A1 (opt-out), TC-A4 (cache hit), TC-A5 (phase change),
 *       TC-A6 (stale TTL), TC-A7 (PDCA absent), TC-A8 (action override)
 *
 * Pattern: console.assert based (matches existing tests/unit/*.test.js convention).
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

// Use isolated temp dir as PROJECT_DIR so cache writes don't pollute repo
const tmpProject = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-st-test-'));
process.env.CLAUDE_PROJECT_DIR = tmpProject;

// Clear module cache so platform.js picks up new env
Object.keys(require.cache).forEach((k) => {
  if (k.includes('/lib/') || k.includes('/bkit-claude-code/')) delete require.cache[k];
});

const ST = require('../../lib/pdca/session-title');
const Cache = require('../../lib/core/session-title-cache');

let passed = 0, failed = 0, total = 0;
function assert(id, condition, message) {
  total++;
  if (condition) { passed++; console.log(`  PASS: ${id} - ${message}`); }
  else { failed++; console.error(`  FAIL: ${id} - ${message}`); }
}

// --- Helpers ---
function mockPdcaStatus(status) {
  const statusMod = require('../../lib/pdca/status');
  statusMod.getPdcaStatusFull = () => status;
}
function mockUIConfig(ui) {
  const cfg = require('../../lib/core/config');
  cfg.getUIConfig = () => ui;
}
function resetCache() { Cache.clearCache(); }

const defaultUI = {
  sessionTitle: { enabled: true, staleTTLHours: 24, format: '[bkit] {action} {feature}' },
};

// =============== TC-A1: opt-out gate ===============
resetCache();
mockUIConfig({ sessionTitle: { enabled: false, staleTTLHours: 24, format: '[bkit] {action} {feature}' } });
mockPdcaStatus({ primaryFeature: 'f1', currentPhase: 'plan', features: { f1: { timestamps: { lastUpdated: new Date().toISOString() } } } });
const tcA1 = ST.generateSessionTitle({ sessionId: 's1' });
assert('TC-A1', tcA1 === undefined, 'ui.sessionTitle.enabled=false 시 undefined 반환 (CC auto-title 보존)');

// =============== TC-A4: phase-change cache hit ===============
resetCache();
mockUIConfig(defaultUI);
mockPdcaStatus({ primaryFeature: 'f1', currentPhase: 'plan', features: { f1: { timestamps: { lastUpdated: new Date().toISOString() } } } });
const tcA4first = ST.generateSessionTitle({ sessionId: 's1' });
const tcA4second = ST.generateSessionTitle({ sessionId: 's1' });
// v2.1.21 (#111 Phase B): title 에 sessionId 기반 tag 부착
assert('TC-A4a', tcA4first === `[bkit] PLAN f1 ·${ST.sessionTag('s1')}`, `1차 호출 정상 발행 (got: ${tcA4first})`);
assert('TC-A4b', tcA4second === undefined, '2차 동일 호출 시 cache hit → undefined');

// =============== TC-A5: phase change → emit ===============
resetCache();
mockUIConfig(defaultUI);
mockPdcaStatus({ primaryFeature: 'f1', currentPhase: 'plan', features: { f1: { timestamps: { lastUpdated: new Date().toISOString() } } } });
ST.generateSessionTitle({ sessionId: 's1' });
mockPdcaStatus({ primaryFeature: 'f1', currentPhase: 'design', features: { f1: { timestamps: { lastUpdated: new Date().toISOString() } } } });
const tcA5 = ST.generateSessionTitle({ sessionId: 's1' });
assert('TC-A5', tcA5 === `[bkit] DESIGN f1 ·${ST.sessionTag('s1')}`, `phase 변경 시 새 emit (got: ${tcA5})`);

// =============== TC-A6: stale feature TTL ===============
resetCache();
mockUIConfig(defaultUI);
const stale = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(); // 25h ago
mockPdcaStatus({ primaryFeature: 'f1', currentPhase: 'plan', features: { f1: { timestamps: { lastUpdated: stale } } } });
const tcA6 = ST.generateSessionTitle({ sessionId: 's1' });
assert('TC-A6', tcA6 === undefined, '24h 초과 stale feature → undefined (사용자 사례 "ui" 자동 정리)');

// =============== TC-A6b: stale TTL = 0 disables check ===============
resetCache();
mockUIConfig({ sessionTitle: { enabled: true, staleTTLHours: 0, format: '[bkit] {action} {feature}' } });
mockPdcaStatus({ primaryFeature: 'f1', currentPhase: 'plan', features: { f1: { timestamps: { lastUpdated: stale } } } });
const tcA6b = ST.generateSessionTitle({ sessionId: 's1' });
assert('TC-A6b', tcA6b === `[bkit] PLAN f1 ·${ST.sessionTag('s1')}`, 'staleTTLHours=0 시 stale 검사 비활성 → 정상 발행');

// =============== TC-A7: PDCA absent → undefined ===============
resetCache();
mockUIConfig(defaultUI);
mockPdcaStatus(null);
const tcA7 = ST.generateSessionTitle({ sessionId: 's1' });
assert('TC-A7', tcA7 === undefined, 'PDCA 없음 → undefined (CC auto-title 사용)');

// =============== TC-A8: explicit action override ===============
resetCache();
mockUIConfig(defaultUI);
mockPdcaStatus({ primaryFeature: 'f1', currentPhase: 'plan', features: { f1: { timestamps: { lastUpdated: new Date().toISOString() } } } });
const tcA8 = ST.generateSessionTitle({ sessionId: 's1', action: 'PLAN', feature: 'overridden' });
assert('TC-A8', tcA8 === `[bkit] PLAN overridden ·${ST.sessionTag('s1')}`, `explicit feature/action override 작동 (got: ${tcA8})`);

// =============== TC-A9: applyFormat util ===============
const tcA9 = ST.applyFormat('[bkit] {action} {feature}', { feature: 'f1', phase: 'plan', action: null });
assert('TC-A9', tcA9 === '[bkit] PLAN f1', `applyFormat — action 없을 때 phase로 대체 (got: ${tcA9})`);

// =============== TC-A10: cache file written ===============
resetCache();
mockUIConfig(defaultUI);
mockPdcaStatus({ primaryFeature: 'f1', currentPhase: 'plan', features: { f1: { timestamps: { lastUpdated: new Date().toISOString() } } } });
ST.generateSessionTitle({ sessionId: 's1' });
const cached = Cache.readCache();
// v2.1.21 (#111 Phase B): cache 는 sessions[sessionId] map
const recA10 = cached && cached.sessions && cached.sessions['s1'];
assert('TC-A10', !!recA10 && recA10.feature === 'f1' && recA10.phase === 'plan', 'cache 파일이 sessions map 으로 정상 기록됨');

// =====================================================================
// Issue #111 Phase B (v2.1.21) — 병렬 세션 격리 + dedup 복원 + 마이그레이션
// =====================================================================

// =============== TC-B1: 두 병렬 세션 → DISTINCT title ===============
resetCache();
mockUIConfig(defaultUI);
mockPdcaStatus({ primaryFeature: 'f1', currentPhase: 'plan', features: { f1: { timestamps: { lastUpdated: new Date().toISOString() } } } });
const tcB1a = ST.generateSessionTitle({ sessionId: 'sessionA' });
const tcB1b = ST.generateSessionTitle({ sessionId: 'sessionB' });
assert('TC-B1a', typeof tcB1a === 'string' && typeof tcB1b === 'string', `두 세션 모두 title 발행 (A: ${tcB1a}, B: ${tcB1b})`);
assert('TC-B1b', tcB1a !== tcB1b, `동일 feature/phase 라도 sessionId 다르면 DISTINCT title (A: ${tcB1a} ≠ B: ${tcB1b})`);

// =============== TC-B2: clobber 후 dedup 복원 (핵심 회귀 방지) ===============
// 시나리오: A 발행 → B 발행(레거시라면 A record clobber) → A 재발행(phase 변화 없음)
// 기대: A 재발행은 undefined (자기 세션 cache hit) — ENH-228 dedup 복원
resetCache();
mockUIConfig(defaultUI);
mockPdcaStatus({ primaryFeature: 'f1', currentPhase: 'plan', features: { f1: { timestamps: { lastUpdated: new Date().toISOString() } } } });
ST.generateSessionTitle({ sessionId: 'sessionA' });   // A 1차
ST.generateSessionTitle({ sessionId: 'sessionB' });   // B 1차 (레거시: A clobber)
const tcB2 = ST.generateSessionTitle({ sessionId: 'sessionA' }); // A 재발행 (변화 없음)
assert('TC-B2', tcB2 === undefined, 'clobber 시도 후에도 A 재발행은 undefined (per-session dedup 복원, ENH-228)');

// =============== TC-B3: legacy flat-record 마이그레이션 ===============
resetCache();
const legacyPath = Cache.getCachePath();
fs.mkdirSync(path.dirname(legacyPath), { recursive: true });
fs.writeFileSync(legacyPath, JSON.stringify({
  sessionId: 'legacySession', feature: 'oldf', phase: 'design', action: null,
  timestamp: new Date().toISOString(),
}, null, 2));
const migrated = Cache.readCache();
const recB3 = migrated && migrated.sessions && migrated.sessions['legacySession'];
assert('TC-B3a', !!migrated && !!migrated.sessions, 'legacy flat record → sessions map 으로 정규화');
assert('TC-B3b', !!recB3 && recB3.feature === 'oldf' && recB3.phase === 'design', 'legacy record 내용이 sessionId 키로 보존됨');

// =============== TC-B4: sessionId 부재 시 tag 생략 (backward-compat) ===============
resetCache();
mockUIConfig(defaultUI);
mockPdcaStatus({ primaryFeature: 'f1', currentPhase: 'plan', features: { f1: { timestamps: { lastUpdated: new Date().toISOString() } } } });
const tcB4 = ST.generateSessionTitle({});  // sessionId 없음
assert('TC-B4', tcB4 === '[bkit] PLAN f1', `sessionId 부재 시 tag 생략 → 기존 포맷 유지 (got: ${tcB4})`);

// =============== TC-B5: sessionTag 결정성(stable) ===============
const tagX1 = ST.sessionTag('abc');
const tagX2 = ST.sessionTag('abc');
assert('TC-B5a', tagX1 === tagX2 && tagX1.length === 4, `sessionTag 결정적 + 4 hex (got: ${tagX1})`);
assert('TC-B5b', ST.sessionTag('') === '' && ST.sessionTag(null) === '', 'sessionId 부재 → 빈 tag');

// --- Cleanup ---
resetCache();
try { fs.rmSync(tmpProject, { recursive: true, force: true }); } catch (_e) {}

// --- Results ---
console.log(`\n=== Results: ${passed}/${total} passed (${failed} failed) ===`);
process.exit(failed > 0 ? 1 : 0);
