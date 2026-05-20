/**
 * ShellEscapeScanner unit tests
 * @module tests/qa/shell-escape.test
 *
 * Tests T12-T14 from design doc section 8.1:
 *   T12: bare $1 in awk command within ```! block -> CRITICAL issue
 *   T13: escaped \$1 or single-quoted -> no issues
 *   T14: unescaped backtick -> WARNING issue
 *
 * Run: node tests/qa/shell-escape.test.js
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const ShellEscapeScanner = require(path.join(PROJECT_ROOT, 'lib/qa/scanners/shell-escape'));

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
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-shell-escape-test-'));
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
 * Build a SKILL.md containing shell blocks for testing
 * @param {string} name - Skill name
 * @param {string} shellBlock - Content inside the ```! block
 * @returns {string} SKILL.md content
 */
function buildSkillWithShell(name, shellBlock) {
  return `---
name: ${name}
description: "Test skill for shell escape validation."
effort: low
---

# ${name} Skill

## Shell Block

\`\`\`!
${shellBlock}
\`\`\`
`;
}

console.log('\n=== ShellEscapeScanner Tests ===\n');

(async () => {
  // --- T12: bare $1 in awk command ---

  await testAsync('T12: detects bare $1 in awk command within shell block', async () => {
    const root = createFixture({
      'skills/awk-skill/SKILL.md': buildSkillWithShell('awk-skill',
        `#!/bin/bash
grep "pattern" file.txt | awk "{print $1}"
echo "done"`)
    });

    try {
      const scanner = new ShellEscapeScanner({
        rootDir: root,
        include: ['skills/*/SKILL.md']
      });
      await scanner.scan();

      const dollarN = scanner.issues.filter(i =>
        i.severity === 'CRITICAL' &&
        (i.message.includes('$1') || i.pattern === 'dollar-n-conflict')
      );
      assert.ok(dollarN.length >= 1, `Expected CRITICAL for bare $1 in awk, got ${dollarN.length}`);
    } finally {
      cleanupFixture();
    }
  });

  // --- T13a: $N inside single-quoted strings is safe ---

  await testAsync('T13a: ignores $N in single-quoted strings', async () => {
    const root = createFixture({
      'skills/safe-skill/SKILL.md': buildSkillWithShell('safe-skill',
        `#!/bin/bash
echo 'This has $1 but in single quotes'
awk -v var="value" '{print var}'`)
    });

    try {
      const scanner = new ShellEscapeScanner({
        rootDir: root,
        include: ['skills/*/SKILL.md']
      });
      await scanner.scan();

      const criticals = scanner.issues.filter(i =>
        i.severity === 'CRITICAL' && i.pattern === 'dollar-n-conflict'
      );
      assert.strictEqual(criticals.length, 0, `Expected 0 CRITICAL issues for single-quoted $1, got ${criticals.length}`);
    } finally {
      cleanupFixture();
    }
  });

  // --- T13b: escaped \$1 is safe ---

  await testAsync('T13b: ignores escaped \\$1', async () => {
    const root = createFixture({
      'skills/escaped-skill/SKILL.md': buildSkillWithShell('escaped-skill',
        `#!/bin/bash
awk '{print \\$1}' file.txt`)
    });

    try {
      const scanner = new ShellEscapeScanner({
        rootDir: root,
        include: ['skills/*/SKILL.md']
      });
      await scanner.scan();

      const criticals = scanner.issues.filter(i =>
        i.severity === 'CRITICAL' && i.pattern === 'dollar-n-conflict'
      );
      assert.strictEqual(criticals.length, 0, `Expected 0 CRITICAL issues for escaped $1, got ${criticals.length}`);
    } finally {
      cleanupFixture();
    }
  });

  // --- T14: unescaped backtick ---

  await testAsync('T14: detects unescaped backticks', async () => {
    const root = createFixture({
      'skills/backtick-skill/SKILL.md': buildSkillWithShell('backtick-skill',
        `#!/bin/bash
RESULT=\`hostname\`
echo $RESULT`)
    });

    try {
      const scanner = new ShellEscapeScanner({
        rootDir: root,
        include: ['skills/*/SKILL.md']
      });
      await scanner.scan();

      const backtickIssues = scanner.issues.filter(i =>
        i.message.includes('backtick') || i.pattern === 'unescaped-backtick'
      );
      assert.ok(backtickIssues.length >= 1, `Expected WARNING for unescaped backtick, got ${backtickIssues.length}`);
      assert.ok(
        backtickIssues.some(i => i.severity === 'WARNING'),
        'Unescaped backtick should be WARNING severity'
      );
    } finally {
      cleanupFixture();
    }
  });

  // --- Heredoc with unquoted delimiter + $N ---

  await testAsync('detects heredoc with unquoted delimiter and $N pattern', async () => {
    const root = createFixture({
      'skills/heredoc-skill/SKILL.md': buildSkillWithShell('heredoc-skill',
        `#!/bin/bash
cat <<MARKER
Hello $1
World $2
MARKER`)
    });

    try {
      const scanner = new ShellEscapeScanner({
        rootDir: root,
        include: ['skills/*/SKILL.md']
      });
      await scanner.scan();

      const heredocIssues = scanner.issues.filter(i =>
        i.message.includes('heredoc') || i.pattern === 'heredoc-dollar-n'
      );
      assert.ok(heredocIssues.length >= 1, `Expected issue for heredoc with $N, got ${heredocIssues.length}`);
    } finally {
      cleanupFixture();
    }
  });

  // --- Heredoc with quoted delimiter is safe ---

  await testAsync('ignores heredoc with quoted delimiter', async () => {
    const root = createFixture({
      'skills/safe-heredoc/SKILL.md': buildSkillWithShell('safe-heredoc',
        `#!/bin/bash
cat <<'EOF'
Hello $1
World $2
EOF`)
    });

    try {
      const scanner = new ShellEscapeScanner({
        rootDir: root,
        include: ['skills/*/SKILL.md']
      });
      await scanner.scan();

      const heredocIssues = scanner.issues.filter(i =>
        i.pattern === 'heredoc-dollar-n'
      );
      assert.strictEqual(heredocIssues.length, 0, `Expected 0 heredoc issues for quoted delimiter, got ${heredocIssues.length}`);
    } finally {
      cleanupFixture();
    }
  });

  // --- No shell blocks -> no issues ---

  await testAsync('no issues when SKILL.md has no shell blocks', async () => {
    const root = createFixture({
      'skills/no-shell/SKILL.md': `---
name: no-shell
description: "A skill with no shell blocks."
effort: low
---

# No Shell Skill

This skill has no shell code blocks.

\`\`\`javascript
console.log('not a shell block');
\`\`\`
`
    });

    try {
      const scanner = new ShellEscapeScanner({
        rootDir: root,
        include: ['skills/*/SKILL.md']
      });
      await scanner.scan();

      assert.strictEqual(scanner.issues.length, 0, `Expected 0 issues for non-shell blocks, got ${scanner.issues.length}`);
    } finally {
      cleanupFixture();
    }
  });

  // --- Constructor ---

  test('inherits from ScannerBase', () => {
    const ScannerBase = require(path.join(PROJECT_ROOT, 'lib/qa/scanner-base'));
    const scanner = new ShellEscapeScanner({ rootDir: '/tmp' });
    assert.ok(scanner instanceof ScannerBase, 'ShellEscapeScanner should extend ScannerBase');
    assert.strictEqual(scanner.name, 'shell-escape');
  });

  // --- Summary ---
  console.log(`\nResults: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  cleanupFixture();
  process.exit(failed > 0 ? 1 : 0);
})();
