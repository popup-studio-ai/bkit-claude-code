# bkend.ai Common Patterns

## Required Headers (REST Service API)

```
x-project-id: {projectId}
x-environment: dev | staging | prod
Authorization: Bearer {accessToken}
Content-Type: application/json
```

## Base URL

```
https://api.bkend.ai/v1
```

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
