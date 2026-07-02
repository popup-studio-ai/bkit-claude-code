#!/usr/bin/env node
/**
 * Module-to-Module Dependency Chain Integration Test
 * @module test/integration/module-chain
 * @version 2.0.0
 *
 * Verifies cross-module integration:
 * - pdca/phase → task/creator PDCA_PHASES pipeline
 * - coordinator → orchestrator team composition pipeline
 * - runner → reporter eval result pipeline
 * - ambiguity → trigger intent detection flow
 * - core/ → pdca/ dependency chain (v2.0.0)
 * - control/ → audit/ chain (v2.0.0)
 * - quality/ → gate-manager chain (v2.0.0)
 * 30 TC (v1.6.1) + 15 TC (v2.0.0)
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// ============================================================
// v2.1.26 (I-13, test isolation): all PROJECT_DIR-anchored writes
// (pdca-status.json via createPdcaTaskChain/autoCreatePdcaTask,
// regression-rules.json via regressionGuard.addRule, audit) must land in a
// throwaway tmp root — never in the repo's real .bkit. CLAUDE_PROJECT_DIR
// is captured by lib/core/platform at FIRST import, so this block must run
// BEFORE any lib/ module is required. bkit.config.json is copied into the
// tmp root so lib/core/config resolves the same values as the repo.
// ============================================================
const TMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-module-chain-'));
fs.copyFileSync(path.join(PROJECT_ROOT, 'bkit.config.json'), path.join(TMP_ROOT, 'bkit.config.json'));
process.env.CLAUDE_PROJECT_DIR = TMP_ROOT;
process.on('exit', () => {
  try { fs.rmSync(TMP_ROOT, { recursive: true, force: true }); } catch (_e) { /* best-effort */ }
});

let passed = 0;
let failed = 0;
const results = [];

function assert(id, condition, description) {
  if (condition) {
    passed++;
    results.push({ id, status: 'PASS', description });
  } else {
    failed++;
    results.push({ id, status: 'FAIL', description });
    console.assert(false, `${id}: ${description}`);
  }
}

// Load modules
const phase = require(path.join(PROJECT_ROOT, 'lib/pdca/phase'));
const creator = require(path.join(PROJECT_ROOT, 'lib/task/creator'));
const coordinator = require(path.join(PROJECT_ROOT, 'lib/team/coordinator'));
const orchestrator = require(path.join(PROJECT_ROOT, 'lib/team/orchestrator'));
const strategy = require(path.join(PROJECT_ROOT, 'lib/team/strategy'));
const ctoLogic = require(path.join(PROJECT_ROOT, 'lib/team/cto-logic'));
const runner = require(path.join(PROJECT_ROOT, 'evals/runner'));
const reporter = require(path.join(PROJECT_ROOT, 'evals/reporter'));
const ambiguity = require(path.join(PROJECT_ROOT, 'lib/intent/ambiguity'));
const trigger = require(path.join(PROJECT_ROOT, 'lib/intent/trigger'));
const language = require(path.join(PROJECT_ROOT, 'lib/intent/language'));

// ============================================================
// Section 1: pdca/phase → task/creator (TC 01-08)
// ============================================================

// TC-MC-01: PDCA_PHASES is consumed by createPdcaTaskChain
const chain = creator.createPdcaTaskChain('test-module-chain');
assert('TC-MC-01',
  chain.phases.length > 0 && chain.phases.includes('plan'),
  'createPdcaTaskChain produces phases including "plan"'
);

// TC-MC-02: Phase order in chain matches PDCA_PHASES order
const phaseOrder = Object.entries(phase.PDCA_PHASES)
  .filter(([k]) => !['pm', 'archived'].includes(k))
  .sort((a, b) => a[1].order - b[1].order)
  .map(([k]) => k);
assert('TC-MC-02',
  JSON.stringify(chain.phases) === JSON.stringify(phaseOrder),
  'Chain phase order matches PDCA_PHASES sort order'
);

// TC-MC-03: getPhaseNumber is used by getPdcaTaskMetadata
const metadata = creator.getPdcaTaskMetadata('plan', 'test-feature');
assert('TC-MC-03',
  metadata.pdcaOrder === phase.getPhaseNumber('plan'),
  'getPdcaTaskMetadata.pdcaOrder equals getPhaseNumber("plan")'
);

// TC-MC-04: Each chain task has correct phase metadata
assert('TC-MC-04',
  chain.tasks.design.metadata.pdcaPhase === 'design' &&
  chain.tasks.design.metadata.pdcaOrder === phase.getPhaseNumber('design'),
  'Chain task design has correct pdcaPhase and pdcaOrder'
);

// TC-MC-05: generatePdcaTaskSubject uses phase name
const subject = creator.generatePdcaTaskSubject('check', 'my-feature');
assert('TC-MC-05',
  subject.includes('Check') && subject.includes('my-feature'),
  'generatePdcaTaskSubject includes phase capitalized and feature name'
);

// TC-MC-06: getNextPdcaPhase chain consistency
const nextAfterPlan = phase.getNextPdcaPhase('plan');
const nextAfterDesign = phase.getNextPdcaPhase('design');
assert('TC-MC-06',
  nextAfterPlan === 'design' && nextAfterDesign === 'do',
  'getNextPdcaPhase: plan→design→do'
);

// TC-MC-07: getPreviousPdcaPhase reverse consistency
assert('TC-MC-07',
  phase.getPreviousPdcaPhase('design') === 'plan' &&
  phase.getPreviousPdcaPhase('do') === 'design',
  'getPreviousPdcaPhase: design→plan, do→design'
);

// TC-MC-08: autoCreatePdcaTask uses PDCA_PHASES-based metadata
const autoTask = creator.autoCreatePdcaTask('feat-x', 'check');
assert('TC-MC-08',
  autoTask.metadata.pdcaPhase === 'check' &&
  autoTask.metadata.pdcaOrder === phase.getPhaseNumber('check'),
  'autoCreatePdcaTask check task has correct phase metadata'
);

// ============================================================
// Section 2: coordinator → orchestrator pipeline (TC 09-16)
// ============================================================

// TC-MC-09: generateTeamStrategy returns strategy for Dynamic
const dynStrategy = coordinator.generateTeamStrategy('Dynamic', 'test');
assert('TC-MC-09',
  dynStrategy != null && dynStrategy.teammates === 3,
  'generateTeamStrategy(Dynamic) returns strategy with 3 teammates'
);

// TC-MC-10: generateTeamStrategy returns strategy even for Starter level
const starterStrategy = coordinator.generateTeamStrategy('Starter', 'test');
assert('TC-MC-10',
  starterStrategy != null && typeof starterStrategy === 'object',
  'generateTeamStrategy(Starter) returns strategy object'
);

// TC-MC-11: composeTeamForPhase uses strategy roles
const team = orchestrator.composeTeamForPhase('do', 'Dynamic', 'test-feat');
assert('TC-MC-11',
  team != null && team.teammates.length > 0,
  'composeTeamForPhase(do, Dynamic) returns team with teammates'
);

// TC-MC-12: composeTeamForPhase pattern matches selectOrchestrationPattern
assert('TC-MC-12',
  team.pattern === orchestrator.selectOrchestrationPattern('do', 'Dynamic'),
  'composeTeamForPhase pattern matches selectOrchestrationPattern result'
);

// TC-MC-13: generateSpawnTeamCommand produces valid command
// Note: this returns null if AGENT_TEAMS env not set
const origEnv = process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS;
process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = '1';
const spawnCmd = orchestrator.generateSpawnTeamCommand('do', 'Dynamic', 'test');
process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = origEnv || '';
assert('TC-MC-13',
  spawnCmd != null && spawnCmd.teammates.length > 0 && spawnCmd.operation === 'TeamCreate',
  'generateSpawnTeamCommand produces TeamCreate with teammates'
);

// TC-MC-14: createPhaseContext integrates orchestrator + coordinator
const ctx = orchestrator.createPhaseContext('check', 'feat-test', { level: 'Enterprise' });
assert('TC-MC-14',
  ctx.phase === 'check' && ctx.level === 'Enterprise' && ctx.pattern != null,
  'createPhaseContext returns phase, level, and pattern'
);

// TC-MC-15: shouldRecomposeTeam detects role changes between phases
const recompose = orchestrator.shouldRecomposeTeam('do', 'check', 'Enterprise');
assert('TC-MC-15',
  typeof recompose === 'boolean',
  'shouldRecomposeTeam returns boolean for phase transition'
);

// TC-MC-16: Enterprise composeTeamForPhase check phase includes qa
const entCheckTeam = orchestrator.composeTeamForPhase('check', 'Enterprise', 'ent-feat');
const hasQa = entCheckTeam.teammates.some(t => t.name === 'qa');
assert('TC-MC-16',
  entCheckTeam != null && hasQa,
  'Enterprise check phase team includes qa role'
);

// ============================================================
// Section 3: runner → reporter eval pipeline (TC 17-22)
// ============================================================

// TC-MC-17: runner.loadConfig returns valid config
const evalConfig = runner.loadConfig();
assert('TC-MC-17',
  evalConfig != null && evalConfig.skills != null,
  'runner.loadConfig() returns config with skills'
);

// TC-MC-18: runner.parseEvalYaml parses basic YAML
const sampleYaml = `name: test-skill
classification: capability
evals:
  - name: basic
    prompt: prompt-1.md
    expected: expected-1.md
    criteria:
      - Has clear scenario
      - Produces output`;
const parsed = runner.parseEvalYaml(sampleYaml);
assert('TC-MC-18',
  parsed.name === 'test-skill' && parsed.evals.length === 1 && parsed.evals[0].criteria.length === 2,
  'parseEvalYaml correctly parses name, evals, and criteria'
);

// TC-MC-19: runner.evaluateAgainstCriteria returns expected structure
const evalResult = runner.evaluateAgainstCriteria(
  'This is a test prompt with enough content to pass the length check and trigger keyword matching',
  'Expected output:\n\n1. Step one\n2. Step two\n3. Step three\n\n## Section\n\nMore content here for substantive result with pattern and format structure template.',
  ['Must produce output', 'Must follow process steps']
);
assert('TC-MC-19',
  evalResult.hasOwnProperty('pass') && evalResult.hasOwnProperty('score') &&
  evalResult.hasOwnProperty('matchedCriteria') && evalResult.hasOwnProperty('failedCriteria'),
  'evaluateAgainstCriteria returns pass, score, matchedCriteria, failedCriteria'
);

// TC-MC-20: reporter.formatMarkdownReport formats runner output
const mockBenchmark = {
  timestamp: '2026-03-08T00:00:00Z',
  version: '1.6.1',
  model: 'opus-4.6',
  summary: {
    workflow: { total: 10, passed: 9 },
    capability: { total: 16, passed: 14 },
    hybrid: { total: 2, passed: 2 }
  },
  details: {
    workflow: [{ skill: 'pdca', pass: true, details: {} }],
    capability: [{ skill: 'starter', pass: true, details: {} }],
    hybrid: [{ skill: 'plan-plus', pass: true, details: {} }]
  }
};
const mdReport = reporter.formatMarkdownReport(mockBenchmark);
assert('TC-MC-20',
  mdReport.includes('bkit Skill Evals Report') && mdReport.includes('Workflow'),
  'formatMarkdownReport produces valid markdown with section headers'
);

// TC-MC-21: reporter.formatDetailedReport includes score distribution
const detailedReport = reporter.formatDetailedReport(mockBenchmark);
assert('TC-MC-21',
  detailedReport.includes('Overall Summary') && detailedReport.includes('Category Breakdown'),
  'formatDetailedReport includes Overall Summary and Category Breakdown'
);

// TC-MC-22: reporter.formatJsonSummary returns compact object
const jsonSummary = reporter.formatJsonSummary(mockBenchmark);
assert('TC-MC-22',
  jsonSummary.total === 28 && jsonSummary.passed === 25 && jsonSummary.rate === 89,
  'formatJsonSummary calculates total=28, passed=25, rate=89%'
);

// ============================================================
// Section 4: ambiguity → trigger intent detection (TC 23-30)
// ============================================================

// TC-MC-23: containsFilePath feeds into calculateAmbiguityScore
const noPathResult = ambiguity.calculateAmbiguityScore('do something', {});
const withPathResult = ambiguity.calculateAmbiguityScore('fix ./src/auth.ts component', {});
assert('TC-MC-23',
  noPathResult.factors.includes('no_file_path') && !withPathResult.factors.includes('no_file_path'),
  'calculateAmbiguityScore detects file path presence via containsFilePath'
);

// TC-MC-24: containsTechnicalTerms integration
const noTechResult = ambiguity.calculateAmbiguityScore('make it better', {});
const withTechResult = ambiguity.calculateAmbiguityScore('fix the authentication middleware', {});
assert('TC-MC-24',
  noTechResult.factors.includes('no_technical_terms') && !withTechResult.factors.includes('no_technical_terms'),
  'calculateAmbiguityScore detects technical terms via containsTechnicalTerms'
);

// TC-MC-25: Trigger uses language patterns from language module
assert('TC-MC-25',
  language.AGENT_TRIGGER_PATTERNS != null && Object.keys(language.AGENT_TRIGGER_PATTERNS).length > 0,
  'AGENT_TRIGGER_PATTERNS is non-empty object'
);

// TC-MC-26: matchImplicitAgentTrigger uses matchMultiLangPattern
const helpTrigger = trigger.matchImplicitAgentTrigger('help me learn bkit');
assert('TC-MC-26',
  helpTrigger != null && helpTrigger.agent.startsWith('bkit:'),
  'matchImplicitAgentTrigger matches "help" to a bkit: agent'
);

// TC-MC-27: detectNewFeatureIntent uses matchMultiLangPattern for feature detection
const featureIntent = trigger.detectNewFeatureIntent('implement new feature called "user-auth"');
assert('TC-MC-27',
  featureIntent.isNewFeature === true && featureIntent.featureName === 'user-auth',
  'detectNewFeatureIntent detects feature and extracts name "user-auth"'
);

// TC-MC-28: extractFeatureNameFromRequest extracts from quoted string
const extracted = trigger.extractFeatureNameFromRequest('build feature "payment-system"');
assert('TC-MC-28',
  extracted === 'payment-system',
  'extractFeatureNameFromRequest extracts "payment-system" from quoted string'
);

// TC-MC-29: generateClarifyingQuestions uses factors from calculateAmbiguityScore
const ambFactors = ambiguity.calculateAmbiguityScore('fix stuff', {});
const questions = ambiguity.generateClarifyingQuestions('fix stuff', ambFactors.factors);
assert('TC-MC-29',
  Array.isArray(questions) && questions.length > 0,
  'generateClarifyingQuestions produces questions from ambiguity factors'
);

// TC-MC-30: CTO evaluateCheckResults integrates with PDCA threshold logic
const reportDecision = ctoLogic.evaluateCheckResults(95, 0, 85);
const iterateDecision = ctoLogic.evaluateCheckResults(80, 0, 70);
const redesignDecision = ctoLogic.evaluateCheckResults(60, 2, 40);
assert('TC-MC-30',
  reportDecision.decision === 'report' &&
  iterateDecision.decision === 'iterate' &&
  redesignDecision.decision === 'redesign',
  'evaluateCheckResults: 95/0→report, 80/0→iterate, 60/2→redesign'
);

// ============================================================
// Section 5: core/ → pdca/ dependency chain (MC-031~035)
// ============================================================

const corePaths = require(path.join(PROJECT_ROOT, 'lib/core/paths'));
const stateStore = require(path.join(PROJECT_ROOT, 'lib/core/state-store'));
const constants = require(path.join(PROJECT_ROOT, 'lib/core/constants'));
const stateMachine = require(path.join(PROJECT_ROOT, 'lib/pdca/state-machine'));

// MC-031: core/constants MATCH_RATE_THRESHOLD used by state-machine guard
const ctx31 = stateMachine.createContext('chain-test-1', {
  currentState: 'check',
  matchRate: constants.MATCH_RATE_THRESHOLD
});
const can31 = stateMachine.canTransition('check', 'MATCH_PASS', ctx31);
assert('MC-031',
  can31 === true,
  'MATCH_RATE_THRESHOLD from constants enables MATCH_PASS guard'
);

// MC-032: core/state-store provides atomic I/O used by pdca/status
assert('MC-032',
  typeof stateStore.read === 'function' && typeof stateStore.write === 'function' &&
  typeof stateStore.lockedUpdate === 'function',
  'stateStore provides read, write, lockedUpdate for pdca/status'
);

// MC-033: core/paths STATE_PATHS used by quality modules
assert('MC-033',
  typeof corePaths.STATE_PATHS.qualityMetrics === 'function' &&
  typeof corePaths.STATE_PATHS.qualityHistory === 'function',
  'STATE_PATHS provides quality metric paths used by quality modules'
);

// MC-034: state-machine TRANSITIONS uses core/config thresholds
const smCtx = stateMachine.createContext('chain-test-2');
assert('MC-034',
  smCtx.maxIterations > 0 && smCtx.automationLevel != null,
  'state-machine createContext reads maxIterations and automationLevel from core/config'
);

// MC-035: core/paths ensureBkitDirs callable from pdca init chain
assert('MC-035',
  typeof corePaths.ensureBkitDirs === 'function',
  'ensureBkitDirs is available for pdca initialization chain'
);

// ============================================================
// Section 6: control/ → audit/ chain (MC-036~040)
// ============================================================

const detector = require(path.join(PROJECT_ROOT, 'lib/control/destructive-detector'));
const blastRadius = require(path.join(PROJECT_ROOT, 'lib/control/blast-radius'));
const auditLogger = require(path.join(PROJECT_ROOT, 'lib/audit/audit-logger'));

// MC-036: detector detect result feeds into audit log entry
const detection36 = detector.detect('Bash', 'rm -rf /tmp/test');
assert('MC-036',
  detection36.detected === true && detection36.rules.length > 0,
  'detector.detect produces rules array suitable for audit logging'
);

// MC-037: blast-radius result maps to audit blastRadius field
const blast37 = blastRadius.analyzeBlastRadius(['prisma/schema.prisma'], {});
assert('MC-037',
  auditLogger.BLAST_RADII.includes(blast37.level),
  `blast-radius level "${blast37.level}" is valid audit BLAST_RADII value`
);

// MC-038: detector getBlockMessage produces audit-loggable text
const msg38 = detector.getBlockMessage(detection36.rules);
assert('MC-038',
  typeof msg38 === 'string' && msg38.length > 0,
  'getBlockMessage produces loggable text from detection rules'
);

// MC-039: audit ACTION_TYPES includes control-relevant types
assert('MC-039',
  auditLogger.ACTION_TYPES.includes('destructive_blocked') &&
  auditLogger.ACTION_TYPES.includes('rollback_executed'),
  'Audit ACTION_TYPES includes destructive_blocked and rollback_executed'
);

// MC-040: audit CATEGORIES includes control category
assert('MC-040',
  auditLogger.CATEGORIES.includes('control') && auditLogger.CATEGORIES.includes('pdca'),
  'Audit CATEGORIES includes control and pdca'
);

// ============================================================
// Section 7: quality/ → gate-manager chain (MC-041~045)
// ============================================================

const metricsCollector = require(path.join(PROJECT_ROOT, 'lib/quality/metrics-collector'));
const gateManager = require(path.join(PROJECT_ROOT, 'lib/quality/gate-manager'));
const regressionGuard = require(path.join(PROJECT_ROOT, 'lib/quality/regression-guard'));

// MC-041: metrics-collector METRIC_SPECS feeds gate-manager conditions
assert('MC-041',
  metricsCollector.METRIC_SPECS.M1 != null && metricsCollector.METRIC_SPECS.M1.name === 'Match Rate',
  'METRIC_SPECS.M1 (Match Rate) is defined for gate evaluation'
);

// MC-042: gate-manager checkGate uses metrics format from collector
const gateResult = gateManager.checkGate('check', {
  metrics: { matchRate: 100, codeQualityScore: 80, criticalIssueCount: 0, apiComplianceRate: 98 },
  projectLevel: 'Dynamic'
});
assert('MC-042',
  gateResult.verdict === 'pass' && gateResult.details.length > 0,
  'gate-manager checkGate works with standard metrics format'
);

// MC-043: regression-guard addRule + detectRegressions chain
const ruleId = regressionGuard.addRule({
  category: 'performance',
  description: 'Test rule for chain validation',
  severity: 'medium',
  detection: { type: 'metric', metricId: 'M3', op: '>', threshold: 0 },
  detectedInFeature: 'chain-test'
});
const regResult = regressionGuard.detectRegressions({ M3: 2 });
assert('MC-043',
  typeof ruleId === 'string' && regResult.detected === true,
  'addRule + detectRegressions chain detects metric violation'
);

// MC-044: gate-manager resolveAction integrates with automation levels
const action44a = gateManager.resolveAction('pass', 'guide', 'check');
const action44b = gateManager.resolveAction('pass', 'full', 'check');
assert('MC-044',
  action44a === 'notify' && action44b === 'auto_proceed',
  'resolveAction maps verdict+level to correct action (guide=notify, full=auto_proceed)'
);

// MC-045: metrics-collector analyzeTrend produces alarm-compatible output
const trend45 = metricsCollector.analyzeTrend('nonexistent-feature');
assert('MC-045',
  trend45 != null && typeof trend45.trend === 'string' && Array.isArray(trend45.alarms),
  'analyzeTrend returns trend string and alarms array'
);

// ============================================================
// Summary
// ============================================================
console.log('\n========================================');
console.log('Module Chain Integration Test Results');
console.log('========================================');
console.log(`Total: ${passed + failed} | PASS: ${passed} | FAIL: ${failed}`);
console.log(`Pass Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
console.log('----------------------------------------');
results.forEach(r => {
  console.log(`  ${r.status === 'PASS' ? '[PASS]' : '[FAIL]'} ${r.id}: ${r.description}`);
});
console.log('========================================\n');

if (failed > 0) process.exit(1);
