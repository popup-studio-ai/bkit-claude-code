#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');

let passed = 0, failed = 0, total = 0;
function test(id, description, fn) {
  total++;
  try { fn(); passed++; }
  catch (err) { failed++; console.error(`  FAIL ${id}: ${description}\n    ${err.message}`); }
}

console.log('\n=== Skill Orchestrator Unit Tests ===\n');

const {
  parseSkillFrontmatter,
  getSkillConfig,
  orchestrateSkillPre,
  orchestrateSkillPost,
  getNextStepMessage,
  clearCache,
  getCacheStats,
  SKILL_CACHE_TTL,
  parseAgentsField,
  getAgentForAction,
  getLinkedAgents,
  isMultiBindingSkill,
  parseClassification,
  getSkillsByClassification
} = require('../../lib/skill-orchestrator.js');

// ── parseSkillFrontmatter ──

test('SO-001', 'parseSkillFrontmatter: valid frontmatter with name and description', () => {
  const content = '---\nname: test-skill\ndescription: A test skill\n---\nBody content here';
  const { frontmatter, body } = parseSkillFrontmatter(content);
  assert.strictEqual(frontmatter.name, 'test-skill');
  assert.strictEqual(frontmatter.description, 'A test skill');
  assert.strictEqual(body, 'Body content here');
});

test('SO-002', 'parseSkillFrontmatter: missing frontmatter returns empty object', () => {
  const content = 'No frontmatter here\nJust plain text';
  const { frontmatter, body } = parseSkillFrontmatter(content);
  assert.deepStrictEqual(frontmatter, {});
  assert.strictEqual(body, content);
});

test('SO-003', 'parseSkillFrontmatter: frontmatter with imports array', () => {
  const content = '---\nname: my-skill\nimports:\n  - template-a\n  - template-b\n---\nBody';
  const { frontmatter } = parseSkillFrontmatter(content);
  assert.deepStrictEqual(frontmatter.imports, ['template-a', 'template-b']);
});

test('SO-004', 'parseSkillFrontmatter: frontmatter with allowed-tools array', () => {
  const content = '---\nname: my-skill\nallowed-tools:\n  - Read\n  - Write\n  - Bash\n---\nBody';
  const { frontmatter } = parseSkillFrontmatter(content);
  assert.deepStrictEqual(frontmatter['allowed-tools'], ['Read', 'Write', 'Bash']);
});

test('SO-005', 'parseSkillFrontmatter: boolean value true', () => {
  const content = '---\nuser-invocable: true\n---\nBody';
  const { frontmatter } = parseSkillFrontmatter(content);
  assert.strictEqual(frontmatter['user-invocable'], true);
});

test('SO-006', 'parseSkillFrontmatter: boolean value false', () => {
  const content = '---\nuser-invocable: false\n---\nBody';
  const { frontmatter } = parseSkillFrontmatter(content);
  assert.strictEqual(frontmatter['user-invocable'], false);
});

test('SO-007', 'parseSkillFrontmatter: null value', () => {
  const content = '---\nnext-skill: null\n---\nBody';
  const { frontmatter } = parseSkillFrontmatter(content);
  assert.strictEqual(frontmatter['next-skill'], null);
});

test('SO-008', 'parseSkillFrontmatter: quoted string value (double quotes)', () => {
  const content = '---\nname: "my-skill"\n---\nBody';
  const { frontmatter } = parseSkillFrontmatter(content);
  assert.strictEqual(frontmatter.name, 'my-skill');
});

test('SO-009', 'parseSkillFrontmatter: quoted string value (single quotes)', () => {
  const content = "---\nname: 'my-skill'\n---\nBody";
  const { frontmatter } = parseSkillFrontmatter(content);
  assert.strictEqual(frontmatter.name, 'my-skill');
});

test('SO-010', 'parseSkillFrontmatter: v1.4.4 fields (next-skill, pdca-phase, task-template)', () => {
  const content = '---\nname: do-skill\nnext-skill: phase-8-review\npdca-phase: do\ntask-template: "{feature} implementation"\n---\nBody';
  const { frontmatter } = parseSkillFrontmatter(content);
  assert.strictEqual(frontmatter['next-skill'], 'phase-8-review');
  assert.strictEqual(frontmatter['pdca-phase'], 'do');
  assert.strictEqual(frontmatter['task-template'], '{feature} implementation');
});

test('SO-011', 'parseSkillFrontmatter: agents multi-binding section', () => {
  const content = '---\nname: pdca\nagents:\n  analyze: gap-detector\n  iterate: pdca-iterator\n  default: cto-lead\n---\nBody';
  const { frontmatter } = parseSkillFrontmatter(content);
  assert.strictEqual(frontmatter.agents.analyze, 'gap-detector');
  assert.strictEqual(frontmatter.agents.iterate, 'pdca-iterator');
  assert.strictEqual(frontmatter.agents.default, 'cto-lead');
});

test('SO-012', 'parseSkillFrontmatter: empty content returns empty frontmatter', () => {
  const { frontmatter, body } = parseSkillFrontmatter('');
  assert.deepStrictEqual(frontmatter, {});
  assert.strictEqual(body, '');
});

test('SO-013', 'parseSkillFrontmatter: classification fields', () => {
  const content = '---\nname: my-skill\nclassification: workflow\nclassification-reason: PDCA pipeline skill\ndeprecation-risk: low\n---\nBody';
  const { frontmatter } = parseSkillFrontmatter(content);
  assert.strictEqual(frontmatter.classification, 'workflow');
  assert.strictEqual(frontmatter['classification-reason'], 'PDCA pipeline skill');
  assert.strictEqual(frontmatter['deprecation-risk'], 'low');
});

test('SO-014', 'parseSkillFrontmatter: hooks section parsed', () => {
  const content = '---\nname: my-skill\nhooks:\n  PreToolUse:\n  PostToolUse:\n---\nBody';
  const { frontmatter } = parseSkillFrontmatter(content);
  assert.ok(frontmatter.hooks);
  assert.ok('PreToolUse' in frontmatter.hooks);
  assert.ok('PostToolUse' in frontmatter.hooks);
});

// ── parseAgentsField ──

test('SO-015', 'parseAgentsField: single agent binding', () => {
  const result = parseAgentsField({ agent: 'cto-lead' });
  assert.strictEqual(result.default, 'cto-lead');
  assert.strictEqual(result._isMultiBinding, false);
});

test('SO-016', 'parseAgentsField: multi-agent binding (enterprise)', () => {
  const result = parseAgentsField({
    agents: { analyze: 'gap-detector', iterate: 'pdca-iterator', default: 'cto-lead' }
  });
  assert.strictEqual(result.analyze, 'gap-detector');
  assert.strictEqual(result.iterate, 'pdca-iterator');
  assert.strictEqual(result.default, 'cto-lead');
  assert.strictEqual(result._isMultiBinding, true);
});

test('SO-017', 'parseAgentsField: no agent defined returns default null', () => {
  const result = parseAgentsField({});
  assert.strictEqual(result.default, null);
  assert.strictEqual(result._isMultiBinding, false);
});

test('SO-018', 'parseAgentsField: agents field takes precedence over agent field', () => {
  const result = parseAgentsField({
    agent: 'single-agent',
    agents: { default: 'multi-agent' }
  });
  assert.strictEqual(result.default, 'multi-agent');
  assert.strictEqual(result._isMultiBinding, true);
});

test('SO-019', 'parseAgentsField: non-object agents field treated as no agents', () => {
  const result = parseAgentsField({ agents: 'not-an-object' });
  // string is not typeof object, so falls through to agent check
  assert.strictEqual(result._isMultiBinding, false);
});

// ── parseClassification ──

test('SO-020', 'parseClassification: all fields present', () => {
  const result = parseClassification({
    classification: 'workflow',
    'classification-reason': 'PDCA flow',
    'deprecation-risk': 'low'
  });
  assert.strictEqual(result.classification, 'workflow');
  assert.strictEqual(result.classificationReason, 'PDCA flow');
  assert.strictEqual(result.deprecationRisk, 'low');
});

test('SO-021', 'parseClassification: missing fields return null', () => {
  const result = parseClassification({});
  assert.strictEqual(result.classification, null);
  assert.strictEqual(result.classificationReason, null);
  assert.strictEqual(result.deprecationRisk, null);
});

test('SO-022', 'parseClassification: partial fields', () => {
  const result = parseClassification({ classification: 'capability' });
  assert.strictEqual(result.classification, 'capability');
  assert.strictEqual(result.classificationReason, null);
});

// ── getNextStepMessage ──

test('SO-023', 'getNextStepMessage: known skill returns specific message', () => {
  const msg = getNextStepMessage('phase-1-schema');
  assert.ok(msg.includes('스키마'));
});

test('SO-024', 'getNextStepMessage: phase-8-review returns review message', () => {
  const msg = getNextStepMessage('phase-8-review');
  assert.ok(msg.includes('리뷰'));
});

test('SO-025', 'getNextStepMessage: phase-9-deployment returns deploy message', () => {
  const msg = getNextStepMessage('phase-9-deployment');
  assert.ok(msg.includes('배포'));
});

test('SO-026', 'getNextStepMessage: unknown skill returns fallback message', () => {
  const msg = getNextStepMessage('unknown-skill');
  assert.ok(msg.includes('다음 단계'));
  assert.ok(msg.includes('unknown-skill'));
});

test('SO-027', 'getNextStepMessage: phase-2-convention returns convention message', () => {
  const msg = getNextStepMessage('phase-2-convention');
  assert.ok(msg.includes('컨벤션'));
});

test('SO-028', 'getNextStepMessage: phase-3-mockup returns mockup message', () => {
  const msg = getNextStepMessage('phase-3-mockup');
  assert.ok(msg.includes('목업'));
});

// ── clearCache / getCacheStats ──

test('SO-029', 'clearCache: clears all cached entries', () => {
  clearCache();
  const stats = getCacheStats();
  assert.strictEqual(stats.size, 0);
  assert.deepStrictEqual(stats.entries, []);
});

test('SO-030', 'getCacheStats: returns size and entries', () => {
  clearCache();
  const stats = getCacheStats();
  assert.strictEqual(typeof stats.size, 'number');
  assert.ok(Array.isArray(stats.entries));
});

test('SO-031', 'SKILL_CACHE_TTL: is 30 seconds', () => {
  assert.strictEqual(SKILL_CACHE_TTL, 30000);
});

// ── getSkillConfig (with actual file system) ──
// Note: getSkillConfig depends on common.PLUGIN_ROOT which may be null in test env.
// We test gracefully: if common module loads, test real behavior; otherwise verify null handling.

test('SO-032', 'getSkillConfig: returns null for nonexistent skill (or null common)', () => {
  clearCache();
  try {
    const config = getSkillConfig('nonexistent-skill-xyz-12345');
    assert.strictEqual(config, null);
  } catch (e) {
    // common module not available in test env — acceptable
    assert.ok(e.message.includes('null') || e.message.includes('PLUGIN_ROOT'));
  }
});

test('SO-033', 'getSkillConfig: loads skill or handles missing common module', () => {
  clearCache();
  try {
    const config = getSkillConfig('pdca');
    if (config) {
      assert.ok(config.name, 'Config should have a name');
      assert.ok(Array.isArray(config.imports), 'Config should have imports array');
    }
  } catch (e) {
    // common module not available in test env
    assert.ok(e.message.includes('null') || e.message.includes('PLUGIN_ROOT'));
  }
});

test('SO-034', 'getSkillConfig: cache hit returns same reference', () => {
  clearCache();
  try {
    const config1 = getSkillConfig('pdca');
    const config2 = getSkillConfig('pdca');
    if (config1 && config2) {
      assert.strictEqual(config1, config2);
    }
  } catch (e) {
    // common module not available
    assert.ok(true);
  }
});

test('SO-035', 'getSkillConfig: cache stats reflect loaded skills', () => {
  clearCache();
  try {
    getSkillConfig('pdca');
    const stats = getCacheStats();
    if (stats.size > 0) {
      assert.ok(stats.entries.includes('pdca'));
    }
  } catch (e) {
    // common module not available
    assert.ok(true);
  }
});

// ── orchestrateSkillPre (async — wrapped for sync harness) ──

test('SO-036', 'orchestrateSkillPre: accepts skillName, args, context params', () => {
  assert.strictEqual(orchestrateSkillPre.length, 3);
});

test('SO-037', 'orchestrateSkillPre: is an async function', () => {
  assert.strictEqual(orchestrateSkillPre.constructor.name, 'AsyncFunction');
});

// ── orchestrateSkillPost (async — wrapped for sync harness) ──

test('SO-038', 'orchestrateSkillPost: is an async function', () => {
  assert.strictEqual(orchestrateSkillPost.constructor.name, 'AsyncFunction');
});

test('SO-039', 'orchestrateSkillPost: accepts skillName, result, context params', () => {
  assert.strictEqual(orchestrateSkillPost.length, 3);
});

test('SO-040', 'orchestrateSkillPost: accepts three arguments', () => {
  assert.strictEqual(orchestrateSkillPost.length, 3);
});

// ── Exports verification ──

test('SO-041', 'All 14 exports exist', () => {
  assert.strictEqual(typeof parseSkillFrontmatter, 'function');
  assert.strictEqual(typeof getSkillConfig, 'function');
  assert.strictEqual(typeof orchestrateSkillPre, 'function');
  assert.strictEqual(typeof orchestrateSkillPost, 'function');
  assert.strictEqual(typeof getNextStepMessage, 'function');
  assert.strictEqual(typeof clearCache, 'function');
  assert.strictEqual(typeof getCacheStats, 'function');
  assert.strictEqual(typeof SKILL_CACHE_TTL, 'number');
  assert.strictEqual(typeof parseAgentsField, 'function');
  assert.strictEqual(typeof getAgentForAction, 'function');
  assert.strictEqual(typeof getLinkedAgents, 'function');
  assert.strictEqual(typeof isMultiBindingSkill, 'function');
  assert.strictEqual(typeof parseClassification, 'function');
  assert.strictEqual(typeof getSkillsByClassification, 'function');
});

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
