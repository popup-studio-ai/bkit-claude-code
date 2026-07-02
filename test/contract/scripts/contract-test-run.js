#!/usr/bin/env node
/**
 * Contract Test Runner — v2.1.10
 *
 * L1 Frontmatter Schema · L4 Deprecation Detection.
 * (L2 Smoke / L3 Compatibility / L5 E2E are runtime-dependent and
 *  implemented as Playwright-style tests — out of scope for this minimal runner.)
 *
 * Design Ref: bkit-v2110-invocation-contract-addendum.plan.md §9.3
 * Plan SC: CI Gate = FAIL on any L1/L4 violation.
 *
 * Usage:
 *   node test/contract/scripts/contract-test-run.js --compare v2.1.9 --level L1,L4
 *
 * @module test/contract/scripts/contract-test-run
 */

const fs = require('fs');
const path = require('path');
const {
  parseFrontmatter,
  collectSkills,
  collectAgents,
  collectMCPTools,
  collectHooks,
  collectSlashCommands,
} = require('./contract-baseline-collect');

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : def;
}

// v2.1.18 (CO-4): --project-root override enables fixture-based isolated tests.
// Default = repo root (../../.. from this script). When overridden, both
// the agents/ scan path AND the baseline directory are rooted at the fixture.
const projectRootArg = arg('--project-root', null);
const PROJECT_ROOT = projectRootArg
  ? path.resolve(projectRootArg)
  : path.resolve(__dirname, '..', '..', '..');

const compareVersion = arg('--compare', 'v2.1.9');
const levels = arg('--level', 'L1,L4').split(',').map((l) => l.trim());
const BASE_DIR = path.join(PROJECT_ROOT, 'test', 'contract', 'baseline', compareVersion);

const failures = [];
const warnings = [];
let assertionCount = 0;

function assert(cond, failMsg) {
  assertionCount++;
  if (!cond) failures.push(failMsg);
}

function warn(msg) {
  warnings.push(msg);
}

function loadBaselineManifest() {
  const p = path.join(BASE_DIR, '_MANIFEST.json');
  if (!fs.existsSync(p)) {
    throw new Error(`Baseline manifest missing: ${p}\nRun contract-baseline-collect.js first.`);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// v2.1.25 (#128, ADR 0014): machine-readable deprecation registry replaces
// live stub .md tombstones. Rooted at PROJECT_ROOT so --project-root fixtures
// get their own registry (or none — absent file means no tombstones).
function loadDeprecationRegistry() {
  const p = path.join(PROJECT_ROOT, 'test', 'contract', 'deprecation-registry.json');
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function runL1Skills() {
  const skillsDir = path.join(PROJECT_ROOT, 'skills');
  const baselineSkillsDir = path.join(BASE_DIR, 'skills');
  if (!fs.existsSync(baselineSkillsDir)) return;
  const baselineFiles = fs.readdirSync(baselineSkillsDir).filter((f) => f.endsWith('.json'));
  for (const bf of baselineFiles) {
    const baseline = JSON.parse(fs.readFileSync(path.join(baselineSkillsDir, bf), 'utf8'));
    const skillName = baseline.name;
    const currentMd = path.join(skillsDir, baseline.dirName || skillName, 'SKILL.md');
    if (!fs.existsSync(currentMd)) {
      // Skill may have moved; allow L4 to handle deprecation.
      continue;
    }
    const fm = parseFrontmatter(fs.readFileSync(currentMd, 'utf8'));
    // L1-SK: name unchanged
    assert(
      (fm.name || baseline.dirName) === baseline.name,
      `L1-SK FAIL skills/${skillName}: name changed ('${fm.name}' !== '${baseline.name}')`
    );
    // L1-SK: context value unchanged (critical for zero-script-qa)
    if (baseline.context) {
      assert(
        fm.context === baseline.context,
        `L1-SK FAIL skills/${skillName}: context changed ('${fm.context}' !== '${baseline.context}')`
      );
    }
    // L1-SK: description length within CC cap (1536 as of v2.1.105)
    if (typeof fm.description === 'string') {
      assert(
        fm.description.length <= 1536,
        `L1-SK FAIL skills/${skillName}: description too long (${fm.description.length} > 1536)`
      );
    }
    // L1-SK: user-invocable regression (false → cannot become true silently)
    if (baseline.userInvocable === false && fm['user-invocable'] === true) {
      warn(`L1-SK WARN skills/${skillName}: user-invocable promoted false → true (intentional?)`);
    }
    if (baseline.userInvocable === true && fm['user-invocable'] === false) {
      assert(false, `L1-SK FAIL skills/${skillName}: user-invocable regressed true → false`);
    }
  }
}

function runL1Agents() {
  const agentsDir = path.join(PROJECT_ROOT, 'agents');
  const baselineAgentsDir = path.join(BASE_DIR, 'agents');
  if (!fs.existsSync(baselineAgentsDir)) return;
  const baselineFiles = fs.readdirSync(baselineAgentsDir).filter((f) => f.endsWith('.json'));
  for (const bf of baselineFiles) {
    const baseline = JSON.parse(fs.readFileSync(path.join(baselineAgentsDir, bf), 'utf8'));
    const agentName = baseline.name;
    const currentMd = path.join(agentsDir, `${baseline.fileName || agentName}.md`);
    if (!fs.existsSync(currentMd)) continue;
    const fm = parseFrontmatter(fs.readFileSync(currentMd, 'utf8'));
    assert(
      (fm.name || baseline.fileName) === baseline.name,
      `L1-AG FAIL agents/${agentName}: name changed`
    );
    // model field must not be removed (fallback would change behavior)
    if (baseline.model) {
      assert(
        fm.model && fm.model === baseline.model,
        `L1-AG FAIL agents/${agentName}: model changed/removed ('${fm.model}' !== '${baseline.model}')`
      );
    }
    // tools presence (removal = feature regression)
    if (baseline.hasTools) {
      assert(
        fm.tools !== undefined,
        `L1-AG FAIL agents/${agentName}: tools field removed (was present in baseline)`
      );
    }
  }
}

function runL1MCP() {
  const current = collectMCPTools({ persist: false, projectRoot: PROJECT_ROOT });
  const baseline = loadBaselineManifest().mcpTools;
  for (const [server, tools] of Object.entries(baseline.servers || {})) {
    const currentTools = (current.servers && current.servers[server]) || [];
    for (const tn of tools) {
      assert(
        currentTools.includes(tn),
        `L1-MCP FAIL ${server}: tool '${tn}' missing from current (baseline had it)`
      );
    }
  }
}

function runL1Hooks() {
  const current = collectHooks({ persist: false, projectRoot: PROJECT_ROOT });
  const baseline = loadBaselineManifest().hooks;
  // Additions-tolerant counts (ENH-371): every other L1 surface (skills/agents/MCP)
  // guards by per-identity existence and silently accepts additions — a NEW hook event
  // must not break a frozen baseline compare any more than a new skill does. The
  // per-event existence loop below is the real removal guard; the count checks only
  // fail on a NET DECREASE. This also honors the LTS-frozen governance in
  // docs/06-guide/contract-baseline-rollforward.guide.md §3.1 (LTS v2.1.9 is edited
  // only at a major LTS transition, never for a routine hook addition).
  assert(
    current.events >= baseline.events,
    `L1-HK FAIL hook events count decreased (${current.events} < ${baseline.events}) — additions OK, removals fail`
  );
  assert(
    current.blocks >= baseline.blocks,
    `L1-HK FAIL hook blocks count decreased (${current.blocks} < ${baseline.blocks}) — block additions OK, removals fail`
  );
  // Verify each baseline event still exists
  const baselineEventsFile = path.join(BASE_DIR, 'hook-events.json');
  if (fs.existsSync(baselineEventsFile)) {
    const bEvents = JSON.parse(fs.readFileSync(baselineEventsFile, 'utf8'));
    const currentHooksJson = JSON.parse(
      fs.readFileSync(path.join(PROJECT_ROOT, 'hooks', 'hooks.json'), 'utf8')
    );
    const currentEvents = Object.keys(currentHooksJson.hooks || {});
    for (const evt of Object.keys(bEvents)) {
      assert(
        currentEvents.includes(evt),
        `L1-HK FAIL hook event '${evt}' removed from hooks.json`
      );
    }
  }
}

function runL4Deprecation() {
  const manifest = loadBaselineManifest();
  // Skills
  const currentSkills = collectSkills({ persist: false, projectRoot: PROJECT_ROOT });
  for (const skillName of manifest.skills.names) {
    if (!currentSkills.names.includes(skillName)) {
      const skillDir = path.join(PROJECT_ROOT, 'skills', skillName);
      const skillMd = path.join(skillDir, 'SKILL.md');
      let deprecated = false;
      if (fs.existsSync(skillMd)) {
        const fm = parseFrontmatter(fs.readFileSync(skillMd, 'utf8'));
        deprecated = !!fm.deprecatedIn;
      }
      assert(
        deprecated,
        `L4 FAIL skill '${skillName}' missing from current without deprecatedIn declaration`
      );
    }
  }
  // Agents — Skills 패턴과 동일하게 deprecatedIn frontmatter 우회 지원 (v2.1.17)
  // v2.1.25 (#128, ADR 0014): a deprecation-registry tombstone with deprecatedIn
  // is equivalent to a live stub — stubs were removed off the prompt surface.
  const registry = loadDeprecationRegistry();
  const currentAgents = collectAgents({ persist: false, projectRoot: PROJECT_ROOT });
  // collectAgents returns { count: 0 } (no names) when agents/ is absent —
  // e.g. fixture repos; treat as "no current agents" instead of crashing.
  const currentAgentNames = currentAgents.names || [];
  for (const agentName of manifest.agents.names) {
    if (!currentAgentNames.includes(agentName)) {
      const baselineFile = path.join(BASE_DIR, 'agents', `${agentName}.json`);
      const baselineMeta = fs.existsSync(baselineFile)
        ? JSON.parse(fs.readFileSync(baselineFile, 'utf8'))
        : {};
      const agentMd = path.join(
        PROJECT_ROOT,
        'agents',
        `${baselineMeta.fileName || agentName}.md`
      );
      let deprecated = false;
      if (fs.existsSync(agentMd)) {
        const fm = parseFrontmatter(fs.readFileSync(agentMd, 'utf8'));
        deprecated = !!fm.deprecatedIn;
      }
      if (!deprecated) {
        const tombstone = (registry.agents || {})[agentName];
        deprecated = !!(tombstone && tombstone.deprecatedIn);
      }
      assert(
        deprecated,
        `L4 FAIL agent '${agentName}' missing from current without deprecatedIn declaration`
      );
    }
  }
  // MCP tools — same pattern (v2.1.17): baseline JSON's deprecatedIn field acts as tombstone
  const currentMCP = collectMCPTools({ persist: false, projectRoot: PROJECT_ROOT });
  for (const [server, tools] of Object.entries(manifest.mcpTools.servers || {})) {
    const currentTools = (currentMCP.servers && currentMCP.servers[server]) || [];
    for (const tn of tools) {
      if (!currentTools.includes(tn)) {
        const baselineToolFile = path.join(BASE_DIR, 'mcp-tools', server, `${tn}.json`);
        let deprecated = false;
        if (fs.existsSync(baselineToolFile)) {
          const meta = JSON.parse(fs.readFileSync(baselineToolFile, 'utf8'));
          deprecated = !!meta.deprecatedIn;
        }
        assert(
          deprecated,
          `L4 FAIL MCP tool '${server}.${tn}' missing from current without deprecatedIn declaration`
        );
      }
    }
  }
}

function report() {
  // eslint-disable-next-line no-console
  console.log(`[contract] Runner v2.1.10 — compare against ${compareVersion}, levels: ${levels.join(',')}`);
  // eslint-disable-next-line no-console
  console.log(`[contract] Assertions executed: ${assertionCount}`);
  if (warnings.length) {
    // eslint-disable-next-line no-console
    console.warn(`[contract] ${warnings.length} warning(s):`);
    // eslint-disable-next-line no-console
    warnings.forEach((w) => console.warn(`  ! ${w}`));
  }
  if (failures.length) {
    // eslint-disable-next-line no-console
    console.error(`[contract] ${failures.length} FAILURE(s):`);
    // eslint-disable-next-line no-console
    failures.forEach((f) => console.error(`  ✗ ${f}`));
    process.exit(1);
  }
  // eslint-disable-next-line no-console
  console.log(`[contract] ✓ PASSED (${assertionCount} assertions, ${warnings.length} warnings)`);
}

function main() {
  try {
    if (levels.includes('L1')) {
      runL1Skills();
      runL1Agents();
      runL1MCP();
      runL1Hooks();
    }
    if (levels.includes('L4')) {
      runL4Deprecation();
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`[contract] Runner error: ${e.message}`);
    process.exit(2);
  }
  report();
}

if (require.main === module) main();

module.exports = { runL1Skills, runL1Agents, runL1MCP, runL1Hooks, runL4Deprecation, loadDeprecationRegistry };
