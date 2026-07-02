# v2126-issue-response 기획 문서

> **요약**: `/plugin`의 "Needs attention: bkit MCP failed" 결함을 근본에서 제거(루트 `.mcp.json` 이중 로드)하고, v2.1.25 후속과제 4건(릴리스 태그 drift, ADR 0015, eval SOP, 테스트 상태 누수 가드)을 종결하며, ADR 0011 매니페스트 화이트리스트를 정합하고, 45-skills 카운팅 규칙을 문서화한다.
>
> **프로젝트**: bkit Vibecoding Kit (bkit-claude-code)
> **버전**: 2.1.26 (잠정 — 최종 버전은 릴리스 시 메인테이너가 확정)
> **작성자**: PDCA 파이프라인 (pm-lead PRD → plan)
> **날짜**: 2026-07-02
> **상태**: Draft
> **PRD**: [v2126-issue-response.prd.ko.md](../../00-pm/v2126-issue-response.prd.ko.md)

---

## Executive Summary

| 관점 | 내용 |
|-------------|---------|
| **문제** | 루트 `.mcp.json`이 Claude Code에 의해 두 번 로드됨 — 플러그인 MCP 매니페스트로서(`${CLAUDE_PLUGIN_ROOT}` 확장, `plugin:bkit:*` ✔)와, bkit 체크아웃이 작업 디렉터리일 때 프로젝트-스코프 공유 설정으로서(변수 미정의 → 파싱 실패 → `/plugin` "Needs attention: bkit-pdca / bkit-analysis MCP ✗ failed"). 부가: 릴리스 태그 스크립트가 시그니처가 바뀐(~v2.1.110) CC 명령 호출, ADR 0011 화이트리스트가 공식 스키마의 신규 키들보다 노후, locale-scoped 트리거 이연(#129)의 약속된 ADR 부재, eval 재베이스라인 SOP 부재, 테스트 5개 파일이 개발자의 실제 `.bkit`에 픽스처 상태 누수(라이브 관측: 이 세션 Stop 훅의 `sc05-test`). |
| **해법** | 플러그인 MCP 선언을 `.mcp.json` 파일명에서 재배치(공식 `mcpServers` 매니페스트 키 — 인라인 vs 별도 파일은 Design에서 결정) + "루트에 .mcp.json 없음" 회귀 잠금 + 패킹 플러그인 스모크를 수용 기준으로; 릴리스 스크립트 태그 단계를 직접 `git tag -a`로 수정; ADR 0011 정합; ADR 0015 + eval 재베이스라인 SOP 작성(이중언어); 테스트 격리 풀 리팩토링(batch-orchestrator `projectRoot` 주입 가능화 + 스프린트 레지스트리/감사 로거의 주입 root 존중 + 테스트 5개 tmp-root화); 45-skills 카운팅 규칙 문서화; 로컬 `.bkit` 정리 절차. |
| **기능/UX 효과** | 개발자와 클로너가 깨끗한 `/plugin` 패널과 `claude mcp list`를 받음(failed/pending bkit 엔트리 0, 진단 경고 0); 마켓플레이스 사용자는 무변경; 메인테이너는 `--dry-run` 검증된 릴리스 경로 확보; CI가 실제 상태에 픽스처 오염을 누적하지 않음. |
| **핵심 가치** | 품질 중심 플러그인의 신뢰 회복, repo-as-project 경험 강화, 거버넌스/테스트 부채 상환 — docs=code, CI-green, 메인테이너 승인 전 버전 무변경. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | "AI 코드를 자신의 스펙과 대조 검증한다"는 약속의 플러그인이 자기 개발자/클로너를 failed MCP 서버로 맞이해서는 안 됨; 릴리스 도구와 거버넌스 기록은 현재 CC 현실과 일치해야 함. |
| **WHO** | bkit 개발자 + 플러그인 체크아웃을 cwd로 여는 모든 사람(MAIN); 메인테이너(릴리스 스크립트); 모든 bkit 개발자(테스트 상태 무결성); ADR/SOP를 읽는 커뮤니티. 마켓플레이스 최종 사용자: 무영향, 무영향을 유지해야 함(NFR-1). |
| **RISK** | `claude plugin validate` 통과가 로더의 재배치 매니페스트 존중을 증명하지 않음(validate-pass ≠ load-pass) → 패킹 플러그인 스모크가 진짜 수용 테스트; 테스트 격리 리팩토링이 공유 lib 경로(batch/audit/registry)를 건드림. |
| **SUCCESS** | 저장소 cwd에서 fresh `claude mcp list`에 bare bkit 엔트리 0 + 진단 0; `/plugin` Needs-attention 클린; 설치본 `plugin:bkit:*` 여전히 ✔; 릴리스 스크립트 `--dry-run` 전 구간 green; 수정된 테스트 5개 실행 후 `.bkit` 바이트 동일; 전체 CI 게이트 green. |
| **SCOPE** | `.mcp.json` 재배치 + plugin.json `mcpServers` · MS-011~015 + 신규 잠금 · release-plugin-tag.sh + cc-version-checker · ADR 0011 갱신 + ADR 0015 신규 + eval SOP 신규(이중언어) · lib/pdca/batch-orchestrator + 스프린트 레지스트리/감사 root 존중 + 테스트 5개 · 문서 노트 + CHANGELOG. |

---

## 1. 개요

### 1.1 목적

v2.1.26을 유지보수 릴리스로 출하: (a) `/plugin` failed-MCP 결함을 구조적 근본에서 제거, (b) v2.1.25가 남긴 후속과제 전건 종결, (c) 새로 발견된 테스트 상태 누수 결함 클래스 수정 — 설치된 마켓플레이스 사용자 무회귀.

### 1.2 배경

- **재현 (R1, `.bkit/research/v2126-reproduction-log.md`)**: CC 진단이 메커니즘을 직접 확인 — "Project config (shared via .mcp.json)"에서 `[Warning] mcpServers.bkit-pdca: Missing environment variables: CLAUDE_PLUGIN_ROOT`. 깨진 경로의 프로젝트 서버를 승인하면 pending → ✗ failed로 전이, 사용자 스크린샷과 일치.
- **공식 스펙 (웹 리서치, CONFIRMED)**: 플러그인은 MCP 서버를 "플러그인 루트의 `.mcp.json` **또는 `plugin.json` 인라인**"으로 선언 가능; 매니페스트 `mcpServers` 키는 `string|array|object` 허용. cwd 루트의 리터럴 파일명 `.mcp.json`만 프로젝트 설정으로 자동 로드 → 재배치가 충돌을 제거. `${VAR:-default}`와 상대경로 대안은 문서화된 사유로 기각(에러만 숨기고 등록됨; 설치 캐시 경로 파손).
- **코드베이스 감사**: 결합 표면 최소 — 파일을 단언하는 테스트는 `test/integration/mcp-server.test.js` MS-011~015뿐; hooks.json은 이중 로드 안 됨(저장소에 `.claude/settings.json` 없음); `mcpServers`는 ADR 0011 화이트리스트 스냅샷에 이미 존재(`docs-code-invariants.js:153`); `claude plugin validate`는 CC v2.1.198에서 두 키 형태 모두 실증 통과하나 참조 파일 존재는 검사하지 않음.
- **후속과제 근거**: 릴리스 스크립트 6단계가 `plugin tag [path]` `{name}--v{version}` 의미론(~CC v2.1.110) 대비 노후; ADR 다음 번호 = 0015; `model_baseline` 32개 필드는 inert 메타데이터(러너가 LLM 호출 0회) → SOP만; 테스트 5개가 실제 `.bkit`에 누수하고 `lib/pdca/batch-orchestrator.js:64-66`은 root 주입 불가; 스프린트 레지스트리/감사 로거가 주입 root 무시(mkdtemp 기반 테스트조차 `sc05-test` 누수).
- **사용자 결정 (Plan 체크포인트, 2026-07-02)**: FR-1..10 전체 스코프; **F4 = 풀 리팩토링** ("기술부채 없는 대응" 원칙 — 주입 가능화 + root 존중 + 테스트 5개); **45-skills = 문서화만**.

### 1.3 관련 문서

- PRD: `docs/00-pm/v2126-issue-response.prd.{en,ko}.md`
- 리서치: `.bkit/research/v2126-reproduction-log.md`, `v2126-web-research.md`, `v2126-codebase-audit.md`
- 기원: v2.1.25 완료 보고서 후속과제 목록 (`docs/04-report/claude-model-alignment.report.ko.md`)

---

## 2. 범위

### 2.1 포함 (In Scope)

- [ ] FR-01 루트 `.mcp.json`에서 MCP 매니페스트 재배치 (인라인 객체 vs 별도 참조 파일은 Design 결정)
- [ ] FR-02 회귀 잠금: MS-011~015를 새 위치로 갱신 + 루트에 `.mcp.json` 없음 신규 단언 + 패킹 플러그인 수동 스모크를 수용 증거로 기록
- [ ] FR-03 `release-plugin-tag.sh` 6단계 → 직접 `git tag -a` (선택적 `claude plugin tag . --dry-run` 정합 단계는 Design 결정) + dry-run echo 수정 + `cc-version-checker.js:64` `pluginTagCommand` 갱신
- [ ] FR-04 ADR 0011 화이트리스트를 현재 공식 CC 2.1.198 스키마와 정합 (mcpServers는 이미 존재; 리서치에 따른 신규 공식 키 추가; ADR 이력 갱신)
- [ ] FR-05 ADR 0015 "Locale-scoped 트리거 생성 이연" (이중언어 쌍, ADR 0014 형식 준수)
- [ ] FR-06 Eval 재베이스라인 SOP 가이드 (이중언어, docs/06-guide) — 동결된 32개 `model_baseline` 필드 무접촉
- [ ] FR-07 테스트 격리 가드, 풀 깊이: `lib/pdca/batch-orchestrator.js` projectRoot 주입 가능화; 스프린트 레지스트리 라이터 + 감사 로거의 주입 projectRoot 존중; 누수 테스트 5개 tmp-root 격리 (sprint-handler ×2, config-sync, module-chain, batch-orchestrator)
- [ ] FR-08 로컬 `.bkit` 정리 — 1회성 로컬 절차 문서화(및 로컬 실행); 문서 노트 외 출하물 없음
- [ ] FR-09 45-skills 카운팅 해명 — 문서 노트만 (CC가 skills/ + commands/ 합산; output-style-setup 커맨드 = +1)
- [ ] FR-10 CHANGELOG 엔트리 (버저닝 규칙에 따른 잠정/미출시 헤딩) + 릴리스 어드바이저리 콘텐츠

### 2.2 제외 (Out of Scope)

- 버전 필드 변경 (릴리스 시 메인테이너 결정; CHANGELOG 헤딩은 승인 전까지 잠정)
- `eval.yaml` `model_baseline` 32개 값 편집 (v2.1.25 결정에 따른 동결 이력 기록)
- 저장소 태그 관례의 `{name}--v{version}` 전환 (연속성 파손; 공식 명령은 Design이 포함할 경우 선택적 `--dry-run` 정합 검사로만 사용)
- 마켓플레이스 최종 사용자 동작의 일체 변경 (NFR-1)
- CC 측 이슈(#9427 계열) 수정 — bkit은 문서화된 동작에만 적응
- `skills/output-style-setup/` 트윈 생성 (사용자 결정: 문서화만)

---

## 3. 요구사항

### 3.1 기능 요구사항

| ID | 요구사항 | 우선순위 | 상태 |
|----|-------------|----------|--------|
| FR-01 | 공식 `plugin.json` `mcpServers` 키로 플러그인 MCP 선언을 `.mcp.json` 루트 파일명에서 재배치 (형태는 Design Checkpoint 3 결정) | High | Pending |
| FR-02 | 회귀 잠금: MS-011~015 경로 갱신 + 루트 `.mcp.json` 부재 단언 + 패킹 플러그인 스모크(로컬 마켓플레이스 설치 또는 cache-sim)를 수용 기준으로 기록 | High | Pending |
| FR-03 | 릴리스 스크립트 6단계 수정 (직접 `git tag -a`; 선택적 정보성 `claude plugin tag . --dry-run`은 Design 결정) + `cc-version-checker.js` pluginTagCommand 갱신 | High | Pending |
| FR-04 | ADR 0011 화이트리스트를 현재 공식 스키마와 정합 + History 추가 | Medium | Pending |
| FR-05 | ADR 0015 이중언어 (locale-scoped 이연; #129 제안 1 인용, 불변 캐시 논거, language.js 레지스트리, VS-011~015 잠금) | Medium | Pending |
| FR-06 | Eval 재베이스라인 SOP 가이드 이중언어 (`model_baseline` 재캡처의 시기/사유/방법; 현행 32개 동결 명시) | Medium | Pending |
| FR-07 | 테스트 격리 풀 리팩토링: batch-orchestrator projectRoot 주입; 스프린트 레지스트리 + 감사 로거의 주입 root 존중; 테스트 5개 tmp-root 격리; 해당 스위트 실행 후 `.bkit` 바이트 동일을 증명하는 신규 가드 테스트 | High | Pending |
| FR-08 | 로컬 `.bkit` 정리 절차 (문서화; 로컬 실행; 가용 시 안전 API, 레지스트리 행/배치는 파일 수준) | Low | Pending |
| FR-09 | 문서의 45-skills 카운팅 노트 (README-FULL 또는 CUSTOMIZATION-GUIDE + bkit-system) | Low | Pending |
| FR-10 | CHANGELOG 잠정 엔트리 + 어드바이저리 (개발자/클로너가 보는 변화; 설치 사용자는 무변화) | Medium | Pending |

### 3.2 비기능 요구사항

| 범주 | 기준 | 측정 방법 |
|----------|----------|-------------------|
| 마켓플레이스 무회귀 | 재배치 후 `plugin:bkit:bkit-pdca`/`bkit-analysis` 계속 ✔ Connected | 패킹 플러그인 스모크: 설치본에서 `claude mcp list` + `/plugin` |
| 개발자/클로너 클린 상태 | 저장소 cwd에서 bare `bkit-*` MCP 엔트리 0, MCP 진단 경고 0 | 저장소에서 fresh `claude mcp list` |
| CI 무결성 | 전체 게이트 green (contract L1-L5, security, unit, 새 위치의 MS 스위트, 릴리스 게이트, qa-aggregate 신규 실패 0 vs main) | 로컬 전체 실행 + push 시 Actions |
| 테스트 상태 무결성 | 리팩토링된 5개 스위트가 `.bkit`을 바이트 동일하게 유지 | 스위트 실행 전후 `.bkit` 해시 (신규 가드 테스트) |
| Docs=Code | 신규/갱신 ADR + SOP + 카운팅 노트 포함 drift 0 | docs-code-sync + bkit-full-system + 수동 리뷰 |
| 버저닝 | 이 브랜치에서 버전 무변경; CHANGELOG 헤딩 잠정 | Diff 리뷰 |
| 이중언어 완전성 | 모든 신규 docs/ 파일은 `.en.md`+`.ko.md` 동기화 쌍 | 리뷰 |
| 단일 브랜치 위생 | 배치 커밋, 마일스톤에서만 push (Actions 무료 티어) | Git 이력 |

---

## 4. 성공 기준

### 4.1 완료 정의 (DoD)

- [ ] SC-1: 저장소 cwd에서 fresh `claude mcp list`에 bare `bkit-pdca`/`bkit-analysis` 엔트리 없음 + "MCP config diagnostics" 경고 없음; `/plugin`의 Needs attention에 bkit 행 없음
- [ ] SC-2: 패킹/설치 플러그인 경로 검증: `plugin:bkit:bkit-pdca` + `plugin:bkit:bkit-analysis` ✔ Connected + 19개 도구 호출 가능 (라이브 MCP 도구 호출 1회 probe)
- [ ] SC-3: 현재 CC에서 `bash scripts/release-plugin-tag.sh --dry-run` 전 구간 green ("Path not found" 없음); 6단계 실경로는 논리 검증 (태그 생성은 실제 릴리스로 이연)
- [ ] SC-4: 신규 격리 가드 테스트 통과: 리팩토링된 5개 스위트 실행 후 `.bkit` 바이트 동일 (해시 대조)
- [ ] SC-5: ADR 0011 갱신, ADR 0015 + eval SOP가 이중언어 쌍으로 존재; docs-code-sync + bkit-full-system green
- [ ] SC-6: 로컬 CI-미러 게이트 스위트 전체 green; 단일 마일스톤 push에서 GitHub Actions green
- [ ] SC-7: Design 대비 갭 분석 ≥ 90% (목표 100%); 라이브 체크 QA_PASS
- [ ] SC-8: CHANGELOG 잠정 엔트리 존재; PR 오픈; 머지는 사용자 승인 대기; 이후 태그 v2.1.26 + GitHub Release 노트 (영문)

### 4.2 품질 기준

- [ ] 신규 데드 코드 없음; 도메인 순수성 green; 영어 전용 구현 (docs/ 이중언어 + 8개국어 트리거 예외)
- [ ] 계약 베이스라인 수동 편집 없음 (변경 예상 없음 — MCP 도구 베이스라인은 servers/ 디렉터리 기반)

---

## 5. 리스크와 완화

| 리스크 | 영향 | 가능성 | 완화 |
|------|--------|------------|------------|
| validate-pass ≠ load-pass: 재배치 매니페스트가 `claude plugin validate`는 통과하나 실제 설치에서 로더가 무시 | High | Low-Med | SC-2 패킹 플러그인 스모크를 머지 전 수용 테스트로; 롤백 = `.mcp.json` 복원(1파일) |
| 감사 범위 밖에서 MS 테스트나 다른 코드가 `.mcp.json` 경로 가정 | Medium | Low | 감사에서 리더 3곳 + 테스트 1개만 확인; Do 단계 grep 스윕 재검증 (연관+유사 규칙) |
| 테스트 격리 리팩토링이 batch-orchestrator/감사/레지스트리의 런타임 호출자 파손 | Medium | Medium | 주입은 가산적(기본값 = 현행 PROJECT_DIR 동작); 전체 contract/unit 스위트 + main 대비 qa-aggregate diff |
| 선택적 `plugin tag . --dry-run` 단계가 CC 버전별로 다르게 동작 | Low | Medium | 정보성 전용(절대 게이트 안 함); Design에 따라 버전 체크 또는 `\|\| true` 의미론으로 가드 |
| cwd `.mcp.json`의 bkend-감지 리더(session-context.js:389)가 변경을 오독 | Low | Low | 사용자 프로젝트의 파일을 읽는 것이며 우리 것 아님; 제거 경로는 "Not configured" 반환 — 감사에서 검증됨 |
| GitHub Actions 무료 티어 소진 | Low | Medium | 단일 마일스톤 push 정책 (v2.1.25와 동일) |

---

## 6. 영향 분석

### 6.1 변경 리소스

| 리소스 | 유형 | 변경 설명 |
|----------|------|--------------------|
| `.mcp.json` (루트) | 플러그인 MCP 매니페스트 | 삭제 또는 이동 (Design) |
| `.claude-plugin/plugin.json` | 매니페스트 | + `mcpServers` 키 (인라인 또는 경로) |
| `test/integration/mcp-server.test.js` | 테스트 | MS-011~015 새 위치 지시 + 신규 루트-파일-부재 잠금 |
| `scripts/release-plugin-tag.sh` | 릴리스 도구 | 6단계 재작성 + echo 수정 |
| `lib/infra/cc-version-checker.js` | 인프라 | pluginTagCommand 갱신 |
| `docs/adr/0011-*.md` | ADR | 화이트리스트 정합 + 이력 |
| `docs/adr/0015-*.{en,ko}.md` | ADR (신규 쌍) | Locale-scoped 이연 |
| `docs/06-guide/eval-rebaseline.guide.*.md` (명칭은 Design) | SOP (신규 쌍) | Eval 재베이스라인 절차 |
| `lib/pdca/batch-orchestrator.js` | Lib | projectRoot 주입 가능화 (가산적, 기본값 무변경) |
| 스프린트 레지스트리 라이터 + 감사 로거 root 해석 | Lib | 주입된 projectRoot 존중 |
| 테스트 5개 파일 (sprint-handler ×2, config-sync, module-chain, batch-orchestrator) | 테스트 | tmp-root 격리 |
| README-FULL/CUSTOMIZATION-GUIDE + bkit-system | 문서 | 45-skills 노트 + 카운트 무접촉 (44/34 그대로 참) |
| CHANGELOG.md | 문서 | 잠정 v2.1.26 엔트리 |

### 6.2 현재 소비자

| 리소스 | 연산 | 코드 경로 | 영향 |
|----------|-----------|-----------|--------|
| 플러그인 MCP 선언 | LOAD | CC 플러그인 로더 (기본 `.mcp.json` 또는 매니페스트 `mcpServers`) | SC-2 패킹 스모크 필요 (로더 특이 시 Breaking) |
| 루트 `.mcp.json` | LOAD | repo=cwd일 때 CC 프로젝트-설정 자동 로드 | 의도적 제거 (버그 그 자체) |
| `.mcp.json` 파일 | ASSERT | mcp-server.test.js MS-011~015 | 갱신 (FR-02) |
| cwd `.mcp.json` | READ | session-context.js:389, user-prompt-handler.js:34 (bkend 감지) | 없음 (사용자 프로젝트를 읽음; 폴스루) |
| servers/ 경로 | SPAWN/ASSERT | l3-mcp-{compat,runtime}, 베이스라인, L5, measure 스크립트 | 없음 (직접 servers/ 경로) |
| `claude plugin tag` | EXEC | release-plugin-tag.sh:128 | 수정됨 (FR-03) |
| PROJECT_DIR 하드코딩 배치 경로 | READ/WRITE | lib/pdca/batch-orchestrator.js:64-66 ← 배치 테스트 | 주입 가능화 (FR-07), 기본값 보존 |
| 실제 `.bkit` 상태 | WRITE | 누수 테스트 5개; 주입 root 무시하는 레지스트리/감사 라이터 | 격리 (FR-07) |

### 6.3 검증

- [ ] Do 단계 연관+유사 스윕: `.mcp.json`, `CLAUDE_PLUGIN_ROOT`(hooks 외), `plugin tag`, lib/pdca + lib/audit + lib/sprint 라이터의 PROJECT_DIR 하드코딩 저장소 전체 grep
- [ ] 인증/권한 표면 없음; plugin.json은 화이트리스트된 키 1개만 추가 (ADR 0011 집행 가능성 유지)

---

## 7. 아키텍처 고려사항

### 7.1 프로젝트 레벨 선택

bkit 플러그인 내부 — Enterprise급 저장소 컨벤션 (Clean Architecture lib/, 계약 게이트 L1-L5) 적용.

### 7.2 핵심 아키텍처 결정 (Design으로 이연 — Checkpoint 3)

| 결정 | 옵션 | 방향 | 검토 근거 |
|----------|---------|---------|--------------------|
| (a) MCP 매니페스트 형태 | A: plugin.json 내 인라인 `mcpServers` 객체 / B: 별도 파일 (예: `.claude-plugin/mcp.json` 또는 `mcp-servers.json`) + 경로 키 | Design | 인라인 = 파일 수 감소, 매니페스트 자기완결; 별도 = 깔끔한 diff, 기존 구조 유사 |
| (b) `plugin tag . --dry-run` 정보성 단계 | 포함 / 생략 | Design | plugin.json↔marketplace 정합 검사 추가; 절대 게이트 금지 |
| (c) F4 주입 패턴 | opts 파라미터 스레딩 vs env(BKIT_ROOT) vs 기존 port/adapter 관례 | Design | 저장소 관례와 일치해야 (status-core는 명시 경로; l3-runtime은 BKIT_ROOT env) |
| (d) Eval SOP + ADR 파일 명명 | docs/06-guide + docs/adr 패턴 준수 | Design | 기존 `.guide.md` / ADR 쌍 관례 |

### 7.3 Clean Architecture 접근

변경 국한: `.claude-plugin/` + 루트 매니페스트(설정), `scripts/`(어댑터), `lib/pdca` + `lib/audit`/스프린트 라이터(애플리케이션/인프라), `test/`(계약/통합/단위), `docs/`(거버넌스). check-domain-purity green 유지; 주입 변경이 domain→outer 의존을 추가하면 안 됨.

---

## 8. 컨벤션 전제조건

- [x] 이중언어 신규 문서 규칙 (`.en.md`+`.ko.md`); 영어 구현; 버전 무변경 (CLAUDE.md)
- [x] ADR 형식 모델: ADR 0014 쌍; 다음 번호 0015
- [x] ENH 번호: Do 단계에서 CHANGELOG의 다음 빈 번호 확인 (ENH-368 이후; 추측 금지)
- [x] 계약 베이스라인: MCP 도구 베이스라인은 servers/ 디렉터리에서 파생 — 이번 릴리스에서 무변경 예상; 베이스라인 diff 발생 시 적신호

---

## 9. 다음 단계

1. [ ] 설계 문서 (`docs/02-design/features/v2126-issue-response.design.{en,ko}.md`) — FR-01 형태 3개 옵션 + 전체 변경 열거(I-리스트) + 검증 체크리스트
2. [ ] 사용자의 아키텍처 옵션 선택 (Checkpoint 3) — **현재 사용자 요청 산출물 경계는 Design 승인에서 종료**
3. [ ] 이후 (go 신호 시): `/pdca do` 팀 실행 → analyze/iterate → qa → 문서 동기화 → 단일 push → CI → PR → 사용자 승인 → 머지 → 태그 v2.1.26 + GitHub Release

---

## 버전 이력

| 버전 | 날짜 | 변경 | 작성자 |
|---------|------|---------|--------|
| 0.1 | 2026-07-02 | PRD + 리서치 + Plan 체크포인트 결정으로부터 초안 (전체 스코프; F4 풀 리팩토링; 45-skills 문서화만) | PDCA 파이프라인 |
