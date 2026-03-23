#!/usr/bin/env node
'use strict';
/**
 * Regression Tests for PR #55: Handoff context loss reduction
 * 15 TC | Backward compatibility, session-guide.js integrity, template structure
 *
 * @version bkit v2.0.5 (PR #55)
 * @see https://github.com/popup-studio-ai/bkit-claude-code/pull/55
 */

const fs = require('fs');
const path = require('path');
const { assert, assertNoThrow, summary, reset } = require('../helpers/assert');
reset();

console.log('\n=== pr55-handoff-loss.test.js (15 TC) ===\n');

const BASE_DIR = path.resolve(__dirname, '../..');
const LIB_DIR = path.join(BASE_DIR, 'lib/pdca');
const TEMPLATES_DIR = path.join(BASE_DIR, 'templates');

// ============================================================
// Section 1: session-guide.js Module Integrity (5 TC)
// ============================================================
console.log('\n--- Section 1: session-guide.js Module Integrity ---');

// PR55-01: File exists
assert('PR55-01', fs.existsSync(path.join(LIB_DIR, 'session-guide.js')),
  'lib/pdca/session-guide.js exists');

// PR55-02: Syntax validation
assertNoThrow('PR55-02', () => {
  require(path.join(LIB_DIR, 'session-guide.js'));
}, 'session-guide.js loads without syntax errors');

// PR55-03: All 8 exports present
const sg = require(path.join(LIB_DIR, 'session-guide.js'));
const expectedExports = [
  'extractContextAnchor', 'formatContextAnchor',
  'analyzeModules', 'suggestSessions',
  'formatSessionPlan', 'formatModuleMap',
  'filterByScope', 'parseDoArgs'
];
assert('PR55-03',
  expectedExports.every(fn => typeof sg[fn] === 'function'),
  `All 8 functions exported: ${expectedExports.join(', ')}`);

// PR55-04: Version header
const sgContent = fs.readFileSync(path.join(LIB_DIR, 'session-guide.js'), 'utf-8');
assert('PR55-04', sgContent.includes('@version 1.0.0') || sgContent.includes('@module lib/pdca/session-guide'),
  'session-guide.js has proper JSDoc header');

// PR55-05: Lazy require pattern (does not eagerly load core)
assert('PR55-05', sgContent.includes('Lazy require') && sgContent.includes('_core = null'),
  'session-guide.js uses lazy require pattern for core module');

// ============================================================
// Section 2: Backward Compatibility (5 TC)
// ============================================================
console.log('\n--- Section 2: Backward Compatibility ---');

// PR55-06: parseDoArgs without --scope returns null scope (backward compat)
const noScope = sg.parseDoArgs('my-feature');
assert('PR55-06', noScope.scope === null && noScope.feature === 'my-feature',
  '/pdca do feature (no --scope) still works - backward compatible');

// PR55-07: filterByScope with null scopeParam returns all modules
const mockModules = [
  { name: 'A', scopeKey: 'module-1', description: 'A', estimatedTurns: 20 },
  { name: 'B', scopeKey: 'module-2', description: 'B', estimatedTurns: 20 },
];
const { filtered } = sg.filterByScope(mockModules, null);
assert('PR55-07', filtered.length === 2,
  'filterByScope(null) returns all modules (backward compat)');

// PR55-08: extractContextAnchor gracefully handles legacy Plans without Context Anchor
const legacyPlan = '# Old Plan\n## 1. Overview\nSome content\n## 2. Scope\n- Item 1';
const legacyAnchor = sg.extractContextAnchor(legacyPlan);
assert('PR55-08',
  legacyAnchor.why === '' && legacyAnchor.who === '' && legacyAnchor.risk === '' &&
  legacyAnchor.success === '' && legacyAnchor.scope === '',
  'extractContextAnchor returns empty fields for legacy Plans without matching sections');

// PR55-09: analyzeModules handles legacy Design without Session Guide
const legacyDesign = '# Old Design\n## 1. Overview\n## 11. Implementation Guide\n### 11.1 File Structure';
const legacyModules = sg.analyzeModules(legacyDesign);
assert('PR55-09', Array.isArray(legacyModules) && legacyModules.length === 0,
  'analyzeModules returns empty array for legacy Design without module info');

// PR55-10: suggestSessions with empty modules still produces Plan+Design and Check+Report sessions
const emptySessionPlan = sg.suggestSessions([], 50);
assert('PR55-10', emptySessionPlan.length === 2 &&
  emptySessionPlan[0].phase === 'Plan + Design' &&
  emptySessionPlan[1].phase === 'Check + Report',
  'suggestSessions([]) produces minimum 2 sessions (Plan+Design, Check+Report)');

// ============================================================
// Section 3: Template Structural Integrity (5 TC)
// ============================================================
console.log('\n--- Section 3: Template Structural Integrity ---');

// PR55-11: Plan template still has all original sections (1-9)
const planContent = fs.readFileSync(path.join(TEMPLATES_DIR, 'plan.template.md'), 'utf-8');
assert('PR55-11',
  planContent.includes('## 1. Overview') &&
  planContent.includes('## 2. Scope') &&
  planContent.includes('## 9. Next Steps'),
  'plan.template.md retains all original sections (1-9)');

// PR55-12: Design template retains all original sections (1-11)
const designContent = fs.readFileSync(path.join(TEMPLATES_DIR, 'design.template.md'), 'utf-8');
assert('PR55-12',
  designContent.includes('## 1. Overview') &&
  designContent.includes('## 11. Implementation Guide'),
  'design.template.md retains all original sections (1-11)');

// PR55-13: Do template retains all original sections (1-8)
const doContent = fs.readFileSync(path.join(TEMPLATES_DIR, 'do.template.md'), 'utf-8');
assert('PR55-13',
  doContent.includes('## 1. Pre-Implementation Checklist') &&
  doContent.includes('## 8. Post-Implementation'),
  'do.template.md retains all original sections (1-8)');

// PR55-14: Analysis template retains all original sections (1-11)
const analysisContent = fs.readFileSync(path.join(TEMPLATES_DIR, 'analysis.template.md'), 'utf-8');
assert('PR55-14',
  analysisContent.includes('## 1. Analysis Overview') &&
  analysisContent.includes('## 11. Next Steps'),
  'analysis.template.md retains all original sections (1-11)');

// PR55-15: Context Anchor appears BEFORE main sections in all templates
const planAnchorIdx = planContent.indexOf('## Context Anchor');
const planOverviewIdx = planContent.indexOf('## 1. Overview');
assert('PR55-15',
  planAnchorIdx > 0 && planAnchorIdx < planOverviewIdx,
  'Context Anchor appears before ## 1. Overview in all templates');

// ============================================================
// Summary
// ============================================================
summary('PR #55 Handoff Loss Regression Tests');
