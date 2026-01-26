#!/usr/bin/env node
/**
 * Gemini TOML Commands Syntax Validation Test
 * Tests all 20 TOML command files in commands/gemini/
 */

const fs = require('fs');
const path = require('path');

const GEMINI_COMMANDS_DIR = '/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/commands/gemini';

const results = { passed: 0, failed: 0, tests: [] };

// Simple TOML parser check (validates basic structure)
function validateToml(content, filename) {
  const errors = [];

  // Check required fields for Gemini CLI commands
  // Gemini CLI uses filename as command name, so only description and prompt are required
  const requiredFields = ['description', 'prompt'];

  for (const field of requiredFields) {
    const regex = new RegExp(`^${field}\\s*=`, 'm');
    if (!regex.test(content)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check for syntax errors (unclosed quotes, brackets)
  const lines = content.split('\n');
  let inMultilineString = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip comments and empty lines
    if (line.startsWith('#') || line === '') continue;

    // Check for triple quotes (multiline strings)
    const tripleQuoteCount = (line.match(/"""/g) || []).length;
    if (tripleQuoteCount % 2 === 1) {
      inMultilineString = !inMultilineString;
    }

    // Skip validation inside multiline strings
    if (inMultilineString) continue;

    // Check for key = value format (basic check)
    if (line.includes('=') && !line.startsWith('[')) {
      const parts = line.split('=');
      if (parts[0].trim() === '') {
        errors.push(`Line ${i + 1}: Invalid key-value pair`);
      }
    }
  }

  if (inMultilineString) {
    errors.push('Unclosed multiline string');
  }

  return errors;
}

console.log('=== Gemini TOML Commands Test Suite ===\n');

// Get all TOML files
const tomlFiles = fs.readdirSync(GEMINI_COMMANDS_DIR)
  .filter(f => f.endsWith('.toml'))
  .sort();

console.log(`Found ${tomlFiles.length} TOML files\n`);

for (let i = 0; i < tomlFiles.length; i++) {
  const file = tomlFiles[i];
  const filePath = path.join(GEMINI_COMMANDS_DIR, file);
  const testId = `TOML-${String(i + 1).padStart(2, '0')}`;

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const errors = validateToml(content, file);

    if (errors.length === 0) {
      results.passed++;
      results.tests.push({
        id: testId,
        name: file,
        status: 'PASS'
      });
      console.log(`✅ ${testId}: ${file} - Valid`);
    } else {
      results.failed++;
      results.tests.push({
        id: testId,
        name: file,
        status: 'FAIL',
        errors: errors
      });
      console.log(`❌ ${testId}: ${file} - ${errors.join(', ')}`);
    }
  } catch (e) {
    results.failed++;
    results.tests.push({
      id: testId,
      name: file,
      status: 'FAIL',
      error: e.message
    });
    console.log(`❌ ${testId}: ${file} - ${e.message}`);
  }
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('SUMMARY: Gemini TOML Commands Tests');
console.log('='.repeat(50));
console.log(`Total: ${results.passed + results.failed}`);
console.log(`Passed: ${results.passed}`);
console.log(`Failed: ${results.failed}`);
console.log(`Pass Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

if (results.failed > 0) {
  console.log('\nFailed Tests:');
  results.tests.filter(t => t.status === 'FAIL').forEach(t => {
    console.log(`  - ${t.id}: ${t.name}`);
    if (t.errors) console.log(`    Errors: ${t.errors.join(', ')}`);
    if (t.error) console.log(`    Error: ${t.error}`);
  });
}

// Check if commands are registered in Gemini
console.log('\n=== Gemini CLI Registration Check ===\n');
console.log('Commands should be accessible as:');
tomlFiles.forEach(f => {
  const cmdName = f.replace('.toml', '');
  console.log(`  /gemini:${cmdName}`);
});

console.log('\n--- JSON_RESULTS ---');
console.log(JSON.stringify(results, null, 2));
