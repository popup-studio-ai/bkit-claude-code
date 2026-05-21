---
template: design
version: 2.0
feature: s2-defense
date: 2026-05-21
author: kay (메인 세션)
project: bkit
bkit_version: 2.1.18
sprint_id: s2-defense
---

# S2 — Convention Restoration (Design)

## ADRs

### ADR S2-001 — Sprint SKILL.md path resolution strategy

**Decision**: SKILL.md 에서 `scripts/sprint-handler.js` reference 를 명시적으로 `<bkit-root>/scripts/sprint-handler.js` 또는 `${BKIT_ROOT}/scripts/sprint-handler.js` 로 표기. Symlink 방식 (Option A) 은 Windows portability + git ignore issue 로 rejected.

**Rationale**: docs 가 진실 (Docs=Code). 다른 15 skills 의 패턴 — handler 가 bkit-root scripts/ 에 있는 것은 *bkit convention* 이고, sprint skill 만 다른 패턴은 잘못된 spec.

### ADR S2-002 — Spurious reference removal vs documentation evolution

**Context**: phase-3-mockup SKILL.md 의 `scripts/app.js` — 실제 file 없음. 두 가지 해석:
- (A) Future feature (의도된 stub) → 유지하고 file 생성
- (B) Spurious leftover from earlier version → 삭제

**Decision**: **B** — file 이 없으므로 spec 의 `scripts/app.js` reference 는 spurious. 삭제.

**Rationale**: phase-3-mockup 의 mission (mockup generation) 은 file 시스템 의 SKILL.md 의 instruction 만으로 충분 — runtime script 의존성 없음.

### ADR S2-003 — Convention Contract Baseline schema

**Decision**: `test/contract/baseline/skills-convention.json` 의 schema:
```json
{
  "schemaVersion": "1.0",
  "frozenAt": "ISO timestamp",
  "bkitVersion": "<current at freeze>",
  "skills": [
    {
      "name": "<skill>",
      "expected": {
        "frontmatterFields": ["name", "description", "allowed-tools"],
        "declaredPaths": ["<resolved-from-SKILL.md>"],
        "model": "<if applicable>"
      }
    }
  ]
}
```

**Consequence**: 본 baseline 이 *frozen*. SKILL.md 변경 시 baseline 도 regenerate (audit emit) — 의도하지 않은 mutation 자동 차단.

### ADR S2-004 — PreToolUse linter behavior

**Decision**: linter 의 fail mode 는 *warning only*, write block 안함. PreToolUse hook 의 stderr 출력 만.

**Rationale**: R-3 mitigation — main session write flow 차단 회피. CI gate 에서는 hard fail (F2-2), authoring 시점에는 soft warning.

## Implementation Pseudocode

### F2-1: 3 skills SKILL.md path fix

```diff
--- skills/sprint/SKILL.md
+++ skills/sprint/SKILL.md
@@ -... skill-local path 명시 영역 ...
- 'node scripts/sprint-handler.js status my-sprint'
+ 'node ${BKIT_ROOT}/scripts/sprint-handler.js status my-sprint'
+   (or simply: node scripts/sprint-handler.js — resolved against repo root,
+    not skill-local. See bkit convention §X.)
```

```diff
--- skills/phase-3-mockup/SKILL.md (delete spurious reference)
-... scripts/app.js ...
```

```diff
--- skills/phase-9-deployment/SKILL.md (delete spurious reference)
-... scripts/check-env.js ...
```

### F2-2: scripts/check-skills-docs-code-sync.js (S0 logic evolution)

Reuse `evaluateSkillInvariant` pattern (S0 sqm-calculator + lib/quality/sqm-calculator.js):
```js
function checkAllSkills() {
  const skillsRoot = path.join(ROOT, 'skills');
  const skills = fs.readdirSync(skillsRoot)
    .filter(d => fs.statSync(path.join(skillsRoot, d)).isDirectory())
    .map(name => evaluateSkillInvariant(name, skillsRoot, ROOT));
  const failures = skills.filter(s => !s.invariantPass);
  return { total: skills.length, passed: skills.length - failures.length, failures, ok: failures.length === 0 };
}

function main() {
  const result = checkAllSkills();
  // ... CLI output + exit code ...
}
```

### F2-4: skills-convention.json generator

```js
function generateBaseline() {
  // Parse each SKILL.md frontmatter via S1 contract test patterns
  // Output: frozen JSON snapshot of 44 skills × expected fields
}
```

### F2-5: lint-skill-md.js + PreToolUse hook

```js
// scripts/lint-skill-md.js
function lintSkillMd(filePath) {
  // Read SKILL.md, parse frontmatter, verify invariants
  // Return { ok, warnings: [...] }
}
```

hooks.json entry:
```json
{
  "matcher": "Write",
  "hooks": [{
    "type": "command",
    "command": "node scripts/lint-skill-md.js",
    "if": "Write(skills/*/SKILL.md)"
  }]
}
```

## Edge Cases

| # | Edge | Behavior |
|---|------|----------|
| E1 | skills/ 디렉토리 비어있음 | check exits 0 (no skills to check) |
| E2 | SKILL.md 가 frontmatter 누락 | invariant fail with specific message |
| E3 | baseline JSON 부재 → F2-4 test 가 generator 호출 후 verify | bootstrap path: 첫 호출 시 baseline 생성 |
| E4 | PreToolUse hook 의 lint 가 stderr 0-output → silent PASS | linter 의 fail 시에만 emit |

## CTO Redline (약식)
- BLOCKER 0
- APPROVAL: APPROVE

---

**문서 끝.** Design complete.
