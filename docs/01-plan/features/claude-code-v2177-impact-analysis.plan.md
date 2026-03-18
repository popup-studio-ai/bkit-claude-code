# Claude Code v2.1.73~v2.1.77 영향 분석 계획 문서

> **Summary**: Claude Code v2.1.73~v2.1.77 (5개 릴리스) 변경사항의 bkit v1.6.1 영향 분석 및 v1.6.2 업그레이드 계획
>
> **Project**: bkit Vibecoding Kit
> **Version**: v1.6.1 -> v1.6.2
> **Author**: CTO Team (8 Agents)
> **Date**: 2026-03-18
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | CC v2.1.72 이후 5개 릴리스(v2.1.73~v2.1.77)의 변경사항이 bkit v1.6.1(29 agents, 31 skills, 10 hook events) 에코시스템에 미치는 영향이 불확실 |
| **Solution** | CTO Team 8개 에이전트를 통한 병렬 조사: 공식 CHANGELOG, GitHub Issues/PRs, npm 패키지, 시스템 프롬프트 변경 교차 검증 + bkit 코드베이스 전체 아키텍처 매핑 |
| **Function/UX Effect** | 3개 신규 Hook 이벤트(Elicitation, ElicitationResult, PostCompact), 출력 토큰 상한 128K 확대, 모델 다운그레이드 수정 등 agent 운영 직접 영향 항목 다수 |
| **Core Value** | 39~43번째 연속 호환 릴리스 확인을 통한 zero-downtime 업그레이드 보장, ENH-117+ 기회 식별로 bkit v1.6.2 로드맵 수립 |

---

## 1. Overview

### 1.1 Purpose

Claude Code v2.1.73~v2.1.77 (5개 릴리스, 2026-03-11~03-17) 변경사항이 bkit v1.6.1 플러그인 에코시스템에 미치는 영향을 체계적으로 분석하고, bkit v1.6.2 버전업 계획을 수립한다.

### 1.2 Background

- bkit는 v2.1.34~v2.1.72까지 38개 연속 릴리스에서 100% 호환성을 유지해 왔음
- 이번 분석 범위에 3개 신규 Hook 이벤트, 주요 모델/토큰 변경, 다수 버그 픽스 포함
- v2.1.78은 현재 시점(2026-03-18) 미출시, v2.1.73~v2.1.77 범위로 분석

### 1.3 Related Documents

- 이전 분석: `docs/04-report/features/claude-code-v2172-impact-analysis.report.md`
- 이전 계획: `docs/archive/2026-03/claude-code-v2171-impact-analysis/`

---

## 2. 분석 대상 릴리스 요약

### 2.1 릴리스 타임라인

| Version | Release Date | Changes (est.) | Key Theme |
|---------|-------------|----------------|-----------|
| v2.1.73 | 2026-03-11 | ~15 | modelOverrides, Skill deadlock fix, Agent model fix |
| v2.1.74 | 2026-03-12 | ~12 | /context 개선, autoMemoryDirectory, 메모리 누수 수정 |
| v2.1.75 | 2026-03-13 | ~10 | Opus 4.6 1M 기본, /color, memory timestamps |
| v2.1.76 | 2026-03-14 | ~18 | MCP Elicitation, PostCompact hook, /effort, sparsePaths |
| v2.1.77 | 2026-03-17 | ~15 | 출력 토큰 64K/128K, allowRead, --resume 수정 |
| **Total** | 7 days | **~70** | **3 신규 Hook, 토큰 확대, 모델 안정화** |

### 2.2 주요 변경사항 분류 (예비)

| Category | Count (est.) | Description |
|----------|-------------|-------------|
| Features | ~20 | modelOverrides, MCP Elicitation, PostCompact hook 등 |
| Bug Fixes | ~30 | Agent 모델 다운그레이드, Skill deadlock, 메모리 누수 등 |
| Performance | ~10 | --resume 45% 속도, auto-updater 메모리, RC poll 300x 감소 |
| Security | ~3 | 관리정책 ask 우회 수정, allowRead 설정 |
| UX/VSCode | ~7 | /color, /effort, spark icon, plan markdown view, MCP UI |

---

## 3. bkit 영향 분석 범위

### 3.1 HIGH Impact 후보 (예비 식별)

| # | CC Change | bkit 영향 범위 | Impact |
|---|-----------|---------------|--------|
| H-1 | Agent model: opus/sonnet/haiku 다운그레이드 수정 (v2.1.73) | bkit 29 agents 전체 (opus 8, sonnet 17, haiku 2) | HIGH |
| H-2 | Skill deadlock 수정 - 대규모 .claude/skills/ (v2.1.73) | bkit 31 skills (git pull 시 deadlock 가능성) | HIGH |
| H-3 | 출력 토큰 상한 Opus 4.6 64K, Sonnet 4.6 128K (v2.1.77) | 8 opus agents의 출력 길이 상한 2배 | HIGH |
| H-4 | managed policy ask 우회 수정 (v2.1.74) | bkit hooks의 permission 처리 | HIGH |
| H-5 | 3 신규 Hook 이벤트: Elicitation, ElicitationResult, PostCompact (v2.1.76) | hooks.json 확장 기회, hook events 18->21 | HIGH |
| H-6 | Opus 4.6 effort medium 기본 (v2.1.76) | CTO Team opus agents 사고 깊이 변경 | HIGH |
| H-7 | autoMemoryDirectory 설정 (v2.1.74) | bkit agent-memory 경로 커스터마이징 가능 | HIGH |

### 3.2 MEDIUM Impact 후보

| # | CC Change | bkit 영향 범위 | Impact |
|---|-----------|---------------|--------|
| M-1 | modelOverrides 설정 (v2.1.73) | 커스텀 모델 ID 매핑 (Bedrock/Vertex) | MEDIUM |
| M-2 | /context 명령 개선 (v2.1.74) | 컨텍스트 최적화 가이드 | MEDIUM |
| M-3 | Opus 4.6 1M 기본 (v2.1.75) | 긴 세션 안정성 개선 | MEDIUM |
| M-4 | memory timestamps (v2.1.75) | agent-memory 신선도 판단 | MEDIUM |
| M-5 | worktree.sparsePaths (v2.1.76) | monorepo 워크트리 최적화 | MEDIUM |
| M-6 | SessionEnd hooks timeout 설정 (v2.1.74) | CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS | MEDIUM |
| M-7 | --resume 45% 속도/100-150MB 절감 (v2.1.77) | 장시간 CTO Team 세션 재개 개선 | MEDIUM |
| M-8 | Bash ! mangling 수정 (v2.1.75) | bkit Bash hooks 안정성 | MEDIUM |
| M-9 | allowRead sandbox 설정 (v2.1.77) | 세밀한 파일시스템 권한 제어 | MEDIUM |
| M-10 | hook source 표시 (v2.1.75) | 사용자 경험 개선 (설정/플러그인/스킬 출처) | MEDIUM |

### 3.3 LOW Impact 후보

| # | CC Change | bkit 영향 범위 | Impact |
|---|-----------|---------------|--------|
| L-1 | /color 명령 (v2.1.75) | UI 커스터마이징 (직접 영향 없음) | LOW |
| L-2 | /effort 명령 (v2.1.76) | effort 수동 설정 (자동 적용됨) | LOW |
| L-3 | -n/--name 플래그 (v2.1.76) | 세션 네이밍 (CI/CD 활용 가능) | LOW |
| L-4 | /copy N 인덱스 (v2.1.77) | 사용자 편의 (직접 영향 없음) | LOW |
| L-5 | feedbackSurveyRate (v2.1.76) | 엔터프라이즈 관리 설정 | LOW |
| L-6 | "ultrathink" 재도입 (v2.1.76) | 사용자 수동 트리거 | LOW |
| L-7 | Opus 4/4.1 제거 -> 4.6 마이그레이션 (v2.1.76) | bkit agents는 이미 4.6 사용 중 | LOW |
| L-8 | voice mode 수정 (v2.1.73, v2.1.74, v2.1.75) | bkit 직접 관련 없음 | LOW |
| L-9 | VSCode 기능 (spark icon, plan view, MCP dialog) | bkit 직접 관련 없음 | LOW |
| L-10 | RC poll 300x 감소 (v2.1.73) | 서버 부하 감소 | LOW |
| L-11 | compound bash "Always Allow" 수정 (v2.1.77) | bkit Bash hooks와 간접 관련 | LOW |
| L-12 | auto-updater 메모리 수정 (v2.1.77) | 시스템 안정성 | LOW |
| L-13 | numeric keypad 지원 (v2.1.76) | 입력 편의 | LOW |

---

## 4. CTO Team 구성 및 분석 전략

### 4.1 Team Composition (8 agents)

| Role | Agent | Model | Assigned Scope |
|------|-------|-------|----------------|
| enterprise-expert | Research Lead | opus | CC CHANGELOG 전 버전 분석, 릴리스 패턴 파악 |
| code-analyzer | Code Lead | opus | bkit 29 agents + 31 skills 아키텍처 교차 분석 |
| infra-architect | Infra Lead | opus | hooks.json, 시스템 프롬프트, 패키지 크기 변화 |
| frontend-architect | UX Lead | sonnet | VSCode/TUI 변경, UX 영향, /color, /effort |
| security-architect | Security Lead | opus | managed policy fix, allowRead, 보안 영향 |
| product-manager | PM Lead | sonnet | ENH 기회 식별, v1.6.2 로드맵 |
| qa-strategist | QA Lead | sonnet | 호환성 검증 전략, TC 설계 |
| gap-detector | Gap Lead | opus | 설계-구현 갭, 누락 항목 탐지 |

### 4.2 Orchestration Pattern

```
Phase: Plan (현재)
Pattern: Leader (CTO가 배분, 에이전트 실행)

Phase: Design (다음)
Pattern: Council (다각도 검증)
- enterprise-expert + security-architect: 영향 분석 확정
- code-analyzer + gap-detector: 코드베이스 교차 검증
- product-manager: ENH 확정 + 우선순위

Phase: Do (실행)
Pattern: Swarm (병렬 구현)
- 8 agents 동시 분석

Phase: Check
Pattern: Council
- qa-strategist: TC 실행
- gap-detector: 갭 최종 확인
```

---

## 5. 분석 항목 상세

### 5.1 Hook 이벤트 분석 (Priority: HIGH)

현재 bkit hooks.json 10개 이벤트 사용:
- SessionStart, PreToolUse(Write|Edit, Bash), PostToolUse(Write, Bash, Skill)
- Stop, UserPromptSubmit, PreCompact, TaskCompleted
- SubagentStart, SubagentStop, TeammateIdle

v2.1.76 신규 3개 이벤트:
1. **Elicitation**: MCP 서버가 사용자 입력 요청 시 발생 (bkit은 MCP 미사용 -> 영향 없지만 향후 활용 가능)
2. **ElicitationResult**: 사용자 응답 전달 시 발생
3. **PostCompact**: 컴팩션 완료 후 발생 (PreCompact와 쌍, bkit 활용 기회)

Hook 이벤트 총계: 18 -> 21 (bkit 사용 10/21 = 47.6%)

### 5.2 Agent 모델 호환성 (Priority: HIGH)

bkit agent model 분포:
- `model: opus` (8개): cto-lead, code-analyzer, enterprise-expert, gap-detector, infra-architect, security-architect, design-validator, pm-lead
- `model: sonnet` (19개): 나머지 대부분
- `model: haiku` (2개): report-generator, qa-monitor

v2.1.73 수정: Bedrock/Vertex/Foundry에서 opus/sonnet/haiku → 이전 모델로 사일런트 다운그레이드 문제 해결
- bkit 영향: Bedrock/Vertex 사용자의 agent 성능이 정상화됨 (positive fix)

v2.1.74 수정: 전체 모델 ID(claude-opus-4-5 등) agent frontmatter에서 무시되던 문제 해결
- bkit 영향: bkit은 축약명(opus, sonnet, haiku) 사용 -> 직접 영향 없지만 호환성 향상

v2.1.76 변경: Opus 4.6 effort medium 기본, Opus 4/4.1 제거 -> 4.6 마이그레이션
- bkit 영향: opus agents의 기본 사고 깊이 변경 (high -> medium), "ultrathink"로 수동 전환 가능

v2.1.77 변경: 출력 토큰 Opus 4.6 기본 64K, 상한 128K
- bkit 영향: opus agents 출력 길이 상한 64K -> 128K (대규모 분석 보고서에 유리)

### 5.3 Skill 시스템 안정성 (Priority: HIGH)

v2.1.73 수정: 대규모 .claude/skills/ 디렉토리에서 git pull 시 많은 skill 파일 동시 변경 -> deadlock
- bkit 31 skills: git pull 시 deadlock 위험 해소 (critical fix)

v2.1.74 수정: agent frontmatter model: 필드에서 전체 ID 무시 문제
- bkit agents에서 model: field 사용 방식과 무관하지만 에코시스템 안정성 향상

### 5.4 메모리/성능 (Priority: MEDIUM)

| Version | Fix | bkit Impact |
|---------|-----|-------------|
| v2.1.73 | 백그라운드 bash 프로세스 서브에이전트 종료 시 미정리 | CTO Team agents 세션 정리 개선 |
| v2.1.74 | 스트리밍 API 응답 버퍼 미해제 (unbounded RSS 증가) | 장시간 세션 메모리 안정성 |
| v2.1.75 | memory timestamps 추가 | agent-memory 신선도 판단 |
| v2.1.77 | --resume 45% 속도, ~100-150MB 절감 | CTO Team 세션 재개 |
| v2.1.77 | auto-updater 메모리 누수 (수십 GB) | 시스템 안정성 |

### 5.5 보안 (Priority: MEDIUM)

v2.1.74: managed policy ask 규칙이 user allow 또는 skill allowed-tools로 우회 가능
- bkit hooks의 permission 처리에 영향 가능성 (검증 필요)

v2.1.77: allowRead sandbox 설정 (denyRead 영역 내 읽기 재허용)
- bkit은 sandbox 직접 사용하지 않지만, 엔터프라이즈 환경에서 활용 가능

---

## 6. ENH 기회 후보 (예비)

| ENH | Source | Description | Priority |
|-----|--------|-------------|----------|
| ENH-117 | v2.1.76 PostCompact hook | PostCompact hook으로 컴팩션 후 상태 저장/검증 | P1 |
| ENH-118 | v2.1.76 Elicitation hooks | MCP Elicitation hooks 문서화 + 향후 MCP 통합 기반 | P2 |
| ENH-119 | v2.1.73 modelOverrides | Bedrock/Vertex 사용자를 위한 modelOverrides 가이드 | P2 |
| ENH-120 | v2.1.74 autoMemoryDirectory | agent-memory 경로 커스터마이징 가이드 | P1 |
| ENH-121 | v2.1.74 SessionEnd timeout | CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS 활용 | P2 |
| ENH-122 | v2.1.75 /color | 세션별 색상 구분 CTO Team 가이드 | P3 |
| ENH-123 | v2.1.76 /effort | effort 수준 조절 가이드 (ultrathink 포함) | P1 |
| ENH-124 | v2.1.76 sparsePaths | worktree 대규모 monorepo 최적화 가이드 | P2 |
| ENH-125 | v2.1.76 -n/--name | CI/CD 세션 네이밍 활용 | P3 |
| ENH-126 | v2.1.77 allowRead | 엔터프라이즈 sandbox 세밀 제어 | P2 |
| ENH-127 | v2.1.77 출력 토큰 128K | 대규모 분석 보고서 출력 활용 가이드 | P1 |
| ENH-128 | v2.1.75 hook source | hook 출처 표시 활용 문서화 | P3 |

---

## 7. 호환성 검증 전략

### 7.1 검증 카테고리

| Category | TC Count (est.) | Method |
|----------|----------------|--------|
| Agent Model Resolution | 5 | 축약명(opus/sonnet/haiku) 정상 해석 확인 |
| Hook Events (기존 10) | 10 | 각 hook 정상 발화 확인 |
| Hook Events (신규 3) | 3 | Elicitation/ElicitationResult/PostCompact 존재 확인 |
| Skill Loading (31) | 3 | 대규모 skill 로딩, deadlock 없음 확인 |
| Memory System | 3 | agent-memory, auto-memory 경로 충돌 없음 |
| Permission Model | 3 | managed policy 우선순위 정상 |
| 출력 토큰 | 2 | opus/sonnet 출력 토큰 상한 확인 |
| 성능 | 2 | --resume 속도, 메모리 사용량 |
| **Total** | **~31** | |

### 7.2 Breaking Change 예측

현재까지 식별된 Breaking Change: **0건** (bkit 기준)
- Opus 4/4.1 제거 -> bkit은 축약명 사용, CC가 자동 4.6 마이그레이션
- effort medium 기본 -> 동작 변경이지만 호환성 문제 아님
- 모든 변경은 하위 호환 유지

---

## 8. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Opus effort medium 기본으로 CTO Team 사고 깊이 저하 | Medium | High | ultrathink 키워드 또는 /effort high 가이드 문서화 |
| 31 skills deadlock 재발 가능성 | High | Low | v2.1.73에서 수정됨, 모니터링 유지 |
| managed policy ask 우회 수정으로 기존 permission flow 변경 | Medium | Low | bkit hooks는 command type만 사용, 직접 영향 적음 |
| auto-updater 메모리 누수 (v2.1.77 수정 전 버전) | Medium | Medium | v2.1.77 이상으로 즉시 업그레이드 권장 |
| 1M 컨텍스트 기본으로 토큰 비용 증가 가능성 | Low | Medium | Max/Team/Enterprise만 해당, 모니터링 |

---

## 9. Success Criteria

### 9.1 Definition of Done

- [x] 5개 릴리스 전체 변경사항 수집 (v2.1.73~v2.1.77)
- [ ] bkit 코드베이스 교차 분석 완료
- [ ] 영향 분석 보고서 작성 (HIGH/MEDIUM/LOW/NONE 분류)
- [ ] ENH 기회 확정 (ENH-117~)
- [ ] 호환성 매트릭스 작성
- [ ] bkit v1.6.2 Plan 문서 작성
- [ ] 연속 호환 릴리스 카운트 갱신

### 9.2 Quality Criteria

- [ ] 모든 HIGH 영향 항목 검증 완료
- [ ] Breaking Change 0건 확인
- [ ] ENH 기회 P1 이상 우선순위 설정
- [ ] 이전 분석 보고서와 포맷 일관성

---

## 10. Next Steps

1. [ ] Design 문서 작성 (분석 아키텍처 상세 설계)
2. [ ] CTO Team 8 agents 병렬 분석 실행
3. [ ] 영향 분석 보고서 (docs/03-analysis/)
4. [ ] 완료 보고서 (docs/04-report/)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-18 | Initial draft - 웹 리서치 기반 예비 분석 | CTO Lead |
