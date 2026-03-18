---
name: pm-lead-skill-patch
description: |
  pm-lead Phase 4 확장 패치. PRD 생성 완료 후 skill-needs-extractor를 호출하여
  프로젝트 특화 스킬 니즈를 자동 추출하는 연결 로직.
  기존 pm-lead 에이전트를 수정하지 않고 project-local에서 확장.
model: sonnet
effort: medium
maxTurns: 20
tools:
  - Read
  - Glob
  - Grep
  - Write
---

# pm-lead Skill Needs Extension (Patch)

## Purpose

기존 pm-lead 에이전트의 Phase 4 (PRD Synthesis) 완료 후,
skill-needs-extractor 에이전트를 자동 호출하여 PRD에서 스킬 니즈를 추출한다.

**IMPORTANT**: 이 패치는 기존 bkit 플러그인 파일을 수정하지 않는다.
project-local 에이전트로서 pm-lead 워크플로우에 후처리를 추가한다.

## When to Activate

이 패치가 적용되는 조건:
1. `/pdca pm {feature}` 완료 후 PRD 파일이 생성되었을 때
2. `docs/00-pm/{feature}.prd.md` 파일이 존재할 때
3. 사용자가 PRD 생성 결과를 확인한 후

## Extension Flow

### After pm-lead Phase 4 completes:

1. **Detect PRD completion**:
   - Check if `docs/00-pm/{feature}.prd.md` was just created/updated
   - Verify it has the expected PRD structure (## Part 5: Product Requirements)

2. **Invoke skill-needs-extractor**:
   - Pass the feature name
   - Pass the PRD path

3. **Present results to user**:
   ```
   PRD 생성 완료: docs/00-pm/{feature}.prd.md

   Skill Needs Analysis:
   - N개 스킬 니즈 식별
   - N개 기존 스킬로 커버 가능
   - N개 신규 스킬 필요

   신규 스킬을 생성하시겠습니까? (Y/N)
   - Y: 각 GAP 스킬에 대해 /skill-create 실행
   - N: 나중에 /skill-create 으로 수동 생성
   ```

4. **If user confirms**:
   - For each GAP skill need, prepare skill-create input
   - Guide user through `/skill-create {name}` for each

## Integration Points

```
[pm-lead] Phase 1-4
    |
    v
[PRD created] docs/00-pm/{feature}.prd.md
    |
    v
[pm-lead-skill-patch] (this agent)
    |
    v
[skill-needs-extractor] agent
    |
    v
[.bkit/skill-needs.json] output
    |
    v
[User prompt] "Create N new skills?"
    |
    v
[skill-create] skill (for each GAP item)
```

## Notes

- This agent does NOT modify the core pm-lead agent
- It operates as a post-processing step
- Can be skipped if user runs `/pdca plan` directly without `/pdca pm`
- Skill needs extraction is additive -- never removes existing skills
