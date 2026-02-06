# AI-Native Development Principles

> Core principles and 3 competencies of AI-Native development

## What is AI-Native Development?

```
Claude Code + PDCA Methodology + 9-Stage Pipeline + Zero Script QA
= AI-Native Development Framework
```

A development approach where AI operates as **a partner leading the entire development process together**, not just a simple code generation tool.

---

## 3 Core Competencies

Three essential competencies required of humans in AI-Native development:

| Competency | Description | Without It |
|------------|-------------|------------|
| **Verification Ability** | Judge whether AI output is correct | Plausible but incorrect code production |
| **Direction Setting** | Clearly define what to build | AI generates guess-based results |
| **Quality Standards** | Provide criteria for good code | Inconsistent codebase |

### Implementation in bkit

| Competency | bkit Feature |
|------------|--------------|
| Verification | `gap-detector` agent, `/pdca-analyze` |
| Direction | Design-first workflow, templates |
| Quality | `code-analyzer` agent, `bkit-rules` skill |

---

## As-Is vs To-Be

### Development Process

| Aspect | As-Is (Traditional) | To-Be (With bkit) |
|--------|---------------------|-------------------|
| **Methodology** | Waterfall or Agile (manual) | Automated PDCA cycle |
| **Documentation** | Code first, docs later | Design first → Code → Auto-sync |
| **Quality Verification** | Manual QA team testing | Zero Script QA (log-based) |
| **Knowledge Sharing** | Scattered docs | Single Source of Truth (CLAUDE.md) |
| **Onboarding** | 2-4 weeks | Under 1 week (auto-referenced docs) |

### Team Composition

| Role | As-Is (10-person) | To-Be (bkit) | Change |
|------|-------------------|--------------|--------|
| **PM** | 1 | 0.5 | PDCA auto-tracking |
| **Senior Dev** | 2 | 1 | AI guides architecture |
| **Junior Dev** | 4 | 2 | 3x productivity with AI |
| **QA** | 2 | 0.5 | Zero Script QA |
| **Tech Writer** | 1 | 0 | Auto-generated docs |
| **Total** | **10** | **4** | **60% reduction** |

---

## Role Transformation

### Senior Developer

```
As-Is: Direct coding + Junior reviews + Architecture design
To-Be: AI verification + Direction setting + Quality standards
       (AI-Native conductor)
```

### Junior Developer

```
As-Is: Simple feature implementation, asks seniors questions
To-Be: Can implement complex features through AI collaboration
```

### QA Engineer

```
As-Is: Write and execute manual test scripts
To-Be: Monitor logs, discover edge cases with AI assistance
```

---

## Speed Improvements

| Feature Size | As-Is | To-Be (bkit) | Improvement |
|--------------|-------|--------------|-------------|
| Simple CRUD | 2-3 days | 2-4 hours | **80% faster** |
| Medium complexity | 1-2 weeks | 2-3 days | **70% faster** |
| Complex feature | 3-4 weeks | 1-2 weeks | **50% faster** |
| Full MVP | 3-6 months | 1-2 months | **60% faster** |

### Breakdown

```
1. Auto-generated boilerplate: -50% coding time
2. Design-code sync: -70% communication overhead
3. Zero Script QA: -80% QA time
4. Auto-documentation: -90% doc writing time
5. AI pair programming: -40% debugging time
```

---

## Quality Metrics

| Quality Metric | As-Is | To-Be (bkit) |
|----------------|-------|--------------|
| **Bug Discovery** | Post-release | During development |
| **Design-Implementation Gap** | 30-50% | Under 5% |
| **Code Consistency** | Varies by developer | Auto-applied conventions |
| **Security Vulnerabilities** | Found post-hoc | Pre-checked (Phase 7) |
| **Technical Debt** | Accumulates | Periodic analysis |

---

## Language Tier System (v1.2.1)

bkit classifies languages optimized for AI-Native development into 4 tiers:

| Tier | Category | Languages/Frameworks |
|------|----------|---------------------|
| **Tier 1** | AI-Native Essential | Python, TypeScript, JavaScript, React/Next.js |
| **Tier 2** | Mainstream Recommended | Go, Rust, Dart, Vue, Astro, Flutter |
| **Tier 3** | Domain Specific | Java, Kotlin, Swift, C/C++, Angular |
| **Tier 4** | Legacy/Niche | PHP, Ruby, C#, Scala, Elixir |
| **Experimental** | Future Consideration | Mojo, Zig, V |

### Selection Criteria

- AI tool ecosystem compatibility (Copilot, Claude, Cursor)
- Vibe Coding optimization
- Market share (IEEE Spectrum)
- Training data availability

---

## Key Message

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   "It's not about reducing developers,                         │
│    it's about letting developers focus on more valuable work"  │
│                                                                 │
│   • Repetitive tasks → AI handles                               │
│   • Creative design, business logic → Developers focus          │
│   • Documentation, QA → Automated                               │
│   • Direction setting, verification → Human's unique role       │
│                                                                 │
│   Result: Same team creates 3x more value                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

---

## v1.5.1 Feature Integration

### Output Styles in AI-Native Context

Output Styles implement adaptive communication:

| Style | AI-Native Benefit |
|-------|-------------------|
| `bkit-learning` | Reduces learning curve, enables beginners to adopt AI practices |
| `bkit-pdca-guide` | Enforces document-driven development through visual progress |
| `bkit-enterprise` | CTO-level analysis for architecture decisions |

### Agent Teams in AI-Native Context

Agent Teams transform AI from "assistant" to "team member":
- Multiple AI agents work in parallel on different PDCA phases
- Reduces development time further beyond single-agent workflows
- Mirrors real team composition (architect, developer, qa, reviewer)

### Agent Memory in AI-Native Context

Agent Memory enables continuous learning:
- Project knowledge accumulates across sessions
- Agents improve their responses based on previous interactions
- No manual knowledge transfer needed between sessions

---

## Related Documents

- [[core-mission]] - Core mission and philosophies
- [[pdca-methodology]] - PDCA methodology
- [[../components/agents/_agents-overview]] - Agent system
- [[../../skills/enterprise/SKILL]] - Enterprise skill (AI-Native details)
