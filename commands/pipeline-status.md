---
description: Check current Development Pipeline progress status
---

# Pipeline 상태 확인

현재 프로젝트의 Development Pipeline 진행 상태를 분석합니다.

## 실행 내용

1. **프로젝트 분석**
   - 레벨 감지: Starter / Dynamic / Enterprise
   - 폴더 구조 확인
   - 산출물 존재 여부 확인

2. **Phase별 완료 상태 확인**
   - Phase 1: `docs/01-plan/schema.md`, `terminology.md` 존재?
   - Phase 2: `CONVENTIONS.md` 존재?
   - Phase 3: `mockup/` 폴더 존재?
   - Phase 4: `docs/02-design/api-spec.md` 존재?
   - Phase 5: `components/ui/` 존재?
   - Phase 6: `src/pages/` 또는 `app/` 존재?
   - Phase 7: SEO/보안 설정 확인
   - Phase 8: 리뷰 문서 존재?
   - Phase 9: 배포 완료?

3. **현재 Phase 및 다음 작업 안내**
   - 현재 진행 중인 Phase
   - 완료된 Phase 목록
   - 다음으로 해야 할 작업

## 출력 형식

```
📊 Pipeline 현황

프로젝트 레벨: Dynamic
현재 Phase: Phase 4 (API 설계/구현)

완료된 Phase:
✅ Phase 1: 스키마/용어 정의
✅ Phase 2: 코딩 컨벤션
✅ Phase 3: 목업 개발

진행 중:
🔄 Phase 4: API 설계/구현
   - [x] API 명세 작성
   - [ ] API 구현
   - [ ] Zero Script QA

남은 Phase:
⬜ Phase 5: 디자인 시스템
⬜ Phase 6: UI 구현 + API 연동
⬜ Phase 7: SEO/보안
⬜ Phase 8: 리뷰
⬜ Phase 9: 배포
```

## 참조

- `.claude/skills/development-pipeline/`: Pipeline 지식
- `.claude/skills/phase-*/`: Phase별 완료 기준
