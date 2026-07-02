---
title: Eval Re-baseline Guide (SOP)
audience: bkit maintainers, contributors
status: Active
since: v2.1.26 (provisional)
last-updated: 2026-07-02
---

# Eval Re-baseline Guide (SOP)

> Standard operating procedure defining **what** the `model_baseline` field in `evals/*/eval.yaml` records, **when** it should be re-baselined, and **how** to do it. Companion to `contract-baseline-rollforward.guide.md` (same governance family, different surface).

---

## 1. What `model_baseline` is — and what it is NOT

Each of the 32 `evals/<class>/<skill>/eval.yaml` files carries a `benchmark:` block:

```yaml
benchmark:
  model_baseline: "claude-sonnet-4-6"
  metrics:
    - output_quality
    - model_parity
```

`model_baseline` is **capture-time metadata** — a record of which model generation was current when the eval's quality bar was established. It is inert at runtime:

- **`evals/runner.js` performs ZERO LLM calls.** Scoring is fully deterministic keyword matching (`evaluateAgainstCriteria`, runner.js:175-256). The field is parsed by the YAML reader (runner.js:154-161) but never read by `runEval`, `runAllEvals`, or `runBenchmark`.
- **`benchmarkModel` in `evals/config.json` is a display label** — the runner copies it into the report output as `model` (runner.js:390); it does not select or invoke any model.

Consequence: changing `model_baseline` never changes a score. It is documentation, and it is governed like documentation of record.

## 2. WHEN to re-baseline

Re-baseline **only** when the meaning of the quality bar itself changes:

| Trigger | Re-baseline? |
|---|---|
| Scoring rubric / criteria keywords changed in eval.yaml | **Yes** |
| Pass thresholds changed (deliberate quality-bar reset) | **Yes** |
| A new Claude model is released | **No** — the runner makes no LLM calls; a model release changes nothing about eval semantics |
| `benchmarkModel` display label updated in config.json | **No** — label only |

A model release on its own is never a reason to touch the 32 fields.

## 3. HOW to re-baseline

1. Run the full deterministic benchmark on the target setup: `node evals/runner.js --benchmark` — confirm all suites green before and after the rubric/threshold change.
2. Update **all** `model_baseline` values and add a `baseline_date` note per eval.yaml, in **one commit** (no partial re-baselines — mixed capture generations are unauditable).
3. Add a CHANGELOG entry recording the re-baseline and its trigger.
4. Keep the diff reviewable: the commit should contain only eval.yaml metadata changes plus the CHANGELOG entry.

## 4. Current status — the v2.1.25 freeze

**The current 32 `claude-sonnet-4-6` values remain FROZEN per the v2.1.25 decision.** The v2.1.25 CHANGELOG records them as "historical capture records — intentionally unchanged" (only `benchmarkModel` in config.json moved to `claude-sonnet-5`, as a display label). Do not edit the 32 fields outside the procedure in §3.
