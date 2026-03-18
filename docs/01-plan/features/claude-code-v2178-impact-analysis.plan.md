# Claude Code v2.1.73~v2.1.78 영향 분석 및 bkit v1.6.2 계획 문서

> **Summary**: Claude Code v2.1.73~v2.1.78 (6개 릴리스, ~166건 변경) 영향 분석 + bkit v1.6.2 전면 활용형 업그레이드 계획
>
> **Project**: bkit Vibecoding Kit
> **Version**: v1.6.1 → v1.6.2
> **Author**: CTO Team (8 Agents) + Plan Plus Brainstorming
> **Date**: 2026-03-18
> **Status**: Approved
> **Method**: Plan Plus (Brainstorming-Enhanced PDCA Planning)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | CC v2.1.72 이후 6개 릴리스(v2.1.73~v2.1.78)의 ~166건 변경사항이 bkit v1.6.1(31 skills, 29 agents, 10 hook events, 252개 컴포넌트, ~25K LOC) 에코시스템에 미치는 영향이 불확실하며, 신규 기능 4개 Hook + ${CLAUDE_PLUGIN_DATA} + plugin agent frontmatter 활용 기회 존재 |
| **Solution** | CTO Team 8 agents 병렬 조사 + bkit 코드베이스 전체 아키텍처 교차 검증 + Plan Plus 브레인스토밍을 통한 14개 ENH 전면 활용형 v1.6.2 로드맵 수립 |
| **Function/UX Effect** | Hook events 10→14 (PostCompact, StopFailure, Elicitation, ElicitationResult), Agent frontmatter에 effort/maxTurns/disallowedTools 네이티브 지원, ${CLAUDE_PLUGIN_DATA} 영구 상태 저장소, 출력 토큰 128K 상한, 1M context 기본화 |
| **Core Value** | 44번째 연속 호환 릴리스 확인 (v2.1.34~v2.1.78, zero-downtime 업그레이드 보장) + ENH-117~130 (14개 기회) 전체 구현으로 bkit의 3대 철학(Automation First, No Guessing, Docs=Code) 강화 및 Context Engineering 레벨 6 달성 |

---

## User Intent Discovery (Phase 1 결과)

### 핵심 목적
호환성 검증 + ENH 기회 식별 → v1.6.2 로드맵 수립

### 대상 독자
bkit 유지보수자 (개발팀) — v1.6.2 구현 가이드로 활용

### 성공 기준
1. 44 연속 호환 릴리스 확인 (Breaking Change 0건 for bkit)
2. 14개 ENH 기회 전체 구현 계획 수립
3. bkit 3대 철학 준수 검증
4. 호환성 매트릭스 완성

### 제약 조건
- bkit 3대 철학 필수 준수: Automation First, No Guessing, Docs = Code
- 기존 252개 컴포넌트 하위 호환성 유지
- 208 exports (common.js bridge) 호환성 유지

---

## Alternatives Explored (Phase 2 결과)

| 접근 방식 | 범위 | 장점 | 단점 | 선택 |
|-----------|------|------|------|------|
| **A: 핵심 활용 집중형** | P0/P1만 반영 | 빠른 릴리스, 리스크 최소 | P2 기회 지연 | ❌ |
| **B: 전면 활용형** | 14개 ENH 전체 | CC 최신 기능 최대 활용 | 릴리스 시간 증가 | ✅ 선택 |
| **C: 보수적 검증형** | 호환성 검증만 | 최소 리스크 | 신규 기능 미활용 | ❌ |

**선택 근거**: 사용자가 전면 활용형을 선택. bkit의 모든 기능이 정상 동작해야 하며, 3대 철학과 사상이 지켜져야 함.

---

## YAGNI Review (Phase 3 결과)

### Included (v1.6.2 범위)

| ENH | 항목 | Priority | 철학 연결 |
|-----|------|----------|----------|
| ENH-117 | PostCompact hook 활용 | P1 | Automation First — 컴팩션 후 상태 자동 보존 |
| ENH-118 | StopFailure hook 활용 | P1 | Automation First — API 에러 자동 복구 |
| ENH-119 | ${CLAUDE_PLUGIN_DATA} 활용 | P0 | Docs=Code — 영구 상태 저장소 |
| ENH-120 | Plugin agent frontmatter 확장 | P0 | No Guessing — 명시적 agent 설정 |
| ENH-121 | modelOverrides 가이드 | P2 | No Guessing — Bedrock/Vertex 정확한 모델 매핑 |
| ENH-122 | autoMemoryDirectory 활용 | P1 | Automation First — 메모리 경로 자동 관리 |
| ENH-123 | worktree.sparsePaths 활용 | P2 | Automation First — monorepo 자동 최적화 |
| ENH-124 | /effort 가이드 | P2 | No Guessing — effort 수준 명시적 제어 |
| ENH-125 | allowRead sandbox | P2 | No Guessing — 명시적 권한 제어 |
| ENH-126 | 출력 128K 상한 활용 | P1 | Docs=Code — 대규모 보고서 완전 출력 |
| ENH-127 | 1M context 기본화 문서 | P0 | No Guessing — 정확한 context 정보 |
| ENH-128 | hook source 표시 문서화 | P3 | No Guessing — hook 출처 명확화 |
| ENH-129 | tmux 알림 통과 문서화 | P2 | No Guessing — 정확한 환경 정보 |
| ENH-130 | Session name (-n) 활용 | P2 | Automation First — CI/CD 세션 자동 네이밍 |

### Out of Scope (v1.6.2 이후)
- Elicitation/ElicitationResult hook 구현 (bkit은 현재 MCP 미사용, 문서화만 포함)
- /output-style 명령어 deprecated 대응 (/config으로 이관 완료)
- Agent resume → SendMessage 전환 (CC 자동 처리, bkit 코드 변경 불필요)

---

## 1. 분석 개요

### 1.1 목적

Claude Code v2.1.73~v2.1.78 (6개 릴리스, 2026-03-11~03-17, 7일간) 변경사항이 bkit v1.6.1 플러그인 에코시스템에 미치는 영향을 체계적으로 분석하고, 14개 ENH 기회를 전면 활용하는 bkit v1.6.2 버전업 계획을 수립한다.

### 1.2 배경

- bkit는 v2.1.34~v2.1.72까지 38개 연속 릴리스에서 100% 호환성 유지
- 이번 분석으로 v2.1.73~v2.1.78 6개 릴리스 추가 → **44 연속 호환** 확인
- 7일간 ~166건 변경 (역대 최고 밀도: 일평균 ~24건)
- 시스템 프롬프트 +23,842 tokens (7일간)
- 신규 Hook Events 4개 추가 (18→22, CC 공식 기준)

### 1.3 관련 문서

- 이전 분석: `docs/04-report/features/claude-code-v2172-impact-analysis.report.md`
- 이전 계획: `docs/01-plan/features/claude-code-v2177-impact-analysis.plan.md` (초안, 본 문서로 대체)
- bkit 철학: `bkit-system/philosophy/core-mission.md`
- Context Engineering: `bkit-system/philosophy/context-engineering.md`

---

## 2. 릴리스별 변경사항 상세

### 2.1 릴리스 타임라인

| Version | Release Date | Changes | Key Theme | 시스템 프롬프트 |
|---------|-------------|---------|-----------|--------------|
| v2.1.73 | 2026-03-11 | ~26 | modelOverrides, Skill deadlock fix, SessionStart 2중발화 fix | +13,443 tokens |
| v2.1.74 | 2026-03-12 | ~17 | /context 제안, autoMemoryDirectory, 스트리밍 메모리 누수 fix | +1,750 tokens |
| v2.1.75 | 2026-03-13 | ~19 | Opus 4.6 1M 기본, /color, memory timestamps | +156 tokens |
| v2.1.76 | 2026-03-14 | ~34 | MCP Elicitation, PostCompact hook, /effort, sparsePaths | +43 tokens |
| v2.1.77 | 2026-03-17 | ~44 | 출력 토큰 128K, allowRead, --resume 45% 개선 | +6,494 tokens |
| v2.1.78 | 2026-03-17 | ~26 | StopFailure hook, ${CLAUDE_PLUGIN_DATA}, plugin frontmatter | +1,956 tokens |
| **Total** | **7일** | **~166** | | **+23,842 tokens** |

### 2.2 변경사항 분류

| Category | Count | Description |
|----------|-------|-------------|
| Features | 23 | modelOverrides, MCP Elicitation, PostCompact hook, StopFailure hook, ${CLAUDE_PLUGIN_DATA}, plugin frontmatter 등 |
| Bug Fixes | 98 | Skill deadlock, 메모리 누수 5건+, SessionStart 2중발화, PreToolUse 보안 우회 등 |
| Performance | 3 | --resume 45% 속도, 시작 60ms 개선, 세션 재개 메모리 개선 |
| Security | 1 | 샌드박스 의존성 미설치 시 자동 비활성화 문제 |
| Breaking | 4 | Agent resume 제거→SendMessage, SendMessage 자동재개, /fork→/branch, Windows managed settings 경로 |
| Improvements | 22 | /context 제안, plugin validate 강화, worktree 정리 등 |
| VSCode | 8 | plan preview, MCP dialog, 인증 깜빡임 등 |
| Changes | 4 | Bedrock Opus 4.6 기본, /output-style deprecated, --plugin-dir 단일경로 등 |

---

## 3. bkit 영향 분석

### 3.1 HIGH Impact (10건)

| # | CC Change | Version | bkit 영향 범위 | 3대 철학 |
|---|-----------|---------|---------------|---------|
| H-1 | **Skill deadlock 수정** — 대규모 .claude/skills/ git pull 시 | v2.1.73 | 31 skills 보유 bkit 직접 혜택 | Automation First |
| H-2 | **SessionStart hooks 2중 발화 수정** (resume 시) | v2.1.73 | bkit SessionStart hook 안정성 | Automation First |
| H-3 | **스트리밍 API 버퍼 메모리 누수 수정** | v2.1.74 | 장시간 CTO Team 세션 RSS 무한 증가 해결 | Automation First |
| H-4 | **Agent frontmatter model: 전체 ID 지원** | v2.1.74 | 29 agents model 필드 호환성 향상 | No Guessing |
| H-5 | **Opus 4.6 1M context 기본 활성화** | v2.1.75 | 7 opus agents 긴 세션 안정성 대폭 개선 | No Guessing |
| H-6 | **ToolSearch deferred 도구 compaction 후 schema 유실 수정** | v2.1.76 | 장시간 세션에서 도구 안정성 | No Guessing |
| H-7 | **Auto-updater 메모리 누수 수정** (수십 GB) | v2.1.77 | 시스템 안정성 | Automation First |
| H-8 | **PreToolUse allow→deny bypass 수정** (보안) | v2.1.77 | enterprise managed settings 보안 정책 | No Guessing |
| H-9 | **출력 토큰 Opus 64K 기본, 128K 상한** | v2.1.77 | 대규모 분석 보고서 출력 2배 | Docs=Code |
| H-10 | **${CLAUDE_PLUGIN_DATA} 영구 상태 저장소** | v2.1.78 | bkit 상태 관리 혁신 (업데이트 생존) | Docs=Code |

### 3.2 MEDIUM Impact (12건)

| # | CC Change | Version | bkit 영향 범위 |
|---|-----------|---------|---------------|
| M-1 | Agent model opus/sonnet/haiku Bedrock/Vertex 다운그레이드 수정 | v2.1.73 | CTO Team agent model 정확성 |
| M-2 | 백그라운드 bash 프로세스 에이전트 종료 시 미정리 | v2.1.73 | CTO Team 세션 정리 |
| M-3 | modelOverrides 설정 | v2.1.73 | Bedrock/Vertex 커스텀 모델 매핑 |
| M-4 | managed policy ask 우회 수정 | v2.1.74 | permission 처리 정확성 |
| M-5 | /context 실행 가능 제안 | v2.1.74 | 컨텍스트 최적화 가이드 |
| M-6 | autoMemoryDirectory 설정 | v2.1.74 | agent-memory 경로 커스터마이징 |
| M-7 | memory timestamps | v2.1.75 | agent-memory 신선도 판단 |
| M-8 | PostCompact hook | v2.1.76 | 컴팩션 후 상태 보존 (hook events +1) |
| M-9 | worktree.sparsePaths | v2.1.76 | monorepo 워크트리 최적화 |
| M-10 | --resume 45% 속도 + 100-150MB 절감 | v2.1.77 | CTO Team 세션 재개 |
| M-11 | StopFailure hook event | v2.1.78 | API 에러 자동 복구 (hook events +1) |
| M-12 | Plugin agent frontmatter (effort/maxTurns/disallowedTools) | v2.1.78 | 29 agents 최적화 |

### 3.3 LOW Impact (8건)

| # | CC Change | Version | bkit 영향 범위 |
|---|-----------|---------|---------------|
| L-1 | /color 명령어 | v2.1.75 | UI 커스터마이징 (직접 영향 없음) |
| L-2 | hook source 표시 | v2.1.75 | UX 개선 (문서화 가치) |
| L-3 | /effort 명령어 | v2.1.76 | effort 수동 설정 |
| L-4 | -n/--name 세션 이름 | v2.1.76 | CI/CD 활용 가능 |
| L-5 | allowRead sandbox | v2.1.77 | 엔터프라이즈 세밀 제어 |
| L-6 | compound bash "Always Allow" 수정 | v2.1.77 | bkit Bash hooks 간접 관련 |
| L-7 | tmux 알림 통과 | v2.1.78 | tmux 사용자 UX |
| L-8 | line-by-line 스트리밍 | v2.1.78 | UX 개선 (코드 변경 불필요) |

### 3.4 Breaking Changes 분석 (bkit 기준)

| CC Breaking Change | Version | bkit 영향 | 대응 필요 |
|-------------------|---------|----------|----------|
| Agent resume 파라미터 제거 → SendMessage 사용 | v2.1.77 | bkit은 SendMessage 이미 사용, 영향 없음 | ❌ 불필요 |
| SendMessage 중지 에이전트 자동 재개 | v2.1.77 | 동작 변경이지만 개선 방향, 호환 | ❌ 불필요 |
| /fork → /branch 이름 변경 | v2.1.77 | bkit은 /fork 미사용, 영향 없음 | ❌ 불필요 |
| Windows managed settings 경로 변경 | v2.1.75 | bkit은 macOS 주력, Windows 영향 최소 | ❌ 불필요 |

**결론: bkit 기준 Breaking Change 0건. 44 연속 호환 릴리스 확인.**

---

## 4. ENH 상세 구현 계획

### 4.1 P0: 핵심 기반 (3건)

#### ENH-119: ${CLAUDE_PLUGIN_DATA} 영구 상태 저장소 활용

**CC 변경**: v2.1.78에서 `${CLAUDE_PLUGIN_DATA}` 변수 추가. 플러그인 업데이트에서 살아남는 영구 상태 저장소.

**현재 bkit 상태 관리**:
```
.bkit/state/pdca-status.json    ← 플러그인 업데이트 시 보존 불확실
.bkit/state/memory.json         ← 플러그인 업데이트 시 보존 불확실
.bkit/runtime/agent-state.json  ← 런타임 전용
```

**v1.6.2 구현 계획**:
1. `${CLAUDE_PLUGIN_DATA}/` 경로를 lib/core/paths.js의 STATE_PATHS에 추가
2. pdca-status.json, memory.json의 영구 백업을 PLUGIN_DATA에 저장
3. SessionStart hook에서 PLUGIN_DATA 존재 시 자동 복구 로직 추가
4. plugin.json에 PLUGIN_DATA 사용 선언 확인

**영향 범위**: lib/core/paths.js, hooks/session-start.js, lib/pdca/status.js, lib/memory-store.js

**철학 준수**: Docs=Code — 상태가 영구 보존되어 설계-구현 동기화 이력 유지

---

#### ENH-120: Plugin Agent Frontmatter 확장 (effort/maxTurns/disallowedTools)

**CC 변경**: v2.1.78에서 플러그인 제공 에이전트의 frontmatter에 `effort`, `maxTurns`, `disallowedTools` 네이티브 지원.

**현재 bkit agent 설정**:
```yaml
# agents/cto-lead.md (현재)
---
model: opus
permissionMode: acceptEdits
memory: project
disallowedTools:   # ← 현재 CC가 처리하는지 불확실
  - "Bash(rm -rf*)"
---
```

**v1.6.2 구현 계획**:
1. 29개 agent frontmatter에 `effort` 필드 추가:
   - opus agents (7개): `effort: high` (v2.1.76에서 기본 medium으로 변경됨, 복원 필요)
   - sonnet agents (20개): `effort: medium` (기본값 유지, 명시적 선언)
   - haiku agents (2개): `effort: low` (빠른 응답 우선)
2. 29개 agent에 `maxTurns` 필드 추가 (CTO Team 무한 루프 방지):
   - cto-lead: `maxTurns: 50`
   - 전문가 agents: `maxTurns: 30`
   - 가이드 agents: `maxTurns: 20`
3. `disallowedTools` 필드가 이미 존재하는 agents 검증 (네이티브 지원 확인)

**영향 범위**: agents/*.md (29개 파일), bkit-system/components/agents/_agents-overview.md

**철학 준수**: No Guessing — 모든 agent의 effort/maxTurns가 명시적으로 선언됨

---

#### ENH-127: 1M Context 기본화 문서 업데이트

**CC 변경**: v2.1.75에서 Opus 4.6 1M context window가 Max/Team/Enterprise 플랜에서 기본 활성화 (기존 extra usage 필요).

**v1.6.2 구현 계획**:
1. bkit-system/philosophy/context-engineering.md 업데이트:
   - "Opus 4.6 1M context 기본 활성화" 반영
   - CTO Team 8 opus agents의 컨텍스트 활용 가이드
2. SessionStart hook 메시지에 1M context 정보 반영
3. MEMORY.md 호환성 정보 업데이트

**영향 범위**: bkit-system/philosophy/context-engineering.md, hooks/session-start.js

**철학 준수**: No Guessing — 정확한 context window 정보 제공

---

### 4.2 P1: 핵심 활용 (4건)

#### ENH-117: PostCompact Hook 활용

**CC 변경**: v2.1.76에서 `PostCompact` hook event 추가. 컴팩션 완료 후 발화.

**현재 bkit hook 설정**: `PreCompact` (context-compaction.js)만 사용

**v1.6.2 구현 계획**:
1. hooks/hooks.json에 PostCompact 이벤트 추가
2. scripts/post-compaction.js 신규 작성:
   - 컴팩션 후 PDCA 상태 검증 (pdca-status.json 무결성)
   - 컴팩션 전후 상태 비교 로그
   - 주요 컨텍스트 손실 감지 시 경고
3. Hook events: 10 → 11

**영향 범위**: hooks/hooks.json, scripts/post-compaction.js (신규), bkit-system/philosophy/context-engineering.md

**철학 준수**: Automation First — 컴팩션 후 상태 자동 검증

---

#### ENH-118: StopFailure Hook 활용

**CC 변경**: v2.1.78에서 `StopFailure` hook event 추가. API 에러(rate limit, auth failure 등)로 턴 종료 시 발화.

**v1.6.2 구현 계획**:
1. hooks/hooks.json에 StopFailure 이벤트 추가
2. scripts/stop-failure-handler.js 신규 작성:
   - API 에러 유형 분류 (rate limit, auth, server error)
   - 에러 정보를 .bkit/runtime/에 로깅
   - 사용자에게 복구 안내 메시지 출력
   - CTO Team 세션 시 에러 발생 agent 식별
3. Hook events: 11 → 12

**영향 범위**: hooks/hooks.json, scripts/stop-failure-handler.js (신규)

**철학 준수**: Automation First — API 에러 시 자동 복구 가이드

---

#### ENH-122: autoMemoryDirectory 활용

**CC 변경**: v2.1.74에서 `autoMemoryDirectory` 설정 추가. auto-memory 저장소 커스텀 디렉토리 지정 가능.

**현재 bkit 메모리 시스템**:
- CC auto-memory: `~/.claude/projects/{path}/memory/MEMORY.md` (기본)
- bkit memory: `.bkit/state/memory.json` (독립)
- agent-memory: `.claude/agent-memory/` (21개 에이전트)

**v1.6.2 구현 계획**:
1. bkit.config.json에 autoMemoryDirectory 가이드 문서화
2. bkit-system/philosophy/context-engineering.md에 메모리 경로 설정 섹션 추가
3. CLAUDE.md에 autoMemoryDirectory 사용 가이드 추가 (선택적)

**영향 범위**: 문서 업데이트 중심 (코드 변경 최소)

**철학 준수**: Automation First — 메모리 경로 자동 관리

---

#### ENH-126: 출력 128K 상한 활용 가이드

**CC 변경**: v2.1.77에서 Opus 4.6 기본 64K, 상한 128K. Sonnet 4.6도 상한 128K.

**v1.6.2 구현 계획**:
1. 대규모 분석 보고서 생성 agent (report-generator, code-analyzer)에 활용 가이드 추가
2. agent frontmatter에 출력 토큰 관련 가이드라인 주석 추가
3. bkit-system 문서 업데이트

**영향 범위**: 문서 업데이트 중심

**철학 준수**: Docs=Code — 대규모 보고서 완전 출력 보장

---

### 4.3 P2: 확장 활용 (5건)

#### ENH-121: modelOverrides 가이드

**CC 변경**: v2.1.73에서 `modelOverrides` 설정 추가. 모델 피커 항목을 커스텀 프로바이더 모델 ID에 매핑.

**v1.6.2 구현 계획**:
1. bkit-system 또는 skills/enterprise/SKILL.md에 modelOverrides 사용 가이드 추가
2. Bedrock/Vertex 사용자를 위한 bkit.config.json 예시 문서화

**영향 범위**: 문서 업데이트

---

#### ENH-123: worktree.sparsePaths 활용

**CC 변경**: v2.1.76에서 `worktree.sparsePaths` 설정 추가. 대규모 monorepo에서 sparse-checkout.

**v1.6.2 구현 계획**:
1. Enterprise 스킬에 worktree.sparsePaths 가이드 추가
2. CTO Team 워크트리 사용 시 sparsePaths 자동 제안 로직 검토

**영향 범위**: skills/enterprise/SKILL.md, 문서 업데이트

---

#### ENH-124: /effort 가이드

**CC 변경**: v2.1.76에서 `/effort` 슬래시 명령어 추가. 모델 effort 레벨 설정.

**v1.6.2 구현 계획**:
1. bkit SessionStart hook에서 effort 설정 안내 추가
2. CTO Team 사용 시 opus agents의 effort 관리 가이드
3. "ultrathink" 키워드 사용 가이드 문서화

**영향 범위**: hooks/session-start.js, 문서 업데이트

---

#### ENH-125: allowRead Sandbox

**CC 변경**: v2.1.77에서 `allowRead` 설정 추가. denyRead 영역 내에서 읽기 재허용.

**v1.6.2 구현 계획**:
1. Enterprise 스킬에 allowRead/denyRead 세밀 제어 가이드 추가
2. bkit.config.json permissions 섹션에 sandbox 설정 예시 추가

**영향 범위**: 문서 업데이트

---

#### ENH-130: Session Name (-n) 활용

**CC 변경**: v2.1.76에서 `-n`/`--name` CLI 플래그 추가.

**v1.6.2 구현 계획**:
1. CI/CD 환경에서 세션 이름 활용 가이드 문서화
2. CTO Team 세션에서 기능명 기반 자동 네이밍 검토

**영향 범위**: 문서 업데이트

---

### 4.4 P3: 문서화 (2건)

#### ENH-128: Hook Source 표시 문서화

**CC 변경**: v2.1.75에서 hook 권한 프롬프트에 hook 소스(settings/plugin/skill) 표시.

**v1.6.2 구현 계획**: bkit-system/components/hooks/_hooks-overview.md 업데이트

---

#### ENH-129: tmux 알림 통과 문서화

**CC 변경**: v2.1.78에서 tmux 알림 통과 개선.

**v1.6.2 구현 계획**: CTO Team 사용 가이드에 tmux 환경 팁 추가

---

## 5. 아키텍처 변경 설계

### 5.1 Hook Events 확장 (10 → 14)

```
v1.6.1 (10 events)              v1.6.2 (14 events)
─────────────────               ─────────────────
hooks.json L1:                  hooks.json L1:
  SessionStart                    SessionStart
  UserPromptSubmit                UserPromptSubmit
  PreCompact                      PreCompact
  TaskCompleted                   TaskCompleted
  SubagentStart                   SubagentStart
  SubagentStop                    SubagentStop
  TeammateIdle                    TeammateIdle
                                + PostCompact (ENH-117)
                                + StopFailure (ENH-118)

Skill/Agent L2-3:               Skill/Agent L2-3:
  PreToolUse(Write|Edit, Bash)    PreToolUse(Write|Edit, Bash)
  PostToolUse(Write, Bash, Skill) PostToolUse(Write, Bash, Skill)
  Stop                            Stop

미사용 (문서화만):              미사용 (문서화만):
                                + Elicitation (MCP용)
                                + ElicitationResult (MCP용)
```

CC 공식 Hook Events 총계: 22개 → bkit 사용 14/22 = **63.6%** (기존 10/18 = 55.6%)

### 5.2 Agent Frontmatter 확장

```yaml
# v1.6.2 agent frontmatter 표준
---
name: agent-name
model: opus|sonnet|haiku
effort: high|medium|low          # NEW (v2.1.78)
maxTurns: 30                     # NEW (v2.1.78)
permissionMode: acceptEdits|plan
memory: project|user|session
disallowedTools:                 # NATIVE support (v2.1.78)
  - "Bash(rm -rf*)"
  - "Bash(git push*)"
---
```

### 5.3 State Storage 확장

```
v1.6.1                          v1.6.2
─────────────────               ─────────────────
.bkit/state/                    .bkit/state/
  pdca-status.json                pdca-status.json
  memory.json                     memory.json
.bkit/runtime/                  .bkit/runtime/
  agent-state.json                agent-state.json
                                ${CLAUDE_PLUGIN_DATA}/
                                  pdca-status.backup.json  # NEW
                                  memory.backup.json       # NEW
                                  version-history.json     # NEW
```

### 5.4 Library Module 업데이트

| Module | 변경 내용 | LOC 변화 (예상) |
|--------|----------|---------------|
| lib/core/paths.js | PLUGIN_DATA 경로 추가 | +15 |
| lib/pdca/status.js | PLUGIN_DATA 백업/복구 로직 | +40 |
| lib/memory-store.js | PLUGIN_DATA 백업 로직 | +20 |
| lib/common.js | 신규 export 추가 | +5 |

**예상 export 수**: 208 → ~213

---

## 6. 호환성 검증 전략

### 6.1 호환성 매트릭스

| bkit 컴포넌트 | 수량 | v2.1.73 | v2.1.74 | v2.1.75 | v2.1.76 | v2.1.77 | v2.1.78 |
|--------------|------|---------|---------|---------|---------|---------|---------|
| Skills | 31 | ✅ deadlock fix | ✅ | ✅ | ✅ | ✅ | ✅ |
| Agents | 29 | ✅ model fix | ✅ full ID fix | ✅ 1M | ✅ | ✅ 128K | ✅ frontmatter |
| Hook Events | 10→14 | ✅ 2중발화 fix | ✅ | ✅ | ✅ +2 hooks | ✅ | ✅ +2 hooks |
| lib/ modules | 41 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Templates | 29 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Output Styles | 4 | ⚠️ deprecated | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| Evals | 28 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tests | 1073 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

> ⚠️ Output Styles: /output-style deprecated → /config 사용 권장. SessionStart hook 워크어라운드 유지.

### 6.2 검증 TC 계획

| Category | TC Count | Method |
|----------|----------|--------|
| Agent Model Resolution (29 agents) | 5 | opus/sonnet/haiku 축약명 해석 확인 |
| Hook Events (기존 10) | 10 | 각 hook 정상 발화 확인 |
| Hook Events (신규 4) | 4 | PostCompact, StopFailure, Elicitation, ElicitationResult |
| Skill Loading (31) | 3 | 대규모 skill 로딩, deadlock 없음 |
| Memory System | 3 | agent-memory, auto-memory, PLUGIN_DATA |
| Permission Model | 3 | managed policy 우선순위 |
| Agent Frontmatter (effort/maxTurns) | 5 | 신규 필드 적용 확인 |
| 출력 토큰 | 2 | opus 128K, sonnet 128K 상한 |
| 성능 | 2 | --resume 속도, 메모리 사용량 |
| 3대 철학 준수 | 3 | Automation/NoGuessing/DocsCode |
| **Total** | **~40** | |

### 6.3 Breaking Change 최종 확인

**bkit 기준 Breaking Change: 0건**

| CC Breaking Change | bkit 영향 | 이유 |
|-------------------|----------|------|
| Agent resume 제거 | 없음 | bkit은 SendMessage 사용 |
| SendMessage 자동재개 | 없음 | 개선 방향, 호환 |
| /fork→/branch | 없음 | bkit 미사용 |
| Windows managed settings 경로 | 최소 | macOS 주력 |

**연속 호환 릴리스: v2.1.34~v2.1.78 = 44 releases, 0 breaking changes (bkit 기준)**

---

## 7. GitHub Issues 모니터링

### 7.1 지속 모니터링 이슈

| Issue # | Title | Status | bkit Impact | Notes |
|---------|-------|--------|-------------|-------|
| #29423 | Task subagents ignore CLAUDE.md | **OPEN** | HIGH | CTO Team 8 agents 영향. 여전히 미해결 |
| #34197 | Claude Code ignores CLAUDE.MD file | **OPEN** | HIGH | bkit 핵심 의존성 |
| #30613 | HTTP hooks JSON broken | OPEN | LOW | bkit는 command type만 사용 |
| #33656 | PostToolUse hook error on bash non-zero exit | OPEN | MEDIUM | bkit hooks 영향 가능 |
| #33068 | Plugin marketplace validation error | OPEN | MEDIUM | 플러그인 마켓플레이스 |
| #35296 | 1M context window 미작동 | OPEN | MEDIUM | 1M 기본화 품질 불균일 |
| #33963 | OOM 2.6GB+ 크래시 | OPEN | LOW | 장시간 세션 |

### 7.2 해결된 주요 이슈

| 해결 항목 | Version | bkit Impact |
|-----------|---------|-------------|
| Skill deadlock (git pull) | v2.1.73 | HIGH ✅ |
| SessionStart 2중 발화 | v2.1.73 | HIGH ✅ |
| 스트리밍 메모리 누수 | v2.1.74 | HIGH ✅ |
| Agent model ID 무시 | v2.1.74 | HIGH ✅ |
| ToolSearch schema 유실 | v2.1.76 | HIGH ✅ |
| Auto-updater 메모리 누수 | v2.1.77 | HIGH ✅ |
| PreToolUse 보안 우회 | v2.1.77 | HIGH ✅ |

---

## 8. 리스크 및 완화

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Opus effort medium 기본으로 CTO Team 사고 깊이 저하 | Medium | High | ENH-120으로 effort: high 명시적 설정 |
| ${CLAUDE_PLUGIN_DATA} 경로 변경 시 마이그레이션 필요 | Medium | Low | 기존 .bkit/state/ 유지 + PLUGIN_DATA 백업 이중화 |
| Output Styles deprecated | Low | Confirmed | SessionStart hook 워크어라운드 유지, /config 이관 검토 |
| #29423 (task subagents CLAUDE.md 미로드) 미해결 | High | Confirmed | 지속 모니터링, 워크어라운드 유지 |
| #34197 (CLAUDE.md 무시) 발생 시 | High | Low | 사용자 알림 + 재시작 가이드 |
| 1M context 비용 증가 | Low | Medium | Max/Team/Enterprise만 해당, 모니터링 |

---

## 9. 구현 우선순위 및 일정

### 9.1 구현 순서

```
Phase 1 (P0): 핵심 기반
├── ENH-119: ${CLAUDE_PLUGIN_DATA} 활용
├── ENH-120: Plugin agent frontmatter 확장 (29 agents)
└── ENH-127: 1M context 기본화 문서

Phase 2 (P1): 핵심 활용
├── ENH-117: PostCompact hook 활용
├── ENH-118: StopFailure hook 활용
├── ENH-122: autoMemoryDirectory 활용
└── ENH-126: 출력 128K 상한 활용

Phase 3 (P2): 확장 활용
├── ENH-121: modelOverrides 가이드
├── ENH-123: worktree.sparsePaths 활용
├── ENH-124: /effort 가이드
├── ENH-125: allowRead sandbox
└── ENH-130: Session name (-n) 활용

Phase 4 (P3): 문서화
├── ENH-128: Hook source 표시 문서화
└── ENH-129: tmux 알림 통과 문서화

Phase 5: 검증 및 릴리스
├── 호환성 TC 실행 (~40 TC)
├── bkit 3대 철학 준수 검증
├── MEMORY.md 업데이트
└── v1.6.2 릴리스
```

### 9.2 예상 작업량

| Phase | 항목 수 | 코드 변경 | 문서 변경 | 신규 파일 |
|-------|--------|----------|----------|----------|
| Phase 1 (P0) | 3 | 4 파일 | 3 파일 | 0 |
| Phase 2 (P1) | 4 | 3 파일 | 4 파일 | 2 (scripts) |
| Phase 3 (P2) | 5 | 1 파일 | 5 파일 | 0 |
| Phase 4 (P3) | 2 | 0 | 2 파일 | 0 |
| Phase 5 (검증) | - | 0 | 2 파일 | 0 |
| **Total** | **14** | **8 파일** | **16 파일** | **2 파일** |

---

## 10. Success Criteria

### 10.1 Definition of Done

- [ ] 6개 릴리스 전체 변경사항 수집 완료 (v2.1.73~v2.1.78) ✅
- [ ] bkit 코드베이스 교차 분석 완료 ✅
- [ ] 영향 분석 보고서 작성 (HIGH 10/MEDIUM 12/LOW 8) ✅
- [ ] ENH 기회 확정 (ENH-117~130, 14건) ✅
- [ ] 호환성 매트릭스 작성 ✅
- [ ] Plan 문서 작성 (본 문서) ✅
- [ ] 44 연속 호환 릴리스 확인 ✅
- [ ] 14개 ENH 전체 구현 (v1.6.2 릴리스)
- [ ] 호환성 TC 실행 (~40 TC)
- [ ] bkit 3대 철학 준수 검증
- [ ] MEMORY.md 업데이트

### 10.2 Quality Criteria

- [ ] 모든 HIGH 영향 항목 검증 완료
- [ ] Breaking Change 0건 확인 ✅
- [ ] ENH P0 3건 우선 구현
- [ ] Hook events 10→14 확장 완료
- [ ] Agent frontmatter 29개 전체 업데이트
- [ ] exports 수 208→~213 (common.js bridge 호환)
- [ ] 이전 분석 보고서와 포맷 일관성

---

## 11. Brainstorming Log (Phase 1-4 결과)

| Phase | Key Decision | Rationale |
|-------|-------------|-----------|
| Phase 1 | 호환성 검증 + ENH 식별 | 사용자 핵심 목적 확인 |
| Phase 1 | bkit 유지보수자 대상 | 구현 가이드로 활용 |
| Phase 2 | 전면 활용형 (B) 선택 | 14개 ENH 전체 구현 요청 |
| Phase 3 | 14개 ENH 전체 포함 | 사용자 명시적 선택 |
| Phase 3 | 3대 철학 준수 필수 | 사용자 강조 |
| Phase 4 | 아키텍처 방향 승인 | Hook 4개 + PLUGIN_DATA + frontmatter |

---

## 12. Next Steps

```
본 Plan 문서 완료 ✅
    ↓
/pdca design claude-code-v2178-impact-analysis
    ↓
/pdca do claude-code-v2178-impact-analysis
    ↓
/pdca analyze claude-code-v2178-impact-analysis
    ↓
/pdca report claude-code-v2178-impact-analysis
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-18 | Initial draft (CTO Team) | CTO Lead |
| 1.0 | 2026-03-18 | Plan Plus brainstorming 완료, 전면 활용형 확정 | CTO Team + Plan Plus |

---

## Sources

- [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- [Release v2.1.73](https://github.com/anthropics/claude-code/releases/tag/v2.1.73)
- [Release v2.1.74](https://github.com/anthropics/claude-code/releases/tag/v2.1.74)
- [Release v2.1.75](https://github.com/anthropics/claude-code/releases/tag/v2.1.75)
- [Release v2.1.76](https://github.com/anthropics/claude-code/releases/tag/v2.1.76)
- [Release v2.1.77](https://github.com/anthropics/claude-code/releases/tag/v2.1.77)
- [Release v2.1.78](https://github.com/anthropics/claude-code/releases/tag/v2.1.78)
- [Claude Code Official Changelog](https://code.claude.com/docs/en/changelog)
- [bkit-system/philosophy/core-mission.md](bkit-system/philosophy/core-mission.md)
- [bkit-system/philosophy/ai-native-principles.md](bkit-system/philosophy/ai-native-principles.md)
- [bkit-system/philosophy/context-engineering.md](bkit-system/philosophy/context-engineering.md)
- [bkit-system/philosophy/pdca-methodology.md](bkit-system/philosophy/pdca-methodology.md)
