# v2126-issue-response Planning Document

> **Summary**: Eliminate the `/plugin` "Needs attention: bkit MCP failed" defect at its root (repo-root `.mcp.json` dual-load), close the four v2.1.25 follow-ups (release-tag drift, ADR 0015, eval SOP, test state-leak guard), reconcile the ADR 0011 manifest whitelist, and document the 45-skills counting rule.
>
> **Project**: bkit Vibecoding Kit (bkit-claude-code)
> **Version**: 2.1.26 (provisional — final version assigned by maintainer at release)
> **Author**: PDCA pipeline (pm-lead PRD → plan)
> **Date**: 2026-07-02
> **Status**: Draft
> **PRD**: [v2126-issue-response.prd.en.md](../../00-pm/v2126-issue-response.prd.en.md)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | The repo-root `.mcp.json` is loaded twice by Claude Code — as the plugin's MCP manifest (`${CLAUDE_PLUGIN_ROOT}` expands, `plugin:bkit:*` ✔) and as project-scope shared config whenever the bkit checkout is the working directory (variable undefined → parse failure → `/plugin` "Needs attention: bkit-pdca / bkit-analysis MCP ✗ failed"). Alongside: the release-tag script calls a CC command whose signature changed (~v2.1.110), the ADR 0011 manifest whitelist predates several official schema keys, the locale-scoped trigger deferral (#129) lacks its promised ADR, eval re-baselining has no SOP, and five test files leak fixture state into the developer's real `.bkit` (observed live: `sc05-test` in this session's Stop hook). |
| **Solution** | Relocate the plugin MCP declaration off the `.mcp.json` filename (official `mcpServers` manifest key — inline vs separate file decided in Design) with a "no root `.mcp.json`" regression lock and a packed-plugin smoke as acceptance; fix the release script's tag step to direct `git tag -a`; reconcile ADR 0011; author ADR 0015 + eval re-baseline SOP (bilingual); full test-isolation refactor (batch-orchestrator `projectRoot` injectability + sprint-registry/audit-logger honoring injected roots + 5 tests to tmp-root); document the 45-skills counting rule; local `.bkit` cleanup procedure. |
| **Function/UX Effect** | Developers and cloners get a clean `/plugin` panel and `claude mcp list` (zero failed/pending bkit entries, zero diagnostics warnings); marketplace users see zero behavior change; maintainers get a working `--dry-run`-verified release path; CI stops accreting fixture pollution into real state. |
| **Core Value** | Restore trust in a quality-focused plugin, harden the repo-as-project experience, and pay down governance/test debt — docs=code, CI-green, no version bump until maintainer approval. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | A plugin whose promise is "verifies AI code against its own specs" must not greet its own developers/cloners with failed MCP servers; release tooling and governance records must match current CC reality. |
| **WHO** | bkit developers + anyone opening the plugin checkout as cwd (MAIN); maintainers (release script); all bkit devs (test-state integrity); community readers of ADRs/SOPs. Marketplace end-users: unaffected, must stay unaffected (NFR-1). |
| **RISK** | `claude plugin validate` passing does NOT prove the loader honors the relocated manifest (validate-pass ≠ load-pass) → packed-plugin smoke is the real acceptance test; test-isolation refactor touches shared lib paths (batch/audit/registry). |
| **SUCCESS** | Fresh `claude mcp list` in the repo shows zero bare bkit entries + zero diagnostics; `/plugin` Needs-attention clear; installed `plugin:bkit:*` still ✔; release script `--dry-run` green end-to-end; the 5 fixed tests leave `.bkit` byte-identical; all CI gates green. |
| **SCOPE** | `.mcp.json` relocation + plugin.json `mcpServers` · MS-011~015 + new lock · release-plugin-tag.sh + cc-version-checker · ADR 0011 update + ADR 0015 new + eval SOP new (bilingual) · lib/pdca/batch-orchestrator + sprint-registry/audit root honoring + 5 test files · docs notes + CHANGELOG. |

---

## 1. Overview

### 1.1 Purpose

Ship v2.1.26 as a maintenance release that (a) removes the `/plugin` failed-MCP defect at its structural root, (b) closes every follow-up left by v2.1.25, and (c) fixes the newly discovered test state-leak defect class — with zero regression for installed marketplace users.

### 1.2 Background

- **Reproduction (R1, `.bkit/research/v2126-reproduction-log.md`)**: CC diagnostics directly confirm the mechanism — `[Warning] mcpServers.bkit-pdca: Missing environment variables: CLAUDE_PLUGIN_ROOT` from "Project config (shared via .mcp.json)". Approving a broken-path project server transitions pending → ✗ failed, matching the user's screenshot.
- **Official spec (web research, CONFIRMED)**: plugins may declare MCP servers "in `.mcp.json` at the plugin root **or inline in `plugin.json`**"; the manifest `mcpServers` key accepts `string|array|object`. Only the literal filename `.mcp.json` at cwd root is auto-loaded as project config → relocation removes the collision. `${VAR:-default}` and relative-path alternatives are REJECTED with documented reasons (silences-but-registers; breaks installed cache path).
- **Codebase audit**: coupling surface is minimal — only `test/integration/mcp-server.test.js` MS-011~015 asserts the file; hooks.json is NOT dual-loaded (no repo `.claude/settings.json`); `mcpServers` is already in the ADR 0011 whitelist snapshot (`docs-code-invariants.js:153`); `claude plugin validate` empirically passes with both key forms on CC v2.1.198 but does not check referenced-file existence.
- **Follow-up grounding**: release script step 6 stale vs `plugin tag [path]` `{name}--v{version}` semantics (~CC v2.1.110); ADR next number = 0015; 32 `model_baseline` fields are inert metadata (runner performs zero LLM calls) → SOP-only; five tests leak into real `.bkit` and `lib/pdca/batch-orchestrator.js:64-66` cannot be root-injected; sprint-registry/audit-logger ignore injected roots (even mkdtemp-based tests leaked `sc05-test`).
- **User decisions (Plan checkpoint, 2026-07-02)**: full FR-1..10 scope; **F4 = full refactoring** ("no tech debt" principle — injectability + root honoring + 5 tests); **45-skills = documentation only**.

### 1.3 Related Documents

- PRD: `docs/00-pm/v2126-issue-response.prd.{en,ko}.md`
- Research: `.bkit/research/v2126-reproduction-log.md`, `v2126-web-research.md`, `v2126-codebase-audit.md`
- Origin: v2.1.25 completion report follow-up list (`docs/04-report/claude-model-alignment.report.en.md`)

---

## 2. Scope

### 2.1 In Scope

- [ ] FR-01 MCP manifest relocation off root `.mcp.json` (Design decides inline object vs separate referenced file)
- [ ] FR-02 Regression lock: MS-011~015 updated to the new location + NEW assertion that repo root has no `.mcp.json` + packed-plugin manual smoke procedure recorded as acceptance evidence
- [ ] FR-03 `release-plugin-tag.sh` step 6 → direct `git tag -a` (Design decides optional `claude plugin tag . --dry-run` consistency step) + dry-run echo fix + `cc-version-checker.js:64` `pluginTagCommand` refresh
- [ ] FR-04 ADR 0011 whitelist reconcile against the current official CC 2.1.198 manifest schema (mcpServers already present; add newer official keys per research; update ADR history)
- [ ] FR-05 ADR 0015 "Locale-scoped trigger generation deferral" (bilingual pair, format per ADR 0014)
- [ ] FR-06 Eval re-baseline SOP guide (bilingual, docs/06-guide) — 32 frozen `model_baseline` fields untouched
- [ ] FR-07 Test-isolation guard, FULL depth: `lib/pdca/batch-orchestrator.js` projectRoot injectability; sprint-status registry writer + audit-logger honor injected projectRoot; 5 leaking test files moved to tmp-root isolation (sprint-handler ×2, config-sync, module-chain, batch-orchestrator)
- [ ] FR-08 Local `.bkit` cleanup — one-time local procedure documented (and executed locally); nothing shipped beyond docs note
- [ ] FR-09 45-skills counting clarification — documentation note only (CC counts skills/ + commands/; output-style-setup command = the +1)
- [ ] FR-10 CHANGELOG entry (provisional/unreleased heading per versioning rule) + release advisory content

### 2.2 Out of Scope

- Bumping any version field (maintainer decision at release; CHANGELOG heading provisional until approval)
- Editing the 32 `eval.yaml` `model_baseline` values (frozen historical records per v2.1.25 decision)
- Switching the repo tag convention to `{name}--v{version}` (breaks continuity; the official command is used only as an optional `--dry-run` consistency check if Design includes it)
- Changing marketplace end-user behavior in any way (NFR-1)
- Fixing CC-side issues (#9427 family) — bkit adapts to documented behavior only
- Creating `skills/output-style-setup/` twin (user-decided: docs-only)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Relocate plugin MCP declaration off the `.mcp.json` root filename via official `plugin.json` `mcpServers` key (form decided in Design Checkpoint 3) | High | Pending |
| FR-02 | Regression lock: MS-011~015 path update + assert no root `.mcp.json` + packed-plugin smoke (install from local marketplace or cache-sim) recorded as acceptance | High | Pending |
| FR-03 | Release script step-6 fix (direct `git tag -a`; optional informational `claude plugin tag . --dry-run` per Design) + `cc-version-checker.js` pluginTagCommand refresh | High | Pending |
| FR-04 | ADR 0011 whitelist reconcile vs current official schema + History append | Medium | Pending |
| FR-05 | ADR 0015 bilingual (locale-scoped deferral; cites #129 proposal 1, immutable cache argument, language.js registry, VS-011~015 lock) | Medium | Pending |
| FR-06 | Eval re-baseline SOP guide bilingual (when/why/how to re-capture `model_baseline`; explicitly keeps current 32 frozen) | Medium | Pending |
| FR-07 | Test-isolation FULL refactor: batch-orchestrator projectRoot injection; sprint-registry + audit-logger honor injected root; 5 test files tmp-root isolated; NEW guard test proving `.bkit` byte-identical across those suites | High | Pending |
| FR-08 | Local `.bkit` cleanup procedure (documented; executed locally; uses safe APIs where available, file-level for registry rows/batch) | Low | Pending |
| FR-09 | 45-skills counting note in docs (README-FULL or CUSTOMIZATION-GUIDE + bkit-system) | Low | Pending |
| FR-10 | CHANGELOG provisional entry + advisory (what devs/cloners see change; nothing changes for installed users) | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Marketplace zero-regression | `plugin:bkit:bkit-pdca`/`bkit-analysis` stay ✔ Connected after relocation | Packed-plugin smoke: `claude mcp list` + `/plugin` on the packed/installed copy |
| Dev/cloner clean state | Zero bare `bkit-*` MCP entries, zero MCP diagnostics warnings in repo cwd | Fresh `claude mcp list` in repo |
| CI integrity | All gates green (contract L1-L5, security, unit, MS suite at new location, release gates, qa-aggregate no new failures vs main) | Local full run + Actions on push |
| Test-state integrity | The 5 refactored suites leave `.bkit` byte-identical | Hash `.bkit` before/after suite run (new guard test) |
| Docs=Code | Zero drift incl. new/updated ADRs + SOP + counting note | docs-code-sync + bkit-full-system + manual review |
| Versioning | No version bump in this branch; CHANGELOG heading provisional | Diff review |
| Bilingual completeness | All NEW docs/ files as `.en.md`+`.ko.md` in-sync pairs | Review |
| Single-branch hygiene | Batched commits, pushes only at milestones (Actions free tier) | Git history |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] SC-1: In the repo cwd, fresh `claude mcp list` shows NO bare `bkit-pdca`/`bkit-analysis` entries and NO "MCP config diagnostics" warnings; `/plugin` shows no bkit rows under Needs attention
- [ ] SC-2: Packed/installed plugin path verified: `plugin:bkit:bkit-pdca` + `plugin:bkit:bkit-analysis` ✔ Connected and their 19 tools callable (one live MCP tool call as probe)
- [ ] SC-3: `bash scripts/release-plugin-tag.sh --dry-run` green end-to-end on current CC (no "Path not found"); step-6 real path verified logically (tag creation deferred to actual release)
- [ ] SC-4: New isolation guard test passes: running the 5 refactored suites leaves `.bkit` byte-identical (hash compare)
- [ ] SC-5: ADR 0011 updated, ADR 0015 + eval SOP exist as bilingual pairs; docs-code-sync + bkit-full-system green
- [ ] SC-6: Full CI-mirror gate suite green locally; GitHub Actions green on the single milestone push
- [ ] SC-7: Gap analysis ≥ 90% (target 100%) against the Design; QA_PASS on live checks
- [ ] SC-8: CHANGELOG provisional entry present; PR opened; merge awaits USER APPROVAL; then tag v2.1.26 + GitHub Release notes (EN)

### 4.2 Quality Criteria

- [ ] No new dead code; domain purity green; English-only implementation (docs/ bilingual + 8-lang triggers excepted)
- [ ] No hand-edited contract baselines (none expected to change — MCP tool baselines are servers/-dir based)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| validate-pass ≠ load-pass: relocated manifest passes `claude plugin validate` but loader ignores it in a real install | High | Low-Med | SC-2 packed-plugin smoke is the acceptance test BEFORE merge; keep rollback = restore `.mcp.json` (1 file) |
| MS test or other code assumes `.mcp.json` path beyond audited sites | Medium | Low | Audit found only 3 readers + 1 test; Do-phase grep sweep re-verifies (related+similar rule) |
| Test-isolation refactor breaks runtime callers of batch-orchestrator/audit/registry | Medium | Medium | Injection must be additive (default = current PROJECT_DIR behavior); full contract/unit suites + qa-aggregate diff vs main |
| Optional `plugin tag . --dry-run` step behaves differently across CC versions | Low | Medium | Keep it informational-only (never gates); guard with version check or `|| true` semantics per Design |
| bkend-detection readers of cwd `.mcp.json` (session-context.js:389) misread the change | Low | Low | They read the USER project's file, not ours; removal path returns "Not configured" — verified in audit |
| GitHub Actions free-tier burn | Low | Medium | Single milestone push policy (same as v2.1.25) |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `.mcp.json` (root) | Plugin MCP manifest | Deleted or moved (Design) |
| `.claude-plugin/plugin.json` | Manifest | + `mcpServers` key (inline or path) |
| `test/integration/mcp-server.test.js` | Test | MS-011~015 point at new location + new no-root-file lock |
| `scripts/release-plugin-tag.sh` | Release tooling | Step 6 rewrite + echo fix |
| `lib/infra/cc-version-checker.js` | Infra | pluginTagCommand refresh |
| `docs/adr/0011-*.md` | ADR | Whitelist reconcile + history |
| `docs/adr/0015-*.{en,ko}.md` | ADR (new pair) | Locale-scoped deferral |
| `docs/06-guide/eval-rebaseline.guide.*.md` (name per Design) | SOP (new pair) | Eval re-baseline procedure |
| `lib/pdca/batch-orchestrator.js` | Lib | projectRoot injectability (additive, default unchanged) |
| Sprint-registry writer + audit-logger root resolution | Lib | Honor injected projectRoot |
| 5 test files (sprint-handler ×2, config-sync, module-chain, batch-orchestrator) | Tests | tmp-root isolation |
| README-FULL/CUSTOMIZATION-GUIDE + bkit-system | Docs | 45-skills note + counts untouched (44/34 remain true) |
| CHANGELOG.md | Docs | Provisional v2.1.26 entry |

### 6.2 Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| Plugin MCP declaration | LOAD | CC plugin loader (default `.mcp.json` OR manifest `mcpServers`) | Needs SC-2 packed smoke (Breaking if loader quirk) |
| Root `.mcp.json` | LOAD | CC project-config auto-load when repo = cwd | Intentionally removed (the bug) |
| `.mcp.json` file | ASSERT | mcp-server.test.js MS-011~015 | Updated (FR-02) |
| cwd `.mcp.json` | READ | session-context.js:389, user-prompt-handler.js:34 (bkend detect) | None (reads user project; falls through) |
| servers/ paths | SPAWN/ASSERT | l3-mcp-{compat,runtime}, baselines, L5, measure script | None (direct servers/ paths) |
| `claude plugin tag` | EXEC | release-plugin-tag.sh:128 | Fixed (FR-03) |
| PROJECT_DIR-hardcoded batch paths | READ/WRITE | lib/pdca/batch-orchestrator.js:64-66 ← batch tests | Injectable (FR-07), default preserved |
| Real `.bkit` state | WRITE | 5 leaking test files; registry/audit writers ignoring injected root | Isolated (FR-07) |

### 6.3 Verification

- [ ] Do-phase related+similar sweep: grep repo for `.mcp.json`, `CLAUDE_PLUGIN_ROOT` (non-hooks), `plugin tag`, PROJECT_DIR hardcodes in lib/pdca + lib/audit + lib/sprint writers
- [ ] No auth/permission surface; plugin.json gains one whitelisted key only (ADR 0011 stays enforceable)

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

bkit plugin internal — Enterprise-grade repo conventions (Clean Architecture lib/, contract gates L1-L5) apply.

### 7.2 Key Architectural Decisions (deferred to Design — Checkpoint 3)

| Decision | Options | Leaning | Rationale to weigh |
|----------|---------|---------|--------------------|
| (a) MCP manifest form | A: inline `mcpServers` object in plugin.json / B: separate file (e.g. `.claude-plugin/mcp.json` or `mcp-servers.json`) + path key | Design | Inline = fewer files, manifest self-contained; separate = cleaner diffs, mirrors old structure |
| (b) `plugin tag . --dry-run` informational step | include / omit | Design | Adds plugin.json↔marketplace agreement check; must never gate |
| (c) F4 injection pattern | opts param threading vs env (BKIT_ROOT) vs existing port/adapter convention | Design | Must match repo conventions (status-core uses explicit paths; l3-runtime uses BKIT_ROOT env) |
| (d) Eval SOP + ADR file naming | per docs/06-guide + docs/adr patterns | Design | Follow existing `.guide.md` / ADR pair conventions |

### 7.3 Clean Architecture Approach

Changes stay within: `.claude-plugin/` + root manifest (config), `scripts/` (adapter), `lib/pdca` + `lib/audit`/sprint writers (application/infra), `test/` (contract/integration/unit), `docs/` (governance). check-domain-purity must stay green; injection changes must not add domain→outer dependencies.

---

## 8. Convention Prerequisites

- [x] Bilingual new-docs rule (`.en.md`+`.ko.md`); English implementation; no version bumps (CLAUDE.md)
- [x] ADR format model: ADR 0014 pair; next number 0015
- [x] ENH numbering: check CHANGELOG for next free number during Do (after ENH-368; do not guess)
- [x] Contract baselines: MCP tool baselines derive from servers/ dir — expected UNCHANGED this release; any baseline diff is a red flag

---

## 9. Next Steps

1. [ ] Design document (`docs/02-design/features/v2126-issue-response.design.{en,ko}.md`) — 3 options for FR-01 form + full change enumeration (I-list) + verification checklist
2. [ ] User selects architecture option (Checkpoint 3) — **current user-requested deliverable boundary ends after Design approval**
3. [ ] Then (upon go-ahead): `/pdca do` via team → analyze/iterate → qa → docs sync → single push → CI → PR → USER APPROVAL → merge → tag v2.1.26 → GitHub Release

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-07-02 | Initial draft from PRD + research + Plan checkpoint decisions (full scope; F4 full refactor; 45-skills docs-only) | PDCA pipeline |
