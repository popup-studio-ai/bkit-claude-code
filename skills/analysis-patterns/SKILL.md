---
name: analysis-patterns
description: |
  Design-implementation gap analysis, code quality analysis, and report writing patterns.
  Used in PDCA Check phase for verification and quality assurance.

  Triggers: gap analysis, code review, quality check, 설계-구현 분석, ギャップ分析, 差距分析
context: fork
agent: code-analyzer
allowed-tools:
  - Read
  - Grep
  - Glob
  - LSP
---

# 분석 패턴 스킬

## 분석 유형

### 1. Gap 분석 (설계-구현 차이)

설계 문서와 실제 구현의 차이를 찾아내는 분석

```markdown
# Gap 분석 보고서

## 분석 대상
- 설계 문서: docs/02-design/login.design.md
- 구현 경로: src/features/auth/

## 분석 항목별 결과

### API 엔드포인트
| 설계 | 구현 | 상태 |
|------|------|------|
| POST /auth/login | POST /auth/login | ✅ 일치 |
| POST /auth/register | - | ❌ 미구현 |
| - | POST /auth/social | ⚠️ 설계 누락 |

### 데이터 모델
| 필드 | 설계 | 구현 | 상태 |
|------|------|------|------|
| email | string | string | ✅ |
| password | string | string | ✅ |
| createdAt | - | Date | ⚠️ 설계 누락 |

## 일치율: 75%

## 권장 조치
1. POST /auth/register 구현 필요
2. 소셜 로그인 설계 문서 추가
3. createdAt 필드 설계에 반영
```

### 2. 코드 품질 분석

코드의 품질, 보안, 성능 이슈를 분석

```markdown
# 코드 품질 분석 보고서

## 분석 범위
- 경로: src/
- 파일 수: 45개
- 총 라인: 3,500줄

## 품질 메트릭

### 복잡도
| 파일 | 함수 | 복잡도 | 상태 |
|------|------|--------|------|
| UserService.ts | processUser | 15 | ⚠️ 높음 |
| utils.ts | formatDate | 3 | ✅ 적정 |

### 코드 스멜
| 유형 | 파일 | 라인 | 설명 |
|------|------|------|------|
| 긴 함수 | api.ts | 45-120 | 75줄 (권장: 50줄 이하) |
| 중복 코드 | helpers.ts | 10, 45 | 동일 로직 반복 |

### 보안 이슈
| 심각도 | 파일 | 이슈 |
|--------|------|------|
| 🔴 High | auth.ts | 하드코딩된 시크릿 |
| 🟡 Medium | api.ts | 입력값 검증 누락 |

## 점수: 72/100

## 개선 권장사항
1. [High] auth.ts의 시크릿을 환경변수로 이동
2. processUser 함수 분리 (SRP 위반)
3. 중복 코드 유틸리티로 추출
```

### 3. 성능 분석

성능 병목 및 최적화 기회 분석

```markdown
# 성능 분석 보고서

## 분석 대상
- 기능: 상품 목록 조회
- 엔드포인트: GET /api/products

## 측정 결과

### 응답 시간
| 케이스 | 응답 시간 | 목표 | 상태 |
|--------|----------|------|------|
| 10개 조회 | 50ms | 100ms | ✅ |
| 100개 조회 | 450ms | 200ms | ❌ |
| 1000개 조회 | 4.5s | 500ms | ❌ |

### 병목 분석
1. N+1 쿼리 문제
   - 위치: ProductRepository.findAll()
   - 영향: 상품당 1개 추가 쿼리

2. 인덱스 누락
   - 테이블: products
   - 컬럼: category_id

## 최적화 권장사항
1. Eager Loading으로 N+1 해결
2. category_id에 인덱스 추가
3. 페이지네이션 필수 적용
```

## 분석 체크리스트

### 설계 검증 체크리스트

```
□ 필수 섹션 존재 여부
  □ 개요
  □ 아키텍처
  □ 데이터 모델
  □ API 명세
  □ 에러 처리

□ 일관성
  □ 용어 통일
  □ 네이밍 규칙 준수
  □ 데이터 타입 일관성

□ 완성도
  □ 모든 엔드포인트 정의
  □ 모든 엔티티 정의
  □ 에러 케이스 정의
```

### 코드 분석 체크리스트

```
□ 구조
  □ 아키텍처 패턴 준수
  □ 의존성 방향 올바름
  □ 모듈 분리 적절

□ 품질
  □ 함수 길이 적절 (< 50줄)
  □ 중복 코드 없음
  □ 명명 규칙 준수

□ 보안
  □ 입력값 검증
  □ 하드코딩된 시크릿 없음
  □ SQL Injection 방지
  □ XSS 방지

□ 성능
  □ N+1 쿼리 없음
  □ 적절한 인덱스
  □ 불필요한 리렌더링 없음
```

## 보고서 작성 패턴

### 이슈 분류 기준

```
🔴 Critical (즉시 수정)
- 보안 취약점
- 데이터 손실 가능성
- 서비스 중단 가능성

🟡 Warning (개선 권장)
- 성능 저하
- 유지보수 어려움
- 코드 스멜

🟢 Info (참고)
- 스타일 개선
- 문서화 부족
- 테스트 부족
```

### 권장 조치 형식

```markdown
## 권장 조치

### 즉시 필요 (24시간 내)
1. **[Critical] 보안 취약점 수정**
   - 파일: src/auth.ts:42
   - 내용: API 키를 환경변수로 이동
   - 담당: @developer

### 단기 (1주일 내)
1. **[Warning] 성능 최적화**
   - 파일: src/api/products.ts
   - 내용: N+1 쿼리 해결
   - 예상 효과: 응답 시간 80% 감소

### 장기 (백로그)
1. **[Info] 리팩토링**
   - 파일: src/utils/
   - 내용: 유틸리티 함수 정리
```

## 분석 도구 활용

### Claude Code 도구

```
Read      → 파일 내용 읽기
Glob      → 파일 패턴 검색
Grep      → 코드 내 패턴 검색
LSP       → 정의/참조 추적
Task      → 병렬 분석 실행
```

### 분석 쿼리 예시

```
# 설계 문서 찾기
Glob: docs/**/*.design.md

# 특정 패턴 찾기
Grep: "TODO|FIXME|HACK"

# 하드코딩된 시크릿 찾기
Grep: "api[_-]?key|secret|password"

# 긴 함수 찾기
Grep: "function.*\{" -A 100
```
