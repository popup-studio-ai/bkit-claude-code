/**
 * Scanner Base Class — abstract base for all quality scanners
 * @module lib/qa/scanner-base
 * @version 2.1.4
 */

/**
 * @typedef {Object} Issue
 * @property {string} file - Relative file path from project root
 * @property {number} line - Line number (1-based, 0 if unknown)
 * @property {'CRITICAL'|'WARNING'|'INFO'} severity
 * @property {string} message - Human-readable description
 * @property {string} pattern - Pattern identifier for grouping/filtering
 * @property {string|null} fix - Suggested fix or null
 */

/**
 * Base class for all quality scanners
 * @abstract
 */
class ScannerBase {
  /**
   * @param {string} name - Scanner identifier (e.g., 'dead-code')
   * @param {Object} options
   * @param {string} [options.rootDir] - Project root directory (default: process.cwd())
   * @param {string[]} [options.include] - Glob patterns to include
   * @param {string[]} [options.exclude] - Glob patterns to exclude
   * @param {boolean} [options.verbose] - Enable verbose logging (default: false)
   */
  constructor(name, options = {}) {
    this.name = name;
    this.rootDir = options.rootDir || process.cwd();
    this.include = options.include || [];
    this.exclude = options.exclude || ['node_modules/**', '*.test.js'];
    this.verbose = options.verbose || false;
    this.issues = [];
  }

  /**
   * Run the scanner — must be implemented by subclasses
   * @abstract
   * @returns {Promise<Issue[]>}
   */
  async scan() {
    throw new Error(`${this.name}: scan() must be implemented`);
  }

  /**
   * Add an issue to the results
   * @param {'CRITICAL'|'WARNING'|'INFO'} severity
   * @param {string} file - Relative file path
   * @param {number} line - Line number (0 if unknown)
   * @param {string} message - Human-readable description
   * @param {string} pattern - Issue pattern identifier
   * @param {string} [fix] - Suggested fix
   */
  addIssue(severity, file, line, message, pattern, fix) {
    this.issues.push({
      file,
      line,
      severity,
      message,
      pattern,
      fix: fix || null
    });
  }

  /**
   * Get summary counts by severity
   * @returns {{ critical: number, warning: number, info: number, total: number }}
   */
  getSummary() {
    return {
      critical: this.issues.filter(i => i.severity === 'CRITICAL').length,
      warning: this.issues.filter(i => i.severity === 'WARNING').length,
      info: this.issues.filter(i => i.severity === 'INFO').length,
      total: this.issues.length
    };
  }

  /**
   * Format a report of all issues
   * @param {'console'|'json'|'markdown'} format
   * @returns {string}
   */
  formatReport(format = 'console') {
    const reporter = require('./reporter');
    return reporter.formatScannerReport(this.name, this.issues, format);
  }

  /**
   * Reset issues for re-scan
   */
  reset() {
    this.issues = [];
  }

  /**
   * Log a verbose message (only when verbose mode is enabled)
   * @param {string} msg - Message to log
   */
  log(msg) {
    if (this.verbose) {
      console.log(`[${this.name}] ${msg}`);
    }
  }
}

module.exports = ScannerBase;
