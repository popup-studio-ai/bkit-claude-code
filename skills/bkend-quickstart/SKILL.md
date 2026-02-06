---
name: bkend-quickstart
description: |
  bkend.ai platform onboarding and core concepts guide.
  Covers MCP setup, resource hierarchy (Org->Project->Environment),
  Tenant vs User model, and first project creation.

  Use proactively when user is new to bkend or asks about initial setup.

  Triggers: bkend setup, first project, bkend start, MCP connect,
  bkend 시작, 처음, 설정, MCP 연결, 프로젝트 생성,
  bkend始め方, 初期設定, MCP接続, bkend入门, 初始设置, MCP连接,
  configuracion bkend, primer proyecto, configuration bkend, premier projet,
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

# bkend.ai Quick Start Guide

## What is bkend.ai

MCP-based BaaS platform providing Database, Authentication, and Storage services.
Manage backend via natural language from AI tools (Claude Code, Cursor).

## Resource Hierarchy

```
Organization (team/billing) -> Project (service unit) -> Environment (dev/staging/prod, data isolation)
```

## Tenant vs User

- **Tenant**: Service builder (OAuth 2.1 auth, MCP/Management API access)
- **User**: App end-user (JWT auth, Service API access)
- One person can have both roles

## MCP Setup (Claude Code)

```bash
claude mcp add bkend --transport http https://api.bkend.ai/mcp
```

- OAuth 2.1 + PKCE (browser auto-auth)
- No API Key needed
- Verify: "Show my connected bkend projects"

## MCP Guide Tools (No Parameters)

| Tool | Purpose |
|------|---------|
| 0_get_context | Session context (org/project/env) |
| 1_concepts | Core concepts (BSON, permissions, hierarchy) |
| 2_tutorial | Project~table creation tutorial |

## First Project Checklist

1. Sign up at bkend.ai -> Create Organization
2. Create Project -> dev environment auto-created
3. Connect MCP -> `claude mcp add bkend`
4. Create first table -> "Create a users table"
5. Start data operations -> CRUD via natural language

## Console URL

```
https://console.bkend.ai
```

## Next Steps

- Database operations: refer to bkend-data skill
- Authentication: refer to bkend-auth skill
- File storage: refer to bkend-storage skill
- Practical tutorials: refer to bkend-cookbook skill
