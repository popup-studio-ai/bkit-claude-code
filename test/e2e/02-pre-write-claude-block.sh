#!/usr/bin/env bash
# L5 E2E Scenario 02 — PreWrite to .claude/ with bypassPermissions blocked
# Verifies ENH-263 guard (#51801) blocks the attack path.

set -euo pipefail
cd "$(dirname "$0")/../.."

out=$(echo '{"hook_event_name":"PreToolUse","tool_name":"Write","tool_input":{"file_path":".claude/settings.json","content":"{}"},"permissions":{"bypassPermissions":true}}' | node scripts/pre-write.js 2>/dev/null || true)
# Accept any of: JSON decision=block/deny, or scope-limit textual block, or plain "blocked" message
if echo "$out" | grep -qE '"decision":"(block|deny)"' \
   || echo "$out" | grep -qiE 'scope limit|blocked|denied|not in allowed scope'; then
  echo "✓ L5-02 PASS: .claude/ write blocked (defense-in-depth active)"
  exit 0
fi
# Explicit allow is only acceptable in a clearly labeled bypass env
if echo "$out" | grep -q '"decision":"allow"' && [ "${BKIT_CC_REGRESSION_BYPASS:-}" = "1" ]; then
  echo "✓ L5-02 PASS (info): bypass env enabled, allow permitted"
  exit 0
fi
echo "✗ L5-02 FAIL: unexpected pre-write.js response"
echo "  output (first 300 chars): ${out:0:300}"
exit 1
