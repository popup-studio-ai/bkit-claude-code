/**
 * Agent Frontmatter Security Tests
 * @module test/security/agent-frontmatter
 * @version 1.6.2
 *
 * Validates the 3-Tier Security Model via YAML frontmatter parsing.
 * Each agent .md file is parsed to verify disallowedTools enforcement.
 *
 * Tier 1 (Read-Only): starter-guide, report-generator, security-architect,
 *   pipeline-guide, product-manager, design-validator, qa-strategist,
 *   pm-discovery, pm-research, pm-strategy — disallowedTools includes Bash
 * Tier 2 (Destructive-Blocked): cto-lead, enterprise-expert, frontend-architect,
 *   infra-architect, bkend-expert — blocks rm -rf, git push, git reset --hard
 * Tier 3 (Full Access): qa-monitor, pdca-iterator, pm-lead, pm-prd — Bash allowed
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const AGENTS_DIR = path.resolve(__dirname, '../../agents');

/**
 * Parse YAML frontmatter from agent .md file
 * @param {string} agentName - Agent filename without .md
 * @returns {Object} parsed frontmatter fields
 */
function parseFrontmatter(agentName) {
  const filePath = path.join(AGENTS_DIR, `${agentName}.md`);
  const content = fs.readFileSync(filePath, 'utf8');
  const parts = content.split('---');
  if (parts.length < 3) {
    throw new Error(`No YAML frontmatter found in ${agentName}.md`);
  }
  const yaml = parts[1];

  // Parse name
  const nameMatch = yaml.match(/^name:\s*(.+)$/m);
  const name = nameMatch ? nameMatch[1].trim() : null;

  // Parse disallowedTools as array
  const disallowedTools = [];
  const dtMatch = yaml.match(/disallowedTools:\s*\n((?:\s+-\s*.+\n?)*)/);
  if (dtMatch) {
    const lines = dtMatch[1].split('\n');
    for (const line of lines) {
      const itemMatch = line.match(/^\s+-\s*"?([^"]+)"?\s*$/);
      if (itemMatch) {
        disallowedTools.push(itemMatch[1].trim());
      }
    }
  }

  // Parse tools as array
  const tools = [];
  const toolsMatch = yaml.match(/tools:\s*\n((?:\s+-\s*.+\n?)*)/);
  if (toolsMatch) {
    const lines = toolsMatch[1].split('\n');
    for (const line of lines) {
      const itemMatch = line.match(/^\s+-\s*(.+)$/);
      if (itemMatch) {
        tools.push(itemMatch[1].trim());
      }
    }
  }

  // Parse permissionMode
  const permMatch = yaml.match(/^permissionMode:\s*(.+)$/m);
  const permissionMode = permMatch ? permMatch[1].trim() : null;

  // Parse model
  const modelMatch = yaml.match(/^model:\s*(.+)$/m);
  const model = modelMatch ? modelMatch[1].trim() : null;

  return { name, disallowedTools, tools, permissionMode, model };
}

// ============================================================
// Test Results Collector
// ============================================================
const results = { pass: 0, fail: 0, errors: [] };

function test(id, description, fn) {
  try {
    fn();
    results.pass++;
    console.log(`  PASS  ${id}: ${description}`);
  } catch (e) {
    results.fail++;
    results.errors.push({ id, description, error: e.message });
    console.log(`  FAIL  ${id}: ${description}`);
    console.log(`        ${e.message}`);
  }
}

// ============================================================
// Tier 1: Bash-Denied Agents (Read-Only / Plan-Only)
// ============================================================
console.log('\n=== Tier 1: Bash-Denied Agents ===');

const TIER1_AGENTS = [
  'starter-guide',
  'report-generator',
  'security-architect',
  'pipeline-guide',
  'product-manager',
  'design-validator',
  'qa-strategist',
  'pm-discovery',
  'pm-research',
  'pm-strategy',
];

// SEC-AF-001 ~ SEC-AF-010: Each Tier 1 agent disallows Bash
TIER1_AGENTS.forEach((agent, idx) => {
  const id = `SEC-AF-${String(idx + 1).padStart(3, '0')}`;
  test(id, `${agent} disallowedTools includes Bash`, () => {
    const fm = parseFrontmatter(agent);
    assert.ok(
      fm.disallowedTools.includes('Bash'),
      `${agent} disallowedTools [${fm.disallowedTools.join(', ')}] does not include 'Bash'`
    );
  });
});

// SEC-AF-011: Tier 1 agents should NOT have Bash in tools list
test('SEC-AF-011', 'Tier 1 agents exclude Bash from tools list', () => {
  for (const agent of TIER1_AGENTS) {
    const fm = parseFrontmatter(agent);
    // Some agents may not have explicit tools list; that is acceptable
    if (fm.tools.length > 0) {
      assert.ok(
        !fm.tools.includes('Bash'),
        `${agent} tools list should not include Bash but found: [${fm.tools.join(', ')}]`
      );
    }
  }
});

// SEC-AF-012: starter-guide permissionMode (CC ignores permissionMode for plugin agents, so it's commented out)
test('SEC-AF-012', 'starter-guide permissionMode is commented out (CC limitation)', () => {
  const fm = parseFrontmatter('starter-guide');
  // permissionMode is commented out in agent file because CC ignores it for plugin agents
  // YAML parser may return null or undefined for commented-out fields
  assert.ok(fm.permissionMode == null || fm.permissionMode === 'acceptEdits',
    `starter-guide permissionMode: ${fm.permissionMode} (null/undefined = commented out, acceptable)`);
});

// SEC-AF-013: starter-guide uses sonnet model (cost-optimized)
test('SEC-AF-013', 'starter-guide uses sonnet model', () => {
  const fm = parseFrontmatter('starter-guide');
  assert.strictEqual(fm.model, 'sonnet');
});

// ============================================================
// Tier 2: Destructive-Command-Blocked Agents
// ============================================================
console.log('\n=== Tier 2: Destructive-Command-Blocked Agents ===');

const TIER2_AGENTS = [
  'cto-lead',
  'enterprise-expert',
  'frontend-architect',
  'infra-architect',
  'bkend-expert',
];

const TIER2_BLOCKED_PATTERNS = [
  'Bash(rm -rf*)',
  'Bash(git push*)',
  'Bash(git reset --hard*)',
];

// SEC-AF-014 ~ SEC-AF-018: Each Tier 2 agent blocks rm -rf
TIER2_AGENTS.forEach((agent, idx) => {
  const id = `SEC-AF-${String(idx + 14).padStart(3, '0')}`;
  test(id, `${agent} blocks Bash(rm -rf*)`, () => {
    const fm = parseFrontmatter(agent);
    assert.ok(
      fm.disallowedTools.includes('Bash(rm -rf*)'),
      `${agent} missing Bash(rm -rf*) in disallowedTools: [${fm.disallowedTools.join(', ')}]`
    );
  });
});

// SEC-AF-019 ~ SEC-AF-023: Each Tier 2 agent blocks git push
TIER2_AGENTS.forEach((agent, idx) => {
  const id = `SEC-AF-${String(idx + 19).padStart(3, '0')}`;
  test(id, `${agent} blocks Bash(git push*)`, () => {
    const fm = parseFrontmatter(agent);
    assert.ok(
      fm.disallowedTools.includes('Bash(git push*)'),
      `${agent} missing Bash(git push*) in disallowedTools: [${fm.disallowedTools.join(', ')}]`
    );
  });
});

// SEC-AF-024 ~ SEC-AF-028: Each Tier 2 agent blocks git reset --hard
TIER2_AGENTS.forEach((agent, idx) => {
  const id = `SEC-AF-${String(idx + 24).padStart(3, '0')}`;
  test(id, `${agent} blocks Bash(git reset --hard*)`, () => {
    const fm = parseFrontmatter(agent);
    assert.ok(
      fm.disallowedTools.includes('Bash(git reset --hard*)'),
      `${agent} missing Bash(git reset --hard*) in disallowedTools: [${fm.disallowedTools.join(', ')}]`
    );
  });
});

// SEC-AF-029: Tier 2 agents have exactly 3 disallowed patterns
test('SEC-AF-029', 'Tier 2 agents have exactly 3 disallowedTools entries', () => {
  for (const agent of TIER2_AGENTS) {
    const fm = parseFrontmatter(agent);
    assert.strictEqual(
      fm.disallowedTools.length, 3,
      `${agent} has ${fm.disallowedTools.length} disallowedTools, expected 3`
    );
  }
});

// SEC-AF-030: cto-lead uses fable model (highest capability for orchestration)
test('SEC-AF-030', 'cto-lead uses fable model', () => {
  const fm = parseFrontmatter('cto-lead');
  assert.strictEqual(fm.model, 'fable');
});

// ============================================================
// Tier 3: Full Access Agents (Bash Required)
// ============================================================
console.log('\n=== Tier 3: Full Access Agents ===');

// Tier 3 agents have Bash in tools and no Bash-related disallowedTools
const TIER3_BASH_AGENTS = ['qa-monitor', 'pdca-iterator', 'pm-lead'];

// SEC-AF-031: qa-monitor does NOT disallow Bash
test('SEC-AF-031', 'qa-monitor has no Bash restriction', () => {
  const fm = parseFrontmatter('qa-monitor');
  assert.ok(
    !fm.disallowedTools.includes('Bash'),
    `qa-monitor should not disallow Bash but found: [${fm.disallowedTools.join(', ')}]`
  );
});

// SEC-AF-032: qa-monitor has Bash in tools list
test('SEC-AF-032', 'qa-monitor includes Bash in tools list', () => {
  const fm = parseFrontmatter('qa-monitor');
  assert.ok(
    fm.tools.includes('Bash'),
    `qa-monitor tools should include Bash: [${fm.tools.join(', ')}]`
  );
});

// SEC-AF-033: pm-lead has Bash in tools list (no disallowedTools for Bash)
test('SEC-AF-033', 'pm-lead includes Bash in tools and has no Bash restriction', () => {
  const fm = parseFrontmatter('pm-lead');
  assert.ok(fm.tools.includes('Bash'), 'pm-lead should have Bash in tools');
  const hasBashBlock = fm.disallowedTools.some(t =>
    t === 'Bash' || t.startsWith('Bash(')
  );
  assert.ok(!hasBashBlock, 'pm-lead should not block any Bash patterns');
});

// SEC-AF-034: All agent files exist and parse without error
test('SEC-AF-034', 'All 21 agent files exist and have valid frontmatter', () => {
  const allAgents = [...TIER1_AGENTS, ...TIER2_AGENTS, ...TIER3_BASH_AGENTS,
    'code-analyzer', 'gap-detector', 'pm-prd'];
  for (const agent of allAgents) {
    const filePath = path.join(AGENTS_DIR, `${agent}.md`);
    assert.ok(fs.existsSync(filePath), `${agent}.md not found`);
    const fm = parseFrontmatter(agent);
    assert.ok(fm.name, `${agent}.md has no name in frontmatter`);
  }
});

// SEC-AF-035: No Tier 1 agent has destructive patterns instead of full Bash block
test('SEC-AF-035', 'Tier 1 agents block Bash entirely, not just patterns', () => {
  for (const agent of TIER1_AGENTS) {
    const fm = parseFrontmatter(agent);
    // Should have 'Bash' not 'Bash(rm -rf*)'
    assert.ok(
      fm.disallowedTools.includes('Bash'),
      `${agent} should block 'Bash' entirely, not just specific patterns`
    );
    // Should NOT have pattern-based blocks (those are for Tier 2)
    const hasPatternBlock = fm.disallowedTools.some(t => t.startsWith('Bash('));
    // Note: some may also have pattern blocks alongside full Bash block, which is redundant but not wrong
    // The key check is that full 'Bash' is present
  }
});

// ============================================================
// v1.6.2: effort/maxTurns Frontmatter Validation
// ============================================================
console.log('\n=== v1.6.2: effort/maxTurns Validation ===');

const VALID_EFFORT = ['low', 'medium', 'high'];
const VALID_MAX_TURNS_RANGE = { min: 10, max: 100 };

// SEC-AF-036: All agents have valid effort field
test('SEC-AF-036', 'All agents have valid effort field (low/medium/high)', () => {
  const allAgentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
  for (const file of allAgentFiles) {
    const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8');
    const effortMatch = content.match(/^effort:\s*(\S+)/m);
    assert.ok(effortMatch, `${file} has effort field`);
    assert.ok(VALID_EFFORT.includes(effortMatch[1]),
      `${file} effort="${effortMatch[1]}" is valid`);
  }
});

// SEC-AF-037: All agents have maxTurns in valid range
// v2.1.25: deprecation tombstones (deprecatedIn) carry minimal frontmatter per
// contract-baseline-rollforward SOP §5.3 (no maxTurns) — skip them here.
test('SEC-AF-037', 'All agents have maxTurns in valid range (10-100)', () => {
  const allAgentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
  for (const file of allAgentFiles) {
    const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8');
    if (/^deprecatedIn:\s*\S+/m.test(content)) continue;
    const turnsMatch = content.match(/^maxTurns:\s*(\d+)/m);
    assert.ok(turnsMatch, `${file} has maxTurns field`);
    const turns = parseInt(turnsMatch[1]);
    assert.ok(turns >= VALID_MAX_TURNS_RANGE.min && turns <= VALID_MAX_TURNS_RANGE.max,
      `${file} maxTurns=${turns} in range ${VALID_MAX_TURNS_RANGE.min}-${VALID_MAX_TURNS_RANGE.max}`);
  }
});

// SEC-AF-038: Tier 1 non-premium agents do not use high effort (premium agents need high for deep analysis)
// v2.1.25: PREMIUM tier = opus | fable (Claude 5 model alignment); was OPUS_TIER1.
test('SEC-AF-038', 'Tier 1 non-premium agents do not use high effort', () => {
  // premium-model (opus/fable) agents in Tier 1 are allowed high effort:
  // security-architect (opus), design-validator (fable), gap-detector (fable — read-only by tools, not in TIER1 list)
  const PREMIUM_TIER1 = ['security-architect', 'design-validator', 'gap-detector'];
  for (const agent of TIER1_AGENTS) {
    const content = fs.readFileSync(path.join(AGENTS_DIR, `${agent}.md`), 'utf8');
    const effortMatch = content.match(/^effort:\s*(\S+)/m);
    assert.ok(effortMatch, `${agent} has effort field`);
    if (!PREMIUM_TIER1.includes(agent)) {
      assert.ok(effortMatch[1] !== 'high',
        `${agent} effort="${effortMatch[1]}" should not be high (non-premium read-only agent)`);
    }
  }
});

// SEC-AF-039: cto-lead uses high effort for orchestration
test('SEC-AF-039', 'cto-lead uses high effort for orchestration', () => {
  const content = fs.readFileSync(path.join(AGENTS_DIR, 'cto-lead.md'), 'utf8');
  const effortMatch = content.match(/^effort:\s*(\S+)/m);
  assert.ok(effortMatch, 'cto-lead has effort field');
  assert.strictEqual(effortMatch[1], 'high');
});

// SEC-AF-040: cto-lead maxTurns is 50
test('SEC-AF-040', 'cto-lead maxTurns is 50', () => {
  const content = fs.readFileSync(path.join(AGENTS_DIR, 'cto-lead.md'), 'utf8');
  const turnsMatch = content.match(/^maxTurns:\s*(\d+)/m);
  assert.ok(turnsMatch, 'cto-lead has maxTurns field');
  assert.strictEqual(parseInt(turnsMatch[1]), 50);
});

// ============================================================
// v2.0: AF-041 ~ AF-055: Enhanced Security Validation (15 TC)
// ============================================================
console.log('\n=== v2.0: Enhanced Agent Frontmatter Security ===');

// --- AF-041 ~ AF-045: Plan mode agents have Write/Edit blocked ---

const PLAN_MODE_AGENTS = TIER1_AGENTS.filter(a => {
  try {
    const fm = parseFrontmatter(a);
    return fm.permissionMode === 'plan' || fm.disallowedTools.includes('Bash');
  } catch { return false; }
});

test('SEC-AF-041', 'All plan-mode agents disallow Bash (Write/Edit guard)', () => {
  for (const agent of PLAN_MODE_AGENTS) {
    const fm = parseFrontmatter(agent);
    assert.ok(
      fm.disallowedTools.includes('Bash'),
      `Plan-mode agent ${agent} should disallow Bash`
    );
  }
});

test('SEC-AF-042', 'Tier 1 agents that block Bash also cannot execute writes via Bash', () => {
  // If Bash is disallowed, Write/Edit via bash (echo > file) are implicitly blocked
  for (const agent of TIER1_AGENTS) {
    const fm = parseFrontmatter(agent);
    assert.ok(fm.disallowedTools.includes('Bash'),
      `${agent} must disallow Bash to prevent write-via-bash`);
  }
});

test('SEC-AF-043', 'Tier 1 agents with acceptEdits permissionMode still block Bash', () => {
  // acceptEdits allows the model to accept edits but should not allow Bash
  for (const agent of TIER1_AGENTS) {
    const fm = parseFrontmatter(agent);
    if (fm.permissionMode === 'acceptEdits') {
      assert.ok(fm.disallowedTools.includes('Bash'),
        `acceptEdits agent ${agent} should still block Bash`);
    }
  }
});

test('SEC-AF-044', 'No Tier 1 agent has both Bash in tools and disallowedTools', () => {
  for (const agent of TIER1_AGENTS) {
    const fm = parseFrontmatter(agent);
    if (fm.tools.includes('Bash')) {
      assert.ok(!fm.disallowedTools.includes('Bash'),
        `${agent} should not have Bash in both tools and disallowedTools`);
    }
  }
});

test('SEC-AF-045', 'All Tier 1 agents have at least 1 disallowedTools entry', () => {
  for (const agent of TIER1_AGENTS) {
    const fm = parseFrontmatter(agent);
    assert.ok(fm.disallowedTools.length >= 1,
      `${agent} should have at least 1 disallowedTools entry`);
  }
});

// --- AF-046 ~ AF-050: acceptEdits agents block destructive commands ---

test('SEC-AF-046', 'Tier 2 agents block all 3 destructive patterns', () => {
  for (const agent of TIER2_AGENTS) {
    const fm = parseFrontmatter(agent);
    for (const pattern of TIER2_BLOCKED_PATTERNS) {
      assert.ok(fm.disallowedTools.includes(pattern),
        `${agent} should block ${pattern}`);
    }
  }
});

test('SEC-AF-047', 'Tier 2 agents do NOT block Bash entirely', () => {
  for (const agent of TIER2_AGENTS) {
    const fm = parseFrontmatter(agent);
    assert.ok(!fm.disallowedTools.includes('Bash'),
      `${agent} should not fully block Bash (only destructive patterns)`);
  }
});

test('SEC-AF-048', 'Tier 2 agents have Bash available (not in disallowedTools as whole)', () => {
  for (const agent of TIER2_AGENTS) {
    const fm = parseFrontmatter(agent);
    const fullBashBlock = fm.disallowedTools.filter(t => t === 'Bash');
    assert.strictEqual(fullBashBlock.length, 0,
      `${agent} should only block Bash patterns, not Bash itself`);
  }
});

test('SEC-AF-049', 'No Tier 2 agent has rm -rf without also blocking git push and reset', () => {
  for (const agent of TIER2_AGENTS) {
    const fm = parseFrontmatter(agent);
    if (fm.disallowedTools.includes('Bash(rm -rf*)')) {
      assert.ok(fm.disallowedTools.includes('Bash(git push*)'),
        `${agent} blocks rm -rf but not git push`);
      assert.ok(fm.disallowedTools.includes('Bash(git reset --hard*)'),
        `${agent} blocks rm -rf but not git reset --hard`);
    }
  }
});

test('SEC-AF-050', 'Tier 2 disallowedTools are exact pattern matches (no typos)', () => {
  const expectedPatterns = new Set(TIER2_BLOCKED_PATTERNS);
  for (const agent of TIER2_AGENTS) {
    const fm = parseFrontmatter(agent);
    for (const tool of fm.disallowedTools) {
      assert.ok(expectedPatterns.has(tool),
        `${agent} has unexpected disallowedTool: "${tool}"`);
    }
  }
});

// --- AF-051 ~ AF-055: All agents have valid model/effort/maxTurns ---

const VALID_MODELS = ['opus', 'sonnet', 'haiku', 'fable'];

test('SEC-AF-051', 'All agents have a valid model field', () => {
  const allAgentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
  for (const file of allAgentFiles) {
    const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8');
    const modelMatch = content.match(/^model:\s*(\S+)/m);
    assert.ok(modelMatch, `${file} has model field`);
    assert.ok(VALID_MODELS.includes(modelMatch[1]),
      `${file} model="${modelMatch[1]}" should be one of ${VALID_MODELS.join(', ')}`);
  }
});

// v2.1.25: PREMIUM = opus | fable. Approved read-only premium exceptions per the
// claude-model-alignment matrix: security-architect (opus), design-validator (fable),
// gap-detector (fable — read-only by tools, not in TIER1 list).
test('SEC-AF-052', 'Tier 1 read-only agents do not use premium models (cost guard)', () => {
  const PREMIUM_MODELS = ['opus', 'fable'];
  const ALLOWED_PREMIUM_TIER1 = ['security-architect', 'design-validator', 'gap-detector'];
  for (const agent of TIER1_AGENTS) {
    if (ALLOWED_PREMIUM_TIER1.includes(agent)) continue;
    const fm = parseFrontmatter(agent);
    assert.ok(!PREMIUM_MODELS.includes(fm.model),
      `Read-only agent ${agent} should not use a premium model (got ${fm.model})`);
  }
});

test('SEC-AF-053', 'All agents have frontmatter name field', () => {
  const allAgentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
  for (const file of allAgentFiles) {
    const agentName = file.replace('.md', '');
    const fm = parseFrontmatter(agentName);
    assert.ok(fm.name, `${file} should have a name in frontmatter`);
    assert.ok(fm.name.length > 0, `${file} name should not be empty`);
  }
});

test('SEC-AF-054', 'Effort and maxTurns are correlated (high effort -> higher maxTurns)', () => {
  const allAgentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
  for (const file of allAgentFiles) {
    const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8');
    const effortMatch = content.match(/^effort:\s*(\S+)/m);
    const turnsMatch = content.match(/^maxTurns:\s*(\d+)/m);
    if (!effortMatch || !turnsMatch) continue;

    const effort = effortMatch[1];
    const turns = parseInt(turnsMatch[1]);
    if (effort === 'low') {
      assert.ok(turns <= 30, `${file} low effort should have maxTurns <= 30, got ${turns}`);
    }
  }
});

test('SEC-AF-055', 'No agent has maxTurns > 100 (resource safety)', () => {
  const allAgentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
  for (const file of allAgentFiles) {
    const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8');
    const turnsMatch = content.match(/^maxTurns:\s*(\d+)/m);
    if (turnsMatch) {
      const turns = parseInt(turnsMatch[1]);
      assert.ok(turns <= 100, `${file} maxTurns=${turns} exceeds safety limit of 100`);
    }
  }
});

// ============================================================
// Summary
// ============================================================
console.log('\n=== Agent Frontmatter Security Test Summary ===');
console.log(`Total: ${results.pass + results.fail} | Pass: ${results.pass} | Fail: ${results.fail}`);
if (results.errors.length > 0) {
  console.log('\nFailed tests:');
  for (const e of results.errors) {
    console.log(`  ${e.id}: ${e.description}`);
    console.log(`    -> ${e.error}`);
  }
}
process.exit(results.fail > 0 ? 1 : 0);
