# bkit v1.5.6 Documentation Sync Planning Document

> **Summary**: v1.5.6 릴리스로 인한 전체 코드베이스의 버전 번호, JSDoc, 에이전트 문서, 설계서 수치 등 문서 동기화
>
> **Project**: bkit-claude-code
> **Version**: 1.5.6
> **Author**: PDCA Plan (3 Research Agents)
> **Date**: 2026-02-27
> **Status**: Final
> **Branch**: feature/bkit-v1.5.6-cc-v2159-update

---

## 1. Overview

### 1.1 Purpose

bkit v1.5.6 릴리스 시 핵심 설정 파일(plugin.json, bkit.config.json, session-start.js, CHANGELOG.md)은 업데이트되었으나, 코드베이스 전체에 걸쳐 **구버전 참조**, **JSDoc 버전 태그**, **에이전트 문서**, **설계서 수치** 등에 불일치가 남아 있습니다. 이를 일괄 동기화합니다.

### 1.2 Background

v1.5.6은 4개 ENH(48~51)을 포함하는 릴리스로, 종합 테스트(754 TC, 100% PASS)를 통과했습니다. 그러나 버전 번호 업데이트가 모든 파일에 적용되지 않았으며, v1.5.2/v1.5.4 시점의 문서가 갱신되지 않은 영역이 존재합니다.

### 1.3 Related Documents

- Comprehensive Test Report: `docs/04-report/features/bkit-v1.5.6-comprehensive-test.report.md`
- v1.5.6 Enhancement Plan: `docs/01-plan/features/bkit-v1.5.6-cc-v2159-enhancement.plan.md`

---

## 2. Scope

### 2.1 In Scope

- [ ] 설정 파일 버전 동기화 (hooks.json, marketplace.json, README.md)
- [ ] Library 모듈 JSDoc @version 태그 업데이트 (6개 모듈)
- [ ] Script JSDoc @version 태그 업데이트 (17개 스크립트)
- [ ] Agent 문서 Feature Guidance 헤더 업데이트 (10개 에이전트)
- [ ] 설계서 수치 오류 수정 (user-invocable count)
- [ ] 미선언 스킬 frontmatter 명시화 (bkit-rules, bkit-templates)

### 2.2 Out of Scope

- CHANGELOG.md 이전 버전 섹션 (역사적 기록, 변경 불필요)
- docs/archive/ 아카이브 문서 (역사적 스냅샷)
- .claude/agent-memory/ 에이전트 메모리 (에이전트 실행 시 자동 갱신)
- docs/01-plan/, docs/02-design/ 기존 PDCA 문서 내 역사적 참조

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Files | Count | Priority |
|:--:|-------------|-------|:-----:|:--------:|
| FR-01 | 설정 파일 버전을 v1.5.6으로 동기화 | hooks.json, marketplace.json, README.md | 4 | High |
| FR-02 | Library JSDoc @version을 1.5.6으로 업데이트 | lib/common.js, lib/core/index.js, lib/pdca/index.js, lib/intent/index.js, lib/team/index.js, lib/task/index.js | 6 | Medium |
| FR-03 | Script JSDoc @version을 1.5.6으로 업데이트 | scripts/*.js | 17 | Medium |
| FR-04 | Library 추가 JSDoc @version 업데이트 | lib/pdca/status.js, lib/skill-orchestrator.js | 2 | Medium |
| FR-05 | Agent Feature Guidance 헤더를 v1.5.6으로 업데이트 | agents/*.md (10개) | 10 | Medium |
| FR-06 | 설계서 user-invocable 분포 수치 수정 | design.md line 129 | 1 | Low |
| FR-07 | bkit-rules, bkit-templates에 user-invocable: false 명시 | skills/bkit-rules/SKILL.md, skills/bkit-templates/SKILL.md | 2 | Low |

### 3.2 Detailed File List

#### FR-01: 설정 파일 버전 동기화 (4건)

| # | File | Line | Current | Target |
|:-:|------|:----:|---------|--------|
| 1 | hooks/hooks.json | 3 | `"bkit Vibecoding Kit v1.5.5 - Claude Code"` | `v1.5.6` |
| 2 | .claude-plugin/marketplace.json | 4 | `"version": "1.5.5"` | `"1.5.6"` |
| 3 | .claude-plugin/marketplace.json | 37 | `"version": "1.5.5"` (bkit plugin entry) | `"1.5.6"` |
| 4 | README.md | 5 | `Version-1.5.5-green` badge | `Version-1.5.6` |

#### FR-02: Library JSDoc 업데이트 (6건)

| # | File | Line | Current | Target |
|:-:|------|:----:|---------|--------|
| 1 | lib/common.js | 4 | `@version 1.5.4` | `@version 1.5.6` |
| 2 | lib/core/index.js | 4 | `@version 1.5.4` | `@version 1.5.6` |
| 3 | lib/pdca/index.js | 4 | `@version 1.5.4` | `@version 1.5.6` |
| 4 | lib/intent/index.js | 4 | `@version 1.5.4` | `@version 1.5.6` |
| 5 | lib/team/index.js | 4 | `@version 1.5.4` | `@version 1.5.6` |
| 6 | lib/task/index.js | 4 | `@version 1.5.4` | `@version 1.5.6` |

#### FR-03: Script JSDoc 업데이트 (17건)

| # | File | Current @version |
|:-:|------|:----------------:|
| 1 | scripts/code-review-stop.js | 1.4.4 |
| 2 | scripts/learning-stop.js | 1.4.4 |
| 3 | scripts/pdca-skill-stop.js | 1.4.4 |
| 4 | scripts/phase5-design-stop.js | 1.4.4 |
| 5 | scripts/phase6-ui-stop.js | 1.4.4 |
| 6 | scripts/phase9-deploy-stop.js | 1.4.4 |
| 7 | scripts/skill-post.js | 1.4.4 |
| 8 | scripts/unified-bash-post.js | 1.4.4 |
| 9 | scripts/unified-bash-pre.js | 1.4.4 |
| 10 | scripts/unified-write-post.js | 1.4.4 |
| 11 | scripts/context-compaction.js | 1.4.2 |
| 12 | scripts/context-fork.js | 1.4.2 |
| 13 | scripts/context-hierarchy.js | 1.4.2 |
| 14 | scripts/import-resolver.js | 1.4.2 |
| 15 | scripts/memory-store.js | 1.4.2 |
| 16 | scripts/permission-manager.js | 1.4.2 |
| 17 | scripts/user-prompt-handler.js | 1.4.2 |

All → `@version 1.5.6`

#### FR-04: Library 추가 JSDoc 업데이트 (2건)

| # | File | Line | Current | Target |
|:-:|------|:----:|---------|--------|
| 1 | lib/pdca/status.js | 4 | `@version 1.4.7` | `@version 1.5.6` |
| 2 | lib/skill-orchestrator.js | 12 | `@version 1.4.4` | `@version 1.5.6` |

#### FR-05: Agent Feature Guidance 헤더 업데이트 (10건)

| # | Agent File | Line | Current | Target |
|:-:|-----------|:----:|---------|--------|
| 1 | agents/code-analyzer.md | 354 | `## v1.5.2 Feature Guidance` | `## v1.5.6 Feature Guidance` |
| 2 | agents/design-validator.md | 208 | `## v1.5.2 Feature Guidance` | `## v1.5.6 Feature Guidance` |
| 3 | agents/enterprise-expert.md | 235 | `## v1.5.2 Feature Guidance` | `## v1.5.6 Feature Guidance` |
| 4 | agents/gap-detector.md | 317 | `## v1.5.2 Feature Guidance` | `## v1.5.6 Feature Guidance` |
| 5 | agents/infra-architect.md | 170 | `## v1.5.2 Feature Guidance` | `## v1.5.6 Feature Guidance` |
| 6 | agents/pdca-iterator.md | 344 | `## v1.5.2 Feature Guidance` | `## v1.5.6 Feature Guidance` |
| 7 | agents/pipeline-guide.md | 136 | `## v1.5.2 Feature Guidance` | `## v1.5.6 Feature Guidance` |
| 8 | agents/qa-monitor.md | 328 | `## v1.5.2 Feature Guidance` | `## v1.5.6 Feature Guidance` |
| 9 | agents/report-generator.md | 240 | `## v1.5.2 Feature Guidance` | `## v1.5.6 Feature Guidance` |
| 10 | agents/starter-guide.md | 115 | `## v1.5.2 Feature Guidance` | `## v1.5.6 Feature Guidance` |

#### FR-06: 설계서 수치 수정 (1건)

| File | Line | Current | Target |
|------|:----:|---------|--------|
| docs/02-design/features/bkit-v1.5.6-comprehensive-test.design.md | 129 | `12 user-invocable / 15 auto-invoked` | `12 user-invocable / 13 false / 2 unspecified` |

#### FR-07: Skill frontmatter 명시화 (2건)

| # | File | Change |
|:-:|------|--------|
| 1 | skills/bkit-rules/SKILL.md | Add `user-invocable: false` |
| 2 | skills/bkit-templates/SKILL.md | Add `user-invocable: false` |

### 3.3 Summary Statistics

| Category | Files | Changes | Priority |
|----------|:-----:|:-------:|:--------:|
| Config version sync | 3 | 4 | High |
| Library JSDoc | 8 | 8 | Medium |
| Script JSDoc | 17 | 17 | Medium |
| Agent docs | 10 | 10 | Medium |
| Design doc fix | 1 | 1 | Low |
| Skill frontmatter | 2 | 2 | Low |
| **TOTAL** | **41** | **42** | — |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] `grep -r "v1.5.5" --include="*.json"` returns only CHANGELOG.md and historical docs
- [ ] `grep -r "v1.5.5" hooks/hooks.json` returns 0 results
- [ ] All 8 library modules have `@version 1.5.6`
- [ ] All 17 scripts have `@version 1.5.6`
- [ ] All 10 agent Feature Guidance headers say `v1.5.6`
- [ ] README.md badge shows `1.5.6`
- [ ] marketplace.json both version fields are `1.5.6`
- [ ] Design doc distribution count corrected
- [ ] bkit-rules, bkit-templates have explicit `user-invocable: false`
- [ ] No regression in existing functionality (all files still valid JSON/YAML/Markdown)

### 4.2 Quality Criteria

- [ ] 0 remaining stale version references in active code files
- [ ] All JSON files parse without errors
- [ ] All SKILL.md YAML frontmatter valid

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|:------:|:----------:|------------|
| JSDoc 변경이 기능에 영향 | None | None | @version은 주석이므로 기능 영향 0% |
| Agent 문서 변경이 동작에 영향 | Low | Low | Feature Guidance 헤더만 변경, 내용은 동일 |
| marketplace.json 오류 | Medium | Low | JSON 파싱 테스트로 검증 |
| SKILL.md frontmatter 오류 | Medium | Low | YAML 구문 검증 |

---

## 6. Execution Strategy

### 6.1 Implementation Order

```
Phase 1: Config Files (FR-01) — 4 changes, HIGH priority
    └── hooks.json, marketplace.json (×2), README.md

Phase 2: Library Modules (FR-02 + FR-04) — 8 changes, MEDIUM priority
    └── common.js, core/, pdca/, intent/, team/, task/, pdca/status.js, skill-orchestrator.js

Phase 3: Scripts (FR-03) — 17 changes, MEDIUM priority
    └── 17 scripts with @version update

Phase 4: Agent Docs (FR-05) — 10 changes, MEDIUM priority
    └── 10 agents with Feature Guidance header update

Phase 5: Design & Skill (FR-06 + FR-07) — 3 changes, LOW priority
    └── design.md count fix, bkit-rules, bkit-templates

Total: 42 changes across 41 files
```

### 6.2 Parallelization

All 5 phases are independent and can run in parallel:

| Agent | Assignment | Changes |
|-------|-----------|:-------:|
| sync-config | FR-01 (config files) | 4 |
| sync-library | FR-02 + FR-04 (library JSDoc) | 8 |
| sync-scripts | FR-03 (script JSDoc) | 17 |
| sync-agents | FR-05 (agent docs) | 10 |
| sync-docs | FR-06 + FR-07 (design + skills) | 3 |

---

## 7. Verification

Post-implementation verification:

```bash
# 1. No stale v1.5.5 in config/code files
grep -r "1\.5\.5" hooks/ .claude-plugin/marketplace.json README.md
# Expected: 0 results

# 2. All library @version tags updated
grep -r "@version" lib/ --include="*.js" | grep -v "1.5.6"
# Expected: 0 results

# 3. All script @version tags updated
grep -r "@version" scripts/ --include="*.js" | grep -v "1.5.6"
# Expected: 0 results

# 4. No stale v1.5.2 in agent Feature Guidance
grep -r "v1.5.2 Feature Guidance" agents/
# Expected: 0 results

# 5. JSON validity
node -e "require('./hooks/hooks.json')"
node -e "require('./.claude-plugin/marketplace.json')"
# Expected: no errors
```

---

## 8. Next Steps

1. [ ] Write design document (`/pdca design bkit-v1.5.6-doc-sync`)
2. [ ] Execute implementation (`/pdca do bkit-v1.5.6-doc-sync`)
3. [ ] Verify all changes (`/pdca analyze bkit-v1.5.6-doc-sync`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-27 | Initial plan — 3 Research Agents (version, content, counts) | PDCA Plan |
