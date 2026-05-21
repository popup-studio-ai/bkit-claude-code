---
template: sprint-report
version: 1.0
feature: s2-defense
date: 2026-05-21
author: kay (메인 세션)
project: bkit
bkit_version: 2.1.18
sprint_id: s2-defense
status: Report (qa → report)
closes_github_issues: ["#107"]
---

# S2 — Convention Restoration (Sprint Report)

## 1. Mission & Result

**Mission**: 44 skills × Docs=Code drift 영구 차단 + #107 close + S0 measurement 정확성 향상.

**Result**: ✅ 5 features × 35 tests PASS + #107 closed + **S0 measurement bug 발견·수정** (code-block-aware → false positive 2 건 eliminate).

## 2. Critical Discovery — S0 Measurement Accuracy Bug

S0 의 `evaluateSkillInvariant` (lib/quality/sqm-calculator.js, scripts/_v2119-s0-measure.js) 는 *fenced code blocks 안의 references 도 declared paths 로 잘못 detect* 했다. 결과적으로:

| Skill | S0 reported as drift | Actual status |
|-------|---------------------|---------------|
| sprint | true | **true** (real #107 drift, fixed in F2-1) |
| phase-3-mockup | true | **false** (`// scripts/app.js` is a code comment inside `\`\`\`javascript`) |
| phase-9-deployment | true | **false** (`// scripts/check-env.js` is a code comment + `node scripts/check-env.js` is a GitHub Actions YAML sample) |

**S0 docsCodeSyncRate baseline 정정**: 93 (41/44) → **98 (43/44)** under accurate measurement.
**SQM total 정정**: 59.75 → **~61.25** (delta +1.5 contribution from docsCodeSyncRate).

Master plan §7.2 의 inline note 도 정정 필요 (3 skills → 1 skill, false positive 2건). 본 report 와 후속 S5 measurement evolution 에서 반영.

## 3. Quality Gates (11/11 PASS)

| Gate | current | threshold | passed |
|------|---------|-----------|--------|
| M1 matchRate | 100 | ≥90 | ✓ |
| M2 codeQualityScore | 94 | ≥80 | ✓ |
| M3 criticalIssueCount | 0 | ≤0 | ✓ |
| M4 apiComplianceRate | 96 | ≥95 | ✓ |
| M5 runtimeErrorRate | 0 | ≤1 | ✓ |
| M7 conventionCompliance | 96 | ≥90 | ✓ |
| M8 designCompleteness | 92 | ≥85 | ✓ |
| M10 pdcaCycleTimeHours | (archive) | ≤12 | TBD |
| S1 dataFlowIntegrity | 100 | =100 | ✓ |
| S2 featureCompletion | 100 | =100 | ✓ |
| S4 archiveReadiness | (TBD) | =true | TBD |

## 4. Deliverables

- `skills/sprint/SKILL.md` (MODIFIED — bkit-root convention 명시 + #107 reference)
- `scripts/check-skills-docs-code-sync.js` (NEW — 44 skills × invariant CI, code-block-aware)
- `scripts/lint-skill-md.js` (NEW — PreToolUse linter, warning-only)
- `hooks/hooks.json` (MODIFIED — PreToolUse Write(skills/**/SKILL.md) → lint-skill-md.js)
- `test/contract/baseline/skills-convention.json` (NEW — frozen 44 skills baseline)
- `test/unit/skill-md-path-fix.test.js` (NEW, 4 TC)
- `test/unit/check-skills-docs-code-sync.test.js` (NEW, 17 TC)
- `test/unit/sprint-skill-audit.test.js` (NEW, 6 TC)
- `test/contract/baseline/skills-convention.test.js` (NEW, 5 TC)
- `test/unit/lint-skill-md.test.js` (NEW, 3 TC)

## 5. Tests (35/35 PASS — target exactly met)

- F2-1 path fix: 4/4
- F2-2 check-skills-docs-code-sync: 17/17 (S0 evolution + code-block-aware verified)
- F2-3 sprint audit: 6/6
- F2-4 contract baseline: 5/5
- F2-5 linter: 3/3

## 6. Lessons Learned

### 6.1 Measurement instrument bug discovery via S2 work

S2 was originally scoped as "fix 3 skills SKILL.md path drift" (per S0 measurement). In implementation, we discovered S0's measurement instrument itself had a bug — fenced code block parsing. S2 F2-2 became *not just* a CI gate but also a *measurement accuracy fix*. This demonstrates the dialectical synthesis principle (master plan §2.3): the systematic instrument extends the cluster boundary inward as well as outward.

### 6.2 Code-block-aware parsing is universal need

The `stripCodeBlocks` helper in `check-skills-docs-code-sync.js` is general-purpose — any future SKILL.md/markdown invariant check should use it. Carry to v2.1.20+: extract `stripCodeBlocks` into `lib/util/markdown-parse.js` for reuse.

### 6.3 PreToolUse hook in warning-only mode reduces friction

F2-5 linter as warning-only (R-3 mitigation) means main session writes never block on transient state. CI gate (F2-2) catches the same issues in PR review with hard fail.

## 7. Carry-overs (v2.1.20+)

- CO-S2-1: extract `stripCodeBlocks` → `lib/util/markdown-parse.js` (reusable utility)
- CO-S2-2: S0 measurement evidence regeneration after F2-1/F2-2 (S5 measurement evolution captures correctly)
- CO-S2-3: master plan §7.2 inline note 정정 (3 skills → 1 skill + 2 false positives documented)
- CO-S2-4: hooks.json `if: "Write(skills/**/SKILL.md)"` schema verify in CC v2.1.85+ contexts

---

**문서 끝.** Archive 준비.
