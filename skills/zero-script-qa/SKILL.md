---
name: zero-script-qa
description: |
  Zero Script QA - Testing methodology without test scripts.
  Uses structured JSON logging and real-time Docker monitoring for verification.

  Triggers: zero script qa, log-based testing, docker logs, 제로 스크립트 QA, ゼロスクリプトQA, 零脚本QA
context: fork
agent: qa-monitor
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: prompt
          prompt: "Verify this bash command is safe for QA testing. No destructive operations (rm, drop, delete) allowed. Respond with JSON: {\"decision\": \"approve\"|\"block\", \"reason\": \"...\"}"
  Stop:
    - hooks:
        - type: prompt
          prompt: "Verify QA checks completed. Ensure all logs are analyzed and issues documented. Respond with JSON: {\"decision\": \"approve\", \"summary\": \"QA result summary\"}"
---

# Zero Script QA 전문 지식

## 개요

Zero Script QA는 테스트 스크립트 작성 없이 **구조화된 로그**와 **실시간 모니터링**으로 기능을 검증하는 방법론입니다.

```
기존 방식: 테스트 코드 작성 → 실행 → 결과 확인 → 유지보수
Zero Script: 로그 인프라 구축 → 수동 UX 테스트 → AI 로그 분석 → 자동 이슈 감지
```

## 핵심 원칙

### 1. 모든 것을 로깅한다
- 모든 API 호출 (200 OK 포함)
- 모든 에러
- 모든 중요 비즈니스 이벤트
- Request ID로 전체 플로우 추적 가능

### 2. 구조화된 JSON 로그
- 파싱 가능한 JSON 형식
- 일관된 필드 (timestamp, level, request_id, message, data)
- 환경별 로그 레벨 차별화

### 3. 실시간 모니터링
- Docker 로그 스트리밍
- Claude Code가 실시간 분석
- 이슈 즉시 감지 및 문서화

---

## 로깅 아키텍처

### JSON 로그 형식 표준

```json
{
  "timestamp": "2025-01-08T10:30:00.000Z",
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

### 필수 로그 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| timestamp | ISO 8601 | 발생 시각 |
| level | string | DEBUG, INFO, WARNING, ERROR |
| service | string | 서비스명 (api, web, worker 등) |
| request_id | string | 요청 추적 ID |
| message | string | 로그 메시지 |
| data | object | 추가 데이터 (선택) |

### 로그 레벨 정책

| 환경 | 최소 레벨 | 용도 |
|------|----------|------|
| Local | DEBUG | 개발 및 QA |
| Staging | DEBUG | QA 및 통합 테스트 |
| Production | INFO | 운영 모니터링 |

---

## Request ID 전파

### 개념

```
Client → API Gateway → Backend → Database
   ↓         ↓           ↓          ↓
req_abc   req_abc     req_abc    req_abc

모든 계층에서 동일한 Request ID로 추적 가능
```

### 구현 패턴

#### 1. Request ID 생성 (진입점)
```typescript
// middleware.ts
import { v4 as uuidv4 } from 'uuid';

export function generateRequestId(): string {
  return `req_${uuidv4().slice(0, 8)}`;
}

// 헤더로 전파
headers['X-Request-ID'] = requestId;
```

#### 2. Request ID 추출 및 전파
```typescript
// API 클라이언트
const requestId = headers['X-Request-ID'] || generateRequestId();

// 모든 로그에 포함
logger.info('Processing request', { request_id: requestId });

// 하위 서비스 호출 시 헤더에 포함
await fetch(url, {
  headers: { 'X-Request-ID': requestId }
});
```

---

## 백엔드 로깅 (FastAPI)

### 로깅 미들웨어

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

        # 요청 로깅
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

        # 응답 로깅 (200 OK 포함!)
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

### 비즈니스 로직 로깅

```python
# services/user_service.py
def create_user(data: dict, request_id: str):
    logger.info("Creating user", extra={
        'request_id': request_id,
        'data': {'email': data['email']}
    })

    # 비즈니스 로직
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

## 프론트엔드 로깅 (Next.js)

### Logger 모듈

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

### API 클라이언트 통합

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

    // 200 OK도 로깅!
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

## Nginx JSON 로깅

### nginx.conf 설정

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

## Docker 기반 QA 워크플로우

### docker-compose.yml 설정

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

### 실시간 로그 모니터링

```bash
# 모든 서비스 로그 스트리밍
docker compose logs -f

# 특정 서비스만
docker compose logs -f api

# 에러만 필터링
docker compose logs -f | grep '"level":"ERROR"'

# 특정 Request ID 추적
docker compose logs -f | grep 'req_abc123'
```

---

## QA 자동화 워크플로우

### 1. 환경 시작
```bash
# 개발 환경 시작
docker compose up -d

# 로그 모니터링 시작 (Claude Code가 모니터링)
docker compose logs -f
```

### 2. 수동 UX 테스팅
```
사용자가 브라우저에서 실제 기능 테스트:
1. 회원가입 시도
2. 로그인 시도
3. 핵심 기능 사용
4. 엣지 케이스 테스트
```

### 3. Claude Code 로그 분석
```
Claude Code가 실시간으로:
1. 로그 스트림 모니터링
2. 에러 패턴 감지
3. 비정상 응답 시간 감지
4. Request ID로 전체 플로우 추적
5. 이슈 자동 문서화
```

### 4. 이슈 문서화
```markdown
# QA 이슈 보고서

## 발견된 이슈

### ISSUE-001: 로그인 실패 시 에러 처리 미흡
- **Request ID**: req_abc123
- **심각도**: Medium
- **재현 경로**: 로그인 → 잘못된 비밀번호
- **로그**:
  ```json
  {"level":"ERROR","message":"Login failed","data":{"error":"Invalid credentials"}}
  ```
- **문제점**: 에러 메시지가 사용자 친화적이지 않음
- **권장 수정**: 에러 코드별 메시지 매핑 추가
```

---

## 이슈 감지 패턴

### 1. 에러 감지
```json
{"level":"ERROR","message":"..."}
```
→ 즉시 보고

### 2. 느린 응답 감지
```json
{"data":{"duration_ms":3000}}
```
→ 1000ms 초과 시 경고

### 3. 연속 실패 감지
```
같은 endpoint에서 3회 이상 연속 실패
```
→ 시스템 이슈 가능성 보고

### 4. 비정상 상태 코드
```json
{"data":{"status":500}}
```
→ 5xx 에러 즉시 보고

---

## Phase 연계

| Phase | Zero Script QA 연계 |
|-------|---------------------|
| Phase 4 (API) | API 응답 로깅 검증 |
| Phase 6 (UI) | 프론트엔드 로깅 검증 |
| Phase 7 (보안) | 보안 이벤트 로깅 검증 |
| Phase 8 (리뷰) | 로그 품질 리뷰 |
| Phase 9 (배포) | 프로덕션 로그 레벨 설정 |

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

## 체크리스트

### 로깅 인프라
- [ ] JSON 로그 형식 적용
- [ ] Request ID 생성 및 전파
- [ ] 환경별 로그 레벨 설정
- [ ] Docker 로깅 설정

### 백엔드 로깅
- [ ] 로깅 미들웨어 구현
- [ ] 모든 API 호출 로깅 (200 OK 포함)
- [ ] 비즈니스 로직 로깅
- [ ] 에러 상세 로깅

### 프론트엔드 로깅
- [ ] Logger 모듈 구현
- [ ] API 클라이언트 통합
- [ ] 에러 바운더리 로깅

### QA 워크플로우
- [ ] Docker Compose 설정
- [ ] 실시간 모니터링 준비
- [ ] 이슈 문서화 템플릿 준비
