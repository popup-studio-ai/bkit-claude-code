# bkit Gemini CLI Compatibility Audit Report

> Generated: 2026-01-27
> Version: 1.4.4
> Auditor: Claude Code + Web Research

---

## Executive Summary

| Category | Status | Score |
|----------|--------|-------|
| Extension Schema | CRITICAL | 30/100 |
| Hooks System | CRITICAL | 15/100 |
| Skills | WARNING | 60/100 |
| Commands | OK | 85/100 |
| Overall | INCOMPATIBLE | 35/100 |

**Conclusion**: bkit 플러그인은 **Claude Code 전용**으로 설계되어 있으며, **Gemini CLI와 호환되지 않습니다**. gemini-extension.json과 GEMINI.md 파일이 존재하지만, 실제 Gemini CLI 스펙과 맞지 않는 구조를 사용하고 있습니다.

---

## 1. Extension Schema Analysis (gemini-extension.json)

### 1.1 Current Structure vs Gemini CLI Specification

| Field | bkit Current | Gemini CLI Spec | Status |
|-------|-------------|-----------------|--------|
| `$schema` | `https://geminicli.dev/schemas/extension.json` | Not required | WARNING |
| `name` | "bkit" | Required | OK |
| `version` | "1.4.4" | Required | OK |
| `description` | Present | Required | OK |
| `author` | Object with name/email/url | **NOT SUPPORTED** | CRITICAL |
| `repository` | String | **NOT SUPPORTED** | CRITICAL |
| `license` | "Apache-2.0" | **NOT SUPPORTED** | CRITICAL |
| `keywords` | Array | **NOT SUPPORTED** | CRITICAL |
| `engines` | gemini-cli/node versions | **NOT SUPPORTED** | CRITICAL |
| `context.file` | "GEMINI.md" | Should be `contextFileName` | CRITICAL |
| `commands` | Object with directory/deprecated | **NOT SUPPORTED** (auto-detected from /commands) | CRITICAL |
| `hooks` | Full hook definitions | **MUST be in hooks/hooks.json** | CRITICAL |
| `skills` | Object with directory/autoActivate | **NOT SUPPORTED** (auto-detected from /skills) | CRITICAL |
| `environment` | `BKIT_PLATFORM: "gemini"` | **NOT SUPPORTED** | CRITICAL |

### 1.2 Valid Gemini CLI Fields (Not Used)

| Field | Purpose | bkit Status |
|-------|---------|-------------|
| `mcpServers` | MCP server configurations | NOT USED |
| `contextFileName` | Custom context file name | Should replace `context.file` |
| `excludeTools` | Tools to restrict | NOT USED |
| `settings` | User-configurable settings | NOT USED |

### 1.3 Required Actions

```diff
// Current gemini-extension.json
{
-  "$schema": "https://geminicli.dev/schemas/extension.json",
   "name": "bkit",
   "version": "1.4.4",
   "description": "Vibecoding Kit - PDCA methodology + AI-native development",
-  "author": { ... },
-  "repository": "...",
-  "license": "Apache-2.0",
-  "keywords": [...],
-  "engines": { ... },
-  "context": { "file": "GEMINI.md" },
+  "contextFileName": "GEMINI.md",
-  "commands": { ... },
-  "hooks": { ... },
-  "skills": { ... },
-  "environment": { ... }
}
```

---

## 2. Hooks System Analysis (hooks/hooks.json)

### 2.1 Event Name Mismatch

| bkit Current | Gemini CLI Spec | Impact |
|-------------|-----------------|--------|
| `SessionStart` | `SessionStart` | OK |
| `PreToolUse` | `BeforeTool` | CRITICAL - Will not trigger |
| `PostToolUse` | `AfterTool` | CRITICAL - Will not trigger |
| `Stop` | **NOT EXISTS** | CRITICAL - No equivalent event |
| `UserPromptSubmit` | `BeforeAgent` (similar) | CRITICAL - May not trigger |
| `PreCompact` | `PreCompress` | WARNING - Name mismatch |

### 2.2 Variable Substitution Mismatch

| bkit Current | Gemini CLI Spec | Impact |
|-------------|-----------------|--------|
| `${CLAUDE_PLUGIN_ROOT}` | `${extensionPath}` | CRITICAL - Path resolution fails |
| `${PLUGIN_ROOT}` | `${extensionPath}` | CRITICAL - Path resolution fails |
| N/A | `${workspacePath}` | Available but unused |
| N/A | `${/}` (path separator) | Available but unused |

### 2.3 Tool Matcher Mismatch

| bkit Current | Gemini CLI Spec | Impact |
|-------------|-----------------|--------|
| `Write` | `write_file` | CRITICAL - Matcher won't match |
| `Edit` | `edit_file` | CRITICAL - Matcher won't match |
| `Bash` | `run_shell_command` | CRITICAL - Matcher won't match |
| `Skill` | **NOT EXISTS** | CRITICAL - No such tool in Gemini |
| `Write\|Edit` | `write_file\|edit_file` | Regex syntax OK, names wrong |

### 2.4 Environment Variables

| Variable | Gemini CLI | Claude Code | bkit lib/common.js |
|----------|------------|-------------|-------------------|
| `GEMINI_PROJECT_DIR` | YES | NO | Detected |
| `GEMINI_SESSION_ID` | YES | NO | Detected |
| `GEMINI_CWD` | YES | NO | Not used |
| `GEMINI_EXTENSION_PATH` | YES | NO | Detected |
| `CLAUDE_PLUGIN_ROOT` | NO | YES | Primary |
| `CLAUDE_PROJECT_DIR` | Compat alias | YES | Primary |

### 2.5 Required hooks/hooks.json Transformation

```json
// Current (Claude Code format)
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/pre-write.js"
      }]
    }]
  }
}

// Required (Gemini CLI format)
{
  "hooks": {
    "BeforeTool": [{
      "matcher": "write_file|edit_file",
      "hooks": [{
        "command": "node ${extensionPath}/scripts/pre-write.js"
      }]
    }]
  }
}
```

---

## 3. Skills Analysis (skills/*/SKILL.md)

### 3.1 Frontmatter Field Compatibility

| Field | Gemini CLI | bkit Usage | Impact |
|-------|-----------|------------|--------|
| `name` | Required | YES | OK |
| `description` | Required | YES | OK |
| `argument-hint` | **NOT SUPPORTED** | YES | WARNING - Ignored |
| `user-invocable` | **NOT SUPPORTED** | YES | WARNING - Ignored |
| `agents` | **NOT SUPPORTED** | YES | CRITICAL - Agent system incompatible |
| `allowed-tools` | **NOT SUPPORTED** | YES | CRITICAL - Tool restrictions won't work |
| `imports` | **NOT SUPPORTED** | YES | CRITICAL - Template imports fail |
| `next-skill` | **NOT SUPPORTED** | YES | WARNING - Ignored |
| `pdca-phase` | **NOT SUPPORTED** | YES | WARNING - Ignored |
| `task-template` | **NOT SUPPORTED** | YES | WARNING - Ignored |

### 3.2 Affected Skills (22 total)

All skills use non-standard frontmatter fields that Gemini CLI will ignore:

- `pdca` - Uses agents, imports, allowed-tools
- `starter`, `dynamic`, `enterprise` - Use imports, next-skill
- `phase-1-schema` ~ `phase-9-deployment` - Use pdca-phase, imports
- `code-review`, `zero-script-qa` - Use agents, allowed-tools
- `claude-code-learning` - Uses user-invocable
- `github-integration` - Uses imports
- `bkit-rules`, `bkit-templates` - Use imports
- `mobile-app`, `desktop-app` - Standard fields only (OK)

### 3.3 Agent System Incompatibility

bkit uses custom agent invocation in SKILL.md:
```yaml
agents:
  analyze: gap-detector
  iterate: pdca-iterator
  report: report-generator
```

Gemini CLI **does not support** this pattern. Gemini uses MCP servers or the model's own capabilities.

### 3.4 Template Import System

bkit imports:
```yaml
imports:
  - ${PLUGIN_ROOT}/templates/plan.template.md
  - ${PLUGIN_ROOT}/templates/design.template.md
```

Gemini CLI **does not support** imports. Skills must be self-contained or use references within the skill directory.

---

## 4. Commands Analysis (commands/gemini/*.toml)

### 4.1 TOML Format Compatibility

| Aspect | Status | Notes |
|--------|--------|-------|
| File format | OK | TOML is supported |
| `description` field | OK | Standard field |
| `prompt` field | OK | Standard field |
| Markdown in prompt | OK | Supported |
| `$ARGUMENTS` variable | UNCERTAIN | Need to verify with Gemini CLI |

### 4.2 Command Files (20 total)

All commands use valid TOML structure:
- `pdca-*.toml` (8 files) - Plan, Design, Analyze, Iterate, Report, Status, Next
- `init-*.toml` (3 files) - Starter, Dynamic, Enterprise
- `pipeline-*.toml` (3 files) - Start, Status, Next
- Utility commands (6 files) - archive, github-stats, learn, setup, upgrade, zero-script-qa

### 4.3 Deprecation Notice

```json
"commands": {
  "deprecated": true,
  "deprecationNotice": "Commands are deprecated in v1.4.4. Use Skills instead."
}
```

This deprecation field is **not supported** by Gemini CLI. Commands will load but without deprecation messaging.

---

## 5. Scripts Analysis (scripts/*.js)

### 5.1 Platform Detection in lib/common.js

The library includes platform detection:
```javascript
// Detected platforms
const isGemini = !!(process.env.GEMINI_PROJECT_DIR ||
                    process.env.GEMINI_SESSION_ID ||
                    process.env.GEMINI_EXTENSION_PATH);

const isClaude = !!(process.env.CLAUDE_PLUGIN_ROOT ||
                    process.env.CLAUDE_PROJECT_DIR);
```

**However**, even with detection, the scripts use Claude-specific patterns.

### 5.2 Output Format Compatibility

Gemini CLI requires **strict JSON output** to stdout:
> "The Golden Rule: hooks must output only valid JSON to stdout. Even a single echo or print call before the JSON will break parsing."

**Risk Areas:**
- `console.log()` calls for debugging
- Non-JSON output in error cases
- Template string outputs

### 5.3 Scripts Requiring Modification

| Script | Issue | Priority |
|--------|-------|----------|
| session-start.js | Uses Claude-specific PDCA status tracking | HIGH |
| user-prompt-handler.js | `UserPromptSubmit` event doesn't exist | CRITICAL |
| unified-stop.js | `Stop` event doesn't exist | CRITICAL |
| pre-write.js | Tool matcher won't match | HIGH |
| unified-bash-*.js | Tool matcher won't match | HIGH |

---

## 6. Documentation Analysis (GEMINI.md)

### 6.1 Content Accuracy

| Section | Accuracy | Issue |
|---------|----------|-------|
| Core Principles | OK | General guidance |
| PDCA Workflow | PARTIAL | References commands that work |
| Level System | OK | Conceptual guidance |
| Available Skills | MISLEADING | Skills won't activate as described |
| Trigger Keywords | MISLEADING | No automatic trigger system in Gemini |
| Task Size Rules | OK | General guidance |
| Check-Act Iteration Loop | CRITICAL | Agent system incompatible |
| Template References | WARNING | Imports don't work |
| Response Report Rule | OK | Instructions for AI behavior |

### 6.2 Missing Information

- No explanation that bkit is primarily for Claude Code
- No instructions for Gemini-specific configuration
- No warning about limited functionality

---

## 7. GitHub Issues Analysis

### 7.1 Relevant Gemini CLI Issues

| Issue | Status | Impact on bkit |
|-------|--------|----------------|
| [#14449](https://github.com/google-gemini/gemini-cli/issues/14449) - Hook Support in Extensions | CLOSED (Implemented) | Extension hooks now supported via hooks/hooks.json |
| [#9070](https://github.com/google-gemini/gemini-cli/issues/9070) - Comprehensive Hooking System | OPEN | Full hook system still evolving |
| [#11703](https://github.com/google-gemini/gemini-cli/issues/11703) - System of Hooks | Related | Hook standardization ongoing |

### 7.2 Gemini CLI Version Requirements

bkit specifies:
```json
"engines": {
  "gemini-cli": ">=0.25.0"
}
```

Current Gemini CLI is **v0.26+** with significantly different extension API than originally assumed.

---

## 8. Recommendations

### 8.1 Immediate Actions (Critical)

1. **Rename/Split Extension Files**
   - Create separate `claude-extension.json` for Claude Code
   - Fix `gemini-extension.json` to match Gemini CLI spec

2. **Fix hooks/hooks.json for Gemini**
   - Rename events: `PreToolUse` → `BeforeTool`, `PostToolUse` → `AfterTool`
   - Remove unsupported events: `Stop`, `UserPromptSubmit`
   - Fix variables: `${CLAUDE_PLUGIN_ROOT}` → `${extensionPath}`
   - Fix matchers: `Write` → `write_file`, `Bash` → `run_shell_command`

3. **Remove Non-Standard SKILL.md Fields**
   - Keep only `name` and `description` for Gemini compatibility
   - Move agent definitions to documentation only

### 8.2 Short-term Actions (High Priority)

4. **Create Platform-Specific Hook Files**
   - `hooks/hooks.claude.json` - Claude Code hooks
   - `hooks/hooks.gemini.json` - Gemini CLI hooks
   - Installer script to copy appropriate file

5. **Update lib/common.js**
   - Ensure all JSON output is strict
   - Add stderr for all debug logging
   - Test with Gemini CLI environment

6. **Simplify Skills for Gemini**
   - Create Gemini-compatible skill variants
   - Remove unsupported frontmatter
   - Inline template content instead of imports

### 8.3 Long-term Actions (Recommended)

7. **Consider Separate Distributions**
   - `bkit-claude-code` - Full-featured Claude Code plugin
   - `bkit-gemini-cli` - Simplified Gemini CLI extension

8. **Documentation Update**
   - Clearly state primary platform (Claude Code)
   - Add Gemini CLI limitations section
   - Update installation instructions per platform

9. **Automated Testing**
   - Add Gemini CLI integration tests
   - Verify hook execution in Gemini environment
   - Test skill activation patterns

---

## 9. Compatibility Matrix

| Feature | Claude Code | Gemini CLI |
|---------|-------------|------------|
| Extension manifest | Full support | Limited fields only |
| Hooks in extension | Via hooks.json | Via hooks/hooks.json |
| PreToolUse/BeforeTool | PreToolUse | BeforeTool |
| PostToolUse/AfterTool | PostToolUse | AfterTool |
| Stop event | Supported | NOT SUPPORTED |
| UserPromptSubmit | Supported | NOT SUPPORTED |
| Custom agents | Full support | NOT SUPPORTED |
| Skill imports | Full support | NOT SUPPORTED |
| Tool restrictions | Full support | NOT SUPPORTED |
| Task system | Full support | NOT SUPPORTED |
| TOML commands | Supported | Supported |
| MCP servers | Supported | Supported |

---

## 10. Conclusion

### Current State

bkit 플러그인은 **Claude Code 전용**으로 설계 및 구현되어 있습니다:
- 확장 스키마가 Gemini CLI 스펙과 불일치
- Hook 이벤트명이 완전히 다름
- Skill 시스템이 호환되지 않음
- 커스텀 Agent 시스템이 Gemini에 없음

### Compatibility Score

```
Extension Schema:  ████░░░░░░ 30%
Hooks System:      █░░░░░░░░░ 15%
Skills:            ██████░░░░ 60%
Commands:          ████████░░ 85%
Scripts:           ███░░░░░░░ 35%
Documentation:     █████░░░░░ 50%
─────────────────────────────
Overall:           ███░░░░░░░ 35%
```

### Verdict

**GEMINI CLI 호환성: 불가** (Major refactoring required)

현재 상태로는 Gemini CLI에서 bkit 플러그인이 제대로 작동하지 않습니다. TOML 명령어만 부분적으로 작동하며, 핵심 기능인 PDCA 자동화, Agent 시스템, Hook 기반 자동화는 모두 실패합니다.

---

## Sources

- [Gemini CLI Extensions](https://geminicli.com/docs/extensions/)
- [Gemini CLI Hooks](https://geminicli.com/docs/hooks/)
- [Agent Skills](https://geminicli.com/docs/cli/skills/)
- [Hook Support in Extensions - Issue #14449](https://github.com/google-gemini/gemini-cli/issues/14449)
- [Extension Hooks PR #14460](https://github.com/google-gemini/gemini-cli/pull/14460)
- [Hooks Reference](https://geminicli.com/docs/hooks/reference/)
- [Extensions Reference](https://geminicli.com/docs/extensions/reference/)

---

**Report Generated by**: bkit PDCA Report System
**Analysis Tools Used**: WebSearch, WebFetch, Explore Agent, Read, Grep, Glob
