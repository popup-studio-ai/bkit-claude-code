# bkit v1.6.0 문서 동기화 계획서

> **요약**: v1.6.0 릴리즈 전 전체 코드베이스 문서 동기화 — 버전 번호, 컴포넌트 수치, 아키텍처 설명, 신규 기능 반영
>
> **프로젝트**: bkit-claude-code
> **버전**: 1.6.0
> **작성자**: CTO Team (8 Agent Audit)
> **날짜**: 2026-03-07
> **상태**: 승인됨

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **문제** | v1.6.0 기능(Skills 2.0, PM Team, Skill Evals, 28개 스킬, 21개 에이전트)이 구현되었으나 문서가 v1.5.9 상태로 불일치 |
| **해결책** | 8개 전문 에이전트 전수 조사 기반 체계적 문서 동기화 (4개 카테고리 병렬 실행) |
| **기능/UX 효과** | 릴리즈 품질 보증, 사용자가 정확한 정보 접근, 플러그인 마켓플레이스 올바른 버전 표시 |
| **핵심 가치** | "Docs=Code" 철학 실현 — 문서와 구현의 100% 동기화 |

---

## 1. 개요

### 1.1 목적

bkit v1.6.0 릴리즈에 필요한 전체 코드베이스 문서 동기화. 버전 번호, 컴포넌트 수치, 아키텍처 설명, 신규 기능 문서화를 포함.

### 1.2 배경

v1.6.0은 Skills 2.0 Complete Integration (19 ENH items), PM Agent Team (5 agents), Skill Evals Framework, Skill Classification 등 대규모 기능이 추가됨. 구현은 완료되었으나 문서가 v1.5.9 기준으로 남아있어 릴리즈 전 완전한 동기화가 필요.

### 1.3 조사 결과 (8 Agent Audit Summary)

| 에이전트 | 영역 | 발견 건수 |
|---------|------|----------|
| Version Auditor | 전체 버전 번호 | 456개 참조, ~55개 파일 |
| Count Auditor | 컴포넌트 수치 | 18+개 파일 수치 오류 |
| bkit-system Auditor | 설계/철학 문서 17개 | 9개 버전, 12개 기능 누락 |
| Agents Auditor | 21개 에이전트 파일 | 11개 Feature Guidance 갱신 |
| Skills Auditor | 28개 스킬 파일 | 26/28 구버전 참조 |
| Scripts/Lib Auditor | JS 파일 | session-start.js 버전, evals 수치 |
| Templates Auditor | 15개 템플릿 + 설정 | marketplace.json CRITICAL |
| README/CHANGELOG Auditor | 루트 문서 | CHANGELOG v1.6.0 누락 |

---

## 2. 범위

### 2.1 포함 범위

- [ ] CAT-1: 설정 파일 버전 업데이트 (plugin.json, bkit.config.json, hooks.json, marketplace.json, session-start.js)
- [ ] CAT-2: bkit-system/ 문서 17개 파일 갱신 (버전, 수치, 기능 추가)
- [ ] CAT-3: README.md 수치 수정 + CHANGELOG.md v1.6.0 엔트리 추가
- [ ] CAT-4: 에이전트 21개 파일 Feature Guidance 갱신
- [ ] CAT-5: 스킬 28개 파일 v1.6.0 Feature Guidance 추가
- [ ] CAT-6: JS 파일 @version 태그 업데이트 (11개 스크립트)
- [ ] CAT-7: CUSTOMIZATION-GUIDE.md 수치/버전 갱신
- [ ] CAT-8: evals/README.md 스킬 수 수정

### 2.2 제외 범위

- docs/ PDCA 문서 (역사적 기록, 수정 불가)
- 8개국어 트리거 키워드 (변경 불필요)
- 템플릿 파일 (버전 무관 설계, 변경 불필요)
- lib/ 내부 로직 변경 (문서 동기화만 수행)

---

## 3. 요구사항

### 3.1 기능 요구사항

| ID | 요구사항 | 우선순위 | 상태 |
|----|---------|---------|------|
| FR-01 | plugin.json, bkit.config.json, hooks.json 버전을 1.6.0으로 변경 | Critical | 대기 |
| FR-02 | marketplace.json 버전 및 컴포넌트 수치 변경 (28 skills, 21 agents) | Critical | 대기 |
| FR-03 | CHANGELOG.md에 v1.6.0 엔트리 추가 (전체 변경사항 기록) | Critical | 대기 |
| FR-04 | README.md 수치 불일치 수정 (L461, L462, L565) | High | 대기 |
| FR-05 | session-start.js L3 버전 v1.5.9→v1.6.0 변경 | High | 대기 |
| FR-06 | 11개 scripts/*.js @version 태그 1.5.9→1.6.0 변경 | High | 대기 |
| FR-07 | bkit-system/ 17개 파일 버전 참조 v1.5.x→v1.6.0 변경 | High | 대기 |
| FR-08 | bkit-system/_GRAPH-INDEX.md 수치 갱신 (28 skills, 21 agents, 241 exports) | High | 대기 |
| FR-09 | bkit-system/components/skills/_skills-overview.md Skill Classification 추가 | High | 대기 |
| FR-10 | bkit-system/components/agents/_agents-overview.md PM Team 반영 (21 agents) | High | 대기 |
| FR-11 | 10개 core agent v1.5.9→v1.6.0 Feature Guidance 업데이트 | Medium | 대기 |
| FR-12 | 5개 CTO Team agent (무 Feature Guidance) v1.6.0 섹션 추가 | Medium | 대기 |
| FR-13 | 5개 PM Team agent v1.6.0 Feature Guidance 추가 | Medium | 대기 |
| FR-14 | bkit-system/philosophy/ 4개 파일 v1.6.0 섹션 추가 | Medium | 대기 |
| FR-15 | CUSTOMIZATION-GUIDE.md 수치/버전 갱신 | Medium | 대기 |
| FR-16 | evals/README.md "27 skills"→"28 skills" 수정 | Medium | 대기 |
| FR-17 | evals/runner.js JSDoc "27 skills"→"28 skills" 수정 | Medium | 대기 |
| FR-18 | bkit-system/testing/test-checklist.md v1.6.0 테스트 섹션 추가 | Low | 대기 |
| FR-19 | commands/bkit.md 버전 참조 갱신 | Low | 대기 |
| FR-20 | bkit-rules/SKILL.md 버전 참조 갱신 | Low | 대기 |

### 3.2 비기능 요구사항

| 카테고리 | 기준 | 측정 방법 |
|---------|------|----------|
| 정확성 | 모든 버전 참조 1.6.0으로 통일 | grep "1.5.9" 결과 0건 (docs/ 제외) |
| 일관성 | 수치 일관성 (28 skills, 21 agents, 241 functions) | 전수 검색 |
| 완전성 | v1.6.0 기능 문서화 100% | Plan/Design 대비 Gap Analysis |
| 언어 | docs/ 한국어, 나머지 영어 | 파일별 검증 |

---

## 4. 성공 기준

### 4.1 완료 정의

- [ ] FR-01~FR-20 모든 요구사항 구현
- [ ] `grep -r "1.5.9" --include="*.json" --include="*.js" --include="*.md" | grep -v docs/ | grep -v node_modules | grep -v .bkit/` 결과 0건 (역사적 참조 제외)
- [ ] 컴포넌트 수치 전수 일치 (28/21/241/45/10/4)
- [ ] Gap Analysis 100% match rate

### 4.2 품질 기준

- [ ] CHANGELOG.md v1.6.0 엔트리에 모든 변경사항 포함
- [ ] bkit-system/ 문서에 Skills 2.0, PM Team, Skill Evals 기능 반영
- [ ] 영어/한국어 언어 규칙 준수

---

## 5. 위험 및 완화

| 위험 | 영향 | 가능성 | 완화 |
|------|-----|-------|------|
| 역사적 v1.5.9 참조를 잘못 변경 | Medium | Medium | docs/ 디렉토리 및 CHANGELOG 기존 엔트리 제외 |
| 수치 불일치 누락 | High | Low | 8개 에이전트 전수 조사로 사전 식별 완료 |
| 대량 파일 수정으로 인한 충돌 | Medium | Low | 카테고리별 병렬 작업으로 충돌 방지 |

---

## 6. 실행 전략

### 6.1 병렬 실행 그룹 (4 parallel batches)

```
Batch A: 설정 파일 (FR-01, FR-02, FR-05, FR-06)
  → plugin.json, bkit.config.json, hooks.json, marketplace.json
  → session-start.js, 11 scripts @version

Batch B: bkit-system/ 문서 (FR-07~FR-10, FR-14, FR-18)
  → 17개 bkit-system/ 마크다운 파일
  → philosophy/, components/, triggers/, testing/

Batch C: README + CHANGELOG + 기타 (FR-03, FR-04, FR-15~FR-17, FR-19~FR-20)
  → README.md, CHANGELOG.md, CUSTOMIZATION-GUIDE.md
  → evals/, commands/, bkit-rules

Batch D: 에이전트 + 스킬 (FR-11~FR-13)
  → 21개 에이전트 파일
  → 주요 스킬 파일 Feature Guidance
```

### 6.2 Check-Act 반복 전략

1. 1차 실행 후 Gap Analysis 수행
2. Match Rate < 100% → 자동 수정 반복 (최대 5회)
3. 최종 `grep "1.5.9"` 검증으로 잔여 참조 확인

---

## 7. 다음 단계

1. [x] 전수 조사 완료 (8 Agent Audit)
2. [x] Plan 문서 작성
3. [ ] Design 문서 작성 (파일별 상세 변경 명세)
4. [ ] 4개 Batch 병렬 실행
5. [ ] Gap Analysis + Check-Act 반복
6. [ ] 완료 보고서 작성

---

## 버전 이력

| 버전 | 날짜 | 변경사항 | 작성자 |
|------|------|---------|-------|
| 1.0 | 2026-03-07 | 최초 작성 (8 Agent Audit 기반) | CTO Team |
