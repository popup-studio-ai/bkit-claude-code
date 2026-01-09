---
name: ai-native-development
description: |
  AI Native development methodology for building Enterprise-grade systems rapidly.
  Covers 10-day development patterns, document-first design, and AI collaboration workflows.

  Triggers: AI native, 10-day, enterprise development, 엔터프라이즈, AI協業, AI协作
agent: enterprise-expert
allowed-tools:
  - Read
  - Glob
  - Grep
  - Task
  - WebSearch
user-invocable: false
---

# AI Native Development Methodology

> Build Enterprise-grade systems with AI collaboration in 10 days.
> Based on bkamp.ai case study: 13 microservices, 588 commits, 1 developer + Claude Code.

---

## Core Philosophy

```
┌─────────────────────────────────────────────────────────────┐
│              AI Native Development 3 Principles               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Document-First Design                                   │
│     → AI understands structured documents                   │
│     → Write design docs BEFORE code                         │
│                                                             │
│  2. Monorepo Context Control                                │
│     → All code in one repo for AI context                   │
│     → CLAUDE.md per directory for instructions              │
│                                                             │
│  3. PR-Based Collaboration                                  │
│     → Every change through PR (even solo dev)               │
│     → AI references previous PRs for context                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 10-Day Development Pattern

### Day 1: Architecture Design
- **Output**: Market analysis + System architecture docs
- **Key**: Provide business context to AI
- **Docs**: `docs/00-requirement/`, `docs/01-development/01_architecture.md`

### Day 2-3: Core Development
- **Output**: Core services (Auth, User) + Business services
- **Key**: Shared modules for consistency
- **Structure**: `services/shared/`, `services/{service}/`

### Day 4-5: UX Refinement
- **Output**: PO feedback → Documentation → AI implementation
- **Key**: Document feedback before AI work

### Day 6-7: QA Cycle
- **Output**: Zero Script QA + bug fixes
- **Key**: Real-time log monitoring + immediate fixes

### Day 8: Infrastructure
- **Output**: Terraform IaC + GitOps pipeline
- **Key**: Infrastructure as code for AI understanding

### Day 9-10: Production
- **Output**: Security review + Production deployment
- **Key**: Systematic CI/CD for safe deployment

---

## Document Structure for AI

```
docs/
├── 00-requirement/     # Business requirements (AI context)
├── 01-development/     # Initial design (AI reference)
├── 02-scenario/        # Implementation analysis
├── 03-refactoring/     # Improvement records
└── 04-operation/       # Operation guides
```

**Numbering System**:
- File numbers indicate development sequence
- AI can understand project progress from numbers
- Example: `42-i18n-design.md` = 42nd document, i18n feature

---

## CLAUDE.md Hierarchy

```
project/
├── CLAUDE.md                 # Project-wide context (always read)
├── services/CLAUDE.md        # Backend conventions
├── frontend/CLAUDE.md        # Frontend conventions
└── infra/CLAUDE.md           # Infrastructure guide
```

**Conflict Resolution**: More specific CLAUDE.md takes precedence.

---

## AI Native QA Workflow

```
Traditional QA:
1. Write test cases
2. Run test scripts
3. Analyze results
4. Write bug reports

AI Native QA:
1. Human tests UI directly
2. Claude monitors Docker logs in real-time
3. Claude detects errors instantly
4. Claude fixes code immediately
```

**Advantages**:
- Instant feedback (seconds vs. minutes/hours)
- Real environment testing (no mocks)
- Documented test cycles
- Parallel work: human tests + AI analyzes

---

## Prerequisites for Success

> **WARNING**: This methodology requires senior developer/architect skills.

### 3 Essential Capabilities

```
┌─────────────────────────────────────────────────────────────┐
│            Prerequisites for AI Native Development            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Verification (검증 능력)                                 │
│     → Can judge if AI output is correct or wrong            │
│     → Code review skills, bug detection ability             │
│                                                             │
│  2. Direction (방향 설정)                                    │
│     → Knows what to build clearly                           │
│     → Requirements analysis, architecture design            │
│                                                             │
│  3. Quality Bar (품질 기준)                                  │
│     → Defines what "good code" means                        │
│     → Security, performance, maintainability judgment       │
│                                                             │
│  ⚠️  Without these: AI becomes "tool for fast mistakes"      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Claude Code = Fast Junior Developer

| Characteristic | Description |
|----------------|-------------|
| **Broad but shallow knowledge** | Knows many things, may lack depth |
| **Fast execution with direction** | Implements quickly with clear instructions |
| **Cannot judge without context** | Needs project history, business context |
| **May not recognize own mistakes** | Doesn't know when it's wrong |

**Managing such a "junior" requires a senior.**

---

## Commit Convention

```
<type>(<scope>): <subject>

Examples:
feat(i18n): implement multi-language support with gt-next
fix(auth): resolve OAuth callback redirect issue
chore: update image tags to abc123
docs: add infrastructure guide
```

**Types**: feat, fix, chore, docs, refactor, test, style

---

## PR-Based Workflow

Even for solo development, use PRs for:

1. **Work History**: AI references previous PRs for context
2. **Change Tracking**: Records which files change together
3. **Easy Rollback**: Revert specific PRs when issues occur

**Branch Strategy**:
```
main (production)
  └── staging (pre-production)
        └── feature/* (development)
        └── fix/* (bug fixes)
        └── hotfix/* (urgent fixes)
```

---

## Single Source of Truth

```
1st Priority: Codebase (always current)
2nd Priority: CLAUDE.md / Convention docs
3rd Priority: docs/ design documents (may be outdated)

❌ NEVER: Guess based on partial reading
✅ ALWAYS: Read all relevant code completely before work
```

---

## Related Skills

- `enterprise` - MSA/K8s/Terraform patterns
- `zero-script-qa` - Log-based QA methodology
- `document-standards` - PDCA document writing
- `development-pipeline` - 9-phase development process

---

## Reference

- [bkamp Development Documentation](docs/00-BKAMP_개발과정_문서화.md)
- [Workshop Curriculum](docs/202601-GPTers-CTO-workshop/)
