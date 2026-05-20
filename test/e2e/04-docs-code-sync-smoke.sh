#!/usr/bin/env bash
# L5 E2E Scenario 04 — docs-code-sync PASS with canonical BKIT_VERSION
#
# v2.1.11 update: pin assertion to canonical version from bkit.config.json
# instead of hard-coding the release number, so this scenario survives bumps.

set -euo pipefail
cd "$(dirname "$0")/../.."

VERSION=$(node -e "console.log(require('./bkit.config.json').version)")
VERSION_REGEX="${VERSION//./\\.}"

out=$(node scripts/docs-code-sync.js 2>&1)
if echo "$out" | grep -q 'PASSED' && echo "$out" | grep -qE "canonical.*${VERSION_REGEX}"; then
  echo "✓ L5-04 PASS: docs-code-sync PASSED with canonical ${VERSION}"
  exit 0
else
  echo "✗ L5-04 FAIL (expected canonical ${VERSION})"
  echo "  output: $out"
  exit 1
fi
