# bkit - Vibecoding Kit

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-v2.1.1+-purple.svg)](https://code.claude.com)

> **PDCA methodology + Claude Code mastery for AI-native development**

bkit is a Claude Code plugin that transforms how you build software with AI. It provides structured development workflows, automatic documentation, and intelligent code assistance through the PDCA (Plan-Do-Check-Act) methodology.

---

## Features

- **PDCA Methodology** - Structured development workflow with automatic documentation
- **9-Stage Development Pipeline** - From schema design to deployment
- **3 Project Levels** - Starter (static), Dynamic (fullstack), Enterprise (microservices)
- **Multilingual Support** - 8 languages (EN, KO, JA, ZH, ES, FR, DE, IT)
- **17 Commands** - Automate common development tasks
- **19 Skills** - Domain-specific knowledge for various development scenarios
- **9 Agents** - Specialized AI assistants for different tasks

---

## Quick Start

### Option 1: Marketplace Installation (Recommended)

```bash
# Step 1: Add bkit marketplace
/plugin marketplace add popup-studio-ai/bkit-claude-code

# Step 2: Install bkit plugin
/plugin install bkit
```

### Option 2: Direct GitHub Installation

```bash
/plugin install popup-studio-ai/bkit-claude-code
```

### Option 3: Manual Installation

```bash
# Clone this repository
git clone https://github.com/popup-studio-ai/bkit-claude-code.git

# Copy .claude folder to your project
cp -r bkit-claude-code/.claude your-project/
```

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

## Documentation

- **[Architecture & User Journey](docs/ARCHITECTURE.md)** - Complete system analysis and user experience guide
- **[AI-Native Transformation](docs/AI-NATIVE-TRANSFORMATION.md)** - Business value analysis for C-Level executives
- [Getting Started](.claude/docs/setup/environment-setup.md)
- [PDCA Methodology](.claude/docs/pdca/overview.md)
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
