---
description: Run Check phase (design-implementation gap analysis)
allowed-tools: ["Read", "Write", "Glob", "Grep", "LSP", "Task"]
---

# Gap 분석 실행

$ARGUMENTS로 기능명을 받습니다. (예: /pdca-analyze login)

## 수행 작업

1. **설계 문서 읽기**
   - docs/02-design/features/{feature}.design.md
   - API 엔드포인트, 데이터 모델, 컴포넌트 목록 추출

2. **구현 코드 분석**
   - src/features/{feature}/ 또는 관련 경로 탐색
   - 실제 구현된 API, 모델, 컴포넌트 추출

3. **Gap 분석 수행**
   - 설계 vs 구현 비교
   - 일치/미구현/설계누락 분류

4. **코드 품질 분석** (선택)
   - 복잡도 체크
   - 보안 이슈 스캔
   - 코드 스멜 탐지

5. **분석 보고서 생성**
   - docs/03-analysis/{feature}.analysis.md 생성
   - 일치율, 이슈 목록, 권장 조치 포함

## 사용 예시

```
/pdca-analyze login           # 로그인 기능 분석
/pdca-analyze login --full    # 전체 분석 (품질+보안 포함)
/pdca-analyze all             # 모든 기능 일괄 분석
```

## 출력 예시

```
🔍 Gap 분석 완료: login

┌─────────────────────────────────────────────┐
│  분석 결과 요약                              │
├─────────────────────────────────────────────┤
│  설계-구현 일치율: 85%                       │
│                                             │
│  ✅ 일치:      17 항목                       │
│  ⚠️ 설계 누락:  2 항목 (구현에만 존재)        │
│  ❌ 미구현:     1 항목 (설계에만 존재)        │
└─────────────────────────────────────────────┘

📋 주요 발견사항:
   1. POST /api/auth/social - 설계에 없음 (추가 필요)
   2. DELETE /api/auth/logout - 미구현 (구현 필요)

📄 상세 보고서:
   docs/03-analysis/login.analysis.md

📝 다음 단계:
   1. Critical 이슈부터 수정
   2. 설계 문서 업데이트 (설계 누락 항목)
   3. /pdca-report login 으로 완료 보고서 작성
```

## 분석 항목

### 기본 분석
- API 엔드포인트 일치
- 데이터 모델 필드 일치
- 컴포넌트 구조 일치

### 확장 분석 (--full)
- 코드 복잡도
- 보안 취약점 (하드코딩된 시크릿, 입력 검증 등)
- 테스트 커버리지
- 성능 이슈 (N+1 쿼리 등)

## 주의사항

- 설계 문서가 없으면 분석 불가 (설계 먼저 작성)
- 대규모 분석은 Task 에이전트 활용
- 분석 결과는 참고용, 최종 판단은 사람이
