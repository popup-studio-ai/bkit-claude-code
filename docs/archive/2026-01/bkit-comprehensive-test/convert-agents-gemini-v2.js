#!/usr/bin/env node
/**
 * Convert Claude Code agents to Gemini CLI compatible agents v2
 * Better YAML parsing to handle nested structures
 */

const fs = require('fs');
const path = require('path');

const AGENTS_DIR = '/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/agents';
const OUTPUT_DIR = '/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/agents/gemini';

// Tool name mapping
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
  'LSP': 'lsp'
};

// Model mapping
const MODEL_MAPPING = {
  'opus': 'gemini-2.5-pro',
  'sonnet': 'gemini-2.5-flash',
  'haiku': 'gemini-2.5-flash'
};

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { yaml: '', body: content };
  return { yaml: match[1], body: match[2] };
}

function extractFields(yaml) {
  const result = {
    name: '',
    description: '',
    model: 'gemini-2.5-flash',
    tools: []
  };

  // Extract name
  const nameMatch = yaml.match(/^name:\s*(.+)$/m);
  if (nameMatch) result.name = nameMatch[1].trim();

  // Extract description (multiline)
  const descMatch = yaml.match(/^description:\s*\|?\n([\s\S]*?)(?=^[a-z]+:|$)/m);
  if (descMatch) {
    result.description = descMatch[1]
      .split('\n')
      .map(line => line.replace(/^  /, ''))
      .join('\n')
      .trim();
  }

  // Extract model
  const modelMatch = yaml.match(/^model:\s*(.+)$/m);
  if (modelMatch) {
    const claudeModel = modelMatch[1].trim();
    result.model = MODEL_MAPPING[claudeModel] || 'gemini-2.5-flash';
  }

  // Extract tools
  const toolsMatch = yaml.match(/^tools:\n((?:  - .+\n?)+)/m);
  if (toolsMatch) {
    const toolLines = toolsMatch[1].match(/  - (.+)/g) || [];
    result.tools = toolLines
      .map(line => {
        const tool = line.replace('  - ', '').trim();
        return TOOL_MAPPING[tool] || null;
      })
      .filter(t => t !== null);
  }

  return result;
}

function buildGeminiYaml(fields) {
  let yaml = `name: ${fields.name}\n`;
  yaml += `description: |\n`;
  yaml += fields.description.split('\n').map(line => `  ${line}`).join('\n') + '\n';
  yaml += `model: ${fields.model}\n`;

  if (fields.tools.length > 0) {
    yaml += `tools:\n`;
    fields.tools.forEach(tool => {
      yaml += `  - ${tool}\n`;
    });
  }

  return yaml.trim();
}

// Main
console.log('=== Converting to Gemini CLI Compatible .md (v2) ===\n');

// Clear old .md files in output dir
fs.readdirSync(OUTPUT_DIR)
  .filter(f => f.endsWith('.md'))
  .forEach(f => fs.unlinkSync(path.join(OUTPUT_DIR, f)));

const agentFiles = fs.readdirSync(AGENTS_DIR)
  .filter(f => f.endsWith('.md') && !fs.statSync(path.join(AGENTS_DIR, f)).isDirectory());

console.log(`Found ${agentFiles.length} agent files\n`);

let converted = 0;
let failed = 0;

for (const file of agentFiles) {
  const inputPath = path.join(AGENTS_DIR, file);
  const outputPath = path.join(OUTPUT_DIR, file);

  try {
    const content = fs.readFileSync(inputPath, 'utf8');
    const { yaml, body } = parseFrontmatter(content);
    const fields = extractFields(yaml);
    const newYaml = buildGeminiYaml(fields);
    const newContent = `---\n${newYaml}\n---\n${body}`;

    fs.writeFileSync(outputPath, newContent);
    converted++;
    console.log(`✅ ${file}`);
    console.log(`   tools: [${fields.tools.join(', ')}]`);
  } catch (e) {
    failed++;
    console.log(`❌ ${file} - ${e.message}`);
  }
}

console.log('\n' + '='.repeat(50));
console.log(`Converted: ${converted}`);
console.log(`Failed: ${failed}`);
console.log('='.repeat(50));
