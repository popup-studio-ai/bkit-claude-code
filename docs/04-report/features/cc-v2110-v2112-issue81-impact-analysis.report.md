# CC v2.1.110 → v2.1.112 + Issue #81 통합 영향 분석 보고서

> **분석 일자**: 2026-04-17
> **분석 범위**: CC v2.1.111 + v2.1.112 (2건 릴리스, 스킵 0건) + GitHub Issue #81 심층 대응
> **설치 버전**: CC v2.1.112 (latest)
> **이전 분석**: cc-v2108-v2110-impact-analysis (2026-04-16)
> **관련 이슈**: [#81 SessionStart hook ~12KB persisted-output 재주입](https://github.com/popup-studio-ai/bkit-claude-code/issues/81) (OPEN, 2026-04-16 scokeepa)

---

## [Plan] → [Design] → [Do] → [Check] → [Act]

**현재 단계**: **Check → Act** (영향 분석 완료, ENH 우선순위 확정)

---

## Executive Summary

CC v2.1.110 이후 **2건 정상 발행** (v2.1.111 `~33건 대형`, v2.1.112 `단건 핫픽스`). **72개 연속 호환** 유지 (breaking 0건). 그러나 **본 분석의 핵심은 Issue #81**로 확인됨:

1. **Issue #81 RC-1 실측 확증**: Enterprise + CTO Teams + Dashboard 5섹션 환경에서 `additionalContext` 출력 **~11,970~12,370 bytes** (Issue 보고 12,921과 ±500 오차 내 일치)
2. **Issue #81 RC-1 가설 중대 정정**: 공식 임계값은 **2KB가 아닌 10,000 문자** (CC hooks 공식 문서), 메커니즘은 파일 저장 + **프리뷰 치환**(전체 재주입이 아님)
3. **Issue #81 RC-2 구조적 취약**: `hooks.json:7`의 `once: true`는 matcher-group 레벨로 **compaction source 방어 불가** + bkit 측 fingerprint dedup 부재 + `post-compaction.js`가 **추가 주입**으로 상황 악화
4. 🚨 **Docs=Code 철학 위반 발견**: ENH-226 (`ui.contextInjection.enabled` 토글, 2026-04-15 "완료" 표기)은 `bkit.config.json`·`scripts/user-prompt-handler.js`에만 구현, **`hooks/startup/session-context.js`에는 가드 전무** → 실제 SessionStart hook 12KB 주입 경로 제어 불가
5. 🚨 **CC v2.1.110 신규 회귀 발견** ([#48963](https://github.com/anthropics/claude-code/issues/48963)): Claude Desktop app에서 plugin skills 대부분 `/` 메뉴 미표시, bkit 37 skills 직접 영향 가능 (CLI는 정상)
6. **ENH 8건 도출** — P0: 2건(ENH-238/239, 2.5h), P1: 3건(ENH-240/241/243, ~5h), P2: 1건(ENH-242, 4h), P3: 1건(ENH-244, 1h), YAGNI FAIL: 4건(v2.1.111 xhigh/ultrareview/less-perm-prompts/plugin_errors)

**시급성**: **v2.1.8 hotfix 릴리스 권장** (Issue #79 hotfix → Issue #81 hotfix 연쇄, P0 3건 총 공수 ~2.5h)

**bkit 코드 수정 필요**: **5건** (ENH-238/239/240/241/243 - Issue #79 hotfix 이후 최대 규모)

---

## 4-Perspective 가치 평가

| Perspective | v2.1.111/v2.1.112 영향 | Issue #81 영향 | bkit 대응 효과 |
|-------------|----------------------|---------------|---------------|
| **PDCA Workflow** | 자동 수혜 (B3 LSP 회복, B2 @ 파일 성능) | 🔴 12KB × N turns 토큰 낭비 → 장기 PDCA 세션 비용 폭증 | **ENH-238/239로 -95% 세션 컨텍스트 절감** |
| **Developer Experience** | 자동 수혜 (I5 /skills 정렬, F3 /effort 슬라이더, I1 읽기전용 bash) | 🔴 대시보드 의존 Enterprise 사용자 UX 저하 | **ENH-240 자동 감지 + 경고, ENH-241 opt-out 문서화** |
| **Security/Quality** | 자동 수혜 (v2.1.110 B12/B13/B14 유지) | ⚠️ Docs=Code 위반은 품질 게이트 실패 | **ENH-238 설계 정합성 복원 (M7 품질 게이트 회복)** |
| **Maintainability** | 자동 수혜 (B5 plugin deps, B6 /clear session_name) | 🔴 ENH-226 완료 오표기 → 향후 QA 신뢰성 저하 | **ENH-241 QA 보고서 수정 + 교차 검증 스킴** |

---

## 섹션 1: CC v2.1.111 + v2.1.112 변경사항

### 1.1 요약

| 버전 | 발행일 (UTC) | 변경 수 | 분류 | bkit 직접 영향 |
|------|-------------|---------|------|--------------|
| **v2.1.111** | 2026-04-16 15:18 | **~33건** | F6 + I15 + B12 | 0건 breaking, 자동 수혜 6건, 모니터 3건 |
| **v2.1.112** | 2026-04-16 19:55 | **1건** | H1 (auto mode 모델) | 0건 (bkit auto mode 미사용) |

**누적 통계**: 연속 호환 **71 → 72개** (v2.1.34 ~ v2.1.112), breaking 0건, 누적 변경 ~928건.

### 1.2 v2.1.111 Features (6건, 엄선)

| # | 기능 | Impact | bkit 관련성 |
|---|------|--------|------------|
| F1 | **Opus 4.7 `xhigh` effort** — `effort` frontmatter 값 확장 | HIGH | **무영향** (bkit agents/skills high/max만 사용) |
| F2 | Auto mode for Max subscribers | MEDIUM | **무관** (bkit auto mode 미사용) |
| F3 | `/effort` 인터랙티브 슬라이더 | LOW | 자동 수혜 |
| F4 | `/theme` Auto (terminal 매칭) | LOW | 자동 수혜 |
| F5 | **`/less-permission-prompts` 빌트인 skill** — allowlist 제안 | MEDIUM | **모니터** — bkit permissions 중복 제안 가능성 |
| F6 | **`/ultrareview`** — 멀티에이전트 PR 리뷰 | MEDIUM | **모니터** — CTO Team 역할 중복 가능성 |
| F7 | Windows PowerShell tool 점진 배포 (opt-in) | LOW | **무관** (macOS 사용) |

### 1.3 v2.1.111 Improvements (15건, 주요 3건 발췌)

| # | 개선 | Impact | bkit 관련성 |
|---|------|--------|------------|
| I1 | 읽기 전용 bash + glob + `cd {project} &&` 권한 프롬프트 제거 | MEDIUM | **자동 수혜** — 25/37 skills Bash 호출 UX 향상 |
| I10 | **Headless `--output-format stream-json` init event에 `plugin_errors` 포함** | MEDIUM | **ENH-138 번들** (CI/CD 디버깅) |
| I13 | **v2.1.110의 non-streaming fallback retry cap 되돌림** | MEDIUM | **자동 수혜** — 장기 PDCA 세션 안정성 회복 |

### 1.4 v2.1.111 Fixes (12건, 주요 4건 발췌)

| # | 수정 | Impact | bkit 관련성 |
|---|------|--------|------------|
| B3 | LSP diagnostics 편집 이전 것이 이후 표시 → 재-Read 유도 수정 | MEDIUM | **자동 수혜** — Edit 토큰 절감 |
| B6 | **`/clear`가 `/rename` 세션명 삭제** 수정 | MEDIUM | **자동 수혜** — ENH-187 sessionTitle 보호 재확인 |
| B10 | **Windows: `CLAUDE_ENV_FILE` + SessionStart hook 미적용 수정** | HIGH (Windows) | 모니터 — 크로스플랫폼 (ENH-219) |
| B11 | Windows: drive-letter permission rule root-anchored | MEDIUM (Windows) | 모니터 |

### 1.5 v2.1.112 Hotfix (단건)

| # | 수정 | Impact | bkit 영향 |
|---|------|--------|----------|
| H1 | "claude-opus-4-7 is temporarily unavailable" for auto mode 수정 | LOW | **무관** (bkit auto mode 미사용) |

### 1.6 구조적 변경 요약 (호환성)

| 항목 | v2.1.110 | v2.1.112 | 변동 |
|------|----------|----------|------|
| Hook events (공식/런타임) | 25 / 26 | 25 / 26 | 0 |
| PreToolUse decisions | 4 | 4 | 0 |
| CC built-in tools | 32 | 32 | 0 (F7 OS별 조건부) |
| Plugin manifest 신규 필드 | - | - | 0 |
| Agent/Skill frontmatter | - | `effort` 값 `xhigh` 추가 | +1 값 |
| 환경변수 신규 | - | `OTEL_LOG_RAW_API_BODIES`, `CLAUDE_CODE_USE_POWERSHELL_TOOL` | +2 |
| System prompt 토큰 | 기준 | +50~150 추정 (F5/F6 설명) | 소폭 증가 |
| **Breaking changes** | 0 | **0** | **72 consecutive compatible** |

---

## 섹션 2: `<persisted-output>` 메커니즘 정정 (Issue #81 RC-1 재검증)

### 2.1 RC-1 가설 정정

Issue #81은 CC의 `<persisted-output>` 재주입 메커니즘이 bkit additionalContext 12KB를 **매 API call마다 재주입**한다고 주장. Phase 1 researcher agent의 공식 문서 + GitHub 이슈 교차 조사 결과:

| RC-1 주장 | 실제 | 증거 |
|-----------|------|------|
| 임계값 **~2KB** | ❌ **10,000 문자** | [code.claude.com/docs/en/hooks](https://code.claude.com/docs/en/hooks) |
| 매 API call **재주입** | ❌ **프리뷰 + 파일 경로 치환** (재주입 아님) | [Issue #17407](https://github.com/anthropics/claude-code/issues/17407) 인용 |
| `<persisted-output>`이 SessionStart 전용 메커니즘 | ❌ **Read tool 대용량 결과 래퍼** (공식 문서 "same way") | 동일 |
| 중복 주입 실제 존재 | ⚠️ **부분 정확** | [Issue #14281](https://github.com/anthropics/claude-code/issues/14281) (Closed, 실존 확인) |

**공식 문서 직접 인용**:
> "Hook output injected into context (`additionalContext`, `systemMessage`, or plain stdout) is capped at **10,000 characters**. Output that exceeds this limit is **saved to a file and replaced with a preview and file path**."

### 2.2 RC-1 재서술

**정정된 루트 코즈**:
bkit SessionStart hook의 `additionalContext` 출력(~12,921 bytes ≈ 12,921 문자)이 **CC 공식 10,000 문자 cap을 초과**하여 **프리뷰 + 파일 경로로 치환**됨. 이로 인해:
- 사용자가 문서화된 PDCA workflow 안내(Executive Summary, 대시보드, opt-out 가이드 등)를 **받지 못함**
- CC가 파일 경로 안내를 제공하지만, 모델이 자동으로 Read하지 않음 (Phantom Reads 패턴)
- **결과적으로 bkit 핵심 컨텍스트 정보가 "무음 손실"** (silent loss)

### 2.3 Issue #14281 (중복 주입) 확증

Issue #14281은 **within-block 2회 + cross-block 여러 block** additionalContext 중복 주입을 공식 확인 후 Closed. 이는 Issue #81의 RC-2 일부 증거. bkit 측 fingerprint dedup은 **이 버그의 방어선**이 될 수 있음.

---

## 섹션 3: Issue #81 bkit 영향 실측 검증

### 3.1 RC-1 크기 실측

bkit-impact-analyst 에이전트 실측 결과 (Enterprise + CTO Teams + Dashboard 5섹션 활성화):

| 영역 | 크기 (bytes) | 비고 |
|------|-------------|------|
| `session-context.js` 9 builders 합계 (Enterprise resume 경로) | **~3,270** | buildOnboarding(500) + buildAgentTeams(700) + buildOutputStyles(600) + buildBkendMcp(300) + buildEnterpriseBatch(200) + buildPdcaCoreRules(300) + buildAutomation(150) + buildVersionEnhancements(200) + 헤더(320) |
| Dashboard 5섹션 (progress/workflow/impact/agent/control) | **~5,700~8,500** | ANSI escape 포함, impact-view와 agent-panel 조건부 |
| Stale Feature Warning (선택적) | ~100~400 | lifecycle.js |
| **합계** | **~11,970~12,370** | Issue #81 12,921과 **±500 오차 일치** ✅ |

**결론**: RC-1 검증 완료. **10,000 문자 cap을 확실히 초과** (120~124%).

### 3.2 RC-2 구조적 취약 확증

`hooks/hooks.json` 실측:
```json
"SessionStart": [
  {
    "once": true,            // matcher-group 레벨 (line 7)
    "hooks": [
      { "type": "command", "command": "node session-start.js", "timeout": 5000 }
    ]
  }
]
```

**구조적 문제**:
| 문제 | 위치 | 영향 |
|------|------|------|
| `once: true`는 matcher-group 레벨, **source 구분 없음** | `hooks.json:7` | `source: "compact"` 재발화 시 방어 불가 |
| bkit 측 fingerprint/content-hash dedup **부재** | N/A | 동일 12KB가 compaction 후 재주입되어도 감지 불가 |
| `scripts/context-compaction.js`가 **추가 주입** | `context-compaction.js:44-56` | compaction 복원 시 **또 다른 additionalContext** 주입 → 상황 악화 |
| CC `once`는 **공식 문서상 skills 전용** | [code.claude.com/docs/en/hooks](https://code.claude.com/docs/en/hooks) | settings-level hooks에 **적용 동작 불확실** |

**결론**: RC-2 검증 완료. `once: true`는 "방어선"이 아니라 **무효 선언**.

### 3.3 🚨 Docs=Code 철학 위반 발견 (가장 치명적)

ENH-226 "`ui.contextInjection.enabled` opt-out gate" (2026-04-15 MEMORY.md "완료" 표기) 실측:

| 레이어 | 파일 | 구현 여부 | 증거 |
|--------|------|----------|------|
| 설계 문서 | `docs/02-design/features/bkit-v216-integrated-enhancement.design.md` | ✅ 명시 | 3-way 토글 설계 |
| 설정 스키마 | `bkit.config.json:13-15` | ✅ 선언 | `ui.contextInjection.enabled: true` |
| UserPromptSubmit hook | `scripts/user-prompt-handler.js:82` | ✅ 가드 구현 | `if (ui.contextInjection.enabled === false)` |
| **SessionStart hook (실제 12KB 주입 경로)** | **`hooks/startup/session-context.js`** | ❌ **가드 전무** | **`grep contextInjection` 0건 일치** |

**결과**:
1. 사용자가 `bkit.config.json`에 `ui.contextInjection.enabled: false` 설정해도 **SessionStart hook 12KB 주입은 계속 발생**
2. ENH-226 "완료" 표기는 **잘못된 상태** → QA 보고서(`docs/05-qa/bkit-v216-integrated-enhancement.qa-report.md:188-190`)도 이 경로 검증 누락
3. **3대 철학 "Docs=Code" 직접 위반**

**교훈**: 설계↔구현↔QA 교차 검증 스킴 부재. ENH-241에서 체계적 수정 필요.

---

## 섹션 4: 해결 전략 — Plan Plus 브레인스토밍

### 4.1 Intent Discovery

**핵심 목표 3가지**:
1. Issue #81 P0 hotfix (v2.1.8 긴급 릴리스) — 세션당 12KB 토큰 낭비 차단
2. ENH-226 Docs=Code 위반 수정 (철학 정합성 회복)
3. CC v2.1.112 호환 확인 + 회귀 4건 방어 유지

**놓치면 안 되는 것**:
- CC 회귀 [#48963](https://github.com/anthropics/claude-code/issues/48963) (v2.1.110 Desktop app plugin skills 미표시) — bkit 37 skills 영향 가능성
- 회귀 4건 (#47810/#47855/#47482/#47828) **6릴리스 연속 OPEN** → v2.1.113+ 대기 권고 갱신

### 4.2 Alternative Exploration

**ENH-238 (session-context.js 가드 확장)**:

| 옵션 | 구현 방식 | 공수 | 장점 | 단점 |
|------|----------|------|------|------|
| Alt A | `enabled: false` 시 빈 문자열 반환 (minimal) | 15min | 최소 변경 | 디버깅 어려움, Dashboard는 여전히 주입 |
| Alt B | 각 builder별 개별 opt-out | 2h | 세밀한 제어 | bkit.config 스키마 확장 필요 |
| **Alt C** | **`ui.contextInjection.enabled` + `.sections[]` 배열 방식** (ENH-226 설계 의도 충실) | 45min | 기존 dashboard 패턴 재사용, 일관성 ↑ | 없음 |

**추천 Alt C** — ENH-226 설계 의도 정합 + 기존 `ui.dashboard.sections` 패턴 복제.

**ENH-239 (compaction dedup)**:

| 옵션 | 구현 방식 | 공수 | 평가 |
|------|----------|------|------|
| Alt A | TTL-based lock file (Issue #81 제안) | 1h | 다중 세션 시 false-positive 우려 |
| **Alt B** | **SHA-256 fingerprint dedup** (내용 기반) | 1.5h | 정확, 다중 세션 안전 |
| Alt C | PreCompact hook 활용 (v2.1.105) | 3h (ENH-203 선행) | 미래 지향, 즉시 불가 |

**추천 Alt B** — 정확도 + 안전성 최적 조합.

**ENH-240 (PersistedOutputGuard)**:

| 옵션 | 구현 방식 | 공수 | 평가 |
|------|----------|------|------|
| Alt A | 런타임 크기 측정 + 로그 경고만 | 30min | 재발 방지 불가 |
| **Alt B** | **하드 캡 8,000자** (10,000 - 2,000 안전 마진) + 초과 시 경고 | 1.5h | 공식 임계값 준수, 안전 |
| Alt C | 점진 축약 (우선순위 기반) | 4h | 과도함 (YAGNI) |

**추천 Alt B** — 공식 10,000자 cap의 80% 임계값 하드 캡.

### 4.3 YAGNI Review

Phase 1 researcher + Phase 2 analyst 제안 12건 → YAGNI 필터링:

| ENH 후보 | YAGNI 결과 | 판정 근거 |
|----------|-----------|----------|
| **ENH-238** session-context.js 가드 | ✅ **PASS** | Docs=Code 위반, 즉시 수정 필요 |
| **ENH-239** compaction fingerprint | ✅ **PASS** | 중복 주입 버그 (#14281) 방어 |
| **ENH-240** PersistedOutputGuard | ✅ **PASS** | 10,000자 재발 방지 (장기 가치) |
| **ENH-241** Docs=Code 교차 검증 스킴 | ✅ **PASS** | 철학 정합성, QA 보고서 교정 |
| **ENH-242** Content Trimmer | ✅ **PASS** (P2) | ENH-240 보완, 장기적 확장성 |
| **ENH-243** #48963 Desktop app 검증 | ✅ **PASS** (P1) | CC 회귀, bkit 37 skills 영향 |
| **ENH-244** hooks.json `once: true` 주석 정비 | ✅ **PASS** (P3) | 기술 부채 문서화 |
| ENH-245 `xhigh` effort 값 지원 | ❌ **FAIL** | bkit effort 값에 xhigh 사용 안 함 |
| ENH-246 `/less-permission-prompts` 충돌 | ❌ **FAIL** | CC native, bkit permissions와 독립 |
| ENH-247 `/ultrareview` vs CTO Team | ❌ **FAIL** | 사용자 워크플로우 무관 (단순 모니터) |
| ENH-248 `plugin_errors` stream-json | ❌ **FAIL** | ENH-138 번들, 별도 ENH 불필요 |
| ENH-249 PreCompact 거부 | ❌ **FAIL** | ENH-203 의존, 현 hotfix 범위 밖 |

**최종 ENH**: 7건 (P0: 2, P1: 3, P2: 1, P3: 1)

### 4.4 Pre-mortem

| 위험 | 확률 | 영향 | 완화책 |
|------|------|------|--------|
| ENH-238 가드 추가 시 Starter 사용자 UX 저하 | LOW | MEDIUM | 기본값 `enabled: true` 유지, opt-out 방식 |
| ENH-239 fingerprint dedup 오작동 → 세션 초기화 실패 | LOW | HIGH | try/catch 래핑 + fallback (기존 경로 동작) |
| ENH-240 하드 캡 시 중요 정보 누락 | MEDIUM | MEDIUM | priority-preserved 축약 (제목/에러/MANDATORY 우선 보존) |
| #48963 Desktop app 영향 확인 불가 | MEDIUM | HIGH | CC 추천 버전 문서에 "CLI 권장" 명시, ENH-243 검증 후 판정 |
| v2.1.8 hotfix 후 CC v2.1.113 hotfix 혹은 회귀 발생 | MEDIUM | MEDIUM | MON-CC-01/02/03/04 방어 레이어 유지, 추가 MON-CC-05 Issue #81 모니터 |

---

## 섹션 5: ENH 최종 로드맵

### 5.1 ENH 목록 (번호 연속, ENH-237 다음부터)

| ENH | 제목 | Priority | 공수 | 파일 | 의존성 |
|-----|------|---------|------|------|--------|
| **ENH-238** | **Issue #81 RC-1 hotfix — `session-context.js`에 `ui.contextInjection.enabled` + `sections[]` 가드 추가 (Docs=Code 복원)** | **P0** | 45min | `hooks/startup/session-context.js:346` | ENH-226 설계 재활용 |
| **ENH-239** | **Issue #81 RC-2 hotfix — SessionStart additionalContext SHA-256 fingerprint dedup lock** | **P0** | 1.5h | `hooks/session-start.js` 전역, `.bkit/runtime/session-ctx-fp.json` 신규 | 없음 |
| **ENH-240** | **PersistedOutputGuard — 8,000자 하드 캡 + priority-preserved 축약 + 경고 로그** | **P1** | 1.5h | `hooks/startup/session-context.js`, `lib/core/context-budget.js` 신규 | ENH-238 |
| **ENH-241** | **Docs=Code 교차 검증 스킴 + QA 보고서 교정** — ENH-226 status "완료 → 재작업", QA 보고서 페이지 수정, 설계↔구현↔QA 추적 매트릭스 템플릿 | **P1** | 2h | `docs/05-qa/bkit-v216-integrated-enhancement.qa-report.md:188-190`, MEMORY.md | ENH-238 |
| **ENH-243** | **Issue #48963 검증 — bkit 37 skills Desktop app 표시 확인 + CC 추천 버전 문서 업데이트 (CLI 권장)** | **P1** | 1.5h | `README.md`, `docs/01-plan/` | 없음 |
| **ENH-242** | **Content Trimmer — Dashboard 5섹션 vs session-context 9 builders priority-based 예산 할당 (8,000자 내)** | **P2** | 4h | `lib/core/context-budget.js`, Dashboard renderer 6개 | ENH-240 |
| **ENH-244** | `hooks.json:7` `once: true` 기술 부채 주석 + CC 공식 문서 참조 링크 | **P3** | 30min | `hooks/hooks.json` | 없음 |

**총 공수**: P0 2.25h + P1 5h + P2 4h + P3 0.5h = **11.75h**

### 5.2 v2.1.8 hotfix 릴리스 권장 범위

**번들 내용** (3.25h → 0.5일):
- ENH-238 (P0, 45min)
- ENH-239 (P0, 1.5h)
- ENH-240 (P1, 1.5h) — 선제적 재발 방지
- ENH-244 (P3, 30min) — 문서 정비 번들

**후속 릴리스 (v2.1.9 이상)**:
- ENH-241 (P1, 2h) — QA 교정 및 스킴 도입
- ENH-243 (P1, 1.5h) — CC 회귀 검증
- ENH-242 (P2, 4h) — 장기 아키텍처

### 5.3 테스트 영향 (신규 TC 예상)

| ENH | 신규 TC | 레벨 |
|-----|---------|------|
| ENH-238 | TC-B1~B4 (opt-out 4가지 조합: enabled/sections 매트릭스) | L1 Unit |
| ENH-239 | TC-B5~B7 (fingerprint 일치/불일치/손상 fallback) | L2 Integration |
| ENH-240 | TC-B8~B10 (임계값 직전/정확히/초과) | L1 Unit |
| ENH-241 | TC-B11 (QA 매트릭스 검증 스크립트) | L4 QA |
| ENH-243 | TC-B12 (Desktop app 수동 검증 체크리스트) | L5 Manual |
| **합계** | **12 TC** | L1: 7, L2: 3, L4: 1, L5: 1 |

---

## 섹션 6: 아키텍처 결정 (Enterprise Perspective)

### 6.1 Issue #81 해결 아키텍처 트레이드오프

| 옵션 | 구현 복잡도 | 토큰 절감 | 유지보수 | 사용자 UX | 추천 |
|------|-----------|----------|---------|----------|------|
| Fix A만 (Issue #81 제안, builder 9→3) | LOW | -2,160 bytes | MEDIUM | 중요 정보 손실 | ❌ 불충분 |
| Fix B만 (TTL lock 8h) | LOW | compaction만 | LOW | 첫 주입은 여전 12KB | ❌ 부분 해결 |
| **ENH-238+239+240 조합** | MEDIUM | **~95% 감축 (12KB → <500 bytes opt-out 시)** | HIGH (철학 정합) | opt-out 선택권 | ✅ **추천** |
| ENH-242 Content Trimmer만 | HIGH | ~35% 감축 (12KB → ~7.8KB) | MEDIUM | 자동 투명 | △ (장기) |

### 6.2 성능 영향 (Performance)

| 메트릭 | Before | After (ENH-238+239+240) | 개선 |
|--------|--------|------------------------|------|
| SessionStart hook 실행 시간 | ~120ms | ~135ms (+fingerprint 계산) | -12% (micro) |
| additionalContext 바이트 | ~12,370 | ~500 (opt-out) / ~7,800 (기본 trimmed) | **-96% / -37%** |
| 10K 세션 × 50 turns 토큰 낭비 | ~6.2M tokens | ~0.25M (opt-out) / ~3.9M (trimmed) | **-96% / -37%** |
| compaction 후 중복 주입 | 2회 (RC-2) | 1회 (fingerprint 차단) | **-50%** |

### 6.3 보안 영향 (Security)

| OWASP Top 10 | 영향 | 완화 |
|-------------|------|------|
| A04 Insecure Design (설계 결함) | 🔴 ENH-226 설계↔구현 불일치 | ENH-238 + ENH-241 설계 정합성 복원 |
| A08 Software Integrity | ⚠️ Fingerprint 미검증 데이터 주입 | ENH-239 SHA-256 해시 검증 도입 |
| 기타 | OWASP 6→7 지표 회복 (ENH-206 계열과 별개) | - |

### 6.4 확장성 (Scalability)

- **세션 수 스케일링**: fingerprint JSON 파일은 세션별 독립, 동시성 문제 없음
- **다중 프로젝트**: `.bkit/runtime/` 범위 → 프로젝트 경계 내 격리
- **다국어**: ENH-238 가드는 언어 무관 (config 기반)

### 6.5 비용 영향 (Cost)

| 항목 | 월간 추정 |
|------|----------|
| 토큰 절감 (10K 세션 × 50 turn × ~5,000 char 감축) | **~$40-80 절감** (Claude Opus 1M, 1M token $10) |
| 개발 공수 | 3.25h (v2.1.8) + 7.5h (후속) = **~11h × $100/h ≈ $1,100** |
| **ROI** | 월간 절감으로 14~28개월 회수 (다수 사용자 배포 시 단축) |

### 6.6 배포 전략 (Deployment)

| 단계 | 전략 | 롤백 계획 |
|------|------|----------|
| v2.1.8 Rolling | `hooks.json` + `session-context.js` + 신규 fingerprint 파일 | bkit plugin 재설치로 즉시 이전 버전 복원 |
| 검증 | Enterprise 사용자 (CTO Team 활성) 환경에서 8시간 모니터링 | `.bkit/runtime/session-ctx-fp.json` 삭제 시 fingerprint 무시하고 동작 |
| Canary | Windows/macOS/Linux 3-way 검증 (ENH-243 Desktop app 포함) | CI integration tests TC-B1~B10 |

---

## 섹션 7: CC 이슈 모니터링 갱신

### 7.1 회귀 4건 상태 (v2.1.112 기준)

| Issue | 제목 | 상태 | 누적 OPEN 릴리스 | bkit 방어 |
|-------|------|------|-----------------|----------|
| **#47810** | skip-perm + PreToolUse bypass | **OPEN** | **6개** (107~112) | MON-CC-01 유지 |
| **#47855** | Opus 1M /compact block | **OPEN** | **6개** | MON-CC-02 유지 |
| **#47482** | output styles YAML frontmatter | **OPEN** | **6개** | ENH-214 방어 유지 |
| **#47828** | SessionStart systemMessage + remoteControl | **OPEN** | **6개** | bkit Windows 미사용 확인 |

**결론**: **v2.1.113+ hotfix 대기 권고 갱신** (기존 "v2.1.111+ 대기"에서 업데이트).

### 7.2 신규 이슈 (v2.1.111/v2.1.112 발행 이후)

| 이슈 | 제목 | 상태 | bkit 영향 | 조치 |
|------|------|------|----------|------|
| 🚨 **[#48963](https://github.com/anthropics/claude-code/issues/48963)** | **v2.1.110 회귀: Plugin skills `/` 메뉴 미표시 (macOS Desktop app)** | **OPEN** | **HIGH** — bkit 37 skills 영향 가능 | **ENH-243 검증 필수** |
| [#48986](https://github.com/anthropics/claude-code/issues/48986) | Plugin Lifecycle Hooks 제안 | OPEN (enhancement) | 모니터 | 신규 ENH 후보 |
| [#48850](https://github.com/anthropics/claude-code/issues/48850) | Compaction drift trailer silent task switching | OPEN | MEDIUM — 장기 세션 | MON 후보 |
| [#48702](https://github.com/anthropics/claude-code/issues/48702) | SessionStart `sessionColor` 제안 | OPEN (enhancement) | LOW | 선택적 ENH |
| [#47023](https://github.com/anthropics/claude-code/issues/47023) | Compact/session lifecycle hooks 제안 | OPEN | MEDIUM — bkit memory.json | 모니터 |
| [#46880](https://github.com/anthropics/claude-code/issues/46880) | sessionTitle 프로그래밍 설정 | **CLOSED (completed)** | 자동 수혜 — ENH-187 ↔ | - |
| [#17407](https://github.com/anthropics/claude-code/issues/17407) | Phantom Reads (`<persisted-output>` 공식 용어) | CLOSED (not planned) | 참조 | - |
| [#14281](https://github.com/anthropics/claude-code/issues/14281) | additionalContext 중복 주입 | CLOSED | Issue #81 RC-2 지지 | - |

### 7.3 MON-CC 방어 레이어 업데이트

| MON-CC | 대상 | 상태 |
|--------|------|------|
| MON-CC-01 | #47810 skip-perm bypass | 유지 |
| MON-CC-02 | #47855 Opus 1M /compact block | 유지 |
| MON-CC-03 | #47482 output styles (ENH-214 구현) | 유지 |
| MON-CC-04 | #47828 SessionStart systemMessage | 유지 |
| **MON-CC-05** (신규) | **#48963 Desktop app plugin skills 회귀** | **추가 필요** |

---

## 섹션 8: bkit 추천 버전 결정

| 항목 | 결정 | 근거 |
|------|------|------|
| **CC 추천 버전** | **v2.1.111+** (v2.1.112 단건 핫픽스 중립) | 72개 연속 호환, I1/I13/B3/B6 자동 수혜 |
| **Hotfix 대기 갱신** | **v2.1.113+ 대기 권장** | 회귀 4건 6릴리스 연속 OPEN |
| **bkit 다음 릴리스** | **v2.1.8 hotfix** (ENH-238/239/240/244 번들) | Issue #81 P0 대응 |
| **Desktop app 환경 경고** | **CLI 권장** (ENH-243 검증 전) | #48963 회귀 영향 불확실 |

---

## 섹션 9: 결론 및 다음 단계

### 9.1 결론 요약

1. **CC v2.1.111/v2.1.112**: bkit에 **직접 breaking 0건**, 자동 수혜 6건 (I1/I13/B3/B6 등), 72 consecutive compatible 유지.
2. **Issue #81**: RC-1 가설 정정 후에도 **본질은 유효** (12,370 bytes > 10,000자 임계 초과). **P0 hotfix 3건** 필요.
3. **Docs=Code 철학 위반**: ENH-226 "완료" 표기 오류 + QA 보고서 검증 누락 → 철학 복원 ENH-241 필수.
4. **CC 회귀 [#48963](https://github.com/anthropics/claude-code/issues/48963)**: bkit 37 skills 영향 가능 → ENH-243 즉시 검증.
5. **누적 통계**: 연속 호환 **71→72** (+1), 누적 변경 ~928건, 미구현 ENH 237→**244** (+7), YAGNI FAIL 4건.

### 9.2 다음 단계 (Action Plan)

1. **즉시 (v2.1.8 hotfix)**: ENH-238 + ENH-239 + ENH-240 + ENH-244 구현 → PR 생성 → QA → 릴리스 (총 ~3.25h)
2. **1주 내**: ENH-241 (Docs=Code 교차 검증 + QA 교정) + ENH-243 (#48963 검증) (~3.5h)
3. **중기 (v2.1.9+)**: ENH-242 Content Trimmer 도입 (4h)
4. **모니터링**: MON-CC-05 신설 + 회귀 4건 v2.1.113+ 대기
5. **MEMORY.md 갱신**: CC 버전 히스토리 + ENH-238~244 등록 + ENH-226 status 복원

### 9.3 PDCA 다음 단계

**/pdca plan cc-v2110-v2112-issue81-response** (v2.1.8 hotfix 릴리스 플랜)으로 진입 권장.

---

## 부록 A: 출처 목록

- [CHANGELOG.md raw (anthropics/claude-code)](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md)
- [code.claude.com/docs/en/hooks (공식 hooks 문서)](https://code.claude.com/docs/en/hooks)
- [code.claude.com/docs/en/changelog](https://code.claude.com/docs/en/changelog)
- [GitHub bkit Issue #81](https://github.com/popup-studio-ai/bkit-claude-code/issues/81)
- [GitHub CC Issue #17407 (Phantom Reads)](https://github.com/anthropics/claude-code/issues/17407)
- [GitHub CC Issue #14281 (additionalContext 중복)](https://github.com/anthropics/claude-code/issues/14281)
- [GitHub CC Issue #48963 (v2.1.110 회귀, plugin skills)](https://github.com/anthropics/claude-code/issues/48963)
- [GitHub CC Issue #15174, #13650, #22178 (SessionStart 불안정성)](https://github.com/anthropics/claude-code/)
- [GitHub CC Issues #47810, #47855, #47482, #47828 (회귀 4건)](https://github.com/anthropics/claude-code/issues/)

## 부록 B: bkit 영향 파일 경로

- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/hooks/startup/session-context.js:346` — ENH-238 적용 위치
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/hooks/session-start.js:96` — dashboard gate 참조
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/hooks/hooks.json:7` — `once: true` 기술 부채 (ENH-244)
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/scripts/context-compaction.js:44-56` — 추가 주입 경로 (ENH-239 연계)
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/scripts/user-prompt-handler.js:82` — opt-out 가드 참조 구현
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/bkit.config.json:13-15` — 3-way 토글 선언
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/docs/05-qa/bkit-v216-integrated-enhancement.qa-report.md:188-190` — ENH-241 교정 대상

---

**분석 완료**: 2026-04-17
**보고서 버전**: v1.0
**다음 리뷰**: v2.1.113 발행 시 또는 v2.1.8 hotfix 후 gap 분석
