#!/usr/bin/env node
/**
 * Convert Claude Code agents (.md) to Gemini CLI agents (.toml)
 * Maps tool names and removes unsupported frontmatter fields
 */

const fs = require('fs');
const path = require('path');

const AGENTS_DIR = '/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/agents';
const OUTPUT_DIR = '/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/agents/gemini';

// Tool name mapping: Claude Code -> Gemini CLI
const TOOL_MAPPING = {
  'Read': 'read_file',
  'Write': 'write_file',
  'Edit': 'replace',
  'Glob': 'glob',
  'Grep': 'grep',
  'Bash': 'run_shell_command',
  'LS': 'list_directory',
  'WebSearch': 'web_search',
  'WebFetch': 'web_fetch',
  'Task': 'spawn_agent',
  'TodoWrite': 'todo_write',
  'LSP': 'lsp',
  'NotebookEdit': 'notebook_edit'
};

// Model mapping: Claude -> Gemini
const MODEL_MAPPING = {
  'opus': 'gemini-2.5-pro',
  'sonnet': 'gemini-2.5-flash',
  'haiku': 'gemini-2.5-flash'
};

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const yamlStr = match[1];
  const body = match[2];

  // Simple YAML parser for our use case
  const frontmatter = {};
  let currentKey = null;
  let inMultiline = false;
  let multilineValue = [];

  yamlStr.split('\n').forEach(line => {
    if (inMultiline) {
      if (line.startsWith('  ') || line.trim() === '') {
        multilineValue.push(line.replace(/^  /, ''));
      } else {
        frontmatter[currentKey] = multilineValue.join('\n').trim();
        inMultiline = false;
        multilineValue = [];
      }
    }

    if (!inMultiline) {
      const keyMatch = line.match(/^(\w+):\s*(.*)$/);
      if (keyMatch) {
        currentKey = keyMatch[1];
        const value = keyMatch[2];

        if (value === '|') {
          inMultiline = true;
        } else if (value.startsWith('[') || value === '') {
          // Skip arrays for now, we'll handle tools separately
        } else {
          frontmatter[currentKey] = value;
        }
      } else if (line.startsWith('  - ') && currentKey) {
        // Array item
        if (!frontmatter[currentKey]) frontmatter[currentKey] = [];
        if (Array.isArray(frontmatter[currentKey])) {
          frontmatter[currentKey].push(line.replace('  - ', '').trim());
        }
      }
    }
  });

  if (inMultiline && currentKey) {
    frontmatter[currentKey] = multilineValue.join('\n').trim();
  }

  return { frontmatter, body };
}

function convertToToml(filename, frontmatter, body) {
  const name = frontmatter.name || filename.replace('.md', '');

  // Get description (first line of multiline description)
  let description = frontmatter.description || '';
  if (description.includes('\n')) {
    description = description.split('\n')[0].trim();
  }

  // Map tools to Gemini format
  let tools = frontmatter.tools || [];
  if (!Array.isArray(tools)) tools = [];
  const geminiTools = tools
    .map(t => TOOL_MAPPING[t] || t.toLowerCase())
    .filter(t => t); // Remove unmapped tools

  // Map model
  const model = MODEL_MAPPING[frontmatter.model] || 'gemini-2.5-flash';

  // Build TOML content
  let toml = `# bkit Agent: ${name}
# Platform: Gemini CLI
# Converted from: agents/${filename}

description = "${description.replace(/"/g, '\\"')}"

`;

  // Add tools if any
  if (geminiTools.length > 0) {
    toml += `# Tools (Gemini CLI format)\n`;
    toml += `# tools = [${geminiTools.map(t => `"${t}"`).join(', ')}]\n\n`;
  }

  // Add model hint
  toml += `# model = "${model}"\n\n`;

  // Add prompt (agent instructions)
  toml += `prompt = """\n${body.trim()}\n"""\n`;

  return toml;
}

// Main
console.log('=== Converting Claude Code Agents to Gemini TOML ===\n');

const agentFiles = fs.readdirSync(AGENTS_DIR)
  .filter(f => f.endsWith('.md') && !fs.statSync(path.join(AGENTS_DIR, f)).isDirectory());

console.log(`Found ${agentFiles.length} agent files\n`);

const results = { converted: 0, failed: 0, files: [] };

for (const file of agentFiles) {
  const inputPath = path.join(AGENTS_DIR, file);
  const outputFile = file.replace('.md', '.toml');
  const outputPath = path.join(OUTPUT_DIR, outputFile);

  try {
    const content = fs.readFileSync(inputPath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(content);
    const toml = convertToToml(file, frontmatter, body);

    fs.writeFileSync(outputPath, toml);
    results.converted++;
    results.files.push({ input: file, output: outputFile, status: 'OK' });
    console.log(`✅ ${file} → ${outputFile}`);
  } catch (e) {
    results.failed++;
    results.files.push({ input: file, output: outputFile, status: 'FAIL', error: e.message });
    console.log(`❌ ${file} - ${e.message}`);
  }
}

console.log('\n' + '='.repeat(50));
console.log(`Converted: ${results.converted}`);
console.log(`Failed: ${results.failed}`);
console.log('='.repeat(50));

// List created files
console.log('\nCreated files in agents/gemini/:');
fs.readdirSync(OUTPUT_DIR).forEach(f => console.log(`  - ${f}`));
