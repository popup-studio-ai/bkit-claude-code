# pm-skills-integration Design Document

> **Summary**: pm-skills 34개 프레임워크를 기존 4개 에이전트 프롬프트에 직접 흡수하는 상세 설계
>
> **Project**: bkit (Vibecoding Kit)
> **Version**: 1.6.2 → 1.7.0
> **Author**: bkit PDCA
> **Date**: 2026-03-21
> **Status**: Draft
> **Planning Doc**: [pm-skills-integration.plan.md](../01-plan/features/pm-skills-integration.plan.md)

---

## 1. Overview

### 1.1 Design Goals

1. 기존 4개 PM 에이전트(pm-discovery, pm-strategy, pm-research, pm-prd)의 프롬프트를 확장하여 pm-skills 프레임워크를 내장
2. pm-lead 오케스트레이션 업데이트로 확장된 출력 통합
3. pm-prd.template.md에 신규 섹션 추가
4. 기존 워크플로우 100% 하위 호환

### 1.2 Design Principles

- **Additive Only**: 기존 프롬프트를 삭제하지 않고 뒤에 추가
- **Context-Dependent Execution**: 모든 신규 프레임워크에 "When to run" 조건 명시
- **Token Efficiency**: 프레임워크 설명은 핵심만 (각 20-40줄), 상세 가이드는 실행 시 WebSearch
- **Attribution First**: 모든 프레임워크에 원저자 + pm-skills MIT 출처

---

## 2. Architecture

### 2.1 변경 대상 파일 목록

| # | File | Action | FR |
|---|------|--------|-----|
| 1 | `agents/pm-discovery.md` | 확장 (5개 프레임워크 + 체인 프로세스) | FR-01~05 |
| 2 | `agents/pm-strategy.md` | 확장 (6개 프레임워크 + 선택 실행) | FR-06~11 |
| 3 | `agents/pm-research.md` | 확장 (3개 프레임워크) | FR-12~14 |
| 4 | `agents/pm-prd.md` | 확장 (8개 프레임워크 + 실행 산출물) | FR-15~22 |
| 5 | `templates/pm-prd.template.md` | 섹션 추가 | FR-23 |
| 6 | `agents/pm-lead.md` | 오케스트레이션 업데이트 | FR-24 |

### 2.2 Data Flow (변경 후)

```
pm-lead (Context Collection)
    │
    ├─── Task(pm-discovery) ──────────────────────────────────┐
    │    Step 1: Brainstorm Ideas (new or existing)           │
    │    Step 2: Identify Assumptions (8 risk categories)     │
    │    Step 3: Prioritize Assumptions (Impact×Risk)         │
    │    Step 4: Design Experiments (pretotype/prototype)      │
    │    Step 5: Build OST (integrate above into tree)        │
    │    Optional: Interview Script + Summary                 │
    │    Output: Discovery Analysis (enriched)                │
    │                                                         │
    ├─── Task(pm-strategy) ───────────────────────────────────┤ parallel
    │    Core: JTBD VP 6-Part + Lean Canvas (existing)        │
    │    +SWOT Analysis (internal strengths/weaknesses)       │
    │    +PESTLE Analysis (macro environment, if B2B/regulated)│
    │    +Porter's Five Forces (if competitive market)        │
    │    +BMC (if established business, alt to Lean Canvas)   │
    │    +Pricing Strategy (if monetization relevant)         │
    │    +Ansoff Matrix (if growth direction unclear)         │
    │    Output: Strategy Analysis (enriched)                 │
    │                                                         │
    ├─── Task(pm-research) ───────────────────────────────────┤ parallel
    │    Core: Personas + Competitors + TAM/SAM/SOM (existing)│
    │    +Customer Journey Map (per primary persona)          │
    │    +User Segmentation (behavioral JTBD-based)           │
    │    +Sentiment Analysis (if feedback data available)     │
    │    Output: Market Research (enriched)                   │
    │                                                         │
    └─── Task(pm-prd) ───────────────────────────────────────┘ sequential
         Core: Beachhead + GTM + PRD 8-section (existing)
         +Ideal Customer Profile (ICP, from research)
         +Competitive Battlecard (top 2 competitors)
         +Growth Loops (product-led/sales-led)
         +Pre-mortem (PRD risk analysis)
         +User Stories (3C/INVEST, from PRD features)
         +Job Stories (When/Want/So, from JTBD)
         +Test Scenarios (from user stories)
         +Stakeholder Map (Power/Interest Grid)
         Output: Complete PRD (expanded template)
```

---

## 3. Detailed Design: agents/pm-discovery.md

### 3.1 Frontmatter Changes

```yaml
# CHANGE: maxTurns 20 → 25 (5단계 체인 수용)
maxTurns: 25
# CHANGE: description 업데이트
description: |
  PM Discovery agent - 5-Step Discovery Chain + Opportunity Solution Tree.
  Brainstorm → Assumptions → Prioritize → Experiments → OST synthesis.
  Based on Teresa Torres + Pawel Huryn discovery frameworks.
```

### 3.2 Core Responsibilities (REPLACE)

```markdown
### Core Responsibilities

1. **Brainstorm Ideas**: Generate ideas from PM/Designer/Engineer perspectives (new or existing product)
2. **Identify Assumptions**: Categorize risky assumptions across 8 risk categories
3. **Prioritize Assumptions**: Rank using Impact × Risk matrix
4. **Design Experiments**: Create validation experiments (pretotypes for new, prototypes for existing)
5. **Build OST**: Synthesize above into Opportunity Solution Tree
6. **(Optional) Interview**: Generate JTBD interview script if user research is planned
```

### 3.3 New Frameworks to ADD (after existing OST section)

```markdown
### Framework 2: Brainstorm Ideas

**For New Products** (no existing users):
- Generate 10+ ideas across 3 perspectives: PM (business value), Designer (UX), Engineer (feasibility)
- Use "How Might We..." framing
- Group into themes, identify top 5 by novelty × feasibility

**For Existing Products** (has users/data):
- Review existing feedback, support tickets, usage data patterns
- Generate 10+ improvement ideas across same 3 perspectives
- Include "Remove/Reduce" ideas (simplification), not just additions
- Group by impact area, identify top 5 by user-impact × effort

Output table:
| # | Idea | Perspective | Theme | Novelty | Feasibility | Score |
|---|------|-------------|-------|---------|-------------|-------|

### Framework 3: Identify Assumptions

Categorize risky assumptions across 8 categories:

**Product Risk (4)**:
1. **Value**: Will users find this valuable? Will it solve their problem?
2. **Usability**: Can users figure out how to use it?
3. **Feasibility**: Can we build it with current tech/resources?
4. **Viability**: Does it work for the business (revenue, cost, compliance)?

**GTM Risk (4)**:
5. **Market**: Is the market large enough? Is timing right?
6. **Channel**: Can we reach target users effectively?
7. **Pricing**: Will users pay this price? Is the model sustainable?
8. **Team**: Do we have the skills/bandwidth to execute?

For each assumption:
| # | Assumption | Category | Evidence For | Evidence Against | Risk Level |
|---|-----------|----------|-------------|-----------------|------------|

### Framework 4: Prioritize Assumptions

Use Impact × Risk matrix:
- **Impact** (1-5): How critical is this assumption to success?
- **Risk** (1-5): How likely is this assumption to be wrong?
- **Priority Score** = Impact × Risk (max 25)

| # | Assumption | Impact | Risk | Score | Action |
|---|-----------|--------|------|-------|--------|
Score ≥ 20: Test immediately (experiment required)
Score 15-19: Test soon (plan experiment)
Score 10-14: Monitor (gather passive data)
Score < 10: Accept for now

### Framework 5: Brainstorm Experiments

**For New Products (Pretotypes)** — Alberto Savoia method:
- Fake Door: landing page measuring click-through
- Concierge: manually deliver the service
- Wizard of Oz: human behind the curtain
- Mechanical Turk: manual process appearing automated
- Pinocchio: non-functional prototype for feedback

**For Existing Products (Prototypes)**:
- A/B test with feature flag
- Beta cohort (5-10% of users)
- Painted door (button that measures interest)
- Hallway test (5-second usability)

| # | Tests Assumption | Method | Type | Duration | Success Criteria | Effort |
|---|-----------------|--------|------|----------|-----------------|--------|

### Framework 6: Interview Script (Optional)

Generate JTBD-based interview script when user research is planned:
1. **Warm-up** (2 min): Role, context, typical day
2. **Timeline** (10 min): Last time they did {JTBD}, what triggered it, steps taken
3. **Push/Pull** (5 min): What pushed away from old solution, what pulled toward new
4. **Anxieties/Habits** (5 min): What held them back, what habits they had to break
5. **Outcome** (3 min): How they measure success, what ideal looks like

Interview tips:
- Ask about past behavior, not hypothetical future
- "Tell me about the last time..." not "Would you..."
- Follow energy — probe deeper when they get animated
```

### 3.4 Process (REPLACE)

```markdown
### Process — 5-Step Discovery Chain

1. Read feature description and project context from PM Lead
2. Determine product stage: **New** (no users) or **Existing** (has users/data)
3. **Step 1 — Brainstorm Ideas**: Generate 10+ ideas across 3 perspectives
4. **Step 2 — Identify Assumptions**: Extract 8-15 risky assumptions from top ideas
5. **Step 3 — Prioritize Assumptions**: Score using Impact × Risk matrix
6. **Step 4 — Design Experiments**: Create 3-5 experiments for top-priority assumptions
7. **Step 5 — Build OST**: Synthesize into Opportunity Solution Tree (existing framework)
8. (Optional) Generate Interview Script if PM Lead requests user research
9. Present complete Discovery Analysis
```

### 3.5 Output Format (REPLACE)

```markdown
### Output Format

## Discovery Analysis: {feature}

### Product Stage: {New / Existing}

### Step 1: Brainstormed Ideas
| # | Idea | Perspective | Theme | Score |
|---|------|-------------|-------|-------|

### Step 2: Key Assumptions
| # | Assumption | Category | Risk Level |
|---|-----------|----------|------------|

### Step 3: Prioritized Assumptions
| # | Assumption | Impact | Risk | Score | Action |
|---|-----------|--------|------|-------|--------|

### Step 4: Recommended Experiments
| # | Tests Assumption | Method | Type | Success Criteria | Effort |
|---|-----------------|--------|------|-----------------|--------|

### Step 5: Opportunity Solution Tree
{hierarchical tree visualization — same as current}

### Prioritized Opportunities
{same table as current}

### Top Solutions
{same table as current}

### Interview Script (if requested)
{JTBD interview template}
```

### 3.6 Attribution (REPLACE)

```markdown
### Attribution

Based on frameworks from [pm-skills](https://github.com/phuryn/pm-skills) by Pawel Huryn (MIT License):
- opportunity-solution-tree: Teresa Torres, *Continuous Discovery Habits*
- brainstorm-ideas-new, brainstorm-ideas-existing: Multi-perspective ideation
- identify-assumptions-new, identify-assumptions-existing: 8-category risk assessment
- prioritize-assumptions: Impact × Risk matrix
- brainstorm-experiments-new: Alberto Savoia, *The Right It* (pretotypes)
- brainstorm-experiments-existing: A/B test & beta cohort patterns
- interview-script: JTBD interview methodology
```

---

## 4. Detailed Design: agents/pm-strategy.md

### 4.1 Frontmatter Changes

```yaml
# CHANGE: description 업데이트
description: |
  PM Strategy agent - Value Proposition (JTBD 6-Part) + Lean Canvas +
  Strategic Analysis (SWOT, PESTLE, Porter's 5, BMC, Pricing, Ansoff).
  Context-dependent: runs core frameworks always, adds strategic analysis based on product context.
```

### 4.2 Core Responsibilities (REPLACE)

```markdown
### Core Responsibilities

1. **Value Proposition**: Design a 6-part JTBD value proposition (always)
2. **Lean Canvas**: Create a 9-section business model hypothesis (always)
3. **Strategic Analysis**: Run context-dependent frameworks (see selection guide)
4. **Strategic Synthesis**: Produce actionable value prop statement + key strategic insights
```

### 4.3 New Frameworks to ADD (after Lean Canvas section)

```markdown
### Framework 3: SWOT Analysis

Identify internal and external factors:

| | Helpful | Harmful |
|---|---------|---------|
| **Internal** | **Strengths**: Core competencies, unique resources, team expertise | **Weaknesses**: Gaps, limitations, resource constraints |
| **External** | **Opportunities**: Market trends, unmet needs, tech shifts | **Threats**: Competitors, regulations, market changes |

For each quadrant: list 3-5 factors with evidence.
Synthesis: SO strategies (use strengths to capture opportunities), WT strategies (mitigate weaknesses against threats).

**When to run**: Always. Fundamental strategic baseline.

### Framework 4: PESTLE Analysis

Analyze 6 macro-environment dimensions:

| Factor | Current State | Trend (↑↓→) | Impact on Product | Timeframe |
|--------|--------------|-------------|-------------------|-----------|
| **Political** | regulations, trade policy, government stability | | | |
| **Economic** | growth, inflation, unemployment, disposable income | | | |
| **Social** | demographics, culture, lifestyle, attitudes | | | |
| **Technological** | innovation, automation, R&D, digital adoption | | | |
| **Legal** | compliance, IP, labor law, data protection | | | |
| **Environmental** | sustainability, climate, resource scarcity | | | |

**When to run**: B2B products, regulated industries, or products sensitive to macro trends.

### Framework 5: Porter's Five Forces

Evaluate industry competitive structure:

| Force | Intensity (Low/Med/High) | Key Factors | Implication |
|-------|:------------------------:|-------------|-------------|
| **Competitive Rivalry** | | Number of competitors, differentiation, switching costs | |
| **Supplier Power** | | Supplier concentration, substitute inputs, switching costs | |
| **Buyer Power** | | Buyer concentration, price sensitivity, information access | |
| **Threat of Substitutes** | | Availability, relative price-performance, switching costs | |
| **Threat of New Entrants** | | Capital requirements, economies of scale, brand loyalty, regulations | |

**Overall Industry Attractiveness**: {High/Medium/Low} — {rationale}

**When to run**: Competitive markets, or when differentiation strategy is unclear.

### Framework 6: Business Model Canvas (BMC)

Full 9-block Alexander Osterwalder canvas (use instead of Lean Canvas for established businesses):

| Block | Content |
|-------|---------|
| **Key Partners** | Strategic alliances, suppliers, key resources from partners |
| **Key Activities** | Core activities to deliver value proposition |
| **Key Resources** | Physical, intellectual, human, financial |
| **Value Propositions** | Bundle of products/services for each segment |
| **Customer Relationships** | Type of relationship (self-service, dedicated, automated) |
| **Channels** | How value proposition reaches customers |
| **Customer Segments** | Different groups of people/orgs to serve |
| **Cost Structure** | Most important costs (fixed, variable, economies of scale) |
| **Revenue Streams** | Revenue per segment (pricing, payment model) |

**When to run**: Established products or businesses. Use Lean Canvas for startups/new products.

### Framework 7: Pricing Strategy

3-layer pricing analysis:

**Layer 1 — Model Selection**:
| Model | Description | Best For |
|-------|-------------|----------|
| Freemium | Free tier + paid upgrade | Consumer SaaS, network effects |
| Subscription | Recurring monthly/annual | B2B SaaS, content |
| Usage-based | Pay per use/unit | API, infrastructure |
| Tiered | Good/Better/Best packages | Most SaaS |
| Transaction | Per-transaction fee | Marketplace, payments |

**Layer 2 — Willingness to Pay (WTP)**: Van Westendorp price sensitivity:
- Too cheap (quality concern): $___
- Cheap (good deal): $___
- Expensive (hesitate): $___
- Too expensive (won't buy): $___

**Layer 3 — Competitive Positioning**: Price vs value matrix (4 quadrants)

**When to run**: Monetization is a key decision or product involves pricing changes.

### Framework 8: Ansoff Matrix

4 growth strategy directions:

| | Existing Products | New Products |
|---|:-:|:-:|
| **Existing Markets** | **Market Penetration**: Increase share through optimization, retention, upsell | **Product Development**: New features/products for current users |
| **New Markets** | **Market Development**: Expand to new segments, geographies, channels | **Diversification**: New products for new markets (highest risk) |

Recommendation: Identify which quadrant the feature falls into and assess risk level.

**When to run**: Growth direction is unclear or feature involves market expansion.
```

### 4.4 Context Selection Guide to ADD

```markdown
### Context-Dependent Execution Guide

| Framework | Always Run | Condition to Run |
|-----------|:---------:|-----------------|
| JTBD VP 6-Part | ✅ | — |
| Lean Canvas | ✅ (startups/new) | Skip if BMC is selected |
| SWOT | ✅ | — |
| PESTLE | ❌ | B2B, regulated industry, or macro-sensitive |
| Porter's 5 | ❌ | Competitive market, differentiation unclear |
| BMC | ❌ | Established business (replaces Lean Canvas) |
| Pricing | ❌ | Monetization is a key decision |
| Ansoff | ❌ | Growth direction unclear, expansion feature |

**Default set**: VP + Lean Canvas + SWOT (3 frameworks, ~80% of cases)
**Full set**: All 8 frameworks (complex enterprise decisions)
```

### 4.5 Output Format Addition

```markdown
### Strategic Analysis (Context-Dependent)

#### SWOT Analysis
{table as defined above}

#### PESTLE Analysis (if applicable)
{table as defined above}

#### Porter's Five Forces (if applicable)
{table as defined above}

#### Pricing Strategy (if applicable)
{tables as defined above}

### Strategic Synthesis
| Dimension | Key Insight | Implication |
|-----------|------------|-------------|
| Internal (SWOT) | {insight} | {action} |
| External (PESTLE) | {insight} | {action} |
| Competitive (Porter's) | {insight} | {action} |
| Growth (Ansoff) | {insight} | {action} |
```

### 4.6 Attribution (REPLACE)

```markdown
### Attribution

Based on frameworks from [pm-skills](https://github.com/phuryn/pm-skills) by Pawel Huryn (MIT License):
- value-proposition: JTBD 6-Part (Pawel Huryn & Aatir Abdul Rauf)
- lean-canvas: Ash Maurya
- swot-analysis: Albert Humphrey (Strengths, Weaknesses, Opportunities, Threats)
- pestle-analysis: Francis Aguilar (macro-environment scanning)
- porters-five-forces: Michael Porter, *Competitive Strategy*
- business-model: Alexander Osterwalder, *Business Model Generation*
- pricing-strategy: Van Westendorp price sensitivity
- ansoff-matrix: Igor Ansoff, *Corporate Strategy*
```

---

## 5. Detailed Design: agents/pm-research.md

### 5.1 Frontmatter Changes

```yaml
# CHANGE: description 업데이트
description: |
  PM Market Research agent - User Personas, Competitor Analysis, Market Sizing,
  Customer Journey Map, User Segmentation, and Sentiment Analysis.
```

### 5.2 Core Responsibilities (REPLACE)

```markdown
### Core Responsibilities

1. **User Personas**: Create 3 research-backed personas with JTBD (always)
2. **Competitor Analysis**: Identify and analyze 5 direct competitors (always)
3. **Market Sizing**: Estimate TAM/SAM/SOM with dual-method validation (always)
4. **Customer Journey Map**: Map end-to-end experience for primary persona (always)
5. **User Segmentation**: Behavioral segmentation using JTBD (if multiple user types)
6. **Sentiment Analysis**: Analyze feedback data for insights (if feedback data available)
```

### 5.3 New Frameworks to ADD

```markdown
### Framework 4: Customer Journey Map

Map the end-to-end experience for the primary persona:

| Stage | Touchpoint | Actions | Thoughts | Emotions | Pain Points | Opportunities |
|-------|-----------|---------|----------|----------|-------------|---------------|
| **Awareness** | How they discover the problem | | | 😐→😟 | | |
| **Consideration** | How they evaluate solutions | | | 😟→🤔 | | |
| **Decision** | How they choose to act | | | 🤔→😊 | | |
| **Onboarding** | First experience with product | | | 😊→😤/😍 | | |
| **Usage** | Regular usage pattern | | | | | |
| **Advocacy** | How they share/recommend | | | 😍→📢 | | |

Key moments: Identify "Moments of Truth" where experience makes or breaks retention.

**When to run**: Always. Use primary persona from Framework 1.

### Framework 5: User Segmentation

Segment users by behavior and JTBD (not demographics):

| Segment | Primary JTBD | Behavior Pattern | Size (%) | Value ($) | Priority |
|---------|-------------|-----------------|----------|-----------|----------|
| {segment 1} | {job to be done} | {usage pattern} | | | |
| {segment 2} | {job to be done} | {usage pattern} | | | |
| {segment 3} | {job to be done} | {usage pattern} | | | |

Segmentation criteria:
- **Behavioral**: Frequency, features used, engagement level
- **Need-based**: Primary JTBD, pain severity, willingness to pay
- **Value-based**: Revenue potential, LTV, acquisition cost

**When to run**: Multiple distinct user types exist or product serves different JTBD.

### Framework 6: Sentiment Analysis

Analyze available feedback for market insights:

| Source | Volume | Positive (%) | Negative (%) | Neutral (%) |
|--------|--------|:------------:|:------------:|:-----------:|
| App reviews | | | | |
| Social media | | | | |
| Support tickets | | | | |
| Survey data | | | | |

Top themes by sentiment:
| Theme | Mentions | Avg Sentiment (-5 to +5) | Representative Quote |
|-------|----------|:------------------------:|---------------------|

**When to run**: Only when feedback data is available or can be gathered via WebSearch.
```

### 5.4 Output Format Addition

```markdown
### Customer Journey Map (Primary Persona: {name})
{journey map table}

**Moments of Truth**: {key moments}
**Biggest Pain Point**: {stage + description}
**Biggest Opportunity**: {stage + description}

### User Segmentation (if applicable)
{segmentation table}

### Sentiment Analysis (if applicable)
{sentiment tables}
```

### 5.5 Attribution (REPLACE)

```markdown
### Attribution

Based on frameworks from [pm-skills](https://github.com/phuryn/pm-skills) by Pawel Huryn (MIT License):
- user-personas: JTBD-based persona construction
- competitor-analysis: Strategic positioning analysis
- market-sizing: TAM/SAM/SOM dual-method (top-down + bottom-up)
- customer-journey-map: End-to-end experience mapping
- user-segmentation: Behavioral JTBD-based segmentation
- sentiment-analysis: Multi-source feedback analysis
```

---

## 6. Detailed Design: agents/pm-prd.md

### 6.1 Frontmatter Changes

```yaml
# CHANGE: maxTurns 20 → 25 (추가 산출물 생성 시간)
maxTurns: 25
# CHANGE: description 업데이트
description: |
  PM PRD agent - Synthesizes all PM analysis into comprehensive PRD.
  Adds Beachhead + GTM + ICP + Battlecard + Growth Loops + Pre-mortem +
  User Stories + Job Stories + Test Scenarios + Stakeholder Map.
```

### 6.2 Core Responsibilities (REPLACE)

```markdown
### Core Responsibilities

1. **Beachhead Segment Analysis**: Identify the first market to target (existing)
2. **GTM Strategy**: Design go-to-market approach (existing)
3. **Ideal Customer Profile (ICP)**: Define ideal customer from research data
4. **Competitive Battlecard**: Create sales-ready comparison for top 2 competitors
5. **Growth Loops**: Identify product-led and sales-led growth mechanisms
6. **PRD Synthesis**: Combine all PM analysis into expanded PRD
7. **Pre-mortem**: Analyze PRD for potential failure modes
8. **User Stories**: Generate INVEST stories from PRD features
9. **Job Stories**: Generate When/Want/So stories from JTBD
10. **Test Scenarios**: Derive test cases from user stories
11. **Stakeholder Map**: Create Power/Interest grid for key stakeholders
12. **Document Output**: Write PRD to `docs/00-pm/{feature}.prd.md`
```

### 6.3 New Frameworks to ADD

```markdown
### Framework 3: Ideal Customer Profile (ICP)

Define the ideal customer from research data:

| Attribute | Details |
|-----------|---------|
| **Industry/Vertical** | {specific industry} |
| **Company Size** | {employees, revenue range} |
| **Role/Title** | {decision maker + end user} |
| **Primary JTBD** | {core job from persona research} |
| **Key Pain Points** | {top 3 from research} |
| **Budget Range** | {willingness to pay from research} |
| **Buying Process** | {self-serve / sales-assisted / enterprise} |
| **Success Indicators** | {how they measure ROI} |

### Framework 4: Competitive Battlecard

For top 2 competitors (from pm-research), create sales-ready comparison:

| Category | Us | {Competitor 1} | {Competitor 2} |
|----------|-----|----------------|----------------|
| **Positioning** | | | |
| **Key Strength** | | | |
| **Key Weakness** | | | |
| **Price** | | | |
| **Best For** | | | |

**Win Strategy vs {Competitor 1}**: {approach}
**Win Strategy vs {Competitor 2}**: {approach}
**Common Objections & Responses**: {objection → response pairs}

### Framework 5: Growth Loops

Identify sustainable growth mechanisms:

**Product-Led Growth**:
| Loop | Trigger | Action | Output | Metric |
|------|---------|--------|--------|--------|
| Viral | {user action} | {sharing mechanism} | {new user acquisition} | {viral coefficient} |
| Content | {content creation} | {SEO/social} | {organic traffic} | {CAC} |
| Data | {usage data} | {product improvement} | {better experience} | {retention} |

**Sales-Led Growth** (if applicable):
| Loop | Trigger | Action | Output | Metric |
|------|---------|--------|--------|--------|
| Outbound | {ICP signal} | {sales outreach} | {qualified pipeline} | {conversion rate} |
| Expansion | {usage milestone} | {upsell motion} | {revenue growth} | {NRR} |

### Framework 6: Pre-mortem

Imagine the product has failed 12 months after launch. What went wrong?

| # | Failure Mode | Category | Likelihood | Impact | Prevention Strategy |
|---|-------------|----------|:----------:|:------:|-------------------|
| 1 | | Value/Usability/Feasibility/Viability/Market/Team | H/M/L | H/M/L | |

Top 3 risks to address before v1 launch.

### Framework 7: User Stories (3C + INVEST)

Generate from PRD Section 5.6 (Solution/Key Features):

**Card** format:
```
As a {persona from research},
I want to {action/capability from feature},
so that {outcome/benefit from JTBD}.
```

**INVEST criteria check per story**:
- [I]ndependent, [N]egotiable, [V]aluable, [E]stimable, [S]mall, [T]estable

| ID | User Story | Priority | INVEST | Acceptance Criteria |
|----|-----------|----------|:------:|-------------------|
| US-01 | As a {persona}... | Must/Should/Could | ✅/⚠️ | Given/When/Then |

### Framework 8: Job Stories

Generate from JTBD analysis (pm-strategy output):

```
When {situation/trigger},
I want to {motivation/action},
so I can {expected outcome}.
```

| ID | Situation | Motivation | Outcome | Priority |
|----|-----------|-----------|---------|----------|
| JS-01 | | | | |

### Framework 9: Test Scenarios

Derive from User Stories:

| ID | Story Ref | Scenario | Precondition | Steps | Expected Result | Priority |
|----|-----------|----------|-------------|-------|----------------|----------|
| TS-01 | US-01 | Happy path | | 1. 2. 3. | | High |
| TS-02 | US-01 | Error case | | 1. 2. 3. | | Medium |

### Framework 10: Stakeholder Map

Power/Interest Grid:

```
         High Power
              │
    Manage    │   Collaborate
    Closely   │   Closely
              │
─────────────┼──────────────
              │
    Monitor   │   Keep
    (minimal) │   Informed
              │
         Low Power
    Low Interest    High Interest
```

| Stakeholder | Role | Power | Interest | Strategy | Communication |
|------------|------|:-----:|:--------:|----------|---------------|
| | | H/M/L | H/M/L | Collaborate/Manage/Inform/Monitor | {frequency + channel} |
```

### 6.4 Process (REPLACE)

```markdown
### Process

1. Receive analysis results from PM Lead:
   - pm-discovery output (5-Step Discovery Chain + OST)
   - pm-strategy output (VP + Lean Canvas + Strategic Analysis)
   - pm-research output (Personas + Competitors + Market + Journey Map)
2. Create ICP from research synthesis
3. Create Competitive Battlecards (top 2 from competitor analysis)
4. Identify Growth Loops
5. Perform Beachhead Segment analysis (existing)
6. Design GTM Strategy (existing)
7. Synthesize into PRD 8-section (existing)
8. Run Pre-mortem on completed PRD
9. Generate User Stories from PRD features
10. Generate Job Stories from JTBD analysis
11. Derive Test Scenarios from User Stories
12. Create Stakeholder Map
13. Write complete PRD to `docs/00-pm/{feature}.prd.md`
```

### 6.5 Attribution (REPLACE)

```markdown
### Attribution

Based on frameworks from [pm-skills](https://github.com/phuryn/pm-skills) by Pawel Huryn (MIT License):
- create-prd: 8-section PRD template
- beachhead-segment: Geoffrey Moore, *Crossing the Chasm*
- gtm-strategy: Product Compass methodology
- ideal-customer-profile: ICP from research data
- competitive-battlecard: Sales-ready competitive comparison
- growth-loops: Product-led and sales-led growth mechanisms
- pre-mortem: Gary Klein, prospective hindsight technique
- user-stories: 3C (Card, Conversation, Confirmation) + INVEST criteria
- job-stories: Alan Klement, *When Coffee and Kale Compete*
- test-scenarios: BDD-style (Given/When/Then) from user stories
- stakeholder-map: Mendelow's Power/Interest matrix
```

---

## 7. Detailed Design: templates/pm-prd.template.md

### 7.1 New Sections to ADD

After existing `### 1.4 Recommended Experiments`, add:

```markdown
### 1.5 Key Assumptions & Risk Prioritization

| # | Assumption | Category | Impact | Risk | Score | Action |
|---|-----------|----------|--------|------|-------|--------|
| 1 | {assumption} | {8-category} | {1-5} | {1-5} | {score} | {test/monitor/accept} |
```

After existing `### 2.2 Lean Canvas`, add:

```markdown
### 2.3 Strategic Analysis

#### SWOT
| | Helpful | Harmful |
|---|---------|---------|
| **Internal** | Strengths: {list} | Weaknesses: {list} |
| **External** | Opportunities: {list} | Threats: {list} |

#### Additional Analysis (if applicable)
{PESTLE, Porter's 5, Pricing — context-dependent sections}
```

After existing `### 3.3 Market Sizing`, add:

```markdown
### 3.4 Customer Journey Map

| Stage | Touchpoint | Actions | Emotions | Pain Points | Opportunities |
|-------|-----------|---------|----------|-------------|---------------|
```

After existing `### 4.2 GTM Strategy`, add:

```markdown
### 4.3 Ideal Customer Profile (ICP)

| Attribute | Details |
|-----------|---------|

### 4.4 Competitive Battlecards

{Top 2 competitor comparison tables}

### 4.5 Growth Loops

{Product-led and sales-led growth tables}
```

After existing `### 5.8 Release Plan`, add:

```markdown
### 5.9 Pre-mortem

| # | Failure Mode | Category | Likelihood | Impact | Prevention |
|---|-------------|----------|:----------:|:------:|-----------|

### 5.10 User Stories

| ID | User Story | Priority | Acceptance Criteria |
|----|-----------|----------|-------------------|

### 5.11 Job Stories

| ID | When (Situation) | I want to (Motivation) | So I can (Outcome) |
|----|-----------------|----------------------|-------------------|

### 5.12 Test Scenarios

| ID | Story Ref | Scenario | Steps | Expected Result |
|----|-----------|----------|-------|----------------|

### 5.13 Stakeholder Map

| Stakeholder | Power | Interest | Strategy |
|------------|:-----:|:--------:|----------|
```

### 7.2 Attribution Update

```markdown
## Attribution

This PRD was generated by bkit PM Agent Team.
Frameworks based on [pm-skills](https://github.com/phuryn/pm-skills) by Pawel Huryn (MIT License).

- Opportunity Solution Tree: Teresa Torres, *Continuous Discovery Habits*
- Brainstorm & Assumptions: Multi-perspective ideation + 8-category risk assessment
- Value Proposition: JTBD 6-Part (Pawel Huryn & Aatir Abdul Rauf)
- Lean Canvas: Ash Maurya
- SWOT/PESTLE/Porter's: Strategic analysis frameworks
- Beachhead Segment: Geoffrey Moore, *Crossing the Chasm*
- GTM Strategy: Product Compass methodology
- ICP & Battlecard: Sales-ready competitive tools
- Growth Loops: Product-led & sales-led mechanisms
- Pre-mortem: Gary Klein, prospective hindsight
- User Stories: 3C + INVEST (Ron Jeffries)
- Job Stories: Alan Klement
- Test Scenarios: BDD Given/When/Then
- Stakeholder Map: Mendelow's Power/Interest matrix
```

---

## 8. Detailed Design: agents/pm-lead.md

### 8.1 Quality Checklist (REPLACE)

```markdown
### Quality Checklist

Before delivering PRD, verify:

**Discovery (pm-discovery)**:
- [ ] 5-Step Chain completed (Brainstorm → Assumptions → Prioritize → Experiments → OST)
- [ ] OST has at least 3 opportunities with solutions
- [ ] Top assumptions identified and prioritized

**Strategy (pm-strategy)**:
- [ ] VP has all 6 parts filled
- [ ] Lean Canvas (or BMC) has all 9 sections
- [ ] SWOT analysis completed
- [ ] Additional frameworks run if context-appropriate

**Research (pm-research)**:
- [ ] 3 distinct personas created
- [ ] 5 competitors analyzed
- [ ] TAM/SAM/SOM estimated
- [ ] Customer Journey Map for primary persona

**PRD (pm-prd)**:
- [ ] ICP defined
- [ ] Beachhead segment selected with 4-criteria scoring
- [ ] GTM strategy includes channels + metrics
- [ ] PRD 8 sections complete
- [ ] Pre-mortem completed (top 3 risks identified)
- [ ] User Stories generated (INVEST checked)
- [ ] Test Scenarios derived
- [ ] Attribution included
```

### 8.2 Delivery Message (REPLACE)

```markdown
PM Agent Team 분석 완료!

PRD: docs/00-pm/{feature}.prd.md

포함된 분석:
- 5-Step Discovery Chain + Opportunity Solution Tree (Discovery)
- Value Proposition + Lean Canvas + SWOT + Strategic Analysis (Strategy)
- User Personas x3 + Competitors x5 + Market Sizing + Journey Map (Research)
- ICP + Beachhead + GTM + Battlecards + Growth Loops (Go-To-Market)
- PRD 8-section + Pre-mortem + User Stories + Test Scenarios + Stakeholder Map (Execution)

다음 단계: /pdca plan {feature}
(PRD가 Plan 문서에 자동 참조됩니다)
```

---

## 9. Implementation Order

| Step | File | Changes | Est. Lines Added |
|:----:|------|---------|:----------------:|
| 1 | `agents/pm-discovery.md` | Frontmatter + 5 frameworks + chain process + output | +120 |
| 2 | `agents/pm-strategy.md` | Frontmatter + 6 frameworks + selection guide + output | +130 |
| 3 | `agents/pm-research.md` | Frontmatter + 3 frameworks + output | +60 |
| 4 | `agents/pm-prd.md` | Frontmatter + 8 frameworks + process + output | +150 |
| 5 | `templates/pm-prd.template.md` | 7 new sections + attribution update | +60 |
| 6 | `agents/pm-lead.md` | Quality checklist + delivery message update | +20 |
| **Total** | **6 files** | | **+540 lines** |

---

## 10. Test Plan

### 10.1 Verification Method

| Type | Target | Method |
|------|--------|--------|
| Gap Analysis | Design vs Implementation | `gap-detector` agent |
| Structural | Frontmatter YAML validity | Manual read |
| Content | Framework completeness | pm-skills 원본 SKILL.md와 대조 |
| Integration | `/pdca pm {feature}` full run | End-to-end 실행 |

### 10.2 Test Cases

- [ ] pm-discovery가 5단계 체인 출력을 생성하는가
- [ ] pm-strategy가 SWOT을 항상 포함하는가
- [ ] pm-strategy가 PESTLE을 B2B일 때만 포함하는가
- [ ] pm-research가 Journey Map을 출력하는가
- [ ] pm-prd가 User Stories + Test Scenarios를 생성하는가
- [ ] pm-prd.template.md의 신규 섹션이 올바른 위치에 있는가
- [ ] pm-lead가 확장된 Quality Checklist를 사용하는가
- [ ] Attribution이 모든 에이전트에 포함되어 있는가

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-21 | Initial design — 6개 파일 상세 변경 사양 | bkit PDCA |
