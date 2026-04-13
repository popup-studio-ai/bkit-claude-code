/**
 * Config Audit Scanner — detect config/code inconsistencies
 * @module lib/qa/scanners/config-audit
 * @version 2.1.4
 */

const path = require('path');
const fs = require('fs');
const ScannerBase = require('../scanner-base');
const { getJsFiles } = require('../utils/file-resolver');
const { matchPattern } = require('../utils/pattern-matcher');

class ConfigAuditScanner extends ScannerBase {
  /**
   * @param {Object} [options]
   */
  constructor(options = {}) {
    super('config-audit', {
      ...options,
      include: options.include || ['lib/**/*.js', 'scripts/**/*.js', 'hooks/**/*.js', 'servers/**/*.js'],
      exclude: options.exclude || ['node_modules', 'tests', '*.test.js']
    });
  }

  /**
   * Run all config audit phases
   * @returns {Promise<import('../scanner-base').Issue[]>}
   */
  async scan() {
    this.reset();

    const config = this.loadConfig();
    if (!config) {
      this.addIssue(
        'CRITICAL',
        'bkit.config.json',
        0,
        'bkit.config.json not found or invalid JSON',
        'missing-config',
        'Create or fix bkit.config.json in project root'
      );
      return this.issues;
    }

    this.log('Phase 1: Checking config key references in code...');
    this.scanConfigKeyReferences(config);

    this.log('Phase 2: Detecting hardcoded values...');
    this.scanHardcodedValues(config);

    this.log('Phase 3: Verifying config-declared paths...');
    this.scanConfigPaths(config);

    return this.issues;
  }

  /**
   * Load and parse bkit.config.json
   * @returns {Object|null}
   */
  loadConfig() {
    const configPath = path.join(this.rootDir, 'bkit.config.json');
    try {
      const raw = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Phase 1: Check if config keys are referenced anywhere in code
   * @param {Object} config - Parsed config object
   */
  scanConfigKeyReferences(config) {
    const files = getJsFiles(this.include, this.exclude, this.rootDir);

    // Collect all content for searching
    const allContent = [];
    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        allContent.push(content);
      } catch {
        continue;
      }
    }

    const joined = allContent.join('\n');

    // Check top-level config keys
    const topKeys = Object.keys(config);
    for (const key of topKeys) {
      // Search for the key name in code (as string or property access)
      const patterns = [
        key,                          // Direct reference
        `'${key}'`,                   // String literal
        `"${key}"`,                   // String literal
        `.${key}`,                    // Property access
        `['${key}']`,                // Bracket notation
        `["${key}"]`                 // Bracket notation
      ];

      const found = patterns.some(p => joined.includes(p));
      if (!found) {
        this.addIssue(
          'WARNING',
          'bkit.config.json',
          0,
          `config key never referenced in code: ${key}`,
          'unused-config-key',
          `Remove unused key '${key}' or add code that reads it`
        );
      }
    }
  }

  /**
   * Phase 2: Detect hardcoded values that should use config
   * @param {Object} config - Parsed config object
   */
  scanHardcodedValues(config) {
    const files = getJsFiles(this.include, this.exclude, this.rootDir);

    const knownPatterns = [
      {
        config: 'version',
        regex: /['"]2\.\d+\.\d+['"]/g,
        desc: 'version string',
        configValue: config.version
      },
      {
        config: 'pdca.docPaths',
        regex: /PHASE_MAP|phase_map/gi,
        desc: 'document path mapping',
        configValue: null
      }
    ];

    for (const filePath of files) {
      let content;
      try {
        content = fs.readFileSync(filePath, 'utf-8');
      } catch {
        continue;
      }

      const relFile = path.relative(this.rootDir, filePath);

      for (const pattern of knownPatterns) {
        const matches = matchPattern(content, pattern.regex);

        for (const m of matches) {
          // Determine severity based on whether value matches config
          if (pattern.configValue && m.match.includes(pattern.configValue)) {
            this.addIssue(
              'INFO',
              relFile,
              m.line,
              `consider using config instead of literal: ${pattern.desc}`,
              'hardcoded-config',
              `Read ${pattern.config} from bkit.config.json`
            );
          } else {
            this.addIssue(
              'WARNING',
              relFile,
              m.line,
              `hardcoded value should use config: ${pattern.desc}`,
              'hardcoded-config',
              `Read ${pattern.config} from bkit.config.json configuration`
            );
          }
        }
      }
    }
  }

  /**
   * Phase 3: Verify config-declared paths exist on filesystem
   * @param {Object} config - Parsed config object
   */
  scanConfigPaths(config) {
    // Check pdca.docPaths directory patterns
    const docPaths = config.pdca && config.pdca.docPaths;
    if (!docPaths) return;

    // Extract unique directory prefixes from path patterns
    const dirs = new Set();

    for (const [phase, patterns] of Object.entries(docPaths)) {
      if (phase === 'archive') continue; // Archive path is template

      const pathList = Array.isArray(patterns) ? patterns : [patterns];
      for (const p of pathList) {
        // Extract the directory portion (before {feature} template)
        const dirPart = p.replace(/\{[^}]+\}.*$/, '').replace(/\/$/, '');
        if (dirPart) {
          dirs.add(dirPart);
        }
      }
    }

    for (const dir of dirs) {
      const fullPath = path.resolve(this.rootDir, dir);
      if (!fs.existsSync(fullPath)) {
        // Fallback path patterns (e.g., docs/plan/) that don't exist
        // are WARNING, not CRITICAL — primary paths are checked first
        const isPrimaryPath = /^docs\/\d{2}-/.test(dir);
        this.addIssue(
          isPrimaryPath ? 'CRITICAL' : 'WARNING',
          'bkit.config.json',
          0,
          `declared path does not exist: ${dir}`,
          'missing-config-path',
          `Create the directory: mkdir -p ${dir}`
        );
      }
    }
  }
}

module.exports = ConfigAuditScanner;
