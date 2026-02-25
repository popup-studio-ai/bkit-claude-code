# Claude Code v2.1.51 -> v2.1.55 Version Upgrade Impact Analysis

> **Feature**: claude-code-v2155-impact-analysis
> **Phase**: Check (PDCA Analysis)
> **Date**: 2026-02-25
> **Pattern**: CTO Team (6+ specialist agents + CTO Lead)
> **bkit Version**: v1.5.5 (current)
> **Previous Analysis**: claude-code-v2.1.49-impact-analysis.md (covered v2.1.48~v2.1.50)

---

## 1. Executive Summary

| Metric | Value |
|--------|:-----:|
| Analysis Target Versions | v2.1.51 ~ v2.1.55 (5 versions) |
| Published Releases | 5 (v2.1.51, v2.1.52, v2.1.53, v2.1.54, v2.1.55) |
| Skipped Releases (CHANGELOG) | 0 (v2.1.54 has CHANGELOG entry) |
| Total Changes | **25 documented items** |
| v2.1.51 Changes | 13 items (Features 7, Security 3, Bug Fixes 2, Performance 1) |
| v2.1.52 Changes | 1 item (VS Code bug fix) |
| v2.1.53 Changes | 8 items (Bug Fixes 8) |
| v2.1.54 Changes | 1 item (Bug Fix: ${CLAUDE_PLUGIN_ROOT} allowed-tools) |
| v2.1.55 Changes | 2 items (Bug Fixes: BashTool EINVAL, Write tool umask) |
| bkit Impact Items | **15 items** (High 4, Medium 4, Low 7) |
| Compatibility Risk | **None** (100% backward compatible) |
| Breaking Changes | **0 items** |
| Security Advisory | **3 items** (statusLine/fileSuggestion trust, HTTP env var interpolation, HTTP sandbox proxy) |
| Enhancement Opportunities | **6 items** (High 2, Medium 2, Low 2) |
| Immediate Action Required | **None** (all changes are backward compatible) |
| New CLI Features | `claude remote-control`, `/remote-control` (`/rc`) |
| New SDK Env Vars | 3 items (CLAUDE_CODE_ACCOUNT_UUID, USER_EMAIL, ORGANIZATION_UUID) |
| Plugin Ecosystem Changes | 2 items (git timeout 120s, npm custom registry) |
| GitHub Issues Monitored | 15 items (8 existing + 7 new) |

### Verdict: COMPATIBLE (100% compatible, 0 Breaking Changes)

bkit v1.5.5는 Claude Code v2.1.55와 완전 호환됩니다. v2.1.51에서 13건, v2.1.52에서 1건, v2.1.53에서 8건, v2.1.54에서 1건, v2.1.55에서 2건, 총 **25건**의 변경이 있었으며, **bkit에 직접적으로 영향을 미치는 항목은 15건**입니다.

**v2.1.51**의 핵심은 **보안 강화 + 플러그인 생태계 개선**(3건 보안 수정, remote-control, 플러그인 git timeout/npm registry)이며, **v2.1.53**의 핵심은 **안정성 강화**(8건 crash/hang 수정, 특히 Windows 플랫폼). **v2.1.54**의 `${CLAUDE_PLUGIN_ROOT}` allowed-tools 수정은 bkit 플러그인에 **직접적으로 관련**되며, **v2.1.55**의 Write tool umask 수정(0o600 → system umask)은 bkit이 생성하는 파일의 권한 정상화에 기여합니다.

v2.1.34부터 v2.1.55까지 **22개 연속 릴리스, 0건 Breaking Change**로 완벽한 호환성이 유지되고 있습니다. **3건의 보안 수정은 모두 bkit에 직접 영향이 없습니다** -- bkit은 command-type hooks만 사용하고, statusLine/fileSuggestion을 사용하지 않습니다.

**6건의 Enhancement 기회**가 식별되었으며, 특히 `${CLAUDE_PLUGIN_ROOT}` 활용 확장(ENH-47)과 `remote-control` 통합(ENH-42)은 향후 bkit 발전에 유용합니다.

---

## 2. Release Information

### 2.1 Release Timeline (v2.1.51 ~ v2.1.55)

| Version | Release Date | Status | Changes | Release Type |
|---------|:----------:|:------:|:-------:|:------:|
| v2.1.51 | 2026-02-24 | Published | 13 | Feature + Security + Bug fix |
| v2.1.52 | 2026-02-24 | Published | 1 | VS Code hotfix |
| v2.1.53 | 2026-02-25 | Published | 8 | Stability (crash fixes) |
| v2.1.54 | ~2026-02-25 | Published | 1 | Plugin fix |
| **v2.1.55** | **2026-02-25** | **Latest** | **2** | **Hotfix** |
| **Total** | | | **25** | |

### 2.2 Analysis Methodology

1. **CTO Team**: 6+ specialist agents (code-analyzer, security-architect, gap-detector, qa-strategist, explore-hooks, explore-lib) + CTO Lead
2. **Supplemental Research**: 2 background agents (official docs researcher, YAML format analyzer)
3. **CHANGELOG**: GitHub Raw CHANGELOG.md + GitHub Release bodies (v2.1.51~v2.1.55)
4. **Official Documentation**: code.claude.com/docs/en/{remote-control, hooks, plugins-reference, settings, cli-reference}
5. **GitHub Releases**: `gh release view` for each version (v2.1.51, v2.1.52, v2.1.53, v2.1.55)
6. **GitHub Issues**: 15 issues tracked (9 new + 6 existing)
7. **npm Registry**: Version history verification (v2.1.50~v2.1.55 inclusive)
8. **Web Research**: Tech blogs (VentureBeat, blockchain.news), Releasebot, ClaudeLog
9. **bkit Codebase Analysis**: 16 agents, 27 skills, 13 hooks entries (all command-type), 180 library exports
10. **Source Code Scan**: All hooks/hooks.json, scripts/*.js, lib/**/*.js, skills/*/SKILL.md, agents/*.md inspected

### 2.3 Analysis Sources

| Source | URL | Data Quality |
|--------|-----|:------:|
| GitHub CHANGELOG (Raw) | https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md | Primary |
| GitHub Releases | https://github.com/anthropics/claude-code/releases | Primary |
| GitHub Issues | https://github.com/anthropics/claude-code/issues | Primary |
| Official Remote Control Docs | https://code.claude.com/docs/en/remote-control | Primary |
| Official Hooks Reference | https://code.claude.com/docs/en/hooks | Primary |
| Official Plugins Reference | https://code.claude.com/docs/en/plugins-reference | Primary |
| Official Settings Docs | https://code.claude.com/docs/en/settings | Primary |
| Official CLI Reference | https://code.claude.com/docs/en/cli-reference | Primary |
| npm Package | https://www.npmjs.com/package/@anthropic-ai/claude-code | Primary |
| bkit Source Code | 45 script files, 38 lib files, 27 skills, 16 agents | Primary |
| Releasebot | https://releasebot.io/updates/anthropic/claude-code | Secondary |
| ClaudeLog | https://claudelog.com/claude-code-changelog/ | Secondary |
| VentureBeat | https://venturebeat.com/orchestration/anthropic-just-released-a-mobile-version-of-claude-code-called-remote | Secondary |

### 2.4 Version History (npm registry)

```
2.1.47 -> 2.1.48 -> 2.1.49 -> 2.1.50 -> 2.1.51 -> 2.1.52 -> 2.1.53 -> 2.1.54 -> 2.1.55
                                           ↑ prev                                         ↑ current
```

Skipped versions (npm published but no CHANGELOG): v2.1.40, v2.1.43, v2.1.46, v2.1.48

---

## 3. Change Details: v2.1.51 (13 Items)

### 3.1 New Features (7 Items)

| # | Change | bkit Impact | Direction |
|---|--------|:----------:|:---------:|
| 1 | **`claude remote-control`** subcommand for external builds, enabling local environment serving | **Medium** | Positive |
| 2 | Plugin marketplace git timeout **30s -> 120s** + `CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS` env var | **Medium** | Positive |
| 3 | Custom npm registries + specific version pinning for plugins from npm | **Low** | Positive |
| 4 | BashTool skips login shell (`-l`) by default + shell snapshot | **Medium** | Positive |
| 5 | `CLAUDE_CODE_ACCOUNT_UUID`, `CLAUDE_CODE_USER_EMAIL`, `CLAUDE_CODE_ORGANIZATION_UUID` env vars | **Low** | Neutral |
| 6 | `/model` picker shows human-readable labels + upgrade hint | None | Positive |
| 7 | Managed settings via macOS plist or Windows Registry | None | Neutral |

### 3.2 Security Fixes (3 Items)

| # | Change | bkit Impact | Direction |
|---|--------|:----------:|:---------:|
| 8 | **SECURITY**: `statusLine` and `fileSuggestion` hook commands could execute without workspace trust | None | Positive |
| 9 | **SECURITY**: HTTP hooks could interpolate arbitrary env vars -> requires explicit `allowedEnvVars` | None | Positive |
| 10 | **SECURITY**: HTTP hooks routed through sandbox network proxy, enforcing domain allowlist | None | Positive |

### 3.3 Bug Fixes (2 Items)

| # | Change | bkit Impact | Direction |
|---|--------|:----------:|:---------:|
| 11 | Fixed duplicate `control_response` messages causing API 400 errors | **Low** | Positive |
| 12 | **Fixed slash command autocomplete crashing when SKILL.md description is YAML array or non-string** | **High** | Positive |

### 3.4 Performance (1 Item)

| # | Change | bkit Impact | Direction |
|---|--------|:----------:|:---------:|
| 13 | Tool results >50K chars persisted to disk (was 100K), reducing context window usage | **High** | Positive |

---

## 4. Change Details: v2.1.52 (1 Item)

| # | Change | bkit Impact | Direction |
|---|--------|:----------:|:---------:|
| 14 | VS Code: Fixed extension crash on Windows ("command 'claude-vscode.editor.openLast' not found") | None | Positive |

---

## 5. Change Details: v2.1.53 (8 Items)

| # | Change | bkit Impact | Direction |
|---|--------|:----------:|:---------:|
| 15 | Fixed UI flicker where user input briefly disappears after submission | None | Positive |
| 16 | **Fixed bulk agent kill (ctrl+f) sends single aggregate notification instead of per-agent** | **High** | Positive |
| 17 | Fixed graceful shutdown leaving stale sessions with Remote Control by parallelizing teardown | **Low** | Positive |
| 18 | Fixed `--worktree` sometimes ignored on first launch | **Low** | Positive |
| 19 | Fixed panic ("switch on corrupted value") on Windows | None | Positive |
| 20 | Fixed crash when spawning many processes on Windows | **Low** | Positive |
| 21 | Fixed crash in WebAssembly interpreter on Linux x64 & Windows x64 | **Low** | Positive |
| 22 | Fixed crash after 2 minutes on Windows ARM64 | None | Positive |

---

## 6. Change Details: v2.1.54 (1 Item)

| # | Change | bkit Impact | Direction |
|---|--------|:----------:|:---------:|
| 23 | **Fixed `${CLAUDE_PLUGIN_ROOT}` not being substituted in plugin `allowed-tools` frontmatter**, causing tools to incorrectly require approval | **High** | Positive |

> **Critical Note**: bkit은 모든 hook 명령어에서 `${CLAUDE_PLUGIN_ROOT}`를 사용합니다 (예: `node ${CLAUDE_PLUGIN_ROOT}/hooks/session-start.js`). 이 수정은 `allowed-tools` frontmatter에서의 치환 문제를 해결한 것으로, bkit의 skill/agent `allowed-tools` 정의에서 `${CLAUDE_PLUGIN_ROOT}`를 사용할 경우 직접적으로 관련됩니다. 현재 bkit agent frontmatter에서 `allowed-tools`를 사용하는 경우의 영향을 확인해야 합니다.

---

## 7. Change Details: v2.1.55 (2 Items)

| # | Change | bkit Impact | Direction |
|---|--------|:----------:|:---------:|
| 24 | Fixed BashTool failing on Windows with EINVAL error | **Low** | Positive |
| 25 | **Fixed files created by Write tool using hardcoded 0o600 permissions instead of respecting system umask** | **Medium** | Positive |

> **Write tool umask fix**: 이전에는 Write tool로 생성된 파일이 `0o600` (owner read/write only) 권한으로 고정되었습니다. 이제 system umask를 존중하여 일반적으로 `0o644`로 생성됩니다. bkit이 Write tool을 통해 생성하는 PDCA 문서, 설정 파일 등의 파일 권한이 정상화됩니다.

---

## 8. bkit Impact Analysis (Detailed)

### 8.1 SKILL.md YAML Description Crash Fix (#12) -- HIGH

| Item | Details |
|------|---------|
| Change | Fixed slash command autocomplete crashing when plugin's SKILL.md description is YAML array or non-string |
| bkit Status | **27 SKILL.md files verified** -- all use `description: \|` (YAML block scalar) format |
| Impact | None of bkit's skills trigger this crash, but the fix provides an important safety net |
| Analysis | All 27 bkit skills were individually inspected. Example format: `description: \|` followed by multi-line string |

**Verification Results:**

| Skill | Description Format | Safe |
|-------|:------------------:|:----:|
| pdca | `description: \|` (block scalar) | YES |
| bkit-rules | `description: \|` (block scalar) | YES |
| zero-script-qa | `description: \|` (block scalar) | YES |
| phase-6-ui-integration | `description: \|` (block scalar) | YES |
| *... (23 more skills)* | `description: \|` (block scalar) | YES |

**Conclusion**: bkit은 crash 트리거 패턴(YAML array 또는 non-string description)을 사용하지 않으므로 이 버그의 직접적 영향은 없었습니다. 하지만 수정은 향후 SKILL.md 형식 변경 시 안전성을 보장합니다.

### 8.2 Tool Results 50K Threshold (#13) -- HIGH

| Item | Details |
|------|---------|
| Change | Tool results >50K chars persisted to disk (previously 100K threshold) |
| Previous Threshold | 100K characters |
| New Threshold | **50K characters** |
| bkit Impact | **Medium-High** -- bkit의 대용량 skills이 도구 결과를 생성할 수 있음 |

**bkit 대용량 Skill 분석:**

| Skill | File Size | Tool Result Risk | Notes |
|-------|:---------:|:----------------:|-------|
| phase-6-ui-integration | 18,453 bytes | Low | Skill content ≠ tool result; 도구 결과는 실행 출력 |
| zero-script-qa | 17,601 bytes | Low | Docker 로그 분석 결과가 클 수 있으나 50K 미만 |
| phase-8-review | 16,856 bytes | Low | 코드 리뷰 결과가 클 수 있으나 50K 미만 |
| pdca | 16,406 bytes | Low | PDCA 상태/분석 결과는 일반적으로 소규모 |
| phase-2-convention | 15,835 bytes | Low | 컨벤션 규칙 출력 소규모 |

**분석 결론**: 50K → 100K 임계값 변경은 bkit skill의 **파일 크기가 아닌 도구 실행 결과**에 적용됩니다. bkit의 hook scripts는 모두 JSON 출력을 사용하며, 최대 출력 크기는 일반적으로 수 KB입니다. CTO Team 패턴의 8+ agent 병렬 실행 시 대량의 도구 결과가 누적될 수 있으나, 개별 결과가 50K를 초과하지 않으므로 직접적 영향은 미미합니다. 이 변경은 context window 사용량을 줄여 전반적으로 **positive**입니다.

### 8.3 Bulk Agent Kill Fix (#16) -- HIGH

| Item | Details |
|------|---------|
| Change | ctrl+f bulk agent kill sends single aggregate notification instead of per-agent notifications |
| bkit Impact | **High** -- CTO Team 패턴에서 6-8+ agents 동시 종료 시 직접 관련 |
| Before | ctrl+f로 8 agents 종료 시 8개 개별 알림 발생 |
| After | 단일 집계 알림으로 통합 |
| Benefit | CTO Team 정리 시 UI 과부하 및 API 에러 방지 |

bkit의 CTO Team 패턴은 Enterprise level에서 최대 5 teammates + CTO Lead를 동시에 운영합니다. `bkit.config.json`의 team 설정:
```json
{
  "team": {
    "maxTeammates": 5,
    "levelOverrides": {
      "Dynamic": { "maxTeammates": 3 },
      "Enterprise": { "maxTeammates": 5 }
    }
  }
}
```

이 수정은 팀 세션 종료(cleanup) 시 안정성을 직접 향상시킵니다.

### 8.4 Security Fixes Analysis (#8, #9, #10) -- None Impact

| Security Fix | bkit Hook Type | bkit Uses Feature | Impact |
|:------------:|:--------------:|:-----------------:|:------:|
| statusLine/fileSuggestion trust (#8) | N/A | **No** -- bkit hooks don't use statusLine or fileSuggestion | None |
| HTTP hooks env var interpolation (#9) | **command** (not HTTP) | **No** -- all 10 bkit hooks are `"type": "command"` | None |
| HTTP hooks sandbox proxy (#10) | **command** (not HTTP) | **No** -- same as above | None |

**Verification**: `hooks/hooks.json` 파일을 전체 검사한 결과, bkit의 모든 hook entry는 `"type": "command"` 형식을 사용합니다. HTTP 훅은 사용되지 않으며, statusLine이나 fileSuggestion 기능도 사용되지 않습니다. 따라서 3건의 보안 수정은 bkit에 영향이 없으며, Claude Code 전체 생태계의 보안 강화 측면에서 **positive**입니다.

**Hook Type Audit:**

| Hook Event | Handler | Type | statusLine | fileSuggestion |
|------------|---------|:----:|:----------:|:--------------:|
| SessionStart | session-start.js | command | No | No |
| PreToolUse(Write\|Edit) | pre-write.js | command | No | No |
| PreToolUse(Bash) | unified-bash-pre.js | command | No | No |
| PostToolUse(Write) | unified-write-post.js | command | No | No |
| PostToolUse(Bash) | unified-bash-post.js | command | No | No |
| PostToolUse(Skill) | skill-post.js | command | No | No |
| Stop | unified-stop.js | command | No | No |
| UserPromptSubmit | user-prompt-handler.js | command | No | No |
| PreCompact | context-compaction.js | command | No | No |
| TaskCompleted | pdca-task-completed.js | command | No | No |
| SubagentStart | subagent-start-handler.js | command | No | No |
| SubagentStop | subagent-stop-handler.js | command | No | No |
| TeammateIdle | team-idle-handler.js | command | No | No |

### 8.5 BashTool Login Shell Skip (#4) -- MEDIUM

| Item | Details |
|------|---------|
| Change | BashTool now skips login shell (`-l`) by default with shell snapshot available |
| bkit Impact | **Medium** -- bkit hook scripts가 Bash를 통해 실행되는 것은 아님 (node 직접 실행) |
| Analysis | bkit hooks는 모두 `node ${CLAUDE_PLUGIN_ROOT}/scripts/*.js` 형태로 실행 |
| Risk | None -- bkit은 login shell 의존성이 없음 |
| Benefit | Bash 도구 호출 시 시작 시간 단축 (perf improvement) |

bkit의 `unified-bash-pre.js`와 `unified-bash-post.js`는 Bash **도구 호출을 모니터링**하지만, 도구 자체는 아닙니다. login shell 스킵은 사용자가 Bash 도구를 호출할 때의 성능만 영향을 미치며, bkit의 hook 실행과는 무관합니다.

### 8.6 Remote Control (#1) -- MEDIUM

| Item | Details |
|------|---------|
| Change | `claude remote-control` subcommand for external builds, enabling local environment serving |
| bkit Impact | **Medium** -- bkit의 slash commands가 remote-control UI에서 미지원 (#28379) |
| Current Limitation | Slash commands not supported in remote-control UI |
| Risk | 사용자가 remote-control에서 bkit slash commands 사용 시도 시 작동 안 함 |
| Mitigation | 이 제한은 Claude Code 측 이슈이며, bkit 코드 변경 불필요 |

bkit은 27개 skills을 slash commands로 제공합니다 (`/pdca`, `/starter`, `/enterprise` 등). `#28379`에 따르면 remote-control UI에서 slash commands가 지원되지 않으므로, remote-control을 사용하는 bkit 사용자는 자연어로 skill을 호출해야 합니다. bkit의 implicit trigger 시스템(user-prompt-handler.js의 `matchImplicitSkillTrigger()`)이 대안으로 작동합니다.

**Remote Control 공식 문서 요약** (https://code.claude.com/docs/en/remote-control):
- **가용성**: Research Preview -- Pro 및 Max 플랜 (Team/Enterprise 미지원, API 키 미지원)
- **실행**: `claude remote-control` (CLI) 또는 `/remote-control` (별칭 `/rc`, 기존 세션 내)
- **연결**: 세션 URL 또는 QR 코드 → claude.ai/code 또는 Claude 모바일 앱에서 접근
- **보안**: Outbound HTTPS만 사용, 인바운드 포트 개방 없음, TLS 암호화
- **Hook 연동**: `$CLAUDE_CODE_REMOTE="true"` 환경 변수가 원격 환경에서 설정됨
- **설정**: `/config`에서 "Enable Remote Control for all sessions" 옵션으로 상시 활성화 가능
- **제한**: 인스턴스당 1개 원격 세션, 터미널 유지 필요, ~10분 네트워크 장애 시 세션 종료

### 8.7 Plugin Git Timeout Increase (#2) -- MEDIUM

| Item | Details |
|------|---------|
| Change | Plugin marketplace git timeout 30s -> 120s + `CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS` env var |
| bkit Impact | **Medium** -- bkit은 plugin marketplace를 통해 배포됨 |
| Benefit | 느린 네트워크에서 bkit 설치 실패 감소 |
| Related Issue | #28373 (plugin marketplace git clone fails silently on macOS) |

bkit은 `claude plugin install popup-studio-ai/bkit-claude-code` 명령으로 설치됩니다. 기존 30초 타임아웃으로 인해 느린 네트워크 환경에서 설치 실패가 발생할 수 있었으며, 120초로 증가하여 안정성이 개선됩니다. 다만 #28373에서 macOS에서의 silent failure 이슈가 별도로 보고되어 있어 모니터링이 필요합니다.

### 8.8 Worktree First Launch Fix (#18) -- LOW

| Item | Details |
|------|---------|
| Change | Fixed `--worktree` sometimes ignored on first launch |
| bkit Impact | **Low** -- bkit 자체는 `--worktree`를 직접 사용하지 않음 |
| Enhancement Link | ENH-34 (pdca-iterator isolation: "worktree") 구현 시 중요 |
| Current Status | bkit agents 중 `isolation: worktree`를 사용하는 agent 없음 (확인됨) |

16개 bkit agent의 frontmatter를 전체 검사한 결과, `isolation` 또는 `background` 필드를 사용하는 agent는 없습니다. ENH-34에서 pdca-iterator에 `isolation: worktree`를 추가할 계획이므로, 이 수정은 향후 구현에 긍정적입니다.

### 8.9 Windows Stability Fixes (#19, #20, #21, #22, #23) -- LOW

| # | Fix | Platform | bkit Impact |
|---|-----|----------|:----------:|
| 19 | Panic on corrupted value | Windows | Low |
| 20 | Crash spawning many processes | Windows | Low |
| 21 | WASM interpreter crash | Linux x64, Windows x64 | Low |
| 22 | Crash after 2 minutes | Windows ARM64 | Low |
| 23 | BashTool EINVAL | Windows | Low |

bkit은 크로스 플랫폼 지원을 위해 `lib/core/platform.js`를 사용하며, Windows 사용자에게도 제공됩니다. 이 5건의 수정은 Windows 환경에서의 bkit 안정성을 간접적으로 향상시킵니다.

### 8.10 `${CLAUDE_PLUGIN_ROOT}` allowed-tools Fix (#23, v2.1.54) -- HIGH

| Item | Details |
|------|---------|
| Change | Fixed `${CLAUDE_PLUGIN_ROOT}` not being substituted in plugin `allowed-tools` frontmatter |
| bkit Impact | **High** -- bkit은 모든 hook 명령어에서 `${CLAUDE_PLUGIN_ROOT}` 사용 |
| Before Fix | `allowed-tools` 내 `${CLAUDE_PLUGIN_ROOT}` 미치환 → 도구가 불필요하게 승인 요구 |
| After Fix | 정상적으로 치환되어 도구 승인 정확히 작동 |

bkit의 hooks.json에서 모든 hook 명령어가 `${CLAUDE_PLUGIN_ROOT}`를 사용합니다:
```json
"command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/session-start.js"
"command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/pre-write.js"
```

이 수정은 hook 명령어 자체의 `${CLAUDE_PLUGIN_ROOT}` 치환이 아닌, **skill/agent frontmatter의 `allowed-tools` 필드**에서의 치환을 수정한 것입니다. 현재 bkit agent들의 frontmatter에서 `allowed-tools` 사용 여부에 따라 직접적 영향이 결정됩니다. 향후 bkit agent에 `allowed-tools`를 추가할 때 `${CLAUDE_PLUGIN_ROOT}` 경로를 안전하게 사용할 수 있게 되었습니다.

### 8.11 Write Tool umask Fix (#25, v2.1.55) -- MEDIUM

| Item | Details |
|------|---------|
| Change | Write tool이 hardcoded `0o600` 대신 system umask를 존중하도록 수정 |
| bkit Impact | **Medium** -- bkit PDCA 문서, 설정 파일 생성에 직접 영향 |
| Before Fix | 모든 Write tool 생성 파일이 `0o600` (owner read/write only) |
| After Fix | System umask 적용 (일반적으로 `0o644` - group/other read 허용) |

**bkit에서 Write tool 사용 패턴:**
- PDCA Plan 문서 (`docs/01-plan/`) → 이제 적절한 권한
- PDCA Design 문서 (`docs/02-design/`) → 이제 적절한 권한
- PDCA Analysis 문서 (`docs/03-analysis/`) → 이제 적절한 권한
- PDCA Report 문서 (`docs/04-report/`) → 이제 적절한 권한
- `.bkit-memory.json` 상태 파일 → 이제 적절한 권한
- bkit.config.json 수정 → Edit tool 사용 (영향 없음)

이 수정은 특히 **팀 환경**에서 중요합니다. `0o600`으로 생성된 PDCA 문서는 같은 팀의 다른 사용자가 읽을 수 없었으나, 이제 umask에 따라 적절한 공유 권한이 설정됩니다.

---

## 9. Compatibility Verification

### 9.1 Component Compatibility Matrix

| Component | Count | Changes in v2.1.51~55 | Status |
|-----------|:-----:|:-----:|:------:|
| Skills | **27** | YAML crash fix (safety net) | **PASS** |
| Agents | **16** | Bulk kill fix (positive) | **PASS** |
| Hook Events | **10** (of 17) | Security fixes (N/A - command type) | **PASS** |
| Library Exports | **180** | No changes | **PASS** |
| plugin.json | 1 | Git timeout improvement | **PASS** |
| bkit.config.json | 1 | No changes | **PASS** |
| Output Styles | 4 | No changes | **PASS** |
| Templates | 28 | No changes | **PASS** |
| Agent Memory | 14 project + 2 user | No changes | **PASS** |
| State Management | .bkit-memory.json | No changes | **PASS** |
| Permission System | permission-manager.js | No changes | **PASS** |
| Plugin System | marketplace delivery | Git timeout improved | **PASS** |

### 9.2 Hook System Compatibility

| Hook Event | Handler | Security Change Impact | Status |
|------------|---------|:-----:|:------:|
| SessionStart | session-start.js | None (command type) | **PASS** |
| PreToolUse(Write\|Edit) | pre-write.js | None (command type) | **PASS** |
| PreToolUse(Bash) | unified-bash-pre.js | None (command type) | **PASS** |
| PostToolUse(Write) | unified-write-post.js | None (command type) | **PASS** |
| PostToolUse(Bash) | unified-bash-post.js | None (command type) | **PASS** |
| PostToolUse(Skill) | skill-post.js | None (command type) | **PASS** |
| Stop | unified-stop.js | None (command type) | **PASS** |
| UserPromptSubmit | user-prompt-handler.js | None (command type) | **PASS** |
| PreCompact | context-compaction.js | None (command type) | **PASS** |
| TaskCompleted | pdca-task-completed.js | None (command type) | **PASS** |
| SubagentStart | subagent-start-handler.js | None (command type) | **PASS** |
| SubagentStop | subagent-stop-handler.js | None (command type) | **PASS** |
| TeammateIdle | team-idle-handler.js | None (command type) | **PASS** |

**Final Verdict**: **PASS** -- Fully Compatible (v2.1.55 ready for immediate use)

---

## 10. Cumulative Compatibility Summary v2.1.34 ~ v2.1.55

| Version | Release Date | Major Changes | bkit Impact | Compat |
|---------|:----------:|---------------|:---------:|:------:|
| v2.1.34 | 2026-02-06 | Agent Teams crash fix, sandbox security | None | PASS |
| v2.1.35 | (Unpublished) | SKIPPED | N/A | N/A |
| v2.1.36 | 2026-02-07 | Fast Mode (/fast) added | None | PASS |
| v2.1.37 | 2026-02-07 | Fast Mode bug fix | None | PASS |
| v2.1.38 | 2026-02-10 | Bash permission, heredoc security | Low+ (positive) | PASS |
| v2.1.39 | 2026-02-10 | Skill evolution agent (+293 tks) | Low (neutral) | PASS |
| v2.1.40 | 2026-02-12 | Skill evolution rollback (-293 tks) | Medium (positive) | PASS |
| v2.1.41 | 2026-02-13 | Auth CLI, hook stderr, Agent Teams | Medium (positive) | PASS |
| v2.1.42 | 2026-02-13 | Output token refactoring, plugin cache | Low (neutral) | PASS |
| v2.1.43 | (Skipped) | AWS auth, agent markdown warning | None | PASS |
| v2.1.44 | 2026-02-16 | Auth refresh hotfix | None | PASS |
| v2.1.45 | 2026-02-17 | Sonnet 4.6, hot reload, Agent Teams fixes | Medium (positive) | PASS |
| v2.1.46 | (Skipped) | MCP connector, orphan process | Low | PASS |
| v2.1.47 | 2026-02-18 | 70 changes: memory, agents, skills, hooks | Medium (positive) | PASS |
| v2.1.48 | (Skipped) | npm published, no CHANGELOG | Unknown | PASS |
| v2.1.49 | 2026-02-20 | 23 changes: worktree, ConfigChange, background | Medium (positive) | PASS |
| v2.1.50 | 2026-02-21 | 25 changes: 9 memory fixes, WorktreeCreate/Remove, 1M ctx | High (positive) | PASS |
| v2.1.51 | 2026-02-24 | **13 changes: remote-control, 3 security, YAML crash fix** | **Medium (positive)** | **PASS** |
| v2.1.52 | 2026-02-24 | VS Code crash fix (Windows) | None | PASS |
| v2.1.53 | 2026-02-25 | **8 changes: bulk agent kill fix, worktree fix, Windows crash fixes** | **Medium (positive)** | **PASS** |
| v2.1.54 | 2026-02-25 | **`${CLAUDE_PLUGIN_ROOT}` allowed-tools fix** | **High (positive)** | **PASS** |
| **v2.1.55** | **2026-02-25** | **BashTool EINVAL fix + Write tool umask fix** | **Medium** | **PASS** |

**Cumulative Record: v2.1.34 ~ v2.1.55 = 22 releases, 0 compatibility issues, 100% backward compatible**

---

## 11. GitHub Issue Monitoring Status

### 11.1 Previously Monitored Issues

| Issue | Title | Status | v2.1.51~v2.1.55 Resolution |
|:-----:|-------|:------:|:------------------:|
| **#25131** | Agent Teams: Catastrophic lifecycle failures | **OPEN** | No new resolution. v2.1.50 memory fixes still applicable |
| **#24130** | Auto memory file concurrent safety | **OPEN** | No resolution |
| **#26474** | UserPromptSubmit agent hook failure | **OPEN** | No resolution |
| **#17688** | Skill-scoped hooks not triggering inside plugins | **OPEN** | No resolution |
| **#27281** | Agent stuck in infinite loop (v2.1.50) | **OPEN** | No resolution |
| **#27280** | Help dialog truncates custom commands | **OPEN** | No resolution |
| **#27045** | macOS 26.3 arm64 Homebrew hang | **OPEN** | No resolution |
| **#28384** | Bash tool EINVAL on Windows | **CLOSED** | **Fixed in v2.1.55** |

### 11.2 Newly Identified Issues to Monitor

| Issue | Title | Version | bkit Relevance |
|:-----:|-------|:-------:|:---------:|
| **#28384** | Bash tool EINVAL on Windows (regression v2.1.45+) | v2.1.55 (Fixed) | **Medium** -- Windows bkit 사용자 직접 영향, 수정됨 |
| **#28382** | Bash tool EINVAL on Windows with long temp directory name | OPEN | **Low** -- 특정 경로 길이 조건 |
| **#28379** | Slash commands not supported in /remote-control UI | OPEN | **High** -- bkit 27 skills 모두 slash command 기반 |
| **#28376** | Write/Edit tools replace symlinks with regular files | OPEN | **Low** -- bkit이 symlink를 직접 관리하지 않음 |
| **#28375** | VSCode extension v2.1.53 (win32-x64) fails to activate | OPEN | None -- VS Code extension 한정 |
| **#28373** | Plugin marketplace: internal git clone fails silently on macOS | OPEN | **High** -- bkit 설치에 직접 영향 가능 |
| **#28372** | [DOCS] Hooks: stability warning for many parallel hooks on same matcher | OPEN | **Medium** -- bkit PreToolUse에 2개 matcher 사용 |
| **#28363** | WorktreeRemove hook not invoked for subagent worktrees | OPEN | **Low** -- bkit 현재 WorktreeRemove 미사용 (ENH-39) |
| **#28361** | remote-control: child process spawn missing cli.js script path | OPEN | **Low** -- remote-control 관련 |

### 11.3 Issue Risk Assessment

| Issue | Probability | Impact on bkit | Recommended Action |
|:-----:|:----------:|:--------------:|:------------------:|
| **#28379** | High | High (slash commands in remote-control) | Monitor + document limitation |
| **#28373** | Medium | High (bkit installation failure) | Monitor, test macOS installation |
| **#28372** | Low | Medium (parallel hooks stability) | Monitor, bkit PreToolUse has 2 matchers |
| #28382 | Low | Low (Windows long path) | Monitor |
| #28376 | Low | Low (symlink replacement) | Monitor |
| #28363 | Low | Low (WorktreeRemove for subagents) | Monitor for ENH-39 |
| #28361 | Low | Low (remote-control child process) | Monitor |
| #25131 | Medium | High (Agent Teams stability) | Monitor, existing issue |
| #26474 | Low | High (UserPromptSubmit) | Monitor, existing issue |
| #27281 | Low | Medium (agent infinite loop) | Monitor, existing issue |

### 11.4 Parallel Hooks Stability Warning (#28372) -- Special Analysis

bkit의 hooks.json에서 동일 이벤트에 여러 matcher를 사용하는 패턴:

| Event | Matchers | Hooks Count |
|-------|----------|:-----------:|
| PreToolUse | `Write\|Edit`, `Bash` | 2 entries |
| PostToolUse | `Write`, `Bash`, `Skill` | 3 entries |
| SessionStart | (no matcher, once: true) | 1 entry |
| Stop | (no matcher) | 1 entry |
| All others | (no matcher) | 1 entry each |

**분석**: `#28372`에서 경고하는 "many parallel hooks on the same matcher"는 **동일한 matcher에 여러 hooks가 병렬 실행되는 경우**를 의미합니다. bkit은 각 matcher에 **단일 hook만 등록**하므로 (예: `PreToolUse "Bash"`에 `unified-bash-pre.js` 하나만), 이 이슈의 직접적 영향은 없습니다. 다만 다른 플러그인이나 사용자 설정에서 동일 matcher에 추가 hooks를 등록하면 경합이 발생할 수 있어, 향후 문서화 권장.

---

## 12. Enhancement Opportunities

### 12.1 New Enhancement Opportunities (v2.1.51 ~ v2.1.55)

| Priority | ENH | Item | Difficulty | Impact | Version |
|:--------:|-----|------|:----------:|:------:|:-------:|
| **High** | ENH-42 | Remote-control integration documentation | Low | Medium | v2.1.51 |
| **High** | ENH-47 | Agent `allowed-tools` with `${CLAUDE_PLUGIN_ROOT}` activation | Medium | High | v2.1.54 |
| Medium | ENH-43 | Plugin git timeout ENV documentation | Low | Low | v2.1.51 |
| Medium | ENH-44 | SDK env vars integration (ACCOUNT_UUID, USER_EMAIL) | Medium | Medium | v2.1.51 |
| Low | ENH-45 | Windows EINVAL recovery documentation | Low | Low | v2.1.55 |
| Low | ENH-46 | BashTool login shell skip awareness | Low | Low | v2.1.51 |

### 12.2 ENH-42: Remote-Control Integration Documentation (High)

| Item | Details |
|------|---------|
| Feature | Document bkit behavior in `claude remote-control` mode |
| Current State | bkit slash commands not supported in remote-control UI (#28379) |
| Opportunity | Document natural language alternatives for all 27 slash commands |
| Implementation | Add "Remote Control Compatibility" section to README or docs |
| Use Cases | 1) 외부 빌드 시스템에서 bkit 사용, 2) CI/CD에서 PDCA 자동화 |
| Risk | Low -- documentation only |
| Priority | High -- remote-control 사용자 증가 시 bkit 접근성 보장 |

**참고**: bkit의 implicit trigger 시스템(`user-prompt-handler.js`의 `matchImplicitSkillTrigger()`와 `matchImplicitAgentTrigger()`)이 자연어 기반 skill/agent 호출을 지원하므로, slash commands 없이도 대부분의 기능 접근이 가능합니다. 그러나 이 동작은 문서화가 필요합니다.

### 12.3 ENH-43: Plugin Git Timeout ENV Documentation (Medium)

| Item | Details |
|------|---------|
| Feature | `CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS` env var for bkit installation |
| Current State | 기본값 120초로 증가됨, 대부분 충분 |
| Opportunity | 느린 네트워크 환경에서 사용자 가이드 (env var로 추가 확장 가능) |
| Implementation | README의 설치 가이드에 timeout 관련 트러블슈팅 추가 |
| Risk | Low -- documentation only |

### 12.4 ENH-44: SDK Env Vars Integration (Medium)

| Item | Details |
|------|---------|
| Feature | `CLAUDE_CODE_ACCOUNT_UUID`, `CLAUDE_CODE_USER_EMAIL`, `CLAUDE_CODE_ORGANIZATION_UUID` |
| Current State | bkit hooks/scripts에서 이 env vars를 사용하지 않음 |
| Opportunity | 엔터프라이즈 환경에서 사용자/조직별 PDCA 추적 |
| Implementation | `session-start.js`에서 env vars 읽어 .bkit-memory.json에 기록 |
| Risk | Low -- additive, 읽기 전용 |
| Priority | Medium -- 엔터프라이즈 고객에게 유용 |

### 12.5 ENH-47: Agent `allowed-tools` with `${CLAUDE_PLUGIN_ROOT}` (High)

| Item | Details |
|------|---------|
| Feature | v2.1.54의 `${CLAUDE_PLUGIN_ROOT}` allowed-tools 수정으로 가능해진 기능 |
| Current State | bkit 16개 agents는 `allowed-tools` frontmatter를 사용하지 않음 |
| Opportunity | agent별 허용 도구 목록에 `${CLAUDE_PLUGIN_ROOT}` 기반 경로를 안전하게 사용 가능 |
| Implementation | agent frontmatter에 `allowed-tools: ["Bash(node ${CLAUDE_PLUGIN_ROOT}/*)", ...]` 추가 |
| Benefit | agent별 세분화된 권한 관리, 불필요한 도구 승인 프롬프트 제거 |
| Risk | Low -- additive, 기존 동작에 영향 없음 |
| Priority | High -- 보안 + UX 개선에 직접 기여 |

### 12.6 Existing Enhancement Status

| ENH | Item | Status | Still Valid |
|-----|------|:------:|:----------:|
| ENH-20 | `.bkit-memory.json` atomic writes | Not Started | Yes (#24130 still open) |
| ENH-21 | Agent Teams safeguards | Not Started | Yes (#25131 still open) |
| ENH-22 | session_name PDCA tracking | Not Started | Yes |
| ENH-23 | Conditional Explore delegation | Not Started | Yes |
| ENH-24 | PLUGIN_CACHE_DIR compatibility | Not Started | Yes |
| ENH-25 | Output token documentation | Not Started | Low priority |
| ENH-26 | `last_assistant_message` hook field | Not Started | Yes |
| ENH-27 | System prompt +35K token monitoring | Not Started | Yes |
| ENH-28 | Sonnet 4.6 model evaluation | Not Started | Yes |
| ENH-29 | `spinnerTipsOverride` for bkit UX | Not Started | Yes |
| ENH-30 | Windows hooks compatibility docs | Not Started | Yes (5 Windows fixes help) |
| ENH-31 | Git worktree compatibility docs | Not Started | Merged with ENH-37 |
| ENH-32 | ConfigChange hook implementation | Not Started | Yes |
| ENH-33 | Plugin settings.json for bkit defaults | Not Started | Yes |
| ENH-34 | pdca-iterator isolation: "worktree" | Not Started | Yes (#18 worktree fix helps) |
| ENH-35 | Agent background: true for qa-monitor | Not Started | Yes |
| ENH-36 | SessionEnd hook for cleanup | Not Started | Yes |
| ENH-37 | Worktree documentation | Not Started | Yes |
| ENH-38 | PostToolUseFailure hook for error logging | Not Started | Yes |
| ENH-39 | WorktreeCreate/Remove hooks | Not Started | Yes (#28363 partially limits) |
| ENH-40 | `claude agents` CLI integration docs | Not Started | Yes |
| ENH-41 | DISABLE_1M_CONTEXT compatibility docs | Not Started | Low priority |

---

## 13. Security Assessment

### 13.1 v2.1.51 Security Fixes Impact on bkit

| Fix | Threat Addressed | bkit Exposure | Assessment |
|-----|:----------------:|:-------------:|:---------:|
| statusLine/fileSuggestion trust (#8) | Untrusted workspace code execution | **None** -- bkit does not use statusLine or fileSuggestion | No action needed |
| HTTP env var interpolation (#9) | Environment variable leakage | **None** -- bkit uses only command-type hooks | No action needed |
| HTTP sandbox proxy (#10) | Network access from hooks | **None** -- bkit uses only command-type hooks | No action needed |

### 13.2 Positive Security Implications

1. **Ecosystem hardening**: 3건의 보안 수정으로 Claude Code hook 시스템 전체의 보안 수준이 향상
2. **HTTP hooks 격리**: HTTP 훅의 env var 접근과 네트워크 접근이 제한되어, 향후 bkit이 HTTP 훅을 도입할 경우에도 안전한 기반 확보
3. **Workspace trust**: statusLine/fileSuggestion의 trust 요구사항이 강화되어, 악의적 플러그인으로부터의 보호 강화

### 13.3 bkit Hook Security Posture

| Aspect | Status | Notes |
|--------|:------:|-------|
| All hooks command-type | **Secure** | HTTP hooks의 보안 이슈 적용 대상 아님 |
| No statusLine usage | **Secure** | Trust bypass 취약점 비해당 |
| No fileSuggestion usage | **Secure** | Trust bypass 취약점 비해당 |
| No env var interpolation in hooks | **Secure** | `CLAUDE_PLUGIN_ROOT` 만 사용 (command 문자열 내) |
| Timeout on all hooks | **Secure** | 3000ms ~ 10000ms (합리적 범위) |

---

## 14. Performance Assessment

### 14.1 Tool Results Disk Persistence Threshold Change

| Metric | Before v2.1.51 | After v2.1.51 | Impact |
|--------|:--------------:|:-------------:|:------:|
| Threshold | 100K chars | **50K chars** | Context window 사용량 감소 |
| bkit hook output size | < 5K chars (typical) | < 5K chars | None |
| Large skill execution results | Variable | Variable | Low (most under 50K) |
| CTO Team aggregate results | Variable | Variable | **Medium** -- 8+ agent 결과 누적 시 개선 |

### 14.2 BashTool Login Shell Skip

| Metric | Before v2.1.51 | After v2.1.51 | Impact |
|--------|:--------------:|:-------------:|:------:|
| Shell startup | Login shell (`-l`) loaded | No login shell by default | Faster Bash tool execution |
| bkit hooks execution | N/A (node process, not bash) | N/A | None |
| User Bash commands | ~100-500ms slower (login profile) | ~100-500ms faster | Positive |

### 14.3 Windows Crash Fixes Performance Impact

v2.1.53과 v2.1.55의 Windows crash 수정은 직접적 성능 영향은 없지만, crash 방지로 인한 세션 안정성 향상은 긴 PDCA 세션의 생산성을 간접적으로 개선합니다.

---

## 15. Hook Events Complete Reference (v2.1.55)

v2.1.55 기준 Claude Code가 지원하는 전체 Hook Events:

| # | Event | Can Block | bkit Status | Notes |
|---|-------|:---------:|:-----------:|-------|
| 1 | `SessionStart` | No | **사용 중** | session-start.js (once: true) |
| 2 | `UserPromptSubmit` | Yes | **사용 중** | user-prompt-handler.js |
| 3 | `PreToolUse` | Yes | **사용 중** | pre-write.js, unified-bash-pre.js |
| 4 | `PermissionRequest` | Yes | 미사용 | Permission 대화 자동 처리 가능 |
| 5 | `PostToolUse` | No | **사용 중** | write-post, bash-post, skill-post |
| 6 | `PostToolUseFailure` | No | 미사용 | 도구 실패 로깅 가능 (ENH-38) |
| 7 | `Notification` | No | 미사용 | 알림 커스터마이징 가능 |
| 8 | `SubagentStart` | No | **사용 중** | subagent-start-handler.js |
| 9 | `SubagentStop` | Yes | **사용 중** | subagent-stop-handler.js |
| 10 | `Stop` | Yes | **사용 중** | unified-stop.js |
| 11 | `TeammateIdle` | Yes | **사용 중** | team-idle-handler.js |
| 12 | `TaskCompleted` | Yes | **사용 중** | pdca-task-completed.js |
| 13 | `ConfigChange` | Yes* | 미사용 | NEW v2.1.49 (ENH-32) |
| 14 | `PreCompact` | No | **사용 중** | context-compaction.js |
| 15 | `SessionEnd` | No | 미사용 | 세션 종료 정리 가능 (ENH-36) |
| 16 | `WorktreeCreate` | TBD | 미사용 | NEW v2.1.50 (ENH-39) |
| 17 | `WorktreeRemove` | TBD | 미사용 | NEW v2.1.50, #28363 (subagent worktrees) |

*ConfigChange: policy_settings 변경은 차단 불가

**현재**: 10/17 events 사용 (58.8%)
**권장**: 13/17 events (ConfigChange + WorktreeCreate/Remove 추가) -> 76.5%
**v2.1.51~55 신규 hook events**: 0개 (v2.1.51의 보안 수정은 기존 hooks 강화)

---

## 16. Risk Assessment

### 16.1 Technical Risks

| Risk | Probability | Impact | Response |
|------|:----------:|:------:|----------|
| v2.1.51~55 compatibility issues | **Very Low** | Low | All 23 items backward compatible |
| Slash commands in remote-control (#28379) | **Medium** | Medium | Document natural language alternatives |
| Plugin marketplace git clone on macOS (#28373) | **Medium** | High | Monitor, test macOS installations |
| Parallel hooks stability (#28372) | **Low** | Low | bkit uses single hook per matcher |
| WorktreeRemove for subagents (#28363) | **Low** | Low | ENH-39 구현 시 검토 필요 |
| BashTool login shell skip side effects | **Very Low** | Low | bkit hooks are node processes |
| Windows EINVAL regression (#28382) | **Low** | Low | Long path specific, v2.1.55 fixes main case |
| symlink replacement (#28376) | **Very Low** | Low | bkit does not manage symlinks |

### 16.2 No Immediate Action Required

모든 v2.1.51~v2.1.55 변경사항은 backward compatible이며, bkit v1.5.5의 기존 기능에 영향을 미치지 않습니다. 3건의 보안 수정은 bkit에 해당하지 않는 hook 유형(HTTP, statusLine, fileSuggestion)에 관한 것이므로 코드 변경이 불필요합니다.

**주의 사항**:
1. `claude remote-control` 사용 시 bkit slash commands 미지원 -- 자연어 trigger 시스템 활용 안내 필요
2. macOS에서 plugin marketplace git clone 실패 가능성 (#28373) -- 설치 트러블슈팅 가이드 권장
3. `#28372` parallel hooks 안정성 경고 -- bkit은 matcher당 단일 hook이므로 현재 안전, 향후 확장 시 주의

---

## 17. Behavioral Changes Summary

Changes that don't break compatibility but alter user experience:

| Change | Before | After | User Impact |
|--------|--------|-------|:-----------:|
| `claude remote-control` | Not available | External build integration | Low (new feature) |
| Plugin git timeout | 30 seconds | 120 seconds + env var | Positive (fewer timeouts) |
| BashTool login shell | Always used `-l` flag | Skips `-l` by default | Low (faster startup) |
| `/model` picker | Raw model IDs | Human-readable labels | Positive (UX) |
| Managed settings | Config file only | + macOS plist / Windows Registry | Low (enterprise) |
| Tool results threshold | 100K chars -> disk | **50K chars** -> disk | Positive (context savings) |
| Bulk agent kill | Per-agent notifications | Single aggregate notification | **Positive** (CTO Team) |
| YAML skill description | Crash on array/non-string | Graceful handling | Positive (safety net) |

---

## 18. Comparison with Previous Analyses

| Metric | v2.1.34~v2.1.37 | v2.1.42~v2.1.47 | v2.1.48~v2.1.50 | v2.1.51~v2.1.55 |
|--------|:----:|:----:|:----:|:----:|
| Versions Covered | 4 | 5 | 3 | **5** |
| Total Changes | ~15 | 91 | 48 | **25** |
| New Features | 2 | 11 | 17 | **7** |
| Security Fixes | 0 | 0 | 0 | **3** |
| Bug Fixes | 8 | 73 | 23 | **14** |
| Performance | 2 | 7 | 8 | **1** |
| Breaking Changes | 0 | 0 | 0 | **0** |
| bkit High Impact | 0 | 5 | 8 | **4** |
| Enhancement Opportunities | 0 | 6 | 10 | **6** |
| Memory Leak Fixes | 0 | 3 | 12 | **0** |
| System Prompt Change | 0 | +34,752 tks | +300~500 tks | ~0 tks |
| Analysis Method | Impact + 10 TC | 3 agents + CTO | 8 agents + CTO | **6 agents + CTO** |

**Release Character**:
- v2.1.47: "기능 폭발" (70 changes, Magic Docs/Data +34K tokens)
- v2.1.49: "인프라 강화" (worktree isolation, ConfigChange hook, background agents)
- v2.1.50: "메모리 안정화" (9 memory leak fixes, Worktree hooks, Opus 1M context)
- v2.1.51: **"보안 + 생태계"** (3 security fixes, remote-control, plugin ecosystem improvements)
- v2.1.53: **"안정성 강화"** (8 crash/hang fixes, Windows focus)

---

## 19. CLI Binary & System Prompt Analysis

### 19.1 CLI Binary Size

| Metric | v2.1.50 | v2.1.55 | Delta |
|--------|:-------:|:-------:|:-----:|
| Binary size | ~178MB (est.) | **186,526,736 bytes (~178MB)** | Minimal change |
| Symlink | ~/.local/share/claude/versions/2.1.55 | Confirmed | -- |

### 19.2 System Prompt Token Change (Estimated)

| Component | Estimate |
|-----------|:--------:|
| remote-control documentation | +50~100 tokens |
| Security hardening notes | +20~50 tokens |
| Human-readable model labels | +10~20 tokens |
| **Total estimated delta** | **+80~170 tokens** |

v2.1.47에서 +34,752 토큰의 대규모 증가(Magic Docs/Data) 이후, v2.1.49에서 +300~500 토큰, v2.1.51~55에서 +80~170 토큰으로 안정적입니다.

---

## 20. Agent Frontmatter Analysis (v2.1.55 Context)

### 20.1 Current Agent Configuration

| Agent | Model | Memory Scope | isolation | background |
|-------|:-----:|:------------:|:---------:|:----------:|
| bkend-expert | sonnet | project | -- | -- |
| code-analyzer | opus | project | -- | -- |
| cto-lead | opus | project | -- | -- |
| design-validator | opus | project | -- | -- |
| enterprise-expert | opus | project | -- | -- |
| frontend-architect | sonnet | project | -- | -- |
| gap-detector | opus | project | -- | -- |
| infra-architect | opus | project | -- | -- |
| pdca-iterator | sonnet | project | -- | -- |
| pipeline-guide | sonnet | user | -- | -- |
| product-manager | sonnet | project | -- | -- |
| qa-monitor | haiku | project | -- | -- |
| qa-strategist | sonnet | project | -- | -- |
| report-generator | haiku | project | -- | -- |
| security-architect | opus | project | -- | -- |
| starter-guide | sonnet | user | -- | -- |

**Summary**: 7 opus / 7 sonnet / 2 haiku. 14 project scope / 2 user scope. 0 agents use `isolation` or `background` frontmatter fields.

### 20.2 v2.1.53 Bulk Agent Kill Impact on CTO Team

CTO Team 패턴에서 사용하는 agent 조합:

| Level | Teammates | Max Agents Running |
|-------|:---------:|:------------------:|
| Dynamic | developer, frontend, qa | 3 + CTO = 4 |
| Enterprise | architect, developer, qa, reviewer, security | 5 + CTO = 6 |

v2.1.53의 bulk agent kill 수정(#16)은 최대 6개 agent가 동시에 종료될 때 단일 집계 알림으로 통합되어, CTO Team 정리 시 안정성이 향상됩니다.

---

## 21. Skill Size & YAML Compatibility Analysis

### 21.1 대용량 스킬 식별 (>15KB)

| Skill | File Size | YAML Format | Crash Risk |
|-------|:---------:|:-----------:|:----------:|
| phase-6-ui-integration | 18,453 bytes | `description: \|` | **Safe** |
| zero-script-qa | 17,601 bytes | `description: \|` | **Safe** |
| phase-8-review | 16,856 bytes | `description: \|` | **Safe** |
| pdca | 16,406 bytes | `description: \|` | **Safe** |
| phase-2-convention | 15,835 bytes | `description: \|` | **Safe** |

### 21.2 YAML Description Format Audit (All 27 Skills)

All 27 bkit skills use `description: |` (YAML block scalar) format, which is a string type. None use YAML array format (`description: [...]`) or other non-string formats. The v2.1.51 crash fix (#12) provides a safety net but does not resolve an existing bkit issue.

---

## 22. Conclusion

### 22.1 Key Findings

1. **완벽한 호환성**: v2.1.34 ~ v2.1.55 = **22개 연속 릴리스, 0건 Breaking Changes**. bkit v1.5.5는 v2.1.55와 완전 호환.

2. **보안 강화 릴리스**: v2.1.51에서 **3건의 보안 수정**(statusLine/fileSuggestion trust, HTTP hooks env var interpolation, HTTP hooks sandbox proxy). bkit은 command-type hooks만 사용하므로 **직접 영향 없음**, 생태계 전체 보안 수준 향상으로 **positive**.

3. **4건의 High Impact 항목**: YAML skill crash fix (safety net), tool results 50K threshold (context savings), bulk agent kill fix (CTO Team), `${CLAUDE_PLUGIN_ROOT}` allowed-tools fix (plugin 권한) -- 모두 positive direction.

4. **6건의 Enhancement 기회**: remote-control 통합 문서(ENH-42), `${CLAUDE_PLUGIN_ROOT}` allowed-tools 활용(ENH-47), plugin git timeout 가이드(ENH-43), SDK env vars 통합(ENH-44) 등 bkit 기능을 확장할 수 있는 기회.

5. **Write tool umask 수정**: v2.1.55에서 hardcoded `0o600` → system umask 존중으로 변경. bkit PDCA 문서가 팀 환경에서 적절한 권한으로 생성됨.

6. **Windows 안정성 대폭 개선**: v2.1.53에서 4건, v2.1.55에서 1건의 Windows crash/hang 수정. Windows에서의 bkit 사용 안정성 간접 향상.

7. **Plugin 생태계 개선**: git timeout 120초 확장, npm custom registry 지원으로 bkit 설치/업데이트 안정성 향상. 다만 #28373 (macOS git clone silent failure) 주의 필요.

8. **Remote Control 제한**: `claude remote-control` 신규 기능에서 slash commands 미지원(#28379). bkit의 implicit trigger 시스템이 대안으로 작동하나, 문서화 필요.

9. **System Prompt 안정**: v2.1.47 이후 system prompt 크기가 안정적으로 유지. v2.1.51~55에서 +80~170 토큰 추정.

10. **Hook Events 변화 없음**: v2.1.51~55에서 신규 hook event 추가 없음. 총 17개 hook events 중 bkit은 10개 사용 (58.8%), 권장 13개 (76.5%).

11. **v2.1.54~55 Hotfix 패턴**: v2.1.53 -> v2.1.54 (plugin fix) -> v2.1.55 (bash+write fix) 빠른 hotfix 사이클은 Anthropic의 빠른 회귀 대응 능력을 보여줌.

### 22.2 Recommended Next Actions

| Priority | Action | ENH | Effort |
|:--------:|--------|-----|:------:|
| 1 | Remote-control 호환성 문서 작성 | ENH-42 | Low |
| 2 | macOS plugin 설치 트러블슈팅 가이드 (#28373) | - | Low |
| 3 | SDK env vars (ACCOUNT/EMAIL/ORG) 통합 | ENH-44 | Medium |
| 4 | Plugin git timeout 가이드 | ENH-43 | Low |
| 5 | #28379 (slash commands in remote-control) 모니터링 | - | - |
| 6 | #28372 (parallel hooks stability) 모니터링 | - | - |

### 22.3 Existing High Priority ENH Items (Carryover)

다음 기존 ENH 항목은 여전히 유효하며 High priority:

| ENH | Item | Version | Status |
|-----|------|:-------:|:------:|
| ENH-32 | ConfigChange hook implementation | v2.1.49 | Not Started |
| ENH-33 | Plugin settings.json for bkit defaults | v2.1.49 | Not Started |
| ENH-34 | pdca-iterator isolation: "worktree" | v2.1.49 | Not Started (v2.1.53 #18 worktree fix helps) |
| ENH-39 | WorktreeCreate/Remove hooks | v2.1.50 | Not Started (#28363 partial limitation) |

### 22.4 Version Upgrade Recommendation

| Item | Recommendation |
|------|:------:|
| Upgrade to v2.1.55 | **즉시 가능 (권장)** |
| Code changes required | **없음** |
| Enhancement implementation | **선택적** (6건 신규, 총 28건 누적) |
| Risk level | **Very Low** |
| Key benefit | **보안 강화** + **Windows 안정성** + **Plugin 생태계 개선** + **CTO Team bulk kill fix** + **Write umask 정상화** |

---

## Appendix A: Team Composition

| Agent | Role | Model | Task | Status |
|-------|------|:-----:|------|:------:|
| CTO Lead | Overall coordination & report | opus | Orchestration | **Completed** |
| code-analyzer | Source code deep scan (hooks, lib, skills) | opus | Hook/lib analysis | **Completed** |
| security-architect | 3 security fixes impact assessment | opus | Security audit | **Completed** |
| gap-detector | Enhancement opportunities identification | opus | Gap analysis | **Completed** |
| qa-strategist | Compatibility verification strategy | sonnet | Test strategy | **Completed** |
| explore-hooks | Deep scan of scripts/*.js | sonnet | Hook scripts scan | **Completed** |
| explore-lib | Deep scan of lib/**/*.js | sonnet | Library scan | **Completed** |

## Appendix B: Files Analyzed

### Hook Scripts (45 files)
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/hooks/hooks.json` -- Hook configuration (13 entries, all command-type)
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/hooks/session-start.js` -- SessionStart handler
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/scripts/unified-bash-pre.js` -- Bash PreToolUse handler
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/scripts/unified-bash-post.js` -- Bash PostToolUse handler
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/scripts/pre-write.js` -- Write/Edit PreToolUse handler
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/scripts/unified-stop.js` -- Stop handler (10 skill + 6 agent dispatchers)
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/scripts/skill-post.js` -- Skill PostToolUse handler
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/scripts/user-prompt-handler.js` -- UserPromptSubmit handler
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/scripts/context-compaction.js` -- PreCompact handler
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/scripts/subagent-start-handler.js` -- SubagentStart handler
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/scripts/subagent-stop-handler.js` -- SubagentStop handler
- (+ 34 more dispatched handlers)

### Configuration Files
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/.claude-plugin/plugin.json` -- Plugin manifest (outputStyles declared)
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/bkit.config.json` -- bkit configuration (229 lines)

### Agent Definitions (16 files)
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/agents/*.md` -- All 16 agent frontmatter inspected

### Skill Definitions (27 files)
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/skills/*/SKILL.md` -- All 27 SKILL.md description formats verified

### Library (38 files)
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/lib/common.js` -- 180 exports bridge
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/lib/core/*.js` -- Core modules (cache, config, debug, file, io, platform)
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/lib/pdca/*.js` -- PDCA modules (automation, level, phase, status, tier)
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/lib/team/*.js` -- Team modules (communication, coordinator, cto-logic, hooks, orchestrator, state-writer, strategy, task-queue)
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/lib/intent/*.js` -- Intent modules (ambiguity, language, trigger)
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/lib/task/*.js` -- Task modules (classification, context, creator, tracker)
