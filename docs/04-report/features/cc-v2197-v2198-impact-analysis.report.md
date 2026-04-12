# CC v2.1.97~v2.1.98 영향 분석 보고서

> **Status**: ✅ Complete
>
> **Project**: bkit Vibecoding Kit
> **Version**: v2.0.8 (분석 시점)
> **Author**: CC Version Analysis Workflow
> **Completion Date**: 2026-04-10
> **PDCA Cycle**: #34

---

## Executive Summary

### 1.1 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **기능** | CC v2.1.97~v2.1.98 (1개 릴리스) 영향 분석 |
| **시작일** | 2026-04-10 |
| **완료일** | 2026-04-10 |
| **설치 CC 버전** | v2.1.98 |
| **분석 범위** | v2.1.97 → v2.1.98 |
| **v2.1.98 발행일** | 2026-04-09 |

### 1.2 성과 요약

```
┌──────────────────────────────────────────────────────────────────┐
│  CC v2.1.97~v2.1.98 영향 분석 결과                                │
├──────────────────────────────────────────────────────────────────┤
│  총 변경 건수:           ~57건 (CLI ~53 + VSCode 1 + 기타 3)      │
│  신규 기능:              8건                                      │
│  보안 수정:              7건                                      │
│  버그 수정:              33건                                     │
│  개선사항:               9건                                      │
│  Breaking Changes:      0건 (bkit 기준)                          │
│  신규 hook events:       0건 (CC 총 26, 변동 없음)                 │
│  시스템 프롬프트:        +2,045 tokens                            │
│  CC Tools:               29 → 30 (+1, Monitor tool 추가)         │
│  신규 ENH 기회:          2건 (ENH-193~194), YAGNI FAIL 3건 제거   │
│  자동 수혜:              10건                                     │
│  bkit 직접 영향:         3건 (MCP _meta fix, Stop hooks, /reload) │
│  bkit 코드 수정 필요:    1건 (ENH-193: MCP _meta key 방어적 수정)  │
│  연속 호환 릴리스:        63개 (v2.1.34~v2.1.98)                  │
│  GitHub Issues 해결:     2건 (#42778, #45954 CLOSED)              │
└──────────────────────────────────────────────────────────────────┘
```

### 1.3 전달된 가치

| 관점 | 내용 |
|------|------|
| **문제** | CC v2.1.98에서 ~57건 변경 — 보안 중심 릴리스. Bash permission bypass 취약점 4건, compound command bypass, env-var prefix bypass, /dev/tcp redirect bypass 등 7건 보안 수정. Monitor tool 추가(CC tools 30), 시스템 프롬프트 +2,045 tokens |
| **해결 방법** | GitHub release notes + CHANGELOG.md + npm + Piebald-AI sys prompt tracker + bkit 코드베이스 교차 검증 (2 agents 병렬) |
| **기능/UX 효과** | MCP _meta persist 수정(bkit 500K 오버라이드 영향), Stop/SubagentStop 추가 안정화, 429 retry 추가 보강, /reload-plugins 스킬 핫리로드 |
| **핵심 가치** | **63개 연속 호환** + 코드 수정 1건(ENH-193 방어적 수정) + 자동 수혜 10건 + 보안 7건 자동 강화. ENH-193(P0)은 MCP _meta key 형식 검증으로 500K 오버라이드 안정성 확보 필요 |

---

## 2. Version Verification

| 항목 | v2.1.98 |
|------|---------|
| GitHub Release | ✅ |
| npm 발행일 | 2026-04-09 |
| npm dist-tag (latest) | 2.1.98 ✅ |
| 설치 확인 | `claude --version` → 2.1.98 ✅ |
| 시스템 프롬프트 | +2,045 tokens |

---

## 3. Impact Summary

| 카테고리 | 건수 | HIGH | MEDIUM | LOW |
|----------|------|------|--------|-----|
| Features | 8 | 2 | 2 | 4 |
| Security | 7 | 2 | 4 | 1 |
| Fixes | 33 | 1 | 8 | 24 |
| Improvements | 9 | 0 | 3 | 6 |
| **합계** | **57** | **5** | **17** | **35** |

---

## 4. 변경사항 상세

### 4.1 HIGH Impact (5건)

| # | 유형 | 변경 | bkit 영향 |
|---|------|------|----------|
| 1 | Feature | **Monitor tool 추가** — CC tools 29→30. 백그라운드 스크립트 스트리밍 이벤트 모니터링 | bkit agents는 whitelist 방식이라 자동 노출 안됨. **영향 없음** |
| 2 | Feature | **Subprocess sandboxing (PID namespace)** — Linux 전용, CLAUDE_CODE_SUBPROCESS_ENV_SCRUB 강화, CLAUDE_CODE_SCRIPT_CAPS 추가 | bkit Linux 비대상, macOS 기반. **영향 없음** |
| 3 | Security | **Bash tool permission bypass (backslash escape)** — 백슬래시 이스케이프로 auto-allow 우회 취약점 수정 | **자동 수혜** — bkit hooks/scripts 보안 강화 |
| 4 | Security | **Compound Bash command permission bypass** — auto/bypass-permissions 모드에서 복합 명령 강제 프롬프트 우회 수정 | **자동 수혜** — 보안 강화 |
| 5 | Fix | **MCP `_meta["anthropic/maxResultSizeChars"]` persist bypass** — persist 레이어가 _meta 크기 오버라이드를 바이패스하지 못하던 문제 수정 | **bkit ENH-193 직접 관련** — 500K 오버라이드 안정성 |

### 4.2 MEDIUM Impact (17건)

| # | 유형 | 변경 | bkit 영향 |
|---|------|------|----------|
| 6 | Feature | **Google Vertex AI Setup Wizard** — Bedrock에 이어 GCP도 대화형 설정 지원 | bkit GCP 미사용. **영향 없음** |
| 7 | Feature | **CLAUDE_CODE_PERFORCE_MODE** — Perforce 워크플로우 지원 | bkit git 기반. **영향 없음** |
| 8 | Security | **Env-var prefix read-only bypass** — 알려진 안전 변수 외 프롬프트 표시 | **자동 수혜** — 환경변수 보안 강화 |
| 9 | Security | **/dev/tcp, /dev/udp redirect bypass** — 네트워크 리다이렉트 auto-allow 수정 | **자동 수혜** — 네트워크 보안 강화 |
| 10 | Security | **--dangerously-skip-permissions silent downgrade** — 보호 경로 쓰기 후 accept-edits 강등 수정 | bkit 미사용. **영향 없음** |
| 11 | Security | **Permission rules JS prototype match** — toString 등과 권한 규칙 이름 충돌 수정 | bkit permission arrays 비어있음. **영향 없음** |
| 12 | Fix | **Streaming fallback timeout** — 스트리밍 중단 시 non-streaming 폴백 | **자동 수혜** — 장기세션 안정성 |
| 13 | Fix | **429 retry Retry-After 개선** — v2.1.97 수정 추가 보강 | **자동 수혜** — CTO Team 다중 agent 안정성 |
| 14 | Fix | **Managed-settings allow rules 잔류** — 관리자 규칙 제거 즉시 반영 | Enterprise 전용, bkit 무관 |
| 15 | Fix | **additionalDirectories 중간세션 반영** — 재시작 없이 디렉토리 추가/제거 | bkit 미사용. **영향 없음** |
| 16 | Fix | **Bash wildcard permission rules whitespace** — 와일드카드 규칙 공백/탭 처리 | **자동 수혜** — permission 안정성 |
| 17 | Fix | **Bash false permission prompts** — cut, paste, column, awk 등 오탐 제거 | **자동 수혜** — hooks/scripts 불필요 프롬프트 감소 |
| 18 | Fix | **Stop/SubagentStop hooks 장기세션 추가 수정** — v2.1.97 보강 | **bkit 직접 영향** — unified-stop.js, subagent-stop-handler.js 수혜 |
| 19 | Fix | **Remote Control permission handler 메모리 누수** — 세션 수명 핸들러 누수 수정 | 간접 수혜 |
| 20 | Fix | **Background subagent 부분 진행 보고** | **자동 수혜** — CTO Team 패턴 간접 수혜 |
| 21 | Fix | **Stale subagent worktree cleanup** — untracked 파일 worktree 보호 | bkit worktree 미사용. **영향 없음** |
| 22 | Improvement | **/reload-plugins 스킬 반영** — **bkit 37 skills 핫리로드**. 재시작 없이 변경 반영 | **bkit 직접 영향** — 개발 워크플로우 개선 |
| 23 | Improvement | **/agents 탭 레이아웃** — Running/Library 탭 분리 | 간접 수혜 — 가시성 개선 |
| 24 | Improvement | **Hook 에러 stderr 첫 줄 표시** — --debug 없이 자가 진단 | **자동 수혜** — bkit 21 hooks 디버깅 가시성 |

### 4.3 LOW Impact (35건)

| # | 유형 | 변경 | bkit 영향 |
|---|------|------|----------|
| 25 | Feature | CLAUDE_CODE_SCRIPT_CAPS 세분화 | Linux 전용, 무관 |
| 26 | Feature | PID namespace isolation | Linux 전용, 무관 |
| 27 | Feature | Google Cloud Vertex AI auth flow | 무관 |
| 28 | Feature | Perforce 통합 명령어 | 무관 |
| 29 | Security | Bash backslash escape edge case 추가 케이스 | 자동 수혜 |
| 30 | Fix | NO_FLICKER 다수 폴리싱 | 무관 |
| 31 | Fix | /resume 추가 안정화 | 간접 수혜 |
| 32 | Fix | Managed-settings 동기화 edge case | Enterprise 전용, 무관 |
| 33 | Fix | MCP OAuth token refresh 추가 수정 | bkit MCP OAuth 미사용 |
| 34 | Fix | Subagent transcript 추가 최적화 | 간접 수혜 |
| 35 | Fix | Worktree cwd 격리 추가 수정 | bkit worktree 미사용 |
| 36 | Fix | Rate-limit upgrade 옵션 compaction 후 보존 | 간접 수혜 |
| 37 | Fix | Bedrock SigV4 추가 수정 | bkit Bedrock 미사용 |
| 38 | Fix | frontmatter YAML boolean keyword 추가 케이스 | bkit 해당 없음 |
| 39 | Fix | Permission request stuck (#45954) | **CLOSED** — 자동 수혜 |
| 40 | Fix | --resume undefined crash (#42778) | **CLOSED** — 자동 수혜 |
| 41-57 | Fix/Imp | 기타 17건 (NO_FLICKER, Bridge, footer, markdown, OTEL 등) | 무관 또는 간접 수혜 |

---

## 5. ENH Opportunities (신규 2건: ENH-193~194, YAGNI FAIL 3건)

### ENH-193: MCP `_meta` key 방어적 수정 (P0)

- **변경**: v2.1.98에서 MCP _meta persist bypass 수정 — `anthropic/maxResultSizeChars` 키가 persist 레이어에서 유실
- **bkit 현황**: 2개 MCP 서버(`bkit-pdca-server/index.js:69`, `bkit-analysis-server/index.js:76`)에서 `_meta.maxResultSizeChars` 500K 오버라이드 사용
- **영향**: **P0** — 수정하지 않으면 500K 오버라이드 무효화 → PDCA 문서 2KB 절단 위험
- **조치**: `maxResultSizeChars` + `anthropic/maxResultSizeChars` 양쪽 키 설정
- **YAGNI**: ✅ PASS (핵심 의존성)

### ENH-194: `/reload-plugins` 핫리로드 문서화 (P3)

- **변경**: /reload-plugins가 skills까지 핫리로드 반영
- **bkit 현황**: 37 skills 보유, 개발 중 재시작 필요했던 워크플로우
- **영향**: 자동 수혜, 문서 갱신만 필요
- **판정**: P3 모니터링
- **YAGNI**: ✅ PASS (모니터링만)

### YAGNI FAIL 제거 (3건)

| ENH | 제안 | 판정 사유 |
|-----|------|----------|
| ~~ENH-195~~ | Monitor tool disallowedTools 검토 | whitelist 방식이라 불필요 |
| ~~ENH-196~~ | Hook stderr 진단 활용 | 자동 수혜, 코드 수정 불필요 |
| ~~ENH-197~~ | Bash 보안 문서화 | 자동 수혜, 가치 낮음 |

---

## 6. 자동 수혜 (코드 수정 불필요, 10건)

| # | 변경 | bkit 수혜 |
|---|------|----------|
| 1 | 429 retry exponential backoff 추가 보강 | CTO Team 다중 agent 안정성 |
| 2 | Stop/SubagentStop hooks 장기세션 추가 수정 | unified-stop.js 장기세션 안정성 |
| 3 | Background subagent 부분 진행 보고 | CTO Team 패턴 가시성 |
| 4 | Bash wildcard permission rules whitespace 수정 | permission 안정성 |
| 5 | Bash false permission prompts 6건 수정 | hooks/scripts 불필요 프롬프트 감소 |
| 6 | Stale subagent worktree cleanup | 간접 안정성 |
| 7 | Hook 에러 stderr 첫 줄 transcript | 21 hooks 디버깅 가시성 |
| 8 | Streaming fallback timeout | 장기세션 안정성 |
| 9 | /reload-plugins 스킬 핫리로드 | 37 skills 개발 워크플로우 개선 |
| 10 | Security fixes 7건 | 전반적 보안 강화 (Bash permission bypass 4건 포함) |

---

## 7. GitHub Issues Monitor

### 7.1 모니터링 이슈 상태

| # | 심각도 | 제목 | 상태 변화 |
|---|--------|------|----------|
| #29423 | HIGH | task subagents ignore CLAUDE.md | 변동 없음 (stale) |
| #34197 | HIGH | CLAUDE.md ignored | 변동 없음 |
| #37520 | HIGH | 병렬 agent OAuth 401 | 변동 없음 (stale) |
| #40502 | HIGH | bg agents write 불가 | 변동 없음 |
| #40506 | HIGH | PreToolUse hooks -p mode | 변동 없음 |
| #41930 | HIGH | 비정상 사용량 소진 | 429 retry 개선이 간접 도움 |
| #44925 | P2 | FileChanged hook Bash 미감지 | 변동 없음 (설계상 제한) |
| #44958 | P2 | PreToolUse:Write 오탐 | 변동 없음 |
| #44968 | P2 | 병렬 agent 무단 spawn | 변동 없음 |
| #44971 | P2 | SubagentStop 미발화 | 부분 수정 (#40, 장기세션 추가 수정) |

### 7.2 해결된 이슈

| # | 제목 | 해결 버전 |
|---|------|----------|
| #42778 | --resume undefined crash | v2.1.98 **CLOSED** |
| #45954 | Permission request stuck | v2.1.98 **CLOSED** |

---

## 8. 시스템 프롬프트 변경

| 항목 | 값 |
|------|-----|
| **Token Delta** | **+2,045 tokens** |
| **누적 (v2.1.73 기준)** | ~+58,000+ tokens |

주요 변경:
- **신규 섹션**: Communication style, Dream team memory handling, Exploratory questions, User-facing communication style, Background monitor
- **수정 섹션**: Dream memory consolidation/pruning, Advisor tool
- **삭제 섹션**: 없음

---

## 9. Hook Events & CC Tools

### Hook Events

| 항목 | 값 |
|------|-----|
| CC 총 | 26 (변동 없음) |
| bkit 구현 | 21 (변동 없음) |

### CC Tools

| 항목 | 값 |
|------|-----|
| v2.1.97 | 29 |
| v2.1.98 | **30** (+1, Monitor tool 추가) |

---

## 10. 철학 정합성

| bkit 철학 | 판정 | 근거 |
|-----------|------|------|
| Automation First | ✅ | 자동 수혜 10건, 수동 개입 최소(ENH-193 1건만) |
| No Guessing | ✅ | 검증 기반 (MCP _meta key persist 실제 확인) |
| Docs=Code | ✅ | MEMORY.md 업데이트로 문서=코드 동기화 |

---

## 11. 권장 사항

### 11.1 즉시 실행

| 우선순위 | 항목 | 예상 공수 |
|----------|------|----------|
| **P0** | ENH-193: MCP `_meta` key 방어적 수정 — 2개 MCP 서버 okResponse() 수정 | 30분 |

### 11.2 모니터링

| 우선순위 | 항목 |
|----------|------|
| P3 | ENH-194: `/reload-plugins` 핫리로드 문서화 |

### 11.3 CC 권장 버전 업데이트

**v2.1.98+** (v2.1.97+에서 상향)

업그레이드 사유:
1. Bash permission bypass 보안 취약점 7건 일괄 수정
2. Monitor tool 추가 (CC tools 30)
3. MCP _meta persist bypass 수정 (bkit 500K 오버라이드 안정성)
4. 429 retry Retry-After 추가 보강
5. Stop/SubagentStop hooks 장기세션 추가 안정화
6. /reload-plugins 스킬 핫리로드

### 11.4 정보

| 항목 | 변경 |
|------|------|
| CC tools | 29 → **30** (Monitor 추가) |
| Hook events | 26 (변동 없음) |
| 연속 호환 | 62 → **63** |

---

## 12. 결론

v2.1.98은 **보안 중심 릴리스**로 Bash permission bypass 취약점 7건을 일괄 수정한 것이 핵심. bkit 관점에서는 **63개 연속 호환**을 유지하며, 코드 수정은 ENH-193(P0) 1건만 필요. MCP _meta key 형식 검증은 500K 오버라이드의 안정성을 확보하기 위한 방어적 수정으로, PDCA 워크플로우의 핵심 의존성.

GitHub Issues 2건 해결(#42778, #45954)로 --resume 안정성과 Permission 요청 응답 안정성이 개선됨.
