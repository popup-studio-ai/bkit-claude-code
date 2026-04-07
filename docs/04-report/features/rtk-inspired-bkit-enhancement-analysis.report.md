# RTK 사상 차용 bkit 고도화 종합 분석 보고서

> **Status**: ✅ Complete
>
> **Project**: bkit Vibecoding Kit
> **Version**: v2.0.8 (분석 시점)
> **Author**: PM + CTO Agent Team (10 agents)
> **Completion Date**: 2026-04-07
> **PDCA Cycle**: #31

---

## Executive Summary

### 1.1 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **기능** | RTK(Rust Token Killer) 사상/기능을 차용한 bkit 고도화 기회 도출 |
| **분석 대상** | RTK v0.35.0 (19K stars) × bkit v2.0.8 (37 Skills, 32 Agents, 18 Hooks) |
| **투입 에이전트** | 10개 (RTK 3 + bkit 7) |
| **분석 범위** | RTK: 필터 엔진, Hook 통합, 토큰 경제성 / bkit: 전체 아키텍처 |
| **완료일** | 2026-04-07 |

### 1.2 성과 요약

```
┌──────────────────────────────────────────────────────────────────────┐
│  RTK × bkit 교차 분석 결과                                           │
├──────────────────────────────────────────────────────────────────────┤
│  📊 RTK 분석 범위:      42 Rust 필터 + 67 TOML 필터 + 60 규칙       │
│  📊 bkit 분석 범위:     37 Skills + 32 Agents + 57 Scripts + 92 Lib │
│  🔍 교차 비교 항목:     8개 차원 (필터, Hook, 토큰, 보안 등)          │
│  💡 도출된 고도화 안:    28건                                         │
│     ├── P0 (Critical):  3건 — 즉시 적용, 높은 ROI                    │
│     ├── P1 (High):      8건 — 단기 적용, 토큰 절감 핵심               │
│     ├── P2 (Medium):    10건 — 중기 검토, 아키텍처 개선               │
│     └── P3 (Low):       7건 — 모니터링/참고                          │
│  🎯 예상 토큰 절감:     세션당 30-50% (Hook 출력 기준)                │
│  🎯 예상 코드 절감:     -25% (중복 스크립트 통합)                     │
│  ⚠️  YAGNI FAIL:       3건 (사전 검증으로 제거)                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 1.3 전달된 가치

| 관점 | 내용 |
|------|------|
| **문제** | bkit은 워크플로우 자동화에 탁월하지만, 토큰 효율성은 체계적으로 관리되지 않음. Hook 출력(세션당 ~18-25KB), Agent 출력(무제한), 상태 파일 읽기(매번 전체 JSON)가 컨텍스트 윈도우를 비효율적으로 소비 |
| **해결 방법** | RTK의 4대 사상(선언적 필터, 토큰 추적, 경제성 분석, 신뢰 모델)을 bkit 아키텍처에 맞게 변형 적용 |
| **기능/UX 효과** | 컨텍스트 윈도우 효율 30-50% 향상 → auto-compact 빈도 감소 → 장기 세션 추론 품질 유지 |
| **핵심 가치** | **RTK = 출력 필터링, bkit = 워크플로우 자동화**의 보완 관계를 넘어, RTK 패턴을 bkit 내부에 내재화하여 독립적 토큰 효율성 확보 |

---

## 2. 분석 방법론

### 2.1 Agent Team 구성 (10개 에이전트)

```
┌─── RTK 분석팀 (3 agents) ────────────────────────────────────────────┐
│  #1  rtk-filter-analyst      TOML 8단계 파이프라인, 109개 필터        │
│  #2  rtk-hook-analyst        Exit Code 프로토콜, 60개 규칙 레지스트리  │
│  #9  rtk-economics-analyst   SQLite 추적, 가중 CPT, 에러 패턴 학습    │
└──────────────────────────────────────────────────────────────────────┘

┌─── bkit 분석팀 (7 agents) ───────────────────────────────────────────┐
│  #3  bkit-hook-explorer      18 Hook Events, 57 Scripts, 6-Layer     │
│  #4  bkit-mcp-explorer       2 MCP Servers, 16 Tools, 3 Resources    │
│  #5  bkit-skills-explorer    37 Skills 전수 분석                      │
│  #6  bkit-agents-explorer    32 Agents 전수 분석                      │
│  #7  bkit-lib-explorer       92 Modules, ~22,734 LOC                 │
│  #8  bkit-scripts-explorer   57 Scripts, ~7,847 LOC                  │
│  #10 bkit-token-explorer     토큰 효율 현황 Gap 분석                  │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 분석 프레임워크

8개 차원에서 교차 비교:

| 차원 | RTK 접근법 | bkit 현황 | Gap |
|------|-----------|-----------|-----|
| **출력 필터링** | 8단계 TOML + 42 Rust 필터 | ❌ 없음 (verbatim pass-through) | Critical |
| **토큰 추적** | SQLite DB, 90일 보존 | ❌ 없음 | Critical |
| **경제성 분석** | 가중 CPT, 달러 절감액 산출 | ❌ 없음 | High |
| **Hook 프로토콜** | Exit 0/1/2/3, graceful degradation | ✅ 부분 (exit 0만 사용) | Medium |
| **보안 모델** | Trust Gate, SHA-256, TOCTOU 방지 | ✅ 부분 (scope-limiter, blast-radius) | Medium |
| **레지스트리** | 60개 규칙 단일 파일 선언적 관리 | ⚠️ 분산 (57 스크립트) | Medium |
| **에러 학습** | 패턴 감지 → 교정 제안 → 규칙 자동 생성 | ✅ 부분 (tool-failure-handler) | Low |
| **멀티 도구** | 7개 AI 도구 지원 | ✅ CC 전용 (설계상 의도) | N/A |

---

## 3. RTK 핵심 사상 분석

### 3.1 RTK의 4대 설계 철학

| 철학 | 설명 | bkit 관련성 |
|------|------|------------|
| **Invisible Proxy** | LLM이 RTK 존재를 모른 채 최적화된 입력을 받음 | bkit Hook도 투명하게 작동하지만, 출력 최적화가 없음 |
| **Declarative Pipeline** | TOML로 선언적 필터 정의, 코드 수정 없이 확장 | bkit Hook은 모두 명령형 JS 스크립트 |
| **Measure Everything** | SQLite로 모든 명령의 토큰 입출력 추적 | bkit은 audit JSONL은 있지만 토큰 계량이 없음 |
| **Trust-before-Load** | 프로젝트 로컬 설정은 신뢰 검증 후에만 로드 | bkit은 프로젝트 로컬 스킬/에이전트에 신뢰 게이트 없음 |

### 3.2 RTK 필터 아키텍처 (bkit 관점)

**RTK의 이중 구조:**
```
하드코딩 Rust 필터 (42개)     ←→    bkit의 명령형 JS 스크립트 (57개)
  ├── 복잡한 구조적 파싱              ├── 상태 머신, PDCA 워크플로우
  ├── 상태 머신 (pytest, go test)     ├── 품질 게이트, 감사 추적
  └── JSON/텍스트 이중 파싱           └── Hook 입출력 처리

TOML 선언적 필터 (67개)       ←→    bkit에 해당하는 것 없음 ❌
  ├── 8단계 파이프라인               
  ├── 프로젝트 로컬 확장 가능        
  └── 인라인 테스트 내장             
```

**핵심 인사이트**: RTK는 "간단한 건 선언적으로, 복잡한 건 네이티브로" 이중 구조를 사용한다. bkit은 네이티브(JS) 레이어만 존재하며, 선언적 레이어가 부재하다.

### 3.3 RTK 토큰 경제성 모델

```
┌─── 가중 CPT 계산식 ──────────────────────────────────────────────────┐
│                                                                       │
│  weighted_units = input + (5.0 × output) + (1.25 × cache_write)      │
│                   + (0.1 × cache_read)                                │
│                                                                       │
│  input_cpt = total_cost / weighted_units                              │
│  savings_dollars = saved_tokens × input_cpt                           │
│                                                                       │
│  토큰 추정: estimate_tokens(text) = ceil(text.len / 4)               │
│  (CJK 보정 필요: 한국어는 ~2 chars/token)                              │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 4. bkit 아키텍처 현황 분석

### 4.1 전체 아키텍처 규모

| 컴포넌트 | 수량 | LOC | 핵심 역할 |
|----------|------|-----|----------|
| **Skills** | 37 | ~15,000 | PDCA 워크플로우, 개발 파이프라인, PM, 플랫폼 |
| **Agents** | 32 | ~12,000 | PM팀, CTO팀, QA팀, 분석, 유틸리티 |
| **Scripts** | 57 | 7,847 | Hook 핸들러, 유틸리티 |
| **Lib Modules** | 92 | 22,734 | 코어, PDCA 엔진, 컨트롤, 컨텍스트, UI |
| **MCP Servers** | 2 | ~1,200 | bkit-pdca (10 tools), bkit-analysis (6 tools) |
| **Hook Events** | 18 | - | 6-Layer 아키텍처 |
| **합계** | - | **~58,781** | - |

### 4.2 토큰 효율성 현황 (Gap 분석)

| 영역 | 현재 상태 | RTK 비교 | 심각도 |
|------|----------|----------|--------|
| **Hook 출력** | 세션당 ~18-25KB, 필터링 없음 | RTK는 60-99% 압축 | 🔴 Critical |
| **Agent 출력** | 무제한, verbatim 전달 | N/A (RTK 범위 밖) | 🔴 Critical |
| **상태 파일 읽기** | 매번 전체 JSON (pdca-status.json) | N/A | 🟡 High |
| **MCP 응답** | 전체 문서 반환, 트런케이션 없음 | N/A | 🟡 High |
| **토큰 계량** | ❌ 없음 | SQLite 90일 추적 | 🟡 High |
| **컨텍스트 예산** | ❌ 없음 | 카테고리별 토큰 할당 | 🟠 Medium |
| **메모리 정리** | ❌ 무한 증가 | 90일 자동 삭제 | 🟠 Medium |
| **컴팩션 최적화** | 상태 보존만, 압축 없음 | N/A | 🟠 Medium |

### 4.3 기존 강점 (RTK가 없는 것)

| bkit 강점 | 설명 |
|-----------|------|
| **PDCA 워크플로우 엔진** | 7-phase 상태 머신, 품질 게이트, 자동 전환 |
| **6-Layer Hook 아키텍처** | 글로벌 → 스킬 → 에이전트 → 트리거 → 스크립트 → 코어 |
| **Agent Team 오케스트레이션** | CTO팀, PM팀, QA팀 — 최대 10+ 에이전트 병렬 |
| **Living Context 4-Layer** | Scenario Matrix → Invariants → Impact Map → Incident Memory |
| **감사 추적 & 투명성** | JSONL 감사 로그, 결정 추적, 설명 생성 |
| **5-Level 자동화 제어** | L0(수동) ~ L4(완전자동), 신뢰 점수 기반 |

---

## 5. RTK×bkit 교차 분석: 고도화 기회 28건

### 5.1 P0 — Critical (3건, 즉시 적용)

#### ENH-R01: Hook 출력 선언적 필터 파이프라인

**RTK 영감**: 8단계 TOML 파이프라인 (strip_ansi → replace → match_output → strip/keep_lines → truncate → head/tail → max_lines → on_empty)

**현재 문제**: bkit의 57개 Hook 스크립트가 각각 자유 형식으로 `additionalContext`를 생성. 일부 스크립트는 2-8KB의 가이던스를 출력하여 컨텍스트 윈도우를 비효율적으로 소비.

**제안**:
```javascript
// lib/core/output-filter.js — 선언적 출력 필터
const filterPipeline = {
  stripAnsi: true,
  maxLines: 15,
  maxChars: 500,        // 현재 io.js의 MAX_CONTEXT_LENGTH
  headLines: 10,
  tailLines: 5,
  onEmpty: "✅ No issues found",
  stripLinesMatching: [
    /^DEBUG:/,
    /^\s*$/,             // 빈 줄
    /^──+$/              // 구분선
  ]
};
```

**적용 대상**:
- `unified-stop.js` (574L, 3-8KB) → max 1.5KB
- `gap-detector-stop.js` (568L, 2-4KB) → max 1KB
- `pdca-skill-stop.js` (482L, 2-3KB) → max 1KB
- 나머지 54개 스크립트 → 일괄 적용

**예상 효과**: Hook 출력 50-60% 절감 (세션당 ~18KB → ~8KB)

**구현 난이도**: Low (io.js에 파이프라인 함수 추가, 기존 스크립트 호출부 래핑)

**YAGNI 검증**: ✅ PASS — Hook 출력은 매 도구 호출마다 발생하며, 세션당 수십~수백 회 누적. 가장 빈번한 토큰 소비원.

---

#### ENH-R02: 토큰 사용량 추적 시스템

**RTK 영감**: SQLite 기반 `tracking.db`, `estimate_tokens()`, 90일 자동 정리, 프로젝트별 스코프

**현재 문제**: bkit은 토큰 사용량을 전혀 추적하지 않음. 어떤 스킬/에이전트/Hook이 얼마나 토큰을 소비하는지 알 수 없음.

**제안**:
```javascript
// lib/core/token-tracker.js
function estimateTokens(text) {
  // CJK 보정: 한국어 문자는 ~2 chars/token
  const cjkCount = (text.match(/[\u3000-\u9FFF\uAC00-\uD7AF]/g) || []).length;
  const otherCount = text.length - cjkCount;
  return Math.ceil(cjkCount / 2 + otherCount / 4);
}

function trackHookOutput(hookEvent, scriptName, input, output) {
  const inputTokens = estimateTokens(JSON.stringify(input));
  const outputTokens = estimateTokens(output);
  // .bkit/state/token-tracking.jsonl에 기록
  appendTracking({ timestamp, hookEvent, scriptName, inputTokens, outputTokens });
}
```

**추적 대상**:
- Hook 입출력 (PreToolUse, PostToolUse, Stop 등)
- MCP 서버 응답 크기
- Agent 출력 크기 (가능한 범위)

**예상 효과**: 토큰 소비 패턴 가시화 → 데이터 기반 최적화 의사결정

**구현 난이도**: Medium (io.js 래핑 + JSONL 기록 + 90일 정리 크론)

**YAGNI 검증**: ✅ PASS — "Measure Everything" 없이는 최적화 방향을 잡을 수 없음. RTK의 핵심 교훈.

---

#### ENH-R03: Agent 출력 압축 프레임워크

**RTK 영감**: 12가지 필터링 전략 (Stats Extraction, Error-Only, Grouping, Deduplication 등)

**현재 문제**: Agent 결과가 verbatim으로 반환됨. 특히 gap-detector(631줄 정의), code-analyzer, qa-monitor의 출력이 수 KB~수십 KB에 달함.

**제안**: Agent frontmatter에 `outputCompression` 필드 추가:
```yaml
---
name: gap-detector
outputCompression:
  strategy: "stats-extraction"   # 핵심 메트릭만 추출
  maxTokens: 2000
  summaryFirst: true             # 요약 → 상세 구조
  fields: ["matchRate", "criticalIssues", "recommendation"]
---
```

**전략 매핑**:
| Agent | RTK 전략 | 적용 |
|-------|----------|------|
| gap-detector | Stats Extraction | matchRate + 미매칭 항목 Top 5 |
| code-analyzer | Error-Only + Grouping | 심각도별 이슈 카운트 + Critical만 상세 |
| qa-monitor | Failure Focus | 실패 테스트만 + 성공 카운트 |
| report-generator | Deduplication | 중복 섹션 제거, 변경분만 |
| PDCA eval agents (6개) | Stats Extraction | 점수 + 개선율 요약 한 줄 |

**예상 효과**: Agent 출력 40-70% 절감

**구현 난이도**: High (Agent 프레임워크 수정 필요, 단계적 적용)

**YAGNI 검증**: ✅ PASS — CTO Team 실행 시 5+ 에이전트 출력이 누적되면 compaction 빈번 발생. 직접적 pain point.

---

### 5.2 P1 — High (8건, 단기 적용)

#### ENH-R04: PDCA Eval Agent 통합 (6 → 1)

**발견**: bkit-agents-explorer가 PDCA Eval 6개 에이전트(pdca-eval-plan/design/do/check/act/pm)가 95% 동일 구조임을 확인.

**제안**: 파라미터화된 단일 에이전트 `pdca-evaluator`로 통합:
```yaml
---
name: pdca-evaluator
tools: [Read, Glob, Grep, Write, Edit]
---
# 실행 시 phase 파라미터로 분기
# "Evaluate the {phase} phase for project type {level}"
```

**효과**: Agent 정의 파일 5개 삭제 (중복 제거), 로딩 토큰 절감

---

#### ENH-R05: Phase Stop 스크립트 통합 (11 → 1)

**발견**: bkit-scripts-explorer가 phase1~9의 11개 stop 스크립트에서 공통 패턴 확인 (phase 번호만 다름).

**제안**: `unified-phase-stop.js` 단일 스크립트로 통합, phase 번호는 PDCA 상태에서 자동 감지.

**효과**: ~1,500 LOC 절감, 유지보수 단일 지점

---

#### ENH-R06: MCP 서버 응답 압축

**발견**: bkit-mcp-explorer가 `bkit_plan_read`, `bkit_design_read` 등이 전체 마크다운 문서를 반환함을 확인. 큰 문서는 10KB+.

**제안**: 
- `summary` 모드 파라미터 추가 (제목 + 섹션 헤딩만 반환)
- `maxChars` 파라미터로 응답 크기 제한
- `_meta.maxResultSizeChars` 활용 (v2.1.91 ENH-176)

**효과**: MCP 응답 60-80% 절감 (상세 필요 시 full 모드)

---

#### ENH-R07: 상태 파일 선택적 읽기

**발견**: bkit-lib-explorer가 `lib/pdca/status.js`(871 LOC)가 매번 전체 JSON을 읽고 파싱함을 확인.

**제안**: 쿼리 기반 선택적 읽기:
```javascript
// Before: const status = readFullStatus(); // 전체 JSON 파싱
// After:  const phase = readStatusField('currentPhase'); // 필요 필드만
```

**효과**: Hook 실행 시간 단축, 메모리 사용 감소

---

#### ENH-R08: Graceful Degradation 패턴 표준화

**RTK 영감**: Exit 0/1/2/3 프로토콜 + "모든 에러 경로에서 exit 0" (명령 실행 절대 차단 안함)

**현재 문제**: bkit Hook 일부에서 예외 발생 시 exit 1로 종료 → CC가 Hook 실패로 해석

**제안**: 모든 Hook 스크립트에 표준 에러 핸들러 적용:
```javascript
// lib/core/hook-safety.js
function safeHookExecution(fn) {
  try { return fn(); }
  catch (e) { 
    debugLog('HOOK_ERROR', e.message);
    process.exit(0); // 절대 차단하지 않음
  }
}
```

**효과**: Hook 안정성 100%, CC 워크플로우 중단 방지

---

#### ENH-R09: 선언적 Hook 출력 설정

**RTK 영감**: TOML 필터의 `on_empty`, `max_lines`, `strip_lines_matching` 등 선언적 설정

**제안**: `hooks/output-config.json`에 스크립트별 출력 규칙 선언:
```json
{
  "unified-stop.js": {
    "maxLines": 15,
    "maxChars": 1500,
    "priority": "high",
    "compactMode": true
  },
  "gap-detector-stop.js": {
    "maxLines": 10,
    "fields": ["matchRate", "criticalCount", "nextAction"]
  }
}
```

**효과**: 코드 수정 없이 출력 규칙 조정 가능 (Docs=Code 원칙)

---

#### ENH-R10: Executive Summary 5-Level 렌더링

**발견**: bkit-lib-explorer가 `executive-summary.js`에 full/compact 2단계만 있음을 확인.

**RTK 영감**: RTK의 verbosity 레벨 (-q, 기본, -v, -vv, -vvv)

**제안**: 5단계 렌더링:
| Level | 용도 | 크기 |
|-------|------|------|
| **L0 micro** | 상태 바 (1줄) | ~50B |
| **L1 compact** | 핵심 메트릭 (3줄) | ~200B |
| **L2 standard** | 현재 compact 수준 | ~500B |
| **L3 detailed** | 현재 full 수준 | ~1.5KB |
| **L4 verbose** | 디버그용 전체 출력 | ~5KB+ |

**자동 선택**: 컨텍스트 윈도우 사용률에 따라 자동 조절 (70% 이상 → L1, 50-70% → L2, 50% 미만 → L3)

**효과**: 컨텍스트 압박 시 자동으로 출력 축소

---

#### ENH-R11: 토큰 예산 관리자

**RTK 영감**: `LimitsConfig` (grep_max_results, passthrough_max_chars 등 하드 리밋)

**제안**: Hook 출력에 토큰 예산 할당:
```javascript
// lib/core/token-budget.js
const BUDGET = {
  hookOutput: 3000,      // Hook당 최대 토큰
  sessionHookTotal: 50000, // 세션 전체 Hook 토큰
  agentOutput: 5000,      // Agent당 최대 토큰
  mcpResponse: 10000      // MCP 응답 최대 토큰
};
```

**효과**: 토큰 폭주 방지, 예측 가능한 소비 패턴

---

### 5.3 P2 — Medium (10건, 중기 검토)

#### ENH-R12: 프로젝트 로컬 스킬 Trust Gate

**RTK 영감**: SHA-256 + canonical path + TOCTOU 방지 + CI 환경 감지

**제안**: 프로젝트 `.claude/skills/` 로컬 스킬에 신뢰 검증 도입:
```javascript
// lib/core/skill-trust.js
function verifySkillTrust(skillPath) {
  const canonical = fs.realpathSync(skillPath);
  const content = fs.readFileSync(canonical);
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  const trusted = loadTrustStore();
  return trusted[canonical]?.hash === hash ? 'trusted' : 'untrusted';
}
```

---

#### ENH-R13: 에러 패턴 학습 모듈

**RTK 영감**: `learn/detector.rs` — 에러 유형 분류 + 교정 패턴 감지 + 규칙 자동 생성

**제안**: `tool-failure-handler.js`를 확장하여 에러 패턴 축적 + 교정 제안:
- 에러 유형 분류 (5가지: flag_error, path_error, permission, arg_missing, other)
- 교정 윈도우 (에러 후 3개 명령 내 유사 명령 탐색)
- 빈도 기반 자동 규칙 생성 → `.bkit/state/error-patterns.json`

---

#### ENH-R14: 세션 채택률 대시보드

**RTK 영감**: `session_cmd.rs` — skill 호출률 vs 수동 작업 비율 추적

**제안**: SessionEnd hook에서 세션 통계 수집:
- 사용된 skill 수 / 사용 가능한 skill 수
- Agent 호출 횟수 / 수동 작업 횟수
- 자동화 레벨(L0-L4) 활용 패턴
- → `.bkit/state/session-stats.jsonl`에 기록

---

#### ENH-R15: 경제성 분석 위젯

**RTK 영감**: `cc_economics.rs` — 가중 CPT, `/cost` per-model breakdown

**제안**: `/cost` 명령 출력 파싱 또는 ccusage 연동으로 bkit의 토큰 절감 기여도 산출:
```
┌─── bkit 토큰 경제성 ──────────────────────────┐
│  세션 토큰: 150,000                            │
│  bkit Hook 출력: 18,000 (12%)                 │
│  필터 적용 후: 8,000 (5.3%) → 10,000 절감      │
│  예상 비용 절감: $0.15/session                 │
└───────────────────────────────────────────────┘
```

---

#### ENH-R16: Hook 버전 가드

**RTK 영감**: `rtk-hook-version: 3` 헤더로 호환성 관리

**제안**: 각 Hook 스크립트에 버전 헤더:
```javascript
// @bkit-hook-version: 2
// @min-cc-version: 2.1.85
```
SessionStart에서 버전 불일치 감지 → 업그레이드 안내

---

#### ENH-R17: Audit JSONL 필드 압축

**발견**: bkit-token-explorer가 audit 로그의 필드명이 길어 저장/읽기 비효율을 확인.

**RTK 영감**: 토큰 추적 DB의 간결한 스키마

**제안**: 필드 앨리어싱 (action → a, timestamp → t, feature → f) 또는 간결 스키마 옵션

---

#### ENH-R18: Memory 자동 정리 (TTL)

**RTK 영감**: 90일 자동 삭제 정책

**제안**: `.bkit/state/memory.json` 엔트리에 TTL 추가:
```json
{
  "key": "value",
  "_ttl": "2026-05-07T00:00:00Z",
  "_created": "2026-04-07T00:00:00Z"
}
```
SessionStart에서 만료 엔트리 자동 정리

---

#### ENH-R19: Context Loader 지연 로딩

**발견**: bkit-lib-explorer가 `lib/context/context-loader.js`(526 LOC)가 4개 레이어를 즉시 로딩함을 확인.

**제안**: 레이어별 지연 로딩 + TTL 캐시:
```javascript
function getLayer(layerName) {
  if (cache[layerName] && !isExpired(cache[layerName])) {
    return cache[layerName].data;
  }
  cache[layerName] = { data: loadLayer(layerName), loadedAt: Date.now() };
  return cache[layerName].data;
}
```

---

#### ENH-R20: MCP 서버 인메모리 캐시

**발견**: bkit-mcp-explorer가 MCP 서버가 매 호출마다 파일을 다시 읽음을 확인.

**제안**: TTL 기반 인메모리 캐시:
- `pdca-status.json`: 30초 TTL
- `quality-metrics.json`: 60초 TTL
- 마크다운 문서: 120초 TTL
- Write 작업 시 캐시 무효화

---

#### ENH-R21: Discover 패턴 — 미사용 스킬 발견

**RTK 영감**: `rtk discover` — 과거 세션에서 최적화 기회 발견

**제안**: 세션 종료 시 "사용하지 않았지만 관련 있는 스킬" 제안:
- audit 로그에서 skill 호출 패턴 분석
- 현재 PDCA phase에서 권장하지만 호출되지 않은 스킬 식별
- SessionEnd hook에서 "이런 스킬도 있어요" 형태로 안내

---

### 5.4 P3 — Low (7건, 모니터링/참고)

| # | 제안 | RTK 영감 | 비고 |
|---|------|---------|------|
| ENH-R22 | Hook output GZIP 압축 | 대용량 응답 압축 | stdio 프로토콜 제한, 실효성 낮음 |
| ENH-R23 | 인라인 테스트 내장 | TOML `[[tests.*]]` | Skill/Agent 정의에 기대 입출력 테스트 — 장기 품질 목표 |
| ENH-R24 | deny_unknown_fields 패턴 | `#[serde(deny_unknown_fields)]` | SKILL.md frontmatter 엄격 검증 — JSON Schema 도입 시 |
| ENH-R25 | 복합 명령 segment 분리 | `&&`, `||`, `;` 분리 rewrite | bkit Bash hook에서 복합 명령 분석 — 현재 필요성 낮음 |
| ENH-R26 | RTK_DISABLED 패턴 (BKIT_SKIP_HOOK) | 환경변수 기반 개별 Hook bypass | 디버깅용, BKIT_DEBUG로 충분 |
| ENH-R27 | A/B 테스트 Hook | Feature flag 기반 핸들러 라우팅 | 실험적, 사용자 규모 필요 |
| ENH-R28 | Webhook 외부 알림 | PostToolUse → Slack/Discord | ENH-138(--bare CI/CD) 선행 필요 |

### 5.5 YAGNI FAIL (3건, 사전 제거)

| # | 후보 | 제거 사유 |
|---|------|----------|
| ~~ENH-RX1~~ | Rust 바이너리 포팅 (bkit Hook을 Rust로) | bkit은 CC 플러그인으로 Node.js 에코시스템. Rust 빌드 체인 도입은 복잡도만 증가. RTK는 standalone CLI라 Rust가 적합하지만 bkit은 다름 |
| ~~ENH-RX2~~ | TOML 필터 그대로 도입 | bkit Hook은 PDCA 상태 머신 기반이라 라인 필터링만으로 불충분. JSON 선언적 설정이 더 적합 |
| ~~ENH-RX3~~ | 멀티 AI 도구 지원 | bkit은 CC 전용 플러그인이 설계 의도. Cursor/Copilot 지원은 아키텍처 근본 변경 필요. RTK가 이 역할을 하므로 불필요 |

---

## 6. 우선순위 로드맵

### 6.1 Phase 1: 즉시 적용 (1-2일)

| # | 항목 | 파일 | 효과 |
|---|------|------|------|
| **ENH-R01** | Hook 출력 필터 파이프라인 | lib/core/output-filter.js (신규) + io.js 수정 | Hook 토큰 50-60% 절감 |
| **ENH-R08** | Graceful Degradation 표준화 | lib/core/hook-safety.js (신규) + 57 scripts | Hook 안정성 100% |

### 6.2 Phase 2: 단기 적용 (3-5일)

| # | 항목 | 파일 | 효과 |
|---|------|------|------|
| **ENH-R02** | 토큰 추적 시스템 | lib/core/token-tracker.js (신규) | 데이터 기반 최적화 |
| **ENH-R04** | PDCA Eval 통합 (6→1) | agents/pdca-evaluator.md (신규) | Agent 정의 5개 삭제 |
| **ENH-R05** | Phase Stop 통합 (11→1) | scripts/unified-phase-stop.js (신규) | ~1,500 LOC 절감 |
| **ENH-R09** | 선언적 Hook 출력 설정 | hooks/output-config.json (신규) | 코드 없이 출력 조정 |

### 6.3 Phase 3: 중기 적용 (1-2주)

| # | 항목 | 의존성 | 효과 |
|---|------|--------|------|
| **ENH-R03** | Agent 출력 압축 프레임워크 | ENH-R02 (추적 데이터 필요) | Agent 토큰 40-70% 절감 |
| **ENH-R06** | MCP 응답 압축 | ENH-176 (maxResultSizeChars) | MCP 토큰 60-80% 절감 |
| **ENH-R07** | 상태 파일 선택적 읽기 | 없음 | Hook 성능 향상 |
| **ENH-R10** | 5-Level 렌더링 | ENH-R02 (사용률 데이터) | 적응형 출력 |
| **ENH-R11** | 토큰 예산 관리자 | ENH-R02 | 토큰 폭주 방지 |

### 6.4 Phase 4: 장기 검토 (2주+)

ENH-R12 ~ R21 (보안, 학습, 대시보드, 캐시 등)

---

## 7. 아키텍처 영향 분석

### 7.1 파일 영향 매트릭스

| 디렉토리 | 신규 | 수정 | 삭제 | 영향도 |
|----------|------|------|------|--------|
| **lib/core/** | 4 | 2 | 0 | 🔴 High |
| **lib/pdca/** | 0 | 2 | 0 | 🟡 Medium |
| **scripts/** | 2 | 57 | 11 | 🔴 High |
| **agents/** | 1 | 0 | 5 | 🟡 Medium |
| **hooks/** | 1 | 1 | 0 | 🟡 Medium |
| **servers/** | 0 | 2 | 0 | 🟢 Low |

### 7.2 신규 파일 목록

| 파일 | 역할 | ENH |
|------|------|-----|
| `lib/core/output-filter.js` | 선언적 출력 필터 파이프라인 | R01 |
| `lib/core/hook-safety.js` | Graceful degradation 래퍼 | R08 |
| `lib/core/token-tracker.js` | 토큰 사용량 추적 | R02 |
| `lib/core/token-budget.js` | 토큰 예산 관리 | R11 |
| `hooks/output-config.json` | 선언적 출력 규칙 | R09 |
| `scripts/unified-phase-stop.js` | Phase stop 통합 핸들러 | R05 |
| `agents/pdca-evaluator.md` | 통합 PDCA 평가 에이전트 | R04 |

### 7.3 삭제 대상 파일

| 파일 | 사유 | ENH |
|------|------|-----|
| `agents/pdca-eval-plan.md` | pdca-evaluator로 통합 | R04 |
| `agents/pdca-eval-design.md` | 위와 동일 | R04 |
| `agents/pdca-eval-do.md` | 위와 동일 | R04 |
| `agents/pdca-eval-check.md` | 위와 동일 | R04 |
| `agents/pdca-eval-act.md` | 위와 동일 | R04 |
| `scripts/phase1-schema-stop.js` | unified-phase-stop.js로 통합 | R05 |
| `scripts/phase2-convention-stop.js` | 위와 동일 | R05 |
| `scripts/phase3-mockup-stop.js` | 위와 동일 | R05 |
| ... (총 11개 phase stop 스크립트) | | R05 |

---

## 8. 철학 정합성 검증

| bkit 철학 | ENH-R 정합성 | 판정 |
|-----------|-------------|------|
| **Automation First** | 토큰 추적/예산이 자동 → 수동 개입 불필요 | ✅ PASS |
| **No Guessing** | 측정 기반 최적화 (RTK의 "Measure Everything") | ✅ PASS |
| **Docs=Code** | output-config.json이 출력 규칙의 Single Source of Truth | ✅ PASS |

| RTK 철학 | bkit 적용 정합성 | 판정 |
|----------|-----------------|------|
| **Invisible Proxy** | Hook 필터는 투명하게 작동, LLM은 모름 | ✅ PASS |
| **Declarative Pipeline** | JSON 선언적 설정으로 변형 적용 (TOML 대신) | ✅ PASS |
| **Measure Everything** | token-tracker.js로 도입 | ✅ PASS |
| **Trust-before-Load** | P2에서 skill-trust.js로 검토 | ✅ PASS |

---

## 9. RTK 공존 시나리오

RTK와 bkit을 동시에 사용하는 경우의 시너지 및 충돌 분석:

### 9.1 공존 가능성

| 차원 | 호환성 | 설명 |
|------|--------|------|
| **Hook 충돌** | ✅ 호환 | RTK는 `PreToolUse` + `Bash` matcher만 사용. bkit은 `Write\|Edit`, `Bash`(다른 로직), `Stop` 등 다양한 이벤트 사용 |
| **실행 순서** | ⚠️ 주의 | 동일 `PreToolUse` + `Bash`에서 RTK와 bkit의 `unified-bash-pre.js`가 모두 실행될 수 있음. RTK가 먼저 실행되면 bkit은 rewritten 명령을 받음 |
| **설정 파일** | ✅ 호환 | RTK는 `.claude/hooks/rtk-rewrite.sh`, bkit은 `hooks/hooks.json`. 별도 경로 |
| **토큰 효과** | ✅ 시너지 | RTK가 Bash 출력 압축 → bkit의 PostToolUse hook이 더 적은 토큰으로 동작 |

### 9.2 권장 통합 전략

1. RTK를 Bash 출력 필터링에 사용 (외부 명령어: git, npm, cargo 등)
2. bkit의 ENH-R01~R03을 내부 출력(Hook, Agent, MCP)에 적용
3. 두 시스템의 토큰 추적을 통합하여 전체 세션 효율 측정

**결론**: RTK와 bkit은 **다른 레이어에서 보완적으로 작동**하며, 동시 사용 시 최대 효과.

---

## 10. 결론 및 권장 사항

### 10.1 핵심 발견

1. **bkit의 토큰 효율성은 체계적으로 관리되지 않고 있다.** Hook 출력(세션당 ~18-25KB), Agent 출력(무제한), MCP 응답(전체 문서)이 컨텍스트 윈도우를 비효율적으로 소비.

2. **RTK의 4대 철학은 bkit에 직접 적용 가능하다.** 특히 "Measure Everything"과 "Declarative Pipeline"은 bkit의 기존 아키텍처와 자연스럽게 통합된다.

3. **RTK를 그대로 도입하는 것보다 사상을 내재화하는 것이 더 효과적이다.** RTK는 Bash 출력만 다루지만, bkit 내부의 Hook/Agent/MCP 출력은 RTK가 손대지 못하는 영역이다.

4. **중복 코드 통합으로 즉시 개선 가능하다.** PDCA Eval 6→1 통합, Phase Stop 11→1 통합만으로 ~2,500 LOC 절감.

### 10.2 권장 실행 순서

```
Week 1: ENH-R01 (출력 필터) + ENH-R08 (안전성) → 즉시 토큰 절감
Week 2: ENH-R02 (토큰 추적) + ENH-R04/R05 (중복 통합) → 측정 + 코드 정리
Week 3: ENH-R03 (Agent 압축) + ENH-R06 (MCP 압축) → 대규모 절감
Week 4: ENH-R10 (적응형 렌더링) + ENH-R11 (예산 관리) → 자동화
```

### 10.3 예상 총 효과

| 메트릭 | Before | After | 개선 |
|--------|--------|-------|------|
| **Hook 출력 (세션당)** | ~18-25KB | ~8-10KB | **50-60% 절감** |
| **Agent 정의 파일** | 32개 | 27개 | **5개 삭제** |
| **Phase Stop 스크립트** | 11개 | 1개 | **10개 삭제** |
| **코드 라인 수** | ~58,781 LOC | ~55,500 LOC | **~3,300 LOC 절감** |
| **컨텍스트 효율** | 측정 불가 | 측정 가능 | **가시성 확보** |
| **auto-compact 빈도** | 빈번 | 감소 | **장기 세션 품질 향상** |

---

## 부록 A: 에이전트 분석 결과 요약

### A.1 RTK 분석팀 산출물

| Agent | 핵심 발견 |
|-------|----------|
| **rtk-filter-analyst** | 8단계 TOML 파이프라인, 42 Rust + 67 TOML = 109 필터, 12가지 전략, deny_unknown_fields, 인라인 테스트, Trust Gate SHA-256 |
| **rtk-hook-analyst** | Exit 0/1/2/3 프로토콜, 60개 규칙 레지스트리(RegexSet), 7개 AI 도구(3-tier), CC permission 파싱, Graceful Degradation |
| **rtk-economics-analyst** | SQLite tracking.db(90일), estimate_tokens(4 chars/token), 가중 CPT(output 5x, cache_write 1.25x, cache_read 0.1x), 에러 패턴 학습(Jaccard 유사도) |

### A.2 bkit 분석팀 산출물

| Agent | 핵심 발견 |
|-------|----------|
| **bkit-hook-explorer** | 18 Hook Events, 57 Scripts, 6-Layer 아키텍처, 500-char MAX_CONTEXT, lazy module loading |
| **bkit-mcp-explorer** | 2 MCP 서버 (16 Tools, 3 Resources), 캐시 없음, 전체 문서 반환, 단일 Write 작업(regression_rules) |
| **bkit-skills-explorer** | 37 Skills (8 PDCA + 10 Pipeline + 5 BaaS + 3 Level + 11 기타), 7개 고출력 스킬 식별 |
| **bkit-agents-explorer** | 32 Agents (5 PM + 5 Arch + 4 QA + 6 Eval + 3 PDCA + 9 기타), PDCA Eval 95% 중복, gap-detector 631줄 최대 |
| **bkit-lib-explorer** | 92 Modules, 22,734 LOC, pdca/(35%) 최대, status.js(871L) 핫스팟, output-filter 부재 |
| **bkit-scripts-explorer** | 57 Scripts, 7,847 LOC, 세션당 ~18-25KB 출력, phase stop 11개 통합 가능, 6개 critical path |
| **bkit-token-explorer** | 8개 Critical Gap: 토큰 카운팅, 출력 필터링, 예산 관리, 적응형 압축, 기능 격리, 메모리 정리, 도구 결과 압축, 컴팩션 최적화 |

---

## 부록 B: 용어 정의

| 용어 | 정의 |
|------|------|
| **RTK** | Rust Token Killer — CLI 출력을 압축하여 LLM 토큰 소비를 줄이는 Rust 바이너리 |
| **TOML 파이프라인** | RTK의 선언적 8단계 출력 필터 체인 |
| **CPT** | Cost Per Token — 토큰당 비용 (가중/혼합/활성 3종) |
| **Trust Gate** | 프로젝트 로컬 설정을 SHA-256 해시로 검증 후 로드하는 보안 메커니즘 |
| **Graceful Degradation** | 에러 발생 시 명령 실행을 차단하지 않고 원본 그대로 통과시키는 안전 패턴 |
| **Hook Output Filter** | bkit Hook 스크립트 출력을 선언적 규칙으로 압축하는 새 메커니즘 (ENH-R01) |
