#!/usr/bin/env node
/*
 * L1/L2 — Orchestrator Module Test (Sprint 7a/7b/7c)
 *
 * Covers:
 *   - IntentRouter priority resolution (G-J-01/03/04)
 *   - NextActionEngine hint generation (G-J-05/06/07)
 *   - TeamProtocol spawn prep (G-T-06)
 *   - WorkflowStateMachine decideNextAction + matchRate SSoT (G-P-01)
 *
 * Design Ref: bkit-v2110-orchestration-integrity.design.md §4
 */

const path = require('path');
const orch = require(path.resolve(__dirname, '..', '..', 'lib', 'orchestrator'));

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.error(`  ✗ ${msg}`); }
}

console.log('=== Orchestrator Module Test (v2.1.10 Sprint 7) ===');

// 1. IntentRouter — feature intent (G-J-03: loose threshold 0.7)
// v2.1.16 hardening: routing policy evolved — signup-class prompts now route
// to `bkend-expert` agent (BaaS specialist) when agent confidence >= skill
// confidence. Both routes (skill→pdca/dynamic, agent→bkend-expert) are valid.
const r1 = orch.route('회원가입 기능 만들어줘', {});
assert(r1 && r1.primary !== undefined, 'route() returns { primary, suggestions, ambiguity }');
if (r1 && r1.primary) {
  assert(
    r1.primary.type === 'skill' || r1.primary.type === 'agent',
    'primary.type is skill or agent (signup routes via either path)'
  );
  assert(
    /pdca/.test(r1.primary.name) || r1.primary.name.includes('dynamic') || r1.primary.name.includes('bkend-expert'),
    'primary for login/signup routes to pdca/dynamic skill OR bkend-expert agent'
  );
}

// 2. IntentRouter — "PM 분석해줘" should surface pm-discovery or pdca
const r2 = orch.route('PM 분석해줘', {});
assert(r2 && Array.isArray(r2.suggestions), 'suggestions array present');

// 3. IntentRouter — "코드 리뷰해줘" should surface code-review skill (G-J-01)
const r3 = orch.route('이 코드 리뷰해줘', {});
const hasCodeReview = r3 && r3.suggestions.some((s) => /code-review|code-analyzer/.test(s.name));
assert(hasCodeReview, 'route("코드 리뷰해줘") surfaces code-review or code-analyzer');

// 4. IntentRouter — "QA 돌려봐" should surface qa-phase or qa-lead
const r4 = orch.route('QA 돌려봐', {});
const hasQa = r4 && r4.suggestions.some((s) => /qa-phase|qa-lead/.test(s.name));
assert(hasQa, 'route("QA 돌려봐") surfaces qa-phase or qa-lead');

// 5. NextActionEngine — phase next commands
assert(orch.generatePhaseNext('pm', 'login-feature') === '/pdca plan login-feature', 'pm → /pdca plan');
assert(orch.generatePhaseNext('plan', 'x') === '/pdca design x', 'plan → /pdca design');
assert(orch.generatePhaseNext('qa', 'y') === '/pdca report y', 'qa → /pdca report');
assert(orch.generatePhaseNext('archived', 'z') === null, 'archived → null');

// 6. NextActionEngine — generic suggestion
const genHint = orch.generateGeneric({ pdcaStatus: { currentPhase: 'plan', primaryFeature: 'feat-x' } });
assert(genHint && genHint.includes('/pdca design feat-x'), 'generateGeneric emits phase-aware hint');

// 7. NextActionEngine — SessionEnd resume hint
const seHint = orch.generateSessionEnd({ pdcaStatus: { currentPhase: 'do', primaryFeature: 'feat-y' } });
assert(seHint && seHint.includes('/pdca analyze feat-y'), 'generateSessionEnd emits resume hint');

// 8. NextActionEngine — SubagentStop hint
const ssHint = orch.generateSubagentStop({ agentName: 'pm-discovery', status: 'completed', pdcaStatus: { currentPhase: 'pm', primaryFeature: 'f' } });
assert(ssHint && ssHint.includes('/pdca plan f'), 'generateSubagentStop emits next phase hint');

// 9. TeamProtocol — canSpawn respects env var
const origEnv = process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS;
delete process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS;
assert(orch.canSpawn() === false, 'canSpawn() false when env not set');
process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = '1';
assert(orch.canSpawn() === true, 'canSpawn() true when env=1');
if (origEnv === undefined) delete process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS;
else process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = origEnv;

// 10. TeamProtocol — registerSpawn returns structure
const spawnResult = orch.registerSpawn({ lead: 'cto-lead', sub: 'bkend-expert', prompt: 'Implement X', feature: 'demo' });
assert(spawnResult && spawnResult.taskPrompt, 'registerSpawn returns { taskPrompt }');
assert(spawnResult.taskPrompt.includes('bkend-expert'), 'prompt includes sub-agent name');
assert(spawnResult.taskPrompt.includes('demo'), 'prompt includes feature name');

// 11. WorkflowStateMachine — decideNextAction
const dec = orch.decideNextAction('plan', { feature: 'abc' });
assert(dec && typeof dec.advanceMode === 'string', 'decideNextAction returns advanceMode');
assert(dec.nextPhase === 'design', 'plan → design');

// 12. WorkflowStateMachine — getMatchRateThreshold (G-P-01 SSoT)
const threshold = orch.getMatchRateThreshold();
assert(threshold === 90, `matchRate threshold SSoT == 90 (actual: ${threshold})`);

// 13. toStructuredSuggestions
const structured = orch.toStructuredSuggestions([
  { type: 'skill', name: 'bkit:pdca', args: 'pm x', confidence: 0.8, rationale: 'feature' },
]);
assert(Array.isArray(structured) && structured.length === 1, 'toStructuredSuggestions returns array');
assert(structured[0].name === 'bkit:pdca', 'preserves name');

const total = pass + fail;
console.log(`\nTests: ${pass}/${total} PASSED, ${fail} FAILED, 0 SKIPPED`);
process.exit(fail > 0 ? 1 : 0);
