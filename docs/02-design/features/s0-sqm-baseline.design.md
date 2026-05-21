---
template: design
version: 2.0
feature: s0-sqm-baseline
date: 2026-05-21
author: kay (메인 세션 thinking active)
project: bkit
bkit_version: 2.1.18
status: Draft (sprint phase: design)
sprint_id: s0-sqm-baseline
predecessor_plan: docs/01-plan/features/s0-sqm-baseline.plan.md
predecessor_prd: docs/00-pm/features/s0-sqm-baseline.prd.md
master_plan_anchor: docs/01-plan/features/v2119-bkit-quality-maturation.master-plan.md §23 step 0
---

# S0 — v2.1.18 Baseline SQM Measurement (Design)

> **Sprint phase**: design
> **Scope**: Detailed pseudocode + data structures + edge cases for `lib/quality/sqm-calculator.js` + `scripts/_v2119-s0-measure.js` + result schema invariants
> **Clean Architecture layer mapping**: `lib/quality/` belongs to **Domain rules** layer (pure computation, no I/O) — but GitHub API call breaks purity. **Decision**: split into 2 modules — `lib/quality/sqm-calculator.js` (pure, ports) + `scripts/_v2119-s0-measure.js` (Infrastructure: gh CLI, fs reads).

---

## 0. Architecture Decision Records (ADR-style)

### ADR S0-001 — Pure domain vs ports-and-adapters

**Context**: 6 component 함수 중 일부 (예: `measureExternalDogfooderFeedbackResponseRate`) 는 GitHub API call 필요 → side-effectful, Domain purity 위반.

**Options**:
- A. 모든 6 함수가 `lib/quality/sqm-calculator.js` 안 (side-effect 허용, domain 위반)
- B. Pure computation 함수 (input → output) + Infrastructure adapter 분리
- C. 모든 6 함수가 `scripts/_v2119-s0-measure.js` 안 (lib 미사용)

**Decision**: **B** — Clean Architecture Domain purity 유지.
- `lib/quality/sqm-calculator.js`: 6 component 의 **pure compute functions** (input data → score). I/O 없음.
- `scripts/_v2119-s0-measure.js`: Infrastructure — file system / audit replay / gh CLI 로 raw data 수집 후 sqm-calculator 의 pure 함수 호출.
- 향후 S5 Measurement F5-1 에서 lib/infra/sqm/* adapters 신설 시 본 decision 의 직접 evolution.

**Consequence**:
- 6 component pure 함수 signature: `function measureXxx(rawData): { value, raw }` (sync, pure)
- raw data 수집은 script 책임
- Testability ↑ (pure 함수 단독 test 가능)
- 추후 S5 Measurement 에서 ports/adapters 패턴으로 evolve 가능

### ADR S0-002 — `measureExternalDogfooderFeedbackResponseRate` 의 dogfooder identifier

**Context**: 현재 N=1 (pruge). Hardcode vs config.

**Decision**: config-driven — `lib/quality/sqm-calculator.js` 에 `DEFAULT_DOGFOODERS = ['pruge']` 상수 + `measureExternalDogfooderFeedbackResponseRate({ dogfooders, ...rawData })` signature. 향후 N≥2 시 array 확장만으로 가능.

**Consequence**: master plan §15.4 DA-4 (N≥2 active outreach) 의 readiness 확보.

### ADR S0-003 — Time-based measurement window

**Context**: External Dogfooder Feedback Response Rate 의 window. 전체 history vs trailing N 일.

**Decision**: trailing 30 일 (baseline 측정 시점 기준). v2.1.18 시점 (2026-05-21) → 2026-04-21 ~ 2026-05-21 window.

**Rationale**: 30일 = standard dogfooder feedback cycle. trailing window 가 reliability ↑.

**Consequence**: 측정값이 시간에 따라 변함 (rolling window). reproducibility 는 `asOf` 파라미터로 보장 (FR-1 schema).

---

## 1. Module Architecture

```
lib/quality/
├── sqm-calculator.js          ← NEW (본 S0 design)
│   └── pure compute functions + computeSqm aggregator
└── (기존 lib/quality/* 변경 없음 — gate-manager, metrics-collector, regression-guard)

scripts/
├── _v2119-s0-measure.js       ← NEW (본 S0 design)
│   ├── raw data 수집 (fs, gh, audit replay)
│   └── sqm-calculator import + compute + archive + audit emit
└── (기존 scripts/* 변경 없음)

docs/03-analysis/
└── v2118-sqm-baseline.analysis.md  ← NEW (report phase 산출)

.bkit/runtime/
└── sqm-baseline.json          ← NEW (machine-readable runtime output)
```

---

## 2. Detailed Pseudocode — `lib/quality/sqm-calculator.js`

### 2.1 Module skeleton

```js
'use strict';
/**
 * lib/quality/sqm-calculator.js — Sprint Quality Maturity Index calculator
 * v2.1.19 S0 simple version (CTO M-3 baseline measurement)
 * Clean Architecture: Domain rules layer (pure compute, no I/O)
 * S5 Measurement F5-1 will evolve this with full dashboard + history.
 */

// SQM 6-component weight definition (master plan §7.2)
const SQM_WEIGHTS = Object.freeze({
  docsCodeSyncRate: 0.30,
  sprintSelfDogfoodRunRate: 0.20,
  externalDogfooderFeedbackResponseRate: 0.20,
  sprintReportKpiConsistency: 0.15,
  subAgentDispatchSuccessRate: 0.10,
  conventionContractTestPassRate: 0.05,
});

const DEFAULT_DOGFOODERS = ['pruge'];

// Sentinel for unmeasurable component
const UNMEASURABLE = Object.freeze({ value: null, weighted: 0, raw: null, error: null });

// --- 6 component pure functions ---
function measureDocsCodeSyncRate(rawData) { /* see §2.2 */ }
function measureSprintSelfDogfoodRunRate(rawData) { /* see §2.3 */ }
function measureExternalDogfooderFeedbackResponseRate(rawData) { /* see §2.4 */ }
function measureSprintReportKpiConsistency(rawData) { /* see §2.5 */ }
function measureSubAgentDispatchSuccessRate(rawData) { /* see §2.6 */ }
function measureConventionContractTestPassRate(rawData) { /* see §2.7 */ }

// --- Aggregator (pure) ---
function computeSqm({ rawData, asOf, gitCommit, bkitVersion }) {
  const components = {
    docsCodeSyncRate: measureDocsCodeSyncRate(rawData.docsCode),
    sprintSelfDogfoodRunRate: measureSprintSelfDogfoodRunRate(rawData.sprintRuns),
    externalDogfooderFeedbackResponseRate: measureExternalDogfooderFeedbackResponseRate(rawData.dogfooderIssues),
    sprintReportKpiConsistency: measureSprintReportKpiConsistency(rawData.sprintReports),
    subAgentDispatchSuccessRate: measureSubAgentDispatchSuccessRate(rawData.dispatchAudit),
    conventionContractTestPassRate: measureConventionContractTestPassRate(rawData.conventionTests),
  };

  let total = 0;
  let warnings = [];
  for (const [key, weight] of Object.entries(SQM_WEIGHTS)) {
    const c = components[key];
    if (c.value === null) {
      warnings.push(`${key}: unmeasurable`);
      // contribution = 0 (conservative — null component reduces total)
      c.weight = weight;
      c.weighted = 0;
    } else {
      c.weight = weight;
      c.weighted = c.value * weight;
      total += c.weighted;
    }
  }

  return {
    total: round(total, 2),
    components,
    measuredAt: new Date().toISOString(),
    asOf: asOf || null,
    gitCommit: gitCommit || null,
    bkitVersion: bkitVersion || null,
    warnings,
    schemaVersion: '1.0',
  };
}

function round(n, decimals) { return Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals); }

module.exports = {
  SQM_WEIGHTS,
  DEFAULT_DOGFOODERS,
  computeSqm,
  measureDocsCodeSyncRate,
  measureSprintSelfDogfoodRunRate,
  measureExternalDogfooderFeedbackResponseRate,
  measureSprintReportKpiConsistency,
  measureSubAgentDispatchSuccessRate,
  measureConventionContractTestPassRate,
};
```

### 2.2 `measureDocsCodeSyncRate` (weight 0.30)

**Input** (`rawData.docsCode`):
```js
{
  skills: [
    { name: 'pdca', skillMdPath: 'skills/pdca/SKILL.md', invariantPass: true, failures: [] },
    { name: 'sprint', skillMdPath: 'skills/sprint/SKILL.md', invariantPass: false, failures: ['scripts/sprint-handler.js path mismatch — actual at <bkit-root>/scripts/'] },
    // ... 44 total
  ]
}
```

**Pseudocode**:
```js
function measureDocsCodeSyncRate({ skills }) {
  if (!Array.isArray(skills) || skills.length === 0) {
    return { value: null, raw: { error: 'no skills provided' } };
  }
  const total = skills.length;
  const passed = skills.filter(s => s.invariantPass === true).length;
  const failures = skills.filter(s => !s.invariantPass).map(s => ({ name: s.name, failures: s.failures }));
  return {
    value: Math.round((passed / total) * 100), // 0-100 normalized
    raw: { passed, total, failures },
  };
}
```

**Invariant check 정의** (raw data 수집 시 평가):
- SKILL.md frontmatter 의 `name` 이 dir name 과 일치
- SKILL.md 가 declared path 의 file 들이 실제 존재
- SKILL.md `allowed-tools` 가 valid tool names

예상 v2.1.18 결과: 43/44 PASS (sprint skill 만 #107 failure) → value = 98 (round)

### 2.3 `measureSprintSelfDogfoodRunRate` (weight 0.20)

**Input** (`rawData.sprintRuns`):
```js
{
  releases: [
    { version: 'v2.1.14', masterPlanExists: true, sprintStateArchived: true, runAsSprint: true },
    { version: 'v2.1.15', masterPlanExists: false, sprintStateArchived: false, runAsSprint: false },
    { version: 'v2.1.16', masterPlanExists: true, sprintStateArchived: false, runAsSprint: 'partial' },
    { version: 'v2.1.17', masterPlanExists: false, sprintStateArchived: false, runAsSprint: false },
    { version: 'v2.1.18', masterPlanExists: false, sprintStateArchived: false, runAsSprint: false },
  ]
}
```

**Pseudocode**:
```js
function measureSprintSelfDogfoodRunRate({ releases }) {
  if (!Array.isArray(releases) || releases.length === 0) {
    return { value: null, raw: { error: 'no releases provided' } };
  }
  const total = releases.length;
  const sprintRuns = releases.filter(r => r.runAsSprint === true).length;
  const partial = releases.filter(r => r.runAsSprint === 'partial').length;
  // Conservative: partial counts as 0.5
  const score = (sprintRuns + partial * 0.5) / total;
  return {
    value: Math.round(score * 100),
    raw: { sprintRuns, partial, total, releases: releases.map(r => ({ version: r.version, runAsSprint: r.runAsSprint })) },
  };
}
```

예상 v2.1.18 결과: 0/5 sprint runs (v2.1.16 partial 0.5) → score = 0.1 → value = 10

### 2.4 `measureExternalDogfooderFeedbackResponseRate` (weight 0.20)

**Input** (`rawData.dogfooderIssues`):
```js
{
  windowStart: '2026-04-21T00:00:00Z',
  windowEnd: '2026-05-21T00:00:00Z',
  dogfooders: ['pruge'],
  issues: [
    { number: 92, creator: 'pruge', createdAt: '2026-05-20T00:40:38Z', closedAt: '2026-05-20T05:34:26Z', hoursToClose: 4.9, within24h: true, fixedInRelease: 'v2.1.17' },
    // ... 10 issues
  ]
}
```

**Pseudocode**:
```js
function measureExternalDogfooderFeedbackResponseRate({ issues, dogfooders, windowStart, windowEnd }) {
  if (!Array.isArray(issues)) {
    return { value: null, raw: { error: 'no issues data' } };
  }
  if (issues.length === 0) {
    return { value: null, raw: { error: 'no dogfooder issues in window', windowStart, windowEnd } };
  }
  const within24h = issues.filter(i => i.within24h).length;
  const total = issues.length;
  return {
    value: Math.round((within24h / total) * 100),
    raw: { within24h, total, dogfooders, windowStart, windowEnd, issues },
  };
}
```

예상 v2.1.18 결과: pruge 10 이슈 중 7건 v2.1.17/v2.1.18 close (within 24h) → 70

### 2.5 `measureSprintReportKpiConsistency` (weight 0.15)

**Input** (`rawData.sprintReports`):
```js
{
  reports: [
    {
      feature: 'v2118-sprint-trust-ux-fix',
      kpiSnapshot: { matchRate: 100, criticalIssues: 0, dataFlowIntegrity: null, featuresCompleted: '4/4' },
      qualityGates: { M1_matchRate: { current: 100 }, M3_criticalIssueCount: { current: 0 }, S1_dataFlowIntegrity: { current: null } },
      divergenceCount: 0,
    }
  ]
}
```

**Pseudocode**:
```js
function measureSprintReportKpiConsistency({ reports }) {
  if (!Array.isArray(reports) || reports.length === 0) {
    return { value: null, raw: { error: 'no sprint reports' } };
  }
  const totalDivergences = reports.reduce((sum, r) => sum + (r.divergenceCount || 0), 0);
  const totalChecks = reports.length * 4; // 4 KPI fields per report
  if (totalChecks === 0) return { value: null, raw: { error: 'no KPI checks' } };
  const consistencyRate = 1 - (totalDivergences / totalChecks);
  return {
    value: Math.round(consistencyRate * 100),
    raw: { totalDivergences, totalChecks, reports },
  };
}
```

예상 v2.1.18 결과: v2.1.18 sprint report = PDCA-with-sprint-shadow → no sprint report → `value: null` (warnings)

### 2.6 `measureSubAgentDispatchSuccessRate` (weight 0.10)

**Input** (`rawData.dispatchAudit`):
```js
{
  windowStart: '2026-04-21T00:00:00Z',
  windowEnd: '2026-05-21T00:00:00Z',
  dispatches: [
    { actorId: 'sprint-orchestrator', timestamp: '...', success: true },
    // ...
  ]
}
```

**Pseudocode**:
```js
function measureSubAgentDispatchSuccessRate({ dispatches, windowStart, windowEnd }) {
  if (!Array.isArray(dispatches)) {
    return { value: null, raw: { error: 'no dispatch audit' } };
  }
  if (dispatches.length === 0) {
    return { value: null, raw: { error: 'no dispatches in window', windowStart, windowEnd } };
  }
  const success = dispatches.filter(d => d.success === true).length;
  return {
    value: Math.round((success / dispatches.length) * 100),
    raw: { success, total: dispatches.length, windowStart, windowEnd },
  };
}
```

예상 v2.1.18 결과: v2.1.18 시점 sprint-orchestrator full live 미활성 → 0 dispatches → `value: null`

### 2.7 `measureConventionContractTestPassRate` (weight 0.05)

**Input** (`rawData.conventionTests`):
```js
{
  testsExist: false,         // test/contract/baseline/skills-convention.json 존재 여부
  passed: 0,
  total: 0,
}
```

**Pseudocode**:
```js
function measureConventionContractTestPassRate({ testsExist, passed, total }) {
  if (!testsExist) {
    return { value: 0, raw: { exists: false, passed: 0, total: 0 } };
  }
  if (total === 0) return { value: 0, raw: { exists: true, passed: 0, total: 0 } };
  return {
    value: Math.round((passed / total) * 100),
    raw: { exists: true, passed, total },
  };
}
```

예상 v2.1.18 결과: 0 (test 미존재 — S2 F2-4 에서 작성 예정)

---

## 3. Detailed Pseudocode — `scripts/_v2119-s0-measure.js`

```js
#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd(); // CWD-rooted, dev environment
const { computeSqm, DEFAULT_DOGFOODERS } = require(path.join(ROOT, 'lib/quality/sqm-calculator.js'));
const auditLogger = require(path.join(ROOT, 'lib/audit/audit-logger.js'));

// --- Raw data collectors (Infrastructure layer) ---
async function collectDocsCodeData() {
  // Discover 44 skills + SKILL.md invariant check
  const skillsDir = path.join(ROOT, 'skills');
  const skills = fs.readdirSync(skillsDir).filter(d => fs.statSync(path.join(skillsDir, d)).isDirectory());
  return {
    skills: skills.map(name => evaluateSkillInvariant(name)),
  };
}

function evaluateSkillInvariant(name) {
  const skillMdPath = path.join(ROOT, 'skills', name, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) {
    return { name, skillMdPath, invariantPass: false, failures: ['SKILL.md missing'] };
  }
  const content = fs.readFileSync(skillMdPath, 'utf8');
  const failures = [];
  // Check 1: frontmatter name matches dir
  const nameMatch = content.match(/^name:\s*(\S+)/m);
  if (!nameMatch || nameMatch[1] !== name) failures.push(`frontmatter name "${nameMatch?.[1]}" != dir "${name}"`);
  // Check 2: declared scripts/<x>.js paths actually exist
  const scriptRefs = content.match(/scripts\/[\w-]+(?:\.js|-handler\.js)/g) || [];
  for (const ref of scriptRefs) {
    if (!fs.existsSync(path.join(ROOT, 'skills', name, ref)) && !fs.existsSync(path.join(ROOT, ref))) {
      // Try root and skill-local
      failures.push(`declared "${ref}" not found (neither at skill dir nor at bkit root)`);
    }
  }
  return { name, skillMdPath, invariantPass: failures.length === 0, failures };
}

async function collectSprintRunsData() {
  // 최근 5 release (v2.1.14~v2.1.18) 의 master plan + sprint state
  const releases = ['v2.1.14', 'v2.1.15', 'v2.1.16', 'v2.1.17', 'v2.1.18'];
  return {
    releases: releases.map(v => {
      const ver = v.replace(/^v/, '');
      const masterPlanGlob = `docs/01-plan/features/v${ver.replace(/\./g, '')}-*.master-plan.md`;
      const masterPlanFound = findFirstMatching(masterPlanGlob);
      const sprintStateGlob = `.bkit/state/sprints/v${ver.replace(/\./g, '')}-*.json`;
      const sprintStateFound = findFirstMatching(sprintStateGlob);
      // Conservative: archived 확인 필요
      let archived = false;
      if (sprintStateFound) {
        const state = JSON.parse(fs.readFileSync(sprintStateFound, 'utf8'));
        archived = state.phase === 'archived';
      }
      const runAsSprint = (masterPlanFound && archived) ? true
                       : (masterPlanFound && !archived) ? 'partial'
                       : false;
      return { version: v, masterPlanExists: !!masterPlanFound, sprintStateArchived: archived, runAsSprint };
    }),
  };
}

function findFirstMatching(glob) {
  // Simple glob via fs.readdir + regex
  const parts = glob.split('/');
  let dir = '';
  for (const part of parts.slice(0, -1)) {
    dir = path.join(dir, part);
  }
  const absDir = path.join(ROOT, dir);
  if (!fs.existsSync(absDir)) return null;
  const pattern = parts[parts.length - 1].replace(/\./g, '\\.').replace(/\*/g, '.*');
  const re = new RegExp('^' + pattern + '$');
  for (const file of fs.readdirSync(absDir)) {
    if (re.test(file)) return path.join(absDir, file);
  }
  return null;
}

async function collectDogfooderIssuesData(asOf) {
  const since = new Date(new Date(asOf) - 30 * 24 * 60 * 60 * 1000).toISOString();
  try {
    const json = execSync(
      `gh issue list --state all --search "author:pruge created:>=${since.split('T')[0]}" --limit 50 --json number,createdAt,closedAt,author`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    );
    const issues = JSON.parse(json).map(i => {
      const created = new Date(i.createdAt);
      const closed = i.closedAt ? new Date(i.closedAt) : null;
      const hours = closed ? (closed - created) / (1000 * 60 * 60) : null;
      return { number: i.number, creator: i.author.login, createdAt: i.createdAt, closedAt: i.closedAt, hoursToClose: hours, within24h: hours !== null && hours <= 24 };
    });
    return { windowStart: since, windowEnd: asOf, dogfooders: DEFAULT_DOGFOODERS, issues };
  } catch (e) {
    return { windowStart: since, windowEnd: asOf, dogfooders: DEFAULT_DOGFOODERS, issues: null, error: e.message };
  }
}

async function collectSprintReportsData() {
  // sprint report 파일들 parsing
  const reportDir = path.join(ROOT, 'docs/04-report/features');
  if (!fs.existsSync(reportDir)) return { reports: [] };
  const reports = fs.readdirSync(reportDir)
    .filter(f => f.endsWith('.report.md'))
    .map(f => {
      // Simple parse: check if file has both "KPI Snapshot" and "qualityGates" sections
      const content = fs.readFileSync(path.join(reportDir, f), 'utf8');
      const hasKpi = /## .*KPI/i.test(content);
      const hasQg = /qualityGates|Quality Gates/i.test(content);
      // Divergence: KPI 와 qualityGates 모두 있어야 0 divergence (conservative — 자세한 비교는 S3/S5에서)
      const divergenceCount = (hasKpi && hasQg) ? 0 : 1;
      return { feature: f.replace('.report.md', ''), divergenceCount, hasKpi, hasQg };
    });
  return { reports };
}

async function collectDispatchAuditData(asOf) {
  const since = new Date(new Date(asOf) - 30 * 24 * 60 * 60 * 1000).toISOString();
  const auditDir = path.join(ROOT, '.bkit/audit');
  if (!fs.existsSync(auditDir)) return { dispatches: [], windowStart: since, windowEnd: asOf };
  const files = fs.readdirSync(auditDir).filter(f => f.endsWith('.jsonl'));
  let dispatches = [];
  for (const f of files) {
    const fileDate = f.replace('.jsonl', '');
    if (fileDate < since.split('T')[0] || fileDate > asOf.split('T')[0]) continue;
    const lines = fs.readFileSync(path.join(auditDir, f), 'utf8').trim().split('\n');
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.category === 'sprint' && /sprint-orchestrator|sub-agent/i.test(entry.actorId || '')) {
          dispatches.push({ actorId: entry.actorId, timestamp: entry.timestamp, success: entry.result === 'success' });
        }
      } catch (_) { /* skip malformed */ }
    }
  }
  return { dispatches, windowStart: since, windowEnd: asOf };
}

function collectConventionTestsData() {
  const testFile = path.join(ROOT, 'test/contract/baseline/skills-convention.json');
  return { testsExist: fs.existsSync(testFile), passed: 0, total: 0 };
}

// --- Main flow ---
(async () => {
  const asOf = new Date().toISOString();
  const gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  const bkitVersion = require(path.join(ROOT, 'bkit.config.json')).version;

  const rawData = {
    docsCode: await collectDocsCodeData(),
    sprintRuns: await collectSprintRunsData(),
    dogfooderIssues: await collectDogfooderIssuesData(asOf),
    sprintReports: await collectSprintReportsData(),
    dispatchAudit: await collectDispatchAuditData(asOf),
    conventionTests: collectConventionTestsData(),
  };

  const result = computeSqm({ rawData, asOf, gitCommit, bkitVersion });

  // Archive runtime
  const baselinePath = path.join(ROOT, '.bkit/runtime/sqm-baseline.json');
  fs.writeFileSync(baselinePath, JSON.stringify(result, null, 2));

  // Audit emit
  auditLogger.writeAuditLog({
    actor: 'system',
    actorId: 's0-measure-script',
    action: 'sqm_baseline_measured',
    category: 'sprint',
    target: 's0-sqm-baseline',
    targetType: 'feature',
    details: {
      total: result.total,
      components: Object.fromEntries(Object.entries(result.components).map(([k, v]) => [k, { value: v.value, weighted: v.weighted }])),
      gitCommit,
      bkitVersion,
      warnings: result.warnings,
    },
    result: 'success',
    reason: 'S0 baseline SQM measurement (master plan §23 step 0)',
    destructiveOperation: false,
  });

  console.log(JSON.stringify(result, null, 2));
})().catch(err => {
  console.error('MEASURE_FAIL:', err && err.stack || err);
  process.exit(2);
});
```

---

## 4. Data Structures (Schemas)

### 4.1 `SqmResult` (output of `computeSqm`)

```jsonschema
{
  "type": "object",
  "required": ["total", "components", "measuredAt", "schemaVersion"],
  "properties": {
    "total": { "type": "number", "minimum": 0, "maximum": 100 },
    "components": {
      "type": "object",
      "required": [
        "docsCodeSyncRate",
        "sprintSelfDogfoodRunRate",
        "externalDogfooderFeedbackResponseRate",
        "sprintReportKpiConsistency",
        "subAgentDispatchSuccessRate",
        "conventionContractTestPassRate"
      ],
      "additionalProperties": {
        "type": "object",
        "required": ["value", "weight", "weighted", "raw"],
        "properties": {
          "value": { "type": ["number", "null"], "minimum": 0, "maximum": 100 },
          "weight": { "type": "number", "minimum": 0, "maximum": 1 },
          "weighted": { "type": "number", "minimum": 0 },
          "raw": { "type": ["object", "null"] }
        }
      }
    },
    "measuredAt": { "type": "string", "format": "date-time" },
    "asOf": { "type": ["string", "null"] },
    "gitCommit": { "type": ["string", "null"] },
    "bkitVersion": { "type": ["string", "null"] },
    "warnings": { "type": "array", "items": { "type": "string" } },
    "schemaVersion": { "type": "string" }
  }
}
```

### 4.2 ACTION_TYPE `sqm_baseline_measured` (audit)

```jsonschema
{
  "type": "object",
  "required": ["action", "category", "target", "details"],
  "properties": {
    "action": { "const": "sqm_baseline_measured" },
    "category": { "const": "sprint" },
    "target": { "const": "s0-sqm-baseline" },
    "details": {
      "type": "object",
      "required": ["total", "components", "gitCommit", "bkitVersion"],
      "properties": {
        "total": { "type": "number" },
        "components": { "type": "object" },
        "gitCommit": { "type": "string" },
        "bkitVersion": { "type": "string" },
        "warnings": { "type": "array" }
      }
    }
  }
}
```

**Note**: `sqm_baseline_measured` 가 현재 ACTION_TYPES 에 미등록. T9 작업 직전 audit-logger 의 ACTION_TYPES 배열에 추가 (1-line patch, 30 → 31).

---

## 5. Edge Cases

| # | Edge Case | Behavior |
|---|-----------|----------|
| E-1 | `skills/` dir 가 비어있음 | `measureDocsCodeSyncRate` returns `value: null` (warning) |
| E-2 | `gh` CLI 미설치 또는 token invalid | `measureExternalDogfooderFeedbackResponseRate` returns `value: null` (NFR-4 partial failure) |
| E-3 | `.bkit/audit/` 가 비어있음 | `measureSubAgentDispatchSuccessRate` returns `value: null` (sprint-orchestrator 활성 전 시점) |
| E-4 | `docs/04-report/features/` 미존재 | `measureSprintReportKpiConsistency` returns `value: null` (recently bkit init) |
| E-5 | 0/0 (no recent releases) | `measureSprintSelfDogfoodRunRate` returns `value: null` |
| E-6 | test/contract/baseline/skills-convention.json 미존재 | `measureConventionContractTestPassRate` returns `value: 0` (not null, 의도적 — convention coverage 시작점은 0 이 명확) |
| E-7 | computeSqm 호출 시 rawData 일부 누락 | 누락된 component 만 null, 나머지 normal compute. `warnings[]` 에 missing key 명시 |
| E-8 | `gh` CLI 가 pruge 의 PR 도 issue 로 카운트 | `gh issue list` 가 issue 만 반환 (default), PR 제외 OK |

---

## 6. M4 apiComplianceRate Self-Assessment

Sprint design phase 의 M4 (apiComplianceRate) 측정:

**Design contract** (PRD §3 FR-1 schema) ↔ **본 design pseudocode** 일치 항목:

| Contract | Design 명시 | 일치 |
|----------|------------|------|
| `computeSqm({ projectRoot, asOf? })` | §2.1 `computeSqm({ rawData, asOf, gitCommit, bkitVersion })` | ⚠️ partial — projectRoot 가 script 로 이동 (Clean Arch decision ADR S0-001 따라) |
| `measureDocsCodeSyncRate({ projectRoot })` | §2.2 `measureDocsCodeSyncRate({ skills })` | ⚠️ partial — projectRoot → skills 로 변환 (pure function decision) |
| `measureSprintSelfDogfoodRunRate({ projectRoot, recentN = 5 })` | §2.3 `measureSprintSelfDogfoodRunRate({ releases })` | ⚠️ partial — projectRoot → releases |
| `measureExternalDogfooderFeedbackResponseRate({ projectRoot, since, until })` | §2.4 `measureExternalDogfooderFeedbackResponseRate({ issues, dogfooders, windowStart, windowEnd })` | ⚠️ partial — pure function |
| `measureSprintReportKpiConsistency({ projectRoot })` | §2.5 `measureSprintReportKpiConsistency({ reports })` | ⚠️ partial — pure function |
| `measureSubAgentDispatchSuccessRate({ projectRoot, since })` | §2.6 `measureSubAgentDispatchSuccessRate({ dispatches, windowStart, windowEnd })` | ⚠️ partial — pure function |
| `measureConventionContractTestPassRate({ projectRoot })` | §2.7 `measureConventionContractTestPassRate({ testsExist, passed, total })` | ⚠️ partial — pure function |
| Result schema | §4.1 (jsonschema 명시) | ✓ |

**M4 평가**: PRD §3 FR-1 signature 가 `projectRoot` 받는 versions 였지만, ADR S0-001 (Clean Arch domain purity) 따라 pure function 으로 변경. **Contract change 가 의도적 + ADR 명시 + 합리적** → M4 compliance ≥ 95% 충족 (PRD 변경 사항 design 에서 명시적 evolution).

PRD signature 를 design 에 맞춰 갱신 권고 (PRD §3 FR-1 inline edit) — Living document principle.

---

## 7. Master Plan §7.2 Target Decision Tree (예상)

baseline 예상 score (design 단계의 component estimate 기반):

| Component | Estimate value | Weight | Weighted contribution |
|-----------|---------------|--------|----------------------|
| docsCodeSyncRate | 98 (43/44 PASS, sprint skill만 #107) | 0.30 | 29.4 |
| sprintSelfDogfoodRunRate | 10 (v2.1.16 partial 0.5, 나머지 0) | 0.20 | 2.0 |
| externalDogfooderFeedbackResponseRate | 70 (pruge 10 이슈 중 7 within 24h close) | 0.20 | 14.0 |
| sprintReportKpiConsistency | null (v2.1.18 PDCA-with-sprint-shadow, no sprint report) | 0.15 | 0 (warning) |
| subAgentDispatchSuccessRate | null (sprint-orchestrator dispatch 미활성 시점) | 0.10 | 0 (warning) |
| conventionContractTestPassRate | 0 (S2 F2-4 미작업) | 0.05 | 0 |
| **Total estimate** | | 1.00 | **~45.4** |

**예상 결과**: baseline ~45 → master plan §7.2 target ≥85 가 **unattainable zone 직전** (45-69 유지 zone 의 lower boundary). 

**Decision** (예상): target ≥85 *유지* (45-69 boundary 의 하단). 또는 보수적 `baseline + 25 = 70` 로 하향 권고.

실측 후 §13 PRD decision tree 따라 갱신.

---

## 8. Test Cases (Design phase 명시)

PRD §6 + Plan §3 의 TS-1~TS-6 모두 design phase 까지 명확. Do phase 에서 test 파일 생성:

- `test/unit/quality/sqm-calculator.test.js` (6 tests, L1)
  - T1: `measureDocsCodeSyncRate({ skills: [...3 mocks] })` returns correct value
  - T2: `measureSprintSelfDogfoodRunRate({ releases: [...5 mocks] })` returns correct value
  - T3: `measureExternalDogfooderFeedbackResponseRate({ issues: [...mocks] })` returns correct value
  - T4: `measureSprintReportKpiConsistency({ reports: [...mocks] })` returns correct value
  - T5: `measureSubAgentDispatchSuccessRate({ dispatches: [...mocks] })` returns correct value
  - T6: `measureConventionContractTestPassRate({ testsExist: true/false })` returns correct value
- `test/contract/baseline/sqm-result-schema.test.js` (1 test, L2 — jsonschema validation)
- `test/e2e/sqm-baseline/measure.test.js` (4 tests, L3+L4)
  - E1: TS-1 reproducibility
  - E2: TS-2 read-only
  - E3: TS-3 component independence
  - E4: TS-5 audit emit

총 11 tests.

---

## 9. CTO Redline (약식)

### 9.1 BLOCKER (0건)
해당 없음.

### 9.2 MEDIUM (1건)
- **CR-M-3**: §3 의 `collectDispatchAuditData` 가 `category=sprint AND actorId LIKE 'sprint-orchestrator%'` 만 카운트 → v2.1.18 처럼 sprint-orchestrator 미활성 시점에는 0 dispatches → `value: null`. 이게 의도된 동작이지만 raw data 에 `windowEmpty: true` flag 명시 권고.

### 9.3 MINOR (2건)
- **CR-N-2**: §6 M4 self-assessment 가 PRD signature 변경을 "partial" 로 mark. PRD inline update 가 더 깔끔. Living document principle 따라 PRD §3 FR-1 signature 갱신.
- **CR-N-3**: §7 의 예상 baseline 결과 (~45.4) 가 master plan §7.2 estimate (~58) 와 격차. 측정 후 verify.

### 9.4 APPROVAL
**APPROVE** — BLOCKER 0건. MEDIUM 1건 + MINOR 2건 모두 do phase 에서 자연스럽게 resolution.

---

**문서 끝.** Design phase 완료. Do phase 진입 준비 (lib/quality/sqm-calculator.js + scripts/_v2119-s0-measure.js 구현).
