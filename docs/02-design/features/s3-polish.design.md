---
template: design
version: 2.0
feature: s3-polish
date: 2026-05-21
author: kay
project: bkit
sprint_id: s3-polish
---

# S3 — Sprint Report Maturity (Design)

## ADRs

### ADR S3-001 — markdown-parse utility extraction (CO-S2-1)

**Decision**: `lib/util/markdown-parse.js` exports `stripCodeBlocks`, `extractFrontmatter`, `parseFrontmatterField`. Moved from `scripts/check-skills-docs-code-sync.js`. Both producer (scripts/) and consumer (F3-2 context-importer) require it.

### ADR S3-002 — failure-reporter resolution: file header prepend + state field (A+C)

**Decision**: When advancePhase succeeds *after* a previous gate_fail (sprint.lastGateFailure populated), both mechanisms apply:
- File `sprint.lastGateFailure.reportPath` gets a `> **STATUS: RESOLVED** at <ISO>` header prepended (idempotent — check if already present)
- `sprint.lastGateFailure` gains `resolvedAt`, `resolvedBy`, `resolutionReason` fields

**Rationale**: pruge's #103 suggested fix specified A+C combination. Both human-readable AND machine-readable evidence.

### ADR S3-003 — context-importer fallback chain

**Decision**: `tryImportFromMasterPlan` → `tryImportFromPrd` → `defaultContext` (empty placeholders). Caller (handleInit) merges with `args.context` first (explicit user override wins).

**Rationale**: master-plan is more authoritative (multi-sprint context anchor); PRD is per-sprint. Both regex-parsed against sprint-master-planner template stable format.

### ADR S3-004 — KPI Snapshot SoT precedence

**Decision**: `qualityGates > featureMap > kpi`. The `sprint.kpi` field becomes a derived cache, not a source.

**Rationale**: pruge's #105 root analysis — qualityGates is the gate measurement evidence (audit-traceable). featureMap.<feature>.completion is per-feature derived. kpi is the legacy snapshot field, may be stale.

### ADR S3-005 — Quality Gates section format in generateReport

**Decision**: KPI Snapshot 직후 `## Quality Gates (N gates, M passed)` table. Columns: gate / current / threshold / passed / lastMeasuredAt / source. 11 gates (M1-M10 + S1/S2/S4 — but only those with `current !== null`).

**Rationale**: master plan §7.2 의 expected output (pruge issue body) 와 정확히 일치.

### ADR S3-006 — Lessons learned multi-aspect aggregation

**Decision**: `extractLessons` returns array of objects: `[{ aspect: 'iteration', insight: '...' }, ...]`. Aspects: iteration / gate_measurement / phase_duration / gate_failure_resolution. Each aspect contributes if data available.

## Module Architecture

```
lib/
├── util/markdown-parse.js (NEW — extracted from scripts/check-skills-docs-code-sync.js)
├── audit/audit-logger.js (MODIFIED — ACTION_TYPES +3)
├── application/
│   ├── sprint-lifecycle/
│   │   ├── context-importer.js (NEW)
│   │   ├── kpi-resolver.js (NEW)
│   │   ├── generate-report.usecase.js (MODIFIED — kpi-resolver + Quality Gates section + carry rationale + lessons aggregation)
│   │   ├── advance-phase.usecase.js (MODIFIED — call resolveOnSuccess after lastGateFailure resolution)
│   │   └── resolve-gate-fail.js (NEW — F3-1 logic)
│   └── quality-gates/
│       └── failure-reporter.js (existing — F3-1 may reference)
scripts/
├── check-skills-docs-code-sync.js (MODIFIED — use lib/util/markdown-parse.js)
└── sprint-handler.js (MODIFIED — handleInit calls context-importer)
docs/01-plan/features/v2119-bkit-quality-maturation.master-plan.md (MODIFIED — §7.2 inline note)
test/
├── unit/
│   ├── sprint-lifecycle/
│   │   ├── context-importer.test.js (10 TC)
│   │   ├── kpi-resolver.test.js (5 TC)
│   │   ├── generate-report-sot.test.js (9 TC)
│   │   ├── generate-report-carry-rationale.test.js (4 TC)
│   │   └── generate-report-lessons-auto.test.js (4 TC)
│   └── quality-gates/
│       └── failure-reporter-resolution.test.js (8 TC)
```

## Pseudocode highlights

### lib/util/markdown-parse.js

```js
'use strict';
function stripCodeBlocks(content) { /* same as S2 check-skills-docs-code-sync.js */ }
function extractFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]+?)\n---/);
  return m ? m[1] : null;
}
function parseFrontmatterField(fm, fieldName) {
  if (!fm) return null;
  const re = new RegExp('^' + fieldName + ':\\s*(.+?)$', 'm');
  const m = fm.match(re);
  return m ? m[1].trim() : null;
}
module.exports = { stripCodeBlocks, extractFrontmatter, parseFrontmatterField };
```

### lib/application/sprint-lifecycle/context-importer.js

```js
async function tryImportFromMasterPlan(sprintId, infra) {
  // Try multiple project-id derivations: <sprintId>, <sprintId.split('-')[0]>, etc.
  const candidates = deriveCandidateProjectIds(sprintId);
  for (const projectId of candidates) {
    const filePath = `docs/01-plan/features/${projectId}.master-plan.md`;
    if (await infra.fileReader.exists(filePath)) {
      const content = await infra.fileReader.read(filePath);
      return parseContextAnchor(content);
    }
  }
  return null;
}

function parseContextAnchor(markdownContent) {
  // sprint-master-planner template format:
  // ## 1. Context Anchor (Plan → Design → Do 전파)
  // | Key | Value |
  // | **WHY** | ... |
  // | **WHO** | ... |
  // | **RISK** | ... |
  // | **SUCCESS** | ... |
  // | **SCOPE** | ... |
  const context = { WHY: '', WHO: '', RISK: '', SUCCESS: '', SCOPE: '' };
  for (const key of Object.keys(context)) {
    const re = new RegExp('\\|\\s*\\*\\*' + key + '\\*\\*\\s*\\|\\s*(.+?)\\s*\\|');
    const m = markdownContent.match(re);
    if (m) context[key] = m[1].trim();
  }
  return Object.values(context).some(v => v.length > 0) ? context : null;
}

module.exports = { tryImportFromMasterPlan, tryImportFromPrd, parseContextAnchor, deriveCandidateProjectIds };
```

### lib/application/sprint-lifecycle/kpi-resolver.js

```js
'use strict';
function resolveKpi(sprint) {
  if (!sprint) return null;
  const qg = sprint.qualityGates || {};
  const fm = sprint.featureMap || {};
  const kpi = sprint.kpi || {};

  const featuresArray = Object.values(fm);
  const completedFromFeatureMap = featuresArray.filter(f => f && f.completion).length;

  return {
    matchRate: qg.M1_matchRate?.current ?? kpi.matchRate ?? null,
    criticalIssues: qg.M3_criticalIssueCount?.current ?? kpi.criticalIssues ?? 0,
    dataFlowIntegrity: qg.S1_dataFlowIntegrity?.current ?? kpi.dataFlowIntegrity ?? null,
    featuresCompleted: completedFromFeatureMap || kpi.featuresCompleted || 0,
    featuresTotal: (sprint.features || []).length,
    cumulativeIterations: (sprint.iterateHistory || []).length || kpi.cumulativeIterations || 0,
  };
}

function detectDivergences(sprint) {
  const divergences = [];
  const qg = sprint.qualityGates || {};
  const kpi = sprint.kpi || {};
  // Cross-check matchRate
  if (qg.M1_matchRate?.current != null && kpi.matchRate != null) {
    if (qg.M1_matchRate.current !== kpi.matchRate) {
      divergences.push({ field: 'matchRate', kpi: kpi.matchRate, qualityGates: qg.M1_matchRate.current });
    }
  }
  // similar for others
  return divergences;
}

module.exports = { resolveKpi, detectDivergences };
```

### F3-1 resolve-gate-fail logic

```js
async function resolveOnSuccess(sprint, infra, opts = {}) {
  if (!sprint.lastGateFailure || sprint.lastGateFailure.resolvedAt) return null;
  const reportPath = sprint.lastGateFailure.reportPath;
  const resolvedAt = new Date().toISOString();
  const resolvedBy = opts.resolvedBy || 'auto';
  const resolutionReason = opts.reason || 'advancePhase succeeded';

  // Update state
  sprint.lastGateFailure.resolvedAt = resolvedAt;
  sprint.lastGateFailure.resolvedBy = resolvedBy;
  sprint.lastGateFailure.resolutionReason = resolutionReason;

  // Prepend header to file
  if (reportPath && infra.fileReader && infra.fileWriter) {
    const fullPath = await infra.fileReader.resolvePath(reportPath);
    if (await infra.fileReader.exists(fullPath)) {
      const content = await infra.fileReader.read(fullPath);
      const header = `> **STATUS: RESOLVED** at ${resolvedAt}\n> resolvedBy: ${resolvedBy}\n> resolutionReason: ${resolutionReason}\n\n`;
      if (!content.startsWith('> **STATUS: RESOLVED**')) {
        await infra.fileWriter.write(fullPath, header + content);
      }
    }
  }

  return { resolvedAt, resolvedBy, resolutionReason };
}
```

### F3-3 renderReport Quality Gates section

```js
function renderQualityGatesSection(sprint) {
  const qg = sprint.qualityGates || {};
  const rows = [];
  for (const [key, gate] of Object.entries(qg)) {
    if (gate && gate.current !== null && gate.current !== undefined) {
      const gateName = key.split('_')[0];
      const passed = gate.passed ? '✓' : '✗';
      const lastMeasured = gate.lastMeasuredAt || '—';
      const source = gate.source || gate.measuredBy || '—';
      rows.push(`| ${gateName} | ${gate.current} | ${gate.threshold} | ${passed} | ${lastMeasured} | ${source} |`);
    }
  }
  if (rows.length === 0) return '';
  const passedCount = Object.values(qg).filter(g => g && g.passed).length;
  return [
    `## Quality Gates (${rows.length} gates, ${passedCount} passed)`,
    '',
    '| Gate | current | threshold | passed | lastMeasuredAt | source |',
    '|------|---------|-----------|--------|----------------|--------|',
    ...rows,
    '',
  ].join('\n');
}
```

## Edge Cases

| # | Edge | Behavior |
|---|------|----------|
| E1 | sprint with no lastGateFailure (clean path) | resolveOnSuccess returns null (no-op) |
| E2 | master-plan.md missing AND PRD missing AND args.context absent | defaultContext (empty placeholders), audit warning |
| E3 | generateReport called on pre-S3 sprint state (no annotations field, etc.) | defensive `|| []` initialization (entity.js already has it) |
| E4 | qualityGates and kpi values match (no divergence) | no divergence warning, no audit emit |
| E5 | resolveOnSuccess called twice (idempotency) | second call detects existing resolvedAt, no-op |
| E6 | atomic file write failure (e.g., disk full) | rollback state field, audit emit warning, but advancePhase succeeds (resolution is best-effort) |

## CTO Redline (약식)
- BLOCKER 0
- APPROVAL: APPROVE.

---

**문서 끝.**
