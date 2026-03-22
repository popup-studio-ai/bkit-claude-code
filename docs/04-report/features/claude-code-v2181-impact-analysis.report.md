# Claude Code v2.1.81 영향 분석 보고서

> **Status**: ✅ Complete (Analysis Only)
>
> **Project**: bkit Vibecoding Kit
> **Version**: v2.0.0 (변경 없음)
> **Author**: CC Version Analysis Workflow
> **Completion Date**: 2026-03-21
> **PDCA Cycle**: #20

---

## Executive Summary

### 1.1 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **기능** | Claude Code v2.1.81 (1개 릴리스, ~26건 변경) 영향 분석 |
| **시작일** | 2026-03-21 |
| **완료일** | 2026-03-21 |
| **기간** | 1일 (분석만) |

### 1.2 성과 요약

```
┌──────────────────────────────────────────────┐
│  호환성: ✅ 100% 호환                         │
├──────────────────────────────────────────────┤
│  ✅ 변경사항:    26건 분석 완료               │
│  ✅ Breaking:   0건                          │
│  ✅ 호환성:     47 연속 호환 릴리스 확인      │
│  📋 ENH 기회:   3건 (ENH-138~140)            │
│  ⚠️  주의 사항: plugin dir 삭제 fix (#10)     │
└──────────────────────────────────────────────┘
```

### 1.3 전달된 가치

| 관점 | 내용 |
|------|------|
| **문제** | CC v2.1.81 릴리스의 ~26건 변경사항 중 bkit 영향 범위 확인 필요 |
| **해결 방법** | 4-Phase 워크플로우 (Research → Analyze → Brainstorm → Report) 자동 분석 |
| **기능/UX 효과** | Plugin freshness 자동 re-clone(#23), plugin dir 삭제 방어(#10), --bare flag CI/CD 활용, Bash 대시 권한 개선(#9) |
| **핵심 가치** | 47번째 연속 호환 릴리스 확인 (v2.1.34~v2.1.81, zero-downtime 업그레이드 보장) + bkit v2.0.0 코드 변경 불필요 |

---

## 2. CC v2.1.81 변경사항 전체 목록

**릴리스 일자**: 2026-03-21 (npm)
**이전 버전**: v2.1.80 (2026-03-20)

### 2.1 변경사항 분류

| # | 분류 | 변경사항 | 영향도 | bkit 영향 |
|---|------|---------|--------|-----------|
| 1 | Feature | `--bare` flag: scripted `-p` 호출 시 hooks/LSP/plugin sync/skill walks 스킵 | **HIGH** | 📋 ENH-138 (CI/CD 파이프라인 활용) |
| 2 | Feature | `--channels` permission relay: 채널 서버가 tool approval을 폰으로 전달 | MEDIUM | 📋 ENH-137 업데이트 (preview 진화) |
| 3 | Fix | 다중 동시 세션 OAuth 재인증 반복 수정 | MEDIUM | ✅ CTO Team 병렬 세션 안정성 혜택 |
| 4 | Fix | Voice mode: retry 실패 시 잘못된 "check your network" 메시지 | LOW | ❌ 없음 |
| 5 | Fix | Voice mode: WebSocket 연결 끊김 시 오디오 복구 불가 | LOW | ❌ 없음 |
| 6 | Fix | `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`: structured-outputs 헤더 미억제 → proxy 400 에러 | MEDIUM | ❌ 없음 (1st-party API 사용) |
| 7 | Fix | `--channels` bypass: Team/Enterprise org 설정 없을 때 우회 | LOW | ❌ 없음 |
| 8 | Fix | Node.js 18 크래시 수정 | MEDIUM | ✅ 자동 혜택 (Node 18 환경 사용자) |
| 9 | Fix | Bash 명령 대시(-) 포함 문자열에 불필요한 권한 프롬프트 | **HIGH** | ✅ bkit Bash hooks 직접 혜택 |
| 10 | Fix | Plugin hooks: 플러그인 디렉토리 세션 중 삭제 시 프롬프트 차단 | **HIGH** | ✅ bkit 핵심 안정성 혜택 |
| 11 | Fix | Background agent: task output polling race condition → 무한 대기 | **HIGH** | ✅ CTO Team Task agent 직접 혜택 |
| 12 | Fix | Worktree 세션 resume 시 worktree로 전환 | MEDIUM | ✅ worktree 사용자 혜택 |
| 13 | Fix | `/btw`: active response 중 paste 텍스트 누락 | MEDIUM | ✅ bkit /btw 스킬 직접 혜택 |
| 14 | Fix | tmux Cmd+Tab+paste clipboard copy 경쟁 | LOW | ✅ tmux 사용자 혜택 |
| 15 | Fix | Terminal tab title auto-generated session description 미반영 | LOW | ✅ 자동 혜택 (UX) |
| 16 | Fix | Invisible hook attachments가 transcript message count 부풀리기 | MEDIUM | ✅ bkit 18개 hook 직접 혜택 |
| 17 | Fix | Remote Control: generic title 대신 첫 프롬프트에서 제목 유도 | LOW | ❌ 없음 |
| 18 | Fix | `/rename`: Remote Control 세션 제목 동기화 미작동 | LOW | ❌ 없음 |
| 19 | Fix | Remote Control `/exit`: 세션 아카이빙 미완료 | LOW | ❌ 없음 |
| 20 | Fix | [VSCode] Windows PATH 상속 Git Bash 회귀 (v2.1.78) | LOW | ❌ 없음 (macOS 기반) |
| 21 | Improve | MCP read/search 도구: "Queried {server}" 1줄 축소 (Ctrl+O 확장) | MEDIUM | ✅ bkend MCP 사용 시 UX 개선 |
| 22 | Improve | `!` bash mode 디스커버빌리티: interactive command 필요 시 제안 | LOW | ✅ 자동 혜택 (UX) |
| 23 | Improve | Plugin freshness: ref-tracked 플러그인 매 로드 시 re-clone | **HIGH** | 📋 ENH-139 (자동 업데이트 전략) |
| 24 | Improve | Remote Control 세션 제목 3번째 메시지 후 갱신 | LOW | ❌ 없음 |
| 25 | Config | Plan mode: "clear context" 기본 숨김 (`showClearContextOnPlanAccept: true` 복원) | MEDIUM | 📋 ENH-140 (PDCA Plan 연계) |
| 26 | Config | Windows(WSL 포함): line-by-line 스트리밍 비활성화 | LOW | ❌ 없음 (macOS 기반) |

### 2.2 영향도 분포

```
HIGH:   5건 (#1, #9, #10, #11, #23) — bkit 핵심 관련
MEDIUM: 9건 (#2, #3, #6, #8, #12, #13, #16, #21, #25)
LOW:   12건 (#4, #5, #7, #14, #15, #17, #18, #19, #20, #22, #24, #26)
```

### 2.3 bkit 영향 분포

```
✅ 자동 혜택: 12건 (#3, #8, #9, #10, #11, #12, #13, #14, #15, #16, #21, #22) — 코드 변경 없이 개선
📋 ENH 기회:  4건 (#1, #2, #23, #25) — 선택적 활용 가능 (3 신규 + 1 기존 업데이트)
❌ 무관:      10건 (#4, #5, #6, #7, #17, #18, #19, #20, #24, #26)
```

---

## 3. bkit 영향 분석

### 3.1 컴포넌트 매핑

| CC 변경 | 영향받는 bkit 컴포넌트 | 영향 유형 |
|---------|----------------------|-----------|
| --bare flag | hooks/hooks.json, scripts/* (18개 hook) | 인식 필요 — bare 모드 시 bkit hooks 미실행 |
| Plugin dir 삭제 방어 (#10) | hooks/hooks.json, scripts/* 전체 | 자동 혜택 — 세션 중 plugin dir 삭제 시 안전 |
| Plugin freshness re-clone (#23) | .claude-plugin/plugin.json, hooks/hooks.json | 배포 전략 영향 — 매 로드 시 최신 반영 |
| Bash 대시 권한 fix (#9) | scripts/unified-bash-pre.js, scripts/permission-request-handler.js | 자동 혜택 — 불필요한 프롬프트 감소 |
| Background agent race fix (#11) | scripts/pdca-task-completed.js, scripts/subagent-stop-handler.js | 자동 혜택 — Task agent 안정성 |
| /btw paste fix (#13) | skills/btw/SKILL.md | 자동 혜택 — /btw 입력 안정성 |
| Hook attachment transcript (#16) | hooks/hooks.json (18개 event) | 자동 혜택 — 정확한 message count |
| MCP output 축소 (#21) | bkend MCP 연동 (5개 skills) | 자동 혜택 — UI 간결화 |
| Plan mode clear context (#25) | skills/plan-plus/SKILL.md, lib/pdca/phase.js | 동작 변경 인식 필요 |
| OAuth 다중 세션 fix (#3) | CTO Team (Agent Teams) | 자동 혜택 — 병렬 안정성 |

### 3.2 호환성 매트릭스

| bkit 구성요소 | 수량 | 호환성 | 비고 |
|--------------|------|--------|------|
| Agents | 31개 | ✅ 100% | 변경 영향 없음 |
| Skills | 36개 | ✅ 100% | /btw paste fix 자동 혜택 |
| Hooks | 18개 | ✅ 100% | transcript count fix 자동 혜택, --bare 시 스킵됨 (의도된 동작) |
| Lib Modules | 78개 | ✅ 100% | 변경 영향 없음 |
| Scripts | ~15개 | ✅ 100% | Bash 대시 권한 fix 자동 혜택 |

### 3.3 철학 준수 검증

| 철학 | ENH-138 | ENH-139 | ENH-140 |
|------|---------|---------|---------|
| Automation First | ✅ CI/CD 자동화 강화 | ✅ 자동 re-clone | ✅ 워크플로우 최적화 |
| No Guessing | ✅ 문서화 기반 | ✅ CC 공식 동작 | ⚠️ 기본값 변경 확인 필요 |
| Docs=Code | ✅ | ✅ | ✅ |

---

## 4. ENH 기회 상세

### ENH-138: --bare flag CI/CD 파이프라인 활용 (P1)

**변경**: CC v2.1.81에서 `--bare` flag 도입. scripted `-p` 호출 시 hooks, LSP, plugin sync, skill walks 전부 스킵. ANTHROPIC_API_KEY 필요, OAuth/keychain/auto-memory 비활성화.

**현황**:
- bkit은 interactive session 기반으로 동작 — 18개 hooks, 36개 skills 모두 interactive 세션 전제
- CI/CD 파이프라인에서 CC를 사용할 때 bkit hooks가 불필요하게 실행되는 케이스 존재 가능
- `phase-9-deployment` skill에서 CI/CD 관련 가이드 제공

**제안**:
1. `skills/claude-code-learning/SKILL.md`에 `--bare` flag 학습 내용 추가
2. `skills/phase-9-deployment/SKILL.md`에 CI/CD 파이프라인 `--bare` 사용 가이드 추가
3. bkit 문서에 "bkit hooks는 `--bare` 모드에서 실행되지 않음" 주의사항 명시
4. CI/CD 스크립트 예시: `claude --bare -p "run tests and report"` (bkit 오버헤드 제거)

**영향 파일**: `skills/claude-code-learning/SKILL.md`, `skills/phase-9-deployment/SKILL.md`
**YAGNI**: ✅ PASS — CI/CD 사용자에게 실질적 가치, 문서화 비용 극소

### ENH-139: Plugin freshness 자동 업데이트 전략 (P1)

**변경**: CC v2.1.81에서 ref-tracked 플러그인이 매 로드 시 re-clone하여 upstream 변경 즉시 반영

**현황**:
- bkit은 GitHub repository (`popup-studio-ai/bkit-claude-code`)에서 설치
- `.claude-plugin/plugin.json`에 `repository` field 명시
- 기존에는 사용자가 수동으로 `/reload-plugins` 또는 세션 재시작으로 업데이트
- `skills/claude-code-learning/SKILL.md`에 `/reload-plugins for forced refresh` 안내 있음

**제안**:
1. bkit 버전 배포 전략 재검토 — git tag/branch ref 사용 시 매 세션 자동 업데이트
2. `plugin.json`의 repository URL이 ref-tracked인지 확인 → 현재는 main branch 기본
3. `skills/claude-code-learning/SKILL.md`에서 `/reload-plugins` 안내를 자동 freshness 메커니즘으로 업데이트
4. 안정화 버전은 tag ref 사용, 개발 버전은 branch ref 사용하는 2-track 전략 고려

**영향 파일**: `.claude-plugin/plugin.json`, `skills/claude-code-learning/SKILL.md`
**YAGNI**: ✅ PASS — 배포 전략에 직접 영향, plugin.json repository field 이미 존재

### ENH-140: Plan mode clear context 기본 숨김 대응 (P2)

**변경**: CC v2.1.81에서 Plan mode 수락 시 "clear context" 옵션이 기본 숨김으로 변경. `showClearContextOnPlanAccept: true` 설정으로 복원 가능.

**현황**:
- bkit PDCA workflow에서 Plan phase 후 context 관리가 중요
- `scripts/context-compaction.js`에서 PreCompact 처리
- `skills/plan-plus/SKILL.md`에서 Phase 0~5 plan brainstorming 수행
- Plan 수락 후 context clear가 숨겨지면 대형 Plan 후 context 부족 가능성

**제안**:
1. bkit 사용자에게 `showClearContextOnPlanAccept: true` 설정 권장 여부 검토
2. `skills/claude-code-learning/SKILL.md`에 Plan mode 기본값 변경 안내 추가
3. PDCA Plan phase에서 대규모 plan 수립 후 자동 compact 제안 로직 검토

**영향 파일**: `skills/claude-code-learning/SKILL.md`, `skills/plan-plus/SKILL.md`
**YAGNI**: ⚠️ BORDERLINE — 기본값 변경이지만 bkit의 PreCompact hook이 이미 context 관리. P2 유지.

### ENH-137 업데이트: --channels permission relay (P3 유지)

**변경**: v2.1.81에서 `--channels`에 permission relay 기능 추가 — 채널 서버가 tool approval 프롬프트를 모바일로 전달 가능

**현황 업데이트**:
- v2.1.80: research preview (메시지 push만)
- v2.1.81: permission relay 추가 (tool approval 원격 승인)
- 여전히 preview 단계이나 기능 범위 확대 중

**제안 변경 없음**: preview 안정화 후 bkit MCP 서버에 channels 지원 추가 (P3 유지)

---

## 5. bkit 직접 혜택 상세 (코드 변경 불필요)

### 5.1 HIGH 영향 자동 혜택

| # | 변경사항 | bkit 혜택 | 관련 bkit 컴포넌트 |
|---|---------|-----------|-------------------|
| 9 | Bash 대시(-) 권한 프롬프트 제거 | bkit의 Bash PreToolUse (`scripts/unified-bash-pre.js`)에서 대시 포함 명령 실행 시 불필요한 권한 요청 감소. `npm run test-suite`, `git log --oneline` 등 일상적 명령의 UX 개선 | `scripts/unified-bash-pre.js`, `scripts/permission-request-handler.js` |
| 10 | Plugin dir 삭제 시 프롬프트 차단 방어 | bkit 플러그인 디렉토리가 세션 중 실수로 삭제되어도 CC가 안전하게 처리. 기존에는 전체 프롬프트 제출이 차단될 수 있었음 | `hooks/hooks.json` 전체, `scripts/*` 전체 |
| 11 | Background agent race condition 수정 | CTO Team 패턴에서 Task agent가 polling 사이에 완료될 때 무한 대기 방지. `scripts/pdca-task-completed.js`의 PDCA 자동 진행이 안정적으로 동작 | `scripts/pdca-task-completed.js`, `scripts/subagent-stop-handler.js` |

### 5.2 MEDIUM 영향 자동 혜택

| # | 변경사항 | bkit 혜택 |
|---|---------|-----------|
| 3 | OAuth 다중 세션 fix | CTO Team 병렬 에이전트 세션에서 OAuth 재인증 반복 방지 |
| 8 | Node.js 18 크래시 fix | Node 18 환경 사용자의 bkit hooks 안정성 확보 |
| 12 | Worktree resume 전환 | worktree 기반 개발 시 세션 resume 안정성 |
| 13 | /btw paste fix | bkit /btw 스킬에서 active response 중 제안 입력 안정성 |
| 16 | Hook attachment transcript fix | bkit 18개 hooks의 invisible attachment가 transcript count에 미포함 → 정확한 대화 길이 추적 |
| 21 | MCP output 축소 | bkend MCP 사용 시 read/search 결과가 1줄로 축소 → context 절약 |

---

## 6. GitHub Issues 모니터링

### 6.1 기존 이슈 상태 변경

| 이슈 | 상태 | 변경사항 |
|------|------|---------|
| #29423 | OPEN | task subagents ignore CLAUDE.md — 변동 없음 |
| #34197 | OPEN | CLAUDE.md ignored — 변동 없음 |
| #30613 | OPEN | HTTP hooks JSON broken — 변동 없음 |
| #33656 | OPEN | PostToolUse bash non-zero — 변동 없음 |
| #35296 | OPEN | 1M context 미작동 — 변동 없음 |
| #33963 | OPEN | OOM crash — 변동 없음 |
| #36059 | OPEN | PreToolUse permissionDecision regression — 변동 없음 |
| #36058 | OPEN | session_name in hook input — 변동 없음 |
| #36755 | OPEN | --resume crash (_.startsWith) — 변동 없음 |
| #36740 | OPEN | 스킬 description 미표시 — 변동 없음 |

### 6.2 v2.1.81 관련 이슈 연관성

| v2.1.81 변경 | 관련 기존 이슈 | 상태 |
|-------------|---------------|------|
| Plugin dir 삭제 방어 (#10) | 신규 fix — 기존 이슈 없음 | ✅ 해결 |
| Background agent race (#11) | CTO Team 관련 — #29423과 간접 연관 | ✅ 부분 개선 |
| Bash 대시 권한 (#9) | #36059 (PreToolUse regression)과 다른 영역 | ✅ 별도 해결 |
| /btw paste (#13) | 신규 fix — v2.1.79 이후 보고 | ✅ 해결 |

### 6.3 신규 주목 이슈

현재 v2.1.81에서 bkit에 영향을 미치는 신규 이슈 보고 없음. 모니터링 유지.

---

## 7. 연속 호환 릴리스 현황

```
v2.1.34 ────────────────────────────────────────────── v2.1.81
          47 consecutive compatible releases
          0 breaking changes (bkit 기준)
          ~726+ total changes analyzed
          Zero-downtime upgrade guaranteed
```

| 릴리스 범위 | 릴리스 수 | 분석 변경건 | ENH 도출 |
|-------------|-----------|------------|----------|
| v2.1.34~v2.1.48 | 15 | ~200 | ENH-32~55 |
| v2.1.49~v2.1.72 | 24 | ~350 | ENH-56~116 |
| v2.1.73~v2.1.79 | 7 | ~184 | ENH-117~133 |
| v2.1.80 | 1 | ~19 | ENH-134~137 |
| **v2.1.81** | **1** | **~26** | **ENH-138~140** |
| **합계** | **48** | **~779** | **140** |

---

## 8. File Impact Matrix

| 파일 | 변경 유형 | ENH 참조 | 테스트 영향 |
|------|----------|----------|-------------|
| `skills/claude-code-learning/SKILL.md` | 문서 업데이트 | ENH-138, 139, 140 | evals/capability/claude-code-learning/ |
| `skills/phase-9-deployment/SKILL.md` | 문서 업데이트 | ENH-138 | evals/capability/phase-9-deployment/ |
| `.claude-plugin/plugin.json` | 배포 전략 검토 | ENH-139 | test/v200-plugin-config.test.js |
| `skills/plan-plus/SKILL.md` | 동작 변경 인식 | ENH-140 | evals/capability/plan-plus/ |
| `hooks/hooks.json` | 변경 없음 (자동 혜택) | — | test/v200-hooks-config.test.js |
| `scripts/unified-bash-pre.js` | 변경 없음 (자동 혜택) | — | test/v200-bash-hooks.test.js |
| `scripts/pdca-task-completed.js` | 변경 없음 (자동 혜택) | — | test/v200-pdca-lifecycle.test.js |
| `scripts/permission-request-handler.js` | 변경 없음 (자동 혜택) | — | test/v200-permission.test.js |

---

## 9. 권장사항

### 9.1 즉시 조치 (코드 변경 불필요)

1. **CC v2.1.81 업그레이드 안전** — bkit v2.0.0 코드 변경 없이 업그레이드 가능
2. **자동 혜택 확인** — Bash 대시 권한 fix, plugin dir 삭제 방어, background agent race fix, /btw paste fix
3. **CC 권장 버전 업데이트** — v2.1.80+ → v2.1.81+ (5개 HIGH fix 포함)
4. **Plugin freshness 인식** — ref-tracked plugin은 매 로드 시 re-clone됨. bkit 개발 중 local 변경 시 주의

### 9.2 선택적 구현 (향후)

| 우선순위 | ENH | 설명 | 예상 작업량 |
|----------|-----|------|------------|
| P1 | ENH-138 | --bare flag CI/CD 가이드 | ~1시간 (SKILL.md 2개 업데이트) |
| P1 | ENH-139 | Plugin freshness 배포 전략 | ~2시간 (전략 수립 + 문서화) |
| P2 | ENH-140 | Plan mode clear context 가이드 | ~30분 (SKILL.md 1~2개 업데이트) |
| P3 | ENH-137 | --channels MCP 연구 (업데이트) | 대기 (preview 안정화 후) |

### 9.3 모니터링

- **Plugin freshness (#23)**: bkit이 ref-tracked로 설치된 경우 매 세션 시작 시 re-clone 발생. 네트워크 오프라인 시 동작 확인 필요
- **--bare flag (#1)**: CI/CD 환경에서 bkit hooks 의도적 비활성화 시나리오 모니터링
- **기존 이슈**: #29423, #34197, #36755, #36740 계속 모니터링

---

## 10. 시스템 프롬프트 변경 분석

### 10.1 변경 내용

v2.1.81에서는 주요 시스템 프롬프트 텍스트 변경 미확인. 기능적 동작 변경 중심 릴리스.

### 10.2 동작 변경 요약

| 항목 | 이전 | v2.1.81 |
|------|------|---------|
| Plan mode "clear context" | 수락 시 옵션 표시 | 기본 숨김 (`showClearContextOnPlanAccept: true`로 복원) |
| Plugin freshness | 수동 reload 필요 | ref-tracked 자동 re-clone |
| MCP read/search 출력 | 전체 결과 표시 | 1줄 요약 (Ctrl+O 확장) |

### 10.3 bkit 영향

- Plan mode 기본값 변경: bkit PDCA Plan phase에서 context 정리 옵션이 자동 숨겨짐 → PreCompact hook이 이미 context 관리하므로 실질 영향 최소
- MCP 출력 축소: bkend MCP 5개 skills 사용 시 context 절약 효과
- Plugin freshness: bkit 사용자가 항상 최신 버전 사용 → 버전 불일치 문제 감소

---

## 11. 주요 변경사항 Deep Dive

### 11.1 --bare flag 분석

```
claude --bare -p "analyze code quality"
```

**동작**:
- hooks.json의 18개 hooks 전부 스킵
- LSP (Language Server) 비활성화
- Plugin sync (re-clone) 스킵
- Skill walks (SKILL.md 탐색) 스킵
- OAuth/keychain 비활성화 → ANTHROPIC_API_KEY 환경변수 필수
- Auto-memory 비활성화

**bkit 관점**:
- `--bare` 모드에서 bkit은 완전히 비활성화됨 (hooks, skills 모두 스킵)
- CI/CD, 스크립팅 용도에 적합 — bkit 오버헤드 없이 순수 LLM 호출
- bkit PDCA 워크플로우와는 독립적 사용 케이스

### 11.2 Plugin freshness re-clone 분석

**이전**: 사용자가 `/reload-plugins` 또는 세션 재시작으로 수동 업데이트
**현재**: ref-tracked 플러그인은 매 로드(세션 시작) 시 자동 re-clone

**bkit 관점**:
- `plugin.json`에 `"repository": "https://github.com/popup-studio-ai/bkit-claude-code"` 명시
- main branch tracking 시 → 매 세션 시작마다 최신 main 자동 반영
- **장점**: 사용자가 항상 최신 bkit 사용, 수동 업데이트 불필요
- **주의점**: 개발 중 local 변경이 re-clone으로 덮어씌워질 수 있음
- **권장**: 안정 릴리스는 tag ref, 개발은 local clone 사용

### 11.3 Background agent race condition 상세

**이전**: Task agent가 polling interval 사이에 완료되면 output 수집 불가 → 무한 대기
**현재**: 완료 감지 로직 개선으로 race condition 해소

**bkit 관점**:
- CTO Team 패턴에서 3+ 병렬 Task agent 사용
- `scripts/pdca-task-completed.js`에서 TaskCompleted hook 처리
- `scripts/subagent-stop-handler.js`에서 SubagentStop 처리
- 이 fix로 병렬 agent 완료 시 무한 대기 문제 해소 → CTO Team 안정성 대폭 향상
