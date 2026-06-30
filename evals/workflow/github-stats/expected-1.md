# Expected Output — github-stats trigger & accumulation

## Process steps (must follow in order)

1. **Collect** — run `bash .claude/skills/github-stats/collect.sh`. It fetches
   live Stars/Forks/Watchers and the 14-day rolling Clones/Views via `gh api`,
   then prints a metrics JSON and a `gapWarning` field.
2. **Gap handling** — if `gapWarning` is not `"none"`, estimate the missing
   window with the trapezoidal method and append it to `estimatedGaps` in the
   ledger, then re-run the collector. If `"none"`, skip this step.
3. **Render** — fill every `{{TOKEN}}` in the template
   (`.claude/templates/github-stats.template.md`) and write
   `docs/github-stats-bkit-claude-code.md`.
4. **Brief** — summarize Stars/Forks (exact) and cumulative Clones/Views
   (partly estimated) and flag any new milestone.

## Required output structure (template / format)

The generated report must keep the fixed template structure, including these
sections and a cumulative audit trail:

```
# GitHub Usage Statistics Report — bkit-claude-code
## 📌 Data Policy
## 🔥 Executive Summary
## 👀 Daily Views (last 14 days)
## 📥 Daily Clones (last 14 days)
## 🧮 Cumulative Computation (Audit Trail)
## 📋 Collection Log (Snapshot History)
```

## Pass criteria (cumulative correctness)

- Cumulative is computed as `anchor + Σ estimatedGaps + Σ daily` — a
  deterministic identity the collector recomputes on every run.
- Stars / Forks are reported as exact real-time values.
- Gap-period Clones / Views are clearly marked `(est.)`.
- Re-running the collector is idempotent: the cumulative result and snapshot
  count do not change when no new daily data has arrived.

## Expected result (as of 2026-06-29 data, baseline re-anchored to the 05/30 observation)

- Cumulative Clones: 385,974 (crossed the 380K milestone)
- Cumulative Views: 78,902
- Cumulative Unique Clones: 52,320 (est.)
- Stars: 566 · Forks: 151
- Anchor: 2026-05-30 user observation (Clones > 340K → 344,816); Views/Unique scaled ×1.2293.
