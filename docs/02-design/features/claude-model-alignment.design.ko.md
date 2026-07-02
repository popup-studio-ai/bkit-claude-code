# claude-model-alignment 설계 문서

> **요약**: 이중 플로어 Claude 5 모델 정렬 — 4-계층 역할 기반 모델 매트릭스 (fable×9 / opus×7 / sonnet×16 / haiku×8), 설치 플로어는 CC v2.1.143 유지, 신규 모델 플로어(v2.1.170)는 SessionStart 어드바이저리 + 문서화된 우회로로 표면화.
>
> **프로젝트**: bkit Vibecoding Kit (bkit-claude-code)
> **버전**: 2.1.25 (잠정)
> **작성자**: PDCA 파이프라인
> **날짜**: 2026-07-02
> **상태**: 승인됨 (Checkpoint 3: 옵션 C + 매트릭스 사용자 승인, 2026-07-02)
> **기획 문서**: [claude-model-alignment.plan.ko.md](../../01-plan/features/claude-model-alignment.plan.ko.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | bkit의 모델 지정이 Claude 5 패밀리 이전 시대의 것; 검증/오케스트레이션 에이전트가 가용 최고 성능 아래에서 구동되고, `fable`은 화이트리스트/가격/베이스라인으로 표현조차 불가. |
| **WHO** | CC 버전(<2.1.170 / 2.1.170–196 / ≥2.1.197)과 프로바이더(Anthropic API vs AWS/Bedrock/Vertex)로 세분화된 bkit 설치자; headless/CI 사용자(`claude -p`). |
| **RISK** | CC < 2.1.170에서 `model: fable`은 에이전트 스폰 하드 에러(재현됨, R2); 베이스라인 lockstep 재생성 없으면 contract L1-AG 실패. |
| **SUCCESS** | CC ≥ 플로어에서 40개 에이전트 전부 의도한 모델로 해석(probe 검증); 전체 CI 스위트 green; 레거시 버그 3건 포함 docs=code drift 0; 모델 플로어 미만에서 graceful 어드바이저리. |
| **SCOPE** | agents/ frontmatter 변경 ×16 · 보안 화이트리스트+단언 · 계약 베이스라인 ×2 디렉터리 · subagent-start-handler · token-report · enh-264 주석 · evals 설정 · 플로어 상수 + 어드바이저리 · docs/skills/bkit-system 프로즈. |

---

## 1. 개요

### 1.1 설계 목표

1. 40개 에이전트 각각이 역할에 최적인 모델 클래스에서 구동 (검증/오케스트레이션은 품질 우선, Opus가 최강인 곳은 Opus 보존, 그 외는 비용 절감).
2. 설치 기반 무파손: 설치 플로어 무변경(v2.1.143); 2.1.143–2.1.169 사용자는 미스터리 스폰 에러 대신 명시적·실행 가능한 어드바이저리를 받음.
3. 모든 의존 표면이 하나의 lockstep 커밋으로 이동: 화이트리스트, 런타임 강제, 가격, 계약 베이스라인, 보안 단언, 문서.
4. Docs = Code: 기존 drift 버그 3건 포함, 모델 카운트/테이블/범례가 모든 곳에서 정확.

### 1.2 설계 원칙

- **No Guessing**: 모든 계층 배정은 에이전트별로 논증; KNOWN_REGRESSION_MODELS는 증거 없이 확장하지 않음; 가격은 Do 단계에서 공표 수치와 대조 검증.
- **Graceful degradation**: 모델 플로어 미만에서 어드바이저리 + 문서화된 우회로(`CLAUDE_CODE_SUBAGENT_MODEL=sonnet`); 무음 실패 금지.
- **단일 진실 원천(SoT)**: `agents/*.md` frontmatter가 모델 SoT; 테스트/베이스라인/문서는 이로부터 파생. `token-report.js`가 가격 SoT.

---

## 2. 아키텍처 옵션

### 2.0 아키텍처 비교

| 기준 | 옵션 A: Minimal | 옵션 B: 풀 플로어 인상 | **옵션 C: 이중 플로어** |
|----------|:-:|:-:|:-:|
| **접근** | 화이트리스트/가격/문서만 미래 대비; fable 고정 0 | CC ≥ 2.1.170 요구 선언; 풀 매트릭스 | 설치 플로어 2.1.143 유지 + 모델 플로어 2.1.170 어드바이저리; 풀 매트릭스 |
| **fable 고정** | 0 | 9 | 9 |
| **신규 파일** | 0 | 0 | 0 |
| **수정 파일** | ~15 | ~45 | ~46 (어드바이저리 블록 추가) |
| **복잡도** | Low | Medium | Medium |
| **유지보수성** | Medium (정책 부채) | High | High |
| **노력** | Low | Medium | Medium |
| **리스크** | 없음 (품질 이득도 없음) | 설치 기반 이탈 | Low (graceful 어드바이저리) |
| **권장** | 폴백 | 깔끔하나 배제적 | **선택됨** |

**선택**: **옵션 C** — **근거**: 설치 가능성을 기존 기반 전체에 보존 (2.1.143 플로어는 무관한 이유 — plugin-manifest `displayName` — 로 존재하며 모델 성능과 혼동해서는 안 됨), 최신 CC 사용자는 전체 품질 이득. fable 고정 9개 에이전트는 2.1.143–2.1.169에서만 하드 실패하며, 해당 사용자는 에이전트 이름·필요 CC 버전·즉시 우회로를 명시한 SessionStart 어드바이저리를 받음. (2026-07-02 Checkpoint 3에서 사용자 승인.)

### 2.1 컴포넌트 다이어그램 — 모델 해석 & bkit 접점

```
CC 서브에이전트 모델 해석 (공식 문서, v2.1.196+ 의미론):
  1. CLAUDE_CODE_SUBAGENT_MODEL (env)      ← footgun: 전부 오버라이드 (문서화만)
  2. Agent-tool 호출별 `model` 파라미터
  3. agents/<name>.md frontmatter `model:`  ← bkit SoT (본 설계가 16개 파일 변경)
  4. 메인 대화 모델

모델 값을 읽거나 단언하는 bkit 표면:
  frontmatter ──▶ contract-test-run.js L1-AG  ⇄  베이스라인 v2.1.9 + v2.1.16 (재생성)
             ──▶ agent-frontmatter.test.js (VALID_MODELS + SEC-AF-*)
  런타임 훅: subagent-start-handler.js (화이트리스트 강제) ──▶ 팀 상태
  토큰 원장: unified-stop.js (모델 문자열) ──▶ token-report.js (_modelClass + 가격) ──▶ 대시보드
  세션 시작: session-context.js (CC 버전 감지) ──▶ 신규 모델 플로어 어드바이저리
  팀 기본값: state-writer.js / session-start.js (ctoAgent)
```

### 2.2 데이터 흐름

```
SessionStart → CC 버전 감지
  ├─ < 2.1.143            → 기존 설치 플로어 어드바이저리 (무변경)
  ├─ ≥ 2.1.143 & < 2.1.170 → 신규 모델 플로어 어드바이저리 (fable 에이전트 9개 명시 + 우회로)
  └─ ≥ 2.1.170            → 어드바이저리 없음 (fable OK; sonnet은 2.1.197부터 Sonnet 5로 float)
```

### 2.3 의존성

| 컴포넌트 | 의존 대상 | 목적 |
|-----------|-----------|---------|
| 모델 플로어 어드바이저리 (session-context.js) | `FABLE_MODEL_FLOOR` 상수 (cc-version-checker.js) | 단일 플로어 상수, infra 레이어 |
| contract L1-AG | 베이스라인 v2.1.9 + v2.1.16 | `contract-baseline-collect.js`로 재생성 (SOP: docs/06-guide/contract-baseline-rollforward.guide.md) |
| token-report 가격 테스트 | PRICING_PER_MTOK | 같은 커밋에서 갱신 |

---

## 3. 모델 매트릭스 (데이터 모델)

### 3.1 계층 범례 (4-계층 분류)

| 계층 | 별칭 | 해석 결과 (Anthropic API) | 비용 /MTok | 역할 클래스 |
|------|-------|------------------------------|-----------|------------|
| 검증 & 오케스트레이션 코어 | `fable` | Claude Fable 5 (CC ≥ 2.1.170) | $10 / $50 | 장기 리드 + 설계/갭 검증자 — bkit의 차별화 |
| 심층 추론 & 보안 | `opus` | Opus 4.8 (CC ≥ 2.1.154) | $5 / $25 | 사이버보안, 거부-민감 headless 경로, Fable 절반 비용의 심층 단발 분석 |
| 구현 | `sonnet` | Sonnet 5 (CC ≥ 2.1.197) | $3 / $15 (인트로 $2/$10) | 코딩, 분석, 합성 워커 |
| 모니터 & 리포트 | `haiku` | Haiku 4.5 | 저비용 | 대량·저추론 + 폐기 tombstone |

> **프로바이더 주석 (W-1)**: 위 별칭 해석은 **Anthropic API** 경로에 적용. Claude Platform on AWS에서는 `opus`→Opus 4.7 / `sonnet`→Sonnet 4.6; Bedrock/Vertex/Foundry에서는 `opus`→Opus 4.6 / `sonnet`→Sonnet 4.5이며, `fable`은 프로바이더별 전체 ID 필요. bkit은 보편적 "Sonnet 5" 약속을 하지 않음 (NFR-6); 릴리스 어드바이저리와 문서에 이 프로바이더 표를 포함해야 함.

### 3.2 40개 에이전트 전체 매트릭스

**fable ×9** (opus에서 변경 ×9):

| 에이전트 | 이전 → 이후 | 근거 |
|---|---|---|
| cto-lead | opus → **fable** | 장기 PDCA 오케스트레이션 + 위임 + 자가 점검 = Fable의 정확한 포지셔닝 |
| sprint-orchestrator | opus → **fable** | 다단계 스프린트 라이프사이클, bkit 최장 호라이즌 에이전트 |
| sprint-master-planner | opus → **fable** | 심층 조사 + 컨텍스트 예산 계획 (마스터 플랜 = 최고 레버리지 산출물) |
| pm-lead | opus → **fable** | PM 에이전트 4개 오케스트레이션; 합성 품질이 하류로 복리 |
| qa-lead | opus → **fable** | 4-에이전트 QA 오케스트레이션; 검증 판단 |
| gap-detector | opus → **fable** | 검증의 핵심(match rate SSoT); Fable의 정직성/검증 우위 |
| design-validator | opus → **fable** | 스펙 검증; fresh-context 검증자 패턴 |
| pdca-iterator | opus → **fable** | Evaluator-Optimizer 장기 자가 수리 루프 |
| sprint-qa-flow | opus → **fable** | 7-계층 S1 dataFlow hop 검증 |

**opus ×7** (무변경 — Opus 강점 보존, 사용자 지시):

| 에이전트 | 모델 | 근거 |
|---|---|---|
| security-architect | opus | Opus 4.8이 사이버보안 최강; Fable 안전 분류기가 보안 인접 작업을 리라우트/거부 |
| code-analyzer | opus | 검증자이지만 보안 스캔 포함(거부-민감) + Fable 절반 비용의 심층 단발 분석 |
| self-healing | opus | headless 트리거(Sentry/Slack) — 자동 수리에서 Fable 비대화형 거부 리스크 수용 불가 |
| infra-architect | opus | 심층 단발 인프라 추론; 보안 인접 (IAM, 네트워크 정책) |
| enterprise-expert | opus | CTO급 전략적 단발 심층; 장기 루프 없음 |
| bkit-impact-analyst | opus | 심층 아키텍처 영향 분석, 단발 |
| cc-version-researcher | opus | 심층 리서치 합성, 단발 |

**sonnet ×16** (1개 변경):

| 에이전트 | 이전 → 이후 | 비고 |
|---|---|---|
| sprint-report-writer | opus → **sonnet** | KPI 집계/리포트 합성 = 구현급 작업; Sonnet 5는 저비용으로 Opus급 근접 |
| bkend-expert, frontend-architect, pipeline-guide, pm-discovery, pm-lead-skill-patch, pm-prd, pm-research, pm-strategy, product-manager, qa-debug-analyst, qa-strategist, qa-test-generator, qa-test-planner, skill-needs-extractor, starter-guide | sonnet (무변경) | 구현/분석 워커; CC ≥ 2.1.197에서 별칭이 Sonnet 5로 float |

**haiku ×8** (6개 변경):

| 에이전트 | 이전 → 이후 | 비고 |
|---|---|---|
| pdca-eval-act, pdca-eval-check, pdca-eval-design, pdca-eval-do, pdca-eval-plan, pdca-eval-pm | sonnet → **haiku** | DEPRECATED tombstone (설계상 절대 스폰 안 됨); 실수로 스폰돼도 최저 비용 (사용자 결정) |
| qa-monitor, report-generator | haiku (무변경) | Anthropic 비용 가이드에 따른 모니터/리포터 |

**분포**: 전체 40 = fable 9 / opus 7 / sonnet 16 / haiku 8. 활성 34 (폐기 스텁 6 제외) = fable 9 / opus 7 / sonnet 16 / haiku 2.

### 3.3 파생 기본값 (팀 배관)

| 위치 | 이전 | 이후 | 이유 |
|---|---|---|---|
| lib/team/state-writer.js:46,173 (+ JSDoc 161,191) | `ctoAgent: 'opus'` | `'fable'` | cto-lead frontmatter를 따름 |
| hooks/session-start.js:155 | `'opus'` | `'fable'` | 동일 기본값, 동일 이유 |
| scripts/subagent-start-handler.js:83 | `'opus'` | `'fable'` | 동일 기본값, 동일 이유 |
| lib/team/state-writer.js:210 | 팀원 `'sonnet'` | 무변경 | 워커는 sonnet 유지 |

---

## 4. 인터페이스 변경 (상수, 화이트리스트, 가격)

### 4.1 화이트리스트

| # | 파일:행 | 이전 | 이후 |
|---|---|---|---|
| I-1 | test/security/agent-frontmatter.test.js:470 | `VALID_MODELS = ['opus','sonnet','haiku']` | `['opus','sonnet','haiku','fable']` |
| I-2 | scripts/subagent-start-handler.js:69 | `['opus','sonnet','haiku'].includes(modelRaw)` | `['opus','sonnet','haiku','fable'].includes(modelRaw)` |

### 4.2 가격 & 모델 분류 — lib/pdca/token-report.js

| # | 변경 | 상세 |
|---|---|---|
| I-3 | `PRICING_PER_MTOK` | `fable: { input: 10, output: 50 }` 추가; **`opus: 15/75 → 5/25` 수정** (Opus 4.8 공표가); `haiku` 행은 Do 단계에서 Haiku 4.5 공표가와 대조 검증 (확인되면 갱신); `sonnet: 3/15` 유지 (정가); `unknown: 3/15` 유지 |
| I-4 | `_modelClass()` (:53-57) | `includes('fable') → 'fable'` 분기 추가 |

### 4.3 버전 플로어 상수 & 어드바이저리

| # | 파일 | 변경 |
|---|---|---|
| I-5 | lib/infra/cc-version-checker.js:42 | `RECOMMENDED_VERSION '2.1.150' → '2.1.198'` (+ 주석) |
| I-6 | lib/infra/cc-version-checker.js | export되는 `FABLE_MODEL_FLOOR = '2.1.170'` 추가 (단일 상수, infra 레이어) |
| I-7 | hooks/startup/session-context.js | 신규 모델 플로어 어드바이저리: `2.1.143 ≤ CC < 2.1.170`이면 fable 에이전트 9개 이름, 필요 CC ≥ 2.1.170, 우회로 `export CLAUDE_CODE_SUBAGENT_MODEL=sonnet`(모든 서브에이전트를 sonnet으로 강제 — 임시)를 명시하는 경고 출력. 기존 버전 감지 배관 재사용 (1회 감지; 추가 프로세스 스폰 없음) |
| I-8 | hooks/startup/session-context.js:443 | 낡은 "v2.1.123+/v2.1.140/v2.1.34~141" 프로즈 → 현재 권장 (모델 플로어 v2.1.170, 권장 v2.1.198) |
| I-9 | lib/domain/guards/enh-264-token-threshold.js:20 | `['claude-sonnet-4-6','claude-sonnet-4-5']` 유지; 주석 추가: "Sonnet 5 의도적 제외 — ENH-264 회귀는 sonnet-4.x 특정적; 관측된 증거가 있을 때만 확장 (No Guessing)" |
| I-10 | evals/config.json:5 | `benchmarkModel: 'claude-sonnet-4-6' → 'claude-sonnet-5'` |

### 4.4 보안 단언 — test/security/agent-frontmatter.test.js

| # | 단언 | 변경 |
|---|---|---|
| I-11 | SEC-AF-030 (:221-224) | `cto-lead.model === 'opus'` → `'fable'` |
| I-12 | SEC-AF-013 (:149-152) | `starter-guide.model === 'sonnet'` — 무변경 (매트릭스가 sonnet 유지) |
| I-13 | SEC-AF-038 (:324-333) | OPUS_TIER1 개념을 PREMIUM 계층(opus\|fable)으로 일반화; fable 고정 검증 코어 에이전트가 정당하도록 리스트/로직 갱신 — 테스트의 의도(읽기 전용 에이전트에 우발적 premium+high-effort 금지)를 보존하면서 승인된 매트릭스를 허용. 정확한 수정은 Do 단계에서 테스트 본문을 읽고 결정 (Do는 반드시 전체 테스트를 먼저 읽어야 함) |
| I-14 | SEC-AF-052 (:483-489) | 읽기 전용 Tier-1 예외 `['security-architect','design-validator']` → 매트릭스에 따른 premium-model 예외: `['security-architect' (opus), 'design-validator' (fable), 'gap-detector' (fable)]` (+ 테스트를 읽을 때 발견되는 기타 읽기 전용 fable 에이전트) |

### 4.5 계약 베이스라인

| # | 변경 |
|---|---|
| I-15 | 변경된 16개 에이전트의 모델 필드를 `test/contract/scripts/contract-baseline-collect.js`로 `test/contract/baseline/v2.1.9/agents/*.json`와 `v2.1.16/agents/*.json` 양쪽에서 재생성, `docs/06-guide/contract-baseline-rollforward.guide.md` 준수. 이 재생성에서 `model` 필드만 drift 가능 — diff에 다른 필드 churn이 없어야 함. 에이전트 수정과 같은 커밋 (L1-AG lockstep) |

---

## 5. 검증 체크리스트 (gap-detector 대상 — UI 체크리스트 대체)

> 아래 모든 항목은 독립적으로 검증 가능. 갭 분석이 이 리스트를 측정.

### 5.1 Frontmatter (16개 파일 변경, 24개 무변경)

- [ ] 9개 에이전트 `model: fable`: cto-lead, sprint-orchestrator, sprint-master-planner, pm-lead, qa-lead, gap-detector, design-validator, pdca-iterator, sprint-qa-flow
- [ ] 1개 에이전트 `model: sonnet`: sprint-report-writer
- [ ] 6개 에이전트 `model: haiku`: pdca-eval-{act,check,design,do,plan,pm}
- [ ] opus 에이전트 7개 무변경: security-architect, code-analyzer, self-healing, infra-architect, enterprise-expert, bkit-impact-analyst, cc-version-researcher
- [ ] sonnet 15개 + haiku 2개 에이전트 무변경 (bkend-expert, frontend-architect, pipeline-guide, pm-discovery, pm-lead-skill-patch, pm-prd, pm-research, pm-strategy, product-manager, qa-debug-analyst, qa-strategist, qa-test-generator, qa-test-planner, skill-needs-extractor, starter-guide; qa-monitor, report-generator)

### 5.2 코드 & 테스트

- [ ] 위 I-1 … I-15 (각각 개별 검증 가능)
- [ ] test/unit/token-report.test.js: opus 가격 단언 15/75 → 5/25; 신규 fable 가격 테스트 ($10/$50); 신규 분류 테스트: `claude-fable-5`→fable, `claude-sonnet-5`→sonnet, `claude-opus-4-8`→opus; unknown 폴백 테스트 계속 통과
- [ ] 다른 테스트 하드코딩 파손 없음 (변경된 에이전트에 대한 `'opus'`/`'sonnet'` 단언 grep 스윕 — 연관+유사 코드 규칙)

### 5.3 문서 (규범적 표면)

- [ ] commands/bkit.md:145 헤더 → "40 total (9 fable / 7 opus / 16 sonnet / 8 haiku)"; 에이전트별 모델 컬럼 동기화; pm-lead 행 버그 수정 (`sonnet`으로 표기, 실제는 이제 `fable`)
- [ ] bkit-system/components/agents/_agents-overview.md: 역할 범례에 fable 계층 추가 (:55-57); 카운트 테이블 (:67-69) → 9/7/16/8; 에이전트별 테이블 (:92-122) 동기화 (pm-lead 수정 포함)
- [ ] bkit-system/README.md:214,375 카운트 → 전체 40, 9/7/16/8 (활성 34 = 9/7/16/2)
- [ ] bkit-system/philosophy/context-engineering.md:159-161,168 + ai-native-principles.md:53,132-134 테이블 동기화 (cto-lead → fable)
- [ ] bkit-system/testing/test-checklist.md:399 PM-T10 → "pm-lead는 fable; PM 분석 에이전트 4개는 sonnet"
- [ ] bkit-system/scenarios/scenario-new-feature.md:210 "CTO Lead (opus)" → "(fable)"
- [ ] skills/pdca/SKILL.md:342,383-384 cto-lead (opus) → (fable); skills/pm-discovery/SKILL.md:46 PM Lead (opus) → (fable); skills/cc-version-analysis/SKILL.md:347-350 cto-lead 행 → fable (researcher/impact-analyst는 opus 유지, report-generator는 haiku 유지)
- [ ] hooks/startup/session-context.js:271,289 프로즈 cto-lead (opus) → (fable)
- [ ] CUSTOMIZATION-GUIDE.md:921 `# or opus, haiku` → `# or opus, haiku, fable`; :956 허용값 테이블 += fable (CC ≥ 2.1.170 주석 포함)
- [ ] README-FULL.md:595-598,610 mermaid pm-lead/cto-lead → (fable); :754,757 예시 ID → `claude-opus-4-8`, `--modelA claude-sonnet-5 --modelB claude-opus-4-8`
- [ ] README.md:185 권장 → v2.1.198 + 모델 플로어 문장 (fable 에이전트는 CC ≥ 2.1.170 필요; 미만은 어드바이저리 + 우회로). 배지/요구사항 v2.1.143+ 무변경
- [ ] .claude-plugin/marketplace.json 설명: Claude 5 모델 매트릭스 + 모델 플로어에 관한 문장 1개 추가 (키 무접촉 — ADR 0011 21-키 화이트리스트)
- [ ] CHANGELOG.md: 신규 잠정 `[2.1.25]` 엔트리 (매트릭스, 이중 플로어, 가격 수정, 프로바이더 별칭 표 포함 footgun, 문서 버그 3건 수정). 과거 엔트리(예: :183 ENH-325 "17 opus agents")는 수정하지 않음 — docs-code-sync/bkit-full-system 게이트가 과거 CHANGELOG 라인이 아니라 라이브 코드를 기준으로 하는지 검증
- [ ] skills/pdca-watch/SKILL.md:61 가격 프로즈가 token-report와 일치 ($3/$15 sonnet — 검증)
- [ ] CUSTOMIZATION-GUIDE.md:987,1635 예시 블록: 기존 예시에 `model: fable` 예시 포함/조정 (W-2)
- [ ] lib/domain/ports/token-meter.port.js:17 JSDoc 모델 열거에 fable 추가 (`claude-opus/sonnet/haiku/fable`); 그 외 과거 프로즈 (token-meter.port.js:22 "Opus 4.7 1M", token-accountant.js:57,67, cc-regression/registry.js:20,61)는 **명시적으로 범위 밖** — 회귀 이력 노트는 그대로 유지 (W-3)
- [ ] GitHub Release 노트 초안 (영어, 하이라이트 + UX 변화 + 프로바이더 표 + footgun)을 릴리스 단계 산출물로 준비 (SC-7) — PR 머지 전까지 `.bkit/research/v2125-release-notes-draft.md`에 보관

### 5.4 재현 / probe 증거 (QA)

- [ ] `claude -p --plugin-dir .` probe: gap-detector급 에이전트가 `claude-fable-5` 보고; report-generator급 `claude-haiku-4-5-*`; frontend-architect급 Sonnet 5; security-architect급 Opus 4.8 (분류기 회피를 위해 무해한 프롬프트)
- [ ] R1/R2 로그가 `.bkit/research/v2125-reproduction-log.md`에 보존

---

## 6. 에러 처리 (어드바이저리 & 저하 스펙)

| 조건 | 동작 | 메시지 요지 (영어) |
|---|---|---|
| CC < 2.1.143 | 기존 설치 플로어 어드바이저리 (무변경) | displayName 스키마 요구사항 |
| 2.1.143 ≤ CC < 2.1.170 | SessionStart에서 신규 모델 플로어 어드바이저리 | "bkit v2.1.25는 9개 에이전트를 Claude Fable 5에 고정하며, 이는 CC ≥ v2.1.170이 필요합니다. 이 버전에서는 해당 에이전트가 스폰에 실패합니다. 업그레이드(`npm i -g @anthropic-ai/claude-code@latest`)하거나 임시로 `export CLAUDE_CODE_SUBAGENT_MODEL=sonnet` (모든 서브에이전트를 sonnet으로 강제)." |
| 2.1.170 ≤ CC < 2.1.197 | 어드바이저리 없음 (fable OK; 참고: 해당 바이너리에서 `sonnet`은 여전히 Sonnet 4.6 시대로 해석) | 매우 저렴할 때만 선택적 정보 라인 |
| 엔터프라이즈 `availableModels`가 fable/opus 제외 | CC 네이티브 graceful fallback → inherit (문서화만, bkit 코드 없음) | 문서 주석 |
| `CLAUDE_CODE_SUBAGENT_MODEL` 설정됨 | 모든 고정 오버라이드 (문서화된 footgun) | 문서 주석 (CUSTOMIZATION-GUIDE + CHANGELOG) |

---

## 7. 보안 고려사항

- [ ] security-architect는 `opus` 유지 — 절대 fable 금지 (보안 콘텐츠에 안전 분류기 리라우트/거부; Opus 4.8 사이버보안 최강)
- [ ] code-analyzer + self-healing도 동일한 거부-민감성 이유로 `opus` 유지 (headless 경로)
- [ ] QA probe는 무해한 프롬프트 사용 (headless 모드에서 fable 에이전트의 첫 요청에 CLAUDE.md/git 중심 컨텍스트 회피)
- [ ] 권한/인증 표면 무접촉; plugin.json 키 무접촉 (ADR 0011)

---

## 8. 테스트 계획

### 8.1 테스트 범위 (bkit 게이트에 매핑)

| 유형 | 대상 | 도구 | 단계 |
|------|--------|------|-------|
| L1 | Frontmatter vs 베이스라인(양쪽 디렉터리) + 보안 스위트 + 단위(token-report) | contract-test-run.js, node 테스트 러너 | Do |
| L2 | 훅 스모크 + 귀속 (subagent-start-handler 변경) | l2-smoke, l2-hook-attribution | Do |
| L3 | MCP 정적 + 런타임 (회귀 확인만) | l3-mcp-*.test.js | Do |
| L4 | 폐기 거버넌스 (pdca-eval-* 스텁 모델 변경) | agent-deprecation.test.js | Do |
| L5 | 호출 인벤토리 | invocation-inventory.test.js | Do |
| 릴리스 게이트 | docs-code-sync, check-deadcode, check-domain-purity, bkit-full-system, validate-plugin --strict, qa-aggregate | scripts | Do/Check |
| Probe 스모크 | `claude -p --plugin-dir .`로 실제 모델 해석 | headless CC v2.1.198 | QA |

### 8.2 L1 시나리오

| # | 테스트 | 기대 |
|---|------|----------|
| 1 | contract-test-run --compare v2.1.9 --level L1,L4 | 베이스라인 재생성 후 PASS |
| 2 | contract-test-run --compare v2.1.16 --level L1,L4 | 베이스라인 재생성 후 PASS |
| 3 | agent-frontmatter.test.js 전체 스위트 | VALID_MODELS+fable & 갱신된 SEC-AF-030/038/052로 PASS |
| 4 | token-report.test.js | 신규 fable/claude-5 케이스 + 수정된 opus 5/25 포함 PASS |
| 5 | 부정: `model: fable5` (오타) 에이전트 | SEC-AF-051 FAIL (화이트리스트 여전히 엄격) |

### 8.3 Probe 시나리오 (QA 단계)

| # | 에이전트 (--plugin-dir . 경유) | 기대 모델 보고 |
|---|---|---|
| 1 | gap-detector | claude-fable-5 |
| 2 | report-generator | claude-haiku-4-5-* |
| 3 | frontend-architect | Sonnet 5 ID |
| 4 | security-architect | claude-opus-4-8* |
| 5 | pdca-eval-act (tombstone) | claude-haiku-4-5-* |

### 8.4 시드 데이터 — N/A (DB 없음). 베이스라인 JSON이 "픽스처"; 수집기 스크립트로만 재생성.

---

## 9. Clean Architecture

### 9.1 본 기능의 레이어 배정

| 컴포넌트 | 레이어 | 위치 |
|-----------|-------|----------|
| 에이전트 모델 고정 | Config/Presentation | `agents/*.md` |
| FABLE_MODEL_FLOOR + RECOMMENDED_VERSION | Infrastructure | `lib/infra/cc-version-checker.js` |
| 모델 플로어 어드바이저리 | Adapter (hook) | `hooks/startup/session-context.js` |
| 가격/분류 | Application | `lib/pdca/token-report.js` |
| 회귀 가드 주석 | Domain | `lib/domain/guards/enh-264-token-threshold.js` |
| 런타임 화이트리스트 | Adapter (hook script) | `scripts/subagent-start-handler.js` |
| 팀 기본값 | Application | `lib/team/state-writer.js` |

### 9.2 의존성 규칙

`session-context.js`(어댑터)는 `lib/infra/cc-version-checker.js`를 import 가능 (CC_MIN 어드바이저리 패턴에서 이미 수행). 도메인 가드는 주석만 — 신규 import 없음. check-domain-purity가 green 유지되어야 함.

---

## 10. 코딩 컨벤션 참조

- 영어 전용 코드/주석/문서 (docs/ 이중언어 쌍 예외); `.claude-plugin/plugin.json` 버전 무변경.
- 주석 스타일: 기존 ENH-XXX 표기 컨벤션 준수 (예: 어드바이저리 블록에 `ENH-33x (v2.1.25)` 태그 — Do 단계에서 CHANGELOG를 확인하여 다음 빈 ENH 번호 선택; 추측 금지).
- 베이스라인 재생성: 수집기 스크립트로만; 베이스라인 JSON 수동 편집 금지 (SOP).

---

## 11. 구현 가이드

### 11.1 파일 구조 (신규 런타임 파일 없음; 기존 훅에 어드바이저리 블록 1개 추가)

### 11.2 구현 순서

1. [ ] Module 1 — 에이전트 + 게이트 (SoT 먼저)
2. [ ] Module 2 — 런타임/lib 배관
3. [ ] Module 3 — 플로어 상수 + 어드바이저리
4. [ ] Module 4 — 문서 동기화 + CHANGELOG
5. [ ] 전체 로컬 게이트 스위트 → Check (갭 분석) → QA probe

### 11.3 세션 가이드

#### 모듈 맵

| 모듈 | 스코프 키 | 설명 | 예상 턴 |
|--------|-----------|-------------|:---------------:|
| 에이전트 & CI 게이트 | `module-1` | frontmatter 16개 수정 + VALID_MODELS + SEC-AF-030/038/052 + 베이스라인 재생성 ×2 디렉터리 | 15-20 |
| 런타임 & lib | `module-2` | subagent-start-handler (I-2, :83), state-writer, session-start.js:155, token-report + 단위 테스트, enh-264 주석, evals 설정 | 10-15 |
| 플로어 & 어드바이저리 | `module-3` | cc-version-checker (I-5, I-6), session-context 어드바이저리 (I-7, I-8) + 프로즈 :271,289 | 10-15 |
| 문서 동기화 | `module-4` | commands/bkit.md, bkit-system ×6 파일, skills ×4, CUSTOMIZATION-GUIDE, README, README-FULL, marketplace.json, CHANGELOG | 15-20 |

#### 권장 세션 플랜

`/pdca team`으로 단일 세션 (4개 모듈을 전문 에이전트로 병렬화; 순차 디스패치). 컨텍스트가 부족해지면 module-2 이후 분할 (상태는 Task Management + 메모리 + 본 문서에 지속).

---

## 버전 이력

| 버전 | 날짜 | 변경 | 작성자 |
|---------|------|---------|--------|
| 0.1 | 2026-07-02 | 초안 — 옵션 C + 전체 매트릭스 승인 (Checkpoint 3) | PDCA 파이프라인 |
