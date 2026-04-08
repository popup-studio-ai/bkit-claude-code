#!/usr/bin/env node
'use strict';

/**
 * pdca-resume.test.js - E2E tests for lib/pdca/resume.js
 * Tests PDCA session resume: create, load, validate, resume, cleanup
 *
 * @module test/e2e/pdca-resume
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { withTempDir, createBkitStateDir } = require('../helpers/temp-dir');

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

async function asyncTest(id, desc, fn) {
  total++;
  try {
    await fn();
    passed++;
    console.log(`  PASS ${id}: ${desc}`);
  } catch (e) {
    failed++;
    console.error(`  FAIL ${id}: ${desc}\n    ${e.message}`);
  }
}

console.log('\n=== E2E: PDCA Session Resume ===\n');

/**
 * Helper: require resume module with CLAUDE_PROJECT_DIR pointed to tmpDir.
 * Must be called fresh each time to avoid module caching with stale paths.
 */
function loadResume(tmpDir) {
  // Set env so platform.js resolves PROJECT_DIR to our temp dir
  process.env.CLAUDE_PROJECT_DIR = tmpDir;

  // Clear module cache for paths, platform, core, and resume to pick up new env
  const modulesToClear = [
    '../../lib/core/platform',
    '../../lib/core/paths',
    '../../lib/core',
    '../../lib/core/index',
    '../../lib/pdca/resume',
  ];
  for (const mod of modulesToClear) {
    const resolved = require.resolve(mod);
    delete require.cache[resolved];
  }

  return require('../../lib/pdca/resume');
}

(async () => {

  // ---------- RES-01: createResumePoint writes file ----------
  await asyncTest('RES-01', 'createResumePoint writes resume data to disk', async () => {
    await withTempDir((tmpDir) => {
      createBkitStateDir(tmpDir);
      const resume = loadResume(tmpDir);

      const result = resume.createResumePoint('test-feature', {
        phase: 'do',
        reason: 'StopFailure',
        matchRate: 0.85,
        iterationCount: 3,
      });

      assert.ok(result.resumeId, 'Should return a resumeId');
      assert.ok(result.resumeId.startsWith('test-feature-'), `resumeId should start with feature name, got: ${result.resumeId}`);
      assert.ok(result.path, 'Should return a file path');
      assert.ok(fs.existsSync(result.path), 'Resume file should exist on disk');

      const data = JSON.parse(fs.readFileSync(result.path, 'utf8'));
      assert.strictEqual(data.feature, 'test-feature');
      assert.strictEqual(data.phase, 'do');
      assert.strictEqual(data.reason, 'StopFailure');
      assert.strictEqual(data.context.matchRate, 0.85);
      assert.strictEqual(data.context.iterationCount, 3);
      assert.strictEqual(data.isValid, true);
    });
  });

  // ---------- RES-02: resumeSession restores state ----------
  await asyncTest('RES-02', 'resumeSession restores saved state correctly', async () => {
    await withTempDir((tmpDir) => {
      createBkitStateDir(tmpDir);
      const resume = loadResume(tmpDir);

      resume.createResumePoint('restore-test', {
        phase: 'check',
        reason: 'ContextOverflow',
        matchRate: 0.72,
        iterationCount: 5,
        pendingTasks: ['task-a', 'task-b'],
      });

      const restored = resume.resumeSession('restore-test');
      assert.ok(restored, 'Should return restored state');
      assert.strictEqual(restored.phase, 'check');
      assert.strictEqual(restored.context.matchRate, 0.72);
      assert.strictEqual(restored.context.iterationCount, 5);
      assert.deepStrictEqual(restored.pendingTasks, ['task-a', 'task-b']);
    });
  });

  // ---------- RES-03: Non-existent resume point returns null ----------
  await asyncTest('RES-03', 'resumeSession returns null for non-existent feature', async () => {
    await withTempDir((tmpDir) => {
      createBkitStateDir(tmpDir);
      const resume = loadResume(tmpDir);

      const result = resume.resumeSession('does-not-exist');
      assert.strictEqual(result, null, 'Should return null for missing resume point');
    });
  });

  // ---------- RES-04: cleanupExpired removes old resume points ----------
  await asyncTest('RES-04', 'cleanupExpired removes expired resume data files', async () => {
    await withTempDir((tmpDir) => {
      createBkitStateDir(tmpDir);
      const resume = loadResume(tmpDir);

      // Create a resume point, then manually backdate its expiresAt
      resume.createResumePoint('expired-feature', { phase: 'plan', reason: 'Error' });
      const resumeDir = path.join(tmpDir, '.bkit', 'state', 'resume');
      const resumeFile = path.join(resumeDir, 'expired-feature.resume.json');
      assert.ok(fs.existsSync(resumeFile), 'Resume file should exist before cleanup');

      const data = JSON.parse(fs.readFileSync(resumeFile, 'utf8'));
      data.expiresAt = new Date(Date.now() - 1000).toISOString(); // expired 1s ago
      fs.writeFileSync(resumeFile, JSON.stringify(data, null, 2));

      const cleaned = resume.cleanupExpired();
      assert.ok(cleaned.includes('expired-feature'), `cleaned should include "expired-feature", got: ${JSON.stringify(cleaned)}`);
      assert.ok(!fs.existsSync(resumeFile), 'Expired resume file should be deleted');
    });
  });

  // ---------- RES-05: validateResumeData format validation ----------
  await asyncTest('RES-05', 'validateResumeData rejects invalid resume data', async () => {
    await withTempDir((tmpDir) => {
      createBkitStateDir(tmpDir);
      const resume = loadResume(tmpDir);

      // null data
      assert.strictEqual(resume.validateResumeData(null).valid, false);

      // Missing feature
      assert.strictEqual(resume.validateResumeData({ isValid: true, phase: 'do' }).valid, false);

      // Missing phase
      assert.strictEqual(resume.validateResumeData({ isValid: true, feature: 'x' }).valid, false);

      // Marked invalid
      assert.strictEqual(resume.validateResumeData({ isValid: false, feature: 'x', phase: 'do' }).valid, false);

      // Expired
      const expiredData = {
        isValid: true,
        feature: 'x',
        phase: 'do',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      };
      assert.strictEqual(resume.validateResumeData(expiredData).valid, false);

      // Valid data
      const validData = {
        isValid: true,
        feature: 'y',
        phase: 'check',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };
      assert.strictEqual(resume.validateResumeData(validData).valid, true);
    });
  });

  // ---------- RES-06: loadResumePoint returns null for corrupted file ----------
  await asyncTest('RES-06', 'loadResumePoint returns null for corrupted JSON file', async () => {
    await withTempDir((tmpDir) => {
      createBkitStateDir(tmpDir);
      const resume = loadResume(tmpDir);

      const resumeDir = path.join(tmpDir, '.bkit', 'state', 'resume');
      fs.mkdirSync(resumeDir, { recursive: true });
      fs.writeFileSync(path.join(resumeDir, 'corrupted.resume.json'), 'NOT VALID JSON{{{');

      const result = resume.loadResumePoint('corrupted');
      assert.strictEqual(result, null, 'Should return null for corrupted file');
    });
  });

  // ---------- RES-07: clearResumePoint removes specific feature ----------
  await asyncTest('RES-07', 'clearResumePoint removes only the specified feature resume', async () => {
    await withTempDir((tmpDir) => {
      createBkitStateDir(tmpDir);
      const resume = loadResume(tmpDir);

      resume.createResumePoint('keep-this', { phase: 'do' });
      resume.createResumePoint('remove-this', { phase: 'plan' });

      resume.clearResumePoint('remove-this');

      const resumeDir = path.join(tmpDir, '.bkit', 'state', 'resume');
      assert.ok(!fs.existsSync(path.join(resumeDir, 'remove-this.resume.json')), 'Removed file should not exist');
      assert.ok(fs.existsSync(path.join(resumeDir, 'keep-this.resume.json')), 'Other file should still exist');
    });
  });

  // ---------- RES-08: listResumePoints enumerates all resume points ----------
  await asyncTest('RES-08', 'listResumePoints returns all stored resume entries', async () => {
    await withTempDir((tmpDir) => {
      createBkitStateDir(tmpDir);
      const resume = loadResume(tmpDir);

      resume.createResumePoint('feat-alpha', { phase: 'plan', reason: 'UserAbort' });
      resume.createResumePoint('feat-beta', { phase: 'do', reason: 'StopFailure' });

      const list = resume.listResumePoints();
      assert.ok(Array.isArray(list), 'Should return an array');
      assert.strictEqual(list.length, 2, `Should have 2 entries, got ${list.length}`);

      const features = list.map(e => e.feature).sort();
      assert.deepStrictEqual(features, ['feat-alpha', 'feat-beta']);

      const alpha = list.find(e => e.feature === 'feat-alpha');
      assert.strictEqual(alpha.phase, 'plan');
      assert.strictEqual(alpha.reason, 'UserAbort');
      assert.strictEqual(alpha.isValid, true);
    });
  });

  // ---------- Summary ----------
  console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
  if (failed > 0) process.exit(1);

})();
