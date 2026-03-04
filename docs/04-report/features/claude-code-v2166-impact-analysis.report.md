# Claude Code v2.1.64~v2.1.66 Impact Analysis Report

> **Feature**: claude-code-v2166-impact-analysis
> **Version**: bkit v1.5.8 (현재)
> **Date**: 2026-03-04
> **Analysis Range**: v2.1.64 ~ v2.1.66 (v2.1.63 이후)
> **Status**: Completed
> **Compatibility**: 100% (Breaking Changes 0건)

---

## 1. Executive Summary

Claude Code v2.1.64는 **역대 최대급 릴리스(46건)**이며, CHANGELOG가 GitHub에서 **의도적으로 삭제**(커밋 a833523)된 특이한 릴리스입니다. 21개 Features, 22개 Bug Fixes, 3개 기타 변경사항이 포함되어 있으며, bkit 플러그인에 **직접 활용 가능한 신규 기능 8건**, **안정성 개선 10건**이 확인되었습니다.

v2.1.66에서는 v2.1.64에서 추가된 **시스템 프롬프트 실험적 기능(Verification Specialist, Output Efficiency, Ultraplan)**이 롤백되었지만, v2.1.64의 코드 레벨 변경사항(Features/Bug Fixes)은 **모두 유지**됩니다.

### Key Numbers

| Metric | Value |
|--------|-------|
| 분석 대상 버전 | 3개 (v2.1.64, v2.1.65-SKIP, v2.1.66) |
| **총 변경사항** | **47건** (v2.1.64: 46, v2.1.66: 1) |
| v2.1.64 Features | **21건** (신규 hook event, 신규 변수, 보안 설정 등) |
| v2.1.64 Bug Fixes | **22건** (보안 1, 메모리 누수 4, 스킬/플러그인 3 등) |
| 시스템 프롬프트 순 토큰 변화 | **-216 tokens** (v2.1.64 +1,291 → v2.1.66 -1,507) |
| Breaking Changes | **0건** |
| **bkit 활용 가능 신규 기능** | **8건** (HIGH 3, MEDIUM 5) |
| **bkit 안정성 개선** | **10건** (보안 1, 메모리 4, 스킬 3, 이슈 수정 3) |
| 신규 ENH 기회 | **12건** (ENH-60 ~ ENH-71) |
| Hook Events 총 수 | **18개** (+1: InstructionsLoaded) |
| 누적 호환 릴리스 | **32개 연속** (v2.1.34~v2.1.66) |
| CHANGELOG 특이사항 | v2.1.64 항목 **의도적 삭제** (커밋 a833523) |

---

## 2. Version-by-Version Analysis

### 2.1. v2.1.64 (2026-03-03) — 역대 최대급 릴리스

**릴리스 특성**: npm 게시 (79.9MB), GitHub 릴리스 없음, **CHANGELOG 의도적 삭제**
**변경사항**: 46건 (Features 21, Bug Fixes 22, 기타 3)
**시스템 프롬프트**: +1,291 tokens (실험적 기능 포함)

#### 2.1.1. Features (21건)

##### Infrastructure & Server (3건)

| # | Feature | 설명 | bkit 관련 |
|---|---------|------|-----------|
| F-01 | **`claude server` persistent session** | `session_key`로 WebSocket 재연결, 서버 재시작 시에도 resume. 새 플래그: `--workspace`, `--idle-timeout`, `--max-sessions` | LOW |
| F-02 | **`claude remote-control server`** | 여러 동시 세션 호스팅, worktree 또는 same-dir isolation | LOW |
| F-03 | **Remote Control 이름 지정** | `/remote-control My Project` 또는 `--name "My Project"` | LOW |

##### Hook & Event System (3건) — bkit HIGH IMPACT

| # | Feature | 설명 | bkit 관련 |
|---|---------|------|-----------|
| F-04 | **`InstructionsLoaded` hook event** | CLAUDE.md 또는 `.claude/rules/*.md` 파일이 컨텍스트에 로드될 때 발생 | **HIGH** — 신규 hook event! |
| F-05 | **hook event에 `agent_id` + `agent_type` 추가** | subagent와 `--agent` 세션에서 에이전트 식별자 제공 | **HIGH** — hook에서 에이전트 구분 가능 |
| F-06 | **Status line hook에 `worktree` 필드 추가** | worktree name, path, branch, 원본 repo 디렉토리 정보 | LOW |

##### Plugin & Skill System (5건)

| # | Feature | 설명 | bkit 관련 |
|---|---------|------|-----------|
| F-07 | **`/reload-plugins` 명령어** | 재시작 없이 보류 중인 플러그인 변경사항 활성화 | **MEDIUM** — 개발 워크플로우 개선 |
| F-08 | **`${CLAUDE_SKILL_DIR}` 변수** | 스킬이 SKILL.md 내에서 자기 디렉토리 참조 가능 | **HIGH** — 27개 스킬에 활용 가능 |
| F-09 | **Scheduled skill triggers** | 백그라운드 작업에 스케줄/카운트다운 상세 다이얼로그 | LOW |
| F-10 | **`pluginTrustMessage` managed settings** | 플러그인 설치 전 신뢰 경고에 조직별 컨텍스트 추가 | LOW |
| F-11 | **Plugin source `git-subdir`** | git repo 내 하위 디렉토리를 플러그인 소스로 지정 | LOW |

##### Configuration & Settings (4건)

| # | Feature | 설명 | bkit 관련 |
|---|---------|------|-----------|
| F-12 | **`sandbox.enableWeakerNetworkIsolation`** | macOS MITM proxy 환경에서 Go 프로그램 TLS 인증서 검증 허용 | LOW |
| F-13 | **`includeGitInstructions` 설정** | `CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS` env var로 빌트인 commit/PR 지시 제거 가능 | **MEDIUM** — 시스템 프롬프트 커스터마이징 |
| F-14 | **`CLAUDE_CODE_AUTO_MEMORY_PATH` env var** | auto-memory 디렉토리 경로 직접 지정 | **MEDIUM** — bkit 메모리 경로 커스터마이징 |
| F-15 | **`pathPattern` in `strictKnownMarketplaces`** | 파일/디렉토리 marketplace 소스에 정규식 매칭 | LOW |

##### UX & Localization (4건)

| # | Feature | 설명 | bkit 관련 |
|---|---------|------|-----------|
| F-16 | **Voice STT 10개 신규 언어** | 총 20개: +러시아어, 폴란드어, 터키어, 네덜란드어, 우크라이나어, 그리스어, 체코어, 덴마크어, 스웨덴어, 노르웨이어 | LOW |
| F-17 | **Effort level 표시** | 로고/스피너에 현재 effort 설정 표시 | LOW |
| F-18 | **Agent name 터미널 타이틀** | `claude --agent` 사용 시 에이전트 이름 표시 | LOW |
| F-19 | **Claude Code Desktop 추천 프롬프트** | macOS/Windows 첫 시작 시 Desktop 앱 안내 (최대 3회) | LOW |

##### OAuth & Enterprise (2건)

| # | Feature | 설명 | bkit 관련 |
|---|---------|------|-----------|
| F-20 | **Team plan policy limit** | Team plan OAuth 사용자도 정책 제한 조회 가능 | LOW |
| F-21 | **MCP OAuth `oauth.authServerMetadataUrl`** | 커스텀 OAuth 메타데이터 URL 지정 | LOW |

#### 2.1.2. Bug Fixes (22건)

##### Security (1건)

| # | Fix | 설명 | bkit 관련 |
|---|-----|------|-----------|
| B-01 | **Symlink bypass 보안 수정** | `acceptEdits` 모드에서 symlink된 부모 디렉토리를 통해 working directory 밖에 파일 쓰기 가능했던 취약점 | **MEDIUM** — bkit 에이전트 9개가 acceptEdits 사용 |

##### Memory Leak Fixes (4건)

| # | Fix | 설명 | bkit 관련 |
|---|-----|------|-----------|
| B-02 | **React Compiler `memoCache` 누수** | 오래된 메시지 배열 버전 누적 방지 | **MEDIUM** — 장기 세션 안정성 |
| B-03 | **REPL render scope 누수** | ~35MB/1000 turns | **MEDIUM** — CTO Team 장기 세션 |
| B-04 | **In-process teammate 메모리 보존** | 부모 대화 히스토리가 teammate 수명 동안 고정되어 GC 차단 | **HIGH** — CTO Team 직접 영향 |
| B-05 | **Hook event 무한 누적 누수** | hook event 리스너 누적 | **MEDIUM** — bkit 10개 hook event |

##### Skill & Plugin Fixes (3건)

| # | Fix | 설명 | bkit 관련 |
|---|-----|------|-----------|
| B-06 | **Interactive tools 자동 허용 버그** | 스킬의 allowed-tools에 `AskUserQuestion` 등이 있을 때 빈 응답으로 자동 실행되던 문제 | **HIGH** — #29547과 관련, bkit 스킬 안정성 |
| B-07 | **스킬 frontmatter 파싱 수정** | description에 콜론 포함 시 로딩 실패, description 미지정 시 스킬 목록 미표시 | **MEDIUM** — bkit 27개 스킬 `description: \|` 사용 |
| B-08 | **많은 skills/plugins 설치 시 느린 시작** | 다수 스킬/플러그인 환경 최적화 | **MEDIUM** — bkit 27개 스킬 시작 속도 |

##### Hook System Fixes (2건)

| # | Fix | 설명 | bkit 관련 |
|---|-----|------|-----------|
| B-09 | **`TeammateIdle`/`TaskCompleted` hooks에 `continue: false` 지원** | hook에서 teammate 중지 가능 (Stop hook과 동일 인터페이스) | **HIGH** — bkit TeammateIdle/TaskCompleted hook 기능 확장 |
| B-10 | **`WorktreeCreate`/`WorktreeRemove` 플러그인 hook 수정** | 플러그인/SDK에서 등록한 hook이 실행되도록 | LOW — bkit 현재 미사용 |

##### Previously Monitored Issues Fixed (3건)

| # | Issue | 설명 | bkit 관련 |
|---|-------|------|-----------|
| B-11 | **#29547** | AskUserQuestion이 플러그인 스킬에서 빈 값 반환 | **HIGH** |
| B-12 | **#29520** | 플러그인 스킬이 /context에서 중복 표시 | **MEDIUM** |
| B-13 | **#29441** | `skills:` frontmatter 팀 팀원 프리로딩 실패 | **MEDIUM** |

##### Other Bug Fixes (9건)

| # | Fix | 설명 | bkit 관련 |
|---|-----|------|-----------|
| B-14 | **Sandbox `allowManagedDomainsOnly`** | 비허용 도메인 자동 차단 | LOW |
| B-15 | **대용량 바이너리 파일 커밋 시 multi-GB 메모리 스파이크** | 대형 repo 안정성 | LOW |
| B-16 | **Escape 키 인터럽트** | draft 텍스트가 있을 때 Escape로 실행 중단 | LOW |
| B-17 | **Android Remote Control 크래시** | 로컬 슬래시 명령어 실행 시 | LOW |
| B-18 | **`--mcp-config` 손상 파일 hang** | MCP 설정 내구성 | LOW |
| B-19 | **`cd <outside-dir> && rm/mv/cp` 권한 프롬프트** | 연쇄 명령 표면화 | LOW |
| B-20 | **조건부 `.claude/rules/*.md` print mode 로딩** | `claude -p` 호환성 | LOW |
| B-21 | **`/clear` 세션 캐시 완전 초기화** | 장기 세션 메모리 관리 | MEDIUM |
| B-22 | **터미널 flicker / MCP OAuth macOS 프레임 드롭 / 디버그 로그 flush 스톨** | UX 안정성 | LOW |

#### 2.1.3. 시스템 프롬프트 변경 (+1,291 tokens)

| 항목 | 변화 | v2.1.66에서 |
|------|------|------------|
| **Verification Specialist Agent** | 적대적 검증 에이전트 프롬프트 추가 | ❌ 삭제됨 |
| **Output Efficiency Instructions** | 간결한 출력 가이드라인 추가 | ❌ 삭제됨 |
| **Ultraplan Complete Reminder** | Remote Session 사전 계획 리마인더 추가 | ❌ 삭제됨 |
| **Status Line Setup Agent** | `worktree` JSON 스키마 추가 | ❌ 제거됨 |
| **Create Verifier Skills** | self-update 가이던스 추가 | ❌ 롤백됨 |
| **Task Tool Description** | context 가이던스 제거 | ⟳ 복원됨 |
| **ToolSearch Extended** | 쉼표 구분 다중 선택 추가 | ❌ 롤백됨 |

#### 2.1.4. 패키지 정보

| 항목 | 값 |
|------|-----|
| npm unpackedSize | 79,922,321 bytes |
| fileCount | 22 |
| GitHub Release | 없음 |
| CHANGELOG | **의도적 삭제** (커밋 a833523) |

### 2.2. v2.1.65

**SKIPPED** — npm 미게시, GitHub 릴리스 없음

### 2.3. v2.1.66 (2026-03-04)

**릴리스 특성**: npm + GitHub 릴리스 (Latest 태그)
**변경사항**: 1건
**릴리스 관리자**: ashwin-ant

**시스템 프롬프트: -1,507 tokens** (v2.1.64 실험적 기능 롤백)

#### Bug Fix (1건)

| # | Fix | 설명 |
|---|-----|------|
| 1 | **Reduced spurious error logging** | 불필요한 에러 로깅 감소 |

#### 시스템 프롬프트 롤백 (v2.1.64 실험적 기능 제거)

| 항목 | 변화 |
|------|------|
| Verification Specialist Agent Prompt | 삭제 |
| Output Efficiency Instructions | 삭제 |
| Ultraplan Complete Reminder | 삭제 |
| Explore Agent `whenToUse` | 제거, `Agent` → `tq` 리네이밍 |
| Plan Mode disallowed tools | `Agent` → `tq` 리네이밍 |
| ToolSearch | `ADDITIONAL_PROMPT_SECTION` 변수 추가 |

#### 패키지 정보

| 항목 | 값 |
|------|-----|
| npm unpackedSize | 79,857,107 bytes (-65,214 from v2.1.64) |
| CLI 바이너리 크기 | 193,616,080 bytes (193.6MB) |

**중요**: v2.1.66에서 롤백된 것은 **시스템 프롬프트 실험적 기능만**입니다. v2.1.64의 코드 레벨 변경사항(21 Features, 22 Bug Fixes)은 **모두 유지**됩니다.

---

## 3. bkit Plugin Impact Assessment

### 3.1. HIGH Impact — 즉시 활용 가능 (6건)

| # | 변경 | bkit 영향 | 활용 방안 |
|---|------|-----------|-----------|
| **H-01** | `InstructionsLoaded` hook event | bkit hook events 10→11개 가능 (총 18개 중) | CLAUDE.md 로드 시 bkit 초기화 트리거, 규칙 파일 변경 감지 |
| **H-02** | `${CLAUDE_SKILL_DIR}` 변수 | 27개 스킬에서 자기 디렉토리 참조 가능 | 스킬 내 supporting 파일 접근 패턴 표준화 |
| **H-03** | hook event `agent_id` + `agent_type` | 10개 hook handler에서 에이전트 구분 가능 | CTO Team 에이전트별 차별화 처리, 로그/상태 추적 |
| **H-04** | `TeammateIdle`/`TaskCompleted` `continue: false` | bkit TeammateIdle/TaskCompleted hook에서 teammate 중지 가능 | CTO Team 에이전트 자동 종료 제어 |
| **H-05** | In-process teammate 메모리 보존 수정 (B-04) | CTO Team 장기 세션에서 부모 대화 GC 차단 해결 | 직접적 성능 개선, 코드 변경 불필요 |
| **H-06** | Interactive tools 자동 허용 버그 수정 (B-06) | AskUserQuestion이 스킬에서 정상 동작 | #29547과 함께 완전 해결, 코드 변경 불필요 |

### 3.2. MEDIUM Impact — 고도화 기회 (8건)

| # | 변경 | bkit 영향 | 활용 방안 |
|---|------|-----------|-----------|
| **M-01** | `/reload-plugins` 명령어 | bkit 개발 시 재시작 없이 변경 반영 | 개발 워크플로우 문서화 |
| **M-02** | `includeGitInstructions` 설정 | 빌트인 git 지시 제거하여 시스템 프롬프트 최적화 가능 | bkit PDCA commit 워크플로우와 충돌 제거 |
| **M-03** | `CLAUDE_CODE_AUTO_MEMORY_PATH` env var | auto-memory 경로 커스터마이징 | bkit memory와 auto-memory 경로 통합 관리 |
| **M-04** | Symlink bypass 보안 수정 (B-01) | acceptEdits 에이전트 9개 보안 강화 | 직접적 보안 개선, 코드 변경 불필요 |
| **M-05** | 스킬 frontmatter 파싱 수정 (B-07) | description 콜론 처리, 미지정 시 동작 정상화 | bkit 스킬 안정성 개선, 코드 변경 불필요 |
| **M-06** | 스킬/플러그인 시작 속도 개선 (B-08) | bkit 27개 스킬 환경 시작 최적화 | 직접적 성능 개선, 코드 변경 불필요 |
| **M-07** | Memory leak 3건 (B-02, B-03, B-05) | 장기 세션 안정성 (REPL, React, hook event) | 직접적 안정성 개선, 코드 변경 불필요 |
| **M-08** | `/clear` 세션 캐시 완전 초기화 (B-21) | 장기 PDCA 세션 메모리 관리 | 직접적 개선, 코드 변경 불필요 |

### 3.3. Previously Monitored Issues — 상태 업데이트

#### 수정됨 (Closed)

| Issue | 제목 | 수정 버전 | bkit 영향 |
|-------|------|----------|-----------|
| **#29547** | AskUserQuestion empty in plugin skills | v2.1.64 | **HIGH** — 완전 해결 |
| **#29520** | Plugin skills duplicate | v2.1.64 | **MEDIUM** — 완전 해결 |
| **#29441** | Agent skills not preloaded for teammates | v2.1.64 | **MEDIUM** — 완전 해결 |

#### 여전히 미해결 (Open)

| Issue | 제목 | 상태 | bkit 관련성 |
|-------|------|------|------------|
| **#29548** | ExitPlanMode skips approval (v2.1.63 regression) | **OPEN** | HIGH — plan mode 에이전트 7개 |
| **#29423** | Task subagents ignore CLAUDE.md | **OPEN** | MEDIUM — 프로젝트 설정 상속 |
| **#25131** | Agent Teams lifecycle failures | **OPEN** | MEDIUM — CTO Team 안정성 |

### 3.4. 신규 이슈 모니터링 대상 (v2.1.66 시점)

| Issue | 제목 | 상태 | bkit 관련성 |
|-------|------|------|------------|
| **#30586** | PostToolUse hook stdout JSON output duplicated | OPEN | **MEDIUM** — bkit PostToolUse 훅 |
| **#30613** | HTTP hooks with JSON don't work | OPEN | LOW — command type만 사용 |
| **#30607** | Settings not shared across worktrees | OPEN | LOW — worktree 미사용 |
| **#30600** | Prompt suggestions not appearing in v2.1.66 | OPEN | LOW |
| **#30614** | Bash tool output duplicated on non-zero exit code | OPEN | LOW |
| **#30583** | Nested claude CLI deletes parent session output | OPEN | LOW |

### 3.5. 호환성 매트릭스

| 검증 항목 | 결과 | 비고 |
|-----------|------|------|
| Hooks (10→11 가능, 총 18) | ✅ 호환 | InstructionsLoaded 추가 가능 |
| Agents (16) | ✅ 호환 | agent_id/agent_type 제공 |
| Skills (27) | ✅ 호환 | ${CLAUDE_SKILL_DIR} 활용 가능 |
| Library (180 functions) | ✅ 호환 | 변경 불필요 |
| Agent Teams | ✅ 호환 + 개선 | 메모리 누수 4건 수정 |
| Output Styles | ✅ 호환 | 변경 없음 |
| PDCA Workflow | ✅ 호환 | 변경 없음 |
| bkit.config.json | ✅ 호환 | 변경 없음 |
| plugin.json | ✅ 호환 | 변경 없음 |
| **누적 호환 릴리스** | **32개 연속** | v2.1.34 ~ v2.1.66 |

---

## 4. ENH Opportunities (Enhancement 기회)

### 4.1. 이전 ENH 현황

| ENH | 설명 | 상태 |
|-----|------|------|
| ENH-52~55 | v2.1.63 기반 (simplify/batch/HTTP hooks/CC commands) | ✅ Implemented (v1.5.7) |

### 4.2. 신규 ENH 후보 (12건)

#### HIGH Priority (4건)

| ENH | 설명 | 근거 |
|-----|------|------|
| **ENH-60** | `InstructionsLoaded` hook event 활용 | CLAUDE.md 로드 시점 감지로 bkit 초기화 보완. 현재 SessionStart만 사용하지만 InstructionsLoaded는 더 세밀한 타이밍 제공 |
| **ENH-61** | `${CLAUDE_SKILL_DIR}` 변수 스킬 전반 적용 | 27개 스킬에서 supporting 파일 경로를 동적으로 참조. 현재 `${CLAUDE_PLUGIN_ROOT}` 사용을 보완 |
| **ENH-62** | hook event `agent_id`/`agent_type` 활용 | CTO Team hook handler에서 에이전트별 차별화 처리. SubagentStart/Stop/TeammateIdle에서 에이전트 식별 |
| **ENH-63** | `TeammateIdle`/`TaskCompleted` `continue: false` 활용 | hook에서 teammate 자동 종료 제어. CTO Team 효율성 향상 |

#### MEDIUM Priority (5건)

| ENH | 설명 | 근거 |
|-----|------|------|
| **ENH-64** | `/reload-plugins` 개발 워크플로우 문서화 | bkit 개발/테스트 시 세션 재시작 없이 변경 반영 안내 |
| **ENH-65** | `includeGitInstructions` PDCA 최적화 | bkit PDCA commit 워크플로우 사용 시 빌트인 git 지시와 충돌 제거 옵션 |
| **ENH-66** | `CLAUDE_CODE_AUTO_MEMORY_PATH` 활용 가이드 | bkit memory (`.bkit/state/memory.json`)와 CC auto-memory 경로 관리 통합 문서화 |
| **ENH-67** | `#30586` PostToolUse 출력 중복 우회 | bkit PostToolUse hook stdout JSON 중복 가능성 모니터링, 필요시 stderr 전환 |
| **ENH-68** | 공식 문서 URL 업데이트 인지 | docs.anthropic.com → code.claude.com 리다이렉트 반영 |

#### LOW Priority (3건)

| ENH | 설명 | 근거 |
|-----|------|------|
| **ENH-69** | Agent `background: true` CTO Team 활용 | 리서치 에이전트를 명시적 백그라운드 설정으로 병렬성 향상 |
| **ENH-70** | Skill `context: fork` 독립 실행 활용 | gap-detector, code-analyzer 등을 fork 컨텍스트로 격리하여 메인 컨텍스트 보호 |
| **ENH-71** | `WorktreeCreate`/`WorktreeRemove` 플러그인 hook 활용 | 이제 플러그인에서도 정상 동작 확인, worktree 기반 PDCA 격리 가능 |

---

## 5. v2.1.64 CHANGELOG 삭제 분석

### 5.1. 사실 관계

- v2.1.64는 npm에 2026-03-03 03:19 UTC에 게시됨
- CHANGELOG에 46건의 변경사항이 기록되었으나, 이후 **커밋 a833523에서 의도적으로 삭제**
- GitHub Releases 페이지에 v2.1.64 릴리스가 생성되지 않음
- v2.1.66 릴리스에서 CHANGELOG는 v2.1.63 바로 다음으로 표시

### 5.2. 추정 원인

1. **대규모 릴리스의 점진적 공개**: 46건의 변경사항을 한꺼번에 공개하지 않고, 안정성 확인 후 v2.1.66에서 공식 릴리스
2. **시스템 프롬프트 실험의 빠른 롤백**: Verification Specialist 등 3개 실험적 기능이 2일 만에 제거 → CHANGELOG에서 제거하여 혼란 방지
3. **보안 수정 사항의 시간차 공개**: symlink bypass 취약점(B-01) 수정을 바로 공개하지 않는 responsible disclosure 패턴

### 5.3. bkit 대응

- v2.1.64의 코드 레벨 변경사항은 npm을 통해 설치된 바이너리에 **포함되어 있음**
- CHANGELOG 삭제와 무관하게 모든 21개 Features와 22개 Bug Fixes는 **활성 상태**
- bkit 입장에서는 이 모든 변경사항이 **사용 가능**

---

## 6. Experimental Feature Analysis

### 6.1. Verification Specialist (v2.1.64 추가 → v2.1.66 삭제)

**개요**: 구현의 정확성을 적대적으로 검증하는 에이전트 프롬프트. PASS/FAIL/PARTIAL 판정 반환.

**분석**:
- Anthropic이 CC 내부에 자동 검증 파이프라인을 실험 중
- bkit의 gap-detector + pdca-iterator와 유사한 개념이나, bkit은 **설계서 기반 검증**이라는 차별점
- 2일 만에 롤백 → 완성도/안정성 부족으로 판단

**전략적 시사점**: Anthropic이 자체 검증 에이전트를 재도입할 가능성이 높음. bkit의 차별화 포인트인 **PDCA 전체 사이클 + 설계서 기반 갭 분석**을 지속 강화 필요.

### 6.2. Output Efficiency Instructions (v2.1.64 추가 → v2.1.66 삭제)

**개요**: Claude가 간결하고 직접적으로 응답하도록 하는 시스템 프롬프트 지시사항.

**분석**: bkit output-styles와 일부 기능 중복. 롤백은 다른 기능과의 충돌 가능성.

### 6.3. Ultraplan Complete (v2.1.64 추가 → v2.1.66 삭제)

**개요**: Remote Session에서 사전 생성된 계획을 바로 제시하도록 하는 리마인더.

**분석**: bkit plan-plus 스킬과 유사. CC Web/Remote Control 워크플로우 재설계 진행 중으로 추정.

---

## 7. Hook Events 종합 현황

### 7.1. 전체 Hook Events (18개, +1 from v2.1.63)

| # | Event | bkit 사용 | 설명 |
|---|-------|----------|------|
| 1 | SessionStart | ✅ | 세션 시작 |
| 2 | UserPromptSubmit | ✅ | 사용자 입력 |
| 3 | PreToolUse | ✅ | 도구 사용 전 |
| 4 | PermissionRequest | ❌ | 권한 요청 |
| 5 | PostToolUse | ✅ | 도구 사용 후 |
| 6 | PostToolUseFailure | ✅ | 도구 실패 후 |
| 7 | Notification | ✅ | 알림 |
| 8 | SubagentStart | ✅ | 서브에이전트 시작 |
| 9 | SubagentStop | ✅ | 서브에이전트 종료 |
| 10 | Stop | ✅ | 세션 중지 |
| 11 | TeammateIdle | ✅ | 팀원 유휴 |
| 12 | TaskCompleted | ✅ | 태스크 완료 |
| 13 | ConfigChange | ❌ | 설정 변경 |
| 14 | PreCompact | ❌ | 컴팩션 전 |
| 15 | SessionEnd | ❌ | 세션 종료 |
| 16 | WorktreeCreate | ❌ | 워크트리 생성 |
| 17 | WorktreeRemove | ❌ | 워크트리 제거 |
| 18 | **InstructionsLoaded** (NEW) | ❌ (ENH-60) | **CLAUDE.md/rules 로드 시** |

**bkit 사용률**: 10/18 = 55.6% (ENH-60 적용 시 11/18 = 61.1%)

### 7.2. v2.1.64 Hook 개선사항

| 개선 | 설명 |
|------|------|
| **`agent_id` + `agent_type` 필드 추가** | 모든 hook event에서 에이전트 식별 가능 |
| **`TeammateIdle`/`TaskCompleted` `continue: false`** | hook에서 teammate 중지 가능 |
| **`WorktreeCreate`/`WorktreeRemove` 플러그인 수정** | 플러그인에서 정상 동작 |

---

## 8. CTO Team Performance

| Agent | Task | Status | Key Findings |
|-------|------|--------|-------------|
| **changelog-researcher** | CC 공식 CHANGELOG/문서 조사 | ✅ | **CHANGELOG 삭제 발견**, v2.1.64 실제 46건 변경 확인 (역대 최대급) |
| **github-researcher** | GitHub 이슈/PR 조사 | ✅ | 3건 수정 확인, 6건 신규 이슈 발견, 3건 기존 이슈 상태 업데이트 |
| **bkit-analyzer** | bkit 코드베이스 아키텍처 분석 | ✅ | 7,635줄 lib/ + 45 scripts + 27 skills, CC API 표면 완전 매핑 |
| **team-lead** | 리서치 종합 및 보고서 작성 | ✅ | 본 보고서 (v1 + v2 개정) |

---

## 9. Recommendations

### 9.1. 즉시 조치 (Priority: NONE)

bkit v1.5.8은 v2.1.66과 100% 호환. 코드 변경 없이 모든 신규 기능의 혜택을 받음.

### 9.2. 단기 고도화 (Priority: HIGH — ENH-60~63)

다음 bkit 릴리스에서 고려:
1. **ENH-60**: `InstructionsLoaded` hook 활용 → bkit 초기화 정확성 향상
2. **ENH-61**: `${CLAUDE_SKILL_DIR}` → 스킬 supporting 파일 접근 표준화
3. **ENH-62**: `agent_id`/`agent_type` → CTO Team hook 에이전트별 처리
4. **ENH-63**: `continue: false` → teammate 자동 종료 제어

### 9.3. 모니터링 계속

| 이슈 | 우선순위 | 이유 |
|------|---------|------|
| #29548 | HIGH | ExitPlanMode regression — plan mode 에이전트 7개 |
| #30586 | MEDIUM | PostToolUse 출력 중복 — bkit PostToolUse 훅 |
| #25131 | MEDIUM | Agent Teams 라이프사이클 |
| #29423 | MEDIUM | CLAUDE.md 서브에이전트 로딩 |

---

## 10. Conclusion

v2.1.64는 **CHANGELOG가 의도적으로 삭제**된 역대 최대급 릴리스(46건)로, Anthropic의 실험적 개발 패턴과 responsible disclosure 전략이 결합된 결과입니다.

bkit 플러그인 관점에서:

1. **즉시 혜택**: 코드 변경 없이 메모리 누수 4건 수정, 보안 1건 수정, AskUserQuestion/스킬 중복/팀 스킬 프리로딩 3건 수정
2. **고도화 기회 12건**: InstructionsLoaded hook, ${CLAUDE_SKILL_DIR}, agent_id/agent_type, continue:false 등
3. **전략적 인사이트**: Verification Specialist 실험은 Anthropic이 자체 검증 에이전트를 개발 중임을 시사 → bkit gap-detector의 PDCA 기반 차별화 전략 지속 필요
4. **32개 연속 호환 릴리스** 달성: bkit의 CC API 활용이 극도로 안정적인 표면에 기반

---

## Sources

- [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) (v2.1.64 항목 삭제됨)
- [Claude Code Releases](https://github.com/anthropics/claude-code/releases)
- [Piebald-AI System Prompts CHANGELOG](https://github.com/Piebald-AI/claude-code-system-prompts/blob/main/CHANGELOG.md)
- [Claude Code Official Docs](https://code.claude.com/docs/en/overview)
- [Claude Code Sub-agents Docs](https://code.claude.com/docs/en/sub-agents)
- [Claude Code Skills Docs](https://code.claude.com/docs/en/skills)
- [npm @anthropic-ai/claude-code](https://www.npmjs.com/package/@anthropic-ai/claude-code)
- GitHub Issues: #29547, #29520, #29441, #29548, #29423, #25131, #30586, #30613, #30607, #30600, #30583, #30614

---

*Generated by bkit CTO Team (4 agents) | 2026-03-04*
*PDCA Phase: Report (Completed) — v2 Major Revision*
*Initial report based on public CHANGELOG → Revised after discovering 46 hidden changes in v2.1.64*
