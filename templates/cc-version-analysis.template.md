---
template: cc-version-analysis
version: 1.0
description: CC version impact analysis and bkit improvement report template
variables:
  - feature: Feature name (cc-version-analysis identifier)
  - date: Creation date (YYYY-MM-DD)
  - author: Author (typically CTO Team + Agent count)
  - from_version: Baseline CC version
  - to_version: Target CC version
  - project: bkit project name
  - version: bkit version
---

# CC v{from_version} → v{to_version} 영향 분석 및 bkit 개선 보고서

> **Status**: ✅ Complete / 🔄 In Progress
>
> **Project**: {project}
> **bkit Version**: {version}
> **Author**: {author}
> **Date**: {date}
> **PDCA Cycle**: #{cycle_number}

---

## Executive Summary

### 1.1 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **분석 대상** | Claude Code CLI v{from_version} → v{to_version} |
| **분석 범위** | 릴리스 N개 (v{from_version} ~ v{to_version}) |
| **시작일** | {start_date} |
| **완료일** | {date} |
| **기간** | {duration} |

### 1.2 성과 요약

```
┌──────────────────────────────────────────────┐
│  분석 완료율: 100%                            │
├──────────────────────────────────────────────┤
│  📊 총 변경사항:  N건                         │
│  🔴 HIGH 영향:    N건                         │
│  🟡 MEDIUM 영향:  N건                         │
│  🟢 LOW 영향:     N건                         │
│  🆕 ENH 기회:     N건 (ENH-N ~ ENH-N)        │
│  ✅ 연속 호환:    N+M 릴리스                  │
└──────────────────────────────────────────────┘
```

### 1.3 전달된 가치

| 관점 | 내용 |
|------|------|
| **문제** | CC CLI v{to_version} 업그레이드에 따른 bkit 호환성 및 개선 기회 파악 필요 |
| **해결 방법** | 체계적 3-Phase 분석 (조사 → 영향 분석 → 브레인스토밍) |
| **기능/UX 효과** | {specific effects} |
| **핵심 가치** | {core value delivered} |

---

## 2. 관련 문서

| Phase | 문서 | 상태 |
|-------|------|------|
| Research | CC 버전 변경사항 조사 | ✅ / 🔄 |
| Impact | bkit 영향 분석 | ✅ / 🔄 |
| Plan | [{feature}.plan.md](../01-plan/features/{feature}.plan.md) | ✅ / 🔄 |
| Report | 본 문서 | 🔄 작성 완료 |

---

## 3. CC 버전 변경사항 조사

### 3.1 릴리스 요약

| 버전 | 릴리스일 | 주요 변경 | 변경 수 |
|------|---------|----------|---------|
| v{version_N} | YYYY-MM-DD | {summary} | N |

### 3.2 Breaking Changes

| 변경사항 | 영향도 | bkit 영향 | 마이그레이션 필요 |
|---------|--------|----------|-----------------|

### 3.3 신규 기능

| 기능 | 설명 | bkit ENH 기회 |
|------|------|--------------|

### 3.4 버그 수정

| 이슈 | 설명 | bkit 영향 |
|------|------|----------|

### 3.5 시스템 프롬프트 변경

| 항목 | 변경 전 | 변경 후 | 토큰 변화 |
|------|--------|--------|----------|

### 3.6 Hook 이벤트 변경

| 이벤트 | 상태 | bkit 사용 여부 |
|--------|------|---------------|

---

## 4. bkit 영향 분석

### 4.1 영향 요약

| 카테고리 | 건수 | HIGH | MEDIUM | LOW |
|---------|------|------|--------|-----|
| Breaking | N | N | N | N |
| Enhancement | N | N | N | N |
| Neutral | N | N | N | N |

### 4.2 ENH 기회 목록

| ENH | Priority | CC 기능 | bkit 영향 | 영향 파일 |
|-----|----------|--------|----------|----------|
| ENH-{N} | P{0-3} | {feature} | {impact} | {files} |

### 4.3 파일 영향 매트릭스

| 파일 | 변경 유형 | ENH 참조 | 테스트 영향 |
|------|----------|----------|-----------|

### 4.4 철학 준수 검증

| ENH | Automation First | No Guessing | Docs=Code | 판정 |
|-----|-----------------|-------------|-----------|------|

---

## 5. 호환성 평가

### 5.1 호환성 매트릭스

| CC 버전 | bkit 호환 | 테스트 결과 | 비고 |
|---------|----------|-----------|------|

### 5.2 연속 호환 릴리스

```
v2.1.34 ──────────────────────────── v{to_version}
         {N}개 연속 호환 릴리스
         Breaking Changes: 0건
```

### 5.3 추천 CC 버전

- **최소**: v{min_version}
- **추천**: v{recommended_version}
- **최적**: v{optimal_version}

---

## 6. 브레인스토밍 결과 (Plan Plus)

### 6.1 의도 탐색

| 질문 | 답변 |
|------|------|
| 이 업그레이드의 핵심 목표는? | {answer} |
| 가장 큰 리스크는? | {answer} |
| 놓치기 쉬운 기회는? | {answer} |

### 6.2 대안 탐색

| 접근법 | 장점 | 단점 | 선택 |
|--------|------|------|------|

### 6.3 YAGNI 검토

| ENH | 필요성 | 판정 | 근거 |
|-----|--------|------|------|

---

## 7. 구현 제안

### 7.1 우선순위별 구현 로드맵

#### P0 (즉시 구현)
| ENH | 설명 | 예상 작업량 |
|-----|------|-----------|

#### P1 (이번 사이클)
| ENH | 설명 | 예상 작업량 |
|-----|------|-----------|

#### P2 (다음 사이클)
| ENH | 설명 | 예상 작업량 |
|-----|------|-----------|

#### P3 (백로그)
| ENH | 설명 | 비고 |
|-----|------|------|

### 7.2 테스트 계획

| ENH | 테스트 유형 | 대상 파일 | TC 수 |
|-----|-----------|----------|-------|

---

## 8. GitHub Issues 모니터링

### 8.1 관련 Open Issues

| Issue # | 제목 | 영향도 | bkit 대응 |
|---------|------|--------|----------|

### 8.2 관련 Closed Issues (이번 버전)

| Issue # | 제목 | 해결 버전 | bkit 영향 |
|---------|------|----------|----------|

---

## 9. 결론 (Verdict)

### 9.1 최종 판정

- **호환성**: ✅ PASS / ❌ FAIL
- **업그레이드 권장**: YES / NO / CONDITIONAL
- **bkit 버전 업데이트 필요**: YES (v{next_version}) / NO

### 9.2 핵심 권고사항

1. {recommendation_1}
2. {recommendation_2}
3. {recommendation_3}

### 9.3 다음 단계

- [ ] ENH P0 항목 즉시 구현
- [ ] bkit.config.json CC 추천 버전 업데이트
- [ ] MEMORY.md CC 버전 히스토리 업데이트
- [ ] 연속 호환 릴리스 카운트 업데이트
