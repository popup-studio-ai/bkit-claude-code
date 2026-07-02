---
template: pm-prd
version: 1.0
description: PM PRD 단계 문서 — bkit v2.1.26 v2126-issue-response용 Context Anchor + 8-섹션 PRD
variables:
  - feature: v2126-issue-response
  - date: 2026-07-02
  - author: kay kim (bkit 메인테이너)
  - targetRelease: v2.1.25 → v2.1.26
---

# v2126-issue-response PRD

> **기능**: `v2126-issue-response`
> **단계**: PM / PRD (Plan 이전)
> **날짜**: 2026-07-02
> **작성자**: kay kim (bkit 메인테이너)
> **대상 릴리스**: v2.1.25 → v2.1.26
> **규모**: 내부 개발자 도구 유지보수 릴리스 (bkit 플러그인). 소비자 GTM이 없으므로 PM 프레임워크는 의도적으로 축소함.
> **리서치 근거**: `.bkit/research/v2126-reproduction-log.md` (R1 근본 원인, CC v2.1.198에서 재현), `.bkit/research/v2126-web-research.md` (공식 CC 플러그인/MCP 스펙 + 순위화된 수정안), `.bkit/research/v2126-codebase-audit.md` (변경 표면 + 공수). 본 PRD는 종합(synthesis)만 수행하며, 세 리서치 파일이 권위 있는 출처이고 여기서 재도출하지 않음.

---

## 0. Context Anchor (보존 — 모든 하위 단계로 복사)

| 키 | 값 |
|-----|-------|
| **WHY** | bkit의 repo-root `.mcp.json`이 **이중 로드**된다: 플러그인 MCP 매니페스트로서 올바르게(`${CLAUDE_PLUGIN_ROOT}`가 확장됨), 그리고 bkit 체크아웃이 cwd일 때 project-scope 공유 설정으로서 잘못. project 컨텍스트에서는 `CLAUDE_PLUGIN_ROOT`이 정의되지 않아 bare `bkit-pdca`/`bkit-analysis` 항목이 명령 경로를 해석하지 못함 → `/plugin`에 **"Needs attention: bkit-analysis / bkit-pdca MCP ✗ failed"** 가 품질 중심 플러그인에 표시됨. 이 MAIN 이슈와 함께 누적된 유지보수 부채가 있다: 릴리스 도구 드리프트(`release-plugin-tag.sh` step 6이 깨진 `claude plugin tag` 호출 사용), 거버넌스 부채(ADR 0011의 21-키 whitelist가 현재 공식 스키마 대비 오래됨), ADR로 기록해야 할 로케일 스코핑 연기 결정(0015), 미기준화된 eval SOP, 그리고 테스트 위생 — 바로 이 세션의 Stop hook이 fixture 스프린트 `sc05-test`가 실제 `.bkit` 상태로 누출됨을 드러냄. |
| **WHO** | (1) **bkit 개발자** — repo cwd에서 매 세션마다 `/plugin` "Needs attention" 패널을 마주함; F4 guard가 상태 무결성을 보호하는 대상이기도 함. (2) **클로너 / cwd에 플러그인 체크아웃이 포함된 사람** — bare 항목이 `⏸ Pending approval` → `✗ failed` 상태로 남음(v2.1.196에서 untrusted workspace의 self-approval 무시). (3) **마켓플레이스 사용자** — `plugin:bkit:*`는 ✔ Connected 유지; MAIN 버그의 영향 없음. 다만 강화된 repo-as-project 경험과 깨끗한 릴리스 도구의 혜택을 받음. 이해관계자 / 의사결정자: kay kim (bkit 메인테이너). |
| **RISK** | (a) **validate-pass ≠ load-pass** — `claude plugin validate`는 `mcpServers` 키를 받아들이고 참조 파일 존재 여부를 검사하지 않음; 오직 수동 packed-plugin smoke(`/plugin` + `claude mcp list`)만이 수정이 로드됨을 증명. (b) MS-011~015가 root `.mcp.json`을 가정함 — 다른 테스트/문서도 같은 경로 가정을 가질 수 있음. (c) 태그 규칙 드리프트 — `{name}--v{version}`을 기존 `vX.Y.Z` 태그와 병행 채택 시 병렬 포맷 혼란 위험 + 태그 연속성/gh-release/push 지침을 깨뜨림. (d) F4 테스트 격리는 5개 파일보다 깊다: `batch-orchestrator.js:64-66`이 PROJECT_DIR을 하드코딩하고, sprint-status registry writer + audit-logger가 주입된 `projectRoot`를 완전히 존중하지 않음(증거: tmp-root 테스트도 여전히 `sc05-test` 누출). |
| **SUCCESS** | repo에서 새로 `claude mcp list`를 실행하면 bare `bkit-pdca`/`bkit-analysis` 항목이 **ZERO**이고 MCP config 진단 경고가 **zero**; `/plugin` "Needs attention" 해소; 설치된 `plugin:bkit:*` 서버는 ✔ Connected 유지; 릴리스 스크립트 `--dry-run`이 end-to-end로 green; qa-aggregate에 새 실패 없음; 5개 수정된 테스트를 실행해도 `.bkit`가 **byte-identical** 유지. docs = code, zero drift; 메인테이너 승인 전까지 **버전 bump 없음**; single-branch, minimal-push 전달. |
| **SCOPE** | **In**: 플러그인 MCP 선언을 root `.mcp.json` 파일명 밖으로 재배치(plugin.json 내 inline 또는 이름 변경된 별도 파일 — Design이 선택); regression lock(root `.mcp.json` 없음 + MS 테스트 갱신 + packed smoke); `release-plugin-tag.sh` step 6 수정 + `cc-version-checker.js` pluginTagCommand 갱신; ADR 0011 whitelist를 현재 스키마와 조정; ADR 0015 작성(로케일 스코핑 연기, 이중언어); eval 재기준화 SOP 가이드 작성(이중언어, 32개 frozen 필드 미변경); 테스트 격리 guard(batch-orchestrator `projectRoot` 주입성 + registry/audit root 존중 + 5개 테스트 파일 → tmp-root); 로컬 `.bkit` 정리(비배포, 문서화된 절차); 45-vs-44 스킬 카운팅 명확화; 릴리스 advisory + CHANGELOG. **Out**: 서버 부트스트랩 재작성; 상대 `./servers/...` args 채택(거부 — 설치를 깨뜨림); `${CLAUDE_PLUGIN_ROOT:-…}` default 해킹(거부 — 파싱 에러만 억제하고 서버는 여전히 실패); 32개 frozen eval 필드 편집; 프로젝트 버전 bump(메인테이너 결정); 마켓플레이스 대상 동작 변경. |

---

## 1. Executive Summary

| 관점 | 요약 |
|-------------|---------|
| **문제** | bkit의 repo-root `.mcp.json`이 플러그인 MCP 매니페스트로서 AND project-scope 설정으로서 둘 다 로드되고, project 역할에서는 `${CLAUDE_PLUGIN_ROOT}`이 정의되지 않아 `/plugin`이 개발자·클로너에게 "Needs attention: bkit-pdca / bkit-analysis MCP ✗ failed"를 보고함 — 그 전체 가치 제안이 품질인 플러그인에서. 이와 함께 릴리스 도구 드리프트, 오래된 ADR whitelist, 기록 누락 ADR, 미기준화 eval SOP, 테스트 상태 누출이 존재. |
| **해결책** | 하나의 MAIN 수정과 다섯 개 follow-up을 담은 유지보수 릴리스: (MAIN) MCP 선언을 `.mcp.json` 파일명 밖으로 재배치해 plugin 컨텍스트에서만 읽히게 하고, regression 테스트 + 수동 packed smoke로 잠금; (F1) 릴리스 태그 스텝 수정; (F2/F3/F5-as-ADR) 조정된 whitelist·기록 ADR·eval SOP 가이드로 거버넌스 부채 상환; (F4) bkit 개발자 상태 누출을 멈추는 테스트 격리 guard; 그리고 로컬 정리, 스킬 카운트 문서 노트, 릴리스 advisory. |
| **기능 / UX 효과** | 개발자와 클로너가 repo를 열면 깨끗한 `/plugin` 패널과 깨끗한 `claude mcp list`를 봄 — bare 항목 zero, 진단 zero. 마켓플레이스 사용자는 변화 없음(`plugin:bkit:*` connected 유지). 메인테이너는 동작하는 `--dry-run` 릴리스 경로와 더 이상 fixture 오염이 쌓이지 않는 CI를 얻음. |
| **핵심 가치** | 품질 중심 플러그인에 대한 신뢰 회복(우리 도구에 "Needs attention" 없음), 모든 기여자를 위한 repo-as-project 경험 강화, 유지보수/거버넌스 부채 상환 — docs=code, CI-green, no-version-bump 릴리스로 전달. |

---

## 2. 문제 / 기회

### 2.1 현재 상태 vs 원하는 상태

| 영역 | 현재 (v2.1.25) | 원하는 상태 (v2.1.26) |
|------|-------------------|-------------------|
| Repo-root `.mcp.json` | 이중 로드: 플러그인 매니페스트(✔) + project 설정(✗, `CLAUDE_PLUGIN_ROOT` 미정의) → `/plugin` "Needs attention … failed" | MCP 선언을 `.mcp.json` 파일명 밖으로 재배치; plugin 컨텍스트에서만 읽힘; bare project 항목 없음 |
| Regression 보호 | MS-011~015가 root `.mcp.json`을 assert; root `.mcp.json` 금지 없음; args 문자열 / `${CLAUDE_PLUGIN_ROOT}` 미잠금 | MS 테스트를 새 위치로 갱신 + NEW lock "repo root에 `.mcp.json` 없음"; 수동 packed smoke가 수락 테스트 |
| 릴리스 도구 | `release-plugin-tag.sh` step 6이 `claude plugin tag "${TAG}"`(위치 인자 버전) 호출 → "Path not found"; `cc-version-checker.js:64` pluginTagCommand 주석 오래됨 | step 6 → `git tag -a`; 선택적 `claude plugin tag . --dry-run` 정보성 체크; pluginTagCommand 갱신 |
| ADR 0011 whitelist | 21-키 스냅샷; 공식 스키마에 이제 `mcpServers`, `lspServers`, `channels`, `userConfig`, `defaultEnabled`, `displayName`, `dependencies`, … 포함 | 현재 CC 2.1.198 스키마와 조정된 whitelist |
| 로케일 스코핑 결정 | CHANGELOG / 릴리스 노트에서 연기됨; 기록 ADR 없음 | ADR 0015가 로케일 스코핑 연기를 기록(이중언어 쌍) |
| Eval 재기준화 | 32개 frozen 값; SOP 없음; runner가 `model_baseline`을 무의미 메타데이터로 취급 | 이중언어 SOP 가이드 작성; 32개 frozen 필드 미변경 |
| 테스트 상태 위생 | 5개 테스트 파일이 실제 `.bkit`에 씀; `batch-orchestrator.js:64-66` 주입 가능한 root 없음; registry/audit가 주입 root 미존중 → `sc05-test` 등 누출 | 테스트 격리 guard: 5개 파일 tmp-root + `projectRoot` 주입성 + registry/audit 존중 |
| 로컬 `.bkit` 상태 | fixture로 오염(`test-feature-*`, `sc05-test`, batch/*) | 문서화된 일회성 로컬 정리(비배포) |
| 스킬 카운트 | `/plugin`이 "45 skills" 표시; repo는 44개 skill 디렉터리 배포 | 문서화: 45 = 44 디렉터리 + `commands/output-style-setup.md`(+1); 버그 아님 |

### 2.2 기회 프레이밍

- **신뢰 침식이 최우선 신호다.** 품질을 파는 플러그인이 `/plugin`에서 *자신의* MCP 서버를 "✗ failed"로 보여주는 것은, bkit를 가장 면밀히 평가할 청중 — 개발자와 클로너 — 에게 신뢰를 침식한다. MAIN 수정은 스펙 준수이고 저공수(S)이며 CC v2.1.198에서 경험적으로 검증됨.
- **Follow-up들은 복리로 커지는 부채다.** 릴리스 도구 드리프트는 다음 릴리스를 수동·오류 유발로 만들고; 오래된 ADR whitelist는 거버넌스 체크가 거짓말하게 하며; 누락 ADR은 결정 기록을 침식하고; 누출 테스트 상태는 모든 기여자의 `.bkit`를 드리프트시키고 CI에 fixture를 쌓는다. 파일이 이미 열려 있는 이 순간에 MAIN 수정과 묶어 부채를 상환한다.
- **설치 기반은 이미 안전하다 — 이건 제품이 아니라 repo를 강화한다.** `plugin:bkit:*`는 마켓플레이스 사용자에게 관계없이 connected 유지. 이 릴리스는 개발자/기여자 경험과 repo 무결성에 관한 것이며, 그래서 F4 guard(모든 bkit 개발자의 상태 보호)가 최종 사용자에게 보이지 않아도 범위에 포함된다.

---

## 3. 사용자 & 세그먼트

각 집단이 MAIN 이슈와 follow-up을 어떻게 경험하는지로 세분화.

| 세그먼트 | 오늘의 경험 | 이 릴리스 |
|---------|------------------|--------------|
| **S1 — bkit 개발자** (repo cwd) | 매 세션 `/plugin` "Needs attention"; fixture 누출로 로컬 `.bkit` 오염(이번 세션에서 `sc05-test` 관측) | 깨끗한 `/plugin` + 깨끗한 `claude mcp list`; F4 guard가 향후 누출 차단; 문서화된 로컬 정리 |
| **S2 — 클로너 / cwd에 플러그인 체크아웃 포함** | bare `bkit-pdca`/`bkit-analysis`가 `⏸ Pending approval` → `✗ failed`(v2.1.196 untrusted self-approval 무시) | bare 항목이 아예 생성되지 않음 — 파일이 더 이상 project 설정으로 읽히지 않음 |
| **S3 — 마켓플레이스 사용자** (일반 project cwd) | 영향 없음 — 그들의 프로젝트엔 그런 `.mcp.json` 없음; `plugin:bkit:*` ✔ Connected | 변화 없음; NFR-1이 `plugin:bkit:*` connected 유지 보장 |
| **S4 — 메인테이너 (릴리스/CI)** | `release-plugin-tag.sh` step 6 실패; ADR 체크 오래됨; CI에 fixture 축적 | 동작하는 `--dry-run` 경로; 조정된 ADR whitelist; CI 위생 복원 |

---

## 4. 가치 제안 (Value Proposition)

**대상(For)** 플러그인 저장소 내부에서 작업하는 bkit 개발자, 클로너, 메인테이너
**즉(who)** 자신의 품질 중심 플러그인이 "Needs attention"으로 표시되고 드리프트하는 릴리스 도구와 누출되는 테스트 상태와 씨름하는 사람들에게,
**이(the)** v2126-issue-response 릴리스는 **유지보수 / 강화 릴리스**로서
**(that)** MCP 선언을 plugin 컨텍스트에서만 읽히도록 재배치하고, regression 테스트 + packed smoke로 수정을 잠그며, 동일 changeset에서 릴리스 도구·거버넌스·테스트 위생 부채를 상환한다,
**(unlike)** 이중 로드되는 `.mcp.json`을 그대로 두는 것(신뢰를 계속 침식하고 부채를 쌓음)과 달리,
**우리 릴리스는(our release)** 깨끗한 `/plugin` 경험과 repo 무결성을 회복하며 **동시에** 설치된 마켓플레이스 기반에 대한 **zero regression을 보장**(`plugin:bkit:*` connected 유지)하고 메인테이너 승인 전까지 버전 bump를 요구하지 않는다.

| VP 구성요소 | bkit 특화 내용 |
|--------------|-----------------------|
| Gain creators | 깨끗한 `/plugin` + `claude mcp list`; 동작하는 `--dry-run` 릴리스 경로; 진실한 거버넌스 체크; 테스트 후 byte-identical `.bkit`; 문서화된 eval SOP와 로케일 연기 ADR |
| Pain relievers | 우리 플러그인에 "Needs attention" 없음; 수동 태그 우회 없음; CI/로컬 상태의 fixture 오염 없음; 오래된 whitelist의 거짓 확신 없음 |
| Products/services | 재배치된 MCP 매니페스트, regression lock + packed smoke, 수정된 릴리스 스크립트, 조정된 ADR 0011, 신규 ADR 0015, eval SOP 가이드, 테스트 격리 guard, 로컬 정리 절차, 스킬 카운트 문서 노트, 릴리스 advisory |

---

## 5. 요구사항

> FR = 기능적(릴리스가 반드시 전달해야 하는 것). NFR = 비기능적(품질 기준). FR-1 / FR-9(및 태그 정보성 스텝, F4 깊이) 내부의 최종 *선택*은 §6에서 프레이밍하고 Design에서 확정; FR은 릴리스가 이를 해결하도록 명령한다.

### 5.1 기능 요구사항 (Functional Requirements)

| ID | 요구사항 | 주요 표면 (audit 기준) |
|----|-------------|------------------------------|
| **FR-1** | **MCP 매니페스트 재배치.** 플러그인 MCP 선언을 root `.mcp.json` 파일명 밖으로 재배치해 plugin 컨텍스트에서만 읽히게 함; Design이 **plugin.json 내 inline `mcpServers` 객체** vs **`"mcpServers": "./<renamed>.json"` 별도 파일**을 결정(§6-a 참조). 둘 다 CC v2.1.198에서 스펙 준수이며 `${CLAUDE_PLUGIN_ROOT}` 확장을 보존. | `.mcp.json`(root에서 삭제), `.claude-plugin/plugin.json`(`mcpServers` 키 — 이미 whitelist됨) |
| **FR-2** | **Regression lock.** MS-011~015를 새 위치를 assert하도록 갱신 AND repo root에 `.mcp.json`이 **없음**을 assert하는 NEW lock 추가; 수동 packed-plugin smoke(`/plugin` + `claude mcp list`에서 bare 항목 zero)가 수락 테스트(validate-pass ≠ load-pass). | `test/integration/mcp-server.test.js:110-147` + 신규 assertion; packed smoke SOP |
| **FR-3** | **릴리스 도구 수정.** `release-plugin-tag.sh` step 6을 `git tag -a "${TAG}" -m "bkit ${TAG} release"`로 변경; dry-run echo 수정; `cc-version-checker.js:64` `pluginTagCommand` 값/주석 갱신. `{name}--v{version}` 태그 포맷은 채택하지 않음(태그 연속성 깨짐). | `scripts/release-plugin-tag.sh:122-136`, `lib/infra/cc-version-checker.js:64` |
| **FR-4** | **ADR 0011 whitelist 조정.** 21-키 whitelist를 현재 CC 2.1.198 공식 plugin.json 스키마와 조정(해당 시 `mcpServers`, `lspServers`, `channels`, `userConfig`, `defaultEnabled`, `displayName`, `dependencies`, `$schema`, `experimental.*`, `outputStyles` 추가). | ADR 0011 + `EXPECTED_PLUGIN_JSON_KEYS`를 읽는 invariant |
| **FR-5** | **ADR 0015 (로케일 스코핑 연기).** 로케일 스코핑 연기를 문서화하는 신규 이중언어 기록 ADR 작성(issue #129 proposal 1 인용; 채택된 proposal 2; 불변 버전 캐시 경로 논거; 사전 공지된 연기). | `docs/adr/0015-*.en.md` + `docs/adr/0015-*.ko.md` |
| **FR-6** | **Eval 재기준화 SOP 가이드.** eval 재기준화용 이중언어 SOP 가이드 작성; 32개 frozen `model_baseline` 필드는 미변경(기록된 역사적 결정; runner에서 필드가 무의미). | `docs/06-guide/*.en.md` + `*.ko.md` |
| **FR-7** | **테스트 격리 guard.** `batch-orchestrator.js`가 주입 가능한 `projectRoot`를 받도록; sprint-status registry writer + audit-logger가 주입된 root를 존중하도록; 5개 누출 테스트 파일을 tmp-root로 리다이렉트. 깊이(최소 vs 완전 projectRoot 존중 리팩터)는 §6-d에서 프레이밍. | `lib/pdca/batch-orchestrator.js:64-66`, audit/registry root 해석, 5개 테스트 파일 |
| **FR-8** | **로컬 `.bkit` 정리.** 오염된 fixture 상태(`test-feature-*`, `sc05-test`, `batch/*`)를 안전 제거 API로 일회성 로컬 정리; 절차 문서화. 비배포(`.bkit/`는 gitignore). | 로컬 `.bkit/state/*`(비추적); 문서화된 절차 |
| **FR-9** | **45-스킬 카운팅 명확화.** `/plugin` "45 skills" = 44 skill 디렉터리 + `commands/output-style-setup.md`(+1) — 버그 아님을 설명하는 문서 노트 추가. Design이 대신 `skills/output-style-setup` twin을 제안할 수 있음(§6-b 참조). | 문서 노트(및/또는 선택적 skills twin) |
| **FR-10** | **릴리스 advisory / CHANGELOG.** MCP 재배치, 릴리스 태그 수정, ADR 조정, 테스트 격리 guard를 다루는 CHANGELOG 항목 + 릴리스 advisory 게시. 버전 헤딩은 repo 규칙에 따라 provisional/unreleased. | `CHANGELOG.md`, PR 설명 |

### 5.2 비기능 요구사항 (Non-Functional Requirements)

| ID | 요구사항 | 검증 |
|----|-------------|--------------|
| **NFR-1** | **설치된 마켓플레이스 경로 zero regression** — 재배치 후 `plugin:bkit:*` MCP 서버가 ✔ Connected 유지. | 설치된(캐시 경로) 플러그인에서 `claude mcp list`; packed smoke |
| **NFR-2** | **모든 CI 게이트 green** — qa-aggregate에 새 실패 없음; MS 스위트가 새 위치에서 통과; red로 남은 baseline/invariant 없음. | GitHub Actions run green |
| **NFR-3** | **docs = code, zero drift** — ADR 0011 whitelist, 스킬 카운트 노트, `.mcp.json` 위치를 참조하는 모든 문서가 배포 상태와 일치. | 배포 파일 대비 수동 + grep audit |
| **NFR-4** | **메인테이너 승인 전 버전 bump 없음** — `plugin.json` 버전 미변경; CHANGELOG 헤딩 provisional/unreleased. | Diff 리뷰 — version 필드 미변경 |
| **NFR-5** | **Single-branch, minimal-push 전달** — 모든 변경을 한 브랜치에; MCP 재배치 + whitelist + 테스트를 하나의 atomic changeset으로 취급해 CI가 부분 상태를 보지 않게 함. | 브랜치/PR 구조 리뷰 |
| **NFR-6** | **5개 수정 테스트 후 byte-identical `.bkit`** — 실행해도 실제 `.bkit` 상태 미변경. | 테스트 실행 전후 `.bkit/state` 체크섬 |
| **NFR-7** | **이중언어 문서 완비** — 모든 신규 `docs/` 파일(ADR 0015, eval SOP)이 동기화된 `.en.md` + `.ko.md` 형제 쌍으로 배포. | 형제 쌍 존재 + 내용 일치 리뷰 |

---

## 6. Design에서 결정할 핵심 사항

> PRD는 최종 선택을 의도적으로 Design에 남긴다; 각 결정은 프레이밍된 옵션 + 결정의 긴장을 나열.

**(a) MCP 선언 형태 — inline `mcpServers` 객체 vs 이름 변경된 별도 파일.**
- 옵션 A1 (리서치 rank 1, 권장): `.claude-plugin/plugin.json`에 `mcpServers` 객체를 inline; root `.mcp.json` 삭제. 파일 최소; `plugin.json`은 project MCP 설정으로 읽히지 않음; `${CLAUDE_PLUGIN_ROOT}` 여전히 확장.
- 옵션 A2 (리서치 rank 2): `"mcpServers": "./<renamed>.json"`(예: `.claude-plugin/mcp.json` 또는 `servers/mcp.json`) + root `.mcp.json` 삭제. 동일 효과, 전용 파일 유지.
- 결정의 긴장: 단일 진실원 컴팩트함(A1) vs 전용 MCP 파일의 분리/가독성(A2). 둘 다 2.1.198에서 `claude plugin validate` 통과; validate가 참조 파일 존재를 검사하지 않으므로 둘 다 FR-2 존재 검사 필요.

**(b) 45-스킬 — 문서 노트 vs skills twin.**
- 옵션 B1: 문서 노트만(XS) — 45 = 44 + `output-style-setup` 명령 설명.
- 옵션 B2: `skills/output-style-setup` twin 추가해 `skills/` 카운트와 `/plugin` 표시를 수렴(XS, 그러나 실제 skill 디렉터리 추가 + `EXPECTED_COUNTS.skills`를 깨면 안 됨).
- 결정의 긴장: 표면적 수렴(B2) vs 최소 표면 / invariant 변경 없음(B1).

**(c) Plugin tag `--dry-run` 정보성 스텝 — 포함 여부.**
- 옵션 C1: `git tag -a` 이후 `claude plugin tag . --dry-run`을 정보성 일관성 체크로 추가(plugin.json ↔ marketplace 일치 검증; `--dry-run`은 `{name}--v` 태그를 절대 생성하지 않음).
- 옵션 C2: 생략 — step 6 최소 유지.
- 결정의 긴장: 추가 검증 신호(C1) vs 병렬 포맷 혼란 / 스크립트 표면 증가 위험(C2).

**(d) F4 guard 깊이 — 최소 테스트 수정 vs 완전 projectRoot 존중 리팩터.**
- 옵션 D1 (최소): 5개 테스트 파일을 tmp-root로만 리다이렉트.
- 옵션 D2 (완전): D1 + `batch-orchestrator.js`가 주입 가능한 `projectRoot`를 받도록 AND registry writer + audit-logger가 주입 root를 존중하도록(tmp-root 테스트도 `sc05-test`를 실제 `.bkit`에 떨어뜨린 잔여 누출 해결).
- 결정의 긴장: 최소 blast radius(D1) vs 근원에서 실제로 누출 봉쇄(D2). 증거(tmp-root 테스트도 누출)는 D2를 지지; 공수 M.

---

## 7. 리스크 & 완화

| # | 리스크 | 심각도 | 완화 |
|---|------|----------|------------|
| R1 | **validate-pass ≠ load-pass** — `claude plugin validate`는 `mcpServers`를 받아들이고 참조 파일 존재를 검사하지 않음; validate를 통과해도 서버 로드에 실패할 수 있음 | High | FR-2 수동 packed-plugin smoke(`/plugin` + `claude mcp list` = bare 항목 zero, `plugin:bkit:*` connected)가 실제 수락 테스트; bkit 테스트에 존재 검사 유지 |
| R2 | **다른 곳의 MS 테스트 경로 가정** — 다른 테스트/문서가 root `.mcp.json`을 가정해 조용히 깨지거나 옛 경로를 잠글 수 있음 | Med | `.mcp.json` 참조 grep audit(FR-2/NFR-3); MS-011~015 갱신 + no-root-`.mcp.json` lock을 같은 changeset에 추가 |
| R3 | **태그 규칙 병렬 포맷 혼란** — `{name}--v{version}`을 기존 `vX.Y.Z` 태그와 병행 채택 시 연속성·gh-release·push 지침 깨짐 | Med | FR-3은 기존 `vX.Y.Z` 포맷의 `git tag -a` 유지; `{name}--v`는 태그를 생성하지 않는 `--dry-run`으로만(선택적) 사용 |
| R4 | **NFR-1 regression** — 재배치가 설치된 마켓플레이스 경로를 실수로 깨뜨림 | High | 재배치 + whitelist + 테스트를 하나의 atomic changeset으로(NFR-5); packed smoke가 병합 전 `plugin:bkit:*` connected 유지 검증 |
| R5 | **F4 잔여 누출** — tmp-root 수정 후에도 registry/audit가 여전히 실제 `.bkit`에 쓸 수 있음(`sc05-test`로 관측) | Med | §6-d 옵션 D2(projectRoot 존중 리팩터); NFR-6 5개 테스트 전후 byte-identical `.bkit` 체크섬 게이트 |
| R6 | **이중언어 드리프트** — 신규 ADR 0015 / eval SOP가 한 언어로만 배포되거나 EN/KO 간 드리프트 | Low | NFR-7 형제 쌍 + 내용 일치 리뷰(병합 전) |
| R7 | **번들링에서의 스코프 크립** — 한 릴리스의 6개 워크스트림이 부분/깨진 CI 상태 위험 | Med | NFR-5 single-branch minimal-push; MAIN 수정 + regression lock이 우선 atomic 단위로 착지; follow-up은 그 뒤에 순차 배치 |

---

## 8. 성공 기준 & 릴리스 노트 계획

### 8.1 측정 가능한 성공 기준

| SC | 기준 | 측정 |
|----|-----------|---------|
| SC-1 | bare bkit MCP 항목 없음 + 진단 zero | repo cwd에서 새 `claude mcp list`가 bare `bkit-pdca`/`bkit-analysis` 항목 ZERO 및 MCP config 진단 경고 zero |
| SC-2 | `/plugin` "Needs attention" 해소 | `/plugin` → Installed 패널에 bkit MCP 서버 관련 "Needs attention" 없음 |
| SC-3 | 설치된 마켓플레이스 경로 영향 없음 | `plugin:bkit:bkit-pdca`와 `plugin:bkit:bkit-analysis` 여전히 ✔ Connected(packed/설치 smoke) |
| SC-4 | 릴리스 스크립트 end-to-end green | `release-plugin-tag.sh --dry-run`이 수정된 step 6 포함 모든 스텝을 green으로 완료 |
| SC-5 | 새 CI 실패 없음 | qa-aggregate / GitHub Actions가 릴리스 전 baseline 대비 새 실패 없음 |
| SC-6 | 수정 테스트 후 byte-identical `.bkit` | 5개 수정 테스트 실행 후 `.bkit` 상태 byte-identical(전후 체크섬 일치) |
| SC-7 | docs = code, zero drift | ADR 0011 whitelist가 현재 스키마와 일치; ADR 0015 + eval SOP가 EN/KO 쌍으로 존재; 스킬 카운트 노트 존재; version 필드 미변경 |

### 8.2 릴리스 노트 계획 (내부 개발자 도구 유지보수 범위)

- **채널**: CHANGELOG.md 항목 + PR 설명. 외부 마케팅 없음(내부 유지보수 릴리스).
- **Advisory 내용**: MCP 재배치(root `.mcp.json`이 왜 이중 로드됐고 재배치가 어떻게 고치는지); 릴리스 태그 스텝 수정; ADR 0011 조정 + ADR 0015 기록; eval SOP; 테스트 격리 guard. 마켓플레이스 사용자는 영향 없음을 명시.
- **롤아웃**: single-branch, minimal-push; MAIN 수정 + regression lock을 우선 atomic 단위로 해 CI가 부분 상태를 보지 않게 함; 버전 번호는 repo 규칙에 따라 메인테이너에게 남김.
- **릴리스 후 관찰**: 클로너/개발자 "Needs attention" 보고가 재발하지 않는지 확인; 기여자 CI run 전반에서 `.bkit`가 깨끗이 유지되는지 확인; cc-version-analysis 롤링 상태가 스키마/태그 드리프트를 계속 추적.

---

## Attribution

PM 프레임워크 스캐폴딩(Context Anchor, JTBD 스타일 VP, 세그먼테이션)은 [pm-skills](https://github.com/phuryn/pm-skills)(Pawel Huryn, MIT License)의 패턴을 통합하며, 내부 개발자 도구 유지보수 릴리스에 맞게 축소함. 모든 기술적 사실은 헤더에 인용된 세 리서치 파일(`v2126-reproduction-log.md`, `v2126-web-research.md`, `v2126-codebase-audit.md`)에서 출처를 두며; 본 PRD에서 재도출하지 않음.

**다음 단계**: `/pdca plan v2126-issue-response` (이 PRD는 Plan 단계에서 자동 참조됨).
