/**
 * Shell Escape Scanner — detect $N substitution conflicts in SKILL.md shell blocks
 * @module lib/qa/scanners/shell-escape
 * @version 2.1.4
 */

const path = require('path');
const fs = require('fs');
const ScannerBase = require('../scanner-base');
const { extractShellBlocks } = require('../utils/pattern-matcher');

/** Commands where $1-$9 are commonly used (awk, sed, etc.) */
const SHELL_DOLLAR_COMMANDS = ['awk', 'sed', 'perl', 'cut', 'printf'];

class ShellEscapeScanner extends ScannerBase {
  /**
   * @param {Object} [options]
   */
  constructor(options = {}) {
    super('shell-escape', options);
  }

  /**
   * Run all shell escape detection phases
   * @returns {Promise<import('../scanner-base').Issue[]>}
   */
  async scan() {
    this.reset();

    const blocks = this.collectShellBlocks();

    this.log(`Found ${blocks.length} shell blocks across SKILL.md files`);

    for (const block of blocks) {
      this.log(`Phase 2: Checking $N conflicts in ${block.relPath}:${block.startLine}...`);
      this.scanDollarN(block);

      this.log(`Phase 3: Checking unescaped backticks in ${block.relPath}:${block.startLine}...`);
      this.scanBackticks(block);

      this.log(`Phase 4: Checking Windows compatibility in ${block.relPath}:${block.startLine}...`);
      this.scanWindowsCompat(block);

      this.log(`Phase 5: Checking heredoc $N in ${block.relPath}:${block.startLine}...`);
      this.scanHeredocDollarN(block);
    }

    return this.issues;
  }

  /**
   * Phase 1: Extract all shell blocks from SKILL.md files
   * @returns {Array<{code: string, startLine: number, relPath: string}>}
   */
  collectShellBlocks() {
    const skillsDir = path.join(this.rootDir, 'skills');
    const results = [];

    if (!fs.existsSync(skillsDir)) return results;

    try {
      const entries = fs.readdirSync(skillsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const skillMd = path.join(skillsDir, entry.name, 'SKILL.md');
        if (!fs.existsSync(skillMd)) continue;

        let content;
        try {
          content = fs.readFileSync(skillMd, 'utf-8');
        } catch {
          continue;
        }

        const blocks = extractShellBlocks(content);
        const relPath = `skills/${entry.name}/SKILL.md`;

        for (const block of blocks) {
          results.push({
            code: block.code,
            startLine: block.startLine,
            relPath
          });
        }
      }
    } catch {
      // Skip unreadable directory
    }

    return results;
  }

  /**
   * Phase 2: Detect bare $1-$9 patterns that conflict with CC skill engine substitution
   * @param {{code: string, startLine: number, relPath: string}} block
   */
  scanDollarN(block) {
    const lines = block.code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = block.startLine + i + 1; // +1 for the ```! line

      // Skip lines that are entirely within single quotes (safe from CC substitution)
      if (this.isEntireSingleQuoted(line)) continue;

      // Match $1-$9, ${1}-${9} outside of single quotes
      const dollarNRegex = /\$([1-9]|\{[1-9]\})/g;
      let match;

      while ((match = dollarNRegex.exec(line)) !== null) {
        // Check if this occurrence is inside single quotes
        if (this.isInsideSingleQuotes(line, match.index)) continue;

        // Check if it's in a command context like awk, sed
        const isShellCmd = SHELL_DOLLAR_COMMANDS.some(cmd => {
          const cmdIdx = line.indexOf(cmd);
          return cmdIdx >= 0 && cmdIdx < match.index;
        });

        if (isShellCmd) {
          this.addIssue(
            'CRITICAL',
            block.relPath,
            lineNum,
            `bare ${match[0]} in ${this.detectCommand(line)} command — CC skill engine will substitute`,
            'dollar-n-conflict',
            `Use ${this.detectCommand(line)} -v var=val pattern or escape as \\${match[0]}`
          );
        } else {
          this.addIssue(
            'WARNING',
            block.relPath,
            lineNum,
            `${match[0]} pattern may conflict with CC skill engine substitution`,
            'dollar-n-conflict',
            `Escape as \\${match[0]} if this is not a skill argument`
          );
        }
      }
    }
  }

  /**
   * Phase 3: Detect unescaped backticks
   * @param {{code: string, startLine: number, relPath: string}} block
   */
  scanBackticks(block) {
    const lines = block.code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = block.startLine + i + 1;

      // Match unescaped backticks (not preceded by backslash)
      const backtickRegex = /(?<!\\)`/g;
      let match;
      let count = 0;

      while ((match = backtickRegex.exec(line)) !== null) {
        count++;
      }

      // Backticks should come in pairs for command substitution
      // Any backtick usage should be flagged as $(command) is preferred
      if (count > 0) {
        this.addIssue(
          'WARNING',
          block.relPath,
          lineNum,
          'unescaped backtick — use $(command) instead',
          'unescaped-backtick',
          'Replace `command` with $(command) for better nesting support'
        );
      }
    }
  }

  /**
   * Phase 4: Detect Windows-incompatible patterns
   * @param {{code: string, startLine: number, relPath: string}} block
   */
  scanWindowsCompat(block) {
    const lines = block.code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = block.startLine + i + 1;

      // Detect parentheses in file paths
      // Match patterns like /path/(something)/ or path\(something)
      const parenPathRegex = /(?:\/|\\)[\w.-]*\([^)]+\)[\w.-]*/g;
      if (parenPathRegex.test(line)) {
        this.addIssue(
          'INFO',
          block.relPath,
          lineNum,
          'parentheses in path — Windows risk',
          'windows-path-compat',
          'Avoid parentheses in file paths for Windows compatibility'
        );
      }
    }
  }

  /**
   * Phase 5: Detect heredoc with unquoted delimiter containing $N
   * @param {{code: string, startLine: number, relPath: string}} block
   */
  scanHeredocDollarN(block) {
    const lines = block.code.split('\n');
    let inHeredoc = false;
    let heredocDelimiter = '';
    let heredocQuoted = false;
    let heredocStartLine = 0;
    let heredocBody = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = block.startLine + i + 1;

      if (!inHeredoc) {
        // Detect heredoc start: <<EOF, <<'EOF', <<"EOF", <<-EOF
        const heredocMatch = line.match(/<<-?\s*(['"]?)(\w+)\1/);
        if (heredocMatch) {
          inHeredoc = true;
          heredocQuoted = heredocMatch[1] !== '';
          heredocDelimiter = heredocMatch[2];
          heredocStartLine = lineNum;
          heredocBody = [];
        }
      } else {
        // Check for heredoc end
        if (line.trim() === heredocDelimiter) {
          // Heredoc ended — check body for $N if delimiter was unquoted
          if (!heredocQuoted) {
            const body = heredocBody.join('\n');
            if (/\$[1-9]/.test(body)) {
              this.addIssue(
                'WARNING',
                block.relPath,
                heredocStartLine,
                `heredoc with unquoted delimiter — $N will be expanded by shell`,
                'heredoc-dollar-n',
                `Quote the delimiter: <<'${heredocDelimiter}' to prevent expansion`
              );
            }
          }
          inHeredoc = false;
        } else {
          heredocBody.push(line);
        }
      }
    }
  }

  /**
   * Check if a position in a line is inside single quotes
   * @param {string} line - The line of code
   * @param {number} position - Character position to check
   * @returns {boolean}
   */
  isInsideSingleQuotes(line, position) {
    let inSingle = false;
    for (let i = 0; i < position && i < line.length; i++) {
      if (line[i] === "'" && (i === 0 || line[i - 1] !== '\\')) {
        inSingle = !inSingle;
      }
    }
    return inSingle;
  }

  /**
   * Check if an entire line is within single quotes
   * @param {string} line - The line of code
   * @returns {boolean}
   */
  isEntireSingleQuoted(line) {
    const trimmed = line.trim();
    return trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length > 2;
  }

  /**
   * Detect which shell command is being used on a line
   * @param {string} line - The line of code
   * @returns {string} Command name or 'shell'
   */
  detectCommand(line) {
    for (const cmd of SHELL_DOLLAR_COMMANDS) {
      if (line.includes(cmd)) return cmd;
    }
    return 'shell';
  }
}

module.exports = ShellEscapeScanner;
