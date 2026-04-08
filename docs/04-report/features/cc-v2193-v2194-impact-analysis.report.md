# CC v2.1.93~v2.1.94 영향 분석 보고서

> **Status**: ✅ Complete
>
> **Project**: bkit Vibecoding Kit
> **Version**: v2.0.8 (분석 시점)
> **Author**: CC Version Analysis Workflow
> **Completion Date**: 2026-04-08
> **PDCA Cycle**: #32

---

## Executive Summary

### 1.1 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **기능** | CC v2.1.93~v2.1.94 (1개 릴리스, v2.1.93 스킵) 영향 분석 |
| **시작일** | 2026-04-08 |
| **완료일** | 2026-04-08 |
| **설치 CC 버전** | v2.1.94 |
| **분석 범위** | v2.1.92 → v2.1.94 |
| **v2.1.94 발행일** | 2026-04-07 |

### 1.2 성과 요약

```
┌──────────────────────────────────────────────────────────────────┐
│  CC v2.1.93~v2.1.94 영향 분석 결과                                │
├──────────────────────────────────────────────────────────────────┤
│  총 변경 건수:           ~26건 (CLI 23 + VSCode 3)                │
│  신규 기능:              6건                                      │
│  버그 수정:              16건                                     │
│  VSCode:                3건                                      │
│  Breaking Changes:      0건 (bkit 기준)                          │
│  신규 hook events:       0건 (CC 총 26, 변동 없음)                 │
│  신규 hook output:       +1건 (sessionTitle)                      │
│  시스템 프롬프트:        TBD (Piebald-AI 미업데이트)                │
│  CC Tools:               29 (변동 없음)                           │
│  v2.1.93:               스킵됨 (미발행)                            │
│  신규 ENH 기회:          4건 (ENH-185~188)                        │
│  자동 수혜:              6건                                      │
│  bkit 직접 영향:         4건 (전부 긍정적)                         │
│  bkit 코드 수정 필요:    0건 (검증만 필요)                         │
│  연속 호환 릴리스:        59개 (v2.1.34~v2.1.94)                  │
│  GitHub Issues 해결:     0건 (모니터링 이슈 10건 전부 OPEN)        │
└──────────────────────────────────────────────────────────────────┘
```

### 1.3 전달된 가치

| 관점 | 내용 |
|------|------|
| **문제** | CC v2.1.94에서 ~26건 변경 — plugin frontmatter hooks 정상화(#17688), effort 기본값 변경, CJK UTF-8 corruption fix, keep-coding-instructions 공식화, sessionTitle hook 추가, PLUGIN_ROOT 경로 fix 3건 |
| **해결 방법** | GitHub release notes + CHANGELOG.md + 공식 docs + npm + bkit 코드베이스 교차 검증 (2 agents 병렬) |
| **기능/UX 효과** | Plugin hooks 안정성 대폭 개선(PLUGIN_ROOT 3건 fix), 한국어 입출력 안정성(CJK fix), output style 공식 인식, PDCA 자동 세션 명명 기회 |
| **핵심 가치** | **59개 연속 호환** + plugin 안정성 3건 fix(자동 수혜) + CJK 한국어 fix + frontmatter hooks 정상화(검증 필요) + 코드 수정 0건 |

---

## 2. Version Verification

| 항목 | v2.1.93 | v2.1.94 |
|------|---------|---------|
| GitHub Release | ❌ 스킵 (404) | ✅ |
| npm 발행일 | - | 2026-04-07 |
| npm dist-tag (latest) | - | 2.1.94 ✅ |
| 설치 확인 | - | `claude --version` → 2.1.94 ✅ |
| 시스템 프롬프트 | - | TBD |

**v2.1.93**: 미발행 — v2.1.82와 동일한 내부 빌드 번호 스킵 패턴

---

## 3. Impact Summary

| 카테고리 | 건수 | HIGH | MEDIUM | LOW |
|----------|------|------|--------|-----|
| Features | 6 | 2 | 2 | 2 |
| Fixes | 16 | 1 | 3 | 12 |
| VSCode | 3 | 0 | 0 | 3 |
| **합계** | **25** | **3** | **5** | **17** |

---

## 4. 변경사항 상세

### 4.1 HIGH Impact (3건)

| # | 유형 | 변경 | bkit 영향 |
|---|------|------|----------|
| 1 | Feature | **effort 기본값 medium→high** (API/Bedrock/Vertex/Team/Enterprise) | bkit 32 agents 전부 effort 명시 → **영향 없음** |
| 2 | Feature | **`keep-coding-instructions` output style frontmatter 공식 지원** | bkit 4개 output style에서 이미 사용 중 → **기존 workaround 정식 승격, 자동 수혜** |
| 3 | Fix | **Plugin skill hooks frontmatter 무시 버그 수정** (#17688, 28 thumbs up) | bkit 11 skills + 13 agents frontmatter hooks → **검증 필요 (hooks.json 중복 실행 위험)** |

### 4.2 MEDIUM Impact (5건)

| # | 유형 | 변경 | bkit 영향 |
|---|------|------|----------|
| 4 | Feature | Bedrock Mantle 지원 (`CLAUDE_CODE_USE_MANTLE=1`) | 없음 (엔터프라이즈 전용) |
| 5 | Feature | `hookSpecificOutput.sessionTitle` (UserPromptSubmit) | ENH-187 — PDCA 자동 세션 명명 기회 |
| 6 | Fix | `CLAUDE_PLUGIN_ROOT` 미설정 시 hook 실패 fix | **자동 수혜** — bkit 18 hooks 안정성 |
| 7 | Fix | `${CLAUDE_PLUGIN_ROOT}` local-marketplace 경로 resolution fix | **자동 수혜** — marketplace 배포 안정성 |
| 8 | Fix | CJK UTF-8 stream boundary corruption fix (#40396) | **자동 수혜 (중요)** — 한국어 입출력 안정성 |

### 4.3 LOW Impact (17건)

| # | 유형 | 변경 | bkit 영향 |
|---|------|------|----------|
| 9 | Feature | Slack MCP compact header | 없음 |
| 10 | Feature | Plugin skill name = frontmatter name | 자동 수혜 (이름 안정성) |
| 11 | Fix | 429 rate-limit stuck agent fix | 자동 수혜 (CTO Team) |
| 12 | Fix | macOS keychain login fix + `claude doctor` | 없음 |
| 13 | Fix | Scrollback diff 반복 + 빈 페이지 fix | 자동 수혜 |
| 14 | Fix | Multiline prompt 들여쓰기 fix | 없음 (cosmetic) |
| 15 | Fix | Shift+Space "space" 문자열 fix | 없음 |
| 16 | Fix | tmux 하이퍼링크 더블 탭 fix | 없음 |
| 17 | Fix | Alt-screen ghost lines fix | 없음 |
| 18 | Fix | FORCE_HYPERLINK env var fix | 없음 |
| 19 | Fix | Screen reader 접근성 fix | 없음 |
| 20 | Fix | Bedrock Sonnet 3.5 v2 inference profile fix | 없음 |
| 21 | Fix | SDK/print 모드 응답 보존 | 자동 수혜 (--bare) |
| 22 | Fix | --resume worktree 직접 재개 | 자동 수혜 |
| 23-25 | VSCode | Cold-open 최적화, dropdown fix, settings 경고 | 없음 |

---

## 5. ENH Opportunities (신규 4건: ENH-185~188)

### ENH-185: Default effort high 모니터링 (P3)

- **변경**: API/Bedrock/Vertex/Team/Enterprise 기본 effort medium→high
- **bkit 현황**: 32 agents 전부 effort frontmatter 명시 (high 11, medium 18, low 3)
- **영향**: **없음** — bkit agent effort가 CC 기본값을 override
- **판정**: P3 모니터링. Pro/Max는 medium 유지이므로 대다수 bkit 사용자 무영향
- **YAGNI**: ✅ PASS (모니터링만, 구현 불필요)

### ENH-186: keep-coding-instructions 공식화 (P3)

- **변경**: output style frontmatter `keep-coding-instructions` 공식 지원
- **bkit 현황**: 4개 output style에서 이미 `keep-coding-instructions: true` 사용
- **영향**: 기존 workaround이 정식 기능으로 승격. **코드 수정 불필요**
- **판정**: P3 문서 업데이트. context-engineering.md에 공식 지원 언급 추가 가능
- **YAGNI**: ✅ PASS (문서만, 구현 불필요)

### ENH-187: sessionTitle — PDCA 자동 세션 명명 (P2)

- **변경**: UserPromptSubmit hook output에 `sessionTitle` 필드 추가
- **bkit 현황**: `user-prompt-handler.js`가 UserPromptSubmit 처리. 현재 sessionTitle 미사용
- **기회**: PDCA feature명 기반 자동 세션 명명 → `/rename` 없이 세션 구조화
- **구현**: `user-prompt-handler.js`에 `hookSpecificOutput.sessionTitle = feature` 추가 (~5줄)
- **판정**: P2 — 사용자 편의성 개선, 낮은 구현 비용
- **YAGNI**: ✅ PASS (즉시 가치, 5줄 수정)

### ENH-188: Plugin frontmatter hooks 정상화 검증 (P1)

- **변경**: Plugin SKILL.md/agent.md frontmatter `hooks:` 정의가 이전에 무시되던 버그 수정 (#17688)
- **bkit 현황**: 11 skills + 13 agents = **24개 컴포넌트**에 frontmatter hooks 정의
- **위험**: hooks.json 글로벌 hook과 frontmatter hook이 **동시에 fire** → 중복 실행 가능
- **검증 항목**:
  1. frontmatter hook과 hooks.json hook의 실행 순서 확인
  2. 동일 이벤트에 대해 중복 실행되는지 확인
  3. 중복 시 부작용 (이중 상태 전환, 이중 audit 기록 등)
- **판정**: **P1** — 중복 실행 시 PDCA 상태 머신 오작동 위험. 즉시 검증 필요
- **YAGNI**: ✅ PASS (검증은 필수, 코드 수정은 결과에 따라)

---

## 6. 자동 수혜 (코드 수정 불필요, 6건)

| # | 변경 | bkit 수혜 |
|---|------|----------|
| 1 | CJK UTF-8 corruption fix (#40396) | **한국어/일본어/중국어 입출력 안정성** — 8-language 지원 핵심 |
| 2 | `CLAUDE_PLUGIN_ROOT` 미설정 fix | bkit 18 hooks 경로 안정성 |
| 3 | `${CLAUDE_PLUGIN_ROOT}` marketplace resolution fix | marketplace 배포 경로 안정성 |
| 4 | 429 rate-limit stuck agent fix | CTO Team 병렬 agent 안정성 |
| 5 | SDK/print 모드 응답 보존 | --bare CI/CD 안정성 |
| 6 | --resume worktree 직접 재개 | CTO Team worktree 워크플로우 |

---

## 7. GitHub Issues Monitor

### 7.1 모니터링 이슈 상태 (10건 전부 OPEN, 변동 없음)

| # | 심각도 | 제목 | 상태 변화 |
|---|--------|------|----------|
| #29423 | HIGH | task subagents ignore CLAUDE.md | 변동 없음 |
| #34197 | HIGH | CLAUDE.md ignored | 변동 없음 |
| #37520 | HIGH | 병렬 agent OAuth 401 | 활발 (4/7 업데이트), #44968 추가 발생 |
| #37745 | HIGH | PreToolUse + skip-permissions 리셋 | 변동 없음 |
| #40506 | HIGH | PreToolUse hooks -p 모드 미작동 | 변동 없음 |
| #40502 | HIGH | bg agents write 불가 | 변동 없음 |
| #41930 | HIGH | 비정상 사용량 소진 | 매우 활발, #44891 #44946 추가 |
| #43547 | LOW | computer-use MCP broken | 변동 없음 |
| #33656 | MEDIUM | PostToolUse bash non-zero | 변동 없음 |
| #37729 | MEDIUM | SessionStart env /clear | 활발 (4/7 업데이트) |

### 7.2 신규 주의 이슈

| # | 심각도 | 제목 | bkit 영향 |
|---|--------|------|----------|
| **#44929** | P0 | Bedrock Bearer Token auth broken v2.1.94 | bkit 무관 |
| **#44925** | P2 | FileChanged hook — Bash tool 파일 수정 미감지 | ENH-150 관련 제약 |
| **#44958** | P2 | PreToolUse:Write hook false positives | bkit security hook 모니터링 |
| **#44971** | P2 | SubagentStop hook — team agent 종료 미발화 | Agent Teams 모니터링 |
| **#44968** | P2 | 병렬 agent 10개 무단 spawn | #37520 관련, CTO Team 주의 |

---

## 8. 철학 정합성

| bkit 철학 | 판정 | 근거 |
|-----------|------|------|
| Automation First | ✅ | sessionTitle 자동 세션 명명 기회 |
| No Guessing | ✅ | 검증 기반 접근 (ENH-188) |
| Docs=Code | ✅ | keep-coding-instructions 공식화 = Docs=Code 강화 |

---

## 9. 권장 사항

### 9.1 즉시 실행

| 우선순위 | 항목 | 예상 공수 |
|----------|------|----------|
| **P1** | ENH-188: frontmatter hooks 중복 실행 검증 | 1시간 (수동 테스트) |

### 9.2 단기 검토

| 우선순위 | 항목 | 예상 공수 |
|----------|------|----------|
| P2 | ENH-187: sessionTitle PDCA 자동 세션 명명 | 30분 (~5줄 수정) |

### 9.3 모니터링

| 우선순위 | 항목 |
|----------|------|
| P3 | ENH-185: effort 기본값 변경 (bkit 무영향 확인) |
| P3 | ENH-186: keep-coding-instructions 문서 업데이트 |

### 9.4 CC 권장 버전 업데이트

**v2.1.94+** (v2.1.92+에서 상향)

업그레이드 사유:
1. Plugin frontmatter hooks 정상화 (#17688)
2. PLUGIN_ROOT 경로 resolution 3건 fix
3. CJK UTF-8 corruption fix — 한국어 필수
4. 429 rate-limit stuck agent fix
5. keep-coding-instructions 공식 지원
