# v2126-issue-response 갭 분석 보고서

> **기능**: v2126-issue-response · **브랜치**: `feat/v2.1.26-issue-response` · **날짜**: 2026-07-02
> **설계 SoT**: [v2126-issue-response.design.ko.md](../02-design/features/v2126-issue-response.design.ko.md)
> **분석자**: gap-detector (Claude Fable 5) · **모드**: 정적 콘텐츠 검증 + 오케스트레이터 git 수준 가드 확정
> **결과**: **Match Rate 100%** (1차 99%; Minor 로컬-상태 1건 세션 내 해소 + 테스트-잠금 충돌 iterate 2건) — **PASS** (게이트 ≥90%, 목표 100%)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | AI 코드를 스펙과 대조 검증하는 플러그인이 개발자/클로너를 failed MCP 서버로 맞이해서는 안 됨; 도구/거버넌스는 현재 CC 현실과 일치해야 함. |
| **WHO** | bkit 개발자 + 클로너(MAIN); 메인테이너(릴리스 스크립트); 전체 개발자(상태 무결성). 마켓플레이스 사용자 무영향. |
| **RISK** | validate-pass ≠ load-pass (패킹 스모크 = 수용 기준); 격리 리팩토링이 공유 lib 경로 접촉. |
| **SUCCESS** | 저장소 cwd MCP 상태 클린; 설치본 plugin:bkit:* ✔; 릴리스 --dry-run green; 5개 스위트가 .bkit 바이트 동일 유지; CI green. |
| **SCOPE** | 설계 I-1..I-17 + §4.1 무변경 가드 + §5 스윕. |

## 1. 검증 결과 (I-1..I-17)

전 17개 항목 ✅, file:line 근거 확보 (전체 표는 Check 단계 에이전트 보고서):

- **MAIN (I-1..I-4)**: plugin.json:20-31 인라인 `mcpServers`가 설계 §3.1과 바이트 일치(version 무접촉); 루트 `.mcp.json` 부재; MS 스위트 재지시 + 신규 args-강화(`hasPluginRootArgs`) + R1 인용 MS-016 루트-파일-부재 잠금; 스모크 주장 일관(라이브 재실행은 QA).
- **F1 (I-5, I-6)**: 릴리스 스크립트 6단계 = 항상 `git tag -a` + 정보성 pipefail-safe `plugin tag . --dry-run`; 1-5단계/gh-notes/exit code 보존; cc-version-checker 주석이 `{name}--v{version}` 전환 기록(값 2.1.118 유지 — 맵 의미론 + 테스트 핀 근거).
- **거버넌스 (I-7..I-9, I-15)**: ADR 0011 개정 1(subset-not-mirror 정책 원문 → Plan FR-04 satisfied-by-design; 화이트리스트 21키 동결); ADR 0015 이중언어 쌍(근거 4건); eval SOP 이중언어 쌍(LLM 호출 0회 사실, 동결 명시, eval.yaml 무수정); 45-skills 노트 ×2.
- **F4 (I-10..I-14)**: batch-orchestrator 가산적 `projectRoot` 주입(`_resolveProjectRoot` 기본값 보존), 스프린트 디스패처 deps 우선 해석(`sprint-handler.js:213-239` — 원래 누수 지점), audit-logger `opts.projectRoot`(arity 보존) + telemetry 어댑터 + 직접 호출 9곳 + active-skill-marker; 5개 스위트 tmp-root화; 가드 테스트 `bkit-state-isolation.test.js`(22 TC, 단위-해시 + 메타 자식-프로세스 레벨).
- **마무리 (I-16, I-17)**: CHANGELOG `[Unreleased — v2.1.26 provisional]` + ENH-369; 로컬 `.bkit` 정리 완료(실제 feature 2개만; 스프린트 레지스트리/배치 픽스처 제거).

## 2. §4.1 무변경 가드 — git 수준 확정 (오케스트레이터)

| 가드 | 근거 |
|---|---|
| 계약 베이스라인 바이트 동일 (양쪽 디렉터리) | `git status test/contract/baseline/` empty |
| `servers/**` 무접촉 | `git status servers/` empty |
| `hooks/hooks.json` 무접촉 | `git status hooks/hooks.json` empty |
| `evals/**` 동결 | `git status evals/` empty |
| 버전 필드 무접촉 | plugin.json / bkit.config.json / marketplace.json 전부 2.1.25 |

## 3. 발견된 갭과 해결

| # | 심각도 | 발견 | 해결 |
|---|---|---|---|
| G1 | 회귀 (main 대비 qa-aggregate diff로 발견) | `v2113-sprint-3` B-02가 동결된 infra-bag 형태를 단언; I-11이 `projectRoot`/`injectedProjectRoot` 메타데이터 추가 | I-11 인용으로 테스트 개정(어댑터 4개 무변경 + 메타 2필드) → 66/66 |
| G2 | 회귀 (동일 diff) | `v2113-sprint-4` INV-03 "Sprint 3 baseline 무접촉" 잠금이 승인된 I-12 telemetry-adapter 변경과 충돌 | 잠금 개정: telemetry 어댑터를 baseline 목록에서 제거 + 거버넌스 인용(설계 I-12 + CHANGELOG) → 38/41 (잔여 3 = main 기존재: ENG-01/H-01/AUDIT-01) |
| G3 | Minor (로컬, 미출하) | 전체 qa-aggregate 실행 중 `test-feature` 픽스처가 `.bkit/state/pdca-status.json`에 재출현 — FR-07 설계 범위 밖의 비격리 스위트가 기록(Do 보고서에 후보군 인벤토리) | `deleteFeatureFromStatus`로 제거; 잔여 격리 후보를 후속과제로 기록 |

## 4. Match Rate

정적 공식 `Overall = Structural×0.2 + Functional×0.4 + Contract×0.4`:

| 축 | 1차 | 최종 |
|---|:--:|:--:|
| Structural | 100% | 100% |
| Functional | 98% (I-17 부분) | 100% |
| Contract | 100% | 100% |
| **Overall** | **99%** | **100%** |

## 5. 검증 증거

- 22-게이트 CI-미러 스위트 전체 GREEN (contract 222/243 단언, L5 212/212, MS 16/16, 격리 가드 22/22, security 55/55, l2-smoke 101/101, l3 92+48, full-system 36/0, docs-code-sync drift 0, validate-plugin --strict 0/0).
- qa-aggregate: G1/G2 수정 후 FAIL 25 / ERR 10 — **main 베이스라인과 동일(유발 실패 0)**; 초기 +2/+1 delta 전부 귀속·해소.
- Do에서 이미 확보한 라이브 증거: 저장소-cwd `claude mcp list` bare 엔트리/진단 0(SC-1); `--plugin-dir .` 인라인-매니페스트 도구 호출 OK(SC-2a); 클린-클론 릴리스 `--dry-run` EXIT=0(SC-3). QA에서 재검증.

## 6. 판정

**100%로 PASS — QA 단계로 진행.**

---

## 버전 이력

| 버전 | 날짜 | 변경 | 작성자 |
|---------|------|---------|--------|
| 0.1 | 2026-07-02 | 최초 분석 (99% → G1/G2 잠금 개정 + G3 정리 후 100%) | PDCA 파이프라인 (gap-detector) |
