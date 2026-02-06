# bkit v1.5.2 Documentation Synchronization Plan

> **Summary**: v1.5.2 변경 사항(bkend 전문성 강화, BUG-01 수정, 5 Skills 추가)을 전체 문서와 설정 파일에 동기화
>
> **Project**: bkit-claude-code
> **Version**: 1.5.2
> **Author**: CTO Team (4-agent 병렬 분석 기반)
> **Date**: 2026-02-06
> **Status**: Draft
> **Related**: bkit-v1.5.2-bkend-expert-enhancement (completed, 100%)

---

## 1. Background

### 1.1 문서 동기화 필요성

bkit v1.5.2에서 다음 변경이 완료되었으나, 문서와 설정 파일에 반영되지 않은 상태:

| 변경 항목 | 상세 |
|-----------|------|
| Skills 5개 추가 | bkend-quickstart, bkend-data, bkend-auth, bkend-storage, bkend-cookbook |
| 공유 템플릿 추가 | templates/shared/bkend-patterns.md |
| BUG-01 수정 | Agent Trigger `> 0.8` → `>= 0.8` |
| bkend-expert Agent 재작성 | 145줄 → 215줄, MCP 19 Tools + REST API |
| 기존 파일 7개 수정 | dynamic, phase-4-api, session-start, language, user-prompt-handler 등 |

### 1.2 영향받는 구성요소 수치 변경

| 항목 | 기존 (문서) | 실제 (v1.5.2) | 차이 |
|------|:----------:|:------------:|:----:|
| Skills | 21 (일부 22) | **26** | +5 |
| Templates | 23 | **27** | +4 |
| Library Functions | 132~160+ | **165** | 수정 |
| Scripts | 39~44 | **43** | 수정 |
| Agents | 16 | 16 | 변경 없음 |

### 1.3 CTO Team 분석 결과

4개 에이전트가 병렬로 전체 코드베이스를 분석한 결과:

| Agent | 담당 영역 | 파일 수 | 변경 항목 수 |
|:-----:|----------|:------:|:----------:|
| 1 | README + CHANGELOG | 2 | 5 |
| 2 | CUSTOMIZATION-GUIDE + AI-NATIVE | 2 | 24 |
| 3 | bkit-system/ 하위 전체 | 8 | 29 |
| 4 | Config + Plugin + Hooks | 5 | 13 |
| **합계** | | **17** | **71** |

---

## 2. Goals

### 2.1 Must (필수)

| ID | Goal | Description |
|:--:|------|-------------|
| G-01 | 버전 번호 동기화 | 모든 파일의 1.5.1 → 1.5.2 업데이트 |
| G-02 | Skills 수 동기화 | 21/22 → 26 (전체 문서) |
| G-03 | Templates 수 동기화 | 23 → 27 (전체 문서) |
| G-04 | Library 수 동기화 | 132/141/160+ → 165 (전체 문서) |
| G-05 | Scripts 수 동기화 | 39/44 → 43 (전체 문서) |
| G-06 | CHANGELOG v1.5.2 추가 | v1.5.2 전체 변경 내역 기록 |
| G-07 | 설정 파일 버전 업데이트 | bkit.config.json, plugin.json, marketplace.json, hooks.json |
| G-08 | session-start.js 버전 | 7개 버전 참조 업데이트 |

### 2.2 Should (권장)

| ID | Goal | Description |
|:--:|------|-------------|
| G-09 | bkend Skills 목록 추가 | _skills-overview.md에 5개 신규 Skill 항목 추가 |
| G-10 | 아키텍처 다이어그램 버전 | v1.4.3 → v1.5.2 다이어그램 헤더 업데이트 |
| G-11 | bkit-system 버전 노트 | 각 overview 파일에 v1.5.2 변경 요약 추가 |

---

## 3. Scope

### 3.1 In Scope (총 17개 파일, 71개 변경 항목)

#### Category A: 루트 문서 (4개 파일)

| 파일 | 변경 유형 | 항목 수 |
|------|----------|:------:|
| README.md | 버전 배지, Skills 수 (3곳), 기타 | 4 |
| CHANGELOG.md | v1.5.2 섹션 신규 추가 | 1 |
| CUSTOMIZATION-GUIDE.md | 버전 (8곳), Skills 수 (4곳), 기타 | 19 |
| AI-NATIVE-DEVELOPMENT.md | Skills 수 (4곳), 버전 (1곳) | 5 |

#### Category B: bkit-system/ 문서 (8개 파일)

| 파일 | 변경 유형 | 항목 수 |
|------|----------|:------:|
| bkit-system/README.md | Skills, Templates, Lib 수 | 4 |
| bkit-system/_GRAPH-INDEX.md | Skills, Templates, Lib 수 | 5 |
| bkit-system/components/skills/_skills-overview.md | Skills 수, 버전, 신규 목록 | 3 |
| bkit-system/components/scripts/_scripts-overview.md | Lib 버전, 함수 수 | 2 |
| bkit-system/philosophy/context-engineering.md | Skills, Templates, Lib 수 | 3 |
| bkit-system/philosophy/core-mission.md | Skills, Templates, Lib 수 | 3 |
| bkit-system/triggers/trigger-matrix.md | bkend 트리거 정보 | 1 |
| bkit-system/components/agents/_agents-overview.md | bkend-expert 버전 노트 | 1 |

#### Category C: 설정/플러그인 파일 (5개 파일)

| 파일 | 변경 유형 | 항목 수 |
|------|----------|:------:|
| bkit.config.json | version 필드 | 1 |
| .claude-plugin/plugin.json | version 필드 | 1 |
| .claude-plugin/marketplace.json | version 필드 (2곳) | 2 |
| hooks/hooks.json | description 버전 | 1 |
| hooks/session-start.js | 버전 참조 (7곳) | 7 |

### 3.2 Out of Scope

- 코드 로직 변경 (이미 v1.5.2에서 완료)
- 신규 기능 개발
- 테스트 실행
- bkit-system/ 하위 overview 파일의 대규모 구조 변경

---

## 4. Success Criteria

### 4.1 Definition of Done

| 기준 | 설명 |
|------|------|
| 버전 일치 | `grep -r "1.5.1"` 결과 0건 (의도적 히스토리 참조 제외) |
| 수치 일치 | Skills=26, Templates=27, Lib=165, Scripts=43 전체 문서 일치 |
| CHANGELOG 완성 | v1.5.2 섹션에 Added/Changed/Fixed/Compatibility 포함 |
| 설정 파일 일치 | 4개 설정 파일 version="1.5.2" |
| Gap Analysis | 90% 이상 Match Rate |

### 4.2 Quality Criteria

| 항목 | 기준 |
|------|------|
| 일관성 | 모든 문서의 수치/버전이 동일한 값 |
| 정확성 | 실제 파일 수와 문서 수치 일치 |
| 완전성 | 누락 없이 17개 파일 모두 업데이트 |
| CHANGELOG 품질 | bkend-expert-enhancement.report.md 기반 정확한 변경 이력 |

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|:------:|:----------:|------------|
| 일부 파일 누락 | Medium | Low | CTO 팀 4-agent 병렬 분석으로 사전 식별 완료 |
| 수치 오류 | Medium | Medium | 실제 파일 카운트와 교차 검증 (find 명령) |
| CHANGELOG 부정확 | Low | Low | 기존 report.md 기반 작성 |
| 기존 불일치 확산 | Low | Medium | 기존 22→26 등 이미 틀린 값도 함께 수정 |

---

## 6. Implementation Strategy

### 6.1 작업 순서

```
Phase 1: 설정 파일 (Category C) — 5개 파일, 12개 항목
  ↓
Phase 2: 루트 문서 (Category A) — 4개 파일, 29개 항목
  ↓
Phase 3: bkit-system 문서 (Category B) — 8개 파일, 22개 항목
  ↓
Phase 4: 검증 (grep + 교차 확인)
```

### 6.2 검증 방법

```bash
# Phase 4 검증 스크립트
grep -rn "1\.5\.1" --include="*.md" --include="*.json" --include="*.js" | grep -v CHANGELOG | grep -v "node_modules"
grep -rn "21 Skills\|22 skills\|21 skills" --include="*.md"
grep -rn "23 templates\|23 Templates" --include="*.md"
grep -rn "132 functions\|141 functions\|160+" --include="*.md"
```

---

## 7. Next Steps

| # | Action | PDCA Phase |
|:-:|--------|:----------:|
| 1 | Design 문서 작성 (파일별 변경 명세) | Design |
| 2 | 사용자 리뷰 및 승인 | - |
| 3 | 구현 (17개 파일 수정) | Do |
| 4 | Gap Analysis (grep 검증) | Check |
| 5 | 완료 보고서 | Report |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-06 | 초기 Plan - CTO 팀 4-agent 분석 기반 | CTO Team |
