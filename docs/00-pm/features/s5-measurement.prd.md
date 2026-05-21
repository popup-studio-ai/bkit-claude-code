---
template: pm-prd
version: 2.0
feature: s5-measurement
date: 2026-05-21
author: kay (메인 세션)
project: bkit
bkit_version: 2.1.18
sprint_id: s5-measurement
status: Draft (sprint phase: prd)
master_plan: docs/01-plan/features/v2119-bkit-quality-maturation.master-plan.md §4.5
absorbed_carryovers: ['CO-S0-1 (sqm-calculator evolve)', 'CO-S0-5 (findFirstMatching pattern fix)', 'CO-S2-2 (S0 measurement evidence regenerate)']
---

# S5 — Sprint Maturity Index (PRD)

> **Mission**: SQM (Sprint Quality Maturity Index) 정량 도입 + 매 release 공개. S0 의 simple sqm-calculator (CO-S0-1) 를 evolve + S2 stripCodeBlocks 통합 + CO-S0-5 findFirstMatching pattern bug fix + SessionStart dashboard.

## Executive Summary (4-Perspective)

| Perspective | Content |
|-------------|---------|
| **Problem** | S0 의 sqm-calculator (simple version) + S0 measurement evidence 에 2 buggy 가 있음: (1) **findFirstMatching** 의 `pattern.replace(/\\./g, '\\\\.')` 가 already-escaped input pattern 을 over-escape → v2.1.16 master plan (실제 존재) 가 false 로 표시 (S0 sprintSelfDogfoodRunRate raw data 부정확). (2) **stripCodeBlocks 부재** → phase-3-mockup + phase-9-deployment false positives (S2 가 발견, master plan §7.2 patched). 또한 SQM 측정 evidence 가 *시간-점 (snapshot)* 만 있고 *시계열 history* 부재 — 매 release SQM 변화 추적 불가. SessionStart dashboard 에도 SQM 미표시. |
| **Solution** | **3 features 통합**: F5-1 `lib/quality/sqm-calculator.js` evolve — markdown-parse.js stripCodeBlocks 통합 + findFirstMatching pattern fix + 새 raw data collector (집중 단일 source) + 신규 helper `computeSqmSnapshot(opts)` (CLI 외 직접 호출 가능). F5-2 `lib/ui/sqm-panel.js` — SessionStart hook 에서 SQM total + 6 component summary 표시 (옵션). F5-3 `.bkit/state/sqm-history.jsonl` append-only write — 매 release 시 `scripts/_v2119-s4-feedback-refresh.js` 류 runner 가 history entry append. |
| **Function/UX Effect** | (a) `node -e "require('./lib/quality/sqm-calculator').computeSqmSnapshot()"` 로 직접 측정 (CO-S2-2 evidence regenerate — docsCodeSyncRate 98 baseline). (b) sqm-history.jsonl 에 v2.1.18 baseline (59.75 → S2 정정 후 ~61.25) 첫 entry, 차후 release 마다 append. (c) SessionStart dashboard 의 `~~~ SQM ~~~ 61.25 / 100` 한 줄 표시 (디스플레이 옵션). (d) findFirstMatching fix 후 v2116 master plan 정상 detect. |
| **Core Value** | **v2.1.19 master plan §7.2 의 SQM target ≥85 정량 추적성 확보** + S0 measurement bug 들 영구 fix + SessionStart 의 *전체 sprint domain 건강도* glance metric. SessionStart 마다 SQM glance — bkit governance 의 *living indicator*. 차후 release 의 SQM trajectory 가 release notes 의 evidence narrative. |

## Functional Requirements

### FR-1: sqm-calculator.js evolve (F5-1, 320 LOC, 2 TC)

- `lib/quality/sqm-calculator.js` MODIFIED:
  - import `lib/util/markdown-parse.js` (CO-S2-1 utility)
  - 새 helper `computeSqmSnapshot({ projectRoot, asOf? })` — pure snapshot computation
  - 기존 `measureDocsCodeSyncRate` evolution: stripCodeBlocks 사용 (false positive elimination, S2 evolution 통합)
- `scripts/_v2119-s0-measure.js` MODIFIED:
  - findFirstMatching pattern bug fix (CO-S0-5)
  - `collectDocsCodeData` uses markdown-parse.js (CO-S2-1 backward compat)

### FR-2: SQM dashboard panel (F5-2, 180 LOC, 2 TC)

- `lib/ui/sqm-panel.js` NEW:
  - `renderSqmPanel({ baseline, current? })` — formatted box per existing UI patterns
  - SessionStart hook calls (best-effort, latency budget < 50ms)
- Hook integration: optional — failure non-blocking

### FR-3: SQM history append (F5-3, 140 LOC, 1 TC)

- `lib/quality/sqm-history.js` NEW (or extend sqm-calculator.js):
  - `appendHistoryEntry(filePath, result)` — JSONL append-only
  - `loadHistory(filePath, limit?)` — read entries
- audit emit `sqm_history_appended` (NEW ACTION_TYPE — optional)

## Acceptance Criteria

| # | AC |
|---|-----|
| AC-1 | F5-1 findFirstMatching fix verified: v2116 master plan detected |
| AC-2 | F5-1 stripCodeBlocks integrated: phase-3-mockup + phase-9-deployment NOT false positive |
| AC-3 | F5-2 sqm-panel renderable string output |
| AC-4 | F5-3 sqm-history.jsonl write + read round-trip |
| AC-5 | matchRate ≥90, criticalIssueCount=0 |
| AC-6 | sprint archived |
| AC-7 | 5 TC PASS |
| AC-8 | v2.1.18 baseline SQM regenerated (CO-S2-2) — docsCodeSyncRate 98, total ~61.25 |

## Dependencies

- ✓ S0/S1/S2/S4/S3 archived (sqm-calculator + markdown-parse + audit + tests all in place)

## CO absorption

- **CO-S0-1**: sqm-calculator evolve (S5 mission)
- **CO-S0-5**: findFirstMatching pattern fix (F5-1 sub-task)
- **CO-S2-2**: S0 measurement evidence regenerate (F5-3 first history entry)

---

**문서 끝.** PRD complete.
