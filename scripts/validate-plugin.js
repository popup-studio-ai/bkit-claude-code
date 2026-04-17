#!/usr/bin/env node
/**
 * validate-plugin.js - Validate plugin structure and Claude Code compatibility
 *
 * Purpose: Validate plugin structure, YAML frontmatter, and Claude Code compatibility (v2.1.x)
 * Usage: node validate-plugin.js [--verbose]
 *
 * Converted from: scripts/validate-plugin.sh
 */

const fs = require('fs');
const path = require('path');

const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');

// ============================================================
// Configuration
// ============================================================
// v2.1.8 fix B18 (QR11 runtime catch): plugin.json lives at .claude-plugin/plugin.json per CC plugin spec
const REQUIRED_FILES = [
  '.claude-plugin/plugin.json',
  'README.md'
];

const REQUIRED_DIRS = [
  'skills',
  'agents',
  'commands'
];

const VERBOSE = process.argv.includes('--verbose');

// ============================================================
// Statistics
// ============================================================
let stats = {
  skills: { total: 0, valid: 0, invalid: 0 },
  agents: { total: 0, valid: 0, invalid: 0 },
  commands: { total: 0, valid: 0, invalid: 0 },
  hooks: { total: 0, valid: 0, invalid: 0 },
  errors: [],
  warnings: []
};

// ============================================================
// Helper Functions
// ============================================================

function log(message) {
  if (VERBOSE) console.log(message);
}

function error(message) {
  stats.errors.push(message);
  console.error(`ERROR: ${message}`);
}

function warn(message) {
  stats.warnings.push(message);
  if (VERBOSE) console.warn(`WARN: ${message}`);
}

/**
 * Parse YAML frontmatter from markdown file
 * @param {string} content - File content
 * @returns {Object|null} Parsed frontmatter or null
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml = match[1];
  const result = {};

  // Simple YAML parsing (key: value pairs)
  const lines = yaml.split('\n');
  let currentKey = null;
  let currentValue = '';
  let inMultiline = false;

  for (const line of lines) {
    // Check for key: value
    const keyMatch = line.match(/^(\w+):\s*(.*)$/);
    if (keyMatch && !inMultiline) {
      if (currentKey) {
        result[currentKey] = currentValue.trim();
      }
      currentKey = keyMatch[1];
      const value = keyMatch[2];

      if (value === '|' || value === '>') {
        inMultiline = true;
        currentValue = '';
      } else {
        currentValue = value;
        inMultiline = false;
      }
    } else if (inMultiline && line.startsWith('  ')) {
      currentValue += line.slice(2) + '\n';
    } else if (inMultiline && line.trim() === '') {
      currentValue += '\n';
    } else if (keyMatch) {
      if (currentKey) {
        result[currentKey] = currentValue.trim();
      }
      currentKey = keyMatch[1];
      currentValue = keyMatch[2];
      inMultiline = false;
    }
  }

  if (currentKey) {
    result[currentKey] = currentValue.trim();
  }

  return result;
}

/**
 * Validate a skill file
 * @param {string} filePath - Path to SKILL.md
 * @returns {boolean} True if valid
 */
function validateSkill(filePath) {
  stats.skills.total++;

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatter = parseFrontmatter(content);

    if (!frontmatter) {
      error(`Skill missing frontmatter: ${filePath}`);
      stats.skills.invalid++;
      return false;
    }

    if (!frontmatter.name) {
      error(`Skill missing 'name' in frontmatter: ${filePath}`);
      stats.skills.invalid++;
      return false;
    }

    if (!frontmatter.description) {
      warn(`Skill missing 'description': ${filePath}`);
    }

    // Check for hooks section
    if (content.includes('hooks:')) {
      validateHooksInContent(content, filePath);
    }

    log(`Valid skill: ${frontmatter.name}`);
    stats.skills.valid++;
    return true;
  } catch (e) {
    error(`Failed to read skill: ${filePath} - ${e.message}`);
    stats.skills.invalid++;
    return false;
  }
}

/**
 * Validate an agent file
 * @param {string} filePath - Path to agent .md file
 * @returns {boolean} True if valid
 */
function validateAgent(filePath) {
  stats.agents.total++;

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatter = parseFrontmatter(content);

    if (!frontmatter) {
      error(`Agent missing frontmatter: ${filePath}`);
      stats.agents.invalid++;
      return false;
    }

    if (!frontmatter.name) {
      error(`Agent missing 'name' in frontmatter: ${filePath}`);
      stats.agents.invalid++;
      return false;
    }

    log(`Valid agent: ${frontmatter.name}`);
    stats.agents.valid++;
    return true;
  } catch (e) {
    error(`Failed to read agent: ${filePath} - ${e.message}`);
    stats.agents.invalid++;
    return false;
  }
}

/**
 * Validate a command file
 * @param {string} filePath - Path to command .md file
 * @returns {boolean} True if valid
 */
function validateCommand(filePath) {
  stats.commands.total++;

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatter = parseFrontmatter(content);

    // Commands may or may not have frontmatter
    if (frontmatter && frontmatter.name) {
      log(`Valid command: ${frontmatter.name}`);
    } else {
      const basename = path.basename(filePath, '.md');
      log(`Valid command (no frontmatter): ${basename}`);
    }

    stats.commands.valid++;
    return true;
  } catch (e) {
    error(`Failed to read command: ${filePath} - ${e.message}`);
    stats.commands.invalid++;
    return false;
  }
}

/**
 * Validate hooks referenced in content
 * @param {string} content - File content
 * @param {string} sourceFile - Source file for error reporting
 */
function validateHooksInContent(content, sourceFile) {
  // Find all script references
  const scriptRefs = content.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/scripts\/([^\s"']+)/g);

  for (const match of scriptRefs) {
    stats.hooks.total++;
    const scriptName = match[1];
    const scriptPath = path.join(PLUGIN_ROOT, 'scripts', scriptName);

    // Check for both .sh and .js versions
    const jsPath = scriptPath.replace(/\.sh$/, '.js');

    if (fs.existsSync(scriptPath) || fs.existsSync(jsPath)) {
      stats.hooks.valid++;
      log(`Valid hook reference: ${scriptName}`);
    } else {
      stats.hooks.invalid++;
      error(`Missing hook script: ${scriptName} (referenced in ${sourceFile})`);
    }
  }
}

/**
 * Validate plugin.json
 * @returns {boolean} True if valid
 */
function validatePluginJson() {
  // v2.1.8 fix B18: correct path is .claude-plugin/plugin.json per CC plugin spec
  const pluginPath = path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json');

  try {
    const content = fs.readFileSync(pluginPath, 'utf8');
    const plugin = JSON.parse(content);

    if (!plugin.name) {
      error('plugin.json missing "name" field');
      return false;
    }

    if (!plugin.version) {
      error('plugin.json missing "version" field');
      return false;
    }

    log(`Plugin: ${plugin.name} v${plugin.version}`);
    return true;
  } catch (e) {
    error(`Invalid plugin.json: ${e.message}`);
    return false;
  }
}

/**
 * Scan directory for files matching pattern
 * @param {string} dir - Directory path
 * @param {string} pattern - File extension pattern (e.g., '.md')
 * @returns {string[]} Array of file paths
 */
function scanDir(dir, pattern) {
  const results = [];

  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // For skills, look for SKILL.md in subdirectories
      const skillPath = path.join(fullPath, 'SKILL.md');
      if (fs.existsSync(skillPath)) {
        results.push(skillPath);
      }
    } else if (entry.isFile() && entry.name.endsWith(pattern)) {
      results.push(fullPath);
    }
  }

  return results;
}

// ============================================================
// Main Validation
// ============================================================

function main() {
  console.log('='.repeat(60));
  console.log('bkit Plugin Validation');
  console.log('='.repeat(60));

  // Check required files
  console.log('\n[1] Checking required files...');
  for (const file of REQUIRED_FILES) {
    const filePath = path.join(PLUGIN_ROOT, file);
    if (fs.existsSync(filePath)) {
      log(`  OK: ${file}`);
    } else {
      error(`Missing required file: ${file}`);
    }
  }

  // Check required directories
  console.log('\n[2] Checking required directories...');
  for (const dir of REQUIRED_DIRS) {
    const dirPath = path.join(PLUGIN_ROOT, dir);
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      log(`  OK: ${dir}/`);
    } else {
      error(`Missing required directory: ${dir}/`);
    }
  }

  // Validate plugin.json
  console.log('\n[3] Validating plugin.json...');
  validatePluginJson();

  // Validate skills
  console.log('\n[4] Validating skills...');
  const skillsDir = path.join(PLUGIN_ROOT, 'skills');
  const skillFiles = scanDir(skillsDir, 'SKILL.md');
  for (const file of skillFiles) {
    validateSkill(file);
  }

  // Validate agents
  console.log('\n[5] Validating agents...');
  const agentsDir = path.join(PLUGIN_ROOT, 'agents');
  const agentFiles = scanDir(agentsDir, '.md');
  for (const file of agentFiles) {
    validateAgent(file);
  }

  // Validate commands
  console.log('\n[6] Validating commands...');
  const commandsDir = path.join(PLUGIN_ROOT, 'commands');
  const commandFiles = scanDir(commandsDir, '.md');
  for (const file of commandFiles) {
    validateCommand(file);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Validation Summary');
  console.log('='.repeat(60));
  console.log(`Skills:   ${stats.skills.valid}/${stats.skills.total} valid`);
  console.log(`Agents:   ${stats.agents.valid}/${stats.agents.total} valid`);
  console.log(`Commands: ${stats.commands.valid}/${stats.commands.total} valid`);
  console.log(`Hooks:    ${stats.hooks.valid}/${stats.hooks.total} valid`);
  console.log(`Errors:   ${stats.errors.length}`);
  console.log(`Warnings: ${stats.warnings.length}`);

  // Output result as JSON for programmatic use
  const result = {
    valid: stats.errors.length === 0,
    stats: stats
  };

  if (process.env.OUTPUT_JSON) {
    console.log(JSON.stringify(result, null, 2));
  }

  process.exit(stats.errors.length === 0 ? 0 : 1);
}

main();
