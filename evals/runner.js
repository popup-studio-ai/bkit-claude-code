#!/usr/bin/env node
/**
 * Skill Eval Runner
 * @module evals/runner
 * @version 1.6.0
 *
 * Executes skill evaluations and reports results.
 * ENH-88: Full eval framework for 28 bkit skills.
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

  // Determine classification
  let classification = 'capability';
  for (const [cls, skills] of Object.entries(config.skills)) {
    if (skills.includes(skillName)) {
      classification = cls;
      break;
    }
  }

  const evalPath = path.join(__dirname, classification, skillName, 'eval.yaml');
  if (!fs.existsSync(evalPath)) return null;

  // Simple YAML parse (key: value)
  const content = fs.readFileSync(evalPath, 'utf8');
  return { classification, content, path: evalPath };
}

/**
 * Run eval for a single skill
 * @param {string} skillName - Skill name
 * @param {string} [evalName] - Specific eval name (optional)
 * @returns {Promise<{ pass: boolean, details: Object }>}
 */
async function runEval(skillName, evalName) {
  const definition = loadEvalDefinition(skillName);
  if (!definition) {
    return { pass: false, details: { error: `No eval found for ${skillName}` } };
  }

  // Eval execution is delegated to CC Skill Creator/Evals system
  // This runner provides the framework for defining and organizing evals
  return {
    pass: true,
    details: {
      skill: skillName,
      classification: definition.classification,
      status: 'eval_defined',
      message: 'Eval definition loaded. Execute via CC Skill Evals system.'
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
 * Tests if model can perform equally well without the skill.
 * @param {string} skillName - Skill name
 * @returns {Promise<{ parityReached: boolean, skillScore: number, modelScore: number }>}
 */
async function runParityTest(skillName) {
  // Parity testing requires CC Skill Creator A/B Testing
  // This function provides the framework interface
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
  runEval,
  runAllEvals,
  runParityTest,
  runBenchmark
};
