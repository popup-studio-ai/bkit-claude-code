#!/bin/bash
# bkit Stop Hook - PDCA completion evaluation
# Returns JSON: {"decision": "approve|block", "reason": "..."}

set -euo pipefail

# Read input from stdin (contains session info)
input=$(cat)

# Extract transcript path if available
transcript_path=$(echo "$input" | grep -o '"transcript_path":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "")

# Default: approve (allow Claude to stop)
decision="approve"
reason="Task evaluation complete"

# TODO: Implement proper todo state tracking
# For now, always approve to allow normal conversation flow
# The transcript-based detection has false positives from explanatory text
#
# Future improvement: Use a dedicated state file instead of parsing transcript

# Output JSON response
echo "{\"decision\": \"$decision\", \"reason\": \"$reason\"}"
exit 0
