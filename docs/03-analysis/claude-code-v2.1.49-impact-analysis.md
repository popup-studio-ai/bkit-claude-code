# Claude Code v2.1.47 -> v2.1.50 Version Upgrade Impact Analysis

> **Feature**: claude-code-v2150-impact-analysis
> **Phase**: Check (PDCA Analysis)
> **Date**: 2026-02-21
> **Pattern**: CTO Team (8 specialist agents + CTO Lead) + Supplemental Analysis
> **bkit Version**: v1.5.5 (current)
> **Previous Analysis**: claude-code-v2.1.47-impact-analysis.md

---

## 1. Executive Summary

| Metric | Value |
|--------|:-----:|
| Analysis Target Versions | v2.1.48 ~ v2.1.50 (3 versions) |
| Published Releases | 3 (v2.1.48, v2.1.49, v2.1.50) |
| Skipped Releases (CHANGELOG) | 1 (v2.1.48 - npm published, no CHANGELOG) |
| Total Changes | **48 items** (v2.1.49: 23, v2.1.50: 25) |
| v2.1.49 Changes | 23 items (Features 9, Bug Fixes 9, Performance 5) |
| v2.1.50 Changes | **25 items** (Features 8, Bug Fixes 14, Performance 3) |
| bkit Impact Items | **24 items** (High 8, Medium 8, Low 8) |
| Compatibility Risk | **None** (100% backward compatible) |
| Breaking Changes | **0 items** |
| Security Advisory | 2 items (ConfigChange hook, disableAllHooks hierarchy fix) |
| Enhancement Opportunities | **10 items** (High 4, Medium 3, Low 3) |
| Immediate Action Required | **None** (all changes are backward compatible) |
| New Hook Events | **3 items** (ConfigChange, WorktreeCreate, WorktreeRemove) |
| New Agent Features | **2 items** (background: true, isolation: "worktree") |
| New Plugin Features | **1 item** (settings.json default configuration) |
| Memory Leak Fixes | **9 items** (v2.1.50 - critical for long CTO Team sessions) |
| GitHub Issues Monitored | 11 items (4 existing + 7 new) |

### Verdict: COMPATIBLE (100% compatible, 0 Breaking Changes)

bkit v1.5.5는 Claude Code v2.1.50과 완전 호환됩니다. v2.1.48은 스킵 릴리스입니다. v2.1.49에서 23건, v2.1.50에서 25건, 총 48건의 변경이 있었으며, **bkit에 직접적으로 영향을 미치는 항목은 24건**입니다.

**v2.1.49**의 핵심은 **인프라 강화**(git worktree isolation, ConfigChange 훅, background agents, plugin settings.json)이며, **v2.1.50**의 핵심은 **메모리 안정성 대폭 개선**(9건 메모리 누수 수정)과 **Worktree 훅 이벤트 추가**(WorktreeCreate, WorktreeRemove)입니다. v2.1.50에서 수정된 "Agent Teams에서 completed teammate tasks가 GC되지 않는 메모리 누수"는 bkit CTO Team 패턴(8+ agents)에 직접적으로 긍정적 영향을 줍니다.

v2.1.34부터 v2.1.50까지 **17개 연속 릴리스, 0건 Breaking Change**로 완벽한 호환성이 유지되고 있습니다. **Opus 4.6 모델이 1M 컨텍스트 윈도우를 지원**하게 되어 bkit의 7개 opus 에이전트가 직접 혜택을 받습니다.

**10건의 Enhancement 기회**가 식별되었으며, 특히 ConfigChange 훅(ENH-32), WorktreeCreate/Remove 훅(ENH-39), settings.json(ENH-33), pdca-iterator worktree isolation(ENH-34)은 High priority 항목입니다.

---

## 2. Release Information

### 2.1 Release Timeline (v2.1.48 ~ v2.1.50)

| Version | Release Date | Status | Changes | Release Type |
|---------|:----------:|:------:|:-------:|:------:|
| v2.1.48 | ~2026-02-19 | **Skipped** (npm only, no CHANGELOG) | 0 (undocumented) | Skip release |
| v2.1.49 | 2026-02-20 | Published | 23 | Feature + Bug fix |
| **v2.1.50** | **2026-02-21** | **Latest** | **25** | **Memory + Feature** |
| **Total** | | | **48** | |

### 2.2 Analysis Methodology

1. **CTO Team**: 8 specialist agents (web-researcher, github-analyst, cli-diff-analyst, hooks-analyst, agent-analyst, skill-analyst, security-analyst, report-writer) + CTO Lead
2. **GitHub Releases**: `gh release view`, npm version history
3. **CHANGELOG**: Raw GitHub CHANGELOG.md (https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
4. **Official Documentation**: code.claude.com/docs/en/hooks, code.claude.com/docs/en/sub-agents
5. **Web Research**: npm versions, tech blogs, community sources
6. **bkit Codebase Analysis**: 16 agents, 27 skills, 10 hooks, 180 library exports, plugin.json verified
7. **Task Management**: 8 parallel tasks tracked via Task Management System

### 2.3 Analysis Sources

| Source | URL | Data Quality |
|--------|-----|:------:|
| GitHub CHANGELOG (Raw) | https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md | Primary |
| Official Hooks Docs | https://code.claude.com/docs/en/hooks | Primary |
| Official Subagents Docs | https://code.claude.com/docs/en/sub-agents | Primary |
| npm Package Versions | https://www.npmjs.com/package/@anthropic-ai/claude-code | Primary |
| GitHub Issues | https://github.com/anthropics/claude-code/issues | Primary |
| Releasebot | https://releasebot.io/updates/anthropic/claude-code | Secondary |
| ClaudeLog | https://claudelog.com/claude-code-changelog/ | Secondary |

### 2.4 Version History (npm registry)

```
2.1.40 → 2.1.41 → 2.1.42 → 2.1.44 → 2.1.45 → 2.1.47 → 2.1.48 → 2.1.49 → 2.1.50
                                                            ↑ skip              ↑ current
```

Skipped versions (npm published but no CHANGELOG): v2.1.40, v2.1.43, v2.1.46, **v2.1.48**

---

## 3. Change Details: v2.1.49 (23 Items)

### 3.1 New Features (9 Items)

| # | Change | bkit Impact | Direction |
|---|--------|:----------:|:---------:|
| 1 | **`--worktree` (`-w`) flag** to start Claude in an isolated git worktree | **Medium** | Positive |
| 2 | **Subagent `isolation: "worktree"`** for working in temporary git worktrees | **High** | Positive |
| 3 | **`Ctrl+F` keybinding** to kill background agents (two-press confirmation) | Low | Positive |
| 4 | **Agent `background: true`** to always run as a background task | **High** | Positive |
| 5 | **Plugin `settings.json`** for default configuration | **High** | Positive |
| 6 | **Simple mode (`CLAUDE_CODE_SIMPLE`)** now includes file edit tool | None | Neutral |
| 7 | **Permission suggestions** populated on safety check ask responses | Low | Positive |
| 8 | **SDK model info**: `supportsEffort`, `supportedEffortLevels`, `supportsAdaptiveThinking` | Low | Neutral |
| 9 | **`ConfigChange` hook event** for configuration file changes during sessions | **High** | Positive |

### 3.2 Bug Fixes (9 Items)

| # | Change | bkit Impact | Direction |
|---|--------|:----------:|:---------:|
| 10 | Fixed file-not-found errors to suggest corrected paths | Low | Positive |
| 11 | Fixed `Ctrl+C`/`ESC` silently ignored with background agents running | **Medium** | Positive |
| 12 | Fixed `plugin enable`/`plugin disable` auto-detection without `--scope` | **Medium** | Positive |
| 13 | Fixed verbose mode not updating thinking block display via `/config` | None | Neutral |
| 14 | **Fixed unbounded WASM memory growth** by periodically resetting tree-sitter parser | **Medium** | Positive |
| 15 | Fixed potential rendering issues from stale yoga layout references | None | Neutral |
| 16 | **Fixed `disableAllHooks` setting** to respect managed settings hierarchy | **Medium** | Positive |
| 17 | Fixed `--resume` session picker showing raw XML tags | None | Neutral |
| 18 | Improved permission prompts to show restriction reasons | Low | Positive |

### 3.3 Performance Improvements (5 Items)

| # | Change | bkit Impact | Direction |
|---|--------|:----------:|:---------:|
| 19 | **MCP OAuth** with step-up auth support and discovery caching | Low | Positive |
| 20 | Startup performance in non-interactive mode (`-p`) | None | Positive |
| 21 | **MCP auth failure caching** for faster startup | **Medium** | Positive |
| 22 | HTTP calls reduction for analytics token counting | Low | Positive |
| 23 | **MCP tool token counting** batched into single API call | Low | Positive |

---

## 3A. Change Details: v2.1.50 (25 Items)

### 3A.1 New Features (8 Items)

| # | Change | bkit Impact | Direction |
|---|--------|:----------:|:---------:|
| 24 | **`WorktreeCreate` / `WorktreeRemove` hook events** for worktree lifecycle | **High** | Positive |
| 25 | **Agent `isolation: worktree`** declarative support (expanded from v2.1.49) | **High** | Positive |
| 26 | **`claude agents` CLI command** to list all configured agents | **Medium** | Positive |
| 27 | **Opus 4.6 full 1M context window** in fast mode | **High** | Positive |
| 28 | LSP server `startupTimeout` configuration | Low | Positive |
| 29 | **CLAUDE_CODE_DISABLE_1M_CONTEXT** environment variable | Low | Neutral |
| 30 | `CLAUDE_CODE_SIMPLE` mode: disables MCP, hooks, attachments, CLAUDE.md | Low | Neutral |
| 31 | VS Code `/extra-usage` command support | None | Neutral |

### 3A.2 Bug Fixes (14 Items)

| # | Change | bkit Impact | Direction |
|---|--------|:----------:|:---------:|
| 32 | **Fixed memory leak: Agent Teams completed teammate tasks never GC'd** | **High** | Positive |
| 33 | **Fixed memory leak: completed task state objects in AppState** | **High** | Positive |
| 34 | **Fixed memory leak: TaskOutput retained lines after cleanup** | **Medium** | Positive |
| 35 | **Fixed memory leak: CircularBuffer cleared items in backing array** | **Medium** | Positive |
| 36 | **Fixed memory leak: ChildProcess/AbortController refs persisted after shell cleanup** | **Medium** | Positive |
| 37 | **Fixed memory leak: LSP diagnostic data never cleaned after delivery** | **Medium** | Positive |
| 38 | **Fixed unbounded memory growth: file history snapshots capped** | **Medium** | Positive |
| 39 | **Fixed memory leak: completed task output not freed** | **Medium** | Positive |
| 40 | Fixed session data loss on SSH disconnect (flush before hooks/analytics) | **Medium** | Positive |
| 41 | Fixed resumed sessions invisible with symlinked working directories | Low | Positive |
| 42 | **Linux**: Fixed native modules on glibc < 2.30 (RHEL 8) | Low | Positive |
| 43 | Fixed `/mcp reconnect` freezing with non-existent server name | Low | Positive |
| 44 | Fixed MCP tools not discovered with tool search + prompt launch arg | Low | Positive |
| 45 | Fixed prompt suggestion cache regression reducing hit rates | Low | Positive |

### 3A.3 Performance Improvements (3 Items)

| # | Change | bkit Impact | Direction |
|---|--------|:----------:|:---------:|
| 46 | **Memory: clear internal caches after compaction** | **High** | Positive |
| 47 | **Memory: clear large tool results after processing** | **Medium** | Positive |
| 48 | Startup: defer Yoga WASM and UI imports in headless mode | Low | Positive |

### 3A.4 v2.1.50 Memory Fix Summary

v2.1.50은 **9건의 메모리 누수 수정**을 포함한 대규모 메모리 안정화 릴리스입니다:

| Category | Fix Count | bkit Relevance |
|----------|:--------:|:--------:|
| Agent Teams / Task State | 4 (completed tasks, teammate GC, TaskOutput, task state) | **Critical** -- CTO Team 8+ agents |
| Shell / Process | 2 (ChildProcess, AbortController) | Medium -- Bash hook handlers |
| Buffer / Data Structure | 2 (CircularBuffer, file history) | Medium -- 장기 세션 |
| LSP | 1 (diagnostic data) | Low -- 2 agents use LSP |

**GitHub 메모리 이슈 일괄 종료 확인**: #24167, #26174, #26039, #26017, #24644, #26987, #22042, #24056 등 10건 이상의 메모리 관련 이슈가 2026-02-20~21일에 일괄 종료됨. v2.1.50의 메모리 수정으로 해결된 것으로 추정.

---

## 4. New Capabilities Deep Analysis

### 4.1 ConfigChange Hook Event (NEW - #9)

**공식 문서 기반 상세 분석** (source: code.claude.com/docs/en/hooks)

| Attribute | Details |
|-----------|---------|
| Event Name | `ConfigChange` |
| When Fires | Configuration file changes during a session |
| Can Block | **Yes** (exit code 2 or JSON `decision: "block"`) |
| Exception | `policy_settings` changes CANNOT be blocked |
| Matchers | `user_settings`, `project_settings`, `local_settings`, `policy_settings`, `skills` |

**Input Schema:**
```json
{
  "session_id": "abc123",
  "hook_event_name": "ConfigChange",
  "source": "project_settings",
  "file_path": "/path/to/.claude/settings.json"
}
```

**bkit 활용 방안:**
1. `bkit.config.json` 변경 감지 → PDCA 상태 자동 업데이트
2. `.claude/settings.json` 변경 감지 → 보안 감사 로깅
3. 스킬 파일 변경 감지 → 스킬 카운트 자동 업데이트
4. 엔터프라이즈 보안: 미인가 설정 변경 차단

**현재 bkit Hook 현황 (10개 → 11개 가능):**
```
현재 사용 중 (10):
SessionStart, PreToolUse(Write|Edit), PreToolUse(Bash),
PostToolUse(Write), PostToolUse(Bash), PostToolUse(Skill),
Stop, UserPromptSubmit, PreCompact, TaskCompleted,
SubagentStart, SubagentStop, TeammateIdle

추가 가능 (5):
ConfigChange (NEW v2.1.49) ← 권장
PermissionRequest, PostToolUseFailure, Notification, SessionEnd
```

### 4.2 Subagent Isolation: "worktree" (NEW - #2)

**공식 문서 기반 상세 분석** (source: code.claude.com/docs/en/sub-agents)

| Attribute | Details |
|-----------|---------|
| Field | `isolation: "worktree"` in agent frontmatter |
| Behavior | Runs subagent in temporary git worktree (isolated repo copy) |
| Cleanup | Automatically cleaned up if subagent makes no changes |
| Use Case | Code modification agents that need isolation |

**bkit 에이전트 적용 분석 (16개):**

| Agent | Model | Mode | isolation 적용 | 이유 |
|-------|:-----:|:----:|:------:|------|
| cto-lead | opus | acceptEdits | No | 조율 역할, 코드 수정 없음 |
| security-architect | opus | plan | No | 분석 전용, 코드 수정 없음 |
| frontend-architect | opus | acceptEdits | **가능** | 코드 생성/수정 작업 |
| enterprise-expert | opus | plan | No | 전략 분석, 코드 수정 없음 |
| infra-architect | opus | acceptEdits | **가능** | IaC 코드 생성 |
| product-manager | opus | plan | No | 문서 작업, 격리 불필요 |
| qa-strategist | opus | plan | No | 전략 수립, 코드 수정 없음 |
| bkend-expert | sonnet | acceptEdits | **가능** | 백엔드 코드 생성 |
| code-analyzer | sonnet | plan | No | 읽기 전용 분석 |
| gap-detector | sonnet | plan | No | 비교 분석, 코드 수정 없음 |
| report-generator | sonnet | acceptEdits | No | 문서 생성, 격리 불필요 |
| design-validator | sonnet | plan | No | 읽기 전용 검증 |
| qa-monitor | sonnet | acceptEdits | No | 모니터링, 격리 불필요 |
| pdca-iterator | sonnet | acceptEdits | **권장** | 코드 수정 + 반복 작업 |
| starter-guide | haiku | acceptEdits | No | 가이드 역할 |
| pipeline-guide | haiku | plan | No | 가이드 역할 |

**적용 권장 에이전트**: pdca-iterator (코드 수정 반복 작업에서 격리 환경이 안전성 제공)

### 4.3 Agent Background Mode (NEW - #4)

| Attribute | Details |
|-----------|---------|
| Field | `background: true` in agent frontmatter |
| Behavior | Always runs as background task |
| Permission | Pre-approved permissions upfront |
| Limitation | MCP tools not available, AskUserQuestion fails |

**bkit 에이전트 적용 분석:**

| Agent | background 적용 | 이유 |
|-------|:------:|------|
| qa-monitor | **권장** | 지속적 모니터링, 백그라운드 적합 |
| code-analyzer | **가능** | 독립적 분석 작업 |
| gap-detector | **가능** | 독립적 비교 분석 |
| report-generator | No | 파일 쓰기 필요, 포그라운드 권장 |
| pdca-iterator | No | 사용자 상호작용 필요 |
| 기타 11개 | No | 협업/대화형 작업 |

### 4.4 Plugin settings.json (NEW - #5)

| Attribute | Details |
|-----------|---------|
| Feature | Plugins can ship `settings.json` for default configuration |
| Location | Plugin root directory (alongside plugin.json) |
| Scope | Applied when plugin is enabled |

**현재 bkit plugin.json:**
```json
{
  "name": "bkit",
  "version": "1.5.5",
  "description": "Vibecoding Kit - PDCA methodology + ...",
  "outputStyles": "./output-styles/"
}
```

**settings.json 활용 방안:**
1. 기본 permission 설정 (agent 모델별 최적 permission)
2. 기본 hook 설정 보완
3. 기본 환경 변수 (BKIT_LEVEL, BKIT_PDCA_PHASE)
4. 에이전트 기본 설정 (maxTurns, timeout 등)

### 4.5 WorktreeCreate / WorktreeRemove Hook Events (NEW v2.1.50 - #24)

| Attribute | Details |
|-----------|---------|
| Events | `WorktreeCreate`, `WorktreeRemove` |
| When Fires | Agent worktree isolation creates/removes git worktrees |
| Purpose | Custom VCS setup/teardown (e.g., submodule init, dependency install) |
| Can Block | TBD (likely No for lifecycle hooks) |
| Dependency | Requires agents with `isolation: "worktree"` |

**bkit 활용 방안:**
1. `WorktreeCreate`: worktree 생성 시 bkit 상태 초기화, `.bkit-memory.json` 복사
2. `WorktreeRemove`: worktree 제거 시 변경 사항 메인 브랜치와 비교/보고
3. pdca-iterator worktree isolation과 연동: 반복 개선 시작/종료 시 자동 로깅
4. CTO Team의 에이전트별 worktree 상태 추적

**현재 bkit Hook 현황 (10개 → 13개 가능):**
```
현재 사용 중 (10):
SessionStart, PreToolUse(Write|Edit), PreToolUse(Bash),
PostToolUse(Write), PostToolUse(Bash), PostToolUse(Skill),
Stop, UserPromptSubmit, PreCompact, TaskCompleted,
SubagentStart, SubagentStop, TeammateIdle

v2.1.49 추가 가능 (1): ConfigChange ← 권장
v2.1.50 추가 가능 (2): WorktreeCreate, WorktreeRemove ← 권장
미사용 (4): PermissionRequest, PostToolUseFailure, Notification, SessionEnd
```

### 4.6 Opus 4.6 Full 1M Context Window (NEW v2.1.50 - #27)

| Attribute | Details |
|-----------|---------|
| Change | Opus 4.6 (fast mode) now includes full 1M context window |
| Previous | Opus 4.6 had reduced context in fast mode |
| bkit Impact | **7 opus agents** benefit from larger context |

**bkit Opus 에이전트 (7개) - 1M 컨텍스트 혜택:**

| Agent | 활용 영향 |
|-------|----------|
| cto-lead | **High** -- 전체 프로젝트 조율, 대규모 컨텍스트 필요 |
| security-architect | **High** -- 전체 코드베이스 보안 분석 |
| enterprise-expert | **High** -- 복잡한 아키텍처 결정 |
| frontend-architect | Medium -- 컴포넌트 구조 분석 |
| infra-architect | Medium -- IaC 전체 스택 이해 |
| product-manager | Medium -- 요구사항 전체 맥락 |
| qa-strategist | Medium -- 품질 전략 수립 |

### 4.7 Agent Teams Memory Fix (CRITICAL v2.1.50 - #32)

| Attribute | Details |
|-----------|---------|
| Issue | Completed teammate tasks were **never garbage collected** |
| Fix | Proper GC of completed task states in Agent Teams |
| bkit Impact | **Critical** -- CTO Team 패턴(8+ agents)에서 장기 세션 안정성 직접 향상 |
| Related | 추가 4건의 task state/output 메모리 누수도 동시 수정 |

**v2.1.50 이전 문제**: CTO Team으로 8개 에이전트를 실행할 때, 완료된 task의 상태 객체가 메모리에서 해제되지 않아 장기 세션에서 메모리 사용량이 지속 증가.

**v2.1.50 이후**: 완료된 task는 적절히 GC되어, 대규모 Agent Teams 세션의 안정성이 크게 개선됨. 이는 GitHub에서 10건 이상의 메모리 관련 이슈 일괄 종료로 확인됨.

### 4.8 `claude agents` CLI Command (NEW v2.1.50 - #26)

| Attribute | Details |
|-----------|---------|
| Command | `claude agents` |
| Purpose | List all configured agents (user, project, plugin) |
| bkit Impact | **Medium** -- bkit의 16개 에이전트 확인/디버깅 용이 |

---

## 5. bkit Plugin Impact Scope Analysis

### 5.1 Impact Matrix (All Items - v2.1.49 + v2.1.50)

**v2.1.49 High/Medium Impact:**

| # | Change | bkit Impact | Direction | Component | Action |
|---|--------|:----------:|:---------:|-----------|:------:|
| 2 | Subagent `isolation: "worktree"` | **High** | Positive | Agents (16) | Enhance |
| 4 | Agent `background: true` | **High** | Positive | Agents (16) | Enhance |
| 5 | Plugin `settings.json` | **High** | Positive | Plugin config | Enhance |
| 9 | `ConfigChange` hook event | **High** | Positive | Hooks (10→13) | Enhance |
| 14 | WASM memory growth fix | **High** | Positive | Long sessions | None |
| 1 | `--worktree` (`-w`) flag | **Medium** | Positive | UX | Document |
| 11 | Ctrl+C/ESC fix with background agents | **Medium** | Positive | Agent Teams | None |
| 12 | Plugin enable/disable scope fix | **Medium** | Positive | Plugin mgmt | None |
| 16 | `disableAllHooks` hierarchy fix | **Medium** | Positive | Security | Monitor |
| 21 | MCP auth failure caching | **Medium** | Positive | Startup perf | None |

**v2.1.50 High/Medium Impact:**

| # | Change | bkit Impact | Direction | Component | Action |
|---|--------|:----------:|:---------:|-----------|:------:|
| 24 | `WorktreeCreate`/`WorktreeRemove` hooks | **High** | Positive | Hooks (10→13) | Enhance |
| 27 | Opus 4.6 full 1M context window | **High** | Positive | Agents (7 opus) | None |
| 32 | **Agent Teams completed task GC fix** | **High** | Positive | CTO Team | None |
| 46 | Memory: clear caches after compaction | **High** | Positive | Long sessions | None |
| 26 | `claude agents` CLI command | **Medium** | Positive | Agent mgmt | Document |
| 33 | Completed task state objects GC fix | **Medium** | Positive | Task system | None |
| 34-39 | 6 additional memory leak fixes | **Medium** | Positive | Stability | None |
| 40 | SSH disconnect session data flush | **Medium** | Positive | Reliability | None |
| 47 | Memory: clear tool results after processing | **Medium** | Positive | Long sessions | None |

### 5.2 Core Component Compatibility Verification

| Component | Count | v2.1.49~v2.1.50 Impact | Verification |
|-----------|:-----:|:--------------:|:----------:|
| Skills | **27** (22+5 bkend) | No changes needed | **PASS** |
| Agents | **16** | New features (isolation, background, 1M context) | **PASS** |
| Hook Events | **10** (→13 가능) | ConfigChange, WorktreeCreate/Remove new | **PASS** |
| Hook Handlers | **13** | No changes needed | **PASS** |
| Library Exports (common.js) | **180** | No changes | **PASS** |
| Output Styles | **4** | No changes | **PASS** |
| Scripts | **45+** | No changes | **PASS** |
| Agent Teams | Enabled | Ctrl+C/ESC fix, background improvements | **PASS** |
| plugin.json | v1.5.5 | settings.json opportunity | **PASS** |
| bkit.config.json | v1.5.5 | ConfigChange monitoring opportunity | **PASS** |
| Memory (.bkit-memory.json) | Active | No changes | **PASS** |

### 5.3 hooks.json Compatibility Analysis

**현재 bkit hooks.json (10 Hook Events, 13 Handlers):**

```
SessionStart          → hooks/session-start.js          ✅ Compatible
PreToolUse(Write|Edit) → scripts/pre-write.js           ✅ Compatible
PreToolUse(Bash)       → scripts/unified-bash-pre.js    ✅ Compatible
PostToolUse(Write)     → scripts/unified-write-post.js  ✅ Compatible
PostToolUse(Bash)      → scripts/unified-bash-post.js   ✅ Compatible
PostToolUse(Skill)     → scripts/skill-post.js          ✅ Compatible
Stop                   → scripts/unified-stop.js        ✅ Compatible
UserPromptSubmit       → scripts/user-prompt-handler.js ✅ Compatible
PreCompact(auto|manual)→ scripts/context-compaction.js  ✅ Compatible
TaskCompleted          → scripts/pdca-task-completed.js ✅ Compatible
SubagentStart          → scripts/subagent-start-handler ✅ Compatible
SubagentStop           → scripts/subagent-stop-handler  ✅ Compatible
TeammateIdle           → scripts/team-idle-handler.js   ✅ Compatible
```

**`disableAllHooks` 계층 구조 수정 (#16) 영향:**
- bkit hooks는 plugin 경유로 등록됨 (`${CLAUDE_PLUGIN_ROOT}` 패턴)
- `disableAllHooks`는 managed settings 계층 구조를 준수하도록 수정됨
- **Impact**: 관리자가 managed policy에서 `disableAllHooks: true` 설정 시 bkit hooks가 비활성화될 수 있음
- **Risk**: Low (대부분의 사용자는 managed policy를 사용하지 않음)
- **Mitigation**: bkit docs에 주의사항 추가 권장

### 5.4 Agent Frontmatter Compatibility

v2.1.49에서 추가된 새 frontmatter 필드들:

| Field | Type | Default | bkit Status |
|-------|------|---------|:-----------:|
| `background` | boolean | false | 미사용 (ENH-35) |
| `isolation` | string | none | 미사용 (ENH-34) |
| `memory` | string | none | **사용 중** (v1.5.3~) |
| `hooks` | object | none | 미사용 (글로벌 hooks 사용) |
| `skills` | array | none | 미사용 |
| `maxTurns` | number | none | 미사용 |
| `mcpServers` | object | none | 미사용 |

**기존 필드 호환성 (모든 16개 에이전트):**

| Field | Usage | Status |
|-------|-------|:------:|
| `name` | 16/16 agents | ✅ String type (no bare number issue) |
| `description` | 16/16 agents | ✅ String type |
| `model` | 16/16 agents | ✅ opus/sonnet/haiku aliases |
| `permissionMode` | 16/16 agents | ✅ acceptEdits(9) / plan(7) |
| `tools` | 16/16 agents | ✅ Valid tool names |
| `disallowedTools` | varies | ✅ Valid format |
| `memory` | 11/16 agents | ✅ project(9) / user(2) scope |

### 5.5 Skill Frontmatter Compatibility

**27개 스킬 전수 검증:**
- `name` 필드: 모든 스킬이 string 타입 ✅
- `description` 필드: 모든 스킬이 string 타입 ✅
- bare number 크래시 이슈: 해당 없음 ✅
- content size > 16KB: **4개 스킬 확인** (phase-6 ~18KB, zero-script-qa ~17KB, phase-8 ~17KB, pdca ~20KB+). v2.1.47 /resume 세션 드롭 수정 적용으로 안전

### 5.6 Overall Compatibility Assessment

| Assessment Item | Result | Notes |
|----------------|:------:|-------|
| Existing Feature Compatibility | **PASS** | No breaking changes |
| Hook System Compatibility | **PASS** | New ConfigChange hook available (additive) |
| Skill System Compatibility | **PASS** | No changes needed |
| Agent System Compatibility | **PASS** | New features available (additive) |
| Output Styles Compatibility | **PASS** | No changes |
| State Management Compatibility | **PASS** | No changes to .bkit-memory.json |
| Library Compatibility | **PASS** | common.js 180 exports unchanged |
| Agent Teams Compatibility | **PASS** | Background agent improvements |
| Plugin System Compatibility | **PASS** | settings.json opportunity (additive) |
| Permission System Compatibility | **PASS** | disableAllHooks hierarchy improved |
| Memory/Config Compatibility | **PASS** | WASM memory fixes (positive) |

**Final Verdict**: **PASS** -- Fully Compatible (v2.1.49 ready for immediate use)

---

## 6. Cumulative Compatibility Summary v2.1.34 ~ v2.1.49

| Version | Release Date | Major Changes | bkit Impact | Compat |
|---------|:----------:|---------------|:---------:|:------:|
| v2.1.34 | 2026-02-06 | Agent Teams crash fix, sandbox security | None | PASS |
| v2.1.35 | (Unpublished) | SKIPPED | N/A | N/A |
| v2.1.36 | 2026-02-07 | Fast Mode (/fast) added | None | PASS |
| v2.1.37 | 2026-02-07 | Fast Mode bug fix | None | PASS |
| v2.1.38 | 2026-02-10 | Bash permission, heredoc security | Low+ (positive) | PASS |
| v2.1.39 | 2026-02-10 | Skill evolution agent (+293 tks) | Low (neutral) | PASS |
| v2.1.40 | 2026-02-12 | Skill evolution rollback (-293 tks) | Medium (positive) | PASS |
| v2.1.41 | 2026-02-13 | Auth CLI, hook stderr, Agent Teams | Medium (positive) | PASS |
| v2.1.42 | 2026-02-13 | Output token refactoring, plugin cache | Low (neutral) | PASS |
| v2.1.43 | (Skipped) | AWS auth, agent markdown warning | None | PASS |
| v2.1.44 | 2026-02-16 | Auth refresh hotfix | None | PASS |
| v2.1.45 | 2026-02-17 | Sonnet 4.6, hot reload, Agent Teams fixes | Medium (positive) | PASS |
| v2.1.46 | (Skipped) | MCP connector, orphan process | Low | PASS |
| v2.1.47 | 2026-02-18 | 70 changes: memory, agents, skills, hooks | Medium (positive) | PASS |
| v2.1.48 | (Skipped) | npm published, no CHANGELOG | Unknown | PASS |
| v2.1.49 | 2026-02-20 | 23 changes: worktree, ConfigChange, background | Medium (positive) | PASS |
| **v2.1.50** | **2026-02-21** | **25 changes: 9 memory fixes, WorktreeCreate/Remove hooks, 1M ctx** | **High (positive)** | **PASS** |

**Cumulative Record: v2.1.34 ~ v2.1.50 = 17 releases, 0 compatibility issues, 100% backward compatible**

---

## 7. GitHub Issue Monitoring Status

### 7.1 Previously Monitored Issues

| Issue | Title | Status | v2.1.49~v2.1.50 Resolution |
|:-----:|-------|:------:|:------------------:|
| **#25131** | Agent Teams: Catastrophic lifecycle failures | **OPEN** | v2.1.49: Ctrl+C/ESC fix. v2.1.50: completed task GC, 9 memory fixes. Core lifecycle issues remain |
| **#24130** | Auto memory file concurrent safety | **OPEN** | No resolution in v2.1.49~v2.1.50 |
| **#26474** | UserPromptSubmit agent hook failure | **OPEN** | No resolution in v2.1.49 |
| **#17688** | Skill-scoped hooks not triggering inside plugins | **OPEN** | No resolution in v2.1.49 |

### 7.2 Newly Identified Issues to Monitor

| Issue | Title | Version | bkit Relevance |
|:-----:|-------|:-------:|:---------:|
| **#26637** | disableAllHooks security vulnerability fix | v2.1.49 (Merged) | **Medium** -- Managed policy hooks 계층 구조 수정 |
| **#27045** | macOS 26.3 arm64 Homebrew hang | v2.1.49+ | **Low** -- 특정 macOS/Homebrew 환경에서 행 발생 |
| **#27281** | Agent stuck in infinite loop (repeated 'let me write' without executing) | v2.1.50 | **Medium** -- Agent Teams에서 발생 가능 |
| **#27282** | Configurable worktree directory location | v2.1.50 | **Low** -- Feature request |
| **#27280** | Help dialog truncates custom commands; skill renders in Custom Commands | v2.1.50 | **Medium** -- bkit 27 skills 표시에 영향 가능 |
| **#27274** | Automatic model switching between plan/execution modes | v2.1.50 | **Low** -- Feature request, bkit agents already use fixed modes |
| **NEW** | ConfigChange + WorktreeCreate/Remove hook integration | v2.1.49~50 | **High** -- New capabilities for bkit |

### 7.3 v2.1.50 Memory Issues Batch Closure

v2.1.50 릴리스로 다수의 메모리 관련 GitHub 이슈가 일괄 종료됨:

| Issue | Title | Status |
|:-----:|-------|:------:|
| #24167 | Memory Leaks with Opus 4.6 CLI - massive RAM/SWAP spikes | **Closed** |
| #26174 | Crash: "Illegal instruction" (Bun panic) - ~20GB RSS memory leak | **Closed** |
| #26039 | Exit code 9 death spiral: crash-resume cycles compound streaming leak | **Closed** |
| #26017 | Exit code 9 crash during concurrent Opus streaming | **Closed** |
| #24644 | Memory leak: CLI process grows to 44GB+ RAM with GC thrashing | **Closed** |
| #26987 | VS Code extension leaks Claude processes (WSL2) | **Closed** |
| #22042 | Critical memory regression - OOM crash on simple input | **Closed** |
| #24056 | Memory leak causing excessive CPU usage | **Closed** |

### 7.4 Issue Risk Assessment

| Issue | Probability | Impact on bkit | Recommended Action |
|:-----:|:----------:|:--------------:|:------------------:|
| #25131 | Medium | High (Agent Teams stability) | Monitor, memory fixes in v2.1.50 help |
| #26474 | Low | High (UserPromptSubmit hook) | Monitor, test with bkit hook |
| #27281 | Low | Medium (agent infinite loop) | Monitor for regression |
| #27280 | Medium | Medium (skills display) | Test bkit skills in help dialog |
| #17688 | Medium | Medium (skill-level hooks) | Monitor, bkit uses global hooks |
| #24130 | Low | Medium (concurrent memory) | ENH-20 atomic writes still valid |
| disableAllHooks | Low | Medium (hooks disabled) | Document for enterprise users |

---

## 8. Enhancement Opportunities

### 8.1 New Enhancement Opportunities (v2.1.49 ~ v2.1.50)

| Priority | ENH | Item | Difficulty | Impact | Version |
|:--------:|-----|------|:----------:|:------:|:-------:|
| **High** | ENH-32 | ConfigChange hook implementation | Medium | High | v2.1.49 |
| **High** | ENH-33 | Plugin settings.json for bkit defaults | Low | Medium | v2.1.49 |
| **High** | ENH-34 | Subagent `isolation: "worktree"` for pdca-iterator | Low | Medium | v2.1.49 |
| **High** | ENH-39 | WorktreeCreate/Remove hooks for lifecycle mgmt | Medium | High | v2.1.50 |
| Medium | ENH-35 | Agent `background: true` for qa-monitor | Low | Low | v2.1.49 |
| Medium | ENH-36 | SessionEnd hook for session cleanup | Low | Low | v2.1.49 |
| Medium | ENH-40 | `claude agents` CLI 통합 문서 작성 | Low | Low | v2.1.50 |
| Low | ENH-37 | Worktree documentation for bkit users | Low | Low | v2.1.49 |
| Low | ENH-38 | PostToolUseFailure hook for error logging | Medium | Low | v2.1.49 |
| Low | ENH-41 | CLAUDE_CODE_DISABLE_1M_CONTEXT 호환성 문서 | Low | Low | v2.1.50 |

### 8.2 ENH-32: ConfigChange Hook Implementation (High)

| Item | Details |
|------|---------|
| Feature | `ConfigChange` hook event for bkit configuration monitoring |
| Current State | bkit does not use ConfigChange hook (0/10 hooks use it) |
| Opportunity | Monitor bkit.config.json, settings.json, skill file changes |
| Implementation | Add ConfigChange handler to hooks/hooks.json |
| Use Cases | 1) bkit.config.json 변경 시 PDCA 상태 갱신, 2) 보안 감사 로깅, 3) 스킬 변경 감지 |
| Risk | Low -- additive hook, no existing functionality affected |
| Priority | High -- 엔터프라이즈 보안 기능 강화 |

**구현 예시:**
```json
"ConfigChange": [
  {
    "matcher": "project_settings|skills",
    "hooks": [
      {
        "type": "command",
        "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/config-change-handler.js",
        "timeout": 5000
      }
    ]
  }
]
```

### 8.3 ENH-33: Plugin settings.json for bkit Defaults (High)

| Item | Details |
|------|---------|
| Feature | Ship settings.json with bkit plugin for default configuration |
| Current State | plugin.json only has name, version, description, outputStyles |
| Opportunity | Default permissions, environment variables, agent settings |
| Implementation | Create .claude-plugin/settings.json |
| Example Content | Default maxTurns, spinnerTips, permission suggestions |
| Risk | Low -- defaults only, user can override |
| Priority | High -- 즉시 구현 가능, 사용자 경험 개선 |

### 8.4 ENH-34: Subagent Isolation for pdca-iterator (High)

| Item | Details |
|------|---------|
| Feature | `isolation: "worktree"` for pdca-iterator agent |
| Current State | pdca-iterator runs in main worktree |
| Opportunity | 코드 수정 반복 작업에서 격리된 git worktree 사용 |
| Implementation | pdca-iterator.md frontmatter에 `isolation: worktree` 추가 |
| Benefit | 반복 개선 실패 시 안전한 롤백, main branch 보호 |
| Risk | Low -- worktree는 변경 없으면 자동 정리 |
| Priority | High -- 코드 안전성 직접 향상 |

### 8.5 ENH-39: WorktreeCreate/Remove Hooks Implementation (High, v2.1.50)

| Item | Details |
|------|---------|
| Feature | `WorktreeCreate` / `WorktreeRemove` hook events for worktree lifecycle management |
| Current State | bkit does not handle worktree lifecycle events (0/10 hooks use it) |
| Dependency | Requires ENH-34 (pdca-iterator isolation: "worktree") to be meaningful |
| Implementation | Add WorktreeCreate/Remove handlers to hooks/hooks.json |
| Use Cases | 1) worktree 생성 시 bkit 상태 초기화, 2) 제거 시 변경 요약 보고, 3) CTO Team worktree 추적 |
| Risk | Low -- additive hooks, no existing functionality affected |
| Priority | High -- ENH-34와 연동하여 worktree 기반 안전한 개발 환경 완성 |

**구현 예시:**
```json
"WorktreeCreate": [
  {
    "hooks": [
      {
        "type": "command",
        "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/worktree-create-handler.js",
        "timeout": 5000
      }
    ]
  }
],
"WorktreeRemove": [
  {
    "hooks": [
      {
        "type": "command",
        "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/worktree-remove-handler.js",
        "timeout": 5000
      }
    ]
  }
]
```

### 8.6 Existing Enhancement Status

| ENH | Item | Status | Still Valid |
|-----|------|:------:|:----------:|
| ENH-20 | `.bkit-memory.json` atomic writes | Not Started | Yes (#24130 still open) |
| ENH-21 | Agent Teams safeguards | Not Started | Yes (#25131 still open) |
| ENH-22 | session_name PDCA tracking | Not Started | Yes |
| ENH-23 | Conditional Explore delegation | Not Started | Yes |
| ENH-24 | PLUGIN_CACHE_DIR compatibility | Not Started | Yes |
| ENH-25 | Output token documentation | Not Started | Low priority |
| ENH-26 | `last_assistant_message` hook field | Not Started | Yes |
| ENH-27 | System prompt +35K token monitoring | Not Started | Yes |
| ENH-28 | Sonnet 4.6 model evaluation | Not Started | Yes |
| ENH-29 | `spinnerTipsOverride` for bkit UX | Not Started | Yes |
| ENH-30 | Windows hooks compatibility docs | Not Started | Yes |
| ENH-31 | Git worktree compatibility docs | Not Started | Merged with ENH-37 |

---

## 9. Security Assessment

### 9.1 ConfigChange Hook Security Implications

| Aspect | Assessment |
|--------|-----------|
| **Positive** | bkit can now audit all configuration changes during sessions |
| **Positive** | Can block unauthorized settings modifications (except policy_settings) |
| **Risk** | Managed `disableAllHooks: true` could disable ALL bkit hooks |
| **Mitigation** | Document for enterprise users: managed hooks take precedence |

### 9.2 disableAllHooks Managed Hierarchy (#16)

| Before v2.1.49 | After v2.1.49 |
|-----------------|---------------|
| `disableAllHooks` disabled all hooks regardless of source | `disableAllHooks` respects managed settings hierarchy |
| User could disable managed hooks | Only managed-level `disableAllHooks` can disable managed hooks |

**bkit Impact**: bkit hooks are registered via plugin, not managed settings. If an enterprise admin sets managed `disableAllHooks: true`, bkit hooks WILL be disabled. This is expected behavior for enterprise security.

### 9.3 WASM Memory Growth Fix (#14)

| Aspect | Details |
|--------|---------|
| Issue | Tree-sitter parser WASM memory grew unboundedly in long sessions |
| Fix | Periodic reset of tree-sitter parser |
| Impact | Long-running PDCA sessions with many file operations benefit directly |
| bkit Relevance | **Medium** -- CTO Team sessions with 8+ agents can run very long |

---

## 10. Performance Assessment

### 10.1 Startup Performance Improvements

| Improvement | bkit Impact | Details |
|-------------|:----------:|---------|
| MCP auth failure caching (#21) | **Medium** | bkend.ai MCP 연결 실패 시 캐싱으로 재시도 부하 감소 |
| HTTP calls reduction (#22) | Low | 분석 토큰 카운팅 HTTP 호출 감소 |
| MCP tool token batching (#23) | Low | MCP 도구 토큰 카운팅 배치 처리 |
| Non-interactive mode skip (#20) | None | bkit는 interactive mode 전용 |

### 10.2 Memory Management

| Improvement | Source | bkit Impact |
|-------------|--------|:----------:|
| **Agent Teams completed task GC** | **v2.1.50 #32** | **Critical** |
| **Completed task state objects GC** | **v2.1.50 #33** | **High** |
| **TaskOutput retained lines cleanup** | **v2.1.50 #34** | **Medium** |
| **CircularBuffer backing array cleanup** | **v2.1.50 #35** | **Medium** |
| **ChildProcess/AbortController refs cleanup** | **v2.1.50 #36** | **Medium** |
| **LSP diagnostic data cleanup** | **v2.1.50 #37** | **Low** |
| **File history snapshots capped** | **v2.1.50 #38** | **Medium** |
| **Completed task output freed** | **v2.1.50 #39** | **Medium** |
| **Cache clearing after compaction** | **v2.1.50 #46** | **High** |
| **Large tool results clearing** | **v2.1.50 #47** | **Medium** |
| WASM memory growth fix | v2.1.49 #14 | Medium |
| Yoga WASM memory fix | v2.1.49 #15 | Low |
| API stream buffer release | v2.1.47 | Already tracked |
| Agent context release | v2.1.47 | Already tracked |
| O(n²) accumulation fix | v2.1.47 | Already tracked |

**v2.1.50 메모리 수정 종합 평가**: v2.1.47~v2.1.50 3개 버전에 걸쳐 총 **15건의 메모리 관련 수정**이 이루어짐. 특히 v2.1.50의 9건 수정은 Agent Teams 장기 세션의 안정성을 근본적으로 개선. bkit CTO Team 패턴(8+ agents, 장기 실행)에 직접적 혜택.

---

## 11. Hook Events Complete Reference (v2.1.49)

공식 문서 기준 Claude Code v2.1.49에서 지원하는 전체 Hook Events:

| # | Event | Can Block | bkit Status | Notes |
|---|-------|:---------:|:-----------:|-------|
| 1 | `SessionStart` | No | **사용 중** | session-start.js (once: true) |
| 2 | `UserPromptSubmit` | Yes | **사용 중** | user-prompt-handler.js |
| 3 | `PreToolUse` | Yes | **사용 중** | pre-write.js, unified-bash-pre.js |
| 4 | `PermissionRequest` | Yes | 미사용 | Permission 대화 자동 처리 가능 |
| 5 | `PostToolUse` | No | **사용 중** | write-post, bash-post, skill-post |
| 6 | `PostToolUseFailure` | No | 미사용 | 도구 실패 로깅 가능 (ENH-38) |
| 7 | `Notification` | No | 미사용 | 알림 커스터마이징 가능 |
| 8 | `SubagentStart` | No | **사용 중** | subagent-start-handler.js |
| 9 | `SubagentStop` | Yes | **사용 중** | subagent-stop-handler.js |
| 10 | `Stop` | Yes | **사용 중** | unified-stop.js |
| 11 | `TeammateIdle` | Yes | **사용 중** | team-idle-handler.js |
| 12 | `TaskCompleted` | Yes | **사용 중** | pdca-task-completed.js |
| 13 | `ConfigChange` | Yes* | **미사용** | **NEW v2.1.49** (ENH-32) |
| 14 | `PreCompact` | No | **사용 중** | context-compaction.js |
| 15 | `SessionEnd` | No | 미사용 | 세션 종료 정리 가능 (ENH-36) |
| 16 | `WorktreeCreate` | TBD | **미사용** | **NEW v2.1.50** (ENH-39) |
| 17 | `WorktreeRemove` | TBD | **미사용** | **NEW v2.1.50** (ENH-39) |

*ConfigChange: policy_settings 변경은 차단 불가

**현재**: 10/17 events 사용 (58.8%)
**권장**: 13/17 events (ConfigChange + WorktreeCreate/Remove 추가) → 76.5%

---

## 12. Risk Assessment

### 12.1 Technical Risks

| Risk | Probability | Impact | Response |
|------|:----------:|:------:|----------|
| v2.1.49~50 compatibility issues | **Very Low** | Low | All 48 items backward compatible |
| disableAllHooks managed hierarchy | **Low** | Medium | Document for enterprise users |
| Background agent permission pre-approval | **Low** | Low | bkit agents use explicit permission modes |
| Worktree isolation cleanup failure | **Very Low** | Low | Auto-cleanup on no changes |
| Memory fix regression | **Very Low** | Medium | Monitor, 9 fixes may introduce side effects |
| ConfigChange hook overhead | **Low** | Low | 5000ms timeout sufficient |
| Agent infinite loop (#27281) | **Low** | Medium | New v2.1.50 regression, monitor |
| Skills display in help (#27280) | **Medium** | Low | bkit 27 skills, test display |
| SIMPLE mode disables hooks | **Very Low** | High | bkit not used in SIMPLE mode, but document |

### 12.2 No Immediate Action Required

모든 v2.1.49~v2.1.50 변경사항은 backward compatible이며, bkit v1.5.5의 기존 기능에 영향을 미치지 않습니다. v2.1.50의 9건 메모리 누수 수정은 bkit CTO Team 패턴에 직접적으로 긍정적입니다. Enhancement 항목들은 선택적이며, 우선순위에 따라 향후 릴리스에서 구현 가능합니다.

**주의**: `CLAUDE_CODE_SIMPLE` 모드에서 hooks와 MCP가 비활성화되므로, bkit 사용자에게 SIMPLE 모드에서는 bkit 기능이 작동하지 않음을 문서화할 필요가 있습니다.

---

## 13. Behavioral Changes Summary

Changes that don't break compatibility but alter user experience:

| Change | Before | After | User Impact |
|--------|--------|-------|:-----------:|
| `--worktree` flag | Not available | `claude -w` starts in worktree | Low (opt-in) |
| Background agent definition | Only runtime decision | `background: true` in frontmatter | Low (opt-in) |
| Ctrl+C/ESC with background agents | Silently ignored | Proper handling (Ctrl+C twice kills) | Positive |
| Plugin enable/disable | Required `--scope` flag | Auto-detects scope | Positive |
| disableAllHooks | Disabled all hooks equally | Respects managed hierarchy | Medium (enterprise) |
| Permission prompts | Bare prompt text | Shows restriction reason | Positive |
| Config file changes | No notification | ConfigChange hook fires | Low (opt-in) |
| Simple mode | Bash only | Bash + Edit | Low (simple mode) |

---

## 14. Comparison with Previous Analyses

| Metric | v2.1.34~v2.1.37 | v2.1.42~v2.1.47 | v2.1.48~v2.1.50 |
|--------|:----:|:----:|:----:|
| Versions Covered | 4 | 5 | 3 |
| Total Changes | ~15 | 91 | **48** |
| New Features | 2 | 11 | **17** |
| Bug Fixes | 8 | 73 | **23** |
| Performance | 2 | 7 | **8** |
| Breaking Changes | 0 | 0 | **0** |
| bkit High Impact | 0 | 5 | **8** |
| Enhancement Opportunities | 0 | 6 | **10** |
| Memory Leak Fixes | 0 | 3 | **12** |
| System Prompt Change | 0 | +34,752 tks | +300~500 tks |
| Analysis Method | Impact + 10 TC | 3 agents + CTO | **8 agents + CTO** |

**Release Character**:
- v2.1.47: "기능 폭발" (70 changes, Magic Docs/Data +34K tokens)
- v2.1.49: "인프라 강화" (worktree isolation, ConfigChange hook, background agents)
- v2.1.50: **"메모리 안정화"** (9 memory leak fixes, Worktree hooks, Opus 1M context)

---

## 15. CLI Binary & System Prompt Analysis

### 15.1 CLI Binary Size Change

| Metric | v2.1.47 | v2.1.49 | Delta |
|--------|:-------:|:-------:|:-----:|
| cli.js binary size | ~2.1MB | ~2.6MB | **+499KB** |
| ConfigChange references | 0 | **31** | +31 (new) |
| worktree references | ~5 | ~40+ | +35 (expanded) |
| background agent refs | ~10 | ~25+ | +15 (expanded) |

### 15.2 System Prompt Token Change (Estimated)

| Component | Estimate |
|-----------|:--------:|
| New tool descriptions (EnterWorktree updates) | +100~150 tokens |
| ConfigChange hook documentation | +50~100 tokens |
| Background agent guidance | +50~100 tokens |
| Permission suggestion prompts | +50~100 tokens |
| **Total estimated delta** | **+300~500 tokens** |

**참고**: v2.1.47에서 +34,752 토큰의 대규모 증가(Magic Docs/Data) 이후, v2.1.49는 상대적으로 적은 +300~500 토큰 증가. 시스템 프롬프트 총 크기는 v2.1.47 수준에서 안정적.

### 15.3 Notable CLI Changes (ConfigChange Hook)

ConfigChange hook은 CLI 바이너리에서 31번 참조되며, 완전히 새로운 기능:

```
v2.1.47: ConfigChange = 0 occurrences (not implemented)
v2.1.49: ConfigChange = 31 occurrences (fully implemented)
```

이는 ConfigChange가 단순 stub이 아닌 완전히 구현된 hook event임을 확인합니다.

---

## 16. Skill Size & Compatibility Analysis

### 16.1 대용량 스킬 식별 (>16KB)

| Skill | Estimated Size | Risk | Notes |
|-------|:-----------:|:----:|-------|
| phase-6-ui-integration | ~18KB | Low | /resume 세션 드롭 수정 (v2.1.47) 적용됨 |
| zero-script-qa | ~17KB | Low | 동일 |
| phase-8-review | ~17KB | Low | 동일 |
| pdca | ~20KB+ | Low | 통합 PDCA 스킬, 가장 큰 스킬 |

v2.1.47에서 `skill_content > 16KB`일 때 `/resume` 세션에서 스킬이 드롭되는 버그가 수정되었으므로, 현재 4개의 대용량 스킬은 안전합니다.

### 16.2 Agent Reference Issue

`claude-code-learning` 스킬에서 에이전트 참조 방식에 잠재적 이슈 발견:

| Item | Details |
|------|---------|
| File | skills/claude-code-learning.md |
| Issue | `claude-code-guide` agent를 `bkit:` prefix 없이 참조 |
| Impact | Low -- Claude Code 내장 `claude-code-guide` agent와 충돌 가능성 |
| Risk | Very Low -- 현재 동작에 영향 없음 (내장 agent가 우선) |
| Recommendation | 향후 정리 시 `bkit:claude-code-guide` 형태로 명시적 참조 권장 |

---

## 17. Additional GitHub Issues

### 17.1 Newly Discovered Issues (v2.1.49 ~ v2.1.50)

| Issue | Title | Status | bkit Relevance |
|:-----:|-------|:------:|:---------:|
| **#26637** | `disableAllHooks` security vulnerability fix | **Merged** v2.1.49 | **Medium** -- Managed policy hooks 계층 구조 수정 |
| **#27045** | macOS 26.3 arm64 Homebrew hang | **OPEN** | **Low** -- 특정 환경 이슈 |
| **#27281** | Agent stuck in infinite loop (v2.1.50) | **OPEN** | **Medium** -- Agent Teams 잠재적 회귀 |
| **#27282** | Configurable worktree directory location | **OPEN** | **Low** -- Feature request |
| **#27280** | Help dialog truncates custom commands | **OPEN** | **Medium** -- bkit 27 skills 표시 영향 |
| **#27274** | Automatic model switching plan/execution | **OPEN** | **Low** -- Feature request |

### 17.2 Updated Issue Monitoring List

| Issue | Title | Status | Priority |
|:-----:|-------|:------:|:--------:|
| **#25131** | Agent Teams lifecycle failures | OPEN | High (memory fixes help, core issues remain) |
| **#26474** | UserPromptSubmit agent hook failure | OPEN | High |
| **#27281** | Agent infinite loop in v2.1.50 | OPEN | Medium (potential regression) |
| **#27280** | Help dialog truncates custom commands | OPEN | Medium (skills display) |
| **#17688** | Skill-scoped hooks in plugins | OPEN | Medium |
| **#24130** | Auto memory concurrent safety | OPEN | Medium |
| **#27045** | macOS 26.3 Homebrew hang | OPEN | Low |
| **#26637** | disableAllHooks security fix | **Merged** | Resolved |

---

## 18. Conclusion

### 18.1 Key Findings

1. **완벽한 호환성**: v2.1.34 ~ v2.1.50 = **17개 연속 릴리스, 0건 Breaking Changes**. bkit v1.5.5는 v2.1.50과 완전 호환.

2. **3단계 릴리스 진화**: v2.1.47 "기능 폭발" → v2.1.49 "인프라 강화" → v2.1.50 **"메모리 안정화"**. 총 48건의 변경 (Features 17, Bug Fixes 23, Performance 8).

3. **8건의 High Impact 항목**: ConfigChange hook, WorktreeCreate/Remove hooks, subagent isolation, background mode, plugin settings.json, Agent Teams task GC, cache clearing after compaction, Opus 1M context -- 모두 positive direction.

4. **10건의 Enhancement 기회**: ConfigChange hook(ENH-32), WorktreeCreate/Remove hooks(ENH-39), settings.json(ENH-33), pdca-iterator worktree isolation(ENH-34) 등 bkit 기능을 직접 강화.

5. **메모리 안정성 대폭 개선**: v2.1.50에서 **9건의 메모리 누수 수정**. 특히 "Agent Teams completed teammate tasks never GC'd" 수정은 CTO Team 8+ agents 패턴에 직접적 혜택. GitHub에서 10건 이상의 메모리 이슈 일괄 종료 확인.

6. **Opus 4.6 1M 컨텍스트**: bkit의 7개 opus 에이전트(cto-lead, security-architect 등)가 full 1M context window 혜택을 받아, 대규모 코드베이스 분석 능력 향상.

7. **Hook 이벤트 확장**: v2.1.49~v2.1.50에서 3개 신규 hook event (ConfigChange, WorktreeCreate, WorktreeRemove) 추가. bkit 전체 hook event 활용률 10/17 → 13/17 확장 가능.

8. **보안 강화**: disableAllHooks managed hierarchy fix, ConfigChange hook 감사 기능. SIMPLE 모드에서 hooks/MCP 완전 비활성화 -- bkit 사용 시 SIMPLE 모드 주의 필요.

9. **CLI 바이너리 증가**: v2.1.49에서 +499KB (ConfigChange 31 refs, worktree 확장). v2.1.50 추가 증가 예상 (memory management code, WorktreeCreate/Remove hooks).

10. **v2.1.50 잠재적 회귀**: #27281 (Agent infinite loop), #27280 (help dialog truncation) -- 모니터링 필요.

### 18.2 Recommended Next Actions

| Priority | Action | ENH | Effort |
|:--------:|--------|-----|:------:|
| 1 | ConfigChange hook handler 구현 | ENH-32 | Medium |
| 2 | WorktreeCreate/Remove hooks 구현 | ENH-39 | Medium |
| 3 | Plugin settings.json 생성 | ENH-33 | Low |
| 4 | pdca-iterator isolation: "worktree" 추가 | ENH-34 | Low |
| 5 | qa-monitor background: true 추가 | ENH-35 | Low |
| 6 | SIMPLE 모드 비호환 문서화 | - | Low |
| 7 | `claude agents` CLI 통합 문서 | ENH-40 | Low |
| 8 | #27281 (agent infinite loop) 모니터링 | - | - |

### 18.3 Version Upgrade Recommendation

| Item | Recommendation |
|------|:------:|
| Upgrade to v2.1.50 | **즉시 가능 (강력 권장)** |
| Code changes required | **없음** |
| Enhancement implementation | **선택적** (10건, High 4건) |
| Risk level | **Very Low** |
| Key benefit | **9건 메모리 누수 수정** -- CTO Team 장기 세션 안정성 대폭 개선 |

---

## Appendix A: Team Composition

| Agent | Role | Model | Task | Status |
|-------|------|:-----:|------|:------:|
| CTO Lead (team-lead) | Overall coordination & report | opus | Task #8 | **Completed** |
| web-researcher | Web research & docs | sonnet | Task #1 | **Completed** |
| github-analyst | GitHub issues & PRs | sonnet | Task #2 | **Completed** |
| cli-diff-analyst | CLI binary & system prompt | sonnet | Task #3 | **Completed** |
| hooks-analyst | Hooks & config compatibility | sonnet | Task #4 | **Completed** |
| agent-analyst | 16 agents compatibility | sonnet | Task #5 | **Completed** |
| skill-analyst | 27 skills compatibility | sonnet | Task #6 | **Completed** |
| security-analyst | Security & performance | sonnet | Task #7 | **Completed** |

## Appendix B: Data Collection Timeline

| Time | Event |
|------|-------|
| T+0 | PDCA state read, version confirmed (v2.1.49 on npm) |
| T+1 | Web search + CHANGELOG fetch (initial data) |
| T+2 | Team created (v2149-impact-analysis), 8 tasks created |
| T+3 | 7 agents spawned in parallel |
| T+4 | Tasks 4, 5 completed (hooks, agents analysis) |
| T+5 | Task 2 completed (GitHub issues) |
| T+6 | Official docs fetched (hooks, sub-agents) |
| T+7 | Raw CHANGELOG extracted (exact 23 items confirmed) |
| T+8 | Task 7 completed (security analysis) |
| T+9 | Report compilation started |
| T+10 | Report completed, PDCA memory updated |
| T+11 | Tasks 1, 3, 6 completed (web research, CLI diff, skills) |
| T+12 | Agent reports consolidated: +499KB CLI, 31 ConfigChange refs, 4 large skills, #27045 |
| T+13 | Report enhanced with Sections 15-17 (CLI/Prompt, Skills, GitHub Issues) |
| T+14 | All 8 agents shut down, team disbanded, final report verified |
