# bkit - Vibecoding Kit

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-v2.1.1+-purple.svg)](https://code.claude.com)
[![Author](https://img.shields.io/badge/Author-POPUP%20STUDIO-orange.svg)](https://popupstudio.ai)

> **PDCA methodology + Claude Code mastery for AI-native development**

bkit is a Claude Code plugin that transforms how you build software with AI. It provides structured development workflows, automatic documentation, and intelligent code assistance through the PDCA (Plan-Do-Check-Act) methodology.

![bkit Introduction](images/bkit-intro.png)

---

## Features

![bkit Features](images/bkit-features.png)

- **PDCA Methodology** - Structured development workflow with automatic documentation
- **Evaluator-Optimizer Pattern** - Automatic iteration cycles from Anthropic's agent architecture
- **9-Stage Development Pipeline** - From schema design to deployment
- **3 Project Levels** - Starter (static), Dynamic (fullstack), Enterprise (microservices)
- **Multilingual Support** - 8 languages (EN, KO, JA, ZH, ES, FR, DE, IT)
- **18 Commands** - Automate common development tasks
- **24 Skills** - Domain-specific knowledge for various development scenarios
- **11 Agents** - Specialized AI assistants for different tasks

---

### 🚀 초보자라면?

> **Claude Code가 처음이신가요?**
>
> [bkit-starter](https://github.com/popup-studio-ai/bkit-starter)로 시작하세요!
>
> - 완전한 한글 가이드
> - 프로그래밍 경험 없이도 시작 가능
> - 첫 프로젝트 만들기 체험
>
> ```bash
> /plugin enable bkit-starter
> ```
>
> bkit은 bkit-starter를 마스터한 후 사용하는 고급 확장 버전입니다.

---

## Quick Start

### Option 1: Marketplace Installation (Recommended)

The easiest way to install bkit is through the Claude Code marketplace.

```bash
# Step 1: Add bkit marketplace
/plugin marketplace add popup-studio-ai/bkit-claude-code

# Step 2: Install bkit plugin
/plugin install bkit
```

#### Managing Marketplaces

Use `/plugin` command and navigate to **Marketplaces** tab to manage your plugin sources:

![bkit Marketplace](images/bkit-marketplace.png)

- **bkit-marketplace**: Contains bkit and bkit-starter plugins
- **claude-plugins-official**: Official Anthropic plugins

#### Discovering Plugins

Navigate to **Discover** tab to browse and install available plugins:

![bkit Marketplace Plugins](images/bkit-marketplace-plugins.png)

| Plugin | Description | Best For |
|--------|-------------|----------|
| **bkit** | Full PDCA methodology + Claude Code mastery | Experienced developers |
| **bkit-starter** | Korean learning guide for beginners | First-time Claude Code users |

#### Auto-Update Configuration

Keep your plugins up-to-date automatically by configuring auto-update in your settings:

```json
// ~/.claude/settings.json
{
  "plugins": {
    "autoUpdate": true
  }
}
```

**Update Commands:**
- Press `u` in the Marketplaces view to update all plugins
- Press `r` to remove a marketplace
- Use `Space` to toggle plugin selection in Discover view

### Option 2: Manual Installation

For development or customization purposes:

```bash
# Clone this repository
git clone https://github.com/popup-studio-ai/bkit-claude-code.git

# Copy .claude folder to your project
cp -r bkit-claude-code/.claude your-project/
```

> **Note**: Manual installation requires manual updates. Marketplace installation is recommended for automatic updates.

### Plugin Structure

```
bkit-claude-code/
├── .claude-plugin/
│   ├── plugin.json          # Plugin manifest
│   └── marketplace.json     # Marketplace registry
├── commands/                # Slash commands
├── agents/                  # Specialized AI agents
├── skills/                  # Domain knowledge
├── hooks/                   # Event hooks (hooks.json)
├── templates/               # Document templates
└── .claude/                 # Source files (also works standalone)
```

---

## Usage

### Start Learning
```bash
/bkit:learn-claude-code
```

### Initialize a Project
```bash
/bkit:init-starter      # Static website
/bkit:init-dynamic      # Fullstack with BaaS
/bkit:init-enterprise   # Microservices with K8s
```

### PDCA Workflow
```bash
/bkit:pdca-plan {feature}    # Create plan document
/bkit:pdca-design {feature}  # Create design document
/bkit:pdca-iterate {feature} # Auto-fix with Evaluator-Optimizer pattern
/bkit:pdca-analyze           # Run gap analysis
/bkit:pdca-report            # Generate completion report
```

---

## Project Levels

| Level | Description | Stack |
|-------|-------------|-------|
| **Starter** | Static websites, portfolios | HTML, CSS, JS |
| **Dynamic** | Fullstack applications | Next.js, BaaS |
| **Enterprise** | Microservices architecture | K8s, Terraform, MSA |

---

## Is bkit Only for Development?

![bkit for Non-Development](images/to-use-non-development.png)

bkit is **primarily designed for software development**. However, some components can inspire structured workflows beyond coding:

| Component | Beyond Development Uses |
|-----------|------------------------|
| **PDCA Methodology** | Project management, process improvement |
| **Document Templates** | Planning any structured project |
| **Gap Analysis** | Comparing any plan vs. actual outcome |

> **Note**: For general writing, research, or non-technical tasks, plain Claude Code (without bkit) is better suited.

---

## Documentation

- **[Architecture & User Journey](docs/00-ARCHITECTURE.md)** - Complete system analysis and user experience guide
- **[AI-Native Transformation](docs/AI-NATIVE-TRANSFORMATION.md)** - Business value analysis for C-Level executives
- **[AI-Native Development Methodology](AI-NATIVE-DEVELOPMENT.md)** - How bkit realizes AI-Native development principles
- [Getting Started](.claude/docs/setup/environment-setup.md)
- [PDCA Methodology](.claude/docs/pdca/overview.md)
- [Evaluator-Optimizer Pattern](skills/evaluator-optimizer/SKILL.md)
- [Development Pipeline](skills/development-pipeline/SKILL.md)
- [Commands Reference](commands/)
- [Skills Reference](skills/)
- [Agents Reference](agents/)

---

## Language Support

bkit automatically detects your language from trigger keywords:

| Language | Trigger Keywords |
|----------|-----------------|
| English | static website, beginner, API design |
| Korean | 정적 웹, 초보자, API 설계 |
| Japanese | 静的サイト, 初心者, API設計 |
| Chinese | 静态网站, 初学者, API设计 |
| Spanish | sitio web estático, principiante |
| French | site web statique, débutant |
| German | statische Webseite, Anfänger |
| Italian | sito web statico, principiante |

### Setting Response Language

To set Claude's **response language**, add to `~/.claude/settings.json`:

```json
{
  "language": "korean"
}
```

| Language | Setting Value |
|----------|---------------|
| Korean | `"language": "korean"` |
| Japanese | `"language": "japanese"` |
| Chinese | `"language": "chinese"` |
| English | `"language": "english"` (default) |

> **Note**: Trigger keywords work in any language. The `language` setting only affects Claude's response language.

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Branch Protection

- Only `admin` team members can merge to `main`
- All changes require pull request review
- Version releases are managed through Git tags

---

## License

Copyright 2024-2026 POPUP STUDIO PTE. LTD.

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.

You must include the [NOTICE](NOTICE) file in any redistribution.

---

## Support

- **Issues**: [GitHub Issues](https://github.com/popup-studio-ai/bkit-claude-code/issues)
- **Email**: contact@popupstudio.ai

---

Made with AI by [POPUP STUDIO](https://popupstudio.ai)
