# bkit Vibecoding Kit for Gemini CLI

> AI-Native Development with PDCA Methodology
> Version: 1.4.5

---

## Core Principles

### 1. Automation First, Commands are Shortcuts
```
Gemini automatically applies PDCA methodology.
Commands are shortcuts for power users.
```

### 2. SoR (Single Source of Truth) Priority
```
1st: Codebase (actual working code)
2nd: GEMINI.md / Convention docs
3rd: docs/ design documents
```

### 3. No Guessing
```
Unknown → Check documentation
Not in docs → Ask user
Never guess
```

---

## PDCA Workflow

### Phase 1: Plan
- Use `/pdca plan {feature}` to create plan document
- Stored in `docs/01-plan/features/{feature}.plan.md`

### Phase 2: Design
- Use `/pdca design {feature}` to create design document
- Stored in `docs/02-design/features/{feature}.design.md`

### Phase 3: Do (Implementation)
- Use `/pdca do {feature}` for implementation guide
- Implement based on design document
- Apply coding conventions from this file

### Phase 4: Check
- Use `/pdca analyze {feature}` for gap analysis
- Stored in `docs/03-analysis/{feature}.analysis.md`

### Phase 5: Act
- Use `/pdca iterate {feature}` for auto-fix if < 90%
- Use `/pdca report {feature}` for completion report

---

## Level System

### Starter (Basic)
- Static websites, simple apps
- HTML/CSS/JavaScript, Next.js basics
- Friendly explanations, step-by-step guidance

### Dynamic (Intermediate)
- Fullstack apps with BaaS
- Authentication, database, API integration
- Technical but clear explanations

### Enterprise (Advanced)
- Microservices, Kubernetes, Terraform
- High traffic, high availability
- Concise, use technical terms

---

## Available Skills (v1.4.4)

### PDCA Skill (Unified)
| Command | Description |
|---------|-------------|
| `/pdca status` | Check current PDCA status |
| `/pdca plan {feature}` | Generate Plan document |
| `/pdca design {feature}` | Generate Design document |
| `/pdca do {feature}` | Implementation guide |
| `/pdca analyze {feature}` | Run Gap analysis |
| `/pdca iterate {feature}` | Auto-fix iteration loop |
| `/pdca report {feature}` | Generate completion report |
| `/pdca next` | Guide to next PDCA step |

### Level Skills
| Command | Description |
|---------|-------------|
| `/starter` | Initialize/guide Starter project |
| `/dynamic` | Initialize/guide Dynamic project |
| `/enterprise` | Initialize/guide Enterprise project |

### Pipeline Skills
| Command | Description |
|---------|-------------|
| `/development-pipeline start` | Start development pipeline guide |
| `/development-pipeline status` | Check pipeline progress |
| `/development-pipeline next` | Guide to next pipeline phase |

### Utility Skills
| Command | Description |
|---------|-------------|
| `/zero-script-qa` | Run Zero Script QA |
| `/claude-code-learning` | Claude Code learning guide |
| `/code-review` | Code review and quality analysis |

---

## Trigger Keywords (8 Languages)

When user mentions these keywords, consider using corresponding skills:

### Gap Analysis
| Language | Keywords |
|----------|----------|
| EN | gap analysis, verify, check |
| KO | 갭 분석, 검증, 확인 |
| JA | ギャップ分析, 検証, 確認 |
| ZH | 差距分析, 验证, 确认 |
| ES | análisis de brechas, verificar |
| FR | analyse des écarts, vérifier |
| DE | Lückenanalyse, verifizieren |
| IT | analisi dei gap, verificare |

### Auto-fix Iteration
| Language | Keywords |
|----------|----------|
| EN | iterate, improve, fix |
| KO | 개선, 고쳐, 반복 |
| JA | 改善, イテレーション, 修正 |
| ZH | 改进, 迭代, 修复 |
| ES | mejorar, arreglar, iterar |
| FR | améliorer, corriger, itérer |
| DE | verbessern, reparieren, iterieren |
| IT | migliorare, correggere, iterare |

### Code Quality Analysis
| Language | Keywords |
|----------|----------|
| EN | analyze, quality, review |
| KO | 분석, 품질, 리뷰 |
| JA | 分析, 品質, レビュー |
| ZH | 分析, 质量, 审查 |
| ES | analizar, calidad, revisar |
| FR | analyser, qualité, réviser |
| DE | analysieren, Qualität, überprüfen |
| IT | analizzare, qualità, revisione |

### Generate Report
| Language | Keywords |
|----------|----------|
| EN | report, summary |
| KO | 보고서, 요약 |
| JA | 報告, サマリー |
| ZH | 报告, 摘要 |
| ES | informe, resumen |
| FR | rapport, résumé |
| DE | Bericht, Zusammenfassung |
| IT | rapporto, riepilogo |

### Zero Script QA
| Language | Keywords |
|----------|----------|
| EN | QA, test, log |
| KO | 테스트, 로그 |
| JA | テスト, ログ |
| ZH | 测试, 日志 |
| ES | prueba, registro |
| FR | test, journal |
| DE | Test, Protokoll |
| IT | test, registro |

### Design Validation
| Language | Keywords |
|----------|----------|
| EN | design, spec |
| KO | 설계, 스펙 |
| JA | 設計, スペック |
| ZH | 设计, 规格 |
| ES | diseño, especificación |
| FR | conception, spécification |
| DE | Design, Spezifikation |
| IT | design, specifica |

---

## Task Size Rules

| Size | Lines | PDCA Level | Action |
|------|-------|------------|--------|
| Quick Fix | <10 | None | No guidance needed |
| Minor Change | <50 | Light | "PDCA optional" mention |
| Feature | <200 | Recommended | Design doc recommended |
| Major Feature | >=200 | Required | Design doc strongly recommended |

---

## Check-Act Iteration Loop

```
gap-detector (Check) → Check Match Rate
    ├── >= 90% → report-generator (Complete)
    ├── 70-89% → Offer choice (manual/auto)
    └── < 70% → Recommend pdca-iterator (Act)
                   ↓
              Re-run gap-detector after fixes
                   ↓
              Repeat (max 5 iterations)
```

---

## Template References

When generating PDCA documents, use these templates:

| Document Type | Template Location |
|---------------|-------------------|
| Plan | `templates/plan.template.md` |
| Design | `templates/design.template.md` |
| Analysis | `templates/analysis.template.md` |
| Report | `templates/report.template.md` |
| _INDEX | `templates/_INDEX.template.md` |

---

## Available Skills

| Skill | Description |
|-------|-------------|
| `bkit-rules` | Core PDCA rules and code quality standards |
| `development-pipeline` | 9-phase development guide |
| `starter` | Starter level project guidance |
| `dynamic` | Dynamic level (BaaS) guidance |
| `enterprise` | Enterprise level (MSA) guidance |
| `phase-1-schema` ~ `phase-9-deployment` | Phase-specific guidance |
| `zero-script-qa` | QA methodology via Docker logs |

---

## Important Notes

1. **Hooks Activation Required**: Add to `~/.gemini/settings.json`:
   ```json
   {
     "tools": {
       "enableHooks": true
     }
   }
   ```

2. **Cross-platform Compatibility**: All scripts use Node.js for Windows/macOS/Linux support.

3. **Environment Variables**:
   - `GEMINI_PROJECT_DIR`: Current project directory
   - `BKIT_PLATFORM`: Set to "gemini" automatically

---

## Response Report Rule (v1.4.1)

**Include bkit feature usage report at the end of every response.**

### Report Format

```
─────────────────────────────────────────────────
📊 bkit Feature Usage
─────────────────────────────────────────────────
✅ Used: [bkit features used in this response]
⏭️ Not Used: [major unused features] (reason)
💡 Recommended: [features suitable for next task]
─────────────────────────────────────────────────
```

### Features to Report

**Priority Display:**
- PDCA Skill: /pdca plan, /pdca design, /pdca do, /pdca analyze, /pdca iterate, /pdca report, /pdca status, /pdca next
- Task System: TaskCreate, TaskUpdate, TaskList, TaskGet
- Agents: gap-detector, pdca-iterator, code-analyzer, report-generator, starter-guide, design-validator, qa-monitor, pipeline-guide, bkend-expert, enterprise-expert, infra-architect

**Display When Used:**
- Skills (21): pdca, bkit-rules, bkit-templates, development-pipeline, starter, dynamic, enterprise, mobile-app, desktop-app, phase-1~9, zero-script-qa, code-review, claude-code-learning
- Tools: AskUserQuestion, SessionStart Hook

### Report Rules

1. Mandatory report at end of every response
2. List bkit features used
3. Explain reasons for major unused features
4. Recommend next features based on PDCA phase

### PDCA Phase Recommendations

- Plan Complete → "Proceed to design phase with /pdca design"
- Design Complete → "Start implementation or use /pdca next for guidance"
- Do Complete → "Run Gap analysis with /pdca analyze"
- Check < 90% → "Auto-improve with /pdca iterate"
- Check >= 90% → "Generate completion report with /pdca report"
- No PDCA → "Start feature development with /pdca plan"

---

**Generated by**: bkit Vibecoding Kit
**Template Version**: 1.4.4 (Skills Integration + Unified Hooks)
