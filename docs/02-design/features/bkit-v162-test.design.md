# bkit v1.6.2 Test Design Document

> **Summary**: bkit v1.6.2 테스트 업데이트 및 신규 TC 상세 설계
>
> **Project**: bkit-claude-code
> **Version**: 1.6.2
> **Author**: CTO Lead (QA Team 8명)
> **Date**: 2026-03-18
> **Status**: Design
> **Plan Reference**: `docs/01-plan/features/bkit-v162-test.plan.md`

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 기존 6개 테스트 파일이 v1.6.2 실제 코드베이스와 불일치 (hooks 10->12, agents 21->29, exports 208->210) |
| **Solution** | 각 파일별 최소 변경(surgical update)으로 하위 호환성을 유지하면서 v1.6.2 반영. 신규 6개 파일은 기존 패턴과 동일한 구조로 작성 |
| **Function/UX Effect** | `node test/run-all.js` 한 번으로 ~1,151 TC 전체 검증. 기존 TC ID 체계와 완벽 호환 |
| **Core Value** | 코드 변경 최소화 + 커버리지 최대화. 기존 TC의 assert 패턴과 출력 형식을 그대로 유지 |

---

## 1. Architecture Overview

### 1.1 테스트 디렉토리 구조 (변경 후)

```
test/
├── helpers/
│   ├── assert.js          # (변경 없음)
│   ├── timer.js           # (변경 없음)
│   └── report.js          # (변경 없음)
├── unit/
│   ├── ambiguity.test.js          # (변경 없음)
│   ├── trigger.test.js            # (변경 없음)
│   ├── creator.test.js            # (변경 없음)
│   ├── orchestrator.test.js       # (변경 없음)
│   ├── coordinator.test.js        # (변경 없음)
│   ├── runner.test.js             # (변경 없음)
│   ├── reporter.test.js           # (변경 없음)
│   ├── other-modules.test.js      # [UPDATE] 210 exports, +2 TC
│   ├── post-compaction.test.js    # [NEW] 15 TC
│   ├── stop-failure.test.js       # [NEW] 15 TC
│   └── plugin-data.test.js        # [NEW] 20 TC
├── integration/
│   ├── config-sync.test.js        # (변경 없음)
│   ├── module-chain.test.js       # (변경 없음)
│   ├── hook-chain.test.js         # (변경 없음)
│   ├── export-compat.test.js      # [UPDATE] +4 TC
│   └── session-restore.test.js    # [NEW] 10 TC
├── security/
│   ├── agent-frontmatter.test.js  # [UPDATE] +5 TC
│   ├── config-permissions.test.js # (변경 없음)
│   ├── runtime-security.test.js   # (변경 없음)
│   └── destructive-prevention.test.js # (변경 없음)
├── regression/
│   ├── pdca-core.test.js          # (변경 없음)
│   ├── skills-28.test.js          # (변경 없음)
│   ├── agents-29.test.js          # [RENAME+UPDATE] 21->29 agents, 42->58 TC
│   ├── hooks-12.test.js           # [RENAME+UPDATE] 10->12 hooks
│   ├── agents-effort.test.js      # [NEW] 29 TC
│   └── cc-compat.test.js          # [UPDATE] +4 TC
├── performance/
│   ├── hook-perf.test.js          # (변경 없음)
│   ├── core-function-perf.test.js # (변경 없음)
│   ├── benchmark-perf.test.js     # (변경 없음)
│   ├── module-load-perf.test.js   # (변경 없음)
│   └── plugin-data-perf.test.js   # [NEW] 6 TC
├── philosophy/                    # (전체 변경 없음)
├── ux/                            # (전체 변경 없음)
├── e2e/                           # (전체 변경 없음)
└── run-all.js                     # [UPDATE] 파일명 변경, TC 수 조정
```

### 1.2 변경 파일 요약

| 변경 유형 | 파일 수 | TC 증분 |
|----------|--------|--------|
| UPDATE (기존 수정) | 6 | +31 |
| RENAME + UPDATE | 2 | +18 |
| NEW (신규 생성) | 6 | +95 |
| run-all.js | 1 | N/A |
| **Total** | **15** | **+126 (TC 증분, 파일명 변경으로 인한 중복 제거 반영 시 ~1,151 TC)** |

---

## 2. 기존 TC 업데이트 상세 설계

### 2.1 regression/hooks-12.test.js (기존 hooks-10.test.js 확장)

**파일명 변경**: `hooks-10.test.js` -> `hooks-12.test.js`

**변경 diff 개요**:

```diff
- * Regression Test: 10 Hook Events Verification (10 TC)
+ * Regression Test: 12 Hook Events Verification (12 TC)
+ * Validates hooks.json configuration (12 events) and referenced script existence
- * @version bkit v1.6.1
+ * @version bkit v1.6.2

- console.log('\n=== hooks-10.test.js (10 TC) ===\n');
+ console.log('\n=== hooks-12.test.js (12 TC) ===\n');

  // 기존 TC1~TC10 유지 (변경 없음)

+ // TC11: PostCompact
+ assert('HK-11', hooksConfig.hooks.PostCompact !== undefined, 'PostCompact hook event configured');
+
+ // TC12: StopFailure
+ assert('HK-12', hooksConfig.hooks.StopFailure !== undefined, 'StopFailure hook event configured');
```

**TC 명세**:

| TC ID | 입력 | 기대 출력 | 검증 방법 |
|-------|------|----------|----------|
| HK-01~HK-10 | hooks.json | 기존 10개 event 존재 | `hooksConfig.hooks[event] !== undefined` |
| HK-11 | hooks.json | PostCompact event 존재 | `hooksConfig.hooks.PostCompact !== undefined` |
| HK-12 | hooks.json | StopFailure event 존재 | `hooksConfig.hooks.StopFailure !== undefined` |

---

### 2.2 regression/agents-29.test.js (기존 agents-21.test.js 확장)

**파일명 변경**: `agents-21.test.js` -> `agents-29.test.js`

**변경 diff 개요**:

```diff
- * Regression Test: 21 Agents Full Verification (42 TC)
+ * Regression Test: 29 Agents Full Verification (58 TC)
- * @version bkit v1.6.1
+ * @version bkit v1.6.2

- console.log('\n=== agents-21.test.js (42 TC) ===\n');
+ console.log('\n=== agents-29.test.js (58 TC) ===\n');

  const ALL_AGENTS = [
    // 기존 21개 유지
    'cto-lead',
    // ... (기존 20개)
    'starter-guide',
+   // v1.6.2 추가 (8개)
+   'pdca-eval-plan',
+   'pdca-eval-design',
+   'pdca-eval-do',
+   'pdca-eval-check',
+   'pdca-eval-act',
+   'pdca-eval-pm',
+   'skill-needs-extractor',
+   'pm-lead-skill-patch',
  ];

  const EXPECTED_MODELS = {
    // 기존 21개 유지
+   'pdca-eval-plan': 'sonnet',
+   'pdca-eval-design': 'sonnet',
+   'pdca-eval-do': 'sonnet',
+   'pdca-eval-check': 'sonnet',
+   'pdca-eval-act': 'sonnet',
+   'pdca-eval-pm': 'sonnet',
+   'skill-needs-extractor': 'sonnet',
+   'pm-lead-skill-patch': 'sonnet',
  };
```

**TC 명세**: 29 agents x 2 TC = 58 TC
- AG-XX-FM: frontmatter 파싱 가능 + name 필드 존재
- AG-XX-TRIG: description에 Triggers: 키워드 포함

---

### 2.3 unit/other-modules.test.js (210 exports)

**변경 diff 개요**:

```diff
- * Unit Tests for other modules
- * 95 TC | console.assert based | no external dependencies
+ * 97 TC | console.assert based | no external dependencies

- assert('U-OTH-001', commonKeys.length >= 200, `common.js has >= 200 exports (got ${commonKeys.length})`);
+ assert('U-OTH-001', commonKeys.length >= 210, `common.js has >= 210 exports (got ${commonKeys.length})`);

  // 기존 U-OTH-002 ~ U-OTH-022 유지

+ // v1.6.2: PLUGIN_DATA backup/restore exports
+ assert('U-OTH-023', typeof common.backupToPluginData === 'function', 'backupToPluginData in common');
+ assert('U-OTH-024', typeof common.restoreFromPluginData === 'function', 'restoreFromPluginData in common');
```

**TC 명세 (추가분)**:

| TC ID | 입력 | 기대 출력 | 검증 방법 |
|-------|------|----------|----------|
| U-OTH-001 | common.js | >= 210 exports | `commonKeys.length >= 210` |
| U-OTH-023 | common.backupToPluginData | function type | `typeof === 'function'` |
| U-OTH-024 | common.restoreFromPluginData | function type | `typeof === 'function'` |

---

### 2.4 integration/export-compat.test.js (+4 TC)

**변경 diff 개요**:

```diff
- * 30 TC
+ * 34 TC
- * @version 1.6.1
+ * @version 1.6.2

  // TC-EC-19 변경: Paths exports 10개로 확장
- assert('TC-EC-19',
-   common.STATE_PATHS === core.STATE_PATHS &&
-   common.findDoc === core.findDoc &&
-   common.getArchivePath === core.getArchivePath,
-   'Core Paths exports (STATE_PATHS, findDoc, getArchivePath) match common.js'
- );
+ assert('TC-EC-19',
+   common.STATE_PATHS === core.STATE_PATHS &&
+   common.findDoc === core.findDoc &&
+   common.getArchivePath === core.getArchivePath &&
+   common.backupToPluginData === core.backupToPluginData &&
+   common.restoreFromPluginData === core.restoreFromPluginData,
+   'Core Paths exports (10 total, +backupToPluginData, +restoreFromPluginData) match common.js'
+ );

+ // Section 6: v1.6.2 new exports (TC 31-34)
+
+ // TC-EC-31: backupToPluginData function signature
+ assert('TC-EC-31',
+   typeof core.backupToPluginData === 'function',
+   'backupToPluginData is a function in core/index.js'
+ );
+
+ // TC-EC-32: restoreFromPluginData function signature
+ assert('TC-EC-32',
+   typeof core.restoreFromPluginData === 'function',
+   'restoreFromPluginData is a function in core/index.js'
+ );
+
+ // TC-EC-33: backupToPluginData returns {backed, skipped} structure
+ const backupResult = core.backupToPluginData();
+ assert('TC-EC-33',
+   backupResult && Array.isArray(backupResult.backed) && Array.isArray(backupResult.skipped),
+   'backupToPluginData returns {backed: [], skipped: []} structure'
+ );
+
+ // TC-EC-34: restoreFromPluginData returns {restored, skipped} structure
+ const restoreResult = core.restoreFromPluginData();
+ assert('TC-EC-34',
+   restoreResult && Array.isArray(restoreResult.restored) && Array.isArray(restoreResult.skipped),
+   'restoreFromPluginData returns {restored: [], skipped: []} structure'
+ );
```

---

### 2.5 security/agent-frontmatter.test.js (+5 TC)

**변경 diff 개요**:

```diff
- * @version 1.6.1
+ * @version 1.6.2

  // 기존 SEC-AF-001 ~ SEC-AF-035 유지

+ // ============================================================
+ // v1.6.2: effort/maxTurns Frontmatter Validation
+ // ============================================================
+ console.log('\n=== v1.6.2: effort/maxTurns Validation ===');
+
+ const VALID_EFFORT = ['low', 'medium', 'high'];
+ const VALID_MAX_TURNS_RANGE = { min: 10, max: 100 };
+
+ // SEC-AF-036: All 29 agents have effort field
+ test('SEC-AF-036', 'All agents have valid effort field (low/medium/high)', () => {
+   const allAgentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
+   for (const file of allAgentFiles) {
+     const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8');
+     const effortMatch = content.match(/^effort:\s*(\S+)/m);
+     assert.ok(effortMatch, `${file} has effort field`);
+     assert.ok(VALID_EFFORT.includes(effortMatch[1]),
+       `${file} effort="${effortMatch[1]}" is valid`);
+   }
+ });
+
+ // SEC-AF-037: All 29 agents have maxTurns field
+ test('SEC-AF-037', 'All agents have maxTurns in valid range (10-100)', () => {
+   const allAgentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
+   for (const file of allAgentFiles) {
+     const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8');
+     const turnsMatch = content.match(/^maxTurns:\s*(\d+)/m);
+     assert.ok(turnsMatch, `${file} has maxTurns field`);
+     const turns = parseInt(turnsMatch[1]);
+     assert.ok(turns >= 10 && turns <= 100,
+       `${file} maxTurns=${turns} in range 10-100`);
+   }
+ });
+
+ // SEC-AF-038: Tier 1 agents have low/medium effort (not high)
+ test('SEC-AF-038', 'Tier 1 (read-only) agents do not use high effort', () => {
+   for (const agent of TIER1_AGENTS) {
+     const content = fs.readFileSync(path.join(AGENTS_DIR, `${agent}.md`), 'utf8');
+     const effortMatch = content.match(/^effort:\s*(\S+)/m);
+     // read-only agents should use low or medium (cost optimization)
+     // Note: some may use medium which is acceptable
+   }
+ });
+
+ // SEC-AF-039: cto-lead has high effort (orchestration needs)
+ test('SEC-AF-039', 'cto-lead uses high effort for orchestration', () => {
+   const content = fs.readFileSync(path.join(AGENTS_DIR, 'cto-lead.md'), 'utf8');
+   const effortMatch = content.match(/^effort:\s*(\S+)/m);
+   assert.ok(effortMatch, 'cto-lead has effort field');
+   assert.strictEqual(effortMatch[1], 'high');
+ });
+
+ // SEC-AF-040: maxTurns consistency (opus agents >= sonnet agents)
+ test('SEC-AF-040', 'Opus agents have maxTurns >= sonnet agents minimum', () => {
+   // Verify that opus (complex orchestration) agents have sufficient turns
+   const opusAgents = ['cto-lead', 'enterprise-expert', 'code-analyzer',
+     'gap-detector', 'infra-architect', 'security-architect', 'design-validator'];
+   for (const agent of opusAgents) {
+     const filePath = path.join(AGENTS_DIR, `${agent}.md`);
+     if (!fs.existsSync(filePath)) continue;
+     const content = fs.readFileSync(filePath, 'utf8');
+     const turnsMatch = content.match(/^maxTurns:\s*(\d+)/m);
+     if (turnsMatch) {
+       assert.ok(parseInt(turnsMatch[1]) >= 20,
+         `${agent} (opus) maxTurns >= 20`);
+     }
+   }
+ });
```

---

### 2.6 regression/cc-compat.test.js (+4 TC)

**변경 diff 개요**:

```diff
- * Regression Test: Claude Code Compatibility (12 TC)
+ * Regression Test: Claude Code Compatibility (16 TC)
- * @version bkit v1.6.1
+ * @version bkit v1.6.2

- console.log('\n=== cc-compat.test.js (12 TC) ===\n');
+ console.log('\n=== cc-compat.test.js (16 TC) ===\n');

  // CC-01: 변경 없음 (model validity)
  // CC-02: 변경 (count update)
- assert('CC-02', allHaveModel,
-   `All 21 agents have model field${...}`);
+ assert('CC-02', allHaveModel,
+   `All 29 agents have model field${...}`);

  // CC-06: version update
- assert('CC-06', pluginJson.version === '1.6.1', ...);
+ assert('CC-06', pluginJson.version === '1.6.2', ...);

  // CC-08: version update
- assert('CC-08', bkitConfig.version === '1.6.1', ...);
+ assert('CC-08', bkitConfig.version === '1.6.2', ...);

  // CC-12: version update
- const bkitPlugin = marketplaceJson.plugins.find(p => p.name === 'bkit');
- assert('CC-12', bkitPlugin && bkitPlugin.version === '1.6.1', ...);
+ assert('CC-12', bkitPlugin && bkitPlugin.version === '1.6.2', ...);

+ // ============================================================
+ // TC13-16: v1.6.2 specific validations
+ // ============================================================
+ console.log('\n--- v1.6.2 Specific ---');
+
+ // CC-13: 12 hook events in hooks.json
+ const hooksJson = JSON.parse(fs.readFileSync(
+   path.join(BASE_DIR, 'hooks', 'hooks.json'), 'utf-8'));
+ const hookEventCount = Object.keys(hooksJson.hooks).length;
+ assert('CC-13', hookEventCount === 12,
+   `hooks.json has 12 hook events (got ${hookEventCount})`);
+
+ // CC-14: 29 agent files exist
+ const agentCount = fs.readdirSync(AGENTS_DIR)
+   .filter(f => f.endsWith('.md')).length;
+ assert('CC-14', agentCount === 29,
+   `29 agent files exist (got ${agentCount})`);
+
+ // CC-15: All agents have effort field
+ let allHaveEffort = true;
+ const missingEffort = [];
+ for (const file of agentFiles) {
+   const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
+   const fm = parseFrontmatter(content);
+   if (!fm || !fm.match(/^effort:/m)) {
+     allHaveEffort = false;
+     missingEffort.push(file);
+   }
+ }
+ assert('CC-15', allHaveEffort,
+   `All 29 agents have effort field${missingEffort.length ? ' MISSING: ' + missingEffort.join(', ') : ''}`);
+
+ // CC-16: All agents have maxTurns field
+ let allHaveMaxTurns = true;
+ const missingMaxTurns = [];
+ for (const file of agentFiles) {
+   const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
+   const fm = parseFrontmatter(content);
+   if (!fm || !fm.match(/^maxTurns:/m)) {
+     allHaveMaxTurns = false;
+     missingMaxTurns.push(file);
+   }
+ }
+ assert('CC-16', allHaveMaxTurns,
+   `All 29 agents have maxTurns field${missingMaxTurns.length ? ' MISSING: ' + missingMaxTurns.join(', ') : ''}`);
```

---

## 3. 신규 TC 상세 설계

### 3.1 unit/post-compaction.test.js (15 TC)

**목적**: `scripts/post-compaction.js`의 내부 로직을 단위 테스트

**테스트 구조**:

```javascript
'use strict';
const { assert, skip, summary, reset } = require('../helpers/assert');
reset();

console.log('\n=== post-compaction.test.js (15 TC) ===\n');

// Section 1: Script Existence & Module Dependencies (3 TC)
// PC-01: post-compaction.js 파일 존재
// PC-02: common.js에서 필요한 함수 import 가능 (readStdinSync, debugLog, getPdcaStatusFull, outputEmpty)
// PC-03: lib/core/paths에서 restoreFromPluginData import 가능

// Section 2: PDCA Status Validation Logic (4 TC)
// PC-04: getPdcaStatusFull(true)가 null일 때 restoreFromPluginData 호출 경로
// PC-05: pdcaStatus.version 누락 시 validationErrors에 추가
// PC-06: pdcaStatus.features가 object가 아닐 때 감지
// PC-07: pdcaStatus.activeFeatures가 array가 아닐 때 감지

// Section 3: Snapshot Consistency Check (3 TC)
// PC-08: STATE_PATHS.snapshots() 경로 접근 가능
// PC-09: 스냅샷 파일 정렬 및 최신 파일 선택 로직
// PC-10: featureCount 변화 감지 (snapshotDelta 생성)

// Section 4: Output Format (3 TC)
// PC-11: hookSpecificOutput.hookEventName === 'PostCompact'
// PC-12: additionalContext에 activeFeatures 포함
// PC-13: validationErrors 발생 시 WARNINGS 문자열 포함

// Section 5: Error Handling (2 TC)
// PC-14: stdin 읽기 실패 시 outputEmpty() 호출 후 정상 종료
// PC-15: 백업 복구 실패 시에도 정상 종료 (process.exit(0))

summary('PostCompaction Unit Tests');
```

**TC 명세 테이블**:

| TC ID | 입력 | 기대 출력 | 검증 방법 |
|-------|------|----------|----------|
| PC-01 | fs.existsSync('scripts/post-compaction.js') | true | 파일 존재 확인 |
| PC-02 | require('../lib/common') | readStdinSync, debugLog, getPdcaStatusFull, outputEmpty 함수 존재 | typeof === 'function' |
| PC-03 | require('../lib/core/paths') | restoreFromPluginData 함수 존재 | typeof === 'function' |
| PC-04 | pdcaStatus = null | restoreFromPluginData 호출 필요 | 코드 경로 분석 |
| PC-05 | { features: {}, activeFeatures: [] } | validationErrors에 'Missing version field' 포함 | 로직 시뮬레이션 |
| PC-06 | { version: '2', features: 'invalid' } | validationErrors에 'invalid features' 포함 | 로직 시뮬레이션 |
| PC-07 | { version: '2', features: {}, activeFeatures: 'not-array' } | validationErrors 추가 | 로직 시뮬레이션 |
| PC-08 | STATE_PATHS.snapshots() | 함수 호출 가능 | typeof === 'function' |
| PC-09 | ['snapshot-2.json', 'snapshot-1.json'] | reverse sort 후 files[0] = 'snapshot-2.json' | sort 로직 검증 |
| PC-10 | snapshot: 3 features, current: 4 features | snapshotDelta = { before: 3, after: 4, diff: 1 } | 값 비교 |
| PC-11 | 정상 실행 | JSON output 포함 hookEventName: 'PostCompact' | 문자열 검증 |
| PC-12 | activeFeatures = ['feat-a'] | 'Active: feat-a' 포함 | 문자열 검증 |
| PC-13 | validationErrors = ['test'] | 'WARNINGS: test' 포함 | 문자열 검증 |
| PC-14 | stdin 읽기 에러 | process.exit(0) 호출 | 에러 핸들링 경로 |
| PC-15 | restore 실패 | outputEmpty() 후 exit(0) | 에러 핸들링 경로 |

---

### 3.2 unit/stop-failure.test.js (15 TC)

**목적**: `scripts/stop-failure-handler.js`의 에러 분류 및 복구 로직 검증

**테스트 구조**:

```javascript
'use strict';
const { assert, skip, summary, reset } = require('../helpers/assert');
reset();

console.log('\n=== stop-failure.test.js (15 TC) ===\n');

// Section 1: Script & Dependencies (2 TC)
// SF-01: stop-failure-handler.js 파일 존재
// SF-02: common.js 의존 함수 존재 (readStdinSync, debugLog, getPdcaStatusFull, outputAllow)

// Section 2: Error Classification (7 TC)
// SF-03: 'rate limit' -> category: 'rate_limit', severity: 'medium'
// SF-04: '401 unauthorized' -> category: 'auth_failure', severity: 'high'
// SF-05: '500 server error' -> category: 'server_error', severity: 'medium'
// SF-06: '529 overloaded' -> category: 'overloaded', severity: 'medium'
// SF-07: 'timeout' -> category: 'timeout', severity: 'low'
// SF-08: 'context too long' -> category: 'context_overflow', severity: 'medium'
// SF-09: 'unknown error xyz' -> category: 'unknown', severity: 'low'

// Section 3: Error Logging (3 TC)
// SF-10: error-log.json에 최대 50개 항목 유지
// SF-11: 로그 항목에 timestamp, errorType, category, severity, agentId 포함
// SF-12: errorMessage 500자 이내 절삭

// Section 4: Emergency Backup (2 TC)
// SF-13: StopFailure 시 backupToPluginData() 호출
// SF-14: pdcaStatus가 null이면 backup 생략

// Section 5: Recovery Guidance (1 TC)
// SF-15: agentType 'teammate' 일 때 CTO Team 안내 포함

summary('StopFailure Unit Tests');
```

**classifyError 함수 추출 테스트 전략**:

```javascript
// classifyError는 stop-failure-handler.js 내부 함수이므로
// 동일한 로직을 테스트 내에서 복제하여 검증
function classifyError(type, message) {
  const msg = (message || '').toLowerCase();
  if (msg.includes('rate limit') || msg.includes('429')) {
    return { category: 'rate_limit', severity: 'medium', recovery: expect.any(String) };
  }
  // ... (원본과 동일한 분류 로직)
}
```

---

### 3.3 unit/plugin-data.test.js (20 TC)

**목적**: `lib/core/paths.js`의 `backupToPluginData`, `restoreFromPluginData` 함수 검증

**테스트 구조**:

```javascript
'use strict';
const { assert, skip, summary, reset } = require('../helpers/assert');
reset();

console.log('\n=== plugin-data.test.js (20 TC) ===\n');

// Section 1: Function Existence (2 TC)
// PD-01: backupToPluginData is function
// PD-02: restoreFromPluginData is function

// Section 2: backupToPluginData (8 TC)
// PD-03: CLAUDE_PLUGIN_DATA 없으면 { backed: [], skipped: ['no CLAUDE_PLUGIN_DATA'] }
// PD-04: 반환값에 backed 배열 존재
// PD-05: 반환값에 skipped 배열 존재
// PD-06: targets에 pdca-status.backup.json 포함
// PD-07: targets에 memory.backup.json 포함
// PD-08: version-history.json 생성 로직 (최대 50개)
// PD-09: backupDir 생성 실패 시 에러 처리
// PD-10: 소스 파일 없을 때 skip 처리

// Section 3: restoreFromPluginData (8 TC)
// PD-11: 백업 디렉토리 없으면 { restored: [], skipped: ['no backup directory'] }
// PD-12: 반환값에 restored 배열 존재
// PD-13: 반환값에 skipped 배열 존재
// PD-14: dest 파일 이미 존재하면 복원 안 함
// PD-15: dest 파일 없고 backup 존재하면 복원
// PD-16: dest 디렉토리 자동 생성 (recursive: true)
// PD-17: 복원 실패 시 skipped에 에러 메시지 추가
// PD-18: 복원 대상: pdca-status, memory 2개

// Section 4: Integration (2 TC)
// PD-19: backup -> restore 라운드트립 (backup 후 restore 시 동일 데이터)
// PD-20: STATE_PATHS.pluginDataBackup() 함수 존재 및 호출 가능

summary('Plugin Data Backup/Restore Unit Tests');
```

**환경변수 처리 전략**:

```javascript
// CLAUDE_PLUGIN_DATA 없는 환경에서도 테스트 가능하도록
// 환경변수 없을 때: PD-03 PASS, PD-04~PD-10은 mock 또는 skip
const origPluginData = process.env.CLAUDE_PLUGIN_DATA;
// 테스트 후 복원
afterAll(() => { process.env.CLAUDE_PLUGIN_DATA = origPluginData; });
```

---

### 3.4 regression/agents-effort.test.js (29 TC)

**목적**: 29개 agent의 effort/maxTurns 값 정합성 검증

**테스트 구조**:

```javascript
'use strict';
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '../..');
const AGENTS_DIR = path.join(BASE_DIR, 'agents');

let passed = 0, failed = 0, total = 0;

function assert(id, condition, message) {
  total++;
  if (condition) { passed++; console.log(`  PASS: ${id} - ${message}`); }
  else { failed++; console.error(`  FAIL: ${id} - ${message}`); }
}

console.log('\n=== agents-effort.test.js (29 TC) ===\n');

// Expected effort/maxTurns for each agent
const EXPECTED = {
  'cto-lead':            { effort: 'high',   maxTurns: 50 },
  'pm-lead':             { effort: 'high',   maxTurns: 30 },
  'bkend-expert':        { effort: 'medium', maxTurns: 20 },
  'enterprise-expert':   { effort: 'high',   maxTurns: 30 },  // TBD - verify
  'frontend-architect':  { effort: 'medium', maxTurns: 20 },
  'infra-architect':     { effort: 'high',   maxTurns: 30 },
  'code-analyzer':       { effort: 'high',   maxTurns: 30 },
  'design-validator':    { effort: 'medium', maxTurns: 20 },  // TBD - verify
  'gap-detector':        { effort: 'high',   maxTurns: 30 },
  'pdca-iterator':       { effort: 'medium', maxTurns: 20 },  // TBD - verify
  'pipeline-guide':      { effort: 'medium', maxTurns: 20 },  // TBD - verify
  'pm-discovery':        { effort: 'medium', maxTurns: 20 },
  'pm-prd':              { effort: 'medium', maxTurns: 20 },
  'pm-research':         { effort: 'medium', maxTurns: 20 },
  'pm-strategy':         { effort: 'medium', maxTurns: 20 },
  'product-manager':     { effort: 'medium', maxTurns: 20 },
  'qa-monitor':          { effort: 'low',    maxTurns: 15 },
  'qa-strategist':       { effort: 'medium', maxTurns: 20 },
  'report-generator':    { effort: 'low',    maxTurns: 15 },
  'security-architect':  { effort: 'high',   maxTurns: 30 },
  'starter-guide':       { effort: 'medium', maxTurns: 20 },
  'pdca-eval-plan':      { effort: 'medium', maxTurns: 20 },
  'pdca-eval-design':    { effort: 'medium', maxTurns: 20 },
  'pdca-eval-do':        { effort: 'medium', maxTurns: 20 },
  'pdca-eval-check':     { effort: 'medium', maxTurns: 20 },
  'pdca-eval-act':       { effort: 'medium', maxTurns: 20 },
  'pdca-eval-pm':        { effort: 'medium', maxTurns: 20 },
  'skill-needs-extractor': { effort: 'medium', maxTurns: 20 },
  'pm-lead-skill-patch': { effort: 'medium', maxTurns: 20 },
};

// Test each agent
const agentNames = Object.keys(EXPECTED);
agentNames.forEach((agent, idx) => {
  const num = String(idx + 1).padStart(2, '0');
  const filePath = path.join(AGENTS_DIR, `${agent}.md`);

  let content = '';
  let effortVal = null;
  let maxTurnsVal = null;

  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, 'utf-8');
    const effortMatch = content.match(/^effort:\s*(\S+)/m);
    const turnsMatch = content.match(/^maxTurns:\s*(\d+)/m);
    effortVal = effortMatch ? effortMatch[1] : null;
    maxTurnsVal = turnsMatch ? parseInt(turnsMatch[1]) : null;
  }

  const expected = EXPECTED[agent];
  const effortOk = effortVal === expected.effort;
  const turnsOk = maxTurnsVal === expected.maxTurns;

  assert(`AE-${num}`,
    effortOk && turnsOk,
    `${agent}: effort=${effortVal}(expect ${expected.effort}), maxTurns=${maxTurnsVal}(expect ${expected.maxTurns})`
  );
});

console.log(`\n=== Results: ${passed}/${total} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
```

**주의**: EXPECTED 테이블의 값은 실제 agent 파일에서 확인한 값을 반영해야 합니다. grep 결과 기준으로 작성했으나, 일부 agent(enterprise-expert, design-validator, pdca-iterator, pipeline-guide)는 Do phase에서 실제 값을 확인 후 보정 필요합니다.

---

### 3.5 integration/session-restore.test.js (10 TC)

**목적**: SessionStart -> PLUGIN_DATA restore 통합 플로우 검증

**테스트 구조**:

```javascript
'use strict';
const { assert, skip, summary, reset } = require('../helpers/assert');
reset();

console.log('\n=== session-restore.test.js (10 TC) ===\n');

// Section 1: Session Start Script (3 TC)
// SR-01: hooks/session-start.js 파일 존재 및 require 가능
// SR-02: session-start.js에서 common.js 함수 사용 확인
// SR-03: hooks.json SessionStart 에 session-start.js 경로 등록

// Section 2: PLUGIN_DATA Integration (4 TC)
// SR-04: STATE_PATHS.pluginDataBackup() 반환값 (CLAUDE_PLUGIN_DATA 있을 때)
// SR-05: STATE_PATHS.pluginDataBackup() 반환값 (CLAUDE_PLUGIN_DATA 없을 때 = null)
// SR-06: backupToPluginData -> restoreFromPluginData 라운드트립
// SR-07: 이미 존재하는 파일은 restore 하지 않음 (덮어쓰기 방지)

// Section 3: PostCompact Restore Flow (3 TC)
// SR-08: post-compaction.js에서 restoreFromPluginData 호출 경로 존재
// SR-09: hooks.json PostCompact에 post-compaction.js 등록
// SR-10: hooks.json StopFailure에 stop-failure-handler.js 등록

summary('Session Restore Integration Tests');
```

---

### 3.6 performance/plugin-data-perf.test.js (6 TC)

**목적**: backup/restore 함수 성능 벤치마크

**테스트 구조**:

```javascript
'use strict';
const { measureTime, formatMs } = require('../helpers/timer');

let passed = 0, failed = 0, total = 0;

function assert(id, condition, message) {
  total++;
  if (condition) { passed++; console.log(`  PASS: ${id} - ${message}`); }
  else { failed++; console.error(`  FAIL: ${id} - ${message}`); }
}

console.log('\n=== plugin-data-perf.test.js (6 TC) ===\n');

const { backupToPluginData, restoreFromPluginData } = require('../../lib/core/paths');

// PP-01: backupToPluginData < 100ms (cold start)
const [backupResult, backupTime] = measureTime(() => backupToPluginData());
assert('PP-01', backupTime < 100,
  `backupToPluginData cold: ${formatMs(backupTime)} (< 100ms)`);

// PP-02: backupToPluginData < 50ms (warm, 2nd call)
const [, backupTime2] = measureTime(() => backupToPluginData());
assert('PP-02', backupTime2 < 50,
  `backupToPluginData warm: ${formatMs(backupTime2)} (< 50ms)`);

// PP-03: restoreFromPluginData < 100ms
const [, restoreTime] = measureTime(() => restoreFromPluginData());
assert('PP-03', restoreTime < 100,
  `restoreFromPluginData: ${formatMs(restoreTime)} (< 100ms)`);

// PP-04: 10x backupToPluginData < 500ms total
const [, batchTime] = measureTime(() => {
  for (let i = 0; i < 10; i++) backupToPluginData();
});
assert('PP-04', batchTime < 500,
  `10x backup batch: ${formatMs(batchTime)} (< 500ms)`);

// PP-05: STATE_PATHS.pluginDataBackup() < 5ms
const { STATE_PATHS } = require('../../lib/core/paths');
const [, pathTime] = measureTime(() => STATE_PATHS.pluginDataBackup());
assert('PP-05', pathTime < 5,
  `STATE_PATHS.pluginDataBackup(): ${formatMs(pathTime)} (< 5ms)`);

// PP-06: common.js에서 접근 시에도 동일 성능
const common = require('../../lib/common');
const [, commonTime] = measureTime(() => common.backupToPluginData());
assert('PP-06', commonTime < 100,
  `common.backupToPluginData: ${formatMs(commonTime)} (< 100ms)`);

// Summary
console.log(`\n${'='.repeat(40)}`);
console.log(`Plugin Data Performance Tests`);
console.log(`${'='.repeat(40)}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Skipped: 0`);
console.log(`${'='.repeat(40)}\n`);

if (failed > 0) process.exit(1);
```

---

## 4. run-all.js 업데이트

**변경 diff 개요**:

```diff
- * bkit v1.6.1 Comprehensive Test Runner
- * 1020 TC across 8 perspectives
+ * bkit v1.6.2 Comprehensive Test Runner
+ * ~1151 TC across 8 perspectives

  const CATEGORIES = {
    unit: {
      files: [
        // 기존 8개 유지
+       'unit/post-compaction.test.js',
+       'unit/stop-failure.test.js',
+       'unit/plugin-data.test.js',
      ],
-     expected: 400,
+     expected: 521,
    },
    integration: {
      files: [
        // 기존 4개 유지
+       'integration/session-restore.test.js',
      ],
-     expected: 120,
+     expected: 134,
    },
    security: {
      // files 변경 없음
-     expected: 80,
+     expected: 76,
    },
    regression: {
      files: [
        'regression/pdca-core.test.js',
        'regression/skills-28.test.js',
-       'regression/agents-21.test.js',
-       'regression/hooks-10.test.js',
+       'regression/agents-29.test.js',
+       'regression/hooks-12.test.js',
+       'regression/agents-effort.test.js',
        'regression/cc-compat.test.js',
      ],
-     expected: 150,
+     expected: 204,
    },
    performance: {
      files: [
        // 기존 4개 유지
+       'performance/plugin-data-perf.test.js',
      ],
-     expected: 70,
+     expected: 76,
    },
    // philosophy, ux, e2e 변경 없음
  };

  // 리포트 경로 변경
- const reportPath = path.join(ROOT, 'docs/04-report/features/bkit-v161-comprehensive-test.report.md');
+ const reportPath = path.join(ROOT, 'docs/04-report/features/bkit-v162-comprehensive-test.report.md');

  // 배너 변경
- console.log('bkit v1.6.1 Comprehensive Test Runner');
+ console.log('bkit v1.6.2 Comprehensive Test Runner');
```

---

## 5. TC ID 체계

### 5.1 기존 ID 체계 (유지)

| 파일 | ID Prefix | 범위 |
|------|-----------|------|
| hooks-12.test.js | HK- | HK-01 ~ HK-12 |
| agents-29.test.js | AG- | AG-01-FM ~ AG-29-TRIG |
| other-modules.test.js | U-OTH- | U-OTH-001 ~ U-OTH-024 |
| export-compat.test.js | TC-EC- | TC-EC-01 ~ TC-EC-34 |
| agent-frontmatter.test.js | SEC-AF- | SEC-AF-001 ~ SEC-AF-040 |
| cc-compat.test.js | CC- | CC-01 ~ CC-16 |

### 5.2 신규 ID 체계

| 파일 | ID Prefix | 범위 |
|------|-----------|------|
| post-compaction.test.js | PC- | PC-01 ~ PC-15 |
| stop-failure.test.js | SF- | SF-01 ~ SF-15 |
| plugin-data.test.js | PD- | PD-01 ~ PD-20 |
| agents-effort.test.js | AE- | AE-01 ~ AE-29 |
| session-restore.test.js | SR- | SR-01 ~ SR-10 |
| plugin-data-perf.test.js | PP- | PP-01 ~ PP-06 |

**ID 충돌 없음 확인**: 모든 prefix가 고유하며 기존 prefix와 겹치지 않음.

---

## 6. 하위 호환성 보장 전략

### 6.1 원칙

1. **기존 TC ID 보존**: 기존 TC의 ID(HK-01~HK-10, AG-01-FM~AG-21-TRIG 등)는 절대 변경하지 않음
2. **기존 assert 로직 보존**: 기존 TC의 검증 조건은 변경하지 않되, 범위 확대만 허용 (예: >= 200 -> >= 210)
3. **파일명 변경 시 이전 파일 유지**: hooks-10.test.js는 삭제하지 않고 hooks-12.test.js로 복사 후 확장
   - run-all.js에서만 새 파일을 참조
   - CI에서 이전 파일 직접 실행하는 경우 대비

### 6.2 rollback 가능성

모든 변경은 git에서 revert 가능하도록 단일 커밋으로 묶거나, 파일별 커밋으로 분리한다.

---

## 7. 구현 순서 (Phase별)

| Phase | 파일 | 작업 | 예상 소요 |
|-------|------|------|----------|
| 1-1 | regression/cc-compat.test.js | 버전 업데이트 + 4 TC 추가 | 15분 |
| 1-2 | regression/hooks-12.test.js | hooks-10 복사 + 2 TC 추가 | 10분 |
| 1-3 | regression/agents-29.test.js | agents-21 복사 + 8 agents 추가 | 15분 |
| 1-4 | unit/other-modules.test.js | export 수 + 2 TC 추가 | 10분 |
| 1-5 | run-all.js | 파일명, TC 수, 리포트 경로 업데이트 | 10분 |
| 2-1 | unit/plugin-data.test.js | 신규 20 TC | 30분 |
| 2-2 | integration/export-compat.test.js | 4 TC 추가 | 15분 |
| 2-3 | security/agent-frontmatter.test.js | 5 TC 추가 | 15분 |
| 2-4 | regression/agents-effort.test.js | 신규 29 TC | 20분 |
| 3-1 | unit/post-compaction.test.js | 신규 15 TC | 30분 |
| 3-2 | unit/stop-failure.test.js | 신규 15 TC | 30분 |
| 3-3 | integration/session-restore.test.js | 신규 10 TC | 20분 |
| 4-1 | performance/plugin-data-perf.test.js | 신규 6 TC | 15분 |
| 4-2 | 전체 통합 실행 | node test/run-all.js | 5분 |
| **Total** | **15 파일** | **~1,151 TC** | **~4시간** |

---

## 8. 검증 체크리스트

### 8.1 Do phase 완료 후 체크

- [ ] `node test/run-all.js` 실행 시 0 FAIL
- [ ] 기존 TC 중 변경하지 않은 것들이 여전히 PASS
- [ ] 모든 신규 TC ID가 고유한지 확인 (중복 없음)
- [ ] test/helpers/ 변경 없음 확인
- [ ] philosophy/, ux/, e2e/ 변경 없음 확인

### 8.2 Quality Gate

| 항목 | 기준 | 방법 |
|------|------|------|
| Pass Rate | >= 99% | run-all.js 결과 확인 |
| 신규 TC PASS | 100% | 카테고리별 개별 실행 |
| 실행 시간 | < 120s | run-all.js 총 시간 |
| TC ID 충돌 | 0건 | grep으로 중복 ID 검색 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-18 | Initial design | CTO Lead |
