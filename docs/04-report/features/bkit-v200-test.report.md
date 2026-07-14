# bkit v2.0.5 Comprehensive Test Report

> Generated: 2026-07-14T04:59:07.044Z
> Total: 3670 TC, 3616 PASS, 39 FAIL, 19 SKIP
> Pass Rate: 98.5%

---

## Summary

| Category | Total | Passed | Failed | Skipped | Rate |
|----------|:-----:|:------:|:------:|:-------:|:----:|
| Unit Tests | 1540 | 1511 | 18 | 15 | 98.1% FAIL |
| Integration Tests | 537 | 535 | 2 | 0 | 99.6% FAIL |
| Security Tests | 249 | 249 | 0 | 0 | 100.0% PASS |
| Regression Tests | 514 | 497 | 17 | 0 | 96.7% FAIL |
| Performance Tests | 161 | 157 | 0 | 4 | 97.5% PASS |
| Philosophy Tests | 129 | 127 | 2 | 0 | 98.4% FAIL |
| UX Tests | 185 | 185 | 0 | 0 | 100.0% PASS |
| E2E Tests (Node) | 90 | 90 | 0 | 0 | 100.0% PASS |
| Architecture Tests | 100 | 100 | 0 | 0 | 100.0% PASS |
| Controllable AI Tests | 80 | 80 | 0 | 0 | 100.0% PASS |
| behavioral | 45 | 45 | 0 | 0 | 100.0% PASS |
| contract | 40 | 40 | 0 | 0 | 100.0% PASS |
| **Total** | **3670** | **3616** | **39** | **19** | **98.5%** |

## Version Comparison: v1.6.2 → v2.0.0

| Metric | v1.6.2 | v2.0.0 | Delta |
|--------|:------:|:------:|:-----:|
| Categories | 8 | 12 | +4 |
| Total TC | 1151 | 3670 | +2519 |
| Unit Tests | 450 | 1540 | +1090 |
| Integration Tests | 130 | 537 | +407 |
| Security Tests | 80 | 249 | +169 |
| Regression Tests | 200 | 514 | +314 |
| Performance Tests | 76 | 161 | +85 |
| Philosophy Tests | 60 | 129 | +69 |
| UX Tests | 60 | 185 | +125 |
| E2E Tests (Node) | 20 | 90 | +70 |
| Architecture Tests | N/A | 100 | NEW |
| Controllable AI Tests | N/A | 80 | NEW |
| behavioral | N/A | 45 | NEW |
| contract | N/A | 40 | NEW |

## Failures

### Unit Tests

- **unit/context-loader.test.js**: File not found
- **unit/impact-analyzer.test.js**: File not found
- **unit/invariant-checker.test.js**: File not found
- **unit/scenario-runner.test.js**: File not found

### Integration Tests

- **TC-HC-26**: detectDocumentType returns null for analysis path (not yet implemented)
- **integration/control-pipeline.test.js**: Execution error: Command failed: node "/Users/kaykim/Documents/GitHub/agent-kay-it/bkit-claude-code/test/integration/control-pipeline.test.js"
Assertion failed: CP-011: createDefaultProfile returns profile with trustScore=40, level=0
/Users/kaykim/Documents/GitHub/agent-kay-it/bkit-claude-code/lib/core/state-store.js:155
        throw e;
        ^

Error: ENOENT: no such file or directory, open '/private/var/folders/r9/fbtgppdn7t7f_04mvv64n8_w0000gn/T/bkit-cp-test-8954-1784005107568/.bkit/runtime/loop-counters.json.lock'
    at Object.openSync (node:fs:556:18)
    at Object.writeFileSync (node:fs:2412:35)
    at lock (/Users/kaykim/Documents/GitHub/agent-kay-it/bkit-claude-code/lib/core/state-store.js:151:10)
    at lockedUpdate (/Users/kaykim/Documents/GitHub/agent-kay-it/bkit-claude-code/lib/core/state-store.js:212:3)
    at _incrementPersistedCounter (/Users/kaykim/Documents/GitHub/agent-kay-it/bkit-claude-code/lib/control/loop-breaker.js:110:17)
    at Object.recordAction (/Users/kaykim/Documents/GitHub/agent-kay-it/bkit-claude-code/lib/control/loop-breaker.js:186:20)
    at Object.<anonymous> (/Users/kaykim/Documents/GitHub/agent-kay-it/bkit-claude-code/test/integration/control-pipeline.test.js:211:13)
    at Module._compile (node:internal/modules/cjs/loader:1829:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1969:10)
    at Module.load (node:internal/modules/cjs/loader:1552:32) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/private/var/folders/r9/fbtgppdn7t7f_04mvv64n8_w0000gn/T/bkit-cp-test-8954-1784005107568/.bkit/runtime/loop-counters.json.lock'
}

Node.js v26.0.0


## Verdict

**39 TESTS FAILED** - Issues must be resolved before release.
