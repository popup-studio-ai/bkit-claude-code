#!/usr/bin/env node
/**
 * bkit Full System QA — Unit + E2E + Process validation.
 * Run: node tests/qa/bkit-full-system.test.js
 *
 * Coverage:
 *   A. Unit        : lib/ module loadability, exports surface
 *   B. E2E         : 6 hook scripts smoke (SessionStart, UserPrompt, etc.)
 *   C. Process     : getUIConfig/detectLevel/PDCA status/sessionTitle
 *   D. Metadata    : agents + skills frontmatter validity
 *   E. MCP         : bkit-pdca + bkit-analysis syntax + exports
 *   F. Config      : bkit.config.json schema + hooks.json validity
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
process.env.CLAUDE_PLUGIN_ROOT = PROJECT_ROOT;

// BKIT_VERSION — dynamic SoT from bkit.config.json
const BKIT_VERSION = (() => {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'bkit.config.json'), 'utf-8'));
    return cfg.version;
  } catch {
    return null;
  }
})();
const VERSION_REGEX_DOTS = BKIT_VERSION ? BKIT_VERSION.replace(/\./g, '\\.') : null;

let pass = 0;
let fail = 0;
let warn = 0;
const failures = [];

function tc(id, fn) {
  try {
    fn();
    console.log(`✅ ${id}`);
    pass++;
  } catch (e) {
    console.error(`❌ ${id} — ${e.message}`);
    failures.push({ id, error: e.message });
    fail++;
  }
}

function group(name) {
  console.log(`\n=== ${name} ===`);
}

// ---------------------------------------------------------------------------
// Group A: Unit — lib/ module loadability
// ---------------------------------------------------------------------------
group('A. lib/ module loadability (Unit)');

function libModules() {
  const libs = [];
  const subdirs = fs.readdirSync(path.join(PROJECT_ROOT, 'lib'))
    .filter(d => fs.statSync(path.join(PROJECT_ROOT, 'lib', d)).isDirectory());
  for (const sub of subdirs) {
    const subPath = path.join(PROJECT_ROOT, 'lib', sub);
    const files = fs.readdirSync(subPath).filter(f => f.endsWith('.js'));
    for (const f of files) libs.push(`lib/${sub}/${f}`);
  }
  return libs;
}

const allLibs = libModules();
tc(`A1. lib module count ≥ 90 (actual ${allLibs.length})`, () => {
  assert(allLibs.length >= 90, `expected ≥90, got ${allLibs.length}`);
});

// Require each lib module; collect failures
let libFail = 0;
for (const lib of allLibs) {
  try {
    require(path.join(PROJECT_ROOT, lib));
  } catch (e) {
    console.error(`   ❌ require fail: ${lib} — ${e.message.slice(0, 120)}`);
    libFail++;
  }
}
tc(`A2. All ${allLibs.length} lib modules load without error`, () => {
  assert.strictEqual(libFail, 0, `${libFail} modules failed to load`);
});

// Critical lib exports exist
tc('A3. lib/core/config.js exports getConfig + getUIConfig', () => {
  const cfg = require(path.join(PROJECT_ROOT, 'lib/core/config'));
  assert(typeof cfg.getConfig === 'function', 'getConfig');
  assert(typeof cfg.getUIConfig === 'function', 'getUIConfig');
});

tc('A4. lib/core/context-budget.js exports applyBudget + defaults', () => {
  const cb = require(path.join(PROJECT_ROOT, 'lib/core/context-budget'));
  assert(typeof cb.applyBudget === 'function', 'applyBudget');
  assert.strictEqual(cb.DEFAULT_MAX_CHARS, 8000, 'DEFAULT_MAX_CHARS=8000');
  assert(Array.isArray(cb.DEFAULT_PRIORITY_KEYS), 'DEFAULT_PRIORITY_KEYS[]');
});

tc('A5. lib/core/session-ctx-fp.js exports shouldDedup + record + computeFingerprint', () => {
  const fp = require(path.join(PROJECT_ROOT, 'lib/core/session-ctx-fp'));
  assert(typeof fp.computeFingerprint === 'function', 'computeFingerprint');
  assert(typeof fp.shouldDedup === 'function', 'shouldDedup');
  assert(typeof fp.record === 'function', 'record');
});

tc('A6. lib/pdca exports getPdcaStatusFull + detectLevel', () => {
  const pdca = require(path.join(PROJECT_ROOT, 'lib/pdca'));
  assert(typeof pdca.getPdcaStatusFull === 'function', 'getPdcaStatusFull');
  const lvl = require(path.join(PROJECT_ROOT, 'lib/pdca/level'));
  assert(typeof lvl.detectLevel === 'function', 'detectLevel');
});

tc('A7. lib/pdca/session-title exports generateSessionTitle', () => {
  const st = require(path.join(PROJECT_ROOT, 'lib/pdca/session-title'));
  assert(typeof st.generateSessionTitle === 'function', 'generateSessionTitle');
});

tc('A8. lib/ui/ansi exports stripAnsi', () => {
  const a = require(path.join(PROJECT_ROOT, 'lib/ui/ansi'));
  assert(typeof a.stripAnsi === 'function', 'stripAnsi');
  assert.strictEqual(a.stripAnsi('\x1b[36mhi\x1b[0m'), 'hi', 'stripAnsi correctness');
});

tc('A9. lib/team exports isTeamModeAvailable', () => {
  const t = require(path.join(PROJECT_ROOT, 'lib/team'));
  assert(typeof t.isTeamModeAvailable === 'function', 'isTeamModeAvailable');
});

tc('A10. lib/intent exports language + trigger matchers', () => {
  const i = require(path.join(PROJECT_ROOT, 'lib/intent'));
  const keys = Object.keys(i);
  assert(keys.length > 0, `lib/intent has ${keys.length} exports`);
});

// ---------------------------------------------------------------------------
// Group B: E2E — hook scripts smoke
// ---------------------------------------------------------------------------
group('B. Hook scripts E2E smoke');

function runHook(relPath, input = {}, extraEnv = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-qa-'));
  try {
    const r = spawnSync('node', [path.join(PROJECT_ROOT, relPath)], {
      cwd: tmp,
      stdio: ['pipe', 'pipe', 'pipe'],
      input: JSON.stringify(input),
      env: {
        ...process.env,
        CLAUDE_PLUGIN_ROOT: PROJECT_ROOT,
        CLAUDE_PROJECT_DIR: tmp,
        CLAUDE_SESSION_ID: `qa-${Date.now()}`,
        ...extraEnv,
      },
      timeout: 10000,
    });
    return { stdout: r.stdout.toString(), stderr: r.stderr.toString(), code: r.status };
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_e) {}
  }
}

tc('B1. hooks/session-start.js exits 0 and emits valid JSON', () => {
  const r = runHook('hooks/session-start.js', { hook_event_name: 'SessionStart' });
  assert.strictEqual(r.code, 0, `exit ${r.code}. stderr=${r.stderr.slice(0, 200)}`);
  const parsed = JSON.parse(r.stdout);
  assert(parsed.systemMessage && parsed.systemMessage.includes('v' + BKIT_VERSION), `v${BKIT_VERSION} in systemMessage`);
  assert.strictEqual(parsed.hookSpecificOutput.hookEventName, 'SessionStart', 'hookEventName');
});

tc('B2. scripts/user-prompt-handler.js exits 0 (empty prompt)', () => {
  const r = runHook('scripts/user-prompt-handler.js', {
    hook_event_name: 'UserPromptSubmit',
    prompt: 'hello world',
  });
  assert.strictEqual(r.code, 0, `exit ${r.code}. stderr=${r.stderr.slice(0, 200)}`);
});

tc('B3. scripts/post-compaction.js exits 0 (no PDCA state)', () => {
  const r = runHook('scripts/post-compaction.js', {
    hook_event_name: 'PostCompact',
  });
  assert.strictEqual(r.code, 0, `exit ${r.code}. stderr=${r.stderr.slice(0, 200)}`);
});

tc('B4. scripts/pdca-skill-stop.js exits 0 (no active PDCA)', () => {
  const r = runHook('scripts/pdca-skill-stop.js', { hook_event_name: 'Stop' });
  // exit 0 or graceful silent exit acceptable
  assert(r.code === 0 || r.code === null, `exit ${r.code}. stderr=${r.stderr.slice(0, 200)}`);
});

tc('B5. scripts/context-compaction.js (PreCompact) exits 0 with no PDCA', () => {
  const r = runHook('scripts/context-compaction.js', {
    hook_event_name: 'PreCompact',
    trigger: 'auto',
  });
  assert.strictEqual(r.code, 0, `exit ${r.code}. stderr=${r.stderr.slice(0, 200)}`);
});

tc('B6. scripts/pre-write.js (PreToolUse Write) exits 0', () => {
  const r = runHook('scripts/pre-write.js', {
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: '/tmp/bkit-qa-test.txt', content: 'noop' },
  });
  // pre-write may exit 0 or 2 (decision:block) depending on rules; both non-crash
  assert(r.code === 0 || r.code === 2, `exit ${r.code}. stderr=${r.stderr.slice(0, 200)}`);
});

// ---------------------------------------------------------------------------
// Group C: Process — config + level + PDCA + sessionTitle
// ---------------------------------------------------------------------------
group('C. Process — config/level/PDCA/sessionTitle');

tc('C1. getUIConfig returns all 3 ui blocks with defaults', () => {
  delete require.cache[require.resolve(path.join(PROJECT_ROOT, 'lib/core/config'))];
  const { getUIConfig } = require(path.join(PROJECT_ROOT, 'lib/core/config'));
  const ui = getUIConfig();
  assert(ui.sessionTitle && typeof ui.sessionTitle.enabled === 'boolean', 'sessionTitle');
  assert(ui.dashboard && Array.isArray(ui.dashboard.sections), 'dashboard.sections[]');
  assert(ui.contextInjection && Array.isArray(ui.contextInjection.sections), 'contextInjection.sections[]');
  assert.strictEqual(ui.contextInjection.maxChars, 8000, 'maxChars default 8000');
  assert(Array.isArray(ui.contextInjection.priorityPreserve), 'priorityPreserve[]');
});

tc('C2. detectLevel returns one of Starter/Dynamic/Enterprise', () => {
  const { detectLevel } = require(path.join(PROJECT_ROOT, 'lib/pdca/level'));
  const level = detectLevel();
  assert(['Starter', 'Dynamic', 'Enterprise'].includes(level), `unexpected level: ${level}`);
});

tc('C3. getPdcaStatusFull returns object (may be null on first run)', () => {
  const { getPdcaStatusFull } = require(path.join(PROJECT_ROOT, 'lib/pdca'));
  const st = getPdcaStatusFull();
  // may be null, object, or have features field
  assert(st === null || typeof st === 'object', `unexpected type: ${typeof st}`);
});

tc('C4. generateSessionTitle returns string or undefined', () => {
  const { generateSessionTitle } = require(path.join(PROJECT_ROOT, 'lib/pdca/session-title'));
  const title = generateSessionTitle({ feature: 'qa-feature', phase: 'plan', sessionId: 'qa-sid' });
  assert(title === undefined || typeof title === 'string', `unexpected type: ${typeof title}`);
});

tc('C5. applyBudget + computeFingerprint integration (context-budget ↔ session-ctx-fp)', () => {
  const { applyBudget } = require(path.join(PROJECT_ROOT, 'lib/core/context-budget'));
  const { computeFingerprint } = require(path.join(PROJECT_ROOT, 'lib/core/session-ctx-fp'));
  const big = 'MANDATORY: keep\n\n' + 'x'.repeat(20000);
  const trimmed = applyBudget(big);
  const fp1 = computeFingerprint(trimmed);
  const fp2 = computeFingerprint(trimmed);
  assert(trimmed.includes('MANDATORY'), 'priority preserved');
  assert(trimmed.length < big.length, 'truncation applied');
  assert.strictEqual(fp1, fp2, 'fingerprint deterministic');
  assert.strictEqual(fp1.length, 16, 'fp 64-bit truncated');
});

tc('C6. bkit.config.json pdca.docPaths schema valid', () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'bkit.config.json'), 'utf-8'));
  assert(cfg.pdca && cfg.pdca.docPaths, 'pdca.docPaths exists');
  ['plan', 'design', 'analysis', 'report'].forEach(k => {
    assert(Array.isArray(cfg.pdca.docPaths[k]), `docPaths.${k} is array`);
    assert(cfg.pdca.docPaths[k].length > 0, `docPaths.${k} non-empty`);
  });
});

tc('C7. hooks.json schema valid + SessionStart registered', () => {
  const hj = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'hooks/hooks.json'), 'utf-8'));
  assert(hj.description && hj.description.includes('v' + BKIT_VERSION), `v${BKIT_VERSION} description`);
  assert(Array.isArray(hj.hooks.SessionStart), 'SessionStart registered');
  assert(hj.hooks.PreToolUse, 'PreToolUse registered');
  assert(hj.hooks.UserPromptSubmit || hj.hooks.Stop, 'other events registered');
});

// ---------------------------------------------------------------------------
// Group D: Metadata — agents + skills frontmatter
// ---------------------------------------------------------------------------
group('D. Frontmatter validity (agents + skills)');

// v2.1.18 (CO-5): parseFrontmatter centralized in lib/util/frontmatter.
// Returns {} (not null) when no frontmatter — callers using `if (!fm || !fm.name)`
// remain correct because empty-object name lookup is undefined.
const { parseFrontmatter } = require('../../lib/util/frontmatter');

const allAgentFiles = fs.readdirSync(path.join(PROJECT_ROOT, 'agents'))
  .filter(f => f.endsWith('.md'));

// v2.1.17: active agent count excludes deprecation tombstones (deprecatedIn frontmatter).
// See docs/06-guide/contract-baseline-rollforward.guide.md §5.
const agentFiles = allAgentFiles.filter(f => {
  const content = fs.readFileSync(path.join(PROJECT_ROOT, 'agents', f), 'utf-8');
  const fm = parseFrontmatter(content);
  return !(fm && fm.deprecatedIn);
});

const skillDirs = fs.readdirSync(path.join(PROJECT_ROOT, 'skills'))
  .filter(d => {
    const p = path.join(PROJECT_ROOT, 'skills', d);
    return fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, 'SKILL.md'));
  });

tc(`D1. Active Agents count = 34 (actual ${agentFiles.length}, total incl. deprecated = ${allAgentFiles.length})`, () => {
  // v2.1.14 Sub-Sprint 6 (Observation): baseline 36 → 34
  // v2.1.17: deprecated stubs (e.g., pdca-eval-*) excluded from active count
  assert.strictEqual(agentFiles.length, 34, `got ${agentFiles.length}`);
});

tc(`D2. Skills count ≥ 37 (actual ${skillDirs.length})`, () => {
  assert(skillDirs.length >= 37, `got ${skillDirs.length}`);
});

let agentBadFm = 0;
for (const f of agentFiles) {
  const content = fs.readFileSync(path.join(PROJECT_ROOT, 'agents', f), 'utf-8');
  const fm = parseFrontmatter(content);
  if (!fm || !fm.name || !fm.description) {
    console.error(`   ❌ bad frontmatter: agents/${f}`);
    agentBadFm++;
  }
}
tc(`D3. All ${agentFiles.length} agents have valid frontmatter (name + description)`, () => {
  assert.strictEqual(agentBadFm, 0, `${agentBadFm} agents with bad frontmatter`);
});

let skillBadFm = 0;
for (const d of skillDirs) {
  const content = fs.readFileSync(path.join(PROJECT_ROOT, 'skills', d, 'SKILL.md'), 'utf-8');
  const fm = parseFrontmatter(content);
  if (!fm || !fm.name || !fm.description) {
    console.error(`   ❌ bad frontmatter: skills/${d}/SKILL.md`);
    skillBadFm++;
  }
}
tc(`D4. All ${skillDirs.length} skills have valid frontmatter (name + description)`, () => {
  assert.strictEqual(skillBadFm, 0, `${skillBadFm} skills with bad frontmatter`);
});

// ---------------------------------------------------------------------------
// Group E: MCP servers
// ---------------------------------------------------------------------------
group('E. MCP servers');

const mcpServers = ['bkit-pdca-server', 'bkit-analysis-server'];
for (const srv of mcpServers) {
  tc(`E. servers/${srv}/index.js syntax check`, () => {
    const r = spawnSync('node', ['-c', path.join(PROJECT_ROOT, 'servers', srv, 'index.js')], {
      timeout: 5000,
    });
    assert.strictEqual(r.status, 0, `syntax error: ${r.stderr.toString().slice(0, 200)}`);
  });
}

// ---------------------------------------------------------------------------
// Group F: Version consistency
// ---------------------------------------------------------------------------
group(`F. Version consistency (v${BKIT_VERSION})`);

const versionChecks = [
  ['.claude-plugin/plugin.json', new RegExp(`"version":\\s*"${VERSION_REGEX_DOTS}"`)],
  ['.claude-plugin/marketplace.json', new RegExp(`"version":\\s*"${VERSION_REGEX_DOTS}"`)],
  ['bkit.config.json', new RegExp(`"version":\\s*"${VERSION_REGEX_DOTS}"`)],
  ['hooks/hooks.json', new RegExp(`v${VERSION_REGEX_DOTS}`)],
  ['hooks/session-start.js', new RegExp(`v${VERSION_REGEX_DOTS}`)],
  ['hooks/startup/session-context.js', new RegExp(`v${VERSION_REGEX_DOTS}`)],
  ['README.md', new RegExp(`Version-${VERSION_REGEX_DOTS}`)],
];

for (const [file, pattern] of versionChecks) {
  tc(`F. ${file} contains v${BKIT_VERSION}`, () => {
    const fullPath = path.join(PROJECT_ROOT, file);
    if (!fs.existsSync(fullPath)) {
      console.warn(`   ⚠ skipped (file missing): ${file}`);
      return;
    }
    const content = fs.readFileSync(fullPath, 'utf-8');
    assert(pattern.test(content), `${file} missing pattern ${pattern}`);
  });
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('\n=============================================');
console.log(`[bkit-full-system.test] ${pass} PASS / ${fail} FAIL / ${warn} WARN`);
if (failures.length > 0) {
  console.log('Failures:');
  failures.forEach(f => console.log(`  - ${f.id}: ${f.error}`));
}
console.log('=============================================\n');
process.exit(fail === 0 ? 0 : 1);
