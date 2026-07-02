---
template: pm-prd
version: 1.0
description: PM PRD phase document — Context Anchor + 8-section PRD for bkit v2.1.26 v2126-issue-response
variables:
  - feature: v2126-issue-response
  - date: 2026-07-02
  - author: kay kim (bkit maintainer)
  - targetRelease: v2.1.25 → v2.1.26
---

# v2126-issue-response PRD

> **Feature**: `v2126-issue-response`
> **Phase**: PM / PRD (pre-Plan)
> **Date**: 2026-07-02
> **Author**: kay kim (bkit maintainer)
> **Target release**: v2.1.25 → v2.1.26
> **Scale**: Internal developer-tool maintenance release (bkit plugin). PM frameworks intentionally scaled down — no consumer GTM.
> **Research basis**: `.bkit/research/v2126-reproduction-log.md` (R1 root cause, reproduced on CC v2.1.198), `.bkit/research/v2126-web-research.md` (official CC plugin/MCP spec + ranked fixes), `.bkit/research/v2126-codebase-audit.md` (change surfaces + efforts). This PRD is synthesis only; the three research files are authoritative and are not re-derived here.

---

## 0. Context Anchor (preserve — copy into every downstream phase)

| Key | Value |
|-----|-------|
| **WHY** | bkit's repo-root `.mcp.json` **dual-loads**: correctly as the plugin MCP manifest (where `${CLAUDE_PLUGIN_ROOT}` expands), and incorrectly as project-scope shared config whenever the bkit checkout is the cwd. In project context `CLAUDE_PLUGIN_ROOT` is undefined, so the bare `bkit-pdca`/`bkit-analysis` entries cannot resolve their command path → `/plugin` shows **"Needs attention: bkit-analysis / bkit-pdca MCP ✗ failed"** on a quality-focused plugin. Alongside this MAIN issue sit accumulated maintenance debts: release-tooling drift (`release-plugin-tag.sh` step 6 uses a broken `claude plugin tag` call), governance debt (ADR 0011's 21-key whitelist is stale vs the current official schema), a deferred locale-scoping decision needing an ADR of record (0015), an un-baselined eval SOP, and test hygiene — this very session's Stop hook surfaced fixture sprint `sc05-test` leaking into real `.bkit` state. |
| **WHO** | (1) **bkit developers** — hit the `/plugin` "Needs attention" panel every session in the repo cwd; also the population whose state integrity the F4 guard protects. (2) **Cloners / anyone whose cwd contains the plugin checkout** — bare entries stay `⏸ Pending approval` then `✗ failed` (v2.1.196 self-approval ignored in untrusted workspaces). (3) **Marketplace users** — `plugin:bkit:*` stays ✔ Connected; unaffected by the MAIN bug, but benefit from the hardened repo-as-project experience and clean release tooling. Stakeholder / decision-maker: kay kim (bkit maintainer). |
| **RISK** | (a) **validate-pass ≠ load-pass** — `claude plugin validate` accepts the `mcpServers` key and does not check referenced-file existence; only a manual packed-plugin smoke (`/plugin` + `claude mcp list`) proves the fix loads. (b) MS-011~015 assume `.mcp.json` at root; other tests or docs may carry the same path assumption. (c) Tag-convention drift — adopting `{name}--v{version}` alongside plain `vX.Y.Z` tags risks parallel-format confusion and breaks tag continuity / gh-release / push instructions. (d) F4 test-isolation is deeper than 5 files: `batch-orchestrator.js:64-66` hardcodes PROJECT_DIR, and the sprint-status registry writer + audit-logger don't fully honor an injected `projectRoot` (evidence: tmp-root tests still leaked `sc05-test`). |
| **SUCCESS** | A fresh `claude mcp list` run in the repo shows **ZERO** bare `bkit-pdca`/`bkit-analysis` entries and **zero** MCP config diagnostics warnings; `/plugin` "Needs attention" is cleared; the installed `plugin:bkit:*` servers stay ✔ Connected; the release script `--dry-run` is green end-to-end; qa-aggregate shows no new failures; and running the 5 fixed tests leaves `.bkit` **byte-identical**. docs = code, zero drift; **no version bump** until the maintainer approves; single-branch, minimal-push delivery. |
| **SCOPE** | **In**: relocate the plugin MCP declaration off the root `.mcp.json` filename (inline in `plugin.json` or a renamed separate file — Design picks); regression lock (no root `.mcp.json` + MS test update + packed smoke); fix `release-plugin-tag.sh` step 6 + refresh `cc-version-checker.js` pluginTagCommand; reconcile ADR 0011 whitelist vs current schema; author ADR 0015 (locale-scoped deferral, bilingual); author eval re-baseline SOP guide (bilingual, 32 frozen fields untouched); ship the test-isolation guard (batch-orchestrator `projectRoot` injectability + registry/audit root honoring + 5 test files → tmp-root); local `.bkit` cleanup (non-shipped, documented procedure); 45-vs-44 skills counting clarification; release advisory + CHANGELOG. **Out**: rewriting server bootstrap; adopting relative `./servers/...` args (rejected — breaks installs); the `${CLAUDE_PLUGIN_ROOT:-…}` default hack (rejected — silences the parse error but the server still fails); editing the 32 frozen eval fields; bumping the project version (maintainer's call); any marketplace-facing behavior change. |

---

## 1. Executive Summary

| Perspective | Summary |
|-------------|---------|
| **Problem** | bkit's repo-root `.mcp.json` is loaded both as the plugin MCP manifest AND as project-scope config, and in the project role `${CLAUDE_PLUGIN_ROOT}` is undefined — so `/plugin` reports "Needs attention: bkit-pdca / bkit-analysis MCP ✗ failed" for developers and cloners on a plugin whose whole value proposition is quality. Around this sit release-tooling drift, a stale ADR whitelist, a missing ADR of record, an un-baselined eval SOP, and test state leakage. |
| **Solution** | A maintenance release with one MAIN fix and five follow-ups: (MAIN) relocate the MCP declaration off the `.mcp.json` filename so it is only ever read in plugin context, locked by a regression test + manual packed smoke; (F1) fix the release-tag step; (F2/F3/F5-as-ADR) pay down governance debt with a reconciled whitelist, an ADR of record, and an eval SOP guide; (F4) ship a test-isolation guard so bkit-developer state stops leaking; plus a local cleanup, a skills-count doc note, and a release advisory. |
| **Function / UX effect** | Developers and cloners open the repo and see a clean `/plugin` panel and a clean `claude mcp list` — zero bare entries, zero diagnostics. Marketplace users see no change (`plugin:bkit:*` stays connected). Maintainers get a working `--dry-run` release path and CI that no longer accumulates fixture pollution. |
| **Core value** | Restore trust in a quality-focused plugin (no "Needs attention" on our own tool), harden the repo-as-project experience for every contributor, and pay down maintenance/governance debt — delivered as a docs=code, CI-green, no-version-bump release. |

---

## 2. Problem / Opportunity

### 2.1 Current state vs desired state

| Area | Current (v2.1.25) | Desired (v2.1.26) |
|------|-------------------|-------------------|
| Repo-root `.mcp.json` | Dual-loaded: plugin manifest (✔) + project config (✗, `CLAUDE_PLUGIN_ROOT` undefined) → `/plugin` "Needs attention … failed" | MCP declaration relocated off the `.mcp.json` filename; read only in plugin context; no bare project entries |
| Regression protection | MS-011~015 assert `.mcp.json` at root; nothing forbids a root `.mcp.json`; args string / `${CLAUDE_PLUGIN_ROOT}` unlocked | MS tests updated to new location + a NEW lock "repo root has NO `.mcp.json`"; manual packed smoke is the acceptance test |
| Release tooling | `release-plugin-tag.sh` step 6 calls `claude plugin tag "${TAG}"` (positional version) → "Path not found"; `cc-version-checker.js:64` pluginTagCommand comment stale | Step 6 → `git tag -a`; optional `claude plugin tag . --dry-run` as informational check; pluginTagCommand refreshed |
| ADR 0011 whitelist | 21-key snapshot; official schema now includes `mcpServers`, `lspServers`, `channels`, `userConfig`, `defaultEnabled`, `displayName`, `dependencies`, … | Whitelist reconciled against the current CC 2.1.198 schema |
| Locale-scoping decision | Deferred in CHANGELOG / release notes; no ADR of record | ADR 0015 records the locale-scoped deferral (bilingual pair) |
| Eval re-baseline | 32 frozen values; no SOP; runner treats `model_baseline` as inert metadata | Bilingual SOP guide authored; 32 frozen fields untouched |
| Test state hygiene | 5 test files write to real `.bkit`; `batch-orchestrator.js:64-66` no injectable root; registry/audit don't honor injected root → `sc05-test` etc. leak | Test-isolation guard: tmp-root for the 5 files + `projectRoot` injectability + registry/audit honoring |
| Local `.bkit` state | Polluted with fixtures (`test-feature-*`, `sc05-test`, batch/*) | Documented one-time local cleanup (non-shipped) |
| Skills count | `/plugin` shows "45 skills"; repo ships 44 skill dirs | Documented: 45 = 44 dirs + `commands/output-style-setup.md` (+1); not a bug |

### 2.2 Opportunity framing

- **Trust erosion is the highest-priority signal.** A plugin that sells quality showing its *own* MCP servers as "✗ failed" in `/plugin` erodes credibility with exactly the audience most likely to evaluate bkit closely — developers and cloners. The MAIN fix is spec-compliant, low-effort (S), and empirically validated on CC v2.1.198.
- **The follow-ups are debt that compounds.** Release-tooling drift means the next release is manual and error-prone; a stale ADR whitelist means governance checks lie; missing ADRs erode the decision record; leaking test state means every contributor's `.bkit` drifts and CI accumulates fixtures. Bundling them with the MAIN fix pays the debt down at the moment the file is already open.
- **The installed base is already safe — this hardens the repo, not the product.** `plugin:bkit:*` stays connected for marketplace users regardless. This release is about the developer/contributor experience and repo integrity, which is why the F4 guard (protecting every bkit developer's state) is in scope even though it is invisible to end users.

---

## 3. Users & Segments

Segmented by how each population experiences the MAIN issue and the follow-ups.

| Segment | Experience today | This release |
|---------|------------------|--------------|
| **S1 — bkit developers** (repo cwd) | `/plugin` "Needs attention" every session; local `.bkit` polluted by fixture leakage (`sc05-test` seen this session) | Clean `/plugin` + clean `claude mcp list`; F4 guard stops future leakage; documented local cleanup |
| **S2 — Cloners / cwd contains plugin checkout** | Bare `bkit-pdca`/`bkit-analysis` sit `⏸ Pending approval` → `✗ failed` (v2.1.196 self-approval ignored in untrusted workspaces) | No bare entries produced at all — the file is no longer read as project config |
| **S3 — Marketplace users** (normal project cwd) | Unaffected — no such `.mcp.json` in their project; `plugin:bkit:*` ✔ Connected | No change; NFR-1 guarantees `plugin:bkit:*` stays connected |
| **S4 — Maintainer (release/CI)** | `release-plugin-tag.sh` step 6 fails; ADR checks stale; CI accumulates fixtures | Working `--dry-run` path; reconciled ADR whitelist; CI hygiene restored |

---

## 4. Value Proposition

**For** bkit developers, cloners, and maintainers working inside the plugin repository
**who** see their own quality-focused plugin flagged "Needs attention" and wrestle with drifting release tooling and leaking test state,
**the** v2126-issue-response release **is a** maintenance / hardening release
**that** relocates the MCP declaration so it is only ever read in plugin context, locks the fix with a regression test + packed smoke, and pays down release-tooling, governance, and test-hygiene debt in the same changeset,
**unlike** leaving the dual-loaded `.mcp.json` in place (which keeps eroding trust and accreting debt),
**our release** restores a clean `/plugin` experience and repo integrity **while guaranteeing zero regression** for the installed marketplace base (`plugin:bkit:*` stays connected) and requiring no version bump until the maintainer approves.

| VP component | bkit-specific content |
|--------------|-----------------------|
| Gain creators | Clean `/plugin` + `claude mcp list`; working `--dry-run` release path; truthful governance checks; byte-identical `.bkit` after tests; a documented eval SOP and locale-deferral ADR |
| Pain relievers | No "Needs attention" on our own plugin; no manual tag workarounds; no fixture pollution in CI or local state; no stale-whitelist false confidence |
| Products/services | Relocated MCP manifest, regression lock + packed smoke, fixed release script, reconciled ADR 0011, new ADR 0015, eval SOP guide, test-isolation guard, local cleanup procedure, skills-count doc note, release advisory |

---

## 5. Requirements

> FR = functional (what the release must deliver). NFR = non-functional (quality bars). Final *choices* inside FR-1 / FR-9 (and the tag-info step, F4 depth) are framed in §6 and settled in Design; the FR mandates that the release resolve them.

### 5.1 Functional Requirements

| ID | Requirement | Primary surface (from audit) |
|----|-------------|------------------------------|
| **FR-1** | **MCP manifest relocation.** Relocate the plugin MCP declaration off the root `.mcp.json` filename so it is only ever read in plugin context; Design decides **inline `mcpServers` object in `plugin.json`** vs **`"mcpServers": "./<renamed>.json"` separate file** (see §6-a). Both are spec-compliant on CC v2.1.198 and preserve `${CLAUDE_PLUGIN_ROOT}` expansion. | `.mcp.json` (delete from root), `.claude-plugin/plugin.json` (`mcpServers` key — already whitelisted) |
| **FR-2** | **Regression lock.** Update MS-011~015 to assert the new location AND add a NEW lock asserting the repo root has **no** `.mcp.json`; a manual packed-plugin smoke (`/plugin` + `claude mcp list` showing zero bare entries) is the acceptance test (validate-pass ≠ load-pass). | `test/integration/mcp-server.test.js:110-147` + new assertion; packed smoke SOP |
| **FR-3** | **Release-tooling fix.** Change `release-plugin-tag.sh` step 6 to `git tag -a "${TAG}" -m "bkit ${TAG} release"`; fix the dry-run echo; refresh `cc-version-checker.js:64` `pluginTagCommand` value/comment. Do NOT adopt the `{name}--v{version}` tag format (breaks tag continuity). | `scripts/release-plugin-tag.sh:122-136`, `lib/infra/cc-version-checker.js:64` |
| **FR-4** | **ADR 0011 whitelist reconcile.** Reconcile the 21-key whitelist against the current CC 2.1.198 official plugin.json schema (add `mcpServers`, `lspServers`, `channels`, `userConfig`, `defaultEnabled`, `displayName`, `dependencies`, `$schema`, `experimental.*`, `outputStyles` as applicable). | ADR 0011 + any invariant reading `EXPECTED_PLUGIN_JSON_KEYS` |
| **FR-5** | **ADR 0015 (locale-scoped deferral).** Author a new bilingual ADR of record documenting the locale-scoping deferral (issue #129 proposal 1 quote; adopted proposal 2; immutable versioned cache-path argument; pre-announced deferral). | `docs/adr/0015-*.en.md` + `docs/adr/0015-*.ko.md` |
| **FR-6** | **Eval re-baseline SOP guide.** Author a bilingual SOP guide for eval re-baselining; the 32 frozen `model_baseline` fields stay untouched (recorded historical decision; field is inert in runner). | `docs/06-guide/*.en.md` + `*.ko.md` |
| **FR-7** | **Test-isolation guard.** Make `batch-orchestrator.js` accept an injectable `projectRoot`; make the sprint-status registry writer + audit-logger honor an injected root; redirect the 5 leaking test files to a tmp-root. Depth (minimal vs full projectRoot-honoring refactor) framed in §6-d. | `lib/pdca/batch-orchestrator.js:64-66`, audit/registry root resolution, 5 test files |
| **FR-8** | **Local `.bkit` cleanup.** Perform a one-time local cleanup of polluted fixture state (`test-feature-*`, `sc05-test`, `batch/*`) using the safe removal APIs; document the procedure. Non-shipped (`.bkit/` is gitignored). | Local `.bkit/state/*` (not tracked); documented procedure |
| **FR-9** | **45-skills counting clarification.** Add a docs note explaining `/plugin` "45 skills" = 44 skill dirs + `commands/output-style-setup.md` (+1) — not a bug. Design may instead propose a `skills/output-style-setup` twin (see §6-b). | Doc note (and/or optional skills twin) |
| **FR-10** | **Release advisory / CHANGELOG.** Publish a CHANGELOG entry + release advisory covering the MCP relocation, the release-tag fix, the ADR reconciles, and the test-isolation guard. Version heading is provisional/unreleased per repo rule. | `CHANGELOG.md`, PR description |

### 5.2 Non-Functional Requirements

| ID | Requirement | Verification |
|----|-------------|--------------|
| **NFR-1** | **Zero regression for the installed marketplace path** — `plugin:bkit:*` MCP servers stay ✔ Connected after the relocation. | `claude mcp list` on an installed (cache-path) plugin; packed smoke |
| **NFR-2** | **All CI gates green** — qa-aggregate shows no new failures; MS suite passes at the new location; no baseline/invariant left red. | GitHub Actions run green |
| **NFR-3** | **docs = code, zero drift** — ADR 0011 whitelist, skills-count note, and any doc referencing `.mcp.json` location match the shipped state. | Manual + grep audit vs shipped files |
| **NFR-4** | **No version bump until maintainer approval** — `plugin.json` version untouched; CHANGELOG heading provisional/unreleased. | Diff review — version field unchanged |
| **NFR-5** | **Single-branch, minimal-push delivery** — all changes on one branch; MCP relocation + whitelist + tests treated as one atomic changeset so CI never sees a partial state. | Branch/PR structure review |
| **NFR-6** | **Byte-identical `.bkit` after the 5 fixed tests** — running them leaves real `.bkit` state unchanged. | Pre/post checksum of `.bkit/state` around the test run |
| **NFR-7** | **Bilingual docs completeness** — every new `docs/` file (ADR 0015, eval SOP) ships as matched `.en.md` + `.ko.md` siblings, in sync. | Sibling-pair presence + content-parity review |

---

## 6. Key Decisions to be made in Design

> The PRD deliberately leaves the final pick to Design; each decision lists framed options + the deciding tension.

**(a) MCP declaration form — inline `mcpServers` object vs separate renamed file.**
- Option A1 (research rank 1, recommended): inline `mcpServers` object into `.claude-plugin/plugin.json`; delete root `.mcp.json`. Fewest files; `plugin.json` is never read as project MCP config; `${CLAUDE_PLUGIN_ROOT}` still expands.
- Option A2 (research rank 2): `"mcpServers": "./<renamed>.json"` (e.g. `.claude-plugin/mcp.json` or `servers/mcp.json`) + delete root `.mcp.json`. Same effect, keeps the declaration in a dedicated file.
- Deciding tension: single-source-of-truth compactness (A1) vs separation/readability of a dedicated MCP file (A2). Both pass `claude plugin validate` on 2.1.198; both require the FR-2 existence check because validate does not verify referenced-file existence.

**(b) 45-skills — doc note vs skills twin.**
- Option B1: documentation note only (XS) — explain 45 = 44 + `output-style-setup` command.
- Option B2: add a `skills/output-style-setup` twin so `skills/` count and the `/plugin` display converge (XS, but adds a real skill dir + must not break `EXPECTED_COUNTS.skills`).
- Deciding tension: cosmetic convergence (B2) vs minimal surface / no invariant churn (B1).

**(c) Plugin tag `--dry-run` informational step — include or not.**
- Option C1: add `claude plugin tag . --dry-run` as an informational consistency check after `git tag -a` (validates plugin.json ↔ marketplace agreement; `--dry-run` never mints the `{name}--v` tag).
- Option C2: omit it — keep step 6 minimal.
- Deciding tension: extra validation signal (C1) vs risk of parallel-format confusion / added script surface (C2).

**(d) F4 guard depth — minimal test fixes vs full projectRoot-honoring refactor.**
- Option D1 (minimal): redirect the 5 test files to tmp-root only.
- Option D2 (full): D1 + make `batch-orchestrator.js` accept an injectable `projectRoot` AND make the registry writer + audit-logger honor an injected root (addresses the residual leak where even tmp-root tests dropped `sc05-test` into real `.bkit`).
- Deciding tension: minimal blast radius (D1) vs actually closing the leak at its source (D2). Evidence (tmp-root tests still leaked) argues for D2; effort is M.

---

## 7. Risks & Mitigations

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| R1 | **validate-pass ≠ load-pass** — `claude plugin validate` accepts `mcpServers` and does not check referenced-file existence; a config that validates could still fail to load servers | High | FR-2 manual packed-plugin smoke (`/plugin` + `claude mcp list` = zero bare entries, `plugin:bkit:*` connected) is the real acceptance test; keep an existence check in bkit tests |
| R2 | **MS test path assumptions elsewhere** — other tests/docs may assume `.mcp.json` at root and break silently or lock the old path | Med | Grep audit for `.mcp.json` references (FR-2/NFR-3); update MS-011~015 + add the no-root-`.mcp.json` lock in the same changeset |
| R3 | **Tag-convention parallel-format confusion** — adopting `{name}--v{version}` alongside plain `vX.Y.Z` tags breaks continuity, gh-release, and push instructions | Med | FR-3 keeps `git tag -a` with the existing `vX.Y.Z` format; `{name}--v` used only (optionally) via `--dry-run`, which never mints a tag |
| R4 | **NFR-1 regression** — relocation accidentally breaks the installed marketplace path | High | Treat relocation + whitelist + tests as one atomic changeset (NFR-5); packed smoke verifies `plugin:bkit:*` stays connected before merge |
| R5 | **F4 residual leak** — even after tmp-root fixes, registry/audit may still write to real `.bkit` (observed with `sc05-test`) | Med | §6-d Option D2 (projectRoot-honoring refactor); NFR-6 byte-identical `.bkit` checksum gate around the 5 tests |
| R6 | **Bilingual drift** — new ADR 0015 / eval SOP ship in only one language or drift between EN/KO | Low | NFR-7 sibling-pair + content-parity review before merge |
| R7 | **Scope creep from bundling** — six workstreams in one release risk a partial/broken CI state | Med | NFR-5 single-branch minimal-push; MAIN fix + regression lock land as the priority atomic unit; follow-ups sequenced behind it |

---

## 8. Success Criteria & Release-Notes Plan

### 8.1 Measurable success criteria

| SC | Criterion | Measure |
|----|-----------|---------|
| SC-1 | No bare bkit MCP entries + zero diagnostics | Fresh `claude mcp list` in repo cwd shows ZERO bare `bkit-pdca`/`bkit-analysis` entries and zero MCP config diagnostics warnings |
| SC-2 | `/plugin` "Needs attention" cleared | `/plugin` → Installed panel shows no "Needs attention" for bkit MCP servers |
| SC-3 | Installed marketplace path unaffected | `plugin:bkit:bkit-pdca` and `plugin:bkit:bkit-analysis` still ✔ Connected (packed/installed smoke) |
| SC-4 | Release script green end-to-end | `release-plugin-tag.sh --dry-run` completes green through all steps incl. the fixed step 6 |
| SC-5 | No new CI failures | qa-aggregate / GitHub Actions shows no new failures vs the pre-release baseline |
| SC-6 | Byte-identical `.bkit` after fixed tests | Running the 5 fixed tests leaves `.bkit` state byte-identical (pre/post checksum match) |
| SC-7 | docs = code, zero drift | ADR 0011 whitelist matches current schema; ADR 0015 + eval SOP present as EN/KO pairs; skills-count note present; version field unchanged |

### 8.2 Release-notes plan (internal dev-tool maintenance scope)

- **Channel**: CHANGELOG.md entry + PR description. No external marketing (internal maintenance release).
- **Advisory content**: the MCP relocation (why the root `.mcp.json` dual-loaded and how relocation fixes it); the release-tag step fix; the ADR 0011 reconcile + ADR 0015 of record; the eval SOP; the test-isolation guard. Note explicitly that marketplace users are unaffected.
- **Rollout**: single-branch, minimal-push; MAIN fix + regression lock as the priority atomic unit so CI never sees a partial state; version number left to the maintainer per repo rule.
- **Post-release watch**: confirm no cloner/dev "Needs attention" reports recur; confirm `.bkit` stays clean across contributor CI runs; the cc-version-analysis rolling state continues to track any schema/tag drift.

---

## Attribution

PM framework scaffolding (Context Anchor, JTBD-style VP, segmentation) integrates patterns from [pm-skills](https://github.com/phuryn/pm-skills) by Pawel Huryn (MIT License), scaled down for an internal developer-tool maintenance release. All technical facts are sourced from the three research files cited in the header (`v2126-reproduction-log.md`, `v2126-web-research.md`, `v2126-codebase-audit.md`); no facts are re-derived in this PRD.

**Next step**: `/pdca plan v2126-issue-response` (this PRD is auto-referenced by the Plan phase).
