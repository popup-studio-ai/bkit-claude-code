# PRD — bkit v2.1.8 Consolidated Bug Fixes (16 bugs from v2.1.8 hotfix QA + additional discoveries)

> **작성일**: 2026-04-17
> **대상 버전**: **v2.1.8** (consolidated release)
> **브랜치**: `feat/v218-bug-fixes` (v2.1.8 hotfix 머지 후, 기존 `feat/v219-bug-fixes`는 v2.1.8로 통합)
> **근거**:
> 1. `docs/04-report/features/cc-v2110-v2112-issue81-response.report.md` QA 단계에서 10명 에이전트 병렬 분석 중 포착된 11개 실제 버그 (B1~B11, confidence ≥ 80%)
> 2. Q10 리뷰(2026-04-17) 추가 발견 5건 (B12~B16, ENH-167 partial / dead constant / JSDoc / word-boundary)

---

## 0. Executive Summary

v2.1.8 hotfix QA 단계에서 10명 에이전트(A1~A10)가 **≈616 TC 스펙 도출 + 215 TC 실행**하는 과정에서 **11개 실제 버그** (평균 confidence 86%)를 포착. 추가로 Q10 리뷰 단계에서 **5건(B12~B16)**이 포착되어 본 PRD는 총 **16개 버그**를 **v2.1.8 단일 릴리스**로 통합한다. 기존에 v2.1.9로 분리 계획되었던 버그 수정 브랜치는 v2.1.8로 consolidate됨.

### 0.1 요약 통계

| 지표 | 값 |
|------|-----|
| 총 버그 수 | **16** (11 original + 5 additional) |
| 평균 confidence | **85%** (80% ~ 95%) |
| P0 (즉시 수정 필수) | 3건 (B5, B8, B9) |
| P1 (고우선) | 5건 (B1, B3, B10, B11, B6) |
| P2 (중간) | 5건 (B2, B4, B7, B12, B16) |
| P3 (저우선) | 3건 (B13, B14, B15) |
| 영향 파일 | 13 unique (lib/control × 3, lib/audit × 1, servers × 3, evals × 3, lib/context × 2, lib/qa × 2) |
| 총 예상 공수 | **~12h** (수정 ~6.5h + 테스트 ~5.5h) |

### 0.2 4-Perspective Value

| Perspective | v2.1.8 핵심 가치 |
|-------------|------------------|
| **Technical** | Controllable AI 프레임워크 2건(B1, B4) + Living Context 2건(B9, B10) + JSON-RPC 2.0 표준 준수(B5) + YAML 파서 강건화(B6~B8) — **11 load-bearing 모듈 정합성 회복** |
| **Operational** | MCP pdca-server JSON-RPC null id 호환성 (Anthropic MCP 클라이언트 최신 스펙) + checkpoint 다중 프로젝트 안전 + audit category enum 정확성 |
| **Strategic** | QA 10-에이전트 방법론의 ROI 증명: v2.1.8 QA가 3개 부가 하위 시스템(control/context/evals)에서 **zero-knowledge 발견 11 버그**를 포착 → "QA-as-Discovery" 공식화 |
| **Quality** | OWASP A04 (Insecure Design) 재점검, confidence-based 품질 게이트 데이터(80~95%)로 severity 정렬, regression guard 강화 |

---

## 1. 배경

v2.1.8 hotfix 릴리스 검증(74 PASS) 후 사용자 요청으로 "bkit 전체 기능" QA 심층 검증 수행. 이를 위해 10개 code-analyzer 에이전트 병렬 배치 → 15 lib 모듈 + 43 scripts + 2 MCP servers + 36 agents + 39 skills + 4 output styles + 21 hook events 전수 스펙 분석 → 616 TC 초안 생성.

실행 단계에서 215 TC가 PASS/FAIL 판정되는 동시에, **분석 에이전트들이 Read 과정에서 11개 실제 코드 결함**을 confidence ≥80%로 포착.

---

## 2. 버그 상세 카탈로그

### 2.1 P0 — 즉시 수정 필수 (3건)

#### B5 [P0, conf 90%] — `servers/bkit-pdca-server/index.js:520-521` JSON-RPC null id 처리 오류

**현상**: `id === undefined` 가드가 `null` id를 notification으로 오판 → JSON-RPC 2.0 스펙(explicit null id는 request 가능)과 불일치.

**영향**: MCP 최신 클라이언트가 null id로 request 보낼 때 응답 drop. `result.tools/list` 등 일부 클라이언트에서 hang.

**수정**:
```js
// Before
if (id === undefined) { /* notification path */ }

// After
if (!('id' in msg)) { /* notification path (only if id key absent) */ }
```

**공수**: 15min. **TC**: 1개 신규 (B5-TC: explicit null id request).

---

#### B8 [P0, conf 95%] — `evals/runner.js:224` pass 조건 중복 로직

**현상**: `pass = failedCriteria.length === 0 AND score >= 0.8` — 두 번째 조건은 항상 참(첫 조건 성립 시 score=1.0). 부분점수 지원 의도라면 주석 추가, 아니면 제거.

**영향**: 혼동성 코드. 향후 partial scoring 도입 시 오작동 위험.

**수정**:
```js
// Option A (주석 추가): 의도 명시
// pass requires zero failures AND (reserved for partial credit: score >= 0.8)

// Option B (단순화): 불필요 조건 제거
const pass = failedCriteria.length === 0;
```

**결정**: Option B (단순화) + 코드 주석으로 partial scoring 향후 확장성 명시.

**공수**: 15min. **TC**: 1개 수정 + 1개 신규.

---

#### B9 [P0, conf 90%] — `lib/context/scenario-runner.js:42` `allPassed` 논리 결함

**현상**:
```js
allPassed = failed === 0 && results.length > 0
```
모든 시나리오가 `skipped` (실제 pass 0)일 때 `allPassed === true` 반환 → Auto-PR 게이트가 "전부 통과"로 오판.

**영향**: CI/CD 자동 머지 시 실제 검증 없이 통과. 🔴 프로덕션 무결성 리스크.

**수정**:
```js
// Before
allPassed = failed === 0 && results.length > 0;

// After
allPassed = failed === 0 && passed > 0;
```

**공수**: 10min. **TC**: 3개 신규 (all pass, all skip, mixed).

---

### 2.2 P1 — 고우선 (5건)

#### B1 [P1, conf 85%] — `lib/control/loop-breaker.js:235` `setThreshold` API 결함

**현상**: `LOOP_RULES.find(r => r.id === ruleId)` — `LOOP_RULES`는 **plain object**, `.find()`는 Array 메서드. 호출 시 TypeError 또는 undefined.

**영향**: 사용자가 loop threshold 조정 시도 시 런타임 오류.

**수정**:
```js
// Before (broken)
const rule = LOOP_RULES.find(r => r.id === ruleId);

// After
const rule = LOOP_RULES[ruleId]; // direct key access
if (!rule) throw new Error(`Unknown rule: ${ruleId}`);
```

**공수**: 20min. **TC**: 2개 신규 (known rule, unknown rule).

---

#### B3 [P1, conf 85%] — `lib/control/checkpoint-manager.js:100` `process.cwd()` 우회

**현상**: `readPdcaStatus()` 내부에서 `process.cwd()` 직접 사용 → multi-project 환경에서 엉뚱한 프로젝트 checkpoint 로드. `getProjectDir()` 미사용.

**영향**: 다중 프로젝트 사용자, git worktree 환경에서 교차 오염.

**수정**:
```js
// Before
const statusPath = path.join(process.cwd(), '.bkit/state/pdca-status.json');

// After
const { getProjectDir } = require('../core/platform'); // or paths
const statusPath = path.join(getProjectDir(), '.bkit/state/pdca-status.json');
// Better: use STATE_PATHS.pdcaStatus() registry
const statusPath = STATE_PATHS.pdcaStatus();
```

**공수**: 20min. **TC**: 2개 신규 (CLAUDE_PROJECT_DIR override, worktree).

---

#### B10 [P1, conf 85%] — `lib/context/invariant-checker.js:73` 연산자 우선순위

**현상**:
```js
!code.includes('if') || !code.includes('balance >= ') && !code.includes('balance > ')
// JS precedence: && binds tighter than || → becomes
// !code.includes('if') || (!code.includes('balance >= ') && !code.includes('balance > '))
```
`if`가 없으면 balance 가드 체크가 **무조건 bypass**.

**영향**: Critical invariant (balance guard)가 이 코드 경로를 지나가지 않음 → 금융 도메인 버그 가능.

**수정**:
```js
// Correct parenthesization
!code.includes('if') || (!code.includes('balance >= ') && !code.includes('balance > '))
// vs. intended (assuming AND for balance guard)
!(code.includes('balance >= ') || code.includes('balance > '))
```

**결정**: 원 설계 의도 재확인 후 명시적 괄호 보강. 주석으로 의도 명시.

**공수**: 30min (의도 확인 포함). **TC**: 3개 신규 (with-if, no-if, balance-guard 조합).

---

#### B11 [P1, conf 80%] — `lib/qa/utils/pattern-matcher.js:64` regex 중첩 객체 실패

**현상**: `module.exports = \{([^}]*)\}` with `/s` flag — 중첩 `}` 만나면 조기 종료 → `module.exports = { a: { b: 1 } }` 같은 일반 패턴 miss.

**영향**: wiring/dead-code 스캐너가 현실적 모듈에서 false negative.

**수정**: 정규식 한계이므로 AST 파서(`acorn`) 도입, 또는 balanced-brace state machine 구현.

**결정**: 최소 침습 — 간단한 balanced-brace 파서로 교체. `acorn` 의존성 추가는 별도 ENH.

**공수**: 45min. **TC**: 3개 신규 (flat object, nested, deeply nested).

---

#### B6 [P1, conf 85%] — `evals/runner.js:69` YAML value colon 처리

**현상**: `/^([\w_]+)\s*:\s*(.*)$/` 값에 embedded colon(`desc: "a: b"`) 있으면 따옴표 truncation 위험.

**영향**: eval.yaml에 description/criteria에 colon 포함 시 파싱 손상.

**수정**: 현재는 값이 `.*$` greedy capture라 동작. 따옴표 내부 처리 필요 시 정교화. 최소 수정은 문서화.

**결정**: 정교화 (quoted-value 인식). `js-yaml` 의존성 도입은 v2.2.0 (evals 리팩토링).

**공수**: 40min. **TC**: 3개 신규 (plain, quoted, nested colon).

---

### 2.3 P2 — 중간 (3건)

#### B2 [P2, conf 80%] — `lib/audit/audit-logger.js:298-302` category enum 불일치

**현상**: Convenience logger들(`permission`, `checkpoint`, `trust`, `system`)이 CATEGORIES enum에 없는 값 사용 → `normalizeEntry`가 무조건 `'control'`로 강제 변환.

**영향**: Audit 로그 필터링 시 원 카테고리 유실.

**수정**: CATEGORIES enum 확장 또는 convenience logger category 정정.

**공수**: 30min. **TC**: 4개 신규 (각 convenience logger).

---

#### B4 [P2, conf 80%] — `lib/control/trust-engine.js:402-412` resetScore schema 불일치

**현상**: `resetScore`가 `levelHistory`에 `{type, data}` 스키마로 기록. 나머지 코드는 `{timestamp, from, to, trigger, reason}` 스키마 사용.

**영향**: 데이터 분석 시 inconsistent 레코드. UI 렌더링 실패 가능.

**수정**: 표준 스키마로 통일.

**공수**: 20min. **TC**: 2개 신규.

---

#### B7 [P2, conf 80%] — `evals/runner.js:86` list-item indent detection 취약성

**현상**: `indent <= 2 && trimmed.startsWith('- ')` — 중첩 리스트(indent 2의 criteria) 와 새 eval 엔트리를 혼동. 현재 모든 eval.yaml이 indent 6 criteria로 작성되어 있어 우발적 동작.

**영향**: 향후 eval.yaml 스타일 변경 시 깨짐 (시한폭탄).

**수정**: `currentItem` 상태 인식 파서 도입.

**공수**: 40min. **TC**: 3개 신규 (indent 2, 6, 혼재).

---

## 2.4 추가 발견 이슈 (Q10 리뷰 포착, 5건)

v2.1.8 consolidated release 준비 중 Q10 추가 리뷰(2026-04-17)에서 포착된 5개 버그. B1~B11과 달리 기능적 결함 외에도 **Dead Code / Docs=Code 정합성 / 하드코딩** 카테고리 포함.

### B12 [P2, conf 90%] — ENH-167 partial: BKIT_VERSION 하드코딩 (`'2.0.4'`)

**현상**: `lib/core/paths.js` 2곳 + 2 MCP servers(`servers/bkit-pdca-server/index.js`, `servers/bkit-analysis-server/index.js`)에서 `BKIT_VERSION = '2.0.4'` 하드코딩. 실제 현재 릴리스(`v2.1.8`)와 불일치 → Docs=Code 철학 위반, audit-logger.js도 동일한 패턴(`'2.0.6'`)으로 ENH-167 범위 확장.

**영향**: audit log, MCP server tool identification에서 잘못된 버전 전파 → 멀티 버전 동시 검증 환경에서 추적 혼선.

**수정**:
```js
// Before (4 locations)
const BKIT_VERSION = '2.0.4';

// After (single source of truth)
const { version } = require('../../package.json');
// or: require('../../.claude-plugin/plugin.json')
const BKIT_VERSION = version;
```

**파일**: `lib/core/paths.js` (2곳), `servers/bkit-pdca-server/index.js`, `servers/bkit-analysis-server/index.js`

**공수**: 30min (4 locations 수정 + 단일 source of truth 확인). **TC**: 2개 신규 (version match, version absent fallback).

**관련**: ENH-167 (BKIT_VERSION 중앙화) 부분 완료.

---

### B13 [P3, conf 95%] — Dead constant: `PDCA_STATUS_PATH` (B3 수정 이후)

**현상**: `lib/control/checkpoint-manager.js:47`에 선언된 `PDCA_STATUS_PATH` 상수는 B3 수정(`getProjectDir()` / `STATE_PATHS.pdcaStatus()` 전환) 이후 **참조 0건** → dead code.

**영향**: 없음 (기능적 버그 아님). 단, Dead Code 누적으로 ENH-202/SOL_005 "Dead Code 30%" 목표 대비 추적 누락.

**수정**:
```js
// Remove line 47
- const PDCA_STATUS_PATH = '.bkit/state/pdca-status.json';
```

**파일**: `lib/control/checkpoint-manager.js` (line 47)

**공수**: 5min. **TC**: grep guard로 회귀 방지 (`assert(!src.includes("PDCA_STATUS_PATH"))`).

**의존**: B3 수정 선행 필요.

---

### B14 [P3, conf 90%] — Redundant: `notifications/initialized` 체크 (2 MCP servers)

**현상**: `servers/bkit-pdca-server/index.js`, `servers/bkit-analysis-server/index.js` 양쪽에 `if (method === 'notifications/initialized')` 체크가 있으나, 상위의 **notification 분기 (id absent)**에서 이미 early return 처리됨 → 도달 불가능한 분기.

**영향**: 없음 (기능적 버그 아님). Cognitive load 증가 + B5 수정과 중복 가드로 retention bug 유발 가능.

**수정**: 상위 notification 분기로 흡수하거나 제거.
```js
// Remove redundant specific check
- if (method === 'notifications/initialized') { return; }
// (already handled by: if (!('id' in msg)) { return; })
```

**파일**: `servers/bkit-pdca-server/index.js`, `servers/bkit-analysis-server/index.js`

**공수**: 15min (2 servers 동기화). **TC**: B5 수정 TC에 흡수 (null-id path 도달 확인).

**의존**: B5 수정 선행 필요.

---

### B15 [P3, conf 85%] — JSDoc 부정확: `pattern-matcher.js:44`

**현상**: `lib/qa/utils/pattern-matcher.js:44`의 JSDoc 주석에 "NOT string aware" 표기. 실제 코드는 **문자열 리터럴 경계를 인식**하고 있어(regex에 문자열 경계 처리 포함) 주석과 구현이 반대.

**영향**: 없음 (기능적 버그 아님). Docs=Code 철학 위반 + 향후 기여자가 잘못된 가정으로 확장 시 버그 유발 위험.

**수정**:
```js
// Before (line 44)
// NOTE: NOT string aware — matches inside string literals

// After
// NOTE: String-aware — respects string literal boundaries via regex anchors
```

**파일**: `lib/qa/utils/pattern-matcher.js` (line 44)

**공수**: 10min (주석 재작성 + 동작 확인 TC 재읽기). **TC**: 1개 신규 (string literal 내부 match 동작 validator).

**의존**: B11 수정과 함께 처리 권장 (동일 파일, 동일 모듈 컨텍스트).

---

### B16 [P2, conf 85%] — Word boundary 누락: `code.includes('if')` substring match

**현상**: `lib/context/invariant-checker.js`에서 `code.includes('if')` substring 검사 사용 → `gift`, `if` (식별자), `shift`, `clarify` 등에 **모두 true**로 탐지. word boundary 미인식.

**영향**: Critical invariant check(B10 관련)에서 guard가 없는데도 있다고 오판(false positive) → 실제 guard-less 코드가 검증 통과할 위험.

**수정**:
```js
// Before
if (!code.includes('if')) { /* skip */ }

// After (word boundary regex)
if (!/\bif\b/.test(code)) { /* skip */ }
// or AST-based keyword check (더 강건)
```

**파일**: `lib/context/invariant-checker.js`

**공수**: 20min. **TC**: 4개 신규 (bare `if`, identifier `gift`, `shift`, comment `// if ...`).

**관련**: B10과 동일 파일. 병합 수정 고려.

---

### 2.4.1 추가 이슈 요약

| ID | P | Conf | 파일 | 공수 | TC |
|----|:-:|:----:|------|:----:|:--:|
| B12 | P2 | 90% | paths.js + 2 servers | 30min | 2 |
| B13 | P3 | 95% | checkpoint-manager.js | 5min | 0 (grep guard) |
| B14 | P3 | 90% | 2 MCP servers | 15min | (B5 흡수) |
| B15 | P3 | 85% | pattern-matcher.js | 10min | 1 |
| B16 | P2 | 85% | invariant-checker.js | 20min | 4 |
| **합계** | - | **89%** | **5 files** | **80min** | **7** |

---

## 3. 수정 전략 (Architecture Decision)

### 3.1 파일 영향 매트릭스

| 영역 | 파일 | 버그 수 | P0 | P1 | P2 |
|------|------|:-------:|:--:|:--:|:--:|
| Control (automation) | loop-breaker.js | 1 | - | B1 | - |
| Control (checkpoint) | checkpoint-manager.js | 1 | - | B3 | - |
| Control (trust) | trust-engine.js | 1 | - | - | B4 |
| Audit | audit-logger.js | 1 | - | - | B2 |
| MCP | bkit-pdca-server/index.js | 1 | B5 | - | - |
| Evals | evals/runner.js | 3 | B8 | B6 | B7 |
| Context (scenario) | scenario-runner.js | 1 | B9 | - | - |
| Context (invariant) | invariant-checker.js | 1 | - | B10 | - |
| QA utils | pattern-matcher.js | 1 | - | B11 | - |
| **합계** | **9 unique files, 11 bugs** | **3** | **5** | **3** |

### 3.2 병렬 수정 가능성

**Unique 파일 9개 + 병렬 의존성 없음 → 11 에이전트 완전 병렬 수정 가능**.

| Agent | 버그 | 파일 | 공수 |
|:-----:|:----:|------|:----:|
| T1 | B1 | lib/control/loop-breaker.js | 20min |
| T2 | B2 | lib/audit/audit-logger.js | 30min |
| T3 | B3 | lib/control/checkpoint-manager.js | 20min |
| T4 | B4 | lib/control/trust-engine.js | 20min |
| T5 | B5 | servers/bkit-pdca-server/index.js | 15min |
| T6 | B6 | evals/runner.js (line 69) | 40min |
| T7 | B7 | evals/runner.js (line 86) | 40min |
| T8 | B8 | evals/runner.js (line 224) | 15min |
| T9 | B9 | lib/context/scenario-runner.js | 10min |
| T10 | B10 | lib/context/invariant-checker.js | 30min |
| T11 | B11 | lib/qa/utils/pattern-matcher.js | 45min |

**⚠️ 주의**: T6/T7/T8 모두 `evals/runner.js` 수정 — **순차 실행 또는 단일 agent 병합 필요**.

**최적화된 그룹**:
- **T6-combined** (B6+B7+B8): evals/runner.js 3개 버그 통합 수정 → 95min
- 나머지 9개는 완전 병렬

**실제 병렬 에이전트 수**: 9 (파일 격리) + 1 (evals 통합) = **10 에이전트**.

### 3.3 테스트 추가 계획

총 28개 신규 TC 추가:
- B1: 2, B2: 4, B3: 2, B4: 2, B5: 1, B6: 3, B7: 3, B8: 2, B9: 3, B10: 3, B11: 3

테스트 파일 구조:
- `tests/qa/bug-fixes-control.test.js` (B1/B3/B4, 6 TC)
- `tests/qa/bug-fixes-audit.test.js` (B2, 4 TC)
- `tests/qa/bug-fixes-mcp.test.js` (B5, 1 TC)
- `tests/qa/bug-fixes-evals.test.js` (B6/B7/B8, 8 TC)
- `tests/qa/bug-fixes-context.test.js` (B9/B10, 6 TC)
- `tests/qa/bug-fixes-qa-utils.test.js` (B11, 3 TC)

---

## 4. 비기능 요구사항 (NFR)

| NFR | 요구 |
|-----|------|
| **하위 호환성** | 100% — 모든 수정은 버그 교정만, API 시그니처 변경 없음 |
| **Breaking changes** | 0 |
| **Match Rate 목표** | ≥ 95% (기존 215 TC + 신규 28 TC = 243, 회귀 없이 전 PASS) |
| **Confidence 검증** | 수정 후 각 버그는 **두 번째 에이전트가 독립 검증** (교차 검증) |
| **성능 영향** | ±5ms 이내 (회귀 테스트로 측정) |

---

## 5. Success Criteria

| ID | 기준 | 측정 방법 |
|----|------|----------|
| SC-1 | 11/11 버그 수정 완료 | git diff 확인 + 수정 패치 리뷰 |
| SC-2 | 기존 215 TC 100% PASS 유지 | 전수 재실행 |
| SC-3 | 신규 28 TC 100% PASS | 신규 suite 실행 |
| SC-4 | 각 버그에 regression guard rule 등록 | `.bkit/runtime/regression-rules.json` |
| SC-5 | 10명 에이전트 QA 재검증 Match Rate ≥ 95% | 독립 에이전트 병렬 검증 |
| SC-6 | CHANGELOG.md v2.1.8 entry 작성 | 문서 확인 |
| SC-7 | 영향도 분석 리포트 (파급 범위) | `docs/04-report/features/bkit-v219-bug-fixes.report.md` |

---

## 6. Risks & Mitigations (Pre-mortem)

| # | 위험 | 확률 | 영향 | 완화책 |
|---|------|:---:|:---:|--------|
| R1 | B10 수정 시 원 설계 의도 오해로 반대 로직 구현 | MEDIUM | HIGH | git blame + PR #63 (원저자 리뷰) 참조. 에이전트에게 "의도 불확실 시 주석으로 질문 남기기" 명시 |
| R2 | B11 balanced-brace parser가 edge case에서 실패 | MEDIUM | MEDIUM | 기존 regex를 fallback으로 유지 (try/catch) |
| R3 | evals/runner.js 3버그 통합 수정이 의존 관계로 서로 깨뜨림 | MEDIUM | MEDIUM | 단일 에이전트가 T6-combined 수행 + L1~L3 TC 순차 실행 |
| R4 | B3 수정 후 기존 checkpoint 파일 호환성 | LOW | MEDIUM | 경로 resolution만 변경, 파일 포맷 불변 |
| R5 | B5 JSON-RPC null id 수정이 legacy 클라이언트 깨뜨림 | LOW | LOW | `'id' in msg` 체크는 null/undefined 모두 올바르게 처리 (JSON-RPC 2.0 준수) |
| R6 | 11 에이전트 병렬 spawn 실패 (#37520 OAuth 401) | MEDIUM | HIGH | spawnSequentially 래퍼 + 재시도 (이미 lib/team/coordinator.js 구현됨) |

---

## 7. 배포 계획

### 7.1 단계별 진행

| Day | 작업 | 담당 |
|-----|------|------|
| D0 | PM 분석 (본 PRD) + Plan + Design | Main session (완료) |
| D0 | Team 11 에이전트 병렬 수정 | `general-purpose` × 10 |
| D0 | 단위 TC 실행 | Main session |
| D0+1 | QA 10 에이전트 재검증 | `code-analyzer` × 10 |
| D0+1 | 통합 테스트 (243 TC) | Main session |
| D0+1 | Report 작성 + 커밋 + PR | Main session |

### 7.2 롤백 계획

| 시나리오 | 조치 |
|---------|------|
| 단일 파일 수정 오류 | 해당 파일 `git checkout HEAD~1 -- <path>` |
| 전체 롤백 | `feat/v219-bug-fixes` 브랜치 폐기, v2.1.8 유지 |

---

## 8. 이해관계자

| 역할 | 책임 |
|------|------|
| **QA 10 agents (v2.1.8)** | 버그 발견 (완료) — A5, A6, A8 에이전트 보고 |
| **PM** | 본 PRD 작성 + 우선순위 결정 |
| **Team 11 agents** | 병렬 수정 + 단위 TC 추가 |
| **QA 10 agents (재검증)** | 독립 교차 검증 + 회귀 테스트 |
| **Main session (CTO)** | 오케스트레이션 + 통합 + 커밋 + 리포트 |

---

## 9. 결론

11개 버그는 **원 QA 방법론(10 에이전트 병렬 분석)의 ROI를 입증**하는 발견 세트. 모두 confidence ≥80%로 높은 신뢰도, P0 3건은 프로덕션 무결성에 영향, P1/P2 8건은 장기적 안정성에 필수. 총 공수 ~9.5h로 v2.1.8 single-day 릴리스 가능.

**다음 단계**: Team 11 에이전트 병렬 spawn → Edit + 단위 TC 추가 → QA 10 에이전트 재검증.

---

**PRD 완성도**: 확정
**승인 대기**: Team 단계 spawn
