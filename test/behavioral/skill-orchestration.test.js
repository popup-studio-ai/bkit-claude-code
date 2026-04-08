#!/usr/bin/env node
'use strict';

/**
 * skill-orchestration.test.js - Behavioral tests for skill orchestration logic
 * Tests lib/skill-orchestrator.js: frontmatter parsing, agent binding, caching
 *
 * @module test/behavioral/skill-orchestration
 */

const assert = require('assert');

let passed = 0, failed = 0, total = 0;

function test(id, desc, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  PASS ${id}: ${desc}`);
  } catch (e) {
    failed++;
    console.error(`  FAIL ${id}: ${desc}\n    ${e.message}`);
  }
}

console.log('\n=== Behavioral: Skill Orchestration ===\n');

const orch = require('../../lib/skill-orchestrator');

// ---------- Frontmatter Parsing ----------

test('SO-01', 'parseSkillFrontmatter extracts name from YAML frontmatter', () => {
  const content = `---
name: test-skill
description: A test skill
---
# Test Skill Body`;

  const { frontmatter, body } = orch.parseSkillFrontmatter(content);
  assert.strictEqual(frontmatter.name, 'test-skill');
  assert.strictEqual(frontmatter.description, 'A test skill');
  assert.ok(body.includes('# Test Skill Body'), 'Body should contain markdown content');
});

test('SO-02', 'parseSkillFrontmatter extracts imports array', () => {
  const content = `---
name: import-test
imports:
  - templates/base.md
  - templates/pdca.md
---
Body`;

  const { frontmatter } = orch.parseSkillFrontmatter(content);
  assert.ok(Array.isArray(frontmatter.imports), 'imports should be array');
  assert.strictEqual(frontmatter.imports.length, 2);
  assert.ok(frontmatter.imports.includes('templates/base.md'));
  assert.ok(frontmatter.imports.includes('templates/pdca.md'));
});

test('SO-03', 'parseSkillFrontmatter extracts allowed-tools array', () => {
  const content = `---
name: tools-test
allowed-tools:
  - Read
  - Bash
  - Grep
---
Body`;

  const { frontmatter } = orch.parseSkillFrontmatter(content);
  assert.ok(Array.isArray(frontmatter['allowed-tools']), 'allowed-tools should be array');
  assert.strictEqual(frontmatter['allowed-tools'].length, 3);
  assert.ok(frontmatter['allowed-tools'].includes('Bash'));
});

test('SO-04', 'parseSkillFrontmatter handles boolean values', () => {
  const content = `---
name: bool-test
user-invocable: true
---
Body`;

  const { frontmatter } = orch.parseSkillFrontmatter(content);
  assert.strictEqual(frontmatter['user-invocable'], true, 'Should parse "true" as boolean true');
});

test('SO-05', 'parseSkillFrontmatter handles content without frontmatter', () => {
  const content = `# Just a markdown file\nNo frontmatter here.`;
  const { frontmatter, body } = orch.parseSkillFrontmatter(content);
  assert.deepStrictEqual(frontmatter, {}, 'Should return empty frontmatter');
  assert.strictEqual(body, content, 'Body should be the full content');
});

test('SO-06', 'parseSkillFrontmatter extracts v1.4.4 fields (next-skill, pdca-phase)', () => {
  const content = `---
name: phase-test
next-skill: phase-2-convention
pdca-phase: plan
task-template: "Plan {feature}"
---
Body`;

  const { frontmatter } = orch.parseSkillFrontmatter(content);
  assert.strictEqual(frontmatter['next-skill'], 'phase-2-convention');
  assert.strictEqual(frontmatter['pdca-phase'], 'plan');
  assert.strictEqual(frontmatter['task-template'], 'Plan {feature}');
});

// ---------- Agents Multi-Binding ----------

test('SO-07', 'parseAgentsField handles single agent binding', () => {
  const result = orch.parseAgentsField({ agent: 'gap-detector' });
  assert.strictEqual(result.default, 'gap-detector');
  assert.strictEqual(result._isMultiBinding, false);
});

test('SO-08', 'parseAgentsField handles multi-binding agents object', () => {
  const result = orch.parseAgentsField({
    agents: {
      analyze: 'code-analyzer',
      iterate: 'pdca-iterator',
      default: 'gap-detector'
    }
  });
  assert.strictEqual(result._isMultiBinding, true);
  assert.strictEqual(result.analyze, 'code-analyzer');
  assert.strictEqual(result.iterate, 'pdca-iterator');
  assert.strictEqual(result.default, 'gap-detector');
});

test('SO-09', 'parseAgentsField handles no agent defined', () => {
  const result = orch.parseAgentsField({});
  assert.strictEqual(result.default, null);
  assert.strictEqual(result._isMultiBinding, false);
});

// ---------- Classification ----------

test('SO-10', 'parseClassification extracts classification fields', () => {
  const frontmatter = {
    classification: 'workflow',
    'classification-reason': 'Phase 1-9 pipeline step',
    'deprecation-risk': 'low'
  };
  const cls = orch.parseClassification(frontmatter);
  assert.strictEqual(cls.classification, 'workflow');
  assert.strictEqual(cls.classificationReason, 'Phase 1-9 pipeline step');
  assert.strictEqual(cls.deprecationRisk, 'low');
});

test('SO-11', 'parseClassification returns nulls for missing fields', () => {
  const cls = orch.parseClassification({});
  assert.strictEqual(cls.classification, null);
  assert.strictEqual(cls.classificationReason, null);
  assert.strictEqual(cls.deprecationRisk, null);
});

// ---------- Next Step Messages ----------

test('SO-12', 'getNextStepMessage returns known phase messages', () => {
  const msg1 = orch.getNextStepMessage('phase-1-schema');
  assert.ok(msg1.length > 0, 'Should return a message for phase-1-schema');

  const msg9 = orch.getNextStepMessage('phase-9-deployment');
  assert.ok(msg9.length > 0, 'Should return a message for phase-9-deployment');
});

test('SO-13', 'getNextStepMessage returns default for unknown skill', () => {
  const msg = orch.getNextStepMessage('unknown-skill-xyz');
  assert.ok(msg.includes('unknown-skill-xyz'), 'Should include the skill name in default message');
});

// ---------- Cache ----------

test('SO-14', 'clearCache resets skill config cache', () => {
  const statsBefore = orch.getCacheStats();
  orch.clearCache();
  const statsAfter = orch.getCacheStats();
  assert.strictEqual(statsAfter.size, 0, 'Cache should be empty after clear');
});

test('SO-15', 'SKILL_CACHE_TTL is 30 seconds', () => {
  assert.strictEqual(orch.SKILL_CACHE_TTL, 30000, 'Cache TTL should be 30000ms');
});

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
