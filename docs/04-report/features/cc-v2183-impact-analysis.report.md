# CC v2.1.83 영향 분석 보고서

> **Status**: ✅ Complete
>
> **Project**: bkit Vibecoding Kit
> **Version**: v2.0.6 (분석 시점)
> **Author**: CC Version Analysis Workflow
> **Completion Date**: 2026-03-25
> **PDCA Cycle**: #23

---

## Executive Summary

### 1.1 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **기능** | CC v2.1.83 (1개 릴리스, v2.1.82 스킵) 영향 분석 |
| **시작일** | 2026-03-25 |
| **완료일** | 2026-03-25 |
| **기간** | 1회 분석 |
| **설치 CC 버전** | v2.1.83 |
| **npm 최신 버전** | v2.1.83 (동일) |
| **분석 범위** | v2.1.82~v2.1.83 (v2.1.82 미발행, 실질 v2.1.81→v2.1.83) |

### 1.2 성과 요약

```
┌──────────────────────────────────────────────────────┐
│  CC v2.1.83 영향 분석 결과                             │
├──────────────────────────────────────────────────────┤
│  📊 총 변경 건수:           ~56건 (CLI ~45 + VSCode 2 + 기타)│
│  🆕 신규 기능:              12건                       │
│  🔧 버그 수정:              ~30건                      │
│  📈 개선사항:               ~12건                      │
│  ⚠️  Breaking/Deprecation:   2건                       │
│  🔴 신규 hook events:       2건 (CwdChanged, FileChanged) │
│  🔴 신규 agent frontmatter: 1건 (initialPrompt)        │
│  📋 신규 ENH 기회:          7건 (ENH-149~155)          │
│  🐛 v2.1.83 리그레션:       2건 (#38651, #38655)       │
│  🔢 연속 호환 릴리스:        49개 (v2.1.34~v2.1.83)    │
│  🔢 breaking changes:       0건 (bkit 기준)            │
└──────────────────────────────────────────────────────┘
```

### 1.3 전달된 가치

| 관점 | 내용 |
|------|------|
| **문제** | v2.1.83이 ~56건 변경을 포함한 대규모 릴리스로 bkit 영향 분석 필요 |
| **해결 방법** | GitHub release notes + npm + 이슈 트래커 + 코드베이스 교차 검증 |
| **기능/UX 효과** | 2개 신규 hook events 활용 기회 발견, Background agent 3개 수정으로 CTO Team 안정성 대폭 개선, 보안 기능 2개 추가 |
| **핵심 가치** | 49개 연속 호환 릴리스 확인 + ENH 7건 도출(P1 2건/P2 3건/P3 2건) + CTO Team 안정성 수정 3건 확인 |

---

## 2. v2.1.83 변경사항 분류

### 2.1 릴리스 정보

| 항목 | 내용 |
|------|------|
| **버전** | v2.1.83 |
| **발행일** | 2026-03-25 |
| **v2.1.82** | ❌ 미발행 (스킵됨, npm/GitHub 모두 없음) |
| **이전 버전** | v2.1.81 (2026-03-20) |
| **간격** | 5일 |

### 2.2 신규 기능 (12건)

| ID | 변경 내용 | bkit 영향도 | 비고 |
|----|----------|-----------|------|
| F-83-1 | `managed-settings.d/` drop-in 디렉토리 | LOW | Enterprise 정책 관리 |
| F-83-2 | **`CwdChanged` hook event** | **HIGH** | 신규 hook event, bkit 18→20 확장 가능 |
| F-83-3 | **`FileChanged` hook event** | **HIGH** | 신규 hook event, PDCA 문서 감시 가능 |
| F-83-4 | `sandbox.failIfUnavailable` 설정 | LOW | 보안 강화 옵션 |
| F-83-5 | `disableDeepLinkRegistration` 설정 | NONE | bkit 무관 |
| F-83-6 | `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1` | MEDIUM | 보안 문서화 필요 |
| F-83-7 | Transcript 검색 (`/` in Ctrl+O) | NONE | UI 개선 |
| F-83-8 | `Ctrl+X Ctrl+E` editor alias | NONE | readline 바인딩 |
| F-83-9 | 이미지 `[Image #N]` chip | NONE | UI 개선 |
| F-83-10 | **Agent `initialPrompt` frontmatter** | MEDIUM | 31개 agent 확장 가능성 |
| F-83-11 | `chat:killAgents`/`chat:fastMode` rebindable | LOW | keybinding 커스터마이징 |
| F-83-12 | `CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK` | LOW | 디버깅용 |

### 2.3 주요 버그 수정 — bkit 관련 (12건)

| ID | 변경 내용 | bkit 영향도 | 비고 |
|----|----------|-----------|------|
| B-83-1 | **Background subagents invisible after compaction** | **HIGH** | CTO Team 핵심 수정 — duplicate spawn 방지 |
| B-83-2 | **Background agent tasks stuck in "running"** | **HIGH** | CTO Team git/API hang 시 복구 |
| B-83-3 | **SDK session history loss from hook messages** | **HIGH** | bkit 18개 hook 안정성 직접 개선 |
| B-83-4 | **Uninstalled plugin hooks continuing to fire** | **MEDIUM** | bkit 제거 후 hook 잔존 문제 해결 |
| B-83-5 | `--mcp-config` bypassing policy enforcement | MEDIUM | 보안 수정 |
| B-83-6 | Tool result files never cleaned up | MEDIUM | `cleanupPeriodDays` 정상 동작 |
| B-83-7 | claude.ai MCP connectors unavailable in `-p` mode | LOW | Slack/Gmail 통합 |
| B-83-8 | `Ctrl+B` interfering with readline backward-char | LOW | 키바인딩 충돌 |
| B-83-9 | Remote Control memory leak (tool use IDs) | LOW | 원격 세션 |
| B-83-10 | macOS hanging on exit | LOW | macOS 안정성 |
| B-83-11 | `caffeinate` process not terminating | LOW | macOS 절전 |
| B-83-12 | Scrollback jumping on model think/search | LOW | UI 안정성 |

### 2.4 개선사항 — bkit 관련 (8건)

| ID | 변경 내용 | bkit 영향도 | 비고 |
|----|----------|-----------|------|
| I-83-1 | **Plugin startup — disk cache 로딩** | **HIGH** | bkit 36 skills, 31 agents 로딩 속도 개선 |
| I-83-2 | **`--resume` 메모리/레이턴시 개선** | MEDIUM | 대규모 세션 복원 |
| I-83-3 | Plugin MCP servers duplicate suppression | MEDIUM | bkit 2개 MCP 서버 충돌 방지 |
| I-83-4 | `/status` 응답 중 동작 가능 | MEDIUM | PDCA 상태 확인 UX 개선 |
| I-83-5 | Non-streaming fallback 21k→64k, timeout 120s→300s | MEDIUM | 에러 복구 강화 |
| I-83-6 | WebFetch `Claude-User` UA | LOW | web search agent |
| I-83-7 | Scrollback resets 빈도 감소 (1/turn→1/50msg) | LOW | 장시간 세션 |
| I-83-8 | `claude -p` startup ~600ms 절약 | LOW | 배치 작업 |

### 2.5 Breaking Changes & Deprecations (2건)

| ID | 변경 내용 | bkit 영향도 | 비고 |
|----|----------|-----------|------|
| D-83-1 | **`Ctrl+F` → `Ctrl+X Ctrl+K`** (stop all bg agents) | **MEDIUM** | 문서 1곳 업데이트 필요 |
| D-83-2 | **`TaskOutput` deprecated → `Read`** | **NONE** | bkit 코드 미사용 (grep 0건) |

---

## 3. GitHub Issues 업데이트

### 3.1 기존 모니터링 이슈 변경

| 이슈 | 제목 | 상태 변경 | 비고 |
|------|------|----------|------|
| #36755 | --resume crash | **OPEN → CLOSED** ✅ | v2.1.83에서 --resume 개선으로 해결 |

나머지 기존 모니터링 이슈 전부 OPEN 유지:
- **OPEN HIGH**: #29423, #34197, #37520, #37745
- **OPEN MEDIUM**: #33656, #35296, #37729, #37730
- **OPEN LOW**: #30613, #33963, #36058, #36740

### 3.2 신규 주요 이슈 (v2.1.83 관련)

| 이슈 | 제목 | 심각도 | bkit 영향 |
|------|------|--------|----------|
| #38651 | Stop hook causes empty result in -p mode | **HIGH** | bkit Stop hook (unified-stop.js) 영향 가능 |
| #38655 | Suspicious tip suggesting fake plugin install | **MEDIUM** | 플러그인 보안 이슈 — 모니터링 필요 |
| #38623 | v2.1.83: -p mode returns empty result (CLOSED) | CLOSED | #38651과 관련, 부분 해결 |

---

## 4. ENH 기회 도출

### ENH-149: CwdChanged hook — 프로젝트 전환 자동 감지 (P1)

| 항목 | 내용 |
|------|------|
| **CC 변경** | F-83-2: `CwdChanged` hook event 추가 |
| **설명** | 사용자가 작업 디렉토리를 변경할 때 bkit이 자동으로 PDCA 상태를 갱신하고 프로젝트 컨텍스트를 재로딩 |
| **구현 범위** | hooks/hooks.json에 CwdChanged 이벤트 추가 + 신규 스크립트 작성 |
| **영향 파일** | `hooks/hooks.json`, `scripts/cwd-changed-handler.js` (신규) |
| **예상 공수** | 2h |
| **YAGNI** | ✅ PASS — 멀티 프로젝트 사용자에게 실질적 가치 |
| **철학 준수** | Automation First ✅ |

### ENH-150: FileChanged hook — PDCA 문서 변경 감시 (P2)

| 항목 | 내용 |
|------|------|
| **CC 변경** | F-83-3: `FileChanged` hook event 추가 |
| **설명** | docs/01-plan/, docs/02-design/ 등 PDCA 문서 파일 변경 시 자동으로 상태 갱신 |
| **구현 범위** | hooks/hooks.json에 FileChanged 이벤트 추가 + 신규 스크립트 작성 |
| **영향 파일** | `hooks/hooks.json`, `scripts/file-changed-handler.js` (신규) |
| **예상 공수** | 3h |
| **YAGNI** | ⚠️ CONDITIONAL — 감시 대상 파일 패턴 정의 필요, 과도한 트리거 방지 필요 |
| **철학 준수** | Automation First ✅, No Guessing ⚠️ (감시 범위 명확화 필요) |

### ENH-151: self-healing agent effort/maxTurns 누락 수정 (P1)

| 항목 | 내용 |
|------|------|
| **CC 변경** | 기존 v2.1.78 agent frontmatter 일관성 |
| **설명** | 31개 agent 중 self-healing.md만 `effort:` / `maxTurns:` 대신 `reasoningEffort:` 사용 — 표준 필드명으로 통일 |
| **구현 범위** | agents/self-healing.md frontmatter 수정 |
| **영향 파일** | `agents/self-healing.md` |
| **예상 공수** | 0.5h |
| **YAGNI** | ✅ PASS — 일관성 문제, 1개 파일 수정 |
| **철학 준수** | Docs=Code ✅ |

### ENH-152: SUBPROCESS_ENV_SCRUB 보안 가이드 문서화 (P2)

| 항목 | 내용 |
|------|------|
| **CC 변경** | F-83-6: `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1` 추가 |
| **설명** | Enterprise 보안 가이드에 subprocess 환경 변수 보안 설정 문서화 |
| **구현 범위** | Enterprise 스킬 또는 보안 관련 문서에 추가 |
| **영향 파일** | `skills/enterprise/SKILL.md` 또는 `bkit-system/philosophy/` |
| **예상 공수** | 1h |
| **YAGNI** | ✅ PASS — Enterprise 사용자 보안 필수 정보 |

### ENH-153: Ctrl+F → Ctrl+X Ctrl+K 문서 업데이트 (P2)

| 항목 | 내용 |
|------|------|
| **CC 변경** | D-83-1: stop all background agents 키바인딩 변경 |
| **설명** | bkit 문서에서 Ctrl+F 참조를 Ctrl+X Ctrl+K로 업데이트 |
| **구현 범위** | 1개 문서 파일 수정 |
| **영향 파일** | `docs/02-design/features/claude-code-v2178-impact-analysis.design.md` |
| **예상 공수** | 0.5h |
| **YAGNI** | ✅ PASS — 잘못된 문서 수정 필수 |

### ENH-154: #38651 Stop hook -p 모드 리그레션 모니터링 (P3)

| 항목 | 내용 |
|------|------|
| **CC 변경** | #38651: Stop hook causes empty result in -p mode |
| **설명** | bkit unified-stop.js가 -p 모드에서 실행될 때 빈 결과 발생 가능성 모니터링 |
| **구현 범위** | 모니터링만 — bkit이 직접 -p 모드를 사용하지 않으므로 즉시 영향 없음 |
| **예상 공수** | monitor only |
| **YAGNI** | ⚠️ MONITOR — bkit CI/CD(`--bare` 또는 `-p`)에서 Stop hook 사용 시 영향 |

### ENH-155: Agent initialPrompt 활용 검토 (P3)

| 항목 | 내용 |
|------|------|
| **CC 변경** | F-83-10: Agent `initialPrompt` frontmatter 추가 |
| **설명** | 31개 agent에 initialPrompt 적용하여 자동 부트스트랩 검토 |
| **구현 범위** | 검토만 — 현재 agent들이 호출 시 prompt를 받으므로 즉시 필요성 불명확 |
| **예상 공수** | 검토만 |
| **YAGNI** | ❌ FAIL — agent는 호출 시 task prompt를 받으므로 initialPrompt 불필요 |

---

## 5. ENH 종합 로드맵

### 5.1 신규 ENH (v2.1.83)

| ENH | 제목 | 우선순위 | 상태 | 예상 공수 |
|-----|------|---------|------|----------|
| ENH-149 | CwdChanged hook — 프로젝트 전환 자동 감지 | **P1** | 미구현 | 2h |
| ENH-150 | FileChanged hook — PDCA 문서 변경 감시 | **P2** | 미구현 | 3h |
| ENH-151 | self-healing agent effort/maxTurns 수정 | **P1** | 미구현 | 0.5h |
| ENH-152 | SUBPROCESS_ENV_SCRUB 보안 문서화 | **P2** | 미구현 | 1h |
| ENH-153 | Ctrl+F → Ctrl+X Ctrl+K 문서 업데이트 | **P2** | 미구현 | 0.5h |
| ENH-154 | #38651 Stop hook -p 모드 모니터링 | **P3** | monitor | - |
| ENH-155 | Agent initialPrompt 활용 검토 | **P3** | YAGNI | - |

### 5.2 기존 미구현 ENH (업데이트)

| ENH | 제목 | 우선순위 | 상태 변경 |
|-----|------|---------|----------|
| ENH-134 | Skills effort frontmatter | **P0** | 미구현 유지 (36 skills) |
| ENH-138 | --bare CI/CD 가이드 | **P1** | 미구현 유지 |
| ENH-139+142 | Plugin freshness 배포 전략 | **P1** | 미구현 유지 |
| ENH-143 | 병렬 agent spawn 지연 workaround | **P1** | 미구현 유지 (#37520 여전히 OPEN) |
| ENH-148 | SessionStart env /clear 방어 | **P1** | 미구현 유지 (#37729 여전히 OPEN) |

### 5.3 구현 우선순위 요약

```
P0 (1건):  ENH-134 (skills effort) — ~4h
P1 (6건):  ENH-149, 151, 138, 139+142, 143, 148 — ~10.5h
P2 (8건):  ENH-150, 152, 153, 136, 141, 144, 145, 147 — ~13h
P3 (5건):  ENH-135, 137, 140, 154, 155 — monitor/YAGNI
```

---

## 6. CC 호환성 기록

```
v2.1.34 ────────────────────────────────── v2.1.83
          49개 연속 릴리스, 100% 호환
          0 breaking changes (bkit 기준)
```

| 항목 | v2.1.81 → v2.1.83 |
|------|-------------------|
| 연속 호환 릴리스 | 47 → **49** (+2, v2.1.82 스킵 포함) |
| CC hook events 총합 | 22 → **24** (+2: CwdChanged, FileChanged) |
| bkit 구현 hook events | 18 (미변경, 신규 2개 미구현) |
| Agent frontmatter 옵션 | effort, maxTurns, disallowedTools, **initialPrompt** (+1) |
| 추천 CC 버전 | **v2.1.83+** (bg agent 3개 수정, plugin disk cache, --resume 개선) |

---

## 7. 품질 체크리스트

- [x] 모든 CC 변경사항 캡처 (~56건)
- [x] 모든 변경사항 영향도 분류 (HIGH/MEDIUM/LOW/NONE)
- [x] 모든 ENH 우선순위 배정 (P0/P1/P2/P3)
- [x] 철학 준수 검증 (Automation First, No Guessing, Docs=Code)
- [x] 파일 영향 매트릭스 완성
- [x] 보고서 한국어 작성
- [x] GitHub Issues 모니터링 업데이트
- [x] YAGNI 검토 완료 (ENH-155 FAIL)
