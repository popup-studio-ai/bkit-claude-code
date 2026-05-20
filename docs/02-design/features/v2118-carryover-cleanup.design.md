---
template: design
version: 1.3
feature: v2118-carryover-cleanup
date: 2026-05-20
author: kay
project: bkit
version: 2.1.18
---

# v2118-carryover-cleanup Design Document

> **Summary**: 6 carryover의 구체적 algorithm + schema + 파일 영향 매트릭스. v2.1.17 contract framework의 utility 통일 + MCP/L5 강화 + tracked policy 명문화 + branch protection 자동화.
>
> **Project**: bkit
> **Version**: 2.1.18
> **Author**: kay
> **Date**: 2026-05-20
> **Status**: Draft
> **Planning Doc**: [v2118-carryover-cleanup.plan.md](../01-plan/features/v2118-carryover-cleanup.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | v2.1.17 5축 4/5 close 후 6 carryover 잔존. P0/P1 (Enforcement, tracked policy) 미처리 시 동일 사고 클래스 재발 가능. |
| **WHO** | bkit 메인테이너, 컨트리뷰터, 미래 v2.1.19+ 작업자 |
| **RISK** | util signature mismatch, L5 새 회귀, .gitignore over-exposure, MCP schema backward-compat |
| **SUCCESS** | 5축 5/5 close + qa-aggregate 4103 → 4103+ + 6 CO 모두 명시적 close |
| **SCOPE** | CO-5 → CO-4 → CO-2 → CO-3 → CO-6 → CO-1 → verify → docs → PR |

---

## 1. Overview

### 1.1 Design Goals

- **G1**: Utility duplication 0건 — `lib/util/frontmatter.js` single source
- **G2**: Agent deprecation governance를 isolated test로 보호 — 회귀 즉시 검출
- **G3**: MCP tool deprecation도 Agent 패턴 동등 — manual baseline 우회 불필요
- **G4**: L5 invocation-inventory를 mandatory gate — surface 회귀 차단
- **G5**: tracked file 정책 명문화 — `.gitignore` 위장 결함 영구 차단
- **G6**: Branch protection을 한 줄 명령으로 — `bash scripts/setup-branch-protection.sh`

### 1.2 Design Principles

- **Pure utility module** — `lib/util/frontmatter.js`는 FS 접근 없는 string parser
- **Backward-compat 우선** — MCP deprecation 미선언 시 기존 fail-fast 유지
- **Idempotent automation** — branch protection script 재실행 시 동일 결과
- **Explicit over implicit** — tracked file 정책은 PR checklist에 명시
- **Defense in depth** — L5 mandatory + L4 governance + L1 frontmatter 3중 검사

---

## 2. Architecture

### 2.1 Util Layer 신설

```
lib/
├── util/                              [NEW directory]
│   └── frontmatter.js                 [NEW]
├── application/
├── domain/
├── infra/
├── core/
├── ...
```

Clean Architecture 위치: `lib/util/`은 domain/application 어디서든 require 가능 — purity check 통과.

### 2.2 lib/util/frontmatter.js Schema

```javascript
/**
 * Frontmatter parsing utility — v2.1.18.
 *
 * Centralizes YAML-like frontmatter parsing previously duplicated in 5 sites:
 *   - test/contract/scripts/contract-baseline-collect.js
 *   - test/contract/invocation-inventory.test.js
 *   - tests/qa/bkit-full-system.test.js
 *   - tests/qa/bkit-deep-system.test.js
 *   - lib/infra/docs-code-scanner.js
 *
 * Pure module — no FS access for parsing (FS variants exposed separately).
 *
 * @module lib/util/frontmatter
 * @since 2.1.18
 */

const fs = require('fs');

/** Coerce raw frontmatter scalar to typed value. */
function coerce(v) { /* moved from contract-baseline-collect.js */ }

/** Parse frontmatter from markdown string. Returns key→value object. */
function parseFrontmatter(markdown) { /* moved from contract-baseline-collect.js */ }

/** Parse frontmatter from file path. Wraps fs.readFileSync + parseFrontmatter. */
function parseFrontmatterFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return parseFrontmatter(content);
}

/** Cheap check: does markdown content contain `deprecatedIn: <value>`? */
function hasDeprecatedInFrontmatter(content) {
  if (typeof content !== 'string') return false;
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return false;
  return /^\s*deprecatedIn\s*:\s*\S+/m.test(m[1]);
}

/** Cheap check by file path. */
function hasDeprecatedInFrontmatterFile(filePath) {
  try {
    return hasDeprecatedInFrontmatter(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return false;
  }
}

module.exports = {
  parseFrontmatter,
  parseFrontmatterFile,
  hasDeprecatedInFrontmatter,
  hasDeprecatedInFrontmatterFile,
  coerce,
};
```

### 2.3 5 Site Refactor 매트릭스

| Site | Before | After |
|------|--------|-------|
| `test/contract/scripts/contract-baseline-collect.js` | 자체 정의 + module.exports | `const { parseFrontmatter, coerce } = require('../../../lib/util/frontmatter');` |
| `test/contract/invocation-inventory.test.js` | inline regex `hasDeprecatedInFrontmatter` | `const { hasDeprecatedInFrontmatterFile } = require('../../lib/util/frontmatter');` |
| `tests/qa/bkit-full-system.test.js` | local `parseFrontmatter` | `const { parseFrontmatterFile } = require('../../lib/util/frontmatter');` |
| `tests/qa/bkit-deep-system.test.js` | local `parseFm` | `const { parseFrontmatterFile } = require('../../lib/util/frontmatter');` |
| `lib/infra/docs-code-scanner.js` | inline `hasDeprecatedInFrontmatter` | `const { hasDeprecatedInFrontmatter } = require('../util/frontmatter');` |

각 site의 호출 부분 변경 최소화. 외부 동작은 동일.

---

## 3. CO-4: agent-deprecation isolated unit test

### 3.1 Test scenarios

```javascript
// test/contract/agent-deprecation.test.js

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const RUNNER = path.join(PROJECT_ROOT, 'test/contract/scripts/contract-test-run.js');

// === Helper: 격리된 fixture로 runner 실행 ===
function runRunnerWithFixture(fixtureDir, expectedExit) {
  // fixture에는 agents/, baseline/ 디렉터리 포함
  const env = { ...process.env, BKIT_PROJECT_ROOT_OVERRIDE: fixtureDir };
  const r = spawnSync('node', [RUNNER, '--compare', 'fixture', '--level', 'L4'], {
    cwd: fixtureDir, env, encoding: 'utf8',
  });
  return r;
}

// === Scenario 1: Positive — stub with deprecatedIn passes L4 ===
test('L4 passes when deprecated stub exists with deprecatedIn', () => {
  // fixture: baseline에 'old-agent' 등록, agents/old-agent.md에 deprecatedIn 명시
  const r = runRunnerWithFixture(fixtures.positive, 0);
  assert.equal(r.status, 0, `Expected PASS, got: ${r.stderr}`);
});

// === Scenario 2: Negative — missing stub fails ===
test('L4 fails when baseline agent removed without stub', () => {
  // fixture: baseline에 'gone-agent' 등록, agents/gone-agent.md 없음
  const r = runRunnerWithFixture(fixtures.missingStub, 1);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /L4 FAIL agent 'gone-agent'/);
});

// === Scenario 3: Negative — stub exists but no deprecatedIn ===
test('L4 fails when stub exists without deprecatedIn frontmatter', () => {
  const r = runRunnerWithFixture(fixtures.noDeprecatedIn, 1);
  assert.notEqual(r.status, 0);
});

// === Scenario 4: Edge — stub with deprecatedIn but L1 model mismatch ===
test('L1 fails when stub model differs from baseline model', () => {
  const r = runRunnerWithFixture(fixtures.modelMismatch, 1, '--level L1,L4');
  assert.match(r.stderr, /L1-AG FAIL.*model/);
});

// === Scenario 5: Edge — MCP tool deprecation (baseline JSON-based) ===
test('L4 passes for MCP tool with baseline deprecatedIn field', () => {
  const r = runRunnerWithFixture(fixtures.mcpDeprecation, 0);
  assert.equal(r.status, 0);
});
```

### 3.2 Fixture 구조

```
test/contract/fixtures/agent-deprecation/
├── positive/
│   ├── agents/old-agent.md          # frontmatter: deprecatedIn: v1.0.0
│   ├── test/contract/baseline/fixture/
│   │   ├── _MANIFEST.json
│   │   └── agents/old-agent.json
│   └── (minimal)
├── missing-stub/
│   └── (agents/old-agent.md 없음)
├── no-deprecated-in/
│   └── agents/old-agent.md          # deprecatedIn 미선언
├── model-mismatch/
│   └── agents/old-agent.md          # model: opus, baseline: sonnet
└── mcp-deprecation/
    └── (MCP server stub + baseline)
```

### 3.3 Runner 환경변수 override

현재 `contract-test-run.js`의 `PROJECT_ROOT`는 hard-coded. fixture를 사용하려면 override 메커니즘 필요.

**Option A**: 환경변수 `BKIT_PROJECT_ROOT_OVERRIDE` 도입 — minimal change
**Option B**: CLI flag `--project-root <path>` — 더 명시적

**Selected**: Option B (CLI flag) — 환경변수보다 명시적이고 test에서 사용 용이.

```javascript
// contract-test-run.js 상단
const projectRootArg = arg('--project-root', null);
const PROJECT_ROOT = projectRootArg
  ? path.resolve(projectRootArg)
  : path.resolve(__dirname, '..', '..', '..');
```

---

## 4. CO-2: MCP tool deprecation schema

### 4.1 Deprecation 주석 형식 (server `index.js` 안)

```javascript
// Tool definition in MCP server (servers/bkit-pdca/index.js 등)
{
  name: 'bkit_old_tool',
  description: 'Old tool',
  // @deprecated since v2.1.13 replacedBy=bkit_new_tool reason="superseded"
  inputSchema: { ... },
  handler: () => { throw new Error('DEPRECATED'); },
}
```

### 4.2 collectMCPTools 파싱 확장

```javascript
function collectMCPTools(opts = {}) {
  const { persist = true, baseDir = BASE_DIR } = opts;
  ...
  for (const server of servers) {
    ...
    const source = fs.readFileSync(indexPath, 'utf8');
    const tools = parseMCPToolBlocks(source); // NEW: 블록 단위 파싱
    for (const tool of tools) {
      const projected = {
        server,
        name: tool.name,
        // v2.1.18: deprecation metadata
        deprecatedIn: tool.deprecatedIn || null,
        replacedBy: tool.replacedBy || null,
      };
      if (persist) {
        writeJSON(path.join(baseDir, 'mcp-tools', server, `${tool.name}.json`), projected);
      }
    }
    ...
  }
}

/**
 * Parse tool definition blocks from MCP server source.
 * Each block must have a `name: '<id>'` line, optionally preceded by
 * `// @deprecated since vX.X.X replacedBy=Y reason="..."`.
 */
function parseMCPToolBlocks(source) {
  // Match: `// @deprecated since vX.X.X (...)` immediately before `name: '<tool>'`
  // Use windowed regex over source lines.
  ...
}
```

### 4.3 Backward-compat

기존 baseline JSON (v2.1.16/) 에는 `{ server, name }`만 있음. 새 collection은 `deprecatedIn: null, replacedBy: null` 추가. 기존 L4 검사는 baseline JSON의 `deprecatedIn` 존재 여부만 확인 — null이면 fail (v2117과 동일 동작).

---

## 5. CO-3: L5 E2E mandatory 승격

### 5.1 Workflow 변경 (diff)

```yaml
  contract-l5-e2e:
    name: Contract Test L5 (Invocation Inventory)   # name 변경: "관찰 전용" 제거
    runs-on: ubuntu-latest
    needs: contract-l1-l4                            # NEW: dependency
    # continue-on-error: true                        # REMOVED
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: L5 smoke (static inventory)
        run: |
          if [ -f test/contract/invocation-inventory.test.js ]; then
            node test/contract/invocation-inventory.test.js
          else
            echo "L5 not yet implemented"
            exit 1                                   # NEW: explicit fail
          fi
```

### 5.2 사전 검증

`node test/contract/invocation-inventory.test.js` 로컬 실행 → 203/203 PASS 확인 후 적용.

### 5.3 의존성 — needs: contract-l1-l4

L1+L4 실패 시 L5 skip. L5 자체는 정적 inventory 검사라 L1+L4 통과 후 의미 있음. CI 시간 절약 + clear failure 흐름.

---

## 6. CO-6: Tracked file policy

### 6.1 .gitignore narrow화

**Before**:
```
test/
tests/*
```

**After**:
```
# Test directories — narrow ignore to manual-only paths
# Production test infrastructure (test/contract/, test/unit/, tests/qa/, tests/contract/) is tracked.
test/manual/
test/local/
tests/manual/

# Force-include legacy tracked patterns (kept for backward-compat)
!test/contract/
!test/contract/**
!tests/contract/
!tests/contract/**
```

이렇게 하면 `test/contract/`, `test/unit/`, `tests/qa/`, `tests/contract/` 모두 default tracked.

### 6.2 잔여 untracked 파일 force-add

```bash
# 검증 후 일괄 추가
git add -f tests/qa/*.test.js
git add -f test/contract/*.test.js
git ls-files tests/qa/ | wc -l    # Before: 2, After: 33
git ls-files test/contract/ | wc -l  # Before: ~30, After: ~37
```

### 6.3 PR self-review 체크리스트 (`docs/06-guide/test-file-tracking-policy.guide.md`)

```markdown
## 신규 test 파일 추가 시 체크리스트

- [ ] `git status` 에 test 파일이 staged
- [ ] `git ls-files <new-file>` 으로 tracked 확인
- [ ] workflow에서 직접 실행하는 파일인지 확인 (`.github/workflows/*.yml` grep)
- [ ] qa-aggregate scan 디렉터리에 포함되는지 확인
- [ ] CI runner 환경에서 fetch 가능 여부 검증

## .gitignore에 새 패턴 추가 시

- [ ] 변경 전후 `git ls-files | wc -l` 비교
- [ ] 예상치 못한 unstaged file 발생 여부 확인
- [ ] 영향받는 디렉터리에 대해 명시적 negate 패턴 검토
```

---

## 7. CO-1: Branch protection script

### 7.1 scripts/setup-branch-protection.sh

```bash
#!/usr/bin/env bash
# Set up main branch protection for bkit repository.
# Idempotent: re-run produces identical state.
# Usage:
#   bash scripts/setup-branch-protection.sh [--dry-run] [--apply]
#
# Required: gh CLI authenticated with admin role on popup-studio-ai/bkit-claude-code.

set -euo pipefail

REPO="popup-studio-ai/bkit-claude-code"
BRANCH="main"
DRY_RUN=true

for arg in "$@"; do
  case "$arg" in
    --apply) DRY_RUN=false ;;
    --dry-run) DRY_RUN=true ;;
  esac
done

# Required status checks (from .github/workflows/contract-check.yml job names)
CONTEXTS=(
  "Contract Test (L1 Frontmatter + L4 Deprecation)"
  "Contract Test L5 (Invocation Inventory)"  # post-v2118 (was 관찰 전용)
)

# Build JSON payload
PAYLOAD=$(jq -n \
  --argjson contexts "$(printf '%s\n' "${CONTEXTS[@]}" | jq -R . | jq -s .)" \
  '{
    required_status_checks: {
      strict: true,
      contexts: $contexts
    },
    enforce_admins: false,
    required_pull_request_reviews: null,
    restrictions: null,
    allow_force_pushes: false,
    allow_deletions: false
  }')

if $DRY_RUN; then
  echo "[dry-run] Would PUT /repos/${REPO}/branches/${BRANCH}/protection with:"
  echo "$PAYLOAD" | jq .
  echo ""
  echo "Run with --apply to execute."
else
  echo "[apply] Setting branch protection for ${BRANCH}..."
  echo "$PAYLOAD" | gh api -X PUT "/repos/${REPO}/branches/${BRANCH}/protection" --input -
  echo "✓ Branch protection applied."
fi
```

### 7.2 가이드 (`docs/06-guide/branch-protection-setup.guide.md`)

내용:
- Background — 5/12 ~ 5/20 사고의 Enforcement 결함
- Script 사용법 (dry-run + apply)
- Required Status Checks 목록 + 추가/제거 방법
- Admin override 정책 (`--admin` 사용 시점)
- bkit Maintainer만 실행 (Token scope: `repo` admin)

---

## 8. Implementation Order

각 stage 종료 시 verify-all.sh 실행으로 회귀 검증.

1. **Stage A — CO-5 util 추출**: `lib/util/frontmatter.js` 신설, 5 site refactor, verify
2. **Stage B — CO-4 isolated test**: `contract-test-run.js` `--project-root` flag, fixture 6개, test 신설
3. **Stage C — CO-2 MCP schema**: `parseMCPToolBlocks` 추가, baseline JSON 형식 검증
4. **Stage D — CO-3 L5 mandatory**: workflow yaml 변경, 사전 dry-run
5. **Stage E — CO-6 tracked policy**: `.gitignore` 변경, 잔여 force-add, 가이드 작성
6. **Stage F — CO-1 branch protection**: script + 가이드 (실행은 user)
7. **Stage G — 전체 검증**: verify-all.sh + qa-aggregate + L5 mandatory
8. **Stage H — 문서**: Analysis + Report
9. **Stage I — PR**: feature/v2118-carryover-cleanup

---

## 9. Edge Cases & Defensive Design

| Edge case | Handling |
|-----------|----------|
| `lib/util/frontmatter.js` require 경로가 5 site별로 다름 | 명시적 경로 (`../../lib/util/frontmatter`) — symlink 미사용 |
| MCP deprecation 주석이 multiline | regex가 single-line 처리. multi-line은 separate 주석으로 분리 |
| L5 mandatory 승격 후 NEW 회귀 | 사전 dry-run + 첫 PR에서 검출 시 분리 처리 |
| `.gitignore` narrow화로 build artifact 노출 | tests/qa/, test/contract/ 외 디렉터리 영향 없음 (test-scripts/ 등은 그대로 ignore) |
| Untracked file force-add 시 sensitive content | 추가 전 각 파일 head 5 lines 검증 |
| branch protection script가 기존 정책 overwrite | --dry-run 기본, --apply는 명시적 |
| `--project-root` flag로 다른 BASE_DIR 접근 시 baseline manifest 부재 | runner의 loadBaselineManifest가 fail-fast (`Baseline manifest missing`) — fixture에 manifest 포함 필수 |

---

## 10. Quality Gates

| Gate | Criteria | Tool |
|------|----------|------|
| G1: util refactor 회귀 없음 | 5 site 모두 PASS, qa-aggregate 동일 또는 증가 | verify-all.sh |
| G2: agent-deprecation isolated test 통과 | 5+ scenario PASS | `node test/contract/agent-deprecation.test.js` |
| G3: MCP deprecation backward-compat | v2.1.16 baseline 비교 PASS | `--compare v2.1.16 --level L1,L4` |
| G4: L5 mandatory 통과 | 203 TC PASS | `node test/contract/invocation-inventory.test.js` |
| G5: tracked file 일관성 | `git ls-files tests/qa/ \| wc -l` ≥ 30 | manual check |
| G6: branch protection script idempotent | dry-run 2회 동일 출력 | diff |
| G7: domain purity | 18 + 1 (lib/util/frontmatter.js) = 19 files, 0 forbidden | `check-domain-purity.js` |
| G8: docs-code-sync | counts consistent | `docs-code-sync.js` |
| G9: qa-aggregate | 4103 → 4103+ TC, 0 FAIL | `qa-aggregate.js` |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-20 | Initial design — 6 CO closure plan | kay |
