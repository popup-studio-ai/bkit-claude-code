#!/usr/bin/env node
'use strict';
/**
 * Integration Tests for PR #55: Context Anchor propagation + upstream cross-reading
 * 25 TC | Template versions, Context Anchor in templates, SKILL.md phase enhancements
 *
 * @version bkit v2.0.5 (PR #55)
 * @see https://github.com/popup-studio-ai/bkit-claude-code/pull/55
 */

const fs = require('fs');
const path = require('path');
const { assert, summary, reset } = require('../helpers/assert');
reset();

console.log('\n=== context-anchor-propagation.test.js (25 TC) ===\n');

const BASE_DIR = path.resolve(__dirname, '../..');
const TEMPLATES_DIR = path.join(BASE_DIR, 'templates');
const SKILLS_DIR = path.join(BASE_DIR, 'skills');

// ============================================================
// Section 1: Template Version Upgrades (4 TC)
// ============================================================
console.log('\n--- Section 1: Template Version Upgrades ---');

const planTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'plan.template.md'), 'utf-8');
const designTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'design.template.md'), 'utf-8');
const doTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'do.template.md'), 'utf-8');
const analysisTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'analysis.template.md'), 'utf-8');

assert('CAP-01', planTemplate.includes('version: 1.3'), 'plan.template.md version is 1.3');
assert('CAP-02', designTemplate.includes('version: 1.3'), 'design.template.md version is 1.3');
assert('CAP-03', doTemplate.includes('version: 1.1'), 'do.template.md version is 1.1');
assert('CAP-04', analysisTemplate.includes('version: 1.3'), 'analysis.template.md version is 1.3');

// ============================================================
// Section 2: Context Anchor in Templates (8 TC)
// ============================================================
console.log('\n--- Section 2: Context Anchor in Templates ---');

// Plan template: Context Anchor section exists
assert('CAP-05', planTemplate.includes('## Context Anchor'),
  'plan template has ## Context Anchor section');
assert('CAP-06', planTemplate.includes('| **WHY** |') && planTemplate.includes('| **SCOPE** |'),
  'plan template has WHY through SCOPE keys');

// Design template: Context Anchor copied from Plan
assert('CAP-07', designTemplate.includes('## Context Anchor'),
  'design template has ## Context Anchor section');
assert('CAP-08', designTemplate.includes('Copied from Plan document'),
  'design template indicates Context Anchor is copied from Plan');

// Do template: Context Anchor carried from Plan → Design → Do
assert('CAP-09', doTemplate.includes('## Context Anchor'),
  'do template has ## Context Anchor section');
assert('CAP-10', doTemplate.includes('Carried from Plan'),
  'do template indicates Context Anchor carried from Plan');

// Analysis template: Context Anchor for verification
assert('CAP-11', analysisTemplate.includes('## Context Anchor'),
  'analysis template has ## Context Anchor section');
assert('CAP-12', analysisTemplate.includes('Verify implementation against strategic intent'),
  'analysis template uses Context Anchor for strategic verification');

// ============================================================
// Section 3: Session Guide in Design Template (4 TC)
// ============================================================
console.log('\n--- Section 3: Session Guide in Design Template ---');

assert('CAP-13', designTemplate.includes('### 11.3 Session Guide'),
  'design template has ### 11.3 Session Guide section');
assert('CAP-14', designTemplate.includes('#### Module Map'),
  'design template has Module Map sub-section');
assert('CAP-15', designTemplate.includes('#### Recommended Session Plan'),
  'design template has Recommended Session Plan sub-section');
assert('CAP-16', designTemplate.includes('--scope module-N'),
  'design template references --scope module-N usage');

// ============================================================
// Section 4: Session Scope in Do Template (3 TC)
// ============================================================
console.log('\n--- Section 4: Session Scope in Do Template ---');

assert('CAP-17', doTemplate.includes('## Session Scope'),
  'do template has ## Session Scope section');
assert('CAP-18', doTemplate.includes('Current Session Modules'),
  'do template has Current Session Modules table');
assert('CAP-19', doTemplate.includes('/pdca do {feature} --scope module-N'),
  'do template has --scope usage tip');

// ============================================================
// Section 5: SKILL.md Phase Enhancements (6 TC)
// ============================================================
console.log('\n--- Section 5: SKILL.md Phase Enhancements ---');

const pdcaSkill = fs.readFileSync(path.join(SKILLS_DIR, 'pdca', 'SKILL.md'), 'utf-8');

// Plan phase: Context Anchor Generation
assert('CAP-20', pdcaSkill.includes('Context Anchor Generation'),
  'SKILL.md plan phase has Context Anchor Generation step');

// Design phase: Context Anchor Embed + Session Guide Generation
assert('CAP-21', pdcaSkill.includes('Context Anchor Embed'),
  'SKILL.md design phase has Context Anchor Embed step');
assert('CAP-22', pdcaSkill.includes('Session Guide Generation'),
  'SKILL.md design phase has Session Guide Generation step');

// Do phase: --scope parameter + Context Anchor display
assert('CAP-23', pdcaSkill.includes('Parse --scope parameter'),
  'SKILL.md do phase has --scope parameter parsing');
assert('CAP-24', pdcaSkill.includes('Display Context Anchor'),
  'SKILL.md do phase has Display Context Anchor step');

// Analyze phase: Plan Success Criteria Reference
assert('CAP-25', pdcaSkill.includes('Plan Success Criteria Reference'),
  'SKILL.md analyze phase has Plan Success Criteria Reference');

// ============================================================
// Summary
// ============================================================
summary('Context Anchor Propagation Integration Tests (PR #55)');
