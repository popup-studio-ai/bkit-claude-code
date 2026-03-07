# bkit v1.6.0 문서 동기화 설계서

> **요약**: 8개 에이전트 전수 조사 기반 파일별 정확한 변경 명세
>
> **프로젝트**: bkit-claude-code
> **버전**: 1.6.0
> **작성자**: CTO Team
> **날짜**: 2026-03-07
> **상태**: 승인됨

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **문제** | 55+개 파일에서 v1.5.9 참조, 18+개 파일 수치 오류, CHANGELOG v1.6.0 누락 |
| **해결책** | 4개 Batch 병렬 실행으로 체계적 변경 |
| **기능/UX 효과** | 문서-구현 100% 동기화, 정확한 마켓플레이스 정보 |
| **핵심 가치** | Docs=Code 철학 실현 |

---

## Batch A: 설정 파일 + JS 버전 태그

### A-1. .claude-plugin/plugin.json
- L3: `"version": "1.5.9"` → `"version": "1.6.0"`

### A-2. .claude-plugin/marketplace.json
- L4: `"version": "1.5.9"` → `"version": "1.6.0"`
- L36: description: `"27 skills, 16 agents"` → `"28 skills, 21 agents"`
- L37: `"version": "1.5.9"` → `"version": "1.6.0"`

### A-3. bkit.config.json
- L3: `"version": "1.5.9"` → `"version": "1.6.0"`

### A-4. hooks/hooks.json
- L3: `"bkit Vibecoding Kit v1.5.9"` → `"bkit Vibecoding Kit v1.6.0"`

### A-5. hooks/session-start.js
- L3: `(v1.5.9)` → `(v1.6.0)`

### A-6. 스크립트 @version 태그 (11개 파일)
모두 `@version 1.5.9` → `@version 1.6.0`:
1. scripts/phase9-deploy-stop.js
2. scripts/phase6-ui-stop.js
3. scripts/code-review-stop.js
4. scripts/skill-post.js
5. scripts/pdca-skill-stop.js
6. scripts/context-compaction.js
7. scripts/plan-plus-stop.js
8. scripts/phase5-design-stop.js
9. scripts/learning-stop.js
10. scripts/user-prompt-handler.js
11. scripts/unified-stop.js (확인 필요)

---

## Batch B: bkit-system/ 문서 (17개 파일)

### B-1. bkit-system/README.md
- 버전 참조: v1.5.9 → v1.6.0
- 컴포넌트 수치: 28 skills, 21 agents
- v1.6.0 Features 섹션 추가

### B-2. bkit-system/_GRAPH-INDEX.md
- L40-44: v1.5.9 changelog → v1.6.0 추가
- L85-86: `27 Skills, 16 Agents` → `28 Skills, 21 Agents`
- L44: `199 exports` → `241 exports`
- L101-143: Skills 섹션에 Classification 카테고리 추가
- v1.6.0 Features 섹션 추가

### B-3. bkit-system/philosophy/context-engineering.md
- L27-28: v1.5.9 → v1.6.0 추가
- L401: `26 skills` → `28 skills`
- v1.6.0 Enhancements 섹션 보완 (ENH-88, 89, 87, 96, 95, 97, 100 추가)

### B-4. bkit-system/philosophy/core-mission.md
- L120-128: "Current Implementation" v1.5.9 → v1.6.0
- v1.6.0 Skills 2.0, PM Team 섹션 추가

### B-5. bkit-system/philosophy/ai-native-principles.md
- v1.6.0 AI-Native competency 섹션 추가
- PM Team role 추가

### B-6. bkit-system/philosophy/pdca-methodology.md
- v1.6.0 PDCA 개선사항 섹션 추가 (/loop, Cron, Skill Evals)

### B-7. bkit-system/components/agents/_agents-overview.md
- L3: `16 Agents (v1.5.9)` → `21 Agents (v1.6.0)`
- L7-11: v1.5.9 → v1.6.0
- PM Team agents (5개) 섹션 추가
- Model distribution 업데이트

### B-8. bkit-system/components/skills/_skills-overview.md
- L3: `27 Skills (v1.5.9)` → `28 Skills (v1.6.0)`
- L61: `Skill List (27)` → `Skill List (28)`
- **Skill Classification 매트릭스 추가** (CRITICAL):
  - 10 Workflow: pdca, plan-plus, pm-discovery, development-pipeline, bkit-rules, bkit-templates, phase-2-convention, phase-8-review, code-review, zero-script-qa
  - 16 Capability: starter, dynamic, enterprise, phase-1/3/4/5/6/7/9, claude-code-learning, mobile-app, desktop-app, bkend-quickstart/data/auth/storage/cookbook
  - 2 Hybrid: plan-plus (dual classification)
- pm-discovery 스킬 추가
- Skill Evals, Skill Creator 섹션 추가

### B-9. bkit-system/components/scripts/_scripts-overview.md
- L3, L12: v1.5.9 → v1.6.0
- L199: exports 수 갱신

### B-10. bkit-system/components/hooks/_hooks-overview.md
- L63: `v1.5.3` → `v1.6.0`
- v1.6.0 hook 개선사항 추가

### B-11. bkit-system/triggers/trigger-matrix.md
- L7: `v1.5.4` → `v1.6.0`
- PM Team trigger 추가

### B-12. bkit-system/triggers/priority-rules.md
- v1.6.0 feature priority 섹션 추가

### B-13~B-16. bkit-system/scenarios/*.md (4개)
- v1.6.0 시나리오 업데이트 (PM Team, Skills 2.0 참조 추가)

### B-17. bkit-system/testing/test-checklist.md
- v1.6.0 테스트 섹션 추가 (Skill Classification, Skill Evals, PM Team)

---

## Batch C: README + CHANGELOG + 기타

### C-1. README.md (수치 수정 3곳)
- L110: `All 27 skills` → `All 28 skills`
- L142: `Run all 27 skill evaluations` → `Run all 28 skill evaluations`
- L150: `27 skills, no quality measurement | 27 skills, each with` → `28 skills` (2회)
- L461: `27 domain skills` → `28 domain skills`
- L462: `16 specialized agents (including 5 CTO Team agents)` → `21 specialized agents (including 5 CTO Team + 5 PM Team agents)`
- L565: `27 skills, and 16 agents` → `28 skills, and 21 agents`
- L75: `all 16 agents` → `all 21 agents` (또는 역사적 기록으로 유지)

### C-2. CHANGELOG.md (v1.6.0 엔트리 신규 추가)
CHANGELOG.md 최상단에 `## [1.6.0] - 2026-03-07` 엔트리 추가:
- **Added**: Skills 2.0 Complete Integration (19 ENH items), PM Agent Team (5 agents), Skill Evals Framework, Skill Classification, A/B Testing, Skill Creator, template-validator
- **Changed**: Skills 27→28, Agents 16→21, exports 199→241, CC recommended v2.1.71
- **Quality**: Comprehensive Test 631 TC, 100% pass

### C-3. CUSTOMIZATION-GUIDE.md
- L203: v1.5.8 → v1.6.0 참조 갱신
- L735: `(v1.5.9)` → `(v1.6.0)`
- L752: `27 skills` → `28 skills`
- 16 agents → 21 agents (해당 라인)

### C-4. evals/README.md
- L7: `all 27 bkit skills` → `all 28 bkit skills`
- L8: `9 skills` → `10 skills` (workflow count)

### C-5. evals/runner.js
- L8 JSDoc: `27 bkit skills` → `28 bkit skills`

### C-6. commands/bkit.md
- L63: `(v1.5.9)` → `(v1.6.0)`

### C-7. skills/bkit-rules/SKILL.md
- L272: `(v1.5.9)` → `(v1.6.0)`

---

## Batch D: 에이전트 + 스킬 Feature Guidance

### D-1. Core Agent v1.5.9→v1.6.0 업데이트 (10개)

각 파일에서 `## v1.5.9 Feature Guidance` → `## v1.6.0 Feature Guidance` 헤더 변경 및 내용 갱신:

1. agents/gap-detector.md (L329, L343)
2. agents/pdca-iterator.md (L348, L363)
3. agents/code-analyzer.md (L366, L377)
4. agents/report-generator.md (L253, L263)
5. agents/starter-guide.md (L115, L126)
6. agents/design-validator.md (L216, L227)
7. agents/qa-monitor.md (L332, L346)
8. agents/pipeline-guide.md (L136, L151)
9. agents/enterprise-expert.md (L235, L250)
10. agents/infra-architect.md (L170, L185)

**v1.6.0 Feature Guidance 내용**:
```markdown
## v1.6.0 Feature Guidance
- Skills 2.0: Skill Classification (Workflow/Capability/Hybrid), Skill Evals, hot reload
- PM Agent Team: /pdca pm {feature} for pre-Plan product discovery (5 PM agents)
- 28 skills classified: 10 Workflow / 16 Capability / 2 Hybrid
- CC recommended version: v2.1.71 (stdin freeze fix, background agent recovery)
- 241 exports in lib/common.js bridge
```

### D-2. CTO Team Agent v1.6.0 섹션 (5개)
다음 파일에 v1.6.0 Feature Guidance 추가:
1. agents/cto-lead.md — PM Team 연동 추가
2. agents/frontend-architect.md
3. agents/product-manager.md
4. agents/qa-strategist.md
5. agents/security-architect.md

### D-3. PM Team Agent v1.6.0 섹션 (5개)
다음 파일에 v1.6.0 Feature Guidance 추가:
1. agents/pm-lead.md
2. agents/pm-discovery.md
3. agents/pm-strategy.md
4. agents/pm-research.md
5. agents/pm-prd.md

### D-4. 주요 스킬 v1.6.0 참조 (선별)
- skills/bkit-rules/SKILL.md — v1.6.0 참조 갱신
- 기타 스킬은 Classification frontmatter가 이미 추가되어 있으므로 content 내 Feature Guidance만 선별 갱신

---

## 검증 전략

### Phase 1: 자동 검증
```bash
# v1.5.9 잔여 참조 검색 (docs/ 제외)
grep -rn "1\.5\.9" --include="*.json" --include="*.js" --include="*.md" \
  --exclude-dir=docs --exclude-dir=node_modules --exclude-dir=.bkit

# 수치 일관성 검증
grep -rn "27 skills" --include="*.md" --include="*.json" --exclude-dir=docs
grep -rn "16 agents" --include="*.md" --include="*.json" --exclude-dir=docs
```

### Phase 2: Gap Analysis
- Plan FR-01~FR-20 대비 구현 일치 확인
- 100% match rate 달성까지 반복

---

## 변경 파일 요약

| Batch | 파일 수 | 설명 |
|-------|---------|------|
| A | 16 | 설정 5 + JS @version 11 |
| B | 17 | bkit-system/ 문서 전체 |
| C | 7 | README, CHANGELOG, 기타 |
| D | 20+ | 에이전트 20 + 스킬 선별 |
| **합계** | **60+** | |

---

## 버전 이력

| 버전 | 날짜 | 변경사항 | 작성자 |
|------|------|---------|-------|
| 1.0 | 2026-03-07 | 최초 작성 | CTO Team |
