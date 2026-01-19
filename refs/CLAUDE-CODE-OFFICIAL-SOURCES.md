# Claude Code Official Sources Reference

> Last Updated: 2026-01-10
> Claude Code Version: 2.1.2

This document organizes official information sources for Claude Code plugin development and maintenance.

---

## 1. Official Documentation

### Primary Documentation Portal

| Resource | URL | Description |
|----------|-----|-------------|
| **Documentation Home** | https://code.claude.com/docs/en/overview | Main documentation portal |
| **Quickstart** | https://code.claude.com/docs/en/quickstart | 5-minute getting started guide |
| **Changelog** | https://code.claude.com/docs/en/changelog | Version-specific changes (must check) |

### Plugin Development

| Resource | URL | Description |
|----------|-----|-------------|
| **Plugins Guide** | https://code.claude.com/docs/en/plugins | Plugin creation guide |
| **Plugins Reference** | https://code.claude.com/docs/en/plugins-reference | Technical reference, schemas |
| **Discover Plugins** | https://code.claude.com/docs/en/discover-plugins | Marketplace plugins |
| **Plugin Marketplaces** | https://code.claude.com/docs/en/plugin-marketplaces | Marketplace creation/distribution |

### Components Reference

| Resource | URL | Description |
|----------|-----|-------------|
| **Hooks Guide** | https://code.claude.com/docs/en/hooks-guide | Hooks usage guide |
| **Hooks Reference** | https://code.claude.com/docs/en/hooks | Hooks technical reference |
| **Skills** | https://code.claude.com/docs/en/skills | Skills creation and management |
| **Subagents** | https://code.claude.com/docs/en/sub-agents | Subagent creation |
| **Slash Commands** | https://code.claude.com/docs/en/slash-commands | Slash commands reference |

### Configuration

| Resource | URL | Description |
|----------|-----|-------------|
| **Settings** | https://code.claude.com/docs/en/settings | Global/project settings |
| **Memory** | https://code.claude.com/docs/en/memory | Memory management |
| **Model Config** | https://code.claude.com/docs/en/model-config | Model configuration |
| **CLI Reference** | https://code.claude.com/docs/en/cli-reference | Complete CLI commands |

---

## 2. GitHub Repository

### Main Repository

| Resource | URL | Description |
|----------|-----|-------------|
| **Main Repo** | https://github.com/anthropics/claude-code | Official repository (53.9k stars) |
| **Issues** | https://github.com/anthropics/claude-code/issues | Bug reports, feature requests |
| **Releases** | https://github.com/anthropics/claude-code/releases | Release notes |
| **Plugins Directory** | https://github.com/anthropics/claude-code/tree/main/plugins | Official plugin examples |

### Official Plugins (13)

```
anthropics/claude-code/plugins/
├── agent-sdk-dev/           # Agent SDK development tools
├── claude-opus-4-5-migration/  # Opus 4.5 migration
├── code-review/             # PR code review
├── commit-commands/         # Git workflow
├── explanatory-output-style/ # Educational output style
├── feature-dev/             # 7-stage feature development
├── frontend-design/         # Frontend design
├── hookify/                 # Custom hook creation
├── learning-output-style/   # Learning mode
├── plugin-dev/              # Plugin development tools
├── pr-review-toolkit/       # PR review agents
├── ralph-wiggum/            # Iterative development loop
└── security-guidance/       # Security guidance hooks
```

---

## 3. Version Tracking

### Current Version: 2.1.2

```bash
# Check version
claude --version
```

### Recent Changes (2.1.x)

| Version | Key Features |
|---------|-------------|
| **2.1.2** | Source path metadata, OSC 8 hyperlinks, winget support, Shift+Tab auto-accept, security patches |
| **2.1.0** | Skill hot-reload, `context: fork`, `language` setting, Vim motions improvements, `/plan` command |
| **2.0.x** | Checkpoints, Subagents, Background tasks, Hooks system |

### Breaking Changes Watch

Items to check on version updates:

- [ ] Hook event names changes
- [ ] YAML frontmatter field changes
- [ ] Plugin schema changes
- [ ] Permissions structure changes
- [ ] Settings key changes

---

## 4. Community & Support

| Resource | URL | Description |
|----------|-----|-------------|
| **Discord** | https://anthropic.com/discord | Claude Developers community |
| **Best Practices** | https://www.anthropic.com/engineering/claude-code-best-practices | Official best practices |
| **Events** | https://www.anthropic.com/events/code-with-claude-2025 | Code with Claude events |
| **Status** | https://status.anthropic.com | Service status |

---

## 5. Related Documentation

| Resource | URL | Description |
|----------|-----|-------------|
| **Agent SDK** | https://docs.claude.com/en/docs/agent-sdk/overview | Agent SDK documentation |
| **MCP** | https://code.claude.com/docs/en/mcp | Model Context Protocol |
| **Anthropic API** | https://docs.anthropic.com | Anthropic API documentation |

---

## 6. Plugin Structure Reference

### Standard Plugin Structure

```
plugin-name/
├── .claude-plugin/
│   └── plugin.json          # Plugin metadata (required)
├── commands/                # Slash commands (.md)
├── agents/                  # Agent definitions (.md)
├── skills/                  # Skill definitions (folder/SKILL.md)
├── hooks/                   # Hook definitions (hooks.json or .sh)
├── .mcp.json               # MCP server config (optional)
└── README.md               # Plugin documentation
```

### YAML Frontmatter Fields

#### Commands
```yaml
---
description: Command description
allowed-tools: ["Read", "Write", "Edit", "Bash"]
---
```

#### Agents
```yaml
---
name: agent-name
description: |
  Agent description with triggers
model: sonnet | opus | haiku
tools:
  - Read
  - Write
  - Edit
skills:
  - skill-name
permissionMode: default | bypassPermissions
hooks: hooks.json
---
```

#### Skills
```yaml
---
name: skill-name
description: |
  Skill description with triggers
context: default | fork
agent: linked-agent-name
allowed-tools:
  - Read
  - Grep
user-invocable: true | false
hooks: hooks.json
---
```

---

## 7. Update Check Workflow

### Regular Check Checklist

1. **Weekly**
   - [ ] Check changelog: https://code.claude.com/docs/en/changelog
   - [ ] Check GitHub releases
   - [ ] Check Discord announcements

2. **Monthly**
   - [ ] Check plugins/ directory for new examples
   - [ ] Check documentation structure changes
   - [ ] Check breaking changes

3. **On Version Update**
   - [ ] Run `scripts/validate-plugin.sh`
   - [ ] Check YAML frontmatter compatibility
   - [ ] Check hook events compatibility
   - [ ] Review new features for adoption

---

## 8. bkit Plugin Compatibility

### Current bkit Version: 1.1.4

| Component | Count | Claude Code Compatibility |
|-----------|-------|--------------------------|
| Commands | 18 | v2.1.x ✅ |
| Agents | 11 | v2.1.x ✅ |
| Skills | 24 | v2.1.x ✅ |
| Hooks | 6 | v2.1.x ✅ |

### Validation Script

```bash
# Plugin validation check
./scripts/validate-plugin.sh

# Compatibility check with specific version
./scripts/validate-plugin.sh --claude-version 2.1.2
```

---

*Document maintained by POPUP STUDIO PTE. LTD.*
*https://popupstudio.ai*
