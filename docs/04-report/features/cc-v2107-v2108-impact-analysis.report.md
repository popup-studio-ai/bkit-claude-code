# CC v2.1.107 → v2.1.108 영향 분석 보고서

> **작성일**: 2026-04-15
> **분석 대상**: Claude Code CLI v2.1.107 → v2.1.108
> **bkit 버전**: v2.1.1 (current) / v2.1.5 (repo latest), v2.1.6 정비 릴리스 진행 중
> **분석자**: cc-version-researcher + bkit-impact-analyst (CTO Team Agent)
> **스킬**: `/bkit:cc-version-analysis`

---

## Executive Summary

### 4-Perspective Value Table

| Perspective | 핵심 발견 | 조치 |
|-------------|----------|------|
| **기술 (Technical)** | Hook 0건, Tool 0건, Frontmatter 0건 변경 — 구조적 영향 없음. 대신 `ENABLE_PROMPT_CACHING_1H` 전체 provider 통합 + `/recap` Away Summary + Skill→built-in slash cmd 호출 등 **3건 적극 채택 기회** | ENH-215~217 (P1 3건) |
| **운영 (Operational)** | 14건 fixes 중 **11건 자동 수혜** (메모리 감소 I1, --resume truncate B11, plugin auto-update B14, sessionTitle B6, Bash `#` 주석 B4 등). 코드 변경 0건 | v2.1.108 채택 안전 |
| **전략 (Strategic)** | v2.1.107 권고 "v2.1.108 hotfix 대기"가 **어긋남** — 회귀 4건 (#47482/#47810/#47855/#47828) **모두 OPEN 유지**. 권고를 **v2.1.109+ 대기**로 갱신 | MON-CC-01/02 + ENH-214 방어 레이어 유지 |
| **품질 (Quality)** | Breaking 0, **연속 호환 69개** (v2.1.34~v2.1.108) 달성. 신규 회귀 보고 없음 | bkit 직접 영향 0건 |

### 주요 수치

- **v2.1.108 변경사항**: ~24건 (Features 8, Improvements 2, Fixes 14)
- **Breaking changes**: 0건
- **bkit 연속 호환 릴리스**: **69개** (v2.1.34 ~ v2.1.108)
- **Hook events**: 26개 유지 (변동 0)
- **CC tools**: 32 runtime / 35 docs 유지 (변동 0)
- **시스템 프롬프트 토큰 변화**: 미미 (CHANGELOG 명시 없음, 구조 변경 없음)
- **신규 ENH**: 9건 (ENH-215~223), YAGNI FAIL 2건 (ENH-224, ENH-225)
- **공수 추정**: ~9h (검증 6h + 문서화 3h, **신규 코드 0건**)
- **회귀 해결**: 0건 (4건 모두 OPEN)

---

## Phase 1: v2.1.108 변경사항 조사

### 1.1 New Features (8건)

| # | Feature | 영향도 | bkit 관련성 | 상세 |
|---|---------|--------|-------------|------|
| **F1** | **`ENABLE_PROMPT_CACHING_1H` env var (전체 provider)** | **HIGH** | **직접** | API key/Bedrock/Vertex/Foundry 통합. 기존 `_BEDROCK` suffix deprecated(honored). 장기 PDCA 세션 캐시 적중률 향상 |
| **F2** | `FORCE_PROMPT_CACHING_5M` env var | MEDIUM | 선택적 | 짧은 세션/CI/디버깅용 강제 5분 TTL |
| **F3** | **Recap feature + `/recap` 명령** | **HIGH** | **직접** | 세션 복귀 자동 컨텍스트 요약. `/config` 토글, `CLAUDE_CODE_ENABLE_AWAY_SUMMARY=1`로 강제 활성화 가능 |
| **F4** | **Skill tool로 built-in slash 명령(`/init`/`/review`/`/security-review`) discover/invoke** | MEDIUM | **직접** | bkit Skills 호출 메커니즘과 동일. 보안 감사/리뷰 파이프라인 활용 기회 |
| F5 | `/undo` → `/rewind` alias | LOW | 없음 | 단순 alias 추가 |
| F6 | `/model` 경고: 대화 중간 모델 변경 시 uncached re-read | MEDIUM | 없음 | 사용자 경고만 |
| F7 | `/resume` picker default = 현재 디렉터리 (Ctrl+A 전체) | MEDIUM | 없음 | 자동 수혜 |
| F8 | 에러 메시지 개선: rate limit 구분, 5xx/529 → status.claude.com, slash 매치 제안 | MEDIUM | 없음 | 자동 수혜 |

### 1.2 Improvements (2건)

| # | Improvement | 영향도 | bkit 관련성 |
|---|-------------|--------|-------------|
| **I1** | **파일 read/edit 메모리 풋프린트 감소 (grammar 지연 로드)** | **MEDIUM (Perf)** | **간접** — 78 lib modules + 25/37 skills Bash 사용 자동 수혜 |
| I2 | `Ctrl+O` verbose 지시자 추가 | LOW | 없음 |
| I3 | `DISABLE_PROMPT_CACHING*` 사용 시 시작 경고 | LOW | 없음 |

### 1.3 Bug Fixes (14건)

**HIGH/MEDIUM impact bkit 관련**:

| # | Fix | 영향도 | bkit 영향 |
|---|-----|--------|-----------|
| B2 | DISABLE_TELEMETRY 사용자 1H TTL 정상화 (이전 5분 폴백 버그) | MED | enterprise skill 사용자 자동 수혜 |
| B3 | Agent tool auto-mode safety classifier context overflow → permission 요청 | MED | **CTO Team 12명 영향** — 검증 권장 (ENH-223) |
| B4 | Bash tool `CLAUDE_ENV_FILE`이 `#` 주석 종료 시 무음 → 정상 | LOW | 25/37 skills 자동 수혜 (ENH-219 검증) |
| B6 | 짧은 greeting 시 sessionTitle placeholder 노출 → 수정 | LOW | **ENH-187 user-prompt-handler.js:252-265** 재검증 (ENH-220) |
| B11 | `--resume` self-referencing transcript truncate fix | **MED** | 장기 PDCA 세션 안정성 자동 수혜 (ENH-221) |
| B13 | `language` 설정 시 diacritical marks 누락 → 수정 | MED | ES/FR/DE/IT trigger 자동 수혜 (한국어 무관) |
| B14 | Policy-managed plugins 외부 디렉터리 auto-update 안 됨 → 수정 | **MED** | **ENH-139/191 Plugin freshness 영향** (ENH-222) |

**LOW impact 8건** (B1 /login paste, B5 /resume rename, B7 teleport escape, B8 /feedback retry, B9 teleport silent exit, B10 Remote Control title, B12 transcript write 로깅): bkit 직접 영향 없음, 자동 수혜.

### 1.4 알려진 회귀 4건 검증 결과

| Issue | 제목 | v2.1.108 해결 여부 | bkit 방어 |
|-------|------|-------------------|----------|
| **#47482** | output styles YAML frontmatter 미주입 | ❌ **OPEN** | ENH-214 방어 레이어 유지 |
| **#47810** | skip-perm + PreToolUse bypass | ❌ **OPEN** | MON-CC-01, CTO Team 영향, 방어 유지 |
| **#47855** | Opus 1M /compact block (REPL gate stale) | ❌ **OPEN** | MON-CC-02, /compact 사용 주의 |
| **#47828** | SessionStart systemMessage + remoteControl | ❌ **OPEN** | bkit 미사용 확인 |

→ **v2.1.107 권고 "v2.1.108 hotfix 대기"가 어긋남**. **v2.1.109+ hotfix 대기 권장**으로 갱신.

### 1.5 시스템 프롬프트 변화

| 항목 | v2.1.107 | v2.1.108 |
|------|----------|----------|
| 명시적 SP 섹션 변경 | "Text output" 헤딩 | **CHANGELOG에 명시 없음** |
| 추정 토큰 델타 | +8 | **±0~수백 (구조 변경 없음)** |

---

## Phase 2: bkit 영향 분석

### 2.1 영향 매트릭스

| bkit Component | 영향 항목 | 조치 |
|----------------|----------|------|
| Skills (37) | F4 Skill→slash cmd 확장, B4 Bash `#` 주석 fix | ENH-217 (P1), ENH-219 (P2) 검증 |
| Agents (32) | B3 Auto-mode safety classifier | ENH-223 (P2) coordinator.js 검증 |
| Hooks (21) | B6 sessionTitle 수정 | ENH-220 (P2) user-prompt-handler.js 재검증 |
| Lib Modules (88) | I1 grammar 지연 로드 | 자동 수혜 |
| Scripts (57) | B14 plugin auto-update | ENH-222 (P2) ENH-139 번들 |
| MCP Servers (2) | 직접 영향 없음 | — |
| Memory/State | B11 --resume truncate, F3 /recap 충돌 | ENH-216 (P1), ENH-221 (P3) |
| Docs | F1, F2 prompt caching 문서화 | ENH-215 (P1), ENH-218 (P2) |

### 2.2 컴포넌트별 채택률 추정

bkit CC 고급 기능 채택률 (v2.1.108 기준): **~70%** (변동 없음)
- Hook events: 21/26 (81%)
- Plugin frontmatter: 4/7 (변동 없음)
- v2.1.108 신규 활용 가능: prompt caching 1H, /recap, Skill→slash cmd 3건 (P1 채택 시 채택률 ~75%로 상승)

---

## Phase 3: Plan Plus 브레인스토밍

### 3.1 Intent Discovery

- **이 CC 업그레이드에서 bkit이 얻을 최대 가치는?**
  - 장기 PDCA 세션 비용 절감 (1H prompt cache TTL)
  - 세션 복귀 시 Automation First 강화 (/recap)
  - 보안 감사 파이프라인 단순화 (Skill→/security-review)

- **놓치면 안 되는 critical change?**
  - 없음 (Breaking 0건). 단 회귀 4건 미해결 — 방어 레이어 유지 필수.

- **기존 workaround 대체 native 기능?**
  - bkit `.bkit/state/memory.json` 일부 기능 ↔ /recap Away Summary (잠재 중복, ENH-216 검증)

### 3.2 Alternative Exploration (P1 ENH 3건)

| ENH | 옵션 A | 옵션 B | 채택 |
|-----|--------|--------|------|
| ENH-215 | docs만 업데이트 | docs + bkit init 시 env 자동 권장 | **A (YAGNI)** — 사용자 환경 침해 회피 |
| ENH-216 | /recap 비활성 권장 (충돌 회피) | session-start.js inject + recap 협력 | **B (실험적)** — 단 충돌 검증 필수 |
| ENH-217 | 모든 bkit security skill에서 호출 | 1개 skill에서 PoC | **B (PoC 우선)** — 책임 경계 재정의 후 확대 |

### 3.3 YAGNI Review

- **YAGNI Pass 9건**: ENH-215~223 (모두 검증/문서 중심)
- **YAGNI FAIL 2건**:
  - ~~ENH-224~~: grammar 지연 로드(I1) 메모리 측정 — 자동 수혜, 측정 가치 부재
  - ~~ENH-225~~: B13 diacritical marks 영향 측정 — 한국어/영어 주 사용, ES/FR/DE/IT 자동 수혜로 충분

### 3.4 Priority Assignment

| Priority | 개수 | ENH IDs |
|----------|-----|---------|
| **P0** | 0 | — |
| **P1** | 3 | ENH-215, ENH-216, ENH-217 |
| **P2** | 5 | ENH-218, ENH-219, ENH-220, ENH-222, ENH-223 |
| **P3** | 1 | ENH-221 |

### 3.5 Pre-mortem (위험 4건)

1. **Away Summary ↔ session-start.js inject 중복 주입** (MEDIUM): ENH-216 구현 시 검증 필수. 충돌 시 `CLAUDE_CODE_ENABLE_AWAY_SUMMARY=0` 유지.
2. **Skill→`/security-review` ↔ CTO Team security-auditor 책임 중복** (LOW): ENH-217 PoC 시 경계 재정의.
3. **`ENABLE_PROMPT_CACHING_1H` 짧은 세션 cost 폭증 역효과** (LOW): 시나리오별 가이드 필요 (ENH-215).
4. **회귀 4건 누적 미해결** (MEDIUM): v2.1.107 hotfix 대기 어긋남. v2.1.109+ 대기 권고 갱신.

---

## Phase 4: ENH Roadmap

### 4.1 ENH 상세 표

| ENH | 제목 | Priority | 영향 컴포넌트 | 작업 추정 | 분류 |
|-----|------|---------|-------------|----------|------|
| **ENH-215** | `ENABLE_PROMPT_CACHING_1H` 통합 가이드 (BYOK/Bedrock/Vertex/Foundry) | **P1** | docs/02-design/context-engineering.md, CUSTOMIZATION-GUIDE.md | 1.5h | 문서 |
| **ENH-216** | `/recap` + Away Summary bkit PDCA 세션 통합 가이드 + 충돌 검증 | **P1** | docs/bkit-v2.0.0-user-guide.md, hooks/session-start.js | 2h | 검증+문서 |
| **ENH-217** | Skill tool→built-in slash cmd(`/init`/`/review`/`/security-review`) PoC | **P1** | skills/bkit-rules 또는 security-related skill | 2h | 실험+문서 |
| ENH-218 | `FORCE_PROMPT_CACHING_5M` CI/CD 최적화 문서화 (ENH-138 번들) | P2 | docs/02-design/context-engineering.md | 30m | 문서 |
| ENH-219 | `CLAUDE_ENV_FILE` `#` 주석 파싱 fix 자동 수혜 검증 (25/37 skills) | P2 | skills/* allowed-tools 감사 | 1h | 검증 |
| ENH-220 | B6 sessionTitle placeholder fix → ENH-187 user-prompt-handler.js 재검증 | P2 | scripts/user-prompt-handler.js:252-265 | 30m | 검증 |
| ENH-221 | B11 `--resume` self-ref transcript fix — 장기 PDCA 세션 안정성 모니터링 | P3 | lib/pdca/*, .bkit/state/* | 0h (자동) | 모니터 |
| ENH-222 | B14 Policy-managed plugins auto-update fix → ENH-139/191 plugin freshness 재확인 | P2 | docs/01-plan (ENH-139 plan) | 30m | 검증+번들 |
| ENH-223 | B3 Auto-mode safety classifier permission — CTO Team 12명 영향 검증 | P2 | lib/team/coordinator.js, hooks/session-start.js | 1h | 검증 |
| ~~ENH-224~~ | ~~grammar 지연 로드 메모리 측정~~ | **YAGNI FAIL** | - | - | 폐기 |
| ~~ENH-225~~ | ~~B13 diacritical marks 측정~~ | **YAGNI FAIL** | - | - | 폐기 |

**총 9건 신규 ENH, ~9h 작업 (코드 변경 0건)**.

### 4.2 자동 수혜 11건 (코드 변경 불필요)

| CC 변경 | 수혜 bkit 컴포넌트 | 비고 |
|--------|-------------------|------|
| I1 grammar 지연 로드 | lib/* 88 modules + scripts/* 57 | 메모리 풋프린트 감소 |
| B2 DISABLE_TELEMETRY 1H 정상화 | enterprise skill 사용자 | ENH-215 자동 확장 |
| B7-B10 UX fixes | — | bkit 무관 |
| B11 --resume truncate fix | 장기 PDCA 세션 | ENH-221 모니터링 |
| B13 diacritical marks | ES/FR/DE/IT trigger | YAGNI FAIL, 자동 수혜만 |
| B14 plugin auto-update | enterprise 배포 | ENH-222 검증 |
| F2 FORCE_PROMPT_CACHING_5M | ENH-138 CI/CD 시나리오 | ENH-218 문서만 |
| F6/F7/F8 UX 개선 | — | 자동 수혜 |

### 4.3 철학 준수 검증

| ENH | Automation First | No Guessing | Docs=Code | Verdict |
|-----|-----------------|-------------|-----------|---------|
| ENH-215~223 (9건) | ✓ | ✓ | ✓ | **모두 Pass** |

### 4.4 테스트 영향

- **신규 TC 추정**: ~8건 (1,186 → 1,194)
  - L1: ENH-220 sessionTitle 빈 greeting (+2)
  - L1: ENH-219 CLAUDE_ENV_FILE `#` 주석 (+2)
  - L3: ENH-217 Skill→built-in slash cmd 통합 (+2)
  - L3: ENH-216 Away Summary + memory.json 중복 방지 (+2)
- **수정 필요**: ~3 TC 회귀 재실행 (ENH-187/coordinator.js)

---

## 권고 요약

### Verdict

- **CC v2.1.108 채택 안전**: Breaking 0, 신규 회귀 0, **연속 호환 69개 달성**.
- **권장 CC 버전**: 기존 **v2.1.104+** → **v2.1.108+** 로 상향 가능. 단, MON-CC-01/02(#47810/#47855) + ENH-214 방어(#47482) 레이어 **유지 필수**.
- **다음 hotfix 대기**: 회귀 4건 미해결로 **v2.1.109+ 대기** 권고 갱신 (v2.1.107 권고 어긋남).

### 작업 우선순위

| 단계 | 항목 | 공수 |
|------|------|------|
| **P1 (3건, ~5.5h)** | ENH-215 prompt cache 문서, ENH-216 /recap 통합 검증, ENH-217 Skill→slash cmd PoC | 5.5h |
| **P2 (5건, ~3h)** | ENH-218/219/220/222/223 검증·문서 | 3h |
| **P3 (1건)** | ENH-221 장기 세션 모니터링 | 0h (자동) |

### v2.1.6 정비 릴리스 통합

- **bkit-v216-integrated-enhancement.plan.md에 통합**: ENH-215~223 (9건) 추가 시 기존 14 ENH → **23 ENH**, 공수 30.5h → **~39.5h**.
- **MON-CC-03 추가**: 회귀 4건 누적 미해결 모니터링 항목.
- **G9 게이트 추가 검토**: prompt cache 1H 활성 시 비용 상한 가드.

---

## 메모리 업데이트 항목

```diff
+ - v2.1.108: ~24 changes (Features 8 + Improvements 2 + Fixes 14)
+   — ENABLE_PROMPT_CACHING_1H 전체 provider 통합, /recap + Away Summary,
+     Skill→built-in slash cmd discover/invoke, Bash CLAUDE_ENV_FILE `#` fix,
+     --resume self-ref truncate fix, plugin auto-update fix, sessionTitle placeholder fix.
+   ⚠️ 회귀 4건 (#47482/#47810/#47855/#47828) 모두 OPEN — v2.1.109+ hotfix 대기 권장.
+ - v2.1.34~v2.1.108 total: ~860 changes (31 releases, 7 skipped), 69개 연속 호환
+ - CC recommended version: v2.1.108+ (단 MON-CC-01/02 + ENH-214 방어 유지)

+ ENH-215~223 신규 추가 (P1: 3건, P2: 5건, P3: 1건, YAGNI FAIL: 2건)
```

---

## 관련 파일 경로

- 본 보고서: `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/docs/04-report/features/cc-v2107-v2108-impact-analysis.report.md`
- 통합 대상: `docs/01-plan/features/bkit-v216-integrated-enhancement.plan.md` (v2.1.6 정비 릴리스)
- 검증 대상 파일:
  - `scripts/user-prompt-handler.js:252-265` (ENH-220)
  - `lib/team/coordinator.js` (ENH-223)
  - `hooks/session-start.js` (ENH-216 충돌 검증)

## Sources
- [Claude Code CHANGELOG.md](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Issues: #47482, #47810, #47855, #47828 (모두 OPEN)
- 이전 분석: `docs/archive/2026-04/cc-v21105-impact-analysis/cc-v21105-impact-analysis.report.md`
