#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// TC counter
let passed = 0, failed = 0, total = 0;
function test(id, description, fn) {
  total++;
  try {
    fn();
    passed++;
  } catch (err) {
    failed++;
    console.error(`  FAIL ${id}: ${description}`);
    console.error(`    ${err.message}`);
  }
}

console.log('\n=== import-resolver.js Unit Tests ===\n');

// Setup temp dirs
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-ir-test-'));
const fakePluginRoot = path.join(tmpDir, 'plugin');
const fakeProjDir = path.join(tmpDir, 'project');
const fakeUserConfig = path.join(tmpDir, 'user-config');
fs.mkdirSync(fakePluginRoot, { recursive: true });
fs.mkdirSync(fakeProjDir, { recursive: true });
fs.mkdirSync(fakeUserConfig, { recursive: true });

// Create mock common.js and context-hierarchy.js in lib/ before requiring import-resolver
const libDir = path.resolve(__dirname, '../../lib');
const commonPath = path.join(libDir, 'common.js');
const hierarchyPath = path.join(libDir, 'context-hierarchy.js');
const commonExisted = fs.existsSync(commonPath);
const hierarchyExisted = fs.existsSync(hierarchyPath);

if (!commonExisted) {
  fs.writeFileSync(commonPath, `module.exports = {
    PLUGIN_ROOT: ${JSON.stringify(fakePluginRoot)},
    PROJECT_DIR: ${JSON.stringify(fakeProjDir)},
    debugLog: () => {},
  };`);
}
if (!hierarchyExisted) {
  fs.writeFileSync(hierarchyPath, `module.exports = {
    getUserConfigDir: () => ${JSON.stringify(fakeUserConfig)},
  };`);
}

// Clear cached module
const irModulePath = path.resolve(libDir, 'import-resolver.js');
delete require.cache[irModulePath];
delete require.cache[commonPath];
delete require.cache[hierarchyPath];

const {
  resolveImports, resolveImportPath, resolveVariables,
  loadImportedContent, detectCircularImport, parseFrontmatter,
  processMarkdownWithImports, clearImportCache, getCacheStats,
  IMPORT_CACHE_TTL,
} = require(irModulePath);

// --- IMPORT_CACHE_TTL ---

test('UT-IR-001', 'IMPORT_CACHE_TTL is 30 seconds', () => {
  assert.strictEqual(IMPORT_CACHE_TTL, 30000);
});

// --- resolveVariables ---

test('UT-IR-002', 'resolveVariables replaces ${PLUGIN_ROOT}', () => {
  const result = resolveVariables('${PLUGIN_ROOT}/templates/foo.md');
  assert.strictEqual(result, path.join(fakePluginRoot, 'templates', 'foo.md'));
});

test('UT-IR-003', 'resolveVariables replaces ${PROJECT}', () => {
  const result = resolveVariables('${PROJECT}/docs/plan.md');
  assert.strictEqual(result, path.join(fakeProjDir, 'docs', 'plan.md'));
});

test('UT-IR-004', 'resolveVariables replaces ${USER_CONFIG}', () => {
  const result = resolveVariables('${USER_CONFIG}/settings.json');
  assert.strictEqual(result, path.join(fakeUserConfig, 'settings.json'));
});

test('UT-IR-005', 'resolveVariables handles no variables', () => {
  assert.strictEqual(resolveVariables('./local/path.md'), './local/path.md');
});

// --- resolveImportPath ---

test('UT-IR-006', 'resolveImportPath resolves relative path from source file', () => {
  const result = resolveImportPath('./sibling.md', '/some/dir/source.md');
  assert.strictEqual(result, '/some/dir/sibling.md');
});

test('UT-IR-007', 'resolveImportPath resolves parent relative path', () => {
  const result = resolveImportPath('../parent.md', '/some/dir/source.md');
  assert.strictEqual(result, '/some/parent.md');
});

test('UT-IR-008', 'resolveImportPath resolves variable paths', () => {
  const result = resolveImportPath('${PLUGIN_ROOT}/templates/base.md', '/any/source.md');
  assert.ok(result.includes(fakePluginRoot));
  assert.ok(result.endsWith('base.md'));
});

// --- loadImportedContent ---

test('UT-IR-009', 'loadImportedContent returns file content', () => {
  clearImportCache();
  const fp = path.join(tmpDir, 'loadable.md');
  fs.writeFileSync(fp, '# Test Content\nHello world');
  const content = loadImportedContent(fp);
  assert.ok(content.includes('Test Content'));
  assert.ok(content.includes('Hello world'));
});

test('UT-IR-010', 'loadImportedContent returns empty for nonexistent file', () => {
  clearImportCache();
  const content = loadImportedContent('/nonexistent/path/file.md');
  assert.strictEqual(content, '');
});

test('UT-IR-011', 'loadImportedContent uses cache on second call', () => {
  clearImportCache();
  const fp = path.join(tmpDir, 'cached.md');
  fs.writeFileSync(fp, 'Original content');
  const first = loadImportedContent(fp);
  // Modify file, but cache should return original
  fs.writeFileSync(fp, 'Modified content');
  const second = loadImportedContent(fp);
  assert.strictEqual(first, second);
  assert.strictEqual(second, 'Original content');
});

// --- detectCircularImport ---

test('UT-IR-012', 'detectCircularImport returns false for non-circular', () => {
  assert.strictEqual(detectCircularImport('/some/unique/path.md'), false);
});

// --- parseFrontmatter ---

test('UT-IR-013', 'parseFrontmatter parses imports array', () => {
  const md = '---\ntitle: Test\nimports:\n  - ./a.md\n  - ./b.md\n---\n# Body\nContent here';
  const { frontmatter, body } = parseFrontmatter(md);
  assert.deepStrictEqual(frontmatter.imports, ['./a.md', './b.md']);
  assert.strictEqual(frontmatter.title, 'Test');
  assert.ok(body.includes('# Body'));
});

test('UT-IR-014', 'parseFrontmatter returns empty frontmatter for no frontmatter', () => {
  const md = '# Just a markdown file\nNo frontmatter here.';
  const { frontmatter, body } = parseFrontmatter(md);
  assert.deepStrictEqual(frontmatter, {});
  assert.strictEqual(body, md);
});

test('UT-IR-015', 'parseFrontmatter handles empty frontmatter', () => {
  const md = '---\n---\n# Body';
  const { frontmatter, body } = parseFrontmatter(md);
  assert.ok(typeof frontmatter === 'object');
  assert.ok(body.includes('# Body'));
});

// --- resolveImports ---

test('UT-IR-016', 'resolveImports returns empty for no imports', () => {
  const { content, errors } = resolveImports({}, '/source.md');
  assert.strictEqual(content, '');
  assert.deepStrictEqual(errors, []);
});

test('UT-IR-017', 'resolveImports loads existing import files', () => {
  clearImportCache();
  const importFile = path.join(tmpDir, 'importable.md');
  fs.writeFileSync(importFile, '## Imported Section\nImported content');
  const { content, errors } = resolveImports(
    { imports: [importFile] },
    '/source.md'
  );
  assert.ok(content.includes('Imported content'));
  assert.strictEqual(errors.length, 0);
});

test('UT-IR-018', 'resolveImports reports error for missing import', () => {
  clearImportCache();
  const { content, errors } = resolveImports(
    { imports: ['/nonexistent/missing.md'] },
    '/source.md'
  );
  assert.ok(errors.length >= 1);
  assert.ok(errors[0].includes('Failed to load'));
});

// --- processMarkdownWithImports ---

test('UT-IR-019', 'processMarkdownWithImports returns content for file without imports', () => {
  const fp = path.join(tmpDir, 'no-imports.md');
  fs.writeFileSync(fp, '# Simple\nNo imports here.');
  const { content, errors } = processMarkdownWithImports(fp);
  assert.ok(content.includes('Simple'));
  assert.deepStrictEqual(errors, []);
});

test('UT-IR-020', 'processMarkdownWithImports returns error for nonexistent file', () => {
  const { content, errors } = processMarkdownWithImports('/nonexistent/file.md');
  assert.strictEqual(content, '');
  assert.ok(errors.length >= 1);
  assert.ok(errors[0].includes('not found'));
});

test('UT-IR-021', 'processMarkdownWithImports resolves imports in frontmatter', () => {
  clearImportCache();
  const importFile = path.join(tmpDir, 'shared-rules.md');
  fs.writeFileSync(importFile, '## Shared Rules\n- Rule 1\n- Rule 2');
  const mainFile = path.join(tmpDir, 'with-imports.md');
  fs.writeFileSync(mainFile, `---\ntitle: Main\nimports:\n  - ${importFile}\n---\n# Main Content\nBody here`);
  const { content, errors } = processMarkdownWithImports(mainFile);
  assert.ok(content.includes('Shared Rules'));
  assert.ok(content.includes('Main Content'));
});

// --- clearImportCache / getCacheStats ---

test('UT-IR-022', 'clearImportCache empties the cache', () => {
  // Load something first
  const fp = path.join(tmpDir, 'for-cache.md');
  fs.writeFileSync(fp, 'cache me');
  loadImportedContent(fp);
  assert.ok(getCacheStats().size >= 1);
  clearImportCache();
  assert.strictEqual(getCacheStats().size, 0);
});

test('UT-IR-023', 'getCacheStats returns size and entries', () => {
  clearImportCache();
  const stats = getCacheStats();
  assert.strictEqual(stats.size, 0);
  assert.ok(Array.isArray(stats.entries));
  assert.strictEqual(stats.entries.length, 0);
});

// Cleanup: remove mock files if we created them
if (!commonExisted) { try { fs.unlinkSync(commonPath); } catch {} }
if (!hierarchyExisted) { try { fs.unlinkSync(hierarchyPath); } catch {} }
try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
delete require.cache[irModulePath];
delete require.cache[commonPath];
delete require.cache[hierarchyPath];

// Summary
console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
