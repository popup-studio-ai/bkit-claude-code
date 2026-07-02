# v2126-issue-response Design Document

> **Summary**: Option C (Pragmatic) — inline `mcpServers` in plugin.json (delete root `.mcp.json`) with a no-root-file regression lock and packed-plugin smoke acceptance; release-script tag step → direct `git tag -a` with an informational `plugin tag . --dry-run` consistency echo; additive `projectRoot` injection through batch-orchestrator + sprint-registry + audit-logger with 5 test suites isolated to tmp roots; ADR 0011 reconcile + ADR 0015 + eval re-baseline SOP (bilingual); 45-skills counting note.
>
> **Project**: bkit Vibecoding Kit (bkit-claude-code)
> **Version**: 2.1.26 (provisional)
> **Author**: PDCA pipeline
> **Date**: 2026-07-02
> **Status**: Approved (Checkpoint 3: Option C selected by user, 2026-07-02)
> **Planning Doc**: [v2126-issue-response.plan.en.md](../../01-plan/features/v2126-issue-response.plan.en.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | A plugin that verifies AI code against specs must not greet its own developers/cloners with failed MCP servers; tooling/governance must match current CC reality. |
| **WHO** | bkit developers + cloners (MAIN); maintainers (release script); all devs (state integrity). Marketplace users: must stay unaffected. |
| **RISK** | validate-pass ≠ load-pass (packed smoke = real acceptance); isolation refactor touches shared lib paths (additive defaults mitigate). |
| **SUCCESS** | Repo cwd: zero bare bkit MCP entries + zero diagnostics; installed `plugin:bkit:*` still ✔; release `--dry-run` green; 5 suites leave `.bkit` byte-identical; CI green. |
| **SCOPE** | plugin.json inline mcpServers + delete .mcp.json · MS suite + locks · release script + version-checker · ADR 0011/0015 + eval SOP · batch/registry/audit root injection + 5 tests + guard test · docs notes + CHANGELOG. |

---

## 1. Overview

### 1.1 Design Goals

1. Root `.mcp.json` never exists again → CC can never load it as project config; plugin MCP declaration lives where only the plugin loader reads it.
2. Marketplace path byte-equivalent in behavior: same two servers, same `${CLAUDE_PLUGIN_ROOT}` args, same env.
3. Isolation changes are ADDITIVE: every touched lib keeps its current default (real `PROJECT_DIR`) when no root is injected — zero runtime behavior change outside tests.
4. Every governance artifact (ADR 0011 update, ADR 0015, eval SOP) is bilingual and follows existing file conventions.

### 1.2 Design Principles

- **No Guessing**: exact registry/audit writer modules are named by reading code during Do (audit located the symptoms and entry files; the Do agent MUST read the full call chain before editing — same convention as v2.1.25 I-13).
- **Additive injection**: new `projectRoot`/`opts` parameters default to current behavior; no new abstraction layer (Option C explicitly rejects a new shared port this release).
- **Acceptance = live behavior**: `claude plugin validate` is a gate but NOT the acceptance; the packed/installed smoke (SC-2) is.

---

## 2. Architecture Options

### 2.0 Comparison (summary — full table in Plan §7.2 and Checkpoint 3)

| Criteria | A: Minimal | B: Clean | **C: Pragmatic** |
|---|:-:|:-:|:-:|
| MCP form | separate `.claude-plugin/mcp.json` + path key | inline | **inline** |
| F4 pattern | minimal opts threading | new shared resolveProjectRoot port | **additive opts, existing conventions** |
| plugin-tag dry-run step | omit | gating | **informational-only (`|| true`)** |
| Modified files | ~19 | ~23 | ~20 |
| Risk | file lingers | over-engineering | **lowest** |

**Selected**: **Option C** — user-approved at Checkpoint 3 (2026-07-02).

### 2.1 Component Diagram — before/after load paths

```
BEFORE:
  CC plugin loader ──reads──▶ <plugin>/.mcp.json  ─ ${CLAUDE_PLUGIN_ROOT} expands ✔
  CC project config ─auto───▶ <cwd>/.mcp.json     ─ var undefined ✗  ← THE BUG (same file, repo=cwd)

AFTER:
  CC plugin loader ──reads──▶ .claude-plugin/plugin.json "mcpServers" (inline) ✔
  CC project config ─auto───▶ <cwd>/.mcp.json  → FILE DOES NOT EXIST → nothing loads, no diagnostics
```

### 2.2 Data Flow (isolation, FR-07)

```
test (tmp root) ──opts.projectRoot──▶ batch-orchestrator ──▶ <tmpRoot>/.bkit/state/batch/*
                └─────────────────────▶ sprint-registry writer / audit-logger ──▶ <tmpRoot>/.bkit/...
default (no injection) ──────────────▶ getCore().PROJECT_DIR  (unchanged runtime behavior)
```

### 2.3 Dependencies

| Component | Depends on | Note |
|---|---|---|
| plugin.json `mcpServers` | official manifest schema key (already in `EXPECTED_PLUGIN_JSON_KEYS`, docs-code-invariants.js:153) | validate --strict must stay green |
| MS test suite | new manifest location | FR-02 |
| isolation guard test | injected-root honoring (I-10..12) | FR-07 |

---

## 3. Data Model — the relocated MCP manifest

### 3.1 plugin.json inline `mcpServers` (I-1, exact content)

```json
"mcpServers": {
  "bkit-pdca": {
    "command": "node",
    "args": ["${CLAUDE_PLUGIN_ROOT}/servers/bkit-pdca-server/index.js"],
    "env": {}
  },
  "bkit-analysis": {
    "command": "node",
    "args": ["${CLAUDE_PLUGIN_ROOT}/servers/bkit-analysis-server/index.js"],
    "env": {}
  }
}
```

Semantics identical to the current `.mcp.json` (server names, command, args, env — byte-for-byte values). `${CLAUDE_PLUGIN_ROOT}` expands in plugin context per official docs ("substituted inline anywhere… in MCP or LSP server configs").

### 3.2 Root `.mcp.json` — DELETED (I-2). No replacement file anywhere in the repo may carry that exact root filename (locked by I-3).

---

## 4. Interface Changes (I-list — gap-analysis reference)

| # | File | Change |
|---|---|---|
| I-1 | `.claude-plugin/plugin.json` | Add inline `mcpServers` object (§3.1), placed after `outputStyles`. No other key changes; version field untouched |
| I-2 | `.mcp.json` (root) | `git rm` — content relocated to I-1 |
| I-3 | `test/integration/mcp-server.test.js:110-147` | MS-011~015 re-pointed at `plugin.json` `mcpServers` (exists, valid JSON already covered, has both `bkit-pdca`+`bkit-analysis`, `command === 'node'`, plus a **NEW hardening assertion** — args contain `${CLAUDE_PLUGIN_ROOT}/servers/...` — current MS-014/015 do NOT assert args; this locks the exact variable the bug hinged on); NEW TC (MS-016 or next free id): `fs.existsSync(root/.mcp.json) === false` with comment citing this design + reproduction R1 — the regression lock |
| I-4 | Packed-plugin smoke (procedure, recorded in QA report) | (a) `claude plugin validate . --strict` green; (b) fresh `claude -p --plugin-dir . "Call the bkit_pdca_status MCP tool"` succeeds (plugin-context load of inline manifest); (c) fresh `claude mcp list` in repo cwd shows NO bare `bkit-pdca`/`bkit-analysis`, NO diagnostics block; (d) marketplace-install path: re-install/refresh installed copy if feasible OR verify the cache-copy mechanism loads plugin.json mcpServers (evidence recorded; if the installed 2.1.25 copy remains, note that it still uses old layout until next release — expected, not a regression) |
| I-5 | `scripts/release-plugin-tag.sh:122-136` | Step 6 rewrite: always `git tag -a "${TAG}" -m "bkit ${TAG} release"`; BEFORE it, informational consistency echo: `claude plugin tag . --dry-run 2>&1 | sed 's/^/[release][info] /' || true` (never gates; prints the derived `{name}--v{version}` agreement check); fix the `--dry-run` echo at :123-124 to reflect the new step; keep git-absent fallback semantics |
| I-6 | `lib/infra/cc-version-checker.js:64` | `pluginTagCommand: '2.1.118'` — update comment (and value if the milestone map semantics call for it — Do reads the map's meaning first) to record the `{name}--v{version}` derived-tag transition (~CC v2.1.110, positional form removed; script now tags via git directly) |
| I-7 | `docs/adr/0011-plugin-manifest-schema-compliance.md` | History append: official schema has grown past the 21-key v2.1.143 snapshot (mcpServers — now USED by bkit per this design — plus lspServers, channels, userConfig, defaultEnabled, $schema, homepage per research Q1); state policy: bkit's `EXPECTED_PLUGIN_JSON_KEYS` remains "keys bkit ships" (subset enforcement), NOT a mirror of the full official schema — this policy line MUST appear verbatim in the ADR history so Plan FR-04 ("add newer official keys") is scored *satisfied-by-design*: the only official key absent from the whitelist is `defaultEnabled` (v2.1.154+), which bkit does not ship; `mcpServers` already whitelisted (docs-code-invariants.js:153) so NO code change needed |
| I-8 | `docs/adr/0015-locale-scoped-trigger-deferral.{en,ko}.md` (NEW pair) | Format per ADR 0014: Context (#129 proposal 1 quoted; ~27KB→compact encoding shipped in v2.1.25), Decision (defer locale-scoped generation: CC plugins are immutable versioned marketplace checkouts — `~/.claude/plugins/cache/...` — with no install-time generation hook; per-locale agent files cannot be produced without breaking git-based updates/contract collection), Consequences (+: no false promise, routing unaffected via lib/intent/language.js registry; −: non-EN/KO users keep 1-anchor triggers; revisit if CC gains install hooks), citations (VS-011~015 KO lock, issue-129-description-budget lock) |
| I-9 | `docs/06-guide/eval-rebaseline.guide.{en,ko}.md` (NEW pair) | SOP: WHAT `model_baseline` records (capture-time model metadata; runner performs zero LLM calls — inert); WHEN to re-baseline (score-rubric changes or deliberate quality-bar reset, NOT model releases); HOW (run `node evals/runner.js --benchmark` on the target setup, update `model_baseline` + a `baseline_date` note per eval.yaml in one commit, CHANGELOG entry); explicit statement that the current 32 `claude-sonnet-4-6` values remain frozen per the v2.1.25 decision |
| I-10 | `lib/pdca/batch-orchestrator.js:64-66` | Accept injectable project root (`opts.projectRoot` on the entry API or constructor per the module's existing style — Do reads the module fully first); default = current `getCore().PROJECT_DIR` behavior; all batch state paths derive from the resolved root |
| I-11 | Sprint-status registry writer (module identified in Do; symptom: registry rows written to real `.bkit` despite injected root in v2113-sprint-contracts.test.js:147-169) | Thread the already-injected `projectRoot` through to the registry write path; default unchanged |
| I-12 | Audit-logger root resolution (symptom: audit appends to real `.bkit/audit` from tests) | Honor injected `projectRoot` for the audit dir; default unchanged |
| I-13 | 5 test files: `test/unit/sprint-handler/default-level-warning.test.js`, `test/unit/sprint-handler/annotate-action.test.js`, `test/integration/config-sync.test.js`, `test/integration/module-chain.test.js`, `test/unit/batch-orchestrator.test.js` | Each runs against a `fs.mkdtempSync` root (following v2113-sprint-contracts.test.js's tmp-root pattern, now actually honored end-to-end); cleanup removes tmp dir; no writes to repo `.bkit` |
| I-14 | NEW `test/regression/bkit-state-isolation.test.js` | Guard: (a) unit-level — invoking batch-orchestrator/registry/audit write paths with an injected tmp root writes ONLY under tmp (assert real `.bkit` hash unchanged across the calls); (b) meta-level — recursively hash repo `.bkit` (if present), run the 5 suites of I-13 as child processes, re-hash, assert identical. Standalone runnable; registered per test-tracking policy |
| I-15 | 45-skills counting note | One-liner in `CUSTOMIZATION-GUIDE.md` (near the plugin structure tree) + `bkit-system/components/skills/_skills-overview.md`: CC's `/plugin` Skills count = `skills/` + `commands/` entries (same-name dedup); bkit: 44 skills + `commands/output-style-setup.md` → 45 |
| I-16 | `CHANGELOG.md` | New top entry `## [Unreleased — v2.1.26 provisional] - <date>` (heading renamed by maintainer at release, same convention as v2.1.25 pre-approval state): MAIN fix + R1 mechanism, FR-03..09 summaries, local-cleanup note (see I-17), advisory: what devs/cloners see change; installed users unaffected |
| I-17 | Local `.bkit` cleanup (NOT shipped) | Procedure recorded in the CHANGELOG entry (short) + executed locally: remove fixture features via `deleteFeatureFromStatus` (test-feature-sync, test-module-chain, test-feature), file-level removal of fixture sprint files/registry rows (sc05-test, test-f1-*) and `.bkit/state/batch/test-*`/`batch-*` fixtures, prune polluted history entries; verify `bkit_pdca_status` MCP + `/pdca status` still healthy after |

### 4.1 Explicitly unchanged (regression guards)

- `servers/**` — untouched; L3 compat/runtime, L5 inventory, contract MCP baselines all derive from `servers/` and must show ZERO diff.
- `hooks/hooks.json` — untouched (not dual-loaded; 25 `${CLAUDE_PLUGIN_ROOT}` usages stay; HPQ/CC-002/VC2-012 locks unaffected).
- `evals/*/eval.yaml` ×32 `model_baseline` — frozen (I-9 documents, does not edit).
- Version fields everywhere — untouched (maintainer confirms at release).
- Contract baselines both dirs — expected byte-identical; any diff fails review.

---

## 5. Verification Checklist (gap-detector target)

### 5.1 MAIN fix

- [ ] I-1 plugin.json carries the exact §3.1 object; `claude plugin validate . --strict` green (0 errors/warnings)
- [ ] I-2 root `.mcp.json` absent from the tree (git rm’d)
- [ ] I-3 MS suite green at new location + no-root-file lock present and passing
- [ ] I-4 smoke evidence recorded: fresh-session MCP tool call OK via --plugin-dir; repo-cwd `claude mcp list` clean (no bare entries, no diagnostics); installed-copy note
- [ ] Sweep: repo-wide grep for `.mcp.json` — remaining references are only the 3 audited user-project/bkend readers (session-context.js:389, user-prompt-handler.js:34, measure-mcp comments) + historical docs; none expect the root file

### 5.2 Follow-ups

- [ ] I-5 script step 6: `--dry-run` full pass on CC v2.1.198 (no "Path not found"); informational step never gates (`|| true` semantics verified)
- [ ] I-6 cc-version-checker comment/value updated; unit test `test/unit/cc-version-checker.test.js` green
- [ ] I-7 ADR 0011 history appended; `EXPECTED_PLUGIN_JSON_KEYS` UNCHANGED in code; validate-plugin + config-sync green
- [ ] I-8 ADR 0015 bilingual pair exists, follows 0014 format, cites all four grounding facts
- [ ] I-9 eval SOP bilingual pair exists; states the freeze; no eval.yaml modified
- [ ] I-10..12 injection additive: default behavior byte-identical (existing unit/contract suites green with zero test edits other than I-13); injected tmp root fully honored (no real-`.bkit` writes)
- [ ] I-13 5 suites tmp-rooted and green
- [ ] I-14 isolation guard test green (both levels)
- [ ] I-15 counting note present in both docs
- [ ] I-16 CHANGELOG provisional entry; I-17 local cleanup done + `/pdca status` and `bkit_pdca_status` healthy

### 5.3 Global gates

- [ ] Full CI-mirror suite green (contract v2.1.9+v2.1.16 L1/L4, l2-smoke, l2-hook-attribution, l3-mcp-compat, l3-mcp-runtime, L5 inventory, security, units, docs-code-sync, check-deadcode, check-domain-purity, check-guards, check-test-tracking, integration-runtime, bkit-full-system, docs-code-sync.test, validate-plugin --strict, qa-aggregate no new failures vs main)
- [ ] Contract baselines byte-identical (both dirs)
- [ ] docs=code zero drift; bilingual pairs in sync

---

## 6. Error Handling

| Condition | Behavior |
|---|---|
| Packed smoke fails (loader ignores inline mcpServers) | Two distinct paths — do not conflate: (a) **emergency revert** = restore the ROOT `.mcp.json` + drop I-1/I-3 (reintroduces the dual-load bug; stop-the-bleed only); (b) **permanent fallback** = Design Option A: create the SEPARATE file `.claude-plugin/mcp.json` + `"mcpServers": "./.claude-plugin/mcp.json"` path key (root stays deleted), then re-smoke |
| `claude plugin tag . --dry-run` errors on some CC version | Informational step swallows via `|| true`; release proceeds on `git tag -a` |
| Injected-root refactor breaks a runtime caller | Defaults preserved; full suites + qa-aggregate diff vs main catch it pre-merge |
| Installed 2.1.25 copy still has old `.mcp.json` layout | Expected until the next marketplace release; not a regression (plugin-context expansion works there) |

---

## 7. Security Considerations

- plugin.json gains one already-whitelisted key; ADR 0011 enforcement intact (validate-plugin --strict stays a gate)
- No permission/auth surfaces; no new network calls; audit-logger change is path resolution only (JSONL content unchanged)

---

## 8. Test Plan

| Layer | Target | Tool/Command |
|---|---|---|
| L1 static | MS suite (new location + lock), validate-plugin --strict, contract L1/L4 both baselines | node runners |
| L2 | l2-smoke + hook-attribution (unchanged hooks — regression only) | node |
| L3 | l3-mcp-compat + l3-mcp-runtime (servers untouched — regression only) | node |
| L5 | invocation-inventory (MCP tools 19 — regression only) | node |
| Isolation | I-14 guard (unit + meta hash levels); 5 refactored suites | node |
| Live probes (QA) | fresh `claude mcp list` (SC-1); `claude -p --plugin-dir .` MCP tool call (SC-2a); installed-copy note (SC-2b); release script `--dry-run` (SC-3) | claude CLI |
| Release gates | docs-code-sync, bkit-full-system, check-deadcode, domain-purity, guards, test-tracking, qa-aggregate diff vs main | scripts |

Scenario expectations: SC-1 zero bare entries + zero diagnostics; SC-2 tool call returns valid JSON; SC-3 dry-run prints all OK lines incl. new informational tag-consistency echo; I-14 hash-identical.

---

## 9. Clean Architecture

| Component | Layer | Location |
|---|---|---|
| Inline mcpServers | Config manifest | `.claude-plugin/plugin.json` |
| Release tag step | Adapter (script) | `scripts/release-plugin-tag.sh` |
| pluginTagCommand milestone | Infrastructure | `lib/infra/cc-version-checker.js` |
| projectRoot injection | Application (pdca) / Infra (audit) | `lib/pdca/batch-orchestrator.js`, registry/audit writers (Do names them) |
| Guard + isolated tests | Test | `test/regression/`, `test/unit/`, `test/integration/` |
| Governance docs | Docs | `docs/adr/`, `docs/06-guide/` |

Dependency rules: injection params flow outer→inner as plain arguments; domain layer untouched; check-domain-purity must stay green.

---

## 10. Coding Convention Reference

- English-only implementation; docs/ new files as bilingual pairs; no version bumps.
- ENH tag: check CHANGELOG for the next free ENH number during Do (after ENH-368) — do not guess.
- tmp-root tests: follow the mkdtemp pattern of `tests/contract/v2113-sprint-contracts.test.js` (which becomes fully effective once I-11/I-12 land).
- New test files must pass `scripts/check-test-tracking.js` (git add before gate run).

---

## 11. Implementation Guide

### 11.1 Implementation Order

1. [ ] module-1 MAIN: I-1, I-2, I-3 → validate + MS suite + repo-cwd mcp-list probe
2. [ ] module-2 tooling: I-5, I-6 → script dry-run e2e
3. [ ] module-3 isolation: I-10, I-11, I-12 (read call chains first), then I-13, I-14 → suites + guard + qa-aggregate diff
4. [ ] module-4 governance docs: I-7, I-8, I-9, I-15 (bilingual pairs)
5. [ ] module-5 wrap: I-16 CHANGELOG, I-17 local cleanup, full gate suite, packed smoke (I-4), gap analysis

### 11.2 Session Guide

#### Module Map

| Module | Scope Key | Description | Estimated Turns |
|--------|-----------|-------------|:---------------:|
| MAIN MCP relocation | `module-1` | I-1..I-3 + probes | 8-12 |
| Release tooling | `module-2` | I-5, I-6 | 5-8 |
| Isolation refactor | `module-3` | I-10..I-14 (read-first mandatory) | 15-25 |
| Governance docs | `module-4` | I-7..I-9, I-15 (4 bilingual artifacts) | 10-15 |
| Wrap + verify | `module-5` | I-16, I-17, gates, smoke, gap | 10-15 |

#### Recommended Session Plan

Single session via `/pdca do v2126-issue-response` with team split (module-1/2/4 parallelizable; module-3 sequential read-first; module-5 orchestrator). If context runs low, split after module-3 — state persists in Task Management + memory + this doc.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-07-02 | Initial draft — Option C approved (Checkpoint 3) | PDCA pipeline |
