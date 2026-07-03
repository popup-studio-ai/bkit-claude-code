# 갭 분석 — 런타임 phase 인지 스킬 guidance (이슈 #135, v2.1.28)

> 단계: Check · 설계 ↔ 구현 일치도

## 1. 설계 → 구현 일치

| 설계 항목 (design.ko §) | 구현 | 근거 |
|---|---|---|
| `orchestrateSkillPost` frontmatter 순수 유지 (§1) | ✅ | 자체 문자열 EN i18n 외 guidance 로직 불변 |
| `runSkillInvocationEffects`에서 frontmatter 후 보강, 빈 경우 가드 (§1) | ✅ | effects.js 3b: `suggestions` 빈 경우만, fail-open try/catch |
| 신규 모듈 `runtime-guidance.js`의 `resolveRuntimeGuidance` (§2) | ✅ | 파일 생성, 단일 주 export |
| `GUIDANCE_ELIGIBLE = {pdca, sprint}` (§2.1) | ✅ | `size===2` 검증, 유틸→`{}` |
| PDCA `getNextPdcaActionAfterCompletion` 재사용 (§2.2) | ✅ | 소스 참조, IG "SSoT 재사용" 테스트 |
| `AGENT_BY_PHASE` 기존 쌍의 상위집합 (§2.2) | ✅ | do→gap-detector, check→pdca-iterator 유지 + design→design-validator, qa→qa-lead |
| Sprint `buildNextActions` + sprint index SSoT 재사용 (§2.3) | ✅ | `resolveSprint`가 `getSprintIndexFile`+`safeReadJson`로 index 읽음 |
| `detector.readLanguage` 언어 인지 (§2.4) | ✅ | `safeReadLanguage`, `GUIDANCE_MSG {en,ko}` |
| 기존 한국어 문자열 → 언어 인지 (§3 sweep) | ✅ | `skill-orchestrator.js` `GUIDANCE_STRINGS` + `_guidanceLang` |
| fail-open, phase 테이블 중복 없음, dedup 유지 (§4) | ✅ | 전부 `try/catch → {}`, 전이 맵 중복 없음, dedup 키 불변 |

**일치율: 100%** (설계 10항목 전부 명세대로 구현). 범위 이탈 없음, 설계 초과 추가 없음.

## 2. 경험적 동작 (런타임 재현, 전 → 후)

| 호출 | 이전 (#135 버그) | 이후 (수정) |
|---|---|---|
| `pdca plan X` | `{}` (guidance 없음) | `Next: /pdca design X — Design the architecture.` |
| `pdca do X` | `{}` | `Next: /pdca analyze X` + `Suggested agent: gap-detector` |
| `pdca status <feat>` | `{}` | live phase 해소 → 다음 명령 + 에이전트 |
| `sprint status` | `{}` | `Next: /sprint phase <id> --to <next>` |
| `control level` | `{}` | `{}` (의도된 침묵 — 유틸) |
| `deploy` / `code-review` | frontmatter (KO) | frontmatter (EN) — 경로 불변, i18n화 |

## 3. 테스트 & 품질 게이트 결과

- 신규: `test/regression/issue-135-multiaction-guidance.test.js` — **23/23 PASS**
  (root-cause 가드, pdca 해소, 유틸 침묵, 비적격 skip, fail-open, SSoT 재사용
  가드, EN/KO parity, e2e 양 경로).
- 갱신: `test/unit/skill-orchestrator.test.js` SO-023..028 KO→EN — **46/46 PASS**.
- 비회귀: `issue-132-slash-reach` **7/7**, `skill-invocation-effects` **5/5**.
- CI 게이트 (로컬): domain-purity ✓, deadcode ✓ (195 모듈, dead 0),
  docs-code-sync ✓, guards ✓, validate-plugin --strict ✓ (0 에러),
  integration-runtime 23/23, l2-smoke 105/105, invocation-inventory 213/213,
  docs-code-sync.test 36/36, bkit-full-system 36 (버전 bump 대기).

## 4. 평결

Check 게이트 M1 (matchRate ≥ 90) 100%로 충족. critical 이슈 없음 (M3=0).
QA 단계(라이브 `claude -p` / `--plugin-dir .`) 후 Docs=Code sync + 버전
v2.1.28 bump 준비 완료.
