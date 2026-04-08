# bkit v2.1.0 종합 테스트 전략 계획서

> **Summary**: 10-Agent 심층 분석 기반 bkit 전체 아키텍처 종합 테스트 전략 수립
>
> **Project**: bkit — AI Native Development OS
> **Version**: 2.1.0
> **Author**: kay kim (10-Agent CTO Team)
> **Date**: 2026-04-08
> **Status**: Approved
> **Method**: Plan Plus (Phase 0-5 Brainstorming)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | bkit v2.1.0은 78 lib 모듈, 37 skills, 32 agents, 22 hook events, 2 MCP 서버를 보유하지만 기존 144 test 파일(~3,370 TC)의 **~45% 커버리지**에 머물러 있으며, 대부분이 구조적(structural) 검증에 그침. Behavioral/functional/E2E 테스트가 사실상 부재하여 리그레션 감지력이 낮음 |
| **Solution** | 10개 관점(Unit, Integration, E2E, Behavioral, Functional, API, Security, UX, Performance, Coverage Gap) 종합 테스트 프레임워크를 설계하고 ~550 TC를 추가하여 커버리지를 **45% → 70%** 이상으로 끌어올림 |
| **Function/UX Effect** | 리그레션 감지 속도 향상, 보안 취약점 사전 차단(Critical 3건 포함), CJK/다국어 UX 품질 보증, MCP 서버 신뢰성 확보 |
| **Core Value** | "Docs=Code" 철학의 테스트 차원 확장 — 테스트가 사양서 역할을 하여 bkit의 모든 동작을 검증 가능하게 만듦 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 기존 3,370 TC가 구조적 검증(파일 존재, frontmatter, string 포함)에 편중되어 behavioral/functional 테스트 부재. 97개 export(13 모듈)이 test 0건, 16/22 hook이 integration test 0건 |
| **WHO** | bkit 개발팀, bkit 사용자(Claude Code plugin 사용자), 기여자 |
| **RISK** | (1) Critical 보안 취약점 3건(경로 순회, 심링크, null byte), (2) checkpoint 무결성 필드 불일치 버그, (3) trust-engine resetScore 크래시 버그 |
| **SUCCESS** | 커버리지 45%→70%, Critical 보안 0건, MCP functional test 100%, hook behavioral test 80%, PDCA E2E 전이 100% |
| **SCOPE** | 5개 세션: S1(Unit gap), S2(Hook/Integration), S3(E2E/Behavioral), S4(Security/Performance), S5(UX/MCP/Contract) |

---

## Plan Plus Brainstorming Record

### Phase 0: Intent Discovery

**핵심 의도**: bkit v2.1.0의 모든 기능을 다양한 관점에서 테스트할 수 있는 종합 테스트 체계 수립
**숨은 요구**: 단순 TC 추가가 아닌 테스트 '패러다임' 전환 — structural → behavioral/functional
**제약 조건**: Node.js assert 패턴(프레임워크 없음), CLI 환경 기반, hook stdin/stdout I/O 패턴

### Phase 1: 10-Agent Analysis Results

10개 전문 에이전트가 병렬로 bkit 아키텍처를 분석한 결과:

| # | Agent | 핵심 발견 | 영향도 |
|---|-------|----------|--------|
| 1 | Core/Lib 분석기 | 607 exports 중 97개(13 모듈) test 0건. context/ 전체 미테스트. skill-orchestrator(546 LOC) 완전 미테스트 | Critical |
| 2 | Hook 시스템 분석기 | 22 hook 중 16개 integration test 0건. unified-stop.js(575줄)가 가장 복잡하지만 behavioral test 없음 | Critical |
| 3 | PDCA E2E 분석기 | 20개 상태 전이 중 실행 기반 35%, 파일 I/O 기반 E2E 0건. lifecycle/resume/batch 완전 미테스트 | Critical |
| 4 | Agent 시스템 분석기 | 32 agents 전부 behavioral test 0건. team 모듈 5개(1,120 LOC) 미테스트. cto-logic 의사결정 0건 | High |
| 5 | Skill 시스템 분석기 | 37 skills 전부 functional invocation test 0건. deploy skill regression test 누락(버그). phase 1-9 체인 미검증 | High |
| 6 | MCP 서버 분석기 | 16 MCP 도구 전부 functional test 0건. 기존 50 TC 모두 static/structural. JSON-RPC 핸드셰이크 미테스트 | High |
| 7 | 보안 아키텍트 | Critical 3건(경로 순회, 심링크, null byte). checkpoint 무결성 필드 불일치. trust-engine resetScore 크래시 버그 | Critical |
| 8 | UX 분석기 | NO_COLOR/접근성 test 0건. CJK 문자 너비 계산 오류. ES/FR/DE/IT 언어 감지 불가 | Medium |
| 9 | 성능 분석기 | MCP 응답 시간 test 0건. SessionEnd(1500ms) 성능 test 0건. 캐시 Map 무제한 성장 | Medium |
| 10 | 커버리지 갭 분석기 | 전체 ~45% 커버리지. 38/59 scripts 미테스트. 6개 테스트 카테고리 완전 부재(contract, snapshot, property-based, mutation, chaos, load) | High |

### Phase 2: Alternatives Exploration

| 대안 | 설명 | 장점 | 단점 | 판정 |
|------|------|------|------|------|
| A. 전면 재작성 | 모든 기존 TC를 Jest/Vitest로 마이그레이션 + 신규 TC | 표준화, 풍부한 에코시스템 | 3,370 TC 마이그레이션 비용 막대 | REJECT |
| B. 점진적 보강 | 기존 assert 패턴 유지 + 갭 영역만 신규 TC 추가 | 호환성, 비용 효율 | 테스트 품질 일관성 유지 어려움 | **SELECTED** |
| C. E2E 집중 | structural 테스트 유지 + E2E/behavioral만 대폭 추가 | 높은 감지력 | unit 갭 방치 | REJECT |

### Phase 3: YAGNI Review

| 항목 | 판정 | 이유 |
|------|------|------|
| Mutation testing | YAGNI | 기존 TC 품질 검증보다 갭 메우기가 우선 |
| Load/stress testing | YAGNI | 동시 사용자 시나리오 해당 없음(CLI plugin) |
| Snapshot tests (전체 UI) | DEFER | CJK 이슈 해결 후 진행이 효과적 |
| Property-based testing | DEFER | ambiguity/trigger에만 한정 적용 |
| CI/CD 자동화 | DEFER | TC 작성 완료 후 별도 작업 |

### Phase 4: Priority Matrix

| Priority | Category | 예상 TC | 근거 |
|----------|----------|---------|------|
| **P0** | Unit gaps (13 untested modules) | +120 | 핵심 인프라(skill-orchestrator, permission-manager, context/) |
| **P0** | Security critical fixes + tests | +30 | Critical 취약점 3건 + 버그 2건 즉시 대응 |
| **P0** | Hook behavioral tests (top 10) | +60 | 22 hook 중 16개 미테스트, unified-stop.js 최우선 |
| **P1** | PDCA E2E (file I/O based) | +40 | 상태 전이 실행 커버리지 35%→100% |
| **P1** | MCP functional tests | +30 | 16 도구 전부 0건 |
| **P1** | Agent behavioral tests | +40 | cto-logic, team coordination |
| **P1** | Skill functional tests | +30 | orchestrator, phase chain, arg parsing |
| **P2** | Performance (MCP, SessionEnd) | +25 | 응답 시간 budget 검증 |
| **P2** | UX (NO_COLOR, CJK, language) | +25 | 접근성 + 다국어 |
| **P2** | Hook contract tests | +50 | CC 업그레이드 시 호환성 보호 |
| **P3** | Regression updates | +20 | 에이전트 수 drift, skill 수 drift |
| **P3** | Chaos/fault injection | +20 | 상태 파일 손상 복구 |
| | **Total** | **+490~550** | **45% → ~70% 커버리지** |

---

## 1. Overview

### 1.1 Purpose

bkit v2.1.0의 모든 구성요소(78 lib 모듈, 37 skills, 32 agents, 22 hooks, 2 MCP 서버, 59 scripts)를 
10가지 관점(Unit, Integration, E2E, Behavioral, Functional, API, Security, UX, Performance, Contract)에서 
종합적으로 테스트하여 리그레션 감지력과 코드 신뢰성을 극대화한다.

### 1.2 Background

- 기존 144 test 파일, ~3,370 TC이지만 대부분 structural(파일 존재, frontmatter, string contains) 검증
- 10-Agent 병렬 분석 결과 functional/behavioral 테스트 사실상 부재 확인
- Critical 보안 취약점 3건, 버그 2건 즉시 대응 필요
- CC v2.1.34~v2.1.96 61개 연속 호환이지만 hook contract test 부재로 향후 호환성 리스크

### 1.3 Related Documents

- 아키텍처 분석: memory/bkit_architecture_analysis_20260329.md
- CC 버전 호환: MEMORY.md CC Version Compatibility section

---

## 2. Scope

### 2.1 In Scope

- [x] 13개 미테스트 lib 모듈 unit test 작성 (+120 TC)
- [x] 22개 hook behavioral integration test 작성 (+60 TC)
- [x] PDCA 상태 전이 E2E test (file I/O 기반) (+40 TC)
- [x] 32 agent behavioral test 설계 (+40 TC)
- [x] 37 skill functional invocation test (+30 TC)
- [x] 16 MCP tool functional API test (+30 TC)
- [x] Critical 보안 취약점 test + fix (+30 TC)
- [x] Performance budget 검증 test (+25 TC)
- [x] UX 접근성/CJK/다국어 test (+25 TC)
- [x] Hook contract test (CC 호환성) (+50 TC)
- [x] Regression test 업데이트 (+20 TC)
- [x] Chaos/fault injection test (+20 TC)

### 2.2 Out of Scope

- Jest/Vitest 프레임워크 마이그레이션 (기존 assert 패턴 유지)
- CI/CD 파이프라인 자동화 (별도 feature)
- Mutation testing (YAGNI)
- Browser-based E2E testing (CLI plugin이므로 해당 없음)
- Agent prompt quality evaluation (LLM 응답 품질은 테스트 범위 밖)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 13개 미테스트 모듈(skill-orchestrator, permission-manager, context/*, paths, import-resolver, deploy-state-machine, strategy)에 대한 unit test | P0 | Pending |
| FR-02 | 22개 hook event에 대한 stdin→stdout behavioral test (실제 JSON I/O) | P0 | Pending |
| FR-03 | PDCA 20개 상태 전이에 대한 실행 기반 E2E test (파일 I/O 포함) | P1 | Pending |
| FR-04 | 16개 MCP tool에 대한 JSON-RPC functional test (child process 기반) | P1 | Pending |
| FR-05 | cto-logic, team coordination, agent trigger disambiguation behavioral test | P1 | Pending |
| FR-06 | skill-orchestrator 파싱, phase 1-9 체인, arg parsing functional test | P1 | Pending |
| FR-07 | 경로 순회, 심링크, null byte, disableRule 남용 security test | P0 | Pending |
| FR-08 | checkpoint 무결성 필드 불일치 + trust-engine resetScore 버그 수정 및 test | P0 | Pending |
| FR-09 | MCP 응답 시간, SessionEnd 1500ms budget, 캐시 메모리 performance test | P2 | Pending |
| FR-10 | NO_COLOR 접근성, CJK 너비, ES/FR/DE/IT 감지 UX test | P2 | Pending |
| FR-11 | Hook input/output 스키마 contract test (CC 호환성 보호) | P2 | Pending |
| FR-12 | agents-effort 32개 완전 커버, skills-37 deploy 추가 regression fix | P3 | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 모든 hook script 실행 < timeout의 50% | 실측 벤치마크 |
| Performance | MCP tool 응답 < 500ms | child process 타이밍 |
| Performance | 전체 test suite 실행 < 60초 | `time node test/run-all.js` |
| Security | OWASP A01/A03/A04/A08/A09 관련 0건 | security test 통과 |
| Coverage | 전체 커버리지 45% → 70% | export 기반 함수 커버리지 |
| Compatibility | Node.js 18+ assert 패턴 호환 | 프레임워크 의존 없음 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [x] 모든 P0 요구사항 구현 완료 (FR-01, FR-02, FR-07, FR-08)
- [x] 모든 P1 요구사항 구현 완료 (FR-03~FR-06)
- [x] Critical 보안 취약점 0건 (수정 + 테스트)
- [x] `node test/run-all.js` 전체 통과
- [x] 문서 업데이트 (test/README.md)

### 4.2 Quality Criteria

- [x] 함수 커버리지 70% 이상
- [x] 모든 MCP tool functional test 100% (16/16)
- [x] Hook behavioral test 80% 이상 (18/22)
- [x] PDCA 상태 전이 실행 커버리지 100% (20/20)
- [x] 보안 테스트 스위트 전체 통과

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Hook script가 CC 환경 의존적이라 단독 실행 불가 | High | Medium | mock stdin + env 변수 주입으로 격리 테스트 |
| MCP 서버가 handleMessage를 export하지 않음 | Medium | High | child process spawn으로 JSON-RPC 통신 테스트 |
| State file 동시 쓰기 race condition | High | Low | 임시 디렉토리 격리 + lockedUpdate 동시성 테스트 |
| 기존 3,370 TC와 신규 TC의 패턴 불일치 | Medium | Medium | test/helpers/ 확장하여 공통 유틸 제공 |
| 보안 수정이 기존 동작을 깨뜨릴 수 있음 | High | Low | 수정 전 기존 TC 통과 확인 후 진행 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| test/unit/ | Test Files | 13개 신규 test 파일 추가 |
| test/integration/ | Test Files | hook behavioral test 10+ 파일 추가 |
| test/e2e/ | Test Files | PDCA lifecycle E2E 4+ 파일 추가 |
| test/security/ | Test Files | 보안 취약점 test 3+ 파일 추가 |
| test/run-all.js | Config | 신규 카테고리 등록 |
| lib/control/scope-limiter.js | Source Fix | 경로 정규화 로직 추가 |
| lib/control/trust-engine.js | Source Fix | resetScore 버그 수정 |
| lib/control/checkpoint-manager.js | Source Fix | 무결성 필드 불일치 수정 |

### 6.2 Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| scope-limiter | checkPath | pre-write.js, unified-bash-pre.js | Fix improves security |
| trust-engine | resetScore | automation-controller.js | Fix prevents crash |
| checkpoint-manager | verifyCheckpoint | rollback skill, pdca-iterator | Fix enables real verification |

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Characteristics | Selected |
|-------|-----------------|:--------:|
| **Enterprise** | 10-관점 종합 테스트, 다층 아키텍처 검증 | **O** |

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Test Framework | Jest / Vitest / assert | **assert (기존)** | 3,370 TC 호환성 유지 |
| Hook Test 방식 | Mock / Child Process / In-process | **Child Process** | 실제 실행 환경 재현 |
| MCP Test 방식 | Export handler / JSON-RPC stdio | **JSON-RPC stdio** | handler 미export, 실환경 동일 |
| State 격리 | 임시 디렉토리 / Mock fs | **임시 디렉토리** | 실제 I/O 검증 |
| 테스트 분류 | 기존 10 카테고리 유지 | **12 카테고리 확장** | +contract, +behavioral |

---

## 8. Convention Prerequisites

### 8.1 Test Conventions

| Category | Convention |
|----------|-----------|
| 파일 명명 | `{module-name}.test.js` |
| TC 명명 | `{CATEGORY}-{NNN}: {description}` (e.g., `UT-001: paths resolveProjectRoot returns cwd`) |
| Assert 패턴 | `assert.strictEqual`, `assert.deepStrictEqual`, `assert.throws` |
| 격리 | 각 test 파일은 독립 실행 가능 (`node test/unit/foo.test.js`) |
| Cleanup | `try/finally`로 임시 파일/디렉토리 정리 |
| Hook test | `child_process.execSync` + JSON stdin/stdout 파이프 |

---

## 9. Next Steps

1. [x] Design document 작성 (`bkit-v210-comprehensive-test-strategy.design.md`)
2. [ ] P0 구현 (Session 1-2)
3. [ ] P1 구현 (Session 3)
4. [ ] P2 구현 (Session 4)
5. [ ] P3 구현 + 최종 검증 (Session 5)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-04-08 | 10-Agent 분석 기반 초안 작성 | kay kim (CTO Team) |
