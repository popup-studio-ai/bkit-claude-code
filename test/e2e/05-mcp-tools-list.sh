#!/usr/bin/env bash
# L5 E2E Scenario 05 — MCP runtime exposes 16 tools

set -euo pipefail
cd "$(dirname "$0")/../.."

out=$(node test/contract/l3-mcp-runtime.test.js 2>&1 || true)
pdca_ok=$(echo "$out" | grep -c 'bkit-pdca has >= 5 tools' || true)
analysis_ok=$(echo "$out" | grep -c 'bkit-analysis has >= 5 tools' || true)
passed=$(echo "$out" | grep -Eo '^Tests: [0-9]+/[0-9]+ PASSED' || true)

if [ "$pdca_ok" -gt 0 ] && [ "$analysis_ok" -gt 0 ] && [ -n "$passed" ]; then
  echo "✓ L5-05 PASS: MCP runtime reachable + 16 tools surfaced ($passed)"
  exit 0
else
  echo "✗ L5-05 FAIL: MCP runtime validation did not complete"
  echo "  tail: ${out: -300}"
  exit 1
fi
