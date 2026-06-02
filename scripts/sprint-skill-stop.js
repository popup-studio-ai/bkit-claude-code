#!/usr/bin/env node
/**
 * sprint-skill-stop.js — Sprint Skill Stop Hook (Issue #113 — v2.1.21)
 *
 * Purpose: Surface a human-readable Sprint Executive Summary + AskUserQuestion
 * + sessionTitle when a `/sprint` skill operation completes — mirroring the
 * PDCA enforcement intent of scripts/pdca-skill-stop.js. Closes the "raw JSON
 * only, 100% dependent on LLM narration" gap for Sprint success/intermediate
 * paths (#113 §A).
 *
 * Wiring: dispatched from scripts/unified-stop.js via SKILL_HANDLERS['sprint']
 * (registered in F6). unified-stop's `executeHandler` REQUIRES this module and
 * calls `handler.run(hookContext)`. This is the **run-export** pattern used by
 * the working stop handlers (cto-stop.js / team-stop.js).
 *
 * NOTE (why run-export, not bare-require self-exec): the bare-require-guard
 * pattern (`if (require.main !== module) { module.exports = {}; return; }`,
 * pdca-skill-stop.js line 19, added v2.1.12 #10) makes the module a NO-OP when
 * require()-d by unified-stop — `executeHandler` gets `{}`, finds no `.run`,
 * and nothing executes. To guarantee the Sprint summary actually fires through
 * the documented SKILL_HANDLERS path, this handler exports `run(hookContext)`.
 * Direct `node sprint-skill-stop.js` invocation (tests / manual) is also kept.
 *
 * Resilience (Issue #113 R1, CC plugin-hook drop #57317): unified-stop's
 * detectActiveSkill() resolves the active skill primarily from
 * `hookContext.skill_name` (CC-provided), not the skill_post-populated session
 * context — so dispatch to this handler survives skill_post being dropped.
 *
 * @version 2.1.21
 * @module scripts/sprint-skill-stop
 */

'use strict';

const fs = require('fs');
const path = require('path');

const { readStdinSync } = require('../lib/core/io');
const { debugLog } = require('../lib/core/debug');
const { generateSprintExecutiveSummary, formatSprintExecutiveSummary } = require('../lib/sprint/executive-summary');
const { generateSessionTitle } = require('../lib/pdca/session-title');
const { getSprintStateDir, getSprintStateFile } = require('../lib/infra/sprint/sprint-paths');

// Read-only actions: state snapshots are surfaced by the handler itself (F8),
// so the Stop hook does NOT re-emit a forced Executive Summary for them.
const READONLY_ACTIONS = ['status', 'watch', 'list', 'help'];
// Actions whose completion warrants a forced summary on screen.
const SURFACE_ACTIONS = ['phase', 'start', 'resume', 'report', 'iterate', 'qa', 'archive'];

const ACTION_RE = /sprint\s+(phase|start|resume|report|iterate|qa|status|watch|archive|init|master-plan|list|help)/i;
const ID_RE = /sprint\s+(?:phase|start|resume|report|iterate|qa|status|watch|archive|init|master-plan)\s+([a-z][a-z0-9-]{1,62}[a-z0-9])/i;

function resolveProjectDir() {
  // Resolve lazily so tests can set CLAUDE_PROJECT_DIR per-invocation.
  return process.env.CLAUDE_PROJECT_DIR || process.cwd();
}

/**
 * Load a sprint state object by id (direct fs read — fast, hook-timeout safe).
 * @param {string} projectDir
 * @param {string} id
 * @returns {object|null}
 */
function loadSprint(projectDir, id) {
  if (!id) return null;
  try {
    const file = getSprintStateFile(projectDir, id);
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_e) {
    return null;
  }
}

/**
 * Fallback: most-recently-updated active sprint when no id is extractable.
 * @param {string} projectDir
 * @returns {object|null}
 */
function latestActiveSprint(projectDir) {
  try {
    const dir = getSprintStateDir(projectDir);
    if (!fs.existsSync(dir)) return null;
    const candidates = fs.readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const full = path.join(dir, f);
        try { return { full, mtime: fs.statSync(full).mtimeMs }; }
        catch (_e) { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => b.mtime - a.mtime);
    for (const c of candidates) {
      try {
        const s = JSON.parse(fs.readFileSync(c.full, 'utf8'));
        if (s && s.status === 'active') return s;
      } catch (_e) { /* skip corrupt */ }
    }
  } catch (_e) { /* ignore */ }
  return null;
}

/**
 * Build the Stop hook response object for a sprint completion (pure-ish —
 * only reads sprint state from disk via the helpers above).
 *
 * @param {object} hookContext - parsed CC Stop payload
 * @returns {object} CC hook output object
 */
function buildResponse(hookContext) {
  const input = hookContext || {};
  const inputText = typeof input === 'string' ? input : JSON.stringify(input);
  const projectDir = resolveProjectDir();

  // v2.1.21 (Issue #113): the CC Stop payload does NOT carry the `/sprint ...`
  // command (hasSkillName / hasToolInput false in real sessions), so
  // regex-on-payload yields nothing in production. The sprint handler's
  // active-skill marker carries the real action/id — prefer it, fall back to
  // regex for manual / synthetic-payload test runs.
  let marker = null;
  try { marker = require('../lib/core/active-skill-marker').readActiveSkill(); }
  catch (_e) { marker = null; }
  const markerIsSprint = marker && marker.skill === 'sprint';

  const actionMatch = inputText.match(ACTION_RE);
  const action = (markerIsSprint && marker.action)
    ? String(marker.action).toLowerCase()
    : (actionMatch ? actionMatch[1].toLowerCase() : null);
  const idMatch = inputText.match(ID_RE);
  let sprintId = (markerIsSprint && marker.id)
    ? marker.id
    : (idMatch ? idMatch[1] : null);

  let sprint = loadSprint(projectDir, sprintId);
  // Since unified-stop only dispatches here when activeSkill === 'sprint',
  // a sprint operation just completed — fall back to the latest active sprint
  // when the id wasn't recoverable from the payload.
  if (!sprint && !READONLY_ACTIONS.includes(action)) {
    sprint = latestActiveSprint(projectDir);
  }
  if (sprint && !sprintId) sprintId = sprint.id;

  // Surface a forced Executive Summary unless this is a read-only action or we
  // couldn't resolve a sprint. (action===null still surfaces — a sprint skill
  // ran, we just couldn't parse which sub-action.)
  const isReadonly = READONLY_ACTIONS.includes(action);
  const shouldSurface = !!sprint && !isReadonly;

  const sessionTitle = sprint
    ? generateSessionTitle({
        action: `SPRINT-${String(sprint.phase || '').toUpperCase()}`,
        feature: sprint.id,
        sessionId: input && input.session_id,
      })
    : undefined;

  if (!shouldSurface) {
    // CC-compliant clean stop (S6 ENH-362): no decision:'allow', no
    // hookSpecificOutput, no skillResult root field. Diagnostics → debugLog.
    debugLog('Skill:sprint:Stop', 'no-surface allow', { action: action || null, sprintId: sprintId || null, sessionTitle });
    return {};
  }

  // previousPhase from phaseHistory (best-effort)
  let previousPhase = null;
  try {
    const hist = Array.isArray(sprint.phaseHistory) ? sprint.phaseHistory : [];
    if (hist.length >= 2) previousPhase = hist[hist.length - 2].phase || null;
  } catch (_e) { previousPhase = null; }

  const summary = generateSprintExecutiveSummary(sprint, { previousPhase });
  const summaryText = formatSprintExecutiveSummary(summary, 'full');

  const nextActions = summary.nextActions || [];
  // S6 ENH-363: serialize next-step options into the reason text (no userPrompt
  // field — not in CC Stop schema). Claude reads these and presents an
  // AskUserQuestion for the next step.
  const optionLines = nextActions.length
    ? ['Select next step:', ...nextActions.map((a) => `- ${a.label}: ${a.command}`)]
    : ['Select next step.'];
  const reason = [
    `✅ Sprint "${sprintId}" — ${previousPhase ? `${previousPhase} → ` : ''}${sprint.phase}`,
    '',
    summaryText,
    '',
    '---',
    '',
    ...optionLines,
  ].join('\n');

  debugLog('Skill:sprint:Stop', 'surface', { action, sprintId, phase: sprint.phase, matchRate: summary.summary.matchRate, sessionTitle });

  // CC-compliant Stop surface (S6 ENH-362/364): decision:'block' feeds `reason`
  // back to the model so it renders the summary + next-step question.
  return { decision: 'block', reason };
}

/**
 * unified-stop executeHandler entrypoint (run-export pattern).
 * @param {object} hookContext - parsed CC Stop payload
 */
function run(hookContext) {
  try {
    const response = buildResponse(hookContext || {});
    console.log(JSON.stringify(response));
  } catch (e) {
    debugLog('Skill:sprint:Stop', 'run failed', { error: e.message });
    // Never block the Stop flow — emit a CC-compliant clean stop (S6).
    try { console.log(JSON.stringify({})); }
    catch (_e2) { /* give up silently */ }
  } finally {
    // v2.1.21 (Issue #113): consume-once — clear the active-skill marker so the
    // next (non-sprint) Stop does not re-dispatch this handler.
    try { require('../lib/core/active-skill-marker').clearActiveSkill(); }
    catch (_e3) { /* non-critical */ }
  }
}

// Direct entrypoint (manual / tests): read stdin then run.
if (require.main === module) {
  let input;
  try {
    input = readStdinSync();
  } catch (e) {
    debugLog('Skill:sprint:Stop', 'Failed to read stdin', { error: e.message });
    process.exit(0);
  }
  run(input);
  process.exit(0);
} else {
  module.exports = { run, buildResponse, loadSprint, latestActiveSprint };
}
