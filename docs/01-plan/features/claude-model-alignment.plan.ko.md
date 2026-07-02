# claude-model-alignment 기획 문서

> **요약**: bkit의 모든 Claude 모델 지정(에이전트 40개, 화이트리스트, 가격, 계약 베이스라인, 문서)을 Claude 5 모델 패밀리 — Fable 5, Sonnet 5, Opus 4.8, Haiku 4.5 — 에 맞춰 정렬하되, 구버전 Claude Code 사용자를 파손시키지 않는다.
>
> **프로젝트**: bkit Vibecoding Kit (bkit-claude-code)
> **버전**: 2.1.25 (잠정 — 최종 버전은 릴리스 시 메인테이너가 확정)
> **작성자**: PDCA 파이프라인 (pm-lead PRD → plan)
> **날짜**: 2026-07-02
> **상태**: Draft

---

## Executive Summary

| 관점 | 내용 |
|-------------|---------|
| **문제** | bkit의 에이전트 40개가 `opus`(17)/`sonnet`(21)/`haiku`(2) 별칭에 고정되어 있고, CC 플로어(v2.1.143)가 Fable 플로어(v2.1.170)와 Sonnet 5 별칭 플로어(v2.1.197)보다 낮다. 검증/오케스트레이션에 Claude 5 패밀리가 미활용 상태이고, 모델 화이트리스트/가격/계약 베이스라인이 `fable`을 표현할 수 없으며, 에이전트-모델 로스터가 3곳에서 잘못 문서화되어 있다. |
| **해법** | 품질 우선의 역할 기반 모델 정렬: 리드/오케스트레이터·검증자 → `fable`, 구현자 → `sonnet`(Sonnet 5로 float), 모니터/리포터/폐기 스텁 → `haiku`, `security-architect`는 `opus` 유지(Fable 안전 분류기가 보안 작업을 리라우트). 모든 의존 표면을 lockstep 갱신: VALID_MODELS 화이트리스트, 런타임 강제 화이트리스트, 가격 테이블, 계약 베이스라인(v2.1.9 + v2.1.16), 보안 단언, 버전 플로어 상수, 모든 규범적 문서 — 기존 문서 drift 버그 3건도 함께 수정. |
| **기능/UX 효과** | bkit의 차별화가 있는 곳(갭 분석, 설계 검증, 오케스트레이션)의 검증 품질이 Fable의 추론/정직성 우위로 상승; 구현은 Sonnet 5로 더 저렴하고 강력해짐; 모니터링은 Haiku로 저비용 유지; token-report가 정확한 비용 표시; 구버전 CC 사용자는 조용한 파손 대신 명시적 어드바이저리를 받음. |
| **핵심 가치** | 복리 효과가 있는 곳(기획 + 검증)의 출력 품질 상승, 심층 추론이 불필요한 곳의 지출 절감, 설치 기반 무회귀 — docs=code, CI-green 릴리스로 제공. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | bkit의 모델 지정이 Claude 5 패밀리 이전 시대의 것; 검증/오케스트레이션 에이전트가 가용 최고 성능 아래에서 구동되고, `fable`은 bkit의 화이트리스트/가격/베이스라인으로 표현조차 불가. |
| **WHO** | CC 버전(<2.1.170 / 2.1.170–196 / ≥2.1.197)과 프로바이더(Anthropic API vs AWS/Bedrock/Vertex — 별칭 해석이 다름)로 세분화된 bkit 설치자; Fable 안전 분류기 거부가 문제되는 headless/CI 사용자(`claude -p`). |
| **RISK** | CC < 2.1.170에서 `model: fable`은 에이전트 스폰 하드 에러(실측 재현 R2) — 플로어 정책으로 설치 기반 파손을 막아야 함; 베이스라인을 lockstep 재생성하지 않으면 contract L1-AG 실패. |
| **SUCCESS** | CC ≥ 플로어에서 에이전트 40개 전부 의도한 모델로 해석(probe 검증); 전체 CI 스위트 green; 레거시 버그 3건 포함 docs=code drift 0; 플로어 미만에서 graceful 어드바이저리. |
| **SCOPE** | agents/ frontmatter ×40 · test/security 화이트리스트+단언 · test/contract 베이스라인 ×2 디렉터리 · scripts/subagent-start-handler.js · lib/pdca/token-report.js · lib/domain/guards/enh-264 · evals/config.json · 버전 플로어 상수 · docs/skills/bkit-system 프로즈 · 릴리스 어드바이저리. |

---

## 1. 개요

### 1.1 목적

bkit의 모델 정책을 Claude 5 모델 패밀리(Fable 5는 CC v2.1.170, Sonnet 5 기본화는 v2.1.197, Opus 4.8은 v2.1.154, Haiku 4.5)에 맞춰 재정렬하여, 40개 에이전트 각각이 역할에 최적인 모델 클래스에서 최적 비용으로 구동되도록 하되 하위 호환성을 파손하지 않는다.

### 1.2 배경

- **웹 리서치 (CONFIRMED, 공식 문서/CHANGELOG)**: 에이전트 frontmatter `model:`은 `sonnet|opus|haiku|fable|<전체-ID>|inherit` 허용; 별칭은 float (Anthropic API: `opus`→Opus 4.8, `sonnet`→Sonnet 5, `haiku`→Haiku 4.5); Fable 5 = 추론/검증/장기 오케스트레이션 ($10/$50 MTok); Sonnet 5 = 최강 코딩, 인트로 $2/$10; Opus 4.8 = $5/$25, 사이버보안 최강; Fable 안전 분류기는 보안 인접 작업을 리라우트/거부 (security-architect와 headless QA에 결정적).
- **실측 재현** (`.bkit/research/v2125-reproduction-log.md`): R1 — CC v2.1.198은 frontmatter `model: fable`을 존중 → `claude-fable-5` (회귀 #44385 부재). R2 — CC v2.1.150은 `model: fable` 에이전트 스폰에서 하드 에러 (graceful fallback 아님).
- **코드베이스 감사** (`.bkit/research/v2125-model-audit.md`): 차단성 CI 게이트(SEC-AF-051 VALID_MODELS, contract L1-AG 베이스라인 동등성)와 무음 위험(런타임 화이트리스트가 미지 값을 `sonnet`으로 강제; 가격 테이블이 미지 ID를 `unknown`으로 분류)을 포함한 완전한 변경 표면.
- **사용자 결정 (Plan 체크포인트, 2026-07-02)**: FR-1..14 전체 스코프; 품질 우선 — 리드 + 검증자에 `fable` 채택; 폐기된 `pdca-eval-*` 스텁 → `haiku`; **그리고 Opus의 강점이 적용되는 곳은 Opus 유지** — 사이버보안, 거부-민감 headless 경로, Fable의 2배 비용이 정당화되지 않는 심층 추론 역할에는 Opus 4.8이 여전히 올바른 모델. Design 매트릭스는 일괄 fable 업그레이드가 아니라 에이전트별로 계층(4-계층: fable/opus/sonnet/haiku)을 개별 논증해야 함.

### 1.3 관련 문서

- PRD: `docs/00-pm/claude-model-alignment.prd.en.md` / `.ko.md`
- 리서치: `.bkit/research/v2125-cc-model-web-research.md`, `.bkit/research/v2125-model-audit.md`, `.bkit/research/v2125-reproduction-log.md`
- 베이스라인 SOP: `docs/06-guide/contract-baseline-rollforward.guide.md`

---

## 2. 범위

### 2.1 포함 (In Scope)

- [ ] Design §모델 매트릭스에 따른 `agents/*.md`(40개) 역할 기반 `model:` 재배정
- [ ] `VALID_MODELS`에 `fable` 추가 (`test/security/agent-frontmatter.test.js:470`) + 개별 단언 갱신 (SEC-AF-013/030/038/052)
- [ ] 런타임 화이트리스트에 `fable` 추가 (`scripts/subagent-start-handler.js:69`) — `sonnet`으로의 무음 강제 제거
- [ ] `lib/pdca/token-report.js`에 Fable 가격 + 모델 클래스 분기 (+ Claude 5 가격 정확성 갱신) + 단위 테스트
- [ ] `test/contract/baseline/v2.1.9/`와 `v2.1.16/` 양쪽 계약 베이스라인 재생성 (L1-AG lockstep)
- [ ] `KNOWN_REGRESSION_MODELS` 결정 적용 (`lib/domain/guards/enh-264-token-threshold.js`) — Sonnet 5 처리
- [ ] `evals/config.json` benchmarkModel + README-FULL 예시 모델 ID 갱신
- [ ] CC 버전 플로어 정책 적용 (Design 결정): `cc-version-checker.js` MIN/RECOMMENDED, `session-context.js` CC_MIN_VERSION + 낡은 프로즈(443행), README 배지/요구/권장, marketplace.json 설명
- [ ] 기존 문서 drift 버그 3건 수정: (i) "36 total / 13 opus" 낡은 카운트, (ii) pm-lead가 `sonnet`으로 문서화(실제 `opus`), (iii) test-checklist PM-T10 "PM 에이전트 5개 모두 sonnet"
- [ ] 모든 규범적 모델 프로즈 동기화: commands/bkit.md, bkit-system 테이블, skills(pdca, pm-discovery, cc-version-analysis, pdca-watch), hooks/startup/session-context.js, CUSTOMIZATION-GUIDE 허용값, README-FULL 다이어그램
- [ ] 릴리스 어드바이저리 콘텐츠: 플로어 변경, 프로바이더 별칭 차이, `CLAUDE_CODE_SUBAGENT_MODEL` + 엔터프라이즈 `availableModels` footgun, Fable headless 거부 주의
- [ ] frontmatter 반영 스모크 증거 보존 (R1/R2 재현 로그) + QA에서 `claude -p` 재검증

### 2.2 제외 (Out of Scope)

- `.claude-plugin/plugin.json` `version` 변경 (메인테이너 전용 릴리스 결정; CHANGELOG의 v2.1.25 헤딩은 잠정 라벨)
- bkit 메인 세션 기본 모델 변경 (CC가 결정; bkit은 서브에이전트만 고정)
- 프로바이더별 별칭 자동 고정 (AWS/Bedrock 사용자는 문서화만, 자동화 없음)
- `CLAUDE_CODE_SUBAGENT_MODEL` preflight 차단기 구현 (footgun 문서화만; 경고 체크는 Design의 스트레치 골 후보)
- 기존 문서 소급 번역/개명 (이중언어 규칙은 신규 파일에만 적용)

---

## 3. 요구사항

### 3.1 기능 요구사항

| ID | 요구사항 | 우선순위 | 상태 |
|----|-------------|----------|--------|
| FR-01 | CC 호환성 플로어 정책 결정 + 구현 (Design 옵션; R2 하드 에러 리스크를 무력화해야 함) | High | Pending |
| FR-02 | 40개 에이전트 `model:`을 진정한 4-계층 분류로 역할 기반 재배정: 장기 오케스트레이션 + 검증 코어 → `fable`; **Opus 강점 역할은 `opus` 유지** (사이버보안, Fable 절반 비용의 심층 단발 추론, headless/거부-민감 맥락 — 예: security-architect, 인프라 인접 심층 분석); 구현자 → `sonnet`; 모니터/리포터 → `haiku`. 모든 계층은 Design 매트릭스에서 에이전트별로 논증 — fable은 opus의 일괄 대체가 아님 (사용자 지시 2026-07-02). | High | Pending |
| FR-03 | `VALID_MODELS`에 `fable` 추가 (SEC-AF-051) | High | Pending |
| FR-04 | 런타임 모델 화이트리스트에 `fable` 추가 (subagent-start-handler.js:69) | High | Pending |
| FR-05 | token-report: `_modelClass` fable 분기 + `PRICING_PER_MTOK` fable $10/$50; sonnet/opus 행을 현재 공표 가격과 대조 검증 | High | Pending |
| FR-06 | 에이전트 변경과 같은 커밋에서 계약 베이스라인 v2.1.9 + v2.1.16 재생성 (L1-AG green) | High | Pending |
| FR-07 | 개별 보안 단언 갱신: SEC-AF-013(starter-guide), SEC-AF-030(cto-lead), SEC-AF-038/052(opus-tier 리스트)를 새 매트릭스에 맞춤 | High | Pending |
| FR-08 | 기존 문서 drift 버그 3건 수정 (카운트 36/13-opus → 실제; pm-lead sonnet↔opus; PM-T10 주장) | High | Pending |
| FR-09 | 규범적 허용값 문서 + 역할 범례에 `fable` 추가 (CUSTOMIZATION-GUIDE.md:921,956; _agents-overview.md:55-57) | Medium | Pending |
| FR-10 | Sonnet 5에 대한 KNOWN_REGRESSION_MODELS 해결 (확장 vs 명시적 제외; Design 결정 d) | Medium | Pending |
| FR-11 | evals benchmarkModel + README-FULL 예시 모델 ID를 Claude 5 ID로 갱신 | Medium | Pending |
| FR-12 | 폐기된 `pdca-eval-*` 스텁(6개) → `haiku` (사용자 결정) | Medium | Pending |
| FR-13 | 모든 프로즈 모델 참조 동기화 (skills/, hooks/startup/session-context.js:271,289,443, bkit-system/, README-FULL 다이어그램) | Medium | Pending |
| FR-14 | 릴리스 어드바이저리: 플로어, 프로바이더 별칭 표, footgun 2건, Fable headless 거부 주의 (CHANGELOG + 릴리스 노트 초안) | Medium | Pending |

### 3.2 비기능 요구사항

| 범주 | 기준 | 측정 방법 |
|----------|----------|-------------------|
| CI 무결성 | contract L1/L2/L3/L4/L5 + security + unit + 릴리스 게이트 전체 무실패 | 로컬 전체 실행 + push 시 GitHub Actions |
| Docs=Code | drift 0 (카운트, 에이전트별 모델 컬럼, 역할 범례) | `scripts/docs-code-sync.js` + `tests/qa/bkit-full-system.test.js` + 수동 매트릭스 diff |
| 하위 호환 | 선언된 플로어 CC에서 bkit 에이전트 하드 에러 0; 플로어 미만에서 어드바이저리 | 구버전 CC probe (`npx @anthropic-ai/claude-code@<floor>`) |
| 비용 정확성 | Claude 5 ID가 `unknown`으로 분류되지 않음; fable $10/$50 | `test/unit/token-report.test.js` 확장 |
| 무음 강등 방지 | `fable`이 subagent-start-handler 강제를 통과 | 핸들러 단위/통합 단언 |
| 보안 태세 | security-architect ≠ fable; headless Fable 거부 주의 문서화 | SEC-AF 단언 + 문서 리뷰 |
| 추적성 | 현재 CC에서 frontmatter 반영 증거(R1) 보존 및 QA 재검증 | QA 단계 `claude -p` probe |

---

## 4. 성공 기준

### 4.1 완료 정의 (DoD)

- [ ] SC-1: 40개 `agents/*.md`의 `model:` 값이 승인된 Design 모델 매트릭스와 일치 (gap-detector 검증 가능, 목표 100%)
- [ ] SC-2: 로컬 CC v2.1.198에서 fable 고정 bkit 에이전트(예: gap-detector)가 probe로 `claude-fable-5` 보고; haiku 고정 에이전트는 `claude-haiku-4-5-*` 보고 (headless `claude -p --plugin-dir .`)
- [ ] SC-3: 로컬 전체 게이트 스위트 green: contract-test-run (v2.1.9 + v2.1.16), l2-smoke, l2-hook-attribution, l3-mcp-compat, l3-mcp-runtime, invocation-inventory (L5), security agent-frontmatter 테스트, 단위 테스트, docs-code-sync, check-deadcode, bkit-full-system, qa-aggregate
- [ ] SC-4: token-report 단위 테스트가 fable 클래스 + $10/$50 가격, `claude-fable-5`/`claude-sonnet-5`/`claude-opus-4-8`의 올바른 분류를 증명
- [ ] SC-5: docs=code drift 0; 레거시 문서 버그 3건 수정, 저장소 전체 카운트 일관성
- [ ] SC-6: 작업 브랜치 push 시 GitHub Actions contract-check green (단일 배치 push 정책)
- [ ] SC-7: CHANGELOG(잠정 v2.1.25 헤딩) + GitHub Release 노트 초안에 릴리스 어드바이저리 텍스트 존재

### 4.2 품질 기준

- [ ] 신규 데드 코드 없음 (check-deadcode green); 도메인 순수성 위반 없음
- [ ] 영어 전용 구현 (docs/ 이중언어 쌍 + 8개국어 트리거 리스트 예외)
- [ ] 이 브랜치에서 `.claude-plugin/plugin.json` 버전 무변경

---

## 5. 리스크와 완화

| 리스크 | 영향 | 가능성 | 완화 |
|------|--------|------------|------------|
| CC < 2.1.170에서 `model: fable` 하드 에러 (R2, 재현됨) | High | High (플로어 미만 설치 기반) | Design의 플로어 정책 결정 (플로어 인상 / 어드바이저리 게이팅); 릴리스 어드바이저리; 비-fable 에이전트는 어디서나 동작 유지 |
| 베이스라인이 에이전트 수정에 뒤처지면 contract L1-AG red | High | lockstep 없으면 확실 | 같은 커밋에서 v2.1.9 + v2.1.16 베이스라인 재생성; rollforward SOP 준수 |
| 런타임 화이트리스트가 팀 상태에서 `fable`→`sonnet` 무음 강제 | Medium | 누락 시 확실 | FR-04 + 명시적 테스트 |
| Sonnet 5 vs KNOWN_REGRESSION_MODELS 가드 오발/미발 | Medium | Medium | Design 결정 (d): 가드를 sonnet-4.x ID로 유지(회귀는 버전 특정적) 또는 증거 확보 후 확장; 근거 문서화 |
| headless QA(`claude -p`)에서 Fable 안전 분류기 거부 | Medium | Medium | security-architect는 opus 유지; QA probe는 무해한 프롬프트 사용; 주의사항 문서화 |
| `CLAUDE_CODE_SUBAGENT_MODEL` env가 모든 고정을 오버라이드 | Medium | Low | footgun 문서화 (FR-14); 선택적 스트레치: session-start 경고 |
| AWS/Bedrock/Vertex 사용자는 별칭으로 Claude 5를 못 받음 | Low | Medium | 문서에 프로바이더 표; 보편적 "Sonnet 5" 약속 금지 (NFR-6) |
| 잦은 push로 GitHub Actions 무료 티어 소진 | Low | Medium | 단일 브랜치, 배치 커밋; 마일스톤 시점에만 push |

---

## 6. 영향 분석

### 6.1 변경 리소스

| 리소스 | 유형 | 변경 설명 |
|----------|------|--------------------|
| `agents/*.md` ×40 | 에이전트 frontmatter | 매트릭스에 따른 `model:` 재배정 |
| `test/security/agent-frontmatter.test.js` | CI 화이트리스트 + 단언 | VALID_MODELS += fable; SEC-AF-013/030/038/052 매트릭스 동기화 |
| `test/contract/baseline/{v2.1.9,v2.1.16}/agents/*.json` | 계약 베이스라인 | 모델 필드 재생성 |
| `scripts/subagent-start-handler.js` | 런타임 훅 | 화이트리스트 += fable |
| `lib/pdca/token-report.js` (+ 단위 테스트) | 가격/분류 | fable 클래스 + 가격 |
| `lib/domain/guards/enh-264-token-threshold.js` | 회귀 가드 | Sonnet 5 결정 |
| `lib/infra/cc-version-checker.js`, `hooks/startup/session-context.js` | 버전 플로어 | 플로어 정책 상수 + 어드바이저리 프로즈 |
| `evals/config.json` | 평가 설정 | benchmarkModel → Claude 5 ID |
| 문서: README.md, README-FULL.md, CUSTOMIZATION-GUIDE.md, CHANGELOG.md, commands/bkit.md, skills/*, bkit-system/*, .claude-plugin/marketplace.json | 규범적 문서 | 모델 매트릭스, 카운트, 허용값, 플로어, 어드바이저리 |

### 6.2 현재 소비자

| 리소스 | 연산 | 코드 경로 | 영향 |
|----------|-----------|-----------|--------|
| 에이전트 frontmatter `model` | READ | CC Task 스폰 (해석 순서: env → param → frontmatter → main) | 검증 필요 (QA에서 R1 probe 재실행) |
| 에이전트 frontmatter `model` | ASSERT | contract-test-run.js L1-AG vs 베이스라인 | 베이스라인 재생성 없으면 Breaking (FR-06) |
| 에이전트 frontmatter `model` | ASSERT | agent-frontmatter.test.js SEC-AF-051/013/030/038/052 | 갱신 없으면 Breaking (FR-03/07) |
| 해석된 모델 문자열 | WRITE | subagent-start-handler.js → 팀 상태 | FR-04 없으면 Breaking (무음) |
| 모델 ID 문자열 | READ | token-report.js `_modelClass`/가격 → 대시보드, pdca-watch | FR-05 없으면 무음 오가격 |
| 모델 ID 문자열 | READ | enh-264 가드 `.includes(metrics.model)` | FR-10 결정 없으면 Claude 5 ID에 no-op |
| 모델 프로즈 | READ | session-context.js SessionStart 주입; skills; commands/bkit.md | FR-08/13 없으면 문서 drift |
| `ctoAgent`/팀원 기본값 | READ | lib/team/state-writer.js:46,173,210; hooks/session-start.js:155; subagent-start-handler.js:83 | Design 결정 필요 (기본 `opus` 유지 vs `fable`) |
| benchmarkModel | READ | evals/runner.js:390 | FR-11 없으면 낡은 벤치마크 |

### 6.3 검증

- [ ] 구현 후 위 소비자 전부 재검증 (Check 단계 스윕은 작업 규칙에 따라 "연관 + 유사 코드" 포함)
- [ ] 인증/권한 표면 무접촉
- [ ] 스키마/매니페스트 키 추가 없음 (plugin.json 무접촉 → ADR 0011 21-키 화이트리스트 무영향)

---

## 7. 아키텍처 고려사항

### 7.1 프로젝트 레벨 선택

웹앱 기능이 아님 — bkit 플러그인 내부. 레벨: **Enterprise급 저장소 컨벤션 적용** (lib/ Clean Architecture 4-Layer, CI 계약 게이트 L1–L5).

### 7.2 핵심 아키텍처 결정 (Design으로 이연 — Checkpoint 3)

| 결정 | 옵션 | 선택 | 근거 |
|----------|---------|----------|-----------|
| (a) CC 플로어 정책 | A1: 하드 플로어를 2.1.170+로 인상 / A2: 플로어 유지, RECOMMENDED→2.1.170+, fable은 어드바이저리와 함께 / A3: fable 없음 (사용자가 기각) | Design | R2 하드 에러 vs 설치 기반 도달률 |
| (b) Fable/Opus 분할 | 리드+검증자는 `fable` 지향 (사용자: 품질 우선) 단, Opus 강점 역할은 `opus` 유지 (사용자 지시) — 에이전트별 근거 리스트 | Design 매트릭스 | 에이전트 역할별 비용/품질/안전 분류기; fable ≠ opus 일괄 대체 |
| (c) pdca-eval-* 스텁 | haiku (결정됨) | ✅ haiku | Tombstone; 최소 비용 |
| (d) KNOWN_REGRESSION_MODELS | sonnet-4.x 한정 유지 vs Sonnet 5로 확장 | Design | ENH-264 회귀는 버전 특정적; 증거 없는 확장은 No-Guessing 위반 |
| (e) 팀 기본 모델 (`state-writer.js`, `ctoAgent: 'opus'`) | opus 유지 vs fable | Design | CTO 기본값은 cto-lead frontmatter 결정을 따름 |

### 7.3 Clean Architecture 접근

기존 구조 유지. 변경은 다음 안에 국한: `agents/`(프레젠테이션성 설정), `scripts/`(어댑터), `lib/pdca` + `lib/domain/guards`(도메인/애플리케이션), `test/`(계약). 신규 모듈 없음 예상; 레이어 위반 없음 (check-domain-purity 게이트).

---

## 8. 컨벤션 전제조건

### 8.1 기존 프로젝트 컨벤션

- [x] `.claude/CLAUDE.md` — 언어 규칙 (영어 구현; docs/ 이중언어 쌍; 8개국어 트리거 예외), 버저닝 규칙 (에이전트의 버전 변경 금지)
- [x] 계약 베이스라인 rollforward SOP — `docs/06-guide/contract-baseline-rollforward.guide.md`
- [x] CI 게이트 — `.github/workflows/contract-check.yml` (push: main, feat/**)
- [x] Docs=Code 불변식 — `lib/domain/rules/docs-code-invariants.js`

### 8.2 정의/검증할 컨벤션

| 범주 | 현재 상태 | 정의할 것 | 우선순위 |
|----------|---------------|-----------|:--------:|
| 모델 역할 분류 | 암묵적 (opus=리드/검증, sonnet=작업, haiku=모니터) | fable 포함 명시적 4-계층 범례 (docs FR-09) | High |
| 플로어 선언 | 상수 3개 + 산재한 프로즈 (감사 §C) | README/hooks/marketplace 전반의 단일 플로어 서사 | High |
| 가격 SoT | token-report.js 리터럴 + pdca-watch 프로즈 | token-report를 SoT로 유지; 프로즈는 이를 참조 | Medium |

### 8.3 필요 환경변수

| 변수 | 목적 | 범위 | 생성 여부 |
|----------|---------|-------|:-------------:|
| `CLAUDE_CODE_SUBAGENT_MODEL` | (기존 CC 변수) 모든 frontmatter 고정을 오버라이드 — footgun 문서화 | 사용자 env | ☐ (문서만) |
| `CLAUDE_MODEL` | (기존) 원장 모델 귀속 폴백 | 런타임 | ☐ (무변경) |

### 8.4 파이프라인 통합

N/A — PDCA 단일 기능 흐름 (본 문서), Sprint 래퍼 불필요 (단일 응집 기능; 스코프가 커지면 /sprint 호출 가능).

---

## 9. 다음 단계

1. [ ] 설계 문서 작성 (`docs/02-design/features/claude-model-alignment.design.{en,ko}.md`) — 플로어 정책 3개 옵션 + 40개 에이전트 전체 모델 매트릭스
2. [ ] 사용자의 아키텍처 옵션 선택 (Checkpoint 3)
3. [ ] `/pdca team`으로 구현 (Do), 이후 analyze → iterate → qa → report

---

## 버전 이력

| 버전 | 날짜 | 변경 | 작성자 |
|---------|------|---------|--------|
| 0.1 | 2026-07-02 | PRD + 리서치 + 사용자 체크포인트 결정으로부터 초안 | PDCA 파이프라인 |
