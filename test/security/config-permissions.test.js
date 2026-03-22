/**
 * Config Permissions Security Tests
 * @module test/security/config-permissions
 * @version 1.6.1
 *
 * Validates bkit.config.json permissions section for the 3-Tier Security Model.
 * Ensures destructive commands are denied/ask, while productive tools are allowed.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const CONFIG_PATH = path.resolve(__dirname, '../../bkit.config.json');

/**
 * Load and parse bkit.config.json
 * @returns {Object} parsed config
 */
function loadConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  return JSON.parse(raw);
}

// ============================================================
// Test Results Collector
// ============================================================
const results = { pass: 0, fail: 0, errors: [] };

function test(id, description, fn) {
  try {
    fn();
    results.pass++;
    console.log(`  PASS  ${id}: ${description}`);
  } catch (e) {
    results.fail++;
    results.errors.push({ id, description, error: e.message });
    console.log(`  FAIL  ${id}: ${description}`);
    console.log(`        ${e.message}`);
  }
}

// ============================================================
// Config File Validation
// ============================================================
console.log('\n=== Config Permissions Security Tests ===');

let config;
try {
  config = loadConfig();
} catch (e) {
  console.error(`FATAL: Cannot load bkit.config.json: ${e.message}`);
  process.exit(1);
}

// SEC-CP-001: permissions section exists
test('SEC-CP-001', 'bkit.config.json has permissions section', () => {
  assert.ok(config.permissions, 'permissions section missing');
  assert.strictEqual(typeof config.permissions, 'object');
});

// SEC-CP-002: Bash(rm -rf*) is denied
test('SEC-CP-002', 'Bash(rm -rf*) permission is deny', () => {
  assert.strictEqual(
    config.permissions['Bash(rm -rf*)'], 'deny',
    `Expected 'deny', got '${config.permissions['Bash(rm -rf*)']}'`
  );
});

// SEC-CP-003: Bash(git push --force*) is denied
test('SEC-CP-003', 'Bash(git push --force*) permission is deny', () => {
  assert.strictEqual(
    config.permissions['Bash(git push --force*)'], 'deny',
    `Expected 'deny', got '${config.permissions['Bash(git push --force*)']}'`
  );
});

// SEC-CP-004: Bash(rm -r*) is ask
test('SEC-CP-004', 'Bash(rm -r*) permission is ask', () => {
  assert.strictEqual(
    config.permissions['Bash(rm -r*)'], 'ask',
    `Expected 'ask', got '${config.permissions['Bash(rm -r*)']}'`
  );
});

// SEC-CP-005: Bash(git reset --hard*) is ask
test('SEC-CP-005', 'Bash(git reset --hard*) permission is ask', () => {
  assert.strictEqual(
    config.permissions['Bash(git reset --hard*)'], 'ask',
    `Expected 'ask', got '${config.permissions['Bash(git reset --hard*)']}'`
  );
});

// SEC-CP-006: Write is allow
test('SEC-CP-006', 'Write permission is allow', () => {
  assert.strictEqual(config.permissions['Write'], 'allow');
});

// SEC-CP-007: Edit is allow
test('SEC-CP-007', 'Edit permission is allow', () => {
  assert.strictEqual(config.permissions['Edit'], 'allow');
});

// SEC-CP-008: Read is allow
test('SEC-CP-008', 'Read permission is allow', () => {
  assert.strictEqual(config.permissions['Read'], 'allow');
});

// SEC-CP-009: Bash (general) is allow
test('SEC-CP-009', 'Bash general permission is allow', () => {
  assert.strictEqual(config.permissions['Bash'], 'allow');
});

// SEC-CP-010: deny permissions take precedence over allow
test('SEC-CP-010', 'Deny permissions are more specific than general allow', () => {
  // Bash is allow, but Bash(rm -rf*) is deny — specificity check
  assert.strictEqual(config.permissions['Bash'], 'allow');
  assert.strictEqual(config.permissions['Bash(rm -rf*)'], 'deny');
  // Verify the deny pattern is more specific (has parentheses)
  const denyKeys = Object.keys(config.permissions).filter(k => config.permissions[k] === 'deny');
  for (const key of denyKeys) {
    assert.ok(key.includes('('), `Deny key '${key}' should be pattern-specific (contain parentheses)`);
  }
});

// SEC-CP-011: No unexpected deny rules exist
test('SEC-CP-011', 'Only expected deny rules exist', () => {
  const denyKeys = Object.keys(config.permissions).filter(k => config.permissions[k] === 'deny');
  const expectedDenyKeys = ['Bash(rm -rf*)', 'Bash(git push --force*)'];
  assert.deepStrictEqual(
    denyKeys.sort(),
    expectedDenyKeys.sort(),
    `Unexpected deny rules: [${denyKeys.join(', ')}]`
  );
});

// SEC-CP-012: No unexpected ask rules exist
test('SEC-CP-012', 'Only expected ask rules exist', () => {
  const askKeys = Object.keys(config.permissions).filter(k => config.permissions[k] === 'ask');
  const expectedAskKeys = ['Bash(rm -r*)', 'Bash(git reset --hard*)'];
  assert.deepStrictEqual(
    askKeys.sort(),
    expectedAskKeys.sort(),
    `Unexpected ask rules: [${askKeys.join(', ')}]`
  );
});

// SEC-CP-013: Permission values are valid (only allow/deny/ask)
test('SEC-CP-013', 'All permission values are valid (allow/deny/ask)', () => {
  const validValues = ['allow', 'deny', 'ask'];
  for (const [key, value] of Object.entries(config.permissions)) {
    assert.ok(
      validValues.includes(value),
      `Permission '${key}' has invalid value '${value}', expected one of: ${validValues.join(', ')}`
    );
  }
});

// SEC-CP-014: Config version matches expected
test('SEC-CP-014', 'Config version is 2.0.3', () => {
  assert.strictEqual(config.version, '2.0.3', `Expected version 2.0.3, got ${config.version}`);
});

// SEC-CP-015: Permissions section has correct total count
test('SEC-CP-015', 'Permissions section has exactly 8 entries', () => {
  const count = Object.keys(config.permissions).length;
  assert.strictEqual(count, 8, `Expected 8 permission entries, got ${count}`);
});

// ============================================================
// v2.0: SEC-CP-016 ~ SEC-CP-025: Enhanced Permission Checks (10 TC)
// ============================================================
console.log('\n=== v2.0: Enhanced Config Permissions ===');

// --- CP-016 ~ CP-020: dangerouslyDisableSandbox detection ---

test('SEC-CP-016', 'Config does NOT contain dangerouslyDisableSandbox', () => {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  assert.ok(
    !raw.includes('dangerouslyDisableSandbox'),
    'bkit.config.json must NOT contain dangerouslyDisableSandbox'
  );
});

test('SEC-CP-017', 'Config does NOT contain sandbox.excludedCommands', () => {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  assert.ok(
    !raw.includes('excludedCommands'),
    'bkit.config.json must NOT contain sandbox.excludedCommands'
  );
});

test('SEC-CP-018', 'Config does NOT contain autoAllowBashIfSandboxed', () => {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  assert.ok(
    !raw.includes('autoAllowBashIfSandboxed'),
    'bkit.config.json must NOT contain autoAllowBashIfSandboxed'
  );
});

test('SEC-CP-019', 'No permission value is set to an unexpected type', () => {
  for (const [key, value] of Object.entries(config.permissions)) {
    assert.strictEqual(typeof value, 'string',
      `Permission '${key}' value should be string, got ${typeof value}`);
  }
});

test('SEC-CP-020', 'Config has guardrails section with destructiveDetection enabled', () => {
  assert.ok(config.guardrails, 'guardrails section missing');
  assert.strictEqual(config.guardrails.destructiveDetection, true,
    'destructiveDetection should be true');
});

// --- CP-021 ~ CP-025: Permission escalation detection ---

test('SEC-CP-021', 'No deny rule can be overridden by a broader allow rule', () => {
  // Verify deny keys are more specific than any allow key
  const denyKeys = Object.keys(config.permissions).filter(k => config.permissions[k] === 'deny');
  const allowKeys = Object.keys(config.permissions).filter(k => config.permissions[k] === 'allow');

  for (const dk of denyKeys) {
    // Deny key should always be more specific (contain parentheses)
    assert.ok(dk.includes('('), `Deny key '${dk}' must be pattern-specific`);
    // No allow key should be MORE specific than this deny key
    for (const ak of allowKeys) {
      if (ak.includes('(')) {
        // Both are pattern-specific — deny should not be a prefix of allow
        assert.ok(
          !ak.startsWith(dk.replace('*)', '')),
          `Allow pattern '${ak}' should not override deny pattern '${dk}'`
        );
      }
    }
  }
});

test('SEC-CP-022', 'Automation defaultLevel is L2 (not higher)', () => {
  assert.strictEqual(config.automation.defaultLevel, 2,
    `Default automation level should be 2 (semi-auto), got ${config.automation.defaultLevel}`);
});

test('SEC-CP-023', 'autoEscalation is disabled by default', () => {
  assert.strictEqual(config.automation.autoEscalation, false,
    'autoEscalation should be false to prevent uncontrolled level increases');
});

test('SEC-CP-024', 'emergencyStopEnabled is true', () => {
  assert.strictEqual(config.automation.emergencyStopEnabled, true,
    'emergencyStopEnabled must be true for safety');
});

test('SEC-CP-025', 'checkpointOnDestructive is enabled', () => {
  assert.strictEqual(config.guardrails.checkpointOnDestructive, true,
    'checkpointOnDestructive should be true');
});

// ============================================================
// Summary
// ============================================================
console.log('\n=== Config Permissions Security Test Summary ===');
console.log(`Total: ${results.pass + results.fail} | Pass: ${results.pass} | Fail: ${results.fail}`);
if (results.errors.length > 0) {
  console.log('\nFailed tests:');
  for (const e of results.errors) {
    console.log(`  ${e.id}: ${e.description}`);
    console.log(`    -> ${e.error}`);
  }
}
process.exit(results.fail > 0 ? 1 : 0);
