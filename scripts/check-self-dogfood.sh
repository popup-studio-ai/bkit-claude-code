#!/usr/bin/env bash
# scripts/check-self-dogfood.sh — v2.1.19 S1 F1-3 CI gate (bash wrapper)
#
# Master plan §19 (Self-Dogfooding CI Gate) + §19.5 (Bootstrap Exception).
# Design ref: docs/02-design/features/s1-foundation.design.md §4.2
#
# Thin wrapper that delegates to scripts/_check-self-dogfood-helper.js.
# ADR S1-003 — bash 3+ compatible (no [[ ]], no associative arrays, no
# ${var,,} expansions). All complex logic lives in the Node helper.
#
# Usage:
#   scripts/check-self-dogfood.sh [--bootstrap-mode]
#                                 [--emergency-override <reason>]
#                                 [--check-last <N>]
#                                 [--json]
#                                 [--help|-h]
# Exit:
#   0  PASS or override active
#   1  FAIL — invariant violation
#   2  helper unavailable or fatal error
set -e

# Resolve repo root from script location (works regardless of CWD).
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ROOT=$(dirname "$SCRIPT_DIR")
cd "$ROOT"

HELPER="$SCRIPT_DIR/_check-self-dogfood-helper.js"
if [ ! -f "$HELPER" ]; then
  echo "FAIL: helper not found at $HELPER" >&2
  exit 2
fi

# Verify node availability (helper is Node-based).
if ! command -v node >/dev/null 2>&1; then
  echo "FAIL: node not found in PATH (required by self-dogfood gate)" >&2
  exit 2
fi

# Delegate to helper. The helper exits with 0 or 1 directly; bash propagates.
exec node "$HELPER" "$@"
