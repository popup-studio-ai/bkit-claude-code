---
name: pdca-eval-pm
description: DEPRECATED in v2.1.13. PDCA PM phase evaluation is now performed by the PM Agent Team (pm-lead orchestrating pm-discovery, pm-strategy, pm-research, pm-prd). This stub exists only to satisfy contract baseline v2.1.9 deprecation governance (L4).
model: sonnet
effort: medium
tools: []
deprecatedIn: v2.1.13
deprecatedReason: dead code cleanup — pdca-eval-pm was superseded by the PM Agent Team (pm-lead + pm-discovery/strategy/research/prd)
replacedBy: pm-lead
deprecationCommit: 967cd8f
---

# pdca-eval-pm (DEPRECATED)

This agent was removed in v2.1.13 as part of the sprint integration gaps + dead code cleanup
(commit `967cd8f`, 2026-05-12). The original `pdca-eval-pm` evaluated PDCA PM phase outputs
(market fit, prioritization, PRD). Its function has been absorbed by the PM Agent Team:
`pm-lead` orchestrating `pm-discovery` (5-step + OST), `pm-strategy` (JTBD + Lean Canvas),
`pm-research` (personas + competitors), and `pm-prd` (synthesis).

This file is a deprecation tombstone — it MUST NOT be invoked. It exists solely to satisfy
the L4 Deprecation Detection contract gate (`test/contract/scripts/contract-test-run.js`)
relative to the v2.1.9 baseline manifest. See `docs/06-guide/contract-baseline-rollforward.guide.md`
for the deprecation policy.
