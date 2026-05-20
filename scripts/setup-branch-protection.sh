#!/usr/bin/env bash
# scripts/setup-branch-protection.sh — v2.1.18 (CO-1)
#
# Sets up main branch protection for the bkit repository via gh CLI.
# Idempotent: re-running produces identical state.
#
# Usage:
#   bash scripts/setup-branch-protection.sh [--dry-run] [--apply]
#
# Defaults to --dry-run. Pass --apply to actually call GitHub API.
#
# Requirements:
#   - gh CLI authenticated (gh auth status)
#   - Active account must have admin role on the target repo
#   - jq installed
#
# Required Status Checks (job names from .github/workflows/contract-check.yml):
#   - "Contract Test (L1 Frontmatter + L4 Deprecation)"
#   - "Contract Test L5 (Invocation Inventory)"   (v2.1.18: promoted from observational)
#
# Reference:
#   - docs/06-guide/branch-protection-setup.guide.md
#   - docs/04-report/features/v2117-ci-cd-hardening.report.md §5
#   - docs/01-plan/features/v2118-carryover-cleanup.plan.md (CO-1)
#
# Exit codes:
#   0 — success (dry-run preview or apply OK)
#   1 — gh CLI not authenticated or jq missing
#   2 — API call failed

set -euo pipefail

REPO="popup-studio-ai/bkit-claude-code"
BRANCH="main"
DRY_RUN=true

# Required status check contexts (must match workflow job names exactly)
CONTEXTS=(
  "Contract Test (L1 Frontmatter + L4 Deprecation)"
  "Contract Test L5 (Invocation Inventory)"
)

# --- Argument parsing ---
for arg in "$@"; do
  case "$arg" in
    --apply) DRY_RUN=false ;;
    --dry-run) DRY_RUN=true ;;
    --help|-h)
      sed -n '2,30p' "$0"
      exit 0
      ;;
  esac
done

# --- Pre-flight checks ---
if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: gh CLI not found. Install: https://cli.github.com/" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq not found. Install: brew install jq (macOS) or apt install jq (Linux)" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "ERROR: gh CLI not authenticated. Run: gh auth login" >&2
  exit 1
fi

ACTIVE_USER=$(gh api user --jq .login 2>/dev/null || echo "?")
echo "[setup-branch-protection] Active gh user: ${ACTIVE_USER}"
echo "[setup-branch-protection] Target: ${REPO} / ${BRANCH}"
echo ""

# --- Build JSON payload ---
PAYLOAD=$(jq -n \
  --argjson contexts "$(printf '%s\n' "${CONTEXTS[@]}" | jq -R . | jq -s .)" \
  '{
    required_status_checks: {
      strict: true,
      contexts: $contexts
    },
    enforce_admins: false,
    required_pull_request_reviews: null,
    restrictions: null,
    allow_force_pushes: false,
    allow_deletions: false
  }')

# --- Dry-run preview or apply ---
if $DRY_RUN; then
  echo "[dry-run] Would PUT /repos/${REPO}/branches/${BRANCH}/protection with payload:"
  echo "$PAYLOAD" | jq .
  echo ""
  echo "Required Status Checks:"
  for c in "${CONTEXTS[@]}"; do
    echo "  - $c"
  done
  echo ""
  echo "To apply, re-run with: bash scripts/setup-branch-protection.sh --apply"
  exit 0
fi

# --- Apply ---
echo "[apply] Setting branch protection on ${BRANCH}..."
if echo "$PAYLOAD" | gh api -X PUT "/repos/${REPO}/branches/${BRANCH}/protection" --input -; then
  echo ""
  echo "✓ Branch protection applied successfully."
  echo ""
  echo "Verify:"
  echo "  gh api /repos/${REPO}/branches/${BRANCH}/protection | jq '.required_status_checks'"
else
  echo "" >&2
  echo "ERROR: API call failed. Check active gh user has admin role." >&2
  exit 2
fi
