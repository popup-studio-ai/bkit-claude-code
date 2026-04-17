# bkit v2.0.5 Comprehensive Test Report

> Generated: 2026-04-17T05:47:55.486Z
> Total: 3233 TC, 3218 PASS, 3 FAIL, 12 SKIP
> Pass Rate: 99.5%

---

## Summary

| Category | Total | Passed | Failed | Skipped | Rate |
|----------|:-----:|:------:|:------:|:-------:|:----:|
| Unit Tests | 1313 | 1312 | 1 | 0 | 99.9% FAIL |
| Integration Tests | 504 | 504 | 0 | 0 | 100.0% PASS |
| Security Tests | 218 | 217 | 1 | 0 | 99.5% FAIL |
| Regression Tests | 518 | 510 | 0 | 8 | 98.5% PASS |
| Performance Tests | 140 | 136 | 0 | 4 | 97.1% PASS |
| Philosophy Tests | 139 | 139 | 0 | 0 | 100.0% PASS |
| UX Tests | 160 | 160 | 0 | 0 | 100.0% PASS |
| E2E Tests (Node) | 61 | 61 | 0 | 0 | 100.0% PASS |
| Architecture Tests | 100 | 99 | 1 | 0 | 99.0% FAIL |
| Controllable AI Tests | 80 | 80 | 0 | 0 | 100.0% PASS |
| behavioral | 0 | 0 | 0 | 0 | 0.0% PASS |
| contract | 0 | 0 | 0 | 0 | 0.0% PASS |
| **Total** | **3233** | **3218** | **3** | **12** | **99.5%** |

## Version Comparison: v1.6.2 → v2.0.0

| Metric | v1.6.2 | v2.0.0 | Delta |
|--------|:------:|:------:|:-----:|
| Categories | 8 | 12 | +4 |
| Total TC | 1151 | 3233 | +2082 |
| Unit Tests | 450 | 1313 | +863 |
| Integration Tests | 130 | 504 | +374 |
| Security Tests | 80 | 218 | +138 |
| Regression Tests | 200 | 518 | +318 |
| Performance Tests | 76 | 140 | +64 |
| Philosophy Tests | 60 | 139 | +79 |
| UX Tests | 60 | 160 | +100 |
| E2E Tests (Node) | 20 | 61 | +41 |
| Architecture Tests | N/A | 100 | NEW |
| Controllable AI Tests | N/A | 80 | NEW |
| behavioral | N/A | 0 | NEW |
| contract | N/A | 0 | NEW |

## Failures

### Security Tests

- **security/integrity-verification.test.js**: Execution error: Command failed: node "/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/test/security/integrity-verification.test.js"
  FAIL IV-01: trust-engine resetScore does not crash (uses levelHistory, not profile.events)
    Expected values to be strictly equal:
+ actual - expected

+ undefined
- 'score_reset'

  FAIL IV-08: checkpoint-manager createCheckpoint stores pdcaStatusHash
    pdcaStatus should match written status
+ actual - expected

+ null
- {
-   features: {
-     test: {
-       phase: 'plan'
-     }
-   }
- }



### Architecture Tests

- **MD-011**: core/ modules only depend on other core/ modules (DAG root)

## Verdict

**3 TESTS FAILED** - Issues must be resolved before release.
