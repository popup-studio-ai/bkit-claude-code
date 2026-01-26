# Gemini CLI v0.26+ 호환성 테스트 계획

> **Project**: bkit-claude-code
> **Plan Type**: PDCA Plan Phase - Test Plan
> **Date**: 2026-01-26
> **Target Version**: bkit v1.4.3
> **Parent Feature**: gemini-cli-v026-compatibility
> **Status**: 📋 Planning

---

## Executive Summary

bkit v1.4.3에서 구현된 Gemini CLI v0.26+ 호환성 변경사항(FR-1.1, FR-1.2)에 대한 포괄적인 테스트 계획입니다. 단위 테스트, 통합 테스트, 회귀 테스트, 호환성 테스트를 포함합니다.

**테스트 목표**:
1. 신규 기능 정상 동작 검증 (xmlSafeOutput, engines 버전)
2. 기존 기능 회귀 방지 (Claude Code 호환성)
3. 다중 플랫폼/버전 호환성 확인

---

## 1. 테스트 범위

### 1.1 In-Scope (테스트 대상)

| 카테고리 | 대상 | 우선순위 |
|----------|------|:--------:|
| **단위 테스트** | xmlSafeOutput() 함수 | High |
| **단위 테스트** | outputAllow() Gemini 분기 | High |
| **단위 테스트** | outputBlock() Gemini 분기 | High |
| **통합 테스트** | 전체 훅 파이프라인 | High |
| **회귀 테스트** | Claude Code 출력 형식 | High |
| **회귀 테스트** | 기존 훅 스크립트 동작 | Medium |
| **호환성 테스트** | Gemini CLI v0.25.0 | Medium |
| **호환성 테스트** | Gemini CLI v0.26-preview | High |
| **호환성 테스트** | Gemini CLI v0.27-nightly | High |
| **버전 검증** | engines.gemini-cli 체크 | Low |
| **버전 검증** | 모든 version 필드 일관성 | Low |

### 1.2 Out-of-Scope (테스트 제외)

- FR-2 (Plan Mode 통합) - 미구현
- FR-3 (AskUser Tool 통합) - 미구현
- FR-4 (Agent Registry) - 미구현
- FR-5 (Skills 고도화) - 미구현

---

## 2. 단위 테스트 (Unit Tests)

### 2.1 TC-U-001: xmlSafeOutput() 기본 동작

**목적**: XML 특수문자 이스케이프 정확성 검증

| 테스트 ID | 입력 | 예상 출력 | 검증 항목 |
|-----------|------|----------|----------|
| TC-U-001-01 | `"Hello World"` | `"Hello World"` | 일반 텍스트 통과 |
| TC-U-001-02 | `"A & B"` | `"A &amp; B"` | & 이스케이프 |
| TC-U-001-03 | `"<tag>"` | `"&lt;tag&gt;"` | < > 이스케이프 |
| TC-U-001-04 | `'"quoted"'` | `"&quot;quoted&quot;"` | " 이스케이프 |
| TC-U-001-05 | `"'single'"` | `"&#39;single&#39;"` | ' 이스케이프 |
| TC-U-001-06 | `"<a href=\"x\">A & B</a>"` | `"&lt;a href=&quot;x&quot;&gt;A &amp; B&lt;/a&gt;"` | 복합 이스케이프 |
| TC-U-001-07 | `null` | `null` | null 통과 |
| TC-U-001-08 | `undefined` | `undefined` | undefined 통과 |
| TC-U-001-09 | `""` | `""` | 빈 문자열 통과 |
| TC-U-001-10 | `123` (숫자) | `123` | 비문자열 통과 |

### 2.2 TC-U-002: xmlSafeOutput() 이스케이프 순서

**목적**: & 문자가 먼저 처리되어 이중 이스케이프 방지 확인

| 테스트 ID | 입력 | 예상 출력 | 검증 항목 |
|-----------|------|----------|----------|
| TC-U-002-01 | `"&lt;"` | `"&amp;lt;"` | 기존 엔티티 보존 |
| TC-U-002-02 | `"&amp;"` | `"&amp;amp;"` | &amp; 정상 처리 |
| TC-U-002-03 | `"&&"` | `"&amp;&amp;"` | 연속 & 처리 |

### 2.3 TC-U-003: outputAllow() Gemini CLI 분기

**목적**: Gemini CLI 환경에서 xmlSafeOutput() 적용 확인

**전제조건**: `BKIT_PLATFORM=gemini` 환경변수 설정

| 테스트 ID | 입력 context | 예상 stdout | 검증 항목 |
|-----------|-------------|-------------|----------|
| TC-U-003-01 | `"PDCA Check"` | `💡 bkit Context: PDCA Check` | 일반 텍스트 |
| TC-U-003-02 | `"<feature>"` | `💡 bkit Context: &lt;feature&gt;` | XML 이스케이프 적용 |
| TC-U-003-03 | `"A & B"` | `💡 bkit Context: A &amp; B` | & 이스케이프 |
| TC-U-003-04 | `""` | (출력 없음) | 빈 컨텍스트 처리 |
| TC-U-003-05 | `null` | (출력 없음) | null 처리 |

### 2.4 TC-U-004: outputAllow() Claude Code 분기

**목적**: Claude Code 환경에서 기존 동작 유지 확인

**전제조건**: `BKIT_PLATFORM=claude` 또는 미설정

| 테스트 ID | 입력 | hookEvent | 예상 stdout | 검증 항목 |
|-----------|------|-----------|-------------|----------|
| TC-U-004-01 | `"context"` | PostToolUse | `{"hookSpecificOutput":{...}}` | JSON 형식 유지 |
| TC-U-004-02 | `"context"` | PreToolUse | `{"hookSpecificOutput":{...}}` | PreToolUse 스키마 |
| TC-U-004-03 | `"context"` | Stop | `{"systemMessage":"context"}` | Stop 스키마 |
| TC-U-004-04 | `""` | PostToolUse | `{}` | 빈 JSON |

### 2.5 TC-U-005: outputBlock() Gemini CLI 분기

**목적**: Gemini CLI 환경에서 xmlSafeOutput() 적용 확인

**전제조건**: `BKIT_PLATFORM=gemini` 환경변수 설정

| 테스트 ID | 입력 reason | 예상 stderr | Exit Code | 검증 항목 |
|-----------|------------|-------------|:---------:|----------|
| TC-U-005-01 | `"Blocked"` | `🚫 bkit Blocked: Blocked` | 1 | 일반 텍스트 |
| TC-U-005-02 | `"<script>alert()</script>"` | `🚫 bkit Blocked: &lt;script&gt;...` | 1 | XSS 방지 |
| TC-U-005-03 | `"Error & Warning"` | `🚫 bkit Blocked: Error &amp; Warning` | 1 | & 이스케이프 |

### 2.6 TC-U-006: outputBlock() Claude Code 분기

**목적**: Claude Code 환경에서 기존 동작 유지 확인

**전제조건**: `BKIT_PLATFORM=claude` 또는 미설정

| 테스트 ID | 입력 reason | 예상 stderr | Exit Code | 검증 항목 |
|-----------|------------|-------------|:---------:|----------|
| TC-U-006-01 | `"Blocked"` | `Blocked` | 2 | 원본 출력 |
| TC-U-006-02 | `"<script>"` | `<script>` | 2 | 이스케이프 없음 |

---

## 3. 통합 테스트 (Integration Tests)

### 3.1 TC-I-001: SessionStart 훅 전체 파이프라인

**목적**: session-start.js → outputAllow() 경로 검증

| 테스트 ID | 시나리오 | 예상 결과 | 플랫폼 |
|-----------|----------|----------|--------|
| TC-I-001-01 | 새 세션 시작 | PDCA 상태 컨텍스트 출력 | Gemini |
| TC-I-001-02 | 새 세션 시작 | JSON 컨텍스트 출력 | Claude |
| TC-I-001-03 | 이전 작업 있음 | Resume 안내 포함 | Both |

### 3.2 TC-I-002: PreToolUse (BeforeTool) 훅 파이프라인

**목적**: pre-write.js → outputAllow()/outputBlock() 경로 검증

| 테스트 ID | 시나리오 | 예상 결과 | 플랫폼 |
|-----------|----------|----------|--------|
| TC-I-002-01 | 일반 파일 쓰기 | 허용 + PDCA 힌트 | Both |
| TC-I-002-02 | PDCA 문서 쓰기 | 허용 + 가이드 | Both |
| TC-I-002-03 | 블록 조건 발생 | Block 메시지 (이스케이프됨) | Gemini |

### 3.3 TC-I-003: PostToolUse (AfterTool) 훅 파이프라인

**목적**: pdca-post-write.js → outputAllow() 경로 검증

| 테스트 ID | 시나리오 | 예상 결과 | 플랫폼 |
|-----------|----------|----------|--------|
| TC-I-003-01 | 소스 파일 작성 후 | 분석 제안 컨텍스트 | Both |
| TC-I-003-02 | PDCA 문서 작성 후 | 다음 단계 안내 | Both |

### 3.4 TC-I-004: AgentStop 훅 파이프라인

**목적**: *-stop.js 스크립트 동작 검증

| 테스트 ID | 에이전트 | 예상 결과 | 플랫폼 |
|-----------|----------|----------|--------|
| TC-I-004-01 | gap-detector | 다음 단계 안내 | Gemini |
| TC-I-004-02 | pdca-iterator | 반복 결과 요약 | Gemini |
| TC-I-004-03 | code-analyzer | 분석 결과 요약 | Gemini |
| TC-I-004-04 | qa-monitor | QA 결과 요약 | Gemini |

---

## 4. 회귀 테스트 (Regression Tests)

### 4.1 TC-R-001: Claude Code JSON 출력 형식

**목적**: Claude Code 환경에서 기존 JSON 스키마 유지 확인

| 테스트 ID | 훅 이벤트 | 검증 항목 |
|-----------|----------|----------|
| TC-R-001-01 | PreToolUse | hookSpecificOutput.hookEventName 존재 |
| TC-R-001-02 | PostToolUse | hookSpecificOutput.additionalContext 존재 |
| TC-R-001-03 | SessionStart | hookSpecificOutput 구조 유지 |
| TC-R-001-04 | UserPromptSubmit | hookEventName 필드 존재 |
| TC-R-001-05 | Stop | systemMessage 필드 존재 |
| TC-R-001-06 | PreCompact | hookSpecificOutput 구조 유지 |

### 4.2 TC-R-002: 기존 스크립트 동작

**목적**: 28개 스크립트의 기존 동작 유지 확인

| 테스트 ID | 스크립트 | 검증 항목 |
|-----------|----------|----------|
| TC-R-002-01 | pre-write.js | PDCA 가이드 정상 출력 |
| TC-R-002-02 | pdca-post-write.js | 후처리 정상 동작 |
| TC-R-002-03 | phase-transition.js | 페이즈 전환 로직 유지 |
| TC-R-002-04 | task-classify.js | 태스크 분류 정상 |
| TC-R-002-05 | select-template.js | 템플릿 선택 정상 |

### 4.3 TC-R-003: lib/common.js 기존 함수

**목적**: 수정되지 않은 함수들의 동작 유지 확인

| 테스트 ID | 함수 | 검증 항목 |
|-----------|------|----------|
| TC-R-003-01 | truncateContext() | 길이 제한 동작 |
| TC-R-003-02 | isGeminiCli() | 플랫폼 감지 정확성 |
| TC-R-003-03 | isClaudeCode() | 플랫폼 감지 정확성 |
| TC-R-003-04 | detectLevel() | 레벨 감지 정상 |
| TC-R-003-05 | parseHookInput() | 입력 파싱 정상 |

---

## 5. 호환성 테스트 (Compatibility Tests)

### 5.1 TC-C-001: Gemini CLI v0.25.0

**목적**: 최소 요구 버전에서 정상 동작 확인

| 테스트 ID | 시나리오 | 예상 결과 |
|-----------|----------|----------|
| TC-C-001-01 | 확장 로드 | engines 버전 체크 통과 |
| TC-C-001-02 | SessionStart 훅 | 정상 실행 |
| TC-C-001-03 | BeforeTool 훅 | 정상 실행 |
| TC-C-001-04 | AfterTool 훅 | 정상 실행 |
| TC-C-001-05 | XML 래핑 없음 | 이스케이프 무해 |

### 5.2 TC-C-002: Gemini CLI v0.26-preview

**목적**: Preview 버전에서 정상 동작 확인

| 테스트 ID | 시나리오 | 예상 결과 |
|-----------|----------|----------|
| TC-C-002-01 | XML 래핑 환경 | 출력 정상 파싱 |
| TC-C-002-02 | 특수문자 포함 출력 | 이스케이프 적용 확인 |
| TC-C-002-03 | enable* 설정 체계 | 영향 없음 확인 |

### 5.3 TC-C-003: Gemini CLI v0.27-nightly

**목적**: 최신 nightly 버전에서 정상 동작 확인

| 테스트 ID | 시나리오 | 예상 결과 |
|-----------|----------|----------|
| TC-C-003-01 | XML 래핑 + 이스케이프 | 정상 파싱 |
| TC-C-003-02 | AskUser Tool 공존 | 충돌 없음 |
| TC-C-003-03 | Agent Registry 공존 | 충돌 없음 |

### 5.4 TC-C-004: Claude Code v2.1.15+

**목적**: Claude Code 환경에서 회귀 없음 확인

| 테스트 ID | 시나리오 | 예상 결과 |
|-----------|----------|----------|
| TC-C-004-01 | JSON 출력 | 기존 스키마 유지 |
| TC-C-004-02 | Exit Code | 0 (allow), 2 (block) 유지 |
| TC-C-004-03 | 훅 체인 | 정상 실행 |

---

## 6. 버전 검증 테스트 (Version Verification)

### 6.1 TC-V-001: 버전 일관성

**목적**: 모든 버전 필드가 1.4.3으로 통일되었는지 확인

| 테스트 ID | 파일 | 필드 | 예상값 |
|-----------|------|------|--------|
| TC-V-001-01 | .claude-plugin/plugin.json | version | 1.4.3 |
| TC-V-001-02 | .claude-plugin/marketplace.json | version (root) | 1.4.3 |
| TC-V-001-03 | .claude-plugin/marketplace.json | plugins[1].version | 1.4.3 |
| TC-V-001-04 | gemini-extension.json | version | 1.4.3 |
| TC-V-001-05 | CHANGELOG.md | [1.4.3] 섹션 | 존재 |
| TC-V-001-06 | README.md | Version 배지 | 1.4.3 |

### 6.2 TC-V-002: engines 버전

**목적**: engines.gemini-cli 버전 요구사항 확인

| 테스트 ID | 파일 | 필드 | 예상값 |
|-----------|------|------|--------|
| TC-V-002-01 | gemini-extension.json | engines.gemini-cli | >=0.25.0 |
| TC-V-002-02 | gemini-extension.json | engines.node | >=18.0.0 |
| TC-V-002-03 | README.md | Gemini CLI 배지 | v0.25.0+ |

---

## 7. 테스트 환경

### 7.1 필수 환경

| 환경 | 버전 | 용도 |
|------|------|------|
| Node.js | >= 18.0.0 | 스크립트 실행 |
| macOS/Linux/Windows | Any | 크로스 플랫폼 테스트 |

### 7.2 테스트 대상 플랫폼

| 플랫폼 | 버전 | 우선순위 |
|--------|------|:--------:|
| Claude Code | v2.1.15+ | High |
| Gemini CLI | v0.25.0 | Medium |
| Gemini CLI | v0.26-preview | High |
| Gemini CLI | v0.27-nightly | High |

### 7.3 환경 변수

| 변수 | 값 | 용도 |
|------|-----|------|
| BKIT_PLATFORM | gemini / claude | 플랫폼 강제 설정 |
| CLAUDE_PLUGIN_ROOT | 경로 | 플러그인 루트 |
| GEMINI_PROJECT_DIR | 경로 | Gemini 프로젝트 |

---

## 8. 테스트 실행 계획

### 8.1 Phase 1: 단위 테스트 (자동화)

**예상 소요**: 1시간

1. TC-U-001 ~ TC-U-006 실행
2. 테스트 스크립트 작성: `tests/unit/xml-safe-output.test.js`
3. 테스트 스크립트 작성: `tests/unit/output-functions.test.js`

### 8.2 Phase 2: 통합 테스트 (수동/자동)

**예상 소요**: 2시간

1. TC-I-001 ~ TC-I-004 실행
2. 각 훅 시나리오별 수동 테스트
3. 결과 기록

### 8.3 Phase 3: 회귀 테스트 (자동화)

**예상 소요**: 1시간

1. TC-R-001 ~ TC-R-003 실행
2. 기존 테스트 스위트 실행 (있는 경우)

### 8.4 Phase 4: 호환성 테스트 (수동)

**예상 소요**: 3시간

1. 각 Gemini CLI 버전 설치
2. TC-C-001 ~ TC-C-004 실행
3. 실환경 동작 확인

### 8.5 Phase 5: 버전 검증 (자동화)

**예상 소요**: 30분

1. TC-V-001 ~ TC-V-002 실행
2. grep/jq로 버전 필드 검증

---

## 9. 성공 기준

### 9.1 필수 통과 조건

| 조건 | 기준 |
|------|------|
| 단위 테스트 | 100% 통과 |
| 회귀 테스트 | 100% 통과 |
| Claude Code 호환성 | 100% 통과 |
| 버전 일관성 | 100% 일치 |

### 9.2 권장 통과 조건

| 조건 | 기준 |
|------|------|
| Gemini CLI v0.25.0 | 100% 통과 |
| Gemini CLI v0.26-preview | 100% 통과 |
| Gemini CLI v0.27-nightly | 100% 통과 |

---

## 10. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Gemini CLI 버전 미설치 | 호환성 테스트 불가 | Docker 또는 버전 관리자 활용 |
| 실환경 테스트 어려움 | 일부 시나리오 미검증 | Mock 환경 구성 |
| CI/CD 미구축 | 자동화 테스트 제한 | 수동 테스트 + 스크립트 |

---

## 11. 산출물

| 산출물 | 경로 |
|--------|------|
| 테스트 계획서 | docs/01-plan/features/gemini-cli-v026-compatibility-test.plan.md |
| 단위 테스트 코드 | tests/unit/*.test.js |
| 테스트 결과 보고서 | docs/03-analysis/gemini-cli-v026-compatibility-test.analysis.md |

---

**Plan Generated By**: bkit PDCA Plan Generator
**Co-Authored-By**: Claude Opus 4.5 <noreply@anthropic.com>
