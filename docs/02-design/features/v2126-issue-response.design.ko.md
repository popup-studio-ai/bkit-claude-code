# v2126-issue-response 설계 문서

> **요약**: 옵션 C (Pragmatic) — plugin.json에 `mcpServers` 인라인(루트 `.mcp.json` 삭제) + 루트-파일-부재 회귀 잠금 + 패킹 플러그인 스모크 수용 기준; 릴리스 스크립트 태그 단계 → 직접 `git tag -a` + 정보성 `plugin tag . --dry-run` 정합 echo; batch-orchestrator + 스프린트 레지스트리 + 감사 로거의 가산적 `projectRoot` 주입 + 테스트 스위트 5개 tmp-root 격리; ADR 0011 정합 + ADR 0015 + eval 재베이스라인 SOP (이중언어); 45-skills 카운팅 노트.
>
> **프로젝트**: bkit Vibecoding Kit (bkit-claude-code)
> **버전**: 2.1.26 (잠정)
> **작성자**: PDCA 파이프라인
> **날짜**: 2026-07-02
> **상태**: 승인됨 (Checkpoint 3: 사용자가 옵션 C 선택, 2026-07-02)
> **기획 문서**: [v2126-issue-response.plan.ko.md](../../01-plan/features/v2126-issue-response.plan.ko.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | AI 코드를 스펙과 대조 검증하는 플러그인이 자기 개발자/클로너를 failed MCP 서버로 맞이해서는 안 됨; 도구/거버넌스는 현재 CC 현실과 일치해야 함. |
| **WHO** | bkit 개발자 + 클로너 (MAIN); 메인테이너 (릴리스 스크립트); 전체 개발자 (상태 무결성). 마켓플레이스 사용자: 무영향 유지 필수. |
| **RISK** | validate-pass ≠ load-pass (패킹 스모크 = 진짜 수용 기준); 격리 리팩토링이 공유 lib 경로 접촉 (가산적 기본값으로 완화). |
| **SUCCESS** | 저장소 cwd: bare bkit MCP 엔트리 0 + 진단 0; 설치본 `plugin:bkit:*` 여전히 ✔; 릴리스 `--dry-run` green; 5개 스위트가 `.bkit` 바이트 동일 유지; CI green. |
| **SCOPE** | plugin.json 인라인 mcpServers + .mcp.json 삭제 · MS 스위트 + 잠금 · 릴리스 스크립트 + version-checker · ADR 0011/0015 + eval SOP · batch/레지스트리/감사 root 주입 + 테스트 5개 + 가드 테스트 · 문서 노트 + CHANGELOG. |

---

## 1. 개요

### 1.1 설계 목표

1. 루트 `.mcp.json`이 다시는 존재하지 않음 → CC가 프로젝트 설정으로 로드할 수 없음; 플러그인 MCP 선언은 플러그인 로더만 읽는 위치에 존재.
2. 마켓플레이스 경로는 동작상 동등: 동일한 서버 2개, 동일한 `${CLAUDE_PLUGIN_ROOT}` args, 동일한 env.
3. 격리 변경은 가산적: 접촉하는 모든 lib은 root 미주입 시 현행 기본값(실제 `PROJECT_DIR`) 유지 — 테스트 밖 런타임 동작 무변경.
4. 모든 거버넌스 산출물(ADR 0011 갱신, ADR 0015, eval SOP)은 이중언어 + 기존 파일 관례 준수.

### 1.2 설계 원칙

- **No Guessing**: 레지스트리/감사 라이터의 정확한 모듈은 Do 단계에서 코드를 읽고 명명 (감사는 증상과 진입 파일을 특정; Do 에이전트는 편집 전 전체 호출 체인을 반드시 읽어야 함 — v2.1.25 I-13과 동일 관례).
- **가산적 주입**: 신규 `projectRoot`/`opts` 파라미터는 현행 동작을 기본값으로; 신규 추상화 레이어 없음 (옵션 C는 이번 릴리스의 공용 포트 도입을 명시적으로 기각).
- **수용 기준 = 라이브 동작**: `claude plugin validate`는 게이트일 뿐 수용 기준이 아님; 패킹/설치 스모크(SC-2)가 수용 기준.

---

## 2. 아키텍처 옵션

### 2.0 비교 (요약 — 전체 표는 Plan §7.2 + Checkpoint 3)

| 기준 | A: Minimal | B: Clean | **C: Pragmatic** |
|---|:-:|:-:|:-:|
| MCP 형태 | 별도 `.claude-plugin/mcp.json` + 경로 키 | 인라인 | **인라인** |
| F4 패턴 | 최소 opts 스레딩 | 신규 공용 resolveProjectRoot 포트 | **가산적 opts, 기존 관례** |
| plugin-tag dry-run 단계 | 생략 | 게이트 | **정보성 전용 (`|| true`)** |
| 수정 파일 | ~19 | ~23 | ~20 |
| 리스크 | 파일 잔존 | 과설계 | **최저** |

**선택**: **옵션 C** — Checkpoint 3에서 사용자 승인 (2026-07-02).

### 2.1 컴포넌트 다이어그램 — 로드 경로 전/후

```
BEFORE:
  CC 플러그인 로더 ──읽음──▶ <plugin>/.mcp.json  ─ ${CLAUDE_PLUGIN_ROOT} 확장 ✔
  CC 프로젝트 설정 ─자동───▶ <cwd>/.mcp.json     ─ 변수 미정의 ✗  ← 버그 (같은 파일, repo=cwd)

AFTER:
  CC 플러그인 로더 ──읽음──▶ .claude-plugin/plugin.json "mcpServers" (인라인) ✔
  CC 프로젝트 설정 ─자동───▶ <cwd>/.mcp.json  → 파일 없음 → 아무것도 로드 안 됨, 진단 없음
```

### 2.2 데이터 흐름 (격리, FR-07)

```
테스트 (tmp root) ──opts.projectRoot──▶ batch-orchestrator ──▶ <tmpRoot>/.bkit/state/batch/*
                  └────────────────────▶ 스프린트-레지스트리 라이터 / 감사-로거 ──▶ <tmpRoot>/.bkit/...
기본 (미주입) ─────────────────────────▶ getCore().PROJECT_DIR  (런타임 동작 무변경)
```

### 2.3 의존성

| 컴포넌트 | 의존 대상 | 비고 |
|---|---|---|
| plugin.json `mcpServers` | 공식 매니페스트 스키마 키 (이미 `EXPECTED_PLUGIN_JSON_KEYS`에 존재, docs-code-invariants.js:153) | validate --strict green 유지 필수 |
| MS 테스트 스위트 | 새 매니페스트 위치 | FR-02 |
| 격리 가드 테스트 | 주입 root 존중 (I-10..12) | FR-07 |

---

## 3. 데이터 모델 — 재배치된 MCP 매니페스트

### 3.1 plugin.json 인라인 `mcpServers` (I-1, 정확한 내용)

```json
"mcpServers": {
  "bkit-pdca": {
    "command": "node",
    "args": ["${CLAUDE_PLUGIN_ROOT}/servers/bkit-pdca-server/index.js"],
    "env": {}
  },
  "bkit-analysis": {
    "command": "node",
    "args": ["${CLAUDE_PLUGIN_ROOT}/servers/bkit-analysis-server/index.js"],
    "env": {}
  }
}
```

현행 `.mcp.json`과 의미론 동일 (서버명, command, args, env — 값 단위 동일). `${CLAUDE_PLUGIN_ROOT}`는 공식 문서에 따라 플러그인 컨텍스트에서 확장 ("MCP 또는 LSP 서버 설정 어디서나 인라인 치환").

### 3.2 루트 `.mcp.json` — 삭제 (I-2). 저장소 어디에도 해당 루트 파일명의 대체 파일이 존재해서는 안 됨 (I-3으로 잠금).

---

## 4. 인터페이스 변경 (I-리스트 — 갭 분석 기준)

| # | 파일 | 변경 |
|---|---|---|
| I-1 | `.claude-plugin/plugin.json` | 인라인 `mcpServers` 객체 추가 (§3.1), `outputStyles` 뒤에 배치. 다른 키 무변경; version 필드 무접촉 |
| I-2 | `.mcp.json` (루트) | `git rm` — 내용은 I-1로 재배치 |
| I-3 | `test/integration/mcp-server.test.js:110-147` | MS-011~015를 `plugin.json` `mcpServers` 지시로 변경 (존재, 유효 JSON은 기존 커버, `bkit-pdca`+`bkit-analysis` 양쪽 존재, `command === 'node'`, 그리고 **신규 강화 단언** — args에 `${CLAUDE_PLUGIN_ROOT}/servers/...` 포함 — 현행 MS-014/015는 args를 단언하지 않음; 버그의 핵심 변수를 잠금); 신규 TC (MS-016 또는 다음 빈 id): `fs.existsSync(root/.mcp.json) === false` + 본 설계와 재현 R1 인용 주석 — 회귀 잠금 |
| I-4 | 패킹 플러그인 스모크 (절차, QA 리포트에 기록) | (a) `claude plugin validate . --strict` green; (b) fresh `claude -p --plugin-dir . "Call the bkit_pdca_status MCP tool"` 성공 (인라인 매니페스트의 플러그인-컨텍스트 로드); (c) 저장소 cwd에서 fresh `claude mcp list`에 bare `bkit-pdca`/`bkit-analysis` 없음 + 진단 블록 없음; (d) 마켓플레이스-설치 경로: 가능하면 설치본 재설치/갱신 검증 또는 캐시-복사 메커니즘이 plugin.json mcpServers를 로드함을 검증 (증거 기록; 설치된 2.1.25 사본이 남아 있으면 다음 릴리스까지 구 레이아웃 사용 — 예상된 동작, 회귀 아님) |
| I-5 | `scripts/release-plugin-tag.sh:122-136` | 6단계 재작성: 항상 `git tag -a "${TAG}" -m "bkit ${TAG} release"`; 그 전에 정보성 정합 echo: `claude plugin tag . --dry-run 2>&1 \| sed 's/^/[release][info] /' \|\| true` (절대 게이트 안 함; 파생 `{name}--v{version}` 정합 검사 출력); :123-124의 `--dry-run` echo를 새 단계에 맞게 수정; git-부재 폴백 의미론 유지 |
| I-6 | `lib/infra/cc-version-checker.js:64` | `pluginTagCommand: '2.1.118'` — 주석(및 마일스톤 맵 의미론상 필요 시 값 — Do가 맵의 의미를 먼저 읽음)을 갱신하여 `{name}--v{version}` 파생-태그 전환(~CC v2.1.110, 위치 인자 제거; 스크립트는 이제 git으로 직접 태깅)을 기록 |
| I-7 | `docs/adr/0011-plugin-manifest-schema-compliance.md` | History 추가: 공식 스키마가 21-키 v2.1.143 스냅샷을 넘어 성장 (mcpServers — 본 설계로 bkit이 이제 사용 — 및 리서치 Q1의 lspServers, channels, userConfig, defaultEnabled, $schema, homepage); 정책 명시: bkit의 `EXPECTED_PLUGIN_JSON_KEYS`는 "bkit이 출하하는 키"(부분집합 집행)이며 전체 공식 스키마의 미러가 아님 — 이 정책 문구는 ADR 이력에 그대로 기재되어야 Plan FR-04("신규 공식 키 추가")가 *설계로 충족*으로 채점됨: 화이트리스트에 없는 유일한 공식 키는 `defaultEnabled`(v2.1.154+)이며 bkit이 출하하지 않음; `mcpServers`는 이미 화이트리스트에 존재(docs-code-invariants.js:153)하므로 코드 변경 불필요 확인 |
| I-8 | `docs/adr/0015-locale-scoped-trigger-deferral.{en,ko}.md` (신규 쌍) | ADR 0014 형식: Context (#129 제안 1 인용; ~27KB→v2.1.25에서 압축 인코딩 출하), Decision (locale-scoped 생성 이연: CC 플러그인은 불변 버전드 마켓플레이스 체크아웃 — `~/.claude/plugins/cache/...` — 설치 시 생성 훅 없음; 로케일별 에이전트 파일은 git 기반 업데이트/계약 수집을 깨지 않고는 생산 불가), Consequences (+: 거짓 약속 없음, lib/intent/language.js 레지스트리로 라우팅 무영향; −: 비 EN/KO 사용자는 1-앵커 트리거 유지; CC가 설치 훅을 얻으면 재검토), 인용 (VS-011~015 KO 잠금, issue-129-description-budget 잠금) |
| I-9 | `docs/06-guide/eval-rebaseline.guide.{en,ko}.md` (신규 쌍) | SOP: `model_baseline`이 기록하는 것 (캡처 시점 모델 메타데이터; 러너는 LLM 호출 0회 — inert); 재베이스라인 시기 (스코어 루브릭 변경 또는 의도적 품질 기준 재설정 — 모델 릴리스가 아님); 방법 (`node evals/runner.js --benchmark` 실행, eval.yaml별 `model_baseline` + `baseline_date` 노트를 한 커밋으로 갱신, CHANGELOG 엔트리); 현행 32개 `claude-sonnet-4-6` 값은 v2.1.25 결정에 따라 동결 유지 명시 |
| I-10 | `lib/pdca/batch-orchestrator.js:64-66` | 주입 가능한 프로젝트 root 수용 (`opts.projectRoot`를 진입 API 또는 모듈의 기존 스타일에 맞는 생성자에 — Do가 모듈 전체를 먼저 읽음); 기본값 = 현행 `getCore().PROJECT_DIR` 동작; 모든 배치 상태 경로는 해석된 root에서 파생 |
| I-11 | 스프린트-상태 레지스트리 라이터 (Do에서 모듈 특정; 증상: v2113-sprint-contracts.test.js:147-169의 주입 root에도 불구하고 레지스트리 행이 실제 `.bkit`에 기록) | 이미 주입된 `projectRoot`를 레지스트리 기록 경로까지 스레딩; 기본값 무변경 |
| I-12 | 감사-로거 root 해석 (증상: 테스트에서 실제 `.bkit/audit`에 감사 추가) | 감사 디렉터리에 주입된 `projectRoot` 존중; 기본값 무변경 |
| I-13 | 테스트 5개 파일: `test/unit/sprint-handler/default-level-warning.test.js`, `test/unit/sprint-handler/annotate-action.test.js`, `test/integration/config-sync.test.js`, `test/integration/module-chain.test.js`, `test/unit/batch-orchestrator.test.js` | 각각 `fs.mkdtempSync` root에 대해 실행 (v2113-sprint-contracts.test.js의 tmp-root 패턴 — I-11/I-12 이후 실제로 끝까지 유효해짐); 정리 시 tmp 디렉터리 제거; 저장소 `.bkit`에 기록 없음 |
| I-14 | 신규 `test/regression/bkit-state-isolation.test.js` | 가드: (a) 단위 — batch-orchestrator/레지스트리/감사 기록 경로를 tmp root 주입으로 호출 시 tmp 아래에만 기록 (호출 전후 실제 `.bkit` 해시 불변 단언); (b) 메타 — 저장소 `.bkit`을 재귀 해시(존재 시), I-13의 5개 스위트를 자식 프로세스로 실행, 재해시, 동일 단언. 단독 실행 가능; test-tracking 정책에 따라 등록 |
| I-15 | 45-skills 카운팅 노트 | `CUSTOMIZATION-GUIDE.md`(플러그인 구조 트리 인근) + `bkit-system/components/skills/_skills-overview.md`에 한 줄: CC `/plugin`의 Skills 카운트 = `skills/` + `commands/` 엔트리 (동명 dedup); bkit: 44 스킬 + `commands/output-style-setup.md` → 45 |
| I-16 | `CHANGELOG.md` | 신규 최상단 엔트리 `## [Unreleased — v2.1.26 provisional] - <날짜>` (릴리스 시 메인테이너가 헤딩 개명 — v2.1.25 승인 전 상태와 동일 관례): MAIN 수정 + R1 메커니즘, FR-03..09 요약, 로컬 정리 노트(I-17 참조), 어드바이저리: 개발자/클로너가 보는 변화; 설치 사용자 무영향 |
| I-17 | 로컬 `.bkit` 정리 (미출하) | 절차를 CHANGELOG 엔트리에 짧게 기록 + 로컬 실행: `deleteFeatureFromStatus`로 픽스처 feature 제거 (test-feature-sync, test-module-chain, test-feature), 픽스처 스프린트 파일/레지스트리 행 (sc05-test, test-f1-*) 및 `.bkit/state/batch/test-*`/`batch-*` 픽스처 파일 수준 제거, 오염된 history 엔트리 정리; 이후 `bkit_pdca_status` MCP + `/pdca status` 정상 동작 확인 |

### 4.1 명시적 무변경 (회귀 가드)

- `servers/**` — 무접촉; L3 compat/runtime, L5 인벤토리, 계약 MCP 베이스라인은 모두 `servers/`에서 파생 — diff 0이어야 함.
- `hooks/hooks.json` — 무접촉 (이중 로드 안 됨; `${CLAUDE_PLUGIN_ROOT}` 25개 사용 유지; HPQ/CC-002/VC2-012 잠금 무영향).
- `evals/*/eval.yaml` ×32 `model_baseline` — 동결 (I-9는 문서화만, 편집 안 함).
- 모든 버전 필드 — 무접촉 (릴리스 시 메인테이너 확정).
- 계약 베이스라인 양쪽 디렉터리 — 바이트 동일 예상; diff 발생 시 리뷰 실패.

---

## 5. 검증 체크리스트 (gap-detector 대상)

### 5.1 MAIN 수정

- [ ] I-1 plugin.json이 §3.1 객체를 정확히 포함; `claude plugin validate . --strict` green (에러/경고 0)
- [ ] I-2 루트 `.mcp.json` 트리에서 부재 (git rm)
- [ ] I-3 MS 스위트가 새 위치에서 green + 루트-파일-부재 잠금 존재·통과
- [ ] I-4 스모크 증거 기록: --plugin-dir fresh 세션 MCP 도구 호출 OK; 저장소-cwd `claude mcp list` 클린 (bare 엔트리 없음, 진단 없음); 설치본 노트
- [ ] 스윕: 저장소 전체 `.mcp.json` grep — 잔여 참조는 감사된 사용자-프로젝트/bkend 리더 3곳 (session-context.js:389, user-prompt-handler.js:34, measure-mcp 주석) + 역사적 문서뿐; 루트 파일을 기대하는 곳 없음

### 5.2 후속과제

- [ ] I-5 스크립트 6단계: CC v2.1.198에서 `--dry-run` 전체 통과 ("Path not found" 없음); 정보성 단계는 절대 게이트 안 함 (`\|\| true` 의미론 검증)
- [ ] I-6 cc-version-checker 주석/값 갱신; `test/unit/cc-version-checker.test.js` green
- [ ] I-7 ADR 0011 이력 추가; 코드의 `EXPECTED_PLUGIN_JSON_KEYS` 무변경; validate-plugin + config-sync green
- [ ] I-8 ADR 0015 이중언어 쌍 존재, 0014 형식 준수, 근거 4건 전부 인용
- [ ] I-9 eval SOP 이중언어 쌍 존재; 동결 명시; eval.yaml 무수정
- [ ] I-10..12 주입 가산적: 기본 동작 바이트 동일 (I-13 외 테스트 수정 0으로 기존 단위/계약 스위트 green); 주입 tmp root 완전 존중 (실제 `.bkit` 기록 없음)
- [ ] I-13 5개 스위트 tmp-root화 + green
- [ ] I-14 격리 가드 테스트 green (양 레벨)
- [ ] I-15 카운팅 노트가 두 문서에 존재
- [ ] I-16 CHANGELOG 잠정 엔트리; I-17 로컬 정리 완료 + `/pdca status`와 `bkit_pdca_status` 정상

### 5.3 전역 게이트

- [ ] 전체 CI-미러 스위트 green (contract v2.1.9+v2.1.16 L1/L4, l2-smoke, l2-hook-attribution, l3-mcp-compat, l3-mcp-runtime, L5 인벤토리, security, units, docs-code-sync, check-deadcode, check-domain-purity, check-guards, check-test-tracking, integration-runtime, bkit-full-system, docs-code-sync.test, validate-plugin --strict, qa-aggregate 신규 실패 0 vs main)
- [ ] 계약 베이스라인 바이트 동일 (양쪽 디렉터리)
- [ ] docs=code drift 0; 이중언어 쌍 동기화

---

## 6. 에러 처리

| 조건 | 동작 |
|---|---|
| 패킹 스모크 실패 (로더가 인라인 mcpServers 무시) | 서로 다른 두 경로 — 혼동 금지: (a) **긴급 되돌리기** = 루트 `.mcp.json` 복원 + I-1/I-3 폐기 (이중 로드 버그 재도입; 지혈용 전용); (b) **영구 폴백** = 설계 옵션 A: 별도 파일 `.claude-plugin/mcp.json` 생성 + `"mcpServers": "./.claude-plugin/mcp.json"` 경로 키 (루트는 삭제 유지), 이후 재스모크 |
| 일부 CC 버전에서 `claude plugin tag . --dry-run` 에러 | 정보성 단계가 `\|\| true`로 흡수; 릴리스는 `git tag -a`로 진행 |
| 주입 root 리팩토링이 런타임 호출자 파손 | 기본값 보존; 전체 스위트 + main 대비 qa-aggregate diff가 머지 전 포착 |
| 설치된 2.1.25 사본이 구 `.mcp.json` 레이아웃 유지 | 다음 마켓플레이스 릴리스까지 예상된 동작; 회귀 아님 (그쪽 플러그인-컨텍스트 확장은 정상) |

---

## 7. 보안 고려사항

- plugin.json은 이미 화이트리스트된 키 1개만 추가; ADR 0011 집행 유지 (validate-plugin --strict 게이트 유지)
- 권한/인증 표면 없음; 신규 네트워크 호출 없음; 감사-로거 변경은 경로 해석만 (JSONL 내용 무변경)

---

## 8. 테스트 계획

| 레이어 | 대상 | 도구/명령 |
|---|---|---|
| L1 정적 | MS 스위트 (새 위치 + 잠금), validate-plugin --strict, contract L1/L4 양 베이스라인 | node 러너 |
| L2 | l2-smoke + hook-attribution (hooks 무변경 — 회귀 확인만) | node |
| L3 | l3-mcp-compat + l3-mcp-runtime (servers 무접촉 — 회귀 확인만) | node |
| L5 | invocation-inventory (MCP 도구 19 — 회귀 확인만) | node |
| 격리 | I-14 가드 (단위 + 메타 해시 레벨); 리팩토링된 5개 스위트 | node |
| 라이브 probe (QA) | fresh `claude mcp list` (SC-1); `claude -p --plugin-dir .` MCP 도구 호출 (SC-2a); 설치본 노트 (SC-2b); 릴리스 스크립트 `--dry-run` (SC-3) | claude CLI |
| 릴리스 게이트 | docs-code-sync, bkit-full-system, check-deadcode, domain-purity, guards, test-tracking, main 대비 qa-aggregate diff | scripts |

시나리오 기대치: SC-1 bare 엔트리 0 + 진단 0; SC-2 도구 호출이 유효 JSON 반환; SC-3 dry-run이 신규 정보성 태그-정합 echo 포함 전 항목 OK 출력; I-14 해시 동일.

---

## 9. Clean Architecture

| 컴포넌트 | 레이어 | 위치 |
|---|---|---|
| 인라인 mcpServers | 설정 매니페스트 | `.claude-plugin/plugin.json` |
| 릴리스 태그 단계 | 어댑터 (스크립트) | `scripts/release-plugin-tag.sh` |
| pluginTagCommand 마일스톤 | 인프라 | `lib/infra/cc-version-checker.js` |
| projectRoot 주입 | 애플리케이션 (pdca) / 인프라 (audit) | `lib/pdca/batch-orchestrator.js`, 레지스트리/감사 라이터 (Do가 명명) |
| 가드 + 격리 테스트 | 테스트 | `test/regression/`, `test/unit/`, `test/integration/` |
| 거버넌스 문서 | 문서 | `docs/adr/`, `docs/06-guide/` |

의존 규칙: 주입 파라미터는 외부→내부로 일반 인자로 흐름; 도메인 레이어 무접촉; check-domain-purity green 유지.

---

## 10. 코딩 컨벤션 참조

- 영어 전용 구현; 신규 docs/ 파일은 이중언어 쌍; 버전 무변경.
- ENH 태그: Do 단계에서 CHANGELOG의 다음 빈 ENH 번호 확인 (ENH-368 이후) — 추측 금지.
- tmp-root 테스트: `tests/contract/v2113-sprint-contracts.test.js`의 mkdtemp 패턴 준수 (I-11/I-12 이후 완전히 유효해짐).
- 신규 테스트 파일은 `scripts/check-test-tracking.js` 통과 필수 (게이트 실행 전 git add).

---

## 11. 구현 가이드

### 11.1 구현 순서

1. [ ] module-1 MAIN: I-1, I-2, I-3 → validate + MS 스위트 + 저장소-cwd mcp-list probe
2. [ ] module-2 도구: I-5, I-6 → 스크립트 dry-run e2e
3. [ ] module-3 격리: I-10, I-11, I-12 (호출 체인 먼저 읽기), 이후 I-13, I-14 → 스위트 + 가드 + qa-aggregate diff
4. [ ] module-4 거버넌스 문서: I-7, I-8, I-9, I-15 (이중언어 쌍)
5. [ ] module-5 마무리: I-16 CHANGELOG, I-17 로컬 정리, 전체 게이트 스위트, 패킹 스모크 (I-4), 갭 분석

### 11.2 세션 가이드

#### 모듈 맵

| 모듈 | 스코프 키 | 설명 | 예상 턴 |
|--------|-----------|-------------|:---------------:|
| MAIN MCP 재배치 | `module-1` | I-1..I-3 + probe | 8-12 |
| 릴리스 도구 | `module-2` | I-5, I-6 | 5-8 |
| 격리 리팩토링 | `module-3` | I-10..I-14 (읽기 우선 필수) | 15-25 |
| 거버넌스 문서 | `module-4` | I-7..I-9, I-15 (이중언어 산출물 4종) | 10-15 |
| 마무리 + 검증 | `module-5` | I-16, I-17, 게이트, 스모크, 갭 | 10-15 |

#### 권장 세션 플랜

`/pdca do v2126-issue-response`를 팀 분할로 단일 세션 실행 (module-1/2/4 병렬 가능; module-3은 읽기-우선 순차; module-5는 오케스트레이터). 컨텍스트 부족 시 module-3 이후 분할 — 상태는 Task Management + 메모리 + 본 문서에 지속.

---

## 버전 이력

| 버전 | 날짜 | 변경 | 작성자 |
|---------|------|---------|--------|
| 0.1 | 2026-07-02 | 초안 — 옵션 C 승인 (Checkpoint 3) | PDCA 파이프라인 |
