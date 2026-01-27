---
name: functions
description: |
  bkit plugin functions - Show all available bkit functions.
  Workaround for skills autocomplete issue.

  Use "/bkit:functions" to see available functions list.

  Triggers: bkit, bkit functions, bkit help
user-invocable: true
allowed-tools:
  - Read
  - Skill
---

# bkit Functions

> Show all available bkit functions (Skills autocomplete workaround)

Display the following help message:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧰 bkit - AI Native Development Toolkit v1.4.5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 PDCA (Document-Driven Development)
  /pdca plan <feature>       Start planning a new feature
  /pdca design <feature>     Create design document
  /pdca do <feature>         Implementation guide
  /pdca analyze <feature>    Gap analysis (design vs implementation)
  /pdca iterate <feature>    Auto-improvement iteration
  /pdca report <feature>     Generate completion report
  /pdca archive <feature>    Archive completed PDCA documents
  /pdca status               Show current PDCA status
  /pdca next                 Guide to next step

🚀 Project Initialization
  /starter init <name>       Static web project (HTML/CSS/Next.js)
  /dynamic init <name>       Fullstack app (bkend.ai BaaS)
  /enterprise init <name>    Enterprise system (K8s/Terraform)

📊 Development Pipeline
  /development-pipeline start    Start pipeline
  /development-pipeline next     Proceed to next phase
  /development-pipeline status   Check current phase

🔍 Quality Management
  /code-review <path>        Code review
  /zero-script-qa            Start Zero Script QA

📚 Learning
  /claude-code-learning          Learn Claude Code
  /claude-code-learning setup    Analyze current project setup

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  Note: These functions don't have autocomplete in CLI.
    Type the command directly (e.g., /pdca plan login)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Functions Reference

### User-Invocable Functions (10)

| Function | Description |
|----------|-------------|
| `/pdca` | PDCA cycle management |
| `/starter` | Starter project (HTML/CSS/Next.js) |
| `/dynamic` | Dynamic project (bkend.ai BaaS) |
| `/enterprise` | Enterprise project (K8s/Terraform) |
| `/development-pipeline` | 9-phase development pipeline |
| `/code-review` | Code quality analysis |
| `/zero-script-qa` | Log-based QA |
| `/claude-code-learning` | Claude Code learning |
| `/bkit-rules` | Core rules (auto-applied) |
| `/bkit-templates` | PDCA document templates |

### Claude-Only Functions (11)

| Function | Description |
|----------|-------------|
| `/phase-1-schema` ~ `/phase-9-deployment` | 9-phase Pipeline knowledge |
| `/mobile-app` | Mobile app development |
| `/desktop-app` | Desktop app development |
