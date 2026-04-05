# PRD: Skill Evolution — Auditable Self-Learning for bkit

> **PM Agent Team Analysis** | Generated: 2026-04-03
> **Feature**: skill-evolution
> **Project**: bkit (Vibecoding Kit) v2.0.9
> **Project Level**: Enterprise

---

## Executive Summary

| Perspective | Description |
|-------------|-------------|
| **Problem** | bkit's 37 skills are static — they do not learn from the recurring patterns, metric degradations, or user suggestions collected across multiple PDCA cycles. Users manually create skills for problems they keep encountering, losing the compounding value of iterative AI development. |
| **Solution** | A 3-module Skill Evolution system (Pattern Miner + Skill Synthesizer + Evolution Tracker) that mines existing PDCA data sources, auto-generates skill candidates with full evidence trails, and tracks skill effectiveness through a human-approved lifecycle. |
| **Functional UX Effect** | After Report phase completion, Pattern Miner surfaces skill candidates with evidence ("M7 dropped 3 times at Do phase" or "5 users suggested similar btw improvements"). User approves with one command. New skills deploy for the next PDCA cycle. |
| **Core Value** | Auditable Skill Evolution — unlike blackbox self-learning (Hermes), every proposed skill has traceable evidence, human approval gates, eval verification, and audit logs. The AI gets smarter, but the human stays in control. |

---

## Table of Contents

1. [Discovery Analysis](#1-discovery-analysis)
2. [Strategy Analysis](#2-strategy-analysis)
3. [Market Research](#3-market-research)
4. [Product Requirements](#4-product-requirements)
5. [Beachhead Segment & GTM](#5-beachhead-segment--gtm)
6. [User Stories & Test Scenarios](#6-user-stories--test-scenarios)
7. [Pre-mortem & Risk Analysis](#7-pre-mortem--risk-analysis)
8. [Stakeholder Map & Success Metrics](#8-stakeholder-map--success-metrics)

---

## 1. Discovery Analysis

### 1.1 Brainstorm: Pain Points of Static Skill Sets

| # | Pain Point | Evidence | Severity |
|---|-----------|----------|----------|
| P1 | Same gap types recur across features but no automated detection | gap-detector reports show M7 (Convention Compliance) drops repeatedly at Do phase | High |
| P2 | btw suggestions accumulate but only cluster on manual `/btw analyze` | `.bkit/btw-suggestions.json` grows without automatic skill extraction | High |
| P3 | Skills created manually miss patterns visible only across PDCA history | quality-history.json time series unused for proactive skill generation | Medium |
| P4 | No feedback loop from deployed skills back to skill improvement | Skills have eval.yaml but no production effectiveness measurement | Medium |
| P5 | Enterprise teams run 10+ PDCA cycles but each starts from the same skill set | No skill inheritance from past cycles' learnings | High |
| P6 | Audit logs collect decision data but never feed into skill proposals | `.bkit/audit/*.jsonl` is write-only with no read-back intelligence | Low |
| P7 | Skill deprecation is entirely manual — stale skills pollute the namespace | No automated detection of low-impact or outdated skills | Medium |

### 1.2 Assumptions (Prioritized by Impact x Risk)

| # | Assumption | Impact | Risk | Priority |
|---|-----------|--------|------|----------|
| A1 | Users who run 3+ PDCA cycles on the same project will benefit from auto-generated skills | 9 | 3 | **27 — Critical** |
| A2 | Pattern mining across btw suggestions can reliably identify skill candidates | 8 | 5 | **40 — Critical** |
| A3 | Users will trust AI-proposed skills if evidence is transparent | 9 | 4 | **36 — Critical** |
| A4 | Auto-generated eval.yaml will be sufficient quality to validate synthesized skills | 7 | 6 | **42 — High Risk** |
| A5 | Metric degradation patterns (e.g., M7 drops at Do phase) correlate with missing skills | 8 | 5 | **40 — Critical** |
| A6 | Human approval gate will not create friction that makes users ignore proposals | 7 | 4 | **28 — Important** |
| A7 | Generated skills will be compatible with the existing 2-layer skill loader | 6 | 2 | **12 — Low** |

### 1.3 Experiment Design for Top Assumptions

**Experiment E1 — Pattern Occurrence Threshold** (validates A1, A2):
- Mine 5 existing bkit projects' btw-suggestions.json
- Count recurring patterns (similarity >= 0.7)
- Success: 60%+ of projects have 3+ clusterable patterns

**Experiment E2 — Evidence Trust** (validates A3):
- Present 10 skill proposals with evidence vs. 10 without to 5 users
- Measure approval rate and confidence score
- Success: Evidence-backed proposals get 2x approval rate

**Experiment E3 — Metric Correlation** (validates A5):
- Analyze quality-history.json across 20+ PDCA cycles
- Identify metric drops that preceded manual skill creation
- Success: 70%+ of manually created skills map to prior metric anomalies

### 1.4 Opportunity Solution Tree

```
[Desired Outcome]
bkit skills improve automatically from PDCA cycle data
|
+-- [Opportunity 1] Recurring gap patterns across features
|   +-- [Solution 1a] Pattern Miner: gap-type frequency analysis
|   +-- [Solution 1b] Cross-feature gap correlation engine
|   +-- [Solution 1c] Phase-specific gap clustering (Do vs Check)
|
+-- [Opportunity 2] Unused btw suggestion clusters
|   +-- [Solution 2a] Auto-clustering via NLP similarity
|   +-- [Solution 2b] Extend /btw analyze with skill proposal output
|   +-- [Solution 2c] Threshold-based auto-suggestion (3+ similar)
|
+-- [Opportunity 3] Metric degradation signals
|   +-- [Solution 3a] Moving average anomaly detection on M1-M10
|   +-- [Solution 3b] Phase-metric correlation (M7 drops at Do)
|   +-- [Solution 3c] Trend-based proactive skill proposals
|
+-- [Opportunity 4] Skill lifecycle management
|   +-- [Solution 4a] Effectiveness tracking (before/after metrics)
|   +-- [Solution 4b] Auto-deprecation flagging for low-impact skills
|   +-- [Solution 4c] Skill versioning with improvement history
|
+-- [Opportunity 5] Knowledge transfer across projects
|   +-- [Solution 5a] Cross-project pattern aggregation (user-scope)
|   +-- [Solution 5b] Team skill sharing via marketplace
|   +-- [Solution 5c] Anonymized community pattern pool
```

### 1.5 Selected Solutions (Prioritized)

| Priority | Solution | Maps to Opportunity | Effort | Impact |
|----------|----------|--------------------| -------|--------|
| P0 | Pattern Miner with 3 pattern types (gap, metric, btw) | O1 + O2 + O3 | Medium | Very High |
| P0 | Skill Synthesizer using existing generator.js | O1 + O2 | Medium | Very High |
| P1 | Evolution Tracker with lifecycle state machine | O4 | Medium | High |
| P1 | Auto-deprecation detection | O4 | Low | Medium |
| P2 | Cross-project pattern aggregation | O5 | High | Medium |

---

## 2. Strategy Analysis

### 2.1 JTBD 6-Part Value Proposition

| Part | Content |
|------|---------|
| **1. Situation** | A developer/team runs multiple PDCA cycles on the same project using bkit. Over time, they notice the same types of gaps recurring: convention violations in Do phase, API contract mismatches, missing error handling patterns. |
| **2. Motivation** | They want their tooling to get smarter from these patterns — to learn that "this project always needs X at Do phase" and proactively provide that guidance. |
| **3. Desired Outcome** | When I complete a PDCA Report phase, I want the system to surface actionable skill proposals based on evidence from my past cycles, so I do not have to manually track patterns or create skills for recurring problems. |
| **4. Hire Criteria** | The solution must: (a) be evidence-based (show me WHY this skill is proposed), (b) require my approval before activation, (c) integrate with existing skill infrastructure, (d) measurably improve quality metrics. |
| **5. Current Alternatives** | Manual `/btw analyze` + manual `skill-create`. Requires user to remember patterns and take initiative. Also: Hermes self-learning (blackbox, no audit trail), Cursor rules (static, manually written), Windsurf memories (implicit, no evidence). |
| **6. Switching Triggers** | (a) Third time fixing the same gap type → "I should not have to do this again." (b) btw suggestions list grows past 20 → "Nobody is reading these." (c) New team member makes same mistakes → "The tooling should have caught this." |

### 2.2 Lean Canvas

| Block | Content |
|-------|---------|
| **Problem** | 1. Skills are static despite rich PDCA data collection. 2. Manual skill creation has high friction. 3. No feedback loop from skill usage to skill improvement. |
| **Customer Segments** | Primary: bkit power users (3+ PDCA cycles/project). Secondary: Enterprise teams with shared skill sets. Early adopter: Solo developers who iterate frequently. |
| **Unique Value Proposition** | "Your PDCA cycles make bkit smarter — with evidence you can verify." Auditable skill evolution where every proposal has traceable evidence, human gates, and measured impact. |
| **Solution** | Pattern Miner (mines 3 data sources) + Skill Synthesizer (generates via existing pipeline) + Evolution Tracker (lifecycle + effectiveness measurement). |
| **Channels** | bkit CLI post-Report trigger, `/pdca next` suggestions, btw-suggestions threshold alerts. |
| **Revenue Streams** | Included in bkit core (open source). Enterprise value: reduced PDCA cycle time, higher Match Rate over time, reduced manual skill creation effort. |
| **Cost Structure** | Development: 3 new modules (~800-1200 LOC). Maintenance: Pattern thresholds tuning. Risk: False positive proposals consuming user attention. |
| **Key Metrics** | Skills proposed per project, approval rate, post-deployment metric improvement, PDCA cycle time reduction over time. |
| **Unfair Advantage** | bkit already collects the data (M1-M10, btw, audit logs, gap analysis) AND has the skill creation pipeline (generator.js, validator.js, eval framework). Competitors would need to build both from scratch. |

### 2.3 SWOT Analysis

| | Positive | Negative |
|---|---------|----------|
| **Internal** | **Strengths**: Existing data pipeline (M1-M10 metrics, btw suggestions, audit logs), existing skill creation infrastructure (generator.js + validator.js + eval framework), established Agent Skills standard compatibility, 37 skills proving the model works | **Weaknesses**: No ML/NLP capabilities built-in (pattern mining uses heuristics), single-developer project with limited testing resources, pattern quality depends on data volume (cold start problem), complex multi-module integration surface |
| **External** | **Opportunities**: Agent Skills standard adopted by 16+ tools (cross-platform portability), growing demand for AI tooling that improves over time, enterprise market values auditability and governance, Hermes validates the concept but leaves governance gap | **Threats**: Cursor/Windsurf may add evidence-based learning, GitHub Copilot custom instructions evolving rapidly, Hermes could add audit trails to close the gap, users may not run enough cycles to generate meaningful patterns |

**SO Strategy** (Strengths x Opportunities): Leverage existing data infrastructure + Agent Skills standard to position as the only auditable skill evolution system in the market.

**WT Strategy** (Weaknesses x Threats): Address cold start via seed patterns from community, mitigate competition by focusing on transparency/governance differentiator.

### 2.4 Strategic Positioning Map

```
                    Transparent/Auditable
                           ^
                           |
           bkit Skill      |
           Evolution ****  |
                           |
     Static ---------------+--------------- Adaptive
                           |
              Cursor Rules |   Windsurf
                      *    |   Memories *
                           |
              GitHub       |   Hermes
              Copilot *    |   Self-Learning *
                           |        Devin *
                           v
                    Opaque/Blackbox
```

bkit Skill Evolution uniquely occupies the **Adaptive + Transparent** quadrant. No competitor currently combines automated learning with full evidence trails and human approval gates.

---

## 3. Market Research

### 3.1 User Personas

#### Persona 1: Solo Developer ("Minjun")

| Attribute | Detail |
|-----------|--------|
| **Role** | Freelance full-stack developer |
| **Experience** | 3 years, uses bkit on 2-3 client projects simultaneously |
| **PDCA Usage** | Runs 4-6 PDCA cycles per project |
| **Core JTBD** | "When I'm switching between projects, I want the tooling to remember what worked on each project so I don't repeat mistakes." |
| **Pain Points** | Same gap types recur across projects; manually runs `/btw analyze` but rarely acts on results; forgets to create skills from recurring patterns |
| **Behavior** | Approves proposals quickly if evidence is clear. Values time savings over control granularity. Would use "approve all low-risk" bulk action. |
| **Success Metric** | Reduce recurring gap count by 50% over 3 PDCA cycles |

#### Persona 2: Team Lead ("Soyeon")

| Attribute | Detail |
|-----------|--------|
| **Role** | Engineering team lead at a startup (5 developers) |
| **Experience** | 7 years, adopted bkit for team-wide PDCA standardization |
| **PDCA Usage** | Team runs 8-12 PDCA cycles/month across 4 microservices |
| **Core JTBD** | "When new team members join, I want the tooling to encode our team's learned conventions so they don't repeat mistakes we already solved." |
| **Pain Points** | New developers hit the same gaps senior developers already fixed; team conventions exist in docs but not in skills; no way to measure if skills are actually helping |
| **Behavior** | Reviews proposals carefully before approval. Wants team-wide skill deployment. Would export skills across repositories. |
| **Success Metric** | New developer onboarding gap rate reduced by 40% |

#### Persona 3: Enterprise Architect ("Jaehyun")

| Attribute | Detail |
|-----------|--------|
| **Role** | Platform architect at enterprise company (50+ developers) |
| **Experience** | 12 years, evaluating bkit for org-wide adoption |
| **PDCA Usage** | Oversees 20+ projects using bkit, evaluates tooling ROI |
| **Core JTBD** | "When evaluating AI development tooling, I need to ensure any 'learning' system has full auditability, governance controls, and measurable impact on our quality metrics." |
| **Pain Points** | Cannot adopt Hermes-style blackbox learning due to compliance requirements; needs evidence trail for every AI-generated artifact; must demonstrate ROI to management |
| **Behavior** | Requires admin approval flow, audit log integration, and metric dashboards. Would only adopt if evolution proposals have >80% accuracy. |
| **Success Metric** | Demonstrable quality improvement (M1 match rate +5%p) with full audit compliance |

### 3.2 Competitive Analysis

#### Competitor 1: Hermes Agent Self-Learning (Nous Research)

| Dimension | Detail |
|-----------|--------|
| **Mechanism** | Creates procedural skill documents (agentskills.io standard) from experience. Skills improve during use via self-evaluation loop. Multi-level memory hierarchy mimics human procedural learning. |
| **Strengths** | Fully automatic, no user intervention needed. Cross-session memory persistence. Open source (MIT). Growing community adoption. |
| **Weaknesses** | Blackbox learning — user cannot see WHY a skill was created. No evidence trail or approval gate. No quality metrics integration. No eval framework for generated skills. |
| **Differentiation from bkit** | Hermes optimizes for autonomy; bkit optimizes for transparency. Hermes is a general agent; bkit is specialized for software development PDCA cycles. |

#### Competitor 2: Cursor AI Memory & Rules

| Dimension | Detail |
|-----------|--------|
| **Mechanism** | Static rules system (.cursor/rules/*.mdc) with project, user, team, and agent scopes. Adaptive complexity system (4 levels). No automatic rule generation — all manually authored. |
| **Strengths** | Well-integrated into IDE workflow. Team rules via dashboard. Progressive loading (only pay for relevant rules). Large user base. |
| **Weaknesses** | Rules are entirely static — user must write them manually. No learning from usage patterns. No evidence-based suggestions. No lifecycle management. |
| **Differentiation from bkit** | Cursor stores rules; bkit evolves skills. Cursor requires manual authoring; bkit auto-proposes from data. Cursor has no eval framework. |

#### Competitor 3: Windsurf Memories

| Dimension | Detail |
|-----------|--------|
| **Mechanism** | Implicit memory system that "learns your architecture patterns and coding conventions after ~48 hours of use." Memories are facts persisted across sessions. Automatic + manual creation. |
| **Strengths** | Low friction — learns passively. Rules + Memories separation (standards vs. facts). Context engine tracks coding patterns. |
| **Weaknesses** | Implicit learning means user cannot trace WHY something was learned. No structured skill format. No effectiveness measurement. No deprecation mechanism for stale memories. |
| **Differentiation from bkit** | Windsurf learns implicitly; bkit learns explicitly with evidence. Windsurf memories are unstructured facts; bkit skills are Agent Skills standard with eval. |

#### Competitor 4: Devin Learned Behaviors (Cognition)

| Dimension | Detail |
|-----------|--------|
| **Mechanism** | Knowledge and Playbook system where Devin learns codebase patterns over time. Reinforcement Learning from iterative feedback. Gets better with every task via experience accumulation. |
| **Strengths** | Most sophisticated learning — uses actual RL. Compounding advantage over time. Full-stack autonomy. Enterprise-grade (SOC2). |
| **Weaknesses** | Fully autonomous — no granular human control over what it learns. Proprietary, closed source. $500/month pricing. Cannot export learned behaviors. Not a plugin — requires full platform adoption. |
| **Differentiation from bkit** | Devin is a replacement for developers; bkit augments developers. Devin's learning is internal RL; bkit's learning is data-driven with evidence. bkit is open source and plugin-based. |

#### Competitor 5: GitHub Copilot Custom Instructions & Skills

| Dimension | Detail |
|-----------|--------|
| **Mechanism** | Repository-level .github/copilot-instructions.md + organization-level custom instructions. Agent skills (.agent.md files). /init command auto-generates instructions from workspace analysis. |
| **Strengths** | Largest market share. Organization-wide instruction management. Auto-generation via /init. Part of GitHub ecosystem. Free for open source. |
| **Weaknesses** | Auto-generation is one-time (not continuous learning). No feedback loop from usage. No quality metrics integration. No lifecycle management. Instructions are static after generation. |
| **Differentiation from bkit** | Copilot generates instructions once; bkit evolves skills continuously. Copilot has no PDCA data integration. Copilot lacks evidence trails for generated instructions. |

### 3.3 Competitive Feature Matrix

| Feature | bkit Skill Evolution | Hermes | Cursor | Windsurf | Devin | Copilot |
|---------|:-------------------:|:------:|:------:|:--------:|:-----:|:-------:|
| Auto skill generation | Yes (proposed) | Yes | No | Partial | Yes | One-time |
| Evidence trail | **Full** | None | N/A | None | None | N/A |
| Human approval gate | **Yes** | No | N/A | No | No | N/A |
| Eval framework | **Yes** | No | No | No | No | No |
| Quality metrics integration | **Yes (M1-M10)** | No | No | No | Partial | No |
| Skill lifecycle mgmt | **Full** | Partial | No | No | Implicit | No |
| Audit logging | **Yes (JSONL)** | No | No | No | SOC2 | No |
| Cross-project learning | Planned (P2) | Yes | Per-user rules | Per-user | Per-org | Per-org |
| Open standard (agentskills) | **Yes** | Yes | No | No | No | Yes |
| Open source | **Yes** | Yes | No | No | No | No |

### 3.4 Market Sizing (TAM/SAM/SOM)

**Method 1: Top-Down (Developer Compensation Approach)**

| Metric | Value | Rationale |
|--------|-------|-----------|
| **TAM** (Total Addressable Market) | **$8.5B** (2026) | Global AI coding assistant market per industry estimates. 28M professional developers x avg $300/yr AI tooling spend. |
| **SAM** (Serviceable Available Market) | **$340M** | 4% of developers use structured development methodologies (PDCA/Agile with AI-native tooling). ~1.1M developers x $300/yr. |
| **SOM** (Serviceable Obtainable Market) | **$3.4M** | 1% of SAM in first 2 years. ~11,000 active bkit users x avg value $300/yr (time saved from automated skill evolution). |

**Method 2: Bottom-Up (bkit User Base Approach)**

| Metric | Value | Rationale |
|--------|-------|-----------|
| **TAM** | **$7.4B** | AI developer tools market (Mordor Intelligence, 26.6% CAGR to $24B by 2030). |
| **SAM** | **$148M** | 2% of market = developers using plugin-based AI development frameworks with iterative quality cycles. |
| **SOM** | **$2.2M** | Current bkit install base trajectory x feature premium. ~7,500 power users running 3+ PDCA cycles x $300/yr productivity value. |

**Dual-Method Average**: TAM ~$8B, SAM ~$244M, SOM ~$2.8M

### 3.5 Customer Journey Map (Primary Persona: Minjun)

```
Phase:     AWARENESS          CONSIDERATION         ADOPTION            EXPANSION           ADVOCACY
           |                  |                     |                   |                   |
Touchpoint: btw suggestions   /pdca report shows    First skill         3+ auto-generated   Blog post about
            accumulate to     "skill candidates     proposal approved   skills deployed     "how my bkit
            20+ items         available" message    and deployed        across project      learned my patterns"
           |                  |                     |                   |                   |
Feeling:   Frustrated that    Intrigued that the    Cautiously          Surprised that      Proud that the
           nobody reads       system noticed        optimistic —        M1 improved by      system genuinely
           these suggestions  patterns              evidence is clear   3%p after skills    got smarter
           |                  |                     |                   |                   |
Action:    Ignores or runs    Reads proposal with   `/evolve approve    Runs `/evolve       Shares skill set
           /btw analyze       evidence, compares    skill-name`         status` to see      with team, writes
           occasionally       to own experience                         effectiveness       feedback
           |                  |                     |                   |                   |
Pain:      "Why doesn't the  "Is this accurate?    "Will this break    "How do I know      "Can I export
           system use these?" Will it slow me down?" anything?"         which skills help?" these for other
                                                                                           projects?"
           |                  |                     |                   |                   |
Metric:    btw count > 20    Proposal read rate    Approval rate       Metric delta        NPS, skill
                             (target: 80%)         (target: 60%)       (target: +3%p M1)   export count
```

---

## 4. Product Requirements

### 4.1 ICP (Ideal Customer Profile)

| Dimension | Specification |
|-----------|--------------|
| **User Type** | Developer or team lead using bkit for iterative AI-native development |
| **Minimum Usage** | 3+ completed PDCA cycles on the same project |
| **Project Level** | Dynamic or Enterprise (Starter excluded — insufficient data volume) |
| **Data Availability** | At least one of: btw-suggestions.json (5+ entries), quality-history.json (3+ data points), gap analysis results (2+ analyses) |
| **Mindset** | Values transparency and auditability over full automation |
| **Anti-ICP** | Users who want blackbox self-learning (Hermes), users running single PDCA cycles, users who never review btw suggestions |

### 4.2 Beachhead Segment

**Selected Segment**: Solo bkit power users running 3+ PDCA cycles on a single project (Persona: Minjun)

**4-Criteria Scoring**:

| Criterion | Score (1-5) | Rationale |
|-----------|:-----------:|-----------|
| **Urgency** | 5 | They already feel the pain of recurring gaps and unused btw suggestions |
| **Accessibility** | 5 | Already using bkit CLI daily — evolution triggers integrate naturally into existing workflow |
| **Payoff** | 4 | Time saved from automated skill creation is immediately measurable |
| **Leverage** | 4 | Success stories from solo users drive team adoption ("it learned my patterns in 3 cycles") |
| **Total** | **18/20** | |

**Why not Team Leads first**: Teams require admin approval flows, cross-repository skill sharing, and access control — features that add complexity beyond the core pattern-mining value. Solo users validate the core loop (mine → propose → approve → measure) with minimal governance overhead.

### 4.3 Functional Requirements

#### FR-01: Pattern Miner (`lib/evolution/pattern-miner.js`)

| ID | Requirement | Priority | Acceptance Criteria |
|----|------------|----------|-------------------|
| FR-01.1 | Mine gap-type frequency from analysis documents | P0 | Detects gap types recurring 3+ times across features |
| FR-01.2 | Detect metric degradation patterns from quality-history.json | P0 | Identifies M1-M10 metrics that drop at specific PDCA phases |
| FR-01.3 | Cluster btw suggestions by semantic similarity | P0 | Groups suggestions with similarity >= 0.7 into candidates |
| FR-01.4 | Output structured pattern objects with evidence array | P0 | Each pattern includes: type, occurrences, evidence[], confidence score |
| FR-01.5 | Support configurable thresholds (min occurrences, similarity) | P1 | Thresholds configurable via bkit.config.json or environment |
| FR-01.6 | Cross-feature pattern aggregation | P1 | Identifies patterns that span multiple features in the same project |

#### FR-02: Skill Synthesizer (`lib/evolution/skill-synthesizer.js`)

| ID | Requirement | Priority | Acceptance Criteria |
|----|------------|----------|-------------------|
| FR-02.1 | Transform Pattern Miner output into generator.js input | P0 | Produces valid {name, classification, description} objects |
| FR-02.2 | Auto-classify skills based on pattern type | P0 | Gap patterns -> workflow skills, metric patterns -> capability skills |
| FR-02.3 | Generate eval.yaml from pattern evidence | P0 | eval.yaml includes criteria derived from the pattern's evidence |
| FR-02.4 | Validate generated skills via validator.js | P0 | All generated skills pass existing validator.js checks |
| FR-02.5 | Write skill to staging area (not directly to skills/) | P1 | Skills go to `.bkit/evolution/staging/` until approved |
| FR-02.6 | Generate human-readable proposal with evidence summary | P0 | Each proposal shows: pattern type, occurrences, evidence, proposed skill preview |

#### FR-03: Evolution Tracker (`lib/evolution/tracker.js`)

| ID | Requirement | Priority | Acceptance Criteria |
|----|------------|----------|-------------------|
| FR-03.1 | Track skill lifecycle states | P0 | States: proposed -> approved -> deployed -> measured -> improved/deprecated |
| FR-03.2 | Measure skill effectiveness via before/after metric comparison | P1 | Compare M1-M10 deltas from 3 cycles before vs. 3 cycles after skill deployment |
| FR-03.3 | Auto-flag low-impact skills for deprecation | P1 | Skills with <2%p metric improvement after 5 cycles flagged as deprecation candidates |
| FR-03.4 | Store evolution history in `.bkit/evolution/history.json` | P0 | FIFO with configurable max entries (default: 200) |
| FR-03.5 | Integrate with audit-logger.js for all state transitions | P0 | Every state change logged via writeAuditLog() with category 'evolution' |
| FR-03.6 | Provide effectiveness dashboard data | P2 | Export data suitable for bkit-app visualization (read-only monitor) |

#### FR-04: Trigger Integration

| ID | Requirement | Priority | Acceptance Criteria |
|----|------------|----------|-------------------|
| FR-04.1 | Auto-trigger Pattern Mining on Report phase completion | P0 | After `/pdca report` completes, Pattern Miner runs automatically |
| FR-04.2 | Manual trigger via `/evolve mine` command | P0 | Users can explicitly trigger pattern mining at any time |
| FR-04.3 | `/evolve status` shows current evolution state | P0 | Displays: pending proposals, deployed skills, effectiveness metrics |
| FR-04.4 | `/evolve approve <skill>` activates a proposed skill | P0 | Moves skill from staging to skills/, updates tracker state |
| FR-04.5 | `/evolve reject <skill>` with reason | P1 | Records rejection reason in tracker for pattern refinement |
| FR-04.6 | btw suggestion threshold trigger (20+ suggestions) | P1 | When btw-suggestions.json exceeds 20 entries, suggest mining |

### 4.4 Non-Functional Requirements

| ID | Requirement | Priority |
|----|------------|----------|
| NFR-01 | Pattern mining must complete within 10 seconds for projects with <100 PDCA data points | P0 |
| NFR-02 | Zero false positives at confidence <0.6 — proposals below threshold are suppressed | P0 |
| NFR-03 | All evolution actions must be logged to audit trail (JSONL) | P0 |
| NFR-04 | Generated skills must be valid Agent Skills standard (agentskills.io) format | P0 |
| NFR-05 | Cold start graceful degradation — system operates normally with <3 PDCA cycles (just produces no proposals) | P0 |
| NFR-06 | Evolution data stored in `.bkit/evolution/` — separate from core state | P1 |
| NFR-07 | No external API calls required — all pattern mining is local | P0 |

### 4.5 Architecture Overview

```
                                    +-----------------------+
                                    |   Report Phase Done   |
                                    |  (trigger event)      |
                                    +-----------+-----------+
                                                |
                                                v
+------------------+    +-------------------+    +--------------------+
| Data Sources     |    | Pattern Miner     |    | Skill Synthesizer  |
|                  +--->| (pattern-miner.js)|+-->| (skill-synth.js)   |
| btw-suggestions  |    |                   |    |                    |
| quality-history  |    | Pattern A: Gaps   |    | generator.js call  |
| gap analysis     |    | Pattern B: Metrics|    | validator.js check |
| audit logs       |    | Pattern C: BTW    |    | eval.yaml gen      |
+------------------+    +-------------------+    +--------+-----------+
                                                          |
                              +---------------------------+
                              |
                              v
+------------------+    +-------------------+    +--------------------+
| Evolution        |    | Staging Area      |    | User Approval      |
| Tracker          |<---| .bkit/evolution/  |<---| /evolve approve    |
| (tracker.js)     |    | staging/          |    | /evolve reject     |
|                  |    +-------------------+    +--------------------+
| lifecycle mgmt   |              |
| effectiveness    |              v (on approve)
| audit logging    |    +-------------------+
+------------------+    | skills/ directory |
                        | (2-layer loader)  |
                        +-------------------+
```

### 4.6 Data Flow

```
1. Report Phase Completes
   |
2. Pattern Miner reads:
   |- .bkit/btw-suggestions.json        (Pattern C: 3+ similar suggestions)
   |- .bkit/state/quality-history.json   (Pattern B: metric degradation at phase)
   |- docs/03-analysis/*.analysis.md     (Pattern A: recurring gap types)
   |- .bkit/audit/*.jsonl                (supplementary: decision patterns)
   |
3. Patterns scored (confidence = occurrences * evidence_strength * recency_weight)
   |
4. Patterns above threshold (confidence >= 0.6) -> Skill Synthesizer
   |
5. Skill Synthesizer:
   |- Calls generator.js with {name, classification, description}
   |- Generates eval.yaml from pattern evidence
   |- Calls validator.js to verify structure
   |- Writes to .bkit/evolution/staging/{skill-name}/
   |
6. User notified: "3 skill proposals available. Run /evolve status to review."
   |
7. User approves/rejects via /evolve approve|reject {skill-name}
   |
8. On approve:
   |- Skill moved from staging/ to skills/{skill-name}/
   |- Tracker records: proposed -> approved -> deployed
   |- Audit log: evolution_skill_deployed
   |
9. After 3+ PDCA cycles with skill deployed:
   |- Tracker compares before/after M1-M10 metrics
   |- If delta < 2%p improvement: flag for deprecation review
   |- Audit log: evolution_effectiveness_measured
```

---

## 5. Beachhead Segment & GTM

### 5.1 GTM Strategy

**Phase 1: Core Loop (Month 1-2)**
- Ship Pattern Miner + Skill Synthesizer + Evolution Tracker as `lib/evolution/`
- Add `/evolve` skill with mine, status, approve, reject commands
- Trigger integration with `/pdca report` completion
- Target: Solo bkit power users (beachhead)

**Phase 2: Evidence & Trust (Month 3-4)**
- Publish "Skill Evolution in Action" case study from dogfooding on bkit itself
- Add confidence visualization to proposals (evidence count, pattern age, metric correlation)
- Implement btw suggestion threshold trigger
- Target: Expand to team leads

**Phase 3: Team & Enterprise (Month 5-6)**
- Add admin approval flow for team-deployed skills
- Cross-repository skill aggregation (user-scope patterns)
- Effectiveness dashboard data for bkit-app
- Target: Enterprise adoption

### 5.2 Channels

| Channel | Purpose | Metric |
|---------|---------|--------|
| Post-Report trigger | Primary discovery — users see proposals after every Report | Proposal view rate |
| `/pdca next` suggestion | Secondary — when system has pending proposals | Click-through rate |
| btw threshold alert | Urgency trigger — "20+ suggestions unclustered" | Mining trigger rate |
| bkit-marketplace | Distribution — evolved skills as shareable packages | Skill download count |
| GitHub README / CHANGELOG | Awareness — feature announcement | Star growth rate |

### 5.3 Battlecards

#### vs. Hermes Self-Learning

| Dimension | Hermes | bkit Skill Evolution |
|-----------|--------|---------------------|
| **Learning approach** | Blackbox procedural memory | Evidence-based pattern mining |
| **Human control** | None — fully autonomous | Approval gate on every proposal |
| **Audit trail** | None | Full JSONL audit log |
| **Eval framework** | None — no quality verification | Auto-generated eval.yaml per skill |
| **Win message** | "Your skills evolve WITH evidence you can verify, not behind a blackbox you have to trust." |

#### vs. Cursor Rules

| Dimension | Cursor | bkit Skill Evolution |
|-----------|--------|---------------------|
| **Rule creation** | Manual authoring | Auto-proposed from PDCA data |
| **Learning** | Static — never changes | Continuous — proposes after each Report |
| **Effectiveness tracking** | None | Before/after metric comparison |
| **Win message** | "Your rules write themselves — backed by data from your own PDCA cycles, not guesswork." |

#### vs. Windsurf Memories

| Dimension | Windsurf | bkit Skill Evolution |
|-----------|----------|---------------------|
| **Memory type** | Implicit facts | Structured Agent Skills standard |
| **Evidence** | None — "learned after 48 hours" | Full evidence chain per proposal |
| **Portability** | Windsurf-only | agentskills.io (16+ tools) |
| **Win message** | "Know exactly WHAT was learned and WHY — and take your skills to any tool that supports Agent Skills." |

### 5.4 Growth Loops

```
Loop 1: Data Flywheel
More PDCA cycles -> More patterns detected -> Better skill proposals ->
Higher Match Rate -> Faster PDCA cycles -> More cycles completed -> [repeat]

Loop 2: Quality Ratchet
Skills deployed -> M1-M10 improve -> Effectiveness proven ->
More skills approved -> Compound quality improvement -> [repeat]

Loop 3: Community Flywheel (Phase 3)
User generates evolved skill -> Shares to marketplace ->
Other users adopt -> Provide feedback -> Skill improves -> [repeat]
```

---

## 6. User Stories & Test Scenarios

### 6.1 User Stories

| ID | Story | INVEST Check | Priority |
|----|-------|-------------|----------|
| US-01 | As a bkit user who completed a Report phase, I want to see skill proposals based on recurring patterns so that I don't have to manually track and create skills. | I: Independent (post-Report trigger), N: ~400 LOC, V: Reduces manual skill creation, E: Uses existing generator.js, S: 3 acceptance criteria, T: Testable via mock data | P0 |
| US-02 | As a bkit user reviewing a skill proposal, I want to see the evidence (which gaps recurred, which metrics dropped, which btw suggestions matched) so that I can make an informed approval decision. | I: Depends on US-01 output, N: ~200 LOC proposal renderer, V: Builds trust, E: Pattern data already structured, S: Evidence display format, T: Testable via snapshot | P0 |
| US-03 | As a bkit user, I want to approve or reject skill proposals with a single command so that the approval process does not disrupt my workflow. | I: CLI command, N: ~150 LOC, V: Low friction, E: Move file + update tracker, S: approve/reject flow, T: Verify file locations after command | P0 |
| US-04 | As a bkit user who deployed evolved skills, I want to see effectiveness metrics (before/after comparison) so that I know if the skills are actually helping. | I: Post-deployment measurement, N: ~300 LOC, V: Closes feedback loop, E: Uses existing metrics-collector, S: 3-cycle measurement window, T: Mock metric comparison | P1 |
| US-05 | As a bkit user, I want skills with low effectiveness to be automatically flagged for deprecation so that my skill set stays lean and effective. | I: Tracker logic, N: ~100 LOC, V: Prevents skill bloat, E: Threshold-based check, S: <2%p improvement after 5 cycles, T: Testable via mock history | P1 |
| US-06 | As a bkit user, I want all evolution actions logged to the audit trail so that I can trace the full history of how my skill set evolved. | I: Cross-cutting concern, N: ~50 LOC (audit integration), V: Compliance + transparency, E: Uses existing audit-logger, S: All state transitions logged, T: Verify JSONL entries | P0 |

### 6.2 Test Scenarios

| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| TS-01 | Pattern Mining — Gap Frequency | 1. Create 3 analysis docs with same gap type "missing-error-handling". 2. Run Pattern Miner. | Output includes pattern with type: "gap_frequency", occurrences: 3, confidence >= 0.6 |
| TS-02 | Pattern Mining — Metric Degradation | 1. Populate quality-history.json with M7 drops at Do phase across 3 cycles. 2. Run Pattern Miner. | Output includes pattern with type: "metric_degradation", metric: "M7", phase: "do" |
| TS-03 | Pattern Mining — BTW Clustering | 1. Add 5 similar btw suggestions about "add TypeScript strict mode". 2. Run Pattern Miner. | Output includes pattern with type: "btw_cluster", suggestions: 5, similarity >= 0.7 |
| TS-04 | Skill Synthesis | 1. Feed Pattern Miner output to Skill Synthesizer. 2. Check staging directory. | Valid SKILL.md + eval.yaml in `.bkit/evolution/staging/{name}/` |
| TS-05 | Approval Flow | 1. Stage a skill. 2. Run `/evolve approve skill-name`. | Skill moved to `skills/`, tracker shows "deployed", audit log entry created |
| TS-06 | Rejection Flow | 1. Stage a skill. 2. Run `/evolve reject skill-name --reason "not relevant"`. | Skill removed from staging, tracker shows "rejected" with reason, audit log entry |
| TS-07 | Cold Start | 1. Empty data sources. 2. Run Pattern Miner. | Returns empty array. No errors. Status shows "Insufficient data for pattern mining." |
| TS-08 | Effectiveness Measurement | 1. Deploy skill. 2. Run 3 PDCA cycles. 3. Check tracker. | Tracker shows before/after metric deltas. If delta < 2%p, flagged for deprecation. |
| TS-09 | Audit Integration | 1. Approve a skill. 2. Read today's audit log. | JSONL entry with action: "evolution_skill_deployed", category: "evolution" |
| TS-10 | Report Phase Trigger | 1. Complete `/pdca report feature`. | Pattern Miner runs automatically. If proposals found, user sees "N skill proposals available." |

---

## 7. Pre-mortem & Risk Analysis

### 7.1 Pre-mortem: "Skill Evolution Failed After 6 Months"

| Risk | Likelihood | Impact | Mitigation |
|------|:----------:|:------:|-----------|
| **R1: Low-quality proposals erode trust** — Pattern mining produces irrelevant skill candidates that users reject >80% of the time. Users stop reading proposals entirely. | High | Critical | Set conservative initial thresholds (confidence >= 0.7). Track approval rate. If <40%, tighten thresholds automatically. Show confidence score prominently. |
| **R2: Cold start — insufficient data** — Most bkit users run 1-2 PDCA cycles, not 3+. Pattern Miner never activates for majority of users. Feature appears "dead." | High | High | Provide seed patterns from community/bkit-itself. Lower threshold for btw suggestions (3+ instead of 5+). Add manual `/evolve mine` for eager users. Show "data needed for X more cycles" progress indicator. |
| **R3: Generated skills are syntactically valid but semantically wrong** — Skills pass validator.js but their guidance is inaccurate or misleading when actually used. | Medium | Critical | eval.yaml generated from evidence — not just structure checks. Human approval gate is the safety net. Add "trial mode" where skill runs in shadow mode for 1 cycle before full deployment. |

### 7.2 SWOT-Based Risk Strategies

**SO (Strength-Opportunity) — Pursue**:
- Leverage existing 10-metric quality pipeline as the core data source for pattern mining
- Position as the first tool to combine Agent Skills standard + automated evidence-based evolution
- Use PDCA Report as natural trigger point (zero additional user action required)

**WT (Weakness-Threat) — Defend**:
- Invest in seed pattern library to address cold start before competitors catch up
- Keep pattern mining heuristic-based (no ML dependency) to maintain simplicity and auditability
- Monitor Cursor/Windsurf for evidence-based learning features quarterly

---

## 8. Stakeholder Map & Success Metrics

### 8.1 Stakeholder Map

| Stakeholder | Interest | Influence | Engagement Strategy |
|-------------|----------|-----------|-------------------|
| bkit users (solo developers) | Direct beneficiary — less manual skill creation | High (primary users) | Beta testing, feedback loop, case studies |
| bkit users (team leads) | Team skill standardization, onboarding acceleration | High (expansion segment) | Admin approval flow, team sharing features |
| Enterprise architects | Compliance, auditability, ROI demonstration | Medium (future segment) | Audit trail documentation, metric dashboards |
| bkit maintainers | Code complexity, maintenance burden | High (implementation) | Modular architecture (3 separate files), comprehensive tests |
| Agent Skills community | Standard adoption, cross-tool compatibility | Low (indirect) | Ensure generated skills are standard-compliant |
| Competitor users (Hermes/Cursor) | May evaluate switching for transparency | Low (potential users) | Comparison content, migration guides |

### 8.2 Success Metrics

| Metric | Target (3 months) | Target (6 months) | Measurement Method |
|--------|:-----------------:|:-----------------:|-------------------|
| Pattern detection rate | 60% of projects with 3+ cycles produce proposals | 75% | Count projects with proposals / total eligible projects |
| Proposal approval rate | 50% | 65% | Approved / (approved + rejected) |
| Post-deployment metric improvement (M1 delta) | +2%p | +4%p | Average M1 delta 3 cycles after skill deployment |
| PDCA cycle time reduction | -5% | -10% | Average M10 delta after skill deployment |
| Skills auto-deprecated | 0 (no skills old enough yet) | <20% of deployed | Deprecated / total deployed |
| User engagement (evolve commands/month) | 3 per active user | 5 per active user | CLI command telemetry |
| False positive rate | <40% rejected | <30% rejected | Rejected / total proposed |

### 8.3 OKR Alignment

**Objective**: Make bkit the first AI development tool that demonstrably improves from project-specific patterns with full auditability.

| Key Result | Owner | Timeline |
|------------|-------|----------|
| KR1: Ship Pattern Miner + Skill Synthesizer + Evolution Tracker | Dev | Month 1-2 |
| KR2: 60% of eligible projects produce at least 1 skill proposal | Dev + QA | Month 3 |
| KR3: Deployed evolved skills show +2%p M1 improvement on average | QA | Month 4-6 |
| KR4: 0 audit compliance gaps in evolution action trail | Dev | Month 2 (continuous) |

---

## Attribution

This PRD was generated by the **PM Agent Team** using integrated frameworks from:

- **Discovery**: Opportunity Solution Tree (Teresa Torres, "Continuous Discovery Habits")
- **Strategy**: JTBD 6-Part Value Proposition (Pawel Huryn) + Lean Canvas (Ash Maurya) + SWOT Analysis
- **Research**: User Personas with JTBD, Competitive Feature Matrix, TAM/SAM/SOM Dual-Method
- **Execution**: ICP + Beachhead (Geoffrey Moore, "Crossing the Chasm") + GTM Strategy + Battlecards + Growth Loops

PM frameworks sourced from [pm-skills](https://github.com/phuryn/pm-skills) by Pawel Huryn (MIT License).

Research Sources:
- [Hermes Agent — Nous Research](https://hermes-agent.nousresearch.com/)
- [Cursor AI Deep Dive 2026](https://dasroot.net/posts/2026/02/cursor-ai-deep-dive-technical-architecture-advanced-features-best-practices/)
- [Windsurf Rules & Workflows](https://www.paulmduvall.com/using-windsurf-rules-workflows-and-memories/)
- [Devin AI Guide 2026](https://aitoolsdevpro.com/ai-tools/devin-guide/)
- [GitHub Copilot Custom Instructions](https://docs.github.com/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot)
- [Agent Skills Standard](https://agentskills.io/home)
- [AI Developer Tools Market 2025-2030](https://virtuemarketresearch.com/report/ai-developer-tools-market)
- [AI Coding Assistant Market Statistics 2026](https://bayelsawatch.com/ai-coding-assistant-statistics/)
