/**
 * Dead Code Scanner — detect stale require/import targets and unused exports
 * @module lib/qa/scanners/dead-code
 * @version 2.1.4
 */

const path = require('path');
const fs = require('fs');
const ScannerBase = require('../scanner-base');
const { resolveRequirePath, getJsFiles, readFileLines } = require('../utils/file-resolver');
const { extractRequires, extractExports } = require('../utils/pattern-matcher');

class DeadCodeScanner extends ScannerBase {
  /**
   * @param {Object} [options]
   */
  constructor(options = {}) {
    super('dead-code', {
      ...options,
      include: options.include || ['lib/**/*.js', 'hooks/**/*.js', 'scripts/**/*.js'],
      exclude: options.exclude || ['node_modules', 'tests', '*.test.js']
    });
  }

  /**
   * Run all dead code detection phases
   * @returns {Promise<import('../scanner-base').Issue[]>}
   */
  async scan() {
    this.reset();

    this.log('Phase 1: Checking require/import targets...');
    this.scanStaleRequires();

    this.log('Phase 2: Finding unused exports...');
    this.scanUnusedExports();

    this.log('Phase 3: Checking agent/skill references...');
    this.scanAgentSkillRefs();

    return this.issues;
  }

  /**
   * Phase 1: Scan for require/import targets that do not exist
   */
  scanStaleRequires() {
    const files = getJsFiles(this.include, this.exclude, this.rootDir);

    for (const filePath of files) {
      let content;
      try {
        content = fs.readFileSync(filePath, 'utf-8');
      } catch {
        continue;
      }

      const requires = extractRequires(content);

      for (const req of requires) {
        // Skip non-relative paths (npm packages)
        if (!req.path.startsWith('.') && !req.path.startsWith('/')) continue;

        const resolved = resolveRequirePath(filePath, req.path);
        if (!resolved) {
          const relFile = path.relative(this.rootDir, filePath);
          this.addIssue(
            'CRITICAL',
            relFile,
            req.line,
            `require target not found: ${req.path}`,
            'stale-require',
            'Remove or update the require statement'
          );
        }
      }
    }
  }

  /**
   * Phase 2: Find exported functions in lib/ that are never imported anywhere
   */
  scanUnusedExports() {
    const libFiles = getJsFiles(['lib/**/*.js'], this.exclude, this.rootDir);
    const allFiles = getJsFiles(
      ['lib/**/*.js', 'hooks/**/*.js', 'scripts/**/*.js', 'servers/**/*.js'],
      this.exclude,
      this.rootDir
    );

    // Build a map of all require paths used across the codebase
    const allRequiredNames = new Set();
    const allFileContents = new Map();

    for (const filePath of allFiles) {
      let content;
      try {
        content = fs.readFileSync(filePath, 'utf-8');
        allFileContents.set(filePath, content);
      } catch {
        continue;
      }
    }

    // For each lib file, check if its exports are referenced
    for (const libFile of libFiles) {
      const content = allFileContents.get(libFile);
      if (!content) continue;

      const exports = extractExports(content);
      if (exports.length === 0) continue;

      const relLibFile = path.relative(this.rootDir, libFile);

      for (const exp of exports) {
        let found = false;

        // Search for references to this export name in other files
        for (const [otherFile, otherContent] of allFileContents) {
          if (otherFile === libFile) continue;

          // Check if the export name is referenced (as property access or destructured import)
          if (otherContent.includes(exp.name)) {
            found = true;
            break;
          }
        }

        if (!found) {
          this.addIssue(
            'WARNING',
            relLibFile,
            exp.line,
            `exported but never imported: ${exp.name}`,
            'unused-export',
            'Remove the unused export or add a reference'
          );
        }
      }
    }
  }

  /**
   * Phase 3: Check agent/skill references to lib modules exist
   */
  scanAgentSkillRefs() {
    const agentsDir = path.join(this.rootDir, 'agents');
    const skillsDir = path.join(this.rootDir, 'skills');

    // Scan agent markdown files
    this.scanMdReferences(agentsDir, 'agents');

    // Scan skill markdown files
    if (fs.existsSync(skillsDir)) {
      try {
        const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true });
        for (const dir of skillDirs) {
          if (dir.isDirectory()) {
            const skillMd = path.join(skillsDir, dir.name, 'SKILL.md');
            if (fs.existsSync(skillMd)) {
              this.checkMdLibRefs(skillMd, `skills/${dir.name}/SKILL.md`);
            }
          }
        }
      } catch {
        // Skip if skills directory is not readable
      }
    }
  }

  /**
   * Scan markdown files in a directory for lib module references
   * @param {string} dir - Directory to scan
   * @param {string} relPrefix - Relative path prefix for reporting
   */
  scanMdReferences(dir, relPrefix) {
    if (!fs.existsSync(dir)) return;

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.md')) {
          const filePath = path.join(dir, entry.name);
          this.checkMdLibRefs(filePath, `${relPrefix}/${entry.name}`);
        }
      }
    } catch {
      // Skip unreadable directories
    }
  }

  /**
   * Check a markdown file for references to lib modules that don't exist
   * @param {string} filePath - Absolute path to the markdown file
   * @param {string} relPath - Relative path for reporting
   */
  checkMdLibRefs(filePath, relPath) {
    const lines = readFileLines(filePath);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Match lib/ module references like lib/core/index.js, lib/qa/test-runner.js
      const libRefRegex = /(?:lib\/[\w/-]+(?:\.js)?)/g;
      let match;
      while ((match = libRefRegex.exec(line)) !== null) {
        const libPath = match[0];
        const fullPath = path.resolve(this.rootDir, libPath);

        // Check if the referenced path exists (with or without .js)
        const exists =
          fs.existsSync(fullPath) ||
          fs.existsSync(fullPath + '.js') ||
          fs.existsSync(path.join(fullPath, 'index.js'));

        if (!exists) {
          // .md files often contain example/template code showing users how to
          // structure their projects. These are not actual bkit module references,
          // so we downgrade to INFO. Real import issues in .js files are caught
          // by Phase 1 (stale-require) which correctly uses CRITICAL.
          this.addIssue(
            'INFO',
            relPath,
            i + 1,
            `references non-existent module: ${libPath}`,
            'missing-lib-ref',
            'Verify this is not example/template code; update if it is a real reference'
          );
        }
      }
    }
  }
}

module.exports = DeadCodeScanner;
