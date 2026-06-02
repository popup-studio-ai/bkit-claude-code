# ADR 0013 — Context Engineering Factoring (S3b, v2.1.22)

> **Status**: Accepted (2026-06-02)
> **Sprint**: `ctx-eng-layer-consolidation` (v2.1.22 Hardening S3b, ENH-353)
> **Context**: 마스터 플랜 §8 simplicity invariant / §10 S3b. S3a(god-file 4→0) 후속.
> **Supersedes/relates**: ADR 0005 (application-layer pilot), ADR 0007 (sprint as meta-container).

---

## 1. Context

v2.1.22 Hardening 마스터 플랜은 Context Engineering 단순화를 2개 sprint로 분해했다:
- **S3a (god-file split)**: god-file(>700 LOC) 4개 → 0개. **완료** (commit 2c49218/e43bb0f/43d47a2/cec28c4).
- **S3b (layer/pipeline consolidation)**: 22 subdir / 8-layer context engineering / 7 Port↔Adapter pair의 redundant 통합 — 본 ADR이 그 결정을 기록.

S3b 진입 시 마스터 플랜의 통합 추정을 **코드 레벨에서 전수 검증**한 결과(S2 raw-concat·S4 dead-code와 동일한 검증 절차), 추정된 통합 대상이 **actionable redundancy가 아님**이 확인되었다.

## 2. Decision

**Context Engineering 구조에 대해 추가 통합/병합을 실행하지 않는다.** 현 factoring이 의도적이며 simplicity invariant를 이미 충족함을 확정하고, 그 근거를 본 ADR로 lock 하여 향후 잘못된 통합 시도를 방지한다.

### 2.1 결정 근거 (후보별, 코드 검증)

| 후보 | 검증 결과 | 결정 |
|------|----------|------|
| **lib 22 subdir** | 22 ≤ 22 (invariant 충족). 단일모듈 subdir(`sprint`/`evals`/`discovery`/`dashboard`)는 distinct feature + skill/MCP 진입점. `lib/sprint`는 외부 38곳 import. | 유지 — 병합은 cosmetic + breakage + clarity 손실 |
| **8-layer context engineering** | `AI-NATIVE-DEVELOPMENT.md §205-212`의 **개념적 capability map**: L1 Domain Knowledge(44 Skills) / L2 Behavioral Rules(34 Agents) / L3 State Mgmt / L4 Dynamic Injection(intent+8-lang) / L5 Controllable AI(L0-L4 trust) / L6 Quality&Audit(gates+M1-M10) / L7 Feedback Loop(matchRate→iterate) / L8 Meta-Container(Sprint). 코드 모듈이 아닌 아키텍처 설명 모델. | 유지 — 병합 = capability 제거(Anti-Mission 위반) |
| **8 Port + 7 Adapter** | 8 Port(`audit-sink`/`caching-cost`/`cc-payload`/`docs-code-index`/`mcp-tool`/`regression-registry`/`state-store`/`token-meter`) 전부 distinct DDD 계약. 각 adapter 매칭(regression-registry는 직접구현). | 유지 — Clean Architecture DIP, redundancy 0 |
| **frontmatter 파서** | 공유 파싱은 **이미 통합 완료**: `lib/util/frontmatter.js`(v2.1.18 CO-5, 5-site 통합) + `lib/util/markdown-parse.js`(v2.1.19 S3, docs-sync용). `docs-code-scanner` + 5 baseline 소비처가 실제 require. 잔존 specialized 파서(skill-orchestrator/import-resolver/pattern-matcher/context-init)는 1줄 fence 정규식만 공유하고 다운스트림은 도메인별 specialized. | 유지 — 추가 병합 = churn(중립 LOC) + 255 assertion 위험 |
| **동일 basename** | `executive-summary`(pdca∥sprint, #113 v2.1.21 별도 shape), `transitions`/`phases`/`index`(pdca-lifecycle∥sprint-lifecycle 병렬 도메인), `index.js`(subdir별 barrel). | 유지 — 의도적 병렬 도메인 |
| **S3a 신규 6 모듈** | `lib/pdca/{automation-questions,state-transitions}` + `scripts/lib/{unified-stop-deps,sprint-handler-shared,sprint-handlers-core,sprint-handlers-admin}`. | 유지 — 적절 배치, 재배치 불요 |

### 2.2 Simplicity Invariant (§8) — 충족 확인

| 지표 | Baseline | Target | v2.1.22 실측 |
|------|----------|--------|--------------|
| god-file (>700 LOC) | 7→S3a 4 | 0 | **0** (S3a) |
| 최대 단일 파일 LOC | 1509 | ≤700 | **541** |
| lib subdir | 22 | ≤22 | **22** |
| lib module 순증 | 188 | ≤+10 | **190 (+2)** |
| context-injection layer | 8 | ≤8 | **8 (개념 모델 보존)** |
| contract assertion | 255/234 | 불변 | **255/234** |
| quality gates | 전부 | green | **green** |

## 3. Consequences

**긍정**: (a) capability 100% 보존. (b) 255 contract assertion + skill 로딩 + 고의존 모듈 무회귀. (c) 향후 "구조 카운트 기반" 통합 충동을 본 ADR이 차단 → churn 방지. (d) S3a가 달성한 god-file 0이 S3b의 핵심 단순화 성과.

**부정/한계**: 단일모듈 subdir이 4개 잔존(cosmetic). frontmatter fence 정규식이 9곳 1줄 중복(무이득이라 미통합).

**향후 통합 트리거(재검토 조건)**: 동일-목적 로직이 **2개 이상 독립 구현으로 분기**하여 유지보수 비용이 실측될 때만 통합 검토. 현재 해당 없음.

## 4. Alternatives Considered

1. **단일모듈 subdir 병합** (evals/discovery/dashboard → 부모) — 거부: import 깨짐 위험 + clarity 손실 > subdir -3의 cosmetic 이득.
2. **frontmatter fence 공유 헬퍼화** (9 site → 1 helper) — 거부: LOC 중립 + 6 critical-path 파일 수정 위험(255 assertion).
3. **8-layer 코드 통합** — 거부: 개념 모델이라 통합 대상 자체가 없음; 시도 시 capability 제거.

---

> **결론**: S3b의 단순화 성과는 S3a god-file 0 달성으로 이미 실현되었고, 추가 구조 통합은 capability·안정성 대비 이득이 없어 **비실행**하며 본 ADR로 의도적 factoring을 영구 기록한다.
