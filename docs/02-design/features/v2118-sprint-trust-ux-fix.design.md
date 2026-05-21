---
template: design
version: 1.3
feature: v2118-sprint-trust-ux-fix
date: 2026-05-21
author: kay
project: bkit
version: 2.1.18
---

# v2118-sprint-trust-ux-fix — Design Document

> **Status**: Active (sprint init 완료, CTO review APPROVE with CONCERNS 반영, PM PRD 완료)
> **Plan**: [v2118-sprint-trust-ux-fix.plan.md](../../01-plan/features/v2118-sprint-trust-ux-fix.plan.md)
> **PRD**: [v2118-sprint-trust-ux-fix.prd.md](../../00-pm/features/v2118-sprint-trust-ux-fix.prd.md) (Beachhead Geoffrey Moore 19/20, JTBD 6-Part, 5 User Stories, 6 Test Scenarios, Pre-mortem Top 3)
> **CTO Review**: APPROVE with CONCERNS (3 BLOCKERs + 3 MEDIUM concerns reflected in redline; 메인 세션 재측정 결과 채택)
> **Predecessor**: v2.1.17 final (PR #99, 5축 매트릭스 5/5 close)
> **GitHub Issues**: #100, #101, #102 (모두 @pruge 보고, 2026-05-21 03:54)
> **Branch**: `feature/v2118-issue-fixes`

---

## 0. Design Goal

3 features (F1/F2/F3) 통합 구현으로 **L1 sprint trust 3-stage trap** 영구 해소. 각 feature 별 코드 변경 위치, API/CLI 시그니처, hook 흐름, audit 기록, 회귀 테스트 명세를 사전 확정하여 implementation phase에서 추가 결정 비용 0으로 만든다.

---

## 1. Architecture Overview

### 1.1 영향 컴포넌트 (Clean Architecture 계층별)

| Layer | 변경 파일 | 변경 종류 | Feature |
|-------|----------|----------|---------|
| **Presentation (Agents)** | `agents/sprint-orchestrator.md`, `agents/sprint-master-planner.md`, `agents/sprint-qa-flow.md`, `agents/sprint-report-writer.md` | frontmatter `tools:` 필드 신규 추가 (코드 본문 무수정) | F1 |
| **Presentation (Skills)** | `skills/sprint/SKILL.md` | §10.1.3 "Trust Level Mutation" 섹션 신규 + help 텍스트 갱신 | F2 |
| **Presentation (Commands)** | `commands/bkit.md` | help table에 `/sprint trust` 1줄 추가 | F2 |
| **Application (Handler)** | `scripts/sprint-handler.js` | (a) `handleTrust(args, infra, deps)` 신규 함수, (b) dispatch table case 'trust' 추가, (c) line 721-723 + 750-752 normalizeTrustLevel 통일 | F2 + F3 |
| **Domain (Validation)** | (변경 없음) | normalizeTrustLevel 자체는 보존, 호출 경로만 통일 | F3 |
| **Infrastructure (Audit)** | `lib/audit/audit-logger.js` | ACTION_TYPES 배열에 `'sprint_trust_changed'` 추가 + details schema 주석 | F2 |
| **Tests** | `test/contract/`, `test/unit/`, `test/integration/`, `test/e2e/` | 신규 4 + 회귀 test 추가 (총 11 TC) | All |

### 1.2 컴포넌트 의존성 그래프

```
┌────────────────────────────────────────────────────────────┐
│  User → CC CLI → bkit:sprint skill → /sprint trust ... │
└────────────────────────┬───────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────┐
│  scripts/sprint-handler.js (dispatch table)                │
│  ├─ case 'init'  → handleInit                              │
│  ├─ case 'start' → handleStart                             │
│  ├─ case 'trust' → handleTrust ✦ (F2 신규)                 │
│  ├─ case 'phase' → handlePhase                             │
│  └─ case 'measure' → handleMeasure ✦ (F3 fix line 721)     │
└────────────────────────┬───────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────┐
│  handleTrust(args, infra, deps) — F2 신규                  │
│  1. Load sprint via infra.stateStore.load(args.id)         │
│  2. Validate args.to via VALID_TRUST_LEVELS                │
│  3. Downgrade guardrail check (L4→≤L2 시 control score)    │
│  4. Mutate sprint.autoRun.trustLevelAtStart = args.to      │
│  5. infra.stateStore.save(sprint)                          │
│  6. audit.writeAuditLog({                                  │
│       action: 'sprint_trust_changed',                      │
│       details: { sprintId, from, to, reason, ... }         │
│     })                                                     │
│  7. Return { ok: true, sprintId, from, to, reason }        │
└────────────────────────┬───────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────┐
│  lib/audit/audit-logger.js                                 │
│  └─ ACTION_TYPES += 'sprint_trust_changed' ✦ (F2)          │
└────────────────────────────────────────────────────────────┘

병렬 흐름 — F1 (Agent tools allowlist):

┌────────────────────────────────────────────────────────────┐
│  sprint-orchestrator agent (4 agents 동일 패턴)            │
│  └─ frontmatter tools: ✦ 신규 (Task allowlist 명시)        │
│      → Task(gap-detector) | Task(code-analyzer) | ...      │
└────────────────────────┬───────────────────────────────────┘
                         ↓ (실행 시)
┌────────────────────────────────────────────────────────────┐
│  measure-router.js → agentTaskRunner runs Task(<agent>)   │
│  → measurement value returned → persistAndAudit            │
│  (현재 'no_agent_runner' 반환, fix 후 정상 dispatch)        │
└────────────────────────────────────────────────────────────┘
```

---

## 2. Feature 1 — Sprint-* Agents Task Tool Allowlist

### 2.1 Root Cause 정밀 분석

`agents/sprint-*.md` 4개 파일 frontmatter에 **`tools:` 필드 자체 부재** (Phase 2 코드베이스 조사 결과):

```yaml
# 현재 (4 agents 동일)
---
name: sprint-orchestrator
description: |
  Sprint full-lifecycle orchestrator. ...
model: opus
effort: high
maxTurns: 40
memory: project
---
# tools: 필드 미선언 → CC default policy로 Task tool 비포함
```

비교 — `agents/cto-lead.md`는 명시적으로 28개 도구 + 13개 Task allowlist 선언:

```yaml
---
name: cto-lead
...
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task(enterprise-expert)
  - Task(infra-architect)
  - Task(bkend-expert)
  ... (총 28개)
---
```

### 2.2 Fix 명세 (4 agents 각각)

#### F1-A: agents/sprint-orchestrator.md

```yaml
# 추가될 frontmatter (기존 model/effort/maxTurns/memory 뒤)
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task(gap-detector)        # M1, M3, M4 measurement
  - Task(code-analyzer)        # M2, M7 measurement
  - Task(sprint-qa-flow)       # S1 dataFlowIntegrity (sub-orchestration)
  - Task(sprint-report-writer) # report generation
  - Task(qa-monitor)           # zero-script QA runtime
  - Task(pdca-iterator)        # iterate phase auto-fix
  - Task(Explore)              # broad codebase exploration
```

**근거**: Master Plan §11.1 + `measure-router.js:226-253` measureGate 함수가 agentTaskRunner 호출 → 4 measurement agents + 2 sub-orchestration agents 필요.

#### F1-B: agents/sprint-master-planner.md

> **사용자 요청 (2026-05-21 do phase)**: 기존 명세는 PM domain (product-manager) + frontend-architect + enterprise-expert만 포함했으나, 사용자 명시적 요청으로 **CTO 팀 + QA 팀 lead orchestrator도 포함** 하도록 확장. lead orchestrator 패턴 채택 (각 lead가 내부에서 sub-agent spawn) — sprint-master-planner의 책임 단순화 + 차별화 #3 ENH-292 sequential dispatch 정책과 정합.

```yaml
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  # PM Team orchestrator (pm-discovery / pm-strategy / pm-research / pm-prd 내부 spawn)
  - Task(pm-lead)
  # CTO Team orchestrator (enterprise-expert / security-architect / infra-architect / frontend-architect 내부 spawn)
  - Task(cto-lead)
  # QA Team orchestrator (qa-strategist / qa-test-planner / qa-monitor / qa-debug-analyst 내부 spawn)
  - Task(qa-lead)
  # Specialist 직접 호출 (lead orchestrator 우회 필요한 경우)
  - Task(product-manager)       # single-feature PRD (legacy 호환)
  - Task(frontend-architect)    # UI/UX design layer 직접 호출
  - Task(enterprise-expert)     # architecture decisions 직접 호출 (legacy 호환)
  - Task(Explore)               # template + ref scanning
```

**근거**:
- Sprint master plan generation 시 PRD (PM Team) + Architecture Review (CTO Team) + QA Strategy (QA Team) 3 도메인 동시 분석 필요
- Lead orchestrator 패턴 채택: pm-lead/cto-lead/qa-lead 가 각각 내부에서 4-5 sub-agent spawn — sprint-master-planner는 high-level coordination만 담당 (책임 단순화)
- 기존 legacy 호환 직접 specialist (product-manager / frontend-architect / enterprise-expert) 유지 — lead orchestrator 우회 필요 시 사용
- 7 Task allowlist (3 leads + 3 specialists + Explore) = ENH-292 sequential dispatch 정책 하에 충분 (max 7 sub-agent spawn per master-plan generation)

#### F1-C: agents/sprint-qa-flow.md

```yaml
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task(qa-monitor)            # runtime log analysis
  - Task(gap-detector)          # API/UI gap verification (per layer)
```

**근거**: 7-Layer dataFlowIntegrity 검증 시 각 layer 별 sub-agent 활용.

#### F1-D: agents/sprint-report-writer.md

```yaml
tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  # Task allowlist 불필요 — report는 aggregation만 (sub-agent dispatch 없음)
```

**근거**: phaseHistory/iterateHistory/featureMap/kpi 등 sprint state 읽기 + markdown 작성만.

### 2.3 L3 Contract Test 명세

`test/contract/sprint-agents-tools.test.js` (신규):

```js
const fs = require('fs');
const path = require('path');
const { parseFrontmatterFile } = require('../../lib/util/frontmatter');

const SPRINT_AGENTS = [
  { name: 'sprint-orchestrator', requiredTasks: ['gap-detector', 'code-analyzer', 'sprint-qa-flow', 'sprint-report-writer'] },
  { name: 'sprint-master-planner', requiredTasks: ['product-manager', 'frontend-architect'] },
  { name: 'sprint-qa-flow', requiredTasks: ['qa-monitor'] },
  { name: 'sprint-report-writer', requiredTasks: [] }, // Task 불필요
];

describe('sprint-* agents tools allowlist invariant', () => {
  for (const { name, requiredTasks } of SPRINT_AGENTS) {
    test(`agents/${name}.md declares tools field`, () => {
      const filePath = path.join(__dirname, '../../agents', `${name}.md`);
      const parsed = parseFrontmatterFile(filePath);
      expect(parsed.frontmatter.tools).toBeDefined();
      expect(Array.isArray(parsed.frontmatter.tools)).toBe(true);
      expect(parsed.frontmatter.tools.length).toBeGreaterThan(0);
    });

    if (requiredTasks.length > 0) {
      test(`agents/${name}.md tools includes required Task allowlist`, () => {
        const filePath = path.join(__dirname, '../../agents', `${name}.md`);
        const parsed = parseFrontmatterFile(filePath);
        for (const task of requiredTasks) {
          expect(parsed.frontmatter.tools).toContain(`Task(${task})`);
        }
      });
    }
  }
});
```

### 2.4 Side Effects 분석

| 효과 | Type | 영향 |
|------|------|------|
| Task tool 활성화 → sprint-orchestrator가 sub-agent dispatch 가능 | Positive (issue #100 closure) | 본 fix 핵심 효과 |
| 기존 Read/Write/Edit/Glob/Grep/Bash 명시 선언 (이전 default inherit) | Neutral | 동일 동작, 명시화만 |
| ENH-292 sequential dispatch 정책 실제 작동 | Positive | 차별화 #3 활성화 |
| frontmatter 길이 증가 (~+10 lines) | Cosmetic | 무영향 |

---

## 3. Feature 2 — /sprint trust Mutation Command

### 3.1 API 시그니처

#### CLI

```bash
/sprint trust <sprintId> --to <L0|L1|L2|L3|L4> [--reason "<text>"] [--force]
```

| Flag | 필수 | 설명 |
|------|------|------|
| `<sprintId>` | YES | 대상 sprint id (kebab-case) |
| `--to <Level>` | YES | 변경할 trust level |
| `--reason "<text>"` | NO | 변경 사유 (audit 기록용, 권장) — newline은 JSON.stringify 자동 escape (NDJSON 안전, CTO §E2) |
| `--force` | NO | downgrade guardrail (**trust score < 80** 시) 우회 — trust score 모델은 `.bkit/state/trust-profile.json` `trustScore` field (0-100, 6 components weighted sum: pdcaCompletionRate 0.25 / gatePassRate 0.2 / rollbackFrequency 0.15 / destructiveBlockRate 0.15 / iterationEfficiency 0.15 / userOverrideRate 0.1) |

#### handleTrust 함수 시그니처

```js
/**
 * Mutate sprint's trustLevelAtStart with downgrade guardrails and audit.
 *
 * @param {Object} args
 * @param {string} args.id              - sprint id (required)
 * @param {string} args.to              - target level 'L0'|'L1'|'L2'|'L3'|'L4' (required)
 * @param {string} [args.reason]        - mutation reason (recommended). Newline/CR
 *                                        chars pass JSON.stringify escape automatically
 *                                        (NDJSON safe). Length-truncated by sanitizeDetails
 *                                        to DETAILS_VALUE_MAX_CHARS.
 * @param {boolean} [args.force]        - bypass downgrade guardrail (trust score < 80)
 * @param {'user'|'agent'|'system'} [args.actor]  - explicit actor (default 'user',
 *                                        auto-detected to 'agent' when
 *                                        process.env.CLAUDE_AGENT_ID is set,
 *                                        CTO §E6 spoofing mitigation)
 * @param {SprintInfra} infra           - infrastructure bundle (stateStore, audit)
 * @param {{ trustScore?: number, currentLevel?: number }} [deps] - optional dependency injection
 *                                        (for testing). Production reads from
 *                                        `.bkit/state/trust-profile.json`.
 * @returns {Promise<{
 *   ok: boolean,
 *   sprintId?: string,
 *   from?: string,
 *   to?: string,
 *   reason?: string|null,
 *   noop?: boolean,           - true when from === to (idempotent path)
 *   actor?: 'user'|'agent'|'system',
 *   auditEntryId?: string,
 *   error?: string,
 *   blockReason?: 'invalid_level'|'guardrail_blocked'|'sprint_not_found'|'missing_to'
 * }>}
 */
async function handleTrust(args, infra, deps) { ... }
```

### 3.2 알고리즘 (의사 코드)

```
handleTrust(args, infra, deps):
  # Validation
  IF NOT args.id:
    RETURN { ok: false, blockReason: 'sprint_not_found', error: 'id required' }
  IF NOT args.to OR args.to NOT IN VALID_TRUST_LEVELS:
    RETURN { ok: false, blockReason: 'invalid_level', error: 'to must be L0..L4' }

  sprint = AWAIT infra.stateStore.load(args.id)
  IF NOT sprint:
    RETURN { ok: false, blockReason: 'sprint_not_found' }

  from = sprint.autoRun?.trustLevelAtStart OR 'L3'
  to = args.to.toUpperCase()

  # Actor auto-detection (CTO §E6 spoofing mitigation)
  actor = args.actor IF args.actor IN ['user','agent','system']
          ELSE (process.env.CLAUDE_AGENT_ID ? 'agent' : 'user')

  # Idempotent: from === to 시에도 audit 기록 (CTO §C3 권고: 모니터링 사각지대 차단)
  IF from === to:
    AWAIT audit.writeAuditLog({
      action: 'sprint_trust_changed',
      category: 'sprint',
      actor: actor,
      result: 'success',
      target: { type: 'feature', id: args.id },
      blastRadius: 'low',
      details: { sprintId: args.id, from, to, reason: args.reason OR null, noop: true,
                 forced: false, actor, timestamp: NOW.toISOString() }
    })
    RETURN { ok: true, sprintId: args.id, from, to, noop: true, actor,
             reason: args.reason || null }

  # Downgrade guardrail (major = ≥2 levels 차이, trust score 또는 --force 요구)
  # Primary: trust score (from .bkit/state/trust-profile.json 'trustScore' field, 0-100)
  # Alternative (Design §9 Q1): currentLevel ≤ 1 시 block (CTO Option 1, 단일 모델 옵션)
  IF isDowngrade(from, to) AND severity(from, to) === 'major':
    trustScore = AWAIT loadTrustScore(deps)   # reads .bkit/state/trust-profile.json
    IF trustScore < 80 AND NOT args.force:
      RETURN {
        ok: false,
        blockReason: 'guardrail_blocked',
        error: `Major downgrade ${from} → ${to} requires trustScore >= 80 (current: ${trustScore}) or --force`
      }

  # Mutation
  sprint.autoRun = sprint.autoRun OR {}
  sprint.autoRun.trustLevelAtStart = to
  AWAIT infra.stateStore.save(sprint)

  # Audit (CTO §E2 NDJSON injection: reason은 sanitizeDetails truncate +
  # JSON.stringify auto-escape \n/\r 처리 — NDJSON 안전 검증 완료)
  # CTO §E6 actor: explicit args.actor 또는 CLAUDE_AGENT_ID 환경변수 기반
  # CTO §C5: --force 시 blastRadius 강제 'high' (Defense Layer 6 alarm trigger)
  audit = require('../lib/audit/audit-logger')
  auditEntryId = AWAIT audit.writeAuditLog({
    action: 'sprint_trust_changed',
    category: 'sprint',
    result: 'success',
    actor: actor,                              # ✦ explicit actor
    target: { type: 'feature', id: args.id },
    blastRadius: args.force ? 'high' :         # ✦ --force 시 alarm
                 (severity(from, to) === 'major' ? 'high' : 'low'),
    details: {
      sprintId: args.id,
      from,
      to,
      reason: args.reason OR null,             # sanitizeDetails 가 truncate
      trustScoreAtMutation: trustScore OR null, # ✦ controlScore → trustScore 정정
      forced: !!args.force,
      noop: false,                              # ✦ idempotent 분기와 구별
      actor: actor,                             # ✦ details에도 actor 명시
      timestamp: NOW.toISOString()
    }
  })

  RETURN {
    ok: true,
    sprintId: args.id,
    from,
    to,
    reason: args.reason OR null,
    actor: actor,
    auditEntryId
  }
```

### 3.3 isDowngrade / severity 헬퍼

```js
const LEVEL_RANK = { L0: 0, L1: 1, L2: 2, L3: 3, L4: 4 };

function isDowngrade(from, to) {
  return LEVEL_RANK[to] < LEVEL_RANK[from];
}

function severity(from, to) {
  const diff = LEVEL_RANK[from] - LEVEL_RANK[to];
  if (diff <= 0) return 'upgrade';     // L1 → L3
  if (diff === 1) return 'minor';      // L3 → L2
  return 'major';                       // L4 → L1 (or larger)
}
```

### 3.4 dispatch 추가 위치

`scripts/sprint-handler.js:213` 부근 (case 'phase' 직전):

```js
async function handleSprintAction(action, args, deps) {
  const a = args || {};
  const d = deps || {};
  const infra = (d && typeof d.infra === 'object') ? d.infra : getInfra(a);
  switch (action) {
    case 'init':    return handleInit(a, infra);
    case 'start':   return handleStart(a, infra, d);
    case 'status':  return handleStatus(a, infra);
    case 'list':    return handleList(a, infra);
    case 'trust':   return handleTrust(a, infra, d);  // ✦ F2 신규
    case 'phase':   return handlePhase(a, infra, d);
    // ... 나머지 ...
    case 'measure': return handleMeasure(a, infra, d);
    // ...
  }
}
```

### 3.5 ACTION_TYPES 확장 (lib/audit/audit-logger.js)

기존 line 31-90 배열에 89행 (`'gate_measured',`) 직후 추가:

```js
const ACTION_TYPES = [
  // ... 기존 30 entries ...
  'gate_measured',
  // v2.1.18 (Issue #101) — /sprint trust mutation command.
  // Emitted by handleTrust when sprint.autoRun.trustLevelAtStart is mutated.
  // details schema: {
  //   sprintId, from, to, reason ('text'|null),
  //   controlScoreAtMutation (number|null),
  //   forced (boolean), timestamp (ISO string)
  // }
  // No-op mutations (from === to) do NOT emit this entry.
  // Major downgrades (≥2 levels) blasted as 'high' radius; otherwise 'low'.
  'sprint_trust_changed',
];
```

**ACTION_TYPES 개수**: **29 → 30** (메인 세션 재측정 채택: `node -e "console.log(require('./lib/audit/audit-logger').ACTION_TYPES.length)"` = 29. CTO §D7 보고 "27 → 28"은 grep 패턴 한계로 누락된 entry 2건 차이 — runtime export가 결정적 source).

### 3.6 skills/sprint/SKILL.md §10.1.3 신규 섹션

§10.1.2 직후 (기존 `--approve` 섹션과 §10.2 사이) 신규 섹션 삽입:

```markdown
### 10.1.3 Trust Level Mutation (Persistent)

`/sprint trust <sprintId> --to <Level> [--reason "<text>"] [--force]`

Mutate the **stored** `sprint.autoRun.trustLevelAtStart` for a specific
sprint. Unlike `--approve` (single-use scope boundary override) or
`--trustLevel L<N>` (per-call volatile override), this command **persists**
the trust level across all subsequent operations on the sprint.

**Use cases**:
- L1 sprint started conservatively, ready to escalate after design review
- Demoting L4 sprint to L2 mid-flight after security concern
- Recovering from L1 "preview-mode lockout" (#101 v2.1.16 root cause)

**Example**:

```bash
$ /sprint trust s1-foundation --to L3 --reason "P0 32/32 ready for measurement"
{
  "ok": true,
  "sprintId": "s1-foundation",
  "from": "L1",
  "to": "L3",
  "reason": "P0 32/32 ready for measurement",
  "auditEntryId": "audit-2026-05-21T..."
}

$ /sprint measure s1-foundation --gate M1
{ "trustLevel": "L3", "mode": "record", "value": 92.3, ... }  # ✦ now record mode
```

**Downgrade Guardrail**:

Major downgrades (≥2 levels, e.g. L4 → L2 or L3 → L1) require:
- `control score >= 80` (see `/bkit:control status`), OR
- `--force` flag (explicit override)

This prevents accidental trust regression that could disable safety guards.

**Audit**:

Every mutation (excluding no-ops where from === to) emits an audit-logger
entry:

```json
{
  "action": "sprint_trust_changed",
  "category": "sprint",
  "actor": "user",
  "target": { "type": "feature", "id": "s1-foundation" },
  "blastRadius": "low",
  "details": {
    "sprintId": "s1-foundation",
    "from": "L1",
    "to": "L3",
    "reason": "P0 32/32 ready for measurement",
    "trustScoreAtMutation": 85,
    "forced": false,
    "noop": false,
    "actor": "user",
    "timestamp": "2026-05-21T..."
  }
}
```

**Comparison Table**:

| Command | Scope | Persistence | Use When |
|---------|-------|------------|----------|
| `/sprint phase --to ... --approve` | Single transition | Single-use (state 무변경) | 1회 boundary 우회 (#95) |
| `/sprint trust --to <L>` ✦ | Sprint 전체 (this sprint only) | Persistent (sprint.autoRun.trustLevelAtStart) | 본 sprint 정책 영구 변경 |
| `/bkit:control level <N>` | Global (all sprints + PDCA) | Persistent (~/.bkit/state/control.json) | 전역 automation 정책 변경 |
| `--trustLevel <L>` (per-call) | Single call | Volatile (state 무변경) | 1회 debug override |
```

### 3.7 commands/bkit.md help 갱신

기존 sprint section에 1줄 추가:

```
/sprint trust <id> --to <L> [--reason "..."]  Mutate sprint trust level (persistent)
```

---

## 4. Feature 3 — Normalize Trust Path Unification

### 4.1 Root Cause 정밀 분석

`scripts/sprint-handler.js:721-723` (handleMeasure):

```js
const trustLevel = typeof args.trustLevel === 'string'
  ? args.trustLevel
  : (sprint.autoRun && sprint.autoRun.trustLevelAtStart);
```

`scripts/sprint-handler.js:750-752` (runPhaseGates):

```js
const trustLevel = typeof args.trustLevel === 'string'
  ? args.trustLevel
  : (sprint.autoRun && sprint.autoRun.trustLevelAtStart);
```

→ **`args.trust`를 완전히 무시**. `normalizeTrustLevel` (line 68-74)이 이미 `args.trustLevel || args.trust || args.trustLevelAtStart` precedence를 처리하지만 호출되지 않음.

비교 — line 246, 291, 833 (handleInit, handleStart, handleArchive)는 `normalizeTrustLevel(args)` 정상 사용.

### 4.2 Fix 명세

#### Option A (채택): 호출 통일, normalizeTrustLevel signature 보존

`line 721-723`:

```js
// Before
const trustLevel = typeof args.trustLevel === 'string'
  ? args.trustLevel
  : (sprint.autoRun && sprint.autoRun.trustLevelAtStart);

// After (✦ F3 fix)
const trustLevel = normalizeTrustLevel(args)
  || (sprint.autoRun && sprint.autoRun.trustLevelAtStart)
  || DEFAULT_TRUST_LEVEL;
```

`line 750-752`: 동일 패턴.

**근거**: normalizeTrustLevel은 이미 `args.trustLevel || args.trust || args.trustLevelAtStart || default` 처리. 그러나 sprint state의 `sprint.autoRun.trustLevelAtStart`는 args가 아닌 sprint object 속성이므로 별도 fallback 필요. → 호출 후 보조 fallback chain.

#### Option B (대안 — 미채택): normalizeTrustLevel signature 확장

```js
function normalizeTrustLevel(args, sprintFallback) {
  if (!args && !sprintFallback) return DEFAULT_TRUST_LEVEL;
  const raw = args?.trustLevel || args?.trust || args?.trustLevelAtStart || sprintFallback;
  ...
}
```

**미채택 근거**: signature 변경 시 기존 3 호출 (line 246/291/833)도 모두 업데이트 필요 + signature breaking. Option A가 영향 최소.

### 4.3 회귀 Test 명세

`test/unit/sprint-trust-normalization.test.js` (신규):

```js
const { normalizeTrustLevel } = require('../../scripts/sprint-handler');

describe('normalizeTrustLevel precedence', () => {
  test('A: args.trustLevel only', () => {
    expect(normalizeTrustLevel({ trustLevel: 'L3' })).toBe('L3');
  });
  test('B: args.trust only — ✦ F3 fix target (#102)', () => {
    expect(normalizeTrustLevel({ trust: 'L3' })).toBe('L3');
  });
  test('C: args.trustLevelAtStart only', () => {
    expect(normalizeTrustLevel({ trustLevelAtStart: 'L3' })).toBe('L3');
  });
  test('D: precedence trustLevel > trust', () => {
    expect(normalizeTrustLevel({ trust: 'L2', trustLevel: 'L3' })).toBe('L3');
  });
  test('E: invalid value falls back to L3 default', () => {
    expect(normalizeTrustLevel({ trust: 'invalid' })).toBe('L3');
  });
  test('F: case insensitive', () => {
    expect(normalizeTrustLevel({ trust: 'l2' })).toBe('L2');
  });
  // ✦ CTO §F 권고: 기존 사용자 precedence 보호 (--trustLevel 우선)
  test('G: existing --trustLevel user protection (precedence preserved)', () => {
    expect(normalizeTrustLevel({ trustLevel: 'L3', trust: 'L2' })).toBe('L3');
    expect(normalizeTrustLevel({ trustLevel: 'L4', trust: 'L1', trustLevelAtStart: 'L0' })).toBe('L4');
  });
});
```

추가 — `test/integration/sprint-measure-trust-cli.test.js` (handleMeasure 통합):

```js
test('handleMeasure with --trust L3 + sprint L1 → record mode', async () => {
  const sprint = await initSprint({ id: 'test-l1', trust: 'L1' });
  const result = await handleSprintAction('measure',
    { id: 'test-l1', gate: 'M1', trust: 'L3' },   // ✦ --trust (not --trustLevel)
    { agentTaskRunner: stubRunner }
  );
  expect(result.trustLevel).toBe('L3');
  expect(result.results[0].mode).toBe('record');  // NOT preview
});
```

추가 — `test/integration/sub-agent-dispatcher-state.test.js` (✦ CTO §B 권고: sequential dispatch state transition):

```js
const dispatcher = require('../../lib/orchestrator/sub-agent-dispatcher');

test('sprint-orchestrator sequential dispatch state transitions (ENH-292 활성화 입증)', async () => {
  // F1 적용 후 sprint-orchestrator가 Task tool로 sub-agents 호출 가능
  // ENH-292 정책: 첫 spawn FIRST_SPAWN_SEQUENTIAL → 캐시 warm 후 CACHE_WARMUP_DETECTED
  dispatcher.reset();
  expect(dispatcher.getState()).toBe('IDLE');

  // 첫 sub-agent dispatch (sequential 강제)
  await dispatcher.dispatch({ subagent_type: 'gap-detector', prompt: 'M1' });
  expect(dispatcher.getState()).toBe('FIRST_SPAWN_SEQUENTIAL');

  // 후속 dispatch (cache warmup 감지 시 parallel 허용 가능)
  await dispatcher.dispatch({ subagent_type: 'code-analyzer', prompt: 'M2' });
  expect(['CACHE_WARMUP_DETECTED', 'SEQUENTIAL_ENFORCED']).toContain(dispatcher.getState());

  // 차별화 #3 narrative: 본 fix(F1) 적용 후에야 dispatcher state transition이 의미를 가짐
});
```

### 4.4 Side Effects 분석

| 효과 | Type | 영향 |
|------|------|------|
| `--trust L3` per-call이 정상 인식 | Positive (#102 closure) | 본 fix 핵심 효과 |
| 기존 `--trustLevel L3` 동작 보존 | Neutral | precedence trustLevel > trust > trustLevelAtStart 유지 |
| Fallback chain 명시화 (`|| DEFAULT_TRUST_LEVEL`) | Positive | undefined 누락 시 안전 default |
| `normalizeTrustLevel` 호출 2건 추가 (line 721, 750) | Negligible | 함수 호출 비용 무시 가능 |

---

## 5. E2E Test 시나리오 (보고자 재현)

`test/e2e/sprint-l1-lockout-recovery.test.js` (신규):

```js
describe('E2E: L1 sprint lockout recovery (Issues #100/#101/#102)', () => {
  test('Full @pruge scenario: L1 → trust mutation → record measure → phase advance', async () => {
    // Step 1: Init L1 sprint
    let r = await handleSprintAction('init', {
      id: 's1-foundation-e2e',
      name: 'E2E Test',
      trust: 'L1',
      features: 'f1',
    });
    expect(r.ok).toBe(true);
    expect(r.sprint.autoRun.trustLevelAtStart).toBe('L1');

    // Step 2: Phase to do (auto)
    r = await handleSprintAction('phase', { id: 's1-foundation-e2e', to: 'do' });
    expect(r.ok).toBe(true);

    // Step 3: Measure → preview mode (expected, baseline)
    r = await handleSprintAction('measure',
      { id: 's1-foundation-e2e', gate: 'M1' },
      { agentTaskRunner: stubRunner }
    );
    expect(r.results[0].mode).toBe('preview');  // L1 baseline preview

    // Step 4: ✦ Trust mutation (#101 fix)
    r = await handleSprintAction('trust',
      { id: 's1-foundation-e2e', to: 'L3', reason: 'P0 ready' }
    );
    expect(r.ok).toBe(true);
    expect(r.from).toBe('L1');
    expect(r.to).toBe('L3');

    // Step 5: ✦ Measure → record mode (no longer preview)
    r = await handleSprintAction('measure',
      { id: 's1-foundation-e2e', gate: 'M1' },
      { agentTaskRunner: stubRunner }
    );
    expect(r.results[0].mode).toBe('record');   // ✦ #101 + #100 combined fix
    expect(r.trustLevel).toBe('L3');

    // Step 6: ✦ Phase advance now passes gate
    r = await handleSprintAction('phase', { id: 's1-foundation-e2e', to: 'iterate' });
    expect(r.ok).toBe(true);
    expect(r.phase).toBe('iterate');

    // Step 7: Verify audit trail has sprint_trust_changed entry
    const auditEntries = await readAuditLog('sprint_trust_changed');
    expect(auditEntries.length).toBeGreaterThanOrEqual(1);
    expect(auditEntries[0].details.sprintId).toBe('s1-foundation-e2e');
    expect(auditEntries[0].details.from).toBe('L1');
    expect(auditEntries[0].details.to).toBe('L3');
    expect(auditEntries[0].details.actor).toBe('user');  // ✦ CTO §E6 actor 명시 검증
    expect(auditEntries[0].details.noop).toBe(false);    // ✦ CTO §C3 noop:false 검증

    // ✦ Step 8 (CTO §F 권고): process restart 후 sprint.autoRun.trustLevelAtStart 영속
    // — handleTrust 의 stateStore.save가 disk persistence 보장하는지 검증
    const restartedInfra = getInfra({ projectRoot: process.cwd() });  // 새 infra bundle
    const restartedSprint = await restartedInfra.stateStore.load('s1-foundation-e2e');
    expect(restartedSprint.autoRun.trustLevelAtStart).toBe('L3');     // L1 → L3 영속
  });

  test('Alternative path: --trust per-call (#102 fix)', async () => {
    // Same init as above
    await handleSprintAction('init', { id: 's1-alt-e2e', trust: 'L1', features: 'f1' });
    await handleSprintAction('phase', { id: 's1-alt-e2e', to: 'do' });

    // ✦ --trust L3 per-call now honored (#102 fix)
    const r = await handleSprintAction('measure',
      { id: 's1-alt-e2e', gate: 'M1', trust: 'L3' },   // ← --trust, not --trustLevel
      { agentTaskRunner: stubRunner }
    );
    expect(r.trustLevel).toBe('L3');
    expect(r.results[0].mode).toBe('record');
  });
});
```

---

## 6. Migration & Backward Compatibility

| Concern | Strategy |
|---------|----------|
| 기존 sprint state (v2.1.17 이전) | `sprint.autoRun.trustLevelAtStart` schema 무변경 → 마이그레이션 불필요 |
| 기존 `--trustLevel L3` 사용자 | 정확히 동일 동작 (precedence 유지) |
| 기존 audit 로그 (sprint_trust_changed 부재) | 신규 entries만 새 ACTION_TYPE 사용, 기존 entries 무영향 |
| sprint-* agent 호출 시점 | F1 적용 직후 dispatch 정상화 — 별도 마이그레이션 불필요 |
| baseline (v2.1.16/v2.1.17) | ACTION_TYPES +1 → v2.1.18 baseline 신규 캡처 권고 (`scripts/contract-baseline-collect.js --version v2.1.18`) |

---

## 7. Implementation Order (Sprint do Phase)

| Step | 작업 | 파일 | Estimated 시간 |
|------|------|------|---------------|
| 1 | F1-A sprint-orchestrator tools | `agents/sprint-orchestrator.md` | 5분 |
| 2 | F1-B sprint-master-planner tools | `agents/sprint-master-planner.md` | 5분 |
| 3 | F1-C sprint-qa-flow tools | `agents/sprint-qa-flow.md` | 5분 |
| 4 | F1-D sprint-report-writer tools | `agents/sprint-report-writer.md` | 3분 |
| 5 | F1 L3 contract test | `test/contract/sprint-agents-tools.test.js` | 20분 |
| 6 | F2 ACTION_TYPES 추가 | `lib/audit/audit-logger.js` | 10분 |
| 7 | F2 handleTrust 함수 구현 | `scripts/sprint-handler.js` (line 691 이전) | 60분 |
| 8 | F2 dispatch case 'trust' 추가 | `scripts/sprint-handler.js:213` | 5분 |
| 9 | F2 handleTrust unit test | `test/unit/sprint-handler-trust-action.test.js` | 40분 |
| 10 | F2 SKILL.md §10.1.3 추가 | `skills/sprint/SKILL.md` | 30분 |
| 11 | F2 commands/bkit.md 갱신 | `commands/bkit.md` | 5분 |
| 12 | F3 line 721-723 fix | `scripts/sprint-handler.js` | 5분 |
| 13 | F3 line 750-752 fix | `scripts/sprint-handler.js` | 5분 |
| 14 | F3 회귀 test | `test/unit/sprint-trust-normalization.test.js` | 30분 |
| 15 | E2E test | `test/e2e/sprint-l1-lockout-recovery.test.js` | 60분 |
| 16 | qa-aggregate 전체 실행 + 회귀 확인 | (script) | 15분 |
| 17 | CHANGELOG.md v2.1.18 섹션 작성 | `CHANGELOG.md` | 30분 |
| 18 | **baseline v2.1.18 capture (MANDATORY, CTO §G G4)** — Step 17 직후 Step 16 (qa-aggregate) PASS 확인 후 즉시 캡처 | `scripts/contract-baseline-collect.js --version v2.1.18` | 10분 |

**총 예상 시간**: ~5.5시간 (사용자 review 제외).

**Implementation Order Note (CTO §G G2)**: Step 7 (handleTrust 함수) → Step 8 (dispatch case 'trust') → Step 12 (line 721 normalize) → Step 13 (line 750 normalize) 모두 동일 파일 `scripts/sprint-handler.js`. 단일 PR 내 순차 commit (또는 단일 commit 5 sections grouped) 로 merge conflict 회피.

---

## 8. Verification Matrix

| Acceptance Criterion (Plan §8) | Verification 방법 |
|-------------------------------|-----------------|
| F1: 4 sprint-* agents tools 명시 + L3 contract PASS | `node test/contract/sprint-agents-tools.test.js` |
| F2: `/sprint trust` 명령 정상 작동 | E2E test step 4 + unit test |
| F2: audit `sprint_trust_changed` 기록 | E2E test step 7 |
| F2: skill docs §10.1.3 추가 | docs-code-sync 검증 |
| F3: `--trust L<N>` per-call 인식 | E2E test alternative path |
| F3: 회귀 test 6 cases PASS | `node test/unit/sprint-trust-normalization.test.js` |
| E2E: 보고자 시나리오 PASS | `node test/e2e/sprint-l1-lockout-recovery.test.js` |
| qa-aggregate 4103 → 4114+/0 | `npm run qa-aggregate` |
| ADR 0003 14/14 PASS (16-cycle) | `node scripts/contract-test-run.js --baseline v2.1.9` |
| CHANGELOG + Release notes | manual review |
| Issue #100/#101/#102 close | gh issue close 3개 |
| Docs=Code 매치율 ≥ 90% | `node scripts/check-docs-code-sync.js` |

---

## 9. Open Questions (CTO Review 통합, RESOLVED 표시)

1. ✅ **Q1 RESOLVED** — F2 downgrade guardrail 정책: `trustScore >= 80` (from `.bkit/state/trust-profile.json` `trustScore` field, 6 components weighted sum) 또는 `--force` 채택. **Alternative**: CTO §A5 권고 Option 1 (`currentLevel ≤ 1` 시 block, 단일 모델 단순화) — 향후 trust profile 미초기화 사용자 대응 시 재검토 가능.
2. ✅ **Q2 RESOLVED** (CTO §C3) — F2 `from === to` no-op 시 **audit emission 유지** + `details.noop: true` 필드로 mark. 모니터링 사각지대 차단 (자동화 100회 idempotent 호출 패턴 발견 가능).
3. ✅ **Q3 RESOLVED** — F3 Option A 채택 (호출 통일, signature 보존). Option B (signature 확장)는 기존 3 호출 (line 246/291/833) breaking change 우려로 미채택.
4. ✅ **Q4 RESOLVED** (v2.1.17 tracked file policy 일관) — `test/e2e/sprint-l1-lockout-recovery.test.js` 경로 채택. `tests/qa/`는 manual QA 폴더 (v2.1.17 정책상 production test는 `test/` 하위).
5. ✅ **Q5 RESOLVED** (CTO §G G4) — baseline v2.1.18 capture는 **본 sprint 완료 직후 mandatory** (Step 18 격상). 다음 release cycle 직전 옵션 제거.
6. **NEW Q6 (CTO §E6 후속)** — handleTrust 의 `actor` auto-detection을 `CLAUDE_AGENT_ID` 환경변수 외에 `CLAUDE_AGENT_TYPE` 또는 sprint state의 caller record 도 활용할지 — 본 sprint scope는 환경변수 기본 채택, 추가 source는 v2.1.19+ 검토.

---

## 10. References

- Plan: `docs/01-plan/features/v2118-sprint-trust-ux-fix.plan.md`
- GitHub Issues: #100, #101, #102
- 직전 PR 참조: #96 (v2.1.16 issue fixes), #99 (v2.1.17 final)
- Trust Level 정책: SKILL.md §10.2, §11.2 SPRINT_AUTORUN_SCOPE
- ACTION_TYPES: `lib/audit/audit-logger.js:31-90`
- measure-router: `lib/application/quality-gates/measure-router.js:226-279`
- sprint-handler dispatch: `scripts/sprint-handler.js:202-228`
