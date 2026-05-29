/**
 * Sprint Executive Summary Module (Issue #113 — v2.1.21)
 *
 * Sprint 전용 Executive Summary 생성/포맷터. PDCA 의
 * lib/pdca/executive-summary.js 와 **shape 이 다르다**:
 *
 *   - PDCA  : Problem / Solution / Function UX Effect / Core Value (per-feature)
 *   - Sprint: Mission / Result / matchRate / Cross-Sprint Integration /
 *             Invariant / `claude plugin validate`  (per templates/sprint/report.template.md §1)
 *
 * 따라서 PDCA 모듈을 재사용하지 않고 별도 구현한다(Issue #113 §D).
 *
 * 본 모듈은 **순수**하다 — 디스크 I/O 없음. sprint state 객체를 입력받아
 * 데이터 구조/문자열을 반환한다. side-effect(파일 기록)는 호출부 책임
 * (lib/application/quality-gates/failure-reporter.js 의 pure-builder /
 * side-effecting-writer 분리 규율 미러).
 *
 * @module lib/sprint/executive-summary
 * @version 2.1.21
 * @since 2.1.21
 */

'use strict';

// 순수 함수만 import (디스크 의존 없음 — kpi-resolver/phases 모두 순수)
let _kpi = null;
function getKpi() {
  if (!_kpi) _kpi = require('../application/sprint-lifecycle/kpi-resolver');
  return _kpi;
}
let _phases = null;
function getPhases() {
  if (!_phases) _phases = require('../application/sprint-lifecycle/phases');
  return _phases;
}

/**
 * Sprint phase 별 다음 사용자 액션 묶음.
 * @param {string} phase - 현재 sprint phase
 * @param {string} sprintId
 * @returns {Array<{label:string, command:string, description:string}>}
 */
function buildNextActions(phase, sprintId) {
  const id = sprintId || '<id>';
  const sets = {
    prd:     [{ label: 'Start Plan', command: `/sprint phase ${id} --to plan`, description: 'PRD 완료 → Plan phase 진입' }],
    plan:    [{ label: 'Start Design', command: `/sprint phase ${id} --to design`, description: 'Plan 완료 → Design phase 진입' }],
    design:  [{ label: 'Start Do', command: `/sprint phase ${id} --to do`, description: 'Design 완료 → 구현 phase 진입' }],
    do:      [{ label: 'Run Iterate', command: `/sprint iterate ${id}`, description: 'matchRate 100 루프 진입' }],
    iterate: [{ label: 'Run QA', command: `/sprint phase ${id} --to qa`, description: 'matchRate 충족 → 7-Layer S1 검증' }],
    qa:      [{ label: 'Generate Report', command: `/sprint phase ${id} --to report`, description: 'QA 통과 → 종합 보고서' }],
    report:  [{ label: 'Archive', command: `/sprint archive ${id}`, description: '보고서 완료 → terminal archived' }],
    archived:[{ label: 'List Sprints', command: `/sprint list`, description: 'Sprint 종료됨 — 다른 sprint 확인' }],
  };
  return sets[phase] || sets.prd;
}

/**
 * sprint.featureMap 을 per-feature 진행 행 배열로 정규화.
 * F8(/sprint status·watch)과 F4(exec summary)가 공유하는 단일 소스.
 *
 * @param {object} sprint
 * @returns {Array<{name:string, phase:string, matchRate:(number|null), s1Score:(number|null), scope:(string|null)}>}
 */
function featureRows(sprint) {
  const fm = (sprint && sprint.featureMap) || {};
  const names = Object.keys(fm);
  // featureMap 이 비어있으면 sprint.features(이름 배열)로 fallback
  if (names.length === 0 && Array.isArray(sprint && sprint.features)) {
    return sprint.features.map((n) => ({
      name: typeof n === 'string' ? n : (n && n.name) || String(n),
      phase: null, matchRate: null, s1Score: null, scope: null,
    }));
  }
  return names.map((name) => {
    const f = fm[name] || {};
    return {
      name,
      phase: f.phase || null,
      matchRate: (typeof f.matchRate === 'number') ? f.matchRate : null,
      s1Score: (typeof f.s1Score === 'number') ? f.s1Score : null,
      scope: f.scope || null,
    };
  });
}

/**
 * Sprint Executive Summary 데이터 구조 생성 (순수).
 *
 * @param {object} sprint - sprint state 객체
 * @param {object} [context]
 * @param {string} [context.mission]                - 미지정 시 sprint.name 사용
 * @param {string} [context.result]                 - 미지정 시 phase+feature 진행으로 자동 산출
 * @param {string} [context.crossSprintIntegration] - 미지정 null
 * @param {string} [context.invariant]              - 미지정 null
 * @param {string} [context.pluginValidate]         - 미지정 null
 * @param {string} [context.previousPhase]          - phase 전이 시 이전 phase
 * @returns {object}
 */
function generateSprintExecutiveSummary(sprint, context = {}) {
  const s = sprint || {};
  const kpi = getKpi().resolveKpi(s) || {};
  const rows = featureRows(s);
  const completed = rows.filter((r) => typeof r.matchRate === 'number' && r.matchRate >= 100).length;
  const total = rows.length;

  // Result 자동 산출 (caller override 가능)
  let result = context.result;
  if (result == null) {
    if (s.phase === 'archived') result = `✅ 완료 — ${completed}/${total} features`;
    else result = `진행 중 — phase ${s.phase || '?'} · ${completed}/${total} features 완료`;
  }

  return {
    type: 'sprint-executive-summary',
    sprintId: s.id || null,
    name: s.name || null,
    phase: s.phase || null,
    previousPhase: context.previousPhase || null,
    summary: {
      mission: context.mission != null ? context.mission : (s.name || null),
      result,
      matchRate: (typeof kpi.matchRate === 'number') ? kpi.matchRate : null,
      crossSprintIntegration: context.crossSprintIntegration != null ? context.crossSprintIntegration : null,
      invariant: context.invariant != null ? context.invariant : null,
      pluginValidate: context.pluginValidate != null ? context.pluginValidate : null,
    },
    features: rows,
    kpi: {
      matchRate: (typeof kpi.matchRate === 'number') ? kpi.matchRate : null,
      criticalIssues: (typeof kpi.criticalIssues === 'number') ? kpi.criticalIssues : 0,
      featuresCompleted: completed,
      featuresTotal: total,
    },
    nextActions: buildNextActions(s.phase, s.id),
    metadata: {
      trustLevel: (s.autoRun && s.autoRun.trustLevelAtStart) || null,
      autoPauseArmed: (s.autoPause && s.autoPause.armed) || [],
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * per-feature 진행 표 렌더 (F8 /sprint status·watch + exec summary 공유).
 * @param {Array} rows - featureRows() 결과
 * @returns {string}
 */
function formatFeatureTable(rows) {
  if (!rows || rows.length === 0) return '  (features 미등록)';
  const fmtPct = (v) => (typeof v === 'number' ? `${v}%` : '—');
  const lines = rows.map((r) => {
    const name = `[${r.name}]`.padEnd(16);
    const ph = String(r.phase || '—').padEnd(8);
    const mr = `matchRate ${fmtPct(r.matchRate)}`.padEnd(18);
    const s1 = `s1Score ${typeof r.s1Score === 'number' ? r.s1Score : 'n/a'}`;
    return `  ${name} ${ph} ${mr} ${s1}`;
  });
  return lines.join('\n');
}

/**
 * Sprint Executive Summary 를 화면 출력 문자열로 포맷.
 * @param {object} summary - generateSprintExecutiveSummary() 결과
 * @param {'full'|'compact'} [format='full']
 * @returns {string}
 */
function formatSprintExecutiveSummary(summary, format = 'full') {
  if (!summary) return '';
  const s = summary.summary || {};
  const date = (summary.metadata && summary.metadata.generatedAt || '').split('T')[0] || '';
  const phaseLine = summary.previousPhase
    ? `${summary.previousPhase} → ${summary.phase}`
    : `${summary.phase || '?'}`;

  if (format === 'compact') {
    return [
      `-- SPRINT EXEC: ${summary.sprintId} -- ${date} --`,
      `  MISSION   ${s.mission || '-'}`,
      `  RESULT    ${s.result || '-'}`,
      `  matchRate ${s.matchRate == null ? '-' : s.matchRate}`,
      `------------------------------------------`,
    ].join('\n');
  }

  const lines = [
    `SPRINT EXECUTIVE SUMMARY`,
    `  ${summary.sprintId || '?'}  (phase ${phaseLine})  ${date}`,
    '',
    `  [MISSION]`,
    `  ${s.mission || '-'}`,
    '',
    `  [RESULT]`,
    `  ${s.result || '-'}`,
    '',
    `  [matchRate]   ${s.matchRate == null ? '-' : `${s.matchRate}%`}`,
    `  [Cross-Sprint Integration]   ${s.crossSprintIntegration || '-'}`,
    `  [Invariant]   ${s.invariant || '-'}`,
    `  [claude plugin validate]   ${s.pluginValidate || '-'}`,
    '',
    `  FEATURES (${summary.kpi.featuresCompleted}/${summary.kpi.featuresTotal})`,
    formatFeatureTable(summary.features),
  ];

  if (summary.nextActions && summary.nextActions.length) {
    lines.push('', `  NEXT ACTION`);
    summary.nextActions.forEach((a, i) => {
      lines.push(`  [${i + 1}] ${a.label}  ${a.command}`);
    });
  }

  return lines.join('\n');
}

/**
 * Quality gate one-line summary (M1=passed M3=passed S1=n/a ...).
 * @param {object} sprint
 * @returns {string}
 */
function formatGatesLine(sprint) {
  const qg = (sprint && sprint.qualityGates) || {};
  const keys = Object.keys(qg);
  if (keys.length === 0) return '  (gates 미설정)';
  const parts = keys.map((k) => {
    const g = qg[k] || {};
    const short = k.split('_')[0]; // M1_matchRate → M1
    let state;
    if (g.passed === true) state = 'passed';
    else if (g.passed === false) state = 'failed';
    else state = 'n/a';
    return `${short}=${state}`;
  });
  return '  ' + parts.join('  ');
}

/**
 * /sprint status·watch human-readable screen (Issue #113 §C — F8).
 * Replaces the raw-JSON-only dump with a fixed-width status block.
 *
 * @param {object} sprint
 * @param {object} [extras]
 * @param {Array}  [extras.triggers] - fired auto-pause triggers (watch)
 * @returns {string}
 */
function formatStatusScreen(sprint, extras = {}) {
  if (!sprint) return '(sprint 없음)';
  const order = getPhases().SPRINT_PHASE_ORDER;
  const idx = order.indexOf(sprint.phase);
  const phasePos = idx >= 0 ? `(${idx + 1}/${order.length})` : '';
  const trust = (sprint.autoRun && sprint.autoRun.trustLevelAtStart) || '—';
  const armed = (sprint.autoPause && sprint.autoPause.armed) || [];
  const fired = Array.isArray(extras.triggers) ? extras.triggers.length : 0;
  const rows = featureRows(sprint);
  const lastAdvance = (sprint.autoRun && sprint.autoRun.lastAutoAdvanceAt) || '—';

  const lines = [
    `SPRINT: ${sprint.id} — "${sprint.name || ''}"`,
    `Phase: ${sprint.phase || '?'} ${phasePos}  Trust: ${trust}  Auto-pause: ${fired} fired / ${armed.length} armed`,
    '',
    `Features (${rows.length}):`,
    formatFeatureTable(rows),
    '',
    `Quality Gates:`,
    formatGatesLine(sprint),
    '',
    `Last advance: ${lastAdvance}`,
  ];
  return lines.join('\n');
}

module.exports = {
  generateSprintExecutiveSummary,
  formatSprintExecutiveSummary,
  formatFeatureTable,
  formatGatesLine,
  formatStatusScreen,
  featureRows,
  buildNextActions,
};
