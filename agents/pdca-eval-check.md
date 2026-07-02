---
name: pdca-eval-check
description: DEPRECATED in v2.1.13. PDCA Check phase evaluation is now performed by gap-detector + code-analyzer pipeline invoked by qa-lead. This stub exists only to satisfy contract baseline v2.1.9 deprecation governance (L4).
model: haiku
effort: medium
tools: []
deprecatedIn: v2.1.13
deprecatedReason: dead code cleanup — pdca-eval-check was superseded by gap-detector + code-analyzer
replacedBy: gap-detector
deprecationCommit: 967cd8f
---

# pdca-eval-check (DEPRECATED)

This agent was removed in v2.1.13 as part of the sprint integration gaps + dead code cleanup
(commit `967cd8f`, 2026-05-12). The original `pdca-eval-check` evaluated the PDCA Check
phase outputs (gap analysis, code quality, regression). Its function has been absorbed by
`gap-detector` (design-implementation diff) and `code-analyzer` (quality scan), orchestrated
by `qa-lead`.

This file is a deprecation tombstone — it MUST NOT be invoked. It exists solely to satisfy
the L4 Deprecation Detection contract gate (`test/contract/scripts/contract-test-run.js`)
relative to the v2.1.9 baseline manifest. See `docs/06-guide/contract-baseline-rollforward.guide.md`
for the deprecation policy.
