#!/usr/bin/env node
'use strict';
/**
 * Integration Tests for PR #51: Impact Analysis Section in Plan Template
 * 25 TC | Plan template Section 6 (Impact Analysis), section renumbering, content validation
 *
 * @version bkit v2.0.2 (PR #51)
 * @see https://github.com/popup-studio-ai/bkit-claude-code/pull/51
 */

const fs = require('fs');
const path = require('path');
const { assert, summary, reset } = require('../helpers/assert');
reset();

console.log('\n=== impact-analysis-section.test.js (25 TC) ===\n');

const BASE_DIR = path.resolve(__dirname, '../..');
const TEMPLATES_DIR = path.join(BASE_DIR, 'templates');
const planTemplatePath = path.join(TEMPLATES_DIR, 'plan.template.md');

const planContent = fs.readFileSync(planTemplatePath, 'utf-8');

// ============================================================
// Section 1: Impact Analysis Section Exists (5 TC)
// ============================================================
console.log('\n--- Section 1: Impact Analysis Section Exists ---');

assert('IAS-01',
  planContent.includes('## 6. Impact Analysis'),
  'Plan template has Section 6: Impact Analysis'
);
assert('IAS-02',
  planContent.includes('### 6.1 Changed Resources'),
  'Section 6.1 Changed Resources exists'
);
assert('IAS-03',
  planContent.includes('### 6.2 Current Consumers'),
  'Section 6.2 Current Consumers exists'
);
assert('IAS-04',
  planContent.includes('### 6.3 Verification'),
  'Section 6.3 Verification exists'
);
assert('IAS-05',
  planContent.includes('Purpose') && planContent.includes('full inventory'),
  'Impact Analysis has purpose statement about full inventory'
);

// ============================================================
// Section 2: Changed Resources Table Structure (5 TC)
// ============================================================
console.log('\n--- Section 2: Changed Resources Table ---');

assert('IAS-06',
  planContent.includes('| Resource | Type | Change Description |'),
  '6.1 has Resource/Type/Change Description table header'
);
assert('IAS-07',
  planContent.includes('DB Model') || planContent.includes('DB Model / API / Schema / Config'),
  '6.1 includes DB Model as resource type example'
);
assert('IAS-08',
  planContent.includes('API') && planContent.includes('Schema') && planContent.includes('Config'),
  '6.1 includes API, Schema, Config as resource type examples'
);
assert('IAS-09',
  planContent.includes('added, modified, or removed'),
  '6.1 change description covers add/modify/remove'
);
assert('IAS-10',
  (planContent.match(/\| \{e\.g\.,/g) || []).length >= 1,
  '6.1 includes example placeholder entries'
);

// ============================================================
// Section 3: Current Consumers Table Structure (5 TC)
// ============================================================
console.log('\n--- Section 3: Current Consumers Table ---');

assert('IAS-11',
  planContent.includes('| Resource | Operation | Code Path | Impact |'),
  '6.2 has Resource/Operation/Code Path/Impact table header'
);
assert('IAS-12',
  planContent.includes('CREATE') && planContent.includes('READ') &&
  planContent.includes('UPDATE') && planContent.includes('DELETE'),
  '6.2 covers all CRUD operations'
);
assert('IAS-13',
  planContent.includes('None / Needs verification / Breaking'),
  '6.2 has impact levels: None, Needs verification, Breaking'
);
assert('IAS-14',
  planContent.includes('all') && planContent.includes('existing code paths'),
  '6.2 requires listing ALL existing code paths'
);
assert('IAS-15',
  planContent.includes('For each changed resource'),
  '6.2 links back to 6.1 changed resources'
);

// ============================================================
// Section 4: Verification Checklist (5 TC)
// ============================================================
console.log('\n--- Section 4: Verification Checklist ---');

assert('IAS-16',
  planContent.includes('- [ ] All consumers listed above verified'),
  '6.3 has consumer verification checkbox'
);
assert('IAS-17',
  planContent.includes('auth/permission changes'),
  '6.3 checks auth/permission change impact'
);
assert('IAS-18',
  planContent.includes('field additions/removals'),
  '6.3 checks field addition/removal impact'
);
assert('IAS-19',
  (planContent.match(/- \[ \]/g) || []).length >= 3,
  '6.3 has at least 3 verification checkboxes'
);
assert('IAS-20',
  planContent.includes('queries or mutations'),
  '6.3 checks impact on existing queries/mutations'
);

// ============================================================
// Section 5: Section Renumbering (5 TC)
// ============================================================
console.log('\n--- Section 5: Section Renumbering ---');

assert('IAS-21',
  planContent.includes('## 7. Architecture Considerations'),
  'Architecture Considerations renumbered to Section 7'
);
assert('IAS-22',
  planContent.includes('## 8. Convention Prerequisites'),
  'Convention Prerequisites renumbered to Section 8'
);
assert('IAS-23',
  planContent.includes('## 9. Next Steps'),
  'Next Steps renumbered to Section 9'
);
assert('IAS-24',
  !planContent.includes('## 6. Architecture') && !planContent.includes('## 6. Convention'),
  'Old Section 6/7 numbering no longer exists'
);
assert('IAS-25',
  planContent.includes('## 5. Risks') && planContent.includes('## 6. Impact'),
  'Section 5 (Risks) immediately precedes Section 6 (Impact Analysis)'
);

// ============================================================
// Summary
// ============================================================
summary('Impact Analysis Section Tests (PR #51)');
