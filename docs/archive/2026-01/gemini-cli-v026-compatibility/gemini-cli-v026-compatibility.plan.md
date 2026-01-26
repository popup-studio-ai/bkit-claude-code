# Gemini CLI v0.26+ 호환성 및 bkit 고도화 계획

> **Project**: bkit-claude-code
> **Plan Type**: PDCA Plan Phase - Compatibility & Enhancement
> **Date**: 2026-01-26
> **Target Version**: bkit v1.4.3
> **Gemini CLI Target**: v0.26.0+ (현재 v0.27.0-nightly)
> **Status**: 📋 Planning

---

## Executive Summary

Gemini CLI v0.26.0 이상에서 도입된 **Hook System 전면 개편**, **Agent Skills 정식 활성화**, **Plan Mode 도입**, **AskUser Tool** 등의 변경사항에 대응하기 위한 bkit 고도화 계획입니다.

**핵심 목표**:
1. Breaking Changes 대응으로 v0.26+ 완전 호환성 확보
2. 새로운 Gemini CLI 기능과의 통합으로 사용자 경험 향상
3. bkit Context Engineering 고도화

---

## 1. 현황 분석

> **테스트 완료**: 2026-01-26 | **테스트 도구**: Task Management System + 코드 분석

### 1.1 Gemini CLI 주요 변경사항 (v0.25.0 ~ v0.27.0-nightly)

| 버전 | 주요 변경 | bkit 영향도 | 테스트 결과 |
|------|----------|-------------|-------------|
| v0.25.0 | Hook System 기본 활성화 | ✅ 호환 | ✅ 검증 완료 |
| v0.26.0-preview | `beforeAgent`/`fireAgent` 훅 제거 | ✅ **호환** | ✅ bkit 미사용 확인 |
| v0.26.0-preview | Hook context XML 래핑 | 🟡 **조건부 호환** | ⚠️ 현재 출력에 XML 특수문자 없음, 동적 입력 시 주의 |
| v0.26.0-preview | Agent Skills 기본 활성화 | ✅ 호환 | ✅ 검증 완료 |
| v0.26.0-preview | 설정 명명법 변경 (disable* → enable*) | ✅ **영향 없음** | ✅ bkit은 해당 설정 미사용 |
| v0.27.0-nightly | AskUser Tool 도입 | 🟡 통합 검토 | - 신규 기능 |
| v0.27.0-nightly | Agent Registry 도입 | 🟡 활용 검토 | - 신규 기능 |
| v0.27.0-nightly | Plan Mode 영속화 | 🟡 통합 검토 | - 신규 기능 |

### 1.2 bkit 현재 구현 상태

> **측정일**: 2026-01-26 | **측정 방법**: wc -l, find, glob

| 컴포넌트 | 파일 수 | 라인 수 | 상태 | 테스트 결과 |
|----------|---------|---------|------|-------------|
| **Hooks** | 1 (+hooks.json) | 631 | hooks.json + session-start.js | ✅ 정상 |
| **Scripts** | 28 | 2,695 | Node.js 모듈 | ✅ 정상 |
| **Lib** | 6 | 4,092 | Context Engineering 핵심 | ✅ 정상 |
| **Skills** | 18 | 7,132 | 도메인 지식 | ✅ 정상 |
| **Agents** | 11 | 2,558 | 행동 규칙 | ✅ 정상 |
| **Commands** | 20 | 1,943 | TOML 명령어 | ✅ 정상 |

**참고**: 이전 계획 문서의 추정치와 실제 측정값 차이 존재 (Skills, Commands 라인 수 증가)

### 1.3 영향받는 bkit 기능 목록

#### 1.3.1 Hook System 관련

> **테스트 방법**: hooks.json, gemini-extension.json 분석 + 스크립트 코드 리뷰

| 훅 이벤트 | 파일 | 영향 분석 | 테스트 결과 | 비고 |
|-----------|------|----------|-------------|------|
| SessionStart | hooks/session-start.js | ✅ 영향 없음 | ✅ 통과 | 양 플랫폼 모두 등록됨 |
| PreToolUse (BeforeTool) | scripts/pre-write.js | ✅ **현재 호환** | ✅ 통과 | outputAllow()에 XML 특수문자 없음 |
| PostToolUse (AfterTool) | scripts/pdca-post-write.js | ✅ **현재 호환** | ✅ 통과 | outputAllow()에 XML 특수문자 없음 |
| AgentStop | scripts/*-stop.js | ⚠️ **플랫폼 차이** | ⚠️ 주의 | hooks.json에 없음, gemini-extension.json에만 존재 |
| UserPromptSubmit | scripts/user-prompt-handler.js | ✅ 영향 없음 | ✅ 통과 | Claude Code 전용 (hooks.json) |
| PreCompact | scripts/context-compaction.js | ✅ 영향 없음 | ✅ 통과 | Claude Code 전용 (hooks.json) |

**AgentStop 상세 분석**:
- `gemini-extension.json`에 4개 에이전트 등록: gap-detector, pdca-iterator, code-analyzer, qa-monitor
- `hooks.json` (Claude Code)에는 미등록 → Claude Code에서 AgentStop 동작 안 함
- **권장**: hooks.json에 AgentStop 훅 추가 검토

#### 1.3.2 Agent/Skill 관련

> **테스트 방법**: agents/*.md 프론트매터 grep 분석

| 항목 | 현재 상태 | 테스트 결과 | 사용 에이전트 |
|------|----------|-------------|---------------|
| permissionMode: plan | 사용 중 | ✅ **호환 확인** | gap-detector, design-validator, code-analyzer, pipeline-guide |
| permissionMode: acceptEdits | 사용 중 | ✅ **호환 확인** | report-generator, infra-architect, qa-monitor, pdca-iterator, enterprise-expert, bkend-expert, starter-guide |
| context: fork | 사용 중 | ✅ **호환 확인** | gap-detector, design-validator |
| workspace scope | project 사용 | 🟡 **실환경 테스트 필요** | skills 디렉토리 설정 존재 |
| AskUser 통합 | 미구현 | - | 신규 기능 |

### 1.4 테스트 결론 요약

| 항목 | 결과 | 개선 필요 |
|------|------|----------|
| beforeAgent/fireAgent 제거 | ✅ **영향 없음** | ❌ 불필요 |
| Hook XML 래핑 | 🟡 **조건부 호환** | 🟡 xmlSafeOutput() 함수 권장 (안전장치) |
| 설정 명명법 변경 | ✅ **영향 없음** | ❌ 불필요 |
| engines 버전 | ⚠️ **업데이트 권장** | ✅ >=1.0.0 → >=0.25.0 변경 |
| AgentStop 훅 | ⚠️ **플랫폼 차이** | 🟡 hooks.json 동기화 검토 |
| permissionMode/context:fork | ✅ **호환** | ❌ 불필요 |

---

## 2. 개선 계획

### 2.1 Phase 1: Breaking Changes 대응 (우선순위: High)

#### FR-1.1: Hook Context XML 래핑 호환성 테스트

**배경**: Gemini CLI v0.27.0-nightly부터 Hook에서 주입된 컨텍스트가 XML 태그로 래핑됩니다.

**변경 전**:
```
PDCA 상태: Plan 완료, 현재 Do 단계
```

**변경 후**:
```xml
<hook-context source="session-start">
PDCA 상태: Plan 완료, 현재 Do 단계
</hook-context>
```

**조치 사항**:
1. `hooks/session-start.js` 출력 형식 검증
2. 모든 스크립트의 `outputBlock()` 함수 출력 검증
3. 필요시 XML 호환 출력 형식으로 변경

**테스트 체크리스트**:
- [ ] SessionStart 훅 출력이 XML 태그 내에서 정상 파싱되는지
- [ ] PreToolUse 훅의 컨텍스트 힌트가 정상 표시되는지
- [ ] PostToolUse 훅의 제안 메시지가 정상 표시되는지
- [ ] AgentStop 훅의 다음 단계 안내가 정상 표시되는지

#### FR-1.2: engines 버전 업데이트

**현재 설정** (`gemini-extension.json`):
```json
"engines": {
  "gemini-cli": ">=1.0.0"
}
```

**변경 후**:
```json
"engines": {
  "gemini-cli": ">=0.25.0"
}
```

**이유**: v0.25.0 이상에서 Hook System이 기본 활성화되므로 명시적 요구

#### FR-1.3: beforeAgent/fireAgent 사용 여부 확인

**분석 결과**: bkit은 `beforeAgent`/`fireAgent`를 사용하지 않음
- 사용 중인 훅: SessionStart, PreToolUse, PostToolUse, AgentStop, PreCompact
- **조치**: 없음 (이미 호환)

---

### 2.2 Phase 2: Plan Mode 통합 (우선순위: Medium)

#### FR-2.1: Gemini CLI Plan Mode와 bkit PDCA 연동

**목표**: bkit의 PDCA 워크플로우를 Gemini CLI의 Plan Mode와 자연스럽게 연동

**Gemini CLI Plan Mode 동작**:
| Mode | 설명 |
|------|------|
| `approve_all` | 모든 도구 자동 승인 |
| `approve_once` | 도구별 일회성 승인 |
| `plan` | 읽기 전용, 쓰기 작업은 계획서 생성 후 승인 |

**bkit 연동 방안**:

1. **PDCA Plan 단계 → Gemini `plan` mode 활성화 제안**
   - `/pdca-plan` 실행 시 "Shift+Tab으로 Plan Mode를 활성화하면 더 안전합니다" 안내

2. **gap-detector 에이전트 → 자동 Plan Mode**
   - 이미 `permissionMode: plan` 설정됨
   - Gemini CLI의 Plan Mode와 동기화 검토

3. **Plan Mode 상태 감지 및 활용**
   - lib/common.js에 detectGeminiApprovalMode() 함수 추가
   - 환경변수 또는 설정 파일에서 현재 모드 확인

#### FR-2.2: Plan Mode 인식 시스템 프롬프트 통합

**위치**: `GEMINI.md` 또는 `skills/bkit-rules/SKILL.md`

**추가 내용**:
```markdown
## Plan Mode 연동

현재 Gemini CLI가 Plan Mode로 실행 중일 때:
- 읽기 전용 작업만 수행
- 쓰기 작업은 계획서로 제안
- `/pdca-design` 완료 후 Plan Mode 해제 안내
```

---

### 2.3 Phase 3: AskUser Tool 통합 (우선순위: Medium)

#### FR-3.1: bkit AskUserQuestion 패턴을 Gemini AskUser Tool로 연동

**현재 bkit 패턴** (Claude Code):
- lib/common.js의 generateClarificationQuestion() 함수
- 모호함 점수 기반 명확화 질문 생성

**Gemini CLI AskUser Tool**:
```json
{
  "name": "AskUser",
  "description": "사용자에게 직접 질문",
  "input_schema": {
    "question": "string",
    "options": ["array of choices"]
  }
}
```

**통합 방안**:

1. **lib/askuser-adapter.js 신규 모듈**
   - 플랫폼별 질문 형식 생성
   - Claude Code AskUserQuestion ↔ Gemini AskUser 변환

2. **user-prompt-handler.js 개선**
   - 모호함 감지 시 AskUser Tool 호출 제안
   - 질문 형식을 Gemini AskUser 스키마에 맞게 변환

3. **SessionStart 훅에서 AskUser 활용**
   - 이전 작업 재개 여부 질문
   - 현재 시스템 프롬프트 방식에서 AskUser로 대체 검토

---

### 2.4 Phase 4: Agent Registry 활용 (우선순위: Low)

#### FR-4.1: /agents config 메타데이터 추가

**Gemini CLI v0.27.0-nightly 신기능**:
- `AgentRegistry`로 모든 발견된 subagent 추적
- `/agents config` 명령어로 에이전트 설정 UI

**bkit 에이전트 메타데이터 표준화**:

각 에이전트의 프론트매터에 추가:
```yaml
---
name: gap-detector
displayName: "Gap Detector"
description: "설계-구현 갭 분석 에이전트"
category: "pdca"
icon: "🔍"
configurable:
  - matchRateThreshold: 90
  - autoIterate: false
---
```

**구현 파일**: 모든 11개 에이전트

---

### 2.5 Phase 5: Skills 고도화 (우선순위: Low)

#### FR-5.1: Workspace Scope 마이그레이션 검토

**Gemini CLI 변경**: Skills scope가 `project` → `workspace`로 변경

**영향 분석**:
- bkit 스킬들은 `.gemini/skills/` 또는 `skills/` 디렉토리에 위치
- workspace scope에서도 정상 동작 예상
- 테스트 필요

**테스트 항목**:
- [ ] 멀티 프로젝트 워크스페이스에서 스킬 격리 확인
- [ ] 스킬 충돌 감지 기능 테스트
- [ ] `/skills` 명령어로 bkit 스킬 관리 확인

#### FR-5.2: 신규 빌트인 스킬과의 공존

**Gemini CLI 신규 스킬**:
- `skill-creator`: 사용자가 직접 스킬 생성
- `code-reviewer`: 코드 리뷰 (nightly)
- `docs-writer`: 문서 작성 (nightly)

**bkit 스킬과의 관계**:
| Gemini 스킬 | bkit 대응 | 전략 |
|-------------|----------|------|
| code-reviewer | code-analyzer agent | 공존 (다른 목적) |
| docs-writer | phase-4-api, phase-6-ui | 공존 (PDCA 특화) |
| skill-creator | - | 활용 권장 |

---

## 3. 구현 로드맵

### 3.1 릴리즈 계획

| 버전 | 목표 일자 | 포함 기능 |
|------|----------|----------|
| **v1.4.3** | 2026-01-28 | FR-1.1, FR-1.2 (Breaking Changes 대응) |
| **v1.4.4** | 2026-02-03 | FR-1.3 완료, FR-2.1 (Plan Mode 기초) |
| **v1.5.0** | 2026-02-10 | FR-2.2, FR-3.1 (Plan Mode + AskUser 통합) |
| **v1.5.1** | 2026-02-17 | FR-4.1, FR-5.1, FR-5.2 (Agent Registry + Skills) |

### 3.2 작업량 추정

| FR | 작업 | 예상 작업량 | 파일 수 |
|----|------|-------------|---------|
| FR-1.1 | Hook XML 래핑 테스트 | 1일 | 5 |
| FR-1.2 | engines 버전 업데이트 | 즉시 | 1 |
| FR-1.3 | beforeAgent 확인 | 완료 | 0 |
| FR-2.1 | Plan Mode 연동 | 2일 | 3 |
| FR-2.2 | 시스템 프롬프트 업데이트 | 0.5일 | 2 |
| FR-3.1 | AskUser 통합 | 2일 | 4 |
| FR-4.1 | Agent Registry 메타데이터 | 1일 | 11 |
| FR-5.1 | Workspace scope 테스트 | 0.5일 | 0 |
| FR-5.2 | 스킬 공존 검증 | 0.5일 | 0 |

**총 예상 작업량**: 7.5일

---

## 4. 상세 구현 명세

### 4.1 FR-1.1: Hook Context XML 래핑 테스트

#### 4.1.1 테스트 스크립트 작성

**파일**: `tests/hook-xml-wrapper-test.js`

테스트 대상 훅 스크립트:
- hooks/session-start.js
- scripts/pre-write.js
- scripts/pdca-post-write.js
- scripts/gap-detector-stop.js
- scripts/user-prompt-handler.js

**테스트 항목**:
1. 각 훅의 출력에 XML 특수문자가 있는지 확인
2. 특수문자가 있다면 적절히 이스케이프되는지 검증
3. Gemini CLI v0.27.0-nightly 환경에서 실제 동작 확인

#### 4.1.2 출력 형식 표준화

**파일**: `lib/common.js`

추가할 함수:
- `xmlSafeOutput(content)`: XML 특수문자 이스케이프
- `outputBlockSafe(content, options)`: 안전한 출력 블록 생성

### 4.2 FR-2.1: Plan Mode 연동

#### 4.2.1 Plan Mode 감지

**파일**: `lib/common.js`

추가할 함수:
- `detectGeminiApprovalMode()`: 현재 approval mode 반환
- `adjustForPlanMode()`: Plan Mode 시 동작 조정

#### 4.2.2 SessionStart 훅 업데이트

**파일**: `hooks/session-start.js`

Plan Mode 감지 시 추가 안내 메시지 출력

### 4.3 FR-3.1: AskUser Tool 통합

#### 4.3.1 AskUser 어댑터

**파일**: `lib/askuser-adapter.js` (신규)

주요 함수:
- `formatQuestion(options)`: 플랫폼별 질문 형식 생성
- `askPdcaTransition(currentPhase, suggestedPhase)`: PDCA 단계 전환 질문
- `askNewFeature(detectedFeature)`: 새 기능 시작 질문

#### 4.3.2 user-prompt-handler.js 업데이트

AskUser 어댑터 통합하여 모호함 감지 시 적절한 질문 생성

### 4.4 FR-4.1: Agent Registry 메타데이터

#### 4.4.1 에이전트 프론트매터 표준

각 에이전트에 추가할 메타데이터:
- displayName: 표시 이름
- category: 분류 (pdca, guide, expert 등)
- icon: 아이콘
- registry: Gemini CLI Agent Registry 호환 설정
- configurable: 설정 가능한 옵션 목록

---

## 5. 테스트 계획

### 5.1 호환성 테스트 매트릭스

| 테스트 항목 | Gemini v0.25 | v0.26-preview | v0.27-nightly |
|------------|--------------|---------------|---------------|
| SessionStart 훅 | ✅ | ⏳ | ⏳ |
| PreToolUse 훅 | ✅ | ⏳ | ⏳ |
| PostToolUse 훅 | ✅ | ⏳ | ⏳ |
| AgentStop 훅 | ✅ | ⏳ | ⏳ |
| Skills 로드 | ✅ | ⏳ | ⏳ |
| Agents 실행 | ✅ | ⏳ | ⏳ |
| PDCA 워크플로우 | ✅ | ⏳ | ⏳ |
| Plan Mode 연동 | N/A | ⏳ | ⏳ |

### 5.2 테스트 시나리오

#### 시나리오 1: 새 기능 개발 (Plan Mode)
1. Gemini CLI를 Plan Mode로 시작
2. "로그인 기능 추가" 입력
3. bkit이 Plan Mode 감지하고 설계 문서 작성 유도
4. /pdca-plan login 실행
5. /pdca-design login 실행
6. Plan Mode 해제 안내 확인
7. 구현 진행
8. 갭 분석 실행

#### 시나리오 2: Hook XML 래핑 호환성
1. v0.27.0-nightly 환경에서 bkit 로드
2. 각 훅 이벤트 트리거
3. 출력이 XML 태그 내에서 정상 파싱되는지 확인
4. 특수문자 포함 출력 테스트

#### 시나리오 3: AskUser Tool 통합
1. 모호한 요청 입력 ("기능 개선해줘")
2. bkit이 AskUser 질문 생성
3. Gemini CLI의 AskUserDialog 표시 확인
4. 사용자 선택 후 적절한 동작 수행

---

## 6. 리스크 및 대응

### 6.1 리스크 목록

| 리스크 | 영향도 | 가능성 | 대응 방안 |
|--------|--------|--------|----------|
| Hook XML 래핑으로 기존 출력 깨짐 | High | Medium | XML-safe 출력 함수 구현 |
| Plan Mode API 변경 | Medium | Low | 환경변수 폴백 체인 |
| AskUser Tool 스키마 변경 | Medium | Medium | 어댑터 패턴으로 추상화 |
| Agent Registry 미지원 환경 | Low | Low | 기존 방식 폴백 |

### 6.2 롤백 전략

**v1.4.3 롤백**:
- `gemini-extension.json` engines 버전 복원
- XML-safe 출력 비활성화

**v1.5.0 롤백**:
- Plan Mode 감지 코드 비활성화
- AskUser 어댑터 폴백 모드 활성화

---

## 7. 참고 자료

### 7.1 Gemini CLI 공식 문서
- [Agent Skills](https://geminicli.com/docs/cli/skills/)
- [Hook System](https://geminicli.com/docs/extensions/hooks/)
- [Getting Started with Agent Skills](https://geminicli.com/docs/cli/tutorials/skills-getting-started/)

### 7.2 GitHub 이슈
- [#17348 - Refactor common settings logic](https://github.com/google-gemini/gemini-cli/issues/17348)
- [#16868 - Automate Plan Mode](https://github.com/google-gemini/gemini-cli/issues/16868)
- [#15999 - Plan Mode Extensibility](https://github.com/google-gemini/gemini-cli/issues/15999)
- [#17170 - Support Read-Only Shell Commands in Plan Mode](https://github.com/google-gemini/gemini-cli/issues/17170)

### 7.3 GitHub 릴리즈
- [v0.25.0](https://github.com/google-gemini/gemini-cli/releases/tag/v0.25.0)
- [v0.26.0-preview.0](https://github.com/google-gemini/gemini-cli/releases/tag/v0.26.0-preview.0)
- [v0.27.0-nightly.20260126](https://github.com/google-gemini/gemini-cli/releases/tag/v0.27.0-nightly.20260126.cb772a5b7)

---

## 8. 승인

| 역할 | 이름 | 승인 일자 |
|------|------|----------|
| 기획자 | - | - |
| 개발자 | - | - |
| 리뷰어 | - | - |

---

**Plan Generated By**: bkit PDCA Plan Generator
**Co-Authored-By**: Claude Opus 4.5 <noreply@anthropic.com>
