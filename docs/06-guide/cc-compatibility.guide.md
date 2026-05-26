# Claude Code Compatibility Guide (v2.1.20)

> **Language**: 한국어 (docs/ 디렉토리 규칙 · .claude/CLAUDE.md)
> **bkit version**: v2.1.20
> **Last updated**: 2026-05-26
> **Related**: [`version-policy.guide.md`](./version-policy.guide.md) · [`cc-version-monitoring.guide.md`](./cc-version-monitoring.guide.md) · [`contract-baseline-rollforward.guide.md`](./contract-baseline-rollforward.guide.md) · [ADR 0006](../adr/0006-cc-upgrade-policy.md) · [ADR 0011](../adr/0011-plugin-manifest-schema-compliance.md)
> **Trigger**: 정병진 (@bj) 2026-05-26 install 실패 (`Validation errors: : Unrecognized key: "displayName"`) — 외부 dogfooder #2 incident
> **선행 분석**: [`docs/03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md`](../03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md) (cc-version-researcher 88% 신뢰도 결론)

---

## 1. bkit 최소 Claude Code 버전 정합 표

| 권장 단계 | Claude Code 버전 | 비고 |
|----------|----------------|------|
| **Minimum (advisory)** | **v2.1.143** | `displayName` 공식 schema 정식 인식 시작 — 본 sprint v2.1.20 baseline |
| **보수적 권장** | v2.1.123+ | bkit 측 stable streak 검증 누적 |
| **균형 권장** | v2.1.146+ | 101 consecutive bkit-compatible 입증 |
| **비권장** | v2.1.128 | `#56293` caching 10x 회귀 streak |
| **하한 cutoff** | v2.1.78 | bkit minimum cutoff (sprint Management v2.1.13 GA 기준) |

### 1.1 정책 종류

- **Hard reject**: 없음 — 본 sprint 는 v2.1.142 이하 사용자도 informational advisory 만 출고합니다 (hard reject 안 함).
- **CI gate**: bkit release 시 `scripts/release-plugin-tag.sh` 가 `claude plugin validate .` Exit 0 을 의무화 합니다 (ADR 0006 § Empirical Validation Gate). 사용자 환경의 Claude Code 버전은 검사하지 않습니다.
- **SessionStart advisory**: bkit v2.1.20 부터 SessionStart hook 이 1회/세션 cap (cache 1h TTL) 으로 CC 버전을 감지하여 v2.1.143 미만이면 `BKIT_CC_VERSION_ADVISORY` env 와 additionalContext 경고문을 출력합니다 (F10 ENH-323).

### 1.2 정합 검증 명령

```bash
# 사용자 환경 CC 버전 확인
claude --version

# bkit plugin manifest 정합 검증 (v2.1.20+ strict mode)
node scripts/validate-plugin.js --strict --verbose

# bkit release 시 의무화된 Empirical Validation Gate
claude plugin validate .
```

---

## 2. `displayName` 필드 출처 (v2.1.143+ 공식 schema)

### 2.1 사실 매트릭스 (verified 사실)

| 항목 | 값 | 출처 |
|------|----|-----|
| `displayName` 도입 버전 | **v2.1.143** | docs.claude.com plugin manifest schema ("Requires Claude Code v2.1.143 or later") |
| strict path 도입 버전 | v2.1.45 | Issue #26555 외 6+ 이슈 입증 (cc-version-researcher) |
| 정병진 (@bj) 추정 버전 | ≤ v2.1.142 | cc-version-researcher 88% 신뢰도 결론 (Q2 미해결, F3 회신 대기) |
| bkit `.claude-plugin/plugin.json` 9 keys 중 `displayName` 위치 | line 4 | `.claude-plugin/plugin.json` 직접 실측 |
| bkit-starter `.claude-plugin/plugin.json` `displayName` | 미포함 | 영향 0 확정 (별도 plugin) |

### 2.2 v2.1.143 release date (Q3 미해결)

> ⚠️ **Q3 미해결**: v2.1.143 의 정확한 release date 는 cc-version-researcher 재조회가 필요합니다. 본 문서는 docs.claude.com 의 "Requires Claude Code v2.1.143 or later" 명시만 인용하며, 정확한 일자는 추후 amend 합니다.

### 2.3 `displayName` 제거 시 회귀 (Anti-Mission)

bkit 은 **`displayName` 을 제거하지 않습니다** (master plan § 0 Anti-Mission).

- v2.1.143+ 사용자: UI picker label 표시에 사용됨 → 제거 시 UI 표시 회귀 (Risk R3)
- v2.1.142 이하 사용자: advisory 로 안내, install path 회피 방법 § 4 참고
- `test/integration/config-sync.test.js` CS-015 (보강 by F12) 가 `displayName` 누락 시 CI fail 처리

---

## 3. Plugin Manifest 21-Key Whitelist (사전 안내)

Anthropic 공식 plugin manifest schema 의 21 keys whitelist 를 `lib/domain/rules/docs-code-invariants.js` 의 `EXPECTED_PLUGIN_JSON_KEYS` SoT 로 보존합니다 (Object.freeze, immutability invariant). bkit v2.1.20 부터 `scripts/validate-plugin.js --strict` 가 본 whitelist 외 키 발견 시 Exit 2 로 차단합니다 (ENH-322).

### 3.1 21 Keys (Anthropic 공식 schema)

| # | Key | bkit 사용 | 비고 |
|---|-----|:---------:|------|
| 1 | `$schema` | - | JSON schema reference |
| 2 | `name` | ✅ | 필수 (기존 validate-plugin.js name check) |
| 3 | `displayName` | ✅ | v2.1.143+ UI picker label |
| 4 | `version` | ✅ | 필수 (기존 validate-plugin.js version check) |
| 5 | `description` | ✅ | 표준 |
| 6 | `author` | ✅ | 표준 |
| 7 | `homepage` | - | optional |
| 8 | `repository` | ✅ | 표준 |
| 9 | `license` | ✅ | 표준 (SPDX) |
| 10 | `keywords` | ✅ | 표준 |
| 11 | `skills` | - | plugin component |
| 12 | `commands` | - | plugin component |
| 13 | `agents` | - | plugin component |
| 14 | `hooks` | - | plugin component |
| 15 | `mcpServers` | - | plugin component |
| 16 | `outputStyles` | ✅ | bkit 은 string path 사용 |
| 17 | `lspServers` | - | plugin component |
| 18 | `experimental` | - | Anthropic experimental flags |
| 19 | `dependencies` | - | plugin dependencies |
| 20 | `userConfig` | - | user config schema |
| 21 | `channels` | - | release channel |

→ bkit `.claude-plugin/plugin.json` 9 keys 모두 21-key whitelist 내, 비표준 0개.

### 3.2 strict mode 사용

```bash
# bkit plugin.json 정합 검증
node scripts/validate-plugin.js --strict

# 상세 출력 (각 key 상태 표시)
node scripts/validate-plugin.js --strict --verbose

# Exit code:
#   0  PASS (모든 키 21-key whitelist 내)
#   1  required files/dirs missing (기존 동작)
#   2  extra key 발견 (21-key whitelist 외) — strict only
#   3  min-version metadata invalid — strict only
```

### 3.3 CI Gate

`.github/workflows/contract-check.yml` 에 신규 step `Release Gate — plugin.json schema validation (21-key whitelist)` 가 추가되었습니다 (F6). **1주 advisory only** (`continue-on-error: true`) 운영 후 v2.1.21 부터 strict (`continue-on-error: false`) 로 전환됩니다.

---

## 4. Install 실패 시 사용자 대응 가이드

### 4.1 증상

```
Validation errors: : Unrecognized key: "displayName"
    at /Users/<you>/.claude/plugins/cache/temp_git_<HASH>_<RAND>/.claude-plugin/plugin.json
```

### 4.2 진단 (한 줄)

```bash
claude --version
```

출력이 **v2.1.143 미만** 이면 본 가이드 § 4.3 따르세요.

### 4.3 Workaround — Claude Code 업그레이드 후 install 재시도

```bash
# 1. Claude Code 를 최신 stable 로 업그레이드
npm install -g @anthropic-ai/claude-code@latest

# 2. (선택) 캐시 정리
rm -rf ~/.claude/plugins/cache/temp_git_*

# 3. bkit plugin install 재시도
claude plugin install bkit

# 4. 검증
claude plugin list | grep bkit
```

### 4.4 사례 — 정병진 (@bj) 2026-05-26

본 가이드는 정병진 (@bj) 의 install 실패 사건이 트리거가 되어 작성되었습니다. 사례 archive 는 [`docs/external-dogfooders/bj.md`](../external-dogfooders/bj.md) 에 정리됩니다 (F14, Hall of Fame entry #2 — bkit Early Adopter Program).

### 4.5 추가 troubleshooting

| 증상 | 가능성 | 조치 |
|------|-------|-----|
| `claude --version` 자체가 실패 | Claude Code 미설치 또는 PATH 누락 | `npm install -g @anthropic-ai/claude-code@latest` |
| upgrade 후에도 같은 에러 | npm 캐시 or 다중 글로벌 설치 | `which -a claude` 로 확인 후 충돌하는 binary 제거 |
| 다른 plugin 은 install 되는데 bkit 만 fail | bkit `displayName` field strict reject | 본 가이드 § 4.3 진행 |
| 회신을 받고 싶을 때 | bkit Early Adopter Program | [`docs/external-dogfooders/_README.md`](../external-dogfooders/_README.md) 에 따라 issue file |

---

## 5. ADR 0003 + 0006 + 0011 관계 (Empirical Validation 정책)

### 5.1 정책 트리오

| ADR | 정책 | 본 sprint 관계 |
|-----|------|-------------|
| **ADR 0003** (2026-04-24 Accepted) | CC 버전 변경 영향 분석 시 raw CHANGELOG + 공식 docs + bkit 실측 3-source 가설 검증 의무 (Phase 1.5 Empirical Validation) | 본 incident 회고: 가설 단계에서 Phase 1.5 를 거치지 않았다면 false fix 위험 (예: `displayName` 제거 → v2.1.143+ UI picker 회귀). cc-version-researcher 88% 신뢰도 결론 = Phase 1.5 적용 결과. |
| **ADR 0006** (2026-04-28 Accepted) | `claude plugin validate .` Exit 0 의무 wire (§ Empirical Validation Gate) | 본 sprint F7 이 ~30일 지연된 의무 wire 를 회복: `scripts/release-plugin-tag.sh` line 82-83 사이 `claude plugin validate .` 추가. command -v claude 미존재 시 WARN + fallback. |
| **ADR 0011** (2026-05-26 신규, F11) | Plugin Manifest Schema Compliance Policy — minimum CC v2.1.143 + 21-key whitelist + `claude plugin validate .` CI Gate + R3-321 reconcile + SessionStart detection | 본 sprint 의 정책 정식 채택. ADR 0003 위반 사례 회고 + ADR 0006 § Gate 미이행 회복을 통합 정책화. |

### 5.2 정책 강화 누적

```
ADR 0003 Phase 1.5 (3-source 가설 검증)
    ↓
ADR 0006 § Empirical Validation Gate (release-plugin-tag.sh wire)
    ↓
ADR 0011 (본 sprint) — minimum CC + 21-key + R3-321 + SessionStart 통합
    ↓
v2.1.21+ Anthropic 정책 변경 시 ADR 0011 § History amend
```

---

## 6. cc-regression Reconcile Cycle 안내 (R3-321)

### 6.1 매일 09:00 KST 자동 cycle

`lib/cc-regression/registry.js` 가 22 entries (기존 21 + R3-321) 를 보존하며, `.github/workflows/cc-regression-reconcile.yml` 이 매일 09:00 KST 에 reconcile cycle 을 실행합니다.

### 6.2 R3-321 entry (본 sprint F8 ENH-321 신규)

| Field | Value |
|-------|-------|
| `id` | `R3-321` |
| `issue` | https://github.com/anthropics/claude-code/issues/26555 |
| `severity` | HIGH |
| `since` | 2.1.45 (strict path 시작) |
| `expectedFix` | 2.1.143 (`displayName` 공식 schema 인식) |
| `affectedFiles` | `.claude-plugin/plugin.json` · `scripts/validate-plugin.js` · `lib/domain/rules/docs-code-invariants.js` · `hooks/startup/session-context.js` |
| `resolvedAt` | null (사용자 환경 의존, advisory only) |
| `notes` | 외부 dogfooder 정병진 @bj 2026-05-26 첫 confirmed case. cc-version-researcher 88% 신뢰도 결론. bkit response: F1+F4 advisory + F5 21-key whitelist + F7 claude plugin validate wire + F10 SessionStart CC detection + F11 ADR 0011. |

### 6.3 Anthropic 정책 변경 시 amend

Anthropic 이 docs vs 구현 lenient/strict 모순 (Q1) 을 해결하는 release 를 출시하면 cc-regression reconcile cycle 이 변화를 자동 감지하여 ADR 0011 § History 에 amend marker 를 남깁니다. Q1 자체 해결 시도는 bkit 측 책임 영역 밖입니다 (외부 의존).

---

## 7. SessionStart CC Version Detection (F10 ENH-323)

### 7.1 동작

bkit v2.1.20 부터 `hooks/startup/session-context.js` 의 `detectCCVersion()` 함수가 SessionStart 시점에 자동 호출됩니다:

1. `BKIT_DISABLE_CC_VERSION_DETECTION=1` env 가 set 되어 있으면 즉시 skip (source: skipped)
2. `.bkit/runtime/cc-version.json` cache 가 1h TTL 내면 cache 사용 (source: cache)
3. cache miss 시 `child_process.execSync('claude --version', { timeout: 200 })` 호출 (source: fresh)
4. 감지된 버전이 v2.1.143 미만이면:
   - `process.env.BKIT_CC_VERSION_ADVISORY = '1'` set
   - additionalContext 에 advisory 텍스트 추가
5. OTEL emit: `gen_ai.cc_version_detection_ms` metric (attributes: version, isOldVersion, source)

### 7.2 Opt-out (성능 민감 환경)

```bash
# 영구 opt-out
export BKIT_DISABLE_CC_VERSION_DETECTION=1

# 또는 .bkit/runtime/cc-version.json 수동 set
echo '{"version":"2.1.143","isOldVersion":false,"detectedAt":"2099-12-31T00:00:00Z","ttlSeconds":3600}' > .bkit/runtime/cc-version.json
```

### 7.3 Performance budget

| 항목 | 값 |
|------|----|
| timeout | 200ms (`child_process.execSync` 강제 cap) |
| cache TTL | 1 시간 (`.bkit/runtime/cc-version.json` mtime 기준) |
| 1회/세션 cap | 동일 세션 내 재호출 시 cache 만 read |
| OTEL metric | `gen_ai.cc_version_detection_ms` (3-month 누적 후 v2.1.21+ 격하/유지 결정) |

### 7.4 E2E 검증

`test/e2e/cc-min-version.test.js` (본 sprint F13 신규) 가 v2.1.142 simulation 으로 advisory 발동 + v2.1.143 시 advisory 미발동 + opt-out env + timeout/command-not-found silent skip 5 시나리오를 모두 검증합니다 (외부 dogfooder Lifecycle Stage 4 Regression Lock).

---

## 8. Open Questions (Q1-Q5 — 사용자 의사결정 보류)

| # | Question | 현 status | 결정 시점 |
|---|---------|----------|---------|
| **Q1** | docs vs 구현 lenient/strict 모순 (Anthropic 책임) | Out-of-scope (외부 의존) | Anthropic 정책 변경 시 ADR 0011 § History amend |
| **Q2** | 정병진 (@bj) CC 버전 미확정 | F3 회신 대기 | 회신 받은 후 재검토 |
| **Q3** | v2.1.143 정확한 release date | cc-version-researcher 재조회 필요 | F4 § 2.2 amend 시 |
| **Q4** | marketplace.json `requirements.claudeCode` spec 존재 여부 | description 텍스트 prefix 로 안전하게 처리 (v2.1.20 F2 진행) | spec 명시 release 시 |
| **Q5** | v2.1.142 이하 사용자 비율 (진입장벽 R6) | 추정 95% upgrade + post-release 모니터 | sprint 종결 후 1-month |

---

## 9. Cross-Reference

- [`docs/sprint/v2120-marketplace-recovery/master-plan.md`](../sprint/v2120-marketplace-recovery/master-plan.md) — sprint master plan
- [`docs/sprint/v2120-marketplace-recovery/prd.md`](../sprint/v2120-marketplace-recovery/prd.md) — PRD
- [`docs/sprint/v2120-marketplace-recovery/plan.md`](../sprint/v2120-marketplace-recovery/plan.md) — Plan
- [`docs/sprint/v2120-marketplace-recovery/design.md`](../sprint/v2120-marketplace-recovery/design.md) — Design
- [`docs/03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md`](../03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md) — cc-version-researcher 88% 신뢰도 결론
- [`docs/external-dogfooders/_README.md`](../external-dogfooders/_README.md) — bkit Early Adopter Program 5-stage Lifecycle 정책 (v2.1.19)
- [`docs/external-dogfooders/bj.md`](../external-dogfooders/bj.md) — Hall of Fame @bj entry (#2, F14)
- [`docs/adr/0003-cc-version-impact-empirical-validation.md`](../adr/0003-cc-version-impact-empirical-validation.md) — ADR 0003
- [`docs/adr/0006-cc-upgrade-policy.md`](../adr/0006-cc-upgrade-policy.md) — ADR 0006
- [`docs/adr/0011-plugin-manifest-schema-compliance.md`](../adr/0011-plugin-manifest-schema-compliance.md) — ADR 0011 (본 sprint F11 신규)

---

**Status**: v2.1.20 sprint Sub-sprint 1 Recovery 산출. v2.1.21+ Q3 + Q5 amend 후 living document 로 유지.
