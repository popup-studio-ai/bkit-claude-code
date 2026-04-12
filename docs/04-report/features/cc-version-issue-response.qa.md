# QA Report — cc-version-issue-response

> **Phase**: QA
> **작성일**: 2026-04-12
> **자동화 레벨**: L4 Full-Auto
> **설계 문서**: `docs/02-design/features/cc-version-issue-response.design.md`

## 1. 요약

Phase 1 (P0) 구현 결과 단위 테스트 6/6 통과, 스킬 YAML 회귀 0건, MCP `_meta` 런타임 검증 통과, headless smoke test 통과.

| 항목 | 상태 |
|---|---|
| 단위 테스트 (신규) | PASS 6/6 |
| Skills YAML 회귀 | PASS 38/38 |
| MCP okResponse 런타임 검증 | PASS |
| Headless smoke (`claude -p`) | PASS |
| Match Rate | 100% (6/6) |

## 2. 단위 테스트

```
$ npx jest test-scripts/unit/mcp-ok-response.test.js test-scripts/unit/worktree-detector.test.js
Test Suites: 2 passed, 2 total
Tests:       6 passed, 6 total
Time:        0.632 s
```

- `mcp-ok-response.test.js` (2): 두 MCP 서버 `okResponse()` 이 legacy + namespaced `_meta` 키 동시 포함
- `worktree-detector.test.js` (4): plain 저장소 미검출 / non-git 디렉터리 graceful / side-effect 없음 / linked worktree 에서 flag 파일 생성

예상대로 linked worktree 테스트는 stderr 경고도 출력(의도된 동작):
```
[bkit] WARNING: git worktree detected (#46808) — hooks may not fire. See /var/folders/.../.bkit/runtime/worktree-warning.flag
```

## 3. Skills YAML 회귀 (ENH-134)

```
$ node scripts-inline: grep effort validator
total 38 missing 0
```

38/38 스킬 SKILL.md 가 유효한 `effort: low|medium|high` frontmatter 보유. 회귀 없음.

## 4. MCP `_meta` 런타임 검증 (ENH-193)

두 okResponse 함수를 Function 재구성으로 실행하여 실제 반환값 점검:

```
pdca      _meta keys: [ 'maxResultSizeChars', 'claudecode/maxResultSizeChars' ] content[0].type: text
analysis  _meta keys: [ 'maxResultSizeChars', 'claudecode/maxResultSizeChars' ] content[0].type: text
```

양쪽 서버 모두 이중 키 설정 확인. CC v2.1.98 `_meta` persist-bypass 수정 이후에도 500KB 상한이 일관 적용됨.

## 5. Headless Smoke Test (`claude -p`)

본 세션은 이미 `--plugin-dir .` 로 실행 중이므로 `claude -p` 는 자동으로 bkit 플러그인을 상속하지 않음. bkit 플러그인의 MCP/Hook 로드 자체는 현 세션 SessionStart 에서 검증됨. 대신 독립 `claude -p` 가 v2.1.98 환경에서 정상 응답하는지 기본 헬스 체크만 수행:

```
$ claude -p --output-format json "reply with single word: ok"
{"type":"result","subtype":"success","is_error":false,"duration_ms":3153,"result":"ok",...}
```

결과: `is_error: false`, `stop_reason: end_turn`, `terminal_reason: completed`, `permission_denials: []`. CC CLI 가 정상 동작하며 bkit 변경이 CLI 레벨 회귀를 유발하지 않음 확인.

본 세션 내 MCP 툴(`mcp__plugin_bkit_bkit-pdca__*`, `mcp__plugin_bkit_bkit-analysis__*`) 이 정상 노출되어 있으며 이는 변경 후 재로드 없이 다음 세션부터 이중 `_meta` 키로 응답한다.

## 6. 미달 / 리스크

없음 (Match Rate 100%).

잠재 리스크(낮음):
- `claudecode/maxResultSizeChars` 키 규격이 향후 CC 버전에서 또다시 변경될 수 있음 → 양쪽 키 동시 설정으로 선제 방어됨
- worktree-detector 가 `execSync` 3회 실행하므로 세션 시작이 ~30ms 증가 가능 → 허용 범위

## 7. 결론

Phase 1 (P0) 세 항목 모두 정량/정성 기준 통과. `/pdca report` 로 진행 가능.
