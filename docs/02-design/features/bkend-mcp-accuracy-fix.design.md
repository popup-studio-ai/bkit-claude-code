# bkend MCP Accuracy Fix Design Document

> **Summary**: bkit v1.5.4 - bkend.ai MCP 공식 문서와 bkit 구현 간 10개 Gap 해소를 위한 8개 파일 수정 설계. Context Engineering 원칙에 따라 bkend-patterns.md를 Single Source of Truth로 강화하고, 스킬/에이전트의 MCP 도구 정보를 공식 문서와 100% 동기화.
>
> **Project**: bkit-claude-code
> **Target Version**: v1.5.4
> **Author**: CTO Team (code-analyzer, gap-detector, integration-analyzer, design-validator, bkend-expert, enterprise-expert)
> **Date**: 2026-02-14
> **Status**: Draft
> **Planning Doc**: [bkend-mcp-accuracy-fix.plan.md](../../01-plan/features/bkend-mcp-accuracy-fix.plan.md)
> **Source of Truth**: https://github.com/popup-studio-ai/bkend-docs (en/mcp/, en/ai-tools/)

---

## 1. Overview

### 1.1 Design Goals

1. **MCP 도구 100% 정합성**: bkit 스킬/에이전트에 기재된 MCP 도구 이름이 공식 bkend MCP 문서와 100% 일치
2. **누락 도구 완전 보충**: Data CRUD 5개 + Project 9개 + search_docs 1개 + 스키마/인덱스 버전 도구 추가
3. **Live Reference 정상화**: 모든 WebFetch URL이 200 OK 반환 (404 에러 0건)
4. **Context Engineering 최적화**: bkend-patterns.md를 Single Source of Truth로 강화, Token 효율 개선
5. **철학 자기 정합성**: bkit 4대 철학(Automation First, No Guessing, Docs=Code, Context Engineering) 위반 10건 전부 해소

### 1.2 Design Principles

- **Single Source of Truth**: MCP 도구 카탈로그는 `bkend-patterns.md`에 집중, 각 스킬은 도메인 전문 지식에 집중
- **Dynamic over Static**: REST API Base URL은 하드코딩 대신 `get_context` 동적 참조 패턴 권장
- **Convention Over Configuration**: 기존 bkit 스킬/에이전트 파일 형식(YAML frontmatter + Markdown body)을 정확히 준수
- **Backward Compatibility**: 기존 `mcp__bkend__*` 와일드카드 허용은 유지, 추가 도구는 자동 포함

### 1.3 Non-Goals

- bkend.ai MCP 서버 자체의 수정 (bkit 측 문서만 수정)
- bkend-expert 에이전트의 도구 목록(tools 필드) 변경 (skills_preload 경유 간접 허용으로 충분)
- REST Auth API 46개 추가 엔드포인트 전수 기재 (주요 엔드포인트 보정 + Live Reference 동적 참조로 대응)
- plugin.json에 MCP 설정 추가 (사용자 환경별로 `claude mcp add` 필요)

---

## 2. Architecture

### 2.1 수정 전후 비교

```
수정 전 (v1.5.3):
┌─────────────────────────────────────────────────────────────────────┐
│ bkend-expert agent                                                   │
│   skills_preload: [bkend-data, bkend-auth, bkend-storage]          │
│   MCP Tools (19): Guide 8 + Table API 11                            │
│                                                                      │
│ bkend-patterns.md (85 lines, 10/18 항목)                             │
│   @import → 5개 스킬                                                  │
│                                                                      │
│ Missing: Data CRUD 5, Project 9, search_docs 1, Resources 4 URI    │
│ Wrong: Tool names 3, Live URLs all 404, Base URL mismatch           │
└─────────────────────────────────────────────────────────────────────┘

수정 후 (v1.5.4):
┌─────────────────────────────────────────────────────────────────────┐
│ bkend-expert agent                                                   │
│   skills_preload: [bkend-data, bkend-auth, bkend-storage]          │
│   MCP Tools (28+): Fixed 3 + Project 9 + Table 11 + Data 5         │
│   MCP Resources: 4 bkend:// URI                                     │
│                                                                      │
│ bkend-patterns.md (~150 lines, 18/18 항목, Single Source of Truth)  │
│   @import → 5개 스킬 (자동 전파)                                      │
│                                                                      │
│ Fixed: 10 GAPs resolved, Live URLs 200 OK, Base URL dynamic        │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Context Engineering 계층 구조

```
┌─────────────────────────────────────────────────────────────────────┐
│              bkend Context Engineering 계층 (v1.5.4)                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Layer 1: Shared Template (Single Source of Truth)                   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ templates/shared/bkend-patterns.md                              │ │
│  │                                                                  │ │
│  │ - MCP Tool Complete Catalog (Fixed 3 + API 25 = 28)            │ │
│  │ - MCP Resources (4 bkend:// URI, TTL 60s)                     │ │
│  │ - REST API Patterns (dynamic base URL, headers, errors)        │ │
│  │ - Response Format ({ items, pagination })                      │ │
│  │ - Filter Operators (8: $eq,$ne,$gt,$gte,$lt,$lte,$in,$nin)    │ │
│  │ - ID Field Rule: "id" (NOT "_id")                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
│           │ @import                                                  │
│           ▼                                                          │
│  Layer 2: Domain Skills (전문 지식)                                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │bkend-data    │ │bkend-auth    │ │bkend-storage │                │
│  │              │ │              │ │              │                │
│  │Data CRUD     │ │search_docs   │ │search_docs   │                │
│  │도구 파라미터  │ │→Auth 워크플로│ │→Storage 워크 │                │
│  │필터/정렬 상세│ │REST Auth API │ │REST File API │                │
│  │인덱스 관리   │ │RBAC/RLS 가이드│ │Presigned URL │                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
│  ┌──────────────┐ ┌──────────────┐                                  │
│  │bkend-        │ │bkend-        │                                  │
│  │quickstart    │ │cookbook       │                                  │
│  │              │ │              │                                  │
│  │Project Tools │ │튜토리얼      │                                  │
│  │MCP Resources │ │트러블슈팅    │                                  │
│  │환경 관리     │ │FAQ           │                                  │
│  └──────────────┘ └──────────────┘                                  │
│           │                                                          │
│           ▼                                                          │
│  Layer 3: Orchestrating Agent                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ bkend-expert (model: sonnet)                                    │ │
│  │ skills_preload: [bkend-data, bkend-auth, bkend-storage]       │ │
│  │ skills: [dynamic, bkend-quickstart, ..., bkend-cookbook]       │ │
│  │ tools: [Read,Write,Edit,Glob,Grep,Bash,WebFetch]              │ │
│  │ allowed-tools from skills: mcp__bkend__* (와일드카드 상속)     │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  Layer 4: Integration Points                                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │session-      │ │bkit.config   │ │lib/intent/   │                │
│  │start.js      │ │.json         │ │language.js   │                │
│  │MCP 감지      │ │레벨 감지     │ │트리거 패턴   │                │
│  │(Dynamic+Ent) │ │(.mcp.json)   │ │(8 languages) │                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Changes per File

### 3.1 templates/shared/bkend-patterns.md (Single Source of Truth 강화)

**변경 규모**: 대규모 확장 (85줄 → ~170줄)
**관련 GAP**: GAP-04, GAP-05, GAP-06, GAP-08, GAP-09
**철학 정합성**: CE-01 (Context Engineering 최적화), V-NG-04 (No Guessing)

#### 3.1.1 추가 섹션

**A. MCP Fixed Tools (신규)**
```markdown
## MCP Fixed Tools (Always Available)

| Tool | Purpose | Parameters |
|------|---------|------------|
| `get_context` | Session context (org/project/env, API endpoint) | None |
| `search_docs` | Search bkend documentation (Auth/Storage guides) | query: string |
| `get_operation_schema` | Get tool input/output schema | operation: string, schemaType: "input" \| "output" |

**Important**: `get_context` MUST be called first. It returns the API endpoint URL dynamically.
```

**B. MCP Resources (신규)**
```markdown
## MCP Resources (Read-Only, Cached)

| URI Pattern | Description | Cache TTL |
|-------------|-------------|-----------|
| `bkend://orgs` | Organization list | 60s |
| `bkend://orgs/{orgId}/projects` | Project list | 60s |
| `bkend://orgs/{orgId}/projects/{pId}/environments` | Environment list | 60s |
| `bkend://orgs/{orgId}/projects/{pId}/environments/{eId}/tables` | Table list with schema | 60s |

Access via `resources/list` and `resources/read` MCP methods.
Prefer Resources over Tools for read-only listing (lighter, cached).
```

**C. API Response Format (신규)**
```markdown
## API Response Format

List responses use consistent pagination:
```json
{
  "items": [...],
  "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

**ID Field**: Always use `id` (NOT `_id`).
```

**D. Filter & Pagination (신규)**
```markdown
## Query Parameters

### Filtering
- AND filter: `?filter[field]=value` (multiple fields = AND)
- Operators: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`
- Text search: `?search=keyword`

### Pagination & Sorting
- Page: `?page=1` (default: 1)
- Limit: `?limit=20` (default: 20, max: 100)
- Sort: `?sort=field:asc` (or `desc`)
```

**E. Presigned URL (신규)**
```markdown
## File Upload (Presigned URL)

- Presigned URL validity: 15 minutes
- Upload via PUT method with Content-Type header
- Complete upload by registering metadata: POST /v1/files
```

#### 3.1.2 수정 사항

**Base URL 수정** (GAP-08):
```markdown
## REST Service API

Base URL is provided dynamically by `get_context` response.
Typical endpoints:
- MCP: https://api.bkend.ai/mcp
- Service API: Use the endpoint from `get_context` (e.g., https://api-client.bkend.ai/v1)

**Important**: Do NOT hardcode the Service API base URL. Always reference `get_context` output.
```

**ID 필드 수정** (GAP-09):
- 기존 어디서도 `_id`를 언급하지 않으므로 bkend-patterns.md에 `id (NOT _id)` 규칙만 명시

---

### 3.2 skills/bkend-data/SKILL.md (Data CRUD 도구 추가)

**변경 규모**: 대규모 확장
**관련 GAP**: GAP-01 (CRITICAL), GAP-02 (CRITICAL), GAP-05, GAP-07, GAP-09

#### 3.2.1 MCP Data CRUD Tools 섹션 추가 (GAP-01)

기존 "MCP Database Tools" 아래에 새 섹션 추가:

```markdown
## MCP Data CRUD Tools

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| `backend_data_list` | List records (filter, sort, paginate) | tableId, page?, limit?, sortBy?, sortDirection?, andFilters?, orFilters? |
| `backend_data_get` | Get single record | tableId, recordId |
| `backend_data_create` | Create record | tableId, data: { field: value } |
| `backend_data_update` | Partial update record | tableId, recordId, data: { field: value } |
| `backend_data_delete` | Delete record | tableId, recordId |

All Data CRUD tools require: organizationId, projectId, environmentId (from `get_context`).

### Filter Operators
| Operator | Meaning | Example |
|----------|---------|---------|
| `$eq` | Equal | `{ "status": { "$eq": "active" } }` |
| `$ne` | Not equal | `{ "role": { "$ne": "admin" } }` |
| `$gt` / `$gte` | Greater than / >= | `{ "age": { "$gt": 18 } }` |
| `$lt` / `$lte` | Less than / <= | `{ "price": { "$lt": 100 } }` |
| `$in` / `$nin` | In / Not in array | `{ "tag": { "$in": ["a","b"] } }` |
```

#### 3.2.2 MCP Tool 이름 수정 (GAP-02)

| 현재 | 수정 후 | 사유 |
|------|---------|------|
| `backend_table_update` | 삭제 | 공식 문서에 없음 |
| `backend_schema_rollback` | `backend_schema_version_apply` | 공식 이름 |
| `backend_index_rollback` | 삭제 (확인 필요 시 주석 처리) | 공식 문서에 없음 |
| (없음) | `backend_schema_version_get` 추가 | 공식 문서에 존재 |
| (없음) | `backend_index_version_get` 추가 | 공식 문서에 존재 |

수정 후 MCP Database Tools 테이블:
```markdown
## MCP Table Management Tools

| Tool | Purpose | Scope |
|------|---------|-------|
| `backend_table_create` | Create table | table:create |
| `backend_table_list` | List tables | table:read |
| `backend_table_get` | Get table detail + schema | table:read |
| `backend_table_delete` | Delete table | table:delete |
| `backend_field_manage` | Add/modify/delete fields | table:update |
| `backend_index_manage` | Manage indexes | table:update |
| `backend_schema_version_list` | Schema version history | table:read |
| `backend_schema_version_get` | Schema version detail | table:read |
| `backend_schema_version_apply` | Apply schema version (rollback) | table:update |
| `backend_index_version_list` | Index version history | table:read |
| `backend_index_version_get` | Index version detail | table:read |
```

#### 3.2.3 Guide Tools 재분류 (GAP-05)

```markdown
## MCP Guide Docs (via search_docs)

Use `search_docs` tool to access these guides:

| Doc ID | Content |
|--------|---------|
| `4_howto_implement_data_crud` | CRUD implementation patterns |
| `7_code_examples_data` | CRUD + file upload code examples |

Use `get_operation_schema` to get any tool's input/output schema.
```

#### 3.2.4 Auto System Fields 수정 (GAP-09)

```markdown
## Auto System Fields

| Field | Type | Description |
|-------|------|-------------|
| id | String | Auto-generated unique ID |
| createdBy | String | Creator user ID |
| createdAt | Date | Creation timestamp |
| updatedAt | Date | Last update timestamp |

**Important**: bkend uses `id` (NOT `_id`) in all API responses.
```

#### 3.2.5 Live Reference URL 수정 (GAP-07)

```markdown
## Official Documentation (Live Reference)

For the latest database documentation, use WebFetch:
- MCP Data Tools: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/mcp/05-data-tools.md
- MCP Table Tools: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/mcp/04-table-tools.md
- Database Guide: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/database/01-overview.md
- Full TOC: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/SUMMARY.md
```

---

### 3.3 skills/bkend-auth/SKILL.md (search_docs 워크플로우 추가)

**변경 규모**: 중규모
**관련 GAP**: GAP-04 (HIGH), GAP-05, GAP-07

#### 3.3.1 MCP Auth Workflow 재작성 (GAP-04)

기존:
```markdown
## MCP Auth Tools
| 3_howto_implement_auth | Authentication implementation patterns |
| 6_code_examples_auth | Authentication code examples |
```

수정 후:
```markdown
## MCP Auth Workflow

bkend MCP does NOT have dedicated auth tools. Use this workflow:

1. **Search docs**: `search_docs` with query "email signup" or "social login"
2. **Get examples**: `search_docs` with query "auth code examples"
3. **Generate code**: AI generates REST API code based on search results

### Searchable Auth Docs
| Doc ID | Content |
|--------|---------|
| `3_howto_implement_auth` | Signup, login, token management guide |
| `6_code_examples_auth` | Email, social, magic link code examples |

### Key Pattern
```
User: "소셜 로그인 추가해줘"
  → search_docs(query: "social login implementation")
  → Returns auth guide with REST API patterns
  → AI generates Next.js social login code
```
```

#### 3.3.2 REST Auth API 보정

주요 불일치 수정:

| 현재 bkit | 수정 | 사유 |
|-----------|------|------|
| `GET /v1/auth/{provider}/authorize` | 삭제 또는 주석 | 공식 문서에 없음 |
| `POST /v1/auth/{provider}/callback` | `GET/POST /v1/auth/:provider/callback` | 메서드 수정 |
| `POST /v1/auth/email/verify/send` | 경로 확인 후 수정 | 공식 문서와 경로 불일치 |
| `DELETE /v1/auth/account` | `DELETE /v1/auth/withdraw` | 경로 수정 |
| `POST /v1/auth/social/link/unlink` | 삭제 또는 주석 | 공식 문서에 없음 |
| `GET /v1/auth/exists` | 삭제 또는 주석 | 공식 문서에 없음 |

**Note**: 공식 문서에 없는 엔드포인트(authorize, social/link 등)는 bkend API에 실제로 존재할 수 있음. bkit에서는 "공식 문서 기준"으로 확인된 엔드포인트만 기재하고, 미확인 엔드포인트는 Live Reference 동적 참조로 대응.

```markdown
## REST Auth API (Core Endpoints)

For the complete endpoint list, use `search_docs` or check Live Reference.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /v1/auth/email/signup | Sign up |
| POST | /v1/auth/email/signin | Sign in |
| GET | /v1/auth/me | Current user |
| POST | /v1/auth/refresh | Refresh token |
| POST | /v1/auth/signout | Sign out |
| GET/POST | /v1/auth/:provider/callback | Social login callback |
| POST | /v1/auth/password/reset/request | Password reset |
| POST | /v1/auth/password/reset/confirm | Confirm reset |
| POST | /v1/auth/password/change | Change password |
| GET | /v1/auth/sessions | List sessions |
| DELETE | /v1/auth/sessions/:sessionId | Remove session |
| DELETE | /v1/auth/withdraw | Delete account |

**Additional endpoints** (MFA, invitations, user management): use `search_docs` or Live Reference.
```

#### 3.3.3 Live Reference URL 수정 (GAP-07)

```markdown
## Official Documentation (Live Reference)

For the latest authentication documentation, use WebFetch:
- Auth Overview: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/authentication/01-overview.md
- MCP Auth Guide: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/mcp/06-auth-tools.md
- Security: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/security/01-overview.md
- Full TOC: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/SUMMARY.md
```

---

### 3.4 skills/bkend-storage/SKILL.md (search_docs 워크플로우 추가)

**변경 규모**: 중규모
**관련 GAP**: GAP-04 (HIGH), GAP-05, GAP-07

#### 3.4.1 MCP Storage Workflow 재작성 (GAP-04)

수정 후:
```markdown
## MCP Storage Workflow

bkend MCP does NOT have dedicated storage tools. Use this workflow:

1. **Search docs**: `search_docs` with query "file upload presigned url"
2. **Get examples**: `search_docs` with query "file upload code examples"
3. **Generate code**: AI generates REST API code for file operations

### Searchable Storage Docs
| Doc ID | Content |
|--------|---------|
| `7_code_examples_data` | CRUD + file upload code examples |
```

#### 3.4.2 REST Storage API 보정

| 현재 bkit | 수정 | 사유 |
|-----------|------|------|
| `GET /v1/files/{id}/download-url` | `POST /v1/files/:fileId/download-url` | 메서드 GET → POST |
| (없음) | Multipart upload 4개 추가 | 공식 문서에 존재 |

추가:
```markdown
## Multipart Upload (Large Files)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /v1/files/multipart/init | Initialize multipart upload |
| POST | /v1/files/multipart/presigned-url | Get part upload URL |
| POST | /v1/files/multipart/complete | Complete multipart upload |
| POST | /v1/files/multipart/abort | Abort multipart upload |
```

#### 3.4.3 Live Reference URL 수정 (GAP-07)

```markdown
## Official Documentation (Live Reference)

For the latest storage documentation, use WebFetch:
- Storage Overview: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/storage/01-overview.md
- MCP Storage Guide: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/mcp/07-storage-tools.md
- Full TOC: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/SUMMARY.md
```

---

### 3.5 skills/bkend-quickstart/SKILL.md (Project Tools + Resources 추가)

**변경 규모**: 중규모
**관련 GAP**: GAP-03 (HIGH), GAP-05, GAP-06, GAP-07

#### 3.5.1 MCP Project Tools 추가 (GAP-03)

```markdown
## MCP Project Management Tools

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| `backend_org_list` | List organizations | None |
| `backend_project_list` | List projects | organizationId |
| `backend_project_get` | Get project detail | organizationId, projectId |
| `backend_project_create` | Create project | organizationId, name, description? |
| `backend_project_update` | Update project | organizationId, projectId, name?, description? |
| `backend_project_delete` | Delete project (irreversible!) | organizationId, projectId |
| `backend_env_list` | List environments | organizationId, projectId |
| `backend_env_get` | Get environment detail | organizationId, projectId, environmentId |
| `backend_env_create` | Create environment | organizationId, projectId, name |
```

#### 3.5.2 MCP Resources 추가 (GAP-06)

```markdown
## MCP Resources (Read-Only)

Lightweight, cached (60s TTL) read-only queries via bkend:// URI:

| URI | Description |
|-----|-------------|
| `bkend://orgs` | Organization list |
| `bkend://orgs/{orgId}/projects` | Project list |
| `bkend://orgs/{orgId}/projects/{pId}/environments` | Environment list |
| `bkend://orgs/{orgId}/projects/{pId}/environments/{eId}/tables` | Table list with schema |

**Tip**: Prefer Resources over Tools for listing operations (lighter, cached).
```

#### 3.5.3 Guide Tools 재분류 (GAP-05)

```markdown
## MCP Fixed Tools

| Tool | Purpose |
|------|---------|
| `get_context` | Session context (org/project/env, API endpoint) |
| `search_docs` | Search bkend documentation |
| `get_operation_schema` | Get tool input/output schema |

## Searchable Guides (via search_docs)

| Doc ID | Content |
|--------|---------|
| `1_concepts` | BSON schema, permissions, hierarchy |
| `2_tutorial` | Project~table creation tutorial |
```

#### 3.5.4 Live Reference URL 수정 (GAP-07)

```markdown
## Official Documentation (Live Reference)

For the latest bkend documentation, use WebFetch:
- Quick Start: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/getting-started/02-quick-start.md
- Core Concepts: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/getting-started/03-core-concepts.md
- Claude Code Setup: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/ai-tools/04-claude-code-setup.md
- MCP Overview: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/mcp/01-overview.md
- Full TOC: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/SUMMARY.md
```

---

### 3.6 skills/bkend-cookbook/SKILL.md (Live Reference URL 수정)

**변경 규모**: 소규모
**관련 GAP**: GAP-07

```markdown
## Official Documentation (Live Reference)

For the latest cookbook and troubleshooting, use WebFetch:
- Cookbooks: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/cookbooks/blog/01-quick-start.md
- Troubleshooting: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/troubleshooting/01-common-errors.md
- Full TOC: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/SUMMARY.md
```

---

### 3.7 agents/bkend-expert.md (MCP 도구 카탈로그 업데이트)

**변경 규모**: 대규모
**관련 GAP**: GAP-01, GAP-02, GAP-03, GAP-04, GAP-05, GAP-06, GAP-07

#### 3.7.1 MCP Tools 섹션 전면 재작성

기존 "MCP Tools (19)" → 수정 후 "MCP Tools (28+)":

```markdown
## MCP Tools

### Fixed Tools (Always Available)

| Tool | Purpose |
|------|---------|
| `get_context` | Session context (org/project/env, API endpoint) - MUST call first |
| `search_docs` | Search bkend docs (Auth/Storage guides, code examples) |
| `get_operation_schema` | Get tool input/output schema |

### Project Management Tools

| Tool | Purpose |
|------|---------|
| `backend_org_list` | List organizations |
| `backend_project_list` | List projects |
| `backend_project_get` | Get project detail |
| `backend_project_create` | Create project |
| `backend_project_update` | Update project |
| `backend_project_delete` | Delete project |
| `backend_env_list` | List environments |
| `backend_env_get` | Get environment detail |
| `backend_env_create` | Create environment |

### Table Management Tools

| Tool | Purpose | Scope |
|------|---------|-------|
| `backend_table_create` | Create table | table:create |
| `backend_table_list` | List tables | table:read |
| `backend_table_get` | Get detail + schema | table:read |
| `backend_table_delete` | Delete table | table:delete |
| `backend_field_manage` | Add/modify/delete fields | table:update |
| `backend_index_manage` | Index management | table:update |
| `backend_schema_version_list` | Schema version history | table:read |
| `backend_schema_version_get` | Schema version detail | table:read |
| `backend_schema_version_apply` | Apply schema version (rollback) | table:update |
| `backend_index_version_list` | Index version history | table:read |
| `backend_index_version_get` | Index version detail | table:read |

### Data CRUD Tools

| Tool | Purpose |
|------|---------|
| `backend_data_list` | List records (filter, sort, paginate) |
| `backend_data_get` | Get single record |
| `backend_data_create` | Create record |
| `backend_data_update` | Partial update record |
| `backend_data_delete` | Delete record |

### MCP Resources (Read-Only, Cached 60s)

| URI | Description |
|-----|-------------|
| `bkend://orgs` | Organization list |
| `bkend://orgs/{orgId}/projects` | Project list |
| `bkend://orgs/{orgId}/projects/{pId}/environments` | Environment list |
| `bkend://orgs/{orgId}/projects/{pId}/environments/{eId}/tables` | Table list + schema |

### Searchable Docs (via search_docs)

| Doc ID | Content |
|--------|---------|
| `1_concepts` | BSON schema, permissions, hierarchy |
| `2_tutorial` | Project~table creation guide |
| `3_howto_implement_auth` | Auth implementation patterns |
| `4_howto_implement_data_crud` | CRUD implementation patterns |
| `6_code_examples_auth` | Auth code examples |
| `7_code_examples_data` | CRUD + file upload examples |
```

#### 3.7.2 Service API 섹션 수정

```markdown
## Service API (REST)

### Base URL
Provided dynamically by `get_context`. Do NOT hardcode.
Typical: `https://api-client.bkend.ai/v1`

### Required Headers
```
x-project-id: {projectId}
x-environment: dev|staging|prod
Authorization: Bearer {accessToken}
```

### ID Field
Always use `id` (NOT `_id`) in API responses.
```

#### 3.7.3 Live Reference URL 수정 (GAP-07)

```markdown
## Official Documentation (Live Reference)

When you need the latest bkend documentation, use WebFetch with these URLs:

- **Full TOC**: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/SUMMARY.md
- **MCP Overview**: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/mcp/01-overview.md
- **MCP Context**: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/mcp/02-context.md
- **MCP Project Tools**: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/mcp/03-project-tools.md
- **MCP Table Tools**: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/mcp/04-table-tools.md
- **MCP Data Tools**: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/mcp/05-data-tools.md
- **MCP Auth**: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/mcp/06-auth-tools.md
- **MCP Storage**: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/mcp/07-storage-tools.md
- **Claude Code Setup**: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/ai-tools/04-claude-code-setup.md

**Usage**: Fetch SUMMARY.md first to find the exact page, then fetch that specific page.
```

---

### 3.8 hooks/session-start.js (MCP 감지 레벨 확장)

**변경 규모**: 소규모 (1줄 수정)
**관련 GAP**: GAP-10 (LOW)

#### 변경 내용

파일 위치: `hooks/session-start.js` line 567

```javascript
// Before (v1.5.3):
if (detectedLevel === 'Dynamic') {

// After (v1.5.4):
if (detectedLevel === 'Dynamic' || detectedLevel === 'Enterprise') {
```

**사유**: Enterprise 프로젝트에서도 bkend를 BaaS로 사용할 수 있음 (microservices의 일부로 bkend 활용).

---

## 4. GAP Resolution Matrix

| GAP ID | 심각도 | 수정 파일 | 수정 내용 | 철학 위반 해소 |
|--------|--------|----------|----------|---------------|
| GAP-01 | CRITICAL | bkend-data, bkend-expert | Data CRUD 5개 도구 추가 | V-AF-01, V-DC-02 |
| GAP-02 | CRITICAL | bkend-data, bkend-expert | 도구 이름 수정 (rollback→version_apply 등) | V-NG-01 |
| GAP-03 | HIGH | bkend-quickstart, bkend-expert | Project/Env 관리 9개 도구 추가 | V-AF-01 |
| GAP-04 | HIGH | bkend-auth, bkend-storage, bkend-patterns | search_docs 워크플로우 추가 | V-AF-02, V-NG-02 |
| GAP-05 | HIGH | 전체 bkend 스킬, bkend-expert | Fixed Tool vs Searchable Docs 재분류 | V-NG-03 |
| GAP-06 | MEDIUM | bkend-quickstart, bkend-patterns, bkend-expert | MCP Resources 4 URI 추가 | V-AF-03, CE-01 |
| GAP-07 | MEDIUM | 전체 bkend 스킬, bkend-expert | Live Reference URL src/→en/ 수정 | V-NG-02, V-DC-01 |
| GAP-08 | MEDIUM | bkend-patterns, bkend-expert | Base URL 동적 참조 패턴 전환 | V-NG-04, CE-01 |
| GAP-09 | LOW | bkend-data | _id → id 수정 | V-DC-03 |
| GAP-10 | LOW | session-start.js | Dynamic→Dynamic\|Enterprise 확장 | V-AF-03 |

---

## 5. Implementation Order

### Phase 1: Foundation (bkend-patterns.md)
1. bkend-patterns.md 확장 (MCP Fixed Tools, Resources, Response Format, Filters, ID Rule)
2. Base URL을 동적 참조 패턴으로 전환

**사유**: @import로 5개 스킬이 모두 참조하므로 최우선 수정

### Phase 2: CRITICAL Fix (bkend-data, bkend-expert)
3. bkend-data/SKILL.md: Data CRUD 5개 추가, 도구 이름 수정, ID 필드 수정
4. bkend-expert.md: MCP Tools 섹션 전면 재작성 (19→28+)

### Phase 3: HIGH Fix (bkend-auth, bkend-storage, bkend-quickstart)
5. bkend-auth/SKILL.md: search_docs 워크플로우, REST 엔드포인트 보정
6. bkend-storage/SKILL.md: search_docs 워크플로우, multipart 추가, download-url 메서드 수정
7. bkend-quickstart/SKILL.md: Project Tools 9개, Resources, Fixed Tools 재분류

### Phase 4: URL Fix + Integration
8. 전체 6개 파일의 Live Reference URL 일괄 수정 (src/→en/, 구체적 파일 경로)
9. bkend-cookbook/SKILL.md: Live Reference URL만 수정
10. hooks/session-start.js: MCP 감지 조건 1줄 수정

---

## 6. Token Budget Impact Analysis

### 수정 전 Token 소비 (v1.5.3 추정)

| Component | Lines | Est. Tokens | 효용 |
|-----------|-------|-------------|------|
| bkend-patterns.md | 85 | ~600 | 55.6% 유효 |
| bkend-data/SKILL.md | 122 | ~900 | MCP Data CRUD 0% |
| bkend-auth/SKILL.md | 118 | ~850 | search_docs 0% |
| bkend-storage/SKILL.md | 110 | ~800 | search_docs 0% |
| bkend-quickstart/SKILL.md | 118 | ~850 | Project Tools 0% |
| bkend-cookbook/SKILL.md | 101 | ~700 | Live URL 0% |
| bkend-expert.md | 231 | ~1,700 | 19/28+ tools |
| **Total** | **885** | **~6,400** | **부분적 유효** |

### 수정 후 Token 소비 (v1.5.4 예상)

| Component | Lines | Est. Tokens | 효용 |
|-----------|-------|-------------|------|
| bkend-patterns.md | ~170 | ~1,200 | 100% 유효 (SSOT) |
| bkend-data/SKILL.md | ~170 | ~1,200 | Data CRUD 100% |
| bkend-auth/SKILL.md | ~125 | ~900 | search_docs 워크플로우 |
| bkend-storage/SKILL.md | ~130 | ~950 | search_docs + multipart |
| bkend-quickstart/SKILL.md | ~160 | ~1,150 | Project + Resources |
| bkend-cookbook/SKILL.md | ~105 | ~750 | Live URL 정상 |
| bkend-expert.md | ~270 | ~2,000 | 28+ tools 완전 |
| **Total** | **~1,130** | **~8,150** | **100% 유효** |

**Token 증가**: ~1,750 tokens (+27%)
**Token 효용 증가**: 부분 유효 → 100% 유효 (잘못된 정보 0건, 404 URL 0건)
**순효용**: Token 1,750 추가 투자로 MCP 자동화 경로 100% 복원 → **ROI 매우 높음**

---

## 7. Verification Plan

### 7.1 자동 검증 (gap-detector)

| 검증 항목 | 기대 결과 | 도구 |
|-----------|----------|------|
| MCP Tool 이름 일치율 | 100% (0 불일치) | gap-detector |
| 누락 MCP Tool 수 | 0 (28+ 모두 기재) | gap-detector |
| Live Reference URL 정상률 | 100% (0건 404) | WebFetch 테스트 |
| Design-Implementation Match Rate | >= 95% | gap-detector |

### 7.2 수동 검증 (MCP 연결 테스트)

| 검증 항목 | 방법 |
|-----------|------|
| Guide Tool 실제 이름 | `claude mcp list` 후 실제 노출 이름 확인 |
| backend_table_update 존재 여부 | `get_operation_schema("backend_table_update","input")` 호출 |
| backend_schema_rollback 존재 여부 | `get_operation_schema("backend_schema_rollback","input")` 호출 |
| backend_index_rollback 존재 여부 | `get_operation_schema("backend_index_rollback","input")` 호출 |
| Service API Base URL | `get_context` 호출 후 endpoint 필드 확인 |

### 7.3 성공 기준

- [ ] 10개 GAP 모두 해결
- [ ] 공식 문서와 MCP Tool 이름 100% 일치
- [ ] Live Reference URL 404 에러 0건
- [ ] gap-detector Match Rate >= 95%
- [ ] 수정 8개 파일 YAML frontmatter 구문 오류 0건
- [ ] `mcp__bkend__*` 와일드카드 허용 유지 확인

---

## 8. Risk Assessment

| 위험 | 가능성 | 영향 | 완화 |
|------|--------|------|------|
| Guide Tool 이름이 실제로 번호접두사(0_, 1_) 형식일 수 있음 | 중 | 중 | 수정 시 "Searchable Docs" 카테고리로 분류하여 직접 호출 여부와 무관하게 올바른 가이드 제공 |
| backend_table_update가 실제 존재할 수 있음 | 중 | 저 | 삭제 대신 "확인 필요" 주석 처리, MCP 연결 테스트로 검증 |
| bkend-docs가 업데이트되어 파일 경로 변경 | 저 | 중 | SUMMARY.md를 먼저 참조하는 패턴으로 Live Reference 설계 |
| Token 증가로 context window 압박 | 저 | 저 | +1,750 tokens는 전체 context 대비 미미, 효용 100% 향상으로 상쇄 |
| bkend-patterns.md SSOT 확장으로 중복 정보 발생 | 저 | 저 | 각 스킬은 도메인 전문 지식에만 집중, 공통 정보는 patterns에 위임 |

---

## 9. Philosophy Alignment Summary

| 철학 | v1.5.3 위반 | v1.5.4 해소 |
|------|------------|------------|
| **Automation First** | Data CRUD/Auth/Storage MCP 자동화 불가 (3건) | 28+ MCP 도구 + search_docs 워크플로우로 전체 자동화 복원 |
| **No Guessing** | 잘못된 도구명/URL/카테고리로 추측 유발 (4건) | 100% 정확한 도구명, 정상 URL, 명확한 카테고리 분류 |
| **Docs = Code** | bkit 자체의 Design-Implementation Gap ~30% (3건) | bkit 스킬(Design)과 bkend MCP(Implementation) 100% 동기화 |
| **Context Engineering** | Token 역전 (잘못된 정보에 소비, 핵심 정보 누락) | SSOT 강화, 404 URL 제거, 핵심 도구 정보 추가 = 최적 컨텍스트 |

**결론**: bkend MCP Accuracy Fix는 bkit이 주장하는 4대 철학을 bkit 자체에 적용하는 **자기 정합성(Self-Consistency) 확보 작업**이며, v1.5.4의 핵심 품질 개선.
