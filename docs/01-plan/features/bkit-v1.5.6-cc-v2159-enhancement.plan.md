# bkit v1.5.6 CC v2.1.59 Enhancement Plan

> **Feature**: bkit-v1.5.6-cc-v2159-enhancement
> **Target Version**: bkit v1.5.6
> **Level**: Dynamic (bkit plugin architecture)
> **Date**: 2026-02-26
> **Scope**: bkit plugin (hooks, skills, commands, docs) -- Claude Code v2.1.59 ENH-48~51 대응
> **Source**: docs/03-analysis/claude-code-v2.1.59-impact-analysis.md
> **Previous**: bkit v1.5.5 (Plan Plus skill, community PR #34)
> **Team**: CTO Lead + code-analyzer + product-manager + frontend-architect + qa-strategist + gap-detector

---

## 1. Overview

### 1.1 Purpose

Claude Code v2.1.56~v2.1.59에서 식별된 4건의 Enhancement 기회(ENH-48~51)를 bkit v1.5.6에 반영하고, 버전을 1.5.5에서 1.5.6으로 업데이트한다.

핵심 변경:
- **ENH-48**: CC auto-memory 기능과 bkit workflow의 유기적 통합
- **ENH-49**: `/copy` 명령 안내를 skill 완료 시 자연스럽게 노출
- **ENH-50**: CTO Team 패턴의 multi-agent 메모리 관리 best practice 문서화
- **ENH-51**: Remote Control 호환성 사전 점검 (문서 수준)
- **Version Bump**: v1.5.5 -> v1.5.6

### 1.2 Background

v2.1.59의 핵심은 **auto-memory 공식 출시**이다. Claude가 세션 중 유용한 컨텍스트를 `~/.claude/projects/{path}/memory/MEMORY.md`에 자동 저장하며, `/memory` 명령으로 관리할 수 있다. bkit의 자체 메모리 시스템(`docs/.bkit-memory.json`, `.claude/agent-memory/`)과는 경로와 형식이 완전히 분리되어 직접 충돌은 없으나, 사용자에게 두 시스템의 역할을 명확히 안내할 필요가 있다.

또한 v2.1.59의 multi-agent 메모리 최적화(완료된 subagent task state 해제)는 bkit CTO Team 패턴(6-8+ agents)에서 장시간 세션 안정성을 직접 향상시킨다.

### 1.3 Related Documents

- Impact Analysis: `docs/03-analysis/claude-code-v2.1.59-impact-analysis.md`
- Previous Analysis: `docs/03-analysis/claude-code-v2.1.55-impact-analysis.md`
- CHANGELOG: `CHANGELOG.md`
- CTO Agent Memory: `.claude/agent-memory/bkit-cto-lead/MEMORY.md`

---

## 2. Scope

### 2.1 In Scope

- [x] ENH-48: Auto-Memory Integration (HIGH) -- SessionStart hook 수정, bkit help 업데이트
- [x] ENH-49: /copy Command Guidance (MEDIUM) -- skill-post.js 수정, unified-stop.js 수정
- [x] ENH-50: CTO Team Memory Management Guide (MEDIUM) -- 문서 신규 작성
- [x] ENH-51: Remote Control Compatibility Preparation (LOW) -- 문서 수준 점검
- [x] Version Bump: v1.5.5 -> v1.5.6 (plugin.json, bkit.config.json, CHANGELOG.md, session-start.js)

### 2.2 Out of Scope

- Remote Control 코드 변경 (#28379 미해결로 인해 slash commands RC 지원 불가)
- auto-memory 비활성화 기능 (CC 자체 `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`로 충분)
- bkit memory-store 스키마 변경 (기존 `docs/.bkit-memory.json` 유지)
- agent-memory MEMORY.md 구조 변경 (기존 per-agent 구조 유지)
- 새로운 hook event 추가 (ConfigChange, WorktreeCreate/Remove는 ENH-32~34, 별도 피처)
- 새로운 skill/agent 추가

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | ENH | Affected File(s) |
|----|-------------|:--------:|:---:|-------------------|
| FR-01 | SessionStart hook에서 CC auto-memory 상태를 감지하고 안내 메시지 출력 | High | 48 | `hooks/session-start.js` |
| FR-02 | auto-memory와 bkit memory-store의 역할 구분을 사용자에게 설명 | High | 48 | `hooks/session-start.js` |
| FR-03 | `/memory` 명령 사용법을 bkit help에 포함 | High | 48 | `commands/bkit.md` |
| FR-04 | Skill 완료 시 `/copy` 명령 안내 메시지 추가 (코드 생성 skill) | Medium | 49 | `scripts/skill-post.js` |
| FR-05 | Stop handler에서 세션 요약 시 `/copy` 안내 포함 | Medium | 49 | `scripts/unified-stop.js` |
| FR-06 | CTO Team 메모리 관리 best practice 가이드 문서 작성 | Medium | 50 | `docs/guides/cto-team-memory-guide.md` (신규) |
| FR-07 | Remote Control 호환성 사전 점검 결과 문서화 | Low | 51 | `docs/guides/remote-control-compatibility.md` (신규) |
| FR-08 | Version bump: plugin.json, bkit.config.json, CHANGELOG.md | High | - | 4 files |
| FR-09 | session-start.js 버전 문자열 v1.5.5 -> v1.5.6 업데이트 | High | - | `hooks/session-start.js` |
| FR-10 | CC 호환성 권장 버전 v2.1.42 -> v2.1.59로 업데이트 | Medium | - | `CHANGELOG.md` |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | SessionStart hook 실행 시간 5000ms 이내 유지 | hooks.json timeout 검증 |
| 호환성 | CC v2.1.33 ~ v2.1.59 전 범위 호환 | Hook handler JSON output 검증 |
| 코드 품질 | 기존 bkit 코딩 컨벤션 준수 (camelCase, kebab-case, Korean comments) | Code review |
| 문서 품질 | 한국어 원문, 8개 언어 trigger 패턴 유지 | Document review |
| 토큰 효율 | SessionStart 출력 크기 10% 이하 증가 | 문자열 길이 측정 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 모든 FR (FR-01 ~ FR-10) 구현 완료
- [ ] 기존 13개 hook handler 정상 동작 확인
- [ ] 16개 agent 호환성 확인
- [ ] 27개 skill 호환성 확인
- [ ] Version bump 4개 파일 일관성 확인
- [ ] CHANGELOG.md 엔트리 작성
- [ ] Gap analysis >= 90% match rate

### 4.2 Quality Criteria

- [ ] SessionStart hook 출력 JSON 유효성
- [ ] skill-post.js `/copy` 안내 JSON 출력 유효성
- [ ] 신규 문서 2건 내용 완전성
- [ ] 기존 테스트 패턴과 호환

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|:------:|:----------:|------------|
| #24044: MEMORY.md 이중 로딩으로 system prompt 크기 증가 | Medium | Medium | SessionStart 출력에 auto-memory 안내 추가 시 간결하게 유지 (5줄 이내) |
| #28379: RC slash commands 미지원으로 ENH-51 코드 변경 불가 | Low | High | 문서 수준 준비만 진행, 코드 변경은 #28379 해결 후 별도 피처로 |
| #25131: Agent Teams lifecycle 이슈로 CTO Team 메모리 가이드 정확도 저하 | Medium | Low | v2.1.50 + v2.1.59 메모리 최적화 반영, 알려진 제한 사항 명시 |
| SessionStart hook 출력 크기 증가로 인한 토큰 효율 저하 | Low | Medium | auto-memory 안내를 기존 "Agent Memory" 섹션에 통합 (별도 섹션 추가 X) |
| #27145: CLAUDE_PLUGIN_ROOT 치환 버그 재발 가능 | Low | Low | v2.1.54에서 수정 완료, 모니터링 유지 |

---

## 6. Architecture Considerations

### 6.1 Project Level

bkit은 Dynamic 레벨의 Claude Code 플러그인이다:
- Plugin architecture: hooks → scripts → lib → skills/agents
- 단일 엔트리포인트: hooks.json (13 entries)
- 단일 라이브러리 브릿지: lib/common.js (180 exports)

### 6.2 Key Architectural Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| Auto-memory 안내 위치 | SessionStart hook additionalContext | 세션 시작 시 1회 주입, 기존 "Agent Memory" 섹션 확장 |
| `/copy` 안내 방식 | skill-post.js JSON output 확장 | 기존 PostToolUse(Skill) hook 패턴 활용, 새 hook 불필요 |
| CTO Team 가이드 위치 | `docs/guides/` 신규 디렉토리 | bkit-system 내부 문서와 분리, 사용자 대상 가이드 |
| RC 호환성 문서 위치 | `docs/guides/` 동일 디렉토리 | 사용자 대상 준비 문서 |
| Version bump 범위 | plugin.json + bkit.config.json + CHANGELOG + session-start.js | 기존 v1.5.5 패턴과 동일 |

### 6.3 변경 영향 범위

```
변경 파일 (6개 기존 파일 수정):
├── hooks/session-start.js        -- FR-01, FR-02, FR-09 (auto-memory 안내, 버전)
├── scripts/skill-post.js         -- FR-04 (/copy 안내)
├── scripts/unified-stop.js       -- FR-05 (세션 요약 /copy)
├── commands/bkit.md              -- FR-03 (/memory 도움말)
├── .claude-plugin/plugin.json    -- FR-08 (version bump)
├── bkit.config.json              -- FR-08 (version bump)
└── CHANGELOG.md                  -- FR-08, FR-10 (version history)

신규 파일 (2개):
├── docs/guides/cto-team-memory-guide.md     -- FR-06
└── docs/guides/remote-control-compatibility.md -- FR-07
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions (확인 완료)

- [x] camelCase 함수명 (`enhancedOnboarding`, `detectPdcaPhase`)
- [x] kebab-case 파일명 (`session-start.js`, `skill-post.js`)
- [x] Korean 코드 주석 (`// v1.5.5 Changes:`)
- [x] JSDoc 함수 문서화 (`@param`, `@returns`)
- [x] Lazy require 패턴 (circular dependency 방지)
- [x] debugLog 패턴 (`debugLog('ModuleName', 'message', { data })`)
- [x] JSON console.log 출력 (`console.log(JSON.stringify(response))`)
- [x] try-catch 무음 실패 패턴 (hook 안정성)

### 7.2 ENH별 컨벤션 적용

| ENH | Convention Applied |
|-----|-------------------|
| ENH-48 | SessionStart additionalContext 문자열 연결 패턴, Markdown 출력 |
| ENH-49 | skill-post.js JSON output 확장, generateJsonOutput() 패턴 |
| ENH-50 | Markdown 문서, bkit 문서 구조 (docs/ 하위) |
| ENH-51 | Markdown 문서, 호환성 매트릭스 테이블 형식 |

---

## 8. Implementation Priority

### 8.1 Implementation Order (의존성 기반)

| Order | Item | Dependencies | Effort | Risk |
|:-----:|------|-------------|:------:|:----:|
| 1 | FR-08: Version bump (4 files) | None | Small | Low |
| 2 | FR-01 + FR-02: SessionStart auto-memory 안내 | FR-08 (version string) | Small | Low |
| 3 | FR-09: session-start.js 버전 업데이트 | FR-08 | Small | Low |
| 4 | FR-03: bkit help /memory 추가 | None | Small | Low |
| 5 | FR-04: skill-post.js /copy 안내 | None | Small | Low |
| 6 | FR-05: unified-stop.js /copy 안내 | None | Small | Low |
| 7 | FR-06: CTO Team 메모리 가이드 | None | Medium | Low |
| 8 | FR-07: RC 호환성 문서 | None | Medium | Low |
| 9 | FR-10: CHANGELOG 호환성 버전 업데이트 | FR-08 | Small | Low |

### 8.2 예상 변경량

| File | Lines Added | Lines Modified | Lines Removed |
|------|:----------:|:--------------:|:-------------:|
| `hooks/session-start.js` | ~15 | ~5 | 0 |
| `scripts/skill-post.js` | ~20 | ~3 | 0 |
| `scripts/unified-stop.js` | ~5 | 0 | 0 |
| `commands/bkit.md` | ~10 | ~2 | 0 |
| `.claude-plugin/plugin.json` | 0 | 1 | 0 |
| `bkit.config.json` | 0 | 1 | 0 |
| `CHANGELOG.md` | ~50 | 0 | 0 |
| `docs/guides/cto-team-memory-guide.md` | ~120 (신규) | - | - |
| `docs/guides/remote-control-compatibility.md` | ~80 (신규) | - | - |
| **Total** | **~300** | **~12** | **0** |

---

## 9. Test Plan Summary

| Test Category | Test Cases | Method |
|--------------|:----------:|--------|
| FR-01 ~ FR-02 | 3 TC | SessionStart hook 출력 JSON 검증 |
| FR-03 | 2 TC | bkit.md 내용 확인, /memory 참조 존재 확인 |
| FR-04 | 3 TC | skill-post.js 출력 JSON에 copyHint 필드 확인 |
| FR-05 | 2 TC | unified-stop.js 출력에 /copy 안내 확인 |
| FR-06 | 3 TC | 가이드 문서 존재, 내용 완전성, 정확성 |
| FR-07 | 2 TC | RC 문서 존재, 27개 skill 호환성 매트릭스 |
| FR-08 | 4 TC | 4개 파일 버전 일치 확인 (1.5.6) |
| FR-09 | 1 TC | session-start.js 버전 문자열 확인 |
| FR-10 | 1 TC | CHANGELOG 호환성 권장 버전 확인 |
| Regression | 5 TC | 기존 hook/skill/agent 동작 확인 |
| **Total** | **26 TC** | |

---

## 10. Team Assignments

| Role | Agent | Responsibility |
|------|-------|---------------|
| **CTO Lead** | cto-lead (opus) | 전체 조율, 품질 게이트, 최종 검증 |
| code-analyzer | code-analyzer (opus) | 소스 코드 분석, 변경 영향 범위 검증 |
| product-manager | product-manager (sonnet) | 요구사항 정의, ENH 우선순위 결정 |
| frontend-architect | frontend-architect (sonnet) | Hook/Skill/Command 아키텍처 변경 평가 |
| qa-strategist | qa-strategist (sonnet) | 테스트 계획, 검증 전략 수립 |
| gap-detector | gap-detector (opus) | Plan/Design 완전성 검증 |

---

## 11. Next Steps

1. [x] Plan 문서 작성 (이 문서)
2. [ ] Design 문서 작성 (`bkit-v1.5.6-cc-v2159-enhancement.design.md`)
3. [ ] Design review 및 승인
4. [ ] Implementation (Do phase)
5. [ ] Gap Analysis (Check phase)
6. [ ] Completion Report (Report phase)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-26 | Initial draft -- CTO Team 분석 결과 기반 | CTO Lead (cto-lead, opus) |
