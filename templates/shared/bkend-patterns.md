# bkend.ai Common Patterns

## MCP Fixed Tools (Always Available)

| Tool | Purpose | Parameters |
|------|---------|------------|
| `get_context` | Session context (org/project/env, API endpoint) | None |
| `search_docs` | Search bkend documentation (Auth/Storage guides) | query: string |
| `get_operation_schema` | Get tool input/output schema | operation: string, schemaType: "input" \| "output" |

**Important**: `get_context` MUST be called first. It returns the API endpoint URL dynamically.

## MCP Resources (Read-Only, Cached)

| URI Pattern | Description | Cache TTL |
|-------------|-------------|-----------|
| `bkend://orgs` | Organization list | 60s |
| `bkend://orgs/{orgId}/projects` | Project list | 60s |
| `bkend://orgs/{orgId}/projects/{pId}/environments` | Environment list | 60s |
| `bkend://orgs/{orgId}/projects/{pId}/environments/{eId}/tables` | Table list with schema | 60s |

Access via `resources/list` and `resources/read` MCP methods.
Prefer Resources over Tools for read-only listing (lighter, cached).

## REST Service API

Base URL is provided dynamically by `get_context` response.
Typical endpoints:
- MCP: https://api.bkend.ai/mcp
- Service API: Use the endpoint from `get_context` (e.g., https://api-client.bkend.ai/v1)

**Important**: Do NOT hardcode the Service API base URL. Always reference `get_context` output.

## Required Headers (REST Service API)

```
x-project-id: {projectId}
x-environment: dev | staging | prod
Authorization: Bearer {accessToken}
Content-Type: application/json
```

## API Response Format

List responses use consistent pagination:
```json
{
  "items": [...],
  "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

**ID Field**: Always use `id` (NOT `_id`).

## Query Parameters

### Filtering
- AND filter: `?filter[field]=value` (multiple fields = AND)
- Operators: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`
- Text search: `?search=keyword`

### Pagination & Sorting
- Page: `?page=1` (default: 1)
- Limit: `?limit=20` (default: 20, max: 100)
- Sort: `?sort=field:asc` (or `desc`)

## File Upload (Presigned URL)

- Presigned URL validity: 15 minutes
- Upload via PUT method with Content-Type header
- Complete upload by registering metadata: POST /v1/files

## Error Response Format

```json
{ "error": { "code": "ERROR_CODE", "message": "Human readable message" } }
```

## HTTP Status Mapping

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad Request (validation) |
| 401 | Unauthorized (token expired/missing) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (unique constraint violation) |
| 429 | Rate Limit Exceeded (100 requests/hour) |
| 500 | Internal Server Error |

## MCP Endpoint

```
URL: https://api.bkend.ai/mcp
Transport: Streamable HTTP
Protocol: JSON-RPC 2.0
Auth: OAuth 2.1 + PKCE
```

## MCP Setup (Claude Code)

```bash
claude mcp add bkend --transport http https://api.bkend.ai/mcp
```

## .mcp.json (Project Config)

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

## Authentication

- OAuth 2.1 + PKCE (browser auto-auth)
- No API Key needed
- Access Token: 1 hour
- Refresh Token: 30 days

## Environment Auto-Provisioning

| Plan | Available Environments |
|------|----------------------|
| Free | dev (1) |
| Pro | dev, staging, prod |
| Enterprise | dev, staging, prod + custom |

## Resource Hierarchy

```
Organization (team/billing) → Project (service unit) → Environment (dev/staging/prod, data isolation)
```
