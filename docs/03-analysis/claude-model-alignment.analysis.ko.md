# claude-model-alignment 갭 분석 보고서

> **기능**: claude-model-alignment · **브랜치**: `feat/v2.1.25-claude-model-alignment` · **날짜**: 2026-07-02
> **설계 SoT**: [claude-model-alignment.design.ko.md](../02-design/features/claude-model-alignment.design.ko.md)
> **분석자**: gap-detector (Claude Fable 5) · **모드**: 정적 분석 (서버 없음 → static-only 공식)
> **결과**: **Match Rate 100%** (1차 99.6%; 코스메틱 갭 2건 세션 내 수정) — **PASS** (게이트 ≥90%, 목표 100%)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 구버전 CC를 파손하지 않으면서 bkit 40개 에이전트의 모델 지정을 Claude 5 패밀리에 정렬. |
| **WHO** | CC 버전/프로바이더별 bkit 설치자; headless CI 사용자. |
| **RISK** | CC 2.1.170 미만에서 `model: fable` 하드 에러 (R2); L1-AG 베이스라인 lockstep. |
| **SUCCESS** | 설계-구현 100% 일치; 전체 게이트 green; docs=code drift 0. |
| **SCOPE** | 4-계층 매트릭스 + 화이트리스트 + 가격 + 베이스라인 + 플로어 어드바이저리 + 문서 동기화. |

## 1. 전략적 정렬 (PRD→Plan→Design 체인)

- PRD 핵심 문제 (Claude 5 미활용; fable 표현 불가; 문서 drift) — 4-계층 매트릭스 + 화이트리스트/가격/베이스라인 lockstep + 문서 버그 3건 수정으로 **해결**.
- Plan 성공 기준 SC-1..SC-7 — SC-1..SC-5는 본 분석과 게이트로 검증 (SC-2는 라이브 probe로 추가 검증, §5 참조); SC-6 (push 시 CI)과 SC-7 (CHANGELOG + 릴리스 노트)은 Release 단계에서 확정; 초안 존재.
- 설계 결정 준수: 옵션 C 이중 플로어 ✓; Opus 보존 지시 ✓ (security-architect / code-analyzer / self-healing / infra-architect / enterprise-expert / bkit-impact-analyst / cc-version-researcher 모두 `opus` 유지).

## 2. 설계 섹션별 검증 결과

| 설계 섹션 | 항목 | 상태 |
|---|---|:--:|
| §5.1 Frontmatter 매트릭스 (40개 파일 개별 검증) | 9 fable / 7 opus / 16 sonnet / 8 haiku, 정확한 매핑 | ✅ 100% |
| §4 I-1…I-15 인터페이스 변경 | 화이트리스트, 가격 (opus 5/25 수정, haiku 1/5, fable 10/50), _modelClass, RECOMMENDED 2.1.198, FABLE_MODEL_FLOOR 2.1.170, ENH-368 어드바이저리 (에이전트 9개 + 우회로 + 우선순위 + 단일 감지), enh-264 배열 무변경 + No-Guessing 주석, evals benchmarkModel, SEC-AF-030/013/038/052 (PREMIUM_TIER1 일반화), 베이스라인 ×2 디렉터리 model-only | ✅ 100% |
| §3.3 팀 기본값 | ctoAgent 'fable' ×3 지점; 팀원 'sonnet' 무변경 | ✅ 100% |
| §5.2 테스트 | token-report 24/24 (Claude 5 분류 포함); 변경 에이전트에 낡은 하드코딩 없음 | ✅ 100% |
| §5.3 문서 (17개 표면) | 카운트 40=9/7/16/8 전면 일치; pm-lead 버그 수정; PM-T10 수정; CUSTOMIZATION-GUIDE fable + footgun; README 모델 플로어; marketplace 문장 (키 무변경); CHANGELOG `[Unreleased — v2.1.25 provisional]`; 릴리스 노트 초안 | ✅ 100% |
| §6 어드바이저리 스펙 | 메시지 요지, 경계 (2.1.143≤v<2.1.170), 우선순위, fail-open | ✅ 100% |
| §7 보안 불변식 | security-architect/code-analyzer/self-healing은 절대 fable 아님 | ✅ 100% |

## 3. 발견된 갭과 해결

| # | 심각도 | 위치 | 발견 | 해결 |
|---|---|---|---|---|
| G1 | Low (코스메틱, 범위 밖) | evals/ab-tester.js:27 | JSDoc 예시 ID `claude-sonnet-4-6`/`claude-opus-4-6` | 세션 내 수정 → `claude-sonnet-5`/`claude-opus-4-8`; `node --check` OK |
| G2 | Low (코스메틱, 범위 밖) | test/performance/ui-render-perf.test.js:102,104 | 합성 픽스처가 cto-lead/pm-lead를 `'opus'`로 고정 (단언 없음; 퍼포먼스 타이밍 입력 전용) | 세션 내 수정 → `'fable'`; 테스트 exit 0 |

의도적 무변경 (갭 아님): `evals/**/*.yaml` `model_baseline` (이력 캡처 기록), token-meter.port.js:22 / token-accountant / cc-regression 이력 노트 (설계 W-3), enh-264 배열 (I-9), 회귀-이력 테스트의 구 ID 픽스처.

## 4. Match Rate

Static-only 공식 `Overall = Structural×0.2 + Functional×0.4 + Contract×0.4`:

| 축 | 1차 | G1/G2 수정 후 |
|---|:--:|:--:|
| Structural | 100% | 100% |
| Functional | ~99% | 100% |
| Contract | 100% | 100% |
| **Overall** | **99.6%** | **100%** |

## 5. 런타임 검증 증거 (L1 서버 테스트 대체 — CLI 플러그인)

- **라이브 probe** (`claude -p --plugin-dir .`, CC v2.1.198, 재현 로그 R3): gap-detector→`claude-fable-5`, report-generator→`claude-haiku-4-5-20251001`, frontend-architect→`claude-sonnet-5`, security-architect→`claude-opus-4-8[1m]`, pdca-eval-act→haiku. **설계 §8.3과 5/5 일치**; Fable 안전 분류기 거부 없음.
- **게이트 스위트 (CI 미러)**: domain-purity 위반 0; contract L1+L4 vs v2.1.9 (234) 및 v2.1.16 (255) PASS; check-guards 24 PASS; check-test-tracking PASS; docs-code-sync drift 0; check-deadcode PASS; integration-runtime 23/23; l2-smoke 101/101; l2-hook-attribution 13/13; l3-mcp-compat 92/92; l3-mcp-runtime 48/48; L5 invocation-inventory 210/210; bkit-full-system 36/0; docs-code-sync.test 36/36; validate-plugin --strict 0/0; security 55/55; unit token-report/watch/cc-version-checker PASS; e2e cc-min-version 9/9.
- **qa-aggregate vs main 베이스라인**: 브랜치 FAIL 26 / ERR 11 vs main FAIL 32 / ERR 13 — **유발 실패 0건; 순개선 −6 FAIL / −2 ERR** (잔여 실패는 main 기존재 또는 worktree 환경 요인).

## 6. 판정

**100%로 PASS — QA 단계로 진행.** 설계의 모든 약속 실현: Docs=Code, ENH-368 graceful 어드바이저리 포함 이중 플로어, Opus 강점 보존, 화이트리스트/베이스라인/단언 lockstep, Claude 5 가격 정정.

---

## 버전 이력

| 버전 | 날짜 | 변경 | 작성자 |
|---------|------|---------|--------|
| 0.1 | 2026-07-02 | 최초 분석 (99.6% → G1/G2 세션 내 수정 후 100%) | PDCA 파이프라인 (gap-detector) |
