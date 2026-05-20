'use strict';
/**
 * Unit Tests for lib/audit/audit-logger.js
 * 20 TC | console.assert based | no external dependencies
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Set up tmp dir and mock platform before requiring module
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-audit-test-'));
const origCwd = process.cwd();

// Mock the platform module to use tmpDir as PROJECT_DIR
const platformPath = require.resolve('../../lib/core/platform');
const origPlatform = require(platformPath);
const mockPlatform = { ...origPlatform, PROJECT_DIR: tmpDir };
require.cache[platformPath] = { id: platformPath, filename: platformPath, loaded: true, exports: mockPlatform };

let mod;
try {
  mod = require('../../lib/audit/audit-logger');
} catch (e) {
  console.error('Module load failed:', e.message);
  process.chdir(origCwd);
  process.exit(1);
}

let passed = 0, failed = 0, total = 0, skipped = 0;
const failures = [];

function assert(id, condition, message) {
  total++;
  if (condition) { passed++; console.log(`  PASS: ${id} - ${message}`); }
  else { failed++; failures.push({ id, message }); console.error(`  FAIL: ${id} - ${message}`); }
}

console.log('\n=== audit-logger.test.js ===\n');

// --- AL-001~005: writeAuditLog creates JSONL file ---

mod.writeAuditLog({
  action: 'phase_transition',
  actor: 'system',
  category: 'pdca',
  target: 'test-feature',
  targetType: 'feature',
  result: 'success',
});

const today = new Date().toISOString().slice(0, 10);
const auditFilePath = path.join(tmpDir, '.bkit', 'audit', `${today}.jsonl`);
assert('AL-001', fs.existsSync(auditFilePath), 'writeAuditLog creates JSONL file');

const content = fs.readFileSync(auditFilePath, 'utf-8').trim();
const entry = JSON.parse(content);
assert('AL-002', entry.action === 'phase_transition', 'Entry has correct action');
assert('AL-003', entry.actor === 'system', 'Entry has correct actor');
assert('AL-004', typeof entry.id === 'string' && entry.id.length > 0, 'Entry has UUID id');
assert('AL-005', typeof entry.timestamp === 'string' && entry.timestamp.includes('T'), 'Entry has ISO timestamp');

// --- AL-006~010: ACTION_TYPES all valid (count evolves per release) ---
// v2.1.10 baseline 16 + v2.1.13 4 (sprint_paused/resumed/master_plan_created/task_created)
// + v2.1.14 7 (layer_6_audit_completed/alarm_triggered, heredoc_bypass_blocked,
//             git_push_intercepted, post_tool_block_recorded, hook_reachability_lost,
//             memory_directive_enforced)
// + v2.1.16 2 (scope_boundary_approved [#95 F2], gate_measured [#94 F3]) = 29.

assert('AL-006', Array.isArray(mod.ACTION_TYPES), 'ACTION_TYPES is an array');
assert('AL-007', mod.ACTION_TYPES.length === 29, `ACTION_TYPES has 29 entries (got ${mod.ACTION_TYPES.length})`);
assert('AL-008', mod.ACTION_TYPES.includes('phase_transition'), 'Includes phase_transition');
assert('AL-009', mod.ACTION_TYPES.includes('destructive_blocked'), 'Includes destructive_blocked');
assert('AL-010', mod.ACTION_TYPES.includes('checkpoint_created'), 'Includes checkpoint_created');

// --- AL-011~013: readAuditLogs with filters ---

// Write additional entries for filtering
mod.writeAuditLog({ action: 'file_created', actor: 'agent', category: 'file', target: 'test-feature', targetType: 'feature' });
mod.writeAuditLog({ action: 'gate_passed', actor: 'system', category: 'quality', target: 'other-feature', targetType: 'feature' });

const allLogs = mod.readAuditLogs({ date: today });
assert('AL-011', allLogs.length >= 3, 'readAuditLogs returns all entries for today');

const filteredByFeature = mod.readAuditLogs({ date: today, feature: 'test-feature' });
assert('AL-012', filteredByFeature.length >= 2 && filteredByFeature.every(e => e.target === 'test-feature'),
  'readAuditLogs filters by feature');

const filteredByAction = mod.readAuditLogs({ date: today, action: 'gate_passed' });
assert('AL-013', filteredByAction.length >= 1 && filteredByAction.every(e => e.action === 'gate_passed'),
  'readAuditLogs filters by action');

// --- AL-014~016: generateDailySummary ---

const summary = mod.generateDailySummary(today);
assert('AL-014', summary.totalEntries >= 3, 'Summary has correct total entries');
assert('AL-015', typeof summary.byAction === 'object' && summary.byAction['phase_transition'] >= 1,
  'Summary counts by action');
assert('AL-016', typeof summary.byCategory === 'object', 'Summary counts by category');

// --- AL-017~018: cleanupOldLogs ---

// Create an old log file (40 days ago)
const auditDir = path.join(tmpDir, '.bkit', 'audit');
const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
fs.writeFileSync(path.join(auditDir, `${oldDate}.jsonl`), '{"action":"test"}\n', 'utf-8');

const deleted = mod.cleanupOldLogs(30);
assert('AL-017', deleted >= 1, 'cleanupOldLogs removes files older than 30 days');
assert('AL-018', !fs.existsSync(path.join(auditDir, `${oldDate}.jsonl`)), 'Old log file actually deleted');

// --- AL-019~020: UUID generation uniqueness ---

const uuid1 = mod.generateUUID();
const uuid2 = mod.generateUUID();
assert('AL-019', typeof uuid1 === 'string' && uuid1.length >= 32, 'generateUUID returns string');
assert('AL-020', uuid1 !== uuid2, 'Two UUIDs are unique');

// --- Cleanup ---
// Restore platform cache
delete require.cache[platformPath];
fs.rmSync(tmpDir, { recursive: true, force: true });

// --- Summary ---
console.log(`\nResults: ${passed}/${total} passed, ${failed} failed, ${skipped} skipped`);
if (failures.length > 0) {
  console.log('Failures:');
  failures.forEach(f => console.log(`  - ${f.id}: ${f.message}`));
}

module.exports = { passed, failed, total, skipped, failures };
