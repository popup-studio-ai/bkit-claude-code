# S2 — Cross-Platform Verification (mac/windows) 설계서

> **Sprint**: `cross-platform-mac-windows` (마스터 플랜 S2) · **Trust**: L4 · **ENH**: ENH-329~335
> **Date**: 2026-06-01 · **Author**: kay kim · **선행**: `docs/01-plan/features/cross-platform-mac-windows.plan.md`
> **근거**: 본 세션 line-level 실측(2026-06-01)

---

## 1. 설계 원칙

1. **정직한 scope**: 실측이 추정과 다르면 실측을 따른다(plan §2). raw concat 0, exec POSIX-coreutils 0 → 해당 작업은 "검증완료" 기록만.
2. **하드 브레이크 우선**: CRLF에서 frontmatter 추출이 **완전 실패**하는 fence 정규식이 P0. (skill/agent/output-style 로딩 자체가 깨짐.)
3. **무회귀 불변식**: `\n` → `\r?\n`, `'\n'` → `/\r?\n/` 변경은 LF-only 입력에서 **완전 동치**. mac/linux 회귀 0.
4. **YAGNI**: 불필요한 `process.platform` 분기 추가 금지(ENH-330 근거 문서화).
5. **consolidation 금지**: 중복 frontmatter 파서 통합은 S3 영역. S2는 각 site를 제자리에서 CRLF-safe하게만.

---

## 2. Fix Manifest (site별 before/after)

### Group A — Frontmatter fence 정규식 CRLF-safety (P0, 하드 브레이크)

| # | 파일:라인 | before | after | 영향 |
|---|----------|--------|-------|------|
| A1 | `lib/util/markdown-parse.js:49` | `/^---\n([\s\S]+?)\n---/` | `/^---\r?\n([\s\S]+?)\r?\n---/` | S2 docs-sync gate + S3 importer 공유 파서 |
| A2 | `lib/qa/utils/pattern-matcher.js:186` | `/^---\s*\n([\s\S]*?)\n---/` | `/^---\s*\r?\n([\s\S]*?)\r?\n---/` | QA scanner frontmatter 파싱 |
| A3 | **`hooks/startup/context-init.js:146`** | `/^---\n([\s\S]*?)\n---/` | `/^---\r?\n([\s\S]*?)\r?\n---/` | **런타임 hook** — 세션 시작 시 frontmatter 파싱 |
| A4 | `scripts/validate-plugin.js:83` | `/^---\n([\s\S]*?)\n---/` | `/^---\r?\n([\s\S]*?)\r?\n---/` | CI plugin 검증 |
| A5 | `scripts/audit-output-styles.js:21` | `/^---\n([\s\S]*?)\n---/` | `/^---\r?\n([\s\S]*?)\r?\n---/` | output-style 감사 |
| A6 | `scripts/audit-output-styles.js:45` | `/^---[\s\S]*?---\n/` | `/^---[\s\S]*?---\r?\n/` | output-style body strip |

> **이미 안전(검증완료, 변경 불요)**: `skill-orchestrator.js:60`, `frontmatter.js:57/109`, `import-resolver.js:176` — 모두 `\r?\n` 사용.

### Group B — 파일내용 `split('\n')` → `split(/\r?\n/)` (robustness, lib/ 런타임)

| # | 파일:라인 | 비고 |
|---|----------|------|
| B1 | `lib/util/markdown-parse.js:27` | stripCodeBlocks |
| B2 | `lib/import-resolver.js:189,197` | imports/kv (이미 per-line trim, 일관성 위해) |
| B3 | `lib/skill-orchestrator.js:72,82,90,124` | imports/tools/kv/agents |
| B4 | `lib/pdca/workflow-parser.js:46` | yaml 파싱 |
| B5 | `lib/discovery/explorer.js:132` | frontmatter slice |
| B6 | `lib/qa/test-plan-builder.js:76` | 파일 라인 |
| B7 | `lib/qa/utils/pattern-matcher.js` (각 split) | code block/frontmatter 라인 |
| B8 | `lib/qa/utils/file-resolver.js:195` | `readFileSync().split('\n')` |
| B9 | `lib/quality/sqm-history.js:43,64` | 라인 카운트 |
| B10 | `lib/pdca/session-guide.js:96` | module map 테이블 |
| B11 | `lib/task/classification.js:41` | 라인 카운트 |
| B12 | `lib/util/markdown-parse.js` join 부 | `out.join('\n')` 유지(출력은 LF 정규화가 바람직, 변경 불요) |

> **NDJSON/JSONL 로그**(`audit-logger.js:476`, `decision-tracer.js:172`, `event-recorder.js:121`, `token-accountant.js:125`, `caching-cost-cli.js:121`, `token-report.js:44`, `dashboard/watch.js:80`): bkit가 LF로 write → CRLF 발생 여지 낮음. 일관성을 위해 `/\r?\n/` 적용(무회귀). 우선순위 2순위.

### Group C — Path separator split (ENH-329)

| # | 파일:라인 | 조치 |
|---|----------|------|
| C1 | `lib/ui/impact-view.js:77,96` | 이미 `.replace(/\\/g,'/')` 정규화 → **검증완료, 변경 불요** |
| C2 | `lib/qa/utils/file-resolver.js:76` | `pattern.split('/')` — glob 패턴(내부 const, forward-slash 규약). 주석 추가로 의도 명시 |
| C3 | `scripts/check-deadcode.js:129,133` | glob 결과 모듈경로 — 입력 정규화(`.replace(/\\/g,'/')`) 후 split |

### Group D — Shell exec 분기 (ENH-330) — 검증/문서화 only

- exec 18파일 전수: `git`, `gh`, `node`, `npx`만 사용. POSIX coreutils(find/wc/grep/cat/sed) exec **0**. → **bash↔pwsh 분기 불요**.
- `process.platform` 2곳(defense-coordinator, enh-254-fork-precondition)은 OS 판정용으로 충분.
- **결론**: 분기 추가는 YAGNI 위반. "분기 불요" 근거를 본 manifest에 기준선으로 명문화(향후 POSIX coreutils exec 추가 시 재검토 트리거).

### Group E — Hook Windows 발화 (ENH-332) — 검증 only

- hooks.json 25 command 전부 `node "${CLAUDE_PLUGIN_ROOT}/<path>.js"` 형식. node가 Windows에서 forward-slash 허용 → **안전**.
- shebang `#!/usr/bin/env node` 61파일은 `node`로 직접 호출되므로 **inert**(Windows 무관).
- 8 hook .js: A3(context-init) 외 path/shell Windows-unsafe 0.

---

## 3. Test Plan Matrix (L1-L5)

| Level | 항목 | 방법 |
|-------|------|------|
| L1 unit | fence 정규식이 CRLF 입력에서 frontmatter 추출 | CRLF 문자열 주입 → `extractFrontmatter`/`parseSkillFrontmatter` 결과 검증 |
| L2 integration | skill/agent 로딩이 CRLF .md에서 정상 | CRLF 임시 .md로 parse 호출 |
| L3 regression | LF 입력 기존 동작 동일 | 전 test suite green (`npm test` 또는 verify-full-system) |
| L4 static | 잔존 `^---\n`(non-`\r?`) fence 0 | grep 재검증 |
| L5 runtime | hook 발화(session-start 계열) 정상 | `--plugin-dir .` 세션 동작 + node 직접 실행 |

---

## 4. 회귀 불변식 증명 (mac/linux 무회귀)

- **정규식 `\n` → `\r?\n`**: `\r?`는 0 또는 1개 `\r`. LF 입력에 `\r` 없음 → `\r?`가 0개 매칭 → 원래와 동일.
- **`split('\n')` → `split(/\r?\n/)`**: LF 입력에 `\r` 없음 → `/\r?\n/`가 `\n`에서만 분할 → 결과 배열 동일.
- 따라서 **본 sprint의 모든 변경은 mac/linux에서 byte-identical 동작**. 회귀 위험은 오직 "오타/오변경"이며 grep 재검증 + 전 test로 차단.

---

## 4.1 API Contract / Module Boundary (M4)

S2의 모든 변경은 **함수 내부 구현(정규식 리터럴, split 인자)** 한정이며 **공개 시그니처·반환 타입·모듈 경계를 전혀 변경하지 않는다**. 따라서 API 호환성은 정의상 **100%**(파괴적 변경 0).

| 모듈 | export | 시그니처 변경 | 반환 변경 |
|------|--------|--------------|-----------|
| `lib/util/markdown-parse.js` | `extractFrontmatter/stripCodeBlocks/parseFrontmatterField` | 없음 | 없음(CRLF 입력에서 **더 정확**, LF 동치) |
| `lib/skill-orchestrator.js` | `parseSkillFrontmatter` | 없음 | 없음 |
| `lib/qa/utils/pattern-matcher.js` | (스캐너 내부) | 없음 | 없음 |
| `hooks/startup/context-init.js` | hook entry | 없음 | 없음 |
| `lib/qa/utils/file-resolver.js` | `getJsFiles` 등 | 없음 | 없음 |
| 기타 B/C 그룹 | — | 없음 | 없음 |

**M4 = 100** (no API surface change, all module boundaries preserved).

## 5. Self-Assessment (M8 ≥ 85)

| 항목 | 충족 |
|------|------|
| Context Anchor 상속 | ✅ plan §1 |
| 실측 기반 manifest | ✅ line-level before/after |
| Test plan L1-L5 | ✅ §3 |
| 회귀 불변식 증명 | ✅ §4 |
| YAGNI/scope 정직성 | ✅ Group D/E 검증-only 명시 |
| Windows 런타임 한계 명시 | ✅ L5는 mac 한정, CI matrix 후속 carry |

**M8 self-score: 90/100** (Windows 실런타임 미검증 -10, 정적+정합성으로 보완).

> **Status**: Design 완료 — do phase 진입.
