---
template: pm-prd
version: 2.0
description: PM Agent Team PRD output template. Combines 5-Step Discovery, Strategic Analysis, Market Research, GTM, PRD 8-section, and Execution deliverables.
variables:
  - feature: Feature name
  - date: Creation date (YYYY-MM-DD)
  - author: Author
---

# {feature} - Product Requirements Document

> **Date**: {date}
> **Author**: {author}
> **Method**: bkit PM Agent Team (based on pm-skills by Pawel Huryn, MIT)
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | {Core problem in 1-2 sentences} |
| **Solution** | {Proposed solution in 1-2 sentences} |
| **Target User** | {Primary user segment} |
| **Core Value** | {Why this matters} |

---

## 1. Opportunity Discovery

### 1.1 Desired Outcome

{Measurable business/product outcome}

### 1.2 Brainstormed Ideas (Top 5)

| # | Idea | Perspective | Rationale |
|---|------|-------------|-----------|

### 1.3 Opportunity Solution Tree

```
Outcome: {desired outcome}
├── Opportunity 1: {customer need/pain}
│   ├── Solution A: {approach}
│   └── Solution B: {approach}
├── Opportunity 2: {customer need/pain}
│   ├── Solution C: {approach}
│   └── Solution D: {approach}
└── Opportunity 3: {customer need/pain}
    └── Solution E: {approach}
```

### 1.4 Prioritized Opportunities

| # | Opportunity | Importance | Satisfaction | Score |
|---|------------|:----------:|:------------:|:-----:|
| 1 | {opportunity} | {0-1} | {0-1} | {score} |

### 1.5 Key Assumptions & Risk Prioritization

| # | Assumption | Category | Impact | Risk | Score | Action |
|---|-----------|----------|:------:|:----:|:-----:|--------|

### 1.6 Recommended Experiments

| # | Tests Assumption | Method | Success Criteria | Effort |
|---|-----------------|--------|-----------------|:------:|

---

## 2. Value Proposition & Strategy

### 2.1 JTBD Value Proposition (6-Part)

| Part | Content |
|------|---------|
| **Who** | {target customer segment} |
| **Why** | {core problem, JTBD} |
| **What Before** | {current situation, existing solutions} |
| **How** | {how product solves the problem} |
| **What After** | {improved outcome} |
| **Alternatives** | {competitive alternatives, why choose us} |

**Value Proposition Statement**: {1-2 sentence summary}

### 2.2 Lean Canvas

| Section | Content |
|---------|---------|
| **Problem** | {top 3 problems} |
| **Solution** | {top 3 features} |
| **UVP** | {unique value proposition} |
| **Unfair Advantage** | {defensibility} |
| **Customer Segments** | {target segments} |
| **Channels** | {acquisition channels} |
| **Revenue Streams** | {revenue model} |
| **Cost Structure** | {key costs} |
| **Key Metrics** | {north star + supporting metrics} |

### 2.3 SWOT Analysis

| | Helpful | Harmful |
|---|---------|---------|
| **Internal** | Strengths: {list} | Weaknesses: {list} |
| **External** | Opportunities: {list} | Threats: {list} |

**SO Strategy**: {leverage strengths for opportunities}
**WT Strategy**: {mitigate weaknesses against threats}

### 2.4 Additional Strategic Analysis (if applicable)

{PESTLE, Porter's Five Forces, Pricing Strategy, Ansoff Matrix — context-dependent}

---

## 3. Market Research

### 3.1 User Personas

#### Persona 1: {name} (Primary)

| Attribute | Details |
|-----------|---------|
| **Demographics** | {age, role, context} |
| **Primary JTBD** | {core job to be done} |
| **Pain Points** | 1. {pain} 2. {pain} 3. {pain} |
| **Desired Gains** | 1. {gain} 2. {gain} 3. {gain} |
| **Unexpected Insight** | {counterintuitive finding} |
| **Product Fit** | {how product addresses needs} |

#### Persona 2: {name}

{same structure}

#### Persona 3: {name}

{same structure}

### 3.2 Competitive Landscape

| Competitor | Strengths | Weaknesses | Our Opportunity |
|-----------|-----------|------------|-----------------|

**Differentiation Strategy**: {key differentiators to emphasize}

### 3.3 Market Sizing

| Metric | Current Estimate | 3-Year Projection |
|--------|:---------------:|:-----------------:|
| **TAM** | {total addressable market} | {projection} |
| **SAM** | {serviceable addressable} | {projection} |
| **SOM** | {serviceable obtainable} | {projection} |

**Key Assumptions**: {numbered list of critical assumptions}

### 3.4 Customer Journey Map (Primary Persona)

| Stage | Touchpoint | Actions | Emotions | Pain Points | Opportunities |
|-------|-----------|---------|----------|-------------|---------------|
| Awareness | | | | | |
| Consideration | | | | | |
| Decision | | | | | |
| Onboarding | | | | | |
| Usage | | | | | |
| Advocacy | | | | | |

**Moments of Truth**: {key moments}

---

## 4. Go-To-Market

### 4.1 Beachhead Segment

| Criteria | Score (1-5) | Evidence |
|----------|:-----------:|---------|
| Burning Pain | {score} | {evidence} |
| Willingness to Pay | {score} | {evidence} |
| Winnable Share | {score} | {evidence} |
| Referral Potential | {score} | {evidence} |

**Primary Beachhead**: {selected segment}
**90-Day Acquisition Plan**: {key actions}

### 4.2 GTM Strategy

| Element | Details |
|---------|---------|
| **Channels** | {primary acquisition channels} |
| **Messaging** | {core message for beachhead segment} |
| **Success Metrics** | {KPIs and targets} |
| **Launch Timeline** | Pre-launch / Launch / Post-launch phases |

### 4.3 Ideal Customer Profile (ICP)

| Attribute | Details |
|-----------|---------|
| Industry/Vertical | {specific industry} |
| Company Size | {employees, revenue} |
| Role/Title | {decision maker + end user} |
| Primary JTBD | {core job} |
| Budget Range | {willingness to pay} |

### 4.4 Competitive Battlecards

| Category | Us | {Competitor 1} | {Competitor 2} |
|----------|-----|----------------|----------------|
| Positioning | | | |
| Key Strength | | | |
| Key Weakness | | | |
| Price | | | |
| Best For | | | |

### 4.5 Growth Loops

| Loop Type | Trigger | Action | Output | Metric |
|-----------|---------|--------|--------|--------|

---

## 5. Product Requirements (PRD)

### 5.1 Summary

{2-3 sentence product summary}

### 5.2 Background & Context

{Why now? What changed? What became possible?}

### 5.3 Objectives & Key Results

| Objective | Key Result | Target |
|-----------|-----------|--------|
| {objective} | {measurable KR} | {target value} |

### 5.4 Market Segments

{Target segments defined by problems/JTBD, not demographics}

### 5.5 Value Propositions

{Customer jobs, gains, pains solved - reference Section 2.1}

### 5.6 Solution (Key Features)

| Feature | Description | Priority | Addresses |
|---------|-------------|----------|-----------|
| {feature} | {description} | Must/Should/Could | {which opportunity/pain} |

### 5.7 Assumptions & Risks

| # | Assumption | Category | Confidence | Validation Method |
|---|-----------|----------|:----------:|-------------------|

### 5.8 Release Plan

| Phase | Scope | Timeframe |
|-------|-------|-----------|
| v1 (MVP) | {core features} | {relative timeframe} |
| v2 | {enhancements} | {relative timeframe} |

---

## 6. Execution Deliverables

### 6.1 Pre-mortem

| # | Failure Mode | Category | Likelihood | Impact | Prevention Strategy |
|---|-------------|----------|:----------:|:------:|-------------------|

**Top 3 Risks**: {risks to address before v1}

### 6.2 User Stories

| ID | User Story | Priority | Acceptance Criteria (Given/When/Then) |
|----|-----------|:--------:|--------------------------------------|

### 6.3 Job Stories

| ID | When (Situation) | I want to (Motivation) | So I can (Outcome) |
|----|-----------------|----------------------|-------------------|

### 6.4 Test Scenarios

| ID | Story Ref | Scenario | Steps | Expected Result | Priority |
|----|-----------|----------|-------|----------------|:--------:|

### 6.5 Stakeholder Map

| Stakeholder | Role | Power | Interest | Strategy |
|------------|------|:-----:|:--------:|----------|

---

## Attribution

This PRD was generated by bkit PM Agent Team.
Frameworks based on [pm-skills](https://github.com/phuryn/pm-skills) by Pawel Huryn (MIT License).

- Opportunity Solution Tree: Teresa Torres, *Continuous Discovery Habits*
- Brainstorm & Assumptions: Multi-perspective ideation + 8-category risk assessment (4 Product + 4 GTM)
- Value Proposition: JTBD 6-Part (Pawel Huryn & Aatir Abdul Rauf)
- Lean Canvas: Ash Maurya
- SWOT/PESTLE/Porter's: Strategic analysis frameworks
- Beachhead Segment: Geoffrey Moore, *Crossing the Chasm*
- GTM Strategy: Product Compass methodology
- ICP & Battlecard: Sales-ready competitive tools
- Growth Loops: Product-led & sales-led mechanisms
- Pre-mortem: Gary Klein, prospective hindsight
- User Stories: 3C + INVEST (Ron Jeffries)
- Job Stories: Alan Klement, *When Coffee and Kale Compete*
- Test Scenarios: BDD Given/When/Then
- Stakeholder Map: Mendelow's Power/Interest matrix
