# Anthropic Future Direction & Roadmap Analysis

> **Research Date**: 2026-03-01
> **Researcher**: Strategy Analyst (bkit v1.5.8 CTO Team)
> **Purpose**: Inform bkit's long-term customization strategy by understanding Anthropic's trajectory

---

## Executive Summary

Anthropic is executing a **platform transformation** — evolving Claude Code from a standalone CLI coding assistant into an extensible enterprise development platform. Five strategic pillars define this transformation:

1. **Plugin/Skills Ecosystem** — Open standard SKILL.md format, cross-platform portability, private enterprise marketplaces, 270,000+ skills available across platforms
2. **Enterprise Controls** — Managed settings, organization-level policies, BYOK encryption (H1 2026), macOS plist/Windows Registry enforcement
3. **Multi-Agent Architecture** — Agent Teams (experimental), background agents, Remote Control (mobile/web access), Cowork for knowledge workers
4. **Memory & Context** — Auto-memory (MEMORY.md), PreCompact hooks, worktree isolation, 1M context window (Opus 4.6)
5. **Security & Sandboxing** — OS-level bash sandboxing (84% fewer prompts), Claude Code Security (500+ vulns found in open-source), HTTP hooks for enterprise integration

**Key Implication for bkit**: Anthropic is building the *infrastructure layer* (hooks, agents, memory, plugins). bkit's value lies in the *orchestration and workflow layer* on top — PDCA processes, intent classification, Korean-first context engineering, team patterns. This positioning remains strong, but bkit must stay ahead of native capabilities that could subsume its features.

---

## 1. Feature Trajectory Analysis (v2.1.31 ~ v2.1.63)

### Investment Categories by Release Count

| Category | Releases with Changes | Trend | Direction |
|---|---|---|---|
| **Memory/Leak Fixes** | v2.1.47, v2.1.49, v2.1.50 (9 fixes), v2.1.63 (13 fixes) | **Accelerating** | Stability → Production-grade |
| **Agent Teams** | v2.1.47, v2.1.49, v2.1.50, v2.1.59 | **Growing** | Experimental → Stabilizing |
| **Hooks System** | v2.1.49 (ConfigChange), v2.1.50 (Worktree), v2.1.51 (HTTP security), v2.1.63 (HTTP hooks) | **Expanding** | 10 → 17 event types, 4 hook types |
| **Plugin Ecosystem** | v2.1.49 (settings.json), v2.1.51 (timeout/registry), v2.1.54 (PLUGIN_ROOT fix) | **Maturing** | Bug fixes → Infrastructure hardening |
| **Security** | v2.1.38, v2.1.51, Sandboxing (Feb 2026), Claude Code Security (Feb 2026) | **Major Investment** | Enterprise-grade security |
| **Skills** | v2.1.45, v2.1.47 (bare name fix), v2.1.51 (YAML crash fix) | **Stabilizing** | Open standard, cross-platform |
| **Memory Management** | v2.1.59 (auto-memory), v2.1.63 (worktree sharing) | **New Feature** | Automated, per-project |
| **Remote/Mobile** | v2.1.51, v2.1.58, v2.1.63, Remote Control (Feb 2026) | **Emerging** | CLI → Everywhere |
| **Worktree Isolation** | v2.1.49, v2.1.50, v2.1.53, v2.1.63 | **Growing** | Multi-workspace patterns |
| **Output Tokens** | v2.1.42, v2.1.45 | **Stable** | 32K default, 64K upper |

### Trajectory Summary

```
High Investment (Growing):
  Memory Stability ████████████████████ (22+ leak fixes across 4 releases)
  Security/Sandbox ██████████████████   (sandboxing, Claude Code Security, HTTP security)
  Agent Teams      ████████████████     (4 releases, stabilizing but still experimental)
  Hooks System     ███████████████      (17 events, 4 types: command/http/prompt/agent)

Medium Investment (Maturing):
  Plugin System    ███████████          (registry, timeout, settings.json, PLUGIN_ROOT)
  Skills           █████████            (open standard, marketplace, cross-platform)
  Remote/Mobile    █████████            (Remote Control GA, Cowork)

Stable (Maintenance):
  Output Styles    ████                 (no changes since v2.0.32 restore)
  CLI UX           ████                 (incremental improvements)
```

---

## 2. Anthropic's Strategic Direction (2026)

### 2.1 The Platform Play

Anthropic is compressing years of ecosystem development into months:

- **Plugin Marketplace**: Git-based, decentralized distribution. Private enterprise marketplaces for approved tools.
- **Skills Open Standard**: Published as cross-platform specification. Skills work across Claude Code, Claude Desktop, Cowork, and third-party agents. SkillHub reports 7,000+ AI-evaluated skills; SkillsMP reports 270,000+ agent skills.
- **Cowork**: Claude Code's agentic capabilities extended to knowledge workers beyond coding. Runs locally in isolated VM with MCP integrations. 12 new enterprise connectors (Google Workspace, DocuSign, etc.).
- **Claude Code on GitHub Copilot**: As of Feb 2026, Claude and Codex available for Copilot Business & Pro users, expanding Claude Code's reach.

### 2.2 Enterprise Strategy

Enterprise accounts for ~80% of Anthropic's revenue. Key enterprise features:

| Feature | Status | Timeline |
|---|---|---|
| Managed Settings (JSON) | **GA** | Available now |
| macOS plist / Windows Registry | **GA** | v2.1.51+ |
| Organization-level plugins | **GA** | Available now |
| Private plugin marketplace | **GA** | Feb 2026 |
| BYOK encryption | **Planned** | H1 2026 |
| SSO + SCIM provisioning | **GA** | Available now |
| Audit trails | **GA** | Available now |
| Claude Code Security | **Research Preview** | Feb 2026 |
| Sandboxing (filesystem+network) | **GA** | Feb 2026 |
| ConfigChange hook (auditing) | **GA** | v2.1.49+ |

### 2.3 The $2.5B ARR Signal

Claude Code has reached a **$2.5 billion annualized run rate** (doubled since start of 2026). 4% of all public GitHub commits are now authored by Claude Code. This demonstrates massive adoption and gives Anthropic strong incentive to invest in the ecosystem.

### 2.4 Anthropic's 2026 Agentic Coding Trends Report — 8 Trends

Anthropic's official report identifies these transformation patterns:

1. **Engineer as Orchestrator** — Shifting from writing code to coordinating agents
2. **Multi-Agent Coordination** — Parallel reasoning becoming standard practice
3. **Human-AI Collaboration** — AI used in ~60% of work, but only 0-20% fully delegated
4. **Background & Long-Running Agents** — Tasks lasting hours/days, not minutes
5. **Scaling Beyond Engineering** — Extending to domain experts (Cowork)
6. **Security as Core Architecture** — Embedded from inception, not bolted on
7. **AI-Automated Review** — Scaling human-agent oversight
8. **Enterprise Adoption Patterns** — Department-specific plugins, private marketplaces

---

## 3. Open GitHub Issues Analysis

### Critical Issues for bkit

| Issue | Title | State | Labels | bkit Impact | Resolution Likelihood |
|---|---|---|---|---|---|
| **#17688** | Skill-scoped hooks broken in plugins | OPEN | bug, area:tools, area:core | **CRITICAL** — bkit uses hooks extensively in plugin context | **Medium** — Root cause identified (community), unfixed since Jan 2026. Plugin `dI2` loader missing `cH5()` hook parsing. Multiple enterprise users frustrated. |
| **#25131** | Agent Teams lifecycle failures | OPEN | bug, perf:memory, **stale** | **HIGH** — bkit CTO Team pattern depends on Agent Teams | **Low-Medium** — Marked stale, no comments. Experimental feature, may be slowly addressed through incremental fixes. |
| **#29548** | ExitPlanMode skips approval (v2.1.63) | OPEN | bug, **regression** | **HIGH** — bkit uses plan mode agents (7 opus agents) | **High** — Regression with repro, typically fixed quickly. Has duplicate issues suggesting broad impact. |
| **#29547** | AskUserQuestion empty in plugin skills | OPEN | bug, area:skills, area:plugins | **HIGH** — bkit skills use AskUserQuestion | **Medium-High** — Root cause found (PreToolUse hook wildcard matcher corrupts input). Workaround exists (remove AskUserQuestion from allowed-tools). |
| **#29423** | Task subagents ignore CLAUDE.md | OPEN | bug, memory, area:agents | **MEDIUM** — Affects CTO Team subagent behavior | **Medium** — Clear issue description, straightforward fix (run config-loading for subagents). |
| **#29441** | Agent skills not preloaded for teammates | OPEN | bug, area:agents, area:skills | **MEDIUM** — CTO Team teammates need preloaded skills | **Medium** — Bug in Agent Teams, which remains experimental. |
| **#29520** | Plugin skills duplicated in system prompt | OPEN | bug, **duplicate**, area:plugins | **LOW** — Token waste but not functional breakage | **Medium** — Marked duplicate, may auto-close. |
| **#24130** | Auto memory not safe for concurrent agents | OPEN | bug, memory, **stale** | **MEDIUM** — CTO Team concurrent agents share memory | **Low** — Marked stale. Auto-memory is relatively new; may need architecture changes. |
| **#28379** | Slash commands not in Remote Control | OPEN | enhancement, area:claude-code-web | **LOW** — bkit skills/commands not usable via RC | **Medium** — Enhancement request, depends on RC roadmap. |

### Issue Pattern Analysis

```
Resolution Priority (estimated):
  1. #29548 (ExitPlanMode regression) — Likely next patch, critical regression
  2. #29547 (AskUserQuestion) — Has workaround, root cause known
  3. #17688 (Plugin hooks) — Longstanding, community frustrated, root cause found
  4. #29423 (Subagent CLAUDE.md) — Clear fix path
  5. #29441 (Agent skills preload) — Depends on Agent Teams maturity
  6. #25131 (Agent Teams lifecycle) — Stale, incremental approach
  7. #24130 (Memory concurrency) — Stale, needs architecture work
  8. #28379 (RC slash commands) — Enhancement, roadmap-dependent
```

---

## 4. What Anthropic Will Likely Build Natively

Based on trajectory analysis, these features are **highly likely** to become native:

### 4.1 Near-Term (Q1-Q2 2026)

| Feature | Evidence | bkit Overlap |
|---|---|---|
| **Stable Agent Teams** | 4 releases of improvements, official docs, growing adoption | bkit CTO Team pattern |
| **Plugin hooks fix (#17688)** | Community pressure, root cause known, enterprise demand | bkit hooks in plugin context |
| **Sandboxed autonomy** | GA launched Feb 2026, 84% fewer prompts | bkit permission management |
| **Better auto-memory** | Active development since v2.1.59, worktree sharing in v2.1.63 | bkit memory-store (JSON) |
| **ExitPlanMode fix** | Regression, will be patched | bkit plan mode agents |

### 4.2 Medium-Term (Q2-Q4 2026)

| Feature | Evidence | bkit Overlap |
|---|---|---|
| **Agent registry** | `claude agents` CLI added v2.1.50, #24316 requests custom agents as teammates | bkit 16 agent definitions |
| **Skill marketplace maturity** | 270K+ skills, open standard, SkillHub/SkillsMP ecosystems | bkit 27 skills |
| **HTTP hooks GA** | Added v2.1.63, enables webhook-based enterprise integrations | bkit hooks system |
| **Remote Control + slash commands** | RC GA Feb 2026, #28379 is enhancement request | bkit slash commands |
| **Background task scheduling** | Cowork has scheduled/recurring tasks, RC enables remote sessions | bkit automation workflows |
| **BYOK encryption** | Announced H1 2026 | N/A (enterprise only) |

### 4.3 Long-Term (2026+)

| Feature | Evidence | bkit Overlap |
|---|---|---|
| **Claude 5 model** | Predicted May-Sep 2026 (9-month cycle) | Better base capabilities for all features |
| **Agent-to-agent protocols** | Multi-agent coordination is top trend, Agent Teams expanding | bkit CTO Team orchestration |
| **Plugin-level managed settings** | settings.json support added v2.1.49, enterprise direction | bkit.config.json |
| **Cross-workspace state** | Worktree config sharing in v2.1.63 | bkit PDCA state management |
| **AI-automated code review** | Claude Code Security launched, 500+ vulns found | bkit code-review skills |

---

## 5. Industry Context: Context Engineering Landscape

### 5.1 Competitive Positioning

| Tool | Context Engineering Approach | Strengths | Gaps vs Claude Code |
|---|---|---|---|
| **Claude Code** | CLAUDE.md + skills + hooks + agents + auto-memory + plugins | Most extensible, open standard | Agent Teams still experimental |
| **Cursor** | .cursorrules, @-mentions, RAG-based | Best IDE integration, fast | No plugin system, limited automation |
| **GitHub Copilot** | .github/copilot-instructions.md, extensions | Widest distribution, multi-model | Less agentic, no hooks |
| **Cline** | .clinerules, MCP servers | Fully open source, model-agnostic | Smaller ecosystem |
| **RooCode** | .roo/rules, MCP boomerang pattern | Multi-agent orchestration | Niche, smaller community |
| **Codex** | AGENTS.md, sandboxed by default | Strong sandboxing, cloud-native | Newer, less mature ecosystem |

### 5.2 Where bkit Differentiates

Claude Code provides the **primitives** (hooks, agents, skills, memory). bkit provides the **orchestration**:

1. **Intent Classification** — Automatic routing of user requests to appropriate workflows
2. **PDCA Lifecycle** — Structured Plan-Do-Check-Act with document generation
3. **Korean-First Context Engineering** — 8-language support with Korean primary
4. **CTO Team Patterns** — Proven multi-agent orchestration patterns (3-8 agents)
5. **Quality Assurance Workflows** — Comprehensive test automation (754 TC, 100% pass)
6. **Phase-Based Development** — Structured SDLC phases with gate checks

These are **workflow patterns**, not infrastructure features. Anthropic is unlikely to build opinionated workflow layers that target specific development methodologies.

---

## 6. Implications for bkit Customization Layer Design

### 6.1 What bkit Should Build On (Stable Foundations)

These CC features are stable enough to depend on:

| Foundation | Stability | bkit Usage |
|---|---|---|
| **Hooks (command type)** | **Stable** — 17 events, GA since v2.0.x | Core dependency, 10/17 events used |
| **Skills (SKILL.md)** | **Stable** — Open standard, cross-platform | 27 skills, primary interface |
| **Agents (.claude/agents/)** | **Stable** — Project-level definitions work reliably | 16 agents |
| **CLAUDE.md** | **Stable** — Foundational, universal adoption | Project configuration |
| **Plugin system (plugin.json)** | **Stable** — GA, marketplace support | Distribution mechanism |
| **Output Styles** | **Stable** — Restored v2.0.32, no changes since | bkit learning/PDCA guides |
| **MCP integration** | **Stable** — Open protocol, growing ecosystem | bkend MCP tools |

### 6.2 What bkit Should Monitor (Evolving Features)

| Feature | Risk Level | Strategy |
|---|---|---|
| **Agent Teams** | **Medium** — Still experimental, env var required | Use but provide fallback to subagents |
| **Auto-memory (MEMORY.md)** | **Low** — Different from bkit JSON memory, no collision | Complement, don't compete |
| **HTTP hooks** | **Low** — Additive to command hooks, no breakage | Evaluate for webhook integrations |
| **Sandboxing** | **Low** — bkit doesn't use excluded sandbox features | Monitor for hook execution impact |
| **Remote Control** | **Low** — Enhancement opportunity when slash commands supported | Prepare for #28379 resolution |
| **ConfigChange hook** | **Low** — New event, additive | Evaluate for bkit.config.json monitoring |

### 6.3 What bkit Should NOT Build (CC Will Provide)

| Feature | Reason |
|---|---|
| Custom plugin marketplace | CC has private marketplace infrastructure |
| Agent discovery/registry CLI | `claude agents` command added v2.1.50 |
| Memory persistence format | Auto-memory MEMORY.md is becoming standard |
| Security scanning | Claude Code Security launched as dedicated product |
| Sandboxing/permission management | OS-level sandboxing is GA |
| Cross-platform skill format | SKILL.md is the open standard |

### 6.4 What bkit SHOULD Build (CC Won't Provide)

| Feature | Rationale |
|---|---|
| **PDCA workflow orchestration** | Opinionated methodology, not generic infrastructure |
| **Intent classification engine** | Domain-specific routing logic |
| **Korean-first context engineering** | Language/cultural customization |
| **CTO Team coordination patterns** | Proven multi-agent workflow templates |
| **Quality gate automation** | Domain-specific test/validation patterns |
| **Phase-based document generation** | Structured SDCA lifecycle management |
| **bkit.config.json abstraction** | Unified configuration above CC settings |
| **Impact analysis workflows** | Version-by-version CC compatibility analysis |
| **.bkit/ directory structure** | Local state management for workflows |

---

## 7. Risk Assessment

### 7.1 High-Impact Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| **Agent Teams API changes** | **High** (experimental) | Breaking CTO Team pattern | Abstract Agent Teams behind bkit orchestration layer; provide subagent fallback |
| **Plugin hooks bug (#17688) persists** | **Medium** | Limits bkit hook functionality in plugin context | Use project-level hooks.json as primary; plugin hooks as enhancement |
| **Skills format evolution** | **Low** | May require SKILL.md updates | Follow open standard spec, minimal custom extensions |
| **Auto-memory conflicts** | **Very Low** | bkit JSON vs CC MEMORY.md | Paths/formats completely separate, 0% collision risk |
| **CC subsumes bkit features** | **Very Low** | Reduced bkit value proposition | bkit's value is in workflow orchestration, not infrastructure |

### 7.2 Medium-Impact Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| **Claude 5 changes agent behavior** | **Medium** | May affect prompt engineering | Maintain test suite (754+ TC), rapid adaptation |
| **Enterprise managed settings restrict plugins** | **Medium** | May limit bkit in enterprise orgs | Ensure bkit works within managed settings framework |
| **Remote Control becomes primary interface** | **Low** | bkit slash commands not supported | Monitor #28379, prepare RC-compatible interface |
| **Cowork replaces some bkit workflows** | **Low** | Knowledge worker features overlap | Focus on developer-specific workflows |

### 7.3 Opportunity Risks (Missing Out)

| Opportunity | Window | Action |
|---|---|---|
| **HTTP hooks integration** | Now (v2.1.63+) | Evaluate for PDCA webhook notifications |
| **ConfigChange hook** | Now (v2.1.49+) | Use for bkit.config.json change detection |
| **Worktree isolation** | Now (v2.1.49+) | Integrate into CTO Team agent isolation |
| **Skills marketplace listing** | Q2 2026 | Publish bkit skills to marketplace for distribution |
| **Cross-platform skills** | 2026 | Ensure bkit skills follow open standard for portability |

---

## 8. Strategic Recommendations for bkit v1.5.8

### 8.1 Immediate (v1.5.8 Scope)

1. **Abstract Agent Teams usage** — Create orchestration layer that gracefully degrades to subagents if Agent Teams is unavailable
2. **Adopt .bkit/ directory** — Local state management that complements (not competes with) CC auto-memory
3. **Monitor #17688 closely** — If plugin hooks fix lands, leverage immediately; if not, keep using project-level hooks
4. **Document CTO Team patterns** — Formalize proven multi-agent patterns as reusable templates

### 8.2 Near-Term (v1.6.x)

1. **HTTP hooks evaluation** — Assess for PDCA webhook notifications and CI/CD integration
2. **ConfigChange hook adoption** — Monitor bkit.config.json changes in real-time
3. **Skills marketplace preparation** — Ensure bkit skills follow open standard for potential marketplace listing
4. **Worktree-aware PDCA** — Leverage worktree isolation for CTO Team agents

### 8.3 Long-Term (v2.x)

1. **Cross-platform skill portability** — Ensure bkit skills work beyond Claude Code (Codex, Copilot, etc.)
2. **Enterprise marketplace plugin** — Distribute bkit through CC private marketplace infrastructure
3. **Remote Control integration** — When #28379 is resolved, ensure bkit commands work via RC
4. **Claude 5 readiness** — Maintain comprehensive test suite for rapid model adaptation

---

## 9. Conclusion

Anthropic's direction validates bkit's positioning. The company is investing heavily in **infrastructure primitives** (hooks, agents, skills, memory, security, enterprise controls) while leaving the **workflow orchestration layer** open for customization. bkit occupies exactly this orchestration space.

The key strategic insight: **bkit should ride Anthropic's infrastructure investments, not compete with them.** Every improvement to Agent Teams, hooks, skills, and memory makes bkit's orchestration patterns more powerful. The risk is not that CC will replace bkit, but that bkit might not leverage new CC capabilities quickly enough.

**Priority order for bkit v1.5.8**:
1. Ensure compatibility with latest CC features (sandboxing, auto-memory, HTTP hooks)
2. Abstract Agent Teams behind orchestration layer for resilience
3. Design .bkit/ directory structure that complements CC's evolving memory/state management
4. Formalize CTO Team patterns as reusable, shareable templates
5. Prepare for Skills marketplace listing as distribution channel

---

## Sources

- [Claude Code Release Notes](https://releasebot.io/updates/anthropic/claude-code)
- [Claude Code and new admin controls for business plans](https://www.anthropic.com/news/claude-code-on-team-and-enterprise)
- [Claude Code Enterprise](https://claude.com/product/claude-code/enterprise)
- [Anthropic Developer Ecosystem Guide](https://claude-world.com/articles/anthropic-developer-ecosystem-complete-guide/)
- [Claude Code Plugin Ecosystem](https://medium.com/the-context-layer/claude-code-plugin-ecosystem-what-developers-need-to-know-about-the-latest-anthropic-release-55fb7a2b5aae)
- [Anthropic Expands Claude with Enterprise Plugins](https://www.ghacks.net/2026/02/25/anthropic-expands-claude-with-enterprise-plugins-and-marketplace/)
- [Context Engineering for Coding Agents (Martin Fowler)](https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html)
- [2026 Agentic Coding Trends Report (Anthropic)](https://resources.anthropic.com/2026-agentic-coding-trends-report)
- [Eight Trends Defining Software in 2026 (Claude Blog)](https://claude.com/blog/eight-trends-defining-how-software-gets-built-in-2026)
- [Claude Code Security (Anthropic)](https://www.anthropic.com/news/claude-code-security)
- [Claude Code Sandboxing (Anthropic)](https://www.anthropic.com/engineering/claude-code-sandboxing)
- [Claude Cowork Enterprise Plugins (TechCrunch)](https://techcrunch.com/2026/02/24/anthropic-launches-new-push-for-enterprise-agents-with-plugins-for-finance-engineering-and-design/)
- [Claude Code Remote Control (VentureBeat)](https://venturebeat.com/orchestration/anthropic-just-released-a-mobile-version-of-claude-code-called-remote)
- [Agent Teams Documentation](https://code.claude.com/docs/en/agent-teams)
- [Agent Skills Open Standard (Anthropic)](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- [Claude Code Hooks Guide](https://code.claude.com/docs/en/hooks-guide)
- [Claude Code Memory Documentation](https://code.claude.com/docs/en/memory)
- [GitHub Issue #17688 - Skill-scoped hooks in plugins](https://github.com/anthropics/claude-code/issues/17688)
- [GitHub Issue #25131 - Agent Teams lifecycle](https://github.com/anthropics/claude-code/issues/25131)
- [GitHub Issue #29548 - ExitPlanMode regression](https://github.com/anthropics/claude-code/issues/29548)
- [GitHub Issue #29547 - AskUserQuestion in plugin skills](https://github.com/anthropics/claude-code/issues/29547)
- [GitHub Issue #29423 - Task subagents ignore CLAUDE.md](https://github.com/anthropics/claude-code/issues/29423)
- [GitHub Issue #29441 - Agent skills not preloaded](https://github.com/anthropics/claude-code/issues/29441)
- [GitHub Issue #24130 - Memory concurrency](https://github.com/anthropics/claude-code/issues/24130)
- [GitHub Issue #28379 - Slash commands in Remote Control](https://github.com/anthropics/claude-code/issues/28379)
- [Best AI Coding Agents 2026 (Faros AI)](https://www.faros.ai/blog/best-ai-coding-agents-2026)
- [Claude Code $2.5B ARR (Semi Analysis)](https://newsletter.semianalysis.com/p/claude-code-is-the-inflection-point)
