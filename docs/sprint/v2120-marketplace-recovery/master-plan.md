---
template: sprint-master-plan
version: 1.0
sprintId: v2120-marketplace-recovery
displayName: bkit v2.1.20 — Marketplace Recovery + Plugin Manifest Schema Compliance
date: 2026-05-23
author: kay (POPUP STUDIO) + bkit:sprint-master-planner agent (Sprint Management v2.1.13 GA 2nd-cycle dogfooding)
trustLevel: L2
duration: 1-2 weeks (7-14 days)
---

# bkit v2.1.20 — Marketplace Recovery + Plugin Manifest Schema Compliance Sprint Master Plan

> **Sprint ID**: `v2120-marketplace-recovery`
> **Date**: 2026-05-23
> **Author**: kay (POPUP STUDIO) + `bkit:sprint-master-planner` agent (Sprint Management v2.1.13 GA 2nd-cycle dogfooding — v2.1.14 1st spawn 이후 6번째 sprint container)
> **Trust Level (시작)**: **L2** (`bkit.config.json:sprint.defaultTrustLevel` 정합. P0 advisory hot-path 안전 최우선)
> **예상 기간**: 1-2 주 (7-14 days, 3 sub-sprints 분할)
> **Master Plan template**: bkit v2.1.13 (Sprint 4 Presentation 산출, `templates/sprint/master-plan.template.md`)
> **Branch**: `release/v2.1.20-marketplace-recovery` (이미 생성됨, current)
> **선행 분석 보고서**:
> - `docs/03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md` (88% 신뢰도 결론, 정병진 incident root cause analysis)
> - `docs/external-dogfooders/_README.md` (v2.1.19 외부 dogfooder 정책 baseline)
> - `docs/adr/0003-cc-version-impact-empirical-validation.md` (본 incident가 ADR 위반 사례)
> - `docs/adr/0006-cc-upgrade-policy.md` § "Empirical Validation Gate" (의무 wire 미이행)

---

## 0. Executive Summary

| 항목 | 내용 |
|------|------|
| **Mission** | 외부 dogfooder 정병진(@bj) install 실패 사건(2026-05-26 advisory hotfix advisory + 회귀 방지 CI gate 인프라화 + SessionStart CC version detection) 3-layer 대응으로 bkit minimum CC version 명시 + 향후 같은 사건 0건 보장 |
| **Anti-Mission** | (a) `displayName` 제거 (공식 schema 정식 키, v2.1.143+ 인식) / (b) v2.1.142 이하 사용자 차단 (informational advisory only, hard reject X) / (c) Anthropic 책임 영역 (docs vs 구현 lenient/strict 모순 Q1) 해결 시도 / (d) bkit-starter plugin 변경 (영향 0 확정) / (e) Q2 정병진 CC 버전 미확정 상태 추측으로 채움 / (f) Trust L4 default 변경 |
| **Core Primitives** | 14 features (P0×4 / P1×5 / P2×5) + 3 sub-sprints + 3 신규 ENH (ENH-321/322/323) + 1 신규 ADR (0011 Plugin Manifest Schema Compliance Policy) + 1 외부 dogfooder Hall of Fame entry (정병진 @bj 후보) |
| **Trust Level** | **L2 default** (`SPRINT_AUTORUN_SCOPE` = `prd→plan→design→do→iterate`, gate별 사용자 confirm). P0 hot-path advisory는 L2 안전 우선. |
| **Auto-pause 조건** | **4 triggers 모두 활성**: QUALITY_GATE_FAIL (M3>0 OR S1<100) / ITERATION_EXHAUSTED (iter≥5 AND matchRate<90) / BUDGET_EXCEEDED (cumTok > 1M) / PHASE_TIMEOUT (>4h) |
| **Success Criteria** | 8건 (§ 6 KPI Matrix 참고). SC1 README/docs minimum CC v2.1.143 명시 + SC2 21-key whitelist CI gate + SC3 `claude plugin validate` Exit 0 의무 + SC4 R3-321 등록 + SC5 SessionStart CC detection 발동 + SC6 정병진 install 성공 회신 + SC7 ADR 0011 채택 + SC8 Hall of Fame 정병진 entry 추가 |

### 0.1 4-Perspective 가치 표 (전체 Sprint)

| 관점 | 점수 (0-5) | 근거 |
|------|:---------:|------|
| **안정성 (Stability)** | **5** | (1) Plugin manifest schema CI gate 신설로 향후 같은 incident 회귀 차단 / (2) `claude plugin validate .` Exit 0 의무 wire (ADR 0006 Empirical Validation Gate 충족) / (3) R3-321 신규 guard 등록 + cc-regression reconcile cycle 통합 / (4) ADR 0003 Phase 1.5 Empirical Validation 위반 사례를 정책 강화로 전환 |
| **성능 (Performance)** | **3** | (1) SessionStart CC version detection cost (1회/세션, child_process spawn ~50-150ms est.) — H2 Risk / (2) 추가 CI step `validate-plugin.js --strict` 무시할 수준 (<1초 추정) — pure JSON parse / (3) 성능 영향 자체가 본 sprint 핵심 목표 아님 |
| **보안 (Security)** | **4** | (1) Plugin manifest tampering 검증 강화 (21-key whitelist) → 비표준 키 silent acceptance 차단 / (2) Defense-in-Depth 7-Layer 정책 강화 (CI 단계에서 schema 미준수 차단) / (3) 외부 plugin install 보안 sanity check 인프라 baseline 도입 |
| **비용 (Cost)** | **5** | (1) **외부 dogfooder 신뢰 회복** — 정병진 install 실패 → 빠른 회신 + Hall of Fame 등록 → bkit Early Adopter Program 가시화 / (2) 향후 같은 incident 0건 → support 비용 절감 / (3) Strict Manifest Validation 정합 문서화로 외부 사용자 self-service 가능 / (4) bkit 7-Layer Defense + 차별화 7/7 강화 |

### 0.2 Sprint 분류 (Sprint Management v2.1.13 taxonomy)

- **Type**: **Recovery + Convention Restoration** (v2.1.19 S2 sub-sprint 정신 계승)
- **Trigger**: 외부 incident (정병진 @bj 2026-05-26 install 실패) — bkit Early Adopter Program 5-stage Lifecycle Stage 1 (Issue Filed)
- **Lifecycle target**: Stage 4 (Regression Lock) — E2E test absorption + R3-321 guard 등록까지 sprint 내 종결
- **Carryover**: 본 sprint Out-of-scope 항목은 v2.1.21+ 분기 결정 (§ 17 참고)

---

## 1. Context Anchor (Plan → Design → Do 전파)

| Key | Value |
|-----|-------|
| **WHY** | (1) **외부 dogfooder 정병진(@bj)** 2026-05-26 bkit v2.1.14 install 시도 → `Validation errors: : Unrecognized key: "displayName"` 에러 발생 (path: `/Users/bj/.claude/plugins/cache/temp_git_1779631720189_ocjr7a/.claude-plugin/plugin.json`) / (2) **cc-version-researcher 88% 신뢰도 결론** (`docs/03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md`): `displayName`은 v2.1.143+ 공식 schema 정식 키 ("Requires Claude Code v2.1.143 or later" docs.claude.com 명시), strict path는 v2.1.45부터 항상 존재 (Issue #26555 6+ 이슈 입증) — **정병진 CC ≤ v2.1.142 추정 98%** / (3) **ADR 0003 위반 사례**: Phase 1.5 Empirical Validation을 가설 단계에서 거치지 않았다면 false fix 위험 (예: `displayName` 제거 → v2.1.143+ UI picker 누락 회귀) — 본 sprint가 정책 강화 sprint / (4) **ADR 0006 § Empirical Validation Gate 미이행**: "Execute `claude plugin validate .` against the bkit plugin manifest. Exit 0 required." 명시 — `scripts/release-plugin-tag.sh` wire 안 됨 (실측 line 82-83 = check-trust-score-reconcile + check-quality-gates만 호출) / (5) **bkit Early Adopter Program 5-stage Lifecycle 첫 외부 트리거** (v2.1.19 정책 도입 후 첫 활용) — 정병진은 @pruge에 이은 외부 dogfooder #2 후보 |
| **WHO** | **1차**: 정병진 (@bj, dandi-village-ledger 외부 사용자 #2 — install 실패 직접 영향) / **2차**: 향후 CC ≤ v2.1.142 사용 신규 사용자 N명 (advisory 미부재 시 같은 실패 반복) — Anthropic CC stable 통계 기준 추정 v2.1.142 이하 사용 비율 미상 (Q5 미해결) / **3차**: kay (POPUP STUDIO) — bkit 메인테이너 + sprint-master-planner agent 2nd-cycle dogfooding 검증 / **4차**: bkit Early Adopter Program @pruge — 정책 first follower, dogfooder #2 entry 효과 확산 / **5차**: bkit-starter plugin 사용자 — displayName 미포함 → 영향 0 확정 (사실 확인됨) |
| **WHAT (도메인)** | (a) **README + docs minimum CC v2.1.143 advisory** (F1+F4) / (b) **`.claude-plugin/marketplace.json` minimum CC version 메타데이터** (F2, spec 확인 필요) / (c) **정병진 회신 메일 + Hall of Fame entry 후보** (F3+F14, dogfooder lifecycle Stage 1→5) / (d) **`scripts/validate-plugin.js` 21-key whitelist 확장** (F5, ENH-322) / (e) **`.github/workflows/contract-check.yml` plugin schema validation step 신설** (F6) / (f) **`scripts/release-plugin-tag.sh` `claude plugin validate .` wire** (F7, ADR 0006 충족) / (g) **`lib/cc-regression/registry.js` R3-321 신규 guard** (F8, ENH-321) / (h) **`lib/domain/rules/docs-code-invariants.js` `EXPECTED_PLUGIN_JSON_KEYS` SoT 추가** (F9) / (i) **SessionStart hook CC version detection** (F10, ENH-323) / (j) **ADR 0011 Plugin Manifest Schema Compliance Policy** (F11) / (k) **`test/integration/config-sync.test.js` CS-015 21-key 보강** (F12) / (l) **E2E `test/e2e/cc-min-version.test.js` v2.1.142 simulation** (F13) / (m) **외부 dogfooder Lifecycle Stage 4 (Regression Lock)** — E2E test absorption까지 sprint 내 종결 |
| **WHAT NOT** | (a) **`displayName` 제거** (공식 schema 정식 키, v2.1.143+ UI picker용) / (b) **v2.1.142 이하 hard reject** (informational advisory only — v2.1.143+ UI picker fail-graceful) / (c) **Anthropic docs vs 구현 모순 (Q1)** 자체 해결 시도 (Anthropic 측 책임) / (d) **bkit-starter plugin 변경** (displayName 미포함 — 실측 확인됨, 영향 0) / (e) **Trust L3/L4 default 변경** / (f) **MCP server 추가** / (g) **Q2 정병진 CC 버전 미확정 추측 보강** (사용자 회신 대기) / (h) **v2.1.143+ CC 버전 호환성 전수 분석** (별도 분석 사이클) / (i) **Application Layer 3rd 도메인 신설** (v2.1.15+ 별도) |
| **RISK** | (R1 Critical) 정병진 CC 버전 미확정 → fix가 다른 root cause 가능성 25% (Q2) / (R2 Critical) docs vs 구현 lenient/strict 모순 (Q1) — Anthropic 정책 변경 시 본 sprint 산출 영향 / (R3 High) v2.1.143+ 사용자 UI picker 표시 회귀 가능성 (`displayName` 제거 시) — **본 sprint Anti-Mission 명시로 차단** / (R4 High) SessionStart hook CC version detection 성능 overhead (child_process spawn 50-150ms 추정 / 세션 1회) / (R5 Medium) `docs-code-invariants.js` 신규 SoT 추가 시 기존 invariant 충돌 / (R6 Medium) bkit min CC v2.1.143 명시가 v2.1.142 이하 사용자 진입장벽 → 사용자 ↓ 가능성 / (R7 Medium) ENH-321 R3-321 guard가 cc-regression reconcile cycle (매일 09:00 KST) 안정성에 영향 / (R8 Low) 외부 dogfooder 정책 abuse (가짜 dogfooder 등록 시도) / (R9 Low) `validate-plugin.js --strict` mode가 기존 contract-check 통과 PR fail 시키는 false-positive |
| **SUCCESS** | **SC1 README + docs CC v2.1.143 명시 (100%)** + **SC2 `validate-plugin.js` 21-key whitelist 적용 + 비표준 키 CI fail** + **SC3 `release-plugin-tag.sh` `claude plugin validate .` Exit 0 의무 wire** + **SC4 `cc-regression/registry.js` R3-321 등록 + reconcile cycle PASS** + **SC5 SessionStart hook CC version detection 발동 검증** + **SC6 정병진 install 성공 회신 또는 workaround 적용 확인** + **SC7 ADR 0011 채택** + **SC8 Hall of Fame 정병진 entry 추가 (외부 dogfooder #2)** |
| **SCOPE (정량)** | **Features**: 14 (P0×4 / P1×5 / P2×5) / **예상 LOC**: ~900 LOC (P0 ~50 LOC 1-line advisory + docs / P1 ~400 LOC validate-plugin + workflow + invariants SoT / P2 ~450 LOC SessionStart + E2E + ADR + Hall of Fame) / **기간**: 7-14 days / **토큰 예산**: 400K estimate / 750K effective (1M cap × safetyMargin 0.25) / **Phase 수**: 8 (PRD→Plan→Design→Do→Iterate→QA→Report→Archived) / **Sub-sprints**: 3 (P0 Recovery / P1 Defense / P2 Forward-proofing) |
| **OUT-OF-SCOPE** | (a) v2.1.142 이하 CC 사용자 hard reject / (b) Anthropic docs vs 구현 모순(Q1) 자체 해결 / (c) bkit-starter plugin 변경 / (d) Application Layer 3rd 도메인 / (e) Trust L3/L4 default 변경 / (f) v2.1.143+ CC 호환성 전수 분석 (별도) / (g) MCP server 추가 / (h) Q2 정병진 CC 버전 추측 보강 (사용자 회신 대기) / (i) bkit-gemini fork 통합 (CARRY-6 별도) |

---

## 2. Features (Sprint 구성 작업 묶음 — 14 features)

| # | Feature | 우선순위 | Sub-sprint | ENH | 비용 | 상태 |
|---|---------|:--------:|------------|:---:|:----:|:----:|
| 1 | **F1** README + README-FULL minimum CC v2.1.143 advisory (1-line) | **P0** | Recovery | - | XS | pending |
| 2 | **F2** `.claude-plugin/marketplace.json` minimum CC version 메타데이터 (spec 확인 후) | P0 | Recovery | - | XS | pending |
| 3 | **F3** 정병진 회신 메일 초안 (CC `--version` + `npm install -g @anthropic-ai/claude-code@latest` + ADR 0003 dogfooding marker + Hall of Fame 등록 검토) | **P0** | Recovery | - | XS | pending |
| 4 | **F4** `docs/06-guide/cc-compatibility.guide.md` 신규 또는 보강 (`contract-baseline-rollforward.guide.md` 기존 확장) | P0 | Recovery | - | S | pending |
| 5 | **F5** `scripts/validate-plugin.js` 21-key whitelist + min-version metadata + 화이트리스트 외 키 CI fail | **P1** | Defense | **ENH-322** | M | pending |
| 6 | **F6** `.github/workflows/contract-check.yml` plugin.json schema validation 신규 step (`node scripts/validate-plugin.js --strict`) | P1 | Defense | - | S | pending |
| 7 | **F7** `scripts/release-plugin-tag.sh`에 `claude plugin validate .` 추가 (ADR 0006 의무 wire) | P1 | Defense | - | XS | pending |
| 8 | **F8** `lib/cc-regression/registry.js` R3-321 신규 guard 등록 (displayName v2.1.142- reject 추적) | **P1** | Defense | **ENH-321** | M | pending |
| 9 | **F9** `lib/domain/rules/docs-code-invariants.js`에 `EXPECTED_PLUGIN_JSON_KEYS` SoT 추가 | P1 | Defense | - | S | pending |
| 10 | **F10** `hooks/startup/session-context.js` CC version detection + advisory (v2.1.143 미만 시 warn) | **P2** | Forward-proofing | **ENH-323** | M | pending |
| 11 | **F11** `docs/adr/0011-plugin-manifest-schema-compliance.md` 신규 ADR | P2 | Forward-proofing | - | M | pending |
| 12 | **F12** `test/integration/config-sync.test.js` CS-015 보강 — 21-key whitelist 모두 검증 | P2 | Forward-proofing | - | S | pending |
| 13 | **F13** `test/e2e/cc-min-version.test.js` E2E 시나리오 — v2.1.142 simulation + advisory 발동 검증 | P2 | Forward-proofing | - | M | pending |
| 14 | **F14** Hall of Fame 정병진 (@bj) entry 추가 — `docs/external-dogfooders/bj.md` + `docs/external-dogfooders/_README.md` 명단 (v2.1.19 정책 따름) | P2 | Forward-proofing | - | S | pending |

### 2.1 신규 ENH 후보 (sprint 결과 정식 편입 후보)

| # | ENH ID | 묶음 | 차별화 기여 | 정식 편입 후보 |
|---|--------|------|----------|--------------|
| 1 | **ENH-321** R3-321 cc-regression 신규 guard | F8 | 차별화 #2 Defense Layer 6 보강 | v2.1.20 |
| 2 | **ENH-322** validate-plugin.js 21-key whitelist | F5+F6 | 차별화 #2 + Convention Restoration | v2.1.20 |
| 3 | **ENH-323** SessionStart CC version detection | F10 | 차별화 #2 forward-proofing | v2.1.20 |

### 2.2 Feature DAG (Kahn Topological Sort)

```
[F3 정병진 회신 (HOT)] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
                                                                ┃
[F1 README advisory] ━┳━ [F4 cc-compatibility.guide.md] ━━━━━━━┫
                      ┃                                          ┃
[F2 marketplace.json]━┛                                          ┃
                                                                 ┃
[F9 docs-code-invariants SoT] ━┳━ [F5 validate-plugin --strict]━┻━ [F12 CS-015 보강]
                                ┃         ┃                              ┃
                                ┃         ┃                              ┃
                                ┃         ┗━ [F6 contract-check.yml] ━━━━┛
                                ┃                                        ┃
                                ┗━━ [F8 R3-321 guard]                    ┃
                                                                         ┃
                                       [F7 release-plugin-tag] ━━━━━━━━━━┛
                                                                         ┃
                                       [F10 SessionStart detection]━┓    ┃
                                                                    ┃    ┃
                                       [F11 ADR 0011] ━━━━━━━━━━━━━━┻━━━━┛
                                                                    ┃
                                       [F13 E2E v2.1.142 simulation]━┛
                                                                    ┃
                                       [F14 Hall of Fame 정병진]━━━━┛
```

- **선행 hot path**: F3 (정병진 회신) — sprint 시작 즉시 / 분리 가능
- **P0 코어**: F1+F2+F4 — README/marketplace/guide 동기화
- **P1 코어**: F9 → F5 → F6 → F8 (SoT 우선, validator 다음, CI gate 다음, regression guard 마지막)
- **P2 코어**: F10/F11/F13 병행 → F12 → F14

---

## 3. Sprint Phase Roadmap (8-Phase per Sub-sprint)

| Phase | 활성 시점 | 산출물 | Quality Gates |
|-------|----------|------|--------------|
| **prd** | sub-sprint 시작 | PRD 문서 (Context Anchor + Job Stories + Pre-mortem) | M8 ≥85 |
| **plan** | PRD 후 | Plan 문서 (Requirements + Quality Gates + Risks) | M8 ≥85 |
| **design** | Plan 후 | Design 문서 (코드베이스 깊이 분석 + Test Plan Matrix L1-L5) | M4 ≥90, M8 ≥85 |
| **do** | Design 후 | 구현 코드 (leaf-first → orchestrator-last) | M2 ≥80, M3 =0, M5, M7 |
| **iterate** | matchRate < 100 시 | gap-detector matchRate 100% 달성 | M1 =100 |
| **qa** | iterate 후 | 7-Layer S1 검증 + L1-L5 TC PASS | M3 =0, S1 =100 |
| **report** | qa 후 | 종합 보고서 (`docs/04-report/features/{feature}.report.md`) | M10, S2, S4 |
| **archived** | report 후 (L4) 또는 `/sprint archive` 명시 | terminal state (readonly) | - |

### 3.1 Sub-sprint 별 8-phase 일정 매트릭스 (3 sub-sprints, 2-week budget)

| Sub-sprint | PRD | Plan | Design | Do | Iterate | QA | Report | Archived |
|-----------|:---:|:----:|:------:|:--:|:-------:|:--:|:------:|:--------:|
| **1. Recovery** (P0×4 — F1/F2/F3/F4) | D1 AM | D1 AM | D1 PM | D1 PM ~ D2 | D2 | D2 | D2 EOD | D2 EOD |
| **2. Defense** (P1×5 — F5/F6/F7/F8/F9) | D2 EOD | D3 AM | D3 PM | D4 ~ D6 | D6 | D7 AM | D7 PM | D7 EOD |
| **3. Forward-proofing** (P2×5 — F10/F11/F12/F13/F14) | D7 EOD | D8 AM | D8 PM | D9 ~ D11 | D11 | D12 AM | D12 PM | D12 EOD |

- **Buffer**: D13~D14 (10-15% safety margin for QUALITY_GATE_FAIL / ITERATION_EXHAUSTED auto-pause 대응)
- **Sprint 종결 목표**: 2026-06-05 (12 days from 2026-05-23 시작)

### 3.2 Hot-path 우선순위 (HOT)

- **F3 (정병진 회신)**: Sub-sprint 1 PRD 단계 이전 D1 AM 즉시 출고 (외부 dogfooder lifecycle Stage 1→2 진행)
- **이유**: 외부 사용자 trust 회복 속도 = sprint 핵심 KPI K6 (정량) — 회신 지연 시 dogfooder 정책 효과 ↓
- **분리**: F3 회신은 8-phase 우회 (PRD 의존성 명시 후 직접 출고), 단 Hall of Fame entry (F14) 등록은 P2 sub-sprint 정상 진행

---

## 4. Quality Gates 활성화 매트릭스 (M1-M10 + S1-S4)

| Gate | 정의 | Threshold | 활성 Phase | 측정 도구 |
|------|------|----------|-----------|----------|
| **M1** matchRate | Design ↔ Code 일치율 | ≥90 (100 목표) | Iterate | `bkit-analysis::gap-detector` |
| **M2** code-quality | static + lint + type | ≥80 | Do | `bkit-analysis::code-analyzer` |
| **M3** criticalIssueCount | severity=critical 이슈 수 | =0 | Do, QA | `code-analyzer` |
| **M4** designCompleteness | 9-section spec coverage | ≥85 | Design | `gap-detector` |
| **M5** testCoverage | L1+L2 라인 커버리지 | ≥70 | Do | jest/istanbul |
| **M6** dependencyHealth | npm audit + circ-dep | warn 허용 | Do | npm audit |
| **M7** docCoverage | Code ↔ Docs sync | ≥80 | Do | `docs-code-scanner` |
| **M8** sectionCompleteness | PRD/Plan/Design 9-section | ≥85 | PRD, Plan, Design | `gap-detector` |
| **M9** regressionMatch | 직전 sprint 회귀 0건 | =0 | QA | `regression-rules-checker` |
| **M10** reportCompleteness | 보고서 9-section | ≥85 | Report | `gap-detector` |
| **S1** dataFlowIntegrity | 7-Layer 통합 무결성 | =100 | QA | `sprint-qa-flow` agent |
| **S2** featureCompletion | featureMap 집계 | =100 | Report | featureMap |
| **S3** sprintCycleTime | sprint 시작→archived 시간 | budget 내 | Report | timeline tracker |
| **S4** crossSprintIntegrity | 다른 sprint 영향 0건 | =0 | Report | docs-code-scanner |

### 4.1 Sub-sprint 별 Gate 활성 매트릭스

| Sub-sprint | M1 | M2 | M3 | M4 | M5 | M6 | M7 | M8 | M9 | M10 | S1 | S2 | S3 | S4 |
|-----------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---:|:--:|:--:|:--:|:--:|
| 1. Recovery (P0) | partial | - | ✓ | ✓ | - | - | ✓ | ✓ | ✓ | ✓ | partial | ✓ | ✓ | ✓ |
| 2. Defense (P1) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 3. Forward-proofing (P2) | ✓ | ✓ | ✓ | ✓ | ✓ | - | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

- **Recovery P0 partial M1/S1**: docs-only 변경이 다수이므로 matchRate 100 목표 미강제 (M7 ≥80 우선)
- **Defense P1 전 gate 활성**: 회귀 방지 CI gate가 sprint 본체이므로 M3=0 + S1=100 강제
- **Forward-proofing P2**: 보안 + E2E + ADR 신설 — Defense와 동일 강도

---

## 5. Sprint Scope Breakdown — 3 Sub-sprints (Kahn Topological Sort)

### 5.1 Dependency DAG

```
[Sub-sprint 1 Recovery P0 — F1/F2/F3/F4]
                │
                ▼
[Sub-sprint 2 Defense P1 — F5/F6/F7/F8/F9]
                │
                ▼
[Sub-sprint 3 Forward-proofing P2 — F10/F11/F12/F13/F14]
                │
                ▼
[Sprint Report + Archived]
```

- **선행 의존성**: 없음 (sprint 시작 = Sub-sprint 1)
- **순차 강제**: Recovery → Defense → Forward-proofing (P0 advisory 출고 후 회귀 방지 CI gate 도입 → 그 후 forward-proofing detection)
- **이유**: P0 advisory가 docs/README + marketplace.json + 회신 메일 출고 후, validate-plugin.js 21-key whitelist + CI gate가 검증 인프라화. 마지막으로 SessionStart hook + E2E + ADR + Hall of Fame.

### 5.2 Sub-sprint 1: Recovery (P0×4)

- **Features**: F1 (README advisory) + F2 (marketplace.json metadata) + F3 (정병진 회신) + F4 (cc-compatibility.guide.md)
- **선행 의존성**: 없음 (sprint 시작)
- **인계 산출물**:
  - `README.md` + `README-FULL.md` `> bkit requires Claude Code v2.1.143 or later (displayName field, see docs/06-guide/cc-compatibility.guide.md)` 1-line advisory
  - `.claude-plugin/marketplace.json` (가능하면 `requirements.claudeCode: "^2.1.143"` 추가 — Q3 spec 확인 후)
  - 정병진 회신 메일 초안 (gh + email — sprint-orchestrator audit_logger record)
  - `docs/06-guide/cc-compatibility.guide.md` 신규 (또는 `contract-baseline-rollforward.guide.md` 확장):
    - bkit minimum CC version 정합 표
    - displayName field 출처 (v2.1.143+ 공식 schema 인용)
    - 21-key whitelist 사전 안내 (Sub-sprint 2 도입 전 user-facing notice)
    - install 실패 시 사용자 대응 가이드 (`claude --version` 확인 + `npm install -g @anthropic-ai/claude-code@latest`)
- **차별화 기여**: 외부 dogfooder Lifecycle Stage 1→2 진행 (정병진 첫 dogfooder #2 후보)
- **토큰 예산**: 50K (~50 LOC docs + 1 회신 메일 = 33K 코어 + 17K design depth)
- **기간**: D1 AM ~ D2 EOD (2 days)
- **Pre-mortem**: F2 spec 확인 미가능 시 → marketplace.json 변경 보류 + F1+F4만 출고 (advisory 명시 우선)

### 5.3 Sub-sprint 2: Defense (P1×5)

- **Features**: F5 (validate-plugin.js 21-key whitelist, ENH-322) + F6 (contract-check.yml step) + F7 (release-plugin-tag.sh wire, ADR 0006 충족) + F8 (R3-321 guard, ENH-321) + F9 (docs-code-invariants SoT)
- **선행 의존성**: Sub-sprint 1 Archived (advisory 출고 후 CI gate 도입 — 외부 사용자 사전 안내 우선)
- **인계 산출물**:
  - `lib/domain/rules/docs-code-invariants.js`:
    - `EXPECTED_PLUGIN_JSON_KEYS: Object.freeze([...])` (21-key whitelist, Anthropic 공식 schema 인용)
    - Public API: `diffPluginJsonKeys(actual: Object): Array<{ key, status: "extra" | "missing" }>`
    - 본 sprint 갈래: 21-key whitelist 외 키 있으면 fail
  - `scripts/validate-plugin.js`:
    - `--strict` flag 신설 — 21-key whitelist 검증 + min-version metadata (line 264-272 기존 name+version check 보강)
    - Exit code: 0 (PASS) / 2 (extra key found) / 3 (min-version metadata invalid)
    - VERBOSE 시 각 key 상태 출력 + Anthropic docs URL 인용
  - `.github/workflows/contract-check.yml`:
    - 신규 step `Release Gate — plugin.json schema validation (21-key whitelist)`
    - 위치: line 88 (Release Gate — docs-code-sync) 직후
  - `scripts/release-plugin-tag.sh`:
    - line 82-83 사이 `claude plugin validate .` 추가 (Exit 0 의무)
    - command -v claude 미존재 시 WARN + fallback (CI 환경 제약)
    - ADR 0006 § Empirical Validation Gate 충족 marker
  - `lib/cc-regression/registry.js`:
    - 신규 entry **R3-321**: `displayName v2.1.142- strict reject` (since: '2.1.45', expectedFix: '2.1.143', issue 인용)
    - notes: "v2.1.143+ 공식 schema 정식 키, v2.1.142 이하 strict path가 reject. 외부 dogfooder 정병진 @bj 2026-05-26 첫 confirmed case."
    - 매일 09:00 KST cc-regression-reconcile cycle 통합
- **차별화 기여**: #2 (Defense Layer 6) + #5 (PostToolUse continueOnBlock) + Convention Restoration
- **토큰 예산**: 200K (~400 LOC × 6.67 = 67K + L3 contract TC + Design depth = 133K)
- **기간**: D2 EOD ~ D7 EOD (~5 days)
- **Pre-mortem**: F5 `--strict` mode가 기존 contract-check 통과 PR fail 시키면 → 보수적 출시: 첫 1주는 advisory only (Exit 0 + warning), 2주차부터 강제 (R9 Mitigation)

### 5.4 Sub-sprint 3: Forward-proofing (P2×5)

- **Features**: F10 (SessionStart CC detection, ENH-323) + F11 (ADR 0011) + F12 (CS-015 보강) + F13 (E2E v2.1.142 simulation) + F14 (Hall of Fame 정병진 entry)
- **선행 의존성**: Sub-sprint 2 Archived (CI gate 안정화 후 SessionStart + E2E 도입)
- **인계 산출물**:
  - `hooks/startup/session-context.js` 확장:
    - 신규 함수 `detectCCVersion(): { version: string | null, isOldVersion: boolean }`
    - `child_process.execSync('claude --version', { timeout: 200 })` parse
    - `BKIT_CC_VERSION_ADVISORY` env (set if version < v2.1.143)
    - additionalContext 문자열에 advisory 추가
    - Performance budget: 50-150ms cap (timeout 200ms 강제)
  - `docs/adr/0011-plugin-manifest-schema-compliance.md`:
    - Context: 정병진 @bj incident (2026-05-26) + ADR 0003 위반 사례
    - Decision: bkit minimum CC v2.1.143 정책 + 21-key whitelist 강제 + `claude plugin validate .` CI Gate
    - Consequences: 외부 dogfooder lifecycle + 차별화 #2 강화
    - Empirical Validation: SC1-SC8 8건 (§ 6 KPI Matrix)
  - `test/integration/config-sync.test.js` CS-015 보강 (line 380-384):
    - 기존: `pluginJson?.name && pluginJson?.displayName && pluginJson?.description && pluginJson?.license`
    - 보강: 21-key whitelist 모두 검증 + 화이트리스트 외 키 fail
  - `test/e2e/cc-min-version.test.js`:
    - v2.1.142 환경 simulation (mock `claude --version` returning "2.1.142")
    - bkit SessionStart hook 호출 → `BKIT_CC_VERSION_ADVISORY` env set 검증
    - additionalContext 문자열에 advisory 포함 검증
    - **외부 dogfooder Lifecycle Stage 4 (Regression Lock)** — 정병진 reproduction script 흡수
  - `docs/external-dogfooders/bj.md` 신규 entry:
    - 정병진 정보 (handle: bj, project: TBD 사용자 회신 확인 필요)
    - 5-stage Lifecycle progress (Stage 1 Issue Filed 2026-05-26 / Stage 2 Repro absorbed / Stage 3 Fix released v2.1.20 / Stage 4 Regression lock / Stage 5 Public acknowledge)
    - 본 sprint 산출물 인용 (F1-F14 + ENH-321/322/323 + ADR 0011)
  - `docs/external-dogfooders/_README.md` 명단 갱신 — `@bj` entry 추가 (#2)
- **차별화 기여**: #2 Defense forward-proofing + 외부 dogfooder Lifecycle Stage 4 도달
- **토큰 예산**: 150K (~450 LOC × 6.67 = 75K + ADR + E2E depth = 75K)
- **기간**: D7 EOD ~ D12 EOD (~5 days)
- **Pre-mortem**: H2 H4 SessionStart hook performance overhead → timeout 200ms 강제 + env BKIT_DISABLE_CC_VERSION_DETECTION opt-out flag 제공

### 5.5 Sub-sprint Token Budget Summary

| Sub-sprint | Token Budget | LOC est. | 기간 | Phase Timeout 위험 |
|-----------|:-----------:|:--------:|:----:|:-----------------:|
| 1. Recovery (P0) | 50K | ~50 (docs + 회신) | 2d | Low |
| 2. Defense (P1) | 200K | ~400 | 5d | **Medium** (F5 21-key whitelist + R3-321 guard 통합 TC 부하) |
| 3. Forward-proofing (P2) | 150K | ~450 | 5d | Medium (F10 SessionStart + F13 E2E simulation 통합) |
| **Total** | **400K** | **~900** | **12d** | - |
| **Effective Budget (× 1.875 safety buffer)** | **750K** | - | - | - |
| **Sprint Budget Cap** (`bkit.config.json:sprint.defaultBudget`) | **1,000K** | - | - | safe margin 600K |

### 5.6 recommendSprintSplit 활용 검증

본 sprint는 14 features × 평균 ~64 LOC = ~900 LOC est. (`lib/application/sprint-lifecycle/context-sizer.js` `recommendSprintSplit` 호출 결과 예상):
- maxTokensPerSprint 100K cap × 3 sub-sprints = 300K bin (실 400K → safetyMargin 적용 후 750K effective 내)
- Dependency graph: { Defense: ['Recovery'], 'Forward-proofing': ['Defense'] } — sequential 강제
- 단일 feature 100K 초과 0건 (모두 ≤200K, 최대치는 Sub-sprint 2 Defense)

---

## 6. KPI / Quality Gates Mapping (K1-K10 ↔ M1-M10 + S1-S4)

| KPI | Description | Target | Mapped Gate | 측정 도구 |
|----|------------|--------|------------|----------|
| **K1** README + docs CC v2.1.143 명시 (SC1) | README/README-FULL + cc-compatibility.guide.md | =100% (4 docs 명시) | M7 + M10 | docs-code-scanner |
| **K2** Plugin manifest 21-key whitelist 적용 (SC2) | `validate-plugin.js --strict` Exit 0 PASS + extra key Exit 2 fail | =100% | M3 + S1 | `validate-plugin.js` |
| **K3** `claude plugin validate .` CI wire (SC3, ADR 0006) | `release-plugin-tag.sh` line 84+ wire | =100% | M9 + S4 | release-plugin-tag.sh test run |
| **K4** R3-321 신규 guard 등록 (SC4) | `cc-regression/registry.js` entry 추가 + reconcile cycle PASS | =100% | M9 + S4 | cc-regression-reconcile.yml |
| **K5** SessionStart CC detection 발동 (SC5) | `BKIT_CC_VERSION_ADVISORY` env set + additionalContext warning | =100% | M5 + S1 | session-start.test.js |
| **K6** 정병진 install 성공 회신 (SC6) | dogfooder 회신 + workaround 적용 또는 install 성공 | =100% (1건) | M10 + S2 | dogfooder GH issue thread |
| **K7** ADR 0011 채택 (SC7) | `docs/adr/0011-*.md` Accepted | =100% | M8 + M10 | ADR 0011 frontmatter |
| **K8** Hall of Fame 정병진 entry 추가 (SC8) | `docs/external-dogfooders/bj.md` + `_README.md` 명단 | =100% | M7 + M10 | docs-code-scanner |
| **K9** matchRate (Design ↔ Code, gap-detector) | 본 sprint 모듈 매칭 | ≥90 (100 목표) | **M1** | gap-detector |
| **K10** dataFlowIntegrity (7-Layer S1) | 7-Layer 무결성 | =100 | **S1** | `sprint-qa-flow` agent |

### 6.1 KPI Threshold 진척률 표

| Phase | K1 | K2 | K3 | K4 | K5 | K6 | K7 | K8 | K9 | K10 |
|-------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---:|
| PRD | - | - | - | - | - | - | spec | spec | - | - |
| Plan | - | - | - | - | - | - | spec | spec | - | - |
| Design | - | - | - | - | - | - | spec | spec | - | - |
| Do (Recovery) | 100% | - | - | - | - | partial | - | - | - | - |
| Do (Defense) | 100% | 100% | 100% | 100% | - | - | - | - | partial | - |
| Do (Forward-proofing) | 100% | 100% | 100% | 100% | 100% | partial | 100% | 100% | partial | partial |
| Iterate | 100% | 100% | 100% | 100% | 100% | partial | 100% | 100% | ≥90 | partial |
| QA | 100% | 100% | 100% | 100% | 100% | =1 | 100% | 100% | ≥90 | =100 |
| Report | 100% | 100% | 100% | 100% | 100% | =1 | 100% | 100% | ≥90 | =100 |
| Archived | locked | locked | locked | locked | locked | =1 | locked | locked | locked | locked |

---

## 7. Pre-mortem (실패 시나리오 6 critical + 3 보강 = 9건)

| # | 시나리오 | 가능성 | 영향도 | 완화 전략 |
|---|---------|:-----:|:-----:|---------|
| **R1** | **정병진 CC 버전 미확정 (Q2) — fix 다른 root cause 가능성 25%** | High (Q2 미해결) | **Critical** | (a) F3 회신 메일에 `claude --version` 출력 요청 명시 / (b) 회신 받기 전까지 P0 advisory만 출고 (F1+F4) / (c) Defense + Forward-proofing은 F8 R3-321 guard로 다중 root cause 커버 / (d) Q2 미해결 명시 + sprint 완료 후 재검토 marker / (e) cc-version-researcher 88% 신뢰도 결론 baseline 유지 |
| **R2** | **docs vs 구현 lenient/strict 모순 (Q1) — Anthropic 정책 변경 시 sprint 산출 영향** | Medium | **Critical** | (a) Anthropic 책임 영역 명시 — bkit이 해결 불가 / (b) cc-regression reconcile cycle 매일 09:00 KST 자동 트래킹으로 변화 감지 / (c) ADR 0011 Decision에 "현 시점 strict path 기준 + 변화 시 ADR amend" 명시 / (d) Defense Layer 6 audit_logger record + alarm |
| **R3** | **`displayName` 제거 시 v2.1.143+ UI picker 회귀 (R-3 critical)** | Low (Anti-Mission 명시 차단) | **Critical** | (a) Anti-Mission § 1 명시 — `displayName` 제거 안 함 / (b) PR template에 displayName 유지 체크박스 / (c) F12 CS-015 보강 — displayName 존재 강제 / (d) F5 `validate-plugin.js --strict` displayName missing 시 fail |
| **R4** | **SessionStart hook CC version detection 성능 overhead (50-150ms / session)** | Medium | High | (a) child_process.execSync timeout 200ms 강제 / (b) `BKIT_DISABLE_CC_VERSION_DETECTION=1` env opt-out / (c) 1회/세션 cap (cache `.bkit/runtime/cc-version.json` 1시간 TTL) / (d) OTEL `gen_ai.cc_version_detection_ms` metric emit / (e) ENH-323 telemetry 3-month 후 데이터 분석 후 격하/유지 결정 |
| **R5** | **`docs-code-invariants.js` 신규 SoT (`EXPECTED_PLUGIN_JSON_KEYS`) 다른 invariant와 충돌** | Low | Medium | (a) Object.freeze 적용 (immutability invariant 보존) / (b) 기존 EXPECTED_COUNTS / EXPECTED_*_NAMES 패턴 답습 / (c) diff function (`diffPluginJsonKeys`) 별도 module / (d) check-domain-purity CI gate 유지 (pure domain, no FS) |
| **R6** | **bkit min CC v2.1.143 명시가 v2.1.142 이하 사용자 진입장벽 → 사용자 ↓** | Medium | Medium | (a) advisory only (hard reject X) / (b) F4 cc-compatibility.guide.md에 v2.1.142 사용자 workaround 명시 (`npm install -g @anthropic-ai/claude-code@latest`) / (c) v2.1.143 release date 2026-05-XX (정확 일자 확인 필요) — 사용자 95% 이미 upgrade 추정 / (d) 후속 sprint v2.1.21 사용자 trend 데이터 검토 (Q5 미해결) |
| **R7** | **ENH-321 R3-321 guard가 cc-regression reconcile cycle 안정성에 영향** | Low | Medium | (a) 기존 21 entries 패턴 답습 (lightweight entry first, per-guard logic 후속) / (b) reconcile cycle PASS 검증 (F8 acceptance criteria) / (c) reconcile cycle 매일 09:00 KST run history archive / (d) 회귀 시 즉시 rollback (cc-regression/registry.js git revert) |
| **R8** | **외부 dogfooder 정책 abuse (가짜 dogfooder 등록 시도)** | Low | Low | (a) bkit Early Adopter Program 5-stage Lifecycle 강제 — Stage 1 (Issue Filed 검증) → Stage 2 (Repro absorbed 검증) 후에만 Hall of Fame entry 추가 / (b) 정병진 entry는 실제 GH issue + 회신 thread + install repro confirmed 후 추가 / (c) Trust Score externalDogfoodFeedbackResponseRate (weight 0.05) 측정 — 24h 미응답 시 entry expire |
| **R9** | **`validate-plugin.js --strict` mode가 기존 contract-check PR fail false-positive** | Medium | High | (a) 1주 advisory only deployment (Exit 0 + warning) / (b) 2주차부터 strict (Exit 2) / (c) 신규 step continue-on-error: true 1주 → false 격상 / (d) F12 CS-015 사전 검증 — 모든 21-key 통과 확인 / (e) bkit-starter plugin 검증 면제 (displayName 없음, 별도 plugin) |

### 7.1 Severity 분류

- **Critical (C)**: R1 (정병진 CC 버전 미확정, Q2), R2 (Anthropic 정책 변경, Q1), R3 (displayName 회귀 — Anti-Mission 차단)
- **High (H)**: R4 (SessionStart 성능 overhead), R9 (CI false-positive)
- **Medium (M)**: R5 (SoT 충돌), R6 (사용자 진입장벽), R7 (reconcile cycle 안정성)
- **Low (L)**: R8 (dogfooder abuse)

---

## 8. Empirical Validation Compliance (ADR 0003 + 0006 정책 강화)

### 8.1 ADR 0003 위반 사례 회고

> **ADR 0003** (2026-04-24 Accepted) `docs/adr/0003-cc-version-impact-empirical-validation.md`:
> "Phase 1.5 Empirical Validation 의무 — CC 버전 변경 영향 분석 시 raw CHANGELOG + 공식 docs + bkit 실측 3-source 가설 검증 필수"
>
> **본 incident가 ADR 0003 위반 사례**:
> - 정병진 incident 발생 즉시 displayName 제거 가설 → 만약 empirical validation 안 거치고 fix 진행했다면 false fix (v2.1.143+ UI picker 회귀)
> - cc-version-researcher 88% 신뢰도 결론 = ADR 0003 Phase 1.5 적용 결과 (raw CHANGELOG 전수 + 공식 docs + bkit 실측 결합)
>
> **본 sprint의 정책 강화 측면**:
> - F11 ADR 0011 § Decision: 모든 plugin manifest 변경 시 Phase 1.5 Empirical Validation 의무
> - F8 R3-321 guard: 후속 같은 incident 자동 트래킹 (cc-regression reconcile)
> - F13 E2E v2.1.142 simulation: empirical validation 자동화

### 8.2 ADR 0006 § Empirical Validation Gate 미이행 회복

> **ADR 0006** (2026-04-28 Accepted) `docs/adr/0006-cc-upgrade-policy.md`:
> "Execute `claude plugin validate .` against the bkit plugin manifest. Exit 0 required."
>
> **본 sprint의 회복 작업 (F7)**:
> - `scripts/release-plugin-tag.sh` line 82-83 사이 `claude plugin validate .` 추가
> - command -v claude 미존재 시 WARN + fallback (CI 환경 제약, 사용자 명시 시 fallback)
> - Exit code 0 강제 — 위반 시 release 차단
> - 본 wire는 ADR 0006 의무 시점 (2026-04-28) 대비 ~30일 지연 — sprint completion 후 ADR 0006 § History append

### 8.3 Empirical Validation 정책 강화 표

| 정책 | ADR | 본 sprint 적용 | Verification |
|------|:---:|--------------|-------------|
| Phase 1.5 (CHANGELOG + docs + 실측 3-source) | 0003 | F8 R3-321 guard + F13 E2E simulation | `cc-version-researcher` agent 자동 |
| `claude plugin validate .` Exit 0 의무 | 0006 | F7 release-plugin-tag.sh wire | `release-plugin-tag.sh` CI run |
| 21-key whitelist 강제 | **0011 (신규)** | F5+F6 `validate-plugin.js --strict` | `contract-check.yml` step |
| Min CC version 명시 | **0011 (신규)** | F1+F2+F4 docs/marketplace metadata | `docs-code-scanner` |
| SessionStart runtime detection | **0011 (신규)** | F10 ENH-323 | `BKIT_CC_VERSION_ADVISORY` env |

---

## 9. Differentiation Strategy (차별화 7/7 vs 본 sprint 기여)

### 9.1 차별화 7건 (v2.1.19 정식 7/7) 및 본 sprint 기여

| # | 차별화 | ENH 출처 | vs CC | v2.1.20 본 sprint 기여 |
|---|--------|---------|-------|---------------------|
| **1** | Memory Enforcer | ENH-286 (v2.1.14) | CC advisory (R-3 evolved 12건) | (간접) Defense Layer 7-Layer Coordination 강화 |
| **2** | **Defense Layer 6** | ENH-289 (v2.1.14) | CC R-3 numbered | **R3-321 신규 guard (F8 ENH-321) + `validate-plugin.js` 21-key whitelist (F5 ENH-322) + SessionStart CC detection (F10 ENH-323) — 본 sprint 직접 강화** |
| **3** | Sequential Dispatch | ENH-292 (v2.1.14) | CC parallel (#56293 16-streak) | (간접) sprint-master-planner agent 2nd-cycle dogfooding |
| **4** | Effort-aware Adaptive Defense | ENH-300 (v2.1.14) | CC effort.level (F4-133) | - |
| **5** | PostToolUse continueOnBlock Moat | ENH-303 (v2.1.14) | CC silent drop (#57317) | - |
| **6** | Heredoc Pipe Bypass Defense | ENH-310 (v2.1.14) | CC #58904 | - |
| **7** | Workflow Durability Native (Sprint L4 + auto-pause) | ENH-318 (v2.1.19) | CC #58895 UserIdle | (간접) 본 sprint 자체가 8-phase × 3 sub-sprint × auto-pause 활용 |

### 9.2 차별화 #2 Defense Layer 6 의 본 sprint 강화

- **신규 entry R3-321**: cc-regression/registry.js entry #22 (기존 21 + 1)
- **신규 ENH-322**: validate-plugin.js 21-key whitelist (Convention Restoration 정신)
- **신규 ENH-323**: SessionStart CC version detection (forward-proofing)
- **ADR 0011**: Plugin Manifest Schema Compliance Policy 정식 채택

### 9.3 차별화 streak 추적

- R3-321 신규 entry: streak 시작 2026-05-26 (정병진 first confirmed case)
- 매일 09:00 KST cc-regression-reconcile cycle 자동 trace
- Anthropic 정책 변화 (Q1 lenient → 명확화) 시 ADR 0011 amend

---

## 10. Stakeholder Map

| Stakeholder | Role | Sprint 영향 | 응답 의무 |
|-------------|------|-----------|---------|
| **kay (POPUP STUDIO)** | Decision maker + 메인테이너 | 전 phase (gate별 confirm) | sprint-master-planner agent 2nd-cycle dogfooding 검증 + 정병진 회신 |
| **정병진 (@bj)** | 외부 dogfooder #2 후보 (HOT) | Recovery Sub-sprint (F3 회신) + Forward-proofing (F14 Hall of Fame entry) | CC `--version` 확인 + install 재시도 + Stage 2 repro confirm |
| **@pruge (James Kim)** | 외부 dogfooder #1 (v2.1.19 first follower) | (observation) — dogfooder policy first-follower 효과 입증 | 본 sprint 진행 관찰 + Lifecycle Stage 4 학습 |
| **bkit:cc-version-researcher agent** | Empirical validation 자동화 | Sub-sprint 1 Pre-mortem 검증 + Sub-sprint 2 R3-321 reconcile cycle | ADR 0003 Phase 1.5 자동 적용 |
| **bkit:sprint-master-planner agent** | 본 sprint 2nd-cycle dogfooding | 본 master plan + Report (dogfooding 자가평가) | 2nd-cycle K6 dogfooding KPI 충족 |
| **CC 사용자 (v2.1.142 이하)** | 보호 안내 대상 | F1+F4 advisory (read-only) | (없음, advisory) |
| **Anthropic CC team** | docs vs 구현 모순 (Q1) 해결 책임 | (Out-of-scope, observation only) | (외부 책임) |

---

## 11. Growth Loops

### 11.1 Loop 1 — 외부 dogfooder Lifecycle → bkit quality 강화

```
정병진 (@bj) install 실패 (2026-05-26)
        ↓
F3 회신 메일 (정병진 → kay → 정병진, CC --version 확인)
        ↓
Stage 2 Repro absorbed (F13 E2E v2.1.142 simulation)
        ↓
Stage 3 Fix released (v2.1.20 GA, F1+F4 advisory)
        ↓
Stage 4 Regression Lock (F8 R3-321 guard + F12 CS-015 보강)
        ↓
Stage 5 Public Acknowledge (F14 Hall of Fame entry, @bj dogfooder #2)
        ↓
@pruge first-follower 효과 검증 → 외부 dogfooder #3+ 유입
        ↓
(반복: 외부 dogfooder #3+ Stage 1 issue filed)
```

### 11.2 Loop 2 — Convention Restoration → 회귀 방지 누적

```
정병진 incident → bkit displayName confusion
        ↓
F9 EXPECTED_PLUGIN_JSON_KEYS SoT 도입
        ↓
F5 validate-plugin.js --strict mode
        ↓
F6 contract-check.yml step 신설
        ↓
F8 R3-321 guard + reconcile cycle 통합
        ↓
F10 SessionStart CC version detection (forward-proofing)
        ↓
ADR 0011 정책 정식화
        ↓
같은 incident 0건 + 외부 사용자 self-service 가능
        ↓
(반복: 향후 plugin schema 변경 시 정책 자동 적용)
```

---

## 12. Risk Matrix (전체)

| Risk ID | 시나리오 | Likelihood | Severity | Mitigation 출처 |
|---------|---------|:---------:|:--------:|:-------------:|
| **R1** | 정병진 CC 버전 미확정 (Q2) | **H** | **C** | § 7 R1 |
| **R2** | Anthropic docs vs 구현 모순 (Q1) | M | **C** | § 7 R2 |
| **R3** | displayName 제거 시 v2.1.143+ 회귀 (Anti-Mission 차단) | L | **C** | § 7 R3 |
| **R4** | SessionStart 성능 overhead | M | H | § 7 R4 |
| **R5** | docs-code-invariants SoT 충돌 | L | M | § 7 R5 |
| **R6** | min CC v2.1.143 진입장벽 | M | M | § 7 R6 |
| **R7** | R3-321 reconcile cycle 안정성 | L | M | § 7 R7 |
| **R8** | dogfooder abuse | L | L | § 7 R8 |
| **R9** | validate-plugin --strict false-positive | M | H | § 7 R9 |

### 12.1 Severity 분류 요약

- **Critical (C) — 3건**: R1 (Q2 미해결), R2 (Q1 미해결, Anthropic 책임), R3 (Anti-Mission 명시 차단)
- **High (H) — 2건**: R4 (SessionStart overhead), R9 (CI false-positive)
- **Medium (M) — 3건**: R5 (SoT 충돌), R6 (진입장벽), R7 (reconcile 안정성)
- **Low (L) — 1건**: R8 (dogfooder abuse)

### 12.2 Critical Risk 대응 의사결정 표

| Risk | 발화 trigger | 결정 권한 | 옵션 |
|------|------------|---------|------|
| R1 | 정병진 CC `--version` 회신 받음 후 v2.1.142 초과인 것으로 확인 | kay | (a) 별도 incident 추적 / (b) v2.1.20 sprint scope 보강 / (c) sprint Out-of-scope (Q2 미해결 명시) |
| R2 | Anthropic CC 신규 release에서 docs lenient 명시 변화 | kay + cc-version-researcher | (a) ADR 0011 amend / (b) sprint v2.1.21+ 신규 분기 / (c) cc-regression reconcile cycle archived |
| R3 | PR에서 displayName 제거 시도 발견 | CI gate (F5 + F12 자동 차단) | (자동 fail, manual override 없음) |

---

## 13. Sprint Timeline (12-day Gantt + 2-day buffer)

```
D1 (2026-05-23 ~)
├─ AM     : Sprint Recovery PRD + Plan + F3 정병진 회신 메일 출고 (HOT) — § 3.2
├─ PM     : Sprint Recovery Design + F1 (README advisory) + F4 (cc-compatibility.guide.md) Do 시작

D2
├─ AM     : Sprint Recovery Do (F1 + F2 + F4) + Iterate
├─ PM     : Sprint Recovery QA + Report + Archived
└─ EOD    : Sprint Defense PRD + Plan 시작

D3
├─ AM     : Sprint Defense Plan + F9 SoT 설계
├─ PM     : Sprint Defense Design (F9 → F5 → F6 → F8 순)

D4-D6
├─ Sprint Defense Do (F5 validate-plugin.js --strict + F6 contract-check.yml step + F7 release-plugin-tag.sh wire + F8 R3-321 guard + F9 SoT 통합)

D7
├─ AM     : Sprint Defense QA + Report
├─ PM     : Sprint Defense Archived
└─ EOD    : Sprint Forward-proofing PRD + Plan 시작

D8
├─ AM     : Sprint Forward-proofing Plan + ADR 0011 초안
├─ PM     : Sprint Forward-proofing Design (F10 + F11 + F12 + F13 + F14)

D9-D11
├─ Sprint Forward-proofing Do (F10 SessionStart hook + F11 ADR 0011 정식 + F12 CS-015 보강 + F13 E2E v2.1.142 simulation + F14 Hall of Fame @bj entry)

D12
├─ AM     : Sprint Forward-proofing QA + Report
├─ PM     : Sprint Forward-proofing Archived + Sprint Report (종합)
└─ EOD    : Sprint Archived (v2.1.20 sprint terminal state)

(buffer: D13-D14 — 2 days safety margin for QUALITY_GATE_FAIL / ITERATION_EXHAUSTED auto-pause 대응)
```

### 13.1 Phase Timeout 4h × 8 phases × 3 sub-sprints = 96h cap

- `bkit.config.json:sprint.phaseTimeoutHours = 4`
- 3 sub-sprints × 8 phases = 24 phase 진행 ⇒ 4h × 24 = **96h cap (4 days)**
- 실 작업 12 days + buffer 2 days = 14 days, **TIMEOUT 안전 margin 충분**
- Sub-sprint 별 phase 4h 표준 + buffer = 안전망 확보

### 13.2 Sub-sprint별 Day 분배 요약

| Sub-sprint | Days | Sprint-internal % | Phase 별 시간 |
|-----------|:----:|:----------------:|:------------:|
| 1. Recovery (P0) | 2d | 17% | PRD 2h / Plan 2h / Design 4h / Do 4h / Iterate 2h / QA 2h / Report 2h / Archived auto |
| 2. Defense (P1) | 5d | 42% | PRD 2h / Plan 4h / Design 8h / Do 16h / Iterate 4h / QA 4h / Report 2h / Archived auto |
| 3. Forward-proofing (P2) | 5d | 42% | PRD 2h / Plan 4h / Design 8h / Do 16h / Iterate 4h / QA 4h / Report 2h / Archived auto |

---

## 14. Token Budget Allocation (1M cap 검증)

### 14.1 Sub-sprint 별 Token Budget (recommendSprintSplit 활용)

| Sub-sprint | LOC est. | tokensPerLOC (6.67) | Core Tokens | + Design/TC | Total | maxTokensPerSprint (100K) 적합 |
|-----------|:--------:|:-------------------:|:-----------:|:-----------:|:-----:|:-----------------------------:|
| 1. Recovery (P0) | 50 | 6.67 | 333 | +49.7K | **50K** | ✅ |
| 2. Defense (P1) | 400 | 6.67 | 2,668 | +197.3K | **200K** | partial (100K cap 초과, 2-bin 분할 필요) |
| 3. Forward-proofing (P2) | 450 | 6.67 | 3,001 | +147K | **150K** | partial (100K cap 초과, 2-bin 분할 필요) |
| **Sum (Core LOC)** | **900** | - | **6,002** | - | **400K** | - |

### 14.2 maxTokensPerSprint cap 초과 처리

- Sub-sprint 2 Defense 200K — 100K cap 초과 → 내부 2-bin 분할 (F5+F6+F9 / F7+F8)
- Sub-sprint 3 Forward-proofing 150K — 100K cap 초과 → 내부 2-bin 분할 (F10+F11 / F12+F13+F14)
- `recommendSprintSplit` 명시: sub-sprint 내부 bin은 logical phase 분할 (실 sprint container 자체는 3개 유지)

### 14.3 safetyMargin 0.25 적용

- effectiveBudget = 1,000,000 × (1 - 0.25) = **750,000 tokens**
- estimated Sum (400K) ÷ effectiveBudget (750K) = **53% 활용**
- safe margin 350K 유지 ⇒ BUDGET_EXCEEDED auto-pause 가능성 **Low**

### 14.4 bkit.config.json:sprint 정합 검증

| Config Key | Value | 본 Sprint 정합 |
|-----------|:-----:|:------------:|
| `sprint.defaultBudget` | 1,000,000 | ✅ 400K 추정 < 1M cap (60% buffer) |
| `sprint.defaultTrustLevel` | L2 | ✅ L2 default |
| `sprint.phaseTimeoutHours` | 4 | ✅ 96h cap 적합 |
| `sprint.maxIterations` | 5 | ✅ matchRate <90 시 iter≥5 ITERATION_EXHAUSTED |
| `sprint.qualityGates.M1` | 90 (target 100) | ✅ K9 ≥90 (100 목표) |
| `sprint.qualityGates.M2` | 80 | ✅ M2 ≥80 |
| `sprint.qualityGates.M3` | 0 | ✅ M3 =0 |
| `sprint.qualityGates.M8` | 85 | ✅ M8 ≥85 |
| `sprint.contextSizing.maxTokensPerSprint` | 100,000 | partial (Defense + Forward-proofing 200K/150K — 내부 2-bin 분할 적용) |
| `sprint.contextSizing.tokensPerLOC` | 6.67 | ✅ § 14.1 적용 |
| `sprint.contextSizing.safetyMargin` | 0.25 | ✅ § 14.3 적용 |

---

## 15. Auto-Pause Triggers (4 활성)

| Trigger | 조건 | 가능성 | 사용자 결정 옵션 |
|---------|------|:-----:|----------------|
| **QUALITY_GATE_FAIL** | M3 > 0 OR S1 < 100 | **Medium** (F5 21-key whitelist + F13 E2E simulation TC 부하) | (a) fix & resume / (b) forward fix (TC 추가) / (c) abort & archive |
| **ITERATION_EXHAUSTED** | iter ≥ 5 AND matchRate < 90 | Low (gap-detector matchRate 100 목표) | (a) forward fix (수동 patch) / (b) carry to v2.1.21 / (c) abort |
| **BUDGET_EXCEEDED** | cumulativeTokens > 1M | **Low (400K 추정, 60% buffer)** | (a) budget 증액 (`.bkit/state/sprint/v2120-marketplace-recovery.json` patch) & resume / (b) abort / (c) archive partial |
| **PHASE_TIMEOUT** | phase > 4h | Low (2d buffer 충분) | (a) timeout 연장 (4h → 8h patch) / (b) force-advance (다음 phase 강제 전이) / (c) abort |

### 15.1 Resume / Abort 흐름

| 상황 | 절차 |
|------|------|
| Auto-pause 후 resume | `/sprint resume v2120-marketplace-recovery` — 사유 해소 검증 + audit_logger record |
| 사용자 abort | `/sprint archive v2120-marketplace-recovery` — terminal state (readonly) + report 자동 생성 |
| Phase forward (gate skip) | 사용자 명시 + L4 only — `/sprint phase v2120-marketplace-recovery --force-advance` |

### 15.2 Trigger 활성화 시 Sub-sprint별 영향

| Trigger | Recovery 영향 | Defense 영향 | Forward-proofing 영향 |
|---------|:------------:|:-----------:|:-------------------:|
| QUALITY_GATE_FAIL | Low | **Medium** (F5 + F8 TC) | Medium (F13 E2E) |
| ITERATION_EXHAUSTED | Low | Medium | Low |
| BUDGET_EXCEEDED | Low | Low (200K < 1M) | Low (150K < 1M) |
| PHASE_TIMEOUT | Low | Medium (F5 8h cap 위험) | Low |

---

## 16. Open Questions (사용자 의사결정 보류 — 5건)

| # | Question | Options | 기본 선택 | 결정 시점 |
|---|---------|---------|---------|---------|
| **Q1** | docs vs 구현 lenient/strict 모순 — Anthropic 책임 영역 자체 해결? | (a) bkit Out-of-scope 명시 / (b) Anthropic gh issue 제출 / (c) 자체 회피 layer 도입 | **(a) bkit Out-of-scope** (Anthropic 책임) — ADR 0011 § Open Question 명시 | PRD § 6 명시 |
| **Q2** | 정병진 CC 버전 미확정 — 회신 받은 후 v2.1.142 초과인 것으로 확인되면? | (a) sprint scope 보강 / (b) 별도 incident 추적 / (c) Out-of-scope (Q2 미해결 명시) | **(c) Out-of-scope** + 회신 받은 후 재검토 | F3 회신 받은 후 결정 |
| **Q3** | v2.1.143 release date (정확 일자) | (a) cc-version-researcher agent 재조회 / (b) Anthropic CHANGELOG 직접 인용 / (c) 미상으로 처리 | **(b) + (c) hybrid** — 2026-05-26 CO-4 patch: Anthropic CHANGELOG dateless 영구 미공개 확정 + Releasebot detection 2026-05-15 proxy (partially resolved) | F4 cc-compatibility.guide.md § 2.2 amend 완료 (2026-05-26 CO-4) |
| **Q4** | `marketplace.json` minimum CC version spec 존재 여부 | (a) marketplace.schema.json 직접 조회 / (b) `requirements.claudeCode` 키 후보 시도 / (c) 미가능 시 F2 보류 | **(a) schema 조회 우선** + (c) fallback | F2 Do 단계 진입 시 |
| **Q5** | v2.1.142 이하 CC 사용자 비율 — 사용자 진입장벽 영향 (R6) | (a) Anthropic stable telemetry 미상 / (b) bkit OTEL telemetry.js 추적 / (c) 추정으로 처리 | **(c) 추정 (95% 이미 upgrade)** + post-release feedback 모니터 | sprint 종결 후 1-month |

### 16.1 Open Question 결정 history

| Q | 결정 일자 | 결정 권한 | 결정 사유 |
|---|---------|---------|---------|
| Q1 | (TBD) | kay | - |
| Q2 | (TBD) | kay | - |
| Q3 | 2026-05-26 (CO-4 patch) | cc-version-researcher + ADR 0003 Phase 1.5 재적용 | Anthropic dateless 정책 영구 명시 + Releasebot 2026-05-15 proxy (partially resolved) |
| Q4 | (TBD) | kay | - |
| Q5 | (TBD) | kay (post-release) | - |

---

## 17. Cross-Sprint Dependency

### 17.1 본 sprint가 다른 sprint 의존

- **Sprint v2.1.14 (Differentiation Release)**: 본 sprint의 8-phase container + sprint-master-planner agent (2nd-cycle dogfooding)는 v2.1.14 산출물에 의존
- **Sprint v2.1.17 (CI/CD Hardening)**: 본 sprint의 contract-check.yml 신규 step (F6)는 v2.1.17 5/12~5/20 contract red 8-day class close baseline에 의존
- **Sprint v2.1.18 (Carryover Cleanup)**: 본 sprint의 sprint discipline baseline은 v2.1.18 6 CO closed에 의존
- **Sprint v2.1.19 (Quality Maturation)**: 본 sprint의 외부 dogfooder Lifecycle (F3+F14)은 v2.1.19 S4 Proactive External Dogfooder Lifecycle policy에 의존 (@pruge first follower)
- **ADR 0003** (2026-04-24 Accepted) + **ADR 0006** (2026-04-28 Accepted): 본 sprint는 ADR 0003 위반 사례 회고 + ADR 0006 § Empirical Validation Gate 미이행 회복

### 17.2 다른 sprint가 본 sprint 산출 활용

- **Sprint v2.1.21+ (예정)**: 
  - F8 R3-321 guard telemetry 데이터 (3-month) 분석 + reconcile cycle 안정성 평가
  - F10 ENH-323 SessionStart CC version detection telemetry 데이터 (3-month) 분석 + 격하/유지 결정
  - F14 Hall of Fame 정병진 entry 후속 — Stage 4 (Regression Lock) → Stage 5 (Public Acknowledge) 정식 완료
  - Q5 미해결: v2.1.142 이하 사용자 비율 trend 데이터 검토
- **CARRY closure**: 본 sprint의 F7 release-plugin-tag.sh wire는 ADR 0006 § Empirical Validation Gate 미이행 CARRY 해소
- **신규 ENH 활용**: ENH-321 + ENH-322 + ENH-323은 v2.1.21+ 분기에서 정식 편입 후 차별화 #2 강화 누적

### 17.3 Cross-Sprint Integration 매트릭스

| Sprint | 본 sprint 의존 방향 | 산출물 활용 |
|--------|-------------------|-------------|
| v2.1.14 Differentiation | input | 8-phase container, sprint-master-planner agent |
| v2.1.17 CI/CD Hardening | input | contract-check.yml baseline |
| v2.1.18 Carryover | input | sprint discipline baseline |
| v2.1.19 Quality Maturation | input | 외부 dogfooder Lifecycle policy |
| ADR 0003 | reference | Phase 1.5 Empirical Validation 의무 |
| ADR 0006 | reference | § Empirical Validation Gate 의무 wire 회복 |
| v2.1.21+ | output | R3-321 + ENH-322 + ENH-323 telemetry |
| **ADR 0011 (신규)** | **output** | **Plugin Manifest Schema Compliance Policy 정식 채택** |

---

## 18. Sprint 추적 (Living Document)

본 master plan 은 sprint 진행 중 cumulative KPI 갱신 + phase 전이 시 history append. archived 시 readonly 전환.

### 18.1 Living KPI Section (sprint 진행 중 갱신)

| Date | K1 | K2 | K3 | K4 | K5 | K6 | K7 | K8 | K9 | K10 | Notes |
|------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---:|-------|
| 2026-05-23 | - | - | - | - | - | - | - | - | - | - | Sprint 시작, master plan 작성 |
| (TBD D2 EOD) | 100% | - | - | - | - | partial | - | - | - | - | Recovery Archived |
| (TBD D7 EOD) | 100% | 100% | 100% | 100% | - | partial | - | - | partial | - | Defense Archived |
| (TBD D12 EOD) | 100% | 100% | 100% | 100% | 100% | =1 | 100% | 100% | ≥90 | =100 | Forward-proofing + Sprint Archived |

### 18.2 Phase Transition History (append-only)

| Phase | Entered | Exited | Duration | Auto-pause Trigger | Resume Reason |
|-------|---------|--------|---------|------------------|--------------|
| (master plan) | 2026-05-23 | - | - | - | - |
| prd (Recovery) | (TBD) | - | - | - | - |
| ... | ... | ... | ... | ... | ... |

### 18.3 Sprint Discovery Log (cc-regression reconcile + Open Question 진행)

| Date | Discovery | Source | Impact |
|------|---------|--------|--------|
| 2026-05-26 | 정병진 (@bj) install 실패 — `Unrecognized key: "displayName"` | external dogfooder GH issue | Sprint v2.1.20 trigger |
| 2026-05-XX | cc-version-researcher 88% 신뢰도 결론 — displayName v2.1.143+ 공식 schema | `docs/03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md` | Anti-Mission "displayName 제거 안 함" 확정 |
| 2026-05-23 | bkit 실측 — 9 keys 모두 21-key whitelist 내, 비표준 0개 | `.claude-plugin/plugin.json` 직접 검수 | F5 21-key whitelist 적용 안전 확인 |
| 2026-05-23 | 실측 — `validate-plugin.js` line 264-272 name+version만 체크 | scripts/validate-plugin.js 직접 검수 | F5 ENH-322 신규 ENH 정당화 |
| 2026-05-23 | 실측 — `release-plugin-tag.sh` line 82-83 check-trust-score + check-quality-gates만 호출 | scripts/release-plugin-tag.sh 직접 검수 | F7 ADR 0006 wire 미이행 확정 |
| 2026-05-23 | 실측 — `cc-regression/registry.js` 21 entries (plugin manifest 관련 0건) | lib/cc-regression/registry.js 직접 검수 | F8 R3-321 신규 ENH 정당화 |
| 2026-05-23 | 실측 — `docs-code-invariants.js` plugin.json key SoT 정의 없음 | lib/domain/rules/docs-code-invariants.js 직접 검수 | F9 신규 SoT 필요 확정 |
| 2026-05-23 | 실측 — `config-sync.test.js` CS-015 line 380-384 displayName 존재 명시적 요구 | test/integration/config-sync.test.js 직접 검수 | displayName 제거 시 CS-015 fail → Anti-Mission 강화 |
| 2026-05-23 | 실측 — `contract-check.yml` line 1-109 plugin manifest schema validation step 없음 | .github/workflows/contract-check.yml 직접 검수 | F6 신규 step 정당화 |
| 2026-05-23 | 실측 — bkit-starter plugin.json `displayName` 없음 | docs/external-dogfooders 참조 | bkit-starter 영향 0 확정 |

---

## 19. Final Checklist (Master Plan 완료 검증)

- [x] Executive Summary 6-row (Mission + Anti-Mission + Core Primitives + Trust Level + Auto-pause + Success Criteria) — § 0
- [x] 4-Perspective 가치 표 (안정성 5 / 성능 3 / 보안 4 / 비용 5) — § 0.1
- [x] Context Anchor 7 keys (WHY / WHO / WHAT / WHAT NOT / RISK / SUCCESS / SCOPE / OUT-OF-SCOPE) — § 1
- [x] Features 14건 (P0×4 / P1×5 / P2×5) + 신규 ENH 3건 + DAG — § 2
- [x] 8-phase Roadmap × 3 sub-sprints + Hot-path (F3 정병진 회신) — § 3
- [x] Quality Gates M1-M10 + S1-S4 = 14 gates 매트릭스 + Sub-sprint별 활성 매트릭스 — § 4
- [x] 3 Sub-sprints Topological DAG + Token Budget — § 5
- [x] KPI K1-K10 ↔ Gate 매핑 + Phase별 진척률 — § 6
- [x] Pre-mortem 9건 (Critical 3 + High 2 + Medium 3 + Low 1) + Critical 대응 의사결정 표 — § 7
- [x] Empirical Validation Compliance (ADR 0003 + 0006 정책 강화) + 정책 강화 표 — § 8
- [x] Differentiation 7/7 vs 본 sprint 기여 (차별화 #2 직접 강화) — § 9
- [x] Stakeholder Map 7명 (정병진 + @pruge + kay + 2 agents + CC 사용자 + Anthropic) — § 10
- [x] Growth Loops 2 (외부 dogfooder Lifecycle, Convention Restoration) — § 11
- [x] Risk Matrix 9 (Critical 3 + High 2 + Medium 3 + Low 1) — § 12
- [x] Timeline 12-day Gantt + 2-day buffer + Phase Timeout cap — § 13
- [x] Token Budget 400K estimate / 750K effective / 1M cap (정합) + maxTokensPerSprint 초과 처리 — § 14
- [x] Auto-Pause Triggers 4 활성 + Resume/Abort 흐름 + Sub-sprint별 영향 — § 15
- [x] Open Questions 5건 (Q1-Q5) + 결정 history append-only — § 16
- [x] Cross-Sprint Dependency (v2.1.14/17/18/19 입력 + ADR 0003/0006 reference + v2.1.21+ 출력 + ADR 0011 신규) — § 17
- [x] Living document 추적 골조 + KPI history + Phase transition + Sprint Discovery Log — § 18

### 19.1 Master Plan 작성 시 verified 사실 (file:line 출처 보장)

- ✅ `scripts/validate-plugin.js` line 264-272 — name+version만 체크 (사실 확인 by 실측)
- ✅ `scripts/release-plugin-tag.sh` line 82-83 — check-trust-score-reconcile + check-quality-gates만 (사실 확인 by 실측)
- ✅ `lib/cc-regression/registry.js` 21 entries — plugin manifest 관련 0건 (사실 확인 by 실측)
- ✅ `lib/domain/rules/docs-code-invariants.js` line 1-132 — EXPECTED_COUNTS + EXPECTED_*_NAMES만, plugin.json key SoT 없음 (사실 확인 by 실측)
- ✅ `test/integration/config-sync.test.js` CS-015 line 380-384 — displayName 존재 명시적 요구 (사실 확인 by 실측)
- ✅ `.github/workflows/contract-check.yml` line 1-109 — plugin schema validation step 없음 (사실 확인 by 실측)
- ✅ `.claude-plugin/plugin.json` 9 keys — 모두 21-key whitelist 내, 비표준 0개 (사실 확인 by 실측)
- ✅ `.claude-plugin/marketplace.json` bkit entry 8 keys — 비표준 0개 (사실 확인 by 실측)
- ✅ `hooks/startup/session-context.js` 429 lines — CC version detection 없음 (사실 확인 by 실측)
- ✅ `docs/adr/0010-effort-aware-invariant.md` 존재 → 다음 ADR 0011 — (사실 확인 by 실측)
- ✅ `docs/external-dogfooders/_README.md` line 57-60 — @pruge first dogfooder, dogfooder #2 정책 신규 (사실 확인 by 실측)
- ✅ `docs/03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md` — cc-version-researcher 88% 신뢰도 결론 (사실 확인 by 실측)

### 19.2 미해결 의문점 (Q1-Q5) — 솔직히 명시

- ⚠️ **Q1** docs vs 구현 모순 (Anthropic 책임 영역, bkit이 해결 불가)
- ⚠️ **Q2** 정병진 CC 버전 미확정 (회신 대기) → Sprint Out-of-scope 명시 + 회신 후 재검토
- ✅ **Q3** partially resolved (2026-05-26 CO-4 patch): Anthropic CHANGELOG dateless 영구 미공개 + Releasebot 2026-05-15 proxy
- ⚠️ **Q4** marketplace.json `requirements.claudeCode` spec 존재 여부 → F2 Do 단계 진입 시 schema 직접 조회
- ⚠️ **Q5** v2.1.142 이하 사용자 비율 → 추정 95% upgrade + post-release feedback 모니터

---

> **Status**: Draft v1.0 — pending review by kay (POPUP STUDIO).
> **Next**: PRD (`docs/sprint/v2120-marketplace-recovery/prd.md`) → Plan (`docs/sprint/v2120-marketplace-recovery/plan.md`) → Design (`docs/sprint/v2120-marketplace-recovery/design.md`).
> **Dogfooding Marker**: `bkit:sprint-master-planner` agent 2nd-cycle spawn — Sprint Management v2.1.13 GA self-validation 의무 2번째 적용 (v2.1.14 1st spawn 이후 6번째 sprint container).
> **External Dogfooder Marker**: bkit Early Adopter Program 5-stage Lifecycle Stage 1 (정병진 @bj Issue Filed 2026-05-26) → Stage 5 (Public Acknowledge, F14 Hall of Fame entry) 달성 목표.
> **ADR Marker**: ADR 0003 위반 사례 회고 + ADR 0006 § Empirical Validation Gate 미이행 회복 + ADR 0011 (Plugin Manifest Schema Compliance Policy) 신규 채택.
