# bkit v1.5.9 Doc Sync Design Document

> **Feature**: bkit-v1.5.9-doc-sync
> **Plan**: `docs/01-plan/features/bkit-v1.5.9-doc-sync.plan.md`
> **Date**: 2026-03-04
> **Status**: Draft

---

## 1. Overview

v1.5.9 코드 구현 완료 후 잔존하는 문서/버전 불일치를 해소한다. 코드 로직 변경 0건, 텍스트만 수정.

---

## 2. Change Specification

### Phase 1: @version JSDoc (48 files)

**Method**: `Edit` with `replace_all: true`

**Target**: `@version 1.5.8` → `@version 1.5.9`

#### lib/ (39 files)

| # | File | Line |
|:-:|------|:----:|
| 1 | `lib/common.js` | 4 |
| 2 | `lib/context-fork.js` | 6 |
| 3 | `lib/context-hierarchy.js` | 6 |
| 4 | `lib/import-resolver.js` | 6 |
| 5 | `lib/memory-store.js` | 6 |
| 6 | `lib/permission-manager.js` | 6 |
| 7 | `lib/skill-orchestrator.js` | 12 |
| 8 | `lib/core/index.js` | 4 |
| 9 | `lib/core/paths.js` | 4 |
| 10 | `lib/core/platform.js` | 4 |
| 11 | `lib/core/config.js` | 4 |
| 12 | `lib/core/cache.js` | 4 |
| 13 | `lib/core/debug.js` | 4 |
| 14 | `lib/core/io.js` | 4 |
| 15 | `lib/core/file.js` | 4 |
| 16 | `lib/pdca/index.js` | 4 |
| 17 | `lib/pdca/tier.js` | 4 |
| 18 | `lib/pdca/level.js` | 4 |
| 19 | `lib/pdca/phase.js` | 4 |
| 20 | `lib/pdca/status.js` | 4 |
| 21 | `lib/pdca/automation.js` | 4 |
| 22 | `lib/intent/index.js` | 4 |
| 23 | `lib/intent/language.js` | 4 |
| 24 | `lib/intent/trigger.js` | 4 |
| 25 | `lib/intent/ambiguity.js` | 4 |
| 26 | `lib/task/index.js` | 4 |
| 27 | `lib/task/tracker.js` | 4 |
| 28 | `lib/task/context.js` | 4 |
| 29 | `lib/task/creator.js` | 4 |
| 30 | `lib/task/classification.js` | 4 |
| 31 | `lib/team/index.js` | 4 |
| 32 | `lib/team/coordinator.js` | 4 |
| 33 | `lib/team/strategy.js` | 4 |
| 34 | `lib/team/orchestrator.js` | 4 |
| 35 | `lib/team/task-queue.js` | 4 |
| 36 | `lib/team/communication.js` | 4 |
| 37 | `lib/team/state-writer.js` | 4 |
| 38 | `lib/team/hooks.js` | 4 |
| 39 | `lib/team/cto-logic.js` | 4 |

#### scripts/ (9 files)

| # | File | Line |
|:-:|------|:----:|
| 40 | `scripts/code-review-stop.js` | 7 |
| 41 | `scripts/context-compaction.js` | 6 |
| 42 | `scripts/learning-stop.js` | 7 |
| 43 | `scripts/pdca-skill-stop.js` | 9 |
| 44 | `scripts/phase5-design-stop.js` | 8 |
| 45 | `scripts/phase6-ui-stop.js` | 11 |
| 46 | `scripts/phase9-deploy-stop.js` | 10 |
| 47 | `scripts/skill-post.js` | 8 |
| 48 | `scripts/user-prompt-handler.js` | 6 |

**Note**: `scripts/instructions-loaded-handler.js`는 이미 `@version 1.5.9` — 변경 불필요.

---

### Phase 2: marketplace.json (1 file)

**File**: `.claude-plugin/marketplace.json`

#### Change 1: Root version (line 4)
```
Before: "version": "1.5.8",
After:  "version": "1.5.9",
```

#### Change 2: bkit plugin description (line 36)
```
Before: "description": "Vibecoding Kit - PDCA methodology + CTO-Led Agent Teams + Claude Code mastery for AI-native development. Includes 27 skills, 16 agents, 45 scripts, 10 hook events, and 4 output styles for structured development workflows.",
After:  "description": "Vibecoding Kit - PDCA methodology + CTO-Led Agent Teams + Claude Code mastery for AI-native development. Includes 27 skills, 16 agents, 46 scripts, 11 hook events, and 4 output styles for structured development workflows.",
```

#### Change 3: bkit plugin version (line 37)
```
Before: "version": "1.5.8",
After:  "version": "1.5.9",
```

---

### Phase 3: CHANGELOG (2 files)

#### File 1: `CHANGELOG.md` — Insert before line 8 (`## [1.5.8]`)

```markdown
## [1.5.9] - 2026-03-04

### Added
- **InstructionsLoaded Hook Handler** (`scripts/instructions-loaded-handler.js`)
  - CLAUDE.md 로드 시 bkit PDCA 컨텍스트 자동 주입 (CC v2.1.64+)
  - primaryFeature, matchRate, activeCount 표시
  - agent_id 추출 및 에러 폴백
- **Hook Handler agent_id/agent_type Support** (ENH-62)
  - subagent-start-handler, subagent-stop-handler, team-idle-handler, pdca-task-completed에 agent_id/agent_type 직접 활용
  - hookSpecificOutput에 agentId/agentType 필드 추가
- **CTO Team continue:false Auto-Termination** (ENH-63)
  - team-idle-handler: primary feature 완료 시 continue:false 반환
  - pdca-task-completed: report phase 완료 + 미할당 태스크 없을 시 continue:false 반환
  - Safety guard: catch → shouldContinue = true (안전 방향 폴백)
- **Background Analysis Agents** (ENH-69)
  - 5 agents: gap-detector, design-validator, code-analyzer, security-architect, report-generator
  - `background: true` frontmatter for parallel execution
- **Analysis Triad** (ENH-70)
  - code-analyzer: `context: fork` + `mergeResult: false` for isolated analysis
  - gap-detector + design-validator + code-analyzer 병렬 실행 패턴

### Changed
- **hooks.json**: InstructionsLoaded 이벤트 등록 (hook events 10 → 11, entries 13 → 14)
- **lib/common.js**: Bridge exports 186 → 190 (+4 from export count corrections)
- **CC Recommended Version**: v2.1.63 → v2.1.66
- **Official Docs URL**: docs.anthropic.com → code.claude.com
- **session-start.js**: v1.5.9 Enhancements 섹션 추가 (9 items)
- **README.md**: CC badge v2.1.66+, URL code.claude.com

### Quality
- Comprehensive Test: 936 TC, 926 PASS, 5 FAIL (edge case), 5 SKIP (by design), 99.5%
- 4 QA agents parallel execution (CTO Team)
- Design match rate: 100% (25/25 FR)

### Compatibility
- Claude Code: Minimum v2.1.33, Recommended v2.1.66
- Node.js: Minimum v18.0.0
- Agent Teams: Requires Claude Code v2.1.32+ with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
- v2.1.63 graceful fallback: InstructionsLoaded event not dispatched, agent_id falls back, continue:false ignored

---
```

#### File 2: `docs/04-report/changelog.md` — Insert before existing v1.5.8 entry

```markdown
## [2026-03-04] - bkit v1.5.9 InstructionsLoaded Hook & CTO Team Enhancement

### Added
- InstructionsLoaded hook handler: CLAUDE.md context injection (CC v2.1.64+)
- Hook handler agent_id/agent_type: precise agent identification in 4 handlers
- CTO Team continue:false: automatic teammate termination
- 5 background analysis agents, code-analyzer Analysis Triad (context:fork)

### Changed
- Hook events: 10 → 11 (InstructionsLoaded added)
- Scripts: 45 → 46 (instructions-loaded-handler.js added)
- common.js exports: 186 → 190
- CC recommended: v2.1.63 → v2.1.66
- Official docs: code.claude.com

### Test Results
- **936 TC**: 926 PASS, 5 FAIL (edge case), 5 SKIP (by design)
- **Pass Rate**: 99.5%
- **Design Match Rate**: 100% (25/25 FR)

### Files Modified
- New: `scripts/instructions-loaded-handler.js` (~85 LOC)
- Modified: hooks.json, 4 hook scripts, 5 agent .md files, session-start.js, README.md, bkit.config.json, plugin.json, lib/common.js, lib/pdca/index.js
- Total: 18 files, ~148 lines added, ~24 lines deleted

### Documentation
- Completion report: `docs/04-report/features/claude-code-v2166-enhancement.report.md`
- Test report: `docs/04-report/features/bkit-v1.5.9-comprehensive-test.report.md`
```

---

### Phase 4: README.md (1 file)

#### Change 1: Add v1.5.9 feature bullet (before line 63)

```markdown
- **InstructionsLoaded Hook & CTO Team Enhancement (v1.5.9)** - CLAUDE.md 로드 시 bkit 컨텍스트 자동 주입 (CC v2.1.64+), hook handler agent_id/agent_type 정밀 식별, CTO Team continue:false 자동 종료, 5개 분석 에이전트 background 병렬화, code-analyzer Analysis Triad (context:fork), 11 hook events, 190 exports
```

#### Change 2: Fix hook events count (line 69)

```
Before: 2 new hook events for agent lifecycle tracking (10 hook events total)
After:  2 new hook events for agent lifecycle tracking (11 hook events total, InstructionsLoaded added in v1.5.9)
```

#### Change 3: Fix utility functions count (line 87)

```
Before: **241 Utility Functions** - 5 modular libraries with state management, intent detection, task tracking, team coordination
After:  **190+ Utility Functions** - 5 modular libraries (190 common.js exports) with state management, intent detection, task tracking, team coordination
```

#### Change 4: Update requirements notes (line 114)

```
Before: | **Claude Code** | **v2.1.63+** | Required. bkit uses hook events (`TeammateIdle`, `TaskCompleted`) introduced in v2.1.33, auto-memory (v2.1.59), and benefits from 13 memory leak fixes (v2.1.63). |
After:  | **Claude Code** | **v2.1.63+** | Required. Recommended v2.1.66+. bkit uses hook events introduced in v2.1.33, auto-memory (v2.1.59), InstructionsLoaded (v2.1.64), and benefits from 13 memory leak fixes (v2.1.63). |
```

#### Change 5: Fix scripts count (line 86)

```
Before: **45 Scripts** - Hook execution with unified handlers (hooks-json-integration)
After:  **46 Scripts** - Hook execution with unified handlers (hooks-json-integration)
```

---

### Phase 5: bkit-system 참조 문서 (7 files)

#### File 1: `bkit-system/triggers/trigger-matrix.md`

**Change 1**: Hook Event table에 InstructionsLoaded 추가 (line 20과 21 사이)

```
Before (line 20):
| `TeammateIdle` | Teammate idle detection | v1.5.1 |

After (line 20~21):
| `TeammateIdle` | Teammate idle detection | v1.5.1 |
| `InstructionsLoaded` | CLAUDE.md/rules loaded | v1.5.9 |
```

**Change 2**: Note 업데이트 (line 22)

```
Before: > **Note (v1.5.3)**: SubagentStart and SubagentStop added for Team Visibility. TaskCompleted and TeammateIdle added in v1.5.1 for Agent Teams support. Total: 10 hook events.
After:  > **Note (v1.5.9)**: InstructionsLoaded added in v1.5.9. SubagentStart and SubagentStop added in v1.5.3. TaskCompleted and TeammateIdle added in v1.5.1. Total: 11 hook events.
```

#### File 2: `bkit-system/philosophy/context-engineering.md`

**Change 1**: v1.5.9 버전 라인 추가 (line 27 뒤에)

```
After line 27 (v1.5.8 line):
> **v1.5.9**: InstructionsLoaded hook, agent_id/agent_type, continue:false, background agents, Analysis Triad, 190 exports, 11 hook events
```

**Change 2**: "10 hook events" → "11 hook events" (line 17)

```
Before: > **v1.5.4**: lib/ modularization (5 subdirs, 180 exports), 10 hook events, bkend MCP accuracy fix
After:  > **v1.5.4**: lib/ modularization (5 subdirs, 180 exports), 10 hook events (→11 in v1.5.9), bkend MCP accuracy fix
```

**Change 3**: "186 exports" → "190 exports" in body metrics (lines 116, 219, 404)

```
Before: ### Library Modules (15 modules across 5 subdirectories, 186 exports)
After:  ### Library Modules (15 modules across 5 subdirectories, 190 exports)

Before: A **modular state management system** composed of 186 exports
After:  A **modular state management system** composed of 190 exports

Before: | lib/ modules | `lib/core/`, `lib/pdca/`, `lib/intent/`, `lib/task/`, `lib/team/` | 5 dirs, 186 exports |
After:  | lib/ modules | `lib/core/`, `lib/pdca/`, `lib/intent/`, `lib/task/`, `lib/team/` | 5 dirs, 190 exports |
```

#### File 3: `bkit-system/philosophy/core-mission.md`

**Change 1**: v1.5.9 라인 추가 (line 127 뒤에)

```
After line 127:
> **v1.5.9**: InstructionsLoaded Hook & CTO Team Enhancement - agent_id/agent_type, continue:false, background agents, 190 exports, 11 hook events
```

**Change 2**: Section header (line 120)

```
Before: ## Current Implementation (v1.5.8)
After:  ## Current Implementation (v1.5.9)
```

**Change 3**: Component counts (lines 136, 138)

```
Before: | Scripts | 45 | `scripts/*.js` |
After:  | Scripts | 46 | `scripts/*.js` |

Before: | lib/ | 5 modules (241 functions) | `lib/core/`, `lib/pdca/`, `lib/intent/`, `lib/task/`, `lib/team/` |
After:  | lib/ | 5 modules (190 exports) | `lib/core/`, `lib/pdca/`, `lib/intent/`, `lib/task/`, `lib/team/` |
```

#### File 4: `bkit-system/_GRAPH-INDEX.md`

**Change 1**: v1.5.9 라인 추가 (line 31 뒤에)

```
After line 31 (v1.5.8 line):
>
> **v1.5.9 InstructionsLoaded & CTO Team**: InstructionsLoaded hook, agent_id/agent_type, continue:false, background agents, 190 exports, 11 hook events
```

**Change 2**: v1.5.9 release section 추가 (line 44 뒤에)

```
After line 44 (v1.5.8 section):

### v1.5.9 (2026-03-04) - InstructionsLoaded Hook & CTO Team Enhancement
- InstructionsLoaded hook handler (CLAUDE.md context injection, CC v2.1.64+)
- Hook handler agent_id/agent_type in 4 handlers
- CTO Team continue:false auto-termination (2 handlers)
- 5 background analysis agents, code-analyzer Analysis Triad (context:fork)
- 190 exports, 11 hook events, 46 scripts
```

**Change 3**: lib/common.js exports (line 257)

```
Before: - `lib/common.js` - Shared utility functions (v1.5.8, **186 exports** via bridge)
After:  - `lib/common.js` - Shared utility functions (v1.5.9, **190 exports** via bridge)
```

#### File 5: `bkit-system/components/scripts/_scripts-overview.md`

**Change 1**: Header (line 3)

```
Before: > 45 Node.js Scripts used by bkit hooks (v1.5.8)
After:  > 46 Node.js Scripts used by bkit hooks (v1.5.9)
```

**Change 2**: v1.5.9 라인 추가 (line 11 뒤에)

```
After line 11 (v1.5.8 line):
> **v1.5.9**: InstructionsLoaded handler added, 190 exports, 11 hook events, 46 scripts
```

#### File 6: `bkit-system/components/agents/_agents-overview.md`

**Change 1**: Header (line 3)

```
Before: > List of 16 Agents defined in bkit and their roles (v1.5.8)
After:  > List of 16 Agents defined in bkit and their roles (v1.5.9)
```

**Change 2**: v1.5.9 라인 추가 (line 10 뒤에)

```
After line 10 (v1.5.8 line):
> **v1.5.9**: InstructionsLoaded hook, agent_id/agent_type, 5 background agents (gap-detector, design-validator, code-analyzer, security-architect, report-generator), code-analyzer Analysis Triad (context:fork + mergeResult:false)
```

#### File 7: `bkit-system/README.md`

**Change 1**: v1.5.9 라인 추가 (line 31 뒤에)

```
After line 31 (v1.5.8 line):
>
> **v1.5.9**: InstructionsLoaded Hook & CTO Team Enhancement - agent_id/agent_type, continue:false auto-termination, background agents, Analysis Triad, 190 exports, 11 hook events
```

---

### Phase 6: CUSTOMIZATION-GUIDE.md (1 file)

**Change 1**: (line 141)

```
Before: | **lib/** | 5 modules (241 functions) | Modular utility library (v1.5.3) |
After:  | **lib/** | 5 modules (190 exports) | Modular utility library (v1.5.9) |
```

---

## 3. Implementation Order

```
1. Phase 1: lib/ 39 files + scripts/ 9 files (@version replace_all)
2. Phase 2: marketplace.json (3 edits)
3. Phase 3: CHANGELOG.md + changelog.md (2 inserts)
4. Phase 4: README.md (5 edits)
5. Phase 5: bkit-system/ 7 files (version lines + metrics)
6. Phase 6: CUSTOMIZATION-GUIDE.md (1 edit)
```

**Total**: ~60 files, 0 코드 로직 변경

---

## 4. Verification Checklist

| # | Check | Command | Expected |
|:-:|-------|---------|----------|
| 1 | @version 1.5.8 잔여 in lib/ | `Grep '@version 1.5.8' lib/` | 0 matches |
| 2 | @version 1.5.8 잔여 in scripts/ | `Grep '@version 1.5.8' scripts/` | 0 matches |
| 3 | "10 hook events" in README | `Grep '10 hook events' README.md` | 0 matches |
| 4 | "10 hook events" in bkit-system/ | `Grep '10 hook events' bkit-system/` | 0 matches (unless in v1.5.4 historical line) |
| 5 | marketplace.json valid | `node -e "JSON.parse(...)"` | No error |
| 6 | CHANGELOG [1.5.9] exists | `Grep '\\[1.5.9\\]' CHANGELOG.md` | 1 match |
| 7 | README v1.5.9 feature | `Grep 'v1.5.9' README.md` | 3+ matches |
| 8 | "186 exports" in bkit-system/ | `Grep '186 exports' bkit-system/` | 0 matches (all → 190) |
| 9 | scripts count "46" | `Grep '46 Scripts' README.md` | 1 match |
| 10 | "241 functions" remaining | `Grep '241 functions' bkit-system/ README.md CUSTOMIZATION-GUIDE.md` | 0 matches |

---

## 5. Risk Assessment

| Risk | Level | Mitigation |
|------|:-----:|------------|
| @version 교체 의도치 않은 변경 | LOW | `old_string`/`new_string` 정확 매칭, `replace_all` 사용 |
| CHANGELOG 포맷 불일치 | LOW | v1.5.8 섹션 구조 그대로 복제 |
| 메트릭 수치 혼동 | LOW | 테스트 결과 확정 수치만 사용 |
| archive 문서 수정 | NONE | Phase 비대상으로 명시 |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-04 | Initial design — 6 phases, ~60 files, 21 FR |
