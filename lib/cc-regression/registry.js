/**
 * CC Regression Registry — central catalog of tracked CC regressions.
 *
 * Design Ref: bkit-v2110-integrated-enhancement.design.md §3.2.1
 * Plan SC: MON-CC-02 + MON-CC-06 (19건) + ENH-262/263/264 + long-OPEN (#47482)
 *
 * Pure domain data — no FS/network. Lifecycle queries against this registry.
 *
 * @module lib/cc-regression/registry
 *
 * @version 2.1.12
 */

/**
 * @typedef {import('../domain/ports/regression-registry.port').Guard} Guard
 */

/** @type {Guard[]} */
const CC_REGRESSIONS = [
  // --- MON-CC-02: Opus 1M /compact block ---
  {
    id: 'MON-CC-02',
    issue: 'https://github.com/anthropics/claude-code/issues/47855',
    severity: 'HIGH',
    since: '2.1.6',
    expectedFix: '2.1.117', // Tentative — requires 2-week measurement (ENH-247)
    affectedFiles: ['scripts/context-compaction.js:44-56'],
    resolvedAt: null,
    notes: 'PreCompact block; v2.1.113 #32 tentative fix, v2.1.117 F6/B14 further fix; ENH-257 measurement pending.',
  },

  // --- v2.1.117 new HIGH regressions (Addendum §2) ---
  {
    id: 'ENH-262',
    issue: 'https://github.com/anthropics/claude-code/issues/51798',
    severity: 'HIGH',
    since: '2.1.10',
    expectedFix: '2.1.118', // bkit expects CC hotfix
    affectedFiles: ['scripts/pre-write.js:67-77', 'lib/domain/guards/enh-262-hooks-combo.js'],
    resolvedAt: null,
    notes: 'dangerouslyDisableSandbox + allow combo prompt regression (v2.1.112 silent → v2.1.117 prompt).',
  },
  {
    id: 'ENH-263',
    issue: 'https://github.com/anthropics/claude-code/issues/51801',
    severity: 'HIGH',
    since: '2.1.10',
    expectedFix: '2.1.118',
    affectedFiles: ['scripts/pre-write.js:65-76', 'lib/domain/guards/enh-263-claude-write.js'],
    resolvedAt: null,
    notes: 'bypassPermissions + .claude/ write — built-in guard overrides hook allow.',
  },
  {
    id: 'ENH-264',
    issue: 'https://github.com/anthropics/claude-code/issues/51809',
    severity: 'HIGH',
    since: '2.1.10',
    expectedFix: '2.1.118',
    affectedFiles: ['lib/pdca/status.js', 'lib/cc-regression/token-accountant.js'],
    resolvedAt: null,
    notes: 'Sonnet 4.6 per-turn +6~8k token overhead. v2.1.110 was last normal.',
  },

  // --- MON-CC-06: Native binary regressions (v2.1.113) ---
  {
    id: 'MON-CC-06-50383',
    issue: 'https://github.com/anthropics/claude-code/issues/50383',
    severity: 'MEDIUM',
    since: '2.1.113',
    expectedFix: null,
    affectedFiles: [],
    resolvedAt: null,
    notes: 'macOS 11 dyld — pin users to v2.1.112.',
  },
  {
    id: 'MON-CC-06-50384',
    issue: 'https://github.com/anthropics/claude-code/issues/50384',
    severity: 'MEDIUM',
    since: '2.1.113',
    expectedFix: null,
    affectedFiles: [],
    resolvedAt: null,
    notes: 'Non-AVX CPU SIGILL — pin to v2.1.112.',
  },
  {
    id: 'MON-CC-06-51165',
    issue: 'https://github.com/anthropics/claude-code/issues/51165',
    severity: 'HIGH',
    since: '2.1.114',
    expectedFix: null,
    affectedFiles: ['skills/zero-script-qa/SKILL.md:10-11'],
    resolvedAt: null,
    notes: "context:fork × disable-model-invocation regression (Windows) — bkit's sole fork user.",
  },
  // v2.1.10: Remaining MON-CC-06 native binary + v2.1.114~116 HIGH regressions
  // (lightweight entries — per-guard logic added when needed)
  { id: 'MON-CC-06-50274', issue: 'https://github.com/anthropics/claude-code/issues/50274', severity: 'MEDIUM', since: '2.1.113', expectedFix: null, affectedFiles: [], resolvedAt: null, notes: 'v2.1.113 Windows session termination.' },
  { id: 'MON-CC-06-50541', issue: 'https://github.com/anthropics/claude-code/issues/50541', severity: 'MEDIUM', since: '2.1.113', expectedFix: null, affectedFiles: [], resolvedAt: null, notes: 'Windows Program Files (x86) PATH.' },
  { id: 'MON-CC-06-50567', issue: 'https://github.com/anthropics/claude-code/issues/50567', severity: 'MEDIUM', since: '2.1.113', expectedFix: null, affectedFiles: [], resolvedAt: null, notes: 'Linux x64 baseline Bun termination.' },
  { id: 'MON-CC-06-50609', issue: 'https://github.com/anthropics/claude-code/issues/50609', severity: 'MEDIUM', since: '2.1.113', expectedFix: null, affectedFiles: [], resolvedAt: null, notes: 'Windows native binary not installed.' },
  { id: 'MON-CC-06-50616', issue: 'https://github.com/anthropics/claude-code/issues/50616', severity: 'MEDIUM', since: '2.1.113', expectedFix: null, affectedFiles: [], resolvedAt: null, notes: 'Windows CLI/VSCode silent exit.' },
  { id: 'MON-CC-06-50618', issue: 'https://github.com/anthropics/claude-code/issues/50618', severity: 'MEDIUM', since: '2.1.113', expectedFix: null, affectedFiles: [], resolvedAt: null, notes: 'macOS 26 ASP obsolete envelope.' },
  { id: 'MON-CC-06-50640', issue: 'https://github.com/anthropics/claude-code/issues/50640', severity: 'MEDIUM', since: '2.1.113', expectedFix: null, affectedFiles: [], resolvedAt: null, notes: 'Windows 11 SIGSEGV 0xc0000005.' },
  { id: 'MON-CC-06-50852', issue: 'https://github.com/anthropics/claude-code/issues/50852', severity: 'MEDIUM', since: '2.1.113', expectedFix: null, affectedFiles: [], resolvedAt: null, notes: 'Non-AVX SIGILL duplicate.' },
  { id: 'MON-CC-06-50974', issue: 'https://github.com/anthropics/claude-code/issues/50974', severity: 'MEDIUM', since: '2.1.114', expectedFix: null, affectedFiles: [], resolvedAt: null, notes: 'OTLP exporter not bundled.' },
  { id: 'MON-CC-06-51234', issue: 'https://github.com/anthropics/claude-code/issues/51234', severity: 'HIGH', since: '2.1.114', expectedFix: null, affectedFiles: [], resolvedAt: null, notes: 'skills/ directory deleted on macOS.' },
  { id: 'MON-CC-06-51266', issue: 'https://github.com/anthropics/claude-code/issues/51266', severity: 'HIGH', since: '2.1.114', expectedFix: null, affectedFiles: [], resolvedAt: null, notes: 'Grep broken w/ ignore-scripts=true (macOS).' },
  { id: 'MON-CC-06-51275', issue: 'https://github.com/anthropics/claude-code/issues/51275', severity: 'HIGH', since: '2.1.114', expectedFix: null, affectedFiles: [], resolvedAt: null, notes: 'Windows EEXIST mkdir.' },
  { id: 'MON-CC-06-51391', issue: 'https://github.com/anthropics/claude-code/issues/51391', severity: 'HIGH', since: '2.1.114', expectedFix: null, affectedFiles: [], resolvedAt: null, notes: 'Parallel PDF reads filename swap (macOS).' },

  // --- Long-OPEN (ENH-214 defense) ---
  {
    id: 'ENH-214',
    issue: 'https://github.com/anthropics/claude-code/issues/47482',
    severity: 'MEDIUM',
    since: '2.1.x',
    expectedFix: null,
    affectedFiles: ['scripts/user-prompt-handler.js'],
    resolvedAt: null,
    notes: 'output styles frontmatter not injected (9+ releases OPEN). bkit defense active.',
  },

  // --- v2.1.20 (F8 + ENH-321): Plugin manifest strict reject (R3-321) ---
  // Trigger: 외부 dogfooder 정병진 (@bj) 2026-05-26 install failure.
  // First confirmed external case of the v2.1.45+ strict plugin-manifest
  // path rejecting the v2.1.143+ official `displayName` key.
  // Reference: docs/adr/0011-plugin-manifest-schema-compliance.md
  // Reference: docs/sprint/v2120-marketplace-recovery/master-plan.md §2
  // Reference: docs/03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md
  // resolvedAt: null — bkit-side fix is advisory only (user environment
  // dependency); reconcile cycle tracks Anthropic policy changes (Q1).
  {
    id: 'R3-321',
    issue: 'https://github.com/anthropics/claude-code/issues/26555',
    severity: 'HIGH',
    since: '2.1.45',         // strict plugin-manifest path 도입 (Issue #26555 + 6 관련)
    expectedFix: '2.1.143',  // displayName official schema 인식 (docs.claude.com)
    affectedFiles: [
      '.claude-plugin/plugin.json',
      'scripts/validate-plugin.js',
      'lib/domain/rules/docs-code-invariants.js',
      'hooks/startup/session-context.js',
    ],
    resolvedAt: null,
    notes: 'displayName v2.1.142- strict reject. v2.1.143+ 공식 schema 정식 키 (cc-version-researcher 88% 신뢰도 결론). 외부 dogfooder 정병진 @bj 2026-05-26 첫 confirmed case. bkit response: F1+F4 advisory + F5 21-key whitelist + F7 claude plugin validate wire + F10 SessionStart CC detection + F11 ADR 0011 정식 채택.',
  },

  // --- v2.1.22 S1 (ENH-328): CC v2.1.147~v2.1.159 분석 신규 monitor ---
  // Reference: docs/04-report/features/cc-v2146-v2159-impact-analysis.report.md §3.5
  {
    id: 'MON-CC-NEW-CHOICE-LOOP',
    issue: 'https://github.com/anthropics/claude-code/issues/64447',
    severity: 'HIGH',
    since: '2.1.154', // v154 MCQ behavior change ("reserves multiple-choice for genuinely-undecidable")
    expectedFix: null,
    affectedFiles: [], // bkit AskUserQuestion surface (agents/skills) — monitor only, no defense yet
    resolvedAt: null,
    notes: 'P1: infinite loop awaiting user choice response. v2.1.154 MCQ/AskUserQuestion behavior change 인접. bkit AskUserQuestion 의존 surface(pm-discovery/plan-plus/rollback 등) risk. 2-cycle 관찰.',
  },
  {
    id: 'MON-CC-NEW-BG-OTEL-DROP',
    issue: 'https://github.com/anthropics/claude-code/issues/64436',
    severity: 'MEDIUM',
    since: '2.1.154', // background agents 확대 시점 인접
    expectedFix: null,
    affectedFiles: [], // bkit OTEL telemetry + background agent 흐름 — monitor only
    resolvedAt: null,
    notes: 'P2: background sessions drop work-phase OTEL logs on shutdown. bkit lib/infra/telemetry + background agent 흐름 surface. 1-cycle 관찰.',
  },

  // --- v2.1.22 S6 (ENH-366) NOTE — intentionally NOT a registry entry ---
  // The CC strict Stop-hook-output validation that S6 addressed is bkit-DISCOVERED
  // (surfaced by a live `/sprint list` error, no confirmed upstream CC GitHub issue)
  // and bkit-CONTROLLED (fully resolved by S6: 5 emitters → io.outputStopSurface/
  // outputStopAllow + cc-payload.port typedef fix). CC_REGRESSIONS tracks ONGOING
  // upstream CC regressions keyed to a unique GitHub issue URL; this item fits
  // neither (no upstream issue, already resolved). Its permanent guard is the
  // contract test tests/contract/v2122-stop-hook-output-schema.test.js, and its
  // analysis lives in docs/03-analysis/features/cc-stop-hook-schema-compliance.analysis.md.
  // (S5 QA correction: the S6 attempt to register a monitor with a placeholder/
  // duplicate issue URL violated the guard-registry unique-URL contract.)
];

/**
 * List guards currently active (not resolved).
 * @returns {Guard[]}
 */
function listActive() {
  return CC_REGRESSIONS.filter((g) => g.resolvedAt === null);
}

/**
 * Look up a guard by its ID.
 * @param {string} id
 * @returns {Guard|undefined}
 */
function lookup(id) {
  return CC_REGRESSIONS.find((g) => g.id === id);
}

/**
 * Get active guards relevant to a specific CC version.
 * @param {string} ccVersion
 * @returns {Guard[]}
 */
function getActive(ccVersion) {
  return listActive().filter((g) => {
    if (!g.expectedFix) return true; // Always active until explicit fix
    return semverLt(ccVersion, g.expectedFix);
  });
}

function semverLt(a, b) {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if (pa[i] < pb[i]) return true;
    if (pa[i] > pb[i]) return false;
  }
  return false;
}

module.exports = { CC_REGRESSIONS, listActive, lookup, getActive, semverLt };
