---
name: phase-8-review
classification: workflow
classification-reason: Process automation persists regardless of model advancement
deprecation-risk: none
description: |
  Verify codebase quality — architecture consistency, convention compliance, gap analysis.
  Triggers: code review, architecture check, quality, gap analysis, 코드 리뷰, 품질 검증.
imports:
  - ${PLUGIN_ROOT}/templates/pipeline/phase-8-review.template.md
hooks:
  Stop:
    - type: command
      command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/phase8-review-stop.js"
      timeout: 10000
agents:
  default: bkit:code-analyzer
  validate: bkit:design-validator
  gap: bkit:gap-detector
  qa: bkit:qa-strategist
  team: bkit:cto-lead
allowed-tools:
  - Read
  - Glob
  - Grep
  - LSP
  - Task
user-invocable: false
next-skill: phase-9-deployment
pdca-phase: check
task-template: "[Phase-8] {feature}"
---

# Phase 8: Architecture/Convention Review

> Overall codebase quality verification

## Purpose

Review the entire codebase before deployment. Identify architecture consistency, convention compliance, and potential issues.

## What to Do in This Phase

1. **Architecture Review**: Review structural consistency
2. **Convention Review**: Verify rule compliance
3. **Code Quality Review**: Duplication, complexity, potential bugs
4. **Refactoring**: Fix discovered issues

## Deliverables

```
docs/03-analysis/
├── architecture-review.md      # Architecture review
├── convention-review.md        # Convention review
└── refactoring-plan.md         # Refactoring plan
```

## PDCA Application

- **Plan**: Define review scope/criteria
- **Design**: Design checklist
- **Do**: Execute code review
- **Check**: Analyze issues
- **Act**: Refactor and proceed to Phase 9

## Level-wise Application

| Level | Application Method |
|-------|-------------------|
| Starter | Can be skipped (simple projects) |
| Dynamic | Required |
| Enterprise | Required + security review |

---

## Full Phase Verification Matrix

### Cross-Phase Consistency Verification

Phase 8 verifies that **all Phase outputs and rules** are consistently applied.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Cross-Phase Dependency Flow                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Phase 1 (Schema/Terminology)                                   │
│       ↓ Glossary, entity definitions                             │
│   Phase 2 (Coding Convention)                                    │
│       ↓ Naming rules, environment variable conventions           │
│   Phase 3 (Mockup)                                               │
│       ↓ Component structure, Props design                        │
│   Phase 4 (API)                                                  │
│       ↓ RESTful principles, response format, error codes         │
│   Phase 5 (Design System)                                        │
│       ↓ Design tokens, component variants                        │
│   Phase 6 (UI Implementation)                                    │
│       ↓ API client, type sharing, error handling                 │
│   Phase 7 (SEO/Security)                                         │
│       ↓ Security rules, metadata                                 │
│   Phase 8 (Review) ← Current stage: Full verification            │
│       ↓                                                          │
│   Phase 9 (Deployment)                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Phase-specific Verification Checklist

#### Phase 1 → Verify: Terminology/Schema Consistency
```
□ Are glossary.md terms consistently used in code?
  - Business terms → Code naming matching
  - Global standard terms → API response field names matching
□ Do entity definitions match actual types?
□ Do relationship definitions match actual implementation?
```

#### Phase 2 → Verify: Convention Compliance
```
□ Naming rule compliance (PascalCase, camelCase, UPPER_SNAKE_CASE)
□ Folder structure rule compliance
□ Environment variable naming rule compliance (NEXT_PUBLIC_*, DB_*, API_*, etc.)
□ .env.example template completion
□ Environment variable validation logic (lib/env.ts) exists
```

#### Phase 4 → Verify: API Consistency
```
□ RESTful principle compliance
  - Resource-based URLs (nouns, plural)
  - Correct HTTP method usage
  - Status code consistency
□ Response format consistency
  - Success: { data, meta? }
  - Error: { error: { code, message, details? } }
  - Pagination: { data, pagination }
□ Error code standardization (matches ERROR_CODES constant)
```

#### Phase 5 → Verify: Design System Consistency
```
□ Are design tokens defined? (CSS Variables / ThemeData)
□ Do components use tokens? (no hardcoded colors)
□ Are component variants consistent?
□ Dark mode support (if defined)
```

#### Phase 6 → Verify: UI-API Integration Consistency
```
□ API client layer structure compliance
  - Components → hooks → services → apiClient
  - No direct fetch calls
□ Type consistency
  - Phase 4 API spec types = Phase 6 client types
□ Error handling consistency
  - Global error handler usage
  - Error code-specific handling logic
□ State management pattern consistency
```

#### Phase 7 → Verify: Security/SEO Application
```
□ Authentication/authorization middleware applied
□ Input validation (server-side)
□ XSS, CSRF defense
□ No sensitive info exposed to client
□ SEO meta tags applied
```

#### Phase 9 → Verify: Deployment Readiness
```
□ Environment variable Secrets registered (based on Phase 2 list)
□ Environment separation (dev/staging/prod)
□ Build successful
□ Environment variable validation script passes
```

---

## Clean Architecture Verification

### Layer Separation Principles

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                      │
│         (pages, components, hooks - UI concerns)             │
├─────────────────────────────────────────────────────────────┤
│                      Application Layer                       │
│         (services, use-cases - business logic)               │
├─────────────────────────────────────────────────────────────┤
│                       Domain Layer                           │
│         (entities, types - core domain models)               │
├─────────────────────────────────────────────────────────────┤
│                    Infrastructure Layer                      │
│         (api client, db, external services)                  │
└─────────────────────────────────────────────────────────────┘

Dependency direction: Outside → Inside (Presentation → Domain)
Inner layers must not know about outer layers
```

### Layer-specific Verification Checklist

#### Presentation Layer (UI)
```
□ Is there business logic in components?
□ Are there direct API calls? (should go through hooks)
□ Is state management properly separated?
□ Do components have single responsibility?
```

#### Application Layer (Services)
```
□ Are domain logic and infrastructure logic separated?
□ Are external dependencies abstracted?
□ Is the structure testable?
□ Are use cases clearly defined?
```

#### Domain Layer (Types/Entities)
```
□ Are there no external library dependencies?
□ Does it contain only pure business rules?
□ Do types match Phase 1 schema?
```

#### Infrastructure Layer (API Client)
```
□ Are external service calls abstracted?
□ Is error handling consistent?
□ Is configuration managed via environment variables?
```

---

## Architecture Review Checklist

### Structure
- [ ] Does folder structure match conventions
- [ ] Is separation of concerns well done
- [ ] Is dependency direction correct (outside → inside)

### Patterns
- [ ] Are consistent patterns used
- [ ] Is there unnecessary abstraction
- [ ] Is proper encapsulation done

## Convention Review Checklist

### Naming
- [ ] Does it follow Phase 2 defined rules
- [ ] Are meaningful names used
- [ ] Is there consistency

### Code Style
- [ ] Unified indentation, quotes, etc.
- [ ] Is file length appropriate
- [ ] Is function length appropriate

## Code Quality Checklist

- [ ] Is there duplicate code
- [ ] Are there highly complex functions
- [ ] Is error handling appropriate
- [ ] Is type safety ensured

## AI-Assisted Review

```
Request code review from Claude:

"Review this project's code.
- Does it follow CONVENTIONS.md rules
- Is there architecture consistency
- Are there potential bugs or improvements"
```

## Template

See `templates/pipeline/phase-8-review.template.md`

## Next Phase

Phase 9: Deployment → After review completion, deploy to production

---

## 6. In-Depth Code Quality Review

### 6.1 Duplicate Code Detection

#### Detection Methods
```bash
# 1. Search for similar function names
grep -r "function.*format" src/
grep -r "function.*calculate" src/
grep -r "function.*get.*By" src/

# 2. Search for similar patterns
grep -rn "reduce.*sum" src/
grep -rn "filter.*map" src/
grep -rn "useState.*useEffect" src/
```

#### Handling by Duplication Type

| Type | Example | Solution |
|------|---------|----------|
| Exact duplicate | Same code copy-paste | Extract to function |
| Structural similarity | Same logic, different data | Parameterize |
| Conceptual similarity | Different implementations for similar purpose | Integrate or interface |

#### Duplicate Code Checklist
```
□ Is the same logic in 2+ places?
□ Are there multiple functions with similar names?
□ Is the same data transformation repeated?
□ Are similar UI patterns repeated?
□ Is the same API call pattern repeated?
□ Is similar error handling repeated?
```

### 6.2 Reusability Assessment

#### Assessment Criteria

| Score | Criteria | Description |
|-------|----------|-------------|
| ⭐⭐⭐ | High | Can be used in other projects |
| ⭐⭐ | Medium | Can be used in multiple places within same project |
| ⭐ | Low | Used only for specific feature |

#### Reusability Checklist
```
Check for each function/component:
□ Is it tied to a specific domain?
□ Does it depend on external state?
□ Are parameters generic?
□ Is the return value predictable?
□ Are there side effects?
```

### 6.3 Extensibility Assessment

#### Extensibility Check
```
When new requirements come:
□ Can it be added without modifying existing code?
□ Can behavior be changed by configuration only?
□ Is adding new types/cases easy?
□ Can it be extended without adding conditionals?
```

#### Extensibility Anti-patterns
```typescript
// ❌ Requires modification for each extension
function process(type: string) {
  if (type === 'a') { /* ... */ }
  else if (type === 'b') { /* ... */ }
  // Add else if for each new type...
}

// ❌ Hardcoded list
const ALLOWED_TYPES = ['a', 'b', 'c']

// ❌ Enumerated switch statements
switch (action.type) {
  case 'ADD': // ...
  case 'REMOVE': // ...
  // Add case for each new action...
}
```

#### Good Extensibility Patterns
```typescript
// ✅ Registry pattern
const handlers: Record<string, Handler> = {}
function register(type: string, handler: Handler) {
  handlers[type] = handler
}
function process(type: string, data: unknown) {
  return handlers[type]?.(data)
}

// ✅ Configuration-based
const CONFIG = {
  types: ['a', 'b', 'c'],
  handlers: { ... }
}

// ✅ Plugin structure
interface Plugin { execute(data): Result }
const plugins: Plugin[] = []
```

### 6.4 Object-Oriented Principles Check

#### SOLID Principles Checklist

**S - Single Responsibility (SRP)**
```
□ Does the class/function change for only one reason?
□ Does the name clearly explain the role?
□ Is "and" in the name? → Needs separation
```

**O - Open/Closed (OCP)**
```
□ Is it open for extension? (new features can be added)
□ Is it closed for modification? (no existing code changes needed)
□ Are interfaces/abstractions used?
```

**L - Liskov Substitution (LSP)**
```
□ Can subtypes replace parent types?
□ Do overridden methods keep the contract?
```

**I - Interface Segregation (ISP)**
```
□ Is the interface too large?
□ Must unused methods be implemented?
□ Can the interface be split smaller?
```

**D - Dependency Inversion (DIP)**
```
□ Does it depend on abstractions instead of concrete classes?
□ Are dependencies injected? (DI)
□ Is the structure testable?
```

### 6.5 Refactoring Priority

```
Urgent (Required before deployment):
1. Duplication that can cause bugs
2. Security vulnerabilities
3. Performance bottlenecks

High (As soon as possible):
4. Same logic duplicated in 3+ places
5. Files over 200 lines
6. Nesting deeper than 5 levels

Medium (Next sprint):
7. Structure lacking extensibility
8. Naming inconsistencies
9. Structure difficult to test

Low (Backlog):
10. Style inconsistencies
11. Excessive comments
12. Unused code
```

---

## 7. AI Code Review Request Template

```markdown
Please review the code from these perspectives:

1. Duplicate Code
   - Are there similar functions/components?
   - Is there common logic that can be extracted?

2. Reusability
   - Can it be used generically?
   - Is it tied to a specific domain?

3. Extensibility
   - Can it flexibly respond to new requirements?
   - Are there hardcoded parts?

4. SOLID Principles
   - Does it follow single responsibility?
   - Is it open for extension and closed for modification?

5. Convention Compliance
   - Does it follow CONVENTIONS.md rules?
   - Is naming consistent?

Please identify parts that need refactoring and their priority.
```

---

## 8. Gap Analysis (Design vs Implementation)

### Gap Analysis Report Template

```markdown
# Gap Analysis Report

## Analysis Target
- Design document: docs/02-design/{feature}.design.md
- Implementation path: src/features/{feature}/

## Results by Category

### API Endpoints
| Design | Implementation | Status |
|--------|----------------|--------|
| POST /api/users | POST /api/users | ✅ Match |
| GET /api/users/:id | - | ❌ Not implemented |
| - | DELETE /api/users/:id | ⚠️ Missing from design |

### Data Model
| Design Entity | Implementation | Status |
|---------------|----------------|--------|
| User | types/user.ts | ✅ Match |
| UserRole | - | ❌ Not implemented |

### Match Rate
- Total items: 10
- Matches: 7
- Not implemented: 2
- Missing from design: 1
- **Match Rate: 70%**
```

### Gap Types and Actions

| Gap Type | Meaning | Action |
|----------|---------|--------|
| ✅ Match | Design = Implementation | None |
| ❌ Not implemented | In design, not in code | Implement or update design |
| ⚠️ Missing from design | In code, not in design | Add to design document |
| 🔄 Different | Exists but different | Align (code is truth) |

### When to Run Gap Analysis

- After completing feature implementation
- Before deployment
- When design document is updated
- During code review
