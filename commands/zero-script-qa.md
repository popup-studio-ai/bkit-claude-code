---
description: Run Zero Script QA (verify via Docker logs without test scripts)
arguments:
  - name: target
    description: 검증 대상 (api, ui, feature명)
    required: false
  - name: mode
    description: 실행 모드 (setup, monitor, analyze)
    required: false
---

# Zero Script QA

테스트 스크립트 작성 없이 **Docker 로그 실시간 모니터링**으로 기능을 검증합니다.

## Zero Script QA란?

```
기존 방식: 테스트 코드 작성 → 실행 → 결과 확인 → 유지보수
Zero Script: 로그 인프라 구축 → 수동 UX 테스트 → AI 로그 분석 → 자동 이슈 감지

핵심:
- 구조화된 JSON 로그
- Request ID로 전체 플로우 추적
- Claude Code가 실시간 로그 모니터링
- 이슈 자동 감지 및 문서화
```

---

## 실행 모드

### 1. Setup 모드 (`/zero-script-qa setup`)
```
로깅 인프라 구축:
1. JSON 로그 형식 설정 확인
2. Request ID 전파 확인
3. Docker Compose 로깅 설정 확인
4. 환경 변수 (LOG_LEVEL=DEBUG) 확인
```

### 2. Monitor 모드 (`/zero-script-qa monitor`)
```
실시간 모니터링:
1. docker compose logs -f 실행 안내
2. 사용자 수동 UX 테스트 요청
3. 로그 실시간 분석
4. 이슈 감지 시 즉시 보고
```

### 3. Analyze 모드 (`/zero-script-qa analyze`)
```
로그 분석:
1. 수집된 로그 분석
2. 이슈 패턴 식별
3. 성능 통계
4. 종합 보고서 작성
```

---

## 워크플로우

### Step 1: 환경 시작
```bash
# Docker 환경 시작
docker compose up -d

# 상태 확인
docker compose ps
```

### Step 2: 로그 모니터링 시작
```bash
# 전체 로그 스트리밍 (Claude Code가 모니터링)
docker compose logs -f

# 에러만 필터링
docker compose logs -f | grep '"level":"ERROR"'
```

### Step 3: 수동 UX 테스트
```
사용자가 브라우저에서 실제 기능 테스트:
- 회원가입
- 로그인
- 핵심 기능 사용
- 엣지 케이스 테스트
```

### Step 4: 이슈 감지 및 문서화
```
Claude Code가 자동으로:
1. 에러 패턴 감지
2. 느린 응답 감지 (> 1000ms)
3. Request ID로 전체 플로우 추적
4. 이슈 문서화
5. 수정 방안 제시
```

---

## JSON 로그 표준

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

---

## 이슈 감지 패턴

| 패턴 | 심각도 | 조건 |
|------|--------|------|
| 에러 | 🔴 Critical | `"level":"ERROR"` |
| 서버 에러 | 🔴 Critical | `"status":5xx` |
| 매우 느림 | 🔴 Critical | `duration_ms > 3000` |
| 인증 실패 | 🟡 Warning | `"status":401` or `403` |
| 느린 응답 | 🟡 Warning | `duration_ms > 1000` |
| 연속 실패 | 🟡 Warning | 같은 엔드포인트 3회 실패 |

---

## 모니터링 명령어

```bash
# 전체 로그
docker compose logs -f

# 특정 서비스
docker compose logs -f api
docker compose logs -f web

# 에러만
docker compose logs -f | grep '"level":"ERROR"'

# 특정 Request ID 추적
docker compose logs -f | grep 'req_xxx'

# 느린 응답 (1000ms 이상)
docker compose logs -f | grep -E '"duration_ms":[0-9]{4,}'

# 최근 5분
docker compose logs --since "5m"
```

---

## 결과 문서

검증 완료 후 `docs/03-analysis/zero-script-qa-{date}.md`에 보고서 생성

---

## 참조

- `.claude/skills/zero-script-qa/SKILL.md`: 전문 지식
- `.claude/agents/qa-monitor.md`: QA 모니터링 에이전트
- `.claude/templates/pipeline/zero-script-qa.template.md`: 보고서 템플릿
- `.claude/instructions/zero-script-qa-rules.md`: 자동 적용 규칙
