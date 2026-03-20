#!/usr/bin/env node
/**
 * Control Pipeline Integration Test
 * @module test/integration/control-pipeline
 * @version 2.0.0
 *
 * Verifies control subsystem chains:
 * - destructive-detector + blast-radius + scope-limiter
 * - checkpoint create -> list -> rollback
 * - trust-engine recordEvent -> shouldEscalate
 * - loop-breaker record -> check -> reset
 * 20 TC: CP-001 ~ CP-020
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

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

// Load control modules
const detector = require(path.join(PROJECT_ROOT, 'lib/control/destructive-detector'));
const blastRadius = require(path.join(PROJECT_ROOT, 'lib/control/blast-radius'));
const scopeLimiter = require(path.join(PROJECT_ROOT, 'lib/control/scope-limiter'));
const loopBreaker = require(path.join(PROJECT_ROOT, 'lib/control/loop-breaker'));

// ============================================================
// Section 1: detect + blast-radius + scope-limiter chain (CP-001~005)
// ============================================================

// CP-001: Destructive detect + blast-radius chain for rm -rf
const detection1 = detector.detect('Bash', 'rm -rf /tmp/test');
const files1 = ['/tmp/test/a.js', '/tmp/test/b.js'];
const blast1 = blastRadius.analyzeBlastRadius(files1);
assert('CP-001',
  detection1.detected === true && detection1.rules.some(r => r.id === 'G-001') && blast1.level === 'low',
  'detect catches rm -rf (G-001), blast-radius analyzes impact (low for 2 files)'
);

// CP-002: Destructive detect + scope-limiter chain
const scopeCheck2 = scopeLimiter.checkPathScope('.env.local', 2);
assert('CP-002',
  scopeCheck2.allowed === false && scopeCheck2.rule === 'DENIED_PATH',
  'scope-limiter denies .env.local at L2'
);

// CP-003: blast-radius detects dependency change
const blast3 = blastRadius.analyzeBlastRadius(['package.json', 'src/app.js']);
assert('CP-003',
  blast3.rules.some(r => r.id === 'B-004'),
  'blast-radius detects package.json as dependency change (B-004)'
);

// CP-004: blast-radius detects migration change
const blast4 = blastRadius.analyzeBlastRadius(['prisma/schema.prisma', 'src/app.js']);
assert('CP-004',
  blast4.level === 'critical' && blast4.rules.some(r => r.id === 'B-005'),
  'blast-radius detects prisma schema as migration (B-005, critical)'
);

// CP-005: scope-limiter allows src/ at L2 but denies at L0
const scope5a = scopeLimiter.checkPathScope('src/index.js', 2);
const scope5b = scopeLimiter.checkPathScope('src/index.js', 0);
assert('CP-005',
  scope5a.allowed === true && scope5b.allowed === false,
  'scope-limiter allows src/ at L2 but denies at L0'
);

// ============================================================
// Section 2: checkpoint create -> list -> rollback chain (CP-006~010)
// ============================================================

// Setup temp directory for checkpoint tests
const CP_TEST_DIR = path.join(os.tmpdir(), `bkit-cp-test-${process.pid}-${Date.now()}`);
fs.mkdirSync(path.join(CP_TEST_DIR, '.bkit', 'checkpoints'), { recursive: true });
fs.mkdirSync(path.join(CP_TEST_DIR, '.bkit', 'state'), { recursive: true });

const origCwd = process.cwd();
process.chdir(CP_TEST_DIR);

// Write a fake pdca-status for checkpoint
const fakeStatus = { version: 'v3.0', features: { 'cp-test': { phase: 'do', matchRate: 75 } } };
fs.writeFileSync(
  path.join(CP_TEST_DIR, '.bkit', 'state', 'pdca-status.json'),
  JSON.stringify(fakeStatus, null, 2)
);

const checkpoint = require(path.join(PROJECT_ROOT, 'lib/control/checkpoint-manager'));

// CP-006: createCheckpoint creates a checkpoint file
const cp6 = checkpoint.createCheckpoint('cp-test', 'do', 'manual', 'Test checkpoint');
assert('CP-006',
  cp6.id && cp6.path && fs.existsSync(cp6.path),
  'createCheckpoint creates a checkpoint file on disk'
);

// CP-007: listCheckpoints returns the created checkpoint
const list7 = checkpoint.listCheckpoints('cp-test');
assert('CP-007',
  list7.length >= 1 && list7[0].feature === 'cp-test',
  'listCheckpoints returns checkpoint for feature'
);

// CP-008: getCheckpoint returns full checkpoint data
const full8 = checkpoint.getCheckpoint(cp6.id);
assert('CP-008',
  full8 !== null && full8.pdcaStatus !== null && full8.pdcaStatusHash,
  'getCheckpoint returns full data with pdcaStatus and hash'
);

// CP-009: rollbackToCheckpoint restores pdca-status
// Modify pdca-status first
const modifiedStatus = { version: 'v3.0', features: { 'cp-test': { phase: 'check', matchRate: 50 } } };
fs.writeFileSync(
  path.join(CP_TEST_DIR, '.bkit', 'state', 'pdca-status.json'),
  JSON.stringify(modifiedStatus)
);
const rollResult9 = checkpoint.rollbackToCheckpoint(cp6.id);
assert('CP-009',
  rollResult9.restored === true,
  'rollbackToCheckpoint successfully restores pdca-status'
);

// CP-010: rollback restores original data
const restored10 = JSON.parse(fs.readFileSync(path.join(CP_TEST_DIR, '.bkit', 'state', 'pdca-status.json'), 'utf8'));
assert('CP-010',
  restored10.features['cp-test'].phase === 'do' && restored10.features['cp-test'].matchRate === 75,
  'Restored pdca-status matches original checkpoint data'
);

process.chdir(origCwd);

// ============================================================
// Section 3: trust-engine recordEvent -> shouldEscalate chain (CP-011~015)
// ============================================================

const trustEngine = require(path.join(PROJECT_ROOT, 'lib/control/trust-engine'));

// CP-011: createDefaultProfile returns valid profile
const profile11 = trustEngine.createDefaultProfile();
assert('CP-011',
  profile11.trustScore === 40 && profile11.currentLevel === 0 && profile11.components.pdcaCompletionRate,
  'createDefaultProfile returns profile with trustScore=40, level=0'
);

// CP-012: calculateScore returns weighted sum
profile11.components.pdcaCompletionRate.value = 100;
profile11.components.gatePassRate.value = 100;
const score12 = trustEngine.calculateScore(profile11);
assert('CP-012',
  score12 > 0 && score12 <= 100,
  'calculateScore returns positive weighted score'
);

// CP-013: shouldEscalate detects level upgrade opportunity
profile11.trustScore = 50;
profile11.currentLevel = 1;
profile11.lastUpgradeAt = null;
const esc13 = trustEngine.shouldEscalate(profile11);
assert('CP-013',
  esc13.escalate === true && esc13.toLevel === 2,
  'shouldEscalate detects upgrade from L1 to L2 at score 50'
);

// CP-014: shouldEscalate respects cooldown
profile11.lastUpgradeAt = new Date().toISOString();
const esc14 = trustEngine.shouldEscalate(profile11);
assert('CP-014',
  esc14.escalate === false,
  'shouldEscalate blocks upgrade during cooldown period'
);

// CP-015: shouldDowngrade detects score drop
const profile15 = trustEngine.createDefaultProfile();
profile15.trustScore = 10;
profile15.currentLevel = 2;
const down15 = trustEngine.shouldDowngrade(profile15, 30);
assert('CP-015',
  down15.downgrade === true && down15.toLevel < 2,
  'shouldDowngrade detects level downgrade on score drop of 20'
);

// ============================================================
// Section 4: loop-breaker record -> check -> reset chain (CP-016~020)
// ============================================================

// CP-016: Reset loop breaker state first
loopBreaker.reset('all');
const counters16 = loopBreaker.getCounters();
assert('CP-016',
  Object.keys(counters16.pdcaIterations).length === 0 && counters16.agentCallStack.length === 0,
  'reset(all) clears all loop breaker counters'
);

// CP-017: recordAction tracks PDCA iterations
loopBreaker.recordAction('pdca_iteration', 'feat-loop-1');
loopBreaker.recordAction('pdca_iteration', 'feat-loop-1');
loopBreaker.recordAction('pdca_iteration', 'feat-loop-1');
const check17 = loopBreaker.checkLoop();
assert('CP-017',
  check17.detected === true && check17.rule === 'LB-001' && check17.action === 'warn',
  'checkLoop detects PDCA iteration warning at count=3 (warnAt=3)'
);

// CP-018: More iterations trigger abort
loopBreaker.recordAction('pdca_iteration', 'feat-loop-1');
loopBreaker.recordAction('pdca_iteration', 'feat-loop-1');
const check18 = loopBreaker.checkLoop();
assert('CP-018',
  check18.detected === true && check18.rule === 'LB-001' && check18.action === 'abort',
  'checkLoop triggers abort at count=5 (maxCount=5)'
);

// CP-019: reset(feature) clears specific counter
loopBreaker.reset('feature', 'feat-loop-1');
const check19 = loopBreaker.checkLoop();
assert('CP-019',
  check19.detected === false,
  'reset(feature) clears specific PDCA iteration counter'
);

// CP-020: recordAction tracks file edits
loopBreaker.reset('all');
for (let i = 0; i < 7; i++) {
  loopBreaker.recordAction('file_edit', '/src/app.js');
}
const check20 = loopBreaker.checkLoop();
assert('CP-020',
  check20.detected === true && check20.rule === 'LB-002' && check20.action === 'warn',
  'checkLoop detects same-file edit loop at count=7 (LB-002, warnAt=7)'
);

// Reset state for other tests
loopBreaker.reset('all');

// ============================================================
// Cleanup
// ============================================================
try { fs.rmSync(CP_TEST_DIR, { recursive: true, force: true }); } catch (_) {}

// ============================================================
// Summary
// ============================================================
console.log('\n========================================');
console.log('Control Pipeline Integration Test Results');
console.log('========================================');
console.log(`Total: ${passed + failed} | PASS: ${passed} | FAIL: ${failed}`);
console.log(`Pass Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
console.log('----------------------------------------');
results.forEach(r => {
  console.log(`  ${r.status === 'PASS' ? '[PASS]' : '[FAIL]'} ${r.id}: ${r.description}`);
});
console.log('========================================\n');

module.exports = { passed, failed, total: passed + failed, results };
if (failed > 0) process.exit(1);
