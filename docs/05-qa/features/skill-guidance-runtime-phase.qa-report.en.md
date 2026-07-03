# QA Report — Runtime-Phase-Aware Skill Guidance (Issue #135, v2.1.28)

> Phase: QA · Method: real production hook entrypoints (`--plugin-dir .` session)
> + full contract gate suite + main-baseline regression diff.

## 1. Production-entrypoint QA (the exact code CC runs)

Payloads piped to the real hook scripts via stdin, as Claude Code does.

### SLASH path — `scripts/user-prompt-expansion-handler.js`

| Invocation | stdout guidance | Verdict |
|---|---|---|
| `/bkit:pdca plan login` | `Next: /pdca design login — Design the architecture.` | ✅ fixed (was empty) |
| `/bkit:pdca do login` | `Next: /pdca analyze login …` + `Suggested agent: gap-detector …` | ✅ |
| `/bkit:sprint status` | `Next: /sprint phase <id> --to plan …` | ✅ |
| `/bkit:control level` | (empty) | ✅ intended silence |

### MODEL path — `scripts/skill-post.js`

| Invocation | JSON output | Verdict |
|---|---|---|
| `bkit:pdca` args `do login` | `nextSkill: "pdca analyze login"` + `suggestedAgent: gap-detector` | ✅ fixed |
| `bkit:deploy` | `suggestedAgent: gap-detector` (English) | ✅ unchanged path, i18n'd |

Both invocation paths now surface runtime guidance for the flagship routers.

## 2. Contract / release gates (local, = CI steps)

| Gate | Result |
|---|---|
| `check-domain-purity.js` | ✅ 0 forbidden imports |
| `check-deadcode.js` | ✅ 195 modules, 0 dead |
| `check-guards.js` | ✅ 24 guards |
| `validate-plugin.js --strict` | ✅ 0 errors (44 skills / 34 agents / 2 cmds) |
| `docs-code-sync.js` | ✅ all counts consistent |
| `test/contract/integration-runtime.test.js` | ✅ 23/23 |
| `test/contract/l2-smoke.test.js` | ✅ 105/105 |
| `test/contract/invocation-inventory.test.js` | ✅ 213/213 |
| `test/contract/docs-code-sync.test.js` | ✅ 36/36 |
| `tests/qa/bkit-full-system.test.js` | ✅ 36 (version bump pending) |

## 3. Targeted + baseline regression

- New `issue-135-multiaction-guidance.test.js`: **23/23**.
- `skill-orchestrator.test.js` (6 KO→EN updated): **46/46**.
- `issue-132-slash-reach`: **7/7**; `skill-invocation-effects`: **5/5**.
- **Broad suite baseline diff** (`run-all.js --unit --regression`): main =
  `2003 PASS / 40 FAIL`; with fix = `2003 PASS / 40 FAIL` — **identical → zero
  regressions introduced**. The 40 pre-existing failures are stale run-all.js
  registrations (e.g. `context-loader`, `impact-analyzer`, `invariant-checker`,
  `scenario-runner` — files absent) unrelated to this change and not part of the
  CI gate suite. Reported as-is; out of scope for #135.

## 4. Verdict

**QA PASS.** The #135 symptom is resolved at both real production entrypoints;
all CI gates green; zero regressions vs main baseline. Ready for Docs=Code sync +
version bump to v2.1.28.
