/**
 * CompletenessScanner unit tests
 * @module tests/qa/completeness.test
 *
 * Tests T9-T11 from design doc section 8.1:
 *   T9:  Skill references non-existent agent -> CRITICAL issue
 *   T10: description > 250 chars -> WARNING issue
 *   T11: missing effort frontmatter -> INFO issue
 *
 * Run: node tests/qa/completeness.test.js
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const CompletenessScanner = require(path.join(PROJECT_ROOT, 'lib/qa/scanners/completeness'));

let passed = 0;
let failed = 0;
let tmpDir = null;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS: ${name}`);
  } catch (err) {
    failed++;
    console.error(`  FAIL: ${name}`);
    console.error(`        ${err.message}`);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  PASS: ${name}`);
  } catch (err) {
    failed++;
    console.error(`  FAIL: ${name}`);
    console.error(`        ${err.message}`);
  }
}

/**
 * Create a temporary directory with fixture files for testing
 * @param {Object} files - Map of relative path -> content
 * @returns {string} Absolute path to temp directory
 */
function createFixture(files) {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-completeness-test-'));
  for (const [relPath, content] of Object.entries(files)) {
    const fullPath = path.join(tmpDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf-8');
  }
  return tmpDir;
}

/**
 * Clean up temporary directory
 */
function cleanupFixture() {
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    tmpDir = null;
  }
}

/**
 * Build a minimal SKILL.md with YAML frontmatter
 * @param {Object} opts - Frontmatter fields
 * @returns {string} SKILL.md content
 */
function buildSkillMd(opts = {}) {
  const lines = ['---'];
  if (opts.name) lines.push(`name: ${opts.name}`);
  if (opts.description !== undefined) {
    if (opts.description.includes('\n')) {
      lines.push('description: |');
      lines.push(`  ${opts.description}`);
    } else {
      lines.push(`description: "${opts.description}"`);
    }
  }
  if (opts.effort) lines.push(`effort: ${opts.effort}`);
  if (opts.agents) {
    lines.push('agents:');
    for (const [role, agent] of Object.entries(opts.agents)) {
      lines.push(`  ${role}: ${agent}`);
    }
  }
  lines.push('---');
  lines.push('');
  lines.push(`# ${opts.name || 'Test'} Skill`);
  lines.push('');
  lines.push(opts.body || '> Test skill description');
  return lines.join('\n');
}

console.log('\n=== CompletenessScanner Tests ===\n');

(async () => {
  // --- T9: Skill references non-existent agent ---

  await testAsync('T9: detects skills referencing non-existent agents', async () => {
    const root = createFixture({
      'skills/test-skill/SKILL.md': [
        '---',
        'name: test-skill',
        'description: "A test skill for validation."',
        'effort: medium',
        'agentTeam: [existing-agent, ghost-agent]',
        '---',
        '',
        '# test-skill Skill',
        '',
        '> Test skill description'
      ].join('\n'),
      'agents/existing-agent.md': '---\nname: existing-agent\n---\n# Existing Agent\n'
      // ghost-agent.md does NOT exist
    });

    try {
      const scanner = new CompletenessScanner({
        rootDir: root,
        include: ['skills/*/SKILL.md']
      });
      await scanner.scan();

      const ghostRefs = scanner.issues.filter(i =>
        i.severity === 'CRITICAL' &&
        (i.message.includes('ghost-agent') || i.message.includes('non-existent'))
      );
      assert.ok(ghostRefs.length >= 1, `Expected CRITICAL for non-existent agent, got ${ghostRefs.length}`);
    } finally {
      cleanupFixture();
    }
  });

  // --- T10: description exceeds 250 characters ---

  await testAsync('T10: flags description > 250 chars', async () => {
    const longDesc = 'A'.repeat(260); // 260 chars, well over 250
    const root = createFixture({
      'skills/verbose-skill/SKILL.md': buildSkillMd({
        name: 'verbose-skill',
        description: longDesc,
        effort: 'low'
      })
    });

    try {
      const scanner = new CompletenessScanner({
        rootDir: root,
        include: ['skills/*/SKILL.md']
      });
      await scanner.scan();

      const descIssues = scanner.issues.filter(i =>
        i.message.includes('250') || i.message.includes('description') || i.pattern === 'description-too-long'
      );
      assert.ok(descIssues.length >= 1, `Expected issue for long description, got ${descIssues.length}`);
      assert.ok(
        descIssues.some(i => i.severity === 'WARNING'),
        'Description length issue should be WARNING severity'
      );
    } finally {
      cleanupFixture();
    }
  });

  // --- T11: missing effort frontmatter ---

  await testAsync('T11: flags missing effort frontmatter', async () => {
    const root = createFixture({
      'skills/no-effort/SKILL.md': buildSkillMd({
        name: 'no-effort',
        description: 'A skill without effort field.'
        // No effort field
      })
    });

    try {
      const scanner = new CompletenessScanner({
        rootDir: root,
        include: ['skills/*/SKILL.md']
      });
      await scanner.scan();

      const effortIssues = scanner.issues.filter(i =>
        i.message.includes('effort') || i.pattern === 'missing-effort'
      );
      assert.ok(effortIssues.length >= 1, `Expected issue for missing effort, got ${effortIssues.length}`);
      assert.ok(
        effortIssues.some(i => i.severity === 'INFO'),
        'Missing effort should be INFO severity'
      );
    } finally {
      cleanupFixture();
    }
  });

  // --- No issues for valid skill ---

  await testAsync('no issues for valid skill with all fields', async () => {
    const root = createFixture({
      'skills/good-skill/SKILL.md': [
        '---',
        'name: good-skill',
        'description: "A well-formed skill with proper configuration."',
        'effort: medium',
        'agentTeam: [good-agent]',
        '---',
        '',
        '# good-skill Skill',
        '',
        '> Test skill description'
      ].join('\n'),
      'agents/good-agent.md': '---\nname: good-agent\n---\n# Good Agent\n'
    });

    try {
      const scanner = new CompletenessScanner({
        rootDir: root,
        include: ['skills/*/SKILL.md']
      });
      await scanner.scan();

      const criticals = scanner.issues.filter(i => i.severity === 'CRITICAL');
      assert.strictEqual(criticals.length, 0, `Expected 0 CRITICAL issues, got ${criticals.length}`);
    } finally {
      cleanupFixture();
    }
  });

  // --- Missing description ---

  await testAsync('flags missing description as CRITICAL', async () => {
    const root = createFixture({
      'skills/no-desc/SKILL.md': '---\nname: no-desc\neffort: low\n---\n# No Desc Skill\n'
    });

    try {
      const scanner = new CompletenessScanner({
        rootDir: root,
        include: ['skills/*/SKILL.md']
      });
      await scanner.scan();

      const descIssues = scanner.issues.filter(i =>
        i.severity === 'CRITICAL' &&
        (i.message.includes('description') || i.pattern === 'missing-description')
      );
      assert.ok(descIssues.length >= 1, `Expected CRITICAL for missing description, got ${descIssues.length}`);
    } finally {
      cleanupFixture();
    }
  });

  // --- Constructor ---

  test('inherits from ScannerBase', () => {
    const ScannerBase = require(path.join(PROJECT_ROOT, 'lib/qa/scanner-base'));
    const scanner = new CompletenessScanner({ rootDir: '/tmp' });
    assert.ok(scanner instanceof ScannerBase, 'CompletenessScanner should extend ScannerBase');
    assert.strictEqual(scanner.name, 'completeness');
  });

  // --- Summary ---
  console.log(`\nResults: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  cleanupFixture();
  process.exit(failed > 0 ? 1 : 0);
})();
