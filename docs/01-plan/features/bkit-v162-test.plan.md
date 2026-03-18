# bkit v1.6.2 Test Plan

> **Summary**: bkit v1.6.2 변경사항에 맞춰 기존 1,025 TC를 업데이트하고 신규 TC를 추가하는 테스트 계획
>
> **Project**: bkit-claude-code
> **Version**: 1.6.2
> **Author**: CTO Lead (QA Team 8명 협업)
> **Date**: 2026-03-18
> **Status**: Plan

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | v1.6.2에서 hook event 2개 추가(PostCompact, StopFailure), agent 8개 추가(29개), PLUGIN_DATA backup/restore, effort/maxTurns frontmatter 등 주요 변경사항이 기존 1,025 TC에 반영되지 않아 테스트 커버리지 갭이 발생 |
| **Solution** | 기존 TC 6개 파일 업데이트 + 신규 TC 6개 파일 추가로 총 ~1,120 TC 달성. 기존 TC 하위 호환성을 유지하면서 v1.6.2 변경사항 100% 커버 |
| **Function/UX Effect** | 모든 regression 테스트가 v1.6.2 실제 상태를 정확히 검증. run-all.js 한 번 실행으로 전체 품질 확인 가능 |
| **Core Value** | Automation First 철학 준수 - 수동 검증 0건, 모든 변경사항이 자동 TC로 검증됨 |

---

## 1. Overview

### 1.1 Purpose

bkit v1.6.2에서 발생한 구조적 변경사항(hook 추가, agent 추가, 신규 함수, frontmatter 필드 추가)을 기존 테스트 스위트에 반영하여 regression을 방지하고, 신규 기능에 대한 테스트 커버리지를 확보한다.

### 1.2 Background

v1.6.1에서 v1.6.2로 업그레이드하면서 다음 변경이 발생했다:

| 변경 영역 | v1.6.1 | v1.6.2 | 차이 |
|-----------|--------|--------|------|
| Hook Events (hooks.json) | 10개 | 12개 | +PostCompact, +StopFailure |
| Agents | 21개 | 29개 | +8 (pdca-eval-*, skill-needs-extractor, pm-lead-skill-patch) |
| common.js exports | 208개 | 210개 | +backupToPluginData, +restoreFromPluginData |
| Agent frontmatter | name, model, disallowedTools | +effort, +maxTurns | 29개 전체 적용 |
| 신규 스크립트 | - | post-compaction.js, stop-failure-handler.js | 2개 추가 |
| PLUGIN_DATA | - | backup/restore 함수 | paths.js에 2개 함수 추가 |
| plugin.json version | 1.6.1 | 1.6.2 | 버전 업데이트 |
| bkit.config.json version | 1.6.1 | 1.6.2 | 버전 업데이트 |

### 1.3 Related Documents

- 기존 테스트 리포트: `docs/04-report/features/bkit-v161-comprehensive-test.report.md`
- 기존 Plan: `docs/01-plan/features/bkit-v161-comprehensive-test.plan.md`
- CC 호환성 분석: `docs/03-analysis/claude-code-v2177-impact-analysis.md`

---

## 2. Scope

### 2.1 In Scope

- [x] 기존 regression TC 업데이트 (hooks-10 -> hooks-12, agents-21 -> agents-29)
- [x] 기존 unit/integration TC 업데이트 (common.js 210 exports, export-compat)
- [x] 기존 security TC 업데이트 (agent-frontmatter effort/maxTurns 검증)
- [x] 기존 cc-compat TC 업데이트 (v1.6.2 버전, 29 agents, 12 hooks)
- [x] 신규 TC: PostCompact hook 기능 검증
- [x] 신규 TC: StopFailure hook 기능 검증
- [x] 신규 TC: PLUGIN_DATA backup/restore 기능 검증
- [x] 신규 TC: Agent effort/maxTurns frontmatter 정합성 검증
- [x] 신규 TC: Session-start PLUGIN_DATA restore 통합 검증
- [x] 신규 TC: 신규 함수 성능 벤치마크
- [x] run-all.js 업데이트 (TC 수, 카테고리 조정)

### 2.2 Out of Scope

- E2E 테스트 (claude -p 기반, 별도 run-e2e.sh로 실행)
- CC v2.1.78 자체 기능 테스트 (bkit 코드베이스 외부)
- PM Agent Team 테스트 (Agent Teams 환경 필수, CI 미지원)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | 요구사항 | 우선순위 | 상태 |
|----|---------|---------|------|
| FR-01 | hooks-10.test.js를 hooks-12.test.js로 확장하여 PostCompact, StopFailure 검증 | High | Pending |
| FR-02 | agents-21.test.js를 agents-29.test.js로 확장하여 29개 agent 검증 | High | Pending |
| FR-03 | other-modules.test.js에서 common.js 210 exports 검증 | High | Pending |
| FR-04 | export-compat.test.js에서 backupToPluginData, restoreFromPluginData 검증 | High | Pending |
| FR-05 | agent-frontmatter.test.js에서 effort/maxTurns 보안 범위 검증 | High | Pending |
| FR-06 | cc-compat.test.js에서 v1.6.2 버전, 29 agents, 12 hooks 검증 | High | Pending |
| FR-07 | 신규: PostCompact hook 스크립트 단위 검증 (post-compaction.js) | Medium | Pending |
| FR-08 | 신규: StopFailure hook 스크립트 단위 검증 (stop-failure-handler.js) | Medium | Pending |
| FR-09 | 신규: PLUGIN_DATA backup/restore 함수 단위 검증 | Medium | Pending |
| FR-10 | 신규: 29 agents effort/maxTurns 정합성 검증 | Medium | Pending |
| FR-11 | 신규: Session-start restore 통합 플로우 검증 | Low | Pending |
| FR-12 | 신규: backupToPluginData/restoreFromPluginData 성능 벤치마크 | Low | Pending |

### 3.2 Non-Functional Requirements

| 카테고리 | 기준 | 측정 방법 |
|---------|------|----------|
| 하위 호환성 | 기존 TC 중 변경 없는 TC는 100% PASS 유지 | run-all.js 실행 |
| 실행 시간 | 전체 테스트 120초 이내 완료 | run-all.js --performance |
| 확장성 | 신규 TC 추가 시 run-all.js 수정 최소화 | 파일 등록만으로 추가 |

---

## 4. TC 분류 및 변경 계획

### 4.1 기존 TC 업데이트 (6개 파일)

| # | 파일 | 현재 TC 수 | 변경 후 TC 수 | 변경 내용 |
|---|------|-----------|-------------|----------|
| 1 | regression/hooks-10.test.js | 10 | 12 | +PostCompact(HK-11), +StopFailure(HK-12), 파일명 hooks-12.test.js로 변경 |
| 2 | regression/agents-21.test.js | 42 | 58 | 29 agents x 2 TC (frontmatter + triggers) = 58 TC |
| 3 | unit/other-modules.test.js | 95 | 97 | common.js >= 210 검증, +backupToPluginData, +restoreFromPluginData export 확인 |
| 4 | integration/export-compat.test.js | 30 | 34 | +backupToPluginData, +restoreFromPluginData re-export 검증, Paths 10 exports 검증 |
| 5 | security/agent-frontmatter.test.js | 35 | 40 | +effort 값 범위(low/medium/high), +maxTurns 값 범위(15~50) 검증 |
| 6 | regression/cc-compat.test.js | 12 | 16 | version 1.6.2, 29 agents, 12 hooks, effort/maxTurns 존재 검증 |

**기존 TC 영향 요약**: 224 TC -> 257 TC (+33 TC)

### 4.2 신규 TC 추가 (6개 파일)

| # | 파일 | TC 수 | 카테고리 | 검증 대상 |
|---|------|-------|---------|----------|
| 1 | unit/post-compaction.test.js | 15 | Unit | post-compaction.js 로직 검증 |
| 2 | unit/stop-failure.test.js | 15 | Unit | stop-failure-handler.js 에러 분류, 복구 로직 |
| 3 | unit/plugin-data.test.js | 20 | Unit | backupToPluginData, restoreFromPluginData 함수 |
| 4 | regression/agents-effort.test.js | 29 | Regression | 29 agents effort/maxTurns 값 정합성 |
| 5 | integration/session-restore.test.js | 10 | Integration | SessionStart -> PLUGIN_DATA restore 통합 플로우 |
| 6 | performance/plugin-data-perf.test.js | 6 | Performance | backup/restore 함수 성능 (< 100ms 기준) |

**신규 TC 합계**: 95 TC

### 4.3 TC 수 총정리

| 카테고리 | v1.6.1 TC | 업데이트 증분 | 신규 증분 | v1.6.2 TC |
|---------|----------|-------------|----------|----------|
| Unit | 469 | +2 | +50 | 521 |
| Integration | 120 | +4 | +10 | 134 |
| Security | 71 | +5 | 0 | 76 |
| Regression | 155 | +20 | +29 | 204 |
| UX | 60 | 0 | 0 | 60 |
| Philosophy | 60 | 0 | 0 | 60 |
| Performance | 70 | 0 | +6 | 76 |
| E2E | 20 | 0 | 0 | 20 |
| **Total** | **1,025** | **+31** | **+95** | **~1,151** |

---

## 5. 우선순위 및 실행 순서

### 5.1 Phase 1: Critical (즉시, 기존 TC 깨짐 방지)

| 순서 | 작업 | 이유 |
|------|------|------|
| 1 | regression/cc-compat.test.js 업데이트 | version 1.6.2 변경으로 즉시 FAIL |
| 2 | regression/agents-21.test.js -> agents-29.test.js | 29 agents로 확장 필요 |
| 3 | regression/hooks-10.test.js -> hooks-12.test.js | 12 hooks로 확장 필요 |
| 4 | unit/other-modules.test.js 업데이트 | 210 exports 반영 |
| 5 | run-all.js 업데이트 | 파일명 변경 반영 |

### 5.2 Phase 2: High (신규 기능 커버리지)

| 순서 | 작업 | 이유 |
|------|------|------|
| 6 | unit/plugin-data.test.js 신규 | 핵심 신규 함수 검증 |
| 7 | integration/export-compat.test.js 업데이트 | 신규 export 검증 |
| 8 | security/agent-frontmatter.test.js 업데이트 | 보안 모델 확장 검증 |
| 9 | regression/agents-effort.test.js 신규 | 29 agents 정합성 |

### 5.3 Phase 3: Medium (신규 hook 스크립트)

| 순서 | 작업 | 이유 |
|------|------|------|
| 10 | unit/post-compaction.test.js 신규 | PostCompact hook 검증 |
| 11 | unit/stop-failure.test.js 신규 | StopFailure hook 검증 |
| 12 | integration/session-restore.test.js 신규 | 통합 플로우 검증 |

### 5.4 Phase 4: Low (성능 + 최종 검증)

| 순서 | 작업 | 이유 |
|------|------|------|
| 13 | performance/plugin-data-perf.test.js 신규 | 성능 회귀 방지 |
| 14 | 전체 run-all.js 통합 실행 | 최종 검증 |

---

## 6. Success Criteria

### 6.1 Definition of Done

- [x] 모든 기존 TC 중 변경하지 않은 TC가 100% PASS
- [x] 업데이트된 TC가 v1.6.2 실제 코드베이스에서 100% PASS
- [x] 신규 TC가 v1.6.2 실제 코드베이스에서 100% PASS
- [x] run-all.js 실행 시 전체 ~1,151 TC에서 0 FAIL
- [x] 테스트 실행 시간 120초 이내

### 6.2 Quality Criteria

- [x] 모든 TC에 고유 ID 부여 (중복 없음)
- [x] 모든 TC가 독립 실행 가능 (다른 TC에 의존하지 않음)
- [x] Node.js native assert만 사용 (외부 프레임워크 없음)
- [x] bkit 3대 철학 준수: Automation First, No Guessing, Docs=Code

---

## 7. Risks and Mitigation

| 리스크 | 영향 | 가능성 | 대응 |
|--------|------|-------|------|
| 파일명 변경(hooks-10 -> hooks-12)으로 CI 파이프라인 깨짐 | High | Medium | run-all.js에서 파일 존재 여부 체크 후 fallback |
| PLUGIN_DATA 환경변수 없이 테스트 시 SKIP 증가 | Medium | High | 환경변수 없을 때 mock fallback 로직 추가 |
| 29 agents 중 일부 frontmatter 파싱 실패 | Medium | Low | parseFrontmatter 함수 강화, 에러 메시지 상세화 |
| common.js export 수가 추후 변경될 경우 TC 깨짐 | Low | Medium | 범위 기반 검증 (>= 210)으로 유연성 확보 |

---

## 8. 테스트 환경

### 8.1 필수 환경

| 항목 | 값 |
|------|-----|
| Node.js | >= 18.x |
| OS | macOS, Linux |
| 테스트 프레임워크 | Node.js native (no Jest) |
| Helper | test/helpers/assert.js, timer.js, report.js |
| 실행 방법 | `node test/run-all.js` |

### 8.2 선택 환경

| 항목 | 용도 |
|------|------|
| CLAUDE_PLUGIN_DATA | PLUGIN_DATA backup/restore 테스트에 필요 |
| CLAUDE_PLUGIN_ROOT | hook 스크립트 경로 해석에 필요 |
| CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 | Team 관련 TC에 필요 |

---

## 9. Next Steps

1. [ ] Design 문서 작성 (`bkit-v162-test.design.md`)
2. [ ] Phase 1 구현 (기존 TC 업데이트)
3. [ ] Phase 2 구현 (신규 TC 추가)
4. [ ] Phase 3-4 구현 및 통합 검증
5. [ ] run-all.js 최종 실행 및 리포트 생성

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-18 | Initial draft | CTO Lead |
