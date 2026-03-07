# bkit Skill Evals Framework

> v1.6.0 ENH-88: Automated skill quality verification

## Overview

The evals framework provides automated testing for all 28 bkit skills, organized by classification:
- **Workflow** (10 skills): Process compliance tests
- **Capability** (16 skills): Output quality + model parity tests
- **Hybrid** (2 skills): Both test types

## Directory Structure

```
evals/
├── config.json          # Global eval configuration
├── runner.js            # Eval execution engine
├── reporter.js          # Results reporting
├── ab-tester.js         # A/B testing engine (ENH-89)
├── workflow/            # 9 Workflow skill evals
├── capability/          # 16 Capability skill evals
└── hybrid/              # 2 Hybrid skill evals
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
version: 1.6.0
evals:
  - name: test-name
    prompt: prompt-file.md
    expected: expected-file.md
    criteria:
      - "Expected behavior description"
    timeout: 60000
```
