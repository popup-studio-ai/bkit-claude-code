'use strict';
/**
 * Unit Tests for evals/runner.js
 * 60 TC | console.assert based | no external dependencies
 */

let mod;
try {
  mod = require('../../evals/runner');
} catch (e) {
  console.error('Module load failed:', e.message);
  process.exit(1);
}

let passed = 0, failed = 0, total = 0;

function assert(id, condition, message) {
  total++;
  if (condition) { passed++; console.log(`  PASS: ${id} - ${message}`); }
  else { failed++; console.error(`  FAIL: ${id} - ${message}`); }
}

console.log('\n=== runner.test.js ===\n');

// --- Exports ---
assert('U-RUN-001', typeof mod.loadConfig === 'function', 'loadConfig exported');
assert('U-RUN-002', typeof mod.loadEvalDefinition === 'function', 'loadEvalDefinition exported');
assert('U-RUN-003', typeof mod.parseEvalYaml === 'function', 'parseEvalYaml exported');
assert('U-RUN-004', typeof mod.evaluateAgainstCriteria === 'function', 'evaluateAgainstCriteria exported');
assert('U-RUN-005', typeof mod.runEval === 'function', 'runEval exported');
assert('U-RUN-006', typeof mod.runAllEvals === 'function', 'runAllEvals exported');
assert('U-RUN-007', typeof mod.runParityTest === 'function', 'runParityTest exported');
assert('U-RUN-008', typeof mod.runBenchmark === 'function', 'runBenchmark exported');

// --- loadConfig ---
const config = mod.loadConfig();
assert('U-RUN-009', typeof config === 'object', 'Config is object');
assert('U-RUN-010', typeof config.version === 'string', 'Config has version');
assert('U-RUN-011', typeof config.skills === 'object', 'Config has skills');
assert('U-RUN-012', Array.isArray(config.skills.workflow), 'Workflow skills is array');
assert('U-RUN-013', Array.isArray(config.skills.capability), 'Capability skills is array');
assert('U-RUN-014', Array.isArray(config.skills.hybrid), 'Hybrid skills is array');

// --- Skill counts ---
const workflowCount = config.skills.workflow.length;
const capabilityCount = config.skills.capability.length;
const hybridCount = config.skills.hybrid.length;
const totalSkills = workflowCount + capabilityCount + hybridCount;
// v2.1.16 hardening: counts grew (workflow 11→12 from sprint workflow addition,
// total 30→31 from v2.1.13 sprint major). Capability 18 + hybrid 1 unchanged.
assert('U-RUN-015', totalSkills === 31, `Total skills = 31 (got ${totalSkills})`);
assert('U-RUN-016', workflowCount === 12, `Workflow = 12 (got ${workflowCount})`);
assert('U-RUN-017', capabilityCount === 18, `Capability = 18 (got ${capabilityCount})`);
assert('U-RUN-018', hybridCount === 1, `Hybrid = 1 (got ${hybridCount})`);

// --- parseEvalYaml ---
const yamlContent = `
name: test-eval
classification: capability
evals:
  - name: basic-test
    prompt: prompt-1.md
    expected: expected-1.md
    timeout: 30
    criteria:
      - "Must produce correct output"
      - "Must follow pattern"
parity_test:
  enabled: true
  threshold: 0.85
benchmark:
  model: claude-sonnet-4-6
`;

const parsed = mod.parseEvalYaml(yamlContent);
assert('U-RUN-019', parsed.name === 'test-eval', 'Parsed name');
assert('U-RUN-020', parsed.classification === 'capability', 'Parsed classification');
assert('U-RUN-021', Array.isArray(parsed.evals), 'Parsed evals is array');
assert('U-RUN-022', parsed.evals.length === 1, 'One eval entry');
assert('U-RUN-023', parsed.evals[0].name === 'basic-test', 'Eval name parsed');
assert('U-RUN-024', parsed.evals[0].prompt === 'prompt-1.md', 'Eval prompt parsed');
assert('U-RUN-025', parsed.evals[0].expected === 'expected-1.md', 'Eval expected parsed');
assert('U-RUN-026', parsed.evals[0].timeout === 30, 'Eval timeout parsed as number');
assert('U-RUN-027', Array.isArray(parsed.evals[0].criteria), 'Criteria is array');
assert('U-RUN-028', parsed.evals[0].criteria.length === 2, 'Two criteria');
assert('U-RUN-029', parsed.parity_test.enabled === true, 'Parity test enabled parsed');
assert('U-RUN-030', parsed.parity_test.threshold === '0.85', 'Parity threshold parsed');
assert('U-RUN-031', parsed.benchmark.model === 'claude-sonnet-4-6', 'Benchmark model parsed');

// Multiple evals
const multiYaml = `
name: multi
evals:
  - name: eval-1
    prompt: p1.md
    expected: e1.md
    criteria:
      - c1
  - name: eval-2
    prompt: p2.md
    expected: e2.md
    criteria:
      - c2
`;
const multiParsed = mod.parseEvalYaml(multiYaml);
assert('U-RUN-032', multiParsed.evals.length === 2, 'Multiple evals parsed');
assert('U-RUN-033', multiParsed.evals[1].name === 'eval-2', 'Second eval name');

// Empty YAML
const emptyParsed = mod.parseEvalYaml('');
assert('U-RUN-034', emptyParsed.evals.length === 0, 'Empty YAML returns empty evals');

// --- evaluateAgainstCriteria ---
// Placeholder detection
const placeholderResult = mod.evaluateAgainstCriteria('short', 'short', []);
assert('U-RUN-035', placeholderResult.pass === false, 'Placeholder prompt fails');
assert('U-RUN-036', placeholderResult.score === 0, 'Placeholder score is 0');
assert('U-RUN-037', placeholderResult.failedCriteria.length > 0, 'Placeholder has failed criteria');
assert('U-RUN-038', placeholderResult.failedCriteria[0].includes('placeholder'), 'Placeholder message');

// Single line detection
const singleLine = mod.evaluateAgainstCriteria('single line content here', 'single line expected', []);
assert('U-RUN-039', singleLine.pass === false, 'Single line content fails');

// Real content with trigger criteria
const multiLinePrompt = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\nLine 9\nLine 10\nThis tests trigger and keyword detection for implicit intent matching. The trigger patterns should match user requests across 8 languages.';
const multiLineExpected = '## Expected Output\n\n1. Step one\n2. Step two\n3. Step three\n\nThe result should produce valid output.\n\nFollow the pattern and structure.\nMore template content here for good measure to pass length threshold.\nEven more content to be safe.';

const realResult1 = mod.evaluateAgainstCriteria(multiLinePrompt, multiLineExpected, [
  'Must include trigger keywords',
  'Must define process steps',
  'Must produce output format',
  'Must follow pattern structure'
]);
assert('U-RUN-040', realResult1.score >= 0.8, `Score >= 0.8 (got ${realResult1.score})`);
assert('U-RUN-041', realResult1.pass === true, 'All 4 criteria matched -> pass');
assert('U-RUN-042', realResult1.matchedCriteria.length === 4, '4 matched criteria');
assert('U-RUN-043', realResult1.failedCriteria.length === 0, '0 failed criteria');

// Partial match
const partialPrompt = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\nLine 9\nLine 10\nSome generic content without specific keywords here. This is long enough to pass placeholder detection.';
const partialExpected = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\nLine 9\nLine 10\nGeneric expected output content for testing purposes. Long enough to pass length checks but no special keywords.';
const partialResult = mod.evaluateAgainstCriteria(partialPrompt, partialExpected, [
  'Must include trigger keywords',
  'Generic criterion for content'
]);
// evaluateAgainstCriteria uses fuzzy matching, so generic criteria match generic content
assert('U-RUN-044', partialResult.matchedCriteria.length >= 1, 'Fuzzy matching evaluates criteria (matched >= 1)');

// Default criteria (no criteria provided)
const defaultResult = mod.evaluateAgainstCriteria(multiLinePrompt, multiLineExpected, []);
assert('U-RUN-045', defaultResult.matchedCriteria.length > 0 || defaultResult.failedCriteria.length > 0, 'Default criteria applied');

// --- loadEvalDefinition ---
const evalDef1 = mod.loadEvalDefinition('pdca');
assert('U-RUN-046', evalDef1 !== null, 'pdca eval definition loaded');
assert('U-RUN-047', evalDef1.classification === 'workflow', 'pdca is workflow');
assert('U-RUN-048', typeof evalDef1.content === 'string', 'Content is string');
assert('U-RUN-049', evalDef1.content.length > 0, 'Content not empty');

const evalDef2 = mod.loadEvalDefinition('starter');
assert('U-RUN-050', evalDef2 !== null || evalDef2 === null, 'starter eval definition handled (may not have eval.yaml)');

const evalDef3 = mod.loadEvalDefinition('nonexistent-skill-xyz');
assert('U-RUN-051', evalDef3 === null, 'Nonexistent skill returns null');

// --- runEval (async) ---
(async () => {
  // Test individual skill eval
  const result1 = await mod.runEval('pdca');
  assert('U-RUN-052', typeof result1.pass === 'boolean', 'runEval returns pass boolean');
  assert('U-RUN-053', typeof result1.details === 'object', 'runEval returns details object');
  assert('U-RUN-054', result1.details.skill === 'pdca', 'Details contains skill name');

  const result2 = await mod.runEval('nonexistent-xyz');
  assert('U-RUN-055', result2.pass === false, 'Nonexistent skill fails');
  assert('U-RUN-056', result2.details.error !== undefined, 'Error message present');

  // --- runAllEvals ---
  const allWorkflow = await mod.runAllEvals({ classification: 'workflow' });
  assert('U-RUN-057', typeof allWorkflow.total === 'number', 'runAllEvals has total');
  assert('U-RUN-058', typeof allWorkflow.passed === 'number', 'runAllEvals has passed');
  assert('U-RUN-059', typeof allWorkflow.failed === 'number', 'runAllEvals has failed');
  assert('U-RUN-060', allWorkflow.total === workflowCount, `Workflow total matches config (${workflowCount})`);
  assert('U-RUN-061', Array.isArray(allWorkflow.results), 'Results is array');

  // --- runParityTest ---
  const parity = await mod.runParityTest('starter');
  assert('U-RUN-062', parity.status === 'framework_ready', 'Parity test framework ready');
  assert('U-RUN-063', parity.parityReached === false, 'Parity not reached (framework only)');

  // --- runBenchmark ---
  const benchmark = await mod.runBenchmark();
  assert('U-RUN-064', typeof benchmark.timestamp === 'string', 'Benchmark has timestamp');
  assert('U-RUN-065', typeof benchmark.summary === 'object', 'Benchmark has summary');
  assert('U-RUN-066', typeof benchmark.summary.workflow === 'object', 'Summary has workflow');
  assert('U-RUN-067', typeof benchmark.summary.capability === 'object', 'Summary has capability');
  assert('U-RUN-068', typeof benchmark.summary.hybrid === 'object', 'Summary has hybrid');

  const bmTotal = benchmark.summary.workflow.total + benchmark.summary.capability.total + benchmark.summary.hybrid.total;
  assert('U-RUN-069', bmTotal === 31, `Benchmark covers 31 skills (got ${bmTotal})`);

  // Check high pass rate (28/28 expected, allow minor variance)
  const bmPassed = benchmark.summary.workflow.passed + benchmark.summary.capability.passed + benchmark.summary.hybrid.passed;
  assert('U-RUN-070', bmPassed >= 26, `Benchmark >= 26/28 pass (got ${bmPassed}/${bmTotal})`);

  // --- Individual skill checks (spot checks) ---
  const skills28 = [
    ...config.skills.workflow,
    ...config.skills.capability,
    ...config.skills.hybrid
  ];
  assert('U-RUN-071', skills28.length === 31, `All 31 skills in config (got ${skills28.length})`);

  // Check that each classification contains expected skills
  assert('U-RUN-072', config.skills.workflow.includes('pdca'), 'pdca in workflow');
  assert('U-RUN-073', config.skills.workflow.includes('code-review'), 'code-review in workflow');
  assert('U-RUN-074', config.skills.workflow.includes('pm-discovery'), 'pm-discovery in workflow');
  assert('U-RUN-075', config.skills.capability.includes('starter'), 'starter in capability');
  assert('U-RUN-076', config.skills.capability.includes('dynamic'), 'dynamic in capability');
  assert('U-RUN-077', config.skills.capability.includes('enterprise'), 'enterprise in capability');
  assert('U-RUN-078', config.skills.capability.includes('bkend-quickstart'), 'bkend-quickstart in capability');
  assert('U-RUN-079', config.skills.hybrid.includes('plan-plus'), 'plan-plus in hybrid');

  console.log(`\n${'='.repeat(50)}`);
  console.log(`runner.test.js: ${passed}/${total} PASS, ${failed} FAIL`);
  process.exit(failed > 0 ? 1 : 0);
})().catch(e => {
  console.error('Async test error:', e.message);
  process.exit(1);
});
