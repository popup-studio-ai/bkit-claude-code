---
description: Start the Development Pipeline guide (9-phase development process)
arguments:
  - name: project_type
    description: 프로젝트 유형 (선택사항)
    required: false
---

# Pipeline 시작

Development Pipeline 가이드를 시작합니다.

## 실행 내용

1. **프로젝트 분석**
   - 현재 프로젝트 레벨 감지 (Starter/Dynamic/Enterprise)
   - 기존 진행 상태 확인

2. **사용자 경험 수준 확인**
   - 개발 경험이 적으면: 전체 9단계 가이드
   - 경험이 있으면: 필요한 부분만 가이드
   - 숙련자면: Pipeline 없이 자유롭게 진행

3. **Phase 1부터 시작**
   - 스키마/용어 정의부터 안내
   - 각 Phase마다 PDCA 사이클 적용

## 참조

- `.claude/skills/development-pipeline/`: Pipeline 전체 지식
- `.claude/agents/pipeline-guide.md`: 가이드 에이전트
- `.claude/templates/pipeline/`: Phase별 템플릿

## 주의사항

Pipeline은 **선택적** 가이드입니다.
- 개발 작업에만 적용
- 비개발 AI 작업은 Pipeline 없이 PDCA만 적용
- 숙련자는 자유롭게 건너뛸 수 있음
