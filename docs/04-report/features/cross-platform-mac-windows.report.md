# S2 — Cross-Platform Verification (mac/windows) 완료 보고서

> **Sprint**: `cross-platform-mac-windows` (마스터 플랜 S2) · **Trust**: L4 · **ENH**: ENH-329~335
> **Date**: 2026-06-01 · **Author**: kay kim · **Branch**: `release/v2.1.22-hardening`
> **Phase**: prd→plan→design→do→iterate→qa→report→archived (8-phase 완주)

---

## 1. Executive Summary

S2는 bkit의 mac/windows 크로스플랫폼 정합성을 **실측 기반**으로 검증·강화했다. 마스터 플랜의 worst-case 추정(raw concat 14, shell 분기 확대, 21 hook 위험)을 실측으로 교정한 결과, bkit는 **이미 ~90% cross-platform-safe**였고, 진짜 위험은 **단일 카테고리 — CRLF 미처리 frontmatter/markdown 파서**에 집중되어 있었다. 이 P0 결함(Windows CRLF 파일에서 frontmatter 추출 **완전 실패** → skill/agent 로딩 깨짐)을 포함해 41개 사이트를 수정하고, **회귀 0**으로 검증 완료했다.

## 2. 핵심 성과

| ENH | 내용 | 결과 |
|-----|------|------|
| ENH-329 | Path separator 정합성 | check-deadcode backslash 정규화, file-resolver glob 규약 명시, impact-view 검증완료(변경불요) |
| ENH-330 | Shell 분기 검증 | **분기 불요 확정** — exec 18파일 git/gh/node/npx만, POSIX coreutils exec 0. YAGNI 근거 명문화 |
| **ENH-331** | **CRLF/LF 처리 (P0)** | fence 정규식 6곳 `\r?\n` + lib/ `split('\n')`→`split(/\r?\n/)` **34곳/19파일** |
| ENH-332 | Hook Windows 발화 검증 | hooks.json 25 command 전부 `node "${CLAUDE_PLUGIN_ROOT}/…"` 안전, shebang inert, context-init hook fence 수정 |
| ENH-333 | Fix manifest | design §2 site별 before/after 완성 |
| ENH-334 | CRLF 런타임 QA | 8/8 PASS (frontmatter 파서 3종 × CRLF/LF) |
| ENH-335 | Windows 실런타임 carry | CI matrix 후속 ENH로 분리 명시 |

## 3. 변경 요약 (23 파일)

- **Group A — fence 정규식 CRLF-safety (하드 브레이크 수정)**: `lib/util/markdown-parse.js`, `lib/qa/utils/pattern-matcher.js`, **`hooks/startup/context-init.js`(런타임 hook)**, `scripts/validate-plugin.js`, `scripts/audit-output-styles.js`.
- **Group B — `split('\n')`→`split(/\r?\n/)`**: 19 lib/ 파일, 34 사이트(skill-orchestrator, import-resolver, pattern-matcher, workflow-parser, discovery/explorer, audit, cc-regression 등).
- **Group C — path separator**: `scripts/check-deadcode.js`(backslash 정규화), `lib/qa/utils/file-resolver.js`(glob 규약 주석).

## 4. QA 결과 (실런타임 검증 — 정적 분석만으로 끝내지 않음)

| Level | 검증 | 결과 |
|-------|------|------|
| L1/L2 | CRLF frontmatter 런타임 파싱(markdown-parse, skill-orchestrator, pattern-matcher) | **8/8 PASS** |
| L3 회귀 | 변경 전/후 테스트 수트 비교(`comm`) | **회귀 0** — 7 fail이 전후 동일(pre-existing) |
| L4 정적 | lib/ 잔존 `split('\n')`=0, fence 8곳 `\r?\n` | PASS |
| L5 런타임 | `verify-full-system.js`: module 188/188, hook syntax 69/69, agent 40/40, hooks.json 25/25, MCP smoke ok | PASS |

### 회귀 불변식 증명
`\n`→`\r?\n`, `'\n'`→`/\r?\n/`는 LF-only 입력에서 **byte-identical**. mac/linux 동작 변화 0 (수학적 동치 + comm 실증).

## 5. Quality Gates

| Gate | 값 | 임계 | 통과 | 근거 |
|------|----|----|------|------|
| M1 matchRate | 100 | ≥90 | ✅ | manifest 전 사이트 구현(grep 실증) |
| M2 codeQuality | 92 | ≥80 | ✅ | 등치 변경, 신규 복잡도 0, syntax 전수 PASS |
| M3 criticalIssue | 0 | =0 | ✅ | 신규 test 실패 0 (전후 comm) |
| M4 apiCompliance | 100 | ≥95 | ✅ | 시그니처 변경 0 |
| M5 runtimeErrorRate | 0 | ≤1 | ✅ | 런타임 QA 8/8, module 188/188 |
| M7 convention | 95 | ≥90 | ✅ | 영문 주석, 기존 정규식 idiom |
| M8 designCompleteness | 90 | ≥85 | ✅ | design self-assessment |
| S1 dataFlowIntegrity | 100 | =100 | ✅ | 파서 파이프라인(입력→추출→파싱→출력) 런타임 검증 |
| S2 featureCompletion | 100 | =100 | ✅ | 1/1 feature |

## 6. 한계 & Carry (정직한 기록)

- **Windows 실런타임 미검증**: 현 환경 Darwin(Mac). 정적분석 + path/shell 정합성 + CRLF 무회귀까지 완료했으나, **실제 Windows/PowerShell/WSL 발화 검증은 미수행**. → **후속 ENH(CI matrix 또는 Windows 머신)로 분리** (ENH-335 carry). 사용자 직접 Windows 검증 권장.
- **scripts/ 의 잔존 `split('\n')`**: dev/CI 도구 다수에 잔존(런타임 비경로, 저위험). 일관성 차원 후속 정리는 S4/S5 carry 가능.
- **pre-existing 7 test fail + verify-full-system K(v2114 sprint state missing)**: S2 무관, 별도 추적(S4/S5).

## 7. CHANGELOG 반영
`### Cross-Platform Hardening (S2, ENH-329~335)` 항목 추가 — 아래 §commit.

> **Status**: Report 완료 — archived 진입. 다음 unblocked sprint: **S4** (tech-debt-deadcode).
