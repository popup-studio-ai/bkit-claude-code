---
template: plan
version: 2.0
feature: s2-defense
date: 2026-05-21
author: kay (메인 세션 + 약식 cto-lead redline)
project: bkit
bkit_version: 2.1.18
sprint_id: s2-defense
master_plan_anchor: docs/01-plan/features/v2119-bkit-quality-maturation.master-plan.md §4.2
---

# S2 — Convention Restoration (Plan)

## 0. Scope
- 5 features × 1,070 LOC × 35 TC
- Closes #107
- Carry CO-S0-2 absorbed (3 skills scope expansion)

## 1. Implementation Order

| # | Sub-task | LOC | TC |
|---|----------|-----|----|
| T1 | F2-1: skills/sprint/SKILL.md path 정정 (bkit-root explicit) | 30 | 0 |
| T2 | F2-1: skills/phase-3-mockup/SKILL.md spurious `scripts/app.js` 삭제 | 10 | 0 |
| T3 | F2-1: skills/phase-9-deployment/SKILL.md spurious `scripts/check-env.js` 삭제 | 10 | 0 |
| T4 | F2-1 test: skills/path-fix.test.js (4 TC — 3 skills + sanity) | 80 | 4 |
| T5 | F2-2: scripts/check-skills-docs-code-sync.js (evolve S0 logic + 44 skills check + CLI exit code + JSON output) | 380 | 0 |
| T6 | F2-2 test: scripts/check-skills-docs-code-sync.test.js (17 TC) — 44/44 PASS verify + per-failure modes | 280 | 17 |
| T7 | F2-3: sprint skill audit — SKILL.md 의 모든 path/handler/frontmatter 일관성 검증 + 정정 | 150 | 0 |
| T8 | F2-3 test: skills-convention-sprint.test.js (6 TC) | 130 | 6 |
| T9 | F2-4: test/contract/baseline/skills-convention.json (frozen 44 entries) — scripted generator first run | 200 | 0 |
| T10 | F2-4 test: test/contract/baseline/skills-convention.test.js (5 TC) | 110 | 5 |
| T11 | F2-5: scripts/lint-skill-md.js (PreToolUse hook entry point) | 200 | 0 |
| T12 | F2-5: hooks/hooks.json — PreToolUse Write(skills/*/SKILL.md) entry | 20 | 0 |
| T13 | F2-5 test: test/unit/lint-skill-md.test.js (3 TC) | 100 | 3 |
| **Total** | | **~1,700** | **35** |

LOC 합계 1,700 (estimate 1,070 + 600 test overhead — honest gross).

## 2. Quality Bar
M1≥90 / M2≥80 / M3≤0 / M4≥95 / M5≤1 / M7≥90 / M8≥85 / M10≤12h / S1=100 (architectural noop) / S2=100 / S4=true.

## 3. Risk Register
| # | Risk | Mit |
|---|------|-----|
| R-1 | F2-1 path 정정이 기존 사용자 cached SKILL.md 와 불일치 (LLM dispatcher 의 SKILL.md cache) | hot reload 직후 재시도, audit emit |
| R-2 | F2-2 CI gate 가 매우 strict (false positive) | baseline JSON 으로 explicit allow-list, progressive tightening |
| R-3 | F2-5 PreToolUse hook 이 main session write flow 차단 | hook 의 fail mode 가 warning only (block 안함) |
| R-4 | F2-3 sprint SKILL.md 정정이 S1 의 §10.1.1.1 추가 영역과 충돌 | T7 시점 git diff 확인 |
| R-5 | T9 baseline JSON 의 frozen drift (의도된 SKILL.md 변경 시 baseline 도 update 필요) | F2-4 의 baseline 재생성 script + audit emit |

## 4. CTO Redline (약식)
BLOCKER 0. MEDIUM 1: F2-5 PreToolUse hook 의 latency (file IO + parse). MINOR 1: T9 baseline JSON 의 schema_version 명시 (forward compat).
APPROVAL: APPROVE.

---

**문서 끝.**
