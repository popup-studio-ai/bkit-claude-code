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
assert('TC-A4a', tcA4first === '[bkit] PLAN f1', `1차 호출 정상 발행 (got: ${tcA4first})`);
assert('TC-A4b', tcA4second === undefined, '2차 동일 호출 시 cache hit → undefined');

// =============== TC-A5: phase change → emit ===============
resetCache();
mockUIConfig(defaultUI);
mockPdcaStatus({ primaryFeature: 'f1', currentPhase: 'plan', features: { f1: { timestamps: { lastUpdated: new Date().toISOString() } } } });
ST.generateSessionTitle({ sessionId: 's1' });
mockPdcaStatus({ primaryFeature: 'f1', currentPhase: 'design', features: { f1: { timestamps: { lastUpdated: new Date().toISOString() } } } });
const tcA5 = ST.generateSessionTitle({ sessionId: 's1' });
assert('TC-A5', tcA5 === '[bkit] DESIGN f1', `phase 변경 시 새 emit (got: ${tcA5})`);

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
assert('TC-A6b', tcA6b === '[bkit] PLAN f1', 'staleTTLHours=0 시 stale 검사 비활성 → 정상 발행');

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
assert('TC-A8', tcA8 === '[bkit] PLAN overridden', `explicit feature/action override 작동 (got: ${tcA8})`);

// =============== TC-A9: applyFormat util ===============
const tcA9 = ST.applyFormat('[bkit] {action} {feature}', { feature: 'f1', phase: 'plan', action: null });
assert('TC-A9', tcA9 === '[bkit] PLAN f1', `applyFormat — action 없을 때 phase로 대체 (got: ${tcA9})`);

// =============== TC-A10: cache file written ===============
resetCache();
mockUIConfig(defaultUI);
mockPdcaStatus({ primaryFeature: 'f1', currentPhase: 'plan', features: { f1: { timestamps: { lastUpdated: new Date().toISOString() } } } });
ST.generateSessionTitle({ sessionId: 's1' });
const cached = Cache.readCache();
assert('TC-A10', cached && cached.feature === 'f1' && cached.phase === 'plan', 'cache 파일이 정상 기록됨');

// --- Cleanup ---
resetCache();
try { fs.rmSync(tmpProject, { recursive: true, force: true }); } catch (_e) {}

// --- Results ---
console.log(`\n=== Results: ${passed}/${total} passed (${failed} failed) ===`);
process.exit(failed > 0 ? 1 : 0);
