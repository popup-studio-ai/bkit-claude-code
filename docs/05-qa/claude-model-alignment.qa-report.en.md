# claude-model-alignment QA Report

> **Feature**: claude-model-alignment · **Branch**: `feat/v2.1.25-claude-model-alignment` · **Date**: 2026-07-02
> **QA Lead**: qa-lead (Claude Fable 5) · **CC runtime**: headless `claude` **v2.1.198** (≥ model floor 2.1.170)
> **Design SoT**: [claude-model-alignment.design.en.md](../02-design/features/claude-model-alignment.design.en.md) §8 Test Plan
> **Check phase**: [claude-model-alignment.analysis.en.md](../03-analysis/claude-model-alignment.analysis.en.md) — Match Rate **100%**
> **Scope note**: bkit is a Claude Code **plugin** (no web server). L1–L5 map to plugin surfaces (static gates / live skill dispatch / live MCP / advisory boundary / docs=code), not HTTP layers.
> **Verdict**: **QA_PASS**

---

## 1. Test Summary

| Layer | Meaning (plugin mapping) | Test(s) | Count | Result |
|---|---|---|:--:|:--:|
| **L1** | Plugin static gates (spot-check of already-green suite) | `test/security/agent-frontmatter.test.js`; `contract-test-run.js --compare v2.1.16 --level L1,L4` | 55/55 + 255 assertions | ✅ PASS |
| **L2** | Live skill dispatch (bkit state machine) | `claude -p "/pdca status" --model haiku --plugin-dir .` | 1/1 | ✅ PASS |
| **L2b** | Live agent spawn on NEW models | pdca-iterator (fable) + sprint-report-writer (sonnet) probes | 2/2 | ✅ PASS |
| **L3** | Live MCP server + tool | `bkit_pdca_status` MCP call via `claude -p` | 1/1 | ✅ PASS |
| **L4** | Advisory boundary (logic) | `test/e2e/external-dogfood/cc-min-version.test.js` | 9/9 | ✅ PASS |
| **L5** | Docs = Code | `scripts/docs-code-sync.js` + `tests/qa/bkit-full-system.test.js` | sync + 36/0 | ✅ PASS |

**Aggregate**: 6/6 layers PASS · **pass rate 100%** · **0 critical** · **0 failures**.

L1 spot-checks reproduced the analysis §5 numbers exactly (security **55/55**, contract v2.1.16 **255** assertions) — the full already-green suite (l2-smoke 101/101, l3-mcp 92+48, L5 210/210, etc.) was **not** re-run per instructions.

---

## 2. Failed Tests

**None.** Every executed check passed. No regression introduced by the feature branch.

Two behavioral (non-failure) observations are recorded in §6 for transparency:
1. `sprint-report-writer` initially declined an introspection prompt as off-mission (mission-scope refusal — spawn succeeded, not a model defect).
2. The MCP tool required an explicit `--allowedTools` grant in headless mode (expected headless permission behavior, not a defect).

---

## 3. Critical Issues

**None.** `qaCriticalCount = 0`.

Security invariant re-confirmed: `security-architect` / `code-analyzer` / `self-healing` remain `opus` (never `fable`) — SEC-AF suite 55/55 green (L1 spot-check), matching design §7.

---

## 4. Evidence (command outputs quoted)

### L1-a — Security agent-frontmatter suite
```
=== Agent Frontmatter Security Test Summary ===
Total: 55 | Pass: 55 | Fail: 0
```
(Includes SEC-AF-051 valid-model whitelist incl. `fable`, and SEC-AF-052 premium-model read-only cost guard.)

### L1-b — Contract compare v2.1.16 (L1,L4)
```
[contract] Runner v2.1.10 — compare against v2.1.16, levels: L1,L4
[contract] Assertions executed: 255
[contract] ✓ PASSED (255 assertions, 0 warnings)
```

### L2 — Live `/pdca status` skill dispatch (`--model haiku --plugin-dir .`)
```
│  PM✓  PLAN✓  DESIGN✓  DO✓  CHECK✓  QA▶  REPORT·              │
└─ qa • last: 2m ago • matchRate: 100% • iter: 0/5               ┘
 Feature: claude-model-alignment · Phase: QA (6/9) · Match Rate: 100%
```
Skill loaded, resolved feature `claude-model-alignment` in the **qa** phase — bkit state machine functional. No model-floor advisory emitted (CC 2.1.198 ≥ 2.1.170 — correct); fable agents spawn without hard error.

### L2b — Live agent spawn on NEW model pins (`--model sonnet --plugin-dir . --allowedTools Task`)
```
# pdca-iterator (opus → fable, NOT covered by probe R3):
You are powered by the model named Fable 5. The exact model ID is claude-fable-5.

# sprint-report-writer (opus → sonnet):
bkit:sprint-report-writer … Sonnet 5 (model ID: claude-sonnet-5)
```
Both newly-repinned agents resolve live to their intended Claude 5 model. The `fable` pin survives the runtime whitelist (no silent coercion to `sonnet` — NFR "No Silent Downgrade" live-evidenced).

### L3 — Live MCP tool `bkit_pdca_status` (`--allowedTools mcp__plugin_bkit_bkit-pdca__bkit_pdca_status`)
```
version: 3.0 · lastUpdated: 2026-07-02T04:11:17.233Z
activeFeature: claude-model-alignment (1 active) · qa: 1 · plan: 3
```
MCP server (`bkit-pdca`) booted and the tool returned the feature status including the **qa** phase. (First call surfaced the expected headless permission prompt; re-run with the read-only tool allow-listed returned the payload.)

### L4 — Advisory boundary logic (`cc-min-version.test.js`)
```
✓ TC-ENH368-1 v2.1.150 → model-floor advisory (fable agents + workaround)
✓ TC-ENH368-2 v2.1.170 → no advisory
✓ TC-ENH368-3 v2.1.198 → no advisory
✓ TC-ENH368-4 v2.1.142 → install-floor advisory only (precedence)
Total: 9 | PASS: 9 | FAIL: 0
```
Dual-floor boundaries hold: model-floor advisory fires only in `2.1.143 ≤ CC < 2.1.170`; silent above the floor. TC-ENH368-3 independently confirms the advisory is absent on the live 2.1.198 runtime.

### L5 — Docs = Code
```
[docs-code-sync] ✓ PASSED — all counts consistent across code + docs
  (skills 44 · agents 34 · One-Liner SSoT 5/5 synchronised)

[bkit-full-system.test] 36 PASS / 0 FAIL / 0 WARN
```

---

## 5. Success-Criteria & NFR Verdict

### 5.1 Plan Success Criteria (§4.1 SC-1..SC-5)

| ID | Criterion | Verdict | Evidence |
|---|---|:--:|---|
| **SC-1** | All 40 `agents/*.md` `model:` = approved matrix | ✅ Met | Analysis 100% + contract v2.1.16 255 assertions (L1-b) + SEC-AF 55/55 (L1-a) |
| **SC-2** | fable-pinned agent probe → `claude-fable-5`; haiku-pinned → `claude-haiku-4-5-*` (headless) | ✅ Met (extended) | R3: gap-detector→fable, report-generator→haiku; **this QA** live-extends to pdca-iterator→`claude-fable-5` (L2b) |
| **SC-3** | Full local gate suite green | ✅ Met | Analysis §5 full suite + reproduced spot-checks (L1-a/b) + L4 9/9 + L5 |
| **SC-4** | token-report proves fable class + $10/$50 + Claude 5 classing | ✅ Met (analysis-backed) | Analysis token-report 24/24 (not re-run — within spot-check budget); live cost path exercised via fable spawn |
| **SC-5** | Zero docs=code drift; 3 legacy bugs fixed; counts consistent | ✅ Met | `docs-code-sync.js` PASS + `bkit-full-system` 36/0 (L5) |

> SC-6 (GitHub Actions on push) and SC-7 (release notes) are **release-phase** criteria, out of QA scope; SC-7 draft already exists per analysis §1.

### 5.2 Non-Functional Requirements (§3.2)

| NFR | Verdict | Evidence |
|---|:--:|---|
| CI Integrity (contract L1-L5 + security + unit + release gates) | ✅ Pass | L1-a/b reproduced + analysis §5 full green |
| Docs = Code (zero drift) | ✅ Pass | L5 docs-code-sync + bkit-full-system green |
| Backward Compat (no hard error on floor; advisory below) | ✅ Pass | L4 9/9 incl. ENH-368 boundaries |
| Cost Accuracy (Claude 5 never `unknown`; fable $10/$50) | ✅ Pass | Analysis token-report 24/24; live fable ledger path |
| No Silent Downgrade (fable survives handler coercion) | ✅ Pass | I-2 whitelist + live pdca-iterator resolved to fable, not sonnet (L2b) |
| Security Posture (security-architect ≠ fable) | ✅ Pass | SEC-AF 55/55 (L1-a) + design §7 |
| Traceability (R1 retained + re-verified in QA) | ✅ Pass | This QA phase live probes (L2/L2b/L3) |

---

## 6. Recommendations

1. **Proceed to Report phase** (`/pdca report claude-model-alignment`) — all QA gates green.
2. **Release-phase follow-ups** (out of QA scope): confirm SC-6 (GitHub Actions contract-check green on push) and finalize SC-7 release notes from the existing draft.
3. **Version**: keep `.claude-plugin/plugin.json` at `2.1.24` (canonical per `docs-code-sync`) — the `2.1.25` heading is provisional labeling; the maintainer assigns the release version (repo rule).
4. **Behavioral note (no action required)**: `sprint-report-writer` and the main session both correctly refused adversarially-framed introspection prompts; a neutral model-resolution prompt succeeds. This is desirable safety behavior, not a defect — no change needed.
5. **Headless MCP**: the `bkit_pdca_status` tool requires an explicit allow-list in headless (`claude -p`) mode. Expected CC permission behavior; document if headless MCP automation is added later.

---

## Verdict

**QA_PASS** — 6/6 layers green, 100% pass rate, 0 critical, 0 failures. All live functional layers (skill dispatch, MCP, and agent spawn on the new Fable/Sonnet 5 pins) confirm the model-alignment feature behaves as designed on CC v2.1.198, complementing the already-green static/contract suite.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-07-02 | Initial QA report — L1-L5 live functional layer over green Check suite; QA_PASS | qa-lead |
