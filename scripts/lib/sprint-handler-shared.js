'use strict';
/**
 * sprint-handler-shared.js — shared primitives for the sprint-handler split.
 * Extracted verbatim from scripts/sprint-handler.js (v2.1.22 S3a ENH-343).
 * Trust consts + helpers, flag/context parsing, version/dogfood derivation,
 * quality-gate runners, carry-item + features parsing. Imported by the
 * dispatcher (scripts/sprint-handler.js) and both handler modules. Require
 * paths rebased one level deeper (../lib → ../../lib).
 * @module scripts/lib/sprint-handler-shared
 */

const {
  createSprintInfra,
  createGapDetector,
  createAutoFixer,
  createDataFlowValidator,
} = require('../../lib/infra/sprint');
const lifecycle = require('../../lib/application/sprint-lifecycle');
const domain = require('../../lib/domain/sprint');

/**
 * Valid trust levels (L0-L4) per Master Plan §11.2 SPRINT_AUTORUN_SCOPE.
 * @type {ReadonlyArray<'L0'|'L1'|'L2'|'L3'|'L4'>}
 */
const VALID_TRUST_LEVELS = Object.freeze(['L0', 'L1', 'L2', 'L3', 'L4']);

/**
 * @type {'L2'}
 *
 * v2.1.19 S1 F1-4 (CTO M-1): default lowered from L3 to L2 per Safe Defaults
 * principle (master plan §3.2). Aligns with entity.js createSprint default
 * (eliminates the v2.1.16~v2.1.18 drift between handler default L3 and
 * entity default L2). User-explicit --trust L1 emits sprint_trust_warning
 * audit + stderr warning re: preview-mode lockout (Issue #101 follow-up).
 */
const DEFAULT_TRUST_LEVEL = 'L2';

/**
 * Normalize trust level from 3 user input forms to a single internal key.
 *
 * Precedence: trustLevel > trust > trustLevelAtStart > default.
 * Case-insensitive (toUpperCase normalization). Invalid values fall back
 * to DEFAULT_TRUST_LEVEL.
 *
 * @param {Object} args
 * @returns {('L0'|'L1'|'L2'|'L3'|'L4')}
 */
function normalizeTrustLevel(args) {
  if (!args) return DEFAULT_TRUST_LEVEL;
  const raw = args.trustLevel || args.trust || args.trustLevelAtStart;
  if (typeof raw !== 'string') return DEFAULT_TRUST_LEVEL;
  const upper = raw.toUpperCase();
  return VALID_TRUST_LEVELS.includes(upper) ? upper : DEFAULT_TRUST_LEVEL;
}

// ============================================================
// v2.1.18 (Issue #101, F2) — Trust mutation helpers
// ============================================================

/** Numeric rank for trust level comparison (downgrade/severity calc). */
const LEVEL_RANK = Object.freeze({ L0: 0, L1: 1, L2: 2, L3: 3, L4: 4 });

/**
 * Check if a trust-level transition is a downgrade.
 * @param {string} from
 * @param {string} to
 * @returns {boolean}
 */
function isDowngrade(from, to) {
  return LEVEL_RANK[to] < LEVEL_RANK[from];
}

/**
 * Classify trust-level transition severity.
 * @param {string} from
 * @param {string} to
 * @returns {'upgrade'|'minor'|'major'} 'major' for ≥2-level downgrade.
 */
function severity(from, to) {
  const diff = LEVEL_RANK[from] - LEVEL_RANK[to];
  if (diff <= 0) return 'upgrade';     // L1 → L3
  if (diff === 1) return 'minor';      // L3 → L2
  return 'major';                       // L4 → L1 (or larger)
}

/**
 * Load trust score from .bkit/state/trust-profile.json (0-100, 6-component
 * weighted sum). Returns deps.trustScore when injected (for testing) or 0
 * when trust-profile is absent/unreadable.
 *
 * @param {{ trustScore?: number }} [deps]
 * @returns {Promise<number>}
 */
async function loadTrustScore(deps) {
  if (deps && typeof deps.trustScore === 'number') return deps.trustScore;
  try {
    const fsp = require('fs').promises;
    const path = require('path');
    const projectRoot = process.cwd();
    const tp = await fsp.readFile(
      path.join(projectRoot, '.bkit', 'state', 'trust-profile.json'),
      'utf8'
    );
    const parsed = JSON.parse(tp);
    if (typeof parsed.trustScore === 'number') return parsed.trustScore;
  } catch (_) {
    // trust-profile missing or unreadable — fall back to 0 (most restrictive)
  }
  return 0;
}

/**
 * Resolve effective actor for audit (CTO §E6 spoofing mitigation).
 * Priority: explicit args.actor (if valid) > env CLAUDE_AGENT_ID → 'agent' >
 * default 'user'.
 *
 * @param {Object} args
 * @returns {'user'|'agent'|'system'}
 */
function resolveActor(args) {
  if (args && typeof args.actor === 'string') {
    if (['user', 'agent', 'system'].includes(args.actor)) return args.actor;
  }
  if (process.env.CLAUDE_AGENT_ID) return 'agent';
  return 'user';
}

/**
 * Parse `--key value` and `--key=value` flag patterns from an argv slice.
 *
 * Boolean flags: `--key` followed by another `--flag` or end of argv → true.
 *
 * @param {string[]} argv
 * @returns {Object}
 */
function parseFlags(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (typeof tok !== 'string' || !tok.startsWith('--')) continue;
    const eq = tok.indexOf('=');
    if (eq !== -1) {
      out[tok.slice(2, eq)] = tok.slice(eq + 1);
      continue;
    }
    const key = tok.slice(2);
    const next = argv[i + 1];
    if (next === undefined || (typeof next === 'string' && next.startsWith('--'))) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

function defaultContext() {
  return { WHY: '', WHO: '', RISK: '', SUCCESS: '', SCOPE: '' };
}

/**
 * Validate a release version string against semver-lite (no build metadata).
 * Accepts: 2.1.20, v2.1.20, 2.1.20-rc.0, v2.1.20-beta.1
 * Rejects: 2.1, 2.1.20+build.1
 *
 * @param {string} v
 * @returns {boolean}
 */
function isValidReleaseVersion(v) {
  return typeof v === 'string' && /^v?\d+\.\d+\.\d+(?:-[\w.]+)?$/.test(v);
}

/**
 * Resolve current bkit version from bkit.config.json (cached read).
 * Returns 'unknown' on filesystem error.
 *
 * @returns {string}
 */
function resolveBkitVersion() {
  try { return require('../../bkit.config.json').version; }
  catch (_) { return 'unknown'; }
}

/**
 * Resolve current git HEAD commit hash. Returns 'unknown' on git failure
 * (e.g., when running outside a git work tree or on a detached process).
 *
 * @returns {string}
 */
function resolveBkitCommit() {
  try {
    return require('child_process').execSync('git rev-parse HEAD', {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch (_) { return 'unknown'; }
}

/**
 * Auto-derive Context Anchor (WHY/WHO/RISK/SUCCESS/SCOPE) for a self-dogfood
 * sprint. Templated from release tag — NOT user-customizable in dogfood mode
 * (anti-mission: closed enum, no general primitive).
 *
 * @param {string} releaseVersion
 * @param {string} releaseTag
 * @returns {{ WHY: string, WHO: string, RISK: string, SUCCESS: string, SCOPE: string }}
 */
function autoDeriveDogfoodContext(releaseVersion, releaseTag) {
  return {
    WHY: `bkit self-dogfood of ${releaseVersion} — verify sprint container can run own release per master plan §19 Self-Dogfooding CI Gate.`,
    WHO: `bkit core team + CI workflow (release tag ${releaseTag})`,
    RISK: `If self-dogfood sprint fails or skips phases: release tag blocked by scripts/check-self-dogfood.sh (use --bootstrap-mode for first-cycle Exception per master plan §19.5).`,
    SUCCESS: `Sprint phase=archived + Quality Gates section present in report + audit sprint_dogfood_started emitted.`,
    SCOPE: `Single feature 'release-${releaseVersion}' — bkit release artifact verification + sprint state archive.`,
  };
}

/**
 * Build the failure-reporter function passed to advancePhase deps. Owns the
 * FS write (mkdirSync + writeFileSync) so the advance-phase use case stays
 * Application-layer pure (Master Plan §1 RISK invariant for Sprint 2).
 *
 * @returns {function|null}
 */
function buildFailureReporterForHandler() {
  try {
    const fr = require('../../lib/application/quality-gates/failure-reporter');
    const fsLocal = require('fs');
    const pathLocal = require('path');
    return fr.createFailureReporter({
      projectRoot: process.cwd(),
      fileWriter: function (absPath, content) {
        const dir = pathLocal.dirname(absPath);
        if (!fsLocal.existsSync(dir)) fsLocal.mkdirSync(dir, { recursive: true });
        fsLocal.writeFileSync(absPath, content, 'utf8');
      },
    });
  } catch (_e) { return null; }
}

/**
 * Build the fileWriter passed to generateReport deps. Owns the FS write
 * (mkdirSync + writeFileSync) so the report use case stays Application-layer
 * pure. Mirrors buildFailureReporterForHandler's resilience pattern (returns
 * null on any FS failure so report generation never crashes the handler).
 *
 * Slice 3 (Task 3.5): closes the report-write gap — handleReport previously
 * called lifecycle.generateReport(sprint, {}) with no fileWriter, so reports
 * were built in-memory and never written, leaving sprint.docs.report null
 * (which blocked the S4 archiveReadiness gate).
 *
 * Signature: (absPath: string, content: string) => void  (sync; generateReport
 * wraps the call in `await`, which tolerates a sync void return).
 *
 * @returns {function|null}
 */
function buildReportFileWriterForHandler() {
  try {
    const fsLocal = require('fs');
    const pathLocal = require('path');
    return function fileWriter(absPath, content) {
      const dir = pathLocal.dirname(absPath);
      if (!fsLocal.existsSync(dir)) fsLocal.mkdirSync(dir, { recursive: true });
      fsLocal.writeFileSync(absPath, content, 'utf8');
    };
  } catch (_e) { return null; }
}

function identifyCarryItems(sprint) {
  const items = [];
  const fm = sprint && sprint.featureMap;
  if (!fm) return items;
  const keys = Object.keys(fm);
  for (let i = 0; i < keys.length; i++) {
    const featureName = keys[i];
    const fp = fm[featureName];
    const phase = fp && fp.phase;
    if (phase === 'do' || phase === 'iterate') {
      items.push({ featureName: featureName, phase: phase, reason: 'phase_' + phase + '_not_complete' });
    }
  }
  return items;
}

// Sprint 5 real impl — feature: list/add/remove feature within a sprint
async function runPhaseGates(sprint, args, infra, deps) {
  // v2.1.18 (Issue #102, F3): normalize via normalizeTrustLevel — see handleMeasure for rationale.
  let trustLevel = normalizeTrustLevel(args);
  if (!args.trustLevel && !args.trust && !args.trustLevelAtStart) {
    trustLevel = (sprint.autoRun && sprint.autoRun.trustLevelAtStart) || trustLevel;
  }
  const source = (args.source === 'auto' || args.source === 'manual') ? args.source : 'manual';
  const ucDeps = {
    agentTaskRunner: deps.agentTaskRunner,
    trustLevel,
    source,
  };
  const agg = await lifecycle.measurePhaseGates(sprint, args.phase, ucDeps);
  await persistAndAudit(agg, infra, args.id);
  return {
    ok: agg.ok,
    sprintId: args.id,
    resolveSource: 'phase',
    phase: agg.phase,
    gateKeys: agg.results.map((r) => r.gateKey),
    skippedUnsupported: agg.skippedUnsupported,
    trustLevel,
    successCount: agg.successCount,
    failureCount: agg.failureCount,
    results: agg.results,
  };
}

async function persistAndAudit(agg, infra, sprintId) {
  // Single state save at the end (cumulative qualityGates from UC aggregator).
  let saved = false;
  if (agg && agg.sprint && agg.results.some((r) => r.ok && r.mode === 'record')) {
    await infra.stateStore.save(agg.sprint);
    saved = true;
  }
  // Per-gate audit emission for record-mode successes.
  try {
    const audit = require('../../lib/audit/audit-logger');
    for (const r of (agg.results || [])) {
      if (r.ok && r.mode === 'record' && r.auditRecord) {
        audit.writeAuditLog({
          actor: 'user',
          action: 'gate_measured',
          category: 'sprint',
          target: sprintId,
          targetType: 'feature',
          details: r.auditRecord,
          result: r.auditRecord.passed === false ? 'failure' : 'success',
        });
      }
    }
  } catch (_e) { /* audit best-effort */ }
  return saved;
}

// =====================================================================
// S2-UX v2.1.13 — Master Plan Generator handler (16th action)
// =====================================================================

/**
 * Parse `--features` flag value (CSV string or array) into a string array.
 *
 * @param {string|string[]|undefined} raw
 * @returns {string[]}
 */
function parseFeaturesFlag(raw) {
  if (Array.isArray(raw)) return raw.filter(function (s) { return typeof s === 'string' && s.length > 0; });
  if (typeof raw === 'string' && raw.length > 0) {
    return raw.split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });
  }
  return [];
}

/**
 * createTaskToolRunner — host adapter that wraps an injected Task-tool
 * invoker into the deps.agentTaskRunner contract the Sprint domain expects:
 *   ({ subagent_type, prompt }) => Promise<{ output: string }>
 *
 * This is the ONLY host-aware code in the handler layer. The domain
 * (measure-router, use cases, entity) never imports host specifics —
 * they receive the runner via deps. The composition root (the LLM
 * dispatcher in the main session) calls this factory and passes the
 * result into handleSprintAction({ agentTaskRunner }).
 *
 * The subprocess CLI path (require.main === module) runs in a separate
 * Node process and cannot see Claude Code's Task tool, so it passes {}
 * and the router correctly returns no_agent_runner for that path.
 *
 * @param {{ invokeTaskTool: ({ subagent_type: string, prompt: string }) => Promise<{ text: string }> }} host
 * @returns {({ subagent_type: string, prompt: string }) => Promise<{ output: string }>}
 */
function createTaskToolRunner(host) {
  if (!host || typeof host.invokeTaskTool !== 'function') {
    throw new TypeError('createTaskToolRunner requires { invokeTaskTool }');
  }
  return async ({ subagent_type, prompt }) => {
    const result = await host.invokeTaskTool({ subagent_type, prompt });
    return { output: (result && result.text) || '' };
  };
}

/**
 * Slugify a task subject into a deterministic, stable task id.
 *
 * Used as the resilient fallback when the runner returns no parseable id
 * (so tracker-task creation is best-effort and never throws to crash the
 * master plan). Kept here (not inlined) so the contract is unit-testable.
 *
 * @param {string} subject
 * @returns {string}
 */
function slugifyTaskId(subject) {
  return 'task-' + String(subject || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

/**
 * Attempt to extract a taskId from a sub-agent's textual output.
 *
 * Looks for, in order: a JSON object with a `taskId` field, or a quoted
 * token matching `tsk-...` / `task-...`. Returns null when nothing
 * parseable is found (caller then synthesizes via slugifyTaskId).
 *
 * @param {string} output
 * @returns {string|null}
 */
function parseTaskIdFromOutput(output) {
  if (typeof output !== 'string' || output.length === 0) return null;
  // 1) JSON object containing taskId.
  const jsonMatch = output.match(/\{[\s\S]*?"taskId"[\s\S]*?\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed && typeof parsed.taskId === 'string' && parsed.taskId.length > 0) {
        return parsed.taskId;
      }
    } catch (_) { /* fall through */ }
  }
  // 2) Bare token like tsk-XYZ or task-XYZ.
  const tokenMatch = output.match(/\b(?:tsk|task)-[A-Za-z0-9_-]+\b/);
  if (tokenMatch) return tokenMatch[0];
  return null;
}

/**
 * createTaskCreatorForRunner — host adapter that wraps the injected
 * `agentTaskRunner` (the same runner the Sprint domain expects for
 * measure/iterate) into the deps.taskCreator contract the master-plan
 * use case expects:
 *   ({ subject, description, addBlockedBy? }) => Promise<{ taskId }>
 *
 * Resilience contract (CRITICAL): tracker-task creation is BEST-EFFORT and
 * must never throw to crash master-plan generation. If the runner throws,
 * returns no output, or returns no parseable id, this adapter synthesizes a
 * deterministic taskId via `slugifyTaskId(subject)` and returns it. The
 * synthesized id is stable across re-runs (same subject → same id), which
 * keeps the prevTaskId → addBlockedBy chain meaningful even in degraded mode.
 *
 * Sibling of createTaskToolRunner; mirrors its lazy-prompt-build + output
 * parsing style.
 *
 * @param {({ subagent_type: string, prompt: string }) => Promise<{ output: string }>} agentTaskRunner
 * @returns {({ subject: string, description?: string, addBlockedBy?: string[] }) => Promise<{ taskId: string }>}
 */
function createTaskCreatorForRunner(agentTaskRunner) {
  if (typeof agentTaskRunner !== 'function') {
    throw new TypeError('createTaskCreatorForRunner requires a function');
  }
  return async (req) => {
    const r = req || {};
    const subject = typeof r.subject === 'string' ? r.subject : '';
    const description = typeof r.description === 'string' ? r.description : '';
    // Synthesize a stable fallback id BEFORE the call so we always have one
    // even if the runner rejects outright.
    const fallbackId = slugifyTaskId(subject) || 'task-unnamed';
    try {
      const prompt = [
        'Create a tracker task with the following specification.',
        'Subject: ' + subject,
        description ? ('Description: ' + description) : '',
        Array.isArray(r.addBlockedBy) && r.addBlockedBy.length > 0
          ? ('BlockedBy (task ids): ' + r.addBlockedBy.join(', '))
          : '',
        'Respond with a JSON object like {"taskId": "<id>"} containing the new task id.',
      ].filter(Boolean).join('\n');
      const result = await agentTaskRunner({
        subagent_type: 'general-purpose',
        prompt: prompt,
      });
      const output = (result && typeof result.output === 'string') ? result.output : '';
      const parsed = parseTaskIdFromOutput(output);
      if (parsed) return { taskId: parsed };
      return { taskId: fallbackId };
    } catch (_e) {
      // Runner failure must never crash master-plan generation.
      return { taskId: fallbackId };
    }
  };
}

// =====================================================================
// CLI mode (P1 §4.3) — invoked when run as `node scripts/sprint-handler.js`
//   Examples:
//     node scripts/sprint-handler.js status my-launch
//     node scripts/sprint-handler.js start my-launch --trust L4
//     node scripts/sprint-handler.js help
//   Returns: JSON.stringify(result, null, 2) on stdout. exit code 0 (ok), 1 (handler error), 2 (exception).
//   require() callers are unaffected (this block is gated by require.main check).
// =====================================================================

module.exports = {
  normalizeTrustLevel,
  isDowngrade,
  severity,
  loadTrustScore,
  resolveActor,
  parseFlags,
  defaultContext,
  isValidReleaseVersion,
  resolveBkitVersion,
  resolveBkitCommit,
  autoDeriveDogfoodContext,
  buildFailureReporterForHandler,
  buildReportFileWriterForHandler,
  identifyCarryItems,
  runPhaseGates,
  persistAndAudit,
  parseFeaturesFlag,
  createTaskToolRunner,
  createTaskCreatorForRunner,
  slugifyTaskId,
  parseTaskIdFromOutput,
  VALID_TRUST_LEVELS,
  DEFAULT_TRUST_LEVEL,
  LEVEL_RANK,
};
