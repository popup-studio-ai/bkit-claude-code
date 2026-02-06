# bkit v1.5.2 bkend Expert Enhancement Design

> **Summary**: bkend.ai BaaS 전문성 강화 - 8개 파일 수정 + 5개 Skill 신규 + 1개 공유 템플릿 + 1개 버그 수정
>
> **Project**: bkit-claude-code
> **Version**: 1.5.2
> **Author**: CTO Team (4-agent 병렬 분석 기반)
> **Date**: 2026-02-06
> **Status**: Draft
> **Plan Reference**: docs/01-plan/features/bkit-v1.5.2-bkend-expert-enhancement.plan.md

---

## 1. 설계 목표

### 1.1 핵심 원칙 (Philosophy Compliance)

CTO 팀 철학 분석(philosophy-analyst)에서 도출된 준수 원칙:

| 원칙 | 적용 방법 |
|------|----------|
| **Automation First** | 사용자가 명령어를 몰라도 bkend 관련 기능이 자동 트리거 |
| **No Guessing** | bkend.ai 설정이 불확실할 때 추측하지 않고 AskUserQuestion |
| **Docs = Code** | 설계 문서 먼저 확인, 설계-구현 동기화 유지 |
| **Context Engineering** | Agent 문서는 ~150줄 이내, 상세는 Skills/MCP 문서 도구에 위임 |
| **Level System** | Enterprise(직접 구축) vs Dynamic(bkend 권장) vs Starter(백엔드 불필요) 명확 분리 |
| **Agent 역할 경계** | bkend-expert는 BaaS/API/데이터 레이어만, 인프라/보안/프론트엔드는 해당 Agent에 위임 |

### 1.2 설계 범위

| 구분 | 파일 수 | 목표 |
|------|---------|------|
| Agent 재작성 | 1 | G-01 |
| Skill 수정 | 2 | G-02, G-06, G-07 |
| **Skill 신규 생성** | **5** | **G-10, G-11** |
| **공유 템플릿 생성** | **1** | **G-12** |
| Library 수정 | 2 | G-03, G-04, G-05 + 버그 수정 |
| Template 수정 | 2 | G-08 |
| Hook 수정 | 1 | G-09 |
| **총계** | **14 + 1 버그 수정** | G-01 ~ G-12 |

---

## 2. 발견된 버그 (Design Phase 조사에서 발견)

### BUG-01: Agent Trigger confidence 비교 버그 (Critical)

**파일**: `scripts/user-prompt-handler.js` Line 72
**현상**: `matchImplicitAgentTrigger()`가 confidence `0.8`을 반환하는데, 비교 조건이 `> 0.8`이므로 `0.8 > 0.8 = false` → **에이전트 트리거가 절대 contextParts에 추가되지 않음**
**영향**: 모든 Agent의 implicit trigger가 UserPromptSubmit hook에서 작동하지 않음 (session-start 트리거 테이블에만 표시)
**수정**: `> 0.8` → `>= 0.8`

```javascript
// Before (Line 72)
if (agentMatch && agentMatch.confidence > 0.8) {

// After
if (agentMatch && agentMatch.confidence >= 0.8) {
```

> **참고**: 이 버그가 수정되지 않으면 G-03 (Agent Trigger 패턴 추가)의 효과가 없음

---

## 3. 파일별 변경 명세

### 3.1 agents/bkend-expert.md (전면 재작성) — G-01

**현재**: 145줄, 기본적인 코드 패턴만 포함
**변경 후**: ~150줄 (Context Engineering 원칙 준수, 핵심 정보만)

#### Frontmatter 변경

```yaml
# Before
---
name: bkend-expert
description: |
  bkend.ai BaaS platform expert agent.
  Handles authentication, data modeling, API design, and MCP integration for bkend.ai projects.
  ...
permissionMode: acceptEdits
model: sonnet
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - WebFetch
skills:
  - dynamic
---
```

```yaml
# After — Frontmatter는 동일하게 유지 (이미 적절)
# description의 Triggers에 추가 키워드만 보강
---
name: bkend-expert
description: |
  bkend.ai BaaS platform expert agent.
  Handles authentication, data modeling, API design, and MCP integration for bkend.ai projects.

  Use proactively when user mentions login, signup, authentication, database operations,
  or asks about fullstack development with BaaS platforms.
  Also recommend bkend when user needs backend/DB but does NOT explicitly request
  infrastructure or custom server setup (those go to enterprise-expert/infra-architect).

  Triggers: bkend, BaaS, authentication, login, signup, database, fullstack, backend,
  API integration, data model, REST API, file upload, presigned url, CRUD,
  인증, 로그인, 회원가입, 데이터베이스, 풀스택, 백엔드, 파일 업로드,
  認証, ログイン, データベース, ファイル, 身份验证, 数据库, 文件上传,
  autenticación, inicio de sesión, registro, base de datos, carga de archivos,
  authentification, connexion, inscription, base de données, téléchargement,
  Authentifizierung, Anmeldung, Registrierung, Datenbank, Datei-Upload,
  autenticazione, accesso, registrazione, database, caricamento file

  Do NOT use for: static websites without backend, infrastructure tasks (use infra-architect),
  pure frontend styling, enterprise microservices architecture (use enterprise-expert),
  Kubernetes/Docker infrastructure, CI/CD pipelines.
permissionMode: acceptEdits
model: sonnet
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - WebFetch
skills:
  - dynamic
  - bkend-quickstart
  - bkend-data
  - bkend-auth
  - bkend-storage
  - bkend-cookbook
skills_preload:
  - bkend-data
  - bkend-auth
  - bkend-storage
---
```

> **Note**: `skills`에 5개 bkend 전문 Skill 추가, `skills_preload`에 핵심 3개(data, auth, storage) 사전 로드.
> 사용자가 bkend에 대해 모르더라도 에이전트가 전문 지식을 사전 보유하여 AI Native 개발 가능.

#### Body 재작성 구조

```markdown
# bkend.ai Expert Agent

## Role
bkend.ai BaaS 플랫폼 전문가. MCP를 통한 백엔드 관리 및 REST 서비스 API 개발 가이드.
Enterprise 인프라가 아닌 BaaS 기반 빠른 백엔드 구축에 특화.

## When to Recommend bkend
- 사용자가 백엔드/DB/인증이 필요하지만 직접 서버 구축을 요청하지 않은 경우
- "로그인 만들어줘", "DB 연동해줘", "파일 업로드 구현해줘" 등
- Enterprise 키워드(K8s, Docker, 마이크로서비스, 직접 서버)가 없는 백엔드 요청
- 불확실하면 AskUserQuestion으로 확인

## Platform Overview

### Resource Hierarchy
Organization (팀/결제) → Project (서비스) → Environment (dev/staging/prod, 데이터 격리)

### Endpoints
- Console: console.bkend.ai
- MCP: https://api.bkend.ai/mcp
- Service API: https://api.bkend.ai/v1

## MCP Setup (Claude Code)

### Quick Setup
claude mcp add bkend --transport http https://api.bkend.ai/mcp

### .mcp.json (프로젝트별)
{
  "mcpServers": {
    "bkend": {
      "type": "http",
      "url": "https://api.bkend.ai/mcp"
    }
  }
}

### Authentication
- OAuth 2.1 + PKCE (브라우저 자동 인증)
- 별도 API Key/환경변수 불필요
- Access Token: 1시간, Refresh Token: 30일

## MCP Tools (19개)

### Guide Tools (파라미터 없음)
| Tool | Purpose |
|------|---------|
| 0_get_context | 세션 컨텍스트 (org/project/env) |
| 1_concepts | BSON 스키마, 권한, 계층 개념 |
| 2_tutorial | 프로젝트~테이블 생성 가이드 |
| 3_howto_implement_auth | 인증 구현 패턴 |
| 4_howto_implement_data_crud | CRUD 구현 패턴 |
| 5_get_operation_schema | API operation 스키마 조회 |
| 6_code_examples_auth | 인증 코드 예시 |
| 7_code_examples_data | CRUD + 파일 업로드 예시 |

### API Tools (projectId, environment 필수)
| Tool | Purpose | Scope |
|------|---------|-------|
| backend_table_create | 테이블 생성 | table:create |
| backend_table_list | 목록 조회 | table:read |
| backend_table_get | 상세 조회 | table:read |
| backend_table_update | 설정 수정 | table:update |
| backend_table_delete | 삭제 | table:delete |
| backend_field_manage | 필드 추가/수정/삭제 | table:update |
| backend_schema_version_list | 스키마 이력 | table:read |
| backend_schema_rollback | 스키마 롤백 | table:update |
| backend_index_manage | 인덱스 관리 | table:update |
| backend_index_version_list | 인덱스 이력 | table:read |
| backend_index_rollback | 인덱스 롤백 | table:update |

## Service API (REST)

### Required Headers
x-project-id: {projectId}
x-environment: dev|staging|prod
Authorization: Bearer {accessToken}

### Auth (18 endpoints)
POST /v1/auth/email/signup — 회원가입
POST /v1/auth/email/signin — 로그인
GET /v1/auth/me — 현재 사용자
POST /v1/auth/refresh — 토큰 갱신
POST /v1/auth/signout — 로그아웃
GET /v1/auth/{provider}/authorize — 소셜 로그인 (Google, GitHub)
POST /v1/auth/{provider}/callback — 소셜 콜백

### Data CRUD
GET /v1/data/{table} — 목록 (filter, sort, page 지원)
POST /v1/data/{table} — 생성
GET /v1/data/{table}/{id} — 조회
PATCH /v1/data/{table}/{id} — 수정
DELETE /v1/data/{table}/{id} — 삭제

### Storage (Presigned URL 방식)
POST /v1/files/presigned-url → PUT {url} → POST /v1/files

## RBAC
| Group | Description |
|-------|-------------|
| admin | 전체 CRUD |
| user | 인증된 사용자, 전체 권한 |
| self | 본인 데이터만 (createdBy 기준) |
| guest | 비인증, 보통 읽기만 |

## Work Rules
1. 데이터 모델 변경 → docs/02-design/data-model.md 먼저 업데이트
2. API 추가 → docs/02-design/api-spec.md에 명세 추가
3. 인증 구현 → MCP 3_howto_implement_auth 참조
4. bkend MCP 미설정 감지 → 설정 가이드 제안

## Troubleshooting
| Problem | Cause | Solution |
|---------|-------|----------|
| 401 Unauthorized | Token expired | POST /v1/auth/refresh로 갱신 |
| CORS error | Domain not registered | bkend 콘솔에서 도메인 등록 |
| Slow queries | Missing index | backend_index_manage로 인덱스 추가 |
| Table not found | Wrong environment | x-environment 헤더 확인 |
| MCP 연결 실패 | OAuth 미완료 | 브라우저에서 인증 완료 확인 |
| MCP 도구 안 보임 | 연결 끊김 | claude mcp list 확인 후 재추가 |
| 409 Conflict | Duplicate value | unique 필드 중복 확인 |
| 403 Forbidden | RBAC 권한 부족 | 테이블 permissions 설정 확인 |
| 429 Rate Limit | 호출 한도 초과 | Retry-After 헤더 참고 |
| Schema validation | BSON 타입 불일치 | backend_table_get으로 스키마 확인 |
| File too large | 크기 제한 초과 | 이미지 10MB, 비디오 100MB, 문서 20MB |
| Session expired | MCP 세션 만료 | 재인증 (자동) |

## Agent Delegation
- 인프라 요청 (K8s, Docker, AWS) → infra-architect
- 마이크로서비스 아키텍처 → enterprise-expert
- 보안 고급 설정 → security-architect
- 프론트엔드 UI/UX → frontend-architect
- 코드 품질 분석 → code-analyzer

## Reference
- Skills: dynamic (상세 개발 가이드)
- MCP Guide Tools: 0_get_context ~ 7_code_examples_data (실시간 참조)
- Docs: https://github.com/popup-studio-ai/bkend-docs
```

---

### 3.2 skills/dynamic/SKILL.md — G-02, G-06

#### 3.2.1 MCP Integration 섹션 교체 (Line 277-292)

```markdown
## Before (Line 277-292)
## MCP Integration (.mcp.json)

{
  "mcpServers": {
    "bkend": {
      "command": "npx",
      "args": ["@bkend/mcp-server"],
      "env": {
        "BKEND_API_KEY": "${BKEND_API_KEY}",
        "BKEND_PROJECT_ID": "${BKEND_PROJECT_ID}"
      }
    }
  }
}
```

```markdown
## After
## MCP Integration

### Claude Code CLI (권장)
claude mcp add bkend --transport http https://api.bkend.ai/mcp

### .mcp.json (프로젝트별)
{
  "mcpServers": {
    "bkend": {
      "type": "http",
      "url": "https://api.bkend.ai/mcp"
    }
  }
}

### Authentication
- OAuth 2.1 + PKCE (브라우저 자동 인증)
- 별도 API Key/환경변수 불필요
- 첫 MCP 요청 시 브라우저가 열리면 bkend 콘솔에서 로그인 → Organization 선택 → 권한 승인
- 확인: "bkend에 연결된 프로젝트를 보여줘"
```

#### 3.2.2 bkend.ai Client Setup 교체 (Line 159-171)

```typescript
// Before (Line 161-171)
// lib/bkend.ts
import { createClient } from '@bkend/client';

export const bkend = createClient({
  apiKey: process.env.NEXT_PUBLIC_BKEND_API_KEY!,
  projectId: process.env.NEXT_PUBLIC_BKEND_PROJECT_ID!,
});
```

```typescript
// After
// lib/bkend.ts - REST Service API Client
const API_BASE = process.env.NEXT_PUBLIC_BKEND_API_URL || 'https://api.bkend.ai/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_BKEND_PROJECT_ID!;
const ENVIRONMENT = process.env.NEXT_PUBLIC_BKEND_ENV || 'dev';

async function bkendFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('bkend_access_token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-project-id': PROJECT_ID,
      'x-environment': ENVIRONMENT,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const bkend = {
  auth: {
    signup: (body: {email: string; password: string}) => bkendFetch('/auth/email/signup', {method: 'POST', body: JSON.stringify(body)}),
    signin: (body: {email: string; password: string}) => bkendFetch('/auth/email/signin', {method: 'POST', body: JSON.stringify(body)}),
    me: () => bkendFetch('/auth/me'),
    refresh: (refreshToken: string) => bkendFetch('/auth/refresh', {method: 'POST', body: JSON.stringify({refreshToken})}),
    signout: () => bkendFetch('/auth/signout', {method: 'POST'}),
  },
  data: {
    list: (table: string, params?: Record<string,string>) => bkendFetch(`/data/${table}?${new URLSearchParams(params)}`),
    get: (table: string, id: string) => bkendFetch(`/data/${table}/${id}`),
    create: (table: string, body: any) => bkendFetch(`/data/${table}`, {method: 'POST', body: JSON.stringify(body)}),
    update: (table: string, id: string, body: any) => bkendFetch(`/data/${table}/${id}`, {method: 'PATCH', body: JSON.stringify(body)}),
    delete: (table: string, id: string) => bkendFetch(`/data/${table}/${id}`, {method: 'DELETE'}),
  },
};
```

#### 3.2.3 .env.local 환경변수 섹션 추가 (Line 292 뒤, Limitations 전)

```markdown
## Environment Variables (.env.local)

NEXT_PUBLIC_BKEND_API_URL=https://api.bkend.ai/v1
NEXT_PUBLIC_BKEND_PROJECT_ID=your-project-id
NEXT_PUBLIC_BKEND_ENV=dev

Note: Project ID는 bkend 콘솔(console.bkend.ai)에서 확인.
MCP 도구로는: "내 프로젝트 목록을 보여줘" → backend_project_list
```

#### 3.2.4 Project Structure 업데이트 (Line 112-157)

`.mcp.json` 설정 부분만 코멘트 수정:

```
├── .mcp.json                   # bkend.ai MCP config (type: http)
```

---

### 3.3 skills/phase-4-api/SKILL.md — G-07

#### Line 77 뒤에 Dynamic Level BaaS 섹션 추가

```markdown
## Before (Line 71-77)
| Level | Application |
|-------|------------|
| Starter | Skip this Phase (no API) |
| Dynamic | Use bkend.ai BaaS |
| Enterprise | Implement APIs directly |

## After (Line 71-77 유지 + 이후 섹션 추가)
| Level | Application |
|-------|------------|
| Starter | Skip this Phase (no API) |
| Dynamic | Use bkend.ai BaaS (see below) |
| Enterprise | Implement APIs directly |

### Dynamic Level: bkend.ai BaaS API Implementation

#### Step 1: MCP 설정
claude mcp add bkend --transport http https://api.bkend.ai/mcp

#### Step 2: 테이블 설계 (MCP 도구 사용)
자연어로 요청: "users 테이블을 만들어줘. name(필수), email(필수, unique), age 필드"
→ MCP `backend_table_create` 자동 호출

#### Step 3: 서비스 API 통합
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /v1/data/{table} | 목록 조회 (filter, sort, page) |
| POST | /v1/data/{table} | 데이터 생성 |
| GET | /v1/data/{table}/{id} | 단일 조회 |
| PATCH | /v1/data/{table}/{id} | 부분 수정 |
| DELETE | /v1/data/{table}/{id} | 삭제 |

Required Headers: x-project-id, x-environment, Authorization

#### Step 4: 인증 구현
MCP 도구 `3_howto_implement_auth` 및 `6_code_examples_auth` 참조

#### Step 5: Zero Script QA
- bkend REST API 호출 로그를 브라우저 DevTools Network 탭에서 확인
- 응답 코드/바디로 API 동작 검증
```

---

### 3.4 lib/intent/language.js — G-03

#### AGENT_TRIGGER_PATTERNS에 bkend-expert 추가 (Line 65 뒤)

```javascript
// Before (Line 56-66)
  'starter-guide': {
    en: ['help', 'beginner', 'first time', 'new to', 'learn', 'tutorial', 'simple'],
    ko: ['도움', '초보', '처음', '배우', '입문', '쉬운'],
    ja: ['助けて', '初心者', '初めて', '学ぶ', '入門'],
    zh: ['帮助', '初学者', '第一次', '学习', '入门'],
    es: ['ayuda', 'principiante', 'primera vez', 'aprender'],
    fr: ['aide', 'débutant', 'première fois', 'apprendre'],
    de: ['Hilfe', 'Anfänger', 'zum ersten Mal', 'lernen'],
    it: ['aiuto', 'principiante', 'prima volta', 'imparare']
  }
};

// After
  'starter-guide': {
    en: ['help', 'beginner', 'first time', 'new to', 'learn', 'tutorial', 'simple'],
    ko: ['도움', '초보', '처음', '배우', '입문', '쉬운'],
    ja: ['助けて', '初心者', '初めて', '学ぶ', '入門'],
    zh: ['帮助', '初学者', '第一次', '学习', '入门'],
    es: ['ayuda', 'principiante', 'primera vez', 'aprender'],
    fr: ['aide', 'débutant', 'première fois', 'apprendre'],
    de: ['Hilfe', 'Anfänger', 'zum ersten Mal', 'lernen'],
    it: ['aiuto', 'principiante', 'prima volta', 'imparare']
  },
  'bkend-expert': {
    en: ['bkend', 'BaaS', 'backend service', 'database setup', 'user auth', 'file upload', 'REST API', 'signup feature', 'login feature'],
    ko: ['bkend', '백엔드 서비스', '데이터베이스 설정', '사용자 인증', '파일 업로드', '회원가입 기능', '로그인 기능'],
    ja: ['bkend', 'バックエンドサービス', 'データベース設定', '認証設定', 'ファイルアップロード'],
    zh: ['bkend', '后端服务', '数据库设置', '用户认证', '文件上传'],
    es: ['bkend', 'servicio backend', 'base de datos', 'autenticación', 'carga de archivos'],
    fr: ['bkend', 'service backend', 'base de données', 'authentification', 'téléchargement'],
    de: ['bkend', 'Backend-Dienst', 'Datenbank-Setup', 'Authentifizierung', 'Datei-Upload'],
    it: ['bkend', 'servizio backend', 'database', 'autenticazione', 'caricamento file']
  }
};
```

**키워드 설계 원칙:**
- `dynamic` SKILL_TRIGGER_PATTERNS와 겹치는 'backend', '백엔드' 등은 의도적으로 제외 (충돌 방지)
- 대신 'backend service', '백엔드 서비스' 등 2-word 구문으로 차별화
- 'bkend', 'BaaS'는 bkend-expert 전용 (다른 패턴에 없음)
- 'signup feature', 'login feature' 등 기능 요청 형태의 키워드 포함

---

### 3.5 scripts/user-prompt-handler.js — BUG-01 수정 + G-04, G-05

#### 3.5.1 BUG-01 수정 (Line 72)

```javascript
// Before (Line 72)
if (agentMatch && agentMatch.confidence > 0.8) {

// After
if (agentMatch && agentMatch.confidence >= 0.8) {
```

#### 3.5.2 bkend 권장 분기 로직 (Line 95 뒤, Step 4 전)

기존 Step 3 (Skill trigger) 이후, Step 4 (Ambiguity) 전에 bkend 권장 로직 삽입:

```javascript
// Step 3.5: bkend recommendation for backend/DB requests (G-04, G-05)
if (skillMatch && skillMatch.skill === 'bkit:dynamic') {
  // Check if bkend MCP is configured
  const hasBkendMcp = checkBkendMcpConfig();
  if (!hasBkendMcp) {
    contextParts.push(
      '💡 bkend.ai MCP 미설정 감지: 사용자에게 다음을 안내하세요:\n' +
      '   claude mcp add bkend --transport http https://api.bkend.ai/mcp\n' +
      '   설정 후 자연어로 백엔드를 관리할 수 있습니다.'
    );
  }
}
```

#### 3.5.3 checkBkendMcpConfig 헬퍼 함수 (파일 상단 함수 영역)

```javascript
function checkBkendMcpConfig() {
  const fs = require('fs');
  const path = require('path');

  // Check .mcp.json in project root
  const mcpJsonPath = path.join(process.cwd(), '.mcp.json');
  if (fs.existsSync(mcpJsonPath)) {
    try {
      const content = fs.readFileSync(mcpJsonPath, 'utf-8');
      if (content.includes('bkend') || content.includes('api.bkend.ai')) {
        return true;
      }
    } catch (e) { /* ignore */ }
  }

  // Check .claude/settings.json
  const settingsPath = path.join(process.cwd(), '.claude', 'settings.json');
  if (fs.existsSync(settingsPath)) {
    try {
      const content = fs.readFileSync(settingsPath, 'utf-8');
      if (content.includes('bkend') || content.includes('api.bkend.ai')) {
        return true;
      }
    } catch (e) { /* ignore */ }
  }

  return false;
}
```

---

### 3.6 hooks/session-start.js — G-09

#### getTriggerKeywordTable() 함수 내 bkend-expert 행 추가 (Line 441 뒤)

```javascript
// Before (Line 440-442)
| help, 도움, 助けて, 帮助, ayuda, aide, Hilfe, aiuto | bkit:starter-guide | Beginner guide |

// After
| help, 도움, 助けて, 帮助, ayuda, aide, Hilfe, aiuto | bkit:starter-guide | Beginner guide |
| bkend, BaaS, backend service, 백엔드 서비스, バックエンドサービス, 后端服务 | bkit:bkend-expert | Backend/BaaS expert |
```

#### bkend MCP 상태 표시 (additionalContext 빌드 영역, Line 480 근처)

Session start 시 bkend MCP 설정 여부를 체크하여 안내 메시지 추가:

```javascript
// bkend MCP status check (G-09)
const mcpJsonPath = path.join(process.cwd(), '.mcp.json');
let bkendMcpStatus = '';
if (fs.existsSync(mcpJsonPath)) {
  try {
    const mcpContent = fs.readFileSync(mcpJsonPath, 'utf-8');
    if (mcpContent.includes('bkend') || mcpContent.includes('api.bkend.ai')) {
      bkendMcpStatus = '✅ bkend.ai MCP: Connected';
    }
  } catch (e) { /* ignore */ }
}
// Add to additionalContext if Dynamic level detected
if (level === 'Dynamic' && !bkendMcpStatus) {
  bkendMcpStatus = '💡 bkend.ai MCP: Not configured. Run: claude mcp add bkend --transport http https://api.bkend.ai/mcp';
}
```

---

### 3.7 templates/plan.template.md — G-08

#### Section 6.1 Dynamic 행 수정 (Line 109)

```markdown
// Before (Line 109)
| Dynamic | Feature-based modules, services layer | Web apps with backend, SaaS MVPs |

// After
| Dynamic | Feature-based modules, BaaS integration (bkend.ai) | Web apps with backend, SaaS MVPs, fullstack apps |
```

#### Section 6.2 Key Architectural Decisions에 Backend 행 추가 (Line 121 뒤)

```markdown
| Backend | BaaS (bkend.ai) / Custom Server / Serverless | Dynamic → bkend.ai recommended |
```

#### Section 6.3 Dynamic 폴더 프리뷰 업데이트 (Line 131-135)

```markdown
// Before
src/components/, src/features/, src/services/, src/types/, src/lib/

// After
src/components/, src/features/, src/services/, src/types/, src/lib/bkend.ts, .mcp.json
```

---

### 3.8 templates/design.template.md — G-08

#### Section 2.1 Architecture Diagram에 BaaS 패턴 추가 (Line 59 뒤)

```markdown
### BaaS Architecture (Dynamic Level)

Client (Next.js) → bkend.ai Service API (REST) → MongoDB
                 ↕ MCP (schema management)
              Claude Code
```

#### Section 3.3 Database Schema에 MongoDB 패턴 추가 (Line 106 뒤)

```markdown
### MongoDB Collection Schema (Dynamic Level - bkend.ai)

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| _id | ObjectId | auto | auto | System generated |
| createdBy | String | auto | - | Creator user ID |
| createdAt | Date | auto | - | Creation timestamp |
| updatedAt | Date | auto | - | Update timestamp |
```

#### Section 4 API Specification에 BaaS 참고 추가 (Line 148 뒤)

```markdown
### BaaS API (Dynamic Level)
Dynamic 레벨은 bkend.ai 자동 생성 REST API 사용.
테이블 생성 시 CRUD 엔드포인트가 자동 생성됨 (별도 API 구현 불필요).
상세: MCP 도구 `4_howto_implement_data_crud` 참조
```

---

### 3.9 bkend 전문 Skills 신규 생성 — G-10, G-11, G-12

#### 3.9.0 설계 배경

bkend.ai 공식 문서(102개) + cookbook(40개)을 분석한 결과, 3대 핵심 서비스(Database, Auth, Storage)를 중심으로 5개 도메인 Skill로 통합 분리한다.

**Context Engineering 원칙 적용:**
- bkend-expert Agent 본문 ~150줄로 유지 (현재 설계)
- 상세 도메인 지식은 전문 Skill로 위임 (컨텍스트 격리)
- Agent `skills_preload`로 핵심 3개 Skill 사전 로드 → 사용자가 bkend를 몰라도 AI Native 개발 가능

**CTO Team 구성 활용:**
- CTO Team에서 bkend-expert를 developer 역할로 배치 시, 전문 Skills가 자동 로드
- 각 Skill의 MCP 도구 참조로 실시간 bkend API 호출 가능

#### Skill 구성 총괄

| Skill | 대상 문서 범위 | 핵심 기능 | 우선순위 |
|-------|-------------|----------|---------|
| `bkend-quickstart` | getting-started(10), integrations(4), guides(1) | 온보딩, MCP 설정, 핵심 개념 | Should |
| `bkend-data` | database(15), api-reference(2) | 테이블, CRUD, 필터링, 인덱싱 | Must |
| `bkend-auth` | authentication(16), security(9), api-reference(2) | 인증, 세션, JWT, 소셜 로그인, RBAC | Must |
| `bkend-storage` | storage(10), api-reference(1) | 파일 업로드/다운로드, Presigned URL | Must |
| `bkend-cookbook` | cookbook(40), troubleshooting(5), guides(9) | 실전 프로젝트, 에러 해결 | Should |

**공유 템플릿**: `templates/shared/bkend-patterns.md` — 공통 API 패턴, 헤더, 에러 코드

---

#### 3.9.1 skills/bkend-quickstart/SKILL.md

```yaml
---
name: bkend-quickstart
description: |
  bkend.ai platform onboarding and core concepts guide.
  Covers MCP setup, resource hierarchy (Org→Project→Environment),
  Tenant vs User model, and first project creation.

  Use proactively when user is new to bkend or asks about initial setup.

  Triggers: bkend setup, first project, bkend 시작, 처음, 설정, MCP 연결,
  bkend始め方, 初期設定, bkend入门, 初始设置,
  configuración bkend, primer proyecto, configuration bkend, premier projet,
  bkend Einrichtung, erstes Projekt, configurazione bkend, primo progetto

  Do NOT use for: specific database/auth/storage operations (use domain-specific skills),
  enterprise infrastructure (use infra-architect).
user-invocable: false
agent: bkit:bkend-expert
allowed-tools:
  - Read
  - WebFetch
  - mcp__bkend__*
imports:
  - ${PLUGIN_ROOT}/templates/shared/bkend-patterns.md
---
```

**Body 구조:**

```markdown
# bkend.ai Quick Start Guide

## What is bkend.ai
MCP 기반 BaaS 플랫폼. Database, Authentication, Storage 3대 서비스 제공.
AI 도구(Claude Code, Cursor)에서 자연어로 백엔드 관리 가능.

## Resource Hierarchy
Organization (팀/결제) → Project (서비스 단위) → Environment (dev/staging/prod, 데이터 격리)

## Tenant vs User
- Tenant: 서비스 구축자 (OAuth 2.1 인증, MCP/관리 API 접근)
- User: 앱 사용자 (JWT 인증, 서비스 API 접근)
- 한 사람이 양쪽 역할 가능

## MCP Setup (Claude Code)
claude mcp add bkend --transport http https://api.bkend.ai/mcp
- OAuth 2.1 + PKCE (브라우저 자동 인증)
- 별도 API Key 불필요
- 확인: "bkend에 연결된 프로젝트를 보여줘"

## MCP Guide Tools (파라미터 없음)
| Tool | Purpose |
|------|---------|
| 0_get_context | 세션 컨텍스트 (org/project/env) |
| 1_concepts | 핵심 개념 (BSON, 권한, 계층) |
| 2_tutorial | 프로젝트~테이블 생성 튜토리얼 |

## First Project Checklist
1. bkend.ai 회원가입 → Organization 생성
2. Project 생성 → dev 환경 자동 생성
3. MCP 연결 → claude mcp add bkend
4. 첫 테이블 생성 → "users 테이블 만들어줘"
5. 데이터 작업 시작 → CRUD 자연어 요청

## Next Steps
- Database: bkend-data skill 참조
- Authentication: bkend-auth skill 참조
- File Storage: bkend-storage skill 참조
```

---

#### 3.9.2 skills/bkend-data/SKILL.md

```yaml
---
name: bkend-data
description: |
  bkend.ai database expert skill.
  Covers table creation, CRUD operations, 7 column types, constraints,
  filtering (AND/OR, 8 operators), sorting, pagination, relations, joins,
  indexing, and schema management via MCP and REST API.

  Triggers: table, column, CRUD, schema, index, 테이블, 컬럼, 스키마, 인덱스,
  テーブル, カラム, スキーマ, 数据表, 列, 索引,
  tabla, columna, esquema, índice, tableau, colonne, schéma,
  Tabelle, Spalte, Schema, Index, tabella, colonna

  Do NOT use for: authentication (use bkend-auth), file storage (use bkend-storage),
  platform management (use bkend-quickstart).
user-invocable: false
agent: bkit:bkend-expert
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - mcp__bkend__*
imports:
  - ${PLUGIN_ROOT}/templates/shared/bkend-patterns.md
---
```

**Body 구조:**

```markdown
# bkend.ai Database Guide

## Column Types (7종)
| Type | Description | Example |
|------|-------------|---------|
| String | 텍스트 | name, email |
| Number | 숫자 | age, price |
| Boolean | 참/거짓 | isActive |
| Date | 날짜/시간 | birthDate |
| Array | 배열 | tags: ["a","b"] |
| Object | 중첩 객체 | address: {city, zip} |
| Mixed | 임의 타입 | metadata |

## Constraints
required, unique, default — 필드 생성 시 지정

## Auto System Fields
_id (ObjectId), createdBy (String), createdAt (Date), updatedAt (Date)

## MCP Database Tools
| Tool | Purpose |
|------|---------|
| backend_table_create | 테이블 생성 |
| backend_table_list | 목록 조회 |
| backend_table_get | 상세 + 스키마 확인 |
| backend_table_update | 설정 수정 |
| backend_table_delete | 삭제 |
| backend_field_manage | 필드 추가/수정/삭제 |
| backend_schema_version_list | 스키마 이력 |
| backend_schema_rollback | 스키마 롤백 |
| backend_index_manage | 인덱스 관리 |

## REST Data API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /v1/data/{table} | 목록 (filter, sort, page, limit) |
| POST | /v1/data/{table} | 생성 |
| GET | /v1/data/{table}/{id} | 단일 조회 |
| PATCH | /v1/data/{table}/{id} | 부분 수정 |
| DELETE | /v1/data/{table}/{id} | 삭제 |

## Filtering
- 텍스트 검색: ?search=keyword
- AND 필터: ?filter[field1]=value1&filter[field2]=value2
- 비교 연산자: eq, ne, gt, gte, lt, lte, in, nin
- 정렬: ?sort=field:asc (또는 desc)
- 페이지네이션: ?page=1&limit=20 (기본 20, 최대 100)

## Relations & Joins
- 테이블 간 관계 설정 가능
- 조인 쿼리로 관련 데이터 일괄 조회

## Index Management
- 단일/복합 인덱스 생성
- MCP backend_index_manage로 관리
- 성능 최적화에 필수
```

---

#### 3.9.3 skills/bkend-auth/SKILL.md

```yaml
---
name: bkend-auth
description: |
  bkend.ai authentication and security expert skill.
  Covers email signup/login, social login (Google, GitHub), magic link,
  JWT tokens (Access 1h, Refresh 7d), session management, RBAC (admin/user/self/guest),
  RLS policies, password management, and account lifecycle.

  Triggers: signup, login, JWT, session, social login, RBAC, RLS,
  회원가입, 로그인, 토큰, 세션, 권한, 보안정책,
  ログイン, 認証, セッション, 権限, 登录, 认证, 权限,
  registro, inicio de sesión, permisos, inscription, connexion, permissions,
  Registrierung, Anmeldung, Berechtigungen, registrazione, accesso, permessi

  Do NOT use for: database CRUD (use bkend-data), file storage (use bkend-storage),
  enterprise-level security architecture (use security-architect).
user-invocable: false
agent: bkit:bkend-expert
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - mcp__bkend__*
imports:
  - ${PLUGIN_ROOT}/templates/shared/bkend-patterns.md
---
```

**Body 구조:**

```markdown
# bkend.ai Authentication & Security Guide

## Auth Methods
| Method | Description |
|--------|-------------|
| Email + Password | 이메일/비밀번호 회원가입/로그인 |
| Social (Google) | OAuth 2.0 소셜 로그인 |
| Social (GitHub) | OAuth 2.0 소셜 로그인 |
| Magic Link | 이메일 링크 로그인 (비밀번호 없음) |

## JWT Token Structure
- Access Token: 1시간 유효
- Refresh Token: 7일 유효
- 자동 갱신: POST /v1/auth/refresh

## Password Policy
8자 이상, 대소문자 + 숫자 + 특수문자

## MCP Auth Tools
| Tool | Purpose |
|------|---------|
| 3_howto_implement_auth | 인증 구현 패턴 가이드 |
| 6_code_examples_auth | 인증 코드 예시 |

## REST Auth API (주요 18 엔드포인트)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /v1/auth/email/signup | 회원가입 |
| POST | /v1/auth/email/signin | 로그인 |
| GET | /v1/auth/me | 현재 사용자 |
| POST | /v1/auth/refresh | 토큰 갱신 |
| POST | /v1/auth/signout | 로그아웃 |
| GET | /v1/auth/{provider}/authorize | 소셜 로그인 URL |
| POST | /v1/auth/{provider}/callback | 소셜 콜백 |
| POST | /v1/auth/password/reset/request | 비밀번호 재설정 요청 |
| POST | /v1/auth/password/reset/confirm | 비밀번호 재설정 확인 |
| POST | /v1/auth/email/verify/send | 이메일 인증 발송 |

## RBAC (Role-Based Access Control)
| Group | Description | 범위 |
|-------|-------------|------|
| admin | 전체 CRUD | 모든 데이터 |
| user | 인증된 사용자 | 전체 읽기, 자신의 쓰기 |
| self | 본인만 | createdBy 기준 |
| guest | 비인증 | 보통 읽기만 |

## RLS (Row Level Security)
- 테이블별 행 단위 접근 제어
- admin/user/self/guest 4단계 정책
- createdBy 필드 기준 자동 필터링

## Session Management
- 디바이스별 세션 추적
- GET /v1/auth/sessions — 세션 목록
- DELETE /v1/auth/sessions/{id} — 세션 삭제

## Account Lifecycle
소셜 계정 연동/해제, 계정 존재 확인, 탈퇴
```

---

#### 3.9.4 skills/bkend-storage/SKILL.md

```yaml
---
name: bkend-storage
description: |
  bkend.ai file storage expert skill.
  Covers single/multiple/multipart file upload via Presigned URL,
  file download (CDN vs Presigned), 4 visibility levels (public/private/protected/shared),
  bucket management, and file metadata.

  Triggers: file upload, download, presigned, bucket, storage, CDN,
  파일 업로드, 다운로드, 버킷, 스토리지,
  ファイルアップロード, ダウンロード, バケット,
  文件上传, 下载, 存储桶,
  carga de archivos, descarga, almacenamiento,
  téléchargement, téléversement, stockage,
  Datei-Upload, Download, Speicher,
  caricamento file, scaricamento, archiviazione

  Do NOT use for: database operations (use bkend-data), authentication (use bkend-auth).
user-invocable: false
agent: bkit:bkend-expert
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - mcp__bkend__*
imports:
  - ${PLUGIN_ROOT}/templates/shared/bkend-patterns.md
---
```

**Body 구조:**

```markdown
# bkend.ai Storage Guide

## Upload Methods
| Method | Use Case | Process |
|--------|----------|---------|
| Single | 일반 파일 | Presigned URL 생성 → PUT 업로드 → 메타데이터 등록 |
| Multiple | 여러 파일 | 반복 호출 |
| Multipart | 대용량 | 초기화 → 파트별 URL → 완료 |

## Presigned URL
- 유효 시간: 15분
- PUT method로 파일 바이너리 직접 업로드
- Content-Type 헤더 필수

## File Visibility (4단계)
| Level | Access | URL Type |
|-------|--------|----------|
| public | 누구나 | CDN URL (만료 없음) |
| private | 소유자만 | Presigned URL (1시간) |
| protected | 인증 사용자 | Presigned URL (1시간) |
| shared | 지정 대상 | Presigned URL (1시간) |

## Size Limits
- 이미지: 10MB
- 비디오: 100MB
- 문서: 20MB

## Storage Categories
images, documents, media, attachments

## REST Storage API
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /v1/files/presigned-url | Presigned URL 생성 |
| POST | /v1/files | 메타데이터 등록 (업로드 완료) |
| GET | /v1/files | 파일 목록 |
| GET | /v1/files/{id} | 파일 상세 |
| PATCH | /v1/files/{id} | 메타데이터 수정 |
| DELETE | /v1/files/{id} | 파일 삭제 |
| GET | /v1/files/{id}/download-url | 다운로드 URL 생성 |

## MCP Storage Tool
| Tool | Purpose |
|------|---------|
| 7_code_examples_data | CRUD + 파일 업로드 코드 예시 |

## Upload Flow (Single File)
1. POST /v1/files/presigned-url → { url, fileId }
2. PUT {url} with file binary + Content-Type header
3. POST /v1/files with { fileId, filename, ... }
```

---

#### 3.9.5 skills/bkend-cookbook/SKILL.md

```yaml
---
name: bkend-cookbook
description: |
  bkend.ai practical project tutorials and troubleshooting guide.
  Covers 10 single-project guides (todo to SaaS) and 4 full-guide projects
  (blog, recipe-app, shopping-mall, social-network) with step-by-step implementation.
  Also includes common error solutions and FAQ.

  Triggers: cookbook, tutorial, example project, todo app, blog app, shopping mall,
  쿡북, 튜토리얼, 예제, 블로그, 쇼핑몰, 투두,
  クックブック, チュートリアル, 例, 食谱, 教程, 示例,
  libro de cocina, tutorial, ejemplo, livre de recettes, tutoriel, exemple,
  Kochbuch, Tutorial, Beispiel, ricettario, tutorial, esempio

  Do NOT use for: API reference details (use bkend-data/auth/storage),
  platform management (use bkend-quickstart).
user-invocable: false
agent: bkit:bkend-expert
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - mcp__bkend__*
imports:
  - ${PLUGIN_ROOT}/templates/shared/bkend-patterns.md
---
```

**Body 구조:**

```markdown
# bkend.ai Cookbook & Troubleshooting

## Single Project Guides (초급~고급)
| Project | Level | Key Features |
|---------|-------|-------------|
| Todo App | 초급 | 기본 CRUD, 상태 관리 |
| Blog | 중급 | 게시글, 태그, 파일 업로드 |
| E-commerce | 중급 | 상품, 주문, 결제 |
| Chat App | 중급 | 실시간 메시지 |
| SaaS Starter | 고급 | 멀티테넌트, 구독, 대시보드 |

## Full Guide Projects (4종, 각 quick-start + 7편)
| Project | Auth | Core CRUD | Files | Advanced | AI |
|---------|------|-----------|-------|----------|-----|
| Blog | 이메일/소셜 | Articles, Tags | 이미지 | Bookmarks | AI 요약 |
| Recipe App | 이메일/소셜 | Recipes, Ingredients | 사진 | Meal Plan, Shopping List | AI 추천 |
| Shopping Mall | 이메일/소셜 | Stores, Products, Orders | 상품 이미지 | Reviews | AI 검색 |
| Social Network | 이메일/소셜 | Profiles, Posts | 미디어 | Follows, Feeds | AI 추천 |

## Common Pattern (모든 프로젝트)
Auth → Core CRUD → File Upload → Advanced Features → AI Integration → Troubleshooting

## Troubleshooting Quick Reference
| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Token 만료 | POST /v1/auth/refresh |
| 403 Forbidden | 권한 부족 | RBAC 설정 확인 |
| 404 Not Found | 잘못된 경로/ID | 엔드포인트, 환경 확인 |
| 409 Conflict | unique 필드 중복 | 중복 데이터 확인 |
| 429 Rate Limit | 요청 한도 초과 (100/h) | Retry-After 헤더 참고 |
| CORS Error | 도메인 미등록 | bkend 콘솔에서 등록 |
| MCP 연결 실패 | OAuth 미완료 | 브라우저 인증 확인 |

## FAQ
- "테이블이 안 보여요" → 환경(dev/staging/prod) 확인
- "MCP 도구가 안 나와요" → claude mcp list로 연결 확인
- "소셜 로그인 안 돼요" → 콘솔에서 Provider 설정 확인
```

---

#### 3.9.6 templates/shared/bkend-patterns.md — G-12

5개 bkend Skill에서 공통으로 import하는 공유 패턴 파일:

```markdown
# bkend.ai Common Patterns

## Required Headers (REST Service API)
x-project-id: {projectId}
x-environment: dev | staging | prod
Authorization: Bearer {accessToken}
Content-Type: application/json

## Base URL
https://api.bkend.ai/v1

## Error Response Format
{ "error": { "code": "ERROR_CODE", "message": "Human readable message" } }

## HTTP Status Mapping
| Status | Meaning |
|--------|---------|
| 200 | 성공 |
| 400 | 잘못된 요청 (validation) |
| 401 | 인증 필요/만료 |
| 403 | 권한 부족 |
| 404 | 리소스 없음 |
| 409 | 충돌 (unique 위반) |
| 429 | 요청 한도 초과 (100/h) |
| 500 | 서버 오류 |

## MCP Endpoint
https://api.bkend.ai/mcp
- Transport: Streamable HTTP
- Protocol: JSON-RPC 2.0
- Auth: OAuth 2.1 + PKCE

## Environment Auto-Provisioning
| Plan | Available Environments |
|------|----------------------|
| Free | dev (1개) |
| Pro | dev, staging, prod |
| Enterprise | dev, staging, prod + custom |
```

---

#### 3.9.7 Agent-Skill 양방향 바인딩 업데이트 요약

| 방향 | 변경 내용 |
|------|----------|
| Skill → Agent | 5개 신규 Skill 모두 `agent: bkit:bkend-expert` |
| Agent → Skills | `bkend-expert.md`의 `skills` 필드에 5개 추가 |
| Agent → Preload | `skills_preload`에 핵심 3개 (bkend-data, bkend-auth, bkend-storage) |
| Shared Template | 5개 Skill 모두 `imports: bkend-patterns.md` |

#### 3.9.8 CTO Team 구성 시 활용

Agent Teams 환경에서 bkend-expert가 developer 역할로 배치될 때:

```
CTO Team (Dynamic Level)
├── cto-lead (opus) — 전략/조율
│   └── skills: [enterprise, pdca]
├── bkend-expert (sonnet) — bkend 구현
│   └── skills: [dynamic, bkend-data, bkend-auth, bkend-storage, bkend-quickstart, bkend-cookbook]
│   └── skills_preload: [bkend-data, bkend-auth, bkend-storage]
└── qa-monitor (haiku) — 검증
    └── skills: [zero-script-qa]
```

---

## 4. 구현 순서

| 순서 | 파일 | 이유 |
|------|------|------|
| 1 | `scripts/user-prompt-handler.js` | BUG-01 수정 (다른 변경의 전제 조건) |
| 2 | `lib/intent/language.js` | Agent Trigger 패턴 추가 (독립적) |
| 3 | `templates/shared/bkend-patterns.md` | 공유 템플릿 (Skills의 의존성) |
| 4 | `skills/bkend-data/SKILL.md` | 핵심 Skill 신규 생성 |
| 5 | `skills/bkend-auth/SKILL.md` | 핵심 Skill 신규 생성 |
| 6 | `skills/bkend-storage/SKILL.md` | 핵심 Skill 신규 생성 |
| 7 | `skills/bkend-quickstart/SKILL.md` | 온보딩 Skill 신규 생성 |
| 8 | `skills/bkend-cookbook/SKILL.md` | 레퍼런스 Skill 신규 생성 |
| 9 | `agents/bkend-expert.md` | Agent 재작성 + Skills 바인딩 |
| 10 | `skills/dynamic/SKILL.md` | MCP 현행화 + 내용 확충 |
| 11 | `skills/phase-4-api/SKILL.md` | BaaS 구현 가이드 추가 |
| 12 | `hooks/session-start.js` | 트리거 테이블 + MCP 상태 표시 |
| 13 | `templates/plan.template.md` | BaaS 옵션 추가 |
| 14 | `templates/design.template.md` | BaaS 아키텍처 + MongoDB 스키마 |

**병렬 가능**:
- 순서 2, 3은 독립적이므로 동시 진행 가능
- 순서 4, 5, 6, 7, 8은 순서 3 완료 후 모두 병렬 가능 (각 Skill이 독립적)
- 순서 13, 14도 동시 진행 가능

---

## 5. 검증 항목 (Verification)

| ID | 검증 항목 | 관련 목표 | 검증 방법 |
|----|----------|----------|----------|
| V-01 | BUG-01 수정 확인 | BUG-01 | confidence >= 0.8 비교 확인 |
| V-02 | bkend-expert Agent Trigger 동작 | G-03 | "bkend" 키워드 매칭 확인 |
| V-03 | bkend-expert Agent 내용 충실도 | G-01 | MCP Tools 19개 + REST API 엔드포인트 참조 확인 |
| V-04 | Agent 문서 길이 | G-01 | ~150줄 이내 확인 |
| V-05 | MCP 설정 현행화 | G-02 | type: "http" 방식 확인 |
| V-06 | OAuth 인증 방식 반영 | G-02 | API Key 제거, OAuth 설명 확인 |
| V-07 | bkend Client 패턴 업데이트 | G-06 | REST 서비스 API 직접 호출 패턴 확인 |
| V-08 | phase-4-api BaaS 가이드 | G-07 | Dynamic Level 구현 가이드 섹션 존재 확인 |
| V-09 | bkend 권장 분기 로직 | G-04 | dynamic skill 매칭 시 bkend 안내 확인 |
| V-10 | MCP 설정 감지 로직 | G-05 | .mcp.json, settings.json 확인 로직 존재 |
| V-11 | session-start 트리거 테이블 | G-09 | bkend-expert 행 존재 확인 |
| V-12 | session-start MCP 상태 표시 | G-09 | Dynamic 레벨에서 MCP 미설정 시 안내 확인 |
| V-13 | plan 템플릿 BaaS 옵션 | G-08 | Dynamic 행에 BaaS 언급 확인 |
| V-14 | design 템플릿 BaaS 패턴 | G-08 | MongoDB 스키마 + BaaS 아키텍처 확인 |
| V-15 | Troubleshooting 12+ 항목 | G-11 | 에러 시나리오 수 확인 |
| V-16 | Agent Delegation 가이드 | 철학 | 다른 Agent 위임 섹션 존재 확인 |
| V-17 | Automation First 준수 | 철학 | 자동 트리거/자동 제안으로 구현 확인 |
| V-18 | No Guessing 준수 | 철학 | AskUserQuestion 유도 가이드 존재 확인 |
| V-19 | 키워드 충돌 없음 | G-03 | dynamic SKILL_TRIGGER와 중복 키워드 없음 확인 |
| V-20 | Do NOT use for 범위 적절 | 철학 | Enterprise/인프라 위임 명시 확인 |
| V-21 | bkend-data Skill 존재 | G-10 | skills/bkend-data/SKILL.md 파일 존재 확인 |
| V-22 | bkend-auth Skill 존재 | G-10 | skills/bkend-auth/SKILL.md 파일 존재 확인 |
| V-23 | bkend-storage Skill 존재 | G-10 | skills/bkend-storage/SKILL.md 파일 존재 확인 |
| V-24 | bkend-quickstart Skill 존재 | G-10 | skills/bkend-quickstart/SKILL.md 파일 존재 확인 |
| V-25 | bkend-cookbook Skill 존재 | G-10 | skills/bkend-cookbook/SKILL.md 파일 존재 확인 |
| V-26 | Skill Frontmatter 유효성 | G-10 | 5개 Skill 모두 name, description, agent, allowed-tools 필드 존재 |
| V-27 | mcp__bkend__* 와일드카드 | G-10 | 5개 Skill 모두 allowed-tools에 mcp__bkend__* 포함 |
| V-28 | Agent-Skill 양방향 바인딩 | G-11 | bkend-expert.md skills에 5개 Skill 포함 확인 |
| V-29 | skills_preload 핵심 3개 | G-11 | bkend-expert.md skills_preload에 data, auth, storage 확인 |
| V-30 | 공유 템플릿 존재 | G-12 | templates/shared/bkend-patterns.md 파일 존재 확인 |
| V-31 | imports 연결 | G-12 | 5개 Skill 모두 bkend-patterns.md import 확인 |
| V-32 | user-invocable: false | G-10 | 5개 Skill 모두 user-invocable: false 확인 |
| V-33 | 8개 언어 Trigger | G-10 | 5개 Skill 모두 8개 언어 키워드 포함 확인 |
| V-34 | Do NOT use for 상호 배제 | G-10 | 각 Skill이 다른 Skill 도메인으로 위임 확인 |

---

## 6. 철학 준수 매핑

| 철학 원칙 | 설계 내 구현 | 검증 항목 |
|-----------|-------------|----------|
| Automation First | G-03 Agent Trigger, G-04 권장 분기, G-05 MCP 감지, G-11 skills_preload | V-02, V-09, V-10, V-17, V-29 |
| No Guessing | Agent Work Rules "문서 먼저", "불확실하면 AskUserQuestion" | V-18 |
| Docs = Code | Agent Work Rules "설계 문서 먼저 업데이트" | V-03 |
| Context Engineering | Agent ~150줄 + 도메인별 Skill 분리, 상세는 MCP 문서 도구에 위임 | V-04, V-26, V-34 |
| Level System | Enterprise/Dynamic/Starter 분기, Do NOT use for | V-09, V-20 |
| Agent 역할 경계 | Agent Delegation + Skill 상호 배제 (Do NOT use for) | V-16, V-20, V-34 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-06 | 초기 설계서 - CTO Team 4-agent 병렬 분석 기반 | CTO Team |
| 1.1 | 2026-02-06 | bkend 전문 Skills 5개 + 공유 템플릿 추가 (G-10~G-12, V-21~V-34) | CTO Team |
