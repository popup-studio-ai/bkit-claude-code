#!/usr/bin/env node
/**
 * Convert Claude Code agents (.md) to Gemini CLI compatible agents (.md)
 * Removes unsupported frontmatter fields and maps tool names
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

// Fields NOT supported by Gemini CLI (will be removed)
const UNSUPPORTED_FIELDS = [
  'permissionMode',
  'skills',
  'hooks',
  'imports',
  'context',
  'mergeResult',
  'disallowedTools'
];

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: '', body: content };
  return { frontmatter: match[1], body: match[2] };
}

function convertFrontmatter(yamlStr) {
  const lines = yamlStr.split('\n');
  const newLines = [];
  let skipUntilNextKey = false;
  let inTools = false;
  let toolLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if this is a new key at root level
    const isRootKey = /^[a-zA-Z_]+:/.test(trimmed);

    if (isRootKey) {
      // Check if it's an unsupported field
      const key = trimmed.split(':')[0];
      if (UNSUPPORTED_FIELDS.includes(key)) {
        skipUntilNextKey = true;
        inTools = false;
        continue;
      }
      skipUntilNextKey = false;

      // Handle tools field
      if (key === 'tools') {
        inTools = true;
        toolLines = [line];
        continue;
      }

      // Handle model field - convert value
      if (key === 'model') {
        const modelValue = trimmed.split(':')[1].trim();
        const geminiModel = MODEL_MAPPING[modelValue] || modelValue;
        newLines.push(`model: ${geminiModel}`);
        continue;
      }

      inTools = false;
    }

    if (skipUntilNextKey) continue;

    if (inTools) {
      if (trimmed.startsWith('- ')) {
        const tool = trimmed.replace('- ', '').trim();
        const geminiTool = TOOL_MAPPING[tool];
        if (geminiTool) {
          toolLines.push(`  - ${geminiTool}`);
        }
      } else if (isRootKey) {
        // Tools section ended, output tools and process current line
        if (toolLines.length > 1) {
          newLines.push('tools:');
          toolLines.slice(1).forEach(tl => newLines.push(tl));
        }
        inTools = false;
        i--; // Reprocess this line
      }
      continue;
    }

    newLines.push(line);
  }

  // Handle case where tools is the last field
  if (inTools && toolLines.length > 1) {
    newLines.push('tools:');
    toolLines.slice(1).forEach(tl => newLines.push(tl));
  }

  return newLines.join('\n');
}

// Main
console.log('=== Converting to Gemini CLI Compatible .md ===\n');

const agentFiles = fs.readdirSync(AGENTS_DIR)
  .filter(f => f.endsWith('.md') && !fs.statSync(path.join(AGENTS_DIR, f)).isDirectory());

console.log(`Found ${agentFiles.length} agent files\n`);

const results = { converted: 0, failed: 0, files: [] };

for (const file of agentFiles) {
  const inputPath = path.join(AGENTS_DIR, file);
  const outputPath = path.join(OUTPUT_DIR, file);

  try {
    const content = fs.readFileSync(inputPath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(content);
    const newFrontmatter = convertFrontmatter(frontmatter);
    const newContent = `---\n${newFrontmatter}\n---\n${body}`;

    fs.writeFileSync(outputPath, newContent);
    results.converted++;
    results.files.push({ input: file, output: file, status: 'OK' });
    console.log(`✅ ${file} → agents/gemini/${file}`);
  } catch (e) {
    results.failed++;
    results.files.push({ input: file, output: file, status: 'FAIL', error: e.message });
    console.log(`❌ ${file} - ${e.message}`);
  }
}

console.log('\n' + '='.repeat(50));
console.log(`Converted: ${results.converted}`);
console.log(`Failed: ${results.failed}`);
console.log('='.repeat(50));

// List created files
console.log('\nCreated files in agents/gemini/:');
fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.md')).forEach(f => console.log(`  - ${f}`));
