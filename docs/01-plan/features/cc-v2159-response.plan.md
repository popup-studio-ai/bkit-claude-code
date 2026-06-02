# S1 — CC v2.1.159 Response 계획서 (PRD + Plan)

> **Sprint**: `cc-v2159-response` (마스터 플랜 S1) · **Branch**: `release/v2.1.22-hardening`
> **Trust**: L4 · **Scope**: P0 (foundational, first) · **ENH**: ENH-324 ~ ENH-328
> **dependsOn**: — (독립, 최선행) · **estTokens**: ~33K
> **Date**: 2026-06-01 · **Author**: kay kim (bkit maintainer)
> **입력 근거**: `docs/04-report/features/cc-v2146-v2159-impact-analysis.report.md`

---

## 1. Context Anchor (마스터 플랜 §1 상속)

| Key | Value |
|-----|-------|
| **WHY** | CC가 v2.1.146(직전 분석) 이후 13개 버전 진행하여 v2.1.159(installed/latest)에 도달. 그 사이 (a) ENH-317(/simplify→/code-review rename, deferred)이 CC v154에서 **되돌려져 MOOT**, (b) 권장 CC 버전이 drift +36(extreme), (c) bkit-friendly 변경 2건 + 신규 회귀 monitor 후보 2건 발생. S1은 이 분석 결과를 **bkit 내부 상태(CHANGELOG·monitor·sessionTitle 검증)에 반영**하는 foundational sprint. |
| **WHO** | bkit 유지보수자(kay), 외부 dogfooder(권장 버전 신뢰), CC v2.1.159 사용자(Opus 4.8 + ENH-300 effort 정합). |
| **WHAT** | ENH-324 ENH-317 취소 기록 / ENH-325 권장 버전 bump 결정 / ENH-326 sessionTitle resume 검증 / ENH-327 multi-Agent frontmatter 수혜 검증 / ENH-328 monitor 2건 등록 + 차별화 streak 갱신. |
| **WHAT NOT** | CC v152 disallowed-tools/MessageDisplay 도입(DROP), 실제 README/문서 수치 반영(S5 docs-sync로 이관 — S1은 **결정만**), 코드 대규모 변경. |
| **RISK** | (a) sessionTitle resume 경로가 실제로는 미발화일 가능성 → 검증으로 확인. (b) multi-Agent frontmatter가 inline comma form이 아니라 무영향일 수 있음(분석상 1 edge) → 검증으로 확정. (c) monitor 등록 위치(현 bkit monitor 레지스트리)가 코드인지 문서인지 확인 필요. |
| **SUCCESS** | ENH-324~328 acceptance 전부 충족, M8/M10 gate green, 코드 회귀 0, 후속 sprint(S5)에 넘길 "버전 수치 반영" 항목이 명확히 carry. |
| **SCOPE** | CHANGELOG 1 entry(취소) + monitor 2건 등록 + 검증 2건(sessionTitle resume / multi-Agent) + 버전 권고 결정 기록. 코드 변경 최소. |

---

## 2. ENH 상세 (ENH-324 ~ ENH-328)

### ENH-324 — ENH-317 (/simplify→/code-review rename) 취소 기록
- **배경**: 직전 cycle(v2146)이 CC v147의 `/simplify`→`/code-review` rename을 Breaking-equivalent로 보고 ENH-317(deferred)을 생성. 그러나 CC v152(`/simplify`=`/code-review --fix` alias 재도입)·v154(`/simplify`=cleanup-only 독립 복원)에서 **되돌려짐**. NET: `/simplify`(cleanup) + `/code-review`(bug-hunt+effort) 둘 다 valid → bkit의 `/simplify` 10개 코드 surface 유효.
- **작업**: `CHANGELOG.md`에 v2.1.22 항목으로 "ENH-317 CANCELLED (MOOT) — CC v154가 v147 rename을 복원, bkit `/simplify` cleanup 의미가 CC와 정확히 일치, deferred 정책 정당화" 명시.
- **acceptance**: CHANGELOG에 취소 사유 + CC 버전 근거(v147/v152/v154) 기재. bkit 코드의 `/simplify` 10 surface는 **변경 없음**(valid 확인).

### ENH-325 — 권장 CC 버전 bump 결정 (수치 반영은 S5로 carry)
- **결정**: 균형 권장 v2.1.146 → **v2.1.159** (Opus 4.8 default high-effort = bkit 17 opus agents + ENH-300 effort-aware 정합, v156 thinking-block fix). 보수적 권장 v2.1.123 → **v2.1.150 stable** (drift +36 extreme 완화).
- **작업(S1)**: 결정을 본 plan + S1 report에 기록. **README/README-FULL/bkit.config 등 실제 문구 수정은 S5 docs-sync에서 일괄**(S1에서 분산 수정 금지 — drift 재발 방지).
- **acceptance**: 버전 권고 결정이 명확히 문서화 + S5 carry 항목 등록.

### ENH-326 — CC v152 hookSpecificOutput.sessionTitle 공식화 대응 (resume 검증)
- **배경**: CC v152가 SessionStart hook의 `hookSpecificOutput.sessionTitle`을 startup+**resume**에서 공식 지원. bkit은 `hooks/session-start.js:484`(ENH-226)에서 이미 emit. 미문서 의존이 공식 계약으로 격상.
- **작업**: `hooks/session-start.js`가 **resume 시에도** sessionTitle을 발행하는지 코드 검증. resume 경로(매개변수/조건)가 startup과 동일하게 sessionTitle을 산출하는지 확인. 미흡 시 ENH로 보강(없으면 검증 PASS 기록).
- **acceptance**: resume 경로 sessionTitle 발화 여부 확정(코드 근거 line 인용). 보강 필요 시 패치, 불필요 시 PASS 기록.

### ENH-327 — CC v147 multi-Agent frontmatter drop fix 수혜 검증
- **배경**: CC v147이 "plugin agents declaring multiple Agent() types in tools: frontmatter dropping all but the last" 수정. bkit은 12 agents가 multiple Task() 선언(cto-lead 38 Task()). 분석상 bkit은 YAML block-list 형식이라 inline comma 버그에 사실상 무영향(1 edge)이나 fix로 미래 안전성 확보.
- **작업**: bkit agents의 Task() 선언 형식 확정(YAML block-list vs inline comma) + 12 agents 전수 확인. inline comma form 존재 여부 grep.
- **acceptance**: bkit agent frontmatter 형식 확정 + 영향도 기록(무영향이면 그 근거, 영향 있으면 fix 수혜 명시).

### ENH-328 — 신규 monitor 2건 등록 + 차별화 streak 갱신
- **작업**:
  - MON-CC-NEW-CHOICE-LOOP **P1** (#64447 infinite loop awaiting user choice, v154 MCQ behavior 인접, AskUserQuestion surface)
  - MON-CC-NEW-BG-OTEL-DROP **P2** (#64436 background sessions drop OTEL logs)
  - 차별화 streak 갱신 기록: #56293→17(ENH-292), #57317→11(ENH-303), #58904→7(ENH-310). v154 `/workflows` parallel spawn이 #56293 AMPLIFY → ENH-292 moat 강화.
- **선행 확인**: bkit의 monitor 레지스트리가 코드(lib/cc-regression 등)인지 문서(docs/06-guide/cc-*.guide.md)인지 design phase에서 확정 후 등록.
- **acceptance**: 2 monitor 등록(올바른 위치) + streak 갱신 기록.

---

## 3. Module Map (영향 파일)

| 파일 | 변경 | ENH |
|------|------|-----|
| `CHANGELOG.md` | ENH-317 취소 + S1 항목 추가 | 324, 328 |
| `hooks/session-start.js` | **검증 only**(resume sessionTitle) — 보강 필요 시 patch | 326 |
| `agents/*.md` (12 multi-Task) | **검증 only**(frontmatter 형식) | 327 |
| monitor 레지스트리 (design에서 위치 확정) | 2 monitor 등록 | 328 |
| 본 plan + S1 report | 버전 권고 결정 + streak 기록 + S5 carry | 325, 328 |

> **불변**: S1은 README/bkit.config/plugin.json 등 **사용자 노출 수치를 직접 수정하지 않음** — S5 docs-sync 일괄(drift 재발 방지 원칙).

---

## 4. Quality Gate (S1)

| Gate | Target | 비고 |
|------|--------|------|
| M8 designCompleteness | ≥85 | plan+design 완성도 |
| M10 regressionGuard | 0 new | 코드 회귀 0 (검증 중심 sprint) |
| M1 matchRate | 100 | design ↔ 구현 일치 |
| M3 criticalIssue | 0 | code-analyzer |

---

## 5. Test Plan Matrix (L1-L5)

| Level | 대상 | 방법 |
|-------|------|------|
| L1 unit | session-title.js resume 분기 | 기존 test 확인 + 필요시 추가 |
| L3 contract | 12 agents frontmatter Task() 파싱 | grep + frontmatter 검증 |
| L5 E2E (real) | `--plugin-dir .`/`-p`로 SessionStart resume 시 sessionTitle 발화 실제 동작 | **실제 런타임 검증** (사용자 지침) |

---

## 6. S5 Carry 항목 (명시)

- README/README-FULL 권장 CC 버전 문구: 균형 v2.1.159 / 보수 v2.1.150 (ENH-325 결정 → S5 반영)
- 차별화 streak 수치(#56293→17 등) 문서 반영 (S5)

---

---

## 7. 검증 결과 기록 (do-phase 진입 전 read-only 조사 완료)

### ENH-327 — multi-Agent frontmatter (v147 fix) ✅ CONFIRMED 무영향
- grep `Task\([^)]+\),[ ]*(Task|Agent)\(` → 유일 hit `agents/pm-lead.md:45`는 **본문 산문**("Task(pm-discovery), Task(pm-strategy) etc. work as 1-level subagents."), `tools:` frontmatter 아님.
- bkit frontmatter는 **YAML block-list**(한 줄당 Task() 1개). v147 버그(inline comma form에서 마지막 외 drop)에 **bkit 무영향**. cto-lead 38 Task() 등 12 agents 전부 안전.
- **결론**: fix는 미래 안전성(향후 inline 사용 시 보호). 코드 변경 불필요.

### ENH-326 — sessionTitle resume (v152 공식화) ✅ PASS (정적), L5 런타임 확정 대기
- `hooks/session-start.js:301` `generateSessionTitle(...)` **무조건 호출**(startup-only 가드 없음) → `hookSpecificOutput.sessionTitle`(line 476/484)로 emit.
- SessionStart hook은 CC가 startup+resume 모두 발화 → resume 경로도 sessionTitle 산출. **startup 한정 분기 없음 확인**.
- **결론**: resume 경로 PASS(정적). QA phase에서 `--plugin-dir .`/`-p` 실제 런타임 발화 확정 예정(사용자 지침: 정적만으로 끝내지 않음).

> **Status**: plan + 검증 2건 완료. 다음: design phase(monitor 레지스트리 위치 확정) → do-phase(ENH-324 CHANGELOG 취소 + ENH-328 monitor 2건 등록) → gap-detector → QA 실런타임 검증.
