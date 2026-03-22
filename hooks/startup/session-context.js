/**
 * bkit Vibecoding Kit - SessionStart: Session Context Builder Module (v2.0.0)
 *
 * Builds the additionalContext string for the SessionStart hook response.
 * Includes PDCA status injection, Feature Usage rules, Executive Summary rules,
 * Agent Teams info, Output Styles info, bkend MCP info.
 */

const fs = require('fs');
const path = require('path');
const { detectLevel } = require('../../lib/pdca/level');
const { debugLog } = require('../../lib/core/debug');
const { getPdcaStatusFull } = require('../../lib/pdca/status');

/**
 * Build onboarding context section.
 * @param {object} onboardingData - Onboarding data from onboarding module
 * @returns {string} Context string
 */
function buildOnboardingContext(onboardingData) {
  let ctx = '';

  if (onboardingData.hasExistingWork) {
    ctx += `## 🔄 Previous Work Detected\n\n`;
    ctx += `- **Feature**: ${onboardingData.primaryFeature}\n`;
    ctx += `- **Current Phase**: ${onboardingData.phase}\n`;
    if (onboardingData.matchRate) {
      ctx += `- **Match Rate**: ${onboardingData.matchRate}%\n`;
    }
    ctx += `\n### 🚨 MANDATORY: Call AskUserQuestion on user's first message\n\n`;
    ctx += `${onboardingData.prompt}\n\n`;
    ctx += `### Actions by selection:\n`;
    ctx += `- **Continue ${onboardingData.primaryFeature}** → Run /pdca status then guide to next phase\n`;
    ctx += `- **Start new task** → Ask for new feature name then run /pdca plan\n`;
    ctx += `- **Check status** → Run /pdca status\n\n`;
  } else {
    ctx += `## 🚨 MANDATORY: Session Start Action\n\n`;
    ctx += `**AskUserQuestion tool** call required on user's first message.\n\n`;
    ctx += `${onboardingData.prompt}\n\n`;
    ctx += `### Actions by selection:\n`;
    ctx += `- **Learn bkit** → Run /development-pipeline\n`;
    ctx += `- **Learn Claude Code** → Run /claude-code-learning\n`;
    ctx += `- **Start new project** → Select level then run /starter, /dynamic, or /enterprise\n`;
    ctx += `- **Start freely** → General conversation mode\n\n`;
  }

  return ctx;
}

/**
 * Build Agent Teams context section.
 * @param {string} detectedLevel - Current detected level
 * @returns {string} Context string
 */
function buildAgentTeamsContext(detectedLevel) {
  let ctx = '';

  try {
    const { isTeamModeAvailable, getTeamConfig } = require('../../lib/team');
    if (isTeamModeAvailable()) {
      const teamConfig = getTeamConfig();
      ctx += `## CTO-Led Agent Teams (Active)\n`;
      ctx += `- CTO Lead: cto-lead (opus) orchestrates PDCA workflow\n`;
      ctx += `- Start: \`/pdca team {feature}\`\n`;
      ctx += `- Display mode: ${teamConfig.displayMode}\n`;
      if (detectedLevel === 'Enterprise') {
        ctx += `- Enterprise: 5 teammates (architect, developer, qa, reviewer, security)\n`;
        ctx += `- Patterns: leader → council → swarm → council → watchdog\n`;
      } else if (detectedLevel === 'Dynamic') {
        ctx += `- Dynamic: 3 teammates (developer, frontend, qa)\n`;
        ctx += `- Patterns: leader → leader → swarm → council → leader\n`;
      }
      ctx += `### CTO Team Stability (v1.5.9)`;
      ctx += `\n- CC v2.1.64+ resolved 4 memory leaks in Agent Teams`;
      ctx += `\n- Long sessions (>2hr) benefit from periodic /clear`;
      ctx += `\n- Use ctrl+f to bulk-stop background agents when done\n`;
      ctx += `\n`;
    } else if (detectedLevel !== 'Starter') {
      ctx += `## CTO-Led Agent Teams (Not Enabled)\n`;
      ctx += `- Your ${detectedLevel} project supports CTO-Led Agent Teams\n`;
      ctx += `- CTO Lead (opus) orchestrates specialized teammates for parallel PDCA\n`;
      ctx += `- To enable: set \`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1\` environment variable\n`;
      ctx += `- Then use: \`/pdca team {feature}\`\n\n`;
    }
  } catch (e) {
    debugLog('SessionStart', 'Agent Teams detection skipped', { error: e.message });
  }

  return ctx;
}

/**
 * Build Output Styles and Memory Systems context section.
 * @param {string} detectedLevel - Current detected level
 * @returns {string} Context string
 */
function buildOutputStylesAndMemoryContext(detectedLevel) {
  let ctx = '';

  // Output Styles
  const levelStyleMap = {
    'Starter': 'bkit-learning',
    'Dynamic': 'bkit-pdca-guide',
    'Enterprise': 'bkit-enterprise'
  };
  const suggestedStyle = levelStyleMap[detectedLevel] || 'bkit-pdca-guide';
  ctx += `## Output Styles (v1.5.9)\n`;
  ctx += `- Recommended for ${detectedLevel} level: \`${suggestedStyle}\`\n`;
  ctx += `- Change anytime with \`/output-style\`\n`;
  ctx += `- Available: bkit-learning, bkit-pdca-guide, bkit-enterprise, bkit-pdca-enterprise\n`;
  ctx += `- If styles not visible in /output-style menu, run \`/output-style-setup\`\n\n`;

  // Memory Systems
  ctx += `## Memory Systems (v1.5.9)\n`;
  ctx += `### bkit Agent Memory (Auto-Active)\n`;
  ctx += `- 19 agents use project scope, 2 agents (starter-guide, pipeline-guide) use user scope\n`;
  ctx += `- No configuration needed\n`;
  ctx += `### Claude Code Auto-Memory\n`;
  ctx += `- Claude automatically saves useful context to \`~/.claude/projects/*/memory/MEMORY.md\`\n`;
  ctx += `- Manage with \`/memory\` command (view, edit, delete entries)\n`;
  ctx += `- bkit memory (\`.bkit/state/memory.json\`) and CC auto-memory are separate systems with no collision\n`;
  ctx += `- Tip: After PDCA completion, use \`/memory\` to save key learnings for future sessions\n\n`;

  return ctx;
}

/**
 * Build bkend MCP status context section.
 * @param {string} detectedLevel - Current detected level
 * @returns {string} Context string
 */
function buildBkendMcpContext(detectedLevel) {
  let ctx = '';

  if (detectedLevel !== 'Dynamic' && detectedLevel !== 'Enterprise') {
    return ctx;
  }

  try {
    const mcpJsonPath = path.join(process.cwd(), '.mcp.json');
    let bkendMcpConnected = false;
    if (fs.existsSync(mcpJsonPath)) {
      const mcpContent = fs.readFileSync(mcpJsonPath, 'utf-8');
      if (mcpContent.includes('bkend') || mcpContent.includes('api.bkend.ai')) {
        bkendMcpConnected = true;
      }
    }
    if (bkendMcpConnected) {
      ctx += `## bkend.ai MCP Status\n`;
      ctx += `- Status: Connected\n`;
      ctx += `- Use natural language to manage backend (DB, Auth, Storage)\n\n`;
    } else {
      ctx += `## bkend.ai MCP Status\n`;
      ctx += `- Status: Not configured\n`;
      ctx += `- Setup: \`claude mcp add bkend --transport http https://api.bkend.ai/mcp\`\n`;
      ctx += `- bkend.ai provides Database, Auth, Storage as BaaS\n\n`;
    }
  } catch (e) {
    debugLog('SessionStart', 'bkend MCP check skipped', { error: e.message });
  }

  return ctx;
}

/**
 * Build Enterprise batch workflow context section.
 * @param {string} detectedLevel - Current detected level
 * @returns {string} Context string
 */
function buildEnterpriseBatchContext(detectedLevel) {
  let ctx = '';

  if (detectedLevel !== 'Enterprise') return ctx;

  try {
    const pdcaStatusForBatch = getPdcaStatusFull();
    const activeFeatures = pdcaStatusForBatch?.activeFeatures || [];
    if (activeFeatures.length >= 2) {
      ctx += `## Multi-Feature PDCA (v1.5.9)\n`;
      ctx += `- Active features: ${activeFeatures.join(', ')}\n`;
      ctx += `- Use \`/batch\` for parallel processing of multiple features\n`;
      ctx += `- Enterprise batch supports concurrent Check/Act iterations\n\n`;
    }
  } catch (e) {
    debugLog('SessionStart', 'Batch suggestion skipped', { error: e.message });
  }

  return ctx;
}

/**
 * Build PDCA core rules context section.
 * @returns {string} Context string
 */
function buildPdcaCoreRules() {
  let ctx = '';

  ctx += `## PDCA Core Rules (Always Apply)\n`;
  ctx += `- New feature request → Check/create Plan/Design documents first\n`;
  ctx += `- After implementation → Suggest Gap analysis\n`;
  ctx += `- Gap Analysis < 90% → Auto-improvement with pdca-iterator\n`;
  ctx += `- Gap Analysis >= 90% → Suggest /simplify for code cleanup, then completion report\n`;
  ctx += `- After /simplify → Completion report with report-generator\n\n`;

  return ctx;
}

/**
 * Build automation features context section.
 * @param {string} triggerTable - Trigger keyword table from onboarding module
 * @returns {string} Context string
 */
function buildAutomationContext(triggerTable) {
  let ctx = '';

  ctx += triggerTable;
  ctx += `\n\n## v1.4.0 Automation Features\n`;
  ctx += `- 🎯 8-language auto-detection: EN, KO, JA, ZH, ES, FR, DE, IT\n`;
  ctx += `- 🤖 Implicit Agent/Skill triggers\n`;
  ctx += `- 📊 Ambiguity detection and clarifying question generation\n`;
  ctx += `- 🔄 Automatic PDCA phase progression\n\n`;
  ctx += `💡 Important: AI Agent is not perfect. Always verify important decisions.\n`;

  return ctx;
}

/**
 * Build version enhancements context section.
 * @param {string} detectedLevel - Current detected level
 * @returns {string} Context string
 */
function buildVersionEnhancementsContext(detectedLevel) {
  let ctx = '';

  // v1.5.9: Studio Support
  ctx += `\n## v1.5.9 Enhancements (Studio Support)\n`;
  ctx += `- Path Registry: centralized state file path management (lib/core/paths.js)\n`;
  ctx += `- State files migrated to \`.bkit/{state,runtime,snapshots}/\` structured directory\n`;
  ctx += `- Auto-migration from v1.5.7 legacy paths on SessionStart\n`;
  ctx += `- bkit memory path: \`.bkit/state/memory.json\` (was \`docs/.bkit-memory.json\`)\n`;
  ctx += `\n`;

  // v1.6.0: Skills 2.0
  ctx += `## v1.6.0 Enhancements (Skills 2.0 Integration)\n`;
  ctx += `- CC recommended version: v2.1.71 (stdin freeze fix, background agent recovery)\n`;
  ctx += `- Skills 2.0: context:fork native, frontmatter hooks, Skill Evals, Skill Classification\n`;
  ctx += `- 28 skills classified: 9 Workflow / 18 Capability / 1 Hybrid\n`;
  ctx += `- PDCA document template validation (PostToolUse hook, ENH-103)\n`;
  ctx += `- Skill Creator + A/B Testing framework (evals/ directory)\n`;
  ctx += `- /loop + Cron PDCA auto-monitoring (CC v2.1.71+)\n`;
  ctx += `- Hot reload: SKILL.md changes reflect without session restart\n`;
  ctx += `- Wildcard permissions: \`Bash(npm *)\`, \`Bash(git log*)\` patterns\n`;
  ctx += `- Background agent recovery: CTO Team bg agents reliable (CC v2.1.71+)\n`;
  ctx += `- PM Agent Team: /pdca pm {feature} for pre-Plan product discovery (5 PM agents)\n`;
  ctx += `- 37 consecutive CC compatible releases (v2.1.34~v2.1.71)\n`;
  ctx += `\n`;

  // v2.0.0: Full PDCA automation
  ctx += `## v2.0.0 Enhancements (AI Native Development OS)\n`;
  ctx += `- Declarative PDCA state machine (20 transitions, 9 guards)\n`;
  ctx += `- YAML workflow DSL (3 presets: default, hotfix, enterprise)\n`;
  ctx += `- L0-L4 controllable AI automation levels\n`;
  ctx += `- CLI dashboard: progress-bar, workflow-map, control-panel, agent-panel, impact-view\n`;
  ctx += `- Audit logging + decision tracing for full AI transparency\n`;
  ctx += `- Quality gates (7 stages) + metrics collector (M1-M10)\n`;
  ctx += `- Checkpoint/rollback per phase transition\n`;
  ctx += `- Destructive operation detector (8 rules) + blast radius analysis\n`;
  ctx += `- MCP servers: bkit-pdca (10 tools) + bkit-analysis (6 tools)\n`;
  ctx += `- Hook events: 18 in hooks.json (+6 new)\n`;
  ctx += `- 45 consecutive CC compatible releases (v2.1.34~v2.1.79)\n`;
  ctx += `\n`;

  // v1.5.7
  ctx += `## v1.5.7 Enhancements\n`;
  ctx += `- CC v2.1.63 HTTP hooks support: \`type: "http"\` in hooks config\n`;
  ctx += `- 13 memory leak fixes for stable long CTO Team sessions\n`;
  ctx += `- /simplify integration in PDCA Check→Report flow\n`;
  if (detectedLevel === 'Enterprise') {
    ctx += `- /batch multi-feature PDCA for Enterprise workflows\n`;
  }
  ctx += `\n`;

  return ctx;
}

/**
 * Build Executive Summary output rule section.
 * @returns {string} Context string
 */
function buildExecutiveSummaryRule() {
  return `

## Executive Summary Output Rule (v1.6.0 - Required after PDCA document work)

**Rule: After completing PDCA document work (/pdca plan, /pdca design, /pdca report, /plan-plus), you MUST output the Executive Summary table in your response.**

### When to output:
- After /pdca plan completes (Plan document created/updated)
- After /pdca design completes (Design document created/updated)
- After /pdca report completes (Report document created/updated)
- After /plan-plus completes (Plan Plus document created)
- After any PDCA document update that includes an Executive Summary section

### What to output:
Extract and display the Executive Summary section from the document, including:
1. **Project overview table** (Feature, dates, duration)
2. **Results summary** (Match Rate, items, files, lines)
3. **Value Delivered 4-perspective table** (Problem / Solution / Function UX Effect / Core Value)

### Why:
Users should see the summary immediately in the response without having to open the file. This is the same principle as bkit Feature Usage — mandatory inline output for key information.

### Position:
- Output Executive Summary BEFORE the bkit Feature Usage report
- Both are required: Executive Summary (after document work) + Feature Usage (always)
`;
}

/**
 * Build Feature Usage report rule section.
 * @returns {string} Context string
 */
function buildFeatureUsageRule() {
  return `

## 📊 bkit Feature Usage Report (v1.5.9 - Required for all responses)

**Rule: Include the following format at the end of every response to report bkit feature usage.**

\`\`\`
─────────────────────────────────────────────────
📊 bkit Feature Usage
─────────────────────────────────────────────────
✅ Used: [bkit features used in this response]
⏭️ Not Used: [Major unused features] (reason)
💡 Recommended: [Features suitable for next task]
─────────────────────────────────────────────────
\`\`\`

### bkit Features to Report:

**1. PDCA Skill (Priority) - Unified PDCA Management:**
/pdca plan, /pdca design, /pdca do, /pdca analyze, /pdca iterate, /pdca report, /pdca status, /pdca next

**2. Task System (Priority):**
TaskCreate, TaskUpdate, TaskList, TaskGet

**3. Agents (Priority):**
gap-detector, pdca-iterator, code-analyzer, report-generator, starter-guide, design-validator, qa-monitor, pipeline-guide, bkend-expert, enterprise-expert, infra-architect

**4. Core Skills (21):**
- **PDCA**: /pdca (plan, design, do, analyze, iterate, report, status, next)
- **Level**: /starter, /dynamic, /enterprise
- **Pipeline**: /development-pipeline (start, next, status)
- **Phase**: /phase-1-schema ~ /phase-9-deployment
- **Utility**: /code-review, /zero-script-qa, /claude-code-learning, /mobile-app, /desktop-app, /bkit-templates, /bkit-rules

**5. Tools (when relevant):**
AskUserQuestion, SessionStart Hook, Read, Write, Edit, Bash

### Reporting Rules:

1. **Required**: Report at the end of every response (incomplete without report)
2. **Used features**: List bkit features actually used in this response
3. **Unused explanation**: Briefly explain why major features were not used
4. **Recommendation**: Suggest next skill based on current PDCA phase

### PDCA Phase Recommendations:

| Current Status | Recommended Skill |
|----------------|-------------------|
| No PDCA | "Start with /pdca plan {feature}" |
| Plan completed | "Design with /pdca design {feature}" |
| Design completed | "Start implementation or /pdca do {feature}" |
| Do completed | "Gap analysis with /pdca analyze {feature}" |
| Check < 90% | "Auto-improve with /pdca iterate {feature}" |
| Check ≥ 90% | "Completion report with /pdca report {feature}" |

`;
}

/**
 * Build the full additionalContext string for the SessionStart hook response.
 * @param {object} _input - Hook input (unused, reserved for future use)
 * @param {object} context - Context from onboarding module { onboardingData, triggerTable }
 * @returns {string} The complete additionalContext string
 */
function build(_input, context) {
  const { onboardingData, triggerTable } = context;
  const detectedLevel = detectLevel();

  let additionalContext = `# bkit Vibecoding Kit v2.0.3 - Session Startup\n\n`;

  additionalContext += buildOnboardingContext(onboardingData);
  additionalContext += buildAgentTeamsContext(detectedLevel);
  additionalContext += buildOutputStylesAndMemoryContext(detectedLevel);
  additionalContext += buildBkendMcpContext(detectedLevel);
  additionalContext += buildEnterpriseBatchContext(detectedLevel);
  additionalContext += buildPdcaCoreRules();
  additionalContext += buildAutomationContext(triggerTable);
  additionalContext += buildVersionEnhancementsContext(detectedLevel);
  additionalContext += buildExecutiveSummaryRule();
  additionalContext += buildFeatureUsageRule();

  return additionalContext;
}

module.exports = { build };
