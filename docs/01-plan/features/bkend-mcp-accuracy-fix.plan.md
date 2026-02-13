# bkend MCP Accuracy Fix Plan

> **Feature**: bkend-mcp-accuracy-fix
> **Target Version**: bkit v1.5.4
> **Level**: Dynamic
> **Date**: 2026-02-14
> **Scope**: bkit plugin (skills, agents, templates, hooks) -- bkend.ai MCP integration accuracy
> **Source of Truth**: https://github.com/popup-studio-ai/bkend-docs (en/mcp/, en/ai-tools/)

---

## 1. Problem Statement

bkit v1.5.2에서 bkend.ai 연동을 위한 5개 스킬 + 1개 에이전트를 추가했으나, **bkend.ai 공식 MCP 문서와 bkit 구현 사이에 10개의 Gap**이 존재한다. 이로 인해 bkit 사용자가 bkend MCP를 사용할 때 **잘못된 도구명 참조, 누락된 도구, 잘못된 URL** 등의 문제를 겪을 수 있다.

### 분석 방법

- **Source of Truth**: `popup-studio-ai/bkend-docs` GitHub 저장소 (en/mcp/ 디렉토리)
- **비교 대상**: bkit skills/bkend-*, agents/bkend-expert.md, templates/shared/bkend-patterns.md
- **검증 범위**: MCP Tool 이름, 파라미터, 카테고리, REST API URL, Live Reference URL, MCP Resources

---

## 2. Gap Analysis Summary

### 심각도 분류

| 심각도 | 개수 | 설명 |
|--------|------|------|
| CRITICAL | 2 | 사용자 기능 장애 직결 |
| HIGH | 3 | 주요 기능 누락 |
| MEDIUM | 3 | 부정확한 정보/URL |
| LOW | 2 | 개선 권장 사항 |

### 전체 Gap 목록

| ID | 심각도 | Gap 설명 | 영향 파일 |
|----|--------|----------|-----------|
| GAP-01 | CRITICAL | Data CRUD MCP 도구 5개 완전 누락 | bkend-data/SKILL.md, bkend-expert.md |
| GAP-02 | CRITICAL | MCP Tool 이름 불일치 (rollback vs version_apply) | bkend-data/SKILL.md, bkend-expert.md |
| GAP-03 | HIGH | Project/Env 관리 MCP 도구 누락 (9개) | bkend-quickstart/SKILL.md, bkend-expert.md |
| GAP-04 | HIGH | `search_docs` Fixed Tool 미문서화 | 전체 bkend 스킬 |
| GAP-05 | HIGH | Guide Tool 이름 불일치 (숫자접두사 vs 실제이름) | bkend-expert.md, 전체 bkend 스킬 |
| GAP-06 | MEDIUM | MCP Resources (bkend:// URI) 미문서화 | 전체 bkend 스킬 |
| GAP-07 | MEDIUM | Live Reference URL 경로 오류 (src/ vs en/) | 전체 bkend 스킬, bkend-expert.md |
| GAP-08 | MEDIUM | REST API Base URL 불일치 | bkend-patterns.md |
| GAP-09 | LOW | Auto System Field ID 불일치 (_id vs id) | bkend-data/SKILL.md |
| GAP-10 | LOW | MCP 감지 Dynamic 레벨 한정 | hooks/session-start.js |

---

## 3. Gap 상세 분석

### GAP-01: Data CRUD MCP 도구 5개 완전 누락 (CRITICAL)

**현상**: bkend 공식 MCP 문서에 Data CRUD 전용 MCP 도구 5개가 있으나, bkit의 bkend-data 스킬과 bkend-expert 에이전트에 **전혀 기재되지 않음**.

**공식 문서 (en/mcp/05-data-tools.md)**:
| MCP Tool | 기능 |
|----------|------|
| `backend_data_list` | 필터링/정렬/페이지네이션 포함 목록 조회 |
| `backend_data_get` | 단일 레코드 조회 |
| `backend_data_create` | 레코드 생성 |
| `backend_data_update` | 레코드 부분 수정 (Partial Update) |
| `backend_data_delete` | 레코드 삭제 |

**bkit 현재 상태**: bkend-data/SKILL.md에는 Table 관리 도구(backend_table_*)만 11개 나열, Data CRUD MCP 도구는 0개.

**영향**: 사용자가 MCP로 데이터 CRUD를 수행하려 할 때, bkit이 REST API만 안내하고 MCP 도구 존재를 모름. **가장 빈번하게 사용되는 핵심 도구 누락.**

**수정 계획**:
- `skills/bkend-data/SKILL.md`: MCP Data CRUD Tools 섹션 추가 (5개 도구 + 파라미터)
- `agents/bkend-expert.md`: API Tools 목록에 Data CRUD 5개 추가 (19 → 24개 이상)

---

### GAP-02: MCP Tool 이름 불일치 (CRITICAL)

**현상**: bkit이 사용하는 도구 이름이 공식 MCP 문서와 다름.

| bkit 현재 이름 | 공식 문서 이름 | 비고 |
|---------------|--------------|------|
| `backend_schema_rollback` | `backend_schema_version_apply` | 이름 완전 다름 |
| `backend_index_rollback` | 확인 필요 (문서에 명시적 이름 없음) | 이름 다를 가능성 |
| `backend_table_update` | 공식 문서에 없음 | 존재 여부 확인 필요 |

**영향**: bkit 에이전트가 잘못된 이름으로 MCP 도구를 호출하면 실패함.

**수정 계획**:
- 공식 MCP endpoint에서 실제 도구 이름 확인 (`get_operation_schema` 활용)
- bkend-data/SKILL.md, bkend-expert.md의 도구 이름 일괄 수정
- 스키마 버전 관련: `backend_schema_version_list`, `backend_schema_version_get`, `backend_schema_version_apply`
- 인덱스 버전 관련: `backend_index_version_list`, `backend_index_version_get`

---

### GAP-03: Project/Environment 관리 MCP 도구 누락 (HIGH)

**현상**: bkend 공식 문서 (en/mcp/03-project-tools.md)에 9개의 프로젝트/환경 관리 도구가 있으나 bkit에 미기재.

**공식 문서의 Project Tools**:
| MCP Tool | 기능 |
|----------|------|
| `backend_org_list` | 조직 목록 조회 |
| `backend_project_list` | 프로젝트 목록 |
| `backend_project_get` | 프로젝트 상세 |
| `backend_project_create` | 프로젝트 생성 |
| `backend_project_update` | 프로젝트 수정 |
| `backend_project_delete` | 프로젝트 삭제 |
| `backend_env_list` | 환경 목록 |
| `backend_env_get` | 환경 상세 |
| `backend_env_create` | 환경 생성 |

**bkit 현재 상태**: `0_get_context`로 조직/프로젝트 정보를 얻는 것만 안내. 전용 관리 도구 미기재.

**수정 계획**:
- `skills/bkend-quickstart/SKILL.md`: MCP Project Tools 섹션 추가 (9개)
- `agents/bkend-expert.md`: Project Management MCP Tools 카테고리 추가

---

### GAP-04: `search_docs` Fixed Tool 미문서화 (HIGH)

**현상**: bkend MCP의 3개 Fixed Tool 중 `search_docs`가 bkit 스킬/에이전트에 전혀 없음.

**공식 Fixed Tools**:
| Tool | bkit 기재 여부 |
|------|--------------|
| `get_context` | O (0_get_context로 기재) |
| `search_docs` | X (완전 누락) |
| `get_operation_schema` | O (5_get_operation_schema로 기재) |

**영향**: Auth와 Storage에는 전용 MCP 도구가 없어 `search_docs`로 문서를 검색한 후 REST API 코드를 생성하는 것이 **유일한 MCP 기반 워크플로우**. 이 도구 누락 시 Auth/Storage의 MCP 활용 불가.

**수정 계획**:
- 전체 bkend 스킬에 `search_docs` 도구 설명 추가
- bkend-auth/SKILL.md, bkend-storage/SKILL.md에 "`search_docs`를 통한 MCP 워크플로우" 패턴 추가
- bkend-expert.md의 Fixed Tools에 `search_docs` 추가

---

### GAP-05: Guide Tool 이름 불일치 (HIGH)

**현상**: bkit은 Guide Tool을 숫자 접두사(`0_get_context`, `1_concepts` 등)로 표기하지만, 공식 문서에서는 이름이 다를 수 있음.

**bkit 기재 (8개)**:
```
0_get_context, 1_concepts, 2_tutorial, 3_howto_implement_auth,
4_howto_implement_data_crud, 5_get_operation_schema,
6_code_examples_auth, 7_code_examples_data
```

**공식 Fixed Tools (3개)**:
```
get_context, search_docs, get_operation_schema
```

**차이**: 공식 문서에서 `1_concepts`, `2_tutorial` 등은 Fixed Tool이 아님. `search_docs`의 검색 결과로 반환되는 **문서 ID**일 가능성이 높음 (예: `3_howto_implement_auth`는 search_docs가 찾는 문서 이름).

**수정 계획**:
- Fixed Tools (항상 사용 가능): `get_context`, `search_docs`, `get_operation_schema` 로 재분류
- Guide Docs (search_docs로 접근): `1_concepts` ~ `7_code_examples_data` 는 "검색 가능 문서"로 재분류
- 카테고리 명확히 구분하여 사용자 혼동 방지

---

### GAP-06: MCP Resources 미문서화 (MEDIUM)

**현상**: bkend MCP는 `bkend://` URI 스키마의 리소스 시스템을 제공하지만, bkit에는 전혀 언급 없음.

**공식 MCP Resources**:
| URI 패턴 | 설명 |
|----------|------|
| `bkend://orgs` | 조직 목록 (읽기 전용) |
| `bkend://orgs/{orgId}/projects` | 프로젝트 목록 |
| `bkend://orgs/{orgId}/projects/{pId}/environments` | 환경 목록 |
| `bkend://orgs/{orgId}/projects/{pId}/environments/{eId}/tables` | 테이블 목록 (스키마 포함) |

**활용**: Resources는 캐싱(TTL 60초) 포함 읽기 전용 조회로, Tools보다 가벼움.

**수정 계획**:
- `templates/shared/bkend-patterns.md`: MCP Resources 섹션 추가
- `skills/bkend-quickstart/SKILL.md`: Resources 사용법 안내 추가
- `agents/bkend-expert.md`: Resources 활용 가이드 추가

---

### GAP-07: Live Reference URL 경로 오류 (MEDIUM)

**현상**: bkit 스킬들의 Live Reference URL이 잘못된 경로를 사용.

| bkit 현재 경로 | 실제 저장소 경로 |
|---------------|----------------|
| `src/getting-started/` | `en/getting-started/` |
| `src/authentication/` | `en/authentication/` |
| `src/database/` | `en/database/` |
| `src/storage/` | `en/storage/` |
| `src/security/` | `en/security/` |
| `src/ai-tools/` | `en/ai-tools/` |
| `src/cookbooks/` | `en/cookbooks/` |
| `src/troubleshooting/` | `en/troubleshooting/` |

**영향**: WebFetch로 Live Reference를 가져올 때 404 에러 발생.

**수정 계획**:
- 전체 bkend 스킬 5개 + bkend-expert 에이전트의 URL을 `src/` → `en/` 로 일괄 수정
- 정확한 파일명 확인 후 직접 파일 URL로 교체 (디렉토리 URL은 GitHub에서 404)

---

### GAP-08: REST API Base URL 불일치 (MEDIUM)

**현상**: bkit의 bkend-patterns.md는 `https://api.bkend.ai/v1`을 Base URL로 사용하지만, 공식 MCP Context 도구 문서에서는 `https://api-client.bkend.ai`를 참조.

| Source | Base URL |
|--------|----------|
| bkit bkend-patterns.md | `https://api.bkend.ai/v1` |
| 공식 MCP Context docs | `https://api-client.bkend.ai` |

**수정 계획**:
- bkend 공식 최신 문서에서 정확한 Service API Base URL 확인
- `templates/shared/bkend-patterns.md` 업데이트
- Context 도구에서 "API endpoint가 `get_context` 응답에 포함됨"을 명시하여, 하드코딩보다 동적 참조 권장

---

### GAP-09: Auto System Field ID 불일치 (LOW)

**현상**: bkit bkend-data 스킬은 `_id` (MongoDB ObjectId 스타일)로 문서화하지만, 공식 MCP Data Tools 문서는 `id`를 사용하고 명시적으로 "id (NOT _id)" 규칙을 명시.

**수정 계획**:
- `skills/bkend-data/SKILL.md`: `_id` → `id` 로 수정
- `id` 사용 규칙 명시 ("bkend API response uses `id`, not `_id`")

---

### GAP-10: MCP 감지 Dynamic 레벨 한정 (LOW)

**현상**: `hooks/session-start.js`의 bkend MCP 상태 체크가 `detectedLevel === 'Dynamic'` 조건에서만 실행.

**영향**: Enterprise 레벨 프로젝트에서 bkend를 사용하는 경우 MCP 상태가 표시되지 않음.

**수정 계획**:
- 조건을 `detectedLevel === 'Dynamic' || detectedLevel === 'Enterprise'`로 확장

---

## 4. 수정 대상 파일 목록

| 파일 | 수정 유형 | 관련 GAP |
|------|----------|----------|
| `skills/bkend-data/SKILL.md` | 대규모 수정 | GAP-01, 02, 05, 07, 09 |
| `agents/bkend-expert.md` | 대규모 수정 | GAP-01, 02, 03, 04, 05, 06, 07 |
| `skills/bkend-quickstart/SKILL.md` | 중규모 수정 | GAP-03, 05, 06, 07 |
| `skills/bkend-auth/SKILL.md` | 중규모 수정 | GAP-04, 05, 07 |
| `skills/bkend-storage/SKILL.md` | 중규모 수정 | GAP-04, 05, 07 |
| `skills/bkend-cookbook/SKILL.md` | 소규모 수정 | GAP-07 |
| `templates/shared/bkend-patterns.md` | 중규모 수정 | GAP-06, 08 |
| `hooks/session-start.js` | 소규모 수정 | GAP-10 |

**총 8개 파일, 10개 GAP 수정**

---

## 5. 구현 우선순위

### Phase 1: CRITICAL 수정 (GAP-01, GAP-02)
- Data CRUD MCP 도구 5개 추가
- MCP Tool 이름 정확성 검증 및 수정
- **예상 영향 파일**: bkend-data/SKILL.md, bkend-expert.md

### Phase 2: HIGH 수정 (GAP-03, GAP-04, GAP-05)
- Project/Env 관리 도구 9개 추가
- search_docs Fixed Tool 문서화
- Guide Tool vs Fixed Tool 카테고리 재분류
- **예상 영향 파일**: 전체 bkend 스킬 5개 + bkend-expert.md

### Phase 3: MEDIUM 수정 (GAP-06, GAP-07, GAP-08)
- MCP Resources 문서화
- Live Reference URL 경로 수정 (src/ → en/)
- REST API Base URL 검증/수정
- **예상 영향 파일**: 전체 스킬 + templates + bkend-expert.md

### Phase 4: LOW 수정 (GAP-09, GAP-10)
- ID 필드명 수정 (_id → id)
- MCP 감지 레벨 확장
- **예상 영향 파일**: bkend-data/SKILL.md, session-start.js

---

## 6. MCP Tool Complete Reference (수정 후 목표 상태)

### Fixed Tools (3개) - 항상 사용 가능

| Tool | 기능 | 파라미터 |
|------|------|---------|
| `get_context` | 세션 컨텍스트 조회 (org/project/env) | 없음 |
| `search_docs` | bkend 문서 검색 (Auth/Storage 가이드 접근) | query: string |
| `get_operation_schema` | 특정 도구의 입출력 스키마 조회 | operation, schemaType |

### Project Management Tools (9개) - 조직/프로젝트/환경 관리

| Tool | 기능 | 주요 파라미터 |
|------|------|-------------|
| `backend_org_list` | 조직 목록 | 없음 |
| `backend_project_list` | 프로젝트 목록 | organizationId |
| `backend_project_get` | 프로젝트 상세 | organizationId, projectId |
| `backend_project_create` | 프로젝트 생성 | organizationId, name |
| `backend_project_update` | 프로젝트 수정 | organizationId, projectId |
| `backend_project_delete` | 프로젝트 삭제 | organizationId, projectId |
| `backend_env_list` | 환경 목록 | organizationId, projectId |
| `backend_env_get` | 환경 상세 | organizationId, projectId, environmentId |
| `backend_env_create` | 환경 생성 | organizationId, projectId, name |

### Table Management Tools (기존 확인/수정 필요)

| Tool | 기능 | 비고 |
|------|------|------|
| `backend_table_create` | 테이블 생성 | 유지 |
| `backend_table_list` | 테이블 목록 | 유지 |
| `backend_table_get` | 테이블 상세 (스키마 포함) | 유지 |
| `backend_table_delete` | 테이블 삭제 | 유지 |
| `backend_field_manage` | 필드 추가/수정/삭제 | 유지 |
| `backend_index_manage` | 인덱스 추가/삭제 | 유지 |
| `backend_schema_version_list` | 스키마 버전 목록 | 이름 확인 필요 |
| `backend_schema_version_get` | 스키마 버전 상세 | 신규 추가 |
| `backend_schema_version_apply` | 스키마 버전 적용(롤백) | ~~backend_schema_rollback~~ 이름 수정 |
| `backend_index_version_list` | 인덱스 버전 목록 | 유지 |
| `backend_index_version_get` | 인덱스 버전 상세 | 신규 추가 |

### Data CRUD Tools (5개) - 신규 추가

| Tool | 기능 | 주요 파라미터 |
|------|------|-------------|
| `backend_data_list` | 목록 조회 (필터/정렬/페이지네이션) | tableId, page, limit, sortBy, andFilters, orFilters |
| `backend_data_get` | 단일 레코드 조회 | tableId, recordId |
| `backend_data_create` | 레코드 생성 | tableId, data |
| `backend_data_update` | 레코드 수정 (Partial Update) | tableId, recordId, data |
| `backend_data_delete` | 레코드 삭제 | tableId, recordId |

### MCP Resources (4개 URI) - 신규 문서화

| URI | 설명 | 캐시 TTL |
|-----|------|----------|
| `bkend://orgs` | 조직 목록 | 60초 |
| `bkend://orgs/{orgId}/projects` | 프로젝트 목록 | 60초 |
| `bkend://orgs/{orgId}/projects/{pId}/environments` | 환경 목록 | 60초 |
| `bkend://orgs/{orgId}/projects/{pId}/environments/{eId}/tables` | 테이블 목록+스키마 | 60초 |

### Searchable Docs (search_docs로 접근) - 카테고리 재분류

| Doc ID | 내용 |
|--------|------|
| `1_concepts` | BSON 스키마, 권한, 리소스 계층 |
| `2_tutorial` | 프로젝트~테이블 생성 튜토리얼 |
| `3_howto_implement_auth` | 인증 구현 가이드 |
| `4_howto_implement_data_crud` | CRUD 구현 패턴 |
| `6_code_examples_auth` | 인증 코드 예제 |
| `7_code_examples_data` | CRUD + 파일 업로드 코드 예제 |

---

## 7. 검증 계획

### 검증 항목

| 항목 | 검증 방법 | 합격 기준 |
|------|----------|----------|
| MCP Tool 이름 정확성 | 공식 문서 대조 | 100% 일치 |
| MCP Tool 개수 완전성 | 공식 문서 체크리스트 | 누락 0개 |
| Live Reference URL | WebFetch로 각 URL 테스트 | 404 에러 0개 |
| REST API Base URL | 공식 문서 확인 | 정확한 URL 반영 |
| MCP Resources 문서화 | 공식 문서 대조 | 4개 URI 모두 기재 |
| Gap Analysis | gap-detector 실행 | Match Rate >= 95% |

### 검증 절차

1. Phase 1~4 구현 완료
2. 각 스킬/에이전트 파일의 MCP 도구명을 공식 문서와 1:1 대조
3. WebFetch로 모든 Live Reference URL의 접근 가능 여부 확인
4. gap-detector 에이전트로 Design vs Implementation 분석
5. Match Rate 95% 이상 달성 시 Report 생성

---

## 8. 위험 요소

| 위험 | 가능성 | 영향 | 완화 방안 |
|------|--------|------|----------|
| bkend MCP API가 문서와 다름 | 중 | 높음 | 실제 MCP 연결 후 get_operation_schema로 검증 |
| Guide Tool 이름이 숫자접두사 형식이 맞을 수도 있음 | 중 | 중 | 실제 MCP tool list 확인으로 검증 |
| bkend-docs가 업데이트되어 변경 | 저 | 중 | Live Reference URL로 최신 문서 동적 참조 |
| backend_table_update 도구가 실제로 존재할 수 있음 | 중 | 저 | get_operation_schema로 확인 |

---

## 9. 성공 기준

- [ ] 10개 GAP 모두 해결
- [ ] 공식 문서와 bkit 구현의 MCP Tool 이름 100% 일치
- [ ] Live Reference URL 404 에러 0건
- [ ] gap-detector Match Rate >= 95%
- [ ] 수정된 8개 파일 모두 문법/구조 오류 없음
