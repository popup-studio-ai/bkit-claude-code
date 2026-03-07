# bkit Skill Evals Framework

> v1.6.1 ENH-88: Automated skill quality verification (28/28 full implementation)

## Overview

The evals framework provides automated testing for all 28 bkit skills, organized by classification:
- **Workflow** (9 skills): Process compliance tests
- **Capability** (18 skills): Output quality + model parity tests
- **Hybrid** (1 skill): Both test types

## Directory Structure

```
evals/
├── config.json          # Global eval configuration
├── runner.js            # Eval execution engine (v1.6.1: real evaluation)
├── reporter.js          # Results reporting (v1.6.1: detailed format)
├── ab-tester.js         # A/B testing engine (ENH-89)
├── workflow/            # 9 Workflow skill evals
├── capability/          # 18 Capability skill evals
└── hybrid/              # 1 Hybrid skill eval
```

## Usage

```bash
# Run single skill eval
node evals/runner.js --skill pdca

# Run all workflow evals
node evals/runner.js --classification workflow

# Run full benchmark
node evals/runner.js --benchmark

# Run parity test (capability skills)
node evals/runner.js --parity starter
```

## Eval Definition (eval.yaml)

Each skill has an eval.yaml defining test cases:

```yaml
name: skill-name
classification: workflow|capability|hybrid
version: 1.6.1
evals:
  - name: test-name
    prompt: prompt-file.md
    expected: expected-file.md
    criteria:
      - "Expected behavior description"
    timeout: 60000
```
