---
template: qa-report
version: 2.1.1
variables:
  - feature
  - date
  - verdict
  - passRate
  - criticalCount
---

# QA Report: {feature}

> **Date**: {date}
> **Verdict**: {verdict}
> **Pass Rate**: {passRate}%
> **Critical Issues**: {criticalCount}
> **Feature**: {feature}

---

## 1. Test Summary

| Level | Type | Status | Pass Rate | Failed |
|-------|------|:------:|:---------:|:------:|
| L1 | Unit Test | | | |
| L2 | API Test | | | |
| L3 | E2E Test | | | |
| L4 | UX Flow Test | | | |
| L5 | Data Flow Test | | | |

## 2. Failed Tests

<!-- List each failed test with error details -->

## 3. Critical Issues

<!-- Critical failures requiring immediate fix -->

## 4. Debug Analysis

<!-- Runtime error analysis, logging recommendations -->

## 5. Metrics

| Metric | Value |
|--------|-------|
| M11 QA Pass Rate | |
| M12 Test Coverage (L1) | |
| M13 E2E Coverage | |
| M14 Runtime Error Count | |
| M15 Data Flow Integrity | |

## 6. Recommendations

<!-- Improvement recommendations based on test results -->

## 7. Chrome MCP Status

<!-- Chrome availability, tools used, fallback notes -->

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | {date} | Initial QA report |
