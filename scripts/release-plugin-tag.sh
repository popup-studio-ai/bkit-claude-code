#!/usr/bin/env bash
#
# release-plugin-tag.sh — bkit GA release automation (FR-δ6, ENH-279)
#
# Release tag automation:
#   1. BKIT_VERSION SoT alignment verification (5 locations)
#   2. Pre-flight clean working tree check
#   3. CI invariants (check-trust-score-reconcile + check-quality-gates)
#   4. Tag creation via `git tag -a` (preceded by an informational
#      `claude plugin tag . --dry-run` consistency check — never gates)
#   5. Optional GitHub release notes draft from CHANGELOG.md
#
# Exit codes:
#   0 — release tag created
#   1 — preflight invariant failed (no tag created)
#   2 — version mismatch among the 5 SoT locations
#   3 — tag creation (`git tag -a`) failed
#
# Usage:
#   bash scripts/release-plugin-tag.sh [--dry-run] [--no-gh-notes]
#
# @version 2.1.11
# @since   2.1.11
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DRY_RUN=0
NO_GH_NOTES=0

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --no-gh-notes) NO_GH_NOTES=1 ;;
    -h|--help)
      grep '^#' "$0" | grep -v '^#!' | sed 's/^# \?//'
      exit 0
      ;;
    *)
      echo "Unknown arg: $arg" >&2
      exit 1
      ;;
  esac
done

cd "$ROOT"

# ── 1. Read canonical version from bkit.config.json ──────────────────────
VERSION=$(node -e 'console.log(require("./bkit.config.json").version)')
TAG="v${VERSION}"
echo "[release] canonical BKIT_VERSION=${VERSION} → tag=${TAG}"

# ── 2. Verify the 5 SoT locations agree ──────────────────────────────────
SOT_FILES=(
  "bkit.config.json"
  ".claude-plugin/plugin.json"
)
for loc in "${SOT_FILES[@]}"; do
  v=$(node -e "console.log(require('./${loc}').version)")
  if [[ "$v" != "$VERSION" ]]; then
    echo "[release] FAIL — ${loc} reports ${v}, expected ${VERSION}" >&2
    exit 2
  fi
  echo "[release]  OK  — ${loc} = ${v}"
done

# README badge + CHANGELOG header (regex matches)
if grep -qE "^# Changelog" CHANGELOG.md && \
   ! grep -qE "^## \[${VERSION}\]" CHANGELOG.md; then
  echo "[release] FAIL — CHANGELOG.md missing [${VERSION}] section" >&2
  exit 2
fi
echo "[release]  OK  — CHANGELOG.md contains [${VERSION}] header"

# ── 3. Pre-flight clean working tree ─────────────────────────────────────
if [[ -n $(git status --porcelain) ]]; then
  echo "[release] FAIL — working tree not clean. Commit or stash first." >&2
  git status --short
  exit 1
fi
echo "[release]  OK  — working tree clean"

# ── 4. Run CI invariants (must pass) ─────────────────────────────────────
node scripts/check-trust-score-reconcile.js
node scripts/check-quality-gates-m1-m10.js

# ── 4.1 v2.1.20 (F7): ADR 0006 § Empirical Validation Gate ───────────────
# Wires `claude plugin validate .` into the release pipeline per ADR 0006
# (2026-04-28 Accepted), recovering the ~30-day wire delay surfaced by the
# 외부 dogfooder 정병진 (@bj) 2026-05-26 install incident.
# References:
#   - docs/adr/0006-cc-upgrade-policy.md § "Empirical Validation Gate"
#   - docs/adr/0011-plugin-manifest-schema-compliance.md § Decision
#   - docs/sprint/v2120-marketplace-recovery/master-plan.md § 8.2
# Behavior:
#   - command -v claude OK → enforce Exit 0 (non-zero → release blocked).
#   - command -v claude missing → WARN + fallback (do not block release;
#     allows CI environments without Claude Code CLI to still ship).
if command -v claude >/dev/null 2>&1; then
  echo "[release] invoking: claude plugin validate . (ADR 0006 § Empirical Validation Gate)"
  if ! claude plugin validate .; then
    echo "[release] FAIL — claude plugin validate returned non-zero (ADR 0006 violation)" >&2
    echo "[release]        Reference: docs/adr/0006-cc-upgrade-policy.md § Empirical Validation Gate" >&2
    echo "[release]        Reference: docs/adr/0011-plugin-manifest-schema-compliance.md § Decision" >&2
    exit 1
  fi
  echo "[release]  OK  — claude plugin validate passed (ADR 0006 § Empirical Validation Gate)"
else
  echo "[release] WARN — 'claude' CLI not on PATH; skipping ADR 0006 § Empirical Validation Gate"
  echo "[release] WARN — recommended: install Claude Code v2.1.143+ before release"
  echo "[release] WARN — see docs/06-guide/cc-compatibility.guide.md"
fi

echo "[release]  OK  — CI invariants pass"

# ── 5. Detect tag conflicts ─────────────────────────────────────────────
if git rev-parse "${TAG}" >/dev/null 2>&1; then
  echo "[release] FAIL — git tag ${TAG} already exists" >&2
  exit 1
fi
echo "[release]  OK  — tag ${TAG} is free"

# ── 6. Issue the tag ─────────────────────────────────────────────────────
# CC (~v2.1.110) changed `claude plugin tag` to derive a `{name}--v{version}`
# tag from plugin.json (the positional version argument was removed, so the
# old `claude plugin tag v<version>` form fails with "Path not found").
# The derived `bkit--v<version>` format would also break this repo's
# `v<version>` tag continuity, so the release tag is ALWAYS created via
# `git tag -a` directly.
#
# `claude plugin tag . --dry-run` is retained as an INFORMATIONAL consistency
# check only: it validates plugin.json <-> marketplace version agreement and
# prints the derived {name}--v{version} WITHOUT creating it. It never gates
# the release (`|| true` — safe under `set -euo pipefail`).
if command -v claude >/dev/null 2>&1; then
  echo "[release] info: consistency check — claude plugin tag . --dry-run (informational only, never gates)"
  claude plugin tag . --dry-run 2>&1 | sed 's/^/[release][info] /' || true
else
  echo "[release][info] 'claude' CLI not on PATH; skipping plugin tag consistency check"
fi

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "[release] DRY RUN — would invoke: git tag -a ${TAG} -m \"bkit ${TAG} release\""
else
  echo "[release] invoking: git tag -a ${TAG}"
  if ! git tag -a "${TAG}" -m "bkit ${TAG} release"; then
    echo "[release] FAIL — git tag -a ${TAG} returned non-zero" >&2
    exit 3
  fi
fi

# ── 7. Optional GitHub release notes draft ──────────────────────────────
if [[ "$NO_GH_NOTES" -eq 0 ]]; then
  if command -v gh >/dev/null 2>&1; then
    if [[ "$DRY_RUN" -eq 1 ]]; then
      echo "[release] DRY RUN — would draft GitHub release notes"
    else
      # Extract CHANGELOG section for this version
      NOTES=$(awk -v v="${VERSION}" '
        $0 ~ "^## \\[" v "\\]" { capture = 1; next }
        capture && /^## \[/ { exit }
        capture { print }
      ' CHANGELOG.md)
      if [[ -n "$NOTES" ]]; then
        echo "[release] drafting GitHub release with CHANGELOG section"
        gh release create "${TAG}" --draft --title "bkit ${TAG}" --notes "$NOTES" || \
          echo "[release] WARN — gh release create failed (manual step required)"
      else
        echo "[release] WARN — no CHANGELOG content for ${VERSION} — skip notes"
      fi
    fi
  else
    echo "[release] WARN — 'gh' CLI not on PATH; skip release notes"
  fi
fi

echo ""
echo "[release] DONE — ${TAG} ready for push"
echo "  next: git push origin ${TAG}"
echo "  GitHub release notes: gh release view ${TAG} --web"
