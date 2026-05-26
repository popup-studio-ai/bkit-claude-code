# bkit External Dogfooder Program

> **bkit Early Adopter Program** — running bkit on a non-trivial production
> project and willing to file detailed bug reports with reproductions
> makes you part of bkit's quality system, not just a bug reporter.
>
> Established v2.1.19 (master plan §15.4 DA-1~DA-4, ENH-318 차별화 7/7).

## What is a Dogfooder?

A **dogfooder** is an external user who runs bkit on their own production project
and files structured bug reports with reproduction scripts. Their feedback
becomes a permanent regression test in bkit's E2E suite.

## 5-stage User-Feedback Lifecycle

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  1. Issue    │ → │  2. Repro    │ → │  3. Fix      │ → │  4. Regress. │ → │  5. Public   │
│   Filed      │    │   Test       │    │   Released   │    │   Lock       │    │   Acknowledge│
│              │    │   Absorbed   │    │              │    │              │    │              │
│ GitHub issue │    │ test/e2e/    │    │ Release tag  │    │ Permanent    │    │ Hall of Fame │
│ w/ steps     │    │ added        │    │ + CHANGELOG  │    │ test suite   │    │ + README     │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                       ↓
                                                              Trust Score component
                                                              (externalDogfoodFeedbackResponseRate,
                                                               weight 0.05, v2.1.19 S4 F4-1)
```

## Benefits

- **Public recognition**: README "Real User Hall of Fame" + per-dogfooder
  `docs/external-dogfooders/<handle>.md` archive
- **Regression lock**: your reproduction scripts become E2E tests at
  `test/e2e/external-dogfood/<handle>-<N>-<desc>.test.js`
- **Trust Score impact**: bkit's externalDogfoodFeedbackResponseRate
  component (weight 0.05) measures the 24h close rate of dogfooder issues —
  dogfooder activity is governance-quality signal
- **CHANGELOG attribution**: every release where your scenarios were
  absorbed lists you in "External Dogfooder Contributions"
- **Direct line to bkit maintainers**: priority issue triage,
  reproduction-script-first response

## How to participate

1. Run bkit on your project (any level — Starter, Dynamic, Enterprise)
2. File detailed issues with:
   - bkit version
   - Reproduction steps (CLI commands or scripts)
   - Expected vs actual behavior
   - File:line references when applicable
3. Engage in issue threads — your follow-up insights shape the fix
4. When your scenario is absorbed, your `docs/external-dogfooders/<handle>.md`
   entry is created

## Current dogfooders

### v2.1.19

- **[@pruge](pruge.md)** (James Kim) — `dandi-village-ledger` project.
  First entry. 10 issues / 1.5 days driving v2.1.17, v2.1.18, v2.1.19
  releases. 5 reproduction scenarios absorbed at `test/e2e/external-dogfood/dandi-*.test.js`.

### v2.1.20

- **[@bj](bj.md)** (정병진) — bkit v2.1.14 install incident
  (2026-05-26, `Validation errors: : Unrecognized key: "displayName"`).
  Second entry — drove the entire `v2120-marketplace-recovery` sprint
  (14 features / 3 sub-sprints / ENH-321 + ENH-322 + ENH-323 / ADR 0011).
  Reproduction absorbed at `test/e2e/external-dogfood/cc-min-version.test.js`.

## Acquisition Goal (DA-4)

Master plan §15.4 DA-4: by v2.1.20 (30 days post-v2.1.19 GA), measure
dogfooder population. **DA-4 status**: N=2 confirmed (@pruge + @bj) — first
follower effect validated. v2.1.21+ scope continues active outreach
(CC marketplace narrative, community engagement) to grow N≥3.

---

**Joining**: just file your first detailed issue. We track from there.
