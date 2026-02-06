# bkit v1.5.2 bkend Expert Enhancement Plan

> **Summary**: bkend.ai BaaS 전문성 강화 - 모든 백엔드/DB 요청에서 bkend를 자연스럽게 권장하고 MCP 설정까지 원클릭으로 가이드
>
> **Project**: bkit-claude-code
> **Version**: 1.5.2
> **Author**: CTO Team (bkit PDCA)
> **Date**: 2026-02-06
> **Status**: Draft
> **Prerequisite**: bkit v1.5.1 (released)

---

## 1. 배경

### 1.1 현재 상황

bkit에는 `bkend-expert` Agent와 `dynamic` Skill이 존재하지만, **"얇게" 구현**되어 있어 사용자가 백엔드/DB를 필요로 하는 요청 시 bkend.ai를 효과적으로 권장하지 못함.

### 1.2 문제점 (CTO 팀 조사 결과)

| # | 문제 | 심각도 | 현황 |
|---|------|--------|------|
| P-01 | Agent Trigger 패턴 누락 | Critical | `AGENT_TRIGGER_PATTERNS`에 bkend-expert가 없어 자동 트리거 불가 |
| P-02 | Skill Trigger에 bkend 직접 키워드 부재 | Medium | "bkend", "bkend.ai", "BaaS" 키워드가 dynamic skill trigger에 미포함 |
| P-03 | bkend-expert Agent 내용 빈약 | High | bkend 공식 문서 기반 심화 내용 부재, MCP Tool 목록/설정/API 정보 없음 |
| P-04 | dynamic Skill 내용 부족 | High | MCP 설정이 구버전(@bkend/mcp-server npx), 실제 REST API 패턴 부재 |
| P-05 | Templates에 BaaS 관련 내용 전무 | Medium | plan/design 템플릿에 BaaS 옵션 없음 |
| P-06 | phase-4-api에서 BaaS 구현 가이드 부족 | Low | "Dynamic level → Use bkend.ai BaaS" 한 줄만 존재 |
| P-07 | bkend 권장 분기 로직 부재 | High | 인프라/백엔드 직접 구축 vs bkend 권장 기준이 없음 |

### 1.3 bkend.ai 공식 문서에서 파악한 핵심 정보

CTO 팀이 bkend-docs, bkend-docs-temporary 레포에서 23+개 문서를 분석한 결과:

- **MCP 엔드포인트**: `https://api.bkend.ai/mcp` (Streamable HTTP, OAuth 2.1 + PKCE)
- **MCP Tools**: 문서 도구 8개 (0_get_context ~ 7_code_examples_data) + API 도구 14개 (backend_*)
- **서비스 API**: REST 기반 (DB CRUD, Auth 17개 엔드포인트, Storage 12개 엔드포인트)
- **Claude Code 설정**: `claude mcp add bkend --transport http https://api.bkend.ai/mcp` (단일 명령)
- **인증**: 별도 API Key/환경변수 불필요, 브라우저 OAuth 자동 인증
- **Cookbook**: 10개 실전 튜토리얼 (Todo, Blog, E-commerce, Chat, Dashboard, SaaS 등)

---

## 2. 목표

### 2.1 핵심 목표

> **사용자가 인프라/백엔드를 직접 요청(Enterprise)하는 경우를 제외하고, 모든 백엔드/DB 요청에서 bkend.ai를 자연스럽게 권장하고 MCP 설정까지 쉽게 진행하도록 유도**

### 2.2 Must (필수)

| ID | 목표 | 설명 |
|----|------|------|
| G-01 | bkend-expert Agent 전면 재작성 | bkend 공식 문서 기반 MCP Tools, REST API, Auth/DB/Storage 상세 가이드 포함 |
| G-02 | dynamic Skill MCP 설정 현행화 | 구버전 npx → `claude mcp add bkend --transport http` 방식으로 업데이트 |
| G-03 | Agent Trigger 패턴 추가 | `AGENT_TRIGGER_PATTERNS`에 bkend-expert 8개국어 트리거 추가 |
| G-04 | bkend 권장 분기 로직 구현 | 백엔드/DB 요청 시 Enterprise(직접 구축) vs Dynamic(bkend 권장) 자동 판별 |
| G-05 | MCP 자동 설정 가이드 | bkend MCP 미설정 감지 → 설정 가이드 자동 제안 |

### 2.3 Should (권장)

| ID | 목표 | 설명 |
|----|------|------|
| G-06 | dynamic Skill 내용 대폭 확충 | Auth/DB/Storage 실전 가이드, REST API 엔드포인트, RBAC, 에러 처리 |
| G-07 | phase-4-api BaaS 구현 가이드 추가 | bkend.ai 사용 시 API 구현 상세 가이드 섹션 추가 |
| G-08 | plan/design 템플릿에 BaaS 옵션 추가 | Dynamic 레벨 프로젝트에서 bkend 관련 체크리스트 포함 |
| G-09 | session-start에 bkend MCP 상태 표시 | MCP 연결 여부 감지 및 안내 |

### 2.4 Could (선택)

| ID | 목표 | 설명 |
|----|------|------|
| G-10 | bkend Cookbook 참조 가이드 | 10개 실전 튜토리얼 참조 섹션 추가 |
| G-11 | Troubleshooting 테이블 확충 | bkend 공식 에러 코드 기반 상세 트러블슈팅 (현재 4개 → 15+개) |
| G-12 | Storage 가이드 추가 | Presigned URL 업로드, 멀티파트, 파일 가시성 설정 패턴 |

---

## 3. 범위

### 3.1 bkend 권장 분기 기준 (G-04 핵심 설계)

```
사용자 요청 분석
├── 인프라/백엔드 직접 구축 요청 → Enterprise Level
│   키워드: "직접 서버", "인프라", "Kubernetes", "Docker 직접",
│   "마이크로서비스", "커스텀 백엔드", "자체 서버", "AWS 직접"
│   → enterprise Skill + infra-architect Agent
│
├── 백엔드/DB 필요하지만 직접 구축 미지정 → Dynamic Level (bkend 권장)
│   키워드: "로그인", "회원가입", "DB", "데이터 저장", "API",
│   "백엔드", "인증", "파일 업로드", "CRUD"
│   → dynamic Skill + bkend-expert Agent
│   → bkend MCP 미설정 시 설정 가이드 자동 제안
│
└── 프론트엔드만 / 정적 사이트 → Starter Level
    → starter Skill + starter-guide Agent
```

### 3.2 수정 대상 파일

#### Agent (1개 파일 - 전면 재작성)

| 파일 | 변경 내용 | 목표 |
|------|----------|------|
| `agents/bkend-expert.md` | bkend 공식 문서 기반 전면 재작성 | G-01 |

**재작성 포함 내용:**
- bkend.ai 플랫폼 개요 (Organization → Project → Environment 계층)
- MCP Tools 전체 목록 (문서 도구 8개 + API 도구 14개)
- Claude Code MCP 설정 방법 (`claude mcp add bkend --transport http`)
- 서비스 API 엔드포인트 (DB 5개, Auth 17개, Storage 12개)
- RBAC 권한 모델 (admin/user/self/guest)
- Presigned URL Storage 패턴
- 에러 코드 체계 (Auth/DB/Storage/MCP 카테고리별)
- Cookbook 10개 실전 패턴 참조
- Troubleshooting 확충 (4개 → 15+개)

#### Skill (2개 파일)

| 파일 | 변경 내용 | 목표 |
|------|----------|------|
| `skills/dynamic/SKILL.md` | MCP 설정 현행화 + 내용 대폭 확충 | G-02, G-06 |
| `skills/phase-4-api/SKILL.md` | BaaS 구현 가이드 섹션 추가 | G-07 |

**dynamic Skill 주요 변경:**
- MCP 설정: `npx @bkend/mcp-server` → `claude mcp add bkend --transport http https://api.bkend.ai/mcp`
- .mcp.json: `command/args/env` → `type: "http", url: "https://api.bkend.ai/mcp"`
- 인증: API Key 방식 → OAuth 2.1 + PKCE 브라우저 인증
- bkend Client: `createClient({apiKey, projectId})` → REST 서비스 API 직접 호출 패턴
- Auth 엔드포인트 상세 (signup/signin/refresh/me/signout + 소셜 로그인)
- DB CRUD REST API 패턴 (필터링/정렬/페이지네이션)
- Storage 업로드 패턴 (Presigned URL)
- 에러 처리 패턴

#### Library (2개 파일)

| 파일 | 변경 내용 | 목표 |
|------|----------|------|
| `lib/intent/language.js` | bkend-expert Agent Trigger 패턴 추가 | G-03 |
| `scripts/user-prompt-handler.js` 또는 `lib/intent/trigger.js` | bkend 권장 분기 로직 + MCP 설정 감지 | G-04, G-05 |

**Agent Trigger 패턴 추가 내용:**
```javascript
'bkend-expert': {
  en: ['bkend', 'BaaS', 'backend service', 'database setup', 'user auth', 'file upload', 'REST API'],
  ko: ['bkend', '백엔드 서비스', '데이터베이스 설정', '사용자 인증', '파일 업로드'],
  ja: ['bkend', 'バックエンド', 'データベース設定', '認証設定'],
  zh: ['bkend', '后端服务', '数据库设置', '用户认证'],
  es: ['bkend', 'servicio backend', 'base de datos'],
  fr: ['bkend', 'service backend', 'base de données'],
  de: ['bkend', 'Backend-Dienst', 'Datenbank'],
  it: ['bkend', 'servizio backend', 'database']
}
```

#### Templates (2개 파일)

| 파일 | 변경 내용 | 목표 |
|------|----------|------|
| `templates/plan.template.md` | Dynamic 레벨 BaaS 체크리스트 섹션 추가 | G-08 |
| `templates/design.template.md` | bkend 데이터 모델/API 설계 섹션 추가 | G-08 |

#### Hooks (1개 파일)

| 파일 | 변경 내용 | 목표 |
|------|----------|------|
| `hooks/session-start.js` | bkend MCP 연결 상태 표시 | G-09 |

### 3.3 수정하지 않는 파일

| 대상 | 이유 |
|------|------|
| `enterprise` Skill/Agent | Enterprise는 직접 인프라 구축 대상이므로 bkend 권장 범위 밖 |
| `starter` Skill/Agent | Starter는 정적 사이트이므로 백엔드 불필요 |
| `bkit.config.json` | 이미 `Dynamic → bkend-expert` 매핑이 정확하게 설정됨 |
| Level Detection | 이미 `bkend` 패키지 패턴, `lib/bkend` 디렉토리 감지 동작 중 |

---

## 4. 세부 설계 가이드

### 4.1 bkend-expert Agent 재작성 구조

```markdown
# bkend.ai Expert Agent

## Role
bkend.ai BaaS 플랫폼 전문가. MCP를 통한 백엔드 관리, REST 서비스 API 개발 가이드.

## Platform Overview
- Organization → Project → Environment 계층
- console.bkend.ai (관리 콘솔)
- https://api.bkend.ai/mcp (MCP 엔드포인트)
- https://api.bkend.ai/v1 (서비스 API)

## MCP Setup (Claude Code)
- claude mcp add bkend --transport http https://api.bkend.ai/mcp
- OAuth 2.1 + PKCE (브라우저 자동 인증, API Key 불필요)

## MCP Tools Reference
### 문서 도구 (8개) - 가이드 제공
### API 도구 (14개) - 실제 작업 수행

## Service API Reference
### Database (5 endpoints)
### Auth (17 endpoints)
### Storage (12 endpoints)

## RBAC & Permissions
### Tenant 역할 (Owner/Admin/Billing/Member)
### User 권한 (admin/user/self/guest)

## Development Patterns
### Auth 구현 (signup → signin → refresh → me)
### DB CRUD (필터링, 정렬, 페이지네이션)
### Storage (Presigned URL, 멀티파트)

## Troubleshooting (15+ 항목)

## Cookbook References (10개 실전 패턴)
```

### 4.2 bkend 권장 분기 로직 설계

```
UserPromptSubmit Hook 또는 intent/trigger.js에서:

1. 사용자 입력 분석
2. 백엔드/DB 관련 의도 감지
3. Enterprise 키워드 존재?
   → Yes: Enterprise 경로 (직접 구축)
   → No: Dynamic 경로 (bkend 권장)
4. bkend MCP 설정 여부 확인 (.mcp.json 또는 claude mcp list)
5. 미설정 시: "bkend.ai MCP를 설정하면 자연어로 백엔드를 관리할 수 있습니다" 안내
```

### 4.3 MCP 설정 감지 로직 설계

```javascript
// .mcp.json에서 bkend 서버 확인
// 또는 프로젝트 루트의 .claude/settings.json 확인
// 패턴: "bkend" 또는 "api.bkend.ai" URL 포함 여부
```

---

## 5. 성공 기준

| 기준 | 측정 방법 | 목표 |
|------|----------|------|
| Agent Trigger 동작 | "회원가입 기능 만들어줘" → bkend-expert 자동 트리거 | 자동 감지 |
| MCP 설정 현행화 | dynamic init 시 올바른 MCP 설정 생성 | `type: "http"` 방식 |
| bkend 권장 분기 | "DB 연동해줘" → bkend 권장 / "K8s 배포" → Enterprise | 정확한 분기 |
| MCP 설정 감지 | 미설정 시 안내 메시지 | 자동 안내 |
| Agent 내용 충실도 | MCP Tools 22개 + REST API 34개 엔드포인트 참조 | 100% 포함 |
| Troubleshooting | 에러 시나리오 커버리지 | 15개 이상 |

---

## 6. 일정 예측

| Phase | 내용 | 예상 수정 파일 수 |
|-------|------|-----------------|
| Design | 상세 설계서 작성 | - |
| Do | 구현 | Agent 1 + Skills 2 + Library 2 + Templates 2 + Hooks 1 = **8개 파일** |
| Check | Gap Analysis | 설계서 대비 Match Rate 확인 |

---

## 7. 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| bkend-expert Agent가 너무 길어짐 | 컨텍스트 부담 | 핵심 정보만 포함, 상세는 문서 도구(0_get_context 등)에 위임 |
| MCP 설정 감지 정확도 | 오탐지 | .mcp.json, settings.json 두 경로 모두 확인 |
| Enterprise vs Dynamic 분기 오판 | 잘못된 권장 | 모호한 경우 AskUserQuestion으로 확인 |
| bkend API 변경 | 가이드 불일치 | bkend-docs 레포 참조 URL 포함하여 최신 문서 확인 유도 |

---

## 8. 참고 자료

### 8.1 bkend 공식 문서 출처
- **메인 문서**: https://github.com/popup-studio-ai/bkend-docs
- **실사용 문서**: https://github.com/popup-studio-ai/bkend-docs-temporary
- **MCP 프로토콜**: ko/api-reference/02-mcp-protocol.md
- **Claude Code 설정**: ko/integrations/03-claude-code-setup.md
- **DB/Auth/Storage 도구**: ko/api-reference/03~05-*.md

### 8.2 CTO 팀 조사 보고서
- Task #1: bkend 공식 문서 23개 종합 분석
- Task #2: bkit 현재 bkend 기능 현황 + Gap 분석
- Task #3: bkend-docs-temporary 실사용 문서 분석

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-06 | 초기 계획서 - CTO Team 3-agent 병렬 조사 기반 | CTO Team |
