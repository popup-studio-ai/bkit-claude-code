'use strict';
/**
 * Unit Tests for lib/control/trust-engine.js
 * 25 TC | console.assert based | no external dependencies
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Set up tmp dir as working directory before requiring module
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-trust-test-'));
const origCwd = process.cwd();
process.chdir(tmpDir);
fs.mkdirSync(path.join(tmpDir, '.bkit', 'state'), { recursive: true });

let mod;
try {
  mod = require('../../lib/control/trust-engine');
} catch (e) {
  console.error('Module load failed:', e.message);
  process.chdir(origCwd);
  process.exit(1);
}

let passed = 0, failed = 0, total = 0, skipped = 0;
const failures = [];

function assert(id, condition, message) {
  total++;
  if (condition) { passed++; console.log(`  PASS: ${id} - ${message}`); }
  else { failed++; failures.push({ id, message }); console.error(`  FAIL: ${id} - ${message}`); }
}

// Helper: reset trust profile to clean state
function resetProfile() {
  const profilePath = path.join(tmpDir, '.bkit', 'state', 'trust-profile.json');
  if (fs.existsSync(profilePath)) fs.unlinkSync(profilePath);
}

console.log('\n=== trust-engine.test.js ===\n');

// --- TE-001~005: Initial TrustProfile creation ---

resetProfile();
const defaultProfile = mod.createDefaultProfile();
assert('TE-001', defaultProfile.trustScore === 40, 'Default trust score is 40 (component weighted sum)');
assert('TE-002', defaultProfile.currentLevel === 0, 'Default level is 0 (L0)');
assert('TE-003', typeof defaultProfile.components === 'object', 'Profile has components object');
assert('TE-004', typeof defaultProfile.stats === 'object', 'Profile has stats object');
assert('TE-005', Array.isArray(defaultProfile.levelHistory), 'Profile has levelHistory array');

// --- TE-006~010: recordEvent increases score ---

resetProfile();
// Set up a profile with some base score to test increases
const baseProfile = mod.createDefaultProfile();
baseProfile.trustScore = 50;
baseProfile.currentLevel = 2;
baseProfile.components.pdcaCompletionRate.value = 80;
baseProfile.components.gatePassRate.value = 80;
baseProfile.components.iterationEfficiency.value = 60;
mod.saveTrustProfile(baseProfile);

const ev1 = mod.recordEvent('consecutive_10_success');
assert('TE-006', ev1.scoreChange === 5, 'consecutive_10_success gives +5 score change');
assert('TE-007', typeof ev1.newScore === 'number', 'recordEvent returns newScore');

resetProfile();
const bp2 = mod.createDefaultProfile();
bp2.trustScore = 50;
bp2.currentLevel = 2;
bp2.stats.totalGateChecks = 5;
bp2.stats.passedGateChecks = 4;
mod.saveTrustProfile(bp2);

const ev2 = mod.recordEvent('match_rate_95');
assert('TE-008', ev2.scoreChange === 3, 'match_rate_95 gives +3 score change');

resetProfile();
const bp3 = mod.createDefaultProfile();
bp3.trustScore = 40;
bp3.currentLevel = 1;
mod.saveTrustProfile(bp3);

const ev3 = mod.recordEvent('gate_pass');
assert('TE-009', typeof ev3.newScore === 'number', 'gate_pass event records successfully');

const ev4 = mod.recordEvent('pdca_complete');
assert('TE-010', typeof ev4.newScore === 'number', 'pdca_complete event records successfully');

// --- TE-011~015: recordEvent decreases score ---

resetProfile();
const bp4 = mod.createDefaultProfile();
bp4.trustScore = 60;
bp4.currentLevel = 2;
mod.saveTrustProfile(bp4);

const ev5 = mod.recordEvent('emergency_stop');
assert('TE-011', ev5.scoreChange === -15, 'emergency_stop gives -15 score change');
assert('TE-012', ev5.newScore < 60, 'Score decreased after emergency_stop');

resetProfile();
const bp5 = mod.createDefaultProfile();
bp5.trustScore = 50;
bp5.currentLevel = 2;
mod.saveTrustProfile(bp5);

const ev6 = mod.recordEvent('rollback');
assert('TE-013', ev6.scoreChange === -10, 'rollback gives -10 score change');

const ev7 = mod.recordEvent('guardrail_trigger');
assert('TE-014', ev7.scoreChange === -10, 'guardrail_trigger gives -10 score change');

resetProfile();
const bp6 = mod.createDefaultProfile();
bp6.trustScore = 30;
bp6.currentLevel = 1;
mod.saveTrustProfile(bp6);

const ev8 = mod.recordEvent('user_interrupt');
assert('TE-015', ev8.scoreChange === -5, 'user_interrupt gives -5 score change');

// --- TE-016~018: shouldEscalate at thresholds ---

const p16 = mod.createDefaultProfile();
p16.trustScore = 19;
p16.currentLevel = 0;
assert('TE-016', mod.shouldEscalate(p16).escalate === false, 'No escalation at score 19 (threshold 20 for L1)');

const p17 = mod.createDefaultProfile();
p17.trustScore = 25;
p17.currentLevel = 0;
assert('TE-017', mod.shouldEscalate(p17).escalate === true && mod.shouldEscalate(p17).toLevel === 1,
  'Escalate to L1 at score 25');

const p18 = mod.createDefaultProfile();
p18.trustScore = 85;
p18.currentLevel = 3;
assert('TE-018', mod.shouldEscalate(p18).escalate === true && mod.shouldEscalate(p18).toLevel === 4,
  'Escalate to L4 at score 85');

// --- TE-019~021: shouldDowngrade on -15 delta ---

const p19 = mod.createDefaultProfile();
p19.trustScore = 35;
p19.currentLevel = 2;
const dg1 = mod.shouldDowngrade(p19, 50);
assert('TE-019', dg1.downgrade === true, 'Downgrade triggered when delta = -15');

const p20 = mod.createDefaultProfile();
p20.trustScore = 45;
p20.currentLevel = 2;
const dg2 = mod.shouldDowngrade(p20, 50);
assert('TE-020', dg2.downgrade === false, 'No downgrade when delta = -5 (below threshold)');

const p21 = mod.createDefaultProfile();
p21.trustScore = 15;
p21.currentLevel = 2;
const dg3 = mod.shouldDowngrade(p21, 15);
assert('TE-021', dg3.downgrade === true && dg3.toLevel < 2,
  'Downgrade when score below current level threshold');

// --- TE-022~023: Cooldown period ---

const p22 = mod.createDefaultProfile();
p22.trustScore = 50;
p22.currentLevel = 1;
p22.lastUpgradeAt = new Date().toISOString(); // Just now
assert('TE-022', mod.shouldEscalate(p22).escalate === false,
  'No escalation during cooldown period (just upgraded)');

const p23 = mod.createDefaultProfile();
p23.trustScore = 50;
p23.currentLevel = 1;
p23.lastUpgradeAt = new Date(Date.now() - 31 * 60 * 1000).toISOString(); // 31 min ago
assert('TE-023', mod.shouldEscalate(p23).escalate === true,
  'Escalation allowed after cooldown expires (31 min)');

// --- TE-024~025: saveTrustProfile/loadTrustProfile persistence ---

resetProfile();
const saveProfile = mod.createDefaultProfile();
saveProfile.trustScore = 72;
saveProfile.currentLevel = 3;
mod.saveTrustProfile(saveProfile);

const loaded = mod.loadTrustProfile();
assert('TE-024', loaded.trustScore === 72 && loaded.currentLevel === 3,
  'saveTrustProfile and loadTrustProfile round-trip');

resetProfile();
const defaultLoaded = mod.loadTrustProfile();
assert('TE-025', defaultLoaded.trustScore === 40 && defaultLoaded.currentLevel === 0,
  'loadTrustProfile returns defaults when no file exists (trustScore=40 from components)');

// --- Cleanup ---
process.chdir(origCwd);
fs.rmSync(tmpDir, { recursive: true, force: true });

// --- Summary ---
console.log(`\nResults: ${passed}/${total} passed, ${failed} failed, ${skipped} skipped`);
if (failures.length > 0) {
  console.log('Failures:');
  failures.forEach(f => console.log(`  - ${f.id}: ${f.message}`));
}

module.exports = { passed, failed, total, skipped, failures };
