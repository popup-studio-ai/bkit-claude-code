---
description: Generate Act phase document (completion report)
allowed-tools: ["Read", "Write", "Glob"]
---

# 완료 보고서 생성

$ARGUMENTS로 기능명을 받습니다. (예: /pdca-report login)

## 수행 작업

1. **관련 문서 수집**
   - docs/01-plan/features/{feature}.plan.md
   - docs/02-design/features/{feature}.design.md
   - docs/03-analysis/{feature}.analysis.md

2. **완료 항목 정리**
   - Plan의 요구사항 vs 실제 구현
   - 완료/미완료/취소 분류

3. **품질 지표 요약**
   - 최종 일치율
   - 해결된 이슈
   - 테스트 커버리지

4. **회고 섹션 준비**
   - Keep (잘한 점) - 자동 제안
   - Problem (개선점) - 분석에서 추출
   - Try (시도할 것) - 권장 사항

5. **보고서 생성**
   - docs/04-report/features/{feature}.report.md
   - _INDEX.md 및 changelog.md 업데이트

## 사용 예시

```
/pdca-report login           # 로그인 기능 완료 보고서
/pdca-report login --draft   # 초안만 생성 (수동 편집 필요)
```

## 출력 예시

```
📊 완료 보고서 생성: login

┌─────────────────────────────────────────────┐
│  PDCA 사이클 완료                            │
├─────────────────────────────────────────────┤
│  기능: 로그인                                │
│  사이클: #1                                  │
│  기간: 2024-12-01 ~ 2024-12-15              │
│  완료율: 95%                                 │
└─────────────────────────────────────────────┘

📋 요약:
   - 완료: 19/20 항목
   - 미완료: 1항목 (다음 사이클로 이관)

📄 생성된 파일:
   docs/04-report/features/login.report.md

📝 보고서에 추가할 내용:
   1. 회고 섹션 (Keep/Problem/Try) 작성
   2. 다음 사이클 계획 검토
   3. 팀 공유

🎉 PDCA 사이클이 완료되었습니다!
   다음 기능을 시작하려면 /pdca-plan [기능명]
```

## 자동 생성 내용

- **결과 요약**: Plan 요구사항 기준 완료율
- **품질 지표**: 최종 분석 결과 요약
- **변경 이력**: 구현된 기능 changelog 형식

## 수동 작성 권장

- **회고 (KPT)**: 개인/팀의 학습 내용
- **다음 단계**: 후속 작업 계획
- **비고**: 특이사항, 기술 부채 등

## 주의사항

- 분석(Check) 완료 후 보고서 작성 권장
- 보고서는 "학습"에 집중 - 다음 사이클 개선의 기반
- 팀 공유용으로 활용 가능
