---
name: cc-version-analysis
classification: workflow
classification-reason: Orchestrates multi-phase research and analysis pipeline independent of model capability
deprecation-risk: none
effort: high
description: |
  CC CLI version upgrade impact analysis — research changes, analyze bkit impact, generate report.
  Triggers: cc-version-analysis, CC upgrade, version analysis, CC 버전 분석, 버전 영향.
argument-hint: "[from_version] [to_version]"
user-invocable: true

agents:
  research: bkit:cc-version-researcher
  analyze: bkit:bkit-impact-analyst
  report: bkit:report-generator

allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - TaskCreate
  - TaskUpdate
  - TaskList
  - TaskGet
  - AskUserQuestion
  - Agent
  - WebSearch
  - WebFetch

imports:
  - ${PLUGIN_ROOT}/templates/cc-version-analysis.template.md
  - ${PLUGIN_ROOT}/templates/plan-plus.template.md
  - ${PLUGIN_ROOT}/templates/report.template.md

next-skill: pdca plan
pdca-phase: null
task-template: "[CC-Version-Analysis] CC v{from} → v{to}"

---

# CC Version Analysis — Claude Code CLI 버전 영향 분석 워크플로우

> CC CLI 버전 업그레이드 시 bkit plugin에 대한 영향을 체계적으로 조사, 분석하고
> 개선 기회를 도출하는 전문 워크플로우 스킬.

## Overview

이 스킬은 CC CLI의 새 버전이 출시되었을 때 다음을 자동화합니다:

1. **Phase 1 (Research)**: CC 변경사항 심층 조사
2. **Phase 2 (Analyze)**: bkit 아키텍처 영향 분석
3. **Phase 3 (Brainstorm)**: Plan Plus 브레인스토밍으로 개선안 도출
4. **Phase 4 (Report)**: 종합 영향 분석 보고서 작성

**Agent Team 구성**:
- `cc-version-researcher`: CC 버전 변경사항 외부 조사
- `bkit-impact-analyst`: bkit 내부 아키텍처 영향 분석
- `report-generator`: 최종 보고서 생성

## HARD-GATE

<HARD-GATE>
Do NOT skip any phase. Each phase produces artifacts that feed into the next.
Do NOT generate the final report without completing Research and Analysis phases.
Do NOT implement any ENH items — this skill is analysis-only.
All documents MUST be written in Korean (한국어).

NEW (v2.1.16 errata learning — added 2026-05-20):
Do NOT advance from Phase 1 → Phase 2 without completing the Phase 1.5
Raw Source Verification Gate. The cc-version-researcher agent's quantitative
claims (bullet count, issue counts, file counts) MUST be cross-checked against
≥2 raw sources (GitHub release tag URL + raw CHANGELOG.md URL) before being
adopted into the report. The v2.1.145 cycle leaked an unverified bullet count
of 21 (actual: 20) and an unverified agent count of 36 (actual: 34) because
this gate did not exist. If raw and agent disagree, raw wins.
</HARD-GATE>

## Invocation

```
/cc-version-analysis                    # Auto-detect: installed vs latest
/cc-version-analysis 2.1.78 2.1.85     # Specific version range
/cc-version-analysis to 2.1.85         # From current installed to target
```

## Process Flow

```
┌─────────────────────────────────────────────────────┐
│                CC Version Analysis                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Phase 0: Setup & Version Detection                  │
│  ├── Detect installed CC version (claude --version)  │
│  ├── Determine target version (args or latest)       │
│  ├── Create Task tracking structure                  │
│  └── Load previous analysis from memory              │
│                                                      │
│  Phase 1: Research (cc-version-researcher agent)     │
│  ├── Official docs (code.claude.com)                 │
│  ├── GitHub (anthropics/claude-code)                 │
│  │   ├── Releases & changelog                        │
│  │   ├── Issues (open & recently closed)             │
│  │   ├── PRs (merged in version range)               │
│  │   └── Commits (significant changes)               │
│  ├── npm registry (@anthropic-ai/claude-code)        │
│  ├── Technical blogs & community                     │
│  └── Output: CC Change Report (structured)           │
│                                                      │
│  Phase 1.5: Raw Source Verification Gate (MANDATORY) │
│  ├── WebFetch https://github.com/anthropics/         │
│  │   claude-code/releases/tag/v{to}                  │
│  ├── WebFetch https://raw.githubusercontent.com/     │
│  │   anthropics/claude-code/main/CHANGELOG.md        │
│  ├── Cross-check agent's bullet count vs raw count  │
│  ├── If mismatch → raw wins, record errata           │
│  ├── Spot-check ≥3 random Fixed bullets verbatim     │
│  └── Block Phase 2 if any mismatch unresolved        │
│                                                      │
│  Phase 2: Analyze (bkit-impact-analyst agent)        │
│  ├── Map CC changes → bkit components                │
│  ├── Identify ENH opportunities                      │
│  ├── File impact matrix                              │
│  ├── Philosophy compliance check                     │
│  ├── Test impact assessment                          │
│  └── Output: bkit Impact Analysis (structured)       │
│                                                      │
│  Phase 3: Brainstorm (Plan Plus methodology)         │
│  ├── Intent discovery (핵심 목표/리스크/기회)         │
│  ├── Alternative exploration                         │
│  ├── YAGNI review (각 ENH 필요성 검증)               │
│  ├── Priority assignment (P0~P3)                     │
│  └── Output: Prioritized ENH roadmap                 │
│                                                      │
│  Phase 4: Report Generation                          │
│  ├── Merge all phase outputs                         │
│  ├── Generate from template                          │
│  │   (cc-version-analysis.template.md)               │
│  ├── Save to docs/04-report/features/                │
│  ├── Update MEMORY.md (version history)              │
│  └── Output: Final Impact Report (Korean)            │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Phase Details

### Phase 0: Setup & Version Detection

```
1. Detect installed CC version:
   $ claude --version

2. Determine target version:
   - If args provided: use specified versions
   - If no args: search for latest available version

3. Create Task structure:
   TaskCreate: "[CC-Version-Analysis] CC v{from} → v{to}"
     ├── Task: "Phase 1: CC 변경사항 조사"
     ├── Task: "Phase 2: bkit 영향 분석"
     ├── Task: "Phase 3: Plan Plus 브레인스토밍"
     └── Task: "Phase 4: 보고서 작성"

4. Load previous analysis context:
   - Read memory/cc_version_history_*.md
   - Read last ENH number from MEMORY.md
   - Read existing PDCA status from .bkit/state/pdca-status.json
```

### Phase 1: Research (Agent: cc-version-researcher)

**Input**: from_version, to_version
**Output**: Structured CC Change Report

Launch the `cc-version-researcher` agent with:
```
Research CC CLI changes from v{from} to v{to}.
Sources: official docs, GitHub (issues/PRs/releases), npm, blogs.
Categorize by: Breaking/Feature/Fix/Performance/SystemPrompt/Hook/Config.
Rate impact: HIGH/MEDIUM/LOW.
Flag bkit-relevant changes.
Output structured markdown tables.
```

**Parallel research tasks** (when using Agent Team):
- Task 1: GitHub releases + changelog
- Task 2: GitHub issues (open + recently closed)
- Task 3: Official docs changes
- Task 4: System prompt diff analysis

### Phase 1.5: Raw Source Verification Gate (MANDATORY — added 2026-05-20)

**Why**: cc-version-researcher's output may paraphrase, summarize, or miscount.
The v2.1.145 cycle revealed that a single WebFetch (via the model-processed
release tag page) under-counted by 1 bullet (reported 6 Added, actual 7).
A second fetch against raw CHANGELOG.md is required to catch this.

**Protocol** (main session, not delegated):

1. Fetch raw GitHub release tag page:
   ```
   WebFetch https://github.com/anthropics/claude-code/releases/tag/v{to_version}
   ```
2. Fetch raw CHANGELOG.md (authoritative):
   ```
   WebFetch https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md
   ```
   prompt: "Show the FULL v{to_version} section verbatim. List every bullet
   exactly as written, in order, under the original headings (Added/Fixed/
   Improved/Breaking/etc). Do NOT summarize."
3. Compare to cc-version-researcher's reported counts:
   - Bullet count (total / per-heading)
   - Breaking count
   - HIGH/MEDIUM/LOW split
   - Key item presence (security fixes, OTEL, hook input changes)
4. **If raw and agent disagree → raw wins**. Record discrepancy in report
   under §3.0 "Verification Notes" with both numbers.
5. Spot-check ≥3 random Fixed bullets — verify verbatim text in agent report
   matches raw.
6. **Block Phase 2 progression if any mismatch is unresolved.**

**Output**: §3.0 Verification table appended to Phase 1 output:

| Field | Agent reported | Raw verified | Source URL | Verdict |
|-------|---------------|--------------|------------|---------|
| Added | N | M | raw CHANGELOG | match / errata |
| Fixed | N | M | raw CHANGELOG | match / errata |
| Improved | N | M | raw CHANGELOG | match / errata |
| Breaking | N | M | raw CHANGELOG | match / errata |
| Total bullets | N | M | sum | match / errata |

### Phase 2: Analyze (Agent: bkit-impact-analyst)

**Input**: Phase 1 CC Change Report **PLUS Phase 1.5 verification table**
**Output**: bkit Impact Analysis

**Pre-flight check before launching the analyst agent**: the analyst will
measure bkit architecture stats (agents/skills/hooks counts) via Bash. If
the analyst proposes a numeric correction to memory (e.g. "agents 34 → 36"),
the main session MUST re-run the measurement command independently before
accepting it. See "Numeric Correction Protocol" in bkit-impact-analyst.md.

Launch the `bkit-impact-analyst` agent with:
```
Analyze bkit impact from these CC changes: {phase1_output}
Map each change to bkit components (agents/skills/hooks/lib/scripts).
Identify ENH opportunities starting from ENH-{last+1}.
Check philosophy compliance (Automation First, No Guessing, Docs=Code).
Assess test impact per ENH.
```

**Analysis scope**:
- 29 agents: frontmatter compatibility
- 31 skills: allowed-tools, hooks compatibility
- 12 hook events: new events, changed behavior
- 210 lib exports: API compatibility
- 50 scripts: stdin/stdout protocol
- 1,186 TCs: test coverage gaps

### Phase 3: Brainstorm (Plan Plus Methodology)

**Input**: Phase 2 Impact Analysis
**Output**: Prioritized ENH Roadmap

Apply Plan Plus brainstorming phases:

#### 3.1 Intent Discovery
Ask and answer:
- 이 CC 업그레이드에서 bkit이 얻을 수 있는 최대 가치는?
- 놓치면 안 되는 critical change는?
- 기존 workaround를 대체할 수 있는 native 기능은?

#### 3.2 Alternative Exploration
For each HIGH/MEDIUM ENH:
- 구현 방법 A vs B vs C 비교
- 최소 구현 (MVP) vs 완전 구현 trade-off
- 다른 ENH와의 의존성/시너지

#### 3.3 YAGNI Review
Each ENH must pass:
- ✅ 현재 사용자가 실제로 필요로 하는가?
- ✅ 구현하지 않으면 어떤 문제가 발생하는가?
- ✅ 다음 CC 버전에서 더 나은 방법이 나올 가능성은?
- ❌ YAGNI fail → P3 강등 또는 제거

#### 3.4 Priority Assignment
Final priority based on:
- P0: Core PDCA workflow 직접 개선 또는 known pain point 해결
- P1: 중요한 새 기능 활성화 또는 major DX 개선
- P2: Nice-to-have, 문서 업데이트
- P3: Cosmetic, minor optimization, future consideration

### Phase 4: Report Generation

**Input**: All phase outputs
**Output**: Final Korean report in docs/

1. **Generate report** from `cc-version-analysis.template.md`
2. **Save to**: `docs/04-report/features/cc-v{from}-v{to}-impact-analysis.report.md`
3. **Also create Plan** (if ENH count > 0):
   `docs/01-plan/features/cc-v{from}-v{to}-impact-analysis.plan.md`
4. **Update MEMORY.md**:
   - CC version history section
   - ENH number range
   - Consecutive compatible releases count
   - Open/closed GitHub issues
5. **Update memory file**: `memory/cc_version_history_v{from}_v{to}.md`

## Task Management Protocol

All work MUST be tracked via Task Management System:

```
[CC-Version-Analysis] CC v{from} → v{to}          # Parent task
├── [Research] Phase 1: CC 변경사항 조사             # cc-version-researcher
│   ├── GitHub releases 조사
│   ├── GitHub issues 조사
│   ├── 공식 문서 변경 조사
│   └── 시스템 프롬프트 변경 분석
├── [Analyze] Phase 2: bkit 영향 분석                # bkit-impact-analyst
│   ├── 컴포넌트 매핑
│   ├── ENH 기회 식별
│   ├── 파일 영향 매트릭스
│   └── 철학 준수 검증
├── [Brainstorm] Phase 3: 브레인스토밍               # Plan Plus
│   ├── 의도 탐색
│   ├── 대안 탐색
│   └── YAGNI 검토
└── [Report] Phase 4: 보고서 작성                    # report-generator
    ├── 템플릿 기반 보고서 생성
    ├── MEMORY.md 업데이트
    └── 최종 검토
```

## Agent Team Configuration

When invoked with CTO Team (`/pdca team`):

| Role | Agent | Model | Task |
|------|-------|-------|------|
| Lead | cto-lead | opus | Overall orchestration |
| Researcher | cc-version-researcher | opus | Phase 1: CC research |
| Analyst | bkit-impact-analyst | opus | Phase 2: bkit analysis |
| Reporter | report-generator | haiku | Phase 4: Report writing |

**Parallel execution**:
- Phase 1 tasks can run in parallel (GitHub, docs, npm)
- Phase 2 depends on Phase 1 completion
- Phase 3 depends on Phase 2 completion
- Phase 4 depends on Phase 3 completion

## Quality Checklist

Before completing, verify:

- [ ] All CC changes from version range are captured
- [ ] Every change has impact classification (HIGH/MEDIUM/LOW)
- [ ] Every ENH has priority (P0/P1/P2/P3)
- [ ] Philosophy compliance checked for all ENH items
- [ ] File impact matrix is complete
- [ ] Test impact assessed for all ENH items
- [ ] Report is written in Korean
- [ ] MEMORY.md is updated
- [ ] Task tracking shows all items completed
- [ ] Executive Summary includes 4-perspective value table

### Raw Verification Checklist (NEW — Phase 1.5 gate, v2.1.16 errata learning)

- [ ] **Raw GitHub release tag URL fetched** (`releases/tag/v{to}`)
- [ ] **Raw CHANGELOG.md URL fetched** (raw.githubusercontent.com)
- [ ] **Bullet counts cross-verified** (agent vs raw, both numbers reported)
- [ ] **≥3 spot-check bullets** confirmed verbatim against raw
- [ ] **Numeric corrections re-verified** via direct Bash measurement before adoption
- [ ] **§3.0 Verification table** included in report (5 rows: Added/Fixed/Improved/Breaking/Total)
- [ ] **Errata entries** recorded in memory file under "Known Errata" section if any mismatches occurred

## Known Errata Log (errata learning archive)

When raw verification catches a discrepancy with agent output, record it here
to prevent repeat-mistakes and to feed future skill improvements.

### Cycle v2.1.145 (2026-05-20)
| Field | Agent reported | Raw verified | Root cause |
|-------|---------------|--------------|------------|
| Bullet count | 21 (Features 7 + Fixes 13 + Improved 1) | 20 (Added 7 + Fixed 12 + Improved 1) | Agent over-counted Fixed by 1; first WebFetch on model-processed release page under-reported Added by 1 (raw CHANGELOG was authoritative) |
| Agents directory count | 36 (proposed correction from 34) | 34 (`ls -1 agents/ \| wc -l`) | Analyst proposed unverified numeric correction; main session adopted without re-measurement |
| F7-145 background_tasks/session_crons | "extension surface" (no clear source citation) | Confirmed in raw CHANGELOG Added #7 verbatim | Single-source WebFetch had originally omitted this bullet; second raw fetch recovered it |

**Lessons applied to skill (this commit)**:
1. Phase 1.5 Raw Verification Gate now mandatory before Phase 2
2. cc-version-researcher: verbatim bullet quotation required
3. bkit-impact-analyst: direct-measurement-first; Numeric Correction Protocol
4. SKILL.md: 7-item Raw Verification Checklist added
5. bkit-impact-analyst.md: stale architecture snapshot removed, replaced with mandatory Bash measurement protocol

## Previous Analysis Reference

This skill builds on established analysis patterns:
- `docs/04-report/features/claude-code-v2172-impact-analysis.report.md`
- `docs/04-report/features/claude-code-v2178-impact-analysis.report.md`
- `memory/cc_version_history_v2134_v2172.md`

Always read previous reports first to maintain consistency in:
- ENH numbering (continue from last used number)
- Report structure and depth
- Consecutive compatible release tracking
- GitHub issues monitoring continuity
