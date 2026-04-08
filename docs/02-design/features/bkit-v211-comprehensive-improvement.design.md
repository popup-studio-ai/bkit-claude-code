# bkit v2.1.1 Comprehensive Improvement Design Document

> **요약**: 8개 병렬 영역, 20건 수정 — Unified Stop Expansion 패턴으로 기존 중앙 허브(unified-stop.js) 확장 + 각 영역 Fix-in-Place
>
> **프로젝트**: bkit (Claude Code Vibecoding Plugin)
> **버전**: v2.1.0 → v2.1.1
> **작성자**: Claude Opus 4.6
> **날짜**: 2026-04-08
> **상태**: Draft
> **Plan 문서**: [bkit-v211-comprehensive-improvement.plan.md](../01-plan/features/bkit-v211-comprehensive-improvement.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | v2.1.0 리팩토링 후 모듈 간 연결(wiring) 누락으로 핵심 기능 50+ 미작동. bkit 3대 철학이 코드 레벨에서 실제 작동해야 함 |
| **WHO** | bkit 전체 사용자 (Starter/Dynamic/Enterprise), 기여자/유지보수자 |
| **RISK** | orphaned scripts 중 실제 사용 중인 것 삭제, io.js 통합 시 호환성, Trust↔Automation 예상치 못한 레벨 변경 |
| **SUCCESS** | BROKEN 10건→0건, DEAD→ACTIVE 5건, 37 orphaned scripts 정리, 9 tests 통과, CC 활용 3건+ |
| **SCOPE** | 20건 Clean Sweep (Fix + Cleanup + CC 활용). 신규 기능(Magic Words, PM 자동트리거) 제외 |

---

## 1. Overview

### 1.1 설계 목표

1. **연결 복원**: 구현되었으나 호출되지 않는 함수들을 올바른 호출 지점에 연결
2. **데이터 동기화**: 이원화된 저장소(trust-profile.json ↔ control-state.json) 단방향 동기화
3. **Dead Code 정리**: 불필요한 Context 토큰을 줄이기 위해 orphaned scripts 조사 후 삭제
4. **CC 최신 활용**: sessionTitle, Hook `if`, effort frontmatter 적용

### 1.2 설계 원칙

- **Unified Stop Expansion**: 기존 `unified-stop.js`를 중앙 허브로 확장하여 Quality, Trust, Stats 연결
- **Fix-in-Place**: 나머지는 해당 파일에서 직접 수정 (새 모듈 최소화)
- **No New Abstractions**: 기존 모듈의 export 함수를 호출만 추가, 새 추상화 계층 없음
- **Backward Compatible**: .bkit/state/ 파일 포맷 변경 없음

---

## 2. Architecture

### 2.0 Architecture Comparison

| 기준 | A: Fix-in-Place | B: Integration Hub | **C: Unified Stop Expansion** |
|------|:-:|:-:|:-:|
| **접근법** | 각 파일 직접 수정 | 새 connector 모듈 | unified-stop.js 확장 |
| **신규 파일** | 1 (FileChanged handler) | 4 (connectors + handler) | 2 (FileChanged + io통합) |
| **수정 파일** | ~55 | ~45 | **~50** |
| **복잡도** | Low | Medium | **Medium** |
| **유지보수성** | Low (분산) | High (중앙) | **High (기존 허브)** |
| **리스크** | Low | Medium (새 모듈) | **Low (검증된 패턴)** |
| **추천** | 소규모 핫픽스 | 장기 프로젝트 | **현재 상황 최적** |

**선택**: Option C — **Unified Stop Expansion**
**근거**: unified-stop.js는 이미 gate-manager, metrics, trust 호출의 중앙 지점. 여기에 regression, history, stats를 추가하면 자연스러운 확장. 새 모듈 최소화로 리스크 감소.

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    bkit v2.1.1 수정 아키텍처                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌── W1: Hook/Onboarding ──────────────────────────────────────────┐   │
│  │  onboarding.js ──→ formatAskUserQuestion() ──→ userPrompt out   │   │
│  │  user-prompt-handler.js ──→ ambiguity→AskUserQuestion           │   │
│  │  io.js ← hook-io.js 통합                                        │   │
│  │  file-changed-handler.js (NEW) ──→ gap-detector 트리거           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌── W2: State Machine ────────┐  ┌── W3: Trust/Control ──────────┐   │
│  │  state-machine.js            │  │  trust-engine.js               │   │
│  │  └ report→archived fix       │  │  └ syncToControlState() NEW   │   │
│  │  core-mission.md             │  │  automation-controller.js      │   │
│  │  └ event names sync          │  │  └ readTrustLevel() NEW       │   │
│  └──────────────────────────────┘  └────────────────────────────────┘   │
│                                                                         │
│  ┌── unified-stop.js (EXPANDED HUB) ──────────────────────────────┐   │
│  │                                                                 │   │
│  │  기존: gate-manager.checkGate() ✓                               │   │
│  │  기존: metrics.toGateFormat() ✓                                  │   │
│  │  기존: trust.recordEvent() ✓                                     │   │
│  │                                                                 │   │
│  │  추가: metrics.appendHistory(feature, snapshot)      ← W4 QM-02│   │
│  │  추가: metrics.analyzeTrend(feature)                 ← W4 QM-02│   │
│  │  추가: regression.detectRegressions(metrics)         ← W4 QM-01│   │
│  │  추가: trust.syncToControlState()                    ← W3 TC-01│   │
│  │  추가: stats.incrementStat(type)                     ← W3 TC-02│   │
│  │  추가: sessionTitle update                           ← W4 QM-04│   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌── W5: MCP ──┐  ┌── W6: Dashboard ──┐  ┌── W7: Agent/Skill ────┐   │
│  │  docsPath()  │  │  session-start.js  │  │  2 agents fix         │   │
│  │  analysis    │  │  +impactView       │  │  36 skills effort     │   │
│  │  exception   │  │  +agentPanel       │  └──────────────────────┘   │
│  └──────────────┘  │  +reorder          │                             │
│                    └───────────────────┘                              │
│                                                                         │
│  ┌── W8: Cleanup ──────────────────────────────────────────────────┐   │
│  │  37 orphaned scripts → 조사/삭제   |  9 tests fix  |  Hook if   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 데이터 흐름 (수정 후)

```
PDCA Phase Transition (unified-stop.js — EXPANDED)
  │
  ├─[기존]─→ gate-manager.checkGate(phase, {metrics})
  ├─[기존]─→ gate-manager.recordGateResult(phase, result)
  ├─[기존]─→ trust.recordEvent(type)
  │
  ├─[NEW]──→ metrics.appendHistory(feature, snapshot)    // W4 QM-02
  ├─[NEW]──→ metrics.analyzeTrend(feature)               // W4 QM-02
  │           └→ 알람 시 audit.writeAuditLog(alarm)
  ├─[NEW]──→ regression.detectRegressions(currentMetrics) // W4 QM-01
  │           └→ 위반 시 audit.writeAuditLog(violation)
  ├─[NEW]──→ trust.syncToControlState()                   // W3 TC-01
  │           └→ control-state.json.trustScore 업데이트
  ├─[NEW]──→ stats.incrementStat('phaseComplete')         // W3 TC-02
  │           └→ control-state.json.sessionStats 업데이트
  └─[NEW]──→ hookIo.setSessionTitle(`[bkit] ${phase}`)   // W4 QM-04
```

### 2.3 의존성

| 수정 | 의존 대상 | 목적 |
|------|----------|------|
| unified-stop.js | metrics-collector.js | appendHistory(), analyzeTrend() |
| unified-stop.js | regression-guard.js | detectRegressions() |
| unified-stop.js | trust-engine.js | syncToControlState() (NEW method) |
| unified-stop.js | automation-controller.js | incrementStat() |
| onboarding.js | automation.js | formatAskUserQuestion() |
| session-start.js | lib/ui/impact-view.js | renderImpactView() |
| session-start.js | lib/ui/agent-panel.js | renderAgentPanel() |
| file-changed-handler.js (NEW) | hook-io.js | parseHookInput(), outputAllow() |

---

## 3. 영역별 상세 설계

### W1: Hook & Onboarding (4건)

#### H-01: AskUserQuestion 정상화

**수정 파일**: `hooks/startup/onboarding.js`, `hooks/startup/session-context.js`

```
현재: onboarding.js:67-78 → emitUserPrompt({questions: [...]})
수정: onboarding.js:67-78 → formatAskUserQuestion({questions: [...]})

현재: session-context.js → additionalContext에 "MANDATORY" 텍스트만
수정: session-context.js → hookSpecificOutput에 userPrompt: JSON.stringify(payload) 추가
```

**핵심 변경**:
1. `onboarding.js` — `emitUserPrompt()` 호출을 `formatAskUserQuestion()` 으로 교체
2. `onboarding.js` — 반환값에 `userPrompt` 필드 추가
3. `session-context.js` — onboardingData.userPrompt 을 hookSpecificOutput 에 전달
4. `session-start.js` — hookSpecificOutput 에서 userPrompt 을 최종 응답에 포함

#### H-02: Ambiguity → AskUserQuestion 변환

**수정 파일**: `scripts/user-prompt-handler.js`

```
현재: ambiguity score > threshold → additionalContext 텍스트만
수정: ambiguity score > threshold → AskUserQuestion 포맷 생성

추가 로직 (user-prompt-handler.js ~150줄 부근):
  if (ambiguity.shouldClarify && ambiguity.score > 0.7) {
    const questions = formatAskUserQuestion({
      questions: ambiguity.clarifyingQuestions
    });
    output.userPrompt = JSON.stringify(questions);
  }
```

#### H-03: io.js / hook-io.js 통합

**수정 파일**: `lib/core/hook-io.js` (삭제), 9개 스크립트 import 변경

**전략**: `hook-io.js`의 고유 함수가 있는지 확인 후:
- `hook-io.js` 고유 export가 없으면 → `hook-io.js` 삭제, 35개 스크립트를 `io.js`로 변경
- `hook-io.js` 고유 export가 있으면 → `io.js`에 병합 후 `hook-io.js` 삭제
- 최종: 단일 `lib/core/io.js` 모듈

#### H-04: FileChanged Hook 신규

**신규 파일**: `scripts/file-changed-handler.js`
**수정 파일**: `hooks/hooks.json`

```json
// hooks.json 추가
"FileChanged": [
  {
    "hooks": [{
      "type": "command",
      "command": "node scripts/file-changed-handler.js",
      "if": "Write|Edit(docs/**/*.md)"
    }]
  }
]
```

**handler 로직**:
1. 변경된 파일이 `docs/01-plan/`, `docs/02-design/` 에 해당하는지 확인
2. 현재 PDCA phase가 `do` 이상인지 확인
3. 해당하면 additionalContext에 "설계 문서 변경 감지. gap-detector 재실행을 권장합니다." 추가

---

### W2: State Machine (2건)

#### SM-01: report→report 자기루프 수정

**수정 파일**: `lib/pdca/state-machine.js:115-119`

```javascript
// 현재 (line 115-119)
{ from: 'report', event: 'REPORT_DONE', to: 'report', ... }

// 수정
{ from: 'report', event: 'REPORT_DONE', to: 'archived', ... }
```

#### SM-02: Event Name 문서 동기화

**수정 파일**: `bkit-system/philosophy/core-mission.md:74-78`

```
현재 문서: DO_DONE, ACT_DONE, APPROVE
실제 코드: DO_COMPLETE, ANALYZE_DONE, MATCH_PASS

→ core-mission.md를 실제 코드 이벤트명으로 업데이트
```

---

### W3: Trust & Control (2건)

#### TC-01: Trust↔Automation 동기화

**수정 파일**: `lib/control/trust-engine.js`, `lib/control/automation-controller.js`

**trust-engine.js 추가 메서드**:
```javascript
// NEW: Trust Score를 control-state.json에 동기화
function syncToControlState() {
  const profile = loadTrustProfile();
  const runtimeState = getRuntimeState();
  runtimeState.trustScore = profile.currentScore;
  runtimeState.automationLevel = profile.currentLevel;
  saveRuntimeState(runtimeState);
}
```

**unified-stop.js에서 호출**:
```javascript
// trust.recordEvent() 직후에 추가
trust.syncToControlState();
```

#### TC-02: Session Stats 증가 연결

**수정 파일**: `scripts/unified-stop.js`, `scripts/unified-bash-pre.js`, `scripts/pre-write.js`

**호출 지점**:
- `unified-stop.js`: phase 전환 시 → `incrementStat('phaseComplete')`
- `unified-bash-pre.js`: destructive 차단 시 → `incrementStat('destructiveBlocked')`
- `pre-write.js`: checkpoint 생성 시 → `incrementStat('checkpointsCreated')`

---

### W4: Quality & Metrics (4건)

#### QM-01: Regression Detection 활성화

**수정 파일**: `scripts/unified-stop.js` (~330줄, gate 체크 직후)

```javascript
// gate check 후, check phase에서만 실행
if (phase === 'check') {
  const regressions = regression.detectRegressions(currentMetrics);
  if (regressions.length > 0) {
    audit.writeAuditLog({
      category: 'quality',
      action: 'regression_detected',
      details: { count: regressions.length, rules: regressions }
    });
  }
}
```

#### QM-02: Quality History 생성

**수정 파일**: `scripts/unified-stop.js` (~340줄)

```javascript
// gate check 후, 모든 phase 전환에서 실행
metrics.appendHistory(feature, metricsSnapshot);

// check phase에서는 추가로 trend 분석
if (phase === 'check') {
  const alarms = metrics.analyzeTrend(feature);
  if (alarms.length > 0) {
    audit.writeAuditLog({ category: 'quality', action: 'trend_alarm', details: alarms });
  }
}
```

#### QM-03: Decision Tracer 수정

**수정 파일**: `lib/audit/decision-tracer.js`

**디버깅 포인트**:
1. `ensureDecisionsDir()` — 디렉토리 생성 확인
2. `fs.appendFileSync()` — try-catch 내부에 에러 로깅 추가
3. 파일 경로 검증 — `.bkit/decisions/` 가 올바르게 resolve 되는지

```javascript
// 현재 (silent failure)
try { fs.appendFileSync(filePath, line); } catch (e) { /* silent */ }

// 수정 (에러 로깅)
try {
  fs.appendFileSync(filePath, line);
} catch (e) {
  const debugLog = require('./debug-log');
  debugLog('decision-tracer', `Write failed: ${e.message}, path: ${filePath}`);
}
```

#### QM-04: sessionTitle PDCA 자동명명

**수정 파일**: `scripts/user-prompt-handler.js`, `scripts/unified-stop.js`

```javascript
// user-prompt-handler.js — 기존 코드 유지 (이미 부분 구현)
// [bkit] {feature} 형태로 설정

// unified-stop.js — phase 전환 시 업데이트 추가
output.sessionTitle = `[bkit] ${phase.toUpperCase()} ${feature}`;
```

---

### W5: MCP (1건)

#### MCP-01: analysis_read 경로 버그 수정

**수정 파일**: `servers/bkit-pdca-server/index.js:38-42`

```javascript
// 현재
function docsPath(phase, feature) {
  const dir = PHASE_MAP[phase];
  if (!dir) return null;
  return path.join(DOCS_DIR, dir, 'features', `${feature}.${phase}.md`);
}

// 수정
function docsPath(phase, feature) {
  const dir = PHASE_MAP[phase];
  if (!dir) return null;
  // analysis 문서는 features/ 서브디렉토리 없이 직접 저장됨
  if (phase === 'analysis') {
    return path.join(DOCS_DIR, dir, `${feature}.${phase}.md`);
  }
  return path.join(DOCS_DIR, dir, 'features', `${feature}.${phase}.md`);
}
```

---

### W6: Dashboard & UI (2건)

#### UI-01: Impact View & Agent Panel 활성화

**수정 파일**: `hooks/session-start.js` (~85-138줄)

```javascript
// workflow map 렌더링 이후 추가:
const impactView = renderImpactView(pdcaStatus, metricsData);
if (impactView) sections.push(impactView);

const agentPanel = renderAgentPanel(agentState);
if (agentPanel) sections.push(agentPanel);
```

#### UI-02: Dashboard 렌더링 순서 수정

**수정 파일**: `hooks/session-start.js`

```
현재 순서 (prepend = 역순):
  Control Panel → Workflow Map → Progress Bar → Session Context

수정 순서:
  Session Context → Progress Bar → Workflow Map → Impact View → Agent Panel → Control Panel
```

**구현**: `sections` 배열에 순서대로 push 후 마지막에 join하여 additionalContext에 할당

---

### W7: Agent & Skill (2건)

#### AS-01: Agent disallowedTools 수정

**수정 파일**: `agents/pdca-iterator.md:36`, `agents/qa-monitor.md:26`

```yaml
# 현재
disallowedTools:
  - Agent  # ← 존재하지 않는 도구

# 수정: "Agent" 라인 삭제
```

#### AS-02: 36 Skills effort frontmatter 추가

**수정 파일**: 36개 `skills/*/SKILL.md`

```yaml
# 각 SKILL.md frontmatter에 추가:
effort: high    # 복잡 분석: code-review, zero-script-qa, enterprise
effort: medium  # 표준 PDCA: pdca, plan-plus, phase-* skills
effort: low     # 유틸리티: bkit, bkit-rules, skill-create, control
```

**분류 기준**:
| effort | 스킬 수 | 대상 |
|--------|--------|------|
| high | ~8 | code-review, zero-script-qa, enterprise, cc-version-analysis, phase-8-review 등 |
| medium | ~20 | pdca, plan-plus, dynamic, phase-1~7, phase-9, bkend-*, mobile-app 등 |
| low | ~8 | bkit, bkit-rules, bkit-templates, skill-create, skill-status, control, audit, btw 등 |

---

### W8: Cleanup & CC 활용 (3건)

#### CL-01: 37 Orphaned Scripts 조사 및 정리

**방법론**:
1. 37개 각 스크립트에 대해:
   a. `grep -r "script-name" hooks/ skills/ agents/` — hook/skill/agent에서 참조 확인
   b. `git log --oneline -5 -- scripts/script-name.js` — 최근 변경 이력
   c. 스크립트 내부 주석/목적 확인
2. 분류:
   - **삭제**: 완전히 미참조, 목적 불명확
   - **재연결**: skill frontmatter hooks에서 참조해야 하는 것
   - **유지**: 유틸리티/도구로 직접 실행 가능한 것

**예상 결과** (조사 후 확정):
- Phase-specific stop scripts (13건): skill SKILL.md hooks에서 참조 여부 확인
- Agent-specific scripts (5건): agent 정의에서 참조 여부 확인
- Legacy scripts (19건): 대부분 삭제 대상

#### CL-02: 9 Broken Test Files 수정

**수정 파일**: 9개 test 파일

```javascript
// 현재 (삭제된 모듈 참조)
const common = require('../../lib/common');

// 수정 (새 모듈 경로)
const core = require('../../lib/core');
const pdca = require('../../lib/pdca');
// 또는 개별 모듈 직접 import
```

#### CL-03: Hook `if` 조건부 패턴 적용

**적용 대상**: W1의 FileChanged hook (H-04)에 `if` 필드 적용

기존 hooks에는 적용하지 않음 (unified 패턴 유지). 신규 hook에만 적용하여 패턴 시범.

---

## 4. 구현 순서 (의존성 기반)

```
Phase 1 (독립, 병렬 가능):
  ├── W2: SM-01, SM-02 (state-machine, docs)
  ├── W5: MCP-01 (docsPath fix)
  ├── W7: AS-01 (2 agents fix)
  └── W7: AS-02 (36 skills effort)

Phase 2 (Phase 1 후, 병렬 가능):
  ├── W3: TC-01 (trust sync — trust-engine.js에 syncToControlState 추가)
  ├── W3: TC-02 (session stats — incrementStat 호출 추가)
  ├── W4: QM-03 (decision tracer fix)
  └── W1: H-03 (io.js 통합 — 사전 조사 필요)

Phase 3 (W3 완료 후):
  ├── W4: QM-01 (regression — unified-stop.js 확장)
  ├── W4: QM-02 (history — unified-stop.js 확장)
  ├── W4: QM-04 (sessionTitle — unified-stop.js + user-prompt-handler)
  └── W6: UI-01, UI-02 (dashboard — session-start.js)

Phase 4 (W1:H-03 완료 후):
  ├── W1: H-01 (AskUserQuestion — onboarding.js)
  ├── W1: H-02 (ambiguity — user-prompt-handler.js)
  ├── W1: H-04 (FileChanged — 신규 handler + hooks.json)
  └── W8: CL-01 (orphaned scripts 조사/삭제)

Phase 5 (마무리):
  └── W8: CL-02 (broken tests fix)
```

---

## 5. 테스트 계획

### 5.1 영역별 검증

| 영역 | 검증 방법 | 성공 기준 |
|------|----------|----------|
| W1 H-01 | 세션 시작 → AskUserQuestion 발화 확인 | userPrompt JSON 출력 |
| W1 H-02 | 모호한 메시지 → 대화형 질문 생성 | score > 0.7 시 questions 생성 |
| W1 H-03 | 전체 hook scripts 동작 | io.js 단일 모듈에서 모든 export 정상 |
| W1 H-04 | docs/ 파일 수정 → handler 발화 | FileChanged event + if 필터 동작 |
| W2 SM-01 | REPORT_DONE → archived 전이 | state === 'archived' |
| W3 TC-01 | trust event → control-state 반영 | trustScore 값 변경 확인 |
| W3 TC-02 | phase 전환 → stats 증가 | sessionStats.phaseComplete++ |
| W4 QM-01 | check phase → regression 실행 | detectRegressions() 호출 + audit 기록 |
| W4 QM-02 | phase 전환 → history 기록 | quality-history.json 생성 확인 |
| W4 QM-03 | decision → 파일 기록 | .bkit/decisions/YYYY-MM-DD.jsonl 존재 |
| W5 MCP-01 | analysis_read 호출 | 문서 내용 정상 반환 |
| W6 UI-01 | 세션 시작 → 5개 패널 렌더링 | Impact + Agent Panel 포함 |
| W7 AS-01 | agent 로드 | disallowedTools 유효성 통과 |
| W8 CL-02 | test 실행 | 9개 파일 전부 PASS |

### 5.2 통합 검증

- [ ] 전체 PDCA 사이클 (idle → pm → plan → design → do → check → report → archived) 시뮬레이션
- [ ] Trust Score 변경 → Automation Level 반영 → unified-stop에서 canAutoAdvance 확인
- [ ] SessionStart → Dashboard 5개 컴포넌트 렌더링 → AskUserQuestion 발화

---

## 6. 파일 변경 목록

### 신규 파일 (2건)
| 파일 | 영역 | 목적 |
|------|------|------|
| `scripts/file-changed-handler.js` | W1 | FileChanged hook handler |
| _(io.js 통합 결과에 따라 추가 가능)_ | W1 | |

### 수정 파일 (~50건)

| 파일 | 영역 | 변경 내용 |
|------|------|----------|
| `hooks/startup/onboarding.js` | W1 | emitUserPrompt → formatAskUserQuestion |
| `hooks/startup/session-context.js` | W1 | userPrompt output 추가 |
| `hooks/session-start.js` | W1,W6 | userPrompt 전달 + Impact/Agent Panel + 순서 |
| `scripts/user-prompt-handler.js` | W1,W4 | ambiguity→Ask + sessionTitle |
| `lib/core/hook-io.js` | W1 | 삭제 또는 io.js 병합 |
| 35개 scripts (io import) | W1 | hook-io → io 변경 |
| `hooks/hooks.json` | W1 | FileChanged event 추가 |
| `lib/pdca/state-machine.js` | W2 | report→archived |
| `bkit-system/philosophy/core-mission.md` | W2 | event names |
| `lib/control/trust-engine.js` | W3 | syncToControlState() 추가 |
| `lib/control/automation-controller.js` | W3 | readTrustLevel() 연동 |
| `scripts/unified-stop.js` | W3,W4 | **핵심 확장**: regression, history, stats, sessionTitle |
| `scripts/unified-bash-pre.js` | W3 | incrementStat(destructiveBlocked) |
| `scripts/pre-write.js` | W3 | incrementStat(checkpointsCreated) |
| `lib/audit/decision-tracer.js` | W4 | silent failure → error logging |
| `servers/bkit-pdca-server/index.js` | W5 | docsPath analysis exception |
| `agents/pdca-iterator.md` | W7 | disallowedTools fix |
| `agents/qa-monitor.md` | W7 | disallowedTools fix |
| 36개 `skills/*/SKILL.md` | W7 | effort frontmatter |
| 9개 test files | W8 | lib/common → 새 경로 |
| ~37개 orphaned scripts | W8 | 조사 후 삭제/유지 결정 |

---

## 11. Implementation Guide

### 11.1 Session Guide

#### Module Map

| Module | Scope Key | 설명 | 예상 턴 |
|--------|-----------|------|:-------:|
| Phase 1: Quick Fixes | `quick-fixes` | SM-01, MCP-01, AS-01, AS-02 (독립 수정) | 15-20 |
| Phase 2: Trust & IO | `trust-io` | TC-01, TC-02, QM-03, H-03 (의존성 기반) | 25-30 |
| Phase 3: Unified Stop | `unified-stop` | QM-01, QM-02, QM-04, UI-01, UI-02 (허브 확장) | 30-40 |
| Phase 4: Onboarding & Hooks | `onboarding` | H-01, H-02, H-04, CL-01 (사용자 경험) | 25-35 |
| Phase 5: Tests & Cleanup | `tests-cleanup` | CL-02, 통합 검증 | 15-20 |

#### Recommended Session Plan

| Session | Phase | Scope | 턴 |
|---------|-------|-------|:--:|
| Session 1 | Plan + Design | 전체 (현재) | 완료 |
| Session 2 | Do | `--scope quick-fixes` | 15-20 |
| Session 3 | Do | `--scope trust-io` | 25-30 |
| Session 4 | Do | `--scope unified-stop` | 30-40 |
| Session 5 | Do | `--scope onboarding` | 25-35 |
| Session 6 | Do + Check | `--scope tests-cleanup` + analyze | 20-30 |
| Session 7 | Report | 전체 | 15-20 |

---

## Version History

| 버전 | 날짜 | 변경 | 작성자 |
|------|------|------|--------|
| 0.1 | 2026-04-08 | Initial draft (Unified Stop Expansion) | Claude Opus 4.6 |
