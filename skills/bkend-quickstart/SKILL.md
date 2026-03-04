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

### Quick Setup (One Command)

```bash
claude mcp add bkend --transport http https://api.bkend.ai/mcp
```

### Step-by-Step Guide

1. **Prerequisites**: bkend.ai account (signup at https://console.bkend.ai)
2. **Run setup command**: `claude mcp add bkend --transport http https://api.bkend.ai/mcp`
3. **OAuth authentication**: Browser auto-opens for OAuth 2.1 + PKCE auth (no API key needed)
4. **Verify connection**: Ask "Show my connected bkend projects" or use `get_context` MCP tool
5. **Create .mcp.json** (optional, for team sharing):
   ```json
   {
     "mcpServers": {
       "bkend": {
         "type": "http",
         "url": "https://api.bkend.ai/mcp"
       }
     }
   }
   ```

### Troubleshooting MCP Connection

| Problem | Solution |
|---------|----------|
| OAuth popup not appearing | Check browser popup blocker |
| MCP tools not visible | Run `claude mcp list` to verify, re-add if needed |
| Connection lost | Re-authenticate (automatic on next MCP call) |
| Wrong project/env | Use `get_context` to check current session |

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

## MCP Resources (Read-Only)

Lightweight, cached (60s TTL) read-only queries via bkend:// URI:

| URI | Description |
|-----|-------------|
| `bkend://orgs` | Organization list |
| `bkend://orgs/{orgId}/projects` | Project list |
| `bkend://orgs/{orgId}/projects/{pId}/environments` | Environment list |
| `bkend://orgs/{orgId}/projects/{pId}/environments/{eId}/tables` | Table list with schema |

**Tip**: Prefer Resources over Tools for listing operations (lighter, cached).

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

## Official Documentation (Live Reference)

For the latest bkend documentation, use WebFetch:
- Quick Start: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/getting-started/02-quick-start.md
- Core Concepts: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/getting-started/03-core-concepts.md
- Claude Code Setup: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/ai-tools/04-claude-code-setup.md
- MCP Overview: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/mcp/01-overview.md
- Full TOC: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/SUMMARY.md
