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

console.log('\n=== Task Queue Unit Tests ===\n');

const {
  createTeamTasks,
  assignTaskToRole,
  getTeamProgress,
  findNextAvailableTask,
  isPhaseComplete,
} = require('../../lib/team/task-queue.js');

// ── createTeamTasks ──

test('TQ-001', 'createTeamTasks: empty teammates returns empty array', () => {
  const tasks = createTeamTasks('do', 'my-feature', []);
  assert.deepStrictEqual(tasks, []);
});

test('TQ-002', 'createTeamTasks: null teammates returns empty array', () => {
  const tasks = createTeamTasks('do', 'my-feature', null);
  assert.deepStrictEqual(tasks, []);
});

test('TQ-003', 'createTeamTasks: creates task per teammate', () => {
  const teammates = [
    { name: 'developer', task: 'Implement API', agentType: 'bkend-expert' },
    { name: 'frontend', task: 'Build UI', agentType: 'frontend-architect' },
  ];
  const tasks = createTeamTasks('do', 'auth-feature', teammates);
  assert.strictEqual(tasks.length, 2);
});

test('TQ-004', 'createTeamTasks: task has required fields', () => {
  const teammates = [{ name: 'developer', task: 'Implement API' }];
  const tasks = createTeamTasks('do', 'auth-feature', teammates);
  const task = tasks[0];
  assert.ok(task.role);
  assert.ok(task.subject);
  assert.ok(task.description);
  assert.ok(task.metadata);
  assert.ok(Array.isArray(task.dependencies));
});

test('TQ-005', 'createTeamTasks: metadata contains feature, phase, role', () => {
  const teammates = [{ name: 'qa', task: 'Run tests' }];
  const tasks = createTeamTasks('check', 'auth-feature', teammates);
  assert.strictEqual(tasks[0].metadata.feature, 'auth-feature');
  assert.strictEqual(tasks[0].metadata.phase, 'check');
  assert.strictEqual(tasks[0].metadata.role, 'qa');
  assert.strictEqual(tasks[0].metadata.teamTask, true);
});

test('TQ-006', 'createTeamTasks: subject contains phase icon', () => {
  const teammates = [{ name: 'developer', task: 'Code' }];
  const doTasks = createTeamTasks('do', 'f1', teammates);
  assert.ok(doTasks[0].subject.includes('\u{1F528}')); // hammer emoji for 'do'

  const checkTasks = createTeamTasks('check', 'f1', teammates);
  assert.ok(checkTasks[0].subject.includes('\u{1F50D}')); // magnifying glass for 'check'
});

test('TQ-007', 'createTeamTasks: fallback description when no task field', () => {
  const teammates = [{ name: 'developer' }];
  const tasks = createTeamTasks('do', 'my-feature', teammates);
  assert.ok(tasks[0].description.includes('Execute do phase'));
});

// ── assignTaskToRole ──

test('TQ-008', 'assignTaskToRole: returns assignment object', () => {
  const assignment = assignTaskToRole('task-001', 'developer', 'feat-x', 'do');
  assert.strictEqual(assignment.taskId, 'task-001');
  assert.strictEqual(assignment.role, 'developer');
  assert.strictEqual(assignment.feature, 'feat-x');
  assert.strictEqual(assignment.phase, 'do');
  assert.strictEqual(assignment.status, 'assigned');
  assert.ok(assignment.assignedAt);
});

// ── getTeamProgress ──

test('TQ-009', 'getTeamProgress: returns progress for assigned tasks', () => {
  // Assign some tasks first
  assignTaskToRole('tq-test-1', 'dev', 'progress-feat', 'do');
  assignTaskToRole('tq-test-2', 'qa', 'progress-feat', 'do');

  const progress = getTeamProgress('progress-feat', 'do');
  assert.ok(progress.total >= 2);
  assert.strictEqual(typeof progress.completed, 'number');
  assert.strictEqual(typeof progress.inProgress, 'number');
  assert.strictEqual(typeof progress.pending, 'number');
  assert.strictEqual(typeof progress.completionRate, 'number');
});

test('TQ-010', 'getTeamProgress: no tasks returns zeros', () => {
  const progress = getTeamProgress('nonexistent-feature-xyz', 'plan');
  assert.strictEqual(progress.total, 0);
  assert.strictEqual(progress.completed, 0);
  assert.strictEqual(progress.completionRate, 0);
});

// ── findNextAvailableTask ──

test('TQ-011', 'findNextAvailableTask: finds assigned task for role', () => {
  assignTaskToRole('find-task-1', 'finder-role', 'find-feat', 'do');
  const task = findNextAvailableTask('finder-role', 'find-feat');
  assert.ok(task);
  assert.strictEqual(task.taskId, 'find-task-1');
  assert.strictEqual(task.feature, 'find-feat');
});

test('TQ-012', 'findNextAvailableTask: returns null for no matching tasks', () => {
  const task = findNextAvailableTask('no-such-role-xyz', 'no-such-feature-xyz');
  assert.strictEqual(task, null);
});

// ── isPhaseComplete ──

test('TQ-013', 'isPhaseComplete: false when no tasks exist', () => {
  assert.strictEqual(isPhaseComplete('no-feature-xyz', 'plan'), false);
});

test('TQ-014', 'isPhaseComplete: false when tasks are not all completed', () => {
  assignTaskToRole('complete-test-1', 'dev', 'complete-feat', 'do');
  assert.strictEqual(isPhaseComplete('complete-feat', 'do'), false);
});

// ── Exports verification ──

test('TQ-015', 'All 5 exports exist', () => {
  assert.strictEqual(typeof createTeamTasks, 'function');
  assert.strictEqual(typeof assignTaskToRole, 'function');
  assert.strictEqual(typeof getTeamProgress, 'function');
  assert.strictEqual(typeof findNextAvailableTask, 'function');
  assert.strictEqual(typeof isPhaseComplete, 'function');
});

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
