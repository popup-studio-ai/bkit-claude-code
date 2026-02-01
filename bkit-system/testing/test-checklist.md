# Test Checklist

> Test checklist for verifying bkit features
>
> **v1.5.0**: Claude Code Exclusive - Gemini CLI tests removed

## Test Objectives

1. **Hook Trigger Verification**: Verify hooks fire at expected times
2. **Script Output Verification**: Verify correct JSON is output
3. **Scenario Verification**: Confirm expected behavior per user scenario

---

## 1. PreToolUse Hooks Tests

### 1.1 bkit-rules (pre-write.js - unified hook)

| # | Test Case | Expected Result | Pass |
|---|-----------|-----------------|------|
| 1.1.1 | src/features/auth/login.ts Write (design doc exists) | "Reference design doc" guidance | [ ] |
| 1.1.2 | src/features/auth/login.ts Write (no design doc) | Empty output | [ ] |
| 1.1.3 | src/features/auth/login.ts Write (only plan doc exists) | "Create design first" warning | [ ] |
| 1.1.4 | README.md Write | Empty output (docs file) | [ ] |
| 1.1.5 | src/lib/utils.ts Write | Empty output (not a feature) | [ ] |

### 1.1.1 Multi-Language Support (v1.2.1)

| # | Test Case | Expected Result | Pass |
|---|-----------|-----------------|------|
| 1.1.6 | internal/auth/handler.go Write | Source file detected (Go) | [ ] |
| 1.1.7 | app/routers/users.py Write | Source file detected (Python) | [ ] |
| 1.1.8 | src/main.rs Write | Source file detected (Rust) | [ ] |
| 1.1.9 | packages/api/index.ts Write | Source file detected (Monorepo) | [ ] |
| 1.1.10 | node_modules/pkg/index.js Write | Empty output (exclude pattern) | [ ] |
| 1.1.11 | __pycache__/module.py Write | Empty output (exclude pattern) | [ ] |

### 1.1.2 Language Tier Detection (v1.2.1)

| # | Test Case | Expected Result | Pass |
|---|-----------|-----------------|------|
| 1.1.12 | get_language_tier "test.py" | "1" (Tier 1 - AI-Native) | [ ] |
| 1.1.13 | get_language_tier "test.ts" | "1" (Tier 1 - AI-Native) | [ ] |
| 1.1.14 | get_language_tier "test.go" | "2" (Tier 2 - Mainstream) | [ ] |
| 1.1.15 | get_language_tier "test.dart" | "2" (Tier 2 - Mainstream) | [ ] |
| 1.1.16 | get_language_tier "test.astro" | "2" (Tier 2 - Mainstream) | [ ] |
| 1.1.17 | get_language_tier "test.java" | "3" (Tier 3 - Domain) | [ ] |
| 1.1.18 | get_language_tier "test.php" | "4" (Tier 4 - Legacy) | [ ] |
| 1.1.19 | get_language_tier "test.mojo" | "experimental" | [ ] |
| 1.1.20 | get_language_tier "test.unknown" | "unknown" | [ ] |

### 1.1.3 New Extension Support (v1.2.1)

| # | Test Case | Expected Result | Pass |
|---|-----------|-----------------|------|
| 1.1.21 | is_code_file "app.dart" | true (Flutter/Dart) | [ ] |
| 1.1.22 | is_code_file "page.astro" | true (Astro) | [ ] |
| 1.1.23 | is_code_file "doc.mdx" | true (MDX) | [ ] |
| 1.1.24 | is_code_file "ai.mojo" | true (Mojo) | [ ] |
| 1.1.25 | is_code_file "sys.zig" | true (Zig) | [ ] |
| 1.1.26 | is_ui_file "Hero.astro" | true (Astro UI) | [ ] |

### 1.2 Task Classification (integrated in pre-write.js)

> **Note**: Task classification is now integrated into `pre-write.js` (v1.2.0)

| # | Test Case | Expected Result | Pass |
|---|-----------|-----------------|------|
| 1.2.1 | 30 char modification | "Quick Fix" (no PDCA) | [ ] |
| 1.2.2 | 100 char modification | "Minor Change" (check /pdca-status) | [ ] |
| 1.2.3 | 500 char modification | "Feature" (design doc recommended) | [ ] |
| 1.2.4 | 1500 char modification | "Major Feature" (design doc required, may block) | [ ] |
| 1.2.5 | docs/README.md modification | Empty output (outside src/) | [ ] |

### 1.3 Convention Hints (integrated in pre-write.js)

| # | Test Case | Expected Result | Pass |
|---|-----------|-----------------|------|
| 1.3.1 | .ts file Write | TypeScript convention guidance | [ ] |
| 1.3.2 | .tsx file Write | TypeScript convention guidance | [ ] |
| 1.3.3 | .env file Write | Environment variable convention guidance | [ ] |
| 1.3.4 | .md file Write | Empty output | [ ] |

### 1.4 zero-script-qa (qa-pre-bash.js)

| # | Test Case | Expected Result | Pass |
|---|-----------|-----------------|------|
| 1.4.1 | `docker compose logs -f` | Allow | [ ] |
| 1.4.2 | `rm -rf /tmp/*` | Block | [ ] |
| 1.4.3 | `DROP TABLE users` | Block | [ ] |
| 1.4.4 | `ls -la` | Allow | [ ] |

### 1.5 phase-9-deployment (phase9-deploy-pre.js)

| # | Test Case | Expected Result | Pass |
|---|-----------|-----------------|------|
| 1.5.1 | `vercel deploy` (.env.example exists) | Allow + "✅ Check complete" | [ ] |
| 1.5.2 | `vercel deploy` (no .env.example) | Allow + "⚠️ Check needed" | [ ] |
| 1.5.3 | `npm install` | Empty output (not deployment) | [ ] |

---

## 2. PostToolUse Hooks Tests

### 2.1 bkit-rules (pdca-post-write.js)

| # | Test Case | Expected Result | Pass |
|---|-----------|-----------------|------|
| 2.1.1 | src/features/auth/ Write (design doc exists) | "/pdca-analyze recommended" | [ ] |
| 2.1.2 | src/features/auth/ Write (no design doc) | Empty output | [ ] |
| 2.1.3 | src/lib/utils.ts Write | Empty output | [ ] |

### 2.2 phase-5-design-system (phase5-design-post.js)

> **Note**: Extension-based detection (v1.2.1) - .tsx, .jsx, .vue, .svelte

| # | Test Case | Expected Result | Pass |
|---|-----------|-----------------|------|
| 2.2.1 | components/Button.tsx Write (hardcoded colors) | "⚠️ Use design tokens" warning | [ ] |
| 2.2.2 | components/Button.tsx Write (no hardcoding) | "✅ Design tokens correct" | [ ] |
| 2.2.3 | src/lib/api.ts Write | Empty output (.ts is not UI) | [ ] |
| 2.2.4 | src/App.vue Write (hardcoded colors) | "⚠️ Use design tokens" warning | [ ] |
| 2.2.5 | src/Button.svelte Write | UI file detected | [ ] |

### 2.3 phase-6-ui-integration (phase6-ui-post.js)

> **Note**: Extension-based UI detection (v1.2.1) + path-based layer detection

| # | Test Case | Expected Result | Pass |
|---|-----------|-----------------|------|
| 2.3.1 | pages/login.tsx Write | "UI Layer Check" guidance | [ ] |
| 2.3.2 | features/auth/LoginForm.tsx Write | "UI Layer Check" guidance | [ ] |
| 2.3.3 | services/authService.ts Write | "Service Layer Check" guidance | [ ] |
| 2.3.4 | lib/utils.ts Write | Empty output | [ ] |
| 2.3.5 | src/components/Modal.vue Write | "UI Layer Check" guidance | [ ] |
| 2.3.6 | src/Card.svelte Write | "UI Layer Check" guidance | [ ] |

### 2.4 qa-monitor (qa-monitor-post.js)

| # | Test Case | Expected Result | Pass |
|---|-----------|-----------------|------|
| 2.4.1 | QA report Write (Critical exists) | "🚨 Critical detected, /pdca-iterate recommended" | [ ] |
| 2.4.2 | QA report Write (no Critical) | "✅ No critical issues" | [ ] |
| 2.4.3 | Regular file Write | Empty output | [ ] |

---

## 3. Stop Hooks Tests

| # | Skill | Test Method | Expected Result | Pass |
|---|-------|-------------|-----------------|------|
| 3.1 | phase-4-api | After API work completion | "Zero Script QA guidance" | [ ] |
| 3.2 | phase-8-review | After review work completion | "Review completion summary" | [ ] |
| 3.3 | bkit-templates (via gap-detector) | After gap analysis completion | "Analysis result guidance" | [ ] |
| 3.4 | zero-script-qa | QA session end | "Next steps guidance" | [ ] |

---

## 4. SessionStart Hook Tests

| # | Test Case | Expected Result | Pass |
|---|-----------|-----------------|------|
| 4.1 | New session start | session-start.js executes, greeting message | [ ] |
| 4.2 | once: true setting | Executes only once | [ ] |

---

## 5. Skill Activation Tests

### 5.1 Keyword Matching

| # | User Input | Expected Activated Skill | Pass |
|---|------------|--------------------------|------|
| 5.1.1 | "Create a static website" | starter | [ ] |
| 5.1.2 | "Implement login feature" | dynamic, phase-4-api | [ ] |
| 5.1.3 | "Set up Kubernetes deployment" | enterprise, phase-9-deployment | [ ] |
| 5.1.4 | "Design the API" | phase-4-api | [ ] |
| 5.1.5 | "Build a design system" | phase-5-design-system | [ ] |
| 5.1.6 | "Run gap analysis" | bkit-templates, gap-detector agent | [ ] |
| 5.1.7 | "Do QA" | zero-script-qa | [ ] |

### 5.2 Level Detection

| # | Project Structure | Detected Level | Pass |
|---|-------------------|----------------|------|
| 5.2.1 | Only index.html exists | Starter | [ ] |
| 5.2.2 | package.json + bkend config | Dynamic | [ ] |
| 5.2.3 | kubernetes/ + terraform/ | Enterprise | [ ] |
| 5.2.4 | "Level: Dynamic" in CLAUDE.md | Dynamic | [ ] |

---

## 6. Agent Auto-Invoke Tests

| # | Condition | Invoked Agent | Pass |
|---|-----------|---------------|------|
| 6.1 | Level=Starter + coding request | starter-guide | [ ] |
| 6.2 | Level=Dynamic + backend work | bkend-expert | [ ] |
| 6.3 | Level=Enterprise + architecture | enterprise-expert | [ ] |
| 6.4 | "Do code review" | code-analyzer | [ ] |
| 6.5 | "Do gap analysis" | gap-detector | [ ] |
| 6.6 | "Do QA" | qa-monitor | [ ] |
| 6.7 | After implementation complete | Gap Analysis suggestion | [ ] |
| 6.8 | After gap analysis < 70% | pdca-iterator suggestion | [ ] |

---

## 7. Scenario Integration Tests

### 7.1 New Feature Implementation Full Flow

```
1. "Create login feature" request
2. Check design doc → suggest creation if missing
3. Verify Write hooks fire during implementation
4. Suggest Gap Analysis after implementation complete
5. Suggest iterate or report after analysis
```

| # | Step | Verification Item | Pass |
|---|------|-------------------|------|
| 7.1.1 | Request | bkit-rules skill activated | [ ] |
| 7.1.2 | Doc check | Check design doc existence | [ ] |
| 7.1.3 | Write | pdca-pre-write fires | [ ] |
| 7.1.4 | Write | task-classify fires | [ ] |
| 7.1.5 | After Write | pdca-post-write fires | [ ] |
| 7.1.6 | Complete | Gap Analysis suggestion | [ ] |

### 7.2 Zero Script QA Full Flow

```
1. "/zero-script-qa" request
2. Docker environment check
3. Log monitoring
4. Issue detection and reporting
5. Report generation
```

| # | Step | Verification Item | Pass |
|---|------|-------------------|------|
| 7.2.1 | Request | zero-script-qa skill activated | [ ] |
| 7.2.2 | Bash | qa-pre-bash fires | [ ] |
| 7.2.3 | Report Write | qa-monitor-post fires | [ ] |
| 7.2.4 | End | qa-stop fires | [ ] |

---

## Test Execution Methods

### Script Unit Tests

```bash
# Direct script execution (scripts are at root level, not in .claude/)
echo '{"tool_input":{"file_path":"src/features/auth/login.ts","content":"test"}}' | \
  scripts/pre-write.js
```

### Integration Tests

```bash
# Execute actual scenarios in Claude Code session
# 1. Start new session
# 2. Enter test case input
# 3. Verify expected behavior
```

---

## 8. v1.4.3 Compatibility Tests

### 8.1 xmlSafeOutput() Function Tests

| # | Test Case | Input | Expected Output | Pass |
|---|-----------|-------|-----------------|------|
| 8.1.1 | Basic text | `"Hello World"` | `"Hello World"` | [ ] |
| 8.1.2 | Ampersand | `"A & B"` | `"A &amp; B"` | [ ] |
| 8.1.3 | Less than | `"<tag>"` | `"&lt;tag&gt;"` | [ ] |
| 8.1.4 | Double quote | `"\"quoted\""` | `"&quot;quoted&quot;"` | [ ] |
| 8.1.5 | Single quote | `"'test'"` | `"&#39;test&#39;"` | [ ] |
| 8.1.6 | Complex | `"<a href=\"test\">A & B</a>"` | Fully escaped | [ ] |
| 8.1.7 | Null input | `null` | `null` | [ ] |
| 8.1.8 | Empty string | `""` | `""` | [ ] |

### 8.2 Hook Output Safety Tests

| # | Test Case | Expected Result | Pass |
|---|-----------|-----------------|------|
| 8.2.1 | outputAllow with special chars | Properly escaped in additionalContext | [ ] |
| 8.2.2 | outputBlock with special chars | Properly escaped in reason | [ ] |
| 8.2.3 | session-start.js dynamic content | Feature name & phase properly handled | [ ] |

> **Note (v1.5.0)**: Gemini CLI tests removed - bkit is now Claude Code exclusive.

---

## Related Documents

- [[../triggers/trigger-matrix]] - Trigger matrix
- [[../scenarios/scenario-write-code]] - Code write scenario
- [[../scenarios/scenario-new-feature]] - New feature scenario
- [[../scenarios/scenario-qa]] - QA scenario
