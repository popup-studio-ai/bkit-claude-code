# S3b — Context-Eng Simplification: Layer/Pipeline Consolidation 계획서 (PRD + Plan)

> **Sprint**: `ctx-eng-layer-consolidation` (마스터 플랜 S3b) · **Branch**: `release/v2.1.22-hardening`
> **Trust**: L4 (사용자 지시; master plan 권고 L2) · **Scope**: P1 · **ENH**: ENH-349 ~ ENH-354
> **dependsOn**: S3a(완료) · **estTokens**: ~75K
> **Date**: 2026-06-02 · **Author**: kay kim
> **입력 근거**: 마스터 플랜 §8 simplicity invariant + §10 S3b + 본 세션 전수 구조 실측

---

## 1. Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | S3a가 god-file을 분할(4→0)한 뒤, 마스터 플랜은 22 subdir / 8-layer context engineering / 7 Port↔Adapter의 redundant 통합을 S3b로 예정. **단, 전수 실측 결과 통합할 actionable redundancy가 없음(§2)** — S2/S4와 동일하게 추정(구조 카운트)이 코드 검증과 불일치. |
| **WHO** | bkit 컨트리뷰터(아키텍처 유지보수자), 유지보수성. |
| **WHAT** | ENH-349 subdir 통합 / ENH-350 8-layer pipeline 통합 / ENH-351 Port↔Adapter 통합 / ENH-352 context-injection pipeline 단순화(S3a 모듈 재배치) / ENH-353 단순화 ADR / ENH-354 simplicity invariant 검증. |
| **WHAT NOT** | **capability 제거형 단순화**(Anti-Mission) · 개념적 8-layer 모델 병합(capability 손실) · 의도적 병렬 도메인(PDCA∥Sprint) 혼재 · 이미 통합된 모듈 재통합 · 255 contract assertion 변경 · churn-for-churn(import 깨짐 위험 > 이득). |
| **RISK** | 통합/병합이 다수 import를 깨뜨림(분할보다 광범위 영향). lib/sprint(38 importers) 등 고의존 모듈 병합 시 회귀. → 실측으로 "진짜 redundancy만" 식별, 무이득 통합은 거부. |
| **SUCCESS** | simplicity invariant §8 전 지표 충족 검증 + 아키텍처가 의도적 factoring임을 ADR로 문서화(향후 churn 방지) + capability 보존 + 255/234 assertion 불변 + 회귀 0. |
| **SCOPE** | ENH-349~354, gate M1/M3/M4/S1 + simplicity invariant. |

---

## 2. 전수 구조 실측 (2026-06-02) — 통합 대상 부재 확정

| ENH | 마스터 플랜 추정 | **실측 (코드 검증)** | 판정 |
|-----|----------------|---------------------|------|
| 349 subdir 통합 | 22 redundant 통합 | 22 subdir ≤22 (invariant 이미 충족). 단일모듈 subdir(sprint/evals/discovery/dashboard)는 distinct feature + skill/MCP 진입점(lib/sprint=38 importers). 병합=cosmetic+breakage+clarity↓ | **통합 없음** |
| 350 8-layer pipeline | layer 통합(≤8) | "8-layer"는 **개념적 아키텍처 모델**(AI-NATIVE §205-212: L1 Skills/L2 Agents/L3 State/L4 Injection/L5 Controllable/L6 Quality/L7 Feedback/L8 Sprint). 코드 구조 아님. 병합=capability 제거(Anti-Mission 위반) | **통합 불가(개념)** |
| 351 Port↔Adapter | 7 redundant 통합 | Port **8개**(audit-sink/caching-cost/cc-payload/docs-code-index/mcp-tool/regression-registry/state-store/token-meter) 전부 distinct DDD 계약, 각 adapter 매칭(regression-registry는 직접구현). redundancy 0 | **통합 없음** |
| 352 frontmatter/pipeline | context-injection 단순화 | frontmatter 파싱은 **이미 통합 완료**: `lib/util/frontmatter.js`(v2.1.18 CO-5, 5-site 통합) + `lib/util/markdown-parse.js`(v2.1.19 S3). docs-code-scanner + 5 baseline 소비처가 실제 require. 잔존 specialized 파서(skill-orchestrator/import-resolver/pattern-matcher/context-init)는 1줄 fence만 공유, 다운스트림 specialized → 병합 무이득+위험. S3a 6 신규 모듈(lib/pdca/ 2 + scripts/lib/ 4) 적절 배치 | **통합 없음(기완료)** |
| (구조) 동일 basename | (redundancy?) | executive-summary(pdca∥sprint), transitions/phases/index(pdca-lifecycle∥sprint-lifecycle) = **의도적 병렬 도메인**. index.js=subdir별 barrel | **의도적, 유지** |

### 2.1 핵심 결론
**bkit Context Engineering 아키텍처는 이미 잘 factored 되어 통합할 actionable redundancy가 없다.** 마스터 플랜 추정(22 subdir/8-layer/7 pair 통합)은 구조 카운트였고, 코드 검증 결과 (a)개념적 모델 (b)distinct DDD (c)이미통합(v2.1.18/19) (d)의도적 병렬 레이어링으로 판명. S3b 가치 = **통합이 아니라 (1)simplicity invariant 검증 (2)의도적 factoring을 ADR로 lock(향후 churn 방지) (3)capability 보존 확인.**

---

## 3. ENH 상세 (실측 기반 재정의)
- **ENH-349**: subdir 통합 — 통합 없음. 22≤22 충족, 단일모듈 subdir은 distinct feature/진입점(safety justification 문서화).
- **ENH-350**: 8-layer — 개념적 모델, capability 보존 위해 비통합. ADR에 "8 conceptual layers = intentional capability map" 기록.
- **ENH-351**: Port↔Adapter — 8 distinct, 통합 없음.
- **ENH-352**: frontmatter/pipeline — 이미 v2.1.18/19 통합. S3a 모듈 재배치 불요(적절 배치). 추가 통합 없음.
- **ENH-353**: **ADR 0013 — Context Engineering Factoring**: 왜 비통합인가(capability 보존 + 기통합 + churn>benefit + 255 assertion 위험) 영구 기록.
- **ENH-354**: simplicity invariant §8 최종 검증(god-file 0/subdir 22/module +2/layer 8 conceptual/255·234/전 gate green).

---

## 4. Phase 로드맵 / 위험은 §1 RISK 참조. 코드 변경 0/minimal, 검증+ADR 중심.

> **Status**: Plan 완료 — design phase.
