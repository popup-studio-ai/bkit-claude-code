# Design — CC v2.1.218 호환 대응 (bkit v2.1.31)

> **Feature**: cc-v2218-compat · **PDCA phase**: design · **Plan**: `docs/01-plan/features/cc-v2218-compat.plan.ko.md`
> 실행 가능한 변경 스펙. Do 단계는 본 문서를 그대로 구현.

## 1. 아키텍처 결정 (확정: A+위생 + qa-phase 옵션 B)

**근거 확정 (이슈 본문 gh 직접확인)**: `background: false`는 스케줄링(foreground)만 복원할 뿐 AskUserQuestion을 복원하지 **못한다**. `context: fork`는 스킬을 **foreground 서브에이전트**로 실행하고, AskUserQuestion(+EnterPlanMode/deferred tools)은 **서브에이전트 경계에서 박탈**되기 때문(#34592 스모킹건, #54892 regression). 유일 근본해법 = `context: fork` 제거(#54892 workaround).

따라서:
- **8개 producer 스킬**: `context: fork` 유지(격리 이득) + `background: false`로 218 스케줄링 회귀 복원. 대화형 불요.
- **qa-phase (옵션 B)**: `context: fork` **제거** → 메인 컨텍스트 실행 → AskUserQuestion 복원. qa-phase 본문 line 63-66에 이미 존재하는 대화형 게이트("*Ask user whether to continue or abort QA phase*", PRE-SCAN CRITICAL 시)가 **degraded plain-text → 진짜 AskUserQuestion**으로 복원됨.

## 2. 파일별 변경 스펙

### T1 — 8개 producer fork 스킬에 `background: false` (P1)
각 `skills/<name>/SKILL.md` frontmatter의 `context: fork` 바로 다음 줄에 추가:
```yaml
context: fork
background: false
```
대상 (8, qa-phase 제외): `phase-1-schema`, `phase-2-convention`, `phase-3-mockup`, `phase-4-api`, `phase-5-design-system`, `phase-8-review`, `zero-script-qa`, `skill-status`.
- zero-script-qa는 `context: fork`가 line 10 → 동일하게 바로 다음 줄.
- **Do 선결 검증**: bkit frontmatter 파서(`lib/util/frontmatter.js`, `lib/skill-orchestrator.js:parseSkillFrontmatter`)가 새 boolean 키 `background`를 무해하게 통과하는지 확인. 파서는 generic kv 루프(:159)로 미지 키를 raw map에 담을 뿐 dispatch 안 함 → 안전 예상, 실측 확인.

### T2 — qa-phase `context: fork` 제거 (옵션 B, P1)
`skills/qa-phase/SKILL.md`:
1. frontmatter line 3 `context: fork` **제거**(메인 컨텍스트 실행). `background:` 미추가(fork 아니므로 218 background-default 무관).
2. `AskUserQuestion`은 allowed-tools에 **유지**(이제 메인 컨텍스트라 정상 동작).
3. 본문 PRE-SCAN 게이트(현 line 63-66)를 **AskUserQuestion 명시**로 승격: CRITICAL 발견 시 continue/abort를 AskUserQuestion으로 물음(plain-text fallback 아님).
- **주의**: AskUserQuestion은 qa-phase 본문(메인)에서 직접 호출해야 함 — qa-lead 등 위임 서브에이전트로 넘기면 거기서도 박탈됨(#34592 "all sub-agent contexts").
- **격리 상실 대가 수용**: qa-phase는 이제 메인 대화 컨텍스트에서 실행(사용자 확정). QA 오케스트레이션은 대화형 결정이 본질이라 메인 실행이 오히려 적합.

### T3 — registry stale 주석 (P2)
`lib/cc-regression/registry.js:93` (MON-CC-06-51165) `notes`의 "bkit's sole fork user" → 현행 반영:
```
notes: "context:fork × disable-model-invocation regression (Windows). One of bkit's 9 context:fork skills (v2.1.31: added background:false opt-out for CC≥2.1.218 background-default)."
```
- (선택) 218 background-default 추적용 신규 MON-CC 엔트리 추가 검토 — Do에서 registry 스키마 확인 후 결정. 추가 시 severity MEDIUM, resolvedAt=v2.1.31(bkit측 대응 완료).

### T4 — MF-2 RECOMMENDED_VERSION bump (P2)
`lib/infra/cc-version-checker.js:42`:
```js
const RECOMMENDED_VERSION = '2.1.218';  // was '2.1.198'
```
- 상단 doc 주석(37-41행) 갱신: Claude 5 alias(≥2.1.197) 최소치는 유지하되 현 권장이 2.1.218(fork background-default를 bkit이 명시 대응)임을 명기.
- `FEATURE_VERSION_MAP`에는 추가 안 함(background-default는 "활성화할 기능"이 아니라 기본값 변경 → 이 맵의 inactive-warning 의미론에 부적합). 주석으로 근거 남김.
- **부수효과**: 2.1.198~2.1.217 사용자는 severity 'warn'으로 전환(의도된 권장). 설치 2.1.218=ok.

### T5 — 회귀 테스트 (P1) — fork 셋 9→8
- `test/contract/invocation-inventory.test.js:189-199` `EXPECTED_FORK_SKILLS`에서 **`qa-phase` 제거** → 8개. 주석(180-183, "9 skills")도 8로 갱신.
- `test/contract/context-fork-l1.test.js:59` `assert(forkSkills.includes('qa-phase'), ...)` **제거**. `:57` `forkSkills.length >= 8`은 정확히 8이라 유지(green). 헤더 주석의 "9 skills"→8.
- **신규 assert**: `context-fork-l1.test.js`에 8개 fork 스킬 각각 `background: false` 보유 assert 추가(`/^background:\s*false\b/m`).
- **qa-phase baseline**: `test/contract/scripts/contract-baseline-collect.js`가 `context`를 스냅샷(:82) → qa-phase가 fork→없음으로 바뀌므로 `contract-test-run.js:96-100` context-unchanged 게이트가 flag. **baseline 갱신 필요**(qa-phase의 `context` 값 제거). Do에서 baseline 재생성 절차 확인(스크립트 실행 vs 수동). allowed-tools는 baseline 미포함(effort/context/userInvocable/deprecatedIn만) → AskUserQuestion 유지라도 무관.
- **신규 회귀**: qa-phase가 `context: fork`를 **갖지 않음**을 assert(재도입 방지) + AskUserQuestion을 allowed-tools에 **보유**함을 assert.

### T6 — 버전 bump 2.1.30→2.1.31 (P1, 11파일)
| 파일 | 위치 |
|------|------|
| `.claude-plugin/plugin.json` | :3 version |
| `.claude-plugin/marketplace.json` | :4, :41 version + :36 narrative(변경요약 문구) |
| `bkit.config.json` | :2 version (런타임 SSoT) |
| `README.md` | :9 badge, :212 "latest release: v2.1.30" |
| `hooks/hooks.json` | :3 description |
| `hooks/session-start.js` | :3 header comment |
| `hooks/startup/session-context.js` | :2 header comment |
| `bkit-system/components/{skills,agents,scripts}/_*-overview.md` | 각 banner |
- `lib/core/version.js` FALLBACK_VERSION='2.1.6'은 config 우선이라 무해 → 범위 외(주석만 확인).
- **CHANGELOG.md**: `## [2.1.31] - 2026-07-DD` 신규 섹션. Keep-a-Changelog 형식, 기존 v2.1.30 스타일 준수(Status 블록 + 근거 서술 + 항목).

### T7 — Code=docs 동기화 (P1)
- **README.md**: 버전 badge/텍스트 + 권장 CC 런타임(:185 "v2.1.198")을 cc-version-checker와 동기화(2.1.218 권장 반영). 아키텍처 카운트(44/34/22)는 불변.
- **CHANGELOG.md**: 위 신규 섹션.
- **bkit.config.json / .claude-plugin/ / hooks/**: 버전 반영(T6).
- **bkit-system/**: overview banner 버전(T6) + (필요시) fork/background 관련 서술.
- **CUSTOMIZATION-GUIDE.md / AI-NATIVE-DEVELOPMENT.md**: 버전 문자열 외 내용 변경 여부 Do에서 grep 확인(대개 버전만).
- CI: `scripts/docs-code-sync.js`, `scripts/check-skills-docs-code-sync.js`, `scripts/validate-plugin.js` 0-drift 통과 확인.

## 3. 테스트 계획 (QA phase)
1. `--plugin-dir .`로 로드 후 9개 fork 스킬 frontmatter 정상 파싱 실측(SessionStart 오류 0).
2. 전 contract 테스트(`test/contract/*`) + regression 테스트 green.
3. qa-phase 로드 시 allowed-tools 정상, 오류 없음.
4. `claude -p`로 대표 스킬(skill-status 등) foreground 동작 확인.
5. docs-code-sync CI green.

## 4. 커밋 전략 (요구사항 #2 — 최소 push)
단일 브랜치에서 phase 완료 단위로 로컬 커밋 묶음, **push는 PR 준비 완료 후 1회**(또는 최소). CI 트리거 최소화. 승인 후 merge.

## 5. 롤백
전 변경이 additive/저위험. 문제 시 브랜치 폐기로 즉시 롤백(main 무영향).
