/*
 * Invocation Inventory Sanity Tests — file-level cross-check of Addendum counts.
 *
 * Design Ref: bkit-v2110-invocation-contract-addendum.plan.md §3
 * Plan SC: 43 skills / 36 agents / 16 MCP tools / 21 hook events / 24 blocks.
 *
 * v2.1.11 update: 39 → 43 skills (Sprint β added bkit-evals, bkit-explore,
 * pdca-fast-track, pdca-watch).
 */

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
// v2.1.18: frontmatter helpers centralized in lib/util/frontmatter (CO-5).
const { hasDeprecatedInFrontmatterFile } = require('../../lib/util/frontmatter');
// v2.1.17 (CO-3.1): canonical names lists imported from single SoT.
// Replaces ~6 hardcoded EXPECTED_* arrays previously inline below.
const {
  EXPECTED_ACTIVE_AGENT_NAMES,
  EXPECTED_DEPRECATED_AGENT_NAMES,
  EXPECTED_SKILL_NAMES,
  EXPECTED_HOOK_EVENT_NAMES,
  EXPECTED_PDCA_MCP_TOOLS,
  EXPECTED_ANALYSIS_MCP_TOOLS,
} = require('../../lib/domain/rules/docs-code-invariants');

const ROOT = path.resolve(__dirname, '..', '..');
const baselineDir = path.join(ROOT, 'test', 'contract', 'baseline', 'v2.1.9');

let pass = 0, fail = 0;
function test(name, fn) { try { fn(); pass++; } catch (e) { fail++; console.error(`✗ ${name}: ${e.message}`); } }

// ==================== File System Expectations ====================
const skillsDir = path.join(ROOT, 'skills');
const agentsDir = path.join(ROOT, 'agents');
const hooksJsonPath = path.join(ROOT, 'hooks', 'hooks.json');

test('skills/ directory exists', () => assert.ok(fs.existsSync(skillsDir)));
test('agents/ directory exists', () => assert.ok(fs.existsSync(agentsDir)));
test('hooks/hooks.json exists', () => assert.ok(fs.existsSync(hooksJsonPath)));
test('.claude-plugin/plugin.json exists', () => assert.ok(fs.existsSync(path.join(ROOT, '.claude-plugin', 'plugin.json'))));
test('servers/bkit-pdca-server/index.js exists', () => assert.ok(fs.existsSync(path.join(ROOT, 'servers', 'bkit-pdca-server', 'index.js'))));
test('servers/bkit-analysis-server/index.js exists', () => assert.ok(fs.existsSync(path.join(ROOT, 'servers', 'bkit-analysis-server', 'index.js'))));

// ==================== Skills Count ====================
// v2.1.16 hardening: 43 → 44 (v2.1.13 added 'sprint' for Sprint Management)
// v2.1.17 (CO-3.1): EXPECTED_SKILLS imported from docs-code-invariants SoT.
const skillDirs = fs.readdirSync(skillsDir).filter((d) => fs.statSync(path.join(skillsDir, d)).isDirectory());
test('Skills count exactly 44', () => assert.strictEqual(skillDirs.length, 44));
test('Skills count matches SoT', () => assert.strictEqual(skillDirs.length, EXPECTED_SKILL_NAMES.length));

EXPECTED_SKILL_NAMES.forEach((name) => {
  test(`Skill '${name}' exists`, () => assert.ok(skillDirs.includes(name), `missing: ${name}`));
  test(`Skill '${name}' has SKILL.md`, () => assert.ok(fs.existsSync(path.join(skillsDir, name, 'SKILL.md'))));
});

// ==================== Agents Count ====================
// v2.1.16 hardening: 36 → 34. Removed 6 pdca-eval-* agents (v2.1.10 Sprint 6
// cleanup), added 4 sprint-* agents (v2.1.13 Sprint Management).
// Net: 36 - 6 + 4 = 34.
// v2.1.17: 6 pdca-eval-* deprecation tombstones re-added as stubs (frontmatter
// `deprecatedIn` flag); excluded from the active count. Total files = 40.
// See docs/06-guide/contract-baseline-rollforward.guide.md.
const allAgentFiles = fs.readdirSync(agentsDir).filter((f) => f.endsWith('.md'));

// v2.1.18: hasDeprecatedInFrontmatterFile imported from lib/util/frontmatter (CO-5).
const agentFiles = allAgentFiles.filter(
  (f) => !hasDeprecatedInFrontmatterFile(path.join(agentsDir, f))
);
const deprecatedAgentFiles = allAgentFiles.filter(
  (f) => hasDeprecatedInFrontmatterFile(path.join(agentsDir, f))
);

// v2.1.17 (CO-3.1): EXPECTED_*_AGENT_NAMES imported from docs-code-invariants SoT.
test('Active Agents count exactly 34', () => assert.strictEqual(agentFiles.length, 34));
test('Active Agents count matches SoT', () => assert.strictEqual(agentFiles.length, EXPECTED_ACTIVE_AGENT_NAMES.length));
test('Deprecated Agent tombstones exactly 6', () => assert.strictEqual(deprecatedAgentFiles.length, 6));
test('Deprecated Agent count matches SoT', () => assert.strictEqual(deprecatedAgentFiles.length, EXPECTED_DEPRECATED_AGENT_NAMES.length));

EXPECTED_ACTIVE_AGENT_NAMES.forEach((name) => {
  test(`Agent '${name}.md' exists`, () => assert.ok(agentFiles.includes(`${name}.md`)));
});

EXPECTED_DEPRECATED_AGENT_NAMES.forEach((name) => {
  test(`Deprecated Agent stub '${name}.md' exists with deprecatedIn`, () => {
    assert.ok(deprecatedAgentFiles.includes(`${name}.md`));
  });
});

// ==================== Hooks Count ====================
// v2.1.17 (CO-3.1): EXPECTED_HOOK_EVENT_NAMES imported from docs-code-invariants SoT.
const hooksJson = JSON.parse(fs.readFileSync(hooksJsonPath, 'utf8'));
const hookEventNames = Object.keys(hooksJson.hooks);
test('Hooks count exactly 21 events', () => assert.strictEqual(hookEventNames.length, 21));
test('Hooks count matches SoT', () => assert.strictEqual(hookEventNames.length, EXPECTED_HOOK_EVENT_NAMES.length));

EXPECTED_HOOK_EVENT_NAMES.forEach((name) => {
  test(`Hook '${name}' registered`, () => assert.ok(hookEventNames.includes(name), `missing: ${name}`));
});

// 24 blocks = 1 SessionStart + 2 PreToolUse + 3 PostToolUse + 18 rest
let blockCount = 0;
for (const [, entries] of Object.entries(hooksJson.hooks)) {
  blockCount += entries.length;
}
test('Hooks total blocks = 24', () => assert.strictEqual(blockCount, 24));
test('PreToolUse has 2 blocks', () => assert.strictEqual(hooksJson.hooks.PreToolUse.length, 2));
test('PostToolUse has 3 blocks', () => assert.strictEqual(hooksJson.hooks.PostToolUse.length, 3));

// ==================== MCP Tools (via server index.js grep) ====================
// v2.1.17 (CO-3.1): EXPECTED_*_MCP_TOOLS imported from docs-code-invariants SoT.
// v2.1.13 added 3 sprint tools (bkit_sprint_list, bkit_sprint_status, bkit_master_plan_read)
// — pre-v2.1.17 hardcoded list (16) was stale; SoT (19) is current.
const pdcaServer = fs.readFileSync(path.join(ROOT, 'servers', 'bkit-pdca-server', 'index.js'), 'utf8');
const analysisServer = fs.readFileSync(path.join(ROOT, 'servers', 'bkit-analysis-server', 'index.js'), 'utf8');

EXPECTED_PDCA_MCP_TOOLS.forEach((tn) => {
  test(`MCP pdca tool '${tn}' registered`, () => assert.ok(pdcaServer.includes(`name: '${tn}'`)));
});
EXPECTED_ANALYSIS_MCP_TOOLS.forEach((tn) => {
  test(`MCP analysis tool '${tn}' registered`, () => assert.ok(analysisServer.includes(`name: '${tn}'`)));
});
test('Total MCP tools = 19', () => {
  assert.strictEqual(EXPECTED_PDCA_MCP_TOOLS.length + EXPECTED_ANALYSIS_MCP_TOOLS.length, 19);
});

// ==================== Baseline JSON files exist ====================
test('baseline/v2.1.9/_MANIFEST.json exists', () => assert.ok(fs.existsSync(path.join(baselineDir, '_MANIFEST.json'))));
test('baseline/v2.1.9/hook-events.json exists', () => assert.ok(fs.existsSync(path.join(baselineDir, 'hook-events.json'))));
test('baseline/v2.1.9/slash-commands.json exists', () => assert.ok(fs.existsSync(path.join(baselineDir, 'slash-commands.json'))));

// ==================== Domain Ports exist ====================
const PORT_FILES = [
  'cc-payload.port.js', 'state-store.port.js', 'regression-registry.port.js',
  'audit-sink.port.js', 'token-meter.port.js', 'docs-code-index.port.js',
];
PORT_FILES.forEach((f) => {
  test(`Port '${f}' exists`, () => assert.ok(fs.existsSync(path.join(ROOT, 'lib', 'domain', 'ports', f))));
});

// ==================== Domain Guards exist ====================
const GUARD_FILES = [
  'enh-262-hooks-combo.js', 'enh-263-claude-write.js',
  'enh-264-token-threshold.js', 'enh-254-fork-precondition.js',
];
GUARD_FILES.forEach((f) => {
  test(`Guard '${f}' exists`, () => assert.ok(fs.existsSync(path.join(ROOT, 'lib', 'domain', 'guards', f))));
});

// ==================== cc-regression files exist ====================
const CC_REG_FILES = [
  'registry.js', 'defense-coordinator.js', 'token-accountant.js',
  'lifecycle.js', 'attribution-formatter.js', 'index.js',
];
CC_REG_FILES.forEach((f) => {
  test(`cc-regression/'${f}' exists`, () => assert.ok(fs.existsSync(path.join(ROOT, 'lib', 'cc-regression', f))));
});

// ==================== Config Files ====================
test('eslint.config.js exists', () => assert.ok(fs.existsSync(path.join(ROOT, 'eslint.config.js'))));
test('.prettierrc exists', () => assert.ok(fs.existsSync(path.join(ROOT, '.prettierrc'))));

// ==================== Frontmatter cross-check: v2.1.10 ENH-202 — context:fork expanded ====================
// v2.1.9: only zero-script-qa had context:fork (1/39)
// v2.1.10 Sprint 6 NEW 6-1 (ENH-202): expanded to 9 skills (zero-script-qa retained + 8 new).
// The EXPECTED set below must be kept in sync with Design §3.4.1 and the
// `context-fork-l1.test.js` acceptance list. When extending further, update both.
test('zero-script-qa has context:fork (v2.1.9 baseline preserved)', () => {
  const md = fs.readFileSync(path.join(skillsDir, 'zero-script-qa', 'SKILL.md'), 'utf8');
  assert.ok(/context:\s*fork/m.test(md));
});
test('v2.1.10 ENH-202: context:fork skill set matches expected 9 (readonly-safe skills only)', () => {
  const EXPECTED_FORK_SKILLS = [
    'phase-1-schema',
    'phase-2-convention',
    'phase-3-mockup',
    'phase-4-api',
    'phase-5-design-system',
    'phase-8-review',
    'qa-phase',
    'skill-status',
    'zero-script-qa',
  ].sort();
  const forkSkills = [];
  for (const name of skillDirs) {
    const md = path.join(skillsDir, name, 'SKILL.md');
    if (!fs.existsSync(md)) continue;
    if (/context:\s*fork/m.test(fs.readFileSync(md, 'utf8'))) forkSkills.push(name);
  }
  forkSkills.sort();
  assert.deepStrictEqual(forkSkills, EXPECTED_FORK_SKILLS);
});

// ==================== CLAUDE.md rules ====================
test('.claude/CLAUDE.md exists', () => assert.ok(fs.existsSync(path.join(ROOT, '.claude', 'CLAUDE.md'))));

console.log(`\ninvocation-inventory.test.js: ${pass}/${pass + fail} PASS, ${fail} FAIL, 0 SKIP`);
if (fail > 0) process.exit(1);
