# Gemini CLI 2026년 1월 업데이트 심층 분석 보고서

> **Project**: bkit-claude-code
> **Report Type**: PDCA Act Phase - Deep Research Report
> **Date**: 2026-01-26
> **Period**: 2025-12-26 ~ 2026-01-26 (최근 1개월)
> **Analyst**: Claude Opus 4.5 + Task Management System
> **Status**: ✅ Completed

---

## Executive Summary

Gemini CLI는 지난 1개월간 **7개 주요 버전**과 **15개 이상의 nightly/preview 빌드**를 릴리즈했습니다. 핵심 변화는 **Agent Skills 정식 지원**, **Plan Mode 도입**, **Gemini 3 Flash 통합**, 그리고 **Hook 시스템 전면 개편**입니다. bkit v1.4.2는 이러한 변화에 대부분 호환되나, 일부 Breaking Changes에 대한 대응이 필요합니다.

---

## 1. 버전 릴리즈 타임라인

### 1.1 Stable Releases

| 버전 | 릴리즈 일자 | 주요 변경사항 |
|------|-------------|---------------|
| **v0.20.0** | 2025-12-01 | Multi-file Drag & Drop, Persistent "Always Allow" Policies |
| **v0.21.0** | 2025-12-10 | ACP SDK 지원, HTTP/SSE MCP 서버 |
| **v0.22.0** | 2025-12-14 | Dynamic mode-aware policy, Hook 보안 경고 |
| **v0.23.0** | 2025-12-17 | Gemini 3 Flash, Agent Skills Preview, Background color detection |
| **v0.24.0** | 2026-01-14 | Folder Trust Support, Model routing, Timestamps for code assist |
| **v0.25.0** | 2026-01-20 | Hook System default ON, Event-driven scheduler, `/introspect` command |
| **v0.25.1** | 2026-01-22 | Auth crash fix, External editor fallback fix |
| **v0.25.2** | 2026-01-23 | Cherry-pick patch |

### 1.2 Preview Releases (v0.26.x)

| 버전 | 릴리즈 일자 | 핵심 기능 |
|------|-------------|-----------|
| **v0.26.0-preview.0** | 2026-01-21 | Agent Skills 정식 활성화, skill-creator skill, Plan Mode |
| **v0.26.0-preview.1~4** | 2026-01-22~25 | 버그 패치 (MCP 초기화, prompt queueing) |

### 1.3 Nightly Builds (v0.27.x)

| 버전 | 릴리즈 일자 | 실험적 기능 |
|------|-------------|-------------|
| **v0.27.0-nightly.20260121** | 2026-01-21 | code-reviewer skill, Plan Mode UI 테마 |
| **v0.27.0-nightly.20260122** | 2026-01-22 | /rewind command, AgentConfigDialog |
| **v0.27.0-nightly.20260126** | 2026-01-26 | AgentRegistry, AskUser tool, Tool confirmation queue UX |

---

## 2. 주요 기능 변경 상세

### 2.1 Agent Skills System (정식 출시)

**변경 시점**: v0.26.0-preview.0 (2026-01-21)

```
이전: Agent Skills는 Preview 기능 (수동 활성화 필요)
현재: Agent Skills가 기본 활성화됨 (enableAgentSkills: true)
```

**주요 변경사항**:
- `skill-creator` 빌트인 스킬 추가 - 사용자가 직접 스킬 생성 가능
- `code-reviewer` 스킬 추가 (nightly)
- `docs-writer` 스킬 추가 (nightly)
- Skills scope 변경: `project` → `workspace`
- Skills 충돌 감지 및 경고 기능

**관련 PR**:
- [#16394](https://github.com/google-gemini/gemini-cli/pull/16394) - skill-creator 도입
- [#16380](https://github.com/google-gemini/gemini-cli/pull/16380) - workspace scope 리팩토링
- [#16736](https://github.com/google-gemini/gemini-cli/pull/16736) - Agent Skills 기본 활성화

### 2.2 Plan Mode (신규)

**변경 시점**: v0.26.0-preview.0 (2026-01-21)

Plan Mode는 코드 변경 전 사용자 승인을 받는 새로운 워크플로우입니다.

**Approval Modes**:
| Mode | 설명 |
|------|------|
| `approve_all` | 모든 도구 호출 자동 승인 |
| `approve_once` | 도구별 일회성 승인 |
| `plan` | 읽기 전용 도구만 허용, 쓰기 작업은 계획서 생성 후 승인 필요 |

**관련 기능**:
- `Shift+Tab`으로 Plan Mode 순환 가능
- `/introspect` 명령으로 현재 상태 확인
- `approvalMode` 설정 영속화

**관련 PR**:
- [#16650](https://github.com/google-gemini/gemini-cli/pull/16650) - experimental plan flag
- [#16753](https://github.com/google-gemini/gemini-cli/pull/16753) - experimental plan approval mode
- [#17177](https://github.com/google-gemini/gemini-cli/pull/17177) - Shift+Tab Plan Mode cycling
- [#17326](https://github.com/google-gemini/gemini-cli/pull/17326) - simple workflow for planning

### 2.3 Gemini 3 Flash Integration

**변경 시점**: v0.23.0 (2025-12-17)

- **SWE-bench 점수**: 78% (agentic coding)
- **비용**: Gemini 3 Pro의 1/4 이하
- **Model Routing**: 단순 쿼리는 Flash, 복잡한 작업은 Pro로 자동 분배
- **Codebase Investigator**: 새로운 빌트인 subagent로 워크스페이스 탐색 성능 향상

### 2.4 Hook System 전면 개편

**변경 시점**: v0.25.0 (2026-01-20) 이후

**Breaking Changes**:

| 변경 항목 | 이전 | 현재 |
|-----------|------|------|
| Hook System | 수동 활성화 | **기본 활성화** |
| `beforeAgent`/`afterAgent` | 지원 | **제거됨** |
| `BeforeModel`/`AfterModel` | 별도 시스템 | HookSystem으로 통합 |
| `fireToolNotificationHook` | 별도 시스템 | HookSystem으로 마이그레이션 |
| Hook context 주입 | 평문 | **XML 태그로 래핑** (보안 강화) |

**신규 Hook 이벤트**:
- `AfterAgent`: `clearContext` 옵션 추가
- Hook의 `type` 필드 필수화

**관련 PR**:
- [#17247](https://github.com/google-gemini/gemini-cli/pull/17247) - hooks system 기본 활성화
- [#16919](https://github.com/google-gemini/gemini-cli/pull/16919) - fireAgent/beforeAgent 제거
- [#17237](https://github.com/google-gemini/gemini-cli/pull/17237) - hook-injected context XML 래핑
- [#16574](https://github.com/google-gemini/gemini-cli/pull/16574) - AfterAgent clearContext

### 2.5 MCP (Model Context Protocol) 개선

- `/mcp enable` / `/mcp disable` 명령 추가
- MCP 초기화 중 prompt queueing 지원
- MCP 서버 이름을 OAuth 메시지에 포함
- HTTP/SSE 기반 MCP 서버 공식 지원

### 2.6 Agent Configuration

**변경 시점**: v0.27.0-nightly (2026-01-22~)

- `/agents config` 명령 추가
- `AgentRegistry`로 모든 발견된 subagent 추적
- Subagent에 JSON schema type input 지원
- Agent 활성화/비활성화 토글 UI
- Extension 로드 후 agent 자동 새로고침

### 2.7 AskUser Tool (신규)

**변경 시점**: v0.27.0-nightly (2026-01-23~)

사용자에게 직접 질문하는 새로운 도구:
- `AskUser` tool schema 정의
- `AskUserDialog` UI 컴포넌트
- Simple planning workflow에 통합 예정

---

## 3. Bug Fixes (최근 1개월)

### 3.1 해결된 주요 버그 (30건 분석)

| Issue # | 제목 | 해결일 |
|---------|------|--------|
| #16791 | command/ctrl/alt backspace 지원 | 2026-01-21 |
| #16418 | Unicode Sequence로 CLI 크래시 | 2026-01-12 |
| #16416 | thought loop에 빠지는 문제 | 2026-01-20 |
| #16411 | internal thinking 출력됨 | 2026-01-24 |
| #15624 | 도구 승인 거부 시 입력 텍스트 삭제됨 | 2026-01-23 |
| #15278 | BeforeAgent Hooks Prompt Injection 보안 | 2026-01-22 |
| #16213 | Context compression loop | 2026-01-19 |
| #15873 | 터미널 종료 후 100% CPU 사용 | 2026-01-20 |
| #14705 | Windows canvas 의존성 설치 실패 | 2026-01-21 |

### 3.2 진행 중인 주요 이슈

| Issue # | 제목 | 상태 |
|---------|------|------|
| #17409 | --resume 시 /dir add 디렉토리 미유지 | 🔄 Open (P1) |
| #17318 | 장시간 세션에서 SSL 크래시 | 🔄 Open (P1) |
| #17309 | [Agents] V1 Epic | 🔄 진행 중 |
| #17120 | Parallel Tool Calling Epic | 🔄 진행 중 |
| #17147 | Tool Confirmation Message Bus MVP | 🔄 진행 중 |

---

## 4. bkit 호환성 영향 분석

### 4.1 현재 bkit 상태

```json
// gemini-extension.json
{
  "version": "1.4.2",
  "engines": { "gemini-cli": ">=1.0.0" }
}
```

### 4.2 호환성 매트릭스

| Gemini CLI 기능 | bkit 지원 상태 | 조치 필요 |
|-----------------|---------------|-----------|
| Agent Skills (v0.26+) | ✅ 호환 | - |
| Plan Mode | ⚠️ 부분 지원 | 권장: Plan Mode 인식 추가 |
| Hook System 기본 활성화 | ✅ 호환 | - |
| `beforeAgent`/`afterAgent` 제거 | ⚠️ 확인 필요 | `AgentStop` 사용 중 (OK) |
| Hook context XML 래핑 | ⚠️ 테스트 필요 | prompt injection 방어 확인 |
| workspace scope | ✅ 호환 | - |
| AskUser Tool | ❌ 미지원 | 향후 통합 고려 |
| `/agents config` | ❌ 미지원 | 향후 통합 고려 |

### 4.3 권장 조치사항

#### 즉시 조치 (v1.4.3)

1. **Hook context XML 래핑 테스트**
   - `session-start.js`의 출력이 XML 태그로 래핑되는지 확인
   - 기존 hook 스크립트의 context 파싱 로직 검증

2. **engines 버전 업데이트**
   ```json
   "engines": { "gemini-cli": ">=0.25.0" }
   ```

#### 중기 조치 (v1.5.0)

1. **Plan Mode 통합**
   - bkit PDCA workflow와 Plan Mode 연동
   - `pdca-plan` → Gemini Plan Mode 자동 활성화 검토

2. **AskUser Tool 통합**
   - bkit의 `AskUserQuestion` 패턴을 Gemini `AskUser` tool로 연동

3. **Agent Configuration 지원**
   - `/agents config`로 bkit agents 설정 가능하도록 메타데이터 추가

---

## 5. 로드맵 분석 (GitHub 이슈 기반)

### 5.1 개발 중인 Epic 기능들

| Epic | 설명 | 예상 영향 |
|------|------|-----------|
| **[#17309] Agents V1** | Agent 시스템 정식 출시 | bkit agents 완전 통합 가능 |
| **[#17120] Parallel Tool Calling** | 읽기 전용 도구 병렬 실행 | 성능 향상 |
| **[#17147] Tool Confirmation Message Bus** | 도구 승인 UX 개선 | Queue 기반 UX |
| **[#17334] A/B Testing Workflow** | 실험 기능 테스트 | - |

### 5.2 예상 타임라인

```
2026-02월: v0.26.0 Stable (Agent Skills 정식)
2026-02월: v0.27.0 Preview (AskUser, Parallel Tools)
2026-03월: v0.28.0 (Agents V1 정식)
```

---

## 6. 결론 및 권장사항

### 6.1 요약

Gemini CLI는 최근 1개월간 급격한 발전을 이뤘습니다:
- **Agent Skills**: Preview → 정식 활성화
- **Plan Mode**: 새로운 승인 워크플로우
- **Hook System**: 전면 개편 및 보안 강화
- **Gemini 3**: Flash 모델 통합, 지능형 라우팅

### 6.2 bkit 팀 권장사항

| 우선순위 | 항목 | 작업량 |
|----------|------|--------|
| 🔴 High | Hook XML 래핑 호환성 테스트 | 1일 |
| 🔴 High | engines 버전 업데이트 | 즉시 |
| 🟡 Medium | Plan Mode 인식 및 통합 | 3일 |
| 🟡 Medium | AskUser tool 연동 검토 | 2일 |
| 🟢 Low | `/agents config` 메타데이터 | 1일 |

### 6.3 참고 자료

- [Gemini CLI Releases](https://github.com/google-gemini/gemini-cli/releases)
- [Gemini CLI Changelog](https://geminicli.com/docs/changelogs/)
- [Gemini 3 Flash Announcement](https://developers.googleblog.com/gemini-3-flash-is-now-available-in-gemini-cli/)
- [Agent Skills Documentation](https://geminicli.com/docs/extensions/agent-skills/)

---

## Appendix A: 전체 커밋 로그 (1월 26일 기준 최근 50건)

<details>
<summary>최근 커밋 목록 (클릭하여 펼치기)</summary>

| Date | SHA | Message |
|------|-----|---------|
| 2026-01-25 | cb772a5 | docs(hooks): clarify mandatory 'type' field |
| 2026-01-25 | dcd949b | docs: Add MacPorts/Homebrew uninstall instructions |
| 2026-01-25 | c0b8c4a | fix: detect pnpm/pnpx in ~/.local |
| 2026-01-24 | 1832f7b | feat(cli): Moves tool confirmations to queue UX |
| 2026-01-24 | 0c13407 | feat: AgentConfigDialog for /agents config |
| 2026-01-23 | 6fae281 | feat(plan): implement persistent approvalMode |
| 2026-01-23 | da1664c | feat: add clearContext to AfterAgent hooks |
| 2026-01-23 | 2c0cc7b | feat: add AskUserDialog for AskUser tool |
| 2026-01-23 | 3c832dd | feat(plan): simple workflow for planning |
| 2026-01-22 | 35feea8 | feat(cli): add /agents config command |
| 2026-01-22 | a060e61 | feat(mcp): add enable/disable commands |
| 2026-01-22 | 5f1c644 | feat(plan): update UI Theme for Plan Mode |

</details>

---

**Report Generated By**: bkit PDCA Report Generator
**Co-Authored-By**: Claude Opus 4.5 <noreply@anthropic.com>
