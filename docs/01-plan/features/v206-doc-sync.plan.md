# Plan: v2.0.6 Documentation Sync

## Executive Summary

| Item | Detail |
|------|--------|
| Feature | v2.0.6 Documentation Sync |
| Date | 2026-03-25 |
| Target Version | 2.0.5 → 2.0.6 |
| Trigger | PR #57 merge — Living Context System + Self-Healing + PDCA Handoff Loss Fix (Phase 2+3) |
| Scope | Version bump + doc sync across 8+ target files |

### Value Delivered

| Perspective | Content |
|-------------|---------|
| Problem | PR #57 added 39 files (+5,686 LOC) but docs still reflect v2.0.5 counts |
| Solution | Sync all public-facing docs and config to v2.0.6 with accurate component counts |
| Function & UX Effect | Users see correct version and feature counts; marketplace reflects latest capabilities |
| Core Value | Docs=Code principle — documentation matches actual codebase state |

## Background

PR #57 introduced three major subsystems:
1. **Living Context System** — 4-Layer Living Context (`lib/context/` 7 modules)
2. **Self-Healing CI/CD** — agent + scripts + templates for automated error recovery
3. **PDCA Handoff Loss Fix Phase 2+3** — upstream document cross-reading + PRD→Code context penetration

### New Components Added

| Category | Before (v2.0.5) | After (v2.0.6) | Delta |
|----------|:----------------:|:---------------:|:-----:|
| Lib Modules | 78 | 88 | +10 (7 context + 4 pdca, -1 counted in index) |
| Lib Subdirectories | 10 | 11 | +1 (context) |
| Agents | 31 | 32 | +1 (self-healing) |
| Skills | 36 | 37 | +1 (deploy) |
| Scripts | 54 | 57 | +3 (deploy-hook, design-post-scenario, heal-hook) |
| Templates | existing | +11 | +11 (infra/, context/) |
| Hook Events | 18 | 18 | 0 |
| LOC (lib/) | ~40K | ~45K | +~5K |

## Scope

### Target Files

| # | File | Changes Required |
|---|------|-----------------|
| 1 | `bkit.config.json` | version 2.0.5 → 2.0.6 |
| 2 | `.claude-plugin/plugin.json` | version + description (counts update) |
| 3 | `.claude-plugin/marketplace.json` | version if present |
| 4 | `README.md` | Version badge, feature list, component counts, plugin structure |
| 5 | `CHANGELOG.md` | New [2.0.6] section with all changes |
| 6 | `AI-NATIVE-DEVELOPMENT.md` | Updated component counts (agents, skills, lib, hooks) |
| 7 | `CUSTOMIZATION-GUIDE.md` | Updated counts in component overview tables |
| 8 | `bkit-system/README.md` | Updated counts if referenced |

### Out of Scope
- Code changes (already merged in PR #57)
- Test changes
- Hook script modifications
- PDCA state file updates

## Success Criteria

| # | Criterion | Metric |
|---|-----------|--------|
| SC-1 | All version strings updated to 2.0.6 | 0 remaining 2.0.5 in target files |
| SC-2 | Component counts accurate | 88 lib, 32 agents, 37 skills, 57 scripts, 11 subdirs |
| SC-3 | CHANGELOG has complete v2.0.6 entry | All 3 subsystems documented |
| SC-4 | All content in English | Except 8-language trigger keywords |
| SC-5 | Gap analysis 100% match | Design↔Implementation full alignment |

## Questions Resolved
- Q: Should we count `ops-metrics.js` and `self-healing.js` even though they're not re-exported in `index.js`?
  A: Yes, count all .js files in lib/ as modules regardless of export status.
- Q: What about the infra templates (ArgoCD, Terraform, etc.)?
  A: Document in CHANGELOG but they don't affect top-level component counts.
