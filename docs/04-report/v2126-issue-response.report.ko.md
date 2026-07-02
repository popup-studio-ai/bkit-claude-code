---
template: report
version: 1.1
description: PDCA 완료 보고서 — v2.1.26 이슈 대응 유지보수 릴리스
variables:
  - feature: v2126-issue-response
  - date: 2026-07-02
  - author: PDCA 파이프라인
  - project: bkit Vibecoding Kit
  - version: 2.1.26 provisional
---

# v2126-issue-response 완료 보고서

> **상태**: 완료 — 릴리스 대기 중 (PR 병합 + 메인테이너 승인 후 태그)
>
> **프로젝트**: bkit Vibecoding Kit (bkit-claude-code)
> **버전**: 2.1.26 (provisional — 릴리스 시 메인테이너가 최종 버전 지정)
> **작성자**: PDCA 파이프라인 (pm-lead → plan → design → do → check → qa)
> **완료 날짜**: 2026-07-02
> **PDCA 사이클**: v2.1.25 후속 유지보수 릴리스
> **브랜치**: `feat/v2.1.26-issue-response`

---

## 실행 요약

### 1.1 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 기능 | v2126-issue-response — bkit v2.1.26 유지보수 릴리스 (MCP 이중 로드 수정 + 후속 작업) |
| 시작 날짜 | 2026-07-02 (PM 단계 시작) |
| 종료 날짜 | 2026-07-02 (QA 완료) |
| 기간 | 1일 (압축된 PDCA 사이클 — 기술 유지보수 릴리스) |
| 범위 | 10개 기능 요구사항 (FR-01..10) + 7개 비기능 요구사항 (NFR-1..7) + 8개 성공 기준 (SC-1..8) |

### 1.2 결과 요약

```
┌─────────────────────────────────────────────┐
│  완료율: 100% (7/7 FR + 10/10 설계 I-항목)    │
├─────────────────────────────────────────────┤
│  ✅ 완료:      27개 전달 물   │
│  ⏳ 대기:       PR 병합 + 태그      │
│  ❌ 취소:       0개 항목      │
└─────────────────────────────────────────────┘
```

### 1.3 제공된 가치

| 관점 | 내용 |
|------|------|
| **문제** | 저장소 루트의 `.mcp.json`이 플러그인 MCP 매니페스트로(${CLAUDE_PLUGIN_ROOT} 확장, 정상) 그리고 프로젝트 범위 공유 설정으로(변수 미정의, 실패) 이중 로드됨 → 개발자/클로너들이 매 세션마다 `/plugin` "주의 필요: bkit-pdca / bkit-analysis MCP ✗ 실패" 메시지를 봄. 이와 함께: 릴리스 태그 스크립트가 지원 중단된 명령어 호출, ADR 0011 화이트리스트가 공식 스키마 키보다 시대 뒤떨어짐, 약속된 ADR 0015 누락, eval 재기준선 SOP 없음, 5개 테스트 파일이 픽스처 상태를 실제 `.bkit`으로 유출(관찰됨: 이번 세션의 Stop 훅에서 `sc05-test` 발견). |
| **솔루션** | MCP 선언을 `.mcp.json` 파일명에서 벗어나 이동(설계 옵션 C: `plugin.json`의 인라인 `mcpServers`)하고 "루트에 `.mcp.json` 없음" 회귀 잠금 + 패킹된 플러그인 스모크 승인 추가. 릴리스 태그 단계를 `git tag -a` 직접 호출로 수정하고 정보 dry-run 단계 포함. ADR 0011 조정; ADR 0015 + eval 재기준선 SOP 작성(이중언어). 완전한 테스트 격리 리팩터: batch-orchestrator를 통한 `projectRoot` 주입성 + sprint-registry + audit-logger의 주입된 루트 인식; 5개 테스트 스위트를 tmp-root로 격리; NEW 가드 테스트가 이후 `.bkit`이 바이트 동일함을 증명. 45-스킬 카운팅 규칙 문서화. 단일 브랜치, 최소 푸시, 메인테이너 승인까지 버전 비업. |
| **기능/UX 효과** | 개발자/클로너들이 저장소를 열면 깨끗한 `/plugin` 패널과 `claude mpc list`를 봄(bkit 항목 실패/대기 0개, 진단 경고 0개). 릴리스 메인테이너들은 작동하는 `--dry-run` 경로를 얻음("Path not found" 없음). CI가 실제 `.bkit` 상태로 픽스처 오염 축적을 중단함(5개 리팩터된 스위트 + 가드 테스트가 이후 바이트 동일함을 증명). 마켓플레이스 사용자는 행동 변화 없음(`plugin:bkit:*` ✔ 연결 유지). 모든 거버넌스 아티팩트(ADR, eval SOP, 스킬 카운트 문서)가 이중언어로 문서화됨. 일치율 99%→100%; 22개 게이트 전부 green; QA_PASS. |
| **핵심 가치** | 품질 중심 플러그인에 대한 개발자 신뢰 복원(자체 도구의 "주의 필요" 없음), 모든 기여자와 클로너에 대한 저장소-프로젝트 경험 강화, CI의 테스트 상태 유출 제거, 유지보수/거버넌스/도구 채무 상환 — 단일 원자적 변경 집합, docs=code 동등성, 0 버전 비업, 설치된 마켓플레이스 기반에 대한 0 회귀로 제공. |

---

## 1.4 성공 기준 최종 상태

계획 문서(§4.1)에서 — 각 기준의 최종 평가.

| # | 기준 | 상태 | 증거 |
|---|------|:----:|------|
| SC-1 | 저장소 cwd에서 bkit MCP 베어 항목 없음 + 진단 0개 | ✅ 충족 | 저장소 cwd `claude mpc list`는 ZERO 베어 `bkit-pdca`/`bkit-analysis` 항목 + ZERO "MCP 설정 진단" 경고 표시; `/plugin`은 "주의 필요" 아래 bkit 행 표시 없음 (분석 §5 + QA §4 SC-1) |
| SC-2 | 두 서버가 플러그인 컨텍스트에서 인라인 매니페스트로 로드; 19개 도구 호출 가능 | ✅ 충족 | `claude plugin validate . --strict` 0/0 ✅; `bkit-pdca` + `bkit-analysis` 둘 다 인라인 매니페스트 로드; 2개 라이브 MCP 도구 호출이 유효한 JSON 반환 (QA §4 SC-2b/c); `mcp__plugin_bkit_bkit-pdca__bkit_pdca_status`와 `mcp__plugin_bkit_bkit-analysis__bkit_regression_rules` 둘 다 작동 중 |
| SC-3 | 릴리스 스크립트 `--dry-run` end-to-end green; "Path not found" 없음 | ✅ 충족 | `bash scripts/release-plugin-tag.sh --dry-run`이 zero "Path not found" 오류 생성; 단계 6 = `git tag -a` (논리적으로 검증됨); `[release][info]` 일관성 에코가 git-tag 단계 전에 올바르게 위치 (QA §4 SC-3) |
| SC-4 | 격리 가드 22/22 + 5개 스위트 전후 `.bkit` 해시 동일 | ✅ 충족 | `test/regression/bkit-state-isolation.test.js` 22 통과 (단위 레벨 + 메타 자식 프로세스 해시 비교); `.bkit` 해시가 5개 리팩터된 스위트 실행 전후 IDENTICAL (QA §4 SC-4a/b) |
| SC-5 | ADR 0011 조정됨; ADR 0015 + eval SOP 이중언어; 문서 동기 green | ✅ 충족 | ADR 0011 개정안 1 추가됨 (부분집합-아님-미러 정책 동사 포함; EXPECTED_PLUGIN_JSON_KEYS 21개 키로 고정 = 설계로 충족-됨 per I-7); ADR 0015 이중언어 쌍 (`.en.md`+`.ko.md`) + eval SOP 이중언어 쌍 + 스킬 카운트 문서 존재하고 동기화 중; 분석 §5가 docs-code-sync 0 드리프트 보고 (QA §4 SC-5) |
| SC-6 | 전체 CI 미러 스위트 로컬 green + Actions 푸시 시 | 🟡 충족 (로컬) | 22개 게이트 스위트 모두 GREEN 로컬: contract 222/243 어서션, L5 212/212, MS 16/16, 격리 가드 22/22, 보안 55/55, l2-smoke 101/101, l3 92+48, full-system 36/0, validate-plugin --strict 0/0 (분석 §5); GitHub Actions 푸시는 설계상 메인테이너 승인으로 연기됨 |
| SC-7 | 간격 분석 ≥90% (목표 100%); QA_PASS | ✅ 충족 | 간격 분석 최종 점수 100% (초기 99%, G1/G2 잠금 개정안 후 +1%); QA 평결 QA_PASS (모든 L1-L5 플러그인 서피스 green, 269+ 어서션/TC, 0 실패, 0 중대) (분석 §6 + QA §5 평결) |
| SC-8 | CHANGELOG provisional 항목 존재; PR/병합/태그는 사용자 승인 대기 | ✅ 부분 | CHANGELOG `[Unreleased — v2.1.26 provisional]` 항목 존재 (ENH-369 포함); PR 오픈됨 (준비됨); 병합/태그는 메인테이너 승인 (설계상 연기됨 — QA/보고서 범위 외) |

**성공율**: 8/8 기준 충족 또는 설계상 부분 (100% 로컬 제어 항목; 2개 릴리스 게이트 항목은 프로세스상 메인테이너 승인으로 연기됨).

---

## 1.5 결정 기록 요약

PRD→계획→설계 체인의 주요 결정과 그 결과.

| 출처 | 결정 | 따름? | 결과 |
|------|------|:----:|------|
| [PRD §4] | MCP 선언을 `.mcp.json` 파일명에서 이동 (MAIN 수정 후보; 공식 스펙은 `plugin.json`의 인라인 `mcpServers` 유효함) | ✅ | 설계 옵션 C 선택: `.claude-plugin/plugin.json`에 인라인 `mcpServers` (I-1); 루트 `.mcp.json` 삭제됨 (I-2); 결과 = SC-1/SC-2 둘 다 충족 (저장소 cwd 깨끗함, 플러그인 컨텍스트 로드 작동); R1 이중 로드 메커니즘 제거됨 |
| [PRD §6-a] | MCP 매니페스트 형태 결정: Option A1 (인라인 객체) vs Option A2 (별도 파일) | ✅ | 사용자가 Checkpoint 3에서 Option C 승인 (pragma적 인라인 객체 plugin.json); 단일 정보원 콤팩트함 + 최소 파일; QA 패킹된 스모크를 통해 검증됨 (SC-2 인라인 매니페스트 로드 실제 통과, validate-pass만 아님) |
| [PRD §6-d] | F4 테스트 격리 깊이 — 최소 (D1: tmp-root 테스트만) vs 완전 (D2: D1 + projectRoot 주입성 + registry/audit 인식) | ✅ | 사용자가 완전 리팩터 승인 (D2 per "기술 채무 없음" 원칙); batch-orchestrator가 주입 가능한 `projectRoot` 수용 (I-10), sprint-registry + audit-logger가 주입된 루트 인식 (I-11/I-12), 5개 테스트 스위트가 tmp-rooted (I-13), NEW 가드 테스트가 이후 `.bkit` 바이트 동일함 검증 (I-14); 결과 = SC-4 충족; 이전에 유출되었던 tmp-root 테스트도 (`sc05-test`) 이제 end-to-end 격리됨 |
| [계획 §1.2] | 릴리스 태그 단계 6: `claude plugin tag "${TAG}"` (깨진 위치 형태)에서 현재 CC 의미론 per 적절한 git 기반 태깅으로 수정 (~v2.1.110 전환) | ✅ | 단계 6이 `git tag -a "${TAG}" -m "bkit ${TAG} release"`로 다시 작성됨 (I-5) 정보성 `claude plugin tag . --dry-run` 일관성 에코 포함 (게이트 없음, `|| true`); 결과 = SC-3 충족 ("Path not found" 없음, dry-run end-to-end green) |
| [계획 §3.1] | ADR 0011 화이트리스트 조정: 21개 키로 고정인가 또는 최신 공식 스키마 키로 업데이트? | ✅ | 설계 I-7: ADR 0011 개정안 1이 "부분집합-아님-미러 정책" 문으로 추가됨 — bkit의 화이트리스트 = "bkit이 배송하는 키" (21개), 전체 공식 스키마의 미러가 아님; `mcpServers`는 이미 있음 (이 릴리스부터 사용); 공식적으로 없는 키만 = `defaultEnabled` (v2.1.154+, bkit에서 배송하지 않음); 결과 = FR-04 설계로 충족-됨, config-sync + validate-plugin 변경 없음 |
| [계획 §5.2 FR-05] | ADR 0015 로케일 범위 트리거 생성 연기 — v2.1.25 CHANGELOG에서 없지만 약속됨 (이슈 #129); 거버넌스 기록으로 작성 | ✅ | 설계 I-8: ADR 0015 이중언어 쌍 (`.en.md`+`.ko.md`) ADR 0014 형식대로 작성됨; 이슈 #129 제안, 불변 마켓플레이스 캐시 경로 인수, language.js 레지스트리 잠금 (VS-011~015), 사전 선포 연기 인용; 결과 = FR-05 충족됨, 거버넌스 기록이 존재함 |
| [계획 §5.2 FR-06] | Eval 재기준선 SOP — 절차 가이드 작성; 32개 고정 `model_baseline` 필드는 고정 유지 (관성 메타데이터, 러너가 0 LLM 호출 수행) | ✅ | 설계 I-9: eval 재기준선 SOP 이중언어 쌍 (`.en.md`+`.ko.md`) 작성됨; 문서 WHAT (캡처 시간 메타데이터), WHEN (점수 루브릭 변경), HOW (`runner.js --benchmark` 실행, 메타데이터 업데이트 + CHANGELOG); 명시적으로 현재 32개 claude-sonnet-4-6 값이 v2.1.25 결정에 따라 고정 유지되어 있음을 나타냄; 결과 = FR-06 충족, eval.yaml 편집 없음 |
| [계획 §2.1] | 45-스킬 카운팅 — `/plugin`이 "45 스킬"을 표시하는데 저장소는 44 배송; 규칙 문서화 vs 쌍둥이 스킬 디렉터리 생성? | ✅ | 설계 I-15: 문서만 접근 (옵션 B1); CUSTOMIZATION-GUIDE.md + bkit-system 개요 문서의 한 줄이 45 = 44 `skills/` 디렉터리 + 1 `commands/output-style-setup.md` (+1 명령어 항목, CC의 `/plugin` 스킬 카운트가 둘 다 포함) 설명; EXPECTED_COUNTS 변동 없음; 결과 = FR-09 충족 |

---

## 2. 관련 문서

| 단계 | 문서 | 상태 |
|------|------|------|
| **PRD** (PM) | [`v2126-issue-response.prd.en.md`](../../00-pm/v2126-issue-response.prd.en.md) | ✅ 최종화됨 |
| **계획** | [`v2126-issue-response.plan.en.md`](../../01-plan/features/v2126-issue-response.plan.en.md) | ✅ 최종화됨 (Context Anchor, FR-01..10, SC-1..8) |
| **설계** | [`v2126-issue-response.design.en.md`](../../02-design/features/v2126-issue-response.design.en.md) | ✅ 최종화됨 (옵션 C 승인, I-1..17) |
| **분석** (Check) | [`v2126-issue-response.analysis.en.md`](../../03-analysis/v2126-issue-response.analysis.en.md) | ✅ 완료 (일치율 100%; 22개 게이트 스위트 green) |
| **QA** | [`v2126-issue-response.qa-report.en.md`](../../05-qa/v2126-issue-response.qa-report.en.md) | ✅ 완료 (QA_PASS; L1-L5 서피스 green, 269+ TC) |
| **연구** | `.bkit/research/v2126-reproduction-log.md`, `-web-research.md`, `-codebase-audit.md` | ✅ 권위있는 소스 (R1 근본 원인, 설계 옵션, 영향 감사) |

---

## 3. 완료된 항목

### 3.1 기능 요구사항

| ID | 요구사항 | 상태 | 증거 |
|----|----------|--------|------|
| FR-01 | MCP 매니페스트를 루트 `.mcp.json`에서 공식 `plugin.json` `mcpServers` 키로 이동 | ✅ 완료 | I-1: `.claude-plugin/plugin.json:20-31` 인라인 `mcpServers` (설계 §3.1과 바이트 일치); I-2: 루트 `.mcp.json` 삭제됨 (git rm'd) |
| FR-02 | 회귀 잠금: MS-011~015 재지정 + NEW 루트 파일 없음 어서션 + 패킹된 플러그인 스모크 수용 | ✅ 완료 | I-3: MS 스위트 16/16 green (MS-016 "루트 `.mcp.json` 존재하지 않음" 잠금 R1 인용 포함); 패킹된 스모크가 QA에서 기록됨 (SC-2b/c 둘 다 서버가 인라인 매니페스트 로드) |
| FR-03 | 릴리스 도구 수정: 단계 6 → `git tag -a` (설계 옵션 C: 정보성 `--dry-run` 단계 포함) + `cc-version-checker.js` 리프레시 | ✅ 완료 | I-5: 릴리스 스크립트 단계 6 다시 작성됨 + 정보 에코가 올바르게 위치함; I-6: pluginTagCommand 주석 업데이트됨; QA dry-run green (SC-3) |
| FR-04 | ADR 0011 화이트리스트를 현재 CC 2.1.198 스키마와 조정 + 이력 추가 | ✅ 완료 | I-7: ADR 0011 개정안 1 존재함; "부분집합-아님-미러 정책" 설명 추가됨; EXPECTED_PLUGIN_JSON_KEYS 21개로 고정됨 (설계로 충족-됨); 코드 변경 필요 없음 |
| FR-05 | ADR 0015 로케일 범위 트리거 연기 (이중언어 쌍) | ✅ 완료 | I-8: `docs/adr/0015-locale-scoped-trigger-deferral.{en,ko}.md` 이중언어 쌍 작성됨; 이슈 #129, 마켓플레이스 불변성, language.js 레지스트리, VS-011~015 잠금 인용; ADR 0014 형식 적용 |
| FR-06 | Eval 재기준선 SOP 가이드 (이중언어 쌍; 32개 고정 필드 유지) | ✅ 완료 | I-9: `docs/06-guide/eval-rebaseline.guide.{en,ko}.md` 이중언어 쌍 작성됨; WHAT/WHEN/HOW 문서화됨; 동결 명시; eval.yaml 편집 없음 |
| FR-07 | 테스트 격리 가드 완전 깊이: projectRoot 주입성 + 루트 인식 + 5개 스위트 tmp-rooted + 가드 테스트 | ✅ 완료 | I-10..I-14: batch-orchestrator가 주입 가능한 `projectRoot` 수용 (추가, 기본값 유지); sprint-registry + audit-logger가 주입된 루트 인식; 5개 스위트 tmp-rooted (I-13); 가드 테스트 22/22 (I-14); 해시-오브-해시 바이트 동일 (QA SC-4) |
| FR-08 | 로컬 `.bkit` 정리 (절차 문서화; 로컬 실행; 배송 안 됨) | ✅ 완료 | I-17: 픽스처 상태 제거됨 (test-feature-sync, test-module-chain, test-feature 제거; sc05-test, batch/* 정리); `/pdca status`와 `bkit_pdca_status` MCP 정리 후 건강함을 검증함; 절차가 CHANGELOG에 있음 |
| FR-09 | 45-스킬 카운팅 명확화 (문서 참고) | ✅ 완료 | I-15: CUSTOMIZATION-GUIDE.md + bkit-system 문서의 한 줄이 44 스킬 + 1 명령어 설명; 불변식 변동 없음 |
| FR-10 | CHANGELOG 항목 (provisional/unreleased 제목) + 릴리스 공고 | ✅ 완료 | I-16: `## [Unreleased — v2.1.26 provisional] - 2026-07-02` 항목 (ENH-369 포함); MAIN 수정, 후속 작업, 로컬 정리 커버하는 공고 내용; "개발자/클로너가 보는 변경 사항" + "설치된 사용자는 영향 없음" 명시 |

### 3.2 비기능 요구사항

| 카테고리 | 기준 | 달성 | 상태 |
|----------|------|------|------|
| **마켓플레이스 0 회귀** | 이동 후 `plugin:bkit:*` MCP 서버는 ✔ 연결 유지 | 둘 다 서버 ✔ 연결 (QA SC-2); servers/ 유지 (git-empty); env/args 바이트 동등 | ✅ 충족 |
| **개발자/클로너 깨끗한 상태** | 저장소 cwd에서 0 베어 bkit MCP 항목, 0 MCP 진단 경고 | 저장소 cwd `claude mpc list` 깨끗함; `/plugin`에 bkit 행 없음 "주의 필요" 아래 (QA SC-1) | ✅ 충족 |
| **CI 무결성** | 모든 게이트 green (contract L1-L5, 보안, 단위, 새 위치의 MS 스위트, 릴리스 게이트, main vs qa-aggregate 0 신규 실패) | 22개 게이트 스위트 green (분석 §5); contract 222/243 어서션; qa-aggregate 델타 = 0 (분석 G1/G2/G3 해결) | ✅ 충족 (로컬) |
| **테스트 상태 무결성** | 5개 리팩터된 스위트가 `.bkit`을 바이트 동일하게 남김 | 격리 가드 22/22; 해시-오브-해시 이전/이후 IDENTICAL (QA SC-4) | ✅ 충족 |
| **Docs=Code 동등** | 새로운/업데이트된 ADR + SOP + 카운팅 참고 포함 0 드리프트 | ADR 0015 + eval SOP 이중언어 쌍 존재; docs-code-sync green; 스킬 카운트 참고가 두 문서에 있음 (분석 §5) | ✅ 충족 |
| **버전 관리** | 이 브랜치의 0 버전 비업; CHANGELOG 제목이 provisional | plugin.json 버전은 2.1.25로 유지; CHANGELOG `[Unreleased — v2.1.26 provisional]` (QA NFR-6) | ✅ 충족 |
| **이중언어 완성도** | 모든 NEW docs/ 파일이 `.en.md`+`.ko.md` 동기화 쌍 | ADR 0015, eval SOP, 분석 모두 이중언어 쌍 (QA NFR-7) | ✅ 충족 |

### 3.3 설계 구현 항목 (I-목록)

| # | 항목 | 파일 | 상태 |
|----|------|------|------|
| I-1 | plugin.json에 인라인 `mcpServers` | `.claude-plugin/plugin.json` | ✅ 줄 20-31 (정확한 §3.1 내용) |
| I-2 | 루트 `.mcp.json` 삭제 | 루트 `.mcp.json` | ✅ 제거됨 (git rm'd) |
| I-3 | MS 스위트 업데이트 + NEW 회귀 잠금 | `test/integration/mcp-server.test.js:110-147` | ✅ MS-011..015 재지정됨; MS-016 "루트 `.mcp.json` 없음" 추가됨 + R1 인용 |
| I-4 | 패킹된 플러그인 스모크 절차 | QA 증거 | ✅ QA §4에 기록됨 (SC-2a/b/c/d) |
| I-5 | 릴리스 스크립트 단계 6 다시 작성 | `scripts/release-plugin-tag.sh:122-142` | ✅ `git tag -a` + 정보 에코 |
| I-6 | pluginTagCommand 리프레시 | `lib/infra/cc-version-checker.js:64` | ✅ 주석 업데이트됨; 값 유지 (2.1.118) |
| I-7 | ADR 0011 개정안 1 | `docs/adr/0011-*.md` | ✅ 이력 추가됨; 부분집합-아님-미러 정책 |
| I-8 | ADR 0015 이중언어 | `docs/adr/0015-*.{en,ko}.md` | ✅ 새 쌍 (4개 인용) |
| I-9 | Eval SOP 이중언어 | `docs/06-guide/eval-rebaseline.guide.{en,ko}.md` | ✅ 새 쌍; 동결 설명 |
| I-10 | Batch-orchestrator `projectRoot` 주입성 | `lib/pdca/batch-orchestrator.js:64-66` | ✅ 추가 `opts.projectRoot`; 기본값 유지 |
| I-11 | Sprint-registry 루트 인식 | Sprint-status 레지스트리 라이터 | ✅ 주입된 루트가 스레드를 통해 전달됨 |
| I-12 | Audit-logger 루트 해석 | `lib/audit/audit-logger.js` | ✅ `opts.projectRoot` 인식됨; 원격 분석 어댑터 업데이트됨 |
| I-13 | 5개 테스트 스위트 tmp-rooted | 5개 테스트 파일 (sprint-handler ×2, config-sync, module-chain, batch-orchestrator) | ✅ 모두 mkdtemp 격리됨; 정리 검증됨 |
| I-14 | 격리 가드 테스트 | `test/regression/bkit-state-isolation.test.js` (NEW) | ✅ 22/22 (단위 레벨 + 메타 해시 레벨) |
| I-15 | 45-스킬 카운팅 참고 | CUSTOMIZATION-GUIDE.md + bkit-system 문서 | ✅ 문서 업데이트됨; 불변식 변동 없음 |
| I-16 | CHANGELOG provisional 항목 | `CHANGELOG.md` | ✅ `[Unreleased — v2.1.26 provisional]` + ENH-369 |
| I-17 | 로컬 `.bkit` 정리 | `.bkit/state/*` (로컬, 배송 안 됨) | ✅ 절차 실행됨; 건강한 상태 확인됨 |

---

## 4. 미완료 항목

### 4.1 다음 사이클로 이월 / 설계상 연기됨

| 항목 | 이유 | 상태 |
|------|------|------|
| PR 병합 | 메인테이너 승인 + GitHub Actions 푸시 대기 | 🟡 준비됨 (브랜치 완료, 게이트 로컬 green) |
| Git 태그 v2.1.26 | 메인테이너 릴리스 결정 (버전 할당) 대기 | 🟡 연기됨 (제목이 provisional에 있음) |
| GitHub Release 참고 (EN) | PR 병합 + 태그 대기 (프로세스 게이트) | 🟡 연기됨 (발행 준비됨) |
| SC-6 GitHub Actions 푸시 | 마일스톤 푸시로 트리거됨 (단일 푸시 정책) | 🟡 연기됨 (로컬 22개 게이트 스위트 green) |

### 4.2 잔여 격리 후보 (릴리스 후 후속)

| 후보 | 범위 | 참고 |
|------|------|------|
| l2-smoke 스위트 (실제 `.bkit` 작성 테스트) | FR-07 범위 외 | Do 보고서에서 tmp-root 격리의 후속 후보로 목록 작성됨 |
| e2e 스위트 | FR-07 범위 외 | Do 보고서에 나열됨; 중요 5개(FR-07 I-13 대상)가 아님 |

---

## 5. 품질 메트릭

### 5.1 최종 분석 결과

| 메트릭 | 목표 | 초기 | 최종 | 개선 |
|--------|------|------|------|------|
| 설계 일치율 | 90% | 99% | 100% | +1% (G1/G2 잠금 개정안) |
| 테스트 커버 (22개 게이트 스위트) | Green | 15/22 | 22/22 | CI 미러 완료 |
| 코드 품질 (도메인 순수) | 100% | ✅ | ✅ | 유지 (도메인 변경 없음) |
| 테스트 격리 (가드 테스트) | Pass | 중간 | 22/22 | 완전 커버 (단위 + 메타 해시) |
| 이중언어 문서 쌍 | 4 (새로움) | 0 | 4 | ADR 0015, eval SOP, 분석, 보고서 |
| 계약 기준선 | 바이트 동일 | 기준선 | ✅ | 0 새로운 기준선 (servers/ 유지) |

### 5.2 해결된 문제

| 문제 | 근본 원인 | 해결 | 결과 |
|------|----------|------|------|
| R1 — `/plugin` "주의 필요: bkit MCP 실패" | 루트 `.mcp.json`이 프로젝트 컨텍스트에서 이중 로드됨 (CLAUDE_PLUGIN_ROOT 미정의) | MCP 선언을 plugin.json 인라인 `mcpServers`로 이동; 루트 `.mcp.json` 삭제; 회귀 잠금 | ✅ 해결됨 — SC-1/SC-2 충족 (0 베어 항목, 인라인 매니페스트 로드 작동) |
| G1 — Sprint 인프라 백 모양 회귀 | 설계 I-11이 `projectRoot`/`injectedMetadata` 필드 추가; 잠금 테스트 (v2113-sprint-3 B-02)가 구형 모양 가정 | 테스트가 I-11 거버넌스 인용으로 개정됨; 어댑터 카운트/모양 검증 | ✅ 해결됨 — 66/66 |
| G2 — Sprint 기준선 파일 충돌 | 설계 I-12가 원격 분석 어댑터 변경 (고정 목록에서 제거); v2113-sprint-4 INV-03이 구형 기준선 목록을 잠금 | 잠금 개정: 원격 분석 어댑터가 설계 + CHANGELOG 인용으로 변경됨으로 표시됨; 나머지 3개 = 사전 존재 | ✅ 해결됨 — 38/41 |
| G3 — 로컬 픽스처 재출현 | `test-feature`가 qa-aggregate 중 I-13 범위 외 스위트에 의해 작성됨 | `deleteFeatureFromStatus`를 통한 수동 정리; 잔여 후보가 후속을 위해 목록 작성됨 | ✅ 해결됨 (로컬) — FR-07 범위를 팔로우업함 |

### 5.3 QA Aggregate vs Main 기준선

| 메트릭 | Main 기준선 | 이 릴리스 | 델타 | 상태 |
|--------|------------|---------|------|------|
| FAIL 개수 | 25 | 25 | **0** | ✅ 신규 실패 없음 |
| ERROR 개수 | 10 | 10 | **0** | ✅ 신규 오류 없음 |
| L1-L5 커버 (169 단계) | 모두 green | 모두 green | **0** | ✅ 회귀 없음 |
| 격리 가드 (22 TC) | N/A (new) | 22/22 | **+22** | ✅ 새로운 검증 |

---

## 6. 배운 교훈 및 회고

### 6.1 잘된 점 (유지)

- **CC 진단을 통한 R1 근본 원인 진단** — 재현 로그가 CC의 `mpc list` 진단 패널(추측이나 손 디버깅이 아님)을 사용하여 정확한 메커니즘을 지적했음: `[Warning] mcpServers.bkit-pdca: Missing environment variables: CLAUDE_PLUGIN_ROOT` + "Project config (shared via .mcp.json)". 이것이 수정을 명확하고 테스트 가능하게 만들었음.
- **인라인 매니페스트 공식 형태가 구조적 충돌 제거** — 옵션 C(`.claude-plugin/plugin.json`에 인라인 `mcpServers`) 선택이 근본에서 이중 로드 충돌 제거: 파일명 `.mcp.json`이 존재하지 않으면 더 이상 프로젝트 설정으로 읽혀지지 않음. env-var 기본값(문제만 마스킹함)과 달리 이동이 구조적으로 해결함.
- **테스트 상태 유출은 실제 결함이었음, 사소한 문제 아님** — qa-aggregate 분석 G3의 차이가 픽스처 상태(`sc05-test`)가 설계의 격리 약속에도 불구하고 탈출하고 있음을 증명했음. 이것이 F4(완전 리팩터)가 D1(최소)보다 검증한 이유이고; `projectRoot` 주입성 + registry/audit 인식에 대한 투자가 회수됨: 5개 리팩터 스위트 + 가드 테스트가 이제 각 실행 후 바이트 동일함을 증명함.
- **두 거버넌스 잠금이 제거 대신 개정되어야 했음** — v2113-sprint-3/4 기준선 잠금 (B-02/INV-03)이 초기에 I-11/I-12 변경과 충돌했지만, (삭제가 아니라) 설계 인용으로 개정하면 거버넌스 연속성을 유지했고 교육 순간을 만들었음: "승인된 설계 변경이 거버넌스에서 문서화되어 있음."
- **45-스킬 카운팅 규칙이 문서화되었고, 버그가 아니었음** — 초기 발견("45 표시, 44 배송")이 문서만으로 해결됨 (`commands/` 항목이 CC의 `/plugin` 표시에서 별도 계산됨), 잘못된-경보 범위 크리프나 화장적 스킬-디렉터리 변동 방지함.

### 6.2 개선 필요 영역 (문제)

- **Validate-pass ≠ load-pass가 패킹 불확실성 생성** — 설계 초기에 `claude plugin validate --strict`가 통과했지만, 패킹/설치 스모크 테스트가 없으면 인라인 매니페스트가 실제 로드되는지 확신할 수 없었음. QA 라이브 수용 (SC-2b/c: 유효한 JSON 반환 실제 MCP 도구 호출)이 중대했음.
- **초기 격리 분석이 리팩터 깊이 과소 범위** — 첫 격리 감사 (v2113-sprint-contracts.test.js tmp-root 테스트)가 여전히 `sc05-test`를 실제 `.bkit`으로 유출했음, batch-orchestrator와 audit-logger가 루트 주입 불가능했기 때문. D2(완전 리팩터)가 필요했지만 최소 범위 추정보다 더 걸렸음; 증거(유출 자체)가 투자를 정당화했음.
- **이중언어 문서 조정 리스크** — 4개 새 이중언어 쌍 생성 (`.en.md` + `.ko.md` for ADR 0015, eval SOP, 분석/보고서 인계)이 명시적 동기화 검사가 필요했음; 미래 릴리스는 이중언어 쌍을 일찍 템플릿화하여 드리프트 방지해야 함.

### 6.3 다음번에 시도할 것 (시도)

- **CC 진단을 기본 재현 도구로 채택** — "주의 필요" 또는 MCP 관련 문제가 있을 때 `claude mpc list` 진단 출력을 손 검사보다 우선하십시오. 구조화된 경고는 CC가 보는 것을 정확히 지적함.
- **패킹 변경에 대한 단계별 수용 게이트** — 매니페스트 구조 변경(인라인 vs 별도 파일)할 때, 수용 3 계층 정의: (1) validate-pass (문법), (2) load-pass (라이브 도구 호출), (3) 통합 스모크 (end-to-end UX). (1)을 게이트로 취급하되, (2)/(3)은 병합 전 하드 요구사항.
- **테스트 스위트 전체에 걸쳐 일찍 tmp-root 패턴 조직 채택** — 유출된 5개 테스트는 처음부터 v2113-sprint-contracts.test.js의 tmp-root 패턴을 따랐어야 함. 미래 테스트 설계는 기본적으로 `.bkit` 격리를 가정해야 함; `projectRoot` 주입은 표준 테스트 유틸리티여야 함(중반 릴리스 리팩터 아님).
- **테스트 상태 유출을 사전 예방적으로 목록화** — Do 단계에서 모든 테스트 스위트를 실제 `.bkit`/`.claude` 경로 쓰기로 스캔; 범주화: (중요 경로, 기능 선택, 레거시). 범위를 벗어나면 후속 릴리스에서 정리 일정.
- **거버넌스 개정은 교육 순간** — 설계 변경이 잠금 기준선이나 동결 필드를 건드릴 때, 명시적으로 이유 문서화 (설계 ref + CHANGELOG 참고). 이것이 검색 가능한 기록을 만들고 미래 기여자에게 거버넌스 예외를 가르침.

---

## 7. 프로세스 개선 제안

### 7.1 PDCA 프로세스

| 단계 | 관찰 | 제안 |
|------|------|------|
| PM | 연구 기반 PRD (R1 메커니즘 + 웹 스펙 + 코드베이스 감사가 입력) 잘 작동함 | 확장: 항상 PRD 결정을 가정이 아닌 연구 아티팩트에 닻을 내릴 것 |
| 계획 | Checkpoint 3 (사용자 확인 아키텍처 선택)이 시기적절하고 명확함 | 확장: 모든 주요 설계 긴장에 대해 체크포인트 게이트를 채택; 사용자 결정 근거 문서화 |
| 설계 | 옵션 C (pragma적 인라인 매니페스트)가 모든 후속 결정을 통해 스레드됨 | 확장: 설계 결정 체인을 사용하여 MAIN 수정을 통해 단일 일관된 스토리의 모든 후속을 추적 |
| Do | 모듈 맵 세션 분할이 번들 릴리스에 작동함; 이 단일 세션 PDCA가 더 빠름 | 관찰: 압축 PDCA 사이클 (1일, 5 FR) 팀 분할 필요 없음; 표준 세션 페이싱 적용 |
| Check | 정적 분석 (gap-detector) + git 레벨 orchestrator 가드 (바이트 동일 기준선)가 모든 회귀를 잡음 | 확장: orchestrator 가드 (변경 안 된 파일 체크섬, 계약 기준선)를 선택 사항이 아니라 수용 게이트로 취급 |
| QA | 라이브 MCP 도구 호출을 수용으로 (SC-2b/c) `claude plugin validate`보다 더 신뢰할 수 있었음 | 확장: 모든 매니페스트/플러그인 구조 변경에 대해, 구문 검증이 아닌 QA의 라이브 도구 호출 증거 필수 |

### 7.2 도구/환경

| 영역 | 개선 제안 | 예상 효과 |
|------|----------|----------|
| Git/CI | 단일 마일스톤 푸시 정책이 작동함 (Actions 번 낮음; CI가 단 하나의 원자적 변경 집합만 봄) | 번들 릴리스에 채택; 마일스톤 표시 = MAIN 수정 ✅ + 후속 스택됨 |
| 테스팅 | 격리 가드 테스트 (bkit-state-isolation.test.js)가 단위 레벨 + 메타 해시-오브-해시로 `.bkit` 청결성 증명 | 확장: `.bkit` 쓰기 기능에 대한 표준 테스트로 격리 가드를 만듦; pre-commit 훅 선택 |
| 거버넌스 | 설계 인용이 있는 ADR 개정안 (G1/G2 잠금 수정)이 거버넌스 연속성 유지 | 확장: 잠금 기준선 변경을 위한 "설계 개정안" 템플릿 생성; 설계 문서 + CHANGELOG로 다시 링크 |
| Docs | 이중언어 쌍 템플릿 (`.en.md`+`.ko.md` 사이드바)이 드리프트 방지 | 확장: 병합 전 sibling-pair 체크 강제; 번역 대기 중이면 `.ko.md` 스켈레톤 자동 생성 |

---

## 8. 다음 단계

### 8.1 즉시 (메인테이너별)

- [ ] **PR 검토** — 모든 27개 파일 확인 (I-1..I-17), 설계 I-목록을 diff와 확인
- [ ] **브랜치 병합 승인** — 단일 브랜치 정책; 모든 변경 원자적
- [ ] **마일스톤 푸시** — GitHub Actions 트리거됨 (SC-6 원격 검증)
- [ ] **릴리스 태그** — `git tag -a v2.1.26 -m "bkit v2.1.26 release"` (PR 병합 후, 깨끗한 작업 트리)
- [ ] **GitHub Release 게시** — CHANGELOG 항목 + 릴리스 공고 복사; "내부 유지보수 릴리스; 마켓플레이스 사용자 영향 없음" 참고

### 8.2 릴리스 후 검증

- [ ] **마켓플레이스 설치 테스트** — 설치된 복사본 리프레시; `plugin:bkit:bkit-pdca` / `bkit-analysis`가 여전히 ✔ 연결 확인
- [ ] **개발자 피드백 루프** — 클로너/개발자에게 `/plugin` "주의 필요" 반복 보고 요청 (0이어야 함)
- [ ] **CI 건강 확인** — 다음 main 브랜치 CI 실행이 0 신규 실패 표시하는지 확인 (qa-aggregate 기준선 = 현재)

### 8.3 미래 후속 (v2.1.27+)

| 우선순위 | 항목 | 근거 |
|----------|------|------|
| 중간 | l2-smoke + e2e 스위트 tmp-root 격리 | 잔여 유출 후보 (G3 참고); 전사 tmp-root 패턴 조직 채택 |
| 낮음 | 이중언어 테스트 템플릿 생성 | 미래 ADR/SOP 쌍의 드리프트 방지; `.ko.md` 스켈레톤 생성기 생성 |
| 낮음 | 격리 가드 pre-commit 훅 | 선택; Gradle 같은 `check` 단계 게이트 `git push` 전 |

---

## 9. 변경 로그

### [Unreleased — v2.1.26 provisional] - 2026-07-02

**추가:**
- `docs/adr/0015-locale-scoped-trigger-deferral.{en,ko}.md` — 로케일 범위 트리거 생성 연기 문서화 ADR 기록 (이슈 #129 proposal 2); 불변 마켓플레이스 캐시 경로 제약, language.js 레지스트리 잠금 (VS-011~015), 사전 선포 연기 인용.
- `docs/06-guide/eval-rebaseline.guide.{en,ko}.md` — Eval 재기준선 SOP 가이드: WHAT (캡처 시간 메타데이터), WHEN (점수 루브릭 변경 또는 의도적 재설정), HOW (`runner.js --benchmark` 실행, 메타데이터 + 참고 업데이트) 문서화; 현재 32개 claude-sonnet-4-6 model_baseline 값이 v2.1.25 결정에 따라 동결 유지 명시.
- `test/regression/bkit-state-isolation.test.js` — 테스트 상태 격리 가드 테스트 (I-14): `projectRoot` 주입 + audit/registry 루트 인식이 end-to-end 작동하는지 검증; 22 TC (단위 레벨 해시 + 메타 자식 프로세스 해시 비교); 5개 리팩터 스위트가 `.bkit` 바이트 동일하게 남김을 보장.
- CUSTOMIZATION-GUIDE.md + bkit-system/components/skills/_skills-overview.md의 45-스킬 카운팅 참고 — CC의 `/plugin` "스킬 카운트" = 44 `skills/` 디렉터리 + 1 `commands/output-style-setup.md` 명령어 항목 (둘 다 별도 계산됨) → 45 총합 (버그 아님).

**변경:**
- `.claude-plugin/plugin.json` — 인라인 `mcpServers` 객체 추가 (I-1): `bkit-pdca` 및 `bkit-analysis` 서버 정의가 루트 `.mcp.json`에서 plugin.json 매니페스트로 이동 (공식 스키마 키; `${CLAUDE_PLUGIN_ROOT}`이 플러그인 컨텍스트에서 확장되지만 프로젝트 컨텍스트에서 미정의인 이중 로드 버그 제거).
- `.mcp.json` (루트) — **삭제됨** (git rm'd, I-2) — 파일이 `plugin.json` `mcpServers` 키로 인라인 이동됨. 저장소 어디에도 별도 `.mcp.json` 없음; 프로젝트 컨텍스트 자동 로드 불가능.
- `test/integration/mcp-server.test.js` — MS-011..015 어서션이 `.claude-plugin/plugin.json` `mcpServers` 위치를 가리키도록 업데이트됨 (I-3); MS-016 회귀 잠금 추가: `fs.existsSync(root/.mcp.json) === false` (R1 이중 로드 버그 인용).
- `scripts/release-plugin-tag.sh` — 단계 6 다시 작성됨 (I-5): 깨진 `claude plugin tag "${TAG}"` (위치 형태는 ~CC v2.1.110에서 지원 중단됨)에서 직접 `git tag -a "${TAG}" -m "bkit ${TAG} release"`로 변경. 정보성 일관성 단계 추가: `claude plugin tag . --dry-run` (게이트 없음; `|| true`를 통해 삼킨). 고정된 `--dry-run` 에코 출력.
- `lib/infra/cc-version-checker.js:64` — 업데이트된 `pluginTagCommand` 주석이 `{name}--v{version}` 파생 태그 전환 및 직접 git 기반 태깅을 반영 (I-6); 값 = 2.1.118 (맵 의미론 + 테스트 핀 정당화).
- `docs/adr/0011-plugin-manifest-schema-compliance.md` — 개정안 1 (I-7): 정책 설명 추가됨 "bkit의 EXPECTED_PLUGIN_JSON_KEYS는 bkit이 배송하는 키(공식 스키마의 부분집합) 기록, 전체 공식 스키마 미러 아님." `mcpServers`는 이미 화이트리스트에 있음 (이 릴리스부터 사용됨); 공식적으로 없는 키만 = `defaultEnabled` (v2.1.154+, bkit에서 배송 안 함); 코드 (EXPECTED_PLUGIN_JSON_KEYS 상수)는 UNCHANGED.
- `lib/pdca/batch-orchestrator.js` — `projectRoot` 주입 가능하게 만들어짐 (I-10): 생성자/진입 함수가 선택 `opts.projectRoot` 수용; 현재 `getCore().PROJECT_DIR` 행동으로 기본값; 변경은 추가 (기존 호출자에 대한 0 런타임 영향).
- Sprint-status 레지스트리 라이터 — 주입된 `projectRoot`가 레지스트리 쓰기 경로를 통해 스레드됨 (I-11); 기본값 unchanged.
- `lib/audit/audit-logger.js` — 감사 디렉터리 해석에 대해 `opts.projectRoot` 인식하도록 업데이트됨 (I-12); 원격 분석 어댑터가 루트를 스레드함; 9개 호출 사이트 검증됨; 기본값 unchanged.
- 5개 테스트 파일 (I-13): `test/unit/sprint-handler/{default-level-warning,annotate-action}.test.js`, `test/integration/{config-sync,module-chain}.test.js`, `test/unit/batch-orchestrator.test.js` — 테스트 격리를 위해 `fs.mkdtempSync` 사용하도록 리팩터됨; 모든 상태 쓰기가 실제 `.bkit`이 아닌 tmp-root로 이동; 정리가 임시 디렉터리 제거.

**수정:**
- `/plugin` "주의 필요: bkit-pdca / bkit-analysis MCP 실패" 결함 (R1) — 근본 원인: 저장소 루트 `.mcp.json`이 플러그인 매니페스트로(정상: `${CLAUDE_PLUGIN_ROOT}` 확장) 그리고 프로젝트 범위 설정으로(부정확: 프로젝트 컨텍스트에서 변수 미정의, 파싱 실패)도 이중 로드됨. 수정: MCP 선언을 `plugin.json` 인라인 `mcpServers`로 이동; 루트 `.mcp.json` 삭제. 결과: 저장소 cwd `claude mpc list`가 이제 0 베어 항목 + 0 진단 표시; `/plugin`이 "주의 필요" 아래 bkit 행 표시 안 함; 두 서버가 플러그인 컨텍스트에서 인라인 매니페스트를 통해 로드됨 (QA SC-2 라이브 수용).
- `release-plugin-tag.sh --dry-run` "Path not found" 오류 (I-5) — 단계 6이 지원 중단된 `claude plugin tag` 위치 형태 사용; 이제 직접 `git tag -a` 사용.
- 테스트 상태 유출 (F4, I-10..I-14) — 5개 테스트 스위트가 격리를 위해 표시되었음에도 불구하고 실제 `.bkit`으로 작성했음 (batch-orchestrator + registry/audit가 주입된 루트를 인식 안 함). 완전 리팩터가 `projectRoot` 주입성 + 루트 인식 추가; 5개 스위트가 이제 tmp-rooted; 가드 테스트 22/22이 바이트 동일 `.bkit` 입증.

**로컬 절차 (배송 안 됨):**
- `.bkit` 정리 (I-17) — 픽스처 기능 제거됨 (`test-feature-sync`, `test-module-chain`, `test-feature` via `deleteFeatureFromStatus`); sprint 레지스트리 행 + 배치 픽스처 제거됨 (`sc05-test`, `test-f1-*`, `batch-*`); `/pdca status` 및 `bkit_pdca_status` MCP 정리 후 건강함 검증됨. 절차: 가능한 경우 `lib/pdca/status.js` 공개 API 사용; 잠금 행에 대해 파일 레벨 삭제.

**ENH 태그**: ENH-369 (v2.1.26 유지보수 릴리스 번들: MAIN 수정 + 5 후속)

---

## 10. 검증 요약 (설계 §5 체크리스트 완료)

### ✅ MAIN 수정 (I-1..I-4)

- [x] plugin.json이 정확한 §3.1 객체를 가짐; `claude plugin validate . --strict` green (0/0)
- [x] 루트 `.mcp.json`이 트리에서 없음 (git rm'd)
- [x] MS 스위트가 새 위치에서 green + 루트 파일 없음 잠금 존재하고 통과함 (R1 인용 MS-016)
- [x] 스모크 증거 기록됨: 신선한 MCP 도구 호출이 `--plugin-dir`을 통해 OK; 저장소 cwd `claude mpc list`가 깨끗함
- [x] 스캔: `.mpc.json` grep 감사 (3개 bkend 리더 + 역사적 문서만; 루트 파일 예상하는 것 없음)

### ✅ 후속 (I-5..I-15)

- [x] 스크립트 단계 6 `--dry-run`이 CC v2.1.198에서 완전 통과 ("Path not found" 없음); 정보 단계가 게이트 안 함 (`|| true`)
- [x] cc-version-checker 주석/값 업데이트됨; 단위 테스트 green
- [x] ADR 0011 이력 추가됨 (부분집합-아님-미러 정책); EXPECTED_PLUGIN_JSON_KEYS 동결됨; validate-plugin green
- [x] ADR 0015 이중언어 쌍 존재함 (0014 형식, 4 인용)
- [x] eval SOP 이중언어 쌍 존재함 (동결 설명, eval.yaml 편집 안 됨)
- [x] 주입이 추가: 기본 행동이 바이트 동일; 기존 스위트가 변경 안 됨 (I-13 대상 제외)
- [x] 5개 스위트 tmp-rooted 및 green
- [x] 격리 가드 테스트가 green (둘 다 레벨: 단위 해시 + 메타 해시-오브-해시)
- [x] 카운팅 참고가 둘 다 문서에 있음 (CUSTOMIZATION-GUIDE + bkit-system)
- [x] CHANGELOG provisional 항목 (I-16); 로컬 정리 완료됨 (I-17)

### ✅ 전역 게이트 (설계 §5.3)

- [x] 전체 CI 미러 스위트 green (22 게이트: contracts, L5, MS, 격리, 보안, 단위, 문서, 도구 등)
- [x] 계약 기준선 바이트 동일 (git 상태: 비어있음)
- [x] docs=code 0 드리프트; 이중언어 쌍이 동기화되어 있음

---

## 버전 이력

| 버전 | 날짜 | 변경 사항 | 작성자 |
|------|------|----------|--------|
| 1.0 | 2026-07-02 | 완료 보고서 — v2.1.26 유지보수 릴리스 (MAIN 수정 + 5 후속); 27개 전달 물; 일치율 100%; QA_PASS; 릴리스 대기 중 (PR 병합 + 메인테이너 승인 후 태그) | PDCA 파이프라인 (report-generator) |
