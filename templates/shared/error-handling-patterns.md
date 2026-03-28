# Error Handling Patterns

> Shared error handling patterns for Skills and Agents
>
> Usage: Add to frontmatter imports in SKILL.md or Agent.md
> ```yaml
> imports:
>   - ${PLUGIN_ROOT}/templates/shared/error-handling-patterns.md
> ```

## Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

## Error Code Conventions

| Category | Prefix | Example |
|----------|--------|---------|
| Authentication | AUTH_ | AUTH_INVALID_TOKEN |
| Validation | VALIDATION_ | VALIDATION_REQUIRED_FIELD |
| Permission | PERMISSION_ | PERMISSION_DENIED |
| Resource | RESOURCE_ | RESOURCE_NOT_FOUND |
| Server | SERVER_ | SERVER_INTERNAL_ERROR |

## Error Handling Rules

1. **Always return structured errors** - Never expose raw exceptions
2. **Use appropriate HTTP status codes**:
   - 400: Client error (validation, bad request)
   - 401: Authentication required
   - 403: Permission denied
   - 404: Resource not found
   - 500: Server error
3. **Log errors with context** - Include request ID, user ID, timestamp
4. **Sanitize error messages** - Remove sensitive data before response

## Try-Catch Pattern

```javascript
try {
  // Operation
} catch (error) {
  debugLog('ModuleName', 'Operation failed', {
    error: error.message,
    context: { /* relevant data */ }
  });

  return {
    success: false,
    error: {
      code: categorizeError(error),
      message: sanitizeErrorMessage(error)
    }
  };
}
```

## Sentry Integration (Enterprise Level)

### Frontend — Next.js Error Boundary + Sentry

```typescript
// app/error.tsx (Next.js App Router)
'use client';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Backend — FastAPI Error Middleware + Sentry

```python
# services/shared/middleware/error_handler.py
import sentry_sdk
from fastapi import Request
from fastapi.responses import JSONResponse

async def error_handler(request: Request, exc: Exception):
    # Sentry captures automatically via ASGI integration
    # Add custom context for Self-Healing Agent
    sentry_sdk.set_context("request", {
        "url": str(request.url),
        "method": request.method,
        "headers": dict(request.headers),
    })
    sentry_sdk.set_tag("service", SERVICE_NAME)

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "SERVER_INTERNAL_ERROR",
                "message": "An unexpected error occurred",
                "request_id": request.state.request_id,
            }
        }
    )
```

### Error Severity → Self-Healing Mapping

| Sentry Level | Self-Healing Action | Auto-Rollback |
|-------------|---------------------|---------------|
| Fatal | Immediate escalation (PagerDuty) | Yes |
| Error (new) | Self-Healing trigger | No (wait for fix) |
| Error (regression) | Self-Healing + PagerDuty | Yes if spike |
| Warning | Log only | No |
| Info | Ignore | No |

### Structured Logging for Sentry Correlation

```python
# JSON log format — correlates with Sentry events
import structlog

logger = structlog.get_logger()

logger.error(
    "payment_failed",
    user_id=user.id,
    amount=amount,
    error=str(exc),
    trace_id=span.trace_id,        # Links to Tempo trace
    sentry_event_id=sentry_sdk.last_event_id(),  # Links to Sentry
    request_id=request.state.request_id,
)
```
