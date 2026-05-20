---
template: design
version: 1.3
feature: v2117-ci-cd-hardening
date: 2026-05-20
author: kay
project: bkit
version: 2.1.17
---

# v2117-ci-cd-hardening Design Document

> **Summary**: Agent/MCP tool deprecation governance 신설 + Dual baseline (v2.1.9 LTS + v2.1.16 Latest) + L2/L3 workflow 통합 + rollforward SOP. 5/12 누적 사고의 5축 매트릭스 close.
>
> **Project**: bkit
> **Version**: 2.1.17 (target)
> **Author**: kay
> **Date**: 2026-05-20
> **Status**: Draft
> **Planning Doc**: [v2117-ci-cd-hardening.plan.md](../01-plan/features/v2117-ci-cd-hardening.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 2026-05-12 `967cd8f`에서 6 agent 제거 → 베이스라인 contract test가 무조건 fail. 8일 누적, v2.1.15/v2.1.16 GA가 red인 채 릴리스. 근본 원인 2개: ① Agent에 `deprecatedIn` governance 부재, ② Baseline rollforward SOP 부재 |
| **WHO** | bkit 메인테이너 (release 신뢰성), 컨트리뷰터 (CI feedback 정확성), 미래 v2.1.17+ 작업자 (deprecation governance 강제) |
| **RISK** | (1) v2.1.16 baseline 캡처 시 dependency drift 흡수 → dual 비교로 보호. (2) deprecation stub L1 frontmatter fail 가능 → 최소 필드 보장. (3) L2/L3 통합 시 기존 회귀 노출 → 로컬 dry-run |
| **SUCCESS** | (a) workflow green. (b) v2.1.9 + v2.1.16 dual 비교 PASS. (c) Agent `deprecatedIn` 우회 unit test PASS. (d) L2/L3 통합. (e) SOP 가이드 작성. (f) 5축 중 4축 close |
| **SCOPE** | Plan → Design → governance code → 6 stub → v2.1.16 baseline → SOP → workflow → dry-run → Analysis → Report → PR |

---

## 1. Overview

### 1.1 Design Goals

- **G1**: L4 Deprecation 분기에서 Agent/MCP tool도 Skill과 동일 `deprecatedIn` 우회 — 거버넌스 비대칭 해소
- **G2**: Baseline 갱신을 명시적 SOP 기반 결정으로 정형화 — 우연적 self-test 전락 방지
- **G3**: Contract test의 정적 검사(L1+L4) 외에 런타임 검사(L2+L3)도 push gate에 포함 — 회귀 검출 양면화
- **G4**: 5/12 사고의 6 agent 제거를 영구 기록 — 미래 archeology + 거버넌스 강제 실증

### 1.2 Design Principles

- **Backward compatibility**: 기존 baseline v2.1.9 형식 변경 없음. 신규 `deprecatedIn` 필드는 옵셔널.
- **Symmetry**: Skill ↔ Agent ↔ MCP tool 세 종류 모두 동일 deprecation 메커니즘 — `parseFrontmatter` 재사용.
- **Single Source of Truth**: deprecation 정보는 stub MD frontmatter에만. 별도 JSON registry 없음 (중복 방지).
- **Explicit over Implicit**: baseline rollforward는 SOP 결정 기반. 자동 갱신 금지.
- **Defensive layering**: Static (L1+L4) + Runtime (L2+L3) 동시 검사.

---

## 2. Architecture Options

### 2.0 Architecture Comparison

| Criteria | Option A: Stub Only | Option B: Dual + Stub + L2/L3 | Option C: Registry JSON |
|----------|:-:|:-:|:-:|
| **Approach** | 6개 agent stub만 작성, baseline 유지 | Plan §2.1 P1~P5 전체 | 별도 `agents/_deprecated.json` registry |
| **New Files** | 6 stub | 6 stub + 1 baseline dir + 1 guide + 1 test | 1 registry + 6 entries |
| **Modified Files** | 0 | 3 (contract-test-run.js, collect.js, workflow.yml) | 2 (contract-test-run.js, collect.js) |
| **거버넌스 비대칭 해소** | Agent만 | Agent + MCP | Agent만 |
| **Drift 윈도우** | LTS 1개 | LTS + Latest 2개 | LTS 1개 |
| **L2/L3 통합** | ❌ | ✅ | ❌ |
| **SOP 문서화** | ❌ | ✅ | ❌ |
| **Complexity** | Low | Medium | Medium |
| **Effort** | XS (1h) | M (4-5h) | S (2h) |
| **Recommendation** | Quick fix only | **Default — user 요구 "근본적, 꼼꼼하고 완벽하게"** | If MD frontmatter 한계 발생 |

**Selected**: Option B (Dual + Stub + L2/L3). 5축 매트릭스 close가 본 PDCA 목적.

---

## 3. Detailed Design

### 3.1 Agent Deprecation Schema

#### 3.1.1 Frontmatter Schema

```yaml
---
name: pdca-eval-act
description: |
  DEPRECATED — removed in v2.1.13 dead code cleanup (commit 967cd8f).
  Use report-generator + pdca-iterator for the equivalent flow.
deprecatedIn: v2.1.13
deprecatedReason: dead code cleanup — pdca eval agents were superseded by report-generator
replacedBy: report-generator
deprecationCommit: 967cd8f
---
```

| Field | Type | Required | Purpose |
|-------|------|:-:|---------|
| `name` | string | ✅ | L1-AG name match (baseline v2.1.9 fileName과 일치 필수) |
| `description` | string | ✅ | L1-AG description (CC cap 1536자 이내) |
| `deprecatedIn` | string | ✅ | L4 우회 trigger — `vX.X.X` 형식 |
| `deprecatedReason` | string | ⚠️권장 | governance documentation |
| `replacedBy` | string | ⚠️권장 | 마이그레이션 경로 |
| `deprecationCommit` | string | ⚠️권장 | git archeology |
| `model` | (omit) | ❌ | stub는 실행되지 않으므로 model 미선언 — L1-AG baseline.model이 null이면 통과 |
| `tools` | (omit) | ❌ | 동일 — baseline.hasTools가 false이면 통과 |

#### 3.1.2 v2.1.9 Baseline의 6 agent metadata 확인

```bash
# Pre-implementation check
cat test/contract/baseline/v2.1.9/agents/pdca-eval-act.json
```

만약 baseline JSON에 `model: "opus"`, `hasTools: true` 가 있다면 stub도 동일 필드 명시 필수. 미리 캡처 단계에서 확인.

### 3.2 contract-test-run.js Algorithm Diff

#### 3.2.1 현재 (BEFORE) — `:197-203`

```javascript
// Agents
const currentAgents = collectAgents();
for (const agentName of manifest.agents.names) {
  if (!currentAgents.names.includes(agentName)) {
    assert(false, `L4 FAIL agent '${agentName}' removed (check deprecation)`);
  }
}
```

#### 3.2.2 변경 후 (AFTER)

```javascript
// Agents — Skills 패턴과 동일하게 deprecatedIn frontmatter 우회 지원
const currentAgents = collectAgents();
for (const agentName of manifest.agents.names) {
  if (!currentAgents.names.includes(agentName)) {
    const baselineFile = path.join(BASE_DIR, 'agents', `${agentName}.json`);
    const baselineMeta = fs.existsSync(baselineFile)
      ? JSON.parse(fs.readFileSync(baselineFile, 'utf8'))
      : {};
    const agentMd = path.join(
      PROJECT_ROOT,
      'agents',
      `${baselineMeta.fileName || agentName}.md`
    );
    let deprecated = false;
    if (fs.existsSync(agentMd)) {
      const fm = parseFrontmatter(fs.readFileSync(agentMd, 'utf8'));
      deprecated = !!fm.deprecatedIn;
    }
    assert(
      deprecated,
      `L4 FAIL agent '${agentName}' missing from current without deprecatedIn declaration`
    );
  }
}
```

#### 3.2.3 MCP tool 분기도 동일 패턴 (`:204-213`)

```javascript
// MCP tools — agent와 동일 deprecation 메커니즘
const currentMCP = collectMCPTools();
for (const [server, tools] of Object.entries(manifest.mcpTools.servers || {})) {
  const currentTools = (currentMCP.servers && currentMCP.servers[server]) || [];
  for (const tn of tools) {
    if (!currentTools.includes(tn)) {
      // Check for deprecation marker in baseline mcp-tools JSON
      const baselineToolFile = path.join(BASE_DIR, 'mcp-tools', server, `${tn}.json`);
      let deprecated = false;
      if (fs.existsSync(baselineToolFile)) {
        const meta = JSON.parse(fs.readFileSync(baselineToolFile, 'utf8'));
        deprecated = !!meta.deprecatedIn;
      }
      assert(
        deprecated,
        `L4 FAIL MCP tool '${server}.${tn}' missing from current without deprecatedIn declaration`
      );
    }
  }
}
```

**Note**: MCP tool은 stub MD 개념이 없으므로 baseline JSON 자체에 `deprecatedIn` 필드를 명시하는 방식. 캡처 시점에 MCP server `index.js` 파싱 단계에서 deprecation 주석을 인식하는 후속 작업(별도 PDCA) 가능. 본 PDCA에서는 backward-compat 분기만 추가.

### 3.3 contract-baseline-collect.js — `deprecatedIn` 캡처

#### 3.3.1 collectAgents 확장

```javascript
const projected = {
  name: fm.name || baseName,
  fileName: baseName,
  model: fm.model || null,
  effort: fm.effort || null,
  hasTools: fm.tools !== undefined,
  descriptionLength: typeof fm.description === 'string' ? fm.description.length : 0,
  // NEW v2117: deprecation metadata
  deprecatedIn: fm.deprecatedIn || null,
  replacedBy: fm.replacedBy || null,
};
```

#### 3.3.2 collectSkills 확장 (대칭성)

```javascript
const projected = {
  name: fm.name || name,
  dirName: name,
  effort: fm.effort || null,
  context: fm.context || null,
  userInvocable: fm['user-invocable'] !== undefined ? fm['user-invocable'] : null,
  descriptionLength: typeof fm.description === 'string' ? fm.description.length : 0,
  // NEW v2117: deprecation metadata
  deprecatedIn: fm.deprecatedIn || null,
  replacedBy: fm.replacedBy || null,
};
```

### 3.4 Dual Baseline Workflow Flow

```
[push or PR]
     │
     ▼
┌─────────────────────────────────────────┐
│ contract-l1-l4 job                      │
├─────────────────────────────────────────┤
│ 1. checkout                             │
│ 2. setup-node@20                        │
│ 3. show working tree                    │
│ 4. domain purity                        │
│ 5. L1+L4 vs v2.1.9 (LTS) ◄─ drift 추적  │
│ 6. L1+L4 vs v2.1.16 (Latest) ◄─ noise   │  [신규]
│ 7. guard registry                       │
│ 8. docs=code sync                       │
│ 9. dead code                            │
│ 10. integration runtime                 │
│ 11. L2 smoke ◄────────────────────────  │  [신규]
│ 12. L2 hook attribution ◄─────────────  │  [신규]
│ 13. L3 MCP compat ◄───────────────────  │  [신규]
│ 14. L3 MCP runtime ◄──────────────────  │  [신규]
│ 15. qa-aggregate                        │
│ 16. release gate (bkit-full-system)     │
│ 17. release gate (docs-code-sync)       │
└─────────────────────────────────────────┘
     │
     ▼
[green → merge eligible]
```

### 3.5 Baseline Rollforward 의사결정 트리

```
┌──────────────────────────────────────────┐
│ Q1: 새 baseline을 캡처해야 하는가?       │
└──────────────────┬───────────────────────┘
                   │
        ┌──────────┴───────────┐
       Yes                     No
        │                       │
        ▼                       ▼
┌────────────────────┐   ┌──────────────────┐
│ Q2: LTS인가 Latest │   │ 현재 baseline    │
│ 인가?              │   │ 유지             │
└──────┬─────────────┘   └──────────────────┘
       │
   ┌───┴────┐
  LTS      Latest
   │        │
   ▼        ▼
┌─────┐  ┌─────────────────────────────┐
│ 새  │  │ test/contract/baseline/     │
│ LTS │  │ vX.X.X/ 추가 (workflow는    │
│ tag │  │ 기존 LTS 비교 유지)         │
│ 결정│  └─────────────────────────────┘
│ 필요│
└──┬──┘
   │
   ▼
┌──────────────────────────┐
│ workflow --compare 인자  │
│ 변경: vX.X.X → 새 LTS    │
└──────────────────────────┘
```

**규칙**:
1. **Latest baseline 캡처는 PDCA 종료 시점에 작업자가 결정** — 자동화 금지.
2. **LTS baseline 변경은 메이저 LTS 지정 시점에만** — bkit의 경우 v2.1.x line 내에서는 v2.1.9 유지, v2.2.0 LTS 지정 시 이동.
3. **deprecation stub은 LTS baseline에서는 사라진 후에도 stub만 남으면 통과** — Latest baseline에서는 stub도 surface에 포함되어 캡처됨.
4. **Latest baseline은 1 minor 단위로 캡처 권장** — 너무 빈번하면 self-test 전락.

### 3.6 L2/L3 통합 위치

#### 3.6.1 기존 test 파일 인벤토리

| Layer | Test file | Purpose |
|-------|-----------|---------|
| L1 | (none, runner inline) | Frontmatter schema |
| L2 | `test/contract/l2-smoke.test.js` | Skill 호출 smoke |
| L2 | `test/contract/l2-hook-attribution.test.js` | Hook event attribution |
| L3 | `test/contract/l3-mcp-compat.test.js` | MCP protocol compat |
| L3 | `test/contract/l3-mcp-runtime.test.js` | MCP server runtime |
| L4 | (runner inline) | Deprecation detection |
| L5 | `test/contract/invocation-inventory.test.js` | Static inventory (observational) |

#### 3.6.2 workflow.yml 변경 (diff)

```yaml
      - name: L1 Frontmatter Schema + L4 Deprecation (CI Gate vs LTS baseline)
        run: node test/contract/scripts/contract-test-run.js --compare v2.1.9 --level L1,L4

      # NEW v2117: dual baseline — Latest snapshot (noise floor)
      - name: L1+L4 vs v2.1.16 Latest baseline (drift detection)
        run: node test/contract/scripts/contract-test-run.js --compare v2.1.16 --level L1,L4

      # ... existing steps ...

      - name: Runtime Integration Tests (Sprint 4.5)
        run: node test/contract/integration-runtime.test.js

      # NEW v2117: L2 + L3 layer tests
      - name: L2 Smoke (skill invocation)
        run: node test/contract/l2-smoke.test.js

      - name: L2 Hook Attribution
        run: node test/contract/l2-hook-attribution.test.js

      - name: L3 MCP Compatibility (protocol)
        run: node test/contract/l3-mcp-compat.test.js

      - name: L3 MCP Runtime (server lifecycle)
        run: node test/contract/l3-mcp-runtime.test.js
```

### 3.7 Unit Test (agent-deprecation.test.js)

```javascript
// test/contract/agent-deprecation.test.js
// Verify L4 Agent deprecation governance:
// (1) Agent missing from current + baseline says present + stub has deprecatedIn → PASS
// (2) Agent missing from current + baseline says present + no stub → FAIL
// (3) Agent missing from current + stub has no deprecatedIn → FAIL

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

function runRunner(env = {}) {
  const result = spawnSync(
    'node',
    [path.join('test', 'contract', 'scripts', 'contract-test-run.js'),
     '--compare', 'v2.1.9', '--level', 'L4'],
    { cwd: PROJECT_ROOT, env: { ...process.env, ...env }, encoding: 'utf8' }
  );
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

// Test (1): with deprecation stubs present, L4 should pass for pdca-eval-*
const r = runRunner();
assert.equal(r.code, 0, `L4 should pass when deprecation stubs exist: ${r.stderr}`);

console.log('[agent-deprecation] ✓ Test 1 PASS');
process.exit(0);
```

추가 negative test는 fixture 디렉터리 + 임시 baseline으로 검증 (별도 후속).

---

## 4. SOP Guide Outline (`docs/06-guide/contract-baseline-rollforward.guide.md`)

```markdown
# Contract Baseline Rollforward 가이드

## 1. Baseline이란?
## 2. LTS vs Latest 정책
## 3. 의사결정 트리 (when to rollforward)
## 4. Baseline 캡처 절차 (step-by-step)
## 5. workflow.yml 변경 절차
## 6. Deprecation stub 작성 절차
## 7. Checklist (PR 전 self-review)
## 8. 사고 기록 (5/12 ~ 5/20 사례)
```

(상세 내용은 P4 단계에서 작성)

---

## 5. Implementation Order

1. **Stage A — 거버넌스 (P1)**: `contract-baseline-collect.js` → `contract-test-run.js` 수정. 동시 commit.
2. **Stage B — Stub 작성 (P2)**: `agents/pdca-eval-*.md` 6 file. baseline JSON 확인 후 model/hasTools 필드 결정.
3. **Stage C — v2.1.16 Baseline 캡처 (P3)**: `node test/contract/scripts/contract-baseline-collect.js --version v2.1.16` 실행. 결과물 git diff 검토.
4. **Stage D — SOP 가이드 (P4)**: `docs/06-guide/` 한국어 작성.
5. **Stage E — Workflow 통합 (P5)**: `.github/workflows/contract-check.yml` step 5개 추가.
6. **Stage F — 검증 (P6)**: 로컬 dry-run, agent-deprecation.test.js, qa-aggregate.
7. **Stage G — 문서 (P7)**: Analysis + Report.
8. **Stage H — PR**: feature branch push, gh pr create.

각 stage 종료 시 `node test/contract/scripts/contract-test-run.js --compare v2.1.9 --level L1,L4` 자체 verification.

---

## 6. Edge Cases & Defensive Design

| Edge case | 처리 |
|-----------|------|
| stub에 description 미존재 | parseFrontmatter는 `undefined` 반환 → L1-AG는 baseline.descriptionLength=0이면 skip → 통과. 그러나 안전을 위해 description 필수 포함. |
| stub fileName mismatch | baseline.fileName !== stub 파일명 시 path 불일치. fileName 매칭은 baseline JSON 기준 — stub 작성 시 baseline의 fileName 그대로 사용. |
| baseline v2.1.16에 stub 6개 포함됨 | 차후 stub 제거 시 v2.1.16 비교에서 fail. SOP에 "stub은 deletion 전 deprecatedIn → tombstoneRemoval 단계 필요" 명시. |
| `parseFrontmatter` multi-line value | 단일 string 한정 — `replacedBy` 단일 값만. 복수 대안은 description body에 기술. |
| L1-AG가 stub model field 누락에 fail | baseline.model이 null이면 L1-AG model 검사 skip. v2.1.9 baseline의 6 agent JSON 확인 필요 (Stage A 전에). |
| Workflow 중복 (v2.1.9 + v2.1.16 둘 다 동일 fail) | 둘 다 fail 메시지로 표시 — 의도된 동작. red 원인 명확화. |

---

## 7. Quality Gates

| Gate | Criteria | Tool |
|------|----------|------|
| G1: L4 Agent governance 동작 | stub 6개 만으로 L4 PASS | `contract-test-run.js --compare v2.1.9 --level L4` |
| G2: L4 LTS 비교 | v2.1.9 비교 PASS | `--compare v2.1.9 --level L1,L4` |
| G3: L4 Latest 비교 | v2.1.16 비교 PASS | `--compare v2.1.16 --level L1,L4` |
| G4: L2 smoke 통과 | 기존 skill 호출 회귀 없음 | `node test/contract/l2-smoke.test.js` |
| G5: L3 MCP 통과 | MCP server 회귀 없음 | `node test/contract/l3-mcp-compat.test.js` + `l3-mcp-runtime.test.js` |
| G6: qa-aggregate FAIL 회귀 없음 | v2.1.16 결과 (31 expected) 유지 또는 감소 | `node test/contract/scripts/qa-aggregate.js` |
| G7: bkit-full-system 영향 없음 | agent count drift 없음 | `node tests/qa/bkit-full-system.test.js` |
| G8: domain purity | 영향 없음 | `node scripts/check-domain-purity.js` |
| G9: docs=code sync | docs-code-invariants SoT 갱신 (agent count 영향 시) | `node scripts/docs-code-sync.js` |

모든 gate 통과 후 PR 생성.

---

## 8. Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-20 | Initial design after Plan approval | kay |
