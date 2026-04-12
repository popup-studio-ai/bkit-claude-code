# v2.1.3 Issue Fixes — QA Report

**Feature**: `v213-issue-fixes`
**QA 일시**: 2026-04-12
**담당**: Full-Auto (L4)

## 실행 테스트 요약

| Level | 테스트 | 결과 |
|---|---|---|
| L1 | 이슈별 단위 재현 검증 (3 issues) | PASS |
| L2 | Node syntax check (3 files) | PASS |
| L2 | Jest full suite (2 suites / 6 tests) | PASS |
| L3 | `claude -p --plugin-dir .` plugin load smoke | PASS |
| L3 | MCP JSON-RPC mock (default + custom config) | PASS |

## L1 — 이슈 재현 검증

### #65 `/pdca qa` actionPattern

**명령**:
```bash
node -e "const re=/pdca\s+(pm|plan|design|do|analyze|iterate|qa|report|status|next)/i; console.log('pdca qa v213'.match(re)[1])"
```

**결과**: `qa` (PASS)

**추가 확인**:
- `nextStepMap.qa` 엔트리 존재 (pdca-skill-stop.js:212-221)
- `phaseMap.qa` 양쪽 위치에 `'qa'` 추가됨
- whitelist 에 `'qa'` 포함됨

### #66 permission-manager TypeError

**명령**:
```bash
node -e "const m=require('./lib/permission-manager.js');
console.log(m.checkPermission('Bash','rm -rf /tmp/x'));
console.log(m.checkPermission('Edit',''));
console.log(m.checkPermission('Bash','git push --force origin main'));
console.log(Object.keys(m.getAllPermissions()).length);"
```

**결과**:
```
deny
allow
deny
8
```

**합격**: TypeError 0건, DEFAULT_PERMISSIONS 기반 deny 규칙 정상 작동.

### #67 MCP docPaths 준수

**Case A — 기본 config (회귀 방지)**:
```bash
node -e "(spawn bkit-pdca-server with default bkit.config.json;
         tools/call bkit_plan_read {feature:'v213-issue-fixes'})"
```
**결과**: `filePath: /Users/.../docs/01-plan/features/v213-issue-fixes.plan.md` (PASS)

**Case B — custom config (핵심 버그 수정)**:
```bash
# /tmp/v213-mcp-test/bkit.config.json 에 docPaths.report = ["docs/custom/{feature}.report.md"]
BKIT_ROOT=/tmp/v213-mcp-test node <spawn bkit-pdca-server>
# tools/call bkit_report_read {feature:'v213-test'}
```
**결과**: `filePath: /tmp/v213-mcp-test/docs/custom/v213-test.report.md` (PASS)

config mtime 기반 캐시 동작 확인, 4개 tool (`plan/design/analysis/report`) 모두 동일 경로 탐색 로직 공유.

## L2 — Syntax + Jest

```
$ node -c scripts/pdca-skill-stop.js          # OK
$ node -c lib/permission-manager.js           # OK
$ node -c servers/bkit-pdca-server/index.js   # OK
$ npx jest --silent
Test Suites: 2 passed, 2 total
Tests:       6 passed, 6 total
```

0 failures, 0 warnings.

## L3 — Plugin load smoke

```bash
$ claude -p --plugin-dir . --output-format json --permission-mode bypassPermissions \
    "Reply with exactly the text OK_V213 and nothing else."
```

**핵심 필드**:
- `is_error: false`
- `permission_denials: []`
- `result: "OK_V213"`
- `terminal_reason: completed`
- `num_turns: 1`
- `duration_ms: 3522`

Plugin 37 skills / 32 agents / 21 hooks 로드 성공, pre-write.js → permission-manager.js require 체인 에러 없음.

## 회귀 위험 분석

| 변경 | 영향 범위 | 회귀 위험 |
|---|---|---|
| pdca-skill-stop.js regex + maps | PDCA state transition | 낮음 — additive (기존 action 모두 보존) |
| permission-manager null guard | pre-write.js hook | 매우 낮음 — 이전엔 throw, 이후엔 DEFAULT 사용 (strict superset) |
| MCP docsPath rewrite | 4개 read tool | 낮음 — default config 회귀 테스트 통과 |

## 종합 판정

**QA_PASS** — 모든 L1~L3 테스트 통과. 0 critical issues. report phase 진행.
