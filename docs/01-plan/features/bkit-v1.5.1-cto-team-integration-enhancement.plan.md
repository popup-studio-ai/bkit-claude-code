# bkit v1.5.1 CTO Team Integration Enhancement Plan

> **Summary**: CTO-Led Team 구현 후 발견된 Gap 해소 - Skills 연동, 자동 팀 활성화, 철학 문서 동기화
>
> **Project**: bkit-claude-code
> **Version**: 1.5.1
> **Author**: CTO Team (bkit PDCA)
> **Date**: 2026-02-06
> **Status**: Draft
> **Prerequisite**: bkit-v1.5.1-cto-team-agent-teams-expansion (100% 완료)

---

## 1. 배경

CTO-Led Team Agent Teams Expansion 구현이 100% Match Rate로 완료되었으나, 전체 시스템 관점에서 3가지 주요 Gap이 발견되었다:

1. **Skills-Agents 미연동**: 신규 5개 에이전트가 어떤 skill의 frontmatter에도 바인딩되지 않음
2. **자동 팀 활성화 부재**: `Automation First` 철학에 위배 - 사용자가 팀 기능을 몰라도 자동으로 팀이 되어야 함
3. **철학 문서 동기화 필요**: `bkit-system/philosophy/` 문서가 v1.5.0 기준으로 정지, CTO Team 반영 필요

---

## 2. 목표

### Must (필수)

| ID | 목표 | 설명 |
|----|------|------|
| G-01 | Skills-Agents 바인딩 | 신규 5개 에이전트를 관련 skills의 agents 필드에 추가 |
| G-02 | 자동 팀 제안 로직 | Major Feature 감지 시 자동으로 팀 모드 제안 |
| G-03 | PDCA Skill team 섹션 업데이트 | `/pdca team` 동작을 CTO-Led 구조로 업데이트 |
| G-04 | 철학 문서 v1.5.1 업데이트 | 4개 철학 문서에 CTO Team 내용 반영 |

### Should (권장)

| ID | 목표 | 설명 |
|----|------|------|
| G-05 | user-prompt-handler 팀 감지 | 팀 관련 키워드 감지 후 자동 CTO 에이전트 트리거 |
| G-06 | session-start CTO Team 정보 표시 | 팀 모드 활성화 시 CTO-Led 구조 안내 |

### Could (선택)

| ID | 목표 | 설명 |
|----|------|------|
| G-07 | bkit-system 컴포넌트 카운트 업데이트 | Agents 11→16, Scripts 39→43 등 반영 |
| G-08 | intent/language.js 팀 트리거 패턴 추가 | 8개국어 팀 관련 의도 감지 패턴 |

---

## 3. 범위

### 3.1 Skills 수정 대상

| Skill | 현재 agents 필드 | 추가할 바인딩 | 이유 |
|-------|-----------------|-------------|------|
| `pdca` | analyze, iterate, report | + `team: bkit:cto-lead` | CTO가 팀 모드 조율 |
| `enterprise` | default, infra, architecture | + `security: bkit:security-architect` | Enterprise에 보안 필수 |
| `phase-7-seo-security` | `agent: bkit:code-analyzer` | → `agents: {default: bkit:code-analyzer, security: bkit:security-architect}` | 보안 전담 에이전트 추가 |
| `phase-8-review` | default, validate, gap | + `qa: bkit:qa-strategist` | QA 전략 에이전트 추가 |
| `phase-3-mockup` | `agent: bkit:pipeline-guide` | → `agents: {default: bkit:pipeline-guide, frontend: bkit:frontend-architect}` | UI 전문가 추가 |
| `phase-5-design-system` | `agent: bkit:pipeline-guide` | → `agents: {default: bkit:pipeline-guide, frontend: bkit:frontend-architect}` | Design System 전문가 |
| `phase-6-ui-integration` | `agent: bkit:pipeline-guide` | → `agents: {default: bkit:pipeline-guide, frontend: bkit:frontend-architect}` | UI 통합 전문가 |

### 3.2 자동 팀 활성화 수정 대상

| 파일 | 수정 내용 |
|------|----------|
| `scripts/user-prompt-handler.js` | Major Feature 감지 시 팀 모드 제안 로직 추가 |
| `lib/intent/language.js` | 8개국어 팀 관련 의도 감지 패턴 추가 |
| `lib/team/coordinator.js` | `suggestTeamMode()` 함수 추가 |
| `skills/pdca/SKILL.md` | team 섹션을 CTO-Led 구조로 업데이트 (Dynamic 3, Enterprise 5) |

### 3.3 철학 문서 업데이트 대상

| 파일 | 업데이트 내용 |
|------|-------------|
| `bkit-system/philosophy/core-mission.md` | v1.5.1 Agents 11→16, CTO Team 설명 |
| `bkit-system/philosophy/ai-native-principles.md` | Team Composition 업데이트, CTO Role |
| `bkit-system/philosophy/pdca-methodology.md` | team 명령 및 CTO-Led 패턴 반영 |
| `bkit-system/philosophy/context-engineering.md` | Agents 16개, team 모듈 구조 반영 |

---

## 4. 성공 기준

| 기준 | 측정 방법 | 목표 |
|------|----------|------|
| Skills-Agents 연동 | 7개 skill에 신규 agent 바인딩 확인 | 100% |
| 자동 팀 제안 | "로그인 기능 만들어줘" 입력 시 팀 모드 제안 확인 | 자동 제안 |
| 철학 문서 동기화 | 4개 철학 문서의 v1.5.1 내용 일치 | 100% 동기화 |
| Graceful Degradation | Agent Teams 비활성화 시 기존 동작 유지 | 정상 |

---

## 5. 일정 예측

| Phase | 내용 | 예상 작업 |
|-------|------|----------|
| Design | 상세 설계서 작성 | 수정 파일별 변경 사항 명세 |
| Do | 구현 | Skills 7개 + Scripts 2개 + lib 2개 + 철학 4개 + PDCA skill 1개 = 16개 파일 |
| Check | Gap Analysis | 설계서 대비 100% Match Rate 달성 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-06 | 초기 계획서 - CTO Team 분석 기반 | CTO Team |
