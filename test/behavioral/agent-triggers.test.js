#!/usr/bin/env node
'use strict';

/**
 * agent-triggers.test.js - Behavioral tests for agent trigger matching
 * Tests lib/intent/trigger.js matchImplicitAgentTrigger and related functions
 *
 * @module test/behavioral/agent-triggers
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

console.log('\n=== Behavioral: Agent Trigger Matching ===\n');

const { matchImplicitAgentTrigger, matchImplicitSkillTrigger, detectNewFeatureIntent } = require('../../lib/intent/trigger');
const { matchMultiLangPattern, AGENT_TRIGGER_PATTERNS, SKILL_TRIGGER_PATTERNS } = require('../../lib/intent/language');

// ---------- Agent Triggers ----------

test('AT-01', 'gap-detector triggers on "verify" keyword (EN)', () => {
  const result = matchImplicitAgentTrigger('Can you verify this implementation?');
  assert.ok(result, 'Should match');
  assert.ok(result.agent.includes('gap-detector'), `Agent should include gap-detector, got: ${result.agent}`);
  assert.ok(result.confidence >= 0.7, `Confidence should be >= 0.7, got: ${result.confidence}`);
});

test('AT-02', 'gap-detector triggers on Korean "검증" keyword', () => {
  const result = matchImplicitAgentTrigger('이 코드를 검증해주세요');
  assert.ok(result, 'Should match Korean');
  assert.ok(result.agent.includes('gap-detector'), `Agent should include gap-detector, got: ${result.agent}`);
});

test('AT-03', 'pdca-iterator triggers on "improve" keyword (EN)', () => {
  const result = matchImplicitAgentTrigger('Please improve this code quality');
  assert.ok(result, 'Should match');
  assert.ok(result.agent.includes('pdca-iterator'), `Agent should include pdca-iterator, got: ${result.agent}`);
});

test('AT-04', 'pdca-iterator triggers on Japanese "改善" keyword', () => {
  const result = matchImplicitAgentTrigger('コードを改善してください');
  assert.ok(result, 'Should match Japanese');
  assert.ok(result.agent.includes('pdca-iterator'), `Agent should include pdca-iterator, got: ${result.agent}`);
});

test('AT-05', 'code-analyzer triggers on "analyze" keyword (EN)', () => {
  const result = matchImplicitAgentTrigger('I need to analyze the codebase for quality issues');
  assert.ok(result, 'Should match');
  assert.ok(result.agent.includes('code-analyzer'), `Agent should include code-analyzer, got: ${result.agent}`);
});

test('AT-06', 'report-generator triggers on "report" keyword (EN)', () => {
  const result = matchImplicitAgentTrigger('Generate a completion report for this feature');
  assert.ok(result, 'Should match');
  assert.ok(result.agent.includes('report-generator'), `Agent should include report-generator, got: ${result.agent}`);
});

test('AT-07', 'starter-guide triggers on "help" keyword (EN)', () => {
  const result = matchImplicitAgentTrigger('I need help getting started with this project');
  assert.ok(result, 'Should match');
  assert.ok(result.agent.includes('starter-guide'), `Agent should include starter-guide, got: ${result.agent}`);
});

test('AT-08', 'cto-lead triggers on "team" keyword (EN)', () => {
  const result = matchImplicitAgentTrigger('I want to set up a team for this project');
  assert.ok(result, 'Should match');
  assert.ok(result.agent.includes('cto-lead'), `Agent should include cto-lead, got: ${result.agent}`);
});

test('AT-09', 'pm-lead triggers on "PRD" keyword (EN)', () => {
  const result = matchImplicitAgentTrigger('We need to write a PRD for the new feature');
  assert.ok(result, 'Should match');
  assert.ok(result.agent.includes('pm-lead'), `Agent should include pm-lead, got: ${result.agent}`);
});

test('AT-10', 'No match for unrelated prompt', () => {
  const result = matchImplicitAgentTrigger('The weather is nice today');
  assert.strictEqual(result, null, 'Should return null for unrelated prompt');
});

test('AT-11', 'Null/empty input returns null', () => {
  assert.strictEqual(matchImplicitAgentTrigger(null), null, 'null input');
  assert.strictEqual(matchImplicitAgentTrigger(''), null, 'empty string');
});

// ---------- Skill Triggers ----------

test('AT-12', 'Skill trigger matches "login" to dynamic skill', () => {
  const result = matchImplicitSkillTrigger('I want to add a login page with authentication');
  assert.ok(result, 'Should match');
  assert.ok(result.skill.includes('dynamic'), `Skill should include dynamic, got: ${result.skill}`);
});

test('AT-13', 'Skill trigger matches "microservices" to enterprise skill', () => {
  const result = matchImplicitSkillTrigger('Set up microservices architecture with kubernetes');
  assert.ok(result, 'Should match');
  assert.ok(result.skill.includes('enterprise'), `Skill should include enterprise, got: ${result.skill}`);
});

// ---------- New Feature Detection ----------

test('AT-14', 'detectNewFeatureIntent detects "implement" keyword', () => {
  const result = detectNewFeatureIntent('I want to implement a new dashboard feature');
  assert.strictEqual(result.isNewFeature, true, 'Should detect new feature');
  assert.ok(result.confidence > 0, 'Confidence should be positive');
});

test('AT-15', 'detectNewFeatureIntent extracts feature name from quoted text', () => {
  const result = detectNewFeatureIntent('I want to build a new feature called "user-profile"');
  assert.strictEqual(result.isNewFeature, true, 'Should detect new feature');
  assert.strictEqual(result.featureName, 'user-profile', 'Should extract feature name');
  assert.ok(result.confidence >= 0.9, 'Confidence should be >= 0.9 with named feature');
});

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
