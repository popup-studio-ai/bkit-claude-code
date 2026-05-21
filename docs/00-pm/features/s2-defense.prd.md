---
template: pm-prd
version: 2.0
feature: s2-defense
date: 2026-05-21
author: kay (메인 세션)
project: bkit
bkit_version: 2.1.18
sprint_id: s2-defense
status: Draft (sprint phase: prd)
master_plan: docs/01-plan/features/v2119-bkit-quality-maturation.master-plan.md §4.2
github_issues: ["#107"]
absorbed_carryovers: ['CO-S0-2 (3 skills drift scope expansion from S0 measurement)']
---

# S2 — Convention Restoration (PRD)

> **Mission**: 44 skills × Docs=Code drift 영구 차단. pruge #107 + S0 추가 발견 2건 (phase-3-mockup, phase-9-deployment) 모두 fix + CI invariant 활성화.

## Executive Summary (4-Perspective)

| Perspective | Content |
|-------------|---------|
| **Problem** | bkit-system 의 3 Core Philosophies 중 **Docs=Code** 가 sprint skill 에서 가장 hot 한 위반 (pruge #107). S0 measurement 가 *2 skills 추가* drift 발견 — phase-3-mockup `scripts/app.js` + phase-9-deployment `scripts/check-env.js` 미존재. 즉 LLM dispatcher 가 SKILL.md declared path 따라 resolve 시도 시 3 skills 에서 `MODULE_NOT_FOUND` round-trip 발생. **regression 차단 layer 부재** — 차후 같은 결함이 다른 skill 에 발생 가능. |
| **Solution** | **5 features 통합**: F2-1 3 skills SKILL.md path 정정 (sprint 는 bkit-root explicit 명시, phase-3-mockup + phase-9-deployment 는 spurious reference 삭제). F2-2 `scripts/check-skills-docs-code-sync.js` — 44 skills × SKILL.md invariant CI check (S0 measurement evolution). F2-3 sprint skill 의 declared path/handler/frontmatter 전체 audit + 정정. F2-4 `test/contract/baseline/skills-convention.json` — 44 skills baseline freeze (5 TC). F2-5 `scripts/lint-skill-md.js` PreToolUse hook — write to skills/*/SKILL.md 시 invariant check. |
| **Function/UX Effect** | (a) LLM dispatcher 의 SKILL.md path resolve 시 round-trip 0 — 44/44 skills declared path 가 실제 file 과 일치. (b) `node scripts/check-skills-docs-code-sync.js` CI 실행 시 44/44 PASS. (c) 새 skill SKILL.md write 시 PreToolUse hook 이 invariant check → fail 시 user-facing warning. (d) sprint skill convention 가 다른 15 skills (pdca/control/feature/etc.) 와 일관. |
| **Core Value** | **pruge #107 의 1 skill drift 보고 → 실측 3 skills drift fix** (master plan §2.3 dialectical synthesis 직접 실증). **CI invariant** 가 차후 동일 결함 발생 시 *PR fail* — bkit-system Docs=Code 철학의 영구 enforcement. Convention contract baseline 이 frozen state — 의도하지 않은 SKILL.md mutation 자동 차단. |

## Functional Requirements

### FR-1: 3 Skills SKILL.md Path Fix (F2-1, 60 LOC, 4 TC)
- sprint skill: SKILL.md 의 `scripts/sprint-handler.js` reference 모두 `bkit-root` 명시
- phase-3-mockup skill: SKILL.md 의 spurious `scripts/app.js` reference 삭제 (file 미존재)
- phase-9-deployment skill: SKILL.md 의 spurious `scripts/check-env.js` reference 삭제 (file 미존재)
- Verification: S0 measurement script (sqm-calculator F2-1 of S0) 재실행 시 docsCodeSyncRate 93 → 100

### FR-2: 44 skills × Docs=Code CI Invariant (F2-2, 380 LOC, 17 TC)
- `scripts/check-skills-docs-code-sync.js` (S0 의 `evaluateSkillInvariant` 함수 evolution, comments-skip + Task(target) parse 등 robust)
- 44 skills 모두 invariant check
- Exit 0 if 44/44 PASS, 1 if any fail
- CI workflow integration (`.github/workflows/contract-check.yml` 또는 별도)

### FR-3: Sprint Skill Full Audit (F2-3, 150 LOC, 6 TC)
- `skills/sprint/SKILL.md` 의 모든 declared path/handler/frontmatter 정정 + 다른 15 skills 패턴과 정렬
- v2.1.19 S1 의 SKILL.md §10.1.1.1 + §10.2 update 와 통합 verify

### FR-4: Contract Baseline (F2-4, 280 LOC, 5 TC)
- `test/contract/baseline/skills-convention.json` — 44 skills 의 frozen baseline schema:
  ```json
  { "schemaVersion": "1.0", "frozen_at": "ISO", "skills": [{ "name": "<skill>", "expected": { "tools": [...], "model": "<m>", ... } }] }
  ```
- 5 TC: schema validation + drift detection + baseline regeneration

### FR-5: SKILL.md Authoring Linter Hook (F2-5, 200 LOC, 3 TC)
- `scripts/lint-skill-md.js` — frontmatter invariant + path resolve check
- PreToolUse hook `if: "Write(skills/*/SKILL.md)"` — write 시 자동 check
- fail → stderr warning + audit emit `skill_md_lint_failed` (NEW ACTION_TYPE — optional, may merge into existing `gate_failed`)

## Acceptance Criteria

| # | AC |
|---|-----|
| AC-1 | F2-1: 3 skills SKILL.md path 정정 후 S0 measure script 재실행 → docsCodeSyncRate 100 |
| AC-2 | F2-2: `node scripts/check-skills-docs-code-sync.js` → exit 0, 44/44 PASS |
| AC-3 | F2-3: skills/sprint/SKILL.md grep 으로 spurious path 0건 |
| AC-4 | F2-4: `test/contract/baseline/skills-convention.json` schema valid + 44 entries |
| AC-5 | F2-5: PreToolUse hook 등록 + Write to skills/*/SKILL.md trigger 검증 |
| AC-6 | matchRate ≥90 |
| AC-7 | criticalIssueCount=0 |
| AC-8 | sprint archived |
| AC-9 | 35 TC PASS (target) |
| AC-10 | Closes #107 |

## Dependencies
- ✓ S1 archived (sprint-handler.js 갱신 + SKILL.md §10.1.1.1 update)
- ✓ S0 measurement evidence (3 skills drift 정확한 detection)

## CO-S0-2 absorption
S0 analysis §5.1 의 "3 skills drift" 가 본 S2 의 정량 evidence. F2-1 scope 가 1 skill → 3 skills 확장 (master plan §7.2 patch 의 inline note 와 일관).

---

**문서 끝.** PRD complete (~250 lines).
