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

async function testAsync(id, description, fn) {
  total++;
  try {
    await fn();
    passed++;
  } catch (err) {
    failed++;
    console.error(`  FAIL ${id}: ${description}`);
    console.error(`    ${err.message}`);
  }
}

console.log('\n=== impact-analyzer.js Unit Tests ===\n');

// Setup temp project
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-impact-test-'));
const projDir = path.join(tmpDir, 'project');
const srcDir = path.join(projDir, 'src');
fs.mkdirSync(srcDir, { recursive: true });
fs.mkdirSync(path.join(projDir, '.bkit', 'state'), { recursive: true });
fs.mkdirSync(path.join(projDir, '.bkit', 'runtime'), { recursive: true });

// Create test source files
fs.writeFileSync(path.join(srcDir, 'a.js'), "const b = require('./b');\nmodule.exports = { a: true };");
fs.writeFileSync(path.join(srcDir, 'b.js'), "const c = require('./c');\nmodule.exports = { b: true };");
fs.writeFileSync(path.join(srcDir, 'c.js'), "module.exports = { c: true };");
fs.writeFileSync(path.join(srcDir, 'standalone.js'), "module.exports = {};");

// Mock platform
const platformPath = require.resolve('../../lib/core/platform');
const origPlatformCache = require.cache[platformPath];
require.cache[platformPath] = {
  id: platformPath, filename: platformPath, loaded: true,
  exports: { PROJECT_DIR: projDir, PLUGIN_ROOT: path.join(tmpDir, 'plugin') },
};
const configPath = require.resolve('../../lib/core/config');
require.cache[configPath] = {
  id: configPath, filename: configPath, loaded: true,
  exports: { getConfig: (k, d) => d },
};

// Clear cached modules
delete require.cache[require.resolve('../../lib/core/paths')];
delete require.cache[require.resolve('../../lib/context/impact-analyzer')];

const {
  generateImpactMap, getBlastRadius, getAffectedFiles,
  writeImpactMap, collectSourceFiles, buildDependencyGraph, extractImports,
} = require('../../lib/context/impact-analyzer');

(async () => {

// --- extractImports ---

test('UT-IA-001', 'extractImports finds require statements', () => {
  const code = "const a = require('./a');\nconst b = require('./b');";
  const imports = extractImports(code);
  assert.deepStrictEqual(imports, ['./a', './b']);
});

test('UT-IA-002', 'extractImports finds ES import statements', () => {
  const code = "import foo from './foo';\nimport { bar } from './bar';";
  const imports = extractImports(code);
  assert.ok(imports.includes('./foo'));
  assert.ok(imports.includes('./bar'));
});

test('UT-IA-003', 'extractImports skips node_modules packages', () => {
  const code = "const fs = require('fs');\nconst lodash = require('lodash');\nconst local = require('./local');";
  const imports = extractImports(code);
  assert.strictEqual(imports.length, 1);
  assert.strictEqual(imports[0], './local');
});

test('UT-IA-004', 'extractImports handles dynamic import()', () => {
  const code = "const mod = import('./dynamic');";
  const imports = extractImports(code);
  assert.ok(imports.includes('./dynamic'));
});

test('UT-IA-005', 'extractImports returns empty for no imports', () => {
  const code = "const x = 1;\nconsole.log(x);";
  assert.deepStrictEqual(extractImports(code), []);
});

// --- collectSourceFiles ---

test('UT-IA-006', 'collectSourceFiles finds .js files in include paths', () => {
  const files = collectSourceFiles(projDir, ['src/'], ['node_modules/']);
  assert.strictEqual(files.length, 4);
  assert.ok(files.some(f => f.endsWith('a.js')));
  assert.ok(files.some(f => f.endsWith('standalone.js')));
});

test('UT-IA-007', 'collectSourceFiles returns empty for nonexistent include path', () => {
  const files = collectSourceFiles(projDir, ['nonexistent/'], []);
  assert.strictEqual(files.length, 0);
});

test('UT-IA-008', 'collectSourceFiles excludes directories', () => {
  const nmDir = path.join(projDir, 'node_modules', 'pkg');
  fs.mkdirSync(nmDir, { recursive: true });
  fs.writeFileSync(path.join(nmDir, 'index.js'), 'module.exports = {};');
  const files = collectSourceFiles(projDir, ['src/', 'node_modules/'], ['node_modules/']);
  assert.ok(!files.some(f => f.includes('node_modules')));
  fs.rmSync(path.join(projDir, 'node_modules'), { recursive: true, force: true });
});

// --- buildDependencyGraph ---

test('UT-IA-009', 'buildDependencyGraph builds correct graph', () => {
  const files = collectSourceFiles(projDir, ['src/'], []);
  const graph = buildDependencyGraph(projDir, files);
  const aPath = path.join(srcDir, 'a.js');
  const bPath = path.join(srcDir, 'b.js');
  const cPath = path.join(srcDir, 'c.js');
  // a depends on b
  assert.ok(graph.dependsOn[aPath].includes(bPath));
  // b is depended by a
  assert.ok(graph.dependedBy[bPath].includes(aPath));
  // c is depended by b
  assert.ok(graph.dependedBy[cPath].includes(bPath));
});

// --- generateImpactMap ---

await testAsync('UT-IA-010', 'generateImpactMap produces valid map structure', async () => {
  const map = await generateImpactMap(projDir, { include: ['src/'] });
  assert.strictEqual(map.version, '1.0');
  assert.ok(map.generated_at);
  assert.ok(map.modules);
  const cKey = Object.keys(map.modules).find(k => k.includes('c.js'));
  assert.ok(cKey);
  assert.ok(map.modules[cKey].depended_by.length >= 1);
});

// --- writeImpactMap ---

test('UT-IA-011', 'writeImpactMap writes JSON file', () => {
  const outPath = path.join(tmpDir, 'impact-out.json');
  writeImpactMap({ version: '1.0', modules: {} }, outPath);
  const content = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  assert.strictEqual(content.version, '1.0');
});

// --- getBlastRadius ---

await testAsync('UT-IA-012', 'getBlastRadius returns default when no map file', async () => {
  const result = await getBlastRadius('nonexistent.js', projDir);
  assert.strictEqual(result.blast_radius, 0);
  assert.strictEqual(result.change_risk, 'unknown');
});

await testAsync('UT-IA-013', 'getBlastRadius reads from impact-map.json', async () => {
  const mapPath = path.join(projDir, '.bkit', 'impact-map.json');
  fs.writeFileSync(mapPath, JSON.stringify({
    modules: {
      'src/c.js': { depends_on: [], depended_by: ['src/b.js'], blast_radius: 1, change_risk: 'low' },
    },
  }));
  const result = await getBlastRadius('src/c.js', projDir);
  assert.strictEqual(result.blast_radius, 1);
  assert.strictEqual(result.change_risk, 'low');
});

// --- getAffectedFiles ---

await testAsync('UT-IA-014', 'getAffectedFiles returns affected file list', async () => {
  const result = await getAffectedFiles('src/c.js', projDir);
  assert.ok(Array.isArray(result));
});

// Cleanup
try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
if (origPlatformCache) require.cache[platformPath] = origPlatformCache;
else delete require.cache[platformPath];

// Summary
console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);

})();
