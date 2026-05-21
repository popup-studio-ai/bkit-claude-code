---
template: design
version: 2.0
feature: s4-proactive
date: 2026-05-21
author: kay (메인 세션, ADR documented)
project: bkit
bkit_version: 2.1.18
sprint_id: s4-proactive
predecessor_plan: docs/01-plan/features/s4-proactive.plan.md
predecessor_prd: docs/00-pm/features/s4-proactive.prd.md
---

# S4 — External Dogfooder Lifecycle (Design)

## ADRs

### ADR S4-001 — Trust Score 7-Component normalization strategy

**Context**: 기존 6 components 합 1.0. 7번째 추가 시 기존 weight 어떻게 조정?

**Decision**: 기존 6 components 각자 weight × 0.95 (relative ratio 유지) + 7번째 weight 0.05. 합 1.0.

**Rationale**: Trust Score 수치 변동 최소화 (Δ ≤5%). 기존 사용자 surprise downgrade 회피 (master plan R-10 mitigation).

### ADR S4-002 — externalDogfoodFeedbackResponseRate source schema

**Decision**: `.bkit/state/external-feedback-tracker.json` 에 다음 schema:
```json
{
  "asOf": "ISO timestamp",
  "windowDays": 30,
  "dogfooders": ["pruge"],
  "value": 100,  // 0-100 (within24h close rate)
  "raw": { "closed": 7, "within24h": 7, "openInWindow": 4, "issues": [...] },
  "warnings": [],
  "schemaVersion": "1.0"
}
```

trust-engine 가 본 file 의 `value` field 를 7번째 component 값으로 load. file 부재 시 default 0.

### ADR S4-003 — pruge dandi e2e tests pattern

**Decision**: 5 e2e tests 가 각각 #100/#101/#102/#107/general workflow 시나리오를 verify. CC nested Task 의존 시 `--skip-on-no-cc` fallback (S1 F1-1 패턴 동일).

**Consequence**: 5 e2e tests 가 차후 동일 결함 regression lock — pruge dandi 의 *다음 시나리오 surface* (master plan §2.3 dialectical synthesis) 까지 안전망 확장.

### ADR S4-004 — Hall of Fame markdown structure

**Decision**: `docs/external-dogfooders/<handle>.md` schema:
- Front matter: handle, project, first_contribution_at, total_issues, scenarios_absorbed, hall_of_fame_release
- Sections: Overview / Issue Timeline / Absorbed Scenarios / Quote / Trust Score Impact
- README appendix: brief mention + link to detailed file

**Rationale**: structured archive (machine-parseable for future tooling) + human-readable narrative.

## Module Architecture

```
lib/
├── audit/audit-logger.js (MODIFIED: +external_feedback_tracked)
├── control/
│   ├── trust-engine.js (MODIFIED: 7-component normalization)
│   └── external-feedback-tracker.js (NEW)
scripts/
└── _v2119-s4-feedback-refresh.js (NEW: CLI runner)
docs/external-dogfooders/
├── _README.md (NEW: lifecycle + benefits + 5-stage diagram)
└── pruge.md (NEW: first entry archive)
README.md (APPEND: Hall of Fame + Early Adopter Program sections)
.claude-plugin/marketplace.json (MODIFIED: description dogfooder narrative)
CHANGELOG.md (APPEND: appendix template for future entries)
test/
├── unit/control/
│   ├── external-feedback-tracker.test.js (NEW, 3 TC)
│   └── trust-engine-7component.test.js (NEW, 5 TC)
└── e2e/external-dogfood/
    ├── dandi-100-orchestrator-task-tool.test.js (NEW, 1 TC)
    ├── dandi-101-trust-mutation.test.js (NEW, 1 TC)
    ├── dandi-102-trust-alias.test.js (NEW, 1 TC)
    ├── dandi-107-skill-md-path.test.js (NEW, 1 TC)
    └── dandi-general-l1-workflow.test.js (NEW, 1 TC)
```

## external-feedback-tracker.js pseudocode

```js
'use strict';
// lib/control/external-feedback-tracker.js — v2.1.19 S4 F4-2
const { execSync } = require('child_process');
const path = require('path'), fs = require('fs');

const DEFAULT_WINDOW_DAYS = 30;
const SCHEMA_VERSION = '1.0';

async function trackIssues({ owner, repo, dogfooders, sinceISO, untilISO }) {
  const issues = [];
  for (const handle of dogfooders) {
    try {
      const json = execSync(
        `gh issue list --repo ${owner}/${repo} --state all --search "author:${handle} created:>=${sinceISO.split('T')[0]}" --limit 100 --json number,createdAt,closedAt,author,title`,
        { encoding: 'utf8', timeout: 20000, stdio: ['ignore', 'pipe', 'pipe'] }
      );
      const parsed = JSON.parse(json);
      for (const i of parsed) {
        const created = new Date(i.createdAt);
        const closed = i.closedAt ? new Date(i.closedAt) : null;
        const hoursToClose = closed ? (closed - created) / 3600000 : null;
        issues.push({
          number: i.number, creator: i.author?.login || handle,
          createdAt: i.createdAt, closedAt: i.closedAt,
          hoursToClose: hoursToClose !== null ? Math.round(hoursToClose * 10) / 10 : null,
          within24h: hoursToClose !== null && hoursToClose <= 24,
          title: i.title,
        });
      }
    } catch (e) {
      return { issues: null, error: String(e.message || e) };
    }
  }
  return { issues };
}

function computeResponseRate({ issues, windowDays }) {
  if (!Array.isArray(issues) || issues.length === 0) {
    return { value: null, raw: { error: 'no issues' } };
  }
  const closed = issues.filter(i => i.closedAt);
  if (closed.length === 0) {
    return { value: null, raw: { error: 'no closed', openCount: issues.length } };
  }
  const within24h = closed.filter(i => i.within24h).length;
  return {
    value: Math.round((within24h / closed.length) * 100),
    raw: { closed: closed.length, within24h, openInWindow: issues.length - closed.length, windowDays },
  };
}

function persistToFile(result, filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(result, null, 2) + '\n');
}

module.exports = { trackIssues, computeResponseRate, persistToFile, DEFAULT_WINDOW_DAYS, SCHEMA_VERSION };
```

## trust-engine.js 변경 pseudocode

기존 components 의 `weight` 를 *상대 ratio* 유지 (× 0.95) + externalDogfoodFeedbackResponseRate 추가:

```js
// lib/control/trust-engine.js modification
const COMPONENT_WEIGHTS = {
  pdcaCompletionRate: 0.2375,       // 0.25 × 0.95
  gatePassRate: 0.19,                // 0.20 × 0.95
  rollbackFrequency: 0.1425,         // 0.15 × 0.95
  destructiveBlockRate: 0.1425,      // 0.15 × 0.95
  iterationEfficiency: 0.1425,       // 0.15 × 0.95
  userOverrideRate: 0.095,           // 0.10 × 0.95
  externalDogfoodFeedbackResponseRate: 0.05,  // NEW (S4 F4-1)
};
// Sum: 0.2375 + 0.19 + 0.1425 + 0.1425 + 0.1425 + 0.095 + 0.05 = 1.000 ✓
```

`loadTrustScore()` 가 7번째 value 를 `.bkit/state/external-feedback-tracker.json` 에서 load (file 부재 시 default 0).

## Hall of Fame pruge.md skeleton

```markdown
---
handle: pruge
github: https://github.com/pruge
project: dandi-village-ledger
first_contribution_at: 2026-05-20
total_issues: 10  # #92 ~ #107
scenarios_absorbed: 5
hall_of_fame_release: v2.1.19
trust_score_impact: +0.05 weight component (lifelong)
---

# @pruge — Real User Hall of Fame (v2.1.19)

## Overview
James Kim (@pruge) was the first external dogfooder to deeply exercise bkit's
sprint management on a production project (dandi-village-ledger). Between
2026-05-20 and 2026-05-21, 10 issues were filed in 1.5 days, all in the
sprint domain — a precise diagnostic cluster that prompted bkit v2.1.17,
v2.1.18, and the entire v2.1.19 Quality Maturation Sprint.

## Issue Timeline (10 issues)
... (full table) ...

## Absorbed Scenarios (5)
... (links to test files) ...

## Quote
> (placeholder for pruge's permission-pending public statement)

## Trust Score Impact
externalDogfoodFeedbackResponseRate component 의 첫 N=1 evidence:
- v2.1.18 baseline measurement (S0): 100% (closed 7/7 within 24h)
- ENH-318 narrative 의 정량 anchor
```

## Pruge dandi scenarios E2E test pattern

각 test 가 다음 구조:
```js
test('TC-F4-4-D<N>: <시나리오 description> — reproduction PASS', async () => {
  // 1. Setup: clean sprint state (cleanupSprint helper)
  // 2. Execute the pruge-reported scenario via CLI or lib API
  // 3. Assert expected outcome (post-v2.1.18 fix behavior)
  // 4. Cleanup: remove test artifacts
});
```

## Edge cases

- gh CLI absent → external-feedback-tracker returns `{ issues: null, error }` (NFR-4)
- trust-engine.js 의 기존 weight 가 hardcoded 가 아닌 config-driven 인 경우 → static const 로 override (S4 design 결정)
- Hall of Fame `pruge.md` 가 GitHub 사용자 permission pending → quote placeholder (deferred to v2.1.20+ pruge consent)
- 5 e2e tests 의 dandi 시나리오가 nested Task 의존 시 `--skip-on-no-cc` 자동 skip

## CTO Redline (약식)
- BLOCKER 0
- MEDIUM 1: T6 의 weight 정규화가 *config-driven 사용자* 영향 (만약 사용자가 custom weight override 한 경우) — 본 S4 scope 에서는 static const 적용 (v2.1.20+ config support 가능 시 carry)
- APPROVAL: APPROVE

---

**문서 끝.** Design complete. Do phase 진입.
