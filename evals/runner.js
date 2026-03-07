#!/usr/bin/env node
/**
 * Skill Eval Runner
 * @module evals/runner
 * @version 1.6.1
 *
 * Executes skill evaluations and reports results.
 * v1.6.1: Real eval engine with YAML parser, criteria evaluation, placeholder detection.
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'config.json');

/**
 * Load eval configuration
 * @returns {Object} Config object
 */
function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

/**
 * Load eval definition for a skill
 * @param {string} skillName - Skill name
 * @returns {Object|null} Eval definition
 */
function loadEvalDefinition(skillName) {
  const config = loadConfig();

  let classification = 'capability';
  for (const [cls, skills] of Object.entries(config.skills)) {
    if (skills.includes(skillName)) {
      classification = cls;
      break;
    }
  }

  const evalPath = path.join(__dirname, classification, skillName, 'eval.yaml');
  if (!fs.existsSync(evalPath)) return null;

  const content = fs.readFileSync(evalPath, 'utf8');
  return { classification, content, path: evalPath };
}

/**
 * Parse eval YAML content (no external dependency)
 * @param {string} content - YAML content string
 * @returns {Object} Parsed eval definition
 */
function parseEvalYaml(content) {
  const result = { name: '', classification: '', evals: [], parity_test: {}, benchmark: {} };
  const lines = content.split('\n');
  let currentSection = null;
  let currentItem = null;
  let inCriteria = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Top-level key: value (no leading whitespace)
    if (!line.startsWith(' ') && !line.startsWith('\t')) {
      const topMatch = trimmed.match(/^([\w_]+)\s*:\s*(.*)$/);
      if (topMatch) {
        const [, key, value] = topMatch;
        if (value && !value.startsWith('{') && !value.startsWith('[')) {
          result[key] = value.replace(/^["']|["']$/g, '');
        }
        currentSection = key;
        if (key === 'evals') {
          currentItem = null;
          inCriteria = false;
        }
        continue;
      }
    }

    // Inside evals section
    if (currentSection === 'evals') {
      // Calculate indent level
      const indent = line.length - line.trimStart().length;

      // New list item at indent=2 (  - name: ...)
      if (indent <= 2 && trimmed.startsWith('- ')) {
        if (currentItem) result.evals.push(currentItem);
        currentItem = {};
        inCriteria = false;
        const kvMatch = trimmed.slice(2).match(/^([\w_]+)\s*:\s*(.+)$/);
        if (kvMatch) {
          currentItem[kvMatch[1]] = kvMatch[2].replace(/^["']|["']$/g, '');
        }
        continue;
      }

      if (currentItem) {
        // Criteria list items (indent >= 6, e.g. "      - ...")
        if (inCriteria && indent >= 4 && trimmed.startsWith('- ')) {
          currentItem.criteria.push(trimmed.slice(2).replace(/^["']|["']$/g, ''));
          continue;
        }

        // Key: value at indent=4 (    key: value)
        const kvMatch = trimmed.match(/^([\w_]+)\s*:\s*(.*)$/);
        if (kvMatch) {
          const key = kvMatch[1];
          const val = kvMatch[2].replace(/^["']|["']$/g, '');
          if (key === 'criteria') {
            currentItem.criteria = [];
            inCriteria = true;
          } else if (key === 'timeout') {
            currentItem[key] = parseInt(val, 10);
            inCriteria = false;
          } else {
            currentItem[key] = val;
            inCriteria = false;
          }
          continue;
        }

        // Bare criteria list items
        if (inCriteria && trimmed.startsWith('-')) {
          currentItem.criteria.push(trimmed.slice(1).trim().replace(/^["']|["']$/g, ''));
          continue;
        }
      }
    }

    // Nested key under parity_test or benchmark
    if (currentSection === 'parity_test' || currentSection === 'benchmark') {
      const kvMatch = trimmed.match(/^([\w_]+)\s*:\s*(.+)$/);
      if (kvMatch) {
        const val = kvMatch[2].replace(/^["']|["']$/g, '');
        if (!result[currentSection]) result[currentSection] = {};
        result[currentSection][kvMatch[1]] = val === 'true' ? true : val === 'false' ? false : val;
      }
    }
  }

  if (currentItem) result.evals.push(currentItem);
  return result;
}

/**
 * Evaluate prompt against expected output using criteria
 * @param {string} prompt - Eval prompt content
 * @param {string} expected - Expected output content
 * @param {string[]} criteria - Evaluation criteria
 * @returns {{ pass: boolean, matchedCriteria: string[], failedCriteria: string[], score: number }}
 */
function evaluateAgainstCriteria(prompt, expected, criteria) {
  const isPromptPlaceholder = prompt.split('\n').length <= 1 || prompt.length < 50;
  const isExpectedPlaceholder = expected.split('\n').length <= 1 || expected.length < 50;

  if (isPromptPlaceholder || isExpectedPlaceholder) {
    return {
      pass: false,
      matchedCriteria: [],
      failedCriteria: ['Content is placeholder (< 50 chars or single line)'],
      score: 0
    };
  }

  const matchedCriteria = [];
  const failedCriteria = [];

  const effectiveCriteria = criteria.length > 0 ? criteria : [
    'Prompt must contain clear evaluation scenario',
    'Expected output must define pass/fail criteria'
  ];

  for (const criterion of effectiveCriteria) {
    const criterionLower = criterion.toLowerCase();

    if (criterionLower.includes('trigger') || criterionLower.includes('keyword')) {
      const hasTriggerContent = prompt.toLowerCase().includes('trigger') ||
                                 prompt.toLowerCase().includes('keyword') ||
                                 prompt.toLowerCase().includes('intent');
      if (hasTriggerContent) {
        matchedCriteria.push(criterion);
      } else {
        failedCriteria.push(criterion);
      }
    } else if (criterionLower.includes('process') || criterionLower.includes('step')) {
      const hasSteps = expected.includes('1.') || expected.includes('Step') ||
                       expected.includes('##');
      if (hasSteps) {
        matchedCriteria.push(criterion);
      } else {
        failedCriteria.push(criterion);
      }
    } else if (criterionLower.includes('output') || criterionLower.includes('produce')) {
      const hasOutput = expected.includes('Expected') || expected.includes('Output') ||
                        expected.includes('Result') || expected.includes('```');
      if (hasOutput) {
        matchedCriteria.push(criterion);
      } else {
        failedCriteria.push(criterion);
      }
    } else if (criterionLower.includes('pattern') || criterionLower.includes('follow')) {
      const hasPattern = expected.includes('pattern') || expected.includes('format') ||
                         expected.includes('structure') || expected.includes('template');
      if (hasPattern) {
        matchedCriteria.push(criterion);
      } else {
        failedCriteria.push(criterion);
      }
    } else {
      // Generic: check if expected has substantive content
      if (expected.length >= 100 && expected.split('\n').length >= 5) {
        matchedCriteria.push(criterion);
      } else {
        failedCriteria.push(criterion);
      }
    }
  }

  const score = effectiveCriteria.length > 0
    ? matchedCriteria.length / effectiveCriteria.length
    : 0;

  return {
    pass: failedCriteria.length === 0 && score >= 0.8,
    matchedCriteria,
    failedCriteria,
    score
  };
}

/**
 * Run eval for a single skill (real implementation)
 * @param {string} skillName - Skill name
 * @param {string} [evalName] - Specific eval name (optional)
 * @returns {Promise<{ pass: boolean, details: Object }>}
 */
async function runEval(skillName, evalName) {
  const definition = loadEvalDefinition(skillName);
  if (!definition) {
    return { pass: false, details: { error: `No eval found for ${skillName}` } };
  }

  // 1. Parse YAML
  const evalDef = parseEvalYaml(definition.content);
  if (!evalDef.evals || evalDef.evals.length === 0) {
    return { pass: false, details: { error: `No eval entries in ${skillName}/eval.yaml` } };
  }

  // 2. Select eval (by name or first)
  const evalEntry = evalName
    ? evalDef.evals.find(e => e.name === evalName)
    : evalDef.evals[0];

  if (!evalEntry) {
    return { pass: false, details: { error: `Eval "${evalName}" not found in ${skillName}` } };
  }

  // 3. Load prompt and expected files
  const evalDir = path.dirname(definition.path);
  const promptFile = evalEntry.prompt || 'prompt-1.md';
  const expectedFile = evalEntry.expected || 'expected-1.md';

  const promptPath = path.join(evalDir, promptFile);
  const expectedPath = path.join(evalDir, expectedFile);

  let prompt, expected;
  try {
    prompt = fs.readFileSync(promptPath, 'utf8');
  } catch (e) {
    return { pass: false, details: { error: `Prompt file not found: ${promptFile}` } };
  }
  try {
    expected = fs.readFileSync(expectedPath, 'utf8');
  } catch (e) {
    return { pass: false, details: { error: `Expected file not found: ${expectedFile}` } };
  }

  // 4. Extract criteria
  const criteria = evalEntry.criteria || [];

  // 5. Evaluate
  const result = evaluateAgainstCriteria(prompt, expected, criteria);

  return {
    pass: result.pass,
    details: {
      skill: skillName,
      classification: definition.classification,
      evalName: evalEntry.name,
      score: result.score,
      matchedCriteria: result.matchedCriteria,
      failedCriteria: result.failedCriteria,
      promptLength: prompt.length,
      expectedLength: expected.length
    }
  };
}

/**
 * Run all evals matching filter
 * @param {Object} [filter] - Filter options
 * @param {string} [filter.classification] - 'workflow' | 'capability' | 'hybrid'
 * @returns {Promise<{ total: number, passed: number, failed: number, results: Array }>}
 */
async function runAllEvals(filter = {}) {
  const config = loadConfig();
  const results = [];

  const classifications = filter.classification
    ? [filter.classification]
    : Object.keys(config.skills);

  for (const cls of classifications) {
    const skills = config.skills[cls] || [];
    for (const skill of skills) {
      const result = await runEval(skill);
      results.push({ skill, classification: cls, ...result });
    }
  }

  return {
    total: results.length,
    passed: results.filter(r => r.pass).length,
    failed: results.filter(r => !r.pass).length,
    results
  };
}

/**
 * Run parity test for a capability skill
 * @param {string} skillName - Skill name
 * @returns {Promise<{ parityReached: boolean, skillScore: number, modelScore: number }>}
 */
async function runParityTest(skillName) {
  return {
    parityReached: false,
    skillScore: 0,
    modelScore: 0,
    status: 'framework_ready',
    message: 'Parity test framework ready. Execute via CC Skill Creator A/B Testing.'
  };
}

/**
 * Run full benchmark across all skills
 * @returns {Promise<Object>} Benchmark results
 */
async function runBenchmark() {
  const config = loadConfig();
  const timestamp = new Date().toISOString();

  const workflowResults = await runAllEvals({ classification: 'workflow' });
  const capabilityResults = await runAllEvals({ classification: 'capability' });
  const hybridResults = await runAllEvals({ classification: 'hybrid' });

  return {
    timestamp,
    version: config.version,
    model: config.benchmarkModel,
    summary: {
      workflow: { total: workflowResults.total, passed: workflowResults.passed },
      capability: { total: capabilityResults.total, passed: capabilityResults.passed },
      hybrid: { total: hybridResults.total, passed: hybridResults.passed }
    },
    details: {
      workflow: workflowResults.results,
      capability: capabilityResults.results,
      hybrid: hybridResults.results
    }
  };
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const flags = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      flags[args[i].slice(2)] = args[i + 1] || true;
      i++;
    }
  }

  (async () => {
    try {
      if (flags.benchmark) {
        const result = await runBenchmark();
        console.log(JSON.stringify(result, null, 2));
      } else if (flags.skill) {
        const result = await runEval(flags.skill, flags.eval);
        console.log(JSON.stringify(result, null, 2));
      } else if (flags.classification) {
        const result = await runAllEvals({ classification: flags.classification });
        console.log(JSON.stringify(result, null, 2));
      } else if (flags.parity) {
        const result = await runParityTest(flags.parity);
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log('Usage: node runner.js --skill <name> | --classification <type> | --benchmark | --parity <name>');
      }
    } catch (e) {
      console.error('Eval error:', e.message);
      process.exit(1);
    }
  })();
}

module.exports = {
  loadConfig,
  loadEvalDefinition,
  parseEvalYaml,
  evaluateAgainstCriteria,
  runEval,
  runAllEvals,
  runParityTest,
  runBenchmark
};
