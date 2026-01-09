---
name: phase-4-api
description: |
  Skill for designing and implementing backend APIs.
  Includes Zero Script QA methodology for validating APIs without test scripts.

  Triggers: API design, REST API, backend, endpoint, API 설계, API設計, API设计
agent: qa-monitor
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
user-invocable: false
---

# Phase 4: API 설계/구현 + Zero Script QA

> 백엔드 API 구현 및 스크립트 없는 QA

## 목적

데이터를 저장하고 불러올 수 있는 백엔드 API를 구현합니다. 테스트 스크립트 대신 구조화된 로그로 검증합니다.

## 이 Phase에서 하는 것

1. **API 설계**: 엔드포인트, 요청/응답 정의
2. **API 구현**: 실제 백엔드 코드 작성
3. **Zero Script QA**: 로그 기반 검증

## 산출물

```
docs/02-design/
└── api-spec.md             # API 명세

src/api/                    # API 구현
├── routes/
├── controllers/
└── services/

docs/03-analysis/
└── api-qa.md               # QA 결과
```

## PDCA 적용

- **Plan**: 필요 API 목록 정의
- **Design**: 엔드포인트, 요청/응답 설계
- **Do**: API 구현
- **Check**: Zero Script QA로 검증
- **Act**: 버그 수정 후 Phase 5로

## 레벨별 적용

| 레벨 | 적용 방식 |
|------|----------|
| Starter | 이 Phase 생략 (API 없음) |
| Dynamic | bkend.ai BaaS 활용 |
| Enterprise | 직접 API 구현 |

## Zero Script QA란?

```
테스트 스크립트 작성 대신, 구조화된 디버그 로그로 검증

[API] POST /api/users
[INPUT] { "email": "test@test.com", "name": "테스트" }
[PROCESS] 이메일 중복 체크 → 통과
[PROCESS] 비밀번호 해시 → 완료
[PROCESS] DB 저장 → 성공
[OUTPUT] { "id": 1, "email": "test@test.com" }
[RESULT] ✅ 성공

장점:
- 테스트 코드 작성 시간 절약
- 실제 동작을 눈으로 확인
- 디버깅이 용이
```

## RESTful API 원칙

### REST란?

**RE**presentational **S**tate **T**ransfer의 약자로, 웹 서비스 설계를 위한 아키텍처 스타일입니다.

### 6가지 핵심 원칙

| 원칙 | 설명 | 예시 |
|------|------|------|
| **1. Client-Server** | 클라이언트와 서버의 관심사 분리 | UI ↔ 데이터 저장 분리 |
| **2. Stateless** | 각 요청은 독립적, 서버는 클라이언트 상태 저장 안 함 | 요청마다 인증 토큰 포함 |
| **3. Cacheable** | 응답은 캐시 가능 여부를 명시 | `Cache-Control` 헤더 |
| **4. Uniform Interface** | 일관된 인터페이스로 상호작용 | 아래 상세 설명 |
| **5. Layered System** | 계층화된 시스템 구조 허용 | 로드밸런서, 프록시 |
| **6. Code on Demand** | (선택) 서버가 클라이언트에 코드 전송 가능 | JavaScript 전송 |

### Uniform Interface 상세

RESTful API의 핵심은 **일관된 인터페이스**입니다.

#### 1. 리소스 기반 URL

```
✅ Good (명사, 복수형)
GET    /users          # 사용자 목록
GET    /users/123      # 특정 사용자
POST   /users          # 사용자 생성
PUT    /users/123      # 사용자 수정
DELETE /users/123      # 사용자 삭제

❌ Bad (동사 사용)
GET    /getUsers
POST   /createUser
POST   /deleteUser/123
```

#### 2. HTTP 메서드의 의미

| 메서드 | 용도 | 멱등성 | 안전 |
|--------|------|:------:|:----:|
| `GET` | 조회 | ✅ | ✅ |
| `POST` | 생성 | ❌ | ❌ |
| `PUT` | 전체 수정 | ✅ | ❌ |
| `PATCH` | 부분 수정 | ❌ | ❌ |
| `DELETE` | 삭제 | ✅ | ❌ |

> **멱등성**: 같은 요청을 여러 번 해도 결과가 동일
> **안전**: 서버 상태를 변경하지 않음

#### 3. HTTP 상태 코드

```
2xx 성공
├── 200 OK              # 성공 (조회, 수정)
├── 201 Created         # 생성 성공
└── 204 No Content      # 성공하지만 응답 본문 없음 (삭제)

4xx 클라이언트 오류
├── 400 Bad Request     # 잘못된 요청 (유효성 실패)
├── 401 Unauthorized    # 인증 필요
├── 403 Forbidden       # 권한 없음
├── 404 Not Found       # 리소스 없음
└── 409 Conflict        # 충돌 (중복 등)

5xx 서버 오류
├── 500 Internal Error  # 서버 내부 오류
└── 503 Service Unavailable  # 서비스 불가
```

#### 4. 일관된 응답 형식

```json
// 성공 응답
{
  "data": {
    "id": 123,
    "email": "user@example.com",
    "name": "홍길동"
  },
  "meta": {
    "timestamp": "2026-01-08T10:00:00Z"
  }
}

// 에러 응답
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "이메일 형식이 올바르지 않습니다.",
    "details": [
      { "field": "email", "message": "유효한 이메일을 입력하세요" }
    ]
  }
}

// 목록 응답 (페이지네이션)
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### URL 설계 규칙

```
1. 소문자 사용
   ✅ /users/123/orders
   ❌ /Users/123/Orders

2. 하이픈(-) 사용, 언더스코어(_) 지양
   ✅ /user-profiles
   ❌ /user_profiles

3. 계층 관계 표현
   ✅ /users/123/orders/456

4. 필터링은 쿼리 파라미터
   ✅ /users?status=active&sort=created_at
   ❌ /users/active/sort/created_at

5. 버전 관리
   ✅ /api/v1/users
   ✅ Header: Accept: application/vnd.api+json;version=1
```

### API 문서화 도구

| 도구 | 특징 |
|------|------|
| **OpenAPI (Swagger)** | 산업 표준, 자동 문서 생성 |
| **Postman** | 테스트 + 문서화 |
| **Insomnia** | 가벼운 API 클라이언트 |

---

## API 설계 체크리스트

- [ ] **RESTful 원칙 준수**
  - [ ] 리소스 기반 URL (명사, 복수형)
  - [ ] 적절한 HTTP 메서드 사용
  - [ ] 올바른 상태 코드 반환
- [ ] 에러 응답 형식 통일
- [ ] 인증/인가 방식 정의
- [ ] 페이지네이션 방식 정의
- [ ] 버전 관리 방식 (선택)

## 템플릿

- `templates/pipeline/phase-4-api.template.md`
- `templates/pipeline/zero-script-qa.template.md`

## 다음 Phase

Phase 5: 디자인 시스템 → API가 준비됐으니 UI 컴포넌트 구축
