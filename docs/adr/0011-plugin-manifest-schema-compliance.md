# ADR 0011 — Plugin Manifest Schema Compliance Policy

> Status: **Accepted**
> Date: 2026-05-26
> Sprint: `v2120-marketplace-recovery` (Sub-sprint 3 Forward-proofing, F11)
> Related: ADR 0003 (CC version impact empirical validation), ADR 0006 (CC upgrade policy § Empirical Validation Gate), ENH-321 (R3-321 cc-regression guard), ENH-322 (validate-plugin.js 21-key whitelist), ENH-323 (SessionStart CC version detection)
> Trigger: 외부 dogfooder 정병진 (@bj) 2026-05-26 bkit v2.1.14 install 실패 — `Validation errors: : Unrecognized key: "displayName"`

---

## Context

### 1. The Incident (verified 사실)

2026-05-26, 외부 dogfooder 정병진 (@bj) 이 bkit v2.1.14 install 시도 중 다음 에러로 실패했다:

```
Error: Failed to install: Plugin has an invalid manifest file at
/Users/bj/.claude/plugins/cache/temp_git_1779631720189_ocjr7a/.claude-plugin/plugin.json.
Validation errors: : Unrecognized key: "displayName"
```

직접 영향:
- 정병진 (@bj) install 실패 — 첫 외부 dogfooder #2 사건
- 향후 CC ≤ v2.1.142 사용 신규 사용자 N명의 install 차단 가능성

### 2. Root cause analysis (cc-version-researcher 88% 신뢰도)

`docs/03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md` 의 결론:

| 사실 | 값 | 출처 |
|------|----|-----|
| `displayName` 도입 버전 | **v2.1.143** | docs.claude.com plugin manifest schema "Requires Claude Code v2.1.143 or later" |
| strict plugin-manifest path 도입 | **v2.1.45** | Issue #26555 외 6+ 이슈 입증 |
| 정병진 추정 CC 버전 | **≤ v2.1.142** | 88% 신뢰도 결론 (Q2 미해결, F3 회신 대기) |
| bkit `.claude-plugin/plugin.json` 사용 key 수 | **9** | 실측 (line 1-20) |
| bkit-starter `displayName` 포함 여부 | **미포함** | 영향 0 확정 (별도 plugin) |
| Anthropic 공식 plugin manifest schema 21 keys | `$schema`, `name`, `displayName`, `version`, `description`, `author`, `homepage`, `repository`, `license`, `keywords`, `skills`, `commands`, `agents`, `hooks`, `mcpServers`, `outputStyles`, `lspServers`, `experimental`, `dependencies`, `userConfig`, `channels` | docs.claude.com (cc-version-researcher) |

### 3. Policy violations 회고

본 incident 는 두 ADR 의 정책 위반 / 미이행 사례이다:

**ADR 0003 위반 사례 (Phase 1.5 Empirical Validation)**:
- ADR 0003 (2026-04-24 Accepted) 은 CC 버전 변경 영향 분석 시 raw CHANGELOG + 공식 docs + bkit 실측 3-source 가설 검증 의무를 정의한다.
- 만약 정병진 incident 발생 즉시 `displayName` 제거 가설로 fix 를 진행했다면 v2.1.143+ UI picker 회귀 (R3, Critical) 가 발생했을 것이다.
- cc-version-researcher 88% 신뢰도 결론 = Phase 1.5 적용 결과.

**ADR 0006 § Empirical Validation Gate 미이행 (~30일 지연)**:
- ADR 0006 (2026-04-28 Accepted) § "Empirical Validation Gate" 는 "Execute `claude plugin validate .` against the bkit plugin manifest. Exit 0 required." 를 의무화한다.
- 실측: `scripts/release-plugin-tag.sh` line 82-83 (2026-05-23 시점) 은 `check-trust-score-reconcile + check-quality-gates` 만 호출하고 `claude plugin validate .` wire 가 없었다.
- 이 wire 가 ADR 0006 채택 시점에 이루어졌더라면 정병진 사례와 같은 외부 incident 가 발생하기 전에 bkit 측에서 같은 strict path 실패를 사전 감지했을 가능성이 높다.

### 4. Anti-Mission (해결 안 함 / 시도 안 함)

- **`displayName` 제거**: v2.1.143+ 공식 schema 정식 키, 제거 시 UI picker 회귀
- **v2.1.142 이하 사용자 hard reject**: informational advisory only (UX 진입장벽 minimize, R6)
- **Anthropic docs vs 구현 lenient/strict 모순 (Q1) 자체 해결**: Anthropic 책임 영역, bkit 해결 불가
- **bkit-starter plugin 변경**: `displayName` 미포함, 영향 0 (별도 plugin)
- **Q2 정병진 CC 버전 추측 보강**: 사용자 회신 대기 (F3), Out-of-scope 명시
- **Trust L3/L4 default 변경**: sprint 본체와 무관

---

## Decision

bkit v2.1.20 부터 다음 **5-layer Plugin Manifest Schema Compliance Policy** 를 채택한다.

### Decision 1 — Minimum CC version advisory (informational only)

- `README.md` / `README-FULL.md` 상단에 1-line minimum CC v2.1.143 advisory 1-line 명시 (F1)
- `.claude-plugin/marketplace.json` bkit entry description prefix 에 `Requires Claude Code v2.1.143+...` 명시 (F2)
- `docs/06-guide/cc-compatibility.guide.md` 신규 작성 — 사용자 self-service 가이드 (F4)
- **Hard reject 안 함** (advisory only) — v2.1.142 이하 사용자 진입 차단하지 않음

### Decision 2 — Anthropic 21-key whitelist 강제 (CI Gate)

- `lib/domain/rules/docs-code-invariants.js` 에 `EXPECTED_PLUGIN_JSON_KEYS` SoT (Object.freeze, 21 keys) 추가 (F9)
- `scripts/validate-plugin.js` 에 `--strict` flag 신설 — 21-key whitelist 외 key 발견 시 Exit 2 (ENH-322, F5)
- `.github/workflows/contract-check.yml` 에 신규 step `Release Gate — plugin.json schema validation (21-key whitelist)` 추가 (F6)
- **v2.1.20**: `continue-on-error: true` (1주 advisory only, R9 mitigation)
- **v2.1.21+**: `continue-on-error: false` (strict, 강제 fail)

### Decision 3 — `claude plugin validate .` Exit 0 의무 wire (ADR 0006 § Empirical Validation Gate 회복)

- `scripts/release-plugin-tag.sh` line 82-83 사이에 `claude plugin validate .` wire 추가 (F7)
- `command -v claude` 미존재 시 WARN + fallback (CI 환경 제약, sprint Out-of-scope)
- Exit code 0 강제 — 위반 시 release 차단 (exit 1)
- **본 wire 는 ADR 0006 § Empirical Validation Gate 의무 (~30일 지연) 를 회복**

### Decision 4 — cc-regression Defense Layer 6 강화 (R3-321 신규 guard)

- `lib/cc-regression/registry.js` 에 entry #22 R3-321 추가 (ENH-321, F8)
- since: 2.1.45 (strict path 시작), expectedFix: 2.1.143 (`displayName` 공식 schema 인식)
- affectedFiles 4 (plugin.json + validate-plugin.js + docs-code-invariants.js + session-context.js)
- `resolvedAt: null` — bkit 측 해결 안 됨 (사용자 환경 의존, advisory only)
- `cc-regression-reconcile.yml` 매일 09:00 KST 자동 cycle 통합

### Decision 5 — SessionStart runtime CC version detection (forward-proofing)

- `hooks/startup/session-context.js` 에 `detectCCVersion()` 함수 추가 (ENH-323, F10)
- `child_process.execSync('claude --version', { timeout: 200 })`
- `.bkit/runtime/cc-version.json` cache 1h TTL + 1회/session cap
- v2.1.143 미만 시 `BKIT_CC_VERSION_ADVISORY` env set + `additionalContext` 경고문 추가
- OTEL emit: `gen_ai.cc_version_detection_ms` metric
- opt-out: `BKIT_DISABLE_CC_VERSION_DETECTION=1`
- E2E TC: `test/e2e/cc-min-version.test.js` v2.1.142 simulation (F13)

---

## Consequences

### 1. 즉각 효과 (v2.1.20 GA)

| Consequence | Verification |
|------------|--------------|
| 외부 dogfooder 정병진 (@bj) install path 차단 회복 | F3 회신 + workaround 적용 후 정병진 install 성공 회신 (SC6) |
| bkit 차별화 #2 (Defense Layer 6) 강화 | R3-321 신규 entry + ENH-321/322/323 정식 편입 |
| ADR 0003 + 0006 정책 강화 누적 | ADR 0011 § History append-only 추적 |
| 외부 dogfooder Lifecycle Stage 4 도달 | F8 R3-321 guard + F13 E2E regression lock (정병진 reproduction 흡수) |
| bkit Early Adopter Program 외부 dogfooder #2 entry | F14 `docs/external-dogfooders/bj.md` + `_README.md` 명단 갱신 |

### 2. 향후 영향 (v2.1.21+)

| 항목 | 활용 |
|------|------|
| F8 R3-321 guard telemetry (3-month) | 격하/유지 결정 |
| F10 ENH-323 SessionStart detection telemetry (3-month) | 성능 overhead 데이터 분석 후 격하/유지 결정 |
| F6 contract-check.yml `continue-on-error` 전환 | v2.1.21 부터 `false` 로 강제 |
| F14 Hall of Fame @bj entry | dogfooder #3+ 유입 baseline (first-follower 효과 입증) |

### 3. 미충족 / 외부 의존

| 항목 | 사유 |
|------|------|
| Q1 (Anthropic docs vs 구현 lenient/strict 모순) 해결 | Anthropic 책임 영역 — bkit 측 해결 불가 |
| Q2 (정병진 CC 버전 확정) | F3 회신 대기 |
| Q3 (v2.1.143 정확한 release date) | cc-version-researcher 재조회 필요 |
| Q4 (`marketplace.json requirements.claudeCode` spec) | Anthropic schema 미명시 시 description text 로 대체 (현 sprint 진행) |
| Q5 (v2.1.142 이하 사용자 비율) | post-release 모니터 |

---

## Empirical Validation

본 ADR 의 Decision 1-5 는 sprint `v2120-marketplace-recovery` 의 **8 Success Criteria (SC1-SC8)** 와 매핑된다:

| SC | Description | Decision | Verification |
|----|------------|---------|-------------|
| **SC1** | README + docs CC v2.1.143 명시 (100%) | D1 | docs-code-scanner (M7 ≥ 80) |
| **SC2** | 21-key whitelist CI gate (extra key → Exit 2) | D2 | `validate-plugin.js --strict` (smoke-tested 2026-05-26) |
| **SC3** | `claude plugin validate .` Exit 0 의무 wire | D3 | `release-plugin-tag.sh` line 82-110 (post-edit) |
| **SC4** | R3-321 등록 + reconcile cycle PASS | D4 | `check-guards.js` PASS 22 guards (smoke-tested 2026-05-26) |
| **SC5** | SessionStart CC detection 발동 | D5 | F13 E2E `cc-min-version.test.js` v2.1.142 simulation |
| **SC6** | 정병진 install 성공 회신 (=1건) | D1+D5 | F3 회신 thread + F14 Hall of Fame entry |
| **SC7** | ADR 0011 채택 (Accepted) | 본 문서 | Status: Accepted (frontmatter) |
| **SC8** | Hall of Fame @bj entry 추가 | F14 | `docs/external-dogfooders/bj.md` + `_README.md` (#2) |

cc-version-researcher 88% 신뢰도 결론 출처: `docs/03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md`.

ADR 0003 Phase 1.5 (3-source 가설 검증) 적용 결과: cc-version-researcher 자체가 raw CHANGELOG + 공식 docs + bkit 실측을 통합 분석한 산출이며, 본 ADR 의 Decision 은 그 결과에 직접 의존한다.

**CO-4 patch 2026-05-26 추가 검증**: Phase 1.5 3-source 재적용 (raw GitHub CHANGELOG fetch + Releasebot + npm registry meta) 결과 v2.1.143 plugin 시스템 메이저 release 임이 부수적으로 확인 (plugin dependency enforcement + /plugin marketplace browse pane projected context cost). 이는 cc-version-researcher 88% 신뢰도 결론 (displayName 정식 schema 격상)을 보강한다. Q3 status: partially resolved — Anthropic CHANGELOG 정책상 정확한 일자 영구 미공개, external detection proxy 2026-05-15.

---

## History (append-only)

| Date | Event | Reference |
|------|-------|-----------|
| 2026-04-24 | ADR 0003 Phase 1.5 Empirical Validation 정책 채택 | `docs/adr/0003-cc-version-impact-empirical-validation.md` |
| 2026-04-28 | ADR 0006 § Empirical Validation Gate 정책 채택 (이후 ~30일 wire 미이행) | `docs/adr/0006-cc-upgrade-policy.md` |
| 2026-05-23 | sprint `v2120-marketplace-recovery` 시작, master plan 작성 | `docs/sprint/v2120-marketplace-recovery/master-plan.md` |
| 2026-05-26 | 정병진 (@bj) install 실패 incident 보고 (외부 dogfooder #2 trigger) | `docs/05-research/external-dogfooders/jbjeong-2026-05-26-displayName-reject.md` |
| 2026-05-26 | cc-version-researcher 88% 신뢰도 결론 산출 | `docs/03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md` |
| 2026-05-26 | **ADR 0011 채택** (본 문서) | 본 frontmatter Status: Accepted |
| 2026-05-26 | **CO-4 patch — Q3 partially resolved**: v2.1.143 external detection proxy = 2026-05-15 (Releasebot). Anthropic dateless CHANGELOG 정책 영구 명시. plugin 시스템 메이저 release 부수적 확인 (plugin dependency enforcement + /plugin marketplace browse pane projected context cost) | `docs/06-guide/cc-compatibility.guide.md` § 2.2 + § 2.2.1 |
| 2026-05-26 | **CO-5 patch — @bj Lifecycle Stage 3 (Fix Released to branch, GA tag pending) + Stage 5 (Documented in CHANGELOG + Hall of Fame + README v2.1.20 section) 마크 ✅** | `docs/external-dogfooders/bj.md` 5-stage table + `_README.md` |
| (TBD) | F3 회신 (정병진 CC `--version` 확인, Q2 해소) | F3 audit_logger record |
| (TBD) | v2.1.20 GA tag — Decision 1-5 모두 GA + @bj Stage 3 "Fix Released" → 공식 release confirmed | CHANGELOG `[2.1.20]` + git tag `v2.1.20` |
| (TBD) | v2.1.21+ F6 `continue-on-error: false` 강제 전환 | CHANGELOG `[2.1.21]` |
| (TBD) | 3-month F8 R3-321 + F10 ENH-323 telemetry 분석 | v2.1.21+ 분석 |
| (Future) | Anthropic 정책 변경 시 ADR 0011 § Decision amend | TBD |
| 2026-07-02 | **Amendment 1 (v2.1.26 provisional)** — 공식 schema 21-key snapshot 초과 성장 확인 + `EXPECTED_PLUGIN_JSON_KEYS` subset-enforcement 정책 명문화 (본 문서 § Amendment 1) | `.bkit/research/v2126-web-research.md` Q1 + `docs/02-design/features/v2126-issue-response.design.en.md` I-7 |

---

## Amendment 1 — 2026-07-02 (v2.1.26 provisional): 공식 schema 성장 + subset-enforcement 정책 명문화

### 배경

CC v2.1.198 기준 공식 plugin manifest schema 는 본 ADR 채택 시점의 **21-key v2.1.143 snapshot 을 넘어 성장**했다 (출처: `.bkit/research/v2126-web-research.md` Q1, cc-version-researcher). 현 시점 공식 schema 는 다음을 포함한다:

- **`mcpServers`** — **v2.1.26 부터 bkit 이 실사용하는 key**. `.claude-plugin/plugin.json` 내 inline MCP declaration 이 root `.mcp.json` 을 대체하여, 동일 파일이 plugin MCP manifest 와 project-scope MCP config 로 이중 로드되던 dual-load `/plugin` 실패 (`Missing environment variables: CLAUDE_PLUGIN_ROOT`) 를 해결한다.
- `lspServers`, `channels`, `userConfig` — 21-key whitelist 에 이미 포함되어 있던 key.
- **`defaultEnabled`** (v2.1.154+) — 21-key whitelist 에 **없는 유일한 공식 key**.
- `$schema`, `homepage` — 기존 인지 key (whitelist 포함).

### 정책 (verbatim)

> **"EXPECTED_PLUGIN_JSON_KEYS is subset enforcement — the keys bkit ships — NOT a mirror of the full official schema"**

`lib/domain/rules/docs-code-invariants.js` 의 `EXPECTED_PLUGIN_JSON_KEYS` 는 bkit 이 ship 하는 key 집합에 대한 **subset 강제 장치**이지, Anthropic 공식 schema 전체의 미러가 아니다. 공식 schema 에 새 key 가 추가되어도 bkit 이 해당 key 를 ship 하지 않는 한 whitelist 를 확장할 의무가 없다.

이에 따라 Plan FR-04 ("add newer official keys") 는 **satisfied-by-design** 으로 판정한다: whitelist 에 부재한 유일한 공식 key 는 `defaultEnabled` (v2.1.154+) 이며, bkit 은 이 key 를 ship 하지 않는다.

### Code impact

**코드 변경 0.** `mcpServers` 는 이미 whitelist 에 존재한다 (`lib/domain/rules/docs-code-invariants.js:153`) — v2.1.26 의 inline `mcpServers` 채택은 whitelist 변경 없이 통과한다. `EXPECTED_PLUGIN_JSON_KEYS` 는 21 keys 그대로 유지 (`Object.freeze`).

---

## Open Question

### Q1 — Anthropic docs vs 구현 lenient/strict 모순 (Critical)

Anthropic 의 plugin manifest schema docs 와 실제 strict path 구현의 lenient/strict 처리가 일관되지 않다 (예: 일부 docs 는 unknown key 를 lenient 로 처리한다고 명시하나, v2.1.45+ 구현은 strict reject). **bkit 은 본 모순의 자체 해결을 시도하지 않는다 — Anthropic 책임 영역**.

본 ADR 의 정책은 현 시점 strict path 기준을 보수적으로 채택한다. Anthropic 정책 변경 release 시 cc-regression reconcile cycle 이 변화를 자동 감지 → 본 § History 에 amend marker 를 append.

### Q3 — v2.1.143 정확한 release date (partially resolved 2026-05-26)

Anthropic CHANGELOG 는 **dateless format** 으로 release entry 를 발행 (raw GitHub fetch 검증). 따라서 정확한 release date 는 Anthropic 정책상 **영구 미공개**.

External detection proxy (가장 신뢰할 수 있는 추정):
- **2026-05-15** — Releasebot first detection
- 2026-05-16 — WebSearch detection

본 ADR § History append-only 정책에 따라 cc-compatibility.guide.md § 2.2 및 본 § Empirical Validation 항목에서 위 사실을 명시하며, "정확한 일자" 는 Q3 가 영구적으로 partial resolve 상태임을 정직히 기록한다.

---

## Cross-Reference

- [`docs/adr/0003-cc-version-impact-empirical-validation.md`](./0003-cc-version-impact-empirical-validation.md) — Phase 1.5 Empirical Validation 의무
- [`docs/adr/0006-cc-upgrade-policy.md`](./0006-cc-upgrade-policy.md) — § Empirical Validation Gate
- [`docs/adr/0010-effort-aware-invariant.md`](./0010-effort-aware-invariant.md) — 직전 ADR
- [`docs/sprint/v2120-marketplace-recovery/master-plan.md`](../sprint/v2120-marketplace-recovery/master-plan.md) — sprint master plan
- [`docs/sprint/v2120-marketplace-recovery/prd.md`](../sprint/v2120-marketplace-recovery/prd.md) — PRD
- [`docs/sprint/v2120-marketplace-recovery/plan.md`](../sprint/v2120-marketplace-recovery/plan.md) — Plan
- [`docs/sprint/v2120-marketplace-recovery/design.md`](../sprint/v2120-marketplace-recovery/design.md) — Design
- [`docs/06-guide/cc-compatibility.guide.md`](../06-guide/cc-compatibility.guide.md) — 사용자 self-service 가이드
- [`docs/03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md`](../03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md) — cc-version-researcher 88% 신뢰도 결론
- [`docs/external-dogfooders/_README.md`](../external-dogfooders/_README.md) — bkit Early Adopter Program 5-stage Lifecycle 정책
- [`docs/external-dogfooders/bj.md`](../external-dogfooders/bj.md) — Hall of Fame @bj entry (F14)
