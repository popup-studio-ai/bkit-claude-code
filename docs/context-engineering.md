# Context Engineering Guide

> bkit plugin internal guide for Claude Code context management.
> Documents hook output budgets, SessionStart dedup strategy, and
> ADR-style limitations that cannot be expressed in JSON configs.

---

## 1. Hook Output Budget

Claude Code enforces a **10,000-character cap** on all hook-injected context
(`additionalContext`, `systemMessage`, plain stdout). Output exceeding this
limit is **saved to a file and replaced with a preview and file path**, not
re-injected verbatim.

Source: https://code.claude.com/docs/en/hooks

### bkit Defensive Cap (ENH-240)

bkit applies a **hard cap of 8,000 characters** (CC 10,000 minus a 2,000-char
safety margin) via `lib/core/context-budget.js` → `applyBudget()`. When the cap
is exceeded, priority sections (MANDATORY, onboarding, AskUserQuestion markers)
are preserved first, then remaining sections are filled in document order
until the budget is exhausted. A truncation notice is appended.

Users can tune this via `bkit.config.json`:

```json
{
  "ui": {
    "contextInjection": {
      "maxChars": 8000,
      "priorityPreserve": ["MANDATORY", "Previous Work Detected"]
    }
  }
}
```

Disable the cap with `"maxChars": 999999` if you are certain your session
will never exceed 10,000 chars (not recommended).

---

## 2. SessionStart `once: true` — Known Limitation (ENH-244)

`hooks/hooks.json:7` declares `"once": true` on the SessionStart hook group,
but this field has documented behavior only for **skills-level hooks** (per
CC official docs). For settings-level hooks (which is bkit's case), real-world
behavior observed through v2.1.110:

1. **Initial SessionStart**: executes once as intended.
2. **PreCompact re-fire**: CC re-invokes SessionStart after context compaction
   without distinguishing `source: "compact"`, bypassing `once`.
3. **PostCompact re-fire**: same as above in some scenarios.

This causes the same ~12KB `additionalContext` to be injected 2–3 times per
session (reported in bkit Issue #81, confirmed by CC Issue #14281 CLOSED).

### bkit Defense (ENH-239)

bkit v2.1.8 introduces a **SHA-256 fingerprint dedup lock** at
`lib/core/session-ctx-fp.js`, storing per-session fingerprints at
`.bkit/runtime/session-ctx-fp.json` with:

- **TTL**: 1 hour (stale entries are treated as misses)
- **Session isolation**: keyed by `CLAUDE_SESSION_ID` (falls back to `"default"`)
- **GC**: 30-day stale eviction + 100-entry LRU cap
- **Atomic write**: `.pid.ts.tmp` + `rename` (session-title-cache.js convention)

When a duplicate fingerprint is detected within TTL, `additionalContext` is
cleared (empty string) — the hook response metadata (sessionTitle,
hookSpecificOutput) is preserved so `/rename` and status updates still flow.

### Related Issues

- [bkit Issue #81](https://github.com/popup-studio-ai/bkit-claude-code/issues/81) — SessionStart 12KB re-injection
- [CC Issue #14281](https://github.com/anthropics/claude-code/issues/14281) — additionalContext duplicate (CLOSED)
- [CC Issue #15174](https://github.com/anthropics/claude-code/issues/15174) — `matcher: "compact"` inject failure (CLOSED duplicate)
- [CC Issue #17407](https://github.com/anthropics/claude-code/issues/17407) — Phantom Reads (`<persisted-output>` canonical term)

### Future Work

If CC officially documents `once` for settings-level hooks and guarantees
compaction-aware behavior, ENH-239 can be reconsidered for removal. Track
this via ENH-241 (Docs=Code cross-verification scheme).

---

## 3. contextInjection Opt-Out (ENH-238)

`bkit.config.json` → `ui.contextInjection` exposes a 3-way toggle mirroring
`ui.dashboard`:

| Field | Type | Default | Purpose |
|---|---|---|---|
| `enabled` | boolean | `true` | Master switch. `false` → SessionStart returns header only. |
| `sections` | string[] | 8 builders | Per-section opt-in. Empty array = header only. |
| `ambiguityThreshold` | number | `0.7` | UserPromptSubmit ambiguity heuristic (unchanged). |
| `maxChars` | number | `8000` | ENH-240 hard cap (stripAnsi basis). |
| `priorityPreserve` | string[] | 4 markers | Keywords marking sections never truncated. |

Valid section keys (v2.1.8): `onboarding`, `agentTeams`, `outputStyles`,
`bkendMcp`, `enterpriseBatch`, `pdcaCoreRules`, `automation`,
`versionEnhancements`.

When `enabled: false`, bkit still emits `sessionTitle` and
`hookSpecificOutput.primaryFeature/currentPhase`, so `/pdca status` and
statusline integration continue to work.
