---
name: cc-version-history-v2147-v2159
description: CC v2.1.146 → v2.1.159 영향 분석 history (ADR 0003 16번째 정식 적용, 13-version 대형 누적 batch ≈210 bullets, Breaking 0 / Breaking-equivalent 0, ENH-317 CANCELLED /simplify 복원 deferred 정책 정당화, 신규 ENH 0건 12-cycle 연속, 차별화 6/6 streak 갱신 #56293→17 #57317→11 #58904→7, 112 consecutive milestone, R-2 true skip 2건 v151/v155, Phase 1.5 사상 최대 errata 차단)
metadata:
  type: project
---

# CC v2.1.146 → v2.1.159 영향 분석 history

## 1. 메타데이터

- **분석 일자**: 2026-06-01
- **분석 대상**: CC v2.1.146 → v2.1.159 (**13-version 대형 누적 batch** — 직전 v2.1.146 분석 이후 미분석 13버전 일괄 처리)
- **게시 버전**: 11개 (v147/148/149/150/152/153/154/156/157/158/159)
- **R-2 true skip**: 2건 (v2.1.151 + v2.1.155) — npm 부재 + GitHub tag 부재 + CHANGELOG header 부재 triple-confirmed
- **Total bullets (verbatim 검증)**: ≈210 (v147:33 / v148:1 / v149:26 / v150:1 / v152:33 / v153:36 / v154:44 / v156:1 / v157:33 / v158:1 / v159:1)
- **dist-tags**: latest=2.1.159 / stable=2.1.150 / next=2.1.159
- **ADR 0003 적용**: **16번째 정식 적용 (16-cycle consistency milestone ✦)**
- **누적 연속 호환**: 101 → **112** (v2.1.34 ~ v2.1.159, R-2 v134/135/151/155 skip 미포함)

## 2. 최종 판정

- **크리티컬 회귀**: 0건 (bkit v2.1.21 무수정)
- **Breaking**: 0건 / **Breaking-equivalent**: 0건 (v147 `/simplify` rename이 v152·v154에서 복원되어 자기해소)
- **bkit-friendly HIGH**: 2건 — F1 (v152 `hookSpecificOutput.sessionTitle` 공식 문서화 → bkit ENH-226 미문서 의존 → 공식 계약 격상) / F2 (v147 multi-Agent frontmatter drop fix → bkit 12 agents 보호)
- **자동수혜 HIGH**: 1건 (v154 Opus 4.8 default high-effort, bkit 17 opus agents + ENH-300)
- **자동수혜 MEDIUM**: 3건 (X3 effort frontmatter / X4 Opus thinking fix / X8 MCP env)
- **신규 ENH**: 0건 (**12-cycle 연속**)
- **ENH-317 CANCELLED (MOOT)** — `/simplify` 복원으로 직전 cycle deferred rename 무효화

## 3. /simplify ↔ /code-review Saga (3회 의미 flip 종결)

| 버전 | 변경 | NET 의미 |
|------|------|---------|
| v146 | Renamed /simplify → /code-review (effort level) | rename (ENH-317 deferred 생성) |
| v147 | "old cleanup-and-fix behavior has been removed" | /simplify 제거 강화 |
| v152 | "/simplify now invokes /code-review --fix" | /simplify 재도입 (alias) |
| v154 | "/simplify now runs cleanup-only review ... instead of /code-review --fix" | /simplify 독립 복원 (cleanup) |

**NET at v2.1.159**: /simplify(cleanup) + /code-review(bug-hunt + effort) 둘 다 valid. bkit `/simplify` 10 surface(lib/intent/language.js:147 = cleanup 의미)와 **정확히 일치**.

**→ ENH-317 CANCELLED**. bkit deferred 결정 정당화 — v147 rename 강행 시 v154 revert 필요했을 것. **"churny single-release rename은 강행하지 말고 deferred" 정책 실증 사례**.

## 4. ENH YAGNI 결과 (신규 0건)

| ENH | CC feature | 판정 |
|-----|-----------|------|
| ENH-317 | /simplify rename (reverted v154) | **CANCELLED** |
| ENH-324 | MessageDisplay hook (v152) | DROP (use case 부재) |
| ENH-325 | disallowed-tools frontmatter (v152) | DROP (allow-list 46 우위) |
| ENH-326 | multi-Task fix (v147) | DROP-code + 선택 regression TC |
| ENH-327 | dynamic /workflows (v154) | DROP-strategic-watch |
| ENH-328 | reloadSkills (v152) | DROP (정적 skills) |

## 5. 차별화 6/6 streak 갱신

| Issue | ENH | v2146 base | v2159 | 비고 |
|-------|-----|:---:|:---:|------|
| #56293 caching 10x | ENH-292 | 16 | **17** | /workflows 병렬 spawn 증폭 → moat 강화 ★ |
| #57317 PostToolUse drop | ENH-303 | 10 | **11** | 결정적 |
| #58904 heredoc bypass | ENH-310 | 6 | **7** | OPEN 결정적 |

v147~v159 어떤 bullet도 3건 미해결. v154 `/workflows`는 sequential-first cache warmup 미강제 → ENH-292 대체 아닌 강화.

## 6. R-Series Regression Tracker

| 패턴 | 본 batch 증감 | 비고 |
|------|------------|------|
| R-1 silent npm publish | +0 | v150/v159 "internal" 모두 CHANGELOG+tag 존재 |
| R-2 true semver skip | **+2** | v2.1.151 + v2.1.155 triple-confirmed |
| R-3 hotfix chain | +4 | v147→v148(Bash 127) / v147→v153(MCP reconnect) / v153→v157(tmux copy) / v154→v156(Opus thinking) |

## 7. Phase 1.5 게이트 — 사상 최대 errata 차단

- 첫 raw fetch 요약 라인 합계 **~265** (over-count) — v147:39/v149:30/v152:38/v153:45/v154:69/v157:39 (요약 모델 과다 집계)
- 같은 fetch verbatim bullet 직접 집계 = 33/26/33/36/44/33
- cc-version-researcher 독립 verbatim 집계와 **±2 내 수렴** (208 vs 210)
- **over-count ~55 bullets 차단** = errata learning gate 도입 이후 최대 규모 (직전 최대 v145 under-count 2)

## 8. 메모리 정정 (필수)

| # | 항목 | 기존 | 정정 |
|---|---|---|---|
| 1 | bkit 버전 | v2.1.17 (v2146 보고서) | **v2.1.21** (4단계 상승, 실측) |
| 2 | agents | session-start 배너 "34" | **40** (ls agents/*.md) |
| 3 | allowed-tools frontmatter | 45 | **46** (skills 44 + commands 2) |
| 4 | lib modules | 174 (session-start) | **188** (22 subdirs) |
| 5 | 연속 호환 | 101 | **112** (+11 게시 버전) |
| 6 | cto-lead Task() | (분석가 16) | **38** |

## 9. 신규 모니터

| ID | Issue | Priority | 근거 |
|----|-------|----------|------|
| MON-CC-NEW-CHOICE-LOOP | #64447 | P1 | infinite loop awaiting user choice, v154 MCQ behavior 인접, AskUserQuestion surface |
| MON-CC-NEW-BG-OTEL-DROP | #64436 | P2 | background sessions drop OTEL logs, bkit telemetry 흐름 |

## 10. 권장 CC 버전

| 분류 | 버전 | 근거 |
|------|------|------|
| **균형** | **v2.1.159 즉시 격상** | Opus 4.8 high-effort + ENH-300 정합 + v156 fix |
| **보수적** | **v2.1.123 → v2.1.150 stable 격상 결정** | drift +36 extreme-critical zone |

## 11. 차후 cycle 트리거

- v2.1.160+ 출시 시 (ADR 0003 17번째)
- #56293/#57317/#58904 streak 해소 또는 fix bullet 등장 시
- v154 `/workflows`가 cache-aware dispatch 추가 시 (#56293 해소 → ENH-292 calculus 변경)
- F7 lean-prompt token baseline가 ENH-292 cache threshold 영향 시

## 12. 분석 보고서

**위치**: `docs/04-report/features/cc-v2146-v2159-impact-analysis.report.md`

## 13. Related memories

- [[cc-version-history-v2144]] — 직전 cycle (single+bumper-twin, ADR 0003 13번째)
- v2145-v2146 report — ENH-317 생성 cycle (본 cycle에서 CANCELLED, deferred 정책 정당화)
