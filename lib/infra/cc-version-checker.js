/**
 * cc-version-checker.js — Claude Code CLI version detection adapter (FR-α5)
 *
 * Reads the locally installed Claude Code CLI version via two strategies:
 *   1. Spawn `claude --version` (subprocess, 500ms timeout)
 *   2. Fallback: read `~/.claude/claude/version.json`
 *
 * Compares against FEATURE_VERSION_MAP to surface inactive features so that
 * SessionStart hook can warn users when a feature requires a newer CC release.
 *
 * Fail-open by design: any error returns `null` and emits no warning, never
 * blocking the user's session.
 *
 * Security:
 *   - No shell escape required; argument list is fixed (`--version`).
 *   - File path is hardcoded under $HOME; no traversal.
 *   - No external network access.
 *
 * @module lib/infra/cc-version-checker
 * @version 2.1.11
 * @since 2.1.11
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SUBPROCESS_TIMEOUT_MS = 500;

/**
 * Minimum supported CC CLI version. Below this, bkit may misbehave.
 */
const MIN_VERSION = '2.1.78';

/**
 * Recommended CC CLI version — recommended runtime for Claude 5 alias
 * resolution (`sonnet` resolves to Sonnet 5 only on CC ≥ 2.1.197).
 * Kept in sync with README (runtime recommendation) and at/above the hard
 * install floor (v2.1.143, strict plugin-manifest `displayName`).
 */
const RECOMMENDED_VERSION = '2.1.198';

/**
 * Model floor for Fable-pinned agents — the CC version that introduced the
 * `fable` model alias. Below it, agents declaring `model: fable` hard-fail
 * at spawn (empirically reproduced 2026-07-02). bkit v2.1.25 pins 9 agents
 * to fable; session-context.js emits a SessionStart advisory when
 * 2.1.143 ≤ CC < this floor.
 */
const FABLE_MODEL_FLOOR = '2.1.170';

/**
 * Feature → minimum required CC version. Inactive when current < required.
 * Maintained in sync with Design 3.3 (sprint α) and v2.1.118 ENH-277/279/280.
 */
const FEATURE_VERSION_MAP = Object.freeze({
  agentTeams: '2.1.117',          // CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS
  loopCommand: '2.1.71',          // /loop
  promptCaching1h: '2.1.108',     // 1-hour prompt cache
  contextFork: '2.1.113',         // context: fork in session
  opus1MCompact: '2.1.113',       // Opus 1M /compact fix (tentative)
  hookMcpToolDirect: '2.1.118',   // hooks.json type: "mcp_tool" (ENH-277)
  // claude plugin tag (ENH-279). NOTE: CC changed `plugin tag` to derive
  // `{name}--v{version}` from plugin.json (~v2.1.110; the positional
  // version argument was removed, so `claude plugin tag v<x.y.z>` fails
  // with "Path not found"). bkit's scripts/release-plugin-tag.sh now
  // creates the release tag via `git tag -a` directly and uses
  // `claude plugin tag . --dry-run` only as an informational consistency
  // check. Value stays 2.1.118 per this map's semantics (minimum CC
  // version at which the invoked command exists).
  pluginTagCommand: '2.1.118',
  agentHookMultiEvent: '2.1.118', // agent-hook multi-event fix (ENH-280)
});

/**
 * Parse a semver-ish version string into a numeric tuple `[major, minor, patch]`.
 * Returns `null` on malformed input so callers can short-circuit.
 *
 * @param {string} v
 * @returns {[number, number, number] | null}
 */
function parseVersion(v) {
  if (typeof v !== 'string') return null;
  const m = v.trim().match(/(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/**
 * Compare two version strings.
 *   1  → a > b
 *   0  → a == b
 *  -1  → a < b
 *
 * Unparsable inputs compare as equal (fail-open).
 *
 * @param {string} a
 * @param {string} b
 * @returns {-1 | 0 | 1}
 */
function compareVersion(a, b) {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) return 0;
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return 1;
    if (pa[i] < pb[i]) return -1;
  }
  return 0;
}

// Module-level cache: CC CLI version is immutable for the duration of a Node
// process, so detecting once is correct. Repeat callers (e.g. preflight +
// markFirstRunSeen + reconcile in the same session) thus pay subprocess cost
// only on the first call. Tests that need to defeat the cache call _resetCache().
let _cache = { set: false, value: null };

function _resetCache() { _cache = { set: false, value: null }; }

/**
 * Detect the current Claude Code CLI version.
 *
 * Strategy (executed once per process — see module cache):
 *   1. spawnSync('claude', ['--version'], { timeout: 500 })
 *   2. Fallback to reading ~/.claude/claude/version.json
 *
 * Returns `null` on any failure — caller MUST treat null as "unknown" and
 * skip warnings (fail-open).
 *
 * @returns {string | null} e.g. "2.1.121" or null
 */
function getCurrent() {
  if (_cache.set) return _cache.value;

  let detected = null;

  // Strategy 1: subprocess
  try {
    const result = spawnSync('claude', ['--version'], {
      encoding: 'utf-8',
      timeout: SUBPROCESS_TIMEOUT_MS,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    if (result.status === 0 && typeof result.stdout === 'string') {
      const parsed = parseVersion(result.stdout);
      if (parsed) detected = `${parsed[0]}.${parsed[1]}.${parsed[2]}`;
    }
  } catch {
    // fall through
  }

  // Strategy 2: version.json
  if (detected === null) {
    try {
      const versionFile = path.join(os.homedir(), '.claude', 'claude', 'version.json');
      if (fs.existsSync(versionFile)) {
        const raw = fs.readFileSync(versionFile, 'utf-8');
        const json = JSON.parse(raw);
        if (json && typeof json.version === 'string') {
          const parsed = parseVersion(json.version);
          if (parsed) detected = `${parsed[0]}.${parsed[1]}.${parsed[2]}`;
        }
      }
    } catch {
      // fall through
    }
  }

  _cache = { set: true, value: detected };
  return detected;
}

/**
 * List feature keys whose required version exceeds the supplied current version.
 * Order is determined by FEATURE_VERSION_MAP insertion order.
 *
 * @param {string} current
 * @returns {string[]}
 */
function listInactiveFeatures(current) {
  if (!parseVersion(current)) return [];
  const inactive = [];
  for (const [feature, required] of Object.entries(FEATURE_VERSION_MAP)) {
    if (compareVersion(current, required) < 0) {
      inactive.push(feature);
    }
  }
  return inactive;
}

/**
 * Compose a structured version-check report. Pure — no I/O beyond getCurrent().
 *
 * Honors `DISABLE_UPDATES=1` (CC v2.1.118+ env gate, F5 mitigation):
 * if set, returns `{ skipped: true }` so the caller can suppress all warnings.
 *
 * Result shape:
 *   { skipped: true, reason }                               — opted out
 *   { current: null }                                       — undetectable, no warning
 *   { current, severity: 'ok'   }                           — current ≥ recommended
 *   { current, severity: 'warn', inactive: [...] }          — current < recommended, ≥ min
 *   { current, severity: 'error', inactive: [...] }         — current < min
 *
 * @returns {object}
 */
function checkCCVersion() {
  if (process.env.DISABLE_UPDATES === '1') {
    return { skipped: true, reason: 'DISABLE_UPDATES env' };
  }

  const current = getCurrent();
  if (!current) return { current: null };

  const inactive = listInactiveFeatures(current);
  if (compareVersion(current, MIN_VERSION) < 0) {
    return { current, severity: 'error', inactive, recommended: RECOMMENDED_VERSION, min: MIN_VERSION };
  }
  if (compareVersion(current, RECOMMENDED_VERSION) < 0) {
    return { current, severity: 'warn', inactive, recommended: RECOMMENDED_VERSION, min: MIN_VERSION };
  }
  return { current, severity: 'ok', inactive, recommended: RECOMMENDED_VERSION, min: MIN_VERSION };
}

module.exports = {
  MIN_VERSION,
  RECOMMENDED_VERSION,
  FABLE_MODEL_FLOOR,
  FEATURE_VERSION_MAP,
  parseVersion,
  compareVersion,
  getCurrent,
  listInactiveFeatures,
  checkCCVersion,
  _resetCache, // test-only — flush in-process getCurrent cache
};
