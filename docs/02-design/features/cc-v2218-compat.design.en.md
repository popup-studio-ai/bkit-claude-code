# Design — CC v2.1.218 Compatibility Response (bkit v2.1.31)

> **Feature**: cc-v2218-compat · **PDCA phase**: design · **Plan**: `docs/01-plan/features/cc-v2218-compat.plan.en.md`
> Executable change spec. The Do phase implements this document verbatim.

## 1. Architecture decision (confirmed: A+hygiene + qa-phase option B)

**Grounded finding (issue bodies verified via gh)**: `background: false` restores only scheduling (foreground) — it does **not** restore AskUserQuestion. `context: fork` runs the skill as a **foreground sub-agent**, and AskUserQuestion (+EnterPlanMode/deferred tools) is **stripped at the sub-agent boundary** (#34592 smoking gun; #54892 regression). The only fundamental fix = remove `context: fork` (#54892 workaround).

Therefore:
- **8 producer skills**: keep `context: fork` (isolation benefit) + add `background: false` to restore the 218 scheduling regression. No interactivity needed.
- **qa-phase (option B)**: **remove** `context: fork` → runs in main context → AskUserQuestion restored. The interactive gate already present in qa-phase body lines 63-66 ("*Ask user whether to continue or abort QA phase*" on a PRE-SCAN CRITICAL) is upgraded from **degraded plain-text → real AskUserQuestion**.

## 2. Per-file change spec

### T1 — `background: false` on the 8 producer fork skills (P1)
In each `skills/<name>/SKILL.md` frontmatter, add the line immediately after `context: fork`:
```yaml
context: fork
background: false
```
Targets (8, qa-phase excluded): `phase-1-schema`, `phase-2-convention`, `phase-3-mockup`, `phase-4-api`, `phase-5-design-system`, `phase-8-review`, `zero-script-qa`, `skill-status`.
- zero-script-qa has `context: fork` at line 10 → add on the next line likewise.
- **Do prerequisite check**: confirm bkit's frontmatter parser (`lib/util/frontmatter.js`, `lib/skill-orchestrator.js:parseSkillFrontmatter`) passes the new boolean key `background` harmlessly. The parser stores unknown keys in a raw map via the generic kv loop (:159) and never dispatches on them → expected safe; verify empirically.

### T2 — Remove `context: fork` from qa-phase (option B, P1)
`skills/qa-phase/SKILL.md`:
1. Remove frontmatter line 3 `context: fork` (run in main context). Do NOT add `background:` (not forked → 218 background-default irrelevant).
2. Keep `AskUserQuestion` in allowed-tools (now works in main context).
3. Upgrade the PRE-SCAN gate (current lines 63-66) to **explicitly use AskUserQuestion**: on a CRITICAL finding, ask continue/abort via AskUserQuestion (not plain-text fallback).
- **Caution**: AskUserQuestion must be called directly in qa-phase's own (main) body — delegating it to qa-lead or other sub-agents strips it there too (#34592 "all sub-agent contexts").
- **Isolation-loss tradeoff accepted**: qa-phase now runs in the main conversation context (user-confirmed). QA orchestration is inherently interactive, so main-context execution is in fact the better fit.

### T3 — registry stale note (P2)
`lib/cc-regression/registry.js:93` (MON-CC-06-51165) `notes` "bkit's sole fork user" → reflect current state:
```
notes: "context:fork × disable-model-invocation regression (Windows). One of bkit's 9 context:fork skills (v2.1.31: added background:false opt-out for CC≥2.1.218 background-default)."
```
- (Optional) consider adding a new MON-CC entry tracking the 218 background-default — decide in Do after confirming the registry schema. If added: severity MEDIUM, resolvedAt=v2.1.31 (bkit-side response complete).

### T4 — MF-2 RECOMMENDED_VERSION bump (P2)
`lib/infra/cc-version-checker.js:42`:
```js
const RECOMMENDED_VERSION = '2.1.218';  // was '2.1.198'
```
- Update the doc comment (lines 37-41): keep the Claude 5 alias floor (≥2.1.197) but note the current recommendation is 2.1.218 (bkit now explicitly handles the fork background-default).
- Do NOT add to `FEATURE_VERSION_MAP` (a background-default is not a "feature to enable" but a default change → does not fit the map's inactive-warning semantics). Leave a rationale comment.
- **Side effect**: users on 2.1.198–2.1.217 shift to severity 'warn' (intended recommendation). Installed 2.1.218 = ok.

### T5 — Regression tests (P1) — fork set 9→8
- `test/contract/invocation-inventory.test.js:189-199` `EXPECTED_FORK_SKILLS`: **remove `qa-phase`** → 8. Update the "9 skills" comment (180-183) to 8.
- `test/contract/context-fork-l1.test.js:59` `assert(forkSkills.includes('qa-phase'), ...)` **removed**. `:57` `forkSkills.length >= 8` stays (exactly 8 → green). Update the header comment "9 skills"→8.
- **New assert**: in `context-fork-l1.test.js`, assert each of the 8 fork skills has `background: false` (`/^background:\s*false\b/m`).
- **qa-phase baseline**: `test/contract/scripts/contract-baseline-collect.js` snapshots `context` (:82) → qa-phase changing fork→none makes `contract-test-run.js:96-100` context-unchanged gate flag. **Baseline refresh required** (remove qa-phase's `context` value). Confirm the regeneration procedure in Do (run script vs manual). allowed-tools is not in the baseline (only effort/context/userInvocable/deprecatedIn) → keeping AskUserQuestion is irrelevant to it.
- **New regression**: assert qa-phase does **not** have `context: fork` (prevent reintroduction) + assert it **retains** AskUserQuestion in allowed-tools.

### T6 — Version bump 2.1.30→2.1.31 (P1, 11 files)
| File | Location |
|------|----------|
| `.claude-plugin/plugin.json` | :3 version |
| `.claude-plugin/marketplace.json` | :4, :41 version + :36 narrative (change summary) |
| `bkit.config.json` | :2 version (runtime SSoT) |
| `README.md` | :9 badge, :212 "latest release: v2.1.30" |
| `hooks/hooks.json` | :3 description |
| `hooks/session-start.js` | :3 header comment |
| `hooks/startup/session-context.js` | :2 header comment |
| `bkit-system/components/{skills,agents,scripts}/_*-overview.md` | each banner |
- `lib/core/version.js` FALLBACK_VERSION='2.1.6' is harmless (config takes precedence) → out of scope (comment-check only).
- **CHANGELOG.md**: new `## [2.1.31] - 2026-07-DD` section, Keep-a-Changelog format, matching the v2.1.30 style (Status block + rationale narrative + items).

### T7 — Code=docs sync (P1)
- **README.md**: version badge/text + recommended CC runtime (:185 "v2.1.198") synced with cc-version-checker (reflect 2.1.218 recommendation). Architecture counts (44/34/22) unchanged.
- **CHANGELOG.md**: the new section above.
- **bkit.config.json / .claude-plugin/ / hooks/**: version reflected (T6).
- **bkit-system/**: overview banner version (T6) + fork/background note if warranted.
- **CUSTOMIZATION-GUIDE.md / AI-NATIVE-DEVELOPMENT.md**: grep for content changes beyond version strings in Do (usually version-only).
- CI: confirm `scripts/docs-code-sync.js`, `scripts/check-skills-docs-code-sync.js`, `scripts/validate-plugin.js` pass with 0 drift.

## 3. Test plan (QA phase)
1. Load via `--plugin-dir .`; empirically verify the 9 fork skills' frontmatter parses cleanly (0 SessionStart errors).
2. All contract tests (`test/contract/*`) + regression tests green.
3. qa-phase loads with correct allowed-tools, no errors.
4. `claude -p` confirms a representative skill (e.g. skill-status) runs in foreground.
5. docs-code-sync CI green.

## 4. Commit strategy (requirement #2 — minimal push)
Local commits grouped per completed phase on the single branch; **push once when the PR is ready** (or minimal). Minimize CI triggers. Merge after approval.

## 5. Rollback
All changes are additive/low-risk. On any problem, discard the branch for instant rollback (main unaffected).
