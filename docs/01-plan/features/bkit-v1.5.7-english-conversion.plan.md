# Plan: bkit v1.5.7 Codebase English Conversion

> Feature: bkit-v1.5.7-english-conversion
> Created: 2026-02-28
> Status: Draft

---

## 1. Objective

Convert all Korean text in the bkit codebase to English for international accessibility and consistency. The plugin targets a global audience, and all code comments, JSDoc annotations, string literals, and documentation should be in English.

## 2. Scope

### 2.1 In Scope

All Korean text (`[가-힣]`) across the entire codebase, including:
- JS source files: Comments, JSDoc, string literals (UI messages, labels)
- Markdown documents: Body content, section headers, table labels
- Templates: Example data, descriptions, checklist items
- Agent definitions: Non-trigger Korean in description blocks
- JSON config: Korean text in description fields
- Agent memory: Korean notes

### 2.2 Exclusions (Do NOT Convert)

| Exclusion | Reason | Files Affected |
|-----------|--------|:--------------:|
| `docs/archive/**` | Historical records, user-specified exclusion | ~90 files |
| 8-language trigger keywords | Functional requirement for multilingual intent detection | 50+ locations |
| `ko:` arrays in `lib/intent/language.js` | Runtime Korean trigger keywords for intent matching | 13 arrays |
| Korean regex patterns in `scripts/gap-detector-stop.js`, `scripts/iterator-stop.js` | Functional patterns parsing Korean agent output (매치율, 일치율, 완료, etc.) | 2 files, ~5 lines |
| `lib/intent/trigger.js` line 115 regex `이름이?` | Functional Korean name pattern matching | 1 line |
| Korean trigger keywords in `hooks/session-start.js` markdown tables | 8-language trigger reference table (embedded in session context) | ~10 lines |
| Trigger examples in overview templates (`_skills-overview.md`, `_agents-overview.md`) | Placeholder examples demonstrating multilingual triggers | 2 lines |
| Korean language row in `README.md` line 390 | Documents Korean language support capability | 1 line |
| Multi-lang trigger example in `CUSTOMIZATION-GUIDE.md` line 800 | Template example | 1 line |
| Korean regex in code examples (`context-engineering.md` lines 319, 323) | Demonstrates runtime Korean pattern matching | 2 lines |
| Korean input strings in code examples (`_scripts-overview.md` lines 300-301) | Demonstrates Korean intent detection API | 2 lines |
| References TO Korean content in test docs (v1.5.7-comprehensive-test plan/design/analysis/report) | Quotes Korean regex values in test case descriptions | ~20 lines |

## 3. Investigation Summary

### 3.1 Total Scope

| Category | Files | Korean Lines | Priority |
|----------|:-----:|:------------:|:--------:|
| Phase 1: JS lib/ (JSDoc & Comments) | 12 | ~130 | P0 - Critical |
| Phase 2: JS scripts/ (String Literals & Comments) | 19 | ~120 | P0 - Critical |
| Phase 3A: Operational Docs | 7 | ~320 | P1 - High |
| Phase 3B: Research/Strategy Docs | 2 | ~650 | P2 - Medium |
| Phase 3C: Enterprise Planning Docs (.claude/docs/) | 10 | ~1,594 | P2 - Medium |
| Phase 4: Templates, Agent, Config | 5 | ~42 | P1 - High |
| **Total** | **55** | **~2,856** | - |

### 3.2 File-by-File Inventory

#### Phase 1: lib/ JS Files (JSDoc & Comments) — 12 files, ~130 lines

| # | File | Korean Lines | Content Type |
|---|------|:------------:|-------------|
| 1 | `lib/core/cache.js` | 6 | JSDoc (function descriptions) |
| 2 | `lib/core/config.js` | 6 | JSDoc (function/param descriptions) |
| 3 | `lib/core/debug.js` | 6 | JSDoc + comments |
| 4 | `lib/core/file.js` | 12 | JSDoc + comments (file/feature utilities) |
| 5 | `lib/core/index.js` | 1 | JSDoc (file header) |
| 6 | `lib/core/io.js` | 11 | JSDoc + comments (I/O operations) |
| 7 | `lib/core/platform.js` | 9 | JSDoc (platform detection) |
| 8 | `lib/pdca/automation.js` | 4 | JSDoc (PDCA automation) |
| 9 | `lib/pdca/status.js` | 32 | Comments (step annotations, validation logic) |
| 10 | `lib/skill-orchestrator.js` | 5 | JSDoc (file header, role descriptions) |
| 11 | `lib/team/coordinator.js` | 12 | JSDoc (team coordination) |
| 12 | `lib/team/state-writer.js` | 33 | JSDoc + comments (state persistence) |

#### Phase 2: scripts/ JS Files (String Literals & Comments) — 19 files, ~120 lines

| # | File | Korean Lines | Content Type |
|---|------|:------------:|-------------|
| 13 | `lib/skill-orchestrator.js` | 10 | String literals (suggestion messages) |
| 14 | `scripts/pdca-skill-stop.js` | ~40 | String literals (UI messages, labels, questions) |
| 15 | `scripts/phase5-design-stop.js` | 10 | String literals (checklist items, UI labels) |
| 16 | `scripts/phase6-ui-stop.js` | 10 | String literals (descriptions, UI labels) |
| 17 | `scripts/phase9-deploy-stop.js` | 10 | String literals (descriptions, UI labels) |
| 18 | `scripts/learning-stop.js` | 3 | String literals (descriptions) |
| 19 | `scripts/archive-feature.js` | 1 | String literal (template content) |
| 20 | `scripts/pdca-task-completed.js` | 12 | JSDoc + comments |
| 21 | `scripts/subagent-start-handler.js` | 8 | JSDoc + comments |
| 22 | `scripts/subagent-stop-handler.js` | 6 | JSDoc + comments |
| 23 | `scripts/team-idle-handler.js` | 6 | JSDoc + comments |
| 24 | `scripts/team-stop.js` | 4 | JSDoc |
| 25 | `scripts/analysis-stop.js` | 1 | Comment |
| 26 | `scripts/context-compaction.js` | 1 | Comment |
| 27 | `scripts/design-validator-pre.js` | 1 | Comment |
| 28 | `scripts/phase1-schema-stop.js` | 1 | Comment |
| 29 | `scripts/phase2-convention-pre.js` | 2 | Comments |
| 30 | `scripts/phase2-convention-stop.js` | 1 | Comment |
| 31 | `scripts/phase3-mockup-stop.js` | 1 | Comment |
| 32 | `scripts/phase4-api-stop.js` | 1 | Comment |
| 33 | `scripts/phase7-seo-stop.js` | 1 | Comment |
| 34 | `scripts/phase8-review-stop.js` | 1 | Comment |
| 35 | `scripts/pre-write.js` | 1 | Comment |
| 36 | `scripts/qa-pre-bash.js` | 1 | Comment |
| 37 | `scripts/qa-stop.js` | 1 | Comment |
| 38 | `scripts/phase9-deploy-pre.js` | 2 | Comments |
| 39 | `jest.config.js` | 1 | Comment |

#### Phase 3A: Operational Documents — 7 files, ~320 lines

| # | File | Korean Lines | Content Type |
|---|------|:------------:|-------------|
| 40 | `commands/github-stats.md` | ~90 | Full Korean skill body (operational runbook) |
| 41 | `commands/output-style-setup.md` | 5 | Table descriptions |
| 42 | `.claude/commands/github-stats.md` | 138 | Duplicate of #40 (same content) |
| 43 | `docs/guides/cto-team-memory-guide.md` | 31 | Developer guide |
| 44 | `docs/guides/remote-control-compatibility.md` | 18 | Compatibility analysis |
| 45 | `docs/01-plan/features/bkit-v1.5.7-doc-sync.plan.md` | 21 | PDCA plan document |
| 46 | `docs/02-design/features/bkit-v1.5.7-doc-sync.design.md` | 18 | PDCA design document |

#### Phase 3B: Research/Strategy Documents — 2 files, ~650 lines

| # | File | Korean Lines | Content Type |
|---|------|:------------:|-------------|
| 47 | `docs/04-report/research/anthropic-leadership-os-strategy-analysis.md` | 246 | Strategic research analysis |
| 48 | `docs/ai-agent-security-audit-2026.report.md` | 401 | AI agent security audit |

#### Phase 3C: Enterprise Planning Documents — 10 files, ~1,594 lines

| # | File | Korean Lines | Content Type |
|---|------|:------------:|-------------|
| 49 | `.claude/docs/bkit-enterprise-studio.plan.md` | 574 | Main enterprise OS plan |
| 50 | `.claude/docs/bkit-enterprise-expansion-strategy.md` | 269 | Expansion strategy |
| 51 | `.claude/docs/enterprise/_INDEX.plan.md` | 41 | Master plan index |
| 52 | `.claude/docs/enterprise/unit-1-core-modularization.plan.md` | 102 | Core modularization |
| 53 | `.claude/docs/enterprise/unit-2-registry-system.plan.md` | 95 | Registry system |
| 54 | `.claude/docs/enterprise/unit-3-studio-mvp.plan.md` | 91 | Studio MVP |
| 55 | `.claude/docs/enterprise/unit-4-bkend-integration.plan.md` | 101 | bkend integration |
| 56 | `.claude/docs/enterprise/unit-5-ai-driven-work.plan.md` | 105 | AI-driven work |
| 57 | `.claude/docs/enterprise/unit-6-enterprise-audit.plan.md` | 99 | Enterprise audit |
| 58 | `.claude/docs/enterprise/unit-7-multi-tenant.plan.md` | 117 | Multi-tenant architecture |

#### Phase 4: Templates, Agent, Config — 5 files, ~42 lines

| # | File | Korean Lines | Content Type |
|---|------|:------------:|-------------|
| 59 | `templates/schema.template.md` | 21 | Template example data & descriptions |
| 60 | `templates/convention.template.md` | 14 | Template descriptions & checklist |
| 61 | `agents/pdca-iterator.md` | 2 | Non-trigger Korean in description block |
| 62 | `.claude/agent-memory/bkit-bkend-expert/MEMORY.md` | 4 | Agent memory notes |
| 63 | `docs/.bkit-memory.json` | 1 | Description field |

## 4. Conversion Rules

### 4.1 General Rules
- Preserve original meaning and technical accuracy
- Keep code identifiers (variable names, function names) unchanged
- Maintain JSDoc structure (@param, @returns, @property)
- Preserve line numbers and file structure
- Keep markdown formatting (tables, headers, lists)

### 4.2 JS Comment/JSDoc Conversion
- `// 캐시에서 값 조회` → `// Retrieve value from cache`
- `* 캐시에 값 저장` → `* Store value in cache`
- `// v1.4.0: Stop hook에 맞는 스키마 사용` → `// v1.4.0: Use Stop hook schema`

### 4.3 String Literal Conversion
- `'Plan 완료. Design 단계로 진행하세요.'` → `'Plan complete. Proceed to Design phase.'`
- `{ label: '예, Phase 6 진행', value: 'proceed' }` → `{ label: 'Yes, proceed to Phase 6', value: 'proceed' }`
- `description: '설정 자동 생성'` → `description: 'Auto-generate configuration'`

### 4.4 Document Conversion
- Full translation maintaining document structure
- Technical terms remain in English (PDCA, API, CI/CD, etc.)
- Code blocks remain unchanged
- Table structure preserved, only text content translated

## 5. Risk Assessment

| Risk | Severity | Mitigation |
|------|:--------:|-----------|
| Accidentally converting 8-lang triggers | High | Explicit exclusion list, grep verification after each phase |
| Changing functional Korean regex | Critical | No-touch list for gap-detector-stop.js, iterator-stop.js regex lines |
| Breaking string literal format | Medium | Preserve quotes, template literals, and interpolation |
| Inconsistent translation quality | Medium | Use consistent terminology glossary |
| Large diff size (~2,856 lines) | Low | Phase-by-phase execution, per-phase verification |

## 6. Verification Plan

After each phase:
1. `grep -rn '[가-힣]' {target_files}` → should return 0 (excluding allowed patterns)
2. `node -e "require('./lib/common.js')"` → no import errors
3. Review string literal changes don't break template interpolation
4. Final comprehensive scan: `grep -rn '[가-힣]' --include='*.js' --include='*.md' --include='*.json' . | grep -v 'docs/archive/' | grep -v 'node_modules/'` → only allowed exclusions remain

## 7. Glossary (Key Term Translations)

| Korean | English | Usage Context |
|--------|---------|:-------------:|
| 캐시 | Cache | lib/core |
| 설정값 조회 | Retrieve configuration | lib/core |
| 안전한 JSON 파싱 | Safe JSON parsing | lib/core |
| 디버그 로그 | Debug log | lib/core |
| 소스 파일 여부 | Check if source file | lib/core |
| 컨텍스트 문자열 자르기 | Truncate context string | lib/core |
| 허용 결정 출력 | Output allow decision | lib/core |
| 차단 결정 출력 | Output block decision | lib/core |
| 팀원 추가 | Add teammate | lib/team |
| 팀원 상태 업데이트 | Update teammate status | lib/team |
| 원자적 쓰기 | Atomic write | lib/team |
| 링 버퍼 | Ring buffer | lib/team |
| 자동 진행 | Auto-advance | scripts |
| 완료 보고서 | Completion report | scripts |
| 구현 시작 | Start implementation | scripts |
| Gap 분석 실행 | Run Gap analysis | scripts |
| 자동 개선 | Auto-improvement | scripts |
| 수동 수정 | Manual fix | scripts |
| PDCA 사이클 완료 | PDCA cycle complete | scripts |
| 진행 중 | In progress | lib/skill |
| 구현이 완료되면 | When implementation is complete | lib/skill |
| 매치율 미만 | Below match rate | lib/skill |
