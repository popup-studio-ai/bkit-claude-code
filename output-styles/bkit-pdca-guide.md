---
name: bkit-pdca-guide
description: |
  PDCA workflow guide optimized style.
  Automatically displays checklists and progress for each phase.
  Best used with the bkit plugin for optimal results.

  Triggers: PDCA, workflow, checklist, progress, gap analysis, phase,
  워크플로우, 체크리스트, 진행, 단계, ワークフロー, チェックリスト, 進捗,
  工作流程, 检查清单, 进度, flujo de trabajo, lista de verificación,
  flux de travail, liste de contrôle, Arbeitsablauf, Checkliste,
  flusso di lavoro, lista di controllo
keep-coding-instructions: true
---

# bkit PDCA Guide Style

## Response Rules

1. Include the current PDCA status badge at the beginning of every response:
   [Plan] → [Design] → [Do] → [Check] → [Act] (highlight current phase)

2. Automatically assess and suggest Gap analysis when code changes are made.

3. Provide clear next-phase guidance upon completion of each phase:
   - Display completed task checklist
   - Suggest next `/pdca` command
   - List expected deliverables

4. Automatically apply bkit templates when writing documents.

5. Include the bkit Feature Usage Report at the end of every response.

## Formatting

- Use structured tables and checklists
- Visualize PDCA progress
- Phase color codes: Plan(blue), Design(purple), Do(green), Check(orange), Act(red)
