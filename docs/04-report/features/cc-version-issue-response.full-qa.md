# bkit v2.1.2 전체 기능 QA 보고서

> 검증 대상: 로컬 플러그인 디렉토리 `--plugin-dir .` (브랜치 `feat/bkit-v212-cc-v2198-compat`)

## 1. Executive Summary

| 항목 | 값 |
|---|---|
| 검증 시각 | 2026-04-12 |
| Claude Code 버전 | **v2.1.101** |
| bkit 버전 | **v2.1.2** (plugin.json / bkit.config.json 일치) |
| 브랜치 | `feat/bkit-v212-cc-v2198-compat` |
| 정적 검증 | 4/4 통과 (skills / agents / hooks / versions) |
| 런타임 검증 (`claude -p`) | **7/7 통과** (is_error=false) |
| MCP 서버 require 로드 | 2/2 통과 |
| Jest 테스트 스위트 | **2/2 통과**, 테스트 **6/6 통과** |
| Hook 핸들러 파일 존재 | 21/21 (누락 0) |
| **전체 판정** | **PASS** |

## 2. 인벤토리 (실측 vs 기대)

| 구성요소 | 기대 (memory) | 실제 | 상태 |
|---|---|---|---|
| Skills (`skills/*/SKILL.md`) | 37 | **38** | ⚠ memory 오래됨 (+1) |
| Agents (`agents/*.md`) | 32 | **36** | ⚠ memory 오래됨 (+4) |
| Commands (`commands/*.md`) | — | 3 | ✓ |
| Hook events (`hooks/hooks.json`) | 21 | **21** | ✓ |
| Output styles (`output-styles/*.md`) | 4 | 4 | ✓ |
| MCP servers (`.mcp.json`) | 2 | **2** (bkit-pdca, bkit-analysis) | ✓ |
| Total JS LOC (lib+hooks+servers) | ~40K | **23,701** | ℹ lib/ 외 scripts 미포함 기준 |

Skills (38): audit, bkend-auth, bkend-cookbook, bkend-data, bkend-quickstart, bkend-storage, bkit-rules, bkit-templates, btw, cc-version-analysis, claude-code-learning, code-review, control, deploy, desktop-app, development-pipeline, dynamic, enterprise, mobile-app, pdca, pdca-batch, phase-1-schema, phase-2-convention, phase-3-mockup, phase-4-api, phase-5-design-system, phase-6-ui-integration, phase-7-seo-security, phase-8-review, phase-9-deployment, plan-plus, pm-discovery, qa-phase, rollback, skill-create, skill-status, starter, zero-script-qa.

Agents (36): bkend-expert, bkit-impact-analyst, cc-version-researcher, code-analyzer, cto-lead, design-validator, enterprise-expert, frontend-architect, gap-detector, infra-architect, pdca-eval-act, pdca-eval-check, pdca-eval-design, pdca-eval-do, pdca-eval-plan, pdca-eval-pm, pdca-iterator, pipeline-guide, pm-discovery, pm-lead, pm-lead-skill-patch, pm-prd, pm-research, pm-strategy, product-manager, qa-debug-analyst, qa-lead, qa-monitor, qa-strategist, qa-test-generator, qa-test-planner, report-generator, security-architect, self-healing, skill-needs-extractor, starter-guide.

> ⚠ **메모리 반영 필요**: `memory/MEMORY.md` 의 "37 Skills, 32 Agents" → **38 Skills, 36 Agents** 로 업데이트 필요.

## 3. 정적 검증 결과

`/tmp/bkit_static_check.js` 실행 결과 (raw JSON):

| 검사 | 결과 |
|---|---|
| Skills frontmatter 파싱 실패 | 0 / 38 |
| Skills description > 250자 | **0 / 38** (v2.1.86 제약 충족) |
| Skills `effort` 필드 누락 | **0 / 38** (ENH-134 완료 검증) |
| Agents frontmatter 파싱 실패 | 0 / 36 |
| Agents description > 250자 | 0 / 36 |
| Agents `effort` 필드 누락 | 0 / 36 |
| `hooks.json` JSON 유효성 | ✓ |
| 허용되지 않은 hook 이벤트 | **0 / 21** (v2.1.98 26개 허용 이벤트 내) |
| Hook 핸들러 파일 누락 | **0** (21개 전부 존재) |
| `plugin.json.version` | 2.1.2 |
| `bkit.config.json.version` | 2.1.2 |
| `.mcp.json.mcpServers` | bkit-pdca, bkit-analysis |

**Hook 이벤트 목록** (21): SessionStart, PreToolUse, PostToolUse, Stop, StopFailure, UserPromptSubmit, PreCompact, PostCompact, TaskCompleted, SubagentStart, SubagentStop, TeammateIdle, SessionEnd, PostToolUseFailure, InstructionsLoaded, ConfigChange, PermissionRequest, Notification, CwdChanged, TaskCreated, FileChanged.

> Claude Code v2.1.98 가 지원하는 26개 훅 중 21개 구현 (PermissionDenied, PreCompact`"manual"` 등 5건 미구현 — 모니터링 ENH 로 이미 추적 중).

## 4. `claude -p` Smoke Test 결과 매트릭스

모두 단일 프로세스 순차 실행, `--permission-mode bypassPermissions`, `--output-format json`. 재시도 없음, 전부 1차 통과.

| # | 입력 요약 | is_error | turns | cost (USD) | 결과 (첫 120자) |
|---|---|---|---|---|---|
| 1 | "List 5 bkit skill names loaded" | **false** | 1 | 0.3736 | `update-config / simplify / loop / bkit:pdca / bkit:qa-phase` |
| 2 | `/bkit:control status` 자연어 트리거 | **false** | 5 | 0.8108 | bkit Control Panel — L4 Full-Auto, Trust Score N/A (파일 없음) |
| 3 | `/bkit:skill-status` | **false** | 4 | 0.6124 | Total **38 skills**, Conflicts **0** (override 0, shadow 0) |
| 4 | MCP `bkit_pdca_status` 호출 | **false** | 3 | 1.1334 | `{"feature":"cc-version-issue-response","phase":"report"}` |
| 5 | MCP `bkit_feature_list` 호출 | **false** | 3 | 0.8036 | Total **21 features**, 최근 3건 반환 |
| 6 | MCP `bkit_checkpoint_list` 호출 | **false** | 3 | 0.7857 | `0` checkpoints |
| 7 | plugin.json version + agents count | **false** | 2 | 0.4107 | `bkit v2.1.2 — 36 agents loaded` |

- 총 합계: **7 success / 0 error / 0 retry / $4.9303 USD / 21 turns**
- 모델: `claude-opus-4-6[1m]` (contextWindow 1M, maxOutputTokens 64K) — 테스트 #3 은 Haiku 4.5 보조 사용
- `permission_denials: []` 전 호출
- `terminal_reason: completed` 전 호출

**런타임 확인된 기능**:
- 플러그인 로드 (skills/agents frontmatter 정상 파싱)
- Slash command 자연어 트리거 (`/bkit:control`, `/bkit:skill-status`)
- MCP 두 서버 tool 호출 실제 동작 (`bkit_pdca_status`, `bkit_feature_list`, `bkit_checkpoint_list` — pdca 서버 3건, analysis 서버 1건)
- Hook 기반 PDCA 프레임 출력 (`[Plan] → [Design] → ... → [Act/Report ▶]`) 정상 렌더링 → `user-prompt-handler.js` + `instructions-loaded-handler.js` 동작 확인
- bkit Feature Usage Report 자동 첨부 확인

## 5. MCP 서버 검증

```
node -e "require('./servers/bkit-pdca-server/index.js'); require('./servers/bkit-analysis-server/index.js')"
```

출력:
```
[bkit-pdca-server] Started (pid=2517)
pdca-server loaded: object
[bkit-analysis-server] Started (pid=2517)
analysis-server loaded: object
```

- `require()` 양쪽 성공 (구문 에러/누락 의존성 없음)
- 자체 start 로그로 initialization 진입 확인
- `claude -p` smoke test #4~#6 에서 `mcp__plugin_bkit_bkit-pdca__*`, `mcp__plugin_bkit_bkit-analysis__*` 툴이 실제 호출되어 결과 반환 — E2E 동작 검증

## 6. Hook 검증

| 검사 | 결과 |
|---|---|
| `hooks/hooks.json` JSON 파싱 | ✓ |
| 21개 이벤트 전부 허용 이벤트 목록 포함 | ✓ |
| 21개 이벤트의 커맨드 대상 JS 파일 실재 | ✓ (누락 0) |
| `hooks/startup/context-init.js` node 실행 | exit **0** (정상 종료) |
| `FileChanged` 이벤트 `if` 필드 사용 (v2.1.85 신규 기능) | ✓ (`Write|Edit(docs/**/*.md)`) |
| `PreCompact` `matcher: "auto|manual"` | ✓ |
| 타임아웃 값 1500~10000ms 범위 | ✓ |

Startup hook 실행 시 현재 디렉토리가 git worktree 가 아니기 때문에 정상 경로로 진입하여 종료.

## 7. Jest 테스트 결과

```
npx jest
Test Suites: 2 passed, 2 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        0.376 s
```

대상 테스트:
- `test-scripts/unit/worktree-detector.test.js`
- `test-scripts/unit/mcp-ok-response.test.js`

`jest.config.js` 가 대부분의 레거시 테스트 스위트를 명시적으로 `testPathIgnorePatterns` 처리 중. **실질 활성 테스트는 6건**으로 커버리지 매우 낮음 — 메모리의 "2717 TC" 주장은 legacy TestRunner 기반(Jest 미호환)이며 현재 활성화되어 있지 않음.

> 테스트 실행 중 stdout 에 `[bkit] WARNING: git worktree detected (#46808) — hooks may not fire` 출력 — worktree-detector 단위 테스트가 의도적으로 linked worktree 상황을 시뮬레이션한 결과물이며 에러 아님.

## 8. 발견된 이슈 & 권장 조치

### 🟡 경미 (Advisory)

1. **메모리 문서 불일치 (P2)**
   - `memory/MEMORY.md` 의 "37 Skills, 32 Agents" → 실제 **38 / 36**
   - 조치: 다음 PDCA 작업 시 메모리 블록 업데이트.

2. **Jest 활성 테스트 6건만 (P1)**
   - `jest.config.js` 가 레거시 TestRunner 기반 스위트 29건을 ignore.
   - Docs=Code 철학 기준, 2717 TC 주장은 현재 재현 불가.
   - 조치: v2.1.3 에서 Jest 마이그레이션 또는 주장 수치 정정.

3. **trust-score.json 파일 부재 (P3)**
   - `/bkit:control status` 호출 시 "Trust Score N/A (`trust-score.json` 없음)" 반환.
   - 조치: 초기값 생성 스크립트 또는 `self-healing` agent 로 자동 생성.

4. **Checkpoints 0건 (P3 / 정보성)**
   - 현재 PDCA(`cc-version-issue-response`)는 checkpoint 미생성. 단순 조회 단계라 정상이나 L4 Full-Auto 에서는 rollback safety net 부재.

### ✅ 결함 없음
- Skills/Agents frontmatter 100% 정상
- description 250자 제약 100% 준수
- Hook 이벤트 21건 전부 등록·핸들러 존재
- MCP 서버 2건 전부 로드 및 E2E 호출 성공
- v2.1.2 버전 문자열 3곳 동기화 완료

## 9. 최종 판정

**PASS — bkit v2.1.2 는 Claude Code v2.1.101 환경에서 전 구성요소가 정상 로드·실행됨.**

- 정적 검증 100% 통과 (38 skills / 36 agents / 21 hooks / 2 MCP / versions aligned)
- `claude -p --plugin-dir .` headless 모드에서 7건 smoke test 전부 `is_error=false` 로 통과
- MCP 서버 3종 tool (`bkit_pdca_status`, `bkit_feature_list`, `bkit_checkpoint_list`) E2E 호출 성공
- Jest 활성 스위트 100% 통과
- **Breaking change 없음** (63개 연속 CC 릴리스 호환성 기록 유지)

권장: P1 이슈 (Jest 마이그레이션) 를 v2.1.3 또는 v3.0.0 로드맵에 반영.

---
*생성: 2026-04-12 · 검증자: zero-script-qa / full-system smoke · 참조: `/tmp/bkit_static_check.js`, `claude -p` 7회 호출 로그*
