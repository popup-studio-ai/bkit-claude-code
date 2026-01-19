# bkit Vibecoding Kit - Plugin Design Document

> **Goal**: Package the entire `.claude/` folder as a Claude Code plugin
> for single-command installation

> **Verification Status**: ✅ Verified against official documentation (2026-01-09)
>
> This document has been verified against Claude Code official plugin documentation.
> Plugin system is in **Public Beta** since October 9, 2025.

---

## 1. Plugin Feasibility Analysis

### 1.1 Conclusion: **Plugin Conversion Possible** (Minor restructuring required)

| Current Component | Count | Plugin Support | Migration Strategy |
|-------------------|-------|:--------------:|-------------------|
| **commands/** | 17 | ✅ Full support | Direct migration |
| **agents/** | 10 | ✅ Full support | Direct migration |
| **skills/** | 17 | ✅ Full support | Direct migration |
| **hooks** | 6 types | ✅ Supported | Convert to hooks/hooks.json |
| **instructions/** | 7 | ⚠️ Not supported | Integrate into skills |
| **templates/** | 12 | ⚠️ Not supported | Embed in skills |
| **docs/** | 27 | ⚠️ Not supported | Reference via skills or separate hosting |
| **settings.json** | 1 | ⚠️ Partial | hooks only (permissions not transferable) |

### 1.2 Official Plugin Structure vs Current .claude/ Structure

```
Official Plugin Structure          Current .claude/ Structure
=========================          ==========================
plugin-name/                       (new directory needed)
├── .claude-plugin/                (create new)
│   └── plugin.json  ←──────────── metadata only (NOT settings.json)
├── commands/        ←──────────── commands/ ✅
├── agents/          ←──────────── agents/ ✅
├── skills/          ←──────────── skills/ ✅
├── hooks/
│   └── hooks.json   ←──────────── settings.json hooks section
├── .mcp.json        ←──────────── .mcp.json (project root, optional)
└── README.md        ←──────────── docs/CLAUDE-CODE-MASTERY.md

(Not supported)      ←──────────── instructions/ (integrate into skills)
(Not supported)      ←──────────── templates/ (embed in skills)
(Not supported)      ←──────────── docs/ (handle separately)
```

### 1.3 Key Changes

#### 1.3.1 Command Namespacing

```
Current: /learn-claude-code
After plugin: /bkit:learn-claude-code

Current: /pdca-plan
After plugin: /bkit:pdca-plan
```

#### 1.3.2 Hooks Format Conversion

**Current (settings.json)**:
```json
{
  "hooks": {
    "PreToolUse": [{ "matcher": "Write", "hooks": [...] }]
  }
}
```

**Plugin (hooks/hooks.json)**:
```json
{
  "hooks": {
    "PreToolUse": [{ "matcher": "Write", "hooks": [...] }]
  }
}
```

(Format is identical, only file location changes)

---

## 2. Plugin Architecture Design

### 2.1 Plugin Directory Structure

```
bkit/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest (REQUIRED)
│
├── commands/                     # 17 commands (auto-discovered)
│   ├── learn-claude-code.md
│   ├── setup-claude-code.md
│   ├── upgrade-claude-code.md
│   ├── pdca-plan.md
│   ├── pdca-design.md
│   ├── pdca-analyze.md
│   ├── pdca-report.md
│   ├── pdca-status.md
│   ├── pdca-next.md
│   ├── pipeline-start.md
│   ├── pipeline-status.md
│   ├── pipeline-next.md
│   ├── init-starter.md
│   ├── init-dynamic.md
│   ├── init-enterprise.md
│   ├── upgrade-level.md
│   └── zero-script-qa.md
│
├── agents/                       # 10 agents (auto-discovered)
│   ├── starter-guide.md
│   ├── pipeline-guide.md
│   ├── bkend-expert.md
│   ├── enterprise-expert.md
│   ├── infra-architect.md
│   ├── code-analyzer.md
│   ├── design-validator.md
│   ├── gap-detector.md
│   ├── report-generator.md
│   └── qa-monitor.md
│
├── skills/                       # 17 + integrated skills
│   ├── starter/SKILL.md
│   ├── dynamic/SKILL.md
│   ├── enterprise/SKILL.md
│   ├── pdca-methodology/SKILL.md
│   ├── document-standards/SKILL.md
│   ├── analysis-patterns/SKILL.md
│   ├── ai-native-development/SKILL.md
│   ├── development-pipeline/SKILL.md
│   ├── monorepo-architecture/SKILL.md
│   ├── phase-1-schema/SKILL.md
│   ├── phase-2-convention/SKILL.md
│   ├── phase-3-mockup/SKILL.md
│   ├── phase-4-api/SKILL.md
│   ├── phase-5-design-system/SKILL.md
│   ├── phase-6-ui-integration/SKILL.md
│   ├── phase-7-seo-security/SKILL.md
│   ├── phase-8-review/SKILL.md
│   ├── phase-9-deployment/SKILL.md
│   ├── mobile-app/SKILL.md
│   ├── desktop-app/SKILL.md
│   ├── zero-script-qa/SKILL.md
│   │
│   ├── bkit-rules/SKILL.md       # [NEW] instructions/ integration
│   └── bkit-templates/SKILL.md   # [NEW] templates/ integration
│
├── hooks/
│   └── hooks.json                # Event hooks configuration
│
└── README.md                     # Installation/usage guide
```

### 2.2 plugin.json Design

> ⚠️ **IMPORTANT**: The `permissions` field is **NOT supported** in plugin.json.
> Permissions are managed in user's settings.json, not plugin manifest.

```json
{
  "name": "bkit",
  "version": "1.0.0",
  "description": "Vibecoding Kit - PDCA methodology + Claude Code mastery for rapid development",
  "author": {
    "name": "Popup Studio",
    "email": "contact@popup.studio",
    "url": "https://popup.studio"
  },
  "repository": "https://github.com/popup-studio-ai/bkit-claude-code",
  "license": "MIT",
  "keywords": [
    "vibecoding",
    "pdca",
    "development-pipeline",
    "baas",
    "fullstack",
    "ai-native"
  ]
}
```

**Supported plugin.json fields** (per official documentation):
| Field | Required | Description |
|-------|:--------:|-------------|
| `name` | ✅ | Plugin name (kebab-case, unique) |
| `version` | ❌ | Semantic version |
| `description` | ❌ | Plugin description |
| `author` | ❌ | Author info (name, email, url) |
| `repository` | ❌ | GitHub repository URL |
| `license` | ❌ | License type |
| `keywords` | ❌ | Search keywords |

**NOT supported in plugin.json**:
- ❌ `permissions` - User manages in their settings.json
- ❌ `claude.minVersion` - Not documented
- ❌ `homepage` - Use `repository` instead

### 2.3 hooks/hooks.json Design

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "bkit Vibecoding Kit activated. Use /bkit:learn-claude-code to start learning, or begin development directly. PDCA methodology is automatically applied.",
            "timeout": 5000
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "PDCA rule check: Verify if related design exists in docs/02-design/. Respond with your assessment.",
            "timeout": 10000
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "model": "sonnet",
            "prompt": "Pre-completion check: 1) All tasks completed 2) Design-implementation aligned 3) Documentation updated. Evaluate if Claude should stop.",
            "timeout": 15000
          }
        ]
      }
    ]
  }
}
```

**Supported Hook Events** (per official documentation):
| Event | Can Block | Description |
|-------|:---------:|-------------|
| `SessionStart` | ❌ | Session begins |
| `SessionEnd` | ❌ | Session ends |
| `PreToolUse` | ✅ | Before tool execution |
| `PostToolUse` | ❌ | After tool execution |
| `Stop` | ✅ | When Claude attempts to stop |
| `SubagentStop` | ✅ | When subagent attempts to stop |
| `UserPromptSubmit` | ✅ | When user submits prompt |
| `PreCompact` | ✅ | Before context compaction |
| `Notification` | ❌ | When notification occurs |

**⚠️ Stop/SubagentStop Hook Caution**:
- Do NOT request JSON format in Stop hooks
- Use natural language for evaluation
- Recommend `model: "sonnet"` (haiku may be unstable)

---

## 3. Component Format Specifications

### 3.1 Commands Format (commands/*.md)

```yaml
---
description: Command description (optional)
allowed-tools: Read, Grep, Bash(git:*)   # Optional - restrict available tools
argument-hint: [feature-name]             # Optional - argument placeholder
model: sonnet                             # Optional - model to use
---

Command instructions in markdown...
Use $ARGUMENTS for user input.
Use $1, $2 for positional arguments.
```

**Supported frontmatter fields**:
- `description`: string
- `allowed-tools`: comma-separated tool list
- `argument-hint`: string
- `model`: sonnet/opus/haiku

### 3.2 Agents Format (agents/*.md)

```yaml
---
name: agent-name
description: |
  When this agent should be invoked.
  Include trigger keywords for semantic matching.
model: sonnet                    # Optional (sonnet/opus/haiku/inherit)
tools: Read, Glob, Grep          # Optional - comma-separated or YAML list
skills: skill1, skill2           # Optional - skills to auto-load
permissionMode: default          # Optional
---

Agent system prompt and instructions...
```

### 3.3 Skills Format (skills/*/SKILL.md)

> ⚠️ **IMPORTANT Constraints**:
> - `name`: Maximum **64 characters**, lowercase letters/numbers/hyphens only
> - `description`: Maximum **1024 characters**
> - SKILL.md body: Recommended **under 500 lines**

```yaml
---
name: skill-name
description: |
  Brief description of what this skill does.
  Include trigger keywords for semantic matching.

  Triggers: keyword1, keyword2, 키워드, キーワード
allowed-tools: Read, Grep, Glob  # Optional - restrict tools
---

# Skill Content

Detailed instructions and knowledge...
Keep under 500 lines for optimal performance.
```

### 3.4 Path Portability

> ⚠️ **CRITICAL**: Always use `${CLAUDE_PLUGIN_ROOT}` for file references within plugins.

```bash
# ✅ Correct
${CLAUDE_PLUGIN_ROOT}/scripts/setup.sh
${CLAUDE_PLUGIN_ROOT}/references/guide.md

# ❌ Incorrect - will break after installation
/Users/kay/plugins/bkit/scripts/setup.sh
~/plugins/bkit/scripts/setup.sh
../shared-utils/helper.js
```

---

## 4. instructions/ Integration Strategy

### 4.1 Problem

Plugin official structure does not support `instructions/` folder.
Instructions are "always-on" rules, but plugins cannot inject them.

### 4.2 Solution: Integrate into bkit-rules skill + SessionStart Hook

**Approach 1: SessionStart Hook** (80% coverage)
```json
{
  "hooks": {
    "SessionStart": [{
      "hooks": [{
        "type": "prompt",
        "prompt": "[BKIT PDCA Core Rules]\n\n**Always apply**:\n- New feature request → Check docs/02-design/ → Design first\n- No guessing → Check docs if unsure → Ask questions\n- SoR: Code > CLAUDE.md > docs/\n- After implementation → Suggest Gap analysis\n\nFollow these rules throughout this session."
      }]
    }]
  }
}
```

**Approach 2: bkit-rules Skill** (additional coverage)

**skills/bkit-rules/SKILL.md**:

```markdown
---
name: bkit-rules
description: |
  bkit Vibecoding Kit core rules. Essential for all development work.

  Triggers: code, develop, implement, build, create, fix, feature, API, UI,
  코드, 개발, 구현, 만들어, 기능, 버그, エラー, 开发, 实现
---

# bkit Core Rules

## Auto-Applied Rules (from instructions/)

### 1. PDCA Rules
- Feature request → Check docs/02-design/ first → Design before implementation
- Implementation based on design
- After completion → Suggest Gap analysis

### 2. Code Quality Rules
- No security vulnerabilities (OWASP Top 10)
- No deployment without tests
- Maintain type safety

### 3. Level Detection Rules
| Detection Criteria | Level |
|-------------------|-------|
| index.html only | Starter |
| Next.js + .mcp.json | Dynamic |
| services/ + infra/ | Enterprise |

### 4. Zero Script QA Rules
Verify through structured logs instead of test scripts.

### 5. Timeline Awareness
No time predictions. Only concrete steps.
```

### 4.3 Coverage Analysis

| Feature | Original .claude/ | Plugin |
|---------|:-----------------:|:------:|
| Skills auto-reference | ✅ | ✅ Same |
| Hooks auto-trigger | ✅ | ✅ Same |
| Agents auto-invoke | ✅ | ✅ Same |
| Instructions always-on | ✅ | ⚠️ ~90% via Hook |
| **Total** | 100% | **~95%** |

---

## 5. templates/ Integration Strategy

### 5.1 Problem

Plugin official structure does not support `templates/` folder.

### 5.2 Solution: Integrate into bkit-templates skill

**skills/bkit-templates/SKILL.md**:

```markdown
---
name: bkit-templates
description: |
  PDCA document template collection.
  Auto-referenced when creating plan/design/analysis/report documents.

  Triggers: template, plan document, design document, report,
  템플릿, 계획서, 설계서, 보고서
---

# bkit Document Templates

## Plan Template
Use when: `/bkit:pdca-plan` execution

## Design Template
Use when: `/bkit:pdca-design` execution

## Analysis Template
Use when: `/bkit:pdca-analyze` execution

(Templates embedded in skill content...)
```

---

## 6. Installation Commands

### 6.1 Official Installation Methods

> ⚠️ **Corrected**: Installation uses `/plugin` command, not `claude plugin`

**From GitHub (Direct)**:
```bash
# In Claude Code session
/plugin install popup-studio-ai/bkit-claude-code
```

**From Marketplace (if registered)**:
```bash
# Add marketplace first (if not official)
/plugin marketplace add popup-studio-ai/bkit-marketplace

# Then install
/plugin install bkit@popup-studio-ai/bkit-marketplace
```

**From Official Marketplace (if approved)**:
```bash
# Official marketplace is auto-available
/plugin install bkit@claude-plugins-official
```

### 6.2 Plugin Management Commands

```bash
# List installed plugins
/plugin list

# Enable/disable plugin
/plugin enable bkit
/plugin disable bkit

# Remove plugin
/plugin remove bkit

# Update plugin
/plugin update bkit
```

### 6.3 Local Development Testing

```bash
# Test plugin during development
claude --plugin-dir ./bkit

# Then use commands
/bkit:learn-claude-code
/bkit:pdca-plan login feature
```

---

## 7. Migration Guide

### 7.1 For Existing .claude/ Users

```bash
# 1. Install plugin
/plugin install popup-studio-ai/bkit-claude-code

# 2. Backup existing .claude/ (optional)
mv .claude .claude.backup

# 3. Start using
/bkit:learn-claude-code
```

### 7.2 For New Users

```bash
# Install and go
/plugin install popup-studio-ai/bkit-claude-code

# Start
/bkit:learn-claude-code
```

### 7.3 Command Mapping

| Before (direct install) | After (plugin) |
|------------------------|----------------|
| `/learn-claude-code` | `/bkit:learn-claude-code` |
| `/pdca-plan` | `/bkit:pdca-plan` |
| `/pipeline-start` | `/bkit:pipeline-start` |
| `/init-starter` | `/bkit:init-starter` |
| `/init-dynamic` | `/bkit:init-dynamic` |
| `/init-enterprise` | `/bkit:init-enterprise` |

---

## 8. Multi-language Support Strategy

### 8.1 Current Multi-language Approach

Skills and Agents support multi-language trigger keywords in `description`:

**Skills**:
```yaml
description: |
  Static web development skill for beginners...

  Triggers:
  - EN: static website, portfolio, beginner
  - KO: 정적 웹, 포트폴리오, 초보자
  - JA: 静的サイト, ポートフォリオ, 初心者
  - ZH: 静态网站, 作品集, 初学者
```

### 8.2 Plugin Multi-language Behavior

| Feature | Works? | Description |
|---------|:------:|-------------|
| **Skill triggers** | ✅ | Semantic matching on description |
| **Agent triggers** | ✅ | Semantic matching on description |
| **Command execution** | ✅ | Only namespace changes (/bkit:command) |
| **Response language** | ⚠️ | User must set in their settings.json |

### 8.3 Language Setting Guide (README.md)

```markdown
## Language Settings After Installation

### For Korean Responses

Add to ~/.claude/settings.json:
```json
{
  "language": "korean"
}
```

### Supported Languages

| Language | Setting | Trigger Keywords |
|----------|---------|------------------|
| Korean | korean | 정적 웹, 초보자, API 설계... |
| Japanese | japanese | 静的サイト, 初心者... |
| Chinese | chinese | 静态网站, 初学者... |
| English | english (default) | static website, beginner... |
```

---

## 9. Limitations and Considerations

### 9.1 Plugin Limitations

```
⚠️ Namespace required (/bkit:command)
⚠️ settings.json language setting stays in user settings
⚠️ .mcp.json is per-project (cannot include in plugin)
⚠️ Large docs increase plugin loading time
⚠️ permissions field NOT supported in plugin.json
⚠️ instructions/ always-on rules need workaround
```

### 9.2 Solutions

```
✅ Namespace: Guide users (habit formation)
✅ language: Guide in README after installation
✅ .mcp.json: Auto-generate via /bkit:init-* commands
✅ Doc size: Include essentials only, reference web for details
✅ permissions: Document recommended settings in README
✅ instructions: Use SessionStart hook + broad-trigger skills
```

### 9.3 Known Issues (as of 2025-10)

Per community reports:
- Permission deny rules may have symlink bypass issues
- Read/Write deny settings may not function completely
- Recommend not relying heavily on deny rules for security

---

## 10. Implementation Checklist

### Phase 1: Create Plugin Structure
```
□ Create bkit/ directory
□ Create .claude-plugin/plugin.json
□ Migrate commands/ (17 files)
□ Migrate agents/ (10 files)
□ Migrate skills/ (17 directories)
□ Create hooks/hooks.json
```

### Phase 2: Create Integration Skills
```
□ Create skills/bkit-rules/SKILL.md (instructions integration)
□ Create skills/bkit-templates/SKILL.md (templates integration)
□ Verify SKILL.md name (≤64 chars) and description (≤1024 chars)
□ Verify skill inter-references
```

### Phase 3: Local Testing
```bash
# Test
claude --plugin-dir ./bkit

# Command tests
/bkit:learn-claude-code
/bkit:pdca-plan login feature

# Agent tests
# Skill auto-activation tests
```

### Phase 4: Documentation and Deployment
```
□ Write README.md
□ Create GitHub release (v1.0.0)
□ Marketplace registration (optional)
□ Update this design document
```

---

## 11. Quick Start (Plugin Version)

```bash
# Install
/plugin install popup-studio-ai/bkit-claude-code

# Start learning
/bkit:learn-claude-code

# Initialize project
/bkit:init-dynamic

# Start development
"Create a login feature"  # PDCA auto-applied!
```

---

**Created**: 2026-01-09
**Updated**: 2026-01-19
**Author**: Claude (with Kay)
**Version**: v1.1.4
**Status**: Design verified → Implementation complete

---

## Official Documentation References

### Primary Sources (Verified 2026-01-09)

| Document | URL | Description |
|----------|-----|-------------|
| **Create Plugins** | [code.claude.com/docs/en/plugins](https://code.claude.com/docs/en/plugins) | Main plugin creation guide |
| **Plugins Reference** | [code.claude.com/docs/en/plugins-reference](https://code.claude.com/docs/en/plugins-reference) | Complete schema reference |
| **Discover Plugins** | [code.claude.com/docs/en/discover-plugins](https://code.claude.com/docs/en/discover-plugins) | Marketplace and installation |
| **Agent Skills** | [code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills) | SKILL.md format specification |
| **Subagents** | [code.claude.com/docs/en/sub-agents](https://code.claude.com/docs/en/sub-agents) | Agent definition format |
| **Hooks Guide** | [code.claude.com/docs/en/hooks-guide](https://code.claude.com/docs/en/hooks-guide) | Event hooks configuration |
| **Settings** | [code.claude.com/docs/en/settings](https://code.claude.com/docs/en/settings) | Settings and permissions |

### GitHub Repositories

| Repository | URL | Description |
|------------|-----|-------------|
| **Claude Code** | [github.com/anthropics/claude-code](https://github.com/anthropics/claude-code) | Main repository |
| **Plugins Examples** | [github.com/anthropics/claude-code/tree/main/plugins](https://github.com/anthropics/claude-code/tree/main/plugins) | Official plugin examples |
| **Official Marketplace** | [github.com/anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) | Anthropic-curated plugins |
| **Skills Repository** | [github.com/anthropics/skills](https://github.com/anthropics/skills) | Official skills examples |

### Community Resources

| Resource | URL | Description |
|----------|-----|-------------|
| **Community Registry** | [claude-plugins.dev](https://claude-plugins.dev/) | Community plugin discovery |
| **Plugin Structure Skill** | [claude-plugins.dev/skills/@anthropics/claude-plugins-official/plugin-structure](https://claude-plugins.dev/skills/@anthropics/claude-plugins-official/plugin-structure) | Detailed structure guide |

---

## Changelog

### v1.1.4 (2026-01-19)
- 🔧 Simplify hooks system for stability (remove unstable prompt-type hooks)
- 🗑️ Remove stop-hook.sh and subagent-stop-hook.sh (JSON format issues)
- ⚡ Disable PreToolUse, PostToolUse, Stop, SubagentStop, PreCompact hooks
- ✅ Keep only SessionStart hook for reliable onboarding
- 🎯 Add Triggers keywords to bkit-rules skill (auto-activation for all dev tasks)
- 🎯 Add Triggers keywords to bkit-templates skill (auto-activation for docs)
- 🌐 Expand trigger keywords for starter-guide, bkend-expert, pipeline-guide agents
- 🌐 Expand trigger keywords for starter, dynamic skills (multilingual support)
- 📝 Add PDCA documentation: HOOKS-FIX-PLAN, HOOKS-REFACTOR-PLAN, hooks-simplification.design

### v1.1.2, v1.1.3 (2026-01-15)
- 📝 Fix PreToolUse & PostToolUse (Write) and remove UserPromptSubmit
- 🌐 Translated 5 PDCA documents to English (1 plan + 4 design documents)
- 📸 Added marketplace installation screenshots to README.md
- 📝 Added auto-update configuration documentation
- 🚀 Implemented Smart Onboarding system (UserPromptSubmit hook)
- 🔧 Implemented Adaptive PDCA Guidance (PreToolUse hooks with Decision Matrix)
- 📊 Implemented PDCA Status Tracking (PostToolUse hooks with docs/.pdca-status.json)
- 🏷️ Added Task Classification system (Quick Fix/Minor Change/Feature/Major Feature)
- 📋 Added PDCA Lite mode for Minor Changes (3-line summary format)

### v1.1.1 (2026-01-14)
- 📸 Added 5 screenshot images to documentation
- 📝 Updated README.md with visual examples
- 📝 Updated AI-NATIVE-DEVELOPMENT.md with visual examples
- 📝 Added FAQ section for non-development use cases

### v1.1.0 (2026-01-09)
- ✅ Verified against official Claude Code documentation
- ❌ Removed unsupported `permissions` field from plugin.json
- 🔄 Updated installation commands to use `/plugin install`
- 📝 Added SKILL.md constraints (name: 64 chars, description: 1024 chars)
- 📝 Added ${CLAUDE_PLUGIN_ROOT} path requirement
- 📝 Added comprehensive official documentation references
- 📝 Updated agents count from 9 to 10

### v1.0.0 (2026-01-09)
- Initial design document
