'use strict';

/**
 * v2122-stop-hook-output-schema.test.js — L3 Contract Test (tracked, CI gate).
 *
 * Enforces that every bkit Stop / Agent-Stop emitter produces output that
 * conforms to CC's strict Stop hook output schema. Regression guard for
 * v2.1.22 S6 (ENH-365) — prevents reintroduction of the systemic bug where
 * emitters output `decision:'allow'` (Stop decision is approve|block),
 * Stop-unsupported `hookSpecificOutput`, or non-schema root fields
 * (skillResult / autoTrigger / iterationResult / analysisResult), which CC
 * rejects with "(root): Invalid input".
 *
 * Run: node tests/contract/v2122-stop-hook-output-schema.test.js
 * Exit 0 = all emitters compliant. Non-zero = schema drift detected.
 *
 * Analysis: docs/03-analysis/features/cc-stop-hook-schema-compliance.analysis.md
 * Sprint Ref: cc-stop-hook-schema-compliance (S6)
 * @version 2.1.22
 * @since 2.1.22
 */

const assert = require('assert');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '../..');

// CC Stop hook valid top-level keys (per CC output schema).
const ALLOWED_KEYS = new Set([
  'continue', 'suppressOutput', 'stopReason', 'decision',
  'reason', 'systemMessage', 'terminalSequence', 'permissionDecision',
]);
// permissionDecision enum values — NOT valid for Stop `decision`.
const PERMISSION_VALUES = new Set(['allow', 'deny', 'ask', 'defer']);
// Non-schema root fields previously emitted (must never reappear).
const FORBIDDEN_KEYS = ['hookSpecificOutput', 'skillResult', 'autoTrigger', 'iterationResult', 'analysisResult'];

const EMITTERS = [
  { script: 'scripts/sprint-skill-stop.js', payload: { session_id: 't', cwd: projectRoot, stop_hook_active: false, skill_name: 'sprint' } },
  { script: 'scripts/pdca-skill-stop.js',   payload: { session_id: 't', cwd: projectRoot, stop_hook_active: false, skill_name: 'pdca' } },
  { script: 'scripts/plan-plus-stop.js',    payload: { session_id: 't', cwd: projectRoot, stop_hook_active: false } },
  { script: 'scripts/iterator-stop.js',     payload: { session_id: 't', cwd: projectRoot, stop_hook_active: false } },
  { script: 'scripts/gap-detector-stop.js', payload: { session_id: 't', cwd: projectRoot, stop_hook_active: false } },
];

let failures = 0;
function check(label, cond, detail) {
  try { assert.ok(cond, detail); console.log('  PASS', label); }
  catch (e) { console.log('  FAIL', label, '—', e.message); failures += 1; }
}

for (const e of EMITTERS) {
  console.log(e.script);
  const r = spawnSync('node', [path.join(projectRoot, e.script)], {
    input: JSON.stringify(e.payload), encoding: 'utf8', timeout: 20000,
  });
  check(`${e.script} exits 0`, r.status === 0, `exit=${r.status} stderr=${(r.stderr || '').slice(-200)}`);

  const out = (r.stdout || '').trim();
  let parsed = null;
  try { parsed = JSON.parse(out); } catch (_) { /* parsed stays null */ }
  check(`${e.script} stdout is a single valid JSON object`, parsed !== null && typeof parsed === 'object',
    `raw=${out.slice(0, 160)}`);
  if (!parsed) continue;

  const keys = Object.keys(parsed);
  const badKeys = keys.filter((k) => !ALLOWED_KEYS.has(k));
  check(`${e.script} only CC-Stop-schema root keys`, badKeys.length === 0, `bad=${JSON.stringify(badKeys)}`);

  for (const fk of FORBIDDEN_KEYS) {
    check(`${e.script} no '${fk}'`, !(fk in parsed), `'${fk}' present`);
  }

  if ('decision' in parsed) {
    check(`${e.script} decision ∈ {approve,block}`, ['approve', 'block'].includes(parsed.decision),
      `decision=${parsed.decision}`);
    check(`${e.script} decision not a permissionDecision value`, !PERMISSION_VALUES.has(parsed.decision),
      `decision=${parsed.decision}`);
    if (parsed.decision === 'block') {
      check(`${e.script} block has reason`, typeof parsed.reason === 'string' && parsed.reason.length > 0,
        'block without reason');
    }
  }
}

if (failures > 0) {
  console.error(`\nStop-hook output schema contract FAILED: ${failures} assertion(s).`);
  process.exit(1);
}
console.log('\nAll Stop-hook emitters conform to CC Stop output schema.');
process.exit(0);
