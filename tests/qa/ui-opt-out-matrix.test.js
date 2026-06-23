#!/usr/bin/env node
/**
 * TC-B11: UI 3-way toggle 8-combination matrix test (L4 QA).
 * Spawns hooks/session-start.js with varying bkit.config.json fixtures,
 * validates response JSON structure remains valid across all combos.
 * Run: node tests/qa/ui-opt-out-matrix.test.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const HOOK_PATH = path.join(PROJECT_ROOT, 'hooks/session-start.js');

let pass = 0;
let fail = 0;
function tc(id, fn) {
  try {
    fn();
    console.log(`✅ ${id} PASS`);
    pass++;
  } catch (e) {
    console.error(`❌ ${id} FAIL — ${e.message}`);
    fail++;
  }
}

function makeConfig(sessionTitle, dashboard, contextInjection) {
  return {
    version: '2.1.8',
    ui: {
      sessionTitle: { enabled: sessionTitle },
      dashboard: { enabled: dashboard },
      contextInjection: { enabled: contextInjection },
    },
  };
}

function runHook(configObj) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-matrix-'));
  // GitHub #119: CC sets CLAUDE_CODE_SESSION_ID (primary); legacy mirrored.
  const sessionId = `matrix-${Date.now()}-${Math.random()}`;
  try {
    fs.writeFileSync(path.join(tmp, 'bkit.config.json'), JSON.stringify(configObj));
    const r = spawnSync('node', [HOOK_PATH], {
      cwd: tmp,
      stdio: ['pipe', 'pipe', 'pipe'],
      input: JSON.stringify({ hook_event_name: 'SessionStart' }),
      env: { ...process.env, CLAUDE_PLUGIN_ROOT: PROJECT_ROOT, CLAUDE_CODE_SESSION_ID: sessionId, CLAUDE_SESSION_ID: sessionId },
      timeout: 5000,
    });
    return { stdout: r.stdout.toString(), stderr: r.stderr.toString(), code: r.status };
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_e) {}
  }
}

const combos = [
  [true, true, true],
  [true, true, false],
  [true, false, true],
  [true, false, false],
  [false, true, true],
  [false, true, false],
  [false, false, true],
  [false, false, false],
];

combos.forEach(([st, dash, ci], idx) => {
  tc(`TC-B11.${idx + 1} (st=${st}, dash=${dash}, ci=${ci})`, () => {
    const result = runHook(makeConfig(st, dash, ci));
    assert.strictEqual(result.code, 0, `exit 0 expected, got ${result.code}. stderr=${result.stderr}`);
    assert(result.stdout.length > 0, 'stdout non-empty');

    // JSON response 유효성 검증
    let parsed;
    try {
      parsed = JSON.parse(result.stdout);
    } catch (e) {
      throw new Error(`JSON parse failed: ${e.message}. stdout=${result.stdout.slice(0, 200)}`);
    }

    assert(parsed.systemMessage, 'systemMessage present');
    assert(parsed.hookSpecificOutput, 'hookSpecificOutput present');
    assert.strictEqual(
      parsed.hookSpecificOutput.hookEventName,
      'SessionStart',
      'hookEventName matches'
    );

    // contextInjection=false 시 additionalContext 는 헤더만 또는 빈 문자열
    if (ci === false) {
      const ac = parsed.hookSpecificOutput.additionalContext || '';
      // dedup 재실행 시 빈 문자열일 수 있음, 아니면 헤더만 포함
      if (ac !== '') {
        // 기본값으로 dashboard prepend 가능 — 헤더 확인
        // strict: contextInjection=false 는 session-context 헤더만, dashboard는 session-start.js가 prepend
        assert(ac.length < 8000, `ci=false should keep output lean, got ${ac.length}`);
      }
    }
  });
});

console.log(`\n[ui-opt-out-matrix.test] ${pass} PASS / ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
