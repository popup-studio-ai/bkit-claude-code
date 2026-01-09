---
name: development-pipeline
description: |
  9-phase Development Pipeline complete knowledge.
  Use when user doesn't know development order or starts a new project from scratch.

  Triggers: development pipeline, phase, development order, 개발 파이프라인, 開発パイプライン, 开发流程
agent: pipeline-guide
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - TodoWrite
user-invocable: true
---

# Development Pipeline 스킬

> 9단계 개발 파이프라인 전체 지식

## 언제 사용되는가

- 사용자가 "개발 경험이 적다"고 표현했을 때
- `/pipeline-*` 명령어 사용 시
- "개발 어떻게 시작해요?", "순서가 어떻게 돼요?" 질문 시
- 새 프로젝트를 처음부터 개발할 때

## 선택적 적용 원칙

```
이 스킬은 강제가 아닌 선택입니다.

활성화 조건:
- 비개발자/초보 개발자가 개발 시작할 때
- 사용자가 명시적으로 가이드 요청 시
- /pipeline-start 명령어 사용 시

비활성화 조건:
- 숙련 개발자가 "자유롭게 진행"하겠다고 할 때
- 비개발 AI 작업 (문서, 분석 등)
- 기존 프로젝트 유지보수/버그 수정
```

## 9단계 파이프라인 개요

```
Phase 1: 스키마/용어 정의 ──→ 데이터 구조와 도메인 용어 정의
Phase 2: 코딩 컨벤션 ───────→ 코드 작성 규칙 정의
Phase 3: 목업 개발 ─────────→ HTML/CSS/JS + JSON으로 기능 검증
Phase 4: API 설계/구현 ─────→ 백엔드 API + Zero Script QA
Phase 5: 디자인 시스템 ─────→ 컴포넌트 시스템 구축
Phase 6: UI 구현 + 연동 ────→ 실제 UI 구현 및 API 연동
Phase 7: SEO/보안 ──────────→ 검색 최적화 및 보안 강화
Phase 8: 리뷰 ──────────────→ 아키텍처/컨벤션 품질 검증
Phase 9: 배포 ──────────────→ 프로덕션 배포
```

## PDCA와의 관계 (핵심)

```
❌ 잘못된 이해: Pipeline 전체를 PDCA에 매핑
❌ (Plan=Phase1-3, Do=Phase4-6, Check=Phase7-8, Act=Phase9)

✅ 올바른 이해: 각 Phase마다 PDCA 사이클을 돈다

Phase N
├── Plan: 이번 Phase에서 할 일 계획
├── Design: 구체적 설계
├── Do: 실행/구현
├── Check: 검증/리뷰
└── Act: 확정 후 다음 Phase로
```

## 레벨별 Phase 적용

| Phase | Starter | Dynamic | Enterprise |
|-------|---------|---------|------------|
| 1. 스키마/용어 | 간단 | 상세 | 상세 |
| 2. 컨벤션 | 기본 | 확장 | 확장 |
| 3. 목업 | O | O | O |
| 4. API | - | bkend.ai | 직접 구현 |
| 5. 디자인 시스템 | 선택 | O | O |
| 6. UI + API | 정적 UI | 연동 | 연동 |
| 7. SEO/보안 | SEO만 | O | O |
| 8. 리뷰 | - | O | O |
| 9. 배포 | 정적 호스팅 | Vercel 등 | K8s |

### Starter 레벨 흐름
```
Phase 1 → 2 → 3 → 5(선택) → 6(정적) → 7(SEO) → 9
```

### Dynamic 레벨 흐름
```
Phase 1 → 2 → 3 → 4(bkend.ai) → 5 → 6 → 7 → 8 → 9
```

### Enterprise 레벨 흐름
```
Phase 1 → 2 → 3 → 4(직접구현) → 5 → 6 → 7 → 8 → 9
```

## Phase별 산출물 요약

| Phase | 주요 산출물 |
|-------|-----------|
| 1 | `docs/01-plan/schema.md`, `terminology.md` |
| 2 | `CONVENTIONS.md`, `docs/01-plan/naming.md` |
| 3 | `mockup/` 폴더, `docs/02-design/mockup-spec.md` |
| 4 | `docs/02-design/api-spec.md`, `src/api/` |
| 5 | `components/ui/`, `docs/02-design/design-system.md` |
| 6 | `src/pages/`, `src/features/` |
| 7 | `docs/02-design/seo-spec.md`, `security-spec.md` |
| 8 | `docs/03-analysis/architecture-review.md` |
| 9 | `docs/04-report/deployment-report.md` |

## 참조 스킬

- `phase-1-schema/` ~ `phase-9-deployment/`: Phase별 상세 가이드
- `pdca-methodology/`: PDCA 적용 방법
- `starter/`, `dynamic/`, `enterprise/`: 레벨별 특화 지식
