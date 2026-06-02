'use strict';
/**
 * Unit Tests for scripts/sprint-skill-stop.js (Issue #113 — v2.1.21)
 *
 * Verifies the Sprint Stop hook surfaces Executive Summary + AskUserQuestion +
 * sessionTitle for success/intermediate paths, mirroring pdca-skill-stop.js.
 *
 * Runs the script as a real subprocess (stdin payload → stdout JSON) — static
 * inspection is insufficient for hook behavior ([[feedback_thorough_qa]]).
 *
 * Pattern: console.assert based (matches existing test/unit/*.test.js convention).
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SCRIPT = path.resolve(__dirname, '../../scripts/sprint-skill-stop.js');

let passed = 0, failed = 0, total = 0;
function assert(id, condition, message) {
  total++;
  if (condition) { passed++; console.log(`  PASS: ${id} - ${message}`); }
  else { failed++; console.error(`  FAIL: ${id} - ${message}`); }
}

// --- temp project with a sprint state file ---
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-sss-'));
const sprintsDir = path.join(tmp, '.bkit', 'state', 'sprints');
fs.mkdirSync(sprintsDir, { recursive: true });
const sprintState = {
  id: 'demo-sprint',
  name: 'Demo Sprint Mission',
  phase: 'do',
  status: 'active',
  features: ['auth', 'billing'],
  featureMap: {
    auth: { phase: 'do', matchRate: 100, s1Score: 100, scope: 'P0' },
    billing: { phase: 'design', matchRate: 60, scope: 'P1' },
  },
  qualityGates: { M1_matchRate: { current: 80, threshold: 90, passed: false } },
  phaseHistory: [
    { phase: 'design', enteredAt: '2026-05-29T00:00:00Z', exitedAt: '2026-05-29T01:00:00Z' },
    { phase: 'do', enteredAt: '2026-05-29T01:00:00Z', exitedAt: null },
  ],
  autoRun: { trustLevelAtStart: 'L4' },
  autoPause: { armed: ['QUALITY_GATE_FAIL'] },
};
fs.writeFileSync(path.join(sprintsDir, 'demo-sprint.json'), JSON.stringify(sprintState, null, 2));

function runHook(payload) {
  try {
    const out = execFileSync('node', [SCRIPT], {
      input: JSON.stringify(payload),
      env: { ...process.env, CLAUDE_PROJECT_DIR: tmp },
      encoding: 'utf8',
    });
    return JSON.parse(out.trim());
  } catch (e) {
    return { __error: e.message, __stdout: e.stdout, __stderr: e.stderr };
  }
}

// =============== TC-S1: phase success → Executive Summary (S6 CC-compliant) ===============
// v2.1.22 S6: Stop output is now { decision:'block', reason } (was the
// CC-rejected decision:'allow' + hookSpecificOutput.additionalContext shape).
const r1 = runHook({ session_id: 'sessA', skill_name: 'sprint', prompt: '/sprint phase demo-sprint --to do' });
const reason1 = r1.reason;
assert('TC-S1a', r1.decision === 'block', 'surface → decision block (CC Stop-compliant, S6)');
assert('TC-S1b', typeof reason1 === 'string' && /SPRINT EXECUTIVE SUMMARY/.test(reason1), 'reason 에 Sprint Exec Summary 포함');
assert('TC-S1c', /\[MISSION\]/.test(reason1) && /Demo Sprint Mission/.test(reason1), 'Mission 표기');
assert('TC-S1d', /design → do/.test(reason1), 'phaseHistory 기반 previousPhase → phase 전이 표기');
assert('TC-S1e', /\[auth\]/.test(reason1) && /matchRate 100%/.test(reason1), 'per-feature 표 포함');

// =============== TC-S2: CC-compliant shape — no hookSpecificOutput/skillResult, options in reason ===============
assert('TC-S2a', !('hookSpecificOutput' in r1), 'S6: no Stop hookSpecificOutput (CC schema reject)');
assert('TC-S2b', !('skillResult' in r1), 'S6: no skillResult root field');
assert('TC-S2c', /Select next step/.test(reason1), 'reason 에 next-step 안내 텍스트 직렬화');
assert('TC-S2d', /\/sprint iterate demo-sprint/.test(reason1),
  'do phase → /sprint iterate 권장 옵션 텍스트 (ENH-363 — Claude 가 reason 읽고 AskUserQuestion 제시)');

// =============== TC-S3: read-only (status) → clean stop ({}) ===============
const r3 = runHook({ session_id: 'sessC', skill_name: 'sprint', prompt: '/sprint status demo-sprint' });
assert('TC-S3a', r3.decision === undefined, 'status(read-only) → no decision (clean stop)');
assert('TC-S3b', !r3.reason, 'status(read-only) → forced Exec Summary 미출력');
assert('TC-S3c', Object.keys(r3).length === 0,
  'read-only → CC-compliant 빈 객체 {} (no hookSpecificOutput/sessionTitle/skillResult)');

// =============== TC-S4: phase surface 일관 (sessionTitle 격리는 SessionStart 로 이관 — S6 carry) ===============
const r4 = runHook({ session_id: 'sessB', skill_name: 'sprint', prompt: '/sprint phase demo-sprint --to do' });
assert('TC-S4', r4.decision === 'block' && /SPRINT EXECUTIVE SUMMARY/.test(r4.reason || ''),
  'phase surface 일관 (decision block + reason). #111 session-title 격리는 SessionStart 경로로 이관(S6 carry)');

// =============== TC-S5: run-export pattern (unified-stop 호환) ===============
const mod = require(SCRIPT);  // required as module (require.main !== module)
assert('TC-S5', mod && typeof mod.run === 'function',
  'run-export 패턴 — unified-stop executeHandler 가 handler.run(context) 호출 가능');

// =============== TC-U1: unified-stop 경유 실제 dispatch (F6 핵심) ===============
// SKILL_HANDLERS['sprint'] → executeHandler → require → run(hookContext) 경로가
// 실제로 Sprint Exec Summary 를 stdout 으로 내보내는지 end-to-end 검증.
const UNIFIED = path.resolve(__dirname, '../../scripts/unified-stop.js');
function runUnified(payload) {
  try {
    const out = execFileSync('node', [UNIFIED], {
      input: JSON.stringify(payload),
      env: { ...process.env, CLAUDE_PROJECT_DIR: tmp },
      encoding: 'utf8',
    });
    return out;
  } catch (e) {
    return (e.stdout || '') + (e.stderr || '');
  }
}
const uOut = runUnified({ skill_name: 'sprint', session_id: 'sessU', prompt: '/sprint phase demo-sprint --to do', hook_event_name: 'Stop' });
assert('TC-U1a', /SPRINT EXECUTIVE SUMMARY/.test(uOut),
  'unified-stop SKILL_HANDLERS[sprint] dispatch → Exec Summary stdout 출력');
assert('TC-U1b', /\[auth\]/.test(uOut) && /matchRate 100%/.test(uOut),
  'unified-stop 경유 per-feature 표 surfacing');
let uJson = null; try { uJson = JSON.parse(uOut.trim()); } catch (_e) {}
assert('TC-U1c', uJson && uJson.decision === 'block' && /SPRINT EXECUTIVE SUMMARY/.test(uJson.reason || ''),
  'unified-stop 경유 단일 CC-compliant JSON (decision block + reason, S6)');

// =============== TC-U2: PRODUCTION dispatch path — marker, NO skill_name ===============
// 실제 CC Stop payload 는 skill_name / tool_input 을 포함하지 않음 (hasSkillName:false,
// 실측). 이 케이스가 v2.1.21 이전엔 dispatch 실패(handled:false)했음. active-skill
// 마커(sprint-handler 기록)로 dispatch 되는지 = 버그를 잡았을 결정적 회귀 테스트.
const markerPath = path.join(tmp, '.bkit', 'runtime', 'active-skill.json');
fs.mkdirSync(path.dirname(markerPath), { recursive: true });
fs.writeFileSync(markerPath, JSON.stringify({
  skill: 'sprint', action: 'phase', id: 'demo-sprint', phase: 'do', ts: new Date().toISOString(),
}));
// realistic Stop payload — NO skill_name, NO tool_input (CC v2.1.156 실측 형태)
const uOut2 = runUnified({ session_id: 'sessProd', hook_event_name: 'Stop' });
assert('TC-U2a', /SPRINT EXECUTIVE SUMMARY/.test(uOut2),
  'skill_name 없는 realistic payload + 마커 → marker 경로로 dispatch (production 동작 보장)');
assert('TC-U2b', !fs.existsSync(markerPath),
  'dispatch 후 마커 consume됨 (다음 Stop re-fire 방지)');

// =============== TC-U3: 마커도 skill_name도 없으면 미발동 (false-positive 방지) ===============
const uOut3 = runUnified({ session_id: 'sessNone', hook_event_name: 'Stop' });
assert('TC-U3', !/SPRINT EXECUTIVE SUMMARY/.test(uOut3),
  '마커 부재 + skill_name 부재 → sprint-skill-stop 미발동 (오발동 방지)');

// --- Cleanup ---
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_e) {}

// --- Results ---
console.log(`\n=== Results: ${passed}/${total} passed (${failed} failed) ===`);
process.exit(failed > 0 ? 1 : 0);
