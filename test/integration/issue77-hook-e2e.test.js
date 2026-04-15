'use strict';
/**
 * Integration Tests for Issue #77 Phase A — Hook E2E simulation
 *
 * Hook 스크립트를 child_process로 실제 실행하여 stdout JSON 검증.
 * Mock stdin 으로 CC hook input 시뮬레이션.
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const REPO = path.resolve(__dirname, '../..');

let passed = 0, failed = 0, total = 0;
function assert(id, condition, message, extra = '') {
  total++;
  if (condition) { passed++; console.log(`  PASS: ${id} - ${message}`); }
  else { failed++; console.error(`  FAIL: ${id} - ${message}${extra ? ' :: ' + extra : ''}`); }
}

function runHook(scriptPath, stdinJson, env = {}) {
  const result = spawnSync('node', [scriptPath], {
    input: JSON.stringify(stdinJson),
    encoding: 'utf8',
    env: { ...process.env, ...env },
    timeout: 10000,
  });
  let parsed = null;
  try { parsed = JSON.parse(result.stdout || '{}'); } catch (_e) {}
  return { stdout: result.stdout, stderr: result.stderr, code: result.status, parsed };
}

// === Setup: isolated tmp project ===
const tmpProject = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-e2e-'));
fs.mkdirSync(path.join(tmpProject, '.bkit', 'state'), { recursive: true });
fs.mkdirSync(path.join(tmpProject, '.bkit', 'runtime'), { recursive: true });

// PDCA status with active feature in 'plan' phase
const pdcaStatus = {
  version: '3.0',
  primaryFeature: 'test-issue77',
  activeFeatures: ['test-issue77'],
  features: {
    'test-issue77': {
      phase: 'plan',
      phaseNumber: 1,
      timestamps: { started: new Date().toISOString(), lastUpdated: new Date().toISOString() },
    },
  },
  currentPhase: 'plan',
  history: [],
};
fs.writeFileSync(path.join(tmpProject, '.bkit', 'state', 'pdca-status.json'), JSON.stringify(pdcaStatus));

// Helper: create bkit.config.json in tmp project
function writeConfig(uiOverride) {
  const config = {
    version: '2.1.6',
    ui: uiOverride,
    pdca: { matchRateThreshold: 90 },
  };
  fs.writeFileSync(path.join(tmpProject, 'bkit.config.json'), JSON.stringify(config));
}

const baseEnv = {
  CLAUDE_PROJECT_DIR: tmpProject,
  CLAUDE_PLUGIN_ROOT: REPO,
  CLAUDE_SESSION_ID: 'integ-session-1',
  // Disable bkit cache so config reload picks up our changes
  BKIT_DISABLE_CACHE: '1',
};

// =============== TC-IT1: contextInjection opt-out ===============
// user-prompt-handler.js 에 ui.contextInjection.enabled=false 시 빈 응답
writeConfig({
  sessionTitle: { enabled: true, staleTTLHours: 24, format: '[bkit] {action} {feature}' },
  dashboard: { enabled: true, sections: ['progress', 'workflow', 'impact', 'agent', 'control'] },
  contextInjection: { enabled: false, ambiguityThreshold: 0.7 },
});
const it1 = runHook(path.join(REPO, 'scripts/user-prompt-handler.js'), {
  prompt: 'hello world this is a test prompt with enough length',
  session_id: 'integ-session-1',
}, baseEnv);
const it1AdditionalContext = it1.parsed?.hookSpecificOutput?.additionalContext;
assert('TC-IT1', !it1AdditionalContext || it1AdditionalContext === '', 'contextInjection.enabled=false 시 additionalContext 빈값', `got: ${JSON.stringify(it1AdditionalContext)}`);

// =============== TC-IT2: sessionTitle opt-out ===============
writeConfig({
  sessionTitle: { enabled: false, staleTTLHours: 24, format: '[bkit] {action} {feature}' },
  dashboard: { enabled: true, sections: ['progress', 'workflow', 'impact', 'agent', 'control'] },
  contextInjection: { enabled: true, ambiguityThreshold: 0.7 },
});
// reset cache to force fresh decision
const cachePath = path.join(tmpProject, '.bkit', 'runtime', 'session-title-cache.json');
if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
const it2 = runHook(path.join(REPO, 'scripts/user-prompt-handler.js'), {
  prompt: 'create user authentication module please please',
  session_id: 'integ-session-1',
}, baseEnv);
const it2Title = it2.parsed?.hookSpecificOutput?.sessionTitle;
assert('TC-IT2', it2Title === undefined || it2Title === null, 'sessionTitle.enabled=false 시 sessionTitle 미발행', `got: ${JSON.stringify(it2Title)}`);

// =============== TC-IT3: sessionTitle 정상 동작 + cache ===============
writeConfig({
  sessionTitle: { enabled: true, staleTTLHours: 24, format: '[bkit] {action} {feature}' },
  dashboard: { enabled: true, sections: ['progress', 'workflow', 'impact', 'agent', 'control'] },
  contextInjection: { enabled: true, ambiguityThreshold: 0.7 },
});
if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
const it3a = runHook(path.join(REPO, 'scripts/user-prompt-handler.js'), {
  prompt: 'design new feature with auth and database integration',
  session_id: 'integ-session-2',
}, baseEnv);
const it3aTitle = it3a.parsed?.hookSpecificOutput?.sessionTitle;
assert('TC-IT3a', it3aTitle === '[bkit] PLAN test-issue77', '1차 호출: 정상 emit', `got: ${JSON.stringify(it3aTitle)}`);

// 2차: 동일 session+feature+phase → cache hit (undefined)
const it3b = runHook(path.join(REPO, 'scripts/user-prompt-handler.js'), {
  prompt: 'another prompt with similar context for new feature creation',
  session_id: 'integ-session-2',
}, baseEnv);
const it3bTitle = it3b.parsed?.hookSpecificOutput?.sessionTitle;
assert('TC-IT3b', it3bTitle === undefined || it3bTitle === null, '2차 호출: cache hit → undefined (CC auto-title 보존)', `got: ${JSON.stringify(it3bTitle)}`);

// =============== TC-IT4: PreCompact block on critical phase ===============
// Update PDCA status to 'do' phase
pdcaStatus.currentPhase = 'do';
pdcaStatus.features['test-issue77'].phase = 'do';
fs.writeFileSync(path.join(tmpProject, '.bkit', 'state', 'pdca-status.json'), JSON.stringify(pdcaStatus));
const it4 = runHook(path.join(REPO, 'scripts/context-compaction.js'), {
  reason: 'manual',
}, baseEnv);
const it4Decision = it4.parsed?.decision;
assert('TC-IT4', it4Decision === 'block', `PreCompact manual + do phase → block (exit code: ${it4.code}, decision: ${it4Decision})`);

// =============== TC-IT5: PreCompact NOT blocked on non-critical phase ===============
pdcaStatus.currentPhase = 'plan';
pdcaStatus.features['test-issue77'].phase = 'plan';
fs.writeFileSync(path.join(tmpProject, '.bkit', 'state', 'pdca-status.json'), JSON.stringify(pdcaStatus));
const it5 = runHook(path.join(REPO, 'scripts/context-compaction.js'), {
  reason: 'manual',
}, baseEnv);
const it5Decision = it5.parsed?.decision;
assert('TC-IT5', it5Decision !== 'block', `PreCompact manual + plan phase → NOT block (decision: ${it5Decision})`);

// =============== TC-IT6: PreCompact 'auto' never blocks ===============
pdcaStatus.currentPhase = 'do';
pdcaStatus.features['test-issue77'].phase = 'do';
fs.writeFileSync(path.join(tmpProject, '.bkit', 'state', 'pdca-status.json'), JSON.stringify(pdcaStatus));
const it6 = runHook(path.join(REPO, 'scripts/context-compaction.js'), {
  reason: 'auto',
}, baseEnv);
const it6Decision = it6.parsed?.decision;
assert('TC-IT6', it6Decision !== 'block', `PreCompact auto reason → NOT block even on do phase (decision: ${it6Decision})`);

// === Cleanup ===
try { fs.rmSync(tmpProject, { recursive: true, force: true }); } catch (_e) {}

console.log(`\n=== Integration Results: ${passed}/${total} passed (${failed} failed) ===`);
process.exit(failed > 0 ? 1 : 0);
