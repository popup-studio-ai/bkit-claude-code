# bkit v1.6.1 Comprehensive Test Design

> 1020 TC Test Design Document
> Plan Reference: docs/01-plan/features/bkit-v161-comprehensive-test.plan.md
> Date: 2026-03-08

---

## 1. Test Architecture

### 1.1 Layer Structure

```
Layer 1: Node Direct (940 TC, $0)
├── test/unit/          8 files, 400 TC
├── test/integration/   4 files, 120 TC
├── test/security/      4 files, 80 TC
├── test/regression/    5 files, 150 TC
├── test/performance/   4 files, 70 TC
├── test/philosophy/    4 files, 60 TC
├── test/ux/            5 files, 48 TC (auto portion)
└── test/e2e/           1 file, 20 TC (node eval only)

Layer 2: claude -p (68 TC, ~$15-40)
└── test/e2e/run-e2e.sh  60 TC PDCA/Skills/Agents + 8 TC Full Cycle

Layer 3: Manual (12 TC)
└── Checklist: UX subjective (8) + Philosophy judgment (4)
```

### 1.2 File Structure (35 test files)

```
test/
├── run-all.js                          # Master runner
├── helpers/
│   ├── assert.js                       # Test assertion utilities
│   ├── timer.js                        # Performance measurement
│   └── report.js                       # Report generator
├── unit/
│   ├── ambiguity.test.js               # 50 TC
│   ├── trigger.test.js                 # 40 TC
│   ├── creator.test.js                 # 35 TC
│   ├── orchestrator.test.js            # 45 TC
│   ├── coordinator.test.js             # 50 TC
│   ├── runner.test.js                  # 60 TC
│   ├── reporter.test.js               # 25 TC
│   └── other-modules.test.js           # 95 TC
├── integration/
│   ├── config-sync.test.js             # 30 TC
│   ├── module-chain.test.js            # 30 TC
│   ├── hook-chain.test.js              # 30 TC
│   └── export-compat.test.js           # 30 TC
├── security/
│   ├── agent-frontmatter.test.js       # 35 TC
│   ├── config-permissions.test.js      # 15 TC
│   ├── runtime-security.test.js        # 20 TC
│   └── destructive-prevention.test.js  # 10 TC
├── regression/
│   ├── pdca-core.test.js               # 30 TC
│   ├── skills-28.test.js               # 56 TC
│   ├── agents-21.test.js               # 42 TC
│   ├── hooks-10.test.js                # 10 TC
│   └── cc-compat.test.js               # 12 TC
├── performance/
│   ├── hook-perf.test.js               # 15 TC
│   ├── core-function-perf.test.js      # 25 TC
│   ├── benchmark-perf.test.js          # 15 TC
│   └── module-load-perf.test.js        # 15 TC
├── philosophy/
│   ├── no-guessing.test.js             # 20 TC
│   ├── automation-first.test.js        # 15 TC
│   ├── docs-equals-code.test.js        # 15 TC
│   └── security-by-default.test.js     # 10 TC
├── ux/
│   ├── clarification-flow.test.js      # 15 TC
│   ├── team-mode-ux.test.js            # 10 TC
│   ├── pdca-status-ux.test.js          # 10 TC
│   ├── language-support.test.js        # 15 TC
│   └── executive-summary.test.js       # 10 TC
└── e2e/
    ├── eval-benchmark.test.js          # 20 TC (node)
    └── run-e2e.sh                      # 60 TC (claude -p)
```

### 1.3 Shared Test Utilities

| File | Purpose | Exports |
|------|---------|---------|
| helpers/assert.js | Assertion framework | assert, skip, assertThrows, assertNoThrow, assertType, assertDeepEqual, summary, reset |
| helpers/timer.js | Performance measurement | measureTime, measureTimeAsync, formatMs |
| helpers/report.js | Report generation | generateReport, saveReport |

---

## 2. Design Decisions

### 2.1 No External Dependencies
- console.assert 기반 (jest/vitest 미사용)
- bkit 원칙: 외부 의존성 최소화
- Node.js 내장 모듈만 사용 (fs, path, child_process, perf_hooks)

### 2.2 Test Isolation
- 각 테스트 파일이 독립 실행 가능 (`node test/unit/ambiguity.test.js`)
- 파일 간 상태 공유 없음
- cleanup: 테스트 생성 파일 자동 삭제

### 2.3 Module Loading Strategy
- `require()` 로 실제 모듈 로드
- 모듈 로드 실패 시 graceful error (SKIP 처리)
- Mock 없음 — 실제 모듈 동작 검증

### 2.4 Performance Test Methodology
- `performance.now()` (perf_hooks) 사용
- 100회 반복 평균 (핵심 함수)
- 단일 실행 (벤치마크, 모듈 로드)
- 기준선: 동일 환경 이전 측정값 대비

---

## 3. TC Count Verification

| Category | Files | TC/File | Total |
|----------|:-----:|:-------:|:-----:|
| Unit | 8 | 50/40/35/45/50/60/25/95 | 400 |
| Integration | 4 | 30/30/30/30 | 120 |
| Security | 4 | 35/15/20/10 | 80 |
| Regression | 5 | 30/56/42/10/12 | 150 |
| Performance | 4 | 15/25/15/15 | 70 |
| Philosophy | 4 | 20/15/15/10 | 60 |
| UX | 5 | 15/10/10/15/10 | 60 |
| E2E | 2 | 20/60 | 80 |
| **Total** | **36** | | **1020** |

---

## 4. Execution Strategy

### 4.1 Quick Run (Node Only, ~60s)
```bash
node test/run-all.js
# Runs 940 TC, generates report
```

### 4.2 Full Run (Node + claude -p, ~30min)
```bash
node test/run-all.js && bash test/e2e/run-e2e.sh
# Runs 1020 TC, generates comprehensive report
```

### 4.3 Selective Run
```bash
node test/run-all.js --unit          # 400 TC
node test/run-all.js --security      # 80 TC
node test/run-all.js --regression    # 150 TC
```

---

## 5. Pass Criteria

| Category | Required Rate | Blocker |
|----------|:------------:|:-------:|
| Unit | 100% | Yes |
| Integration | 100% | Yes |
| Security | 100% | Yes |
| E2E | >= 95% | Yes |
| Regression | 100% | Yes |
| Performance | >= 95% | No |
| Philosophy | 100% | Yes |
| UX | >= 90% | No |
| **Overall** | **>= 99%** | **Yes** |

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-08 | CTO (Main Session) | Initial design, 1020 TC, 36 files |
