#!/usr/bin/env bash
# L5 E2E Scenario 01 — SessionStart Smoke
# Verifies SessionStart hook returns canonical BKIT_VERSION systemMessage.
#
# Design Ref: bkit-v2110-gap-closure.design.md §3.4.5
# Plan SC: D13 (L5 E2E ≥ 5 scenarios)
#
# v2.1.11 update: read canonical version from bkit.config.json so this stays
# green across version bumps without per-release fixture drift.

set -euo pipefail
cd "$(dirname "$0")/../.."

VERSION=$(node -e "console.log(require('./bkit.config.json').version)")

out=$(echo '{"hook_event_name":"SessionStart","session_id":"e2e-01","cwd":"'"$(pwd)"'","source":"startup"}' | node hooks/session-start.js 2>/dev/null)
expected="\"systemMessage\":\"bkit Vibecoding Kit v${VERSION} activated (Claude Code)\""
if echo "$out" | grep -qF "$expected"; then
  echo "✓ L5-01 PASS: SessionStart returns v${VERSION} systemMessage"
  exit 0
else
  echo "✗ L5-01 FAIL: systemMessage mismatch (expected v${VERSION})"
  echo "  output (first 200 chars): ${out:0:200}"
  exit 1
fi
