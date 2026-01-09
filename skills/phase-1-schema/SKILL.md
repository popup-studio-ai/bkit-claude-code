---
name: phase-1-schema
description: |
  Skill for defining terminology and data structures used throughout the project.
  Covers domain terminology, entities, relationships, and schema design.

  Triggers: schema, terminology, data model, entity, 스키마, 用語, データモデル, 数据模型
agent: pipeline-guide
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
user-invocable: false
---

# Phase 1: 스키마/용어 정의

> 프로젝트 전체에서 사용할 용어와 데이터 구조 정의

## 목적

프로젝트의 언어를 통일합니다. 모든 팀원(또는 AI)이 같은 용어로 소통하고, 데이터 구조를 명확히 이해합니다.

## 이 Phase에서 하는 것

1. **용어 사전 구축**: 비즈니스 용어 + 글로벌 표준 매핑
2. **엔티티 식별**: 어떤 "것들"이 있는지 파악
3. **관계 정의**: 엔티티 간의 관계
4. **스키마 설계**: 데이터 구조 정의

## 용어 사전 (Glossary)

### 왜 필요한가?

Claude Code에게 **매번 비즈니스 용어를 설명하는 것은 번거롭습니다**.
용어 사전을 만들어두면:
- Claude가 자동으로 참조하여 컨텍스트 이해
- 팀 내 소통 일관성 확보
- 신규 팀원/AI 온보딩 시간 단축

### 용어 분류

| 분류 | 설명 | 예시 |
|------|------|------|
| **비즈니스 용어** | 내부에서만 사용하는 고유 용어 | "캐디" (골프 예약 도우미) |
| **글로벌 표준** | 업계 공통 또는 기술 표준 용어 | "OAuth", "REST API" |
| **매핑** | 비즈니스 ↔ 글로벌 대응 | "회원" = User, "결제" = Payment |

### 용어 사전 템플릿

```markdown
## 비즈니스 용어 (Internal Terms)

| 용어 | 영문 | 정의 | 글로벌 표준 매핑 |
|------|------|------|-----------------|
| 캐디 | Caddy | 골프 라운드 예약을 도와주는 AI 어시스턴트 | Booking Assistant |
| 라운드 | Round | 18홀 골프 플레이 1회 | Session, Booking |
| 그린피 | Green Fee | 골프장 이용 요금 | Usage Fee |

## 글로벌 표준 (Global Standards)

| 용어 | 정의 | 참조 |
|------|------|------|
| OAuth 2.0 | 인증 프로토콜 | RFC 6749 |
| REST | API 아키텍처 스타일 | - |
| UUID | 범용 고유 식별자 | RFC 4122 |

## 용어 사용 규칙

1. 코드에서는 **영문** 사용 (`Caddy`, `Round`)
2. UI/문서에서는 **한글** 사용 (캐디, 라운드)
3. API 응답은 **글로벌 표준** 우선 (`booking_assistant`)
```

### Claude Code 자동 참조 설정

용어 사전을 Claude가 자동 참조하도록 하려면:

**방법 1**: CLAUDE.md에 포함
```markdown
## 용어 참조
이 프로젝트의 용어 정의는 `docs/01-plan/glossary.md`를 참조하세요.
```

**방법 2**: .claude/rules/에 용어 규칙 추가
```markdown
<!-- .claude/rules/terminology.md -->
프로젝트 용어는 docs/01-plan/glossary.md에 정의되어 있습니다.
비즈니스 용어 사용 시 반드시 참조하세요.
```

## 산출물

```
docs/01-plan/
├── glossary.md         # 용어 사전 (신규 권장)
│   ├── 비즈니스 용어
│   ├── 글로벌 표준
│   └── 매핑 테이블
├── schema.md           # 데이터 스키마
├── terminology.md      # (기존) → glossary.md로 통합 권장
└── domain-model.md     # 도메인 모델
```

## PDCA 적용

- **Plan**: 어떤 엔티티/용어가 필요한지 파악
- **Design**: 스키마 구조, 관계 설계
- **Do**: 문서 작성
- **Check**: 누락/모순 검토
- **Act**: 확정 후 Phase 2로

## 레벨별 적용

| 레벨 | 적용 수준 |
|------|----------|
| Starter | 간단 (핵심 용어만) |
| Dynamic | 상세 (전체 엔티티) |
| Enterprise | 상세 (마이크로서비스별) |

## 예시 질문

```
"이 프로젝트에서 다루는 핵심 '것'들이 뭐예요?"
"사용자, 상품, 주문... 이런 것들 사이의 관계는?"
"'회원'과 '사용자'는 같은 건가요 다른 건가요?"
```

## 템플릿

`templates/pipeline/phase-1-schema.template.md` 참조

## 다음 Phase

Phase 2: 코딩 컨벤션 → 용어가 정해졌으니 코드 규칙 정의
