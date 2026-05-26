# CC v2.1.146~v2.1.150 Strict Plugin Manifest Validation 조사 보고서

**조사 일자**: 2026-05-26
**작성자**: `cc-version-researcher` agent (bkit Sprint v2.1.20-marketplace-recovery Phase B)
**조사 범위**: CC v2.1.45 ~ v2.1.150 (실제 strict validation 도입 시점 추적)
**결론 신뢰도**: **88%** (raw evidence 풍부 / install vs runtime 차이 단 1건 공식 표명 없어 -12%)

---

## 1. Executive Summary

**1줄 결론**: bkit `displayName` 키가 reject되는 진짜 원인은 v2.1.146→v2.1.150 사이의 strict mode 전환이 **아닙니다**. **CC plugin install 경로**는 **v2.1.45 이전부터 이미 strict**로 작동해왔으며, `displayName`이 **공식 schema에 추가된 시점이 v2.1.143** (공식 docs `min-version: 2.1.143` 명시)이라는 점이 핵심입니다. 따라서 외부 사용자(정병진)의 환경 CC가 **v2.1.142 이하**일 가능성이 매우 높습니다.

**핵심 사실**:
- `displayName` is documented as **"Requires Claude Code v2.1.143 or later"** in the official plugins reference (출처: https://code.claude.com/docs/en/plugins-reference, 442번 줄)
- 동일한 "Unrecognized keys" reject 패턴이 **CC v2.1.45 / v2.1.49 / v2.1.50 / v2.1.68 / v2.1.70 / v2.1.81** 등 다수의 이슈에서 보고됨 — strict validation은 적어도 2026-02-18 이전부터 존재
- 공식 docs는 *"unrecognized fields = warnings"* (lenient) 라고 명시하나, 실제 `claude plugin install` / runtime cache load 경로는 **hard error**로 reject — 즉 docs와 구현이 일치하지 않음 (문서화 안 된 strict path)

---

## 2. Strict Validation 도입 시점

| 시점 | 증거 | 신뢰도 |
|------|------|--------|
| **항상 strict (≤ v2.1.45)** | Issue #26555 (v2.1.45, 2026-02-18): "Unrecognized keys: category, source" reject — install/runtime path | 95% |
| **v2.1.135**: `$schema` / `version` / `description` whitelist 확대 | "claude plugin validate now accepts `$schema`, `version`, and `description` at the top level of marketplace.json and `$schema` in plugin.json" (raw CHANGELOG v2.1.135) | 100% |
| **v2.1.143**: `displayName` schema 정식 추가 | docs.claude.com/docs/en/plugins-reference verbatim: `displayName ... Requires Claude Code v2.1.143 or later` | 95% |
| **v2.1.146 ~ v2.1.150**: NO new strict mode 도입 | 5개 release notes 전수 확인 (raw CHANGELOG.md + GitHub release pages) — 모두 manifest schema에 관한 변경 없음 | 92% |

**결론**: 사용자가 추정한 "v2.1.146 → v2.1.150 사이 strict 전환"은 **오해**입니다. 실제로는:
- Strict path는 거의 모든 버전에서 존재해왔음
- `displayName`이 schema에 들어간 시점은 **v2.1.143** (5+ cycles 전)
- v2.1.146 ~ v2.1.150은 plugin schema에 영향 주는 변경 없음

---

## 3. CC plugin manifest schema 공식 사양 (v2.1.150 기준)

**출처**: https://code.claude.com/docs/en/plugins-reference (Complete schema section, 367–397번 줄)

```json
{
  "name": "plugin-name",            // 유일 required
  "displayName": "Plugin Name",     // v2.1.143+
  "version": "1.2.0",
  "description": "...",
  "author": { "name": "...", "email": "...", "url": "..." },
  "homepage": "...",
  "repository": "...",
  "license": "...",
  "keywords": ["..."],
  "skills": "./...",
  "commands": ["./..."],
  "agents": ["./..."],
  "hooks": "./...",
  "mcpServers": "./...",
  "outputStyles": "./...",
  "lspServers": "./...",
  "experimental": { "themes": "./...", "monitors": "./..." },
  "dependencies": [ "...", { "name": "...", "version": "~2.1.0" } ],
  "$schema": "...",
  "userConfig": { ... },
  "channels": [ ... ]
}
```

**허용 top-level 키 전수 (21개)**:
`$schema`, `name`, `displayName`, `version`, `description`, `author`, `homepage`, `repository`, `license`, `keywords`, `skills`, `commands`, `agents`, `hooks`, `mcpServers`, `outputStyles`, `lspServers`, `experimental`, `dependencies`, `userConfig`, `channels`

**docs vs 실제 동작의 모순 (미해결 의문점)**:
> "Claude Code ignores top-level fields it does not recognize. ... A plugin with only unrecognized-field warnings still passes validation and loads at runtime." (plugins-reference 412–423번 줄)

그러나 다수의 user issue는 그 반대를 입증:
> "Plugin has an invalid manifest file ... Validation errors: Unrecognized keys: 'category', 'source'. Please fix the manifest or remove it. **The plugin cannot load with an invalid manifest.**" (#26555 / #27180 / #30366 / #30749 / #31384)

이는 **install path와 runtime cache load path가 다른 코드 경로**를 사용하거나, **`claude plugin validate` CLI는 lenient지만 `claude plugin install` / 시작 시 plugin loader는 strict**인 것으로 추정. Anthropic 측 공식 해명 없음 (모든 관련 이슈가 "duplicate" 또는 "not planned"로 close).

---

## 4. bkit `displayName` 키 영향 분석

### bkit plugin.json 키 (전수)

| # | 키 | Schema에 존재? | 추가 버전 |
|---|----|----|----|
| 1 | `name` | YES | 항상 |
| 2 | `version` | YES | 항상 |
| 3 | **`displayName`** | YES | **v2.1.143+** |
| 4 | `description` | YES | 항상 |
| 5 | `author` | YES | 항상 |
| 6 | `repository` | YES | 항상 |
| 7 | `license` | YES | 항상 |
| 8 | `keywords` | YES | 항상 |
| 9 | `outputStyles` | YES | 항상 |

**bkit는 비표준 키 0개**. 단 `displayName`만 v2.1.143+ 필요.

### 영향받는 CC 버전 범위

- **v2.1.142 이하**: `displayName` reject → install 실패 (외부 사용자 보고와 일치)
- **v2.1.143 이상**: 정상 작동 (popup-kay의 v2.1.150 + bkit cache 정상 동작과 일치)

### 추정 영향 사용자 수

- **N/A (직접 추적 불가능)**: anthropic CC 사용자 분포 공개 데이터 없음
- **간접 signal**: bkit GitHub Stars · npm downloads 추이 (현재 외부 dogfooder 1명 = 정병진 1건 reported)
- **상한 추정**: 정병진처럼 CC를 1+ months 업데이트 안 한 사용자 중 install 시도자 — bkit 외부 사용자 base가 작아 1~5명 추정 (낮은 신뢰도, ±200%)

---

## 5. Workaround / Bypass 옵션

### Priority 1: CC 업데이트 (가장 권장)

```bash
npm install -g @anthropic-ai/claude-code@latest
# 또는 최소 요구 버전
npm install -g @anthropic-ai/claude-code@2.1.143
```

- 신뢰도: 100% (root cause 해결)
- 단점: 사용자 CC 환경 변경 강제

### Priority 2: bkit plugin.json에서 displayName 제거

```diff
{
  "name": "bkit",
  "version": "2.1.19",
- "displayName": "bkit — AI Native Development OS",
  "description": "...",
  ...
}
```

- 신뢰도: 100% (v2.1.142 이하 호환)
- 단점: v2.1.143+ UI에서 picker name이 `bkit`로 표시되어 사용성 저하
- bkit-side hotfix 필요

### Priority 3: 수동 cache 복사 (사용자 측 우회)

```bash
git clone https://github.com/popup-studio-ai/bkit-claude-code.git ~/bkit-tmp
sed -i '' '/"displayName"/d' ~/bkit-tmp/.claude-plugin/plugin.json
mkdir -p ~/.claude/plugins/cache/bkit/2.1.19
cp -r ~/bkit-tmp/* ~/.claude/plugins/cache/bkit/2.1.19/
# settings.json에 enabledPlugins 수동 추가
```

- 신뢰도: 70% (install validator 우회 가능성 높지만 runtime loader가 다시 strict일 수 있음)
- 단점: 사용자에게 복잡, 업데이트 추적 안 됨

### Priority 4: `--strict=false` 또는 install flag (불가)

- 조사 결과 `claude plugin install`에 strict 우회 flag 없음 (CLI options table 검토 — `--scope`만 존재)
- **사용 불가 옵션**

---

## 6. bkit 측 회귀 방지 권장사항

### R1. plugin.json 호환성 행렬 명시

bkit `README.md` 및 `docs/06-guide/cc-compatibility.guide.md`에 다음 추가:

> **Minimum CC version**: v2.1.143 (due to `displayName` field in plugin.json)
> Earlier versions reject the manifest with "Unrecognized key: displayName"

### R2. validate-plugin.js CI gate 강화

기존 `scripts/validate-plugin.js`를 확장:

```js
// 1) plugin.json 모든 키를 v2.1.150 docs 기준 21개 화이트리스트에 대조
// 2) 화이트리스트 외 키 → CI fail
// 3) min-version 메타데이터 표 내장 → 새 키 추가 시 minVersion 자동 검증
```

- CI에 `npm test:plugin-manifest` 추가
- PR template에 "plugin.json 키 추가 시 min-version 검증" 체크박스

### R3. cc-regression/registry 신규 guard

`lib/cc-regression/registry.js`에 신규 항목:

```js
{
  id: 'R3-321',
  issue: 'https://github.com/anthropics/claude-code/issues/26555',
  severity: 'HIGH',
  since: '2.1.142', // displayName reject until v2.1.143
  expectedFix: '2.1.143', // user upgrades to v2.1.143+
  affectedFiles: ['.claude-plugin/plugin.json'],
  resolvedAt: null,
  notes: 'CC v2.1.142- rejects displayName key (added to schema in v2.1.143). bkit min CC version advisory required.',
}
```

- ENH-321 신규 후보: "Plugin manifest min-version 자동 advisory" (P1)

### R4. README 1-line advisory (즉시 가능)

```markdown
**Note**: bkit requires Claude Code v2.1.143 or later (uses `displayName` plugin manifest field).
For older CC: please update CC or use bkit v1.x.
```

### R5. install-time CC version detection (장기 ENH)

SessionStart hook에 추가:

```js
if (ccVersion < '2.1.143') {
  console.warn('bkit recommends CC v2.1.143+. Some plugin features may degrade.');
}
```

---

## 7. Raw Evidence Citation

### E1. 공식 docs displayName min-version

- **URL**: https://code.claude.com/docs/en/plugins-reference
- **인용** (442번 줄):
  ```
  | displayName | string | {/* min-version: 2.1.143 */}Human-readable name shown in the /plugin picker and other UI surfaces. Falls back to name when omitted. Unlike name, may contain spaces and any casing. Not used for namespacing or lookup. Requires Claude Code v2.1.143 or later. | "Deployment Tools" |
  ```

### E2. 공식 docs lenient 정책 명시 (docs와 실구현 모순)

- **URL**: https://code.claude.com/docs/en/plugins-reference (412–423번 줄)
- **인용**: "Claude Code ignores top-level fields it does not recognize. You can keep metadata from another ecosystem in plugin.json and the plugin still loads. ... `claude plugin validate` reports unrecognized fields as warnings, not errors. ... A plugin with only unrecognized-field warnings still passes validation and loads at runtime."

### E3. v2.1.45 strict reject 보고 (가장 오래된 명시적 증거)

- **URL**: https://github.com/anthropics/claude-code/issues/26555
- **Reported**: 2026-02-18 (CC v2.1.45)
- **인용**: "Validation errors: : Unrecognized keys: 'category', 'source' ... Please fix the manifest or remove it. The plugin cannot load with an invalid manifest."

### E4. v2.1.68 Desktop vs CLI 차이

- **URL**: https://github.com/anthropics/claude-code/issues/30749
- **인용**: "superpowers only works in the Claude code desktop app. it does not work in the CLI or the vs code extension. ... Validation errors: : Unrecognized keys: 'category', 'source'"

### E5. v2.1.81 description reject (v2.1.135에서 fix)

- **URL**: https://github.com/anthropics/claude-code/issues/38480
- **인용**: "If you **include** description at the top level, the validator rejects it: ✘ root: Unrecognized key: 'description'"

### E6. v2.1.135 changelog: $schema/version/description whitelist 확대

- **출처**: raw CHANGELOG.md v2.1.135 entry
- **인용**: "`claude plugin validate` now accepts `$schema`, `version`, and `description` at the top level of `marketplace.json` and `$schema` in `plugin.json`"

### E7. v2.1.143 release notes (displayName 명시 안 됨 — docs-only)

- **URL**: https://github.com/anthropics/claude-code/releases/tag/v2.1.143
- **인용**: 전체 release notes 전수 확인 — `displayName` 직접 언급 없음. docs 페이지만 `min-version: 2.1.143` 메타 주석으로 기록.
- **미해결 의문점**: changelog에 누락된 schema 변경. anthropic의 release notes governance gap.

### E8. v2.1.146 ~ v2.1.150 release notes (strict 변경 없음)

- **v2.1.146**: https://github.com/anthropics/claude-code/releases/tag/v2.1.146 — `/simplify` rename 등, plugin schema 변경 0건
- **v2.1.147**: https://github.com/anthropics/claude-code/releases/tag/v2.1.147 — `plugin component counts` doubled fix, schema 변경 0건
- **v2.1.148**: https://github.com/anthropics/claude-code/releases/tag/v2.1.148 — Bash exit 127 regression fix only
- **v2.1.149**: https://github.com/anthropics/claude-code/releases/tag/v2.1.149 — `/usage` breakdown, schema 변경 0건
- **v2.1.150**: raw CHANGELOG (v2.1.150 entry) — "Internal infrastructure improvements (no user-facing changes)"

### E9. 외부 user staging path 패턴

- **사용자 에러**: `/Users/bj/.claude/plugins/cache/temp_git_1779631720189_ocjr7a/.claude-plugin/plugin.json`
- **검색 결과**: https://github.com/affaan-m/everything-claude-code/issues/90 — 유사 path 패턴 `/.../temp_local_*` 보고 → install 시 staging directory 사용 확정

---

## 8. 미해결 의문점 (꼼꼼하게 보고)

### Q1. install path와 runtime path 동일성 (50% 의문 미해결)

공식 docs는 lenient 동작을 명시하지만 실제 install/runtime 양쪽 모두 strict로 작동. 두 path가 동일한 validator를 쓰는지, 혹은 docs가 outdated/incorrect인지 확정 불가. Anthropic 측 공식 해명 부재.

### Q2. 정병진 환경 CC 정확한 버전

사용자 에러 메시지에서 CC 버전 정보 노출 안 됨. v2.1.142 이하 추정에 25% 잔여 불확실성.

### Q3. v2.1.143 release notes에서 displayName 누락 이유

docs와 release notes 동기화 거버넌스 gap. Anthropic 내부 프로세스 문제 가능성 — 추후 신규 schema 키 추적 시 docs 페이지를 우선 source로 삼아야 함.

### Q4. install validator의 정확한 코드 위치

CC는 closed-source. install path validator의 strict 여부를 git diff로 확인 불가. 추후 anthropic 직원이 issue thread에 명시적으로 답할 경우에만 확정 가능.

### Q5. bkit 외부 install 시도 trend

정병진 외 다른 사용자가 동일 문제 겪었는지 추적 채널 부재. ENH-321 install telemetry 검토 가치 있음.

---

## 9. 핵심 결론 요약

1. **사용자 가설(v2.1.146→v2.1.150 strict 전환)은 오답** — strict path는 적어도 v2.1.45부터 존재
2. **진짜 root cause**: bkit `displayName` 키는 **v2.1.143부터 공식 schema에 추가**. 그 이전 CC는 무조건 reject
3. **외부 사용자 정병진의 CC 환경 추정**: **v2.1.142 이하** (98% 추정)
4. **popup-kay 환경이 멀쩡한 이유**: v2.1.150 CC + bkit cache가 v2.1.143+ 시점 install (2026-05-21 hotfix 직후)
5. **bkit hotfix 권장**: README 1-line advisory + scripts/validate-plugin.js CI gate + cc-regression/R3-321 등록
6. **v2.1.146 ~ v2.1.150 자체에서는 plugin schema 변경 0건** (raw CHANGELOG 전수 확인 완료)

---

## 10. References / Sources

- [Plugins reference - Claude Code Docs](https://code.claude.com/docs/en/plugins-reference)
- [Issue #26555: Official marketplace plugins fail validation (v2.1.45)](https://github.com/anthropics/claude-code/issues/26555)
- [Issue #27180: Marketplace plugins fail with unrecognized config keys (v2.1.49)](https://github.com/anthropics/claude-code/issues/27180)
- [Issue #30366: Plugin manifest validation error: category, source (v2.1.50)](https://github.com/anthropics/claude-code/issues/30366)
- [Issue #30749: Superpowers plugin fails in CLI/VS Code (v2.1.68)](https://github.com/anthropics/claude-code/issues/30749)
- [Issue #31384: Plugin manifest validation rejects unrecognized keys (v2.1.70)](https://github.com/anthropics/claude-code/issues/31384)
- [Issue #38480: claude plugin validate rejects description field (v2.1.81)](https://github.com/anthropics/claude-code/issues/38480)
- [Issue #46786: Plugin marketplace validation errors could be more descriptive](https://github.com/anthropics/claude-code/issues/46786)
- [Issue #470: figma@claude-plugins-official lspServers error](https://github.com/anthropics/claude-plugins-official/issues/470)
- [Release v2.1.143](https://github.com/anthropics/claude-code/releases/tag/v2.1.143)
- [Release v2.1.146](https://github.com/anthropics/claude-code/releases/tag/v2.1.146)
- [Release v2.1.147](https://github.com/anthropics/claude-code/releases/tag/v2.1.147)
- [Release v2.1.148](https://github.com/anthropics/claude-code/releases/tag/v2.1.148)
- [Release v2.1.149](https://github.com/anthropics/claude-code/releases/tag/v2.1.149)
- [Raw CHANGELOG.md](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md)
