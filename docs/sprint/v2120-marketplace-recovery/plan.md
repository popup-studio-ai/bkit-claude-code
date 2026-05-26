---
template: sprint-plan
version: 1.0
sprintId: v2120-marketplace-recovery
displayName: bkit v2.1.20 — Marketplace Recovery + Plugin Manifest Schema Compliance
phase: Plan (2/7)
date: 2026-05-26
author: kay (POPUP STUDIO) + bkit:sprint-master-planner agent (2nd-cycle dogfooding)
---

# v2120-marketplace-recovery Plan — Sprint Management

> **Sprint ID**: `v2120-marketplace-recovery`
> **Phase**: Plan (2/7)
> **Date**: 2026-05-26
> **Author**: kay (POPUP STUDIO) + `bkit:sprint-master-planner` agent (2nd-cycle dogfooding)
> **Master Plan Reference**: `docs/sprint/v2120-marketplace-recovery/master-plan.md`
> **PRD Reference**: `docs/sprint/v2120-marketplace-recovery/prd.md`

---

## 0. Context Anchor (PRD §0 복사, 보존)

| Key | Value |
|-----|-------|
| **WHY** | (1) 외부 dogfooder 정병진(@bj) 2026-05-26 bkit v2.1.14 install 실패 — `Validation errors: : Unrecognized key: "displayName"` 에러 (path: `/Users/bj/.claude/plugins/cache/temp_git_1779631720189_ocjr7a/.claude-plugin/plugin.json`) / (2) cc-version-researcher 88% 신뢰도 결론: `displayName`은 v2.1.143+ 정식 schema 키 — 정병진 CC ≤ v2.1.142 추정 98% / (3) ADR 0003 + 0006 위반 사례 — 정책 강화 필요 / (4) bkit Early Adopter Program 5-stage Lifecycle 첫 외부 트리거 |
| **WHO** | 1차 정병진(@bj) / 2차 향후 CC ≤ v2.1.142 사용 신규 사용자 N명 / 3차 kay (메인테이너) / 4차 @pruge (first follower) / 5차 bkit-starter 사용자 (영향 0) |
| **RISK** | R1 Critical 정병진 CC 버전 미확정 (Q2) / R2 Critical Anthropic 모순 (Q1) / R3 Critical displayName 회귀 (Anti-Mission) / R4 High SessionStart overhead / R6 Medium 진입장벽 / R9 High CI false-positive |
| **SUCCESS** | SC1-SC8 (Master Plan § 6 K1-K10) |
| **SCOPE** | in-scope 14 features (P0×4 / P1×5 / P2×5) + 3 신규 ENH + 1 신규 ADR + 1 외부 dogfooder entry / out-of-scope displayName 제거, hard reject, Anthropic 모순 해결, bkit-starter 변경, Trust default 변경 |

---

## 1. Requirements

### 1.1 In-scope (반드시 구현)

#### R1. README + README-FULL minimum CC v2.1.143 advisory (F1, P0)

**Public API / Behavior**:
- `README.md` Top section (h1 직후) + `README-FULL.md` 동일 위치에 1-line advisory 추가:
  ```markdown
  > **Requirement**: bkit requires Claude Code v2.1.143 or later (`displayName` field, see [`docs/06-guide/cc-compatibility.guide.md`](docs/06-guide/cc-compatibility.guide.md)).
  ```
- 위치: README.md line 5-10 (h1 + badges 다음, 사용자 가시성 우선)
- README-FULL.md 동일 패턴 적용

**Acceptance criteria**:
- [ ] `README.md` advisory 명시 (정확한 v2.1.143 + docs link)
- [ ] `README-FULL.md` advisory 명시 (동일 텍스트)
- [ ] docs-code-scanner CI gate 통과 (M7 ≥ 80)
- [ ] CHANGELOG.md `[2.1.20]` section에 명시 (release note)

#### R2. marketplace.json minimum CC version 메타데이터 (F2, P0)

**Public API / Behavior**:
- `.claude-plugin/marketplace.json` bkit entry (line 34-62)에 minimum CC version 메타데이터 추가
- spec 존재 여부 (Q4) 사전 확인:
  - 옵션 (a): `requirements.claudeCode: "^2.1.143"` 키 시도
  - 옵션 (b): `engines.claude-code: "^2.1.143"` (npm 패턴)
  - 옵션 (c): spec 미존재 시 description에 텍스트 명시
- bkit-starter entry는 displayName 미포함 → 변경 없음

**Acceptance criteria**:
- [ ] Q4 결정 후 spec 정합 키 추가 또는 description 텍스트 명시
- [ ] `validate-plugin.js --strict` 통과
- [ ] marketplace.json JSON 유효성 (`node -e 'require("./.claude-plugin/marketplace.json")'` Exit 0)

#### R3. 정병진 회신 메일 (F3, P0 HOT)

**Behavior**:
- 정병진 (@bj) GH issue thread 또는 이메일 회신 — sprint 시작 D1 AM 즉시 출고
- 회신 내용:
  - CC `--version` 출력 요청 (Q2 미해결 해소)
  - `npm install -g @anthropic-ai/claude-code@latest` 권장 (workaround)
  - ADR 0003 Phase 1.5 Empirical Validation dogfooding marker
  - Hall of Fame 등록 검토 안내 (`docs/external-dogfooders/_README.md` 정책 인용)
  - 본 sprint v2.1.20 진행 안내 (F1+F4 advisory 출고 + F14 entry 예정)
- audit_logger record (sprint-orchestrator 자동)

**Acceptance criteria**:
- [ ] D1 AM 12:00 KST 이전 회신 출고
- [ ] CC `--version` 요청 명시
- [ ] workaround 명시
- [ ] Hall of Fame 등록 검토 안내
- [ ] audit_logger record entry

#### R4. cc-compatibility.guide.md 신규 또는 보강 (F4, P0)

**Public API / Behavior**:
- 신규 `docs/06-guide/cc-compatibility.guide.md` 작성 (또는 기존 `contract-baseline-rollforward.guide.md` 확장)
- 필수 섹션:
  - § 1 bkit minimum CC version 정합 표 (v2.1.143+ 강제, advisory only)
  - § 2 displayName field 출처 (v2.1.143+ 공식 schema 인용 + Q3 release date)
  - § 3 21-key whitelist 사전 안내 (Anthropic 공식 schema 21 keys 모두 명시)
  - § 4 install 실패 시 사용자 대응 가이드:
    - `claude --version` 확인
    - `npm install -g @anthropic-ai/claude-code@latest`
    - 정병진 incident 사례 인용 (link to F14 Hall of Fame entry)
  - § 5 ADR 0003 + 0006 + 0011 관계 (Empirical Validation 정책)
  - § 6 cc-regression reconcile cycle 안내 (R3-321 entry tracking)
  - § 7 SessionStart CC version detection 안내 (F10 ENH-323)

**Acceptance criteria**:
- [ ] § 1-7 모두 작성
- [ ] M7 ≥ 80 통과
- [ ] docs-code-scanner Cross-link 통과 (ADR 0003 + 0006 + 0011 link)
- [ ] Korean 작성 (docs/ 디렉토리 규칙 — `.claude/CLAUDE.md`)

#### R5. validate-plugin.js --strict (F5, P1, ENH-322)

**Public API**:
```javascript
// CLI usage
node scripts/validate-plugin.js --strict [--verbose]
// Exit codes:
//   0 — PASS (all 21 keys + no extra + min-version metadata valid)
//   1 — required files/dirs missing (기존)
//   2 — extra key found (21-key whitelist 외)
//   3 — min-version metadata invalid (Q4 결정 후)
```

**Behavior** (단계별):
1. Existing `validatePluginJson()` (line 256-279) 호출 — name + version 체크
2. `--strict` flag 활성 시:
   - `lib/domain/rules/docs-code-invariants.js` `EXPECTED_PLUGIN_JSON_KEYS` import
   - `diffPluginJsonKeys(plugin)` 호출 → `extra` keys 존재 시 Exit 2
   - VERBOSE 시 각 key 상태 출력 + Anthropic docs URL 인용
   - min-version metadata 검증 (F2 결정 후, Q4)
3. 기존 validation 통과 + `--strict` Exit 0 시 sprint 정합 PASS

**Edge cases**:
- `--strict` flag 미사용 시 기존 동작 (backward compat)
- bkit-starter plugin 검증 면제 (별도 plugin, displayName 미포함 — Q4 결정 시 명시)
- `EXPECTED_PLUGIN_JSON_KEYS` import 실패 시 Exit 3 (domain SoT missing)

**Acceptance criteria**:
- [ ] `--strict` flag 신설 (Exit code 0/1/2/3)
- [ ] 21-key whitelist 통과 (bkit plugin.json 9 keys 모두 통과)
- [ ] extra key 시 Exit 2 (TC: 임시 `foo: 1` 추가 → fail 검증)
- [ ] VERBOSE 출력 정합 (각 key 상태 + Anthropic docs URL)
- [ ] L1 unit test PASS (M5 ≥ 70)

#### R6. contract-check.yml plugin schema validation step (F6, P1)

**Public API / Behavior**:
- `.github/workflows/contract-check.yml`에 신규 step 추가
- 위치: line 88 (Release Gate — docs-code-sync) 직후
- step name: `Release Gate — plugin.json schema validation (21-key whitelist)`
- run: `node scripts/validate-plugin.js --strict`
- continue-on-error: true (1주차 advisory only)
- 1주 후 continue-on-error: false (강제 fail)

**Acceptance criteria**:
- [ ] step 신설 + line 88 직후 위치
- [ ] 1주 advisory only 명시 (PR description + step comment)
- [ ] 2주차 강제 전환 marker (CHANGELOG.md `[2.1.21]` notes)
- [ ] 신규 step CI run에서 Exit 0 (bkit plugin.json 정합 확인)

#### R7. release-plugin-tag.sh claude plugin validate wire (F7, P1, ADR 0006)

**Public API / Behavior**:
- `scripts/release-plugin-tag.sh` line 82-83 사이에 `claude plugin validate .` 추가
- command -v claude 미존재 시 WARN + fallback (CI 환경 제약)
- Exit code 0 강제 — 위반 시 release 차단 (exit 1)
- ADR 0006 § Empirical Validation Gate 충족 marker
- `release-plugin-tag.sh` 변경 후 ADR 0006 § History append

**Acceptance criteria**:
- [ ] line 82-83 사이 `claude plugin validate .` 추가
- [ ] command -v claude 미존재 fallback (WARN + skip)
- [ ] Exit code 0 강제 (위반 시 exit 1)
- [ ] ADR 0006 § History append (~30일 지연 회복 marker)
- [ ] `bash scripts/release-plugin-tag.sh --dry-run` 통과 검증

#### R8. cc-regression/registry.js R3-321 신규 entry (F8, P1, ENH-321)

**Public API / Behavior**:
- `lib/cc-regression/registry.js` 22번째 entry로 추가 (기존 21 + 1):
  ```javascript
  {
    id: 'R3-321',
    issue: 'https://github.com/anthropics/claude-code/issues/26555', // 또는 별도 신규 issue
    severity: 'HIGH',
    since: '2.1.45', // strict path 시작
    expectedFix: '2.1.143', // displayName 공식 schema 인식
    affectedFiles: ['.claude-plugin/plugin.json', 'scripts/validate-plugin.js'],
    resolvedAt: null,
    notes: 'displayName v2.1.142- strict reject. v2.1.143+ 공식 schema 정식 키. 외부 dogfooder 정병진 @bj 2026-05-26 첫 confirmed case.',
  },
  ```
- cc-regression-reconcile cycle (매일 09:00 KST) 자동 통합

**Acceptance criteria**:
- [ ] line 163 직전 (closing array) `R3-321` entry 추가
- [ ] reconcile cycle 다음 run에서 entry 정합 확인 (PASS)
- [ ] M9 regressionMatch =0 (직전 sprint 회귀 0건)
- [ ] L2 integration test PASS (regression-rules-checker)

#### R9. docs-code-invariants.js EXPECTED_PLUGIN_JSON_KEYS SoT (F9, P1)

**Public API**:
```javascript
/** @type {ReadonlyArray<string>} */
const EXPECTED_PLUGIN_JSON_KEYS = Object.freeze([
  '$schema', 'name', 'displayName', 'version', 'description', 'author',
  'homepage', 'repository', 'license', 'keywords', 'skills', 'commands',
  'agents', 'hooks', 'mcpServers', 'outputStyles', 'lspServers',
  'experimental', 'dependencies', 'userConfig', 'channels',
]); // 21 keys (Anthropic 공식 schema)

/**
 * Compare plugin.json keys against EXPECTED_PLUGIN_JSON_KEYS.
 * @param {Object} actual - plugin.json parsed object
 * @returns {Array<{ key: string, status: "extra" | "missing" }>}
 */
function diffPluginJsonKeys(actual) {
  const result = [];
  const actualKeys = new Set(Object.keys(actual || {}));
  const expectedKeys = new Set(EXPECTED_PLUGIN_JSON_KEYS);
  for (const k of actualKeys) {
    if (!expectedKeys.has(k)) result.push({ key: k, status: 'extra' });
  }
  // Note: missing 은 information only (bkit plugin.json은 9 keys만 사용)
  return result;
}

module.exports = {
  // ... 기존 exports
  EXPECTED_PLUGIN_JSON_KEYS,
  diffPluginJsonKeys,
};
```

**Behavior** (단계별):
1. Pure domain module — no FS access (check-domain-purity CI 통과)
2. Object.freeze 적용 (immutability invariant 보존)
3. `extra` keys만 반환 (missing 은 information only — bkit plugin.json은 9 keys만 사용해도 정합)
4. F5 `validate-plugin.js --strict`에서 import

**Acceptance criteria**:
- [ ] `EXPECTED_PLUGIN_JSON_KEYS` Object.freeze 적용
- [ ] `diffPluginJsonKeys` function 신설
- [ ] check-domain-purity CI 통과
- [ ] L1 unit test PASS (bkit plugin.json 9 keys 입력 시 extra 0건 검증)
- [ ] M8 sectionCompleteness ≥ 85 (domain module 9-section spec)

#### R10. SessionStart CC version detection (F10, P2, ENH-323)

**Public API**:
```javascript
// hooks/startup/session-context.js 확장
/**
 * Detect installed CC version + emit advisory if < v2.1.143.
 * 1회/세션 cap + cache 1시간 TTL (.bkit/runtime/cc-version.json).
 *
 * @returns {{ version: string | null, isOldVersion: boolean, advisory: string | null }}
 */
function detectCCVersion() { ... }
```

**Behavior** (단계별):
1. `.bkit/runtime/cc-version.json` cache 확인 (1시간 TTL)
2. cache miss 시 `child_process.execSync('claude --version', { timeout: 200 })` 호출
3. version parse (e.g., "2.1.142" → semver compare to "2.1.143")
4. version < 2.1.143 시:
   - `BKIT_CC_VERSION_ADVISORY` env set
   - additionalContext 문자열에 advisory 추가
5. OTEL `gen_ai.cc_version_detection_ms` metric emit
6. Cache update (`.bkit/runtime/cc-version.json`)

**Edge cases**:
- `BKIT_DISABLE_CC_VERSION_DETECTION=1` env 설정 시 skip
- `command -v claude` 미존재 시 skip (silent)
- timeout 200ms 초과 시 skip (silent + OTEL emit)
- semver parse 실패 시 skip + warning

**Acceptance criteria**:
- [ ] `detectCCVersion()` 함수 추가 (session-context.js)
- [ ] timeout 200ms 강제
- [ ] cache 1시간 TTL 구현
- [ ] opt-out env (`BKIT_DISABLE_CC_VERSION_DETECTION=1`) 지원
- [ ] OTEL emit (`gen_ai.cc_version_detection_ms`)
- [ ] additionalContext 문자열 advisory 포함 (version < v2.1.143 시)
- [ ] L2 integration test PASS (mock CC version 시뮬레이션)

#### R11. ADR 0011 Plugin Manifest Schema Compliance Policy (F11, P2)

**Public API / Behavior**:
- `docs/adr/0011-plugin-manifest-schema-compliance.md` 신규 작성
- 필수 섹션:
  - § Context: 정병진 @bj incident (2026-05-26) + ADR 0003 위반 사례 + ADR 0006 § Empirical Validation Gate 미이행
  - § Decision: bkit minimum CC v2.1.143 정책 + 21-key whitelist 강제 + `claude plugin validate .` CI Gate + cc-regression R3-321 + SessionStart detection
  - § Consequences: 외부 dogfooder lifecycle Stage 5 도달 + 차별화 #2 강화 + ADR 0003 + 0006 정합
  - § Empirical Validation: SC1-SC8 8건 (Master Plan § 6 K1-K10) + cc-version-researcher 88% 신뢰도 결론 인용
  - § History: append-only — Anthropic 정책 변경 시 amend marker
  - § Open Question Q1 (Anthropic 모순) — bkit 측 해결 불가 명시
- Status: Accepted (sprint 진행 중)

**Acceptance criteria**:
- [ ] 6 sections 모두 작성
- [ ] M8 ≥ 85 (ADR 9-section spec coverage)
- [ ] ADR 0003 + 0006 cross-link
- [ ] Status: Accepted 명시
- [ ] sprint 진행 중 결정 사항 모두 반영 (Q1-Q5 결정 history)

#### R12. config-sync.test.js CS-015 21-key 보강 (F12, P2)

**Public API / Behavior**:
- `test/integration/config-sync.test.js` CS-015 (line 380-384) 보강:
  ```javascript
  // 기존: pluginJson?.name && pluginJson?.displayName && pluginJson?.description && pluginJson?.license
  // 보강: 21-key whitelist 모두 검증 + 화이트리스트 외 키 fail
  const { EXPECTED_PLUGIN_JSON_KEYS, diffPluginJsonKeys } = require('../../lib/domain/rules/docs-code-invariants');
  const diff = diffPluginJsonKeys(pluginJson);
  assert('CS-015',
    pluginJson?.name &&
    pluginJson?.displayName &&
    pluginJson?.description &&
    pluginJson?.license &&
    diff.filter((d) => d.status === 'extra').length === 0,
    'plugin.json has required metadata fields + 21-key whitelist + no extra keys'
  );
  ```

**Acceptance criteria**:
- [ ] CS-015 보강 (21-key 모두 검증)
- [ ] extra key 시 fail
- [ ] L2 integration test PASS (bkit plugin.json 9 keys 통과)
- [ ] L3 contract test PASS (regression match)

#### R13. test/e2e/cc-min-version.test.js v2.1.142 simulation (F13, P2)

**Public API / Behavior**:
- `test/e2e/cc-min-version.test.js` 신규 E2E 시나리오
- 단계:
  1. `claude --version` mock (returning "2.1.142")
  2. bkit SessionStart hook 호출
  3. `BKIT_CC_VERSION_ADVISORY` env set 검증
  4. additionalContext 문자열에 advisory 포함 검증
- 외부 dogfooder Lifecycle Stage 4 (Regression Lock) 달성 — 정병진 reproduction script 흡수

**Acceptance criteria**:
- [ ] E2E TC 작성
- [ ] mock CC version simulation 정상 동작
- [ ] BKIT_CC_VERSION_ADVISORY env set 검증
- [ ] additionalContext advisory 검증
- [ ] L4 E2E PASS

#### R14. Hall of Fame 정병진 entry (F14, P2)

**Public API / Behavior**:
- `docs/external-dogfooders/bj.md` 신규 entry:
  - 정병진 정보 (handle: bj, project: TBD — F3 회신 확인 후 추가)
  - 5-stage Lifecycle progress (Stage 1 Issue Filed 2026-05-26 / Stage 2 Repro absorbed F13 / Stage 3 Fix released v2.1.20 / Stage 4 Regression lock F8 / Stage 5 Public acknowledge)
  - 본 sprint 산출물 인용 (F1-F14 + ENH-321/322/323 + ADR 0011)
- `docs/external-dogfooders/_README.md` 명단 갱신 — `@bj` entry 추가 (#2)

**Acceptance criteria**:
- [ ] `docs/external-dogfooders/bj.md` 신규 작성
- [ ] `_README.md` 명단 갱신 (@pruge → @pruge + @bj)
- [ ] Lifecycle Stage 1-5 명시
- [ ] 본 sprint 산출물 cross-link
- [ ] M7 docCoverage ≥ 80

### 1.2 Out-of-scope (Sprint 명시 제외)

- `displayName` 제거 (Anti-Mission § 1) — 영구 보류
- v2.1.142 이하 CC 사용자 hard reject — 영구 보류 (advisory only)
- Anthropic docs vs 구현 lenient/strict 모순 (Q1) 자체 해결 — 영구 외부 의존
- bkit-starter plugin 변경 (displayName 미포함, 영향 0) — 영구 보류
- Q2 정병진 CC 버전 추측 보강 — F3 회신 받은 후 재검토
- v2.1.143+ CC 호환성 전수 분석 — v2.1.21+ 별도 분석 사이클
- Application Layer 3rd 도메인 (agent-dispatch/) — v2.1.21+ 별도
- Trust L3/L4 default 변경 — 사용자 결정 시
- MCP server 추가 — v2.1.21+
- bkit-gemini fork 통합 (CARRY-6) — 별도 sprint
- OTEL `gen_ai.cc_version_detection_ms` metric 데이터 분석 — v2.1.21+ 분석
- R3-321 entry telemetry 3-month 분석 — v2.1.21+
- dogfooder #3+ 유입 trend 분석 — v2.1.21+

---

## 2. Feature Breakdown

| # | Feature | LOC est. | Public Exports | Imports | 의존성 |
|---|---------|:-------:|----------------|---------|--------|
| 1 | **F1** README + README-FULL advisory | 4 | (docs) | - | - |
| 2 | **F2** marketplace.json metadata (Q4) | 3 | (docs) | - | - |
| 3 | **F3** 정병진 회신 메일 (HOT) | 1 (email) | (audit_logger record) | - | - |
| 4 | **F4** `docs/06-guide/cc-compatibility.guide.md` | 200 | (docs) | - | F1, F2 |
| 5 | **F5** `validate-plugin.js --strict` (ENH-322) | 80 | (script) | F9 | F9 |
| 6 | **F6** `contract-check.yml` step | 5 | (workflow) | F5 | F5 |
| 7 | **F7** `release-plugin-tag.sh` wire | 5 | (script) | - | - |
| 8 | **F8** `cc-regression/registry.js` R3-321 (ENH-321) | 15 | (registry entry) | - | - |
| 9 | **F9** `docs-code-invariants.js` EXPECTED_PLUGIN_JSON_KEYS SoT | 40 | `EXPECTED_PLUGIN_JSON_KEYS`, `diffPluginJsonKeys` | - | - |
| 10 | **F10** SessionStart CC detection (ENH-323) | 150 | (hook function `detectCCVersion`) | child_process, fs | F9 |
| 11 | **F11** `docs/adr/0011-*.md` | 250 | (ADR) | - | F1-F10 |
| 12 | **F12** `config-sync.test.js` CS-015 보강 | 15 | (test) | F9 | F9 |
| 13 | **F13** `test/e2e/cc-min-version.test.js` | 100 | (E2E test) | F10 | F10 |
| 14 | **F14** Hall of Fame @bj entry | 80 | (docs) | - | F3 |
| **Total** | - | **~948 LOC** | - | - | - |

### 2.1 Public Exports 정합

- F5 + F9 = `EXPECTED_PLUGIN_JSON_KEYS` + `diffPluginJsonKeys` (Domain Layer SoT)
- F8 R3-321 = `lib/cc-regression/registry.js` 22nd entry (Domain Layer registry)
- F10 = `detectCCVersion()` (Presentation Layer hook function)

### 2.2 Imports 의존성

- F5 → F9 (EXPECTED_PLUGIN_JSON_KEYS import)
- F10 → F9 (필요 시 EXPECTED_PLUGIN_JSON_KEYS 사용)
- F12 → F9 (diff function import)
- F13 → F10 (mock test)

### 2.3 Cross-Layer 영향 매트릭스

| File | Layer | 변경 종류 |
|------|------|---------|
| `README.md` + `README-FULL.md` | Presentation (docs) | edit (1-line advisory) |
| `.claude-plugin/marketplace.json` | Config | edit (metadata, Q4 결정 후) |
| `docs/06-guide/cc-compatibility.guide.md` | Documentation | new |
| `scripts/validate-plugin.js` | Presentation (CLI) | edit (`--strict` flag) |
| `.github/workflows/contract-check.yml` | CI/CD | edit (new step) |
| `scripts/release-plugin-tag.sh` | Presentation (CLI) | edit (line 82-83) |
| `lib/cc-regression/registry.js` | Domain | edit (entry append) |
| `lib/domain/rules/docs-code-invariants.js` | Domain | edit (SoT 추가) |
| `hooks/startup/session-context.js` | Presentation (hook) | edit (function 추가) |
| `docs/adr/0011-*.md` | Documentation | new |
| `test/integration/config-sync.test.js` | Test | edit (CS-015 보강) |
| `test/e2e/cc-min-version.test.js` | Test | new |
| `docs/external-dogfooders/bj.md` + `_README.md` | Documentation | new + edit |

---

## 3. Quality Gates (Sprint 활성)

| Gate | 정의 | Threshold | Phase | 측정 도구 |
|------|------|----------|-------|----------|
| **M1** matchRate | Design ↔ Code 일치율 | ≥90 (100 목표) | Iterate | `bkit-analysis::gap-detector` |
| **M2** code-quality | static + lint + type | ≥80 | Do | `bkit-analysis::code-analyzer` |
| **M3** criticalIssueCount | severity=critical 이슈 수 | =0 | Do, QA | `code-analyzer` |
| **M4** designCompleteness | 9-section spec coverage | ≥85 | Design | `gap-detector` |
| **M5** testCoverage | L1+L2 라인 커버리지 | ≥70 | Do | jest/istanbul |
| **M6** dependencyHealth | npm audit + circ-dep | warn 허용 | Do | npm audit |
| **M7** docCoverage | Code ↔ Docs sync | ≥80 | Do | `docs-code-scanner` |
| **M8** sectionCompleteness | PRD/Plan/Design 9-section | ≥85 | PRD, Plan, Design | `gap-detector` |
| **M9** regressionMatch | 직전 sprint 회귀 0건 | =0 | QA | `regression-rules-checker` |
| **M10** reportCompleteness | 보고서 9-section | ≥85 | Report | `gap-detector` |
| **S1** dataFlowIntegrity | 7-Layer 통합 무결성 | =100 | QA | `sprint-qa-flow` agent |
| **S2** featureCompletion | featureMap 집계 | =100 | Report | featureMap |
| **S3** sprintCycleTime | sprint 시작→archived 시간 | budget 내 (12d + 2d buffer) | Report | timeline tracker |
| **S4** crossSprintIntegrity | 다른 sprint 영향 0건 | =0 | Report | docs-code-scanner |

### 3.1 Sub-sprint 별 Gate 활성 매트릭스

| Sub-sprint | M1 | M2 | M3 | M4 | M5 | M6 | M7 | M8 | M9 | M10 | S1 | S2 | S3 | S4 |
|-----------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---:|:--:|:--:|:--:|:--:|
| 1. Recovery (P0) | partial | - | ✓ | ✓ | - | - | ✓ | ✓ | ✓ | ✓ | partial | ✓ | ✓ | ✓ |
| 2. Defense (P1) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 3. Forward-proofing (P2) | ✓ | ✓ | ✓ | ✓ | ✓ | - | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 4. Risks & Mitigation

| Risk | Likelihood | Severity | Mitigation | Cross-link |
|------|:---------:|:--------:|-----------|-----------|
| R1 정병진 CC 버전 미확정 (Q2) | **H** | **C** | F3 회신 요청 + Q2 미해결 명시 + 회신 후 재검토 | Master Plan § 7 |
| R2 Anthropic docs vs 구현 모순 (Q1) | M | **C** | cc-regression reconcile cycle 매일 09:00 KST + ADR 0011 § Open Question | Master Plan § 7 |
| R3 displayName 제거 시 v2.1.143+ 회귀 | L | **C** | Anti-Mission § 1 + F12 CS-015 보강 + F5 displayName missing fail | Master Plan § 7 |
| R4 SessionStart 성능 overhead | M | H | timeout 200ms + cache 1h + opt-out env + OTEL emit | Master Plan § 7 |
| R5 docs-code-invariants SoT 충돌 | L | M | Object.freeze + 기존 패턴 답습 + check-domain-purity CI | Master Plan § 7 |
| R6 min CC v2.1.143 진입장벽 | M | M | advisory only + F4 workaround 명시 + 95% upgrade 추정 | Master Plan § 7 |
| R7 R3-321 reconcile cycle 안정성 | L | M | 기존 21 entries 패턴 답습 + reconcile cycle PASS 검증 | Master Plan § 7 |
| R8 dogfooder abuse | L | L | 5-stage Lifecycle 강제 + Trust Score weight 0.05 | Master Plan § 7 |
| R9 validate-plugin --strict false-positive | M | H | 1주 advisory only + 2주차 strict + bkit-starter 검증 면제 | Master Plan § 7 |

### 4.1 Critical Risk 대응 의사결정 표

| Risk | 발화 trigger | 결정 권한 | 옵션 |
|------|------------|---------|------|
| R1 | 정병진 CC `--version` 회신 받음 후 v2.1.142 초과 확인 | kay | (a) sprint scope 보강 / (b) 별도 incident 추적 / (c) Out-of-scope 명시 |
| R2 | Anthropic CC 신규 release docs lenient 변화 감지 | kay + cc-version-researcher | (a) ADR 0011 amend / (b) sprint v2.1.21+ 신규 분기 / (c) cc-regression reconcile archived |
| R3 | PR에서 displayName 제거 시도 발견 | CI gate (F5 + F12 자동 차단) | (자동 fail, manual override 없음) |

---

## 5. Document Index

| Phase | Document | Path |
|-------|----------|------|
| Master Plan | (선행) | `docs/sprint/v2120-marketplace-recovery/master-plan.md` |
| PRD | (선행) | `docs/sprint/v2120-marketplace-recovery/prd.md` |
| Plan | 본 문서 | `docs/sprint/v2120-marketplace-recovery/plan.md` |
| Design | ⏳ | `docs/sprint/v2120-marketplace-recovery/design.md` |
| Iterate (Sub-sprint 1) | ⏳ | `docs/03-analysis/features/v2120-recovery.iterate.md` |
| Iterate (Sub-sprint 2) | ⏳ | `docs/03-analysis/features/v2120-defense.iterate.md` |
| Iterate (Sub-sprint 3) | ⏳ | `docs/03-analysis/features/v2120-forward-proofing.iterate.md` |
| QA (Sub-sprint 1) | ⏳ | `docs/05-qa/features/v2120-recovery.qa-report.md` |
| QA (Sub-sprint 2) | ⏳ | `docs/05-qa/features/v2120-defense.qa-report.md` |
| QA (Sub-sprint 3) | ⏳ | `docs/05-qa/features/v2120-forward-proofing.qa-report.md` |
| Report (Sprint 종합) | ⏳ | `docs/04-report/features/v2120-marketplace-recovery.report.md` |
| Sub-sprint 1 Report | ⏳ | `docs/sprint/v2120-marketplace-recovery/sub-sprint-1-recovery.report.md` |
| Sub-sprint 2 Report | ⏳ | `docs/sprint/v2120-marketplace-recovery/sub-sprint-2-defense.report.md` |
| Sub-sprint 3 Report | ⏳ | `docs/sprint/v2120-marketplace-recovery/sub-sprint-3-forward-proofing.report.md` |
| **신규 산출물** | - | - |
| F4 cc-compatibility guide | ⏳ | `docs/06-guide/cc-compatibility.guide.md` |
| F11 ADR 0011 | ⏳ | `docs/adr/0011-plugin-manifest-schema-compliance.md` |
| F14 Hall of Fame @bj | ⏳ | `docs/external-dogfooders/bj.md` |

---

## 6. Implementation Order (Phase 4 Do)

### 6.1 Sub-sprint 1 Recovery (P0×4 — D1 PM ~ D2)

| Step | File | 이유 |
|:----:|------|------|
| 1 | F3 정병진 회신 메일 (HOT) | D1 AM 12:00 KST 이전, 외부 dogfooder Lifecycle Stage 1→2 진행 |
| 2 | F1 `README.md` + `README-FULL.md` advisory | 사용자 가시성 우선, 1-line minimum CC v2.1.143 명시 |
| 3 | F2 `marketplace.json` metadata (Q4 결정 후) | spec 확인 필요, 미가능 시 보류 + description 텍스트 |
| 4 | F4 `docs/06-guide/cc-compatibility.guide.md` | F1 + F2 통합 안내 문서, 사용자 self-service |
| 5 | Sub-sprint 1 QA + Report + Archived | M3=0 + S1=100 검증 |

### 6.2 Sub-sprint 2 Defense (P1×5 — D2 EOD ~ D7)

| Step | File | 이유 |
|:----:|------|------|
| 1 | F9 `docs-code-invariants.js` SoT | Leaf module — `EXPECTED_PLUGIN_JSON_KEYS` 정의 우선 |
| 2 | F5 `validate-plugin.js --strict` (ENH-322) | F9 import + `--strict` flag 신설 |
| 3 | F6 `contract-check.yml` step | F5 결과 CI gate 통합 (1주 advisory only) |
| 4 | F7 `release-plugin-tag.sh` wire (ADR 0006) | line 82-83 사이 `claude plugin validate .` 추가 |
| 5 | F8 `cc-regression/registry.js` R3-321 (ENH-321) | 22번째 entry 추가 + reconcile cycle 통합 |
| 6 | Sub-sprint 2 QA + Report + Archived | regression-rules-checker + L2 integration TC PASS |

### 6.3 Sub-sprint 3 Forward-proofing (P2×5 — D7 EOD ~ D12)

| Step | File | 이유 |
|:----:|------|------|
| 1 | F10 `hooks/startup/session-context.js` (ENH-323) | `detectCCVersion()` 함수 추가 |
| 2 | F11 `docs/adr/0011-*.md` | ADR 정식 채택 (F1-F10 종합) |
| 3 | F12 `config-sync.test.js` CS-015 보강 | F9 SoT 활용 → 21-key 모두 검증 |
| 4 | F13 `test/e2e/cc-min-version.test.js` | F10 mock simulation E2E |
| 5 | F14 `docs/external-dogfooders/bj.md` + `_README.md` | F3 회신 확인 후, Hall of Fame entry |
| 6 | Sub-sprint 3 QA + Report + Archived | L4 E2E PASS + M3=0 + S1=100 |
| 7 | Sprint Report (종합) + Sprint Archived | v2.1.20 sprint terminal state |

### 6.4 Leaf-first → Orchestrator-last 원칙 준수

- **Leaf modules (먼저)**: F9 (docs-code-invariants SoT) — Domain Layer pure
- **Mid modules**: F5 (validate-plugin.js) + F8 (cc-regression registry) + F10 (SessionStart hook)
- **Orchestrator modules (나중)**: F6 (contract-check.yml CI gate) + F7 (release-plugin-tag.sh wire) + F13 (E2E test)
- **Documentation (병행)**: F1, F2, F4, F11, F14 — Layer 무관 docs/

---

## 7. Acceptance Criteria (Phase 6 QA)

### 7.1 Static checks (모두 PASS)

- [ ] **L1 Frontmatter**: 본 sprint 산출 docs 모두 frontmatter 정합 (template version, sprintId, date, author 명시)
- [ ] **L1 Syntax**: JavaScript syntax check (F5, F9, F10) — `node --check` Exit 0
- [ ] **L1 Lint**: ESLint warn 0 (script + lib + test)
- [ ] **L1 Type**: TypeScript type check (해당 시) — Exit 0
- [ ] **L4 Deprecation**: 본 sprint에서 deprecated API 사용 0건

### 7.2 Runtime checks (모두 PASS)

- [ ] **L2 Integration**: F5 `--strict` flag + F8 R3-321 entry + F10 SessionStart hook 동작 검증
- [ ] **L3 Contract**: regression-rules-checker `R3-321` entry 정합 검증 + check-domain-purity 통과
- [ ] **L3 Cross-Sprint**: docs-code-scanner — 본 sprint 산출이 v2.1.14/17/18/19 sprint 산출에 영향 0건
- [ ] **L4 E2E**: F13 `cc-min-version.test.js` PASS (mock CC v2.1.142 simulation)

### 7.3 Quality Gates (모두 PASS)

- [ ] M1 ≥ 90 (gap-detector — Design ↔ Code matchRate)
- [ ] M2 ≥ 80 (code-analyzer — static + lint + type)
- [ ] M3 = 0 (criticalIssueCount)
- [ ] M4 ≥ 85 (designCompleteness)
- [ ] M5 ≥ 70 (testCoverage)
- [ ] M6 warn 허용 (dependencyHealth)
- [ ] M7 ≥ 80 (docCoverage)
- [ ] M8 ≥ 85 (sectionCompleteness)
- [ ] M9 = 0 (regressionMatch)
- [ ] M10 ≥ 85 (reportCompleteness)
- [ ] S1 = 100 (dataFlowIntegrity)
- [ ] S2 = 100 (featureCompletion)
- [ ] S3 budget 내 (12d + 2d buffer)
- [ ] S4 = 0 (crossSprintIntegrity)

### 7.4 Invariant 보존 검증

- [ ] `EXPECTED_PLUGIN_JSON_KEYS` Object.freeze 적용 (immutability)
- [ ] check-domain-purity CI 통과 (pure domain, no FS)
- [ ] `cc-regression/registry.js` 22 entries (기존 21 + R3-321) — guard 손상 0건
- [ ] `docs-code-invariants.js` 기존 EXPECTED_COUNTS / EXPECTED_*_NAMES 손상 0건
- [ ] `session-context.js` 429 lines 기존 동작 회귀 0건 (only `detectCCVersion()` 추가)

### 7.5 ADR 정합 검증

- [ ] **ADR 0003** Phase 1.5 Empirical Validation — 본 sprint 모든 결론 verified 사실 출처 명시 (file:line 또는 docs URL)
- [ ] **ADR 0006** § Empirical Validation Gate — F7 `claude plugin validate .` wire 충족
- [ ] **ADR 0010** effort-aware invariant — 본 sprint 영향 0건 (Out-of-scope)
- [ ] **ADR 0011** (신규) — 본 sprint Decision 6 sections 모두 작성 + Accepted Status

### 7.6 외부 dogfooder Lifecycle 검증

- [ ] **Stage 1** Issue Filed (정병진 2026-05-26) — confirmed
- [ ] **Stage 2** Repro absorbed (F13 E2E v2.1.142 simulation) — 자동 검증
- [ ] **Stage 3** Fix released (v2.1.20 GA) — sprint Report 시 confirmed
- [ ] **Stage 4** Regression Lock (F8 R3-321 + F12 CS-015 보강) — 자동 검증
- [ ] **Stage 5** Public Acknowledge (F14 Hall of Fame entry) — confirmed

---

## 8. Cross-Sprint Dependency

### 8.1 본 sprint가 다른 sprint 의존

| Sprint | 의존 종류 | 활용 산출물 |
|--------|---------|------------|
| v2.1.14 Differentiation | input | 8-phase container, sprint-master-planner agent (2nd-cycle dogfooding) |
| v2.1.17 CI/CD Hardening | input | contract-check.yml baseline (5/12~5/20 contract red 8-day class close) |
| v2.1.18 Carryover | input | sprint discipline baseline (6 CO closed) |
| v2.1.19 Quality Maturation | input | 외부 dogfooder Lifecycle policy (S4 Proactive sub-sprint) |
| ADR 0003 | reference | Phase 1.5 Empirical Validation 의무 |
| ADR 0006 | reference | § Empirical Validation Gate 의무 wire 회복 (~30일 지연) |

### 8.2 다른 sprint가 본 sprint 산출 활용

| Sprint | 활용 종류 | 활용 산출물 |
|--------|---------|------------|
| v2.1.21+ | output | F8 R3-321 guard telemetry 3-month 분석 + reconcile cycle 안정성 평가 |
| v2.1.21+ | output | F10 ENH-323 SessionStart CC detection telemetry 3-month 분석 + 격하/유지 결정 |
| v2.1.21+ | output | F14 Hall of Fame @bj entry 후속 Stage 4 → Stage 5 정식 완료 |
| v2.1.21+ | output | Q5 미해결 — v2.1.142 이하 사용자 비율 trend 데이터 검토 |
| ADR 0011 | output | Plugin Manifest Schema Compliance Policy 정식 채택 + Anthropic 정책 변경 시 amend marker |
| CARRY-? | closure | ADR 0006 § Empirical Validation Gate 미이행 CARRY 해소 |

### 8.3 Cross-Layer Impact 매트릭스

| Layer | 본 sprint 영향 | 변경 종류 |
|-------|------------|----------|
| Domain | F9 SoT 추가 + F8 R3-321 entry | edit (pure domain) |
| Application | (없음) | - |
| Infrastructure | (없음) | - |
| Presentation | F5 + F7 + F10 (script + hook) | edit |
| Documentation | F1 + F2 + F4 + F11 + F14 | new + edit |
| Test | F12 + F13 | edit + new |
| CI/CD | F6 + F7 | edit |

---

## 9. Plan 완료 Checklist

- [x] Context Anchor 보존 (PRD §0 복사) — § 0
- [x] Requirements R1-R14 (14건 모두 spec + acceptance criteria) — § 1
- [x] Out-of-scope 매트릭스 (13건 명시) — § 1.2
- [x] Feature Breakdown 14건 + Public Exports + Imports 의존성 + Cross-Layer 영향 — § 2
- [x] Quality Gates M1-M10 + S1-S4 (14 gates) + Sub-sprint별 활성 매트릭스 — § 3
- [x] Risks & Mitigation 9건 + Critical Risk 대응 의사결정 표 — § 4
- [x] Document Index (Phase별 docs + Sub-sprint Report + 신규 산출물) — § 5
- [x] Implementation Order (Leaf-first → Orchestrator-last, Sub-sprint별 step 매트릭스) — § 6
- [x] Acceptance Criteria (Static + Runtime + Quality Gates + Invariant + ADR 정합 + Lifecycle 5-stage 검증) — § 7
- [x] Cross-Sprint Dependency (v2.1.14/17/18/19 입력 + ADR 0003/0006 reference + v2.1.21+ 출력 + ADR 0011 신규) — § 8

### 9.1 Verified 사실 출처 (file:line 또는 docs URL) — 재확인

- ✅ `scripts/validate-plugin.js` line 264-272 (name+version만 체크)
- ✅ `scripts/release-plugin-tag.sh` line 82-83 (check-trust-score-reconcile + check-quality-gates만)
- ✅ `lib/cc-regression/registry.js` 21 entries (plugin manifest guard 0건)
- ✅ `lib/domain/rules/docs-code-invariants.js` line 1-132 (EXPECTED_COUNTS + EXPECTED_*_NAMES만)
- ✅ `test/integration/config-sync.test.js` CS-015 line 380-384 (displayName 명시적 요구)
- ✅ `.github/workflows/contract-check.yml` line 1-109 (plugin schema validation 없음)
- ✅ `.claude-plugin/plugin.json` line 1-20 (9 keys)
- ✅ `.claude-plugin/marketplace.json` line 11-62 (bkit entry 8 keys)
- ✅ `hooks/startup/session-context.js` 429 lines (CC version detection 없음)
- ✅ `docs/adr/0010-effort-aware-invariant.md` 존재 (다음 0011)
- ✅ `docs/external-dogfooders/_README.md` line 57-60 (@pruge dogfooder #1)
- ✅ `docs/03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md` (cc-version-researcher 88%)

### 9.2 미해결 의문점 (Q1-Q5) — 재확인

- ⚠️ **Q1** docs vs 구현 lenient/strict 모순 (Anthropic 책임)
- ⚠️ **Q2** 정병진 CC 버전 미확정 (F3 회신 대기)
- ⚠️ **Q3** v2.1.143 release date (F4 작성 시 재조회)
- ⚠️ **Q4** marketplace.json `requirements.claudeCode` spec (F2 Do 진입 시 schema 조회)
- ⚠️ **Q5** v2.1.142 이하 사용자 비율 (post-release 모니터)

---

**Next Phase**: Phase 3 Design — 코드베이스 깊이 분석 + 구현 spec + Test Plan Matrix L1-L5 + Cross-Sprint Integration + ENH-292 Sequential Dispatch 자기적용.
