# CC v2.1.78~v2.1.81 심층 재분석 + ENH-117~142 종합 정리 보고서

> **Status**: ✅ Complete
>
> **Project**: bkit Vibecoding Kit
> **Version**: v2.0.5 (분석 시점)
> **Author**: CC Version Analysis Workflow (Deep Re-analysis)
> **Completion Date**: 2026-03-23
> **PDCA Cycle**: #21

---

## Executive Summary

### 1.1 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **기능** | CC v2.1.78~v2.1.81 (4개 릴리스) 심층 재분석 + ENH-117~142 구현 상태 종합 정리 |
| **시작일** | 2026-03-23 |
| **완료일** | 2026-03-23 |
| **기간** | 1일 (재분석) |

### 1.2 성과 요약

```
┌──────────────────────────────────────────────────────┐
│  심층 재분석 결과                                      │
├──────────────────────────────────────────────────────┤
│  📊 기존 보고서 분석 건수:  ~102건                     │
│  📊 실제 변경 건수 (정정): ~115건 (+13건 누락)         │
│  🔍 시스템 프롬프트 누락:   22건 (HIGH 4건)           │
│  🔍 CLI 변경 누락:          11건 (HIGH 2건)           │
│  🆕 신규 GitHub Issues:     6건 (HIGH 2건)            │
│  📋 신규 ENH 기회:          6건 (ENH-143~148)         │
│  ✅ ENH-117~142 구현률:     14/26 완료 (53.8%)        │
│  ⚠️  미구현 ENH:             12건 (P0 1건, P1 3건)     │
│  🔢 누적 sys prompt:       +6,029 tokens (4개 버전)   │
└──────────────────────────────────────────────────────┘
```

### 1.3 전달된 가치

| 관점 | 내용 |
|------|------|
| **문제** | 기존 4개 개별 보고서에서 ~39건 누락(시스템 프롬프트 22건, CLI 11건, 신규 이슈 6건) + ENH-117~142의 실제 구현 상태 불명확 |
| **해결 방법** | 2개 병렬 에이전트(cc-version-researcher + Explore)로 GitHub/npm/Piebald 재조사 + 코드베이스 전수 검증 |
| **기능/UX 효과** | HIGH 영향 누락 8건 발견, 신규 ENH 6건 도출, 보안 정책 변경 4건 식별, CTO Team 직접 영향 이슈 #37520 발견 |
| **핵심 가치** | 기존 분석의 정확도 보정(102건→115건) + ENH 로드맵 명확화(구현 14건/미구현 12건/신규 6건) + 보안 위협 사전 식별 |

---

## Part 1: v2.1.78~v2.1.81 심층 재분석

### 2. 변경 건수 정정

| Version | 기존 보고서 | 실제 (CLI + sys prompt) | 차이 | sys prompt tokens |
|---------|-----------|----------------------|------|-------------------|
| v2.1.78 | ~26건 | ~31건 (CLI 25 + SP 6) | **+5 누락** | +1,956 |
| v2.1.79 | ~18건 | ~25건 (CLI 14 + VSCode 4 + SP 7) | **+7 누락** | +714 |
| v2.1.80 | ~19건 | ~20건 (CLI 17 + SP 3) | +1 누락 | +3,065 |
| v2.1.81 | ~39건 | ~39건 (CLI 27 + SP 12) | 정확 | +294 |
| **합계** | **~102건** | **~115건** | **+13건 누락** | **+6,029** |

### 3. HIGH 영향 누락 항목 (8건)

#### 3.1 시스템 프롬프트 누락 (HIGH 4건)

| ID | Version | 변경 내용 | bkit 영향 |
|----|---------|----------|-----------|
| SP-78-5 | v2.1.78 | Auto mode rule #6 — 공개 서비스(gists, Pastebin 등) 무단 게시 금지 | bkit auto mode L3-L4에서 보안 정책 강화 |
| SP-79-7 | v2.1.79 | Memory "do not save" 룰 강화 — 놀라운/비자명한 것만 저장 | bkit auto-memory 저장 정책에 직접 영향 |
| SP-81-6 | v2.1.81 | Security monitor — "silence is not consent" 원칙 | Automation Level 상위에서 보안 검증 강화 |
| SP-81-7 | v2.1.81 | Security monitor — 내부 파일 기본 민감 분류 | scripts/, hooks/ 업로드 시 민감 처리 |

#### 3.2 CLI 변경 누락 (HIGH 2건)

| ID | Version | 변경 내용 | bkit 영향 |
|----|---------|----------|-----------|
| C-78-5 | v2.1.78 | .git/.claude 보호 디렉토리 bypassPermissions 보안 수정 | bkit 플러그인 디렉토리 보안 강화 |
| C-78-8 | v2.1.78 | Silent sandbox disable 보안 경고 추가 | 보안 정책 인식 필요 |

#### 3.3 신규 GitHub Issues (HIGH 2건)

| Issue | 제목 | bkit 영향 |
|-------|------|-----------|
| **#37520** | 병렬 agent OAuth 401 회귀 | **CTO Team 직접 영향** — 3+ 병렬 agent spawn 시 인증 실패 |
| **#37745** | PreToolUse hook 시 --dangerously-skip-permissions 리셋 | bkit PreToolUse hook 사용자 잠재적 영향 |

### 4. 시스템 프롬프트 변경 전체 목록 (28건)

#### v2.1.78 (6건, +1,956 tokens)

| # | 유형 | 변경 | 영향도 |
|---|------|------|--------|
| 1 | NEW | Dream memory consolidation 워크플로우 | MEDIUM |
| 2 | NEW | Feedback memory 타입 설명 + 모순 검사 | MEDIUM |
| 3 | REMOVED | Private feedback memory 타입 삭제 | LOW |
| 4 | REMOVED | Tone and style 간결 출력 지시 제거 | LOW |
| 5 | MODIFIED | Auto mode rule #6 — 공개 서비스 게시 금지 | **HIGH** |
| 6 | MODIFIED | 3rd-party 도구 업로드 민감도 검토 | MEDIUM |

#### v2.1.79 (7건, +714 tokens)

| # | 유형 | 변경 | 영향도 |
|---|------|------|--------|
| 1 | REMOVED | Tool Use Summary 과거형 요약 삭제 | LOW |
| 2 | NEW | Programmatic Model Discovery (Python SDK/HTTP) | MEDIUM |
| 3 | MODIFIED | Team memory content reference 렌더링 | LOW |
| 4 | MODIFIED | Memory file contents reference 적용 | LOW |
| 5 | MODIFIED | Claude API skill — Models API 엔드포인트 추가 | LOW |
| 6 | MODIFIED | /loop 커맨드 — 설정 가능 만료기간 | LOW |
| 7 | MODIFIED | Memory "do not save" 룰 강화 | **HIGH** |

#### v2.1.80 (3건, +3,065 tokens)

| # | 유형 | 변경 | 영향도 |
|---|------|------|--------|
| 1 | NEW | /schedule 커맨드 — cron 원격 agent 스케줄링 | MEDIUM |
| 2 | MODIFIED | Status line — rate_limits 객체 추가 | MEDIUM |
| 3 | MODIFIED | HTTP error codes reference 업데이트 | LOW |

#### v2.1.81 (12건, +294 tokens)

| # | 유형 | 변경 | 영향도 |
|---|------|------|--------|
| 1 | NEW | /review (remote) 커맨드 | LOW |
| 2 | NEW | Auto mode rule reviewer (257 tokens) | **HIGH** |
| 3 | NEW | Minimal mode (--bare) 동작 설명 | MEDIUM |
| 4 | MODIFIED | /batch — "Explore agents"→"subagents" 용어 | LOW |
| 5 | MODIFIED | /schedule — 인증 변수 참조 제거 | LOW |
| 6 | MODIFIED | Security monitor 1부 — "silence is not consent" | **HIGH** |
| 7 | MODIFIED | Security monitor 2부 — 내부 파일 민감 분류 | **HIGH** |
| 8 | MODIFIED | /init CLAUDE.md — subagent 용어 통일 | LOW |
| 9 | MODIFIED | Simplify skill — 불필요 주석 검사 강화 | MEDIUM |
| 10 | MODIFIED | Fork guidelines — subagent 용어 통일 | LOW |
| 11 | MODIFIED | Tool usage — 도구명 단순화 | LOW |
| 12 | MODIFIED | Plan mode — explore 단계 수정 | LOW |

### 5. 신규 GitHub Issues (v2.1.81 이후)

| Issue | 심각도 | bkit 영향 | 상태 |
|-------|--------|-----------|------|
| #37520 | **HIGH** | CTO Team 병렬 agent OAuth 401 | OPEN |
| #37745 | **HIGH** | PreToolUse hook + --dangerously-skip-permissions 리셋 | OPEN |
| #37730 | MEDIUM | Subagents permission 미상속 | OPEN |
| #37729 | MEDIUM | SessionStart env vars /clear 미정리 | OPEN |
| #37746 | MEDIUM | Vertex AI hooks 호환 문제 | OPEN |
| #37747 | MEDIUM | MCP OAuth redirect 회귀 | OPEN |

---

## Part 2: ENH-117~142 종합 구현 상태

### 6. 구현 상태 전수 검증 결과

#### 6.1 완전 구현 (IMPLEMENTED) — 6건

| ENH | 설명 | 우선순위 | 구현 버전 | 검증 증거 |
|-----|------|----------|----------|-----------|
| **117** | PostCompact hook | P1 | v1.6.2 | hooks.json:116-126, scripts/post-compaction.js (132 LOC) |
| **118** | StopFailure hook | P1 | v1.6.2 | hooks.json:82-92, scripts/stop-failure-handler.js (165 LOC) |
| **119** | ${CLAUDE_PLUGIN_DATA} 영구 상태 | P0 | v1.6.2 | lib/core/paths.js:29-335 (backup/restore 포함) |
| **120** | Agent frontmatter effort/maxTurns | P0 | v1.6.2 | 31/31 agents ✅ (grep 검증 완료) |
| **127** | 1M context 기본화 문서 | P0 | v1.6.2 | context-engineering.md + session-start.js |
| **132** | SessionEnd hook 구현 | P2 | v2.0.0 | hooks.json:171-181, scripts/session-end-handler.js (~135 LOC) |

#### 6.2 문서화 완료 (DOCUMENTED) — 8건

| ENH | 설명 | 우선순위 | 위치 |
|-----|------|----------|------|
| **121** | modelOverrides 가이드 | P2 | context-engineering.md |
| **122** | autoMemoryDirectory 활용 | P1 | context-engineering.md |
| **123** | worktree.sparsePaths | P2 | context-engineering.md |
| **124** | /effort 가이드 | P2 | context-engineering.md + session-start.js |
| **125** | allowRead sandbox | P2 | context-engineering.md |
| **126** | 128K 출력 토큰 | P1 | context-engineering.md |
| **128** | Hook source 표시 | P3 | context-engineering.md |
| **129** | tmux 알림 통과 | P2 | context-engineering.md |
| **130** | Session name (-n) 활용 | P2 | context-engineering.md |

#### 6.3 미구현 (NOT IMPLEMENTED) — 12건

| ENH | 설명 | 기존 P | YAGNI 재검토 | 재조정 P | 상태 |
|-----|------|--------|-------------|---------|------|
| **134** | Skills effort frontmatter | P0 | ✅ PASS — agents 완료, skills 0/36 | **P0** | 36 skills SKILL.md 수정 필요 |
| **138** | --bare CI/CD 가이드 | P1 | ✅ PASS — CI/CD 사용자 실질 가치 | **P1** | SKILL.md 2개 업데이트 |
| **139** | Plugin freshness 배포 전략 | P1 | ✅ PASS — 배포 전략 직접 영향 | **P1** | plugin.json + 문서 |
| **148** | SessionStart env /clear 대응 | — | ✅ PASS — #37729 직접 영향 | **P1** | hook 방어 로직 |
| **131** | PLUGIN_SEED_DIR multi-dir | P3 | ❌ FAIL — 단일 플러그인 환경 | **P3** | 문서만 |
| **135** | rate_limits statusline | P2 | ⚠️ BORDERLINE — 사용자 요청 없음 | **P3 강등** | dashboard 연동 |
| **136** | source:'settings' 문서화 | P2 | ✅ PASS — 비용 극소 | **P2** | 문서만 |
| **137** | --channels MCP 연구 | P3 | ❌ FAIL — preview 단계 | **P3** | 대기 |
| **140** | Plan mode clear context | P2 | ⚠️ BORDERLINE — PreCompact가 처리 | **P3 강등** | 문서만 |
| **141** | Auto mode rule reviewer | P2 | ✅ PASS — L3-L4 자동화 활용 | **P2** | 문서 + 연동 |
| **142** | Plugin re-clone 문서화 | P2 | ✅ PASS — ENH-139와 통합 | **P2 (139에 통합)** | 문서 |
| **133** | Turn duration toggle 가이드 | P3 | ❌ FAIL — 사소한 UI 옵션 | **제거** | 불필요 |

### 7. 신규 ENH 기회 (ENH-143~148)

| ENH | Priority | 설명 | 근거 | YAGNI |
|-----|----------|------|------|-------|
| **143** | **P1** | 병렬 agent spawn 지연 workaround | #37520 — CTO Team 안정성 | ✅ PASS |
| **144** | P2 | /schedule 원격 PDCA 스케줄링 | SP-80-1 — cron 기반 자동 실행 | ⚠️ BORDERLINE |
| **145** | P2 | Dream memory consolidation 활용 | SP-78-1 — memory 품질 개선 | ⚠️ BORDERLINE |
| **146** | P3 | Programmatic Model Discovery | SP-79-2 — 모델 조회 자동화 | ❌ FAIL |
| **147** | P2 | Security monitor 강화 정책 문서화 | SP-81-6/7 — 보안 인식 | ✅ PASS |
| **148** | **P1** | SessionStart env /clear 미정리 대응 | #37729 — hook 안정성 | ✅ PASS |

---

## Part 3: ENH 우선순위 재조정 종합

### 8. 액션 로드맵 (우선순위순)

#### Tier 1: 즉시 구현 (P0-P1, ~6시간)

| ENH | 설명 | 예상 작업량 | 영향 파일 |
|-----|------|------------|----------|
| **134** | 36 Skills effort frontmatter | 2h | skills/*/SKILL.md (36개) |
| **138** | --bare CI/CD 가이드 | 1h | skills/claude-code-learning/SKILL.md, skills/phase-9-deployment/SKILL.md |
| **139+142** | Plugin freshness 배포 전략 + 문서 | 1.5h | .claude-plugin/plugin.json, skills/claude-code-learning/SKILL.md |
| **143** | 병렬 agent spawn 지연 | 1h | CLAUDE.md 또는 scripts/subagent-start-handler.js |
| **148** | SessionStart env /clear 방어 | 0.5h | scripts/session-start.js |

#### Tier 2: 다음 사이클 (P2, ~4시간)

| ENH | 설명 | 예상 작업량 |
|-----|------|------------|
| **136** | source:'settings' 문서화 | 0.5h |
| **141** | Auto mode rule reviewer 활용 | 1h |
| **144** | /schedule PDCA 스케줄링 | 2h |
| **145** | Dream memory consolidation | 1h |
| **147** | Security monitor 정책 문서 | 0.5h |

#### Tier 3: 보류/대기 (P3)

| ENH | 설명 | 사유 |
|-----|------|------|
| 131 | PLUGIN_SEED_DIR multi-dir | 단일 플러그인, YAGNI |
| 135 | rate_limits statusline | 사용자 요청 없음, P2→P3 강등 |
| 137 | --channels MCP | preview 단계, API 불안정 |
| 140 | Plan mode clear context | PreCompact hook이 처리, P2→P3 강등 |
| 146 | Model Discovery | YAGNI FAIL |

#### 제거

| ENH | 설명 | 사유 |
|-----|------|------|
| 133 | Turn duration toggle 가이드 | 사소한 UI 옵션, 코드베이스에서 미참조, 실질 가치 없음 |

---

## Part 4: GitHub Issues 모니터링 업데이트

### 9. 전체 이슈 현황

| # | 제목 | 상태 | 영향도 | 변동 |
|---|------|------|--------|------|
| #29423 | Task subagents ignore CLAUDE.md | OPEN | HIGH | 변동 없음 |
| #34197 | CLAUDE.md ignored | OPEN | HIGH | 변동 없음 |
| #30613 | HTTP hooks JSON broken | OPEN | LOW | 변동 없음 |
| #33656 | PostToolUse bash non-zero | OPEN | MEDIUM | 변동 없음 |
| #35296 | 1M context 미작동 | OPEN | MEDIUM | 변동 없음 |
| #33963 | OOM crash | OPEN | LOW | 변동 없음 |
| #36059 | PreToolUse permissionDecision | OPEN | HIGH | 변동 없음 |
| #36058 | session_name in hook input | OPEN | LOW | 변동 없음 |
| #36755 | --resume crash _.startsWith | OPEN | MEDIUM | 변동 없음 |
| #36740 | 스킬 description 미표시 | OPEN | LOW | 변동 없음 |
| **#37520** | **병렬 agent OAuth 401** | **OPEN** | **HIGH** | **신규** |
| **#37745** | **PreToolUse + skip-permissions 리셋** | **OPEN** | **HIGH** | **신규** |
| **#37730** | **Subagents permission 미상속** | **OPEN** | **MEDIUM** | **신규** |
| **#37729** | **SessionStart env /clear 미정리** | **OPEN** | **MEDIUM** | **신규** |
| #37746 | Vertex AI hooks 호환 | OPEN | MEDIUM | 신규 (bkit 미영향) |
| #37747 | MCP OAuth redirect 회귀 | OPEN | MEDIUM | 신규 (간접) |

---

## Part 5: 연속 호환 릴리스 종합

```
v2.1.34 ─────────────────────────────────────────────── v2.1.81
          47 consecutive compatible releases
          0 breaking changes (bkit 기준)
          ~779+ total changes analyzed (정정: ~792+)
          +29,871 sys prompt tokens (v2.1.73~v2.1.81)
          Zero-downtime upgrade guaranteed
```

| 릴리스 범위 | 릴리스 수 | 분석 변경건 | ENH 도출 | sys prompt |
|-------------|-----------|------------|----------|------------|
| v2.1.34~v2.1.48 | 15 | ~200 | ENH-32~55 | — |
| v2.1.49~v2.1.72 | 24 | ~350 | ENH-56~116 | — |
| v2.1.73~v2.1.77 | 5 | ~140 | ENH-117~130 (v2.1.78 보고서) | +23,842 |
| v2.1.78~v2.1.81 | 4 | **~115** (정정) | ENH-131~148 | +6,029 |
| **합계** | **48** | **~805** | **148** | **+29,871** |

---

## 10. 주요 메트릭

| 메트릭 | 값 |
|--------|-----|
| **분석 대상** | 4개 릴리스 (v2.1.78~v2.1.81) |
| **실제 변경건** | ~115건 (기존 ~102건에서 정정) |
| **누락 발견** | 39건 (SP 22건, CLI 11건, Issues 6건) |
| **HIGH 누락** | 8건 (보안 4건, CLI 2건, Issues 2건) |
| **ENH 총수** | 148개 (ENH-32~148) |
| **ENH-117~142 구현률** | 14/26 (53.8%) |
| **ENH-117~142 미구현** | 12건 (P0 1건, P1 3건, P2 5건, P3 3건) |
| **신규 ENH** | 6건 (ENH-143~148) |
| **ENH 제거** | 1건 (ENH-133) |
| **sys prompt 누적** | +6,029 tokens (4개 버전) |
| **GitHub Issues** | 16건 모니터링 (HIGH 4건, MEDIUM 6건) |
| **연속 호환** | 47 릴리스 (v2.1.34~v2.1.81) |

---

## 11. Changelog

### v2.0.5 Deep Re-analysis (2026-03-23)

**발견 (Found)**:
- 기존 4개 보고서에서 누락된 39건 변경사항 식별
- HIGH 영향 누락 8건 (보안 정책 4건, CLI 보안 2건, 이슈 2건)
- 시스템 프롬프트 총 28건 변경 상세 분석 (+6,029 tokens)
- 신규 GitHub Issue #37520 (CTO Team 직접 영향)

**정정 (Corrected)**:
- v2.1.78 변경건: ~26건 → ~31건
- v2.1.79 변경건: ~18건 → ~25건
- 총 변경건: ~102건 → ~115건

**재분류 (Reclassified)**:
- ENH-135: P2 → P3 강등 (사용자 요청 없음)
- ENH-140: P2 → P3 강등 (PreCompact hook이 처리)
- ENH-133: 제거 (YAGNI FAIL, 실질 가치 없음)
- ENH-142: ENH-139에 통합

**추가 (Added)**:
- ENH-143~148: 6건 신규 기회
- GitHub Issues 6건 신규 모니터링 추가

---

**Report Status**: ✅ Complete (2026-03-23)
**Next Action**: ENH-134 (P0) 구현 시작 → `/pdca plan cc-v2178-v2181-enh-implementation`
