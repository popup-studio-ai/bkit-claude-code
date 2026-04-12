# CC 버전업 + GitHub 이슈 대응 설계

> **Feature**: cc-version-issue-response
> **Phase**: DESIGN
> **작성일**: 2026-04-12
> **대응 플랜**: `docs/01-plan/features/cc-version-issue-response.plan.md`
> **자동화 레벨**: L4 Full-Auto

---

## 1. Scope (Phase 1 — P0 한정)

본 설계는 플랜 문서 §5 Phase 1(P0) 3개 항목에 대한 실구현 설계서이다. P1 이상은 후속 사이클에서 분리 처리한다.

| # | 항목 | 플랜 ID | 상태 사전 조사 | 실행 여부 |
|---|---|---|---|---|
| 1 | MCP `_meta` 양쪽 키 방어적 재설정 | ENH-193 | 현재 `_meta.maxResultSizeChars=500000` 단일 키 설정 (신 규격 누락) | **DO** |
| 2 | 37 skills `effort` frontmatter 추가 | ENH-134 | **38/38 skills 이미 effort 명시 완료** | **SKIP (실사 결과 완료 상태)** |
| 3 | git worktree hook 감지 가드 (#46808) | Cluster A | 없음 — 신규 구현 | **DO** |

### 1.1 ENH-134 실사 결과

`grep '^effort:' skills/*/SKILL.md` 결과 **38개 모두** `effort:` 필드를 이미 보유. 플랜 시점(v2.1.1) 이후 후속 커밋에서 이미 적용되었음 확인. 본 사이클에서는 스킵하고 QA 단계에서 회귀 검증만 수행.

---

## 2. 변경 대상 파일

| 파일 | 변경 유형 | 설명 |
|---|---|---|
| `servers/bkit-pdca-server/index.js` | modify | `okResponse()` 에 이중 `_meta` 키 적용 |
| `servers/bkit-analysis-server/index.js` | modify | `okResponse()` 에 이중 `_meta` 키 적용 |
| `hooks/startup/context-init.js` | modify | `detectWorktree()` 호출 추가 |
| `lib/core/worktree-detector.js` | create | worktree 감지 + 경고 배너 + flag 파일 생성 |
| `test/worktree-detector.test.js` | create | 단위 테스트 |
| `test/mcp-ok-response.test.js` | create | okResponse `_meta` 이중키 단위 테스트 |

---

## 3. 상세 설계

### 3.1 ENH-193 — MCP `_meta` 이중 키 (P0)

**목적**: CC v2.1.98 의 `_meta persist bypass` 보안 수정 이후, `_meta` 가 프레임워크에 의해 스트립되거나 신 규격 키로만 인식될 가능성 → 구(`maxResultSizeChars`)/신(`claudecode/maxResultSizeChars`) 양쪽 키 동시 설정으로 방어.

**signature (불변)**:
```js
function okResponse(data: object): {
  content: [{ type: "text", text: string }],
  _meta: { [key: string]: number }
}
```

**구현**:
```js
function okResponse(data) {
  const meta = {
    // ENH-176 legacy key (pre v2.1.91)
    maxResultSizeChars: 500000,
    // ENH-193 namespaced key (v2.1.91+ with v2.1.98 persist-bypass fix)
    'claudecode/maxResultSizeChars': 500000,
  };
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    _meta: meta,
  };
}
```

**적용 위치**: 두 파일에서 동일 블록 교체
- `servers/bkit-pdca-server/index.js` line 66-71
- `servers/bkit-analysis-server/index.js` line 73-78

**에러 처리**: 불변, 순수 함수. 기존 호출부 변경 없음.

**검증 기준**:
1. 두 파일 `okResponse()` 결과 객체에 두 키 모두 존재
2. 기존 테스트 (있다면) 무회귀

---

### 3.2 #46808 — git worktree hook 가드 (P0)

**목적**: `git worktree` 에서 생성된 linked worktree 는 `.git` 이 디렉터리가 아닌 파일이며 `.claude/settings.json` 의 hook 경로가 원본 저장소 기준으로 해석되어 발화 실패(#46808). bkit 세션 시작 시 감지하고 사용자에게 경고 + `.bkit/runtime/worktree-warning.flag` 생성.

**신규 파일**: `lib/core/worktree-detector.js`

```js
/**
 * ENH / #46808 — git worktree guard
 * Detects whether the current working directory is a linked git worktree.
 * When detected, emits a warning to stderr and writes a flag file so
 * downstream tooling (status-line, control-panel) can surface the notice.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function safeGit(args, cwd) {
  try {
    return execSync(`git ${args}`, { cwd, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim();
  } catch {
    return null;
  }
}

/**
 * @param {string} cwd
 * @returns {{ isWorktree: boolean, toplevel: string|null, gitCommonDir: string|null, gitDir: string|null }}
 */
function inspectWorktree(cwd = process.cwd()) {
  const toplevel    = safeGit('rev-parse --show-toplevel', cwd);
  const gitDir      = safeGit('rev-parse --git-dir', cwd);
  const gitCommonDir = safeGit('rev-parse --git-common-dir', cwd);
  if (!toplevel || !gitDir || !gitCommonDir) {
    return { isWorktree: false, toplevel, gitCommonDir, gitDir };
  }
  // Linked worktrees have git-dir != git-common-dir
  const absGitDir = path.resolve(toplevel, gitDir);
  const absCommon = path.resolve(toplevel, gitCommonDir);
  const isWorktree = absGitDir !== absCommon;
  return { isWorktree, toplevel, gitCommonDir: absCommon, gitDir: absGitDir };
}

/**
 * Run the detector and write the warning flag when needed.
 * Idempotent and never throws.
 */
function detectAndWarn(cwd = process.cwd()) {
  let info;
  try { info = inspectWorktree(cwd); } catch { return { isWorktree: false }; }
  if (!info.isWorktree) return info;

  const runtimeDir = path.join(cwd, '.bkit', 'runtime');
  try { fs.mkdirSync(runtimeDir, { recursive: true }); } catch {}
  const flagPath = path.join(runtimeDir, 'worktree-warning.flag');
  const payload = {
    detectedAt: new Date().toISOString(),
    toplevel: info.toplevel,
    gitDir: info.gitDir,
    gitCommonDir: info.gitCommonDir,
    issue: 'https://github.com/anthropics/claude-code/issues/46808',
    message:
      'git worktree detected — Claude Code hooks may not fire (issue #46808). ' +
      'Run bkit from the primary repository if hook-driven automation is required.',
  };
  try {
    fs.writeFileSync(flagPath, JSON.stringify(payload, null, 2));
  } catch {}
  // Stderr so session-start hook output stays clean
  try {
    process.stderr.write(
      `\n[bkit] WARNING: git worktree detected (#46808) — hooks may not fire. See ${flagPath}\n`
    );
  } catch {}
  return info;
}

module.exports = { inspectWorktree, detectAndWarn };
```

**통합 지점**: `hooks/startup/context-init.js` 에 `require('../../lib/core/worktree-detector').detectAndWarn()` 1회 호출 추가. 순서는 기존 contextInit 초기화 이후(디렉터리 생성 이후)로 안전.

**에러 처리**: 모든 git 호출은 try/catch 로 감싸고 실패 시 non-worktree 로 간주(정상 경로 유지). FS 쓰기 실패도 silent.

**검증 기준**:
1. 비 worktree 저장소에서 `detectAndWarn()` 호출 → 경고 없음, flag 미생성
2. worktree 시뮬레이션(gitDir ≠ gitCommonDir) 환경에서 flag 생성 확인
3. 기존 session-start 동작 회귀 없음

---

### 3.3 ENH-134 — 회귀 검증만 (SKIP 구현)

QA 단계에서 `grep -L '^effort:' skills/*/SKILL.md` 결과가 비어야 한다. 이 검증은 QA 체크리스트 항목 1 로 편입.

---

## 4. 검증 기준 (전체)

### 4.1 정량 지표
| 지표 | 목표 | 측정 방법 |
|---|---|---|
| Match Rate | ≥ 95% | 설계 항목 구현율 (아래 체크리스트) |
| 단위 테스트 | 신규 2개 통과 | `npx jest test/worktree-detector.test.js test/mcp-ok-response.test.js` |
| 회귀 | 0건 | 기존 테스트 스위트 무변경 통과 |
| Headless smoke | 에러 0 | `claude -p --plugin-dir . "/bkit:control status"` |

### 4.2 정성 체크리스트
- [ ] okResponse 두 키 모두 설정 (bkit-pdca-server)
- [ ] okResponse 두 키 모두 설정 (bkit-analysis-server)
- [ ] worktree-detector 모듈 존재 및 export 시그니처 준수
- [ ] context-init.js 에서 detectAndWarn 1회 호출
- [ ] 신규 단위 테스트 2개 작성 및 통과
- [ ] ENH-134 skills 38/38 effort 필드 보존 확인

### 4.3 Match Rate 계산
- 전체 설계 항목: 6 (체크리스트 위)
- 구현 성공 n/6 → n/6 × 100%

---

## 5. 롤백 계획

| 대상 | 롤백 방법 |
|---|---|
| `okResponse()` 변경 | 파일 단위 git revert (영향 0, 순수 확장) |
| `worktree-detector.js` | 파일 삭제 + context-init.js require 제거 |
| 테스트 파일 | 파일 삭제 |

---

## 6. 다음 단계

`/pdca do` — 본 설계서에 따라 6개 체크리스트 항목을 순차 구현.
