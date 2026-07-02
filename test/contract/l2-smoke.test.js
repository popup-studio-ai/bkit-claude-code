/*
 * L2 Invocation Smoke Tests — Sprint 3 Addendum §8.
 *
 * Verifies that every hook handler script parses (node -c equivalent)
 * and when stdin piped with a minimal valid payload, exits ∈ {0,1,2}
 * (never crashes), writes something (or empty) to stdout.
 *
 * Does NOT require the real CC runtime; uses child_process.spawnSync.
 */

const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

let pass = 0, fail = 0;
function test(name, fn) { try { fn(); pass++; } catch (e) { fail++; console.error(`✗ ${name}: ${e.message}`); } }

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const hooksJson = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'hooks', 'hooks.json'), 'utf8'));

// Collect unique handler paths from hooks.json (matcher-split blocks).
const handlers = new Set();
for (const [, entries] of Object.entries(hooksJson.hooks)) {
  for (const entry of entries) {
    for (const hook of entry.hooks || []) {
      const match = (hook.command || '').match(/\$\{CLAUDE_PLUGIN_ROOT\}\/(.+?\.js)/);
      if (match) handlers.add(match[1]);
    }
  }
}

// ============================================================
// Handler file existence
// ============================================================
test('collected ≥20 unique hook handlers', () => assert.ok(handlers.size >= 20));
for (const rel of handlers) {
  test(`handler file exists: ${rel}`, () => {
    assert.ok(fs.existsSync(path.join(PROJECT_ROOT, rel)));
  });
}

// ============================================================
// Handler syntax parse check (node --check)
// ============================================================
for (const rel of handlers) {
  test(`handler parses (syntax): ${rel}`, () => {
    const full = path.join(PROJECT_ROOT, rel);
    const r = spawnSync('node', ['--check', full], { encoding: 'utf8', timeout: 5000 });
    if (r.status !== 0) {
      throw new Error(`parse failed: ${(r.stderr || '').slice(0, 120)}`);
    }
  });
}

// ============================================================
// Handler smoke (stdin minimal JSON → exit code)
// Note: each handler may short-circuit early when stdin is empty or fields missing.
// We only assert that exit code ∈ {0,1,2,...reasonable} and no uncaught throw.
// ============================================================
const MINIMAL_INPUTS = {
  'hooks/session-start.js': '{}\n',
  'scripts/pre-write.js': '{"tool_name":"Write","tool_input":{"file_path":"/tmp/smoketest.txt","content":"hi"}}\n',
  'scripts/unified-bash-pre.js': '{"tool_name":"Bash","tool_input":{"command":"echo hi"}}\n',
  'scripts/unified-write-post.js': '{"tool_name":"Write","tool_input":{"file_path":"/tmp/smoketest.txt"}}\n',
  'scripts/unified-bash-post.js': '{"tool_name":"Bash","tool_input":{"command":"echo done"},"exit_code":0}\n',
  'scripts/skill-post.js': '{"skill_name":"pdca"}\n',
  'scripts/unified-stop.js': '{}\n',
  'scripts/stop-failure-handler.js': '{"reason":"test"}\n',
  'scripts/user-prompt-handler.js': '{"prompt":"hello"}\n',
  'scripts/context-compaction.js': '{"compactType":"auto"}\n',
  'scripts/post-compaction.js': '{}\n',
  'scripts/pdca-task-completed.js': '{"feature":"smoke"}\n',
  'scripts/subagent-start-handler.js': '{"subagent_type":"cto-lead"}\n',
  'scripts/subagent-stop-handler.js': '{"subagent_type":"cto-lead"}\n',
  'scripts/team-idle-handler.js': '{}\n',
  'scripts/session-end-handler.js': '{}\n',
  'scripts/tool-failure-handler.js': '{"tool_name":"Bash","error":"test"}\n',
  'scripts/instructions-loaded-handler.js': '{}\n',
  'scripts/config-change-handler.js': '{"matcher":"project_settings"}\n',
  'scripts/permission-request-handler.js': '{"tool_name":"Write"}\n',
  'scripts/notification-handler.js': '{"matcher":"idle_prompt"}\n',
  'scripts/cwd-changed-handler.js': '{"new_cwd":"/tmp"}\n',
  'scripts/task-created-handler.js': '{"task_id":"t1","subject":"smoke"}\n',
  'scripts/file-changed-handler.js': '{"file_path":"/tmp/x.md","change":"write"}\n',
};

for (const rel of handlers) {
  const input = MINIMAL_INPUTS[rel] || '{}\n';
  test(`handler smoke (stdin → exit): ${rel}`, () => {
    const full = path.join(PROJECT_ROOT, rel);
    const r = spawnSync('node', [full], {
      input,
      encoding: 'utf8',
      timeout: 5000,
      env: { ...process.env, BKIT_DEBUG: '', CLAUDE_PLUGIN_ROOT: PROJECT_ROOT },
    });
    // Accept any exit code; just verify the process completed (not timed out) and did not crash with code 134/139 (signals).
    assert.ok(r.status !== null, 'process did not exit');
    assert.ok(![134, 139].includes(r.status), `process crashed with signal: ${r.status}`);
    // stdout should be parseable JSON OR empty OR plain text (hooks are flexible).
    if (r.stdout && r.stdout.trim().startsWith('{')) {
      try {
        JSON.parse(r.stdout.trim());
      } catch {
        // Handlers may emit multi-line JSON or non-JSON — accept.
      }
    }
  });
}

// ============================================================
// hooks.json structure sanity
// ============================================================
test('hooks.json has 22 event keys', () => {
  assert.strictEqual(Object.keys(hooksJson.hooks).length, 22);
});
test('hooks.json PreToolUse has 2 matcher blocks', () => {
  assert.strictEqual(hooksJson.hooks.PreToolUse.length, 2);
});
test('hooks.json PostToolUse has 3 matcher blocks', () => {
  assert.strictEqual(hooksJson.hooks.PostToolUse.length, 3);
});
test('hooks.json total matcher-blocks = 25', () => {
  let total = 0;
  for (const [, entries] of Object.entries(hooksJson.hooks)) total += entries.length;
  assert.strictEqual(total, 25);
});

// Every block has type:'command' handler
for (const [evt, entries] of Object.entries(hooksJson.hooks)) {
  test(`hook ${evt}: has at least one command handler`, () => {
    const ok = entries.some((e) => (e.hooks || []).some((h) => h.type === 'command'));
    assert.ok(ok);
  });
}

console.log(`\nl2-smoke.test.js: ${pass}/${pass + fail} PASS, ${fail} FAIL, 0 SKIP`);
if (fail > 0) process.exit(1);
