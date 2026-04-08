# bkit v2.0.5 Comprehensive Test Report

> Generated: 2026-04-08T06:02:44.253Z
> Total: 3056 TC, 3028 PASS, 20 FAIL, 13 SKIP
> Pass Rate: 99.1%

---

## Summary

| Category | Total | Passed | Failed | Skipped | Rate |
|----------|:-----:|:------:|:------:|:-------:|:----:|
| Unit Tests | 1234 | 1233 | 1 | 4 | 99.9% FAIL |
| Integration Tests | 442 | 425 | 17 | 0 | 96.2% FAIL |
| Security Tests | 217 | 217 | 0 | 0 | 100.0% PASS |
| Regression Tests | 516 | 508 | 0 | 8 | 98.4% PASS |
| Performance Tests | 106 | 104 | 2 | 1 | 98.1% FAIL |
| Philosophy Tests | 140 | 140 | 0 | 0 | 100.0% PASS |
| UX Tests | 160 | 160 | 0 | 0 | 100.0% PASS |
| E2E Tests (Node) | 61 | 61 | 0 | 0 | 100.0% PASS |
| Architecture Tests | 100 | 100 | 0 | 0 | 100.0% PASS |
| Controllable AI Tests | 80 | 80 | 0 | 0 | 100.0% PASS |
| **Total** | **3056** | **3028** | **20** | **13** | **99.1%** |

## Version Comparison: v1.6.2 → v2.0.0

| Metric | v1.6.2 | v2.0.0 | Delta |
|--------|:------:|:------:|:-----:|
| Categories | 8 | 10 | +2 |
| Total TC | 1151 | 3056 | +1905 |
| Unit Tests | 450 | 1234 | +784 |
| Integration Tests | 130 | 442 | +312 |
| Security Tests | 80 | 217 | +137 |
| Regression Tests | 200 | 516 | +316 |
| Performance Tests | 76 | 106 | +30 |
| Philosophy Tests | 60 | 140 | +80 |
| UX Tests | 60 | 160 | +100 |
| E2E Tests (Node) | 20 | 61 | +41 |
| Architecture Tests | N/A | 100 | NEW |
| Controllable AI Tests | N/A | 80 | NEW |

## Failures

### Unit Tests

- **unit/other-modules.test.js**: Execution error: Command failed: node "/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/test/unit/other-modules.test.js"
common.js load failed: Cannot find module '../../lib/common'
Require stack:
- /Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/test/unit/other-modules.test.js

- **unit/backup-scheduler.test.js**: File not found
- **unit/do-detector.test.js**: File not found
- **unit/root-modules.test.js**: File not found
- **unit/index-modules.test.js**: File not found

### Integration Tests

- **integration/hook-chain.test.js**: Execution error: Command failed: node "/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/test/integration/hook-chain.test.js"
node:internal/modules/cjs/loader:1386
  throw err;
  ^

Error: Cannot find module '/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/lib/common'
Require stack:
- /Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/test/integration/hook-chain.test.js
    at Function._resolveFilename (node:internal/modules/cjs/loader:1383:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1025:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1030:22)
    at Function._load (node:internal/modules/cjs/loader:1192:37)
    at TracingChannel.traceSync (node:diagnostics_channel:328:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Module.require (node:internal/modules/cjs/loader:1463:12)
    at require (node:internal/modules/helpers:147:16)
    at Object.<anonymous> (/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/test/integration/hook-chain.test.js:35:16)
    at Module._compile (node:internal/modules/cjs/loader:1706:14) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/test/integration/hook-chain.test.js'
  ]
}

Node.js v22.21.1

- **integration/export-compat.test.js**: Execution error: Command failed: node "/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/test/integration/export-compat.test.js"
node:internal/modules/cjs/loader:1386
  throw err;
  ^

Error: Cannot find module '/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/lib/common'
Require stack:
- /Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/test/integration/export-compat.test.js
    at Function._resolveFilename (node:internal/modules/cjs/loader:1383:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1025:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1030:22)
    at Function._load (node:internal/modules/cjs/loader:1192:37)
    at TracingChannel.traceSync (node:diagnostics_channel:328:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Module.require (node:internal/modules/cjs/loader:1463:12)
    at require (node:internal/modules/helpers:147:16)
    at Object.<anonymous> (/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/test/integration/export-compat.test.js:35:16)
    at Module._compile (node:internal/modules/cjs/loader:1706:14) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/test/integration/export-compat.test.js'
  ]
}

Node.js v22.21.1

- **CB-001**: lib/common.js loads without error
- **CB-002**: lib/common.js exports >200 functions/values (actual: 0)
- **CB-003**: lib/common.js removed (v2.1.0), was: >200 defined (non-undefined) exports (actual: 0)
- **CB-004**: lib/common.js exports >100 functions (actual: 0)
- **CB-005**: lib/common.js exports a plain object
- **CB-006**: Core functions (debugLog, getBkitConfig, readStdinSync) accessible via common.js
- **CB-007**: PDCA functions (getPdcaStatusFull, updatePdcaStatus) accessible via common.js
- **CB-008**: Intent functions (detectLanguage, calculateAmbiguityScore) accessible via common.js
- **CB-009**: Task functions (classifyTaskByLines, getPdcaLevel) accessible via common.js
- **CB-010**: Team functions accessible via common.js
- **CB-011**: lib/core debugLog is identical to common.debugLog
- **CB-012**: lib/pdca getPdcaStatusFull is identical to common.getPdcaStatusFull
- **CB-013**: lib/intent detectLanguage is identical to common.detectLanguage
- **CB-014**: lib/task classifyTaskByLines is identical to common.classifyTaskByLines
- **CB-016**: Re-requiring common.js returns cached module without circular dependency error

### Performance Tests

- **performance/core-function-perf.test.js**: Execution error: Command failed: node "/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/test/performance/core-function-perf.test.js"
node:internal/modules/cjs/loader:1386
  throw err;
  ^

Error: Cannot find module '../../lib/common'
Require stack:
- /Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/test/performance/core-function-perf.test.js
    at Function._resolveFilename (node:internal/modules/cjs/loader:1383:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1025:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1030:22)
    at Function._load (node:internal/modules/cjs/loader:1192:37)
    at TracingChannel.traceSync (node:diagnostics_channel:328:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Module.require (node:internal/modules/cjs/loader:1463:12)
    at require (node:internal/modules/helpers:147:16)
    at Object.<anonymous> (/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/test/performance/core-function-perf.test.js:17:16)
    at Module._compile (node:internal/modules/cjs/loader:1706:14) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/test/performance/core-function-perf.test.js'
  ]
}

Node.js v22.21.1

- **performance/plugin-data-perf.test.js**: Execution error: Command failed: node "/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/test/performance/plugin-data-perf.test.js"
node:internal/modules/cjs/loader:1386
  throw err;
  ^

Error: Cannot find module '../../lib/common'
Require stack:
- /Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/test/performance/plugin-data-perf.test.js
    at Function._resolveFilename (node:internal/modules/cjs/loader:1383:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1025:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1030:22)
    at Function._load (node:internal/modules/cjs/loader:1192:37)
    at TracingChannel.traceSync (node:diagnostics_channel:328:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Module.require (node:internal/modules/cjs/loader:1463:12)
    at require (node:internal/modules/helpers:147:16)
    at Object.<anonymous> (/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/test/performance/plugin-data-perf.test.js:19:16)
    at Module._compile (node:internal/modules/cjs/loader:1706:14) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/test/performance/plugin-data-perf.test.js'
  ]
}

Node.js v22.21.1

- **performance/direct-import.test.js**: File not found

## Verdict

**20 TESTS FAILED** - Issues must be resolved before release.
