---
handle: pruge
github: https://github.com/pruge
project: dandi-village-ledger
first_contribution_at: 2026-05-20
total_issues: 10
scenarios_absorbed: 5
hall_of_fame_release: v2.1.19
trust_score_impact: "+0.05 weight component (lifelong governance signal)"
---

# @pruge (James Kim) — bkit Real User Hall of Fame

> First entry in the bkit External Dogfooder Hall of Fame (v2.1.19).
>
> [GitHub @pruge](https://github.com/pruge) · `dandi-village-ledger` project ·
> 10 issues / 1.5 days · 5 scenarios absorbed · master plan §15.4 evidence.

## Overview

James Kim (@pruge) was the **first external dogfooder** to deeply exercise
bkit's Sprint Management on a production project. Between 2026-05-20 and
2026-05-21, he filed 10 GitHub issues in 1.5 days — all in the sprint
domain — a precise diagnostic cluster that prompted bkit **v2.1.17**,
**v2.1.18**, and the entire **v2.1.19 Quality Maturation Sprint**.

The precision of his reproduction scripts and root-cause analyses was
such that bkit could turn issues directly into E2E tests *before*
writing a single line of fix code (see master plan §2.3 dialectical
synthesis).

## Issue Timeline (10 issues)

| # | Filed | Title (excerpt) | Closed | Hours to close | Released in |
|---|-------|-----------------|--------|----------------|-------------|
| #92  | 2026-05-20 00:40 | sprint-orchestrator records M8 but not M4 | 2026-05-20 05:34 | 4.9 | v2.1.17 |
| #93  | 2026-05-20 00:40 | gate_fail should auto-generate failure report | 2026-05-20 05:34 | 4.9 | v2.1.17 |
| #94  | 2026-05-20 00:40 | No user-invokable single-gate measure command | 2026-05-20 05:34 | 4.9 | v2.1.17 |
| #95  | 2026-05-20 01:03 | L2 trust has no approval mechanism | 2026-05-20 05:34 | 4.5 | v2.1.17 |
| #100 | 2026-05-21 03:54 | sprint-orchestrator missing Task tool | 2026-05-21 06:37 | 2.7 | v2.1.18 |
| #101 | 2026-05-21 03:54 | L1 sprint trust mutation command missing | 2026-05-21 06:37 | 2.7 | v2.1.18 |
| #102 | 2026-05-21 03:54 | CLI parser: --trust silently ignored | 2026-05-21 06:37 | 2.7 | v2.1.18 |
| #103 | 2026-05-21 05:04 | failure-reporter mark/move resolved | (open, v2.1.19 S3) | n/a | v2.1.19 |
| #104 | 2026-05-21 05:04 | sprint init auto-import context | (open, v2.1.19 S3) | n/a | v2.1.19 |
| #105 | 2026-05-21 05:04 | generateReport include qualityGates | (open, v2.1.19 S3) | n/a | v2.1.19 |
| #107 | 2026-05-21 08:40 | SKILL.md path mismatch | (open, v2.1.19 S2) | n/a | v2.1.19 |

**Closed issues**: 7 (#92-95 + #100-102).
**24h close rate**: 7/7 = **100%** (S0 baseline measurement, master plan §7.2).

## Absorbed Scenarios (5)

Each pruge scenario became a permanent E2E regression test in v2.1.19 S4 F4-4:

1. **`test/e2e/external-dogfood/dandi-100-orchestrator-task-tool.test.js`**
   — Reproduces #100 sprint-orchestrator Task tool failure mode.
2. **`test/e2e/external-dogfood/dandi-101-trust-mutation.test.js`**
   — Reproduces #101 L1 lockout escape via `/sprint trust` (v2.1.18 fix).
3. **`test/e2e/external-dogfood/dandi-102-trust-alias.test.js`**
   — Reproduces #102 `--trust` alias acceptance (v2.1.18 fix).
4. **`test/e2e/external-dogfood/dandi-107-skill-md-path.test.js`**
   — Reproduces #107 SKILL.md path drift detection (v2.1.19 S2 F2-1 prereq).
5. **`test/e2e/external-dogfood/dandi-general-l1-workflow.test.js`**
   — General L1 sprint full-lifecycle scenario synthesized from issue
   patterns (init L1 → warning → trust escalate → measure → archive).

## Bonus Discovery (S0 measurement)

S0 baseline SQM measurement (v2.1.19 master plan §23 step 0) revealed
*additional* docs/code drift beyond the reported #107: `phase-3-mockup`
and `phase-9-deployment` SKILL.md path mismatches. pruge's issue
boundary (sprint skill only) was extended by the systemic measurement
instrument — exactly the dialectical synthesis described in master
plan §2.3 ("cluster boundary extends to the user's *next scenario surface*").

## Trust Score Impact

Per v2.1.19 S4 F4-1, the `externalDogfoodFeedbackResponseRate` component
(weight 0.05) of bkit's Trust Score is computed from the closed-only
24h response rate of dogfooder issues. pruge's contribution at v2.1.18:
**100% (7/7 within 24h)** — the first measured baseline for ENH-318.

This means his activity is a *permanent governance signal* in bkit —
not just historical record.

## Quote

> *(Placeholder — quote pending @pruge's explicit consent. Hall of Fame
>  entries respect dogfooder agency over public attribution.)*

## Quality of Reproduction

What made pruge's reports exemplary:

- **File:line references** in every issue body (e.g. "scripts/sprint-handler.js:942")
- **Environment specs** (bkit version, OS, Node version, plugin path)
- **Reproduction scripts** that bkit could execute verbatim
- **Expected vs Actual** sections with concrete state file snapshots
- **Cross-references** to related issues + bkit master plan sections
- **Workaround documentation** so others could mitigate while waiting for fix

## See also

- `docs/external-dogfooders/_README.md` — overall program structure
- `docs/01-plan/features/v2119-bkit-quality-maturation.master-plan.md` §2.3 (dialectical synthesis), §15.4 (DA-1~DA-4), §17.3 (차별화 #7 ENH-318)
- `docs/03-analysis/v2118-sqm-baseline.analysis.md` — S0 measurement evidence

---

**Thank you, @pruge.** Your precision raised the standard for what
bkit feedback can look like.
