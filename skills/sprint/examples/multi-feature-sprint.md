# Example: Multi-Feature Sprint

> Group several features under one sprint with cumulative KPI tracking.

## Setup

```
/sprint init q2-launch --name "Q2 Launch" --trust L3
```

Then list the features to include — these become entries in
`sprint.features` and contribute to `sprint.featureMap`:

```
/sprint feature q2-launch --add auth
/sprint feature q2-launch --add billing
/sprint feature q2-launch --add onboarding
```

(The `feature` sub-action is fully wired: `add`/`remove` keep `sprint.features[]`
and `sprint.featureMap` in lockstep — each added feature gets a `featureMap`
entry `{ pdcaPhase, matchRate, qa, completion }`, and `remove` drops both.
This twin-source-of-truth sync is what makes the S2 featureCompletion gate
computable.)

## Run with multi-feature QA

```
/sprint start q2-launch
```

When the auto-run loop reaches `qa`, Sprint 4's `sprint-qa-flow` agent iterates
each feature sequentially (ENH-292) and runs the 7-Layer dataFlowIntegrity
check. Results aggregate into `.bkit/runtime/sprint-matrices/data-flow-matrix.json`:

```json
{
  "type": "data-flow",
  "sprints": {
    "q2-launch": {
      "features": {
        "auth":       { "s1Score": 100, "hopResults": [...] },
        "billing":    { "s1Score": 100, "hopResults": [...] },
        "onboarding": { "s1Score": 100, "hopResults": [...] }
      }
    }
  }
}
```

## Cross-sprint cumulative reporting

Run `/sprint list` to see all sprints active or archived. Sprint 5 will
extend this with cumulative cross-sprint reporting using the same
`matrixSync.read('data-flow')` call.

## What to check before archive

- `kpi.featureCompletionRate === 100`
- `kpi.dataFlowIntegrity === 100` (average across features)
- `qualityGates.S4_archiveReadiness.passed === true`

If any feature fails QA, it appears in the carry-items list of the final
report and the sprint can be forked (Sprint 5).
