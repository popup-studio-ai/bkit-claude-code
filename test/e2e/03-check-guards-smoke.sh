#!/usr/bin/env bash
# L5 E2E Scenario 03 — check-guards.js reports 21 registered guards

set -euo pipefail
cd "$(dirname "$0")/../.."

out=$(node scripts/check-guards.js 2>&1)
if echo "$out" | grep -qE '21 guards?'; then
  echo "✓ L5-03 PASS: check-guards reports 21 guards"
  exit 0
else
  echo "✗ L5-03 FAIL: expected 21 guards"
  echo "  output: $out"
  exit 1
fi
