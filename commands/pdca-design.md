---
description: Generate Design phase document (feature design)
allowed-tools: ["Read", "Write", "Glob"]
---

# Design 문서 생성

$ARGUMENTS로 기능명을 받습니다. (예: /pdca-design login)

## 수행 작업

1. **Plan 문서 확인**
   - docs/01-plan/features/{feature}.plan.md 존재 확인
   - 없으면 먼저 Plan 생성 안내

2. **기존 Design 확인**
   - docs/02-design/features/{feature}.design.md 존재 여부
   - 이미 있으면 업데이트 여부 확인

3. **Plan 내용 참조**
   - 요구사항, 범위 등 Plan에서 가져오기
   - 설계서에 자동 반영

4. **템플릿 적용**
   - .claude/templates/design.template.md 사용
   - 변수 치환 및 Plan 연결

5. **문서 생성**
   - docs/02-design/features/{feature}.design.md 생성
   - _INDEX.md 업데이트

## 사용 예시

```
/pdca-design login          # 로그인 기능 설계서
/pdca-design user-profile   # 사용자 프로필 기능 설계서
```

## 출력 예시

```
✅ Design 문서가 생성되었습니다!

📄 생성된 파일:
   docs/02-design/features/login.design.md

🔗 연결된 Plan:
   docs/01-plan/features/login.plan.md

📝 다음 단계:
   1. 아키텍처, 데이터 모델, API 명세 섹션을 작성하세요
   2. 설계 완료 후 구현을 요청하세요
   3. 구현 완료 후 /pdca-analyze login 으로 분석

💡 Tip: 설계서는 "어떻게" 구현할지에 집중하세요.
        코드 작성 전에 설계를 완료하면 효율이 높아집니다.
```

## 자동 포함 섹션

레벨에 따라 자동으로 섹션 추가:

| 섹션 | Starter | Dynamic | Enterprise |
|------|---------|---------|------------|
| 아키텍처 | ✅ | ✅ | ✅ |
| 데이터 모델 | 선택 | ✅ | ✅ |
| API 명세 | - | ✅ | ✅ |
| 인프라 | - | - | ✅ |
| 보안 | - | 선택 | ✅ |

## 주의사항

- Plan 없이 Design 생성 시 경고 (Plan 먼저 권장)
- 설계 문서 없이 구현하면 나중에 Gap 분석이 어려움
