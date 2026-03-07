# bkit Skill Creator

> v1.6.1 ENH-97: Integrated skill creation and testing workflow

## Overview

Skill Creator provides scaffolding tools for creating new bkit skills with proper classification, eval definitions, and frontmatter configuration.

## Usage

```bash
# Create a new workflow skill
node skill-creator/generator.js --name my-skill --classification workflow

# Create a new capability skill
node skill-creator/generator.js --name my-skill --classification capability

# Validate an existing skill
node skill-creator/validator.js --skill pdca
```

## Generated Structure

For a new skill named `my-skill`:

```
skills/my-skill/
├── SKILL.md              # Skill definition with frontmatter

evals/{classification}/my-skill/
├── eval.yaml             # Eval definition
├── prompt-1.md           # Test prompt
└── expected-1.md         # Expected output
```

## Templates

- `templates/workflow-skill.yaml` - Workflow skill scaffold
- `templates/capability-skill.yaml` - Capability skill scaffold
- `templates/eval-template.yaml` - Eval definition scaffold
