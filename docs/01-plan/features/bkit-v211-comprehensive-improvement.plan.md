# bkit v2.1.1 Comprehensive Improvement Planning Document

> **요약**: v2.1.0 Clean Architecture 리팩토링 후 발견된 50+ 결함을 전면 수정하고, CC v2.1.96 최신 기능을 활용하여 bkit의 핵심 가치를 정상화하는 풀 패키지 릴리스
>
> **프로젝트**: bkit (Claude Code Vibecoding Plugin)
> **버전**: v2.1.0 → v2.1.1
> **작성자**: Claude Opus 4.6 + 11-Agent Analysis Team
> **날짜**: 2026-04-08
> **상태**: Draft
> **방법**: Plan Plus (Brainstorming-Enhanced PDCA)

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | v2.1.0 Clean Architecture 리팩토링으로 코드 구조는 개선되었으나, 핵심 기능(AskUserQuestion, Trust↔Automation, Regression Detection, MCP 문서 조회 등)이 단절되거나 미작동 상태. 50+ 결함 발견. |
| **Solution** | 8개 병렬 작업 영역(Hook, StateMachine, Trust, Quality, MCP, Dashboard, Agent, Cleanup)으로 나누어 Surgical Fix + Dead Code 정리 + CC 최신 기능 활용을 동시 진행하는 Clean Sweep 접근법 |
| **기능/UX 효과** | 세션 시작 시 대화형 온보딩 복원, Trust Score가 실제 자동화 레벨에 영향, 설계-구현 갭 자동 감지, 대시보드에서 Impact/Agent 정보 표시, 불필요한 Context 토큰 절감 |
| **핵심 가치** | bkit의 3대 철학(Automation First, No Guessing, Docs=Code)이 코드 레벨에서 실제로 작동하도록 정상화. 문서에만 존재하던 기능들을 실행 가능한 상태로 전환. |

---

## 1. User Intent Discovery

### 1.1 핵심 문제

v2.1.0 리팩토링에서 모듈 분리와 Clean Architecture 구조화에 집중하면서, **모듈 간 연결(wiring)**이 누락된 기능이 다수 발생.
- 함수는 구현되어 있으나 호출하는 코드가 없음 (예: detectRegressions(), appendHistory())
- 데이터 저장소가 이원화되어 동기화 안 됨 (예: trust-profile.json ↔ control-state.json)
- 포맷 변환 함수 불일치 (예: emitUserPrompt() ↔ formatAskUserQuestion())

### 1.2 대상 사용자

| 사용자 유형 | 사용 맥락 | 핵심 니즈 |
|------------|----------|----------|
| bkit 사용자 (전체) | 세션 시작, PDCA 워크플로우 | 대화형 온보딩, 정확한 상태 표시 |
| Dynamic 레벨 개발자 | 풀스택 개발 | Trust Score 기반 자동화, Quality History |
| Enterprise 레벨 팀 | CTO Team, Agent Teams | Trust↔Automation 연동, Audit 정상화 |
| bkit 기여자/유지보수자 | 코드 유지보수 | Dead Code 제거, Context 토큰 절감 |

### 1.3 성공 기준

- [ ] BROKEN 상태 10건 → 0건 (전부 정상 동작)
- [ ] DEAD→ACTIVE 전환 5건 완료
- [ ] 37 orphaned scripts → 조사 후 삭제/재연결 결정 완료
- [ ] 9 broken test files → 전부 통과
- [ ] Context 토큰 사용량 측정 가능한 수준으로 감소
- [ ] CC v2.1.96 활용 기능 3건 이상 적용

### 1.4 제약 조건

| 제약 | 상세 | 영향 |
|------|------|------|
| 하위 호환성 | 기존 .bkit/state/ 파일 포맷 유지 | High |
| CC 호환성 | v2.1.34~v2.1.96 (61개 연속 호환) 유지 | High |
| 파일 변경 범위 | Clean Sweep이지만 ~60-80 파일 이내 | Medium |
| 테스트 | 기존 테스트 깨뜨리지 않음 (broken tests 제외) | High |

---

## 2. Alternatives Explored

### 2.1 Approach A: Surgical Fix

| 관점 | 상세 |
|------|------|
| **요약** | BROKEN 지점만 정확히 수술. 기존 코드 최소 변경 |
| **장점** | 리스크 최소, 빠른 릴리스, 안정성 우선 |
| **단점** | Dead Code 잔존, 불필요한 Context 유지, 기술부채 누적 |
| **규모** | ~25-30 파일, ~500-800 LOC |
| **적합** | 긴급 핫픽스가 필요한 경우 |

### 2.2 Approach B: Clean Sweep — Selected

| 관점 | 상세 |
|------|------|
| **요약** | BROKEN 수정 + Dead Code 전면 정리 + CC 최신 기능 활용 |
| **장점** | 코드 건강성 극대화, Context 토큰 절감, CC 최신 기능 활용 |
| **단점** | 변경 범위 넓음, 테스트 필요량 증가 |
| **규모** | ~60-80 파일, ~2000-3000 LOC (삭제 포함) |
| **적합** | 리팩토링 직후 정리가 필요한 현재 상황 |

### 2.3 Approach C: Full Rewrite (v3.0 수준)

| 관점 | 상세 |
|------|------|
| **요약** | A+B + 신규 기능(Magic Words, PM 자동트리거, /control handler) |
| **장점** | 완전한 기능 완성도 |
| **단점** | 범위 과다, 리스크 높음, v3.0 수준의 대규모 변경 |
| **규모** | ~120+ 파일, ~5000+ LOC |
| **적합** | 별도 메이저 릴리스로 진행 시 |

### 2.4 결정 근거

**선택**: Approach B (Clean Sweep)
**이유**: v2.1.0 리팩토링 직후이므로 Dead Code 정리와 연결 복원을 함께 진행하는 것이 최적. 신규 기능은 v2.2+로 분리하여 리스크 관리.

---

## 3. YAGNI Review

### 3.1 포함 (v2.1.1 Must-Have) — 20건

#### W1: Hook & Onboarding (4건)
- [ ] **H-01** AskUserQuestion 정상화 — onboarding.js에서 formatAskUserQuestion() 사용 + session-context.js userPrompt 출력
- [ ] **H-02** Ambiguity→AskUserQuestion 변환 — 모호성 점수 높을 때 대화형 질문 생성
- [ ] **H-03** io.js/hook-io.js 통합 — 9개 스크립트를 단일 모듈로 마이그레이션
- [ ] **H-04** FileChanged hook 신규 — PDCA 문서 변경 감지 → gap-detector 자동 재실행

#### W2: State Machine (2건)
- [ ] **SM-01** report→report 자기루프 수정 — REPORT_DONE이 archived로 진행
- [ ] **SM-02** Event Name 문서 동기화 — core-mission.md를 실제 이벤트명으로 업데이트

#### W3: Trust & Control (2건)
- [ ] **TC-01** Trust↔Automation 동기화 — trust-profile.json 변경 시 control-state.json 반영
- [ ] **TC-02** Session Stats 증가 연결 — incrementStat() 호출을 관련 hook에 추가

#### W4: Quality & Metrics (4건)
- [ ] **QM-01** Regression Detection 활성화 — unified-stop.js check phase에서 detectRegressions() 호출
- [ ] **QM-02** Quality History 생성 — appendHistory() + analyzeTrend() 호출 추가
- [ ] **QM-03** Decision Tracer 수정 — recordDecision() silent failure 디버깅 및 수정
- [ ] **QM-04** sessionTitle PDCA 자동명명 — SessionStart + phase 전환 시 sessionTitle 설정

#### W5: MCP (1건)
- [ ] **MCP-01** analysis_read 경로 버그 수정 — docsPath()에서 analysis phase features/ 예외 처리

#### W6: Dashboard & UI (2건)
- [ ] **UI-01** Impact View & Agent Panel 활성화 — session-start.js에서 renderImpactView() + renderAgentPanel() 호출
- [ ] **UI-02** Dashboard 렌더링 순서 수정 — Session Context → Progress → Workflow → Agent → Control

#### W7: Agent & Skill (2건)
- [ ] **AS-01** Agent disallowedTools 수정 — pdca-iterator, qa-monitor에서 "Agent" 제거
- [ ] **AS-02** 36 Skills effort frontmatter 추가 — high/medium/low 명시 선언

#### W8: Cleanup & CC 활용 (3건)
- [ ] **CL-01** 37 orphaned scripts 조사 및 정리 — 사용처 조사 후 삭제 또는 재연결
- [ ] **CL-02** 9 broken test files 수정 — lib/common.js 참조를 새 모듈 경로로 업데이트
- [ ] **CL-03** Hook `if` 조건부 패턴 적용 — 신규 단일목적 hook에 성능 최적화 패턴

### 3.2 연기 (v2.2+ Maybe)

| 기능 | 연기 이유 | 재검토 시점 |
|------|----------|------------|
| Magic Words (!hotfix, !prototype) | 새 기능, UX 설계 필요 | v2.2.0 |
| PM 자동 트리거 | "새 기능 만들어줘" → PM agent 자동 | v2.2.0 |
| /control skill handler 전체 구현 | 독립 feature 규모 | v2.2.0 |
| Multi-feature resume UI | 별도 UX 설계 필요 | v2.2.0 |
| PreToolUse defer/headless Q&A | Enterprise 전용 | v2.2.0 |
| PermissionDenied hook | Auto Mode GA 대기 | CC Auto Mode GA |
| Agent initialPrompt 활용 | YAGNI 경계, 효과 불확실 | v2.2.0 |

### 3.3 제거 (Won't Do)

| 기능 | 제거 이유 |
|------|----------|
| lib/adapters/ 빈 디렉토리 | 참조 0건, 미래 계획 불명확 — 삭제 |
| PLUGIN_DATA 이중 백업 | CC v2.1.78 공식 지원으로 중복 — 단순화 |
| gap-detector-post.js | 문서에서도 미사용 확인 — 삭제 |

---

## 4. Scope

### 4.1 In Scope

- [ ] 10건 BROKEN 상태 기능 정상화
- [ ] 5건 DEAD→ACTIVE 기능 활성화
- [ ] 37 orphaned scripts 조사/정리
- [ ] 9 broken test files 수정
- [ ] CC v2.1.96 기능 3건 활용 (sessionTitle, Hook `if`, effort frontmatter)
- [ ] FileChanged hook 신규 추가
- [ ] io.js/hook-io.js 단일 모듈 통합
- [ ] 불필요한 Context 토큰 줄이기

### 4.2 Out of Scope

- 신규 기능 개발 (Magic Words, PM 자동트리거, /control handler)
- Enterprise 전용 기능 (PreToolUse defer, headless Q&A)
- Auto Mode Research Preview 대응 (GA 대기)
- bkit-system/ 문서 전면 재작성 (Event Name 동기화만 수행)

---

## 5. Requirements

### 5.1 Functional Requirements

| ID | 요구사항 | 우선순위 | 영역 |
|----|---------|---------|------|
| FR-01 | SessionStart에서 AskUserQuestion이 실제로 발화되어야 한다 | High | W1 |
| FR-02 | 모호한 요청에 대해 대화형 질문이 생성되어야 한다 | High | W1 |
| FR-03 | PDCA 문서 변경 시 FileChanged hook이 동작해야 한다 | High | W1 |
| FR-04 | REPORT_DONE 이벤트가 report→archived로 전이해야 한다 | High | W2 |
| FR-05 | Trust Score 변경이 Automation Level에 실시간 반영되어야 한다 | High | W3 |
| FR-06 | Session Stats가 실제 사용자 행동에 따라 증가해야 한다 | Medium | W3 |
| FR-07 | check phase에서 Regression Detection이 실행되어야 한다 | High | W4 |
| FR-08 | Quality Metrics 시계열 데이터가 생성되어야 한다 | Medium | W4 |
| FR-09 | Decision Tracer가 .bkit/decisions/ 에 파일을 생성해야 한다 | Medium | W4 |
| FR-10 | bkit_analysis_read MCP 도구가 문서를 정상 반환해야 한다 | High | W5 |
| FR-11 | Dashboard에 Impact View와 Agent Panel이 표시되어야 한다 | Medium | W6 |
| FR-12 | sessionTitle에 현재 PDCA phase가 표시되어야 한다 | Medium | W4 |
| FR-13 | 모든 agent의 disallowedTools가 유효한 도구만 참조해야 한다 | High | W7 |
| FR-14 | 37 orphaned scripts의 사용처를 조사하여 삭제/재연결해야 한다 | Medium | W8 |
| FR-15 | 9 broken test files가 전부 통과해야 한다 | Medium | W8 |

### 5.2 Non-Functional Requirements

| 카테고리 | 기준 | 측정 방법 |
|----------|------|----------|
| 호환성 | CC v2.1.34~v2.1.96 전체 호환 유지 | Hook 동작 검증 |
| 성능 | SessionStart hook 실행 시간 악화 없음 | 타이머 측정 |
| Context 효율 | 불필요한 토큰 감소 (orphaned scripts 삭제 효과) | 전후 비교 |
| 테스트 | 기존 통과 테스트 회귀 0건 | CI 실행 |
| 안정성 | 신규 BROKEN 발생 0건 | gap-detector |

---

## 6. Success Criteria

### 6.1 Definition of Done

- [ ] 20건 작업 항목 전체 구현 완료
- [ ] BROKEN 상태 0건 (gap-detector 검증)
- [ ] 기존 테스트 회귀 0건
- [ ] 9 broken test files 전부 통과
- [ ] bkit-system/ 문서와 코드 Event Name 일치

### 6.2 Quality Criteria

- [ ] Match Rate ≥ 90% (gap-detector)
- [ ] MCP 도구 16/16 정상 동작
- [ ] Dashboard 5개 컴포넌트 전부 렌더링
- [ ] Trust Score → Automation Level 연동 검증
- [ ] Quality History JSONL 파일 생성 확인

---

## 7. Risks and Mitigation

| 리스크 | 영향 | 가능성 | 완화 전략 |
|--------|------|--------|----------|
| orphaned scripts 중 실제 사용 중인 것 삭제 | High | Medium | 삭제 전 grep/git blame으로 사용처 철저 조사 |
| io.js 통합 시 기존 스크립트 호환성 깨짐 | High | Low | 통합 전 인터페이스 동일성 확인, 점진적 마이그레이션 |
| Trust↔Automation 연동이 예상치 못한 레벨 변경 유발 | Medium | Medium | 초기 연동은 로깅만, 강제 레벨 변경은 L3+ 에서만 |
| FileChanged hook이 과도하게 자주 발화 | Medium | Low | `if` 필드로 docs/ 패턴만 필터링 |
| 37 scripts 삭제로 skill frontmatter hook 체인 깨짐 | High | Medium | skill SKILL.md의 hooks 섹션과 교차 검증 |

---

## 8. Architecture Considerations

### 8.1 프로젝트 레벨

| Level | 특성 | Selected |
|-------|------|:--------:|
| **Starter** | 단순 구조 | |
| **Dynamic** | BaaS 연동 | |
| **Enterprise** | MSA, Agent Teams | ✅ |

bkit 자체가 Enterprise 수준의 Plugin 프로젝트 (32 agents, 37 skills, 88 lib modules)

### 8.2 핵심 결정

| 결정 | 옵션 | 선택 | 근거 |
|------|------|------|------|
| 접근법 | Surgical/Clean/Rewrite | Clean Sweep | 리팩토링 직후 정리 최적 시점 |
| 실행 전략 | 순차/병렬/사용자영향순 | 영역별 병렬 | 독립적 영역이므로 병렬 가능 |
| io.js 통합 방향 | hook-io.js로 통합 / io.js로 통합 | 조사 후 결정 | 두 모듈의 export 비교 필요 |
| orphaned scripts | 전부 삭제 / 선별 삭제 | 조사 후 선별 | skill hooks에서 참조할 수 있음 |
| Dead Code 기준 | grep 0 call sites = 삭제 | Context 조사 포함 | 사용자 피드백 반영 |

### 8.3 8개 병렬 작업 영역

```
┌─────────────────────────────────────────────────────────────────┐
│                    bkit v2.1.1 Clean Sweep                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  W1: Hook/Onboarding     W2: State Machine    W3: Trust/Control│
│  ├ H-01 AskUserQuestion  ├ SM-01 Self-loop    ├ TC-01 Sync     │
│  ├ H-02 Ambiguity→Ask    └ SM-02 Event names  └ TC-02 Stats    │
│  ├ H-03 io.js 통합                                              │
│  └ H-04 FileChanged                                             │
│                                                                 │
│  W4: Quality/Metrics     W5: MCP              W6: Dashboard/UI │
│  ├ QM-01 Regression      └ MCP-01 docsPath    ├ UI-01 Panels   │
│  ├ QM-02 History                               └ UI-02 Order    │
│  ├ QM-03 Decision                                               │
│  └ QM-04 sessionTitle                                           │
│                                                                 │
│  W7: Agent/Skill         W8: Cleanup/CC                         │
│  ├ AS-01 disallowedTools ├ CL-01 37 scripts                    │
│  └ AS-02 effort frontmtr ├ CL-02 9 tests                       │
│                          └ CL-03 Hook if                         │
│                                                                 │
│  Dependencies:                                                   │
│  W1(H-03) ←→ W8(CL-01): io.js 통합과 script 정리 조율          │
│  W3(TC-01) → W4(QM-01): Trust 연동 후 Regression이 Trust 갱신   │
│  W4(QM-04) → W1(H-04): sessionTitle은 FileChanged와 연계        │
│  나머지는 독립적 병렬 실행 가능                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 8.4 데이터 흐름 (수정 후)

```
SessionStart Hook
  ├→ onboarding.js → formatAskUserQuestion() → userPrompt output
  ├→ session-context.js → additionalContext (dashboard)
  │   ├→ renderProgressBar()    ← pdca-status.json
  │   ├→ renderWorkflowMap()    ← pdca-status.json + agent-state.json
  │   ├→ renderImpactView()     ← NEW: git diff + quality-metrics.json
  │   ├→ renderAgentPanel()     ← NEW: agent-state.json
  │   └→ renderControlPanel()   ← control-state.json
  └→ sessionTitle output        ← NEW: [bkit] {phase}

UserPromptSubmit Hook
  ├→ ambiguity check → AskUserQuestion (if score > threshold)  ← NEW
  └→ sessionTitle update ← [bkit] {feature}

PDCA Phase Transition (unified-stop.js)
  ├→ gate-manager.checkGate()          ← WORKING
  ├→ metrics.appendHistory()           ← NEW: 시계열 기록
  ├→ metrics.analyzeTrend()            ← NEW: 6개 알람 조건
  ├→ regression.detectRegressions()    ← NEW: 200+ 규칙 검증
  ├→ trust.recordEvent()               ← WORKING
  │   └→ automation.syncTrustLevel()   ← NEW: control-state.json 동기화
  ├→ stats.incrementStat()             ← NEW: 세션 통계
  ├→ decision.recordDecision()         ← FIX: silent failure 수정
  └→ state-machine.transition()        ← FIX: report→archived

FileChanged Hook (NEW)
  └→ if: Write|Edit(docs/{01-plan,02-design,03-analysis,04-report}/**)
      └→ gap-detector 재실행 트리거
```

---

## 9. Convention Prerequisites

### 9.1 적용 규칙

- [ ] 기존 CLAUDE.md 언어 규칙 유지 (코드: English, docs/: Korean)
- [ ] Hook script는 hook-io.js 사용 (통합 후)
- [ ] 삭제 전 반드시 grep + git blame 확인
- [ ] 신규 hook은 `if` 필드 사용 (단일목적)
- [ ] Agent/Skill frontmatter에 effort 명시

---

## 10. Next Steps

1. [ ] Plan 승인 후 Design 문서 작성 (`/pdca design bkit-v211-comprehensive-improvement`)
2. [ ] 8개 영역 병렬 구현 (`/pdca do`)
3. [ ] gap-detector로 설계-구현 갭 분석 (`/pdca analyze`)
4. [ ] Match Rate ≥ 90% 확인 후 Report 생성 (`/pdca report`)

---

## Appendix: Brainstorming Log

| Phase | 질문 | 답변 | 결정 |
|-------|------|------|------|
| Intent Q1 | 핵심 목표 | 전부 다 (풀 패키지) | 50+ 결함 전체 해결 |
| Intent Q2 | 우선순위 전략 | 영역별 병렬 (Agent Teams) | 8개 영역 동시 진행 |
| Alternatives | A:Surgical / B:Clean / C:Rewrite | B: Clean Sweep | 리팩토링 직후 정리 최적 |
| YAGNI W1 | Hook/Onboarding 4건 | 전부 포함 | 모두 포함 |
| YAGNI W2 | State Machine 2건 | 전부 포함 | 모두 포함 |
| YAGNI W3 | Trust/Control 2건 | 전부 포함 | 모두 포함 |
| YAGNI W4 | Quality/Metrics 4건 | 전부 포함 | 모두 포함 |
| YAGNI W5 | MCP 1건 | 전부 포함 | 모두 포함 |
| YAGNI W6 | Dashboard/UI 2건 | 전부 포함 | 모두 포함 |
| YAGNI W7 | Agent/Skill 2건 | 전부 포함 | 모두 포함 |
| YAGNI W8 | Cleanup/CC 3건 | 전부 포함 + Dead Code 철저 조사 후 삭제 | 사용자 피드백: 불필요한 Context 줄이기 |
| Design | 8개 영역 구성 | 적절함 | 병렬 진행 확정 |

### 사용자 피드백 반영

> "모든 스킬은 사용자도 직접 명령어처럼 호출할 수 있어야 해. 대신 더이상 안 쓰는 Dead Code라면 사용처 제대로 조사해서 삭제해도 돼. Context에 괜히 불필요한 정보가 많은 것도 문제야."

→ CL-01 orphaned scripts 정리 시 skill frontmatter hooks 교차 검증 필수
→ 삭제 시 grep + git blame + skill SKILL.md 확인
→ Context 토큰 효율 개선을 별도 측정 항목으로 추가

---

## Appendix: 11-Agent Analysis Summary

| Agent | 영역 | 발견 수 | Critical |
|-------|------|--------|----------|
| A1 | Hook System | 8건 | AskUserQuestion 미작동, io 이중화 |
| A2 | Skill System | 0건 | 37 skills 전수 검사 정상 |
| A3 | Agent Definition | 2건 | disallowedTools "Agent" 참조 |
| A4 | State Machine | 2건 | report 자기루프, Event Name 불일치 |
| A5 | Controllable AI | 12건 | Trust↔Automation 단절, Session Stats 0 |
| A6 | Quality/Metrics | 6건 | Regression/History/Trend 미작동 |
| A7 | MCP Server | 1건 | analysis_read NOT_FOUND 버그 |
| A8 | CLI Dashboard | 4건 | Impact/Agent Panel 미호출, 순서 역전 |
| A9 | CC CLI Direction | 17건 | FileChanged, sessionTitle, Hook if 기회 |
| A10 | Dead Code | 4건 | 37 orphaned scripts, 9 broken tests |
| A11 | Onboarding/UX | 7건 | PM 자동트리거, Magic Words, Ambiguity |
| **합계** | | **63건** | |

---

## Version History

| 버전 | 날짜 | 변경 | 작성자 |
|------|------|------|--------|
| 0.1 | 2026-04-08 | Initial draft (Plan Plus, 11-Agent Analysis) | Claude Opus 4.6 |
