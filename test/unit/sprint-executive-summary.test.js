'use strict';
/**
 * Unit Tests for lib/sprint/executive-summary.js (Issue #113 — v2.1.21)
 *
 * Sprint-shape Executive Summary: Mission / Result / matchRate / CSI /
 * Invariant / plugin validate (PDCA shape 와 구분).
 *
 * Pattern: console.assert based (matches existing test/unit/*.test.js convention).
 */

const ES = require('../../lib/sprint/executive-summary');

let passed = 0, failed = 0, total = 0;
function assert(id, condition, message) {
  total++;
  if (condition) { passed++; console.log(`  PASS: ${id} - ${message}`); }
  else { failed++; console.error(`  FAIL: ${id} - ${message}`); }
}

// --- fixture sprint ---
const sprint = {
  id: 'demo-sprint',
  name: 'Demo Sprint Mission',
  phase: 'do',
  features: ['auth', 'billing'],
  featureMap: {
    auth:    { phase: 'do', matchRate: 100, s1Score: 100, scope: 'P0' },
    billing: { phase: 'design', matchRate: 60, scope: 'P1' },
  },
  qualityGates: {
    M1_matchRate: { current: 80, threshold: 90, passed: false },
    M3_criticalIssueCount: { current: 0, threshold: 0, passed: true },
  },
  autoRun: { trustLevelAtStart: 'L4' },
  autoPause: { armed: ['QUALITY_GATE_FAIL'] },
};

// =============== TC-E1: generate basic shape ===============
const sum = ES.generateSprintExecutiveSummary(sprint);
assert('TC-E1a', sum.type === 'sprint-executive-summary', 'type 식별자');
assert('TC-E1b', sum.summary.mission === 'Demo Sprint Mission', 'mission 기본값 = sprint.name');
assert('TC-E1c', sum.summary.matchRate === 80, 'matchRate = qualityGates.M1 current (kpi-resolver)');
assert('TC-E1d', sum.kpi.featuresCompleted === 1 && sum.kpi.featuresTotal === 2, 'featureMap matchRate>=100 집계 (auth만 완료)');

// =============== TC-E2: sprint shape != PDCA shape ===============
const keys = Object.keys(sum.summary);
assert('TC-E2a', keys.includes('mission') && keys.includes('crossSprintIntegration') && keys.includes('invariant') && keys.includes('pluginValidate'),
  'Sprint shape 필드(mission/CSI/invariant/pluginValidate) 보유');
assert('TC-E2b', !keys.includes('problem') && !keys.includes('coreValue'),
  'PDCA shape 필드(problem/coreValue) 미보유 — shape 분리 확인');

// =============== TC-E3: context override ===============
const sum2 = ES.generateSprintExecutiveSummary(sprint, {
  mission: 'Custom Mission', crossSprintIntegration: '3/3 CSI PASS', invariant: '0 변경', pluginValidate: 'Exit 0',
  previousPhase: 'design',
});
assert('TC-E3a', sum2.summary.mission === 'Custom Mission', 'context.mission override');
assert('TC-E3b', sum2.summary.crossSprintIntegration === '3/3 CSI PASS' && sum2.summary.invariant === '0 변경' && sum2.summary.pluginValidate === 'Exit 0', 'CSI/invariant/pluginValidate override');
assert('TC-E3c', sum2.previousPhase === 'design', 'previousPhase 기록(phase 전이용)');

// =============== TC-E4: next actions per phase ===============
const naDo = ES.buildNextActions('do', 'demo-sprint');
const naReport = ES.buildNextActions('report', 'demo-sprint');
assert('TC-E4a', naDo[0].command === '/sprint iterate demo-sprint', 'do phase → iterate 권장');
assert('TC-E4b', naReport[0].command === '/sprint archive demo-sprint', 'report phase → archive 권장');

// =============== TC-E5: feature table render ===============
const rows = ES.featureRows(sprint);
const table = ES.formatFeatureTable(rows);
assert('TC-E5a', rows.length === 2, 'featureRows 2건');
assert('TC-E5b', /\[auth\]/.test(table) && /matchRate 100%/.test(table) && /s1Score 100/.test(table), 'auth 행 렌더(matchRate/s1Score)');
assert('TC-E5c', /\[billing\]/.test(table) && /matchRate 60%/.test(table) && /s1Score n\/a/.test(table), 'billing 행 렌더(s1Score 미측정 n/a)');

// =============== TC-E6: full format string ===============
const text = ES.formatSprintExecutiveSummary(sum2, 'full');
assert('TC-E6a', /SPRINT EXECUTIVE SUMMARY/.test(text), 'full 포맷 헤더');
assert('TC-E6b', /design → do/.test(text), 'phase 전이 표기(previousPhase → phase)');
assert('TC-E6c', /\[MISSION\]/.test(text) && /Custom Mission/.test(text), 'MISSION 섹션 + 값');
assert('TC-E6d', /NEXT ACTION/.test(text) && /\/sprint iterate/.test(text), 'NEXT ACTION 섹션');

// =============== TC-E7: empty featureMap fallback ===============
const bare = ES.generateSprintExecutiveSummary({ id: 's', name: 'n', phase: 'prd', features: ['x'] });
assert('TC-E7', bare.features.length === 1 && bare.features[0].name === 'x', 'featureMap 비어있으면 features 배열 fallback');

// =============== TC-E8: null/undefined safety ===============
assert('TC-E8a', ES.formatSprintExecutiveSummary(null) === '', 'null summary → 빈 문자열');
const emptySum = ES.generateSprintExecutiveSummary(null);
assert('TC-E8b', emptySum.type === 'sprint-executive-summary' && emptySum.features.length === 0, 'null sprint 방어');

// =============== TC-E9: formatStatusScreen (#113 §C — F8) ===============
const sprintWithAuto = Object.assign({}, sprint, {
  autoRun: { trustLevelAtStart: 'L4', lastAutoAdvanceAt: '2026-05-29T01:00:00Z' },
  autoPause: { armed: ['QUALITY_GATE_FAIL', 'BUDGET_EXCEEDED'] },
});
const screen = ES.formatStatusScreen(sprintWithAuto);
assert('TC-E9a', /SPRINT: demo-sprint — "Demo Sprint Mission"/.test(screen), 'status 헤더(id + name)');
assert('TC-E9b', /Phase: do \(4\/8\)/.test(screen), 'phase + 위치(do = 4/8) 표기');
assert('TC-E9c', /Trust: L4/.test(screen) && /2 armed/.test(screen), 'Trust + auto-pause armed 수');
assert('TC-E9d', /\[auth\]/.test(screen) && /matchRate 100%/.test(screen), 'per-feature 표(formatFeatureTable 재사용)');
assert('TC-E9e', /Quality Gates:/.test(screen) && /M1=failed/.test(screen) && /M3=passed/.test(screen), 'gates 한 줄 요약');

// =============== TC-E10: formatStatusScreen 방어 ===============
assert('TC-E10a', ES.formatStatusScreen(null) === '(sprint 없음)', 'null sprint 방어');
const watchScreen = ES.formatStatusScreen(sprintWithAuto, { triggers: [{ id: 'QUALITY_GATE_FAIL' }] });
assert('TC-E10b', /1 fired \/ 2 armed/.test(watchScreen), 'watch: fired triggers 수 반영');

// --- Results ---
console.log(`\n=== Results: ${passed}/${total} passed (${failed} failed) ===`);
process.exit(failed > 0 ? 1 : 0);
