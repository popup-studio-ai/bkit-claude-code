# S2 — Cross-Platform Verification (mac/windows) 계획서 (PRD + Plan)

> **Sprint**: `cross-platform-mac-windows` (마스터 플랜 S2) · **Branch**: `release/v2.1.22-hardening`
> **Trust**: L4 · **Scope**: P0 · **ENH**: ENH-329 ~ ENH-335
> **dependsOn**: — (독립) · **estTokens**: ~67K
> **Date**: 2026-06-01 · **Author**: kay kim (bkit maintainer)
> **입력 근거**: 마스터 플랜 §10 S2 + 본 세션 실측 인벤토리(2026-06-01)

---

## 1. Context Anchor (마스터 플랜 §1 상속)

| Key | Value |
|-----|-------|
| **WHY** | bkit가 POSIX(mac/linux) 가정으로 작성된 코드가 잠재한다고 마스터 플랜이 추정(raw '/' concat 14곳, process.platform 2곳, shell-exec ~30, 21 hook). CC v2.1.159가 다수 Windows/PowerShell/WSL fix를 출시 → bkit도 Windows-safe 정합성을 확보해야 한다. **단, 본 세션 실측 결과 위험 표면은 추정보다 좁다(§3 참조).** |
| **WHO** | 1차 Windows/WSL 환경 bkit 사용자, 2차 외부 dogfooder(marketplace 설치자), 3차 컨트리뷰터. Stakeholder: kay kim. |
| **WHAT** | ENH-329 path separator 정합성 / ENH-330 shell 분기 검증 / ENH-331 **CRLF/LF 처리(핵심)** / ENH-332 hook Windows 발화 검증 / ENH-333 fix manifest. |
| **WHAT NOT** | 양 OS CI matrix 인프라 신규 구축(검증만, 인프라는 후속 ENH) · 실제 Windows 런타임 발화 검증(현 환경 Darwin → 정적분석+정합성 수정까지) · 신규 기능. |
| **RISK** | (a) POSIX→cross-platform 수정이 mac/linux 회귀 유발 — 매 수정마다 전 test 실행으로 완화. (b) 양 OS CI 부재 → Windows 실런타임 미검증, 후속 ENH로 분리. (c) `split('\n')` 일괄 변경이 의도치 않은 동작 변경 — `\r?\n`은 LF에서 기존과 동치라 무위험(§5.2 증명). |
| **SUCCESS** | (1) 모든 frontmatter/markdown/yaml 파서가 CRLF-safe(`split(/\r?\n/)`). (2) fs path split 사이트가 backslash-safe. (3) shell-exec 사이트가 cross-platform 바이너리만 사용함을 검증·문서화. (4) 8 hook + 25 hooks.json command가 Windows-safe임을 검증. (5) fix manifest(site별 before/after) 완성. (6) mac 회귀 0 (전 test green). |
| **SCOPE** | ENH-329~335. estTokens ~67K. gate M2/M3/M5/M7 + 수동 OS 검증. |

---

## 2. 실측 인벤토리 (2026-06-01, 본 세션 직접 측정)

> 마스터 플랜의 추정치를 실측으로 교정. **"틀린 추정을 그대로 구현하지 말 것"** 원칙.

| 항목 | 마스터 플랜 추정 | **실측** | 판정 |
|------|----------------|---------|------|
| `process.platform` 분기 | 2곳 (확대 필요) | **2곳** (`lib/cc-regression/defense-coordinator.js`, `lib/domain/guards/enh-254-fork-precondition.js`) | 정확 |
| raw `'/'` concat (`__dirname+'/'`, `cwd()+'/'`) | 14곳 | **0곳** | **추정 과대 — 이미 안전** |
| 백틱 `${x}/` 경로 패턴 | (포함) | 41곳 → 대부분 ratio/display 문자열(`${met}/${total}`), 실제 fs path 위험 ~3 | **대부분 무위험** |
| `path.join` 사용 | 349 | **349** | 이미 광범위 사용 |
| `path.sep` 사용 | — | 0 | split 사이트만 보완 |
| shell-exec 사이트 | ~30 | child_process require 18파일, exec 라인 62 | POSIX coreutils(find/wc/grep) **0** — git/gh/node/npx만 |
| POSIX 전용 명령(rm -rf/mkdir -p **실행**) | (위험) | **0곳 실행** (7 match 전부 방어패턴/안내메시지/permission rule) | **무위험** |
| `split('\n')` (CRLF 위험) | (CRLF 검증) | **41곳**, 그중 lib/ frontmatter·markdown·yaml 파서 ~30 | **진짜 핵심 위험** |
| `path.split('/')` (separator) | — | 5곳 (2곳 이미 `.replace(/\\/g,'/')` 정규화 → 안전, 3곳 보완) | 소규모 |
| hook .js 파일 | 21 hook | **8 .js** + hooks.json 25 command | 정합 확인 필요 |
| shebang `#!/usr/bin/env node` | — | 61파일 (hooks.json이 `node "path"`로 호출 → shebang inert, Windows 무위험) | 무위험 |

### 2.1 핵심 결론
bkit는 **이미 ~90% cross-platform-safe**다. path 구성은 `path.join`(349)에 의존하고 raw concat은 0, exec는 cross-platform 바이너리만 쓴다. **진짜 위험은 단 하나의 카테고리: CRLF 미처리 `split('\n')`** — Windows 사용자의 CRLF skill/agent/.md 파일을 파싱할 때 각 줄에 `\r`이 잔류해 frontmatter key/value 파싱이 깨진다(skill 로딩 실패). 이것이 S2의 P0 타깃이다.

---

## 3. ENH 상세 (ENH-329 ~ ENH-335)

### ENH-329 — Path Separator 정합성
- **대상**: fs 경로를 `'/'`로 split/비교하는 사이트 중 backslash 미정규화 3곳.
  - `lib/qa/utils/file-resolver.js:76` `pattern.split('/')` — glob 패턴(내부 const, forward-slash 규약) → 명시적 주석 + 방어.
  - `scripts/check-deadcode.js:129,133` — glob 결과 모듈경로 split. dev/CI 도구이나 Windows 개발자 위해 정규화.
  - `lib/ui/impact-view.js:77,96` — 이미 `.replace(/\\/g,'/')` 정규화됨 → **변경 불요, manifest에 "검증완료"로 기록**.
- **acceptance**: fs path split 사이트가 backslash 입력에도 안전.

### ENH-330 — Shell 분기 검증 (process.platform)
- **결정**: shell-exec ~18파일이 **git/gh/node/npx**만 사용하고 POSIX coreutils(find/wc/grep/cat) exec은 0이므로 **bash↔pwsh 분기 추가 불요**. 기존 `process.platform` 2곳으로 충분.
- **산출물**: "왜 분기가 불필요한가"를 fix manifest에 근거와 함께 명시(향후 회귀 방지 기준선). exec 18파일 cross-platform 바이너리 목록 검증.
- **acceptance**: exec 사이트 전수 검증 + 분기 불요 근거 문서화.

### ENH-331 — CRLF/LF 처리 (**P0 핵심**)
- **대상**: lib/ 런타임 경로의 파일내용 파싱 `split('\n')` → `split(/\r?\n/)`. 특히 frontmatter/markdown/yaml 파서.
  - 1순위(skill/agent 로딩 직접 영향): `lib/import-resolver.js`, `lib/skill-orchestrator.js`, `lib/pdca/workflow-parser.js`, `lib/util/markdown-parse.js`, `lib/discovery/explorer.js`, `lib/qa/utils/pattern-matcher.js`, `lib/qa/utils/file-resolver.js`
  - 2순위(파일 파싱): `lib/qa/test-plan-builder.js`, `lib/qa/scanners/shell-escape.js`, `lib/quality/sqm-history.js`, `lib/pdca/session-guide.js`, `lib/task/classification.js`
  - NDJSON/JSONL(bkit가 LF로 write → 저위험이나 일관성 위해 포함): `lib/audit/audit-logger.js`, `lib/audit/decision-tracer.js`, `lib/cc-regression/event-recorder.js`, `lib/cc-regression/token-accountant.js` 등
- **불변식**: `/\r?\n/`는 LF-only 입력에서 `'\n'`과 **완전 동치**(빈 캡처 없음) → mac/linux 무회귀.
- **acceptance**: lib/ 파일내용 split 전부 CRLF-safe, 전 test green.

### ENH-332 — Hook Windows 발화 검증
- **검증 결과(예비)**: hooks.json의 25 command가 전부 `node "${CLAUDE_PLUGIN_ROOT}/path.js"` 형식. node는 Windows에서 forward-slash 경로 허용 → 안전. shebang은 `node`로 직접 호출되므로 inert.
- **산출물**: 8 hook .js + 25 command 매핑표, Windows 발화 안전성 판정.
- **acceptance**: hook 호출 경로 전수 검증, Windows-unsafe 0.

### ENH-333 — Fix Manifest
- site별 before/after + safety justification + 회귀검증 결과를 design 문서 §에 집성.

### ENH-334 / ENH-335 — 예약
- ENH-334: 회귀 test 보강(CRLF 입력 단위 테스트 — 가능 시).
- ENH-335: S5 carry 항목 정리(Windows 실런타임 CI matrix 후속 ENH 제안).

---

## 4. Phase 로드맵 (8-phase)

| Phase | 산출물 | Gate |
|-------|--------|------|
| prd | 본 문서 §1 Context Anchor | M8 |
| plan | 본 문서 §3 ENH 분해 | M8 |
| design | `docs/02-design/features/cross-platform-mac-windows.design.md` — 정확한 fix manifest + test plan | M4, M8(≥85) |
| do | path-safe util + CRLF 일괄 수정 + 검증 문서 | M2,M3,M5,M7 |
| iterate | gap-detector matchRate 100 | M1(100) |
| qa | 실제 동작 검증(CRLF 입력 시뮬레이션 + 전 test) | M3(=0), S1 |
| report | `docs/04-report/features/cross-platform-mac-windows.report.md` + CHANGELOG | M10, S2 |
| archived | terminal → S4 unblock 평가 | — |

---

## 5. 위험 & 완화

| 시나리오 | 완화 |
|---------|------|
| `split(/\r?\n/)` 변경이 mac 회귀 | LF 입력 동치 증명(§3 ENH-331) + 전 test 실행 |
| 일괄 변경 누락/오변경 | site별 manifest + grep 재검증 + LSP/test |
| Windows 실런타임 미검증 한계 | 정직히 carry: 정적분석+정합성까지, CI matrix는 후속 ENH-335 |
| 과잉수정(불필요 분기 추가) | ENH-330 "분기 불요 근거" 명문화로 YAGNI 준수 |

> **Status**: Plan 완료 — design phase 진입.
