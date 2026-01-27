---
name: zero-script-qa
description: |
  Zero Script QA - Testing methodology without test scripts.
  Uses structured JSON logging and real-time Docker monitoring for verification.

  Use proactively when user needs to verify features through log analysis instead of test scripts.

  Triggers: zero script qa, log-based testing, docker logs, 제로 스크립트 QA, ゼロスクリプトQA, 零脚本QA,
  QA sin scripts, pruebas basadas en logs, registros de docker,
  QA sans script, tests basés sur les logs, journaux docker,
  skriptloses QA, log-basiertes Testen, Docker-Logs,
  QA senza script, test basati sui log, log docker

  Do NOT use for: unit testing, static analysis, or projects without Docker setup.
context: fork
agent: bkit:qa-monitor
# hooks: Managed by hooks/hooks.json (unified-bash-pre.js, unified-stop.js) - GitHub #9354 workaround
---

# Zero Script QA Expert Knowledge

## Overview

Zero Script QA is a methodology that verifies features through **structured logs** and **real-time monitoring** without writing test scripts.

```
Traditional: Write test code → Execute → Check results → Maintain
Zero Script: Build log infrastructure → Manual UX test → AI log analysis → Auto issue detection
```

## Core Principles

### 1. Log Everything
- All API calls (including 200 OK)
- All errors
- All important business events
- Entire flow trackable via Request ID

### 2. Structured JSON Logs
- Parseable JSON format
- Consistent fields (timestamp, level, request_id, message, data)
- Different log levels per environment

### 3. Real-time Monitoring
- Docker log streaming
- Claude Code analyzes in real-time
- Immediate issue detection and documentation

---

## Logging Architecture

### JSON Log Format Standard

```json
{
  "timestamp": "2026-01-08T10:30:00.000Z",
  "level": "INFO",
  "service": "api",
  "request_id": "req_abc123",
  "message": "API Request completed",
  "data": {
    "method": "POST",
    "path": "/api/users",
    "status": 200,
    "duration_ms": 45
  }
}
```

### Required Log Fields

| Field | Type | Description |
|-------|------|-------------|
| timestamp | ISO 8601 | Time of occurrence |
| level | string | DEBUG, INFO, WARNING, ERROR |
| service | string | Service name (api, web, worker, etc.) |
| request_id | string | Request tracking ID |
| message | string | Log message |
| data | object | Additional data (optional) |

### Log Level Policy

| Environment | Minimum Level | Purpose |
|-------------|---------------|---------|
| Local | DEBUG | Development and QA |
| Staging | DEBUG | QA and integration testing |
| Production | INFO | Operations monitoring |

---

## Request ID Propagation

### Concept

```
Client → API Gateway → Backend → Database
   ↓         ↓           ↓          ↓
req_abc   req_abc     req_abc    req_abc

Trackable with same Request ID across all layers
```

### Implementation Patterns

#### 1. Request ID Generation (Entry Point)
```typescript
// middleware.ts
import { v4 as uuidv4 } from 'uuid';

export function generateRequestId(): string {
  return `req_${uuidv4().slice(0, 8)}`;
}

// Propagate via header
headers['X-Request-ID'] = requestId;
```

#### 2. Request ID Extraction and Propagation
```typescript
// API client
const requestId = headers['X-Request-ID'] || generateRequestId();

// Include in all logs
logger.info('Processing request', { request_id: requestId });

// Include in header when calling downstream services
await fetch(url, {
  headers: { 'X-Request-ID': requestId }
});
```

---

## Backend Logging (FastAPI)

### Logging Middleware

```python
# middleware/logging.py
import logging
import time
import uuid
import json
from fastapi import Request

class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "service": "api",
            "request_id": getattr(record, 'request_id', 'N/A'),
            "message": record.getMessage(),
        }
        if hasattr(record, 'data'):
            log_record["data"] = record.data
        return json.dumps(log_record)

class LoggingMiddleware:
    async def __call__(self, request: Request, call_next):
        request_id = request.headers.get('X-Request-ID', f'req_{uuid.uuid4().hex[:8]}')
        request.state.request_id = request_id

        start_time = time.time()

        # Request logging
        logger.info(
            f"Request started",
            extra={
                'request_id': request_id,
                'data': {
                    'method': request.method,
                    'path': request.url.path,
                    'query': str(request.query_params)
                }
            }
        )

        response = await call_next(request)

        duration = (time.time() - start_time) * 1000

        # Response logging (including 200 OK!)
        logger.info(
            f"Request completed",
            extra={
                'request_id': request_id,
                'data': {
                    'status': response.status_code,
                    'duration_ms': round(duration, 2)
                }
            }
        )

        response.headers['X-Request-ID'] = request_id
        return response
```

### Business Logic Logging

```python
# services/user_service.py
def create_user(data: dict, request_id: str):
    logger.info("Creating user", extra={
        'request_id': request_id,
        'data': {'email': data['email']}
    })

    # Business logic
    user = User(**data)
    db.add(user)
    db.commit()

    logger.info("User created", extra={
        'request_id': request_id,
        'data': {'user_id': user.id}
    })

    return user
```

---

## Frontend Logging (Next.js)

### Logger Module

```typescript
// lib/logger.ts
type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';

interface LogData {
  request_id?: string;
  [key: string]: any;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARNING: 2,
  ERROR: 3,
};

const MIN_LEVEL = process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG';

function log(level: LogLevel, message: string, data?: LogData) {
  if (LOG_LEVELS[level] < LOG_LEVELS[MIN_LEVEL]) return;

  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    service: 'web',
    request_id: data?.request_id || 'N/A',
    message,
    data: data ? { ...data, request_id: undefined } : undefined,
  };

  console.log(JSON.stringify(logEntry));
}

export const logger = {
  debug: (msg: string, data?: LogData) => log('DEBUG', msg, data),
  info: (msg: string, data?: LogData) => log('INFO', msg, data),
  warning: (msg: string, data?: LogData) => log('WARNING', msg, data),
  error: (msg: string, data?: LogData) => log('ERROR', msg, data),
};
```

### API Client Integration

```typescript
// lib/api-client.ts
import { logger } from './logger';
import { v4 as uuidv4 } from 'uuid';

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const requestId = `req_${uuidv4().slice(0, 8)}`;
  const startTime = Date.now();

  logger.info('API Request started', {
    request_id: requestId,
    method: options.method || 'GET',
    endpoint,
  });

  try {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        ...options.headers,
      },
    });

    const duration = Date.now() - startTime;
    const data = await response.json();

    // Log 200 OK too!
    logger.info('API Request completed', {
      request_id: requestId,
      status: response.status,
      duration_ms: duration,
    });

    if (!response.ok) {
      logger.error('API Request failed', {
        request_id: requestId,
        status: response.status,
        error: data.error,
      });
      throw new ApiError(data.error);
    }

    return data;
  } catch (error) {
    logger.error('API Request error', {
      request_id: requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
```

---

## Nginx JSON Logging

### nginx.conf Configuration

```nginx
http {
    log_format json_combined escape=json '{'
        '"timestamp":"$time_iso8601",'
        '"level":"INFO",'
        '"service":"nginx",'
        '"request_id":"$http_x_request_id",'
        '"message":"HTTP Request",'
        '"data":{'
            '"remote_addr":"$remote_addr",'
            '"method":"$request_method",'
            '"uri":"$request_uri",'
            '"status":$status,'
            '"body_bytes_sent":$body_bytes_sent,'
            '"request_time":$request_time,'
            '"upstream_response_time":"$upstream_response_time",'
            '"http_referer":"$http_referer",'
            '"http_user_agent":"$http_user_agent"'
        '}'
    '}';

    access_log /var/log/nginx/access.log json_combined;
}
```

---

## Docker-Based QA Workflow

### docker-compose.yml Configuration

```yaml
version: '3.8'
services:
  api:
    build: ./backend
    environment:
      - LOG_LEVEL=DEBUG
      - LOG_FORMAT=json
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  web:
    build: ./frontend
    environment:
      - NODE_ENV=development
    depends_on:
      - api

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
    depends_on:
      - api
      - web
```

### Real-time Log Monitoring

```bash
# Stream all service logs
docker compose logs -f

# Specific service only
docker compose logs -f api

# Filter errors only
docker compose logs -f | grep '"level":"ERROR"'

# Track specific Request ID
docker compose logs -f | grep 'req_abc123'
```

---

## QA Automation Workflow

### 1. Start Environment
```bash
# Start development environment
docker compose up -d

# Start log monitoring (Claude Code monitors)
docker compose logs -f
```

### 2. Manual UX Testing
```
User tests actual features in browser:
1. Sign up attempt
2. Login attempt
3. Use core features
4. Test edge cases
```

### 3. Claude Code Log Analysis
```
Claude Code in real-time:
1. Monitor log stream
2. Detect error patterns
3. Detect abnormal response times
4. Track entire flow via Request ID
5. Auto-document issues
```

### 4. Issue Documentation
```markdown
# QA Issue Report

## Issues Found

### ISSUE-001: Insufficient error handling on login failure
- **Request ID**: req_abc123
- **Severity**: Medium
- **Reproduction path**: Login → Wrong password
- **Log**:
  ```json
  {"level":"ERROR","message":"Login failed","data":{"error":"Invalid credentials"}}
  ```
- **Problem**: Error message not user-friendly
- **Recommended fix**: Add error code to message mapping
```

---

## Issue Detection Patterns

### 1. Error Detection
```json
{"level":"ERROR","message":"..."}
```
→ Report immediately

### 2. Slow Response Detection
```json
{"data":{"duration_ms":3000}}
```
→ Warning when exceeding 1000ms

### 3. Consecutive Failure Detection
```
3+ consecutive failures on same endpoint
```
→ Report potential system issue

### 4. Abnormal Status Codes
```json
{"data":{"status":500}}
```
→ Report 5xx errors immediately

---

## Phase Integration

| Phase | Zero Script QA Integration |
|-------|---------------------------|
| Phase 4 (API) | API response logging verification |
| Phase 6 (UI) | Frontend logging verification |
| Phase 7 (Security) | Security event logging verification |
| Phase 8 (Review) | Log quality review |
| Phase 9 (Deployment) | Production log level configuration |

---

## Iterative Test Cycle Pattern

Based on bkamp.ai notification feature development:

### Example: 8-Cycle Test Process

| Cycle | Pass Rate | Bug Found | Fix Applied |
|-------|-----------|-----------|-------------|
| 1st | 30% | DB schema mismatch | Schema migration |
| 2nd | 45% | NULL handling missing | Add null checks |
| 3rd | 55% | Routing error | Fix deeplinks |
| 4th | 65% | Type mismatch | Fix enum types |
| 5th | 70% | Calculation error | Fix count logic |
| 6th | 75% | Event missing | Add event triggers |
| 7th | 82% | Cache sync issue | Fix cache invalidation |
| 8th | **89%** | Stable | Final polish |

### Cycle Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                   Iterative Test Cycle                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Cycle N:                                                   │
│  1. Run test script (E2E or manual)                         │
│  2. Claude monitors logs in real-time                       │
│  3. Record pass/fail results                                │
│  4. Claude identifies root cause of failures                │
│  5. Fix code immediately (hot reload)                       │
│  6. Document: Cycle N → Bug → Fix                           │
│                                                             │
│  Repeat until acceptable pass rate (>85%)                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### E2E Test Script Template

```bash
#!/bin/bash
# E2E Test Script Template

API_URL="http://localhost:8000"
TOKEN="your-test-token"

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

test_feature_action() {
    echo -n "Testing: Feature action... "

    response=$(curl -s -X POST "$API_URL/api/v1/feature/action" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"param": "value"}')

    if [[ "$response" == *"expected_result"* ]]; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASS_COUNT++))
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "Response: $response"
        ((FAIL_COUNT++))
    fi
}

# Run all tests
test_feature_action
# ... more tests

# Summary
echo ""
echo "═══════════════════════════════════════"
echo "Test Results:"
echo -e "  ${GREEN}✅ PASS: $PASS_COUNT${NC}"
echo -e "  ${RED}❌ FAIL: $FAIL_COUNT${NC}"
echo -e "  ${YELLOW}⏭️  SKIP: $SKIP_COUNT${NC}"
echo "═══════════════════════════════════════"
```

### Test Cycle Documentation Template

```markdown
# Feature Test Results - Cycle N

## Summary
- **Date**: YYYY-MM-DD
- **Feature**: {feature name}
- **Pass Rate**: N%
- **Tests**: X passed / Y total

## Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| Test 1 | ✅ | |
| Test 2 | ❌ | {error description} |
| Test 3 | ⏭️ | {skip reason} |

## Bugs Found

### BUG-001: {Title}
- **Root Cause**: {description}
- **Fix**: {what was changed}
- **Files**: `path/to/file.py:123`

## Next Cycle Plan
- {what to test next}
```

---

## Checklist

### Logging Infrastructure
- [ ] JSON log format applied
- [ ] Request ID generation and propagation
- [ ] Log level settings per environment
- [ ] Docker logging configuration

### Backend Logging
- [ ] Logging middleware implemented
- [ ] All API calls logged (including 200 OK)
- [ ] Business logic logging
- [ ] Detailed error logging

### Frontend Logging
- [ ] Logger module implemented
- [ ] API client integration
- [ ] Error boundary logging

### QA Workflow
- [ ] Docker Compose configured
- [ ] Real-time monitoring ready
- [ ] Issue documentation template ready

---

## Auto-Apply Rules

### When Building Logging Infrastructure

When implementing API/Backend:
1. Suggest logging middleware creation
2. Suggest JSON format logger setup
3. Add Request ID generation/propagation logic

When implementing Frontend:
1. Suggest Logger module creation
2. Suggest logging integration with API client
3. Suggest including Request ID header

### When Performing QA

On test request:
1. Guide to run `docker compose logs -f`
2. Request manual UX testing from user
3. Real-time log monitoring
4. Document issues immediately when detected
5. Provide fix suggestions

### Issue Detection Thresholds

| Severity | Condition | Action |
|----------|-----------|--------|
| Critical | `level: ERROR` or `status: 5xx` | Immediate report |
| Critical | `duration_ms > 3000` | Immediate report |
| Critical | 3+ consecutive failures | Immediate report |
| Warning | `status: 401, 403` | Warning report |
| Warning | `duration_ms > 1000` | Warning report |
| Info | Missing log fields | Note for improvement |
| Info | Request ID not propagated | Note for improvement |

### Required Logging Locations

#### Backend (FastAPI/Express)
```
✅ Request start (method, path, params)
✅ Request complete (status, duration_ms)
✅ Major business logic steps
✅ Detailed info on errors
✅ Before/after external API calls
✅ DB queries (in development)
```

#### Frontend (Next.js/React)
```
✅ API call start
✅ API response received (status, duration)
✅ Detailed info on errors
✅ Important user actions
```
