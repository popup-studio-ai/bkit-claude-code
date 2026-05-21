---
template: plan
version: 2.0
feature: s5-measurement
date: 2026-05-21
author: kay
sprint_id: s5-measurement
---

# S5 — Sprint Maturity Index (Plan)

## 0. Scope
3 features × 640 LOC × 5 TC. Carry-overs: CO-S0-1 + CO-S0-5 + CO-S2-2.

## 1. Implementation Order

| # | Sub-task | LOC | TC | Feature |
|---|----------|-----|----|---------|
| T1 | scripts/_v2119-s0-measure.js findFirstMatching pattern fix (CO-S0-5) + use markdown-parse.js | 80 | 0 | F5-1 |
| T2 | lib/quality/sqm-calculator.js: add `computeSqmSnapshot(opts)` helper + integrate markdown-parse | 120 | 0 | F5-1 |
| T3 | lib/quality/sqm-history.js NEW (append + load) | 100 | 0 | F5-3 |
| T4 | lib/ui/sqm-panel.js NEW (render formatted box) | 140 | 0 | F5-2 |
| T5 | test/unit/quality/sqm-calculator-evolve.test.js (2 TC — findFirstMatching fix + stripCodeBlocks integration) | 130 | 2 | F5-1 |
| T6 | test/unit/quality/sqm-history.test.js (1 TC — append + load round-trip) | 80 | 1 | F5-3 |
| T7 | test/unit/ui/sqm-panel.test.js (2 TC — render schema) | 100 | 2 | F5-2 |
| T8 | Regenerate v2.1.18 baseline evidence (CO-S2-2): rerun scripts/_v2119-s0-measure.js → .bkit/runtime/sqm-baseline.json update + first sqm-history.jsonl entry | 0 | 0 | F5-1+F5-3 |
| **Total** | | **~750** | **5** | |

## 2. Quality Bar
M1≥90 / M2≥80 / M3≤0 / M4≥95 / M5≤1 / M7≥90 / M8≥85 / M10≤4h.

## 3. Risk Register
- R-1: findFirstMatching fix backward compat (S0 baseline 다시 측정 시 다른 결과) → 의도된 정정, CO-S2-2 absorption
- R-2: SessionStart hook latency (sqm-panel) → render 만, no I/O, < 5ms budget
- R-3: jsonl concurrent write race → append-only mode, fsync if available

## 4. CTO Redline
BLOCKER 0. MEDIUM 1 (R-1 explicit reproduction): T8 의 결과가 master plan §7.2 의 ~61.25 estimate 와 일치 verify.
APPROVAL: APPROVE.

---

**문서 끝.**
