---
template: pm-prd
version: 1.0
description: PM PRD 단계 문서 — bkit v2.1.25 claude-model-alignment 용 Context Anchor + 8-섹션 PRD
variables:
  - feature: claude-model-alignment
  - date: 2026-07-02
  - author: kay kim (bkit maintainer)
  - targetRelease: v2.1.24 → v2.1.25
---

# claude-model-alignment PRD

> **Feature**: `claude-model-alignment`
> **Phase**: PM / PRD (Plan 이전)
> **Date**: 2026-07-02
> **Author**: kay kim (bkit maintainer)
> **대상 릴리스**: v2.1.24 → v2.1.25
> **규모**: 내부 개발자 도구 릴리스(bkit 플러그인). PM 프레임워크는 의도적으로 축소 — 소비자 GTM 없음.
> **리서치 근거**: `.bkit/research/v2125-cc-model-web-research.md`(CC 공식 문서/CHANGELOG 확인), `.bkit/research/v2125-model-audit.md`(변경 표면 감사). 본 PRD는 종합(synthesis)만 수행하며, 리서치가 권위 원본이고 여기서 재도출하지 않는다.

---

## 0. Context Anchor (보존 — 모든 후속 phase 에 복사)

| Key | Value |
|-----|-------|
| **WHY** | Claude 5 패밀리 출시됨. Anthropic API 기준 `opus` 는 이제 Opus 4.8 로 부동(CC v2.1.154+), `sonnet` 은 Sonnet 5 로 부동(CC v2.1.197+)하며, 신규 `fable` alias(Fable 5, CC v2.1.170+)가 추론/검증/장기 오케스트레이션에 권장되는 모델이다. bkit 은 40개 에이전트를 `opus`(17)/`sonnet`(21)/`haiku`(2)로 고정하고 있으나 문서상 CC 하한이 **v2.1.143 — Fable 하한(v2.1.170)과 Sonnet-5 하한(v2.1.197) 모두보다 낮다.** bkit 은 검증 품질(Fable)·저렴한 구현(Sonnet 5)·저렴한 모니터(Haiku)를 놓치고 있고, whitelist/pricing/contract baseline 은 `fable` 개념이 없으며, 문서는 이미 모델 명단을 잘못 기재(기존 drift 버그 3건)하고 있다. |
| **WHO** | bkit 설치 사용자. **CC 버전**(`<2.1.170` / `2.1.170–2.1.196` / `≥2.1.197`)과 **모델 provider**(Anthropic API vs AWS Platform vs Bedrock/Vertex/Foundry — alias 가 provider 별로 *다른* 버전으로 해석됨)로 세분. Fable 안전 분류기가 turn 을 거부할 수 있는 **headless/CI 사용자**(`claude -p`) 포함. Stakeholder/의사결정자: kay kim(bkit maintainer). |
| **RISK** | (a) 2.1.170 미만에서 미지의 `model: fable` alias 동작은 **미검증** → 하위호환 파손 리스크. (b) Issue #44385(frontmatter `model:` 무시) 수정 상태 불명 → 재할당이 조용히 무효화될 수 있음. (c) `CLAUDE_CODE_SUBAGENT_MODEL` env override 가 모든 frontmatter 고정을 조용히 덮어씀. (d) Enterprise `availableModels` allowlist 가 제외 모델을 조용히 다운그레이드. (e) Fable 안전 분류기가 보안 인접 콘텐츠에서 rerouting/거부 → Fable 상의 `security-architect` 저하. (f) Contract L1-AG + VALID_MODELS + runtime whitelist 를 lockstep 으로 갱신하지 않으면 실패/조용한 강등 → GitHub Actions CI red. |
| **SUCCESS** | 최신 CC(Anthropic API)에서: 40개 에이전트 전부 **의도한** 모델로 해석; **CI 실패 0**(baseline 재생성 후 contract L1-AG + 보안 테스트 green); 선언된 하한 CC 버전에서 **동작 파손 0**(그 아래에서는 graceful degradation); **docs = code, drift 0** — 기존 stale-doc 버그 3건 포함, 본 릴리스에서 수정; **조용한 오과금 0**(Fable/Sonnet-5/Opus-4.8 정확히 과금, `unknown` 아님) 및 **조용한 강등 0**(runtime whitelist 가 `fable` 존중). |
| **SCOPE** | **In**: CC 하한 정책 결정; 40개 에이전트 role 기반 모델 재할당; VALID_MODELS + runtime whitelist 에 `fable` 추가; token-report pricing + `_modelClass` fable 분기; contract baseline 재생성(v2.1.9 + v2.1.16); 대상 보안 assertion 갱신; 기존 doc-drift 버그 3건 수정; normative 허용값 + role-legend 문서 갱신; Sonnet-5 vs KNOWN_REGRESSION_MODELS 결정; 릴리스 노트/사용자 공지. **Out**: 에이전트 오케스트레이션 모델 재작성; per-invocation 동적 모델 라우팅; 신규 모델 선택 config key; PDCA/Sprint phase enum 변경; provider 자동 감지 로직; 프로젝트 버전 번호 bump(maintainer 권한). |

---

## 1. Executive Summary

| 관점 | 요약 |
|------|------|
| **문제** | bkit 40개 에이전트는 `opus`/`sonnet`/`haiku` alias 에 고정되어 있고 CC 하한(v2.1.143)이 Fable(v2.1.170)·Sonnet-5(v2.1.197) 하한보다 낮다. Claude 5 패밀리 미사용, whitelist/pricing/contract baseline 이 `fable` 을 표현 불가, 모델 명단이 이미 3곳에서 잘못 문서화됨. |
| **해결책** | 2-part 릴리스: (1) CC 호환 하한을 결정·선언하고 구형 CC 는 graceful degradation 입장 채택; (2) role 기반 모델 정렬 실행 — 리드/검증자 → `fable`(불가 시 `opus`), 구현자 → `sonnet`(Sonnet 5), 모니터/PM/리포터 → `haiku`, `security-architect` 는 Fable 제외 — 그리고 모든 종속 표면(whitelist, runtime coercion, pricing, contract baseline, 보안 assertion, docs)을 lockstep 으로 갱신하며 stale-doc 버그 3건도 함께 수정. |
| **기능/UX 효과** | 최신 CC 사용자는 측정 가능하게 더 나은 검증(gap-detector/design-validator 의 Fable honesty edge), 더 저렴한 구현(Sonnet 5 도입가 $2/$10), 더 저렴한 모니터링(Haiku)을 얻고, token-report 비용이 정확히 표시됨. 구형 CC 사용자는 graceful fallback 으로 계속 동작하며 명시적 하한 공지로 안내받음. |
| **핵심 가치** | 효과가 복리로 쌓이는 곳(기획+검증)에 더 높은 산출 품질, 추론이 불필요한 곳(구현+모니터링)에 더 낮은 지출, 설치 기반에 회귀 0 — docs=code, CI-green 릴리스로 전달. |

---

## 2. Problem / Opportunity

### 2.1 현 상태 vs 기대 상태

| 영역 | 현 상태 (v2.1.24) | 기대 상태 (v2.1.25) |
|------|------------------|---------------------|
| CC 하한 | README 하한 v2.1.143; 권장 ~v2.1.150 — Fable(v2.1.170)·Sonnet-5(v2.1.197) 하한 미만 | 명시적·문서화된 하한 정책 + 그 아래 graceful-degradation 입장 |
| 에이전트 모델 명단 | 40개 opus(17)/sonnet(21)/haiku(2) 고정; `fable` 부재 | 리드/검증자에 `fable` 포함 role 기반 할당; `security-architect` 는 Fable 명시적 제외 |
| VALID_MODELS whitelist | `['opus','sonnet','haiku']` — `fable` frontmatter 는 SEC-AF-051 실패 | `fable` 추가; 40개 전부 whitelist ∈ |
| Runtime whitelist | `scripts/subagent-start-handler.js:69` 가 `opus/sonnet/haiku` 외 → `'sonnet'` 강제 — team state 에서 Fable **조용히 강등** | `fable` 존중; 조용한 coercion 없음 |
| Pricing | `token-report.js` 가 sonnet/opus/haiku 과금; Fable → `unknown` → 오과금 | Fable 과금($10/$50); Sonnet-5/Opus-4.8 수치 갱신; Claude 5 는 `unknown` fallback 없음 |
| Contract baseline | v2.1.9(37) + v2.1.16(40) 이 각 에이전트 `model` 동결; 변경 시 L1-AG 실패 | 재할당 에이전트 lockstep 재생성; L1-AG green |
| 문서 정확도 | 기존 drift 버그 3건: 36/13-opus 카운트(실제 40/17); pm-lead 문서상 `sonnet` 이나 frontmatter 는 `opus`; PM-T10 "5개 PM 에이전트 모두 sonnet" | docs = code, drift 0; 3건 모두 수정 |

### 2.2 기회 프레이밍

- **검증 품질이 가장 레버리지 높은 승리.** Fable 의 honesty/self-verification edge 는 bkit 의 Defense-Layer-6 에이전트(gap-detector, design-validator, code-analyzer, sprint-qa-flow)에 직접 매핑된다. 더 강한 모델의 fresh-context 검증자는 self-critique 가 놓치는 것을 잡는다.
- **비용 비대칭은 실재한다.** Fable($10/$50)은 대량 구현자로는 너무 비싸고, Sonnet 5(도입가 $2/$10)는 약 1/5 비용의 코딩 sweet spot 이다. 모니터/리포터/PM 분석가는 저추론·고빈도 작업 → Anthropic 자체 가이드에 따라 Haiku.
- **하한이 관문이다.** 하한을 ≥ v2.1.170(이상적으로 ≥ v2.1.197 이면 `sonnet` 이 Sonnet 5 로 부동)으로 올리기 전까지는 어떤 upside 도 기본 frontmatter 로 출시 불가. 이것이 나머지 전부가 걸린 유일한 결정이다.

---

## 3. Users & Segments

alias 해석과 실패 동작을 실제로 바꾸는 두 축으로 세분.

### 3.1 CC 버전별

| 세그먼트 | 신규 frontmatter 에서의 동작 | 우선순위 |
|---------|------------------------------|---------|
| **S1 — CC < 2.1.170** | Fable 선택 불가; `model: fable` 동작 **미검증**(warn+fallback 일 수도, error 일 수도). 하위호환 리스크 최고. | 보호(do-no-harm) |
| **S2 — CC 2.1.170–2.1.196** | Fable 사용 가능; `sonnet` 은 여전히 pre-5 Sonnet 부동(Sonnet 5 는 2.1.197 필요). `opus`→Opus 4.8 는 2.1.154 부터. | 부분 이득 |
| **S3 — CC ≥ 2.1.197** | 완전 이득: `sonnet`→Sonnet 5, `opus`→Opus 4.8, `fable`→Fable 5, native 1M. 대상 happy path. | 최적화 대상 |

### 3.2 Provider 별 (alias 해석 상이)

| Provider | `opus` → | `sonnet` → | `fable` → |
|----------|----------|------------|-----------|
| Anthropic API | Opus 4.8 | Sonnet 5 | Fable 5 (안전 분류기가 Opus 4.8 로 fallback 가능) |
| Claude Platform on AWS | Opus 4.7 | Sonnet 4.6 | Fable 5 (flag 시 Opus 로 fallback) |
| Bedrock / Vertex / Foundry | Opus 4.6 | Sonnet 4.5 | provider 별 full ID 필요 |

시사점: alias 기반 할당은 provider 별 *가용 최상* 모델을 자동으로 주지만 *실제* 버전은 다르다. 문서가 "Sonnet 5" 를 보편적으로 약속해서는 안 된다.

### 3.3 실행 모드별

- **Interactive** — Fable 안전 분류기는 콘텐츠 flag 시 조용히 Opus 4.8 로 reroute.
- **Headless / CI (`claude -p`, SDK)** — flag 된 Fable turn 은 reroute 대신 **거부로 종료**될 수 있음. 첫 요청에서 CLAUDE.md / git status / 보안 콘텐츠를 만지는 Fable 고정 에이전트는 CI 에서 거부 위험. 이것이 `security-architect`(및 그럴듯하게는 다른 보안 인접 흐름)를 Fable 에서 제외하는 결정적 근거다.

---

## 4. Value Proposition

**For** 최신 Claude Code 상의 bkit 사용자
**who** multi-agent PDCA/Sprint 워크플로를 돌리며 토큰당 과금하는,
**the** claude-model-alignment 릴리스 **는** 모델-role 재정렬로서
**that** 기획·검증을 Fable 5 의 더 강한 추론/honesty 로, 구현을 Sonnet 5 의 더 저렴한 코딩으로, 모니터링을 Haiku 로 라우팅하고,
**unlike** Claude 5 를 쓰지도 과금하지도 못하는 현재의 획일적 opus/sonnet 고정 방식과 달리,
**our** 릴리스는 검증 품질을 개선하고 구현/모니터링 지출을 줄이면서 **구형 CC 사용자에게는 명시적 하한 + graceful degradation 으로 회귀 0 을 보장**한다.

| VP 구성요소 | bkit 특화 내용 |
|-------------|----------------|
| Gain creators | 더 나은 gap/design 검증(Fable); 약 5× 저렴한 구현(Sonnet 5 도입가); 저렴한 고빈도 모니터(Haiku); 정확한 token-report 비용 |
| Pain relievers | 조용한 오과금 없음; 조용한 모델 강등 없음; CI 파손 없음; Fable-as-implementer 로 인한 갑작스런 비용 급증 없음; 명확한 하한 공지 |
| Products/services | role 기반 frontmatter, 갱신된 whitelist + runtime coercion, 갱신된 pricing 표, 재생성된 contract baseline, 수정된 docs |

---

## 5. Requirements

> FR = 기능(릴리스가 반드시 전달해야 할 것). NFR = 비기능(품질 기준). FR-1/FR-2/FR-10/FR-12 내부의 최종 *선택*은 §6 에서 프레이밍되어 Design 에서 확정; FR 은 릴리스가 그것을 해결하도록 요구한다.

### 5.1 Functional Requirements

| ID | 요구사항 | 주요 표면 (감사 기준) |
|----|----------|----------------------|
| **FR-1** | v2.1.25 의 CC 호환 하한을 수립·문서화하고, 하한 상향 vs 조건부/graceful 접근을 해결(§6-a 참조). | README.md, README-FULL.md, `lib/infra/cc-version-checker.js`, RECOMMENDED_VERSION |
| **FR-2** | 40개 에이전트의 `model:` frontmatter 를 role 클래스별 재할당: 리드/오케스트레이터 → `fable`(불가 시 `opus`); 구현자 → `sonnet`; 검증자/리뷰어 → `fable`(예산) 아니면 `opus`/`sonnet`; 모니터/리포터/PM 분석가 → `haiku`; **`security-architect` 는 `fable` 제외**(§6-b 참조). | `agents/*.md`(source of truth) |
| **FR-3** | 중앙 테스트 whitelist `VALID_MODELS` 에 `fable` 추가. | `test/security/agent-frontmatter.test.js:470` |
| **FR-4** | runtime whitelist 에 `fable` 추가하여 team state 에서 `sonnet` 으로 조용히 강등되지 않게 함. | `scripts/subagent-start-handler.js:69` |
| **FR-5** | `PRICING_PER_MTOK` 에 Fable 과금($10/$50), `_modelClass` 에 `fable` 분기 추가; Sonnet/Opus 과금을 Claude-5 패밀리 수치로 갱신. | `lib/pdca/token-report.js:32-36,53-57` |
| **FR-6** | 재할당된 모든 에이전트에 대해 **두** baseline 디렉터리에서 contract baseline 을 lockstep 재생성하여 L1-AG 통과. | `test/contract/baseline/v2.1.9/agents/*.json`, `.../v2.1.16/agents/*.json`, `contract-baseline-collect.js` |
| **FR-7** | 재할당과 일관되게 대상 보안 assertion 갱신. | SEC-AF-030(cto-lead), SEC-AF-013(starter-guide), SEC-AF-038 / SEC-AF-052(opus-tier 목록) |
| **FR-8** | 기존 doc-drift 버그 3건 수정: (i) 에이전트 카운트 36→40 및 opus 13→17; (ii) pm-lead 문서상 `sonnet` 이나 frontmatter 는 `opus`; (iii) PM-T10 "5개 PM 에이전트 모두 sonnet" 오류(pm-lead 은 opus). | `commands/bkit.md:145,153-183`; `bkit-system/*` 표; `test-checklist.md:399` |
| **FR-9** | normative 허용값 문서와 role-legend 표에 `fable` 포함하도록 갱신. | `CUSTOMIZATION-GUIDE.md:921,956`; `bkit-system/components/agents/_agents-overview.md:55-57` |
| **FR-10** | Sonnet 5 에 대한 KNOWN_REGRESSION_MODELS 처리 해결 — sonnet-4.x token-threshold guard 를 Sonnet 5 로 확장할지, 아니면 명시적으로 제외할지 결정(§6-d 참조). | `lib/domain/guards/enh-264-token-threshold.js:20` + 종속 테스트 |
| **FR-11** | eval benchmark 모델과 예시 모델 ID 를 현행 패밀리로 갱신. | `evals/config.json:5`; `README-FULL.md:754,757` |
| **FR-12** | deprecated `pdca-eval-*` stub 모델(6개) 결정·적용 — 후보: 비용을 위해 `haiku` 로 이동(§6-c 참조). | `agents/pdca-eval-*.md` + baseline |
| **FR-13** | skills/hooks 전반의 prose 모델 참조를 신규 할당 및 Claude 5 명칭에 맞게 갱신. | `skills/pdca/SKILL.md:342,383-384`; `skills/pm-discovery/SKILL.md:46`; `skills/cc-version-analysis/SKILL.md:347-350`; `hooks/startup/session-context.js:271,289` |
| **FR-14** | 하한 변경, provider 별 alias 해석, 두 footgun(`CLAUDE_CODE_SUBAGENT_MODEL`, enterprise `availableModels`)을 다루는 릴리스 노트/사용자 공지 발행. | CHANGELOG.md, README 공지 블록 |

### 5.2 Non-Functional Requirements

| ID | 요구사항 | 검증 |
|----|----------|------|
| **NFR-1** | CI 실패 0 — baseline 재생성 후 최신 CC 에서 contract L1-AG + 전 보안 테스트 green. | GitHub Actions green |
| **NFR-2** | docs = code, drift 0 — 모델 카운트 표·per-agent 컬럼·role legend 모두 frontmatter 와 일치, 수정된 버그 3건 포함. | 수동 + grep 감사 vs `agents/*.md` |
| **NFR-3** | 하위호환 — 선언된 하한 CC 버전에서 동작 파손 0; 그 아래에서는 graceful 강등(warn/fallback, hard error 없음). | 하한 CC 스모크 테스트 + fallback 경로 |
| **NFR-4** | 조용한 오과금 없음 — Fable/Sonnet-5/Opus-4.8 정확히 과금; Claude-5 ID 가 `unknown` 으로 빠지지 않음. | `token-report.test.js` fable 케이스 |
| **NFR-5** | 조용한 강등 없음 — runtime whitelist 가 `fable` 존중; `CLAUDE_CODE_SUBAGENT_MODEL` override footgun 문서화. | runtime coercion unit + 공지 존재 |
| **NFR-6** | Provider 인지 문서 — alias 해석 차이(AWS/Bedrock/Vertex)와 enterprise `availableModels` 조용한 강등 문서화; 보편적 "Sonnet 5" 약속 없음. | 문서 리뷰 |
| **NFR-7** | 보안 태세 유지 — `security-architect` 는 Fable 제외; 임의 Fable 에이전트의 headless/CI 거부 위험 문서화. | assertion + 공지 |
| **NFR-8** | 추적성 — frontmatter `model:` 이 하한 CC 에서 실제 존중되는지 스모크 테스트로 확인(#44385 회귀 방지). | 신규 스모크 테스트 |

---

## 6. Key Decisions to be made in Design

> PRD 는 의도적으로 최종 선택을 Design 에 남긴다; 각 결정은 프레이밍된 옵션 + 결정 긴장점을 나열.

**(a) 하한 정책 — 상향 vs 조건부/graceful.**
- Option A1: 하한을 **≥ v2.1.170** 으로(Fable 사용 가능; 2.1.170–196 에서 `sonnet` 은 여전히 pre-5).
- Option A2: 하한을 **≥ v2.1.197** 로(완전 Claude 5: Sonnet 5 default + native 1M) — 가장 깔끔·엄격.
- Option A3: 낮은 하한 유지 + **조건부/graceful** frontmatter(default 에 `fable` 없이 alias 부동 + 공지에 의존).
- 결정 긴장점: upside(`fable` 을 default 로 출시) vs S1 설치 기반 파손(2.1.170 미만 미지 alias 동작 미검증). 텔레메트리가 뒷받침하면 A2, 아니면 A1 + 공지 권장.

**(b) 어느 role 클래스를 Fable 로.**
- 보수적: 검증자만(gap-detector, design-validator, code-analyzer, sprint-qa-flow).
- 균형: 검증자 + 리드/오케스트레이터(cto-lead, pm-lead, qa-lead, sprint-orchestrator, sprint-master-planner).
- 결정 긴장점: Fable-lead + Sonnet-workers 는 검증된 비용 패턴이나, high-fan-out 리드에서 $10/$50 Fable 은 빠르게 복리로 증가. `security-architect` 는 모든 옵션에서 제외.

**(c) deprecated `pdca-eval-*` stub → Haiku?**
- 이 6개 stub 은 contract deprecation governance(L4) 충족 목적으로만 존재. `sonnet`→`haiku` 이동은 리스크 거의 0 으로 비용 절감하나 6개 baseline 을 건드림. baseline-churn 이 한계 절감 대비 가치 있는지 결정.

**(d) Sonnet 5 vs KNOWN_REGRESSION_MODELS guard.**
- `enh-264-token-threshold.js` 는 `claude-sonnet-4-6` / `claude-sonnet-4-5` 를 guard. 결정: 회귀가 Sonnet 5 에도 적용되는가(ID 추가), 아니면 Sonnet 5 는 명시적으로 clean 한가(guard 유지, 비적용 문서화)? 잘못하면 Sonnet 5 를 과도 throttle 하거나 실제 회귀를 놓친다.

---

## 7. Risks & Mitigations

| # | 리스크 | 심각도 | 완화 |
|---|--------|--------|------|
| R1 | 2.1.170 미만 미지 `model: fable` 동작 미검증 → S1 사용자 파손 | High | `fable` default 를 하한 결정(§6-a) 뒤에 gate; A3 라면 default frontmatter 에서 `fable` 제외; 하한 CC 스모크 테스트 |
| R2 | #44385(frontmatter `model:` 무시) 완전 미수정 → 재할당 무효 | Med | NFR-8 하한 CC 스모크 테스트; 미존중 시 문서화 + 재할당 보류 |
| R3 | `CLAUDE_CODE_SUBAGENT_MODEL` env override 가 모든 고정 조용히 덮어씀 | Med | FR-14 공지; session hook 에 preflight 경고 검토 |
| R4 | Enterprise `availableModels` allowlist 가 Fable→inherited 조용히 강등 | Med | FR-14 공지(문서화, bkit 에서 수정 불가); alias fallback 은 설계상 graceful |
| R5 | Fable 안전 분류기가 보안 콘텐츠에서 reroute/거부 → security-architect 저하, CI 거부 | High | `security-architect` 를 Fable 제외(FR-2/NFR-7); headless 거부 위험 문서화 |
| R6 | Contract L1-AG / VALID_MODELS / runtime whitelist 를 lockstep 미갱신 → CI red 또는 조용한 coerce | High | FR-3/4/6 을 단일 atomic changeset 으로; baseline 재생성 동일 PR 내 |
| R7 | token-report 가 Fable 을 `unknown` 과금 → 잘못된 비용 리포트 | Med | FR-5 + NFR-4 fable 과금 + 테스트 |
| R8 | Provider 편차 오문서화("어디서나 Sonnet 5") | Low | NFR-6 provider 인지 문서 |

---

## 8. Success Criteria & GTM / 릴리스 노트 계획

### 8.1 측정 가능한 성공 기준

| SC | 기준 | 측정 |
|----|------|------|
| SC-1 | 최신 CC(Anthropic API)에서 40개 에이전트 전부 의도 모델로 해석 | role 클래스별 `/model` + spawn 확인 |
| SC-2 | CI 실패 0 | GitHub Actions 에서 contract L1-AG + 보안 suite green |
| SC-3 | 선언된 하한 CC 버전에서 동작 파손 0 | 하한 CC 스모크 테스트 통과; 그 아래 graceful fallback 검증 |
| SC-4 | docs = code, drift 0, 기존 버그 3건 모두 수정 포함 | grep 감사: 카운트 40/17-opus, 어디서나 pm-lead=opus, PM-T10 수정 |
| SC-5 | 조용한 오과금 없음 | `token-report.test.js` fable 케이스 통과; Claude-5 ID → `unknown` 없음 |
| SC-6 | 조용한 강등 없음 | runtime whitelist unit 이 `fable` 통과; 공지 발행 |

### 8.2 GTM / 릴리스 노트 계획 (내부 개발자 도구 범위)

- **채널**: CHANGELOG.md 항목 + README 공지 블록 + PR 설명. 외부 마케팅 없음.
- **공지 내용**: 신규 CC 하한 + 이유; provider 별 alias 해석 표; 두 footgun(`CLAUDE_CODE_SUBAGENT_MODEL`, enterprise `availableModels`); Fable headless-거부 주의.
- **롤아웃**: 단일 atomic PR(frontmatter + whitelist + runtime + pricing + baseline + docs) 로 CI 가 부분 상태를 절대 보지 않게 함; 버전 번호는 repo 규칙에 따라 maintainer 결정.
- **릴리스 후 관찰**: 이슈 트래커에서 S1(2.1.170 미만) 파손 리포트 및 Fable CI-거부 리포트 모니터; cc-version-analysis 롤링 상태가 drift 종결 추적.

---

## Attribution

PM 프레임워크 스캐폴딩(Context Anchor, JTBD 스타일 VP, 세분화)은 Pawel Huryn 의 [pm-skills](https://github.com/phuryn/pm-skills)(MIT License) 패턴을 통합하되 내부 개발자 도구 릴리스에 맞게 축소했다. 모든 모델 사실은 헤더에 인용된 두 리서치 파일에서 출처하며, 본 PRD 에서 재도출하지 않는다.

**다음 단계**: `/pdca plan claude-model-alignment` (본 PRD 는 Plan phase 에서 자동 참조됨).
