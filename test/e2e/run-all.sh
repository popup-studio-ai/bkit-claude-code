#!/usr/bin/env bash
# L5 E2E — run all shell smoke scenarios (Sprint 6 NEW 6-5)
#
# Design Ref: bkit-v2110-gap-closure.design.md §3.4.5
# Plan SC: D13 — L5 E2E shell smoke ≥ 5 scenarios

set -euo pipefail
cd "$(dirname "$0")"

pass=0
fail=0
total=0

for script in 0*.sh; do
  total=$((total + 1))
  if bash "$script"; then
    pass=$((pass + 1))
  else
    fail=$((fail + 1))
  fi
done

echo ""
echo "=== L5 E2E Summary ==="
echo "PASS: $pass / $total"
echo "FAIL: $fail / $total"
if [ "$fail" -gt 0 ]; then
  exit 1
fi
exit 0
