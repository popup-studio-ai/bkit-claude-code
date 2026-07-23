# Plan — CC v2.1.218 Compatibility Response (bkit v2.1.31)

> **Feature**: cc-v2218-compat · **Target version**: v2.1.31 · **Branch**: `feat/v2.1.31-cc218-fork-bg-compat`
> **PDCA phase**: plan · **Date**: 2026-07-23 · **Basis report**: `docs/04-report/features/cc-v2218-impact-analysis.report.en.md` (cycle #29)

## 1. Background (grounded)

Claude Code v2.1.218 CHANGELOG:
> "Changed skills with `context: fork` to run in the background by default; opt out per skill with `background: false`."

bkit ships **9 skills** using `context: fork` (phase-1-schema, phase-2-convention, phase-3-mockup, phase-4-api, phase-5-design-system, phase-8-review, qa-phase, zero-script-qa, skill-status). None declare `background:`, so on CC≥218 their **execution mode silently switches to background**.

### Facts established by grounded research (not guesses)
1. **Scheduling regression (new in 218)**: `background: false` restores foreground. **Safe & backward-compatible** (CC<218 ignores the unknown key; 218's boolean parser handles it robustly). Edge case: `CLAUDE_CODE_FORK_SUBAGENT=1` nullifies `background: false`.
2. **AskUserQuestion×fork suppression (pre-existing, separate)**: GitHub issues **#19751·#34592·#46654·#54892** (verified directly via gh; #54892 is a reopened regression with a repro) — AskUserQuestion and deferred-tool loading are suppressed inside fork skills. `background: false` does **not** fix this.
3. **But not an active break**: all 9 fork skills invoke AskUserQuestion **0 times in their bodies** (grep). qa-phase only declares it in allowed-tools (unused). So the fork suppression is a **dead declaration** (latent), not a functional break in bkit.
4. **bkit's orchestrator does not dispatch on `context:fork`** (`lib/skill-orchestrator.js` never surfaces `context`). Only `hooks/startup/context-init.js:149` (debug-log) and the `enh-254` guard read it → low blast radius.

## 2. Goal

Restore the 218 scheduling regression via **explicit intent (No Guessing)** and clean up related hygiene. Deeper architecture redesign (interactivity inside fork) is **out of scope** (user-confirmed A+hygiene).

## 3. Scope (user-confirmed: A+hygiene)

| ID | Item | Priority | Rationale |
|----|------|:--:|------|
| T1 | Add explicit `background: false` to the 9 fork skills | P1 | Direct 218-regression response, backward-safe |
| T2 | Remove unused/fork-incapable `AskUserQuestion` from qa-phase allowed-tools + add a forbidding comment | P2 | #46654/#54892 suppression; prevents future silent break |
| T3 | Fix stale "sole fork user" note at `lib/cc-regression/registry.js:93` → reflect 9 skills | P2 | Correctness |
| T4 | Bump `lib/infra/cc-version-checker.js:42` RECOMMENDED_VERSION '2.1.198'→'2.1.218' (MF-2 CRITICAL) | P2 | Resolve 20-release stale drift |
| T5 | Regression test: assert `background:false` on the 9 fork skills + refresh qa-phase allowed-tools snapshot | P1 | Regression lock |
| T6 | Version bump 2.1.30→2.1.31 (11 files) + CHANGELOG | P1 | Release |
| T7 | Code=docs sync (README, CUSTOMIZATION-GUIDE, AI-NATIVE-DEVELOPMENT, bkit.config.json, .claude-plugin/, hooks/, bkit-system/) | P1 | Requirement #8 |

**Out of scope (watch)**: interactivity-inside-fork architecture redesign (options B/C). Not caused by 218, not an active break. Future separate cycle.

## 4. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| `background:false` causes unwanted behavior in some skills (zero-script-qa live logs) | Foreground for all skills equals pre-218 behavior — no-regression is the safe default. Verify empirically in QA |
| contract test `invocation-inventory.test.js` (9 fork set deepStrictEqual) breaks | `background:false` keeps the fork set unchanged → green. qa-phase allowed-tools change needs a baseline snapshot refresh |
| Impact on CC<218 users | Unknown `background` key is ignored → no impact |
| Missed version-bump surface | Explore enumerated all 11 files; SSoT = bkit.config.json |

## 5. Definition of Done

- [ ] 9 skills have `background: false`, regression test green
- [ ] qa-phase AskUserQuestion declaration cleaned up + comment, baseline refreshed
- [ ] MF-2 · registry · version bump complete
- [ ] `--plugin-dir .` full QA passes, all contract/regression tests green
- [ ] Code=docs across 8 surfaces (0 drift)
- [ ] PR user-approved → merge + GitTag v2.1.31 + Release notes (English)

## 6. Next step
→ Phase 2 Design: exact change spec (per-file diff intent, test plan, docs-sync plan).
