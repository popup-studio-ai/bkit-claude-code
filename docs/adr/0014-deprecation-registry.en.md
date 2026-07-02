# ADR 0014 — Deprecation Registry: tombstones off the prompt surface

> **Status**: Accepted (2026-07-02)
> **Issue**: [#128](https://github.com/popup-studio-ai/bkit-claude-code/issues/128) (v2.1.25)
> **Context**: 6 `pdca-eval-*` deprecation stub agents in `agents/`
> **Supersedes/relates**: ENH-336 (v2.1.22 S4 permanent-retention decision, ADR-adjacent lock in `lib/domain/rules/docs-code-invariants.js`); ADR 0010 (effort-aware invariant); `docs/06-guide/contract-baseline-rollforward.guide.md` §5.

---

## 1. Context

Since v2.1.17, six deprecated `pdca-eval-{act,check,design,do,plan,pm}` agents were kept as live stub `.md` files in `agents/` solely to satisfy the L4 Deprecation Detection contract gate (`contract-test-run.js runL4Deprecation()`) against the immutable v2.1.9 LTS and v2.1.16 Latest baselines. Issue #128 identified that these stubs are not free:

- **Always-resident prompt cost**: the 6 stub descriptions total ~1,387 bytes that Claude Code loads into every session's agent inventory — pure overhead for agents that MUST NOT be invoked.
- **No per-agent disable**: Claude Code offers no mechanism to register an agent definition while excluding it from the model-visible surface. A stub file *is* a live, spawnable agent.
- **Misleading tool grant rendering**: the stubs declare `tools: []`, but CC renders an empty tools array as **"(Tools: All tools)"** in the agent listing — the exact opposite of the intended "no capability" signal, and an invitation for accidental invocation with full tool access.

Meanwhile, ENH-336 (v2.1.22 S4) had CONFIRMED RETENTION of the stubs on two premises: (a) deleting them breaks L4 on both baselines, and (b) avoiding that would require mutating the immutable historical baselines.

## 2. Decision

**Replace live stub files with a machine-readable deprecation registry** at `test/contract/deprecation-registry.json`, and delete the 6 stub `.md` files from `agents/`.

- `contract-test-run.js` gains `loadDeprecationRegistry()` (rooted at the same `PROJECT_ROOT` / `--project-root` mechanism as everything else; returns `{}` when the file is absent). In the L4 agents branch, a registry entry carrying `deprecatedIn` is accepted as **equivalent to a live stub** with `deprecatedIn` frontmatter.
- Baseline JSONs (v2.1.9, v2.1.16) remain byte-for-byte untouched.
- `EXPECTED_DEPRECATED_AGENT_NAMES` in `lib/domain/rules/docs-code-invariants.js` stays as the SoT mirror of the registry's agent keys; `EXPECTED_COUNTS.agents` stays 34 (active only).

**This ADR supersedes ENH-336 on its own terms**: both retention premises are dissolved — (a) L4 no longer requires a live stub file because the registry tombstone satisfies it, and (b) no baseline mutation is needed. The governance *intent* of ENH-336 (never silently lose deprecation history) is preserved; only the storage medium moves off the prompt surface.

## 3. Consequences

**Positive**
- ~1,387 B of dead prompt surface removed from every session; 6 non-invokable-but-spawnable agents can no longer be spawned at all.
- The "(Tools: All tools)" misrendering disappears with the stubs.
- Deprecation metadata is now structured JSON (queryable by tests and tooling) instead of frontmatter scattered across 6 files.
- `agents/` contains exactly the 34 active agents — directory listing equals the live surface.

**Negative / limits**
- Deprecation history is no longer discoverable by browsing `agents/` — readers must know about the registry (mitigated by pointers in `docs-code-invariants.js`, guide §5.6, and this ADR).
- One more file the L4 gate depends on; a malformed registry would surface as an L4 failure.

## 4. Registry Schema

```json
{
  "version": 1,
  "agents": {
    "<agent-name>": {
      "deprecatedIn": "vX.Y.Z",
      "replacedBy": "<successor-agent>",
      "reason": "<one-line migration rationale>",
      "deprecationCommit": "<short-sha>",
      "stubRemovedIn": "vX.Y.Z",
      "issue": "#<n>"
    }
  },
  "skills": {},
  "mcpTools": {}
}
```

`skills` and `mcpTools` are reserved for the same pattern (skill/MCP-tool tombstones currently still use frontmatter / baseline-JSON `deprecatedIn` respectively).

## 5. Verification

- `node test/contract/scripts/contract-test-run.js --compare v2.1.9 --level L1,L4` — PASS with stubs deleted.
- `node test/contract/scripts/contract-test-run.js --compare v2.1.16 --level L1,L4` — PASS with stubs deleted.
- `node test/contract/agent-deprecation.test.js` — 6/6, including the new `registry-tombstone` fixture (baseline agent removed + registry entry + no stub → PASS) and the `missing-stub` fixture still FAILING (no stub AND no registry entry).
- `node test/contract/invocation-inventory.test.js` — registry has exactly the 6 agent entries, each `agents/<name>.md` absent, registry keys deep-equal `EXPECTED_DEPRECATED_AGENT_NAMES`.
- `node test/regression/agents-21.test.js` / `agents-effort.test.js` / `agents-31.test.js` — stub entries removed (fixes 6 pre-existing AE-09..14 failures).

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-07-02 | Initial ADR (issue #128, v2.1.25) | kay |
