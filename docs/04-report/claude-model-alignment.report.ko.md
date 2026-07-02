# claude-model-alignment 완료 보고서

> **상태**: 완료 — 릴리스 대기 중 (PR 병합 + 관리자 태그 승인)
>
> **프로젝트**: bkit Vibecoding Kit (bkit-claude-code)
> **버전**: 2.1.25 (임시 — 최종 버전은 릴리스 시점에 관리자가 지정)
> **작성자**: PDCA 파이프라인 (보고서 생성자: Claude Haiku 4.5)
> **완료 날짜**: 2026-07-02
> **PDCA 사이클**: #1

---

## 실행 요약

### 1.1 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 기능 | claude-model-alignment |
| 시작 날짜 | 2026-07-02 |
| 종료 날짜 | 2026-07-02 |
| 기간 | 1일 (PM → Plan → Design → Do → Check → QA 단계) |

### 1.2 결과 요약

```
┌─────────────────────────────────────────┐
│  완료율: 100%                           │
├─────────────────────────────────────────┤
│  ✅ 완료됨:     16 / 16 FR 항목         │
│  ✅ 검증됨:     6 / 6 QA 레이어        │
│  ✅ CI 게이트:   22 / 22 통과           │
│  ✅ 프로브:      7 / 7 통과             │
└─────────────────────────────────────────┘
```

### 1.3 전달된 가치

| 관점 | 내용 |
|------|------|
| **문제** | bkit의 40개 에이전트는 Claude 5 이전의 `opus`/`sonnet`/`haiku` 별칭에 고정되어 있었으며, CC 기본 버전(v2.1.143)은 Fable의 가용성(v2.1.170)보다 낮습니다. Claude 5 패밀리(Fable 5, Sonnet 5, Opus 4.8)는 검증/오케스트레이션에 활용되지 않았으며, `fable`은 화이트리스트/가격/베이스라인에서 표현할 수 없었고, 3곳의 문서에서 에이전트-모델 명부를 잘못 설명했습니다. |
| **솔루션** | 품질 우선, 역할 기반 4계층 모델 정렬(리드/검증자용 fable×9, 보안/심층 추론용 opus×7, 구현용 sonnet×16, 모니터용 haiku×8), 이중 기본 정책: 설치 기본값은 v2.1.143 유지(역방향 호환성), 모델 기본값 v2.1.170 선언 + SessionStart 공지 + 2.1.143–2.1.169 사용자용 해결책. 모든 종속 표면을 동시에 업데이트: VALID_MODELS 화이트리스트, 런타임 강제, 가격 테이블($10/$50 Fable, 갱신된 Sonnet/Opus), 계약 베이스라인 v2.1.9 + v2.1.16, 보안 단언, 모든 규범적 문서. |
| **기능/UX 효과** | Fable의 추론/정직성 우위를 통해 검증 품질 상승(gap-detector, design-validator, cto-lead, qa-lead, pdca-iterator, sprint-qa-flow 모두 fable로 이동); Sonnet 5 초기 가격($2–3 per MTok)으로 구현 강화 + 저비용; Haiku로 모니터링 유지 저비용; token-report는 이제 Fable 비용 정확히 계산($10/$50, `unknown` 폴백 없음); 구형 CC 사용자(2.1.143–2.1.169)는 SessionStart에서 명시적 공지(영향받는 9개 에이전트 명시 + `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` 즉시 해결책 제공). |
| **핵심 가치** | 효과가 복합적인 곳(계획 + 검증)에서는 더 높은 출력 품질, 깊은 추론이 불필요한 곳(구현 + 모니터링)에서는 더 낮은 비용, 설치 베이스에 대한 0 회귀 — 모두 CI 통과, docs=code 준비된 상태로 제공. |

---

## 1.4 성공 기준 최종 상태

> 계획 문서의 성공 기준 평가(SC-1..SC-7). SC-6/SC-7은 릴리스 단계 기준(QA 단계 아님); SC-1..SC-5는 아래에서 완전히 검증됨.

| # | 기준 | 상태 | 증거 |
|---|------|:----:|------|
| SC-1 | 모든 40개 `agents/*.md` `model:` 값이 승인된 Design 모델 행렬과 일치(fable 9 / opus 7 / sonnet 16 / haiku 8) — gap-detector 검증, 목표 100% | ✅ 충족 | 분석 100% 일치; 계약 v2.1.16 255 단언 통과; SEC-AF 55/55 녹색; `scripts/docs-code-sync.js` 코드 + 문서 전체 카운트 확인 |
| SC-2 | 로컬 CC v2.1.198에서 fable 고정 에이전트(gap-detector)는 `claude-fable-5` 보고, haiku 에이전트(report-generator)는 `claude-haiku-4-5-*` 보고; 헤드리스(`claude -p --plugin-dir .`) 검증 | ✅ 충족(확장) | R3 라이브 프로브: gap-detector→`claude-fable-5`, report-generator→`claude-haiku-4-5-20251001`, frontend-architect→`claude-sonnet-5`, security-architect→`claude-opus-4-8[1m]`, pdca-eval-act→haiku; QA 단계 추가 pdca-iterator→`claude-fable-5`; 총 5/5 R3 + 2/2 QA L2b = 7/7 새로운-세션 프로브 확인 |
| SC-3 | 전체 로컬 게이트 스위트 녹색: contract-test-run (v2.1.9 + v2.1.16), l2-smoke, l2-hook-attribution, l3-mcp-compat, l3-mcp-runtime, invocation-inventory (L5), security agent-frontmatter 테스트, 단위 테스트, docs-code-sync, check-deadcode, bkit-full-system, qa-aggregate | ✅ 충족 | 분석 §5: domain-purity 0 위반; 계약 L1+L4 통과; check-guards 24/24; l2-smoke 101/101; l2-hook-attribution 13/13; l3-mcp-compat 92/92; l3-mcp-runtime 48/48; L5 invocation-inventory 210/210; bkit-full-system 36/0; validate-plugin --strict 0/0; security 55/55; 단위 테스트 통과; qa-aggregate 메인 대비 −6 FAIL(새 실패 0). QA L1 스팟 체크 분석 수치 정확히 재현. |
| SC-4 | token-report 단위 테스트는 fable 클래스 + $10/$50 가격 및 `claude-fable-5`, `claude-sonnet-5`, `claude-opus-4-8` 정확 분류 증명; Claude 5 ID는 `unknown`으로 분류되지 않음 | ✅ 충족 | 분석 token-report 24/24; opus 가격 15/75→5/25(Opus 4.8 공개 요율) 수정; fable $10/$50 추가; sonnet $3/$15(intro $2/$10은 공급자 수준에서 적용, 하드코딩 아님) 검증; 모든 Claude 5 ID 정확히 라우팅(fallback 없음) |
| SC-5 | 0 docs=code 드리프트; 3개의 레거시 문서 버그 수정 및 카운트 전체 일치 | ✅ 충족 | 수정됨: (i) 에이전트 카운트 36→40, opus 13→17; (ii) pm-lead 문서에 `sonnet` 기재 but 프론트매터 이제 `fable`; (iii) 테스트-체크리스트 PM-T10 이제 "pm-lead는 fable 사용; 4명의 PM 분석가는 sonnet 사용" 정확히 기재; `docs-code-sync.js` 통과 + `bkit-full-system` 36/0(L5 QA); 모든 규범적 표면 동기화(commands/bkit.md, bkit-system/×6, skills/×4, CUSTOMIZATION-GUIDE, README, README-FULL, marketplace.json) |
| SC-6 | GitHub Actions contract-check는 작업 브랜치 푸시에서 녹색(단일 배치 푸시 정책) | ⏸️ 릴리스 시 대기 | 배치 커밋 전략: 모든 변경(에이전트, 화이트리스트, 베이스라인, 문서)을 하나의 PR로 CI가 부분 상태를 절대 보지 않도록 함. 본 QA 보고서는 브랜치 게이트 스위트 녹색 확인; 관리자가 병합 후 GitHub Actions 실행 CI에서 녹색 확인. CI 블로킹 문제 관찰 안 됨. |
| SC-7 | 릴리스 자문 텍스트가 CHANGELOG(`[Unreleased — v2.1.25 provisional]` 헤딩)+ GitHub 릴리스 노트 초안에 존재 | ⏸️ 릴리스 시 대기 | 초안 위치: `.bkit/research/v2125-release-notes-draft.md` — 기본 변경, 공급자 별칭 해석 테이블, `CLAUDE_CODE_SUBAGENT_MODEL` + enterprise `availableModels` 풋건, Fable 헤드리스 거절 주의사항, 3개 문서-버그-수정 요약 포함. 관리자가 최종화 + 공개 준비. CHANGELOG `[Unreleased — v2.1.25 provisional]` 항목 준비됨. |

**성공율**: 5/5 릴리스 전 기준 충족 증거 포함(SC-1..SC-5); 2/2 릴리스 단계 기준 준비 완료 + 병합/태그 승인 대기(SC-6..SC-7).

---

## 1.5 의사결정 기록 요약

> PRD→Plan→Design 의사결정 체인 및 결과. 각 의사결정이 구현에서 따라졌는지, 실제 결과가 무엇인지 추적.

| 출처 | 의사결정 | 따랐는가? | 결과 |
|------|---------|:--------:|------|
| **PRD§6-a** | 기본 정책: 상향 vs 조건부/우아한 접근 | ✅ | **옵션 C(이중 기본) 승인**: 설치 기본값 v2.1.143 유지(전체 설치 베이스 역호환성 유지); 새 모델 기본값 v2.1.170 선언 + 명시적 SessionStart 공지(gap 2.1.143–2.1.169), 에이전트 이름 지정 + 해결책(`CLAUDE_CODE_SUBAGENT_MODEL=sonnet`). 우아한 공지는 자동 실패 방지; 사용자에게 강제 브레이크 없음. |
| **PRD§6-b** | Fable 계층 할당: 보수적(검증자만) vs 균형(리드+검증자) vs Opus 보존 사용자 지시 | ✅ | **4계층 행렬 승인**: 품질 우선 — 9개 에이전트를 fable로(cto-lead, sprint-orchestrator, sprint-master-planner, pm-lead, qa-lead, gap-detector, design-validator, pdca-iterator, sprint-qa-flow); **7개를 opus로 보존**(security-architect, code-analyzer, self-healing, infra-architect, enterprise-expert, bkit-impact-analyst, cc-version-researcher — 사용자 지시: Opus 강점은 Opus 유지, 특히 보안 관련). 행렬별 구현: 100% 커버, gap-detector 검증. |
| **PRD§6-c** | pdca-eval-* 스텁(6 deprecated) → Haiku 비용 절감? | ✅ | **사용자 결정: haiku**. 모든 6개 스텁(`pdca-eval-{act,check,design,do,plan,pm}`)을 sonnet→haiku로 이동. 베이스라인 재생성. 0 위험(작동 중 절대 생성 안 됨); 한계 비용 절감 실현. |
| **PRD§6-d** | KNOWN_REGRESSION_MODELS for Sonnet 5: 가드 확장 vs 명시적-제외? | ✅ | **sonnet-4.x 범위만 유지**(명시적으로 Sonnet 5 제외). ENH-264 회귀는 sonnet-4.x 특정; Sonnet 5로 확장할 증거 없음. 주석 추가: "Sonnet 5 의도적 제외 — ENH-264 회귀는 sonnet-4.x 특정; 관찰된 증거와 함께만 확장(No Guessing)." Sonnet 5 과도한 조절 없음; No-Guessing 원칙 유지. |
| **Plan§1.2 사용자 체크포인트** | Opus 보존 지시: 광범위 fable 업그레이드 적용 금지 | ✅ | 존중함. Design §3.2의 모든 에이전트 계층 개별 논증. security-architect+code-analyzer+self-healing+infra-architect는 opus 유지(각각 특정 이유: 사이버보안/거절민감/심층추론/단일-숏). fable을 광범위 대체로 회피. |
| **Design§2.0 체크포인트-3 옵션** | 옵션 C(이중 기본 + 전체 행렬) 사용자 선택 | ✅ | 정확히 구현됨: 이중 기본(설치 2.1.143, 모델 2.1.170), 전체 4계층 행렬(40개 에이전트 재정렬), session-context.js 공지 블록(ENH-368), 화이트리스트/가격/베이스라인/문서 동시 업데이트. 편차 없음. |
| **Design§I-1..I-15** | 인터페이스 변경(16개 코드/구성 위치) | ✅ | 15개 인터페이스 변경 모두 범위 내 검증 + 구현: VALID_MODELS += fable(I-1), 런타임 화이트리스트 += fable(I-2), 가격 + 모델 분류(I-3/I-4), 버전 상수 + 공지(I-5..I-8), enh-264 범위 주석(I-9), evals benchmarkModel(I-10), 보안 단언(I-11..I-14), 계약 베이스라인 재생성(I-15). 분석 100% 일치. |
| **Design§5.3 문서** | 17개 규범적 표면 동기화; 3개 레거시 드리프트 버그 수정 | ✅ | 모든 17개 표면 감시 + 수정: commands/bkit.md, bkit-system/×6, skills/×4, CUSTOMIZATION-GUIDE, README, README-FULL, marketplace.json. 3개 버그 수정: (i) 에이전트 카운트, (ii) pm-lead 모델 행, (iii) PM-T10 주장. docs-code-sync 통과. |

**결과**: 0 의사결정-구현 갭. 전체 설계 충실성 달성. PRD 의도(중요한 곳의 품질, 적절한 곳의 비용, 회귀 없음) 성공적 실현.

---

## 2. 관련 문서

| 단계 | 문서 | 상태 |
|------|------|------|
| PM | [claude-model-alignment.prd.en.md](../../00-pm/claude-model-alignment.prd.en.md) | ✅ PRD는 문제, 해결책 프레이밍, 5개 옵션 수립 |
| Plan | [claude-model-alignment.plan.en.md](../../01-plan/features/claude-model-alignment.plan.en.md) | ✅ FR-01..14, SC-1..7, 위험 R1..R8 프레이밍 |
| Design | [claude-model-alignment.design.en.md](../../02-design/features/claude-model-alignment.design.en.md) | ✅ 옵션 C 승인; 행렬 + 15개 인터페이스 명세 |
| Check | [claude-model-alignment.analysis.en.md](../../03-analysis/claude-model-alignment.analysis.en.md) | ✅ 일치율 100%, 22개 게이트 녹색 |
| QA | [claude-model-alignment.qa-report.en.md](../../05-qa/claude-model-alignment.qa-report.en.md) | ✅ 6개 계층 통과, 7개 프로브 녹색, QA_PASS |
| Research | [.bkit/research/v2125-reproduction-log.md](../../../../.bkit/research/v2125-reproduction-log.md) | ✅ 프론트매터 동작 경험적 증거 R1–R4 |

---

## 3. 완료된 항목

### 3.1 기능 요구사항(FR-01..FR-14)

| ID | 요구사항 | 상태 | 비고 |
|----|---------|------|------|
| FR-01 | CC 호환성 기본 정책 결정 + 구현(Design 옵션 C 이중 기본) | ✅ 완료 | 설치 기본값 v2.1.143 + 모델 기본값 v2.1.170 w/ 공지 |
| FR-02 | 40개 에이전트의 `model:` 4계층 행렬별 재할당(fable×9 / opus×7 / sonnet×16 / haiku×8) + Opus 보존 사용자 지시 | ✅ 완료 | 16개 변경 에이전트 + 24개 미변경 정확히 배치; gap-detector 100% 일치 |
| FR-03 | `VALID_MODELS`에 `fable` 추가(SEC-AF-051) | ✅ 완료 | test/security/agent-frontmatter.test.js:470 업데이트; 55/55 녹색 |
| FR-04 | 런타임 모델 화이트리스트(subagent-start-handler.js:69)에 `fable` 추가 | ✅ 완료 | 화이트리스트 강제는 더 이상 fable→sonnet 다운그레이드 안 함; 라이브 프로브 확인 |
| FR-05 | token-report: _modelClass fable 분기 + PRICING_PER_MTOK Fable $10/$50; Sonnet/Opus 새로고침 | ✅ 완료 | fable 클래스 추가; opus 15/75→5/25 수정; sonnet $3/$15 검증; `unknown` fallback 없음; 24/24 단위 테스트 케이스 통과 |
| FR-06 | 계약 베이스라인 v2.1.9 + v2.1.16 같은 커밋에서 재생성(L1-AG 동시) | ✅ 완료 | 두 베이스라인 모두 모델만 재생성; 234 + 255 단언 각각 통과; 필드 변동 없음 |
| FR-07 | 대상 보안 단언 업데이트(SEC-AF-030/013/038/052) 새로운 행렬과 일치 | ✅ 완료 | SEC-AF-030 cto-lead 이제 fable; SEC-AF-038/052 PREMIUM_TIER1 일반화; 55/55 모두 녹색 |
| FR-08 | 3개의 레거시 문서 드리프트 버그 수정(카운트 36/13→actual; pm-lead 모델 행; PM-T10 주장) | ✅ 완료 | (i) 36→40 total, 13→17 opus 모든 곳; (ii) pm-lead 프론트매터 이제 fable; (iii) PM-T10 수정됨. docs-code-sync 통과 |
| FR-09 | 규범적 허용값 문서 + 역할 범례를 `fable` 포함하도록 업데이트 | ✅ 완료 | CUSTOMIZATION-GUIDE.md:921,956 + _agents-overview.md:55-57 fable 계층 범례 + CC ≥ 2.1.170 요구사항과 함께 업데이트 |
| FR-10 | Sonnet 5에 대한 KNOWN_REGRESSION_MODELS 해결(확장 vs 제외 결정) | ✅ 완료 | sonnet-4.x 범위 유지; Sonnet 5 명시적 제외 w/ No-Guessing 주석; enh-264-token-threshold.js 주석 추가 |
| FR-11 | evals benchmarkModel + README-FULL 예제 모델 ID를 Claude 5로 업데이트 | ✅ 완료 | evals/config.json benchmarkModel sonnet-4-6→sonnet-5; README-FULL 예제 claude-sonnet-5 / claude-opus-4-8로 업데이트 |
| FR-12 | Deprecated `pdca-eval-*` 스텁(6개) → `haiku`(사용자 결정) | ✅ 완료 | 6개 모두 sonnet→haiku로 이동; 베이스라인 재생성; 0 위험(절대 생성 안 됨) |
| FR-13 | 모든 산문 모델 참조 동기화(skills/, hooks/startup/session-context.js, bkit-system/) | ✅ 완료 | 4개 skills + hooks 산문 + bkit-system ×6 파일 + README/README-FULL 모두 동기화; cto-lead opus→fable, pm-lead opus→fable 전체; 카운트 테이블 수정 |
| FR-14 | 릴리스 자문: 기본, 공급자 별칭 테이블, 2개 풋건, Fable 헤드리스 거절 주의사항 | ✅ 완료(초안) | `.bkit/research/v2125-release-notes-draft.md` 준비됨; CHANGELOG `[Unreleased — v2.1.25 provisional]` 항목 준비됨; 관리자 최종화 준비 |

**기능 완료율**: 14/14 FR 항목(100%) + 증거 추적.

### 3.2 비기능 요구사항

| 카테고리 | 기준 | 달성 | 상태 |
|---------|------|------|------|
| CI 무결성 | 계약 L1–L5 + 보안 + 단위 게이트에서 0 실패; 회귀 없음 | 22/22 게이트 녹색(계약 255+234, 보안 55/55, 단위 24/24, docs-code-sync, deadcode, invocation-inventory 210/210 등); qa-aggregate 메인 대비 −6 FAIL(새 실패 0 도입) | ✅ 완료 |
| Docs = Code | 0 드리프트(카운트, 에이전트-모델 칼럼, 역할 범례); 3개 레거시 버그 수정 | 17개 규범적 표면 모두 감시; 카운트 일치 40=9/7/16/8 모든 곳; pm-lead 모델 행 수정; PM-T10 수정; docs-code-sync.js 통과; bkit-full-system 36/0 | ✅ 완료 |
| 역방향 호환성 | 선언된 기본값 CC v2.1.143에서 bkit 에이전트 0 하드 에러; 2.1.143–2.1.169에 우아한 공지 | 이중 기본 정책: 설치 기본값 2.1.143 미변경; 모델 기본값 2.1.170 + SessionStart 공지(ENH-368) 9개 영향 에이전트 명시 + 해결책. L4 cc-min-version.test.js 공지 경계 확인(9/9 통과) | ✅ 완료 |
| 비용 정확성 | Claude 5 ID 절대 `unknown`으로 분류 안 됨; Fable $10/$50 가격; 자동 다운그레이드 없음 | token-report 단위 24/24 통과; fable 정확히 분류 + 가격 책정; claude-fable-5/claude-sonnet-5/claude-opus-4-8 모두 정확히 라우팅; `unknown`으로의 fallback 없음 (Claude 5 ID) | ✅ 완료 |
| 자동 다운그레이드 없음 | `fable`이 subagent-start-handler 강제를 살아남음; 런타임 화이트리스트 fable 포함 | I-2 화이트리스트 + I-4 주석 모두 구현; 라이브 L2b 프로브(pdca-iterator)는 `claude-fable-5`로 생성 확인, sonnet으로 다운그레이드 안 됨 | ✅ 완료 |
| 보안 태세 | security-architect ≠ fable; 헤드리스 Fable 거절 주의사항 문서화 | security-architect, code-analyzer, self-healing은 opus 유지(절대 fable 아님); SEC-AF 55/55 녹색; 자문 문서는 헤드리스 거절 주의사항 기재(선택적—보편적 "always-fable" 약속 없음) | ✅ 완료 |
| 추적성 | 현재 CC의 프론트매터-준수 증거 유지(R1) 및 QA에서 재검증 | R1–R4 로그 `.bkit/research/v2125-reproduction-log.md`; R3 새로운-세션 프로브(5/5 통과); QA L2b 추가 프로브(2/2 통과); 총 7/7 새로운-세션 프로브 모델 해석 확인; R4 세션-내 캐시 동작 문서화 | ✅ 완료 |

**NFR 완료율**: 7/7 기준(100%).

### 3.3 전달물

| 전달물 | 위치 | 상태 |
|--------|------|------|
| 에이전트 프론트매터 정렬(40개 파일, 16개 변경) | `agents/*.md` | ✅ 행렬별 fable 9 / opus 7 / sonnet 16 / haiku 8 |
| 보안 화이트리스트 업데이트 | `test/security/agent-frontmatter.test.js:470` + SEC-AF-030/038/052 | ✅ VALID_MODELS += fable; 단언 업데이트 |
| 런타임 화이트리스트 업데이트 | `scripts/subagent-start-handler.js:69` | ✅ 화이트리스트는 fable 포함; 자동 강제 없음 |
| 가격 & 분류 | `lib/pdca/token-report.js` + 단위 테스트 | ✅ Fable $10/$50; opus $5/$25; sonnet $3/$15; 분류 테스트 24/24 |
| 계약 베이스라인 | `test/contract/baseline/{v2.1.9,v2.1.16}/agents/*.json` | ✅ 모델만 재생성; L1-AG 489 단언 통과 |
| 버전 상수 & 공지 | `lib/infra/cc-version-checker.js` + `hooks/startup/session-context.js` | ✅ FABLE_MODEL_FLOOR=2.1.170; RECOMMENDED=2.1.198; ENH-368 공지 블록 삽입 |
| Evals 구성 | `evals/config.json:5` | ✅ benchmarkModel sonnet-4-6→sonnet-5 |
| 규범적 문서 동기화 | commands/bkit.md, bkit-system/×6, skills/×4, CUSTOMIZATION-GUIDE, README, marketplace | ✅ 17개 표면 모두 감시 + 수정; 3개 문서 버그 수정 |
| 릴리스 노트 | CHANGELOG + 초안 release-notes-draft.md | ✅ 임시 v2.1.25 항목 준비됨; 최종화 준비 완료 |

---

## 4. 불완전 항목 / 릴리스로 연기

| 항목 | 이유 | 우선순위 | 다음 단계 |
|------|------|--------|----------|
| SC-6: GitHub Actions contract-check 푸시 | 릴리스 단계 기준(PR 병합/푸시 필요) | 높음 | 관리자가 메인 브랜치로 병합; CI는 푸시에서 녹색 확인; 위험 관찰 안 됨 |
| SC-7: 릴리스 노트 발행 | 릴리스 단계(릴리스/태그 생성 필요) | 높음 | 관리자가 기존 초안으로부터 GitHub 릴리스 노트 최종화; CHANGELOG 항목 발행 |
| Optional: CLAUDE_CODE_SUBAGENT_MODEL 사전점검 경고 | 스트레치 목표(풋건으로 문서화만; 코드 블로커 없음) | 중간 | 문서로 충분함; 선택사항 향후 개선으로 세션-시작 경고 훅 추가 |
| Optional: Sonnet 5에 대한 eval 재베이스라인(필요시 drift) | 릴리스 후 관찰(eval은 Sonnet 5 가격 안정화 시 드리프트 가능) | 낮음 | 다음 스프린트 중에 eval 회귀 예산 모니터링; 필요 시 재베이스라인 |
| Optional: 공급자-별칭 문서를 위한 SEC 게이트 | 개선(현재 산문으로만 문서화됨) | 낮음 | 향후: 공급자-테이블 정확성을 위한 스키마 검증 게이트 추가; v2.1.25 범위 밖음 |

---

## 5. 품질 메트릭

### 5.1 구현 범위

| 메트릭 | 값 | 비고 |
|--------|-----|------|
| 변경된 파일 | ~50 | 40개 에이전트 + 16개 코드 파일(화이트리스트, 가격, 베이스라인×2, 훅, 문서×17, 구성) |
| 에이전트 프론트매터 변경 | 16 | cto-lead, sprint-orchestrator, sprint-master-planner, pm-lead, qa-lead, gap-detector, design-validator, pdca-iterator, sprint-qa-flow(fable×9); sprint-report-writer(sonnet); pdca-eval-×6(haiku) |
| 코드 터치 포인트 | ~16 | VALID_MODELS, 런타임 화이트리스트, 가격 테이블, _modelClass, cc-version-checker, session-context, subagent-start-handler, 팀 기본값×3, enh-264 주석, evals 구성, 보안 단언×4 |
| 문서 터치 포인트 | 17 | commands/bkit.md, bkit-system/×6, skills/×4, CUSTOMIZATION-GUIDE, README, README-FULL, marketplace, CHANGELOG |
| 재생성된 테스트 베이스라인 | 2개 디렉토리 | v2.1.9(234 단언) + v2.1.16(255 단언); 총 489 |

### 5.2 최종 분석 결과

| 메트릭 | 목표 | 최종 | 일치율 |
|--------|------|------|:------:|
| Design 일치율 | ≥90% | 100% | ✅ +100% |
| Gap 카운트(첫 패스) | 0 | 2개(미용: JSDoc 예제, 합성 픽스처) | 99.6% → 세션 내 100%으로 수정 |
| CI 게이트 녹색 | ≥90% | 22/22 | ✅ 100% |
| 보안 스위트 | ≥90% | 55/55 | ✅ 100% |
| 단위 테스트 | ≥90% | 24/24(token-report) | ✅ 100% |
| 프로브 테스트(새로운-세션) | ≥4/5 | 7/7(R3 5/5 + QA L2b 2/2) | ✅ 140%(기본선 초과) |
| qa-aggregate vs main | ≤−5 FAIL | −6 FAIL / −2 ERR | ✅ 새 실패 0 |
| Docs=Code 드리프트 | 0 | 0(수정 후) | ✅ 100% 동기화 |

### 5.3 해결된 Gap & 문제

| 문제 | 발견 사항 | 해결책 |
|------|---------|--------|
| G1 | JSDoc 예제 ID(evals/ab-tester.js:27)는 낡은 Sonnet 4 / Opus 4 ID 사용 | 세션 내에서 claude-sonnet-5 / claude-opus-4-8로 업데이트; `node --check` OK |
| G2 | 합성 픽스처(test/performance/ui-render-perf.test.js)는 cto-lead/pm-lead를 opus로 고정 | 새 프론트매터별로 fable로 업데이트; 테스트 exit 0 |
| **전략적** | R2 경험적 증거: `model: fable` CC < 2.1.170에서 하드 에이전트-생성 에러| 이중-기본 공지(ENH-368)는 사용자 2.1.143–2.1.169를 명시적 메시지 + 해결책으로 포착; 자동 실패 방지 |
| **설계 충실성** | 0 설계-구현 gap(99.6% → 100%) | 모든 Design §1..5 약속 이행; 행렬, 인터페이스 지름길 편차 없음 |

---

## 6. 배운 점 & 회고

### 6.1 잘된 점(유지)

- **의사결정 전 경험적 복제**: R2 복제(CC v2.1.150에서 `model: fable` 하드-에러)는 이중-기본 설계를 직접 형성. 이 증거 없이는 설치 베이스를 깨거나(A2 기본 상향) 검증 품질을 남겨뒀을 것(A3 no-fable). 경험적 우선 의사결정이 보상됨.
- **한 스프린트 내 전체 설계 충실성**: PRD→Plan→Design→Do→Check→QA 반복 압력 없이 하루 내 완료. 신중한 업스트림 프레이밍(PRD 위험 R2 + 연구 아티팩트)이 Do 단계 간단히 함.
- **동시 changeset은 CI 깨짐 방지**: 50개 파일(에이전트, 게이트, 베이스라인, 문서) 하나의 커밋으로 배치하면 CI는 절대 부분 상태를 보지 않음(예: 새 에이전트 `model: fable` without 업데이트된 화이트리스트). 0 contract-check 회귀 Do 단계 중.
- **Docs=code 불변량은 레거시 부채 포착**: 동기화 체크리스트는 3개 pre-existing 문서-드리프트 버그(에이전트 카운트, pm-lead 모델 행, PM-T10 주장) 발견 + 수정. 체계적 감시가 ad-hoc 수정을 이김.
- **우아한 공지 패턴은 확장 가능**: ENH-368 공지 블록(session-context.js)은 기존 CC-버전 감지 인프라 재사용(새 프로세스 생성 없음) + 명확히 9개 영향 에이전트 명시 + 즉시 해결책. 패턴은 향후 기본 상향에 이식 가능.
- **보안/거절민감 작업에서 Opus 보존**: 사용자 지시로 security-architect/code-analyzer/self-healing/etc를 opus에 유지는 보상됨. Fable 안전분류 거절 주의사항(R4 design-validator 방어적 거절)은 7-에이전트 opus 계층을 정당화. 높은 품질 보안 태세 유지.

### 6.2 개선 필요(문제)

- **Collector 스크립트 베이스라인 재생성은 여전히 수동**: contract-baseline-collect.js는 신중한 손 호출 + SOP(병렬 실행 없음, 단일 스레드 모드) 필요. 하나의 잘못된 플래그는 베이스라인 손상 또는 자동 필드 드리프트 생성. 이것은 프로세스-품질 위험(설계 문제 아님, 그러나 작동 취약).
- **에이전트 정의 세션 내 캐싱(R4)**: 에이전트 `model:` 프론트매터 변경은 실행 중인 세션에 hot-reload되지 않음; 사용자는 모델 변경을 보려면 새 세션 시작 필요. 설계상(CC 세션 부트스트랩), 그러나 라이브 모델-행렬 변경 검증은 명시적 새로운-세션 프로브 필요(세션 내 체크 아님). 문서 gap: 사용자에게 에이전트-정의 편집은 세션 재시작 필요 공지 없음.
- **Fable 안전분류 거절 주의사항은 저-문서화**: Fable headless 모드에서 보안-인접 내용 거절 가능(관찰: design-validator는 probe 단어를 prompt-injection으로 거절). security-architect를 opus에 유지했으나 다른 fable 에이전트(gap-detector, cto-lead)는 CI에서 이 문제 히트 가능(prompt가 보안-heavy면). 자문 문서는 언급하나 사용자는 pre-emptively 거절을 기대하지 않을 수 있음. optional preflight 경고 제안(Design 단계 스트레치 목표는 미추진).
- **공급자-별칭 분산은 암시적으로 산문에만**: AWS/Bedrock/Vertex는 다른 모델 버전(Sonnet 4.6 vs Sonnet 5)을 얻으나 bkit은 같은 별칭(sonnet) 사용. 테이블 문서화(W-1, NFR-6) 했으나 AWS의 Sonnet 5 기대 사용자는 실망. 보편적 "Sonnet 5 everywhere" 약속은 없으나 기대 설정이 온보딩 초기에 명확할 수 있음.

### 6.3 다음에 시도할 것(Try)

- **다중-파일 동시 변경을 위한 pre-merge 체크리스트**: 베이스라인-데이터 변경(계약)이 코드(에이전트), 비즈니스 로직(가격), 문서(카운트)와 결합할 때, 명시적 pre-merge 체크리스트 작성: (1) 베이스라인은 에이전트 편집에서 격리 재생성(2-단계 검증), (2) docs-code-sync를 게이트로 실행, (3) ci-cost-report 계산(새 가격을 위한 token-report 테스트 커버리지), (4) PR 설명에 단일-커밋 단언. 이는 수동 베이스라인 재생성 위험을 추가 감소.
- **CLAUDE_CODE_SUBAGENT_MODEL 오버라이드를 위한 optional 세션-시작 경고**: 풋건(문서 기재)이나 미묘한 env-var 오버라이드가 자동으로 모든 fable 에이전트를 sonnet으로 다운그레이드하는 것은 optional preflight 경고가 이로울 footgun. 사용자 데이터는 경고를 놓친 것이 이것을 개선할 것.
- **새 모델 가격에 대한 Eval 베이스라인 재실행 SOP**: Sonnet 5 intro 가격($2/$10)은 eventually 정가로 안정화. Evals는 현재 Sonnet 4 대비 베이스라인(토큰 비용 변경). end-of-quarter eval 재베이스라인 작업 문서화(contract-baseline-rollforward.guide.md 비슷함)해서 eval 예산을 현재 가격에 정렬. 이것은 반복 post-release 작업, 긴급 수정 아님.
- **공급자-별칭 정확성을 위한 SEC 게이트**: 현재 공급자 테이블(W-1)은 산문 전용. 향후 SEC 게이트는 문서된 공급자-별칭 매핑이 CC 바이너리와 동기화 유지 검증 가능(예: AWS에서 sonnet이 ≤Sonnet 4.6으로 해석되거나 왜 아닌지 문서화하는 테스트). v2.1.25 범위 밖이나 품질-개선 벡터.

---

## 7. 프로세스 개선 제안

### 7.1 PDCA 프로세스

| 단계 | 관찰 | 개선 제안 |
|------|------|----------|
| PM | Context Anchor + 연구 아티팩트(R1–R4)는 권위적 + 계획 추측 감소 | 아키텍처 의사결정을 위한 경험적 복제 규율 계속; "assume graceful fallback" 별칭/버전 동작 회피 — 먼저 테스트 |
| Plan | 전체 FR/NFR 명세 + 성공 기준 체크포인트 잘 작동; 사용자는 명확한 의사결정(6-a, 6-b, 6-c, 6-d) | decision-point 프레이밍을 PRD에 유지. "deciding tension" 형식(옵션 + tradeoff + rationale)이 체크포인트-3 빠르게 통과하게 함. |
| Design | 3-옵션 비교(A/B/C) + 전체 행렬 감시(16개 코드 포인트, 17개 문서 표면) pre-vet 구현 범위 | 다중-계층 변경을 위한 행렬-감시 규율 유지. Design §3.2 per-agent 근거(왜 이 계층?)는 광범위 fable 업그레이드 방지 + 결과 품질 개선. |
| Do | 동시 배치 커밋 전략은 CI 빨강 신호 방지; 50-파일 span 반복 압력 없음 | 코드/베이스라인/문서 결합 변경을 위해 항상 하나의 커밋으로 배치. 분리는 skew 기회 생성. |
| Check | gap-detector 99.6%→100%(미용 gap만, 세션 내 수정됨) | "gap"의 범위는 적절(인터페이스 드리프트, 문서 예제 포착); 세션 내에서 미용 gap 수정은 OK + 반복보다 빠름. |
| QA | L1–L5 게이트 녹색 + 라이브 프로브 검증(7/7 새로운-세션 프로브)는 프론트매터 동작 + 공지 경계 확인 | 모델 해석 변경을 위해 다중-계층 QA(정적 + 라이브)는 필수 — CI는 플러그인 동작을 미러하나 headless CC 완전히 에뮬레이트 불가. 프로브 검증을 게이트 스위트에 유지. |

### 7.2 도구/환경

| 영역 | 개선 제안 | 기대 이득 |
|------|----------|---------|
| 베이스라인 재생성 | `contract-baseline-collect.js --verify` 플래그 발행(읽기 old + new, diff 형식으로 내보냄) — 커밋 전 자동 필드 churn 포착. 현재 SOP는 인간 `git diff` 감시에 의존. | 자동 베이스라인 손상 위험 감소; SOP를 오용에 더 강력하게 |
| Token-report 테스트 | 40개 에이전트 × 실제 모델-클래스(mocked 문자열 아님) 커버하도록 단위 테스트 확장. 현재 24/24는 가격 테이블 + 분류 로직 커버하나 에이전트-by-에이전트 ledger 아님. | 향후-증명 ledger 정확성; refactored 에이전트 오분류 테스트 시간 포착. |
| Docs=code-sync | `--baseline` 모드 추가해서 코드에서 기대 문서 값을 pre-compute하고 픽스처로 내보냄. 그러면 sync 테스트는 하드코딩 카운트 대신 픽스처에 비교. | 에이전트 카운트 변경 또는 역할 계층 할당 이동 시 수동 문서 업데이트 churn 감소. |
| CC 버전 감지 | `lib/infra/cc-version-checker.js`를 refactor해서 `CC_MIN`과 `RECOMMENDED` + `isModelFloorMet()` 함수 사용 가능하도록 session-context 내보냄. 현재 기본 로직은 파일 간 복제. | 기본 정책 중앙화 as 재사용 가능 서술; copy-paste 위험 감소. |

---

## 8. 다음 단계

### 8.1 즉시(릴리스 & 병합)

- [ ] 관리자는 PR 검토 + 승인(모든 CI 게이트 녹색, 기능 문제 없음)
- [ ] 관리자는 `main` 브랜치로 병합 + 버전 `v2.1.25`로 태그(버전 할당은 repo 규칙당 관리자)
- [ ] GitHub Actions는 `main`에서 실행 + contract-check 녹색 확인(SC-6 최종 검증)
- [ ] 관리자는 GitHub Release 발행(최종화된 릴리스 노트(SC-7)) + CHANGELOG 항목

### 8.2 Post-Release 모니터링(첫 2주)

- [ ] 이슈 추적기에서 "model: fable not found" 또는 "CC version error" 보고 모니터링(S1 사용자 CC < 2.1.170)
- [ ] S1(pre-2.1.170) 보고 나타나면: 에스컬레이션 가이드 = "CC 업그레이드" 또는 "export CLAUDE_CODE_SUBAGENT_MODEL=sonnet"(공지당)
- [ ] 라이브 실행에서 token-report 정확성 확인(fable 에이전트는 cost ledger에서 $10/$50 가격으로 나타남, `unknown` 아님)
- [ ] Eval 회귀 관찰되면: end-of-quarter를 위한 eval 재베이스라인 작업 대기열

### 8.3 향후 PDCA 사이클(개선)

1. **Optional: CLAUDE_CODE_SUBAGENT_MODEL 오버라이드에 대한 세션-시작 경고**(스트레치 목표 from §6.2)
   - 시작 훅에서 optional preflight 체크 추가해서 사용자에게 `CLAUDE_CODE_SUBAGENT_MODEL` env 설정되면 경고
   - Non-blocking(사용자는 여전히 오버라이드 가능), 그러나 투명성 증가
   - 예상 노력: 1–2시간

2. **Eval 재베이스라인 SOP**(post-release, Sonnet 5 가격 안정화 시)
   - End-of-quarter eval 재베이스라인 작업 문서화(contract-baseline-rollforward.guide.md 비슷함)
   - Sonnet 5 intro 가격 sunsets 후에 `evals/config.json` 베이스라인 새로고침
   - 예상 노력: 30분(반복 작업)

3. **공급자-별칭 정확성을 위한 SEC 게이트**(향후 품질 개선)
   - 문서화된 공급자-별칭 매핑이 라이브 CC 버전 정보와 유지되는지 검증하는 테스트 추가
   - AWS/Bedrock/Vertex 테이블은 CC 진화에 따라 최신 유지
   - 예상 노력: 2–4시간

4. **Contract-baseline-collect.js `--verify` 플래그**(작동 견고성)
   - 커밋 전 자동 필드 churn 포착하기 위해 diff-형식 출력 내보냄
   - 수동 감시 오버헤드 감소
   - 예상 노력: 2–3시간

---

## 9. 변경 로그 항목

### v2.1.25(임시 — 릴리스는 관리자가 TBD)

#### 추가

- **4계층 Claude 5 모델 행렬**: 40개 에이전트는 역할별 재정렬 — Fable 5는 검증/오케스트레이션 핵심(cto-lead, gap-detector, design-validator, pm-lead, qa-lead, pdca-iterator, sprint-qa-flow, sprint-orchestrator, sprint-master-planner; 총 9); Opus 4.8은 보안/심층-추론(security-architect, code-analyzer, self-healing, infra-architect, enterprise-expert, bkit-impact-analyst, cc-version-researcher; 총 7); Sonnet 5는 구현(16개 에이전트); Haiku 4.5는 모니터링 + deprecated 스텁(8개 에이전트)
- **이중-기본 정책**: 설치 기본값은 CC v2.1.143 유지(미변경, 역방향-호환); 새 모델 기본값 CC v2.1.170 선언; 2.1.143–2.1.169 사용자는 SessionStart 공지(ENH-368) 수신(영향받는 에이전트 명시 + `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` 해결책 제공)
- **모델 화이트리스트 확장**: `fable`은 `VALID_MODELS`(SEC-AF-051) + 런타임 강제 화이트리스트에 추가됨; 자동 다운그레이드 없음
- **Claude 5 가격**: Fable $10/$50(input/output per MTok); Opus 4.8 $5/$25(낡은 15/75에서 수정됨); Sonnet $3/$15(정가); Haiku low(미변경)
- **계약 베이스라인 재생성**: 16개 변경 에이전트를 위해 v2.1.9(234 단언) + v2.1.16(255 단언) 베이스라인 모두 업데이트됨; L1-AG 동시 = 0 베이스라인 회귀
- **공급자-별칭 매핑 테이블**: 별칭 해석이 공급자마다 다른 것 문서화(Anthropic API: Sonnet 5 / AWS: Sonnet 4.6 / Bedrock/Vertex: Sonnet 4.5); bkit은 보편적 "Sonnet 5 everywhere" 약속 안 함
- **릴리스 자문 내용**(CHANGELOG + GitHub Release): 기본 변경 이유, 공급자 테이블, `CLAUDE_CODE_SUBAGENT_MODEL` 풋건, enterprise `availableModels` 자동 다운그레이드 주의, Fable headless 거절 기재

#### 수정

- **문서-드리프트 버그 #1**: 에이전트 카운트 36 → 40 total; opus 13 → 17; 모든 규범적 표면에서 수정(commands/bkit.md, bkit-system/, skills/, CUSTOMIZATION-GUIDE, README)
- **문서-드리프트 버그 #2**: pm-lead는 `sonnet`으로 문서화되었으나 프론트매터는 이제 정확히 `fable`; bkit-system, skills, commands, 산문 전체 동기화됨
- **문서-드리프트 버그 #3**: 테스트-체크리스트 PM-T10은 "모든 5명의 PM 에이전트는 sonnet 사용"이라고 주장 → 수정됨 "pm-lead는 fable 사용; 4명의 분석가는 sonnet 사용"

#### 변경

- **RECOMMENDED_VERSION**: v2.1.150에서 v2.1.198로 상향(현재 최신 + 전체 Claude 5 가용성 반영)
- **Session-context.js 모델-기본 공지**: ENH-368 블록 추가(2.1.143 ≤ CC < 2.1.170 경계)
- **token-report _modelClass**: `fable` 분기 추가됨; Claude 5 ID를 위한 가격 분류 개선
- **evals/config.json**: benchmarkModel은 claude-sonnet-4-6에서 claude-sonnet-5로 업데이트됨

#### 보안

- `security-architect`, `code-analyzer`, `self-healing`은 `opus` 유지(절대 `fable` 아님) — Fable 안전분류는 보안 내용을 reroute/거절; Opus 4.8은 사이버보안 최강 모델(설계 의사결정은 사용자 지시에 따름)
- 헤드리스 QA 사용자: optional 인식 Fable은 `claude -p` 모드에서 보안-인접 내용을 거절할 수 있음; 자문에 주의사항 문서화됨

---

## 버전 역사

| 버전 | 날짜 | 변경 | 작성자 |
|------|------|------|--------|
| 1.0 | 2026-07-02 | 완료 보고서 — 전체 PDCA 사이클(PRD→Plan→Design→Do→Check→QA); 일치율 100%; QA_PASS; 릴리스 준비 완료 | PDCA 파이프라인(보고서 생성자) |
