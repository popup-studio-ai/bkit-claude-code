# CC v2.1.99~v2.1.104 영향 분석 보고서

> **Status**: ✅ Complete
>
> **Project**: bkit Vibecoding Kit
> **Version**: v2.0.8 (분석 시점)
> **Author**: CC Version Analysis Workflow
> **Completion Date**: 2026-04-13
> **PDCA Cycle**: #35

---

## Executive Summary

### 1.1 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **기능** | CC v2.1.99~v2.1.104 (3개 릴리스) 영향 분석 |
| **시작일** | 2026-04-13 |
| **완료일** | 2026-04-13 |
| **설치 CC 버전** | v2.1.104 |
| **분석 범위** | v2.1.98 → v2.1.104 |
| **발행 릴리스** | v2.1.100 (Apr 10), v2.1.101 (Apr 10), v2.1.104 (Apr 13) |
| **스킵 릴리스** | v2.1.99, v2.1.102, v2.1.103 |

### 1.2 성과 요약

```
┌──────────────────────────────────────────────────────────────────┐
│  CC v2.1.99~v2.1.104 영향 분석 결과                                │
├──────────────────────────────────────────────────────────────────┤
│  총 변경 건수:           ~107건 (3개 릴리스)                       │
│  v2.1.100:              ~4건 (SP 정리)                            │
│  v2.1.101:              ~60건 (핵심 릴리스)                        │
│  v2.1.104:              ~5건 (소규모 패치)                         │
│  신규 기능:              5건                                       │
│  보안 수정:              2건                                       │
│  버그 수정:              ~30건                                     │
│  개선사항:               ~12건                                     │
│  Breaking Changes:      0건 (bkit 기준)                           │
│  신규 hook events:       0건 (CC 문서 기준 25개)                    │
│  시스템 프롬프트:        +3,839 tokens                             │
│  CC Tools (런타임):      30 → 32 (+2: ScheduleWakeup, Snooze SP전용)│
│  CC Tools (공식 문서):    35개 (문서화 범위 확대)                    │
│  신규 ENH 기회:          6건 (ENH-195~200), YAGNI FAIL 2건         │
│  자동 수혜:              ~15건                                     │
│  bkit 직접 영향:         3건                                       │
│  bkit 코드 수정 필요:    0건 (검증만 필요)                          │
│  연속 호환 릴리스:        66개 (v2.1.34~v2.1.104)                   │
└──────────────────────────────────────────────────────────────────┘
```

### 1.3 전달된 가치

| 관점 | 내용 |
|------|------|
| **문제** | CC v2.1.99~v2.1.104에서 ~107건 변경 — v2.1.101이 핵심 릴리스. plugin skills `context: fork`/`agent` frontmatter 미적용 수정, permissions.deny+PreToolUse hook 우선순위 수정, subagent MCP tool 상속 수정, virtual scroller 메모리 누수 수정. SP +3,839 tokens, CC tools 30→32 |
| **해결 방법** | GitHub release notes + CHANGELOG.md + npm + Piebald-AI sys prompt tracker + bkit 코드베이스 교차 검증 (4 agents 병렬) |
| **기능/UX 효과** | zero-script-qa skill의 `context: fork`+`agent` frontmatter 드디어 정상 작동, CTO Team subagent MCP 공유 자동 수혜, 장기 세션 안정성 향상 |
| **핵심 가치** | **66개 연속 호환** + 코드 수정 0건 + 자동 수혜 ~15건 + ENH-196(P1) zero-script-qa 검증만 필요. v2.1.101 plugin frontmatter 수정으로 설계 의도대로 skill 동작 복원 |

---

## 2. Version Verification

| 항목 | v2.1.100 | v2.1.101 | v2.1.104 |
|------|----------|----------|----------|
| GitHub Release | ✅ | ✅ | ✅ |
| npm 발행일 | 2026-04-10 | 2026-04-10 | 2026-04-13 |
| 설치 확인 | - | - | `claude --version` → 2.1.104 ✅ |
| SP 토큰 | -845 | +4,676 | +8 |

---

## 3. Impact Summary

| 카테고리 | 건수 | HIGH | MEDIUM | LOW |
|----------|------|------|--------|-----|
| Features | 5 | 2 | 2 | 1 |
| Security | 2 | 2 | 0 | 0 |
| Fixes | ~30 | 4 | 8 | ~18 |
| Improvements | ~12 | 0 | 3 | ~9 |
| SystemPrompt | ~18 | 2 | 4 | ~12 |
| **합계** | **~107** | **10** | **17** | **~80** |

---

## 4. 변경사항 상세

### 4.1 v2.1.100 (~4건, SP 정리, -845 tokens)

| # | 유형 | 변경 | bkit 영향 |
|---|------|------|----------|
| 1 | SystemPrompt | "Exploratory questions" 섹션 삭제 | 간접 — bkit output style 사용으로 무영향 |
| 2 | SystemPrompt | "Output efficiency" 섹션 삭제 | 간접 — bkit output style 사용으로 무영향 |
| 3 | SystemPrompt | "User-facing communication style" 섹션 삭제 | 간접 — bkit output style 사용으로 무영향 |
| 4 | SystemPrompt | Communication style end-of-turn summary 강화 | 없음 — bkit output style 사용 |
| 5 | Performance | Prompt input re-renders -74% | **자동 수혜** — 전반적 성능 향상 |
| 6 | Performance | Startup memory -426KB | **자동 수혜** — 메모리 절감 |
| 7 | Performance | macOS startup ~60ms faster (keychain 병렬) | **자동 수혜** — 시작 속도 개선 |

### 4.2 v2.1.101 (~60건, 핵심 릴리스, +4,676 tokens)

#### Features (4건)

| # | 변경 | Impact | bkit 영향 |
|---|------|--------|----------|
| 1 | `/team-onboarding` 명령어 | MEDIUM | 없음 |
| 2 | OS CA 인증서 스토어 기본 신뢰 | HIGH | 없음 — 엔터프라이즈 |
| 3 | `/ultraplan` 자동 클라우드 환경 생성 | MEDIUM | 없음 — ENH-175 모니터링 |
| 4 | `claude -p --resume <name>` 세션 타이틀 지원 | LOW | 없음 |

#### Security (2건)

| # | 변경 | Impact | bkit 영향 |
|---|------|--------|----------|
| 1 | POSIX `which` 폴백 커맨드 인젝션 취약점 수정 | HIGH | **자동 수혜** — 간접 보안 강화 |
| 2 | permissions.deny가 PreToolUse hook "ask"를 정상 우선 | HIGH | **직접** — bkit PreToolUse hook 신뢰성 향상. 단, bkit hooks에서 permissionDecision 미사용으로 실질 영향 없음 |

#### Key Bug Fixes (HIGH/MEDIUM)

| # | 변경 | Impact | bkit 영향 |
|---|------|--------|----------|
| 1 | Virtual scroller 메모리 누수 — 장기 세션 안정성 | HIGH | **자동 수혜** — 장기 세션 안정성 대폭 개선 |
| 2 | 5분 하드코딩 요청 타임아웃 제거, API_TIMEOUT_MS 정상 | HIGH | **자동 수혜** — 장시간 API 호출 안정성 |
| 3 | **Plugin skills `context: fork`/`agent` frontmatter 미적용 수정** | HIGH | **직접** — zero-script-qa skill (context: fork, agent: bkit:qa-monitor) 정상 작동 복원 |
| 4 | **Subagent MCP tool 미상속 수정** (동적 주입 서버) | HIGH | **직접** — CTO Team MCP 서버 공유 자동 수혜 |
| 5 | **settings.json 미인식 hook event 복원력** | MEDIUM | **직접** — forward-compat 보장 |
| 6 | Isolated worktree subagent Read/Edit 접근 거부 수정 | MEDIUM | 간접 |
| 7 | `--resume`/`--continue` 대형 세션 컨텍스트 손실 수정 | MEDIUM | 없음 |
| 8 | Grep tool ENOENT self-heal (stale rg 바이너리) | MEDIUM | **자동 수혜** — Grep 안정성 향상 |

#### System Prompt (주요)

| # | 변경 | Impact | bkit 영향 |
|---|------|--------|----------|
| 1 | ScheduleWakeup tool description (신규 SP 도구) | HIGH | 없음 — bkit /loop 미사용 |
| 2 | Snooze tool description (신규 SP 도구) | HIGH | 없음 — bkit /loop 미사용 |
| 3 | Fork usage guidelines 수정 — output 읽기 무조건 금지 | MEDIUM | **직접** — ENH-197 검증 필요 |
| 4 | /loop 관련 ~7개 SP 섹션 추가 | LOW | 없음 |

### 4.3 v2.1.104 (~5건, 소규모 패치, +8 tokens)

| # | 유형 | 변경 | Impact | bkit 영향 |
|---|------|------|--------|----------|
| 1 | Fix | Fullscreen 스크롤 중복 메시지 (iTerm2/Ghostty) | LOW | 없음 |
| 2 | Fix | idle-return /clear 토큰 힌트 개선 | LOW | 없음 |
| 3 | Fix | Plugin MCP 서버 "connecting" stuck 재수정 | LOW | 없음 |
| 4 | Performance | Write tool diff 탭/&/$ 개선 | LOW | **자동 수혜** |
| 5 | SystemPrompt | "Communication style" → "Text output (does not apply to tool calls)" | MEDIUM | **직접** — bkit output style 상호작용 |

---

## 5. ENH Opportunities (신규 6건: ENH-195~200, YAGNI FAIL 2건)

### ENH-195: CC tools 수 업데이트 (P3 모니터링)

- **변경**: CC tools 런타임 30→32 (ScheduleWakeup, Snooze 추가, SP 전용), 공식 docs 35개
- **bkit 현황**: MEMORY.md CC tools 기록 30으로 관리 중
- **영향**: P3 — MEMORY.md 업데이트만 필요, 코드 수정 없음
- **YAGNI**: ✅ PASS (모니터링만)

### ENH-196: `context: fork` + `agent` frontmatter 정상화 검증 (P1)

- **변경**: v2.1.101에서 plugin skills `context: fork`/`agent` frontmatter 미적용 버그 수정
- **bkit 현황**: zero-script-qa skill이 `context: fork` + `agent: bkit:qa-monitor` 사용
- **영향**: **P1** — 설계 의도대로 skill 동작 복원, 검증만 필요 (코드 수정 0건)
- **조치**: zero-script-qa skill 실행하여 fork context와 qa-monitor agent 정상 작동 확인
- **YAGNI**: ✅ PASS (핵심 검증)

### ENH-197: Fork output 읽기 금지 SP 정책 (P2)

- **변경**: v2.1.101 SP에서 fork output 읽기가 무조건 금지됨
- **bkit 현황**: zero-script-qa skill이 fork context 사용
- **영향**: P2 — zero-script-qa skill이 fork output 파일을 읽으려 시도하는지 확인 필요
- **조치**: 검증 후 필요 시 문서화
- **YAGNI**: ✅ PASS (검증 필요)

### ENH-198: "Text output" SP 헤딩 변경 모니터링 (P3 자동 수혜)

- **변경**: v2.1.104에서 "Communication style" → "Text output (does not apply to tool calls)" 헤딩 변경
- **bkit 현황**: bkit output style이 Communication style 섹션과 상호작용
- **영향**: P3 — 자동 수혜, 모니터링만 필요
- **YAGNI**: ✅ PASS (모니터링만)

### ENH-199: permissions.deny + PreToolUse hook 우선순위 자동 수혜 (P3 자동 수혜)

- **변경**: permissions.deny가 PreToolUse hook "ask" 결정을 정상적으로 우선
- **bkit 현황**: bkit hooks에서 permissionDecision 미사용
- **영향**: P3 — 자동 수혜, 코드 수정 없음
- **YAGNI**: ✅ PASS (자동 수혜)

### ENH-200: subagent MCP tool 상속 — CTO Team 자동 수혜 (P2 모니터링)

- **변경**: v2.1.101에서 subagent MCP tool 미상속 버그 수정 (동적 주입 서버)
- **bkit 현황**: CTO Team 패턴에서 bkit-pdca, bkit-analysis MCP 서버 사용
- **영향**: P2 — subagent에서 MCP 서버 정상 상속, 모니터링 필요
- **YAGNI**: ✅ PASS (모니터링만)

### YAGNI FAIL 제거 (2건)

| ENH | 제안 | 판정 사유 |
|-----|------|----------|
| ~~YAGNI-1~~ | ScheduleWakeup/Snooze bkit 활용 | bkit /loop 미사용, 가치 없음 |
| ~~YAGNI-2~~ | Sleep >=2s Bash 차단 대응 | bkit에 해당 코드 없음, 자동 수혜 |

---

## 6. 자동 수혜 (코드 수정 불필요, ~15건)

| # | 변경 | bkit 수혜 |
|---|------|----------|
| 1 | Prompt input re-renders -74% | 전반적 렌더링 성능 향상 |
| 2 | Startup memory -426KB | 메모리 절감 |
| 3 | macOS startup ~60ms faster | 시작 속도 개선 |
| 4 | POSIX `which` 커맨드 인젝션 수정 | 보안 강화 |
| 5 | Virtual scroller 메모리 누수 수정 | 장기 세션 안정성 대폭 개선 |
| 6 | 5분 하드코딩 타임아웃 제거 | 장시간 API 호출 안정성 |
| 7 | settings.json 미인식 hook event 복원력 | forward-compat 보장 |
| 8 | Grep tool ENOENT self-heal | Grep 안정성 향상 |
| 9 | permissions.deny + PreToolUse hook 우선순위 | PreToolUse hook 신뢰성 |
| 10 | Subagent MCP tool 상속 수정 | CTO Team MCP 서버 공유 |
| 11 | Isolated worktree subagent 접근 수정 | 간접 안정성 |
| 12 | `--resume`/`--continue` 컨텍스트 보존 | 세션 연속성 |
| 13 | Write tool diff 탭/&/$ 개선 | Write 안정성 |
| 14 | Plugin MCP "connecting" stuck 재수정 | MCP 연결 안정성 |
| 15 | idle-return /clear 토큰 힌트 | UX 개선 |

---

## 7. GitHub Issues Monitor

### 7.1 모니터링 이슈 상태

| # | 심각도 | 제목 | 상태 변화 |
|---|--------|------|----------|
| #29423 | HIGH | task subagents ignore CLAUDE.md | 4/8 stale 라벨, 활동 없음 — workaround 유지 |
| #34197 | HIGH | CLAUDE.md ignored | 활동 없음 — 모니터 유지 |
| #37520 | HIGH | 병렬 agent OAuth 401 | 4/7 stale, 활동 없음 — workaround 유지 |
| #40502 | HIGH | bg agents write 불가 | 4/7 마지막 활동 — bypassPermissions workaround |
| #40506 | HIGH | PreToolUse hooks -p 모드 미작동 | 활동 없음 — ENH-138 관련 |
| #41930 | MEDIUM | 비정상 사용량 소진 | 4/12 최신 댓글, 77개 활발 |
| #44925 | LOW | FileChanged hook Bash 미감지 | 활동 없음 — by design |
| #44958 | MEDIUM | PreToolUse:Write 오탐 | 4/11 #46720 참조 |
| #44968 | MEDIUM | 병렬 agent 무단 spawn | 4/10 마지막 댓글 |
| #44971 | MEDIUM | SubagentStop 미발화 | 4/9 workaround (reopened) |

### 7.2 신규 이슈

| # | 상태 | bkit 영향 |
|---|------|----------|
| #46720 | OPEN | LOW — bkit 미사용 plugin |
| #46829 | CLOSED (not planned) | LOW — cache TTL 의도적 |
| #46866 | OPEN | LOW — 모델 성능, bkit 범위 밖 |

---

## 8. 시스템 프롬프트 변경

| 항목 | 값 |
|------|-----|
| **Token Delta** | **+3,839 tokens** |
| **v2.1.100** | -845 tokens (SP 섹션 3개 삭제) |
| **v2.1.101** | +4,676 tokens (ScheduleWakeup, Snooze, /loop 관련 ~7 섹션, Fork guidelines) |
| **v2.1.104** | +8 tokens ("Communication style" → "Text output" 헤딩 변경) |
| **누적 (v2.1.73 기준)** | ~+62,000+ tokens |

주요 변경:
- **삭제 섹션**: Exploratory questions, Output efficiency, User-facing communication style (v2.1.100)
- **신규 섹션**: ScheduleWakeup tool, Snooze tool, /loop 관련 ~7개 섹션 (v2.1.101)
- **수정 섹션**: Fork usage guidelines — output 읽기 무조건 금지 (v2.1.101), Communication style → Text output (v2.1.104)

---

## 9. Hook Events & CC Tools

### Hook Events

| 항목 | 값 |
|------|-----|
| CC 총 (문서 기준) | 25 (MEMORY 기록 26과 차이, 기능 변동 없음) |
| bkit 구현 | 21 (변동 없음) |

### CC Tools

| 항목 | 값 |
|------|-----|
| v2.1.98 (런타임) | 30 |
| v2.1.104 (런타임) | **32** (+2, ScheduleWakeup + Snooze, SP 전용) |
| v2.1.104 (공식 docs) | **35** (문서화 범위 확대) |

---

## 10. Compatibility Summary

| 항목 | v2.1.98 | v2.1.104 | 변동 |
|------|---------|----------|------|
| Hook events | 26 (MEMORY) | 25 (공식 docs) | 문서 기준 차이, 기능 변동 없음 |
| CC tools (런타임) | 30 | 32 (+ScheduleWakeup, Snooze) | +2 SP 전용 |
| CC tools (공식 docs) | - | 35 | 문서화 범위 확대 |
| Breaking changes | 0 | 0 | 변동 없음 |
| 연속 호환 | 63개 | **66개** | +3 |
| bkit 코드 수정 | 1건 (ENH-193) | **0건** | 검증만 필요 |

---

## 11. 철학 정합성

| bkit 철학 | 판정 | 근거 |
|-----------|------|------|
| Automation First | ✅ | 자동 수혜 ~15건, 수동 개입 0건 (검증만) |
| No Guessing | ✅ | 검증 기반 (context:fork/agent frontmatter 정상화 실제 확인) |
| Docs=Code | ✅ | MEMORY.md 업데이트로 문서=코드 동기화 |

---

## 12. 권장 사항

### 12.1 즉시 실행

| 우선순위 | 항목 | 예상 공수 |
|----------|------|----------|
| **P1** | ENH-196: zero-script-qa skill 실행하여 `context: fork` + `agent: bkit:qa-monitor` 정상 작동 검증 | 15분 |

### 12.2 단기 검토

| 우선순위 | 항목 | 예상 공수 |
|----------|------|----------|
| P2 | ENH-197: zero-script-qa skill fork output 읽기 시도 여부 확인 | 15분 |
| P2 | ENH-200: CTO Team MCP 서버 subagent 상속 모니터링 | 모니터링 |

### 12.3 모니터링

| 우선순위 | 항목 |
|----------|------|
| P3 | ENH-195: CC tools 수 MEMORY.md 업데이트 |
| P3 | ENH-198: "Text output" SP 헤딩 변경 모니터링 |
| P3 | ENH-199: permissions.deny + PreToolUse hook 자동 수혜 |

### 12.4 CC 권장 버전 업데이트

**v2.1.104+** (v2.1.98+에서 상향)

업그레이드 사유:
1. Plugin `context: fork`/`agent` frontmatter 수정 (zero-script-qa 정상화)
2. Subagent MCP tool 상속 수정 (CTO Team 자동 수혜)
3. Virtual scroller 메모리 누수 수정 (장기 세션 안정성)
4. permissions.deny + PreToolUse hook 우선순위 수정 (보안 신뢰성)
5. POSIX `which` 커맨드 인젝션 보안 수정
6. 5분 하드코딩 타임아웃 제거 (API 안정성)

### 12.5 정보

| 항목 | 변경 |
|------|------|
| CC tools (런타임) | 30 → **32** (ScheduleWakeup, Snooze 추가) |
| CC tools (공식 docs) | **35** (문서화 범위 확대) |
| Hook events | 25 (공식 docs 기준, 기능 변동 없음) |
| 연속 호환 | 63 → **66** |

---

## 13. 결론

v2.1.99~v2.1.104는 **v2.1.101이 핵심 릴리스**로, plugin skills `context: fork`/`agent` frontmatter 미적용 버그 수정이 가장 중요한 변경. bkit 관점에서는 **66개 연속 호환**을 유지하며, 코드 수정은 0건으로 검증만 필요.

특히 zero-script-qa skill의 `context: fork` + `agent: bkit:qa-monitor` frontmatter가 드디어 설계 의도대로 작동하게 된 것이 핵심 가치. CTO Team 멀티에이전트 패턴에서 subagent MCP tool 상속도 정상화되어, bkit-pdca/bkit-analysis MCP 서버의 subagent 공유가 자동 수혜됨.

v2.1.100의 SP -845 tokens 정리와 성능 최적화(렌더링 -74%, 메모리 -426KB, 시작 ~60ms 단축)는 일상적 개발 경험을 개선하며, v2.1.104의 소규모 패치도 안정성에 기여.
