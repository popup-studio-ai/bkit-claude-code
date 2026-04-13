/**
 * Completeness Scanner — detect gaps between skill/agent declarations and implementations
 * @module lib/qa/scanners/completeness
 * @version 2.1.4
 */

const path = require('path');
const fs = require('fs');
const ScannerBase = require('../scanner-base');
const { extractFrontmatter } = require('../utils/pattern-matcher');

/** CC v2.1.104 tools list (32 tools) */
const CC_TOOLS = [
  'Read', 'Write', 'Edit', 'MultiEdit', 'Bash', 'Glob', 'Grep',
  'Skill', 'ToolSearch', 'Agent', 'TodoRead', 'TodoWrite',
  'WebFetch', 'WebSearch', 'NotebookEdit',
  'ScheduleWakeup', 'Monitor',
  'EnterWorktree', 'ExitWorktree',
  'mcp__*'  // MCP tools are prefixed
];

/** Known CC tool names set (excluding mcp__ wildcard) */
const CC_TOOL_NAMES = new Set(CC_TOOLS.filter(t => !t.includes('*')));

class CompletenessScanner extends ScannerBase {
  /**
   * @param {Object} [options]
   */
  constructor(options = {}) {
    super('completeness', options);
  }

  /**
   * Run all completeness check phases
   * @returns {Promise<import('../scanner-base').Issue[]>}
   */
  async scan() {
    this.reset();

    this.log('Phase 1: Checking skill -> agent references...');
    this.scanSkillAgentRefs();

    this.log('Phase 2: Validating skill tools...');
    this.scanSkillTools();

    this.log('Phase 3: Checking frontmatter consistency...');
    this.scanFrontmatterConsistency();

    this.log('Phase 4: Checking agent frontmatter references...');
    this.scanAgentFrontmatter();

    return this.issues;
  }

  /**
   * Get all SKILL.md files
   * @returns {Array<{path: string, relPath: string, content: string}>}
   */
  getSkillFiles() {
    const skillsDir = path.join(this.rootDir, 'skills');
    const results = [];

    if (!fs.existsSync(skillsDir)) return results;

    try {
      const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const skillMd = path.join(skillsDir, entry.name, 'SKILL.md');
        if (fs.existsSync(skillMd)) {
          try {
            const content = fs.readFileSync(skillMd, 'utf-8');
            results.push({
              path: skillMd,
              relPath: `skills/${entry.name}/SKILL.md`,
              content
            });
          } catch {
            continue;
          }
        }
      }
    } catch {
      // Skip unreadable directory
    }

    return results;
  }

  /**
   * Get all agent markdown files
   * @returns {Set<string>} Set of agent names (without .md extension)
   */
  getAgentNames() {
    const agentsDir = path.join(this.rootDir, 'agents');
    const names = new Set();

    if (!fs.existsSync(agentsDir)) return names;

    try {
      const entries = fs.readdirSync(agentsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.md')) {
          names.add(entry.name.replace('.md', ''));
        }
      }
    } catch {
      // Skip unreadable directory
    }

    return names;
  }

  /**
   * Phase 1: Check skills referencing non-existent agents
   */
  scanSkillAgentRefs() {
    const skillFiles = this.getSkillFiles();
    const agentNames = this.getAgentNames();

    for (const skill of skillFiles) {
      const fm = extractFrontmatter(skill.content);

      // Check agentTeam references
      const agents = fm.agentTeam || fm.agents || [];
      const agentList = Array.isArray(agents) ? agents : [agents];

      for (const agent of agentList) {
        if (!agent || typeof agent !== 'string') continue;
        const agentName = agent.trim();
        if (agentName && !agentNames.has(agentName)) {
          this.addIssue(
            'CRITICAL',
            skill.relPath,
            0,
            `references non-existent agent: ${agentName}`,
            'missing-agent-ref',
            `Create agents/${agentName}.md or fix the reference`
          );
        }
      }
    }
  }

  /**
   * Phase 2: Validate skill tools against CC tools list
   */
  scanSkillTools() {
    const skillFiles = this.getSkillFiles();

    for (const skill of skillFiles) {
      const fm = extractFrontmatter(skill.content);
      const tools = fm.tools || [];
      const toolList = Array.isArray(tools) ? tools : [tools];

      for (const tool of toolList) {
        if (!tool || typeof tool !== 'string') continue;
        const toolName = tool.trim();

        // Skip MCP tools (they start with mcp__)
        if (toolName.startsWith('mcp__')) continue;

        if (!CC_TOOL_NAMES.has(toolName)) {
          this.addIssue(
            'WARNING',
            skill.relPath,
            0,
            `references unknown tool: ${toolName}`,
            'unknown-tool',
            `Check CC v2.1.104 tool list — tool may be renamed or removed`
          );
        }
      }
    }
  }

  /**
   * Phase 3: Check frontmatter consistency across skills
   */
  scanFrontmatterConsistency() {
    const skillFiles = this.getSkillFiles();

    for (const skill of skillFiles) {
      const fm = extractFrontmatter(skill.content);

      // Check for missing description
      if (!fm.description) {
        this.addIssue(
          'CRITICAL',
          skill.relPath,
          1,
          'missing required description frontmatter',
          'missing-description',
          'Add a description field to the SKILL.md frontmatter'
        );
      } else if (typeof fm.description === 'string' && fm.description.length > 250) {
        this.addIssue(
          'WARNING',
          skill.relPath,
          1,
          `description exceeds 250 char limit (${fm.description.length} chars, CC v2.1.86)`,
          'description-too-long',
          'Shorten description to 250 characters or less'
        );
      }

      // Check for missing effort
      if (!fm.effort) {
        this.addIssue(
          'INFO',
          skill.relPath,
          1,
          'missing effort frontmatter (ENH-134)',
          'missing-effort',
          'Add effort: high|medium|low to frontmatter'
        );
      }
    }
  }

  /**
   * Phase 4: Check agent frontmatter references exist
   */
  scanAgentFrontmatter() {
    const agentsDir = path.join(this.rootDir, 'agents');
    if (!fs.existsSync(agentsDir)) return;

    try {
      const entries = fs.readdirSync(agentsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.md')) continue;

        const filePath = path.join(agentsDir, entry.name);
        const relPath = `agents/${entry.name}`;

        let content;
        try {
          content = fs.readFileSync(filePath, 'utf-8');
        } catch {
          continue;
        }

        const fm = extractFrontmatter(content);

        // Check if agent references other agents that don't exist
        const agentRefs = fm.agents || fm.team || [];
        const refList = Array.isArray(agentRefs) ? agentRefs : [agentRefs];

        for (const ref of refList) {
          if (!ref || typeof ref !== 'string') continue;
          const refName = ref.trim();
          const refPath = path.join(agentsDir, `${refName}.md`);
          if (refName && !fs.existsSync(refPath)) {
            this.addIssue(
              'WARNING',
              relPath,
              0,
              `agent frontmatter references non-existent agent: ${refName}`,
              'missing-agent-ref',
              `Create agents/${refName}.md or fix the reference`
            );
          }
        }
      }
    } catch {
      // Skip unreadable directory
    }
  }
}

module.exports = CompletenessScanner;
