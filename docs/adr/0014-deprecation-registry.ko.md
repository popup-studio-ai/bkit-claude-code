# ADR 0014 — Deprecation Registry: 무덤(tombstone)을 프롬프트 표면 밖으로

> **Status**: Accepted (2026-07-02)
> **Issue**: [#128](https://github.com/popup-studio-ai/bkit-claude-code/issues/128) (v2.1.25)
> **Context**: `agents/` 내 6개 `pdca-eval-*` deprecation stub 에이전트
> **Supersedes/relates**: ENH-336 (v2.1.22 S4 영구 보존 결정, `lib/domain/rules/docs-code-invariants.js`의 governance lock); ADR 0010 (effort-aware invariant); `docs/06-guide/contract-baseline-rollforward.guide.md` §5.

---

## 1. Context

v2.1.17 이후, deprecated된 6개 `pdca-eval-{act,check,design,do,plan,pm}` 에이전트는 불변 baseline(v2.1.9 LTS, v2.1.16 Latest) 대비 L4 Deprecation Detection contract gate(`contract-test-run.js runL4Deprecation()`)를 통과시키기 위한 목적만으로 `agents/`에 live stub `.md` 파일로 유지되어 왔다. Issue #128은 이 stub들이 공짜가 아님을 확인했다:

- **상시 상주 프롬프트 비용**: 6개 stub description 합계 약 1,387바이트가 매 세션의 에이전트 인벤토리에 로드됨 — 절대 호출되어서는 안 되는 에이전트를 위한 순수 오버헤드.
- **에이전트별 비활성화 불가**: Claude Code는 에이전트 정의를 등록하되 모델 가시 표면에서 제외하는 메커니즘을 제공하지 않는다. stub 파일은 그 자체로 spawn 가능한 live 에이전트다.
- **오해를 부르는 tool 권한 렌더링**: stub은 `tools: []`를 선언하지만, CC는 빈 tools 배열을 에이전트 목록에서 **"(Tools: All tools)"**로 렌더링한다 — 의도한 "no capability" 신호와 정반대이며, 전체 tool 권한으로의 우발적 호출을 유도한다.

한편 ENH-336(v2.1.22 S4)은 두 가지 전제로 stub 보존(CONFIRMED RETENTION)을 결정했었다: (a) 삭제 시 두 baseline 모두에서 L4가 깨진다, (b) 이를 피하려면 불변 historical baseline을 변경해야 한다.

## 2. Decision

**live stub 파일을 기계 판독 가능한 deprecation registry로 대체**하고(`test/contract/deprecation-registry.json`), 6개 stub `.md` 파일을 `agents/`에서 삭제한다.

- `contract-test-run.js`에 `loadDeprecationRegistry()` 추가 (기존과 동일한 `PROJECT_ROOT` / `--project-root` 메커니즘 기반; 파일 부재 시 `{}` 반환). L4 agents 분기에서 `deprecatedIn`을 가진 registry 항목을 `deprecatedIn` frontmatter를 가진 **live stub과 동등**하게 인정한다.
- Baseline JSON(v2.1.9, v2.1.16)은 바이트 단위로 그대로 유지한다.
- `lib/domain/rules/docs-code-invariants.js`의 `EXPECTED_DEPRECATED_AGENT_NAMES`는 registry agent 키의 SoT 미러로 유지; `EXPECTED_COUNTS.agents`는 34(active만)로 유지.

**본 ADR은 ENH-336을 그 자신의 논리 위에서 대체(supersede)한다**: 보존의 두 전제가 모두 해소되었다 — (a) registry tombstone이 L4를 만족시키므로 live stub 파일이 더 이상 필요 없고, (b) baseline 변경도 필요 없다. ENH-336의 governance *의도*(deprecation 이력을 조용히 잃지 않는다)는 보존되며, 저장 매체만 프롬프트 표면 밖으로 이동한다.

## 3. Consequences

**긍정**
- 매 세션에서 약 1,387B의 죽은 프롬프트 표면 제거; 호출 금지지만 spawn 가능했던 6개 에이전트가 아예 spawn 불가능해짐.
- stub과 함께 "(Tools: All tools)" 오렌더링도 사라짐.
- deprecation 메타데이터가 6개 파일에 흩어진 frontmatter 대신 구조화된 JSON(테스트/도구가 쿼리 가능)이 됨.
- `agents/`에는 정확히 34개 active 에이전트만 존재 — 디렉터리 목록이 곧 live 표면.

**부정 / 한계**
- `agents/` 탐색만으로는 deprecation 이력을 발견할 수 없음 — registry의 존재를 알아야 함 (`docs-code-invariants.js`, 가이드 §5.6, 본 ADR의 포인터로 완화).
- L4 gate가 의존하는 파일이 하나 늘어남; registry가 손상되면 L4 실패로 표면화됨.

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

`skills`와 `mcpTools`는 동일 패턴을 위해 예약됨 (skill/MCP tool tombstone은 현재 각각 frontmatter / baseline-JSON `deprecatedIn` 방식을 그대로 사용).

## 5. Verification

- `node test/contract/scripts/contract-test-run.js --compare v2.1.9 --level L1,L4` — stub 삭제 상태에서 PASS.
- `node test/contract/scripts/contract-test-run.js --compare v2.1.16 --level L1,L4` — stub 삭제 상태에서 PASS.
- `node test/contract/agent-deprecation.test.js` — 6/6. 신규 `registry-tombstone` fixture(baseline 에이전트 제거 + registry 항목 + stub 없음 → PASS) 포함, `missing-stub` fixture(stub도 registry 항목도 없음)는 여전히 FAIL.
- `node test/contract/invocation-inventory.test.js` — registry에 정확히 6개 agent 항목 존재, 각 `agents/<name>.md` 부재, registry 키가 `EXPECTED_DEPRECATED_AGENT_NAMES`와 deep-equal.
- `node test/regression/agents-21.test.js` / `agents-effort.test.js` / `agents-31.test.js` — stub 항목 제거 (기존 AE-09..14 6건 실패 해소).

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-07-02 | 최초 ADR (issue #128, v2.1.25) | kay |
