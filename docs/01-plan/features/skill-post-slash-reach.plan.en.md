# skill-post-slash-reach Planning Document

> **Summary**: Restore bkit's 4 orchestrator side-effects (next-skill guidance, phase auto-advance, decision-trace, audit) on the native slash-command path — which is the ONLY invocation form bkit docs teach — by dual-wiring a shared effects module to CC's purpose-built `UserPromptExpansion` event (empirically confirmed) in addition to the existing `PostToolUse:Skill` path. Fixes GitHub issue #132.
>
> **Project**: bkit Vibecoding Kit (bkit-claude-code)
> **Version**: 2.1.27 (provisional — final version assigned by maintainer at release)
> **Author**: PDCA pipeline (pm-lead PRD → plan)
> **Date**: 2026-07-02
> **Status**: Draft
> **PRD**: [skill-post-slash-reach.prd.en.md](../../00-pm/skill-post-slash-reach.prd.en.md)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | bkit's 4 orchestrator side-effects — next-skill/`suggestedAgent` guidance, `updatePdcaStatus()` phase auto-advance, decision-tracer `phase_transition`, audit-logger `skill_executed` — are wired ONLY to `PostToolUse` `matcher:"Skill"`, which never fires for native slash commands (`/bkit:pdca ...`, the only form bkit docs teach; CC dispatches these as command expansions with no `Skill` tool_use). So for essentially all real usage, the advertised AI-transparency audit trail is empty, decision-trace has no `phase_transition` records, and no orchestrator guidance appears. Same root-cause family as #125/#126; #126 fixed the false warning but left the functionality dead. Two latent defects compound it: the IntentRouter integration in `user-prompt-handler.js` is 100% dead (an undefined `onboardingContext` ReferenceError), and the active-skill-marker is never written on the slash path (breaking Stop-handler dispatch for every non-sprint slash skill). |
| **Solution** | Extract `skill-post.js`'s side-effect glue into a source-agnostic shared module `lib/orchestrator/skill-invocation-effects.js`, then **dual-wire** it: keep `PostToolUse:Skill` for the model-invoked path AND add a NEW `UserPromptExpansion` hook (CC's purpose-built slash-command-expansion event — empirically confirmed firing on v2.1.198 with `command_name`/`command_args`/`command_source:"plugin"`) firing the same effects on the slash path, filtered to bkit-own plugin commands, deduped, fail-open. Update the L5 hook-count invariant in lockstep (21→22 events). Record the slash path as a new `skill_invoked` audit action (pre-execution semantics). Bundle the two free wins. |
| **Function/UX Effect** | `/bkit:pdca do login` (native slash) now produces a `skill_invoked` audit entry, a `phase_transition` decision-trace record, hook-level phase auto-advance (docs-gated), and in-context next-skill/agent guidance. IntentRouter structured suggestions are non-empty again; Stop dispatch fires for non-sprint slash skills. The `Skill`-tool path is unchanged; older CC treats the new hook as inert (no regression). |
| **Core Value** | Make the advertised audit/decision-trace/guidance work for the way people actually use bkit, harden hook-based enforcement (differentiators #1 Memory Enforcer / #2 Defense Layer 6 rely on hooks firing on real paths), and repay two latent dead-code defects — as a dual-wired, deduped, fail-open, CI-green, docs=code, no-version-bump release. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | The primary documented usage path (native slash commands) silently bypasses every orchestrator side-effect; bkit's advertised "AI transparency" audit trail is empty for real users. |
| **WHO** | Every bkit user invoking skills via `/bkit:<skill>` (the documented form); repeat reporter @hslee-cmyk (also #125/#126); maintainers relying on `/audit`/decision-trace. |
| **RISK** | The fix ADDS a hook event → the L5 count invariant (21 events) must move to 22 in exact lockstep or CI goes red; `UserPromptExpansion` can block expansion → fail-open is mandatory; double-firing if a skill is both slash-typed and Skill-tool-invoked → dedup required. |
| **SUCCESS** | After the fix, a native `/bkit:pdca <action> <feature>` (reproduced via `claude -p --plugin-dir .`) produces a `skill_invoked` audit entry + `phase_transition` decision + next-skill guidance; the 2 free wins verified; zero new CI failures; L5 invariant green at 22 events. |
| **SCOPE** | NEW `lib/orchestrator/skill-invocation-effects.js` · NEW `UserPromptExpansion` hook + handler · `skill-post.js` refactor to call the shared module · `user-prompt-handler.js` onboardingContext fix + slash detection · active-skill-marker slash repair · hooks.json + L5 SoT (21→22) · tests · docs + CHANGELOG. |

---

## 1. Overview

### 1.1 Purpose

Ship v2.1.27 so that bkit's orchestrator side-effects (guidance, phase advance, decision-trace, audit) fire on the native slash-command path — the primary documented usage — via CC's purpose-built `UserPromptExpansion` event, without regressing the existing `Skill`-tool path and without a version bump.

### 1.2 Background

- **Root cause (3-way confirmed, `.bkit/research/issue-132-diagnosis.md`)**: `skill_executed` is written only at `skill-post.js:192`; `orchestrateSkillPost` called only at `skill-post.js:179`; `recordDecision(phase_transition)` only from skill-post.js; all wired to `PostToolUse matcher:"Skill"` (`hooks.json:67`). CC native slash commands emit no `Skill` tool_use (documented; my own system prompt confirms `<command-name>` = already-loaded).
- **Fix foundation (empirical, `.bkit/research/issue-132-reproduction-log.md` R2, CC v2.1.198)**: `UserPromptExpansion` fires for `/bkit:pdca status` → `command_name:"bkit:pdca"` (namespaced), `command_args:"status"` (string), `command_source:"plugin"` (clean bkit-own filter); plain text does NOT fire (zero false-positives). `UserPromptSubmit` also sees the raw prompt but has no structured fields (undocumented for slash → not used).
- **Change surface (`.bkit/research/issue-132-codebase-audit.md`)**: all 4+1 side-effects computable from `(skillName, args)` at expansion time (`orchestrateSkillPost`'s result arg is a no-op `{}`); primitives already lib-level; glue lives only in `skill-post.js:175-230`. Adding a hook event breaks the L5 count invariant (SoT `docs-code-invariants.js:22` + `EXPECTED_HOOK_EVENT_NAMES`). Two free wins: `user-prompt-handler.js:296` `onboardingContext` ReferenceError (IntentRouter dead); `writeActiveSkill` dead on slash → Stop `SKILL_HANDLERS` dispatch fails for non-sprint slash skills.
- **User decisions (2026-07-02)**: full-auto through pre-merge; dual-wire (root fix, no tech debt); audit action = **`skill_invoked`** for the slash/pre-exec path (semantic accuracy); **fail-open strict** (never block expansion); the remaining internal decisions (module location, filter, canary key) delegated to the design toward the no-tech-debt option.

### 1.3 Related Documents

- PRD: `docs/00-pm/skill-post-slash-reach.prd.{en,ko}.md`
- Research: `.bkit/research/issue-132-{diagnosis,web-research,codebase-audit,reproduction-log}.md`
- Family: #125/#126 (v2.1.24 namespace + hook-reachability); memory `issue-125-126-response`

---

## 2. Scope

### 2.1 In Scope

- [ ] FR-01 NEW `lib/orchestrator/skill-invocation-effects.js` — `runSkillInvocationEffects(skillName, args, {source})`, extracted from `skill-post.js:175-230` (source-agnostic; returns `{suggestions}`)
- [ ] FR-02 NEW `UserPromptExpansion` hook + handler script, firing the shared effects on the slash path, filtered to `command_source==='plugin'` + `getSkillConfig(normalizeSkillName(command_name))` resolvable; fail-open (any error → exit 0, never block)
- [ ] FR-03 `skill-post.js` refactored to call the shared module (PostToolUse:Skill path preserved); dedup so a skill both slash-typed and Skill-tool-invoked in one turn does not double-record
- [ ] FR-04 L5 hook-count invariant lockstep: `hooks.json` +1 event/block; `lib/domain/rules/docs-code-invariants.js` hookEvents 21→22 (+ hookBlocks) + `EXPECTED_HOOK_EVENT_NAMES` += `UserPromptExpansion`; `invocation-inventory.test.js` count assertions
- [ ] FR-05 Fix `onboardingContext` ReferenceError in `user-prompt-handler.js:296` (restores IntentRouter structured suggestions)
- [ ] FR-06 Repair `writeActiveSkill` on the slash path (restores Stop `SKILL_HANDLERS` dispatch for non-sprint slash skills)
- [ ] FR-07 Audit action = new `skill_invoked` for the slash/pre-exec path (add to audit action taxonomy/CATEGORIES as needed); `skill_executed` retained for the Skill-tool path
- [ ] FR-08 Reachability canary: do NOT reuse the `skill_post` key from the new path (preserve #57317/#126 monitor); Design decides new key vs none (lean: no new key unless it adds real observability without gold-plating)
- [ ] FR-09 Tests: shared-module unit; UserPromptExpansion handler unit (incl. non-plugin/plain-text no-fire, fail-open); dedup; 2 free-win regressions (onboardingContext, active-skill Stop dispatch); L5 count update
- [ ] FR-10 Docs: README/CUSTOMIZATION-GUIDE note that slash-path orchestration/audit now works; bilingual pairs for any new `docs/` file
- [ ] FR-11 Version-floor / graceful degradation: UPE confirmed on 2.1.198; on CC lacking the event the hook is inert = no regression; HPQ path-quoting for the new hook command
- [ ] FR-12 CHANGELOG provisional `[Unreleased — v2.1.27]` entry (ENH number = next free)

### 2.2 Out of Scope

- Bumping any version field (maintainer decision at release)
- Fixing the `Skill`-tool path (it already works — only the slash path is dead)
- Adding a dedicated CC `SlashCommand` tool event (CC #29607 closed-as-dup: does not exist)
- Rewriting every SKILL.md to move side-effects into prose (rejected fallback — non-deterministic; hook-based is CC's sanctioned deterministic pattern)
- Raising the CC install floor (older CC degrades gracefully, no hard requirement)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Extract side-effects → `lib/orchestrator/skill-invocation-effects.js` (source-agnostic) | High | Pending |
| FR-02 | NEW UserPromptExpansion hook+handler firing effects on slash path, `command_source==='plugin'` + resolvable-skill filter, fail-open | High | Pending |
| FR-03 | Preserve PostToolUse:Skill path via the shared module + dedup | High | Pending |
| FR-04 | L5 hook-count invariant lockstep 21→22 (hooks.json + SoT + EXPECTED_HOOK_EVENT_NAMES + L5 assertion) | High | Pending |
| FR-05 | Fix onboardingContext ReferenceError (restore IntentRouter) | High | Pending |
| FR-06 | Repair active-skill-marker on slash path (restore Stop dispatch) | High | Pending |
| FR-07 | New `skill_invoked` audit action for slash/pre-exec; keep `skill_executed` for Skill-tool | Medium | Pending |
| FR-08 | Reachability canary: never reuse `skill_post` key from new path | Medium | Pending |
| FR-09 | Tests: shared module + UPE handler + dedup + 2 free-win regressions + L5 count | High | Pending |
| FR-10 | Docs note (slash-path orchestration works) + CHANGELOG | Medium | Pending |
| FR-11 | Graceful degradation on older CC + HPQ path-quoting for new hook | Medium | Pending |
| FR-12 | CHANGELOG provisional entry (next free ENH) | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Zero regression (Skill-tool) | PostToolUse:Skill side-effects unchanged | l2-smoke + existing skill-orchestrator/audit tests |
| CI integrity | All gates green incl. updated L5 invariant (22 events) | Local full run + Actions on push |
| Fail-open | Any handler error → exit 0, expansion never blocked | Unit test injecting a throw |
| No double-fire | One logical invocation → one audit/decision record | Dedup unit test (both events in a turn) |
| Path-quoting | New hook command `${CLAUDE_PLUGIN_ROOT}` double-quoted | HPQ-001..011 |
| Docs=Code | Zero drift incl. hook count SoT | docs-code-sync + bkit-full-system |
| Canary integrity | `skill_post` key not stamped from the new path | hook-reachability test |
| Live acceptance | Native slash produces skill_invoked+phase_transition+guidance | `claude -p --plugin-dir .` probe (QA) |
| Bilingual | New docs/ files `.en.md`+`.ko.md` in sync | Review |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] SC-1: `claude -p "/bkit:pdca do <feature>" --plugin-dir .` (native slash) → a `skill_invoked` audit entry is written (verifiable via `bkit_audit_search`/audit file) + a `phase_transition` decision-trace record + next-skill guidance appears in the injected context
- [ ] SC-2: Free win A — IntentRouter structured suggestions are non-empty for a slash command (onboardingContext ReferenceError gone)
- [ ] SC-3: Free win B — Stop `SKILL_HANDLERS` dispatch fires for a non-sprint slash-invoked skill (active-skill marker written on the slash path)
- [ ] SC-4: Skill-tool path unchanged — a raw `Skill` tool invocation still records `skill_executed` + fires all effects (no regression); no double-record when both paths occur
- [ ] SC-5: Fail-open — a handler throw does not block the command (exit 0)
- [ ] SC-6: L5 invocation-inventory green at 22 hook events / updated blocks; full CI-mirror suite green; qa-aggregate no new failures vs main
- [ ] SC-7: Gap analysis ≥ 90% (target 100%); QA_PASS
- [ ] SC-8: docs=code zero drift; CHANGELOG provisional entry; PR opened; merge awaits USER APPROVAL → then tag v2.1.27 + GitHub Release (EN)

### 4.2 Quality Criteria

- [ ] No new dead code; domain purity green; English-only implementation (docs/ bilingual excepted)
- [ ] Contract baselines byte-identical (no agent/model change this release)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| L5 count invariant not updated exactly in lockstep with hooks.json | High | Certain if missed | FR-04 explicit; run invocation-inventory + docs-code-sync before push |
| UserPromptExpansion blocks a command on a handler bug | High | Low | Fail-open strict (FR-11): wrap all logic, any error → exit 0, never emit `decision:"block"` |
| Double-firing (slash-typed skill also Skill-tool-invoked in same turn) | Medium | Low | Dedup on `prompt_id`/session in the shared module (FR-03) |
| Older CC lacks UserPromptExpansion → fix inert | Low (no regression) | Medium | Graceful: hook silently doesn't fire = current behavior; documented (FR-11); no floor bump |
| New `skill_invoked` action breaks an audit consumer/test asserting only known actions | Medium | Low | Add to the audit action taxonomy/CATEGORIES; grep tests for action-enum assertions (related+similar sweep) |
| Reachability canary conflation weakens #57317 monitor | Medium | Low | FR-08: never reuse `skill_post` key |
| GitHub Actions free-tier burn | Low | Medium | Single milestone push |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change |
|----------|------|--------|
| `lib/orchestrator/skill-invocation-effects.js` | NEW lib | Shared side-effect runner |
| `scripts/user-prompt-expansion-handler.js` (name per Design) | NEW hook script | Slash-path trigger, fail-open |
| `scripts/skill-post.js` | Refactor | Call shared module; keep PostToolUse:Skill trigger + skill_post canary ping |
| `scripts/user-prompt-handler.js` | Fix | onboardingContext ReferenceError |
| `hooks/hooks.json` | Hook wiring | + UserPromptExpansion event/block |
| `lib/domain/rules/docs-code-invariants.js` | SoT | hookEvents 21→22 (+blocks) + EXPECTED_HOOK_EVENT_NAMES |
| `lib/audit/audit-logger.js` (CATEGORIES/action) | Audit taxonomy | + `skill_invoked` |
| active-skill-marker call on slash path | Behavior | writeActiveSkill on slash |
| `test/contract/invocation-inventory.test.js` + others | Tests | count 21→22 + new units |
| README / CUSTOMIZATION-GUIDE / CHANGELOG / bkit-system | Docs | slash-path note + hook count |

### 6.2 Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| skill-post side-effects | FIRE | PostToolUse:Skill → skill-post.js | Refactored to shared module (behavior-preserving) |
| hook count | ASSERT | invocation-inventory L5 vs docs-code-invariants SoT | Breaking unless lockstep (FR-04) |
| `${CLAUDE_PLUGIN_ROOT}` commands | ASSERT | HPQ path-quoting | New hook command must be double-quoted |
| audit action enum | READ/ASSERT | bkit_audit_search, /audit, tests | New `skill_invoked` must be registered |
| skill_post reachability | STAMP | hook-reachability canary | Must NOT be stamped from new path (FR-08) |
| IntentRouter route() | CALL | user-prompt-handler.js:296 | ReferenceError fixed → suggestions now populate |
| Stop SKILL_HANDLERS | DISPATCH | unified-stop.js via active-skill marker | Now fires for non-sprint slash skills |

### 6.3 Verification

- [ ] Do-phase related+similar sweep: grep for all `matcher:"Skill"` wirings, all `writeActiveSkill` callers, audit action-enum assertions, hook-count assertions
- [ ] No auth/permission surface; no version bump; contract baselines untouched (no agent/model change)

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

bkit plugin internal — Enterprise-grade repo conventions (Clean Architecture lib/, contract gates L1–L5).

### 7.2 Key Architectural Decisions (settled)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Wiring topology | **Dual-wire** (UserPromptExpansion slash path + keep PostToolUse:Skill model path) | Root fix covering both invocation paths; no tech debt (user directive) |
| Slash trigger event | **UserPromptExpansion** | CC purpose-built, empirically confirmed structured signal + self-filtering; UserPromptSubmit undocumented for slash |
| Audit action (slash) | **`skill_invoked`** (new) | Pre-execution semantics; keeps `skill_executed` accurate for the Skill-tool path (user decision) |
| Hook safety | **Fail-open strict** | Never block a user's command on a handler bug (user decision) |
| bkit-own filter | `command_source==='plugin'` + resolvable skill | Empirically confirmed value; avoids firing on `/simplify` etc. |
| Shared module home | `lib/orchestrator/skill-invocation-effects.js` | Cohesive with intent-router + next-action-engine already in lib/orchestrator |
| Reachability key | No reuse of `skill_post`; new key only if it adds real observability | Preserve #57317/#126 monitor; avoid gold-plating (Design to finalize) |
| hooks.json change | Required (+1 event) → L5 SoT lockstep | Documented, purpose-built event is worth the invariant update |

### 7.3 Clean Architecture Approach

New shared module is an application/orchestrator-layer function composing existing lib primitives (audit, decision-tracer, pdca status, skill-orchestrator, core marker). Hooks/scripts are adapters. check-domain-purity must stay green; no domain→outer dependency added.

---

## 8. Convention Prerequisites

- [x] English implementation; docs/ bilingual pairs; no version bump (CLAUDE.md)
- [x] Hook path-quoting (HPQ) + hook-count SoT (`docs-code-invariants.js`)
- [x] ENH numbering: next free (after ENH-370) — check CHANGELOG during Do
- [x] Contract baselines: no agent/model change → must stay byte-identical

---

## 9. Next Steps

1. [ ] Design document (`docs/02-design/features/skill-post-slash-reach.design.{en,ko}.md`) — 3 options + full I-list + verification checklist (architecture already settled at §7.2; Design finalizes module API, dedup key, canary decision, exact hooks.json shape)
2. [ ] Then full-auto: Do (team) → analyze/iterate (100%) → QA (live `claude -p --plugin-dir .` slash probe) → docs sync → single push → CI → PR → USER APPROVAL → merge → tag v2.1.27 → GitHub Release

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-07-02 | Initial draft from PRD + 4 research files + user decisions (dual-wire, skill_invoked, fail-open) | PDCA pipeline |
