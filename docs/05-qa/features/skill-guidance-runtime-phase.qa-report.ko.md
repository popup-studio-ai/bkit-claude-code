# QA 리포트 — 런타임 phase 인지 스킬 guidance (이슈 #135, v2.1.28)

> 단계: QA · 방법: 실제 프로덕션 hook 진입점(`--plugin-dir .` 세션) + 전체
> contract 게이트 + main 베이스라인 회귀 diff.

## 1. 프로덕션 진입점 QA (CC가 실행하는 바로 그 코드)

Claude Code가 하는 것과 동일하게 페이로드를 실제 hook 스크립트에 stdin 주입.

### SLASH 경로 — `scripts/user-prompt-expansion-handler.js`

| 호출 | stdout guidance | 판정 |
|---|---|---|
| `/bkit:pdca plan login` | `Next: /pdca design login — Design the architecture.` | ✅ 수정됨(이전 빈 값) |
| `/bkit:pdca do login` | `Next: /pdca analyze login …` + `Suggested agent: gap-detector …` | ✅ |
| `/bkit:sprint status` | `Next: /sprint phase <id> --to plan …` | ✅ |
| `/bkit:control level` | (빈 출력) | ✅ 의도된 침묵 |

### MODEL 경로 — `scripts/skill-post.js`

| 호출 | JSON 출력 | 판정 |
|---|---|---|
| `bkit:pdca` args `do login` | `nextSkill: "pdca analyze login"` + `suggestedAgent: gap-detector` | ✅ 수정됨 |
| `bkit:deploy` | `suggestedAgent: gap-detector` (영어) | ✅ 경로 불변, i18n화 |

양 호출 경로 모두 대표 라우터에 대해 런타임 guidance를 표면화함.

## 2. Contract / 릴리스 게이트 (로컬, = CI 스텝)

| 게이트 | 결과 |
|---|---|
| `check-domain-purity.js` | ✅ forbidden import 0 |
| `check-deadcode.js` | ✅ 195 모듈, dead 0 |
| `check-guards.js` | ✅ 24 guards |
| `validate-plugin.js --strict` | ✅ 0 에러 (44 skills / 34 agents / 2 cmds) |
| `docs-code-sync.js` | ✅ 카운트 전부 일관 |
| `test/contract/integration-runtime.test.js` | ✅ 23/23 |
| `test/contract/l2-smoke.test.js` | ✅ 105/105 |
| `test/contract/invocation-inventory.test.js` | ✅ 213/213 |
| `test/contract/docs-code-sync.test.js` | ✅ 36/36 |
| `tests/qa/bkit-full-system.test.js` | ✅ 36 (버전 bump 대기) |

## 3. 타깃 + 베이스라인 회귀

- 신규 `issue-135-multiaction-guidance.test.js`: **23/23**.
- `skill-orchestrator.test.js` (6건 KO→EN 갱신): **46/46**.
- `issue-132-slash-reach`: **7/7**; `skill-invocation-effects`: **5/5**.
- **광범위 스위트 베이스라인 diff** (`run-all.js --unit --regression`): main =
  `2003 PASS / 40 FAIL`; 수정 포함 = `2003 PASS / 40 FAIL` — **동일 → 회귀
  0건**. 40건 pre-existing 실패는 run-all.js의 stale 등록(예: `context-loader`,
  `impact-analyzer`, `invariant-checker`, `scenario-runner` — 파일 부재)으로 이번
  변경과 무관하며 CI 게이트 스위트에 포함되지 않음. 있는 그대로 보고, #135 범위 외.

## 4. 평결

**QA PASS.** #135 증상이 양 프로덕션 진입점에서 해소; 모든 CI 게이트 green;
main 베이스라인 대비 회귀 0건. Docs=Code sync + 버전 v2.1.28 bump 준비 완료.
