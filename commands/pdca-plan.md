---
description: Generate Plan phase document (feature planning)
allowed-tools: ["Read", "Write", "Glob"]
---

# Plan 문서 생성

$ARGUMENTS로 기능명을 받습니다. (예: /pdca-plan login)

## 수행 작업

1. **기존 문서 확인**
   - docs/01-plan/features/{feature}.plan.md 존재 여부
   - 이미 있으면 업데이트 여부 확인

2. **템플릿 적용**
   - .claude/templates/plan.template.md 사용
   - 변수 치환:
     - `{feature}` → $ARGUMENTS
     - `{date}` → 오늘 날짜
     - `{author}` → 사용자 (또는 빈칸)

3. **문서 생성**
   - docs/01-plan/features/{feature}.plan.md 생성
   - _INDEX.md 업데이트

4. **다음 단계 안내**

## 사용 예시

```
/pdca-plan login          # 로그인 기능 계획서
/pdca-plan user-profile   # 사용자 프로필 기능 계획서
/pdca-plan checkout       # 결제 기능 계획서
```

## 출력 예시

```
✅ Plan 문서가 생성되었습니다!

📄 생성된 파일:
   docs/01-plan/features/login.plan.md

📝 다음 단계:
   1. 계획서의 목표, 범위, 요구사항 섹션을 작성하세요
   2. 완료 후 /pdca-design login 으로 설계 단계로 진행
   3. 또는 "로그인 기능 설계해줘"라고 요청하면 자동 진행됩니다

💡 Tip: 계획서는 "왜" 이 기능이 필요한지에 집중하세요.
```

## 주의사항

- 기능명은 영문 kebab-case 권장 (login, user-profile)
- 이미 존재하는 경우 덮어쓰지 않음
- Plan 없이 Design이나 구현 요청 시 자동으로 Plan 먼저 생성
