---
description: Guide to next Pipeline phase
---

# Pipeline 다음 단계

현재 Phase를 분석하고 다음으로 해야 할 작업을 안내합니다.

## 실행 내용

1. **현재 Phase 파악**
   - 진행 중인 Phase 확인
   - Phase 내 완료/미완료 항목 확인

2. **다음 작업 결정**
   - 현재 Phase가 완료되지 않았으면: 남은 작업 안내
   - 현재 Phase가 완료되었으면: 다음 Phase 안내

3. **구체적 가이드 제공**
   - 다음에 해야 할 구체적인 작업
   - 관련 템플릿 안내
   - PDCA 적용 방법

## 출력 형식

### Phase 진행 중일 때
```
🔄 현재: Phase 4 - API 설계/구현

완료한 것:
- [x] API 명세 작성 (docs/02-design/api-spec.md)

다음 할 일:
→ API 구현 시작

가이드:
1. Phase 1에서 정의한 스키마를 기반으로 API 구현
2. 컨벤션(Phase 2)을 따라 코드 작성
3. 완료 후 Zero Script QA 실행

시작할까요?
```

### Phase 완료 후
```
✅ Phase 4 완료!

완료한 것:
- [x] API 명세 작성
- [x] API 구현
- [x] Zero Script QA

다음: Phase 5 - 디자인 시스템

Phase 5에서는:
- shadcn/ui 컴포넌트 설치
- 디자인 토큰 정의
- 기본 컴포넌트 구성

Phase 5를 시작할까요?
```

## 참조

- `.claude/skills/phase-*/`: Phase별 상세 가이드
- `.claude/templates/pipeline/`: Phase별 템플릿
- `.claude/agents/pipeline-guide.md`: 가이드 에이전트
