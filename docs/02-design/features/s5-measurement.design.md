---
template: design
version: 2.0
feature: s5-measurement
date: 2026-05-21
sprint_id: s5-measurement
---

# S5 — Sprint Maturity Index (Design)

## ADRs

### ADR S5-001 — findFirstMatching pattern semantics

**Problem**: `scripts/_v2119-s0-measure.js:findFirstMatching` 의 implementation:
```js
const re = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
```
input pattern `${compact}-.*\\.master-plan\\.md` 가 already escaped → over-escape.

**Decision**: pattern 을 *raw regex string* 으로 취급 (no double-escape). Or use simple glob → regex with explicit pattern semantics.

**Implementation**:
```js
function findFirstMatching(dirRelative, regexStr) {
  const re = new RegExp('^' + regexStr + '$');
  // ...
}
```
Caller passes regex-ready string (no double escape).

### ADR S5-002 — sqm-history.jsonl append-only schema

**Decision**: JSONL (one JSON object per line). schema:
```jsonschema
{ entry: { measuredAt, gitCommit, bkitVersion, total, components: { name: { value, weighted } }, warnings, schemaVersion } }
```
file location: `.bkit/state/sqm-history.jsonl` (parallel with sqm-baseline.json).

**Rationale**: append-only = no read-modify-write race; jsonl = log-like, easy tailing; bounded growth = each release adds 1 entry (~500 bytes).

### ADR S5-003 — sqm-panel rendering pattern

**Decision**: Reuse existing `lib/ui/` box-formatting patterns (workflow-map / progress-bar). Output: fixed-width box, 3 lines.

```
┌─── SQM (Sprint Quality Maturity) ────────────────── 61.25 / 100 ─┐
│  Docs=Code 98 │ Sprint-Dogfood 100 │ Dogfooder 100 │ Report 79  │
│  Dispatch 95+ │ Convention 99+ │ baseline v2.1.18 → current v2.1.19 │
└──────────────────────────────────────────────────────────────────┘
```

### ADR S5-004 — Backward compat for sqm-calculator API

**Decision**: Keep all existing exports (computeSqm, measureXxxx fns). Add `computeSqmSnapshot(opts)` as convenience wrapper (raw data collection + computeSqm). S0 measurement script delegates.

## Pseudocode

### lib/quality/sqm-history.js
```js
const fs = require('fs');
const path = require('path');
function appendHistoryEntry(filePath, entry) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, JSON.stringify(entry) + '\n');
}
function loadHistory(filePath, limit) {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n').filter(Boolean);
  const parsed = lines.map(l => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean);
  return typeof limit === 'number' && limit > 0 ? parsed.slice(-limit) : parsed;
}
module.exports = { appendHistoryEntry, loadHistory };
```

### lib/ui/sqm-panel.js
```js
function renderSqmPanel({ baseline, current = null }) {
  if (!baseline) return '';
  const total = baseline.total.toFixed(2);
  const comps = baseline.components || {};
  const fmt = (key) => comps[key]?.value ?? '—';
  const lines = [
    `┌─── SQM (Sprint Quality Maturity) ─────────── ${total} / 100 ─┐`,
    `│  Docs=Code ${fmt('docsCodeSyncRate')} │ Self-Dogfood ${fmt('sprintSelfDogfoodRunRate')} │ Dogfooder ${fmt('externalDogfooderFeedbackResponseRate')} │`,
    `│  Report KPI ${fmt('sprintReportKpiConsistency')} │ Dispatch ${fmt('subAgentDispatchSuccessRate')} │ Convention ${fmt('conventionContractTestPassRate')} │`,
    `└──────────────────────────────────────────────────────────────┘`,
  ];
  return lines.join('\n');
}
module.exports = { renderSqmPanel };
```

## Edge Cases

| # | Edge | Behavior |
|---|------|----------|
| E1 | sqm-baseline.json missing | renderSqmPanel returns '' (silent) |
| E2 | history.jsonl 1000+ lines (long-running) | loadHistory limit param caps |
| E3 | findFirstMatching pattern with unescaped `.` | caller responsibility; old `pattern.replace(/\./g, ...)` removed |
| E4 | concurrent append (multiple bkit releases) | appendFileSync is atomic per line (POSIX) |

## CTO Redline (약식)
BLOCKER 0. APPROVAL: APPROVE.

---

**문서 끝.**
