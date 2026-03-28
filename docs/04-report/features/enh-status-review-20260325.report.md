# ENH 미구현 현황 점검 보고서 (2026-03-25)

> **Status**: ✅ Complete
>
> **Project**: bkit Vibecoding Kit
> **Version**: v2.0.6 (점검 시점)
> **Author**: CC Version Analysis Workflow (ENH Status Review)
> **Completion Date**: 2026-03-25
> **PDCA Cycle**: #22

---

## Executive Summary

### 1.1 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **기능** | ENH-134~148 미구현 항목 코드베이스 실사 점검 |
| **시작일** | 2026-03-25 |
| **완료일** | 2026-03-25 |
| **기간** | 1회 점검 |
| **설치 CC 버전** | v2.1.81 |
| **npm 최신 버전** | v2.1.81 (동일) |

### 1.2 성과 요약

```
┌──────────────────────────────────────────────────────┐
│  미구현 ENH 현황 점검 결과                             │
├──────────────────────────────────────────────────────┤
│  📊 점검 대상 ENH:        ENH-134 ~ ENH-148 (15건)   │
│  ✅ 구현 완료:            0건                         │
│  ⏸️  P3 강등/대기:         4건 (135, 137, 140, 146)    │
│  ❌ 제거:                 1건 (133, YAGNI FAIL)       │
│  🔴 미구현:              10건 (P0: 1, P1: 4, P2: 5)  │
│  📝 미구현 중 문서만:     7건                         │
│  🔧 미구현 중 코드 필요:  3건 (134, 143, 148)         │
│  ⏱️  총 예상 작업량:       ~11시간                     │
└──────────────────────────────────────────────────────┘
```

### 1.3 전달된 가치

| 관점 | 내용 |
|------|------|
| **문제** | 2026-03-23 재분석 이후 미구현 ENH 10건의 실제 코드베이스 상태 불명확 |
| **해결 방법** | 4개 병렬 Explore 에이전트로 37개 SKILL.md, hooks, scripts, docs 전수 검증 |
| **기능/UX 효과** | 모든 미구현 ENH의 정확한 상태, 영향 파일, 작업량 확인 |
| **핵심 가치** | 구현 로드맵 구체화 — P0+P1 5건(~6h) 우선, P2 5건(~5h) 후순위 |

---

## 2. 구현 완료 / 처리 완료 항목 (기존)

| ENH | 상태 | 비고 |
|-----|------|------|
| 117~120, 127, 132 | ✅ 구현 완료 | PostCompact, StopFailure, PLUGIN_DATA, agent frontmatter, 1M context, SessionEnd |
| 121~126, 128~130 | ✅ 문서화 완료 | context-engineering.md 가이드 |
| 133 | ❌ 제거 | YAGNI FAIL, 실질 가치 없음 |
| 135 | ⏸️ P3 강등 | rate_limits statusline — 사용자 요청 없음 |
| 137 | ⏸️ P3 대기 | --channels MCP — preview 단계 대기 |
| 140 | ⏸️ P3 강등 | Plan mode clear context — PreCompact hook 처리 |
| 146 | ⏸️ P3 제거 | Programmatic Model Discovery — YAGNI FAIL |

---

## 3. 미구현 항목 상세 (10건)

### 3.1 P0: 핵심 기능

#### ENH-134: Skills effort frontmatter (P0)

| 항목 | 내용 |
|------|------|
| **우선순위** | P0 (Core PDCA workflow 직접 개선) |
| **유형** | 코드 수정 |
| **상태** | 🔴 완전 미구현 |
| **검증 결과** | 37개 SKILL.md 중 **0개**에 effort frontmatter 적용 |
| **예상 작업량** | ~2시간 |
| **영향 파일** | `skills/*/SKILL.md` (37개 파일 전체) |
| **CC 지원 버전** | v2.1.80+ (네이티브 effort frontmatter for skills) |
| **미적용 시 영향** | 모든 스킬이 기본 effort로 동작, 토큰 최적화 불가 |

**구현 방향**: 각 스킬의 특성에 맞는 effort 값(`low`, `medium`, `high`) 배정 후 SKILL.md frontmatter에 추가.

---

### 3.2 P1: 중요 개선 (4건)

#### ENH-138: --bare flag CI/CD 가이드 (P1)

| 항목 | 내용 |
|------|------|
| **유형** | 문서 |
| **상태** | 🔴 미구현 (분석 보고서만 존재) |
| **예상 작업량** | ~1시간 |
| **영향 파일** | `skills/claude-code-learning/SKILL.md`, `skills/phase-9-deployment/SKILL.md` |
| **CC 지원 버전** | v2.1.81+ |

**필요 작업**: `--bare` flag 사용 가이드 (hooks/LSP/plugin sync 스킵), CI/CD 파이프라인 예시 추가.

#### ENH-139+142: Plugin freshness 배포 전략 (P1)

| 항목 | 내용 |
|------|------|
| **유형** | 문서 |
| **상태** | 🔴 미구현 |
| **예상 작업량** | ~1.5시간 |
| **영향 파일** | `skills/claude-code-learning/SKILL.md`, `.claude-plugin/plugin.json` (검토) |
| **CC 지원 버전** | v2.1.81+ |

**현황**: plugin.json에 repository field 이미 설정됨. `/reload-plugins` 구형 안내를 자동 freshness로 업데이트 필요.
**필요 작업**: 2-track 배포 전략(안정화 tag vs 개발 branch), 오프라인 동작 안내.

#### ENH-143: 병렬 agent spawn 지연 workaround (P1)

| 항목 | 내용 |
|------|------|
| **유형** | 코드 |
| **상태** | 🔴 미구현 |
| **예상 작업량** | ~1시간 |
| **영향 파일** | `scripts/subagent-start-handler.js`, `CLAUDE.md` |
| **관련 이슈** | GitHub #37520 (OPEN, 병렬 agent OAuth 401) |

**현황**: `subagent-start-handler.js`(165 LOC)에 지연 로직, 타임아웃, OAuth 재시도 메커니즘 없음.
**필요 작업**: 500~1000ms spawn 간격 제어, exponential backoff 재시도 로직.

#### ENH-148: SessionStart env /clear 방어 (P1)

| 항목 | 내용 |
|------|------|
| **유형** | 코드 |
| **상태** | 🔴 미구현 |
| **예상 작업량** | ~0.5시간 |
| **영향 파일** | `hooks/session-start.js` |
| **관련 이슈** | GitHub #37729 (OPEN, SessionStart env 미정리) |

**현황**: `session-start.js`(173 LOC)에 환경 변수 정리/방어 로직 없음.
**필요 작업**: `CLAUDE_CODE_*` env var 검증/리셋, 이전 세션 오염 탐지.

---

### 3.3 P2: Nice-to-have (5건)

| ENH | 제목 | 유형 | 작업량 | 영향 파일 |
|-----|------|------|--------|----------|
| **136** | source:'settings' plugin 문서화 | 문서 | ~0.5h | CUSTOMIZATION-GUIDE.md |
| **141** | Auto mode rule reviewer 활용 | 문서 | ~1h | context-engineering.md |
| **144** | /schedule 원격 PDCA 스케줄링 | 문서 | ~2h | skills/pdca/SKILL.md |
| **145** | Dream memory consolidation | 문서 | ~1h | context-engineering.md |
| **147** | Security monitor 정책 문서화 | 문서 | ~0.5h | context-engineering.md |

**공통점**: 모두 CC 쪽에서 기능은 이미 구현됨. bkit은 활용 가이드 문서화만 필요.

---

## 4. 구현 로드맵 권장

### Tier 1: 즉시 구현 (~6시간)

```
순서 1: ENH-134 (P0, ~2h) — 37개 SKILL.md effort frontmatter 일괄 적용
순서 2: ENH-143 (P1, ~1h) — 병렬 agent spawn delay workaround
순서 3: ENH-148 (P1, ~0.5h) — SessionStart env 방어
순서 4: ENH-138 (P1, ~1h) — --bare CI/CD 가이드
순서 5: ENH-139+142 (P1, ~1.5h) — Plugin freshness 배포 전략
```

### Tier 2: 후순위 (~5시간)

```
ENH-136 (P2, ~0.5h) — source:'settings' 문서화
ENH-141 (P2, ~1h) — Auto mode rule reviewer
ENH-144 (P2, ~2h) — /schedule PDCA 스케줄링
ENH-145 (P2, ~1h) — Dream memory consolidation
ENH-147 (P2, ~0.5h) — Security monitor 정책
```

### Tier 3: 대기/보류

```
ENH-135 (P3) — rate_limits statusline (사용자 요청 시)
ENH-137 (P3) — --channels MCP (preview 안정화 후)
ENH-140 (P3) — Plan mode clear context
ENH-146 (P3) — Programmatic Model Discovery (YAGNI)
```

---

## 5. GitHub Issues 모니터링 현황

| Issue | 심각도 | bkit 영향 | 상태 | 관련 ENH |
|-------|--------|----------|------|---------|
| #37520 | HIGH | CTO Team 직접 영향 | OPEN | ENH-143 |
| #37729 | MEDIUM | SessionStart 오염 | OPEN | ENH-148 |
| #29423 | HIGH | Task subagent CLAUDE.md 무시 | OPEN | — |
| #34197 | HIGH | CLAUDE.md ignored | OPEN | — |
| #37745 | HIGH | PreToolUse + skip-permissions | OPEN | — |

---

## 6. 다음 버전 대비

- **CC v2.1.82+ 출시 시**: `/cc-version-analysis` 재실행하여 신규 변경사항 분석
- **ENH 번호**: ENH-149부터 시작
- **연속 호환 릴리스**: 현재 47개 (v2.1.34~v2.1.81)
