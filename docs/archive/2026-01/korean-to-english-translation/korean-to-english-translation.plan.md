# 한국어 → 영어 번역 계획 문서

> **요약**: bkit 코드베이스의 한국어 콘텐츠를 영어로 번역하고 8개국어 트리거 키워드는 보존
>
> **프로젝트**: bkit-claude-code
> **버전**: 1.4.5
> **작성자**: bkit Team
> **작성일**: 2026-01-27
> **상태**: Draft

---

## 1. 개요

### 1.1 목적

bkit 플러그인을 국제화하여 전 세계 개발자가 접근할 수 있도록 모든 한국어 콘텐츠를 영어로 번역합니다. 단, 8개국어 다국어 트리거 키워드 지원(EN, KO, JA, ZH, ES, FR, DE, IT)은 그대로 유지합니다.

### 1.2 배경

현재 bkit에는 문서와 코드 전반에 한국어 설명 텍스트가 포함되어 있습니다. 글로벌 접근성과 일관성을 위해 트리거 키워드를 제외한 모든 한국어 콘텐츠를 영어로 번역해야 합니다.

### 1.3 관련 문서

- README.md (Language Support 섹션)
- CHANGELOG.md (v1.4.0 변경사항)
- bkit-system/philosophy/context-engineering.md

---

## 2. 범위

### 2.1 포함 범위

- [x] hooks/ 디렉토리 - session-start.js
- [x] agents/ 디렉토리 - 11개 에이전트 파일
- [x] skills/ 디렉토리 - 21개 스킬 파일
- [x] templates/ 디렉토리 - 3개 템플릿 파일
- [x] bkit-system/ 디렉토리 - 4개 문서 파일

### 2.2 제외 범위

- `description:` 프론트매터의 트리거 키워드 (8개국어 지원 유지 필수)
- README.md 초보자 섹션 (한국어 초보자를 위해 의도적으로 한국어 유지)
- docs/ 사용자 생성 PDCA 문서
- CHANGELOG.md (히스토리 기록)

---

## 3. 요구사항

### 3.1 기능 요구사항

| ID | 요구사항 | 우선순위 | 상태 |
|----|---------|----------|------|
| FR-01 | session-start.js 한국어 UI 텍스트 영어로 번역 | High | Pending |
| FR-02 | agents/* 한국어 콘텐츠 영어로 번역 (트리거 보존) | High | Pending |
| FR-03 | skills/* 한국어 콘텐츠 영어로 번역 (트리거 보존) | High | Pending |
| FR-04 | templates/* 한국어 콘텐츠 영어로 번역 | High | Pending |
| FR-05 | bkit-system/* 한국어 예시 영어로 번역 | Medium | Pending |
| FR-06 | 모든 파일에서 8개국어 트리거 키워드 보존 | Critical | Pending |
| FR-07 | 모든 번역에서 의미 유지 | Critical | Pending |

### 3.2 비기능 요구사항

| 카테고리 | 기준 | 검증 방법 |
|----------|------|-----------|
| 일관성 | 모든 번역이 동일한 용어 사용 | 수동 검토 |
| 완전성 | 100% 한국어 콘텐츠 번역 | `grep -rn '[가-힣]'` 검사 |
| 보존성 | 모든 트리거 키워드 유지 | 전후 비교 |

---

## 4. 성공 기준

### 4.1 완료 정의

- [x] 모든 한국어 콘텐츠 위치 파악 (스캔 완료)
- [ ] 모든 한국어 콘텐츠 영어로 번역
- [ ] 8개국어 트리거 키워드 보존 확인
- [ ] 새로운 한국어 텍스트 미도입
- [ ] 버전 1.4.5로 업데이트

### 4.2 품질 기준

- [ ] 트리거 키워드 외 한국어 문자 0개
- [ ] 모든 번역 정확성 확인
- [ ] 기능 변경 없음

---

## 5. 위험 및 완화

| 위험 | 영향 | 가능성 | 완화 방안 |
|------|------|--------|-----------|
| 트리거 키워드 실수로 삭제 | High | Medium | 번역 전 모든 트리거 키워드 목록 생성 |
| 번역 시 의미 변질 | Medium | Low | 각 번역 신중하게 검토 |
| 코드 주석 손상 | Low | Low | 설명 텍스트만 번역, 코드는 그대로 |

---

## 6. 스캔 결과 요약

### 6.1 한국어 콘텐츠 포함 파일

**총 파일 수: 40개**

#### hooks/ (1개 파일)
| 파일 | 한국어 라인 수 | 유형 |
|------|---------------|------|
| session-start.js | ~50줄 | UI 문자열, 주석, 단계 표시 |

#### agents/ (11개 파일)
| 파일 | 한국어 콘텐츠 유형 |
|------|-------------------|
| gap-detector.md | 트리거만 |
| pdca-iterator.md | 트리거만 |
| code-analyzer.md | 트리거만 |
| report-generator.md | 트리거만 |
| starter-guide.md | 트리거만 |
| bkend-expert.md | 트리거만 |
| design-validator.md | 트리거만 |
| enterprise-expert.md | 전제조건 섹션에 한국어 |
| pipeline-guide.md | 트리거 + 사용자 상호작용 예시 |
| qa-monitor.md | 트리거만 |
| infra-architect.md | 트리거만 |

#### skills/ (21개 파일)
| 파일 | 한국어 콘텐츠 유형 |
|------|-------------------|
| pdca/SKILL.md | 전체 콘텐츠 한국어 |
| starter/SKILL.md | Arguments, actions 한국어 |
| dynamic/SKILL.md | Arguments, actions 한국어 |
| enterprise/SKILL.md | Arguments, actions 한국어 |
| claude-code-learning/SKILL.md | 전체 학습 콘텐츠 한국어 |
| code-review/SKILL.md | 리뷰 항목 한국어 |
| development-pipeline/SKILL.md | 트리거만 |
| bkit-rules/SKILL.md | 트리거만 |
| bkit-templates/SKILL.md | 트리거만 |
| phase-1-schema/SKILL.md | 트리거만 |
| phase-2-convention/SKILL.md | 트리거만 |
| phase-3-mockup/SKILL.md | 트리거만 |
| phase-4-api/SKILL.md | 트리거만 |
| phase-5-design-system/SKILL.md | 트리거만 |
| phase-6-ui-integration/SKILL.md | 트리거만 |
| phase-7-seo-security/SKILL.md | 트리거만 |
| phase-8-review/SKILL.md | 트리거만 |
| phase-9-deployment/SKILL.md | 트리거만 |
| zero-script-qa/SKILL.md | 트리거만 |
| desktop-app/SKILL.md | 트리거만 |
| mobile-app/SKILL.md | 트리거만 |

#### templates/ (3개 파일)
| 파일 | 한국어 콘텐츠 유형 |
|------|-------------------|
| do.template.md | 섹션 헤더, 체크리스트 항목 |
| schema.template.md | 필드 설명, 용어 정의 |
| convention.template.md | 폴더 설명, 주석 |

#### bkit-system/ (4개 파일)
| 파일 | 한국어 콘텐츠 유형 |
|------|-------------------|
| philosophy/context-engineering.md | 한국어 패턴 코드 예시 |
| components/skills/_skills-overview.md | 트리거 예시 |
| components/scripts/_scripts-overview.md | 함수 호출 예시 |
| components/agents/_agents-overview.md | 트리거 예시 |

---

## 7. 번역 전략

### 7.1 트리거 키워드 (보존 - 번역 금지)

`description:` 프론트매터와 `Triggers:` 섹션의 모든 8개국어 트리거 키워드는 그대로 유지:

```
EN: beginner, first project, simple website 등
KO: 초보자, 입문, 처음, 코딩 배우기, 웹사이트 만들기 등 (보존!)
JA: 初心者, 入門, ウェブサイト作成, わからない 등
ZH: 新手, 学习编程, 不懂, 不明白 등
ES: principiante, no entiendo, explica, difícil
FR: débutant, je ne comprends pas
DE: Anfänger, verstehe nicht
IT: principiante, non capisco, difficile, spiegami
```

### 7.2 콘텐츠 번역 규칙

| 콘텐츠 유형 | 작업 |
|------------|------|
| .md 섹션 헤더 | 영어로 번역 |
| 코드 주석 | 영어로 번역 |
| .js UI 문자열 | 영어로 번역 |
| 테이블 셀 내용 | 영어로 번역 |
| 체크리스트 항목 | 영어로 번역 |
| 에러 메시지 | 영어로 번역 |
| 트리거 키워드 | **보존** |
| 코드 변수명 | **보존** |

### 7.3 용어 일관성

| 한국어 용어 | 영어 번역 |
|------------|-----------|
| 계획 | Plan |
| 설계 | Design |
| 구현 | Implementation |
| 검증 | Verification / Check |
| 분석 | Analysis |
| 보고서 | Report |
| 단계 | Phase / Stage |
| 기능 | Feature |
| 초보자 | Beginner |
| 가이드 | Guide |
| 프로젝트 초기화 | Project initialization |
| 폴더 구조 | Folder structure |
| 환경변수 | Environment variables |
| 코딩 컨벤션 | Coding conventions |
| 레이어 구조 | Layer structure |
| 의존성 방향 | Dependency direction |
| 보안 취약점 | Security vulnerabilities |

---

## 8. 구현 계획

### Phase 1: hooks/ (1개 파일)
1. session-start.js UI 문자열 번역
2. 단계 표시 매핑 번역
3. 온보딩 프롬프트 번역

### Phase 2: agents/ (11개 파일)
1. 각 에이전트 파일 검토
2. 콘텐츠 섹션 번역 (프론트매터 트리거 보존)
3. 트리거 키워드 무결성 확인

### Phase 3: skills/ (21개 파일)
1. 우선순위: pdca, starter, dynamic, enterprise, claude-code-learning, code-review
2. SKILL.md 콘텐츠 번역
3. 프론트매터 트리거 키워드 보존

### Phase 4: templates/ (3개 파일)
1. do.template.md 번역
2. schema.template.md 번역
3. convention.template.md 번역

### Phase 5: bkit-system/ (4개 파일)
1. 코드 예시 번역 (트리거 패턴의 한국어는 보존)
2. 문서 예시 업데이트

### Phase 6: 검증
1. 남은 한국어 grep 검사: `grep -rn '[가-힣]'`
2. 트리거 키워드 보존 확인
3. 기능 테스트

---

## 9. 다음 단계

1. [ ] 설계 문서 작성 (`korean-to-english-translation.design.md`)
2. [ ] 각 파일별 Task 목록 생성
3. [ ] Phase 1 구현 시작
4. [ ] 각 Phase 완료 후 검증

---

## 버전 이력

| 버전 | 날짜 | 변경사항 | 작성자 |
|------|------|----------|--------|
| 0.1 | 2026-01-27 | 초안 작성 | bkit Team |
