# CC v2.1.215 → v2.1.217 Impact Analysis Report

- **Analysis cycle**: #28
- **Analysis date**: 2026-07-22
- **Scope**: CC v2.1.216 (40 bullets) + v2.1.217 (20 bullets) = **60 bullets**
- **Installed version**: 2.1.217 → **latest 2.1.217**
- **dist-tags**: `latest=2.1.217`
- **Verdict**: **0 Breaking / 0 ENH / fully compatible** — no bkit action required. Consecutive compatible **160**, 0-ENH streak **28 cycles**

---

## 1. Executive Summary

CC v2.1.216 and v2.1.217 total 60 bullets and are **fix-heavy releases** (216: 30 Fixed / 217: 13 Fixed).
There are no new APIs, hook events, or breaking changes, and the entire bkit surface — 44 skills / 34 agents /
22 hook events — is **compatibility-unaffected**.

The defining trait of this cycle is **two upstream events that re-confirm bkit's existing design and differentiators**:

1. **(217) Nested subagents disabled by default** — bkit has documented this restriction since v2.1.69 and
   already routes around it via `/pdca team` (independent sessions, 1-level Task). CC making this a **hard default**
   is an upstream **vindication** of bkit's architecture. No action required.
2. **(216) Fixed plugin skills with a `name:` frontmatter field losing their plugin prefix in autocomplete** —
   a bug affecting all 44 bkit skills, now **fixed natively** by CC. The root cause of bkit issue #125 / MF-3 is
   resolved upstream → recommend marking MF-3 for CLOSE.

### 4-Perspective Value Table

| Perspective | Rating | Basis |
|-------------|--------|-------|
| **Compatibility** | ✅ No impact | 0 breaking. All 60 bullets IMMUNE or upstream-resolved. 0 files to change |
| **Feature opportunity** | ➖ None | No new native surface for bkit to activate (concurrency cap & nested-spawn both align with bkit's existing model) |
| **DX (indirect gain)** | 🟢 Improved | (216) skill prefix restored → 44 skills autocomplete correctly as `bkit:<skill>` / (216) mid-session skill hot-reload / (216) quadratic normalization slowdown fix → faster long orchestration sessions |
| **Risk** | 🟡 Version drift (minor) | `RECOMMENDED_VERSION` stale at 2.1.198 → **19 releases behind latest (CRITICAL)**. Maintainer bump recommended |

---

## 2. Phase 1: CC Change Research

### 2.1 Categorization (216 + 217)

| Category | v2.1.217 | v2.1.216 | Total |
|----------|---------|---------|-------|
| Breaking | 0 | 0 | **0** |
| Added (Feature) | 3 | 1 | 4 |
| Fixed | 13 | 30 | 43 |
| Improved | 1 | 5 | 6 |
| Other (Changed/Capped/plain) | 3 | 4 | 7 |
| **Total bullets** | **20** | **40** | **60** |

### 2.2 bkit-relevant items (with external issue mapping)

| # | Bullet (verbatim, excerpt) | Impact | GitHub issue | bkit verdict |
|---|---------------------------|--------|--------------|--------------|
| 217 | Changed subagents to no longer spawn nested subagents by default (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` to allow) | HIGH | #68110 (driver), #78406 (doc) | **IMMUNE / vindication** — §4.2 #1 |
| 217 | Added cap on concurrently-running subagents (default 20, `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`) | MEDIUM | #63938 (delivered) | **IMMUNE** — bkit max concurrency 3 |
| 217 | Fixed CLAUDE.md/SKILL.md `paths` frontmatter with many brace groups OOM-killing CLI at startup | MEDIUM | (internal) | **IMMUNE** — 0 brace-expansion in bkit frontmatter |
| 216 | Fixed plugin skills with a `name` frontmatter field losing their plugin prefix in autocomplete | **HIGH** | #22063 (closed not_planned, yet fixed) | **Upstream-resolved** — root cause of MF-3/#125 |
| 216 | Fixed Bash permission checking for compound statements with redirects inside `&&` lists or negations | MEDIUM | #28784, #29491, #16561 | **IMMUNE / synergy** — Layer-6 own hook |
| 216 | Fixed Bash parsing of non-ASCII chars / PowerShell invisible Unicode permission | MEDIUM | — | **IMMUNE / synergy** |
| 216 | Fixed workflow/scheduled-task writes following a symlink at `.claude` + `/rewind` symlink protection | MEDIUM | — | **IMMUNE** — bkit uses own `.bkit/checkpoints/` |
| 216 | Fixed worktree-isolated subagents redirecting git into shared checkout | MEDIUM | — | Indirect benefit (worktree isolation hardened) |

> Remaining low-relevance bullets (emoji autocomplete, Windows auto-update, mTLS/OAuth Desktop, screen-reader,
> OTEL signal-scoping, resume TypeError, dataviz palette, etc.) have no bkit surface — LOW/IMMUNE.

---

## 3. Phase 1.5: Raw Source Verification Gate

Per the memory lesson (model-WebFetch cross-section hallucination risk), counts were fixed via **raw bytes directly**.

| Field | Agent reported | Raw verified | Source | Verdict |
|-------|---------------|--------------|--------|---------|
| Added (217/216) | 3 / 1 | 3 / 1 | raw CHANGELOG | match |
| Fixed (217/216) | 13 / 30 | 13 / 30 | raw CHANGELOG | match |
| Improved (217/216) | 1 / 5 | 1 / 5 | raw CHANGELOG | match |
| Breaking | 0 | 0 | raw CHANGELOG | match |
| **Total bullets** | **60** | **60** (20+40) | raw + gh api | **match** |

**Cross-verification sources (2, fully consistent)**
1. `curl raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md`
   → header grep (`3:## 2.1.217`, `26:## 2.1.216`, `69:## 2.1.215`) + line-range `grep -cE "^- "` → 20 / 40
2. `gh api repos/anthropics/claude-code/releases/tags/v2.1.217` and `.../v2.1.216`
   → release body `grep -cE "^- "` → 20 / 40 (byte-identical to raw)

**Spot-check**: verbatim-compared the orchestration/permission/skill-namespace key bullets of both releases
(217 #18/#19, 216 name-prefix / compound-redirect). **errata 0.**

---

## 4. Phase 2: bkit Impact Analysis

### 4.1 Architecture measurement (Glob/Read/Grep + Bash dual measurement)

| Item | Measured | Memory record | Verdict |
|------|----------|---------------|---------|
| Agents | 34 | 34 | match |
| Skills | 44 | 44 | match |
| Hook events | 22 | 22 | match |

> No Numeric Correction. Main session independently re-measured via `ls -1 agents/*.md` (34),
> `ls -1 skills/*/SKILL.md` (44), and `hooks/hooks.json` .hooks keys = 22 (SessionStart…FileChanged).

### 4.2 Item-by-item analysis

#### #1 (217) Nested subagents disabled by default — **IMMUNE / vindication**

bkit has **documented CC's nested-spawn restriction since v2.1.69** and designed around it (main-session verified):

- `agents/cto-lead.md:65-71` — "As Standalone Subagent (via `@cto-lead`): Task() tools are blocked by CC's
  nested spawn restriction. Use `/pdca team {feature}` instead." / The teammate path runs in an "independent
  Claude Code session" where Task() operates as **1-level subagents (NOT nested spawn)**.
- `agents/pm-lead.md:44-51` — same pattern (`/pdca pm` = independent session, `@pm-lead` = Task() blocked).

grep `Task\(` shows 21 agents declare Task(), but even the deepest chain
(`sprint-orchestrator → sprint-master-planner → pm-lead → pm-discovery`) executes as **sequential
independent-session dispatch** (`sprint-orchestrator.md:67-69` `await completion`), not standard nested spawn.

**Conclusion**: (a) no agent depends on depth≥2 standard nesting, (b) the 217 default does not block bkit,
(c) no need to set/document `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`. 217 **confirms bkit's "CC v2.1.69+
Architecture Note" as the upstream default** → a design-vindication case. **No ENH.**

#### #2 (217) Concurrent subagent cap (default 20) — **IMMUNE**

bkit max concurrency: `lib/pdca/feature-manager.js:33` `MAX_CONCURRENT_DO = 1`, `:30`
`MAX_CONCURRENT_FEATURES = 3`, `lib/pdca/batch-orchestrator.js:36` `DEFAULT_MAX_CONCURRENT = 3`.
Max 3 ≪ 20 → cannot exceed the cap. (Distinct axis from the v2.1.212 per-session 200 cap.) **No ENH.**

#### #3 (216) Plugin skill `name:` prefix-loss fix — **HIGH / upstream-resolves MF-3·#125**

grep `^name:` in `skills/**/SKILL.md`: **all 44 skills** carry `name:` frontmatter. Every bkit skill was in
the prefix-loss bug's blast radius, and 216 fixes it natively. Importantly, bkit **never implemented a
name-mangling workaround** for #125 (no `name:` hardcodes a `bkit:` prefix; the `skill-create` template emits a
plain `name: {name}`) → 216 restores the `bkit:` autocomplete prefix **with no code to remove**.

**The root cause of MF-3 (`/code-review` namespace not marked) is resolved upstream** → recommend re-verifying
MF-3 as "CC-native-resolved" and CLOSE. The unqualified doc references at `skills/bkit/SKILL.md:55` /
`hooks/startup/session-context.js:574` remain functionally valid (ambiguity handled by CC's prefix preservation).
**No ENH.**

#### #4 (217) `paths` frontmatter brace-group OOM fix — **IMMUNE**

grep shows **0** `paths:` brace-expansions in bkit skill frontmatter → fully immune to the OOM bug. **No ENH.**

#### #5 (216) Compound-redirect in `&&`/negation + non-ASCII/PowerShell-Unicode permission fixes — **IMMUNE / synergy**

bkit's Layer-6 defense (differentiator #6 heredoc-bypass, #58904) runs as its own PreToolUse(Bash) hook in
`hooks/hooks.json`, independent of CC's parser. CC's hardening is defense-in-depth synergy. **Differentiator #6
INTACT** — 216 sealed compound-redirect + Unicode but left heredoc-pipe (#58904) unfixed (closed as
not_planned) → the CC-abandoned streak extends **+2 releases**. **No ENH.**

#### #6 (216) `.claude` symlink write block + `/rewind` symlink protection — **IMMUNE / orthogonal**

bkit rollback/checkpoint uses its own `.bkit/checkpoints/` rather than CC's `/rewind`/`.claude` workflow
(`skills/rollback/SKILL.md:45,86-89`). Orthogonal. **No ENH.**

#### LOW / passive

| CC change | Verdict |
|-----------|---------|
| 216 AskUserQuestion continue/wait fix | passive UX win (bkit uses AskUserQuestion heavily) |
| 216 quadratic message normalization slowdown fix | passive — faster long orchestration sessions |
| 216 telemetry permission-denial misreporting fix | adjacent to differentiator #5 continueOnBlock, passive alignment |
| 217 OTEL managed endpoint signals | orthogonal — bkit uses own file-ledger |
| 217 emoji autocomplete / Windows auto-update / mTLS Desktop etc. | unrelated, IMMUNE |

### 4.3 File Impact Matrix

| File | Change needed | Reason |
|------|--------------|--------|
| — | **0** | All items IMMUNE or upstream-resolved |

No-change evidence: `agents/cto-lead.md:62-71`, `agents/pm-lead.md:44-51` (nested documented),
`skills/**/SKILL.md` (name present, no workaround), `lib/pdca/feature-manager.js:30,33` (concurrency ≤3),
`skills/rollback/SKILL.md` (`.bkit/checkpoints/` own path).

### 4.4 Test Impact

New/modified TCs: **0**. No effect on the existing regression suite.

### 4.5 Philosophy Compliance

0 new ENH → no risk against the three principles (Automation First / No Guessing / Docs=Code).

---

## 5. Phase 3: Brainstorm & YAGNI

### 5.1 Intent discovery
- **Max value**: none. No new native surface for bkit to activate. Concurrency/nested-spawn controls already
  match bkit's model.
- **Must-not-miss change**: none (0 breaking). But the 216 name-prefix fix **resolves MF-3 upstream** = a chance
  to tidy the tracker.
- **Workaround-replacement opportunity**: none — bkit never had a name-mangling workaround for #125.

### 5.2 Alternative exploration
Two candidate enhancements reviewed, both rejected:

1. **(rejected) Add `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` guidance to Agent Teams docs**
   - Reason: bkit does not depend on nested spawn; it routes to independent (1-level) sessions. Setting the env
     var is unnecessary for bkit and would be an anti-pattern that disables CC's exponential-fanout guard (#68110).
2. **(rejected) Qualify docs `/code-review` → `/bkit:code-review`**
   - Reason: 216 restores the autocomplete prefix natively → ambiguity resolved at the CC layer. Changing doc
     text is low-value. Tidying MF-3 to CLOSE (managed under the #125 track) suffices.

### 5.3 YAGNI review result
- ENH passed: **0** — fails the 27-cycle HIGH-bar ("a present-day pain the CC change enables solving").
- **No new ENH → 28-cycle 0-ENH streak.** ENH-367 remains reserved (unconsumed).

### 5.4 Priority assignment
| ID | Item | Priority |
|----|------|----------|
| — | none | — |

---

## 6. Monitor State Update

| Monitor | Prev (#27) | Now (#28) | Note |
|---------|-----------|-----------|------|
| **MF-2** (`lib/infra/cc-version-checker.js:42` `RECOMMENDED_VERSION='2.1.198'`) | OPEN, 17-release stale | **OPEN, 19-release stale (CRITICAL)** | drift 217−198=19 vs latest. **Bump to 2.1.217 recommended** (maintainer decision, unimplemented) |
| **MF-3** (`/code-review` namespace not marked) | OPEN (new LOW) | **RESOLVED (CC-native)** | 216 plugin name-prefix fix resolves the root cause upstream. Review for CLOSE |
| Differentiator streak (#56293·#57317·**#58904 heredoc**) | intact | **intact (+2 releases)** | 216 sealed compound-redirect/Unicode ≠ heredoc-pipe. #58904 still not_planned & unfixed |
| BG-OTEL-DROP (#64436) | OPEN | **OPEN + widened watch** | 217 expands the background-subagent surface (concurrent cap, bg-stop, budget), widening the work-phase OTEL log-drop window. bkit's own ledger = no direct exposure |
| PLUGIN-HOOK-DROP (#57317) | ACTIVE | ACTIVE (unchanged) | 216 plugin fix is autocomplete namespace (a different surface), not hook delivery |
| STOP-SCHEMA-STRICT (ENH-366) | RESOLVED | unchanged | no change |

**Version constants (measured)**: `MIN='2.1.78'`, `RECOMMENDED='2.1.198'` (stale), `FABLE_MODEL_FLOOR='2.1.170'`

---

## 7. Cumulative Metrics

| Metric | Value |
|--------|-------|
| Consecutive compatible releases | **160** (v2.1.34 – v2.1.217) |
| Consecutive 0-ENH cycles | **28** |
| Global last ENH | ENH-366 (ENH-367 reserved, unconsumed) |
| CC-cycle last ENH | ENH-328 (unconsumed) |
| Recommended CC version | **v2.1.217** allowed/recommended |

---

## 8. Quality Checklist

- [x] All in-scope CC changes captured (60/60)
- [x] Impact grade assigned to every change (HIGH/MEDIUM/LOW)
- [x] ENH priorities assigned (0 items)
- [x] Philosophy compliance checked (N/A)
- [x] File impact matrix complete (0 items)
- [x] Test impact assessed (0 items)
- [x] Written in English (`.ko.md` sibling in parallel)
- [x] Raw verification gate passed (2 sources, errata 0)
- [x] §3 Verification table included
- [x] MEMORY updated
