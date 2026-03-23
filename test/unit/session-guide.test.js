#!/usr/bin/env node
'use strict';
/**
 * Unit Tests for lib/pdca/session-guide.js
 * 35 TC | Context Anchor extraction, module analysis, session planning, scope filtering
 *
 * @version bkit v2.0.5 (PR #55)
 * @see https://github.com/popup-studio-ai/bkit-claude-code/pull/55
 */

const path = require('path');
const { assert, assertDeepEqual, assertType, summary, reset } = require('../helpers/assert');
reset();

console.log('\n=== session-guide.test.js (35 TC) ===\n');

const BASE_DIR = path.resolve(__dirname, '../..');
const sessionGuide = require(path.join(BASE_DIR, 'lib/pdca/session-guide.js'));

// ============================================================
// Section 1: Module Exports (5 TC)
// ============================================================
console.log('\n--- Section 1: Module Exports ---');

assert('SG-01', typeof sessionGuide === 'object', 'session-guide exports an object');
assert('SG-02', typeof sessionGuide.extractContextAnchor === 'function', 'extractContextAnchor is a function');
assert('SG-03', typeof sessionGuide.formatContextAnchor === 'function', 'formatContextAnchor is a function');
assert('SG-04', typeof sessionGuide.analyzeModules === 'function', 'analyzeModules is a function');
assert('SG-05', typeof sessionGuide.parseDoArgs === 'function', 'parseDoArgs is a function');

// ============================================================
// Section 2: extractContextAnchor (8 TC)
// ============================================================
console.log('\n--- Section 2: extractContextAnchor ---');

const MOCK_PLAN = `
# Feature Planning Document

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | Users lose context during multi-session PDCA handoffs |
| **Solution** | Context Anchor propagation across documents |

## Target Users

| User Group | Need |
|------------|------|
| AI developers | Efficient multi-session workflow |

## 2. Scope

### 2.1 In Scope

- [x] Context Anchor extraction from Plan
- [ ] Session Guide in Design document

## 4. Success Criteria

### 4.1 Definition of Done

- [x] Context preservation above 60%
- [ ] All templates updated

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Context loss across sessions | High | High | Auto-propagation |
`;

const anchor = sessionGuide.extractContextAnchor(MOCK_PLAN);

assert('SG-06', typeof anchor === 'object', 'extractContextAnchor returns an object');
assert('SG-07', anchor.why.includes('context'), 'WHY extracted from Problem row (case insensitive)');
assert('SG-08', anchor.who.includes('AI developer'), 'WHO extracted from Target Users table');
assert('SG-09', anchor.risk.includes('Context loss'), 'RISK extracted from Risks table');
assert('SG-10', anchor.success.includes('Context preservation'), 'SUCCESS extracted from Success Criteria');
assert('SG-11', anchor.scope.includes('Context Anchor extraction'), 'SCOPE extracted from In Scope');

// Empty/missing fields
const emptyAnchor = sessionGuide.extractContextAnchor('# No matching content');
assert('SG-12', emptyAnchor.why === '', 'Empty WHY for non-matching content');
assert('SG-13', emptyAnchor.who === '' && emptyAnchor.risk === '' && emptyAnchor.success === '' && emptyAnchor.scope === '',
  'All fields empty for non-matching content');

// ============================================================
// Section 3: formatContextAnchor (3 TC)
// ============================================================
console.log('\n--- Section 3: formatContextAnchor ---');

const formatted = sessionGuide.formatContextAnchor(anchor);

assert('SG-14', formatted.includes('## Context Anchor'), 'Formatted output has Context Anchor heading');
assert('SG-15', formatted.includes('| **WHY** |') && formatted.includes('| **SCOPE** |'),
  'Formatted output has all 5 keys (WHY through SCOPE)');

const emptyFormatted = sessionGuide.formatContextAnchor({ why: '', who: '', risk: '', success: '', scope: '' });
assert('SG-16', emptyFormatted.includes('N/A'), 'Empty fields show N/A in formatted output');

// ============================================================
// Section 4: analyzeModules (7 TC)
// ============================================================
console.log('\n--- Section 4: analyzeModules ---');

// Test with Module Map table
const DESIGN_WITH_MAP = `
## 11. Implementation Guide

#### Module Map

| Module | Scope Key | Description | Estimated Turns |
|--------|-----------|-------------|:---------------:|
| Auth Module | \`module-1\` | Authentication logic | 25 |
| API Layer | \`module-2\` | REST endpoint setup | 20 |
| UI Components | \`module-3\` | Frontend components | 30 |
| Tests | \`module-4\` | Test suite | 15 |
`;

const modules = sessionGuide.analyzeModules(DESIGN_WITH_MAP);

assert('SG-17', Array.isArray(modules), 'analyzeModules returns an array');
assert('SG-18', modules.length === 4, `analyzeModules finds 4 modules (got ${modules.length})`);
assert('SG-19', modules[0].scopeKey === 'module-1', 'First module has scopeKey module-1');
assert('SG-20', modules[0].name === 'Auth Module', 'First module name is Auth Module');
assert('SG-21', modules[0].estimatedTurns === 25, 'First module estimated turns is 25');

// Test with Phase headings fallback
const DESIGN_WITH_PHASES = `
## Implementation Guide

### 11.2 Implementation Order

### 1.1 Phase 1: Data Layer Setup
Content here

### 1.2 Phase 2: Business Logic
Content here

### 1.3 Phase 3: UI Integration
Content here
`;

const phaseModules = sessionGuide.analyzeModules(DESIGN_WITH_PHASES);
assert('SG-22', phaseModules.length === 3, `Phase fallback finds 3 modules (got ${phaseModules.length})`);

// Empty design
const emptyModules = sessionGuide.analyzeModules('# Empty design');
assert('SG-23', emptyModules.length === 0, 'Empty design returns empty array');

// ============================================================
// Section 5: suggestSessions (4 TC)
// ============================================================
console.log('\n--- Section 5: suggestSessions ---');

const sessions = sessionGuide.suggestSessions(modules, 50);

assert('SG-24', Array.isArray(sessions), 'suggestSessions returns an array');
assert('SG-25', sessions[0].phase === 'Plan + Design', 'First session is Plan + Design');
assert('SG-26', sessions[sessions.length - 1].phase === 'Check + Report', 'Last session is Check + Report');

// With small maxTurns to force splitting
const splitSessions = sessionGuide.suggestSessions(modules, 30);
assert('SG-27', splitSessions.length > sessions.length,
  `Smaller maxTurns creates more sessions (${splitSessions.length} > ${sessions.length})`);

// ============================================================
// Section 6: formatSessionPlan + formatModuleMap (2 TC)
// ============================================================
console.log('\n--- Section 6: Format Functions ---');

const sessionPlan = sessionGuide.formatSessionPlan(sessions);
assert('SG-28', sessionPlan.includes('#### Recommended Session Plan') && sessionPlan.includes('| Session'),
  'formatSessionPlan produces markdown table');

const moduleMap = sessionGuide.formatModuleMap(modules);
assert('SG-29', moduleMap.includes('#### Module Map') && moduleMap.includes('`module-1`'),
  'formatModuleMap produces markdown table with scope keys');

// ============================================================
// Section 7: filterByScope (4 TC)
// ============================================================
console.log('\n--- Section 7: filterByScope ---');

const { filtered, notFound } = sessionGuide.filterByScope(modules, 'module-1,module-3');
assert('SG-30', filtered.length === 2, `filterByScope returns 2 matching modules (got ${filtered.length})`);
assert('SG-31', notFound.length === 0, 'No notFound for valid scope keys');

const { filtered: f2, notFound: nf2 } = sessionGuide.filterByScope(modules, 'module-1,module-99');
assert('SG-32', f2.length === 1, 'filterByScope returns 1 matching + detects 1 invalid');
assert('SG-33', nf2.includes('module-99'), 'notFound includes module-99');

// ============================================================
// Section 8: parseDoArgs (2 TC)
// ============================================================
console.log('\n--- Section 8: parseDoArgs ---');

const args1 = sessionGuide.parseDoArgs('my-feature --scope module-1,module-2');
assert('SG-34', args1.feature === 'my-feature' && args1.scope === 'module-1,module-2',
  'parseDoArgs extracts feature and scope');

const args2 = sessionGuide.parseDoArgs('my-feature');
assert('SG-35', args2.feature === 'my-feature' && args2.scope === null,
  'parseDoArgs returns null scope when no --scope flag');

// ============================================================
// Summary
// ============================================================
summary('Session Guide Unit Tests (PR #55)');
