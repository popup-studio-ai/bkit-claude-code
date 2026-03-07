## Output Quality Criteria for Claude Code Learning Skill

### 1. CLAUDE.md Configuration Guidance
- Explains CLAUDE.md as a shared knowledge repository that persists across sessions
- Provides a concrete example CLAUDE.md with package manager rules (pnpm enforced)
- Includes coding convention examples (type vs interface, no enum, no any)
- Shows prohibited patterns section with clear do/don't examples
- Mentions file placement at project root and .claude/ directory options

### 2. Hooks Configuration Examples
- Explains PostToolUse hook concept (auto-runs after tool execution)
- Provides a working .claude/settings.local.json example with PostToolUse hook
- Shows matcher pattern for Write|Edit tools triggering auto-format
- Includes a practical command example (e.g., pnpm format || true)
- Mentions other hook events available (PreToolUse, Stop, SessionStart)

### 3. Custom Slash Commands
- Explains that commands live in .claude/commands/ directory
- Shows how to create a command markdown file with proper naming
- Provides at least one practical command example relevant to the user's workflow
- Explains how to invoke commands with /command-name syntax
- Mentions argument passing or template variables if applicable

### 4. Skills and Agents Overview
- Explains skills as domain-specific expert context that Claude auto-references
- Explains agents as AI sub-agents specialized for specific tasks
- Differentiates between built-in and custom skills/agents
- Mentions MCP integration basics (.mcp.json) for connecting external tools
- Provides context on when skills trigger automatically vs manual invocation

### 5. Learning Path Structure
- Presents a clear progression from Level 1 (Basics) through advanced levels
- Estimates time investment for each level (e.g., Level 1: 15 min, Level 2: 30 min)
- Recommends starting with CLAUDE.md before moving to hooks and commands
- Suggests next steps after completing the current learning session
- References the setup action for auto-generating appropriate configuration

### 6. Practical and Project-Specific Advice
- Tailors examples to TypeScript/React/pnpm ecosystem mentioned by the user
- Suggests specific CLAUDE.md rules relevant to React development
- Recommends format hooks compatible with pnpm (e.g., pnpm prettier --write)
- Avoids overwhelming the user with enterprise-level features too early
- Provides actionable steps the user can implement immediately after the session
