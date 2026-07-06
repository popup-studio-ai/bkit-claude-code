# 설계 — PDCA 선행-Task 완료 체인 (issue #137, v2.1.29)

## Context Anchor

| 키 | 값 |
|---|---|
| WHY | stale `in_progress` 선행 Task가 오래된 phase를 prompt context에 노출, `pdca-status.json`과 모순. |
| WHO | `pdca`를 2개 이상 phase에 걸쳐 쓰는 모든 bkit 사용자. |
| RISK | 매우 낮음 — 스킬 파일 1개 prose + 회귀 테스트 1개; 런타임 변경 없음. |
| SUCCESS | 모든 phase 전환이 선행 완료 지시; 테스트가 강제; 플러그인 로드 정상. |
| SCOPE | `skills/pdca/SKILL.md` 한정. |

## 1. 개요

보고된 갭을 결정론적으로 해소: `pdca` 스킬 prose 안에서 모델에게 다음 phase 진행 시 선행 phase Task(들)를 `completed`로 마킹하도록 지시하고, 규칙을 중앙에 문서화.

## 2. 아키텍처 결정

### 2.1 검토한 옵션

**Option A — Minimal Changes (채택).** 각 phase action의 Create-Task 스텝 직전에 "선행 Task 완료" 스텝 추가 + `## Task Integration`에 Phase Transition Rule. 이미 부여된 `TaskList`/`TaskUpdate` 도구로 모델이 실행. lib/hook 변경 없음, 신규 런타임 표면 없음.

**Option B — 훅 자동완료 (기각, 불가능).** 이슈 Option 2는 훅(`task-created-handler.js` / UserPromptExpansion 핸들러)이 새 phase Task 생성 시 선행 Task를 자동완료하도록 제안. **CC 훅이 Task 상태를 mutate 불가하므로 기각.** CC 공식 hooks guide상 command 훅은 stdout/stderr/exit code와 `additionalContext`로만 통신하며 `TaskUpdate` 등 어떤 도구도 호출 불가 — 오직 모델만 가능. 훅이 할 수 있는 최선은 `additionalContext` 리마인더인데, 그마저 **모델이 `TaskUpdate`를 수행해야** 하므로 Option A보다 결정론적이지 않음. 게다가:
- 매 PDCA Task 생성마다 토큰 노이즈(feature 수명당 ~7회 주입),
- audit 전용 훅에 모델 대면 출력 신설(테스트 변경, 동작 변경),
- cosmetic 이슈에 중복 코드 경로.
∴ Option B는 명백히 열등. `TaskCreated`/`TaskCompleted`는 기존 audit/auto-advance 용도로 그대로 배선 유지(불변).

**Option C — 문서 노트만 (기각).** README/guide 노트는 런타임에 모델에 도달하지 않음; 실제 스킬 실행 경로의 갭이 잔존.

### 2.2 채택 설계 — Phase Transition Rule

분기(`qa`, 반복 `[Act-N]`)에도 robust한 단일 일반 규칙:

> **새 phase의 Task를 생성하기 전에, 이 feature의 아직 `in_progress`인 모든 선행 `[Phase] {feature}` Task를 `completed`로 마킹**(`TaskList`로 찾아 각각 `TaskUpdate {status: "completed"}`). 이로써 `blockedBy` 체인이 해소되고 CC Task 목록이 `.bkit/state/pdca-status.json`과 일치.

정확한 선행 하나를 지정하기보다 "임의의 선행 in_progress phase Task"로 표현해 9-phase 수명주기의 분기부(`…→check→act→qa→report→archive`, `act` 반복·`qa` 스킵 가능)에서도 정확.

## 3. `skills/pdca/SKILL.md` 정확한 수정

각 Create-Task 스텝 직전에 완료 스텝 삽입(후속 스텝 재번호):

| Action | 스텝 앞 | 완료할 선행 |
|---|---|---|
| `plan` | Create Task `[Plan]` | `[PM]` (있으면) |
| `design` | Create Task `[Design]` | `[Plan]` |
| `do` | Create Task `[Do]` | `[Design]` |
| `analyze` | Create Task `[Check]` | `[Do]` |
| `iterate` | Create Task `[Act-N]` | `[Check]` 및 in_progress인 이전 `[Act-*]` |
| `qa` | Create Task `[QA]` | `[Check]` / 최신 `[Act-N]` |
| `report` | Create Task `[Report]` | `[QA]` (qa 스킵 시 `[Check]`/`[Act-N]`) |
| `archive` | (Task 생성 없음) | `[Report]` — archive 정리 단계에 완료 스텝 추가 |

각 삽입 스텝은 일반 규칙 문구(선행 in_progress `[Phase] {feature}` Task 찾아 완료) + `## Task Integration` 상호참조.

`## Task Integration`도 갱신:
- 생성 다이어그램 유지.
- **Phase Transition Rule** 하위섹션 추가(완료 규칙 + 두 진실 소스 근거).

## 4. 회귀 테스트

신규 `test/regression/issue-137-predecessor-task-completion.test.js`:
- `skills/pdca/SKILL.md` 읽기.
- `## Task Integration`에 Phase Transition Rule 존재 assert(`completed` + `blockedBy`/`in_progress` 문구 매칭).
- `design`, `do`, `analyze`, `report`, `archive` action 본문 각각에 `TaskUpdate`/`completed` 완료 지시 존재 assert.
- 완료 지시 제거 시 실패(fix 보호).

## 5. 비목표 / 불변식

- 아키텍처 카운트 불변(스킬 44 / 에이전트 34 / 훅 이벤트 22 / 블록 25 / lib 195). lib 모듈 미추가 → `check-deadcode` 카운트 불변.
- hooks.json 변경 없음.
- 영어 전용 스킬 + 테스트; bilingual 문서.

## 6. 검증 계획

- 정적 게이트: `check-skill-frontmatter`, `lint-skill-md`, `docs-code-sync`, `check-deadcode`, `validate-plugin --strict`, Contract L1/L4/L5.
- 회귀: 신규 테스트 green; `test/regression` 전체 `main` 대비 신규 실패 0.
- 라이브 QA: `claude -p "/bkit:pdca status" --plugin-dir .` 스킬 로드 0 에러; 스킬 본문에 신규 지시 표시.
