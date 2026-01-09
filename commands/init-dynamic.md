---
description: Initialize Dynamic level project (bkend.ai BaaS fullstack)
allowed-tools: ["Read", "Write", "Bash", "Glob"]
---

# Dynamic 프로젝트 초기화

## 수행 작업

1. **프로젝트 구조 확인**
   - package.json 확인 (React/Next.js)
   - .mcp.json 또는 bkend 설정 확인

2. **PDCA 문서 폴더 생성**
   ```
   docs/
   ├── 01-plan/
   │   ├── _INDEX.md
   │   ├── requirements.md
   │   └── features/
   ├── 02-design/
   │   ├── _INDEX.md
   │   ├── data-model.md      # bkend.ai 컬렉션 설계
   │   ├── api-spec.md        # API 엔드포인트 명세
   │   └── features/
   ├── 03-analysis/
   │   ├── _INDEX.md
   │   └── gap-analysis/
   └── 04-report/
       ├── _INDEX.md
       └── changelog.md
   ```

3. **Dynamic 레벨 특화 설정**
   - data-model.md 템플릿 생성 (bkend.ai 컬렉션 구조)
   - 인증 플로우 문서 템플릿

4. **MCP 설정 확인**
   - .mcp.json 파일 확인
   - bkend.ai MCP 서버 설정 안내

## 실행 조건

- Next.js 또는 React 프로젝트 필수
- bkend.ai 프로젝트 ID 필요 (없으면 안내)

## 다음 단계 안내

```
✅ Dynamic 프로젝트가 초기화되었습니다!

다음 단계:
1. docs/02-design/data-model.md에 컬렉션 정의
2. /pdca-plan [기능명] - 기능 계획 작성
3. 또는 기능 요청 시 자동 PDCA 적용

💡 Tip: bkend.ai 대시보드에서 프로젝트 설정을 확인하세요.
```
