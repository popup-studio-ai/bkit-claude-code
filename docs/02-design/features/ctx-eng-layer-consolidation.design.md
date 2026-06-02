# S3b — Layer/Pipeline Consolidation 설계서

> **Sprint**: `ctx-eng-layer-consolidation` (S3b) · **Trust**: L4 · **ENH**: ENH-349~354
> **Date**: 2026-06-02 · **선행**: plan + 본 세션 전수 구조 실측

---

## 1. 설계 원칙

1. **Evidence over estimate**: 통합은 "구조 카운트"가 아니라 "코드 검증된 actionable redundancy"에만. 검증 결과 redundancy 0 → 통합 0.
2. **Capability 보존 최우선**(Anti-Mission): 개념적 8-layer 모델·의도적 병렬 도메인(PDCA∥Sprint)은 절대 병합 안 함.
3. **No churn-for-churn**: import 깨짐 위험 > 이득인 통합(단일모듈 subdir 병합, 1줄 fence 공유화)은 거부.
4. **Document, don't mutate**: 아키텍처가 의도적 factoring임을 ADR로 lock → 향후 잘못된 통합 시도 방지.
5. **Invariant 검증**: simplicity invariant §8을 측정으로 확인(이미 충족).

## 2. 결정 매트릭스 (통합 후보별 — design 확정)

| 후보 | redundancy? | 조치 | 근거 |
|------|------------|------|------|
| 22 lib subdir | No | 유지 | 22≤22; 단일모듈 subdir = distinct feature/진입점 |
| 8-layer context eng | No(개념) | 유지 + ADR | AI-NATIVE §205-212 capability map; 병합=손실 |
| 8 Port + 7 adapter | No | 유지 | 전부 distinct DDD 계약 |
| frontmatter 파서 | 기통합 | 유지 | util/frontmatter v2.1.18 + markdown-parse v2.1.19 |
| 동일 basename (executive-summary/transitions/phases) | No | 유지 | pdca∥sprint 의도적 병렬 |
| S3a 6 신규 모듈 | No | 유지 | lib/pdca/·scripts/lib/ 적절 배치 |

**통합 실행: 0건.** (S4의 "removal 0건"과 동형 — verify+document 스프린트.)

## 3. ENH-353 산출물: ADR 0013

`docs/adr/0013-context-engineering-factoring.md` — Context Engineering 구조가 의도적 factoring임을 영구 기록:
- 8 conceptual layers = capability map (코드 병합 대상 아님)
- 8 Port↔Adapter = Clean Architecture DIP (distinct 계약)
- PDCA∥Sprint 병렬 도메인 = 의도적 분리
- frontmatter 통합은 v2.1.18 CO-5 + v2.1.19 S3에서 완료
- "추가 통합 비실행" 사유: capability 보존 + churn>benefit + 255 assertion 위험
- 향후 통합 트리거 조건: 동일-목적 모듈이 2+ 독립 구현으로 분기할 때만(현재 해당 없음)

## 4. Test/검증 Plan
| Level | 항목 | 방법 |
|-------|------|------|
| invariant | god-file 0 / subdir ≤22 / module 순증 ≤+10 / layer 8 보존 | wc/ls/find |
| L4 contract | 255(v2.1.16)/234(v2.1.9) 불변 | contract-test-run L1+L4 |
| L4 deadcode | Dead=0 | check-deadcode |
| L3 회귀 | baseline 7 동일 | tests/qa+tests/contract comm |
| L5 | 전체 시스템 건전성 | verify-full-system(module/hook/agent/hooks.json) |

## 5. API Contract (M4)
**코드 변경 0건**(ADR 문서만 추가) → 모든 export/시그니처/모듈 불변. **M4 = 100**.

## 6. Self-Assessment (M8)
Context Anchor ✅ / 전수 실측 결정 매트릭스 ✅ / capability 보존 논거 ✅ / ADR 산출 계획 ✅ / 검증 plan ✅ / 정직성(통합 0 + 근거) ✅. **M8 = 90**.

> **Status**: Design 완료 — do phase (ADR 작성 + 검증).
