# Simplify 리뷰 — cc-version-issue-response

**날짜**: 2026-04-12
**브랜치**: `feat/bkit-v212-cc-v2198-compat`
**적용 스킬**: `/simplify` (품질 / 재사용 / 간결성)

## 1. 파일별 적용/미적용

| 파일 | 적용 | 사유 |
|------|------|------|
| `servers/bkit-pdca-server/index.js` | 주석 통합 (per-field 주석 3줄 → 블록 주석 1개) | per-field 주석이 블록 주석 내용과 중복. WHY 1회로 통일. |
| `servers/bkit-analysis-server/index.js` | 동일 | 동일 |
| `lib/core/worktree-detector.js` | `detectAndWarn()`에서 dead `try/catch` 제거, `mkdir + writeFile + stderr`를 단일 `try/catch`로 병합 | `inspectWorktree()`는 `safeGit()`가 이미 예외를 삼켜서 throw 불가능. 3중 try/catch가 방어 중복. |
| `hooks/startup/context-init.js` | 미적용 | 워크트리 감지 블록이 이미 간결. 기존 `safeRequire` 패턴 대신 `require`를 쓴 이유: WHY 주석이 `#46808` 이슈 추적을 명시하고 있어 유지 가치 있음. |
| `test-scripts/unit/mcp-ok-response.test.js` | 미적용 | 실제 regex로 양쪽 키 검증 → 의미 있는 assertion. |
| `test-scripts/unit/worktree-detector.test.js` | 미적용 | plain repo / non-git / linked worktree 3가지 경로 모두 검증. 무의미 assertion 없음. |

## 2. 제거/축소 LOC

| 파일 | 제거 | 순변화 |
|------|------|--------|
| `lib/core/worktree-detector.js` | dead try/catch 1건, mkdir try/catch 1건, stderr try/catch 1건 → 단일 try/catch | -8 LOC |
| `servers/bkit-pdca-server/index.js` | per-field 주석 2줄 축소 | -1 LOC |
| `servers/bkit-analysis-server/index.js` | 동일 | -1 LOC |
| **합계** | | **-10 LOC** |

## 3. YAGNI로 의도적 유지

1. **두 MCP 서버 `okResponse()` 공통 헬퍼 추출 — 의도적 미적용**
   - 중복은 2회. 새 공유 모듈 생성 비용(import, 파일 1개, 테스트 영향) > 현 복사본 유지 비용.
   - 두 서버가 각각 독립 실행 MCP stdio 프로세스라 공유 모듈화가 런타임 의존성만 증가.
   - DRY보다 WET가 더 적합한 경계 케이스.

2. **`worktree-detector.js`의 `inspectWorktree` try/catch 제거 고려 — 유지**
   - `path.resolve`·`execSync` 조합은 이론상 매우 드문 edge case(예: `cwd`가 이미 삭제된 경우)에서 throw 가능성. 외부 경계이므로 1개의 try/catch는 유지.

3. **`hooks/startup/context-init.js`의 워크트리 블록을 `safeRequire`로 통합 — 유지**
   - 기존 `safeRequire`는 사용자가 설치 안 할 수 있는 optional module 대응. `worktree-detector`는 bkit 내장이라 semantics가 다름. try/catch가 명시적인 편이 WHY 주석과 호응.

## 4. 실행 결과

### 단위 테스트
```
npx jest test-scripts/unit/mcp-ok-response.test.js test-scripts/unit/worktree-detector.test.js --silent
Test Suites: 2 passed, 2 total
Tests:       6 passed, 6 total
Time:        0.47 s
```

### Syntax 체크
```
node -e "require('./lib/core/worktree-detector')"
OK
```

### Smoke test
```
claude -p --plugin-dir . --output-format json "/bkit:control status"
```
- `is_error: false`, `duration_ms: 27594`, `num_turns: 4`
- bkit Control Panel 정상 출력, MCP `_meta` 관련 오류 없음.

## 5. 버전 업데이트

`2.1.1` → `2.1.2` (docs/ 제외):

| 파일 | 변경 |
|------|------|
| `bkit.config.json` | `version` 필드 |
| `.claude-plugin/plugin.json` | `version` 필드 |
| `.claude-plugin/marketplace.json` | 2곳 (marketplace + bkit plugin) |
| `hooks/hooks.json` | `description` |

## 6. git 상태

```
git diff --stat (추적 파일만)
 .claude-plugin/marketplace.json                  |  4 +--
 .claude-plugin/plugin.json                       |  2 +-
 bkit.config.json                                 |  2 +-
 hooks/hooks.json                                 |  2 +-
 hooks/startup/context-init.js                    | 15 +++++++++
 servers/bkit-analysis-server/index.js            |  8 ++++-
 servers/bkit-pdca-server/index.js                |  8 ++++-
```

신규 파일(추적 안 된 것):
- `lib/core/worktree-detector.js`
- `test-scripts/unit/mcp-ok-response.test.js`
- `test-scripts/unit/worktree-detector.test.js`

## 7. 결론

- **기능 변경 없음** — 리팩터 / 주석 통합 / dead code 제거만.
- **테스트 6/6 통과**, smoke test 정상.
- **-10 LOC**, 중복 제거는 YAGNI 판단으로 의도적 유지.
- 커밋 생성하지 않음 (사용자 요청대로).
