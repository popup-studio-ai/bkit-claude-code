# ADR 0015 — Locale-Scoped Trigger Generation Deferral

> **Status**: Accepted (2026-07-02)
> **Issue**: [#129](https://github.com/popup-studio-ai/bkit-claude-code/issues/129) (proposal 1)
> **Context**: 8-language trigger keyword lists in 32 agent frontmatter descriptions
> **Supersedes/relates**: ADR 0014 (issue-response sibling); v2.1.25 #129 response — compact 8-language trigger encoding (proposal 2, shipped); `test/regression/issue-129-description-budget.test.js`.

---

## 1. Context

Issue #129 identified that bkit's 8-language trigger keyword lists impose an always-resident prompt cost on every session, and offered two mitigations. Proposal 1:

> "At install/setup time (or via a /control option), write agent files whose triggers include only the detected locale + English"

i.e., generate per-user agent files carrying only 2 of the 8 language trigger sets, eliminating the remaining 6 languages' keywords from the prompt surface entirely.

v2.1.25 shipped **proposal 2** instead — compact trigger encoding: agent frontmatter descriptions compacted **30,065 B → 16,919 B (−44%)** across 32 agents (plus `skills/sprint/SKILL.md` 1,074 B → 550 B), using the template "full EN + full KO lists + exactly one anchor keyword per JA/ZH/ES/FR/DE/IT". The deferral of proposal 1 was pre-announced in the v2.1.25 CHANGELOG entry ("to be documented in a follow-up ADR" — this document).

## 2. Decision

**DEFER locale-scoped trigger generation (issue #129 proposal 1). It is not implementable under Claude Code's current plugin model.**

- **CC plugins are immutable versioned marketplace checkouts.** An installed plugin lives at `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/` as a read-only copy of a specific released version. Claude Code provides **no install-time or setup-time file-generation hook** in which bkit could detect the user's locale and write locale-scoped agent files.
- **Per-locale agent files would break git-based updates and contract collection.** Rewriting agent `.md` files post-install would diverge the installed tree from the released tag (breaking marketplace update/refresh semantics), and bkit's invocation-contract baselines are collected from `agents/` — a mutated surface would produce per-user contract drift that L1/L4 gates cannot reason about.
- **Routing is unaffected by the deferral.** bkit's own 8-language intent matching lives in the `lib/intent/language.js` registry (`SUPPORTED_LANGUAGES` = 8 languages + `AGENT_TRIGGER_PATTERNS`), **not** in agent frontmatter descriptions. Trimming description trigger lists (proposal 2) or leaving them locale-complete has no effect on bkit-side routing; only CC's native description-based agent surfacing is touched.

## 3. Consequences

**Positive**
- No false promise: bkit does not ship a mechanism that the host platform cannot support; the limitation and its cause are recorded here instead.
- Routing behavior is unchanged and fully preserved for all 8 languages via the `lib/intent/language.js` registry.
- The realized mitigation (proposal 2, −44%) already captured most of the token savings without any per-user file mutation.

**Negative / limits**
- Non-EN/KO users (JA/ZH/ES/FR/DE/IT) keep only 1 anchor keyword per language in CC-visible descriptions — reduced native-description discoverability compared to a hypothetical locale-scoped build.
- The remaining ~16.9 KB of description triggers stays resident in every session.

**Revisit trigger**: Claude Code gaining install/setup hooks (plugin lifecycle events that can generate files) or per-locale manifest support. Either capability dissolves the core blocker and reopens proposal 1.

## 4. Verification / Citations

- `test/unit/v200-skills.test.js:96-122` — VS-011~015: EN + KO trigger presence is a **mandatory lock** per SKILL.md (the compact template's "full EN + full KO" floor).
- `test/regression/issue-129-description-budget.test.js` — locks the achieved mitigation: ≤700 B per agent description, `Triggers:` block presence, ≤20,000 B total.
- `lib/intent/language.js:10` — `SUPPORTED_LANGUAGES` 8-language registry (routing SoT, independent of descriptions).
- Installed-plugin immutability: `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/` versioned checkout layout (e.g. `bkit-marketplace/bkit/2.1.25/`).

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-07-02 | Initial ADR (issue #129 proposal 1 deferral, v2.1.26 provisional) | kay |
