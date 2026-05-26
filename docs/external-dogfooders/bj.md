# @bj (정병진) — External Dogfooder #2

> **Joined**: 2026-05-26 (Issue Filed, Lifecycle Stage 1)
> **Status**: Lifecycle Stage 5 (Public Acknowledge) — v2.1.20 GA target
> **Project**: TBD (F3 회신 확인 후 추가)
> **Original incident**: bkit v2.1.14 install failure — `Validation errors: : Unrecognized key: "displayName"` (CC ≤ v2.1.142 strict-rejects the v2.1.143+ official displayName field)
> **Driven sprint**: `v2120-marketplace-recovery` (14 features / 3 sub-sprints / 3 신규 ENH / 1 신규 ADR)

---

## 5-stage User-Feedback Lifecycle Progress

| Stage | Status | Date | Artifact |
|-------|:------:|------|----------|
| 1. Issue Filed | ✅ | 2026-05-26 | `docs/05-research/external-dogfooders/jbjeong-2026-05-26-displayName-reject.md` (raw incident archive) |
| 2. Repro Test Absorbed | ✅ | 2026-05-26 | `test/e2e/external-dogfood/cc-min-version.test.js` (5 TC: v2.1.142 / v2.1.143 / command-not-found / timeout / opt-out) |
| 3. Fix Released | ⏳ | TBD v2.1.20 GA | `CHANGELOG.md [2.1.20]` + F1 (README + README-FULL advisory) + F4 (cc-compatibility.guide.md) |
| 4. Regression Lock | ✅ | 2026-05-26 | F8 R3-321 cc-regression guard (ENH-321) + F12 CS-015 21-key 보강 + F13 E2E v2.1.142 simulation |
| 5. Public Acknowledge | ⏳ | TBD v2.1.20 GA | 본 entry + `docs/external-dogfooders/_README.md` 명단 갱신 (#2) + README "Real User Hall of Fame" |

---

## Original Incident

### Error message (verbatim)

```
Error: Failed to install: Plugin has an invalid manifest file at
/Users/bj/.claude/plugins/cache/temp_git_1779631720189_ocjr7a/.claude-plugin/plugin.json.
Validation errors: : Unrecognized key: "displayName"
```

### Environment (verified)

| 항목 | 값 | 출처 |
|------|----|-----|
| bkit version attempted | **v2.1.14** | 사용자 screenshot ("Version: 2.1.14") |
| OS | macOS | `/Users/bj/.claude/...` 경로 패턴 |
| Claude Code IDE | Cursor 내부 터미널 | 사용자 회신 명시 |
| CC version | **≤ v2.1.142** (추정 98%) | cc-version-researcher 88% 신뢰도 결론 (Q2 미해결, F3 회신 대기) |

### Root cause analysis (cc-version-researcher 88% 신뢰도)

`docs/03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md` 의 결론:

- `displayName` 은 **Claude Code v2.1.143+ 공식 plugin manifest schema 정식 키** (docs.claude.com 명시 "Requires Claude Code v2.1.143 or later")
- v2.1.45 부터 strict plugin-manifest validation path 가 도입되어 unknown key 를 reject (Issue #26555 외 6+ 이슈 입증)
- 따라서 정병진 (@bj) 환경의 CC 는 v2.1.142 이하일 가능성 98%

---

## Contribution

### 1. Direct trigger for v2.1.20 sprint

본 incident 가 트리거가 되어 `v2120-marketplace-recovery` sprint (2026-05-23 시작) 가 즉시 시작되었습니다. 정확한 에러 메시지 + cache path + 환경 정보 공유 덕분에 본 sprint 의 fix scope 가 정확히 결정되었습니다.

### 2. bkit response (14 features / 3 sub-sprints)

| Sub-sprint | Features | ENH | Outcome |
|-----------|---------|-----|--------|
| **Recovery (P0×4)** | F1 README/README-FULL advisory · F2 marketplace metadata · F3 회신 메일 · F4 cc-compatibility.guide.md | - | minimum CC v2.1.143 advisory 명시 + 사용자 self-service 가이드 |
| **Defense (P1×5)** | F5 validate-plugin --strict · F6 contract-check step · F7 release-plugin-tag wire · F8 R3-321 entry · F9 EXPECTED_PLUGIN_JSON_KEYS SoT | **ENH-321** (R3-321) · **ENH-322** (21-key whitelist) | CI gate 21-key whitelist + ADR 0006 § Empirical Validation Gate 회복 + cc-regression Defense Layer 6 강화 |
| **Forward-proofing (P2×5)** | F10 SessionStart detectCCVersion · F11 ADR 0011 · F12 CS-015 보강 · F13 E2E · F14 Hall of Fame entry (본 문서) | **ENH-323** (SessionStart CC detection) | runtime advisory + 정책 정식 채택 + regression lock |

### 3. ADR 0011 채택

본 incident 회고를 통해 **ADR 0011 Plugin Manifest Schema Compliance Policy** 가 신규 채택되었습니다:

- Decision 1 — Minimum CC version advisory (informational only)
- Decision 2 — Anthropic 21-key whitelist 강제 (CI Gate, ENH-322)
- Decision 3 — `claude plugin validate .` Exit 0 의무 wire (ADR 0006 § Empirical Validation Gate 회복)
- Decision 4 — cc-regression Defense Layer 6 강화 (R3-321 신규 guard, ENH-321)
- Decision 5 — SessionStart runtime CC version detection (forward-proofing, ENH-323)

### 4. Permanent regression lock

정병진 reproduction 이 `test/e2e/external-dogfood/cc-min-version.test.js` 로 영구 흡수되었습니다 (Lifecycle Stage 4). 5 TC:

- **TC-F13-1**: v2.1.142 mock → `isOldVersion=true` + advisory + `BKIT_CC_VERSION_ADVISORY` env set
- **TC-F13-2**: v2.1.143 mock → no advisory
- **TC-F13-3**: command-not-found → silent skip
- **TC-F13-4**: timeout >200ms → silent skip (cold-start 시 일시 fail 가능, ADR 0011 § 5 Decision 명시)
- **TC-F13-5**: `BKIT_DISABLE_CC_VERSION_DETECTION=1` → 즉시 skip

향후 bkit core 변경 시 본 E2E 가 자동 회귀 차단합니다.

---

## bkit Sprint Impact (정량)

| Metric | Value |
|--------|-------|
| Sprint ID | `v2120-marketplace-recovery` |
| Sprint duration | 12 days (D1-D12) + 2-day buffer |
| Features touched | 14 (P0×4 / P1×5 / P2×5) |
| 신규 ENH | 3 (ENH-321 / ENH-322 / ENH-323) |
| 신규 ADR | 1 (ADR 0011, Status: Accepted) |
| 차별화 기여 | #2 Defense Layer 6 직접 강화 |
| 외부 dogfooder Lifecycle | Stage 1 → Stage 5 |
| bkit Trust Score component | `externalDogfoodFeedbackResponseRate` (weight 0.05) 누적 |

---

## bkit Early Adopter Program 정합

본 entry 는 `docs/external-dogfooders/_README.md` 에 정의된 bkit Early Adopter Program 정책 (v2.1.19 establishment) 따름.

@pruge (dogfooder #1, v2.1.19 first follower) 다음 **외부 dogfooder #2** — first-follower 효과를 입증한 두 번째 entry. 향후 dogfooder #3+ 유입 baseline 역할.

---

## Acknowledgement

> production environment 에서 bkit 을 직접 적용 시도하시고, 정확한 에러 메시지 + cache path + 환경 정보까지 공유해주신 덕분에 본 sprint 의 fix scope 가 정확히 결정되었습니다.
>
> Anthropic 공식 plugin manifest schema 의 v2.1.143+ displayName field 채택을 모르고 v2.1.14 시점부터 사용하셔서 발생한 strict reject 였으며, bkit 측에서 minimum CC version 명시가 부재했던 부분이 본 sprint 의 핵심 fix 가 되었습니다.
>
> bkit Early Adopter Program 의 외부 dogfooder #2 로서 본 entry 를 헌정합니다.
>
> — kay (POPUP STUDIO PTE. LTD.), v2.1.20 GA · 2026-05-26

---

## Cross-Reference

- [`docs/sprint/v2120-marketplace-recovery/master-plan.md`](../sprint/v2120-marketplace-recovery/master-plan.md) — sprint master plan
- [`docs/sprint/v2120-marketplace-recovery/prd.md`](../sprint/v2120-marketplace-recovery/prd.md) — PRD
- [`docs/sprint/v2120-marketplace-recovery/plan.md`](../sprint/v2120-marketplace-recovery/plan.md) — Plan
- [`docs/sprint/v2120-marketplace-recovery/design.md`](../sprint/v2120-marketplace-recovery/design.md) — Design
- [`docs/sprint/v2120-marketplace-recovery/f3-bj-reply-draft.md`](../sprint/v2120-marketplace-recovery/f3-bj-reply-draft.md) — F3 회신 draft
- [`docs/03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md`](../03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md) — cc-version-researcher 88% 신뢰도 결론
- [`docs/05-research/external-dogfooders/jbjeong-2026-05-26-displayName-reject.md`](../05-research/external-dogfooders/jbjeong-2026-05-26-displayName-reject.md) — raw incident archive
- [`docs/adr/0011-plugin-manifest-schema-compliance.md`](../adr/0011-plugin-manifest-schema-compliance.md) — ADR 0011 (본 incident 정책 정식 채택)
- [`docs/06-guide/cc-compatibility.guide.md`](../06-guide/cc-compatibility.guide.md) — 사용자 self-service 가이드
- [`test/e2e/external-dogfood/cc-min-version.test.js`](../../test/e2e/external-dogfood/cc-min-version.test.js) — F13 regression lock (5 TC)
- [`docs/external-dogfooders/_README.md`](_README.md) — bkit Early Adopter Program 정책 baseline
- [`docs/external-dogfooders/pruge.md`](pruge.md) — 외부 dogfooder #1 (first entry)

---

**bkit Compatibility Notice for @bj**: install 재시도 시 Claude Code 를 v2.1.143+ 로 업그레이드 후 `claude plugin install bkit` 진행 부탁드립니다 (`npm install -g @anthropic-ai/claude-code@latest`).
