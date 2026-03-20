# AI-Native Development Principles

> Core principles and competencies of AI-Native development with bkit v2.0.0

## What is AI-Native Development?

```
Claude Code + PDCA State Machine + Controllable AI (L0-L4) + Agent Teams
= AI-Native Development OS (v2.0.0)
```

A development approach where AI operates as **a controllable partner leading the entire development process**, with full transparency, auditability, and human governance at every level.

---

## 3 Core Competencies

| Competency | Description | Without It |
|------------|-------------|------------|
| **Verification Ability** | Judge whether AI output is correct | Plausible but incorrect code production |
| **Direction Setting** | Clearly define what to build | AI generates guess-based results |
| **Quality Standards** | Provide criteria for good code | Inconsistent codebase |

### v2.0.0 Implementation

| Competency | bkit Feature |
|------------|--------------|
| Verification | gap-detector agent, quality gates (7 stages), metrics collector (M1-M10), regression guard |
| Direction | State machine-driven PDCA, design-first workflow, PM Agent Team (5 agents), plan-plus brainstorming |
| Quality | code-analyzer agent, bkit-rules skill, destructive-detector (8 rules), blast radius analysis |

---

## As-Is vs To-Be

### Development Process

| Aspect | As-Is (Traditional) | To-Be (With bkit v2.0.0) |
|--------|---------------------|--------------------------|
| **Methodology** | Waterfall or Agile (manual) | Declarative PDCA state machine (20 transitions, 9 guards) |
| **Automation** | All manual or all-or-nothing | 5-level controllable automation (L0-L4) |
| **Documentation** | Code first, docs later | State machine enforces Plan → Design → Do |
| **Quality** | Manual QA team testing | Quality gates (7 stages) + Zero Script QA + metrics (M1-M10) |
| **Transparency** | AI decisions opaque | Audit logger + decision tracer + CLI dashboard |
| **Safety** | Trust the AI blindly | Trust Score + destructive detection + checkpoint/rollback |
| **Knowledge** | Scattered docs | Regression guard + PDCA report auto-generation |

### Team Composition

| Role | As-Is (10-person) | To-Be (bkit v2.0.0) | bkit Agents | Change |
|------|-------------------|----------------------|-------------|--------|
| **PM** | 1 | 0.3 | pm-lead + 4 PM agents | AI-driven product discovery |
| **Senior Dev** | 2 | 1 | cto-lead (opus) | AI orchestrates architecture |
| **Junior Dev** | 4 | 2 | bkend-expert, frontend-architect | 3x productivity with AI |
| **QA** | 2 | 0.5 | qa-strategist, qa-monitor, gap-detector | Zero Script QA + quality gates |
| **Security** | 1 | 0 | security-architect, destructive-detector | AI-automated review + safety |
| **Tech Writer** | 1 | 0 | report-generator | Auto-generated docs |
| **Total** | **11** | **3.8** | **31 AI agents** | **65% reduction** |

---

## Role Transformation

### Senior Developer → AI-Native Conductor

```
As-Is: Direct coding + Junior reviews + Architecture design
To-Be: Set automation level (L0-L4) + Verify AI decisions via audit trail
       + Define quality gates + Review trust score progression
       (AI-Native conductor with full control)
```

### Junior Developer → AI-Augmented Builder

```
As-Is: Simple feature implementation, asks seniors questions
To-Be: Drives complex features through PDCA with AI guidance
       State machine ensures consistent workflow regardless of experience
```

### QA Engineer → Quality Gate Operator

```
As-Is: Write and execute manual test scripts
To-Be: Configure quality gates + Monitor metrics dashboard
       AI handles gap analysis, human sets thresholds
```

---

## Speed Improvements

| Feature Size | As-Is | To-Be (bkit v2.0.0) | Improvement |
|--------------|-------|----------------------|-------------|
| Simple CRUD | 2-3 days | 2-4 hours | **80% faster** |
| Medium complexity | 1-2 weeks | 2-3 days | **70% faster** |
| Complex feature | 3-4 weeks | 1-2 weeks | **50% faster** |
| Full MVP | 3-6 months | 1-2 months | **60% faster** |

---

## Quality Metrics

| Quality Metric | As-Is | To-Be (bkit v2.0.0) |
|----------------|-------|----------------------|
| **Bug Discovery** | Post-release | During PDCA Check phase (quality gates) |
| **Design-Implementation Gap** | 30-50% | Under 5% (gap-detector + pdca-iterator) |
| **Code Consistency** | Varies by developer | Auto-applied conventions + regression guard |
| **Security Vulnerabilities** | Found post-hoc | Destructive detector (8 rules) + blast radius analysis |
| **Technical Debt** | Accumulates | Metrics collector (M1-M10) + continuous monitoring |
| **AI Decision Transparency** | None | Full audit trail (JSONL) + decision tracer |

---

## Language Tier System

| Tier | Category | Languages/Frameworks |
|------|----------|---------------------|
| **Tier 1** | AI-Native Essential | Python, TypeScript, JavaScript, React/Next.js |
| **Tier 2** | Mainstream Recommended | Go, Rust, Dart, Vue, Astro, Flutter |
| **Tier 3** | Domain Specific | Java, Kotlin, Swift, C/C++, Angular |
| **Tier 4** | Legacy/Niche | PHP, Ruby, C#, Scala, Elixir |

---

## CTO-Led Agent Teams (v2.0.0)

### Agent Distribution

| Model | Count | Roles |
|-------|-------|-------|
| **opus** | 10 | cto-lead, code-analyzer, design-validator, gap-detector, enterprise-expert, infra-architect, security-architect, pm-lead, bkit-impact-analyst, cc-version-researcher |
| **sonnet** | 19 | bkend-expert, pdca-iterator, pipeline-guide, starter-guide, product-manager, frontend-architect, qa-strategist, pm-discovery, pm-strategy, pm-research, pm-prd, pm-lead-skill-patch, skill-needs-extractor, 6 pdca-eval agents |
| **haiku** | 2 | qa-monitor, report-generator |

### Agent Frontmatter (v2.0.0)

All 31 agents support native frontmatter fields:
- `effort`: min/max reasoning effort per agent role
- `maxTurns`: execution budget control
- `disallowedTools`: restrict dangerous tool access per agent
- `memory`: project or user scope for cross-session persistence

### Orchestration Patterns

| Pattern | Usage | PDCA Phase |
|---------|-------|------------|
| Leader | CTO directs single agent | Plan, Report |
| Council | Multiple agents collaborate | Design, Check |
| Swarm | Parallel independent tasks | Do |
| Pipeline | Sequential processing | Do → Check |
| Watchdog | Continuous monitoring | Act |

---

## Skill Classification (v2.0.0)

| Classification | Count | Core Philosophy |
|:---:|:---:|---|
| **Workflow** | 9 | Automation First — permanent value regardless of model advancement |
| **Capability** | 25 | No Guessing — guidance that models may eventually internalize |
| **Hybrid** | 2 | Both workflow and capability characteristics |

---

## Key Message

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   "It's not about reducing developers,                         │
│    it's about letting developers focus on more valuable work"  │
│                                                                 │
│   v2.0.0 adds: "...with full control over how much AI does"   │
│                                                                 │
│   • Repetitive tasks → AI handles (L2+ auto)                   │
│   • Creative design, business logic → Developers focus          │
│   • Documentation, QA → Automated with quality gates            │
│   • Direction setting, verification → Human's unique role       │
│   • AI transparency → Audit trail + decision traces             │
│   • AI safety → Trust Score + destructive detection             │
│                                                                 │
│   Result: Same team creates 3x more value, with full control   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Related Documents

- [[core-mission]] - Core mission and philosophies
- [[pdca-methodology]] - PDCA methodology
- [[context-engineering]] - Context Engineering architecture
