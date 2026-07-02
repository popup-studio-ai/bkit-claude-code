---
template: pm-prd
version: 1.0
description: PM PRD phase document — Context Anchor + 8-section PRD for bkit v2.1.27 skill-post-slash-reach (issue #132)
variables:
  - feature: skill-post-slash-reach
  - date: 2026-07-02
  - author: kay kim (bkit maintainer)
  - targetRelease: v2.1.26 → v2.1.27
---

# skill-post-slash-reach PRD

> **Feature**: `skill-post-slash-reach`
> **Issue**: [#132](https://github.com/popup-studio-ai/bkit-claude-code/issues/132) (reporter: @hslee-cmyk; same slash-path-coverage family as #125/#126)
> **Phase**: PM / PRD (pre-Plan)
> **Date**: 2026-07-02
> **Author**: kay kim (bkit maintainer)
> **Target release**: v2.1.26 → v2.1.27
> **Scale**: Internal developer-tool correctness release (bkit plugin). PM frameworks intentionally scaled down — no consumer GTM.
> **Research basis**: `.bkit/research/issue-132-diagnosis.md` (3-way-confirmed root cause), `.bkit/research/issue-132-web-research.md` (CC `UserPromptExpansion` spec + ranked fixes), `.bkit/research/issue-132-reproduction-log.md` (empirical R2 on CC v2.1.198), `.bkit/research/issue-132-codebase-audit.md` (change surfaces + 2 free wins). This PRD is synthesis only; the four research files are authoritative and are not re-derived here.

---

## 0. Context Anchor (preserve — copy into every downstream phase)

| Key | Value |
|-----|-------|
| **WHY** | `scripts/skill-post.js` is wired ONLY to `PostToolUse` `matcher: "Skill"` (`hooks.json:67`), so its 4 orchestrator side-effects — (1) next-skill / suggested-agent guidance via `orchestrateSkillPost`, (2) `updatePdcaStatus` hook-level phase auto-advance, (3) decision-tracer `phase_transition` record, (4) audit-logger `skill_executed` entry — fire ONLY when a bkit skill is invoked as a raw `Skill` tool_use. But native slash commands (`/bkit:pdca …` — the ONLY invocation form bkit docs teach) expand at the CLI layer and emit **no** `Skill` tool_use → all 4 side-effects are DEAD for the primary, documented usage path. The advertised "AI transparency" audit trail is empty for real usage; decision-trace and next-skill guidance never fire; the hook-level phase-advance safety net never runs. This is the SAME root-cause family as #125/#126 (slash-command-path coverage) — #126 suppressed the visible *warning* but left the *functionality* dead (its Option-1 was never implemented). Empirically, CC v2.1.198 ships a purpose-built `UserPromptExpansion` event that DOES fire on the native slash path with structured `command_name="bkit:pdca"` / `command_args="status"` / `command_source="plugin"` (R2, zero false-positives on plain text) — the confirmed fix foundation. |
| **WHO** | (1) **EVERY bkit user who invokes skills via slash commands** — i.e. the documented, primary path — currently silently gets no audit trail, no decision-trace, no next-skill guidance, and no hook-level phase auto-advance. (2) **Repeat reporter @hslee-cmyk** (also filed #125/#126) — the contributor most closely tracking slash-path correctness. (3) **This agent / model-invoked path** — invokes skills via the raw `Skill` tool (the non-documented path), which is why side-effects appear to work in-session and masked the bug. (4) **Maintainer (kay kim)** — owns the L5 hook-count invariant that any new hook event forces into lockstep. Stakeholder / decision-maker: kay kim (bkit maintainer). |
| **RISK** | (a) **L5 hook-count invariant lockstep must be EXACT** — adding `UserPromptExpansion` to `hooks.json` moves `hookEvents` 21→22 and touches `EXPECTED_HOOK_EVENT_NAMES` + `docs-code-invariants` SoT; any mismatch turns CI red. (b) **Double-fire** if a skill is BOTH slash-typed and `Skill`-tool-invoked in the same turn → must dedup on `prompt_id`/session. (c) **`UserPromptExpansion` can block expansion** — the hook MUST be fail-open (any error → exit 0, no block) so a bug never swallows a user's command. (d) **Older-CC graceful degradation** — `UserPromptExpansion` confirmed on 2.1.198 but bkit install floor is lower; on CC lacking the event the hook is silently inert = today's dead state = no regression, but must be documented and must not hard-bump the version floor. (e) **Canary conflation** — reusing the `skill_post` hook-reachability key from the new path would weaken the #57317/#126 drop-detection monitor. |
| **SUCCESS** | After the fix, a native `/bkit:pdca <action> <feature>` (reproduced with `claude -p --plugin-dir .`) produces a `skill_invoked`/`skill_executed` audit entry + a `phase_transition` decision-trace record + next-skill guidance — on the SLASH path, not just the `Skill`-tool path. The two bundled free wins are verified: (a) the `onboardingContext` `ReferenceError` is fixed so IntentRouter suggestions are non-empty; (b) `active-skill-marker` is written on the slash path so Stop-handler dispatch fires for a non-sprint slash skill. Zero regression for the `Skill`-tool path and all existing hooks; no double-firing when both events fire; the L5 count invariant is green at **22 events**; all CI gates green; docs = code; no version bump until the maintainer approves; single-branch minimal-push delivery. |
| **SCOPE** | **In**: extract `skill-post.js:175-230` side-effects into a source-agnostic shared lib module (recommend `lib/orchestrator/skill-invocation-effects.js`); add a NEW `UserPromptExpansion` hook firing those side-effects on the slash path, filtered to `command_source === 'plugin'` + a resolvable bkit skill; keep the existing `PostToolUse:Skill` path working (dedup); L5 hook-count invariant lockstep (21→22 events + SoT + `EXPECTED_HOOK_EVENT_NAMES`); fix the `onboardingContext` `ReferenceError` (free win); repair `active-skill-marker` on the slash path (free win); HPQ path-quoting for the new hook command; version-floor / graceful-degradation handling; new unit + regression tests; README / CUSTOMIZATION-GUIDE note (bilingual where under `docs/`); CHANGELOG. **Out**: moving side-effects into 44 SKILL.md prose files (rejected — loses hook enforcement, huge surface); relying on `UserPromptSubmit` to parse slash strings (rejected — undocumented for the slash path, cannot filter non-bkit commands); reusing the `skill_post` canary key from the new path (rejected — weakens #57317 monitor); a hard CC-version-floor bump (rejected — graceful degradation instead); bumping the project version (maintainer's call). |

---

## 1. Executive Summary

| Perspective | Summary |
|-------------|---------|
| **Problem** | bkit's four orchestrator side-effects (next-skill/agent guidance, phase auto-advance, `phase_transition` decision-trace, `skill_executed` audit) are wired only to `PostToolUse:Skill`, which never fires on native slash commands — the ONLY invocation form bkit docs teach. So for every real user the advertised "AI transparency" audit trail is empty, decision-trace and next-skill guidance never run, and hook-based enforcement (bkit differentiations #1 Memory Enforcer / #2 Defense Layer 6) is dead on the primary path. Same root-cause family as #125/#126; #126 fixed the false-positive warning but left the functionality dead. |
| **Solution** | Extract the side-effects into a source-agnostic shared lib module, then dual-wire it: keep `PostToolUse:Skill` for the model-invoked path AND add a NEW `UserPromptExpansion` hook (CC's purpose-built slash event, empirically confirmed on v2.1.198) firing the same effects on the slash path, filtered to `command_source==='plugin'` + a resolvable bkit skill, deduped so both events never double-fire. Update the L5 hook-count invariant in lockstep (21→22). Bundle two free wins uncovered by the audit: fix the `onboardingContext` `ReferenceError` (restores IntentRouter) and repair `active-skill-marker` on the slash path (restores Stop dispatch). |
| **Function / UX effect** | A user runs `/bkit:pdca do login`; from that moment the slash path produces an audit entry, a `phase_transition` record, and next-skill guidance in-context — the same orchestration model-invoked skills already got, now for real usage. Behind the scenes, IntentRouter suggestions are non-empty again and Stop-handler dispatch fires for non-sprint slash skills. The `Skill`-tool path is unchanged; older CC simply sees the new hook as inert (no regression). |
| **Core value** | Restore the advertised AI-transparency audit trail + orchestrator guidance for the way people actually use bkit, and harden hook-based enforcement (differentiations #1/#2 depend on hooks firing on real paths) — delivered as a dual-wired, deduped, CI-green, docs=code, no-version-bump release that also repays two latent dead-code defects for free. |

---

## 2. Problem / Opportunity

### 2.1 Current state vs desired state

| Area | Current (v2.1.26) | Desired (v2.1.27) |
|------|-------------------|-------------------|
| Slash-path orchestration | `/bkit:pdca …` emits no `Skill` tool_use → `skill-post.js` never runs → 0 of 4 side-effects fire on the documented path | `UserPromptExpansion` fires the same 4 side-effects on the slash path |
| Audit trail (`skill_executed`) | Sole writer `skill-post.js:192`; empty for all real (slash) usage; `/audit` & `bkit_audit_search` show no skill records | Slash invocations produce a `skill_invoked`/`skill_executed` audit entry (semantics decided in Design) |
| Decision-trace (`phase_transition`) | `recordDecision` called only from `skill-post.js`; no entries on slash path | Slash invocations record `phase_transition` when the skill has a `pdca-phase` |
| Next-skill / suggested-agent guidance | `orchestrateSkillPost` reached only via `Skill` tool; no guidance after a slash skill | Guidance emitted on STDOUT on the slash path (pre-execution, same turn) |
| Hook-level phase auto-advance | `updatePdcaStatus(feature,phase)` dead on slash (SKILL.md prose still self-updates, so tracking mostly survives) | Hook-level safety-net runs on the slash path (self-protected by `requireDocs` gate) |
| Side-effect location | Inline glue in `skill-post.js:175-230` (single-source, `Skill`-tool-only) | Extracted to a source-agnostic shared lib module; both paths call one implementation |
| L5 hook-count invariant | `hookEvents: 21`; `EXPECTED_HOOK_EVENT_NAMES` has no `UserPromptExpansion` | `hookEvents: 22`; SoT + `EXPECTED_HOOK_EVENT_NAMES` updated in lockstep; CI green |
| IntentRouter integration | `user-prompt-handler.js:296` passes undefined `onboardingContext` → `ReferenceError` → caught → `structuredSuggestions` always `[]` → 100% dead code | `ReferenceError` fixed; IntentRouter suggestions non-empty |
| `active-skill-marker` on slash | `writeActiveSkill` dead on slash → `unified-stop.js` `SKILL_HANDLERS` silently fail for all non-sprint slash skills | Marker written on the slash path → Stop dispatch fires |
| CC-version handling | n/a | `UserPromptExpansion` confirmed 2.1.198; on older CC the hook is silently inert (no regression); documented graceful degradation |

### 2.2 Opportunity framing

- **The bug hits 100% of real usage, silently.** bkit teaches only the slash form; the model-invoked `Skill`-tool path (where side-effects work) is what this agent uses in-session, which is exactly why the defect stayed masked. Fixing the slash path is not an edge case — it is restoring the advertised behavior for the entire user base.
- **This is a correctness fix that HARDENS the two headline differentiators.** bkit #1 (Memory Enforcer) and #2 (Defense Layer 6) are sold as *deterministic hook-based enforcement*; if the enforcing hook never fires on the path users actually take, the differentiation is hollow. The fix strengthens exactly the claims bkit competes on — it is neutral/strengthening, not an ENH candidate.
- **The file is already open — take the two free wins.** The codebase audit surfaced two independent dead-code defects on the same slash path: the `onboardingContext` `ReferenceError` (IntentRouter 100% dead) and the `active-skill-marker` → Stop-dispatch regression (non-sprint slash skills' Stop handlers silently fail). Both are cheap, both are the same "dead-on-slash" family, and bundling them repays the debt at the moment the code is under the microscope.
- **The empirical foundation is already laid.** R2 removed every "verify-before-ship" unknown: the event fires on 2.1.198, `command_source==='plugin'` gives a clean bkit-own filter, `command_name` is namespaced, `command_args` is a plain string reusable by the existing `parseSkillInvocation` split. The remaining work is engineering discipline (extraction, dual-wire, dedup, invariant lockstep), not discovery.

---

## 3. Users & Segments

Segmented by how each population experiences the dead side-effects and the fix.

| Segment | Experience today | This release |
|---------|------------------|--------------|
| **S1 — Every bkit user (slash path)** | Uses `/bkit:pdca …` as taught; silently gets no audit trail, no decision-trace, no next-skill guidance, no hook-level phase-advance | Slash invocations now produce audit + decision-trace + guidance + phase-advance |
| **S2 — @hslee-cmyk (repeat reporter)** | Filed #132 after #125/#126; observed `skill_post` frozen on native `/bkit:pdca report` while a raw `Skill` call updated it | The functional fix #126 deferred (Option-1) is finally implemented; slash path fully wired |
| **S3 — Model-invoked / this-agent path** | Invokes skills via the `Skill` tool → side-effects already work → masked the bug | Unchanged (NFR-1); dedup guarantees no double-fire when a turn triggers both events |
| **S4 — Maintainer (kay kim, CI/governance)** | Owns L5 invariant, SoT, EXPECTED_HOOK_EVENT_NAMES, #57317 canary monitor | Invariant updated to 22 in lockstep; canary integrity preserved (no `skill_post` key reuse) |

---

## 4. Value Proposition

**For** every bkit user who invokes skills the documented way — native slash commands (`/bkit:pdca …`)
**who** silently receives none of bkit's advertised orchestration (no audit trail, no decision-trace, no next-skill guidance, no hook-level phase-advance) because those side-effects only fire on the undocumented `Skill`-tool path,
**the** skill-post-slash-reach release **is a** correctness / hardening release
**that** extracts the side-effects into a source-agnostic shared module and fires them on the slash path via CC's purpose-built `UserPromptExpansion` event (deduped against the existing `Skill`-tool path),
**unlike** #126 — which suppressed the misleading warning but left the functionality dead — or moving logic into 44 SKILL.md prose files (which would forfeit deterministic hook enforcement),
**our release** restores the AI-transparency audit trail and orchestrator guidance for real usage and hardens the hook-based enforcement that bkit differentiations #1/#2 depend on, **while guaranteeing zero regression** for the `Skill`-tool path and older CC, and requiring no version bump until the maintainer approves.

| VP component | bkit-specific content |
|--------------|-----------------------|
| Gain creators | Real audit trail on `/audit` & `bkit_audit_search`; `phase_transition` decision-trace on the slash path; in-context next-skill guidance same turn; hook-level phase-advance safety-net; IntentRouter suggestions live again; Stop dispatch fires for non-sprint slash skills |
| Pain relievers | No more silently-empty audit for real usage; no false confidence that hook enforcement runs; no two lingering dead-code defects; no L5-invariant surprise (updated in lockstep); no double-fire; no regression on older CC |
| Products/services | Shared `skill-invocation-effects` module, new `UserPromptExpansion` hook (plugin-filtered, dedup, fail-open), preserved `PostToolUse:Skill` path, L5 lockstep update, `onboardingContext` fix, `active-skill-marker` slash repair, canary-key decision, new unit + regression tests, README/CUSTOMIZATION-GUIDE note, CHANGELOG |

---

## 5. Requirements

> FR = functional (what the release must deliver). NFR = non-functional (quality bars). Final *choices* inside FR-2/FR-7/FR-8 are framed in §6 and settled in Design; the FR mandates that the release resolve them. Root-cause and change-surface facts are sourced from the four research files and not re-derived here.

### 5.1 Functional Requirements

| ID | Requirement | Primary surface (from audit) |
|----|-------------|------------------------------|
| **FR-1** | **Extract side-effects to a source-agnostic shared lib module.** Lift `skill-post.js:175-230` (writeActiveSkill, orchestrateSkillPost, writeAuditLog, recordDecision, updatePdcaStatus) into a single reusable `runSkillInvocationEffects(name, args, { source })` implementation callable from BOTH the `Skill`-tool path and the slash path. All primitives are already lib-level reusable; the 2nd `result` arg to `orchestrateSkillPost` is a no-op `{}`, so every effect is computable from `(skillName, args)` alone. | NEW `lib/orchestrator/skill-invocation-effects.js` (recommended §6-c); `scripts/skill-post.js` refactored to call it |
| **FR-2** | **NEW `UserPromptExpansion` hook on the slash path.** Add a `UserPromptExpansion` hook that fires the shared side-effects, filtered to `command_source === 'plugin'` AND a resolvable bkit skill (`getSkillConfig(normalizeSkillName(command_name))`). Parse `command_args` (a plain string on this path) with the existing `parseSkillInvocation` split → `{action, feature}`. Emit next-skill guidance via plain STDOUT (the sanctioned injection channel for this event). MUST be fail-open (see NFR-3). | `hooks.json` (+1 event/block), NEW handler script (or extend `user-prompt-handler.js`) |
| **FR-3** | **Keep the `PostToolUse:Skill` path working (model-invoked, deduped).** The existing `Skill`-tool path continues to fire the shared effects unchanged; add dedup so a single turn that triggers BOTH `UserPromptExpansion` and `PostToolUse:Skill` records each effect at most once (dedup key on `prompt_id`/session). | `scripts/skill-post.js`, dedup guard in the shared module |
| **FR-4** | **L5 hook-count invariant lockstep.** Adding `UserPromptExpansion` moves `hookEvents` 21→22; update the SoT (`docs-code-invariants.js` `hookEvents` + block count), `EXPECTED_HOOK_EVENT_NAMES` (+`UserPromptExpansion`), and any invocation-inventory L5 assertion in the SAME changeset so CI never sees a partial state. | `docs-code-invariants.js:22,98-104`, invocation-inventory L5 gate |
| **FR-5** | **Fix `onboardingContext` `ReferenceError` (free win).** `user-prompt-handler.js:296` references undefined `onboardingContext` → `ReferenceError` → caught → `structuredSuggestions` always `[]` (IntentRouter 100% dead). Fix so IntentRouter suggestions are non-empty. | `scripts/user-prompt-handler.js:296` |
| **FR-6** | **Repair `active-skill-marker` on the slash path (free win).** `writeActiveSkill` is dead on slash → `unified-stop.js` `SKILL_HANDLERS` silently fail for every non-sprint slash skill. Write the marker on the slash path so Stop dispatch fires. (Naturally satisfied if FR-1's shared module — which includes `writeActiveSkill` — is called from the slash path.) | `active-skill-marker.js` via shared module; verified against `unified-stop.js` dispatch |
| **FR-7** | **Audit action semantics — decision for Design.** Because `UserPromptExpansion` fires PRE-execution, the slash-path audit action may be `skill_invoked` (pre) rather than the existing post-exec `skill_executed`. Design decides one consistent scheme (see §6-b). | `lib/audit/audit-logger.js`; audit action constant |
| **FR-8** | **Reachability canary key — decision for Design.** Do NOT reuse the `skill_post` hook-reachability key from the new path (conflates loaders, weakens the #57317/#126 drop-detection monitor). Design picks a distinct key or none (see §6-e). | `hook-reachability.js:36-39`, `hook-reachability.test.js` HR-010 |
| **FR-9** | **Tests.** Add: (a) new unit tests for the shared `runSkillInvocationEffects` module (both `source` values); (b) a `UserPromptExpansion` handler test (plugin filter, arg parse, fail-open, guidance STDOUT); (c) regression tests for the two free wins (IntentRouter suggestions non-empty; Stop dispatch fires for a non-sprint slash skill); (d) a dedup test (both events, single record). | `test/**` new + updated fixtures |
| **FR-10** | **Docs.** Note in README + CUSTOMIZATION-GUIDE that slash-path orchestration/audit now works; bilingual (`.en.md` + `.ko.md`) where the file lives under `docs/`. | README, CUSTOMIZATION-GUIDE, `docs/` bilingual pairs |
| **FR-11** | **Version-floor / graceful-degradation handling.** `UserPromptExpansion` confirmed on 2.1.198; on older CC the hook is silently inert = today's dead state = no regression. Do NOT hard-bump the CC version floor; document the graceful degradation and the exact intro version if determinable. | Docs note; no floor bump |
| **FR-12** | **CHANGELOG.** Add a CHANGELOG entry covering the slash-path side-effect restoration, the dual-wire + dedup, the L5 lockstep, and the two free wins. Version heading is provisional/unreleased per repo rule. | `CHANGELOG.md`, PR description |

### 5.2 Non-Functional Requirements

| ID | Requirement | Verification |
|----|-------------|--------------|
| **NFR-1** | **Zero regression for the `Skill`-tool path + all existing hooks** — model-invoked skill invocations still fire all side-effects exactly as before. | `PostToolUse:Skill` path smoke; existing hook suite green |
| **NFR-2** | **All CI gates green incl. the updated L5 count invariant** — invocation-inventory L5 passes at 22 events; no baseline/invariant left red. | GitHub Actions run green; L5 asserts 22 |
| **NFR-3** | **Fail-open on the new hook** — any error in the `UserPromptExpansion` handler exits 0 and never blocks the user's command expansion. | Handler error-injection test → exit 0, no `decision:"block"` |
| **NFR-4** | **No double-firing when both events fire** — a single turn triggering both `UserPromptExpansion` and `PostToolUse:Skill` records each effect at most once. | Dedup test on `prompt_id`/session |
| **NFR-5** | **HPQ path-quoting compliance for the new hook command** — every `${CLAUDE_PLUGIN_ROOT}` in the new `hooks.json` command is double-quoted (HPQ-001..011). | HPQ gate; grep audit of the new command |
| **NFR-6** | **docs = code, zero drift** — README/CUSTOMIZATION-GUIDE note, SoT, and `EXPECTED_HOOK_EVENT_NAMES` match the shipped hooks.json. | Manual + grep audit vs shipped files |
| **NFR-7** | **No version bump until maintainer approval** — `plugin.json` version untouched; CHANGELOG heading provisional/unreleased. | Diff review — version field unchanged |
| **NFR-8** | **Single-branch, minimal-push delivery** — all changes on one branch; the hooks.json event add + SoT + `EXPECTED_HOOK_EVENT_NAMES` + L5 assertion land as one atomic changeset so CI never sees a partial state. | Branch/PR structure review |
| **NFR-9** | **Canary integrity preserved** — the #57317/#126 `skill_post` drop-detection key is not stamped from the new path. | `hook-reachability.test.js` HR-010 expected-set unchanged for `skill_post` |
| **NFR-10** | **Bilingual docs completeness** — every new/edited `docs/` file ships as matched `.en.md` + `.ko.md` siblings, in sync. | Sibling-pair presence + content-parity review |

---

## 6. Key Decisions to be made in Design

> The PRD deliberately leaves the final pick to Design; each decision lists framed options + the deciding tension. All are grounded in the four research files.

**(a) Wiring topology — `UserPromptExpansion`-only vs dual-wire.**
- Option A1 (research rank 1, PRIMARY): `UserPromptExpansion` only.
- Option A2 (research rank 2, RECOMMENDED for completeness): dual-wire — `UserPromptExpansion` for the slash path AND keep `PostToolUse:Skill` for the model-invoked path, deduped on `prompt_id`/session.
- Deciding tension: single-event simplicity (A1) vs full coverage of BOTH invocation forms (A2). Recommend A2: model-invoked usage (this-agent path) is real and must keep working; dedup makes it safe.

**(b) Audit action name — `skill_invoked` vs `skill_executed`.**
- Option B1: emit `skill_invoked` on the pre-execution slash path (semantically accurate; web research §Q5 recommends this) and keep `skill_executed` on the post-exec `Skill`-tool path.
- Option B2: unify both paths under `skill_executed` for a single searchable action name (simpler `/audit` queries; slightly loses the pre/post distinction).
- Deciding tension: semantic precision (B1) vs audit-query simplicity (B2). Must be consistent with FR-3 dedup so a dual-fired turn does not emit both names for one invocation.

**(c) Shared module location — `lib/orchestrator/skill-invocation-effects.js` vs alternative.**
- Option C1 (recommended): NEW `lib/orchestrator/skill-invocation-effects.js` exporting `runSkillInvocationEffects(name, args, { source })`.
- Option C2: colocate under an existing module (e.g. extend `lib/skill-orchestrator.js`).
- Deciding tension: a dedicated, clearly-named source-agnostic module (C1) vs fewer new files (C2). Recommend C1 for discoverability and single-responsibility.

**(d) bkit-own command filter — `command_source==='plugin'` + namespace vs config-resolution.**
- Option D1: filter on `command_source === 'plugin'` AND `command_name` starts with the bkit namespace.
- Option D2: filter on `command_source === 'plugin'` AND `getSkillConfig(normalizeSkillName(command_name))` resolves (rejects a plugin command that is not a real bkit skill).
- Deciding tension: cheap prefix check (D1) vs authoritative resolution (D2). Recommend D2 (or D1∧D2) so the hook never fires effects for a plugin command that has no bkit skill config.

**(e) Reachability canary key — distinct key vs none.**
- Option E1: introduce a NEW distinct reachability key for the `UserPromptExpansion` path.
- Option E2: no canary stamp from the new path.
- Deciding tension: monitoring the new path's health (E1) vs minimal surface and zero risk to the `skill_post` #57317 monitor (E2). Hard constraint either way: do NOT reuse the `skill_post` key (NFR-9).

---

## 7. Risks & Mitigations

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| R1 | **L5 invariant lockstep must be exact** — adding `UserPromptExpansion` (21→22) without updating SoT + `EXPECTED_HOOK_EVENT_NAMES` + the L5 assertion turns CI red | High | FR-4 + NFR-8: land hooks.json event + SoT + names + L5 assertion as ONE atomic changeset; verify invocation-inventory asserts 22 before merge |
| R2 | **Double-fire** if a skill is both slash-typed and `Skill`-tool-invoked in one turn | Med | FR-3 / NFR-4 dedup on `prompt_id`/session; dedup unit test covering the both-events case |
| R3 | **`UserPromptExpansion` blocks expansion** — a handler bug could swallow the user's command | High | NFR-3 fail-open: any error → exit 0, never emit `decision:"block"`; error-injection test |
| R4 | **Older-CC regression** — the new event doesn't exist on CC below the intro version | Low | FR-11 graceful degradation: absent event = inert hook = today's dead state = no regression; documented, no hard floor bump |
| R5 | **Canary conflation** — stamping `skill_post` from the new path weakens #57317/#126 drop detection | Med | FR-8 / NFR-9: distinct key or none; HR-010 expected-set for `skill_post` unchanged |
| R6 | **Audit-action inconsistency** — mixing `skill_invoked`/`skill_executed` fragments `/audit` queries | Low | FR-7 / §6-b: pick one consistent scheme in Design; align with dedup so one invocation → one action name |
| R7 | **HPQ non-compliance** — the new hook command's `${CLAUDE_PLUGIN_ROOT}` unquoted → path-with-spaces failure | Low | NFR-5: double-quote every `${CLAUDE_PLUGIN_ROOT}`; HPQ gate |
| R8 | **Free-win scope creep** — bundling FR-5/FR-6 balloons the change | Low | Both are the same dead-on-slash family, small, and naturally satisfied by FR-1's shared module (FR-6) / a one-line fix (FR-5); each gets its own regression test (FR-9) |
| R9 | **Bilingual drift** — README/GUIDE note ships in one language or drifts | Low | NFR-10 sibling-pair + content-parity review before merge |

---

## 8. Success Criteria & Release-Notes Plan

### 8.1 Measurable success criteria

| SC | Criterion | Measure |
|----|-----------|---------|
| SC-1 | Slash-path side-effects fire | `/bkit:pdca <action> <feature>` via native slash (reproduced with `claude -p --plugin-dir .`) produces a `skill_invoked`/`skill_executed` audit entry AND a `phase_transition` decision-trace record AND next-skill guidance |
| SC-2 | Free win #1 — IntentRouter live | IntentRouter `structuredSuggestions` are non-empty after the `onboardingContext` fix (regression test) |
| SC-3 | Free win #2 — Stop dispatch | `unified-stop.js` `SKILL_HANDLERS` dispatch fires for a non-sprint slash skill (marker written on slash path) |
| SC-4 | `Skill`-tool path unchanged | Model-invoked skill invocation still fires all side-effects; no double-fire when both events trigger in one turn |
| SC-5 | L5 count invariant green at 22 | invocation-inventory L5 passes with `hookEvents: 22`; SoT + `EXPECTED_HOOK_EVENT_NAMES` match |
| SC-6 | Fail-open verified | Error injected into the `UserPromptExpansion` handler → exit 0, no `decision:"block"`, command still expands |
| SC-7 | No new CI failures | qa-aggregate / GitHub Actions shows no new failures vs the pre-release baseline; HPQ green |
| SC-8 | Canary integrity | `skill_post` reachability key not stamped from the new path; HR-010 expected-set unchanged |
| SC-9 | docs = code, zero drift | README/CUSTOMIZATION-GUIDE note present (bilingual under `docs/`); version field unchanged; CHANGELOG entry present |

### 8.2 Release-notes plan (internal dev-tool correctness scope)

- **Channel**: CHANGELOG.md entry + PR description. No external marketing (internal correctness release).
- **Advisory content**: why slash-path side-effects were dead (`PostToolUse:Skill` never fires on native slash), how `UserPromptExpansion` restores them, the dual-wire + dedup design, the L5 lockstep (21→22), and the two free wins (IntentRouter, Stop dispatch). Note the graceful degradation on older CC and that this completes the functional fix #126 deferred.
- **Rollout**: single-branch, minimal-push; the hooks.json event + SoT + `EXPECTED_HOOK_EVENT_NAMES` + L5 assertion land as one atomic unit so CI never sees a partial state; version number left to the maintainer per repo rule.
- **Post-release watch**: confirm real (slash) usage now produces audit + decision-trace entries; confirm no double-fire reports; confirm the #57317 `skill_post` monitor still detects genuine drops; the cc-version-analysis rolling state continues to track the exact `UserPromptExpansion` intro version vs the install floor.

---

## Attribution

PM framework scaffolding (Context Anchor, JTBD-style VP, segmentation) integrates patterns from [pm-skills](https://github.com/phuryn/pm-skills) by Pawel Huryn (MIT License), scaled down for an internal developer-tool correctness release. All technical facts are sourced from the four research files cited in the header (`issue-132-diagnosis.md`, `issue-132-web-research.md`, `issue-132-reproduction-log.md`, `issue-132-codebase-audit.md`); no facts are re-derived in this PRD.

**Next step**: `/pdca plan skill-post-slash-reach` (this PRD is auto-referenced by the Plan phase).
