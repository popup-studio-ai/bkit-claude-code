# RTK 사상 차용 bkit 고도화 계획

> **Status**: 📋 Plan Complete
> **Feature**: rtk-inspired-bkit-enhancement
> **Created**: 2026-04-07
> **Priority**: P0-P1 항목 우선

---

## 1. 목표

RTK(Rust Token Killer)의 핵심 사상 4가지를 bkit에 내재화하여 토큰 효율성을 체계적으로 개선한다.

| RTK 사상 | bkit 적용 | 핵심 ENH |
|----------|----------|----------|
| Declarative Pipeline | Hook 출력 선언적 필터 | ENH-R01, R09 |
| Measure Everything | 토큰 추적 시스템 | ENH-R02, R14, R15 |
| Invisible Proxy | Agent 출력 압축 프레임워크 | ENH-R03, R06 |
| Trust-before-Load | 프로젝트 로컬 스킬 신뢰 게이트 | ENH-R12 |

---

## 2. 범위 (Scope)

### 2.1 In Scope (28건)

- **P0 (3건)**: ENH-R01 (Hook 필터), ENH-R02 (토큰 추적), ENH-R03 (Agent 압축)
- **P1 (8건)**: ENH-R04~R11 (중복 통합, MCP 압축, 안전성, 렌더링, 예산)
- **P2 (10건)**: ENH-R12~R21 (보안, 학습, 대시보드, 캐시)
- **P3 (7건)**: ENH-R22~R28 (모니터링/참고)

### 2.2 Out of Scope

- RTK 바이너리 직접 통합 (RTK는 별도 도구로 공존)
- Rust 포팅 (YAGNI FAIL)
- 멀티 AI 도구 지원 (YAGNI FAIL)
- TOML 파일 포맷 도입 (JSON이 bkit 에코시스템에 적합)

---

## 3. 실행 계획

### Phase 1: 즉시 적용 (Week 1)

| 순서 | ENH | 작업 | 신규 파일 | 수정 파일 |
|------|-----|------|----------|----------|
| 1 | R01 | Hook 출력 필터 파이프라인 | `lib/core/output-filter.js` | `lib/core/io.js` |
| 2 | R08 | Graceful Degradation 표준화 | `lib/core/hook-safety.js` | 57 scripts (try-catch 래핑) |

### Phase 2: 단기 적용 (Week 2)

| 순서 | ENH | 작업 | 변경 |
|------|-----|------|------|
| 3 | R02 | 토큰 추적 시스템 | `lib/core/token-tracker.js` 신규 |
| 4 | R04 | PDCA Eval 통합 (6→1) | `agents/pdca-evaluator.md` 신규, 5 agents 삭제 |
| 5 | R05 | Phase Stop 통합 (11→1) | `scripts/unified-phase-stop.js` 신규, 11 scripts 삭제 |
| 6 | R09 | 선언적 Hook 출력 설정 | `hooks/output-config.json` 신규 |

### Phase 3: 중기 적용 (Week 3-4)

| 순서 | ENH | 작업 | 의존성 |
|------|-----|------|--------|
| 7 | R03 | Agent 출력 압축 프레임워크 | R02 |
| 8 | R06 | MCP 서버 응답 압축 | ENH-176 |
| 9 | R07 | 상태 파일 선택적 읽기 | 없음 |
| 10 | R10 | 5-Level 렌더링 | R02 |
| 11 | R11 | 토큰 예산 관리자 | R02 |

### Phase 4: 장기 검토 (Month 2+)

ENH-R12 ~ R21 (데이터 축적 후 우선순위 재평가)

---

## 4. 성공 기준

| 메트릭 | 목표 | 측정 방법 |
|--------|------|----------|
| Hook 출력 토큰 | 50% 절감 | ENH-R02 토큰 추적기 |
| auto-compact 빈도 | 30% 감소 | 세션 로그 분석 |
| 코드 라인 수 | -3,000 LOC | `wc -l` 비교 |
| Agent 정의 수 | 32 → 27 | `ls agents/ \| wc -l` |
| Phase Stop 스크립트 | 11 → 1 | `ls scripts/phase*-stop.js \| wc -l` |

---

## 5. 리스크

| 리스크 | 심각도 | 완화 방안 |
|--------|--------|----------|
| Hook 필터가 중요 정보를 잘라냄 | 🔴 High | 필터 적용 전 원본 audit 저장 + `verbose` 모드 유지 |
| Agent 출력 압축이 LLM 판단에 영향 | 🔴 High | A/B 비교 테스트 후 적용 + 점진적 압축률 조정 |
| PDCA Eval 통합 시 phase별 뉘앙스 손실 | 🟡 Medium | phase 파라미터로 분기 로직 보존 |
| Phase Stop 통합 시 regression | 🟡 Medium | 기존 11개 스크립트의 테스트 케이스 이관 |

---

## 6. 참고 문서

- [RTK GitHub Repository](https://github.com/rtk-ai/rtk)
- [종합 분석 보고서](../04-report/features/rtk-inspired-bkit-enhancement-analysis.report.md)
- [bkit 아키텍처 분석 (2026-03-29)](../../memory/bkit_architecture_analysis_20260329.md)
