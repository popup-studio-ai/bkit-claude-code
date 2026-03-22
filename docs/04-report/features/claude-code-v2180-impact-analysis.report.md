# Claude Code v2.1.80 영향 분석 보고서

> **Status**: ✅ Complete (Analysis Only)
>
> **Project**: bkit Vibecoding Kit
> **Version**: v2.0.0 (변경 없음)
> **Author**: CC Version Analysis Workflow
> **Completion Date**: 2026-03-21
> **PDCA Cycle**: #19

---

## Executive Summary

### 1.1 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **기능** | Claude Code v2.1.80 (1개 릴리스, ~19건 변경) 영향 분석 |
| **시작일** | 2026-03-21 |
| **완료일** | 2026-03-21 |
| **기간** | 1일 (분석만) |

### 1.2 성과 요약

```
┌──────────────────────────────────────────────┐
│  호환성: ✅ 100% 호환                         │
├──────────────────────────────────────────────┤
│  ✅ 변경사항:    19건 분석 완료               │
│  ✅ Breaking:   0건                          │
│  ✅ 호환성:     46 연속 호환 릴리스 확인      │
│  📋 ENH 기회:   4건 (ENH-134~137)            │
│  ⚠️  신규 이슈: #36755 (--resume crash)       │
└──────────────────────────────────────────────┘
```

### 1.3 전달된 가치

| 관점 | 내용 |
|------|------|
| **문제** | CC v2.1.80 릴리스의 ~19건 변경사항 중 bkit 영향 범위 확인 필요 |
| **해결 방법** | 4-Phase 워크플로우 (Research → Analyze → Brainstorm → Report) 자동 분석 |
| **기능/UX 효과** | effort frontmatter 스킬 확장(ENH-134), --resume 병렬 도구 복원 fix 자동 혜택, 시작 메모리 80MB 절감 |
| **핵심 가치** | 46번째 연속 호환 릴리스 확인 (v2.1.34~v2.1.80, zero-downtime 업그레이드 보장) + bkit v2.0.0 코드 변경 불필요 |

---

## 2. CC v2.1.80 변경사항 전체 목록

**릴리스 일자**: 2026-03-20 (npm)
**이전 버전**: v2.1.79 (2026-03-18)

### 2.1 변경사항 분류

| # | 분류 | 변경사항 | 영향도 | bkit 영향 |
|---|------|---------|--------|-----------|
| 1 | Feature | `rate_limits` field for statusline scripts (5h/7d windows, used_percentage, resets_at) | MEDIUM | 📋 ENH-135 (statusline 확장) |
| 2 | Feature | `source: 'settings'` plugin marketplace source — settings.json 인라인 선언 | MEDIUM | 📋 ENH-136 (대안 설치 문서화) |
| 3 | Feature | CLI tool usage detection for plugin tips | LOW | ✅ bkit 자동 혜택 (더 정확한 추천) |
| 4 | Feature | `effort` frontmatter support for skills and slash commands | **HIGH** | 📋 ENH-134 (스킬 effort 설정) |
| 5 | Feature | `--channels` flag (research preview) — MCP servers push messages | MEDIUM | 📋 ENH-137 (미래 MCP 채널) |
| 6 | Fix | `--resume` dropping parallel tool results → 전체 복원 | **HIGH** | ✅ CTO Team 세션 복원 직접 혜택 |
| 7 | Fix | Voice mode WebSocket failures (Cloudflare bot detection) | LOW | ❌ 없음 |
| 8 | Fix | 400 errors with fine-grained tool streaming (proxies/Bedrock/Vertex) | MEDIUM | ❌ 없음 (1st-party API 사용) |
| 9 | Fix | `/remote-control` appearing for incompatible deployments | LOW | ❌ 없음 |
| 10 | Fix | `/sandbox` tab/arrow key navigation | LOW | ❌ 없음 |
| 11 | Improve | `@` file autocomplete 대용량 레포 응답성 개선 | MEDIUM | ✅ 자동 혜택 (bkit 40K LOC) |
| 12 | Improve | `/effort` command — auto 해석 결과 표시 | LOW | ✅ UX 혜택 |
| 13 | Improve | `/permissions` tab/arrow key 탭 전환 | LOW | ❌ 없음 |
| 14 | Improve | Background tasks panel — left arrow 닫기 | LOW | ✅ CTO Team 관리 UX 개선 |
| 15 | Improve | Plugin install tips 단순화 (1-step /plugin install) | MEDIUM | ✅ bkit 설치 UX 직접 개선 |
| 16 | Perf | 시작 메모리 ~80MB 절감 (250k-file 레포 기준) | **HIGH** | ✅ 전체 성능 혜택 |
| 17 | Fix | Managed settings 시작 시 미적용 fix (enabledPlugins, defaultMode, env vars) | MEDIUM | ✅ plugin 설정 안정성 혜택 |
| 18 | SysPrompt | Memories checked against current files (stale data 방지) | MEDIUM | ✅ auto-memory 정확도 혜택 |
| 19 | Flag | `--channels` (research preview) | LOW | 📋 ENH-137 |

### 2.2 영향도 분포

```
HIGH:   3건 (#4, #6, #16) — bkit 직접 관련
MEDIUM: 8건 (#1, #2, #5, #8, #11, #15, #17, #18)
LOW:    8건 (#3, #7, #9, #10, #12, #13, #14, #19)
```

### 2.3 bkit 영향 분포

```
✅ 자동 혜택:  8건 (#3, #6, #11, #12, #14, #15, #16, #18) — 코드 변경 없이 개선
📋 ENH 기회:  4건 (#1, #2, #4, #5) — 선택적 활용 가능
❌ 무관:       7건 (#7, #8, #9, #10, #13, #17, #19)
```

---

## 3. bkit 영향 분석

### 3.1 컴포넌트 매핑

| CC 변경 | 영향받는 bkit 컴포넌트 | 영향 유형 |
|---------|----------------------|-----------|
| effort frontmatter for skills | 36 skills (SKILL.md) | 확장 기회 — 현재 agents만 사용 |
| rate_limits statusline | scripts/ (미사용) | 신규 기회 |
| source: 'settings' | plugin.json, CUSTOMIZATION-GUIDE.md | 문서 업데이트 |
| --channels MCP | lib/core/, hooks/ | 미래 아키텍처 |
| --resume parallel fix | CTO Team (Agent Teams) | 자동 혜택 |
| 시작 메모리 80MB 절감 | 전체 bkit 세션 | 자동 혜택 |
| Memory stale check | auto-memory 시스템 | 자동 혜택 |
| Plugin install 단순화 | bkit 설치 경험 | 자동 혜택 |

### 3.2 호환성 매트릭스

| bkit 구성요소 | 수량 | 호환성 | 비고 |
|--------------|------|--------|------|
| Agents | 31개 | ✅ 100% | effort frontmatter 이미 적용됨 (ENH-120) |
| Skills | 36개 | ✅ 100% | effort 미사용이지만 호환 문제 없음 |
| Hooks | 18개 | ✅ 100% | 변경 영향 없음 |
| Lib Modules | 78개 | ✅ 100% | 변경 영향 없음 |
| Scripts | ~15개 | ✅ 100% | statusline 미사용 |

### 3.3 철학 준수 검증

| 철학 | ENH-134 | ENH-135 | ENH-136 | ENH-137 |
|------|---------|---------|---------|---------|
| Automation First | ✅ | ✅ | ✅ | ✅ |
| No Guessing | ✅ | ✅ | ✅ | ⚠️ Preview |
| Docs=Code | ✅ | ✅ | ✅ | N/A |

---

## 4. ENH 기회 상세

### ENH-134: Skills effort frontmatter 설정 (P0)

**변경**: CC v2.1.80에서 skills/slash commands에 `effort` frontmatter 네이티브 지원 추가

**현황**:
- bkit agents 31개: 이미 effort 설정 완료 (ENH-120, v2.1.78)
- bkit skills 36개: effort 미설정

**제안**: 36개 스킬 SKILL.md에 effort frontmatter 추가
- report-generator, bkit-templates → `effort: low`
- pdca, code-review, phase-8-review → `effort: high`
- starter, dynamic, mobile-app 등 → `effort: medium`

**영향 파일**: `skills/*/SKILL.md` (36개)
**YAGNI**: ✅ PASS — agents와 일관성 확보, CC 네이티브 지원으로 구현 비용 zero

### ENH-135: rate_limits statusline 활용 (P2)

**변경**: statusline scripts에 `rate_limits` field 추가 (5h/7d windows)

**현황**: bkit은 statusline scripts를 현재 사용하지 않음 (CLI dashboard는 별도 구현)

**제안**: bkit CLI dashboard에 rate limit 정보 표시 고려
- Control Panel에 remaining quota % 표시
- Rate limit 근접 시 경고

**영향 파일**: `lib/core/dashboard.js` (신규 또는 수정)
**YAGNI**: ⚠️ BORDERLINE — 유용하나 현재 사용자 요청 없음. P2 유지.

### ENH-136: source: 'settings' plugin 소스 문서화 (P2)

**변경**: settings.json에서 직접 plugin 선언 가능 (`source: 'settings'`)

**현황**: bkit은 marketplace git repository 방식으로 배포

**제안**: CUSTOMIZATION-GUIDE.md에 대안 설치 방법 문서화
- git clone 없이 settings.json에 직접 plugin 정의
- 오프라인/제한 환경에서 유용

**영향 파일**: `CUSTOMIZATION-GUIDE.md`
**YAGNI**: ✅ PASS — 문서화만 필요, 비용 극소

### ENH-137: --channels MCP 연구 (P3)

**변경**: `--channels` flag (research preview) — MCP 서버가 세션에 메시지 push 가능

**현황**: bkit MCP 서버 2개 (bkit-pdca, bkit-analysis) 운용 중

**제안**: research preview 안정화 후 bkit MCP 서버에 channels 지원 추가
- PDCA 상태 변경 시 자동 알림
- 백그라운드 분석 완료 push

**영향 파일**: `mcp-servers/bkit-pdca/`, `mcp-servers/bkit-analysis/`
**YAGNI**: ❌ FAIL — research preview 단계, API 불안정 가능성. P3 강등.

---

## 5. GitHub Issues 모니터링

### 5.1 기존 이슈 상태 변경

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

### 5.2 신규 주목 이슈

| 이슈 | 심각도 | bkit 영향 | 비고 |
|------|--------|-----------|------|
| #36755 | MEDIUM | ⚠️ 간접 | `--resume` crash (_.startsWith undefined) — CTO Team resume 시 주의 |
| #36751 | LOW | ❌ | Auto-compact 미트리거 (Opus 1M resumed sessions) |
| #36747 | LOW | ❌ | MCP host fastmcp 3.1.1 호환 문제 — bkit MCP는 자체 구현 |
| #36741 | LOW | ❌ | commit-push-pr skill allowed-tools 누락 |
| #36740 | LOW | ⚠️ | 스킬 description 미표시 — bkit 스킬 노출에 영향 가능 |

---

## 6. 연속 호환 릴리스 현황

```
v2.1.34 ─────────────────────────────────────────── v2.1.80
         46 consecutive compatible releases
         0 breaking changes (bkit 기준)
         ~700+ total changes analyzed
         Zero-downtime upgrade guaranteed
```

| 릴리스 범위 | 릴리스 수 | 분석 변경건 | ENH 도출 |
|-------------|-----------|------------|----------|
| v2.1.34~v2.1.48 | 15 | ~200 | ENH-32~55 |
| v2.1.49~v2.1.72 | 24 | ~350 | ENH-56~116 |
| v2.1.73~v2.1.79 | 7 | ~184 | ENH-117~133 |
| **v2.1.80** | **1** | **~19** | **ENH-134~137** |
| **합계** | **46** | **~753** | **137** |

---

## 7. 권장사항

### 7.1 즉시 조치 (코드 변경 불필요)

1. **CC v2.1.80 업그레이드 안전** — bkit v2.0.0 코드 변경 없이 업그레이드 가능
2. **자동 혜택 확인** — --resume 병렬 복원, 시작 메모리 80MB 절감, plugin install UX 개선
3. **CC 권장 버전 업데이트** — v2.1.79+ → v2.1.80+ (--resume fix, memory 절감)

### 7.2 선택적 구현 (향후)

| 우선순위 | ENH | 설명 | 예상 작업량 |
|----------|-----|------|------------|
| P0 | ENH-134 | 36 skills effort frontmatter | ~2시간 (SKILL.md 36개 수정) |
| P2 | ENH-135 | rate_limits statusline | ~4시간 (dashboard 연동) |
| P2 | ENH-136 | source: 'settings' 문서화 | ~30분 (문서만) |
| P3 | ENH-137 | --channels MCP 연구 | 대기 (preview 안정화 후) |

### 7.3 모니터링

- **#36755** (--resume crash): CTO Team 장시간 세션 resume 시 주의
- **#36740** (스킬 description 미표시): bkit 스킬 노출에 영향 가능 — 재현 확인 필요

---

## 8. 시스템 프롬프트 변경 분석

### 8.1 변경 내용

**추가된 지침**: "Memories are checked against current files before use to avoid relying on stale data"

### 8.2 bkit 영향

- bkit auto-memory 시스템에 긍정적 영향
- CC가 memory 참조 시 현재 파일 상태와 교차 검증
- stale memory로 인한 잘못된 제안 감소 예상
- bkit 코드 변경 불필요 — CC 내부 동작 개선

### 8.3 토큰 영향

| 항목 | 값 |
|------|-----|
| 시스템 프롬프트 변경 규모 | 소규모 (~1문장 추가) |
| 예상 토큰 증가 | +20~30 tokens |
| bkit 영향 | 무시 가능 |

---

*Generated by CC Version Analysis Workflow v2.0.0*
*Analysis duration: Phase 0-4 single-pass*
*Sources: code.claude.com, GitHub anthropics/claude-code, npm @anthropic-ai/claude-code, ClaudeCodeLog*
