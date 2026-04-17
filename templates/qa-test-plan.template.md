---
template: qa-test-plan
version: 2.1.1
variables:
  - feature
  - date
---

# Test Plan: {feature}

> **Date**: {date}
> **Feature**: {feature}
> **Design Doc**: docs/02-design/features/{feature}.design.md

---

## 1. Test Scope

### In Scope
<!-- List features and behaviors to test -->

### Out of Scope
<!-- Explicitly excluded items -->

## 2. Test Items

### L1: Unit Tests

| ID | Target | Description | Priority | Test Data |
|----|--------|-------------|----------|-----------|
| L1-001 | | | | |

### L2: API Tests

| ID | Endpoint | Method | Description | Priority |
|----|----------|--------|-------------|----------|
| L2-001 | | | | |

### L3: E2E Tests

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|-----------------|----------|
| L3-001 | | | | |

### L4: UX Flow Tests

| ID | User Journey | Steps | Expected Result | Priority |
|----|-------------|-------|-----------------|----------|
| L4-001 | | | | |

### L5: Data Flow Tests

| ID | Direction | Steps | Validation | Priority |
|----|-----------|-------|------------|----------|
| L5-001 | UI→API→DB | | | |
| L5-002 | DB→API→UI | | | |

## 3. Test Data Requirements

<!-- Required test data, fixtures, mock data -->

## 4. Dependencies

<!-- External dependencies: Chrome MCP, DB, Auth, etc. -->

## 5. Coverage Target

| Level | Target |
|-------|--------|
| L1 | 100% of critical paths |
| L2 | 95% of API endpoints |
| L3 | 90% of user scenarios |
| L4 | Core user journeys |
| L5 | All data write paths |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | {date} | Initial test plan |
