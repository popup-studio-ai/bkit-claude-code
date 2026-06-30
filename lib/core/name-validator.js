/**
 * Path-Safe Name Validator
 * @module lib/core/name-validator
 * @version 2.1.22
 *
 * Validates user-derived names before they are interpolated into file paths.
 * Closes path-traversal holes (audit C3/C4/M8) by rejecting anything outside
 * the safe [A-Za-z0-9_-] set, so parent-directory (`..`) and separator (`/`)
 * sequences can never reach `path.join`.
 *
 * Shared across MCP tool boundaries and lib path-join sites so the rule lives
 * in exactly one place (design Option C).
 */

/**
 * Allowlist pattern for a path-safe name segment.
 * Matches one or more ASCII letters, digits, underscore, or hyphen.
 * @type {RegExp}
 */
const NAME_RE = /^[A-Za-z0-9_-]+$/;

/**
 * Validate a user-derived name used in path construction.
 *
 * @param {string} name - Candidate name (e.g. checkpoint id, feature name).
 * @param {string} [label='name'] - Human label for the error message.
 * @returns {string} The validated name (unchanged).
 * @throws {Error} If `name` is not a string or contains characters outside
 *   [A-Za-z0-9_-]. Failing closed here prevents `..`/`/` from reaching
 *   `path.join`, so traversal attempts never escape their intended directory.
 */
function validateName(name, label = "name") {
  if (typeof name !== "string" || !NAME_RE.test(name)) {
    throw new Error(
      `Invalid ${label}: must match [A-Za-z0-9_-]+ (got: ${JSON.stringify(name)})`
    );
  }
  return name;
}

/**
 * Validate a PDCA feature name before it reaches path construction.
 *
 * Thin wrapper over validateName with a fixed label, so the lib path-join
 * chokepoints (feature-manager / resume / state-transitions) read as intent
 * rather than re-stating the pattern. Closes M8 (audit): feature names are
 * user-derived and spliced into `${feature}.json`, so an unvalidated value
 * could write outside `.bkit/` (e.g. overwrite package.json). Every site that
 * builds a path from a feature routes through this.
 *
 * @param {string} feature - Candidate feature name.
 * @returns {string} The validated feature name (unchanged).
 * @throws {Error} If `feature` is not path-safe.
 */
function validateFeatureName(feature) {
  return validateName(feature, "feature name");
}

module.exports = {
  NAME_RE,
  validateName,
  validateFeatureName,
};
