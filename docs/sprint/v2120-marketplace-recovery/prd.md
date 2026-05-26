---
template: sprint-prd
version: 1.0
sprintId: v2120-marketplace-recovery
displayName: bkit v2.1.20 — Marketplace Recovery + Plugin Manifest Schema Compliance
phase: PRD (1/7)
date: 2026-05-26
author: kay (POPUP STUDIO) + bkit:sprint-master-planner agent (2nd-cycle dogfooding)
trustLevel: L2
---

# v2120-marketplace-recovery PRD — Sprint Management

> **Sprint ID**: `v2120-marketplace-recovery`
> **Phase**: PRD (1/7)
> **Date**: 2026-05-26
> **Author**: kay (POPUP STUDIO) + `bkit:sprint-master-planner` agent (Sprint Management v2.1.13 GA 2nd-cycle dogfooding)
> **Trust Level**: L2
> **Master Plan Reference**: `docs/sprint/v2120-marketplace-recovery/master-plan.md`
> **선행 분석 보고서**: `docs/03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md` (cc-version-researcher 88% 신뢰도 결론)

---

## 0. Context Anchor (보존 — 후속 phase 모두 복사)

| Key | Value |
|-----|-------|
| **WHY** | (1) 외부 dogfooder 정병진(@bj) 2026-05-26 bkit v2.1.14 install 실패 — `Validation errors: : Unrecognized key: "displayName"` 에러 (path: `/Users/bj/.claude/plugins/cache/temp_git_1779631720189_ocjr7a/.claude-plugin/plugin.json`) / (2) cc-version-researcher 88% 신뢰도 결론: `displayName`은 v2.1.143+ 정식 schema 키 — 정병진 CC ≤ v2.1.142 추정 98% / (3) ADR 0003 (Phase 1.5 Empirical Validation) + ADR 0006 (§ Empirical Validation Gate) 위반 사례 — 정책 강화 필요 / (4) bkit Early Adopter Program (v2.1.19 정책) 5-stage Lifecycle 첫 외부 트리거 — 정병진은 @pruge에 이은 dogfooder #2 후보 |
| **WHO** | **1차** 정병진 (@bj, 외부 dogfooder #2) / **2차** 향후 CC ≤ v2.1.142 사용 신규 사용자 N명 / **3차** kay (POPUP STUDIO, 메인테이너) / **4차** @pruge (dogfooder #1, policy first follower) / **5차** bkit-starter 사용자 (displayName 미포함, 영향 0 확정) |
| **RISK** | (R1 Critical) 정병진 CC 버전 미확정 (Q2) — fix 다른 root cause 가능성 25% / (R2 Critical) Anthropic docs vs 구현 lenient/strict 모순 (Q1) / (R3 Critical) `displayName` 제거 시 v2.1.143+ UI picker 회귀 / (R4 High) SessionStart hook CC version detection 성능 overhead / (R6 Medium) bkit min CC v2.1.143 진입장벽 / (R9 High) `validate-plugin.js --strict` false-positive |
| **SUCCESS** | SC1 README + docs CC v2.1.143 명시 / SC2 21-key whitelist CI gate / SC3 `claude plugin validate` Exit 0 의무 / SC4 R3-321 등록 + reconcile PASS / SC5 SessionStart CC detection 발동 / SC6 정병진 install 성공 회신 / SC7 ADR 0011 채택 / SC8 Hall of Fame @bj entry |
| **SCOPE** | **in-scope**: 14 features (P0×4 / P1×5 / P2×5) + 3 신규 ENH (321/322/323) + 1 신규 ADR (0011) + 1 외부 dogfooder entry / **out-of-scope**: `displayName` 제거, v2.1.142 이하 hard reject, Anthropic 모순 해결, bkit-starter 변경, Trust L3/L4 default 변경 |

---

## 1. Problem Statement

### 1.1 현 상태 (As-is)

| 구분 | 사실 | 출처 (file:line 또는 docs URL) |
|------|-----|-----------------------------|
| **incident** | 정병진 @bj install 시도 시 `Validation errors: : Unrecognized key: "displayName"` 에러 (2026-05-26) | external dogfooder GH issue (사용자 직접 회신) |
| **bkit plugin.json** | 9 keys (`name`, `version`, `displayName`, `description`, `author`, `repository`, `license`, `keywords`, `outputStyles`) — 비표준 0개, 모두 21-key whitelist 내 | `.claude-plugin/plugin.json` line 1-20 실측 |
| **cc-version-researcher 결론** | `displayName`은 v2.1.143+ 정식 schema 키 (docs.claude.com 명시 "Requires Claude Code v2.1.143 or later"), strict path는 v2.1.45부터 항상 존재, **정병진 CC ≤ v2.1.142 추정 98%** | `docs/03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md` 88% 신뢰도 |
| **bkit-starter plugin.json** | `displayName` 미포함 — strict reject 영향 0 | external repo `popup-studio-ai/bkit-starter`, marketplace.json bkit-starter entry 확인 |
| **`validate-plugin.js`** | line 264-272 — `name` + `version`만 체크, 21-key whitelist 없음 = 핵심 갭 R2 | `scripts/validate-plugin.js` line 256-279 실측 |
| **`config-sync.test.js` CS-015** | line 380-384 — `name + displayName + description + license` 존재 명시적 요구 → displayName 제거 시 CS-015 fail | `test/integration/config-sync.test.js` line 380-384 실측 |
| **`contract-check.yml`** | line 1-109 — plugin manifest schema validation step 없음 = 핵심 갭 | `.github/workflows/contract-check.yml` 1-109 실측 |
| **`release-plugin-tag.sh`** | line 82-83 — `check-trust-score-reconcile + check-quality-gates`만 호출, `claude plugin validate .` wire 안 됨 = ADR 0006 위반 | `scripts/release-plugin-tag.sh` line 82-83 실측 |
| **`cc-regression/registry.js`** | 21 entries — plugin manifest 관련 guard 0건 = 핵심 갭 R3 | `lib/cc-regression/registry.js` line 1-163, grep "plugin manifest|displayName" → 0 hit 실측 |
| **`docs-code-invariants.js`** | EXPECTED_COUNTS + EXPECTED_*_NAMES만, plugin.json key SoT 없음 | `lib/domain/rules/docs-code-invariants.js` line 1-132 실측 |
| **SessionStart hook** | CC version detection 없음 (`grep "cc.*version\|claude.*--version"` → 0 hit) | `hooks/startup/session-context.js` 429 lines 실측 |

### 1.2 기대 상태 (To-be)

| 구분 | 변경 | 출처 |
|------|------|------|
| **README + README-FULL** | minimum CC v2.1.143 advisory 1-line 추가 | F1 |
| **`.claude-plugin/marketplace.json`** | bkit entry에 minimum CC version 메타데이터 추가 (spec 확인 후, Q4) | F2 |
| **정병진 회신** | CC `--version` 확인 + `npm install -g @anthropic-ai/claude-code@latest` 권장 + ADR 0003 dogfooding marker + Hall of Fame 등록 검토 | F3 |
| **`docs/06-guide/cc-compatibility.guide.md`** | 신규 또는 기존 보강 — bkit minimum CC version 정합 표 + displayName field 출처 + install 실패 시 사용자 대응 가이드 | F4 |
| **`validate-plugin.js`** | `--strict` flag 신설 — 21-key whitelist + min-version metadata + 비표준 키 CI fail | F5 ENH-322 |
| **`contract-check.yml`** | 신규 step `Release Gate — plugin.json schema validation (21-key whitelist)` | F6 |
| **`release-plugin-tag.sh`** | line 82-83 사이 `claude plugin validate .` 추가, Exit 0 의무 — ADR 0006 충족 | F7 |
| **`cc-regression/registry.js`** | 신규 entry R3-321 — displayName v2.1.142- strict reject | F8 ENH-321 |
| **`docs-code-invariants.js`** | `EXPECTED_PLUGIN_JSON_KEYS` SoT 추가 (Object.freeze) + `diffPluginJsonKeys` function | F9 |
| **SessionStart hook** | `detectCCVersion()` 함수 + `BKIT_CC_VERSION_ADVISORY` env + additionalContext warning | F10 ENH-323 |
| **`docs/adr/0011-plugin-manifest-schema-compliance.md`** | 신규 ADR | F11 |
| **`config-sync.test.js` CS-015** | 21-key whitelist 모두 검증 보강 | F12 |
| **`test/e2e/cc-min-version.test.js`** | v2.1.142 simulation + advisory 발동 검증 | F13 |
| **Hall of Fame** | `docs/external-dogfooders/bj.md` + `_README.md` 명단 — @bj entry #2 | F14 |

### 1.3 부재 매트릭스 (Gap Analysis)

| 영역 | As-is | To-be | Gap |
|------|------|-------|-----|
| Validator | `name + version` 체크 | 21-key whitelist + min-version | **핵심 갭 (F5)** |
| CI gate | plugin schema validation 없음 | contract-check.yml step 추가 | **핵심 갭 (F6)** |
| Release gate | `claude plugin validate` wire 없음 | release-plugin-tag.sh wire (ADR 0006) | **핵심 갭 (F7)** |
| Regression registry | plugin manifest 관련 guard 0건 | R3-321 entry 추가 | **핵심 갭 (F8)** |
| Domain SoT | plugin.json key SoT 없음 | EXPECTED_PLUGIN_JSON_KEYS | **핵심 갭 (F9)** |
| Runtime detection | SessionStart에서 CC version 미감지 | `detectCCVersion()` + advisory | **핵심 갭 (F10)** |
| User-facing docs | README에 minimum CC version 미명시 | 1-line advisory | **소소 갭 (F1)** |
| Compliance docs | cc-compatibility.guide.md 없음 또는 빈약 | 신규 또는 보강 | **소소 갭 (F4)** |
| Marketplace metadata | minimum CC version 미명시 | marketplace.json metadata | **소소 갭 (F2, Q4 spec 확인)** |
| ADR | 본 incident root cause 정책화 ADR 없음 | ADR 0011 채택 | **핵심 갭 (F11)** |
| Tests | CS-015 displayName만, E2E 없음 | 21-key 모두 + v2.1.142 simulation | **핵심 갭 (F12+F13)** |
| External dogfooder | @pruge 1건만, 정병진 entry 없음 | @bj entry 추가 (#2) | **소소 갭 (F14)** |

---

## 2. Job Stories (JTBD 6-Part — 8건)

### Job Story 1 — 외부 dogfooder install advisory

- **When** bkit를 git clone + plugin install 시도 시점에 (e.g., 정병진 @bj 2026-05-26 첫 시도),
- **Who** 외부 dogfooder (CC ≤ v2.1.142 환경)
- **I want to** install 실패 즉시 CC version mismatch가 원인임을 정확히 진단받고 + workaround (`npm install -g @anthropic-ai/claude-code@latest`)를 제공받기를
- **so I can** 최소한의 troubleshooting time으로 install 재시도 가능
- **Forces (positive)**: minimum CC version 명시 advisory → 정확한 진단 가능
- **Forces (negative)**: bkit 측 advisory 부재 시 사용자가 강제 displayName 제거 시도 → bkit 본체 회귀 위험
- **Outcome (success)**: 30분 이내 정확한 진단 + workaround 적용 + install 성공

### Job Story 2 — bkit 메인테이너 회귀 방지

- **When** 신규 release PR (v2.1.21+) 머지 단계에서,
- **Who** kay (POPUP STUDIO, 메인테이너)
- **I want to** plugin.json에 비표준 키 추가 / 21-key whitelist 외 키 시도 / displayName 누락 등 schema 위반을 CI 단계에서 자동 차단받기를
- **so I can** 같은 incident (정병진 사례)가 후속 release에서 재발하지 않도록 회귀 방지 인프라 확보 가능
- **Forces (positive)**: `validate-plugin.js --strict` + contract-check.yml step → CI 자동 차단
- **Forces (negative)**: F9 신규 SoT 도입 시 기존 invariant와 충돌 가능성 (R5 Mitigation)
- **Outcome (success)**: 회귀 0건 + cc-regression reconcile cycle 안정성 유지

### Job Story 3 — 신규 사용자 SessionStart 진단

- **When** 신규 사용자가 bkit 첫 사용 시 SessionStart hook 진입 시점에,
- **Who** CC version 미상 신규 사용자 (v2.1.142 이하일 가능성 N%)
- **I want to** 자동으로 CC version 감지 + v2.1.143 미만 시 advisory warning을 받기를
- **so I can** install 단계가 아닌 SessionStart 시점에도 사전 안내받아 향후 plugin install 실패 회피 가능
- **Forces (positive)**: `detectCCVersion()` 함수 + `BKIT_CC_VERSION_ADVISORY` env → forward-proofing
- **Forces (negative)**: child_process.execSync 50-150ms overhead (R4 Mitigation: timeout 200ms cap + opt-out flag)
- **Outcome (success)**: SessionStart 1회/세션 cap + 자동 advisory + cache 1시간 TTL

### Job Story 4 — Empirical Validation 자동화

- **When** Anthropic CC 신규 release 시 cc-version-researcher agent 분석 단계에서,
- **Who** cc-version-researcher agent (자동) + kay (확인)
- **I want to** Plugin manifest schema 변경 (예: 신규 key 추가) 자동 감지 + bkit 정합 분석 자동화
- **so I can** ADR 0003 Phase 1.5 Empirical Validation 의무 충족 + 본 incident 같은 회귀 사전 예방
- **Forces (positive)**: cc-regression-reconcile.yml 매일 09:00 KST + R3-321 entry tracking
- **Forces (negative)**: Anthropic CHANGELOG 신호 부족 시 (예: v2.1.143 changelog displayName 미명시, Q3) 자동 감지 한계
- **Outcome (success)**: cc-regression reconcile cycle 매일 PASS + 변화 즉시 ADR amend

### Job Story 5 — Hall of Fame 정병진 entry (외부 dogfooder Lifecycle)

- **When** 정병진 install 성공 회신 + Repro absorbed 단계에서,
- **Who** kay (POPUP STUDIO) + bkit Early Adopter Program 운영
- **I want to** 정병진 @bj 외부 dogfooder #2 entry를 `docs/external-dogfooders/bj.md` + Hall of Fame 명단에 정식 추가
- **so I can** v2.1.19 외부 dogfooder 정책 first-follower 효과 입증 + bkit Early Adopter Program 확산
- **Forces (positive)**: @pruge first follower + @bj second entry → dogfooder #3+ 유입 가속
- **Forces (negative)**: Q2 정병진 CC 버전 미확정 — Lifecycle Stage 1→2 진행 가능성 검증 필요
- **Outcome (success)**: F14 entry 추가 + Trust Score externalDogfoodFeedbackResponseRate 누적

### Job Story 6 — 정책 강화 ADR 채택

- **When** sprint 진행 중 ADR 0011 작성 단계에서,
- **Who** kay + sprint-orchestrator agent
- **I want to** ADR 0003 위반 사례 회고 + ADR 0006 § Empirical Validation Gate 미이행 회복 + 신규 정책 (Plugin Manifest Schema Compliance Policy) 정식 채택
- **so I can** 향후 plugin schema 관련 incident 0건 + 정책 부재 갈래 해소
- **Forces (positive)**: ADR 0003 + 0006 정합 → 정책 일관성 확보
- **Forces (negative)**: ADR 0011 § Open Question Q1 (Anthropic 모순) → bkit 측 해결 불가 명시
- **Outcome (success)**: ADR 0011 Accepted + History append (ADR 0003 + 0006 § History)

### Job Story 7 — CI false-positive 회피

- **When** v2.1.21+ 신규 release PR 진행 중 `validate-plugin.js --strict` step 도입 직후,
- **Who** PR 작성자 (kay 또는 contributor)
- **I want to** 기존 통과 PR이 갑자기 fail되는 false-positive 회피 — 보수적 출시 (1주 advisory only → 2주차 strict)
- **so I can** CI gate 도입 시 PR backlog accumulate 없이 점진 전환 가능
- **Forces (positive)**: continue-on-error: true 1주 → false 2주차 전환 → 점진 도입
- **Forces (negative)**: R9 false-positive 가능성 — bkit-starter plugin (displayName 없음, 별도 plugin) CI 면제 필요
- **Outcome (success)**: 1주 advisory + 2주 strict → backlog 0건

### Job Story 8 — Anthropic 정책 변경 대응

- **When** Anthropic이 미래에 docs vs 구현 lenient/strict 모순 (Q1) 해결 release 시점에,
- **Who** kay + cc-version-researcher
- **I want to** cc-regression reconcile cycle을 통해 변화 자동 감지 + ADR 0011 amend
- **so I can** Anthropic 정책 변경에 빠르게 대응 + bkit 정합 유지
- **Forces (positive)**: R3-321 entry tracking + 매일 09:00 KST reconcile
- **Forces (negative)**: Q1 미해결 — bkit이 자체 해결 불가 (Anthropic 책임 영역)
- **Outcome (success)**: ADR 0011 § History append + sprint v2.1.21+ 신규 분기 가능

---

## 3. User Personas

### Persona 1 — 정병진 (@bj, 외부 dogfooder #2 후보)

| 항목 | 내용 |
|-----|------|
| **Identity** | 외부 사용자, 이메일 미명시 (사용자 회신 대기 — Q2 미해결) |
| **Role** | bkit Early Adopter — `dandi-village-ledger` 또는 미상 project 사용 |
| **Goals** | bkit v2.1.14 install + 본격 활용 |
| **Pain points** | install 실패 (2026-05-26), `Validation errors: : Unrecognized key: "displayName"` 에러 → root cause 미상 |
| **CC version (추정)** | v2.1.142 이하 (cc-version-researcher 88% 신뢰도 + 본 incident 직접 사실 = 98%) |
| **Dogfooder Lifecycle stage** | **Stage 1 (Issue Filed 2026-05-26)** — Stage 2 Repro absorbed 진행 목표 (F13 E2E v2.1.142 simulation) |
| **Sprint 영향** | F3 회신 (HOT) + F14 Hall of Fame entry |

### Persona 2 — @pruge (James Kim, 외부 dogfooder #1 — first follower)

| 항목 | 내용 |
|-----|------|
| **Identity** | `dandi-village-ledger` project, v2.1.19 dogfooder #1 (정책 first follower) |
| **Role** | 10 issues / 1.5 days driving v2.1.17/v2.1.18/v2.1.19 — bkit Early Adopter Program first entry |
| **Goals** | bkit 정상 동작 검증 + 향후 dogfooder #2+ 유입 검증 |
| **Pain points** | (v2.1.19 종결 후 안정 단계) — 본 sprint observation only |
| **Dogfooder Lifecycle stage** | **Stage 5 (Public Acknowledge 2026-05-21 v2.1.19 archived)** — 본 sprint는 observation only |
| **Sprint 영향** | (없음, 정책 first follower 효과 입증 baseline) |

### Persona 3 — kay (POPUP STUDIO, 메인테이너)

| 항목 | 내용 |
|-----|------|
| **Identity** | bkit 메인테이너 + sprint Decision maker |
| **Role** | 전 phase gate별 confirm + 정병진 회신 + 본 sprint 종합 검증 |
| **Goals** | sprint 12-day 종결 + 외부 dogfooder #2 entry 추가 + 회귀 방지 인프라 도입 |
| **Pain points** | ADR 0003 위반 사례 회고 + ADR 0006 § Empirical Validation Gate 미이행 회복 필요 |
| **Sprint 영향** | 전 phase 결정 권한 + Q1-Q5 결정 + L4 force-advance 권한 |

### Persona 4 — bkit:sprint-master-planner agent (2nd-cycle dogfooding 자기 자신)

| 항목 | 내용 |
|-----|------|
| **Identity** | bkit v2.1.13 GA 직후 첫 spawn (v2.1.14 sprint) 이후 6번째 sprint container 진입 시 2nd-cycle dogfooding |
| **Role** | 본 master plan + PRD + Plan + Design 자동 생성 |
| **Goals** | sprint Management v2.1.13 GA self-validation 2nd-cycle 누적 |
| **Pain points** | 첫 spawn 대비 출력 품질 안정성 검증 필요 |
| **Sprint 영향** | 본 PRD 작성 (자기 자신) + Report (dogfooding 자가평가) |

### Persona 5 — bkit:cc-version-researcher agent (Empirical validation 자동화)

| 항목 | 내용 |
|-----|------|
| **Identity** | ADR 0003 Phase 1.5 Empirical Validation 자동화 agent |
| **Role** | Plugin manifest schema 변경 자동 감지 + bkit 정합 분석 + cc-regression reconcile cycle 통합 |
| **Goals** | 본 incident 88% 신뢰도 결론 (정병진 CC ≤ v2.1.142 추정) + R3-321 entry tracking |
| **Pain points** | Q1 Anthropic docs vs 구현 모순 자체 해결 불가 (외부 책임) |
| **Sprint 영향** | Sub-sprint 1 Pre-mortem 검증 + Sub-sprint 2 R3-321 reconcile cycle |

---

## 4. Solution Overview

### 4.1 구조 (3-layer 대응)

```
Layer 1: Recovery (P0)
├─ F1 README + README-FULL 1-line advisory
├─ F2 marketplace.json metadata (Q4 spec 확인 후)
├─ F3 정병진 회신 메일 (HOT)
└─ F4 cc-compatibility.guide.md

Layer 2: Defense (P1)
├─ F9 docs-code-invariants.js EXPECTED_PLUGIN_JSON_KEYS SoT
├─ F5 validate-plugin.js --strict (ENH-322)
├─ F6 contract-check.yml step
├─ F7 release-plugin-tag.sh claude plugin validate wire (ADR 0006)
└─ F8 cc-regression/registry.js R3-321 (ENH-321)

Layer 3: Forward-proofing (P2)
├─ F10 SessionStart CC version detection (ENH-323)
├─ F11 ADR 0011 Plugin Manifest Schema Compliance Policy
├─ F12 config-sync.test.js CS-015 21-key 보강
├─ F13 test/e2e/cc-min-version.test.js v2.1.142 simulation
└─ F14 Hall of Fame 정병진 entry
```

### 4.2 핵심 결정

| 결정 | 사유 | 출처 |
|-----|------|------|
| **displayName 제거 안 함** | v2.1.143+ 공식 schema 정식 키 (cc-version-researcher 88% 신뢰도), 제거 시 UI picker 회귀 (R3) | Master Plan § 1 Anti-Mission, Anti-Mission "displayName 제거 안 함" 확정 |
| **Hard reject 안 함, advisory only** | v2.1.143+ 사용자 영향 0 + v2.1.142 이하 사용자 진입장벽 minimize (R6) | Master Plan § 0 Anti-Mission "v2.1.142 이하 사용자 차단 안 함" |
| **Empirical Validation 자동화** | ADR 0003 위반 사례 → 정책 강화 (F11 ADR 0011) + cc-regression reconcile cycle 통합 (F8 R3-321) | Master Plan § 8 Empirical Validation Compliance |
| **21-key whitelist 강제** | Anthropic 공식 schema 명시 21 keys 기준 + bkit 9 keys 모두 포함 + 비표준 0개 확인 | Anthropic docs.claude.com plugin manifest schema |
| **`claude plugin validate .` Exit 0 의무 wire** | ADR 0006 § Empirical Validation Gate 의무 미이행 회복 (~30일 지연) | `docs/adr/0006-cc-upgrade-policy.md` § "Empirical Validation Gate" |
| **SessionStart 1회/세션 cap + cache 1시간 TTL** | 성능 overhead (50-150ms) 최소화 (R4) | F10 ENH-323 design |
| **External dogfooder Lifecycle Stage 1→5 진행** | v2.1.19 정책 first-follower 효과 입증 + dogfooder #2 entry | `docs/external-dogfooders/_README.md` line 57-60 |

### 4.3 데이터 흐름 (3-layer)

```
[정병진 install 실패 2026-05-26]
            │
            ▼
[F3 회신 (HOT)] → 정병진 CC `--version` 회신 받음
            │
            ▼
[F1+F2+F4 advisory 출고] → bkit minimum CC v2.1.143 명시
            │
            ▼
[F9 SoT 도입] → EXPECTED_PLUGIN_JSON_KEYS 정의
            │
            ▼
[F5+F6 CI gate] → validate-plugin.js --strict + contract-check.yml step
            │
            ▼
[F7 release-plugin-tag.sh wire] → claude plugin validate Exit 0 의무
            │
            ▼
[F8 R3-321] → cc-regression reconcile cycle 통합
            │
            ▼
[F10 SessionStart detection] → BKIT_CC_VERSION_ADVISORY env (forward-proofing)
            │
            ▼
[F11 ADR 0011] → 정책 정식 채택
            │
            ▼
[F12 CS-015 + F13 E2E] → 회귀 방지 자동 검증
            │
            ▼
[F14 Hall of Fame] → 정병진 dogfooder #2 entry
            │
            ▼
[Sprint Archived] → v2.1.20 GA + Stage 4 Regression Lock 달성
```

---

## 5. Success Metrics

### 5.1 정량 메트릭

| Metric | Target | 측정 방법 | Source |
|--------|--------|----------|--------|
| **K1** README + docs CC v2.1.143 명시율 | =100% (4 docs) | docs-code-scanner | F1 + F4 |
| **K2** Plugin manifest 21-key whitelist 적용 | =100% (extra key Exit 2 fail) | `validate-plugin.js --strict` | F5 ENH-322 |
| **K3** `claude plugin validate` CI wire | =100% (Exit 0) | release-plugin-tag.sh CI run | F7 ADR 0006 |
| **K4** R3-321 신규 guard 등록 | =100% + reconcile PASS | cc-regression-reconcile.yml | F8 ENH-321 |
| **K5** SessionStart CC detection 발동 | =100% (env set + warning) | session-start.test.js | F10 ENH-323 |
| **K6** 정병진 install 성공 회신 | =1건 | dogfooder GH issue thread | F3 + F14 |
| **K7** ADR 0011 채택 | =100% (Accepted) | ADR 0011 frontmatter | F11 |
| **K8** Hall of Fame @bj entry 추가 | =100% | docs-code-scanner | F14 |
| **K9** matchRate (Design ↔ Code, gap-detector) | ≥90 (100 목표) | gap-detector | M1 |
| **K10** dataFlowIntegrity (7-Layer S1) | =100 | sprint-qa-flow agent | S1 |
| M2 code-quality | ≥80 | code-analyzer | Do |
| M3 criticalIssueCount | =0 | code-analyzer | Do + QA |
| M4 designCompleteness | ≥85 | gap-detector | Design |
| M5 testCoverage | ≥70 | jest/istanbul | Do |
| M7 docCoverage | ≥80 | docs-code-scanner | Do |
| M8 sectionCompleteness | ≥85 | gap-detector | PRD/Plan/Design |
| M9 regressionMatch | =0 | regression-rules-checker | QA |
| M10 reportCompleteness | ≥85 | gap-detector | Report |
| S2 featureCompletion | =100 | featureMap | Report |
| S3 sprintCycleTime | 12d budget 내 | timeline tracker | Report |
| S4 crossSprintIntegrity | =0 | docs-code-scanner | Report |

### 5.2 정성 메트릭

| 영역 | 목표 |
|-----|------|
| **사용자 신뢰 회복** | 정병진 (@bj) install 성공 회신 + Lifecycle Stage 4 (Regression Lock) 달성 |
| **외부 dogfooder 정책 확산** | @pruge first follower + @bj second entry → dogfooder #3+ 유입 가속 baseline |
| **회귀 방지 인프라 도입** | 같은 incident 0건 + CI gate 자동 차단 + reconcile cycle 통합 |
| **ADR 0003 + 0006 정책 강화** | ADR 0003 위반 사례 회고 + ADR 0006 § Empirical Validation Gate 미이행 회복 + ADR 0011 신규 채택 |
| **bkit 차별화 #2 강화** | Defense Layer 6 + R3-321 + 21-key whitelist + SessionStart detection 통합 |
| **bkit-starter 영향 0 유지** | bkit-starter plugin 변경 없음 (displayName 미포함, 영향 0 확정) |
| **Documentation 자기일관성** | README + README-FULL + cc-compatibility.guide.md + ADR 0011 + Hall of Fame entry 동기화 |

---

## 6. Out-of-scope (다른 sprint 또는 후속 release 이월 항목)

| 항목 | 이유 | 이월 대상 |
|------|------|---------|
| `displayName` 제거 | v2.1.143+ 공식 schema 정식 키, 제거 시 UI picker 회귀 (R3) — Anti-Mission 확정 | (영구 보류) |
| v2.1.142 이하 사용자 hard reject | informational advisory only — UX 진입장벽 minimize (R6) | (영구 보류) |
| Anthropic docs vs 구현 모순 (Q1) 자체 해결 | Anthropic 측 책임 영역, bkit이 해결 불가 | (영구 외부 의존) |
| bkit-starter plugin 변경 | displayName 미포함, 영향 0 확정 (별도 plugin) | (영구 보류) |
| Q2 정병진 CC 버전 추측 보강 | 사용자 회신 대기 — Out-of-scope 명시 후 재검토 | F3 회신 받은 후 |
| v2.1.143+ CC 호환성 전수 분석 | 별도 분석 사이클 (cc-version-researcher) | v2.1.21+ 분석 사이클 |
| Application Layer 3rd 도메인 (agent-dispatch/) | v2.1.14 Anti-Mission 명시 이관 | v2.1.21+ (또는 별도) |
| Trust L3/L4 default 변경 | sprint 본체와 무관 | (사용자 결정 시) |
| MCP server 추가 | sprint 본체와 무관 | v2.1.21+ |
| bkit-gemini fork 통합 (CARRY-6) | 별도 carryover, 본 sprint 본체와 무관 | CARRY-6 별도 sprint |
| 차별화 #7 (Workflow Durability Native) 추가 검토 | v2.1.19 ENH-318로 정식 편입 완료 | (이미 완료) |
| OTEL `gen_ai.cc_version_detection_ms` metric 데이터 분석 | F10 ENH-323 출시 후 3-month 데이터 누적 필요 | v2.1.21+ 분석 |
| R3-321 entry telemetry 3-month 분석 | F8 ENH-321 출시 후 3-month 데이터 누적 필요 | v2.1.21+ 분석 |
| dogfooder #3+ 유입 trend 분석 | F14 Hall of Fame @bj entry 추가 후 1-month feedback 필요 | v2.1.21+ 분석 |

---

## 7. Stakeholder Map

| Stakeholder | Role | Sprint 영향 | 응답 의무 |
|------------|------|-----------|---------|
| **kay (POPUP STUDIO)** | Decision maker + 메인테이너 | 전 phase (gate별 confirm) + Q1-Q5 결정 | sprint-master-planner 2nd-cycle dogfooding 검증 + 정병진 회신 |
| **정병진 (@bj)** | 외부 dogfooder #2 후보 (HOT) | Recovery Sub-sprint (F3) + Forward-proofing (F14) | CC `--version` 확인 + install 재시도 + Stage 2 repro confirm |
| **@pruge (James Kim)** | 외부 dogfooder #1 (first follower) | (observation) — policy first-follower 효과 입증 | 본 sprint 진행 관찰 + Lifecycle Stage 4 학습 |
| **bkit:cc-version-researcher agent** | Empirical validation 자동화 | Sub-sprint 1 Pre-mortem + Sub-sprint 2 R3-321 reconcile | ADR 0003 Phase 1.5 자동 적용 |
| **bkit:sprint-master-planner agent** | 본 sprint 2nd-cycle dogfooding | 본 master plan + PRD + Plan + Design + Report (dogfooding) | K6 dogfooding KPI 충족 |
| **CC 사용자 (v2.1.142 이하)** | 보호 안내 대상 | F1+F4 advisory (read-only) | (없음, advisory) |
| **Anthropic CC team** | docs vs 구현 모순 (Q1) 해결 책임 | (Out-of-scope, observation only) | (외부 책임) |
| **bkit-starter plugin 사용자** | displayName 미포함, 영향 0 확정 | (없음) | (없음) |
| **bkit community future contributors** | F5 `validate-plugin.js --strict` CI gate 대상 | PR 작성 시 자동 차단 (회귀 방지) | PR template 준수 |

---

## 8. Pre-mortem (실패 시나리오 + 사전 방지 — 10건)

### Scenario A: 정병진 CC 버전 미확정 (Q2) — fix 다른 root cause 가능성 25%

- **영향**: Sprint scope 부적합 → SC6 (정병진 install 성공 회신) 미충족 → Hall of Fame entry 추가 어려움
- **방지**: 
  - (a) F3 회신 메일에 `claude --version` 출력 요청 명시
  - (b) 회신 받기 전까지 P0 advisory만 출고 (F1+F4)
  - (c) Defense + Forward-proofing은 F8 R3-321 guard로 다중 root cause 커버
  - (d) Q2 미해결 명시 + sprint 완료 후 재검토 marker
  - (e) cc-version-researcher 88% 신뢰도 결론 baseline 유지

### Scenario B: docs vs 구현 lenient/strict 모순 (Q1) — Anthropic 정책 변경 시 sprint 산출 영향

- **영향**: 본 sprint의 21-key whitelist 정합 무력화 → ADR 0011 amend 필요
- **방지**:
  - (a) Anthropic 책임 영역 명시 — bkit이 해결 불가
  - (b) cc-regression reconcile cycle 매일 09:00 KST 자동 트래킹으로 변화 감지
  - (c) ADR 0011 Decision에 "현 시점 strict path 기준 + 변화 시 ADR amend" 명시
  - (d) Defense Layer 6 audit_logger record + alarm

### Scenario C: `displayName` 제거 시 v2.1.143+ UI picker 회귀

- **영향**: bkit UI 표시 실패 + Cursor/Aider/Continue.dev 비교 검토 표 출력 회귀 → 차별화 무력화
- **방지**:
  - (a) Anti-Mission § 1 명시 — `displayName` 제거 안 함
  - (b) PR template에 displayName 유지 체크박스 추가
  - (c) F12 CS-015 보강 — displayName 존재 강제
  - (d) F5 `validate-plugin.js --strict` displayName missing 시 fail

### Scenario D: SessionStart hook CC version detection 성능 overhead (50-150ms / session)

- **영향**: 매 세션 진입 시 ~100ms 지연 → 사용자 체감 속도 저하
- **방지**:
  - (a) child_process.execSync timeout 200ms 강제
  - (b) `BKIT_DISABLE_CC_VERSION_DETECTION=1` env opt-out
  - (c) 1회/세션 cap (cache `.bkit/runtime/cc-version.json` 1시간 TTL)
  - (d) OTEL `gen_ai.cc_version_detection_ms` metric emit
  - (e) ENH-323 telemetry 3-month 후 데이터 분석 후 격하/유지 결정

### Scenario E: `docs-code-invariants.js` 신규 SoT (`EXPECTED_PLUGIN_JSON_KEYS`) 다른 invariant와 충돌

- **영향**: 기존 EXPECTED_COUNTS / EXPECTED_*_NAMES와 충돌 → check-domain-purity CI gate fail
- **방지**:
  - (a) Object.freeze 적용 (immutability invariant 보존)
  - (b) 기존 EXPECTED_COUNTS / EXPECTED_*_NAMES 패턴 답습
  - (c) diff function (`diffPluginJsonKeys`) 별도 module
  - (d) check-domain-purity CI gate 유지 (pure domain, no FS)

### Scenario F: bkit min CC v2.1.143 명시가 v2.1.142 이하 사용자 진입장벽 → 사용자 ↓

- **영향**: 잠재 사용자 N명 진입 차단 → bkit 사용자 증가 둔화
- **방지**:
  - (a) advisory only (hard reject X)
  - (b) F4 cc-compatibility.guide.md에 v2.1.142 사용자 workaround 명시 (`npm install -g @anthropic-ai/claude-code@latest`)
  - (c) v2.1.143 release date 2026-05-XX (정확 일자 Q3 확인 필요) — 사용자 95% 이미 upgrade 추정
  - (d) 후속 sprint v2.1.21 사용자 trend 데이터 검토 (Q5 미해결)

### Scenario G: ENH-321 R3-321 guard가 cc-regression reconcile cycle 안정성에 영향

- **영향**: 매일 09:00 KST reconcile cycle fail → 회귀 0건 보장 무력화
- **방지**:
  - (a) 기존 21 entries 패턴 답습 (lightweight entry first, per-guard logic 후속)
  - (b) reconcile cycle PASS 검증 (F8 acceptance criteria)
  - (c) reconcile cycle 매일 09:00 KST run history archive
  - (d) 회귀 시 즉시 rollback (`cc-regression/registry.js` git revert)

### Scenario H: 외부 dogfooder 정책 abuse (가짜 dogfooder 등록 시도)

- **영향**: Hall of Fame 명단 신뢰성 ↓ + Trust Score externalDogfoodFeedbackResponseRate 왜곡
- **방지**:
  - (a) bkit Early Adopter Program 5-stage Lifecycle 강제 — Stage 1 (Issue Filed 검증) → Stage 2 (Repro absorbed 검증) 후에만 entry 추가
  - (b) 정병진 entry는 실제 GH issue + 회신 thread + install repro confirmed 후 추가
  - (c) Trust Score externalDogfoodFeedbackResponseRate (weight 0.05) 측정 — 24h 미응답 시 entry expire

### Scenario I: `validate-plugin.js --strict` mode 기존 PR fail false-positive (R9)

- **영향**: 신규 step 도입 직후 통과 PR 일제히 fail → PR backlog accumulate
- **방지**:
  - (a) 1주 advisory only deployment (Exit 0 + warning, continue-on-error: true)
  - (b) 2주차부터 strict (Exit 2, continue-on-error: false)
  - (c) F12 CS-015 사전 검증 — 모든 21-key 통과 확인
  - (d) bkit-starter plugin 검증 면제 (displayName 없음, 별도 plugin)
  - (e) PR template "Plugin manifest 21-key 준수" 체크박스 추가

### Scenario J: Sprint timeline 12-day 초과 — Phase Timeout auto-pause 발화

- **영향**: 12-day budget 초과 → 2-day buffer 소진 후 ITERATION_EXHAUSTED 또는 PHASE_TIMEOUT 발화
- **방지**:
  - (a) Sub-sprint 별 phase budget (4h/phase × 8 phases × 3 sub = 96h cap)
  - (b) 2-day buffer 활용 (D13-D14)
  - (c) Hot-path F3 분리 — 8-phase 우회 (Sub-sprint 1 PRD 의존성 명시 후 직접 출고)
  - (d) Sub-sprint별 token budget 명시 + budget 초과 시 patch resume
  - (e) L4 force-advance 옵션 (사용자 명시 시만)

---

## 9. PRD 완료 Checklist

- [x] Context Anchor 5건 모두 작성 (WHY / WHO / RISK / SUCCESS / SCOPE) — § 0
- [x] Problem Statement 부재 매트릭스 (As-is + To-be + Gap, 12건) — § 1
- [x] Job Stories 최소 5건 (8건 작성 — Job Story 1-8) — § 2
- [x] User Personas 1+ (5건 작성 — Persona 1-5) — § 3
- [x] Solution Overview 구조 + 데이터 흐름 (3-layer 대응 + 핵심 결정 7건) — § 4
- [x] Success Metrics 정량 (K1-K10 + M2-M10 + S2-S4 = 22 metrics) + 정성 (7건) — § 5
- [x] Out-of-scope 매트릭스 (12건 명시) — § 6
- [x] Stakeholder Map (9명 — kay + 정병진 + @pruge + 2 agents + 4 외부) — § 7
- [x] Pre-mortem 최소 5 시나리오 (10건 작성 — Scenario A-J) — § 8

### 9.1 Verified 사실 출처 (file:line 또는 docs URL)

- ✅ 정병진 incident 사실: external dogfooder GH issue 직접 회신 (2026-05-26)
- ✅ cc-version-researcher 88% 신뢰도 결론: `docs/03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md`
- ✅ `.claude-plugin/plugin.json` 9 keys: line 1-20 실측
- ✅ `.claude-plugin/marketplace.json` bkit entry 8 keys: line 11-62 실측
- ✅ `scripts/validate-plugin.js` line 264-272: name+version만 체크 (실측)
- ✅ `scripts/release-plugin-tag.sh` line 82-83: check-trust-score-reconcile + check-quality-gates만 (실측)
- ✅ `lib/cc-regression/registry.js` 21 entries + plugin manifest 관련 0건 (실측)
- ✅ `lib/domain/rules/docs-code-invariants.js` line 1-132: EXPECTED_COUNTS + EXPECTED_*_NAMES만 (실측)
- ✅ `test/integration/config-sync.test.js` CS-015 line 380-384: displayName 존재 명시적 요구 (실측)
- ✅ `.github/workflows/contract-check.yml` line 1-109: plugin schema validation 없음 (실측)
- ✅ `hooks/startup/session-context.js` 429 lines: CC version detection 없음 (실측)
- ✅ `docs/adr/0010-effort-aware-invariant.md` 존재: 다음 ADR 0011 가능 (실측)
- ✅ `docs/external-dogfooders/_README.md` line 57-60: @pruge first dogfooder, dogfooder #2 entry 신규 정책 (실측)
- ✅ bkit-starter plugin.json: `displayName` 미포함 → 영향 0 (사용자 명시 + marketplace.json 직접 확인)

### 9.2 미해결 의문점 (Q1-Q5) — 솔직히 명시

- ⚠️ **Q1** docs vs 구현 lenient/strict 모순 (Anthropic 책임 영역, bkit이 해결 불가)
- ⚠️ **Q2** 정병진 CC 버전 미확정 (회신 대기) → Out-of-scope 명시 + 회신 후 재검토
- ✅ **Q3** partially resolved (2026-05-26 CO-4 patch): Anthropic CHANGELOG dateless 영구 미공개 + Releasebot detection 2026-05-15 proxy. cc-compatibility.guide.md § 2.2 amend 완료.
- ⚠️ **Q4** marketplace.json `requirements.claudeCode` spec 존재 여부 → F2 Do 단계 진입 시 schema 직접 조회
- ⚠️ **Q5** v2.1.142 이하 사용자 비율 → 추정 95% upgrade + post-release feedback 모니터

---

**Next Phase**: Phase 2 Plan — Requirements R1-R14 + Feature Breakdown + Quality Gates + Risks + Document Index + Implementation Order + Acceptance Criteria + Cross-Sprint Dependency.
