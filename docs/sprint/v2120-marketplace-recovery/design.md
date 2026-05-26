---
template: sprint-design
version: 1.0
sprintId: v2120-marketplace-recovery
displayName: bkit v2.1.20 — Marketplace Recovery + Plugin Manifest Schema Compliance
phase: Design (3/7)
date: 2026-05-26
author: kay (POPUP STUDIO) + bkit:sprint-master-planner agent (2nd-cycle dogfooding)
---

# v2120-marketplace-recovery Design — Sprint Management

> **Sprint ID**: `v2120-marketplace-recovery`
> **Phase**: Design (3/7)
> **Date**: 2026-05-26
> **Author**: kay (POPUP STUDIO) + `bkit:sprint-master-planner` agent (2nd-cycle dogfooding)
> **Master Plan Reference**: `docs/sprint/v2120-marketplace-recovery/master-plan.md`
> **PRD Reference**: `docs/sprint/v2120-marketplace-recovery/prd.md`
> **Plan Reference**: `docs/sprint/v2120-marketplace-recovery/plan.md`

---

## 0. Context Anchor (PRD §0 + Plan §0 일치, 보존)

| Key | Value |
|-----|-------|
| **WHY** | (1) 외부 dogfooder 정병진(@bj) 2026-05-26 bkit v2.1.14 install 실패 — `Validation errors: : Unrecognized key: "displayName"` (path: `/Users/bj/.claude/plugins/cache/temp_git_1779631720189_ocjr7a/.claude-plugin/plugin.json`) / (2) cc-version-researcher 88% 신뢰도 결론: `displayName`은 v2.1.143+ 정식 schema 키 / (3) ADR 0003 + 0006 위반 사례 / (4) bkit Early Adopter Program 5-stage Lifecycle 첫 외부 트리거 |
| **WHO** | 1차 정병진(@bj) / 2차 향후 CC ≤ v2.1.142 사용 신규 사용자 N명 / 3차 kay / 4차 @pruge / 5차 bkit-starter (영향 0) |
| **RISK** | R1 Critical Q2 / R2 Critical Q1 / R3 Critical displayName 회귀 / R4 High SessionStart overhead / R6 Medium 진입장벽 / R9 High CI false-positive |
| **SUCCESS** | SC1-SC8 (Master Plan § 6 K1-K10) |
| **SCOPE** | in-scope 14 features + 3 신규 ENH + 1 신규 ADR + 1 외부 dogfooder entry / out-of-scope displayName 제거, hard reject, Anthropic 모순 해결, bkit-starter 변경 |

---

## 1. 코드베이스 깊이 분석 (필수)

### 1.1 기존 모듈 분석 (file:line 명시 — 실측 verified)

#### 1.1.1 `scripts/validate-plugin.js` (현재 326 lines 추정)

**현 상태**:
- Line 14: `PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..')`
- Line 20-23: `REQUIRED_FILES = ['.claude-plugin/plugin.json', 'README.md']`
- Line 25-29: `REQUIRED_DIRS = ['skills', 'agents', 'commands']`
- Line 31: `VERBOSE = process.argv.includes('--verbose')` — `--strict` flag 부재
- Line 49-61: `log`, `error`, `warn` helpers
- Line 68-117: `parseFrontmatter` — markdown frontmatter parser
- Line 124-160: `validateSkill` — skill 검증
- Line 167-194: `validateAgent` — agent 검증
- Line 201-223: `validateCommand` — command 검증
- Line 230-250: `validateHooksInContent` — hook 스크립트 reference 검증
- **Line 256-279**: `validatePluginJson` — **핵심 갭**
  ```javascript
  function validatePluginJson() {
    const pluginPath = path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json');
    try {
      const content = fs.readFileSync(pluginPath, 'utf8');
      const plugin = JSON.parse(content);
      if (!plugin.name) {
        error('plugin.json missing "name" field');
        return false;
      }
      if (!plugin.version) {
        error('plugin.json missing "version" field');
        return false;
      }
      log(`Plugin: ${plugin.name} v${plugin.version}`);
      return true;
    } catch (e) {
      error(`Invalid plugin.json: ${e.message}`);
      return false;
    }
  }
  ```
  → name + version만 체크, 21-key whitelist 검증 없음
- Line 288-310: `scanDir` — directory scan
- Line 316+: `main` — orchestrator

**본 sprint 변경 지점**:
- Line 31 → `STRICT = process.argv.includes('--strict')` 추가
- Line 256-279 `validatePluginJson` → 21-key whitelist 검증 추가 (F5 ENH-322)
- Exit code 0/1/2/3 분기 추가

#### 1.1.2 `scripts/release-plugin-tag.sh` (현재 139 lines)

**현 상태**:
- Line 23: `set -euo pipefail`
- Line 25-26: `ROOT=$(...)`, `DRY_RUN=0`, `NO_GH_NOTES=0`
- Line 29-42: arg parsing (`--dry-run` / `--no-gh-notes` / `-h`)
- Line 47-49: canonical BKIT_VERSION 읽기 (`bkit.config.json`)
- Line 52-63: SoT files 정합 검증 (`bkit.config.json` + `.claude-plugin/plugin.json`)
- Line 66-71: README badge + CHANGELOG header 검증
- Line 74-79: pre-flight clean working tree 검증
- **Line 82-83**: `node scripts/check-trust-score-reconcile.js` + `node scripts/check-quality-gates-m1-m10.js`  
  → **`claude plugin validate .` wire 없음 = ADR 0006 § Empirical Validation Gate 미이행 (~30일 지연)**
- Line 87-91: tag conflict 감지
- Line 94-108: tag issue (`claude plugin tag` 또는 fallback `git tag -a`)
- Line 111-133: optional GitHub release notes draft

**본 sprint 변경 지점**:
- Line 82-83 사이에 신규 `claude plugin validate .` 추가 (F7, ADR 0006 충족)
- command -v claude 미존재 시 WARN + fallback 처리
- Exit code 0 강제 (위반 시 exit 1)
- ADR 0006 § History append marker

#### 1.1.3 `lib/cc-regression/registry.js` (현재 163 lines, 21 entries)

**현 상태**:
- Line 1-15: header (`@module lib/cc-regression/registry`, `@version 2.1.12`)
- Line 17-19: `@typedef Guard` import from regression-registry.port
- Line 21: `const CC_REGRESSIONS = [`
- Line 22-29: MON-CC-02 (Opus 1M /compact block)
- Line 31-65: v2.1.117 new HIGH regressions (ENH-262, 263, 264)
- Line 67-95: MON-CC-06 native binary regressions (50383, 50384, 51165)
- Line 96-100+: lightweight entries (50274, 50541, 50567, 50609, etc.)
- Line 163: closing `];`
- **21 entries 전수 — plugin manifest 관련 guard 0건** (grep "plugin manifest\|displayName\|R3-" → 0 hit)

**본 sprint 변경 지점**:
- Line 162 (closing array `];` 직전)에 **R3-321** 신규 entry 추가 (F8 ENH-321)
- 기존 21 entries 손상 0건 (append-only)

#### 1.1.4 `lib/domain/rules/docs-code-invariants.js` (현재 132 lines)

**현 상태**:
- Line 1-16: header (`@module lib/domain/rules/docs-code-invariants`, `@version 2.1.13`, `Pure domain module — no FS access`)
- **Line 19-26**: `EXPECTED_COUNTS = Object.freeze({...})` (skills 44, agents 34, hookEvents 21, hookBlocks 24, mcpServers 2, mcpTools 19)
- Line 48-57: `EXPECTED_ACTIVE_AGENT_NAMES` (34 names, Object.freeze)
- Line 60-63: `EXPECTED_DEPRECATED_AGENT_NAMES` (6 names)
- Line 66-75: `EXPECTED_SKILL_NAMES` (44 names)
- Line 78-84: `EXPECTED_HOOK_EVENT_NAMES` (21 names)
- Line 87-92: `EXPECTED_PDCA_MCP_TOOLS` (13 names)
- Line 95-98: `EXPECTED_ANALYSIS_MCP_TOOLS` (6 names)
- Line 100-120: `diffCounts(measured)` function
- Line 122-132: `module.exports = {...}`

**본 sprint 변경 지점** (F9):
- Line 98 (`EXPECTED_ANALYSIS_MCP_TOOLS` 직후)에 **`EXPECTED_PLUGIN_JSON_KEYS`** 신규 추가
- Line 100 (`diffCounts` 직전)에 **`diffPluginJsonKeys`** 신규 함수 추가
- Line 122-132 `module.exports`에 신규 두 export 추가

#### 1.1.5 `test/integration/config-sync.test.js` (CS-015 line 380-384)

**현 상태** (line 374-390 실측):
```javascript
// CS-014: plugin.json engines field (optional — CC does not require this field)
assert('CS-014',
  ... );

// CS-015: plugin.json has required metadata fields
assert('CS-015',
  pluginJson?.name && pluginJson?.displayName && pluginJson?.description && pluginJson?.license,
  'plugin.json has name, displayName, description, license'
);
```

→ displayName 존재 명시적 요구 (Anti-Mission § 1 강화 — displayName 제거 시 CS-015 fail)

**본 sprint 변경 지점** (F12):
- Line 380-384 보강 — 21-key whitelist 검증 추가
- 기존 displayName 요구 유지 (R3 Anti-Mission 강화)
- `diffPluginJsonKeys` import

#### 1.1.6 `.github/workflows/contract-check.yml` (현재 109 lines)

**현 상태**:
- Line 1-8: workflow name + trigger (PR main, push main + feat/**)
- Line 10-87: contract-l1-l4 job (15 steps)
  - Line 28-29: Domain Layer Purity Check
  - Line 31-32: L1+L4 vs v2.1.9 LTS baseline
  - Line 37-38: L1+L4 vs v2.1.16 Latest baseline
  - Line 40-41: Guard Registry validation
  - Line 46-47: Test File Tracking validation
  - Line 49-50: Docs=Code cross-check
  - Line 52-53: Dead code detection
  - Line 55-56: Runtime Integration Tests
  - Line 61-62: L2 Smoke
  - Line 64-65: L2 Hook Attribution
  - Line 67-68: L3 MCP Compatibility (static schema)
  - Line 70-71: L3 MCP Runtime
  - Line 73-74: Aggregate all tests
  - Line 83-84: Release Gate — bkit-full-system
  - **Line 86-87**: Release Gate — docs-code-sync
- Line 89-109: contract-l5-e2e job
- **Plugin manifest schema validation step 없음 = 핵심 갭**

**본 sprint 변경 지점** (F6):
- Line 87 직후에 신규 step 추가:
  ```yaml
  - name: Release Gate — plugin.json schema validation (21-key whitelist)
    run: node scripts/validate-plugin.js --strict
    continue-on-error: true # 1주차 advisory only, 2주차부터 false
  ```

#### 1.1.7 `hooks/startup/session-context.js` (현재 429 lines)

**현 상태**:
- Line 1-50: imports + helpers (CC version detection 없음, `grep "cc.*version|claude.*--version|CC_VERSION|advisor"` → 0 hit)
- additionalContext 문자열 builder
- BKIT_* env vars 처리

**본 sprint 변경 지점** (F10 ENH-323):
- 신규 함수 `detectCCVersion()` 추가 (~150 LOC)
  - child_process.execSync timeout 200ms
  - `.bkit/runtime/cc-version.json` cache 1h TTL
  - `BKIT_CC_VERSION_ADVISORY` env set
  - additionalContext 문자열 advisory 추가
  - OTEL emit (`gen_ai.cc_version_detection_ms`)
  - opt-out env (`BKIT_DISABLE_CC_VERSION_DETECTION=1`)

#### 1.1.8 `.claude-plugin/plugin.json` (현재 20 lines, 9 keys)

**현 상태** (실측 line 1-20):
```json
{
  "name": "bkit",
  "version": "2.1.19",
  "displayName": "bkit — AI Native Development OS",
  "description": "The only Claude Code plugin that verifies AI-generated code against its own design specs.",
  "author": {...},
  "repository": "https://github.com/popup-studio-ai/bkit-claude-code",
  "license": "Apache-2.0",
  "keywords": [...],
  "outputStyles": "./output-styles/"
}
```

→ 9 keys: `name`, `version`, `displayName`, `description`, `author`, `repository`, `license`, `keywords`, `outputStyles` (모두 21-key whitelist 내, 비표준 0개)

**본 sprint 변경 지점**:
- 변경 없음 (Anti-Mission § 1 — displayName 유지)

#### 1.1.9 `.claude-plugin/marketplace.json` (현재 64 lines, bkit entry 8 keys)

**현 상태** (실측 line 11-62):
- bkit-starter entry (line 12-32): `name`, `description`, `version`, `author`, `repository`, `source`, `category`, `keywords` — `displayName` 미포함, 영향 0
- bkit entry (line 34-62): 8 keys 동일 패턴

**본 sprint 변경 지점** (F2, Q4 결정 후):
- bkit entry에 minimum CC version 메타데이터 추가 (옵션 a/b/c)

### 1.2 의존성 매트릭스

#### 1.2.1 본 sprint가 import 할 기존 자산

| 본 sprint 모듈 | Import from | 사용 목적 |
|---------------|-------------|----------|
| F5 `validate-plugin.js` | F9 `lib/domain/rules/docs-code-invariants.js` | `EXPECTED_PLUGIN_JSON_KEYS` + `diffPluginJsonKeys` |
| F10 `session-context.js` | `child_process` (Node built-in) | `execSync('claude --version', { timeout: 200 })` |
| F10 `session-context.js` | `fs` (Node built-in) | cache `.bkit/runtime/cc-version.json` read/write |
| F12 `config-sync.test.js` | F9 `lib/domain/rules/docs-code-invariants.js` | `diffPluginJsonKeys` |
| F13 `cc-min-version.test.js` | F10 `hooks/startup/session-context.js` | mock + assertion |
| F11 ADR 0011 | ADR 0003, 0006, 0010 (cross-ref) | cross-link |
| F14 `docs/external-dogfooders/bj.md` | `_README.md` policy | 5-stage Lifecycle inherit |

#### 1.2.2 변경 금지 invariant 명시

- **`EXPECTED_COUNTS` (line 19-26)**: 본 sprint 무관, 손상 0건
- **`EXPECTED_ACTIVE_AGENT_NAMES` + 6 기타 names list (line 48-98)**: 본 sprint 무관, 손상 0건
- **`diffCounts(measured)` function (line 100-120)**: 본 sprint 무관, 손상 0건
- **`lib/cc-regression/registry.js` 21 entries (line 22-162)**: 본 sprint 무관, append-only로 22 entries
- **`scripts/validate-plugin.js` line 124-250 (validateSkill / validateAgent / validateCommand / validateHooksInContent)**: 본 sprint 무관, 손상 0건
- **`hooks/startup/session-context.js` 429 lines 기존 동작**: F10 추가 외 손상 0건
- **`docs-code-invariants.js` Pure domain — no FS access (line 11)**: 본 sprint 신규 코드도 동일 invariant 강제 (check-domain-purity CI 통과)

#### 1.2.3 신규 모듈 LOC est. + Public Exports

| 신규 모듈 | LOC est. | Public Exports |
|----------|:--------:|---------------|
| F4 `cc-compatibility.guide.md` | 200 (docs) | - |
| F5 `validate-plugin.js --strict` 확장 | 80 | (CLI: `--strict` flag, Exit code 0/1/2/3) |
| F6 contract-check.yml step | 5 (YAML) | - |
| F7 release-plugin-tag.sh wire | 5 (shell) | - |
| F8 R3-321 entry | 15 (JS) | (entry in registry array) |
| F9 SoT 추가 | 40 (JS) | `EXPECTED_PLUGIN_JSON_KEYS`, `diffPluginJsonKeys` |
| F10 `detectCCVersion()` | 150 | `BKIT_CC_VERSION_ADVISORY` env (Presentation layer) |
| F11 ADR 0011 | 250 (docs) | - |
| F12 CS-015 보강 | 15 (JS) | - |
| F13 E2E cc-min-version | 100 (JS) | - |
| F14 Hall of Fame @bj entry | 80 (docs) | - |
| **Total** | **~948 LOC** | - |

---

## 2. Module 구조 + Implementation Order

### 2.1 파일 트리

```
.
├── README.md                                                    [edit F1]
├── README-FULL.md                                               [edit F1]
├── CHANGELOG.md                                                 [edit — [2.1.20] section]
├── bkit.config.json                                             [edit — version 2.1.19 → 2.1.20]
├── .claude-plugin/
│   ├── plugin.json                                              [edit — version 2.1.19 → 2.1.20 only]
│   └── marketplace.json                                         [edit F2 — Q4 결정 후 metadata]
├── scripts/
│   ├── validate-plugin.js                                       [edit F5 ENH-322]
│   └── release-plugin-tag.sh                                    [edit F7 ADR 0006]
├── lib/
│   ├── cc-regression/
│   │   └── registry.js                                          [edit F8 — R3-321 entry ENH-321]
│   └── domain/
│       └── rules/
│           └── docs-code-invariants.js                          [edit F9 — EXPECTED_PLUGIN_JSON_KEYS SoT]
├── hooks/
│   └── startup/
│       └── session-context.js                                   [edit F10 — detectCCVersion() ENH-323]
├── .github/
│   └── workflows/
│       └── contract-check.yml                                   [edit F6 — schema validation step]
├── docs/
│   ├── adr/
│   │   └── 0011-plugin-manifest-schema-compliance.md            [new F11]
│   ├── 06-guide/
│   │   └── cc-compatibility.guide.md                            [new F4]
│   ├── external-dogfooders/
│   │   ├── _README.md                                           [edit F14 — 명단 갱신]
│   │   └── bj.md                                                [new F14 — @bj entry]
│   └── sprint/
│       └── v2120-marketplace-recovery/
│           ├── master-plan.md                                   [기존]
│           ├── prd.md                                           [기존]
│           ├── plan.md                                          [기존]
│           ├── design.md                                        [본 문서]
│           ├── sub-sprint-1-recovery.report.md                  [⏳ Sub-sprint 1 종결]
│           ├── sub-sprint-2-defense.report.md                   [⏳ Sub-sprint 2 종결]
│           └── sub-sprint-3-forward-proofing.report.md          [⏳ Sub-sprint 3 종결]
├── test/
│   ├── integration/
│   │   └── config-sync.test.js                                  [edit F12 — CS-015 보강]
│   └── e2e/
│       └── cc-min-version.test.js                               [new F13]
└── .bkit/
    ├── runtime/
    │   └── cc-version.json                                      [new — F10 cache 1h TTL]
    └── state/
        └── sprint/
            └── v2120-marketplace-recovery.json                  [auto — sprint-orchestrator]
```

### 2.2 Implementation Order Matrix (Leaf-first → Orchestrator-last)

| Step | Sub-sprint | File | LOC est. | 책임 | 의존성 |
|:----:|:----------:|------|:-------:|------|--------|
| 1 | Recovery | F3 정병진 회신 메일 (HOT) | 1 | 외부 dogfooder 회신 + Lifecycle Stage 1→2 trigger | - |
| 2 | Recovery | F1 `README.md` + `README-FULL.md` | 4 | minimum CC v2.1.143 advisory | - |
| 3 | Recovery | F2 `marketplace.json` (Q4 결정 후) | 3 | metadata 추가 | Q4 결정 |
| 4 | Recovery | F4 `cc-compatibility.guide.md` | 200 | 통합 사용자 가이드 | F1, F2 |
| 5 | Defense | F9 `docs-code-invariants.js` SoT | 40 | Domain Layer SoT (Leaf) | - |
| 6 | Defense | F5 `validate-plugin.js --strict` (ENH-322) | 80 | CLI validator strict mode | F9 |
| 7 | Defense | F6 `contract-check.yml` step | 5 | CI gate | F5 |
| 8 | Defense | F7 `release-plugin-tag.sh` wire (ADR 0006) | 5 | Release gate | - |
| 9 | Defense | F8 `cc-regression/registry.js` R3-321 (ENH-321) | 15 | Regression registry entry | - |
| 10 | Forward-proofing | F10 `session-context.js` `detectCCVersion()` (ENH-323) | 150 | SessionStart runtime detection | F9 (optional) |
| 11 | Forward-proofing | F11 ADR 0011 | 250 | 정책 정식 채택 | F1-F10 (cross-ref) |
| 12 | Forward-proofing | F12 `config-sync.test.js` CS-015 보강 | 15 | Integration test | F9 |
| 13 | Forward-proofing | F13 `test/e2e/cc-min-version.test.js` | 100 | E2E v2.1.142 simulation | F10 |
| 14 | Forward-proofing | F14 `docs/external-dogfooders/bj.md` + `_README.md` | 80 | Hall of Fame @bj entry | F3 회신 확인 |
| - | - | **Total** | **~948 LOC** | - | - |

### 2.3 Leaf-first 원칙 검증

- **Leaf modules (Domain Layer, 의존성 없음)**: F9 (Step 5) — 가장 먼저
- **Mid modules (Domain + Presentation)**: F5 (Step 6), F8 (Step 9), F10 (Step 10)
- **Orchestrator modules (CI/CD)**: F6 (Step 7), F7 (Step 8), F13 (Step 13)
- **Documentation (Layer 무관)**: F1, F2, F4, F11, F14 — 병행 가능

---

## 3. Module 상세 spec

### 3.1 Module F9: `EXPECTED_PLUGIN_JSON_KEYS` SoT (`lib/domain/rules/docs-code-invariants.js`)

**Header**:
```javascript
/**
 * v2.1.20: Plugin manifest schema 21-key whitelist SoT (ENH-322 + F9).
 *
 * Derivation: Anthropic official plugin manifest schema (docs.claude.com).
 * Source: cc-version-researcher 88% confidence conclusion
 * (docs/03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md).
 *
 * @module lib/domain/rules/docs-code-invariants
 * @version 2.1.20
 */
```

**Public API**:
```javascript
/** @type {ReadonlyArray<string>} */
const EXPECTED_PLUGIN_JSON_KEYS = Object.freeze([
  '$schema',         // JSON schema reference
  'name',            // Required (existing line 264-272 check)
  'displayName',     // v2.1.143+ (UI picker label)
  'version',         // Required (existing line 264-272 check)
  'description',     // Standard
  'author',          // Standard
  'homepage',        // Optional
  'repository',      // Standard
  'license',         // Standard (SPDX)
  'keywords',        // Standard
  'skills',          // Plugin component
  'commands',        // Plugin component
  'agents',          // Plugin component
  'hooks',           // Plugin component
  'mcpServers',      // Plugin component
  'outputStyles',    // Plugin component (bkit uses string path)
  'lspServers',      // Plugin component
  'experimental',    // Anthropic experimental flags
  'dependencies',    // Plugin dependencies
  'userConfig',      // User config schema
  'channels',        // (release channel?)
]); // 21 keys total

/**
 * Compare plugin.json keys against EXPECTED_PLUGIN_JSON_KEYS.
 *
 * @param {Object} actual - parsed plugin.json object
 * @returns {Array<{ key: string, status: "extra" | "missing" }>}
 *
 * Note: "missing" status is informational only — bkit plugin.json uses 9
 * keys (subset of 21), which is valid. CI gate (F5 --strict) only fails
 * on "extra" status (key not in whitelist).
 */
function diffPluginJsonKeys(actual) {
  const result = [];
  if (!actual || typeof actual !== 'object') {
    return [{ key: '<invalid>', status: 'extra' }];
  }
  const actualKeys = new Set(Object.keys(actual));
  const expectedKeys = new Set(EXPECTED_PLUGIN_JSON_KEYS);
  // Extra keys: present in actual but not in whitelist
  for (const k of actualKeys) {
    if (!expectedKeys.has(k)) result.push({ key: k, status: 'extra' });
  }
  return result;
}

module.exports = {
  // 기존 exports 유지
  EXPECTED_COUNTS,
  diffCounts,
  EXPECTED_ACTIVE_AGENT_NAMES,
  EXPECTED_DEPRECATED_AGENT_NAMES,
  EXPECTED_SKILL_NAMES,
  EXPECTED_HOOK_EVENT_NAMES,
  EXPECTED_PDCA_MCP_TOOLS,
  EXPECTED_ANALYSIS_MCP_TOOLS,
  // v2.1.20: 신규 SoT (F9)
  EXPECTED_PLUGIN_JSON_KEYS,
  diffPluginJsonKeys,
};
```

**Behavior** (단계별):
1. `EXPECTED_PLUGIN_JSON_KEYS` = 21-key whitelist (Anthropic 공식 schema)
2. `Object.freeze` 적용 — immutability invariant
3. `diffPluginJsonKeys(actual)`:
   - actual 객체에서 추출한 keys를 expectedKeys (Set)와 비교
   - actual에 있고 expected에 없으면 `status: "extra"`
   - missing은 정보 only — 반환 안 함 (bkit 9 keys만 사용해도 정합)
4. Pure domain — no FS, no network (check-domain-purity CI 통과)

**Edge cases**:
- `actual = null` or `actual = undefined`: 단일 `{key: '<invalid>', status: 'extra'}` 반환
- `actual = {}` (empty): extra 0건 반환 (missing은 정보 only)
- `actual = { foo: 1 }`: `{key: 'foo', status: 'extra'}` 반환

**Test cases (L1)**:
- TC-F9-1: bkit plugin.json 9 keys 입력 → extra 0건 검증
- TC-F9-2: extra key 추가 (`foo: 1`) → `{key: 'foo', status: 'extra'}` 반환 검증
- TC-F9-3: null/undefined 입력 → invalid status 반환
- TC-F9-4: empty object 입력 → empty array 반환
- TC-F9-5: 모든 21 keys 입력 → extra 0건 검증

### 3.2 Module F5: `validate-plugin.js --strict` (ENH-322)

**Header**:
```javascript
/**
 * v2.1.20: --strict mode adds 21-key whitelist validation (ENH-322 + F5).
 *
 * Trigger: 정병진 (@bj) 2026-05-26 install incident
 * (Unrecognized key: "displayName" error — CC ≤ v2.1.142 strict reject).
 *
 * @version 2.1.20
 */
```

**Public API**:
```bash
# CLI usage
node scripts/validate-plugin.js [--verbose] [--strict]

# Exit codes:
#   0 — PASS (all checks passed)
#   1 — required files/dirs missing (existing behavior)
#   2 — extra key found (21-key whitelist violation — --strict only)
#   3 — min-version metadata invalid (--strict + F2 metadata 결정 후)
```

**Behavior** (단계별):
1. Existing main flow (line 316+):
   - REQUIRED_FILES 존재 확인 (line 20-23)
   - REQUIRED_DIRS 존재 확인 (line 25-29)
   - `validatePluginJson()` 호출 (line 256-279)
2. `validatePluginJson()` 확장:
   - 기존 name + version check 유지
   - **신규**: `--strict` flag 활성 시 21-key whitelist 검증
     ```javascript
     if (STRICT) {
       const { EXPECTED_PLUGIN_JSON_KEYS, diffPluginJsonKeys } =
         require('../lib/domain/rules/docs-code-invariants');
       const diff = diffPluginJsonKeys(plugin);
       const extraKeys = diff.filter(d => d.status === 'extra');
       if (extraKeys.length > 0) {
         for (const e of extraKeys) {
           error(`plugin.json extra key (not in 21-key whitelist): "${e.key}"`);
         }
         process.exit(2);
       }
       log(`Strict mode: 21-key whitelist PASS (${Object.keys(plugin).length} keys checked)`);
     }
     ```
3. VERBOSE 시 각 key 상태 출력:
   ```javascript
   if (VERBOSE && STRICT) {
     log(`Anthropic official plugin manifest schema (21 keys):`);
     for (const k of EXPECTED_PLUGIN_JSON_KEYS) {
       const status = plugin[k] !== undefined ? 'present' : 'absent';
       log(`  - ${k}: ${status}`);
     }
   }
   ```
4. min-version metadata 검증 (Q4 결정 후):
   - `marketplace.json` bkit entry에 `requirements.claudeCode` 키 존재 시 semver 검증
   - 미충족 시 Exit 3

**Edge cases**:
- `--strict` flag 미사용 시 기존 동작 (backward compat)
- `EXPECTED_PLUGIN_JSON_KEYS` import 실패 시 → Exit 3 (domain SoT missing)
- bkit-starter plugin: marketplace.json bkit-starter entry는 별도 plugin, F5는 main plugin.json만 검증

**Test cases (L1+L2)**:
- TC-F5-1: 기존 호환 — `node validate-plugin.js` Exit 0 (bkit plugin.json 정합)
- TC-F5-2: `--strict` Exit 0 — bkit plugin.json 9 keys 모두 21-key 내
- TC-F5-3: `--strict` Exit 2 — 임시 `foo: 1` 추가 → fail
- TC-F5-4: `--strict --verbose` 출력 정합 — 21 keys 각 상태 표시
- TC-F5-5: `EXPECTED_PLUGIN_JSON_KEYS` import 실패 → Exit 3 (mock fail)

### 3.3 Module F8: `R3-321` Registry Entry (`lib/cc-regression/registry.js`)

**신규 entry (line 162 직전 추가)**:
```javascript
// --- v2.1.20: Plugin manifest schema strict reject (R3-321, ENH-321) ---
{
  id: 'R3-321',
  issue: 'https://github.com/anthropics/claude-code/issues/26555',
  severity: 'HIGH',
  since: '2.1.45', // strict path 시작 (Issue #26555 2026-02-18 등 6+ 이슈 입증)
  expectedFix: '2.1.143', // displayName 공식 schema 인식 (docs.claude.com)
  affectedFiles: [
    '.claude-plugin/plugin.json',
    'scripts/validate-plugin.js',
    'lib/domain/rules/docs-code-invariants.js',
    'hooks/startup/session-context.js',
  ],
  resolvedAt: null, // bkit 측 해결 안 됨 (CC ≤ v2.1.142 사용자 환경 의존)
  notes: 'displayName v2.1.142- strict reject. v2.1.143+ 공식 schema 정식 키 (cc-version-researcher 88% 신뢰도 결론). 외부 dogfooder 정병진 @bj 2026-05-26 첫 confirmed case. bkit response: F1+F4 advisory + F5 21-key whitelist + F7 claude plugin validate wire + F10 SessionStart CC detection + F11 ADR 0011 정식 채택.',
},
```

**Behavior**:
- 매일 09:00 KST `cc-regression-reconcile.yml` cycle 자동 통합
- `affectedFiles` 변경 시 reconcile cycle 자동 감지
- `resolvedAt = null` — bkit 측 해결 안 됨 (외부 사용자 환경 의존, advisory only)
- `notes` 인용 출처 명시 — verified 사실 보장

**Test cases (L2)**:
- TC-F8-1: registry.js 22 entries (기존 21 + R3-321) — 정합 검증
- TC-F8-2: `R3-321` id unique 검증 (중복 0건)
- TC-F8-3: regression-rules-checker PASS — registry entry 형식 정합
- TC-F8-4: reconcile cycle next run에서 entry 자동 통합 확인 (CI artifact)

### 3.4 Module F10: SessionStart `detectCCVersion()` (`hooks/startup/session-context.js`, ENH-323)

**Header**:
```javascript
/**
 * v2.1.20: CC version detection in SessionStart (F10 + ENH-323).
 *
 * Trigger: 정병진 (@bj) 2026-05-26 install incident — forward-proofing
 * to alert users at SessionStart (not just install) if CC < v2.1.143.
 *
 * @since 2.1.20
 */
```

**Public API**:
```javascript
/**
 * Detect installed CC version + emit advisory if < v2.1.143.
 * 1회/세션 cap + cache 1시간 TTL (.bkit/runtime/cc-version.json).
 *
 * @returns {{
 *   version: string | null,         // e.g., "2.1.142" or null if detection failed
 *   isOldVersion: boolean,          // true if version < 2.1.143
 *   advisory: string | null,        // human-readable warning text
 *   source: 'cache' | 'fresh' | 'skipped',
 * }}
 */
function detectCCVersion() { ... }
```

**Behavior** (단계별):
1. **opt-out env check**: `process.env.BKIT_DISABLE_CC_VERSION_DETECTION === '1'` → return `{ version: null, isOldVersion: false, advisory: null, source: 'skipped' }`
2. **Cache check**: `.bkit/runtime/cc-version.json` 존재 시 mtime 확인 → 1h 미만이면 cache 사용
3. **Fresh detection**:
   ```javascript
   const startTime = Date.now();
   let version = null;
   try {
     const result = execSync('claude --version', { timeout: 200, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
     // e.g., "claude/2.1.142" or "claude (CLI) 2.1.142"
     const match = result.match(/(\d+)\.(\d+)\.(\d+)/);
     if (match) version = match[0];
   } catch (e) {
     // timeout or command not found — silent skip
     debugLog('SessionStart', 'CC version detection failed', { error: e.message });
   }
   const durationMs = Date.now() - startTime;
   ```
4. **Semver compare**: `version < "2.1.143"` 시 `isOldVersion = true`
5. **OTEL emit**:
   ```javascript
   require('../../lib/infra/telemetry').emit({
     name: 'gen_ai.cc_version_detection_ms',
     value: durationMs,
     attributes: { version, isOldVersion, source: 'fresh' },
   });
   ```
6. **env set**: `isOldVersion` 시 `process.env.BKIT_CC_VERSION_ADVISORY = '1'`
7. **additionalContext 추가**: `isOldVersion` 시 advisory text 반환
   ```text
   > **bkit Compatibility Notice**: detected Claude Code v{version}. bkit requires v2.1.143+ (displayName field). Run `npm install -g @anthropic-ai/claude-code@latest` to upgrade. See docs/06-guide/cc-compatibility.guide.md.
   ```
8. **Cache update**:
   ```javascript
   fs.writeFileSync('.bkit/runtime/cc-version.json', JSON.stringify({
     version,
     isOldVersion,
     detectedAt: new Date().toISOString(),
     ttlSeconds: 3600,
   }, null, 2));
   ```

**Edge cases**:
- `command -v claude` 미존재 → silent skip
- timeout 200ms 초과 → silent skip + OTEL emit (`duration_ms: 200`)
- semver parse 실패 → version = null + skip
- `.bkit/runtime/` 디렉토리 미존재 → ensureBkitDirs() (기존 함수) 호출

**Test cases (L2+L4)**:
- TC-F10-1: opt-out env 설정 시 detection skip 검증
- TC-F10-2: cache hit (mtime < 1h) — cache 사용 검증
- TC-F10-3: cache miss — fresh detection 실행
- TC-F10-4: mock `claude --version` returning "2.1.142" → `isOldVersion = true` + advisory set
- TC-F10-5: mock `claude --version` returning "2.1.143" → `isOldVersion = false` + advisory null
- TC-F10-6: mock timeout — silent skip + OTEL emit
- TC-F10-7: mock command not found — silent skip
- TC-F10-8: BKIT_CC_VERSION_ADVISORY env set 검증 (isOldVersion = true 시)
- TC-F10-9: additionalContext 문자열 advisory 포함 검증

### 3.5 Module F7: `release-plugin-tag.sh` Wire (ADR 0006)

**변경 지점**: line 82-83 사이 신규 step 추가

**Before** (line 80-85):
```bash
# ── 4. Run CI invariants (must pass) ─────────────────────────────────────
node scripts/check-trust-score-reconcile.js
node scripts/check-quality-gates-m1-m10.js
echo "[release]  OK  — CI invariants pass"
```

**After**:
```bash
# ── 4. Run CI invariants (must pass) ─────────────────────────────────────
node scripts/check-trust-score-reconcile.js
node scripts/check-quality-gates-m1-m10.js

# ── 4.1 ADR 0006 § Empirical Validation Gate ────────────────────────────
# v2.1.20: wire `claude plugin validate .` per ADR 0006.
# Reference: docs/adr/0006-cc-upgrade-policy.md § "Empirical Validation Gate"
# Reference: docs/adr/0011-plugin-manifest-schema-compliance.md § Decision
if command -v claude >/dev/null 2>&1; then
  echo "[release] invoking: claude plugin validate . (ADR 0006 Empirical Validation Gate)"
  if ! claude plugin validate .; then
    echo "[release] FAIL — claude plugin validate returned non-zero (ADR 0006 violation)" >&2
    exit 1
  fi
  echo "[release]  OK  — claude plugin validate passed (ADR 0006 § Empirical Validation Gate)"
else
  echo "[release] WARN — 'claude' CLI not on PATH; skipping ADR 0006 Empirical Validation Gate"
  echo "[release] WARN — recommended: install Claude Code v2.1.143+ before release"
fi

echo "[release]  OK  — CI invariants pass"
```

**Behavior**:
- ADR 0006 § Empirical Validation Gate 충족
- command -v claude 미존재 시 WARN + fallback (CI 환경 제약, 사용자 결정)
- Exit code 0 강제 (위반 시 exit 1)
- ADR 0006 § History append marker

**Test cases (L2)**:
- TC-F7-1: `bash scripts/release-plugin-tag.sh --dry-run` Exit 0 (claude CLI 존재 시)
- TC-F7-2: mock claude command 미존재 → WARN + fallback (Exit 0)
- TC-F7-3: mock `claude plugin validate` fail → Exit 1

### 3.6 Module F6: `contract-check.yml` Schema Validation Step

**변경 지점**: line 87 (Release Gate — docs-code-sync) 직후 신규 step 추가

**Before** (line 86-88):
```yaml
      - name: Release Gate — docs-code-sync (counts SoT drift detector)
        run: node test/contract/docs-code-sync.test.js

  contract-l5-e2e:
```

**After**:
```yaml
      - name: Release Gate — docs-code-sync (counts SoT drift detector)
        run: node test/contract/docs-code-sync.test.js

      # v2.1.20: Plugin manifest 21-key whitelist validation step.
      # Trigger: 정병진 (@bj) 2026-05-26 install incident
      # (Unrecognized key: "displayName" — CC ≤ v2.1.142 strict reject).
      # 1-week advisory only (continue-on-error: true), then strict from v2.1.21.
      - name: Release Gate — plugin.json schema validation (21-key whitelist)
        run: node scripts/validate-plugin.js --strict
        continue-on-error: true # v2.1.20: 1-week advisory only; v2.1.21+: false (strict)

  contract-l5-e2e:
```

**Behavior**:
- 1주 advisory only (`continue-on-error: true`)
- 2주차 (v2.1.21+) 강제 (`continue-on-error: false`)
- CHANGELOG.md `[2.1.21]` notes에 strict 전환 marker 명시

**Test cases (L2)**:
- TC-F6-1: contract-check CI run에서 신규 step 발화 + Exit 0 (bkit plugin.json 정합)
- TC-F6-2: 임시 `foo: 1` 추가 PR → advisory only (1주차) → Exit 2 (강제 전환 후)
- TC-F6-3: bkit-starter plugin 검증 면제 (별도 plugin, displayName 미포함) — 영향 0

### 3.7 Module F12: `config-sync.test.js` CS-015 보강

**변경 지점**: line 380-384

**Before**:
```javascript
// CS-015: plugin.json has required metadata fields
assert('CS-015',
  pluginJson?.name && pluginJson?.displayName && pluginJson?.description && pluginJson?.license,
  'plugin.json has name, displayName, description, license'
);
```

**After**:
```javascript
// CS-015: plugin.json has required metadata fields + 21-key whitelist (v2.1.20 F12)
const { diffPluginJsonKeys } = require('../../lib/domain/rules/docs-code-invariants');
const cs015Diff = diffPluginJsonKeys(pluginJson);
const cs015Extra = cs015Diff.filter((d) => d.status === 'extra');
assert('CS-015',
  pluginJson?.name &&
  pluginJson?.displayName &&
  pluginJson?.description &&
  pluginJson?.license &&
  cs015Extra.length === 0,
  `plugin.json has name + displayName + description + license + 21-key whitelist (extra keys: ${JSON.stringify(cs015Extra.map(d => d.key))})`
);
```

**Behavior**:
- 기존 displayName 명시적 요구 유지 (R3 Anti-Mission 강화)
- 21-key whitelist 추가 검증 (`diffPluginJsonKeys` import)
- extra keys 발견 시 fail + 상세 정보 출력

**Test cases (L2)**:
- TC-F12-1: bkit plugin.json 9 keys → CS-015 PASS
- TC-F12-2: displayName 누락 → CS-015 fail (기존 동작 유지)
- TC-F12-3: extra `foo: 1` 추가 → CS-015 fail (신규 검증)

### 3.8 Module F13: `test/e2e/cc-min-version.test.js`

**Public API**: E2E test

**Behavior** (단계별):
```javascript
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// TC-F13-1: mock CC v2.1.142 → BKIT_CC_VERSION_ADVISORY env set
function testCCv142Detection() {
  // Setup: mock `claude --version` via wrapper script
  const mockScript = path.join(__dirname, 'mock-claude-cli.sh');
  fs.writeFileSync(mockScript, '#!/usr/bin/env bash\necho "2.1.142"\n', { mode: 0o755 });
  process.env.PATH = `${path.dirname(mockScript)}:${process.env.PATH}`;
  // Run SessionStart hook
  const result = execSync('node hooks/session-start.js', { encoding: 'utf8' });
  // Assert: BKIT_CC_VERSION_ADVISORY env set in additionalContext
  assert(result.includes('bkit Compatibility Notice'), 'advisory should be set');
  assert(result.includes('2.1.142'), 'detected version should be present');
}

// TC-F13-2: mock CC v2.1.143 → no advisory
function testCCv143NoAdvisory() {
  // Setup: mock `claude --version` returning "2.1.143"
  // ... similar pattern
}

// TC-F13-3: mock command not found → silent skip
// TC-F13-4: mock timeout → silent skip + OTEL emit
// TC-F13-5: opt-out env set → detection skipped

// Run all
testCCv142Detection();
testCCv143NoAdvisory();
// ... etc.
```

**외부 dogfooder Lifecycle Stage 4 (Regression Lock)** — 정병진 reproduction script 흡수

### 3.9 Module F11: ADR 0011 (`docs/adr/0011-plugin-manifest-schema-compliance.md`)

**Structure**:
- § Header: title, status (Accepted), date (2026-05-26), context-anchor
- § Context: 정병진 incident + ADR 0003 위반 + ADR 0006 미이행
- § Decision: bkit minimum CC v2.1.143 + 21-key whitelist + claude plugin validate + R3-321 + SessionStart detection
- § Consequences: 외부 dogfooder lifecycle Stage 5 + 차별화 #2 강화 + 같은 incident 0건
- § Empirical Validation: SC1-SC8 + cc-version-researcher 88% 신뢰도 결론 인용
- § History: append-only — Anthropic 정책 변경 시 amend marker
- § Open Question: Q1 (Anthropic 모순) — bkit 측 해결 불가 명시

### 3.10 Module F14: Hall of Fame `docs/external-dogfooders/bj.md`

**Structure**:
```markdown
# @bj (정병진) — External Dogfooder #2

> Joined: 2026-05-26 (Issue Filed Stage 1)
> Status: Lifecycle Stage 5 (Public Acknowledge) — v2.1.20 GA
> Project: TBD (F3 회신 확인 후 추가)

## 5-stage User-Feedback Lifecycle Progress

| Stage | Status | Date | Artifact |
|-------|--------|------|----------|
| 1. Issue Filed | ✅ | 2026-05-26 | GH issue thread / 이메일 회신 |
| 2. Repro Test Absorbed | ✅ | (TBD) | F13 `test/e2e/cc-min-version.test.js` |
| 3. Fix Released | ✅ | (TBD v2.1.20 GA) | CHANGELOG `[2.1.20]` + F1 + F4 |
| 4. Regression Lock | ✅ | (TBD) | F8 R3-321 + F12 CS-015 보강 |
| 5. Public Acknowledge | ✅ | (TBD) | 본 entry |

## Contribution

- **Root cause discovery**: `Validation errors: : Unrecognized key: "displayName"` — install path strict reject
- **CC version reveal**: ≤ v2.1.142 (cc-version-researcher 88% 신뢰도 결론, Q2 회신 후 확정)
- **bkit response**:
  - F1: README + README-FULL minimum CC v2.1.143 advisory
  - F4: `docs/06-guide/cc-compatibility.guide.md` 신규 작성
  - F5: `scripts/validate-plugin.js --strict` 21-key whitelist (ENH-322)
  - F7: `scripts/release-plugin-tag.sh` claude plugin validate wire (ADR 0006 충족)
  - F8: `lib/cc-regression/registry.js` R3-321 entry (ENH-321)
  - F10: `hooks/startup/session-context.js` CC version detection (ENH-323)
  - F11: ADR 0011 Plugin Manifest Schema Compliance Policy

## bkit Sprint Impact

- Sprint ID: `v2120-marketplace-recovery` (v2.1.20 GA)
- 14 features (P0×4 / P1×5 / P2×5)
- 3 신규 ENH (ENH-321 / ENH-322 / ENH-323)
- 1 신규 ADR (0011)
- 차별화 #2 (Defense Layer 6) 강화

## Acknowledgement

본 entry는 bkit Early Adopter Program 정책 (v2.1.19 `docs/external-dogfooders/_README.md`) 따름. @pruge에 이은 외부 dogfooder #2.
```

---

## 4. Cross-Sprint Integration (★ 사용자 명시)

### 4.1 Sprint v2.1.14/17/18/19 연동 데이터 흐름

```
[v2.1.14 Differentiation Sprint]
  - 8-phase container + sprint-master-planner agent
  - 1st spawn dogfooding 완료 (2026-05-14)
        │
        ▼
[v2.1.17 CI/CD Hardening Sprint]
  - contract-check.yml baseline (5/12~5/20 contract red 8-day class close)
  - L1+L4 → L1+L2+L3+L4+L5 promotion
        │
        ▼
[v2.1.18 Carryover Cleanup Sprint]
  - 6 CO closed (sprint discipline baseline)
        │
        ▼
[v2.1.19 Quality Maturation Sprint]
  - 5 sub-sprints archived (2026-05-21)
  - S4 Proactive External Dogfooder Lifecycle 도입
  - @pruge first dogfooder entry (`docs/external-dogfooders/_README.md`)
  - ENH-318 차별화 7/7 정식 편입
        │
        ▼
[ADR 0003 + 0006 reference]
  - ADR 0003: Phase 1.5 Empirical Validation 의무 (2026-04-24)
  - ADR 0006: § Empirical Validation Gate 의무 (2026-04-28)
        │
        ▼
[v2.1.20 Marketplace Recovery Sprint (본 sprint)]
  - sprint-master-planner agent 2nd-cycle dogfooding
  - 외부 dogfooder #2 @bj entry (5-stage Lifecycle 첫 외부 트리거)
  - ADR 0003 위반 사례 회고 + ADR 0006 § Gate 미이행 회복
  - ADR 0011 신규 채택
  - 14 features + 3 ENH (321/322/323)
        │
        ▼
[v2.1.21+ Sprint (예정)]
  - F8 R3-321 telemetry 3-month 분석
  - F10 ENH-323 SessionStart detection telemetry 분석
  - F14 Hall of Fame @bj entry 후속 Stage 4 → Stage 5 정식 완료
  - Q5 미해결 — v2.1.142 이하 사용자 비율 trend
  - ADR 0011 amend (Anthropic 정책 변경 시)
```

### 4.2 본 sprint Output 매트릭스 (v2.1.21+ 활용)

| 본 sprint 산출 | v2.1.21+ 활용 | 활용 종류 |
|--------------|--------------|---------|
| F1 README advisory | (read-only baseline) | 사용자 진입 안내 baseline |
| F2 marketplace metadata | (read-only baseline) | metadata 정합 baseline |
| F4 cc-compatibility.guide.md | (보강) | 사용자 self-service 문서 보강 |
| F5 validate-plugin.js --strict | (CI gate 강제 전환) | 2주차부터 continue-on-error: false |
| F6 contract-check.yml step | (CI gate 강제 전환) | 위 동일 |
| F7 release-plugin-tag.sh wire | (release infrastructure) | 모든 후속 release에서 활용 |
| F8 R3-321 entry | telemetry 3-month 분석 | 격하/유지 결정 |
| F9 EXPECTED_PLUGIN_JSON_KEYS SoT | (Domain Layer baseline) | 다른 plugin schema 변경 시 활용 |
| F10 SessionStart detection | telemetry 3-month 분석 | 격하/유지 결정 |
| F11 ADR 0011 | (정책 baseline) | Anthropic 정책 변경 시 amend |
| F12 CS-015 보강 | (regression lock) | 영구 유지 |
| F13 E2E v2.1.142 simulation | (regression lock) | 영구 유지 |
| F14 Hall of Fame @bj entry | (dogfooder #2) | dogfooder #3+ 유입 baseline |

### 4.3 Cross-Layer Integration

| Layer | F# | Layer 간 데이터 흐름 |
|-------|---|------------------|
| Domain | F9 | `EXPECTED_PLUGIN_JSON_KEYS` (pure, no FS) → Presentation (F5) + Test (F12) |
| Domain | F8 | R3-321 entry → cc-regression reconcile cycle (Infra) |
| Presentation | F5 | `--strict` CLI flag → CI (F6) |
| Presentation | F7 | `release-plugin-tag.sh` → Release infrastructure (ADR 0006) |
| Presentation | F10 | `detectCCVersion()` → BKIT_CC_VERSION_ADVISORY env → additionalContext (Application) |
| CI/CD | F6 | `validate-plugin.js --strict` step → PR gate |
| Test | F12 | `diffPluginJsonKeys` (Domain) → CS-015 보강 |
| Test | F13 | mock `claude --version` → F10 SessionStart hook 검증 |
| Documentation | F1, F2, F4, F11, F14 | (Layer 무관, cross-link) |

---

## 5. ENH-292 Sequential Dispatch 자기적용

### 5.1 본 sprint에서 ENH-292 활용 use case

| Use case | Sequential 위치 | 이유 |
|---------|---------------|------|
| **PRD 생성** | Sub-sprint 1 PRD phase entry | 본 sprint 첫 spawn 1회 — cache miss 후 cache hit 정착 시점 sequential 강제 |
| **Plan 생성** | Sub-sprint 1 Plan phase entry | PRD 결과 cache hit 활용 — sequential 강제 (caching 10x mitigation) |
| **Design 생성 (본 문서)** | Sub-sprint 1 Design phase entry | Plan 결과 cache hit 활용 |
| **Sub-sprint 2 Design entry** | Sub-sprint 2 Design phase entry | Sub-sprint 1 산출물 cache hit |
| **Sub-sprint 3 Design entry** | Sub-sprint 3 Design phase entry | Sub-sprint 2 산출물 cache hit |
| **Report 생성** | Each sub-sprint Report phase entry | cumulative cache 활용 |
| **Sprint 종합 Report** | Sprint Archived phase entry | 전 sprint cumulative cache 활용 |

### 5.2 ENH-292 효과 측정 (본 sprint 자가검증)

- **cache hit rate target**: 4% → 40% (v2.1.14 KPI K1 기준)
- **본 sprint 측정 방법**:
  - `lib/orchestrator/cache-cost-analyzer.js` OTEL trace 수집
  - 각 sub-sprint phase entry 시 cache hit rate 기록
  - Sprint Report에 누적 그래프 포함
- **본 sprint K1 자가검증**:
  - K1 분석 대상: PRD + Plan + Design + Iterate + QA + Report 6 phases × 3 sub-sprints = 18 entry points
  - cache hit 정착 시점: sub-sprint 1 종결 후 (D2 EOD)
  - Sub-sprint 2 + 3 = 12 entry points cache hit 활용

### 5.3 ENH-292 dogfooding marker

- 본 sprint = sprint-master-planner agent 2nd-cycle dogfooding (v2.1.14 1st spawn 이후 6번째 sprint container)
- 첫 spawn 대비 cache hit rate 안정성 검증 의무
- Sprint Report § Dogfooding 자가평가 section 명시

---

## 6. Test Plan Matrix L1-L5

### 6.1 L1 Unit

| TC ID | Coverage | File | 검증 |
|-------|---------|------|-----|
| **TC-F9-1** | `EXPECTED_PLUGIN_JSON_KEYS` 21 keys 정합 | `lib/domain/rules/docs-code-invariants.test.js` (확장) | array length === 21 + Object.frozen |
| **TC-F9-2** | `diffPluginJsonKeys` — extra key 검증 | 동일 | `{foo: 1}` → `[{key: 'foo', status: 'extra'}]` |
| **TC-F9-3** | `diffPluginJsonKeys` — null 입력 | 동일 | invalid status 반환 |
| **TC-F9-4** | `diffPluginJsonKeys` — empty 입력 | 동일 | empty array 반환 |
| **TC-F9-5** | `diffPluginJsonKeys` — 모든 21 keys | 동일 | extra 0건 |
| **TC-F5-1** | `validate-plugin.js` 기존 호환 | `scripts/validate-plugin.test.js` (확장) | Exit 0 (bkit 정합) |
| **TC-F5-2** | `--strict` 기본 통과 | 동일 | Exit 0 (bkit 9 keys 모두 21-key 내) |
| **TC-F5-3** | `--strict` extra key fail | 동일 | Exit 2 (`foo: 1` 추가 시) |
| **TC-F5-4** | `--strict --verbose` 출력 | 동일 | 21 keys 각 상태 표시 |
| **TC-F5-5** | SoT import 실패 | 동일 | Exit 3 (mock fail) |
| **TC-F10-1** | opt-out env detection skip | `hooks/startup/session-context.test.js` (확장) | source = 'skipped' |
| **TC-F10-2** | cache hit | 동일 | source = 'cache' |
| **TC-F10-3** | cache miss → fresh | 동일 | source = 'fresh' |
| **TC-F10-4** | v2.1.142 → isOldVersion = true | 동일 | env set + advisory present |
| **TC-F10-5** | v2.1.143 → isOldVersion = false | 동일 | env unset + advisory null |
| **TC-F10-6** | timeout silent skip | 동일 | version = null + OTEL emit |
| **TC-F10-7** | command not found | 동일 | silent skip |
| **TC-F10-8** | BKIT_CC_VERSION_ADVISORY env set | 동일 | env set 정합 |
| **TC-F10-9** | additionalContext advisory | 동일 | string includes "bkit Compatibility Notice" |

### 6.2 L2 Integration

| TC ID | Coverage | File | 검증 |
|-------|---------|------|-----|
| **TC-F8-1** | registry.js 22 entries 정합 | `lib/cc-regression/registry.test.js` (확장) | length === 22 + R3-321 id present |
| **TC-F8-2** | R3-321 id unique | 동일 | no duplicate ids |
| **TC-F8-3** | regression-rules-checker PASS | `scripts/check-guards.js` CI step | Exit 0 |
| **TC-F8-4** | reconcile cycle PASS | `.github/workflows/cc-regression-reconcile.yml` next run | artifact 정합 |
| **TC-F7-1** | release-plugin-tag.sh dry-run | `scripts/release-plugin-tag.test.js` | Exit 0 (claude CLI 존재 시) |
| **TC-F7-2** | claude command 미존재 fallback | 동일 | WARN + Exit 0 |
| **TC-F7-3** | claude plugin validate fail | 동일 | Exit 1 |
| **TC-F6-1** | contract-check 신규 step run | CI run (PR) | step 발화 + Exit 0 |
| **TC-F6-2** | 강제 전환 후 fail | CI run (2주차) | Exit 2 (advisory only 종료) |
| **TC-F6-3** | bkit-starter 면제 | (별도 plugin 영향 0 확인) | 영향 0 |
| **TC-F12-1** | bkit plugin.json 9 keys → CS-015 PASS | `test/integration/config-sync.test.js` (보강) | assert PASS |
| **TC-F12-2** | displayName 누락 → CS-015 fail | 동일 | assert fail |
| **TC-F12-3** | extra key 시 CS-015 fail | 동일 | assert fail |

### 6.3 L3 Contract / Cross-Sprint Integration ★

| TC ID | Coverage | File | 검증 |
|-------|---------|------|-----|
| **TC-L3-1** | check-domain-purity 통과 | `scripts/check-domain-purity.js` | F9 pure domain 검증 |
| **TC-L3-2** | regression-rules-checker R3-321 통합 | `scripts/check-guards.js` | F8 entry 정합 |
| **TC-L3-3** | docs-code-sync 정합 | `scripts/docs-code-sync.js` | F1+F4 docs ↔ EXPECTED_COUNTS 정합 |
| **TC-L3-4** | Cross-Sprint 영향 0건 | `scripts/docs-code-scanner.js` | v2.1.14/17/18/19 산출 손상 0건 |
| **TC-L3-5** | invariants 보존 | (multi-script) | EXPECTED_COUNTS / EXPECTED_*_NAMES / EXPECTED_PLUGIN_JSON_KEYS 모두 Object.frozen |
| **TC-L3-6** | ADR 0003 + 0006 cross-link | `docs/adr/0011-*.md` review | ADR cross-link 정합 |
| **TC-L3-7** | sprint-master-planner 2nd-cycle dogfooding | `docs/sprint/v2120-*/` 산출 review | 본 master plan + PRD + Plan + Design 모두 작성 |

### 6.4 L4 E2E (선택)

| TC ID | Coverage | File | 검증 |
|-------|---------|------|-----|
| **TC-F13-1** | mock CC v2.1.142 → advisory set | `test/e2e/cc-min-version.test.js` | additionalContext includes "bkit Compatibility Notice" |
| **TC-F13-2** | mock CC v2.1.143 → no advisory | 동일 | additionalContext no advisory |
| **TC-F13-3** | mock command not found | 동일 | silent skip |
| **TC-F13-4** | mock timeout | 동일 | silent skip + OTEL emit |
| **TC-F13-5** | opt-out env | 동일 | detection skip |
| **TC-E2E-Sprint** | Sprint v2.1.20 종결 검증 | `test/e2e/sprint-v2120-recovery.test.js` (선택) | 14 features 모두 archived + KPI K1-K10 충족 |

### 6.5 L5 Performance (선택)

| TC ID | Coverage | File | 검증 |
|-------|---------|------|-----|
| **TC-L5-1** | F10 detectCCVersion duration | `test/e2e/cc-min-version.test.js` | `gen_ai.cc_version_detection_ms` < 200ms |
| **TC-L5-2** | F5 validate-plugin --strict overhead | `scripts/validate-plugin.test.js` | < 100ms 추가 |
| **TC-L5-3** | F6 contract-check.yml step duration | CI run | < 5초 추가 |
| **TC-L5-4** | cache hit rate ENH-292 자가검증 | `lib/orchestrator/cache-cost-analyzer.js` OTEL | sub-sprint 2+3 hit rate ≥ 40% |

---

## 7. Quality Gates Activation

### 7.1 Phase 진행 시 활성 매트릭스

| Gate | PRD | Plan | Design | Do | Iterate | QA | Report | Archived |
|------|:---:|:----:|:------:|:--:|:-------:|:--:|:------:|:--------:|
| **M1** matchRate | - | - | - | - | ≥90 | - | - | locked |
| **M2** code-quality | - | - | - | ≥80 | - | - | - | locked |
| **M3** criticalIssueCount | - | - | - | =0 | - | =0 | - | locked |
| **M4** designCompleteness | - | - | ≥85 | - | - | - | - | locked |
| **M5** testCoverage | - | - | - | ≥70 | - | - | - | locked |
| **M6** dependencyHealth | - | - | - | warn | - | - | - | locked |
| **M7** docCoverage | - | - | - | ≥80 | - | - | - | locked |
| **M8** sectionCompleteness | ≥85 | ≥85 | ≥85 | - | - | - | - | locked |
| **M9** regressionMatch | - | - | - | - | - | =0 | - | locked |
| **M10** reportCompleteness | - | - | - | - | - | - | ≥85 | locked |
| **S1** dataFlowIntegrity | - | - | - | - | - | =100 | - | locked |
| **S2** featureCompletion | - | - | - | - | - | - | =100 | locked |
| **S3** sprintCycleTime | - | - | - | - | - | - | budget | locked |
| **S4** crossSprintIntegrity | - | - | - | - | - | - | =0 | locked |

### 7.2 본 Design Phase Gate 목표 (M4 + M8 ≥ 85)

- **M4 designCompleteness**: 9-section spec coverage (§ 0-9, 본 문서) ≥ 85
  - 본 문서 9 sections (§0 Context Anchor / §1 코드베이스 분석 / §2 Module 구조 + Order / §3 Module 상세 spec / §4 Cross-Sprint Integration / §5 ENH-292 자기적용 / §6 Test Plan Matrix L1-L5 / §7 Quality Gates Activation / §8 Risks / §9 Design 완료 Checklist)
  - target ≥ 85% coverage
- **M8 sectionCompleteness**: PRD/Plan/Design 9-section
  - PRD (10 sections) — `docs/sprint/v2120-marketplace-recovery/prd.md`
  - Plan (10 sections) — `docs/sprint/v2120-marketplace-recovery/plan.md`
  - Design (10 sections, 본 문서)
  - target ≥ 85% coverage

---

## 8. Risks (PRD/Plan + Design specific)

### 8.1 Design Phase 신규 발견 Risks

| Risk | Likelihood | Severity | Mitigation |
|------|:---------:|:--------:|-----------|
| **D1** F9 SoT module export 충돌 — 기존 `EXPECTED_COUNTS` + `EXPECTED_*_NAMES` 패턴과 신규 `EXPECTED_PLUGIN_JSON_KEYS` 명명 충돌 가능성 | Low | M | (a) 명명 패턴 답습 (`EXPECTED_*`) / (b) module.exports에 신규 두 export 추가만 (line 122-132) / (c) backward compat 검증 (기존 export 모두 유지) |
| **D2** F10 SessionStart hook ordering — 기존 9 modules (migration / restore / contextInit / onboarding / sessionCtx / dashboard / workflowMap / controlPanel / staleDetect) 와 신규 `detectCCVersion()` 순서 충돌 | Low | M | (a) `sessionCtx` 직전 또는 직후 위치 (additionalContext 빌더 직전) / (b) opt-out env 즉시 체크로 ordering 부작용 최소화 / (c) L2 integration test로 ordering 검증 |
| **D3** F8 R3-321 entry `affectedFiles` 정합 — registry.js에 file 명시 시 향후 file rename 시 stale link | Medium | L | (a) affectedFiles 보수적 명시 (가장 핵심 4개만) / (b) cc-regression reconcile cycle file 존재 검증 추가 / (c) docs-code-sync.js에서 stale link 감지 |
| **D4** F11 ADR 0011 cross-link 정합 — ADR 0003 + 0006 reference 시 stale link 가능성 | Low | L | (a) link format 표준 (`docs/adr/0003-*.md`) / (b) docs-code-sync CI step에서 verify / (c) ADR 0011 § History에 cross-link 의존성 명시 |
| **D5** F13 E2E mock 안정성 — `claude --version` mock 시 PATH 조작이 다른 test와 충돌 | Medium | M | (a) test isolation (각 test 별 process.env.PATH 백업/복원) / (b) mock script 임시 디렉토리 사용 (Date.now() prefix) / (c) afterAll cleanup |
| **D6** F6 contract-check step continue-on-error 전환 timing — 1주차 advisory only → 2주차 strict 전환 시점 누락 | Low | M | (a) CHANGELOG.md `[2.1.21]` notes에 명시 / (b) sprint v2.1.21 sprint init 시 자동 reminder / (c) ADR 0011 § History append marker |

### 8.2 Design 검증 Risks (PRD/Plan 보존)

| Risk | Origin | 본 Design 강화 |
|------|-------|--------------|
| R1 Q2 정병진 CC 버전 미확정 | PRD § 8 | F13 mock simulation으로 다중 root cause 커버 |
| R2 Q1 Anthropic 모순 | PRD § 8 | F11 ADR 0011 § Open Question 명시 |
| R3 displayName 회귀 | PRD § 8 | F12 CS-015 보강 + F5 displayName missing fail |
| R4 SessionStart overhead | PRD § 8 | F10 timeout 200ms + cache 1h + opt-out env |
| R5 SoT 충돌 | PRD § 8 | F9 Object.freeze + check-domain-purity CI |
| R6 진입장벽 | PRD § 8 | F4 cc-compatibility.guide.md workaround 명시 |
| R7 reconcile 안정성 | PRD § 8 | F8 기존 21 entries 패턴 답습 |
| R8 dogfooder abuse | PRD § 8 | 5-stage Lifecycle 강제 |
| R9 CI false-positive | PRD § 8 | F6 1주 advisory only + 2주차 strict |

---

## 9. Design 완료 Checklist

- [x] Context Anchor 보존 (PRD §0 + Plan §0 일치) — § 0
- [x] 코드베이스 분석 (9 file 깊이 분석, file:line 명시) — § 1
  - [x] `scripts/validate-plugin.js` line 264-272 (name+version만)
  - [x] `scripts/release-plugin-tag.sh` line 82-83 (check-trust-score + check-quality-gates만)
  - [x] `lib/cc-regression/registry.js` 21 entries (plugin manifest guard 0건)
  - [x] `lib/domain/rules/docs-code-invariants.js` line 1-132 (EXPECTED_COUNTS + names only)
  - [x] `test/integration/config-sync.test.js` CS-015 line 380-384
  - [x] `.github/workflows/contract-check.yml` line 1-109 (schema validation 없음)
  - [x] `hooks/startup/session-context.js` 429 lines (CC version detection 없음)
  - [x] `.claude-plugin/plugin.json` line 1-20 (9 keys 모두 21-key 내)
  - [x] `.claude-plugin/marketplace.json` line 11-62 (bkit entry 8 keys)
- [x] 의존성 매트릭스 + 변경 금지 invariant 명시 — § 1.2
- [x] Module 구조 (파일 트리 + Implementation Order Leaf-first) — § 2
- [x] Module 상세 spec (각 file 9개 모두 Header + Public API + Behavior + Edge cases + Test cases) — § 3
  - [x] F9 SoT spec
  - [x] F5 validate-plugin --strict spec
  - [x] F8 R3-321 entry spec
  - [x] F10 detectCCVersion() spec
  - [x] F7 release-plugin-tag.sh wire spec
  - [x] F6 contract-check.yml step spec
  - [x] F12 CS-015 보강 spec
  - [x] F13 E2E test spec
  - [x] F11 ADR 0011 structure
  - [x] F14 Hall of Fame @bj structure
- [x] Cross-Sprint Integration (★) (v2.1.14/17/18/19 → v2.1.20 → v2.1.21+) — § 4
- [x] ENH-292 Sequential Dispatch 자기적용 — § 5
- [x] Test Plan Matrix L1-L5 (Unit 19 + Integration 12 + Contract 7 + E2E 5 + Performance 4 = 47 TC) — § 6
- [x] Quality Gates Activation (Phase별 매트릭스 + Design Phase 목표 M4 + M8 ≥ 85) — § 7
- [x] Risks (Design Phase 신규 D1-D6 + PRD/Plan 보존 R1-R9) — § 8

### 9.1 Verified 사실 출처 (file:line 또는 docs URL) — 재확인

- ✅ `scripts/validate-plugin.js` line 256-279 — `validatePluginJson()` name+version만 (실측)
- ✅ `scripts/release-plugin-tag.sh` line 82-83 — `node scripts/check-trust-score-reconcile.js + check-quality-gates-m1-m10.js`만 (실측)
- ✅ `lib/cc-regression/registry.js` 21 entries (실측 line 22-162, closing line 163)
- ✅ `lib/domain/rules/docs-code-invariants.js` line 1-132 — `EXPECTED_COUNTS` (line 19-26) + `EXPECTED_*_NAMES` (line 48-98) + `diffCounts` (line 100-120) + `module.exports` (line 122-132) (실측)
- ✅ `test/integration/config-sync.test.js` CS-015 line 380-384 — displayName 명시적 요구 (실측)
- ✅ `.github/workflows/contract-check.yml` line 1-109 — plugin schema validation step 없음, line 86-87 docs-code-sync 마지막 step (실측)
- ✅ `hooks/startup/session-context.js` 429 lines — CC version detection 0 hit (실측 `grep "cc.*version|claude.*--version|CC_VERSION|advisor"`)
- ✅ `.claude-plugin/plugin.json` 9 keys (`name`, `version`, `displayName`, `description`, `author`, `repository`, `license`, `keywords`, `outputStyles`) (실측 line 1-20)
- ✅ `.claude-plugin/marketplace.json` bkit entry 8 keys + bkit-starter entry displayName 미포함 (실측 line 11-62)
- ✅ `docs/adr/0010-effort-aware-invariant.md` 존재 → 다음 0011 (실측)
- ✅ `docs/external-dogfooders/_README.md` line 57-60 — @pruge first dogfooder, dogfooder #2 entry 신규 정책 (실측)
- ✅ `docs/03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md` — cc-version-researcher 88% 신뢰도 결론

### 9.2 미해결 의문점 (Q1-Q5 + Design Phase 신규 D1-D6) — 솔직히 명시

- ⚠️ **Q1** docs vs 구현 lenient/strict 모순 (Anthropic 책임, bkit 해결 불가)
- ⚠️ **Q2** 정병진 CC 버전 미확정 (F3 회신 대기)
- ✅ **Q3** partially resolved (2026-05-26 CO-4 patch): Anthropic dateless CHANGELOG + Releasebot 2026-05-15 proxy
- ⚠️ **Q4** marketplace.json `requirements.claudeCode` spec (F2 Do 진입 시 schema 조회)
- ⚠️ **Q5** v2.1.142 이하 사용자 비율 (post-release 모니터)
- ⚠️ **D1** F9 SoT module export 명명 충돌 (mitigation: 명명 패턴 답습)
- ⚠️ **D2** F10 SessionStart hook ordering (mitigation: sessionCtx 직전/직후)
- ⚠️ **D3** F8 affectedFiles stale link (mitigation: 보수적 명시)
- ⚠️ **D4** F11 ADR cross-link 정합 (mitigation: docs-code-sync verify)
- ⚠️ **D5** F13 E2E mock test isolation (mitigation: 임시 디렉토리)
- ⚠️ **D6** F6 continue-on-error 전환 timing (mitigation: CHANGELOG marker)

### 9.3 Design Phase 결정 Summary

- **Leaf-first 원칙**: F9 (Domain SoT) → F5 (Presentation validator) → F8 (Domain entry) → F6 (CI step) → F7 (Release wire) → F10 (Presentation hook) → F11 (ADR) → F12 (Test 보강) → F13 (E2E) → F14 (Documentation)
- **변경 금지 invariant**: EXPECTED_COUNTS / EXPECTED_*_NAMES / diffCounts / 21 existing cc-regression entries / pure domain (no FS) / Object.freeze
- **신규 invariant**: EXPECTED_PLUGIN_JSON_KEYS 21 keys (Object.freeze)
- **Cross-Sprint Integration**: v2.1.14 dogfooding 계승 + v2.1.19 외부 dogfooder Lifecycle 적용 + v2.1.21+ telemetry baseline
- **ENH-292 자기적용**: sub-sprint 2+3 12 entry points cache hit 활용 (4% → 40% target)
- **Test Plan**: 47 TC (L1×19 + L2×12 + L3×7 + L4×5 + L5×4)

---

**Next Phase**: Phase 4 Do — Implementation (leaf-first → orchestrator-last). Sub-sprint 1 Recovery (P0×4) → Sub-sprint 2 Defense (P1×5) → Sub-sprint 3 Forward-proofing (P2×5). 

**Do Phase 시작 시 권장사항**:
1. **F3 정병진 회신 메일 (HOT) 즉시 출고** — D1 AM 12:00 KST 이전, 외부 dogfooder Lifecycle Stage 1→2 진행
2. **F9 (Domain SoT) 가장 먼저** — Leaf module, 후속 F5/F12 의존
3. **L1 Unit test 동시 작성** — 각 module spec과 함께 (TDD-like)
4. **L2 Integration test 매 sub-sprint 종결 시 확인** — M9 regressionMatch =0 강제
5. **ENH-292 Sequential Dispatch 자기적용** — sub-sprint 2 + 3 cache hit 활용 검증
6. **Sub-sprint 종결 시 자동 audit_logger record** — sprint-orchestrator 통합 검증
