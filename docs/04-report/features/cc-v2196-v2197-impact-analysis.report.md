# CC v2.1.96~v2.1.97 영향 분석 보고서

> **Status**: ✅ Complete
>
> **Project**: bkit Vibecoding Kit
> **Version**: v2.0.8 (분석 시점)
> **Author**: CC Version Analysis Workflow
> **Completion Date**: 2026-04-09
> **PDCA Cycle**: #33

---

## Executive Summary

### 1.1 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **기능** | CC v2.1.96~v2.1.97 (1개 릴리스) 영향 분석 |
| **시작일** | 2026-04-09 |
| **완료일** | 2026-04-09 |
| **설치 CC 버전** | v2.1.97 |
| **분석 범위** | v2.1.96 → v2.1.97 |
| **v2.1.97 발행일** | 2026-04-08 |

### 1.2 성과 요약

```
┌──────────────────────────────────────────────────────────────────┐
│  CC v2.1.96~v2.1.97 영향 분석 결과                                │
├──────────────────────────────────────────────────────────────────┤
│  총 변경 건수:           ~47건 (CLI 42 + SP ~5)                   │
│  신규 기능:              5건                                      │
│  버그 수정:              29건                                     │
│  개선사항:               13건                                     │
│  Breaking Changes:      0건 (bkit 기준)                          │
│  신규 hook events:       0건 (CC 총 26, 변동 없음)                 │
│  시스템 프롬프트:        +23,865 tokens (Managed Agents 문서 추가) │
│  CC Tools:               29 (변동 없음)                           │
│  신규 ENH 기회:          4건 (ENH-189~192)                        │
│  자동 수혜:              8건                                      │
│  bkit 직접 영향:         3건 (전부 긍정적)                         │
│  bkit 코드 수정 필요:    0건                                      │
│  연속 호환 릴리스:        62개 (v2.1.34~v2.1.97)                  │
│  GitHub Issues 해결:     0건 (2건 부분 수정: #44929, #44971)      │
└──────────────────────────────────────────────────────────────────┘
```

### 1.3 전달된 가치

| 관점 | 내용 |
|------|------|
| **문제** | CC v2.1.97에서 ~47건 변경 — 대형 안정화 릴리스. Stop/SubagentStop 장기세션 실패 수정, MCP 50MB/hr 메모리 누수 수정, 429 retry backoff 수정, Permission 시스템 6건 일괄 수정, NO_FLICKER 대규모 폴리싱, 시스템 프롬프트 +23,865 tokens (Managed Agents) |
| **해결 방법** | GitHub release notes + CHANGELOG.md + npm + Piebald-AI sys prompt tracker + bkit 코드베이스 교차 검증 (2 agents 병렬) |
| **기능/UX 효과** | Stop/SubagentStop 장기세션 안정성 (bkit unified-stop.js 678 LOC 직접 수혜), 429 retry 안정화 (CTO Team), plugin update 정상화, 한국어 NO_FLICKER 복사 수정 |
| **핵심 가치** | **62개 연속 호환** + 코드 수정 0건 + 자동 수혜 8건 + Stop/SubagentStop 장기세션 수정이 bkit PDCA 운영 안정성에 직접 기여 |

---

## 2. Version Verification

| 항목 | v2.1.97 |
|------|---------|
| GitHub Release | ✅ |
| npm 발행일 | 2026-04-08 |
| npm dist-tag (latest) | 2.1.97 ✅ |
| 설치 확인 | `claude --version` → 2.1.97 ✅ |
| 시스템 프롬프트 | +23,865 tokens |
| 커밋 | 22fdf68 |

---

## 3. Impact Summary

| 카테고리 | 건수 | HIGH | MEDIUM | LOW |
|----------|------|------|--------|-----|
| Features | 5 | 0 | 3 | 2 |
| Fixes | 29 | 4 | 11 | 14 |
| Improvements | 13 | 0 | 4 | 9 |
| **합계** | **47** | **4** | **18** | **25** |

---

## 4. 변경사항 상세

### 4.1 HIGH Impact (4건)

| # | 유형 | 변경 | bkit 영향 |
|---|------|------|----------|
| 1 | Fix | **`--dangerously-skip-permissions` silent downgrade** — protected path write 후 accept-edits로 강등 | bkit 미사용 (정책 확인). **영향 없음** |
| 2 | Fix | **Bash tool permission 강화** — env-var prefix, network redirect 검사, 불필요 프롬프트 감소 | **자동 수혜** — bkit hooks/scripts Bash 명령 불필요 프롬프트 감소 |
| 3 | Fix | **MCP HTTP/SSE ~50MB/hr 메모리 누수 수정** — 재연결 시 버퍼 미해제 | bkit MCP servers는 **stdio 기반** → **영향 없음** |
| 4 | Fix | **429 retry exponential backoff 수정** — ~13초 내 모든 재시도 소진 | **자동 수혜** — CTO Team 다중 agent 안정성 개선 |

### 4.2 MEDIUM Impact (18건)

| # | 유형 | 변경 | bkit 영향 |
|---|------|------|----------|
| 5 | Feature | **Focus View Toggle (Ctrl+O)** — NO_FLICKER 집중 뷰 | ENH-189 (P3 모니터링) |
| 6 | Feature | **refreshInterval status line** — N초 자동 재실행 | ENH-190 (P3, YAGNI 강등) |
| 7 | Feature | **`● N running` indicator in /agents** — 활성 subagent 수 표시 | P3, 코드 변경 불필요 |
| 8 | Fix | **Stop/SubagentStop 장기세션 실패 수정** | **bkit 직접 영향** — unified-stop.js(678 LOC), subagent-stop-handler.js(82 LOC) 수혜. #44971 부분 수정 |
| 9 | Fix | **Hook evaluator "JSON validation failed" → 실제 에러 메시지** | **자동 수혜** — bkit 21 hook events 디버깅 가시성 개선 |
| 10 | Fix | **JS prototype property name permission rule 무시 수정** | bkit permission arrays 비어있음, 영향 없음. 심각한 보안 버그 |
| 11 | Fix | **managed-settings allow rules 재시작 전 유지 수정** | Enterprise 전용, bkit 무관 |
| 12 | Fix | **additionalDirectories mid-session 미적용 수정** | bkit 미사용 |
| 13 | Fix | **MCP OAuth authServerMetadataUrl token refresh 무시 수정** | bkit MCP OAuth 미사용 |
| 14 | Fix | **/resume picker 5건 일괄 수정** | **자동 수혜** — PDCA --resume 워크플로우 |
| 15 | Fix | **10KB+ 파일 --resume 시 edit diff 소실 수정** | **자동 수혜** |
| 16 | Fix | **--resume cache miss + attachment 미저장 수정** | **자동 수혜** |
| 17 | Fix | **worktree/cwd 격리 subagent working directory 누출 수정** | bkit worktree 미사용 |
| 18 | Fix | **subagent transcript 중복 multi-MB 쓰기 수정** | **자동 수혜** — CTO Team 디스크/메모리 절약 |
| 19 | Fix | **`claude plugin update` git 최신 커밋 미감지 수정** | **bkit 직접 영향** — marketplace plugin 업데이트 정상화. ENH-191 |
| 20 | Fix | **Korean/Unicode NO_FLICKER 복사 garbled 수정** (Windows) | **bkit 직접 영향** — 한국어 사용자 UX 개선 |
| 21 | Fix | **API retry stale streaming state 메모리 누수 수정** | 간접 수혜 |
| 22 | Improvement | **Session transcript 빈 hook 항목 스킵 + pre-edit 복사본 제한** | **자동 수혜** — bkit 21 hooks 토큰 절약. ENH-192 |

### 4.3 LOW Impact (25건)

| # | 유형 | 변경 | bkit 영향 |
|---|------|------|----------|
| 23 | Feature | workspace.git_worktree status line 필드 | 무관 |
| 24 | Feature | Cedar policy syntax highlighting | 무관 |
| 25 | Fix | additionalDirectories 제거 시 --add-dir 접근 취소 | 무관 |
| 26 | Fix | frontmatter name이 YAML boolean keyword일 때 깨짐 | bkit 해당 없음 |
| 27 | Fix | NO_FLICKER wrapped URL 복사 공백 | 무관 |
| 28 | Fix | NO_FLICKER zellij 스크롤 아티팩트 | 무관 |
| 29 | Fix | NO_FLICKER MCP hover 크래시 | 무관 |
| 30 | Fix | NO_FLICKER Windows 느린 마우스 스크롤 | 무관 |
| 31 | Fix | NO_FLICKER 24행 미만 터미널 custom status line | 무관 |
| 32 | Fix | NO_FLICKER Warp Shift+Enter/Alt+arrow | 무관 |
| 33 | Fix | 작업 중 입력 메시지 transcript 미저장 | 간접 수혜 |
| 34 | Fix | rate-limit upgrade 옵션 compaction 후 소실 | 간접 수혜 |
| 35 | Fix | Bedrock SigV4 빈 문자열 환경변수 인증 실패 | bkit Bedrock 미사용. #44929 부분 수정 |
| 36 | Improvement | Accept Edits safe env var/process wrapper 자동 승인 | **자동 수혜** — hook scripts 불필요 프롬프트 감소 |
| 37 | Improvement | Auto mode sandbox network 자동 승인 | 무관 |
| 38 | Improvement | sandbox.network.allowMachLookup macOS | 무관 |
| 39 | Improvement | 이미지 압축 토큰 절감 | 간접 수혜 |
| 40 | Improvement | CJK 문장 부호 후 / @ 자동완성 트리거 | bkit 한국어 사용자 간접 수혜 |
| 41 | Improvement | Bridge 세션 로컬 repo/branch/cwd 표시 | 무관 |
| 42 | Improvement | Footer 레이아웃 mode 행 유지 | 무관 |
| 43 | Improvement | context-low transient notification | 간접 수혜 |
| 44 | Improvement | Markdown blockquote 연속 bar | 무관 |
| 45 | Improvement | Transcript per-block 토큰 사용량 기록 | 간접 수혜 |
| 46 | Improvement | Bash tool OTEL tracing TRACEPARENT | 무관 |
| 47 | Improvement | /claude-api Managed Agents 커버 | 무관 |

---

## 5. ENH Opportunities (신규 4건: ENH-189~192)

### ENH-189: Focus View (Ctrl+O) 문서화 (P3)

- **변경**: NO_FLICKER 모드에서 프롬프트 + 1줄 tool summary + 최종 응답만 표시
- **bkit 현황**: NO_FLICKER 미참조, Focus View 비사용
- **영향**: 없음
- **판정**: P3 모니터링
- **YAGNI**: ✅ PASS (모니터링만)

### ENH-190: refreshInterval status line (P3 강등)

- **변경**: status line 명령어를 N초마다 자동 재실행
- **bkit 현황**: statusLine/refreshInterval 사용처 0건
- **영향**: 향후 bkit statusLine 도입 시 활용 가능
- **판정**: **P3 강등** (원래 P2 → YAGNI review에서 강등. 사용자 요청 없음)
- **YAGNI**: ❌ FAIL (P2→P3)

### ENH-191: `claude plugin update` 정상화 검증 (P2)

- **변경**: git 원격 최신 커밋 미감지 수정
- **bkit 현황**: bkit는 marketplace plugin. `claude plugin update`로 업데이트
- **영향**: plugin freshness 워크플로우 정상화. ENH-139 관련
- **판정**: P2 — 검증만 필요, 코드 변경 없음
- **YAGNI**: ✅ PASS (검증만)

### ENH-192: Session transcript 최적화 효과 측정 (P3)

- **변경**: 빈 hook 항목 스킵 + pre-edit 파일 복사본 제한
- **bkit 현황**: 21 hook events 등록
- **영향**: 자동 수혜, 토큰 절약
- **판정**: P3 모니터링
- **YAGNI**: ✅ PASS (모니터링만)

---

## 6. 자동 수혜 (코드 수정 불필요, 8건)

| # | 변경 | bkit 수혜 |
|---|------|----------|
| 1 | Bash tool permission 강화 | hooks/scripts Bash 불필요 프롬프트 감소 |
| 2 | 429 retry exponential backoff | CTO Team 다중 agent 안정성 |
| 3 | /resume picker 5건 수정 | PDCA resume 워크플로우 |
| 4 | --resume 10KB+ edit diff 보존 | 대형 파일 수정 추적 |
| 5 | --resume cache miss 수정 | 세션 복원 안정성 |
| 6 | Hook evaluator 에러 메시지 가시성 | 21 hooks 디버깅 편의 |
| 7 | Subagent transcript 중복 쓰기 수정 | CTO Team 디스크/메모리 절약 |
| 8 | Session transcript 빈 hook 항목 스킵 | 토큰 절약 |

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
| #41930 | HIGH | 비정상 사용량 소진 | 매우 활발 (#43183, #42249 추가) |
| #44925 | P2 | FileChanged hook Bash 미감지 | 변동 없음 |
| #44929 | P0 | Bedrock Bearer Token | **부분 수정** (빈 문자열 케이스) |
| #44958 | P2 | PreToolUse:Write 오탐 | 변동 없음 |
| #44968 | P2 | 병렬 agent 무단 spawn | 변동 없음 |
| #44971 | P2 | SubagentStop 미발화 | **부분 수정** (장기세션 hook 실패 수정, team agent shutdown은 미해결) |

### 7.2 해결된 이슈

없음 (전부 OPEN 유지)

---

## 8. 시스템 프롬프트 변경

| 항목 | 값 |
|------|-----|
| **Token Delta** | **+23,865 tokens** |
| **누적 (v2.1.73 기준)** | ~+56,000+ tokens |

주요 변경:
- **Managed Agents 문서 전체 세트 추가**: overview, quickstart, agent setup, sessions, environments, events, tools, files, permissions, multi-agent patterns, observability, GitHub integration, MCP connector, vaults, skills, memory, onboarding
- **Agent SDK 문서 4건 제거** → Managed Agents로 교체
- **Buddy Mode system prompt 제거**
- **Memory 파일 경로: 조건부 → 무조건 절대경로**
- **`/dream` nightly schedule skill** trigger rules 추가
- **Memory staleness verification** 지침 추가
- **Status line schema: `git_worktree` 필드 추가**

---

## 9. 철학 정합성

| bkit 철학 | 판정 | 근거 |
|-----------|------|------|
| Automation First | ✅ | 자동 수혜 8건, 수동 개입 불필요 |
| No Guessing | ✅ | 검증 기반 (MCP stdio 확인으로 오판 교정) |
| Docs=Code | ✅ | MEMORY.md 업데이트로 문서=코드 동기화 |

---

## 10. 권장 사항

### 10.1 즉시 실행

없음 (P0/P1 항목 없음)

### 10.2 단기 검토

| 우선순위 | 항목 | 예상 공수 |
|----------|------|----------|
| P2 | ENH-191: `claude plugin update` 정상화 검증 | 15분 (수동 테스트) |

### 10.3 모니터링

| 우선순위 | 항목 |
|----------|------|
| P3 | ENH-189: Focus View 문서화 |
| P3 | ENH-190: refreshInterval status line (YAGNI 강등) |
| P3 | ENH-192: Session transcript 최적화 효과 측정 |

### 10.4 CC 권장 버전 업데이트

**v2.1.97+** (v2.1.96+에서 상향)

업그레이드 사유:
1. Stop/SubagentStop 장기세션 안정성 수정 (bkit unified-stop.js 직접 수혜)
2. 429 retry exponential backoff 정상화 (CTO Team 안정성)
3. `claude plugin update` git 최신 커밋 감지 정상화
4. Session transcript 최적화 (토큰 절약)
5. Permission 시스템 보안 수정 6건 (간접 수혜)

---

## 11. MEMORY.md 교정 사항

| # | 교정 | 사유 |
|---|------|------|
| 1 | Hook event count: "bkit implemented: 18" → **21** | hooks.json 실제 등록 21건 |
| 2 | MCP 메모리 누수 무관 확인 | bkit MCP는 stdio 기반 → HTTP/SSE 50MB/hr 누수 수정 무관 |
| 3 | Skills with Bash: "25/37" → **28/38** | 최신 count |
