# skill-post-slash-reach Design Document

> **Summary**: Dual-wire bkit's orchestrator side-effects to CC's `UserPromptExpansion` event (slash path) in addition to `PostToolUse:Skill` (model path), via a shared `lib/orchestrator/skill-invocation-effects.js` module. Slash path records a new `skill_invoked` audit action, is fail-open, and is filtered to `command_source==='plugin'`. Bundles two free wins (onboardingContext ReferenceError, active-skill-marker Stop repair). L5 hook-count invariant moves 21→22 events / 24→25 blocks in lockstep. Fixes issue #132.
>
> **Project**: bkit Vibecoding Kit · **Version**: 2.1.27 (provisional) · **Author**: PDCA pipeline · **Date**: 2026-07-02
> **Status**: Approved (architecture settled at Plan §7.2; user decisions: dual-wire / skill_invoked / fail-open, 2026-07-02)
> **Planning Doc**: [skill-post-slash-reach.plan.en.md](../../01-plan/features/skill-post-slash-reach.plan.en.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | The primary documented usage path (native slash commands) silently bypasses every orchestrator side-effect; bkit's advertised audit trail is empty for real users. |
| **WHO** | Every bkit user invoking `/bkit:<skill>`; reporter @hslee-cmyk (#125/#126 family); maintainers relying on `/audit`. |
| **RISK** | L5 count invariant (21 events) must move to 22 in exact lockstep; UserPromptExpansion can block expansion → fail-open mandatory; double-fire dedup. |
| **SUCCESS** | Native slash produces `skill_invoked` audit + `phase_transition` decision + next-skill guidance; 2 free wins verified; L5 green at 22 events; zero new CI failures. |
| **SCOPE** | NEW effects module + NEW UserPromptExpansion handler + skill-post refactor + onboardingContext fix + active-skill slash repair + hooks.json/SoT 21→22 + audit skill_invoked + tests + docs. |

---

## 1. Overview

### 1.1 Design Goals

1. bkit's 4 orchestrator side-effects fire on the native slash-command path (the documented primary usage), via CC's purpose-built, empirically-confirmed `UserPromptExpansion` event.
2. Zero regression for the existing `Skill`-tool (`PostToolUse:Skill`) path; one shared implementation, two adapters.
3. Fail-open: a handler bug must never block a user's slash command.
4. Two latent defects repaid for free (IntentRouter ReferenceError, Stop-dispatch active-skill regression).
5. Every dependent surface (hook-count SoT, audit taxonomy, tests, docs) moves in lockstep; no version bump.

### 1.2 Design Principles

- **No Guessing**: the fix is grounded in R2 empirical reproduction (UserPromptExpansion fires on v2.1.198 with `command_source:"plugin"`, `command_name:"bkit:pdca"`, `command_args:"status"`). The Do agent MUST re-read `skill-post.js` fully before extracting.
- **Behavior-preserving extraction**: `skill-post.js:175-230` moves verbatim into the shared module; the Skill-tool path calls it identically.
- **Fail-open + self-filtering**: the new handler acts only for `command_source==='plugin'` + resolvable bkit skill; any error → exit 0, never `decision:"block"`.

---

## 2. Architecture Options

### 2.0 Comparison

| Criteria | A: Doc-only | B: SKILL.md prose (LLM-performed) | **C: Dual-wire UserPromptExpansion (Selected)** |
|----------|:-:|:-:|:-:|
| Fixes functionality | No | Partial (non-deterministic) | **Yes (deterministic)** |
| Enforcement | none | LLM-followed | **hook-level** |
| Files touched | ~2 | ~44 SKILL.md | ~13 |
| CC-sanctioned | — | fallback only | **purpose-built event** |
| Tech debt | leaves bug | prose drift ×44 | **none** |

**Selected: C** — CC docs explicitly position hooks as the deterministic enforcement mechanism ("If a skill seems to stop influencing behavior… use hooks"). Dual-wire covers both invocation paths. (User directive: no tech debt, root fix.)

### 2.1 Component Diagram

```
NATIVE SLASH:  user types /bkit:pdca do login
  → CC UserPromptExpansion event { command_name:"bkit:pdca", command_args:"do login", command_source:"plugin", prompt }
    → scripts/user-prompt-expansion-handler.js  (NEW; fail-open)
        filter: command_source==='plugin' && getSkillConfig(normalizeSkillName(command_name)) exists
        → runSkillInvocationEffects("pdca", {action:"do",feature:"login"}, {source:'slash-command', dedupeKey:"<session_id>:pdca:do:login"})
        → emit next-skill guidance on STDOUT (exit 0)

MODEL-INVOKED: Claude calls Skill tool
  → CC PostToolUse(Skill) event { tool_input:{skill,args} }
    → scripts/skill-post.js  (refactored)
        → runSkillInvocationEffects("pdca", {...}, {source:'skill-tool', dedupeKey:"<session_id>:pdca:do:login"})  ← same module, same key derivation
        + skill_post reachability canary ping (kept here only)

SHARED:  lib/orchestrator/skill-invocation-effects.js
  runSkillInvocationEffects(skillName, args, {source, dedupeKey}):
    1. dedup guard (skip if dedupeKey already processed this session)
    2. writeActiveSkill({skill:skillName})                          ← repairs Stop dispatch (free win B)
    3. orchestrateSkillPost(skillName,{},{args}) → suggestions
    4. audit.writeAuditLog({action: source==='slash-command' ? 'skill_invoked' : 'skill_executed', ...})
    5. if getSkillConfig(skillName)['pdca-phase']:
         recordDecision(phase_transition) + updatePdcaStatus(feature,phase)  (requireDocs-gated)
    return { suggestions }
```

### 2.2 Data Flow — filtering & dedup

```
UserPromptExpansion payload → command_source==='plugin'? ──no→ exit 0 (not bkit's; e.g. /simplify)
                                     │yes
  skillName = normalizeSkillName(command_name)   // "bkit:pdca" → "pdca"
  getSkillConfig(skillName) exists? ──no→ exit 0 (unknown skill)
                                     │yes
  args = parseInvocationArgs(command_args)        // "do login" → {action:"do", feature:"login"}
  dedupeKey = session_id:skillName:action:feature   // content-derived, matches across BOTH paths (I-10)
  dedup already seen? ──yes→ exit 0 (defensive; slash & Skill-tool are normally mutually exclusive)
                       │no → runSkillInvocationEffects(...) → stdout guidance
```

### 2.3 Dependencies

| Component | Depends on | Note |
|---|---|---|
| skill-invocation-effects.js | orchestrateSkillPost/getSkillConfig, audit-logger, decision-tracer, pdca status-core, active-skill-marker, skill-name | all existing lib primitives |
| UserPromptExpansion handler | shared module + readStdinSync (lib/core/io) | fail-open wrapper |
| L5 test | docs-code-invariants SoT | 21→22 / 24→25 lockstep |

---

## 3. Data Model — audit `skill_invoked`

New audit action for the pre-execution slash path:
```
{ actor:'system', actorId:'skill-invocation', action:'skill_invoked', category:'skill'(→control per audit-logger normalization),
  target:skillName, targetType:'skill', result:'success', destructiveOperation:false, meta:{ source:'slash-command', action, feature } }
```
`skill_executed` retained verbatim for the Skill-tool path. Add `skill_invoked` to the audit action taxonomy (audit-logger.js known-actions / any enum) so `bkit_audit_search` and action-asserting tests accept it.

---

## 4. Interface Changes (I-list — gap-analysis reference)

| # | File | Change |
|---|---|---|
| I-1 | `lib/orchestrator/skill-invocation-effects.js` (NEW) | `runSkillInvocationEffects(skillName, args, {source, dedupeKey})` — lift `skill-post.js:175-230` glue: dedup guard → writeActiveSkill → orchestrateSkillPost → writeAuditLog(action per source) → (if pdca-phase) recordDecision + updatePdcaStatus. Returns `{suggestions}`. Pure composition of existing lib primitives; no domain→outer violation. |
| I-2 | `scripts/skill-post.js` | Replace inline `:175-230` with a call to I-1 (`source:'skill-tool'`, `dedupeKey` from payload session/tool_use id). KEEP the `skill_post` reachability canary ping here ONLY (do not move to the new path). Behavior-preserving for the Skill-tool path. |
| I-3 | `scripts/user-prompt-expansion-handler.js` (NEW) | UserPromptExpansion hook script: `readStdinSync`; **fail-open** (entire body in try/catch → any error → `process.exit(0)`, never emit `decision:"block"`); filter `input.command_source==='plugin'` AND `getSkillConfig(normalizeSkillName(input.command_name))` truthy; parse `input.command_args` (string) via shared `parseInvocationArgs` → `{action,feature}`; call I-1 (`source:'slash-command'`, `dedupeKey:input.prompt_id`); print returned next-skill guidance to STDOUT (the UserPromptExpansion context-injection contract — NOT additionalContext); exit 0. |
| I-4 | `hooks/hooks.json` | Add `UserPromptExpansion` event with one block, one hook: `node "${CLAUDE_PLUGIN_ROOT}/scripts/user-prompt-expansion-handler.js"` (HPQ double-quoted). No matcher (fire for all expansions; the handler self-filters). |
| I-5 | `lib/domain/rules/docs-code-invariants.js` | `hookEvents` 21→**22**; `hookBlocks` 24→**25**; `EXPECTED_HOOK_EVENT_NAMES` += `'UserPromptExpansion'` (:98 array). Update the block-count comment (:23). |
| I-6 | `test/contract/invocation-inventory.test.js` | Hook-count assertions: events 21→22, blocks 24→25 (PostToolUse stays 3, PreToolUse stays 2, +1 rest). Any TC listing event names += UserPromptExpansion. |
| I-7 | `lib/audit/audit-logger.js` | `skill_invoked` is recorded via the audit-logger's **pass-through action path** — the SAME mechanism `skill_executed` uses today (verified: `skill_executed` is NOT in `ACTION_TYPES`; the normalizer at `audit-logger.js:381` accepts any `entry.action` and maps unknown categories to `'control'` at :382). **Therefore do NOT add `skill_invoked` to `ACTION_TYPES`** (that enum has pre-existing inconsistent length assertions — AL-007 expects 29, NG-006 expects 16 — and touching it is out of #132 scope). No `audit-logger.js` code change is required for validation/search; the action string flows through. Do-agent confirms the pass-through by reading :375-385 before relying on it. |
| I-8 | `scripts/user-prompt-handler.js` + `lib/orchestrator/intent-router.js` | FREE WIN A (two parts): (a) fix the `onboardingContext` ReferenceError at ~:296 (define it — likely `const onboardingContext = ''` or the intended onboarding string, matching the `route()` signature) so IntentRouter `structuredSuggestions` populate instead of always `[]`; Do-agent reads the function fully to supply the correct value (No Guessing). (b) **Widen the intent-router slash regex** at `intent-router.js:55` from `/^\s*\/([\w-]+)(?:\s+(.+))?$/` to also accept the `:` namespace (e.g. `[\w:-]+`) so bkit's own namespaced commands `/bkit:pdca do login` are recognized by the command branch (currently excluded). Read the command-branch handling fully first — verify widening does not misroute non-bkit commands. This makes SC-2 satisfiable for the namespaced form; pin the I-12 SC-2 regression to `/bkit:pdca`. |
| I-9 | (in I-1) active-skill marker | FREE WIN B: `writeActiveSkill({skill:skillName})` runs inside I-1 → written on BOTH paths → repairs Stop `SKILL_HANDLERS` dispatch for non-sprint slash skills. (skill-post.js currently writes it at :175; moving into I-1 keeps the Skill-tool path and adds the slash path.) |
| I-10 | (in I-1) dedup | **Content-derived dedup key computable from BOTH payloads** (NOT `prompt_id`, which exists only in the UserPromptExpansion payload — a prompt_id key could never match across paths). Use `dedupeKey = session_id + ':' + skillName + ':' + action + ':' + feature` (session_id present in both UserPromptExpansion and PostToolUse payloads; skillName/action/feature derived identically in both). Record the last processed key in a `.bkit/runtime/` last-invocation-key file; skip if identical within the same session. Primarily defensive: a native slash invocation fires ONLY UserPromptExpansion and a model invocation fires ONLY PostToolUse:Skill (mutually exclusive per logical invocation), so true cross-path double-fire is rare — but the content-derived key makes SC-4/NFR-4 ("no double-record when both paths occur") genuinely enforceable rather than same-path-only. Each caller (skill-post.js, UPE handler) passes the derived key; the shared module owns the compare+store. |
| I-11 | reachability canary | Do NOT stamp `skill_post` from the new path (preserve #57317/#126 monitor). DECISION: no new reachability key this release (the slash path's effects are directly test-verifiable; adding a key would expand the hook-reachability classifier + HR-010 for marginal value). `lib/core/hook-reachability.js` unchanged. |
| I-12 | Tests (NEW/edited) | `test/unit/skill-invocation-effects.test.js` (I-1: all 4+1 effects, skill_invoked vs skill_executed by source, dedup, pdca-phase gating); `test/unit/user-prompt-expansion-handler.test.js` (plugin-filter, non-plugin no-fire, plain-text no-fire, fail-open on throw, args parse, stdout guidance); regression for I-8 (IntentRouter suggestions non-empty) + I-9 (active-skill written on slash); L5 count update (I-6). Follow issue-NNN/standalone conventions; `check-test-tracking` green. |
| I-13 | Docs | README/CUSTOMIZATION-GUIDE: note that slash-path skills now emit audit/decision-trace/guidance (hook-based, both paths). bkit-system hook-count refs 21→22 where present. CHANGELOG `[Unreleased — v2.1.27]` + **ENH-371**. AI-NATIVE-DEVELOPMENT hook-count refs if any. No new docs/ guide file expected (so no bilingual pair needed unless one is added). |

### 4.1 Explicitly unchanged (regression guards)

- Contract baselines (both dirs) — NO agent/model change → byte-identical.
- `Skill`-tool path behavior — I-2 is behavior-preserving; l2-smoke + skill-orchestrator/audit tests must stay green.
- Version fields — untouched (maintainer bumps at release).
- `skill_post` reachability key — not reused (I-11).
- `PostToolUse:3` / `PreToolUse:2` block sub-counts — unchanged (new block is a "rest" event).

---

## 5. Verification Checklist (gap-detector target)

### 5.1 Core fix
- [ ] I-1 shared module exists, composes the 5 effects, returns `{suggestions}`; `skill_invoked` when source='slash-command', `skill_executed` when 'skill-tool'
- [ ] I-2 skill-post.js calls I-1; skill_post canary ping retained; Skill-tool path behavior identical
- [ ] I-3 UserPromptExpansion handler: fail-open (try/catch → exit 0), plugin-filter + resolvable-skill filter, arg parse, stdout guidance
- [ ] I-4 hooks.json UserPromptExpansion block present, HPQ-quoted
- [ ] I-5 SoT hookEvents 22, hookBlocks 25, EXPECTED_HOOK_EVENT_NAMES += UserPromptExpansion
- [ ] I-6 invocation-inventory 22/25 green
- [ ] I-7 skill_invoked registered in audit taxonomy
### 5.2 Free wins + guards
- [ ] I-8 (a) onboardingContext defined (IntentRouter no longer throws); (b) intent-router regex widened to accept `:` → `/bkit:pdca` recognized; SC-2 regression uses `/bkit:pdca` and gets non-empty suggestions
- [ ] I-9 writeActiveSkill on slash path; Stop dispatch fires for a non-sprint slash skill
- [ ] I-10 dedup guard; no double-record
- [ ] I-11 skill_post key not stamped from new path; hook-reachability unchanged
### 5.3 Tests + docs + global
- [ ] I-12 new units + regressions green; check-test-tracking green
- [ ] I-13 docs synced (README/CUSTOMIZATION-GUIDE/bkit-system hook counts/CHANGELOG ENH-371)
- [ ] Full CI-mirror suite green (contract L1/L4 both baselines byte-identical, l2-smoke, l2-hook-attribution, l3, L5 22/25, security, units, docs-code-sync, check-deadcode, domain-purity, HPQ, bkit-full-system, validate-plugin, qa-aggregate no new failures)
- [ ] Related+similar sweep clean: all `matcher:"Skill"` wirings, all `writeActiveSkill` callers, audit action-enum assertions, hook-count assertions

---

## 6. Error Handling

| Condition | Behavior |
|---|---|
| UserPromptExpansion handler throws | try/catch → `process.exit(0)`; expansion proceeds; command NEVER blocked (fail-open) |
| command_source !== 'plugin' | no-op exit 0 (not bkit's command — e.g. `/simplify`) |
| skill not resolvable via getSkillConfig | no-op exit 0 (unknown/local command) |
| same prompt_id already processed | dedup skip (no double record) |
| older CC lacks UserPromptExpansion | hook never fires = current behavior = no regression |
| updatePdcaStatus without docs | existing requireDocs gate blocks premature advance (self-protecting) |

---

## 7. Security Considerations

- New hook is fail-open and read-only on the prompt; writes only to `.bkit/` audit/state (same as existing handlers). No permission/auth surface. HPQ path-quoting enforced (I-4). No version/manifest key change.

---

## 8. Test Plan

| Layer | Target | Tool |
|---|---|---|
| L1 | contract L1/L4 both baselines (byte-identical), security, units (I-12) | node runners |
| L2 | l2-smoke (skill-post refactor), l2-hook-attribution | node |
| L3 | l3-mcp (unaffected — regression only) | node |
| L5 | invocation-inventory 22/25 (I-6) | node |
| Live (QA) | `claude -p "/bkit:pdca do <f>" --plugin-dir .` → skill_invoked audit + phase_transition + guidance (SC-1); non-plugin `/simplify` no bkit audit (filter); Skill-tool path still skill_executed (SC-4); fail-open probe | claude CLI |
| Release gates | docs-code-sync, bkit-full-system, validate-plugin, check-deadcode, domain-purity, HPQ, qa-aggregate diff vs main | scripts |

---

## 9. Clean Architecture

| Component | Layer | Location |
|---|---|---|
| runSkillInvocationEffects | Application/Orchestrator | lib/orchestrator/skill-invocation-effects.js |
| UserPromptExpansion handler | Adapter (hook script) | scripts/user-prompt-expansion-handler.js |
| skill-post refactor | Adapter (hook script) | scripts/skill-post.js |
| hook-count SoT | Domain rules | lib/domain/rules/docs-code-invariants.js |
| audit taxonomy | Infrastructure | lib/audit/audit-logger.js |

Dependency rule: the new orchestrator module composes existing lib primitives (audit/decision/status/core) — same layer or inward. check-domain-purity must stay green.

---

## 10. Coding Convention Reference

- English-only; no version bump; ENH-371 (verified next-free).
- HPQ: new hook command `node "${CLAUDE_PLUGIN_ROOT}/scripts/…"` double-quoted.
- New test files pass check-test-tracking (git add before gate).
- Do-agent MUST read skill-post.js + user-prompt-handler.js + orchestrateSkillPost fully before editing (No Guessing; esp. the onboardingContext intended value + updatePdcaStatus feature/phase derivation).

---

## 11. Implementation Guide

### 11.1 Module Map

| Module | Scope Key | Description | Turns |
|--------|-----------|-------------|:-----:|
| Shared effects + skill-post refactor | `module-1` | I-1, I-2, I-10 (dedup), I-9 (active-skill in module) | 10-15 |
| UserPromptExpansion handler + wiring | `module-2` | I-3, I-4, I-5, I-6 (hooks.json + SoT + L5 lockstep) | 10-15 |
| Audit taxonomy + free win A | `module-3` | I-7 (skill_invoked), I-8 (onboardingContext) | 5-8 |
| Tests | `module-4` | I-12 (units + regressions + L5) | 12-18 |
| Docs + wrap | `module-5` | I-13, full gates, live QA probe, gap analysis | 10-15 |

### 11.2 Recommended Session Plan

Single session via `/pdca do` with team split (module-1/2/3 have coupling on the shared module → sequential-ish; module-4/5 after). If context runs low, split after module-2 (state in Task Management + memory + this doc).

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-07-02 | Initial — dual-wire UserPromptExpansion (architecture settled at Plan §7.2 + user decisions) | PDCA pipeline |
