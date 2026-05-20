---
name: pdca-eval-design
description: DEPRECATED in v2.1.13. PDCA Design phase evaluation is now performed by design-validator with frontend-architect or enterprise-expert review depending on project level. This stub exists only to satisfy contract baseline v2.1.9 deprecation governance (L4).
model: sonnet
effort: medium
tools: []
deprecatedIn: v2.1.13
deprecatedReason: dead code cleanup — pdca-eval-design was superseded by design-validator
replacedBy: design-validator
deprecationCommit: 967cd8f
---

# pdca-eval-design (DEPRECATED)

This agent was removed in v2.1.13 as part of the sprint integration gaps + dead code cleanup
(commit `967cd8f`, 2026-05-12). The original `pdca-eval-design` evaluated the PDCA Design
phase outputs (architecture, schema, API contracts). Its function has been absorbed by
`design-validator` (completeness + consistency) with optional `frontend-architect` /
`enterprise-expert` review based on project level.

This file is a deprecation tombstone — it MUST NOT be invoked. It exists solely to satisfy
the L4 Deprecation Detection contract gate (`test/contract/scripts/contract-test-run.js`)
relative to the v2.1.9 baseline manifest. See `docs/06-guide/contract-baseline-rollforward.guide.md`
for the deprecation policy.
