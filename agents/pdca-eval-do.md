---
name: pdca-eval-do
description: DEPRECATED in v2.1.13. PDCA Do phase evaluation is now performed by code-analyzer with qa-monitor runtime verification when Docker logs are available. This stub exists only to satisfy contract baseline v2.1.9 deprecation governance (L4).
model: sonnet
effort: medium
tools: []
deprecatedIn: v2.1.13
deprecatedReason: dead code cleanup — pdca-eval-do was superseded by code-analyzer + qa-monitor
replacedBy: code-analyzer
deprecationCommit: 967cd8f
---

# pdca-eval-do (DEPRECATED)

This agent was removed in v2.1.13 as part of the sprint integration gaps + dead code cleanup
(commit `967cd8f`, 2026-05-12). The original `pdca-eval-do` evaluated the PDCA Do phase
implementation outputs. Its function has been absorbed by `code-analyzer` (static quality)
and `qa-monitor` (runtime Docker log evidence) when applicable.

This file is a deprecation tombstone — it MUST NOT be invoked. It exists solely to satisfy
the L4 Deprecation Detection contract gate (`test/contract/scripts/contract-test-run.js`)
relative to the v2.1.9 baseline manifest. See `docs/06-guide/contract-baseline-rollforward.guide.md`
for the deprecation policy.
